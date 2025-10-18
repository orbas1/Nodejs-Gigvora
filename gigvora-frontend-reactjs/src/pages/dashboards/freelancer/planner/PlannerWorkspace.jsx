import { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import DataStatus from '../../../../components/DataStatus.jsx';
import useFreelancerCalendar from '../../../../hooks/useFreelancerCalendar.js';
import CalendarEventForm from '../sections/planning/CalendarEventForm.jsx';
import CalendarEventTimeline from '../sections/planning/CalendarEventTimeline.jsx';
import CalendarEventDetailsDrawer from '../sections/planning/CalendarEventDetailsDrawer.jsx';
import {
  DEFAULT_LOOKAHEAD_OPTIONS,
  DEFAULT_LOOKBACK_OPTIONS,
  EVENT_STATUS_OPTIONS,
  EVENT_TYPE_OPTIONS,
  TYPE_COLOR_MAP,
} from '../sections/planning/constants.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (value == null || value === '') {
    return [];
  }
  return [value];
}

function describeNextEvent(event) {
  if (!event) {
    return 'No next milestone yet';
  }
  if (!event.startsAt) {
    return event.title ?? 'Upcoming milestone';
  }
  const start = new Date(event.startsAt);
  return `${event.title ?? 'Upcoming milestone'} · ${start.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export default function PlannerWorkspace({ session }) {
  const freelancerId = session?.id ?? null;
  const memberships = normalizeList(session?.memberships);
  const canManage = memberships.includes('freelancer') || session?.userType === 'freelancer';

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [typeFilters, setTypeFilters] = useState(() => new Set());
  const [statusFilters, setStatusFilters] = useState(() => new Set());
  const [lookbackDays, setLookbackDays] = useState(7);
  const [lookaheadDays, setLookaheadDays] = useState(45);

  const {
    events,
    metrics,
    filters,
    loading,
    error,
    lastUpdated,
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
    setFilters,
  } = useFreelancerCalendar({ freelancerId, enabled: true, lookbackDays, lookaheadDays });

  useEffect(() => {
    setTypeFilters(new Set(normalizeList(filters?.types)));
    setStatusFilters(new Set(normalizeList(filters?.statuses)));
  }, [filters?.types, filters?.statuses]);

  const [googleSync, setGoogleSync] = useState(true);
  const [outlookSync, setOutlookSync] = useState(false);
  const [gigvoraSync, setGigvoraSync] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState('open');
  const [availabilityMessage, setAvailabilityMessage] = useState('Accepting new client launches this quarter.');
  const [availabilityChannels, setAvailabilityChannels] = useState({ referrals: true, guild: true, clients: false });
  const [availabilitySavedAt, setAvailabilitySavedAt] = useState(null);

  const totalEvents = metrics?.total ?? events.length ?? 0;
  const upcomingCount = metrics?.upcomingCount ?? 0;
  const overdueCount = metrics?.overdueCount ?? 0;
  const nextEventDescription = describeNextEvent(metrics?.nextEvent);

  const typeBreakdown = useMemo(() => {
    const counts = metrics?.typeCounts ?? {};
    return EVENT_TYPE_OPTIONS.map((option) => ({
      ...option,
      count: counts[option.value] ?? 0,
    }));
  }, [metrics?.typeCounts]);

  const statusBreakdown = useMemo(() => {
    const counts = metrics?.statusCounts ?? {};
    return EVENT_STATUS_OPTIONS.map((option) => ({
      ...option,
      count: counts[option.value] ?? 0,
    }));
  }, [metrics?.statusCounts]);

  const summaryCards = [
    {
      label: 'Total',
      value: totalEvents,
      caption: `${upcomingCount} upcoming`,
    },
    {
      label: 'Due',
      value: overdueCount,
      caption: overdueCount ? 'Follow-ups needed' : 'All clear',
    },
    {
      label: 'Next',
      value: metrics?.nextEvent?.title ?? 'None',
      caption: nextEventDescription,
    },
  ];

  const timelineEmptyState = (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <CalendarDaysIcon className="h-8 w-8 text-blue-500" />
      </div>
      <p className="text-sm font-semibold text-slate-900">No events in this window.</p>
      <p className="text-sm text-slate-500">Adjust the horizon or add a new schedule block.</p>
      <div className="flex flex-wrap justify-center gap-3">
        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setFormMode('create');
              setSelectedEvent(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <CheckCircleIcon className="h-4 w-4" /> New event
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => refresh({ force: true })}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
        >
          <ArrowPathIcon className="h-4 w-4" /> Refresh
        </button>
      </div>
    </div>
  );

  const handleTimeWindowChange = async (nextLookback, nextLookahead) => {
    setLookbackDays(nextLookback);
    setLookaheadDays(nextLookahead);
    await refresh({ lookbackDays: nextLookback, lookaheadDays: nextLookahead });
  };

  const applyFilters = async (nextTypes, nextStatuses) => {
    const typesPayload = nextTypes.length ? nextTypes : undefined;
    const statusesPayload = nextStatuses.length ? nextStatuses : undefined;
    setFilters({ types: typesPayload, statuses: statusesPayload });
    await refresh({ types: typesPayload, statuses: statusesPayload });
  };

  const toggleTypeFilter = async (value) => {
    const next = new Set(typeFilters);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    const nextArray = Array.from(next);
    setTypeFilters(next);
    await applyFilters(nextArray, Array.from(statusFilters));
  };

  const toggleStatusFilter = async (value) => {
    const next = new Set(statusFilters);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    const nextArray = Array.from(next);
    setStatusFilters(next);
    await applyFilters(Array.from(typeFilters), nextArray);
  };

  const handleResetFilters = async () => {
    setTypeFilters(new Set());
    setStatusFilters(new Set());
    await applyFilters([], []);
  };

  const handleSubmitEvent = async (payload) => {
    setFormSubmitting(true);
    try {
      if (formMode === 'edit' && selectedEvent?.id) {
        await updateEvent(selectedEvent.id, payload, { actorId: session?.id });
      } else {
        await createEvent(payload, { actorId: session?.id });
      }
      await refresh();
      setFormOpen(false);
      setSelectedEvent(null);
      setFormError(null);
    } catch (err) {
      setFormError(err);
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusChange = async (event, nextStatus) => {
    if (!event?.id || !canManage) {
      return;
    }
    setStatusUpdatingId(event.id);
    try {
      await updateEvent(event.id, { status: nextStatus }, { actorId: session?.id });
      await refresh();
    } catch (err) {
      console.error('Unable to update status', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!event?.id || !canManage) {
      return;
    }
    setStatusUpdatingId(event.id);
    try {
      await deleteEvent(event.id, { actorId: session?.id });
      setDetailsEvent(null);
      await refresh();
    } catch (err) {
      console.error('Unable to delete event', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDuplicateEvent = (event) => {
    if (!event) {
      return;
    }
    const startsAt = event.startsAt ? new Date(event.startsAt) : new Date();
    const duplicate = {
      ...event,
      id: undefined,
      title: `${event.title} (copy)`,
      startsAt: new Date(startsAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      endsAt: event.endsAt ? new Date(new Date(event.endsAt).getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
    };
    setSelectedEvent(duplicate);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleAvailabilitySubmit = (event) => {
    event.preventDefault();
    setAvailabilitySavedAt(new Date());
  };

  const availabilityChannelsList = [
    { id: 'referrals', label: 'Referrals' },
    { id: 'guild', label: 'Guild' },
    { id: 'clients', label: 'Clients' },
  ];

  return (
    <div className="bg-slate-50/80">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <DataStatus
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
              statusLabel="Planner sync"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold shadow">
                <ShieldCheckIcon className="h-4 w-4" /> {canManage ? 'Editor access' : 'View only'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold shadow">
                <MegaphoneIcon className="h-4 w-4" /> {availabilityStatus === 'open' ? 'Availability on' : 'Availability off'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold shadow">
                <ClockIcon className="h-4 w-4" /> {lookbackDays}d back · {lookaheadDays}d ahead
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="grid grid-cols-3 gap-3">
              {summaryCards.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  className="flex h-24 flex-col justify-center rounded-3xl border border-slate-200 bg-white px-4 text-left shadow transition hover:border-blue-300 hover:shadow-lg"
                  onClick={() => {
                    if (metrics?.nextEvent && card.label === 'Next') {
                      setDetailsEvent(metrics.nextEvent);
                    }
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</span>
                  <span className="mt-2 text-xl font-semibold text-slate-900">{card.value}</span>
                  <span className="mt-1 text-xs text-slate-500">{card.caption}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              {canManage ? (
                <button
                  type="button"
                  onClick={() => {
                    setFormMode('create');
                    setSelectedEvent(null);
                    setFormOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  <CalendarDaysIcon className="h-4 w-4" /> New event
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => refresh({ force: true })}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                <ArrowPathIcon className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {DEFAULT_LOOKBACK_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTimeWindowChange(option.value, lookaheadDays)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
                      lookbackDays === option.value
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700',
                    )}
                  >
                    <ClockIcon className="h-4 w-4" /> -{option.value}d
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {DEFAULT_LOOKAHEAD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTimeWindowChange(lookbackDays, option.value)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
                      lookaheadDays === option.value
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700',
                    )}
                  >
                    <ClockIcon className="h-4 w-4" /> +{option.value}d
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                <Squares2X2Icon className="h-4 w-4" /> Clear filters
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Types</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {typeBreakdown.map((option) => {
                    const isActive = typeFilters.has(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleTypeFilter(option.value)}
                        className={classNames(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
                          isActive
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700',
                        )}
                      >
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${TYPE_COLOR_MAP[option.value]}20` }}
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: TYPE_COLOR_MAP[option.value] }}
                          />
                        </span>
                        {option.label}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{option.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statuses</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {statusBreakdown.map((option) => {
                    const isActive = statusFilters.has(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleStatusFilter(option.value)}
                        className={classNames(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
                          isActive
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700',
                        )}
                      >
                        {option.label}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{option.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="min-h-[24rem] flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4">
              <CalendarEventTimeline
                events={events}
                onSelectEvent={(event) => setDetailsEvent(event)}
                onEditEvent={(event) => {
                  setSelectedEvent(event);
                  setFormMode('edit');
                  setFormOpen(true);
                }}
                onStatusChange={handleStatusChange}
                canManage={canManage}
                loading={loading}
                emptyState={timelineEmptyState}
                statusUpdatingId={statusUpdatingId}
              />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Sync</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {[
                  { id: 'google', label: 'Google Calendar', value: googleSync, setter: setGoogleSync },
                  { id: 'outlook', label: 'Outlook', value: outlookSync, setter: setOutlookSync },
                  { id: 'gigvora', label: 'Gigvora CRM', value: gigvoraSync, setter: setGigvoraSync },
                ].map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <span>{integration.label}</span>
                    <Switch
                      checked={integration.value}
                      onChange={integration.setter}
                      className={classNames(
                        integration.value ? 'bg-blue-600' : 'bg-slate-300',
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          integration.value ? 'translate-x-5' : 'translate-x-0',
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition',
                        )}
                      />
                    </Switch>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Availability</h3>
                <Switch
                  checked={availabilityStatus === 'open'}
                  onChange={(enabled) => setAvailabilityStatus(enabled ? 'open' : 'closed')}
                  className={classNames(
                    availabilityStatus === 'open' ? 'bg-emerald-500' : 'bg-slate-300',
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={classNames(
                      availabilityStatus === 'open' ? 'translate-x-5' : 'translate-x-0',
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition',
                    )}
                  />
                </Switch>
              </div>

              <form onSubmit={handleAvailabilitySubmit} className="mt-4 space-y-4 text-sm text-slate-600">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="availability-message">
                  Message
                </label>
                <textarea
                  id="availability-message"
                  value={availabilityMessage}
                  onChange={(event) => setAvailabilityMessage(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share to</legend>
                  {availabilityChannelsList.map((channel) => (
                    <label key={channel.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                      <span>{channel.label}</span>
                      <Switch
                        checked={Boolean(availabilityChannels[channel.id])}
                        onChange={(enabled) =>
                          setAvailabilityChannels((current) => ({
                            ...current,
                            [channel.id]: enabled,
                          }))
                        }
                        className={classNames(
                          availabilityChannels[channel.id] ? 'bg-blue-600' : 'bg-slate-300',
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={classNames(
                            availabilityChannels[channel.id] ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition',
                          )}
                        />
                      </Switch>
                    </label>
                  ))}
                </fieldset>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Save availability
                </button>
                {availabilitySavedAt ? (
                  <p className="text-xs text-slate-500">Updated {availabilitySavedAt.toLocaleTimeString()}</p>
                ) : null}
              </form>
            </section>
          </aside>
        </div>
      </div>

      <CalendarEventForm
        open={formOpen}
        mode={formMode}
        initialValues={selectedEvent}
        onSubmit={handleSubmitEvent}
        onClose={() => {
          setFormOpen(false);
          setSelectedEvent(null);
          setFormError(null);
        }}
        submitting={formSubmitting}
        error={formError}
      />

      <CalendarEventDetailsDrawer
        open={Boolean(detailsEvent)}
        event={detailsEvent}
        onClose={() => setDetailsEvent(null)}
        onEdit={(event) => {
          setSelectedEvent(event);
          setFormMode('edit');
          setFormOpen(true);
        }}
        onDelete={handleDeleteEvent}
        onStatusChange={handleStatusChange}
        canManage={canManage}
        statusUpdating={statusUpdatingId === detailsEvent?.id}
        onDuplicate={handleDuplicateEvent}
      />
    </div>
  );
}
