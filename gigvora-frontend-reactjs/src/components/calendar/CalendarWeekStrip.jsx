import { useMemo } from 'react';
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatAbsolute } from '../../utils/date.js';

function startOfDay(date) {
  const instance = new Date(date);
  instance.setHours(0, 0, 0, 0);
  return instance;
}

function addDays(date, amount) {
  const instance = new Date(date);
  instance.setDate(instance.getDate() + amount);
  return instance;
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function normaliseEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .filter((event) => event && event.startsAt)
    .map((event) => ({
      ...event,
      startsAtDate: new Date(event.startsAt),
    }));
}

function buildWeek(referenceDate, events) {
  const base = startOfDay(referenceDate ?? new Date());
  const normalisedEvents = normaliseEvents(events);

  return Array.from({ length: 7 }).map((_, index) => {
    const day = addDays(base, index);
    const dayEvents = normalisedEvents
      .filter((event) => isSameDay(event.startsAtDate, day))
      .sort((a, b) => a.startsAtDate.getTime() - b.startsAtDate.getTime());

    return {
      date: day,
      events: dayEvents,
    };
  });
}

function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
  });
}

function formatDayNumber(date) {
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
  });
}

export default function CalendarWeekStrip({ events, onSelect, referenceDate = new Date() }) {
  const week = useMemo(() => buildWeek(referenceDate, events), [referenceDate, events]);
  const today = startOfDay(new Date());

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {week.map(({ date, events: dayEvents }) => {
        const isToday = isSameDay(date, today);
        const headlineClass = isToday
          ? 'text-accent border-accent/30 bg-accent/10'
          : 'text-slate-700 border-slate-200 bg-white';

        return (
          <div
            key={date.toISOString()}
            className="flex min-h-[160px] flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-xs font-semibold ${headlineClass}`}>
                <CalendarDaysIcon className="h-3.5 w-3.5" />
                {formatDayLabel(date)}
              </span>
              <span className="text-sm font-semibold text-slate-900">{formatDayNumber(date)}</span>
            </div>

            <div className="mt-3 flex-1 space-y-2">
              {dayEvents.length ? (
                dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id ?? `${event.startsAt}-${event.title}`}
                    type="button"
                    onClick={() => onSelect?.(event)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 transition hover:border-accent hover:text-accent"
                    title={event.title}
                  >
                    <p className="truncate text-sm font-semibold text-slate-900">{event.title}</p>
                    <p className="mt-1 flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {formatAbsolute(event.startsAt, { timeStyle: 'short' })}
                        {event.endsAt ? ` · ${formatAbsolute(event.endsAt, { timeStyle: 'short' })}` : ''}
                      </span>
                    </p>
                  </button>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs font-medium text-slate-400">
                  Free
                </p>
              )}

              {dayEvents.length > 3 ? (
                <p className="text-center text-xs font-medium text-slate-500">+{dayEvents.length - 3} more</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
