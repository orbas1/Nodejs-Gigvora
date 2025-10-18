import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRightIcon, ArrowDownIcon, ArrowUturnLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TRANSACTION_TYPES = [
  { id: 'project', label: 'Project milestone' },
  { id: 'gig', label: 'Gig deliverable' },
  { id: 'service', label: 'Service engagement' },
];

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
}

function normalizeAccounts(accounts) {
  return (Array.isArray(accounts) ? accounts : []).map((account) => ({
    id: account.id,
    label: account.label ?? `Account ${account.id}`,
    currencyCode: account.currencyCode ?? 'USD',
  }));
}

function normalizeTransactions(transactions) {
  return (Array.isArray(transactions) ? transactions : []).map((txn) => ({
    ...txn,
    displayStatus: txn.status?.replace(/_/g, ' '),
  }));
}

function SlideOut({ open, title, onClose, children, footer }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <div role="dialog" aria-modal="true" className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-1 text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export default function EscrowTransactionsPanel({
  transactions,
  releaseQueue,
  accounts,
  onInitiate,
  onRelease,
  onRefund,
  currentUserId,
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState(null);
  const [form, setForm] = useState({
    accountId: '',
    reference: '',
    amount: '',
    feeAmount: '0',
    currencyCode: '',
    type: TRANSACTION_TYPES[0].id,
    milestoneLabel: '',
    scheduledReleaseAt: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const accountOptions = useMemo(() => normalizeAccounts(accounts), [accounts]);
  const openTransactions = useMemo(() => normalizeTransactions(transactions), [transactions]);
  const queueItems = useMemo(() => normalizeTransactions(releaseQueue), [releaseQueue]);

  useEffect(
    () => () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    },
    [],
  );

  const scheduleToastClear = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onInitiate({
        accountId: form.accountId ? Number(form.accountId) : undefined,
        reference: form.reference,
        amount: form.amount ? Number(form.amount) : undefined,
        feeAmount: form.feeAmount ? Number(form.feeAmount) : 0,
        currencyCode: form.currencyCode || undefined,
        type: form.type,
        milestoneLabel: form.milestoneLabel || undefined,
        scheduledReleaseAt: form.scheduledReleaseAt || undefined,
        actorId: currentUserId,
      });
      setToast('Transaction created');
      scheduleToastClear();
      setForm({
        accountId: '',
        reference: '',
        amount: '',
        feeAmount: '0',
        currencyCode: '',
        type: TRANSACTION_TYPES[0].id,
        milestoneLabel: '',
        scheduledReleaseAt: '',
      });
      setCreateOpen(false);
    } catch (err) {
      setError(err?.body?.message ?? err?.message ?? 'Unable to create escrow transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerAction = async (kind, transactionId) => {
    if (!transactionId) {
      return;
    }
    setActionSubmitting(true);
    setError(null);
    try {
      if (kind === 'release') {
        await onRelease(transactionId, { actorId: currentUserId });
        setToast(`Released ${transactionId}`);
      } else if (kind === 'refund') {
        await onRefund(transactionId, { actorId: currentUserId });
        setToast(`Refunded ${transactionId}`);
      }
      scheduleToastClear();
      setDetailTransaction(null);
    } catch (err) {
      setError(err?.body?.message ?? err?.message ?? 'Unable to update transaction.');
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Flow</h2>
          <p className="text-xs text-slate-500">Create, release, or refund with full audit state.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateOpen(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          New
        </button>
      </div>

      {toast ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          <span>{toast}</span>
        </div>
      ) : null}
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {openTransactions.length ? (
            openTransactions.map((transaction) => (
              <button
                key={transaction.id}
                type="button"
                onClick={() => setDetailTransaction(transaction)}
                className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{transaction.reference}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{transaction.displayStatus}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {transaction.type?.replace(/_/g, ' ') ?? 'milestone'}
                  </span>
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {formatCurrency(transaction.amount, transaction.currencyCode)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Account #{transaction.accountId}</span>
                  <span aria-hidden="true">•</span>
                  <span>
                    {transaction.scheduledReleaseAt
                      ? `Release ${new Date(transaction.scheduledReleaseAt).toLocaleString()}`
                      : `Started ${new Date(transaction.createdAt).toLocaleDateString()}`}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              No live transactions.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Queue</h3>
            <span className="text-xs text-slate-500">Automation window</span>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {queueItems.length ? (
              queueItems.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{item.reference}</span>
                    <span className="text-xs font-semibold text-blue-700">
                      {formatCurrency(item.amount, item.currencyCode)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <ArrowDownIcon className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {item.scheduledReleaseAt
                        ? new Date(item.scheduledReleaseAt).toLocaleString()
                        : 'Waiting for approval'}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                Nothing queued.
              </li>
            )}
          </ul>
        </div>
      </div>

      <SlideOut
        open={createOpen}
        title="New transaction"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-escrow-transaction"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <form id="create-escrow-transaction" onSubmit={handleCreate} className="space-y-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Account</span>
            <select
              name="accountId"
              value={form.accountId}
              onChange={handleFormChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">Select account</option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label} • {account.currencyCode}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Reference</span>
            <input
              type="text"
              name="reference"
              value={form.reference}
              onChange={handleFormChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="font-medium text-slate-700">Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                name="amount"
                value={form.amount}
                onChange={handleFormChange}
                className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium text-slate-700">Fee</span>
              <input
                type="number"
                min="0"
                step="0.01"
                name="feeAmount"
                value={form.feeAmount}
                onChange={handleFormChange}
                className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Currency</span>
            <input
              type="text"
              name="currencyCode"
              value={form.currencyCode}
              onChange={handleFormChange}
              maxLength={3}
              className="rounded-xl border border-slate-300 px-3 py-2 uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Type</span>
            <select
              name="type"
              value={form.type}
              onChange={handleFormChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {TRANSACTION_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Milestone</span>
            <input
              type="text"
              name="milestoneLabel"
              value={form.milestoneLabel}
              onChange={handleFormChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Scheduled release</span>
            <input
              type="datetime-local"
              name="scheduledReleaseAt"
              value={form.scheduledReleaseAt}
              onChange={handleFormChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </form>
      </SlideOut>

      <SlideOut
        open={Boolean(detailTransaction)}
        title={detailTransaction ? detailTransaction.reference : 'Transaction'}
        onClose={() => setDetailTransaction(null)}
        footer={
          detailTransaction ? (
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setDetailTransaction(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerAction('refund', detailTransaction.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-400 hover:text-rose-600"
                  disabled={actionSubmitting}
                >
                  <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
                  Refund
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction('release', detailTransaction.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  disabled={actionSubmitting}
                >
                  <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
                  Release
                </button>
              </div>
            </div>
          ) : null
        }
      >
        {detailTransaction ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{detailTransaction.displayStatus}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Amount</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatCurrency(detailTransaction.amount, detailTransaction.currencyCode)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Fees {formatCurrency(detailTransaction.feeAmount, detailTransaction.currencyCode)}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Milestone</p>
              <p className="mt-1 text-sm text-slate-700">{detailTransaction.milestoneLabel || 'No label'}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Account</p>
                <p className="mt-1 text-sm text-slate-700">#{detailTransaction.accountId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Created</p>
                <p className="mt-1 text-sm text-slate-700">
                  {detailTransaction.createdAt ? new Date(detailTransaction.createdAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Schedule</p>
              <p className="mt-1 text-sm text-slate-700">
                {detailTransaction.scheduledReleaseAt
                  ? new Date(detailTransaction.scheduledReleaseAt).toLocaleString()
                  : 'On approval'}
              </p>
            </div>

            {detailTransaction.auditTrail?.length ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Audit</p>
                <ul className="mt-2 space-y-2 rounded-2xl bg-slate-50 p-3">
                  {detailTransaction.auditTrail.map((entry, index) => (
                    <li key={index} className="flex items-center justify-between text-xs text-slate-600">
                      <span>{entry.action}</span>
                      <span>{entry.at ? new Date(entry.at).toLocaleString() : 'Just now'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </SlideOut>
    </div>
  );
}
