import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../design-system/ThemeToggle';
import { authApi } from '../../api/endpoints';

// Declare Google Identity Services global type
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle';
              logo_alignment?: 'left' | 'center';
              width?: number;
            }
          ) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

export const AuthView: React.FC = () => {
  const { login, register, demoLogin, googleLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('35000');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  // Google OAuth Config State
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return (
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '465354863440-31btd6i1fvr45uvug7skt1ucqv1h9okd.apps.googleusercontent.com'
    );
  });
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Rotating inspiring financial habit quotes in standard English
  const quotes = [
    'Small, disciplined daily habits compound into meaningful financial freedom.',
    'Know your daily safe allowance so the final week of the month is completely stress-free.',
    'A savings vault is the foundational first step toward personal financial independence.',
    'Evaluate before you buy: measure impulse desires against your true daily cashflow.',
  ];
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % quotes.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [quotes.length]);

  // Fetch backend Google configuration if available
  useEffect(() => {
    authApi
      .getConfig()
      .then(res => {
        if (res.data?.googleClientId) {
          setGoogleClientId(res.data.googleClientId);
        }
      })
      .catch(() => {});
  }, []);

  // Google Credential Callback
  const handleGoogleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      if (!response.credential) return;
      setError('');
      setGoogleLoading(true);

      try {
        await googleLogin(response.credential);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Google authentication failed.';
        setError(msg);
      } finally {
        setGoogleLoading(false);
      }
    },
    [googleLogin]
  );

  // Initialize and Render Google Identity Button
  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: isRegister ? 'signup_with' : 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 350,
            });
          }
        } catch (e) {
          console.warn('Google Identity initialization notice:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [googleClientId, isRegister, handleGoogleCredentialResponse]);

  const handleManualGoogleClick = () => {
    if (!googleClientId) {
      setError('Google Sign-In service is currently waiting for Google Client ID configuration. You can sign in directly with Email & Password or Demo Account.');
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const localPart = cleanEmail.split('@')[0];
    if (!cleanEmail || !emailRegex.test(cleanEmail) || localPart.length < 2) {
      setError('Please provide a legitimate, valid email address (e.g. yourname@gmail.com).');
      return;
    }

    if (isRegister) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please ensure both passwords are identical.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          monthlyIncome: parseFloat(monthlyIncome) || 35000,
        });
      } else {
        await login({ email: email.trim(), password });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await demoLogin();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch demo account.';
      setError(msg);
    } finally {
      setDemoLoading(false);
    }
  };

  const isPasswordMatching = confirmPassword.length > 0 && password === confirmPassword;
  const isPasswordMismatched = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--bg)',
        position: 'relative',
      }}
    >
      {/* Top right theme toggle */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 50 }}>
        <ThemeToggle />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          width: '100%',
          minHeight: '100vh',
        }}
      >
        {/* =========================================================================
            LEFT EDITORIAL PANEL: WARM ATMOSPHERE + FINANCIAL WISDOM
            ========================================================================= */}
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            borderRight: '1px solid var(--line)',
            padding: '3rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Brand header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-contrast)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 11V9a7 7 0 0 0-14 0v2a5 5 0 0 0 0 10h14a5 5 0 0 0 0-10Z" />
                  <circle cx="12" cy="14" r="2.5" />
                  <path d="M12 9v1" />
                </svg>
              </div>

              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  PocketPaisa
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'block' }}>
                  Personal Money Coach
                </span>
              </div>
            </div>

            {/* Main Editorial Value Proposition */}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 800,
                color: 'var(--ink)',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: '1rem',
              }}
            >
              Money-Habit Coach for Students & Young Pros
            </h1>

            <p style={{ fontSize: '1rem', color: 'var(--ink-muted)', lineHeight: 1.6, maxWidth: '440px' }}>
              Real-time daily safe allowances, 1-tap ledger logging, impulse purchase checking, and disciplined goal-based savings.
            </p>
          </div>

          {/* Rotating Quote Card */}
          <div
            className="paper-card"
            style={{
              marginTop: '3rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
              }}
            >
              Financial Habit Principle
            </div>
            <p
              style={{
                fontSize: '0.9375rem',
                fontStyle: 'italic',
                color: 'var(--ink)',
                lineHeight: 1.5,
                minHeight: '44px',
                transition: 'opacity 0.3s ease',
              }}
            >
              "{quotes[quoteIdx]}"
            </p>
          </div>

          {/* Footer note */}
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '2rem' }}>
            Designed for everyday personal cashflow realities • Clear, intuitive, and disciplined
          </div>
        </div>

        {/* =========================================================================
            RIGHT FORM PANEL: GOOGLE OAUTH + EMAIL AUTH + 1-TAP DEMO
            ========================================================================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 2rem',
          }}
        >
          <div style={{ maxWidth: '440px', width: '100%' }}>
            {/* 1-Tap Recruiter Demo Launcher */}
            <div
              className="paper-card"
              style={{
                padding: '1.15rem 1.25rem',
                marginBottom: '1.25rem',
                backgroundColor: 'var(--surface)',
                border: '2px solid var(--accent)',
                boxShadow: 'var(--shadow-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={15} />
                  <span>Recruiter / Portfolio Demo</span>
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  1-CLICK DEMO
                </span>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                Instant live session pre-seeded with a ₹35,000 allowance, goal vaults, and ledger entries.
              </p>

              <button
                type="button"
                onClick={handleDemoSignIn}
                className="btn btn-accent"
                disabled={demoLoading}
                style={{ width: '100%', fontSize: '0.875rem', padding: '0.7rem' }}
              >
                <span>{demoLoading ? 'Starting Live Demo...' : 'Launch Live Demo (1-Click)'}</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Auth Form Card */}
            <div className="paper-card" style={{ padding: '1.75rem' }}>
              {/* Tab Toggle (Sign In vs Create Account) */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: !isRegister ? '2px solid var(--primary)' : '2px solid transparent',
                    color: !isRegister ? 'var(--ink)' : 'var(--ink-muted)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isRegister ? '2px solid var(--primary)' : '2px solid transparent',
                    color: isRegister ? 'var(--ink)' : 'var(--ink-muted)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Create Account
                </button>
              </div>

              {/* REAL GOOGLE SIGN-IN SECTION */}
              <div style={{ marginBottom: '1.25rem' }}>
                {/* Official Google Button Render Container */}
                <div
                  ref={googleBtnRef}
                  style={{
                    display: googleClientId ? 'flex' : 'none',
                    justifyContent: 'center',
                    minHeight: '44px',
                    width: '100%',
                  }}
                />

                {/* Branded Google Sign-In Fallback Button */}
                {(!googleClientId || !window.google?.accounts?.id) && (
                  <button
                    type="button"
                    onClick={handleManualGoogleClick}
                    disabled={googleLoading}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.65rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                    }}
                  >
                    {/* Google 4-Color G Logo SVG */}
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>
                      {googleLoading
                        ? 'Connecting to Google...'
                        : isRegister
                        ? 'Sign up with Google (Gmail)'
                        : 'Continue with Google (Gmail)'}
                    </span>
                  </button>
                )}



                {/* Or Divider */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    margin: '1.25rem 0 1rem 0',
                    color: 'var(--ink-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--line)' }} />
                  <span>or continue with email</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--line)' }} />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '0.65rem 0.9rem',
                    borderRadius: 'var(--radius-input)',
                    backgroundColor: 'var(--danger-soft)',
                    border: '1px solid var(--danger)',
                    color: 'var(--danger)',
                    fontSize: '0.8125rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>{error}</span>
                    {error.toLowerCase().includes('already exists') && isRegister && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegister(false);
                          setError('');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontSize: '0.75rem',
                        }}
                      >
                        Sign In with this email →
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {isRegister && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <UserIcon size={16} color="var(--ink-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        className="form-input"
                        style={{ paddingLeft: '2.4rem' }}
                        placeholder="e.g. Aman Verma"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--ink-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '2.4rem' }}
                      placeholder="aman.verma@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* FIELD 1: SET PASSWORD */}
                <div className="form-group">
                  <label className="form-label">
                    {isRegister ? 'Set Password' : 'Password'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--ink-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {isRegister && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)', marginTop: '3px' }}>
                      Must be at least 6 characters
                    </div>
                  )}
                </div>

                {/* FIELD 2: CONFIRM PASSWORD (ONLY IN CREATE ACCOUNT MODE) */}
                {isRegister && (
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        Confirm Password
                      </label>
                      {isPasswordMatching && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                          <CheckCircle2 size={13} />
                          <span>Passwords match</span>
                        </span>
                      )}
                      {isPasswordMismatched && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                          <AlertCircle size={13} />
                          <span>Passwords do not match</span>
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color={isPasswordMismatched ? 'var(--danger)' : 'var(--ink-muted)'} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input"
                        style={{
                          paddingLeft: '2.4rem',
                          paddingRight: '2.5rem',
                          borderColor: isPasswordMismatched ? 'var(--danger)' : isPasswordMatching ? 'var(--primary)' : undefined,
                        }}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {isRegister && (
                  <div className="form-group">
                    <label className="form-label">Monthly Pocket Allowance / Income (₹)</label>
                    <input
                      type="number"
                      className="form-input mono"
                      placeholder="35000"
                      value={monthlyIncome}
                      onChange={e => setMonthlyIncome(e.target.value)}
                      required
                      min="1"
                      step="any"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || (isRegister && isPasswordMismatched)}
                  style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
                >
                  {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
