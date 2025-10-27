import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  InboxStackIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import classNames from '../utils/classNames.js';
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

const STATE_CONFIG = {
  loading: {
    icon: ArrowPathIcon,
    iconTone: 'text-sky-600',
    surface: 'border-sky-100 bg-sky-50/80',
    title: 'Refreshing data',
    description: 'Hang tight while we sync the latest metrics.',
    insights: ['Checks run across analytics, compliance, and billing services.'],
  },
  ready: {
    icon: CheckCircleIcon,
    iconTone: 'text-emerald-600',
    surface: 'border-emerald-100 bg-emerald-50/70',
    title: 'Live data on deck',
    description: 'Insights below reflect the most recent sync.',
    insights: ['Telemetry and audit trails are active for this workspace.'],
  },
  success: {
    icon: CheckCircleIcon,
    iconTone: 'text-emerald-600',
    surface: 'border-emerald-100 bg-emerald-50/70',
    title: 'Updates applied successfully',
    description: 'We captured your changes and refreshed dependent analytics.',
    insights: ['Activity feed and notifications already reflect this update.'],
  },
  degraded: {
    icon: ExclamationTriangleIcon,
    iconTone: 'text-amber-600',
    surface: 'border-amber-200 bg-amber-50/80',
    title: 'Performance is degraded',
    description: 'We’re seeing slower responses from downstream services. Your data is safe and under active monitoring.',
    insights: ['Telemetry is capturing elevated latency for affected regions.', 'Operations will post updates to the status page.'],
  },
  maintenance: {
    icon: InformationCircleIcon,
    iconTone: 'text-amber-500',
    surface: 'border-amber-100 bg-amber-50/70',
    title: 'Scheduled maintenance in progress',
    description: 'Some analytics are briefly unavailable while we complete scheduled upgrades.',
    insights: ['All changes are queued and will apply automatically once maintenance wraps.', 'Track progress on the status page.'],
  },
  error: {
    icon: ExclamationTriangleIcon,
    iconTone: 'text-rose-600',
    surface: 'border-rose-200 bg-rose-50/80',
    title: "We couldn't refresh your data",
    description: 'A temporary issue prevented us from loading the latest snapshot. Try refreshing in a moment.',
    insights: ['Operations team is alerted when repeated errors occur.'],
  },
  empty: {
    icon: InboxStackIcon,
    iconTone: 'text-slate-500',
    surface: 'border-slate-200 bg-slate-50/80',
    title: 'No data yet',
    description: 'Connect sources or adjust filters to populate insights.',
    insights: ['Invite teammates or import records to see live activity.'],
  },
};

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
  description,
  empty,
  actionLabel,
  onAction,
  insights,
  meta,
  footnote,
  helpLink,
  helpLabel = 'Open support centre',
  children,
}) {
  const resolvedLastUpdated = resolveDate(lastUpdated);
  const label = fromCache ? 'Offline snapshot' : statusLabel;
  const badgeTone = fromCache ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
  const dotTone = fromCache ? 'bg-amber-500' : 'bg-emerald-500';
  const handleRefresh = onRefresh ?? onRetry;
  const errorMessage = typeof error === 'string' ? error : error?.message;
  const resolvedState = state ?? (loading ? 'loading' : errorMessage ? 'error' : empty ? 'empty' : 'ready');
  const statePreset = STATE_CONFIG[resolvedState] ?? STATE_CONFIG.ready;
  const displayTitle = title ?? statePreset.title;
  const displayDescription = description ?? (resolvedState === 'error' ? errorMessage ?? statePreset.description : statePreset.description);
  const metaList = Array.isArray(meta) ? meta : [];
  const insightList = Array.isArray(insights) && insights.length ? insights : statePreset.insights ?? [];
  const showPanel = Boolean(
    displayTitle ||
      displayDescription ||
      insightList.length ||
      metaList.length ||
      actionLabel ||
      helpLink,
  );
  const statusAriaLive = ['error', 'degraded', 'maintenance'].includes(resolvedState) ? 'assertive' : 'polite';

  return (
    <div className="space-y-4" data-state={resolvedState}>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500" role="status" aria-live={statusAriaLive}>
        <span className={classNames('inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold', badgeTone)}>
          <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${dotTone}`} />
          {label}
        </span>
        {loading ? <span className="animate-pulse">Refreshing…</span> : null}
        {resolvedLastUpdated ? (
          <span title={formatAbsolute(resolvedLastUpdated)} className="text-slate-400">
            Updated {formatRelativeTime(resolvedLastUpdated)}
          </span>
        ) : null}
        {handleRefresh ? (
          <button
            type="button"
            onClick={() => handleRefresh?.()}
            disabled={loading}
            className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        ) : null}
      </div>
      {showPanel ? (
        <div
          className={classNames('space-y-4 rounded-3xl border p-5 shadow-sm', statePreset.surface)}
          data-state={resolvedState}
        >
          <div className="flex items-start gap-3">
            <span
              className={classNames(
                'inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white text-slate-700 shadow-inner',
                statePreset.iconTone,
                resolvedState === 'loading' ? 'animate-spin' : '',
              )}
            >
              <statePreset.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-2">
              {displayTitle ? <p className="text-sm font-semibold text-slate-900">{displayTitle}</p> : null}
              {displayDescription ? <p className="text-xs text-slate-500">{displayDescription}</p> : null}
              {insightList.length ? (
                <ul className="space-y-1 text-xs text-slate-500">
                  {insightList.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <InformationCircleIcon className="mt-0.5 h-4 w-4 flex-none text-slate-400" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          {metaList.length ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              {metaList.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/60 bg-white/70 p-4">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{item.value}</dd>
                  {item.trend ? (
                    <p className={classNames('text-xs', item.positive ? 'text-emerald-600' : 'text-rose-600')}>
                      {item.trend}
                    </p>
                  ) : null}
                </div>
              ))}
            </dl>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            {actionLabel && typeof onAction === 'function' ? (
              <button
                type="button"
                onClick={onAction}
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-soft transition hover:bg-accentDark"
              >
                {actionLabel}
              </button>
            ) : null}
            {helpLink ? (
              <a
                href={helpLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-accent transition hover:text-accentDark"
              >
                {helpLabel}
              </a>
            ) : null}
          </div>
          {footnote ? <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">{footnote}</p> : null}
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
    state: PropTypes.oneOf(['loading', 'ready', 'success', 'degraded', 'maintenance', 'error', 'empty']),
  title: PropTypes.string,
  description: PropTypes.string,
  empty: PropTypes.bool,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  insights: PropTypes.arrayOf(PropTypes.string),
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
      trend: PropTypes.string,
      positive: PropTypes.bool,
    }),
  ),
  footnote: PropTypes.string,
  helpLink: PropTypes.string,
  helpLabel: PropTypes.string,
  children: PropTypes.node,
};
