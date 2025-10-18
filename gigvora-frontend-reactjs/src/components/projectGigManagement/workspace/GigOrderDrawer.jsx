import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { GIG_ORDER_STATUSES } from '../../../constants/gigOrders.js';
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

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Math.round(Number(value))}%`;
}

export default function GigOrderDrawer({ open, order, onClose, canManage, onUpdate }) {
  const [statusDraft, setStatusDraft] = useState(order?.status ?? 'draft');
  const [progressDraft, setProgressDraft] = useState(order?.progressPercent ?? 0);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStatusDraft(order?.status ?? 'draft');
      setProgressDraft(order?.progressPercent ?? 0);
      setFeedback(null);
    }
  }, [open, order]);

  if (!open || !order) {
    return null;
  }

  const handleSave = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await onUpdate({ status: statusDraft, progressPercent: Number(progressDraft) });
      setFeedback({ tone: 'success', message: 'Order updated.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Could not update order.' });
    } finally {
      setSubmitting(false);
    }
  };

  const currency = order.currency ?? order.orderCurrency ?? order.gig?.currency ?? 'USD';
  const amount = order.amount ?? order.gig?.amount ?? order.pricing?.total;
  const due = order.dueAt ?? order.gig?.dueAt;
  const vendor = order.vendor?.displayName ?? order.vendorName ?? 'Vendor';

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
      <div className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          aria-label="Close"
        >
          ×
        </button>
        <div className="mt-6 flex flex-col gap-6">
          <header className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Gig</p>
            <h2 className="text-2xl font-semibold text-slate-900">{order.gig?.title ?? order.serviceName ?? 'Gig'}</h2>
            <p className="text-sm text-slate-500">{vendor}</p>
          </header>
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold text-slate-500">Amount</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(amount, currency)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold text-slate-500">Due</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{due ? formatRelativeTime(due) : 'Not set'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold text-slate-500">Status</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{statusDraft}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold text-slate-500">Progress</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatPercent(progressDraft)}</p>
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-slate-700">Scope</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(order.requirements ?? order.deliverables ?? []).map((item) => (
                <li key={item.id ?? item.title} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span>{item.title}</span>
                    {item.dueAt ? <span className="text-xs text-slate-500">{formatRelativeTime(item.dueAt)}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <form className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={handleSave}>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                Status
                <select
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={!canManage || submitting}
                >
                  {GIG_ORDER_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                Progress
                <input
                  type="number"
                  value={progressDraft}
                  onChange={(event) => setProgressDraft(event.target.value)}
                  min="0"
                  max="100"
                  step="1"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={!canManage || submitting}
                />
              </label>
            </div>
            {feedback ? (
              <p className={`mt-3 text-sm ${feedback.tone === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {feedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Close
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={!canManage || submitting}
              >
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

GigOrderDrawer.propTypes = {
  open: PropTypes.bool,
  order: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  canManage: PropTypes.bool,
  onUpdate: PropTypes.func.isRequired,
};

GigOrderDrawer.defaultProps = {
  open: false,
  order: null,
  canManage: false,
};
