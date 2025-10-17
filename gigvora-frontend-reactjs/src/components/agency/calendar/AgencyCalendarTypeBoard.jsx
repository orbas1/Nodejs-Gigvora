const DEFAULT_COLORS = {
  project: 'bg-sky-500',
  gig: 'bg-emerald-500',
  interview: 'bg-violet-500',
  mentorship: 'bg-amber-500',
  volunteering: 'bg-rose-500',
};

export default function AgencyCalendarTypeBoard({
  events = [],
  typeOrder = [],
  typeLabels = {},
  onSelect,
  onEdit,
  onDelete,
}) {
  const grouped = typeOrder.map((type) => ({
    type,
    label: typeLabels[type] ?? type,
    items: events.filter((event) => event.eventType === type),
  }));

  const remainder = events.filter((event) => !typeOrder.includes(event.eventType));
  if (remainder.length) {
    grouped.push({ type: 'other', label: 'Other', items: remainder });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {grouped.map((column) => (
        <section key={column.type} className="flex min-h-[320px] flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span className={`h-2 w-2 rounded-full ${DEFAULT_COLORS[column.type] ?? 'bg-slate-400'}`} />
              {column.label}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {column.items.length} items
            </span>
          </header>

          <div className="mt-4 flex flex-1 flex-col gap-3">
            {column.items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-400">
                Empty
              </div>
            ) : (
              column.items.map((event) => (
                <article key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
                  <h3 className="text-base font-semibold text-slate-900">{event.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {event.startsAt
                      ? new Intl.DateTimeFormat(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: event.isAllDay ? undefined : 'numeric',
                          minute: event.isAllDay ? undefined : '2-digit',
                        }).format(new Date(event.startsAt))
                      : 'Unscheduled'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect?.(event)}
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit?.(event)}
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(event)}
                      className="inline-flex items-center rounded-full border border-transparent bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
