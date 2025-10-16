import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/postgres-init.js';

const router = Router();

// Enhanced license validation - returns tier features and limits
router.post('/validate-enhanced', async (req: Request, res: Response) => {
    try {
        const { licenseKey, hardwareId, email } = req.body;

        if (!licenseKey) {
            return res.status(400).json({
                success: false,
                error: 'License key is required',
            });
        }

        const sql = getDatabase();

        // Get license with tier information
        const [license] = await sql`
            SELECT 
                l.*,
                lt.tier_display_name,
                lt.price_monthly,
                lt.price_yearly,
                lt.features,
                lt.max_concurrent_strategies,
                lt.max_wallets,
                lt.max_daily_trades,
                lt.trade_fee_percentage,
                lt.fee_recipient_wallet,
                lt.can_use_advanced_strategies,
                lt.can_cloud_sync,
                lt.support_level
            FROM licenses l
            LEFT JOIN license_tiers lt ON l.tier = lt.tier_name
            WHERE l.license_key = ${licenseKey}
        `;

        if (!license) {
            return res.status(404).json({
                success: false,
                valid: false,
                error: 'Invalid license key',
            });
        }

        // Check status
        if (license.status !== 'active') {
            return res.status(403).json({
                success: false,
                valid: false,
                error: `License is ${license.status}`,
            });
        }

        // Check expiration
        const isExpired = license.expires_at && new Date(license.expires_at) < new Date();
        if (isExpired) {
            return res.status(403).json({
                success: false,
                valid: false,
                error: 'License has expired',
                expiresAt: license.expires_at,
            });
        }

        // Update last validated
        await sql`
            UPDATE licenses 
            SET last_validated = CURRENT_TIMESTAMP
            WHERE license_key = ${licenseKey}
        `;

        // Return comprehensive license information
        res.json({
            success: true,
            valid: true,
            license: {
                key: license.license_key,
                tier: license.tier,
                tierDisplayName: license.tier_display_name,
                status: license.status,
                isActive: license.status === 'active',
                expiresAt: license.expires_at,
                
                // What user can do
                limits: {
                    maxConcurrentStrategies: license.max_concurrent_strategies || license.max_strategies || 1,
                    maxWallets: license.max_wallets || 1,
                    maxDailyTrades: license.max_daily_trades || 10,
                },
                
                // Available features
                features: license.features || {},
                
                // Permissions
                permissions: {
                    canUseAdvancedStrategies: license.can_use_advanced_strategies || false,
                    canCloudSync: license.can_cloud_sync || false,
                    canUseAPI: license.features?.api_access || false,
                    canUseCustomStrategies: license.features?.custom_strategies || false,
                    autoTradingEnabled: license.features?.auto_trading !== false,
                },
                
                // Fee information
                fees: {
                    tradeFeePercentage: license.trade_fee_percentage || 5.0,
                    feeRecipientWallet: license.fee_recipient_wallet || process.env.FEE_WALLET_ADDRESS,
                },
                
                // Support
                support: {
                    level: license.support_level || 'community',
                    priority: license.support_level === 'priority' || license.support_level === '24/7',
                },
            },
        });

    } catch (error: any) {
        console.error('Validate enhanced error:', error);
        res.status(500).json({
            success: false,
            error: 'Validation failed: ' + error.message,
        });
    }
});

export default router;


