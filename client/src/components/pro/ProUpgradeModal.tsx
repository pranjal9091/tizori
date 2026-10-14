import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Zap,
  PiggyBank,
  CalendarClock,
  CreditCard,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { paymentsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgradeSuccess,
}) => {
  const { user, refreshUser, formatCurrency } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [paymentTab, setPaymentTab] = useState<'upi' | 'card' | 'sandbox'>('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);

  const isAlreadyPro = user?.tier === 'pro';
  const planPrice = billingCycle === 'annual' ? 499 : 99;

  const proFeatures = [
    { title: 'Unlimited Goal Savings Vaults', desc: 'Create and track as many goal vaults as you need without standard tier limits.', icon: PiggyBank },
    { title: 'Unlimited Recurring Subscriptions', desc: 'Manage unlimited recurring bills, Netflix, Spotify, gym, and Wi-Fi commitments.', icon: CalendarClock },
    { title: 'Micro-Spending Leak Diagnostics', desc: 'Automated pattern recognition detects high-frequency small expenses that drain savings.', icon: Zap },
    { title: 'Database Cloud Backup & Portability', desc: 'Full JSON & CSV ledger exports and connection to personal MongoDB Atlas clusters.', icon: Database },
  ];

  const handleCopyVpa = () => {
    navigator.clipboard.writeText('pocketpaisa@upi');
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleSandboxPayment = async () => {
    setLoading(true);
    setError('');
    setStatusMsg('Authorizing payment token...');

    try {
      const res = await paymentsApi.confirmSandbox(billingCycle);
      if (res.success) {
        setStatusMsg('PocketPaisa Pro activated successfully!');
        confetti({
          particleCount: 80,
          spread: 70,
          colors: ['#D98324', '#2F5D50', '#FFFBF3', '#C4513B'],
          origin: { y: 0.6 },
        });

        await refreshUser();
        setTimeout(() => {
          onUpgradeSuccess();
          onClose();
          setStatusMsg('');
        }, 1200);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Payment confirmation failed.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    setLoading(true);
    setError('');
    setStatusMsg('Initializing Razorpay secure gateway...');

    try {
      const orderRes = await paymentsApi.createRazorpayOrder({ planType: billingCycle });

      const razorpayClass = (window as any).Razorpay;
      if (!razorpayClass) {
        handleSandboxPayment();
        return;
      }

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: 'PocketPaisa',
        description: `PocketPaisa Pro ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Membership`,
        order_id: orderRes.orderId.startsWith('order_sandbox') ? undefined : orderRes.orderId,
        handler: async function (response: any) {
          setStatusMsg('Verifying payment signature with bank...');
          try {
            const verifyRes = await paymentsApi.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id || orderRes.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planType: billingCycle,
            });
            if (verifyRes.success) {
              setStatusMsg('PocketPaisa Pro activated successfully!');
              confetti({
                particleCount: 80,
                spread: 70,
                colors: ['#D98324', '#2F5D50', '#FFFBF3', '#C4513B'],
                origin: { y: 0.6 },
              });
              await refreshUser();
              setTimeout(() => {
                onUpgradeSuccess();
                onClose();
                setStatusMsg('');
              }, 1200);
            }
          } catch {
            setError('Payment verification failed.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#2D5A27',
        },
      };

      const rzp = new razorpayClass(options);
      rzp.on('payment.failed', function (resp: any) {
        setError(`Payment failed: ${resp.error?.description || 'Gateway transaction declined'}`);
      });
      rzp.open();
    } catch {
      handleSandboxPayment();
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError('');
    setStatusMsg('Creating Stripe Checkout session...');

    try {
      const res = await paymentsApi.checkout(billingCycle, false);
      if (res.mode === 'stripe' && res.url) {
        window.location.href = res.url;
      } else {
        handleSandboxPayment();
      }
    } catch {
      handleSandboxPayment();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAlreadyPro ? 'PocketPaisa Pro Active' : 'PocketPaisa Pro Membership'}
      subtitle={
        isAlreadyPro
          ? 'You have unrestricted access to all Pro coaching and database features.'
          : 'Unlock unlimited goal vaults, recurring subscriptions, and custom database sync.'
      }
      maxWidth="580px"
    >
      <div>
        {error && (
          <div
            style={{
              padding: '0.65rem 0.9rem',
              borderRadius: 'var(--radius-input)',
              backgroundColor: 'var(--danger-soft)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {statusMsg && (
          <div
            style={{
              padding: '0.65rem 0.9rem',
              borderRadius: 'var(--radius-input)',
              backgroundColor: 'var(--primary-soft)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{statusMsg}</span>
          </div>
        )}

        {isAlreadyPro ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                color: 'var(--accent)',
              }}
            >
              <Sparkles size={26} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.35rem' }}>
              PocketPaisa Pro is Active
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
              You have unrestricted access to unlimited goal vaults, unlimited recurring subscriptions, database cloud backup, and micro-leakage diagnostics.
            </p>
          </div>
        ) : (
          <>
            {/* 2-Plan Toggle Switch */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.25rem 0 1.25rem 0' }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'var(--surface-2)',
                  padding: '3px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--line)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  style={{
                    padding: '0.45rem 1.15rem',
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: billingCycle === 'monthly' ? 'var(--surface)' : 'transparent',
                    color: billingCycle === 'monthly' ? 'var(--ink)' : 'var(--ink-muted)',
                    boxShadow: billingCycle === 'monthly' ? 'var(--shadow-1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Monthly ({formatCurrency(99)}/mo)
                </button>

                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  style={{
                    padding: '0.45rem 1.15rem',
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: billingCycle === 'annual' ? 'var(--primary)' : 'transparent',
                    color: billingCycle === 'annual' ? 'var(--primary-contrast)' : 'var(--ink-muted)',
                    boxShadow: billingCycle === 'annual' ? 'var(--shadow-1)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>Annual ({formatCurrency(499)}/yr)</span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: billingCycle === 'annual' ? 'var(--accent)' : 'var(--accent-soft)',
                      color: billingCycle === 'annual' ? 'var(--accent-contrast)' : 'var(--accent)',
                    }}
                  >
                    Save 58%
                  </span>
                </button>
              </div>
            </div>

            {/* Benefit Checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {proFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'var(--surface-2)',
                      borderRadius: 'var(--radius-input)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--primary-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: 'var(--primary)',
                      }}
                    >
                      <Icon size={15} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>
                        {feat.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                        {feat.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Gateway Method Tabs */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Select Checkout Gateway:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentTab('upi')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-input)',
                    border: paymentTab === 'upi' ? '2px solid var(--primary)' : '1px solid var(--line)',
                    backgroundColor: paymentTab === 'upi' ? 'var(--primary-soft)' : 'var(--surface-2)',
                    color: paymentTab === 'upi' ? 'var(--primary)' : 'var(--ink)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <QrCode size={15} />
                  <span>Instant UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('card')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-input)',
                    border: paymentTab === 'card' ? '2px solid var(--primary)' : '1px solid var(--line)',
                    backgroundColor: paymentTab === 'card' ? 'var(--primary-soft)' : 'var(--surface-2)',
                    color: paymentTab === 'card' ? 'var(--primary)' : 'var(--ink)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <CreditCard size={15} />
                  <span>Stripe Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('sandbox')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-input)',
                    border: paymentTab === 'sandbox' ? '2px solid var(--primary)' : '1px solid var(--line)',
                    backgroundColor: paymentTab === 'sandbox' ? 'var(--primary-soft)' : 'var(--surface-2)',
                    color: paymentTab === 'sandbox' ? 'var(--primary)' : 'var(--ink)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={15} />
                  <span>1-Click Test</span>
                </button>
              </div>

              {/* TAB 1: UPI CHECKOUT */}
              {paymentTab === 'upi' && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--surface-2)',
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid var(--line)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      backgroundColor: '#ffffff',
                      padding: '6px',
                      borderRadius: '10px',
                      margin: '0 auto 0.65rem auto',
                      boxShadow: 'var(--shadow-1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="108" height="108" viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="28" height="28" fill="#17140F" />
                      <rect x="14" y="14" width="20" height="20" fill="white" />
                      <rect x="18" y="18" width="12" height="12" fill="#17140F" />
                      <rect x="62" y="10" width="28" height="28" fill="#17140F" />
                      <rect x="66" y="14" width="20" height="20" fill="white" />
                      <rect x="70" y="18" width="12" height="12" fill="#17140F" />
                      <rect x="10" y="62" width="28" height="28" fill="#17140F" />
                      <rect x="14" y="66" width="20" height="20" fill="white" />
                      <rect x="18" y="70" width="12" height="12" fill="#17140F" />
                      <rect x="46" y="14" width="8" height="8" fill="#2F5D50" />
                      <rect x="46" y="46" width="8" height="8" fill="#D98324" />
                      <rect x="62" y="46" width="8" height="8" fill="#2F5D50" />
                      <rect x="46" y="78" width="8" height="8" fill="#17140F" />
                    </svg>
                  </div>

                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>
                    Scan with any UPI app (Google Pay, PhonePe, Paytm)
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                    Payable amount: {formatCurrency(planPrice)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <code style={{ fontSize: '0.725rem', backgroundColor: 'var(--surface)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--line)' }}>
                      pocketpaisa@upi
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyVpa}
                      className="btn-icon"
                      style={{ width: '24px', height: '24px' }}
                    >
                      {copiedVpa ? <Check size={12} color="var(--primary)" /> : <Copy size={12} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={handleRazorpayCheckout}
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ width: '100%', padding: '0.75rem' }}
                    >
                      <span>{loading ? 'Initializing Gateway...' : `Pay ${formatCurrency(planPrice)} via Razorpay UPI`}</span>
                      <ArrowRight size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={handleSandboxPayment}
                      className="btn btn-secondary"
                      disabled={loading}
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem' }}
                    >
                      <span>Instant 1-Click Test (Free Evaluation)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: STRIPE CARD CHECKOUT */}
              {paymentTab === 'card' && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--surface-2)',
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid var(--line)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CreditCard size={20} color="var(--primary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)' }}>
                      Stripe Hosted Checkout
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
                    Pay securely using Visa, MasterCard, RuPay, or American Express via Stripe.
                  </p>
                  <button
                    type="button"
                    onClick={handleStripeCheckout}
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.75rem' }}
                  >
                    <span>{loading ? 'Connecting to Stripe...' : `Pay ${formatCurrency(planPrice)} via Stripe`}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* TAB 3: 1-CLICK TEST SANDBOX */}
              {paymentTab === 'sandbox' && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--surface-2)',
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid var(--line)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Zap size={20} color="var(--accent)" />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)' }}>
                      Recruiter & Evaluator Sandbox Pass
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
                    Instant zero-money test mode designed for resume reviews, portfolio evaluators, and local demonstrations.
                  </p>
                  <button
                    type="button"
                    onClick={handleSandboxPayment}
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.75rem' }}
                  >
                    <span>{loading ? 'Activating Pro...' : 'Activate Pro Instantly (Free Evaluation)'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
