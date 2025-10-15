import { getDatabase } from '../database/postgres-init.js';

/**
 * Calculate trade fee for a user/license
 * Priority: User Override > Tier Override > System Default
 */
export async function calculateTradeFee(licenseKey: string, userEmail?: string): Promise<{
    feePercentage: number;
    source: 'user_override' | 'tier_override' | 'system_default';
    feeWallet: string;
}> {
    const sql = getDatabase();

    // Get system default
    const [defaultSetting] = await sql`
        SELECT setting_value 
        FROM system_settings 
        WHERE setting_key = 'default_trade_fee_percentage'
    `;
    const systemDefaultFee = parseFloat(defaultSetting?.setting_value || '0.5');

    // Get fee wallet
    const [walletSetting] = await sql`
        SELECT setting_value 
        FROM system_settings 
        WHERE setting_key = 'fee_wallet_address'
    `;
    const feeWallet = walletSetting?.setting_value || process.env.FEE_WALLET_ADDRESS || '';

    // Get license info with user and tier
    const [license] = await sql`
        SELECT 
            l.*,
            lt.trade_fee_percentage as tier_fee_override,
            u.fee_override_percentage as user_fee_override
        FROM licenses l
        LEFT JOIN license_tiers lt ON l.tier = lt.tier_name
        LEFT JOIN users u ON l.email = u.email
        WHERE l.license_key = ${licenseKey}
    `;

    if (!license) {
        // Fallback to system default
        return {
            feePercentage: systemDefaultFee,
            source: 'system_default',
            feeWallet,
        };
    }

    // Priority 1: User Override
    if (license.user_fee_override !== null && license.user_fee_override !== undefined) {
        return {
            feePercentage: parseFloat(license.user_fee_override),
            source: 'user_override',
            feeWallet,
        };
    }

    // Priority 2: Tier Override
    if (license.tier_fee_override !== null && license.tier_fee_override !== undefined) {
        return {
            feePercentage: parseFloat(license.tier_fee_override),
            source: 'tier_override',
            feeWallet,
        };
    }

    // Priority 3: System Default
    return {
        feePercentage: systemDefaultFee,
        source: 'system_default',
        feeWallet,
    };
}

/**
 * Get system default fee percentage
 */
export async function getSystemDefaultFee(): Promise<number> {
    const sql = getDatabase();
    
    const [setting] = await sql`
        SELECT setting_value 
        FROM system_settings 
        WHERE setting_key = 'default_trade_fee_percentage'
    `;

    return parseFloat(setting?.setting_value || '0.5');
}

/**
 * Update system default fee
 */
export async function updateSystemDefaultFee(newPercentage: number): Promise<void> {
    const sql = getDatabase();

    await sql`
        UPDATE system_settings
        SET setting_value = ${newPercentage.toString()}, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'default_trade_fee_percentage'
    `;
}

/**
 * Set tier-level fee override (NULL = use system default)
 */
export async function setTierFeeOverride(tierName: string, percentage: number | null): Promise<void> {
    const sql = getDatabase();

    await sql`
        UPDATE license_tiers
        SET trade_fee_percentage = ${percentage}, updated_at = CURRENT_TIMESTAMP
        WHERE tier_name = ${tierName}
    `;
}

/**
 * Set user-level fee override (NULL = use tier/system default)
 */
export async function setUserFeeOverride(userId: number, percentage: number | null, notes?: string): Promise<void> {
    const sql = getDatabase();

    await sql`
        UPDATE users
        SET fee_override_percentage = ${percentage},
            fee_notes = ${notes || null}
        WHERE id = ${userId}
    `;
}

