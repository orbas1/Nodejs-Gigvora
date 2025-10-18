import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../../../components/DataStatus.jsx';
import useProjectGigManagement from '../../../../hooks/useProjectGigManagement.js';
import ProjectLifecyclePanel from '../../../../components/projectGigManagement/ProjectLifecyclePanel.jsx';
import ProjectBidsPanel from '../../../../components/projectGigManagement/ProjectBidsPanel.jsx';
import ProjectInvitationsPanel from '../../../../components/projectGigManagement/ProjectInvitationsPanel.jsx';
import AutoMatchPanel from '../../../../components/projectGigManagement/AutoMatchPanel.jsx';
import ProjectReviewsPanel from '../../../../components/projectGigManagement/ProjectReviewsPanel.jsx';
import EscrowManagementPanel from '../../../../components/projectGigManagement/EscrowManagementPanel.jsx';
import GigOperationsWorkspace from '../../../../components/projectGigManagement/GigOperationsWorkspace.jsx';
import ProjectWizard from '../../../../components/projectGigManagement/ProjectWizard.jsx';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${formatNumber(value)}`;
  }
}

function resolveDefaultAuthorName(session) {
  if (!session) {
    return null;
  }
  if (session.name) {
    return session.name;
  }
  if (session.user?.name) {
    return session.user.name;
  }
  const parts = [session.user?.firstName, session.user?.lastName].filter(Boolean);
  if (parts.length) {
    return parts.join(' ');
  }
  return session.email ?? session.user?.email ?? null;
}

function ProjectPreviewSheet({ project, onClose }) {
  if (!project) {
    return null;
  }

  const workspace = project.workspace ?? {};
  const budget = project.budget ?? {};
  const milestones = Array.isArray(project.milestones) ? project.milestones : [];
  const collaborators = Array.isArray(project.collaborators) ? project.collaborators : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{project.title ?? 'Project'}</h2>
            {project.clientName ? (
              <p className="text-xs text-slate-500">{project.clientName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close project preview"
          >
            ×
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {(workspace.status ?? project.status ?? 'planning').replace(/_/g, ' ')}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {Math.round(Number(workspace.progressPercent ?? project.progressPercent ?? 0))}%
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatCurrency(budget.allocated ?? workspace.budgetAllocated, budget.currency ?? workspace.currency ?? 'USD')}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {(workspace.riskLevel ?? project.riskLevel ?? 'low').replace(/_/g, ' ')}
              </p>
            </div>
          </section>

          {milestones.length ? (
            <section className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Milestones</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {milestones.slice(0, 6).map((milestone) => (
                  <div key={milestone.id ?? milestone.title} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{milestone.title ?? 'Milestone'}</p>
                    {milestone.dueDate ? (
                      <p className="mt-1 text-xs text-slate-500">Due {new Date(milestone.dueDate).toLocaleDateString()}</p>
                    ) : null}
                    {milestone.status ? (
                      <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                        {String(milestone.status).replace(/_/g, ' ')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {collaborators.length ? (
            <section className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Collaborators</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {collaborators.slice(0, 6).map((collaborator) => (
                  <div key={collaborator.id ?? collaborator.email ?? collaborator.name} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{collaborator.name ?? collaborator.email ?? 'Collaborator'}</p>
                    {collaborator.role ? (
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{collaborator.role}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

ProjectPreviewSheet.propTypes = {
  project: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

ProjectPreviewSheet.defaultProps = {
  project: null,
};

const BOARD_TABS = [
  { id: 'projects', label: 'Projects' },
  { id: 'bids', label: 'Bids' },
  { id: 'invites', label: 'Invites' },
  { id: 'match', label: 'Match' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'escrow', label: 'Escrow' },
];

export default function UserProjectsWorkspace({ userId, session }) {
  const { data, loading, error, actions, reload } = useProjectGigManagement(userId);
  const [boardTab, setBoardTab] = useState('projects');
  const [projectWizardOpen, setProjectWizardOpen] = useState(false);
  const [previewProjectId, setPreviewProjectId] = useState(null);

  const access = data?.access ?? {};
  const canManage = access.canManage !== false;
  const accessMessage = !canManage ? access.reason ?? 'Workspace access is view only for your role.' : null;

  const summary = data?.summary ?? {};
  const autoMatchSummary = data?.autoMatch?.summary ?? {};
  const invitationStats = data?.invitations?.stats ?? {};
  const bidsStats = data?.projectBids?.stats ?? {};
  const reviewsSummary = data?.reviews?.summary ?? {};
  const lastUpdated = data?.meta?.lastUpdated ?? summary.lastUpdated ?? null;
  const fromCache = data?.meta?.fromCache ?? false;

  const projects = data?.projectCreation?.projects ?? [];
  const templates = data?.projectCreation?.templates ?? [];
  const orders = data?.purchasedGigs?.orders ?? [];

  const defaultAuthorName = useMemo(() => resolveDefaultAuthorName(session), [session]);
  const previewProject = useMemo(
    () => projects.find((project) => project.id === previewProjectId) ?? null,
    [projects, previewProjectId],
  );

  const summaryCards = useMemo(() => {
    const currency = summary.currency ?? 'USD';
    return [
      { id: 'projects', label: 'Projects', value: formatNumber(summary.totalProjects) },
      { id: 'active-projects', label: 'Active', value: formatNumber(summary.activeProjects) },
      { id: 'open-gigs', label: 'Open gigs', value: formatNumber(summary.openGigs) },
      { id: 'gig-value', label: 'Gig value', value: formatCurrency(summary.openGigValue, currency) },
      { id: 'budget', label: 'Budget', value: formatCurrency(summary.budgetInPlay, currency) },
      { id: 'matches', label: 'Matches', value: formatNumber(autoMatchSummary.totalMatches ?? autoMatchSummary.active ?? 0) },
      { id: 'invites', label: 'Invites', value: formatNumber(invitationStats.pending ?? invitationStats.total ?? 0) },
      { id: 'bids', label: 'Bids', value: formatNumber(bidsStats.total ?? 0) },
      { id: 'reviews', label: 'Reviews', value: formatNumber(reviewsSummary.total ?? 0) },
    ];
  }, [summary, autoMatchSummary, invitationStats, bidsStats, reviewsSummary]);

  const boardContent = useMemo(() => {
    if (!data) {
      return null;
    }

    if (boardTab === 'projects') {
      const lifecycle = data.projectLifecycle ?? { open: [], closed: [], stats: {} };
      if (!lifecycle.open.length && !lifecycle.closed.length) {
        return (
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
            No projects yet.
          </div>
        );
      }
      return (
        <ProjectLifecyclePanel
          lifecycle={lifecycle}
          onUpdateWorkspace={actions.updateWorkspace}
          canManage={canManage}
          onPreviewProject={(projectId) => setPreviewProjectId(projectId)}
        />
      );
    }

    if (boardTab === 'bids') {
      return (
        <ProjectBidsPanel
          bids={data.projectBids?.bids ?? []}
          stats={data.projectBids?.stats ?? {}}
          projects={projects}
          onCreateBid={actions.createProjectBid}
          onUpdateBid={actions.updateProjectBid}
          canManage={canManage}
        />
      );
    }

    if (boardTab === 'invites') {
      return (
        <ProjectInvitationsPanel
          entries={data.invitations?.entries ?? []}
          stats={data.invitations?.stats ?? {}}
          projects={projects}
          onSendInvitation={actions.sendProjectInvitation}
          onUpdateInvitation={actions.updateProjectInvitation}
          canManage={canManage}
        />
      );
    }

    if (boardTab === 'match') {
      return (
        <AutoMatchPanel
          settings={data.autoMatch?.settings ?? {}}
          matches={data.autoMatch?.matches ?? []}
          summary={data.autoMatch?.summary ?? {}}
          projects={projects}
          onUpdateSettings={actions.updateAutoMatchSettings}
          onCreateMatch={actions.createAutoMatch}
          onUpdateMatch={actions.updateAutoMatch}
          canManage={canManage}
        />
      );
    }

    if (boardTab === 'reviews') {
      return (
        <ProjectReviewsPanel
          entries={data.reviews?.entries ?? []}
          summary={data.reviews?.summary ?? {}}
          projects={projects}
          orders={orders}
          onCreateReview={actions.createProjectReview}
          canManage={canManage}
        />
      );
    }

    if (boardTab === 'escrow') {
      return (
        <EscrowManagementPanel
          account={data.escrow?.account ?? {}}
          transactions={data.escrow?.transactions ?? []}
          onCreateTransaction={actions.createEscrowTransaction}
          onUpdateSettings={actions.updateEscrowSettings}
          canManage={canManage}
        />
      );
    }

    return null;
  }, [data, boardTab, actions, canManage, projects, orders]);

  return (
    <div className="flex flex-col gap-10">
      <section id="user-projects-overview" className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
            <p className="text-sm text-slate-500">Track every build, gig, and invite from one screen.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setProjectWizardOpen(true)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              disabled={!canManage}
            >
              New project
            </button>
            <button
              type="button"
              onClick={() => reload()}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Refresh
            </button>
          </div>
        </header>

        <DataStatus
          loading={loading}
          error={error}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRefresh={reload}
          statusLabel="Workspace data"
        />

        {accessMessage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs font-semibold text-amber-700">
            {accessMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="user-projects-board" className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Board</h2>
          <nav className="flex flex-wrap gap-2">
            {BOARD_TABS.map((tab) => {
              const isActive = boardTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBoardTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>
        {loading && !data ? (
          <div className="min-h-[320px] animate-pulse rounded-3xl border border-slate-200 bg-white/70" />
        ) : (
          boardContent
        )}
      </section>

      <section id="user-projects-operations" className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Gigs</h2>
          <p className="text-sm text-slate-500">Manage orders, timelines, chats, and escrow in one workspace.</p>
        </header>
        <GigOperationsWorkspace
          data={data ?? {}}
          canManage={canManage}
          onCreateOrder={actions.createGigOrder}
          onUpdateOrder={actions.updateGigOrder}
          onAddTimelineEvent={actions.addTimelineEvent}
          onPostMessage={actions.postGigMessage}
          onCreateEscrow={actions.createEscrowCheckpoint}
          onUpdateEscrow={actions.updateEscrowCheckpoint}
          onSubmitReview={(orderId, payload) => actions.updateGigOrder(orderId, payload)}
          defaultAuthorName={defaultAuthorName}
        />
      </section>

      <ProjectWizard
        open={projectWizardOpen}
        onClose={() => setProjectWizardOpen(false)}
        onSubmit={async (payload) => {
          await actions.createProject(payload);
          setProjectWizardOpen(false);
        }}
        templates={templates}
      />

      <ProjectPreviewSheet project={previewProject} onClose={() => setPreviewProjectId(null)} />
    </div>
  );
}

UserProjectsWorkspace.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  session: PropTypes.object,
};

UserProjectsWorkspace.defaultProps = {
  session: null,
};

