import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BoltIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FireIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowTopRightOnSquareIcon,
  HeartIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/solid';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfWeek(date) {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = base.getDay();
  const diff = (day + 6) % 7;
  base.setDate(base.getDate() - diff);
  base.setHours(0, 0, 0, 0);
  return base;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatDateRange(start, end, timezone) {
  if (!start) return 'TBA';
  const formatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  });
  const endFormatter = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  });
  if (!end) {
    return formatter.format(start);
  }
  return `${formatter.format(start)} – ${endFormatter.format(end)}`;
}

function formatTimeRange(start, end, timezone) {
  if (!start) return 'TBA';
  const formatter = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  });
  if (!end) {
    return formatter.format(start);
  }
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function formatRelativeDays(from, to) {
  if (!from || !to) return null;
  const diff = Math.floor((from.setHours(0, 0, 0, 0) - to.setHours(0, 0, 0, 0)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff <= 7) return `${diff} days away`;
  if (diff === -1) return 'Yesterday';
  if (diff < -1 && diff >= -7) return `${Math.abs(diff)} days ago`;
  return null;
}

function getDurationHours(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, (end.getTime() - start.getTime()) / 3600000);
}

function detectCategory(event) {
  if (!event) return 'community';
  if (event.category) return event.category;
  if (event.tags?.includes('volunteering')) return 'volunteering';
  if (event.isVolunteer) return 'volunteering';
  return 'community';
}

function detectLocation(event) {
  if (!event) return 'unspecified';
  if (event.locationCategory) return event.locationCategory;
  if (event.location?.toLowerCase().includes('virtual')) return 'virtual';
  if (event.location?.toLowerCase().includes('online')) return 'virtual';
  if (event.location?.toLowerCase().includes('hybrid')) return 'hybrid';
  return 'in_person';
}

function normalizeEvent(event, timezone) {
  const start = toDate(event.startsAt ?? event.startAt ?? event.startDate);
  const end = toDate(event.endsAt ?? event.endAt ?? event.endDate);
  const durationHours = getDurationHours(start, end);
  const category = detectCategory(event);
  const locationCategory = detectLocation(event);
  const audiences = Array.isArray(event.audiences)
    ? event.audiences
    : event.targetAudiences
    ? [].concat(event.targetAudiences)
    : [];
  const focusAreas = Array.isArray(event.focusAreas)
    ? event.focusAreas
    : event.causes
    ? [].concat(event.causes)
    : [];
  return {
    id: event.id ?? event.slug ?? `${event.title ?? 'event'}-${event.startsAt ?? Math.random()}`,
    title: event.title ?? 'Community event',
    subtitle: event.subtitle ?? event.tagline ?? null,
    summary: event.summary ?? event.description ?? '',
    category,
    locationCategory,
    location: event.location ?? 'To be announced',
    timezone: event.timezone ?? timezone,
    startsAt: start,
    endsAt: end,
    durationHours,
    tags: Array.isArray(event.tags) ? event.tags : [],
    audiences,
    focusAreas,
    volunteerSlots: event.volunteerSlots ?? event.volunteersNeeded ?? null,
    volunteerWaitlist: event.waitlistCount ?? null,
    coverImageUrl: event.coverImageUrl ?? event.heroImageUrl ?? null,
    heroVideoUrl: event.heroVideoUrl ?? null,
    host: event.host ?? event.organizer ?? null,
    hostCompany: event.hostCompany ?? event.organizerCompany ?? null,
    rsvpStatus: event.rsvpStatus ?? 'none',
    attendeesCount: event.attendeesCount ?? event.registeredCount ?? 0,
    capacity: event.capacity ?? null,
    isVolunteer: category === 'volunteering' || !!event.isVolunteer,
    isHybrid: locationCategory === 'hybrid',
    score: event.relevanceScore ?? event.score ?? 0,
    recommended: Boolean(event.recommended),
    featured: Boolean(event.featured || event.highlighted),
    links: Array.isArray(event.links) ? event.links : [],
    agenda: Array.isArray(event.agenda)
      ? event.agenda.map((item, index) => ({
          id: item.id ?? `${event.id ?? index}-agenda-${index}`,
          title: item.title ?? `Agenda item ${index + 1}`,
          description: item.description ?? null,
          startsAt: toDate(item.startsAt ?? item.startAt ?? item.startTime),
          endsAt: toDate(item.endsAt ?? item.endAt ?? item.endTime),
          owner: item.owner ?? item.ownerName ?? null,
        }))
      : [],
    speakers: Array.isArray(event.speakers)
      ? event.speakers.map((speaker, index) => ({
          id: speaker.id ?? `${event.id ?? 'event'}-speaker-${index}`,
          name: speaker.name ?? 'Speaker',
          title: speaker.title ?? speaker.headline ?? null,
          company: speaker.company ?? speaker.organization ?? null,
          avatarUrl: speaker.avatarUrl ?? speaker.photoUrl ?? null,
        }))
      : [],
  };
}

function buildMonthMatrix(date, events) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfWeek(firstOfMonth);
  const matrix = [];
  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const weekStart = addDays(gridStart, weekIndex * 7);
    const days = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const current = addDays(weekStart, dayIndex);
      const dayEvents = events.filter((event) => isSameDay(event.startsAt, current));
      days.push({
        date: current,
        inMonth: current.getMonth() === date.getMonth(),
        events: dayEvents,
      });
    }
    matrix.push(days);
  }
  return matrix;
}

function MonthView({
  activeDate,
  events,
  featuredIds,
  conflictIds,
  onSelectDate,
  onSelectEvent,
}) {
  const matrix = useMemo(() => buildMonthMatrix(activeDate, events), [activeDate, events]);
  const formatter = useMemo(() => new Intl.DateTimeFormat('en', { weekday: 'short' }), []);
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
      <div className="grid grid-cols-7 bg-slate-50 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {matrix[0].map((cell) => (
          <div key={cell.date.toISOString()} className="px-3 py-3 text-center">
            {formatter.format(cell.date)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t border-slate-200 text-sm">
        {matrix.map((week, weekIndex) => (
          <div key={weekIndex} className="contents">
            {week.map((cell) => {
              const isToday = isSameDay(cell.date, new Date());
              return (
                <button
                  key={cell.date.toISOString()}
                  type="button"
                  onClick={() => onSelectDate(cell.date)}
                  className={classNames(
                    'relative flex min-h-[120px] flex-col gap-1 border-b border-r border-slate-200 px-3 pb-3 pt-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    cell.inMonth ? 'bg-white' : 'bg-slate-50 text-slate-400',
                    isToday ? 'ring-2 ring-inset ring-accent/40' : null,
                  )}
                >
                  <span className={classNames('text-xs font-medium', isToday ? 'text-accent font-semibold' : '')}>
                    {cell.date.getDate()}
                  </span>
                  <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                    {cell.events.slice(0, 3).map((event) => {
                      const isFeatured = featuredIds.has(event.id);
                      const isConflict = conflictIds.has(event.id);
                      return (
                        <span
                          key={event.id}
                          onClick={(eventClick) => {
                            eventClick.stopPropagation();
                            onSelectEvent(event);
                          }}
                          className={classNames(
                            'group inline-flex items-center gap-1 truncate rounded-full px-2 py-1 text-xs font-medium',
                            event.isVolunteer
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700',
                            isFeatured ? 'ring-2 ring-accent ring-offset-1 ring-offset-white' : null,
                            isConflict ? 'border border-amber-500/60 bg-amber-50 text-amber-700' : null,
                          )}
                        >
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                          <span className="truncate">{event.title}</span>
                        </span>
                      );
                    })}
                    {cell.events.length > 3 ? (
                      <span className="text-xs text-slate-500">+{cell.events.length - 3} more</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

MonthView.propTypes = {
  activeDate: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  featuredIds: PropTypes.instanceOf(Set).isRequired,
  conflictIds: PropTypes.instanceOf(Set).isRequired,
  onSelectDate: PropTypes.func.isRequired,
  onSelectEvent: PropTypes.func.isRequired,
};

function WeekView({ weekStart, events, timezone, onSelectEvent, conflictIds, featuredIds }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [],
  );
  return (
    <div className="space-y-6">
      {days.map((day) => {
        const dayEvents = events.filter((event) => isSameDay(event.startsAt, day));
        if (dayEvents.length === 0) {
          return (
            <div key={day.toISOString()} className="flex flex-col gap-2 rounded-3xl border border-dashed border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">{dayFormatter.format(day)}</p>
                <span className="text-xs text-slate-400">No events scheduled</span>
              </div>
            </div>
          );
        }
        return (
          <div key={day.toISOString()} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">{dayFormatter.format(day)}</p>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{dayEvents.length} event(s)</span>
            </div>
            <div className="space-y-4">
              {dayEvents.map((event) => {
                const isConflict = conflictIds.has(event.id);
                const isFeatured = featuredIds.has(event.id);
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={classNames(
                      'w-full rounded-3xl border px-5 py-4 text-left transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      event.isVolunteer ? 'border-emerald-200/80 bg-emerald-50/60' : 'border-slate-200 bg-white',
                      isConflict ? 'border-amber-500/80 bg-amber-50/70' : null,
                      isFeatured ? 'ring-2 ring-accent/50 ring-offset-2 ring-offset-white' : null,
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                        <p className="text-xs text-slate-500">{event.subtitle || event.summary?.slice(0, 120)}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" aria-hidden="true" />
                            {formatTimeRange(event.startsAt, event.endsAt, event.timezone)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                            {event.location}
                          </span>
                          {event.isHybrid ? (
                            <span className="inline-flex items-center gap-1 text-sky-600">
                              <PlayCircleIcon className="h-4 w-4" aria-hidden="true" />
                              Hybrid access
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={classNames(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                            event.isVolunteer
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                          {event.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {event.attendeesCount}
                          {event.capacity ? ` / ${event.capacity}` : ''} attending
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

WeekView.propTypes = {
  weekStart: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  timezone: PropTypes.string.isRequired,
  onSelectEvent: PropTypes.func.isRequired,
  conflictIds: PropTypes.instanceOf(Set).isRequired,
  featuredIds: PropTypes.instanceOf(Set).isRequired,
};

function AgendaView({ events, timezone, onSelectEvent, featuredIds }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <SparklesIcon className="h-10 w-10 text-accent" aria-hidden="true" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">You are all caught up</h3>
          <p className="text-sm text-slate-500">
            There are no upcoming sessions that match the current filters. Explore recommended missions and live programming on the right to keep building momentum.
          </p>
        </div>
      </div>
    );
  }

  const formatter = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const grouped = events.reduce((accumulator, event) => {
    const key = event.startsAt ? event.startsAt.toDateString() : 'TBA';
    accumulator.set(key, [...(accumulator.get(key) ?? []), event]);
    return accumulator;
  }, new Map());

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([key, dayEvents]) => (
        <div key={key} className="space-y-4">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              {dayEvents[0].startsAt ? formatter.format(dayEvents[0].startsAt) : 'Schedule coming soon'}
            </h3>
            <span className="text-xs text-slate-400">{dayEvents.length} sessions</span>
          </header>
          <div className="space-y-4">
            {dayEvents
              .sort((a, b) => {
                if (!a.startsAt || !b.startsAt) return 0;
                return a.startsAt.getTime() - b.startsAt.getTime();
              })
              .map((event) => {
                const isFeatured = featuredIds.has(event.id);
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={classNames(
                      'w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      isFeatured ? 'ring-2 ring-accent/60 ring-offset-2 ring-offset-white' : null,
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent">
                          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                          {event.focusAreas?.[0] || event.category}
                        </div>
                        <h4 className="text-base font-semibold text-slate-900">{event.title}</h4>
                        <p className="text-sm text-slate-600">{event.summary?.slice(0, 160)}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" aria-hidden="true" />
                            {formatTimeRange(event.startsAt, event.endsAt, timezone)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                            {event.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                            {event.attendeesCount}
                            {event.capacity ? ` / ${event.capacity}` : ''} attending
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <span
                          className={classNames(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                            event.isVolunteer
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          <HeartIcon className="h-4 w-4" aria-hidden="true" />
                          {event.isVolunteer ? 'Volunteer mission' : 'Community event'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {event.startsAt ? formatRelativeDays(new Date(event.startsAt), new Date()) ?? '' : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

AgendaView.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  timezone: PropTypes.string.isRequired,
  onSelectEvent: PropTypes.func.isRequired,
  featuredIds: PropTypes.instanceOf(Set).isRequired,
};

const VIEW_OPTIONS = [
  { key: 'month', label: 'Month', description: 'Plan the full programming arc' },
  { key: 'week', label: 'Week', description: 'Curate tactical huddles' },
  { key: 'agenda', label: 'Agenda', description: 'Digest the next wave' },
];

export default function EventCalendar({
  events,
  recommendedEvents,
  timezone,
  onSelectEvent,
  onCreateEvent,
  onSyncCalendar,
  onFilterChange,
  userPreferences,
}) {
  const resolvedTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const normalizedEvents = useMemo(() => {
    const base = Array.isArray(events) ? events : [];
    return base.map((event) => normalizeEvent(event, resolvedTimezone));
  }, [events, resolvedTimezone]);

  const recommendedNormalized = useMemo(() => {
    const base = Array.isArray(recommendedEvents) ? recommendedEvents : [];
    return base
      .map((event) => normalizeEvent(event, resolvedTimezone))
      .filter((event) => event.startsAt);
  }, [recommendedEvents, resolvedTimezone]);

  const [view, setView] = useState('month');
  const [activeDate, setActiveDate] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(() => new Set(userPreferences?.categories ?? []));
  const [selectedAudiences, setSelectedAudiences] = useState(() => new Set(userPreferences?.audiences ?? []));
  const [selectedFocusAreas, setSelectedFocusAreas] = useState(() => new Set(userPreferences?.focusAreas ?? []));
  const [locationFilter, setLocationFilter] = useState(userPreferences?.location ?? 'all');
  const [volunteerOnly, setVolunteerOnly] = useState(Boolean(userPreferences?.volunteerOnly));

  const categoryOptions = useMemo(() => {
    const counts = normalizedEvents.reduce((accumulator, event) => {
      const key = event.category;
      accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
      return accumulator;
    }, new Map());
    return Array.from(counts.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([key, count]) => ({ key, count }));
  }, [normalizedEvents]);

  const audienceOptions = useMemo(() => {
    const counts = normalizedEvents.reduce((accumulator, event) => {
      event.audiences.forEach((audience) => {
        accumulator.set(audience, (accumulator.get(audience) ?? 0) + 1);
      });
      return accumulator;
    }, new Map());
    return Array.from(counts.entries()).map(([key, count]) => ({ key, count }));
  }, [normalizedEvents]);

  const focusAreaOptions = useMemo(() => {
    const counts = normalizedEvents.reduce((accumulator, event) => {
      event.focusAreas.forEach((focus) => {
        accumulator.set(focus, (accumulator.get(focus) ?? 0) + 1);
      });
      return accumulator;
    }, new Map());
    return Array.from(counts.entries()).map(([key, count]) => ({ key, count }));
  }, [normalizedEvents]);

  const filteredEvents = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return normalizedEvents.filter((event) => {
      if (volunteerOnly && !event.isVolunteer) {
        return false;
      }
      if (locationFilter !== 'all' && event.locationCategory !== locationFilter) {
        return false;
      }
      if (selectedCategories.size > 0 && !selectedCategories.has(event.category)) {
        return false;
      }
      if (
        selectedAudiences.size > 0 &&
        !event.audiences.some((audience) => selectedAudiences.has(audience))
      ) {
        return false;
      }
      if (
        selectedFocusAreas.size > 0 &&
        !event.focusAreas.some((focus) => selectedFocusAreas.has(focus))
      ) {
        return false;
      }
      if (searchLower) {
        const haystack = [
          event.title,
          event.summary,
          event.location,
          event.tags.join(' '),
          event.focusAreas.join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [
    normalizedEvents,
    volunteerOnly,
    locationFilter,
    selectedCategories,
    selectedAudiences,
    selectedFocusAreas,
    search,
  ]);

  const conflictIds = useMemo(() => {
    const ids = new Set();
    const sorted = [...filteredEvents]
      .filter((event) => event.startsAt && event.endsAt)
      .sort((a, b) => a.startsAt - b.startsAt);
    for (let index = 1; index < sorted.length; index += 1) {
      const prev = sorted[index - 1];
      const current = sorted[index];
      if (prev.endsAt > current.startsAt) {
        ids.add(prev.id);
        ids.add(current.id);
      }
    }
    return ids;
  }, [filteredEvents]);

  const featuredIds = useMemo(() => {
    const ids = new Set();
    filteredEvents.forEach((event) => {
      if (event.featured || event.recommended) {
        ids.add(event.id);
      }
    });
    recommendedNormalized.forEach((event) => {
      if (event.featured || event.recommended) {
        ids.add(event.id);
      }
    });
    return ids;
  }, [filteredEvents, recommendedNormalized]);

  const monthStats = useMemo(() => {
    const now = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
    const inMonth = filteredEvents.filter((event) => event.startsAt && isSameMonth(event.startsAt, now));
    const volunteerHours = inMonth
      .filter((event) => event.isVolunteer)
      .reduce((sum, event) => sum + event.durationHours, 0);
    const attendance = inMonth.reduce((sum, event) => sum + (event.attendeesCount ?? 0), 0);
    const capacity = inMonth.reduce((sum, event) => sum + (event.capacity ?? 0), 0);
    return {
      count: inMonth.length,
      volunteerHours: Math.round(volunteerHours),
      attendance,
      capacity,
    };
  }, [activeDate, filteredEvents]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((event) => event.startsAt && event.startsAt >= now)
      .sort((a, b) => a.startsAt - b.startsAt)
      .slice(0, 3);
  }, [filteredEvents]);

  const onToggleCategory = (key) => {
    setSelectedCategories((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onFilterChange?.({
        categories: Array.from(next),
        audiences: Array.from(selectedAudiences),
        focusAreas: Array.from(selectedFocusAreas),
        location: locationFilter,
        volunteerOnly,
        search,
      });
      return next;
    });
  };

  const onToggleAudience = (key) => {
    setSelectedAudiences((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onFilterChange?.({
        categories: Array.from(selectedCategories),
        audiences: Array.from(next),
        focusAreas: Array.from(selectedFocusAreas),
        location: locationFilter,
        volunteerOnly,
        search,
      });
      return next;
    });
  };

  const onToggleFocus = (key) => {
    setSelectedFocusAreas((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onFilterChange?.({
        categories: Array.from(selectedCategories),
        audiences: Array.from(selectedAudiences),
        focusAreas: Array.from(next),
        location: locationFilter,
        volunteerOnly,
        search,
      });
      return next;
    });
  };

  const onLocationChange = (value) => {
    setLocationFilter(value);
    onFilterChange?.({
      categories: Array.from(selectedCategories),
      audiences: Array.from(selectedAudiences),
      focusAreas: Array.from(selectedFocusAreas),
      location: value,
      volunteerOnly,
      search,
    });
  };

  const onVolunteerToggle = () => {
    setVolunteerOnly((previous) => {
      const next = !previous;
      onFilterChange?.({
        categories: Array.from(selectedCategories),
        audiences: Array.from(selectedAudiences),
        focusAreas: Array.from(selectedFocusAreas),
        location: locationFilter,
        volunteerOnly: next,
        search,
      });
      return next;
    });
  };

  const onSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    onFilterChange?.({
      categories: Array.from(selectedCategories),
      audiences: Array.from(selectedAudiences),
      focusAreas: Array.from(selectedFocusAreas),
      location: locationFilter,
      volunteerOnly,
      search: value,
    });
  };

  const goToPrevious = () => {
    if (view === 'month') {
      const next = new Date(activeDate);
      next.setMonth(next.getMonth() - 1);
      setActiveDate(next);
    } else {
      setActiveDate((previous) => addDays(previous, -7));
    }
  };

  const goToNext = () => {
    if (view === 'month') {
      const next = new Date(activeDate);
      next.setMonth(next.getMonth() + 1);
      setActiveDate(next);
    } else {
      setActiveDate((previous) => addDays(previous, 7));
    }
  };

  const weekStart = useMemo(() => startOfWeek(activeDate), [activeDate]);
  const agendaEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((event) => event.startsAt && event.startsAt >= addDays(now, -1))
      .sort((a, b) => a.startsAt - b.startsAt)
      .slice(0, 40);
  }, [filteredEvents]);

  const topRecommended = useMemo(() => {
    const fallback = filteredEvents
      .filter((event) => event.recommended || event.featured)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    if (recommendedNormalized.length === 0) {
      return fallback;
    }
    return recommendedNormalized
      .filter((event) => event.startsAt && event.startsAt >= new Date())
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [filteredEvents, recommendedNormalized]);

  const heatmap = useMemo(() => {
    const map = new Map();
    filteredEvents.forEach((event) => {
      if (!event.startsAt) return;
      const key = `${event.startsAt.getFullYear()}-${event.startsAt.getMonth()}`;
      const entry = map.get(key) ?? { total: 0, volunteer: 0 };
      entry.total += 1;
      if (event.isVolunteer) {
        entry.volunteer += 1;
      }
      map.set(key, entry);
    });
    const key = `${activeDate.getFullYear()}-${activeDate.getMonth()}`;
    return map.get(key) ?? { total: 0, volunteer: 0 };
  }, [filteredEvents, activeDate]);

  return (
    <section className="space-y-10 rounded-4xl border border-slate-200 bg-white p-8 shadow-xl ring-1 ring-black/5">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">Community runway</p>
          <h2 className="text-2xl font-semibold text-slate-900">Events & volunteering calendar</h2>
          <p className="max-w-2xl text-sm text-slate-500">
            Curate flagship programming, recruit talent for volunteering missions, and surface gatherings that align with each persona’s goals. Toggle views to orchestrate the month, sprint through the week, or review a personalised agenda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSyncCalendar}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Sync external calendar
          </button>
          <button
            type="button"
            onClick={onCreateEvent}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:bg-accentDark"
          >
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            Launch new experience
          </button>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={goToPrevious}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="text-left">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{view === 'month' ? 'Month' : 'Week'} focus</p>
                <p className="text-lg font-semibold text-slate-900">
                  {new Intl.DateTimeFormat('en', {
                    month: 'long',
                    year: 'numeric',
                  }).format(activeDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={goToNext}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setView(option.key)}
                  className={classNames(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    view === option.key
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'border border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-5 rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={onSearchChange}
                    placeholder="Search experiences, missions, speakers"
                    className="w-full rounded-full border border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
                  Smart filters active
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {categoryOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onToggleCategory(option.key)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
                      selectedCategories.has(option.key)
                        ? 'border-slate-900 bg-slate-900 text-white shadow'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                    )}
                  >
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                    {option.key.replace(/_/g, ' ')}
                    <span className="text-[10px] font-medium text-slate-400">{option.count}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {audienceOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onToggleAudience(option.key)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium transition',
                      selectedAudiences.has(option.key)
                        ? 'border-accent bg-accent text-white shadow'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800',
                    )}
                  >
                    <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                    {option.key}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {focusAreaOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onToggleFocus(option.key)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium transition',
                      selectedFocusAreas.has(option.key)
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800',
                    )}
                  >
                    <BoltIcon className="h-4 w-4" aria-hidden="true" />
                    {option.key}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={volunteerOnly}
                    onChange={onVolunteerToggle}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Spotlight volunteering missions
                </label>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <select
                    value={locationFilter}
                    onChange={(event) => onLocationChange(event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none"
                  >
                    <option value="all">All formats</option>
                    <option value="in_person">In-person</option>
                    <option value="virtual">Virtual</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="unspecified">TBA</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Momentum</p>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{monthStats.count} live gatherings</h3>
                  <p className="text-sm text-white/70">
                    {heatmap.total} total experiences this cycle • {heatmap.volunteer} volunteering tracks driving impact.
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-4 pt-6 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-white/50">Volunteer hours</dt>
                  <dd className="mt-1 text-2xl font-semibold">{monthStats.volunteerHours}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-white/50">Projected attendance</dt>
                  <dd className="mt-1 text-2xl font-semibold">
                    {monthStats.capacity ? `${monthStats.attendance}/${monthStats.capacity}` : monthStats.attendance}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {view === 'month' ? (
            <MonthView
              activeDate={activeDate}
              events={filteredEvents}
              featuredIds={featuredIds}
              conflictIds={conflictIds}
              onSelectDate={setActiveDate}
              onSelectEvent={onSelectEvent}
            />
          ) : null}
          {view === 'week' ? (
            <WeekView
              weekStart={weekStart}
              events={filteredEvents}
              timezone={resolvedTimezone}
              onSelectEvent={onSelectEvent}
              conflictIds={conflictIds}
              featuredIds={featuredIds}
            />
          ) : null}
          {view === 'agenda' ? (
            <AgendaView
              events={agendaEvents}
              timezone={resolvedTimezone}
              onSelectEvent={onSelectEvent}
              featuredIds={featuredIds}
            />
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Next best actions</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Upcoming highlights</h3>
              </div>
              <FireIcon className="h-6 w-6 text-accent" aria-hidden="true" />
            </header>
            <div className="mt-4 space-y-4">
              {upcomingEvents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  There are no upcoming sessions within the next two weeks. Consider scheduling a community drop-in or showcasing a volunteer spotlight to keep momentum high.
                </p>
              ) : (
                upcomingEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-accent/40 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatDateRange(event.startsAt, event.endsAt, event.timezone)} • {event.location}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Personalised picks</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Recommended for your cohort</h3>
              </div>
              <SparklesIcon className="h-6 w-6 text-accent" aria-hidden="true" />
            </header>
            <div className="space-y-4">
              {topRecommended.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Activate interest tags or sync third-party communities to unlock curated programming signals.
                </p>
              ) : (
                topRecommended.map((event) => (
                  <div key={event.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {event.coverImageUrl ? (
                        <img
                          src={event.coverImageUrl}
                          alt="Event cover"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <ChartBarIcon className="h-6 w-6" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                        <p className="text-xs text-slate-500">{formatDateRange(event.startsAt, event.endsAt, event.timezone)}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-accent">
                        <button
                          type="button"
                          onClick={() => onSelectEvent(event)}
                          className="inline-flex items-center gap-1 font-semibold"
                        >
                          View details
                          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                          Matches your goals
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Engagement pulse</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Volunteer roster readiness</h3>
              </div>
              <HeartIcon className="h-6 w-6 text-emerald-600" aria-hidden="true" />
            </header>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                {heatmap.volunteer > 0
                  ? `You are hosting ${heatmap.volunteer} volunteering tracks this month. Confirm facilitators seven days prior and share resources inside the mission workspace.`
                  : 'No volunteering activations yet. Launch a micro-mission or invite alumni mentors to host a skills sprint.'}
              </p>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">RSVP conversion</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {monthStats.capacity
                      ? `${Math.round((monthStats.attendance / Math.max(monthStats.capacity, 1)) * 100)}%`
                      : `${monthStats.attendance} confirmed`}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Timezone</p>
                  <p className="text-sm font-semibold text-slate-900">{resolvedTimezone}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

EventCalendar.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  recommendedEvents: PropTypes.arrayOf(PropTypes.object),
  timezone: PropTypes.string,
  onSelectEvent: PropTypes.func,
  onCreateEvent: PropTypes.func,
  onSyncCalendar: PropTypes.func,
  onFilterChange: PropTypes.func,
  userPreferences: PropTypes.shape({
    categories: PropTypes.arrayOf(PropTypes.string),
    audiences: PropTypes.arrayOf(PropTypes.string),
    focusAreas: PropTypes.arrayOf(PropTypes.string),
    location: PropTypes.string,
    volunteerOnly: PropTypes.bool,
  }),
};

EventCalendar.defaultProps = {
  events: [],
  recommendedEvents: [],
  timezone: null,
  onSelectEvent: () => {},
  onCreateEvent: () => {},
  onSyncCalendar: () => {},
  onFilterChange: null,
  userPreferences: null,
};
