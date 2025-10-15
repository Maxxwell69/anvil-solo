import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { getDatabase } from '../database/postgres-init.js';

const router = Router();

// ONE-TIME SETUP: Create admin account
// Protected by ADMIN_KEY - only accessible by you
router.post('/create-first-admin', async (req: Request, res: Response) => {
    try {
        // Verify admin key from header
        const adminKey = req.headers['x-admin-key'];
        
        if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - Invalid admin key. Use X-Admin-Key header.',
                hint: 'Get your ADMIN_KEY from Railway environment variables',
            });
        }

        const sql = getDatabase();

        // Create users table
        console.log('Creating users table...');
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
        console.log('Users table created');

        // Admin credentials (hardcoded for you)
        const ADMIN_EMAIL = 'maxx@pantherpilot.com';
        const ADMIN_USERNAME = 'traderMaxx';
        const ADMIN_FULLNAME = 'maxx fairo';
        const ADMIN_PASSWORD = 'ShogunMaxx1969!';
        const ADMIN_ROLE = 'super_admin';

        // Check if user exists
        const existing = await sql`SELECT id, role FROM users WHERE email = ${ADMIN_EMAIL}`;
        
        if (existing.length > 0) {
            // Update to super admin
            await sql`UPDATE users SET role = ${ADMIN_ROLE} WHERE email = ${ADMIN_EMAIL}`;
            
            return res.json({
                success: true,
                message: 'User already exists - upgraded to super_admin',
                user: {
                    email: ADMIN_EMAIL,
                    username: ADMIN_USERNAME,
                    role: ADMIN_ROLE,
                },
                loginInfo: {
                    loginUrl: 'https://anvil-solo-production.up.railway.app/login',
                    adminUrl: 'https://anvil-solo-production.up.railway.app/admin',
                    email: ADMIN_EMAIL,
                    password: '(use your saved password)',
                },
            });
        }

        // Hash password
        console.log('Hashing password...');
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        console.log('Password hashed');

        // Create admin user
        console.log('Creating admin account...');
        const [user] = await sql`
            INSERT INTO users (email, username, full_name, role, is_active, password_hash)
            VALUES (${ADMIN_EMAIL}, ${ADMIN_USERNAME}, ${ADMIN_FULLNAME}, ${ADMIN_ROLE}, true, ${passwordHash})
            RETURNING id, email, username, full_name, role, created_at
        `;

        console.log('Admin account created successfully!');

        res.json({
            success: true,
            message: '🎉 Super admin account created successfully!',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.full_name,
                role: user.role,
                createdAt: user.created_at,
            },
            credentials: {
                email: ADMIN_EMAIL,
                username: ADMIN_USERNAME,
                password: ADMIN_PASSWORD,
                note: 'SAVE THESE CREDENTIALS SECURELY!',
            },
            nextSteps: {
                loginUrl: 'https://anvil-solo-production.up.railway.app/login',
                adminUrl: 'https://anvil-solo-production.up.railway.app/admin',
                instructions: [
                    '1. Save your credentials above',
                    '2. Go to the login URL',
                    '3. Login with your email and password',
                    '4. Access the admin panel',
                    '5. Start generating licenses!',
                ],
            },
        });

    } catch (error: any) {
        console.error('Admin setup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create admin account',
            details: error.message,
        });
    }
});

export default router;

