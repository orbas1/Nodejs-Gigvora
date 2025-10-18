import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

export default function WorkspaceOverviewTab({ project, actions, canManage }) {
  const workspace = project.workspace ?? {};
  const [form, setForm] = useState({
    status: workspace.status || project.status || 'planning',
    progressPercent: workspace.progressPercent ?? 0,
    riskLevel: workspace.riskLevel || 'low',
    nextMilestone: workspace.nextMilestone || '',
    nextMilestoneDueAt: workspace.nextMilestoneDueAt ? workspace.nextMilestoneDueAt.slice(0, 10) : '',
    notes: workspace.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setForm({
      status: workspace.status || project.status || 'planning',
      progressPercent: workspace.progressPercent ?? 0,
      riskLevel: workspace.riskLevel || 'low',
      nextMilestone: workspace.nextMilestone || '',
      nextMilestoneDueAt: workspace.nextMilestoneDueAt ? workspace.nextMilestoneDueAt.slice(0, 10) : '',
      notes: workspace.notes || '',
    });
  }, [workspace.status, workspace.progressPercent, workspace.riskLevel, workspace.nextMilestone, workspace.nextMilestoneDueAt, workspace.notes, project.status]);

  const metrics = useMemo(
    () => [
      {
        label: 'Deliverables ready',
        value: project.deliverables?.filter((item) => item.status === 'delivered' || item.status === 'approved').length ?? 0,
      },
      {
        label: 'Open tasks',
        value: project.tasks?.filter((task) => task.status !== 'completed').length ?? 0,
      },
      {
        label: 'Upcoming meetings',
        value: project.meetings?.filter((meeting) => new Date(meeting.scheduledAt) > new Date()).length ?? 0,
      },
      {
        label: 'Active collaborators',
        value:
          project.roleDefinitions?.reduce((total, role) => total + (role.assignments?.filter((assignment) => assignment.status === 'active').length ?? 0), 0) ?? 0,
      },
    ],
    [project.deliverables, project.tasks, project.meetings, project.roleDefinitions],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await actions.updateProject(project.id, {
        status: form.status,
        workspace: {
          status: form.status,
          progressPercent: number(form.progressPercent, 0),
          riskLevel: form.riskLevel,
          nextMilestone: form.nextMilestone || null,
          nextMilestoneDueAt: form.nextMilestoneDueAt || null,
          notes: form.notes || null,
        },
      });
      setFeedback({ status: 'success', message: 'Workspace updated successfully.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Failed to update workspace.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900">Execution health</h4>
        <p className="mt-2 text-sm text-slate-600">
          Update the current status, risk level, and milestone information to keep stakeholders aligned.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              disabled={!canManage}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="planning">Planning</option>
              <option value="in_progress">In progress</option>
              <option value="at_risk">At risk</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Progress (% complete)
            <input
              type="number"
              name="progressPercent"
              value={form.progressPercent}
              onChange={handleChange}
              disabled={!canManage}
              min="0"
              max="100"
              step="5"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Risk level
            <select
              name="riskLevel"
              value={form.riskLevel}
              onChange={handleChange}
              disabled={!canManage}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Next milestone
            <input
              name="nextMilestone"
              value={form.nextMilestone}
              onChange={handleChange}
              disabled={!canManage}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:cursor-not-allowed disabled:opacity-70"
              placeholder="Launch public beta"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Milestone due date
            <input
              type="date"
              name="nextMilestoneDueAt"
              value={form.nextMilestoneDueAt}
              onChange={handleChange}
              disabled={!canManage}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:cursor-not-allowed disabled:opacity-70"
            />
            {workspace.nextMilestoneDueAt ? (
              <span className="text-xs text-slate-500">
                Previously {formatDate(workspace.nextMilestoneDueAt)}
              </span>
            ) : null}
          </label>
          <label className="md:col-span-2 flex flex-col gap-2 text-sm text-slate-700">
            Notes for stakeholders
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              disabled={!canManage}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:cursor-not-allowed disabled:opacity-70"
              placeholder="Share blockers, upcoming decisions, or dependencies."
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={!canManage || saving}
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving changes…' : 'Save workspace' }
            </button>
          </div>
          {feedback ? (
            <p
              className={`md:col-span-2 text-sm ${
                feedback.status === 'error' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {feedback.message}
            </p>
          ) : null}
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h4 className="text-base font-semibold text-slate-900">Quick reference</h4>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Start date</dt>
            <dd className="mt-1 text-sm text-slate-700">{formatDate(project.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Due date</dt>
            <dd className="mt-1 text-sm text-slate-700">{formatDate(project.dueDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Budget allocated</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: project.budgetCurrency || 'USD',
                maximumFractionDigits: 0,
              }).format(number(project.budgetAllocated, 0))}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Budget spent</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: project.budgetCurrency || 'USD',
                maximumFractionDigits: 0,
              }).format(number(project.budgetSpent, 0))}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

WorkspaceOverviewTab.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.shape({
    updateProject: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

WorkspaceOverviewTab.defaultProps = {
  canManage: true,
};
