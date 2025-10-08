import { JupiterClient } from '../jupiter/client';
import { WalletManager } from '../wallet/manager';
import { getDatabase } from '../database/schema';
import { Keypair } from '@solana/web3.js';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface BundleConfig {
  tokenAddress: string;
  tradesPerBundle: number;
  minutesBetweenBundles: number;
  minTradeSizeSol: number;
  maxTradeSizeSol: number;
  useMultipleWallets: boolean;
  rotateWallets: boolean;
  slippageBps: number;
  priorityFeeLamports: number;
  tradeSizeDistribution: 'random' | 'equal' | 'weighted';
}

export interface BundleProgress {
  bundlesCompleted: number;
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalVolumeProcessed: number;
  lastBundleTime?: number;
}

export class BundleStrategy {
  private strategyId: number;
  private config: BundleConfig;
  private jupiter: JupiterClient;
  private wallet: WalletManager;
  private intervalId: NodeJS.Timeout | null = null;
  private progress: BundleProgress;
  private isRunning: boolean = false;

  constructor(
    strategyId: number,
    config: BundleConfig,
    jupiter: JupiterClient,
    wallet: WalletManager
  ) {
    this.strategyId = strategyId;
    this.config = config;
    this.jupiter = jupiter;
    this.wallet = wallet;
    this.progress = {
      bundlesCompleted: 0,
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalVolumeProcessed: 0,
    };
  }

  /**
   * Start the bundle trading strategy
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Bundle strategy already running');
      return;
    }

    this.isRunning = true;

    console.log(`🚀 Starting Bundle Trading strategy #${this.strategyId}`);
    console.log(`   Token: ${this.config.tokenAddress}`);
    console.log(`   Trades per bundle: ${this.config.tradesPerBundle}`);
    console.log(`   Interval: ${this.config.minutesBetweenBundles} minutes`);
    console.log(`   Trade size: ${this.config.minTradeSizeSol} - ${this.config.maxTradeSizeSol} SOL`);

    // Execute first bundle immediately
    await this.executeBundle();

    // Schedule subsequent bundles
    this.intervalId = setInterval(
      () => this.executeBundle(),
      this.config.minutesBetweenBundles * 60 * 1000
    );

    await this.updateStrategyStatus('active');
  }

  /**
   * Execute a bundle of trades
   */
  private async executeBundle(): Promise<void> {
    if (!this.isRunning) return;

    console.log(`📦 Starting bundle #${this.progress.bundlesCompleted + 1} with ${this.config.tradesPerBundle} trades`);

    const wallets = this.getWalletsForBundle();
    const tradeSizes = this.generateTradeSizes();
    const tradePromises: Promise<any>[] = [];

    for (let i = 0; i < this.config.tradesPerBundle; i++) {
      const wallet = this.selectWallet(wallets, i);
      const tradeSize = tradeSizes[i];
      const direction = Math.random() > 0.5 ? 'buy' : 'sell';

      // Execute trade (don't await yet, collect promises)
      const tradePromise = this.executeTrade(tradeSize, direction, wallet, i + 1)
        .catch(error => ({ error, index: i + 1 }));

      tradePromises.push(tradePromise);

      // Small delay between starting trades (250-1500ms)
      await this.sleep(250 + Math.random() * 1250);
    }

    // Wait for all trades to complete
    console.log(`   ⏳ Waiting for all trades to complete...`);
    const results = await Promise.allSettled(tradePromises);

    // Count successful/failed trades
    const successful = results.filter(r => r.status === 'fulfilled' && !(r.value as any)?.error).length;
    const failed = results.length - successful;

    this.progress.bundlesCompleted++;
    this.progress.successfulTrades += successful;
    this.progress.failedTrades += failed;
    this.progress.lastBundleTime = Date.now();

    await this.updateProgress();

    console.log(`   ✅ Bundle completed: ${successful}/${this.config.tradesPerBundle} successful`);
    console.log(`   📊 Total: ${this.progress.bundlesCompleted} bundles, ${this.progress.totalTrades} trades`);
  }

  /**
   * Execute a single trade
   */
  private async executeTrade(
    amount: number,
    direction: 'buy' | 'sell',
    keypair: Keypair,
    tradeNumber: number
  ): Promise<void> {
    try {
      console.log(`   [${tradeNumber}/${this.config.tradesPerBundle}] ${direction.toUpperCase()} ${amount.toFixed(4)} SOL`);

      // Get token info
      const tokenInfo = await this.jupiter.getTokenInfo(this.config.tokenAddress);
      if (!tokenInfo) {
        throw new Error('Token not found');
      }

      // Determine input/output
      const inputMint = direction === 'buy' ? SOL_MINT : this.config.tokenAddress;
      const outputMint = direction === 'buy' ? this.config.tokenAddress : SOL_MINT;
      const inputDecimals = direction === 'buy' ? 9 : tokenInfo.decimals;
      const amountInSmallestUnit = Math.floor(amount * Math.pow(10, inputDecimals));

      // Get quote
      const quote = await this.jupiter.getQuote({
        inputMint,
        outputMint,
        amount: amountInSmallestUnit,
        slippageBps: this.config.slippageBps,
        onlyDirectRoutes: true, // Faster for bundles
      });

      // Execute swap
      const result = await this.jupiter.executeSwap({
        quote,
        userKeypair: keypair,
        priorityFeeLamports: this.config.priorityFeeLamports,
      });

      // Update progress
      this.progress.totalTrades++;
      this.progress.totalVolumeProcessed += amount;

      // Log transaction
      await this.logTransaction(result, quote, direction, 'confirmed');

      console.log(`      ✅ ${result.signature.substring(0, 16)}...`);
    } catch (error: any) {
      console.error(`      ❌ Failed: ${error.message}`);
      this.progress.totalTrades++;
      await this.logTransaction(null, null, direction, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Get wallets to use for bundle
   */
  private getWalletsForBundle(): Keypair[] {
    if (!this.config.useMultipleWallets) {
      return [this.wallet.getMainKeypair()];
    }

    const allWallets = [this.wallet.getMainKeypair(), ...this.wallet.getDerivedKeypairs()];
    
    // Ensure we have enough wallets
    if (allWallets.length < this.config.tradesPerBundle && this.config.rotateWallets) {
      console.warn(`⚠️  Not enough wallets for rotation. Have ${allWallets.length}, need ${this.config.tradesPerBundle}`);
    }

    return allWallets;
  }

  /**
   * Select wallet for a specific trade
   */
  private selectWallet(wallets: Keypair[], tradeIndex: number): Keypair {
    if (wallets.length === 1) {
      return wallets[0];
    }

    if (this.config.rotateWallets) {
      // Rotate through wallets sequentially
      return wallets[tradeIndex % wallets.length];
    }

    // Random wallet
    return wallets[Math.floor(Math.random() * wallets.length)];
  }

  /**
   * Generate trade sizes for the bundle
   */
  private generateTradeSizes(): number[] {
    const sizes: number[] = [];

    switch (this.config.tradeSizeDistribution) {
      case 'equal':
        // All trades same size (average)
        const avgSize = (this.config.minTradeSizeSol + this.config.maxTradeSizeSol) / 2;
        for (let i = 0; i < this.config.tradesPerBundle; i++) {
          sizes.push(avgSize);
        }
        break;

      case 'weighted':
        // Pareto distribution (80/20 rule - few large, many small)
        for (let i = 0; i < this.config.tradesPerBundle; i++) {
          const rand = Math.random();
          const weight = Math.pow(rand, 2); // Skew towards smaller values
          const size = this.config.minTradeSizeSol + 
            (this.config.maxTradeSizeSol - this.config.minTradeSizeSol) * weight;
          sizes.push(size);
        }
        break;

      case 'random':
      default:
        // Uniform random distribution
        for (let i = 0; i < this.config.tradesPerBundle; i++) {
          const size = this.config.minTradeSizeSol + 
            Math.random() * (this.config.maxTradeSizeSol - this.config.minTradeSizeSol);
          sizes.push(size);
        }
        break;
    }

    return sizes;
  }

  /**
   * Log transaction to database
   */
  private async logTransaction(
    result: any | null,
    quote: any | null,
    direction: 'buy' | 'sell',
    status: 'confirmed' | 'failed',
    error?: string
  ): Promise<void> {
    const db = getDatabase();

    if (result && quote) {
      const inputMint = direction === 'buy' ? SOL_MINT : this.config.tokenAddress;
      const outputMint = direction === 'buy' ? this.config.tokenAddress : SOL_MINT;

      db.prepare(`
        INSERT INTO transactions (
          strategy_id, signature, type, input_token, output_token,
          input_amount, output_amount, dex_used, price, status, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        this.strategyId,
        result.signature,
        direction,
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
      db.prepare(`
        INSERT INTO transactions (
          strategy_id, type, input_token, output_token,
          input_amount, output_amount, status, error, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        this.strategyId,
        direction,
        direction === 'buy' ? SOL_MINT : this.config.tokenAddress,
        direction === 'buy' ? this.config.tokenAddress : SOL_MINT,
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
  private async updateStrategyStatus(status: 'active' | 'paused' | 'stopped'): Promise<void> {
    const db = getDatabase();
    db.prepare(`
      UPDATE strategies 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `).run(status, Date.now(), this.strategyId);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Pause the strategy
   */
  async pause(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      await this.updateStrategyStatus('paused');
      console.log(`⏸️ Bundle strategy #${this.strategyId} paused`);
    }
  }

  /**
   * Resume the strategy
   */
  async resume(): Promise<void> {
    if (!this.isRunning) {
      await this.start();
      console.log(`▶️ Bundle strategy #${this.strategyId} resumed`);
    }
  }

  /**
   * Stop the strategy
   */
  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    await this.updateStrategyStatus('stopped');
    console.log(`⏹️ Bundle strategy #${this.strategyId} stopped`);
  }

  /**
   * Get current progress
   */
  getProgress(): BundleProgress {
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




