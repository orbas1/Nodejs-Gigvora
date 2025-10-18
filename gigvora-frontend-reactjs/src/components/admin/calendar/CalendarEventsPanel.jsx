import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

export default function CalendarEventsPanel({ events, onCreate, onEdit, onDelete, onPreview }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Events</h2>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <PlusIcon className="h-4 w-4" />
          New event
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Title
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Schedule
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                  No events yet
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="font-semibold text-slate-900">{event.title}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">{event.visibility}</div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    <div>{formatDate(event.startsAt)}</div>
                    <div className="text-xs text-slate-400">{formatDate(event.endsAt)}</div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{event.eventType}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                        event.status === 'published'
                          ? 'bg-emerald-100 text-emerald-600'
                          : event.status === 'scheduled'
                          ? 'bg-sky-100 text-sky-600'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onPreview(event)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(event)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(event)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
