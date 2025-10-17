import { JupiterClient } from '../jupiter/client';
import { WalletManager } from '../wallet/manager';
import { getDatabase } from '../database/schema';
import { Keypair } from '@solana/web3.js';
import { FeeManager } from '../fees/manager';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface BundleReconcileConfig {
  tokenAddress: string;
  walletId?: string;
  
  // Bundle settings
  bundleType: 'instant' | 'delayed';  // Instant = all at once, Delayed = with delays
  
  // Trade amounts
  minBuyAmount: number;      // Min SOL per buy (e.g., 0.05)
  maxBuyAmount: number;      // Max SOL per buy (e.g., 0.2)
  buysPerBundle: number;     // How many buys before reconciling (e.g., 2)
  
  // Timing
  bundleInterval: number;    // Minutes between bundles
  delayBetweenTrades?: number; // For 'delayed' type: seconds between trades in bundle
  
  // Execution limits
  totalBundles: number;      // How many bundles to execute
  
  // Transaction settings
  slippageBps: number;
  priorityFeeLamports: number;
  useMultipleWallets: boolean;
}

export interface BundleReconcileProgress {
  bundlesCompleted: number;
  totalTrades: number;
  totalBuys: number;
  totalSells: number;
  totalSolVolume: number;    // Total SOL moved (buys + sells)
  lastBundleTime?: number;
  nextBundleTime?: number;
  currentBundleStatus?: string; // Status of current bundle execution
}

export class BundleReconcileStrategy {
  private strategyId: number;
  private config: BundleReconcileConfig;
  private jupiter: JupiterClient;
  private wallet: WalletManager;
  private feeManager: FeeManager;
  private intervalId: NodeJS.Timeout | null = null;
  private progress: BundleReconcileProgress;
  private isRunning: boolean = false;

  constructor(
    strategyId: number,
    config: BundleReconcileConfig,
    jupiter: JupiterClient,
    wallet: WalletManager,
    feeManager: FeeManager
  ) {
    this.strategyId = strategyId;
    this.config = config;
    this.jupiter = jupiter;
    this.wallet = wallet;
    this.feeManager = feeManager;
    this.progress = {
      bundlesCompleted: 0,
      totalTrades: 0,
      totalBuys: 0,
      totalSells: 0,
      totalSolVolume: 0,
    };
  }

  /**
   * Start the bundle reconcile strategy
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Bundle reconcile strategy already running');
      return;
    }

    this.isRunning = true;
    
    console.log(`📦 Starting ${this.config.bundleType.toUpperCase()} Bundle Reconcile Strategy #${this.strategyId}`);
    console.log(`   Token: ${this.config.tokenAddress}`);
    console.log(`   Pattern: ${this.config.buysPerBundle} buys → 1 reconciling sell`);
    console.log(`   Buy Range: ${this.config.minBuyAmount}-${this.config.maxBuyAmount} SOL`);
    console.log(`   Total Bundles: ${this.config.totalBundles}`);
    console.log(`   Interval: ${this.config.bundleInterval} minutes`);
    if (this.config.bundleType === 'delayed') {
      console.log(`   Delay Between Trades: ${this.config.delayBetweenTrades || 5} seconds`);
    }

    // Execute first bundle immediately
    await this.executeBundle();

    // Set up interval for subsequent bundles
    const intervalMs = this.config.bundleInterval * 60 * 1000;
    this.intervalId = setInterval(async () => {
      if (!this.isRunning) return;
      
      if (this.progress.bundlesCompleted >= this.config.totalBundles) {
        console.log(`✅ All ${this.config.totalBundles} bundles completed!`);
        await this.complete();
        return;
      }
      
      await this.executeBundle();
    }, intervalMs);

    await this.updateStrategyStatus('active');
  }

  /**
   * Execute one reconciling bundle
   */
  private async executeBundle(): Promise<void> {
    try {
      console.log(`\n📦 Bundle #${this.progress.bundlesCompleted + 1} Starting...`);
      this.progress.currentBundleStatus = 'executing';
      await this.updateProgress();

      // Generate random buy amounts
      const buyAmounts: number[] = [];
      let totalBuyAmount = 0;
      
      for (let i = 0; i < this.config.buysPerBundle; i++) {
        const amount = this.config.minBuyAmount + 
          (Math.random() * (this.config.maxBuyAmount - this.config.minBuyAmount));
        buyAmounts.push(amount);
        totalBuyAmount += amount;
      }

      console.log(`   📊 Generated ${this.config.buysPerBundle} buys totaling ${totalBuyAmount.toFixed(4)} SOL`);
      console.log(`   💡 Will reconcile with 1 sell of equivalent tokens`);

      if (this.config.bundleType === 'instant') {
        await this.executeInstantBundle(buyAmounts, totalBuyAmount);
      } else {
        await this.executeDelayedBundle(buyAmounts, totalBuyAmount);
      }

      this.progress.bundlesCompleted++;
      this.progress.currentBundleStatus = 'completed';
      this.progress.lastBundleTime = Date.now();
      this.progress.nextBundleTime = Date.now() + (this.config.bundleInterval * 60 * 1000);
      
      await this.updateProgress();
      
      console.log(`   ✅ Bundle #${this.progress.bundlesCompleted} complete!`);
      console.log(`   📊 Progress: ${this.progress.bundlesCompleted} / ${this.config.totalBundles} bundles`);

    } catch (error: any) {
      console.error(`   ❌ Bundle failed:`, error.message);
      this.progress.currentBundleStatus = 'failed';
      await this.updateProgress();
    }
  }

  /**
   * Execute instant bundle - all trades as fast as possible
   */
  private async executeInstantBundle(buyAmounts: number[], totalBuyAmount: number): Promise<void> {
    console.log(`   ⚡ INSTANT BUNDLE: All trades executing simultaneously...`);
    
    const wallets = this.getWallets();
    let totalTokensAccumulated = 0;
    
    // Execute all buys simultaneously
    const buyPromises = buyAmounts.map(async (amount, index) => {
      const wallet = wallets[index % wallets.length];
      return await this.executeBuy(amount, wallet, index + 1);
    });

    const buyResults = await Promise.allSettled(buyPromises);
    
    // Calculate total tokens from successful buys
    buyResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        totalTokensAccumulated += result.value.tokensReceived;
        this.progress.totalBuys++;
        this.progress.totalTrades++;
        this.progress.totalSolVolume += buyAmounts[index];
      }
    });

    console.log(`   ✅ All buys complete! Accumulated ${totalTokensAccumulated.toFixed(0)} tokens`);
    
    // Small delay before reconciling sell
    await this.sleep(500);

    // Execute reconciling sell immediately
    if (totalTokensAccumulated > 0) {
      console.log(`   📤 Executing reconciling SELL for ${totalTokensAccumulated.toFixed(0)} tokens...`);
      const wallet = wallets[0]; // Use main wallet for sell
      const sellResult = await this.executeSell(totalTokensAccumulated, wallet);
      
      if (sellResult) {
        this.progress.totalSells++;
        this.progress.totalTrades++;
        this.progress.totalSolVolume += sellResult.solReceived;
        console.log(`   ✅ Reconciling sell complete! Got ${sellResult.solReceived.toFixed(4)} SOL back`);
        console.log(`   ⚖️  Position reconciled: Net ${(totalBuyAmount - sellResult.solReceived).toFixed(4)} SOL difference`);
      }
    }
  }

  /**
   * Execute delayed bundle - trades with time delays
   */
  private async executeDelayedBundle(buyAmounts: number[], totalBuyAmount: number): Promise<void> {
    console.log(`   ⏱️  DELAYED BUNDLE: Trades executing with ${this.config.delayBetweenTrades || 5}s delays...`);
    
    const wallets = this.getWallets();
    let totalTokensAccumulated = 0;
    const delayMs = (this.config.delayBetweenTrades || 5) * 1000;

    // Execute buys one by one with delays
    for (let i = 0; i < buyAmounts.length; i++) {
      const amount = buyAmounts[i];
      const wallet = wallets[i % wallets.length];
      
      const buyResult = await this.executeBuy(amount, wallet, i + 1);
      if (buyResult) {
        totalTokensAccumulated += buyResult.tokensReceived;
        this.progress.totalBuys++;
        this.progress.totalTrades++;
        this.progress.totalSolVolume += amount;
      }
      
      // Delay before next buy (except after last one)
      if (i < buyAmounts.length - 1) {
        console.log(`   ⏳ Waiting ${this.config.delayBetweenTrades || 5} seconds...`);
        await this.sleep(delayMs);
      }
    }

    console.log(`   ✅ All buys complete! Accumulated ${totalTokensAccumulated.toFixed(0)} tokens`);
    
    // Delay before reconciling sell
    console.log(`   ⏳ Waiting ${this.config.delayBetweenTrades || 5} seconds before reconcile...`);
    await this.sleep(delayMs);

    // Execute reconciling sell
    if (totalTokensAccumulated > 0) {
      console.log(`   📤 Executing reconciling SELL for ${totalTokensAccumulated.toFixed(0)} tokens...`);
      const wallet = wallets[0];
      const sellResult = await this.executeSell(totalTokensAccumulated, wallet);
      
      if (sellResult) {
        this.progress.totalSells++;
        this.progress.totalTrades++;
        this.progress.totalSolVolume += sellResult.solReceived;
        console.log(`   ✅ Reconciling sell complete! Got ${sellResult.solReceived.toFixed(4)} SOL back`);
        console.log(`   ⚖️  Position reconciled: Net ${(totalBuyAmount - sellResult.solReceived).toFixed(4)} SOL difference`);
      }
    }
  }

  /**
   * Execute a single buy trade
   */
  private async executeBuy(
    solAmount: number, 
    keypair: Keypair, 
    tradeNumber: number
  ): Promise<{ tokensReceived: number } | null> {
    try {
      console.log(`      [Buy #${tradeNumber}] ${solAmount.toFixed(4)} SOL...`);

      // Get token info
      const tokenInfo = await this.jupiter.getTokenInfo(this.config.tokenAddress);
      if (!tokenInfo) throw new Error('Token not found');

      // Get quote for buying
      const amountInLamports = Math.floor(solAmount * Math.pow(10, 9));
      const quote = await this.jupiter.getQuote({
        inputMint: SOL_MINT,
        outputMint: this.config.tokenAddress,
        amount: amountInLamports,
        slippageBps: this.config.slippageBps,
        onlyDirectRoutes: true,
      });

      // Execute swap
      const result = await this.jupiter.executeSwap({
        quote,
        userKeypair: keypair,
        priorityFeeLamports: this.config.priorityFeeLamports,
      });

      const tokensReceived = Number(quote.outAmount) / Math.pow(10, tokenInfo.decimals);

      // Collect transaction fee
      try {
        const feeConfig = this.feeManager.getFeeConfig();
        if (feeConfig.feeEnabled && feeConfig.feeWalletAddress) {
          const tradeAmountSOL = solAmount;
          const feeAmountSOL = this.feeManager.calculateFee(tradeAmountSOL, feeConfig.feePercentage);
          const feeAmountLamports = Math.floor(feeAmountSOL * 1e9);
          
          if (feeAmountLamports > 0) {
            console.log(`      💰 Collecting ${feeConfig.feePercentage}% fee: ${feeAmountSOL.toFixed(6)} SOL`);
            const feeResult = await this.feeManager.transferFee({
              fromKeypair: keypair,
              feeAmount: feeAmountLamports,
              strategyId: this.strategyId,
            });
            
            if (feeResult.success && feeResult.signature) {
              console.log(`      ✅ Fee collected: ${feeResult.signature.substring(0, 16)}...`);
            }
          }
        }
      } catch (feeError: any) {
        console.error(`      ⚠️ Fee collection failed (trade still successful):`, feeError.message);
      }

      // Log transaction
      await this.logTransaction(result, quote, 'buy', 'confirmed');

      console.log(`      ✅ Got ${tokensReceived.toFixed(0)} tokens | Tx: ${result.signature.substring(0, 16)}...`);
      
      return { tokensReceived };
      
    } catch (error: any) {
      console.error(`      ❌ Buy failed: ${error.message}`);
      await this.logTransaction(null, null, 'buy', 'failed', error.message);
      return null;
    }
  }

  /**
   * Execute a single sell trade
   */
  private async executeSell(
    tokenAmount: number,
    keypair: Keypair
  ): Promise<{ solReceived: number } | null> {
    try {
      console.log(`      [Reconcile Sell] ${tokenAmount.toFixed(0)} tokens...`);

      // Get token info
      const tokenInfo = await this.jupiter.getTokenInfo(this.config.tokenAddress);
      if (!tokenInfo) throw new Error('Token not found');

      // Get quote for selling
      const amountInSmallestUnit = Math.floor(tokenAmount * Math.pow(10, tokenInfo.decimals));
      const quote = await this.jupiter.getQuote({
        inputMint: this.config.tokenAddress,
        outputMint: SOL_MINT,
        amount: amountInSmallestUnit,
        slippageBps: this.config.slippageBps,
        onlyDirectRoutes: true,
      });

      // Execute swap
      const result = await this.jupiter.executeSwap({
        quote,
        userKeypair: keypair,
        priorityFeeLamports: this.config.priorityFeeLamports,
      });

      const solReceived = Number(quote.outAmount) / Math.pow(10, 9);

      // Collect transaction fee
      try {
        const feeConfig = this.feeManager.getFeeConfig();
        if (feeConfig.feeEnabled && feeConfig.feeWalletAddress) {
          const tradeAmountSOL = solReceived;
          const feeAmountSOL = this.feeManager.calculateFee(tradeAmountSOL, feeConfig.feePercentage);
          const feeAmountLamports = Math.floor(feeAmountSOL * 1e9);
          
          if (feeAmountLamports > 0) {
            console.log(`      💰 Collecting ${feeConfig.feePercentage}% fee: ${feeAmountSOL.toFixed(6)} SOL`);
            const feeResult = await this.feeManager.transferFee({
              fromKeypair: keypair,
              feeAmount: feeAmountLamports,
              strategyId: this.strategyId,
            });
            
            if (feeResult.success && feeResult.signature) {
              console.log(`      ✅ Fee collected: ${feeResult.signature.substring(0, 16)}...`);
            }
          }
        }
      } catch (feeError: any) {
        console.error(`      ⚠️ Fee collection failed (trade still successful):`, feeError.message);
      }

      // Log transaction
      await this.logTransaction(result, quote, 'sell', 'confirmed');

      console.log(`      ✅ Got ${solReceived.toFixed(4)} SOL | Tx: ${result.signature.substring(0, 16)}...`);
      
      return { solReceived };
      
    } catch (error: any) {
      console.error(`      ❌ Sell failed: ${error.message}`);
      await this.logTransaction(null, null, 'sell', 'failed', error.message);
      return null;
    }
  }

  /**
   * Get wallets to use
   */
  private getWallets(): Keypair[] {
    if (this.config.useMultipleWallets) {
      return [this.wallet.getMainKeypair(), ...this.wallet.getDerivedKeypairs()];
    }
    // Use the selected wallet from config, or main wallet if not specified
    const selectedKeypair = this.wallet.getKeypairByWalletId(this.config.walletId);
    return [selectedKeypair];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stop the strategy
   */
  async stop(): Promise<void> {
    console.log(`⏹️ Stopping bundle reconcile strategy #${this.strategyId}`);
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    await this.updateStrategyStatus('stopped');
  }

  /**
   * Pause the strategy
   */
  async pause(): Promise<void> {
    console.log(`⏸️ Pausing bundle reconcile strategy #${this.strategyId}`);
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    await this.updateStrategyStatus('paused');
  }

  /**
   * Complete the strategy
   */
  private async complete(): Promise<void> {
    console.log(`✅ Bundle reconcile strategy #${this.strategyId} completed`);
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    await this.updateStrategyStatus('completed');
  }

  /**
   * Update strategy status in database
   */
  private async updateStrategyStatus(status: string): Promise<void> {
    const db = getDatabase();
    db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, Date.now(), this.strategyId);
  }

  /**
   * Update progress in database
   */
  private async updateProgress(): Promise<void> {
    const db = getDatabase();
    db.prepare('UPDATE strategies SET progress = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(this.progress), Date.now(), this.strategyId);
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
    } else if (error) {
      db.prepare(`
        INSERT INTO transactions (
          strategy_id, signature, type, input_token, output_token,
          input_amount, output_amount, status, error, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        this.strategyId,
        'failed',
        direction,
        direction === 'buy' ? SOL_MINT : this.config.tokenAddress,
        direction === 'buy' ? this.config.tokenAddress : SOL_MINT,
        0,
        0,
        status,
        error,
        Date.now()
      );
    }
  }
}



