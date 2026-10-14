import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { Budget } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import mongoose from 'mongoose';

export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  monthlyLimit: z.number().positive('Monthly limit must be positive'),
  periodMonth: z.number().min(1).max(12),
  periodYear: z.number().min(2020),
  alertThreshold: z.number().min(10).max(100).default(80),
});

export async function getBudgets(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const now = new Date();
  const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
  const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

  // Find all budget definitions for this month
  const budgets = await Budget.find({ userId, periodMonth: month, periodYear: year });

  // Calculate actual spending per category in this month using MongoDB Aggregation Pipeline
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const spendingStats = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId.toString()),
        type: 'expense',
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: '$category',
        actualSpent: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  const spentMap = new Map<string, number>();
  spendingStats.forEach(s => spentMap.set(s._id, s.actualSpent));

  const enrichedBudgets = budgets.map(b => {
    const actualSpent = spentMap.get(b.category) || 0;
    const remaining = Math.max(0, b.monthlyLimit - actualSpent);
    const percentUsed = Math.round((actualSpent / b.monthlyLimit) * 100);
    const isExceeded = actualSpent > b.monthlyLimit;
    const isWarning = percentUsed >= b.alertThreshold && !isExceeded;

    return {
      _id: b._id,
      category: b.category,
      monthlyLimit: b.monthlyLimit,
      periodMonth: b.periodMonth,
      periodYear: b.periodYear,
      alertThreshold: b.alertThreshold,
      actualSpent,
      remaining,
      percentUsed,
      isExceeded,
      isWarning,
    };
  });

  const totalBudgeted = enrichedBudgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpentInBudgets = enrichedBudgets.reduce((acc, b) => acc + b.actualSpent, 0);

  res.json({
    success: true,
    data: {
      budgets: enrichedBudgets,
      summary: {
        totalBudgeted,
        totalSpentInBudgets,
        month,
        year,
      },
    },
  });
}

export async function upsertBudget(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { category, monthlyLimit, periodMonth, periodYear, alertThreshold } = req.body;

  const budget = await Budget.findOneAndUpdate(
    { userId, category, periodMonth, periodYear },
    { $set: { monthlyLimit, alertThreshold: alertThreshold || 80 } },
    { new: true, upsert: true }
  );

  res.status(201).json({ success: true, data: budget });
}

export async function deleteBudget(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;

  const deleted = await Budget.findOneAndDelete({ _id: id, userId });
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Budget not found' });
    return;
  }

  res.json({ success: true, message: 'Budget deleted' });
}
