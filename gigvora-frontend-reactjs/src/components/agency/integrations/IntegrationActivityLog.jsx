import { useMemo } from 'react';
import { ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline';

function formatTimestamp(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch (error) {
    return value;
  }
}

function actorLabel(actor) {
  if (!actor) {
    return 'System';
  }
  return actor.name ?? actor.email ?? `User #${actor.id}`;
}

export default function IntegrationActivityLog({ auditLog }) {
  const entries = useMemo(() => (Array.isArray(auditLog) ? auditLog : []), [auditLog]);

  if (!entries.length) {
    return <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-sm text-slate-600 shadow-soft">No activity yet.</div>;
  }

  return (
    <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-soft">
          <p className="text-sm font-semibold text-slate-900">{entry.summary}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            <div className="inline-flex items-center gap-1">
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              {formatTimestamp(entry.createdAt)}
            </div>
            <div className="inline-flex items-center gap-1">
              <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
              {actorLabel(entry.actor)}
            </div>
          </div>
          {entry.detail && Object.keys(entry.detail).length ? (
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {JSON.stringify(entry.detail, null, 2)}
            </pre>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
