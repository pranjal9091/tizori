import React from 'react';
import { Plus, HelpCircle, Wallet, Database, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../design-system/ThemeToggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
  remainingCash?: number;
  dailySafeSpend?: number;
  openAddExpense: () => void;
  openAffordability: () => void;
  onNavigateTab?: (tab: 'overview' | 'diary' | 'gullak' | 'subscriptions' | 'affordability' | 'database') => void;
  openUpgradeModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  remainingCash,
  dailySafeSpend,
  openAddExpense,
  openAffordability,
  onNavigateTab,
  openUpgradeModal,
}) => {
  const { formatCurrency } = useAuth();

  // Dynamic context-aware English greeting tied to real numbers
  const getContextGreeting = () => {
    if (dailySafeSpend !== undefined && dailySafeSpend > 0) {
      if (dailySafeSpend >= 800) {
        return `Today's safe allowance is ${formatCurrency(dailySafeSpend)} — on track, spend mindfully.`;
      } else if (dailySafeSpend >= 350) {
        return `Today's safe allowance is ${formatCurrency(dailySafeSpend)} — maintaining this keeps your monthly budget on target.`;
      } else {
        return `Today's safe allowance is ${formatCurrency(dailySafeSpend)} — prioritize essentials to remain within budget.`;
      }
    }
    return 'Track daily expenses and build disciplined financial habits.';
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.15rem 2rem',
        borderBottom: '1px solid var(--line)',
        backgroundColor: 'var(--surface)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'background-color 0.25s ease',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
        </div>

        {/* Real-data connected English greeting */}
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--ink-muted)',
            marginTop: '0.2rem',
          }}
        >
          {subtitle || getContextGreeting()}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {remainingCash !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--line)',
              fontSize: '0.8125rem',
            }}
          >
            <Wallet size={14} color="var(--primary)" />
            <span style={{ color: 'var(--ink-muted)' }}>Pocket Cash:</span>
            <span
              style={{
                fontWeight: 800,
                color: 'var(--primary)',
              }}
              className="mono"
            >
              {formatCurrency(remainingCash)}
            </span>
          </div>
        )}

        <button
          onClick={openAffordability}
          className="btn btn-secondary btn-sm header-action-btn"
          title="Can I Afford This? Impulse Purchase Check"
        >
          <HelpCircle size={15} color="var(--accent)" />
          <span>Affordability Check</span>
        </button>

        <button
          onClick={openAddExpense}
          className="btn btn-primary btn-sm header-action-btn"
          title="Record a New Expense"
        >
          <Plus size={16} strokeWidth={2.2} />
          <span>+ Log Expense</span>
        </button>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('database')}
            className="btn btn-secondary btn-sm header-action-btn"
            title="Database & Cloud Sync (MongoDB Active)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Database size={14} color="var(--primary)" />
            <span>DB Engine</span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--cat-bachat)',
              }}
            />
          </button>
        )}

        {openUpgradeModal && (
          <button
            onClick={openUpgradeModal}
            className="btn btn-primary btn-sm header-action-btn"
            title="PocketPaisa Pro & Payment Wall"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--cat-bachat)',
              borderColor: 'var(--cat-bachat)',
              color: '#ffffff',
            }}
          >
            <Sparkles size={14} />
            <span>Pro Paywall</span>
          </button>
        )}

        {/* Theme toggle available directly in header on all viewports */}
        <ThemeToggle />
      </div>

      <style>{`
        @media (max-width: 640px) {
          header {
            padding: 0.85rem 1rem !important;
          }
          .header-action-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
