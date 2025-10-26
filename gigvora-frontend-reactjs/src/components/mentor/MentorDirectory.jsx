import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  BoltIcon,
  ClockIcon,
  FunnelIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../PageHeader.jsx';
import DataStatus from '../DataStatus.jsx';
import MarketplaceSearchInput from '../marketplace/MarketplaceSearchInput.jsx';
import MentorProfileCard from './MentorProfileCard.jsx';
import SavedMentorsPanel from './SavedMentorsPanel.jsx';
import MentorOnboardingForm from './MentorOnboardingForm.jsx';
import MentorShowcaseManager from '../mentors/MentorShowcaseManager.jsx';

const DEFAULT_PRICE_OPTIONS = [
  { value: 'all', label: 'All prices' },
  { value: 'tier_entry', label: 'Up to £150/session' },
  { value: 'tier_growth', label: '£150-£300/session' },
  { value: 'tier_scale', label: '£300+/session' },
];

const DEFAULT_AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All availability' },
  { value: 'open', label: 'Open slots' },
  { value: 'waitlist', label: 'Waitlist' },
  { value: 'booked_out', label: 'Booked out' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'All ratings' },
  { value: 4.5, label: '4.5 stars and up' },
  { value: 4.8, label: '4.8 stars and up' },
  { value: 5, label: 'Only 5 star mentors' },
];

function formatNumber(value, { maximumFractionDigits = 0 } = {}) {
  try {
    return new Intl.NumberFormat('en-GB', { maximumFractionDigits }).format(value);
  } catch (error) {
    return `${value}`;
  }
}

function normaliseAvailabilityStatus(mentor) {
  const raw = `${
    mentor?.availability?.status ??
    mentor?.availabilityStatus ??
    mentor?.status ??
    mentor?.availability
  }`
    .trim()
    .toLowerCase();
  if (!raw) {
    return 'open';
  }
  if (raw.includes('wait')) {
    return 'waitlist';
  }
  if (raw.includes('book') || raw.includes('unavail') || raw.includes('closed')) {
    return 'booked_out';
  }
  return 'open';
}

function buildSpotlight(mentors = []) {
  const sorted = mentors
    .filter((mentor) => Number.isFinite(mentor?.rating))
    .sort((a, b) => Number(b.rating) - Number(a.rating));
  const primary = sorted[0] ?? mentors[0] ?? null;
  if (!primary) {
    return null;
  }
  const industries = Array.from(
    new Set(
      [
        primary.discipline,
        ...(Array.isArray(primary.expertise) ? primary.expertise.slice(0, 2) : []),
      ]
        .filter(Boolean)
        .map((item) => `${item}`),
    ),
  );
  const headline = primary.headline || primary.tagline || 'Trusted mentor';
  const testimonial = primary.testimonialHighlight || primary.testimonial;
  return {
    id: primary.id,
    name: primary.name,
    headline,
    testimonial,
    industries,
    rating: Number.isFinite(primary.rating) ? Number(primary.rating) : null,
    wins: primary.successStories ?? primary.careerHighlights ?? [],
  };
}

function MentorDirectory({
  query,
  onQueryChange,
  loading,
  fromCache,
  lastUpdated,
  onRefresh,
  onRetry,
  error,
  mentors,
  allMentors,
  isInitialLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  disciplineOptions,
  selectedDisciplines,
  onToggleDiscipline,
  priceOptions = DEFAULT_PRICE_OPTIONS,
  priceTier,
  onPriceTierChange,
  availabilityOptions = DEFAULT_AVAILABILITY_OPTIONS,
  availabilityFilter,
  onAvailabilityChange,
  minimumRating,
  onMinimumRatingChange,
  savedMentors,
  onSelectSavedMentor,
  onRemoveSavedMentor,
  onToggleSavedMentor,
  isMentorSaved,
  onBookMentor,
  onViewMentor,
  debouncedQuery,
  totalMentorCount,
}) {
  const spotlight = useMemo(() => buildSpotlight(allMentors || mentors), [allMentors, mentors]);

  const totalMentors = Array.isArray(allMentors) && allMentors.length ? allMentors.length : mentors.length;
  const averageRating = useMemo(() => {
    if (!Array.isArray(allMentors) || !allMentors.length) {
      return null;
    }
    const withRatings = allMentors.filter((mentor) => Number.isFinite(Number(mentor?.rating)));
    if (!withRatings.length) {
      return null;
    }
    const sum = withRatings.reduce((accumulator, mentor) => accumulator + Number(mentor.rating), 0);
    return sum / withRatings.length;
  }, [allMentors]);

  const outcomesHighlight = useMemo(() => {
    if (!Array.isArray(allMentors) || !allMentors.length) {
      return null;
    }
    const specialists = allMentors.filter((mentor) => Array.isArray(mentor.outcomes));
    if (!specialists.length) {
      return null;
    }
    const outcomes = specialists
      .flatMap((mentor) => mentor.outcomes)
      .filter(Boolean)
      .slice(0, 3)
      .map((outcome) => `${outcome}`);
    if (!outcomes.length) {
      return null;
    }
    return Array.from(new Set(outcomes));
  }, [allMentors]);

  const emptyStateMessage =
    debouncedQuery || selectedDisciplines.length || priceTier !== 'all' || availabilityFilter !== 'all' || minimumRating
      ? 'No mentors match your filters yet. Adjust filters or clear them to explore more talent.'
      : 'Our mentor guild is onboarding now. Share your practice to be featured in Explorer.';

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(221,232,255,0.45),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Mentor marketplace"
          title="Work with leaders who accelerate your next leap"
          description="Book 1:1 sessions, cohort clinics, and mentorship packages with operators across product, design, revenue, and operations."
          meta={
            <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={onRefresh} />
          }
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Search mentors</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    {totalMentorCount ? `${formatNumber(totalMentorCount)} mentors ready to meet` : 'Discover mentors by craft'}
                  </h3>
                  {averageRating ? (
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <StarIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
                      Average rating {averageRating.toFixed(1)} across the guild
                    </p>
                  ) : null}
                </div>
                {outcomesHighlight && outcomesHighlight.length ? (
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-3 text-xs text-slate-600 shadow-inner">
                    <p className="font-semibold text-slate-800">Popular outcomes this week</p>
                    <ul className="mt-1 space-y-1">
                      {outcomesHighlight.map((outcome) => (
                        <li key={outcome} className="flex items-center gap-2">
                          <SparklesIcon className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="mt-5 space-y-4">
                <MarketplaceSearchInput
                  id="mentor-search"
                  label="Search mentors"
                  value={query}
                  onChange={(event) => onQueryChange?.(event.target.value)}
                  placeholder="Search mentors by craft, industry, or outcomes"
                />
                <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    <FunnelIcon className="h-4 w-4 text-slate-400" aria-hidden="true" /> Filters
                  </div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Discipline</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {disciplineOptions.length ? (
                          disciplineOptions.map((option) => {
                            const active = selectedDisciplines.includes(option.value);
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => onToggleDiscipline?.(option.value)}
                                aria-pressed={active}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                  active
                                    ? 'border-accent bg-accent/10 text-accent'
                                    : 'border-slate-300 text-slate-600 hover:border-accent hover:text-accent'
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-400">Disciplines appear once mentors load.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Price</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {priceOptions.map((option) => {
                          const active = priceTier === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => onPriceTierChange?.(option.value)}
                              aria-pressed={active}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                active
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-300 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Availability</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availabilityOptions.map((option) => {
                          const active = availabilityFilter === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => onAvailabilityChange?.(option.value)}
                              aria-pressed={active}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                active
                                  ? 'border-sky-300 bg-sky-50 text-sky-700'
                                  : 'border-slate-300 text-slate-600 hover:border-sky-300 hover:text-sky-700'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Ratings</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {RATING_OPTIONS.map((option) => {
                          const active = minimumRating === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => onMinimumRatingChange?.(option.value)}
                              aria-pressed={active}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                active
                                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                                  : 'border-slate-300 text-slate-600 hover:border-violet-300 hover:text-violet-700'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  Unable to load mentors right now. {error.message || 'Refresh to try again.'}{' '}
                  {onRetry ? (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="font-semibold text-rose-700 underline-offset-2 hover:underline"
                    >
                      Retry
                    </button>
                  ) : null}
                </div>
              ) : null}

              {isInitialLoading ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
                      <div className="h-3 w-1/4 rounded bg-slate-200" />
                      <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
                      <div className="mt-4 h-3 w-full rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-2/5 rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : null}

              {!loading && !mentors.length ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                  {emptyStateMessage}
                </div>
              ) : null}

              <div className="mt-6 space-y-5">
                {mentors.map((mentor) => (
                  <MentorProfileCard
                    key={mentor.id ?? mentor.name}
                    mentor={mentor}
                    onBook={onBookMentor}
                    onView={onViewMentor}
                    onToggleSaved={onToggleSavedMentor}
                    isSaved={Boolean(isMentorSaved?.(mentor.id))}
                    availability={normaliseAvailabilityStatus(mentor)}
                  />
                ))}
                {hasMore ? (
                  <div className="pt-4 text-center">
                    <button
                      type="button"
                      onClick={onLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoadingMore ? 'Loading more mentors…' : 'Load more mentors'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            {spotlight ? (
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Spotlight mentor</p>
                <h3 className="mt-3 text-2xl font-semibold">{spotlight.name}</h3>
                <p className="mt-1 text-sm text-slate-200">{spotlight.headline}</p>
                {spotlight.rating ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                    <StarIcon className="h-4 w-4" aria-hidden="true" /> {spotlight.rating.toFixed(1)} rating
                  </p>
                ) : null}
                {spotlight.industries && spotlight.industries.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {spotlight.industries.map((item) => (
                      <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
                {spotlight.testimonial ? (
                  <p className="mt-4 text-sm text-slate-200">“{spotlight.testimonial}”</p>
                ) : null}
                {spotlight.wins && spotlight.wins.length ? (
                  <ul className="mt-4 space-y-2 text-xs text-slate-200">
                    {spotlight.wins.slice(0, 3).map((win, index) => (
                      <li key={`${win}-${index}`} className="flex items-center gap-2">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-blue-200" aria-hidden="true" />
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Your saved mentors</p>
              <SavedMentorsPanel
                mentors={savedMentors}
                onSelect={onSelectSavedMentor}
                onRemove={onRemoveSavedMentor}
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Featured formats</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <span className="font-semibold text-white">Leadership pods</span> • 6-week sprints combining live sessions and async feedback.
                </li>
                <li>
                  <span className="font-semibold text-white">Revenue labs</span> • Diagnose pipeline blockers with GTM mentors and co-create playbooks.
                </li>
                <li>
                  <span className="font-semibold text-white">Portfolio clinics</span> • Intensive storytelling reviews to prep for promotions and interviews.
                </li>
              </ul>
              <p className="mt-5 text-xs text-slate-300">
                Mentor packages sync with Explorer alerts and the mentor dashboard so you can manage demand centrally.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-soft">
              <div className="flex items-center gap-3 text-slate-700">
                <BoltIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">List your mentorship</p>
                  <p className="text-xs text-slate-500">Join the mentor guild to share availability and packages with Explorer teams.</p>
                </div>
              </div>
              <div className="mt-4">
                <MentorOnboardingForm ctaLabel="List my mentorship" onSubmitted={onRefresh} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Community highlights</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-blue-500" aria-hidden="true" /> Mentors respond in under 12 hours on average.
                </li>
                <li className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-amber-500" aria-hidden="true" /> 92% of mentees book repeat sessions.
                </li>
                <li className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Success stories span startups, scaleups, and enterprise operators.
                </li>
              </ul>
            </div>

            <MentorShowcaseManager />
          </aside>
        </div>
      </div>
    </section>
  );
}

MentorDirectory.propTypes = {
  query: PropTypes.string,
  onQueryChange: PropTypes.func,
  loading: PropTypes.bool,
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  onRefresh: PropTypes.func,
  onRetry: PropTypes.func,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  mentors: PropTypes.arrayOf(PropTypes.object).isRequired,
  allMentors: PropTypes.arrayOf(PropTypes.object),
  isInitialLoading: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
  disciplineOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  selectedDisciplines: PropTypes.arrayOf(PropTypes.string),
  onToggleDiscipline: PropTypes.func,
  priceOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  priceTier: PropTypes.string,
  onPriceTierChange: PropTypes.func,
  availabilityOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  availabilityFilter: PropTypes.string,
  onAvailabilityChange: PropTypes.func,
  minimumRating: PropTypes.number,
  onMinimumRatingChange: PropTypes.func,
  savedMentors: PropTypes.arrayOf(PropTypes.object),
  onSelectSavedMentor: PropTypes.func,
  onRemoveSavedMentor: PropTypes.func,
  onToggleSavedMentor: PropTypes.func,
  isMentorSaved: PropTypes.func,
  onBookMentor: PropTypes.func,
  onViewMentor: PropTypes.func,
  debouncedQuery: PropTypes.string,
  totalMentorCount: PropTypes.number,
};

export default MentorDirectory;
