import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const INITIAL_DEPENDENCY_FORM = {
  taskId: '',
  dependsOnTaskId: '',
  lagDays: 0,
};

function daysBetween(start, end) {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  return Math.max(0, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
}

export default function GanttChartTab({ project, actions, canManage }) {
  const tasks = project.tasks ?? [];
  const dependencies = tasks.flatMap((task) => task.dependencies || []);
  const [form, setForm] = useState(INITIAL_DEPENDENCY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const timeline = useMemo(() => {
    return tasks
      .filter((task) => task.startDate && task.dueDate)
      .map((task) => {
        const durationDays = daysBetween(task.startDate, task.dueDate) ?? 0;
        return {
          id: task.id,
          title: task.title,
          startDate: task.startDate,
          dueDate: task.dueDate,
          durationDays,
          status: task.status,
        };
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [tasks]);

  const handleDependencyChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateDependency = async (event) => {
    event.preventDefault();
    if (!canManage || !form.taskId || !form.dependsOnTaskId) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createTaskDependency(project.id, Number(form.taskId), {
        dependsOnTaskId: Number(form.dependsOnTaskId),
        lagDays: Number(form.lagDays) || 0,
      });
      setForm(INITIAL_DEPENDENCY_FORM);
      setFeedback({ status: 'success', message: 'Dependency added.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to create dependency.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDependency = async (taskId, dependencyId) => {
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteTaskDependency(project.id, taskId, dependencyId);
      setFeedback({ status: 'success', message: 'Dependency removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove dependency.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h4 className="text-base font-semibold text-slate-900">Timeline overview</h4>
        <p className="mt-2 text-sm text-slate-600">
          Tasks with dates are visualised below. Ensure each track has a start and end date to render on the timeline.
        </p>
        <div className="mt-4 space-y-3">
          {timeline.length ? (
            timeline.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{item.status?.replace(/_/g, ' ')}</p>
                  </div>
                  <p>
                    {new Date(item.startDate).toLocaleDateString('en-GB')} → {new Date(item.dueDate).toLocaleDateString('en-GB')} ({item.durationDays} days)
                  </p>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${Math.min(100, (item.durationDays / (timeline.at(-1)?.durationDays || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
              Add start and end dates to your tasks to visualise a Gantt timeline.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h4 className="text-base font-semibold text-slate-900">Task dependencies</h4>
        <div className="mt-4 space-y-3">
          {dependencies.length ? (
            dependencies.map((dependency) => {
              const task = tasks.find((candidate) => candidate.id === dependency.taskId);
              const prerequisite = tasks.find((candidate) => candidate.id === dependency.dependsOnTaskId);
              return (
                <div key={dependency.id || `${dependency.taskId}-${dependency.dependsOnTaskId}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-900">{task?.title || `Task #${dependency.taskId}`}</span> depends on{' '}
                      <span className="font-semibold text-slate-900">{prerequisite?.title || `Task #${dependency.dependsOnTaskId}`}</span>
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Lag: {dependency.lagDays ?? 0} days</p>
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteDependency(dependency.taskId, dependency.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={submitting}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
              No dependencies have been recorded yet.
            </p>
          )}
        </div>
        <form onSubmit={handleCreateDependency} className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Task
            <select
              name="taskId"
              value={form.taskId}
              onChange={handleDependencyChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            >
              <option value="">Select task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Depends on
            <select
              name="dependsOnTaskId"
              value={form.dependsOnTaskId}
              onChange={handleDependencyChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            >
              <option value="">Select prerequisite</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Lag (days)
            <input
              type="number"
              name="lagDays"
              value={form.lagDays}
              onChange={handleDependencyChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            />
          </label>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={!canManage || submitting || !form.taskId || !form.dependsOnTaskId}
              className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Add dependency'}
            </button>
          </div>
          {feedback ? (
            <p className={`md:col-span-3 text-sm ${feedback.status === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {feedback.message}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

GanttChartTab.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.shape({
    createTaskDependency: PropTypes.func.isRequired,
    deleteTaskDependency: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

GanttChartTab.defaultProps = {
  canManage: true,
};
