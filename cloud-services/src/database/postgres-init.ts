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
  
  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_licenses_hardware ON licenses(hardware_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_strategy_license ON strategy_executions(license_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_trades_license ON trade_history(license_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trade_history(strategy_id)`;
  
  console.log('✅ PostgreSQL database initialized successfully');
  
  return sql;
}

export function getDatabase() {
  if (!sql) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return sql;
}

export default { initDatabase, getDatabase };

