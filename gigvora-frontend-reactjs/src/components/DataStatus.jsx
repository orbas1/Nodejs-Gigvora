import { formatRelativeTime, formatAbsolute } from '../utils/date.js';

export default function DataStatus({ loading, fromCache, lastUpdated, onRefresh }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${
          fromCache ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-2 w-2 rounded-full ${
            fromCache ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />
        {fromCache ? 'Offline snapshot' : 'Live data'}
      </span>
      {loading ? <span className="animate-pulse">Refreshing…</span> : null}
      {lastUpdated ? (
        <span title={formatAbsolute(lastUpdated)} className="text-slate-400">
          Updated {formatRelativeTime(lastUpdated)}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => onRefresh?.()}
        disabled={loading}
        className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        Refresh
      </button>
    </div>
  );
}
