import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import mongoose from 'mongoose';

export async function getDashboardAnalytics(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const userObjectId = new mongoose.Types.ObjectId(userId.toString());

  // 1. Fetch Accounts for Current Assets, Liabilities, and Net Worth
  const accounts = await Account.find({ userId, isArchived: false });
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

  // 2. High-performance MongoDB Aggregation Pipeline using $facet
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [aggregateResult] = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        date: { $gte: sixMonthsAgo },
      },
    },
    {
      $facet: {
        // Group by month and type for 6-month cashflow timeline
        monthlyCashflow: [
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                type: '$type',
              },
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ],
        // Category breakdown for expenses
        categoryBreakdown: [
          { $match: { type: 'expense' } },
          {
            $group: {
              _id: '$category',
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { totalAmount: -1 } },
        ],
        // Top spending merchants
        topMerchants: [
          { $match: { type: 'expense', merchant: { $ne: '' } } },
          {
            $group: {
              _id: '$merchant',
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { totalAmount: -1 } },
          { $limit: 5 },
        ],
      },
    },
  ]);

  // Transform monthlyCashflow into clean timeline array for Recharts
  const monthMap = new Map<string, { month: string; income: number; expense: number; savings: number }>();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Initialize past 6 months chronologically
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    monthMap.set(key, {
      month: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
      income: 0,
      expense: 0,
      savings: 0,
    });
  }

  if (aggregateResult?.monthlyCashflow) {
    aggregateResult.monthlyCashflow.forEach((item: any) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (monthMap.has(key)) {
        const entry = monthMap.get(key)!;
        if (item._id.type === 'income') entry.income += item.totalAmount;
        if (item._id.type === 'expense') entry.expense += item.totalAmount;
        entry.savings = entry.income - entry.expense;
      }
    });
  }

  const monthlyHistory = Array.from(monthMap.values());

  // Current month numbers
  const currentMonthEntry = monthlyHistory[monthlyHistory.length - 1] || { income: 0, expense: 0, savings: 0 };
  const currentMonthIncome = currentMonthEntry.income;
  const currentMonthExpense = currentMonthEntry.expense;
  const savingsRate = currentMonthIncome > 0 ? Math.round(((currentMonthIncome - currentMonthExpense) / currentMonthIncome) * 100) : 0;

  // 3. Compute Financial Health Score (0 - 100)
  // Factors:
  // a) Savings Rate (Max 35 pts): 20%+ gets full points
  // b) Debt-to-Asset ratio (Max 35 pts): < 20% gets full points
  // c) Emergency Runway in months (Max 30 pts): 6+ months gets full points
  let score = 50; // default baseline

  // Factor A: Savings rate
  if (savingsRate >= 30) score += 25;
  else if (savingsRate >= 15) score += 15;
  else if (savingsRate > 0) score += 5;
  else score -= 15;

  // Factor B: Debt / Liabilities
  const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 1;
  if (debtRatio < 0.15) score += 15;
  else if (debtRatio < 0.4) score += 5;
  else score -= 10;

  // Factor C: Runway
  const avgMonthlyExpense = monthlyHistory.reduce((acc, m) => acc + m.expense, 0) / (monthlyHistory.length || 1) || 1;
  const runwayMonths = +(totalAssets / avgMonthlyExpense).toFixed(1);

  if (runwayMonths >= 6) score += 10;
  else if (runwayMonths >= 3) score += 5;
  else score -= 10;

  const financialHealthScore = Math.max(15, Math.min(98, score));

  // 4. 30-Day Predictive Cashflow Forecast
  const dailyBurnRate = avgMonthlyExpense / 30;
  const projected30DayBalance = Math.round(netWorth - (dailyBurnRate * 30) + (currentMonthIncome * 0.9));

  res.json({
    success: true,
    data: {
      overview: {
        totalAssets,
        totalLiabilities,
        netWorth,
        currentMonthIncome,
        currentMonthExpense,
        savingsRate,
        financialHealthScore,
        runwayMonths,
        projected30DayBalance,
      },
      monthlyHistory,
      categoryBreakdown: aggregateResult?.categoryBreakdown || [],
      topMerchants: aggregateResult?.topMerchants || [],
    },
  });
}
