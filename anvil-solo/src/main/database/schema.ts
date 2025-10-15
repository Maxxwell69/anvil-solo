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
    this.createActivityLogsTable();

    // Run migrations for existing databases
    this.runMigrations();

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
      { key: 'rpc_url', value: 'https://mainnet.helius-rpc.com/?api-key=18937bea-7c1f-4930-9474-7c3b715235de' },
      { key: 'default_slippage_bps', value: '100' },
      { key: 'default_priority_fee', value: '100000' }, // Medium (default)
      { key: 'priority_fee_low', value: '10000' },      // 0.00001 SOL
      { key: 'priority_fee_medium', value: '100000' },  // 0.0001 SOL
      { key: 'priority_fee_high', value: '500000' },    // 0.0005 SOL
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

  private runMigrations(): void {
    console.log('Running database migrations...');

    // Migration 1: Add archive fields and update CHECK constraint
    try {
      // Test if 'archived' status is allowed by trying to use it
      let needsMigration = false;
      
      try {
        // Try to insert a test row with 'archived' status
        this.db.exec(`
          INSERT INTO strategies (type, token_address, config, status, created_at, updated_at)
          VALUES ('dca', 'test', '{}', 'archived', 0, 0)
        `);
        // If it worked, delete the test row
        this.db.exec(`DELETE FROM strategies WHERE token_address = 'test' AND created_at = 0`);
        console.log('  ℹ️  CHECK constraint already supports "archived" status');
      } catch (testError: any) {
        if (testError.message.includes('CHECK constraint')) {
          needsMigration = true;
          console.log('  ⚠️  CHECK constraint needs update - "archived" not allowed yet');
        }
      }
      
      if (needsMigration) {
        console.log('  Migration 1: Recreating strategies table with archive support...');
        
        // SQLite doesn't allow modifying CHECK constraints, so we need to recreate the table
        // Step 1: Create new table with updated schema
        this.db.exec(`
          CREATE TABLE strategies_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK(type IN ('dca', 'ratio', 'bundle')),
            token_address TEXT NOT NULL,
            config TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'stopped', 'completed', 'archived')) DEFAULT 'stopped',
            progress TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            archived_at INTEGER,
            cloud_synced BOOLEAN DEFAULT FALSE,
            archive_notes TEXT
          )
        `);
        
        console.log('  Step 1: New table created ✅');
        
        // Step 2: Copy all data from old table
        this.db.exec(`
          INSERT INTO strategies_new (id, type, token_address, config, status, progress, created_at, updated_at)
          SELECT id, type, token_address, config, status, progress, created_at, updated_at
          FROM strategies
        `);
        
        console.log('  Step 2: Data copied ✅');
        
        // Step 3: Drop old table
        this.db.exec(`DROP TABLE strategies`);
        
        console.log('  Step 3: Old table dropped ✅');
        
        // Step 4: Rename new table
        this.db.exec(`ALTER TABLE strategies_new RENAME TO strategies`);
        
        console.log('  Step 4: Table renamed ✅');
        
        // Step 5: Recreate indexes
        this.db.exec(`
          CREATE INDEX IF NOT EXISTS idx_strategies_status 
          ON strategies(status)
        `);
        
        this.db.exec(`
          CREATE INDEX IF NOT EXISTS idx_strategies_archived 
          ON strategies(archived_at) WHERE archived_at IS NOT NULL
        `);
        
        console.log('  Step 5: Indexes recreated ✅');
        console.log('  ✅ Migration completed - Archive status now supported!');
      } else {
        console.log('  ✅ Archive support already enabled');
      }
    } catch (error: any) {
      console.error('  ❌ Migration failed:', error.message);
      console.error('  Full error:', error);
      // Don't throw - allow app to continue with existing schema
    }
    
    console.log('Migrations completed');
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

  private createActivityLogsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('strategy', 'trade', 'wallet', 'system')),
        title TEXT NOT NULL,
        description TEXT,
        strategy_id INTEGER,
        wallet_id INTEGER,
        transaction_id INTEGER,
        metadata TEXT,
        severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'success', 'warning', 'error')),
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (strategy_id) REFERENCES strategies(id),
        FOREIGN KEY (wallet_id) REFERENCES wallets(id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      )
    `);

    // Create indexes for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp 
      ON activity_logs(timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_activity_logs_category 
      ON activity_logs(category);
      
      CREATE INDEX IF NOT EXISTS idx_activity_logs_strategy 
      ON activity_logs(strategy_id);
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



