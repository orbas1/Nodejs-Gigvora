import { useState } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../../utils/date.js';

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${value}`;
  }
}

export default function GigEscrowPanel({ checkpoints, currency, canManage, onCreate, onRelease }) {
  const [form, setForm] = useState({ label: '', amount: '', notes: '' });
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.label.trim()) {
      setFeedback({ tone: 'error', message: 'Name the checkpoint.' });
      return;
    }
    if (!form.amount || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setFeedback({ tone: 'error', message: 'Enter a positive amount.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await onCreate({
        label: form.label.trim(),
        amount: Number(form.amount),
        currency,
        notes: form.notes?.trim() || undefined,
        status: 'funded',
      });
      setFeedback({ tone: 'success', message: 'Escrow checkpoint added.' });
      setForm({ label: '', amount: '', notes: '' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Could not create checkpoint.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Escrow</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{checkpoints.length}</span>
      </header>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5">
        {checkpoints.length ? (
          checkpoints.map((checkpoint) => (
            <article key={checkpoint.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span className="font-semibold text-slate-900">{checkpoint.label}</span>
                <span>{formatCurrency(checkpoint.amount, checkpoint.currency ?? currency)}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">{checkpoint.status}</span>
                {checkpoint.updatedAt ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {checkpoint.status === 'released' ? 'Released' : 'Funded'} {formatRelativeTime(checkpoint.updatedAt)}
                  </span>
                ) : null}
              </div>
              {checkpoint.notes ? <p className="mt-3 text-sm text-slate-600">{checkpoint.notes}</p> : null}
              {checkpoint.status !== 'released' ? (
                <button
                  type="button"
                  onClick={() => onRelease(checkpoint.id)}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
                  disabled={!canManage || submitting}
                >
                  Release
                </button>
              ) : null}
            </article>
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
            No checkpoints yet.
          </div>
        )}
      </div>
      <form className="rounded-3xl border border-slate-200 bg-white p-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
            Name
            <input
              name="label"
              value={form.label}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Milestone"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
            Amount
            <input
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="2500"
              type="number"
              min="0"
              disabled={!canManage || submitting}
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-2 text-xs font-semibold text-slate-600">
          Notes
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Add release conditions"
            disabled={!canManage || submitting}
          />
        </label>
        {feedback ? (
          <p className={`mt-3 text-sm ${feedback.tone === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback.message}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={!canManage || submitting}
          >
            {submitting ? 'Saving…' : 'Add checkpoint'}
          </button>
        </div>
      </form>
    </div>
  );
}

GigEscrowPanel.propTypes = {
  checkpoints: PropTypes.arrayOf(PropTypes.object).isRequired,
  currency: PropTypes.string,
  canManage: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onRelease: PropTypes.func.isRequired,
};

GigEscrowPanel.defaultProps = {
  currency: 'USD',
  canManage: false,
};
