import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  BoltIcon,
  FaceFrownIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';
import { useTheme } from '../../context/ThemeProvider.tsx';
import { formatRelativeTime } from '../../utils/date.js';

const SCORE_OPTIONS = [
  {
    value: 1,
    label: 'Blocked',
    description: 'Critical issues preventing progress',
    Icon: BoltIcon,
    gradient: 'from-rose-500/80 via-rose-500/40 to-rose-500/20',
    ring: 'ring-rose-400/60',
  },
  {
    value: 2,
    label: 'Strained',
    description: 'Workflow slowed or uncomfortable',
    Icon: HandThumbDownIcon,
    gradient: 'from-amber-500/80 via-amber-500/40 to-amber-500/20',
    ring: 'ring-amber-400/60',
  },
  {
    value: 3,
    label: 'Steady',
    description: 'Meeting expectations overall',
    Icon: FaceFrownIcon,
    gradient: 'from-slate-500/60 via-slate-500/30 to-slate-500/10',
    ring: 'ring-slate-400/60',
  },
  {
    value: 4,
    label: 'Thriving',
    description: 'Delivers noticeable wins',
    Icon: HandThumbUpIcon,
    gradient: 'from-emerald-500/80 via-emerald-500/40 to-emerald-500/20',
    ring: 'ring-emerald-400/60',
  },
  {
    value: 5,
    label: 'Delighted',
    description: 'Sets a new benchmark experience',
    Icon: TrophyIcon,
    gradient: 'from-violet-500/80 via-violet-500/40 to-violet-500/20',
    ring: 'ring-violet-400/60',
  },
];

function normaliseTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.filter((tag) => typeof tag === 'string' && tag.trim().length > 0);
}

function normaliseSegments(segments) {
  if (!Array.isArray(segments)) {
    return [];
  }
  return segments
    .filter((segment) => segment && typeof segment.label === 'string' && typeof segment.value === 'number')
    .map((segment, index) => ({
      id: segment.id ?? `${segment.label}-${index}`,
      delta: segment.delta ?? null,
      ...segment,
    }));
}

function normaliseInsights(insights) {
  if (!Array.isArray(insights)) {
    return [];
  }
  return insights
    .filter((insight) => insight && typeof insight.title === 'string')
    .map((insight, index) => ({
      id: insight.id ?? `${insight.title}-${index}`,
      ...insight,
    }));
}

function formatPercentage(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return `${Math.round(value)}%`;
}

export default function FeedbackPulse({
  question,
  description,
  tags,
  segments,
  insights,
  trend,
  lastResponseAt,
  onSubmit,
  analyticsContext,
  className,
  allowComment = true,
  commentLabel = 'Share more context',
  commentPlaceholder = 'What helped or what should we improve next?',
  submitLabel = 'Send feedback',
  defaultScore,
  defaultTags,
  defaultComment,
  disabled,
  referenceTime,
}) {
  const { tokens } = useTheme();
  const accentColor = tokens.colors?.accent ?? '#6366f1';

  const availableTags = useMemo(() => normaliseTags(tags), [tags]);
  const availableSegments = useMemo(() => normaliseSegments(segments), [segments]);
  const availableInsights = useMemo(() => normaliseInsights(insights), [insights]);
  const initialTags = useMemo(() => new Set(normaliseTags(defaultTags)), [defaultTags]);

  const [selectedScore, setSelectedScore] = useState(defaultScore ?? null);
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [comment, setComment] = useState(defaultComment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [error, setError] = useState(null);

  const relativeLastResponse = useMemo(() => {
    if (!lastResponseAt) {
      return '';
    }
    return formatRelativeTime(lastResponseAt, referenceTime ? { now: referenceTime } : undefined);
  }, [lastResponseAt, referenceTime]);

  useEffect(() => {
    analytics?.track?.('feedback_pulse_viewed', {
      question,
      tags: availableTags.length,
      hasSegments: availableSegments.length > 0,
      ...analyticsContext,
    });
  }, [analyticsContext, availableSegments.length, availableTags.length, question]);

  const handleSelectScore = (value) => {
    setSelectedScore(value);
    analytics?.track?.('feedback_pulse_score_selected', {
      question,
      value,
      ...analyticsContext,
    });
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((previous) => {
      const next = new Set(previous);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      analytics?.track?.('feedback_pulse_tag_toggled', {
        question,
        tag,
        active: next.has(tag),
        ...analyticsContext,
      });
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedScore || submitting || disabled) {
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      score: selectedScore,
      tags: Array.from(selectedTags),
      comment: comment.trim(),
    };

    try {
      await onSubmit?.(payload);
      setSubmittedAt(new Date());
      analytics?.track?.('feedback_pulse_submitted', {
        question,
        ...payload,
        commentLength: payload.comment.length,
        ...analyticsContext,
      });
    } catch (submissionError) {
      setError(submissionError?.message ?? 'We could not save your feedback. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={clsx(
        'relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950/95 to-slate-900/90 p-6 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur',
        className,
      )}
      style={{ '--pulse-accent': accentColor }}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(148,163,255,0.22),transparent_55%)]" aria-hidden="true" />
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Feedback pulse</p>
          <h2 className="max-w-2xl text-2xl font-semibold leading-tight text-white sm:text-3xl">{question}</h2>
          {description ? <p className="max-w-2xl text-sm text-white/75">{description}</p> : null}
        </div>
        {trend ? (
          <div className="min-w-[14rem] rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-right text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{trend.label ?? 'Satisfaction score'}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatPercentage(trend.value)}</p>
            {typeof trend.delta === 'number' ? (
              <p
                className={clsx(
                  'mt-1 text-xs font-semibold',
                  trend.delta >= 0 ? 'text-emerald-200' : 'text-rose-200',
                )}
              >
                {trend.delta >= 0 ? '+' : ''}
                {trend.delta.toFixed(1)} pts vs {trend.comparison ?? 'previous pulse'}
              </p>
            ) : null}
            {trend.sampleSize ? (
              <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/60">{trend.sampleSize} responses</p>
            ) : null}
          </div>
        ) : null}
      </header>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-6">
          <fieldset disabled={disabled}>
            <legend className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              How is the experience feeling right now?
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {SCORE_OPTIONS.map((option) => {
                const isActive = option.value === selectedScore;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectScore(option.value)}
                    className={clsx(
                      'group relative flex h-full flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      `bg-gradient-to-br ${option.gradient}`,
                      isActive ? `ring-2 ${option.ring}` : 'hover:border-white/30 hover:bg-white/10',
                      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    )}
                    aria-pressed={isActive}
                    disabled={disabled}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/20 text-white shadow-inner">
                      <option.Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="text-base font-semibold text-white">{option.label}</span>
                    <span className="text-xs text-white/80">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {availableTags.length ? (
            <fieldset disabled={disabled}>
              <legend className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                What best describes this feeling?
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isActive = selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={clsx(
                        'rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                        isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10',
                        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                      )}
                      aria-pressed={isActive}
                      disabled={disabled}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {allowComment ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60" htmlFor="feedback-pulse-comment">
                {commentLabel}
              </label>
              <textarea
                id="feedback-pulse-comment"
                className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={commentPlaceholder}
                disabled={disabled}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!selectedScore || submitting || disabled}
            >
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Sending…' : submitLabel}</span>
            </button>
            {error ? (
              <p className="text-sm text-rose-200" role="alert">
                {error}
              </p>
            ) : null}
            {submittedAt ? (
              <p className="text-sm text-emerald-200" role="status">
                Thank you—your insights are shaping the roadmap.
              </p>
            ) : null}
          </div>
          {relativeLastResponse ? (
            <p className="text-xs text-white/60">Last response {relativeLastResponse}</p>
          ) : null}
        </div>

        <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Highlights</p>
            {availableSegments.length ? (
              <dl className="mt-3 space-y-3">
                {availableSegments.map((segment) => (
                  <div key={segment.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm text-white/80">
                      <dt className="font-semibold text-white">{segment.label}</dt>
                      <dd className="text-xs font-semibold text-white/70">{formatPercentage(segment.value)}</dd>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white/80"
                        style={{ width: `${Math.max(0, Math.min(100, segment.value))}%` }}
                      />
                    </div>
                    {typeof segment.delta === 'number' ? (
                      <p
                        className={clsx(
                          'mt-2 text-xs font-semibold',
                          segment.delta >= 0 ? 'text-emerald-200' : 'text-rose-200',
                        )}
                      >
                        {segment.delta >= 0 ? '+' : ''}
                        {segment.delta.toFixed(1)} pts vs last period
                      </p>
                    ) : null}
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-white/70">
                We are collecting a statistically significant sample before exposing trend breakdowns.
              </p>
            )}
          </div>

          {availableInsights.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">What we are hearing</p>
              <ul className="mt-3 space-y-3">
                {availableInsights.map((insight) => (
                  <li key={insight.id} className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/80">
                    <p className="font-semibold text-white">{insight.title}</p>
                    {insight.description ? <p className="mt-2 text-xs text-white/70">{insight.description}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </form>
    </section>
  );
}

FeedbackPulse.propTypes = {
  question: PropTypes.string.isRequired,
  description: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      delta: PropTypes.number,
    }),
  ),
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  trend: PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.number,
    delta: PropTypes.number,
    comparison: PropTypes.string,
    sampleSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  lastResponseAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  onSubmit: PropTypes.func,
  analyticsContext: PropTypes.object,
  className: PropTypes.string,
  allowComment: PropTypes.bool,
  commentLabel: PropTypes.string,
  commentPlaceholder: PropTypes.string,
  submitLabel: PropTypes.string,
  defaultScore: PropTypes.number,
  defaultTags: PropTypes.arrayOf(PropTypes.string),
  defaultComment: PropTypes.string,
  disabled: PropTypes.bool,
  referenceTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
};

