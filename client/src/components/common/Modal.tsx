import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '520px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(30, 42, 36, 0.45)', // Plain warm dim, NO blur
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="paper-card animate-fade-up"
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-card)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-3)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--line)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close dialog"
            style={{ width: '36px', height: '36px', flexShrink: 0 }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
};
