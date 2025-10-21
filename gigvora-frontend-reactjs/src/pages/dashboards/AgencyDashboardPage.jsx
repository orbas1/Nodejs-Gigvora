import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { useAgencyOverview } from '../../hooks/useAgencyOverview.js';
import useAgencyDashboard from '../../hooks/useAgencyDashboard.js';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import useGigOrderDetail from '../../hooks/useGigOrderDetail.js';
import DataStatus from '../../components/DataStatus.jsx';
import FinanceControlTowerFeature from '../../components/dashboard/FinanceControlTowerFeature.jsx';
import {
  AgencyManagementSection,
  AgencyHrManagementSection,
  AgencyCrmLeadPipelineSection,
  AgencyPaymentsManagementSection,
  AgencyJobApplicationsSection,
  GigManagementSection,
  GigTimelineSection,
  GigCreationSection,
  OpenGigsSection,
  ClosedGigsSection,
  GigSubmissionsSection,
  GigChatSection,
  AgencyGigWorkspaceSection,
  AgencyWalletSection,
  AgencyHubSection,
  AgencyCreationStudioWizardSection,
} from './agency/sections/index.js';
import OverviewSection from './agency/sections/OverviewSection.jsx';
import { EscrowProvider } from './agency/escrow/EscrowContext.jsx';
import EscrowShell from './agency/escrow/EscrowShell.jsx';

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user', 'headhunter'];

const MENU_SECTIONS = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'agency-overview', name: 'Home', sectionId: 'agency-overview' },
      { id: 'agency-management', name: 'Agency management', sectionId: 'agency-management' },
      { id: 'agency-hr', name: 'HR management', sectionId: 'agency-hr' },
      { id: 'agency-crm', name: 'CRM pipeline', sectionId: 'agency-crm' },
      { id: 'agency-payments', name: 'Payments', sectionId: 'agency-payments' },
      { id: 'agency-job-applications', name: 'Job applications', sectionId: 'agency-job-applications' },
      { id: 'agency-gig-management', name: 'Gigs', sectionId: 'agency-gig-management' },
      { id: 'agency-escrow', name: 'Escrow', sectionId: 'agency-escrow' },
      { id: 'agency-finance', name: 'Finance', sectionId: 'agency-finance' },
      { id: 'agency-gig-workspace', name: 'Gig workspace', sectionId: 'agency-gig-workspace' },
      { id: 'agency-inbox', name: 'Inbox', sectionId: 'agency-inbox' },
      { id: 'agency-wallet', name: 'Wallet', sectionId: 'agency-wallet' },
      { id: 'agency-hub', name: 'Hub', sectionId: 'agency-hub' },
      { id: 'agency-creation-studio', name: 'Creation Studio', sectionId: 'agency-creation-studio' },
    ],
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    items: [
      { id: 'agency-disputes', name: 'Disputes', href: '/dashboard/agency/disputes' },
      { id: 'agency-wallet', name: 'Wallet', href: '/dashboard/agency/wallet' },
      { id: 'agency-inbox', name: 'Inbox', href: '/inbox' },
    ],
  },
];

const SECTIONS = [
  { id: 'agency-overview', label: 'Home' },
  { id: 'agency-management', label: 'Agency management' },
  { id: 'agency-hr', label: 'HR management' },
  { id: 'agency-crm', label: 'CRM pipeline' },
  { id: 'agency-payments', label: 'Payments' },
  { id: 'agency-job-applications', label: 'Job applications' },
  { id: 'agency-gig-management', label: 'Gig management' },
  { id: 'agency-escrow', label: 'Escrow' },
  { id: 'agency-finance', label: 'Finance' },
  { id: 'agency-gig-workspace', label: 'Gig workspace' },
  { id: 'agency-inbox', label: 'Inbox' },
  { id: 'agency-wallet', label: 'Wallet' },
  { id: 'agency-hub', label: 'Hub' },
  { id: 'agency-creation-studio', label: 'Creation Studio' },
];

function parseWorkspaceId(rawValue) {
  if (rawValue == null || rawValue === '') {
    return undefined;
  }
  const numeric = Number.parseInt(rawValue, 10);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeRoles(memberships = []) {
  return memberships.map((role) => `${role}`.toLowerCase());
}

function formatCurrency(amount, currency = 'USD') {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch (error) {
    return `${currency} ${Math.round(numeric)}`;
  }
}

export default function AgencyDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, isAuthenticated } = useSession();

  const memberships = useMemo(
    () => normalizeRoles(session?.memberships ?? session?.roles ?? []),
    [session?.memberships, session?.roles],
  );
  const isAgencyMember = memberships.some((role) => ['agency', 'agency_admin', 'admin'].includes(role));
  const canManageOverview = memberships.some((role) => ['agency_admin', 'admin'].includes(role));

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isAgencyMember) {
      const fallback = session?.primaryDashboard || memberships.find((role) => role !== 'agency') || 'user';
      navigate(`/dashboard/${fallback}`, { replace: true });
    }
  }, [isAuthenticated, isAgencyMember, navigate, session?.primaryDashboard, memberships]);

  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug') ?? undefined;
  const workspaceId = parseWorkspaceId(workspaceIdParam);

  const {
    data: overviewPayload,
    loading: overviewLoading,
    error: overviewError,
    fromCache: overviewFromCache,
    lastUpdated: overviewLastUpdated,
    refresh: refreshOverview,
    save: saveOverview,
    saving: overviewSaving,
  } = useAgencyOverview({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    enabled: isAuthenticated && isAgencyMember,
  });

  const workspaceOptions = overviewPayload?.meta?.availableWorkspaces ?? [];
  const selectedWorkspaceId = workspaceIdParam
    || (overviewPayload?.workspace?.id ? `${overviewPayload.workspace.id}` : workspaceOptions[0]?.id ?? '');

  useEffect(() => {
    const selected = overviewPayload?.meta?.selectedWorkspaceId;
    if (!workspaceIdParam && selected) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${selected}`);
        next.delete('workspaceSlug');
        return next;
      }, { replace: true });
    }
  }, [overviewPayload?.meta?.selectedWorkspaceId, setSearchParams, workspaceIdParam]);

  const handleWorkspaceChange = useCallback(
    (event) => {
      const nextId = event.target.value;
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (nextId) {
          next.set('workspaceId', nextId);
          next.delete('workspaceSlug');
        } else {
          next.delete('workspaceId');
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const overview = overviewPayload?.overview ?? null;
  const workspace = overviewPayload?.workspace ?? null;

  const {
    data: agencyDashboard,
    loading: dashboardLoading,
    error: dashboardError,
    fromCache: dashboardFromCache,
    lastUpdated: dashboardLastUpdated,
    refresh: refreshAgencyDashboard,
  } = useAgencyDashboard({
    workspaceId,
    workspaceSlug: workspaceSlugParam,
    enabled: isAuthenticated && isAgencyMember,
  });

  const ownerId = useMemo(
    () => agencyDashboard?.workspace?.ownerId ?? session?.id ?? null,
    [agencyDashboard?.workspace?.ownerId, session?.id],
  );

  const projectGigResource = useProjectGigManagement(ownerId);
  const {
    data: projectGigData,
    loading: projectLoading,
    error: projectError,
    actions: projectActions,
    reload: reloadProject,
  } = projectGigResource;

  const orders = useMemo(() => projectGigData?.purchasedGigs?.orders ?? [], [projectGigData]);
  const [selectedOrderId, setSelectedOrderId] = useState(() => (orders.length ? orders[0].id : null));

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId(null);
      return;
    }
    setSelectedOrderId((previous) => {
      if (previous && orders.some((order) => order.id === previous)) {
        return previous;
      }
      return orders[0].id;
    });
  }, [orders]);

  const {
    data: orderDetail,
    loading: orderLoading,
    error: orderError,
    actions: orderActions,
    refresh: refreshOrder,
    pendingAction,
  } = useGigOrderDetail(ownerId, selectedOrderId);

  const [creatingGig, setCreatingGig] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const handleRefreshGigData = useCallback(async () => {
    await Promise.all([
      refreshAgencyDashboard({ force: true }),
      reloadProject(),
    ]);
    if (selectedOrderId) {
      await refreshOrder();
    }
  }, [refreshAgencyDashboard, reloadProject, refreshOrder, selectedOrderId]);

  const handleCreateGig = useCallback(
    async (payload) => {
      if (!projectActions?.createGigOrder) return;
      setCreatingGig(true);
      try {
        const response = await projectActions.createGigOrder(payload);
        await handleRefreshGigData();
        if (response?.order?.id) {
          setSelectedOrderId(response.order.id);
        }
      } finally {
        setCreatingGig(false);
      }
    },
    [projectActions, handleRefreshGigData],
  );

  const handleUpdateOrder = useCallback(
    async (orderIdValue, payload) => {
      if (!projectActions?.updateGigOrder) return;
      setUpdatingOrderId(orderIdValue);
      try {
        await projectActions.updateGigOrder(orderIdValue, payload);
        await refreshOrder();
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [projectActions, refreshOrder],
  );

  const handleReopenOrder = useCallback(
    async (order) => {
      if (!order || !projectActions?.updateGigOrder) return;
      const fallbackDate = order.dueAt ? new Date(order.dueAt) : new Date();
      const normalized = new Date(
        fallbackDate.getFullYear(),
        fallbackDate.getMonth(),
        fallbackDate.getDate() + 7,
      )
        .toISOString()
        .slice(0, 10);
      setUpdatingOrderId(order.id);
      try {
        await projectActions.updateGigOrder(order.id, {
          status: 'in_delivery',
          dueAt: normalized,
          progressPercent: order.progressPercent ?? 0,
        });
        setSelectedOrderId(order.id);
        await refreshOrder();
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [projectActions, refreshOrder],
  );

  const handleAddTimelineEvent = useCallback(
    (payload) => orderActions?.addTimelineEvent?.(payload),
    [orderActions],
  );

  const handleCreateSubmission = useCallback(
    (payload) => orderActions?.createSubmission?.(payload),
    [orderActions],
  );

  const handleUpdateSubmission = useCallback(
    (submissionId, payload) => orderActions?.updateSubmission?.(submissionId, payload),
    [orderActions],
  );

  const handleSendMessage = useCallback(
    (payload) => orderActions?.sendMessage?.(payload),
    [orderActions],
  );

  const handleAcknowledgeMessage = useCallback(
    (messageId) => orderActions?.acknowledgeMessage?.(messageId),
    [orderActions],
  );

  const studioInsights = agencyDashboard?.operations?.gigPrograms?.studio ?? {};
  const gigSummary = studioInsights.summary ?? null;
  const gigDeliverables = studioInsights.deliverables ?? null;
  const financeSnapshot = agencyDashboard?.finance ?? {};

  const [activeMenuItem, setActiveMenuItem] = useState('agency-overview');

  const handleMenuItemSelect = useCallback((itemId, item) => {
    setActiveMenuItem(itemId);
    if (item?.href) {
      return;
    }
    const targetId = item?.sectionId ?? itemId;
    if (targetId && typeof document !== 'undefined') {
      const element = document.getElementById(targetId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const financeHighlights = useMemo(() => {
    const currency = financeSnapshot.currency || agencyDashboard?.workspace?.currency || 'USD';
    const items = [
      { id: 'runRate', label: 'Revenue run-rate', value: financeSnapshot.runRate, helper: financeSnapshot.runRateHint },
      { id: 'invoiced', label: 'Invoices sent', value: financeSnapshot.invoiced, helper: financeSnapshot.invoicedHint },
      { id: 'payouts', label: 'Payouts processed', value: financeSnapshot.payouts, helper: financeSnapshot.payoutsHint },
      { id: 'margin', label: 'Gross margin', value: financeSnapshot.margin, helper: financeSnapshot.marginHint },
    ];
    return items
      .filter((item) => item.value != null)
      .map((item) => ({
        ...item,
        formatted: typeof item.value === 'string' && item.value.includes('%')
          ? item.value
          : formatCurrency(item.value, currency),
      }));
  }, [financeSnapshot, agencyDashboard?.workspace?.currency]);

  const gigError = projectError || orderError;

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency"
      subtitle={workspace?.name || 'Control tower'}
      description="Run delivery, finance, and guardrails from a single operating picture."
      menuSections={MENU_SECTIONS}
      sections={SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem={activeMenuItem}
      onMenuItemSelect={handleMenuItemSelect}
      adSurface="agency_dashboard"
    >
      <div className="space-y-12">
        <OverviewSection
          overview={overview}
          workspace={workspace}
          loading={overviewLoading}
          error={overviewError}
          onRefresh={() => refreshOverview({ force: true })}
          fromCache={overviewFromCache}
          lastUpdated={overviewLastUpdated}
          onSave={saveOverview}
          saving={overviewSaving}
          canManage={canManageOverview}
          workspaceOptions={workspaceOptions}
          selectedWorkspaceId={selectedWorkspaceId}
          onWorkspaceChange={workspaceOptions.length > 1 ? handleWorkspaceChange : undefined}
          currentDate={overviewPayload?.currentDate}
        />

        <AgencyManagementSection
          overview={overview}
          workspace={workspace}
          loading={overviewLoading}
          error={overviewError}
          onRefresh={() => refreshOverview?.()}
        />

        <AgencyHrManagementSection workspaceId={workspace?.id ?? workspaceId} canEdit={canManageOverview} />

        <AgencyCrmLeadPipelineSection workspaceId={workspace?.id ?? workspaceId} />

        <AgencyPaymentsManagementSection
          workspaceId={workspace?.id ?? workspaceId}
          workspaceLabel={workspace?.name ?? overviewPayload?.workspace?.name ?? ''}
        />

        <AgencyJobApplicationsSection ownerId={ownerId} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Gigs</p>
            <h2 className="text-3xl font-semibold text-slate-900">Gig operations</h2>
          </div>
          <DataStatus
            loading={projectLoading || orderLoading || dashboardLoading}
            error={gigError || dashboardError}
            fromCache={dashboardFromCache}
            lastUpdated={dashboardLastUpdated}
            onRefresh={handleRefreshGigData}
            statusLabel="Gig data"
          />
        </div>

        <GigManagementSection
          summary={gigSummary}
          deliverables={gigDeliverables}
          orders={orders}
          selectedOrderId={selectedOrderId}
          onSelectOrder={setSelectedOrderId}
          onRefresh={handleRefreshGigData}
          loading={projectLoading || orderLoading || dashboardLoading}
          detail={orderDetail}
        />

        <OpenGigsSection
          orders={orders}
          onUpdateOrder={handleUpdateOrder}
          updatingOrderId={updatingOrderId}
        />

        <ClosedGigsSection
          orders={orders}
          onReopen={handleReopenOrder}
          updatingOrderId={updatingOrderId}
        />

        <GigSubmissionsSection
          orderDetail={orderDetail}
          onCreateSubmission={handleCreateSubmission}
          onUpdateSubmission={handleUpdateSubmission}
          pending={pendingAction}
        />

        <GigTimelineSection
          orderDetail={orderDetail}
          onAddEvent={handleAddTimelineEvent}
          loading={orderLoading}
          pending={pendingAction}
        />

        <GigChatSection
          orderDetail={orderDetail}
          onSendMessage={handleSendMessage}
          onAcknowledgeMessage={handleAcknowledgeMessage}
          pending={pendingAction}
        />

        <GigCreationSection
          onCreate={handleCreateGig}
          creating={creatingGig}
          defaultCurrency={agencyDashboard?.workspace?.currency}
          onCreated={handleRefreshGigData}
        />

        <AgencyGigWorkspaceSection
          resource={projectGigResource}
          statusLabel="Gig marketplace sync"
          onRefresh={handleRefreshGigData}
        />

        <section id="agency-escrow" className="space-y-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Escrow</p>
              <h2 className="text-3xl font-semibold text-slate-900">Escrow management</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Secure
            </span>
          </header>
          <EscrowProvider workspaceId={workspaceId} workspaceSlug={workspaceSlugParam}>
            <EscrowShell />
          </EscrowProvider>
        </section>

        <section id="agency-finance" className="space-y-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Finance</p>
              <h2 className="text-3xl font-semibold text-slate-900">Finance management</h2>
            </div>
            <DataStatus
              loading={dashboardLoading}
              error={dashboardError}
              fromCache={dashboardFromCache}
              lastUpdated={dashboardLastUpdated}
              onRefresh={() => refreshAgencyDashboard({ force: true })}
              statusLabel="Finance data"
            />
          </header>

          {financeHighlights.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {financeHighlights.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{item.formatted}</p>
                  {item.helper ? <p className="mt-2 text-xs text-slate-500">{item.helper}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          <FinanceControlTowerFeature
            userId={ownerId}
            currency={agencyDashboard?.workspace?.currency}
          />
        </section>

        <div id="agency-inbox">
          <UserInboxSection
            userId={ownerId}
            eyebrow="Inbox"
            title="Agency conversation control"
            description="Route client, partner, and talent conversations with saved replies, automations, and SLA monitoring."
            statusLabel="Inbox telemetry"
            composerPlaceholder="Share updates, escalate support, or align clients across workstreams."
            emptyStateMessage="Select a conversation to respond or create a new stakeholder thread."
          />
        </div>

        <AgencyWalletSection workspaceId={workspace?.id ?? workspaceId} />

        <AgencyHubSection
          dashboard={agencyDashboard}
          loading={dashboardLoading}
          error={dashboardError}
          lastUpdated={dashboardLastUpdated}
          fromCache={dashboardFromCache}
          onRefresh={() => refreshAgencyDashboard({ force: true })}
        />

        <AgencyCreationStudioWizardSection agencyProfileId={agencyDashboard?.agencyProfile?.id} />
      </div>
    </DashboardLayout>
  );
}
