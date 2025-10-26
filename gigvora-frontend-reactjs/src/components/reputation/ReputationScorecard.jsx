import { useId, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import UserAvatar from '../UserAvatar.jsx';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function ScoreDial({ score, label, deltaLabel, deltaDirection, milestone, persona }) {
  const ratio = clamp(score / 100, 0, 1);
  const conic = `conic-gradient(var(--score-color) ${ratio * 360}deg, rgba(255,255,255,0.08) 0deg)`;
  const dialTone = score >= 85 ? 'var(--score-color)' : score >= 70 ? '#38bdf8' : score >= 55 ? '#fbbf24' : '#f87171';
  const directionIcon = deltaDirection === 'down' ? ArrowDownRightIcon : ArrowUpRightIcon;

  return (
    <div className="relative flex flex-col items-center justify-center rounded-4xl bg-white/6 px-6 pb-8 pt-10 text-center shadow-inner shadow-white/20">
      <div
        className="relative h-44 w-44 rounded-full p-1"
        style={{ '--score-color': dialTone, background: 'linear-gradient(135deg, rgba(59,130,246,0.65), rgba(14,165,233,0.55))' }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950/90 p-1 shadow-lg shadow-slate-950/40">
          <div
            className="flex h-full w-full items-center justify-center rounded-full"
            style={{ background: conic }}
            aria-hidden="true"
          >
            <div className="flex h-[85%] w-[85%] flex-col items-center justify-center rounded-full bg-slate-950">
              <span className="text-[3.5rem] font-black tracking-tight text-white">{Math.round(score)}</span>
              <span className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</span>
            </div>
          </div>
        </div>
        <span className="absolute inset-0 rounded-full border border-white/20" aria-hidden="true" />
      </div>
      <div className="mt-6 flex flex-col items-center gap-2">
        {deltaLabel ? (
          <span
            className={classNames(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
              deltaDirection === 'down' ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300',
            )}
          >
            <directionIcon className="h-4 w-4" aria-hidden="true" />
            {deltaLabel}
          </span>
        ) : null}
        {milestone ? (
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <TrophyIcon className="h-5 w-5 text-amber-300" aria-hidden="true" />
            <span>{milestone}</span>
          </div>
        ) : null}
        {persona ? (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
            <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
            {persona}
          </div>
        ) : null}
      </div>
    </div>
  );
}

ScoreDial.propTypes = {
  score: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  deltaLabel: PropTypes.string,
  deltaDirection: PropTypes.oneOf(['up', 'down']),
  milestone: PropTypes.string,
  persona: PropTypes.string,
};

ScoreDial.defaultProps = {
  deltaLabel: null,
  deltaDirection: 'up',
  milestone: null,
  persona: null,
};

function TrendSparkline({ points, label }) {
  const gradientId = useId();
  const { path, area, marker, minLabel, maxLabel } = useMemo(() => {
    if (!points?.length) {
      return { path: null, area: null, marker: null, minLabel: null, maxLabel: null };
    }
    const values = points.map((item) => item.value ?? 0);
    const max = Math.max(...values, 100);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const normalized = values.map((value, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 28 - ((value - min) / range) * 24;
      return [Number(x.toFixed(2)), Number(y.toFixed(2))];
    });
    const d = normalized
      .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
      .join(' ');
    const areaPath = `${['M 0 28', d, 'L 100 28 Z'].join(' ')}`;
    const [lastX, lastY] = normalized[normalized.length - 1];
    return {
      path: d,
      area: areaPath,
      marker: { x: lastX, y: lastY, value: values[values.length - 1] },
      minLabel: min,
      maxLabel: max,
    };
  }, [points]);

  if (!path) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">No trend data yet</div>
    );
  }

  return (
    <figure className="space-y-3">
      <figcaption className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
        <span>{label}</span>
        <span>
          Peak {maxLabel.toFixed(0)} · Floor {minLabel.toFixed(0)}
        </span>
      </figcaption>
      <svg viewBox="0 0 100 28" className="h-24 w-full" role="img" aria-label={label}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(59,130,246,0.45)" />
            <stop offset="100%" stopColor="rgba(14,165,233,0.05)" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} stroke="none" opacity={0.8} />
        <path d={path} fill="none" stroke="url(#gradientStroke)" strokeWidth={2} className="text-sky-300" />
        <defs>
          <linearGradient id="gradientStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx={marker.x} cy={marker.y} r={2.5} fill="#38bdf8" stroke="#0f172a" strokeWidth={1} />
      </svg>
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
      <p className="text-sm text-slate-200">
        Trust trajectory remains {marker.value >= (points[0]?.value ?? 0) ? 'on track' : 'under review'} with a current rating of
        <span className="pl-1 font-semibold text-white"> {marker.value.toFixed(1)}</span>.
      </p>
    </figure>
  );
}

TrendSparkline.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number,
      label: PropTypes.string,
    }),
  ),
  label: PropTypes.string,
};

TrendSparkline.defaultProps = {
  points: [],
  label: 'Reputation trajectory',
};

function SegmentCard({ segment }) {
  const directionIcon = segment.deltaDirection === 'down' ? ArrowDownRightIcon : ArrowUpRightIcon;
  const tone = segment.deltaDirection === 'down' ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-300 bg-emerald-500/10';
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-100 shadow-sm shadow-slate-950/20">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-white/60">{segment.label}</p>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold text-white">{segment.score}</span>
          <span className={classNames('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', tone)}>
            <directionIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {segment.deltaLabel}
          </span>
        </div>
      </header>
      {segment.description ? <p className="mt-4 text-sm text-slate-300">{segment.description}</p> : null}
      {segment.guardrail ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs text-white/70">
          <ShieldCheckIcon className="h-4 w-4 text-sky-300" aria-hidden="true" />
          {segment.guardrail}
        </div>
      ) : null}
    </article>
  );
}

SegmentCard.propTypes = {
  segment: PropTypes.shape({
    label: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    deltaLabel: PropTypes.string,
    deltaDirection: PropTypes.oneOf(['up', 'down']),
    description: PropTypes.string,
    guardrail: PropTypes.string,
  }).isRequired,
};

function AchievementBadge({ badge }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
      <CheckBadgeIcon className="mt-0.5 h-6 w-6 text-sky-300" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-semibold text-white">{badge.title}</p>
        {badge.description ? <p className="text-xs text-white/70">{badge.description}</p> : null}
        {badge.issuedAt ? (
          <p className="text-[0.7rem] uppercase tracking-wide text-white/40">Issued {formatRelativeTime(badge.issuedAt)}</p>
        ) : null}
      </div>
    </div>
  );
}

AchievementBadge.propTypes = {
  badge: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    issuedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }).isRequired,
};

function RecommendationCard({ recommendation }) {
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-white/6 via-white/4 to-white/10 p-5 text-sm text-slate-100 shadow-lg shadow-slate-950/30">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-200">
          <SparklesIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{recommendation.title}</p>
          <p className="mt-1 text-xs text-white/60">{recommendation.impact}</p>
        </div>
      </header>
      <ul className="mt-4 space-y-2 text-xs text-white/70">
        {recommendation.checklist?.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {recommendation.owner ? (
        <footer className="mt-4 flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-white/50">
          <span>Owner: {recommendation.owner}</span>
          <span>Due {recommendation.dueLabel}</span>
        </footer>
      ) : null}
    </article>
  );
}

RecommendationCard.propTypes = {
  recommendation: PropTypes.shape({
    title: PropTypes.string.isRequired,
    impact: PropTypes.string,
    checklist: PropTypes.arrayOf(PropTypes.string),
    owner: PropTypes.string,
    dueLabel: PropTypes.string,
  }).isRequired,
};

function BenchmarkList({ benchmarks }) {
  if (!benchmarks?.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-200">
        No benchmark data available yet.
      </div>
    );
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {benchmarks.map((benchmark) => (
        <div key={benchmark.label} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
          <dt className="uppercase tracking-wide text-white/40">{benchmark.label}</dt>
          <dd className="mt-2 flex items-center justify-between text-sm text-slate-100">
            <span className="font-semibold text-white">{benchmark.value}</span>
            {benchmark.delta ? (
              <span
                className={classNames(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide',
                  benchmark.deltaDirection === 'down' ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-200',
                )}
              >
                {(benchmark.deltaDirection === 'down' ? '▼' : '▲') + benchmark.delta}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

BenchmarkList.propTypes = {
  benchmarks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      delta: PropTypes.string,
      deltaDirection: PropTypes.oneOf(['up', 'down']),
    }),
  ),
};

BenchmarkList.defaultProps = {
  benchmarks: [],
};

function MilestoneTimeline({ milestones }) {
  if (!milestones?.length) {
    return null;
  }
  return (
    <ol className="space-y-3 text-sm text-slate-200">
      {milestones.map((milestone) => (
        <li key={milestone.id} className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white/70">
            <ClockIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-white">{milestone.title}</p>
            {milestone.summary ? <p className="text-xs text-white/70">{milestone.summary}</p> : null}
            <p className="text-[0.7rem] uppercase tracking-wide text-white/40">{formatAbsolute(milestone.date)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

MilestoneTimeline.propTypes = {
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    }),
  ),
};

MilestoneTimeline.defaultProps = {
  milestones: [],
};

function PersonaInsight({ insight }) {
  if (!insight) return null;
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/6 via-white/4 to-white/10 p-5 text-sm text-slate-200 shadow-lg shadow-slate-950/30">
      <header className="flex items-center gap-3 text-xs uppercase tracking-wide text-white/60">
        <ShieldCheckIcon className="h-5 w-5 text-sky-300" aria-hidden="true" />
        Persona guidance
      </header>
      <div className="mt-3 space-y-3">
        {insight.highlights?.map((item) => (
          <p key={item} className="flex items-start gap-2 text-sm text-slate-100">
            <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300" />
            <span>{item}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

PersonaInsight.propTypes = {
  insight: PropTypes.shape({
    highlights: PropTypes.arrayOf(PropTypes.string),
  }),
};

PersonaInsight.defaultProps = {
  insight: null,
};

export default function ReputationScorecard({
  profile,
  overallScore,
  scoreLabel,
  scoreDeltaLabel,
  scoreDeltaDirection,
  milestone,
  personaFocus,
  trend,
  segments,
  benchmarks,
  achievements,
  recommendations,
  milestones,
  personaInsight,
  highlight,
  loading,
  error,
  lastUpdated,
  fromCache,
  onRefresh,
  onShare,
  onExport,
}) {
  const orderedSegments = useMemo(
    () => (segments ? [...segments].sort((a, b) => b.score - a.score) : []),
    [segments],
  );
  const featuredSegment = orderedSegments[0];
  const remainingSegments = orderedSegments.slice(1, 3);
  const sparkline = trend?.history ?? [];

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,#1f2937,#020617)] p-8 text-white shadow-2xl shadow-slate-950/60">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <div className="absolute -left-32 top-10 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>
      <div className="relative space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Reputation intelligence</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">{profile?.headline ?? 'Executive trust pulse'}</h2>
            {profile?.summary ? (
              <p className="max-w-2xl text-sm text-white/70">{profile.summary}</p>
            ) : (
              <p className="max-w-2xl text-sm text-white/70">
                Monitor credibility, celebrate social proof, and unlock tailored coaching to stay ahead of enterprise expectations.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/20"
            >
              <ShareIcon className="h-5 w-5" aria-hidden="true" /> Share scorecard
            </button>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-full border border-sky-400/50 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300 hover:bg-sky-500/30"
            >
              <DocumentArrowDownIcon className="h-5 w-5" aria-hidden="true" /> Export insights
            </button>
          </div>
        </header>
        <DataStatus
          loading={loading}
          error={error}
          lastUpdated={lastUpdated}
          fromCache={fromCache}
          onRefresh={onRefresh}
          statusLabel="Live trust telemetry"
        >
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              <ScoreDial
                score={overallScore}
                label={scoreLabel}
                deltaLabel={scoreDeltaLabel}
                deltaDirection={scoreDeltaDirection}
                milestone={milestone}
                persona={personaFocus}
              />
              {highlight ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                  <p className="font-semibold text-white">Recent spotlight</p>
                  <p className="mt-2 text-sm text-white/70">“{highlight.quote}”</p>
                  <footer className="mt-3 flex items-center gap-2 text-xs uppercase tracking-wide text-white/40">
                    <UserAvatar size="sm" name={highlight.author} imageUrl={highlight.avatar} />
                    {highlight.author}
                    <span aria-hidden="true">•</span>
                    {highlight.role}
                    <span aria-hidden="true">•</span>
                    {formatRelativeTime(highlight.date)}
                  </footer>
                </div>
              ) : null}
              <TrendSparkline points={sparkline} label="Score trajectory" />
            </div>
            <div className="space-y-6 lg:col-span-7">
              {featuredSegment ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <SegmentCard segment={featuredSegment} />
                  <div className="space-y-4">
                    {remainingSegments.map((segment) => (
                      <SegmentCard key={segment.label} segment={segment} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-6 text-sm text-white/80">
                  Segment analytics will appear once data streams in from client engagements.
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">Benchmarks</h3>
                  <BenchmarkList benchmarks={benchmarks} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">Acceleration plan</h3>
                  <div className="grid gap-3">
                    {recommendations?.length ? (
                      recommendations.map((recommendation) => (
                        <RecommendationCard key={recommendation.title} recommendation={recommendation} />
                      ))
                    ) : (
                      <p className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/70">
                        Add coaching tasks to guide the next wave of endorsements and testimonials.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">Celebrated milestones</h3>
                  <MilestoneTimeline milestones={milestones} />
                  <div className="grid gap-3">
                    {achievements?.map((badge) => (
                      <AchievementBadge key={badge.title} badge={badge} />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">Persona guidance</h3>
                  <PersonaInsight insight={personaInsight} />
                </div>
              </div>
            </div>
          </div>
        </DataStatus>
      </div>
      <footer className="relative mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
        <div className="flex items-center gap-3">
          <ArrowTrendingUpIcon className="h-5 w-5 text-sky-300" aria-hidden="true" />
          <span>
            Confidence window refreshes automatically every six hours. Last audited {lastUpdated ? formatRelativeTime(lastUpdated) : 'moments ago'}.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
          <span>Governance synced with analytics &amp; compliance teams.</span>
        </div>
      </footer>
    </section>
  );
}

ReputationScorecard.propTypes = {
  profile: PropTypes.shape({
    headline: PropTypes.string,
    summary: PropTypes.string,
  }),
  overallScore: PropTypes.number,
  scoreLabel: PropTypes.string,
  scoreDeltaLabel: PropTypes.string,
  scoreDeltaDirection: PropTypes.oneOf(['up', 'down']),
  milestone: PropTypes.string,
  personaFocus: PropTypes.string,
  trend: PropTypes.shape({
    history: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.number,
        label: PropTypes.string,
      }),
    ),
  }),
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      score: PropTypes.number.isRequired,
      deltaLabel: PropTypes.string,
      deltaDirection: PropTypes.oneOf(['up', 'down']),
      description: PropTypes.string,
      guardrail: PropTypes.string,
    }),
  ),
  benchmarks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      delta: PropTypes.string,
      deltaDirection: PropTypes.oneOf(['up', 'down']),
    }),
  ),
  achievements: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      issuedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
  ),
  recommendations: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      impact: PropTypes.string,
      checklist: PropTypes.arrayOf(PropTypes.string),
      owner: PropTypes.string,
      dueLabel: PropTypes.string,
    }),
  ),
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    }),
  ),
  personaInsight: PropTypes.shape({
    highlights: PropTypes.arrayOf(PropTypes.string),
  }),
  highlight: PropTypes.shape({
    quote: PropTypes.string,
    author: PropTypes.string,
    role: PropTypes.string,
    avatar: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  loading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  fromCache: PropTypes.bool,
  onRefresh: PropTypes.func,
  onShare: PropTypes.func,
  onExport: PropTypes.func,
};

ReputationScorecard.defaultProps = {
  profile: null,
  overallScore: 72,
  scoreLabel: 'Trust index',
  scoreDeltaLabel: null,
  scoreDeltaDirection: 'up',
  milestone: null,
  personaFocus: null,
  trend: null,
  segments: null,
  benchmarks: null,
  achievements: null,
  recommendations: null,
  milestones: null,
  personaInsight: null,
  highlight: null,
  loading: false,
  error: null,
  lastUpdated: null,
  fromCache: false,
  onRefresh: null,
  onShare: null,
  onExport: null,
};
