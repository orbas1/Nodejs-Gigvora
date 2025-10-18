import { useMemo } from 'react';
import {
  ArrowRightCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  LinkIcon,
  MapPinIcon,
  PencilIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { getTypeIcon, resolveStatusMeta, resolveTypeMeta, STATUS_PROGRESS_ORDER } from './constants.js';

function formatDayHeading(date) {
  if (!date) {
    return 'Unscheduled';
  }
  const target = new Date(date);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const targetDate = target.toDateString();
  if (targetDate === today.toDateString()) {
    return 'Today';
  }
  if (targetDate === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  if (targetDate === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return target.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeRange(event) {
  if (!event?.startsAt) {
    return 'Time TBD';
  }
  const start = new Date(event.startsAt);
  const startLabel = event.isAllDay
    ? 'All day'
    : start.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
  if (event.isAllDay) {
    return startLabel;
  }
  if (!event.endsAt) {
    return startLabel;
  }
  const end = new Date(event.endsAt);
  const endLabel = end.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${startLabel} – ${endLabel}`;
}

function resolveRelatedLink(event) {
  if (event.meetingUrl) {
    return { href: event.meetingUrl, label: 'Open meeting room', icon: LinkIcon };
  }
  if (event.relatedEntityType && event.relatedEntityId) {
    const base = `/dashboard/freelancer/${event.relatedEntityType}/${event.relatedEntityId}`;
    return { href: base, label: 'Open related workspace', icon: DocumentIcon };
  }
  return null;
}

function groupEventsByDay(events) {
  const map = new Map();
  events.forEach((event) => {
    const key = event?.startsAt ? new Date(event.startsAt).toDateString() : 'unscheduled';
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(event);
  });

  const sortedKeys = [...map.keys()].sort((firstKey, secondKey) => {
    if (firstKey === 'unscheduled') {
      return 1;
    }
    if (secondKey === 'unscheduled') {
      return -1;
    }
    const firstDate = new Date(firstKey);
    const secondDate = new Date(secondKey);
    return firstDate.getTime() - secondDate.getTime();
  });

  return sortedKeys.map((key) => ({
    day: key === 'unscheduled' ? null : new Date(key),
    events: map.get(key).sort((a, b) => {
      const firstTime = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const secondTime = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      return firstTime - secondTime;
    }),
  }));
}

function StatusBadge({ status }) {
  const meta = resolveStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
      meta?.tone ?? 'border-slate-200 bg-slate-100 text-slate-600'
    }`}
    >
      <ClockIcon className="h-3.5 w-3.5" />
      {meta?.label ?? 'Status'}
    </span>
  );
}

function TypeBadge({ eventType, color }) {
  const meta = resolveTypeMeta(eventType);
  const Icon = getTypeIcon(eventType);
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta?.tone}`}
      style={{ boxShadow: `0 0 0 1px ${color ?? meta?.color ?? '#2563eb'}20` }}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: (color ?? meta?.color ?? '#2563eb') + '20' }}>
        <Icon className="h-4 w-4" style={{ color: color ?? meta?.color ?? '#2563eb' }} />
      </span>
      {meta?.label ?? 'Event'}
    </span>
  );
}

function ProgressDots({ status }) {
  const activeIndex = STATUS_PROGRESS_ORDER.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STATUS_PROGRESS_ORDER.map((itemStatus, index) => {
        const isActive = activeIndex >= index && status !== 'cancelled';
        const isCancelled = status === 'cancelled' && itemStatus === 'cancelled';
        return (
          <span
            key={itemStatus}
            className={`h-1.5 w-6 rounded-full ${
              isCancelled ? 'bg-rose-400' : isActive ? 'bg-blue-500' : 'bg-slate-200'
            }`}
          />
        );
      })}
    </div>
  );
}

export default function CalendarEventTimeline({
  events,
  onSelectEvent,
  onEditEvent,
  onStatusChange,
  canManage,
  loading,
  emptyState,
  statusUpdatingId,
}) {
  const groupedEvents = useMemo(() => groupEventsByDay(events), [events]);
  const upcomingHighlight = useMemo(() => {
    const now = Date.now();
    return events.find((event) => {
      if (!event.startsAt) {
        return false;
      }
      const startTime = new Date(event.startsAt).getTime();
      return startTime >= now;
    });
  }, [events]);

  if (!loading && (!events || events.length === 0)) {
    return emptyState;
  }

  return (
    <div className="space-y-6">
      {upcomingHighlight ? (
        <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Next milestone</p>
              <p className="text-xl font-semibold text-slate-900">{upcomingHighlight.title}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <TypeBadge eventType={upcomingHighlight.eventType} color={upcomingHighlight.color} />
                <StatusBadge status={upcomingHighlight.status} />
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 font-semibold text-slate-600 shadow-sm">
                  <ClockIcon className="h-4 w-4" /> {formatTimeRange(upcomingHighlight)}
                </span>
              </div>
              {upcomingHighlight.notes ? (
                <p className="max-w-xl text-sm text-slate-600">{upcomingHighlight.notes}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                onClick={() => onSelectEvent?.(upcomingHighlight)}
              >
                View briefing
              </button>
              {canManage ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  onClick={() => onEditEvent?.(upcomingHighlight)}
                >
                  <PencilIcon className="h-4 w-4" /> Update details
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-8">
        {groupedEvents.map((group) => (
          <section key={group.day ? group.day.toISOString() : 'unscheduled'} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatDayHeading(group.day)}</p>
                <p className="text-sm text-slate-500">
                  {group.day
                    ? new Date(group.day).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Assign a time to ensure automations trigger correctly.'}
                </p>
              </div>
              <ProgressDots status={group.events[0]?.status} />
            </div>

            <div className="space-y-3">
              {group.events.map((event) => {
                const relatedLink = resolveRelatedLink(event);
                return (
                  <article
                    key={event.id}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <TypeBadge eventType={event.eventType} color={event.color} />
                          <StatusBadge status={event.status} />
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            <ClockIcon className="h-4 w-4" /> {formatTimeRange(event)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                        {event.relatedEntityName ? (
                          <p className="text-sm text-slate-600">Linked workspace: {event.relatedEntityName}</p>
                        ) : null}
                        {event.location ? (
                          <p className="inline-flex items-center gap-2 text-sm text-slate-500">
                            <MapPinIcon className="h-4 w-4" /> {event.location}
                          </p>
                        ) : null}
                        {event.notes ? (
                          <p className="max-w-3xl text-sm text-slate-600">{event.notes}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                            onClick={() => onSelectEvent?.(event)}
                          >
                            <CalendarIcon className="h-4 w-4" /> View briefing
                          </button>
                          {canManage ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                              onClick={() => onEditEvent?.(event)}
                            >
                              <PencilIcon className="h-4 w-4" /> Edit
                            </button>
                          ) : null}
                          {canManage ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              onClick={() => onStatusChange?.(event, 'completed')}
                              disabled={statusUpdatingId === event.id}
                            >
                              <CheckCircleIcon className="h-4 w-4" />{' '}
                              {statusUpdatingId === event.id ? 'Updating…' : 'Mark done'}
                            </button>
                          ) : null}
                        </div>
                        {relatedLink ? (
                          (() => {
                            const RelatedIcon = relatedLink.icon ?? LinkIcon;
                            return (
                              <a
                                href={relatedLink.href}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                              >
                                <RelatedIcon className="h-4 w-4" /> {relatedLink.label}
                              </a>
                            );
                          })()
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-3 text-xs text-slate-500 md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <PlayIcon className="h-4 w-4 text-slate-400" />
                        Source: {event.source ?? 'manual'}
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-slate-400" />
                        Reminder: {event.reminderMinutesBefore ? `${event.reminderMinutesBefore} mins before` : 'Off'}
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRightCircleIcon className="h-4 w-4 text-slate-400" />
                        Last updated {event.updatedAt ? new Date(event.updatedAt).toLocaleString() : '—'}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
