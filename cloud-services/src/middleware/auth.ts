import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/init.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      licenseKey?: string;
      hardwareId?: string;
    }
  }
}

/**
 * Middleware to verify license before accessing protected routes
 */
export function verifyLicense(req: Request, res: Response, next: NextFunction) {
  try {
    const licenseKey = req.headers['x-license-key'] as string;
    const hardwareId = req.headers['x-hardware-id'] as string;
    
    if (!licenseKey || !hardwareId) {
      return res.status(401).json({ 
        error: 'Missing license key or hardware ID',
        required: ['x-license-key', 'x-hardware-id']
      });
    }
    
    const db = getDatabase();
    const license = db.prepare('SELECT * FROM licenses WHERE license_key = ?').get(licenseKey);
    
    if (!license) {
      return res.status(403).json({ error: 'Invalid license key' });
    }
    
    // Check hardware ID match
    if (license.hardware_id && license.hardware_id !== hardwareId) {
      return res.status(403).json({ error: 'Hardware ID mismatch' });
    }
    
    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.status(403).json({ error: 'License expired' });
    }
    
    // Check status
    if (license.status !== 'active') {
      return res.status(403).json({ error: 'License not active' });
    }
    
    // Attach license info to request
    req.licenseKey = licenseKey;
    req.hardwareId = hardwareId;
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin authentication middleware
 */
export function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  const adminKey = req.headers['x-admin-key'] as string;
  
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  next();
}

