function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeRange(tasks) {
  const dates = [];
  tasks.forEach((task) => {
    const start = parseDate(task.startDate);
    const end = parseDate(task.dueDate);
    if (start) dates.push(start.getTime());
    if (end) dates.push(end.getTime());
  });
  if (!dates.length) return null;
  const min = Math.min(...dates);
  const max = Math.max(...dates);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }
  return { start: min, end: max === min ? min + 86400000 : max };
}

function calculateOffset(range, date) {
  if (!range) return 0;
  if (!date) return 0;
  return ((date - range.start) / (range.end - range.start)) * 100;
}

const STATUS_COLORS = {
  completed: 'bg-emerald-500',
  in_progress: 'bg-accent',
  blocked: 'bg-rose-500',
  planned: 'bg-slate-400',
  cancelled: 'bg-slate-300',
};

export default function WorkspaceGanttChart({ tasks = [] }) {
  if (!tasks.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Add tasks to see the delivery timeline.
      </div>
    );
  }

  const range = computeRange(tasks);

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const start = parseDate(task.startDate) ?? range?.start ?? Date.now();
        const end = parseDate(task.dueDate) ?? start;
        const offset = Math.max(0, Math.min(100, calculateOffset(range, start)));
        const width = Math.max(4, Math.min(100, calculateOffset(range, end) - offset));
        const color = STATUS_COLORS[task.status] ?? 'bg-slate-400';

        return (
          <div key={task.id ?? task.title} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">{task.title}</span>
              <span>{task.assigneeName || 'Unassigned'}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100">
              <div
                className={`${color} h-3 rounded-full transition-all`}
                style={{
                  marginLeft: `${offset}%`,
                  width: `${width}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
