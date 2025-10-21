import PropTypes from 'prop-types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { formatRelativeTime, formatAbsolute } from '../utils/date.js';

function resolveDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function DataStatus({
  loading,
  fromCache,
  lastUpdated,
  onRefresh,
  onRetry,
  error,
  statusLabel = 'Live data',
  children,
}) {
  const resolvedLastUpdated = resolveDate(lastUpdated);
  const label = fromCache ? 'Offline snapshot' : statusLabel;
  const badgeTone = fromCache ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
  const dotTone = fromCache ? 'bg-amber-500' : 'bg-emerald-500';
  const handleRefresh = onRefresh ?? onRetry;
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${badgeTone}`}>
          <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${dotTone}`} />
          {label}
        </span>
        {loading ? <span className="animate-pulse">Refreshing…</span> : null}
        {resolvedLastUpdated ? (
          <span title={formatAbsolute(resolvedLastUpdated)} className="text-slate-400">
            Updated {formatRelativeTime(resolvedLastUpdated)}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => handleRefresh?.()}
          disabled={loading}
          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
      </div>
      {errorMessage ? (
        <div className="inline-flex w-full items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">We couldn&apos;t refresh your data</p>
            <p className="text-xs text-rose-600/90">{errorMessage ?? 'A temporary issue prevented us from loading the latest snapshot. Try refreshing in a moment.'}</p>
          </div>
        </div>
      ) : null}
      {children ? <div className="space-y-6">{children}</div> : null}
    </div>
  );
}

DataStatus.propTypes = {
  loading: PropTypes.bool,
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
  onRefresh: PropTypes.func,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  statusLabel: PropTypes.string,
  children: PropTypes.node,
};
