import { useMemo } from 'react';
import { formatRelativeTime } from '../../utils/date.js';

function FilterButton({
  id,
  label,
  description,
  count,
  active,
  onSelect,
  disabled,
  descriptionId,
  trending,
  beta,
}) {
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
      aria-describedby={descriptionId}
    >
      <span className="text-sm font-semibold text-current">{label}</span>
      <span id={descriptionId} className="text-xs text-slate-500">
        {description}
      </span>
      <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
        <span className="inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        {count === 0 ? 'No posts yet' : `${count} update${count === 1 ? '' : 's'}`}
        {trending ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-amber-700">
            🔥 Trending
          </span>
        ) : null}
        {beta ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-indigo-700">
            Beta
          </span>
        ) : null}
      </div>
    </button>
  );
}

function FocusLegend({ activeFilter, activeCount }) {
  if (!activeFilter) {
    return null;
  }

  return (
    <div className="mt-6 grid gap-3 rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 text-xs text-slate-500 sm:grid-cols-2">
      <div className="space-y-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">Active focus</p>
        <p className="font-semibold text-slate-700">{activeFilter.label}</p>
        <p>{activeFilter.longDescription ?? activeFilter.description}</p>
      </div>
      <div className="space-y-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">Why it matters</p>
        <p>
          {activeCount === 0
            ? 'No stories match right now—prime the composer to publish a fresh update.'
            : `${activeCount} curated update${activeCount === 1 ? '' : 's'} tuned to this lens.`}
        </p>
        <p className="text-[0.65rem] text-slate-400">
          Upcoming releases layer saved segments and AI prompts on top of these focus rails.
        </p>
      </div>
    </div>
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
  const activeFilter = useMemo(
    () => filters.find((filter) => filter.id === activeFilterId) ?? filters[0] ?? null,
    [activeFilterId, filters],
  );
  const activeCount = activeFilter ? counts[activeFilter.id] ?? 0 : 0;
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
            descriptionId={`${filter.id}-description`}
            trending={filter.trending}
            beta={filter.beta}
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
      <FocusLegend activeFilter={activeFilter} activeCount={activeCount} />
    </section>
  );
}
