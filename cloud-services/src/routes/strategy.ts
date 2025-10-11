import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyLicense } from '../middleware/auth.js';
import Joi from 'joi';
import { Connection, PublicKey } from '@solana/web3.js';

const router = express.Router();

// All strategy routes require valid license
router.use(verifyLicense);

const createStrategySchema = Joi.object({
  strategyType: Joi.string().valid('dca', 'ratio', 'bundle').required(),
  tokenAddress: Joi.string().required(),
  config: Joi.object().required()
});

/**
 * Create a new cloud-based strategy
 * POST /api/strategy/create
 */
router.post('/create', async (req, res) => {
  try {
    const { error, value } = createStrategySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { strategyType, tokenAddress, config } = value;
    const licenseKey = req.licenseKey; // from middleware
    
    const db = getDatabase();
    
    // Check if user has reached strategy limit
    const license = db.prepare('SELECT max_strategies FROM licenses WHERE license_key = ?').get(licenseKey);
    const activeStrategies = db.prepare(
      'SELECT COUNT(*) as count FROM strategy_executions WHERE license_key = ? AND status = ?'
    ).get(licenseKey, 'active');
    
    if (activeStrategies.count >= license.max_strategies) {
      return res.status(403).json({ 
        error: `Strategy limit reached. Max: ${license.max_strategies}`,
        limit: license.max_strategies,
        current: activeStrategies.count
      });
    }
    
    // Create strategy
    const result = db.prepare(`
      INSERT INTO strategy_executions (license_key, strategy_type, token_address, config, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(licenseKey, strategyType, tokenAddress, JSON.stringify(config));
    
    res.json({
      success: true,
      strategyId: result.lastInsertRowid,
      message: 'Strategy created and will execute in cloud'
    });
  } catch (err: any) {
    console.error('Create strategy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get all strategies for a license
 * GET /api/strategy/list
 */
router.get('/list', async (req, res) => {
  try {
    const licenseKey = req.licenseKey;
    const db = getDatabase();
    
    const strategies = db.prepare(`
      SELECT 
        id,
        strategy_type,
        token_address,
        status,
        config,
        created_at,
        last_executed,
        total_trades
      FROM strategy_executions
      WHERE license_key = ?
      ORDER BY created_at DESC
    `).all(licenseKey);
    
    // Parse config JSON
    const parsedStrategies = strategies.map((s: any) => ({
      ...s,
      config: JSON.parse(s.config)
    }));
    
    res.json({
      success: true,
      strategies: parsedStrategies
    });
  } catch (err) {
    console.error('List strategies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Pause/Resume a strategy
 * POST /api/strategy/:id/toggle
 */
router.post('/:id/toggle', async (req, res) => {
  try {
    const strategyId = parseInt(req.params.id);
    const licenseKey = req.licenseKey;
    const db = getDatabase();
    
    // Verify ownership
    const strategy = db.prepare('SELECT * FROM strategy_executions WHERE id = ? AND license_key = ?')
      .get(strategyId, licenseKey);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    const newStatus = strategy.status === 'active' ? 'paused' : 'active';
    
    db.prepare('UPDATE strategy_executions SET status = ? WHERE id = ?')
      .run(newStatus, strategyId);
    
    res.json({
      success: true,
      strategyId,
      status: newStatus
    });
  } catch (err) {
    console.error('Toggle strategy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a strategy
 * DELETE /api/strategy/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const strategyId = parseInt(req.params.id);
    const licenseKey = req.licenseKey;
    const db = getDatabase();
    
    // Verify ownership
    const strategy = db.prepare('SELECT * FROM strategy_executions WHERE id = ? AND license_key = ?')
      .get(strategyId, licenseKey);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    // Soft delete (set status to deleted instead of removing)
    db.prepare('UPDATE strategy_executions SET status = ? WHERE id = ?')
      .run('deleted', strategyId);
    
    res.json({
      success: true,
      message: 'Strategy deleted'
    });
  } catch (err) {
    console.error('Delete strategy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get strategy details
 * GET /api/strategy/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const strategyId = parseInt(req.params.id);
    const licenseKey = req.licenseKey;
    const db = getDatabase();
    
    const strategy = db.prepare(`
      SELECT * FROM strategy_executions 
      WHERE id = ? AND license_key = ?
    `).get(strategyId, licenseKey);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    // Get recent trades
    const trades = db.prepare(`
      SELECT * FROM trade_history
      WHERE strategy_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(strategyId);
    
    res.json({
      success: true,
      strategy: {
        ...strategy,
        config: JSON.parse(strategy.config)
      },
      recentTrades: trades
    });
  } catch (err) {
    console.error('Get strategy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

