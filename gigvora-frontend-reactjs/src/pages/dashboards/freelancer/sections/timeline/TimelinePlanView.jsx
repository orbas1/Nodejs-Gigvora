import { useMemo } from 'react';
import { CalendarIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline';

const STATUS_COLUMNS = [
  { id: 'planned', label: 'Planned', accent: 'bg-sky-50 border-sky-200 text-sky-600' },
  { id: 'in_progress', label: 'Active', accent: 'bg-amber-50 border-amber-200 text-amber-600' },
  { id: 'completed', label: 'Done', accent: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  { id: 'blocked', label: 'Blocked', accent: 'bg-rose-50 border-rose-200 text-rose-600' },
];

function formatRange(startAt, endAt, timezone) {
  if (!startAt && !endAt) {
    return 'No dates';
  }

  try {
    const intl = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    if (startAt && endAt) {
      return `${intl.format(new Date(startAt))} → ${intl.format(new Date(endAt))}${timezone ? ` • ${timezone}` : ''}`;
    }
    const single = intl.format(new Date(startAt ?? endAt));
    return timezone ? `${single} • ${timezone}` : single;
  } catch (error) {
    return [startAt, endAt].filter(Boolean).join(' → ');
  }
}

export default function TimelinePlanView({ entries, timezone, onCreateEntry, onOpenEntry }) {
  const grouped = useMemo(() => {
    const map = new Map();
    STATUS_COLUMNS.forEach((column) => {
      map.set(column.id, []);
    });
    (Array.isArray(entries) ? entries : []).forEach((entry) => {
      const key = map.has(entry.status) ? entry.status : 'planned';
      map.get(key).push(entry);
    });
    STATUS_COLUMNS.forEach((column) => {
      map.get(column.id).sort((a, b) => {
        const aTime = a.startAt ? new Date(a.startAt).getTime() : 0;
        const bTime = b.startAt ? new Date(b.startAt).getTime() : 0;
        return aTime - bTime;
      });
    });
    return map;
  }, [entries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Timeline board</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-wide">
            <ClockIcon className="h-3.5 w-3.5" />
            <span>{timezone}</span>
          </div>
          <button
            type="button"
            onClick={onCreateEntry}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New entry</span>
          </button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {STATUS_COLUMNS.map((column) => {
          const list = grouped.get(column.id) ?? [];
          return (
            <div key={column.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${column.accent}`}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {column.label}
                </span>
                <span className="text-xs font-semibold text-slate-400">{list.length}</span>
              </div>
              <div className="space-y-3">
                {list.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Empty
                  </div>
                ) : (
                  list.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onOpenEntry(entry)}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{entry.entryType}</span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-500">{formatRange(entry.startAt, entry.endAt, timezone)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry.channel ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {entry.channel}
                          </span>
                        ) : null}
                        {entry.owner ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {entry.owner}
                          </span>
                        ) : null}
                        {entry.linkedPost?.status ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                            {entry.linkedPost.title}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
