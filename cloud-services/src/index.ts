import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import licenseRouter from './routes/license.js';
import dataRouter from './routes/data.js';
import archiveRouter from './routes/archive.js';
import feesRouter from './routes/fees.js';
import { initDatabase } from './database/postgres-init.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
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

// Initialize database
await initDatabase();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'anvil-cloud-services',
    version: '2.0.0'
  });
});

// Routes
app.use('/api/license', licenseRouter);
app.use('/api/data', dataRouter);
app.use('/api/archive', archiveRouter);
app.use('/api/fees', feesRouter);

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


