export interface User {
  id: string;
  name: string;
  email: string;
  monthlyIncome: number;
  currency: 'INR' | 'USD';
  tier: 'free' | 'pro';
  avatar?: string;
  authProvider?: 'local' | 'google';
}

export interface Transaction {
  _id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income' | 'gullak_deposit' | 'gullak_withdraw';
  category: string;
  bucket: 'needs' | 'wants' | 'savings';
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Gullak {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  category: string;
  targetDate: string;
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
}

export interface LeakItem {
  emoji: string;
  title: string;
  amount: number;
  message: string;
}

export interface DashboardData {
  user: {
    name: string;
    monthlyIncome: number;
  };
  pocket: {
    remainingPocketCash: number;
    totalExpenses: number;
    gullakSavedThisMonth: number;
    totalGullakVault: number;
    daysLeft: number;
    dailySafeSpend: number;
  };
  rule503020: {
    needs: { target: number; spent: number; percent: number };
    wants: { target: number; spent: number; percent: number };
    savings: { target: number; saved: number; percent: number };
  };
  leaks: LeakItem[];
  categoryBreakdown: { name: string; value: number }[];
  recentTransactions: Transaction[];
}

export interface AffordabilityResult {
  itemName: string;
  itemPrice: number;
  monthlyBudget: number;
  spentSoFar: number;
  remainingPocketMoney: number;
  daysLeft: number;
  currentDailyBudget: number;
  newDailyBudget: number;
  verdict: 'DONT_BUY' | 'WAIT_A_BIT' | 'SAFE_TO_BUY';
  badgeColor: string;
  headline: string;
  advice: string;
}

export interface RecurringBill {
  _id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annual';
  category: string;
  nextBillingDate: string;
  status: 'active' | 'paused' | 'cancelled';
  paymentMethod: string;
  reminderDaysBefore: number;
  notes?: string;
  createdAt: string;
}

export interface RecurringSummary {
  totalMonthlyBurn: number;
  annualProjectedBurn: number;
  activeCount: number;
  upcomingRenewalsCount: number;
  isPro: boolean;
  canAddMore: boolean;
  freeLimit: number;
}

export interface DatabaseStatus {
  status: 'connected' | 'disconnected';
  readyState: number;
  engineType: 'atlas' | 'local' | 'in-memory';
  engineName: string;
  maskedUri: string;
  databaseName: string;
  latencyMs: number;
  stats: {
    transactionsCount: number;
    gullaksCount: number;
    recurringCount: number;
    usersCount: number;
    subscriptionsCount: number;
    totalRecords: number;
  };
}

export interface GatewayMethod {
  id: string;
  name: string;
  providers: string[];
  active: boolean;
}

export interface GatewayConfig {
  stripeConfigured: boolean;
  defaultCurrency: string;
  supportedMethods: GatewayMethod[];
  merchantVpa: string;
  merchantName: string;
}
