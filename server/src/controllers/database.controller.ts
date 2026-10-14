import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';
import { Gullak } from '../models/Gullak';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { RecurringBill } from '../models/RecurringBill';
import { ENV } from '../config/env';

function maskUri(uri: string): string {
  if (!uri) return 'in-memory://embedded-mongodb-instance';
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1••••••••$3');
  } catch {
    return 'mongodb://••••••••';
  }
}

// GET /api/database/status
export async function getDatabaseStatus(req: Request, res: Response): Promise<void> {
  const readyState = mongoose.connection.readyState;
  const isConnected = readyState === 1;

  let latencyMs = 0;
  if (isConnected && mongoose.connection.db) {
    try {
      const start = performance.now();
      await mongoose.connection.db.admin().ping();
      latencyMs = Math.round(performance.now() - start);
    } catch {
      latencyMs = -1;
    }
  }

  // Determine database type
  const rawUri = mongoose.connection.host || '';
  let engineType: 'atlas' | 'local' | 'in-memory' = 'in-memory';
  if (rawUri.includes('mongodb.net') || rawUri.includes('atlas')) {
    engineType = 'atlas';
  } else if (rawUri.includes('127.0.0.1') || rawUri.includes('localhost')) {
    engineType = 'local';
  }

  // Collection counts
  const [transactionsCount, gullaksCount, recurringCount, usersCount, subscriptionsCount] = await Promise.all([
    Transaction.countDocuments(),
    Gullak.countDocuments(),
    RecurringBill.countDocuments(),
    User.countDocuments(),
    Subscription.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      status: isConnected ? 'connected' : 'disconnected',
      readyState,
      engineType,
      engineName:
        engineType === 'atlas'
          ? 'MongoDB Atlas (Cloud Cluster)'
          : engineType === 'local'
          ? 'Local MongoDB Daemon'
          : 'High-Performance Embedded In-Memory MongoDB',
      maskedUri: maskUri(ENV.MONGODB_URI || mongoose.connection.host),
      databaseName: mongoose.connection.name || 'pocketpaisa',
      latencyMs,
      stats: {
        transactionsCount,
        gullaksCount,
        recurringCount,
        usersCount,
        subscriptionsCount,
        totalRecords: transactionsCount + gullaksCount + recurringCount + usersCount + subscriptionsCount,
      },
    },
  });
}

// POST /api/database/test - test a candidate MongoDB URI
export async function testDatabaseConnection(req: Request, res: Response): Promise<void> {
  const { uri } = req.body;
  if (!uri || typeof uri !== 'string' || !uri.startsWith('mongodb')) {
    res.status(400).json({
      success: false,
      message: 'Invalid MongoDB connection URI. Must begin with mongodb:// or mongodb+srv://',
    });
    return;
  }

  const testConn = mongoose.createConnection();
  try {
    const start = performance.now();
    await testConn.openUri(uri, { serverSelectionTimeoutMS: 5000 });
    const latencyMs = Math.round(performance.now() - start);
    const dbName = testConn.name;
    await testConn.close();

    res.json({
      success: true,
      message: `Successfully connected to MongoDB cluster (${dbName}). Ping latency: ${latencyMs}ms.`,
      latencyMs,
      databaseName: dbName,
    });
  } catch (err) {
    await testConn.close().catch(() => {});
    res.status(400).json({
      success: false,
      message: `Failed to connect to database: ${(err as Error).message}`,
    });
  }
}

// POST /api/database/connect - switch active connection to user-provided URI
export async function switchDatabaseConnection(req: Request, res: Response): Promise<void> {
  const { uri } = req.body;
  if (!uri || typeof uri !== 'string' || !uri.startsWith('mongodb')) {
    res.status(400).json({
      success: false,
      message: 'Invalid MongoDB connection URI.',
    });
    return;
  }

  try {
    console.log(`📡 Switching active MongoDB connection to: ${maskUri(uri)}`);
    await mongoose.disconnect();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    ENV.MONGODB_URI = uri;

    res.json({
      success: true,
      message: 'Successfully migrated active server database connection.',
      maskedUri: maskUri(uri),
      databaseName: mongoose.connection.name,
    });
  } catch (err) {
    console.error('Failed to switch DB connection:', err);
    res.status(500).json({
      success: false,
      message: `Could not switch database connection: ${(err as Error).message}`,
    });
  }
}

// GET /api/database/export - JSON export
export async function exportDatabaseData(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;

  const [transactions, gullaks, recurring, user] = await Promise.all([
    Transaction.find({ userId }).lean(),
    Gullak.find({ userId }).lean(),
    RecurringBill.find({ userId }).lean(),
    User.findById(userId).select('-passwordHash').lean(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    app: 'PocketPaisa Ledger',
    user,
    transactions,
    gullaks,
    recurring,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="pocketpaisa-backup-${Date.now()}.json"`);
  res.send(JSON.stringify(payload, null, 2));
}

// GET /api/database/export-csv - CSV Ledger export
export async function exportCsvLedger(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const transactions = await Transaction.find({ userId }).sort({ date: -1 }).lean();

  const headers = ['Date', 'Title', 'Amount (INR)', 'Type', 'Category', 'Bucket', 'Notes'];
  const rows = transactions.map(t => {
    const d = new Date(t.date).toISOString().split('T')[0];
    const safeTitle = `"${(t.title || '').replace(/"/g, '""')}"`;
    const safeNotes = `"${(t.notes || '').replace(/"/g, '""')}"`;
    return [d, safeTitle, t.amount, t.type, t.category, t.bucket, safeNotes].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="pocketpaisa-ledger-${Date.now()}.csv"`);
  res.send(csvContent);
}

// POST /api/database/import - Import JSON records
export async function importDatabaseData(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { transactions = [], gullaks = [], recurring = [] } = req.body;

  let txImported = 0;
  let gullakImported = 0;
  let recImported = 0;

  if (Array.isArray(transactions) && transactions.length > 0) {
    const txDocs = transactions.map(t => ({
      userId,
      title: t.title || 'Imported Transaction',
      amount: t.amount || 0,
      type: t.type || 'expense',
      category: t.category || 'General',
      bucket: t.bucket || 'wants',
      date: t.date ? new Date(t.date) : new Date(),
      notes: t.notes || 'Imported from backup',
    }));
    await Transaction.insertMany(txDocs);
    txImported = txDocs.length;
  }

  if (Array.isArray(gullaks) && gullaks.length > 0) {
    const gDocs = gullaks.map(g => ({
      userId,
      name: g.name || 'Imported Vault',
      targetAmount: g.targetAmount || 1000,
      currentAmount: g.currentAmount || 0,
      emoji: g.emoji || '🐷',
      category: g.category || 'Savings Goal',
      targetDate: g.targetDate ? new Date(g.targetDate) : new Date(Date.now() + 90 * 86400000),
      notes: g.notes || '',
    }));
    await Gullak.insertMany(gDocs);
    gullakImported = gDocs.length;
  }

  if (Array.isArray(recurring) && recurring.length > 0) {
    const rDocs = recurring.map(r => ({
      userId,
      name: r.name || 'Imported Subscription',
      amount: r.amount || 0,
      frequency: r.frequency || 'monthly',
      category: r.category || 'Utilities',
      nextBillingDate: r.nextBillingDate ? new Date(r.nextBillingDate) : new Date(Date.now() + 30 * 86400000),
      status: 'active',
      paymentMethod: r.paymentMethod || 'UPI AutoPay',
    }));
    await RecurringBill.insertMany(rDocs);
    recImported = rDocs.length;
  }

  res.json({
    success: true,
    message: `Database import complete: ${txImported} transactions, ${gullakImported} goal vaults, and ${recImported} subscriptions restored.`,
    stats: {
      transactionsImported: txImported,
      gullaksImported: gullakImported,
      recurringImported: recImported,
    },
  });
}
