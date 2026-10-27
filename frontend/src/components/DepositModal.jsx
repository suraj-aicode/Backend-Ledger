import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CheckCircle2, Wallet, ArrowDownLeft, ShieldCheck, Zap } from 'lucide-react';

function generateIdempotencyKey() {
  return 'dep_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

export default function DepositModal({
  isOpen,
  onClose,
  account,
  accounts,
  onDepositSuccess,
  api
}) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('2000');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (account) {
      setSelectedAccountId(account._id);
    } else if (accounts && accounts.length > 0) {
      setSelectedAccountId(accounts[0]._id);
    }
    setError('');
    setSuccessData(null);
  }, [isOpen, account, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!selectedAccountId || isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid account and positive deposit amount.');
      return;
    }

    try {
      setLoading(true);
      const idempotencyKey = generateIdempotencyKey();
      const res = await api.initiateSystemFunds({
        toAccount: selectedAccountId,
        amount: numAmount,
        idempotencyKey: idempotencyKey,
      });

      setSuccessData(res.transaction);
      onDepositSuccess && onDepositSuccess(res);
    } catch (err) {
      setError(err.message || 'Failed to deposit funds');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessData(null);
    setError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
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
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}>ADD MONEY TO ACCOUNT</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Direct ledger credit & instant deposit
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
        {successData ? (
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
              DEPOSIT COMPLETED
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              ₹{Number(amount).toLocaleString('en-IN')} has been credited into your ledger account.
            </p>

            <div style={{
              background: '#0d0d0d',
              borderRadius: 'var(--radius-xs)',
              padding: '1rem',
              textAlign: 'left',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Account:</span>
                <span className="font-mono">{selectedAccountId.substring(selectedAccountId.length - 8)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount Credited:</span>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>₹{Number(amount).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Entry Type:</span>
                <span className="badge badge-credit">CREDIT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className="badge badge-completed">COMPLETED</span>
              </div>
            </div>

            <button
              id="btn-deposit-done"
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

              {/* Destination Account Selection */}
              <div className="form-group">
                <label className="form-label">
                  <span>Destination Account</span>
                </label>
                {accounts && accounts.length > 1 ? (
                  <select
                    className="form-select font-mono"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc._id} ({acc.status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-xs)',
                    background: '#0d0d0d',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Wallet size={15} color="#888888" />
                    <span className="font-mono" style={{ fontSize: '0.82rem', color: '#f4f2ed' }}>
                      {selectedAccountId || 'No account selected'}
                    </span>
                  </div>
                )}
              </div>

              {/* Deposit Amount */}
              <div className="form-group">
                <label className="form-label">
                  <span>Deposit Amount (INR)</span>
                  <span style={{ color: '#888888', fontSize: '0.72rem' }}>ZERO TRANSACTION FEES</span>
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
                    id="input-deposit-amount"
                    type="number"
                    min="1"
                    step="any"
                    className="form-input font-mono"
                    style={{
                      paddingLeft: '2.4rem',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                {/* Quick Presets in Monochrome */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                  {[500, 1000, 2000, 5000, 10000, 25000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.55rem',
                        background: amount === val.toString() ? '#ffffff' : '#181818',
                        color: amount === val.toString() ? '#000000' : '#888888',
                        borderColor: amount === val.toString() ? '#ffffff' : '#2e2e2e',
                        fontWeight: amount === val.toString() ? 700 : 500
                      }}
                      onClick={() => setAmount(val.toString())}
                    >
                      +₹{val.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method simulation */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span>Funding Channel</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-xs)',
                      border: `1px solid ${paymentMethod === 'upi' ? '#ffffff' : 'var(--border-subtle)'}`,
                      background: paymentMethod === 'upi' ? '#1c1c1c' : '#0d0d0d',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Zap size={15} color="#ffffff" />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Instant UPI / IMPS</div>
                      <div style={{ fontSize: '0.68rem', color: '#777777' }}>Direct Ledger Credit</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-xs)',
                      border: `1px solid ${paymentMethod === 'bank' ? '#ffffff' : 'var(--border-subtle)'}`,
                      background: paymentMethod === 'bank' ? '#1c1c1c' : '#0d0d0d',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ShieldCheck size={15} color="#888888" />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Corporate Netbanking</div>
                      <div style={{ fontSize: '0.68rem', color: '#777777' }}>Automated Settlement</div>
                    </div>
                  </button>
                </div>
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
                id="btn-confirm-deposit"
                type="submit"
                className="btn btn-primary"
                disabled={loading || Number(amount) <= 0}
              >
                {loading ? 'Crediting Ledger...' : `Deposit ₹${Number(amount || 0).toLocaleString('en-IN')}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
