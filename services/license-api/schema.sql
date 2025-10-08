-- License API Database Schema

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    tier VARCHAR(50) NOT NULL, -- starter, pro, enterprise, lifetime
    hwid VARCHAR(255), -- Hardware ID for device binding
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP,
    last_validated TIMESTAMP,
    expires_at TIMESTAMP, -- NULL for lifetime licenses
    stripe_payment_id VARCHAR(255),
    notes TEXT
);

-- Create index on license_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_hwid ON licenses(hwid);

-- Users table (optional, for account system)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Link licenses to users
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Strategy backups table (for cloud backup feature)
CREATE TABLE IF NOT EXISTS strategy_backups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    license_key VARCHAR(255) REFERENCES licenses(license_key),
    strategy_name VARCHAR(255) NOT NULL,
    strategy_type VARCHAR(50) NOT NULL, -- dca, ratio, bundle
    strategy_config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_backups_user_id ON strategy_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_backups_license_key ON strategy_backups(license_key);

-- Sample license keys for testing
-- You would generate these programmatically in production
INSERT INTO licenses (license_key, tier, expires_at) VALUES 
    ('ANVIL-STARTER-TEST-0001', 'starter', NOW() + INTERVAL '30 days'),
    ('ANVIL-PRO-TEST-0001', 'pro', NOW() + INTERVAL '30 days'),
    ('ANVIL-ENTERPRISE-TEST-0001', 'enterprise', NOW() + INTERVAL '30 days'),
    ('ANVIL-LIFETIME-0001', 'lifetime', NULL)
ON CONFLICT (license_key) DO NOTHING;


