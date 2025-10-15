import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/postgres-init.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = Router();

// Simple admin auth check middleware
function requireAdmin(req: any, res: Response, next: any) {
    // For now, check admin key OR JWT token with admin role
    const adminKey = req.headers['x-admin-key'];
    
    if (adminKey && adminKey === process.env.ADMIN_KEY) {
        return next();
    }
    
    // TODO: Add JWT token check when auth is working
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

export default router;

