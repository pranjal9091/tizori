import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthView } from './components/auth/AuthView';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// PocketPaisa Views
import { PocketDashboard } from './components/dashboard/PocketDashboard';
import { AffordabilityView } from './components/affordability/AffordabilityView';
import { GullakView } from './components/gullak/GullakView';
import { ExpenseDiaryView } from './components/transactions/ExpenseDiaryView';
import { SubscriptionsView } from './components/subscriptions/SubscriptionsView';
import { DatabaseView } from './components/database/DatabaseView';

// Modals & Design System
import { AddExpenseModal } from './components/transactions/AddExpenseModal';
import { ProUpgradeModal } from './components/pro/ProUpgradeModal';
import { ToastProvider } from './design-system/Toast';

// Types & Endpoints
import { DashboardData, Gullak, Transaction } from './types';
import { dashboardApi, gullaksApi, transactionsApi } from './api/endpoints';

export const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Application Data States
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [gullaks, setGullaks] = useState<Gullak[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await dashboardApi.getOverview();
      if (res.data) setDashboardData(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadGullaks = useCallback(async () => {
    try {
      const res = await gullaksApi.getAll();
      if (res.data?.gullaks) setGullaks(res.data.gullaks);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const res = await transactionsApi.getAll();
      if (res.data) setTransactions(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshAll = useCallback(() => {
    loadDashboard();
    loadGullaks();
    loadTransactions();
  }, [loadDashboard, loadGullaks, loadTransactions]);

  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user, refreshAll]);

  if (authLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg)',
          color: 'var(--ink)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 11V9a7 7 0 0 0-14 0v2a5 5 0 0 0 0 10h14a5 5 0 0 0 0-10Z" />
              <circle cx="12" cy="14" r="2.5" />
              <path d="M12 9v1" />
            </svg>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--ink)',
            }}
          >
            PocketPaisa
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
            Loading your financial ledger...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'affordability':
        return {
          title: 'Can I Afford This?',
          subtitle: 'Evaluate impulse purchases in real-time before you spend',
        };
      case 'gullak':
        return {
          title: 'Savings Goal Vaults',
          subtitle: 'Disciplined target savings for vacations, technology, gifts, and emergency reserves',
        };
      case 'diary':
        return {
          title: 'Expense Ledger',
          subtitle: 'Detailed record of all transactions with automated 50-30-20 category allocation',
        };
      case 'subscriptions':
        return {
          title: 'Recurring Subscriptions & Bills',
          subtitle: 'Track fixed commitments, avoid surprise renewals, and monitor your monthly burn',
        };
      case 'database':
        return {
          title: 'Database & Cloud Integration',
          subtitle: 'Live database engine status, custom MongoDB Atlas cluster sync, and data portability',
        };
      default:
        return {
          title: 'Daily Overview',
          subtitle: undefined, // Will be filled dynamically by Header using dailySafeSpend
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openUpgradeModal={() => setIsUpgradeOpen(true)}
        openAddExpense={() => setIsAddExpenseOpen(true)}
      />

      <main className="main-content">
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          remainingCash={dashboardData?.pocket?.remainingPocketCash}
          dailySafeSpend={dashboardData?.pocket?.dailySafeSpend}
          openAddExpense={() => setIsAddExpenseOpen(true)}
          openAffordability={() => setCurrentTab('affordability')}
          onNavigateTab={setCurrentTab}
          openUpgradeModal={() => setIsUpgradeOpen(true)}
        />

        <div className="page-wrapper">
          {/* TAB 1: OVERVIEW */}
          {currentTab === 'overview' && dashboardData && (
            <PocketDashboard
              data={dashboardData}
              onRefresh={refreshAll}
              openAddModal={() => setIsAddExpenseOpen(true)}
              openAffordability={() => setCurrentTab('affordability')}
              onNavigateTab={setCurrentTab}
              openUpgradeModal={() => setIsUpgradeOpen(true)}
            />
          )}

          {/* TAB 2: AFFORDABILITY CALCULATOR */}
          {currentTab === 'affordability' && (
            <AffordabilityView onNavigateToGullak={() => setCurrentTab('gullak')} />
          )}

          {/* TAB 3: SAVINGS GOAL VAULTS */}
          {currentTab === 'gullak' && (
            <GullakView
              gullaks={gullaks}
              onRefresh={refreshAll}
              openUpgradeModal={() => setIsUpgradeOpen(true)}
            />
          )}

          {/* TAB 4: RECURRING SUBSCRIPTIONS */}
          {currentTab === 'subscriptions' && (
            <SubscriptionsView openUpgradeModal={() => setIsUpgradeOpen(true)} />
          )}

          {/* TAB 5: EXPENSE LEDGER */}
          {currentTab === 'diary' && (
            <ExpenseDiaryView
              transactions={transactions}
              onRefresh={refreshAll}
              openAddModal={() => setIsAddExpenseOpen(true)}
            />
          )}

          {/* TAB 6: DATABASE & CLOUD SYNC */}
          {currentTab === 'database' && (
            <DatabaseView />
          )}
        </div>
      </main>

      {/* MODALS */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onCreated={refreshAll}
      />

      <ProUpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onUpgradeSuccess={refreshAll}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
