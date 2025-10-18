import { FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../../../components/DataStatus.jsx';
import { useEscrow } from './EscrowContext.jsx';
import { formatCurrency } from './formatters.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'in_escrow', label: 'Escrow' },
  { value: 'pending_release', label: 'Pending' },
  { value: 'held', label: 'Held' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'released', label: 'Released' },
  { value: 'refunded', label: 'Refunded' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'project', label: 'Project' },
  { value: 'gig', label: 'Gig' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'expense', label: 'Expense' },
];

const STATUS_TONE = {
  in_escrow: 'text-sky-600',
  pending_release: 'text-amber-600',
  held: 'text-amber-600',
  disputed: 'text-rose-600',
  released: 'text-emerald-600',
  refunded: 'text-slate-500',
};

export default function TransactionsPanel() {
  const {
    state,
    dispatch,
    openTransactionWizard,
    releaseTransaction,
    refundTransaction,
    openActivityDrawer,
    triggerToast,
  } = useEscrow();
  const { transactions } = state;

  const handleFilterChange = (key) => (event) => {
    dispatch({ type: 'TRANSACTION_FILTERS', payload: { [key]: event.target.value } });
  };

  const handlePage = (direction) => {
    const nextOffset = Math.max(transactions.pagination.offset + direction * transactions.pagination.limit, 0);
    if (nextOffset === transactions.pagination.offset) return;
    dispatch({ type: 'TRANSACTION_PAGINATION', payload: { offset: nextOffset } });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm lg:flex-row">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Moves</h1>
          <p className="mt-1 text-sm text-slate-500">Track releases, holds, and refunds.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            <FunnelIcon className="h-4 w-4" />
            <select
              value={transactions.filters.status}
              onChange={handleFilterChange('status')}
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-accent focus:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={transactions.filters.type}
              onChange={handleFilterChange('type')}
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-accent focus:outline-none"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="search"
            value={transactions.filters.search}
            onChange={handleFilterChange('search')}
            placeholder="Search"
            className="w-48 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={() => openTransactionWizard()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <PlusIcon className="h-4 w-4" />
            New move
          </button>
        </div>
      </header>

      <DataStatus loading={transactions.loading} empty={!transactions.loading && transactions.list.length === 0}>
        <div className="flex flex-col gap-3">
          {transactions.list.map((transaction) => (
            <article key={transaction.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      openActivityDrawer('Move details', { type: 'move', item: transaction })
                    }
                    className="text-left text-base font-semibold text-slate-900 hover:underline"
                  >
                    {transaction.reference}
                  </button>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{transaction.type}</span>
                    <span>•</span>
                    <span>{transaction.account?.provider}</span>
                    <span>•</span>
                    <span>{new Date(transaction.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(transaction.amount, transaction.currencyCode)}
                  </p>
                  <p className={`text-xs font-semibold ${STATUS_TONE[transaction.status] ?? 'text-slate-500'}`}>
                    {transaction.status}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openTransactionWizard(transaction)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await releaseTransaction(transaction.id);
                      } catch (error) {
                        triggerToast(error.message || 'Unable to release move', 'error');
                      }
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    disabled={transaction.status === 'released'}
                  >
                    Release
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await refundTransaction(transaction.id);
                      } catch (error) {
                        triggerToast(error.message || 'Unable to refund move', 'error');
                      }
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    disabled={transaction.status === 'refunded'}
                  >
                    Refund
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  Fee {formatCurrency(transaction.feeAmount, transaction.currencyCode)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </DataStatus>

      <footer className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        <span>
          Showing {Math.min(transactions.pagination.offset + 1, transactions.pagination.total)}-
          {Math.min(transactions.pagination.offset + transactions.list.length, transactions.pagination.total)} of {transactions.pagination.total}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePage(-1)}
            disabled={transactions.pagination.offset === 0}
            className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => handlePage(1)}
            disabled={transactions.pagination.offset + transactions.pagination.limit >= transactions.pagination.total}
            className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
