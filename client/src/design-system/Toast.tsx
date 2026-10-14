import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Undo2, X, CheckCircle2 } from 'lucide-react';

interface ToastOptions {
  message: string;
  onUndo?: () => void;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = Date.now();
    setToast({ ...options, id });

    const dur = options.duration || 5000;
    timerRef.current = setTimeout(() => {
      setToast(null);
    }, dur);
  }, []);

  const handleUndo = () => {
    if (toast?.onUndo) {
      toast.onUndo();
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  };

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: 'var(--surface)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-card)',
            padding: '0.75rem 1.15rem',
            boxShadow: 'var(--shadow-3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            maxWidth: '380px',
            animation: 'fadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={18} color="var(--primary)" strokeWidth={2} />
          
          <span style={{ fontSize: '0.875rem', fontWeight: 600, flex: 1, color: 'var(--ink)' }}>
            {toast.message}
          </span>

          {toast.onUndo && (
            <button
              onClick={handleUndo}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.75rem',
                minHeight: '30px',
                gap: '0.3rem',
                color: 'var(--accent)',
                borderColor: 'var(--accent-soft)',
              }}
            >
              <Undo2 size={13} />
              <span>Undo</span>
            </button>
          )}

          <button
            onClick={handleClose}
            aria-label="Dismiss"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-muted)',
              display: 'flex',
              padding: '2px',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
