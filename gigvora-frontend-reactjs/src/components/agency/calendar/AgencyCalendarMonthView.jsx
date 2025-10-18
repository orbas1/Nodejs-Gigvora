import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfMonth(date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addMonths(date, count) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + count);
  return startOfMonth(next);
}

function buildWeeks(monthCursor) {
  const monthStart = startOfMonth(monthCursor);
  const firstWeekday = (monthStart.getDay() + 6) % 7; // Monday start
  const firstVisible = new Date(monthStart);
  firstVisible.setDate(monthStart.getDate() - firstWeekday);

  const weeks = [];
  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const days = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const day = new Date(firstVisible);
      day.setDate(firstVisible.getDate() + weekIndex * 7 + dayIndex);
      const dateKey = day.toISOString().slice(0, 10);
      days.push({
        date: day,
        key: dateKey,
        inMonth: day.getMonth() === monthCursor.getMonth(),
        isToday: dateKey === new Date().toISOString().slice(0, 10),
      });
    }
    weeks.push(days);
  }
  return weeks;
}

function DayCell({ day, events, onSelect }) {
  const dayEvents = events.get(day.key) ?? [];
  return (
    <div
      className={`flex h-36 flex-col rounded-3xl border p-3 transition hover:border-slate-300 ${
        day.inMonth ? 'border-slate-200 bg-white' : 'border-transparent bg-slate-50 text-slate-400'
      } ${day.isToday ? 'ring-2 ring-accent/40' : ''}`}
    >
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span className={day.inMonth ? 'text-slate-600' : ''}>{day.date.getDate()}</span>
        {dayEvents.length ? (
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            {dayEvents.length}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-1 flex-col gap-2 overflow-hidden">
        {dayEvents.slice(0, 3).map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onSelect?.(event)}
            className="truncate rounded-2xl bg-slate-900/5 px-2 py-1 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-900/10"
          >
            {event.title}
          </button>
        ))}
        {dayEvents.length > 3 ? (
          <span className="truncate rounded-2xl bg-slate-200/60 px-2 py-1 text-center text-[11px] font-semibold text-slate-500">
            +{dayEvents.length - 3} more
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function AgencyCalendarMonthView({ monthCursor, eventsByDay, onSelectEvent, onMonthChange }) {
  const weeks = buildWeeks(monthCursor);
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(monthCursor);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={() => onMonthChange?.(addMonths(monthCursor, -1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="text-base font-semibold text-slate-900">{monthLabel}</p>
        <button
          type="button"
          onClick={() => onMonthChange?.(addMonths(monthCursor, 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-3">
        <div className="grid grid-cols-7 gap-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-3">
          {weeks.map((week) =>
            week.map((day) => (
              <DayCell key={day.key} day={day} events={eventsByDay} onSelect={onSelectEvent} />
            )),
          )}
        </div>
      </div>
    </div>
  );
}
