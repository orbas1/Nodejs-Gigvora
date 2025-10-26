import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ProjectLifecyclePanel from './ProjectLifecyclePanel.jsx';
import ProjectBidsPanel from './ProjectBidsPanel.jsx';
import ProjectInvitationsPanel from './ProjectInvitationsPanel.jsx';
import AutoMatchPanel from './AutoMatchPanel.jsx';
import ProjectReviewsPanel from './ProjectReviewsPanel.jsx';
import EscrowManagementPanel from './EscrowManagementPanel.jsx';
import GigBoard from './GigBoard.jsx';
import ProposalBuilder from './ProposalBuilder.jsx';
import ContractTracker from './ContractTracker.jsx';
import { formatDateLabel } from '../../utils/date.js';

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

function buildProposalStateFromOpportunity(opportunity) {
  if (!opportunity) {
    return null;
  }

  const persona = (opportunity.personaFit?.[0] ?? 'operations').toLowerCase();
  const blockers = Array.isArray(opportunity.blockers) ? opportunity.blockers : [];
  const activityLog = Array.isArray(opportunity.activityLog) ? opportunity.activityLog : [];
  const deliverables = (blockers.length
    ? blockers
    : [
        {
          id: 'next-step',
          label: opportunity.nextAction ?? 'Confirm scope and stakeholders',
          owner: opportunity.owner ?? 'Project lead',
          dueDate: opportunity.dueDate ?? null,
        },
      ]
  ).map((item, index) => ({
    id: `del-${item.id ?? index}`,
    title: item.label ?? `Deliverable ${index + 1}`,
    outcome:
      item.owner && item.label
        ? `${item.owner} leads ${item.label.toLowerCase()}.`
        : `Resolve ${item.label ?? 'identified blocker'}.`,
    measurement: item.dueDate ? `Complete by ${formatDateLabel(item.dueDate)}` : 'Tracked within GigBoard.',
  }));

  const milestones = [
    {
      id: 'milestone-response',
      label: opportunity.nextAction ?? 'Initial response',
      dueDate: opportunity.responseTimeHours
        ? new Date(Date.now() + opportunity.responseTimeHours * 60 * 60 * 1000)
        : opportunity.dueDate ?? null,
      owner: opportunity.owner ?? 'Workspace team',
      dependencies: blockers.map((blocker) => blocker.label).filter(Boolean).slice(0, 3),
    },
  ];

  const touchpoints = activityLog.slice(0, 3).map((entry) => `${entry.label} · ${formatDateLabel(entry.at, { includeTime: true })}`);
  const goals = [
    `Win ${opportunity.title}`,
    blockers[0]?.label ? `Clear blocker: ${blockers[0].label}` : null,
    opportunity.nextAction ? `Next action: ${opportunity.nextAction}` : null,
  ]
    .filter(Boolean)
    .slice(0, 3);

  const successMetrics = [
    opportunity.fillRate ? `Reach ${Math.round(opportunity.fillRate)}% fill rate` : null,
    'Stakeholder satisfaction above 4.5/5',
    'Launch within agreed timeline',
  ].filter(Boolean);

  const riskRegister = blockers.map((blocker, index) => ({
    id: `risk-${blocker.id ?? index}`,
    label: blocker.label ?? `Risk ${index + 1}`,
    mitigation: blocker.owner ? `Partner with ${blocker.owner} to remove blocker.` : 'Track via GigBoard coaching.',
  }));

  const schedule = [
    {
      id: 'pay-1',
      label: 'Kickoff',
      percentage: 40,
      dueOn: 'Contract signature',
    },
    {
      id: 'pay-2',
      label: 'Midpoint review',
      percentage: 35,
      dueOn: milestones[0]?.label ?? 'Milestone approval',
    },
    {
      id: 'pay-3',
      label: 'Final delivery',
      percentage: 25,
      dueOn: 'Project acceptance',
    },
  ];

  const confidence = Math.max(45, Math.min(95, Math.round(opportunity.healthScore ?? 72)));

  return {
    __sourceOpportunityId: opportunity.id,
    overview: {
      title: opportunity.title ?? '',
      client: opportunity.client ?? '',
      persona,
      summary: opportunity.summary ?? '',
      goals,
      successMetrics: successMetrics.length ? successMetrics : ['Reduce cycle time', 'Elevate satisfaction', 'Protect margin'],
    },
    scope: {
      deliverables,
      milestones,
      touchpoints: touchpoints.length ? touchpoints : ['Weekly status sync', 'Executive monthly report'],
    },
    investment: {
      billingModel: opportunity.stage === 'awarded' ? 'retainer' : 'fixed',
      currency: opportunity.currency ?? 'USD',
      amount: Number.isFinite(opportunity.value) ? Number(opportunity.value) : 0,
      paymentSchedule: schedule,
      confidence,
      commercialNotes: opportunity.nextAction ?? 'Align approvals with legal and finance before award.',
      approvals: { legal: false, compliance: false, finance: false },
      riskRegister,
    },
    history: activityLog.map((entry) => ({
      timestamp: entry.at,
      label: entry.label,
      meta: entry.actor,
    })),
  };
}

function serialiseProposalDraft(draft) {
  if (!draft) {
    return {};
  }

  const { __sourceOpportunityId: _omit, ...rest } = draft;

  const normalizeDate = (value) => {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      const iso = value.toISOString();
      return Number.isNaN(Date.parse(iso)) ? null : iso;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  };

  const normalizeMilestones = Array.isArray(rest.scope?.milestones)
    ? rest.scope.milestones.map((milestone) => ({
        ...milestone,
        dueDate: normalizeDate(milestone.dueDate),
      }))
    : [];

  const normalizeSchedule = Array.isArray(rest.investment?.paymentSchedule)
    ? rest.investment.paymentSchedule.map((entry) => ({
        ...entry,
        dueOn: normalizeDate(entry.dueOn),
      }))
    : [];

  const normalizeHistory = Array.isArray(rest.history)
    ? rest.history.map((entry) => ({
        ...entry,
        timestamp: normalizeDate(entry.timestamp) ?? new Date().toISOString(),
      }))
    : [];

  return {
    ...rest,
    scope: {
      ...rest.scope,
      milestones: normalizeMilestones,
    },
    investment: {
      ...rest.investment,
      paymentSchedule: normalizeSchedule,
    },
    history: normalizeHistory,
  };
}
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
  onToggleContractObligation,
  defaultVendorName,
}) {
  const summary = data?.summary ?? {};
  const templates = useMemo(
    () => (Array.isArray(data?.projectCreation?.templates) ? data.projectCreation.templates.slice(0, 4) : []),
    [data?.projectCreation?.templates],
  );
  const lifecycle = data?.projectLifecycle ?? data?.projectCreation?.lifecycle ?? {};
  const openLifecycleProjects = Array.isArray(data?.projectLifecycle?.open) ? data.projectLifecycle.open : [];
  const closedLifecycleProjects = Array.isArray(data?.projectLifecycle?.closed) ? data.projectLifecycle.closed : [];
  const creationProjects = Array.isArray(data?.projectCreation?.projects) ? data.projectCreation.projects : [];
  const projectsForSummary = useMemo(
    () => (openLifecycleProjects.length ? openLifecycleProjects : creationProjects),
    [openLifecycleProjects, creationProjects],
  );
  const projectsForMatch = useMemo(() => {
    if (openLifecycleProjects.length || closedLifecycleProjects.length) {
      return [...openLifecycleProjects, ...closedLifecycleProjects];
    }
    return creationProjects;
  }, [openLifecycleProjects, closedLifecycleProjects, creationProjects]);
  const bids = data?.projectBids ?? { bids: [], stats: {} };
  const invitations = data?.invitations ?? { entries: [], stats: {} };
  const autoMatch = data?.autoMatch ?? {};
  const reviews = data?.reviews ?? {};
  const escrow = data?.escrow ?? {};
  const board = data?.managementBoard ?? null;
  const orders = useMemo(
    () => (Array.isArray(data?.purchasedGigs?.orders) ? data.purchasedGigs.orders : []),
    [data?.purchasedGigs?.orders],
  );

  const autoMatchSettings = autoMatch.settings ?? {};
  const autoMatchMatches = Array.isArray(autoMatch.matches) ? autoMatch.matches : [];
  const autoMatchSummary = autoMatch.summary ?? {};
  const reviewEntries = Array.isArray(reviews.entries) ? reviews.entries : [];
  const reviewSummary = reviews.summary ?? {};
  const escrowAccount = escrow.account ?? null;
  const escrowTransactions = Array.isArray(escrow.transactions) ? escrow.transactions : [];
  const gigBoardData = data?.gigBoard ?? {};
  const opportunities = Array.isArray(gigBoardData.opportunities) ? gigBoardData.opportunities : [];
  const contracts = Array.isArray(data?.contractOperations?.contracts)
    ? data.contractOperations.contracts
    : [];

  const [selectedOpportunityId, setSelectedOpportunityId] = useState(opportunities[0]?.id ?? null);
  const [activeContractId, setActiveContractId] = useState(contracts[0]?.id ?? null);
  const [proposalDraft, setProposalDraft] = useState(null);
  const [proposalSaving, setProposalSaving] = useState(false);
  const [proposalFeedback, setProposalFeedback] = useState(null);
  const [contractFeedback, setContractFeedback] = useState(null);
  const [contractUpdating, setContractUpdating] = useState(false);

  useEffect(() => {
    if (!opportunities.length) {
      setSelectedOpportunityId(null);
      return;
    }
    setSelectedOpportunityId((current) => {
      if (current && opportunities.some((opportunity) => opportunity.id === current)) {
        return current;
      }
      return opportunities[0]?.id ?? null;
    });
  }, [opportunities]);

  useEffect(() => {
    if (!contracts.length) {
      setActiveContractId(null);
      return;
    }
    setActiveContractId((current) => {
      if (current && contracts.some((contract) => contract.id === current)) {
        return current;
      }
      return contracts[0]?.id ?? null;
    });
  }, [contracts]);

  const selectedOpportunity = useMemo(
    () => opportunities.find((opportunity) => opportunity.id === selectedOpportunityId) ?? null,
    [opportunities, selectedOpportunityId],
  );

  const activeContract = useMemo(
    () => contracts.find((contract) => contract.id === activeContractId) ?? null,
    [contracts, activeContractId],
  );

  useEffect(() => {
    if (!selectedOpportunity) {
      setProposalDraft(null);
      return;
    }
    setProposalDraft((current) => {
      if (!current || current.__sourceOpportunityId !== selectedOpportunity.id) {
        return buildProposalStateFromOpportunity(selectedOpportunity);
      }
      return current;
    });
  }, [selectedOpportunity]);

  const summaryCards = [
    {
      label: 'Active projects',
      value: formatNumber(summary.activeProjects ?? lifecycle?.stats?.openCount ?? projectsForSummary.length),
      accent: true,
    },
    { label: 'Budget in play', value: formatCurrency(summary.budgetInPlay ?? lifecycle?.stats?.budgetInPlay, summary.currency ?? 'USD') },
    { label: 'Open gigs', value: formatNumber(summary.gigsInDelivery ?? data?.purchasedGigs?.stats?.active ?? 0) },
    { label: 'Templates', value: formatNumber(summary.templatesAvailable ?? templates.length) },
  ];

  const selectedProjectForProposal = useMemo(
    () => projectsForMatch.find((project) => project.id === selectedOpportunityId) ?? null,
    [projectsForMatch, selectedOpportunityId],
  );

  const handleOpportunitySelect = useCallback((opportunity) => {
    setSelectedOpportunityId(opportunity?.id ?? null);
  }, []);

  const handleContractObligationToggle = useCallback(
    async (obligation, completed) => {
      if (!activeContract) {
        return;
      }
      if (!onToggleContractObligation) {
        return;
      }

      setContractUpdating(true);
      setContractFeedback(null);
      try {
        await onToggleContractObligation(activeContract, obligation, completed);
        setContractFeedback({
          tone: 'success',
          message: completed
            ? 'Obligation marked as complete. Contract insights refreshed.'
            : 'Obligation reopened for follow-up.',
        });
      } catch (error) {
        setContractFeedback({ tone: 'error', message: error?.message ?? 'Unable to update obligation.' });
      } finally {
        setContractUpdating(false);
      }
    },
    [activeContract, onToggleContractObligation],
  );

  useEffect(() => {
    setProposalFeedback(null);
  }, [selectedOpportunityId]);

  useEffect(() => {
    setContractFeedback(null);
    setContractUpdating(false);
  }, [activeContractId]);

  const handleProposalDraftChange = useCallback(
    (nextState) => {
      if (!nextState) {
        setProposalDraft(null);
        return;
      }
      setProposalDraft((current) => ({
        ...nextState,
        __sourceOpportunityId: selectedOpportunity?.id ?? current?.__sourceOpportunityId ?? null,
      }));
    },
    [selectedOpportunity?.id],
  );

  const handleProposalSubmit = useCallback(async () => {
    if (!proposalDraft || !actions?.createProjectBid) {
      return;
    }
    if (!selectedOpportunity) {
      setProposalFeedback({ tone: 'error', message: 'Select an opportunity to generate a proposal.' });
      return;
    }
    if (!selectedProjectForProposal) {
      setProposalFeedback({ tone: 'error', message: 'No linked project found for this opportunity.' });
      return;
    }

    const primaryCollaborator = selectedProjectForProposal.collaborators?.find((collaborator) => collaborator.status === 'active');
    const vendorName = primaryCollaborator?.fullName ?? defaultVendorName ?? selectedProjectForProposal.title ?? 'Project workspace';
    const vendorEmail = primaryCollaborator?.email ?? undefined;

    const { __sourceOpportunityId: _omit, ...restDraft } = proposalDraft;
    const payload = {
      projectId: selectedProjectForProposal.id,
      title: proposalDraft.overview.title || selectedOpportunity.title || 'Proposal',
      vendorName,
      vendorEmail,
      amount: Number.isFinite(Number(proposalDraft.investment.amount))
        ? Number(proposalDraft.investment.amount)
        : undefined,
      currency: proposalDraft.investment.currency,
      status: 'submitted',
      notes: proposalDraft.investment.commercialNotes,
      metadata: { proposalBuilder: serialiseProposalDraft({ ...restDraft }) },
    };

    setProposalSaving(true);
    setProposalFeedback(null);
    try {
      await actions.createProjectBid(payload);
      setProposalFeedback({ tone: 'success', message: 'Proposal captured and saved to bids.' });
    } catch (error) {
      setProposalFeedback({ tone: 'error', message: error?.message ?? 'Unable to save proposal.' });
    } finally {
      setProposalSaving(false);
    }
  }, [actions, defaultVendorName, proposalDraft, selectedOpportunity, selectedProjectForProposal]);

  const opportunityOptions = useMemo(
    () =>
      opportunities.map((opportunity) => ({
        value: opportunity.id,
        label: `${opportunity.title ?? 'Opportunity'} · ${opportunity.client ?? 'Client'}`,
      })),
    [opportunities],
  );

  const builderPersona = selectedOpportunity?.personaFit?.[0] ?? data?.access?.primaryPersona ?? 'operations';

  const renderTab = () => {
    switch (activeTab) {
      case 'projects':
      default:
        return (
          <div className="space-y-6">
            <GigBoard
              opportunities={opportunities}
              persona={data?.access?.primaryPersona ?? 'operations'}
              onOpportunitySelect={handleOpportunitySelect}
            />
            <ProjectLifecyclePanel
              lifecycle={lifecycle}
              onUpdateWorkspace={actions.updateWorkspace}
              canManage={canManage}
              onPreviewProject={onProjectPreview}
            />
            <BoardSnapshot board={board} />
            {contracts.length ? (
              <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Contract operations</h3>
                    <p className="text-sm text-slate-500">
                      Monitor delivery health, obligations, and renewal signals across live engagements.
                    </p>
                  </div>
                  {contracts.length > 1 ? (
                    <label className="flex flex-col gap-1 text-xs text-slate-500">
                      Active contract
                      <select
                        value={activeContractId ?? ''}
                        onChange={(event) => {
                          const raw = event.target.value;
                          const parsed = Number(raw);
                          setActiveContractId(Number.isNaN(parsed) ? raw : parsed);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      >
                        {contracts.map((contract) => (
                          <option key={contract.id} value={contract.id}>
                            {contract.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
                {contractFeedback ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                      contractFeedback.tone === 'success'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {contractFeedback.message}
                  </div>
                ) : null}
                {activeContract ? (
                  <ContractTracker
                    contract={activeContract}
                    persona={data?.access?.primaryPersona ?? 'operations'}
                    onObligationToggle={handleContractObligationToggle}
                    updating={contractUpdating}
                  />
                ) : (
                  <p className="text-sm text-slate-500">No contract data is available yet.</p>
                )}
              </section>
            ) : null}
          </div>
        );
      case 'bids':
        return (
          <div className="grid gap-6 xl:grid-cols-[1.25fr,1fr]">
            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Proposal runway</p>
                  <h3 className="text-2xl font-semibold text-slate-900">Compose proposal</h3>
                  <p className="text-sm text-slate-600">
                    Sync narrative, scope, and commercials directly from shortlisted opportunities.
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-xs text-slate-500">
                  <label className="font-semibold">Opportunity</label>
                  <select
                    value={selectedOpportunityId ?? ''}
                    onChange={(event) => {
                      const raw = event.target.value;
                      setSelectedOpportunityId(raw ? Number(raw) || raw : null);
                    }}
                    className="w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {opportunityOptions.length ? (
                      opportunityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No active opportunities
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {selectedOpportunity ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard label="Stage" value={selectedOpportunity.stage ?? 'qualify'} />
                  <SummaryCard
                    label="Value"
                    value={formatCurrency(selectedOpportunity.value ?? 0, selectedOpportunity.currency ?? 'USD')}
                  />
                  <SummaryCard
                    label="Response time"
                    value={
                      selectedOpportunity.responseTimeHours != null
                        ? `${selectedOpportunity.responseTimeHours} hrs`
                        : 'Pending'
                    }
                  />
                  <SummaryCard
                    label="Health"
                    value={`${Math.round(selectedOpportunity.healthScore ?? 0)} / 100`}
                    accent={Boolean(selectedOpportunity.healthScore && selectedOpportunity.healthScore >= 70)}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Select an opportunity to tailor your proposal.
                </div>
              )}

              {selectedOpportunity ? (
                <ProposalBuilder
                  key={selectedOpportunity.id}
                  initialState={proposalDraft ?? undefined}
                  onChange={handleProposalDraftChange}
                  persona={builderPersona}
                />
              ) : null}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {proposalFeedback ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                      proposalFeedback.tone === 'success'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {proposalFeedback.message}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    Proposals save directly to bids with history and readiness scoring.
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleProposalSubmit}
                    disabled={proposalSaving || !canManage || !selectedOpportunity}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/40"
                  >
                    {proposalSaving ? (
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-transparent" />
                    ) : null}
                    Save proposal to bids
                  </button>
                </div>
              </div>
            </section>

            <div className="space-y-6">
              <ProjectBidsPanel
                bids={bids.bids ?? []}
                stats={bids.stats ?? {}}
                projects={Array.isArray(data?.projectLifecycle?.open) ? data.projectLifecycle.open : []}
                onCreateBid={actions.createProjectBid}
                onUpdateBid={actions.updateProjectBid}
                canManage={canManage}
              />
            </div>
          </div>
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
            settings={autoMatchSettings}
            matches={autoMatchMatches}
            summary={autoMatchSummary}
            projects={projectsForMatch}
            canManage={canManage}
            onUpdateSettings={actions.updateAutoMatchSettings}
            onCreateMatch={actions.createAutoMatch}
            onUpdateMatch={actions.updateAutoMatch}
          />
        );
      case 'reviews':
        return (
          <ProjectReviewsPanel
            entries={reviewEntries}
            summary={reviewSummary}
            projects={projectsForMatch}
            orders={orders}
            onCreateReview={actions.createProjectReview}
            canManage={canManage}
          />
        );
      case 'escrow':
        return (
          <EscrowManagementPanel
            account={escrowAccount}
            transactions={escrowTransactions}
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
  onToggleContractObligation: PropTypes.func,
  defaultVendorName: PropTypes.string,
};

ProjectGigManagementSection.defaultProps = {
  data: null,
  actions: {},
  loading: false,
  canManage: false,
  viewOnlyNote: null,
  allowedRoles: [],
  onProjectPreview: undefined,
  onToggleContractObligation: undefined,
  defaultVendorName: undefined,
};
