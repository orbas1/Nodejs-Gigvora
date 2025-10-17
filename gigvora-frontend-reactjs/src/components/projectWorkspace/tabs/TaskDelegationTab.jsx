import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const ASSIGNMENT_FORM = {
  assigneeName: '',
  assigneeEmail: '',
  assigneeRole: '',
  allocationHours: '',
  status: 'assigned',
};

const ASSIGNMENT_STATUSES = ['assigned', 'accepted', 'in_progress', 'completed'];

export default function TaskDelegationTab({ project, actions, canManage }) {
  const tasks = project.tasks ?? [];
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? null);
  const [form, setForm] = useState(ASSIGNMENT_FORM);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editingForm, setEditingForm] = useState(ASSIGNMENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (tasks.length && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  const activeTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) ?? null, [tasks, selectedTaskId]);
  const assignments = activeTask?.assignments ?? [];

  const handleChange = (event, setter) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage || !activeTask) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createTaskAssignment(project.id, activeTask.id, {
        assigneeName: form.assigneeName,
        assigneeEmail: form.assigneeEmail || null,
        assigneeRole: form.assigneeRole || null,
        allocationHours: form.allocationHours ? Number(form.allocationHours) : null,
        status: form.status,
      });
      setForm(ASSIGNMENT_FORM);
      setFeedback({ status: 'success', message: 'Assignment created.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to create assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (assignment) => {
    setEditingAssignmentId(assignment.id);
    setEditingForm({
      assigneeName: assignment.assigneeName || '',
      assigneeEmail: assignment.assigneeEmail || '',
      assigneeRole: assignment.assigneeRole || '',
      allocationHours: assignment.allocationHours ?? '',
      status: assignment.status || 'assigned',
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage || !activeTask) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateTaskAssignment(project.id, activeTask.id, editingAssignmentId, {
        assigneeName: editingForm.assigneeName,
        assigneeEmail: editingForm.assigneeEmail || null,
        assigneeRole: editingForm.assigneeRole || null,
        allocationHours: editingForm.allocationHours ? Number(editingForm.allocationHours) : null,
        status: editingForm.status,
      });
      setEditingAssignmentId(null);
      setFeedback({ status: 'success', message: 'Assignment updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!canManage || !activeTask) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteTaskAssignment(project.id, activeTask.id, assignmentId);
      setFeedback({ status: 'success', message: 'Assignment removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-900">Task delegation</h4>
          <p className="text-sm text-slate-600">
            Assign collaborators to tasks, capture effort, and monitor handoffs.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span>Task:</span>
          <select
            value={selectedTaskId ?? ''}
            onChange={(event) => setSelectedTaskId(Number(event.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          >
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h5 className="text-sm font-semibold text-slate-900">Assignments</h5>
        <div className="mt-3 space-y-3">
          {assignments.length ? (
            assignments.map((assignment) => (
              <div key={assignment.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{assignment.assigneeName}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{assignment.assigneeRole || 'Contributor'}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {assignment.assigneeEmail ? assignment.assigneeEmail : 'No email provided'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Allocation: {assignment.allocationHours ?? 0}h</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {assignment.status?.replace(/_/g, ' ') || 'assigned'}
                  </span>
                  {canManage ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(assignment)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submitting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(assignment.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submitting}
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
              No assignments for this task. Add collaborators using the form below.
            </p>
          )}
        </div>
      </div>

      {editingAssignmentId ? (
        <form onSubmit={handleUpdate} className="rounded-2xl border border-accent/40 bg-accentSoft/20 p-5">
          <h5 className="text-sm font-semibold text-slate-900">Update assignment</h5>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Name
              <input
                name="assigneeName"
                value={editingForm.assigneeName}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Email
              <input
                name="assigneeEmail"
                value={editingForm.assigneeEmail}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Role
              <input
                name="assigneeRole"
                value={editingForm.assigneeRole}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Allocation hours
              <input
                type="number"
                name="allocationHours"
                value={editingForm.allocationHours}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Status
              <select
                name="status"
                value={editingForm.status}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              >
                {ASSIGNMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingAssignmentId(null)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canManage || submitting}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : null}

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h5 className="text-sm font-semibold text-slate-900">Assign collaborator</h5>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Name
            <input
              name="assigneeName"
              value={form.assigneeName}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="Collaborator name"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Email
            <input
              name="assigneeEmail"
              value={form.assigneeEmail}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="name@example.com"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Role
            <input
              name="assigneeRole"
              value={form.assigneeRole}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="Designer"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Allocation hours
            <input
              type="number"
              name="allocationHours"
              value={form.allocationHours}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Status
            <select
              name="status"
              value={form.status}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            >
              {ASSIGNMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={!canManage || submitting || !activeTask}
            className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Saving…' : 'Assign collaborator'}
          </button>
        </div>
        {feedback ? (
          <p className={`mt-3 text-sm ${feedback.status === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
            {feedback.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}

TaskDelegationTab.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.shape({
    createTaskAssignment: PropTypes.func.isRequired,
    updateTaskAssignment: PropTypes.func.isRequired,
    deleteTaskAssignment: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

TaskDelegationTab.defaultProps = {
  canManage: true,
};
