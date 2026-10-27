import React, { useState, useEffect } from 'react';
import { X, BookOpen, ArrowDownLeft, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function LedgerModal({ isOpen, onClose, account, api }) {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLedger = async () => {
    if (!account) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.getLedger(account._id);
      setLedgers(res.ledgers || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch ledger entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && account) {
      fetchLedger();
    }
  }, [isOpen, account]);

  if (!isOpen || !account) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-xs)',
              background: '#242424',
              border: '1px solid #383838',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <BookOpen size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}>IMMUTABLE LEDGER AUDIT</h3>
              <p className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Account: {account._id}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={fetchLedger}
              className="btn btn-secondary btn-icon btn-sm"
              title="Refresh Ledger"
              style={{ borderRadius: 'var(--radius-xs)' }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              className="btn btn-secondary btn-icon btn-sm"
              onClick={onClose}
              style={{ borderRadius: 'var(--radius-xs)' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Audit Notice */}
        <div style={{
          padding: '0.75rem 1.25rem',
          background: '#0d0d0d',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          <ShieldCheck size={14} color="#ffffff" />
          <span>
            Ledger entries are strictly append-only. Mutation & deletion hooks are blocked at the schema layer.
          </span>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.85rem' }}>Fetching ledger audit trail...</div>
            </div>
          ) : error ? (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-xs)',
              background: '#1c1414',
              color: '#fca5a5',
              fontSize: '0.82rem'
            }}>
              {error}
            </div>
          ) : ledgers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <BookOpen size={32} style={{ opacity: 0.25, margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>NO LEDGER RECORDS</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#555555' }}>
                Entries will be recorded here when this account is credited or debited.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {ledgers.map((entry) => {
                const isCredit = entry.type === 'CREDIT';
                return (
                  <div
                    key={entry._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-xs)',
                      background: '#101010',
                      border: '1px solid var(--border-subtle)',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-xs)',
                        background: '#1f1f1f',
                        border: '1px solid #333333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}>
                        {isCredit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className={`badge badge-${entry.type.toLowerCase()}`}>
                            {entry.type}
                          </span>
                          <span className="font-mono" style={{ fontSize: '0.72rem', color: '#888888' }}>
                            ID: {entry._id.substring(entry._id.length - 8)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Tx: {entry.transaction?._id || (typeof entry.transaction === 'string' ? entry.transaction : 'N/A')}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {isCredit ? '+' : '−'}₹{entry.amount.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#777777', textTransform: 'uppercase' }}>
                        {entry.transaction?.status || 'SETTLED'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
