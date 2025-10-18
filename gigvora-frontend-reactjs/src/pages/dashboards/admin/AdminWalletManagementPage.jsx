import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import WalletSummary from '../../../components/admin/wallet/WalletSummary.jsx';
import WalletAccountFilters from '../../../components/admin/wallet/WalletAccountFilters.jsx';
import WalletAccountsTable from '../../../components/admin/wallet/WalletAccountsTable.jsx';
import WalletAccountCreateForm from '../../../components/admin/wallet/WalletAccountCreateForm.jsx';
import WalletAccountDetailPanel from '../../../components/admin/wallet/WalletAccountDetailPanel.jsx';
import {
  fetchWalletAccounts,
  fetchWalletAccount,
  createWalletAccount,
  updateWalletAccount,
  fetchWalletLedger,
  createWalletLedgerEntry,
} from '../../../services/adminWallet.js';

const MENU_SECTIONS = [
  {
    label: 'Wallet',
    items: [
      { id: 'wallet-summary', name: 'Summary', sectionId: 'wallet-summary' },
      { id: 'wallet-accounts', name: 'Accounts', sectionId: 'wallet-accounts' },
      { id: 'wallet-ledger', name: 'Ledger', sectionId: 'wallet-ledger' },
    ],
  },
  {
    label: 'Back',
    items: [{ id: 'admin-home', name: 'Admin', href: '/dashboard/admin' }],
  },
];

const AVAILABLE_DASHBOARDS = ['admin', 'company', 'freelancer', 'user'];

export default function AdminWalletManagementPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ page: 1, pageSize: 20, sort: 'recent' });
  const [accountsData, setAccountsData] = useState({ accounts: [], pagination: null, summary: null });
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState('');

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [updateError, setUpdateError] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const [createStatus, setCreateStatus] = useState({ error: '', loading: false });
  const [createResetKey, setCreateResetKey] = useState(0);

  const [ledgerState, setLedgerState] = useState({ entries: [], pagination: null });
  const [ledgerFilters, setLedgerFilters] = useState({ page: 1, pageSize: 25, entryType: undefined, search: '' });
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerMutationStatus, setLedgerMutationStatus] = useState({ loading: false, error: '' });
  const [ledgerResetKey, setLedgerResetKey] = useState(0);

  const [view, setView] = useState('wallet-summary');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setAccountsError('');
    try {
      const response = await fetchWalletAccounts(filters);
      setAccountsData({
        accounts: response.accounts ?? [],
        pagination: response.pagination ?? null,
        summary: response.summary ?? null,
      });
    } catch (error) {
      setAccountsError(error?.message ?? 'Unable to load wallet accounts.');
    } finally {
      setLoadingAccounts(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleFiltersChange = (nextFilters) => {
    setFilters((previous) => ({ ...previous, ...nextFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, pageSize: 20, sort: 'recent' });
  };

  const handleSelectAccount = async (account) => {
    if (!account) {
      setSelectedAccount(null);
      setView('wallet-accounts');
      return;
    }
    try {
      const detailed = await fetchWalletAccount(account.id);
      setSelectedAccount(detailed ?? account);
    } catch (error) {
      setSelectedAccount(account);
    }
    setUpdateError('');
    setLedgerFilters({ page: 1, pageSize: 25, entryType: undefined, search: '' });
    setView('wallet-ledger');
  };

  const loadLedger = useCallback(
    async (accountId, params = {}) => {
      if (!accountId) {
        setLedgerState({ entries: [], pagination: null });
        return;
      }
      setLedgerLoading(true);
      try {
        const response = await fetchWalletLedger(accountId, params);
        setLedgerState({
          entries: response.entries ?? [],
          pagination: response.pagination ?? null,
        });
      } catch (error) {
        setLedgerState({ entries: [], pagination: null });
      } finally {
        setLedgerLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedAccount || view !== 'wallet-ledger') {
      return;
    }
    loadLedger(selectedAccount.id, ledgerFilters);
  }, [selectedAccount?.id, ledgerFilters, loadLedger, view]);

  const handleCreateAccount = async (payload) => {
    setCreateStatus({ loading: true, error: '' });
    try {
      await createWalletAccount(payload);
      setCreateStatus({ loading: false, error: '' });
      setCreateResetKey((key) => key + 1);
      setCreateOpen(false);
      setToast({ type: 'success', message: 'Wallet created' });
      await loadAccounts();
    } catch (error) {
      setCreateStatus({ loading: false, error: error?.message ?? 'Unable to create wallet account.' });
    }
  };

  const handleUpdateAccount = async (accountId, payload) => {
    setUpdateError('');
    setUpdateLoading(true);
    try {
      const updated = await updateWalletAccount(accountId, payload);
      setSelectedAccount(updated);
      setToast({ type: 'success', message: 'Wallet saved' });
      await loadAccounts();
    } catch (error) {
      setUpdateError(error?.message ?? 'Unable to update wallet account.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCreateLedgerEntry = async (payload) => {
    if (!selectedAccount) {
      return;
    }
    setLedgerMutationStatus({ loading: true, error: '' });
    try {
      await createWalletLedgerEntry(selectedAccount.id, payload);
      setLedgerMutationStatus({ loading: false, error: '' });
      setLedgerResetKey((key) => key + 1);
      setToast({ type: 'success', message: 'Ledger entry posted' });
      loadLedger(selectedAccount.id, ledgerFilters);
      loadAccounts();
    } catch (error) {
      setLedgerMutationStatus({ loading: false, error: error?.message ?? 'Unable to post ledger entry.' });
    }
  };

  const handleLedgerFilterChange = (nextFilters) => {
    setLedgerFilters((previous) => ({ ...previous, ...nextFilters }));
  };

  const handleLedgerPageChange = (nextPage) => {
    setLedgerFilters((previous) => ({ ...previous, page: nextPage }));
  };

  const handleMenuSelect = useCallback(
    (itemId, item) => {
      if (item?.href) {
        navigate(item.href);
        return;
      }
      if (item?.sectionId) {
        setView(item.sectionId);
      }
    },
    [navigate],
  );

  const summary = useMemo(() => accountsData.summary ?? {}, [accountsData.summary]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const renderView = () => {
    if (view === 'wallet-summary') {
      return <WalletSummary globalSummary={summary?.global} filteredSummary={summary?.filtered} />;
    }

    if (view === 'wallet-accounts') {
      return (
        <div className="space-y-4">
          {accountsError ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{accountsError}</div>
          ) : null}
          <WalletAccountsTable
            accounts={accountsData.accounts}
            pagination={accountsData.pagination}
            onPageChange={(page) => handleFiltersChange({ page })}
            onSelect={handleSelectAccount}
            selectedAccountId={selectedAccount?.id ?? null}
            loading={loadingAccounts}
            onRefresh={loadAccounts}
          />
        </div>
      );
    }

    if (view === 'wallet-ledger') {
      return (
        <div className="space-y-4">
          <WalletAccountDetailPanel
            account={selectedAccount}
            onUpdate={handleUpdateAccount}
            updating={updateLoading}
            updateError={updateError}
            ledger={ledgerState}
            ledgerLoading={ledgerLoading}
            ledgerFilters={ledgerFilters}
            onLedgerFiltersChange={handleLedgerFilterChange}
            onLedgerPageChange={handleLedgerPageChange}
            onCreateLedgerEntry={handleCreateLedgerEntry}
            ledgerMutationLoading={ledgerMutationStatus.loading}
            ledgerMutationError={ledgerMutationStatus.error}
            onBack={() => setView('wallet-accounts')}
            ledgerFormResetKey={ledgerResetKey}
            initialTab="ledger"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Wallet"
      subtitle="Control"
      description=""
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      sections={[]}
      activeMenuItem={view}
      onMenuItemSelect={handleMenuSelect}
    >
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white p-1 shadow">
              {MENU_SECTIONS[0].items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.sectionId)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    view === item.sectionId ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
              >
                Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateStatus({ error: '', loading: false });
                  setCreateResetKey((key) => key + 1);
                  setCreateOpen(true);
                }}
                className="rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                New
              </button>
            </div>
          </div>

          <section id={view} className="min-h-[420px]">
            {renderView()}
          </section>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-40 flex">
          <div className="hidden flex-1 bg-slate-900/30 sm:block" onClick={() => setFiltersOpen(false)} aria-hidden="true" />
          <div className="w-full max-w-md bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">Filters</h3>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <WalletAccountFilters
                  filters={filters}
                  onChange={(next) => {
                    handleFiltersChange(next);
                  }}
                  onReset={() => {
                    handleResetFilters();
                  }}
                  onRefresh={() => {
                    loadAccounts();
                    setFiltersOpen(false);
                  }}
                  loading={loadingAccounts}
                  variant="drawer"
                />
              </div>
              <div className="border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="w-full rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <div className="hidden flex-1 bg-slate-900/30 md:block" onClick={() => setCreateOpen(false)} aria-hidden="true" />
          <div className="w-full max-w-lg bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              <WalletAccountCreateForm
                onSubmit={handleCreateAccount}
                loading={createStatus.loading}
                error={createStatus.error}
                onCancel={() => setCreateOpen(false)}
                variant="drawer"
                resetKey={createResetKey}
              />
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
