import express from 'express';
import crypto from 'crypto';
import { getDatabase } from '../database/postgres-init.js';
import Joi from 'joi';

const router = express.Router();

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
    const { error, value } = activateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { licenseKey, hardwareId, email } = value;
    const db = getDatabase();
    
    // Check if license exists
    const license = db.prepare('SELECT * FROM licenses WHERE license_key = ?').get(licenseKey);
    
    if (!license) {
      return res.status(404).json({ 
        error: 'Invalid license key',
        valid: false
      });
    }
    
    // Check if already activated on different hardware
    if (license.hardware_id && license.hardware_id !== hardwareId) {
      return res.status(403).json({ 
        error: 'License already activated on different device',
        valid: false
      });
    }
    
    // Check if expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.status(403).json({ 
        error: 'License has expired',
        valid: false
      });
    }
    
    // Activate license
    db.prepare(`
      UPDATE licenses 
      SET hardware_id = ?, 
          email = COALESCE(?, email),
          activated_at = COALESCE(activated_at, CURRENT_TIMESTAMP),
          last_validated = CURRENT_TIMESTAMP,
          status = 'active'
      WHERE license_key = ?
    `).run(hardwareId, email, licenseKey);
    
    // Get updated license
    const updatedLicense = db.prepare('SELECT * FROM licenses WHERE license_key = ?').get(licenseKey);
    
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Validate a license
 * POST /api/license/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { error, value } = validateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { licenseKey, hardwareId } = value;
    const db = getDatabase();
    
    const license = db.prepare('SELECT * FROM licenses WHERE license_key = ?').get(licenseKey);
    
    if (!license) {
      return res.json({ valid: false, error: 'Invalid license key' });
    }
    
    // Check hardware ID match
    if (license.hardware_id && license.hardware_id !== hardwareId) {
      return res.json({ valid: false, error: 'Hardware mismatch' });
    }
    
    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.json({ valid: false, error: 'License expired' });
    }
    
    // Check status
    if (license.status !== 'active') {
      return res.json({ valid: false, error: 'License not active' });
    }
    
    // Update last validated
    db.prepare('UPDATE licenses SET last_validated = CURRENT_TIMESTAMP WHERE license_key = ?')
      .run(licenseKey);
    
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
  } catch (err) {
    console.error('Validate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate a new license (admin only)
 * POST /api/license/generate
 */
router.post('/generate', async (req, res) => {
  try {
    // TODO: Add admin authentication
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { tier = 'starter', email } = req.body;
    
    // Generate license key
    const licenseKey = `ANVIL-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
    
    // Set limits based on tier
    const tierLimits: Record<string, { maxStrategies: number; maxWallets: number }> = {
      starter: { maxStrategies: 3, maxWallets: 3 },
      pro: { maxStrategies: 10, maxWallets: 10 },
      enterprise: { maxStrategies: 999, maxWallets: 999 }
    };
    const limits = tierLimits[tier] || { maxStrategies: 3, maxWallets: 3 };
    
    const db = getDatabase();
    db.prepare(`
      INSERT INTO licenses (license_key, tier, max_strategies, max_wallets, email, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).run(licenseKey, tier, limits.maxStrategies, limits.maxWallets, email);
    
    res.json({
      success: true,
      licenseKey,
      tier,
      limits
    });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Internal server error' });
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
    
    const { licenseKey } = req.body;
    const db = getDatabase();
    
    db.prepare('UPDATE licenses SET status = ? WHERE license_key = ?')
      .run('deactivated', licenseKey);
    
    res.json({ success: true, message: 'License deactivated' });
  } catch (err) {
    console.error('Deactivate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


