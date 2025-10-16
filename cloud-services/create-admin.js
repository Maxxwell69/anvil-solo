// Automated Admin Account Creator
// This script creates your admin account directly in the database

import postgres from 'postgres';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminAccount() {
    console.log('========================================');
    console.log('Creating Admin Account for Maxx Fairo');
    console.log('========================================\n');

    // Your credentials
    const ADMIN_EMAIL = 'maxx@pantherpilot.com';
    const ADMIN_USERNAME = 'traderMaxx';
    const ADMIN_FULLNAME = 'maxx fairo';
    const ADMIN_PASSWORD = 'ShogunMaxx1969!';
    const ADMIN_ROLE = 'super_admin';

    try {
        // Connect to database
        console.log('📊 Connecting to database...');
        const sql = postgres(process.env.DATABASE_URL, {
            max: 1,
            idle_timeout: 20,
            connect_timeout: 10,
        });

        console.log('✅ Connected to database\n');

        // Create users table if not exists
        console.log('📋 Creating users table...');
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'user',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Users table ready\n');

        // Check if user already exists
        console.log('🔍 Checking if user exists...');
        const existing = await sql`SELECT id FROM users WHERE email = ${ADMIN_EMAIL}`;
        
        if (existing.length > 0) {
            console.log('⚠️  User already exists! Updating role to super_admin...');
            await sql`UPDATE users SET role = ${ADMIN_ROLE} WHERE email = ${ADMIN_EMAIL}`;
            console.log('✅ Role updated to super_admin\n');
        } else {
            // Hash password
            console.log('🔐 Hashing password...');
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
            console.log('✅ Password hashed\n');

            // Create user
            console.log('👤 Creating admin account...');
            const [user] = await sql`
                INSERT INTO users (email, username, full_name, role, is_active, password_hash)
                VALUES (${ADMIN_EMAIL}, ${ADMIN_USERNAME}, ${ADMIN_FULLNAME}, ${ADMIN_ROLE}, true, ${passwordHash})
                RETURNING id, email, username, full_name, role, created_at
            `;

            console.log('✅ Admin account created!\n');
            console.log('========================================');
            console.log('Account Details:');
            console.log('========================================');
            console.log(`ID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Username: ${user.username}`);
            console.log(`Full Name: ${user.full_name}`);
            console.log(`Role: ${user.role}`);
            console.log(`Created: ${user.created_at}`);
        }

        // Verify
        console.log('\n========================================');
        console.log('Verification:');
        console.log('========================================');
        const [verify] = await sql`
            SELECT id, email, username, full_name, role, is_active, created_at
            FROM users
            WHERE email = ${ADMIN_EMAIL}
        `;

        console.log(`✅ User ID: ${verify.id}`);
        console.log(`✅ Email: ${verify.email}`);
        console.log(`✅ Username: ${verify.username}`);
        console.log(`✅ Full Name: ${verify.full_name}`);
        console.log(`✅ Role: ${verify.role}`);
        console.log(`✅ Active: ${verify.is_active}`);

        console.log('\n========================================');
        console.log('YOUR LOGIN CREDENTIALS:');
        console.log('========================================');
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log('');
        console.log('Login at:');
        console.log('https://anvil-solo-production.up.railway.app/login');
        console.log('');
        console.log('Admin Panel:');
        console.log('https://anvil-solo-production.up.railway.app/admin');
        console.log('========================================\n');

        console.log('🎉 SUCCESS! You can now login with your credentials!\n');

        await sql.end();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error creating admin account:', error);
        console.error('\nPlease check:');
        console.error('1. DATABASE_URL is set in .env');
        console.error('2. PostgreSQL database is accessible');
        console.error('3. Network connection is working');
        process.exit(1);
    }
}

// Run it
createAdminAccount();


