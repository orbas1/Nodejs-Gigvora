import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const PRIORITY_TOKENS = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-sky-100 text-sky-700',
  low: 'bg-slate-100 text-slate-600',
};

const STATUS_BG = {
  backlog: 'from-slate-100 via-white to-slate-50',
  ready: 'from-sky-100 via-white to-slate-50',
  in_progress: 'from-indigo-100 via-white to-slate-50',
  review: 'from-amber-100 via-white to-slate-50',
  completed: 'from-emerald-100 via-white to-slate-50',
};

const VIEW_MODES = ['kanban', 'table'];

const DEFAULT_COLUMNS = [
  {
    id: 'backlog',
    title: 'Backlog',
    limit: 0,
    tasks: [
      {
        id: 'discovery',
        title: 'Synthesize discovery insights',
        owner: 'Nina',
        status: 'backlog',
        dueDate: new Date().setDate(new Date().getDate() + 5),
        priority: 'medium',
        tags: ['research'],
        effort: 3,
      },
    ],
  },
  {
    id: 'in_progress',
    title: 'In progress',
    limit: 6,
    tasks: [
      {
        id: 'prototype',
        title: 'Interactive prototype polish',
        owner: 'Jordan',
        status: 'in_progress',
        dueDate: new Date().setDate(new Date().getDate() + 2),
        priority: 'critical',
        tags: ['design', 'review'],
        effort: 5,
      },
      {
        id: 'copy',
        title: 'Draft executive comms',
        owner: 'Mia',
        status: 'in_progress',
        dueDate: new Date().setDate(new Date().getDate() + 1),
        priority: 'high',
        tags: ['comms'],
        effort: 2,
      },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    limit: 4,
    tasks: [
      {
        id: 'compliance',
        title: 'Compliance sign-off',
        owner: 'Noah',
        status: 'review',
        dueDate: new Date().setDate(new Date().getDate() + 3),
        priority: 'medium',
        tags: ['governance'],
        effort: 2,
      },
    ],
  },
  {
    id: 'completed',
    title: 'Completed',
    limit: 0,
    tasks: [
      {
        id: 'handover',
        title: 'Publish knowledge base handover',
        owner: 'Amina',
        status: 'completed',
        dueDate: new Date().setDate(new Date().getDate() - 1),
        priority: 'medium',
        tags: ['handover'],
        effort: 1,
      },
    ],
  },
];

const FILTER_PRESETS = [
  { id: 'all', label: 'All work' },
  { id: 'due-soon', label: 'Due in 48h' },
  { id: 'at-risk', label: 'At risk' },
  { id: 'blocked', label: 'Blocked' },
];

function formatDate(value) {
  if (!value) return 'No due date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No due date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function isDueSoon(task) {
  if (!task.dueDate) return false;
  const now = Date.now();
  const due = new Date(task.dueDate).getTime();
  const diff = due - now;
  return diff <= 1000 * 60 * 60 * 48 && diff >= 0;
}

function isAtRisk(task) {
  return task.status !== 'completed' && task.priority === 'critical';
}

function calculateUtilisation(columns) {
  return columns.map((column) => {
    if (!column.limit) {
      return { id: column.id, utilisation: 0 };
    }
    const utilisation = (column.tasks.length / column.limit) * 100;
    return { id: column.id, utilisation };
  });
}

function TaskCard({ task, columns, onStatusChange, onInspect }) {
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(
          'application/json',
          JSON.stringify({ taskId: task.id, from: task.status }),
        );
      }}
      className="group flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
          <p className="mt-1 text-xs text-slate-500">Owner {task.owner}</p>
        </div>
        <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', PRIORITY_TOKENS[task.priority] ?? 'bg-slate-100 text-slate-600')}>
          {task.priority}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
          {formatDate(task.dueDate)}
        </span>
        {task.tags?.map((tag) => (
          <span key={tag} className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-600">
            #{tag}
          </span>
        ))}
        {task.effort ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600">{task.effort} pts</span> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <label className="flex items-center gap-2">
          <span>Status</span>
          <select
            value={task.status}
            onChange={(event) => onStatusChange?.(task, event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 focus:border-indigo-400 focus:outline-none"
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => onInspect?.(task)}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
        >
          Inspect
        </button>
      </div>
    </article>
  );
}

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    owner: PropTypes.string,
    status: PropTypes.string.isRequired,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    priority: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    effort: PropTypes.number,
  }).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onStatusChange: PropTypes.func,
  onInspect: PropTypes.func,
};

TaskCard.defaultProps = {
  onStatusChange: undefined,
  onInspect: undefined,
};

export default function TaskKanban({ columns, onTaskMove, onTaskInspect, title, viewMode: initialView }) {
  const [boardColumns, setBoardColumns] = useState(() => columns?.map((column) => ({ ...column, tasks: column.tasks?.map((task) => ({ ...task })) ?? [] })) ?? DEFAULT_COLUMNS);
  const [search, setSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [activePreset, setActivePreset] = useState('all');
  const [viewMode, setViewMode] = useState(initialView && VIEW_MODES.includes(initialView) ? initialView : 'kanban');
  const [inspectedTask, setInspectedTask] = useState(null);

  useEffect(() => {
    if (columns) {
      setBoardColumns(columns.map((column) => ({ ...column, tasks: column.tasks?.map((task) => ({ ...task })) ?? [] })));
    }
  }, [columns]);

  const owners = useMemo(() => {
    const set = new Set();
    boardColumns.forEach((column) => {
      column.tasks?.forEach((task) => {
        if (task.owner) {
          set.add(task.owner);
        }
      });
    });
    return Array.from(set);
  }, [boardColumns]);

  const utilisation = useMemo(() => calculateUtilisation(boardColumns), [boardColumns]);

  const filteredColumns = useMemo(() => {
    return boardColumns.map((column) => {
      const tasks = column.tasks?.filter((task) => {
        if (selectedOwner !== 'all' && task.owner !== selectedOwner) {
          return false;
        }
        if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
          return false;
        }
        if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        if (activePreset === 'due-soon' && !isDueSoon(task)) {
          return false;
        }
        if (activePreset === 'at-risk' && !isAtRisk(task)) {
          return false;
        }
        if (activePreset === 'blocked' && task.status !== 'review') {
          return false;
        }
        return true;
      });
      return { ...column, tasks };
    });
  }, [boardColumns, selectedOwner, selectedPriority, search, activePreset]);

  const allTasks = useMemo(() => filteredColumns.flatMap((column) => column.tasks ?? []), [filteredColumns]);

  const summary = useMemo(() => {
    const dueSoon = allTasks.filter((task) => isDueSoon(task)).length;
    const atRisk = allTasks.filter((task) => isAtRisk(task)).length;
    const completed = allTasks.filter((task) => task.status === 'completed').length;
    return { total: allTasks.length, dueSoon, atRisk, completed };
  }, [allTasks]);

  const handleDrop = useCallback(
    (event, targetColumnId) => {
      event.preventDefault();
      const payload = event.dataTransfer.getData('application/json');
      if (!payload) return;
      try {
        const { taskId, from } = JSON.parse(payload);
        if (!taskId || !from) return;

        setBoardColumns((prev) => {
          const next = prev.map((column) => ({ ...column, tasks: column.tasks?.map((task) => ({ ...task })) ?? [] }));
          const sourceColumn = next.find((column) => column.id === from);
          const destinationColumn = next.find((column) => column.id === targetColumnId);
          if (!sourceColumn || !destinationColumn) {
            return prev;
          }
          const taskIndex = sourceColumn.tasks.findIndex((item) => item.id === taskId);
          if (taskIndex === -1) {
            return prev;
          }
          const [task] = sourceColumn.tasks.splice(taskIndex, 1);
          task.status = targetColumnId;
          destinationColumn.tasks.splice(0, 0, task);
          onTaskMove?.(task, from, targetColumnId);
          return next;
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse drag payload', error);
      }
    },
    [onTaskMove],
  );

  function handleStatusChange(task, status) {
    setBoardColumns((prev) => {
      const next = prev.map((column) => ({ ...column, tasks: column.tasks?.map((t) => ({ ...t })) ?? [] }));
      const currentColumn = next.find((column) => column.id === task.status);
      const destinationColumn = next.find((column) => column.id === status);
      if (!currentColumn || !destinationColumn) {
        return prev;
      }
      currentColumn.tasks = currentColumn.tasks.filter((item) => item.id !== task.id);
      const updatedTask = { ...task, status };
      destinationColumn.tasks = [updatedTask, ...destinationColumn.tasks];
      onTaskMove?.(updatedTask, task.status, status);
      return next;
    });
  }

  function renderKanban() {
    return (
      <div className="grid gap-4 lg:grid-cols-4">
        {filteredColumns.map((column) => {
          const gradient = STATUS_BG[column.id] ?? 'from-slate-100 via-white to-slate-50';
          const columnUtilisation = utilisation.find((item) => item.id === column.id)?.utilisation ?? 0;
          const overLimit = column.limit && column.tasks.length > column.limit;

          return (
            <section
              key={column.id}
              className={clsx(
                'flex min-h-[420px] flex-col gap-4 rounded-[32px] border border-slate-200 bg-gradient-to-b p-4 transition',
                gradient,
              )}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => handleDrop(event, column.id)}
            >
              <header className="flex flex-wrap items-center gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{column.title}</h3>
                  <p className="text-xs text-slate-500">{column.tasks.length} tasks</p>
                </div>
                {column.limit ? (
                  <span
                    className={clsx(
                      'ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                      overLimit ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700',
                    )}
                  >
                    WIP {column.tasks.length}/{column.limit}
                  </span>
                ) : null}
              </header>
              <div className="space-y-3">
                {column.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    columns={boardColumns}
                    onStatusChange={handleStatusChange}
                    onInspect={setInspectedTask}
                  />
                ))}
                {!column.tasks.length ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                    Drop work here to populate the lane.
                  </div>
                ) : null}
              </div>
              <footer className="mt-auto flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
                <span>Utilisation</span>
                <span>{columnUtilisation ? `${columnUtilisation.toFixed(0)}%` : '—'}</span>
              </footer>
            </section>
          );
        })}
      </div>
    );
  }

  function renderTable() {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Task</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Due</th>
              <th className="px-4 py-3 text-left">Tags</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredColumns.flatMap((column) =>
              column.tasks.map((task) => (
                <tr key={`table-${task.id}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold">{task.title}</td>
                  <td className="px-4 py-3">{task.owner ?? 'Unassigned'}</td>
                  <td className="px-4 py-3">{boardColumns.find((col) => col.id === task.status)?.title ?? task.status}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('rounded-full px-2.5 py-1 text-xs font-medium', PRIORITY_TOKENS[task.priority] ?? 'bg-slate-100 text-slate-600')}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(task.dueDate)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{task.tags?.join(', ')}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setInspectedTask(task)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-6 rounded-[40px] border border-slate-200 bg-white/80 p-8 shadow-lg shadow-slate-900/5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Task operations</p>
          <h2 className="text-2xl font-semibold text-slate-900">{title ?? 'Operational kanban'}</h2>
          <p className="max-w-xl text-sm text-slate-600">
            Personalise filters, enforce WIP discipline, and flow tasks across lanes with drag-and-drop interactions mirroring
            leading productivity suites. Keyboard actions stay available through the status selector on every card.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={clsx(
                'rounded-full border px-3 py-1 font-semibold capitalize transition',
                viewMode === mode
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-600 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
          <p className="text-2xl font-semibold text-slate-900">{summary.total}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Due in 48h</p>
          <p className="text-2xl font-semibold text-amber-600">{summary.dueSoon}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">At risk</p>
          <p className="text-2xl font-semibold text-rose-600">{summary.atRisk}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
          <p className="text-2xl font-semibold text-emerald-600">{summary.completed}</p>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 text-xs text-slate-500">
        <div className="flex flex-wrap gap-2">
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setActivePreset(preset.id)}
              className={clsx(
                'rounded-full border px-3 py-1 font-semibold transition',
                activePreset === preset.id
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span>Owner</span>
          <select
            value={selectedOwner}
            onChange={(event) => setSelectedOwner(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 focus:border-indigo-400 focus:outline-none"
          >
            <option value="all">Everyone</option>
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Priority</span>
          <select
            value={selectedPriority}
            onChange={(event) => setSelectedPriority(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 focus:border-indigo-400 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">Search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none"
          />
        </label>
      </section>

      {viewMode === 'kanban' ? renderKanban() : renderTable()}

      {inspectedTask ? (
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{inspectedTask.title}</h3>
              <p className="mt-1 text-sm text-slate-600">Owned by {inspectedTask.owner ?? 'Unassigned'} · Due {formatDate(inspectedTask.dueDate)}</p>
            </div>
            <button
              type="button"
              onClick={() => setInspectedTask(null)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
            >
              Close
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Context</h4>
              <p className="mt-2">
                {inspectedTask.context ??
                  'Surface context, notes, and relevant documents here to keep reviewers aligned with enterprise expectations.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collaboration</h4>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                <li>Priority: {inspectedTask.priority}</li>
                <li>Tags: {inspectedTask.tags?.join(', ') ?? '—'}</li>
                <li>Effort: {inspectedTask.effort ?? '—'} pts</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onTaskInspect?.(inspectedTask)}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open in detail view
            </button>
            <button
              type="button"
              onClick={() => setInspectedTask(null)}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

TaskKanban.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      limit: PropTypes.number,
      tasks: PropTypes.arrayOf(TaskCard.propTypes.task),
    }),
  ),
  onTaskMove: PropTypes.func,
  onTaskInspect: PropTypes.func,
  title: PropTypes.string,
  viewMode: PropTypes.oneOf(VIEW_MODES),
};

TaskKanban.defaultProps = {
  columns: undefined,
  onTaskMove: undefined,
  onTaskInspect: undefined,
  title: undefined,
  viewMode: 'kanban',
};
