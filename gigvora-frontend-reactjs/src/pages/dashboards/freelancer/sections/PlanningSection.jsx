import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerCalendar from '../../../../hooks/useFreelancerCalendar.js';
import {
  EVENT_TYPE_OPTIONS,
  EVENT_STATUS_OPTIONS,
  TYPE_COLOR_MAP,
  DEFAULT_LOOKBACK_OPTIONS,
  DEFAULT_LOOKAHEAD_OPTIONS,
} from './planning/constants.js';
import CalendarEventTimeline from './planning/CalendarEventTimeline.jsx';
import CalendarEventForm from './planning/CalendarEventForm.jsx';
import CalendarEventDetailsDrawer from './planning/CalendarEventDetailsDrawer.jsx';

const INITIAL_LOOKBACK_DAYS = 7;
const INITIAL_LOOKAHEAD_DAYS = 45;

function formatEventTime(event) {
  if (!event?.startsAt) {
    return 'No time set';
  }
  const start = new Date(event.startsAt);
  return start.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PlanningSection({ freelancerId: explicitFreelancerId = null }) {
  const { session } = useSession();
  const freelancerId = explicitFreelancerId ?? session?.id ?? null;

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lookbackWindow, setLookbackWindow] = useState(INITIAL_LOOKBACK_DAYS);
  const [lookaheadWindow, setLookaheadWindow] = useState(INITIAL_LOOKAHEAD_DAYS);
  const [refreshingFilters, setRefreshingFilters] = useState(false);
  const [filterError, setFilterError] = useState(null);

  const {
    events,
    metrics,
    loading,
    error,
    lastUpdated,
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useFreelancerCalendar({
    freelancerId,
    enabled: Boolean(freelancerId),
    lookbackDays: lookbackWindow,
    lookaheadDays: lookaheadWindow,
  });

  const canManage = Boolean(freelancerId);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeEvent, setActiveEvent] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const filtersBusy = loading || refreshingFilters;

  const totalEvents = Array.isArray(events) ? events.length : 0;

  const summary = useMemo(
    () => [
      {
        label: 'Next',
        value: metrics?.nextEvent?.title ?? 'None scheduled',
        caption: metrics?.nextEvent ? formatEventTime(metrics.nextEvent) : 'Add your next booking',
      },
      {
        label: 'Total',
        value: metrics?.total ?? totalEvents,
        caption: `${metrics?.upcomingCount ?? 0} upcoming`,
      },
      {
        label: 'Due',
        value: metrics?.overdueCount ?? 0,
        caption: metrics?.overdueCount ? 'Action required' : 'All clear',
      },
    ],
    [metrics?.nextEvent, metrics?.overdueCount, metrics?.total, metrics?.upcomingCount, totalEvents],
  );

  const typeChips = useMemo(() => {
    const counts = metrics?.typeCounts ?? {};
    return EVENT_TYPE_OPTIONS.map((option) => ({
      ...option,
      count: counts[option.value] ?? 0,
    })).filter((option) => option.count > 0);
  }, [metrics?.typeCounts]);

  const typeFilterOptions = useMemo(
    () => [{ value: 'all', label: 'All types' }, ...EVENT_TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))],
    [],
  );

  const statusFilterOptions = useMemo(
    () => [{ value: 'all', label: 'All statuses' }, ...EVENT_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))],
    [],
  );

  const handleFilterChange = useCallback(
    async ({ nextType = typeFilter, nextStatus = statusFilter, nextLookback = lookbackWindow, nextLookahead = lookaheadWindow } = {}) => {
      if (
        nextType === typeFilter &&
        nextStatus === statusFilter &&
        nextLookback === lookbackWindow &&
        nextLookahead === lookaheadWindow
      ) {
        return;
      }

      setRefreshingFilters(true);
      setFilterError(null);
      try {
        await refresh({
          types: nextType === 'all' ? undefined : [nextType],
          statuses: nextStatus === 'all' ? undefined : [nextStatus],
          lookbackDays: nextLookback,
          lookaheadDays: nextLookahead,
        });
        setTypeFilter(nextType);
        setStatusFilter(nextStatus);
        setLookbackWindow(nextLookback);
        setLookaheadWindow(nextLookahead);
      } catch (err) {
        setFilterError(err instanceof Error ? err.message : 'Unable to update calendar filters.');
      } finally {
        setRefreshingFilters(false);
      }
    },
    [refresh, typeFilter, statusFilter, lookbackWindow, lookaheadWindow],
  );

  const resetFilters = useCallback(() => {
    handleFilterChange({
      nextType: 'all',
      nextStatus: 'all',
      nextLookback: INITIAL_LOOKBACK_DAYS,
      nextLookahead: INITIAL_LOOKAHEAD_DAYS,
    });
  }, [handleFilterChange]);

  const handleOpenCreate = useCallback(() => {
    setFormMode('create');
    setActiveEvent(null);
    setFormError(null);
    setFormOpen(true);
  }, []);

  const handleEditEvent = useCallback((event) => {
    setFormMode('edit');
    setActiveEvent(event);
    setFormError(null);
    setFormOpen(true);
  }, []);

  const handleDuplicateEvent = useCallback((event) => {
    if (!event) {
      return;
    }
    const { id, createdAt, updatedAt, ...rest } = event;
    setFormMode('create');
    setActiveEvent({
      ...rest,
      title: `${event.title} (copy)`,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
    });
    setFormError(null);
    setFormOpen(true);
  }, []);

  const handleSubmitEvent = useCallback(
    async (payload) => {
      if (!canManage) {
        const message = 'Switch to your freelancer workspace to manage the planner.';
        setFormError(message);
        throw new Error(message);
      }
      setSubmitting(true);
      setFormError(null);
      try {
        if (formMode === 'edit' && activeEvent?.id) {
          await updateEvent(activeEvent.id, payload);
        } else {
          await createEvent(payload);
        }
        setFormOpen(false);
        setActiveEvent(null);
        setActionError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to save event.';
        setFormError(message);
        throw new Error(message);
      } finally {
        setSubmitting(false);
      }
    },
    [activeEvent, canManage, createEvent, formMode, updateEvent],
  );

  const handleDeleteEvent = useCallback(
    async (event) => {
      if (!event?.id) {
        return;
      }
      if (!canManage) {
        setActionError('Switch to your freelancer workspace to manage the planner.');
        return;
      }
      setActionError(null);
      try {
        await deleteEvent(event.id);
        setDetailsOpen(false);
        setDetailsEvent(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to remove calendar event.';
        setActionError(message);
      }
    },
    [canManage, deleteEvent],
  );

  const handleStatusChange = useCallback(
    async (event, nextStatus) => {
      if (!event?.id || !canManage) {
        return;
      }
      setStatusUpdatingId(event.id);
      setActionError(null);
      try {
        await updateEvent(event.id, { status: nextStatus });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to update event status.';
        setActionError(message);
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [canManage, updateEvent],
  );

  const handleSelectEvent = useCallback((event) => {
    setDetailsEvent(event);
    setDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    if (statusUpdatingId) {
      return;
    }
    setDetailsOpen(false);
    setDetailsEvent(null);
  }, [statusUpdatingId]);

  return (
    <SectionShell
      id="planning"
      title="Planner"
      description="Fast access to the next interviews, gigs, mentorship, and volunteering commitments."
      actions={[
        <Link
          key="planner"
          to="/dashboard/freelancer/planner"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          Open planner <ArrowRightIcon className="h-4 w-4" />
        </Link>,
        <button
          key="new"
          type="button"
          onClick={handleOpenCreate}
          disabled={!canManage}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          <PlusIcon className="h-4 w-4" /> New event
        </button>,
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <DataStatus
                loading={loading || refreshingFilters}
                error={error}
                lastUpdated={lastUpdated}
                statusLabel="Planner snapshot"
                onRefresh={() => refresh({ force: true })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <label className="flex items-center gap-2 text-slate-500">
                Type
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    handleFilterChange({ nextType: event.target.value })
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 focus:border-slate-400 focus:outline-none"
                  disabled={filtersBusy}
                >
                  {typeFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-slate-500">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    handleFilterChange({ nextStatus: event.target.value })
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 focus:border-slate-400 focus:outline-none"
                  disabled={filtersBusy}
                >
                  {statusFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-slate-500">
                Past
                <select
                  value={lookbackWindow}
                  onChange={(event) =>
                    handleFilterChange({ nextLookback: Number(event.target.value) })
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 focus:border-slate-400 focus:outline-none"
                  disabled={filtersBusy}
                >
                  {[...new Set([INITIAL_LOOKBACK_DAYS, ...DEFAULT_LOOKBACK_OPTIONS])]
                    .sort((a, b) => a - b)
                    .map((option) => (
                      <option key={option} value={option}>
                        {option} days
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-slate-500">
                Next
                <select
                  value={lookaheadWindow}
                  onChange={(event) =>
                    handleFilterChange({ nextLookahead: Number(event.target.value) })
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 focus:border-slate-400 focus:outline-none"
                  disabled={filtersBusy}
                >
                  {[...new Set([INITIAL_LOOKAHEAD_DAYS, ...DEFAULT_LOOKAHEAD_OPTIONS])]
                    .sort((a, b) => a - b)
                    .map((option) => (
                      <option key={option} value={option}>
                        {option} days
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  filtersBusy ||
                  (typeFilter === 'all' &&
                    statusFilter === 'all' &&
                    lookbackWindow === INITIAL_LOOKBACK_DAYS &&
                    lookaheadWindow === INITIAL_LOOKAHEAD_DAYS)
                }
              >
                Reset
              </button>
            </div>
          </div>
          {filterError ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              {filterError}
            </div>
          ) : null}
            <div className="grid grid-cols-3 gap-3">
              {summary.map((card) => (
                <div
                  key={card.label}
                  className="flex h-24 flex-col justify-center rounded-3xl border border-slate-200 bg-slate-50/70 px-4 text-left"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</span>
                  <span className="mt-2 text-xl font-semibold text-slate-900">{card.value}</span>
                  <span className="mt-1 text-xs text-slate-500">{card.caption}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <CalendarDaysIcon className="h-4 w-4" /> Upcoming
            </p>
          {actionError ? (
            <div className="flex items-center gap-2 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>{actionError}</span>
            </div>
          ) : null}
          <CalendarEventTimeline
            events={events}
            loading={loading || refreshingFilters}
            canManage={canManage}
            onSelectEvent={handleSelectEvent}
            onEditEvent={handleEditEvent}
            onStatusChange={handleStatusChange}
            statusUpdatingId={statusUpdatingId}
              emptyState={
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No upcoming items. Add your next milestone from the planner.
                </div>
              }
            />
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ClockIcon className="h-4 w-4" /> Focus areas
          </p>
          {typeChips.length ? (
            <div className="flex flex-wrap gap-2">
              {typeChips.map((chip) => (
                <span
                  key={chip.value}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: TYPE_COLOR_MAP[chip.value] ?? '#64748b' }}
                  />
                  {chip.label}
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-slate-500">{chip.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recent activity captured yet.</p>
          )}
        </div>
      </div>

      <CalendarEventForm
        open={formOpen}
        mode={formMode}
        initialValues={activeEvent}
        onSubmit={handleSubmitEvent}
        onClose={() => {
          if (submitting) {
            return;
          }
          setFormOpen(false);
          setActiveEvent(null);
        }}
        submitting={submitting}
        error={formError}
      />

      <CalendarEventDetailsDrawer
        open={detailsOpen}
        event={detailsEvent}
        onClose={handleCloseDetails}
        onEdit={() => {
          if (!detailsEvent) return;
          handleEditEvent(detailsEvent);
        }}
        onDelete={handleDeleteEvent}
        onStatusChange={handleStatusChange}
        canManage={canManage}
        statusUpdating={statusUpdatingId === detailsEvent?.id}
        onDuplicate={handleDuplicateEvent}
      />
    </SectionShell>
  );
}
