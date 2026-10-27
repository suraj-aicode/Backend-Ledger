import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Search, RefreshCw, CheckCircle2, Clock, AlertOctagon, RotateCcw } from 'lucide-react';

export default function TransactionsTable({
  transactions,
  userAccountIds,
  isLoading,
  onRefresh
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = (transactions || []).filter((tx) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fromId = (tx.fromAccount?._id || tx.fromAccount || '').toString().toLowerCase();
    const toId = (tx.toAccount?._id || tx.toAccount || '').toString().toLowerCase();
    const txId = (tx._id || '').toString().toLowerCase();
    const idempotency = (tx.idempotencyKey || tx.itempotencyKey || '').toLowerCase();
    return fromId.includes(term) || toId.includes(term) || txId.includes(term) || idempotency.includes(term);
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 size={12} color="#ffffff" />;
      case 'PENDING':
        return <Clock size={12} color="#a1a1aa" />;
      case 'REVERSED':
        return <RotateCcw size={12} color="#71717a" />;
      default:
        return <AlertOctagon size={12} color="#71717a" />;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem', background: '#121212', borderRadius: 'var(--radius-md)' }}>
      {/* Table Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff' }}>
            TRANSACTION AUDIT STREAM
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Real-time double-entry settlement feed
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={13} style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              className="form-input"
              style={{
                paddingLeft: '2rem',
                paddingTop: '0.4rem',
                paddingBottom: '0.4rem',
                fontSize: '0.8rem',
                background: '#0d0d0d',
                borderColor: '#292929'
              }}
              placeholder="Search by ID or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-icon btn-sm"
            title="Refresh Transactions"
            style={{ borderRadius: 'var(--radius-xs)', background: '#181818', border: '1px solid #2e2e2e' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontSize: '0.85rem' }}>Loading transactions...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--text-muted)',
          background: '#0e0e0e',
          borderRadius: 'var(--radius-xs)',
          border: '1px dashed var(--border-subtle)'
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            NO TRANSACTIONS RECORDED
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: '#555555' }}>
            {searchTerm
              ? 'Try modifying your search term.'
              : 'Add money or transfer funds to view transactions here.'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.82rem'
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid #242424',
                color: 'var(--text-secondary)',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                <th style={{ padding: '0.75rem 0.85rem' }}>Type</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Amount</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>From Account</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>To Account</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Status</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const fromId = tx.fromAccount?._id || tx.fromAccount || '';
                const toId = tx.toAccount?._id || tx.toAccount || '';
                const isDebit = userAccountIds.includes(fromId);
                const isCredit = userAccountIds.includes(toId);

                return (
                  <tr
                    key={tx._id}
                    style={{
                      borderBottom: '1px solid #1c1c1c',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#181818';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Direction / Type */}
                    <td style={{ padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: 'var(--radius-xs)',
                          background: '#1f1f1f',
                          border: '1px solid #333333',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isCredit && !isDebit ? (
                            <ArrowDownLeft size={14} />
                          ) : isDebit && !isCredit ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <RefreshCw size={12} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#f4f2ed', textTransform: 'uppercase' }}>
                            {isCredit && !isDebit
                              ? 'Received'
                              : isDebit && !isCredit
                              ? 'Sent'
                              : 'Internal Transfer'}
                          </div>
                          <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {tx._id ? tx._id.substring(tx._id.length - 8) : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '0.85rem' }}>
                      <div className="font-mono" style={{
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        color: '#ffffff'
                      }}>
                        {isCredit && !isDebit ? '+' : isDebit && !isCredit ? '−' : ''}
                        ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    {/* From Account */}
                    <td style={{ padding: '0.85rem' }}>
                      <span className="font-mono" style={{
                        fontSize: '0.75rem',
                        color: isDebit ? '#ffffff' : '#888888'
                      }}>
                        {fromId ? fromId.toString().substring(0, 10) + '...' : 'System'}
                      </span>
                    </td>

                    {/* To Account */}
                    <td style={{ padding: '0.85rem' }}>
                      <span className="font-mono" style={{
                        fontSize: '0.75rem',
                        color: isCredit ? '#ffffff' : '#888888'
                      }}>
                        {toId ? toId.toString().substring(0, 10) + '...' : 'System'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.85rem' }}>
                      <span className={`badge badge-${(tx.status || 'pending').toLowerCase()}`}>
                        {getStatusIcon(tx.status)}
                        {tx.status}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td style={{ padding: '0.85rem', color: '#777777', fontSize: '0.72rem' }}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Recent'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
