import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { Gullak } from '../models/Gullak';
import { Transaction } from '../models/Transaction';

export const gullakSchema = z.object({
  name: z.string().min(1, 'Gullak goal name is required'),
  targetAmount: z.number().min(100, 'Target amount should be at least ₹100'),
  emoji: z.string().optional().default('🐷'),
  category: z.string().optional().default('Savings Goal'),
  targetDate: z.string(),
  notes: z.string().optional().default(''),
});

export async function getGullaks(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const gullaks = await Gullak.find({ userId }).sort({ createdAt: -1 });

  const totalSavedInGullaks = gullaks.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTargetNeeded = gullaks.reduce((acc, g) => acc + g.targetAmount, 0);

  res.json({
    success: true,
    data: {
      gullaks,
      summary: {
        totalSavedInGullaks,
        totalTargetNeeded,
        overallProgress: totalTargetNeeded > 0 ? Math.round((totalSavedInGullaks / totalTargetNeeded) * 100) : 0,
      },
    },
  });
}

export async function createGullak(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { name, targetAmount, emoji, category, targetDate, notes } = req.body;

  const gullak = await Gullak.create({
    userId,
    name,
    targetAmount,
    currentAmount: 0,
    emoji: emoji || '🐷',
    category: category || 'Trip',
    targetDate: new Date(targetDate),
    notes,
  });

  res.status(201).json({ success: true, data: gullak });
}

// "Gullak Me Rupaye Daalo" (Add Savings)
export async function addMoneyToGullak(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ success: false, message: 'Valid amount is required' });
    return;
  }

  const gullak = await Gullak.findOne({ _id: id, userId });
  if (!gullak) {
    res.status(404).json({ success: false, message: 'Gullak not found' });
    return;
  }

  gullak.currentAmount += amount;
  if (gullak.currentAmount >= gullak.targetAmount) {
    gullak.isCompleted = true;
  }
  await gullak.save();

  // Create audit transaction record
  await Transaction.create({
    userId,
    title: `Deposited into ${gullak.name} ${gullak.emoji}`,
    amount,
    type: 'gullak_deposit',
    category: 'Goal Savings',
    bucket: 'savings',
    date: new Date(),
    notes: `Added ₹${amount} into Goal Vault: ${gullak.name}`,
  });

  res.json({
    success: true,
    message: `₹${amount} successfully deposited into ${gullak.name}.`,
    data: gullak,
  });
}

// Withdraw / Redeem from Goal Vault
export async function breakGullak(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;
  const { amount } = req.body;

  const gullak = await Gullak.findOne({ _id: id, userId });
  if (!gullak) {
    res.status(404).json({ success: false, message: 'Goal vault not found' });
    return;
  }

  const withdrawAmount = amount ? Math.min(amount, gullak.currentAmount) : gullak.currentAmount;

  if (withdrawAmount <= 0) {
    res.status(400).json({ success: false, message: 'Goal vault is currently empty.' });
    return;
  }

  gullak.currentAmount -= withdrawAmount;
  await gullak.save();

  await Transaction.create({
    userId,
    title: `Withdrawn from ${gullak.name} ${gullak.emoji}`,
    amount: withdrawAmount,
    type: 'gullak_withdraw',
    category: 'Goal Savings',
    bucket: 'savings',
    date: new Date(),
    notes: `Transferred ₹${withdrawAmount} from ${gullak.name} back to available pocket balance.`,
  });

  res.json({
    success: true,
    message: `₹${withdrawAmount} transferred from ${gullak.name} back to available balance.`,
    data: gullak,
  });
}

export async function deleteGullak(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;

  const gullak = await Gullak.findOneAndDelete({ _id: id, userId });
  if (!gullak) {
    res.status(404).json({ success: false, message: 'Gullak not found' });
    return;
  }

  res.json({ success: true, message: 'Gullak deleted' });
}
