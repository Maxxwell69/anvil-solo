// Run this locally - it will create your admin account in Railway's database
import postgres from 'postgres';
import bcrypt from 'bcrypt';

// Your Railway database URL
const DATABASE_URL = 'postgresql://postgres:oVhxizweqqlGgYNkMIZuOKhMaxcqvrdd@roundhouse.proxy.rlwy.net:30420/railway';

async function createAdmin() {
    console.log('🔐 Creating admin account in Railway database...\n');

    try {
        const sql = postgres(DATABASE_URL, {
            max: 1,
            ssl: 'require',
        });

        // Create table
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
        console.log('✅ Table ready\n');

        // Hash password
        console.log('🔐 Hashing password...');
        const passwordHash = await bcrypt.hash('ShogunMaxx1969!', 10);
        console.log('✅ Password hashed\n');

        // Create admin
        console.log('👤 Creating admin account...');
        const [user] = await sql`
            INSERT INTO users (email, username, full_name, role, is_active, password_hash)
            VALUES ('maxx@pantherpilot.com', 'traderMaxx', 'maxx fairo', 'super_admin', true, ${passwordHash})
            RETURNING id, email, username, full_name, role, created_at
        `.catch(async (err) => {
            if (err.message.includes('duplicate')) {
                console.log('⚠️  User exists, updating role...');
                await sql`UPDATE users SET role = 'super_admin' WHERE email = 'maxx@pantherpilot.com'`;
                const [updated] = await sql`SELECT id, email, username, full_name, role FROM users WHERE email = 'maxx@pantherpilot.com'`;
                return [updated];
            }
            throw err;
        });

        console.log('✅ Admin account created!\n');
        console.log('========================================');
        console.log('YOUR CREDENTIALS:');
        console.log('========================================');
        console.log('Email:    maxx@pantherpilot.com');
        console.log('Username: traderMaxx');
        console.log('Password: ShogunMaxx1969!');
        console.log('Role:     super_admin');
        console.log('');
        console.log('Login at:');
        console.log('https://anvil-solo-production.up.railway.app/login');
        console.log('');
        console.log('Admin panel at:');
        console.log('https://anvil-solo-production.up.railway.app/admin');
        console.log('========================================\n');

        await sql.end();
        console.log('🎉 SUCCESS! You can now login!\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdmin();

