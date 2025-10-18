import { useMemo } from 'react';
import { formatDateForDisplay, TIMELINE_STATUSES, TIMELINE_VISIBILITIES } from './timelineUtils.js';

export default function TimelineList({
  timelines,
  selectedTimelineId,
  onSelect,
  filters,
  onFiltersChange,
  loading,
}) {
  const filtered = useMemo(() => {
    const query = (filters.query || '').toLowerCase();
    return timelines.filter((timeline) => {
      const matchesQuery = !query
        || `${timeline.name ?? ''}`.toLowerCase().includes(query)
        || `${timeline.slug ?? ''}`.toLowerCase().includes(query);
      const matchesStatus = !filters.status || timeline.status === filters.status;
      const matchesVisibility = !filters.visibility || timeline.visibility === filters.visibility;
      return matchesQuery && matchesStatus && matchesVisibility;
    });
  }, [filters.query, filters.status, filters.visibility, timelines]);

  return (
    <aside className="flex h-full min-h-[24rem] flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={filters.query}
          onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
          placeholder="Search"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filters.status}
            onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="">All status</option>
            {TIMELINE_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <select
            value={filters.visibility}
            onChange={(event) => onFiltersChange({ ...filters, visibility: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="">All view</option>
            {TIMELINE_VISIBILITIES.map((visibility) => (
              <option key={visibility.value} value={visibility.value}>
                {visibility.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {loading && !timelines.length ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
            Loading timelines…
          </div>
        ) : null}
        {!loading && filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-500">
            <div>
              <p className="font-medium text-slate-600">No timelines</p>
              <p className="mt-1 text-xs text-slate-500">Adjust filters or create a new one.</p>
            </div>
          </div>
        ) : null}
        {filtered.map((timeline) => {
          const isActive = timeline.id === selectedTimelineId;
          const start = formatDateForDisplay(timeline.startDate);
          const end = formatDateForDisplay(timeline.endDate);
          return (
            <button
              key={timeline.id}
              type="button"
              onClick={() => onSelect(timeline.id)}
              className={[
                'w-full rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-base font-semibold">{timeline.name}</p>
                <span
                  className={[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
                    timeline.status === 'active'
                      ? isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-700'
                      : timeline.status === 'draft'
                      ? isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                      : isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700',
                  ].join(' ')}
                >
                  {timeline.status ?? 'Draft'}
                </span>
              </div>
              <p className={['mt-1 text-sm', isActive ? 'text-white/80' : 'text-slate-600'].join(' ')}>
                {timeline.summary || 'No summary'}
              </p>
              <div className={['mt-3 flex items-center justify-between text-xs font-medium', isActive ? 'text-white/70' : 'text-slate-500'].join(' ')}>
                <span>{timeline.visibility ? timeline.visibility.replace('_', ' ') : 'Internal'}</span>
                <span>{start && end ? `${start} → ${end}` : 'Schedule pending'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
