import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import MentorProfileCard from '../components/mentor/MentorProfileCard.jsx';
import MentorOnboardingForm from '../components/mentor/MentorOnboardingForm.jsx';
import MentorShowcaseManager from '../components/mentors/MentorShowcaseManager.jsx';
import MarketplaceSearchInput from '../components/marketplace/MarketplaceSearchInput.jsx';
import useSavedMentors from '../hooks/useSavedMentors.js';
import SavedMentorsPanel from '../components/mentor/SavedMentorsPanel.jsx';

export const MENTOR_LISTING_RESOURCE = 'mentors';
const PAGE_SIZE = 12;

function normaliseString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function classifyPrice(amount) {
  if (!Number.isFinite(amount)) {
    return 'tier_entry';
  }
  if (amount <= 150) {
    return 'tier_entry';
  }
  if (amount <= 300) {
    return 'tier_growth';
  }
  return 'tier_scale';
}

function normaliseAvailability(mentor) {
  const raw = normaliseString(
    mentor?.availability?.status ?? mentor?.availabilityStatus ?? mentor?.status ?? mentor?.availability,
  ).toLowerCase();
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

function buildDisciplineOptions(facetValues, mentors) {
  const values = new Set();
  if (Array.isArray(facetValues)) {
    facetValues.forEach((entry) => {
      if (typeof entry === 'string') {
        values.add(entry);
      } else if (entry && typeof entry === 'object') {
        const value = entry.value ?? entry.label ?? entry.name;
        if (value) {
          values.add(value);
        }
      }
    });
  }
  if (!values.size && Array.isArray(mentors)) {
    mentors.forEach((mentor) => {
      if (mentor?.discipline) {
        values.add(mentor.discipline);
      }
      (mentor?.expertise ?? []).forEach((item) => {
        if (item) {
          values.add(item);
        }
      });
    });
  }
  return Array.from(values)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

const priceOptions = [
  { value: 'all', label: 'All prices' },
  { value: 'tier_entry', label: 'Up to £150/session' },
  { value: 'tier_growth', label: '£150-£300/session' },
  { value: 'tier_scale', label: '£300+/session' },
];

const availabilityOptions = [
  { value: 'all', label: 'All availability' },
  { value: 'open', label: 'Open slots' },
  { value: 'waitlist', label: 'Waitlist' },
  { value: 'booked_out', label: 'Booked out' },
];

export default function MentorsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [priceTier, setPriceTier] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  const filtersPayload = useMemo(() => {
    const payload = {};
    if (selectedDisciplines.length) {
      payload.discipline = selectedDisciplines;
    }
    if (priceTier !== 'all') {
      payload.priceTier = priceTier;
    }
    if (availabilityFilter !== 'all') {
      payload.availability = availabilityFilter;
    }
    return payload;
  }, [selectedDisciplines, priceTier, availabilityFilter]);

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        disciplines: [...selectedDisciplines].sort(),
        priceTier,
        availability: availabilityFilter,
      }),
    [selectedDisciplines, priceTier, availabilityFilter],
  );

  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
    debouncedQuery,
  } = useOpportunityListing(MENTOR_LISTING_RESOURCE, query, {
    page,
    pageSize: PAGE_SIZE,
    filters: filtersPayload,
    includeFacets: true,
  });

  const rawMentors = useMemo(() => (Array.isArray(data?.items) ? data.items : []), [data?.items]);
  const [accumulatedMentors, setAccumulatedMentors] = useState([]);

  useEffect(() => {
    setAccumulatedMentors([]);
    setPage(1);
  }, [filtersKey, debouncedQuery]);

  useEffect(() => {
    if (!Array.isArray(rawMentors)) {
      return;
    }
    setAccumulatedMentors((previous) => {
      if (page === 1) {
        return rawMentors;
      }
      const next = [...previous];
      const seen = new Set(previous.map((mentor) => `${mentor?.id ?? mentor?.name ?? ''}`));
      rawMentors.forEach((mentor, index) => {
        const identifier = mentor?.id ?? `${page}-${index}-${mentor?.name ?? 'mentor'}`;
        if (!seen.has(`${identifier}`)) {
          seen.add(`${identifier}`);
          next.push(mentor);
        }
      });
      return next;
    });
  }, [rawMentors, page]);

  const disciplineOptions = useMemo(
    () => buildDisciplineOptions(data?.facets?.discipline ?? data?.facets?.disciplines, accumulatedMentors),
    [data?.facets?.discipline, data?.facets?.disciplines, accumulatedMentors],
  );

  const selectedDisciplinesLower = useMemo(
    () => selectedDisciplines.map((item) => item.toLowerCase()),
    [selectedDisciplines],
  );

  const filteredMentors = useMemo(
    () =>
      accumulatedMentors.filter((mentor) => {
        const expertise = (mentor?.expertise ?? []).map((item) => item.toLowerCase());
        const discipline = typeof mentor?.discipline === 'string' ? mentor.discipline.toLowerCase() : null;
        const matchesDisciplines =
          !selectedDisciplinesLower.length ||
          selectedDisciplinesLower.every((item) => expertise.includes(item) || discipline === item);

        const amount = Number.isFinite(mentor?.sessionFee?.amount)
          ? mentor.sessionFee.amount
          : Number.isFinite(Number(mentor?.sessionFee))
          ? Number(mentor.sessionFee)
          : undefined;
        const priceBucket = classifyPrice(amount);
        const matchesPrice = priceTier === 'all' || priceBucket === priceTier;

        const availabilityStatus = normaliseAvailability(mentor);
        const matchesAvailability = availabilityFilter === 'all' || availabilityStatus === availabilityFilter;

        return matchesDisciplines && matchesPrice && matchesAvailability;
      }),
    [accumulatedMentors, selectedDisciplinesLower, priceTier, availabilityFilter],
  );

  const isInitialLoading = loading && page === 1 && !accumulatedMentors.length;
  const isLoadingMore = loading && page > 1;

  const totalFromMeta = data?.meta?.total ?? data?.total;
  const hasMoreFromMeta =
    typeof data?.meta?.hasMore === 'boolean'
      ? data.meta.hasMore
      : typeof totalFromMeta === 'number'
      ? accumulatedMentors.length < totalFromMeta
      : undefined;
  const hasMore = hasMoreFromMeta ?? rawMentors.length === PAGE_SIZE;

  const { items: savedMentors, saveMentor, removeMentor, isSaved } = useSavedMentors();

  const handleBookMentor = useCallback((mentor) => {
    analytics.track('web_mentor_book_cta', { mentorId: mentor.id, name: mentor.name }, { source: 'web_app' });
  }, []);

  const handleViewMentor = useCallback((mentor) => {
    analytics.track('web_mentor_profile_viewed', { mentorId: mentor.id, name: mentor.name }, { source: 'web_app' });
  }, []);

  const handleSaveMentor = useCallback(
    (mentor) => {
      if (!mentor || mentor.id == null || isSaved(mentor.id)) {
        return;
      }
      saveMentor(mentor);
      analytics.track('web_mentor_saved', { mentorId: mentor.id, name: mentor.name }, { source: 'web_app' });
    },
    [isSaved, saveMentor],
  );

  const handleRemoveMentorById = useCallback(
    (mentorId) => {
      if (mentorId == null) {
        return;
      }
      removeMentor(mentorId);
      analytics.track('web_mentor_unsaved', { mentorId }, { source: 'web_app' });
    },
    [removeMentor],
  );

  const handleToggleSavedMentor = useCallback(
    (mentor) => {
      if (!mentor || mentor.id == null) {
        return;
      }
      if (isSaved(mentor.id)) {
        handleRemoveMentorById(mentor.id);
      } else {
        handleSaveMentor(mentor);
      }
    },
    [handleRemoveMentorById, handleSaveMentor, isSaved],
  );

  const handleSelectSavedMentor = useCallback(
    (mentorId) => {
      const inList = filteredMentors.find((mentor) => `${mentor.id}` === `${mentorId}`);
      if (inList) {
        handleViewMentor(inList);
        return;
      }
      const savedMeta = savedMentors.find((mentor) => `${mentor.id}` === `${mentorId}`);
      if (savedMeta) {
        handleViewMentor({ id: savedMeta.id, name: savedMeta.name });
      }
    },
    [filteredMentors, handleViewMentor, savedMentors],
  );

  const handleRefresh = useCallback(() => {
    setPage(1);
    setAccumulatedMentors([]);
    refresh({ force: true });
  }, [refresh]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((previous) => previous + 1);
    }
  }, [loading, hasMore]);

  const handleToggleDiscipline = useCallback((value) => {
    setSelectedDisciplines((previous) => {
      if (previous.includes(value)) {
        return previous.filter((item) => item !== value);
      }
      return [...previous, value];
    });
  }, []);

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(221,232,255,0.45),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Mentor marketplace"
          title="Work with leaders who accelerate your next leap"
          description="Book 1:1 sessions, cohort clinics, and mentorship packages with operators across product, design, revenue, and operations."
          meta={
            <DataStatus
              loading={loading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={handleRefresh}
            />
          }
        />
        <div className="mb-8 space-y-4">
          <MarketplaceSearchInput
            id="mentor-search"
            label="Search mentors"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mentors by craft, industry, or outcomes"
          />
          <div className="flex flex-wrap gap-6 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="min-w-[14rem]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Discipline</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {disciplineOptions.map((option) => {
                  const active = selectedDisciplines.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggleDiscipline(option.value)}
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
                })}
                {!disciplineOptions.length ? (
                  <p className="text-xs text-slate-400">Disciplines appear once mentors load.</p>
                ) : null}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Price</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {priceOptions.map((option) => {
                  const active = priceTier === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriceTier(option.value)}
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
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Availability</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {availabilityOptions.map((option) => {
                  const active = availabilityFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAvailabilityFilter(option.value)}
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
          </div>
        </div>
        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            Unable to load mentors right now. {error.message || 'Refresh to try again.'}
          </div>
        ) : null}
        {isInitialLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
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
        {!loading && !filteredMentors.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {debouncedQuery || selectedDisciplines.length || priceTier !== 'all' || availabilityFilter !== 'all'
              ? 'No mentors match your filters yet. Try broadening your search or clearing filters to explore more mentors.'
              : 'Our mentor guild is onboarding now. Share your practice to be featured in Explorer.'}
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <div className="space-y-5">
            {filteredMentors.map((mentor) => (
              <MentorProfileCard
                key={mentor.id ?? mentor.name}
                mentor={mentor}
                onBook={handleBookMentor}
                onView={handleViewMentor}
                onToggleSaved={handleToggleSavedMentor}
                isSaved={isSaved(mentor.id)}
                availability={normaliseAvailability(mentor)}
              />
            ))}
            {hasMore ? (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingMore ? 'Loading more mentors…' : 'Load more mentors'}
                </button>
              </div>
            ) : null}
          </div>
          <div className="space-y-6">
            <SavedMentorsPanel
              mentors={savedMentors}
              onSelect={handleSelectSavedMentor}
              onRemove={handleRemoveMentorById}
            />
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
                Mentor packages sync with Explorer alerts and the new mentor dashboard so you can manage demand centrally.
              </p>
            </div>
            <MentorOnboardingForm onSubmitted={handleRefresh} ctaLabel="List my mentorship" />
          </div>
        </div>
        <MentorShowcaseManager />
      </div>
    </section>
  );
}
