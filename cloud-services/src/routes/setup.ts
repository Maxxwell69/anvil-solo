import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { getDatabase } from '../database/init.js';

const router = Router();

// One-time setup endpoint to create admin account
router.post('/create-admin', async (req: Request, res: Response) => {
    try {
        // Verify admin key
        const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
        if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({
                success: false,
                error: 'Invalid admin key. Use X-Admin-Key header or adminKey in body.',
            });
        }

        const sql = getDatabase();

        // Create users table
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

        // Admin credentials
        const ADMIN_EMAIL = 'maxx@pantherpilot.com';
        const ADMIN_USERNAME = 'traderMaxx';
        const ADMIN_FULLNAME = 'maxx fairo';
        const ADMIN_PASSWORD = 'ShogunMaxx1969!';
        const ADMIN_ROLE = 'super_admin';

        // Check if user exists
        const existing = await sql`SELECT id FROM users WHERE email = ${ADMIN_EMAIL}`;
        
        if (existing.length > 0) {
            // Update to super admin
            await sql`UPDATE users SET role = ${ADMIN_ROLE} WHERE email = ${ADMIN_EMAIL}`;
            
            return res.json({
                success: true,
                message: 'Admin user already exists - role updated to super_admin',
                credentials: {
                    email: ADMIN_EMAIL,
                    username: ADMIN_USERNAME,
                    role: ADMIN_ROLE,
                },
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Create admin user
        const [user] = await sql`
            INSERT INTO users (email, username, full_name, role, is_active, password_hash)
            VALUES (${ADMIN_EMAIL}, ${ADMIN_USERNAME}, ${ADMIN_FULLNAME}, ${ADMIN_ROLE}, true, ${passwordHash})
            RETURNING id, email, username, full_name, role, created_at
        `;

        res.json({
            success: true,
            message: 'Super admin account created successfully!',
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
                password: ADMIN_PASSWORD,
                loginUrl: 'https://anvil-solo-production.up.railway.app/login',
                adminUrl: 'https://anvil-solo-production.up.railway.app/admin',
            },
        });

    } catch (error: any) {
        console.error('Setup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create admin account: ' + error.message,
        });
    }
});

export default router;

