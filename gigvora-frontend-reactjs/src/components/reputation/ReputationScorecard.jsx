import { useMemo } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  SparklesIcon,
  ShieldCheckIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import DataStatus from '../DataStatus.jsx';
import classNames from '../../utils/classNames.js';

const SCORE_RING_GRADIENT = {
  elite: 'from-emerald-400 via-blue-500 to-purple-500',
  strong: 'from-blue-400 via-sky-500 to-indigo-500',
  developing: 'from-amber-400 via-orange-400 to-rose-500',
};

function deriveTier(score, maxScore) {
  if (score === null || score === undefined) return 'developing';
  const ratio = maxScore ? score / maxScore : score / 100;
  if (ratio >= 0.85) return 'elite';
  if (ratio >= 0.6) return 'strong';
  return 'developing';
}

function formatDelta(delta) {
  if (!delta) return { label: 'Stable', tone: 'text-slate-500', icon: null };
  const trendPositive = delta > 0;
  const tone = trendPositive ? 'text-emerald-600' : 'text-rose-600';
  const Icon = trendPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  return {
    label: `${trendPositive ? '+' : ''}${delta.toFixed(1)} pts vs last period`,
    tone,
    icon: Icon,
  };
}

function Sparkline({ points, tone }) {
  const { path, area } = useMemo(() => {
    if (!points?.length) {
      return { path: null, area: null };
    }
    const height = 50;
    const width = 160;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const step = width / (points.length - 1 || 1);
    const coords = points.map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return [x, y];
    });
    const d = coords
      .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ');
    const areaPath = `${d} L${width},${height} L0,${height} Z`;
    return { path: d, area: areaPath };
  }, [points]);

  if (!path) {
    return (
      <div className="flex h-12 items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-500">
        Awaiting trend data
      </div>
    );
  }

  return (
    <svg viewBox="0 0 160 50" role="img" aria-label="Reputation trend" className="h-12 w-full">
      <defs>
        <linearGradient id="trend-gradient" x1="0%" x2="100%">
          <stop offset="0%" stopColor={tone === 'positive' ? '#10b981' : '#f97316'} stopOpacity="0.1" />
          <stop offset="100%" stopColor={tone === 'positive' ? '#2563eb' : '#ef4444'} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trend-gradient)" />
      <path
        d={path}
        fill="none"
        stroke={tone === 'positive' ? '#2563eb' : '#ef4444'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

Sparkline.propTypes = {
  points: PropTypes.arrayOf(PropTypes.number),
  tone: PropTypes.oneOf(['positive', 'negative']),
};

Sparkline.defaultProps = {
  points: [],
  tone: 'positive',
};

function BadgeList({ milestones }) {
  if (!milestones?.length) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {milestones.map((milestone) => (
        <li
          key={milestone.id}
          className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur"
        >
          <ShieldCheckIcon className="mt-1 h-5 w-5 text-blue-500" aria-hidden="true" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-slate-900">{milestone.label}</p>
            {milestone.achievedAt ? (
              <p className="text-xs uppercase tracking-wide text-slate-400">{milestone.achievedAt}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

BadgeList.propTypes = {
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      achievedAt: PropTypes.string,
    }),
  ),
};

BadgeList.defaultProps = {
  milestones: [],
};

function RecommendationList({ recommendations }) {
  if (!recommendations?.length) return null;
  return (
    <ul className="space-y-3">
      {recommendations.map((item) => (
        <li key={item.id} className="flex items-start gap-3 rounded-2xl bg-white/60 p-4 shadow-sm ring-1 ring-slate-100">
          <BoltIcon className="mt-1 h-5 w-5 text-amber-500" aria-hidden="true" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-slate-900">{item.title}</p>
            {item.description ? <p className="text-slate-600">{item.description}</p> : null}
            {item.actionLabel && item.actionUrl ? (
              <a
                href={item.actionUrl}
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                {item.actionLabel}
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

RecommendationList.propTypes = {
  recommendations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      actionLabel: PropTypes.string,
      actionUrl: PropTypes.string,
    }),
  ),
};

RecommendationList.defaultProps = {
  recommendations: [],
};

function BenchmarkTable({ benchmarks }) {
  if (!benchmarks?.length) return null;
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80">
      <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th scope="col" className="px-4 py-3">Industry benchmark</th>
            <th scope="col" className="px-4 py-3">You</th>
            <th scope="col" className="px-4 py-3">Top quartile</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-600">
          {benchmarks.map((benchmark) => (
            <tr key={benchmark.metric} className="transition hover:bg-blue-50/40">
              <th scope="row" className="px-4 py-3 text-sm font-semibold text-slate-900">
                {benchmark.metric}
              </th>
              <td className="px-4 py-3 font-medium text-slate-700">{benchmark.current}</td>
              <td className="px-4 py-3 text-slate-500">{benchmark.topQuartile}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

BenchmarkTable.propTypes = {
  benchmarks: PropTypes.arrayOf(
    PropTypes.shape({
      metric: PropTypes.string.isRequired,
      current: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      topQuartile: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  ),
};

BenchmarkTable.defaultProps = {
  benchmarks: [],
};

export default function ReputationScorecard({ summary, status, onShare, onExport }) {
  const tier = useMemo(() => deriveTier(summary.score, summary.maxScore), [summary.maxScore, summary.score]);
  const tierGradient = SCORE_RING_GRADIENT[tier];
  const delta = useMemo(() => formatDelta(summary.delta), [summary.delta]);
  const trendTone = summary.trend?.direction === 'down' ? 'negative' : 'positive';

  if (status?.state && status.state !== 'ready') {
    return <DataStatus status={status.state} title={status.title} description={status.description} />;
  }

  return (
    <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-slate-50 shadow-xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_55%)]" />
      <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-6 rounded-[32px] bg-white/10 p-6 backdrop-blur">
          <div className="relative flex h-64 w-full items-center justify-center">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-slate-900/70 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <div className={classNames('absolute inset-2 rounded-full bg-gradient-to-tr p-[2px]', tierGradient)}>
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-slate-950/80 p-8 text-center">
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Reputation</span>
                  <span className="mt-2 text-5xl font-semibold text-white">{summary.score}</span>
                  <span className="mt-1 text-sm text-slate-300">of {summary.maxScore}</span>
                </div>
              </div>
              <TrophyIcon className="absolute -bottom-4 right-8 h-9 w-9 text-amber-300" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-200">
            <p className="text-base font-semibold text-white">{summary.scoreLabel}</p>
            {summary.scoreNarrative ? <p className="text-slate-300">{summary.scoreNarrative}</p> : null}
            {delta.icon ? (
              <p className={classNames('flex items-center gap-2 text-sm font-semibold', delta.tone)}>
                <delta.icon className="h-4 w-4" aria-hidden="true" />
                {delta.label}
              </p>
            ) : (
              <p className="text-sm text-slate-400">{delta.label}</p>
            )}
          </div>
          {summary.lastUpdated ? (
            <p className="text-xs uppercase tracking-widest text-slate-500">Updated {summary.lastUpdated}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20"
            >
              <ShareIcon className="h-4 w-4" /> Share snapshot
            </button>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
            >
              <DocumentArrowDownIcon className="h-4 w-4" /> Export insights
            </button>
          </div>
        </div>
        <div className="space-y-8">
          <div className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Momentum</p>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <SparklesIcon className="h-4 w-4" /> {summary.trend?.label ?? 'Consistent growth'}
                  </span>
                </div>
                <Sparkline points={summary.trend?.points} tone={trendTone} />
                {summary.trend?.period ? (
                  <p className="mt-2 text-xs text-slate-400">Tracking {summary.trend.period}</p>
                ) : null}
              </div>
              <div className="space-y-3 rounded-3xl bg-slate-900/50 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-400">Focus areas</p>
                <ul className="space-y-2 text-sm text-slate-200">
                  {(summary.focusAreas ?? []).map((focus) => (
                    <li key={focus} className="flex items-start gap-2">
                      <SparklesIcon className="mt-0.5 h-4 w-4 text-amber-300" aria-hidden="true" />
                      <span>{focus}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <BenchmarkTable benchmarks={summary.benchmarks} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-slate-400">Milestones earned</p>
              <BadgeList milestones={summary.milestones} />
            </div>
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-slate-400">Next best actions</p>
              <RecommendationList recommendations={summary.recommendations} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

ReputationScorecard.propTypes = {
  summary: PropTypes.shape({
    score: PropTypes.number,
    maxScore: PropTypes.number,
    scoreLabel: PropTypes.string,
    scoreNarrative: PropTypes.string,
    delta: PropTypes.number,
    lastUpdated: PropTypes.string,
    trend: PropTypes.shape({
      direction: PropTypes.oneOf(['up', 'down']),
      label: PropTypes.string,
      period: PropTypes.string,
      points: PropTypes.arrayOf(PropTypes.number),
    }),
    focusAreas: PropTypes.arrayOf(PropTypes.string),
    benchmarks: PropTypes.arrayOf(
      PropTypes.shape({
        metric: PropTypes.string.isRequired,
        current: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        topQuartile: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      }),
    ),
    milestones: PropTypes.array,
    recommendations: PropTypes.array,
  }),
  status: PropTypes.shape({
    state: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
  }),
  onShare: PropTypes.func,
  onExport: PropTypes.func,
};

ReputationScorecard.defaultProps = {
  summary: {
    score: 82,
    maxScore: 100,
    scoreLabel: 'Trusted trailblazer',
    scoreNarrative: 'Your reputation is resonating with founders and design leads across 12 markets.',
    delta: 4.8,
    lastUpdated: '3 hours ago',
    trend: {
      direction: 'up',
      label: 'Momentum building',
      period: 'Last 30 days',
      points: [62, 64, 66, 68, 71, 74, 77, 79, 82],
    },
    focusAreas: ['Expand community endorsements', 'Publish behind-the-scenes project breakdowns'],
    benchmarks: [
      { metric: 'Average response to briefs', current: '2h 15m', topQuartile: '1h 40m' },
      { metric: 'Project recommendation rate', current: '92%', topQuartile: '94%' },
      { metric: 'Verified deliveries', current: '36', topQuartile: '41' },
    ],
    milestones: [
      { id: 'global-top-10', label: 'Global top 10% designer', achievedAt: 'Awarded May 2024' },
      { id: 'mentor-champion', label: 'Mentor champion', achievedAt: 'Awarded Feb 2024' },
    ],
    recommendations: [
      {
        id: 'share-ai',
        title: 'Share a behind-the-scenes clip featuring your AI workflow',
        description: 'Followers responding to case studies are 2.3× more likely to endorse your expertise.',
        actionLabel: 'Plan content drop',
        actionUrl: '#plan-content',
      },
      {
        id: 'request-reviews',
        title: 'Invite your last 5 clients to leave a voice testimonial',
        description: 'Voice stories boost conversions by 18% compared with text-only reviews.',
        actionLabel: 'Launch request flow',
        actionUrl: '#launch-request',
      },
    ],
  },
  status: null,
  onShare: () => {},
  onExport: () => {},
};
