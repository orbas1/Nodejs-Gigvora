import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function AgencyCalendarTimelineView({ groupedEvents = [], onSelect, onEdit, onDelete }) {
  if (!groupedEvents.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <CalendarDaysIcon className="h-12 w-12 text-slate-300" />
        <p className="mt-4 text-sm text-slate-500">No items in this window.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedEvents.map((group) => (
        <section key={group.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{group.label}</h2>
          <ul className="mt-4 space-y-3">
            {group.events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-inner sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-white">
                      {(event.eventType || '').replace(/_/g, ' ')}
                    </span>
                    <span className="rounded-full border border-slate-300 px-3 py-1">{event.status}</span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{event.title}</p>
                  <p className="text-sm text-slate-500">
                    {event.isAllDay ? 'All day' : new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(event.startsAt))}
                    {event.endsAt && !event.isAllDay
                      ? ` · ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(event.endsAt))}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect?.(event)}
                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit?.(event)}
                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(event)}
                    className="inline-flex items-center rounded-full border border-transparent bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
