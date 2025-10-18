import { MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function JobListPanel({
  jobs,
  metadata,
  filters,
  onFilterChange,
  onSelectJob,
  selectedJobId,
  onFavoriteToggle,
  isLoading = false,
  workspaceId,
  onCreateJob,
}) {
  const selectedId = selectedJobId != null ? String(selectedJobId) : null;

  const handleSearchChange = (event) => {
    onFilterChange?.({ ...filters, search: event.target.value });
  };

  const handleStatusChange = (event) => {
    onFilterChange?.({ ...filters, status: event.target.value || undefined });
  };

  const renderStatus = (status) => {
    const label = status ? status.replace(/_/g, ' ') : 'unknown';
    let badgeClass = 'bg-slate-100 text-slate-700';
    if (status === 'open') badgeClass = 'bg-emerald-100 text-emerald-700';
    if (status === 'paused') badgeClass = 'bg-amber-100 text-amber-700';
    if (status === 'closed' || status === 'filled') badgeClass = 'bg-slate-200 text-slate-700';
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>{label}</span>;
  };

  const renderApplicationSummary = (summary) => {
    if (!summary || typeof summary !== 'object') {
      return '0 apps';
    }
    const total = summary.total ?? 0;
    return `${total} app${total === 1 ? '' : 's'}`;
  };

  const buildJobLink = (jobId) => {
    const params = new URLSearchParams();
    if (workspaceId) {
      params.set('workspaceId', workspaceId);
    }
    if (jobId != null) {
      params.set('jobId', String(jobId));
    }
    const query = params.toString();
    return `/dashboard/agency/job-management${query ? `?${query}` : ''}`;
  };

  const renderJobCard = (job) => {
    const jobId = String(job.id);
    const isSelected = selectedId === jobId;
    const favoriteCount = job.favoriteMemberIds?.length ?? 0;
    const updatedAt = job.updatedAt ? new Date(job.updatedAt) : null;
    const chips = [job.clientName, job.location, job.seniority?.replace(/_/g, ' ')].filter(Boolean);

    return (
      <li key={job.id}>
        <div
          className={classNames(
            'flex flex-col rounded-2xl border bg-white p-4 shadow-soft transition',
            isSelected ? 'border-accent/70 ring-2 ring-accent/20' : 'border-slate-200 hover:border-accent/40',
          )}
        >
          <button
            type="button"
            onClick={() => onSelectJob?.(job)}
            className="w-full text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {chips.map((chip, index) => (
                    <span key={`${chip}-${index}`} className="rounded-full bg-slate-100 px-2 py-0.5">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0">{renderStatus(job.status)}</div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>{renderApplicationSummary(job.applicationSummary)}</span>
              <span>{favoriteCount} ⭐</span>
              <span>{updatedAt ? updatedAt.toLocaleDateString() : 'No activity'}</span>
            </div>
          </button>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <a
              href={buildJobLink(job.id)}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-accent hover:text-accentDark"
            >
              Open
            </a>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onFavoriteToggle?.(job);
              }}
              className={classNames(
                'inline-flex items-center gap-1 rounded-2xl border px-3 py-1 text-xs font-semibold transition',
                favoriteCount > 0
                  ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:text-amber-600',
              )}
            >
              <StarIcon className="h-4 w-4" aria-hidden="true" />
              {favoriteCount > 0 ? 'Starred' : 'Star'}
            </button>
          </div>
        </div>
      </li>
    );
  };

  return (
    <aside
      id="agency-job-board"
      className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-soft"
    >
      <div className="space-y-3 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Jobs</h3>
          <button
            type="button"
            onClick={onCreateJob}
            className="rounded-2xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            New
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search"
              value={filters?.search ?? ''}
              onChange={handleSearchChange}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none"
            />
          </div>
          <select
            value={filters?.status ?? ''}
            onChange={handleStatusChange}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
          >
            <option value="">All statuses</option>
            {(metadata?.jobStatuses ?? []).map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading…</div>
        ) : jobs?.length ? (
          <ul className="space-y-3">{jobs.map(renderJobCard)}</ul>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            No jobs yet.
          </div>
        )}
      </div>
    </aside>
  );
}
