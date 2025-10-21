import { FunnelIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline';

export default function AdminInboxToolbar({ onOpenFilters, onOpenLabels, onNewThread, onRefresh, syncing }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">Queue</div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onRefresh?.()}
          disabled={syncing}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
            syncing
              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              : 'border-slate-200 text-slate-600 hover:border-accent/60 hover:text-accent'
          }`}
          >
          {syncing ? 'Refreshing…' : 'Refresh'}
        </button>
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
        >
          <FunnelIcon className="h-4 w-4" /> Filters
        </button>
        <button
          type="button"
          onClick={onOpenLabels}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:text-amber-600"
        >
          <TagIcon className="h-4 w-4" /> Labels
        </button>
        <button
          type="button"
          onClick={onNewThread}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
        >
          <PlusIcon className="h-4 w-4" /> New
        </button>
      </div>
    </div>
  );
}
