import { formatRelativeTime } from '../../utils/date.js';

function FilterButton({ id, label, description, count, active, onSelect, disabled }) {
  const countLabel = count === 0 ? '0' : `${count}`;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/30 ${
        active
          ? 'border-accent bg-accentSoft text-accent shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:text-slate-900'
      }`}
      aria-pressed={active}
      disabled={disabled}
      title={description}
      aria-label={`${label}. ${description}. ${count === 0 ? 'No updates available' : `${count} updates available`}`}
    >
      <span>{label}</span>
      <span className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
        <span className="inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        {countLabel}
      </span>
    </button>
  );
}

export default function ActivityFilters({
  filters,
  activeFilterId,
  onFilterChange,
  counts = {},
  total = 0,
  loading = false,
  fromCache = false,
  lastUpdated = null,
  onRefresh,
  newItems = 0,
}) {
  const formattedUpdatedAt = lastUpdated ? formatRelativeTime(lastUpdated) : 'moments ago';
  const freshnessLabel = loading ? 'Refreshing…' : fromCache ? 'Showing cached activity' : 'Live timeline';
  const totalLabel = total === 1 ? '1 update' : `${total} updates`;
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
          <span className="inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          Timeline focus
        </span>
        <div className="flex flex-wrap items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-slate-500">
            {freshnessLabel}
          </span>
          <span className="hidden text-slate-400 sm:inline">Updated {formattedUpdatedAt}</span>
          <span className="text-slate-300">{totalLabel}</span>
          <button
            type="button"
            onClick={() => onRefresh?.()}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] transition ${
              loading ? 'bg-accent/20 text-accentDark' : 'bg-accent text-white hover:bg-accentDark'
            }`}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <FilterButton
            key={filter.id}
            id={filter.id}
            label={filter.label}
            description={filter.description}
            count={counts[filter.id] ?? 0}
            active={activeFilterId === filter.id}
            onSelect={onFilterChange}
            disabled={loading && activeFilterId === filter.id}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50/80 px-4 py-2 text-[0.75rem] text-slate-500">
        <span className="inline-flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-wide text-slate-400">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          {newItems > 0
            ? `${newItems} draft${newItems === 1 ? '' : 's'} ready to publish`
            : 'Composer ready for your next update'}
        </span>
        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-300">
          {fromCache ? 'Cached view' : 'Live data'}
        </span>
      </div>
    </section>
  );
}
