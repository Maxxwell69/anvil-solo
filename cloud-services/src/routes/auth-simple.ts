import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_KEY || 'default-secret-change-in-production';

// Ensure users table exists
async function ensureUsersTable() {
    const sql = getDatabase();
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
}

// Register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, username, fullName } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and username are required',
            });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format',
            });
        }

        // Validate password
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters',
            });
        }

        // Ensure table exists
        await ensureUsersTable();

        const sql = getDatabase();

        // Check if user exists
        const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const [user] = await sql`
            INSERT INTO users (email, password_hash, username, full_name)
            VALUES (${email}, ${passwordHash}, ${username}, ${fullName || null})
            RETURNING id, email, username, full_name, role, created_at
        `;

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.full_name,
                role: user.role,
            },
            token,
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed: ' + error.message,
        });
    }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
        }

        const sql = getDatabase();

        // Find user
        const users = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.full_name,
                role: user.role,
            },
            token,
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed: ' + error.message,
        });
    }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided',
            });
        }

        const decoded: any = jwt.verify(token, JWT_SECRET);
        const sql = getDatabase();

        const users = await sql`SELECT id, email, username, full_name, role FROM users WHERE id = ${decoded.userId}`;
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        const user = users[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.full_name,
                role: user.role,
            },
        });
    } catch (error: any) {
        res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});

export default router;
