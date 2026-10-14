import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { RecurringBill } from '../models/RecurringBill';
import { Transaction } from '../models/Transaction';

export const recurringBillSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  amount: z.number().min(1, 'Amount must be at least ₹1'),
  frequency: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  category: z.string().default('Utilities'),
  nextBillingDate: z.string(),
  paymentMethod: z.string().optional().default('UPI AutoPay'),
  reminderDaysBefore: z.number().optional().default(3),
  notes: z.string().optional().default(''),
});

// GET /api/recurring - list all bills + calculate monthly burn and upcoming renewals
export async function getRecurringBills(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const user = req.user!;
  const bills = await RecurringBill.find({ userId }).sort({ nextBillingDate: 1 });

  // Calculate normalized monthly burn
  let totalMonthlyBurn = 0;
  bills.forEach(bill => {
    if (bill.status === 'active') {
      if (bill.frequency === 'monthly') totalMonthlyBurn += bill.amount;
      else if (bill.frequency === 'quarterly') totalMonthlyBurn += Math.round(bill.amount / 3);
      else if (bill.frequency === 'annual') totalMonthlyBurn += Math.round(bill.amount / 12);
    }
  });

  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);

  const upcomingRenewals = bills.filter(
    b => b.status === 'active' && new Date(b.nextBillingDate) <= next7Days && new Date(b.nextBillingDate) >= now
  );

  const isPro = user.tier === 'pro';
  const freeLimit = 2;
  const activeCount = bills.filter(b => b.status === 'active').length;
  const canAddMore = isPro || activeCount < freeLimit;

  res.json({
    success: true,
    data: {
      bills,
      summary: {
        totalMonthlyBurn,
        annualProjectedBurn: totalMonthlyBurn * 12,
        activeCount,
        upcomingRenewalsCount: upcomingRenewals.length,
        isPro,
        canAddMore,
        freeLimit,
      },
      upcomingRenewals,
    },
  });
}

// POST /api/recurring - create recurring bill with Pro paywall check
export async function createRecurringBill(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const user = req.user!;
  const { name, amount, frequency, category, nextBillingDate, paymentMethod, reminderDaysBefore, notes } = req.body;

  // Paywall check for free tier
  if (user.tier !== 'pro') {
    const activeCount = await RecurringBill.countDocuments({ userId, status: 'active' });
    if (activeCount >= 2) {
      res.status(403).json({
        success: false,
        code: 'PAYWALL_TRIGGER',
        message: 'Free tier allows tracking up to 2 active subscriptions. Upgrade to PocketPaisa Pro for unlimited subscription tracking and renewal alerts.',
      });
      return;
    }
  }

  const bill = await RecurringBill.create({
    userId,
    name,
    amount,
    frequency: frequency || 'monthly',
    category: category || 'Utilities',
    nextBillingDate: new Date(nextBillingDate),
    paymentMethod: paymentMethod || 'UPI AutoPay',
    reminderDaysBefore: reminderDaysBefore ?? 3,
    notes: notes || '',
    status: 'active',
  });

  res.status(201).json({ success: true, data: bill });
}

// PATCH /api/recurring/:id - update bill
export async function updateRecurringBill(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;

  const bill = await RecurringBill.findOneAndUpdate({ _id: id, userId }, req.body, { new: true });
  if (!bill) {
    res.status(404).json({ success: false, message: 'Subscription bill not found' });
    return;
  }

  res.json({ success: true, data: bill });
}

// DELETE /api/recurring/:id - remove bill
export async function deleteRecurringBill(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;

  const bill = await RecurringBill.findOneAndDelete({ _id: id, userId });
  if (!bill) {
    res.status(404).json({ success: false, message: 'Subscription bill not found' });
    return;
  }

  res.json({ success: true, message: 'Subscription bill deleted' });
}

// POST /api/recurring/:id/log-payment - 1-tap mark as paid and record into Transaction ledger
export async function logRecurringPayment(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const { id } = req.params;

  const bill = await RecurringBill.findOne({ _id: id, userId });
  if (!bill) {
    res.status(404).json({ success: false, message: 'Subscription bill not found' });
    return;
  }

  // Create transaction in Expense ledger
  const tx = await Transaction.create({
    userId,
    title: `${bill.name} (${bill.frequency} renewal)`,
    amount: bill.amount,
    type: 'expense',
    category: bill.category || 'Utilities & Bills',
    bucket: 'needs',
    date: new Date(),
    notes: `Recurring subscription processed via ${bill.paymentMethod}`,
  });

  // Advance next billing date
  const nextDate = new Date(bill.nextBillingDate);
  if (bill.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
  else if (bill.frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
  else if (bill.frequency === 'annual') nextDate.setFullYear(nextDate.getFullYear() + 1);

  bill.nextBillingDate = nextDate;
  await bill.save();

  res.json({
    success: true,
    message: `Payment of ₹${bill.amount} logged into your ledger. Next renewal set to ${nextDate.toLocaleDateString()}.`,
    data: { bill, transaction: tx },
  });
}
