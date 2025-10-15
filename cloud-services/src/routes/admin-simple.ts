import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/postgres-init.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = Router();

// Simple admin auth check middleware
function requireAdmin(req: any, res: Response, next: any) {
    // For now, allow if:
    // 1. Has admin key in header, OR
    // 2. Has any authorization header (we'll add proper JWT check later)
    
    const adminKey = req.headers['x-admin-key'];
    const authHeader = req.headers['authorization'];
    
    if (adminKey && adminKey === process.env.ADMIN_KEY) {
        return next();
    }
    
    if (authHeader) {
        // Allow for now - TODO: verify JWT and check role
        return next();
    }
    
    // If no auth at all, still allow (temporary for testing)
    next();
}

// Get statistics
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();

        const [userCount] = await sql`SELECT COUNT(*) as count FROM users WHERE is_active = true`;
        const [licenseCount] = await sql`SELECT COUNT(*) as count FROM licenses WHERE status = 'active'`;
        const [tradeCount] = await sql`SELECT COUNT(*) as count FROM trade_fees`;
        const [revenue] = await sql`SELECT COALESCE(SUM(fee_amount_sol), 0) as total FROM trade_fees`;

        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(userCount.count) || 0,
                totalLicenses: parseInt(licenseCount.count) || 0,
                activeLicenses: parseInt(licenseCount.count) || 0,
                totalDownloads: parseInt(tradeCount.count) || 0,
                recentUsers: 0,
                totalRevenue: parseFloat(revenue.total) || 0,
            },
        });
    } catch (error: any) {
        console.error('Stats error:', error);
        res.json({
            success: true,
            stats: {
                totalUsers: 0,
                totalLicenses: 0,
                activeLicenses: 0,
                totalDownloads: 0,
                recentUsers: 0,
                totalRevenue: 0,
            },
        });
    }
});

// List all users
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();

        const users = await sql`
            SELECT id, email, username, full_name, role, is_active, created_at
            FROM users
            ORDER BY created_at DESC
        `;

        res.json({
            success: true,
            users,
            count: users.length,
        });
    } catch (error: any) {
        console.error('List users error:', error);
        res.json({ success: true, users: [], count: 0 });
    }
});

// List all licenses
router.get('/licenses', requireAdmin, async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();

        const licenses = await sql`
            SELECT 
                l.*,
                u.email as user_email,
                u.username,
                lt.tier_display_name
            FROM licenses l
            LEFT JOIN users u ON l.email = u.email
            LEFT JOIN license_tiers lt ON l.tier = lt.tier_name
            ORDER BY l.created_at DESC
        `;

        res.json({
            success: true,
            licenses,
            count: licenses.length,
        });
    } catch (error: any) {
        console.error('List licenses error:', error);
        res.json({ success: true, licenses: [], count: 0 });
    }
});

// Generate license
router.post('/licenses/generate', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { email, tier, durationDays, notes } = req.body;

        if (!email || !tier) {
            return res.status(400).json({
                success: false,
                error: 'Email and tier are required',
            });
        }

        // Generate license key
        const licenseKey = `ANVIL-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;

        // Calculate expiry
        const expiresAt = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null;

        const sql = getDatabase();

        // Get tier info
        const [tierInfo] = await sql`
            SELECT * FROM license_tiers WHERE tier_name = ${tier}
        `;

        // Create license
        const [license] = await sql`
            INSERT INTO licenses (
                license_key, tier, email, status, 
                max_strategies, max_wallets,
                expires_at
            )
            VALUES (
                ${licenseKey}, ${tier}, ${email}, 'active',
                ${tierInfo?.max_concurrent_strategies || 1},
                ${tierInfo?.max_wallets || 1},
                ${expiresAt}
            )
            RETURNING *
        `;

        res.status(201).json({
            success: true,
            license: {
                id: license.id,
                licenseKey: license.license_key,
                email: license.email,
                tier: license.tier,
                expiresAt: license.expires_at,
            },
        });
    } catch (error: any) {
        console.error('Generate license error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate license: ' + error.message,
        });
    }
});

// Get all license tiers
router.get('/tiers', requireAdmin, async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();

        const tiers = await sql`
            SELECT * FROM license_tiers
            WHERE is_active = true
            ORDER BY price_yearly ASC
        `;

        res.json({
            success: true,
            tiers,
        });
    } catch (error: any) {
        console.error('List tiers error:', error);
        res.json({ success: true, tiers: [] });
    }
});

// Update license tier configuration
router.patch('/tiers/:tierName', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { priceMonthly, priceYearly, tradeFeePercentage, description } = req.body;

        const sql = getDatabase();

        const updates: any = {};
        if (priceMonthly !== undefined) updates.price_monthly = priceMonthly;
        if (priceYearly !== undefined) updates.price_yearly = priceYearly;
        if (tradeFeePercentage !== undefined) updates.trade_fee_percentage = tradeFeePercentage;
        if (description !== undefined) updates.description = description;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No updates provided',
            });
        }

        // Build SET clause dynamically
        const setClauses = Object.keys(updates).map(key => `${key} = $${key}`);
        
        await sql`
            UPDATE license_tiers
            SET ${sql(updates)}, updated_at = CURRENT_TIMESTAMP
            WHERE tier_name = ${req.params.tierName}
        `;

        const [tier] = await sql`SELECT * FROM license_tiers WHERE tier_name = ${req.params.tierName}`;

        res.json({
            success: true,
            tier,
        });
    } catch (error: any) {
        console.error('Update tier error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update tier: ' + error.message,
        });
    }
});

// Get audit logs (simple version)
router.get('/audit-logs', requireAdmin, async (req: Request, res: Response) => {
    try {
        // For now return empty - we can add audit logging later
        res.json({
            success: true,
            logs: [],
            count: 0,
        });
    } catch (error: any) {
        res.json({ success: true, logs: [], count: 0 });
    }
});

// Get all license tiers (for admin panel dropdowns)
router.get('/license-tiers', requireAdmin, async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();

        const tiers = await sql`
            SELECT 
                tier_name, tier_display_name, description,
                price_monthly, price_yearly, trade_fee_percentage,
                features, max_concurrent_strategies, max_wallets,
                can_use_advanced_strategies, can_cloud_sync,
                support_level, is_active
            FROM license_tiers
            ORDER BY price_yearly ASC
        `;

        res.json({
            success: true,
            tiers,
        });
    } catch (error: any) {
        console.error('List tiers error:', error);
        res.json({ success: true, tiers: [] });
    }
});

// Update license tier
router.patch('/license-tiers/:tierName', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { priceMonthly, priceYearly, tradeFeePercentage, description } = req.body;

        const sql = getDatabase();

        const updates: any = {};
        if (priceMonthly !== undefined) updates.price_monthly = priceMonthly;
        if (priceYearly !== undefined) updates.price_yearly = priceYearly;
        if (tradeFeePercentage !== undefined) updates.trade_fee_percentage = tradeFeePercentage;
        if (description !== undefined) updates.description = description;

        if (Object.keys(updates).length > 0) {
            await sql`
                UPDATE license_tiers
                SET ${sql(updates)}, updated_at = CURRENT_TIMESTAMP
                WHERE tier_name = ${req.params.tierName}
            `;
        }

        const [tier] = await sql`SELECT * FROM license_tiers WHERE tier_name = ${req.params.tierName}`;

        res.json({
            success: true,
            tier,
        });
    } catch (error: any) {
        console.error('Update tier error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update tier: ' + error.message,
        });
    }
});

// Create user
router.post('/users', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { email, password, username, fullName, role } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and username required',
            });
        }

        const sql = getDatabase();

        // Check if exists
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
            INSERT INTO users (email, username, full_name, password_hash, role)
            VALUES (${email}, ${username}, ${fullName || null}, ${passwordHash}, ${role || 'user'})
            RETURNING id, email, username, full_name, role, created_at
        `;

        res.status(201).json({
            success: true,
            user: {
                ...user,
                password_hash: undefined,
            },
        });
    } catch (error: any) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user: ' + error.message,
        });
    }
});

// Create fee structure (simple - stores in system settings for now)
router.post('/fees', requireAdmin, async (req: Request, res: Response) => {
    try {
        const {
            name,
            description,
            feeType,
            feeValue,
            appliesTo,
            recipientWallet,
        } = req.body;

        if (!name || !feeType || !feeValue || !appliesTo || !recipientWallet) {
            return res.status(400).json({
                success: false,
                error: 'All fields required',
            });
        }

        // For now, just acknowledge - can be stored in a settings table later
        res.status(201).json({
            success: true,
            fee: {
                id: Date.now(),
                name,
                description,
                feeType,
                feeValue,
                appliesTo,
                recipientWallet,
                isActive: true,
            },
        });
    } catch (error: any) {
        console.error('Create fee error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create fee: ' + error.message,
        });
    }
});

// Get all fee structures
router.get('/fees', requireAdmin, async (req: Request, res: Response) => {
    try {
        // Return empty for now - fee structures are configured in license_tiers
        res.json({
            success: true,
            fees: [],
            count: 0,
            note: 'Fee structures are configured per license tier. See /api/admin/license-tiers',
        });
    } catch (error: any) {
        res.json({ success: true, fees: [], count: 0 });
    }
});

// Get system settings
router.get('/settings', requireAdmin, async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();

        const settings = await sql`
            SELECT * FROM system_settings
            ORDER BY category, setting_key
        `;

        res.json({
            success: true,
            settings,
        });
    } catch (error: any) {
        console.error('Get settings error:', error);
        res.json({ success: true, settings: [] });
    }
});

// Update system setting
router.patch('/settings/:key', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Value is required',
            });
        }

        const sql = getDatabase();

        await sql`
            UPDATE system_settings
            SET setting_value = ${value.toString()}, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = ${req.params.key}
        `;

        const [setting] = await sql`SELECT * FROM system_settings WHERE setting_key = ${req.params.key}`;

        res.json({
            success: true,
            setting,
        });
    } catch (error: any) {
        console.error('Update setting error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update setting: ' + error.message,
        });
    }
});

// Get user details with fee override
router.get('/users/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();

        const [user] = await sql`
            SELECT id, email, username, full_name, role, is_active, 
                   fee_override_percentage, fee_notes, created_at, last_login
            FROM users
            WHERE id = ${parseInt(req.params.id)}
        `;

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Get user's licenses
        const licenses = await sql`
            SELECT * FROM licenses WHERE email = ${user.email}
            ORDER BY created_at DESC
        `;

        res.json({
            success: true,
            user,
            licenses,
        });
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user',
        });
    }
});

// Update user (including fee override)
router.patch('/users/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { role, isActive, feeOverride, feeNotes } = req.body;

        const sql = getDatabase();

        const updates: any = {};
        if (role !== undefined) updates.role = role;
        if (isActive !== undefined) updates.is_active = isActive;
        if (feeOverride !== undefined) updates.fee_override_percentage = feeOverride;
        if (feeNotes !== undefined) updates.fee_notes = feeNotes;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No updates provided',
            });
        }

        await sql`
            UPDATE users
            SET ${sql(updates)}
            WHERE id = ${parseInt(req.params.id)}
        `;

        const [user] = await sql`
            SELECT id, email, username, full_name, role, is_active, 
                   fee_override_percentage, fee_notes
            FROM users WHERE id = ${parseInt(req.params.id)}
        `;

        res.json({
            success: true,
            user,
        });
    } catch (error: any) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user: ' + error.message,
        });
    }
});

export default router;

