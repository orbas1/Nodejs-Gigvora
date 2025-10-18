import { useMemo } from 'react';
import {
  STATUS_ORDER,
  STATUS_LABELS,
  STATUS_BADGES,
  WORKFLOW_OPTIONS,
  VISIBILITY_OPTIONS,
} from './jobPostFormUtils.js';
import { MagnifyingGlassIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import formatDateTime from '../../../utils/formatDateTime.js';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function StatusCard({ status, count, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(status)}
      className={classNames(
        'flex h-28 flex-col justify-between rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        active ? 'ring-2 ring-indigo-500 ring-offset-2' : 'border-slate-200',
      )}
    >
      <div className="text-sm font-medium text-slate-500">{STATUS_LABELS[status] ?? status}</div>
      <div className="text-3xl font-semibold text-slate-900">{count}</div>
    </button>
  );
}

function FilterSelect({ label, value, options, onChange, placeholder = 'All' }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-500">
      <span className="font-medium text-slate-600">{label}</span>
      <select
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || undefined)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function JobRow({ job, onSelect }) {
  const detail = job.detail ?? {};
  const status = detail.status ?? 'draft';
  const badgeClass = STATUS_BADGES[status] ?? 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <button
      type="button"
      onClick={() => onSelect(job)}
      className="group flex w-full items-center justify-between rounded-xl border border-transparent bg-white px-4 py-3 text-left shadow-sm transition hover:border-indigo-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-3">
          <p className="truncate text-base font-semibold text-slate-900 group-hover:text-indigo-600">{job.title}</p>
          <span
            className={classNames(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
              badgeClass,
            )}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>{detail.visibility ?? 'public'}</span>
          {detail.workflowStage && <span>• {detail.workflowStage}</span>}
          <span>Updated {formatDateTime(detail.updatedAt ?? job.updatedAt)}</span>
        </div>
      </div>
      <div className="ml-4 text-xs font-medium text-indigo-600">Open</div>
    </button>
  );
}

export default function JobPostBoard({
  jobs,
  summary,
  filters,
  onFiltersChange,
  onSelectJob,
  onNewJob,
  onRefresh,
  loading,
  pagination,
  onPageChange,
}) {
  const statusTotals = useMemo(() => {
    const base = STATUS_ORDER.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});
    const statusCounts = summary?.statusCounts ?? {};
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (base[status] !== undefined) {
        base[status] = count;
      }
    });
    return base;
  }, [summary]);

  const handleFilterChange = (name, value) => {
    if (!onFiltersChange) {
      return;
    }
    onFiltersChange({
      ...filters,
      [name]: value || undefined,
      page: 1,
    });
  };

  const visibleJobs = Array.isArray(jobs) ? jobs : [];
  const pageState = pagination ?? { page: 1, totalPages: 1, total: visibleJobs.length };
  const canPrev = (pageState.page ?? 1) > 1;
  const canNext = (pageState.page ?? 1) < (pageState.totalPages ?? 1);

  return (
    <section id="jobs-board" className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-slate-900">Job Board</h2>
          <p className="text-sm text-slate-500">Monitor openings, drill into details, and launch updates without leaving this screen.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-500 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={onNewJob}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            New Job
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {STATUS_ORDER.map((status) => (
          <StatusCard
            key={status}
            status={status}
            count={statusTotals[status] ?? 0}
            active={filters?.status === status}
            onSelect={(value) => handleFilterChange('status', filters?.status === value ? undefined : value)}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3 space-y-5">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={filters?.search ?? ''}
              onChange={(event) => handleFilterChange('search', event.target.value)}
              placeholder="Search titles"
              className="flex-1 border-none bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </label>
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <FilterSelect
              label="Status"
              value={filters?.status ?? ''}
              options={STATUS_ORDER.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }))}
              onChange={(value) => handleFilterChange('status', value === filters?.status ? undefined : value)}
            />
            <FilterSelect
              label="Workflow"
              value={filters?.workflowStage ?? ''}
              options={WORKFLOW_OPTIONS}
              onChange={(value) => handleFilterChange('workflowStage', value === filters?.workflowStage ? undefined : value)}
            />
            <FilterSelect
              label="Visibility"
              value={filters?.visibility ?? ''}
              options={VISIBILITY_OPTIONS}
              onChange={(value) => handleFilterChange('visibility', value === filters?.visibility ? undefined : value)}
            />
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page <span className="font-semibold text-slate-900">{pageState.page ?? 1}</span> of{' '}
              <span className="font-semibold text-slate-900">{pageState.totalPages ?? 1}</span>
            </p>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-indigo-600">
                <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading…
              </div>
            )}
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {visibleJobs.length} of {pageState.total ?? visibleJobs.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange?.(Math.max((pageState.page ?? 1) - 1, 1))}
                  disabled={!canPrev}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange?.((pageState.page ?? 1) + 1)}
                  disabled={!canNext}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            {visibleJobs.length === 0 && !loading && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No job posts match the current filters. Create a new job or adjust filters to continue.
              </div>
            )}
            {visibleJobs.map((job) => (
              <JobRow key={job.id} job={job} onSelect={onSelectJob} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
