import { useEffect, useMemo, useState } from 'react';
import WalletLedgerTable from './WalletLedgerTable.jsx';
import WalletLedgerEntryForm from './WalletLedgerEntryForm.jsx';

const STATUSES = ['active', 'pending', 'suspended', 'closed'];
const PROVIDERS = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'escrow_com', label: 'Escrow' },
];

function formatCurrency(value, currency = 'USD') {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export default function WalletAccountDetailPanel({
  account,
  onUpdate,
  updating,
  updateError,
  ledger,
  ledgerLoading,
  ledgerFilters,
  onLedgerFiltersChange,
  onLedgerPageChange,
  onCreateLedgerEntry,
  ledgerMutationLoading,
  ledgerMutationError,
  onBack,
  ledgerFormResetKey,
  initialTab = 'settings',
}) {
  const [form, setForm] = useState({
    status: 'active',
    custodyProvider: 'stripe',
    currencyCode: 'USD',
    providerAccountId: '',
    metadataText: '',
  });
  const [metadataError, setMetadataError] = useState('');
  const [activeTab, setActiveTab] = useState('settings');
  const [entryOpen, setEntryOpen] = useState(false);

  useEffect(() => {
    if (!account) {
      return;
    }
    setForm({
      status: account.status ?? 'active',
      custodyProvider: account.custodyProvider ?? 'stripe',
      currencyCode: account.currencyCode ?? 'USD',
      providerAccountId: account.providerAccountId ?? '',
      metadataText: account.metadata ? JSON.stringify(account.metadata, null, 2) : '',
    });
    setMetadataError('');
    setActiveTab(initialTab ?? 'settings');
    setEntryOpen(false);
  }, [account?.id, initialTab]);

  useEffect(() => {
    setEntryOpen(false);
  }, [ledgerFormResetKey]);

  const currency = account?.currencyCode ?? 'USD';
  const balances = useMemo(
    () => ({
      current: formatCurrency(account?.currentBalance ?? 0, currency),
      available: formatCurrency(account?.availableBalance ?? 0, currency),
      holds: formatCurrency(account?.pendingHoldBalance ?? 0, currency),
    }),
    [account?.currentBalance, account?.availableBalance, account?.pendingHoldBalance, currency],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleUpdate = (event) => {
    event.preventDefault();
    if (!account || typeof onUpdate !== 'function') {
      return;
    }
    let metadata;
    if (form.metadataText) {
      try {
        metadata = JSON.parse(form.metadataText);
        if (metadata && typeof metadata !== 'object') {
          throw new Error('metadata must be an object.');
        }
        setMetadataError('');
      } catch (error) {
        setMetadataError(error?.message ?? 'Invalid metadata');
        return;
      }
    } else {
      metadata = null;
      setMetadataError('');
    }
    onUpdate(account.id, {
      status: form.status,
      custodyProvider: form.custodyProvider,
      currencyCode: form.currencyCode,
      providerAccountId: form.providerAccountId?.trim() || null,
      metadata,
    });
  };

  if (!account) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-12 text-sm text-slate-500">
        Choose an account from the table.
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          {typeof onBack === 'function' ? (
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-semibold uppercase tracking-wide text-blue-600 hover:underline"
            >
              Back
            </button>
          ) : null}
          <div>
            <p className="text-sm font-semibold text-slate-500">Wallet #{account.id}</p>
            <h3 className="text-2xl font-semibold text-slate-900">
              {account.user
                ? `${account.user.firstName ?? ''} ${account.user.lastName ?? ''}`.trim() || account.user.email
                : 'Unassigned'}
            </h3>
            <p className="text-sm text-slate-500">{account.accountType} · {account.status}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{balances.current}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Available</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{balances.available}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hold</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{balances.holds}</p>
          </div>
        </div>
      </div>

      <div className="inline-flex flex-wrap gap-2 rounded-full bg-slate-100 p-1">
        {[
          { id: 'settings', label: 'Settings' },
          { id: 'ledger', label: 'Ledger' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'settings' ? (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleUpdate}>
          <div>
            <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="custodyProvider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Provider
            </label>
            <select
              id="custodyProvider"
              name="custodyProvider"
              value={form.custodyProvider}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              {PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="currencyCode" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Currency
            </label>
            <input
              id="currencyCode"
              name="currencyCode"
              value={form.currencyCode}
              onChange={handleChange}
              maxLength={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label htmlFor="providerAccountId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Provider ID
            </label>
            <input
              id="providerAccountId"
              name="providerAccountId"
              value={form.providerAccountId}
              onChange={handleChange}
              maxLength={160}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="metadataText" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Metadata (JSON)
            </label>
            <textarea
              id="metadataText"
              name="metadataText"
              value={form.metadataText}
              onChange={handleChange}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
            {metadataError ? <p className="mt-1 text-xs text-rose-600">{metadataError}</p> : null}
            {updateError ? <p className="mt-2 text-sm text-rose-600">{updateError}</p> : null}
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setForm({
                  status: account.status ?? 'active',
                  custodyProvider: account.custodyProvider ?? 'stripe',
                  currencyCode: account.currencyCode ?? 'USD',
                  providerAccountId: account.providerAccountId ?? '',
                  metadataText: account.metadata ? JSON.stringify(account.metadata, null, 2) : '',
                });
                setMetadataError('');
              }}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={updating}
              className="rounded-full border border-blue-500 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updating ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      ) : null}

      {activeTab === 'ledger' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-lg font-semibold text-slate-900">Ledger</h4>
            <button
              type="button"
              onClick={() => setEntryOpen((value) => !value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                entryOpen ? 'border border-slate-200 bg-white text-slate-600' : 'border border-blue-500 bg-blue-600 text-white'
              }`}
            >
              {entryOpen ? 'Close entry' : 'New entry'}
            </button>
          </div>

          {entryOpen ? (
            <WalletLedgerEntryForm
              onSubmit={onCreateLedgerEntry}
              loading={ledgerMutationLoading}
              error={ledgerMutationError}
              onCancel={() => setEntryOpen(false)}
              variant="inline"
              resetKey={ledgerFormResetKey}
            />
          ) : null}

          <WalletLedgerTable
            entries={ledger?.entries}
            pagination={ledger?.pagination}
            loading={ledgerLoading}
            currency={currency}
            filters={ledgerFilters}
            onFilterChange={onLedgerFiltersChange}
            onPageChange={onLedgerPageChange}
          />
        </div>
      ) : null}
    </div>
  );
}
