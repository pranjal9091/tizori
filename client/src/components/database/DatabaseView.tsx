import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Server,
  Cloud,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CreditCard,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { DatabaseStatus, GatewayConfig } from '../../types';
import { databaseApi, paymentsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../design-system/Toast';
import { Modal } from '../common/Modal';

export const DatabaseView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom URI connection state
  const [customUri, setCustomUri] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; message?: string } | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const [dbRes, gateRes] = await Promise.all([
        databaseApi.getStatus(),
        paymentsApi.getGatewayConfig(),
      ]);

      if (dbRes.data) setDbStatus(dbRes.data);
      if (gateRes.data) setGatewayConfig(gateRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleTestConnection = async () => {
    if (!customUri.trim() || !customUri.startsWith('mongodb')) {
      showToast({ message: 'Please enter a valid MongoDB URI starting with mongodb:// or mongodb+srv://' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await databaseApi.testConnection(customUri.trim());
      if (res.success) {
        setTestResult({
          success: true,
          latencyMs: res.data?.latencyMs,
          message: `Connection verified! Latency: ${res.data?.latencyMs}ms to database "${res.data?.databaseName}".`,
        });
        showToast({ message: 'Database connection test succeeded!' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database ping failed.';
      setTestResult({ success: false, message: msg });
      showToast({ message: 'Connection test failed: ' + msg });
    } finally {
      setTesting(false);
    }
  };

  const handleSwitchConnection = async () => {
    if (!customUri.trim()) return;

    setConnecting(true);
    try {
      const res = await databaseApi.switchConnection(customUri.trim());
      if (res.success) {
        showToast({ message: 'Successfully switched active database connection!' });
        setCustomUri('');
        setTestResult(null);
        loadMetrics();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not switch database.';
      showToast({ message: msg });
    } finally {
      setConnecting(false);
    }
  };

  const handleExportJson = () => {
    const token = localStorage.getItem('tizori_token') || localStorage.getItem('pocketpaisa_token');
    const url = `/api/database/export?token=${token}`;
    window.open(url, '_blank');
    showToast({ message: 'Exporting complete database snapshot (JSON)...' });
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('tizori_token') || localStorage.getItem('pocketpaisa_token');
    const url = `/api/database/export-csv?token=${token}`;
    window.open(url, '_blank');
    showToast({ message: 'Exporting transaction ledger (CSV)...' });
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      setImportError('Please paste valid JSON backup content.');
      return;
    }

    setImporting(true);
    setImportError('');

    try {
      const parsed = JSON.parse(importJsonText);
      const res = await databaseApi.importData({
        transactions: parsed.transactions || [],
        gullaks: parsed.gullaks || [],
        recurring: parsed.recurring || [],
      });

      if (res.success) {
        showToast({ message: `Import completed: ${res.data?.transactionsImported || 0} transactions restored!` });
        setIsImportOpen(false);
        setImportJsonText('');
        loadMetrics();
      }
    } catch (err: unknown) {
      setImportError('Invalid JSON format: ' + (err instanceof Error ? err.message : 'Could not parse payload.'));
    } finally {
      setImporting(false);
    }
  };

  const stats = dbStatus?.stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Database Connection Status Hero */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={22} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--ink)' }}>
                  Active Database Engine
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: dbStatus?.status === 'connected' ? 'var(--primary-soft)' : 'var(--danger-soft)',
                    color: dbStatus?.status === 'connected' ? 'var(--primary)' : 'var(--danger)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: dbStatus?.status === 'connected' ? 'var(--primary)' : 'var(--danger)',
                    }}
                  />
                  {dbStatus?.status === 'connected' ? 'Connected & Healthy' : 'Disconnected'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                {dbStatus?.engineName || 'High-Performance Embedded In-Memory MongoDB'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadMetrics}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Check Latency</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--line)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ping Latency
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
              {dbStatus?.latencyMs !== undefined && dbStatus.latencyMs >= 0 ? `${dbStatus.latencyMs} ms` : '< 1 ms (Local)'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Database Name
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
              {dbStatus?.databaseName || 'pocketpaisa'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Persisted Records
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
              {stats?.totalRecords || 0} docs
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ledger Transactions
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
              {stats?.transactionsCount || 0}
            </div>
          </div>
        </div>

        {/* Masked Connection String Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.9rem',
            backgroundColor: 'var(--surface-2)',
            borderRadius: 'var(--radius-input)',
            border: '1px solid var(--line)',
            fontSize: '0.775rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <Server size={14} color="var(--ink-muted)" />
            <span style={{ color: 'var(--ink-muted)' }}>Connection URI:</span>
            <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {dbStatus?.maskedUri}
            </code>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontWeight: 600, flexShrink: 0 }}>
            <ShieldCheck size={14} />
            <span>Encrypted (TLS)</span>
          </div>
        </div>
      </div>

      {/* 2. Connect Your Own MongoDB Database */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <Cloud size={20} color="var(--primary)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>
            Connect Custom MongoDB Cluster (Atlas or Local)
          </h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: '1.25rem' }}>
          Connect your personal MongoDB Atlas cloud cluster or local MongoDB instance to keep your transactions and goal vaults permanently synced to your own database.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.35rem' }}>
              MongoDB Connection String
            </label>
            <input
              type="text"
              placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/pocketpaisa"
              value={customUri}
              onChange={e => setCustomUri(e.target.value)}
              className="input-field"
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
            />
          </div>

          {testResult && (
            <div
              style={{
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-input)',
                backgroundColor: testResult.success ? 'var(--primary-soft)' : 'var(--danger-soft)',
                border: testResult.success ? '1px solid var(--primary)' : '1px solid var(--danger)',
                color: testResult.success ? 'var(--primary)' : 'var(--danger)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !customUri.trim()}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.6rem 1rem' }}
            >
              {testing ? 'Testing Latency...' : 'Test Connection'}
            </button>

            <button
              type="button"
              onClick={handleSwitchConnection}
              disabled={connecting || !customUri.trim()}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', padding: '0.6rem 1rem' }}
            >
              {connecting ? 'Switching Database...' : 'Connect & Switch Database'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Data Portability, Backup & Export */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <HardDrive size={20} color="var(--primary)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>
            Data Ownership, Export & Restore
          </h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: '1.25rem' }}>
          You own 100% of your financial records. Download structured JSON snapshots, export CSV ledgers for tax calculations, or restore from a past backup.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* JSON Export */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--ink)', fontSize: '0.875rem' }}>
                <FileCode size={18} color="var(--primary)" />
                <span>Full JSON Snapshot</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
                Complete archive of your ledger, savings goal vaults, and subscriptions in standard JSON format.
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportJson}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.8125rem', padding: '0.5rem' }}
            >
              <Download size={14} />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* CSV Export */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--ink)', fontSize: '0.875rem' }}>
                <FileSpreadsheet size={18} color="var(--primary)" />
                <span>Ledger Sheet (CSV)</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
                Tabular CSV format formatted for Microsoft Excel, Google Sheets, or CA audit records.
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.8125rem', padding: '0.5rem' }}
            >
              <Download size={14} />
              <span>Download CSV Ledger</span>
            </button>
          </div>

          {/* JSON Restore */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--ink)', fontSize: '0.875rem' }}>
                <Upload size={18} color="var(--accent)" />
                <span>Restore from Backup</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
                Upload a JSON snapshot to populate transactions, goal vaults, and subscriptions into the database.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.8125rem', padding: '0.5rem' }}
            >
              <Upload size={14} />
              <span>Import Snapshot</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Payment Gateway Methods Overview */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <CreditCard size={20} color="var(--primary)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>
            Integrated Payment Gateway Channels
          </h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: '1.25rem' }}>
          PocketPaisa connects with UPI and card gateways for Pro memberships and digital savings vault funding.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {gatewayConfig?.supportedMethods.map(item => (
            <div
              key={item.id}
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--surface-2)',
                borderRadius: 'var(--radius-input)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-soft)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.id === 'upi' ? <QrCode size={16} /> : <CreditCard size={16} />}
              </div>

              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                  {item.providers.slice(0, 3).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Restore Database from JSON"
        subtitle="Paste your previously exported PocketPaisa JSON snapshot to restore transactions and goals."
        maxWidth="500px"
      >
        <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {importError && (
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
              {importError}
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '0.35rem' }}>
              Paste JSON Snapshot
            </label>
            <textarea
              rows={8}
              required
              placeholder='{ "transactions": [...], "gullaks": [...] }'
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              className="input-field"
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: '1.4' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setIsImportOpen(false)}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importing}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {importing ? 'Importing...' : 'Restore Records'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
