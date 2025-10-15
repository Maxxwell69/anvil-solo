import { Request, Response, NextFunction } from 'express';
import { verifyToken, generateTokenHash } from '../utils/auth.js';
import { sessionDb } from '../database/db-enhanced.js';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        username: string;
        role: string;
        is_active: boolean;
    };
    session?: any;
}

// Extract token from Authorization header or cookies
function extractToken(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check cookie
    if (req.cookies && req.cookies.auth_token) {
        return req.cookies.auth_token;
    }

    return null;
}

// Authenticate user with JWT
export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        // Verify JWT
        const payload = verifyToken(token);
        if (!payload) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }

        // Check session in database
        const tokenHash = generateTokenHash(token);
        const session = await sessionDb.findByTokenHash(tokenHash);

        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Session not found or expired',
            });
        }

        if (!session.user_active) {
            return res.status(403).json({
                success: false,
                error: 'User account is inactive',
            });
        }

        // Attach user to request
        req.user = {
            id: session.user_id,
            email: session.email,
            username: session.username,
            role: session.role,
            is_active: session.user_active,
        };

        req.session = session;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
    }
}

// Optional authentication (doesn't fail if not authenticated)
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const token = extractToken(req);

        if (!token) {
            return next();
        }

        const payload = verifyToken(token);
        if (!payload) {
            return next();
        }

        const tokenHash = generateTokenHash(token);
        const session = await sessionDb.findByTokenHash(tokenHash);

        if (session && session.user_active) {
            req.user = {
                id: session.user_id,
                email: session.email,
                username: session.username,
                role: session.role,
                is_active: session.user_active,
            };
            req.session = session;
        }

        next();
    } catch (error) {
        // Silently fail for optional auth
        next();
    }
}

// Require specific role
export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
            });
        }

        next();
    };
}

// Admin only middleware
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required',
        });
    }

    next();
}

// Admin key authentication (for backwards compatibility)
export function authenticateAdminKey(req: Request, res: Response, next: NextFunction) {
    const adminKey = req.headers['x-admin-key'];
    
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({
            success: false,
            error: 'Invalid admin key'
        });
    }
    
    next();
}

// Rate limiting per user
export const userRateLimits = new Map<number, { count: number; resetAt: Date }>();

export function rateLimitPerUser(maxRequests: number, windowMinutes: number) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(); // Skip if not authenticated
        }

        const userId = req.user.id;
        const now = new Date();

        let userLimit = userRateLimits.get(userId);

        if (!userLimit || userLimit.resetAt < now) {
            userLimit = {
                count: 0,
                resetAt: new Date(now.getTime() + windowMinutes * 60 * 1000),
            };
            userRateLimits.set(userId, userLimit);
        }

        userLimit.count++;

        if (userLimit.count > maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil((userLimit.resetAt.getTime() - now.getTime()) / 1000),
            });
        }

        next();
    };
}

