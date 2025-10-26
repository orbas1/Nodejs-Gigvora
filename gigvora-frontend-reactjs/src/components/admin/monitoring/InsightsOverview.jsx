import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowUpRightIcon,
  BoltIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  PlayCircleIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

import analytics from '../../../services/analytics.js';
import { fetchInsightsOverview } from '../../../services/adminMonitoring.js';
import classNames from '../../../utils/classNames.js';

const TIMEFRAME_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Quarter to date' },
];

const SUMMARY_METRICS = [
  {
    key: 'totalReach',
    label: 'Total reach',
    deltaKey: 'totalReachDelta',
    icon: UserGroupIcon,
    accent: 'from-sky-500/10 via-sky-500/0 to-transparent border-sky-200 text-sky-900',
    formatter: (value) => new Intl.NumberFormat().format(value),
  },
  {
    key: 'engagementRate',
    label: 'Engagement rate',
    deltaKey: 'engagementRateDelta',
    icon: SparklesIcon,
    accent: 'from-violet-500/10 via-violet-500/0 to-transparent border-violet-200 text-violet-900',
    formatter: (value) => `${(value * 100).toFixed(1)}%`,
  },
  {
    key: 'conversionLift',
    label: 'Conversion lift',
    deltaKey: 'conversionLiftDelta',
    icon: ChartBarIcon,
    accent: 'from-emerald-500/10 via-emerald-500/0 to-transparent border-emerald-200 text-emerald-900',
    formatter: (value) => `${(value * 100).toFixed(1)}%`,
  },
  {
    key: 'anomalyCoverage',
    label: 'Anomaly coverage',
    deltaKey: 'anomalyCoverageDelta',
    icon: BoltIcon,
    accent: 'from-amber-500/10 via-amber-500/0 to-transparent border-amber-200 text-amber-900',
    formatter: (value) => `${(value * 100).toFixed(1)}%`,
  },
];

function formatTrend(delta) {
  if (delta == null || Number.isNaN(Number(delta))) {
    return { label: '—', tone: 'neutral' };
  }
  const numeric = Number(delta);
  if (numeric === 0) {
    return { label: '0%', tone: 'neutral' };
  }
  const sign = numeric > 0 ? '+' : '';
  return {
    label: `${sign}${(numeric * 100).toFixed(1)}%`,
    tone: numeric > 0 ? 'positive' : 'negative',
  };
}

function Sparkline({ points }) {
  if (!points?.length) {
    return <div className="h-16 rounded-2xl bg-slate-100" aria-hidden />;
  }
  const values = points.map((point) => Number(point.value ?? point.y ?? 0));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const normalized = values.map((value) => ((value - min) / range) * 40 + 2);
  const step = points.length > 1 ? 100 / (points.length - 1) : 100;
  const path = normalized
    .map((y, index) => `${index === 0 ? 'M' : 'L'} ${index * step} ${42 - y}`)
    .join(' ');

  return (
    <svg viewBox="0 0 100 44" className="h-16 w-full" role="presentation">
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

Sparkline.propTypes = {
  points: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) })).isRequired,
};

function SummaryCard({ metric, summary }) {
  const trend = formatTrend(summary?.[metric.deltaKey]);
  const Icon = metric.icon;
  return (
    <article className={classNames('relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-sm', metric.accent)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-inner">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{metric.formatter(summary?.[metric.key] ?? 0)}</p>
          </div>
        </div>
        <span
          className={classNames('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', {
            'bg-emerald-100 text-emerald-700': trend.tone === 'positive',
            'bg-rose-100 text-rose-700': trend.tone === 'negative',
            'bg-slate-100 text-slate-600': trend.tone === 'neutral',
          })}
        >
          <ArrowTrendingUpIcon className="mr-1 inline h-4 w-4" aria-hidden />
          {trend.label}
        </span>
      </div>
    </article>
  );
}

SummaryCard.propTypes = {
  metric: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    deltaKey: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    accent: PropTypes.string.isRequired,
    formatter: PropTypes.func.isRequired,
  }).isRequired,
  summary: PropTypes.object,
};

function PersonaList({ personas, activePersona, onSelect }) {
  if (!personas?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
        Persona spotlights will appear once cohorts generate enough signals.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {personas.map((persona) => {
        const isActive = activePersona?.key === persona.key;
        const delta = formatTrend(persona?.delta?.engagementRate ?? persona?.delta?.conversionRate);
        return (
          <li key={persona.key}>
            <button
              type="button"
              onClick={() => onSelect?.(persona)}
              className={classNames(
                'w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                {
                  'border-sky-300 bg-sky-50 shadow-lg shadow-sky-100': isActive,
                  'border-slate-200 bg-white hover:border-sky-200 hover:shadow-sm': !isActive,
                },
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{persona.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Engagement {Math.round((persona.engagementRate ?? 0) * 100)}%</p>
                </div>
                <span
                  className={classNames('rounded-full px-3 py-1 text-xs font-semibold', {
                    'bg-emerald-100 text-emerald-700': delta.tone === 'positive',
                    'bg-rose-100 text-rose-700': delta.tone === 'negative',
                    'bg-slate-100 text-slate-600': delta.tone === 'neutral',
                  })}
                >
                  {delta.label}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

PersonaList.propTypes = {
  personas: PropTypes.arrayOf(PropTypes.object),
  activePersona: PropTypes.object,
  onSelect: PropTypes.func,
};

function InsightNarratives({ narratives }) {
  if (!narratives?.length) {
    return null;
  }
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        <LightBulbIcon className="h-5 w-5" aria-hidden />
        Narrative highlights
      </header>
      <ul className="mt-4 space-y-4">
        {narratives.map((narrative) => (
          <li key={narrative.headline}>
            <h4 className="text-base font-semibold text-slate-900">{narrative.headline}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">{narrative.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

InsightNarratives.propTypes = {
  narratives: PropTypes.arrayOf(PropTypes.shape({ headline: PropTypes.string, body: PropTypes.string })),
};

function RoadmapList({ roadmap }) {
  if (!roadmap?.length) {
    return null;
  }
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        <PlayCircleIcon className="h-5 w-5" aria-hidden />
        Roadmap and commitments
      </header>
      <ul className="mt-4 space-y-4">
        {roadmap.map((item) => (
          <li key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Impact score {item.impactScore ?? '—'}</p>
                {item.targetDate ? <p>Target {new Date(item.targetDate).toLocaleDateString()}</p> : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

RoadmapList.propTypes = {
  roadmap: PropTypes.arrayOf(PropTypes.object),
};

function AnomalyPanel({ anomalies }) {
  if (!anomalies?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-rose-200 bg-white/70 p-6 text-sm text-slate-500">
        No anomalies detected this timeframe. Monitoring continues across mentorship, conversion, and engagement funnels.
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {anomalies.map((anomaly) => (
        <li key={anomaly.id} className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">{anomaly.severity ?? 'monitor'}</p>
              <h4 className="mt-1 text-base font-semibold text-rose-900">{anomaly.title}</h4>
            </div>
            <time className="text-xs text-rose-600" dateTime={anomaly.timestamp}>
              {anomaly.timestamp ? new Date(anomaly.timestamp).toLocaleString() : '—'}
            </time>
          </div>
          <p className="mt-2 text-sm leading-6 text-rose-800">{anomaly.description}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-rose-700 sm:grid-cols-4">
            <div>
              <dt className="font-semibold">Metric</dt>
              <dd>{anomaly.metric ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Impact</dt>
              <dd>{anomaly.impact != null ? `${(anomaly.impact * 100).toFixed(1)}%` : '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Population</dt>
              <dd>{anomaly.population ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Owner</dt>
              <dd>{anomaly.owner ?? 'Operations'}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

AnomalyPanel.propTypes = {
  anomalies: PropTypes.arrayOf(PropTypes.object),
};

function JourneysTable({ journeys }) {
  if (!journeys?.length) {
    return null;
  }
  return (
    <table className="min-w-full divide-y divide-slate-200">
      <thead>
        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <th scope="col" className="pb-3">Stage</th>
          <th scope="col" className="pb-3">Conversion</th>
          <th scope="col" className="pb-3">Median duration</th>
          <th scope="col" className="pb-3">Narrative</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {journeys.map((journey) => (
          <tr key={journey.stage} className="text-sm text-slate-700">
            <td className="py-3 font-semibold text-slate-900">{journey.stage}</td>
            <td className="py-3">{journey.conversionRate != null ? `${(journey.conversionRate * 100).toFixed(1)}%` : '—'}</td>
            <td className="py-3">{journey.medianDuration ?? '—'}</td>
            <td className="py-3 text-slate-600">{journey.narrative}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

JourneysTable.propTypes = {
  journeys: PropTypes.arrayOf(PropTypes.object),
};

function QaPanel({ qa }) {
  if (!qa) {
    return null;
  }
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        <ArrowPathIcon className="h-5 w-5" aria-hidden />
        Data quality checks
      </header>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600 sm:grid-cols-4">
        <div>
          <dt className="font-semibold text-slate-900">Trusted sources</dt>
          <dd>{qa.sourceCount ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Trust score</dt>
          <dd>{qa.trustScore != null ? `${(qa.trustScore * 100).toFixed(1)}%` : '—'}</dd>
        </div>
        {qa.notes ? (
          <div className="col-span-2 text-sm leading-6 text-slate-600">
            <dt className="font-semibold text-slate-900">Notes</dt>
            <dd className="mt-1 text-slate-600">{qa.notes}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

QaPanel.propTypes = {
  qa: PropTypes.object,
};

const initialState = { status: 'idle', data: null, error: null };

export default function InsightsOverview() {
  const [timeframe, setTimeframe] = useState('14d');
  const [state, setState] = useState(initialState);
  const [activePersona, setActivePersona] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setState((prev) => ({ ...prev, status: 'loading', error: null }));
      try {
        const payload = await fetchInsightsOverview({ timeframe });
        if (!isMounted) {
          return;
        }
        setState({ status: 'success', data: payload, error: null });
        setActivePersona(payload.personas?.[0] ?? null);
        analytics.track('admin.monitoring.insights.loaded', { timeframe, persona: payload.personas?.[0]?.key ?? null });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load insights overview', error);
        setState({ status: 'error', data: null, error });
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  const personas = state.data?.personas ?? [];
  const selectedPersona = useMemo(() => {
    if (!activePersona) {
      return null;
    }
    return personas.find((persona) => persona.key === activePersona.key) ?? null;
  }, [activePersona, personas]);

  function handlePersonaSelect(persona) {
    setActivePersona(persona);
    analytics.track('admin.monitoring.insights.persona.selected', { timeframe, persona: persona?.key ?? null });
  }

  function handleRetry() {
    setState(initialState);
    setActivePersona(null);
    setTimeframe((previous) => previous);
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Insights overview</h2>
          <p className="mt-1 text-sm text-slate-600">
            Executive-ready telemetry for operations, compliance, and growth leaders. Premium cards, anomaly narratives, and
            roadmap context anchor every decision.
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          Timeframe
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none"
            value={timeframe}
            onChange={(event) => {
              const next = event.target.value;
              setTimeframe(next);
              analytics.track('admin.monitoring.insights.timeframe.changed', { timeframe: next });
            }}
          >
            {TIMEFRAME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {state.status === 'loading' ? (
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-inner">
          <div className="h-6 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SUMMARY_METRICS.map((metric) => (
              <div key={metric.key} className="h-28 animate-pulse rounded-3xl bg-slate-100" aria-hidden />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-3xl bg-slate-100" aria-hidden />
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-center gap-3 text-rose-700">
            <ExclamationTriangleIcon className="h-6 w-6" aria-hidden />
            <div>
              <p className="text-sm font-semibold">We couldn’t load the monitoring insights right now.</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {state.status === 'success' ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SUMMARY_METRICS.map((metric) => (
              <SummaryCard key={metric.key} metric={metric} summary={state.data.summary} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm lg:col-span-2">
              <header className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-slate-500">
                <span>Performance timeline</span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <ArrowUpRightIcon className="h-4 w-4" aria-hidden />
                  {state.data.summary?.totalReach ? `${new Intl.NumberFormat().format(state.data.summary.totalReach)} total reach` : ''}
                </span>
              </header>
              <div className="mt-4">
                <Sparkline points={state.data.timeline ?? []} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <header className="text-sm font-semibold uppercase tracking-wide text-slate-500">Persona performance</header>
              <PersonaList personas={personas} activePersona={selectedPersona} onSelect={handlePersonaSelect} />
              {selectedPersona ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{selectedPersona.headline}</p>
                  <p className="mt-1 leading-6">{selectedPersona.story}</p>
                </div>
              ) : null}
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <AnomalyPanel anomalies={state.data.anomalies} />
            </section>
            <QaPanel qa={state.data.qa} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <RoadmapList roadmap={state.data.roadmap} />
            </section>
            <InsightNarratives narratives={state.data.narratives} />
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <header className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <ChartBarIcon className="h-5 w-5" aria-hidden />
              Journey analytics
            </header>
            <div className="mt-4 overflow-x-auto">
              <JourneysTable journeys={state.data.journeys} />
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
