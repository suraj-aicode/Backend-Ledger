import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';

function generateIdempotencyKey() {
  return 'sys_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

export default function SystemMintModal({
  isOpen,
  onClose,
  accounts,
  onMintSuccess,
  api
}) {
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('10000');
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (accounts && accounts.length > 0 && !toAccount) {
      setToAccount(accounts[0]._id);
    }
    setIdempotencyKey(generateIdempotencyKey());
    setError('');
    setSuccess(false);
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!toAccount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid account ID and positive amount.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.initiateSystemFunds({
        toAccount,
        amount: numAmount,
        idempotencyKey,
      });

      setSuccess(true);
      onMintSuccess && onMintSuccess(res);
    } catch (err) {
      setError(err.message || 'Failed to mint initial funds.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-xs)',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0a0a0a'
            }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h3 style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}>SYSTEM LIQUIDITY MINT</h3>
                <span className="badge badge-system" style={{ fontSize: '0.58rem', padding: '1px 5px' }}>
                  <ShieldCheck size={9} /> SYSTEM
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Bootstrap & credit initial liquidity
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-icon btn-sm"
            onClick={handleClose}
            style={{ borderRadius: 'var(--radius-xs)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-sm)',
              background: '#1a1a1a',
              border: '1px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#ffffff'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
              MINT COMPLETED
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              ₹{Number(amount).toLocaleString('en-IN')} has been credited into account <span className="font-mono">{toAccount}</span>.
            </p>
            <button
              id="btn-mint-done"
              className="btn btn-primary"
              onClick={handleClose}
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-xs)',
                background: '#0d0d0d',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                marginBottom: '1.25rem',
                lineHeight: 1.5
              }}>
                <strong style={{ color: '#ffffff' }}>System Authority:</strong> System accounts can bootstrap initial balances. A <strong>CREDIT</strong> ledger record is generated without debiting any sender account.
              </div>

              {error && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-xs)',
                  background: '#1c1414',
                  border: '1px solid #3f2222',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                  marginBottom: '1.25rem'
                }}>
                  {error}
                </div>
              )}

              {/* Target Account */}
              <div className="form-group">
                <label className="form-label">
                  <span>Target Account ID</span>
                </label>
                <input
                  id="input-mint-to-account"
                  type="text"
                  className="form-input font-mono"
                  placeholder="Recipient Account ObjectId"
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value.trim())}
                  required
                />

                {accounts && accounts.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quick Select:</span>
                    {accounts.map((a) => (
                      <button
                        key={a._id}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                        onClick={() => setToAccount(a._id)}
                      >
                        {a._id.substring(a._id.length - 6)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">
                  <span>Amount to Mint (INR)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: '#777777'
                  }}>
                    ₹
                  </span>
                  <input
                    id="input-mint-amount"
                    type="number"
                    min="1"
                    className="form-input font-mono"
                    style={{ paddingLeft: '2.4rem', fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                  {[1000, 5000, 10000, 50000, 100000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                      onClick={() => setAmount(val.toString())}
                    >
                      ₹{val.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Idempotency Key */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KeyRound size={12} color="#888888" />
                    Idempotency Key
                  </span>
                  <button
                    type="button"
                    onClick={() => setIdempotencyKey(generateIdempotencyKey())}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <RefreshCw size={11} /> Regen
                  </button>
                </label>
                <input
                  id="input-mint-idempotency"
                  type="text"
                  className="form-input font-mono"
                  style={{ fontSize: '0.78rem', color: '#777777' }}
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-mint"
                type="submit"
                className="btn btn-primary"
                disabled={loading || Number(amount) <= 0}
              >
                {loading ? 'Minting...' : 'Mint & Credit Funds'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
