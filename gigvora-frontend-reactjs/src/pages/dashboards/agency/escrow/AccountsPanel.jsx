import { PlusIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../../../components/DataStatus.jsx';
import { useEscrow } from './EscrowContext.jsx';
import { formatCurrency } from './formatters.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_BADGE = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-sky-100 text-sky-700',
  suspended: 'bg-amber-100 text-amber-700',
  closed: 'bg-slate-200 text-slate-700',
};

export default function AccountsPanel() {
  const { state, dispatch, openAccountDrawer, reconcileAccount, openActivityDrawer, triggerToast } = useEscrow();
  const { accounts } = state;

  const handleStatusChange = (event) => {
    dispatch({ type: 'ACCOUNT_FILTERS', payload: { status: event.target.value } });
  };

  const handleSearchChange = (event) => {
    dispatch({ type: 'ACCOUNT_FILTERS', payload: { search: event.target.value } });
  };

  const handlePage = (direction) => {
    const nextOffset = Math.max(accounts.pagination.offset + direction * accounts.pagination.limit, 0);
    if (nextOffset === accounts.pagination.offset) return;
    dispatch({ type: 'ACCOUNT_PAGINATION', payload: { offset: nextOffset } });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm lg:flex-row">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">Manage settlement access and balances.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Status
            <select
              value={accounts.filters.status}
              onChange={handleStatusChange}
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-accent focus:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <input
            type="search"
            value={accounts.filters.search}
            onChange={handleSearchChange}
            placeholder="Search"
            className="w-48 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={() => openAccountDrawer()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <PlusIcon className="h-4 w-4" />
            New account
          </button>
        </div>
      </header>

      <DataStatus loading={accounts.loading} empty={!accounts.loading && accounts.list.length === 0}>
        <div className="grid gap-4 lg:grid-cols-3">
          {accounts.list.map((account) => (
            <article key={account.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{account.label || account.provider}</p>
                  <p className="text-xs text-slate-500">{account.provider?.toUpperCase()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[account.status] ?? 'bg-slate-200 text-slate-700'}`}>
                  {account.status}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                <div>
                  <dt className="text-xs text-slate-500">Balance</dt>
                  <dd className="font-semibold">{formatCurrency(account.currentBalance, account.currencyCode)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Pending</dt>
                  <dd className="font-semibold">{formatCurrency(account.pendingBalance, account.currencyCode)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Currency</dt>
                  <dd className="font-semibold">{account.currencyCode}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Last reconcile</dt>
                  <dd className="font-semibold">{account.lastReconciledAt ? new Date(account.lastReconciledAt).toLocaleDateString() : '—'}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openActivityDrawer('Account details', { type: 'account', item: account })}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Inspect
                  </button>
                  <button
                    type="button"
                    onClick={() => openAccountDrawer(account)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Edit
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    reconcileAccount(account.id).catch((error) =>
                      triggerToast(error.message || 'Unable to reconcile', 'error'),
                    )
                  }
                  className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Reconcile
                </button>
              </div>
            </article>
          ))}
        </div>
      </DataStatus>

      <footer className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        <span>
          Showing {Math.min(accounts.pagination.offset + 1, accounts.pagination.total)}-
          {Math.min(accounts.pagination.offset + accounts.list.length, accounts.pagination.total)} of {accounts.pagination.total}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePage(-1)}
            disabled={accounts.pagination.offset === 0}
            className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => handlePage(1)}
            disabled={accounts.pagination.offset + accounts.pagination.limit >= accounts.pagination.total}
            className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
