import PropTypes from 'prop-types';
import { ArrowPathIcon, CheckCircleIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
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

const STATE_CONFIG = Object.freeze({
  ready: {
    label: 'Operational',
    badgeTone: 'bg-emerald-100 text-emerald-700',
    dotTone: 'bg-emerald-500',
    iconTone: 'bg-emerald-500/10 text-emerald-600',
    Icon: CheckCircleIcon,
    defaultTitle: 'Live data',
    defaultMessage: 'Metrics, telemetry, and insights are ready to share.',
  },
  loading: {
    label: 'Refreshing',
    badgeTone: 'bg-sky-100 text-sky-700',
    dotTone: 'bg-sky-500',
    iconTone: 'bg-sky-500/10 text-sky-600',
    Icon: ArrowPathIcon,
    defaultTitle: 'Syncing the latest snapshot',
    defaultMessage: 'We are fetching live data and recalibrating signals.',
  },
  error: {
    label: 'Needs attention',
    badgeTone: 'bg-rose-100 text-rose-700',
    dotTone: 'bg-rose-500',
    iconTone: 'bg-rose-500/10 text-rose-600',
    Icon: ExclamationTriangleIcon,
    defaultTitle: 'We couldn’t refresh data',
    defaultMessage: 'A temporary issue prevented us from loading the latest snapshot.',
  },
  empty: {
    label: 'Awaiting data',
    badgeTone: 'bg-slate-100 text-slate-600',
    dotTone: 'bg-slate-400',
    iconTone: 'bg-slate-200 text-slate-500',
    Icon: DocumentTextIcon,
    defaultTitle: 'No records yet',
    defaultMessage: 'As soon as activity lands in this workspace it will appear here.',
  },
});

export default function DataStatus({
  loading,
  fromCache,
  lastUpdated,
  onRefresh,
  onRetry,
  error,
  statusLabel = 'Live data',
  state,
  title,
  message,
  empty,
  helper,
  insights,
  actions,
  children,
}) {
  const resolvedLastUpdated = resolveDate(lastUpdated);
  const derivedState = state ?? (error ? 'error' : loading ? 'loading' : empty ? 'empty' : 'ready');
  const config = STATE_CONFIG[derivedState] ?? STATE_CONFIG.ready;
  const metaLabel = fromCache ? 'Offline snapshot' : statusLabel ?? config.label;
  const badgeTone = fromCache ? 'bg-amber-100 text-amber-700' : config.badgeTone;
  const dotTone = fromCache ? 'bg-amber-500' : config.dotTone;
  const handleRefresh = onRefresh ?? onRetry;
  const errorMessage = typeof error === 'string' ? error : error?.message;
  const Icon = config.Icon ?? CheckCircleIcon;
  const resolvedTitle = title ?? (derivedState === 'error' && errorMessage ? 'Needs attention' : config.defaultTitle);
  const resolvedMessage =
    derivedState === 'error' && errorMessage ? errorMessage : message ?? config.defaultMessage;
  const resolvedHelper = helper ?? (fromCache ? 'Serving cached data until a connection resumes.' : null);
  const insightsList = Array.isArray(insights) ? insights.filter(Boolean) : [];
  const showRefreshButton = Boolean(handleRefresh);
  const refreshLabel = derivedState === 'error' ? 'Retry' : 'Refresh';

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${badgeTone}`}>
          <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${dotTone}`} />
          {metaLabel}
        </span>
        {derivedState === 'loading' ? (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
            Syncing
          </span>
        ) : null}
        {resolvedLastUpdated ? (
          <span title={formatAbsolute(resolvedLastUpdated)} className="text-slate-400">
            Updated {formatRelativeTime(resolvedLastUpdated)}
          </span>
        ) : null}
        {showRefreshButton ? (
          <button
            type="button"
            onClick={() => handleRefresh?.()}
            disabled={derivedState === 'loading'}
            className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshLabel}
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-3">
          <span className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${config.iconTone}`}>
            <Icon className={`h-5 w-5 ${derivedState === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900">{resolvedTitle}</h4>
            <p className="text-sm text-slate-500">{resolvedMessage}</p>
            {resolvedHelper ? <p className="text-xs text-slate-400">{resolvedHelper}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-none flex-col gap-2 text-right">{actions}</div> : null}
      </div>
      {insightsList.length ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          {insightsList.map((insight) => (
            <div
              key={insight.id ?? insight.label ?? insight.value}
              className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3"
            >
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {insight.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-700">{insight.value}</dd>
              {insight.caption ? <p className="mt-1 text-xs text-slate-400">{insight.caption}</p> : null}
            </div>
          ))}
        </dl>
      ) : null}
      {children ? <div className="space-y-4">{children}</div> : null}
    </div>
  );
}

DataStatus.propTypes = {
  loading: PropTypes.bool,
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
  onRefresh: PropTypes.func,
  onRetry: PropTypes.func,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  statusLabel: PropTypes.string,
  state: PropTypes.oneOf(['ready', 'loading', 'error', 'empty']),
  title: PropTypes.string,
  message: PropTypes.string,
  empty: PropTypes.bool,
  helper: PropTypes.string,
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      caption: PropTypes.string,
    }),
  ),
  actions: PropTypes.node,
  children: PropTypes.node,
};
