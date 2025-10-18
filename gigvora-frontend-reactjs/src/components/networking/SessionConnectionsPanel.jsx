import { useMemo } from 'react';

function getDisplayName(connection) {
  return (
    connection?.participant?.name ||
    connection?.member?.name ||
    connection?.user?.name ||
    connection?.name ||
    connection?.email ||
    'Attendee'
  );
}

function getHeadline(connection) {
  return connection?.participant?.title || connection?.member?.title || connection?.title || null;
}

export default function SessionConnectionsPanel({
  connections = [],
  onScheduleFollowUp,
  processingKey,
  error,
}) {
  const rows = useMemo(
    () =>
      connections.map((connection) => ({
        id: connection.id,
        sessionId: connection.sessionId,
        sessionTitle: connection.sessionTitle,
        completedAgo: connection.completedAgo,
        followUps: connection.followUpsScheduled ?? 0,
        name: getDisplayName(connection),
        headline: getHeadline(connection),
      })),
    [connections],
  );

  return (
    <section id="follow" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Follow</h2>
      </div>

      {error ? (
        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3">Follow-ups</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={`${row.sessionId}:${row.id}`} className="hover:bg-blue-50/40">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">{row.name}</span>
                    {row.headline ? <span className="text-xs text-slate-500">{row.headline}</span> : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{row.sessionTitle}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{row.completedAgo || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{row.followUps}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                    onClick={() =>
                      onScheduleFollowUp?.(
                        connections.find((item) => item.id === row.id && item.sessionId === row.sessionId),
                      )
                    }
                    disabled={processingKey === `${row.sessionId}:${row.id}`}
                  >
                    {processingKey === `${row.sessionId}:${row.id}` ? 'Scheduling…' : 'Log follow-up'}
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                  No recent connections yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
