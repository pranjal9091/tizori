import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { Transaction } from '../../types';
import { transactionsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../design-system/Toast';
import { EmptyState } from '../../design-system/EmptyState';

interface ExpenseDiaryViewProps {
  transactions: Transaction[];
  onRefresh: () => void;
  openAddModal: () => void;
}

export const ExpenseDiaryView: React.FC<ExpenseDiaryViewProps> = ({
  transactions,
  onRefresh,
  openAddModal,
}) => {
  const { formatCurrency } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('');

  // Filtering
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (selectedBucket && t.bucket !== selectedBucket) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q)) || t.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [transactions, selectedBucket, search]);

  // Group transactions by date for the ruled ledger book feel
  const groupedByDay = useMemo(() => {
    const groups: { [dateStr: string]: { date: string; items: Transaction[]; dayTotal: number } } = {};

    filtered.forEach(tx => {
      const d = new Date(tx.date);
      const key = d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      if (!groups[key]) {
        groups[key] = { date: key, items: [], dayTotal: 0 };
      }
      groups[key].items.push(tx);
      if (tx.type === 'expense') {
        groups[key].dayTotal += tx.amount;
      }
    });

    return Object.values(groups);
  }, [filtered]);

  const handleDelete = async (id: string, title: string, amount: number) => {
    try {
      await transactionsApi.delete(id);
      onRefresh();
      showToast({
        message: `${title} (${formatCurrency(amount)}) removed from ledger.`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-up" style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}
          >
            Expense Ledger
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>
            Comprehensive journal of daily transactions with automated 50-30-20 budget allocation
          </p>
        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} strokeWidth={2} />
          <span>+ Log Expense</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="paper-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search
            size={16}
            color="var(--ink-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            className="form-input"
            style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.875rem' }}
            placeholder="Search coffee, transit, dining, bills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflowX: 'auto' }}>
          <button
            onClick={() => setSelectedBucket('')}
            className={`chip ${selectedBucket === '' ? 'active' : ''}`}
            style={{ height: '36px', fontSize: '0.75rem' }}
          >
            All Transactions
          </button>
          <button
            onClick={() => setSelectedBucket('needs')}
            className={`chip ${selectedBucket === 'needs' ? 'active' : ''}`}
            style={{ height: '36px', fontSize: '0.75rem' }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cat-needs)' }} />
            Needs (50%)
          </button>
          <button
            onClick={() => setSelectedBucket('wants')}
            className={`chip ${selectedBucket === 'wants' ? 'active' : ''}`}
            style={{ height: '36px', fontSize: '0.75rem' }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cat-wants)' }} />
            Wants (30%)
          </button>
          <button
            onClick={() => setSelectedBucket('savings')}
            className={`chip ${selectedBucket === 'savings' ? 'active' : ''}`}
            style={{ height: '36px', fontSize: '0.75rem' }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cat-bachat)' }} />
            Savings (20%)
          </button>
        </div>
      </div>

      {/* Ruled Paper Ledger Book */}
      {filtered.length === 0 ? (
        <div className="paper-card" style={{ padding: '2rem 1rem' }}>
          <EmptyState
            title="Expense Ledger is Empty"
            description="No transactions match your current search or filter criteria. Log an expense to keep your accounts up to date."
            actionLabel="+ Log Expense"
            onAction={openAddModal}
          />
        </div>
      ) : (
        <div
          className="paper-card ruled"
          style={{
            padding: 0,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-2)',
          }}
        >
          {groupedByDay.map(group => (
            <div key={group.date} style={{ borderBottom: '1px solid var(--line)' }}>
              {/* Sticky Ruled Date Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 1.25rem',
                  backgroundColor: 'var(--surface-2)',
                  borderBottom: '1px solid var(--line)',
                  position: 'sticky',
                  top: '64px',
                  zIndex: 10,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: '0.78125rem',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {group.date}
                </span>

                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--ink-muted)',
                  }}
                >
                  Daily Total:{' '}
                  <strong className="mono" style={{ color: 'var(--ink)', fontWeight: 700 }}>
                    {formatCurrency(group.dayTotal)}
                  </strong>
                </span>
              </div>

              {/* Transactions in Date Group */}
              <div>
                {group.items.map((tx, idx) => {
                  const isSavings = tx.type.includes('gullak');
                  const categoryColor =
                    tx.bucket === 'needs'
                      ? 'var(--cat-needs)'
                      : tx.bucket === 'savings'
                      ? 'var(--cat-bachat)'
                      : 'var(--cat-wants)';

                  return (
                    <div
                      key={tx._id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.25rem',
                        borderBottom: '1px solid var(--line-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="ledger-row"
                    >
                      {/* Left side: margin tab + details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                        {/* Colored Margin Tab */}
                        <div
                          style={{
                            width: '4px',
                            height: '28px',
                            borderRadius: '2px',
                            backgroundColor: categoryColor,
                            flexShrink: 0,
                          }}
                          title={`Category Bucket: ${tx.bucket}`}
                        />

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.9375rem',
                              fontWeight: 600,
                              color: 'var(--ink)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {tx.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--ink-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: '2px',
                            }}
                          >
                            <span>{tx.category}</span>
                            {tx.notes && <span>• {tx.notes}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right side: bucket badge + tabular amount + delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor:
                              tx.bucket === 'needs'
                                ? 'var(--cat-needs-soft)'
                                : tx.bucket === 'savings'
                                ? 'var(--cat-bachat-soft)'
                                : 'var(--cat-wants-soft)',
                            color: categoryColor,
                            textTransform: 'uppercase',
                          }}
                        >
                          {tx.bucket}
                        </span>

                        <span
                          className="mono"
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            minWidth: '90px',
                            textAlign: 'right',
                            color: isSavings ? 'var(--cat-bachat)' : 'var(--ink)',
                          }}
                        >
                          {isSavings ? '+ ' : '- '}{formatCurrency(tx.amount)}
                        </span>

                        <button
                          onClick={() => handleDelete(tx._id, tx.title, tx.amount)}
                          className="btn-icon"
                          aria-label={`Delete ${tx.title}`}
                          style={{ width: '32px', height: '32px' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .ledger-row:hover {
          background-color: var(--surface-2) !important;
        }
      `}</style>
    </div>
  );
};
