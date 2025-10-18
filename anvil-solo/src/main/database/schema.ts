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
    this.createDiagnosticTables();

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
        status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'stopped', 'completed', 'archived', 'deleted')) DEFAULT 'stopped',
        progress TEXT,
        archived_at INTEGER,
        deleted_at INTEGER,
        cloud_synced BOOLEAN DEFAULT FALSE,
        archive_notes TEXT,
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
      { key: 'schema_version', value: '2' }, // Track database schema version for migrations
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
        tier TEXT,
        features TEXT,
        expires_at INTEGER,
        activated_at INTEGER,
        last_validated INTEGER,
        hwid TEXT
      )
    `);
  }

  private createDiagnosticTables(): void {
    // System health checks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_health_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        check_type TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pass', 'fail', 'warning')),
        response_time_ms INTEGER,
        error_message TEXT,
        details TEXT,
        timestamp INTEGER NOT NULL
      )
    `);

    // Code execution logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS code_execution_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        function_name TEXT NOT NULL,
        module_name TEXT NOT NULL,
        execution_time_ms REAL,
        status TEXT NOT NULL CHECK(status IN ('started', 'completed', 'failed')),
        error_message TEXT,
        stack_trace TEXT,
        timestamp INTEGER NOT NULL
      )
    `);

    // System events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'error', 'critical')),
        message TEXT NOT NULL,
        details TEXT,
        timestamp INTEGER NOT NULL
      )
    `);

    // Performance metrics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_type TEXT NOT NULL,
        metric_value REAL NOT NULL,
        unit TEXT,
        context TEXT,
        timestamp INTEGER NOT NULL
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON system_health_checks(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_code_logs_timestamp ON code_execution_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp DESC);
    `);

    console.log('✅ Diagnostic tables created');
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }

  private runMigrations(): void {
    console.log('Running database migrations...');

    // Migration -1: Fix license table (remove CHECK constraint, add columns)
    console.log('  🔧 Migration -1: Checking license table schema...');
    try {
      const tableInfo = this.db.prepare("PRAGMA table_info(license)").all();
      const hasFeatures = tableInfo.some((col: any) => col.name === 'features');
      const hasExpiresAt = tableInfo.some((col: any) => col.name === 'expires_at');
      
      // Check if tier has restrictive CHECK constraint
      let needsRecreate = false;
      try {
        // Try to insert a 'free' tier to test constraint
        this.db.prepare('BEGIN').run();
        this.db.prepare('INSERT INTO license (id, license_key, tier) VALUES (999, "__test__", "free")').run();
        this.db.prepare('DELETE FROM license WHERE id = 999').run();
        this.db.prepare('COMMIT').run();
      } catch (e: any) {
        this.db.prepare('ROLLBACK').run();
        if (e.message.includes('CHECK constraint')) {
          needsRecreate = true;
          console.log('  🔧 License table has restrictive CHECK constraint - needs recreation');
        }
      }
      
      if (!hasFeatures || !hasExpiresAt || needsRecreate) {
        console.log('  🔧 Recreating license table with proper schema...');
        
        // Get existing data
        const existingLicense = this.db.prepare('SELECT * FROM license WHERE id = 1').get() as any;
        
        // Drop old table
        this.db.exec('DROP TABLE IF EXISTS license');
        
        // Create new table without restrictive CHECK constraint
        this.db.exec(`
          CREATE TABLE license (
            id INTEGER PRIMARY KEY CHECK(id = 1),
            license_key TEXT,
            tier TEXT,
            features TEXT,
            expires_at INTEGER,
            activated_at INTEGER,
            last_validated INTEGER,
            hwid TEXT
          )
        `);
        
        // Restore data if it existed
        if (existingLicense) {
          this.db.prepare(`
            INSERT INTO license (id, license_key, tier, features, expires_at, activated_at, last_validated, hwid)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            existingLicense.license_key || null,
            existingLicense.tier || null,
            existingLicense.features || null,
            existingLicense.expires_at || null,
            existingLicense.activated_at || null,
            existingLicense.last_validated || null,
            existingLicense.hwid || null
          );
          console.log('  ✅ Restored existing license data');
        }
        
        console.log('  ✅ License table recreated with proper schema');
      } else {
        console.log('  ✅ License table schema is correct');
      }
    } catch (migrationError: any) {
      console.error('  ❌ License table migration failed:', migrationError.message);
    }

    // Migration 0: Ensure fee settings exist (for databases created before fee system)
    console.log('  🔧 Migration 0: Checking fee settings...');
    try {
      const feeEnabled = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('fee_enabled');
      const feePercentage = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('fee_percentage');
      const feeWallet = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('fee_wallet_address');
      
      console.log('  📊 Current fee settings:', {
        enabled: (feeEnabled as any)?.value || 'NOT SET',
        percentage: (feePercentage as any)?.value || 'NOT SET',
        wallet: (feeWallet as any)?.value ? (feeWallet as any).value.substring(0, 8) + '...' : 'NOT SET'
      });
      
      let settingsAdded = 0;
      
      if (!feeEnabled) {
        console.log('  🔧 Adding fee_enabled setting');
        this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('fee_enabled', 'true');
        settingsAdded++;
      }
      if (!feePercentage) {
        console.log('  🔧 Adding fee_percentage setting');
        this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('fee_percentage', '0.5');
        settingsAdded++;
      }
      if (!feeWallet) {
        console.log('  🔧 Adding fee_wallet_address setting');
        this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('fee_wallet_address', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd');
        settingsAdded++;
      }
      
      if (settingsAdded > 0) {
        console.log(`  ✅ Fee settings migration complete - added ${settingsAdded} settings`);
      } else {
        console.log('  ✅ Fee settings migration complete - all settings already exist');
      }
    } catch (migrationError: any) {
      console.error('  ❌ Fee settings migration failed:', migrationError.message);
      console.error('  📋 Error details:', migrationError);
    }

    // Migration 1: Add archive fields and update CHECK constraint
    console.log('  🔧 Migration 1: Checking archive support...');
    try {
      let needsMigration = false;
      
      // ALWAYS test if archive works, regardless of schema version
      console.log('  🔍 Testing if "archived" status is allowed...');
      try {
        // Use a transaction to test without leaving test data
        const testQuery = this.db.prepare(`
          INSERT INTO strategies (type, token_address, config, status, created_at, updated_at)
          VALUES ('dca', '__migration_test__', '{}', 'archived', 0, 0)
        `);
        
        this.db.prepare('BEGIN').run();
        testQuery.run();
        this.db.prepare('ROLLBACK').run();
        
        console.log('  ✅ Archive status test PASSED - "archived" is allowed');
        needsMigration = false;
      } catch (testError: any) {
        // Make sure to rollback on any error
        try { this.db.prepare('ROLLBACK').run(); } catch {}
        
        console.log('  ❌ Archive status test FAILED:', testError.message);
        console.log('  📋 SQLite error code:', testError.code);
        
        // Any error means migration is needed
        needsMigration = true;
        
        if (testError.message.includes('CHECK constraint')) {
          console.log('  🔧 Reason: CHECK constraint does not include "archived"');
        } else if (testError.message.includes('no such column')) {
          console.log('  🔧 Reason: Archive columns missing');
        } else {
          console.log('  🔧 Reason: Unknown error - migration required');
        }
        
        console.log('  ⚠️  MIGRATION IS REQUIRED TO FIX THIS');
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
        
        // Step 6: Update schema version to 2
        this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('schema_version', '2');
        console.log('  Step 6: Schema version updated to 2 ✅');
        
        console.log('  ✅ Migration completed - Archive status now supported!');
      } else {
        console.log('  ✅ Archive support already enabled');
      }
    } catch (error: any) {
      console.error('  ❌ Migration failed:', error.message);
      console.error('  Full error:', error);
      // Don't throw - allow app to continue with existing schema
    }
    
    // Migration 2: Add 'deleted' status and deleted_at column for soft delete
    console.log('  🔧 Migration 2: Adding soft delete support...');
    try {
      // Check if strategies table has deleted_at column
      const tableInfo = this.db.prepare("PRAGMA table_info(strategies)").all();
      const hasDeletedAt = tableInfo.some((col: any) => col.name === 'deleted_at');
      
      // Check if 'deleted' status is allowed
      let needsStatusUpdate = false;
      try {
        this.db.prepare('BEGIN').run();
        this.db.prepare('INSERT INTO strategies (type, token_address, config, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
          'dca', 'test', '{}', 'deleted', Date.now(), Date.now()
        );
        const testId = this.db.prepare('SELECT last_insert_rowid() as id').get() as any;
        this.db.prepare('DELETE FROM strategies WHERE id = ?').run(testId.id);
        this.db.prepare('COMMIT').run();
      } catch (e: any) {
        this.db.prepare('ROLLBACK').run();
        if (e.message.includes('CHECK constraint')) {
          needsStatusUpdate = true;
          console.log('  🔧 Strategies table needs to support "deleted" status');
        }
      }
      
      if (!hasDeletedAt || needsStatusUpdate) {
        console.log('  🔧 Recreating strategies table with soft delete support...');
        
        // Get existing data
        const existingStrategies = this.db.prepare('SELECT * FROM strategies').all();
        console.log(`  Found ${existingStrategies.length} existing strategies to migrate`);
        
        // Create new table with deleted status and deleted_at column
        this.db.exec(`
          CREATE TABLE strategies_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK(type IN ('dca', 'ratio', 'bundle')),
            token_address TEXT NOT NULL,
            config TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'stopped', 'completed', 'archived', 'deleted')) DEFAULT 'stopped',
            progress TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            archived_at INTEGER,
            deleted_at INTEGER,
            cloud_synced BOOLEAN DEFAULT FALSE,
            archive_notes TEXT
          )
        `);
        
        // Copy all data from old table
        this.db.exec(`
          INSERT INTO strategies_new (id, type, token_address, config, status, progress, created_at, updated_at, archived_at, cloud_synced, archive_notes)
          SELECT id, type, token_address, config, status, progress, created_at, updated_at, archived_at, cloud_synced, archive_notes
          FROM strategies
        `);
        
        // Drop old table
        this.db.exec('DROP TABLE strategies');
        
        // Rename new table
        this.db.exec('ALTER TABLE strategies_new RENAME TO strategies');
        
        // Recreate indexes
        this.db.exec(`
          CREATE INDEX IF NOT EXISTS idx_strategies_status 
          ON strategies(status)
        `);
        
        console.log('  ✅ Migration 2 completed - Soft delete now supported!');
      } else {
        console.log('  ✅ Soft delete support already enabled');
      }
    } catch (error: any) {
      console.error('  ❌ Migration 2 failed:', error.message);
      console.error('  Full error:', error);
      // Don't throw - allow app to continue with existing schema
    }
    
    // Migration 3: Fix license table to allow all tier types including 'free' and 'lifetime'
    console.log('  🔧 Migration 3: Fixing license table tier constraint...');
    try {
      // Check if license table has restrictive tier CHECK constraint
      let needsRecreate = false;
      try {
        // Try to insert a 'lifetime' tier to test constraint
        this.db.prepare('BEGIN').run();
        this.db.prepare('INSERT OR REPLACE INTO license (id, license_key, tier) VALUES (999, "__test_lifetime__", "lifetime")').run();
        this.db.prepare('DELETE FROM license WHERE id = 999').run();
        this.db.prepare('COMMIT').run();
      } catch (e: any) {
        this.db.prepare('ROLLBACK').run();
        if (e.message.includes('CHECK constraint')) {
          needsRecreate = true;
          console.log('  🔧 License table has restrictive tier CHECK constraint - needs recreation');
        }
      }
      
      if (needsRecreate) {
        console.log('  🔧 Recreating license table without tier CHECK constraint...');
        
        // Get existing data
        const existingLicense = this.db.prepare('SELECT * FROM license WHERE id = 1').get() as any;
        
        // Drop old table
        this.db.exec('DROP TABLE IF EXISTS license');
        
        // Create new table without CHECK constraint on tier
        this.db.exec(`
          CREATE TABLE license (
            id INTEGER PRIMARY KEY CHECK(id = 1),
            license_key TEXT,
            tier TEXT,
            features TEXT,
            expires_at INTEGER,
            activated_at INTEGER,
            last_validated INTEGER,
            hwid TEXT
          )
        `);
        
        // Restore data if it existed
        if (existingLicense) {
          this.db.prepare(`
            INSERT INTO license (id, license_key, tier, features, expires_at, activated_at, last_validated, hwid)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            1,
            existingLicense.license_key || null,
            existingLicense.tier || 'free',
            existingLicense.features || JSON.stringify({
              maxActiveStrategies: 1,
              maxWallets: 1,
              strategyTypes: ['dca'],
              cloudBackup: false,
              prioritySupport: false
            }),
            existingLicense.expires_at || null,
            existingLicense.activated_at || null,
            existingLicense.last_validated || null,
            existingLicense.hwid || null
          );
        }
        
        console.log('  ✅ Migration 3 completed - All tier types now supported!');
      } else {
        console.log('  ✅ License table already supports all tier types');
      }
    } catch (error: any) {
      console.error('  ❌ Migration 3 failed:', error.message);
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
  
  // Ensure fee settings exist every time (fallback for existing installations)
  ensureFeeSettings();
  
  return dbInstance.getDatabase();
}

function ensureFeeSettings(): void {
  try {
    const db = dbInstance?.getDatabase();
    if (!db) return;
    
    console.log('🔧 Ensuring fee settings exist...');
    
    const feeEnabled = db.prepare('SELECT value FROM settings WHERE key = ?').get('fee_enabled');
    const feePercentage = db.prepare('SELECT value FROM settings WHERE key = ?').get('fee_percentage');
    const feeWallet = db.prepare('SELECT value FROM settings WHERE key = ?').get('fee_wallet_address');
    
    let settingsAdded = 0;
    
    if (!feeEnabled) {
      console.log('  🔧 Adding missing fee_enabled setting');
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('fee_enabled', 'true');
      settingsAdded++;
    }
    if (!feePercentage) {
      console.log('  🔧 Adding missing fee_percentage setting');
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('fee_percentage', '0.5');
      settingsAdded++;
    }
    if (!feeWallet) {
      console.log('  🔧 Adding missing fee_wallet_address setting');
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('fee_wallet_address', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd');
      settingsAdded++;
    }
    
    if (settingsAdded > 0) {
      console.log(`✅ Fee settings ensured - added ${settingsAdded} missing settings`);
    } else {
      console.log('✅ Fee settings verified - all present');
    }
  } catch (error: any) {
    console.error('❌ Failed to ensure fee settings:', error.message);
  }
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



