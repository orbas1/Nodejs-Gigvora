import { ArrowLongRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) {
    return 'No date';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

export default function CalendarUpcomingGrid({ upcomingByType = {}, metadataByType = {}, onSelect, onCreate }) {
  const entries = Object.entries(metadataByType);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Next up</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(([type, meta]) => {
          const nextEvent = upcomingByType?.[type] ?? null;
          return (
            <div key={type} className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="rounded-full bg-slate-100 p-2 text-slate-600">
                      {meta.icon ? <meta.icon className="h-5 w-5" /> : <CalendarDaysIcon className="h-5 w-5" />}
                    </span>
                    <span className="text-sm font-semibold">{meta.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCreate?.(type)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
                  >
                    New
                  </button>
                </div>
                {nextEvent ? (
                  <button
                    type="button"
                    onClick={() => onSelect?.(nextEvent)}
                    className="group w-full rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-5 text-left text-sm text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
                  >
                    <p className="font-semibold text-slate-900">{formatDate(nextEvent.startsAt)}</p>
                    <p className="mt-1 truncate text-sm text-slate-700">{nextEvent.title}</p>
                    {nextEvent.location ? <p className="mt-1 text-xs text-slate-500">{nextEvent.location}</p> : null}
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                      View
                      <ArrowLongRightIcon className="h-4 w-4" />
                    </span>
                  </button>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-5 text-sm text-slate-500">
                    Nothing scheduled.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
