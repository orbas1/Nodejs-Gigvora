import { useMemo } from 'react';
import { formatRelativeTime } from '../../utils/date.js';

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function differenceInDays(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function ProjectGanttChart({ timeline, tasks = [] }) {
  const { earliest, latest } = useMemo(() => {
    const dates = tasks
      .map((task) => [parseDate(task.startDate), parseDate(task.endDate)])
      .flat()
      .filter(Boolean);

    if (timeline?.startDate) {
      dates.push(parseDate(timeline.startDate));
    }
    if (timeline?.endDate) {
      dates.push(parseDate(timeline.endDate));
    }

    if (!dates.length) {
      return { earliest: null, latest: null };
    }

    const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
    return { earliest: sorted[0], latest: sorted[sorted.length - 1] };
  }, [timeline, tasks]);

  const totalDuration = earliest && latest ? latest.getTime() - earliest.getTime() : 0;

  const items = useMemo(() => {
    if (!earliest || !latest || !totalDuration) {
      return [];
    }
    return tasks
      .filter((task) => parseDate(task.startDate) && parseDate(task.endDate))
      .map((task) => {
        const start = parseDate(task.startDate);
        const end = parseDate(task.endDate);
        const left = ((start.getTime() - earliest.getTime()) / totalDuration) * 100;
        const width = Math.max(4, ((end.getTime() - start.getTime()) / totalDuration) * 100);
        const progress = Math.max(0, Math.min(100, Number(task.progressPercent ?? 0)));
        const progressWidth = Math.max(0, Math.min(width, (progress / 100) * width));
        return { ...task, left, width, progress, progressWidth };
      });
  }, [tasks, earliest, latest, totalDuration]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Timeline</p>
          <h4 className="text-lg font-semibold text-slate-900">{timeline?.name ?? 'Delivery plan'}</h4>
        </div>
        <div className="text-xs text-slate-500">
          {timeline?.startDate && timeline?.endDate ? (
            <span>
              {formatRelativeTime(timeline.startDate)} → {formatRelativeTime(timeline.endDate)}
            </span>
          ) : (
            'Schedule to be confirmed'
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid grid-cols-4 gap-4 text-xs uppercase tracking-wide text-slate-400">
          <span>Phase</span>
          <span>Owner</span>
          <span>Progress</span>
          <span>Workload</span>
        </div>
        <div className="mt-3 space-y-3">
          {items.length ? (
            items.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm shadow-sm transition hover:border-accent/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.lane ?? 'Delivery'} • {task.ownerName ?? 'Unassigned'}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>
                      {formatRelativeTime(task.startDate)} → {formatRelativeTime(task.endDate)}
                    </p>
                    <p>{task.workloadHours ? `${task.workloadHours} hrs` : 'TBC workload'}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="relative h-3 rounded-full bg-slate-100">
                    <div
                      className="absolute inset-y-0 rounded-full opacity-30"
                      style={{
                        left: `${task.left}%`,
                        width: `${task.width}%`,
                        background: task.color || '#6366f1',
                      }}
                    />
                    <div
                      className="absolute inset-y-0 rounded-full"
                      style={{
                        left: `${task.left}%`,
                        width: `${task.progressWidth}%`,
                        background: task.color || '#6366f1',
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Status: {task.status ?? 'planned'}</span>
                    <span>Progress {Math.round(task.progress ?? 0)}%</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
              Add timeline tasks to visualise cross-functional delivery.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="font-semibold text-slate-900">Duration</p>
          <p className="mt-1 text-slate-500">{differenceInDays(earliest, latest)} days</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="font-semibold text-slate-900">Planned effort</p>
          <p className="mt-1 text-slate-500">
            {tasks.reduce((total, task) => total + (Number(task.workloadHours) || 0), 0)} hrs
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="font-semibold text-slate-900">Phases tracked</p>
          <p className="mt-1 text-slate-500">{tasks.length}</p>
        </div>
      </div>
    </div>
  );
}
