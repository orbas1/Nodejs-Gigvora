import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

function formatCurrency(amount, currency) {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

export default function EscrowQueueBoard({ queue, currency, onRelease, onInspect, onRefund }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Release</h3>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{queue.length} waiting</p>
      </div>
      <div className="mt-4 space-y-3">
        {queue.length ? (
          queue.map((transaction) => (
            <div key={transaction.id} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-blue-700">{transaction.reference}</p>
                  <p className="text-xs text-blue-600">
                    {transaction.scheduledReleaseAt
                      ? formatAbsolute(transaction.scheduledReleaseAt, { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Awaiting schedule'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-blue-700">
                  {formatCurrency(transaction.amount ?? 0, transaction.currencyCode ?? currency)}
                </p>
              </div>
              <p className="mt-2 text-xs text-blue-600">
                Updated {transaction.updatedAt ? formatRelativeTime(transaction.updatedAt) : 'recently'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onRelease(transaction)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  Release
                </button>
                <button
                  type="button"
                  onClick={() => onRefund(transaction)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                >
                  Refund
                </button>
                <button
                  type="button"
                  onClick={() => onInspect(transaction)}
                  className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                >
                  View
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No payouts waiting.</p>
        )}
      </div>
    </div>
  );
}

EscrowQueueBoard.propTypes = {
  queue: PropTypes.arrayOf(PropTypes.object),
  currency: PropTypes.string,
  onRelease: PropTypes.func.isRequired,
  onInspect: PropTypes.func.isRequired,
  onRefund: PropTypes.func.isRequired,
};

EscrowQueueBoard.defaultProps = {
  queue: [],
  currency: 'USD',
};
