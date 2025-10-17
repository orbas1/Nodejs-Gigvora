import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  PencilSquareIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const ACCOUNT_TYPES = [
  { value: 'user', label: 'User' },
  { value: 'agency', label: 'Agency' },
  { value: 'workspace', label: 'Workspace' },
];

const ACCOUNT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' },
];

const CUSTODY_PROVIDERS = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'lago', label: 'Lago' },
  { value: 'checkout', label: 'Checkout.com' },
  { value: 'manual', label: 'Manual ledger' },
];

function parseMetadata(value) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error('Metadata must be valid JSON.');
  }
}

function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0.00';
  }
  return numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AccountFormDialog({ open, onClose, onSubmit, initialValues, busy }) {
  const [formState, setFormState] = useState(() => ({
    displayName: initialValues?.displayName ?? '',
    workspaceId: initialValues?.workspaceId ?? '',
    userId: initialValues?.userId ?? '',
    profileId: initialValues?.profileId ?? '',
    accountType: initialValues?.accountType ?? 'user',
    custodyProvider: initialValues?.custodyProvider ?? 'stripe',
    status: initialValues?.status ?? 'pending',
    currencyCode: initialValues?.currencyCode ?? 'USD',
    providerAccountId: initialValues?.providerAccountId ?? '',
    currentBalance: initialValues?.currentBalance ?? '',
    availableBalance: initialValues?.availableBalance ?? '',
    pendingHoldBalance: initialValues?.pendingHoldBalance ?? '',
    metadata: initialValues?.metadata ? JSON.stringify(initialValues.metadata, null, 2) : '',
  }));
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = {
        ...formState,
        workspaceId: formState.workspaceId || null,
        userId: formState.userId || null,
        profileId: formState.profileId || null,
        currentBalance: formState.currentBalance || undefined,
        availableBalance: formState.availableBalance || undefined,
        pendingHoldBalance: formState.pendingHoldBalance || undefined,
        metadata: parseMetadata(formState.metadata),
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err?.message || 'Unable to save wallet account. Check the form and try again.';
      setError(message);
      console.error('Failed to save wallet account', err);
    }
  };

  const title = initialValues?.id ? 'Edit wallet account' : 'Create wallet account';

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl rounded-4xl bg-white p-8 shadow-2xl md:h-[85vh] md:overflow-y-auto">
                <Dialog.Title className="text-xl font-semibold text-slate-900">{title}</Dialog.Title>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700">{error}</div>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Display name
                    </label>
                    <input
                      id="displayName"
                      name="displayName"
                      value={formState.displayName}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="workspaceId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Workspace ID
                    </label>
                    <input
                      id="workspaceId"
                      name="workspaceId"
                      value={formState.workspaceId}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="userId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      User ID
                    </label>
                    <input
                      id="userId"
                      name="userId"
                      value={formState.userId}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      placeholder="Required"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="profileId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Profile ID
                    </label>
                    <input
                      id="profileId"
                      name="profileId"
                      value={formState.profileId}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      placeholder="Required"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="accountType" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Account type
                    </label>
                    <select
                      id="accountType"
                      name="accountType"
                      value={formState.accountType}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    >
                      {ACCOUNT_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="custodyProvider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Custody provider
                    </label>
                    <select
                      id="custodyProvider"
                      name="custodyProvider"
                      value={formState.custodyProvider}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    >
                      {CUSTODY_PROVIDERS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formState.status}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    >
                      {ACCOUNT_STATUSES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="currencyCode" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Currency
                    </label>
                    <input
                      id="currencyCode"
                      name="currencyCode"
                      value={formState.currencyCode}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="providerAccountId"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Provider account ID
                    </label>
                    <input
                      id="providerAccountId"
                      name="providerAccountId"
                      value={formState.providerAccountId}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="currentBalance" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Current balance
                    </label>
                    <input
                      id="currentBalance"
                      name="currentBalance"
                      type="number"
                      step="0.01"
                      value={formState.currentBalance}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="availableBalance"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Available balance
                    </label>
                    <input
                      id="availableBalance"
                      name="availableBalance"
                      type="number"
                      step="0.01"
                      value={formState.availableBalance}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="pendingHoldBalance"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Pending holds
                    </label>
                    <input
                      id="pendingHoldBalance"
                      name="pendingHoldBalance"
                      type="number"
                      step="0.01"
                      value={formState.pendingHoldBalance}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="metadata" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Metadata (JSON)
                    </label>
                    <textarea
                      id="metadata"
                      name="metadata"
                      rows={4}
                      value={formState.metadata}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      placeholder='{"ref":"wallet-1"}'
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? 'Saving…' : 'Save wallet'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function AccountRow({ account, onEdit, onSelect }) {
  return (
    <tr
      className="hover:bg-slate-50/60"
      onClick={() => onSelect?.(account)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect?.(account);
        }
      }}
    >
      <td className="px-4 py-3">
        <div className="font-semibold text-slate-900">{account.displayName || account.id}</div>
        <div className="text-xs text-slate-500">{account.accountType}</div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">{account.status}</td>
      <td className="px-4 py-3 text-sm text-slate-700">{account.custodyProvider}</td>
      <td className="px-4 py-3 text-sm text-slate-700">{account.currencyCode}</td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatNumber(account.currentBalance)}</td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatNumber(account.availableBalance)}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{account.providerAccountId || '—'}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit?.(account);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
        >
          <PencilSquareIcon className="h-4 w-4" /> Edit
        </button>
      </td>
    </tr>
  );
}

export default function WalletAccountsPanel({
  resource,
  statusFilter,
  onStatusChange,
  searchTerm,
  onSearchChange,
  page,
  pageSize,
  onPageChange,
  onCreateAccount,
  onUpdateAccount,
  onSelectAccount,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [busy, setBusy] = useState(false);

  const openCreateDialog = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const openEditDialog = (account) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!busy) {
      setDialogOpen(false);
      setEditingAccount(null);
    }
  };

  const handleSubmit = async (payload) => {
    setBusy(true);
    try {
      if (editingAccount?.id) {
        await onUpdateAccount(editingAccount.id, payload);
      } else {
        await onCreateAccount(payload);
      }
    } finally {
      setBusy(false);
    }
  };

  const { data, loading, error } = resource;
  const accounts = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const statusOptions = useMemo(
    () => [{ value: '', label: 'All statuses' }, ...ACCOUNT_STATUSES],
    [],
  );

  return (
    <section id="wallet-accounts" className="space-y-6" aria-labelledby="wallet-accounts-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="wallet-accounts-title" className="text-2xl font-semibold text-slate-900">Accounts</h2>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" /> New account
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          <span>{total} total</span>
        </div>
        <select
          value={statusFilter ?? ''}
          onChange={(event) => onStatusChange?.(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search"
          className="w-full max-w-xs rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">Accounts unavailable.</div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Current</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Provider ID</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                  Loading accounts…
                </td>
              </tr>
            ) : accounts.length ? (
              accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onEdit={openEditDialog}
                  onSelect={onSelectAccount}
                />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">No accounts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Page {page + 1} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(page - 1, 0))}
            disabled={page === 0}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(page + 1, totalPages - 1))}
            disabled={page + 1 >= totalPages}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <AccountFormDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        initialValues={editingAccount}
        busy={busy}
      />
    </section>
  );
}
