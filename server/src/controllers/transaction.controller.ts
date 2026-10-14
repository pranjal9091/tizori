import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';

export const transactionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  bucket: z.enum(['needs', 'wants', 'savings']).default('wants'),
  date: z.string().optional(),
  notes: z.string().optional().default(''),
});

export async function getTransactions(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { category, bucket, search, limit = '50' } = req.query as Record<string, string>;

  const query: any = { userId };
  if (category) query.category = category;
  if (bucket) query.bucket = bucket;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }

  const transactions = await Transaction.find(query)
    .sort({ date: -1, createdAt: -1 })
    .limit(parseInt(limit, 10) || 50);

  res.json({ success: true, data: transactions });
}

export async function createTransaction(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { title, amount, category, bucket, date, notes } = req.body;

  const transaction = await Transaction.create({
    userId,
    title,
    amount,
    category,
    bucket: bucket || 'wants',
    date: date ? new Date(date) : new Date(),
    notes: notes || '',
    type: 'expense',
  });

  res.status(201).json({ success: true, data: transaction });
}

export async function deleteTransaction(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;

  const deleted = await Transaction.findOneAndDelete({ _id: id, userId });
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Transaction not found' });
    return;
  }

  res.json({ success: true, message: 'Transaction deleted' });
}
