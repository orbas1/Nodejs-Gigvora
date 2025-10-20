import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { BanknotesIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const TRANSACTION_TYPES = ['Payout', 'Mentorship earning', 'Adjustment'];
const TRANSACTION_STATUSES = ['Pending', 'Completed', 'Failed', 'Processing'];

const DEFAULT_FORM = {
  type: 'Mentorship earning',
  status: 'Completed',
  amount: '',
  currency: '£',
  occurredAt: '',
  reference: '',
  description: '',
};

function formatAmount(amount, currency = '£') {
  if (amount == null) {
    return `${currency}0`;
  }
  const numeric = Number(amount);
  return `${currency}${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTimestamp(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    return '—';
  }
}

export default function MentorWalletSection({ wallet, onCreateTransaction, onUpdateTransaction, onDeleteTransaction, saving }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const transactions = useMemo(() => wallet?.transactions ?? [], [wallet]);

  useEffect(() => {
    if (!editingId) {
      setForm(DEFAULT_FORM);
    }
  }, [editingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      type: form.type,
      status: form.status,
      amount: form.amount ? Number.parseFloat(form.amount) : undefined,
      currency: form.currency,
      occurredAt: form.occurredAt || undefined,
      reference: form.reference,
      description: form.description,
    };
    try {
      if (editingId) {
        await onUpdateTransaction?.(editingId, payload);
        setFeedback({ type: 'success', message: 'Transaction updated.' });
      } else {
        await onCreateTransaction?.(payload);
        setFeedback({ type: 'success', message: 'Transaction recorded.' });
      }
      setEditingId(null);
      setForm(DEFAULT_FORM);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to save transaction.' });
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setForm({
      type: transaction.type || 'Mentorship earning',
      status: transaction.status || 'Completed',
      amount: transaction.amount != null ? String(transaction.amount) : '',
      currency: transaction.currency || '£',
      occurredAt: transaction.occurredAt ? transaction.occurredAt.slice(0, 16) : '',
      reference: transaction.reference || '',
      description: transaction.description || '',
    });
    setFeedback(null);
  };

  const handleDelete = async (transactionId) => {
    if (!transactionId) return;
    setFeedback(null);
    try {
      await onDeleteTransaction?.(transactionId);
      if (editingId === transactionId) {
        setEditingId(null);
        setForm(DEFAULT_FORM);
      }
      setFeedback({ type: 'success', message: 'Transaction removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to remove transaction.' });
    }
  };

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Wallet</p>
          <h2 className="text-2xl font-semibold text-slate-900">Monitor revenue and payouts in real time</h2>
          <p className="text-sm text-slate-600">
            Keep tabs on Explorer earnings, in-flight payouts, and manual adjustments. Record finance events instantly to
            maintain accurate ledgers and unlock faster reconciliations.
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <BanknotesIcon className="h-7 w-7" aria-hidden="true" />
        </div>
      </header>

      {feedback ? (
        <div
          className={`rounded-3xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {editingId ? 'Update transaction' : 'Record transaction'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(DEFAULT_FORM);
                setFeedback(null);
              }}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Reset
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Type
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Status
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {TRANSACTION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Currency
              <input
                type="text"
                value={form.currency}
                onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                className="w-20 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Amount
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Occurred at
            <input
              type="datetime-local"
              value={form.occurredAt}
              onChange={(event) => setForm((current) => ({ ...current, occurredAt: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Reference
            <input
              type="text"
              value={form.reference}
              onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Description
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving transaction…' : editingId ? 'Update transaction' : 'Record transaction'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatAmount(wallet?.available, wallet?.currency)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatAmount(wallet?.pending, wallet?.currency)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Balance</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatAmount(wallet?.balance, wallet?.currency)}</p>
            </div>
          </div>

          <ul className="space-y-4">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{transaction.type}</p>
                    <p className="text-sm text-slate-500">{transaction.reference}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {transaction.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEdit(transaction)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(transaction.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-slate-500">Amount:</span> {formatAmount(transaction.amount, transaction.currency)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Occurred:</span> {formatTimestamp(transaction.occurredAt)}
                  </p>
                  <p className="sm:col-span-2 text-slate-500">{transaction.description || 'No description provided.'}</p>
                </div>
              </li>
            ))}
            {!transactions.length ? (
              <li className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No wallet transactions recorded yet. Log your first earning or payout to build a history.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}

MentorWalletSection.propTypes = {
  wallet: PropTypes.shape({
    balance: PropTypes.number,
    available: PropTypes.number,
    pending: PropTypes.number,
    currency: PropTypes.string,
    transactions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        type: PropTypes.string,
        status: PropTypes.string,
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        currency: PropTypes.string,
        occurredAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reference: PropTypes.string,
        description: PropTypes.string,
      }),
    ),
  }),
  onCreateTransaction: PropTypes.func,
  onUpdateTransaction: PropTypes.func,
  onDeleteTransaction: PropTypes.func,
  saving: PropTypes.bool,
};

MentorWalletSection.defaultProps = {
  wallet: null,
  onCreateTransaction: undefined,
  onUpdateTransaction: undefined,
  onDeleteTransaction: undefined,
  saving: false,
};
