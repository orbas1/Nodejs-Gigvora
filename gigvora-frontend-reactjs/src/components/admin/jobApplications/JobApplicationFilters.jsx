import { XMarkIcon } from '@heroicons/react/24/outline';

const CONTROL_CLASS =
  'rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none';

function FilterSelect({ label, value, options, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={CONTROL_CLASS}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricChip({ label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
      <span className="uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}

function toSummary(summary = []) {
  return summary
    .filter((entry) => entry && entry.key)
    .map((entry) => ({
      key: entry.key,
      count: Number.parseInt(entry.count ?? 0, 10) || 0,
    }));
}

export default function JobApplicationFilters({
  filters,
  onFiltersChange,
  onReset,
  facets = {},
  metrics = {},
  onClose,
  initialFilters = { search: '', status: '', stage: '', priority: '', source: '', assignedRecruiterId: '' },
}) {
  const update = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const statusSummary = toSummary(metrics.statusSummary);
  const stageSummary = toSummary(metrics.stageSummary);

  const clear = () => {
    onFiltersChange({ ...initialFilters });
    onReset?.();
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
            aria-label="Close filters"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2 xl:col-span-3">
          <span>Search</span>
          <input
            type="search"
            value={filters.search ?? ''}
            onChange={(event) => update('search', event.target.value)}
            placeholder="Candidate, job, recruiter"
            className={CONTROL_CLASS}
          />
        </label>
        <FilterSelect
          label="Stage"
          value={filters.stage ?? ''}
          options={facets.stages ?? []}
          onChange={(value) => update('stage', value)}
          placeholder="All"
        />
        <FilterSelect
          label="Status"
          value={filters.status ?? ''}
          options={facets.statuses ?? []}
          onChange={(value) => update('status', value)}
          placeholder="All"
        />
        <FilterSelect
          label="Priority"
          value={filters.priority ?? ''}
          options={facets.priorities ?? []}
          onChange={(value) => update('priority', value)}
          placeholder="All"
        />
        <FilterSelect
          label="Source"
          value={filters.source ?? ''}
          options={facets.sources ?? []}
          onChange={(value) => update('source', value)}
          placeholder="All"
        />
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Recruiter</span>
          <select
            value={filters.assignedRecruiterId ?? ''}
            onChange={(event) => update('assignedRecruiterId', event.target.value)}
            className={CONTROL_CLASS}
          >
            <option value="">All</option>
            {(facets.recruiters ?? []).map((recruiter) => (
              <option key={recruiter.id} value={recruiter.id}>
                {recruiter.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          Reset
        </button>
        <div className="flex flex-wrap gap-2">
          {statusSummary.map((entry) => (
            <MetricChip key={`status-${entry.key}`} label={entry.key.replace(/_/g, ' ')} value={entry.count} />
          ))}
          {stageSummary.map((entry) => (
            <MetricChip key={`stage-${entry.key}`} label={entry.key.replace(/_/g, ' ')} value={entry.count} />
          ))}
        </div>
      </footer>
    </div>
  );
}
