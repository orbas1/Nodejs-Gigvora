import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchWorkManagement,
  createSprint,
  createTask,
  logTime,
  createRisk,
  createChangeRequest,
  approveChangeRequest,
} from '../../services/workManagement.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

function BurnChart({ data }) {
  if (!data || !Array.isArray(data.entries) || data.entries.length < 2) {
    return <p className="text-xs text-slate-500">Add sprint dates and completed tasks to generate a burndown.</p>;
  }
  const width = 260;
  const height = 90;
  const padding = 12;
  const entries = data.entries;
  const maxPoints = Math.max(
    data.usesStoryPoints ? data.totalPoints : entries.length,
    ...entries.map((entry) => Math.max(entry.remainingPoints ?? 0, entry.idealRemaining ?? 0)),
  );
  const yScale = (value) => {
    if (!maxPoints) return height - padding;
    return height - padding - (Math.max(0, value) / maxPoints) * (height - padding * 2);
  };
  const xScale = (index) => {
    if (entries.length === 1) return padding;
    return padding + (index / (entries.length - 1)) * (width - padding * 2);
  };
  const actualPoints = entries
    .map((entry, index) => `${xScale(index)},${yScale(entry.remainingPoints ?? 0)}`)
    .join(' ');
  const idealPoints = entries
    .map((entry, index) => `${xScale(index)},${yScale(entry.idealRemaining ?? 0)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full">
      <polyline points={idealPoints} fill="none" stroke="rgba(148, 163, 184, 0.6)" strokeWidth="2" />
      <polyline points={actualPoints} fill="none" stroke="rgb(59, 130, 246)" strokeWidth="3" />
      {entries.map((entry, index) => (
        <circle
          key={entry.date}
          cx={xScale(index)}
          cy={yScale(entry.remainingPoints ?? 0)}
          r="3.5"
          className="fill-blue-500"
        >
          <title>
            {entry.date}: {Number(entry.remainingPoints ?? 0).toFixed(2)} pts remaining
          </title>
        </circle>
      ))}
    </svg>
  );
}

function ProgressBar({ value, total }) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-2 rounded-full bg-blue-500 transition-all"
        style={{ width: `${percent}%` }}
        aria-hidden="true"
      />
      <span className="sr-only">{percent}% complete</span>
    </div>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent ? 'text-blue-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function humanizeStatus(value) {
  if (!value) {
    return 'Unknown';
  }
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}

export default function TaskSprintManager() {
  const [projectIdInput, setProjectIdInput] = useState('1');
  const [projectId, setProjectId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const [sprintForm, setSprintForm] = useState({ name: '', goal: '', startDate: '', endDate: '', velocityTarget: '' });
  const [taskForm, setTaskForm] = useState({
    title: '',
    sprintId: '',
    status: 'backlog',
    priority: 'medium',
    storyPoints: '',
    dueDate: '',
    assigneeId: '',
  });
  const [timeForm, setTimeForm] = useState({ taskId: '', userId: '', minutesSpent: '', billable: true, hourlyRate: '', notes: '' });
  const [riskForm, setRiskForm] = useState({
    title: '',
    sprintId: '',
    taskId: '',
    impact: 'medium',
    probability: '',
    severityScore: '',
    status: 'open',
    mitigationPlan: '',
    ownerId: '',
  });
  const [changeForm, setChangeForm] = useState({
    title: '',
    sprintId: '',
    description: '',
    requestedById: '',
    eSignDocumentUrl: '',
  });
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [loggingTimeEntry, setLoggingTimeEntry] = useState(false);
  const [registeringRisk, setRegisteringRisk] = useState(false);
  const [submittingChangeRequest, setSubmittingChangeRequest] = useState(false);

  const allTasks = useMemo(() => {
    if (!overview) return [];
    const sprintTasks = (overview.sprints || []).flatMap((sprint) => sprint.tasks || []);
    const backlog = Array.isArray(overview.backlog) ? overview.backlog : [];
    return [...sprintTasks, ...backlog];
  }, [overview]);

  const loadOverview = useCallback(
    async (targetProjectId) => {
      if (!targetProjectId) {
        return;
      }
      setLoading(true);
      setError(null);
      setActionMessage(null);
      try {
        const result = await fetchWorkManagement(targetProjectId);
        setOverview(result);
        setProjectId(targetProjectId);
        setProjectIdInput(String(targetProjectId));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadOverview(Number(projectIdInput) || 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!actionMessage) {
      return () => {};
    }
    const timeout = window.setTimeout(() => setActionMessage(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [actionMessage]);

  const handleProjectSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const numericId = Number(projectIdInput);
      if (!Number.isFinite(numericId) || numericId <= 0) {
        setError(new Error('Enter a valid project ID.'));
        return;
      }
      loadOverview(numericId);
    },
    [loadOverview, projectIdInput],
  );

  const handleCreateSprint = useCallback(
    async (event) => {
      event.preventDefault();
      if (!projectId) return;
      try {
        setCreatingSprint(true);
        await createSprint(projectId, {
          name: sprintForm.name,
          goal: sprintForm.goal || undefined,
          startDate: sprintForm.startDate || undefined,
          endDate: sprintForm.endDate || undefined,
          velocityTarget: sprintForm.velocityTarget ? Number(sprintForm.velocityTarget) : undefined,
        });
        setSprintForm({ name: '', goal: '', startDate: '', endDate: '', velocityTarget: '' });
        setActionMessage({ type: 'success', text: 'Sprint created successfully.' });
        await loadOverview(projectId);
      } catch (err) {
        setActionMessage({ type: 'error', text: err.message || 'Unable to create sprint.' });
      } finally {
        setCreatingSprint(false);
      }
    },
    [projectId, sprintForm, loadOverview],
  );

  const handleCreateTask = useCallback(
    async (event) => {
      event.preventDefault();
      if (!projectId) return;
      try {
        setCreatingTask(true);
        await createTask(projectId, {
          title: taskForm.title,
          sprintId: taskForm.sprintId ? Number(taskForm.sprintId) : undefined,
          status: taskForm.status,
          priority: taskForm.priority,
          storyPoints: taskForm.storyPoints ? Number(taskForm.storyPoints) : undefined,
          assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : undefined,
          dueDate: taskForm.dueDate || undefined,
          metadata: { source: 'freelancer_dashboard' },
        });
        setTaskForm({ title: '', sprintId: '', status: 'backlog', priority: 'medium', storyPoints: '', dueDate: '', assigneeId: '' });
        setActionMessage({ type: 'success', text: 'Task added to the board.' });
        await loadOverview(projectId);
      } catch (err) {
        setActionMessage({ type: 'error', text: err.message || 'Unable to create task.' });
      } finally {
        setCreatingTask(false);
      }
    },
    [projectId, taskForm, loadOverview],
  );

  const handleLogTime = useCallback(
    async (event) => {
      event.preventDefault();
      if (!projectId) return;
      try {
        setLoggingTimeEntry(true);
        await logTime(projectId, Number(timeForm.taskId), {
          userId: Number(timeForm.userId),
          minutesSpent: timeForm.minutesSpent ? Number(timeForm.minutesSpent) : undefined,
          billable: Boolean(timeForm.billable),
          hourlyRate: timeForm.hourlyRate ? Number(timeForm.hourlyRate) : undefined,
          notes: timeForm.notes || undefined,
        });
        setTimeForm({ taskId: '', userId: '', minutesSpent: '', billable: true, hourlyRate: '', notes: '' });
        setActionMessage({ type: 'success', text: 'Time entry recorded.' });
        await loadOverview(projectId);
      } catch (err) {
        setActionMessage({ type: 'error', text: err.message || 'Unable to log time.' });
      } finally {
        setLoggingTimeEntry(false);
      }
    },
    [projectId, timeForm, loadOverview],
  );

  const handleCreateRisk = useCallback(
    async (event) => {
      event.preventDefault();
      if (!projectId) return;
      try {
        setRegisteringRisk(true);
        await createRisk(projectId, {
          title: riskForm.title,
          sprintId: riskForm.sprintId ? Number(riskForm.sprintId) : undefined,
          taskId: riskForm.taskId ? Number(riskForm.taskId) : undefined,
          impact: riskForm.impact,
          probability: riskForm.probability ? Number(riskForm.probability) : undefined,
          severityScore: riskForm.severityScore ? Number(riskForm.severityScore) : undefined,
          status: riskForm.status,
          mitigationPlan: riskForm.mitigationPlan || undefined,
          ownerId: riskForm.ownerId ? Number(riskForm.ownerId) : undefined,
        });
        setRiskForm({
          title: '',
          sprintId: '',
          taskId: '',
          impact: 'medium',
          probability: '',
          severityScore: '',
          status: 'open',
          mitigationPlan: '',
          ownerId: '',
        });
        setActionMessage({ type: 'success', text: 'Risk registered with the project office.' });
        await loadOverview(projectId);
      } catch (err) {
        setActionMessage({ type: 'error', text: err.message || 'Unable to create risk.' });
      } finally {
        setRegisteringRisk(false);
      }
    },
    [projectId, riskForm, loadOverview],
  );

  const handleChangeRequest = useCallback(
    async (event) => {
      event.preventDefault();
      if (!projectId) return;
      try {
        setSubmittingChangeRequest(true);
        await createChangeRequest(projectId, {
          title: changeForm.title,
          sprintId: changeForm.sprintId ? Number(changeForm.sprintId) : undefined,
          description: changeForm.description || undefined,
          requestedById: changeForm.requestedById ? Number(changeForm.requestedById) : undefined,
          eSignDocumentUrl: changeForm.eSignDocumentUrl || undefined,
          changeImpact: changeForm.description
            ? { summary: changeForm.description.slice(0, 240) }
            : undefined,
        });
        setChangeForm({ title: '', sprintId: '', description: '', requestedById: '', eSignDocumentUrl: '' });
        setActionMessage({ type: 'success', text: 'Change request routed for approval.' });
        await loadOverview(projectId);
      } catch (err) {
        setActionMessage({ type: 'error', text: err.message || 'Unable to submit change request.' });
      } finally {
        setSubmittingChangeRequest(false);
      }
    },
    [projectId, changeForm, loadOverview],
  );

  const handleApproveChange = useCallback(
    async (changeRequestId) => {
      if (!projectId) return;
      try {
        await approveChangeRequest(projectId, changeRequestId, {
          status: 'approved',
          approvalMetadata: { approvedFrom: 'Freelancer dashboard' },
        });
        setActionMessage({ type: 'success', text: 'Change request approved.' });
        await loadOverview(projectId);
      } catch (err) {
        setActionMessage({ type: 'error', text: err.message || 'Unable to approve change request.' });
      }
    },
    [projectId, loadOverview],
  );

  const sprints = overview?.sprints || [];
  const summary = overview?.summary || {};
  const backlogSummary = overview?.backlogSummary || {};
  const risks = overview?.risks || [];
  const changeRequests = overview?.changeRequests || [];
  const currentProject = overview?.project ?? null;
  const isInteractiveDisabled = loading || !projectId;
  const loadButtonDisabled = loading || !projectIdInput;

  return (
    <section id="task-sprint-manager" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/90">Service delivery</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Task &amp; sprint manager</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Launch sprints, groom backlogs, monitor burn charts, and route risks or change approvals without leaving your
            freelancer cockpit.
          </p>
        </div>
        <form onSubmit={handleProjectSubmit} className="flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="project-selector">
            Project ID
          </label>
          <input
            id="project-selector"
            type="number"
            min="1"
            value={projectIdInput}
            onChange={(event) => setProjectIdInput(event.target.value)}
            className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="submit"
            disabled={loadButtonDisabled}
            className={`inline-flex items-center rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              loadButtonDisabled
                ? 'cursor-not-allowed bg-blue-300'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Loading…' : 'Load dashboard'}
          </button>
        </form>
      </div>

      {currentProject ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active project</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {currentProject.name || `Project #${currentProject.id ?? projectId}`}
            </p>
            {currentProject.clientName ? (
              <p className="mt-1 text-xs text-slate-500">Client: {currentProject.clientName}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-2 text-xs text-slate-500 sm:items-end">
            {loading ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" aria-hidden="true" /> Refreshing
              </span>
            ) : null}
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {humanizeStatus(currentProject.status)}
            </span>
            {currentProject.updatedAt ? (
              <span>Updated {formatRelativeTime(currentProject.updatedAt)}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-500">
          Enter a project ID and load the dashboard to begin orchestrating sprints and delegation workflows.
        </div>
      )}

      {actionMessage ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            actionMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {actionMessage.text}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error.message || 'Unable to load sprint operations. Verify the project exists.'}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label="Active sprints" value={summary.activeSprints ?? 0} accent />
        <StatPill label="Backlog ready" value={backlogSummary.readyForPlanning ?? 0} />
        <StatPill label="Open risks" value={summary.openRisks ?? 0} />
        <StatPill label="Pending approvals" value={summary.pendingApprovals ?? 0} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreateSprint} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Create sprint</h3>
          <fieldset disabled={isInteractiveDisabled || creatingSprint} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-500">
                Name
                <input
                  required
                  type="text"
                value={sprintForm.name}
                onChange={(event) => setSprintForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Goal
              <input
                type="text"
                value={sprintForm.goal}
                onChange={(event) => setSprintForm((prev) => ({ ...prev, goal: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Start date
              <input
                type="date"
                value={sprintForm.startDate}
                onChange={(event) => setSprintForm((prev) => ({ ...prev, startDate: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              End date
              <input
                type="date"
                value={sprintForm.endDate}
                onChange={(event) => setSprintForm((prev) => ({ ...prev, endDate: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Velocity target (pts)
              <input
                type="number"
                min="0"
                step="0.5"
                value={sprintForm.velocityTarget}
                onChange={(event) => setSprintForm((prev) => ({ ...prev, velocityTarget: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            </div>
            <button
              type="submit"
              className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                isInteractiveDisabled || creatingSprint
                  ? 'cursor-not-allowed bg-blue-300'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isInteractiveDisabled || creatingSprint}
            >
              {creatingSprint ? 'Saving…' : 'Save sprint'}
            </button>
          </fieldset>
        </form>

        <form onSubmit={handleCreateTask} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Add task</h3>
          <fieldset disabled={isInteractiveDisabled || creatingTask} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-500">
                Title
                <input
                  required
                  type="text"
                value={taskForm.title}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Sprint
              <select
                value={taskForm.sprintId}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, sprintId: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Backlog</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Status
              <select
                value={taskForm.status}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="backlog">Backlog</option>
                <option value="ready">Ready</option>
                <option value="in_progress">In progress</option>
                <option value="review">Review</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Priority
              <select
                value={taskForm.priority}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Story points
              <input
                type="number"
                min="0"
                step="0.5"
                value={taskForm.storyPoints}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, storyPoints: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Due date
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Assignee ID
              <input
                type="number"
                min="1"
                value={taskForm.assigneeId}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, assigneeId: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            </div>
            <button
              type="submit"
              className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                isInteractiveDisabled || creatingTask
                  ? 'cursor-not-allowed bg-blue-300'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isInteractiveDisabled || creatingTask}
            >
              {creatingTask ? 'Saving…' : 'Add task'}
            </button>
          </fieldset>
        </form>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleLogTime} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Log time</h3>
          <fieldset disabled={isInteractiveDisabled || loggingTimeEntry} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-500">
                Task
                <select
                  required
                  value={timeForm.taskId}
                onChange={(event) => setTimeForm((prev) => ({ ...prev, taskId: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="" disabled>
                  Select task
                </option>
                {allTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    #{task.id} · {task.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              User ID
              <input
                required
                type="number"
                min="1"
                value={timeForm.userId}
                onChange={(event) => setTimeForm((prev) => ({ ...prev, userId: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Minutes
              <input
                type="number"
                min="1"
                value={timeForm.minutesSpent}
                onChange={(event) => setTimeForm((prev) => ({ ...prev, minutesSpent: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Hourly rate (billable)
              <input
                type="number"
                min="0"
                step="0.01"
                value={timeForm.hourlyRate}
                onChange={(event) => setTimeForm((prev) => ({ ...prev, hourlyRate: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={Boolean(timeForm.billable)}
                onChange={(event) => setTimeForm((prev) => ({ ...prev, billable: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Billable entry
            </label>
            <label className="text-xs text-slate-500 sm:col-span-2">
              Notes
              <textarea
                value={timeForm.notes}
                onChange={(event) => setTimeForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            </div>
            <button
              type="submit"
              className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                isInteractiveDisabled || loggingTimeEntry
                  ? 'cursor-not-allowed bg-blue-300'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isInteractiveDisabled || loggingTimeEntry}
            >
              {loggingTimeEntry ? 'Logging…' : 'Log time'}
            </button>
          </fieldset>
        </form>

        <form onSubmit={handleCreateRisk} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Register risk</h3>
          <fieldset disabled={isInteractiveDisabled || registeringRisk} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-500">
                Title
                <input
                  required
                  type="text"
                value={riskForm.title}
                onChange={(event) => setRiskForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Owner ID
              <input
                type="number"
                min="1"
                value={riskForm.ownerId}
                onChange={(event) => setRiskForm((prev) => ({ ...prev, ownerId: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Sprint
              <select
                value={riskForm.sprintId}
                onChange={(event) => setRiskForm((prev) => ({ ...prev, sprintId: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Project level</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Related task
              <select
                value={riskForm.taskId}
                onChange={(event) => setRiskForm((prev) => ({ ...prev, taskId: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Optional</option>
                {allTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    #{task.id} · {task.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Impact
              <select
                value={riskForm.impact}
                onChange={(event) => setRiskForm((prev) => ({ ...prev, impact: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Probability (0-1)
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={riskForm.probability}
                onChange={(event) => setRiskForm((prev) => ({ ...prev, probability: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Severity score
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={riskForm.severityScore}
                onChange={(event) => setRiskForm((prev) => ({ ...prev, severityScore: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-xs text-slate-500">
              Status
              <select
                value={riskForm.status}
                onChange={(event) => setRiskForm((prev) => ({ ...prev, status: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="open">Open</option>
                <option value="mitigating">Mitigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="text-xs text-slate-500 sm:col-span-2">
              Mitigation plan
              <textarea
                value={riskForm.mitigationPlan}
                onChange={(event) => setRiskForm((prev) => ({ ...prev, mitigationPlan: event.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            </div>
            <button
              type="submit"
              className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                isInteractiveDisabled || registeringRisk
                  ? 'cursor-not-allowed bg-blue-300'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isInteractiveDisabled || registeringRisk}
            >
              {registeringRisk ? 'Registering…' : 'Register risk'}
            </button>
          </fieldset>
        </form>
      </div>

      <form onSubmit={handleChangeRequest} className="mt-8 space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold text-slate-700">Change request approval</h3>
        <fieldset disabled={isInteractiveDisabled || submittingChangeRequest} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-500">
            Title
            <input
              required
              type="text"
              value={changeForm.title}
              onChange={(event) => setChangeForm((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="text-xs text-slate-500">
            Sprint
            <select
              value={changeForm.sprintId}
              onChange={(event) => setChangeForm((prev) => ({ ...prev, sprintId: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Cross-sprint</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Requested by (user ID)
            <input
              type="number"
              min="1"
              value={changeForm.requestedById}
              onChange={(event) => setChangeForm((prev) => ({ ...prev, requestedById: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="text-xs text-slate-500">
            E-sign document URL
            <input
              type="url"
              value={changeForm.eSignDocumentUrl}
              onChange={(event) => setChangeForm((prev) => ({ ...prev, eSignDocumentUrl: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
            <label className="text-xs text-slate-500 sm:col-span-2">
              Description &amp; rationale
              <textarea
                required
                value={changeForm.description}
                onChange={(event) => setChangeForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <button
            type="submit"
            className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              isInteractiveDisabled || submittingChangeRequest
                ? 'cursor-not-allowed bg-blue-300'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isInteractiveDisabled || submittingChangeRequest}
          >
            {submittingChangeRequest ? 'Routing…' : 'Submit change request'}
          </button>
        </fieldset>
      </form>

      <div className="mt-10 space-y-8">
        {loading && !overview ? (
          <p className="text-sm text-slate-500">Loading sprint intelligence...</p>
        ) : null}

        {sprints.map((sprint) => {
          const timeSummary = sprint.metrics?.timeSummary ?? {};
          return (
            <article key={sprint.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{sprint.name}</h3>
                  <p className="text-sm text-slate-500">{sprint.goal || 'No goal recorded.'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {sprint.startDate ? <span>Start: {formatAbsolute(sprint.startDate, { dateStyle: 'medium' })}</span> : null}
                    {sprint.endDate ? <span>End: {formatAbsolute(sprint.endDate, { dateStyle: 'medium' })}</span> : null}
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                      {sprint.status}
                    </span>
                    {sprint.velocityTarget ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">Velocity target: {sprint.velocityTarget}</span>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:w-64">
                  <ProgressBar value={sprint.metrics?.completedTasks ?? 0} total={sprint.metrics?.totalTasks ?? 0} />
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>
                      <p className="uppercase tracking-wide text-slate-400">Tasks</p>
                      <p className="font-semibold text-slate-900">
                        {sprint.metrics?.completedTasks ?? 0}/{sprint.metrics?.totalTasks ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-slate-400">Story points</p>
                      <p className="font-semibold text-slate-900">
                        {sprint.metrics?.completedStoryPoints ?? 0}/{sprint.metrics?.totalStoryPoints ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-slate-400">Billable hrs</p>
                      <p className="font-semibold text-slate-900">{timeSummary.billableHours ?? 0}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-slate-400">Billable value</p>
                      <p className="font-semibold text-slate-900">${timeSummary.billableAmount ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Kanban snapshot</h4>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {sprint.kanban?.map((column) => (
                      <div key={column.status} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <span>{column.label}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-700">
                            {column.tasks.length}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{column.totalStoryPoints ?? 0} pts</p>
                        <ul className="mt-3 space-y-2">
                          {column.tasks.slice(0, 3).map((task) => (
                            <li key={task.id} className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                              <p className="font-medium text-slate-700">{task.title}</p>
                              {task.assigneeId ? (
                                <p className="mt-1">Assignee: #{task.assigneeId}</p>
                              ) : null}
                              {task.dueDate ? (
                                <p className="mt-1">Due {formatRelativeTime(task.dueDate)}</p>
                              ) : null}
                            </li>
                          ))}
                          {column.tasks.length > 3 ? (
                            <li className="text-xs text-slate-400">+{column.tasks.length - 3} more</li>
                          ) : null}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Burn chart</h4>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <BurnChart data={sprint.burndown} />
                  </div>
                  <h4 className="mt-6 text-sm font-semibold text-slate-700">Timeline</h4>
                  <ol className="mt-3 space-y-2 text-xs text-slate-600">
                    {sprint.timeline?.length ? (
                      sprint.timeline.map((item) => (
                        <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="font-semibold text-slate-700">{item.title}</p>
                          <p className="mt-1 text-slate-500">
                            {item.start ? `Start ${formatAbsolute(item.start, { dateStyle: 'medium' })}` : 'Unscheduled'} •{' '}
                            {item.end ? `Due ${formatAbsolute(item.end, { dateStyle: 'medium' })}` : 'No due date'}
                          </p>
                          {item.dependencies?.length ? (
                            <p className="mt-1 text-slate-400">Depends on {item.dependencies.length} task(s)</p>
                          ) : null}
                        </li>
                      ))
                    ) : (
                      <li className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-slate-400">
                        No timeline entries yet.
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Risk register</h3>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
              {risks.length} entries
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {risks.length ? (
              risks.map((risk) => (
                <div key={risk.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800">{risk.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-wide text-slate-500">
                      {risk.status}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-500">{risk.description || 'No description provided.'}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Impact: {risk.impact}</span>
                    {risk.probability != null ? <span>Prob: {risk.probability}</span> : null}
                    {risk.severityScore != null ? <span>Score: {risk.severityScore}</span> : null}
                    {risk.owner ? <span>Owner: {risk.owner.firstName} {risk.owner.lastName}</span> : null}
                    {risk.sprint ? <span>Sprint: {risk.sprint.name}</span> : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-400">
                No risks logged for this project.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Change requests</h3>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {changeRequests.length} tracked
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {changeRequests.length ? (
              changeRequests.map((change) => (
                <div key={change.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{change.title}</p>
                      <p className="text-xs text-slate-500">
                        Requested {formatRelativeTime(change.createdAt)} by {change.requestedBy?.firstName || 'User'}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-wide text-slate-500">
                      {change.status}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-500">{change.description || 'No description provided.'}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    {change.sprint ? <span>Sprint: {change.sprint.name}</span> : <span>Cross-sprint</span>}
                    {change.status === 'pending_approval' ? (
                      <button
                        type="button"
                        onClick={() => handleApproveChange(change.id)}
                        className="rounded-full bg-blue-600 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-blue-700"
                      >
                        Approve
                      </button>
                    ) : change.approvedAt ? (
                      <span>Approved {formatRelativeTime(change.approvedAt)}</span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-400">
                No change requests submitted yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
