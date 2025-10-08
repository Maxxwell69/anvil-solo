import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';
import fetch from 'cross-fetch';

const JUPITER_API_V6 = 'https://quote-api.jup.ag/v6';
const JUPITER_API_FALLBACK = 'https://api.jup.ag/v6'; // Fallback endpoint
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Fetch with timeout
async function fetchWithTimeout(url: string, options: any = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Retry logic with exponential backoff
async function fetchWithRetry(url: string, options: any = {}, maxRetries = 3): Promise<Response> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const timeout = 10000 + (i * 5000); // Increase timeout with each retry
      return await fetchWithTimeout(url, options, timeout);
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: any;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  dexUsed: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export class JupiterClient {
  private connection: Connection;
  private tokenListCache: TokenInfo[] | null = null;
  private apiUrl: string = JUPITER_API_V6;
  private useFallback: boolean = false;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }
  
  /**
   * Try to get working API URL
   */
  private async getWorkingApiUrl(): Promise<string> {
    // If we already know primary works, use it
    if (!this.useFallback) {
      return this.apiUrl;
    }
    
    // If we know to use fallback, use it
    return JUPITER_API_FALLBACK;
  }

  /**
   * Get a swap quote from Jupiter
   * Works for all DEXs: Raydium, Pump.fun, Meteora, Token-2022
   */
  async getQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number;
    onlyDirectRoutes?: boolean;
  }): Promise<QuoteResponse> {
    const { inputMint, outputMint, amount, slippageBps = 50, onlyDirectRoutes = false } = params;

    // Try primary, then fallback
    const apiUrls = [JUPITER_API_V6, JUPITER_API_FALLBACK];
    let lastError: any;
    
    for (const apiUrl of apiUrls) {
      try {
        const url = new URL(`${apiUrl}/quote`);
        url.searchParams.append('inputMint', inputMint);
        url.searchParams.append('outputMint', outputMint);
        url.searchParams.append('amount', amount.toString());
        url.searchParams.append('slippageBps', slippageBps.toString());
        url.searchParams.append('onlyDirectRoutes', onlyDirectRoutes.toString());

        const response = await fetchWithRetry(url.toString());
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Jupiter quote failed: ${error}`);
        }

        const quote = await response.json();
        
        if (!quote || !quote.outAmount) {
          throw new Error('Invalid quote response from Jupiter');
        }

        // Success! Remember which URL worked
        if (apiUrl === JUPITER_API_FALLBACK) {
          this.useFallback = true;
          console.log('✅ Using Jupiter fallback API');
        }

        return quote as QuoteResponse;
      } catch (error: any) {
        lastError = error;
        console.log(`❌ ${apiUrl} failed: ${error.message}`);
        continue;
      }
    }
    
    throw lastError || new Error('All Jupiter API endpoints failed');
  }

  /**
   * Execute a swap transaction
   */
  async executeSwap(params: {
    quote: QuoteResponse;
    userKeypair: Keypair;
    priorityFeeLamports?: number;
    dynamicSlippage?: boolean;
  }): Promise<SwapResult> {
    const { quote, userKeypair, priorityFeeLamports, dynamicSlippage = true } = params;

    // Try primary, then fallback
    const apiUrls = [this.useFallback ? JUPITER_API_FALLBACK : JUPITER_API_V6, JUPITER_API_FALLBACK];
    let lastError: any;
    
    for (const apiUrl of apiUrls) {
      try {
        // Get swap transaction from Jupiter
        const swapResponse = await fetchWithRetry(`${apiUrl}/swap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteResponse: quote,
            userPublicKey: userKeypair.publicKey.toBase58(),
            wrapAndUnwrapSol: true,
            dynamicComputeUnitLimit: true,
            dynamicSlippage,
            prioritizationFeeLamports: priorityFeeLamports || 'auto',
          }),
        });

        if (!swapResponse.ok) {
          const error = await swapResponse.text();
          throw new Error(`Swap transaction failed: ${error}`);
        }

        const { swapTransaction } = await swapResponse.json();
        
        // Success! Remember which URL worked
        if (apiUrl === JUPITER_API_FALLBACK) {
          this.useFallback = true;
        }

        // Deserialize and sign the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        transaction.sign([userKeypair]);

        // Send the transaction
        const rawTransaction = transaction.serialize();
        const signature = await this.connection.sendRawTransaction(rawTransaction, {
          skipPreflight: false,
          maxRetries: 3,
        });

        // Wait for confirmation
        const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        // Determine which DEX was used
        const dexUsed = this.determineDexUsed(quote);

        return {
          signature,
          inputAmount: Number(quote.inAmount),
          outputAmount: Number(quote.outAmount),
          priceImpact: Number(quote.priceImpactPct),
          dexUsed,
        };
      } catch (error: any) {
        lastError = error;
        console.log(`❌ Swap via ${apiUrl} failed: ${error.message}`);
        continue;
      }
    }
    
    console.error('Swap execution error - all endpoints failed:', lastError);
    throw lastError || new Error('All Jupiter API endpoints failed for swap');
  }

  /**
   * Determine which DEX was primarily used in the route
   */
  private determineDexUsed(quote: QuoteResponse): string {
    if (!quote.routePlan || quote.routePlan.length === 0) {
      return 'Unknown';
    }

    // Get the DEX with the highest percentage in the route
    const dexCounts: { [key: string]: number } = {};
    
    for (const step of quote.routePlan) {
      const label = step.swapInfo.label || 'Unknown';
      dexCounts[label] = (dexCounts[label] || 0) + step.percent;
    }

    // Find DEX with highest percentage
    const primaryDex = Object.entries(dexCounts).reduce((max, [dex, percent]) => 
      percent > max.percent ? { dex, percent } : max
    , { dex: 'Unknown', percent: 0 });

    return primaryDex.dex;
  }

  /**
   * Get token information from Jupiter's token list
   */
  async getTokenInfo(mintAddress: string): Promise<TokenInfo | null> {
    // Load token list if not cached
    if (!this.tokenListCache) {
      await this.loadTokenList();
    }

    const token = this.tokenListCache!.find(t => t.address === mintAddress);
    
    if (!token) {
      // If not in strict list, try to fetch on-chain
      return await this.fetchOnChainTokenInfo(mintAddress);
    }

    return token;
  }

  /**
   * Load Jupiter's verified token list
   */
  private async loadTokenList(): Promise<void> {
    try {
      const response = await fetchWithRetry('https://token.jup.ag/strict', {}, 2); // Only 2 retries for token list
      if (response.ok) {
        this.tokenListCache = await response.json();
        console.log(`✅ Loaded ${this.tokenListCache!.length} tokens from Jupiter`);
      }
    } catch (error) {
      console.error('Failed to load token list:', error);
      this.tokenListCache = [];
    }
  }

  /**
   * Fetch token info directly from the blockchain
   */
  private async fetchOnChainTokenInfo(mintAddress: string): Promise<TokenInfo | null> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const mintInfo = await this.connection.getParsedAccountInfo(mintPubkey);

      if (!mintInfo.value || !mintInfo.value.data) {
        return null;
      }

      const data = mintInfo.value.data as any;
      
      return {
        address: mintAddress,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: data.parsed?.info?.decimals || 9,
      };
    } catch (error) {
      console.error('Failed to fetch on-chain token info:', error);
      return null;
    }
  }

  /**
   * Validate if a token is tradeable on supported DEXs
   */
  async validateToken(mintAddress: string): Promise<boolean> {
    try {
      // Try to get a quote for 0.1 SOL
      const testAmount = 0.1 * Math.pow(10, 9); // 0.1 SOL in lamports
      
      await this.getQuote({
        inputMint: SOL_MINT,
        outputMint: mintAddress,
        amount: testAmount,
        slippageBps: 5000, // 50% slippage for validation
      });

      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Get price for a token in SOL
   */
  async getTokenPriceInSol(mintAddress: string): Promise<number> {
    try {
      const tokenInfo = await this.getTokenInfo(mintAddress);
      if (!tokenInfo) {
        throw new Error('Token info not found');
      }

      // Get quote for 1 token
      const amount = Math.pow(10, tokenInfo.decimals); // 1 token
      
      const quote = await this.getQuote({
        inputMint: mintAddress,
        outputMint: SOL_MINT,
        amount,
        slippageBps: 100,
      });

      const solReceived = Number(quote.outAmount) / Math.pow(10, 9);
      return solReceived;
    } catch (error) {
      console.error('Failed to get token price:', error);
      return 0;
    }
  }

  /**
   * Check if Jupiter API is accessible
   */
  async healthCheck(): Promise<boolean> {
    // Try both endpoints
    const apiUrls = [JUPITER_API_V6, JUPITER_API_FALLBACK];
    
    for (const apiUrl of apiUrls) {
      try {
        const response = await fetchWithTimeout(`${apiUrl}/quote?inputMint=${SOL_MINT}&outputMint=${SOL_MINT}&amount=1000000`, {}, 5000);
        if (response.ok) {
          // Set fallback flag if fallback worked
          if (apiUrl === JUPITER_API_FALLBACK && !this.useFallback) {
            this.useFallback = true;
            console.log('✅ Jupiter fallback API is accessible');
          }
          return true;
        }
      } catch (error) {
        console.log(`Health check failed for ${apiUrl}`);
        continue;
      }
    }
    
    return false;
  }
}



