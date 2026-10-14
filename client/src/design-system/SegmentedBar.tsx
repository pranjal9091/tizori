import React from 'react';

interface SegmentedBarProps {
  needs: { target: number; spent: number; percent: number };
  wants: { target: number; spent: number; percent: number };
  savings: { target: number; saved: number; percent: number };
}

export const SegmentedBar: React.FC<SegmentedBarProps> = ({
  needs,
  wants,
  savings,
}) => {
  const totalTarget = needs.target + wants.target + savings.target;
  const isWantsOverspent = wants.spent > wants.target;

  // Compute width percentages relative to total monthly target
  const needsWidth = totalTarget > 0 ? Math.min(60, (needs.spent / totalTarget) * 100) : 0;
  const wantsWidth = totalTarget > 0 ? Math.min(50, (wants.spent / totalTarget) * 100) : 0;
  const savingsWidth = totalTarget > 0 ? Math.min(30, (savings.saved / totalTarget) * 100) : 0;

  return (
    <div style={{ width: '100%' }}>
      {/* Target Tick Marker Track */}
      <div style={{ position: 'relative', height: '22px', marginBottom: '4px' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--ink-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span>50% Target</span>
          <div style={{ width: '1px', height: '6px', background: 'var(--ink-muted)', marginTop: '2px' }} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: '80%',
            transform: 'translateX(-50%)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--ink-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span>80% (+Wants)</span>
          <div style={{ width: '1px', height: '6px', background: 'var(--ink-muted)', marginTop: '2px' }} />
        </div>
      </div>

      {/* Main Single Segmented Bar */}
      <div
        style={{
          position: 'relative',
          height: '24px',
          backgroundColor: 'var(--surface-2)',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          display: 'flex',
          boxShadow: 'var(--shadow-inset)',
        }}
      >
        {/* Needs segment */}
        <div
          style={{
            width: `${needsWidth}%`,
            backgroundColor: 'var(--cat-needs)',
            height: '100%',
            transition: 'width 0.4s ease',
          }}
          title={`Needs: ₹${needs.spent} / ₹${needs.target} (${needs.percent}%)`}
        />

        {/* Wants segment */}
        <div
          style={{
            width: `${wantsWidth}%`,
            backgroundColor: isWantsOverspent ? 'var(--danger)' : 'var(--cat-wants)',
            backgroundImage: isWantsOverspent
              ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255, 255, 255, 0.25) 5px, rgba(255, 255, 255, 0.25) 10px)'
              : 'none',
            height: '100%',
            transition: 'width 0.4s ease',
          }}
          title={`Wants: ₹${wants.spent} / ₹${wants.target} (${wants.percent}%)`}
        />

        {/* Savings segment */}
        <div
          style={{
            width: `${savingsWidth}%`,
            backgroundColor: 'var(--cat-bachat)',
            height: '100%',
            transition: 'width 0.4s ease',
          }}
          title={`Savings: ₹${savings.saved} / ₹${savings.target} (${savings.percent}%)`}
        />

        {/* Vertical Tick Guide Lines */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'var(--surface)',
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '80%',
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'var(--surface)',
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Overspend warning if wants > 30% */}
      {isWantsOverspent && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '0.65rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-input)',
            backgroundColor: 'var(--danger-soft)',
            border: '1px solid var(--danger)',
            fontSize: '0.8125rem',
            color: 'var(--danger)',
            fontWeight: 600,
          }}
        >
          <span>⚠️</span>
          <span>
            Wants allocation has exceeded the 30% benchmark (₹{wants.spent.toLocaleString('en-IN')})! Consider moderating dining and leisure expenses.
          </span>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginTop: '1rem',
          fontSize: '0.8125rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--cat-needs)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Needs (50%)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }} className="mono">
              ₹{needs.spent.toLocaleString('en-IN')} / ₹{needs.target.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: isWantsOverspent ? 'var(--danger)' : 'var(--cat-wants)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, color: isWantsOverspent ? 'var(--danger)' : 'var(--ink)' }}>
              Wants (30%){isWantsOverspent ? ' ⚠️' : ''}
            </div>
            <div style={{ fontSize: '0.75rem', color: isWantsOverspent ? 'var(--danger)' : 'var(--ink-muted)' }} className="mono">
              ₹{wants.spent.toLocaleString('en-IN')} / ₹{wants.target.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--cat-bachat)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Savings (20%)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }} className="mono">
              ₹{savings.saved.toLocaleString('en-IN')} / ₹{savings.target.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
