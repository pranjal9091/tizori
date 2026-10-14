import { apiRequest } from './client';
import {
  User,
  Transaction,
  Gullak,
  DashboardData,
  AffordabilityResult,
} from '../types';

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  googleLogin: (credential: string, mode: 'signin' | 'signup' = 'signin') =>
    apiRequest<{ token: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, mode }),
    }),

  register: (payload: { name: string; email: string; password: string; confirmPassword?: string; monthlyIncome?: number }) =>
    apiRequest<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getConfig: () =>
    apiRequest<{ googleClientId: string; hasGoogleAuth: boolean }>('/auth/config'),

  demoLogin: () =>
    apiRequest<{ token: string; user: User }>('/auth/demo', {
      method: 'POST',
    }),

  getMe: () => apiRequest<{ user: User }>('/auth/me'),

  updateProfile: (data: { name?: string; monthlyIncome?: number }) =>
    apiRequest<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const dashboardApi = {
  getOverview: () => apiRequest<DashboardData>('/dashboard/overview'),
};

export const gullaksApi = {
  getAll: () =>
    apiRequest<{ gullaks: Gullak[]; summary: { totalSavedInGullaks: number; totalTargetNeeded: number; overallProgress: number } }>(
      '/gullaks'
    ),

  create: (data: Partial<Gullak>) =>
    apiRequest<Gullak>('/gullaks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addMoney: (id: string, amount: number) =>
    apiRequest<Gullak>(`/gullaks/${id}/add`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  breakGullak: (id: string, amount?: number) =>
    apiRequest<Gullak>(`/gullaks/${id}/break`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  delete: (id: string) =>
    apiRequest(`/gullaks/${id}`, {
      method: 'DELETE',
    }),
};

export const affordabilityApi = {
  check: (data: { itemName: string; price: number }) =>
    apiRequest<AffordabilityResult>('/affordability/check', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const transactionsApi = {
  getAll: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest<Transaction[]>(`/transactions?${query}`);
  },

  create: (data: { title: string; amount: number; category: string; bucket: string; notes?: string }) =>
    apiRequest<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest(`/transactions/${id}`, {
      method: 'DELETE',
    }),
};

export const paymentsApi = {
  checkout: (planType: 'monthly' | 'annual', useSandbox = false) =>
    apiRequest<{ mode: string; url?: string }>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ planType, useSandbox }),
    }),

  confirmSandbox: (planType: 'monthly' | 'annual') =>
    apiRequest<{ mode: string }>('/payments/sandbox/confirm', {
      method: 'POST',
      body: JSON.stringify({ planType }),
    }),

  depositVault: (payload: { gullakId: string; amount: number; paymentMethod: string; vpaId?: string }) =>
    apiRequest<{
      gullak: Gullak;
      transaction: Transaction;
      receipt: { referenceId: string; amount: number; paymentMethod: string; timestamp: string; status: string };
    }>('/payments/deposit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getGatewayConfig: () =>
    apiRequest<{
      razorpayConfigured?: boolean;
      razorpayKeyId?: string;
      stripeConfigured: boolean;
      defaultCurrency: string;
      supportedMethods: { id: string; name: string; providers: string[]; active: boolean }[];
      merchantVpa: string;
      merchantName: string;
    }>('/payments/config'),

  createRazorpayOrder: (payload: { planType?: string; amount?: number }) =>
    apiRequest<{ mode: string; orderId: string; amount: number; currency: string; keyId: string; message?: string }>('/payments/razorpay/order', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyRazorpayPayment: (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    planType?: string;
  }) =>
    apiRequest<{ success: boolean; message: string; user?: any }>('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const recurringApi = {
  getAll: () =>
    apiRequest<{
      bills: import('../types').RecurringBill[];
      summary: import('../types').RecurringSummary;
      upcomingRenewals: import('../types').RecurringBill[];
    }>('/recurring'),

  create: (data: Partial<import('../types').RecurringBill>) =>
    apiRequest<import('../types').RecurringBill>('/recurring', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<import('../types').RecurringBill>) =>
    apiRequest<import('../types').RecurringBill>(`/recurring/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest(`/recurring/${id}`, {
      method: 'DELETE',
    }),

  logPayment: (id: string) =>
    apiRequest<{ bill: import('../types').RecurringBill; transaction: Transaction }>(`/recurring/${id}/log-payment`, {
      method: 'POST',
    }),
};

export const databaseApi = {
  getStatus: () =>
    apiRequest<import('../types').DatabaseStatus>('/database/status'),

  testConnection: (uri: string) =>
    apiRequest<{ latencyMs: number; databaseName: string }>('/database/test', {
      method: 'POST',
      body: JSON.stringify({ uri }),
    }),

  switchConnection: (uri: string) =>
    apiRequest<{ maskedUri: string; databaseName: string }>('/database/connect', {
      method: 'POST',
      body: JSON.stringify({ uri }),
    }),

  importData: (payload: { transactions?: unknown[]; gullaks?: unknown[]; recurring?: unknown[] }) =>
    apiRequest<{ transactionsImported: number; gullaksImported: number; recurringImported: number }>('/database/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

