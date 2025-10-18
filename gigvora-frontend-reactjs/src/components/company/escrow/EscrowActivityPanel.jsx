function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

export default function EscrowActivityPanel({ activity }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Activity</h2>
      <p className="text-xs text-slate-500">Latest custody events in chronological order.</p>

      <ol className="mt-4 space-y-3 text-sm">
        {(activity ?? []).length ? (
          activity.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
              <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-800">{entry.reference}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{entry.type?.replace(/_/g, ' ')}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">{formatDate(entry.occurredAt)}</div>
                <div className="mt-1 text-sm text-slate-700">{entry.milestoneLabel || 'Milestone pending'}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {entry.currencyCode ? `${entry.currencyCode} ${entry.amount}` : entry.amount}
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">No activity yet.</li>
        )}
      </ol>
    </div>
  );
}
