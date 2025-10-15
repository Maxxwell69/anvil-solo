import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyLicense } from '../middleware/auth.js';
import Joi from 'joi';

const router = express.Router();

// All data routes require valid license
router.use(verifyLicense);

/**
 * Save user settings/preferences
 * POST /api/data/settings
 */
router.post('/settings', async (req, res) => {
  try {
    const licenseKey = req.licenseKey;
    const { settings, preferences } = req.body;
    const db = getDatabase();
    
    // Upsert user data
    db.prepare(`
      INSERT INTO user_data (license_key, settings, preferences, last_sync)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(license_key) 
      DO UPDATE SET 
        settings = ?,
        preferences = ?,
        last_sync = CURRENT_TIMESTAMP
    `).run(
      licenseKey, 
      JSON.stringify(settings), 
      JSON.stringify(preferences),
      JSON.stringify(settings),
      JSON.stringify(preferences)
    );
    
    res.json({
      success: true,
      message: 'Settings saved'
    });
  } catch (err) {
    console.error('Save settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user settings/preferences
 * GET /api/data/settings
 */
router.get('/settings', async (req, res) => {
  try {
    const licenseKey = req.licenseKey;
    const db = getDatabase();
    
    const userData = db.prepare('SELECT * FROM user_data WHERE license_key = ?')
      .get(licenseKey);
    
    if (!userData) {
      return res.json({
        success: true,
        settings: {},
        preferences: {}
      });
    }
    
    res.json({
      success: true,
      settings: userData.settings ? JSON.parse(userData.settings) : {},
      preferences: userData.preferences ? JSON.parse(userData.preferences) : {},
      lastSync: userData.last_sync
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get trade history
 * GET /api/data/trades
 */
router.get('/trades', async (req, res) => {
  try {
    const licenseKey = req.licenseKey;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const db = getDatabase();
    
    const trades = db.prepare(`
      SELECT * FROM trade_history
      WHERE license_key = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(licenseKey, limit, offset);
    
    const totalTrades = db.prepare('SELECT COUNT(*) as count FROM trade_history WHERE license_key = ?')
      .get(licenseKey);
    
    res.json({
      success: true,
      trades,
      total: totalTrades.count,
      limit,
      offset
    });
  } catch (err) {
    console.error('Get trades error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Record a trade (called by strategy executor)
 * POST /api/data/trade
 */
router.post('/trade', async (req, res) => {
  try {
    const licenseKey = req.licenseKey;
    const { strategyId, tokenAddress, tradeType, amount, price, signature, status } = req.body;
    
    const db = getDatabase();
    
    db.prepare(`
      INSERT INTO trade_history (
        license_key, strategy_id, token_address, trade_type, 
        amount, price, signature, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(licenseKey, strategyId, tokenAddress, tradeType, amount, price, signature, status);
    
    // Update strategy stats
    db.prepare(`
      UPDATE strategy_executions 
      SET total_trades = total_trades + 1,
          last_executed = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(strategyId);
    
    res.json({
      success: true,
      message: 'Trade recorded'
    });
  } catch (err) {
    console.error('Record trade error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get analytics
 * GET /api/data/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const licenseKey = req.licenseKey;
    const db = getDatabase();
    
    // Get summary statistics
    const totalTrades = db.prepare(
      'SELECT COUNT(*) as count FROM trade_history WHERE license_key = ?'
    ).get(licenseKey);
    
    const activeStrategies = db.prepare(
      'SELECT COUNT(*) as count FROM strategy_executions WHERE license_key = ? AND status = ?'
    ).get(licenseKey, 'active');
    
    const recentTrades = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count, trade_type
      FROM trade_history
      WHERE license_key = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at), trade_type
      ORDER BY date DESC
    `).all(licenseKey);
    
    res.json({
      success: true,
      analytics: {
        totalTrades: totalTrades.count,
        activeStrategies: activeStrategies.count,
        recentActivity: recentTrades
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;






