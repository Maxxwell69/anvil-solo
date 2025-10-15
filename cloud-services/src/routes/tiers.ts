import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/postgres-init.js';

const router = Router();

// Get all license tiers (public - for pricing page)
router.get('/list', async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();
        
        const tiers = await sql`
            SELECT 
                id, tier_name, tier_display_name, description,
                price_monthly, price_yearly, is_active, features,
                max_concurrent_strategies, max_wallets, max_daily_trades,
                trade_fee_percentage, support_level
            FROM license_tiers
            WHERE is_active = true
            ORDER BY price_yearly ASC
        `;

        res.json({
            success: true,
            tiers: tiers.map(tier => ({
                ...tier,
                features: tier.features,
            })),
        });
    } catch (error: any) {
        console.error('List tiers error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list tiers',
        });
    }
});

// Get tier details by name
router.get('/:tierName', async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();
        
        const [tier] = await sql`
            SELECT * FROM license_tiers
            WHERE tier_name = ${req.params.tierName}
            AND is_active = true
        `;

        if (!tier) {
            return res.status(404).json({
                success: false,
                error: 'Tier not found',
            });
        }

        res.json({
            success: true,
            tier,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Failed to get tier',
        });
    }
});

// Admin: Update tier configuration
router.patch('/admin/:tierName', async (req: Request, res: Response) => {
    try {
        // Check admin key
        const adminKey = req.headers['x-admin-key'];
        if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({
                success: false,
                error: 'Admin key required',
            });
        }

        const { 
            priceMonthly, 
            priceYearly, 
            tradeFeePercentage,
            maxStrategies,
            maxWallets,
            maxDailyTrades,
            feeWallet,
            features,
            description
        } = req.body;

        const sql = getDatabase();

        const updates: string[] = [];
        const values: any[] = [];

        if (priceMonthly !== undefined) {
            updates.push(`price_monthly = $${updates.length + 1}`);
            values.push(priceMonthly);
        }
        if (priceYearly !== undefined) {
            updates.push(`price_yearly = $${updates.length + 1}`);
            values.push(priceYearly);
        }
        if (tradeFeePercentage !== undefined) {
            updates.push(`trade_fee_percentage = $${updates.length + 1}`);
            values.push(tradeFeePercentage);
        }
        if (maxStrategies !== undefined) {
            updates.push(`max_concurrent_strategies = $${updates.length + 1}`);
            values.push(maxStrategies);
        }
        if (maxWallets !== undefined) {
            updates.push(`max_wallets = $${updates.length + 1}`);
            values.push(maxWallets);
        }
        if (maxDailyTrades !== undefined) {
            updates.push(`max_daily_trades = $${updates.length + 1}`);
            values.push(maxDailyTrades);
        }
        if (feeWallet !== undefined) {
            updates.push(`fee_recipient_wallet = $${updates.length + 1}`);
            values.push(feeWallet);
        }
        if (features !== undefined) {
            updates.push(`features = $${updates.length + 1}::jsonb`);
            values.push(JSON.stringify(features));
        }
        if (description !== undefined) {
            updates.push(`description = $${updates.length + 1}`);
            values.push(description);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No updates provided',
            });
        }

        await sql.unsafe(`
            UPDATE license_tiers 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE tier_name = $${updates.length + 1}
        `, [...values, req.params.tierName]);

        const [updated] = await sql`
            SELECT * FROM license_tiers WHERE tier_name = ${req.params.tierName}
        `;

        res.json({
            success: true,
            tier: updated,
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

