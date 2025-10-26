import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ArrowTrendingUpIcon,
  BoltIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import { useTheme } from '../../context/ThemeProvider.tsx';
import analytics from '../../services/analytics.js';

const FALLBACK_SUMMARY = {
  trustScore: 92,
  trustScoreChange: 4.2,
  reviewAverage: 4.9,
  totalReviews: 128,
  responseTime: 'Median 2h 12m',
  commitmentsMet: '98% on-time commitments',
  nextReviewAt: 'Executive review due in 6 days',
  reliabilityWindow: 'Rolling 90 days',
  insights: [
    'High-trust engagements in climate and fintech pods delivered 12% faster than cohort median.',
    'Stakeholder satisfaction climbed for consecutive quarters after integrating journey retros.',
    'Referrals converted at 38% when case studies accompanied invites—keep the automation live.',
  ],
};

const FALLBACK_METRICS = [
  {
    id: 'projects_delivered',
    label: 'Projects delivered',
    value: 38,
    change: 6,
    timeframe: '90d',
    trendDirection: 'up',
    trendLabel: '+6 vs previous 90d',
    goal: 'Target 30',
    description: 'Transformation, GTM enablement, and regulatory programmes.',
  },
  {
    id: 'nps',
    label: 'Relationship NPS',
    value: 78,
    change: 8,
    timeframe: '90d',
    trendDirection: 'up',
    trendLabel: '+8 uplift',
    goal: 'Target 70',
    description: 'Mentor & executive sponsors across enterprise pods.',
  },
  {
    id: 'referrals',
    label: 'Referral velocity',
    value: 14,
    change: 4,
    timeframe: '90d',
    trendDirection: 'up',
    trendLabel: '+4 net new advocates',
    goal: 'Target 10',
    description: 'Warm intros from C-suite networks and venture partners.',
  },
  {
    id: 'support',
    label: 'Issue resolution',
    value: 96,
    change: 3,
    timeframe: '90d',
    trendDirection: 'up',
    trendLabel: '↓8h response window',
    goal: 'Target < 12h',
    description: 'Critical tickets closed with automation and playbooks.',
  },
  {
    id: 'projects_delivered_365',
    label: 'Projects delivered',
    value: 112,
    change: 18,
    timeframe: '365d',
    trendDirection: 'up',
    trendLabel: '+18 YoY',
    goal: 'Target 100',
    description: 'Long-form signal for enterprise account reviews.',
  },
  {
    id: 'referrals_30',
    label: 'Referral velocity',
    value: 5,
    change: 1,
    timeframe: '30d',
    trendDirection: 'up',
    trendLabel: '+25% vs prior month',
    goal: 'Target 4',
    description: 'Signals from latest launchpad cohorts.',
  },
];

const FALLBACK_BREAKDOWN = [
  { id: 'delivery', label: 'Delivery reliability', score: 96, change: 3.4, weight: '40%' },
  { id: 'relationships', label: 'Stakeholder delight', score: 94, change: 2.1, weight: '35%' },
  { id: 'operations', label: 'Operational trust', score: 89, change: 1.1, weight: '25%' },
];

const FALLBACK_BENCHMARKS = [
  { id: 'industry', label: 'Industry cohort', score: 82, delta: 10 },
  { id: 'network_top', label: 'Network top 10%', score: 95, delta: -3 },
  { id: 'portfolio', label: 'Portfolio average', score: 88, delta: 4 },
];

const FALLBACK_ACHIEVEMENTS = [
  'Earned “Transformation Vanguard” badge for cross-market launches.',
  'Delivery excellence maintained 6 consecutive quarters without escalation.',
  'Referred mentors generated £1.2m in pipeline within 90 days.',
];

function clamp(value, min = 0, max = 100) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }
  return Math.min(Math.max(numeric, min), max);
}

function resolveTrend(change) {
  if (change == null) {
    return null;
  }
  const numeric = Number.parseFloat(change);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return null;
  }
  return numeric > 0 ? 'up' : 'down';
}

function formatChange(change) {
  if (change == null) {
    return null;
  }
  const numeric = Number.parseFloat(change);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return 'No change';
  }
  const sign = numeric > 0 ? '+' : '';
  return `${sign}${numeric.toFixed(Math.abs(numeric) >= 1 ? 1 : 2)}`;
}

function normaliseSummary(summary) {
  if (!summary || typeof summary !== 'object') {
    return {
      ...FALLBACK_SUMMARY,
      breakdown: FALLBACK_BREAKDOWN,
      benchmarks: FALLBACK_BENCHMARKS,
      achievements: FALLBACK_ACHIEVEMENTS,
    };
  }

  const trustScore = clamp(summary.trustScore ?? summary.score ?? summary.trust?.score ?? FALLBACK_SUMMARY.trustScore);
  const trustScoreChange = Number.parseFloat(
    summary.trustScoreChange ?? summary.delta ?? summary.trust?.change ?? FALLBACK_SUMMARY.trustScoreChange,
  );
  const reviewAverage = Number.parseFloat(summary.reviewAverage ?? summary.rating ?? FALLBACK_SUMMARY.reviewAverage);
  const totalReviews = summary.totalReviews ?? summary.reviewCount ?? summary.totalTestimonials ?? FALLBACK_SUMMARY.totalReviews;
  const responseTime = summary.responseTime ?? summary.avgResponseTime ?? FALLBACK_SUMMARY.responseTime;
  const commitmentsMet = summary.commitmentsMet ?? summary.onTimeDelivery ?? FALLBACK_SUMMARY.commitmentsMet;
  const nextReviewAt = summary.nextReviewAt ?? summary.nextReviewDue ?? summary.trustScoreRecommendedReviewAt ?? FALLBACK_SUMMARY.nextReviewAt;
  const reliabilityWindow = summary.reliabilityWindow ?? summary.timeframe ?? FALLBACK_SUMMARY.reliabilityWindow;
  const insights = Array.isArray(summary.insights ?? summary.recommendations)
    ? (summary.insights ?? summary.recommendations)
    : FALLBACK_SUMMARY.insights;

  const breakdown = Array.isArray(summary.breakdown ?? summary.trustBreakdown)
    ? (summary.breakdown ?? summary.trustBreakdown)
    : FALLBACK_BREAKDOWN;
  const benchmarks = Array.isArray(summary.benchmarks ?? summary.trustBenchmarks)
    ? (summary.benchmarks ?? summary.trustBenchmarks)
    : FALLBACK_BENCHMARKS;
  const achievements = Array.isArray(summary.achievements ?? summary.highlightedMilestones)
    ? (summary.achievements ?? summary.highlightedMilestones)
    : FALLBACK_ACHIEVEMENTS;

  return {
    trustScore,
    trustScoreChange,
    reviewAverage,
    totalReviews,
    responseTime,
    commitmentsMet,
    nextReviewAt,
    reliabilityWindow,
    insights,
    breakdown,
    benchmarks,
    achievements,
  };
}

function normaliseMetric(metric, index) {
  if (!metric || typeof metric !== 'object') {
    return null;
  }
  const value = Number.parseFloat(metric.value ?? metric.score ?? metric.amount ?? 0);
  const change = metric.change ?? metric.delta ?? metric.trend ?? null;
  const timeframe = metric.timeframe ?? metric.period ?? metric.window ?? '90d';
  return {
    id: metric.id ?? metric.metricType ?? metric.key ?? `metric-${index}`,
    label: metric.label ?? metric.name ?? 'Metric',
    value: Number.isFinite(value) ? value : 0,
    change: Number.isFinite(Number.parseFloat(change)) ? Number.parseFloat(change) : null,
    goal: metric.goal ?? metric.target ?? null,
    description: metric.description ?? metric.context ?? metric.summary ?? '',
    timeframe,
    trendDirection: metric.trendDirection ?? resolveTrend(change) ?? 'up',
    trendLabel: metric.trendLabel ?? metric.trendSummary ?? null,
  };
}

function normaliseMetrics(metrics) {
  if (Array.isArray(metrics) && metrics.length) {
    const parsed = metrics
      .map((metric, index) => normaliseMetric(metric, index))
      .filter(Boolean);
    if (parsed.length) {
      return parsed;
    }
  }
  return FALLBACK_METRICS;
}

function normaliseBreakdown(breakdown) {
  if (Array.isArray(breakdown) && breakdown.length) {
    return breakdown
      .map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const score = clamp(item.score ?? item.value ?? 0);
        const change = Number.parseFloat(item.change ?? item.delta ?? 0);
        return {
          id: item.id ?? item.label ?? `breakdown-${index}`,
          label: item.label ?? item.name ?? 'Segment',
          score,
          change,
          weight: item.weight ?? item.importance ?? null,
        };
      })
      .filter(Boolean);
  }
  return FALLBACK_BREAKDOWN;
}

function normaliseBenchmarks(benchmarks) {
  if (Array.isArray(benchmarks) && benchmarks.length) {
    return benchmarks
      .map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const score = clamp(item.score ?? item.value ?? 0);
        const delta = Number.parseFloat(item.delta ?? item.change ?? 0);
        return {
          id: item.id ?? item.label ?? `benchmark-${index}`,
          label: item.label ?? item.name ?? 'Benchmark',
          score,
          delta,
        };
      })
      .filter(Boolean);
  }
  return FALLBACK_BENCHMARKS;
}

function normaliseAchievements(achievements) {
  if (Array.isArray(achievements) && achievements.length) {
    return achievements.filter((item) => typeof item === 'string' && item.trim().length);
  }
  return FALLBACK_ACHIEVEMENTS;
}

function ScoreGauge({ value, change, accentColor }) {
  const safeValue = clamp(value);
  const arcDegrees = (safeValue / 100) * 360;
  const resolvedAccent = accentColor ?? '#2563eb';
  const backgroundStyle = {
    background: `conic-gradient(${resolvedAccent} ${arcDegrees}deg, rgba(226,232,240,0.6) ${arcDegrees}deg 360deg)` ,
  };
  return (
    <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-slate-100/60">
      <div className="absolute inset-3 rounded-full bg-white shadow-inner" />
      <div
        className="absolute inset-1 rounded-full"
        style={backgroundStyle}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center justify-center rounded-full bg-white/80 px-6 py-8 text-center shadow-soft">
        <ShieldCheckIcon className="h-6 w-6 text-slate-500" aria-hidden="true" />
        <p className="mt-2 text-4xl font-bold text-slate-900">{Math.round(safeValue)}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Trust score</p>
        {change != null ? (
          <p
            className={clsx('mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', {
              'bg-emerald-50 text-emerald-600': change >= 0,
              'bg-rose-50 text-rose-600': change < 0,
            })}
          >
            <ArrowTrendingUpIcon
              className={clsx('mr-1 h-3.5 w-3.5', change < 0 && 'rotate-180')}
              aria-hidden="true"
            />
            {formatChange(change)} vs last period
          </p>
        ) : null}
      </div>
    </div>
  );
}

ScoreGauge.propTypes = {
  value: PropTypes.number,
  change: PropTypes.number,
  accentColor: PropTypes.string,
};

function MetricCard({ metric }) {
  if (!metric) {
    return null;
  }
  const trendTone = metric.trendDirection === 'down' ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50';
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{metric.label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold text-slate-900">
            {Number.isFinite(metric.value) ? metric.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : metric.value}
          </p>
          {metric.goal ? <span className="text-xs text-slate-500">{metric.goal}</span> : null}
        </div>
        {metric.trendLabel ? (
          <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', trendTone)}>
            <ArrowTrendingUpIcon
              className={clsx('mr-1 h-3.5 w-3.5', metric.trendDirection === 'down' && 'rotate-180 text-rose-500')}
              aria-hidden="true"
            />
            {metric.trendLabel}
          </span>
        ) : null}
        {metric.description ? <p className="text-xs text-slate-500">{metric.description}</p> : null}
      </div>
    </article>
  );
}

MetricCard.propTypes = {
  metric: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    change: PropTypes.number,
    goal: PropTypes.string,
    description: PropTypes.string,
    trendDirection: PropTypes.oneOf(['up', 'down']),
    trendLabel: PropTypes.string,
    timeframe: PropTypes.string,
  }),
};

function BreakdownBar({ item, accentColor }) {
  if (!item) {
    return null;
  }
  const safeScore = clamp(item.score);
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
        <span>{item.label}</span>
        {item.weight ? <span className="text-xs font-medium text-slate-400">Weight {item.weight}</span> : null}
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${safeScore}%`, backgroundColor: accentColor ?? '#2563eb' }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{safeScore}%</span>
        <span className={clsx(item.change >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
          {formatChange(item.change)} vs previous
        </span>
      </div>
    </div>
  );
}

BreakdownBar.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    score: PropTypes.number,
    change: PropTypes.number,
    weight: PropTypes.string,
  }),
  accentColor: PropTypes.string,
};

function BenchmarkCard({ benchmark }) {
  if (!benchmark) {
    return null;
  }
  const tone = benchmark.delta >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <ChartBarIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{benchmark.label}</p>
          <p className="text-xs text-slate-500">Score {benchmark.score}</p>
        </div>
      </div>
      <span className={clsx('mt-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', tone)}>
        {benchmark.delta >= 0 ? 'Ahead' : 'Below'} by {Math.abs(benchmark.delta).toFixed(1)} pts
      </span>
    </article>
  );
}

BenchmarkCard.propTypes = {
  benchmark: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    score: PropTypes.number,
    delta: PropTypes.number,
  }),
};

export default function ReputationScorecard({
  summary,
  metrics,
  breakdown,
  benchmarks,
  achievements,
  loading,
  error,
  fromCache,
  lastUpdated,
  onRefresh,
}) {
  const normalisedSummary = useMemo(() => normaliseSummary(summary), [summary]);
  const normalisedMetrics = useMemo(() => normaliseMetrics(metrics), [metrics]);
  const normalisedBreakdown = useMemo(
    () => normaliseBreakdown(breakdown ?? normalisedSummary.breakdown),
    [breakdown, normalisedSummary.breakdown],
  );
  const normalisedBenchmarks = useMemo(
    () => normaliseBenchmarks(benchmarks ?? normalisedSummary.benchmarks),
    [benchmarks, normalisedSummary.benchmarks],
  );
  const normalisedAchievements = useMemo(
    () => normaliseAchievements(achievements ?? normalisedSummary.achievements),
    [achievements, normalisedSummary.achievements],
  );

  const { tokens, registerComponentTokens, removeComponentTokens, resolveComponentTokens } = useTheme();
  const componentTokens = useMemo(
    () => resolveComponentTokens?.('ReputationScorecard') ?? {},
    [resolveComponentTokens, tokens?.colors?.accent],
  );
  const accentColor = componentTokens.colors?.accent ?? tokens?.colors?.accent ?? '#2563eb';

  useEffect(() => {
    registerComponentTokens?.('ReputationScorecard', {
      colors: {
        accent: tokens?.colors?.accent ?? '#2563eb',
      },
    });
    return () => removeComponentTokens?.('ReputationScorecard');
  }, [registerComponentTokens, removeComponentTokens, tokens?.colors?.accent]);

  const timeframeOptions = useMemo(() => {
    const options = new Set();
    normalisedMetrics.forEach((metric) => {
      if (metric?.timeframe) {
        options.add(metric.timeframe);
      }
    });
    if (!options.size) {
      options.add('90d');
    }
    return Array.from(options);
  }, [normalisedMetrics]);

  const [activeRange, setActiveRange] = useState(() => timeframeOptions[0] ?? '90d');

  useEffect(() => {
    if (!timeframeOptions.includes(activeRange)) {
      setActiveRange(timeframeOptions[0] ?? '90d');
    }
  }, [timeframeOptions, activeRange]);

  const rangeMetrics = useMemo(
    () =>
      normalisedMetrics.filter((metric) => {
        if (!metric?.timeframe) {
          return activeRange === timeframeOptions[0];
        }
        return metric.timeframe === activeRange;
      }),
    [normalisedMetrics, activeRange, timeframeOptions],
  );

  const handleRangeChange = (range) => {
    setActiveRange(range);
    analytics.track('reputation_scorecard_range_selected', { range });
  };

  return (
    <section className="rounded-4xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-8 shadow-soft">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent/80">Reputation scorecard</p>
          <h3 className="text-2xl font-semibold text-slate-900">Executive trust telemetry</h3>
          <p className="max-w-xl text-sm text-slate-600">
            Benchmark trust health, delivery reliability, and advocacy momentum in a single glance. Tuned for leadership reviews
            and board updates where credibility must be immediate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          {timeframeOptions.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => handleRangeChange(range)}
              className={clsx(
                'rounded-full border px-3 py-1 transition',
                range === activeRange
                  ? 'border-accent bg-accent text-white shadow-sm'
                  : 'border-slate-200 bg-white hover:border-accent/60 hover:text-accent',
              )}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-6">
        <DataStatus
          loading={loading}
          error={error}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          statusLabel="Live trust telemetry"
        >
          <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
            <div className="flex flex-col items-center gap-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <ScoreGauge
                value={normalisedSummary.trustScore}
                change={normalisedSummary.trustScoreChange}
                accentColor={accentColor}
              />
              <div className="space-y-2 text-center">
                <p className="text-sm font-semibold text-slate-900">{normalisedSummary.commitmentsMet}</p>
                <p className="text-xs text-slate-500">{normalisedSummary.reliabilityWindow}</p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <SparklesIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
                    {normalisedSummary.reviewAverage.toFixed(1)} / 5.0 rating
                  </span>
                  <span>{normalisedSummary.totalReviews} verified reviews</span>
                  <span>
                    <BoltIcon className="mr-1 inline h-4 w-4 text-accent" aria-hidden="true" />
                    {normalisedSummary.responseTime}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{normalisedSummary.nextReviewAt}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {rangeMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr,0.9fr]">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Trust composition</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {normalisedBreakdown.map((item) => (
                  <BreakdownBar key={item.id} item={item} accentColor={accentColor} />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Benchmarks</h4>
              <div className="grid gap-3">
                {normalisedBenchmarks.map((benchmark) => (
                  <BenchmarkCard key={benchmark.id} benchmark={benchmark} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Strategic insights</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                {normalisedSummary.insights.map((insight) => (
                  <li key={insight} className="flex gap-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                    <SparklesIcon className="mt-0.5 h-5 w-5 text-amber-500" aria-hidden="true" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Badges & milestones</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                {normalisedAchievements.map((achievement) => (
                  <li
                    key={achievement}
                    className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                  >
                    <TrophyIcon className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DataStatus>
      </div>
    </section>
  );
}

ReputationScorecard.propTypes = {
  summary: PropTypes.object,
  metrics: PropTypes.arrayOf(PropTypes.object),
  breakdown: PropTypes.arrayOf(PropTypes.object),
  benchmarks: PropTypes.arrayOf(PropTypes.object),
  achievements: PropTypes.arrayOf(PropTypes.string),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.shape({ message: PropTypes.string }), PropTypes.string]),
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
  onRefresh: PropTypes.func,
};

ReputationScorecard.defaultProps = {
  summary: undefined,
  metrics: undefined,
  breakdown: undefined,
  benchmarks: undefined,
  achievements: undefined,
  loading: false,
  error: null,
  fromCache: false,
  lastUpdated: undefined,
  onRefresh: undefined,
};
