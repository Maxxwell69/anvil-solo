import express from 'express';
import crypto from 'crypto';
import { getDatabase } from '../database/postgres-init.js';
import Joi from 'joi';

const router = express.Router();

// Test endpoint - check if license server is reachable
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'License server is online',
    timestamp: new Date().toISOString()
  });
});

// Validation schemas
const activateSchema = Joi.object({
  licenseKey: Joi.string().required(),
  hardwareId: Joi.string().required(),
  email: Joi.string().email().optional()
});

const validateSchema = Joi.object({
  licenseKey: Joi.string().required(),
  hardwareId: Joi.string().required()
});

/**
 * Activate a license
 * POST /api/license/activate
 */
router.post('/activate', async (req, res) => {
  try {
    const validationResult = activateSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({ error: validationResult.error.details[0].message });
    }
    
    const licenseKey = req.body.licenseKey;
    const hardwareId = req.body.hardwareId;
    const email = req.body.email;
    
    const sql = getDatabase();
    
    // Check if license exists
    const query1 = 'SELECT * FROM licenses WHERE license_key = $1';
    const licenses = await sql.unsafe(query1, [licenseKey]);
    const license = licenses[0];
    
    if (!license) {
      return res.status(404).json({ error: 'Invalid license key', valid: false });
    }
    
    // Check if already activated on different hardware
    if (license.hardware_id && license.hardware_id !== hardwareId) {
      return res.status(403).json({ error: 'License already activated on different device', valid: false });
    }
    
    // Check if expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.status(403).json({ error: 'License has expired', valid: false });
    }
    
    // Activate license
    const query2 = 'UPDATE licenses SET hardware_id = $1, email = COALESCE($2, email), activated_at = COALESCE(activated_at, CURRENT_TIMESTAMP), last_validated = CURRENT_TIMESTAMP, status = $3, activated_by_user = TRUE WHERE license_key = $4';
    await sql.unsafe(query2, [hardwareId, email, 'active', licenseKey]);
    
    // Get updated license
    const query3 = 'SELECT * FROM licenses WHERE license_key = $1';
    const updatedLicenses = await sql.unsafe(query3, [licenseKey]);
    const updatedLicense = updatedLicenses[0];
    
    console.log('License activated:', licenseKey);
    
    res.json({
      valid: true,
      activated: true,
      license: {
        tier: updatedLicense.tier,
        maxStrategies: updatedLicense.max_strategies,
        maxWallets: updatedLicense.max_wallets,
        expiresAt: updatedLicense.expires_at
      }
    });
  } catch (err: any) {
    console.error('Activate error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Validate a license
 * POST /api/license/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const validationResult = validateSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({ error: validationResult.error.details[0].message });
    }
    
    const licenseKey = req.body.licenseKey;
    const hardwareId = req.body.hardwareId;
    const sql = getDatabase();
    
    const query1 = 'SELECT * FROM licenses WHERE license_key = $1';
    const licenses = await sql.unsafe(query1, [licenseKey]);
    const license = licenses[0];
    
    if (!license) {
      return res.json({ valid: false, error: 'Invalid license key' });
    }
    
    if (license.hardware_id && license.hardware_id !== hardwareId) {
      return res.json({ valid: false, error: 'Hardware mismatch' });
    }
    
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.json({ valid: false, error: 'License expired' });
    }
    
    if (license.status !== 'active') {
      return res.json({ valid: false, error: 'License not active' });
    }
    
    const query2 = 'UPDATE licenses SET last_validated = CURRENT_TIMESTAMP WHERE license_key = $1';
    await sql.unsafe(query2, [licenseKey]);
    
    res.json({
      valid: true,
      license: {
        tier: license.tier,
        maxStrategies: license.max_strategies,
        maxWallets: license.max_wallets,
        expiresAt: license.expires_at,
        status: license.status
      }
    });
  } catch (err: any) {
    console.error('Validate error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Generate a new license (admin only)
 * POST /api/license/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const tier = req.body.tier || 'starter';
    const email = req.body.email;
    
    const licenseKey = 'ANVIL-' + crypto.randomBytes(16).toString('hex').toUpperCase();
    
    const tierLimits: Record<string, { maxStrategies: number; maxWallets: number }> = {
      starter: { maxStrategies: 3, maxWallets: 3 },
      pro: { maxStrategies: 10, maxWallets: 10 },
      enterprise: { maxStrategies: 999, maxWallets: 999 }
    };
    const limits = tierLimits[tier] || { maxStrategies: 3, maxWallets: 3 };
    
    const sql = getDatabase();
    const query = 'INSERT INTO licenses (license_key, tier, max_strategies, max_wallets, email, status) VALUES ($1, $2, $3, $4, $5, $6)';
    await sql.unsafe(query, [licenseKey, tier, limits.maxStrategies, limits.maxWallets, email, 'active']);
    
    res.json({ success: true, licenseKey, tier, limits });
  } catch (err: any) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Deactivate a license (admin only)
 * POST /api/license/deactivate
 */
router.post('/deactivate', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const licenseKey = req.body.licenseKey;
    const sql = getDatabase();
    
    const query = 'UPDATE licenses SET status = $1 WHERE license_key = $2';
    await sql.unsafe(query, ['deactivated', licenseKey]);
    
    res.json({ success: true, message: 'License deactivated' });
  } catch (err: any) {
    console.error('Deactivate error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;


