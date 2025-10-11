import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database;

export async function initDatabase() {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/anvil-cloud.db');
  
  db = new Database(dbPath);
  
  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');
  
  // Create tables
  db.exec(`
    -- License table
    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT UNIQUE NOT NULL,
      hardware_id TEXT,
      email TEXT,
      tier TEXT NOT NULL DEFAULT 'starter',
      status TEXT NOT NULL DEFAULT 'active',
      max_strategies INTEGER NOT NULL DEFAULT 3,
      max_wallets INTEGER NOT NULL DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      activated_at DATETIME,
      expires_at DATETIME,
      last_validated DATETIME
    );
    
    -- Strategy executions (cloud-based)
    CREATE TABLE IF NOT EXISTS strategy_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT NOT NULL,
      strategy_type TEXT NOT NULL,
      token_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      config TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_executed DATETIME,
      total_trades INTEGER DEFAULT 0,
      FOREIGN KEY (license_key) REFERENCES licenses(license_key)
    );
    
    -- Trade history (cloud storage)
    CREATE TABLE IF NOT EXISTS trade_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT NOT NULL,
      strategy_id INTEGER,
      token_address TEXT NOT NULL,
      trade_type TEXT NOT NULL,
      amount REAL NOT NULL,
      price REAL,
      signature TEXT,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (license_key) REFERENCES licenses(license_key),
      FOREIGN KEY (strategy_id) REFERENCES strategy_executions(id)
    );
    
    -- User data (no wallets/keys!)
    CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT UNIQUE NOT NULL,
      settings TEXT,
      preferences TEXT,
      last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (license_key) REFERENCES licenses(license_key)
    );
    
    -- Analytics (optional)
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (license_key) REFERENCES licenses(license_key)
    );
    
    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
    CREATE INDEX IF NOT EXISTS idx_licenses_hardware ON licenses(hardware_id);
    CREATE INDEX IF NOT EXISTS idx_strategy_license ON strategy_executions(license_key);
    CREATE INDEX IF NOT EXISTS idx_trades_license ON trade_history(license_key);
    CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trade_history(strategy_id);
  `);
  
  console.log('✅ Database initialized successfully');
  
  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export default { initDatabase, getDatabase };

