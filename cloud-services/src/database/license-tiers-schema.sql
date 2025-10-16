-- Enhanced License Tier System with Feature Control

-- License tiers configuration table
CREATE TABLE IF NOT EXISTS license_tiers (
    id SERIAL PRIMARY KEY,
    tier_name TEXT UNIQUE NOT NULL,
    tier_display_name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) DEFAULT 0,
    price_yearly DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Feature flags
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Trading limits
    max_concurrent_strategies INTEGER DEFAULT 1,
    max_wallets INTEGER DEFAULT 1,
    max_daily_trades INTEGER DEFAULT 10,
    max_trade_amount_sol DECIMAL(10, 2),
    
    -- Trade fee configuration
    trade_fee_percentage DECIMAL(5, 2) DEFAULT 0,
    fee_recipient_wallet TEXT,
    
    -- Access controls
    can_use_advanced_strategies BOOLEAN DEFAULT false,
    can_use_custom_strategies BOOLEAN DEFAULT false,
    can_access_api BOOLEAN DEFAULT false,
    can_cloud_sync BOOLEAN DEFAULT false,
    
    -- Support level
    support_level TEXT DEFAULT 'community', -- community, email, priority, 24/7
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update licenses table to reference tiers
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS tier_id INTEGER REFERENCES license_tiers(id);

-- Insert default license tiers
INSERT INTO license_tiers (
    tier_name, 
    tier_display_name, 
    description, 
    price_monthly,
    price_yearly,
    features,
    max_concurrent_strategies,
    max_wallets,
    max_daily_trades,
    trade_fee_percentage,
    fee_recipient_wallet,
    can_use_advanced_strategies,
    can_cloud_sync,
    support_level
) VALUES
(
    'free',
    'Free Trial',
    '30-day free trial with basic features',
    0.00,
    0.00,
    '{"strategies": ["basic"], "indicators": ["rsi", "macd"], "auto_trading": false}'::jsonb,
    1,
    1,
    10,
    10.00, -- 10% trade fee for free tier
    '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd',
    false,
    false,
    'community'
),
(
    'pro',
    'Professional',
    'Full-featured trading bot for serious traders',
    49.99,
    499.99,
    '{"strategies": ["basic", "advanced", "smart_ratio", "dca"], "indicators": ["all"], "auto_trading": true, "backtesting": true}'::jsonb,
    5,
    3,
    100,
    5.00, -- 5% trade fee for pro tier
    '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd',
    true,
    true,
    'priority'
),
(
    'enterprise',
    'Enterprise',
    'Unlimited access with 24/7 support and API access',
    199.99,
    1999.99,
    '{"strategies": ["all"], "indicators": ["all"], "auto_trading": true, "backtesting": true, "custom_strategies": true, "api_access": true, "webhooks": true}'::jsonb,
    99,
    10,
    1000,
    2.50, -- 2.5% trade fee for enterprise tier
    '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd',
    true,
    true,
    '24/7'
)
ON CONFLICT (tier_name) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    trade_fee_percentage = EXCLUDED.trade_fee_percentage,
    fee_recipient_wallet = EXCLUDED.fee_recipient_wallet,
    updated_at = CURRENT_TIMESTAMP;

-- Create index
CREATE INDEX IF NOT EXISTS idx_license_tiers_active ON license_tiers(is_active);


