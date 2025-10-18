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

function formatStatus(value) {
  if (!value) return 'Unknown';
  return value
    .toString()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function EscrowActivityBoard({
  transactions,
  currency,
  onCreate,
  onInspect,
  onEdit,
  onRelease,
  onRefund,
  onDispute,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">Activity</h3>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
        >
          New
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white/60 text-slate-700">
            {transactions.length ? (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{transaction.reference}</div>
                    <p className="text-xs text-slate-500">
                      {transaction.createdAt
                        ? formatAbsolute(transaction.createdAt, { dateStyle: 'medium', timeStyle: 'short' })
                        : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm">{transaction.account?.displayName ?? `#${transaction.accountId}`}</td>
                  <td className="px-4 py-3 text-sm">
                    {formatCurrency(transaction.amount ?? 0, transaction.currencyCode ?? currency)}
                  </td>
                  <td className="px-4 py-3 text-sm">{formatStatus(transaction.status)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {transaction.updatedAt ? formatRelativeTime(transaction.updatedAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onInspect(transaction)}
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(transaction)}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      {['in_escrow', 'funded', 'disputed'].includes(transaction.status) ? (
                        <>
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
                        </>
                      ) : null}
                      {transaction.status !== 'disputed' ? (
                        <button
                          type="button"
                          onClick={() => onDispute(transaction)}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 transition hover:border-amber-300 hover:bg-amber-100"
                        >
                          Dispute
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  No escrow transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

EscrowActivityBoard.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object),
  currency: PropTypes.string,
  onCreate: PropTypes.func.isRequired,
  onInspect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onRelease: PropTypes.func.isRequired,
  onRefund: PropTypes.func.isRequired,
  onDispute: PropTypes.func.isRequired,
};

EscrowActivityBoard.defaultProps = {
  transactions: [],
  currency: 'USD',
};
