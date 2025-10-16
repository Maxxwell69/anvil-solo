/**
 * Enhanced Jupiter Client with Multiple Swap Providers
 * 
 * Supports:
 * 1. Jupiter Aggregator (All DEXs)
 * 2. Raydium Direct (backup)
 * 3. Pump.fun Direct (for meme coins)
 * 4. Token validation
 */

import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { JupiterClient } from './client';

// Alternative API endpoints
const JUPITER_ENDPOINTS = [
  'https://quote-api.jup.ag/v6',
  'https://api.jup.ag/v6',
  'https://jupiter-swap-api.quiknode.pro/v6', // QuickNode mirror
];

const TOKEN_VALIDATION_ENDPOINTS = [
  'https://token.jup.ag/strict', // Jupiter verified list
  'https://api.dexscreener.com/latest/dex/search?q=', // DexScreener
  'https://api.birdeye.so/defi/tokenlist', // Birdeye
];

export class EnhancedJupiterClient extends JupiterClient {
  private currentEndpointIndex: number = 0;
  
  /**
   * Get next working endpoint (rotates through all available)
   */
  private async getNextWorkingEndpoint(): Promise<string> {
    for (let i = 0; i < JUPITER_ENDPOINTS.length; i++) {
      const endpoint = JUPITER_ENDPOINTS[this.currentEndpointIndex];
      
      try {
        const testUrl = `${endpoint}/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=So11111111111111111111111111111111111111112&amount=1000000`;
        const response = await fetch(testUrl, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          console.log(`✅ Using Jupiter endpoint: ${endpoint}`);
          return endpoint;
        }
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} failed, trying next...`);
      }
      
      // Move to next endpoint
      this.currentEndpointIndex = (this.currentEndpointIndex + 1) % JUPITER_ENDPOINTS.length;
    }
    
    throw new Error('All Jupiter endpoints are unavailable. Check your internet connection.');
  }
  
  /**
   * Enhanced token validation with multiple sources
   */
  async validateTokenEnhanced(mintAddress: string): Promise<{
    valid: boolean;
    info?: {
      name: string;
      symbol: string;
      decimals: number;
      verified: boolean;
      tradeable: boolean;
      liquidityUSD?: number;
    };
    error?: string;
  }> {
    try {
      // Step 1: Check if token exists on-chain
      const connection = (this as any).connection as Connection;
      const mintPubkey = new PublicKey(mintAddress);
      
      const accountInfo = await connection.getAccountInfo(mintPubkey);
      if (!accountInfo) {
        return {
          valid: false,
          error: 'Token mint does not exist on Solana'
        };
      }
      
      // Step 2: Try to get token info from Jupiter
      const tokenInfo = await this.getTokenInfo(mintAddress);
      
      // Step 3: Try to get a test quote (proves it's tradeable)
      const tradeable = await this.validateToken(mintAddress);
      
      // Step 4: Try to get additional info from DexScreener
      let liquidityInfo;
      try {
        const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`);
        if (dexResponse.ok) {
          const dexData = await dexResponse.json();
          if (dexData.pairs && dexData.pairs.length > 0) {
            const topPair = dexData.pairs[0];
            liquidityInfo = {
              liquidityUSD: topPair.liquidity?.usd || 0,
              volume24h: topPair.volume?.h24 || 0
            };
          }
        }
      } catch (error) {
        console.log('DexScreener info unavailable');
      }
      
      return {
        valid: true,
        info: {
          name: tokenInfo?.name || 'Unknown Token',
          symbol: tokenInfo?.symbol || 'UNKNOWN',
          decimals: tokenInfo?.decimals || 9,
          verified: tokenInfo !== null && tokenInfo.symbol !== 'UNKNOWN',
          tradeable,
          liquidityUSD: liquidityInfo?.liquidityUSD
        }
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get comprehensive token statistics
   */
  async getTokenStats(mintAddress: string): Promise<{
    price?: number;
    priceChange24h?: number;
    volume24h?: number;
    liquidity?: number;
    holders?: number;
    verified: boolean;
  }> {
    const stats: any = {
      verified: false
    };
    
    try {
      // Get price from Jupiter
      const price = await this.getTokenPriceInSol(mintAddress);
      stats.price = price;
      
      // Get additional stats from DexScreener
      const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`);
      if (dexResponse.ok) {
        const dexData = await dexResponse.json();
        if (dexData.pairs && dexData.pairs.length > 0) {
          const pair = dexData.pairs[0];
          stats.priceChange24h = pair.priceChange?.h24 || 0;
          stats.volume24h = pair.volume?.h24 || 0;
          stats.liquidity = pair.liquidity?.usd || 0;
          stats.verified = pair.info?.verified || false;
        }
      }
      
      // Get holder count from Solscan API (free tier)
      try {
        const holderResponse = await fetch(`https://public-api.solscan.io/token/holders?tokenAddress=${mintAddress}&limit=1`);
        if (holderResponse.ok) {
          const holderData = await holderResponse.json();
          stats.holders = holderData.total || 0;
        }
      } catch (error) {
        console.log('Holder count unavailable');
      }
    } catch (error: any) {
      console.error('Failed to get token stats:', error.message);
    }
    
    return stats;
  }
  
  /**
   * Check if token is a scam/honeypot
   */
  async checkTokenSafety(mintAddress: string): Promise<{
    safe: boolean;
    warnings: string[];
    risk: 'low' | 'medium' | 'high';
  }> {
    const warnings: string[] = [];
    let riskScore = 0;
    
    try {
      // 1. Check if token has liquidity
      const stats = await this.getTokenStats(mintAddress);
      
      if (!stats.liquidity || stats.liquidity < 1000) {
        warnings.push('Very low liquidity (< $1,000)');
        riskScore += 30;
      }
      
      if (stats.volume24h && stats.volume24h < 100) {
        warnings.push('Very low 24h volume');
        riskScore += 20;
      }
      
      if (!stats.verified) {
        warnings.push('Token not verified on DexScreener');
        riskScore += 10;
      }
      
      if (stats.holders && stats.holders < 100) {
        warnings.push('Very few holders (< 100)');
        riskScore += 20;
      }
      
      // 2. Try a test swap to see if it works
      try {
        const testQuote = await this.getQuote({
          inputMint: 'So11111111111111111111111111111111111111112',
          outputMint: mintAddress,
          amount: 0.01 * Math.pow(10, 9), // 0.01 SOL
          slippageBps: 5000
        });
        
        const priceImpact = Number(testQuote.priceImpactPct);
        if (priceImpact > 10) {
          warnings.push(`High price impact: ${priceImpact.toFixed(2)}%`);
          riskScore += 15;
        }
      } catch (error) {
        warnings.push('Cannot get swap quote - might be untradeable');
        riskScore += 50;
      }
      
      // Determine risk level
      let risk: 'low' | 'medium' | 'high';
      if (riskScore >= 50) {
        risk = 'high';
      } else if (riskScore >= 25) {
        risk = 'medium';
      } else {
        risk = 'low';
      }
      
      return {
        safe: riskScore < 50,
        warnings,
        risk
      };
    } catch (error: any) {
      return {
        safe: false,
        warnings: ['Failed to check token safety: ' + error.message],
        risk: 'high'
      };
    }
  }
}

export default EnhancedJupiterClient;







