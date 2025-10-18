import PropTypes from 'prop-types';

const STATUS_FLOW = ['backlog', 'in_progress', 'blocked', 'completed'];

const STATUS_LABELS = {
  backlog: 'Backlog',
  in_progress: 'In progress',
  blocked: 'Blocked',
  completed: 'Completed',
};

function nextStatus(status) {
  const index = STATUS_FLOW.indexOf(status);
  if (index === -1 || index === STATUS_FLOW.length - 1) {
    return status;
  }
  return STATUS_FLOW[index + 1];
}

function previousStatus(status) {
  const index = STATUS_FLOW.indexOf(status);
  if (index <= 0) {
    return status;
  }
  return STATUS_FLOW[index - 1];
}

export default function TaskBoardTab({ project, actions, canManage }) {
  const tasks = project.tasks ?? [];
  const grouped = STATUS_FLOW.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  }));

  const handleMove = async (task, direction) => {
    if (!canManage) {
      return;
    }
    const targetStatus = direction === 'forward' ? nextStatus(task.status) : previousStatus(task.status);
    if (targetStatus === task.status) {
      return;
    }
    await actions.updateTask(project.id, task.id, { status: targetStatus });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {grouped.map((column) => (
        <section key={column.status} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4">
          <header className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">{STATUS_LABELS[column.status]}</h4>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {column.tasks.length}
            </span>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {column.tasks.length ? (
              column.tasks.map((task) => (
                <article key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <h5 className="text-sm font-semibold text-slate-900">{task.title}</h5>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Priority: {task.priority}</p>
                  <p className="mt-2 text-sm text-slate-600">{task.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white px-2 py-1 shadow-sm">
                      {task.startDate ? new Date(task.startDate).toLocaleDateString('en-GB') : '—'} →{' '}
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : '—'}
                    </span>
                    {task.estimatedHours ? (
                      <span className="rounded-full bg-white px-2 py-1 shadow-sm">{task.estimatedHours}h</span>
                    ) : null}
                  </div>
                  {canManage ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleMove(task, 'backward')}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={task.status === STATUS_FLOW[0]}
                      >
                        Move back
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(task, 'forward')}
                        className="rounded-full border border-accent px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={task.status === STATUS_FLOW[STATUS_FLOW.length - 1]}
                      >
                        Advance
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4 text-xs text-slate-500">
                No tasks in this column yet.
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

TaskBoardTab.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.shape({
    updateTask: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

TaskBoardTab.defaultProps = {
  canManage: true,
};
