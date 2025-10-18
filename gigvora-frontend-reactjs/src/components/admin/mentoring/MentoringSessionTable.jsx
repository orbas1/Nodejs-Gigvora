import { format } from 'date-fns';

function formatDate(value) {
  if (!value) return '—';
  try {
    return format(new Date(value), 'MMM d, yyyy p');
  } catch (error) {
    return '—';
  }
}

function formatDuration(minutes) {
  if (minutes == null) return '—';
  const numeric = Number(minutes);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  if (numeric >= 60) {
    const hours = (numeric / 60).toFixed(1);
    return `${hours} hrs`;
  }
  return `${numeric} mins`;
}

function StatusBadge({ status }) {
  const normalized = `${status ?? ''}`.toLowerCase();
  const styles = {
    scheduled: 'bg-sky-100 text-sky-700 border-sky-200',
    requested: 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[normalized] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {normalized.replace(/_/g, ' ') || 'unknown'}
    </span>
  );
}

export default function MentoringSessionTable({ sessions, loading, onSelect, pagination, onPageChange }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-blue-100/20">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">Session</th>
              <th className="px-6 py-3">Mentor</th>
              <th className="px-6 py-3">Mentee</th>
              <th className="px-6 py-3">Service line</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Follow-up</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : sessions?.length ? (
              sessions.map((session) => (
                <tr key={session.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{session.topic}</span>
                      <span className="text-xs text-slate-500">{formatDate(session.scheduledAt)} · {formatDuration(session.durationMinutes)}</span>
                      {session.meetingProvider ? (
                        <span className="text-xs text-slate-500">{session.meetingProvider}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="font-medium text-slate-900">{session.mentor ? `${session.mentor.firstName} ${session.mentor.lastName}` : '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="font-medium text-slate-900">{session.mentee ? `${session.mentee.firstName} ${session.mentee.lastName}` : '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="font-medium text-slate-900">{session.serviceLine?.name ?? 'General'}</span>
                      {session.adminOwner ? <span className="text-xs text-slate-500">{session.adminOwner.firstName}</span> : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <StatusBadge status={session.status} />
                      {session.feedbackRating != null ? (
                        <span className="text-xs text-slate-500">Feedback {session.feedbackRating.toFixed(1)}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span>{session.followUpAt ? formatDate(session.followUpAt) : '—'}</span>
                      {session.actionItems?.length ? (
                        <span className="text-xs text-slate-500">{session.actionItems.length} action(s)</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => onSelect?.(session)}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                  No sessions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-600">
        <div>Showing {sessions?.length ?? 0} / {pagination?.total ?? sessions?.length ?? 0}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(1, (pagination?.page ?? 1) - 1))}
            disabled={loading || (pagination?.page ?? 1) <= 1}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <span>
            Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1}
          </span>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(pagination?.totalPages ?? 1, (pagination?.page ?? 1) + 1))}
            disabled={loading || (pagination?.page ?? 1) >= (pagination?.totalPages ?? 1)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
