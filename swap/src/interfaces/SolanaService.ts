import { Connection, Keypair, PublicKey, Transaction, Commitment } from '@solana/web3.js';

/**
 * Interface for Solana blockchain operations
 */
export interface SolanaService {
  /**
   * Get the Solana connection
   */
  getConnection(): Connection;
  
  /**
   * Get the balance of a wallet in SOL
   * @param publicKey The public key of the wallet
   * @returns The balance in SOL
   */
  getBalance(publicKey: string): Promise<number | null>;
  
  /**
   * Get the balance of a token account
   * @param tokenAccount The token account address
   * @returns The balance of the token account
   */
  getTokenBalance(tokenAccount: PublicKey): Promise<string>;
  
  /**
   * Get the minimum balance for rent exemption
   * @param size The size of the account
   * @returns The minimum balance in lamports
   */
  getMinimumBalanceForRentExemption(size: number): Promise<number>;
  
  /**
   * Send and confirm a transaction
   * @param transaction The transaction to send
   * @param signers The signers of the transaction
   * @param options Options for sending the transaction
   * @returns The transaction signature
   */
  sendAndConfirmTransaction(
    transaction: Transaction,
    signers: Keypair[],
    feePayer: PublicKey,
    options?: {
      commitment?: Commitment;
      skipPreflight?: boolean;
      preflightCommitment?: Commitment;
    }
  ): Promise<string>;
  
  /**
   * Wait for a transaction to be confirmed
   * @param signature The transaction signature
   * @param timeout The timeout in milliseconds
   * @returns Whether the transaction was confirmed
   */
  waitForTransactionConfirmation(
    signature: string,
    timeout?: number
  ): Promise<boolean>;
  
  /**
   * Get the latest blockhash
   * @returns The latest blockhash
   */
  getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }>;
  
  /**
   * Create a keypair from a private key
   * @param privateKey The private key
   * @returns The keypair
   */
  createKeypairFromPrivateKey(privateKey: string): Promise<Keypair>;
  
  /**
   * Decrypt a private key
   * @param encryptedPrivateKey The encrypted private key
   * @returns The decrypted private key
   */
  decryptPrivateKey(encryptedPrivateKey: string): Promise<string | null>;
}
