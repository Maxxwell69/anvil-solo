import { Connection, Keypair, PublicKey, Transaction, Commitment } from '@solana/web3.js';
import { SolanaService } from '../../interfaces/SolanaService';
import { decryptPrivateKey, delay } from '../index';
import { checkSolBalance } from '../getBalance';
import { Logger } from '../../interfaces/Logger';
import { AppConfig } from '../../interfaces/Config';

/**
 * Implementation of the SolanaService interface
 */
export class SolanaServiceImpl implements SolanaService {
  private connection: Connection;
  
  /**
   * Create a new SolanaServiceImpl
   * @param config The application configuration
   * @param logger The logger
   */
  constructor(
    private config: AppConfig,
    private logger: Logger
  ) {
    this.connection = new Connection(config.solana.rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 50000,
    });
  }
  
  /**
   * Get the Solana connection
   */
  getConnection(): Connection {
    return this.connection;
  }
  
  /**
   * Get the balance of a wallet in SOL
   * @param publicKey The public key of the wallet
   * @returns The balance in SOL
   */
  async getBalance(publicKey: string): Promise<number | null> {
    try {
      const balance = await checkSolBalance(publicKey);
      return balance === undefined ? null : balance;
    } catch (error) {
      this.logger.error('Error getting balance', error);
      return null;
    }
  }
  
  /**
   * Get the balance of a token account
   * @param tokenAccount The token account address
   * @returns The balance of the token account
   */
  async getTokenBalance(tokenAccount: PublicKey): Promise<string> {
    try {
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return balance.value.amount;
    } catch (error) {
      this.logger.error('Error getting token balance', error);
      throw error;
    }
  }
  
  /**
   * Get the minimum balance for rent exemption
   * @param size The size of the account
   * @returns The minimum balance in lamports
   */
  async getMinimumBalanceForRentExemption(size: number): Promise<number> {
    try {
      return await this.connection.getMinimumBalanceForRentExemption(size);
    } catch (error) {
      this.logger.error('Error getting minimum balance for rent exemption', error);
      throw error;
    }
  }
  
  /**
   * Send and confirm a transaction
   * @param transaction The transaction to send
   * @param signers The signers of the transaction
   * @param options Options for sending the transaction
   * @returns The transaction signature
   */
  async sendAndConfirmTransaction(
    transaction: Transaction,
    signers: Keypair[],
    feePayer: PublicKey,
    options?: {
      commitment?: Commitment;
      skipPreflight?: boolean;
      preflightCommitment?: Commitment;
    }
  ): Promise<string> {
    try {
      // Get the latest blockhash
      const latestBlockhash = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = feePayer;
      
      // Sign the transaction
      transaction.sign(...signers);
      
      // Send the transaction
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight: options?.skipPreflight || false,
          preflightCommitment: options?.preflightCommitment || 'confirmed',
        }
      );
      
      // Wait for confirmation
      await this.waitForTransactionConfirmation(signature);
      
      return signature;
    } catch (error) {
      this.logger.error('Error sending and confirming transaction', error);
      throw error;
    }
  }
  
  /**
   * Wait for a transaction to be confirmed
   * @param signature The transaction signature
   * @param timeout The timeout in milliseconds
   * @returns Whether the transaction was confirmed
   */
  async waitForTransactionConfirmation(
    signature: string,
    timeout = 60000
  ): Promise<boolean> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const status = await this.connection.getSignatureStatus(signature);
      
      if (status.value?.err) {
        throw new Error(`Transaction failed: ${status.value.err.toString()}`);
      }
      
      if (
        status.value?.confirmationStatus === 'confirmed' ||
        status.value?.confirmationStatus === 'finalized'
      ) {
        return true;
      }
      
      await delay(1000);
    }
    
    throw new Error('Transaction confirmation timeout');
  }
  
  /**
   * Get the latest blockhash
   * @returns The latest blockhash
   */
  async getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    try {
      return await this.connection.getLatestBlockhash();
    } catch (error) {
      this.logger.error('Error getting latest blockhash', error);
      throw error;
    }
  }
  
  /**
   * Create a keypair from a private key
   * @param privateKey The private key
   * @returns The keypair
   */
  async createKeypairFromPrivateKey(privateKey: string): Promise<Keypair> {
    try {
      return Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
    } catch (error) {
      this.logger.error('Error creating keypair from private key', error);
      throw error;
    }
  }
  
  /**
   * Decrypt a private key
   * @param encryptedPrivateKey The encrypted private key
   * @returns The decrypted private key
   */
  async decryptPrivateKey(encryptedPrivateKey: string): Promise<string | null> {
    try {
      const decrypted = await decryptPrivateKey(encryptedPrivateKey);
      return decrypted === undefined ? null : decrypted;
    } catch (error) {
      this.logger.error('Error decrypting private key', error);
      return null;
    }
  }
}

/**
 * Create a new SolanaService
 * @param config The application configuration
 * @param logger The logger
 * @returns A new SolanaService
 */
export const createSolanaService = (
  config: AppConfig,
  logger: Logger
): SolanaService => {
  return new SolanaServiceImpl(config, logger);
};
