import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(0);
  }
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      Number(value),
    );
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function formatStatusLabel(value) {
  if (!value) {
    return '—';
  }
  const label = String(value).replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function computeProgress(project) {
  const explicit = Number(project?.workspace?.progressPercent);
  if (!Number.isNaN(explicit) && explicit >= 0) {
    return Math.min(100, Math.max(0, explicit));
  }

  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
  if (!tasks.length) {
    return 0;
  }

  const completed = tasks.filter((task) => task.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

function useWorkspaceInsights(project) {
  return useMemo(() => {
    const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
    const deliverables = Array.isArray(project?.deliverables) ? project.deliverables : [];
    const approvals = Array.isArray(project?.approvals) ? project.approvals : [];
    const timelineEntries = Array.isArray(project?.timelineEntries) ? project.timelineEntries : [];
    const meetings = Array.isArray(project?.meetings) ? project.meetings : [];
    const files = Array.isArray(project?.files) ? project.files : [];
    const conversations = Array.isArray(project?.conversations) ? project.conversations : [];

    const now = new Date();

    const openTasks = tasks.filter((task) => task.status !== 'completed');
    const tasksDueSoon = openTasks.filter((task) => {
      if (!task.dueDate) {
        return false;
      }
      const due = new Date(task.dueDate);
      if (Number.isNaN(due.getTime())) {
        return false;
      }
      const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });

    const budgetTotal = Array.isArray(project?.budgets)
      ? project.budgets.reduce(
          (acc, budget) => {
            const planned = Number(budget.plannedAmount ?? 0);
            const actual = Number(budget.actualAmount ?? 0);
            return {
              planned: acc.planned + (Number.isNaN(planned) ? 0 : planned),
              actual: acc.actual + (Number.isNaN(actual) ? 0 : actual),
            };
          },
          { planned: 0, actual: 0 },
        )
      : { planned: Number(project?.budgetAllocated ?? 0), actual: Number(project?.budgetActual ?? 0) };

    const nextMilestones = timelineEntries
      .map((entry) => ({
        ...entry,
        startAt: entry.startAt || entry.dueAt,
      }))
      .filter((entry) => {
        if (!entry.startAt) return false;
        const date = new Date(entry.startAt);
        return !Number.isNaN(date.getTime()) && date >= now;
      })
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      .slice(0, 4);

    const pendingApprovals = approvals.filter((approval) => approval.status !== 'approved');
    const pendingReviews = Array.isArray(project?.submissions)
      ? project.submissions.filter((submission) => submission.status !== 'approved')
      : [];

    const unreadConversations = conversations.filter((conversation) => !conversation.acknowledgedAt);

    return {
      tasks,
      openTasks,
      tasksDueSoon,
      deliverables,
      approvals,
      pendingApprovals,
      pendingReviews,
      timelineEntries,
      nextMilestones,
      meetings,
      files,
      conversations,
      unreadConversations,
      budgetTotal,
    };
  }, [project]);
}

function ProgressDonut({ value }) {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(var(--accent-500, #6366f1) ${value * 3.6}deg, rgba(148, 163, 184, 0.25) ${
            value * 3.6
          }deg)`,
        }}
      />
      <div className="absolute inset-3 rounded-full bg-white shadow-inner" />
      <div className="relative text-center">
        <p className="text-2xl font-semibold text-slate-900">{value}%</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">Progress</p>
      </div>
    </div>
  );
}

ProgressDonut.propTypes = {
  value: PropTypes.number.isRequired,
};

export default function WorkspaceDashboard({ project = {}, actions, canManage = true }) {
  const workspace = project?.workspace ?? {};
  const progress = computeProgress(project);
  const insights = useWorkspaceInsights(project);

  const [form, setForm] = useState({
    projectStatus: project.status || 'planning',
    workspaceStatus: workspace.status || 'briefing',
    progressPercent: progress,
    riskLevel: workspace.riskLevel || 'low',
    nextMilestone: workspace.nextMilestone || '',
    nextMilestoneDueAt: workspace.nextMilestoneDueAt ? workspace.nextMilestoneDueAt.slice(0, 10) : '',
    notes: workspace.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setForm({
      projectStatus: project.status || 'planning',
      workspaceStatus: workspace.status || 'briefing',
      progressPercent: progress,
      riskLevel: workspace.riskLevel || 'low',
      nextMilestone: workspace.nextMilestone || '',
      nextMilestoneDueAt: workspace.nextMilestoneDueAt ? workspace.nextMilestoneDueAt.slice(0, 10) : '',
      notes: workspace.notes || '',
    });
  }, [
    workspace.status,
    workspace.progressPercent,
    workspace.riskLevel,
    workspace.nextMilestone,
    workspace.nextMilestoneDueAt,
    workspace.notes,
    project.status,
    progress,
  ]);

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
      const progressValue = Number(form.progressPercent);
      await actions.updateProject(project.id, {
        status: form.projectStatus,
        workspace: {
          status: form.workspaceStatus,
          progressPercent: Number.isNaN(progressValue) ? progress : progressValue,
          riskLevel: form.riskLevel,
          nextMilestone: form.nextMilestone || null,
          nextMilestoneDueAt: form.nextMilestoneDueAt || null,
          notes: form.notes || null,
        },
      });
      setFeedback({ status: 'success', message: 'Workspace signals saved and shared with collaborators.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update workspace insights.' });
    } finally {
      setSaving(false);
    }
  };

  const riskPalette = {
    low: 'text-emerald-600 bg-emerald-50',
    medium: 'text-amber-600 bg-amber-50',
    high: 'text-rose-600 bg-rose-50',
  };

  const topConversations = insights.conversations
    .slice()
    .sort((a, b) => {
      const priorityA = Number(a.priority ?? 0);
      const priorityB = Number(b.priority ?? 0);
      if (priorityA === priorityB) {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      }
      return priorityB - priorityA;
    })
    .slice(0, 3);

  const keyRoles = Array.isArray(project?.roleDefinitions)
    ? project.roleDefinitions
        .slice()
        .sort((a, b) => (b.assignments?.length ?? 0) - (a.assignments?.length ?? 0))
        .slice(0, 4)
    : [];

  const latestFile = useMemo(() => {
    if (!Array.isArray(insights.files) || !insights.files.length) {
      return null;
    }
    return insights.files
      .slice()
      .sort(
        (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0),
      )[0];
  }, [insights.files]);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Workspace home</p>
            <h3 className="text-3xl font-semibold text-slate-900">{project.title}</h3>
            <p className="text-sm text-slate-600">
              Track health, unblock workstreams, and align every collaborator. This dashboard blends delivery, finance,
              and communication signals so leaders can act within seconds.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <span className="rounded-full bg-white/80 px-3 py-1">
                Project: {formatStatusLabel(form.projectStatus)}
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1">
                Workspace: {formatStatusLabel(form.workspaceStatus)}
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1">Risk: {formatStatusLabel(form.riskLevel)}</span>
              <span className="rounded-full bg-white/80 px-3 py-1">
                Due {formatDate(project.dueDate) || '—'}
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1">Budget {formatCurrency(insights.budgetTotal.planned)}</span>
            </div>
          </div>
          <ProgressDonut value={progress} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active deliverables</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{insights.deliverables.length}</p>
          <p className="mt-1 text-xs text-slate-500">
            {insights.deliverables.filter((item) => item.status === 'approved').length} approved
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open tasks</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{insights.openTasks.length}</p>
          <p className="mt-1 text-xs text-slate-500">{insights.tasksDueSoon.length} due within 7 days</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending approvals</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{insights.pendingApprovals.length}</p>
          <p className="mt-1 text-xs text-slate-500">Reviews awaiting sign-off</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Storage footprint</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{insights.files.length} files</p>
          <p className="mt-1 text-xs text-slate-500">
            {latestFile?.uploadedBy ? `Latest by ${latestFile.uploadedBy}` : '—'}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Operational pulse</h4>
                <p className="text-sm text-slate-600">
                  Monitor near-term activity and priorities. These highlights surface the next actions for the core team.
                </p>
              </div>
              <span className={classNames('rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide', riskPalette[form.riskLevel] || riskPalette.low)}>
                {form.riskLevel} risk
              </span>
            </header>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <h5 className="text-sm font-semibold text-slate-900">Upcoming milestones</h5>
                <ul className="mt-3 space-y-3">
                  {insights.nextMilestones.length ? (
                    insights.nextMilestones.map((entry) => (
                      <li key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                        <p className="text-sm font-semibold text-slate-800">{entry.name || entry.title}</p>
                        <p className="text-xs text-slate-500">Starts {formatDate(entry.startAt)}</p>
                        {entry.relatedObject?.name ? (
                          <p className="mt-1 text-xs text-slate-500">Linked to {entry.relatedObject.name}</p>
                        ) : null}
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-3 text-xs text-slate-500">
                      No future milestones on the calendar.
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-slate-900">Focus conversations</h5>
                <ul className="mt-3 space-y-3">
                  {topConversations.length ? (
                    topConversations.map((conversation) => (
                      <li key={conversation.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                        <p className="text-sm font-semibold text-slate-800">{conversation.topic}</p>
                        <p className="text-xs text-slate-500">
                          {conversation.priority ? `Priority ${conversation.priority}` : 'Team chat'} • Updated {formatDate(conversation.updatedAt)}
                        </p>
                        {conversation.lastMessage ? (
                          <p className="mt-2 line-clamp-2 text-xs text-slate-600">{conversation.lastMessage}</p>
                        ) : null}
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-3 text-xs text-slate-500">
                      All conversation threads are acknowledged.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-900">Workspace broadcast</h4>
            <p className="mt-2 text-sm text-slate-600">
              Publish the latest execution snapshot to operations, leadership, and clients.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Project status
                <select
                  name="projectStatus"
                  value={form.projectStatus}
                  onChange={handleChange}
                  disabled={!canManage || saving}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In progress</option>
                  <option value="at_risk">At risk</option>
                  <option value="on_hold">On hold</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Workspace status
                <select
                  name="workspaceStatus"
                  value={form.workspaceStatus}
                  onChange={handleChange}
                  disabled={!canManage || saving}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="briefing">Briefing</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Risk level
                <select
                  name="riskLevel"
                  value={form.riskLevel}
                  onChange={handleChange}
                  disabled={!canManage || saving}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Progress (% complete)
                <input
                  type="number"
                  name="progressPercent"
                  value={form.progressPercent}
                  onChange={handleChange}
                  disabled={!canManage || saving}
                  min={0}
                  max={100}
                  step={5}
                  className="rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Next milestone
                <input
                  name="nextMilestone"
                  value={form.nextMilestone}
                  onChange={handleChange}
                  disabled={!canManage || saving}
                  placeholder="Launch closed beta"
                  className="rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Milestone target
                <input
                  type="date"
                  name="nextMilestoneDueAt"
                  value={form.nextMilestoneDueAt}
                  onChange={handleChange}
                  disabled={!canManage || saving}
                  className="rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
                />
                {workspace.nextMilestoneDueAt ? (
                  <span className="text-xs text-slate-500">Previously {formatDate(workspace.nextMilestoneDueAt)}</span>
                ) : null}
              </label>
              <label className="md:col-span-2 flex flex-col gap-2 text-sm text-slate-700">
                Notes for stakeholders
                <textarea
                  name="notes"
                  rows={3}
                  value={form.notes}
                  onChange={handleChange}
                  disabled={!canManage || saving}
                  placeholder="Highlight wins, blockers, dependencies, and next experiments."
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
              <div className="md:col-span-2 flex items-center justify-end gap-3">
                {feedback ? (
                  <p
                    className={classNames('text-sm', feedback.status === 'error' ? 'text-rose-600' : 'text-emerald-600')}
                  >
                    {feedback.message}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={!canManage || saving}
                  className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Saving…' : 'Share update'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-900">Team coverage</h4>
            <ul className="mt-4 space-y-3">
              {keyRoles.length ? (
                keyRoles.map((role) => (
                  <li key={role.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-sm font-semibold text-slate-800">{role.name}</p>
                    <p className="text-xs text-slate-500">
                      {role.assignments?.length ?? 0} active {role.assignments?.length === 1 ? 'member' : 'members'}
                    </p>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-3 text-xs text-slate-500">
                  No roles defined yet.
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-900">Approvals & reviews</h4>
            <ul className="mt-4 space-y-3">
              {insights.pendingApprovals.slice(0, 3).map((approval) => (
                <li key={approval.id} className="rounded-2xl border border-slate-100 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-800">{approval.title || approval.type}</p>
                  <p className="text-xs text-slate-500">Due {formatDate(approval.dueAt)}</p>
                </li>
              ))}
              {insights.pendingApprovals.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-3 text-xs text-slate-500">
                  No outstanding approvals.
                </li>
              ) : null}
            </ul>
            {insights.pendingReviews.length ? (
              <p className="mt-3 text-xs text-slate-500">
                {insights.pendingReviews.length} submission{insights.pendingReviews.length === 1 ? '' : 's'} waiting for review.
              </p>
            ) : null}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-900">Engagement signals</h4>
            <ul className="mt-4 space-y-2 text-xs text-slate-500">
              <li>{insights.unreadConversations.length} conversations need acknowledgement.</li>
              <li>{insights.meetings.filter((meeting) => new Date(meeting.startAt) > new Date()).length} upcoming meetings.</li>
              <li>{project.invitations?.filter((invite) => invite.status === 'pending').length ?? 0} pending invitations.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

WorkspaceDashboard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    status: PropTypes.string,
    dueDate: PropTypes.string,
    workspace: PropTypes.shape({
      status: PropTypes.string,
      progressPercent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      riskLevel: PropTypes.string,
      nextMilestone: PropTypes.string,
      nextMilestoneDueAt: PropTypes.string,
      notes: PropTypes.string,
    }),
  }).isRequired,
  actions: PropTypes.shape({
    updateProject: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};
