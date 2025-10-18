import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DisputeFilters({ filters, metadata, onChange, onReset }) {
  const statuses = metadata?.statuses ?? [];
  const stages = metadata?.stages ?? [];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <FunnelIcon className="h-4 w-4" aria-hidden="true" /> Filters
      </span>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span>Status</span>
        <select
          name="status"
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: event.target.value })}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <option value="">All</option>
          {statuses.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span>Stage</span>
        <select
          name="stage"
          value={filters.stage}
          onChange={(event) => onChange({ ...filters, stage: event.target.value })}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <option value="">All</option>
          {stages.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
        </select>
      </label>
      {(filters.status || filters.stage) && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" /> Clear
        </button>
      )}
    </div>
  );
}
