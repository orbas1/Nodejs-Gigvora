import { useMemo } from 'react';
import { formatRelativeTime, formatAbsolute } from '../../../utils/date.js';

export default function ApiAuditTimeline({ events = [] }) {
  const timeline = useMemo(() => events.slice(0, 25), [events]);

  if (!timeline.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
        No audit events recorded yet.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {timeline.map((event) => (
        <li key={event.id} className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{event.eventType.replaceAll('_', ' ')}</p>
              {event.description ? (
                <p className="mt-1 text-sm text-slate-600">{event.description}</p>
              ) : null}
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {event.createdAt ? formatRelativeTime(event.createdAt) : '—'}
            </p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-500">Actor</p>
              <p className="mt-1 truncate text-slate-700">{event.actor ?? 'System'}</p>
            </div>
            <div className="rounded-2xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-500">IP address</p>
              <p className="mt-1 truncate text-slate-700">{event.ipAddress ?? '—'}</p>
            </div>
            <div className="rounded-2xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-500">Created</p>
              <p className="mt-1 truncate text-slate-700" title={event.createdAt ? formatAbsolute(event.createdAt) : undefined}>
                {event.createdAt ? formatRelativeTime(event.createdAt) : '—'}
              </p>
            </div>
          </div>
          {event.metadata && Object.keys(event.metadata).length ? (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
              <pre className="whitespace-pre-wrap break-all">{JSON.stringify(event.metadata, null, 2)}</pre>
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
