import React from 'react';
import { ShieldCheck, LogOut, User, PlusCircle, Sparkles, Building2 } from 'lucide-react';

export default function Navbar({
  user,
  onOpenAuth,
  onLogout,
  onCreateAccount,
  onOpenMintModal,
  isCreatingAccount
}) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: '#0a0a0a',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.9rem 0'
    }}>
      <div className="app-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0a0a0a'
          }}>
            <Building2 size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: '#ffffff'
              }}>
                FLUXPAY
              </span>
              <span style={{
                fontSize: '0.62rem',
                padding: '2px 5px',
                borderRadius: 'var(--radius-xs)',
                background: '#1c1c1c',
                color: '#f4f2ed',
                fontWeight: 700,
                border: '1px solid var(--border-subtle)'
              }}>
                CORE
              </span>
            </div>
            <p style={{
              fontSize: '0.68rem',
              color: 'var(--text-secondary)',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Double-Entry Financial Architecture
            </p>
          </div>
        </div>

        {/* User actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              {/* System User Mint button */}
              {user.systemUser && (
                <button
                  id="btn-open-mint"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenMintModal}
                  title="Mint & distribute initial bootstrap funds"
                >
                  <Sparkles size={14} />
                  System Mint
                </button>
              )}

              {/* Create Account Button */}
              <button
                id="btn-create-account"
                className="btn btn-secondary btn-sm"
                onClick={onCreateAccount}
                disabled={isCreatingAccount}
              >
                <PlusCircle size={14} className={isCreatingAccount ? 'animate-spin' : ''} />
                {isCreatingAccount ? 'Creating...' : 'New Account'}
              </button>

              {/* User Chip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: '#141414',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-xs)',
                  background: '#242424',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <User size={13} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: '#ffffff'
                  }}>
                    {user.name}
                    {user.systemUser && (
                      <span className="badge badge-system" style={{ fontSize: '0.58rem', padding: '1px 5px' }}>
                        <ShieldCheck size={9} /> SYSTEM
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <button
                id="btn-signout"
                className="btn btn-secondary btn-icon btn-sm"
                onClick={onLogout}
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button
              id="btn-signin"
              className="btn btn-primary"
              onClick={onOpenAuth}
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
