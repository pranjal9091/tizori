import React from 'react';
import {
  Wallet,
  PiggyBank,
  HelpCircle,
  BookOpen,
  Sparkles,
  LogOut,
  User as UserIcon,
  Plus,
  CalendarClock,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../design-system/ThemeToggle';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openUpgradeModal: () => void;
  openAddExpense?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  openUpgradeModal,
  openAddExpense,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Daily Overview', icon: Wallet },
    { id: 'diary', label: 'Expense Ledger', icon: BookOpen },
    { id: 'gullak', label: 'Savings Vaults', icon: PiggyBank, badge: 'Goals' },
    { id: 'subscriptions', label: 'Subscriptions', icon: CalendarClock, badge: 'Bills' },
    { id: 'affordability', label: 'Affordability Check', icon: HelpCircle, badge: 'Smart' },
    { id: 'database', label: 'Database & Cloud', icon: Database },
    { id: 'upgrade', label: 'PocketPaisa Pro', icon: Sparkles, highlight: true },
  ];

  return (
    <>
      {/* DESKTOP LEFT RAIL */}
      <aside
        className="desktop-sidebar"
        style={{
          width: '260px',
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          flexShrink: 0,
          padding: '1.5rem 1rem',
          boxShadow: 'var(--shadow-1)',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem 1.75rem 0.5rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-contrast)',
              boxShadow: '0 2px 8px rgba(47, 93, 80, 0.25)',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 11V9a7 7 0 0 0-14 0v2a5 5 0 0 0 0 10h14a5 5 0 0 0 0-10Z" />
              <circle cx="12" cy="14" r="2.5" />
              <path d="M12 9v1" />
            </svg>
          </div>

          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.3rem',
                fontWeight: 800,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              PocketPaisa
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', letterSpacing: '0.02em' }}>
              Personal Money Coach
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'upgrade') {
                    openUpgradeModal();
                  } else {
                    setCurrentTab(item.id);
                  }
                }}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.9rem',
                  borderRadius: 'var(--radius-input)',
                  background: isActive ? 'var(--primary-soft)' : 'transparent',
                  color: isActive
                    ? 'var(--primary)'
                    : item.highlight
                    ? 'var(--accent)'
                    : 'var(--ink)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: item.badge === 'Smart' ? 'var(--accent-soft)' : 'var(--primary-soft)',
                      color: item.badge === 'Smart' ? 'var(--accent)' : 'var(--primary)',
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Drawer & Theme Toggle */}
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink)',
                fontWeight: 700,
                fontSize: '0.8125rem',
              }}
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon size={16} />}
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>
                {user?.name || 'Aman Verma'}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: user?.tier === 'pro' ? 'var(--accent)' : 'var(--ink-muted)',
                  fontWeight: 600,
                }}
              >
                {user?.tier === 'pro' ? 'Pro Member' : 'Standard Member'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ThemeToggle />
            <button
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="btn-icon"
              style={{ width: '36px', height: '36px' }}
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 100,
          boxShadow: 'var(--shadow-2)',
          padding: '0 0.5rem',
        }}
        aria-label="Mobile Navigation"
      >
        {/* 1. Overview */}
        <button
          onClick={() => setCurrentTab('overview')}
          aria-label="Daily Overview"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: 'transparent',
            border: 'none',
            color: currentTab === 'overview' ? 'var(--primary)' : 'var(--ink-muted)',
            cursor: 'pointer',
            height: '100%',
          }}
        >
          <Wallet size={19} strokeWidth={currentTab === 'overview' ? 2 : 1.5} />
          <span style={{ fontSize: '0.6875rem', fontWeight: currentTab === 'overview' ? 700 : 500 }}>Overview</span>
        </button>

        {/* 2. Ledger */}
        <button
          onClick={() => setCurrentTab('diary')}
          aria-label="Expense Ledger"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: 'transparent',
            border: 'none',
            color: currentTab === 'diary' ? 'var(--primary)' : 'var(--ink-muted)',
            cursor: 'pointer',
            height: '100%',
          }}
        >
          <BookOpen size={19} strokeWidth={currentTab === 'diary' ? 2 : 1.5} />
          <span style={{ fontSize: '0.6875rem', fontWeight: currentTab === 'diary' ? 700 : 500 }}>Ledger</span>
        </button>

        {/* 3. Raised Center + Expense Button */}
        {openAddExpense && (
          <div style={{ position: 'relative', top: '-14px', flexShrink: 0 }}>
            <button
              onClick={openAddExpense}
              aria-label="Log Expense"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-contrast)',
                border: '3px solid var(--surface)',
                boxShadow: 'var(--shadow-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* 4. Vaults */}
        <button
          onClick={() => setCurrentTab('gullak')}
          aria-label="Savings Vaults"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: 'transparent',
            border: 'none',
            color: currentTab === 'gullak' ? 'var(--primary)' : 'var(--ink-muted)',
            cursor: 'pointer',
            height: '100%',
          }}
        >
          <PiggyBank size={19} strokeWidth={currentTab === 'gullak' ? 2 : 1.5} />
          <span style={{ fontSize: '0.6875rem', fontWeight: currentTab === 'gullak' ? 700 : 500 }}>Vaults</span>
        </button>

        {/* 5. Affordability */}
        <button
          onClick={() => setCurrentTab('affordability')}
          aria-label="Affordability Check"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: 'transparent',
            border: 'none',
            color: currentTab === 'affordability' ? 'var(--primary)' : 'var(--ink-muted)',
            cursor: 'pointer',
            height: '100%',
          }}
        >
          <HelpCircle size={19} strokeWidth={currentTab === 'affordability' ? 2 : 1.5} />
          <span style={{ fontSize: '0.6875rem', fontWeight: currentTab === 'affordability' ? 700 : 500 }}>Afford</span>
        </button>

        {/* 6. Database & Cloud */}
        <button
          onClick={() => setCurrentTab('database')}
          aria-label="Database & Cloud"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: 'transparent',
            border: 'none',
            color: currentTab === 'database' ? 'var(--primary)' : 'var(--ink-muted)',
            cursor: 'pointer',
            height: '100%',
          }}
        >
          <Database size={19} strokeWidth={currentTab === 'database' ? 2 : 1.5} />
          <span style={{ fontSize: '0.6875rem', fontWeight: currentTab === 'database' ? 700 : 500 }}>Cloud DB</span>
        </button>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-bottom-nav {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
