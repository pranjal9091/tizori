import React, { useState } from 'react';
import {
  Coffee,
  TrainTrack,
  Utensils,
  Cookie,
  Droplet,
  ArrowRight,
  Trash2,
  Plus,
  Database,
  CreditCard,
  Sparkles,
  CalendarClock,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { DashboardData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { transactionsApi } from '../../api/endpoints';
import { useToast } from '../../design-system/Toast';
import { Odometer } from '../../design-system/Odometer';
import { DayDots } from '../../design-system/DayDots';
import { SegmentedBar } from '../../design-system/SegmentedBar';

interface PocketDashboardProps {
  data: DashboardData;
  onRefresh: () => void;
  openAddModal: () => void;
  openAffordability: () => void;
  onNavigateTab?: (tab: 'overview' | 'diary' | 'gullak' | 'subscriptions' | 'affordability' | 'database') => void;
  openUpgradeModal?: () => void;
}

export const PocketDashboard: React.FC<PocketDashboardProps> = ({
  data,
  onRefresh,
  openAddModal,
  openAffordability,
  onNavigateTab,
  openUpgradeModal,
}) => {
  const { formatCurrency } = useAuth();
  const { showToast } = useToast();
  const [loggingItem, setLoggingItem] = useState<string | null>(null);

  const { pocket, rule503020, leaks, recentTransactions, user } = data;

  // 1-Tap Quick Logging with 5-Second Undo Toast
  const handleQuickLog = async (title: string, amount: number, category: string, bucket: 'needs' | 'wants') => {
    setLoggingItem(title);
    try {
      const res = await transactionsApi.create({
        title,
        amount,
        category,
        bucket,
      });

      onRefresh();

      const createdId = res.data?._id;
      showToast({
        message: `${title} (${formatCurrency(amount)}) added to your ledger!`,
        duration: 5000,
        onUndo: async () => {
          if (createdId) {
            try {
              await transactionsApi.delete(createdId);
              onRefresh();
            } catch (err) {
              console.error('Failed to undo transaction', err);
            }
          }
        },
      });
    } catch (e) {
      console.error('Quick log failed', e);
    } finally {
      setTimeout(() => setLoggingItem(null), 300);
    }
  };

  // Convert backend leak text to polished, standard English
  const formatLeakEnglish = (title: string, amount: number) => {
    const t = title.toLowerCase();
    if (t.includes('chai') || t.includes('snack')) {
      return `You spent ${formatCurrency(amount)} on coffee, tea, and quick refreshments this month. Daily micro-purchases compound into a noticeable expenditure.`;
    }
    if (t.includes('swiggy') || t.includes('food') || t.includes('zomato')) {
      return `Food delivery and dining out totaled ${formatCurrency(amount)} this month. Preparing meals or batch-cooking can meaningfully extend your daily pocket budget.`;
    }
    if (t.includes('auto') || t.includes('cab') || t.includes('travel')) {
      return `Cab and transit expenses reached ${formatCurrency(amount)}. Utilizing public transit or carpooling where possible can moderate commute costs.`;
    }
    if (t.includes('shopping') || t.includes('impulse') || t.includes('movie')) {
      return `Discretionary shopping and leisure entertainment totaled ${formatCurrency(amount)}. Use the Affordability Calculator before making non-essential purchases.`;
    }
    return `Spending in this category reached ${formatCurrency(amount)} this month. Keep track of micro-expenses to maintain cashflow balance.`;
  };

  // Calculate percentage of monthly budget remaining
  const monthlyBudget = user?.monthlyIncome || 35000;
  const pocketPercent = Math.min(100, Math.max(0, Math.round((pocket.remainingPocketCash / monthlyBudget) * 100)));

  // Top leak item
  const topLeak = leaks && leaks.length > 0 ? leaks[0] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }} className="animate-fade-up">
      {/* =========================================================================
          HERO ELEMENT: DAILY SAFE SPEND (Fraunces Number + Month Dots + Meter)
          ========================================================================= */}
      <section
        className="paper-card"
        style={{
          padding: '2rem 2.25rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.5rem',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--line)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--primary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Daily Budget Guard
        </div>

        <div style={{ maxWidth: '640px' }}>
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--ink-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.35rem',
            }}
          >
            Daily Safe Spend
          </div>

          {/* Hero Fraunces Number */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.8rem, 6vw, 4.2rem)',
              fontWeight: 800,
              color: 'var(--ink)',
              lineHeight: 1.05,
              marginBottom: '0.75rem',
              letterSpacing: '-0.03em',
            }}
          >
            <Odometer value={pocket.dailySafeSpend} prefix="₹" />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.15rem',
                fontWeight: 500,
                color: 'var(--ink-muted)',
                marginLeft: '0.4rem',
              }}
            >
              /day
            </span>
          </div>

          {/* Month Strip Day Dots */}
          <div style={{ marginBottom: '1.25rem' }}>
            <DayDots daysLeft={pocket.daysLeft} />
          </div>

          {/* Horizontal Remaining Pocket Cash Meter */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                fontSize: '0.8125rem',
                marginBottom: '0.4rem',
              }}
            >
              <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                Remaining Monthly Pocket Cash:{' '}
                <span className="mono" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  {formatCurrency(pocket.remainingPocketCash)}
                </span>
              </span>
              <span style={{ color: 'var(--ink-muted)', fontSize: '0.75rem' }} className="mono">
                {pocketPercent}% of {formatCurrency(monthlyBudget)}
              </span>
            </div>

            <div
              style={{
                height: '8px',
                backgroundColor: 'var(--surface-2)',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
                border: '1px solid var(--line)',
                boxShadow: 'var(--shadow-inset)',
              }}
              role="progressbar"
              aria-valuenow={pocketPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                style={{
                  width: `${pocketPercent}%`,
                  height: '100%',
                  backgroundColor: pocketPercent < 20 ? 'var(--danger)' : 'var(--primary)',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          1-TAP QUICK EXPENSE LOG CHIPS
          ========================================================================= */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>
              1-Tap Quick Expense Log
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
              (Tap to record frequent micro-transactions instantly)
            </span>
          </div>

          <button
            onClick={openAddModal}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', minHeight: '32px' }}
          >
            <Plus size={13} strokeWidth={2} />
            <span>Custom</span>
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'none',
          }}
        >
          {/* Chip 1: Coffee & Tea */}
          <button
            onClick={() => handleQuickLog('Coffee & Tea', 30, 'Food & Drinks', 'wants')}
            className="chip"
            disabled={loggingItem === 'Coffee & Tea'}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-pill)',
              flexShrink: 0,
            }}
          >
            <Coffee size={15} color="var(--accent)" strokeWidth={1.8} />
            <span>Coffee & Tea</span>
            <span className="mono" style={{ color: 'var(--accent)', fontWeight: 700 }}>₹30</span>
          </button>

          {/* Chip 2: Transit */}
          <button
            onClick={() => handleQuickLog('Metro / Transit Commute', 50, 'Travel & Commute', 'needs')}
            className="chip"
            disabled={loggingItem === 'Metro / Transit Commute'}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-pill)',
              flexShrink: 0,
            }}
          >
            <TrainTrack size={15} color="var(--primary)" strokeWidth={1.8} />
            <span>Metro / Transit</span>
            <span className="mono" style={{ color: 'var(--primary)', fontWeight: 700 }}>₹50</span>
          </button>

          {/* Chip 3: Food Delivery */}
          <button
            onClick={() => handleQuickLog('Food Delivery Order', 280, 'Food & Dining', 'wants')}
            className="chip"
            disabled={loggingItem === 'Food Delivery Order'}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-pill)',
              flexShrink: 0,
            }}
          >
            <Utensils size={15} color="var(--danger)" strokeWidth={1.8} />
            <span>Food Delivery</span>
            <span className="mono" style={{ color: 'var(--danger)', fontWeight: 700 }}>₹280</span>
          </button>

          {/* Chip 4: Groceries & Snacks */}
          <button
            onClick={() => handleQuickLog('Groceries & Snacks', 150, 'Groceries', 'needs')}
            className="chip"
            disabled={loggingItem === 'Groceries & Snacks'}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-pill)',
              flexShrink: 0,
            }}
          >
            <Cookie size={15} color="var(--cat-bachat)" strokeWidth={1.8} />
            <span>Snacks & Essentials</span>
            <span className="mono" style={{ color: 'var(--cat-bachat)', fontWeight: 700 }}>₹150</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          2-COLUMN ASYMMETRIC GRID: 50-30-20 BUDGET BAR + LEAK TEASER
          ========================================================================= */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Card A: 50-30-20 Unified Segmented Bar */}
        <div className="paper-card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>
              50-30-20 Budget Balance
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
              Needs (50%) • Wants (30%) • Savings (20%)
            </p>
          </div>

          <SegmentedBar
            needs={rule503020.needs}
            wants={rule503020.wants}
            savings={rule503020.savings}
          />
        </div>

        {/* Card B: Spending Leak Detector Teaser Card */}
        <div
          className="paper-card"
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderLeft: topLeak ? '4px solid var(--accent)' : '1px solid var(--line)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Droplet size={17} color="var(--accent)" strokeWidth={2} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>
                  Spending Leak Detector
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                Micro-Leak Alert
              </span>
            </div>

            {topLeak ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)' }}>
                    {topLeak.title}
                  </span>
                  <span className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--danger)' }}>
                    {formatCurrency(topLeak.amount)}
                  </span>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                  {formatLeakEnglish(topLeak.title, topLeak.amount)}
                </p>

                {/* Annualized Projection */}
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--surface-2)',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--line)',
                    fontSize: '0.75rem',
                    color: 'var(--ink)',
                  }}
                >
                  💡 <strong>Annualized Projection:</strong> At this current rate, this category could total approximately{' '}
                  <strong className="mono" style={{ color: 'var(--danger)' }}>
                    {formatCurrency(topLeak.amount * 12)}
                  </strong>{' '}
                  in discretionary spending over the course of a year.
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--primary)', fontSize: '0.875rem' }}>
                ✓ Everything looks balanced! No significant spending leaks detected this month.
              </div>
            )}
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={openAffordability}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', gap: '0.35rem' }}
            >
              <span>Affordability Check</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTEGRATED CAPABILITIES: DATABASE & PAYMENT GATEWAY QUICK ACCESS HUB
          ========================================================================= */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* CARD 1: DATABASE ENGINE & CLOUD SYNC */}
        <div
          className="paper-card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Database size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    Database & Cloud Sync
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                    MongoDB Active Engine
                  </span>
                </div>
              </div>
              <span
                className="badge badge-success"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.725rem',
                  padding: '0.2rem 0.6rem',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'currentColor',
                  }}
                />
                Live Engine (0ms)
              </span>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, margin: 0, marginBottom: '1.25rem' }}>
              Live persistent database connection with real-time latency ping. Connect your personal MongoDB Atlas cluster, export full JSON snapshots, or download ledger CSVs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--line)', paddingTop: '0.85rem' }}>
            <button
              onClick={() => onNavigateTab?.('database')}
              className="btn btn-secondary btn-sm"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
              }}
            >
              <Activity size={13} color="var(--primary)" />
              <span>Database Studio & Atlas</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* CARD 2: PAYMENT GATEWAY & DIRECT VAULT FUNDING */}
        <div
          className="paper-card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--cat-bachat-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--cat-bachat)',
                  }}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    Payment Gateway Hub
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                    UPI • Cards • NetBanking
                  </span>
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.725rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={12} color="var(--primary)" />
                <span>RBI Compliant</span>
              </span>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, margin: 0, marginBottom: '1.25rem' }}>
              Directly deposit funds into Goal Vaults via Instant UPI (GPay/PhonePe) or Cards with 256-bit encrypted receipts, track recurring subscription bills, or access Pro Paywall.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--line)', paddingTop: '0.85rem' }}>
            <button
              onClick={() => onNavigateTab?.('gullak')}
              className="btn btn-secondary btn-sm"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
              }}
              title="Deposit funds into savings vaults via payment gateway"
            >
              <CreditCard size={13} color="var(--cat-bachat)" />
              <span>Fund Vault</span>
            </button>
            <button
              onClick={() => onNavigateTab?.('subscriptions')}
              className="btn btn-secondary btn-sm"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
              }}
              title="View recurring monthly commitments & bill payments"
            >
              <CalendarClock size={13} color="var(--accent)" />
              <span>Bills</span>
            </button>
            {openUpgradeModal && (
              <button
                onClick={openUpgradeModal}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                }}
                title="Unlock Pro tier with multi-method payment checkout"
              >
                <Sparkles size={13} />
                <span>Pro Paywall</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          RECENT TRANSACTIONS (Ruled Ledger Format)
          ========================================================================= */}
      <section className="paper-card ruled" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)' }}>
              Recent Transactions
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
              Latest ledger entries and automated 50-30-20 category breakdown
            </p>
          </div>

          <button onClick={openAddModal} className="btn btn-secondary btn-sm">
            <Plus size={14} />
            <span>Add Expense</span>
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
            No transactions recorded yet. Use the 1-tap quick log chips above to record an expense.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentTransactions.map((tx, idx) => {
              const isSavings = tx.type.includes('gullak');
              return (
                <div
                  key={tx._id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Category Margin Tab */}
                    <div
                      style={{
                        width: '4px',
                        height: '24px',
                        borderRadius: '2px',
                        backgroundColor:
                          tx.bucket === 'needs'
                            ? 'var(--cat-needs)'
                            : tx.bucket === 'savings'
                            ? 'var(--cat-bachat)'
                            : 'var(--cat-wants)',
                      }}
                    />

                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>
                        {tx.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                        {tx.category} • <span className="mono">{new Date(tx.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: isSavings ? 'var(--cat-bachat)' : 'var(--ink)',
                      }}
                    >
                      {isSavings ? '+ ' : '- '}{formatCurrency(tx.amount)}
                    </span>

                    <button
                      onClick={async () => {
                        await transactionsApi.delete(tx._id);
                        onRefresh();
                        showToast({ message: 'Entry removed from ledger.' });
                      }}
                      className="btn-icon"
                      aria-label="Delete entry"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
