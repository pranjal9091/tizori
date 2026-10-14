import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { transactionsApi } from '../../api/endpoints';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Drinks');
  const [bucket, setBucket] = useState<'needs' | 'wants'>('wants');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    'Food & Drinks',
    'Travel & Commute',
    'Shopping & Lifestyle',
    'Rent & Utilities',
    'Health & Learning',
    'Other Expenses',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title || isNaN(parsedAmount) || parsedAmount <= 0) return;

    setLoading(true);
    try {
      await transactionsApi.create({
        title,
        amount: parsedAmount,
        category,
        bucket,
        notes,
      });
      onCreated();
      onClose();
      setTitle('');
      setAmount('');
      setNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Expense"
      subtitle="Log transactions for accurate 50-30-20 cashflow accounting"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Expense Description</label>
          <input
            className="form-input"
            placeholder="e.g. Morning Coffee, Metro Fare, Grocery Mart, Team Lunch"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Amount (in ₹)</label>
            <input
              type="number"
              className="form-input mono"
              placeholder="e.g. 150"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              min="1"
              step="any"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={category}
              onChange={e => {
                const val = e.target.value;
                setCategory(val);
                if (val.includes('Rent') || val.includes('Health') || val.includes('Commute')) {
                  setBucket('needs');
                } else {
                  setBucket('wants');
                }
              }}
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Budget Classification</label>
          <select
            className="form-select"
            value={bucket}
            onChange={e => setBucket(e.target.value as 'needs' | 'wants')}
          >
            <option value="needs">Needs (Essential living costs — Rent, Groceries, Transit 50%)</option>
            <option value="wants">Wants (Discretionary lifestyle & leisure — Dining, Entertainment 30%)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Notes (Optional)</label>
          <input
            className="form-input"
            placeholder="e.g. Split expense with colleagues"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Recording...' : 'Record in Ledger'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
