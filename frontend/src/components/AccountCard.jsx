import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Send, BookOpen, CreditCard, PlusCircle } from 'lucide-react';

export default function AccountCard({
  account,
  balance,
  isLoadingBalance,
  onRefreshBalance,
  onOpenTransfer,
  onOpenDeposit,
  onOpenLedger,
  isSelected,
  onSelect
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(account._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedBalance = typeof balance === 'number'
    ? balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '---';

  return (
    <div
      onClick={onSelect}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        background: isSelected ? '#181818' : '#131313',
        border: `1px solid ${isSelected ? '#ffffff' : 'var(--border-subtle)'}`,
        boxShadow: isSelected ? '0 8px 30px rgba(0, 0, 0, 0.8)' : 'none',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'var(--transition)',
        overflow: 'hidden'
      }}
    >
      {/* Top Bar: Card Brand & Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '28px',
            height: '20px',
            borderRadius: '4px',
            background: '#222222',
            border: '1px solid #383838',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <CreditCard size={12} />
          </div>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '1.2px',
            textTransform: 'uppercase'
          }}>
            VAHA LEDGER ACCOUNT
          </span>
        </div>

        <span className="badge" style={{
          background: account.status === 'ACTIVE' ? '#222222' : '#181818',
          border: '1px solid #383838',
          color: '#ffffff',
          fontSize: '0.68rem',
          padding: '2px 8px'
        }}>
          {account.status}
        </span>
      </div>

      {/* Account Number & 1-Click Copy */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          marginBottom: '0.3rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          ACCOUNT IDENTIFIER
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#0a0a0a',
          padding: '0.4rem 0.65rem',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-subtle)',
          width: 'fit-content'
        }}>
          <span className="font-mono" style={{ fontSize: '0.82rem', color: '#f4f2ed', letterSpacing: '0.04em' }}>
            {account._id}
          </span>
          <button
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 6px', fontSize: '0.68rem', background: '#1c1c1c', border: '1px solid #333' }}
            title="Copy Account ID"
          >
            {copied ? <Check size={12} color="#ffffff" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Balance Row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        padding: '0.75rem 0',
        borderTop: '1px solid #1c1c1c',
        borderBottom: '1px solid #1c1c1c'
      }}>
        <div>
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.2rem'
          }}>
            NET LEDGER BALANCE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span style={{ fontSize: '1.1rem', color: '#888888', fontWeight: 500 }}>₹</span>
            <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {isLoadingBalance ? '...' : formattedBalance}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#777777', textTransform: 'uppercase' }}>
              {account.currency || 'INR'}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRefreshBalance(account._id);
          }}
          className="btn btn-secondary btn-icon btn-sm"
          title="Refresh Balance"
          style={{ borderRadius: 'var(--radius-xs)', background: '#181818', border: '1px solid #2e2e2e' }}
        >
          <RefreshCw size={13} className={isLoadingBalance ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr 1fr',
        gap: '0.5rem'
      }}>
        <button
          id={`btn-deposit-${account._id}`}
          className="btn btn-emerald btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDeposit(account);
          }}
          disabled={account.status !== 'ACTIVE'}
          style={{ width: '100%', padding: '0.5rem 0.4rem', fontSize: '0.78rem' }}
          title="Deposit funds into this account"
        >
          <PlusCircle size={13} strokeWidth={2.5} />
          Add Money
        </button>

        <button
          id={`btn-transfer-${account._id}`}
          className="btn btn-secondary btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenTransfer(account);
          }}
          disabled={account.status !== 'ACTIVE'}
          style={{ width: '100%', padding: '0.5rem 0.4rem', fontSize: '0.78rem' }}
          title="Transfer funds"
        >
          <Send size={13} />
          Send
        </button>

        <button
          id={`btn-ledger-${account._id}`}
          className="btn btn-secondary btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenLedger(account);
          }}
          style={{ width: '100%', padding: '0.5rem 0.4rem', fontSize: '0.78rem' }}
          title="View ledger audit trail"
        >
          <BookOpen size={13} />
          Ledger
        </button>
      </div>
    </div>
  );
}
