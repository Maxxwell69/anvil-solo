import { Router, Request, Response } from 'express';
import { userDb, sessionDb, auditDb } from '../database/db-enhanced.js';
import {
    hashPassword,
    verifyPassword,
    generateToken,
    generateTokenHash,
    getTokenExpiry,
    validatePassword,
    validateEmail,
    validateUsername,
} from '../utils/auth.js';
import { authenticateUser, AuthRequest } from '../middleware/auth-enhanced.js';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, username, fullName } = req.body;

        // Validate input
        if (!email || !password || !username) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and username are required',
            });
        }

        // Validate email
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format',
            });
        }

        // Validate username
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid username',
                details: usernameValidation.errors,
            });
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid password',
                details: passwordValidation.errors,
            });
        }

        // Check if user already exists
        const existingUser = await userDb.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists',
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await userDb.create(email, passwordHash, username, fullName);

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Create session
        const tokenHash = generateTokenHash(token);
        const expiresAt = getTokenExpiry(24 * 7); // 7 days
        await sessionDb.create(
            user.id,
            tokenHash,
            expiresAt,
            req.ip,
            req.headers['user-agent']
        );

        // Log registration
        await auditDb.log(
            user.id,
            'user_registered',
            'user',
            user.id,
            { email, username },
            req.ip,
            req.headers['user-agent']
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
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
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

        // Find user
        const user = await userDb.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                error: 'Account is inactive',
            });
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Create session
        const tokenHash = generateTokenHash(token);
        const expiresAt = getTokenExpiry(24 * 7); // 7 days
        await sessionDb.create(
            user.id,
            tokenHash,
            expiresAt,
            req.ip,
            req.headers['user-agent']
        );

        // Update last login
        await userDb.updateLastLogin(user.id);

        // Log login
        await auditDb.log(
            user.id,
            'user_login',
            'user',
            user.id,
            { email },
            req.ip,
            req.headers['user-agent']
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
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
        });
    }
});

// Logout
router.post('/logout', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
        const token = req.headers.authorization?.substring(7) || req.cookies?.auth_token;

        if (token) {
            const tokenHash = generateTokenHash(token);
            await sessionDb.invalidate(tokenHash);
        }

        // Log logout
        if (req.user) {
            await auditDb.log(
                req.user.id,
                'user_logout',
                'user',
                req.user.id,
                {},
                req.ip,
                req.headers['user-agent']
            );
        }

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed',
        });
    }
});

// Get current user
router.get('/me', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }

        const user = await userDb.findById(req.user.id);
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
                isActive: user.is_active,
                emailVerified: user.email_verified,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                walletAddress: user.wallet_address,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user',
        });
    }
});

// Update current user
router.patch('/me', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }

        const { fullName, walletAddress } = req.body;
        const updates: any = {};

        if (fullName !== undefined) updates.full_name = fullName;
        if (walletAddress !== undefined) updates.wallet_address = walletAddress;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No updates provided',
            });
        }

        const updatedUser = await userDb.update(req.user.id, updates);

        // Log update
        await auditDb.log(
            req.user.id,
            'user_updated',
            'user',
            req.user.id,
            updates,
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                username: updatedUser.username,
                fullName: updatedUser.full_name,
                walletAddress: updatedUser.wallet_address,
            },
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
        });
    }
});

// Change password
router.post('/change-password', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required',
            });
        }

        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid new password',
                details: passwordValidation.errors,
            });
        }

        // Get user
        const user = await userDb.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Verify current password
        const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect',
            });
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password
        await userDb.update(req.user.id, { password_hash: newPasswordHash });

        // Log password change
        await auditDb.log(
            req.user.id,
            'password_changed',
            'user',
            req.user.id,
            {},
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password',
        });
    }
});

// Refresh token
router.post('/refresh', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }

        // Generate new token
        const token = generateToken({
            userId: req.user.id,
            email: req.user.email,
            role: req.user.role,
        });

        // Invalidate old session
        const oldToken = req.headers.authorization?.substring(7) || req.cookies?.auth_token;
        if (oldToken) {
            const oldTokenHash = generateTokenHash(oldToken);
            await sessionDb.invalidate(oldTokenHash);
        }

        // Create new session
        const tokenHash = generateTokenHash(token);
        const expiresAt = getTokenExpiry(24 * 7); // 7 days
        await sessionDb.create(
            req.user.id,
            tokenHash,
            expiresAt,
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            token,
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh token',
        });
    }
});

export default router;


