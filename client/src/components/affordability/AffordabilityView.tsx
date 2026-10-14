import React, { useState } from 'react';
import { ArrowRight, Sparkles, PiggyBank, ShoppingBag, Headphones, Compass, Shirt, Utensils } from 'lucide-react';
import { affordabilityApi } from '../../api/endpoints';
import { AffordabilityResult } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { RubberStamp, StampVerdict } from '../../design-system/RubberStamp';
import { Odometer } from '../../design-system/Odometer';

interface AffordabilityViewProps {
  onNavigateToGullak?: () => void;
}

export const AffordabilityView: React.FC<AffordabilityViewProps> = ({ onNavigateToGullak }) => {
  const { formatCurrency } = useAuth();
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AffordabilityResult | null>(null);

  const presets = [
    { name: 'Nike Sneakers', price: 4500, icon: ShoppingBag },
    { name: 'Wireless Headphones', price: 2800, icon: Headphones },
    { name: 'Weekend Trip', price: 6500, icon: Compass },
    { name: 'Casual Jacket', price: 1800, icon: Shirt },
    { name: 'Dinner Outing', price: 1500, icon: Utensils },
  ];

  const handleCheck = async (e?: React.FormEvent, customItem?: string, customPrice?: number) => {
    if (e) e.preventDefault();
    const finalItem = customItem || itemName;
    const finalPrice = customPrice !== undefined ? customPrice : parseFloat(price);

    if (!finalItem || isNaN(finalPrice) || finalPrice <= 0) return;

    setLoading(true);
    try {
      const res = await affordabilityApi.check({ itemName: finalItem, price: finalPrice });
      if (res.data) {
        setResult(res.data);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Convert backend headline and advice into professional standard English
  const formatHeadlineEnglish = (verdict: string) => {
    switch (verdict) {
      case 'SAFE_TO_BUY':
        return 'Safe & Guilt-Free Purchase';
      case 'WAIT_A_BIT':
        return 'Caution Recommended — Consider Saving First';
      case 'DONT_BUY':
      default:
        return 'Out of Budget — Purchase Not Advised';
    }
  };

  const formatAdviceEnglish = (r: AffordabilityResult) => {
    if (r.verdict === 'SAFE_TO_BUY') {
      return `This purchase fits comfortably within your budget! Even after purchasing, you will maintain a healthy daily allowance of ${formatCurrency(r.newDailyBudget)}/day for the remaining ${r.daysLeft} days of the month.`;
    } else if (r.verdict === 'WAIT_A_BIT') {
      return `You can technically afford this item, but your daily allowance will decline from ${formatCurrency(r.currentDailyBudget)}/day to ${formatCurrency(r.newDailyBudget)}/day. Setting aside small weekly contributions in a Goal Vault is highly recommended instead.`;
    } else {
      return `This item exceeds your available monthly pocket cash (${formatCurrency(r.remainingPocketMoney)} remaining). Purchasing this now would deplete your reserves and disrupt necessary recurring expenses.`;
    }
  };

  return (
    <div className="animate-fade-up" style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Editorial Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.85rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '0.75rem',
          }}
        >
          <Sparkles size={13} />
          <span>Impulse Purchase Decision Engine</span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
            fontWeight: 800,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          Can I Afford This?
        </h2>

        <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', maxWidth: '540px', margin: '0.5rem auto 0 auto' }}>
          Thinking about buying something? Enter the price below to calculate the exact impact on your daily safe allowance before purchasing.
        </p>
      </div>

      {/* Input Form Card */}
      <div
        className="paper-card"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        <form onSubmit={handleCheck}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">What are you considering purchasing? (Item Name)</label>
              <input
                className="form-input"
                placeholder="e.g. Nike Sneakers, Wireless Earbuds, Smartwatch"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Price (in ₹)</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--ink-muted)',
                    fontSize: '1.1rem',
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  className="form-input mono"
                  style={{ paddingLeft: '2.4rem', fontSize: '1.1rem', fontWeight: 700 }}
                  placeholder="3500"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  min="1"
                  step="any"
                />
              </div>
            </div>
          </div>

          {/* Quick Preset Examples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)' }}>Quick Examples:</span>
            {presets.map(p => {
              const Icon = p.icon;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setItemName(p.name);
                    setPrice(p.price.toString());
                    handleCheck(undefined, p.name, p.price);
                  }}
                  className="chip"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  <Icon size={13} color="var(--ink-muted)" strokeWidth={1.8} />
                  <span>{p.name}</span>
                  <span className="mono" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {formatCurrency(p.price)}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', fontSize: '1rem', fontWeight: 700, padding: '0.85rem' }}
          >
            {loading ? 'Evaluating Financial Impact...' : 'Evaluate Affordability →'}
          </button>
        </form>
      </div>

      {/* Result Card: Paper Chit with Stamped Verdict */}
      {result && (
        <div
          className="paper-chit animate-fade-up"
          style={{
            marginBottom: '2rem',
            border: '2px dashed var(--line)',
            backgroundColor: 'var(--surface)',
            padding: '2rem',
          }}
        >
          {/* Top row: Rubber Stamp + Price summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            <RubberStamp
              verdict={result.verdict as StampVerdict}
              subtext={`Item: ${result.itemName}`}
            />

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Item Price
              </div>
              <div
                className="mono"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--ink)',
                }}
              >
                {formatCurrency(result.itemPrice)}
              </div>
            </div>
          </div>

          {/* Speech-Bubble Advice Chit */}
          <div
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-card)',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.75rem',
              position: 'relative',
            }}
          >
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: '0.4rem',
              }}
            >
              {formatHeadlineEnglish(result.verdict)}
            </h4>
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--ink)',
                lineHeight: 1.55,
              }}
            >
              "{formatAdviceEnglish(result)}"
            </p>
          </div>

          {/* Daily Pocket Impact: Before / After Allowance Comparison Bars */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--ink)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.85rem',
              }}
            >
              Daily Safe Allowance Impact:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* 1. Before Purchase */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Current Safe Allowance:</span>
                  <span className="mono" style={{ color: 'var(--primary)', fontWeight: 800 }}>
                    <Odometer value={result.currentDailyBudget} prefix="₹" suffix="/day" />
                  </span>
                </div>
                <div style={{ height: '10px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-pill)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--primary)', borderRadius: 'var(--radius-pill)' }} />
                </div>
              </div>

              {/* 2. After Purchase */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>
                    Projected Allowance After Purchase:
                  </span>
                  <span
                    className="mono"
                    style={{
                      color: result.newDailyBudget < 150 ? 'var(--danger)' : 'var(--accent)',
                      fontWeight: 800,
                    }}
                  >
                    <Odometer value={result.newDailyBudget} prefix="₹" suffix="/day" />
                  </span>
                </div>
                <div style={{ height: '10px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-pill)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <div
                    style={{
                      width: `${Math.max(5, Math.min(100, (result.newDailyBudget / Math.max(1, result.currentDailyBudget)) * 100))}%`,
                      height: '100%',
                      backgroundColor: result.newDailyBudget < 150 ? 'var(--danger)' : 'var(--accent)',
                      borderRadius: 'var(--radius-pill)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Delta Label */}
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>📉 Projected Drop:</span>
                <span className="mono" style={{ color: 'var(--danger)', fontWeight: 700 }}>
                  -{formatCurrency(Math.max(0, result.currentDailyBudget - result.newDailyBudget))}/day
                </span>
                <span>for the remaining {result.daysLeft} days of the month.</span>
              </div>
            </div>
          </div>

          {/* If verdict is WAIT_A_BIT or DONT_BUY, show action to save in Goal Vault instead */}
          {result.verdict !== 'SAFE_TO_BUY' && onNavigateToGullak && (
            <div
              style={{
                borderTop: '1px solid var(--line)',
                paddingTop: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)' }}>
                  Smart Alternative: Save in a Goal Vault
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                  Setting aside small increments prevents cashflow shocks while achieving your desired goal.
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigateToGullak}
                className="btn btn-accent"
              >
                <PiggyBank size={16} />
                <span>Save in Goal Vault</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
