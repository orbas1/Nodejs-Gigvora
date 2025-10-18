import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

export default function SyncHistoryList({ runs = [] }) {
  if (!runs.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        No sync events recorded.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {runs.map((run) => (
        <li key={run.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-900">{run.status}</span>
            <span className="text-xs uppercase tracking-wide text-slate-500">{run.trigger}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {run.startedAt ? <p>Started {formatRelativeTime(run.startedAt)} · {formatAbsolute(run.startedAt)}</p> : null}
            {run.finishedAt ? <p>Finished {formatRelativeTime(run.finishedAt)} · {formatAbsolute(run.finishedAt)}</p> : null}
          </div>
          {run.notes ? <p className="mt-2 text-xs text-slate-500">{run.notes}</p> : null}
        </li>
      ))}
    </ul>
  );
}
