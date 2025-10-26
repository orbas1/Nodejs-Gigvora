import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import EventCalendar from '../components/community/events/EventCalendar.jsx';
import EventDetailModal from '../components/community/events/EventDetailModal.jsx';
import VolunteerRoster from '../components/community/events/VolunteerRoster.jsx';
import useSession from '../hooks/useSession.js';
import analytics from '../services/analytics.js';
import {
  fetchCommunityCalendar,
  fetchCommunityEvent,
  fetchVolunteerRoster,
} from '../services/communityEvents.js';

function resolveTimezone(session) {
  const candidates = [
    session?.profile?.timezone,
    session?.primaryWorkspace?.timezone,
    session?.timezone,
  ];
  const timezone = candidates.find((value) => typeof value === 'string' && value.trim());
  if (timezone) {
    return timezone;
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'UTC';
  }
}

function mapPreferences(session) {
  const raw = session?.communityPreferences ?? session?.preferences?.community ?? {};
  const toArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
  return {
    categories: toArray(raw.categories),
    audiences: toArray(raw.audiences),
    focusAreas: toArray(raw.focusAreas),
    location: raw.location ?? 'all',
    volunteerOnly: Boolean(raw.volunteerOnly),
  };
}

export default function CommunityEventsPage() {
  const { session } = useSession();
  const timezone = useMemo(() => resolveTimezone(session), [session]);
  const preferences = useMemo(() => mapPreferences(session), [session]);

  const [calendarData, setCalendarData] = useState({ events: [], recommended: [], timezone, generatedAt: null });
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const calendarAbortRef = useRef();

  const [volunteerData, setVolunteerData] = useState({ volunteers: [], featuredStories: [], generatedAt: null });
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [volunteerError, setVolunteerError] = useState(null);
  const volunteerAbortRef = useRef();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventError, setEventError] = useState(null);
  const [eventBusy, setEventBusy] = useState(false);
  const eventAbortRef = useRef();

  const persona = session?.userType ?? session?.persona ?? null;

  const loadCalendar = useCallback(
    ({ volunteerOnly = preferences.volunteerOnly } = {}) => {
      if (calendarAbortRef.current) {
        calendarAbortRef.current.abort();
      }
      const controller = new AbortController();
      calendarAbortRef.current = controller;
      setCalendarLoading(true);
      setCalendarError(null);
      fetchCommunityCalendar(
        {
          limit: 40,
          timezone,
          persona: persona ?? undefined,
          volunteerOnly,
        },
        { signal: controller.signal },
      )
        .then((response) => {
          if (controller.signal.aborted) {
            return;
          }
          const payload = response ?? {};
          setCalendarData({
            events: Array.isArray(payload.events) ? payload.events : [],
            recommended: Array.isArray(payload.recommended) ? payload.recommended : [],
            timezone: payload.timezone ?? timezone,
            generatedAt: payload.generatedAt ?? new Date().toISOString(),
          });
        })
        .catch((error) => {
          if (controller.signal.aborted) {
            return;
          }
          const message = error?.body?.message ?? error?.message ?? 'We could not load the latest calendar snapshot.';
          setCalendarError(message);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setCalendarLoading(false);
          }
        });
    },
    [persona, preferences.volunteerOnly, timezone],
  );

  const loadVolunteerRoster = useCallback(() => {
    if (volunteerAbortRef.current) {
      volunteerAbortRef.current.abort();
    }
    const controller = new AbortController();
    volunteerAbortRef.current = controller;
    setVolunteerLoading(true);
    setVolunteerError(null);
    fetchVolunteerRoster({ limit: 40 }, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }
        const payload = response ?? {};
        setVolunteerData({
          volunteers: Array.isArray(payload.volunteers) ? payload.volunteers : [],
          featuredStories: Array.isArray(payload.featuredStories) ? payload.featuredStories : [],
          generatedAt: payload.generatedAt ?? new Date().toISOString(),
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        const message = error?.body?.message ?? error?.message ?? 'We could not refresh the volunteer roster.';
        setVolunteerError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setVolunteerLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    loadCalendar();
    return () => {
      calendarAbortRef.current?.abort();
    };
  }, [loadCalendar]);

  useEffect(() => {
    loadVolunteerRoster();
    return () => {
      volunteerAbortRef.current?.abort();
    };
  }, [loadVolunteerRoster]);

  const events = useMemo(() => calendarData.events ?? [], [calendarData.events]);
  const recommendedEvents = useMemo(() => calendarData.recommended ?? [], [calendarData.recommended]);

  const handleFilterChange = useCallback((filters) => {
    analytics.track(
      'web_community_calendar_filters_changed',
      {
        ...filters,
        eventCount: events.length,
      },
      { source: 'web_app' },
    );
  }, [events.length]);

  const handleSyncCalendar = useCallback(() => {
    analytics.track(
      'web_community_calendar_sync_clicked',
      {
        eventCount: events.length,
        timezone: calendarData.timezone,
      },
      { source: 'web_app' },
    );
  }, [calendarData.timezone, events.length]);

  const handleCreateEvent = useCallback(() => {
    analytics.track('web_community_event_create_intent', {}, { source: 'web_app' });
    if (typeof window !== 'undefined') {
      window.open('mailto:community@gigvora.com?subject=Community%20event%20request', '_blank', 'noopener');
    }
  }, []);

  const handleSelectEvent = useCallback(
    (event) => {
      if (!event?.id) {
        return;
      }
      if (eventAbortRef.current) {
        eventAbortRef.current.abort();
      }
      const controller = new AbortController();
      eventAbortRef.current = controller;
      setEventModalOpen(true);
      setSelectedEvent(event);
      setEventBusy(true);
      setEventError(null);

      fetchCommunityEvent(event.id, { timezone: calendarData.timezone, signal: controller.signal })
        .then((response) => {
          if (controller.signal.aborted) {
            return;
          }
          setSelectedEvent((previous) => ({
            ...(previous ?? {}),
            ...(response ?? {}),
          }));
          analytics.track(
            'web_community_event_opened',
            {
              eventId: event.id,
              title: event.title,
            },
            { source: 'web_app' },
          );
        })
        .catch((error) => {
          if (controller.signal.aborted) {
            return;
          }
          const message = error?.body?.message ?? error?.message ?? 'We could not load this event at the moment.';
          setEventError(message);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setEventBusy(false);
          }
        });
    },
    [calendarData.timezone],
  );

  const handleCloseModal = useCallback(() => {
    eventAbortRef.current?.abort();
    setEventModalOpen(false);
    setSelectedEvent(null);
    setEventError(null);
    setEventBusy(false);
  }, []);

  const handleRsvp = useCallback((event) => {
    analytics.track(
      'web_community_event_rsvp_clicked',
      {
        eventId: event?.id,
        title: event?.title,
      },
      { source: 'web_app' },
    );
    if (event?.registrationUrl && typeof window !== 'undefined') {
      window.open(event.registrationUrl, '_blank', 'noopener');
    }
  }, []);

  const handleVolunteer = useCallback((event) => {
    analytics.track(
      'web_community_event_volunteer_clicked',
      {
        eventId: event?.id,
        title: event?.title,
      },
      { source: 'web_app' },
    );
  }, []);

  const handleAddToCalendar = useCallback((event) => {
    analytics.track(
      'web_community_event_add_to_calendar',
      {
        eventId: event?.id,
        title: event?.title,
      },
      { source: 'web_app' },
    );
  }, []);

  const handleShare = useCallback((event) => {
    analytics.track(
      'web_community_event_share_clicked',
      {
        eventId: event?.id,
        title: event?.title,
      },
      { source: 'web_app' },
    );
    if (typeof navigator !== 'undefined' && navigator.share && event?.title) {
      const fallbackUrl = typeof window !== 'undefined' ? window.location.href : undefined;
      navigator.share({
        title: event.title,
        text: event.summary ?? 'Join this Gigvora community experience.',
        url: event.registrationUrl ?? fallbackUrl,
      }).catch(() => {});
    }
  }, []);

  const handleAssignVolunteer = useCallback((volunteer) => {
    analytics.track(
      'web_community_volunteer_assign_clicked',
      {
        volunteerId: volunteer?.id,
        role: volunteer?.role,
      },
      { source: 'web_app' },
    );
  }, []);

  const handleMessageVolunteer = useCallback((volunteer) => {
    analytics.track(
      'web_community_volunteer_message_clicked',
      {
        volunteerId: volunteer?.id,
        role: volunteer?.role,
      },
      { source: 'web_app' },
    );
  }, []);

  const handleViewVolunteer = useCallback((volunteer) => {
    analytics.track(
      'web_community_volunteer_view_profile',
      {
        volunteerId: volunteer?.id,
        role: volunteer?.role,
      },
      { source: 'web_app' },
    );
  }, []);

  const volunteerRosterStories = volunteerData.featuredStories ?? [];

  return (
    <section className="relative overflow-hidden py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_60%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl space-y-14 px-6">
        <PageHeader
          eyebrow="Community"
          title="Mentorship, events & volunteering command center"
          description="Discover mentorship salons, community activations, and mission-ready volunteer crews engineered to rival the polish of LinkedIn and Instagram experiences."
          meta={
            <DataStatus
              loading={calendarLoading}
              error={calendarError ? { message: calendarError } : null}
              lastUpdated={calendarData.generatedAt}
              onRefresh={() => loadCalendar()}
            />
          }
        />

        <div className="space-y-10">
          <EventCalendar
            events={events}
            recommendedEvents={recommendedEvents}
            timezone={calendarData.timezone}
            onSelectEvent={handleSelectEvent}
            onCreateEvent={handleCreateEvent}
            onSyncCalendar={handleSyncCalendar}
            onFilterChange={handleFilterChange}
            userPreferences={preferences}
          />

          <div className="space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Volunteer roster & mission control</h2>
                <p className="text-sm text-slate-500">
                  Deploy high-signal operators across missions, mentorship salons, and accessibility sprints with real-time readiness telemetry.
                </p>
              </div>
              <DataStatus
                loading={volunteerLoading}
                error={volunteerError ? { message: volunteerError } : null}
                lastUpdated={volunteerData.generatedAt}
                onRefresh={loadVolunteerRoster}
                statusLabel="Volunteer telemetry"
              />
            </header>

            <VolunteerRoster
              volunteers={volunteerData.volunteers}
              featuredStories={volunteerRosterStories}
              onAssign={handleAssignVolunteer}
              onMessage={handleMessageVolunteer}
              onViewProfile={handleViewVolunteer}
            />
          </div>
        </div>
      </div>

      <EventDetailModal
        open={eventModalOpen}
        event={selectedEvent}
        onClose={handleCloseModal}
        onRsvp={handleRsvp}
        onVolunteer={handleVolunteer}
        onAddToCalendar={handleAddToCalendar}
        onShare={handleShare}
        busy={eventBusy}
        error={eventError}
      />
    </section>
  );
}
