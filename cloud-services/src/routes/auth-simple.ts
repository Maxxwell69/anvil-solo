import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_KEY || 'default-secret-change-in-production';

// Simple user table creation
async function ensureUsersTable() {
    const db = getDatabase();
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            full_name TEXT,
            role TEXT DEFAULT 'user',
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
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

        const db = getDatabase();

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = db.prepare(`
            INSERT INTO users (email, password_hash, username, full_name)
            VALUES (?, ?, ?, ?)
        `).run(email, passwordHash, username, fullName || null);

        // Generate token
        const token = jwt.sign(
            { userId: result.lastInsertRowid, email, role: 'user' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            user: {
                id: result.lastInsertRowid,
                email,
                username,
                role: 'user',
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

        const db = getDatabase();

        // Find user
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

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
        const db = getDatabase();

        const user: any = db.prepare('SELECT id, email, username, full_name, role FROM users WHERE id = ?').get(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

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

