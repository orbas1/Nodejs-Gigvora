import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../DataStatus.jsx';
import ProjectGigManagementSection from './ProjectGigManagementSection.jsx';
import ProjectWorkspaceDrawer from './ProjectWorkspaceDrawer.jsx';
import WorkspaceDetailDrawer from './WorkspaceDetailDrawer.jsx';
import GigOperationsWorkspace from './GigOperationsWorkspace.jsx';
import ProjectLifecyclePanel from './ProjectLifecyclePanel.jsx';
import ProjectBidsPanel from './ProjectBidsPanel.jsx';
import ProjectInvitationsPanel from './ProjectInvitationsPanel.jsx';
import AutoMatchPanel from './AutoMatchPanel.jsx';
import ProjectReviewsPanel from './ProjectReviewsPanel.jsx';
import EscrowManagementPanel from './EscrowManagementPanel.jsx';
import ProjectWizard from './ProjectWizard.jsx';
import ActionDrawer from './ActionDrawer.jsx';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import { useProjectManagementAccess } from '../../hooks/useAuthorization.js';
import useSession from '../../hooks/useSession.js';

const PROJECT_FORM_INITIAL = {
  title: '',
  description: '',
  budgetAllocated: '',
  budgetCurrency: 'USD',
  dueDate: '',
};

const GIG_FORM_INITIAL = {
  vendorName: '',
  serviceName: '',
  amount: '',
  currency: 'USD',
  dueAt: '',
};

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
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

function validateProjectForm(values) {
  const errors = {};
  if (!values.title.trim()) {
    errors.title = 'Add a name.';
  } else if (values.title.trim().length < 3) {
    errors.title = 'Too short.';
  }
  if (!values.description.trim()) {
    errors.description = 'Add a summary.';
  }
  if (values.budgetAllocated) {
    const parsed = Number(values.budgetAllocated);
    if (!Number.isFinite(parsed) || parsed < 0) {
      errors.budgetAllocated = 'Use a positive number.';
    }
  }
  if (values.dueDate) {
    const due = new Date(values.dueDate);
    if (Number.isNaN(due.getTime())) {
      errors.dueDate = 'Pick a valid date.';
    }
  }
  return errors;
}

function validateGigForm(values) {
  const errors = {};
  if (!values.vendorName.trim()) {
    errors.vendorName = 'Add vendor.';
  }
  if (!values.serviceName.trim()) {
    errors.serviceName = 'Add service.';
  }
  if (values.amount) {
    const parsed = Number(values.amount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      errors.amount = 'Invalid amount.';
    }
  }
  if (values.dueAt) {
    const due = new Date(values.dueAt);
    if (Number.isNaN(due.getTime())) {
      errors.dueAt = 'Pick a valid date.';
    }
  }
  return errors;
}

function resolveProjectId(project) {
  if (!project) {
    return null;
  }
  return project.project?.id ?? project.projectId ?? project.id ?? null;
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

function calculateGigStats(orders, fallbackCurrency = 'USD') {
  let openCount = 0;
  let closedCount = 0;
  let escrowOutstanding = 0;
  orders.forEach((order) => {
    if (order?.isClosed === true || order?.status === 'closed') {
      closedCount += 1;
    } else {
      openCount += 1;
    }
    const checkpoints = Array.isArray(order?.escrowCheckpoints) ? order.escrowCheckpoints : [];
    checkpoints.forEach((checkpoint) => {
      if (checkpoint?.status === 'released') {
        return;
      }
      const amount = Number(checkpoint?.amount);
      if (Number.isFinite(amount)) {
        escrowOutstanding += amount;
      }
    });
  });
  return { openCount, closedCount, escrowOutstanding, currency: fallbackCurrency };
}

export default function ProjectGigManagementContainer({ userId }) {
  const { canManageProjects, denialReason } = useProjectManagementAccess();
  const { session } = useSession();

  if (!userId) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700 shadow-sm">
        <p className="text-base font-semibold text-rose-800">Workspace unavailable</p>
        <p className="mt-2">We could not resolve your workspace owner. Sign in again to manage projects.</p>
      </section>
    );
  }

  if (!canManageProjects) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-800 shadow-sm">
        <p className="text-base font-semibold text-amber-900">Access required</p>
        <p className="mt-2">{denialReason ?? 'Switch to an approved workspace role to manage projects and gigs.'}</p>
      </section>
    );
  }

  const { data, loading, error, actions, reload } = useProjectGigManagement(userId);
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(PROJECT_FORM_INITIAL);
  const [projectErrors, setProjectErrors] = useState({});
  const [projectFeedback, setProjectFeedback] = useState(null);
  const [projectSubmitting, setProjectSubmitting] = useState(false);

  const [gigDrawerOpen, setGigDrawerOpen] = useState(false);
  const [gigForm, setGigForm] = useState(GIG_FORM_INITIAL);
  const [gigErrors, setGigErrors] = useState({});
  const [gigFeedback, setGigFeedback] = useState(null);
  const [gigSubmitting, setGigSubmitting] = useState(false);

  const [activeModuleId, setActiveModuleId] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [previewProjectId, setPreviewProjectId] = useState(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const meta = data?.meta ?? {};
  const access = data?.access ?? {};
  const canManage = access.canManage !== false;
  const viewOnlyNote = !canManage ? access.reason ?? 'Workspace is read only for this role.' : null;
  const allowedRoles = useMemo(
    () => access.allowedRoles?.map((role) => role.replace(/_/g, ' ')) ?? [],
    [access.allowedRoles],
  );

  const summary = data?.summary ?? {};
  const autoMatchSummary = data?.autoMatch?.summary ?? {};
  const invitationStats = data?.invitations?.stats ?? {};
  const bidsStats = data?.projectBids?.stats ?? {};
  const reviewsSummary = data?.reviews?.summary ?? {};
  const escrowAccount = data?.escrow?.account ?? {};
  const escrowTransactions = data?.escrow?.transactions ?? [];
  const projects = data?.projectCreation?.projects ?? [];
  const templates = data?.projectCreation?.templates ?? [];
  const orders = data?.purchasedGigs?.orders ?? [];
  const gigStats = useMemo(
    () => calculateGigStats(orders, data?.purchasedGigs?.currency ?? summary.currency ?? 'USD'),
    [orders, data?.purchasedGigs?.currency, summary.currency],
  );

  const defaultAuthorName = useMemo(() => resolveDefaultAuthorName(session), [session]);

  const summaryCards = useMemo(() => {
    const currency = summary.currency ?? data?.purchasedGigs?.currency ?? 'USD';
    return [
      { id: 'projects', label: 'Projects', value: formatNumber(summary.totalProjects) },
      { id: 'active-projects', label: 'Active', value: formatNumber(summary.activeProjects) },
      { id: 'open-gigs', label: 'Gigs', value: formatNumber(summary.openGigs ?? gigStats.openCount) },
      { id: 'budget', label: 'Budget', value: formatCurrency(summary.budgetInPlay, currency) },
      { id: 'matches', label: 'Matches', value: formatNumber(autoMatchSummary.totalMatches ?? autoMatchSummary.active ?? 0) },
      {
        id: 'invites',
        label: 'Invites',
        value: formatNumber(invitationStats.pending ?? invitationStats.total ?? 0),
      },
      { id: 'bids', label: 'Bids', value: formatNumber(bidsStats.total ?? 0) },
      {
        id: 'escrow',
        label: 'Escrow',
        value: formatCurrency(escrowAccount.availableBalance ?? summary.escrowBalance, escrowAccount.currency ?? currency),
        tone: 'success',
      },
    ];
  }, [summary, data?.purchasedGigs?.currency, autoMatchSummary, invitationStats, bidsStats, escrowAccount, gigStats.openCount]);

  const projectsPreview = useMemo(() => {
    const nextReview = summary.nextReviewAt ? new Date(summary.nextReviewAt) : null;
    const formattedReview = nextReview && !Number.isNaN(nextReview.getTime()) ? nextReview.toLocaleDateString() : '—';
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Open</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(summary.activeProjects)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Next review</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formattedReview}</p>
        </div>
      </div>
    );
  }, [summary.activeProjects, summary.nextReviewAt]);

  const bidsPreview = useMemo(() => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(bidsStats.total ?? 0)}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Shortlisted</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(bidsStats.shortlisted ?? 0)}</p>
      </div>
    </div>
  ), [bidsStats.total, bidsStats.shortlisted]);

  const invitesPreview = useMemo(() => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(invitationStats.pending ?? 0)}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Accepted</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(invitationStats.accepted ?? 0)}</p>
      </div>
    </div>
  ), [invitationStats.pending, invitationStats.accepted]);

  const matchPreview = useMemo(() => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Active</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(autoMatchSummary.active ?? 0)}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Automation</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {autoMatchSummary.automationEnabled ? 'On' : 'Off'}
        </p>
      </div>
    </div>
  ), [autoMatchSummary.active, autoMatchSummary.automationEnabled]);

  const reviewsPreview = useMemo(() => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Reviews</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(reviewsSummary.total ?? 0)}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Rating</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {(reviewsSummary.averageRating ?? 0).toFixed?.(1) ?? reviewsSummary.averageRating ?? '0.0'}
        </p>
      </div>
    </div>
  ), [reviewsSummary.total, reviewsSummary.averageRating]);

  const escrowPreview = useMemo(() => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Balance</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {formatCurrency(escrowAccount.availableBalance ?? escrowAccount.balance, escrowAccount.currency ?? 'USD')}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Auto release</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {escrowAccount.autoReleaseDays != null ? `${escrowAccount.autoReleaseDays} days` : 'Manual'}
        </p>
      </div>
    </div>
  ), [escrowAccount.availableBalance, escrowAccount.balance, escrowAccount.currency, escrowAccount.autoReleaseDays]);

  const operationsPreview = useMemo(() => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Open gigs</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(gigStats.openCount)}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Outstanding</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {formatCurrency(gigStats.escrowOutstanding, gigStats.currency)}
        </p>
      </div>
    </div>
  ), [gigStats.openCount, gigStats.escrowOutstanding, gigStats.currency]);

  const modules = useMemo(
    () => [
      {
        id: 'projects',
        label: 'Projects',
        preview: projectsPreview,
        content: (
          <ProjectLifecyclePanel
            lifecycle={data?.projectLifecycle ?? { open: [], closed: [], stats: {} }}
            onUpdateWorkspace={(projectId, payload) => actions.updateWorkspace(projectId, payload)}
            canManage={canManage}
            onPreviewProject={(projectId) => setPreviewProjectId(projectId)}
          />
        ),
        width: 'max-w-4xl',
      },
      {
        id: 'bids',
        label: 'Bids',
        preview: bidsPreview,
        content: (
          <ProjectBidsPanel
            bids={data?.projectBids?.bids ?? []}
            stats={data?.projectBids?.stats ?? {}}
            projects={projects}
            onCreateBid={actions.createProjectBid}
            onUpdateBid={actions.updateProjectBid}
            canManage={canManage}
          />
        ),
        width: 'max-w-4xl',
      },
      {
        id: 'invites',
        label: 'Invites',
        preview: invitesPreview,
        content: (
          <ProjectInvitationsPanel
            entries={data?.invitations?.entries ?? []}
            stats={data?.invitations?.stats ?? {}}
            projects={projects}
            onSendInvitation={actions.sendProjectInvitation}
            onUpdateInvitation={actions.updateProjectInvitation}
            canManage={canManage}
          />
        ),
        width: 'max-w-4xl',
      },
      {
        id: 'match',
        label: 'Match',
        preview: matchPreview,
        content: (
          <AutoMatchPanel
            settings={data?.autoMatch?.settings ?? {}}
            matches={data?.autoMatch?.matches ?? []}
            summary={data?.autoMatch?.summary ?? {}}
            projects={projects}
            onUpdateSettings={actions.updateAutoMatchSettings}
            onCreateMatch={actions.createAutoMatch}
            onUpdateMatch={actions.updateAutoMatch}
            canManage={canManage}
          />
        ),
        width: 'max-w-4xl',
      },
      {
        id: 'reviews',
        label: 'Reviews',
        preview: reviewsPreview,
        content: (
          <ProjectReviewsPanel
            entries={data?.reviews?.entries ?? []}
            summary={data?.reviews?.summary ?? {}}
            projects={projects}
            orders={orders}
            onCreateReview={actions.createProjectReview}
            canManage={canManage}
          />
        ),
        width: 'max-w-4xl',
      },
      {
        id: 'escrow',
        label: 'Escrow',
        preview: escrowPreview,
        content: (
          <EscrowManagementPanel
            account={escrowAccount}
            transactions={escrowTransactions}
            onCreateTransaction={actions.createEscrowTransaction}
            onUpdateSettings={actions.updateEscrowSettings}
            canManage={canManage}
          />
        ),
        width: 'max-w-4xl',
      },
      {
        id: 'operations',
        label: 'Gigs',
        preview: operationsPreview,
        content: (
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
        ),
        width: 'max-w-5xl',
      },
    ],
    [
      data,
      actions,
      canManage,
      projects,
      orders,
      escrowAccount,
      escrowTransactions,
      defaultAuthorName,
      projectsPreview,
      bidsPreview,
      invitesPreview,
      matchPreview,
      reviewsPreview,
      escrowPreview,
      operationsPreview,
    ],
  );

  const activeModule = modules.find((module) => module.id === activeModuleId) ?? null;
  const previewProject = useMemo(
    () => projects.find((project) => resolveProjectId(project) === previewProjectId) ?? null,
    [projects, previewProjectId],
  );

  const handleProjectChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((current) => ({ ...current, [name]: value }));
  };

  const handleGigChange = (event) => {
    const { name, value } = event.target;
    setGigForm((current) => ({ ...current, [name]: value }));
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    const validation = validateProjectForm(projectForm);
    setProjectErrors(validation);
    if (Object.keys(validation).length) {
      setProjectFeedback({ status: 'error', message: 'Fix the highlighted fields.' });
      return;
    }
    setProjectSubmitting(true);
    setProjectFeedback(null);
    try {
      await actions.createProject({
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        budgetCurrency: projectForm.budgetCurrency,
        budgetAllocated: projectForm.budgetAllocated ? Number(projectForm.budgetAllocated) : 0,
        dueDate: projectForm.dueDate || undefined,
      });
      setProjectFeedback({ status: 'success', message: 'Project created.' });
      setProjectForm(PROJECT_FORM_INITIAL);
      setProjectDrawerOpen(false);
    } catch (submitError) {
      setProjectFeedback({ status: 'error', message: submitError?.message ?? 'Unable to create project.' });
    } finally {
      setProjectSubmitting(false);
    }
  };

  const handleGigSubmit = async (event) => {
    event.preventDefault();
    const validation = validateGigForm(gigForm);
    setGigErrors(validation);
    if (Object.keys(validation).length) {
      setGigFeedback({ status: 'error', message: 'Fix the highlighted fields.' });
      return;
    }
    setGigSubmitting(true);
    setGigFeedback(null);
    try {
      await actions.createGigOrder({
        vendorName: gigForm.vendorName.trim(),
        serviceName: gigForm.serviceName.trim(),
        amount: gigForm.amount ? Number(gigForm.amount) : 0,
        currency: gigForm.currency,
        dueAt: gigForm.dueAt || undefined,
      });
      setGigFeedback({ status: 'success', message: 'Gig recorded.' });
      setGigForm(GIG_FORM_INITIAL);
      setGigDrawerOpen(false);
    } catch (submitError) {
      setGigFeedback({ status: 'error', message: submitError?.message ?? 'Unable to save gig.' });
    } finally {
      setGigSubmitting(false);
    }
  };

  const handleSaveWorkspace = async (payload) => {
    if (!previewProject) {
      throw new Error('Select a project.');
    }
    const projectId = resolveProjectId(previewProject);
    if (!projectId) {
      throw new Error('Project reference missing.');
    }
    setDetailSaving(true);
    setDetailError(null);
    try {
      await actions.updateWorkspace(projectId, payload);
    } catch (err) {
      const message = err?.message ?? 'Unable to update workspace.';
      setDetailError(message);
      throw err;
    } finally {
      setDetailSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Command centre</h2>
            <DataStatus
              loading={loading}
              error={error}
              fromCache={meta.fromCache}
              lastUpdated={meta.lastUpdated}
              onRefresh={() => reload({ force: true })}
              statusLabel="Workspace data"
            />
          </div>
        </div>

        <ProjectGigManagementSection
          summaryCards={summaryCards}
          modules={modules}
          onOpenModule={(moduleId) => setActiveModuleId(moduleId)}
          onCreateProject={() => {
            setProjectDrawerOpen(true);
            setProjectFeedback(null);
            setProjectErrors({});
          }}
          onCreateGig={() => {
            setGigDrawerOpen(true);
            setGigFeedback(null);
            setGigErrors({});
          }}
          onLaunchWizard={templates.length ? () => setWizardOpen(true) : null}
          viewOnlyNote={viewOnlyNote}
          allowedRoles={allowedRoles}
        />
      </div>

      <ActionDrawer
        open={Boolean(activeModule)}
        onClose={() => setActiveModuleId(null)}
        title={activeModule?.label ?? 'Module'}
        width={activeModule?.width ?? 'max-w-3xl'}
      >
        {activeModule?.content}
      </ActionDrawer>

      <ProjectWorkspaceDrawer
        open={projectDrawerOpen}
        onClose={() => {
          if (!projectSubmitting) {
            setProjectDrawerOpen(false);
            setProjectFeedback(null);
            setProjectErrors({});
          }
        }}
        values={projectForm}
        errors={projectErrors}
        onChange={handleProjectChange}
        onSubmit={handleProjectSubmit}
        loading={projectSubmitting}
        feedback={projectFeedback}
        canManage={canManage}
      />

      <ActionDrawer
        open={gigDrawerOpen}
        onClose={() => {
          if (!gigSubmitting) {
            setGigDrawerOpen(false);
            setGigFeedback(null);
            setGigErrors({});
          }
        }}
        title="Log gig order"
      >
        <form className="space-y-4" onSubmit={handleGigSubmit} noValidate>
          {gigFeedback ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                gigFeedback.status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {gigFeedback.message}
            </div>
          ) : null}
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Vendor</span>
            <input
              name="vendorName"
              value={gigForm.vendorName}
              onChange={handleGigChange}
              className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                gigErrors.vendorName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
              }`}
              placeholder="Studio"
              disabled={!canManage || gigSubmitting}
            />
            {gigErrors.vendorName ? <span className="text-xs font-semibold text-rose-600">{gigErrors.vendorName}</span> : null}
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Service</span>
            <input
              name="serviceName"
              value={gigForm.serviceName}
              onChange={handleGigChange}
              className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                gigErrors.serviceName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
              }`}
              placeholder="Brand refresh"
              disabled={!canManage || gigSubmitting}
            />
            {gigErrors.serviceName ? <span className="text-xs font-semibold text-rose-600">{gigErrors.serviceName}</span> : null}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Amount</span>
              <input
                name="amount"
                value={gigForm.amount}
                onChange={handleGigChange}
                type="number"
                min="0"
                className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                  gigErrors.amount ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
                }`}
                placeholder="2500"
                disabled={!canManage || gigSubmitting}
              />
              {gigErrors.amount ? <span className="text-xs font-semibold text-rose-600">{gigErrors.amount}</span> : null}
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Currency</span>
              <select
                name="currency"
                value={gigForm.currency}
                onChange={handleGigChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                disabled={!canManage || gigSubmitting}
              >
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Due date</span>
            <input
              type="date"
              name="dueAt"
              value={gigForm.dueAt}
              onChange={handleGigChange}
              className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                gigErrors.dueAt ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
              }`}
              disabled={!canManage || gigSubmitting}
            />
            {gigErrors.dueAt ? <span className="text-xs font-semibold text-rose-600">{gigErrors.dueAt}</span> : null}
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (!gigSubmitting) {
                  setGigDrawerOpen(false);
                }
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              disabled={gigSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              disabled={!canManage || gigSubmitting}
            >
              {gigSubmitting ? 'Saving…' : 'Save gig'}
            </button>
          </div>
        </form>
      </ActionDrawer>

      <WorkspaceDetailDrawer
        open={Boolean(previewProject)}
        onClose={() => {
          if (!detailSaving) {
            setPreviewProjectId(null);
            setDetailError(null);
          }
        }}
        project={previewProject}
        onSave={handleSaveWorkspace}
        saving={detailSaving}
        error={detailError}
        canManage={canManage}
      />

      <ProjectWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={async (payload) => {
          await actions.createProject(payload);
          setWizardOpen(false);
        }}
        templates={templates}
      />
    </>
  );
}

ProjectGigManagementContainer.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ProjectGigManagementContainer.defaultProps = {
  userId: null,
};
