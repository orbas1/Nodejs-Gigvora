import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowDownTrayIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';

const PAYOUT_STATUSES = [
  { value: 'pending_review', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'draft', label: 'Draft' },
];

function formatCurrency(amount, currency = 'USD') {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function parseMetadata(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error('Metadata must be valid JSON.');
  }
}

function PayoutFormDialog({ open, onClose, onSubmit, initialValues, busy }) {
  const [formState, setFormState] = useState(() => ({
    workspaceId: initialValues?.workspaceId ?? '',
    walletAccountId: initialValues?.walletAccountId ?? '',
    fundingSourceId: initialValues?.fundingSourceId ?? '',
    amount: initialValues?.amount ?? '',
    currencyCode: initialValues?.currencyCode ?? 'USD',
    status: initialValues?.status ?? 'pending_review',
    requestedAt: initialValues?.requestedAt ? initialValues.requestedAt.slice(0, 16) : '',
    notes: initialValues?.notes ?? '',
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
        metadata: parseMetadata(formState.metadata),
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err?.message || 'Unable to save payout request. Please try again.';
      setError(message);
    }
  };

  const title = initialValues?.id ? 'Update payout request' : 'Create payout request';

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
              <Dialog.Panel className="w-full max-w-3xl rounded-4xl bg-white p-8 shadow-2xl md:h-[80vh] md:overflow-y-auto">
                <Dialog.Title className="text-xl font-semibold text-slate-900">{title}</Dialog.Title>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700">{error}</div>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="workspaceId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Workspace ID
                    </label>
                    <input
                      id="workspaceId"
                      name="workspaceId"
                      value={formState.workspaceId}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="walletAccountId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Wallet account ID
                    </label>
                    <input
                      id="walletAccountId"
                      name="walletAccountId"
                      value={formState.walletAccountId}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="fundingSourceId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Funding source ID
                    </label>
                    <input
                      id="fundingSourceId"
                      name="fundingSourceId"
                      value={formState.fundingSourceId}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      value={formState.amount}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
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
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
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
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {PAYOUT_STATUSES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="requestedAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Requested at
                    </label>
                    <input
                      id="requestedAt"
                      name="requestedAt"
                      type="datetime-local"
                      value={formState.requestedAt}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formState.notes}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Compliance or treasury notes"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="metadata" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Metadata (JSON)
                    </label>
                    <textarea
                      id="metadata"
                      name="metadata"
                      rows={3}
                      value={formState.metadata}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder='{"invoice":123}'
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
                      {busy ? 'Saving…' : 'Save payout'}
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

function PayoutRow({ payout, onEdit }) {
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-3">
        <div className="font-semibold text-slate-900">{payout.walletAccount?.displayName ?? payout.walletAccountId}</div>
        <div className="text-xs text-slate-500">Account #{payout.walletAccountId}</div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">{payout.fundingSourceId ?? '—'}</td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
        {formatCurrency(payout.amount, payout.currencyCode)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">{payout.status}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(payout.requestedAt)}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{payout.notes || '—'}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onEdit?.(payout)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
        >
          <PencilSquareIcon className="h-4 w-4" /> Edit
        </button>
      </td>
    </tr>
  );
}

export default function WalletPayoutsPanel({ resource, statusFilter, onStatusFilterChange, onCreatePayout, onUpdatePayout }) {
  const payouts = resource.data ?? [];
  const { loading, error } = resource;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayout, setEditingPayout] = useState(null);
  const [busy, setBusy] = useState(false);

  const openCreateDialog = () => {
    setEditingPayout(null);
    setDialogOpen(true);
  };

  const openEditDialog = (payout) => {
    setEditingPayout(payout);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!busy) {
      setDialogOpen(false);
      setEditingPayout(null);
    }
  };

  const handleSubmit = async (payload) => {
    setBusy(true);
    try {
      if (editingPayout?.id) {
        await onUpdatePayout(editingPayout.id, payload);
      } else {
        await onCreatePayout(payload);
      }
    } finally {
      setBusy(false);
    }
  };

  const statusOptions = useMemo(
    () => [{ value: '', label: 'All statuses' }, ...PAYOUT_STATUSES],
    [],
  );

  return (
    <section id="wallet-payouts" className="space-y-6" aria-labelledby="wallet-payouts-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="wallet-payouts-title" className="text-2xl font-semibold text-slate-900">
            Payouts
          </h2>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" /> New payout request
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
          <ArrowDownTrayIcon className="h-4 w-4" /> {payouts.length} records
        </div>
        <select
          value={statusFilter ?? ''}
          onChange={(event) => onStatusFilterChange?.(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">Payouts unavailable.</div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Wallet account</th>
              <th className="px-4 py-3">Funding source</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  Loading payouts…
                </td>
              </tr>
            ) : payouts.length ? (
              payouts.map((payout) => <PayoutRow key={payout.id} payout={payout} onEdit={openEditDialog} />)
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">No payouts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PayoutFormDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        initialValues={editingPayout}
        busy={busy}
      />
    </section>
  );
}
