import { useMemo, useState } from 'react';
import { ArrowTopRightOnSquareIcon, FunnelIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'awaiting_customer', label: 'Awaiting customer' },
  { value: 'under_review', label: 'Under review' },
  { value: 'settled', label: 'Settled' },
  { value: 'closed', label: 'Closed' },
];

const STAGE_OPTIONS = [
  { value: '', label: 'All stages' },
  { value: 'intake', label: 'Intake' },
  { value: 'mediation', label: 'Mediation' },
  { value: 'arbitration', label: 'Arbitration' },
  { value: 'resolved', label: 'Resolved' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Newest updated' },
  { value: 'oldest', label: 'Oldest updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'deadline', label: 'Upcoming deadlines' },
];

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

function formatCurrency(amount, currency) {
  if (amount == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${amount} ${currency ?? ''}`.trim();
  }
}

const PRIORITY_BADGES = {
  urgent: 'bg-rose-100 text-rose-700 border border-rose-200',
  high: 'bg-amber-100 text-amber-700 border border-amber-200',
  medium: 'bg-blue-100 text-blue-700 border border-blue-200',
  low: 'bg-slate-100 text-slate-600 border border-slate-200',
};

export default function DisputeQueueTable({
  disputes,
  loading,
  filters,
  onFilterChange,
  onSelectDispute,
  onCreateDispute,
  pagination,
  onRefresh,
}) {
  const [searchValue, setSearchValue] = useState(filters?.search ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleFilterChange = (patch) => {
    onFilterChange?.((current) => ({ ...current, ...patch, page: 1 }));
  };

  const handlePageChange = (page) => {
    onFilterChange?.((current) => ({ ...current, page }));
  };

  const totalPages = useMemo(() => {
    if (!pagination?.pageCount) {
      return 1;
    }
    return Math.max(1, Number(pagination.pageCount) || 1);
  }, [pagination]);

  const currentPage = Math.min(Math.max(filters?.page ?? 1, 1), totalPages);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    handleFilterChange({ search: searchValue.trim() });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Cases</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/trust-center"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            Trust
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onCreateDispute}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search cases"
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Go
          </button>
        </form>
        <div className="flex gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            Reload
          </button>
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <select
            value={filters?.status ?? ''}
            onChange={(event) => handleFilterChange({ status: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters?.stage ?? ''}
            onChange={(event) => handleFilterChange({ stage: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters?.priority ?? ''}
            onChange={(event) => handleFilterChange({ priority: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters?.sort ?? 'recent'}
            onChange={(event) => handleFilterChange({ sort: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            Reload
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Case</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Amount on hold</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">Loading…</td>
              </tr>
            ) : disputes.length ? (
              disputes.map((dispute) => {
                const transaction = dispute.transaction ?? {};
                const badgeClass = PRIORITY_BADGES[dispute.priority] ?? PRIORITY_BADGES.medium;
                return (
                  <tr
                    key={dispute.id}
                    className="cursor-pointer transition hover:bg-blue-50/40"
                    onClick={() => onSelectDispute?.(dispute.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">Case #{dispute.id}</p>
                      <p className="text-xs text-slate-600">{dispute.reasonCode?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500">{dispute.summary}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700">{dispute.stage?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 capitalize text-slate-700">{dispute.status?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                        {dispute.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatCurrency(transaction.amount, transaction.currencyCode)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(dispute.updatedAt)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">No cases found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          Page {currentPage} of {totalPages}
          {pagination?.total != null ? ` · ${pagination.total.toLocaleString()} cases` : ''}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-4 lg:hidden">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <label className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Status</span>
                <select
                  value={filters?.status ?? ''}
                  onChange={(event) => handleFilterChange({ status: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Stage</span>
                <select
                  value={filters?.stage ?? ''}
                  onChange={(event) => handleFilterChange({ stage: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Priority</span>
                <select
                  value={filters?.priority ?? ''}
                  onChange={(event) => handleFilterChange({ priority: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Sort</span>
                <select
                  value={filters?.sort ?? 'recent'}
                  onChange={(event) => handleFilterChange({ sort: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
