function formatTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TimelinePanel({ deadlines, events, onSelect }) {
  return (
    <aside className="flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-soft">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Deadlines</h3>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{deadlines.length}</span>
      </header>

      <ol className="mt-4 space-y-3 text-sm text-slate-600">
        {deadlines.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs uppercase tracking-widest text-slate-400">
            None scheduled
          </li>
        ) : (
          deadlines.map((item) => (
            <li key={item.disputeId}>
              <button
                type="button"
                onClick={() => onSelect?.(item.disputeId)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span className="font-semibold text-slate-500">{item.stage}</span>
                  <span className={item.isPastDue ? 'text-rose-600' : 'text-amber-600'}>{formatTime(item.dueAt)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{item.summary}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">Priority: {item.priority}</p>
              </button>
            </li>
          ))
        )}
      </ol>

      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent events</h3>
        <ol className="mt-3 space-y-3 text-xs text-slate-500">
          {events.slice(0, 6).map((event) => (
            <li key={event.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2">
              <span className="font-semibold uppercase tracking-wide text-slate-600">{event.actionType.replace(/_/g, ' ')}</span>
              <span>{formatTime(event.eventAt)}</span>
            </li>
          ))}
          {events.length === 0 ? (
            <li className="text-center text-[11px] uppercase tracking-[0.3em] text-slate-300">No activity</li>
          ) : null}
        </ol>
      </div>
    </aside>
  );
}
