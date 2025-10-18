import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const ENTRY_TYPES = ['credit', 'debit', 'hold', 'release', 'adjustment'];

function formatCurrency(value, currency = 'USD') {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export default function WalletLedgerTable({
  entries,
  pagination,
  onPageChange,
  loading,
  currency,
  filters,
  onFilterChange,
}) {
  const items = Array.isArray(entries) ? entries : [];

  const handlePageChange = (direction) => {
    if (!pagination || typeof onPageChange !== 'function') {
      return;
    }
    if (direction === 'prev' && pagination.page > 1) {
      onPageChange(pagination.page - 1);
    }
    if (direction === 'next' && pagination.page < pagination.totalPages) {
      onPageChange(pagination.page + 1);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    if (typeof onFilterChange === 'function') {
      onFilterChange({ ...filters, page: 1, [name]: value || undefined });
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <label htmlFor="ledger-type" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
            </label>
            <select
              id="ledger-type"
              name="entryType"
              value={filters.entryType ?? ''}
              onChange={handleFilterChange}
              className="mt-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All</option>
              {ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ledger-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lookup
            </label>
            <input
              id="ledger-search"
              name="search"
              value={filters.search ?? ''}
              onChange={handleFilterChange}
              placeholder="Reference"
              className="mt-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3">Reference</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Balance</th>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">By</th>
              <th className="px-6 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 text-xs font-semibold text-slate-900">{entry.reference}</td>
                <td className="px-6 py-4 text-xs uppercase text-slate-500">{entry.entryType}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{formatCurrency(entry.amount, entry.currencyCode ?? currency)}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{formatCurrency(entry.balanceAfter, entry.currencyCode ?? currency)}</td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDate(entry.occurredAt)}</td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {entry.initiatedBy
                    ? `${entry.initiatedBy.firstName ?? ''} ${entry.initiatedBy.lastName ?? ''}`.trim() || entry.initiatedBy.email
                    : 'System'}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{entry.description ?? '—'}</td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-sm text-slate-500">
                  {loading ? 'Loading…' : 'No entries yet.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-600">
        <div>
          Showing {items.length} of {pagination?.totalItems ?? items.length} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange('prev')}
            disabled={!pagination || pagination.page <= 1}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Prev
          </button>
          <span className="text-xs font-semibold text-slate-500">
            Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange('next')}
            disabled={!pagination || pagination.page >= pagination.totalPages}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
