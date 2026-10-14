import React from 'react';

export type StampVerdict = 'DONT_BUY' | 'WAIT_A_BIT' | 'SAFE_TO_BUY';

interface RubberStampProps {
  verdict: StampVerdict;
  subtext?: string;
}

export const RubberStamp: React.FC<RubberStampProps> = ({ verdict, subtext }) => {
  let label = "SAFE TO BUY";
  let color = "var(--success)";
  let borderColor = "var(--success)";
  let icon = "✓";

  if (verdict === 'DONT_BUY') {
    label = "DON'T BUY";
    color = "var(--danger)";
    borderColor = "var(--danger)";
    icon = "✕";
  } else if (verdict === 'WAIT_A_BIT') {
    label = "WAIT A BIT";
    color = "var(--accent)";
    borderColor = "var(--accent)";
    icon = "⏳";
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.65rem 1.4rem',
        border: `3px double ${borderColor}`,
        borderRadius: '8px',
        color: color,
        transform: 'rotate(-2.5deg)',
        animation: 'stampThump 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
        boxShadow: 'var(--shadow-stamp)',
        filter: 'url(#rough-stamp)',
        userSelect: 'none',
        background: 'rgba(255, 255, 255, 0.03)',
      }}
      role="status"
      aria-label={`Verdict: ${label}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: 'var(--font-display)',
          fontSize: '1.45rem',
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <span>{label}</span>
      </div>

      {subtext && (
        <span
          style={{
            fontSize: '0.6875rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginTop: '3px',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          {subtext}
        </span>
      )}
    </div>
  );
};
