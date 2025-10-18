import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

const STATUS_BADGES = {
  initiated: 'bg-amber-100 text-amber-700',
  funded: 'bg-blue-100 text-blue-700',
  in_escrow: 'bg-slate-100 text-slate-700',
  released: 'bg-emerald-100 text-emerald-700',
  refunded: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-200 text-slate-600',
  disputed: 'bg-amber-200 text-amber-800',
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
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function EditTransactionModal({ open, transaction, onSubmit, onClose, saving }) {
  const [draft, setDraft] = useState(transaction);

  useEffect(() => {
    setDraft(transaction);
  }, [transaction]);

  if (!transaction) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      ...draft,
      scheduledReleaseAt: draft.scheduledReleaseAt || null,
      metadata: draft.metadata ?? transaction.metadata ?? null,
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
              <Dialog.Panel className="w-full max-w-xl transform rounded-3xl bg-white p-6 shadow-2xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Edit transaction {transaction.reference}
                </Dialog.Title>
                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="txn-status">
                      Status
                    </label>
                    <select
                      id="txn-status"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={draft.status}
                      onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      <option value="initiated">Initiated</option>
                      <option value="funded">Funded</option>
                      <option value="in_escrow">In escrow</option>
                      <option value="disputed">Disputed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      Use release or refund actions to settle funds.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="txn-scheduled">
                      Scheduled release at
                    </label>
                    <input
                      id="txn-scheduled"
                      type="datetime-local"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={draft.scheduledReleaseAt ? draft.scheduledReleaseAt.slice(0, 16) : ''}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          scheduledReleaseAt: event.target.value
                            ? new Date(event.target.value).toISOString()
                            : '',
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="txn-notes">
                      Notes
                    </label>
                    <textarea
                      id="txn-notes"
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={draft.metadata?.notes ?? ''}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          metadata: { ...(prev.metadata ?? {}), notes: event.target.value },
                        }))
                      }
                      placeholder="Internal memo for audit trail"
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

export default function EscrowTransactionsTable({
  transactions,
  filters,
  onFilterChange,
  onUpdateTransaction,
  onRelease,
  onRefund,
  currency = 'USD',
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [saving, setSaving] = useState(false);

  const items = transactions?.items ?? [];
  const pagination = transactions?.pagination ?? { page: 1, totalPages: 1 };

  const statusFilter = filters?.status ?? '';
  const typeFilter = filters?.type ?? '';
  const referenceFilter = filters?.reference ?? '';

  const handleFilterUpdate = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    if (key !== 'page') {
      nextFilters.page = 1;
    }
    onFilterChange?.(nextFilters);
  };

  const handleUpdate = async (payload) => {
    try {
      setSaving(true);
      await onUpdateTransaction?.(payload.id, {
        status: payload.status,
        scheduledReleaseAt: payload.scheduledReleaseAt,
        metadata: payload.metadata,
      });
      setEditOpen(false);
      setActiveTransaction(null);
    } finally {
      setSaving(false);
    }
  };

  const confirmRelease = async (transaction) => {
    if (!window.confirm(`Release ${transaction.reference}?`)) {
      return;
    }
    await onRelease?.(transaction.id);
  };

  const confirmRefund = async (transaction) => {
    if (!window.confirm(`Refund ${transaction.reference}?`)) {
      return;
    }
    await onRefund?.(transaction.id);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Transactions</h3>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="txn-status">
            Status
          </label>
          <select
            id="txn-status"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={statusFilter}
            onChange={(event) => handleFilterUpdate('status', event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="initiated">Initiated</option>
            <option value="funded">Funded</option>
            <option value="in_escrow">In escrow</option>
            <option value="disputed">Disputed</option>
            <option value="released">Released</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="txn-type">
            Type
          </label>
          <select
            id="txn-type"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={typeFilter}
            onChange={(event) => handleFilterUpdate('type', event.target.value)}
          >
            <option value="">All types</option>
            <option value="project">Project</option>
            <option value="gig">Gig</option>
            <option value="milestone">Milestone</option>
            <option value="retainer">Retainer</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="txn-ref">
            Reference
          </label>
          <input
            id="txn-ref"
            type="search"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={referenceFilter}
            onChange={(event) => handleFilterUpdate('reference', event.target.value)}
            placeholder="Transaction reference"
          />
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Reference</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Account</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Net</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Scheduled release</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Created</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={8}>
                  No transactions found.
                </td>
              </tr>
            )}
            {items.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-slate-900">{transaction.reference}</td>
                <td className="px-4 py-3 text-slate-600">
                  {transaction.account?.owner?.email ?? transaction.account?.owner?.id ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatCurrency(transaction.amount, transaction.currencyCode ?? currency)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatCurrency(transaction.netAmount, transaction.currencyCode ?? currency)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_BADGES[transaction.status] ?? STATUS_BADGES.in_escrow
                    }`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(transaction.scheduledReleaseAt)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(transaction.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTransaction(transaction);
                        setEditOpen(true);
                      }}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    {['funded', 'in_escrow', 'disputed'].includes(transaction.status) && (
                      <>
                        <button
                          type="button"
                          onClick={() => confirmRelease(transaction)}
                          className="text-sm font-semibold text-emerald-600 hover:text-emerald-800"
                        >
                          Release
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmRefund(transaction)}
                          className="text-sm font-semibold text-rose-600 hover:text-rose-800"
                        >
                          Refund
                        </button>
                      </>
                    )}
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
      <EditTransactionModal
        open={editOpen}
        transaction={activeTransaction}
        onSubmit={(payload) => handleUpdate({ ...payload, id: activeTransaction.id })}
        onClose={() => {
          if (!saving) {
            setEditOpen(false);
            setActiveTransaction(null);
          }
        }}
        saving={saving}
      />
    </section>
  );
}
