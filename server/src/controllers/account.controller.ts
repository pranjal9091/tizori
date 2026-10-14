import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { Account, AccountType } from '../models/Account';
import { Transaction } from '../models/Transaction';
import mongoose from 'mongoose';

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['checking', 'savings', 'credit_card', 'investment', 'cash']),
  balance: z.number().default(0),
  currency: z.string().default('INR'),
  institution: z.string().optional().default('Bank'),
  accountNumberMask: z.string().optional().default('••••'),
  color: z.string().optional().default('#10B981'),
});

export async function getAccounts(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const accounts = await Account.find({ userId, isArchived: false }).sort({ createdAt: 1 });

  // Compute breakdown: Assets vs Liabilities
  let totalAssets = 0;
  let totalLiabilities = 0;

  accounts.forEach(acc => {
    if (acc.type === 'credit_card') {
      if (acc.balance > 0) totalLiabilities += acc.balance;
      else totalAssets += Math.abs(acc.balance);
    } else {
      if (acc.balance >= 0) totalAssets += acc.balance;
      else totalLiabilities += Math.abs(acc.balance);
    }
  });

  const netWorth = totalAssets - totalLiabilities;

  res.json({
    success: true,
    data: {
      accounts,
      summary: {
        totalAssets,
        totalLiabilities,
        netWorth,
      },
    },
  });
}

export async function createAccount(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const account = await Account.create({
    ...req.body,
    userId,
    currency: req.body.currency || req.user!.currency,
  });

  res.status(201).json({ success: true, data: account });
}

export async function updateAccount(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;

  const account = await Account.findOneAndUpdate(
    { _id: id, userId },
    { $set: req.body },
    { new: true }
  );

  if (!account) {
    res.status(404).json({ success: false, message: 'Account not found' });
    return;
  }

  res.json({ success: true, data: account });
}

export async function deleteAccount(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;

  const account = await Account.findOneAndUpdate(
    { _id: id, userId },
    { $set: { isArchived: true } },
    { new: true }
  );

  if (!account) {
    res.status(404).json({ success: false, message: 'Account not found' });
    return;
  }

  res.json({ success: true, message: 'Account archived successfully' });
}

export async function transferBetweenAccounts(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { fromAccountId, toAccountId, amount, notes } = req.body;

  if (amount <= 0) {
    res.status(400).json({ success: false, message: 'Transfer amount must be greater than zero' });
    return;
  }

  if (fromAccountId === toAccountId) {
    res.status(400).json({ success: false, message: 'Source and destination accounts must be distinct' });
    return;
  }

  const fromAcc = await Account.findOne({ _id: fromAccountId, userId });
  const toAcc = await Account.findOne({ _id: toAccountId, userId });

  if (!fromAcc || !toAcc) {
    res.status(404).json({ success: false, message: 'One or both accounts could not be found' });
    return;
  }

  // Atomically update balances
  fromAcc.balance -= amount;
  toAcc.balance += amount;
  await fromAcc.save();
  await toAcc.save();

  // Create audit transaction records
  const tx = await Transaction.create({
    userId,
    accountId: fromAcc._id,
    transferToAccountId: toAcc._id,
    amount,
    type: 'transfer',
    category: 'Transfers',
    merchant: `Transfer to ${toAcc.name}`,
    notes: notes || `Internal transfer: ${fromAcc.name} ➔ ${toAcc.name}`,
    date: new Date(),
    status: 'completed',
  });

  res.json({
    success: true,
    message: 'Transfer completed successfully',
    data: {
      transaction: tx,
      fromAccount: fromAcc,
      toAccount: toAcc,
    },
  });
}
