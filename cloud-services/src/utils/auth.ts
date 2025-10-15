import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_KEY || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

export interface TokenPayload {
    userId: number;
    email: string;
    role: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

// JWT token generation
export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'anvil-license-server',
    });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
}

export function generateTokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

// License key generation
export function generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
        const segment = crypto.randomBytes(4).toString('hex').toUpperCase();
        segments.push(segment);
    }
    return `ANVIL-${segments.join('-')}`;
}

// Download token generation
export function generateDownloadToken(): string {
    return crypto.randomBytes(32).toString('base64url');
}

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// Email validation
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Username validation
export function validateUsername(username: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (username.length < 3) {
        errors.push('Username must be at least 3 characters long');
    }
    if (username.length > 30) {
        errors.push('Username must be at most 30 characters long');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// Calculate token expiry
export function getTokenExpiry(hours: number = 24): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
    return expiry;
}

// Calculate license expiry
export function getLicenseExpiry(days: number): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
}

// Check if license is expired
export function isLicenseExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return false; // Lifetime license
    return new Date() > new Date(expiresAt);
}

// Generate admin key
export function generateAdminKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

