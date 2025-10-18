import { ClockIcon } from '@heroicons/react/24/outline';

function formatTimestamp(value) {
  if (!value) return 'Just now';
  try {
    const timestamp = typeof value === 'string' ? Date.parse(value) : value;
    if (Number.isNaN(timestamp)) return 'Recently';
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    return 'Recently';
  }
}

export default function AgencyAiActivityLog({ activityLog = [] }) {
  return (
    <section id="ai-activity" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <ClockIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-semibold text-slate-900">Activity</h3>
      </div>

      <ol className="space-y-4">
        {activityLog.length === 0 ? (
          <li className="rounded-3xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No entries yet.
          </li>
        ) : (
          activityLog.map((entry) => (
            <li key={entry.id} className="flex gap-4">
              <div className="relative flex h-6 w-6 items-center justify-center">
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200" aria-hidden="true" />
                <span className="relative h-3 w-3 rounded-full border border-blue-200 bg-blue-500" />
              </div>
              <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{entry.summary ?? entry.type ?? 'Automation event'}</p>
                  <p className="text-xs text-slate-500">{formatTimestamp(entry.createdAt)}</p>
                </div>
                {entry.actorId ? <p className="mt-1 text-xs text-slate-500">User #{entry.actorId}</p> : null}
                {entry.details ? <p className="mt-2 text-sm text-slate-600">{entry.details}</p> : null}
              </div>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
