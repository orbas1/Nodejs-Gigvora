import { ClockIcon } from '@heroicons/react/24/outline';
import { formatDateTime, resolveName } from './utils.js';

export default function IdVerificationActivityPanel({ events, loading, onRefresh }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-4xl border border-slate-200 bg-white/95 p-8 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Recent activity</h2>
          <p className="mt-1 text-sm text-slate-500">Latest notes, escalations, and status changes.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
        >
          Refresh
        </button>
      </header>

      <section className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">
            Loading events…
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">
            No recent events.
          </div>
        ) : (
          <ol className="space-y-4">
            {events.map((event) => (
              <li
                key={`${event.id}-${event.verificationId}`}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <ClockIcon className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-slate-900">{event.eventType.replace('_', ' ')}</span>
                  </div>
                  <span className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{event.verificationName}</p>
                  {event.notes ? <p>{event.notes}</p> : null}
                  <p className="text-xs text-slate-500">By {resolveName(event.actor)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
