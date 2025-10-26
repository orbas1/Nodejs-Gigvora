import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  AdjustmentsHorizontalIcon,
  BoltIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import MentorProfileCard from './MentorProfileCard.jsx';
import SessionScheduler from './SessionScheduler.jsx';

const DEFAULT_GOAL_FILTERS = [
  { id: 'fundraising', label: 'Fundraising polish' },
  { id: 'career-pivot', label: 'Career pivots' },
  { id: 'product', label: 'Product strategy' },
  { id: 'operations', label: 'Operational excellence' },
];

function deriveMentorScore(mentor) {
  const baseScore = mentor?.compatibilityScore ?? mentor?.matchScore ?? 0;
  const rating = mentor?.metrics?.rating ? mentor.metrics.rating * 10 : 0;
  const success = mentor?.metrics?.successRate ?? mentor?.successRate ?? 0;
  return baseScore + rating + success;
}

function filterMentors(mentors, filters, searchTerm) {
  if (!Array.isArray(mentors)) return [];
  const query = searchTerm?.trim().toLowerCase();
  return mentors
    .filter((mentor) => {
      if (filters.goal && mentor?.goals && !mentor.goals.includes(filters.goal)) {
        return false;
      }
      if (filters.industry && mentor?.industries && !mentor.industries.includes(filters.industry)) {
        return false;
      }
      if (filters.language && mentor?.languages && !mentor.languages.includes(filters.language)) {
        return false;
      }
      if (filters.minRating && (mentor?.metrics?.rating ?? 0) < filters.minRating) {
        return false;
      }
      if (filters.availableOnly && !mentor?.availabilitySlots?.length && !mentor?.availabilitySummary) {
        return false;
      }
      if (query) {
        const haystack = [
          mentor?.firstName,
          mentor?.lastName,
          mentor?.displayName,
          mentor?.headline,
          mentor?.summary,
          mentor?.industries?.join(' '),
          mentor?.focusAreas?.join(' '),
          mentor?.stories?.map((story) => (typeof story === 'string' ? story : story?.quote ?? '')).join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => deriveMentorScore(b) - deriveMentorScore(a));
}

function MentorStoryCarousel({ stories, onExplore }) {
  if (!stories.length) return null;
  return (
    <div className="space-y-3 rounded-3xl border border-white/20 bg-white/10 p-6 text-white backdrop-blur">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Success snapshots</p>
          <h3 className="text-lg font-semibold">Mentors turning wins into playbooks</h3>
        </div>
        <SparklesIcon className="h-6 w-6 text-emerald-200" aria-hidden="true" />
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {stories.map((story, index) => (
          <article key={index} className="rounded-2xl bg-white/10 p-4 text-sm leading-relaxed text-white/90 shadow-inner">
            <p>“{story.quote ?? story.text ?? story}”</p>
            <footer className="mt-3 flex items-center justify-between text-xs text-white/60">
              <span>{story.name ?? story.author ?? 'Mentee success'}</span>
              {story.company ? <span>{story.company}</span> : null}
            </footer>
          </article>
        ))}
      </div>
      <button
        type="button"
        onClick={onExplore}
        className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10"
      >
        Explore more wins
      </button>
    </div>
  );
}

MentorStoryCarousel.propTypes = {
  stories: PropTypes.array.isRequired,
  onExplore: PropTypes.func,
};

export default function MentorDirectory({
  mentors,
  currentUser,
  goalFilters = DEFAULT_GOAL_FILTERS,
  defaultFilters,
  onBook,
  onBookmark,
  onMessage,
  onTrack,
  onSchedule,
  timezoneOptions,
  defaultTimezone,
  sessionTypes,
}) {
  const [filters, setFilters] = useState({
    goal: defaultFilters?.goal ?? null,
    industry: defaultFilters?.industry ?? null,
    language: defaultFilters?.language ?? null,
    minRating: defaultFilters?.minRating ?? 4,
    availableOnly: defaultFilters?.availableOnly ?? false,
  });
  const [search, setSearch] = useState(searchTerm ?? '');
  const deferredSearch = useDeferredValue(search);
  const [activeMentor, setActiveMentor] = useState(null);
  const [isRequestingRecommendations, setIsRequestingRecommendations] = useState(false);
  const recommendationTimeoutRef = useRef();

  const filteredMentors = useMemo(
    () => filterMentors(mentors, filters, deferredSearch),
    [mentors, filters, deferredSearch],
  );

  const highlightedStories = useMemo(() => {
    return filteredMentors
      .flatMap((mentor) => mentor.testimonials ?? mentor.stories ?? [])
      .slice(0, 4);
  }, [filteredMentors]);

  const premiumCount = filteredMentors.filter((mentor) => mentor.isFeatured || mentor.metrics?.rating >= 4.8).length;
  const availableCount = filteredMentors.filter((mentor) => mentor.availabilitySlots?.length).length;

  useEffect(() => {
    onTrack?.({
      type: 'directory:viewed',
      mentorCount: mentors?.length ?? 0,
      filters,
    });
  }, [mentors?.length, filters, onTrack]);

  useEffect(() => {
    if (typeof searchTerm === 'string') {
      setSearch(searchTerm);
    }
  }, [searchTerm]);

  useEffect(() => () => clearTimeout(recommendationTimeoutRef.current), []);

  const handleRecommendationRequest = () => {
    setIsRequestingRecommendations(true);
    onTrack?.({ type: 'directory:request-recommendations', filters });
    clearTimeout(recommendationTimeoutRef.current);
    recommendationTimeoutRef.current = setTimeout(() => {
      setIsRequestingRecommendations(false);
    }, 1400);
  };

  const heroTitle = currentUser?.firstName
    ? `Hi ${currentUser.firstName}, your curated mentorship lane awaits`
    : 'Discover mentors crafted for your next leap';

  const heroSubtitle = currentUser?.goal
    ? `We hand-picked mentors to accelerate your ${currentUser.goal.toLowerCase()} ambitions.`
    : 'Filter by goals, availability, and success stories to find mentors who feel like trusted partners.';

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (search.trim() ? 1 : 0);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2.75rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-10 text-white shadow-[0_40px_120px_rgba(15,23,42,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_55%)]" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">Mentorship suite</p>
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-white lg:text-4xl">{heroTitle}</h1>
            <p className="max-w-xl text-sm text-white/80 lg:text-base">{heroSubtitle}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-white/70">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <UsersIcon className="h-4 w-4" aria-hidden="true" />
                <span>{mentors?.length ?? 0} mentors</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <CheckBadgeIcon className="h-4 w-4" aria-hidden="true" />
                <span>{premiumCount} premium-rated</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <BoltIcon className="h-4 w-4" aria-hidden="true" />
                <span>{availableCount} available this week</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-white/20 bg-white/10 p-5 text-sm text-white/90 backdrop-blur">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-6 w-6 text-emerald-200" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Impact pulse</p>
                <p>{currentUser?.impactStatement ?? 'Mentees who book 2+ sessions report 34% faster outcomes.'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRecommendationRequest}
              className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition',
                isRequestingRecommendations ? 'opacity-70' : 'hover:border-white hover:bg-white/10',
              )}
              disabled={isRequestingRecommendations}
            >
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              {isRequestingRecommendations ? 'Curating...' : 'Refresh recommendations'}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.08)]">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
            <FunnelIcon className="h-4 w-4" aria-hidden="true" />
            <span>Filters</span>
            {activeFiltersCount ? (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white">{activeFiltersCount}</span>
            ) : null}
          </div>
          <div className="relative flex-1 lg:max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search mentors, skills, outcomes"
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-5 text-sm text-slate-600 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300/40"
            />
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Goal</p>
            <div className="flex flex-wrap gap-2">
              {goalFilters.map((goal) => {
                const isActive = filters.goal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => {
                      const nextGoal = isActive ? null : goal.id;
                      setFilters((prev) => ({ ...prev, goal: nextGoal }));
                      onTrack?.({ type: 'directory:filter-goal', goal: nextGoal });
                    }}
                    className={clsx(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition',
                      isActive
                        ? 'border-sky-400 bg-sky-50 text-sky-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:text-sky-600',
                    )}
                  >
                    {goal.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Industry</p>
            <select
              value={filters.industry ?? ''}
              onChange={(event) => {
                const value = event.target.value || null;
                setFilters((prev) => ({ ...prev, industry: value }));
                onTrack?.({ type: 'directory:filter-industry', value });
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300/40"
            >
              <option value="">All industries</option>
              {Array.from(new Set((mentors ?? []).flatMap((mentor) => mentor.industries ?? []))).map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Language</p>
            <select
              value={filters.language ?? ''}
              onChange={(event) => {
                const value = event.target.value || null;
                setFilters((prev) => ({ ...prev, language: value }));
                onTrack?.({ type: 'directory:filter-language', value });
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300/40"
            >
              <option value="">All languages</option>
              {Array.from(new Set((mentors ?? []).flatMap((mentor) => mentor.languages ?? []))).map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Rating</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="3"
                max="5"
                step="0.1"
                value={filters.minRating ?? 4}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setFilters((prev) => ({ ...prev, minRating: value }));
                  onTrack?.({ type: 'directory:filter-rating', value });
                }}
                className="flex-1"
              />
              <span className="text-sm font-semibold text-slate-600">{filters.minRating?.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(event) => {
                const value = event.target.checked;
                setFilters((prev) => ({ ...prev, availableOnly: value }));
                onTrack?.({ type: 'directory:filter-availability', value });
              }}
              className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
            />
            <span>Show available now</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setFilters({ goal: null, industry: null, language: null, minRating: 4, availableOnly: false });
              setSearch('');
              onTrack?.({ type: 'directory:reset-filters' });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      {highlightedStories.length ? (
        <section className="relative overflow-hidden rounded-[2.75rem] border border-slate-200 bg-gradient-to-br from-sky-500 via-indigo-500 to-emerald-500 p-8 shadow-[0_40px_120px_rgba(14,116,144,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%)]" aria-hidden="true" />
          <MentorStoryCarousel stories={highlightedStories} onExplore={() => onTrack?.({ type: 'directory:view-stories' })} />
        </section>
      ) : null}

      <section className="space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Mentor results</p>
            <h2 className="text-2xl font-semibold text-slate-900">{filteredMentors.length} mentors aligned to your goals</h2>
          </div>
          <p className="max-w-md text-sm text-slate-500">
            Save mentors to compare, message for chemistry checks, or book instantly with our concierge scheduler.
          </p>
        </header>

        {filteredMentors.length ? (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredMentors.map((mentor) => (
              <MentorProfileCard
                key={mentor.id}
                mentor={mentor}
                onBook={(value) => {
                  setActiveMentor(value);
                  onBook?.(value);
                }}
                onBookmark={(value) => onBookmark?.(value)}
                onMessage={(value) => onMessage?.(value)}
                isBookmarked={mentor.isBookmarked}
                highlight={mentor.isFeatured}
                showAvailability
                onTrack={(payload) =>
                  onTrack?.({ type: 'directory:card-action', mentorId: mentor.id, ...payload })
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <FunnelIcon className="h-10 w-10 text-slate-300" aria-hidden="true" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-700">We couldn’t find matches</h3>
              <p className="max-w-md text-sm text-slate-500">
                Adjust filters or request concierge curation—our team can introduce hand-picked mentors for your niche within 24
                hours.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRecommendationRequest}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
            >
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              Request concierge help
            </button>
          </div>
        )}
      </section>

      {activeMentor ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/60 px-4 py-10 backdrop-blur-sm sm:items-center">
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setActiveMentor(null)}
              className="absolute -right-3 -top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-lg ring-1 ring-slate-200 transition hover:text-slate-900"
              aria-label="Close scheduler"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <SessionScheduler
              availability={activeMentor.availabilitySlots}
              timezoneOptions={timezoneOptions}
              defaultTimezone={defaultTimezone}
              sessionTypes={sessionTypes ?? activeMentor.sessionTypes}
              mentor={activeMentor}
              onSchedule={(payload) => {
                onSchedule?.(payload);
                setActiveMentor(null);
              }}
              onTrack={(payload) => onTrack?.({ type: 'directory:scheduler', ...payload })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

MentorDirectory.propTypes = {
  mentors: PropTypes.arrayOf(PropTypes.object),
  currentUser: PropTypes.shape({
    firstName: PropTypes.string,
    goal: PropTypes.string,
    impactStatement: PropTypes.string,
  }),
  searchTerm: PropTypes.string,
  goalFilters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  defaultFilters: PropTypes.shape({
    goal: PropTypes.string,
    industry: PropTypes.string,
    language: PropTypes.string,
    minRating: PropTypes.number,
    availableOnly: PropTypes.bool,
  }),
  onBook: PropTypes.func,
  onBookmark: PropTypes.func,
  onMessage: PropTypes.func,
  onTrack: PropTypes.func,
  onSchedule: PropTypes.func,
  timezoneOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string,
    }),
  ),
  defaultTimezone: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string }),
  ]),
  sessionTypes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      duration: PropTypes.string,
      price: PropTypes.string,
    }),
  ),
};
