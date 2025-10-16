import { Router, Response } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth-enhanced.js';
import { cloudSyncDb, licenseDb, auditDb } from '../database/db-enhanced.js';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Sync data types
const ALLOWED_DATA_TYPES = [
    'strategies',
    'settings',
    'trades',
    'favorites',
    'wallets',
    'alerts',
    'preferences',
];

// Upload/sync data
router.post('/upload', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        const { licenseKey, dataType, dataKey, dataValue, deviceId } = req.body;

        if (!licenseKey || !dataType || !dataKey || !dataValue) {
            return res.status(400).json({
                success: false,
                error: 'licenseKey, dataType, dataKey, and dataValue are required',
            });
        }

        // Validate data type
        if (!ALLOWED_DATA_TYPES.includes(dataType)) {
            return res.status(400).json({
                success: false,
                error: `Invalid data type. Allowed types: ${ALLOWED_DATA_TYPES.join(', ')}`,
            });
        }

        // Verify license belongs to user
        const license = await licenseDb.findByKey(licenseKey);
        if (!license || license.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Invalid license or license does not belong to user',
            });
        }

        // Check license status
        if (license.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'License is not active',
            });
        }

        // Upsert sync data
        const syncData = await cloudSyncDb.upsert(
            req.user.id,
            licenseKey,
            dataType,
            dataKey,
            dataValue,
            deviceId
        );

        // Log action
        await auditDb.log(
            req.user.id,
            'sync_upload',
            'cloud_sync',
            syncData.id,
            { dataType, dataKey, deviceId },
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            sync: {
                id: syncData.id,
                dataType: syncData.data_type,
                dataKey: syncData.data_key,
                version: syncData.version,
                syncedAt: syncData.synced_at,
            },
        });
    } catch (error) {
        console.error('Sync upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync data',
        });
    }
});

// Download/retrieve synced data
router.get('/download', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        const { dataType } = req.query;

        // Validate data type if provided
        if (dataType && !ALLOWED_DATA_TYPES.includes(dataType as string)) {
            return res.status(400).json({
                success: false,
                error: `Invalid data type. Allowed types: ${ALLOWED_DATA_TYPES.join(', ')}`,
            });
        }

        // Get sync data
        const syncData = await cloudSyncDb.get(req.user.id, dataType as string);

        // Parse JSON data values
        const parsedData = syncData.map((item: any) => ({
            id: item.id,
            dataType: item.data_type,
            dataKey: item.data_key,
            dataValue: item.data_value,
            version: item.version,
            deviceId: item.device_id,
            syncedAt: item.synced_at,
        }));

        res.json({
            success: true,
            data: parsedData,
            count: parsedData.length,
        });
    } catch (error) {
        console.error('Sync download error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve synced data',
        });
    }
});

// Get specific data item
router.get('/data/:dataType/:dataKey', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        const { dataType, dataKey } = req.params;

        // Validate data type
        if (!ALLOWED_DATA_TYPES.includes(dataType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid data type',
            });
        }

        // Get sync data
        const syncData = await cloudSyncDb.get(req.user.id, dataType);
        const item = syncData.find((d: any) => d.data_key === dataKey);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Data not found',
            });
        }

        res.json({
            success: true,
            data: {
                id: item.id,
                dataType: item.data_type,
                dataKey: item.data_key,
                dataValue: item.data_value,
                version: item.version,
                deviceId: item.device_id,
                syncedAt: item.synced_at,
            },
        });
    } catch (error) {
        console.error('Get sync data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get data',
        });
    }
});

// Delete synced data
router.delete('/data/:dataType/:dataKey', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        const { dataType, dataKey } = req.params;

        // Validate data type
        if (!ALLOWED_DATA_TYPES.includes(dataType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid data type',
            });
        }

        // Delete sync data
        await cloudSyncDb.delete(req.user.id, dataType, dataKey);

        // Log action
        await auditDb.log(
            req.user.id,
            'sync_delete',
            'cloud_sync',
            undefined,
            { dataType, dataKey },
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Data deleted successfully',
        });
    } catch (error) {
        console.error('Delete sync data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete data',
        });
    }
});

// Sync status/info
router.get('/status', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        // Get all sync data for user
        const syncData = await cloudSyncDb.get(req.user.id);

        // Group by data type
        const dataByType: any = {};
        for (const dataType of ALLOWED_DATA_TYPES) {
            const items = syncData.filter((d: any) => d.data_type === dataType);
            dataByType[dataType] = {
                count: items.length,
                lastSynced: items.length > 0 ? items[0].synced_at : null,
            };
        }

        res.json({
            success: true,
            status: {
                totalItems: syncData.length,
                dataByType,
                allowedDataTypes: ALLOWED_DATA_TYPES,
            },
        });
    } catch (error) {
        console.error('Get sync status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get sync status',
        });
    }
});

// Bulk sync upload
router.post('/bulk-upload', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        const { licenseKey, items, deviceId } = req.body;

        if (!licenseKey || !items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                error: 'licenseKey and items array are required',
            });
        }

        // Verify license
        const license = await licenseDb.findByKey(licenseKey);
        if (!license || license.user_id !== req.user.id || license.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Invalid or inactive license',
            });
        }

        // Process items
        const results = [];
        for (const item of items) {
            if (!item.dataType || !item.dataKey || !item.dataValue) {
                results.push({
                    dataKey: item.dataKey,
                    success: false,
                    error: 'Missing required fields',
                });
                continue;
            }

            if (!ALLOWED_DATA_TYPES.includes(item.dataType)) {
                results.push({
                    dataKey: item.dataKey,
                    success: false,
                    error: 'Invalid data type',
                });
                continue;
            }

            try {
                const syncData = await cloudSyncDb.upsert(
                    req.user.id,
                    licenseKey,
                    item.dataType,
                    item.dataKey,
                    item.dataValue,
                    deviceId
                );

                results.push({
                    dataKey: item.dataKey,
                    success: true,
                    version: syncData.version,
                });
            } catch (error) {
                results.push({
                    dataKey: item.dataKey,
                    success: false,
                    error: 'Failed to sync',
                });
            }
        }

        // Log action
        await auditDb.log(
            req.user.id,
            'sync_bulk_upload',
            'cloud_sync',
            undefined,
            { itemCount: items.length, deviceId },
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            results,
            summary: {
                total: results.length,
                successful: results.filter((r: any) => r.success).length,
                failed: results.filter((r: any) => !r.success).length,
            },
        });
    } catch (error) {
        console.error('Bulk sync upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to bulk sync data',
        });
    }
});

export default router;


