import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, Shield } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && !name.trim()) {
      setError('Full name is required');
      return;
    }

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoType) => {
    if (demoType === 'user1') {
      setEmail('alex@example.com');
      setPassword('password123');
      setName('Alex Mercer');
    } else if (demoType === 'user2') {
      setEmail('sarah@example.com');
      setPassword('password123');
      setName('Sarah Connor');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        {/* Modal Header */}
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
              <Shield size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                {mode === 'login' ? 'SIGN IN TO FLUXPAY' : 'CREATE ACCOUNT'}
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {mode === 'login'
                  ? 'Access ledger accounts & transactions'
                  : 'Get started with double-entry ledger'}
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-icon btn-sm"
            onClick={onClose}
            style={{ borderRadius: 'var(--radius-xs)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          background: '#0d0d0d',
          padding: '0.25rem',
          margin: '1.25rem 1.5rem 0 1.5rem',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: mode === 'login' ? '#222222' : 'transparent',
              color: mode === 'login' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'var(--transition)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: mode === 'register' ? '#222222' : 'transparent',
              color: mode === 'register' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'var(--transition)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
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
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">
                  <span>Full Name</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="input-name"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="e.g. Satya Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <span>Email Address</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="input-email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Password</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MIN. 6 CHARS</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="input-password"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Quick Demo Pre-fill helper */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-xs)',
              background: '#0d0d0d',
              border: '1px dashed var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                Quick Test Credentials:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', background: '#1c1c1c' }}
                  onClick={() => handleQuickDemo('user1')}
                >
                  Alex Mercer
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', background: '#1c1c1c' }}
                  onClick={() => handleQuickDemo('user2')}
                >
                  Sarah Connor
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              id="btn-auth-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
