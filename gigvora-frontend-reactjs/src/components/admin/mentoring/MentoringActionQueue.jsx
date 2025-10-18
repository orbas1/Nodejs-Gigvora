import { format } from 'date-fns';

function formatDue(value) {
  if (!value) return 'No due date';
  try {
    return `Due ${format(new Date(value), 'MMM d, yyyy')}`;
  } catch (error) {
    return 'No due date';
  }
}

export default function MentoringActionQueue({ actionItems = [], onSelectSession, onUpdateStatus }) {
  if (!actionItems.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
        No open tasks.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {actionItems.map((item) => (
        <article key={`action-${item.id}`} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
            <p className="text-xs text-slate-500">Session #{item.sessionId}</p>
            <p className="text-xs text-slate-500">{formatDue(item.dueAt)}</p>
          </div>
          {item.assignee ? (
            <p className="text-xs text-slate-500">{item.assignee.firstName} {item.assignee.lastName}</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <select
              value={item.status}
              onChange={(event) => onUpdateStatus?.(item.sessionId, item.id, event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              type="button"
              onClick={() => onSelectSession?.(item)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
            >
              Open
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
