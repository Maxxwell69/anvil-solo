import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/postgres-init.js';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Application System - Gate access to your network
 * Users must apply and be approved before they can use the service
 */

// Submit application (user side)
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { email, fullName, reason, experience, referral } = req.body;

    // Validation
    if (!email || !fullName || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Email, full name, and reason are required',
      });
    }

    const sql = getDatabase();

    // Check if already applied
    const existing = await sql`
      SELECT * FROM applications
      WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted an application',
        status: existing[0].status,
      });
    }

    // Create application
    await sql`
      INSERT INTO applications (
        email,
        full_name,
        reason,
        experience,
        referral,
        status,
        submitted_at
      )
      VALUES (
        ${email},
        ${fullName},
        ${reason},
        ${experience || null},
        ${referral || null},
        'pending',
        NOW()
      )
    `;

    res.json({
      success: true,
      message: 'Application submitted successfully. We will review and notify you via email.',
    });

  } catch (error: any) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application',
    });
  }
});

// Check application status
router.get('/status/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const sql = getDatabase();

    const application = await sql`
      SELECT 
        email,
        full_name,
        status,
        submitted_at,
        reviewed_at,
        rejection_reason
      FROM applications
      WHERE email = ${email}
    `;

    if (application.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No application found',
      });
    }

    res.json({
      success: true,
      application: application[0],
    });

  } catch (error: any) {
    console.error('Check status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check status',
    });
  }
});

// Admin: List all applications
router.get('/admin/list', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check if user is admin
    const sql = getDatabase();
    const user = await sql`
      SELECT is_admin FROM users WHERE id = ${req.user.id}
    `;

    if (!user[0] || !user[0].is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    // Get all applications
    const applications = await sql`
      SELECT 
        id,
        email,
        full_name,
        reason,
        experience,
        referral,
        status,
        submitted_at,
        reviewed_at,
        reviewed_by,
        rejection_reason
      FROM applications
      ORDER BY submitted_at DESC
    `;

    res.json({
      success: true,
      applications,
      counts: {
        pending: applications.filter((a: any) => a.status === 'pending').length,
        approved: applications.filter((a: any) => a.status === 'approved').length,
        rejected: applications.filter((a: any) => a.status === 'rejected').length,
      },
    });

  } catch (error: any) {
    console.error('List applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list applications',
    });
  }
});

// Admin: Approve application
router.post('/admin/approve/:applicationId', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { applicationId } = req.params;
    const { sendEmail } = req.body;

    const sql = getDatabase();

    // Check if user is admin
    const user = await sql`
      SELECT is_admin FROM users WHERE id = ${req.user.id}
    `;

    if (!user[0] || !user[0].is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    // Update application
    await sql`
      UPDATE applications
      SET 
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = ${req.user.id}
      WHERE id = ${applicationId}
    `;

    // Get application details
    const application = await sql`
      SELECT * FROM applications WHERE id = ${applicationId}
    `;

    // TODO: Send approval email if sendEmail is true
    if (sendEmail && application[0]) {
      // Email logic here
      console.log(`Send approval email to: ${application[0].email}`);
    }

    res.json({
      success: true,
      message: 'Application approved',
    });

  } catch (error: any) {
    console.error('Approve application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve application',
    });
  }
});

// Admin: Reject application
router.post('/admin/reject/:applicationId', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { applicationId } = req.params;
    const { reason, sendEmail } = req.body;

    const sql = getDatabase();

    // Check if user is admin
    const user = await sql`
      SELECT is_admin FROM users WHERE id = ${req.user.id}
    `;

    if (!user[0] || !user[0].is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    // Update application
    await sql`
      UPDATE applications
      SET 
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = ${req.user.id},
        rejection_reason = ${reason || 'Not approved at this time'}
      WHERE id = ${applicationId}
    `;

    // Get application details
    const application = await sql`
      SELECT * FROM applications WHERE id = ${applicationId}
    `;

    // TODO: Send rejection email if sendEmail is true
    if (sendEmail && application[0]) {
      // Email logic here
      console.log(`Send rejection email to: ${application[0].email}`);
    }

    res.json({
      success: true,
      message: 'Application rejected',
    });

  } catch (error: any) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject application',
    });
  }
});

// Create applications table if it doesn't exist
async function ensureApplicationsTable() {
  const sql = getDatabase();
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        reason TEXT NOT NULL,
        experience TEXT,
        referral TEXT,
        status TEXT DEFAULT 'pending',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)
    `;
    
    console.log('✅ Applications table ready');
  } catch (error) {
    console.error('Applications table error:', error);
  }
}

// Initialize on import
ensureApplicationsTable().catch(console.error);

export default router;

