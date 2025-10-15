import { Router, Response } from 'express';
import { authenticateUser, requireAdmin, AuthRequest } from '../middleware/auth-enhanced.js';
import {
    userDb,
    licenseDb,
    feeDb,
    downloadDb,
    auditDb,
    settingsDb,
} from '../database/db-enhanced.js';
import {
    hashPassword,
    generateLicenseKey,
    getLicenseExpiry,
    validatePassword,
    validateEmail,
} from '../utils/auth.js';

const router = Router();

// Apply authentication and admin requirement to all routes
router.use(authenticateUser);
router.use(requireAdmin);

// ============ USER MANAGEMENT ============

// Get all users
router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const { role, is_active } = req.query;

        const filters: any = {};
        if (role) filters.role = role;
        if (is_active !== undefined) filters.is_active = is_active === 'true';

        const users = await userDb.list(filters);

        // Log action
        await auditDb.log(
            req.user!.id,
            'admin_list_users',
            'user',
            undefined,
            { filters },
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            users,
            count: users.length,
        });
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list users',
        });
    }
});

// Get user by ID
router.get('/users/:id', async (req: AuthRequest, res: Response) => {
    try {
        const userId = parseInt(req.params.id);

        const user = await userDb.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Get user's licenses
        const licenses = await licenseDb.findByUserId(userId);

        // Get user's downloads
        const downloads = await downloadDb.listByUser(userId);

        res.json({
            success: true,
            user: {
                ...user,
                password_hash: undefined, // Don't send password hash
            },
            licenses,
            downloads,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user',
        });
    }
});

// Create new user (admin)
router.post('/users', async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, username, fullName, role } = req.body;

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

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid password',
                details: passwordValidation.errors,
            });
        }

        // Check if user exists
        const existingUser = await userDb.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await userDb.create(email, passwordHash, username, fullName);

        // Update role if specified
        if (role && ['user', 'admin', 'super_admin'].includes(role)) {
            await userDb.update(user.id, { role });
        }

        // Log action
        await auditDb.log(
            req.user!.id,
            'admin_create_user',
            'user',
            user.id,
            { email, username, role },
            req.ip,
            req.headers['user-agent']
        );

        res.status(201).json({
            success: true,
            user: {
                ...user,
                password_hash: undefined,
            },
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user',
        });
    }
});

// Update user
router.patch('/users/:id', async (req: AuthRequest, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const { email, username, fullName, role, isActive, walletAddress } = req.body;

        const updates: any = {};
        if (email !== undefined) updates.email = email;
        if (username !== undefined) updates.username = username;
        if (fullName !== undefined) updates.full_name = fullName;
        if (role !== undefined) updates.role = role;
        if (isActive !== undefined) updates.is_active = isActive;
        if (walletAddress !== undefined) updates.wallet_address = walletAddress;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No updates provided',
            });
        }

        const user = await userDb.update(userId, updates);

        // Log action
        await auditDb.log(
            req.user!.id,
            'admin_update_user',
            'user',
            userId,
            updates,
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            user: {
                ...user,
                password_hash: undefined,
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

// ============ LICENSE MANAGEMENT ============

// Get all licenses
router.get('/licenses', async (req: AuthRequest, res: Response) => {
    try {
        const { status, tier, user_id } = req.query;

        const filters: any = {};
        if (status) filters.status = status;
        if (tier) filters.tier = tier;
        if (user_id) filters.user_id = parseInt(user_id as string);

        const licenses = await licenseDb.list(filters);

        // Log action
        await auditDb.log(
            req.user!.id,
            'admin_list_licenses',
            'license',
            undefined,
            { filters },
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            licenses,
            count: licenses.length,
        });
    } catch (error) {
        console.error('List licenses error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list licenses',
        });
    }
});

// Get license by key
router.get('/licenses/:key', async (req: AuthRequest, res: Response) => {
    try {
        const license = await licenseDb.findByKey(req.params.key);

        if (!license) {
            return res.status(404).json({
                success: false,
                error: 'License not found',
            });
        }

        res.json({
            success: true,
            license,
        });
    } catch (error) {
        console.error('Get license error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get license',
        });
    }
});

// Generate new license
router.post('/licenses/generate', async (req: AuthRequest, res: Response) => {
    try {
        const { email, tier, userId, durationDays, maxDevices, notes } = req.body;

        if (!email || !tier) {
            return res.status(400).json({
                success: false,
                error: 'Email and tier are required',
            });
        }

        // Validate email
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format',
            });
        }

        // Generate license key
        const licenseKey = generateLicenseKey();

        // Calculate expiry
        const expiresAt = durationDays ? getLicenseExpiry(durationDays) : null;

        // Get user ID if email is provided
        let finalUserId = userId;
        if (!finalUserId && email) {
            const user = await userDb.findByEmail(email);
            if (user) {
                finalUserId = user.id;
            }
        }

        // Create license
        const license = await licenseDb.create(
            licenseKey,
            finalUserId || null,
            tier,
            email,
            expiresAt
        );

        // Update additional fields if provided
        if (maxDevices || notes) {
            const updates: any = {};
            if (maxDevices) updates.max_devices = maxDevices;
            if (notes) updates.notes = notes;
            updates.created_by = req.user!.id;

            await licenseDb.update(license.id, updates);
        }

        // Log action
        await auditDb.log(
            req.user!.id,
            'admin_generate_license',
            'license',
            license.id,
            { email, tier, licenseKey },
            req.ip,
            req.headers['user-agent']
        );

        res.status(201).json({
            success: true,
            license: {
                id: license.id,
                licenseKey: license.license_key,
                email: license.email,
                tier: license.tier,
                expiresAt: license.expires_at,
                maxDevices: maxDevices || 1,
            },
        });
    } catch (error) {
        console.error('Generate license error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate license',
        });
    }
});

// Update license
router.patch('/licenses/:key', async (req: AuthRequest, res: Response) => {
    try {
        const { status, expiresAt, maxDevices, notes } = req.body;

        const license = await licenseDb.findByKey(req.params.key);
        if (!license) {
            return res.status(404).json({
                success: false,
                error: 'License not found',
            });
        }

        const updates: any = {};
        if (status !== undefined) updates.status = status;
        if (expiresAt !== undefined) updates.expires_at = expiresAt;
        if (maxDevices !== undefined) updates.max_devices = maxDevices;
        if (notes !== undefined) updates.notes = notes;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No updates provided',
            });
        }

        await licenseDb.update(license.id, updates);

        // Log action
        await auditDb.log(
            req.user!.id,
            'admin_update_license',
            'license',
            license.id,
            updates,
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'License updated successfully',
        });
    } catch (error) {
        console.error('Update license error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update license',
        });
    }
});

// Revoke license
router.post('/licenses/:key/revoke', async (req: AuthRequest, res: Response) => {
    try {
        const license = await licenseDb.findByKey(req.params.key);
        if (!license) {
            return res.status(404).json({
                success: false,
                error: 'License not found',
            });
        }

        await licenseDb.update(license.id, {
            status: 'revoked',
            is_active: false,
        });

        // Log action
        await auditDb.log(
            req.user!.id,
            'admin_revoke_license',
            'license',
            license.id,
            { licenseKey: req.params.key },
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'License revoked successfully',
        });
    } catch (error) {
        console.error('Revoke license error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to revoke license',
        });
    }
});

// ============ FEE MANAGEMENT ============

// Get all fee structures
router.get('/fees', async (req: AuthRequest, res: Response) => {
    try {
        const { applies_to } = req.query;

        const fees = await feeDb.list(applies_to as string);

        res.json({
            success: true,
            fees,
            count: fees.length,
        });
    } catch (error) {
        console.error('List fees error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list fee structures',
        });
    }
});

// Create fee structure
router.post('/fees', async (req: AuthRequest, res: Response) => {
    try {
        const {
            name,
            description,
            feeType,
            feeValue,
            appliesTo,
            recipientWallet,
            tierFilter,
            priority,
        } = req.body;

        if (!name || !feeType || !feeValue || !appliesTo || !recipientWallet) {
            return res.status(400).json({
                success: false,
                error: 'Name, feeType, feeValue, appliesTo, and recipientWallet are required',
            });
        }

        const fee = await feeDb.create({
            name,
            description,
            fee_type: feeType,
            fee_value: feeValue,
            applies_to: appliesTo,
            recipient_wallet: recipientWallet,
            tier_filter: tierFilter,
            priority,
            created_by: req.user!.id,
        });

        // Log action
        await auditDb.log(
            req.user!.id,
            'admin_create_fee',
            'fee_structure',
            fee.id,
            { name, feeType, appliesTo },
            req.ip,
            req.headers['user-agent']
        );

        res.status(201).json({
            success: true,
            fee,
        });
    } catch (error) {
        console.error('Create fee error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create fee structure',
        });
    }
});

// Update fee structure
router.patch('/fees/:id', async (req: AuthRequest, res: Response) => {
    try {
        const feeId = parseInt(req.params.id);
        const {
            name,
            description,
            feeType,
            feeValue,
            appliesTo,
            recipientWallet,
            tierFilter,
            priority,
            isActive,
        } = req.body;

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (feeType !== undefined) updates.fee_type = feeType;
        if (feeValue !== undefined) updates.fee_value = feeValue;
        if (appliesTo !== undefined) updates.applies_to = appliesTo;
        if (recipientWallet !== undefined) updates.recipient_wallet = recipientWallet;
        if (tierFilter !== undefined) updates.tier_filter = tierFilter;
        if (priority !== undefined) updates.priority = priority;
        if (isActive !== undefined) updates.is_active = isActive;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No updates provided',
            });
        }

        const fee = await feeDb.update(feeId, updates);

        // Log action
        await auditDb.log(
            req.user!.id,
            'admin_update_fee',
            'fee_structure',
            feeId,
            updates,
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            fee,
        });
    } catch (error) {
        console.error('Update fee error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update fee structure',
        });
    }
});

// ============ SYSTEM SETTINGS ============

// Get all settings
router.get('/settings', async (req: AuthRequest, res: Response) => {
    try {
        const settings = await settingsDb.getAll(false);

        res.json({
            success: true,
            settings,
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get settings',
        });
    }
});

// Update setting
router.put('/settings/:key', async (req: AuthRequest, res: Response) => {
    try {
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Value is required',
            });
        }

        await settingsDb.set(req.params.key, value, req.user!.id);

        // Log action
        await auditDb.log(
            req.user!.id,
            'admin_update_setting',
            'setting',
            undefined,
            { key: req.params.key, value },
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Setting updated successfully',
        });
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update setting',
        });
    }
});

// ============ AUDIT LOG ============

// Get audit logs
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
    try {
        const { user_id, resource_type, limit } = req.query;

        const filters: any = {};
        if (user_id) filters.user_id = parseInt(user_id as string);
        if (resource_type) filters.resource_type = resource_type;

        const logs = await auditDb.getLogs(filters, limit ? parseInt(limit as string) : 100);

        res.json({
            success: true,
            logs,
            count: logs.length,
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get audit logs',
        });
    }
});

// ============ STATISTICS ============

// Get dashboard statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const db = (await import('../database/db-enhanced.js')).getDb();

        // Get counts
        const [userCount] = await db`SELECT COUNT(*) as count FROM users WHERE is_active = true`;
        const [licenseCount] = await db`SELECT COUNT(*) as count FROM licenses WHERE is_active = true`;
        const [activeLicenseCount] = await db`SELECT COUNT(*) as count FROM licenses WHERE status = 'active'`;
        const [downloadCount] = await db`SELECT COUNT(*) as count FROM downloads WHERE status = 'completed'`;

        // Get recent registrations
        const recentUsers = await db`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE created_at > NOW() - INTERVAL '30 days'
        `;

        // Get revenue (from fee transactions)
        const [revenue] = await db`
            SELECT COALESCE(SUM(fee_amount), 0) as total 
            FROM fee_transactions 
            WHERE status = 'completed'
        `;

        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(userCount.count),
                totalLicenses: parseInt(licenseCount.count),
                activeLicenses: parseInt(activeLicenseCount.count),
                totalDownloads: parseInt(downloadCount.count),
                recentUsers: parseInt(recentUsers[0].count),
                totalRevenue: parseFloat(revenue.total),
            },
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics',
        });
    }
});

export default router;

