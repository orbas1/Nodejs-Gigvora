import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import UserAvatar from '../../components/UserAvatar.jsx';
import projectsService from '../../services/projects.js';
import analytics from '../../services/analytics.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

const DEFAULT_PROJECT_ID = '1';

function formatPercent(value, { fallback = '—', maximumFractionDigits = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Math.max(0, Math.min(Number(value), 100));
  return `${numeric.toFixed(maximumFractionDigits)}%`;
}

function formatScore(value, { fallback = '—' } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  return `${Number(value).toFixed(1)}`;
}

function formatBytes(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(value);
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  const precision = index === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[index]}`;
}

function parseListInput(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function toListField(value) {
  return Array.isArray(value) ? value.join('\n') : '';
}

function deriveStatusLabel(status) {
  if (!status) return 'Unspecified';
  return status
    .toString()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function statusBadgeClass(status) {
  switch (status) {
    case 'approved':
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'blocked':
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'changes_requested':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'in_review':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'pending':
    case 'briefing':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function priorityBadgeClass(priority) {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'low':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}

export default function FreelancerDashboardPage() {
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [briefDraft, setBriefDraft] = useState({
    title: '',
    summary: '',
    objectives: '',
    deliverables: '',
    successMetrics: '',
    clientStakeholders: '',
  });

  const metrics = workspaceData?.metrics ?? {};
  const workspace = workspaceData?.workspace ?? null;
  const project = workspaceData?.project ?? null;
  const approvals = workspaceData?.approvals ?? [];
  const conversations = workspaceData?.conversations ?? [];
  const whiteboards = workspaceData?.whiteboards ?? [];
  const files = workspaceData?.files ?? [];
  const brief = workspaceData?.brief ?? null;

  const loadWorkspace = useCallback(async (targetId) => {
    const rawId = targetId ?? DEFAULT_PROJECT_ID;
    const resolvedId = String(rawId).trim();
    if (!resolvedId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await projectsService.fetchProjectWorkspace(resolvedId);
      setWorkspaceData(response);
      setLastLoadedAt(new Date());
      const briefPayload = response.brief ?? {};
      setBriefDraft({
        title: briefPayload.title ?? `${response.project?.title ?? 'Project'} workspace brief`,
        summary: briefPayload.summary ?? '',
        objectives: toListField(briefPayload.objectives),
        deliverables: toListField(briefPayload.deliverables),
        successMetrics: toListField(briefPayload.successMetrics),
        clientStakeholders: toListField(briefPayload.clientStakeholders),
      });
      analytics.track(
        'web_workspace_dashboard_loaded',
        {
          projectId: resolvedId,
          workspaceStatus: response.workspace?.status ?? null,
          pendingApprovals: response.metrics?.pendingApprovals ?? null,
        },
        { source: 'web_app' },
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace(DEFAULT_PROJECT_ID);
  }, [loadWorkspace]);

  const handleBriefFieldChange = (field) => (event) => {
    const value = event.target.value;
    setBriefDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBriefSubmit = async (event) => {
    event.preventDefault();
    const normalizedProjectId = String(projectId).trim();
    if (!normalizedProjectId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: briefDraft.title,
        summary: briefDraft.summary,
        objectives: parseListInput(briefDraft.objectives),
        deliverables: parseListInput(briefDraft.deliverables),
        successMetrics: parseListInput(briefDraft.successMetrics),
        clientStakeholders: parseListInput(briefDraft.clientStakeholders),
        actorId: 1,
      };
      const response = await projectsService.updateProjectWorkspaceBrief(normalizedProjectId, payload);
      setWorkspaceData(response);
      setLastLoadedAt(new Date());
      const updatedBrief = response.brief ?? {};
      setBriefDraft({
        title: updatedBrief.title ?? payload.title ?? '',
        summary: updatedBrief.summary ?? '',
        objectives: toListField(updatedBrief.objectives),
        deliverables: toListField(updatedBrief.deliverables),
        successMetrics: toListField(updatedBrief.successMetrics),
        clientStakeholders: toListField(updatedBrief.clientStakeholders),
      });
      analytics.track(
        'web_workspace_brief_saved',
        {
          projectId: normalizedProjectId,
          objectives: payload.objectives.length,
          deliverables: payload.deliverables.length,
        },
        { source: 'web_app' },
      );
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleApprovalDecision = async (approvalId, status) => {
    const normalizedProjectId = String(projectId).trim();
    if (!normalizedProjectId || !approvalId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await projectsService.updateProjectWorkspaceApproval(normalizedProjectId, approvalId, {
        status,
        actorId: 1,
      });
      setWorkspaceData(response);
      setLastLoadedAt(new Date());
      analytics.track(
        'web_workspace_approval_updated',
        { projectId: normalizedProjectId, approvalId, status },
        { source: 'web_app' },
      );
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleConversationAcknowledge = async (conversationId, priority) => {
    const normalizedProjectId = String(projectId).trim();
    if (!normalizedProjectId || !conversationId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await projectsService.acknowledgeProjectWorkspaceConversation(normalizedProjectId, conversationId, {
        priority,
        actorId: 1,
      });
      setWorkspaceData(response);
      setLastLoadedAt(new Date());
      analytics.track(
        'web_workspace_conversation_acknowledged',
        { projectId: normalizedProjectId, conversationId },
        { source: 'web_app' },
      );
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const menuSections = useMemo(() => {
    const progressTag = metrics.progressPercent != null ? `${Math.round(metrics.progressPercent)}% progress` : null;
    return [
      {
        label: 'Workspace',
        items: [
          {
            name: 'Dashboard overview',
            description: 'Monitor health, approvals, automation, and milestone velocity in one place.',
            tags: [workspace?.status, progressTag].filter(Boolean),
          },
          {
            name: 'Brief & stakeholders',
            description: 'Objectives, deliverables, and client roster that guide delivery.',
            tags: [brief?.clientStakeholders?.length ? `${brief.clientStakeholders.length} stakeholders` : null].filter(Boolean),
          },
          {
            name: 'Assets & whiteboards',
            description: 'Centralised artefacts with version history and collaborator activity.',
            tags: [`${files.length} files`, `${whiteboards.length} boards`],
          },
        ],
      },
      {
        label: 'Collaboration',
        items: [
          {
            name: 'Conversations',
            description: 'Active delivery threads, client loops, and operational escalations.',
            tags: metrics.unreadMessages ? [`${metrics.unreadMessages} unread`] : [],
          },
          {
            name: 'Approvals',
            description: 'Track sign-offs and unblock delivery gates across stages.',
            tags: [metrics.pendingApprovals ? `${metrics.pendingApprovals} pending` : 'Up to date'].filter(Boolean),
          },
        ],
      },
    ];
  }, [metrics.pendingApprovals, metrics.progressPercent, metrics.unreadMessages, workspace?.status, brief?.clientStakeholders, files.length, whiteboards.length]);

  const profile = useMemo(
    () => ({
      name: 'Project steward',
      role: project?.title || 'Workspace member',
      status: workspace?.billingStatus ? `Billing: ${deriveStatusLabel(workspace.billingStatus)}` : 'Operational',
      badges: workspace?.status ? [deriveStatusLabel(workspace.status)] : [],
      metrics: [
        { label: 'Progress', value: formatPercent(metrics.progressPercent) },
        { label: 'Approvals', value: `${metrics.pendingApprovals ?? 0} open` },
        { label: 'Automation', value: formatPercent(metrics.automationCoverage, { maximumFractionDigits: 0 }) },
      ],
    }),
    [project?.title, workspace?.billingStatus, workspace?.status, metrics.progressPercent, metrics.pendingApprovals, metrics.automationCoverage],
  );

  const metricCards = useMemo(
    () => [
      {
        label: 'Delivery progress',
        value: formatPercent(metrics.progressPercent),
        detail: workspace?.nextMilestone
          ? `Next milestone: ${workspace.nextMilestone}${workspace.nextMilestoneDueAt ? ` (${formatRelativeTime(workspace.nextMilestoneDueAt)})` : ''}`
          : 'Milestones will appear as they are planned.',
        render: (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.max(0, Math.min(Number(metrics.progressPercent ?? 0), 100))}%` }}
            />
          </div>
        ),
      },
      {
        label: 'Health score',
        value: formatScore(metrics.healthScore),
        detail: `Velocity score ${formatScore(metrics.velocityScore)} | Risk ${deriveStatusLabel(workspace?.riskLevel)}`,
      },
      {
        label: 'Client satisfaction',
        value: formatPercent(metrics.clientSatisfaction, { maximumFractionDigits: 0 }),
        detail: metrics.teamUtilization != null
          ? `Team utilisation ${(metrics.teamUtilization * 100).toFixed(0)}%`
          : 'Feedback cadence on track',
      },
      {
        label: 'Approvals pending',
        value: metrics.pendingApprovals ?? 0,
        detail: `${metrics.overdueApprovals ?? 0} overdue decisions`,
      },
      {
        label: 'Unread messages',
        value: metrics.unreadMessages ?? 0,
        detail: `${conversations.length} active channels`,
      },
      {
        label: 'Asset library',
        value: `${files.length} files`,
        detail: `${formatBytes(metrics.totalAssetsSizeBytes)} stored`,
      },
    ],
    [metrics.progressPercent, workspace?.nextMilestone, workspace?.nextMilestoneDueAt, metrics.healthScore, metrics.velocityScore, workspace?.riskLevel, metrics.clientSatisfaction, metrics.teamUtilization, metrics.pendingApprovals, metrics.overdueApprovals, metrics.unreadMessages, conversations.length, files.length, metrics.totalAssetsSizeBytes],
  );

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Project workspace command centre"
      subtitle="Service delivery"
      description="Coordinate briefs, assets, conversations, and approvals from a unified freelancer workspace."
      menuSections={menuSections}
      sections={[]}
      profile={profile}
    >
      <div className="space-y-10">
        <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(30,64,175,0.4)] sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/90">Workspace dashboard</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
                  {project?.title || 'Select a project workspace'}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                  {project?.description ||
                    'Load a project workspace to review delivery velocity, collaboration pulse, and approval readiness.'}
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <label htmlFor="project-id-input" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Project ID
                </label>
                <input
                  id="project-id-input"
                  type="text"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  className="w-40 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. 42"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadWorkspace(projectId || DEFAULT_PROJECT_ID)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {loading ? 'Loading…' : 'Load workspace'}
                  </button>
                  <DataStatus
                    loading={loading}
                    fromCache={false}
                    lastUpdated={lastLoadedAt}
                    onRefresh={() => loadWorkspace(projectId)}
                  />
                </div>
              </div>
            </div>
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Unable to sync the workspace. {error.message || 'Please verify the project ID and try again.'}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {metricCards.map((card) => (
                <div
                  key={card.label}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</p>
                    <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
                  </div>
                  {card.render ? <div>{card.render}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <form
            onSubmit={handleBriefSubmit}
            className="flex h-full flex-col rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Workspace brief</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Align objectives, deliverables, and stakeholders to keep delivery teams and clients in lock-step.
                </p>
              </div>
              {brief?.updatedAt ? (
                <p className="text-xs text-slate-400">Updated {formatRelativeTime(brief.updatedAt)}</p>
              ) : null}
            </div>
            <div className="mt-6 space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-title">
                  Brief title
                </label>
                <input
                  id="brief-title"
                  type="text"
                  value={briefDraft.title}
                  onChange={handleBriefFieldChange('title')}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Workspace brief title"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-summary">
                  Summary
                </label>
                <textarea
                  id="brief-summary"
                  value={briefDraft.summary}
                  onChange={handleBriefFieldChange('summary')}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Describe the engagement scope, success definition, and any constraints."
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-objectives">
                    Objectives
                  </label>
                  <textarea
                    id="brief-objectives"
                    value={briefDraft.objectives}
                    onChange={handleBriefFieldChange('objectives')}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="One objective per line"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-deliverables">
                    Deliverables
                  </label>
                  <textarea
                    id="brief-deliverables"
                    value={briefDraft.deliverables}
                    onChange={handleBriefFieldChange('deliverables')}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="List key deliverables per line"
                  />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-metrics">
                    Success metrics
                  </label>
                  <textarea
                    id="brief-metrics"
                    value={briefDraft.successMetrics}
                    onChange={handleBriefFieldChange('successMetrics')}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="List measurable KPIs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-stakeholders">
                    Client stakeholders
                  </label>
                  <textarea
                    id="brief-stakeholders"
                    value={briefDraft.clientStakeholders}
                    onChange={handleBriefFieldChange('clientStakeholders')}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="One stakeholder per line"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {saving ? 'Saving…' : 'Save brief'}
              </button>
            </div>
          </form>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <h3 className="text-xl font-semibold text-slate-900">Delivery governance</h3>
            <p className="mt-2 text-sm text-slate-600">
              Track billing status, automation coverage, and milestone readiness to keep stakeholders informed.
            </p>
            <dl className="mt-6 grid gap-4 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="font-medium text-slate-500">Billing status</dt>
                <dd className="font-semibold text-slate-800">{deriveStatusLabel(workspace?.billingStatus)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="font-medium text-slate-500">Automation coverage</dt>
                <dd className="font-semibold text-slate-800">{formatPercent(metrics.automationCoverage)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="font-medium text-slate-500">Active automation runs</dt>
                <dd className="font-semibold text-slate-800">{metrics.automationRuns ?? 0}</dd>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Last activity {workspace?.lastActivityAt ? formatRelativeTime(workspace.lastActivityAt) : 'not yet recorded'}.{' '}
                {workspace?.lastActivityAt ? `(${formatAbsolute(workspace.lastActivityAt)})` : ''}
              </div>
            </dl>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Active whiteboards</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Visual alignment across squads with participation insights and latest updates.
                </p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {whiteboards.length} boards
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {whiteboards.length ? (
                whiteboards.map((board) => (
                  <div key={board.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{deriveStatusLabel(board.status)}</p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">{board.title}</h4>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(board.status)}`}>
                        {deriveStatusLabel(board.status)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span>Owner: {board.ownerName || 'Unassigned'}</span>
                      <span>Updated {formatRelativeTime(board.updatedAt || board.lastEditedAt)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {board.activeCollaborators?.map((collaborator) => (
                        <span
                          key={`${board.id}-${collaborator}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1"
                        >
                          <UserAvatar name={collaborator} seed={collaborator} size="xs" showGlow={false} />
                          {collaborator}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Whiteboards will appear here once collaborators publish canvases to this workspace.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">File library</h3>
                <p className="mt-1 text-sm text-slate-600">Versioned assets, ops documents, and creative files with provenance.</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {formatBytes(metrics.totalAssetsSizeBytes)}
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {files.length ? (
                files.map((file) => (
                  <div key={file.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          {file.category ? deriveStatusLabel(file.category) : 'General'} · {file.version ? `v${file.version}` : 'latest'}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                        {formatBytes(file.sizeBytes)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Uploaded {formatRelativeTime(file.uploadedAt || file.updatedAt)}</span>
                      {file.tags?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {file.tags.map((tag) => (
                            <span
                              key={`${file.id}-${tag}`}
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Upload briefs, assets, and proofing files to populate the workspace library.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Conversation pulse</h3>
                <p className="mt-1 text-sm text-slate-600">Keep project, client, and operations channels in sync.</p>
              </div>
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700">
                {conversations.length} channels
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {conversations.length ? (
                conversations.map((conversation) => (
                  <div key={conversation.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {conversation.channelType}
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">{conversation.topic}</h4>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${priorityBadgeClass(conversation.priority)}`}
                      >
                        {deriveStatusLabel(conversation.priority)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{conversation.lastMessagePreview || 'No recent updates posted.'}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span>
                        Last message {conversation.lastMessageAt ? formatRelativeTime(conversation.lastMessageAt) : '—'}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {conversation.unreadCount} unread
                        </span>
                        <button
                          type="button"
                          onClick={() => handleConversationAcknowledge(conversation.id, conversation.priority)}
                          disabled={saving || conversation.unreadCount === 0}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Mark as read
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Conversations will populate once your team and clients start collaborating in this workspace.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Approvals & gates</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Track decision owners, due dates, and unblock checkpoints for delivery.
                </p>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                {metrics.pendingApprovals ?? 0} pending
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {approvals.length ? (
                approvals.map((approval) => (
                  <div key={approval.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{approval.stage}</p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">{approval.title}</h4>
                        <p className="mt-2 text-xs text-slate-500">
                          Owner {approval.ownerName || 'Unassigned'} · Approver {approval.approverEmail || 'TBC'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(approval.status)}`}
                      >
                        {deriveStatusLabel(approval.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span>
                        Due {approval.dueAt ? `${formatRelativeTime(approval.dueAt)} (${formatAbsolute(approval.dueAt)})` : 'No due date'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprovalDecision(approval.id, 'in_review')}
                          disabled={saving}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Move to review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprovalDecision(approval.id, 'approved')}
                          disabled={saving}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprovalDecision(approval.id, 'changes_requested')}
                          disabled={saving}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Request changes
                        </button>
                      </div>
                    </div>
                    {approval.decisionNotes ? (
                      <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                        Notes: {approval.decisionNotes}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Approvals will populate once deliverables move into review stages.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
