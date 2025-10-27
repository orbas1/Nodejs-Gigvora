import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import {
  formatCurrency,
  formatStatus,
  getStatusToneClasses,
} from './escrowUtils.js';

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
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3">Balances</th>
              <th className="px-4 py-3">Signals</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white/60 text-slate-700">
            {accounts.length ? (
              accounts.map((account) => {
                const badgeTone = getStatusToneClasses(account.status);
                const displayCurrency = account.currencyCode ?? currency;
                const lastReconciled = account.lastReconciledAt
                  ? formatAbsolute(account.lastReconciledAt, { dateStyle: 'medium' })
                  : '—';
                return (
                  <tr key={account.id} className="align-top hover:bg-blue-50/40">
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {account.provider} · {displayCurrency}
                      </div>
                      <p className="text-xs text-slate-500">Account #{account.id}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        {account.externalId ? (
                          <span className="rounded-full border border-slate-200 px-3 py-1">External · {account.externalId}</span>
                        ) : null}
                        {account.walletAccountId ? (
                          <span className="rounded-full border border-slate-200 px-3 py-1">Wallet · {account.walletAccountId}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeTone}`}>
                        {formatStatus(account.status)}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        Updated {account.updatedAt ? formatRelativeTime(account.updatedAt) : 'recently'}
                      </p>
                      <p className="text-xs text-slate-500">Reconciled {lastReconciled}</p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(account.currentBalance ?? 0, displayCurrency)}
                      </div>
                      <p className="text-xs text-slate-500">Balance</p>
                      <div className="mt-2 font-semibold text-blue-700">
                        {formatCurrency(account.pendingReleaseTotal ?? 0, displayCurrency)}
                      </div>
                      <p className="text-xs text-slate-500">Pending release</p>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="flex flex-wrap gap-2">
                        {account.metadata?.riskScore ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                            Risk score · {account.metadata.riskScore}
                          </span>
                        ) : null}
                        {account.metadata?.region ? (
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                            Region · {account.metadata.region}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                          {account.permissions?.autoReleaseEnabled ? 'Auto-release enabled' : 'Manual release'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
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
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
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
