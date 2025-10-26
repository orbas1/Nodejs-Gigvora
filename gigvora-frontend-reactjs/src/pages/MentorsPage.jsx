import { useCallback, useEffect, useMemo, useState } from 'react';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import useSavedMentors from '../hooks/useSavedMentors.js';
import MentorDirectory from '../components/mentor/MentorDirectory.jsx';

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
  const [minimumRating, setMinimumRating] = useState(0);

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
        minimumRating,
      }),
    [selectedDisciplines, priceTier, availabilityFilter, minimumRating],
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

        const ratingValue = Number.isFinite(mentor?.rating)
          ? Number(mentor.rating)
          : Number.isFinite(Number(mentor?.score))
          ? Number(mentor.score)
          : 0;
        const matchesRating = !minimumRating || ratingValue >= minimumRating;

        return matchesDisciplines && matchesPrice && matchesAvailability && matchesRating;
      }),
    [accumulatedMentors, selectedDisciplinesLower, priceTier, availabilityFilter, minimumRating],
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
    <MentorDirectory
      query={query}
      onQueryChange={setQuery}
      loading={loading}
      fromCache={fromCache}
      lastUpdated={lastUpdated}
      onRefresh={handleRefresh}
      onRetry={handleRefresh}
      error={error}
      mentors={filteredMentors}
      allMentors={accumulatedMentors}
      isInitialLoading={isInitialLoading}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      disciplineOptions={disciplineOptions}
      selectedDisciplines={selectedDisciplines}
      onToggleDiscipline={handleToggleDiscipline}
      priceOptions={priceOptions}
      priceTier={priceTier}
      onPriceTierChange={setPriceTier}
      availabilityOptions={availabilityOptions}
      availabilityFilter={availabilityFilter}
      onAvailabilityChange={setAvailabilityFilter}
      minimumRating={minimumRating}
      onMinimumRatingChange={setMinimumRating}
      savedMentors={savedMentors}
      onSelectSavedMentor={handleSelectSavedMentor}
      onRemoveSavedMentor={handleRemoveMentorById}
      onToggleSavedMentor={handleToggleSavedMentor}
      isMentorSaved={isSaved}
      onBookMentor={handleBookMentor}
      onViewMentor={handleViewMentor}
      debouncedQuery={debouncedQuery}
      totalMentorCount={totalFromMeta}
    />
  );
}
