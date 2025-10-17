import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function WorkforceSummaryCards({
  cards = [],
  onRefresh,
  loading,
  quickSections = [],
  onSelectSection,
}) {
  const hasCards = Array.isArray(cards) && cards.length > 0;
  const showEmptyState = !hasCards && !loading;
  const showSkeleton = !hasCards && loading;

  return (
    <section id="workforce-overview" className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Snapshot</h2>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
            disabled={loading}
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
            Refresh
          </button>
        ) : null}
      </div>
      {hasCards ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <button
              key={card.id ?? card.label}
              type="button"
              onClick={() => (card.sectionId ? onSelectSection?.(card.sectionId) : undefined)}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value ?? '—'}</p>
              {card.helper ? <p className="mt-1 text-xs text-slate-400">{card.helper}</p> : null}
            </button>
          ))}
        </div>
      ) : null}
      {showSkeleton ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={`metric-skeleton-${index}`}
              className="h-24 rounded-2xl border border-slate-200 bg-slate-50/70 animate-pulse"
            />
          ))}
        </div>
      ) : null}
      {showEmptyState ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm font-medium text-slate-600">
          No metrics yet.
        </div>
      ) : null}
      {quickSections.length ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {quickSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection?.(section.id)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              {section.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
