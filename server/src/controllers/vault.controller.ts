import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { Vault } from '../models/Vault';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

export const vaultSchema = z.object({
  title: z.string().min(1, 'Vault title is required'),
  targetAmount: z.number().positive('Target amount must be positive'),
  category: z.string().optional().default('Savings'),
  targetDate: z.string(),
  lockUntilDate: z.string().optional(),
  color: z.string().optional().default('#F59E0B'),
  icon: z.string().optional().default('Shield'),
  notes: z.string().optional().default(''),
});

export async function getVaults(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const vaults = await Vault.find({ userId }).sort({ createdAt: -1 });

  const totalVaultSavings = vaults.reduce((acc, v) => acc + v.currentAmount, 0);
  const totalTargetNeeded = vaults.reduce((acc, v) => acc + v.targetAmount, 0);

  res.json({
    success: true,
    data: {
      vaults,
      summary: {
        totalVaultSavings,
        totalTargetNeeded,
        overallProgress: totalTargetNeeded > 0 ? Math.round((totalVaultSavings / totalTargetNeeded) * 100) : 0,
      },
    },
  });
}

export async function createVault(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { title, targetAmount, category, targetDate, lockUntilDate, color, icon, notes } = req.body;

  const isLocked = lockUntilDate ? new Date(lockUntilDate) > new Date() : false;

  const vault = await Vault.create({
    userId,
    title,
    targetAmount,
    currentAmount: 0,
    category,
    targetDate: new Date(targetDate),
    lockUntilDate: lockUntilDate ? new Date(lockUntilDate) : undefined,
    isLocked,
    color,
    icon,
    notes,
  });

  res.status(201).json({ success: true, data: vault });
}

// Deposit funds from an account into a Vault locker
export async function depositIntoVault(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;
  const { accountId, amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ success: false, message: 'Valid deposit amount is required' });
    return;
  }

  const [vault, account] = await Promise.all([
    Vault.findOne({ _id: id, userId }),
    Account.findOne({ _id: accountId, userId }),
  ]);

  if (!vault) {
    res.status(404).json({ success: false, message: 'Vault not found' });
    return;
  }
  if (!account) {
    res.status(404).json({ success: false, message: 'Funding account not found' });
    return;
  }

  if (account.balance < amount) {
    res.status(400).json({
      success: false,
      message: `Insufficient balance in ${account.name} (Available: ${account.balance})`,
    });
    return;
  }

  account.balance -= amount;
  vault.currentAmount += amount;
  await account.save();
  await vault.save();

  // Create audit transaction record
  await Transaction.create({
    userId,
    accountId: account._id,
    amount,
    type: 'expense',
    category: 'Vault Savings',
    merchant: `Locked into ${vault.title}`,
    notes: `Deposit to savings vault: ${vault.title}`,
    date: new Date(),
    status: 'completed',
  });

  res.json({
    success: true,
    message: `Deposited into vault successfully!`,
    data: { vault, account },
  });
}

// Withdraw funds from a Vault back into an account
export async function withdrawFromVault(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;
  const { accountId, amount } = req.body;

  const [vault, account] = await Promise.all([
    Vault.findOne({ _id: id, userId }),
    Account.findOne({ _id: accountId, userId }),
  ]);

  if (!vault) {
    res.status(404).json({ success: false, message: 'Vault not found' });
    return;
  }
  if (!account) {
    res.status(404).json({ success: false, message: 'Destination account not found' });
    return;
  }

  // Check locking rule
  if (vault.isLocked && vault.lockUntilDate && new Date(vault.lockUntilDate) > new Date()) {
    const unlockDate = new Date(vault.lockUntilDate).toLocaleDateString();
    res.status(400).json({
      success: false,
      message: `Vault is securely locked until ${unlockDate}. Withdrawals are prohibited until maturity to enforce discipline.`,
    });
    return;
  }

  if (amount > vault.currentAmount) {
    res.status(400).json({
      success: false,
      message: `Cannot withdraw more than current vault balance (${vault.currentAmount})`,
    });
    return;
  }

  vault.currentAmount -= amount;
  account.balance += amount;
  await vault.save();
  await account.save();

  await Transaction.create({
    userId,
    accountId: account._id,
    amount,
    type: 'income',
    category: 'Vault Unlock',
    merchant: `Unlocked from ${vault.title}`,
    notes: `Withdrawal from savings vault: ${vault.title}`,
    date: new Date(),
    status: 'completed',
  });

  res.json({
    success: true,
    message: `Withdrawn from vault back to ${account.name}`,
    data: { vault, account },
  });
}

export async function deleteVault(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;

  const vault = await Vault.findOneAndDelete({ _id: id, userId });
  if (!vault) {
    res.status(404).json({ success: false, message: 'Vault not found' });
    return;
  }

  res.json({ success: true, message: 'Vault deleted successfully' });
}
