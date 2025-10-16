-- Redesigned Fee System
-- System Default → Tier Override → User Override

-- Add fee override to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS fee_override_percentage DECIMAL(5, 2) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fee_notes TEXT;

-- Update license_tiers to make fee optional (NULL = use system default)
ALTER TABLE license_tiers ALTER COLUMN trade_fee_percentage DROP NOT NULL;
ALTER TABLE license_tiers ALTER COLUMN trade_fee_percentage DROP DEFAULT;

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type TEXT DEFAULT 'string',
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES 
    ('default_trade_fee_percentage', '0.5', 'decimal', 'Default trade fee percentage applied to all trades', 'fees'),
    ('fee_wallet_address', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd', 'string', 'Primary wallet for fee collection', 'fees'),
    ('site_name', 'Anvil License Server', 'string', 'Website name', 'general'),
    ('allow_user_fee_overrides', 'true', 'boolean', 'Allow admins to set custom fees per user', 'fees')
ON CONFLICT (setting_key) DO NOTHING;

-- Update existing tiers to use NULL for trade_fee_percentage (will use system default)
UPDATE license_tiers SET trade_fee_percentage = NULL WHERE tier_name IN ('free', 'tier1', 'tier2', 'tier3');

-- OR set specific overrides per tier:
-- UPDATE license_tiers SET trade_fee_percentage = 10.0 WHERE tier_name = 'free';      -- Free tier gets 10%
-- UPDATE license_tiers SET trade_fee_percentage = 5.0 WHERE tier_name = 'tier1';      -- Tier 1 gets 5%
-- UPDATE license_tiers SET trade_fee_percentage = NULL WHERE tier_name = 'tier2';     -- Tier 2 uses default
-- UPDATE license_tiers SET trade_fee_percentage = NULL WHERE tier_name = 'tier3';     -- Tier 3 uses default

-- Create index
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_users_fee_override ON users(fee_override_percentage);


