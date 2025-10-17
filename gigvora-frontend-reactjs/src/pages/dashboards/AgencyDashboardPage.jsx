import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useSession from '../../hooks/useSession.js';
import useAgencyDashboard from '../../hooks/useAgencyDashboard.js';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import useGigOrderDetail from '../../hooks/useGigOrderDetail.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './agency/menuConfig.js';
import {
  GigManagementSection,
  GigTimelineSection,
  GigCreationSection,
  OpenGigsSection,
  ClosedGigsSection,
  GigSubmissionsSection,
  GigChatSection,
} from './agency/sections/index.js';

const DEFAULT_SECTION = 'manage';

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const [activeSection, setActiveSection] = useState(DEFAULT_SECTION);

  const {
    data: agencyDashboard,
    loading: agencyLoading,
    error: agencyError,
    refresh: refreshAgency,
  } = useAgencyDashboard();

  const ownerId = agencyDashboard?.workspace?.ownerId ?? session?.id ?? null;

  const {
    data: projectGigData,
    loading: projectLoading,
    error: projectError,
    actions: projectActions,
    reload: reloadProject,
  } = useProjectGigManagement(ownerId);

  const orders = useMemo(() => projectGigData?.purchasedGigs?.orders ?? [], [projectGigData]);

  const [selectedOrderId, setSelectedOrderId] = useState(() => (orders.length ? orders[0].id : null));
  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId(null);
      return;
    }
    if (selectedOrderId == null) {
      setSelectedOrderId(orders[0].id);
      return;
    }
    const match = orders.find((order) => order.id === selectedOrderId);
    if (!match) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

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

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshAgency(), reloadProject()]);
    if (selectedOrderId) {
      await refreshOrder();
    }
  }, [refreshAgency, reloadProject, refreshOrder, selectedOrderId]);

  const handleCreateGig = useCallback(
    async (payload) => {
      if (!projectActions?.createGigOrder) return;
      setCreatingGig(true);
      try {
        const response = await projectActions.createGigOrder(payload);
        await handleRefresh();
        if (response?.order?.id) {
          setSelectedOrderId(response.order.id);
        }
      } finally {
        setCreatingGig(false);
      }
    },
    [projectActions, handleRefresh],
  );

  const handleUpdateOrder = useCallback(
    async (orderId, payload) => {
      if (!projectActions?.updateGigOrder) return;
      setUpdatingOrderId(orderId);
      try {
        await projectActions.updateGigOrder(orderId, payload);
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
      const fallback = order.dueAt ? new Date(order.dueAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const normalized = new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate())
        .toISOString()
        .slice(0, 10);
      setUpdatingOrderId(order.id);
      try {
        await projectActions.updateGigOrder(order.id, {
          status: 'in_delivery',
          dueAt: normalized,
          progressPercent: order.progressPercent ?? 0,
        });
        setActiveSection('open-gigs');
        setSelectedOrderId(order.id);
        await refreshOrder();
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [projectActions, refreshOrder],
  );

  const handleAddTimelineEvent = useCallback(
    (payload) => orderActions.addTimelineEvent?.(payload),
    [orderActions],
  );

  const handleCreateSubmission = useCallback(
    (payload) => orderActions.createSubmission?.(payload),
    [orderActions],
  );

  const handleUpdateSubmission = useCallback(
    (submissionId, payload) => orderActions.updateSubmission?.(submissionId, payload),
    [orderActions],
  );

  const handleSendMessage = useCallback(
    (payload) => orderActions.sendMessage?.(payload),
    [orderActions],
  );

  const handleAcknowledgeMessage = useCallback(
    (messageId) => orderActions.acknowledgeMessage?.(messageId),
    [orderActions],
  );

  const studioInsights = agencyDashboard?.operations?.gigPrograms?.studio ?? {};
  const pageLoading = agencyLoading || projectLoading;
  const displayName = session?.name || session?.firstName || 'agency team';
  const anyError = agencyError || projectError || orderError;

  const renderSection = () => {
    switch (activeSection) {
      case 'manage':
        return (
          <GigManagementSection
            summary={studioInsights.summary}
            deliverables={studioInsights.deliverables}
            orders={orders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
            onRefresh={handleRefresh}
            loading={pageLoading || orderLoading}
            detail={orderDetail}
          />
        );
      case 'timeline':
        return (
          <GigTimelineSection
            orderDetail={orderDetail}
            onAddEvent={handleAddTimelineEvent}
            loading={orderLoading}
            pending={pendingAction}
          />
        );
      case 'build':
        return (
          <GigCreationSection
            onCreate={handleCreateGig}
            creating={creatingGig}
            defaultCurrency={agencyDashboard?.workspace?.defaultCurrency ?? 'USD'}
            onCreated={handleRefresh}
          />
        );
      case 'open':
        return (
          <OpenGigsSection
            orders={orders}
            onUpdateOrder={handleUpdateOrder}
            updatingOrderId={updatingOrderId}
          />
        );
      case 'closed':
        return (
          <ClosedGigsSection
            orders={orders}
            onReopen={handleReopenOrder}
            updatingOrderId={updatingOrderId}
          />
        );
      case 'proofs':
        return (
          <GigSubmissionsSection
            orderDetail={orderDetail}
            onCreateSubmission={handleCreateSubmission}
            onUpdateSubmission={handleUpdateSubmission}
            pending={pendingAction}
          />
        );
      case 'chat':
        return (
          <GigChatSection
            orderDetail={orderDetail}
            onSendMessage={handleSendMessage}
            onAcknowledgeMessage={handleAcknowledgeMessage}
            pending={pendingAction}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency Hub"
      subtitle={`Hello ${displayName.split(' ')[0] ?? displayName}`}
      description="Run gigs end-to-end."
      menuSections={MENU_GROUPS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem={activeSection}
      onMenuItemSelect={(itemId) => setActiveSection(itemId)}
    >
      <div className="mx-auto w-full max-w-7xl space-y-10 px-8 py-10">
        {anyError ? (
          <DataStatus
            status="error"
            title="Unable to load gigs"
            message={agencyError?.message || projectError?.message || orderError?.message}
            onRetry={handleRefresh}
          />
        ) : null}
        {pageLoading && !orders.length && !studioInsights.summary ? (
          <DataStatus status="loading" title="Loading" />
        ) : null}
        {renderSection()}
      </div>
    </DashboardLayout>
  );
}
