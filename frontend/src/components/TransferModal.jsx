import React, { useState, useEffect } from 'react';
import { X, Send, KeyRound, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

function generateIdempotencyKey() {
  return 'ik_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

export default function TransferModal({
  isOpen,
  onClose,
  accounts,
  selectedAccount,
  balances,
  onTransferSuccess,
  api
}) {
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (selectedAccount) {
      setFromAccount(selectedAccount._id);
    } else if (accounts && accounts.length > 0) {
      setFromAccount(accounts[0]._id);
    }
    setIdempotencyKey(generateIdempotencyKey());
    setError('');
    setSuccessData(null);
  }, [isOpen, selectedAccount, accounts]);

  if (!isOpen) return null;

  const currentFromBalance = balances[fromAccount] ?? 0;
  const isInsufficient = Number(amount) > currentFromBalance;

  const handlePresetAmount = (val) => {
    setAmount(val.toString());
  };

  const handleMaxAmount = () => {
    if (currentFromBalance > 0) {
      setAmount(currentFromBalance.toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
      setError('Please fill in all transaction fields.');
      return;
    }

    if (fromAccount === toAccount) {
      setError('Sender and recipient accounts cannot be identical.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Transaction amount must be greater than 0.');
      return;
    }

    if (numAmount > currentFromBalance) {
      setError(`Insufficient balance. Available: ₹${currentFromBalance}, Requested: ₹${numAmount}`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.createTransaction({
        fromAccount,
        toAccount,
        amount: numAmount,
        idempotencyKey,
      });

      setSuccessData(res.transaction);
      onTransferSuccess && onTransferSuccess(res);
    } catch (err) {
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setAmount('');
    setToAccount('');
    setError('');
    setSuccessData(null);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={resetAndClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
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
              <Send size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}>SEND FUNDS</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Atomic double-entry ledger transfer
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-icon btn-sm"
            onClick={resetAndClose}
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
              <CheckCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
              TRANSFER COMPLETED
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Debited & credited atomically in a MongoDB ACID session.
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
                <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
                <span className="font-mono">{successData._id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>₹{successData.amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className="badge badge-completed">{successData.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Idempotency Key:</span>
                <span className="font-mono" style={{ fontSize: '0.72rem', color: '#888888' }}>{successData.idempotencyKey || successData.itempotencyKey}</span>
              </div>
            </div>

            <button
              id="btn-transfer-done"
              className="btn btn-primary"
              onClick={resetAndClose}
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
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {/* From Account Select */}
              <div className="form-group">
                <label className="form-label">
                  <span>Source Account</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>
                    AVAILABLE: ₹{currentFromBalance.toLocaleString('en-IN')}
                  </span>
                </label>
                <select
                  id="select-from-account"
                  className="form-select font-mono"
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc._id} — ₹{(balances[acc._id] ?? 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Account Input */}
              <div className="form-group">
                <label className="form-label">
                  <span>Recipient Account ID</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>24-char ObjectId</span>
                </label>
                <input
                  id="input-to-account"
                  type="text"
                  className="form-input font-mono"
                  placeholder="Paste recipient account ID"
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value.trim())}
                  required
                />

                {/* Quick selector if user has other accounts */}
                {accounts.filter((a) => a._id !== fromAccount).length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Or select own account:</span>
                    {accounts
                      .filter((a) => a._id !== fromAccount)
                      .map((a) => (
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
                  <span>Transfer Amount</span>
                  {isInsufficient && (
                    <span style={{ color: '#fca5a5', fontSize: '0.72rem' }}>
                      Exceeds available balance
                    </span>
                  )}
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
                    id="input-transfer-amount"
                    type="number"
                    min="1"
                    step="any"
                    className="form-input font-mono"
                    style={{
                      paddingLeft: '2.4rem',
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      borderColor: isInsufficient ? '#7f1d1d' : undefined
                    }}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                {/* Quick Amount Chips */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {[100, 500, 1000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                      onClick={() => handlePresetAmount(val)}
                    >
                      +₹{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', color: '#ffffff' }}
                    onClick={handleMaxAmount}
                    disabled={currentFromBalance <= 0}
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Idempotency Key */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KeyRound size={12} color="#888888" />
                    Idempotency Key (Guarantees Exactly-Once Transfer)
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
                  id="input-idempotency-key"
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
                onClick={resetAndClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-transfer"
                type="submit"
                className="btn btn-primary"
                disabled={loading || isInsufficient || Number(amount) <= 0}
              >
                {loading ? 'Processing...' : 'Confirm & Transfer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
