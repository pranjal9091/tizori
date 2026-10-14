import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';

export async function checkAffordability(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const user = req.user!;
  const { itemName, price } = req.body;

  const itemPrice = parseFloat(price);
  if (!itemName || isNaN(itemPrice) || itemPrice <= 0) {
    res.status(400).json({ success: false, message: 'Valid item name and price are required' });
    return;
  }

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Total spent so far this month
  const expensesThisMonth = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: { $in: ['expense', 'gullak_deposit'] },
        date: { $gte: currentMonthStart, $lte: currentMonthEnd },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const spentSoFar = expensesThisMonth[0]?.total || 0;
  const monthlyBudget = user.monthlyIncome || 35000;
  const remainingPocketMoney = Math.max(0, monthlyBudget - spentSoFar);

  // Remaining days in month
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, totalDaysInMonth - now.getDate());

  const currentDailyBudget = Math.round(remainingPocketMoney / daysLeft);
  const newRemaining = remainingPocketMoney - itemPrice;
  const newDailyBudget = Math.round(newRemaining / daysLeft);

  let verdict: 'DONT_BUY' | 'WAIT_A_BIT' | 'SAFE_TO_BUY';
  let badgeColor: string;
  let headline: string;
  let advice: string;

  if (itemPrice > remainingPocketMoney) {
    verdict = 'DONT_BUY';
    badgeColor = '#EF4444';
    headline = 'Out of Budget: Insufficient Pocket Balance';
    advice = `You currently have ₹${remainingPocketMoney} remaining for this month, while this item costs ₹${itemPrice}. Making this purchase would exceed your monthly spending limit.`;
  } else if (itemPrice > remainingPocketMoney * 0.5 || newDailyBudget < 180) {
    verdict = 'DONT_BUY';
    badgeColor = '#EF4444';
    headline = 'Significant Impact: High Daily Allowance Reduction';
    advice = `Spending ₹${itemPrice} now will reduce your daily safe spend from ₹${currentDailyBudget} to ₹${newDailyBudget}/day for the remaining ${daysLeft} days. We recommend postponing this purchase to next month.`;
  } else if (itemPrice > remainingPocketMoney * 0.25) {
    verdict = 'WAIT_A_BIT';
    badgeColor = '#F59E0B';
    headline = 'Consider Saving: Create a Goal Vault';
    advice = `This purchase is technically feasible, but it will noticeably tighten your daily allowance (reducing it from ₹${currentDailyBudget} to ₹${newDailyBudget}/day). Consider allocating ₹${Math.round(itemPrice / 3)}/week into a dedicated savings vault instead.`;
  } else {
    verdict = 'SAFE_TO_BUY';
    badgeColor = '#10B981';
    headline = 'Safe to Buy: Well Within Daily Safe Spend';
    advice = `This purchase is well within your budget limits. You will comfortably maintain a daily safe allowance of ₹${newDailyBudget}/day for the remaining ${daysLeft} days.`;
  }

  res.json({
    success: true,
    data: {
      itemName,
      itemPrice,
      monthlyBudget,
      spentSoFar,
      remainingPocketMoney,
      daysLeft,
      currentDailyBudget,
      newDailyBudget: Math.max(0, newDailyBudget),
      verdict,
      badgeColor,
      headline,
      advice,
    },
  });
}
