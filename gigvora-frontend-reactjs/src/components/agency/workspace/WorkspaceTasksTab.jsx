import { useMemo, useState } from 'react';
import WorkspaceModal from './WorkspaceModal.jsx';
import WorkspaceGanttChart from './WorkspaceGanttChart.jsx';

const STATUS_OPTIONS = ['planned', 'in_progress', 'blocked', 'completed', 'cancelled'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric' }).format(date);
}

export default function WorkspaceTasksTab({ tasks = [], onCreate, onUpdate, onDelete }) {
  const [formState, setFormState] = useState(null);

  const lanes = useMemo(() => {
    const grouped = new Map();
    tasks.forEach((task) => {
      const key = task.lane || 'General';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(task);
    });
    return Array.from(grouped.entries()).map(([lane, laneTasks]) => [
      lane,
      laneTasks.slice().sort((a, b) => new Date(a.dueDate || a.startDate || 0) - new Date(b.dueDate || b.startDate || 0)),
    ]);
  }, [tasks]);

  const handleOpenCreate = () => {
    setFormState({
      title: '',
      description: '',
      assigneeName: '',
      assigneeEmail: '',
      status: 'planned',
      priority: 'medium',
      lane: '',
      startDate: '',
      dueDate: '',
      estimatedHours: '',
      loggedHours: '',
      progressPercent: 0,
    });
  };

  const handleOpenEdit = (task) => {
    setFormState({
      id: task.id,
      title: task.title ?? '',
      description: task.description ?? '',
      assigneeName: task.assigneeName ?? '',
      assigneeEmail: task.assigneeEmail ?? '',
      status: task.status ?? 'planned',
      priority: task.priority ?? 'medium',
      lane: task.lane ?? '',
      startDate: task.startDate ? task.startDate.slice(0, 10) : '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      estimatedHours: task.estimatedHours ?? '',
      loggedHours: task.loggedHours ?? '',
      progressPercent: task.progressPercent ?? 0,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState?.title) {
      return;
    }
    const payload = {
      title: formState.title,
      description: formState.description,
      assigneeName: formState.assigneeName,
      assigneeEmail: formState.assigneeEmail,
      status: formState.status,
      priority: formState.priority,
      lane: formState.lane,
      startDate: formState.startDate,
      dueDate: formState.dueDate,
      estimatedHours: formState.estimatedHours,
      loggedHours: formState.loggedHours,
      progressPercent: formState.progressPercent,
    };
    if (formState.id) {
      onUpdate?.(formState.id, payload);
    } else {
      onCreate?.(payload);
    }
    setFormState(null);
  };

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Delivery tasks</h2>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
          >
            Add task
          </button>
        </div>

        <div className="mt-4 space-y-6">
          {lanes.map(([lane, laneTasks]) => (
            <div key={lane} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{lane}</h3>
                <span className="text-xs text-slate-400">{laneTasks.length} task(s)</span>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Owner</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Priority</th>
                      <th className="px-4 py-2 text-left">Start</th>
                      <th className="px-4 py-2 text-left">Due</th>
                      <th className="px-4 py-2 text-right">Progress</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {laneTasks.map((task) => (
                      <tr key={task.id} className="text-slate-600">
                        <td className="px-4 py-2 font-medium text-slate-900">{task.title}</td>
                        <td className="px-4 py-2">{task.assigneeName || 'Unassigned'}</td>
                        <td className="px-4 py-2 text-xs uppercase text-slate-500">{task.status?.replace(/_/g, ' ') ?? 'planned'}</td>
                        <td className="px-4 py-2 text-xs uppercase text-slate-500">{task.priority?.replace(/_/g, ' ') ?? 'medium'}</td>
                        <td className="px-4 py-2">{formatDate(task.startDate)}</td>
                        <td className="px-4 py-2">{formatDate(task.dueDate)}</td>
                        <td className="px-4 py-2 text-right">{Number(task.progressPercent ?? 0)}%</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(task)}
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete?.(task.id)}
                              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No tasks captured yet. Create tasks to activate the workspace timeline.
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
        <p className="text-xs text-slate-500">Gantt view of the current plan.</p>
        <div className="mt-4">
          <WorkspaceGanttChart tasks={tasks} />
        </div>
      </div>

      <WorkspaceModal
        open={formState !== null}
        title={formState?.id ? 'Edit task' : 'New task'}
        description="Clarify ownership, deadlines, and progress in a focused panel."
        onClose={() => setFormState(null)}
        size="lg"
      >
        {formState ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
              <input
                type="text"
                value={formState.title ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lane
              <input
                type="text"
                value={formState.lane ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), lane: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Delivery"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={formState.status ?? 'planned'}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Priority
              <select
                value={formState.priority ?? 'medium'}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), priority: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assignee name
              <input
                type="text"
                value={formState.assigneeName ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), assigneeName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assignee email
              <input
                type="email"
                value={formState.assigneeEmail ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), assigneeEmail: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Start date
              <input
                type="date"
                value={formState.startDate ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), startDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due date
              <input
                type="date"
                value={formState.dueDate ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), dueDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estimated hours
              <input
                type="number"
                step="0.1"
                value={formState.estimatedHours ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), estimatedHours: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Logged hours
              <input
                type="number"
                step="0.1"
                value={formState.loggedHours ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), loggedHours: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Progress (%)
              <input
                type="number"
                min="0"
                max="100"
                value={formState.progressPercent ?? 0}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), progressPercent: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
              <textarea
                value={formState.description ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), description: event.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormState(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {formState.id ? 'Save task' : 'Create task'}
              </button>
            </div>
          </form>
        ) : null}
      </WorkspaceModal>
    </div>
  );
}
