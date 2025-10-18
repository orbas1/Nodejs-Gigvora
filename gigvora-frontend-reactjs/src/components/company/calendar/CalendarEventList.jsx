import { PencilSquareIcon, TrashIcon, ArrowTopRightOnSquareIcon, EyeIcon } from '@heroicons/react/24/outline';

function formatDateTime(value) {
  if (!value) {
    return 'TBD';
  }
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    return value;
  }
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function CalendarEventList({ events, accent, onEdit, onDelete, onSelect }) {
  if (!events?.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
        No events yet.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {events.map((event) => {
        const relatedUrl = event.metadata?.relatedUrl;
        const handleSelect = () => {
          onSelect?.(event);
        };

        return (
          <li
            key={event.id}
            className={classNames(
              'group flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-within:shadow-lg',
              accent || 'border-slate-200 bg-white',
            )}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={handleSelect}
              onKeyDown={(eventKey) => {
                if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                  eventKey.preventDefault();
                  handleSelect();
                }
              }}
              className="flex-1 cursor-pointer space-y-3 focus:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <p className="truncate text-lg font-semibold text-slate-900">{event.title}</p>
                  <p className="text-sm text-slate-600">
                    {formatDateTime(event.startsAt)}
                    {event.endsAt ? ` · ${formatDateTime(event.endsAt)}` : ''}
                  </p>
                  {event.location ? <p className="text-xs text-slate-500">{event.location}</p> : null}
                </div>
                <span
                  className={classNames(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize',
                    event.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : event.status === 'in_progress'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-blue-50 text-blue-700',
                  )}
                >
                  {event.status.replace(/_/g, ' ')}
                </span>
              </div>
              {event.metadata?.participants?.length ? (
                <div className="flex flex-wrap gap-2">
                  {event.metadata.participants.slice(0, 4).map((participant, index) => (
                    <span
                      key={`${participant.email ?? participant.name ?? index}`}
                      className="inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {participant.name || participant.email}
                    </span>
                  ))}
                  {event.metadata.participants.length > 4 ? (
                    <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-slate-600">
                      +{event.metadata.participants.length - 4}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {event.metadata?.notes ? (
                <p className="text-sm text-slate-600">{event.metadata.notes}</p>
              ) : null}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSelect}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-700"
              >
                <EyeIcon className="h-4 w-4" /> View
              </button>
              <div className="flex items-center gap-2">
                {relatedUrl ? (
                  <a
                    href={relatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-700"
                    onClick={(eventClick) => eventClick.stopPropagation()}
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Link
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={(eventClick) => {
                    eventClick.stopPropagation();
                    onEdit?.(event);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-700"
                >
                  <PencilSquareIcon className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={(eventClick) => {
                    eventClick.stopPropagation();
                    onDelete?.(event);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                >
                  <TrashIcon className="h-4 w-4" /> Remove
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
