import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';

const DEFAULT_STATUSES = ['planned', 'in_progress', 'blocked', 'completed'];

const STATUS_LABELS = {
  planned: 'Planned',
  in_progress: 'In progress',
  blocked: 'Blocked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_ACCENTS = {
  planned: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-sky-100 text-sky-700',
  blocked: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

function normaliseStatus(status, fallback = 'planned') {
  if (!status) {
    return fallback;
  }
  const key = String(status).toLowerCase();
  if (DEFAULT_STATUSES.includes(key)) {
    return key;
  }
  if (key === 'canceled') {
    return 'cancelled';
  }
  return ['cancelled'].includes(key) ? key : fallback;
}

function nextStatus(status, statuses) {
  const index = statuses.indexOf(status);
  if (index === -1 || index === statuses.length - 1) {
    return status;
  }
  return statuses[index + 1];
}

function previousStatus(status, statuses) {
  const index = statuses.indexOf(status);
  if (index <= 0) {
    return status;
  }
  return statuses[index - 1];
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatPriority(priority) {
  if (!priority) {
    return 'Normal';
  }
  const label = String(priority).replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function TaskCard({ task, canManage = true, onMoveForward, onMoveBackward, onFocus }) {
  const dueSoon = task.dueDate
    ? (() => {
        const due = new Date(task.dueDate);
        if (Number.isNaN(due.getTime())) {
          return false;
        }
        const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff <= 3;
      })()
    : false;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h5 className="text-sm font-semibold text-slate-900">{task.title}</h5>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Priority {formatPriority(task.priority)}</p>
        </div>
        <button
          type="button"
          onClick={() => onFocus(task)}
          className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
        >
          Inspect
        </button>
      </div>
      {task.description ? <p className="text-sm text-slate-600 line-clamp-3">{task.description}</p> : null}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1">
          {formatDate(task.startDate)} → {formatDate(task.dueDate)}
        </span>
        {task.estimatedHours ? (
          <span className="rounded-full bg-slate-100 px-2 py-1">{task.estimatedHours}h</span>
        ) : null}
        {Array.isArray(task.assignments) && task.assignments.length ? (
          <span className="rounded-full bg-slate-100 px-2 py-1">
            {task.assignments.length} assignee{task.assignments.length === 1 ? '' : 's'}
          </span>
        ) : null}
        {dueSoon ? <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Due soon</span> : null}
      </div>
      {canManage ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMoveBackward}
            disabled={!onMoveBackward}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Move back
          </button>
          <button
            type="button"
            onClick={onMoveForward}
            disabled={!onMoveForward}
            className="rounded-full border border-accent px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Advance
          </button>
        </div>
      ) : null}
    </article>
  );
}

TaskCard.propTypes = {
  task: PropTypes.object.isRequired,
  canManage: PropTypes.bool,
  onMoveForward: PropTypes.func,
  onMoveBackward: PropTypes.func,
  onFocus: PropTypes.func.isRequired,
};

function TaskDetails({ task = null, onClose }) {
  if (!task) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
        Select a task to see the full context, activity, and dependencies.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Task focus</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-900">{task.title}</h4>
          <p className="mt-2 text-sm text-slate-600">{task.description || 'No description provided yet.'}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
        >
          Close
        </button>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-800">{STATUS_LABELS[normaliseStatus(task.status)]}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Priority</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-800">{formatPriority(task.priority)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Schedule</dt>
          <dd className="mt-1 text-sm text-slate-700">
            {formatDate(task.startDate)} → {formatDate(task.dueDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Estimated effort</dt>
          <dd className="mt-1 text-sm text-slate-700">{task.estimatedHours ? `${task.estimatedHours} hours` : '—'}</dd>
        </div>
      </dl>
      <div className="mt-6 space-y-4">
        <div>
          <h5 className="text-xs uppercase tracking-wide text-slate-500">Assignments</h5>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
            {Array.isArray(task.assignments) && task.assignments.length ? (
              task.assignments.map((assignment) => (
                <li key={assignment.id} className="rounded-full bg-slate-100 px-3 py-1">
                  {assignment.assigneeName || assignment.assigneeEmail || assignment.assigneeRole || assignment.id}
                </li>
              ))
            ) : (
              <li className="rounded-full bg-slate-100 px-3 py-1">No collaborators yet.</li>
            )}
          </ul>
        </div>
        <div>
          <h5 className="text-xs uppercase tracking-wide text-slate-500">Dependencies</h5>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
            {Array.isArray(task.dependencies) && task.dependencies.length ? (
              task.dependencies.map((dependency) => (
                <li key={dependency.id} className="rounded-full bg-slate-100 px-3 py-1">
                  {dependency.dependsOnTaskTitle || dependency.dependsOnTaskId}
                </li>
              ))
            ) : (
              <li className="rounded-full bg-slate-100 px-3 py-1">No dependencies captured.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

TaskDetails.propTypes = {
  task: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default function TaskKanban({ project, actions, canManage = true }) {
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
  const statuses = useMemo(() => {
    const discovered = Array.from(new Set(tasks.map((task) => normaliseStatus(task.status))));
    const base = DEFAULT_STATUSES.filter((status) => discovered.includes(status));
    const extras = discovered.filter((status) => !DEFAULT_STATUSES.includes(status));
    const combined = [...(base.length ? base : DEFAULT_STATUSES), ...extras];
    return combined.length ? combined : DEFAULT_STATUSES;
  }, [tasks]);

  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [focusedTask, setFocusedTask] = useState(null);

  const owners = useMemo(() => {
    const lookup = new Map();
    tasks.forEach((task) => {
      if (!Array.isArray(task.assignments)) return;
      task.assignments.forEach((assignment) => {
        const key =
          assignment.assigneeEmail || assignment.assigneeName || assignment.assigneeRole || assignment.id;
        if (!key) return;
        const label =
          assignment.assigneeName || assignment.assigneeEmail || assignment.assigneeRole || String(key);
        lookup.set(String(key), label);
      });
    });
    return Array.from(lookup.entries()).map(([id, label]) => ({ id, label }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = search
        ? [task.title, task.description, task.priority]
            .filter(Boolean)
            .some((value) => value.toString().toLowerCase().includes(search.toLowerCase()))
        : true;
      if (!matchesSearch) {
        return false;
      }
      if (ownerFilter !== 'all') {
        const hasOwner = Array.isArray(task.assignments)
          ? task.assignments.some((assignment) => {
              const key =
                assignment.assigneeEmail || assignment.assigneeName || assignment.assigneeRole || assignment.id;
              return key && String(key) === ownerFilter;
            })
          : false;
        if (!hasOwner) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, search, ownerFilter]);

  const grouped = useMemo(() => {
    return statuses.map((status) => ({
      status,
      tasks: filteredTasks.filter((task) => normaliseStatus(task.status) === status),
    }));
  }, [filteredTasks, statuses]);

  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => normaliseStatus(task.status) === 'completed').length;
    const blocked = tasks.filter((task) => normaliseStatus(task.status) === 'blocked').length;
    const dueSoon = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      if (Number.isNaN(due.getTime())) return false;
      const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    return {
      total,
      completed,
      blocked,
      dueSoon,
    };
  }, [tasks]);

  const handleMove = async (task, direction) => {
    if (!canManage) {
      return;
    }
    const currentStatus = normaliseStatus(task.status);
    const targetStatus = direction === 'forward' ? nextStatus(currentStatus, statuses) : previousStatus(currentStatus, statuses);
    if (targetStatus === currentStatus || (direction === 'forward' && targetStatus === 'cancelled')) {
      return;
    }
    await actions.updateTask(project.id, task.id, { status: targetStatus });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Execution board</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-900">Task Kanban</h4>
          <p className="mt-2 text-sm text-slate-600">
            Keep every initiative flowing. Filter by assignee, spotlight blockers, and accelerate delivery by promoting clarity.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-center text-xs uppercase tracking-wide text-slate-500 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-100 px-3 py-2">
            <dt>Total</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">{summary.total}</dd>
          </div>
          <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-emerald-700">
            <dt>Completed</dt>
            <dd className="mt-1 text-base font-semibold">{summary.completed}</dd>
          </div>
          <div className="rounded-2xl bg-rose-100 px-3 py-2 text-rose-700">
            <dt>Blocked</dt>
            <dd className="mt-1 text-base font-semibold">{summary.blocked}</dd>
          </div>
          <div className="rounded-2xl bg-amber-100 px-3 py-2 text-amber-700">
            <dt>Due soon</dt>
            <dd className="mt-1 text-base font-semibold">{summary.dueSoon}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks, priorities, or notes"
                className="flex-1 min-w-[160px] rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <select
                value={ownerFilter}
                onChange={(event) => setOwnerFilter(event.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="all">All collaborators</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={String(owner.id)}>
                    {owner.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setFocusedTask(null)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
            >
              Clear focus
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-4 lg:grid-cols-2">
            {grouped.map((column) => (
              <section key={column.status} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
                <header className="mb-3 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">{STATUS_LABELS[column.status] || column.status}</h5>
                    <p className="text-xs text-slate-500">
                      {column.tasks.length} task{column.tasks.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className={classNames('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide', STATUS_ACCENTS[column.status] || 'bg-slate-200 text-slate-600')}>
                    {STATUS_LABELS[column.status] || column.status}
                  </span>
                </header>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {column.tasks.length ? (
                    column.tasks.map((task) => {
                      const normalisedStatus = normaliseStatus(task.status);
                      const forwardTarget = nextStatus(normalisedStatus, statuses);
                      const backwardEnabled = canManage && normalisedStatus !== statuses[0];
                      const forwardEnabled =
                        canManage &&
                        normalisedStatus !== statuses[statuses.length - 1] &&
                        forwardTarget !== normalisedStatus &&
                        forwardTarget !== 'cancelled';
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          canManage={canManage}
                          onFocus={setFocusedTask}
                          onMoveBackward={backwardEnabled ? () => handleMove(task, 'backward') : undefined}
                          onMoveForward={forwardEnabled ? () => handleMove(task, 'forward') : undefined}
                        />
                      );
                    })
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs text-slate-500">
                      No tasks in this column yet.
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <TaskDetails task={focusedTask} onClose={() => setFocusedTask(null)} />
        </div>
      </section>
    </div>
  );
}

TaskKanban.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.shape({
    updateTask: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};
