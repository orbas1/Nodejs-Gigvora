import PropTypes from 'prop-types';

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarDays(month) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = firstOfMonth.getDay();
  const calendarStart = addDays(firstOfMonth, -startOffset);
  const weeks = [];
  let current = calendarStart;
  for (let week = 0; week < 6; week += 1) {
    const days = [];
    for (let day = 0; day < 7; day += 1) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    weeks.push(days);
  }
  return weeks;
}

function formatDayNumber(day) {
  return day.getDate();
}

export default function CalendarEventMonthView({
  month,
  events,
  onSelectEvent,
  onCreateEvent,
}) {
  const weeks = buildCalendarDays(month);
  const today = startOfDay(new Date());

  const safeEvents = Array.isArray(events) ? events : [];

  const eventsByDay = safeEvents.reduce((accumulator, event) => {
    if (!event.startsAt) {
      return accumulator;
    }
    const date = new Date(event.startsAt);
    const key = startOfDay(date).toISOString();
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(event);
    return accumulator;
  }, {});

  const handleCreate = (day) => {
    if (typeof onCreateEvent === 'function') {
      onCreateEvent(day);
    }
  };

  const handleSelect = (event) => {
    if (typeof onSelectEvent === 'function') {
      onSelectEvent(event);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full table-fixed divide-y divide-slate-100">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <th key={label} scope="col" className="px-4 py-3 text-left">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
          {weeks.map((week, index) => (
            <tr key={`week-${index}`} className="align-top">
              {week.map((day) => {
                const key = startOfDay(day).toISOString();
                const dayEvents = eventsByDay[key] ?? [];
                const isCurrentMonth = day.getMonth() === month.getMonth();
                const isToday = isSameDay(day, today);
                return (
                  <td
                    key={key}
                    className={`h-32 px-3 py-2 transition ${
                      isCurrentMonth ? 'bg-white' : 'bg-slate-50'
                    } ${isToday ? 'ring-2 ring-accent/60' : ''}`}
                  >
                    <div className="flex items-center justify-between text-[0.7rem] font-semibold text-slate-500">
                      <button
                        type="button"
                        onClick={() => handleCreate(day)}
                        className={`rounded-full px-2 py-1 text-xs transition ${
                          isCurrentMonth
                            ? 'text-slate-600 hover:bg-slate-100'
                            : 'text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {formatDayNumber(day)}
                      </button>
                      <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">
                        {dayEvents.length ? `${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <button
                          key={event.id ?? `${key}-${event.title}`}
                          type="button"
                          onClick={() => handleSelect(event)}
                          className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-2 py-1 text-left hover:border-accent/50 hover:bg-slate-50"
                        >
                          <span className="flex-1 truncate text-[0.7rem] text-slate-700">{event.title}</span>
                          <span className="ml-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
                            {event.startsAt ? new Date(event.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                          </span>
                        </button>
                      ))}
                      {dayEvents.length > 3 ? (
                        <div className="text-[0.65rem] text-slate-400">+{dayEvents.length - 3} more</div>
                      ) : null}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

CalendarEventMonthView.propTypes = {
  month: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.arrayOf(PropTypes.object),
  onSelectEvent: PropTypes.func,
  onCreateEvent: PropTypes.func,
};

CalendarEventMonthView.defaultProps = {
  events: [],
  onSelectEvent: null,
  onCreateEvent: null,
};
