import { Connection, PublicKey, SystemProgram, Transaction, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { getDatabase } from '../database/schema';

export interface FeeConfig {
  feeWalletAddress: string;
  feePercentage: number; // e.g., 0.5 for 0.5%
  feeEnabled: boolean;
}

export interface FeeTransaction {
  id?: number;
  transactionId?: number;
  strategyId: number;
  feeAmountSol: number;
  feeAmountUsd?: number;
  feeWallet: string;
  originalAmount: number;
  feePercentage: number;
  timestamp: number;
  signature?: string;
  status: 'pending' | 'success' | 'failed';
}

export class FeeManager {
  private connection: Connection;
  private db: any;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.db = getDatabase();
  }

  /**
   * Get current fee configuration from database
   */
  getFeeConfig(): FeeConfig {
    const feeEnabled = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('fee_enabled');
    const feePercentage = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('fee_percentage');
    const feeWallet = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('fee_wallet_address');

    return {
      feeEnabled: feeEnabled?.value === 'true',
      feePercentage: parseFloat(feePercentage?.value || '0.5'),
      feeWalletAddress: feeWallet?.value || '',
    };
  }

  /**
   * Calculate fee amount
   */
  calculateFee(amount: number, feePercentage: number): number {
    return (amount * feePercentage) / 100;
  }

  /**
   * Transfer fee to admin wallet
   */
  async transferFee(params: {
    fromKeypair: Keypair;
    feeAmount: number; // in lamports
    strategyId: number;
  }): Promise<{ success: boolean; signature?: string; error?: string }> {
    const { fromKeypair, feeAmount, strategyId } = params;

    try {
      const config = this.getFeeConfig();

      // Check if fees are enabled
      if (!config.feeEnabled || !config.feeWalletAddress || feeAmount <= 0) {
        return { success: true }; // Skip fee if not configured
      }

      // Validate fee wallet address
      let feeWalletPubkey: PublicKey;
      try {
        feeWalletPubkey = new PublicKey(config.feeWalletAddress);
      } catch (error) {
        console.error('Invalid fee wallet address:', config.feeWalletAddress);
        return { success: true }; // Skip fee if invalid address
      }

      // Create fee transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: feeWalletPubkey,
          lamports: feeAmount,
        })
      );

      // Send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeypair],
        {
          commitment: 'confirmed',
          skipPreflight: false,
        }
      );

      // Record fee transaction
      const feeAmountSol = feeAmount / 1e9;
      this.recordFeeTransaction({
        strategyId,
        feeAmountSol,
        feeWallet: config.feeWalletAddress,
        originalAmount: 0, // Will be set by caller
        feePercentage: config.feePercentage,
        timestamp: Date.now(),
        signature,
        status: 'success',
      });

      console.log(`💰 Fee transferred: ${feeAmountSol.toFixed(4)} SOL → ${config.feeWalletAddress}`);

      return { success: true, signature };
    } catch (error: any) {
      console.error('Fee transfer failed:', error);

      // Record failed fee transaction
      const feeAmountSol = feeAmount / 1e9;
      const config = this.getFeeConfig();
      this.recordFeeTransaction({
        strategyId,
        feeAmountSol,
        feeWallet: config.feeWalletAddress,
        originalAmount: 0,
        feePercentage: config.feePercentage,
        timestamp: Date.now(),
        status: 'failed',
      });

      // Don't fail the main transaction if fee fails
      return { success: false, error: error.message };
    }
  }

  /**
   * Record fee transaction in database
   */
  private recordFeeTransaction(fee: FeeTransaction): void {
    try {
      this.db.prepare(`
        INSERT INTO fee_transactions 
        (strategy_id, fee_amount_sol, fee_amount_usd, fee_wallet, original_amount, fee_percentage, timestamp, signature, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fee.strategyId,
        fee.feeAmountSol,
        fee.feeAmountUsd || null,
        fee.feeWallet,
        fee.originalAmount,
        fee.feePercentage,
        fee.timestamp,
        fee.signature || null,
        fee.status
      );
    } catch (error) {
      console.error('Failed to record fee transaction:', error);
    }
  }

  /**
   * Get total fees collected
   */
  getTotalFeesCollected(): { totalSol: number; totalUsd: number; count: number } {
    const result = this.db.prepare(`
      SELECT 
        COALESCE(SUM(fee_amount_sol), 0) as total_sol,
        COALESCE(SUM(fee_amount_usd), 0) as total_usd,
        COUNT(*) as count
      FROM fee_transactions
      WHERE status = 'success'
    `).get();

    return {
      totalSol: result.total_sol || 0,
      totalUsd: result.total_usd || 0,
      count: result.count || 0,
    };
  }

  /**
   * Get fee transactions for a strategy
   */
  getStrategyFees(strategyId: number): FeeTransaction[] {
    return this.db.prepare(`
      SELECT * FROM fee_transactions
      WHERE strategy_id = ?
      ORDER BY timestamp DESC
    `).all(strategyId);
  }

  /**
   * Update fee configuration
   */
  updateFeeConfig(config: Partial<FeeConfig>): void {
    if (config.feeEnabled !== undefined) {
      this.db.prepare('UPDATE settings SET value = ? WHERE key = ?')
        .run(config.feeEnabled ? 'true' : 'false', 'fee_enabled');
    }
    
    if (config.feePercentage !== undefined) {
      this.db.prepare('UPDATE settings SET value = ? WHERE key = ?')
        .run(config.feePercentage.toString(), 'fee_percentage');
    }
    
    if (config.feeWalletAddress !== undefined) {
      this.db.prepare('UPDATE settings SET value = ? WHERE key = ?')
        .run(config.feeWalletAddress, 'fee_wallet_address');
    }
  }
}

export default FeeManager;



