import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export class DatabaseSchema {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Create .anvil directory in user's home folder
    const anvilDir = path.join(os.homedir(), '.anvil');
    if (!fs.existsSync(anvilDir)) {
      fs.mkdirSync(anvilDir, { recursive: true });
    }

    this.dbPath = path.join(anvilDir, 'anvil-solo.db');
    this.db = new Database(this.dbPath);
    this.initialize();
  }

  private initialize(): void {
    console.log('Initializing database at:', this.dbPath);

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Create tables
    this.createWalletsTable();
    this.createTokensTable();
    this.createStrategiesTable();
    this.createTransactionsTable();
    this.createSettingsTable();
    this.createLicenseTable();
    this.createFeeTransactionsTable();

    console.log('Database initialized successfully');
  }

  private createWalletsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        encrypted_private_key TEXT NOT NULL,
        public_key TEXT NOT NULL UNIQUE,
        derivation_path TEXT,
        is_main BOOLEAN DEFAULT FALSE,
        label TEXT,
        created_at INTEGER NOT NULL
      )
    `);
  }

  private createTokensTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        symbol TEXT,
        contract_address TEXT NOT NULL UNIQUE,
        decimals INTEGER DEFAULT 9,
        logo_uri TEXT,
        notes TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        added_at INTEGER NOT NULL
      )
    `);

    // Create index for faster searches
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tokens_name 
      ON tokens(name);
      
      CREATE INDEX IF NOT EXISTS idx_tokens_favorite 
      ON tokens(is_favorite);
    `);
  }

  private createStrategiesTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS strategies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('dca', 'ratio', 'bundle')),
        token_address TEXT NOT NULL,
        config TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'stopped', 'completed')) DEFAULT 'stopped',
        progress TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create index for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_strategies_status 
      ON strategies(status)
    `);
  }

  private createTransactionsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy_id INTEGER,
        signature TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK(type IN ('buy', 'sell')),
        input_token TEXT NOT NULL,
        output_token TEXT NOT NULL,
        input_amount REAL NOT NULL,
        output_amount REAL NOT NULL,
        dex_used TEXT,
        price REAL,
        slippage REAL,
        fee REAL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'failed')) DEFAULT 'pending',
        error TEXT,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY(strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_strategy 
      ON transactions(strategy_id);
      
      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp 
      ON transactions(timestamp DESC);
    `);
  }

  private createSettingsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Insert default settings
    const defaultSettings = [
      { key: 'rpc_url', value: 'https://api.mainnet-beta.solana.com' },
      { key: 'default_slippage_bps', value: '100' },
      { key: 'default_priority_fee', value: '100000' },
      { key: 'auto_lock_minutes', value: '15' },
      { key: 'theme', value: 'dark' },
      { key: 'fee_wallet_address', value: '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd' }, // Admin fee collection wallet
      { key: 'fee_percentage', value: '0.5' }, // 0.5% fee per transaction
      { key: 'fee_enabled', value: 'true' },
    ];

    const insertSetting = this.db.prepare(
      'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
    );

    for (const setting of defaultSettings) {
      insertSetting.run(setting.key, setting.value);
    }
  }

  private createLicenseTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS license (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        license_key TEXT,
        tier TEXT CHECK(tier IN ('starter', 'pro', 'enterprise')),
        activated_at INTEGER,
        last_validated INTEGER,
        hwid TEXT
      )
    `);
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }

  private createFeeTransactionsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS fee_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER,
        strategy_id INTEGER,
        fee_amount_sol REAL NOT NULL,
        fee_amount_usd REAL,
        fee_wallet TEXT NOT NULL,
        original_amount REAL NOT NULL,
        fee_percentage REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        signature TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (strategy_id) REFERENCES strategies(id)
      )
    `);

    // Create indexes for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_fee_transactions_timestamp 
      ON fee_transactions(timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_fee_transactions_status 
      ON fee_transactions(status);
    `);
  }
}

// Singleton instance
let dbInstance: DatabaseSchema | null = null;

export function initializeDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new DatabaseSchema();
  }
  return dbInstance.getDatabase();
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance.getDatabase();
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}



