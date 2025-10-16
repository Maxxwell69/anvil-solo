import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import licenseRouter from './routes/license.js';
import licenseEnhancedRouter from './routes/license-enhanced.js';
import tiersRouter from './routes/tiers.js';
import tradesRouter from './routes/trades.js';
import dataRouter from './routes/data.js';
import archiveRouter from './routes/archive.js';
import feesRouter from './routes/fees.js';
import authRouter from './routes/auth-simple.js';
import adminSetupRouter from './routes/admin-setup.js';
import adminSimpleRouter from './routes/admin-simple.js';
import downloadsSimpleRouter, { ensureDownloadsTable } from './routes/downloads-simple.js';
import syncSimpleRouter from './routes/sync-simple.js';
import applicationRouter, { ensureApplicationsTable } from './routes/application.js';
import { initDatabase } from './database/postgres-init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for Railway/Heroku/etc
app.set('trust proxy', 1);

// Security middleware - Relaxed CSP for admin panel
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.tailwindcss.com', 'https://cdnjs.cloudflare.com'],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow onclick handlers
      fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' })); // Increased for archive data
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize database
await initDatabase();

// Initialize additional tables
await ensureDownloadsTable();
await ensureApplicationsTable();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'anvil-cloud-services',
    version: '2.0.0'
  });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/admin-setup', adminSetupRouter);
app.use('/api/admin', adminSimpleRouter); // Admin management endpoints
app.use('/api/auth', authRouter);
app.use('/api/application', applicationRouter); // User application/approval system
app.use('/api/downloads', downloadsSimpleRouter); // File downloads
app.use('/api/sync', syncSimpleRouter); // Cloud sync
app.use('/api/license', licenseRouter);
app.use('/api/license', licenseEnhancedRouter); // Enhanced validation with features
app.use('/api/tiers', tiersRouter); // License tier management
app.use('/api/trades', tradesRouter); // Trade fee recording
app.use('/api/data', dataRouter);
app.use('/api/archive', archiveRouter);
app.use('/api/fees', feesRouter);

// HTML page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Anvil Cloud Services running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 License API: http://localhost:${PORT}/api/license`);
  console.log(`📊 Strategy API: http://localhost:${PORT}/api/strategy`);
  console.log(`💾 Data API: http://localhost:${PORT}/api/data`);
});

export default app;


