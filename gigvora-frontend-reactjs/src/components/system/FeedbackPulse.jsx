import PropTypes from 'prop-types';
import {
  ArrowUpRightIcon,
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
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

export default function FeedbackPulse({ analytics, onReview }) {
  const segments = Array.isArray(analytics.segments) ? analytics.segments : [];
  const highlights = Array.isArray(analytics.highlights) ? analytics.highlights : [];
  const alerts = Array.isArray(analytics.alerts) ? analytics.alerts : [];
  const channels = Array.isArray(analytics.channels) ? analytics.channels : [];
  const aiSummary = analytics.aiSummary ?? '';
  const targetScore = typeof analytics.targetScore === 'number' ? analytics.targetScore : 4.5;
  const pendingResponses = typeof analytics.pendingResponses === 'number' ? analytics.pendingResponses : 0;
  const health = analytics.health ?? (analytics.experienceScore >= targetScore ? 'On track' : 'Watchlist');

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900/95 p-6 text-white shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-slate-900/90" aria-hidden />
      <div className="relative space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl" aria-hidden />
              <span className="absolute inset-0 rounded-full border border-emerald-400/40" aria-hidden />
              <span className="absolute inset-0 rounded-full bg-emerald-500/10" aria-hidden />
              <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full border border-white/10 bg-white/10 text-center shadow-[inset_0_0_40px_rgba(99,102,241,0.25)]">
                <span className="text-3xl font-semibold text-white">{analytics.experienceScore.toFixed(1)}</span>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/60">Pulse</span>
              </div>
              <span className="absolute inset-0 animate-[pulse_6s_ease-in-out_infinite] rounded-full border border-white/10" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Experience pulse</p>
              <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-white">
                {health}
                <span className="text-emerald-200">{formatTrend(analytics.trendDelta)} vs last window</span>
              </p>
              <p className="mt-2 text-sm text-white/80">
                Target {targetScore.toFixed(1)} · Pending {pendingResponses} responses
              </p>
              {channels.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {channels.map((channel) => (
                    <span
                      key={channel.id || channel}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/80"
                    >
                      <BoltIcon className="h-4 w-4 text-white/60" aria-hidden="true" />
                      {channel.label || channel}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="text-right text-xs text-white/70">
            <p>Queue depth: <span className="font-semibold text-white">{analytics.queueDepth}</span></p>
            <p>Median response: {analytics.medianResponseMinutes}m</p>
            <p>Updated {formatUpdatedAt(analytics.lastUpdated)}</p>
          </div>
        </header>

        {aiSummary ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-white/80">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">AI summary</p>
            <p className="mt-2 leading-relaxed">{aiSummary}</p>
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

        {alerts.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">Alerts</p>
            <ul className="space-y-2">
              {alerts.map((alert) => (
                <li
                  key={alert.id || alert.title}
                  className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-50"
                >
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-semibold uppercase tracking-[0.3em]">{alert.title}</p>
                    {alert.description ? <p className="text-amber-100/80">{alert.description}</p> : null}
                    {alert.recommendedAction ? (
                      <p className="text-amber-200/80">Next: {alert.recommendedAction}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
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
    targetScore: PropTypes.number,
    pendingResponses: PropTypes.number,
    health: PropTypes.string,
    aiSummary: PropTypes.string,
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
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        recommendedAction: PropTypes.string,
      }),
    ),
    channels: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          id: PropTypes.string,
          label: PropTypes.string.isRequired,
        }),
      ]),
    ),
    pendingResponses: PropTypes.number,
  }).isRequired,
  onReview: PropTypes.func,
};

FeedbackPulse.defaultProps = {
  onReview: undefined,
};
