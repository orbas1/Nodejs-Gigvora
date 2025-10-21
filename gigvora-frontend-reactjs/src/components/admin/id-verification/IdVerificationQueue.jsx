import { useMemo } from 'react';
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const STATUS_DESCRIPTORS = {
  pending: { label: 'Pending', badge: 'bg-sky-100 text-sky-700' },
  submitted: { label: 'Submitted', badge: 'bg-blue-100 text-blue-700' },
  in_review: { label: 'In review', badge: 'bg-indigo-100 text-indigo-700' },
  verified: { label: 'Verified', badge: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', badge: 'bg-rose-100 text-rose-700' },
  expired: { label: 'Expired', badge: 'bg-slate-100 text-slate-600' },
};

const STATUS_OPTIONS = Object.entries(STATUS_DESCRIPTORS).map(([value, config]) => ({ value, label: config.label }));

function relativeTime(value) {
  if (!value) {
    return 'Unknown';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, 'minute');
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) {
    return rtf.format(hours, 'hour');
  }
  const days = Math.round(hours / 24);
  return rtf.format(days, 'day');
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export default function IdVerificationQueue({
  data = [],
  pagination,
  filters,
  onFiltersChange,
  onRefresh,
  onSelect,
  onStatusChange,
  loading = false,
  onExpand,
}) {
  const currentFilters = filters ?? {};
  const providers = useMemo(() => {
    const unique = new Set();
    data.forEach((item) => {
      if (item?.verificationProvider) {
        unique.add(item.verificationProvider);
      }
    });
    return Array.from(unique);
  }, [data]);

  const selectedStatuses = currentFilters.statuses ?? [];

  const handleStatusToggle = (status) => {
    if (!onFiltersChange) return;
    const next = new Set(selectedStatuses);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    onFiltersChange({ ...currentFilters, statuses: Array.from(next) });
  };

  const handleInputChange = (field) => (event) => {
    const value = event?.target?.value;
    onFiltersChange?.({ ...currentFilters, [field]: value ?? undefined });
  };

  const handleDateChange = (field) => (event) => {
    const value = event?.target?.value;
    onFiltersChange?.({ ...currentFilters, [field]: value || undefined });
  };

  const handleStatusSelect = (verificationId) => (event) => {
    const value = event?.target?.value;
    if (!value) {
      return;
    }
    onStatusChange?.(verificationId, value);
  };

  return (
    <section id="idv-queue" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Queue</h2>
        <div className="flex flex-wrap items-center gap-3">
          {onExpand ? (
            <button
              type="button"
              onClick={onExpand}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Expand
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            <input
              type="search"
              placeholder="Search by name, provider, or ID"
              value={currentFilters.search ?? ''}
              onChange={handleInputChange('search')}
              className="h-10 w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted after</p>
          <input
            type="date"
            value={currentFilters.submittedFrom ?? ''}
            onChange={handleDateChange('submittedFrom')}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted before</p>
          <input
            type="date"
            value={currentFilters.submittedTo ?? ''}
            onChange={handleDateChange('submittedTo')}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statuses</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {STATUS_OPTIONS.map((status) => {
              const active = selectedStatuses.includes(status.value);
              return (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => handleStatusToggle(status.value)}
                  className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                    active
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'
                  }`}
                >
                  {status.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider</p>
          <select
            value={currentFilters.provider ?? ''}
            onChange={handleInputChange('provider')}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="">All providers</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Reviewer</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  Loading verifications…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  No matching verifications. Adjust filters to see more results.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const descriptor = STATUS_DESCRIPTORS[item.status] ?? STATUS_DESCRIPTORS.pending;
                const reviewer = item.reviewer ?? {};
                const reviewerName = reviewer.name || reviewer.email || (item.reviewerId ? `Reviewer #${item.reviewerId}` : 'Unassigned');
                return (
                  <tr key={item.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-4 py-4 text-slate-700">
                      <div className="font-semibold text-slate-900">{item.fullName}</div>
                      {item.user?.email ? <p className="text-xs text-slate-500">{item.user.email}</p> : null}
                      {item.profile?.headline ? <p className="text-xs text-slate-400">{item.profile.headline}</p> : null}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${descriptor.badge}`}>
                        {descriptor.label}
                      </span>
                      <div className="mt-2">
                        <label
                          htmlFor={`idv-status-${item.id}`}
                          className="text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                        >
                          Update status
                        </label>
                        <select
                          id={`idv-status-${item.id}`}
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                          value={item.status}
                          onChange={handleStatusSelect(item.id)}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.verificationProvider?.replace(/_/g, ' ') || 'Manual review'}</td>
                    <td className="px-4 py-4 text-slate-600">
                      <div>{formatDateTime(item.submittedAt)}</div>
                      <p className="text-xs text-slate-400">{relativeTime(item.submittedAt)}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{reviewerName}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => onSelect?.(item.id)}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-sky-600 transition hover:border-sky-300 hover:text-sky-800"
                        >
                          Open record
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusChange?.(item.id, 'in_review')}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-800"
                        >
                          Move to in review
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Page {pagination.page} of {Math.max(pagination.totalPages ?? 1, 1)} • {pagination.total ?? data.length} records
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onFiltersChange?.({ ...currentFilters, page: Math.max(1, (currentFilters.page ?? pagination.page ?? 1) - 1) })}
              disabled={!pagination || pagination.page <= 1 || loading}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                onFiltersChange?.({
                  ...currentFilters,
                  page: Math.min(
                    (currentFilters.page ?? pagination.page ?? 1) + 1,
                    pagination.totalPages ?? (currentFilters.page ?? 1) + 1,
                  ),
                })
              }
              disabled={!pagination || pagination.page >= (pagination.totalPages ?? pagination.page ?? 1) || loading}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
