import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Target, Calendar, ArrowDownLeft, Trash2, Sparkles, Lock, CreditCard } from 'lucide-react';
import { Gullak } from '../../types';
import { gullaksApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { GullakJar } from '../../design-system/GullakJar';
import { useToast } from '../../design-system/Toast';
import { Odometer } from '../../design-system/Odometer';
import { GatewayDepositModal } from './GatewayDepositModal';

interface GullakViewProps {
  gullaks: Gullak[];
  onRefresh: () => void;
  openUpgradeModal?: () => void;
}

export const GullakView: React.FC<GullakViewProps> = ({
  gullaks,
  onRefresh,
  openUpgradeModal,
}) => {
  const { user, formatCurrency } = useAuth();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [gatewayGullak, setGatewayGullak] = useState<Gullak | null>(null);
  const [selectedGullak, setSelectedGullak] = useState<Gullak | null>(null);

  // Animation states keyed by Gullak ID
  const [droppingId, setDroppingId] = useState<string | null>(null);
  const [crackingId, setCrackingId] = useState<string | null>(null);

  // Hold-to-break state
  const [breakingGullak, setBreakingGullak] = useState<Gullak | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [emoji, setEmoji] = useState('🏖️');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const totalGullakSavings = gullaks.reduce((a, g) => a + g.currentAmount, 0);

  // Warm Palette Confetti for Milestones
  const triggerMilestoneConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      colors: ['#D98324', '#2F5D50', '#FFFBF3', '#C4513B'],
      origin: { y: 0.6 },
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (!name || isNaN(target) || target <= 0 || !targetDate) return;

    setLoading(true);
    try {
      await gullaksApi.create({
        name,
        targetAmount: target,
        emoji,
        targetDate,
        notes,
      });
      onRefresh();
      setIsCreateOpen(false);
      setName('');
      setTargetAmount('');
      setNotes('');
      showToast({ message: `Goal vault "${name}" successfully created!` });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async (gullak: Gullak, amt: number) => {
    if (amt <= 0) return;
    setDroppingId(gullak._id);

    try {
      const res = await gullaksApi.addMoney(gullak._id, amt);
      const updated = res.data;

      // Check milestones
      if (updated) {
        const oldPct = Math.round((gullak.currentAmount / gullak.targetAmount) * 100);
        const newPct = Math.round((updated.currentAmount / updated.targetAmount) * 100);

        if (newPct >= 100 && oldPct < 100) {
          triggerMilestoneConfetti();
          showToast({ message: `🎉 Congratulations! Goal "${gullak.name}" is 100% completed!` });
        } else if (newPct >= 50 && oldPct < 50) {
          triggerMilestoneConfetti();
          showToast({ message: `👏 Halfway milestone! "${gullak.name}" reached 50% saved!` });
        } else {
          showToast({ message: `${formatCurrency(amt)} deposited into "${gullak.name}".` });
        }
      }

      onRefresh();
      setIsAddMoneyOpen(false);
      setAddAmount('');
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDroppingId(null), 700);
    }
  };

  // Hold-to-break interaction logic (1-second continuous hold)
  const startHoldBreak = (g: Gullak) => {
    setBreakingGullak(g);
    setHoldProgress(0);

    const stepTime = 50;
    const totalTime = 1000;
    let elapsed = 0;

    holdIntervalRef.current = window.setInterval(async () => {
      elapsed += stepTime;
      const pct = Math.min(100, Math.round((elapsed / totalTime) * 100));
      setHoldProgress(pct);

      if (elapsed >= totalTime) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        // Trigger crack animation & execute withdrawal
        setCrackingId(g._id);
        try {
          await gullaksApi.breakGullak(g._id);
          onRefresh();
          showToast({
            message: `Withdrawal complete: ${formatCurrency(g.currentAmount)} returned to pocket cash.`,
          });
        } catch (err) {
          console.error('Failed to withdraw from vault', err);
        } finally {
          setTimeout(() => {
            setCrackingId(null);
            setBreakingGullak(null);
            setHoldProgress(0);
          }, 800);
        }
      }
    }, stepTime);
  };

  const cancelHoldBreak = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
    setBreakingGullak(null);
  };

  return (
    <div className="animate-fade-up">
      {/* Top Banner */}
      <div
        className="paper-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-contrast)',
              flexShrink: 0,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 11V9a7 7 0 0 0-14 0v2a5 5 0 0 0 0 10h14a5 5 0 0 0 0-10Z" />
              <circle cx="12" cy="14" r="2.5" />
              <path d="M12 9v1" />
            </svg>
          </div>

          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
              }}
            >
              Savings Goal Vaults
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              Total Vault Savings:{' '}
              <strong className="mono" style={{ color: 'var(--primary)', fontSize: '1rem' }}>
                <Odometer value={totalGullakSavings} prefix="₹" />
              </strong>{' '}
              across {gullaks.length} goals
            </p>
          </div>
        </div>

        <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
          <Plus size={16} strokeWidth={2} />
          <span>+ New Goal Vault</span>
        </button>
      </div>

      {/* Goal Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
        }}
      >
        {gullaks.map(g => {
          const progress = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
          const isDone = g.currentAmount >= g.targetAmount;
          const isDropping = droppingId === g._id;
          const isCracking = crackingId === g._id;
          const isBreakingThis = breakingGullak?._id === g._id;

          return (
            <div
              key={g._id}
              className="paper-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
                border: isDone ? '2px solid var(--primary)' : '1px solid var(--line)',
                boxShadow: isDone ? 'var(--shadow-2)' : 'var(--shadow-1)',
              }}
            >
              <div>
                {/* Header: Title + Delete */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{g.emoji || '🎯'}</span>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                        {g.name}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{g.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await gullaksApi.delete(g._id);
                      onRefresh();
                      showToast({ message: `Goal vault "${g.name}" removed.` });
                    }}
                    className="btn-icon"
                    aria-label={`Delete ${g.name}`}
                    style={{ width: '32px', height: '32px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Clay Jar Visualizer */}
                <div style={{ margin: '1rem 0 1.25rem 0' }}>
                  <GullakJar
                    percent={progress}
                    isDropping={isDropping}
                    isCracking={isCracking}
                    size={130}
                  />
                </div>

                {/* Amount Numbers */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div
                    className="mono"
                    style={{
                      fontSize: '1.85rem',
                      fontWeight: 800,
                      color: isDone ? 'var(--primary)' : 'var(--ink)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    <Odometer value={g.currentAmount} prefix="₹" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                    <Target size={14} />
                    <span>Target: <strong className="mono" style={{ color: 'var(--ink)' }}>{formatCurrency(g.targetAmount)}</strong> ({progress}%)</span>
                  </div>
                </div>

                {/* Target Date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--ink-muted)', marginBottom: '1.25rem' }}>
                  <Calendar size={13} />
                  <span>Target Date: <strong className="mono">{new Date(g.targetDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                </div>

                {/* 1-Tap Quick Deposit Chips */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '0.4rem' }}>
                    Quick Deposit:
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    {[100, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleAddMoney(g, amt)}
                        className="chip"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '0.35rem' }}
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions: Custom Deposit & 1-Second Hold to Withdraw */}
              {/* Actions: Custom Deposit, UPI / Card Gateway, & Hold-to-Withdraw */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  borderTop: '1px solid var(--line)',
                  paddingTop: '1rem',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGullak(g);
                      setIsAddMoneyOpen(true);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, padding: '0.45rem' }}
                  >
                    <ArrowDownLeft size={14} />
                    <span>Add</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGatewayGullak(g);
                      setIsGatewayOpen(true);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1.3, padding: '0.45rem', backgroundColor: 'var(--primary)' }}
                    title="Fund via instant UPI QR, Card, or Net Banking"
                  >
                    <CreditCard size={14} />
                    <span>Pay via UPI</span>
                  </button>
                </div>

                {/* Hold to Withdraw button */}
                <button
                  type="button"
                  onMouseDown={() => startHoldBreak(g)}
                  onMouseUp={cancelHoldBreak}
                  onMouseLeave={cancelHoldBreak}
                  onTouchStart={() => startHoldBreak(g)}
                  onTouchEnd={cancelHoldBreak}
                  className="btn btn-secondary btn-sm"
                  style={{
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    borderColor: isBreakingThis ? 'var(--danger)' : 'var(--line)',
                    color: isBreakingThis ? 'var(--danger)' : 'var(--ink)',
                    padding: '0.45rem',
                  }}
                  disabled={g.currentAmount <= 0}
                  title="Hold for 1 second to withdraw funds back to pocket cash"
                >
                  {/* Progress fill during hold */}
                  {isBreakingThis && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${holdProgress}%`,
                        backgroundColor: 'var(--danger-soft)',
                        opacity: 0.8,
                        zIndex: 0,
                        transition: 'width 0.05s linear',
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1, fontSize: '0.75rem' }}>
                    {isBreakingThis ? `Holding (${holdProgress}%)` : 'Hold to Withdraw'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Free-Tier Limit: Pro prompt card */}
        {user?.tier !== 'pro' && gullaks.length >= 3 && openUpgradeModal && (
          <div
            className="paper-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '2rem 1.5rem',
              border: '2px dashed var(--line)',
              backgroundColor: 'var(--surface-2)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                marginBottom: '1rem',
              }}
            >
              <Lock size={20} strokeWidth={2} />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem' }}>
              Unlimited Savings Vaults
            </h3>

            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: '1.25rem', maxWidth: '280px' }}>
              Standard accounts include 3 active goal vaults. Upgrade to Pro for unlimited vaults and AI spending leak diagnostics.
            </p>

            <button onClick={openUpgradeModal} className="btn btn-secondary btn-sm">
              <Sparkles size={14} color="var(--accent)" />
              <span>Explore Pro Features</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal: Create Goal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Savings Goal"
        subtitle="Set aside incremental funds for trips, devices, gifts, or emergency reserves"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Goal Title</label>
            <input
              className="form-input"
              placeholder="e.g. Summer Vacation, New Laptop, Birthday Gift, Emergency Buffer"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Amount (₹)</label>
              <input
                type="number"
                className="form-input mono"
                placeholder="15000"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                required
                min="1"
                step="any"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Goal Icon Tag</label>
              <select className="form-select" value={emoji} onChange={e => setEmoji(e.target.value)}>
                <option value="🏖️">🏖️ Vacation / Travel</option>
                <option value="📱">📱 New Smartphone / Tech</option>
                <option value="🎁">🎁 Birthday / Celebration Gift</option>
                <option value="🏍️">🏍️ Vehicle / Commute</option>
                <option value="👟">👟 Apparel / Shopping</option>
                <option value="🛡️">🛡️ Emergency Buffer</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Completion Date</label>
            <input
              type="date"
              className="form-input"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Goal...' : 'Create Goal Vault'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Custom Deposit Funds into Goal */}
      <Modal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        title={`Deposit Funds into Goal: ${selectedGullak?.name || ''}`}
        subtitle={`Current Savings: ${formatCurrency(selectedGullak?.currentAmount || 0)} | Target: ${formatCurrency(selectedGullak?.targetAmount || 0)}`}
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            if (selectedGullak) {
              handleAddMoney(selectedGullak, parseFloat(addAmount));
            }
          }}
        >
          <div className="form-group">
            <label className="form-label">Deposit Amount (₹)</label>
            <input
              type="number"
              className="form-input mono"
              placeholder="e.g. 500, 1000, 2000"
              value={addAmount}
              onChange={e => setAddAmount(e.target.value)}
              required
              min="1"
              step="any"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[100, 200, 500, 1000, 2000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setAddAmount(amt.toString())}
                className="chip"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}
              >
                +₹{amt}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
            <button type="button" onClick={() => setIsAddMoneyOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Deposit
            </button>
          </div>
        </form>
      </Modal>

      {/* Gateway Checkout Modal for Direct Funding */}
      <GatewayDepositModal
        isOpen={isGatewayOpen}
        onClose={() => setIsGatewayOpen(false)}
        gullak={gatewayGullak}
        onDepositSuccess={onRefresh}
      />
    </div>
  );
};
