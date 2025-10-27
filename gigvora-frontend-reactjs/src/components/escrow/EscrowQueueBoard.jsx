import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import {
  coerceDate,
  formatCurrency,
  getRiskToneClasses,
  resolveCounterpartyName,
} from './escrowUtils.js';

export default function EscrowQueueBoard({ queue, currency, onRelease, onInspect, onRefund }) {
  const now = Date.now();
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Release</h3>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{queue.length} waiting</p>
      </div>
      <div className="mt-4 space-y-3">
        {queue.length ? (
          queue.map((transaction) => {
            const scheduledAt = coerceDate(transaction.scheduledReleaseAt ?? transaction.createdAt);
            let risk = 'success';
            if (scheduledAt) {
              const distance = scheduledAt.getTime() - now;
              if (distance < 0) {
                risk = 'critical';
              } else if (distance <= 1000 * 60 * 60 * 48) {
                risk = 'warning';
              }
            }
            const tone = getRiskToneClasses(risk === 'success' ? 'success' : risk);
            const counterparty = resolveCounterpartyName(transaction.counterparty);
            return (
              <div key={transaction.id} className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${tone}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{transaction.reference}</p>
                    {counterparty ? (
                      <p className="text-xs text-slate-600">Counterparty · {counterparty}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(transaction.amount ?? 0, transaction.currencyCode ?? currency)}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="rounded-full border border-slate-300 px-3 py-1">
                    {scheduledAt
                      ? formatAbsolute(scheduledAt, { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Awaiting schedule'}
                  </span>
                  <span className="rounded-full border border-slate-300 px-3 py-1">
                    Updated {transaction.updatedAt ? formatRelativeTime(transaction.updatedAt) : 'recently'}
                  </span>
                </div>
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
            );
          })
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
