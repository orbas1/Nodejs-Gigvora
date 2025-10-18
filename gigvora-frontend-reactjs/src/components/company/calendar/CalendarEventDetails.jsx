import { ArrowTopRightOnSquareIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

function formatDateTime(value) {
  if (!value) {
    return '—';
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

function formatRange(startsAt, endsAt) {
  const start = formatDateTime(startsAt);
  if (!endsAt) {
    return start;
  }
  return `${start} – ${formatDateTime(endsAt)}`;
}

export default function CalendarEventDetails({ event, onEdit, onDelete }) {
  if (!event) {
    return null;
  }

  const participants = event.metadata?.participants ?? [];
  const attachments = event.metadata?.attachments ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{event.eventType}</p>
          <h3 className="text-2xl font-semibold text-slate-900">{event.title}</h3>
          <p className="text-sm text-slate-600">{formatRange(event.startsAt, event.endsAt)}</p>
          {event.location ? <p className="text-sm text-slate-600">{event.location}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(event)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
          >
            <PencilSquareIcon className="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(event)}
            className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-sm font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <TrashIcon className="h-4 w-4" /> Remove
          </button>
        </div>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
          <dd className="text-sm font-medium capitalize text-slate-800">{event.status?.replace(/_/g, ' ') ?? 'scheduled'}</dd>
        </div>
        <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</dt>
          <dd className="text-sm font-medium text-slate-800">
            {event.metadata?.ownerName ?? 'Unassigned'}
            {event.metadata?.ownerEmail ? ` · ${event.metadata.ownerEmail}` : ''}
          </dd>
        </div>
      </dl>

      {participants.length ? (
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-800">Participants</h4>
          <ul className="grid gap-2 sm:grid-cols-2">
            {participants.map((participant, index) => (
              <li key={`${participant.email ?? participant.name ?? index}`} className="rounded-2xl border border-slate-100 bg-white p-3 text-sm text-slate-700">
                <p className="font-medium text-slate-900">{participant.name ?? 'Guest'}</p>
                {participant.email ? <p className="text-xs text-slate-500">{participant.email}</p> : null}
                {participant.role ? <p className="text-xs text-slate-500">{participant.role}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {event.metadata?.notes ? (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-800">Notes</h4>
          <p className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-700">{event.metadata.notes}</p>
        </section>
      ) : null}

      {attachments.length ? (
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-800">Attachments</h4>
          <ul className="grid gap-2 sm:grid-cols-2">
            {attachments.map((attachment) => (
              <li key={`${attachment.url}`} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 text-sm text-slate-700">
                <span className="truncate">{attachment.label ?? attachment.url}</span>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  Open
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {event.metadata?.relatedUrl ? (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-800">Linked record</h4>
          <a
            href={event.metadata.relatedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            {event.metadata.relatedEntityName ?? 'Open link'}
          </a>
        </section>
      ) : null}
    </div>
  );
}
