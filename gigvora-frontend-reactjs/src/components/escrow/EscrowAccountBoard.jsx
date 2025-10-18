import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';

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

export default function EscrowAccountBoard({ accounts, currency, onAdd, onInspect, onEdit }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">Accounts</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
        >
          New
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white/60 text-slate-700">
            {accounts.length ? (
              accounts.map((account) => (
                <tr key={account.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {account.provider} · {account.currencyCode}
                    </div>
                    {account.externalId ? (
                      <p className="text-xs text-slate-500">{account.externalId}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm">{formatStatus(account.status)}</td>
                  <td className="px-4 py-3 text-sm">
                    {formatCurrency(account.currentBalance ?? 0, account.currencyCode ?? currency)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatCurrency(account.pendingReleaseTotal ?? 0, account.currencyCode ?? currency)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {account.updatedAt ? formatRelativeTime(account.updatedAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onInspect(account)}
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(account)}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  No escrow accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

EscrowAccountBoard.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object),
  currency: PropTypes.string,
  onAdd: PropTypes.func.isRequired,
  onInspect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

EscrowAccountBoard.defaultProps = {
  accounts: [],
  currency: 'USD',
};
