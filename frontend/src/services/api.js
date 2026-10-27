const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthToken() {
  return localStorage.getItem('token') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.message || `Request failed with status ${res.status}`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  // Auth
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request('/auth/me'),

  // Accounts
  getAccounts: () => request('/account'),

  createAccount: () =>
    request('/account/create-account', {
      method: 'POST',
    }),

  getBalance: (accountId) => request(`/account/balance/${accountId}`),

  getLedger: (accountId) => request(`/account/ledger/${accountId}`),

  // Transactions
  getTransactions: () => request('/transaction'),

  createTransaction: ({ fromAccount, toAccount, amount, idempotencyKey }) =>
    request('/transaction', {
      method: 'POST',
      body: JSON.stringify({
        fromAccount,
        toAccount,
        amount: Number(amount),
        idempotencyKey,
      }),
    }),

  initiateSystemFunds: ({ toAccount, amount, idempotencyKey }) =>
    request('/transaction/system/initiate-funds', {
      method: 'POST',
      body: JSON.stringify({
        toAccount,
        amount: Number(amount),
        idempotencyKey,
      }),
    }),
};
