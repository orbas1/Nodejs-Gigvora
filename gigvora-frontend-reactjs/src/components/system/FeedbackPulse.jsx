import PropTypes from 'prop-types';
import {
  ArrowUpRightIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';

export function formatTrend(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0.0';
  }
  const numeric = Number(value);
  const prefix = numeric > 0 ? '+' : '';
  return `${prefix}${numeric.toFixed(1)}`;
}

function formatUpdatedAt(value) {
  if (!value) return 'moments ago';
  try {
    const date = typeof value === 'string' ? parseISO(value) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'moments ago';
    }
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch (error) {
    return 'moments ago';
  }
}

function clampToPercentage(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return Math.min(Math.max(value, 0), 200);
}

export default function FeedbackPulse({ analytics, onReview }) {
  const segments = Array.isArray(analytics.segments) ? analytics.segments : [];
  const highlights = Array.isArray(analytics.highlights) ? analytics.highlights : [];
  const alerts = Array.isArray(analytics.alerts) ? analytics.alerts : [];
  const responseBreakdown = Array.isArray(analytics.responseBreakdown) ? analytics.responseBreakdown : [];
  const topDrivers = Array.isArray(analytics.topDrivers) ? analytics.topDrivers : [];
  const queueTarget = analytics.queueTarget;
  const queueLoad = typeof analytics.queueDepth === 'number' && typeof queueTarget === 'number'
    ? analytics.queueDepth / queueTarget
    : null;
  const queueAboveTarget = typeof queueLoad === 'number' && queueLoad > 1;
  const totalResponses = typeof analytics.totalResponses === 'number' ? analytics.totalResponses : null;
  const queuePercent = typeof queueLoad === 'number' ? clampToPercentage(queueLoad * 100) : null;
  const queueStatusLabel = (() => {
    if (queuePercent === null) {
      return null;
    }
    if (queuePercent <= 100) {
      return 'Within target';
    }
    const overage = Math.round(queuePercent - 100);
    return `Over target by ${overage}%`;
  })();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900/95 p-6 text-white shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-slate-900/90" aria-hidden />
      <div className="relative space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative flex h-24 w-24 flex-col items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/10 blur-xl" aria-hidden />
              <div className="relative flex h-full w-full flex-col items-center justify-center rounded-full border border-emerald-400/40 bg-white/10 text-center shadow-[0_12px_40px_rgba(16,185,129,0.25)]">
                <span className="text-3xl font-semibold text-white">
                  {analytics.experienceScore.toFixed(1)}
                </span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Pulse</span>
              </div>
              <span className="mt-2 text-sm font-medium text-emerald-200">{formatTrend(analytics.trendDelta)}</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Experience pulse</p>
              <h3 className="text-xl font-semibold text-white">Real-time sentiment across maintenance audiences.</h3>
              <p className="mt-2 text-sm text-white/70">
                Benchmarked against LinkedIn-class support programmes with concierge-grade storytelling.
              </p>
              {totalResponses !== null ? (
                <p className="mt-3 text-[0.7rem] uppercase tracking-[0.3em] text-white/50">
                  Total responses · {totalResponses.toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-right text-xs text-white/70 space-y-1">
            <p>
              Queue depth:{' '}
              <span className={`font-semibold ${queueAboveTarget ? 'text-amber-200' : 'text-white'}`}>
                {analytics.queueDepth}
              </span>
              {typeof queueTarget === 'number' ? (
                <span className="ml-1 text-white/50">/ {queueTarget} target</span>
              ) : null}
            </p>
            <p>Median response: {analytics.medianResponseMinutes}m</p>
            <p>Updated {formatUpdatedAt(analytics.lastUpdated)}</p>
          </div>
        </header>

        {queuePercent !== null ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-white/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold uppercase tracking-[0.3em] text-white/60">Queue load</p>
              {queueStatusLabel ? (
                <span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] ${queueAboveTarget ? 'bg-amber-500/20 text-amber-100' : 'bg-emerald-500/20 text-emerald-100'}`}>
                  {queueStatusLabel}
                </span>
              ) : null}
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-white/10">
              <div
                className={`${queueAboveTarget ? 'bg-amber-400/80' : 'bg-emerald-400/80'} h-full rounded-full`}
                style={{ width: `${queuePercent > 180 ? 180 : queuePercent}%` }}
              />
            </div>
            <p className="mt-2 text-[0.65rem] uppercase tracking-[0.25em] text-white/50">
              Target {queueTarget} · Current {analytics.queueDepth}
            </p>
          </div>
        ) : null}

        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id || alert.message}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs ${
                  alert.severity === 'critical'
                    ? 'border-rose-400/60 bg-rose-500/15 text-rose-100'
                    : alert.severity === 'positive'
                      ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                      : 'border-amber-400/60 bg-amber-500/15 text-amber-100'
                }`}
              >
                <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                <span className="flex-1 text-left">{alert.message}</span>
                {alert.actionLabel && alert.actionLink ? (
                  <a
                    href={alert.actionLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/80 transition hover:text-white"
                  >
                    {alert.actionLabel}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {segments.length > 0 ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className="rounded-2xl border border-white/10 bg-white/10 p-4"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">{segment.label}</dt>
                <dd className="mt-2 flex items-baseline gap-2 text-lg font-semibold text-white">
                  {segment.score.toFixed(1)}
                  <span className={`text-sm font-medium ${segment.delta >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                    {formatTrend(segment.delta)}
                  </span>
                </dd>
                {segment.sampleSize ? (
                  <p className="text-[0.7rem] uppercase tracking-[0.2em] text-white/50">
                    {segment.sampleSize} responses
                  </p>
                ) : null}
              </div>
            ))}
          </dl>
        ) : null}

        {highlights.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Highlights</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {highlights.map((highlight) => (
                <article
                  key={highlight.id}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/80"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                      <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-white/70" aria-hidden="true" />
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{highlight.persona}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{highlight.sentiment}</p>
                      <p className="mt-2 text-sm text-white/80">“{highlight.quote}”</p>
                      <p className="mt-3 text-[0.7rem] uppercase tracking-[0.3em] text-white/50">
                        {formatUpdatedAt(highlight.recordedAt)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {responseBreakdown.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Response mix</p>
            <div className="space-y-2">
              {responseBreakdown.map((entry) => {
                const percent = typeof entry.percentage === 'number' && !Number.isNaN(entry.percentage)
                  ? Math.min(Math.max(entry.percentage, 0), 100)
                  : null;
                return (
                  <div key={entry.id || entry.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.25em] text-white/50">
                      <span>{entry.label}</span>
                      <span>{percent === null ? '—' : `${percent.toFixed(0)}%`}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400/70"
                        style={{ width: `${percent === null ? 0 : percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {topDrivers.length > 0 || analytics.sentimentNarrative ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Insight drivers</p>
            {analytics.sentimentNarrative ? (
              <p className="text-sm text-white/70">{analytics.sentimentNarrative}</p>
            ) : null}
            {topDrivers.length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {topDrivers.map((driver, index) => (
                  <li
                    key={`${index}-${driver.slice(0, 16)}`}
                    className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/10 p-3 text-xs text-white/80"
                  >
                    <SparklesIcon className="h-4 w-4 text-white/60" aria-hidden="true" />
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onReview}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-soft transition hover:bg-slate-100"
          >
            Review insights
            <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          {analytics.reviewUrl ? (
            <a
              href={analytics.reviewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:text-white"
            >
              Open dashboard
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

FeedbackPulse.propTypes = {
  analytics: PropTypes.shape({
    experienceScore: PropTypes.number.isRequired,
    trendDelta: PropTypes.number.isRequired,
    queueDepth: PropTypes.number.isRequired,
    medianResponseMinutes: PropTypes.number.isRequired,
    lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    reviewUrl: PropTypes.string,
    queueTarget: PropTypes.number,
    totalResponses: PropTypes.number,
    segments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        score: PropTypes.number.isRequired,
        delta: PropTypes.number.isRequired,
        sampleSize: PropTypes.number,
      }),
    ),
    highlights: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        persona: PropTypes.string.isRequired,
        quote: PropTypes.string.isRequired,
        sentiment: PropTypes.string.isRequired,
        recordedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      }),
    ),
    alerts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        message: PropTypes.string.isRequired,
        severity: PropTypes.oneOf(['caution', 'critical', 'positive']),
        actionLabel: PropTypes.string,
        actionLink: PropTypes.string,
      }),
    ),
    responseBreakdown: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string.isRequired,
        percentage: PropTypes.number,
      }),
    ),
    topDrivers: PropTypes.arrayOf(PropTypes.string),
    sentimentNarrative: PropTypes.string,
  }).isRequired,
  onReview: PropTypes.func,
};

