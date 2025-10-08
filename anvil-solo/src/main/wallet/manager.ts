import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import { encryptPrivateKey, decryptPrivateKey } from './encryption';
import { getDatabase } from '../database/schema';

export interface WalletInfo {
  id: number;
  publicKey: string;
  label?: string;
  isMain: boolean;
  balance?: number;
}

export class WalletManager {
  private connection: Connection;
  private mainKeypair: Keypair | null = null;
  private derivedKeypairs: Map<string, Keypair> = new Map();
  private currentPassword: string | null = null;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Import wallet from private key (supports multiple formats)
   */
  async importWallet(privateKey: string, password: string, label?: string): Promise<string> {
    let keypair: Keypair;

    // Try different private key formats
    try {
      // Format 1: Base58 (Phantom export format)
      const decoded = bs58.decode(privateKey);
      keypair = Keypair.fromSecretKey(decoded);
    } catch {
      try {
        // Format 2: JSON array format [1,2,3,...]
        const arr = JSON.parse(privateKey);
        keypair = Keypair.fromSecretKey(new Uint8Array(arr));
      } catch {
        try {
          // Format 3: Base64 format
          keypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
        } catch {
          throw new Error('Invalid private key format. Supported formats: Base58, JSON array, or Base64');
        }
      }
    }

    // Encrypt the private key
    const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
    const encrypted = encryptPrivateKey(privateKeyBase64, password);

    // Save to database
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO wallets (encrypted_private_key, public_key, is_main, label, created_at)
      VALUES (?, ?, TRUE, ?, ?)
    `);

    stmt.run(encrypted, keypair.publicKey.toBase58(), label || 'Main Wallet', Date.now());

    this.mainKeypair = keypair;
    this.currentPassword = password;

    console.log('✅ Wallet imported:', keypair.publicKey.toBase58());
    return keypair.publicKey.toBase58();
  }

  /**
   * Generate a new wallet
   */
  async generateWallet(password: string, label?: string): Promise<string> {
    const keypair = Keypair.generate();
    const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
    const encrypted = encryptPrivateKey(privateKeyBase64, password);

    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO wallets (encrypted_private_key, public_key, is_main, label, created_at)
      VALUES (?, ?, TRUE, ?, ?)
    `);

    stmt.run(encrypted, keypair.publicKey.toBase58(), label || 'Main Wallet', Date.now());

    this.mainKeypair = keypair;
    this.currentPassword = password;

    console.log('✅ New wallet generated:', keypair.publicKey.toBase58());
    return keypair.publicKey.toBase58();
  }

  /**
   * Unlock the main wallet with password
   */
  async unlockWallet(password: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT encrypted_private_key, public_key FROM wallets WHERE is_main = TRUE').get() as any;

    if (!row) {
      throw new Error('No wallet found. Please import or generate a wallet first.');
    }

    try {
      const decrypted = decryptPrivateKey(row.encrypted_private_key, password);
      const secretKey = Buffer.from(decrypted, 'base64');
      this.mainKeypair = Keypair.fromSecretKey(secretKey);
      this.currentPassword = password;

      // Load all derived wallets
      await this.loadDerivedWallets(password);

      console.log('✅ Wallet unlocked:', row.public_key);
      return true;
    } catch (error) {
      console.error('❌ Failed to unlock wallet:', error);
      return false;
    }
  }

  /**
   * Load derived wallets from database
   */
  private async loadDerivedWallets(password: string): Promise<void> {
    const db = getDatabase();
    const rows = db.prepare('SELECT encrypted_private_key, public_key FROM wallets WHERE is_main = FALSE').all() as any[];

    for (const row of rows) {
      try {
        const decrypted = decryptPrivateKey(row.encrypted_private_key, password);
        const secretKey = Buffer.from(decrypted, 'base64');
        const keypair = Keypair.fromSecretKey(secretKey);
        this.derivedKeypairs.set(row.public_key, keypair);
      } catch (error) {
        console.error('Failed to load derived wallet:', row.public_key);
      }
    }

    console.log(`✅ Loaded ${this.derivedKeypairs.size} derived wallets`);
  }

  /**
   * Generate derived wallets for volume trading
   */
  async generateDerivedWallets(count: number): Promise<string[]> {
    if (!this.mainKeypair || !this.currentPassword) {
      throw new Error('Main wallet not unlocked');
    }

    const publicKeys: string[] = [];
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO wallets (encrypted_private_key, public_key, derivation_path, is_main, label, created_at)
      VALUES (?, ?, ?, FALSE, ?, ?)
    `);

    for (let i = 0; i < count; i++) {
      const derived = Keypair.generate();
      const privateKeyBase64 = Buffer.from(derived.secretKey).toString('base64');
      const encrypted = encryptPrivateKey(privateKeyBase64, this.currentPassword);

      stmt.run(
        encrypted,
        derived.publicKey.toBase58(),
        `derived/${i}`,
        `Bot Wallet ${i + 1}`,
        Date.now()
      );

      this.derivedKeypairs.set(derived.publicKey.toBase58(), derived);
      publicKeys.push(derived.publicKey.toBase58());
    }

    console.log(`✅ Generated ${count} derived wallets`);
    return publicKeys;
  }

  /**
   * Get SOL balance for a wallet
   */
  async getBalance(publicKey?: string): Promise<number> {
    const pk = publicKey ? new PublicKey(publicKey) : this.mainKeypair!.publicKey;
    const balance = await this.connection.getBalance(pk);
    return balance / LAMPORTS_PER_SOL;
  }

  /**
   * Get token balance for a specific mint
   */
  async getTokenBalance(walletPubkey: string, tokenMint: string): Promise<number> {
    try {
      const accounts = await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletPubkey),
        { mint: new PublicKey(tokenMint) }
      );

      if (accounts.value.length === 0) return 0;

      return accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  }

  /**
   * Get all wallets from database
   */
  getAllWallets(): WalletInfo[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT id, public_key, is_main, label
      FROM wallets
      ORDER BY is_main DESC, created_at ASC
    `).all() as any[];

    return rows.map(row => ({
      id: row.id,
      publicKey: row.public_key,
      label: row.label,
      isMain: Boolean(row.is_main)
    }));
  }

  /**
   * Get the main keypair (for signing transactions)
   */
  getMainKeypair(): Keypair {
    if (!this.mainKeypair) {
      throw new Error('Wallet not unlocked. Please unlock the wallet first.');
    }
    return this.mainKeypair;
  }

  /**
   * Get all derived keypairs
   */
  getDerivedKeypairs(): Keypair[] {
    return Array.from(this.derivedKeypairs.values());
  }

  /**
   * Get a specific derived keypair by public key
   */
  getDerivedKeypair(publicKey: string): Keypair | undefined {
    return this.derivedKeypairs.get(publicKey);
  }

  /**
   * Check if wallet is unlocked
   */
  isUnlocked(): boolean {
    return this.mainKeypair !== null;
  }

  /**
   * Lock the wallet (clear in-memory keys)
   */
  lock(): void {
    this.mainKeypair = null;
    this.derivedKeypairs.clear();
    this.currentPassword = null;
    console.log('🔒 Wallet locked');
  }

  /**
   * Delete a derived wallet
   */
  async deleteDerivedWallet(publicKey: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM wallets WHERE public_key = ? AND is_main = FALSE').run(publicKey);
    this.derivedKeypairs.delete(publicKey);
    console.log('✅ Derived wallet deleted:', publicKey);
  }

  /**
   * Export private key (requires password confirmation)
   */
  async exportPrivateKey(publicKey: string, password: string): Promise<string> {
    const db = getDatabase();
    const row = db.prepare('SELECT encrypted_private_key FROM wallets WHERE public_key = ?').get(publicKey) as any;

    if (!row) {
      throw new Error('Wallet not found');
    }

    const decrypted = decryptPrivateKey(row.encrypted_private_key, password);
    const secretKey = Buffer.from(decrypted, 'base64');
    
    // Return as base58 (Phantom format)
    return bs58.encode(secretKey);
  }

  /**
   * Withdraw SOL from a wallet to another address
   */
  async withdrawSol(
    fromPublicKey: string,
    toAddress: string,
    amount: number
  ): Promise<string> {
    const { Transaction, SystemProgram, sendAndConfirmTransaction } = await import('@solana/web3.js');
    
    if (!this.mainKeypair && !this.derivedKeypairs.has(fromPublicKey)) {
      throw new Error('Wallet not unlocked');
    }

    // Get the keypair
    let keypair: Keypair;
    if (this.mainKeypair && this.mainKeypair.publicKey.toBase58() === fromPublicKey) {
      keypair = this.mainKeypair;
    } else if (this.derivedKeypairs.has(fromPublicKey)) {
      keypair = this.derivedKeypairs.get(fromPublicKey)!;
    } else {
      throw new Error('Keypair not found');
    }

    // Check balance
    const balance = await this.getBalance(fromPublicKey);
    const minBalance = 0.001; // Min balance to keep for rent
    
    if (balance < amount + minBalance) {
      throw new Error(`Insufficient balance. Have ${balance} SOL, need ${amount + minBalance} SOL (includes ${minBalance} SOL for rent)`);
    }

    // Create and send transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new PublicKey(toAddress),
        lamports: amount * LAMPORTS_PER_SOL
      })
    );

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [keypair],
      { commitment: 'confirmed' }
    );

    console.log(`✅ Withdrawn ${amount} SOL to ${toAddress}`);
    return signature;
  }

  /**
   * Withdraw tokens from a wallet to another address
   */
  async withdrawToken(
    fromPublicKey: string,
    toAddress: string,
    tokenMint: string,
    amount: number
  ): Promise<string> {
    const { Transaction, sendAndConfirmTransaction } = await import('@solana/web3.js');
    const { 
      getOrCreateAssociatedTokenAccount, 
      createTransferInstruction,
      getAssociatedTokenAddress
    } = await import('@solana/spl-token');

    if (!this.mainKeypair && !this.derivedKeypairs.has(fromPublicKey)) {
      throw new Error('Wallet not unlocked');
    }

    // Get the keypair
    let keypair: Keypair;
    if (this.mainKeypair && this.mainKeypair.publicKey.toBase58() === fromPublicKey) {
      keypair = this.mainKeypair;
    } else if (this.derivedKeypairs.has(fromPublicKey)) {
      keypair = this.derivedKeypairs.get(fromPublicKey)!;
    } else {
      throw new Error('Keypair not found');
    }

    // Check SOL balance for gas
    const solBalance = await this.getBalance(fromPublicKey);
    const minGas = 0.001;
    if (solBalance < minGas) {
      throw new Error(`Insufficient SOL for gas fees. Need at least ${minGas} SOL, have ${solBalance} SOL`);
    }

    // Check token balance
    const tokenBalance = await this.getTokenBalance(fromPublicKey, tokenMint);
    if (tokenBalance < amount) {
      throw new Error(`Insufficient token balance. Have ${tokenBalance}, need ${amount}`);
    }

    const mint = new PublicKey(tokenMint);
    const destination = new PublicKey(toAddress);

    // Get source token account
    const sourceTokenAccount = await getAssociatedTokenAddress(
      mint,
      keypair.publicKey
    );

    // Get or create destination token account
    const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      keypair,
      mint,
      destination
    );

    // Get token decimals
    const mintInfo = await this.connection.getParsedAccountInfo(mint);
    const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals || 9;

    // Create transfer instruction
    const transaction = new Transaction().add(
      createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount.address,
        keypair.publicKey,
        amount * Math.pow(10, decimals)
      )
    );

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [keypair],
      { commitment: 'confirmed' }
    );

    console.log(`✅ Withdrawn ${amount} tokens to ${toAddress}`);
    return signature;
  }
}



