import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/postgres-init.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Available download files configuration
const AVAILABLE_FILES = [
    {
        id: 'windows-setup',
        name: 'anvil-solo-setup.zip',
        displayName: 'Anvil Solo - Windows Portable',
        version: '3.0.0',
        size: 126548069,
        description: 'Portable version for Windows 10/11 - Extract and run!',
        platform: 'windows',
        requiresLicense: false, // Free tier can download
        minTier: 'free',
        filepath: 'anvil-solo-setup.zip',
    },
    {
        id: 'windows-portable',
        name: 'anvil-solo-portable.zip',
        displayName: 'Anvil Solo - Windows Portable',
        version: '3.0.0',
        size: 145000000,
        description: 'Portable version - no installation needed',
        platform: 'windows',
        requiresLicense: false,
        minTier: 'free',
        filepath: 'anvil-solo-portable.zip',
    },
    {
        id: 'mac-dmg',
        name: 'anvil-solo-mac.dmg',
        displayName: 'Anvil Solo - macOS',
        version: '3.0.0',
        size: 155000000,
        description: 'DMG installer for macOS',
        platform: 'mac',
        requiresLicense: false,
        minTier: 'free',
        filepath: 'anvil-solo-mac.dmg',
    },
];

// Get list of available files
router.get('/list', async (req: Request, res: Response) => {
    try {
        const downloadsDir = path.join(__dirname, '../../public/downloads');
        
        // Filter to only files that actually exist on disk
        const availableFiles = AVAILABLE_FILES.filter(file => {
            const filePath = path.join(downloadsDir, file.filepath);
            return fs.existsSync(filePath);
        });

        // Map to response format
        const files = availableFiles.map(file => {
            const filePath = path.join(downloadsDir, file.filepath);
            const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
            
            return {
                id: file.id,
                name: file.name,
                displayName: file.displayName,
                version: file.version,
                size: stats ? stats.size : file.size,
                description: file.description,
                platform: file.platform,
                requiresLicense: file.requiresLicense,
                minTier: file.minTier,
                downloadUrl: `/api/downloads/${file.id}`,
            };
        });

        res.json({
            success: true,
            files,
            message: files.length === 0 ? 'No files available yet. Build and upload Anvil Solo installer.' : undefined,
        });
    } catch (error: any) {
        console.error('List files error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list files',
        });
    }
});

// Download file directly
router.get('/:fileId', async (req: Request, res: Response) => {
    try {
        const fileId = req.params.fileId;
        
        // Find file config
        const fileConfig = AVAILABLE_FILES.find(f => f.id === fileId);
        if (!fileConfig) {
            return res.status(404).json({
                success: false,
                error: 'File not found',
            });
        }

        // Check if file exists on disk
        const downloadsDir = path.join(__dirname, '../../public/downloads');
        const filePath = path.join(downloadsDir, fileConfig.filepath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            // File not uploaded yet - return instructions
            return res.status(404).json({
                success: false,
                error: 'File not available yet',
                message: 'Please upload the installer files to public/downloads/ folder',
                expectedPath: filePath,
                instructions: `
                    To enable downloads:
                    1. Build Anvil Solo: npm run build in anvil-solo folder
                    2. Package: npm run package
                    3. Copy installer to: ${filePath}
                    4. Restart server
                `,
            });
        }

        // Get file stats
        const stats = fs.statSync(filePath);

        // Track download (optional - if user is logged in)
        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                // Track in database
                const sql = getDatabase();
                await sql`
                    INSERT INTO downloads (
                        file_name, file_version, file_size,
                        ip_address, user_agent, status
                    )
                    VALUES (
                        ${fileConfig.name}, ${fileConfig.version}, ${stats.size},
                        ${req.ip}, ${req.headers['user-agent'] || null}, 'completed'
                    )
                `;
            } catch (err) {
                console.error('Failed to track download:', err);
                // Continue with download even if tracking fails
            }
        }

        // Set headers for download
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileConfig.name}"`);
        res.setHeader('Content-Length', stats.size);

        // Stream file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to download file',
                });
            }
        });

    } catch (error: any) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Failed to download file: ' + error.message,
            });
        }
    }
});

// Add downloads table if not exists
export async function ensureDownloadsTable() {
    try {
        const sql = getDatabase();
        await sql`
            CREATE TABLE IF NOT EXISTS downloads (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                license_key TEXT,
                file_name TEXT NOT NULL,
                file_version TEXT,
                file_size BIGINT,
                ip_address TEXT,
                user_agent TEXT,
                status TEXT DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Downloads table ready');
    } catch (err) {
        console.error('Downloads table error:', err);
    }
}

// Get download history for user
router.get('/history', async (req: Request, res: Response) => {
    try {
        const sql = getDatabase();
        
        // Return recent downloads
        const downloads = await sql`
            SELECT * FROM downloads
            ORDER BY created_at DESC
            LIMIT 50
        `;

        res.json({
            success: true,
            downloads,
        });
    } catch (error: any) {
        console.error('Download history error:', error);
        res.json({
            success: true,
            downloads: [],
        });
    }
});

export default router;

