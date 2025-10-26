import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import MentorDirectory from '../components/mentoring/suite/MentorDirectory.jsx';
import MentorShowcaseManager from '../components/mentors/MentorShowcaseManager.jsx';
import MentorOnboardingForm from '../components/mentor/MentorOnboardingForm.jsx';
import MarketplaceSearchInput from '../components/marketplace/MarketplaceSearchInput.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import useSavedMentors from '../hooks/useSavedMentors.js';
import SavedMentorsPanel from '../components/mentor/SavedMentorsPanel.jsx';
import analytics from '../services/analytics.js';
import useSession from '../hooks/useSession.js';
import userMentoringService from '../services/userMentoring.js';

export const MENTOR_LISTING_RESOURCE = 'mentors';
const PAGE_SIZE = 36;

const FALLBACK_TIMEZONES = [
  { value: 'UTC', label: 'Coordinated Universal Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'America/New_York', label: 'New York' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam' },
  { value: 'Asia/Singapore', label: 'Singapore' },
];

function buildGoalFilters(mentors) {
  const values = new Set();
  mentors.forEach((mentor) => {
    (mentor?.goals ?? []).forEach((goal) => {
      if (typeof goal === 'string') {
        const trimmed = goal.trim();
        if (trimmed.length) {
          values.add(trimmed);
        }
      }
    });
  });

  if (!values.size) {
    return undefined;
  }

  return Array.from(values)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ id: value, label: value }));
}

function buildTimezoneOptions(mentors) {
  const set = new Set();
  mentors.forEach((mentor) => {
    const timezone = mentor?.timezone ?? mentor?.metrics?.timezone;
    if (typeof timezone === 'string') {
      const trimmed = timezone.trim();
      if (trimmed.length) {
        set.add(trimmed);
      }
    }
  });

  if (!set.size) {
    return FALLBACK_TIMEZONES;
  }

  return Array.from(set)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      value,
      label: value.replace(/_/g, ' '),
    }));
}

function resolveDefaultTimezone(options, session) {
  const candidate =
    session?.profile?.timezone ??
    session?.timezone ??
    session?.Profile?.timezone ??
    null;
  if (candidate) {
    const match = options.find((option) => option.value === candidate);
    return match ? match.value : candidate;
  }
  return options[0]?.value ?? 'UTC';
}

export default function MentorsPage() {
  const { session } = useSession();
  const [query, setQuery] = useState('');
  const [scheduleFeedback, setScheduleFeedback] = useState(null);

  const { items: savedMentors, toggleMentor, removeMentor, isSaved } = useSavedMentors();

  const { data, error, loading, fromCache, lastUpdated, refresh } = useOpportunityListing(
    MENTOR_LISTING_RESOURCE,
    query,
    {
      page: 1,
      pageSize: PAGE_SIZE,
      includeFacets: true,
    },
  );

  const mentors = useMemo(() => (Array.isArray(data?.items) ? data.items : []), [data?.items]);
  const enrichedMentors = useMemo(
    () =>
      mentors.map((mentor) => ({
        ...mentor,
        isBookmarked: isSaved(mentor.id),
      })),
    [mentors, isSaved],
  );

  const goalFilters = useMemo(() => buildGoalFilters(enrichedMentors), [enrichedMentors]);
  const timezoneOptions = useMemo(() => buildTimezoneOptions(enrichedMentors), [enrichedMentors]);
  const defaultTimezone = useMemo(() => resolveDefaultTimezone(timezoneOptions, session), [timezoneOptions, session]);

  useEffect(() => {
    if (scheduleFeedback && scheduleFeedback.type !== 'pending') {
      const timer = setTimeout(() => setScheduleFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [scheduleFeedback]);

  const handleSearch = useCallback((event) => {
    const nextQuery = event?.target?.value ?? '';
    setQuery(nextQuery);
    analytics.track('mentor_directory.search', { query: nextQuery });
  }, []);

  const handleBookmark = useCallback(
    (mentor) => {
      const saved = toggleMentor(mentor);
      analytics.track('mentor_directory.bookmark', {
        mentorId: mentor?.id ?? null,
        mentorUserId: mentor?.userId ?? null,
        saved,
      });
    },
    [toggleMentor],
  );

  const handleBook = useCallback((mentor) => {
    analytics.track('mentor_directory.card.book', {
      mentorId: mentor?.id ?? null,
      mentorUserId: mentor?.userId ?? null,
    });
  }, []);

  const handleMessage = useCallback((mentor) => {
    analytics.track('mentor_directory.card.message', {
      mentorId: mentor?.id ?? null,
      mentorUserId: mentor?.userId ?? null,
    });
  }, []);

  const handleTrack = useCallback((event) => {
    if (!event) return;
    analytics.track('mentor_directory.event', event);
  }, []);

  const handleSchedule = useCallback(
    async ({ mentorId, mentorProfileId, mentor, slot, sessionType, timezone, notes }) => {
      if (!mentorId) {
        setScheduleFeedback({
          type: 'error',
          message: 'This mentor is onboarding to live bookings. Request introductions via concierge.',
        });
        analytics.track('mentor_directory.schedule.unavailable', { mentorProfileId });
        return;
      }

      if (!session?.id) {
        setScheduleFeedback({ type: 'error', message: 'Sign in to request a mentorship session.' });
        analytics.track('mentor_directory.schedule.login_required', { mentorId, mentorProfileId });
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/sign-in?next=/mentors';
        }
        return;
      }

      try {
        setScheduleFeedback({ type: 'pending', message: 'Sending your booking request…' });
        await userMentoringService.createMentoringSession(session.id, {
          mentorId: Number(mentorId),
          topic: sessionType?.label ?? 'Mentorship session',
          agenda: notes ?? undefined,
          scheduledAt: slot?.start,
          durationMinutes: sessionType?.durationMinutes ?? 60,
          status: 'requested',
          metadata: {
            source: 'mentor-directory',
            timezone: typeof timezone === 'object' ? timezone.value : timezone,
            sessionTypeId: sessionType?.id ?? null,
            mentorProfileId: mentorProfileId ?? null,
          },
        });
        setScheduleFeedback({
          type: 'success',
          message: `Session request sent to ${mentor?.firstName ?? mentor?.name ?? 'the mentor'}. We'll email you once it's confirmed.`,
        });
        analytics.track('mentor_directory.schedule.success', {
          mentorId,
          mentorProfileId,
          sessionTypeId: sessionType?.id ?? null,
        });
      } catch (scheduleError) {
        console.error('Failed to schedule mentorship session', scheduleError);
        setScheduleFeedback({
          type: 'error',
          message: scheduleError?.message ?? 'Unable to schedule this session right now. Please try again shortly.',
        });
        analytics.track('mentor_directory.schedule.failure', {
          mentorId,
          mentorProfileId,
          error: scheduleError?.message ?? 'unknown-error',
        });
      }
    },
    [session?.id],
  );

  const handleSelectSavedMentor = useCallback(
    (mentorId) => {
      const match = enrichedMentors.find((mentor) => `${mentor.id}` === `${mentorId}`);
      if (match) {
        setQuery(match.name ?? match.headline ?? '');
        analytics.track('mentor_directory.saved.select', { mentorId });
      }
    },
    [enrichedMentors],
  );

  const handleRemoveSavedMentor = useCallback(
    (mentorId) => {
      removeMentor(mentorId);
      analytics.track('mentor_directory.saved.remove', { mentorId });
    },
    [removeMentor],
  );

  const currentUser = useMemo(
    () =>
      session
        ? {
            firstName: session.firstName ?? session.profile?.firstName ?? session?.user?.firstName ?? null,
            goal:
              session.profile?.primaryGoal ??
              session.profile?.focus ??
              session.goals?.[0] ??
              null,
            impactStatement: session.profile?.impactStatement ?? null,
          }
        : null,
    [session],
  );

  const scheduleMessage =
    scheduleFeedback?.message && scheduleFeedback.type === 'pending'
      ? 'Sending your booking request…'
      : scheduleFeedback?.message;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Mentors"
        subtitle="Book mentors, clinics, and coaching packages that match your product and revenue goals."
      >
        <MarketplaceSearchInput
          value={query}
          onChange={handleSearch}
          placeholder="Search mentors, focus areas, or outcomes"
          className="max-w-3xl"
        />
      </PageHeader>

      <DataStatus
        loading={loading}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        error={error}
        statusLabel="Mentor directory"
      >
        {scheduleMessage ? (
          <div
            className={`rounded-3xl border px-4 py-3 text-sm font-semibold ${
              scheduleFeedback?.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : scheduleFeedback?.type === 'pending'
                ? 'border-sky-200 bg-sky-50 text-sky-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {scheduleMessage}
          </div>
        ) : null}

        <MentorDirectory
          mentors={enrichedMentors}
          currentUser={currentUser}
          goalFilters={goalFilters}
          searchTerm={query}
          onBookmark={handleBookmark}
          onBook={handleBook}
          onMessage={handleMessage}
          onSchedule={handleSchedule}
          onTrack={handleTrack}
          timezoneOptions={timezoneOptions}
          defaultTimezone={defaultTimezone}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
          <div className="space-y-6">
            <SavedMentorsPanel
              mentors={savedMentors}
              onSelect={handleSelectSavedMentor}
              onRemove={handleRemoveSavedMentor}
            />
            <MentorShowcaseManager />
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Featured formats</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <span className="font-semibold text-white">Leadership pods</span> • Six-week journeys blending live sessions and
                  async reviews.
                </li>
                <li>
                  <span className="font-semibold text-white">Revenue labs</span> • Diagnose pipeline blockers with GTM mentors and
                  co-create playbooks.
                </li>
                <li>
                  <span className="font-semibold text-white">Portfolio clinics</span> • Intensive storytelling reviews to prep for
                  promotions and fundraising.
                </li>
              </ul>
              <p className="mt-5 text-xs text-slate-300">
                Mentor packages sync with Explorer alerts and the mentor dashboard so you can manage demand centrally.
              </p>
            </div>
            <MentorOnboardingForm onSubmitted={refresh} ctaLabel="List my mentorship" />
          </div>
        </div>
      </DataStatus>
    </div>
  );
}
