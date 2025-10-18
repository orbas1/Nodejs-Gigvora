import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const RISK_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function formatDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-GB', { dateStyle: 'medium' });
}

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function buildForm(project) {
  const workspace = project.workspace ?? {};
  return {
    title: project.title || '',
    description: project.description || '',
    status: project.status || 'planning',
    startDate: project.startDate ? toDateInput(project.startDate) : '',
    dueDate: project.dueDate ? toDateInput(project.dueDate) : '',
    budgetAllocated:
      project.budgetAllocated != null && !Number.isNaN(Number(project.budgetAllocated))
        ? String(project.budgetAllocated)
        : '',
    budgetCurrency: project.budgetCurrency || 'USD',
    workspaceStatus: workspace.status || project.status || 'planning',
    progressPercent:
      workspace.progressPercent != null && !Number.isNaN(Number(workspace.progressPercent))
        ? String(workspace.progressPercent)
        : '',
    riskLevel: workspace.riskLevel || 'low',
    nextMilestone: workspace.nextMilestone || '',
    nextMilestoneDueAt: workspace.nextMilestoneDueAt ? toDateInput(workspace.nextMilestoneDueAt) : '',
    notes: workspace.notes || '',
    metrics: workspace.metrics ? JSON.stringify(workspace.metrics, null, 2) : '',
  };
}

function parseMetrics(value) {
  if (!value?.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error('Metrics must be valid JSON.');
  }
}

export default function ProjectDescriptionTab({ project, actions, canManage }) {
  const [form, setForm] = useState(() => buildForm(project));
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setForm(buildForm(project));
  }, [project]);

  const workspace = project.workspace ?? {};
  const completionSummary = useMemo(() => {
    const progress = workspace.progressPercent != null ? Number(workspace.progressPercent) : null;
    const safeProgress = progress != null && !Number.isNaN(progress) ? progress : 0;
    const dueDate = project.dueDate ? new Date(project.dueDate) : null;
    const daysRemaining = dueDate ? Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    return {
      progress: safeProgress,
      risk: workspace.riskLevel || 'low',
      dueDate: dueDate ? dueDate.toISOString() : null,
      daysRemaining,
    };
  }, [project.dueDate, workspace.progressPercent, workspace.riskLevel]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
        budgetAllocated: form.budgetAllocated !== '' ? Number(form.budgetAllocated) : undefined,
        budgetCurrency: form.budgetCurrency,
        workspace: {
          status: form.workspaceStatus,
          progressPercent: form.progressPercent !== '' ? Number(form.progressPercent) : undefined,
          riskLevel: form.riskLevel,
          nextMilestone: form.nextMilestone || undefined,
          nextMilestoneDueAt: form.nextMilestoneDueAt
            ? new Date(form.nextMilestoneDueAt).toISOString()
            : undefined,
          notes: form.notes || undefined,
          metrics: parseMetrics(form.metrics),
        },
      };
      await actions.updateProject(project.id, payload);
      setFeedback({ status: 'success', message: 'Project details saved.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to save project details.' });
    } finally {
      setSubmitting(false);
    }
  };

  const budgetSummary = useMemo(() => {
    const allocated = project.budgetAllocated != null ? Number(project.budgetAllocated) : null;
    const currency = project.budgetCurrency || 'USD';
    try {
      return allocated != null
        ? new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(allocated)
        : null;
    } catch (error) {
      return allocated != null ? `${currency} ${allocated}` : null;
    }
  }, [project.budgetAllocated, project.budgetCurrency]);

  return (
    <div className="space-y-6">
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Current status</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {project.status?.replace(/_/g, ' ') || 'Not set'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Progress</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{completionSummary.progress}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Risk level</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {completionSummary.risk?.replace(/_/g, ' ') || 'Low'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Due date</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {completionSummary.dueDate ? formatDate(completionSummary.dueDate) : 'Not scheduled'}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Project narrative</h4>
        <p className="mt-2 text-sm text-slate-600">
          Keep your charter updated so teammates understand the mission, success metrics, and delivery guardrails.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-700">
              Project title
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Lifecycle status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Start date
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Target completion
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
          </div>

          <label className="flex flex-col text-sm text-slate-700">
            Overview
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Summarise the vision, stakeholders, scope, and definition of done."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-700">
              Budget allocated
              <input
                type="number"
                name="budgetAllocated"
                value={form.budgetAllocated}
                onChange={handleChange}
                min={0}
                step="0.01"
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="100000"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Currency
              <input
                type="text"
                name="budgetCurrency"
                value={form.budgetCurrency}
                onChange={handleChange}
                maxLength={6}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 uppercase focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
          </div>

          <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-2">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Workspace insights
            </legend>
            <label className="flex flex-col text-sm text-slate-700">
              Workspace status
              <select
                name="workspaceStatus"
                value={form.workspaceStatus}
                onChange={handleChange}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Progress (%)
              <input
                type="number"
                name="progressPercent"
                value={form.progressPercent}
                onChange={handleChange}
                min={0}
                max={100}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Risk level
              <select
                name="riskLevel"
                value={form.riskLevel}
                onChange={handleChange}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {RISK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Next milestone
              <input
                type="text"
                name="nextMilestone"
                value={form.nextMilestone}
                onChange={handleChange}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Launch beta cohort"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Milestone due date
              <input
                type="date"
                name="nextMilestoneDueAt"
                value={form.nextMilestoneDueAt}
                onChange={handleChange}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
              Notes & guardrails
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Highlight risks, dependencies, and communication cadences."
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
              Success metrics (JSON)
              <textarea
                name="metrics"
                value={form.metrics}
                onChange={handleChange}
                rows={4}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder='{"nps": 60, "renewals": 8}'
              />
            </label>
          </fieldset>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              {budgetSummary ? `Budget allocated: ${budgetSummary}` : 'Budget not configured yet.'}
              {completionSummary.daysRemaining != null ? (
                <span className="ml-2">
                  {completionSummary.daysRemaining >= 0
                    ? `${completionSummary.daysRemaining} days remaining`
                    : `${Math.abs(completionSummary.daysRemaining)} days past due`}
                </span>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={!canManage || submitting}
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save project details
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

ProjectDescriptionTab.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    startDate: PropTypes.string,
    dueDate: PropTypes.string,
    budgetAllocated: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    budgetCurrency: PropTypes.string,
    workspace: PropTypes.object,
  }).isRequired,
  actions: PropTypes.shape({
    updateProject: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

ProjectDescriptionTab.defaultProps = {
  canManage: true,
};
