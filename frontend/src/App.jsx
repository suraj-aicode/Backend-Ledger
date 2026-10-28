import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import AccountCard from './components/AccountCard';
import TransferModal from './components/TransferModal';
import SystemMintModal from './components/SystemMintModal';
import DepositModal from './components/DepositModal';
import LedgerModal from './components/LedgerModal';
import TransactionsTable from './components/TransactionsTable';
import Footer from './components/Footer';
import Toast from './components/Toast';
import { api, setAuthToken } from './services/api';
import './App.css';

import {
  Wallet,
  Activity,
  ShieldCheck,
  Plus,
  PlusCircle,
  Send,
  BookOpen,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Database
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [loadingBalances, setLoadingBalances] = useState({});
  const [transactions, setTransactions] = useState([]);

  // Modals & UI State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAccount, setDepositAccount] = useState(null);
  const [isMintOpen, setIsMintOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeLedgerAccount, setActiveLedgerAccount] = useState(null);

  // Loading States
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch single account balance
  const fetchBalance = useCallback(async (accountId) => {
    try {
      setLoadingBalances((prev) => ({ ...prev, [accountId]: true }));
      const res = await api.getBalance(accountId);
      setBalances((prev) => ({ ...prev, [accountId]: res.balance ?? 0 }));
    } catch (err) {
      console.error(`Failed to fetch balance for ${accountId}:`, err);
    } finally {
      setLoadingBalances((prev) => ({ ...prev, [accountId]: false }));
    }
  }, []);

  // Fetch all user accounts
  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoadingAccounts(true);
      const res = await api.getAccounts();
      const list = res.accounts || [];
      setAccounts(list);

      if (list.length > 0 && !selectedAccount) {
        setSelectedAccount(list[0]);
      }

      // Fetch balances for each account
      list.forEach((acc) => {
        fetchBalance(acc._id);
      });
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [fetchBalance, selectedAccount]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoadingTransactions(true);
      const res = await api.getTransactions();
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  // Initialize Auth state on mount
  useEffect(() => {
    async function initUser() {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
        }
      } catch (err) {
        console.warn('Session expired or invalid, signing out');
        setAuthToken(null);
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    }
    initUser();
  }, []);

  // When user is authenticated, load data
  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchTransactions();
    } else {
      setAccounts([]);
      setBalances({});
      setTransactions([]);
    }
  }, [user, fetchAccounts, fetchTransactions]);

  // Auth Handlers
  const handleLogin = async (email, password) => {
    const res = await api.login(email, password);
    setAuthToken(res.token);
    setUser(res.user);
    addToast(`Welcome back, ${res.user.name}!`, 'success');
  };

  const handleRegister = async (name, email, password) => {
    const res = await api.register(name, email, password);
    setAuthToken(res.token);
    setUser(res.user);
    addToast(`Account created for ${res.user.name}!`, 'success');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    } finally {
      setAuthToken(null);
      setUser(null);
      addToast('Signed out successfully.', 'info');
    }
  };

  // Create new ledger account
  const handleCreateAccount = async () => {
    try {
      setIsCreatingAccount(true);
      const res = await api.createAccount();
      addToast('New ledger account created!', 'success');
      fetchAccounts();
    } catch (err) {
      addToast(err.message || 'Failed to create account', 'error');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Action handlers
  const handleOpenTransfer = (account) => {
    setSelectedAccount(account);
    setIsTransferOpen(true);
  };

  const handleOpenDeposit = (account) => {
    setDepositAccount(account);
    setIsDepositOpen(true);
  };

  const handleOpenLedger = (account) => {
    setActiveLedgerAccount(account);
    setIsLedgerOpen(true);
  };

  const handleTransferSuccess = () => {
    addToast('Transfer settled successfully!', 'success');
    fetchAccounts();
    fetchTransactions();
  };

  const handleDepositSuccess = () => {
    addToast('Funds deposited successfully!', 'success');
    fetchAccounts();
    fetchTransactions();
  };

  const handleMintSuccess = () => {
    addToast('System liquidity credited successfully!', 'success');
    fetchAccounts();
    fetchTransactions();
  };

  // Compute aggregate totals
  const totalBalance = Object.values(balances).reduce((acc, curr) => acc + (curr || 0), 0);
  const userAccountIds = accounts.map((a) => a._id);

  return (
    <>
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onCreateAccount={handleCreateAccount}
        onOpenMintModal={() => setIsMintOpen(true)}
        isCreatingAccount={isCreatingAccount}
      />

      <main className="app-container" style={{ flex: 1, paddingBottom: '4rem' }}>
        {isLoadingUser ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <Activity size={32} color="#ffffff" />
            </div>
            <div style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              INITIALIZING VAHA ARCHITECTURE...
            </div>
          </div>
        ) : !user ? (
          /* Landing Page for Unauthenticated Visitors */
          <div className="landing-hero">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.9rem',
              borderRadius: 'var(--radius-xs)',
              background: '#161616',
              border: '1px solid #333333',
              fontSize: '0.72rem',
              color: '#ffffff',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: '1.75rem'
            }}>
              <ShieldCheck size={14} />
              ARCHITECTURAL DOUBLE-ENTRY LEDGER SYSTEM
            </div>

            <h1 style={{
              fontSize: '3.4rem',
              lineHeight: 1.08,
              marginBottom: '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff'
            }}>
              HOW WE BUILD PRACTICAL <br />
              HIGH-INTEGRITY FINANCIAL SYSTEMS
            </h1>

            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.6
            }}>
              At Fluxpay, we prioritize robust accounting design, low maintenance, and total auditability. Powered by MongoDB ACID transactions, idempotent transfers, and double-entry ledger immutability.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                id="btn-landing-get-started"
                className="btn btn-primary"
                style={{ padding: '0.85rem 2.2rem', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.5px' }}
                onClick={() => setIsAuthOpen(true)}
              >
                ACCESS LEDGER CONSOLE
                <ArrowRight size={17} />
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="landing-features">
              <div className="feature-box">
                <div className="feature-icon">
                  <Layers size={18} />
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  DOUBLE-ENTRY LEDGER
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Every transaction generates balanced debit and credit entries. Real-time balance is calculated dynamically from the ledger.
                </p>
              </div>

              <div className="feature-box">
                <div className="feature-icon">
                  <Lock size={18} />
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  IDEMPOTENCY GUARANTEE
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Every money movement requires an idempotency key. Network retries will never charge the sender twice.
                </p>
              </div>

              <div className="feature-box">
                <div className="feature-icon">
                  <Database size={18} />
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  IMMUTABLE RECORDS
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Ledger modifications and deletions are intercepted and blocked at the model layer to preserve audit compliance.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="dashboard-hero">
            {/* Stat Row */}
            <div className="stat-grid">
              {/* Total Balance Card */}
              <div className="stat-card">
                <div className="stat-icon">
                  <Wallet size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    PORTFOLIO BALANCE
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <span style={{ fontSize: '1.05rem', color: '#777777', fontWeight: 500 }}>₹</span>
                    <span className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
                      {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#888888', textTransform: 'uppercase' }}>INR</span>
                  </div>
                </div>
              </div>

              {/* Accounts Count */}
              <div className="stat-card">
                <div className="stat-icon">
                  <Layers size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ACTIVE ACCOUNTS
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
                    {accounts.length}
                  </div>
                </div>
              </div>

              {/* Transactions Count */}
              <div className="stat-card">
                <div className="stat-icon">
                  <Activity size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    SETTLED TRANSACTIONS
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
                    {transactions.length}
                  </div>
                </div>
              </div>

              {/* System Authority Status */}
              <div className="stat-card">
                <div className="stat-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    OPERATOR TIER
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                    {user.systemUser ? (
                      <span className="badge badge-system">
                        SYSTEM OPERATOR
                      </span>
                    ) : (
                      <span style={{ color: '#888888', textTransform: 'uppercase', fontSize: '0.8rem' }}>STANDARD USER</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Accounts Section Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem'
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#ffffff' }}>
                  YOUR LEDGER ACCOUNTS
                </h2>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Select an account to initiate transfers or audit ledger entries
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  id="btn-header-deposit"
                  className="btn btn-emerald btn-sm"
                  onClick={() => handleOpenDeposit(selectedAccount || accounts[0])}
                  disabled={accounts.length === 0}
                >
                  <PlusCircle size={14} />
                  Add Money / Deposit
                </button>

                <button
                  id="btn-header-create-account"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCreateAccount}
                  disabled={isCreatingAccount}
                >
                  <Plus size={14} className={isCreatingAccount ? 'animate-spin' : ''} />
                  {isCreatingAccount ? 'Creating...' : 'Open New Account'}
                </button>
              </div>
            </div>

            {/* Accounts Grid */}
            {isLoadingAccounts ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <Activity size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Fetching account ledgers...</div>
              </div>
            ) : accounts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                background: '#121212',
                border: '1px solid var(--border-subtle)'
              }}>
                <Wallet size={40} color="#ffffff" style={{ opacity: 0.8, margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NO ACCOUNTS CREATED</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                  Create your first ledger account to start receiving funds and recording immutable financial transactions.
                </p>
                <button
                  id="btn-empty-create-account"
                  className="btn btn-primary"
                  onClick={handleCreateAccount}
                  disabled={isCreatingAccount}
                >
                  <Plus size={15} />
                  Create First Account
                </button>
              </div>
            ) : (
              <div className="accounts-grid">
                {accounts.map((acc) => (
                  <AccountCard
                    key={acc._id}
                    account={acc}
                    balance={balances[acc._id]}
                    isLoadingBalance={loadingBalances[acc._id]}
                    onRefreshBalance={fetchBalance}
                    onOpenTransfer={handleOpenTransfer}
                    onOpenDeposit={handleOpenDeposit}
                    onOpenLedger={handleOpenLedger}
                    isSelected={selectedAccount?._id === acc._id}
                    onSelect={() => setSelectedAccount(acc)}
                  />
                ))}

                {/* Quick Add Account Card */}
                <div
                  className="new-account-card"
                  onClick={handleCreateAccount}
                  title="Create additional account"
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    marginBottom: '0.75rem'
                  }}>
                    <Plus size={20} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    Open Account
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Multi-account ledger isolation
                  </div>
                </div>
              </div>
            )}

            {/* Transactions History Feed */}
            <TransactionsTable
              transactions={transactions}
              userAccountIds={userAccountIds}
              isLoading={isLoadingTransactions}
              onRefresh={fetchTransactions}
            />
          </div>
        )}
      </main>

      {/* Persistent Architectural Footer */}
      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts}
        selectedAccount={selectedAccount}
        balances={balances}
        onTransferSuccess={handleTransferSuccess}
        api={api}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        account={depositAccount}
        accounts={accounts}
        onDepositSuccess={handleDepositSuccess}
        api={api}
      />

      <SystemMintModal
        isOpen={isMintOpen}
        onClose={() => setIsMintOpen(false)}
        accounts={accounts}
        onMintSuccess={handleMintSuccess}
        api={api}
      />

      <LedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        account={activeLedgerAccount}
        api={api}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
