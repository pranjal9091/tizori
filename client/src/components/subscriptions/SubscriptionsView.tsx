import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CreditCard,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { RecurringBill, RecurringSummary } from '../../types';
import { recurringApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../design-system/Toast';
import { Modal } from '../common/Modal';

interface SubscriptionsViewProps {
  openUpgradeModal: () => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ openUpgradeModal }) => {
  const { user, formatCurrency } = useAuth();
  const { showToast } = useToast();

  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [summary, setSummary] = useState<RecurringSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Subscription Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formFrequency, setFormFrequency] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [formCategory, setFormCategory] = useState('Utilities & Bills');
  const [formNextDate, setFormNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [formPaymentMethod, setFormPaymentMethod] = useState('UPI AutoPay');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await recurringApi.getAll();
      if (res.data) {
        setBills(res.data.bills || []);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    if (summary && !summary.canAddMore) {
      openUpgradeModal();
      return;
    }
    setErrorMsg('');
    setFormName('');
    setFormAmount('');
    setIsAddOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAmount || Number(formAmount) <= 0) {
      setErrorMsg('Please enter a valid subscription name and amount.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await recurringApi.create({
        name: formName.trim(),
        amount: Number(formAmount),
        frequency: formFrequency,
        category: formCategory,
        nextBillingDate: formNextDate,
        paymentMethod: formPaymentMethod,
      });

      showToast({ message: `Added ${formName} to active subscriptions.` });
      setIsAddOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create subscription.';
      if (msg.includes('Free tier allows') || msg.includes('PAYWALL_TRIGGER')) {
        setIsAddOpen(false);
        openUpgradeModal();
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogPayment = async (bill: RecurringBill) => {
    try {
      const res = await recurringApi.logPayment(bill._id);
      if (res.success) {
        showToast({ message: `Logged ₹${bill.amount} payment for ${bill.name} into your Expense Ledger.` });
        loadData();
      }
    } catch {
      showToast({ message: 'Could not record payment.' });
    }
  };

  const handleDelete = async (bill: RecurringBill) => {
    try {
      await recurringApi.delete(bill._id);
      showToast({ message: `Removed ${bill.name}.` });
      loadData();
    } catch {
      showToast({ message: 'Failed to delete subscription.' });
    }
  };

  const getDaysLeft = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Summary Card */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          padding: '1.25rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Monthly Fixed Burn
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--ink)',
              marginTop: '0.2rem',
            }}
          >
            {formatCurrency(summary?.totalMonthlyBurn || 0)}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink-muted)' }}>/mo</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
            Annual commitment: {formatCurrency(summary?.annualProjectedBurn || 0)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Subscriptions
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--primary)',
              marginTop: '0.2rem',
            }}
          >
            {summary?.activeCount || 0}
            {!summary?.isPro && (
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-muted)' }}>
                {' '}/ {summary?.freeLimit || 2} free
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
            {summary?.upcomingRenewalsCount || 0} renewing in next 7 days
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem', width: '100%' }}
          >
            <Plus size={16} />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>

      {/* 2. Free Tier Paywall Banner (if non-pro) */}
      {!summary?.isPro && (
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-card)',
            padding: '0.9rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={20} color="var(--accent)" />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>
                Track Unlimited Recurring Commitments with PocketPaisa Pro
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                Standard membership includes 2 active subscriptions. Pro gives you unlimited bills, renewal WhatsApp alerts, and burn projections.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openUpgradeModal}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.95rem' }}
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* 3. Subscriptions Ruled Ledger */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarClock size={18} color="var(--primary)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>
              Recurring Commitments & Bills
            </span>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="btn-icon"
            title="Refresh Subscriptions"
            style={{ width: '32px', height: '32px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {bills.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto',
                color: 'var(--ink-muted)',
              }}
            >
              <CreditCard size={22} />
            </div>
            <h4 style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>
              No recurring subscriptions tracked yet
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', maxWidth: '360px', margin: '0 auto 1.25rem auto' }}>
              Add your monthly subscriptions like Spotify, Netflix, Wi-Fi, Gym, or Rent to prevent unexpected bank charges.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Track Your First Bill</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {bills.map((bill, idx) => {
              const daysLeft = getDaysLeft(bill.nextBillingDate);
              const isDueSoon = daysLeft <= 5 && daysLeft >= 0;
              const isOverdue = daysLeft < 0;

              return (
                <div
                  key={bill._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderBottom: idx === bills.length - 1 ? 'none' : '1px solid var(--line)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--surface-2)',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--primary-soft)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CreditCard size={18} />
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.9375rem' }}>
                        {bill.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'flex', gap: '0.5rem', marginTop: '2px' }}>
                        <span>{bill.category}</span>
                        <span>•</span>
                        <span>{bill.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {/* Amount & Frequency */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>
                        {formatCurrency(bill.amount)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'capitalize' }}>
                        Every {bill.frequency}
                      </div>
                    </div>

                    {/* Next Renewal Date & Urgency Badge */}
                    <div style={{ minWidth: '120px', textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-pill)',
                          display: 'inline-block',
                          backgroundColor: isOverdue
                            ? 'var(--danger-soft)'
                            : isDueSoon
                            ? 'var(--accent-soft)'
                            : 'var(--surface)',
                          color: isOverdue
                            ? 'var(--danger)'
                            : isDueSoon
                            ? 'var(--accent)'
                            : 'var(--ink-muted)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        {isOverdue ? 'Due Now' : daysLeft === 0 ? 'Renews Today' : `In ${daysLeft} days`}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                        {new Date(bill.nextBillingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => handleLogPayment(bill)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        title="Mark as paid and record into Expense Ledger"
                      >
                        <CheckCircle2 size={14} color="var(--primary)" />
                        <span>Log Paid</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(bill)}
                        className="btn-icon"
                        title="Remove subscription"
                        style={{ width: '32px', height: '32px', color: 'var(--ink-muted)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Add Subscription Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Recurring Subscription"
        subtitle="Track digital services, utilities, and memberships to keep your monthly burn transparent."
        maxWidth="480px"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-input)',
                backgroundColor: 'var(--danger-soft)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                fontSize: '0.8125rem',
              }}
            >
              {errorMsg}
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.35rem' }}>
              Service or Commitment Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Spotify, Netflix, JioFiber, Gym"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.35rem' }}>
                Amount (INR)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="299"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.35rem' }}>
                Billing Cycle
              </label>
              <select
                value={formFrequency}
                onChange={e => setFormFrequency(e.target.value as any)}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.35rem' }}>
                Category
              </label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities & Bills">Utilities & Bills</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Software & Cloud">Software & Cloud</option>
                <option value="Housing & Rent">Housing & Rent</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.35rem' }}>
                Next Renewal Date
              </label>
              <input
                type="date"
                required
                value={formNextDate}
                onChange={e => setFormNextDate(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.35rem' }}>
              Payment Method
            </label>
            <select
              value={formPaymentMethod}
              onChange={e => setFormPaymentMethod(e.target.value)}
              className="input-field"
              style={{ width: '100%' }}
            >
              <option value="UPI AutoPay (Google Pay / PhonePe)">UPI AutoPay (Google Pay / PhonePe)</option>
              <option value="Credit Card Auto-Debit">Credit Card Auto-Debit</option>
              <option value="Debit Card Auto-Debit">Debit Card Auto-Debit</option>
              <option value="Net Banking Standing Instruction">Net Banking Standing Instruction</option>
              <option value="Manual UPI Transfer">Manual UPI Transfer</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {submitting ? 'Saving...' : 'Save Subscription'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
