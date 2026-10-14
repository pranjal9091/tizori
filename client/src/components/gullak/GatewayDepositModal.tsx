import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  CreditCard,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Gullak } from '../../types';
import { paymentsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

interface GatewayDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  gullak: Gullak | null;
  onDepositSuccess: () => void;
}

export const GatewayDepositModal: React.FC<GatewayDepositModalProps> = ({
  isOpen,
  onClose,
  gullak,
  onDepositSuccess,
}) => {
  const { formatCurrency } = useAuth();

  const [amount, setAmount] = useState<number>(500);
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [receipt, setReceipt] = useState<{
    referenceId: string;
    amount: number;
    paymentMethod: string;
    timestamp: string;
    status: string;
  } | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('888');

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  if (!gullak) return null;

  const presetAmounts = [200, 500, 1000, 2500];

  const handleCopyVpa = () => {
    navigator.clipboard.writeText('pocketpaisa@upi');
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleProcessPayment = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid deposit amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await paymentsApi.depositVault({
        gullakId: gullak._id,
        amount,
        paymentMethod: method,
        vpaId: method === 'upi' ? 'pocketpaisa@upi' : undefined,
      });

      if (res.success && res.receipt) {
        setReceipt(res.receipt);
        confetti({
          particleCount: 75,
          spread: 60,
          colors: ['#2F5D50', '#D98324', '#F6F1E7'],
          origin: { y: 0.6 },
        });
        onDepositSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment authorization failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReceipt(null);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={receipt ? 'Deposit Confirmed' : `Deposit into ${gullak.name}`}
      subtitle={
        receipt
          ? 'Digital payment receipt verified and credited to your goal vault.'
          : 'Direct payment gateway checkout with instant UPI, Card, or Net Banking.'
      }
      maxWidth="540px"
    >
      {receipt ? (
        /* Confirmed Payment Receipt */
        <div style={{ padding: '0.5rem 0' }}>
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--line)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Stamp watermark */}
            <div
              style={{
                position: 'absolute',
                right: '12px',
                top: '12px',
                border: '2px solid var(--accent)',
                borderRadius: '8px',
                padding: '4px 10px',
                transform: 'rotate(-8deg)',
                color: 'var(--accent)',
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                pointerEvents: 'none',
              }}
            >
              PAID & VERIFIED
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <CheckCircle2 size={24} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Transaction Completed
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                  {formatCurrency(receipt.amount)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--line)', paddingBottom: '0.35rem' }}>
                <span style={{ color: 'var(--ink-muted)' }}>Target Vault:</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{gullak.name} {gullak.emoji}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--line)', paddingBottom: '0.35rem' }}>
                <span style={{ color: 'var(--ink-muted)' }}>Payment Channel:</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{receipt.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--line)', paddingBottom: '0.35rem' }}>
                <span style={{ color: 'var(--ink-muted)' }}>Reference ID:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)', fontSize: '0.75rem' }}>
                  {receipt.referenceId}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-muted)' }}>Timestamp:</span>
                <span style={{ color: 'var(--ink)' }}>{new Date(receipt.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.8rem' }}
          >
            Done
          </button>
        </div>
      ) : (
        /* Payment Checkout Flow */
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

          {/* Amount Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.4rem' }}>
              Select Deposit Amount (INR)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
              {presetAmounts.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-input)',
                    border: amount === val ? '2px solid var(--primary)' : '1px solid var(--line)',
                    backgroundColor: amount === val ? 'var(--primary-soft)' : 'var(--surface-2)',
                    color: amount === val ? 'var(--primary)' : 'var(--ink)',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  +{formatCurrency(val)}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--ink-muted)' }}>
                ₹
              </span>
              <input
                type="number"
                min="10"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                placeholder="Custom Amount"
                className="input-field"
                style={{ paddingLeft: '28px', width: '100%' }}
              />
            </div>
          </div>

          {/* Payment Method Switcher */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.4rem' }}>
              Payment Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setMethod('upi')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.75rem 0.5rem',
                  borderRadius: 'var(--radius-input)',
                  border: method === 'upi' ? '2px solid var(--primary)' : '1px solid var(--line)',
                  backgroundColor: method === 'upi' ? 'var(--primary-soft)' : 'var(--surface-2)',
                  color: method === 'upi' ? 'var(--primary)' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                <QrCode size={20} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Instant UPI</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.75rem 0.5rem',
                  borderRadius: 'var(--radius-input)',
                  border: method === 'card' ? '2px solid var(--primary)' : '1px solid var(--line)',
                  backgroundColor: method === 'card' ? 'var(--primary-soft)' : 'var(--surface-2)',
                  color: method === 'card' ? 'var(--primary)' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                <CreditCard size={20} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Card / Stripe</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('netbanking')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.75rem 0.5rem',
                  borderRadius: 'var(--radius-input)',
                  border: method === 'netbanking' ? '2px solid var(--primary)' : '1px solid var(--line)',
                  backgroundColor: method === 'netbanking' ? 'var(--primary-soft)' : 'var(--surface-2)',
                  color: method === 'netbanking' ? 'var(--primary)' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                <Building2 size={20} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Net Banking</span>
              </button>
            </div>
          </div>

          {/* METHOD 1: UPI VIEW */}
          {method === 'upi' && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--surface-2)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--line)',
                marginBottom: '1.25rem',
                textAlign: 'center',
              }}
            >
              {/* Dynamic QR SVG */}
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  backgroundColor: '#ffffff',
                  padding: '8px',
                  borderRadius: '12px',
                  margin: '0 auto 0.75rem auto',
                  boxShadow: 'var(--shadow-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="114" height="114" viewBox="0 0 100 100" fill="none">
                  {/* Outer QR box styling */}
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

                  {/* Micro data bits */}
                  <rect x="46" y="14" width="8" height="8" fill="#2F5D50" />
                  <rect x="46" y="30" width="8" height="8" fill="#17140F" />
                  <rect x="46" y="46" width="8" height="8" fill="#D98324" />
                  <rect x="30" y="46" width="8" height="8" fill="#17140F" />
                  <rect x="62" y="46" width="8" height="8" fill="#2F5D50" />
                  <rect x="78" y="46" width="8" height="8" fill="#17140F" />
                  <rect x="46" y="62" width="8" height="8" fill="#17140F" />
                  <rect x="62" y="62" width="8" height="8" fill="#D98324" />
                  <rect x="78" y="78" width="8" height="8" fill="#2F5D50" />
                  <rect x="62" y="78" width="8" height="8" fill="#17140F" />
                  <rect x="46" y="78" width="8" height="8" fill="#17140F" />
                </svg>
              </div>

              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>
                Scan with Google Pay, PhonePe, or Paytm
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                Dynamic UPI Intent for {formatCurrency(amount)}
              </div>

              {/* VPA Copy Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.6rem',
                }}
              >
                <code style={{ fontSize: '0.75rem', backgroundColor: 'var(--surface)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--line)' }}>
                  pocketpaisa@upi
                </code>
                <button
                  type="button"
                  onClick={handleCopyVpa}
                  className="btn-icon"
                  style={{ width: '26px', height: '26px' }}
                  title="Copy UPI VPA"
                >
                  {copiedVpa ? <Check size={13} color="var(--primary)" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}

          {/* METHOD 2: CARD / STRIPE VIEW */}
          {method === 'card' && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--surface-2)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--line)',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.25rem' }}>
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.25rem' }}>
                    Valid Thru
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.25rem' }}>
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* METHOD 3: NET BANKING VIEW */}
          {method === 'netbanking' && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--surface-2)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--line)',
                marginBottom: '1.25rem',
              }}
            >
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.4rem' }}>
                Select Your Bank
              </label>
              <select
                value={selectedBank}
                onChange={e => setSelectedBank(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="State Bank of India">State Bank of India (SBI)</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          {/* CTA & Security Notice */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', marginBottom: '1rem', color: 'var(--ink-muted)', fontSize: '0.725rem' }}>
            <ShieldCheck size={14} color="var(--primary)" />
            <span>256-Bit Encrypted Gateway Payment • RBI Compliant</span>
          </div>

          <button
            type="button"
            onClick={handleProcessPayment}
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            <Sparkles size={16} />
            <span>
              {loading ? 'Authorizing Payment...' : `Authorize ${formatCurrency(amount)} Deposit`}
            </span>
          </button>
        </div>
      )}
    </Modal>
  );
};
