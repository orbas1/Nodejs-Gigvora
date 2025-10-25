import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Tab, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import CalendarEventForm from './CalendarEventForm.jsx';
import CalendarSettingsForm from './CalendarSettingsForm.jsx';
import CalendarFocusSessionForm from './CalendarFocusSessionForm.jsx';
import CalendarEventList from './CalendarEventList.jsx';
import CalendarWeekStrip from './CalendarWeekStrip.jsx';
import {
  fetchCalendarOverview,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createFocusSession,
  updateFocusSession,
  deleteFocusSession,
  updateCalendarSettings,
} from '../../services/userCalendar.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import {
  buildCalendarExportBlob,
  buildCalendarSummary,
  detectBrowserTimezone,
  downloadCalendarExport,
  moveEventToDate,
} from '../../utils/calendarDashboard.js';

const TABS = [
  { key: 'dates', label: 'Dates', icon: CalendarDaysIcon },
  { key: 'focus', label: 'Focus', icon: ClockIcon },
  { key: 'sync', label: 'Sync', icon: ArrowsRightLeftIcon },
  { key: 'prefs', label: 'Prefs', icon: Cog6ToothIcon },
];

const EVENT_TYPE_LABELS = {
  job_interview: 'Job interview',
  interview: 'Interview',
  project: 'Project date',
  project_milestone: 'Project milestone',
  gig: 'Gig',
  mentorship: 'Mentorship',
  volunteering: 'Volunteering',
  event: 'Event',
  networking: 'Networking',
  wellbeing: 'Wellbeing',
  ritual: 'Ritual',
  deadline: 'Deadline',
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatEventType(value) {
  if (!value) return 'Event';
  if (EVENT_TYPE_LABELS[value]) {
    return EVENT_TYPE_LABELS[value];
  }
  return value
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatMinutesToHours(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return '0m';
  const total = Math.max(0, Number(minutes));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function buildTypeSummary(events) {
  const counts = events.reduce((accumulator, event) => {
    const key = event.eventType || 'other';
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
  return Object.entries(counts)
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .slice(0, 6)
    .map(([key, count]) => ({
      key,
      label: formatEventType(key),
      count,
    }));
}

function normalizeEvents(events) {
  return Array.isArray(events)
    ? events.map((event) => ({
        ...event,
        startsAt: event.startsAt ?? null,
        endsAt: event.endsAt ?? null,
      }))
    : [];
}

function normalizeFocusSessions(sessions) {
  return Array.isArray(sessions)
    ? sessions.map((session) => ({
        ...session,
        startedAt: session.startedAt ?? null,
        endedAt: session.endedAt ?? null,
        durationMinutes: session.durationMinutes ?? null,
      }))
    : [];
}

function integrateInsightsSnapshot(insights) {
  if (!insights) {
    return { events: [], focusSessions: [], integrations: [], settings: null, stats: null };
  }
  return {
    events: normalizeEvents(insights.events),
    focusSessions: normalizeFocusSessions(insights.focus?.sessions),
    integrations: Array.isArray(insights.integrations) ? insights.integrations : [],
    settings: insights.settings ?? null,
    stats: insights.summary ?? null,
  };
}

function formatFocusLabel(value) {
  if (!value) return 'Focus';
  return value
    .toString()
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function resolveIntegrationBadge(status) {
  switch (status) {
    case 'connected':
      return { label: 'Connected', tone: 'bg-emerald-50 text-emerald-700' };
    case 'syncing':
      return { label: 'Syncing', tone: 'bg-blue-50 text-blue-600' };
    case 'error':
      return { label: 'Check', tone: 'bg-rose-50 text-rose-600' };
    default:
      return { label: 'Pending', tone: 'bg-slate-100 text-slate-600' };
  }
}

export default function UserCalendarSection({ userId, insights, canManage = true }) {
  const seededInsights = useMemo(() => integrateInsightsSnapshot(insights), [insights]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState(seededInsights.events);
  const [focusSessions, setFocusSessions] = useState(seededInsights.focusSessions);
  const [integrations, setIntegrations] = useState(seededInsights.integrations);
  const [settings, setSettings] = useState(seededInsights.settings);
  const [detailEvent, setDetailEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingFocusSession, setEditingFocusSession] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showFocusSessionModal, setShowFocusSessionModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [exporting, setExporting] = useState(false);

  const reload = useCallback(
    async (toastMessage) => {
      if (!userId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const overview = await fetchCalendarOverview(userId, {}, { params: { limit: 60 } });
        setEvents(normalizeEvents(overview.events));
        setFocusSessions(normalizeFocusSessions(overview.focusSessions));
        setIntegrations(Array.isArray(overview.integrations) ? overview.integrations : []);
        setSettings(overview.settings ?? null);
        if (toastMessage) {
          setFeedback({ type: 'success', message: toastMessage, timestamp: Date.now() });
        }
      } catch (loadError) {
        console.error('Failed to load calendar overview', loadError);
        setError(loadError?.message ?? 'Unable to load calendar overview.');
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    setEvents(seededInsights.events);
    setFocusSessions(seededInsights.focusSessions);
    setIntegrations(seededInsights.integrations);
    setSettings(seededInsights.settings);
  }, [seededInsights.events, seededInsights.focusSessions, seededInsights.integrations, seededInsights.settings]);

  useEffect(() => {
    if (userId) {
      reload();
    }
  }, [userId, reload]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }
    if (typeof window === 'undefined') {
      return undefined;
    }
    const timeout = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const typeSummary = useMemo(() => buildTypeSummary(events), [events]);
  const totalFocusMinutes = useMemo(
    () => focusSessions.reduce((sum, session) => sum + Number(session.durationMinutes ?? 0), 0),
    [focusSessions],
  );
  const nextEvent = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const aTime = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
    return sorted.find((event) => !event.endsAt || new Date(event.endsAt).getTime() >= Date.now()) ?? null;
  }, [events]);

  const summaryChips = useMemo(() => {
    const connectedIntegrations = integrations.filter((integration) => integration.status === 'connected');
    const summary = buildCalendarSummary(events);
    return [
      {
        label: 'Next',
        value: summary.nextEvent?.startsAt ? formatRelativeTime(summary.nextEvent.startsAt) : 'Open',
      },
      {
        label: 'Focus',
        value: formatMinutesToHours(totalFocusMinutes),
      },
      {
        label: 'Sync',
        value: `${connectedIntegrations.length}/${integrations.length}`,
      },
      {
        label: 'Total',
        value: summary.total,
      },
    ];
  }, [events, integrations, totalFocusMinutes]);

  const focusSessionsSorted = useMemo(() => {
    return [...focusSessions].sort((a, b) => {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [focusSessions]);

  const handleCreateEvent = useCallback(
    async (payload) => {
      if (!userId) return;
      setSaving(true);
      try {
        const created = await createCalendarEvent(userId, payload);
        setEvents((previous) => normalizeEvents([...previous, created]));
        setFeedback({ type: 'success', message: 'Event saved', timestamp: Date.now() });
        setShowEventModal(false);
        setEditingEvent(null);
        await reload();
      } finally {
        setSaving(false);
      }
    },
    [reload, userId],
  );

  const handleUpdateEvent = useCallback(
    async (payload) => {
      if (!userId || !editingEvent) return;
      setSaving(true);
      try {
        const updated = await updateCalendarEvent(userId, editingEvent.id, payload);
        setEvents((previous) => normalizeEvents(previous.map((event) => (event.id === updated.id ? { ...event, ...updated } : event))));
        setFeedback({ type: 'success', message: 'Event updated', timestamp: Date.now() });
        setShowEventModal(false);
        setEditingEvent(null);
        await reload();
      } finally {
        setSaving(false);
      }
    },
    [editingEvent, reload, userId],
  );

  const handleDeleteEvent = useCallback(
    async (event) => {
      if (!userId || !event?.id) return;
      if (!window.confirm('Delete this calendar event?')) {
        return;
      }
      setSaving(true);
      try {
        await deleteCalendarEvent(userId, event.id);
        setEvents((previous) => previous.filter((item) => item.id !== event.id));
        setFeedback({ type: 'success', message: 'Event removed', timestamp: Date.now() });
        await reload();
      } finally {
        setSaving(false);
      }
    },
    [reload, userId],
  );

  const handleFocusSessionSubmit = useCallback(
    async (payload) => {
      if (!userId) return;
      setSaving(true);
      try {
        if (editingFocusSession?.id) {
          const updated = await updateFocusSession(userId, editingFocusSession.id, payload);
          setFocusSessions((previous) =>
            normalizeFocusSessions(previous.map((session) => (session.id === updated.id ? { ...session, ...updated } : session))),
          );
          setFeedback({ type: 'success', message: 'Focus updated', timestamp: Date.now() });
        } else {
          const created = await createFocusSession(userId, payload);
          setFocusSessions((previous) => normalizeFocusSessions([...previous, created]));
          setFeedback({ type: 'success', message: 'Focus logged', timestamp: Date.now() });
        }
        setShowFocusSessionModal(false);
        setEditingFocusSession(null);
        await reload();
      } finally {
        setSaving(false);
      }
    },
    [editingFocusSession, reload, userId],
  );

  const handleDeleteFocusSession = useCallback(
    async (session) => {
      if (!userId || !session?.id) return;
      if (!window.confirm('Delete this focus session?')) {
        return;
      }
      setSaving(true);
      try {
        await deleteFocusSession(userId, session.id);
        setFocusSessions((previous) => previous.filter((item) => item.id !== session.id));
        setFeedback({ type: 'success', message: 'Focus removed', timestamp: Date.now() });
        await reload();
      } finally {
        setSaving(false);
      }
    },
    [reload, userId],
  );

  const handleSettingsSubmit = useCallback(
    async (payload) => {
      if (!userId) return;
      setSaving(true);
      try {
        const updated = await updateCalendarSettings(userId, payload);
        setSettings(updated);
        setFeedback({ type: 'success', message: 'Settings saved', timestamp: Date.now() });
        setShowSettingsModal(false);
      } finally {
        setSaving(false);
      }
    },
    [userId],
  );

  const timezone = useMemo(() => settings?.timezone ?? detectBrowserTimezone(), [settings?.timezone]);

  const handleExportCalendar = useCallback(() => {
    if (!events.length) {
      setFeedback({ type: 'info', message: 'No events to export yet', timestamp: Date.now() });
      return;
    }

    setExporting(true);
    try {
      const blob = buildCalendarExportBlob(events, {
        calendarName: 'Gigvora personal schedule',
        description: 'Calendar export from the Gigvora user dashboard',
        timezone,
        source: `user-${userId ?? 'anonymous'}`,
      });
      const filename = `gigvora-user-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
      downloadCalendarExport(blob, filename);
      setFeedback({ type: 'success', message: 'Calendar export ready', timestamp: Date.now() });
    } catch (exportError) {
      console.error('Failed to export calendar', exportError);
      setFeedback({ type: 'error', message: exportError?.message ?? 'Unable to export calendar', timestamp: Date.now() });
    } finally {
      setExporting(false);
    }
  }, [events, timezone, userId]);

  const handleDropEvent = useCallback(
    async ({ eventId, date }) => {
      if (!userId || !eventId || !date) {
        return;
      }
      const targetEvent = events.find((candidate) => String(candidate.id) === String(eventId));
      if (!targetEvent) {
        return;
      }
      setSaving(true);
      try {
        const { startsAt, endsAt } = moveEventToDate(targetEvent, date);
        if (!startsAt) {
          return;
        }
        await updateCalendarEvent(userId, targetEvent.id, {
          startsAt,
          ...(targetEvent.endsAt ? { endsAt } : {}),
        });
        setEvents((previous) =>
          normalizeEvents(
            previous.map((event) => (event.id === targetEvent.id ? { ...event, startsAt, endsAt } : event)),
          ),
        );
        setFeedback({ type: 'success', message: 'Event rescheduled', timestamp: Date.now() });
        await reload();
      } catch (dropError) {
        console.error('Failed to reschedule event', dropError);
        setFeedback({ type: 'error', message: dropError?.message ?? 'Unable to reschedule', timestamp: Date.now() });
      } finally {
        setSaving(false);
      }
    },
    [events, reload, userId],
  );

  return (
    <section id="calendar-operations" className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-900">Schedule</h3>
          <div className="flex flex-wrap gap-2">
            {summaryChips.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                <span>{chip.label}</span>
                <span className="text-sm text-slate-900">{chip.value}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => reload('Calendar refreshed')}
            disabled={loading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            title="Refresh"
          >
            <ArrowPathIcon className={classNames('h-5 w-5', loading ? 'animate-spin' : '')} />
            <span className="sr-only">Refresh</span>
          </button>
          {canManage ? (
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setShowEventModal(true);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              title="New event"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="sr-only">New event</span>
            </button>
          ) : null}
          {canManage ? (
            <button
              type="button"
              onClick={() => {
                setEditingFocusSession(null);
                setShowFocusSessionModal(true);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              title="Log focus"
            >
              <ClockIcon className="h-5 w-5" />
              <span className="sr-only">Log focus</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            title="Preferences"
          >
            <Cog6ToothIcon className="h-5 w-5" />
            <span className="sr-only">Preferences</span>
          </button>
          <Link
            to="/dashboard/user/calendar"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            title="Open page"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
            <span className="sr-only">Open full calendar page</span>
          </Link>
          <button
            type="button"
            onClick={handleExportCalendar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            title="Export calendar"
            disabled={exporting}
          >
            <ArrowTopRightOnSquareIcon className={classNames('h-5 w-5', exporting ? 'animate-pulse' : '')} />
            <span className="sr-only">Export calendar events</span>
          </button>
        </div>
      </div>

      {feedback ? (
        <div
          className={classNames(
            'mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-700'
              : feedback.type === 'info'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-emerald-50 text-emerald-700',
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <ExclamationTriangleIcon className="h-5 w-5" />
          {error}
        </div>
      ) : null}

      <Tab.Group>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <Tab.List className="flex w-full gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 lg:w-48 lg:flex-col">
            {TABS.map((tab) => (
              <Tab
                key={tab.key}
                className={({ selected }) =>
                  classNames(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    selected ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )
                }
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="flex-1">
            <Tab.Panel className="space-y-6">
              <CalendarWeekStrip events={events} onSelect={setDetailEvent} enableDrop={canManage} onDropEvent={handleDropEvent} />

              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                {typeSummary.length ? (
                  <div className="flex flex-wrap gap-2">
                    {typeSummary.map((type) => (
                      <span
                        key={type.key}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        <span>{type.label}</span>
                        <span className="text-sm text-slate-900">{type.count}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4">
                  <CalendarEventList
                    events={events}
                    onEdit={canManage ? (event) => {
                      setEditingEvent(event);
                      setShowEventModal(true);
                    } : undefined}
                    onDelete={canManage ? handleDeleteEvent : undefined}
                    onSelect={setDetailEvent}
                    onEventDragStart={canManage ? () => setFeedback(null) : undefined}
                    onEventDragEnd={canManage ? () => null : undefined}
                    enableDrag={canManage}
                    emptyMessage={loading ? 'Loading events…' : 'No events yet. Add one to get started.'}
                  />
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Sessions</h4>
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFocusSession(null);
                        setShowFocusSessionModal(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      <PlusIcon className="h-4 w-4" /> New
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 space-y-3">
                  {focusSessionsSorted.length ? (
                    focusSessionsSorted.map((session) => (
                      <div key={session.id ?? session.startedAt} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{formatFocusLabel(session.focusType)}</p>
                          <p className="text-xs text-slate-500">
                            {session.startedAt ? formatRelativeTime(session.startedAt) : 'Planned'}
                          </p>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {session.completed ? 'Done' : 'Planned'} · {formatMinutesToHours(session.durationMinutes)}
                        </p>
                        {session.notes ? <p className="mt-2 text-xs text-slate-500">{session.notes}</p> : null}
                        {canManage ? (
                          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFocusSession(session);
                                setShowFocusSessionModal(true);
                              }}
                              className="font-semibold text-accent hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFocusSession(session)}
                              className="font-semibold text-rose-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      Log focus time to track preparation and wellbeing.
                    </p>
                  )}
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Connections</h4>
                  <button
                    type="button"
                    onClick={() => reload('Sync status updated')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin' : '')} /> Refresh
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {integrations.length ? (
                    integrations.map((integration) => {
                      const badge = resolveIntegrationBadge(integration.status);
                      return (
                        <article
                          key={`${integration.providerKey ?? integration.provider}-${integration.id ?? integration.primaryCalendar ?? 'integration'}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {integration.providerName ?? integration.provider ?? 'Calendar'}
                            </p>
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge.tone}`}>{badge.label}</span>
                          </div>
                          <dl className="mt-3 space-y-1 text-xs text-slate-500">
                            {integration.primaryCalendar ? (
                              <div className="flex items-center justify-between">
                                <dt>Primary</dt>
                                <dd className="font-semibold text-slate-700">{integration.primaryCalendar}</dd>
                              </div>
                            ) : null}
                            {integration.connectedAt ? (
                              <div className="flex items-center justify-between">
                                <dt>Since</dt>
                                <dd>{formatAbsolute(integration.connectedAt, { dateStyle: 'medium' })}</dd>
                              </div>
                            ) : null}
                            {integration.lastSyncedAt ? (
                              <div className="flex items-center justify-between">
                                <dt>Last sync</dt>
                                <dd>{formatRelativeTime(integration.lastSyncedAt)}</dd>
                              </div>
                            ) : null}
                          </dl>
                        </article>
                      );
                    })
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      Connect Google, Outlook, or other calendars to sync your dates.
                    </p>
                  )}
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Working setup</h4>
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      <Cog6ToothIcon className="h-4 w-4" /> Edit
                    </button>
                  ) : null}
                </div>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-slate-600">
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Timezone</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{settings?.timezone ?? 'UTC'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Working hours</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {formatMinutesToHours(settings?.workStartMinutes ?? 480)} – {formatMinutesToHours(settings?.workEndMinutes ?? 1020)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Reminder</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {settings?.defaultReminderMinutes == null ? 'None' : `${settings.defaultReminderMinutes} min`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Availability</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{settings?.shareAvailability ? 'Shared' : 'Private'}</dd>
                  </div>
                </dl>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </div>
      </Tab.Group>

      <Transition appear show={showEventModal} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => (saving ? null : setShowEventModal(false))}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-2"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {editingEvent ? 'Edit event' : 'New event'}
                  </Dialog.Title>
                  <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1">
                    <CalendarEventForm
                      initialEvent={editingEvent}
                      onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
                      onCancel={() => {
                        if (!saving) {
                          setShowEventModal(false);
                          setEditingEvent(null);
                        }
                      }}
                      busy={saving}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={showFocusSessionModal} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => (saving ? null : setShowFocusSessionModal(false))}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-2"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {editingFocusSession ? 'Edit focus session' : 'Log focus session'}
                  </Dialog.Title>
                  <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
                    <CalendarFocusSessionForm
                      initialSession={editingFocusSession}
                      onSubmit={handleFocusSessionSubmit}
                      onCancel={() => {
                        if (!saving) {
                          setShowFocusSessionModal(false);
                          setEditingFocusSession(null);
                        }
                      }}
                      busy={saving}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={showSettingsModal} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => (saving ? null : setShowSettingsModal(false))}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-2"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Preferences</Dialog.Title>
                  <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1">
                    <CalendarSettingsForm
                      initialSettings={settings}
                      onSubmit={handleSettingsSubmit}
                      onCancel={() => {
                        if (!saving) {
                          setShowSettingsModal(false);
                        }
                      }}
                      busy={saving}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={Boolean(detailEvent)} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => setDetailEvent(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-2"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Event</Dialog.Title>
                  {detailEvent ? (
                    <div className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase text-slate-400">Title</dt>
                        <dd className="mt-1 font-semibold text-slate-900">{detailEvent.title}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-slate-400">Type</dt>
                        <dd className="mt-1 font-semibold text-slate-900">{formatEventType(detailEvent.eventType)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-slate-400">Starts</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {detailEvent.startsAt ? formatAbsolute(detailEvent.startsAt) : 'Scheduled'}
                        </dd>
                      </div>
                      {detailEvent.endsAt ? (
                        <div>
                          <dt className="text-xs uppercase text-slate-400">Ends</dt>
                          <dd className="mt-1 font-semibold text-slate-900">{formatAbsolute(detailEvent.endsAt)}</dd>
                        </div>
                      ) : null}
                      {detailEvent.location ? (
                        <div className="sm:col-span-2">
                          <dt className="text-xs uppercase text-slate-400">Location</dt>
                          <dd className="mt-1 font-semibold text-slate-900">{detailEvent.location}</dd>
                        </div>
                      ) : null}
                      {detailEvent.description ? (
                        <div className="sm:col-span-2">
                          <dt className="text-xs uppercase text-slate-400">Notes</dt>
                          <dd className="mt-1 text-slate-700">{detailEvent.description}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="text-xs uppercase text-slate-400">Visibility</dt>
                        <dd className="mt-1 font-semibold text-slate-900">{detailEvent.visibility ?? 'Private'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-slate-400">Reminder</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {detailEvent.reminderMinutes == null ? 'Off' : `${detailEvent.reminderMinutes} min`}
                        </dd>
                      </div>
                      {detailEvent.relatedEntityType ? (
                        <div className="sm:col-span-2">
                          <dt className="text-xs uppercase text-slate-400">Linked</dt>
                          <dd className="mt-1 font-semibold text-slate-900">
                            {formatEventType(detailEvent.relatedEntityType)}
                            {detailEvent.relatedEntityId ? ` #${detailEvent.relatedEntityId}` : ''}
                          </dd>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-6 text-right">
                    <button
                      type="button"
                      onClick={() => setDetailEvent(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </section>
  );
}
