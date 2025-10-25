import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AgencyDashboardLayout from './AgencyDashboardLayout.jsx';
import AgencyCalendarEventForm from '../../../components/agency/calendar/AgencyCalendarEventForm.jsx';
import AgencyCalendarEventDrawer from '../../../components/agency/calendar/AgencyCalendarEventDrawer.jsx';
import AgencyCalendarFilters from '../../../components/agency/calendar/AgencyCalendarFilters.jsx';
import AgencyCalendarSummary from '../../../components/agency/calendar/AgencyCalendarSummary.jsx';
import AgencyCalendarMonthView from '../../../components/agency/calendar/AgencyCalendarMonthView.jsx';
import AgencyCalendarTimelineView from '../../../components/agency/calendar/AgencyCalendarTimelineView.jsx';
import AgencyCalendarTypeBoard from '../../../components/agency/calendar/AgencyCalendarTypeBoard.jsx';
import {
  fetchAgencyCalendar,
  createAgencyCalendarEvent,
  updateAgencyCalendarEvent,
  deleteAgencyCalendarEvent,
} from '../../../services/agency.js';
import { buildCalendarExportBlob, detectBrowserTimezone, downloadCalendarExport } from '../../../utils/calendarDashboard.js';

const EVENT_TYPE_ORDER = ['project', 'gig', 'interview', 'mentorship', 'volunteering'];

const EVENT_TYPE_LABELS = {
  project: 'Projects',
  gig: 'Gigs',
  interview: 'Interviews',
  mentorship: 'Mentors',
  volunteering: 'Volunteers',
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'planned', label: 'Planned' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'tentative', label: 'Tentative' },
  { value: 'completed', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

const VIEW_OPTIONS = [
  { id: 'month', label: 'Month' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'types', label: 'Types' },
];

function toDateInput(date) {
  if (!date) {
    return '';
  }
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return '';
  }
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function toIsoDate(value, endOfDay = false) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date.toISOString();
}

function startOfCurrentMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function groupEvents(events = []) {
  const groups = new Map();
  events.forEach((event) => {
    const key = event.startsAt ? toDateInput(event.startsAt) : 'unscheduled';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(event);
  });

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'unscheduled') return 1;
    if (b === 'unscheduled') return -1;
    return a.localeCompare(b);
  });

  return sortedKeys.map((key) => ({
    key,
    label: key === 'unscheduled'
      ? 'Unscheduled'
      : new Intl.DateTimeFormat(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).format(new Date(key)),
    events: groups.get(key).sort((a, b) => {
      if (!a.startsAt) return 1;
      if (!b.startsAt) return -1;
      return new Date(a.startsAt) - new Date(b.startsAt);
    }),
  }));
}

function buildDefaultTypeFilters() {
  return EVENT_TYPE_ORDER.reduce((acc, type) => {
    acc[type] = true;
    return acc;
  }, {});
}

const DEFAULT_FILTERS = {
  types: buildDefaultTypeFilters(),
  status: 'active',
  from: toDateInput(startOfCurrentMonth()),
  to: toDateInput(addDays(startOfCurrentMonth(), 60)),
};

function buildEventsByDay(events = []) {
  const map = new Map();
  events.forEach((event) => {
    if (!event.startsAt) {
      return;
    }
    const key = toDateInput(event.startsAt);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(event);
  });
  return map;
}

export default function AgencyCalendarPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [workspace, setWorkspace] = useState(null);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({});
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeView, setActiveView] = useState('month');
  const [monthCursor, setMonthCursor] = useState(() => startOfCurrentMonth());
  const [exporting, setExporting] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const activeTypes = useMemo(() => {
    return Object.entries(filters.types ?? {})
      .filter(([, enabled]) => enabled)
      .map(([type]) => type);
  }, [filters.types]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAgencyCalendar({
        workspaceId: workspace?.id,
        workspaceSlug: workspace?.slug,
        types: activeTypes,
        status: filters.status === 'all' ? undefined : filters.status,
        from: toIsoDate(filters.from, false),
        to: toIsoDate(filters.to, true),
      });

      setWorkspace(response.workspace ?? null);
      setEvents(response.events ?? []);
      setSummary(response.summary ?? {});
      setCollaborators(response.collaborators ?? []);
    } catch (err) {
      setError(err?.message || 'Unable to load schedule.');
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, workspace?.slug, activeTypes, filters.status, filters.from, filters.to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return undefined;
    }
    const interval = setInterval(() => {
      fetchData();
    }, 60_000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchData]);

  const groupedEvents = useMemo(() => groupEvents(events), [events]);
  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((event) => event?.startsAt)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 3);
  }, [events]);
  const eventsByDay = useMemo(() => buildEventsByDay(events), [events]);
  const calendarTimezone = useMemo(() => workspace?.timezone ?? detectBrowserTimezone(), [workspace?.timezone]);

  const handleExportCalendar = useCallback(() => {
    setExporting(true);
    try {
      if (!events.length) {
        return;
      }
      const blob = buildCalendarExportBlob(events, {
        calendarName: `${workspace?.name ?? 'Agency'} schedule`,
        description: 'Gigvora agency calendar export',
        timezone: calendarTimezone,
        source: `agency-${workspace?.id ?? 'workspace'}`,
      });
      const filename = `gigvora-agency-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
      downloadCalendarExport(blob, filename);
    } catch (error) {
      console.error('Unable to export calendar', error);
    } finally {
      setExporting(false);
    }
  }, [calendarTimezone, events, workspace?.id, workspace?.name]);

  const handleTypeToggle = (type) => {
    setFilters((prev) => {
      const next = { ...prev.types, [type]: !prev.types?.[type] };
      const enabledCount = Object.values(next).filter(Boolean).length;
      if (enabledCount === 0) {
        return prev;
      }
      return { ...prev, types: next };
    });
  };

  const handleStatusChange = (value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleDateChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetTypes = () => {
    setFilters((prev) => ({ ...prev, types: buildDefaultTypeFilters() }));
  };

  const openCreateForm = () => {
    setEditingEvent(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleEventSaved = async (payload) => {
    setFormBusy(true);
    setFormError(null);
    try {
      if (editingEvent?.id) {
        await updateAgencyCalendarEvent(editingEvent.id, {
          ...payload,
          workspaceId: workspace?.id,
          workspaceSlug: workspace?.slug,
        });
      } else {
        await createAgencyCalendarEvent({
          ...payload,
          workspaceId: workspace?.id,
          workspaceSlug: workspace?.slug,
        });
      }
      setFormOpen(false);
      setEditingEvent(null);
      await fetchData();
    } catch (err) {
      setFormError(err?.message || 'Unable to save event.');
    } finally {
      setFormBusy(false);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!event?.id) {
      return;
    }
    const confirmed = window.confirm('Remove this entry?');
    if (!confirmed) {
      return;
    }
    try {
      await deleteAgencyCalendarEvent(event.id, { workspaceId: workspace?.id, workspaceSlug: workspace?.slug });
      setSelectedEvent(null);
      await fetchData();
    } catch (err) {
      setError(err?.message || 'Unable to delete event.');
    }
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(null);
    setEditingEvent(event);
    setFormError(null);
    setFormOpen(true);
  };

  const handleMonthChange = (nextMonth) => {
    setMonthCursor(nextMonth);
  };

  const renderView = () => {
    if (activeView === 'timeline') {
      return (
        <AgencyCalendarTimelineView
          groupedEvents={groupedEvents}
          onSelect={setSelectedEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      );
    }

    if (activeView === 'types') {
      return (
        <AgencyCalendarTypeBoard
          events={events}
          typeOrder={EVENT_TYPE_ORDER}
          typeLabels={EVENT_TYPE_LABELS}
          onSelect={setSelectedEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      );
    }

    return (
      <AgencyCalendarMonthView
        monthCursor={monthCursor}
        eventsByDay={eventsByDay}
        onSelectEvent={setSelectedEvent}
        onMonthChange={handleMonthChange}
      />
    );
  };

  return (
    <AgencyDashboardLayout activeItem="calendar" title="Schedule" subtitle="Projects, gigs, interviews, mentors, volunteering">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Schedule</h1>
              <p className="mt-1 text-sm text-slate-500">{workspace?.name ?? 'Select a workspace to sync dates.'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {VIEW_OPTIONS.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeView === view.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <AgencyCalendarSummary summary={summary} />
          </div>
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportCalendar}
                disabled={exporting || events.length === 0}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? 'Preparing ICS…' : 'Export ICS'}
              </button>
              <button
                type="button"
                onClick={() => setAutoRefreshEnabled((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  autoRefreshEnabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {autoRefreshEnabled ? 'Auto-refresh on' : 'Auto-refresh off'}
              </button>
            </div>
            <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next up</p>
              {upcomingEvents.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No upcoming events in the selected range.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {upcomingEvents.map((event) => (
                    <li key={event.id ?? event.startsAt} className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900">{event.title ?? 'Untitled event'}</span>
                      <span className="text-xs text-slate-500">
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        }).format(new Date(event.startsAt))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <AgencyCalendarFilters
            filters={filters}
            statusOptions={STATUS_OPTIONS}
            typeOrder={EVENT_TYPE_ORDER}
            typeLabels={EVENT_TYPE_LABELS}
            onStatusChange={handleStatusChange}
            onDateChange={handleDateChange}
            onTypeToggle={handleTypeToggle}
            onResetTypes={handleResetTypes}
            onRefresh={fetchData}
            onCreate={openCreateForm}
            disabled={loading}
          />

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
                Loading…
              </div>
            ) : null}
            {error ? (
              <div className="flex items-center gap-2 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                <ExclamationTriangleIcon className="h-5 w-5" />
                {error}
              </div>
            ) : null}
            {!loading && !error ? renderView() : null}
          </div>
        </div>
      </div>

      <Transition show={formOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => (!formBusy ? setFormOpen(false) : null)}>
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
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="scale-95 opacity-0"
                enterTo="scale-100 opacity-100"
                leave="ease-in duration-150"
                leaveFrom="scale-100 opacity-100"
                leaveTo="scale-95 opacity-0"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {editingEvent ? 'Edit event' : 'New event'}
                  </Dialog.Title>
                  {formError ? (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">{formError}</div>
                  ) : null}
                  <div className="mt-4">
                    <AgencyCalendarEventForm
                      initialEvent={editingEvent}
                      collaborators={collaborators}
                      busy={formBusy}
                      onSubmit={handleEventSaved}
                      onCancel={() => (!formBusy ? setFormOpen(false) : null)}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <AgencyCalendarEventDrawer
        open={Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        collaborators={collaborators}
      />
    </AgencyDashboardLayout>
  );
}
