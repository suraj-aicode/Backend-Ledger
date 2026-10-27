import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.15rem',
              borderRadius: 'var(--radius-xs)',
              background: '#161616',
              border: `1px solid ${isSuccess ? '#ffffff' : isError ? '#592e2e' : '#333333'}`,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
              color: '#f4f2ed',
              minWidth: '280px',
              maxWidth: '420px',
              animation: 'slideUp 0.15s ease-out'
            }}
          >
            {isSuccess && <CheckCircle2 size={16} color="#ffffff" />}
            {isError && <AlertCircle size={16} color="#fca5a5" />}
            {!isSuccess && !isError && <Info size={16} color="#ffffff" />}

            <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>
              {toast.message}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#777777',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
