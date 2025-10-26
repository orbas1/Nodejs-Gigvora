import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowUpRightIcon,
  BookmarkIcon,
  ChartBarIcon,
  ClockIcon,
  CursorArrowRaysIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LightBulbIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import analytics from '../../../services/analytics.js';
import {
  fetchInsightsOverview,
} from '../../../services/adminMonitoring.js';
import classNames from '../../../utils/classNames.js';

const TIMEFRAME_PRESETS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Quarter to date' },
];

function formatNumber(value, fractionDigits = 0) {
  if (value == null) {
    return '0';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: fractionDigits }).format(numeric);
}

function formatPercent(value, fractionDigits = 1) {
  if (value == null) {
    return '0%';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${(numeric * 100).toFixed(fractionDigits)}%`;
}

function formatTrend(delta) {
  if (delta == null) {
    return { label: '—', tone: 'neutral' };
  }
  const numeric = Number(delta);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return { label: '0%', tone: 'neutral' };
  }
  const sign = numeric > 0 ? '+' : '';
  return {
    label: `${sign}${(numeric * 100).toFixed(1)}%`,
    tone: numeric > 0 ? 'positive' : 'negative',
  };
}

function Sparkline({ id, points, accent = '#2563eb', height = 52 }) {
  if (!points?.length) {
    return (
      <svg
        aria-hidden
        className="h-16 w-full"
        viewBox="0 0 120 40"
      >
        <line x1="0" y1="38" x2="120" y2="38" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    );
  }

  const values = points.map((point) => Number(point.value) || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const normalised = values.map((value) => ((value - min) / range) * (height - 4) + 2);
  const step = 100 / Math.max(points.length - 1, 1);
  const path = normalised
    .map((y, index) => `${index === 0 ? 'M' : 'L'} ${index * step} ${height - y}`)
    .join(' ');

  return (
    <svg
      aria-labelledby={id}
      className="h-16 w-full"
      viewBox={`0 0 100 ${height}`}
    >
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="90%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path}`} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={`${path} L 100 ${height} L 0 ${height} Z`}
        fill={`url(#${id}-gradient)`}
        opacity="0.5"
      />
    </svg>
  );
}

Sparkline.propTypes = {
  id: PropTypes.string.isRequired,
  points: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    }),
  ),
  accent: PropTypes.string,
  height: PropTypes.number,
};

function SummaryCard({ icon: Icon, title, value, delta, caption, accent = 'sky' }) {
  const trend = formatTrend(delta);
  const accentTone = {
    sky: 'from-sky-500/10 via-sky-500/0 to-transparent text-sky-900 border-sky-200',
    violet: 'from-violet-500/10 via-violet-500/0 to-transparent text-violet-900 border-violet-200',
    emerald: 'from-emerald-500/10 via-emerald-500/0 to-transparent text-emerald-900 border-emerald-200',
    rose: 'from-rose-500/10 via-rose-500/0 to-transparent text-rose-900 border-rose-200',
  }[accent];

  return (
    <article className={classNames('relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-md', accentTone)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-inner">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-600">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
          </div>
        </div>
        <p
          className={classNames('flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', {
            'bg-emerald-100 text-emerald-700': trend.tone === 'positive',
            'bg-rose-100 text-rose-700': trend.tone === 'negative',
            'bg-slate-100 text-slate-600': trend.tone === 'neutral',
          })}
        >
          <ArrowTrendingUpIcon className="h-4 w-4" aria-hidden />
          {trend.label}
        </p>
      </div>
      {caption ? <p className="mt-4 text-sm leading-6 text-slate-700">{caption}</p> : null}
    </article>
  );
}

SummaryCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  delta: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  caption: PropTypes.string,
  accent: PropTypes.oneOf(['sky', 'violet', 'emerald', 'rose']),
};

function PersonaComparison({ personas, metric, onSelect }) {
  const maxValue = personas.reduce((acc, persona) => Math.max(acc, Number(persona[metric] ?? 0)), 0) || 1;

  return (
    <section aria-labelledby="persona-comparison" className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="persona-comparison" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Persona performance
          </h3>
          <p className="mt-1 text-sm text-slate-600">Contrast how priority cohorts are engaging with the current program.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ArrowUpRightIcon className="h-4 w-4" aria-hidden />
          {metric.replace(/([A-Z])/g, ' $1').trim()}
        </div>
      </div>
      <ul className="mt-4 space-y-4">
        {personas.map((persona) => {
          const score = Number(persona[metric] ?? 0);
          const delta = formatTrend(persona.delta?.[metric]);
          return (
            <li key={persona.key}>
              <button
                type="button"
                onClick={() => onSelect?.(persona)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{persona.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{persona.headline ?? 'Segment insight unavailable'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatPercent(score, 1)}</p>
                    <p
                      className={classNames('text-xs font-semibold', {
                        'text-emerald-600': delta.tone === 'positive',
                        'text-rose-600': delta.tone === 'negative',
                        'text-slate-500': delta.tone === 'neutral',
                      })}
                    >
                      {delta.label}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-600"
                    style={{ width: `${Math.min(100, (score / maxValue) * 100)}%` }}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

PersonaComparison.propTypes = {
  personas: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      headline: PropTypes.string,
      engagementRate: PropTypes.number,
      conversionRate: PropTypes.number,
      adoptionRate: PropTypes.number,
      delta: PropTypes.object,
    }),
  ).isRequired,
  metric: PropTypes.string.isRequired,
  onSelect: PropTypes.func,
};

function AnomalyList({ anomalies, onInspect }) {
  if (!anomalies?.length) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">No anomalies detected</h3>
        <p className="mt-2 text-sm text-emerald-700">
          Real-time monitors confirm everything is operating within healthy thresholds. Continue to monitor telemetry and
          scenario plans for proactive confidence.
        </p>
      </section>
    );
  }

  const severityTone = {
    critical: 'border-rose-200 bg-rose-50 text-rose-700',
    high: 'border-amber-200 bg-amber-50 text-amber-700',
    medium: 'border-sky-200 bg-sky-50 text-sky-700',
    low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };

  return (
    <section className="space-y-3">
      {anomalies.map((anomaly) => (
        <article
          key={anomaly.id}
          className={classNames(
            'rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg',
            severityTone[anomaly.severity ?? 'medium'] ?? severityTone.medium,
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-inner">
                <ExclamationTriangleIcon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{anomaly.title}</h4>
                <p className="mt-1 text-xs text-slate-600">{anomaly.description}</p>
              </div>
            </div>
            <div className="text-right text-xs uppercase tracking-wide text-slate-600">
              <p>{new Date(anomaly.timestamp).toLocaleString()}</p>
              <p className="mt-1 font-semibold">{anomaly.metric}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <p className="font-semibold">
              Impact: {formatPercent(anomaly.impact, 1)} drop · {anomaly.population ?? 'cohort unknown'}
            </p>
            <button
              type="button"
              onClick={() => onInspect?.(anomaly)}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Inspect playbook
              <ArrowUpRightIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

AnomalyList.propTypes = {
  anomalies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      severity: PropTypes.oneOf(['critical', 'high', 'medium', 'low']),
      timestamp: PropTypes.string,
      metric: PropTypes.string,
      impact: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      population: PropTypes.string,
    }),
  ),
  onInspect: PropTypes.func,
};

function RoadmapList({ items }) {
  if (!items?.length) {
    return (
      <p className="text-sm text-slate-500">
        All core actions are complete. Continue to use insights-led nudges to reinforce habit formation across leadership cohorts.
      </p>
    );
  }
  return (
    <ol className="space-y-4 text-sm">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-slate-600">{item.description}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Impact score · {formatNumber(item.impactScore, 1)}</p>
              {item.dueAt ? <p className="mt-1">Due {new Date(item.dueAt).toLocaleDateString()}</p> : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

RoadmapList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      impactScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      dueAt: PropTypes.string,
    }),
  ),
};

function JourneyMap({ stages }) {
  if (!stages?.length) {
    return null;
  }
  const maxConversion = stages.reduce((acc, stage) => Math.max(acc, Number(stage.conversionRate ?? 0)), 0) || 1;
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {stages.map((stage) => (
        <li key={stage.stage} className="rounded-3xl border border-slate-200 bg-slate-900/90 p-5 text-slate-100 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">{stage.stage}</p>
            <span className="text-xs font-semibold text-slate-300">Median {stage.medianDuration}</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{formatPercent(stage.conversionRate)}</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400"
              style={{ width: `${Math.min(100, (Number(stage.conversionRate ?? 0) / maxConversion) * 100)}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-300">{stage.narrative ?? 'No commentary provided yet.'}</p>
        </li>
      ))}
    </ol>
  );
}

JourneyMap.propTypes = {
  stages: PropTypes.arrayOf(
    PropTypes.shape({
      stage: PropTypes.string.isRequired,
      conversionRate: PropTypes.number,
      medianDuration: PropTypes.string,
      narrative: PropTypes.string,
    }),
  ),
};

const DEFAULT_DATA = {
  summary: {},
  timeline: [],
  personas: [],
  anomalies: [],
  roadmap: [],
  narratives: [],
  journeys: [],
  qa: {},
};

export default function InsightsOverview({ defaultFilters = {}, onSelectPersona, onInspectAnomaly }) {
  const [filters, setFilters] = useState(() => ({ timeframe: '14d', persona: 'all', focusMetric: 'engagementRate', ...defaultFilters }));
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const loadData = useCallback(async (activeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchInsightsOverview(activeFilters);
      setData({
        summary: response.summary ?? {},
        timeline: response.timeline ?? [],
        personas: response.personas ?? [],
        anomalies: response.anomalies ?? [],
        roadmap: response.roadmap ?? [],
        narratives: response.narratives ?? [],
        journeys: response.journeys ?? [],
        qa: response.qa ?? {},
      });
      setLastRefreshedAt(new Date().toISOString());
      analytics.track('admin.monitoring.insights.loaded', {
        timeframe: activeFilters.timeframe,
        persona: activeFilters.persona,
        focusMetric: activeFilters.focusMetric,
        dataPoints: (response.timeline ?? []).length,
      }).catch(() => {});
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  useEffect(() => {
    analytics.track('admin.monitoring.insights.viewed', {
      timeframe: filters.timeframe,
    }).catch(() => {});
  }, []);

  const timelinePoints = useMemo(() => data.timeline ?? [], [data.timeline]);
  const topNarrative = useMemo(() => data.narratives?.[0] ?? null, [data.narratives]);
  const personaOptions = useMemo(
    () => [{ value: 'all', label: 'All personas' }, ...(data.personas ?? []).map((persona) => ({ value: persona.key, label: persona.label }))],
    [data.personas],
  );

  const selectedPersona = useMemo(() => {
    if (!data.personas?.length || filters.persona === 'all') {
      return null;
    }
    return data.personas.find((persona) => persona.key === filters.persona) ?? null;
  }, [data.personas, filters.persona]);

  const summaryCards = useMemo(() => {
    const summary = data.summary ?? {};
    return [
      {
        icon: UsersIcon,
        title: 'Total reach',
        value: formatNumber(summary.totalReach ?? 0),
        delta: summary.totalReachDelta,
        caption: 'Signals how many professionals experienced our activations during the selected window.',
        accent: 'sky',
      },
      {
        icon: CursorArrowRaysIcon,
        title: 'Engagement rate',
        value: formatPercent(summary.engagementRate ?? 0),
        delta: summary.engagementRateDelta,
        caption: 'Measures clickthrough, dwell time, and responses blended into an insight-friendly score.',
        accent: 'violet',
      },
      {
        icon: TrophyIcon,
        title: 'Conversion lift',
        value: formatPercent(summary.conversionLift ?? 0),
        delta: summary.conversionLiftDelta,
        caption: 'Quantifies how campaigns outperform baseline cohorts to justify investment.',
        accent: 'emerald',
      },
      {
        icon: SparklesIcon,
        title: 'Anomaly coverage',
        value: formatPercent(summary.anomalyCoverage ?? 0),
        delta: summary.anomalyCoverageDelta,
        caption: 'Shows how many anomalies were triaged within SLA to maintain trust with leadership.',
        accent: 'rose',
      },
    ];
  }, [data.summary]);

  const emptyState = !loading && !error && timelinePoints.length === 0 && !(data.personas?.length);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monitoring &amp; analytics</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Insights overview</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Give executives a premium command centre for growth signals. Blend hero metrics, anomaly intelligence, and narrative
              coaching so decisions feel inspired and data-backed.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <ClockIcon className="h-4 w-4" aria-hidden />
              <span className="sr-only">Select timeframe</span>
              <select
                value={filters.timeframe}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, timeframe: event.target.value }))
                }
                className="rounded-full border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
              >
                {TIMEFRAME_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <UsersIcon className="h-4 w-4" aria-hidden />
              <span className="sr-only">Select persona</span>
              <select
                value={filters.persona}
                onChange={(event) => {
                  const persona = event.target.value;
                  setFilters((current) => ({ ...current, persona }));
                  const meta = data.personas?.find((item) => item.key === persona);
                  if (persona !== 'all') {
                    analytics.track('admin.monitoring.insights.persona-selected', {
                      persona,
                      timeframe: filters.timeframe,
                    }).catch(() => {});
                  }
                  if (meta && onSelectPersona) {
                    onSelectPersona(meta);
                  }
                }}
                className="rounded-full border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
              >
                {personaOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <ChartBarIcon className="h-4 w-4" aria-hidden />
              <span className="sr-only">Select focus metric</span>
              <select
                value={filters.focusMetric}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, focusMetric: event.target.value }))
                }
                className="rounded-full border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
              >
                <option value="engagementRate">Engagement rate</option>
                <option value="conversionRate">Conversion rate</option>
                <option value="adoptionRate">Adoption rate</option>
              </select>
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold">
            <ArrowPathIcon className={classNames('h-4 w-4', { 'animate-spin': loading })} aria-hidden />
            {loading ? 'Refreshing live data…' : 'Live telemetry synced'}
          </span>
          {lastRefreshedAt ? <span>Last refreshed {new Date(lastRefreshedAt).toLocaleTimeString()}</span> : null}
          {data.qa?.sourceCount ? <span>{data.qa.sourceCount} sources unified</span> : null}
          {data.qa?.trustScore ? <span>Data trust score {formatPercent(data.qa.trustScore, 0)}</span> : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-rose-700">We were unable to load insights right now.</p>
          <p className="mt-1 text-sm text-rose-600">{error.message ?? 'Unknown error encountered.'}</p>
          <button
            type="button"
            onClick={() => loadData(filters)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden />
            Retry load
          </button>
        </div>
      ) : null}

      {emptyState ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 text-center shadow-sm">
          <Squares2X2Icon className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
          <h3 className="mt-3 text-lg font-semibold text-slate-900">Start connecting telemetry sources</h3>
          <p className="mt-2 text-sm text-slate-600">
            Plug campaign platforms, CRM journeys, and experience analytics into Gigvora to unlock premium intelligence overlays.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-5">
        <article className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Momentum curve</h3>
              <p className="mt-1 text-sm text-slate-600">
                Trace weekly energy across pipeline, engagement, and conversion signals. Use anomalies and hotspots to brief leadership.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {timelinePoints.length} observations
            </span>
          </div>
          <Sparkline id="insights-momentum" points={timelinePoints} accent="#6366f1" />
          {topNarrative ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{topNarrative.headline}</p>
              <p className="mt-1 leading-relaxed">{topNarrative.body}</p>
            </div>
          ) : null}
        </article>
        <PersonaComparison
          personas={data.personas ?? []}
          metric={filters.focusMetric}
          onSelect={(persona) => {
            if (onSelectPersona) {
              onSelectPersona(persona);
            }
          }}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Operational roadmap</h3>
          <p className="mt-1 text-sm text-slate-600">
            Prioritise bold moves with impact scores, due dates, and storytelling prompts so partners feel guided and accountable.
          </p>
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <RoadmapList items={data.roadmap} />
          </div>
        </div>
        <aside className="space-y-4 lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Anomaly intelligence</h3>
            <AnomalyList anomalies={data.anomalies} onInspect={onInspectAnomaly} />
          </div>
          {selectedPersona ? (
            <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-700">Persona spotlight</h3>
              <p className="mt-2 text-sm text-violet-700">
                {selectedPersona.story ?? 'No personalised insight available yet. Sync narrative coaching to unlock premium guidance.'}
              </p>
            </div>
          ) : null}
        </aside>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 text-slate-100 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Journey intelligence</h3>
            <p className="mt-1 text-sm text-slate-200/80">Reveal the premium experience by stage with median durations and conversion lift.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <GlobeAltIcon className="h-4 w-4" aria-hidden />
            Global parity ensured
          </div>
        </div>
        <div className="mt-5">
          <JourneyMap stages={data.journeys} />
        </div>
      </section>

      <footer className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <LightBulbIcon className="h-5 w-5 text-amber-500" aria-hidden />
            <p>
              Continue feeding qualitative wins into this dashboard. Stories paired with analytics make the network feel vibrant and
              human, just like the world-class platforms we benchmark.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                analytics.track('admin.monitoring.insights.exported', filters).catch(() => {})
              }
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              <ArrowUpRightIcon className="h-4 w-4" aria-hidden />
              Export executive brief
            </button>
            <button
              type="button"
              onClick={() =>
                analytics.track('admin.monitoring.insights.bookmarked', filters).catch(() => {})
              }
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400"
            >
              <BookmarkIcon className="h-4 w-4" aria-hidden />
              Bookmark view
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}

InsightsOverview.propTypes = {
  defaultFilters: PropTypes.shape({
    timeframe: PropTypes.string,
    persona: PropTypes.string,
    focusMetric: PropTypes.string,
  }),
  onSelectPersona: PropTypes.func,
  onInspectAnomaly: PropTypes.func,
};
