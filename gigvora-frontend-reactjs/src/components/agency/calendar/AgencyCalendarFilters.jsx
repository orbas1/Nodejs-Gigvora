import { FunnelIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function AgencyCalendarFilters({
  filters,
  statusOptions,
  typeOrder,
  typeLabels,
  onStatusChange,
  onDateChange,
  onTypeToggle,
  onResetTypes,
  onRefresh,
  onCreate,
  disabled,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <FunnelIcon className="h-5 w-5" />
          Filters
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-accentDark"
          >
            <PlusIcon className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div className="grid gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</label>
          <select
            value={filters.status}
            onChange={(event) => onStatusChange?.(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => onDateChange?.('from', event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => onDateChange?.('to', event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Types</span>
            <button
              type="button"
              onClick={onResetTypes}
              className="text-xs font-semibold text-accent hover:text-accentDark"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {typeOrder.map((type) => {
              const active = Boolean(filters.types?.[type]);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onTypeToggle?.(type)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? '#fff' : '#94a3b8' }} />
                  {typeLabels[type] ?? type}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
