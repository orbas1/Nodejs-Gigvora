import { Fragment, forwardRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import useWalletTransactions from '../../../hooks/useWalletTransactions.js';

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
  { value: 'hold', label: 'Hold' },
  { value: 'release', label: 'Release' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'posted', label: 'Posted' },
  { value: 'failed', label: 'Failed' },
];

function resolveErrorMessage(error) {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.body?.message) {
    return error.body.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Unable to process the transaction request. Please try again.';
}

function formatAmount(amount, currency = 'USD') {
  if (amount == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${amount} ${currency || ''}`.trim();
  }
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function TransactionForm({ onSubmit, onCancel, busy, error, wallet }) {
  const [formState, setFormState] = useState({
    type: 'debit',
    amount: '',
    currencyCode: wallet?.currencyCode ?? wallet?.balances?.currencyCode ?? 'USD',
    reference: '',
    description: '',
    counterpartName: '',
    counterpartType: '',
    occurredAt: '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.amount || Number.parseFloat(formState.amount) <= 0) {
      return;
    }
    onSubmit?.({
      type: formState.type,
      amount: formState.amount,
      currencyCode: formState.currencyCode || undefined,
      reference: formState.reference?.trim() || undefined,
      description: formState.description?.trim() || undefined,
      counterpartName: formState.counterpartName?.trim() || undefined,
      counterpartType: formState.counterpartType?.trim() || undefined,
      occurredAt: formState.occurredAt || undefined,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="transaction-type" className="text-sm font-semibold text-slate-700">
            Transaction type
          </label>
          <select
            id="transaction-type"
            value={formState.type}
            onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {TYPE_OPTIONS.filter((option) => option.value).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="transaction-amount" className="text-sm font-semibold text-slate-700">
            Amount
          </label>
          <input
            id="transaction-amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={formState.amount}
            onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="2500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="transaction-currency" className="text-sm font-semibold text-slate-700">
            Currency
          </label>
          <input
            id="transaction-currency"
            type="text"
            maxLength={3}
            value={formState.currencyCode}
            onChange={(event) => setFormState((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm uppercase text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label htmlFor="transaction-occurred" className="text-sm font-semibold text-slate-700">
            Occurred at
          </label>
          <input
            id="transaction-occurred"
            type="datetime-local"
            value={formState.occurredAt}
            onChange={(event) => setFormState((prev) => ({ ...prev, occurredAt: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label htmlFor="transaction-reference" className="text-sm font-semibold text-slate-700">
            Reference
          </label>
          <input
            id="transaction-reference"
            type="text"
            value={formState.reference}
            onChange={(event) => setFormState((prev) => ({ ...prev, reference: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="INV-2024-001"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="transaction-counterparty" className="text-sm font-semibold text-slate-700">
            Counterparty name
          </label>
          <input
            id="transaction-counterparty"
            type="text"
            value={formState.counterpartName}
            onChange={(event) => setFormState((prev) => ({ ...prev, counterpartName: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Acme Studios"
          />
        </div>
        <div>
          <label htmlFor="transaction-counterparty-type" className="text-sm font-semibold text-slate-700">
            Counterparty type
          </label>
          <input
            id="transaction-counterparty-type"
            type="text"
            value={formState.counterpartType}
            onChange={(event) => setFormState((prev) => ({ ...prev, counterpartType: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="vendor"
          />
        </div>
      </div>

      <div>
        <label htmlFor="transaction-description" className="text-sm font-semibold text-slate-700">
          Description
        </label>
        <textarea
          id="transaction-description"
          rows={3}
          value={formState.description}
          onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          placeholder="Add note"
        />
      </div>

      {error ? (
        <div className="inline-flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs text-rose-600/80">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => onCancel?.()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Posting…' : 'Post transaction'}
        </button>
      </div>
    </form>
  );
}

const WalletTransactionsPanel = forwardRef(function WalletTransactionsPanel(
  { wallet, workspaceId, workspaceSlug, onCreateTransaction },
  ref,
) {
  const [filters, setFilters] = useState({ type: '', status: '', dateFrom: '', dateTo: '', limit: 10, offset: 0 });
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, error, loading, refresh } = useWalletTransactions(wallet?.id, {
    workspaceId,
    workspaceSlug,
    filters,
    enabled: Boolean(wallet?.id),
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? { total: items.length, limit: filters.limit, offset: filters.offset };
  const currency = wallet?.balances?.currencyCode ?? wallet?.currencyCode ?? 'USD';

  const totalPages = Math.max(Math.ceil((pagination.total ?? 0) / (pagination.limit || 1)), 1);
  const currentPage = Math.floor((pagination.offset ?? 0) / (pagination.limit || 1)) + 1;

  const handleFilterChange = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch, offset: 0 }));
  };

  const handlePageChange = (page) => {
    const limit = pagination.limit || filters.limit || 10;
    const nextOffset = Math.max(0, (page - 1) * limit);
    setFilters((prev) => ({ ...prev, offset: nextOffset, limit }));
  };

  const handleCreate = async (payload) => {
    if (!onCreateTransaction || !wallet) {
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await onCreateTransaction(payload);
      setCreateOpen(false);
      setFilters((prev) => ({ ...prev, offset: 0 }));
      await refresh({ force: true });
    } catch (err) {
      setActionError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openStandalone = () => {
    if (typeof window === 'undefined' || !wallet?.id) {
      return;
    }
    const url = new URL(window.location.href);
    url.pathname = '/dashboard/company/wallets';
    url.searchParams.set('walletId', `${wallet.id}`);
    url.searchParams.set('view', 'moves');
    window.open(url.toString(), '_blank', 'noopener');
  };

  return (
    <section ref={ref} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Moves</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => refresh({ force: true })}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openStandalone}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
            Pop out
          </button>
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Post
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="filter-type">
            Type
          </label>
          <select
            id="filter-type"
            value={filters.type}
            onChange={(event) => handleFilterChange({ type: event.target.value })}
            className="mt-2 w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="filter-status">
            Status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(event) => handleFilterChange({ status: event.target.value })}
            className="mt-2 w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="filter-from">
            From
          </label>
          <input
            id="filter-from"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => handleFilterChange({ dateFrom: event.target.value })}
            className="mt-2 w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="filter-to">
            To
          </label>
          <input
            id="filter-to"
            type="date"
            value={filters.dateTo}
            onChange={(event) => handleFilterChange({ dateTo: event.target.value })}
            className="mt-2 w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {error ? (
        <div className="mt-4 inline-flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Can&apos;t load moves</p>
            <p className="mt-1 text-xs text-rose-600/80">{resolveErrorMessage(error)}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Counterparty</th>
              <th className="px-4 py-3 text-left">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((transaction) => (
              <tr
                key={transaction.id}
                className="cursor-pointer transition hover:bg-slate-50"
                onClick={() => setDetailTransaction(transaction)}
              >
                <td className="px-4 py-3">{formatDate(transaction.occurredAt)}</td>
                <td className="px-4 py-3 capitalize">{transaction.type}</td>
                <td className="px-4 py-3 capitalize">{transaction.status}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatAmount(transaction.amount, transaction.currencyCode || currency)}
                </td>
                <td className="px-4 py-3">{transaction.counterpartName || '—'}</td>
                <td className="px-4 py-3">{transaction.reference || '—'}</td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  {loading ? 'Loading…' : 'No moves yet.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing {(pagination.offset ?? 0) + 1}–
          {Math.min((pagination.offset ?? 0) + (items.length || 0), pagination.total ?? items.length)} of
          {pagination.total ?? items.length} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <span>
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </div>

      <Transition.Root show={createOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => (busy ? null : setCreateOpen(false))}>
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
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-3xl rounded-4xl bg-white p-6 shadow-2xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Post move</Dialog.Title>
                  <div className="mt-6">
                    <TransactionForm
                      wallet={wallet}
                      onSubmit={handleCreate}
                      onCancel={() => setCreateOpen(false)}
                      busy={busy}
                      error={actionError}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={Boolean(detailTransaction)} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => setDetailTransaction(null)}>
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
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-2xl rounded-4xl bg-white p-6 shadow-2xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Transaction details</Dialog.Title>
                  {detailTransaction ? (
                    <div className="mt-4 space-y-4 text-sm text-slate-700">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
                          <p className="mt-1 capitalize">{detailTransaction.type}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                          <p className="mt-1 capitalize">{detailTransaction.status}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {formatAmount(detailTransaction.amount, detailTransaction.currencyCode || currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Occurred at</p>
                          <p className="mt-1">{formatDate(detailTransaction.occurredAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Counterparty</p>
                          <p className="mt-1">{detailTransaction.counterpartName || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</p>
                          <p className="mt-1">{detailTransaction.reference || '—'}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
                          <p className="mt-1 whitespace-pre-wrap text-slate-600">{detailTransaction.description || '—'}</p>
                        </div>
                      </div>
                      {detailTransaction.ledgerEntry ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ledger entry</p>
                          <p className="mt-1 text-xs text-slate-600">
                            Entry #{detailTransaction.ledgerEntry.id} · Balance after:{' '}
                            {formatAmount(detailTransaction.ledgerEntry.balanceAfter, detailTransaction.currencyCode || currency)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDetailTransaction(null)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </section>
  );
});

export default WalletTransactionsPanel;
