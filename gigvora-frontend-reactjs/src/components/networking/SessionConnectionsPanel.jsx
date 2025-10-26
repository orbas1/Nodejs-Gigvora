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

function getCompany(connection) {
  return (
    connection?.participant?.company ||
    connection?.member?.company ||
    connection?.company?.name ||
    connection?.companyName ||
    null
  );
}

function derivePrompt(connection) {
  const sessionTitle = connection?.sessionTitle;
  const followUps = Number(connection?.followUpsScheduled ?? 0);
  const headline = getHeadline(connection);
  const company = getCompany(connection);
  const name = getDisplayName(connection);
  const sessionReference = sessionTitle ? `the “${sessionTitle}” session` : 'your recent speed networking session';

  if (followUps > 0) {
    const firstName = name?.split(' ')?.[0] ?? 'them';
    return `Confirm next steps from ${sessionReference} and recap what you already logged with ${firstName}.`;
  }

  if (headline) {
    return `Mention their ${headline.toLowerCase()} focus from ${sessionReference} and propose a 15-minute follow-up.`;
  }

  if (company) {
    return `Reference the collaboration ideas you explored with ${company} during ${sessionReference} and share one actionable next step.`;
  }

  return `Open by thanking them for ${sessionReference} and suggest a concrete follow-up with a time and agenda.`;
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
        prompt: derivePrompt(connection),
      })),
    [connections],
  );

  const qualityPrompts = useMemo(() => {
    const unique = new Set();
    const prompts = [];
    rows.forEach((row) => {
      if (!row.prompt || unique.has(row.prompt)) {
        return;
      }
      unique.add(row.prompt);
      prompts.push(row.prompt);
    });
    return prompts.slice(0, 3);
  }, [rows]);

  return (
    <section id="follow" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Follow</h2>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 px-4 py-4 shadow-sm">
        <h3 className="text-sm font-semibold text-blue-900">Quality intro prompts</h3>
        {qualityPrompts.length ? (
          <ul className="mt-3 space-y-2 text-sm text-blue-800">
            {qualityPrompts.map((prompt) => (
              <li key={prompt} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-blue-400" />
                <span>{prompt}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-blue-700">
            Once attendees start logging follow-ups, we surface targeted openers to keep momentum high.
          </p>
        )}
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
              <th className="px-4 py-3">Suggested prompt</th>
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
                <td className="px-4 py-3 text-sm text-slate-600">
                  <p className="max-w-xs leading-snug">{row.prompt}</p>
                </td>
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
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
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
