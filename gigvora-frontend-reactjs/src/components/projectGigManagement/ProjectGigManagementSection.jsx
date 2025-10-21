import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ProjectLifecyclePanel from './ProjectLifecyclePanel.jsx';
import ProjectBidsPanel from './ProjectBidsPanel.jsx';
import ProjectInvitationsPanel from './ProjectInvitationsPanel.jsx';
import AutoMatchPanel from './AutoMatchPanel.jsx';
import ProjectReviewsPanel from './ProjectReviewsPanel.jsx';
import EscrowManagementPanel from './EscrowManagementPanel.jsx';

const SECTION_TABS = [
  { id: 'projects', label: 'Projects' },
  { id: 'bids', label: 'Bids' },
  { id: 'invites', label: 'Invites' },
  { id: 'match', label: 'Match' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'escrow', label: 'Escrow' },
];

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Number(value));
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return `${currency} 0`;
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

function SummaryCard({ label, value, accent }) {
  return (
    <div
      className={`rounded-3xl border px-4 py-5 shadow-sm transition ${
        accent ? 'border-accent/40 bg-accentSoft/60 text-accent' : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  accent: PropTypes.bool,
};

SummaryCard.defaultProps = {
  accent: false,
};

function TemplateCard({ template }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-900">{template.name ?? 'Template'}</p>
        {template.category ? (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {template.category}
          </span>
        ) : null}
        <p className="text-sm text-slate-600">{template.summary ?? 'Fast-start blueprint ready for your next project.'}</p>
      </div>
      {template.recommendedBudgetMin || template.recommendedBudgetMax ? (
        <p className="mt-4 text-xs text-slate-500">
          Suggested budget {formatCurrency(template.recommendedBudgetMin ?? 0, template.currency ?? 'USD')} –{' '}
          {formatCurrency(template.recommendedBudgetMax ?? template.recommendedBudgetMin ?? 0, template.currency ?? 'USD')}
        </p>
      ) : null}
    </div>
  );
}

TemplateCard.propTypes = {
  template: PropTypes.object.isRequired,
};

function BoardSnapshot({ board }) {
  const lanes = Array.isArray(board?.lanes) ? board.lanes : [];
  const metrics = board?.metrics ?? {};

  if (!lanes.length && !Object.keys(metrics).length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Board snapshot</h3>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {'activeProjects' in metrics ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              Active {formatNumber(metrics.activeProjects)}
            </span>
          ) : null}
          {'atRisk' in metrics ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              At risk {formatNumber(metrics.atRisk)}
            </span>
          ) : null}
          {'completed' in metrics ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              Completed {formatNumber(metrics.completed)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {lanes.slice(0, 4).map((lane) => (
          <div key={lane.status ?? lane.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {(lane.label ?? lane.status ?? 'Lane').replace(/_/g, ' ')}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(lane.projects?.length ?? lane.cards ?? 0)}</p>
            {Array.isArray(lane.projects) && lane.projects.length ? (
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                {lane.projects.slice(0, 3).map((project) => (
                  <li key={project.id ?? project.title} className="rounded-xl bg-white px-3 py-2 shadow-sm">
                    <p className="font-semibold text-slate-900">{project.title ?? 'Project'}</p>
                    {project.progress != null ? <p>{Math.round(Number(project.progress))}%</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

BoardSnapshot.propTypes = {
  board: PropTypes.object,
};

BoardSnapshot.defaultProps = {
  board: null,
};

export default function ProjectGigManagementSection({
  data,
  actions,
  loading,
  canManage,
  viewOnlyNote,
  allowedRoles,
  onOpenProject,
  onOpenOrder,
  onProjectPreview,
  activeTab,
  onTabChange,
}) {
  const summary = data?.summary ?? {};
  const templates = useMemo(
    () => (Array.isArray(data?.projectCreation?.templates) ? data.projectCreation.templates.slice(0, 4) : []),
    [data?.projectCreation?.templates],
  );
  const lifecycle = data?.projectLifecycle ?? data?.projectCreation?.lifecycle ?? {};
  const projects = useMemo(
    () => (Array.isArray(data?.projectLifecycle?.open) ? data.projectLifecycle.open : data?.projectCreation?.projects ?? []),
    [data?.projectLifecycle?.open, data?.projectCreation?.projects],
  );
  const bids = data?.projectBids ?? { bids: [], stats: {} };
  const invitations = data?.invitations ?? { entries: [], stats: {} };
  const autoMatch = data?.autoMatch ?? {};
  const reviews = data?.reviews ?? {};
  const escrow = data?.escrow ?? {};
  const board = data?.managementBoard ?? null;

  const summaryCards = [
    { label: 'Active projects', value: formatNumber(summary.activeProjects ?? lifecycle?.stats?.openCount ?? projects.length), accent: true },
    { label: 'Budget in play', value: formatCurrency(summary.budgetInPlay ?? lifecycle?.stats?.budgetInPlay, summary.currency ?? 'USD') },
    { label: 'Open gigs', value: formatNumber(summary.gigsInDelivery ?? data?.purchasedGigs?.stats?.active ?? 0) },
    { label: 'Templates', value: formatNumber(summary.templatesAvailable ?? templates.length) },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'projects':
      default:
        return (
          <div className="space-y-6">
            <ProjectLifecyclePanel
              lifecycle={lifecycle}
              onUpdateWorkspace={actions.updateWorkspace}
              canManage={canManage}
              onPreviewProject={onProjectPreview}
            />
            <BoardSnapshot board={board} />
          </div>
        );
      case 'bids':
        return (
          <ProjectBidsPanel
            bids={bids.bids ?? []}
            stats={bids.stats ?? {}}
            projects={Array.isArray(data?.projectLifecycle?.open) ? data.projectLifecycle.open : []}
            onCreateBid={actions.createProjectBid}
            onUpdateBid={actions.updateProjectBid}
            canManage={canManage}
          />
        );
      case 'invites':
        return (
          <ProjectInvitationsPanel
            entries={invitations.entries ?? []}
            stats={invitations.stats ?? {}}
            projects={Array.isArray(data?.projectLifecycle?.open) ? data.projectLifecycle.open : []}
            onSendInvitation={actions.sendProjectInvitation}
            onUpdateInvitation={actions.updateProjectInvitation}
            canManage={canManage}
          />
        );
      case 'match':
        return (
          <AutoMatchPanel
            snapshot={autoMatch}
            canManage={canManage}
            onUpdateSettings={actions.updateAutoMatchSettings}
            onCreateMatch={actions.createAutoMatch}
            onUpdateMatch={actions.updateAutoMatch}
          />
        );
      case 'reviews':
        return (
          <ProjectReviewsPanel
            snapshot={reviews}
            onCreateReview={actions.createProjectReview}
            canManage={canManage}
          />
        );
      case 'escrow':
        return (
          <EscrowManagementPanel
            snapshot={escrow}
            onCreateTransaction={actions.createEscrowTransaction}
            onUpdateSettings={actions.updateEscrowSettings}
            canManage={canManage}
          />
        );
    }
  };

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-accentSoft/50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Projects</p>
            <h2 className="text-3xl font-semibold text-slate-900">Project hub</h2>
            {viewOnlyNote ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                View only · {viewOnlyNote}
              </div>
            ) : null}
            {!canManage && allowedRoles.length ? (
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {allowedRoles.map((role) => (
                  <span key={role} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                    {role}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenProject}
              disabled={!canManage || loading}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/40"
            >
              New project
            </button>
            <button
              type="button"
              onClick={onOpenOrder}
              disabled={!canManage || loading}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Log gig
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Templates</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {templates.length ? (
            templates.map((template) => <TemplateCard key={template.id ?? template.name} template={template} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
              No templates yet.
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav className="flex w-full flex-row gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm lg:w-56 lg:flex-col">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="flex-1">
          <div className="rounded-3xl bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm">
            {renderTab()}
          </div>
        </div>
      </div>
    </section>
  );
}

ProjectGigManagementSection.propTypes = {
  data: PropTypes.object,
  actions: PropTypes.shape({
    updateWorkspace: PropTypes.func,
    createProjectBid: PropTypes.func,
    updateProjectBid: PropTypes.func,
    sendProjectInvitation: PropTypes.func,
    updateProjectInvitation: PropTypes.func,
    updateAutoMatchSettings: PropTypes.func,
    createAutoMatch: PropTypes.func,
    updateAutoMatch: PropTypes.func,
    createProjectReview: PropTypes.func,
    createEscrowTransaction: PropTypes.func,
    updateEscrowSettings: PropTypes.func,
  }),
  loading: PropTypes.bool,
  canManage: PropTypes.bool,
  viewOnlyNote: PropTypes.string,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  onOpenProject: PropTypes.func.isRequired,
  onOpenOrder: PropTypes.func.isRequired,
  onProjectPreview: PropTypes.func,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

ProjectGigManagementSection.defaultProps = {
  data: null,
  actions: {},
  loading: false,
  canManage: false,
  viewOnlyNote: null,
  allowedRoles: [],
  onProjectPreview: undefined,
};
