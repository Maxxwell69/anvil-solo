import postgres from 'postgres';

let sql: any;

export async function initDatabase() {
  // Railway provides DATABASE_URL automatically when you add PostgreSQL
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/anvil';
  
  sql = postgres(connectionString, {
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS licenses (
      id SERIAL PRIMARY KEY,
      license_key TEXT UNIQUE NOT NULL,
      hardware_id TEXT,
      email TEXT,
      tier TEXT NOT NULL DEFAULT 'starter',
      status TEXT NOT NULL DEFAULT 'active',
      max_strategies INTEGER NOT NULL DEFAULT 3,
      max_wallets INTEGER NOT NULL DEFAULT 3,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      activated_at TIMESTAMP,
      expires_at TIMESTAMP,
      last_validated TIMESTAMP
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS strategy_executions (
      id SERIAL PRIMARY KEY,
      license_key TEXT NOT NULL,
      strategy_type TEXT NOT NULL,
      token_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      config JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_executed TIMESTAMP,
      total_trades INTEGER DEFAULT 0,
      FOREIGN KEY (license_key) REFERENCES licenses(license_key)
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS trade_history (
      id SERIAL PRIMARY KEY,
      license_key TEXT NOT NULL,
      strategy_id INTEGER,
      token_address TEXT NOT NULL,
      trade_type TEXT NOT NULL,
      amount DECIMAL NOT NULL,
      price DECIMAL,
      signature TEXT,
      status TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (license_key) REFERENCES licenses(license_key),
      FOREIGN KEY (strategy_id) REFERENCES strategy_executions(id)
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS user_data (
      id SERIAL PRIMARY KEY,
      license_key TEXT UNIQUE NOT NULL,
      settings JSONB,
      preferences JSONB,
      last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (license_key) REFERENCES licenses(license_key)
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS analytics (
      id SERIAL PRIMARY KEY,
      license_key TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (license_key) REFERENCES licenses(license_key)
    )
  `;
  
  // Archived strategies table
  await sql`
    CREATE TABLE IF NOT EXISTS archived_strategies (
      id SERIAL PRIMARY KEY,
      license_key TEXT NOT NULL,
      local_strategy_id INTEGER NOT NULL,
      strategy_type TEXT NOT NULL,
      token_address TEXT NOT NULL,
      config JSONB NOT NULL,
      progress JSONB,
      archive_notes TEXT,
      created_at TIMESTAMP NOT NULL,
      archived_at TIMESTAMP NOT NULL,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      transaction_count INTEGER DEFAULT 0,
      total_volume DECIMAL DEFAULT 0,
      UNIQUE(license_key, local_strategy_id)
    )
  `;
  
  // Archived transactions table
  await sql`
    CREATE TABLE IF NOT EXISTS archived_transactions (
      id SERIAL PRIMARY KEY,
      license_key TEXT NOT NULL,
      local_strategy_id INTEGER NOT NULL,
      signature TEXT NOT NULL,
      type TEXT NOT NULL,
      input_token TEXT NOT NULL,
      output_token TEXT NOT NULL,
      input_amount DECIMAL NOT NULL,
      output_amount DECIMAL NOT NULL,
      dex_used TEXT,
      status TEXT NOT NULL,
      timestamp TIMESTAMP NOT NULL,
      UNIQUE(license_key, signature)
    )
  `;
  
  // Fee collections table
  await sql`
    CREATE TABLE IF NOT EXISTS fee_collections (
      id SERIAL PRIMARY KEY,
      from_wallet TEXT NOT NULL,
      to_wallet TEXT NOT NULL,
      amount_sol DECIMAL NOT NULL,
      amount_usd DECIMAL,
      signature TEXT UNIQUE NOT NULL,
      strategy_id INTEGER,
      strategy_type TEXT,
      timestamp TIMESTAMP NOT NULL,
      status TEXT DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_licenses_hardware ON licenses(hardware_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_strategy_license ON strategy_executions(license_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_trades_license ON trade_history(license_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trade_history(strategy_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_archived_license ON archived_strategies(license_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_archived_tx_license ON archived_transactions(license_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_archived_tx_strategy ON archived_transactions(local_strategy_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_fees_timestamp ON fee_collections(timestamp DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_fees_wallet ON fee_collections(from_wallet)`;
  
  console.log('✅ PostgreSQL database initialized successfully');
  console.log('   📋 Tables: licenses, strategies, trades, user_data, analytics, archives, fees');
  
  return sql;
}

export function getDatabase() {
  if (!sql) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return sql;
}

export default { initDatabase, getDatabase };





