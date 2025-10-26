import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ArrowRightCircleIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

function CompatibilityDial({ score }) {
  const safeScore = Math.max(0, Math.min(score ?? 0, 100));
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-16 w-16 drop-shadow-sm"
      role="img"
      aria-label={`Compatibility score ${safeScore} out of 100`}
    >
      <defs>
        <linearGradient id="compatibilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="36"
        stroke="rgba(148, 163, 184, 0.2)"
        strokeWidth="12"
        fill="none"
      />
      <circle
        cx="50"
        cy="50"
        r="36"
        stroke="url(#compatibilityGradient)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        fill="none"
        className="transition-all duration-700 ease-out"
      />
      <text
        x="50"
        y="54"
        textAnchor="middle"
        className="fill-slate-900 text-base font-semibold"
      >
        {safeScore}
      </text>
    </svg>
  );
}

CompatibilityDial.propTypes = {
  score: PropTypes.number,
};

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="uppercase tracking-wide">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

StatPill.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default function MentorProfileCard({
  mentor,
  onBook,
  onMessage,
  onBookmark,
  isBookmarked = false,
  highlight,
  showAvailability,
  onTrack,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fullName = useMemo(() => {
    if (!mentor) return 'Mentor';
    const parts = [mentor.firstName, mentor.lastName].filter(Boolean);
    if (parts.length) {
      return parts.join(' ');
    }
    return mentor.displayName ?? mentor.username ?? 'Mentor';
  }, [mentor]);

  const heroImage = mentor?.media?.heroImage || mentor?.avatarUrl;
  const avatar = mentor?.avatarUrl;
  const headline = mentor?.headline || mentor?.title || 'Mentor & Advisor';
  const successRate = mentor?.successRate ?? mentor?.metrics?.successRate;
  const stories = mentor?.stories ?? [];
  const testimonials = mentor?.testimonials ?? mentor?.reviews ?? [];
  const availability = mentor?.availabilitySummary;
  const ratingValue = typeof mentor?.metrics?.rating === 'number' ? mentor.metrics.rating : null;
  const reviewTotal =
    typeof mentor?.metrics?.reviewCount === 'number'
      ? mentor.metrics.reviewCount
      : mentor?.metrics?.reviews ?? null;

  const topFocus = useMemo(() => {
    const focusAreas = mentor?.focusAreas || mentor?.specialties || [];
    return focusAreas.slice(0, 4);
  }, [mentor]);

  const compatibilityScore = mentor?.compatibilityScore ?? mentor?.matchScore ?? null;

  const handleAction = (type) => {
    onTrack?.({
      type,
      mentorId: mentor?.id,
      compatibilityScore,
    });
  };

  return (
    <article
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.16)]',
        highlight ? 'ring-2 ring-offset-2 ring-offset-slate-900/5 ring-sky-400/70' : null,
      )}
    >
      <div className="relative h-40 w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-transparent"
          aria-hidden="true"
        />
        {heroImage ? (
          <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-emerald-400 to-indigo-600" aria-hidden="true" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4 text-white">
          <div className="flex flex-wrap items-center gap-2">
            {mentor?.isFeatured ? (
              <StatPill icon={SparklesIcon} label="Featured" value="Mentor" />
            ) : null}
            {successRate ? (
              <StatPill icon={TrophyIcon} label="Success" value={`${successRate}%`} />
            ) : null}
            {mentor?.metrics?.menteesServed ? (
              <StatPill icon={UsersIcon} label="Mentees" value={mentor.metrics.menteesServed} />
            ) : null}
          </div>
          {compatibilityScore != null ? <CompatibilityDial score={compatibilityScore} /> : null}
        </div>
        <div className="absolute -bottom-10 right-6 h-24 w-24 overflow-hidden rounded-3xl border-4 border-white/80 shadow-xl transition group-hover:rotate-3">
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/70 text-3xl font-semibold text-slate-600">
              {fullName.charAt(0)}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-6 pb-6 pt-12">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{fullName}</h3>
              <p className="text-sm text-slate-500">{headline}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onBookmark?.(mentor);
                handleAction(isBookmarked ? 'unbookmark' : 'bookmark');
              }}
              className={clsx(
                'inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold transition',
                isBookmarked
                  ? 'border-amber-200 bg-amber-50 text-amber-600 hover:border-amber-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
              )}
              aria-pressed={isBookmarked}
            >
              <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {mentor?.summary ? (
            <p className="text-sm leading-relaxed text-slate-600">{mentor.summary}</p>
          ) : null}
        </header>

        {showAvailability && availability ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
            <ClockIcon className="h-4 w-4 text-sky-500" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-wide text-slate-500">Next availability</span>
            <span className="font-semibold text-slate-900">{availability}</span>
          </div>
        ) : null}

        {topFocus.length ? (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Focus Areas</h4>
            <div className="flex flex-wrap gap-2">
              {topFocus.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-600"
                >
                  <SparklesIcon className="h-4 w-4 text-sky-400" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {ratingValue != null ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-inner">
            <div className="flex items-center gap-1 text-amber-500">
              <StarIcon className="h-5 w-5" aria-hidden="true" />
              <span className="text-base font-semibold text-slate-900">{ratingValue.toFixed(1)}</span>
            </div>
            <p className="text-sm text-slate-500">
              {reviewTotal != null ? `Based on ${reviewTotal} verified reviews` : 'Be the first to review this mentor'}
            </p>
          </div>
        ) : null}

        {stories.length ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Signature Wins</h4>
              <button
                type="button"
                className="text-xs font-semibold text-sky-600 underline decoration-sky-200 underline-offset-4 transition hover:text-sky-500"
                onClick={() => {
                  setIsExpanded((value) => !value);
                  handleAction('toggle-story');
                }}
              >
                {isExpanded ? 'Hide' : 'Preview'}
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              {(isExpanded ? stories : stories.slice(0, 1)).map((story, index) => (
                <blockquote key={index} className="rounded-2xl border border-slate-100 bg-white/60 p-4 shadow-sm">
                  <p className="text-sm leading-relaxed">“{story.quote ?? story}”</p>
                  {story?.attribution ? (
                    <footer className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {story.attribution}
                    </footer>
                  ) : null}
                </blockquote>
              ))}
            </div>
          </div>
        ) : null}

        {testimonials.length ? (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Testimonials</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {testimonials.slice(0, 2).map((testimonial, index) => (
                <article
                  key={index}
                  className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 text-sm text-slate-600 shadow-sm"
                >
                  <p className="leading-relaxed">{testimonial.quote ?? testimonial.text ?? testimonial}</p>
                  <footer className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>{testimonial.name ?? testimonial.author ?? 'Mentee'}</span>
                    {testimonial.company ? <span>{testimonial.company}</span> : null}
                  </footer>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              onBook?.(mentor);
              handleAction('book');
            }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/60 transition hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400"
          >
            <ArrowRightCircleIcon className="h-5 w-5" aria-hidden="true" />
            <span>Book Session</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onMessage?.(mentor);
              handleAction('message');
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
            <span>Message</span>
          </button>
        </div>
      </div>
    </article>
  );
}

MentorProfileCard.propTypes = {
  mentor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    displayName: PropTypes.string,
    username: PropTypes.string,
    media: PropTypes.shape({
      heroImage: PropTypes.string,
    }),
    avatarUrl: PropTypes.string,
    headline: PropTypes.string,
    title: PropTypes.string,
    summary: PropTypes.string,
    stories: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          quote: PropTypes.string,
          attribution: PropTypes.string,
        }),
      ]),
    ),
    testimonials: PropTypes.arrayOf(
      PropTypes.shape({
        quote: PropTypes.string,
        text: PropTypes.string,
        name: PropTypes.string,
        author: PropTypes.string,
        company: PropTypes.string,
      }),
    ),
    reviews: PropTypes.array,
    focusAreas: PropTypes.arrayOf(PropTypes.string),
    specialties: PropTypes.arrayOf(PropTypes.string),
    compatibilityScore: PropTypes.number,
    matchScore: PropTypes.number,
    availabilitySummary: PropTypes.string,
    successRate: PropTypes.number,
    isFeatured: PropTypes.bool,
    metrics: PropTypes.shape({
      successRate: PropTypes.number,
      menteesServed: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      rating: PropTypes.number,
      reviewCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      reviews: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  }),
  onBook: PropTypes.func,
  onMessage: PropTypes.func,
  onBookmark: PropTypes.func,
  isBookmarked: PropTypes.bool,
  highlight: PropTypes.bool,
  showAvailability: PropTypes.bool,
  onTrack: PropTypes.func,
};
