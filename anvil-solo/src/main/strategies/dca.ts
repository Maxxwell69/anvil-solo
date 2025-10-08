import cron from 'node-cron';
import { JupiterClient } from '../jupiter/client';
import { WalletManager } from '../wallet/manager';
import { getDatabase } from '../database/schema';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface DCAConfig {
  tokenAddress: string;
  direction: 'buy' | 'sell';
  totalAmount: number;
  numberOfOrders: number;
  frequency: 'hourly' | '2h' | '4h' | '6h' | 'daily' | 'custom';
  customIntervalMinutes?: number;
  slippageBps: number;
  priorityFeeLamports: number;
  maxBuyPrice?: number;
  minSellPrice?: number;
  startTime?: number; // Unix timestamp
  endTime?: number;   // Unix timestamp
}

export interface DCAProgress {
  completed: number;
  total: number;
  successfulTrades: number;
  failedTrades: number;
  totalVolumeProcessed: number;
  lastExecutionTime?: number;
}

export class DCAStrategy {
  private strategyId: number;
  private config: DCAConfig;
  private jupiter: JupiterClient;
  private wallet: WalletManager;
  private cronJob: cron.ScheduledTask | null = null;
  private progress: DCAProgress;
  private isRunning: boolean = false;

  constructor(
    strategyId: number,
    config: DCAConfig,
    jupiter: JupiterClient,
    wallet: WalletManager
  ) {
    this.strategyId = strategyId;
    this.config = config;
    this.jupiter = jupiter;
    this.wallet = wallet;
    this.progress = {
      completed: 0,
      total: config.numberOfOrders,
      successfulTrades: 0,
      failedTrades: 0,
      totalVolumeProcessed: 0,
    };
  }

  /**
   * Start the DCA strategy
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('DCA strategy already running');
      return;
    }

    this.isRunning = true;
    const cronExpression = this.getCronExpression();
    const amountPerOrder = this.config.totalAmount / this.config.numberOfOrders;

    console.log(`🚀 Starting DCA strategy #${this.strategyId}`);
    console.log(`   Token: ${this.config.tokenAddress}`);
    console.log(`   Direction: ${this.config.direction.toUpperCase()}`);
    console.log(`   Total: ${this.config.totalAmount} SOL/tokens`);
    console.log(`   Orders: ${this.config.numberOfOrders} × ${amountPerOrder.toFixed(4)} each`);
    console.log(`   Schedule: ${cronExpression}`);

    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.executeDCAOrder(amountPerOrder);
    });

    await this.updateStrategyStatus('active');
  }

  /**
   * Execute a single DCA order
   */
  private async executeDCAOrder(amount: number): Promise<void> {
    if (this.progress.completed >= this.config.numberOfOrders) {
      console.log(`✅ DCA strategy #${this.strategyId} completed all orders`);
      await this.complete();
      return;
    }

    // Check time window if specified
    if (!this.isWithinTimeWindow()) {
      console.log(`⏰ Outside time window, skipping order`);
      return;
    }

    console.log(`📊 Executing DCA order ${this.progress.completed + 1}/${this.config.numberOfOrders}`);

    try {
      // Get token info
      const tokenInfo = await this.jupiter.getTokenInfo(this.config.tokenAddress);
      if (!tokenInfo) {
        throw new Error('Token not found');
      }

      // Determine input/output mints
      const inputMint = this.config.direction === 'buy' ? SOL_MINT : this.config.tokenAddress;
      const outputMint = this.config.direction === 'buy' ? this.config.tokenAddress : SOL_MINT;

      // Calculate amount in smallest unit
      const inputDecimals = this.config.direction === 'buy' ? 9 : tokenInfo.decimals;
      const amountInSmallestUnit = Math.floor(amount * Math.pow(10, inputDecimals));

      // Get quote
      console.log(`   Fetching quote for ${amount} ${this.config.direction === 'buy' ? 'SOL' : tokenInfo.symbol}...`);
      const quote = await this.jupiter.getQuote({
        inputMint,
        outputMint,
        amount: amountInSmallestUnit,
        slippageBps: this.config.slippageBps,
      });

      // Check price limits
      if (!this.isPriceAcceptable(quote, tokenInfo.decimals)) {
        console.log(`   ⚠️ Price not acceptable, skipping order`);
        return;
      }

      // Execute swap
      console.log(`   Executing swap...`);
      const result = await this.jupiter.executeSwap({
        quote,
        userKeypair: this.wallet.getMainKeypair(),
        priorityFeeLamports: this.config.priorityFeeLamports,
      });

      // Log successful transaction
      await this.logTransaction(result, quote, 'confirmed');

      this.progress.completed++;
      this.progress.successfulTrades++;
      this.progress.totalVolumeProcessed += amount;
      this.progress.lastExecutionTime = Date.now();

      await this.updateProgress();

      console.log(`   ✅ DCA ${this.config.direction}: ${result.signature}`);
      console.log(`   📈 Progress: ${this.progress.completed}/${this.config.numberOfOrders}`);
    } catch (error: any) {
      console.error(`   ❌ DCA order failed:`, error.message);
      
      this.progress.failedTrades++;
      await this.logTransaction(null, null, 'failed', error.message);
      await this.updateProgress();
    }
  }

  /**
   * Check if current time is within the specified time window
   */
  private isWithinTimeWindow(): boolean {
    if (!this.config.startTime && !this.config.endTime) {
      return true;
    }

    const now = Date.now();
    
    if (this.config.startTime && now < this.config.startTime) {
      return false;
    }

    if (this.config.endTime && now > this.config.endTime) {
      return false;
    }

    return true;
  }

  /**
   * Check if the quote price meets the configured limits
   */
  private isPriceAcceptable(quote: any, tokenDecimals: number): boolean {
    const outputAmount = Number(quote.outAmount);
    const inputAmount = Number(quote.inAmount);
    
    if (this.config.direction === 'buy' && this.config.maxBuyPrice) {
      // Calculate price: SOL per token
      const solPerToken = (inputAmount / Math.pow(10, 9)) / (outputAmount / Math.pow(10, tokenDecimals));
      if (solPerToken > this.config.maxBuyPrice) {
        console.log(`   Price ${solPerToken.toFixed(9)} SOL exceeds max ${this.config.maxBuyPrice} SOL`);
        return false;
      }
    }

    if (this.config.direction === 'sell' && this.config.minSellPrice) {
      // Calculate price: SOL per token
      const solPerToken = (outputAmount / Math.pow(10, 9)) / (inputAmount / Math.pow(10, tokenDecimals));
      if (solPerToken < this.config.minSellPrice) {
        console.log(`   Price ${solPerToken.toFixed(9)} SOL below min ${this.config.minSellPrice} SOL`);
        return false;
      }
    }

    return true;
  }

  /**
   * Log transaction to database
   */
  private async logTransaction(
    result: any | null,
    quote: any | null,
    status: 'pending' | 'confirmed' | 'failed',
    error?: string
  ): Promise<void> {
    const db = getDatabase();
    
    if (result && quote) {
      const inputMint = this.config.direction === 'buy' ? SOL_MINT : this.config.tokenAddress;
      const outputMint = this.config.direction === 'buy' ? this.config.tokenAddress : SOL_MINT;
      
      db.prepare(`
        INSERT INTO transactions (
          strategy_id, signature, type, input_token, output_token,
          input_amount, output_amount, dex_used, price, status, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        this.strategyId,
        result.signature,
        this.config.direction,
        inputMint,
        outputMint,
        result.inputAmount / Math.pow(10, 9),
        result.outputAmount / Math.pow(10, 9),
        result.dexUsed,
        result.priceImpact,
        status,
        Date.now()
      );
    } else {
      // Log failed attempt
      db.prepare(`
        INSERT INTO transactions (
          strategy_id, type, input_token, output_token,
          input_amount, output_amount, status, error, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        this.strategyId,
        this.config.direction,
        this.config.direction === 'buy' ? SOL_MINT : this.config.tokenAddress,
        this.config.direction === 'buy' ? this.config.tokenAddress : SOL_MINT,
        0,
        0,
        status,
        error || '',
        Date.now()
      );
    }
  }

  /**
   * Update progress in database
   */
  private async updateProgress(): Promise<void> {
    const db = getDatabase();
    db.prepare(`
      UPDATE strategies 
      SET progress = ?, updated_at = ? 
      WHERE id = ?
    `).run(
      JSON.stringify(this.progress),
      Date.now(),
      this.strategyId
    );
  }

  /**
   * Update strategy status
   */
  private async updateStrategyStatus(status: 'active' | 'paused' | 'stopped' | 'completed'): Promise<void> {
    const db = getDatabase();
    db.prepare(`
      UPDATE strategies 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `).run(status, Date.now(), this.strategyId);
  }

  /**
   * Get cron expression based on frequency
   */
  private getCronExpression(): string {
    const expressions: Record<string, string> = {
      'hourly': '0 * * * *',      // Every hour at :00
      '2h': '0 */2 * * *',         // Every 2 hours
      '4h': '0 */4 * * *',         // Every 4 hours
      '6h': '0 */6 * * *',         // Every 6 hours
      'daily': '0 0 * * *',        // Every day at midnight
    };

    if (this.config.frequency === 'custom' && this.config.customIntervalMinutes) {
      return `*/${this.config.customIntervalMinutes} * * * *`;
    }

    return expressions[this.config.frequency] || '0 * * * *';
  }

  /**
   * Pause the strategy
   */
  async pause(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      await this.updateStrategyStatus('paused');
      console.log(`⏸️ DCA strategy #${this.strategyId} paused`);
    }
  }

  /**
   * Resume the strategy
   */
  async resume(): Promise<void> {
    if (this.cronJob && !this.isRunning) {
      this.cronJob.start();
      this.isRunning = true;
      await this.updateStrategyStatus('active');
      console.log(`▶️ DCA strategy #${this.strategyId} resumed`);
    }
  }

  /**
   * Stop the strategy permanently
   */
  async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    await this.updateStrategyStatus('stopped');
    console.log(`⏹️ DCA strategy #${this.strategyId} stopped`);
  }

  /**
   * Complete the strategy
   */
  private async complete(): Promise<void> {
    await this.stop();
    await this.updateStrategyStatus('completed');
    console.log(`🎉 DCA strategy #${this.strategyId} completed!`);
  }

  /**
   * Get current progress
   */
  getProgress(): DCAProgress {
    return { ...this.progress };
  }

  /**
   * Get strategy ID
   */
  getStrategyId(): number {
    return this.strategyId;
  }

  /**
   * Check if strategy is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

