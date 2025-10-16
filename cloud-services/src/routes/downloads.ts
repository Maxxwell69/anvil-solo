import { Router, Response } from 'express';
import { authenticateUser, AuthRequest, optionalAuth } from '../middleware/auth-enhanced.js';
import { downloadDb, licenseDb, feeDb, auditDb } from '../database/db-enhanced.js';
import { generateDownloadToken, getTokenExpiry } from '../utils/auth.js';

const router = Router();

// File definitions
const AVAILABLE_FILES = [
    {
        name: 'anvil-solo-setup.exe',
        version: '3.0.0',
        size: 150000000, // 150 MB
        description: 'Anvil Solo Trading Bot - Windows Setup',
        requiresLicense: true,
    },
    {
        name: 'anvil-solo-portable.zip',
        version: '3.0.0',
        size: 145000000,
        description: 'Anvil Solo Trading Bot - Portable Version',
        requiresLicense: true,
    },
    {
        name: 'anvil-solo-mac.dmg',
        version: '3.0.0',
        size: 155000000,
        description: 'Anvil Solo Trading Bot - macOS',
        requiresLicense: true,
    },
];

// Get available files
router.get('/files', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
        // Return available files
        const files = AVAILABLE_FILES.map(file => ({
            ...file,
            downloadUrl: req.user ? `/api/downloads/request/${file.name}` : null,
        }));

        res.json({
            success: true,
            files,
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get files',
        });
    }
});

// Request download (generates time-limited download token)
router.post('/request/:fileName', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        const fileName = req.params.fileName;

        // Find file
        const file = AVAILABLE_FILES.find(f => f.name === fileName);
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found',
            });
        }

        // Check if user has valid license
        const licenses = await licenseDb.findByUserId(req.user.id);
        const activeLicense = licenses.find(
            l => l.status === 'active' && (l.expires_at === null || new Date(l.expires_at) > new Date())
        );

        if (!activeLicense && file.requiresLicense) {
            return res.status(403).json({
                success: false,
                error: 'Valid license required to download this file',
            });
        }

        // Calculate fees
        const feeStructures = await feeDb.list('download');
        let totalFee = 0;
        let applicableFees = [];

        for (const feeStructure of feeStructures) {
            if (feeStructure.tier_filter && activeLicense && feeStructure.tier_filter !== activeLicense.tier) {
                continue; // Skip if tier doesn't match
            }

            let feeAmount = 0;
            if (feeStructure.fee_type === 'percentage') {
                feeAmount = (file.size / 1000000) * (feeStructure.fee_value / 100); // Simple calculation
            } else if (feeStructure.fee_type === 'fixed') {
                feeAmount = parseFloat(feeStructure.fee_value);
            }

            totalFee += feeAmount;
            applicableFees.push({
                name: feeStructure.name,
                amount: feeAmount,
                type: feeStructure.fee_type,
            });
        }

        // Generate download token
        const downloadToken = generateDownloadToken();
        const tokenExpiresAt = getTokenExpiry(24); // 24 hours

        // Create download record
        const download = await downloadDb.create({
            user_id: req.user.id,
            license_id: activeLicense?.id || null,
            file_name: fileName,
            file_version: file.version,
            download_token: downloadToken,
            token_expires_at: tokenExpiresAt,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            fee_applied: totalFee,
        });

        // Record fee transaction if applicable
        if (totalFee > 0 && feeStructures.length > 0) {
            await feeDb.recordTransaction({
                user_id: req.user.id,
                license_id: activeLicense?.id || null,
                fee_structure_id: feeStructures[0].id,
                transaction_type: 'download',
                base_amount: null,
                fee_amount: totalFee,
                total_amount: totalFee,
                recipient_wallet: feeStructures[0].recipient_wallet,
                metadata: {
                    fileName,
                    fileVersion: file.version,
                    fees: applicableFees,
                },
            });
        }

        // Log action
        await auditDb.log(
            req.user.id,
            'download_requested',
            'download',
            download.id,
            { fileName, totalFee },
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            downloadToken,
            downloadUrl: `/api/downloads/file/${downloadToken}`,
            expiresAt: tokenExpiresAt,
            file: {
                name: file.name,
                version: file.version,
                size: file.size,
            },
            fees: {
                total: totalFee,
                breakdown: applicableFees,
            },
        });
    } catch (error) {
        console.error('Request download error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to request download',
        });
    }
});

// Download file with token
router.get('/file/:token', async (req: Request, res: Response) => {
    try {
        const token = req.params.token;

        // Find download by token
        const download = await downloadDb.findByToken(token);

        if (!download) {
            return res.status(404).json({
                success: false,
                error: 'Invalid or expired download token',
            });
        }

        // Find file
        const file = AVAILABLE_FILES.find(f => f.name === download.file_name);
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found',
            });
        }

        // Update download status
        await downloadDb.updateStatus(download.id, 'completed');

        // Log action
        if (download.user_id) {
            await auditDb.log(
                download.user_id,
                'download_completed',
                'download',
                download.id,
                { fileName: file.name },
                req.ip,
                req.headers['user-agent']
            );
        }

        // In production, this would serve the actual file
        // For now, return download information
        res.json({
            success: true,
            message: 'Download started',
            file: {
                name: file.name,
                version: file.version,
                size: file.size,
                description: file.description,
            },
            note: 'In production, this endpoint would stream the actual file',
        });

        // TODO: Implement actual file streaming
        // res.download(filePath, file.name);
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download file',
        });
    }
});

// Get user's download history
router.get('/history', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        const downloads = await downloadDb.listByUser(req.user.id);

        res.json({
            success: true,
            downloads,
            count: downloads.length,
        });
    } catch (error) {
        console.error('Get download history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get download history',
        });
    }
});

export default router;


