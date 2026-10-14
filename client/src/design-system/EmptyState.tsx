import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        maxWidth: '440px',
        margin: '0 auto',
      }}
    >
      {/* Hand-drawn style SVG of ruled ledger diary */}
      <svg
        width="110"
        height="110"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ margin: '0 auto 1.25rem auto', display: 'block' }}
      >
        {/* Soft shadow */}
        <ellipse cx="50" cy="88" rx="35" ry="5" fill="var(--line)" opacity="0.6" />
        
        {/* Diary back cover */}
        <rect x="25" y="18" width="54" height="68" rx="4" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="2" />
        
        {/* Diary front cover open / pages */}
        <rect x="20" y="14" width="54" height="68" rx="4" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
        
        {/* Spine stitches */}
        <line x1="20" y1="26" x2="28" y2="26" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="46" x2="28" y2="46" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="66" x2="28" y2="66" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        
        {/* Ruled lines inside diary */}
        <line x1="32" y1="28" x2="66" y2="28" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="38" x2="66" y2="38" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="48" x2="66" y2="48" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="58" x2="66" y2="58" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Red ribbon bookmark */}
        <path d="M 48 14 L 48 42 L 53 38 L 58 42 L 58 14" fill="var(--danger)" />
        
        {/* Rupee coin resting on corner */}
        <circle cx="70" cy="72" r="10" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="67" y="76" fontSize="11" fontWeight="bold" fill="var(--accent)" fontFamily="sans-serif">₹</text>
      </svg>

      <h4
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--ink)',
          marginBottom: '0.4rem',
        }}
      >
        {title}
      </h4>

      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--ink-muted)',
          lineHeight: 1.5,
          marginBottom: actionLabel ? '1.25rem' : '0',
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
};
