import { useCallback, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  CloudArrowDownIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import useProjectWorkspace from '../../hooks/useProjectWorkspace.js';
import projectsService from '../../services/projects.js';

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const numeric = Number(value);
  return `${numeric.toFixed(0)}%`;
}

function formatScore(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return 'N/A';
  }
  const numeric = Number(value);
  if (numeric % 1 === 0) {
    return numeric.toFixed(0);
  }
  return numeric.toFixed(1);
}

function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(bytes);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(value) {
  if (!value) return 'TBC';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBC';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelativeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / (1000 * 60));
  if (minutes < 1) return 'moments ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function statusTone(status) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'changes_requested':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'rejected':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'in_review':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'pending':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function priorityTone(priority) {
  switch (priority) {
    case 'high':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'urgent':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'low':
      return 'bg-slate-100 text-slate-500 border-slate-200';
    case 'normal':
    default:
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
}

function ProjectMetricCard({ icon: Icon, title, value, helper }) {
  return (
    <div className="rounded-3xl border border-emerald-100/70 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">{title}</p>
          <p className="text-lg font-semibold text-slate-900">{value}</p>
          {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function ProjectWorkspaceSection({ projectId }) {
  const { data, loading, error, fromCache, lastUpdated, refresh } = useProjectWorkspace({ projectId });
  const [busyConversationId, setBusyConversationId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const workspace = data?.workspace ?? {};
  const project = data?.project ?? {};
  const metrics = data?.metrics ?? {};
  const brief = data?.brief ?? null;
  const conversations = data?.conversations ?? [];
  const approvals = data?.approvals ?? [];
  const whiteboards = data?.whiteboards ?? [];
  const files = data?.files ?? [];

  const roleMatrix = useMemo(() => {
    const map = new Map();

    if (Array.isArray(brief?.clientStakeholders)) {
      brief.clientStakeholders.forEach((name, index) => {
        if (!name) return;
        const key = `client-${name}-${index}`;
        map.set(key, {
          name,
          role: 'Client stakeholder',
          authority: 'Executive sponsor & escalation',
        });
      });
    }

    approvals.forEach((approval) => {
      if (!approval?.ownerName) return;
      const key = `approval-${approval.ownerName}-${approval.stage ?? ''}`;
      map.set(key, {
        name: approval.ownerName,
        role: `${approval.stage ? `${approval.stage} ` : ''}approval owner`,
        authority: `Controls ${approval.title ?? 'workspace approval'}`,
      });
    });

    whiteboards.forEach((board) => {
      if (!board?.ownerName) return;
      const key = `whiteboard-${board.ownerName}-${board.title}`;
      map.set(key, {
        name: board.ownerName,
        role: 'Workspace collaborator',
        authority: `Leads ${board.title ?? 'workspace artifact'}`,
      });
    });

    conversations.forEach((conversation) => {
      (conversation?.participants ?? []).forEach((participant, index) => {
        if (!participant) return;
        const key = `conversation-${conversation.id}-${participant}-${index}`;
        map.set(key, {
          name: participant,
          role: `${conversation.channelType ?? 'project'} channel`,
          authority: `${conversation.priority ? `${conversation.priority.replace(/_/g, ' ')} priority · ` : ''}Chat guardian`,
        });
      });
    });

    if (!map.size) {
      return [];
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [approvals, brief, conversations, whiteboards]);

  const posts = useMemo(() => {
    return whiteboards
      .map((board) => ({
        ...board,
        statusLabel: board.status ? board.status.replace(/_/g, ' ') : 'Draft',
      }))
      .sort((a, b) => {
        const priority = ['active', 'pending_review', 'archived'];
        const indexA = priority.indexOf(a.status ?? 'active');
        const indexB = priority.indexOf(b.status ?? 'active');
        if (indexA !== indexB) {
          return indexA - indexB;
        }
        const dateA = a.lastEditedAt ? new Date(a.lastEditedAt).getTime() : 0;
        const dateB = b.lastEditedAt ? new Date(b.lastEditedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [whiteboards]);

  const assets = useMemo(() => {
    return files.slice().sort((a, b) => {
      const catA = (a.category ?? '').localeCompare(b.category ?? '');
      if (catA !== 0) return catA;
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [files]);

  const handleRefresh = useCallback(() => {
    refresh({ force: true });
  }, [refresh]);

  const handleAcknowledgeConversation = useCallback(
    async (conversation) => {
      if (!projectId || !conversation?.id) {
        return;
      }
      setBusyConversationId(conversation.id);
      setFeedback(null);
      try {
        await projectsService.acknowledgeProjectWorkspaceConversation(projectId, conversation.id, {});
        setFeedback({ type: 'success', message: 'Conversation marked as read.' });
        await refresh({ force: true });
      } catch (ackError) {
        console.error('Failed to acknowledge workspace conversation', ackError);
        setFeedback({
          type: 'error',
          message: ackError?.message || 'Unable to update the conversation right now.',
        });
      } finally {
        setBusyConversationId(null);
      }
    },
    [projectId, refresh],
  );

  const metricCards = [
    {
      icon: DocumentChartBarIcon,
      title: 'Progress',
      value: formatPercent(metrics.progressPercent ?? workspace.progressPercent ?? 0),
      helper: workspace.nextMilestone
        ? `Next: ${workspace.nextMilestone} · ${formatDate(workspace.nextMilestoneDueAt)}`
        : 'Milestone schedule in flight',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Health score',
      value: formatScore(metrics.healthScore ?? workspace.healthScore),
      helper: workspace.riskLevel ? `${workspace.riskLevel.replace(/_/g, ' ')} risk` : 'Risk tracking',
    },
    {
      icon: BoltIcon,
      title: 'Velocity',
      value: formatScore(metrics.velocityScore ?? workspace.velocityScore),
      helper: metrics.automationRuns != null ? `${metrics.automationRuns} automations` : null,
    },
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: 'Unread chat',
      value: metrics.unreadMessages ?? 0,
      helper: metrics.pendingApprovals ? `${metrics.pendingApprovals} approvals in motion` : 'Workspace communications',
    },
    {
      icon: ClipboardDocumentListIcon,
      title: 'Approvals due',
      value: metrics.overdueApprovals ? `${metrics.overdueApprovals} overdue` : `${metrics.pendingApprovals ?? 0} active`,
      helper: workspace.billingStatus ? `Billing ${workspace.billingStatus.replace(/_/g, ' ')}` : null,
    },
    {
      icon: CloudArrowDownIcon,
      title: 'Assets secured',
      value: metrics.totalAssets ?? assets.length,
      helper: metrics.totalAssetsSizeBytes ? formatBytes(metrics.totalAssetsSizeBytes) : null,
    },
  ];

  return (
    <section className="space-y-6 rounded-4xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Workspace orchestration</p>
          <h3 className="text-2xl font-semibold text-slate-900">{project.title ?? 'Project workspace command centre'}</h3>
          <p className="max-w-2xl text-sm text-slate-600">
            Coordinate objectives, approvals, knowledge posts, and secure chat inside the agency workspace. Every control is
            tuned for enterprise delivery and role-based governance.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
          <div>
            {loading && !data ? 'Syncing…' : null}
            {!loading && fromCache ? 'Showing cached intelligence' : null}
            {!loading && !fromCache && lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : null}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 shadow-sm transition hover:bg-emerald-100"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh workspace
          </button>
        </div>
      </header>

      {feedback ? (
        <div
          className={`rounded-3xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-600'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{feedback.message}</p>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
          <p>{error.message || 'Unable to load the project workspace right now.'}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <ProjectMetricCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Mission brief</h4>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
              {brief?.updatedAt ? `Updated ${formatRelativeDate(brief.updatedAt)}` : 'Live'}
            </span>
          </div>
          {brief ? (
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              {brief.summary ? <p className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">{brief.summary}</p> : null}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Objectives</p>
                  <ul className="mt-2 space-y-1">
                    {brief.objectives.length ? (
                      brief.objectives.map((item, index) => (
                        <li key={`objective-${index}`} className="flex items-start gap-2">
                          <CheckCircleIcon className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-400">No objectives documented yet.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Success metrics</p>
                  <ul className="mt-2 space-y-1">
                    {brief.successMetrics.length ? (
                      brief.successMetrics.map((item, index) => (
                        <li key={`metric-${index}`} className="flex items-start gap-2">
                          <ShieldCheckIcon className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-400">Define success metrics to track impact.</li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Deliverables</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {brief.deliverables.length ? (
                      brief.deliverables.map((item, index) => (
                        <li key={`deliverable-${index}`} className="rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-700">
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-400">Delivery inventory pending.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Stakeholders</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {brief.clientStakeholders.length ? (
                      brief.clientStakeholders.map((item, index) => (
                        <li key={`stakeholder-${index}`} className="rounded-xl bg-slate-100 px-3 py-1.5 text-slate-600">
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-400">Assign client-side partners to unlock collaboration.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Workspace brief will initialise on first sync.</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Role authority matrix</h4>
            <UserGroupIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          {roleMatrix.length ? (
            <ul className="mt-4 space-y-3">
              {roleMatrix.map((entry, index) => (
                <li key={`role-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">{entry.role}</p>
                  <p className="mt-1 text-xs text-slate-500">{entry.authority}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Assign workspace collaborators and approvers to activate governance signals.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">In-project chat</h4>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              {conversations.length} channels
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {conversations.length ? (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50/40 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{conversation.topic}</p>
                      <p className="text-xs text-slate-500">{conversation.lastMessagePreview || 'Workspace activity'}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${priorityTone(
                        conversation.priority,
                      )}`}
                    >
                      {conversation.priority ? conversation.priority.replace(/_/g, ' ') : 'Normal'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-slate-500">
                      {conversation.channelType?.replace(/_/g, ' ') ?? 'Project'} channel
                    </span>
                    <span>{conversation.unreadCount ?? 0} unread</span>
                    {conversation.lastMessageAt ? (
                      <span>Last activity {formatRelativeDate(conversation.lastMessageAt)}</span>
                    ) : null}
                    {conversation.externalLink ? (
                      <a
                        href={conversation.externalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 underline-offset-2 hover:underline"
                      >
                        Open thread
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                      {(conversation.participants ?? []).map((participant, index) => (
                        <span key={`${conversation.id}-participant-${index}`} className="rounded-full bg-slate-100 px-2 py-1">
                          {participant}
                        </span>
                      ))}
                      {!(conversation.participants ?? []).length ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1">Participants pending</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAcknowledgeConversation(conversation)}
                      disabled={busyConversationId === conversation.id}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyConversationId === conversation.id ? 'Marking…' : 'Mark read'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                No workspace conversations yet. Launch a project standup thread to kickstart delivery rituals.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Approvals & governance</h4>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{approvals.length} workflows</span>
          </div>
          <div className="mt-4 space-y-3">
            {approvals.length ? (
              approvals.map((approval) => (
                <div key={approval.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{approval.title}</p>
                      <p className="text-xs text-slate-500">Stage {approval.stage?.replace(/_/g, ' ') ?? 'planning'}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone(
                      approval.status,
                    )}`}>
                      {approval.status?.replace(/_/g, ' ') ?? 'pending'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {approval.ownerName ? <span>Owner {approval.ownerName}</span> : null}
                    {approval.approverEmail ? <span>Approver {approval.approverEmail}</span> : null}
                    {approval.dueAt ? <span>Due {formatDate(approval.dueAt)}</span> : null}
                    {approval.submittedAt ? <span>Submitted {formatRelativeDate(approval.submittedAt)}</span> : null}
                  </div>
                  {approval.decisionNotes ? (
                    <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs text-slate-600">{approval.decisionNotes}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                Approval workflows will populate once deliverables enter review.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Knowledge posts & rituals</h4>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">{posts.length} live</span>
          </div>
          <div className="mt-4 space-y-3">
            {posts.length ? (
              posts.map((post) => (
                <div key={post.id} className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50/80 to-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{post.title}</p>
                      <p className="text-xs text-slate-500">{post.tags?.length ? post.tags.join(' • ') : 'Workspace post'}</p>
                    </div>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs text-emerald-600">{post.statusLabel}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {post.ownerName ? <span>Owner {post.ownerName}</span> : null}
                    {post.activeCollaborators?.length ? (
                      <span>{post.activeCollaborators.length} collaborators</span>
                    ) : null}
                    {post.lastEditedAt ? <span>Updated {formatRelativeDate(post.lastEditedAt)}</span> : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                Publish retros, sprint rituals, and knowledge artefacts to align every stakeholder.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Secure assets & posts</h4>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{assets.length} files</span>
          </div>
          <div className="mt-4 space-y-3">
            {assets.length ? (
              assets.map((file) => (
                <div key={file.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">{file.category ? file.category.replace(/_/g, ' ') : 'Asset'}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{formatBytes(file.sizeBytes)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {file.version ? <span>v{file.version}</span> : null}
                    {file.uploadedAt ? <span>Uploaded {formatRelativeDate(file.uploadedAt)}</span> : null}
                    {file.permissions?.visibility ? <span>Visibility {file.permissions.visibility.replace(/_/g, ' ')}</span> : null}
                    {file.permissions?.allowedRoles?.length ? (
                      <span>
                        Roles {file.permissions.allowedRoles.map((role) => role.replace(/_/g, ' ')).join(', ')}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                Upload briefs, QA packs, and delivery assets to keep every pod member in lockstep.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
