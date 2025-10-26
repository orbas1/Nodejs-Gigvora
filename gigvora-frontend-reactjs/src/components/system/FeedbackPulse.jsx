import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ArrowPathIcon,
  ChatBubbleBottomCenterTextIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';
import { useDataFetchingLayer } from '../../context/DataFetchingLayer.js';
import { useToast } from '../../context/ToastContext.jsx';
import { createSystemStatusToastPayload } from './SystemStatusToast.jsx';
import { formatRelativeTime } from '../../utils/date.js';

const DEFAULT_TIMEFRAMES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Quarter' },
];

const SENTIMENT_COLORS = {
  positive: 'text-emerald-600 bg-emerald-50 ring-emerald-100',
  neutral: 'text-slate-600 bg-slate-100 ring-slate-200',
  negative: 'text-rose-600 bg-rose-50 ring-rose-100',
};

const HIGHLIGHT_PLACEHOLDER = {
  quote: 'We finally feel seen. The onboarding journey clarifies value within minutes.',
  persona: 'Founder · Growth Collective',
  submittedAt: new Date().toISOString(),
  channel: 'Pulse Survey',
  sentiment: 'positive',
};

function clampNumber(value, min, max, fallback = min) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function normaliseTheme(theme, index) {
  if (!theme) {
    return null;
  }
  if (typeof theme === 'string') {
    return {
      id: `theme-${index}`,
      name: theme,
      score: null,
      change: null,
    };
  }
  if (typeof theme === 'object') {
    const id = theme.id || theme.slug || `theme-${index}`;
    const name = theme.name || theme.title || theme.theme || theme.topic;
    if (!name) {
      return null;
    }
    return {
      id,
      name,
      score: typeof theme.score === 'number' ? clampNumber(theme.score, 0, 100, null) : null,
      change: typeof theme.change === 'number' ? theme.change : typeof theme.delta === 'number' ? theme.delta : null,
    };
  }
  return null;
}

function normaliseHighlight(highlight, index) {
  if (!highlight) {
    return null;
  }
  if (typeof highlight === 'string') {
    return { ...HIGHLIGHT_PLACEHOLDER, id: `highlight-${index}`, quote: highlight };
  }
  if (typeof highlight === 'object') {
    const id = highlight.id || highlight.reference || `highlight-${index}`;
    const quote = highlight.quote || highlight.comment || highlight.feedback || null;
    if (!quote) {
      return null;
    }
    return {
      id,
      quote,
      persona: highlight.persona || highlight.role || highlight.account || 'Member feedback',
      team: highlight.team || highlight.segment || null,
      submittedAt:
        highlight.submittedAt || highlight.recordedAt || highlight.createdAt || new Date().toISOString(),
      channel: highlight.channel || highlight.source || 'Survey',
      sentiment: (highlight.sentiment || highlight.tone || 'neutral').toLowerCase(),
      driver: highlight.driver || highlight.theme || null,
    };
  }
  return null;
}

function normaliseAlerts(alerts) {
  if (!alerts || typeof alerts !== 'object') {
    return { unresolved: 0, critical: 0, acknowledged: 0 };
  }
  return {
    unresolved: alerts.unresolved ?? alerts.open ?? 0,
    critical: alerts.critical ?? alerts.high ?? 0,
    acknowledged: alerts.acknowledged ?? alerts.inProgress ?? 0,
  };
}

function normaliseSystemStatus(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const status = (payload.status || payload.state || 'operational').toLowerCase();
  return {
    id: payload.id,
    status,
    headline: payload.headline || payload.title,
    description: payload.description || payload.summary,
    impactedServices: payload.impactedServices || payload.services || [],
    maintenanceWindow: payload.maintenanceWindow || null,
    updatedAt: payload.updatedAt || payload.timestamp || new Date().toISOString(),
    statusPageUrl: payload.statusPageUrl || payload.url || null,
    analyticsContext: payload.analyticsContext || null,
  };
}

function normalisePulse(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const themes = toArray(payload.topThemes || payload.themes || payload.focusAreas)
    .map((item, index) => normaliseTheme(item, index))
    .filter(Boolean);
  const highlights = toArray(payload.highlights || payload.quotes || payload.latestFeedback)
    .map((item, index) => normaliseHighlight(item, index))
    .filter(Boolean);
  const alerts = normaliseAlerts(payload.alerts);
  const systemStatus = normaliseSystemStatus(payload.systemStatus);

  return {
    overallScore: clampNumber(payload.overallScore ?? payload.nps ?? payload.csat ?? 0, 0, 100, 0),
    scoreChange: typeof payload.scoreChange === 'number' ? payload.scoreChange : payload.delta ?? 0,
    responseRate: clampNumber(payload.responseRate ?? payload.participationRate ?? 0, 0, 100, 0),
    responseDelta: typeof payload.responseDelta === 'number' ? payload.responseDelta : payload.participationDelta ?? 0,
    sampleSize: payload.sampleSize ?? payload.responses ?? null,
    lastUpdated: payload.updatedAt || payload.lastUpdatedAt || new Date().toISOString(),
    themes,
    highlights: highlights.length > 0 ? highlights : [HIGHLIGHT_PLACEHOLDER],
    alerts,
    systemStatus,
  };
}

export function FeedbackPulse({
  resource = '/analytics/feedback/pulse',
  timeframe = '7d',
  timeframes = DEFAULT_TIMEFRAMES,
  autoRefreshInterval = 60000,
  data: dataProp,
  loading: loadingProp = false,
  error: errorProp = null,
  onTimeframeChange,
  onViewFeedback,
  className,
  style,
  analyticsContext,
}) {
  const { fetchResource, subscribe, buildKey } = useDataFetchingLayer();
  const { pushToast } = useToast();
  const [state, setState] = useState(() => {
    if (dataProp) {
      return { status: 'ready', data: normalisePulse(dataProp), error: null };
    }
    if (loadingProp) {
      return { status: 'loading', data: null, error: null };
    }
    if (errorProp) {
      return { status: 'error', data: null, error: errorProp };
    }
    return { status: 'idle', data: null, error: null };
  });
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const lastStatusSignature = useRef(null);

  useEffect(() => {
    if (dataProp) {
      setState({ status: 'ready', data: normalisePulse(dataProp), error: null });
    }
  }, [dataProp]);

  useEffect(() => {
    if (dataProp) {
      return;
    }
    setState((previous) => {
      if (loadingProp) {
        return { ...previous, status: 'loading', error: null };
      }
      if (errorProp) {
        return { ...previous, status: 'error', error: errorProp };
      }
      return previous;
    });
  }, [dataProp, loadingProp, errorProp]);

  const shouldFetch = !dataProp && Boolean(resource);
  const cacheKey = useMemo(
    () => (shouldFetch ? buildKey('GET', resource, { timeframe: currentTimeframe }) : null),
    [buildKey, resource, currentTimeframe, shouldFetch],
  );

  useEffect(() => {
    if (!shouldFetch || !cacheKey) {
      return undefined;
    }
    let active = true;
    setState((previous) => ({ ...previous, status: 'loading', error: null }));
    fetchResource(resource, {
      key: cacheKey,
      params: { timeframe: currentTimeframe },
      strategy: 'stale-while-revalidate',
      metadata: { origin: 'FeedbackPulse', timeframe: currentTimeframe, ...analyticsContext },
    })
      .then((payload) => {
        if (!active) return;
        setState({ status: 'ready', data: normalisePulse(payload), error: null });
      })
      .catch((error) => {
        if (!active) return;
        setState({ status: 'error', data: null, error });
      });

    const unsubscribe = subscribe(cacheKey, (payload) => {
      if (!active) {
        return;
      }
      if (!payload || (!payload.data && !payload.highlights)) {
        return;
      }
      const next = normalisePulse(payload.data ?? payload);
      setState({ status: 'ready', data: next, error: null });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [analyticsContext, cacheKey, currentTimeframe, fetchResource, resource, shouldFetch, subscribe]);

  useEffect(() => {
    if (!shouldFetch || !cacheKey || !autoRefreshInterval) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      fetchResource(resource, {
        key: cacheKey,
        params: { timeframe: currentTimeframe },
        strategy: 'network-only',
        metadata: { origin: 'FeedbackPulse', timeframe: currentTimeframe, refresh: true, ...analyticsContext },
      }).catch(() => {});
    }, autoRefreshInterval);
    return () => {
      window.clearInterval(interval);
    };
  }, [analyticsContext, autoRefreshInterval, cacheKey, currentTimeframe, fetchResource, resource, shouldFetch]);

  useEffect(() => {
    if (!pushToast || !state.data?.systemStatus) {
      return;
    }
    const normalised = normaliseSystemStatus(state.data.systemStatus);
    if (!normalised || !normalised.status || normalised.status === 'operational') {
      return;
    }
    const signature = JSON.stringify({ status: normalised.status, headline: normalised.headline, updatedAt: normalised.updatedAt });
    if (signature === lastStatusSignature.current) {
      return;
    }
    lastStatusSignature.current = signature;
    pushToast(
      createSystemStatusToastPayload({
        ...normalised,
        analyticsContext: { ...analyticsContext, origin: 'FeedbackPulse' },
      }),
    );
  }, [analyticsContext, pushToast, state.data?.systemStatus]);

  const handleTimeframeChange = (value) => {
    if (value === currentTimeframe) {
      return;
    }
    setCurrentTimeframe(value);
    analytics.track('feedback_pulse_timeframe_changed', {
      timeframe: value,
      previousTimeframe: currentTimeframe,
      ...analyticsContext,
    });
    onTimeframeChange?.(value);
  };

  const handleViewFeedback = () => {
    analytics.track('feedback_pulse_view_feedback', {
      timeframe: currentTimeframe,
      ...analyticsContext,
    });
    onViewFeedback?.();
  };

  const handleManualRefresh = () => {
    analytics.track('feedback_pulse_refreshed', {
      timeframe: currentTimeframe,
      source: 'manual',
      ...analyticsContext,
    });
    if (shouldFetch && cacheKey) {
      fetchResource(resource, {
        key: cacheKey,
        params: { timeframe: currentTimeframe },
        strategy: 'network-only',
        metadata: { origin: 'FeedbackPulse', timeframe: currentTimeframe, manualRefresh: true, ...analyticsContext },
      }).catch(() => {});
    }
  };

  const loading = state.status === 'loading';
  const error = state.error;
  const data = state.data;

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white/95 via-white/80 to-indigo-50 p-6 shadow-xl shadow-slate-900/5 backdrop-blur',
        className,
      )}
      style={style}
    >
      <BackgroundGlow />
      <header className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Feedback pulse</p>
          <h2 className="text-2xl font-semibold text-slate-900">
            {loading || !data ? 'Experience quality' : `Experience quality · ${Math.round(data.overallScore)} / 100`}
          </h2>
          <p className="text-sm text-slate-600">
            Live satisfaction, response health, and trending wins sourced from surveys, interviews, and concierge support.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {timeframes.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTimeframeChange(option.value)}
              className={clsx(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2',
                option.value === currentTimeframe
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                  : 'bg-white/70 text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-white',
              )}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            title="Refresh insights"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      <main className="relative z-10 mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-5">
          <ScorePanel data={data} loading={loading} error={error} />
          <ThemesPanel themes={data?.themes} loading={loading} />
        </section>
        <aside className="flex flex-col gap-5">
          <HighlightPanel highlight={data?.highlights?.[0]} loading={loading} onViewFeedback={handleViewFeedback} />
          <AlertsPanel alerts={data?.alerts} loading={loading} />
          {data?.systemStatus && data.systemStatus.status !== 'operational' ? (
            <StatusInlineCallout systemStatus={data.systemStatus} />
          ) : null}
          <LastUpdated timestamp={data?.lastUpdated} loading={loading} />
        </aside>
      </main>

      {error ? (
        <div className="relative z-10 mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Unable to load feedback pulse right now. Please try again shortly.
        </div>
      ) : null}
    </div>
  );
}

FeedbackPulse.propTypes = {
  resource: PropTypes.string,
  timeframe: PropTypes.string,
  timeframes: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  autoRefreshInterval: PropTypes.number,
  data: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.any,
  onTimeframeChange: PropTypes.func,
  onViewFeedback: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
  analyticsContext: PropTypes.object,
};

FeedbackPulse.defaultProps = {
  resource: '/analytics/feedback/pulse',
  timeframe: '7d',
  timeframes: DEFAULT_TIMEFRAMES,
  autoRefreshInterval: 60000,
  data: undefined,
  loading: false,
  error: null,
  onTimeframeChange: undefined,
  onViewFeedback: undefined,
  className: undefined,
  style: undefined,
  analyticsContext: undefined,
};

function ScorePanel({ data, loading, error }) {
  const change = data?.scoreChange ?? 0;
  const responseDelta = data?.responseDelta ?? 0;
  const sampleSize = data?.sampleSize ?? null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/85 p-5 shadow-inner">
      <div className="flex items-center gap-3">
        <SparklesIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600">Signal summary</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          title="Experience score"
          value={loading ? '—' : `${Math.round(data?.overallScore ?? 0)} / 100`}
          change={loading || error ? null : change}
          description={sampleSize ? `${sampleSize} responses` : 'Live surveys & interviews'}
        />
        <MetricCard
          title="Response health"
          value={loading ? '—' : `${Math.round(data?.responseRate ?? 0)}%`}
          change={loading || error ? null : responseDelta}
          description="Participation across cohorts"
        />
      </div>
    </div>
  );
}

ScorePanel.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.any,
};

ScorePanel.defaultProps = {
  data: null,
  error: null,
};

function MetricCard({ title, value, change, description }) {
  const direction = typeof change === 'number' && change !== 0 ? (change > 0 ? 'up' : 'down') : null;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {direction ? (
        <p className={clsx('text-sm font-medium', direction === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
          {direction === 'up' ? '▲' : '▼'} {Math.abs(change).toFixed(1)} pts
        </p>
      ) : (
        <p className="text-sm font-medium text-slate-500">Stable</p>
      )}
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  change: PropTypes.number,
  description: PropTypes.string.isRequired,
};

MetricCard.defaultProps = {
  change: null,
};

function ThemesPanel({ themes, loading }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/85 p-5 shadow-inner">
      <p className="text-sm font-semibold text-slate-600">Trending themes</p>
      <div className="space-y-3">
        {(themes && themes.length ? themes : [null, null, null]).slice(0, 3).map((theme, index) => (
          <ThemeRow key={theme?.id ?? `theme-skeleton-${index}`} theme={theme} loading={loading} />
        ))}
      </div>
    </div>
  );
}

ThemesPanel.propTypes = {
  themes: PropTypes.array,
  loading: PropTypes.bool,
};

ThemesPanel.defaultProps = {
  themes: undefined,
  loading: false,
};

function ThemeRow({ theme, loading }) {
  if (loading && !theme) {
    return (
      <div className="animate-pulse">
        <div className="h-3 w-32 rounded-full bg-slate-200/60" />
        <div className="mt-2 h-2 rounded-full bg-slate-200/50" />
      </div>
    );
  }

  if (!theme) {
    return null;
  }

  const progress = typeof theme.score === 'number' ? clampNumber(theme.score, 0, 100, 0) : null;
  const change = typeof theme.change === 'number' ? theme.change : null;
  const direction = change ? (change > 0 ? 'up' : 'down') : null;

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>{theme.name}</span>
        {direction ? (
          <span className={clsx(direction === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
            {direction === 'up' ? '+' : '−'}{Math.abs(change).toFixed(1)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-200/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
          style={{ width: `${progress ?? 0}%` }}
        />
      </div>
    </div>
  );
}

ThemeRow.propTypes = {
  theme: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    score: PropTypes.number,
    change: PropTypes.number,
  }),
  loading: PropTypes.bool.isRequired,
};

ThemeRow.defaultProps = {
  theme: null,
};

function HighlightPanel({ highlight, loading, onViewFeedback }) {
  const sentimentClass = SENTIMENT_COLORS[highlight?.sentiment] ?? SENTIMENT_COLORS.neutral;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/90 p-5 shadow-inner">
      <div className="flex items-center gap-3">
        <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600">Highlight spotlight</p>
      </div>
      {loading ? (
        <div className="space-y-3">
          <div className="h-3 w-40 rounded-full bg-slate-200/60" />
          <div className="h-3 w-28 rounded-full bg-slate-200/60" />
          <div className="h-16 rounded-2xl bg-slate-200/50" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1', sentimentClass)}>
            {highlight?.sentiment ? highlight.sentiment.charAt(0).toUpperCase() + highlight.sentiment.slice(1) : 'Sentiment'}
          </div>
          <p className="text-base font-medium text-slate-900">“{highlight?.quote}”</p>
          <div className="text-xs text-slate-500">
            <p>{highlight?.persona}</p>
            <p className="mt-1">{highlight?.channel}</p>
            <p className="mt-1">{formatRelativeTime(highlight?.submittedAt)}</p>
          </div>
          <button
            type="button"
            onClick={onViewFeedback}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
          >
            View all feedback
            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

HighlightPanel.propTypes = {
  highlight: PropTypes.shape({
    quote: PropTypes.string,
    persona: PropTypes.string,
    channel: PropTypes.string,
    submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
    sentiment: PropTypes.string,
  }),
  loading: PropTypes.bool.isRequired,
  onViewFeedback: PropTypes.func,
};

HighlightPanel.defaultProps = {
  highlight: null,
  onViewFeedback: undefined,
};

function AlertsPanel({ alerts, loading }) {
  const unresolved = alerts?.unresolved ?? 0;
  const critical = alerts?.critical ?? 0;
  const acknowledged = alerts?.acknowledged ?? 0;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/90 p-5 shadow-inner">
      <p className="text-sm font-semibold text-slate-600">Follow-ups</p>
      {loading ? (
        <div className="flex gap-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-12 flex-1 rounded-xl bg-slate-200/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 text-center text-sm font-semibold text-slate-700">
          <div className="rounded-xl bg-rose-50 py-3 text-rose-600">{unresolved} open</div>
          <div className="rounded-xl bg-amber-50 py-3 text-amber-600">{critical} critical</div>
          <div className="rounded-xl bg-emerald-50 py-3 text-emerald-600">{acknowledged} moving</div>
        </div>
      )}
    </div>
  );
}

AlertsPanel.propTypes = {
  alerts: PropTypes.shape({
    unresolved: PropTypes.number,
    critical: PropTypes.number,
    acknowledged: PropTypes.number,
  }),
  loading: PropTypes.bool.isRequired,
};

AlertsPanel.defaultProps = {
  alerts: null,
};

function StatusInlineCallout({ systemStatus }) {
  if (!systemStatus) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 text-sm text-indigo-700 shadow-inner">
      <p className="font-semibold">{systemStatus.headline || 'Platform status'}</p>
      {systemStatus.description ? <p className="mt-1 text-indigo-600/90">{systemStatus.description}</p> : null}
      <p className="mt-2 text-xs text-indigo-500">Updated {formatRelativeTime(systemStatus.updatedAt)}</p>
    </div>
  );
}

StatusInlineCallout.propTypes = {
  systemStatus: PropTypes.shape({
    headline: PropTypes.string,
    description: PropTypes.string,
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
  }),
};

StatusInlineCallout.defaultProps = {
  systemStatus: null,
};

function LastUpdated({ timestamp, loading }) {
  return (
    <div className="text-xs text-slate-500">
      {loading ? 'Refreshing…' : timestamp ? `Updated ${formatRelativeTime(timestamp)}` : 'Awaiting feedback data'}
    </div>
  );
}

LastUpdated.propTypes = {
  timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
  loading: PropTypes.bool.isRequired,
};

LastUpdated.defaultProps = {
  timestamp: undefined,
};

function BackgroundGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <div className="absolute -top-32 right-[-20%] h-64 w-64 rounded-full bg-indigo-200/50 blur-3xl" />
      <div className="absolute bottom-[-40%] left-[-10%] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
    </div>
  );
}

export default FeedbackPulse;
