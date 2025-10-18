import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function QueuePanel({
  filters = [],
  activeFilter,
  onFilterChange,
  metrics = {},
  onCompose,
  onRefresh,
  loading,
}) {
  return (
    <aside className="flex h-full min-h-[32rem] w-full flex-col gap-6 rounded-3xl bg-white/90 p-4 shadow-xl ring-1 ring-slate-100">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Queues</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCompose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-accent text-white shadow-sm transition hover:bg-accentDark"
            aria-label="Compose"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Sync"
          >
            <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin' : '')} />
          </button>
        </div>
      </header>
      <div className="grid gap-2">
        {filters.map((filter) => {
          const isActive = filter.key === activeFilter;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onFilterChange?.(filter.key)}
              className={classNames(
                'flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition',
                isActive
                  ? 'border-accent bg-accentSoft text-accent shadow-soft'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-accent/50 hover:text-accent',
              )}
            >
              <span className="font-semibold">{filter.label}</span>
              <span className="text-xs font-semibold text-slate-400">{filter.count ?? '0'}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto grid gap-3">
        {[
          { key: 'total', label: 'Total' },
          { key: 'unread', label: 'Unread' },
          { key: 'support', label: 'Support' },
          { key: 'escalations', label: 'Escalations' },
        ].map((metric) => (
          <div key={metric.key} className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{metric.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{metrics[metric.key] ?? 0}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

