import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/outline';

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-rose-100 text-rose-700',
  closed: 'bg-slate-100 text-slate-600',
};

const PROVIDER_LABELS = {
  stripe: 'Stripe',
  escrow_com: 'Escrow.com',
};

function formatCurrency(value, currency = 'USD') {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function CreateAccountModal({ open, onClose, onSubmit, saving }) {
  const [draft, setDraft] = useState({ userId: '', provider: 'stripe', currencyCode: 'USD' });

  useEffect(() => {
    if (!open) {
      setDraft({ userId: '', provider: 'stripe', currencyCode: 'USD' });
    }
  }, [open]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      userId: Number(draft.userId),
      provider: draft.provider,
      currencyCode: draft.currencyCode,
    });
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={saving ? () => {} : onClose}>
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
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform rounded-3xl bg-white p-6 shadow-2xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Create escrow account</Dialog.Title>
                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="account-user">
                      User ID
                    </label>
                    <input
                      id="account-user"
                      type="number"
                      min={1}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={draft.userId}
                      onChange={(event) => setDraft((prev) => ({ ...prev, userId: event.target.value }))}
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="account-provider">
                      Provider
                    </label>
                    <select
                      id="account-provider"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={draft.provider}
                      onChange={(event) => setDraft((prev) => ({ ...prev, provider: event.target.value }))}
                    >
                      <option value="stripe">Stripe</option>
                      <option value="escrow_com">Escrow.com</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="account-currency">
                      Currency
                    </label>
                    <input
                      id="account-currency"
                      type="text"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={draft.currencyCode}
                      onChange={(event) => setDraft((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !draft.userId}
                      className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {saving ? 'Creating…' : 'Create account'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function EditAccountModal({ open, account, ownerLabel, onClose, onSubmit, saving }) {
  const [draft, setDraft] = useState(account);

  useEffect(() => {
    setDraft(account);
  }, [account]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(draft);
  };

  if (!account) {
    return null;
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={saving ? () => {} : onClose}>
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
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform rounded-3xl bg-white p-6 shadow-2xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Update account #{account.id}
                </Dialog.Title>
                {ownerLabel && (
                  <p className="mt-1 text-sm text-slate-500">Owner: {ownerLabel}</p>
                )}
                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="edit-status">
                        Status
                      </label>
                      <select
                        id="edit-status"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.status}
                        onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="edit-currency">
                        Currency
                      </label>
                      <input
                        id="edit-currency"
                        type="text"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.currencyCode ?? ''}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="edit-balance">
                        Current balance
                      </label>
                      <input
                        id="edit-balance"
                        type="number"
                        min={0}
                        step="0.01"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.currentBalance ?? ''}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, currentBalance: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="edit-pending">
                        Pending release total
                      </label>
                      <input
                        id="edit-pending"
                        type="number"
                        min={0}
                        step="0.01"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.pendingReleaseTotal ?? ''}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, pendingReleaseTotal: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="edit-reconciled">
                      Last reconciled at
                    </label>
                    <input
                      id="edit-reconciled"
                      type="datetime-local"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={draft.lastReconciledAt ? draft.lastReconciledAt.slice(0, 16) : ''}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, lastReconciledAt: event.target.value ? new Date(event.target.value).toISOString() : null }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function Pagination({ pagination, onChange }) {
  const { page = 1, totalPages = 1 } = pagination ?? {};
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-600">
      <span>
        Page {page} of {Math.max(totalPages, 1)}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange?.(page - 1)}
          disabled={!canPrev}
          className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onChange?.(page + 1)}
          disabled={!canNext}
          className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function EscrowAccountsTable({
  accounts,
  filters,
  onFilterChange,
  onCreateAccount,
  onUpdateAccount,
  currency = 'USD',
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState(null);
  const [saving, setSaving] = useState(false);

  const items = accounts?.items ?? [];
  const pagination = accounts?.pagination ?? { page: 1, totalPages: 1 };

  const handleFilterUpdate = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    if (key !== 'page') {
      nextFilters.page = 1;
    }
    onFilterChange?.(nextFilters);
  };

  const handleCreate = async (payload) => {
    try {
      setSaving(true);
      await onCreateAccount?.(payload);
      setCreateOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      setSaving(true);
      await onUpdateAccount?.(payload.id, {
        status: payload.status,
        currencyCode: payload.currencyCode,
        currentBalance:
          payload.currentBalance === '' || payload.currentBalance == null
            ? undefined
            : Number(payload.currentBalance),
        pendingReleaseTotal:
          payload.pendingReleaseTotal === '' || payload.pendingReleaseTotal == null
            ? undefined
            : Number(payload.pendingReleaseTotal),
        lastReconciledAt: payload.lastReconciledAt,
      });
      setEditOpen(false);
      setActiveAccount(null);
    } finally {
      setSaving(false);
    }
  };

  const statusFilter = filters?.status ?? '';
  const providerFilter = filters?.provider ?? '';
  const searchFilter = filters?.search ?? '';

  const activeLabel = useMemo(() => {
    if (!activeAccount) return '';
    const owner = activeAccount.owner;
    if (owner?.firstName || owner?.lastName) {
      return `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim();
    }
    return owner?.email ?? `Account ${activeAccount.id}`;
  }, [activeAccount]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Escrow accounts</h3>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <PlusIcon className="h-4 w-4" /> Create account
        </button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="md:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="filter-status">
            Status
          </label>
          <select
            id="filter-status"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={statusFilter}
            onChange={(event) => handleFilterUpdate('status', event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="filter-provider">
            Provider
          </label>
          <select
            id="filter-provider"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={providerFilter}
            onChange={(event) => handleFilterUpdate('provider', event.target.value)}
          >
            <option value="">All providers</option>
            <option value="stripe">Stripe</option>
            <option value="escrow_com">Escrow.com</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="filter-search">
            Search
          </label>
          <input
            id="filter-search"
            type="search"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={searchFilter}
            onChange={(event) => handleFilterUpdate('search', event.target.value)}
            placeholder="Search by email or name"
          />
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Owner</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Provider</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Balance</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Pending release</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Last reconciled</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={7}>
                  No accounts found.
                </td>
              </tr>
            )}
            {items.map((account) => (
              <tr key={account.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">
                    {account.owner?.firstName || account.owner?.lastName
                      ? `${account.owner?.firstName ?? ''} ${account.owner?.lastName ?? ''}`.trim()
                      : account.owner?.email ?? `#${account.id}`}
                  </div>
                  <div className="text-xs text-slate-500">{account.owner?.email ?? '—'}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{PROVIDER_LABELS[account.provider] ?? account.provider}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatCurrency(account.currentBalance, account.currencyCode ?? currency)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatCurrency(account.pendingReleaseTotal, account.currencyCode ?? currency)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_BADGES[account.status] ?? STATUS_BADGES.pending
                    }`}
                  >
                    {account.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(account.lastReconciledAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAccount(account);
                        setEditOpen(true);
                      }}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        pagination={pagination}
        onChange={(nextPage) => {
          if (nextPage < 1) return;
          handleFilterUpdate('page', nextPage);
        }}
      />
      <CreateAccountModal
        open={createOpen}
        onClose={() => {
          if (!saving) {
            setCreateOpen(false);
          }
        }}
        onSubmit={handleCreate}
        saving={saving}
      />
      <EditAccountModal
        open={editOpen}
        account={activeAccount}
        ownerLabel={activeLabel}
        onClose={() => {
          if (!saving) {
            setEditOpen(false);
            setActiveAccount(null);
          }
        }}
        onSubmit={(payload) => handleUpdate({ ...payload, id: activeAccount.id })}
        saving={saving}
      />
    </section>
  );
}

EscrowAccountsTable.propTypes = {
  accounts: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        owner: PropTypes.shape({
          firstName: PropTypes.string,
          lastName: PropTypes.string,
          email: PropTypes.string,
        }),
        provider: PropTypes.string,
        currentBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        pendingReleaseTotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        status: PropTypes.string,
        lastReconciledAt: PropTypes.string,
        currencyCode: PropTypes.string,
      }),
    ),
    pagination: PropTypes.shape({
      page: PropTypes.number,
      totalPages: PropTypes.number,
      totalItems: PropTypes.number,
    }),
  }),
  filters: PropTypes.shape({
    status: PropTypes.string,
    provider: PropTypes.string,
    search: PropTypes.string,
    page: PropTypes.number,
  }),
  onFilterChange: PropTypes.func,
  onCreateAccount: PropTypes.func,
  onUpdateAccount: PropTypes.func,
  currency: PropTypes.string,
};

EscrowAccountsTable.defaultProps = {
  accounts: undefined,
  filters: {},
  onFilterChange: undefined,
  onCreateAccount: undefined,
  onUpdateAccount: undefined,
  currency: 'USD',
};
