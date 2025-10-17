import PropTypes from 'prop-types';
import ProjectLifecyclePanel from './ProjectLifecyclePanel.jsx';
import ProjectBidsPanel from './ProjectBidsPanel.jsx';
import ProjectInvitationsPanel from './ProjectInvitationsPanel.jsx';
import AutoMatchPanel from './AutoMatchPanel.jsx';
import ProjectReviewsPanel from './ProjectReviewsPanel.jsx';
import EscrowManagementPanel from './EscrowManagementPanel.jsx';

function PanelWrapper({ children }) {
  return <div className="min-h-[24rem] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>;
}

PanelWrapper.propTypes = {
  children: PropTypes.node,
};

PanelWrapper.defaultProps = {
  children: null,
};

function EmptyPanel({ title, actionLabel, onAction }) {
  return (
    <PanelWrapper>
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-slate-500">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </PanelWrapper>
  );
}

EmptyPanel.propTypes = {
  title: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};

EmptyPanel.defaultProps = {
  actionLabel: null,
  onAction: undefined,
};

export default function ProjectGigManagementSection({
  data,
  actions,
  activeTab,
  canManage,
  onProjectPreview,
}) {
  const lifecycle = data?.projectLifecycle ?? { open: [], closed: [], stats: {} };
  const projects = data?.projectCreation?.projects ?? [];
  const bids = data?.projectBids ?? { bids: [], stats: {} };
  const invitations = data?.invitations ?? { entries: [], stats: {} };
  const autoMatch = data?.autoMatch ?? { settings: {}, matches: [], summary: {} };
  const reviews = data?.reviews ?? { entries: [], summary: {} };
  const escrow = data?.escrow ?? { account: {}, transactions: [] };
  const purchasedGigs = data?.purchasedGigs ?? { orders: [] };

  const handleProjectSelect = (projectId) => {
    if (onProjectPreview) {
      onProjectPreview(projectId);
    }
  };

  if (activeTab === 'projects') {
    if (!lifecycle.open.length && !lifecycle.closed.length) {
      return <EmptyPanel title="No projects yet" />;
    }

    return (
      <ProjectLifecyclePanel
        lifecycle={lifecycle}
        onUpdateWorkspace={actions.updateWorkspace}
        canManage={canManage}
        onPreviewProject={handleProjectSelect}
      />
    );
  }

  if (activeTab === 'bids') {
    return (
      <ProjectBidsPanel
        bids={bids.bids ?? []}
        stats={bids.stats ?? {}}
        projects={projects}
        onCreateBid={actions.createProjectBid}
        onUpdateBid={actions.updateProjectBid}
        canManage={canManage}
      />
    );
  }

  if (activeTab === 'invites') {
    return (
      <ProjectInvitationsPanel
        entries={invitations.entries ?? []}
        stats={invitations.stats ?? {}}
        projects={projects}
        onSendInvitation={actions.sendProjectInvitation}
        onUpdateInvitation={actions.updateProjectInvitation}
        canManage={canManage}
      />
    );
  }

  if (activeTab === 'match') {
    return (
      <AutoMatchPanel
        settings={autoMatch.settings ?? {}}
        matches={autoMatch.matches ?? []}
        summary={autoMatch.summary ?? {}}
        projects={projects}
        onUpdateSettings={actions.updateAutoMatchSettings}
        onCreateMatch={actions.createAutoMatch}
        onUpdateMatch={actions.updateAutoMatch}
        canManage={canManage}
      />
    );
  }

  if (activeTab === 'reviews') {
    return (
      <ProjectReviewsPanel
        entries={reviews.entries ?? []}
        summary={reviews.summary ?? {}}
        projects={projects}
        orders={purchasedGigs.orders ?? []}
        onCreateReview={actions.createProjectReview}
        canManage={canManage}
      />
    );
  }

  if (activeTab === 'escrow') {
    return (
      <EscrowManagementPanel
        account={escrow.account ?? {}}
        transactions={escrow.transactions ?? []}
        onCreateTransaction={actions.createEscrowTransaction}
        onUpdateSettings={actions.updateEscrowSettings}
        canManage={canManage}
      />
    );
  }

  return <EmptyPanel title="Choose a tab" />;
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
  }).isRequired,
  activeTab: PropTypes.string.isRequired,
  canManage: PropTypes.bool,
  onProjectPreview: PropTypes.func,
};

ProjectGigManagementSection.defaultProps = {
  data: null,
  canManage: false,
  onProjectPreview: undefined,
};
