-- Anvil License Server Database Schema
-- Complete system with users, licenses, fees, downloads, and cloud sync

-- Users table with authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    profile_image VARCHAR(500),
    wallet_address VARCHAR(100)
);

-- Sessions table for JWT token management
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- License tiers configuration
CREATE TABLE IF NOT EXISTS license_tiers (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) UNIQUE NOT NULL,
    tier_display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    max_devices INTEGER DEFAULT 1,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tier_id INTEGER REFERENCES license_tiers(id),
    tier VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    hardware_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
    is_active BOOLEAN DEFAULT true,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    activated_at TIMESTAMP,
    last_validated TIMESTAMP,
    validation_count INTEGER DEFAULT 0,
    max_devices INTEGER DEFAULT 1,
    device_count INTEGER DEFAULT 0,
    metadata JSONB,
    notes TEXT,
    created_by INTEGER REFERENCES users(id)
);

-- License devices (for tracking multiple device activations)
CREATE TABLE IF NOT EXISTS license_devices (
    id SERIAL PRIMARY KEY,
    license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
    hardware_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_info JSONB,
    first_activated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(license_id, hardware_id)
);

-- Fee structures table
CREATE TABLE IF NOT EXISTS fee_structures (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN ('percentage', 'fixed', 'tiered')),
    fee_value DECIMAL(10, 4) NOT NULL,
    applies_to VARCHAR(50) NOT NULL CHECK (applies_to IN ('download', 'license', 'renewal', 'trade', 'all')),
    tier_filter VARCHAR(50), -- null means applies to all tiers
    min_amount DECIMAL(10, 2),
    max_amount DECIMAL(10, 2),
    recipient_wallet VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Fee transactions log
CREATE TABLE IF NOT EXISTS fee_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    license_id INTEGER REFERENCES licenses(id),
    fee_structure_id INTEGER REFERENCES fee_structures(id),
    transaction_type VARCHAR(50) NOT NULL,
    base_amount DECIMAL(10, 2),
    fee_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    recipient_wallet VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_hash VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Downloads tracking
CREATE TABLE IF NOT EXISTS downloads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    license_id INTEGER REFERENCES licenses(id),
    file_name VARCHAR(255) NOT NULL,
    file_version VARCHAR(50),
    file_size BIGINT,
    download_url VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(50) DEFAULT 'initiated' CHECK (status IN ('initiated', 'completed', 'failed', 'expired')),
    download_token VARCHAR(255) UNIQUE,
    token_expires_at TIMESTAMP,
    fee_applied DECIMAL(10, 2) DEFAULT 0,
    fee_transaction_id INTEGER REFERENCES fee_transactions(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB
);

-- Cloud sync data
CREATE TABLE IF NOT EXISTS cloud_sync (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    license_key VARCHAR(255) REFERENCES licenses(license_key),
    data_type VARCHAR(100) NOT NULL,
    data_key VARCHAR(255) NOT NULL,
    data_value JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    device_id VARCHAR(255),
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    UNIQUE(user_id, data_type, data_key)
);

-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Analytics aggregations
CREATE TABLE IF NOT EXISTS analytics_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 2) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, metric_name)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expires_at ON licenses(expires_at);
CREATE INDEX idx_license_devices_license_id ON license_devices(license_id);
CREATE INDEX idx_fee_transactions_user_id ON fee_transactions(user_id);
CREATE INDEX idx_fee_transactions_status ON fee_transactions(status);
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_license_id ON downloads(license_id);
CREATE INDEX idx_cloud_sync_user_id ON cloud_sync(user_id);
CREATE INDEX idx_cloud_sync_license_key ON cloud_sync(license_key);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Insert default license tiers
INSERT INTO license_tiers (tier_name, tier_display_name, description, price, duration_days, max_devices, features) VALUES
('free', 'Free', 'Basic features for testing', 0.00, 30, 1, '{"strategies": ["basic"], "support": "community", "updates": true}'),
('pro', 'Professional', 'Advanced trading features', 99.99, 365, 3, '{"strategies": ["basic", "advanced", "smart_ratio"], "support": "priority", "updates": true, "cloud_sync": true}'),
('enterprise', 'Enterprise', 'Full features with priority support', 499.99, 365, 10, '{"strategies": ["all"], "support": "24/7", "updates": true, "cloud_sync": true, "custom_strategies": true, "api_access": true}')
ON CONFLICT (tier_name) DO NOTHING;

-- Insert default fee structure
INSERT INTO fee_structures (name, description, fee_type, fee_value, applies_to, recipient_wallet, is_active, priority) VALUES
('Standard Download Fee', 'Applied to all software downloads', 'percentage', 2.5, 'download', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd', true, 1),
('License Purchase Fee', 'Applied to license purchases', 'percentage', 5.0, 'license', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd', true, 2)
ON CONFLICT DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('site_name', '"Anvil License Server"', 'Website name', true),
('maintenance_mode', 'false', 'Enable maintenance mode', false),
('allow_registration', 'true', 'Allow new user registration', false),
('require_email_verification', 'false', 'Require email verification for new users', false),
('max_download_attempts', '3', 'Maximum download attempts per license', false),
('download_token_expiry_hours', '24', 'Download token expiry in hours', false)
ON CONFLICT (setting_key) DO NOTHING;

