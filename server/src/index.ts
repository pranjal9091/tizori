import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { runSeed } from './scripts/seed';
import { User } from './models/User';

// Import route modules
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import gullakRoutes from './routes/gullak.routes';
import affordabilityRoutes from './routes/affordability.routes';
import dashboardRoutes from './routes/dashboard.routes';
import paymentRoutes from './routes/payment.routes';
import databaseRoutes from './routes/database.routes';
import recurringRoutes from './routes/recurring.routes';

const app = express();

// Enable CORS for localhost, Vercel, and Render deployments
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow server-to-server, curl, mobile, or same-origin requests
      if (!origin) return callback(null, true);
      const allowed = [
        ENV.CLIENT_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
      ];
      if (
        allowed.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PocketPaisa (गुल्लक) API Server',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/gullaks', gullakRoutes);
app.use('/api/affordability', affordabilityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/recurring', recurringRoutes);

// In production or when client/dist exists, serve compiled React SPA
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`📦 Serving compiled client frontend from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Central Error Handler
app.use(errorHandler);

// Start Server & Auto-Bootstrap Seed
async function startServer() {
  try {
    await connectDB();

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ Empty database detected. Auto-seeding rich PocketPaisa demo state...');
      await runSeed();
    }

    app.listen(ENV.PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🐷 PocketPaisa API Server running at http://localhost:${ENV.PORT}`);
      console.log(`📡 Health Check: http://localhost:${ENV.PORT}/api/health`);
      console.log(`🔑 Demo User: demo@pocketpaisa.app | Password: Password123!`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Fatal Server Boot Error:', err);
    process.exit(1);
  }
}

startServer();
