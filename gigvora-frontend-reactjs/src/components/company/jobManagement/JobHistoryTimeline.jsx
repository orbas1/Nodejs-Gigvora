
import { useMemo } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

function formatTimestamp(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function JobHistoryTimeline({ items }) {
  const records = useMemo(() => {
    return (items ?? [])
      .slice()
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
      .slice(0, 15);
  }, [items]);

  return (
    <div className="space-y-3">
      {records.length ? (
        records.map((entry) => (
          <div key={entry.id ?? `${entry.changeType}-${entry.createdAt}`} className="flex gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
            <span className="mt-0.5 rounded-full bg-blue-50 p-2 text-blue-600">
              <ClockIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{entry.summary ?? entry.changeType ?? 'Update'}</p>
              <p className="text-xs text-slate-500">{formatTimestamp(entry.createdAt)}</p>
              {entry.payload ? (
                <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-50 p-2 text-[11px] text-slate-600">{JSON.stringify(entry.payload, null, 2)}</pre>
              ) : null}
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-3 py-6 text-sm text-slate-500">No activity.</div>
      )}
    </div>
  );
}
