import { formatRelativeTime } from '../../utils/date.js';

function FilterButton({ id, label, description, count, active, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={`flex flex-1 flex-col gap-2 rounded-3xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-accent/30 sm:px-5 sm:py-5 ${
        active
          ? 'border-accent bg-accentSoft text-accent shadow-sm'
          : 'border-slate-200 bg-white text-slate-700 hover:border-accent/40 hover:shadow-sm'
      }`}
      aria-pressed={active}
      disabled={disabled}
    >
      <span className="text-sm font-semibold text-current">{label}</span>
      <span className="text-xs text-slate-500">{description}</span>
      <span className="mt-3 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
        <span className="inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        {count === 0 ? 'No posts yet' : `${count} update${count === 1 ? '' : 's'}`}
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
    <section className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Timeline focus</p>
          <h2 className="text-lg font-semibold text-slate-900">Curate your feed</h2>
          <p className="text-sm text-slate-500">
            Dial between opportunities, media drops, and mission-critical signals without losing the premium rhythm.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-wide text-slate-500">
            {freshnessLabel}
          </span>
          <span>{`Updated ${formattedUpdatedAt}`}</span>
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">{totalLabel}</span>
          <button
            type="button"
            onClick={() => onRefresh?.()}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide transition ${
              loading ? 'bg-accent/30 text-white' : 'bg-accent text-white hover:bg-accentDark'
            }`}
          >
            {loading ? 'Refreshing…' : 'Refresh feed'}
          </button>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          {newItems > 0
            ? `${newItems} new draft${newItems === 1 ? '' : 's'} ready to publish`
            : 'Craft the next story right from the composer above.'}
        </span>
        <span className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
          Filter tips
          <span className="hidden sm:inline">•</span>
          <span className="text-slate-500">
            Combine filters with search soon — saved segments roll out next.
          </span>
        </span>
      </div>
    </section>
  );
}
