import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'anvil-license-api' });
});

/**
 * License Tiers
 */
export enum LicenseTier {
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  LIFETIME = 'lifetime',
}

/**
 * Feature limits by tier
 */
const TIER_LIMITS = {
  [LicenseTier.STARTER]: {
    maxActiveStrategies: 1,
    maxWallets: 5,
    strategyTypes: ['dca'],
    cloudBackup: false,
    prioritySupport: false,
  },
  [LicenseTier.PRO]: {
    maxActiveStrategies: 10,
    maxWallets: 10,
    strategyTypes: ['dca', 'ratio', 'bundle'],
    cloudBackup: true,
    prioritySupport: false,
  },
  [LicenseTier.ENTERPRISE]: {
    maxActiveStrategies: -1, // Unlimited
    maxWallets: -1, // Unlimited
    strategyTypes: ['dca', 'ratio', 'bundle'],
    cloudBackup: true,
    prioritySupport: true,
  },
  [LicenseTier.LIFETIME]: {
    maxActiveStrategies: -1, // Unlimited
    maxWallets: -1, // Unlimited
    strategyTypes: ['dca', 'ratio', 'bundle'],
    cloudBackup: true,
    prioritySupport: true,
  },
};

/**
 * Generate a license key
 */
function generateLicenseKey(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    const segment = Math.random().toString(36).substring(2, 7).toUpperCase();
    segments.push(segment);
  }
  return segments.join('-');
}

/**
 * POST /api/license/activate
 * Activate a license key with hardware ID
 */
app.post('/api/license/activate', async (req: Request, res: Response) => {
  try {
    const { licenseKey, hwid } = req.body;

    if (!licenseKey || !hwid) {
      return res.status(400).json({ error: 'License key and hardware ID required' });
    }

    // Check if license exists and is valid
    const licenseResult = await pool.query(
      'SELECT * FROM licenses WHERE license_key = $1',
      [licenseKey]
    );

    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid license key' });
    }

    const license = licenseResult.rows[0];

    // Check if license is already activated
    if (license.hwid && license.hwid !== hwid) {
      return res.status(403).json({ error: 'License already activated on another device' });
    }

    // Check if license is expired (for non-lifetime)
    if (license.tier !== LicenseTier.LIFETIME && license.expires_at) {
      if (new Date(license.expires_at) < new Date()) {
        return res.status(403).json({ error: 'License has expired' });
      }
    }

    // Activate license
    await pool.query(
      'UPDATE licenses SET hwid = $1, activated_at = NOW(), last_validated = NOW() WHERE license_key = $2',
      [hwid, licenseKey]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        licenseKey,
        hwid,
        tier: license.tier,
        features: TIER_LIMITS[license.tier as LicenseTier],
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days, client should revalidate
    );

    res.json({
      success: true,
      token,
      tier: license.tier,
      features: TIER_LIMITS[license.tier as LicenseTier],
      expiresAt: license.expires_at,
    });
  } catch (error) {
    console.error('License activation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/license/validate
 * Validate an existing license token
 */
app.post('/api/license/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Verify JWT
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Check license status in database
    const licenseResult = await pool.query(
      'SELECT * FROM licenses WHERE license_key = $1',
      [decoded.licenseKey]
    );

    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    const license = licenseResult.rows[0];

    // Check expiration for non-lifetime licenses
    if (license.tier !== LicenseTier.LIFETIME && license.expires_at) {
      if (new Date(license.expires_at) < new Date()) {
        return res.status(403).json({ error: 'License has expired' });
      }
    }

    // Update last validated timestamp
    await pool.query(
      'UPDATE licenses SET last_validated = NOW() WHERE license_key = $1',
      [decoded.licenseKey]
    );

    res.json({
      valid: true,
      tier: license.tier,
      features: TIER_LIMITS[license.tier as LicenseTier],
      expiresAt: license.expires_at,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.error('License validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/license/features/:tier
 * Get feature list for a tier (public)
 */
app.get('/api/license/features/:tier', (req: Request, res: Response) => {
  const { tier } = req.params;

  if (!Object.values(LicenseTier).includes(tier as LicenseTier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  res.json({
    tier,
    features: TIER_LIMITS[tier as LicenseTier],
  });
});

/**
 * POST /api/license/deactivate
 * Deactivate a license (remove HWID binding)
 */
app.post('/api/license/deactivate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Verify JWT
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Remove HWID binding
    await pool.query(
      'UPDATE licenses SET hwid = NULL WHERE license_key = $1',
      [decoded.licenseKey]
    );

    res.json({ success: true, message: 'License deactivated successfully' });
  } catch (error) {
    console.error('License deactivation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// CLOUD STRATEGY BACKUP
// ============================================================================

/**
 * POST /api/strategies/save
 * Save/update a strategy template to cloud
 */
app.post('/api/strategies/save', async (req: Request, res: Response) => {
  try {
    const { token, strategyName, strategyType, strategyConfig } = req.body;

    if (!token || !strategyName || !strategyType || !strategyConfig) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify JWT
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Check if user has cloud backup feature
    const licenseResult = await pool.query(
      'SELECT * FROM licenses WHERE license_key = $1',
      [decoded.licenseKey]
    );

    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    const license = licenseResult.rows[0];
    const features = TIER_LIMITS[license.tier as LicenseTier];

    if (!features.cloudBackup) {
      return res.status(403).json({ error: 'Cloud backup not available in your plan' });
    }

    // Save or update strategy
    const existing = await pool.query(
      'SELECT id FROM strategy_backups WHERE license_key = $1 AND strategy_name = $2',
      [decoded.licenseKey, strategyName]
    );

    if (existing.rows.length > 0) {
      // Update existing
      await pool.query(
        'UPDATE strategy_backups SET strategy_type = $1, strategy_config = $2, updated_at = NOW() WHERE id = $3',
        [strategyType, JSON.stringify(strategyConfig), existing.rows[0].id]
      );
    } else {
      // Insert new
      await pool.query(
        'INSERT INTO strategy_backups (license_key, strategy_name, strategy_type, strategy_config) VALUES ($1, $2, $3, $4)',
        [decoded.licenseKey, strategyName, strategyType, JSON.stringify(strategyConfig)]
      );
    }

    res.json({ success: true, message: 'Strategy saved to cloud' });
  } catch (error: any) {
    console.error('Strategy save error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/strategies/list
 * Get all saved strategy templates
 */
app.get('/api/strategies/list', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Get all strategies for this license
    const strategies = await pool.query(
      'SELECT id, strategy_name, strategy_type, strategy_config, created_at, updated_at FROM strategy_backups WHERE license_key = $1 ORDER BY updated_at DESC',
      [decoded.licenseKey]
    );

    res.json({
      success: true,
      strategies: strategies.rows.map(s => ({
        ...s,
        strategy_config: JSON.parse(s.strategy_config),
      })),
    });
  } catch (error: any) {
    console.error('Strategy list error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/strategies/:id
 * Delete a strategy template
 */
app.delete('/api/strategies/:id', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Delete strategy (only if it belongs to this license)
    const result = await pool.query(
      'DELETE FROM strategy_backups WHERE id = $1 AND license_key = $2',
      [id, decoded.licenseKey]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json({ success: true, message: 'Strategy deleted' });
  } catch (error: any) {
    console.error('Strategy delete error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/analytics
 * Get overall analytics (requires admin token)
 */
app.get('/api/admin/analytics', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // License statistics
    const licenseStats = await pool.query(`
      SELECT 
        tier,
        COUNT(*) as total_count,
        COUNT(CASE WHEN hwid IS NOT NULL THEN 1 END) as activated_count,
        COUNT(CASE WHEN last_validated > NOW() - INTERVAL '7 days' THEN 1 END) as active_7d
      FROM licenses
      GROUP BY tier
    `);

    // Revenue calculations (mock for now - integrate with Stripe)
    const revenueData = await pool.query(`
      SELECT 
        tier,
        COUNT(*) * CASE 
          WHEN tier = 'starter' THEN 29
          WHEN tier = 'pro' THEN 99
          WHEN tier = 'enterprise' THEN 299
          ELSE 0
        END as monthly_revenue
      FROM licenses
      WHERE hwid IS NOT NULL
      AND (expires_at IS NULL OR expires_at > NOW())
      GROUP BY tier
    `);

    // Strategy backup statistics
    const strategyStats = await pool.query(`
      SELECT 
        strategy_type,
        COUNT(*) as count
      FROM strategy_backups
      GROUP BY strategy_type
    `);

    // Recent activations
    const recentActivations = await pool.query(`
      SELECT 
        license_key,
        tier,
        activated_at,
        last_validated
      FROM licenses
      WHERE activated_at IS NOT NULL
      ORDER BY activated_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      analytics: {
        licenses: licenseStats.rows,
        revenue: revenueData.rows,
        strategies: strategyStats.rows,
        recentActivations: recentActivations.rows,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/users
 * Get all users with license information
 */
app.get('/api/admin/users', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const users = await pool.query(`
      SELECT 
        l.id,
        l.license_key,
        l.tier,
        l.email,
        l.hwid,
        l.activated_at,
        l.last_validated,
        l.expires_at,
        l.created_at,
        COUNT(DISTINCT sb.id) as strategy_count
      FROM licenses l
      LEFT JOIN strategy_backups sb ON l.license_key = sb.license_key
      GROUP BY l.id, l.license_key, l.tier, l.email, l.hwid, l.activated_at, l.last_validated, l.expires_at, l.created_at
      ORDER BY l.activated_at DESC NULLS LAST
    `);

    res.json({
      success: true,
      users: users.rows,
      total: users.rows.length,
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/license/create
 * Create a new license key
 */
app.post('/api/admin/license/create', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tier, email, expiresInDays, notes } = req.body;

    if (!tier || !Object.values(LicenseTier).includes(tier)) {
      return res.status(400).json({ error: 'Valid tier required' });
    }

    // Generate license key
    const licenseKey = generateLicenseKey();

    // Calculate expiration
    let expiresAt = null;
    if (tier !== LicenseTier.LIFETIME && expiresInDays) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    // Insert license
    await pool.query(
      'INSERT INTO licenses (license_key, tier, email, expires_at, notes) VALUES ($1, $2, $3, $4, $5)',
      [licenseKey, tier, email || null, expiresAt, notes || null]
    );

    res.json({
      success: true,
      licenseKey,
      tier,
      expiresAt,
    });
  } catch (error) {
    console.error('License creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/license/:licenseKey
 * Revoke a license
 */
app.delete('/api/admin/license/:licenseKey', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { licenseKey } = req.params;

    await pool.query('DELETE FROM licenses WHERE license_key = $1', [licenseKey]);

    res.json({ success: true, message: 'License revoked' });
  } catch (error) {
    console.error('License revoke error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/license/:licenseKey/extend
 * Extend license expiration
 */
app.put('/api/admin/license/:licenseKey/extend', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { licenseKey } = req.params;
    const { daysToAdd } = req.body;

    if (!daysToAdd || daysToAdd <= 0) {
      return res.status(400).json({ error: 'Valid daysToAdd required' });
    }

    await pool.query(`
      UPDATE licenses 
      SET expires_at = COALESCE(expires_at, NOW()) + INTERVAL '${daysToAdd} days'
      WHERE license_key = $1
    `, [licenseKey]);

    res.json({ success: true, message: `License extended by ${daysToAdd} days` });
  } catch (error) {
    console.error('License extend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// STRIPE WEBHOOKS
// ============================================================================

/**
 * POST /webhooks/stripe
 * Handle Stripe payment webhooks
 */
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    if (!process.env.STRIPE_WEBHOOK_SECRET || !sig) {
      return res.status(400).json({ error: 'Missing stripe signature' });
    }

    // Verify webhook signature (requires stripe package)
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    // For now, just log
    console.log('Stripe webhook received');

    // Handle different event types
    const event = req.body as any;
    
    switch (event.type) {
      case 'checkout.session.completed':
        // Customer completed payment
        const session = event.data.object;
        const tier = session.metadata?.tier;
        const email = session.customer_email;
        const daysValid = parseInt(session.metadata?.days || '30');

        // Generate and save license
        const licenseKey = generateLicenseKey();
        const expiresAt = tier === 'lifetime' ? null : 
          new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

        await pool.query(
          'INSERT INTO licenses (license_key, tier, email, expires_at, stripe_payment_id) VALUES ($1, $2, $3, $4, $5)',
          [licenseKey, tier, email, expiresAt, session.id]
        );

        console.log(`✅ Created ${tier} license for ${email}: ${licenseKey}`);

        // TODO: Send email with license key
        break;

      case 'customer.subscription.deleted':
        // Subscription cancelled - could mark license as expired
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🔑 Anvil Admin API running on port ${PORT}`);
  console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
});

export { app, pool };

