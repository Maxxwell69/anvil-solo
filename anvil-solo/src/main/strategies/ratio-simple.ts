import { JupiterClient } from '../jupiter/client';
import { WalletManager } from '../wallet/manager';
import { getDatabase } from '../database/schema';
import { Keypair } from '@solana/web3.js';
import { FeeManager } from '../fees/manager';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface RatioSimpleConfig {
  tokenAddress: string;
  walletId?: string;
  
  // Ratio settings
  buyCount: number;           // e.g., 3 (do 3 buys)
  sellCount: number;          // e.g., 2 (then 2 sells)
  
  // Initial trade settings
  initialSolPerTrade: number; // e.g., 0.1 SOL for first buy
  totalSolLimit: number;      // e.g., 10 SOL total to trade
  
  // Trade timing
  intervalMinutes: number;    // Minutes between each trade
  randomizeTiming: boolean;   // Add ±20% randomization
  
  // Transaction settings
  slippageBps: number;
  priorityFeeLamports: number;
  useMultipleWallets: boolean;
}

export interface RatioSimpleProgress {
  // Current cycle progress
  currentCycle: number;
  tradesInCycle: number;      // How many trades done in this cycle
  
  // Token amount (set by first buy)
  baseTokenAmount: number;    // Amount of tokens per trade (from first buy)
  
  // Overall progress
  totalTrades: number;
  totalBuyTrades: number;
  totalSellTrades: number;
  totalSolUsed: number;       // Total SOL spent/received
  
  // State
  lastTradeTime?: number;
  nextTradeTime?: number;
}

export class RatioSimpleStrategy {
  private strategyId: number;
  private config: RatioSimpleConfig;
  private jupiter: JupiterClient;
  private wallet: WalletManager;
  private feeManager: FeeManager;
  private intervalId: NodeJS.Timeout | null = null;
  private progress: RatioSimpleProgress;
  private isRunning: boolean = false;

  constructor(
    strategyId: number,
    config: RatioSimpleConfig,
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
      currentCycle: 0,
      tradesInCycle: 0,
      baseTokenAmount: 0,
      totalTrades: 0,
      totalBuyTrades: 0,
      totalSellTrades: 0,
      totalSolUsed: 0,
    };
  }

  /**
   * Start the ratio trading strategy
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Ratio strategy already running');
      return;
    }

    this.isRunning = true;
    
    console.log(`🎯 Starting Simple Ratio Trading #${this.strategyId}`);
    console.log(`   Token: ${this.config.tokenAddress}`);
    console.log(`   Ratio: ${this.config.buyCount} buys : ${this.config.sellCount} sells`);
    console.log(`   Initial SOL: ${this.config.initialSolPerTrade} SOL per trade`);
    console.log(`   Total Limit: ${this.config.totalSolLimit} SOL`);
    console.log(`   Interval: ${this.config.intervalMinutes} minutes`);

    // If this is the first run, do the initial buy to set token amount
    if (this.progress.baseTokenAmount === 0) {
      console.log(`\n📥 Executing INITIAL BUY to determine token amount...`);
      await this.executeInitialBuy();
    }

    // Start trading loop
    const baseInterval = this.config.intervalMinutes * 60 * 1000; // Convert to milliseconds
    
    const executeTrade = async () => {
      if (!this.isRunning) return;

      // Check if we've hit SOL limit
      if (this.progress.totalSolUsed >= this.config.totalSolLimit) {
        console.log(`✅ SOL limit reached (${this.progress.totalSolUsed.toFixed(4)} / ${this.config.totalSolLimit} SOL)`);
        await this.complete();
        return;
      }

      await this.executeNextTrade();

      // Schedule next trade with optional randomization
      let nextInterval = baseInterval;
      if (this.config.randomizeTiming) {
        nextInterval = baseInterval * (0.8 + Math.random() * 0.4); // ±20%
      }

      this.intervalId = setTimeout(executeTrade, nextInterval);
      this.progress.nextTradeTime = Date.now() + nextInterval;
      await this.updateProgress();
    };

    // Start first trade
    executeTrade();

    await this.updateStrategyStatus('active');
  }

  /**
   * Execute the initial buy to determine token amount
   */
  private async executeInitialBuy(): Promise<void> {
    try {
      const keypair = this.wallet.getMainKeypair();
      
      // Get token info
      const tokenInfo = await this.jupiter.getTokenInfo(this.config.tokenAddress);
      if (!tokenInfo) {
        throw new Error('Token not found');
      }

      console.log(`   Buying with ${this.config.initialSolPerTrade} SOL...`);

      // Get quote for buying with SOL
      const amountInLamports = Math.floor(this.config.initialSolPerTrade * Math.pow(10, 9));
      const quote = await this.jupiter.getQuote({
        inputMint: SOL_MINT,
        outputMint: this.config.tokenAddress,
        amount: amountInLamports,
        slippageBps: this.config.slippageBps,
      });

      // Execute swap
      const result = await this.jupiter.executeSwap({
        quote,
        userKeypair: keypair,
        priorityFeeLamports: this.config.priorityFeeLamports,
      });

      // Collect transaction fee
      try {
        const feeConfig = this.feeManager.getFeeConfig();
        if (feeConfig.feeEnabled && feeConfig.feeWalletAddress) {
          const tradeAmountSOL = this.config.initialSolPerTrade;
          const feeAmountSOL = this.feeManager.calculateFee(tradeAmountSOL, feeConfig.feePercentage);
          const feeAmountLamports = Math.floor(feeAmountSOL * 1e9);
          
          if (feeAmountLamports > 0) {
            console.log(`   💰 Collecting ${feeConfig.feePercentage}% fee: ${feeAmountSOL.toFixed(6)} SOL`);
            const feeResult = await this.feeManager.transferFee({
              fromKeypair: keypair,
              feeAmount: feeAmountLamports,
              strategyId: this.strategyId,
            });
            
            if (feeResult.success && feeResult.signature) {
              console.log(`   ✅ Fee collected: ${feeResult.signature}`);
            }
          }
        }
      } catch (feeError: any) {
        console.error(`   ⚠️ Fee collection failed (trade still successful):`, feeError.message);
      }

      // Calculate token amount received
      const tokensReceived = Number(quote.outAmount) / Math.pow(10, tokenInfo.decimals);
      
      // Set this as the base token amount for all future trades
      this.progress.baseTokenAmount = tokensReceived;
      this.progress.totalBuyTrades = 1;
      this.progress.totalTrades = 1;
      this.progress.totalSolUsed = this.config.initialSolPerTrade;
      this.progress.lastTradeTime = Date.now();
      
      // Count this as the first trade in the cycle
      this.progress.tradesInCycle = 1; // Initial buy counts as first buy!

      console.log(`   ✅ Initial buy complete!`);
      console.log(`   📊 Base token amount set: ${tokensReceived.toFixed(2)} tokens`);
      console.log(`   💡 All future trades will use ${tokensReceived.toFixed(2)} tokens`);
      console.log(`   🔄 This counts as Buy #1 in the pattern`);

      // Log transaction
      await this.logTransaction(result, quote, 'buy', 'confirmed');
      await this.updateProgress();

    } catch (error: any) {
      console.error(`   ❌ Initial buy failed:`, error.message);
      throw error;
    }
  }

  /**
   * Execute the next trade in the pattern
   */
  private async executeNextTrade(): Promise<void> {
    try {
      // Determine if this should be a buy or sell based on ratio pattern
      const totalInPattern = this.config.buyCount + this.config.sellCount;
      const positionInCycle = this.progress.tradesInCycle % totalInPattern;
      
      // First buyCount trades in cycle are buys, rest are sells
      const isBuy = positionInCycle < this.config.buyCount;
      const direction = isBuy ? 'buy' : 'sell';

      console.log(`\n📊 Cycle ${this.progress.currentCycle + 1}, Trade ${this.progress.tradesInCycle + 1}/${totalInPattern} (${direction.toUpperCase()})`);
      console.log(`   Using base amount: ${this.progress.baseTokenAmount.toFixed(2)} tokens`);

      // Select wallet
      const wallets = this.config.useMultipleWallets
        ? [this.wallet.getMainKeypair(), ...this.wallet.getDerivedKeypairs()]
        : [this.wallet.getMainKeypair()];
      const keypair = wallets[Math.floor(Math.random() * wallets.length)];

      // Get token info
      const tokenInfo = await this.jupiter.getTokenInfo(this.config.tokenAddress);
      if (!tokenInfo) {
        throw new Error('Token not found');
      }

      let quote;
      
      if (isBuy) {
        // BUY: We want to buy baseTokenAmount worth of tokens
        // First, we need to get a quote to see how much SOL that costs
        const tokenAmountInSmallestUnit = Math.floor(this.progress.baseTokenAmount * Math.pow(10, tokenInfo.decimals));
        
        // Get a reverse quote (we know output amount, need input amount)
        // For simplicity, we'll do a regular quote with estimated SOL and adjust
        const estimatedSol = this.config.initialSolPerTrade;
        const estimatedLamports = Math.floor(estimatedSol * Math.pow(10, 9));
        
        quote = await this.jupiter.getQuote({
          inputMint: SOL_MINT,
          outputMint: this.config.tokenAddress,
          amount: estimatedLamports,
          slippageBps: this.config.slippageBps,
        });

      } else {
        // SELL: Sell baseTokenAmount of tokens
        const tokenAmountInSmallestUnit = Math.floor(this.progress.baseTokenAmount * Math.pow(10, tokenInfo.decimals));
        
        quote = await this.jupiter.getQuote({
          inputMint: this.config.tokenAddress,
          outputMint: SOL_MINT,
          amount: tokenAmountInSmallestUnit,
          slippageBps: this.config.slippageBps,
        });
      }

      // Execute swap
      const result = await this.jupiter.executeSwap({
        quote,
        userKeypair: keypair,
        priorityFeeLamports: this.config.priorityFeeLamports,
      });

      // Calculate SOL amount for this trade
      const solAmount = isBuy 
        ? Number(quote.inAmount) / Math.pow(10, 9)
        : Number(quote.outAmount) / Math.pow(10, 9);

      // Collect transaction fee
      try {
        const feeConfig = this.feeManager.getFeeConfig();
        if (feeConfig.feeEnabled && feeConfig.feeWalletAddress) {
          const tradeAmountSOL = solAmount;
          const feeAmountSOL = this.feeManager.calculateFee(tradeAmountSOL, feeConfig.feePercentage);
          const feeAmountLamports = Math.floor(feeAmountSOL * 1e9);
          
          if (feeAmountLamports > 0) {
            console.log(`   💰 Collecting ${feeConfig.feePercentage}% fee: ${feeAmountSOL.toFixed(6)} SOL`);
            const feeResult = await this.feeManager.transferFee({
              fromKeypair: keypair,
              feeAmount: feeAmountLamports,
              strategyId: this.strategyId,
            });
            
            if (feeResult.success && feeResult.signature) {
              console.log(`   ✅ Fee collected: ${feeResult.signature}`);
            }
          }
        }
      } catch (feeError: any) {
        console.error(`   ⚠️ Fee collection failed (trade still successful):`, feeError.message);
      }

      // Update progress
      this.progress.totalTrades++;
      if (isBuy) {
        this.progress.totalBuyTrades++;
      } else {
        this.progress.totalSellTrades++;
      }
      this.progress.totalSolUsed += solAmount;
      this.progress.tradesInCycle++;
      this.progress.lastTradeTime = Date.now();

      // If we completed the cycle, increment cycle counter and reset
      if (this.progress.tradesInCycle >= totalInPattern) {
        this.progress.currentCycle++;
        this.progress.tradesInCycle = 0;
        console.log(`   🔄 Cycle ${this.progress.currentCycle} completed! Starting new cycle...`);
      }

      // Log transaction
      await this.logTransaction(result, quote, direction, 'confirmed');
      await this.updateProgress();

      console.log(`   ✅ ${direction.toUpperCase()}: ${solAmount.toFixed(4)} SOL`);
      console.log(`   📊 Progress: ${this.progress.totalSolUsed.toFixed(4)} / ${this.config.totalSolLimit} SOL used`);

    } catch (error: any) {
      console.error(`   ❌ Trade failed:`, error.message);
      // Don't stop the strategy, just log and continue
    }
  }

  /**
   * Stop the strategy
   */
  async stop(): Promise<void> {
    console.log(`⏹️ Stopping ratio strategy #${this.strategyId}`);
    this.isRunning = false;
    
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    await this.updateStrategyStatus('stopped');
  }

  /**
   * Pause the strategy
   */
  async pause(): Promise<void> {
    console.log(`⏸️ Pausing ratio strategy #${this.strategyId}`);
    this.isRunning = false;
    
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    await this.updateStrategyStatus('paused');
  }

  /**
   * Complete the strategy
   */
  private async complete(): Promise<void> {
    console.log(`✅ Ratio strategy #${this.strategyId} completed`);
    this.isRunning = false;
    
    if (this.intervalId) {
      clearTimeout(this.intervalId);
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
    result: any,
    quote: any,
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
    }
  }
}

