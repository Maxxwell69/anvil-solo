import { JupiterClient } from '../jupiter/client';
import { WalletManager } from '../wallet/manager';
import { getDatabase } from '../database/schema';
import { Keypair } from '@solana/web3.js';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface RatioConfig {
  tokenAddress: string;
  dailyVolumeSol: number;
  buyRatio: number; // 0-100 (e.g., 60 = 60%)
  sellRatio: number; // 0-100 (e.g., 40 = 40%)
  tradesPerHour: number;
  targetTokenBalance: number;
  rebalanceThresholdPercent: number;
  randomizeTiming: boolean;
  randomizeAmount: boolean;
  slippageBps: number;
  priorityFeeLamports: number;
  useMultipleWallets: boolean;
}

export interface RatioProgress {
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  volumeProcessedToday: number;
  currentTokenBalance: number;
  lastTradeTime?: number;
  lastRebalanceTime?: number;
  isReversed: boolean; // NEW: Track if ratio is reversed
  reversalCount: number; // NEW: Track how many times reversed
}

export class RatioStrategy {
  private strategyId: number;
  private config: RatioConfig;
  private jupiter: JupiterClient;
  private wallet: WalletManager;
  private intervalId: NodeJS.Timeout | null = null;
  private progress: RatioProgress;
  private isRunning: boolean = false;
  private dailyStartTime: number = Date.now();

  constructor(
    strategyId: number,
    config: RatioConfig,
    jupiter: JupiterClient,
    wallet: WalletManager
  ) {
    this.strategyId = strategyId;
    this.config = config;
    this.jupiter = jupiter;
    this.wallet = wallet;
    this.progress = {
      totalTrades: 0,
      buyTrades: 0,
      sellTrades: 0,
      volumeProcessedToday: 0,
      currentTokenBalance: 0,
      isReversed: false, // Start with normal ratio
      reversalCount: 0, // Track reversals
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
    
    console.log(`🚀 Starting Ratio Trading strategy #${this.strategyId}`);
    console.log(`   Token: ${this.config.tokenAddress}`);
    console.log(`   Daily Volume: ${this.config.dailyVolumeSol} SOL`);
    console.log(`   Ratio: ${this.config.buyRatio}% BUY / ${this.config.sellRatio}% SELL`);
    console.log(`   Trades/hour: ${this.config.tradesPerHour}`);

    // Get initial token balance
    await this.updateCurrentBalance();

    // Calculate trade intervals
    const tradesPerDay = this.config.tradesPerHour * 24;
    const baseTradeSize = this.config.dailyVolumeSol / tradesPerDay;
    const baseInterval = (60 / this.config.tradesPerHour) * 60 * 1000; // milliseconds

    // Start trading loop
    const executeTrade = async () => {
      if (!this.isRunning) return;

      // Check if we need to reset daily volume
      await this.checkDailyReset();

      // Check if we've hit daily volume target
      if (this.progress.volumeProcessedToday >= this.config.dailyVolumeSol) {
        console.log(`✅ Daily volume target reached. Waiting for next day...`);
        setTimeout(executeTrade, 60000); // Check again in 1 minute
        return;
      }

      try {
        await this.executeSingleTrade(baseTradeSize);
        await this.checkAndRebalance();
      } catch (error: any) {
        console.error(`Ratio trade failed:`, error.message);
      }

      // Schedule next trade with optional randomization
      const nextInterval = this.config.randomizeTiming
        ? baseInterval * (0.8 + Math.random() * 0.4) // ±20%
        : baseInterval;

      this.intervalId = setTimeout(executeTrade, nextInterval);
    };

    // Start first trade
    executeTrade();

    await this.updateStrategyStatus('active');
  }

  /**
   * Execute a single trade
   */
  private async executeSingleTrade(baseAmount: number): Promise<void> {
    // Check if we need to reverse the ratio due to resource constraints
    await this.checkAndReverseRatio();
    
    // Determine direction based on current ratio (may be reversed)
    const roll = Math.random() * 100;
    const currentBuyRatio = this.progress.isReversed ? this.config.sellRatio : this.config.buyRatio;
    const direction = roll < currentBuyRatio ? 'buy' : 'sell';

    // Randomize amount if enabled
    let amount = baseAmount;
    if (this.config.randomizeAmount) {
      amount = baseAmount * (0.85 + Math.random() * 0.3); // ±15%
    }

    console.log(`📊 Executing ${direction.toUpperCase()} trade: ${amount.toFixed(4)} SOL`);

    try {
      // Select wallet
      const wallets = this.config.useMultipleWallets
        ? [this.wallet.getMainKeypair(), ...this.wallet.getDerivedKeypairs()]
        : [this.wallet.getMainKeypair()];
      
      const selectedWallet = wallets[Math.floor(Math.random() * wallets.length)];

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
      });

      // Execute swap
      const result = await this.jupiter.executeSwap({
        quote,
        userKeypair: selectedWallet,
        priorityFeeLamports: this.config.priorityFeeLamports,
      });

      // Update progress
      this.progress.totalTrades++;
      if (direction === 'buy') {
        this.progress.buyTrades++;
        const outputAmount = Number(quote.outAmount) / Math.pow(10, tokenInfo.decimals);
        this.progress.currentTokenBalance += outputAmount;
      } else {
        this.progress.sellTrades++;
        this.progress.currentTokenBalance -= amount;
      }
      this.progress.volumeProcessedToday += amount;
      this.progress.lastTradeTime = Date.now();

      // Log transaction
      await this.logTransaction(result, quote, direction, 'confirmed');
      await this.updateProgress();

      console.log(`   ✅ ${direction.toUpperCase()}: ${result.signature}`);
      console.log(`   📊 Today: ${this.progress.volumeProcessedToday.toFixed(2)}/${this.config.dailyVolumeSol} SOL`);
      console.log(`   🏦 Balance: ${this.progress.currentTokenBalance.toFixed(2)} tokens`);
    } catch (error: any) {
      console.error(`   ❌ Trade failed:`, error.message);
      await this.logTransaction(null, null, direction, 'failed', error.message);
    }
  }

  /**
   * Check if rebalancing is needed and execute
   */
  private async checkAndRebalance(): Promise<void> {
    if (this.config.targetTokenBalance === 0) return;

    const deviation = Math.abs(this.progress.currentTokenBalance - this.config.targetTokenBalance);
    const deviationPercent = (deviation / this.config.targetTokenBalance) * 100;

    if (deviationPercent > this.config.rebalanceThresholdPercent) {
      const direction = this.progress.currentTokenBalance > this.config.targetTokenBalance ? 'sell' : 'buy';
      const rebalanceAmount = deviation;

      console.log(`🔄 Rebalancing needed:`);
      console.log(`   Current: ${this.progress.currentTokenBalance.toFixed(2)} tokens`);
      console.log(`   Target: ${this.config.targetTokenBalance.toFixed(2)} tokens`);
      console.log(`   Action: ${direction.toUpperCase()} ${rebalanceAmount.toFixed(2)} tokens`);

      try {
        const tokenInfo = await this.jupiter.getTokenInfo(this.config.tokenAddress);
        if (!tokenInfo) throw new Error('Token not found');

        const inputMint = direction === 'buy' ? SOL_MINT : this.config.tokenAddress;
        const outputMint = direction === 'buy' ? this.config.tokenAddress : SOL_MINT;
        const inputDecimals = direction === 'buy' ? 9 : tokenInfo.decimals;

        // For buy: we need to calculate SOL amount to get desired tokens
        // For sell: we use the token amount directly
        const amountInSmallestUnit = Math.floor(rebalanceAmount * Math.pow(10, inputDecimals));

        const quote = await this.jupiter.getQuote({
          inputMint,
          outputMint,
          amount: amountInSmallestUnit,
          slippageBps: this.config.slippageBps,
        });

        const result = await this.jupiter.executeSwap({
          quote,
          userKeypair: this.wallet.getMainKeypair(),
          priorityFeeLamports: this.config.priorityFeeLamports,
        });

        // Update balance
        if (direction === 'buy') {
          const outputAmount = Number(quote.outAmount) / Math.pow(10, tokenInfo.decimals);
          this.progress.currentTokenBalance += outputAmount;
        } else {
          this.progress.currentTokenBalance -= rebalanceAmount;
        }

        this.progress.lastRebalanceTime = Date.now();
        await this.logTransaction(result, quote, direction, 'confirmed');
        await this.updateProgress();

        console.log(`   ✅ Rebalanced: ${result.signature}`);
      } catch (error: any) {
        console.error(`   ❌ Rebalance failed:`, error.message);
      }
    }
  }

  /**
   * Check balances and reverse ratio if needed
   * If SOL runs out → flip to selling (builds SOL back up)
   * If tokens run out → flip to buying (accumulates tokens)
   */
  private async checkAndReverseRatio(): Promise<void> {
    try {
      // Get current SOL balance
      const solBalance = await this.wallet.getBalance(
        this.wallet.getMainKeypair().publicKey.toBase58()
      );
      
      // Get current token balance
      await this.updateCurrentBalance();
      
      const MIN_SOL_REQUIRED = 0.01; // Need at least 0.01 SOL for gas + trades
      const MIN_TOKEN_REQUIRED = 0.001; // Minimum tokens to continue selling
      
      // Scenario 1: Running out of SOL (can't buy anymore)
      if (solBalance < MIN_SOL_REQUIRED && !this.progress.isReversed) {
        console.log(`⚠️  LOW SOL WARNING: ${solBalance.toFixed(4)} SOL remaining`);
        console.log(`🔄 REVERSING RATIO: Was ${this.config.buyRatio}% buy → Now ${this.config.buyRatio}% SELL`);
        console.log(`   Strategy will now SELL to build SOL back up!`);
        
        this.progress.isReversed = true;
        this.progress.reversalCount++;
        await this.updateProgress();
      }
      
      // Scenario 2: Running out of tokens (can't sell anymore)
      else if (this.progress.currentTokenBalance < MIN_TOKEN_REQUIRED && this.progress.isReversed) {
        console.log(`⚠️  LOW TOKEN WARNING: ${this.progress.currentTokenBalance.toFixed(4)} tokens remaining`);
        console.log(`🔄 REVERSING BACK: Was ${this.config.buyRatio}% sell → Now ${this.config.buyRatio}% BUY`);
        console.log(`   Strategy will now BUY to accumulate tokens!`);
        
        this.progress.isReversed = false;
        this.progress.reversalCount++;
        await this.updateProgress();
      }
      
      // Scenario 3: SOL recovered - can go back to normal
      else if (solBalance > MIN_SOL_REQUIRED * 3 && this.progress.isReversed) {
        console.log(`✅ SOL RECOVERED: ${solBalance.toFixed(4)} SOL available`);
        console.log(`🔄 REVERSING BACK TO NORMAL: ${this.config.buyRatio}% buy / ${this.config.sellRatio}% sell`);
        
        this.progress.isReversed = false;
        this.progress.reversalCount++;
        await this.updateProgress();
      }
      
      // Scenario 4: Tokens recovered - can switch back
      else if (this.progress.currentTokenBalance > MIN_TOKEN_REQUIRED * 3 && !this.progress.isReversed && this.progress.reversalCount > 0) {
        // Only log if we've previously reversed
        console.log(`✅ TOKENS RECOVERED: ${this.progress.currentTokenBalance.toFixed(4)} tokens available`);
      }
      
    } catch (error: any) {
      console.error('Failed to check balances for ratio reversal:', error.message);
    }
  }

  /**
   * Update current token balance from blockchain
   */
  private async updateCurrentBalance(): Promise<void> {
    try {
      const balance = await this.wallet.getTokenBalance(
        this.wallet.getMainKeypair().publicKey.toBase58(),
        this.config.tokenAddress
      );
      this.progress.currentTokenBalance = balance;
      console.log(`💰 Current token balance: ${balance.toFixed(2)}`);
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
    }
  }

  /**
   * Check if we need to reset daily volume counter
   */
  private async checkDailyReset(): Promise<void> {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    if (now - this.dailyStartTime >= dayInMs) {
      console.log(`📅 Daily reset: Volume processed today was ${this.progress.volumeProcessedToday.toFixed(2)} SOL`);
      this.progress.volumeProcessedToday = 0;
      this.dailyStartTime = now;
      await this.updateProgress();
    }
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
   * Pause the strategy
   */
  async pause(): Promise<void> {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      await this.updateStrategyStatus('paused');
      console.log(`⏸️ Ratio strategy #${this.strategyId} paused`);
    }
  }

  /**
   * Resume the strategy
   */
  async resume(): Promise<void> {
    if (!this.isRunning) {
      await this.start();
      console.log(`▶️ Ratio strategy #${this.strategyId} resumed`);
    }
  }

  /**
   * Stop the strategy
   */
  async stop(): Promise<void> {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    await this.updateStrategyStatus('stopped');
    console.log(`⏹️ Ratio strategy #${this.strategyId} stopped`);
  }

  /**
   * Get current progress
   */
  getProgress(): RatioProgress {
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





