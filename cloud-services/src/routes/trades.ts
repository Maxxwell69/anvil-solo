import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/postgres-init.js';

const router = Router();

// Record trade and calculate fee
router.post('/record-trade', async (req: Request, res: Response) => {
    try {
        const {
            licenseKey,
            tradeSignature,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
        } = req.body;

        if (!licenseKey || !tradeSignature || !tokenIn || !tokenOut || !amountIn || !amountOut) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
        }

        const sql = getDatabase();

        // Validate license and get tier info
        const [license] = await sql`
            SELECT l.*, lt.trade_fee_percentage, lt.fee_recipient_wallet, lt.tier_name
            FROM licenses l
            LEFT JOIN license_tiers lt ON l.tier = lt.tier_name
            WHERE l.license_key = ${licenseKey}
            AND l.status = 'active'
        `;

        if (!license) {
            return res.status(404).json({
                success: false,
                error: 'License not found or inactive',
            });
        }

        // Check if license is expired
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            return res.status(403).json({
                success: false,
                error: 'License expired',
            });
        }

        // Calculate fee
        const feePercentage = license.trade_fee_percentage || 5.0; // Default 5%
        const feeAmountSol = (parseFloat(amountOut) * feePercentage) / 100;
        const feeRecipient = license.fee_recipient_wallet || process.env.FEE_WALLET_ADDRESS;

        // Record trade fee
        const [tradeFee] = await sql`
            INSERT INTO trade_fees (
                license_key, trade_signature, token_in, token_out,
                amount_in, amount_out, fee_percentage, fee_amount_sol,
                fee_recipient_wallet, tier, status
            )
            VALUES (
                ${licenseKey}, ${tradeSignature}, ${tokenIn}, ${tokenOut},
                ${amountIn}, ${amountOut}, ${feePercentage}, ${feeAmountSol},
                ${feeRecipient}, ${license.tier_name || license.tier}, 'pending'
            )
            ON CONFLICT (trade_signature) DO UPDATE
            SET status = 'pending'
            RETURNING *
        `;

        // Update license last validated
        await sql`
            UPDATE licenses 
            SET last_validated = CURRENT_TIMESTAMP
            WHERE license_key = ${licenseKey}
        `;

        res.json({
            success: true,
            tradeFee: {
                id: tradeFee.id,
                feePercentage: feePercentage,
                feeAmountSol: feeAmountSol,
                feeRecipientWallet: feeRecipient,
                status: tradeFee.status,
            },
        });

    } catch (error: any) {
        console.error('Record trade error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record trade: ' + error.message,
        });
    }
});

// Get trade fee summary for license
router.get('/fees/:licenseKey', async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();

        const fees = await sql`
            SELECT 
                COUNT(*) as total_trades,
                SUM(fee_amount_sol) as total_fees,
                AVG(fee_percentage) as avg_fee_percentage,
                tier
            FROM trade_fees
            WHERE license_key = ${req.params.licenseKey}
            GROUP BY tier
        `;

        const recentFees = await sql`
            SELECT *
            FROM trade_fees
            WHERE license_key = ${req.params.licenseKey}
            ORDER BY created_at DESC
            LIMIT 50
        `;

        res.json({
            success: true,
            summary: fees[0] || { total_trades: 0, total_fees: 0 },
            recent: recentFees,
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Failed to get fees',
        });
    }
});

// Admin: Get all trade fees
router.get('/admin/all-fees', async (req: Request, res: Response) => {
    try {
        // Check admin key
        const adminKey = req.headers['x-admin-key'];
        if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({
                success: false,
                error: 'Admin key required',
            });
        }

        const sql = getDatabase();
        const limit = parseInt(req.query.limit as string) || 100;

        const fees = await sql`
            SELECT 
                tf.*,
                l.email as license_email,
                lt.tier_display_name
            FROM trade_fees tf
            LEFT JOIN licenses l ON tf.license_key = l.license_key
            LEFT JOIN license_tiers lt ON tf.tier = lt.tier_name
            ORDER BY tf.created_at DESC
            LIMIT ${limit}
        `;

        // Summary stats
        const [summary] = await sql`
            SELECT 
                COUNT(*) as total_trades,
                SUM(fee_amount_sol) as total_fees_sol,
                COUNT(DISTINCT license_key) as unique_licenses
            FROM trade_fees
        `;

        res.json({
            success: true,
            fees,
            summary,
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Failed to get trade fees',
        });
    }
});

export default router;

