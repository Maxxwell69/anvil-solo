import express from 'express';
import { getDatabase } from '../database/postgres-init.js';
import { Connection, PublicKey } from '@solana/web3.js';

const router = express.Router();

// Admin authentication middleware
const requireAdmin = (req: any, res: any, next: any) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized - Admin key required' });
  }
  next();
};

/**
 * Record a fee collection transaction
 * POST /api/fees/record
 */
router.post('/record', async (req, res) => {
  try {
    const {
      fromWallet,
      toWallet,
      amount,
      signature,
      strategyId,
      strategyType,
      timestamp
    } = req.body;
    
    if (!signature || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const sql = getDatabase();
    
    // Record fee transaction
    await sql`
      INSERT INTO fee_collections (
        from_wallet,
        to_wallet,
        amount_sol,
        amount_usd,
        signature,
        strategy_id,
        strategy_type,
        timestamp,
        status
      ) VALUES (
        ${fromWallet},
        ${toWallet},
        ${amount},
        ${amount * 200}, -- Assuming $200/SOL, could fetch live price
        ${signature},
        ${strategyId || null},
        ${strategyType || null},
        ${timestamp ? new Date(timestamp) : new Date()},
        'confirmed'
      )
      ON CONFLICT (signature) DO NOTHING
    `;
    
    console.log(`💰 Fee collected: ${amount} SOL | Tx: ${signature.substring(0, 16)}...`);
    
    res.json({
      success: true,
      message: 'Fee transaction recorded'
    });
    
  } catch (err: any) {
    console.error('Record fee error:', err);
    res.status(500).json({ error: 'Failed to record fee' });
  }
});

/**
 * Get fee collection statistics
 * GET /api/fees/stats
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const sql = getDatabase();
    
    // Total fees collected
    const totalResult = await sql`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount_sol), 0) as total_sol,
        COALESCE(SUM(amount_usd), 0) as total_usd
      FROM fee_collections
      WHERE status = 'confirmed'
    `;
    
    // Fees by strategy type
    const byTypeResult = await sql`
      SELECT 
        strategy_type,
        COUNT(*) as count,
        SUM(amount_sol) as total_sol
      FROM fee_collections
      WHERE status = 'confirmed'
      GROUP BY strategy_type
      ORDER BY total_sol DESC
    `;
    
    // Recent fees (last 100)
    const recentFees = await sql`
      SELECT 
        from_wallet,
        amount_sol,
        amount_usd,
        signature,
        strategy_type,
        timestamp
      FROM fee_collections
      WHERE status = 'confirmed'
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    
    // Daily breakdown (last 30 days)
    const dailyBreakdown = await sql`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as transactions,
        SUM(amount_sol) as sol,
        SUM(amount_usd) as usd
      FROM fee_collections
      WHERE status = 'confirmed'
      AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;
    
    res.json({
      success: true,
      stats: {
        total: totalResult[0],
        byType: byTypeResult,
        recent: recentFees,
        daily: dailyBreakdown
      }
    });
    
  } catch (err: any) {
    console.error('Get fee stats error:', err);
    res.status(500).json({ error: 'Failed to get fee stats' });
  }
});

/**
 * Verify fee wallet balance on-chain
 * GET /api/fees/verify-balance
 */
router.get('/verify-balance', requireAdmin, async (req, res) => {
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const feeWallet = process.env.FEE_WALLET_ADDRESS || '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd';
    
    const connection = new Connection(rpcUrl);
    const publicKey = new PublicKey(feeWallet);
    
    const balance = await connection.getBalance(publicKey);
    const balanceSol = balance / 1e9;
    const balanceUsd = balanceSol * 200; // Assuming $200/SOL
    
    res.json({
      success: true,
      wallet: feeWallet,
      balance: {
        lamports: balance,
        sol: balanceSol,
        usd: balanceUsd
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err: any) {
    console.error('Verify balance error:', err);
    res.status(500).json({ error: 'Failed to verify balance' });
  }
});

/**
 * Get fee collection summary by user/license
 * GET /api/fees/by-license
 */
router.get('/by-license', requireAdmin, async (req, res) => {
  try {
    const sql = getDatabase();
    
    const feesByLicense = await sql`
      SELECT 
        fc.from_wallet,
        l.license_key,
        l.email,
        l.tier,
        COUNT(*) as transaction_count,
        SUM(fc.amount_sol) as total_sol,
        SUM(fc.amount_usd) as total_usd,
        MIN(fc.timestamp) as first_fee,
        MAX(fc.timestamp) as last_fee
      FROM fee_collections fc
      LEFT JOIN licenses l ON fc.from_wallet = l.hardware_id
      WHERE fc.status = 'confirmed'
      GROUP BY fc.from_wallet, l.license_key, l.email, l.tier
      ORDER BY total_sol DESC
    `;
    
    res.json({
      success: true,
      feesByLicense
    });
    
  } catch (err: any) {
    console.error('Get fees by license error:', err);
    res.status(500).json({ error: 'Failed to get fee breakdown' });
  }
});

export default router;


