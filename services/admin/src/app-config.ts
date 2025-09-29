function getConfig() {
    const config = require('./config.json');

    return {
        mongodb: {
            url: process.env.MONGODB_URL || config.mongodb_url
        },
        server: {
            port: parseInt(process.env.PORT || config.port || '5001', 10)
        },
        admin: {
            superAdminId: parseInt(process.env.SUPER_ADMIN_ID || config.SUPER_ADMIN_ID || '6453387873', 10),
            superAdminEmail: process.env.SUPER_ADMIN_EMAIL || config.SUPER_ADMIN_EMAIL,
            superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || config.SUPER_ADMIN_PASSWORD,
            superAdminName: process.env.SUPER_ADMIN_NAME || config.SUPER_ADMIN_NAME
        },
        jwtSecret: process.env.JWT_SECRET || config.JWT_SECRET
        ,
        swap: {
            swapFee: parseFloat(process.env.SWAP_FEE_PERCENTAGE || config.swap_fee_percentage || '0.005'),
            referralFee: parseFloat(process.env.SWAP_REFERRAL_FEE_PERCENTAGE || config.swap_referral_fee_percentage || '0.2')
        }
    };
}

module.exports = getConfig();