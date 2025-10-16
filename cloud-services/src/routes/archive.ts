import express from 'express';
import { getDatabase } from '../database/postgres-init.js';
import { verifyLicense } from '../middleware/auth.js';

const router = express.Router();

// All archive routes require valid license
router.use(verifyLicense);

/**
 * Sync archived strategy to cloud
 * POST /api/archive/sync
 */
router.post('/sync', async (req, res) => {
  try {
    const licenseKey = req.licenseKey;
    const { strategyData, transactions, activityLogs } = req.body;
    
    if (!strategyData || !strategyData.id) {
      return res.status(400).json({ error: 'Invalid strategy data' });
    }
    
    const sql = getDatabase();
    
    // Store archived strategy
    await sql`
      INSERT INTO archived_strategies (
        license_key,
        local_strategy_id,
        strategy_type,
        token_address,
        config,
        progress,
        archive_notes,
        created_at,
        archived_at,
        transaction_count,
        total_volume
      ) VALUES (
        ${licenseKey},
        ${strategyData.id},
        ${strategyData.type},
        ${strategyData.token_address},
        ${JSON.stringify(strategyData.config)},
        ${JSON.stringify(strategyData.progress)},
        ${strategyData.archive_notes || null},
        ${new Date(strategyData.created_at)},
        ${new Date(strategyData.archived_at)},
        ${transactions?.length || 0},
        ${strategyData.total_volume || 0}
      )
      ON CONFLICT (license_key, local_strategy_id) 
      DO UPDATE SET
        progress = EXCLUDED.progress,
        transaction_count = EXCLUDED.transaction_count,
        total_volume = EXCLUDED.total_volume,
        synced_at = CURRENT_TIMESTAMP
    `;
    
    // Store transactions if provided
    if (transactions && transactions.length > 0) {
      for (const tx of transactions) {
        await sql`
          INSERT INTO archived_transactions (
            license_key,
            local_strategy_id,
            signature,
            type,
            input_token,
            output_token,
            input_amount,
            output_amount,
            dex_used,
            status,
            timestamp
          ) VALUES (
            ${licenseKey},
            ${strategyData.id},
            ${tx.signature},
            ${tx.type},
            ${tx.input_token},
            ${tx.output_token},
            ${tx.input_amount},
            ${tx.output_amount},
            ${tx.dex_used || null},
            ${tx.status},
            ${new Date(tx.timestamp)}
          )
          ON CONFLICT (license_key, signature) DO NOTHING
        `;
      }
    }
    
    console.log(`✅ Synced strategy #${strategyData.id} for license ${licenseKey}`);
    
    res.json({
      success: true,
      message: 'Strategy archived to cloud',
      strategyId: strategyData.id,
      transactionsSynced: transactions?.length || 0
    });
    
  } catch (err: any) {
    console.error('Archive sync error:', err);
    res.status(500).json({ error: 'Failed to sync archive', details: err.message });
  }
});

/**
 * Get all archived strategies for a license
 * GET /api/archive/list
 */
router.get('/list', async (req, res) => {
  try {
    const licenseKey = req.licenseKey;
    const sql = getDatabase();
    
    const archives = await sql`
      SELECT 
        id,
        local_strategy_id,
        strategy_type,
        token_address,
        config,
        progress,
        archive_notes,
        created_at,
        archived_at,
        synced_at,
        transaction_count,
        total_volume
      FROM archived_strategies
      WHERE license_key = ${licenseKey}
      ORDER BY archived_at DESC
    `;
    
    res.json({
      success: true,
      archives: archives.map((a: any) => ({
        ...a,
        config: a.config,
        progress: a.progress
      }))
    });
    
  } catch (err: any) {
    console.error('List archives error:', err);
    res.status(500).json({ error: 'Failed to list archives' });
  }
});

/**
 * Get transactions for an archived strategy
 * GET /api/archive/:strategyId/transactions
 */
router.get('/:strategyId/transactions', async (req, res) => {
  try {
    const licenseKey = req.licenseKey;
    const strategyId = parseInt(req.params.strategyId);
    const sql = getDatabase();
    
    const transactions = await sql`
      SELECT * FROM archived_transactions
      WHERE license_key = ${licenseKey}
      AND local_strategy_id = ${strategyId}
      ORDER BY timestamp DESC
    `;
    
    res.json({
      success: true,
      transactions
    });
    
  } catch (err: any) {
    console.error('Get archived transactions error:', err);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

/**
 * Delete archived strategy from cloud
 * DELETE /api/archive/:strategyId
 */
router.delete('/:strategyId', async (req, res) => {
  try {
    const licenseKey = req.licenseKey;
    const strategyId = parseInt(req.params.strategyId);
    const sql = getDatabase();
    
    // Delete transactions first
    await sql`
      DELETE FROM archived_transactions
      WHERE license_key = ${licenseKey}
      AND local_strategy_id = ${strategyId}
    `;
    
    // Delete strategy
    await sql`
      DELETE FROM archived_strategies
      WHERE license_key = ${licenseKey}
      AND local_strategy_id = ${strategyId}
    `;
    
    res.json({
      success: true,
      message: 'Archived strategy deleted from cloud'
    });
    
  } catch (err: any) {
    console.error('Delete archive error:', err);
    res.status(500).json({ error: 'Failed to delete archive' });
  }
});

export default router;



