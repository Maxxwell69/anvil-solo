-- ============================================
-- CREATE SUPER ADMIN ACCOUNT - MAXX FAIRO
-- ============================================
-- Run this in Railway PostgreSQL Database

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert your admin account
INSERT INTO users (email, username, full_name, role, is_active, password_hash)
VALUES (
    'maxx@pantherpilot.com',
    'traderMaxx',
    'maxx fairo',
    'super_admin',
    true,
    '$2b$10$JlUYeQVKwOcri3rW5vSJLeKl7/Pf/tOA3hgxJ8qVlErWCiZjrRYf2'
);

-- Verify the user was created
SELECT id, email, username, full_name, role, created_at 
FROM users 
WHERE email = 'maxx@pantherpilot.com';

-- ============================================
-- YOUR CREDENTIALS:
-- ============================================
-- Email: maxx@pantherpilot.com
-- Username: traderMaxx
-- Password: ShogunMaxx1969!
-- Role: super_admin
--
-- Login URL: https://anvil-solo-production.up.railway.app/login
-- Admin URL: https://anvil-solo-production.up.railway.app/admin
-- ============================================
