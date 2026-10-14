import React from 'react';
import { Modal } from '../common/Modal';
import { ShieldCheck, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  const isPrivacy = type === 'privacy';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
      subtitle={
        isPrivacy
          ? 'How Tizori protects your personal data & financial privacy'
          : 'Standard guidelines for using the Tizori financial vault'
      }
      maxWidth="640px"
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--ink)' }}>
        {isPrivacy ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              <ShieldCheck size={20} />
              <strong style={{ fontSize: '1rem' }}>Commitment to User Privacy</strong>
            </div>

            <p style={{ marginBottom: '1rem' }}>
              At Tizori (PocketPaisa), we believe your personal finances are strictly confidential. We do not sell, rent, or monetize your financial logs, personal profile, or behavioral data with third parties.
            </p>

            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, margin: '1rem 0 0.5rem 0' }}>1. Data Collection & Usage</h4>
            <p style={{ marginBottom: '1rem', color: 'var(--ink-muted)' }}>
              We only collect data necessary to provide you with financial clarity: your name, email address, monthly allowance, and self-logged transactions and goal vaults. When using Google Sign-In, we verify your email address via Google OAuth 2.0 without accessing your private emails or files.
            </p>

            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, margin: '1rem 0 0.5rem 0' }}>2. Data Security & Storage</h4>
            <p style={{ marginBottom: '1rem', color: 'var(--ink-muted)' }}>
              All passwords are encrypted using industry-standard bcrypt hashing. Sessions are protected by cryptographic JSON Web Tokens (JWT). Financial data is securely housed in isolated MongoDB Atlas clusters.
            </p>

            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, margin: '1rem 0 0.5rem 0' }}>3. User Rights & Data Export</h4>
            <p style={{ marginBottom: '1rem', color: 'var(--ink-muted)' }}>
              You retain full ownership of your data. You may download complete CSV backups of your transaction ledger or request permanent account deletion at any time from your settings.
            </p>

            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, margin: '1rem 0 0.5rem 0' }}>4. Contact Support</h4>
            <p style={{ color: 'var(--ink-muted)' }}>
              For questions regarding privacy practices, please contact us at <code>pranjalsingh9091@gmail.com</code>.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              <FileText size={20} />
              <strong style={{ fontSize: '1rem' }}>Terms & Operating Guidelines</strong>
            </div>

            <p style={{ marginBottom: '1rem' }}>
              By accessing Tizori (PocketPaisa), you agree to adhere to these terms of service. Tizori is a personal financial discipline and expense tracking tool designed to assist with daily budgeting.
            </p>

            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, margin: '1rem 0 0.5rem 0' }}>1. Not Financial or Investment Advice</h4>
            <p style={{ marginBottom: '1rem', color: 'var(--ink-muted)' }}>
              PocketPaisa calculators, including the Affordability Engine and Gullak savings projections, provide educational estimates based on user-entered values. They do not constitute formal financial, tax, or investment advisory services.
            </p>

            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, margin: '1rem 0 0.5rem 0' }}>2. Account Security</h4>
            <p style={{ marginBottom: '1rem', color: 'var(--ink-muted)' }}>
              You are responsible for safeguarding your login credentials. If you detect unauthorized access, please notify support immediately.
            </p>

            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, margin: '1rem 0 0.5rem 0' }}>3. Service Availability</h4>
            <p style={{ marginBottom: '1rem', color: 'var(--ink-muted)' }}>
              We aim for continuous uptime, but services may occasionally experience brief maintenance windows or updates.
            </p>

            <p style={{ color: 'var(--ink-muted)' }}>
              Last updated: October 2026. For questions, contact <code>pranjalsingh9091@gmail.com</code>.
            </p>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--line)', textAlign: 'right' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '0.45rem 1.15rem', fontSize: '0.8125rem' }}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
