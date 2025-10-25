import { useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import WorkspaceDialog from '../WorkspaceDialog.jsx';

const INITIAL_FORM = {
  title: '',
  description: '',
  status: 'backlog',
  priority: 'medium',
  startDate: '',
  dueDate: '',
  estimatedHours: '',
};

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function ProjectTasksTab({ project, actions, canManage }) {
  const tasks = project.tasks ?? [];
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const createFormPrefix = useId();
  const editFormPrefix = useId();

  const createFieldIds = useMemo(
    () => ({
      title: `${createFormPrefix}-title`,
      description: `${createFormPrefix}-description`,
      status: `${createFormPrefix}-status`,
      priority: `${createFormPrefix}-priority`,
      startDate: `${createFormPrefix}-start`,
      dueDate: `${createFormPrefix}-due`,
      estimatedHours: `${createFormPrefix}-estimated-hours`,
    }),
    [createFormPrefix],
  );

  const editFieldIds = useMemo(
    () => ({
      title: `${editFormPrefix}-title`,
      description: `${editFormPrefix}-description`,
      status: `${editFormPrefix}-status`,
      priority: `${editFormPrefix}-priority`,
      startDate: `${editFormPrefix}-start`,
      dueDate: `${editFormPrefix}-due`,
      estimatedHours: `${editFormPrefix}-estimated-hours`,
    }),
    [editFormPrefix],
  );

  const stats = useMemo(() => {
    return STATUS_OPTIONS.map((option) => ({
      ...option,
      count: tasks.filter((task) => task.status === option.value).length,
    }));
  }, [tasks]);

  const handleChange = (event, setter) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createTask(project.id, {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
      });
      setForm(INITIAL_FORM);
      setCreateOpen(false);
      setFeedback({ status: 'success', message: 'Task created.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to create task.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setEditingForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'backlog',
      priority: task.priority || 'medium',
      startDate: task.startDate ? task.startDate.slice(0, 10) : '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      estimatedHours: task.estimatedHours ?? '',
    });
    setEditOpen(true);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateTask(project.id, editingId, {
        title: editingForm.title,
        description: editingForm.description,
        status: editingForm.status,
        priority: editingForm.priority,
        startDate: editingForm.startDate || null,
        dueDate: editingForm.dueDate || null,
        estimatedHours: editingForm.estimatedHours ? Number(editingForm.estimatedHours) : null,
      });
      setEditOpen(false);
      setEditingId(null);
      setFeedback({ status: 'success', message: 'Task updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update task.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteTask(project.id, taskId);
      setFeedback({ status: 'success', message: 'Task removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove task.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((status) => (
            <div key={status.value} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">{status.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{status.count}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(INITIAL_FORM);
            setCreateOpen(true);
          }}
          disabled={!canManage}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          New task
        </button>
      </div>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.status === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">Task</th>
              <th scope="col" className="px-4 py-3 text-left">Status</th>
              <th scope="col" className="px-4 py-3 text-left">Priority</th>
              <th scope="col" className="px-4 py-3 text-left">Dates</th>
              <th scope="col" className="px-4 py-3 text-right">Hours</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.length ? (
              tasks.map((task) => (
                <tr key={task.id} className="bg-white">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-600">{task.description}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{task.status?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">{task.priority}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {task.startDate ? new Date(task.startDate).toLocaleDateString('en-GB') : '—'} →{' '}
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{task.estimatedHours ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(task)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-sm text-slate-500">
                  No tasks recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <WorkspaceDialog
        open={createOpen}
        onClose={() => {
          if (!submitting) {
            setCreateOpen(false);
          }
        }}
        title="New task"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <label htmlFor={createFieldIds.title} className="font-medium text-slate-900">
              Title
            </label>
            <input
              id={createFieldIds.title}
              name="title"
              value={form.title}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              required
            />
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <label htmlFor={createFieldIds.description} className="font-medium text-slate-900">
              Description
            </label>
            <textarea
              id={createFieldIds.description}
              name="description"
              rows={3}
              value={form.description}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <label htmlFor={createFieldIds.status} className="font-medium text-slate-900">
                Status
              </label>
              <select
                id={createFieldIds.status}
                name="status"
                value={form.status}
                onChange={(event) => handleChange(event, setForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <label htmlFor={createFieldIds.priority} className="font-medium text-slate-900">
                Priority
              </label>
              <select
                id={createFieldIds.priority}
                name="priority"
                value={form.priority}
                onChange={(event) => handleChange(event, setForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <label htmlFor={createFieldIds.startDate} className="font-medium text-slate-900">
                Start
              </label>
              <input
                id={createFieldIds.startDate}
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={(event) => handleChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <label htmlFor={createFieldIds.dueDate} className="font-medium text-slate-900">
                Due
              </label>
              <input
                id={createFieldIds.dueDate}
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={(event) => handleChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <label htmlFor={createFieldIds.estimatedHours} className="font-medium text-slate-900">
              Estimated hours
            </label>
            <input
              id={createFieldIds.estimatedHours}
              type="number"
              name="estimatedHours"
              value={form.estimatedHours}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              min="0"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!submitting) {
                  setCreateOpen(false);
                }
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canManage || submitting}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Save task'}
            </button>
          </div>
        </form>
      </WorkspaceDialog>

      <WorkspaceDialog
        open={editOpen && Boolean(editingId)}
        onClose={() => {
          if (!submitting) {
            setEditOpen(false);
            setEditingId(null);
          }
        }}
        title="Edit task"
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <label htmlFor={editFieldIds.title} className="font-medium text-slate-900">
              Title
            </label>
            <input
              id={editFieldIds.title}
              name="title"
              value={editingForm.title}
              onChange={(event) => handleChange(event, setEditingForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              required
            />
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <label htmlFor={editFieldIds.description} className="font-medium text-slate-900">
              Description
            </label>
            <textarea
              id={editFieldIds.description}
              name="description"
              rows={3}
              value={editingForm.description}
              onChange={(event) => handleChange(event, setEditingForm)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <label htmlFor={editFieldIds.status} className="font-medium text-slate-900">
                Status
              </label>
              <select
                id={editFieldIds.status}
                name="status"
                value={editingForm.status}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <label htmlFor={editFieldIds.priority} className="font-medium text-slate-900">
                Priority
              </label>
              <select
                id={editFieldIds.priority}
                name="priority"
                value={editingForm.priority}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <label htmlFor={editFieldIds.startDate} className="font-medium text-slate-900">
                Start
              </label>
              <input
                id={editFieldIds.startDate}
                type="date"
                name="startDate"
                value={editingForm.startDate}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <label htmlFor={editFieldIds.dueDate} className="font-medium text-slate-900">
                Due
              </label>
              <input
                id={editFieldIds.dueDate}
                type="date"
                name="dueDate"
                value={editingForm.dueDate}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <label htmlFor={editFieldIds.estimatedHours} className="font-medium text-slate-900">
              Estimated hours
            </label>
            <input
              id={editFieldIds.estimatedHours}
              type="number"
              name="estimatedHours"
              value={editingForm.estimatedHours}
              onChange={(event) => handleChange(event, setEditingForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              min="0"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!submitting) {
                  setEditOpen(false);
                  setEditingId(null);
                }
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !canManage}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Update task'}
            </button>
          </div>
        </form>
      </WorkspaceDialog>
    </div>
  );
}

ProjectTasksTab.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  canManage: PropTypes.bool.isRequired,
};
