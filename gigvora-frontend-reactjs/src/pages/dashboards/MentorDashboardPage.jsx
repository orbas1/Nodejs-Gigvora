import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './mentor/menuConfig.js';
import {
  fetchMentorDashboard,
  saveMentorAvailability,
  saveMentorPackages,
  submitMentorProfile,
  createMentorBooking,
  updateMentorBooking,
  deleteMentorBooking,
  createMentorClient,
  updateMentorClient,
  deleteMentorClient,
  createMentorEvent,
  updateMentorEvent,
  deleteMentorEvent,
  createMentorSupportTicket,
  updateMentorSupportTicket,
  deleteMentorSupportTicket,
  createMentorMessage,
  updateMentorMessage,
  deleteMentorMessage,
  updateMentorVerificationStatus,
  createMentorVerificationDocument,
  updateMentorVerificationDocument,
  deleteMentorVerificationDocument,
  createMentorWalletTransaction,
  updateMentorWalletTransaction,
  deleteMentorWalletTransaction,
  createMentorInvoice,
  updateMentorInvoice,
  deleteMentorInvoice,
  createMentorPayout,
  updateMentorPayout,
  deleteMentorPayout,
  createMentorHubUpdate,
  updateMentorHubUpdate,
  deleteMentorHubUpdate,
  createMentorHubAction,
  updateMentorHubAction,
  deleteMentorHubAction,
  updateMentorHubSpotlight,
  createMentorHubResource,
  updateMentorHubResource,
  deleteMentorHubResource,
  createMentorCreationItem,
  updateMentorCreationItem,
  deleteMentorCreationItem,
  publishMentorCreationItem,
  createMentorMetricWidget,
  updateMentorMetricWidget,
  deleteMentorMetricWidget,
  generateMentorMetricsReport,
  updateMentorSettings,
  updateMentorSystemPreferences,
  rotateMentorApiKey,
  createMentorOrder,
  updateMentorOrder,
  deleteMentorOrder,
  createMentorAdCampaign,
  updateMentorAdCampaign,
  deleteMentorAdCampaign,
  toggleMentorAdCampaign,
} from '../../services/mentorship.js';
import { formatRelativeTime } from '../../utils/date.js';
import useEntityActionManager from '../../hooks/useEntityActionManager.js';
import { buildMentorAnalyticsOverlay, generateMentorAiRecommendations } from '../../utils/dashboard/mentor.js';

const HomeProfileSection = lazy(() => import('./mentor/sections/HomeProfileSection.jsx'));
const HomeOverviewSection = lazy(() => import('./mentor/sections/HomeOverviewSection.jsx'));
const FinanceManagementSection = lazy(() => import('./mentor/sections/FinanceManagementSection.jsx'));
const MentorshipManagementSection = lazy(() => import('./mentor/sections/MentorshipManagementSection.jsx'));
const MentorshipClientsSection = lazy(() => import('./mentor/sections/MentorshipClientsSection.jsx'));
const MentorCalendarSection = lazy(() => import('./mentor/sections/MentorCalendarSection.jsx'));
const MentorSupportSection = lazy(() => import('./mentor/sections/MentorSupportSection.jsx'));
const MentorInboxSection = lazy(() => import('./mentor/sections/MentorInboxSection.jsx'));
const MentorVerificationSection = lazy(() => import('./mentor/sections/MentorVerificationSection.jsx'));
const MentorWalletSection = lazy(() => import('./mentor/sections/MentorWalletSection.jsx'));
const MentorHubSection = lazy(() => import('./mentor/sections/MentorHubSection.jsx'));
const MentorCreationStudioWizardSection = lazy(() => import('./mentor/sections/MentorCreationStudioWizardSection.jsx'));
const MentorMetricsSection = lazy(() => import('./mentor/sections/MentorMetricsSection.jsx'));
const MentorSettingsSection = lazy(() => import('./mentor/sections/MentorSettingsSection.jsx'));
const MentorSystemPreferencesSection = lazy(() => import('./mentor/sections/MentorSystemPreferencesSection.jsx'));
const MentorOrdersSection = lazy(() => import('./mentor/sections/MentorOrdersSection.jsx'));
const MentorAdsSection = lazy(() => import('./mentor/sections/MentorAdsSection.jsx'));

const ALLOWED_ROLES = ['mentor'];
const ACTION_KEYS = [
  'availability',
  'packages',
  'profile',
  'booking',
  'client',
  'event',
  'support',
  'message',
  'verification',
  'wallet',
  'invoice',
  'payout',
  'hub',
  'creation',
  'metrics',
  'settings',
  'preferences',
  'orders',
  'ads',
];

const sectionFallback = (
  <div className="rounded-3xl border border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
    Loading mentor workspace…
  </div>
);

export default function MentorDashboardPage() {
  const [activeSection, setActiveSection] = useState('home-overview');
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const menuSections = useMemo(() => MENU_GROUPS, []);
  const { state: actionState, runAction } = useEntityActionManager(ACTION_KEYS);

  const hydrateDashboard = useCallback((payload) => {
    if (!payload) {
      return;
    }
    const snapshot = payload.dashboard ?? payload;
    const { profile: snapshotProfile, metadata: snapshotMetadata, ...rest } = snapshot ?? {};
    setDashboard(rest ?? null);
    if (snapshotProfile !== undefined) {
      setProfile(snapshotProfile ?? null);
    }
    if (snapshotMetadata !== undefined) {
      setMetadata(snapshotMetadata ?? null);
    }
  }, []);

  const refreshDashboard = useCallback(
    async ({ showLoading = false } = {}) => {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await fetchMentorDashboard();
        hydrateDashboard(data);
        return data;
      } catch (loadError) {
        const normalisedError =
          loadError instanceof Error ? loadError : new Error('Unable to load mentor dashboard.');
        setError(normalisedError);
        throw normalisedError;
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [hydrateDashboard],
  );

  useEffect(() => {
    refreshDashboard({ showLoading: true }).catch(() => {
      // The error is surfaced through state above; keep mount effect silent.
    });
  }, [refreshDashboard]);

  const analyticsOverlay = useMemo(() => buildMentorAnalyticsOverlay({ dashboard, metadata }), [dashboard, metadata]);
  const aiRecommendations = useMemo(
    () => generateMentorAiRecommendations({ dashboard, metadata, analyticsOverlay }),
    [dashboard, metadata, analyticsOverlay],
  );

  const saving = useMemo(
    () => ({
      availability: actionState.availability?.saving ?? false,
      packages: actionState.packages?.saving ?? false,
      profile: actionState.profile?.saving ?? false,
      booking: actionState.booking?.saving ?? false,
      client: actionState.client?.saving ?? false,
      event: actionState.event?.saving ?? false,
      support: actionState.support?.saving ?? false,
      message: actionState.message?.saving ?? false,
      verification: actionState.verification?.saving ?? false,
      wallet: actionState.wallet?.saving ?? false,
      invoice: actionState.invoice?.saving ?? false,
      payout: actionState.payout?.saving ?? false,
      hub: actionState.hub?.saving ?? false,
      creation: actionState.creation?.saving ?? false,
      metrics: actionState.metrics?.saving ?? false,
      settings: actionState.settings?.saving ?? false,
      preferences: actionState.preferences?.saving ?? false,
      orders: actionState.orders?.saving ?? false,
      ads: actionState.ads?.saving ?? false,
    }),
    [actionState],
  );

  const withRefresh = useCallback(
    (key, operation, options = {}) =>
      (...args) =>
        runAction(key, () => operation(...args), {
          selector: options.selector,
          refresh: options.refresh === false ? undefined : () => refreshDashboard(),
          onSuccess: options.onSuccess,
          onError: options.onError,
        }),
    [refreshDashboard, runAction],
  );

  const handleRefresh = useCallback(() => refreshDashboard({ showLoading: true }), [refreshDashboard]);

  const handleSaveAvailability = useMemo(
    () => withRefresh('availability', saveMentorAvailability),
    [withRefresh],
  );
  const handleSavePackages = useMemo(() => withRefresh('packages', saveMentorPackages), [withRefresh]);
  const handleSaveProfile = useMemo(() => withRefresh('profile', submitMentorProfile), [withRefresh]);

  const handleCreateBooking = useMemo(() => withRefresh('booking', createMentorBooking), [withRefresh]);
  const handleUpdateBooking = useMemo(
    () => withRefresh('booking', (bookingId, payload) => updateMentorBooking(bookingId, payload)),
    [withRefresh],
  );
  const handleDeleteBooking = useMemo(
    () => withRefresh('booking', (bookingId) => deleteMentorBooking(bookingId)),
    [withRefresh],
  );

  const handleCreateClient = useMemo(() => withRefresh('client', createMentorClient), [withRefresh]);
  const handleUpdateClient = useMemo(
    () => withRefresh('client', (clientId, payload) => updateMentorClient(clientId, payload)),
    [withRefresh],
  );
  const handleDeleteClient = useMemo(
    () => withRefresh('client', (clientId) => deleteMentorClient(clientId)),
    [withRefresh],
  );

  const handleCreateEvent = useMemo(() => withRefresh('event', createMentorEvent), [withRefresh]);
  const handleUpdateEvent = useMemo(
    () => withRefresh('event', (eventId, payload) => updateMentorEvent(eventId, payload)),
    [withRefresh],
  );
  const handleDeleteEvent = useMemo(
    () => withRefresh('event', (eventId) => deleteMentorEvent(eventId)),
    [withRefresh],
  );

  const handleCreateSupportTicket = useMemo(
    () => withRefresh('support', createMentorSupportTicket),
    [withRefresh],
  );
  const handleUpdateSupportTicket = useMemo(
    () => withRefresh('support', (ticketId, payload) => updateMentorSupportTicket(ticketId, payload)),
    [withRefresh],
  );
  const handleDeleteSupportTicket = useMemo(
    () => withRefresh('support', (ticketId) => deleteMentorSupportTicket(ticketId)),
    [withRefresh],
  );

  const handleCreateMessage = useMemo(() => withRefresh('message', createMentorMessage), [withRefresh]);
  const handleUpdateMessage = useMemo(
    () => withRefresh('message', (messageId, payload) => updateMentorMessage(messageId, payload)),
    [withRefresh],
  );
  const handleDeleteMessage = useMemo(
    () => withRefresh('message', (messageId) => deleteMentorMessage(messageId)),
    [withRefresh],
  );

  const handleUpdateVerificationStatus = useMemo(
    () => withRefresh('verification', updateMentorVerificationStatus),
    [withRefresh],
  );
  const handleCreateVerificationDocument = useMemo(
    () => withRefresh('verification', createMentorVerificationDocument),
    [withRefresh],
  );
  const handleUpdateVerificationDocument = useMemo(
    () => withRefresh('verification', (documentId, payload) => updateMentorVerificationDocument(documentId, payload)),
    [withRefresh],
  );
  const handleDeleteVerificationDocument = useMemo(
    () => withRefresh('verification', (documentId) => deleteMentorVerificationDocument(documentId)),
    [withRefresh],
  );

  const handleCreateWalletTransaction = useMemo(
    () => withRefresh('wallet', createMentorWalletTransaction),
    [withRefresh],
  );
  const handleUpdateWalletTransaction = useMemo(
    () => withRefresh('wallet', (transactionId, payload) => updateMentorWalletTransaction(transactionId, payload)),
    [withRefresh],
  );
  const handleDeleteWalletTransaction = useMemo(
    () => withRefresh('wallet', (transactionId) => deleteMentorWalletTransaction(transactionId)),
    [withRefresh],
  );

  const handleCreateInvoice = useMemo(() => withRefresh('invoice', createMentorInvoice), [withRefresh]);
  const handleUpdateInvoice = useMemo(
    () => withRefresh('invoice', (invoiceId, payload) => updateMentorInvoice(invoiceId, payload)),
    [withRefresh],
  );
  const handleDeleteInvoice = useMemo(
    () => withRefresh('invoice', (invoiceId) => deleteMentorInvoice(invoiceId)),
    [withRefresh],
  );

  const handleCreatePayout = useMemo(() => withRefresh('payout', createMentorPayout), [withRefresh]);
  const handleUpdatePayout = useMemo(
    () => withRefresh('payout', (payoutId, payload) => updateMentorPayout(payoutId, payload)),
    [withRefresh],
  );
  const handleDeletePayout = useMemo(
    () => withRefresh('payout', (payoutId) => deleteMentorPayout(payoutId)),
    [withRefresh],
  );

  const handleCreateHubUpdate = useMemo(() => withRefresh('hub', createMentorHubUpdate), [withRefresh]);
  const handleUpdateHubUpdate = useMemo(
    () => withRefresh('hub', (updateId, payload) => updateMentorHubUpdate(updateId, payload)),
    [withRefresh],
  );
  const handleDeleteHubUpdate = useMemo(
    () => withRefresh('hub', (updateId) => deleteMentorHubUpdate(updateId)),
    [withRefresh],
  );
  const handleCreateHubAction = useMemo(() => withRefresh('hub', createMentorHubAction), [withRefresh]);
  const handleUpdateHubAction = useMemo(
    () => withRefresh('hub', (actionId, payload) => updateMentorHubAction(actionId, payload)),
    [withRefresh],
  );
  const handleDeleteHubAction = useMemo(
    () => withRefresh('hub', (actionId) => deleteMentorHubAction(actionId)),
    [withRefresh],
  );
  const handleCreateHubResource = useMemo(
    () => withRefresh('hub', createMentorHubResource),
    [withRefresh],
  );
  const handleUpdateHubResource = useMemo(
    () => withRefresh('hub', (resourceId, payload) => updateMentorHubResource(resourceId, payload)),
    [withRefresh],
  );
  const handleDeleteHubResource = useMemo(
    () => withRefresh('hub', (resourceId) => deleteMentorHubResource(resourceId)),
    [withRefresh],
  );
  const handleSaveHubSpotlight = useMemo(() => withRefresh('hub', updateMentorHubSpotlight), [withRefresh]);

  const handleCreateCreationItem = useMemo(() => withRefresh('creation', createMentorCreationItem), [withRefresh]);
  const handleUpdateCreationItem = useMemo(
    () => withRefresh('creation', (itemId, payload) => updateMentorCreationItem(itemId, payload)),
    [withRefresh],
  );
  const handleDeleteCreationItem = useMemo(
    () => withRefresh('creation', (itemId) => deleteMentorCreationItem(itemId)),
    [withRefresh],
  );
  const handlePublishCreationItem = useMemo(
    () => withRefresh('creation', (itemId) => publishMentorCreationItem(itemId)),
    [withRefresh],
  );

  const handleCreateMetricWidget = useMemo(() => withRefresh('metrics', createMentorMetricWidget), [withRefresh]);
  const handleUpdateMetricWidget = useMemo(
    () => withRefresh('metrics', (widgetId, payload) => updateMentorMetricWidget(widgetId, payload)),
    [withRefresh],
  );
  const handleDeleteMetricWidget = useMemo(
    () => withRefresh('metrics', (widgetId) => deleteMentorMetricWidget(widgetId)),
    [withRefresh],
  );
  const handleGenerateMetricsReport = useMemo(
    () =>
      withRefresh('metrics', generateMentorMetricsReport, {
        refresh: false,
      }),
    [withRefresh],
  );

  const handleSaveSettings = useMemo(() => withRefresh('settings', updateMentorSettings), [withRefresh]);
  const handleSavePreferences = useMemo(
    () => withRefresh('preferences', updateMentorSystemPreferences),
    [withRefresh],
  );
  const handleRotateApiKey = useMemo(() => withRefresh('preferences', rotateMentorApiKey), [withRefresh]);

  const handleCreateOrder = useMemo(() => withRefresh('orders', createMentorOrder), [withRefresh]);
  const handleUpdateOrder = useMemo(
    () => withRefresh('orders', (orderId, payload) => updateMentorOrder(orderId, payload)),
    [withRefresh],
  );
  const handleDeleteOrder = useMemo(
    () => withRefresh('orders', (orderId) => deleteMentorOrder(orderId)),
    [withRefresh],
  );

  const handleCreateAdCampaign = useMemo(() => withRefresh('ads', createMentorAdCampaign), [withRefresh]);
  const handleUpdateAdCampaign = useMemo(
    () => withRefresh('ads', (campaignId, payload) => updateMentorAdCampaign(campaignId, payload)),
    [withRefresh],
  );
  const handleDeleteAdCampaign = useMemo(
    () => withRefresh('ads', (campaignId) => deleteMentorAdCampaign(campaignId)),
    [withRefresh],
  );
  const handleToggleAdCampaign = useMemo(
    () => withRefresh('ads', (campaignId, payload) => toggleMentorAdCampaign(campaignId, payload)),
    [withRefresh],
  );

  const sectionContent = useMemo(() => {
    switch (activeSection) {
      case 'home-profile':
        return <HomeProfileSection profile={profile} onSave={handleSaveProfile} saving={saving.profile} />;
      case 'home-overview':
        return (
          <HomeOverviewSection
            stats={dashboard?.stats}
            conversion={dashboard?.conversion}
            bookings={dashboard?.bookings}
            explorerPlacement={dashboard?.explorerPlacement}
            feedback={dashboard?.feedback}
            finance={dashboard?.finance}
            analyticsOverlay={analyticsOverlay}
            aiRecommendations={aiRecommendations}
            onRequestNewBooking={() => setActiveSection('mentorship')}
          />
        );
      case 'finance':
        return (
          <FinanceManagementSection
            finance={dashboard?.finance}
            onCreateInvoice={handleCreateInvoice}
            onUpdateInvoice={handleUpdateInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onCreatePayout={handleCreatePayout}
            onUpdatePayout={handleUpdatePayout}
            onDeletePayout={handleDeletePayout}
            invoiceSaving={saving.invoice}
            payoutSaving={saving.payout}
          />
        );
      case 'mentorship':
        return (
          <MentorshipManagementSection
            bookings={dashboard?.bookings ?? []}
            availability={dashboard?.availability ?? []}
            packages={dashboard?.packages ?? []}
            segments={dashboard?.segments ?? []}
            onCreateBooking={handleCreateBooking}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            onSaveAvailability={handleSaveAvailability}
            availabilitySaving={saving.availability}
            onSavePackages={handleSavePackages}
            packagesSaving={saving.packages}
            bookingSaving={saving.booking}
          />
        );
      case 'clients':
        return (
          <MentorshipClientsSection
            clients={dashboard?.clients ?? []}
            summary={dashboard?.clientSummary}
            onCreateClient={handleCreateClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            saving={saving.client}
          />
        );
      case 'calendar':
        return (
          <MentorCalendarSection
            events={dashboard?.calendar?.events ?? []}
            onCreateEvent={handleCreateEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            saving={saving.event}
          />
        );
      case 'support':
        return (
          <MentorSupportSection
            tickets={dashboard?.support?.tickets ?? []}
            summary={dashboard?.support?.summary}
            onCreateTicket={handleCreateSupportTicket}
            onUpdateTicket={handleUpdateSupportTicket}
            onDeleteTicket={handleDeleteSupportTicket}
            saving={saving.support}
          />
        );
      case 'inbox':
        return (
          <MentorInboxSection
            messages={dashboard?.inbox?.messages ?? []}
            summary={dashboard?.inbox?.summary}
            onCreateMessage={handleCreateMessage}
            onUpdateMessage={handleUpdateMessage}
            onDeleteMessage={handleDeleteMessage}
            saving={saving.message}
          />
        );
      case 'verification':
        return (
          <MentorVerificationSection
            verification={dashboard?.verification}
            onUpdateStatus={handleUpdateVerificationStatus}
            onCreateDocument={handleCreateVerificationDocument}
            onUpdateDocument={handleUpdateVerificationDocument}
            onDeleteDocument={handleDeleteVerificationDocument}
            saving={saving.verification}
          />
        );
      case 'wallet':
        return (
          <MentorWalletSection
            wallet={dashboard?.wallet}
            onCreateTransaction={handleCreateWalletTransaction}
            onUpdateTransaction={handleUpdateWalletTransaction}
            onDeleteTransaction={handleDeleteWalletTransaction}
            saving={saving.wallet}
          />
        );
      case 'hub':
        return (
          <MentorHubSection
            hub={dashboard?.hub ?? {}}
            saving={saving.hub}
            onCreateUpdate={handleCreateHubUpdate}
            onUpdateUpdate={handleUpdateHubUpdate}
            onDeleteUpdate={handleDeleteHubUpdate}
            onCreateAction={handleCreateHubAction}
            onUpdateAction={handleUpdateHubAction}
            onDeleteAction={handleDeleteHubAction}
            onCreateResource={handleCreateHubResource}
            onUpdateResource={handleUpdateHubResource}
            onDeleteResource={handleDeleteHubResource}
            onSaveSpotlight={handleSaveHubSpotlight}
            analyticsOverlay={analyticsOverlay}
          />
        );
      case 'creation-studio':
        return (
          <MentorCreationStudioWizardSection
            items={dashboard?.creationStudio?.items ?? []}
            saving={saving.creation}
            onCreateItem={handleCreateCreationItem}
            onUpdateItem={handleUpdateCreationItem}
            onDeleteItem={handleDeleteCreationItem}
            onPublishItem={handlePublishCreationItem}
          />
        );
      case 'metrics':
        return (
          <MentorMetricsSection
            metrics={dashboard?.metricsDashboard?.widgets ?? []}
            cohorts={dashboard?.metricsDashboard?.cohorts ?? []}
            reporting={dashboard?.metricsDashboard?.reporting}
            saving={saving.metrics}
            insightOverlay={analyticsOverlay}
            aiRecommendations={aiRecommendations}
            onCreateWidget={handleCreateMetricWidget}
            onUpdateWidget={handleUpdateMetricWidget}
            onDeleteWidget={handleDeleteMetricWidget}
            onGenerateReport={handleGenerateMetricsReport}
          />
        );
      case 'settings':
        return <MentorSettingsSection settings={dashboard?.settings} saving={saving.settings} onSaveSettings={handleSaveSettings} />;
      case 'system-preferences':
        return (
          <MentorSystemPreferencesSection
            preferences={dashboard?.systemPreferences}
            saving={saving.preferences}
            onSavePreferences={handleSavePreferences}
            onRotateApiKey={handleRotateApiKey}
          />
        );
      case 'orders':
        return (
          <MentorOrdersSection
            orders={dashboard?.orders?.list ?? []}
            summary={dashboard?.orders?.summary}
            saving={saving.orders}
            onCreateOrder={handleCreateOrder}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
          />
        );
      case 'ads':
        return (
          <MentorAdsSection
            campaigns={dashboard?.ads?.campaigns ?? []}
            insights={dashboard?.ads?.insights}
            saving={saving.ads}
            onCreateCampaign={handleCreateAdCampaign}
            onUpdateCampaign={handleUpdateAdCampaign}
            onDeleteCampaign={handleDeleteAdCampaign}
            onToggleCampaign={handleToggleAdCampaign}
          />
        );
      default:
        return null;
    }
  }, [
    activeSection,
    aiRecommendations,
    analyticsOverlay,
    dashboard,
    handleCreateAdCampaign,
    handleCreateBooking,
    handleCreateClient,
    handleCreateCreationItem,
    handleCreateEvent,
    handleCreateHubAction,
    handleCreateHubResource,
    handleCreateHubUpdate,
    handleCreateInvoice,
    handleCreateMessage,
    handleCreateMetricWidget,
    handleCreateOrder,
    handleCreatePayout,
    handleCreateSupportTicket,
    handleCreateWalletTransaction,
    handleDeleteAdCampaign,
    handleDeleteBooking,
    handleDeleteClient,
    handleDeleteCreationItem,
    handleDeleteEvent,
    handleDeleteHubAction,
    handleDeleteHubResource,
    handleDeleteHubUpdate,
    handleDeleteInvoice,
    handleDeleteMessage,
    handleDeleteMetricWidget,
    handleDeleteOrder,
    handleDeletePayout,
    handleDeleteSupportTicket,
    handleDeleteWalletTransaction,
    handleGenerateMetricsReport,
    handlePublishCreationItem,
    handleRotateApiKey,
    handleSaveAvailability,
    handleSaveHubSpotlight,
    handleSavePackages,
    handleSavePreferences,
    handleSaveProfile,
    handleSaveSettings,
    handleToggleAdCampaign,
    handleUpdateAdCampaign,
    handleUpdateBooking,
    handleUpdateClient,
    handleUpdateCreationItem,
    handleUpdateEvent,
    handleUpdateHubAction,
    handleUpdateHubResource,
    handleUpdateHubUpdate,
    handleUpdateInvoice,
    handleUpdateMessage,
    handleUpdateMetricWidget,
    handleUpdateOrder,
    handleUpdatePayout,
    handleUpdateSupportTicket,
    handleUpdateVerificationDocument,
    handleUpdateVerificationStatus,
    handleUpdateWalletTransaction,
    profile,
    saving,
  ]);

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="mentor"
        title="Mentor mission control"
        subtitle="Manage bookings, packages, and Explorer visibility"
        description="A dedicated workspace for mentors to orchestrate sessions, automate rituals, and grow mentorship revenue."
        menuSections={menuSections}
        profile={profile}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem={activeSection}
        onMenuItemSelect={(itemId) => setActiveSection(itemId)}
      >
        <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">{error.message}</div>
          ) : null}
          {metadata?.generatedAt ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-blue-100 bg-blue-50/80 px-5 py-3 text-sm text-slate-600">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Synced data</span>
                <span>Snapshot refreshed {formatRelativeTime(metadata.generatedAt) ?? 'recently'}</span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Refreshing…' : 'Refresh now'}
              </button>
            </div>
          ) : null}
          <Suspense fallback={sectionFallback}>{sectionContent}</Suspense>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
