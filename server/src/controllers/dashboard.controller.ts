import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';
import { Gullak } from '../models/Gullak';

export async function getDashboardOverview(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const user = req.user!;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 1. Fetch all transactions for this month
  const monthlyTransactions = await Transaction.find({
    userId,
    date: { $gte: currentMonthStart, $lte: currentMonthEnd },
  }).sort({ date: -1 });

  let totalExpenses = 0;
  let needsSpent = 0;
  let wantsSpent = 0;
  let gullakSavedThisMonth = 0;

  // Leak categories
  let chaiAndSnacks = 0;
  let foodDelivery = 0;
  let travelCommute = 0;
  let shoppingFun = 0;

  monthlyTransactions.forEach(tx => {
    if (tx.type === 'expense') {
      totalExpenses += tx.amount;
      if (tx.bucket === 'needs') needsSpent += tx.amount;
      else wantsSpent += tx.amount;

      const titleLower = tx.title.toLowerCase();
      const catLower = tx.category.toLowerCase();

      if (titleLower.includes('coffee') || titleLower.includes('tea') || titleLower.includes('snack') || titleLower.includes('cafe')) {
        chaiAndSnacks += tx.amount;
      }
      if (titleLower.includes('swiggy') || titleLower.includes('zomato') || titleLower.includes('pizza') || titleLower.includes('burger')) {
        foodDelivery += tx.amount;
      }
      if (catLower.includes('travel') || titleLower.includes('metro') || titleLower.includes('auto') || titleLower.includes('uber') || titleLower.includes('petrol')) {
        travelCommute += tx.amount;
      }
      if (catLower.includes('shopping') || catLower.includes('fun') || titleLower.includes('movie') || titleLower.includes('party')) {
        shoppingFun += tx.amount;
      }
    } else if (tx.type === 'gullak_deposit') {
      gullakSavedThisMonth += tx.amount;
    }
  });

  const monthlyIncome = user.monthlyIncome || 35000;
  const remainingPocketCash = Math.max(0, monthlyIncome - totalExpenses - gullakSavedThisMonth);

  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, totalDaysInMonth - now.getDate());
  const dailySafeSpend = Math.round(remainingPocketCash / daysLeft);

  // 50-30-20 Rule calculations
  const targetNeeds = Math.round(monthlyIncome * 0.5);
  const targetWants = Math.round(monthlyIncome * 0.3);
  const targetSavings = Math.round(monthlyIncome * 0.2);

  // Gullak total savings
  const allGullaks = await Gullak.find({ userId });
  const totalGullakVault = allGullaks.reduce((a, g) => a + g.currentAmount, 0);

  // Leak Insights
  const leaks = [];
  if (chaiAndSnacks >= 150) {
    leaks.push({
      emoji: '☕',
      title: 'Coffee & Daily Snacks',
      amount: chaiAndSnacks,
      message: `You spent ₹${chaiAndSnacks} on artisanal coffee, tea, and quick snacks this month. Small daily treats accumulate quickly into significant monthly leakage.`,
    });
  }
  if (foodDelivery >= 600) {
    leaks.push({
      emoji: '🍕',
      title: 'Food Delivery & Late Orders',
      amount: foodDelivery,
      message: `Online food orders totaled ₹${foodDelivery} this month. Preparing home-cooked meals or meal prepping can save up to 65% in this category.`,
    });
  }
  if (travelCommute >= 500) {
    leaks.push({
      emoji: '🛵',
      title: 'Cab & Rideshare Surge',
      amount: travelCommute,
      message: `Rideshare and cab fares reached ₹${travelCommute}. Utilizing public transit or monthly metro passes could substantially reduce this transit burn.`,
    });
  }
  if (shoppingFun >= 1000) {
    leaks.push({
      emoji: '🛍️',
      title: 'Discretionary Shopping & Events',
      amount: shoppingFun,
      message: `Weekend leisure and retail purchases totaled ₹${shoppingFun}. Run non-essential items through the Affordability Calculator before purchasing.`,
    });
  }

  // Monthly category breakdown for Recharts
  const categoryMap = new Map<string, number>();
  monthlyTransactions.forEach(tx => {
    if (tx.type === 'expense') {
      categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + tx.amount);
    }
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  res.json({
    success: true,
    data: {
      user: {
        name: user.name,
        monthlyIncome,
      },
      pocket: {
        remainingPocketCash,
        totalExpenses,
        gullakSavedThisMonth,
        totalGullakVault,
        daysLeft,
        dailySafeSpend,
      },
      rule503020: {
        needs: { target: targetNeeds, spent: needsSpent, percent: Math.round((needsSpent / targetNeeds) * 100) },
        wants: { target: targetWants, spent: wantsSpent, percent: Math.round((wantsSpent / targetWants) * 100) },
        savings: { target: targetSavings, saved: gullakSavedThisMonth, percent: Math.round((gullakSavedThisMonth / targetSavings) * 100) },
      },
      leaks,
      categoryBreakdown,
      recentTransactions: monthlyTransactions.slice(0, 8),
    },
  });
}
