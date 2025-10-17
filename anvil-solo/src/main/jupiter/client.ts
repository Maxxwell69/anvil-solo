import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';
import fetch from 'cross-fetch';

// Jupiter API endpoints - prioritized by reliability
const JUPITER_API_V6 = 'https://quote-api.jup.ag/v6'; // Primary - most reliable
const JUPITER_API_FALLBACK = 'https://public.jupiterapi.com/v6'; // Public mirror
const JUPITER_API_FALLBACK2 = 'https://lite-api.jup.ag/v6'; // Lite version (may have limited routes)

// Note: Removed IP fallback (104.26.9.40) as it causes SSL handshake errors
// DNS is now configured to use Google DNS (8.8.8.8) and Cloudflare (1.1.1.1) in main.ts

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

// Check if error is DNS-related
function isDnsError(error: any): boolean {
  const dnsErrors = [
    'ENOTFOUND',
    'ENOENT', 
    'EAI_AGAIN',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'getaddrinfo'
  ];
  const errorString = error?.message?.toLowerCase() || error?.code || '';
  return dnsErrors.some(dnsErr => errorString.includes(dnsErr.toLowerCase()));
}

// Retry logic with exponential backoff and DNS error detection
async function fetchWithRetry(url: string, options: any = {}, maxRetries = 3): Promise<Response> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const timeout = 10000 + (i * 5000); // Increase timeout with each retry
      return await fetchWithTimeout(url, options, timeout);
    } catch (error: any) {
      lastError = error;
      
      // Log specific error type
      if (isDnsError(error)) {
        console.log(`🌐 DNS/Network error on attempt ${i + 1}/${maxRetries}: ${error.message}`);
        console.log('💡 Tip: Run fix-jupiter-dns.bat or check your internet connection');
      } else {
        console.log(`❌ Request error on attempt ${i + 1}/${maxRetries}: ${error.message}`);
      }
      
      if (i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, i) * 1000;
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Provide helpful error message based on error type
  if (isDnsError(lastError)) {
    throw new Error(
      `DNS/Network error: Cannot reach Jupiter API. ` +
      `This is usually a DNS or firewall issue. ` +
      `Solutions: 1) Run fix-jupiter-dns.bat as Administrator, ` +
      `2) Change DNS to 8.8.8.8, 3) Check firewall settings. ` +
      `Original error: ${lastError.message}`
    );
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

    // Try all endpoints: Primary, public mirror, lite version, then IP fallback
    const apiUrls = [JUPITER_API_V6, JUPITER_API_FALLBACK, JUPITER_API_FALLBACK2];
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
        let signature: string;
        
        try {
          signature = await this.connection.sendRawTransaction(rawTransaction, {
            skipPreflight: false,
            maxRetries: 3,
          });
        } catch (sendError: any) {
          // Get detailed error logs if available
          console.error('❌ SendRawTransaction failed:', sendError);
          
          if (sendError.logs) {
            console.error('Transaction logs:', sendError.logs);
          }
          
          // Check for specific errors
          if (sendError.message?.includes('insufficient')) {
            throw new Error('Insufficient SOL balance for transaction. Need ~0.02 SOL minimum (trade + fees)');
          } else if (sendError.message?.includes('blockhash')) {
            throw new Error('Transaction expired (blockhash). Try again.');
          } else if (sendError.message?.includes('slippage')) {
            throw new Error('Slippage tolerance exceeded. Increase slippage to 2-5%');
          }
          
          throw new Error(`Failed to send transaction: ${sendError.message}${sendError.logs ? '\nLogs: ' + sendError.logs.join('\n') : ''}`);
        }

        // Wait for confirmation
        const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

        if (confirmation.value.err) {
          // Get transaction details for better error message
          const tx = await this.connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0
          });
          
          const errorLogs = tx?.meta?.logMessages?.join('\n') || 'No logs available';
          console.error('Transaction failed with logs:', errorLogs);
          
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}\nLogs:\n${errorLogs}`);
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

    let token = this.tokenListCache!.find(t => t.address === mintAddress);
    
    if (!token) {
      // Try all tokens list (not just strict)
      try {
        const allTokensResponse = await fetchWithRetry('https://token.jup.ag/all', {}, 2);
        if (allTokensResponse.ok) {
          const allTokens = await allTokensResponse.json();
          token = allTokens.find((t: any) => t.address === mintAddress);
        }
      } catch (err) {
        console.log('Could not fetch from all tokens list');
      }
    }
    
    if (!token) {
      // If still not found, try to fetch on-chain
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
   * Get comprehensive token data (info + price + validation)
   */
  async getTokenData(mintAddress: string): Promise<{
    info: TokenInfo | null;
    priceInSol: number;
    isTradeable: boolean;
    estimatedSlippage: number;
  }> {
    try {
      // Get basic info
      const info = await this.getTokenInfo(mintAddress);
      
      // Try to get a small quote to validate and get price
      let priceInSol = 0;
      let isTradeable = false;
      let estimatedSlippage = 0;
      
      try {
        const testAmount = 0.01 * Math.pow(10, 9); // 0.01 SOL test
        const quote = await this.getQuote({
          inputMint: SOL_MINT,
          outputMint: mintAddress,
          amount: testAmount,
          slippageBps: 5000, // Allow high slippage for test
        });
        
        isTradeable = true;
        
        // Calculate price per token
        if (info) {
          const tokensReceived = Number(quote.outAmount) / Math.pow(10, info.decimals);
          priceInSol = 0.01 / tokensReceived; // Price of 1 token in SOL
        }
        
        // Estimate slippage from price impact
        estimatedSlippage = parseFloat(quote.priceImpactPct || '0');
        
      } catch (quoteError) {
        console.log('Could not get quote for token:', mintAddress);
      }
      
      return {
        info,
        priceInSol,
        isTradeable,
        estimatedSlippage
      };
    } catch (error: any) {
      console.error('Failed to get token data:', error);
      return {
        info: null,
        priceInSol: 0,
        isTradeable: false,
        estimatedSlippage: 0
      };
    }
  }

  /**
   * Check if Jupiter API is accessible with detailed diagnostics
   */
  async healthCheck(): Promise<boolean> {
    console.log('🔍 Testing Jupiter API connectivity...');
    
    // Try all endpoints including IP fallback
    const apiUrls = [JUPITER_API_V6, JUPITER_API_FALLBACK, JUPITER_API_FALLBACK2];
    let dnsErrorCount = 0;
    let timeoutErrorCount = 0;
    let otherErrorCount = 0;
    
    for (const apiUrl of apiUrls) {
      try {
        const response = await fetchWithTimeout(`${apiUrl}/quote?inputMint=${SOL_MINT}&outputMint=${SOL_MINT}&amount=1000000`, {}, 5000);
        if (response.ok) {
          console.log(`✅ Jupiter API accessible at: ${apiUrl}`);
          // Remember which endpoint worked
          if (apiUrl !== JUPITER_API_V6) {
            this.useFallback = true;
            this.apiUrl = apiUrl;
          }
          return true;
        }
      } catch (error: any) {
        console.log(`❌ Health check failed for ${apiUrl}: ${error.message}`);
        
        // Categorize error
        if (isDnsError(error)) {
          dnsErrorCount++;
        } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
          timeoutErrorCount++;
        } else {
          otherErrorCount++;
        }
        continue;
      }
    }
    
    // Provide specific diagnostic information
    console.log('\n⚠️  All Jupiter endpoints failed. Diagnostics:');
    
    if (dnsErrorCount >= 3) {
      console.log('❌ DNS Resolution Problem Detected!');
      console.log('   All/most endpoints failed with DNS errors.');
      console.log('   This means your computer cannot find Jupiter API servers.');
      console.log('\n💡 SOLUTIONS:');
      console.log('   1. Run: fix-jupiter-dns.bat (as Administrator)');
      console.log('   2. Change DNS to 8.8.8.8 or 1.1.1.1');
      console.log('   3. Flush DNS: ipconfig /flushdns');
      console.log('   4. Check your internet connection');
      console.log('   5. Try a VPN if your ISP blocks crypto APIs');
    } else if (timeoutErrorCount >= 3) {
      console.log('❌ Network Timeout Problem Detected!');
      console.log('   All/most endpoints are timing out.');
      console.log('\n💡 SOLUTIONS:');
      console.log('   1. Check firewall settings (allow Electron/Node.js)');
      console.log('   2. Check if antivirus is blocking connections');
      console.log('   3. Restart your router');
      console.log('   4. Try on a different network (mobile hotspot)');
    } else if (dnsErrorCount > 0) {
      console.log('❌ Intermittent DNS Problems Detected!');
      console.log(`   ${dnsErrorCount}/4 endpoints had DNS errors.`);
      console.log('\n💡 SOLUTIONS:');
      console.log('   1. Flush DNS cache: ipconfig /flushdns');
      console.log('   2. Wait a few minutes and try again');
      console.log('   3. App will automatically retry with working endpoints');
    } else {
      console.log('❌ Jupiter API may be down (rare)');
      console.log('   Check https://status.jup.ag for status');
      console.log('   App will retry automatically during swaps');
    }
    
    console.log('\n📊 For detailed diagnostics, run: diagnose-jupiter.bat\n');
    
    return false;
  }
}



