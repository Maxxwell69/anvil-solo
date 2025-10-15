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
  
  // System settings table (must be first for default values)
  await sql`
    CREATE TABLE IF NOT EXISTS system_settings (
      id SERIAL PRIMARY KEY,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      setting_type TEXT DEFAULT 'string',
      description TEXT,
      category TEXT DEFAULT 'general',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Insert default settings
  await sql`
    INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
    VALUES 
      ('default_trade_fee_percentage', '0.5', 'decimal', 'Default trade fee % for all trades', 'fees'),
      ('fee_wallet_address', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd', 'string', 'Primary fee collection wallet', 'fees'),
      ('site_name', 'Anvil License Server', 'string', 'Website name', 'general')
    ON CONFLICT (setting_key) DO NOTHING
  `;

  // Create users table with fee override
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      fee_override_percentage DECIMAL(5, 2) DEFAULT NULL,
      fee_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )
  `;

  // Add fee override columns if table already exists (for existing deployments)
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS fee_override_percentage DECIMAL(5, 2) DEFAULT NULL`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS fee_notes TEXT`;
  } catch (err) {
    // Columns might already exist, ignore error
    console.log('Fee override columns already exist or added');
  }

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
  
  // License tiers configuration table
  await sql`
    CREATE TABLE IF NOT EXISTS license_tiers (
      id SERIAL PRIMARY KEY,
      tier_name TEXT UNIQUE NOT NULL,
      tier_display_name TEXT NOT NULL,
      description TEXT,
      price_monthly DECIMAL(10, 2) DEFAULT 0,
      price_yearly DECIMAL(10, 2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      features JSONB NOT NULL DEFAULT '{}'::jsonb,
      max_concurrent_strategies INTEGER DEFAULT 1,
      max_wallets INTEGER DEFAULT 1,
      max_daily_trades INTEGER DEFAULT 10,
      trade_fee_percentage DECIMAL(5, 2) DEFAULT 0,
      fee_recipient_wallet TEXT,
      can_use_advanced_strategies BOOLEAN DEFAULT false,
      can_cloud_sync BOOLEAN DEFAULT false,
      support_level TEXT DEFAULT 'community',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Insert default tiers - YOUR CUSTOM CONFIGURATION
  await sql`
    INSERT INTO license_tiers (
      tier_name, tier_display_name, description, 
      price_monthly, price_yearly, features,
      max_concurrent_strategies, max_wallets, max_daily_trades,
      trade_fee_percentage, fee_recipient_wallet,
      can_use_advanced_strategies, can_cloud_sync, support_level
    ) VALUES
    (
      'free', 
      'Free Tier', 
      'Basic DCA strategy only - 1 active at a time',
      0.00, 
      0.00,
      '{
        "strategies": {
          "dca": {"max": 1, "enabled": true},
          "ratio": {"max": 0, "enabled": false, "locked": true},
          "bundle": {"max": 0, "enabled": false, "locked": true}
        },
        "ui_elements": {
          "ratio_section": "locked",
          "bundle_section": "locked",
          "cloud_sync": "locked"
        },
        "max_active_total": 1
      }'::jsonb,
      1, 1, 20,
      NULL, '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd',
      false, false, 'community'
    ),
    (
      'tier1', 
      'Tier 1 - Starter', 
      'DCA + Ratio trading with cloud sync',
      29.99, 
      299.99,
      '{
        "strategies": {
          "dca": {"max": 2, "enabled": true},
          "ratio": {"max": 1, "enabled": true},
          "bundle": {"max": 0, "enabled": false, "locked": true}
        },
        "ui_elements": {
          "ratio_section": "unlocked",
          "bundle_section": "locked",
          "cloud_sync": "unlocked"
        },
        "max_active_total": 3
      }'::jsonb,
      3, 2, 100,
      NULL, '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd',
      true, true, 'email'
    ),
    (
      'tier2', 
      'Tier 2 - Professional', 
      'DCA + Ratio + Bundle system unlocked',
      59.99, 
      599.99,
      '{
        "strategies": {
          "dca": {"max": 3, "enabled": true},
          "ratio": {"max": 3, "enabled": true},
          "bundle": {"max": 3, "enabled": true}
        },
        "ui_elements": {
          "ratio_section": "unlocked",
          "bundle_section": "unlocked",
          "cloud_sync": "unlocked"
        },
        "max_active_total": 9
      }'::jsonb,
      9, 3, 500,
      NULL, '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd',
      true, true, 'priority'
    ),
    (
      'tier3', 
      'Tier 3 - Enterprise', 
      'Unlimited everything - all features unlocked',
      99.99, 
      999.99,
      '{
        "strategies": {
          "dca": {"max": 999, "enabled": true},
          "ratio": {"max": 999, "enabled": true},
          "bundle": {"max": 999, "enabled": true}
        },
        "ui_elements": {
          "ratio_section": "unlocked",
          "bundle_section": "unlocked",
          "cloud_sync": "unlocked",
          "advanced_settings": "unlocked"
        },
        "max_active_total": 999
      }'::jsonb,
      999, 10, 9999,
      NULL, '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd',
      true, true, '24/7'
    )
    ON CONFLICT (tier_name) DO NOTHING
  `;

  // Trade fees tracking table
  await sql`
    CREATE TABLE IF NOT EXISTS trade_fees (
      id SERIAL PRIMARY KEY,
      license_key TEXT NOT NULL,
      trade_signature TEXT NOT NULL,
      token_in TEXT NOT NULL,
      token_out TEXT NOT NULL,
      amount_in DECIMAL NOT NULL,
      amount_out DECIMAL NOT NULL,
      fee_percentage DECIMAL(5, 2) NOT NULL,
      fee_amount_sol DECIMAL NOT NULL,
      fee_recipient_wallet TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      tier TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP,
      UNIQUE(trade_signature)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_trade_fees_license ON trade_fees(license_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_trade_fees_status ON trade_fees(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_license_tiers_active ON license_tiers(is_active)`;

  console.log('✅ PostgreSQL database initialized successfully');
  console.log('   📋 Tables: users, licenses, license_tiers, strategies, trades, trade_fees, archives');
  
  return sql;
}

export function getDatabase() {
  if (!sql) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return sql;
}

export default { initDatabase, getDatabase };





