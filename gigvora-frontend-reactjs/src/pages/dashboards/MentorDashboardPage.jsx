import { Suspense, lazy, useCallback, useEffect, useMemo, useReducer } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './mentor/menuConfig.js';
import { DEFAULT_PROFILE, DEFAULT_DASHBOARD } from './mentor/sampleData.js';
import {
  HomeProfileSection,
  HomeOverviewSection,
  FinanceManagementSection,
  MentorshipManagementSection,
  MentorshipClientsSection,
  MentorCalendarSection,
  MentorSupportSection,
  MentorInboxSection,
  MentorVerificationSection,
  MentorWalletSection,
  MentorMetricsSection,
  MentorSettingsSection,
  MentorSystemPreferencesSection,
  MentorOrdersSection,
} from './mentor/sections/index.js';
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
import MentorCommandCenterInsights from './mentor/components/MentorCommandCenterInsights.jsx';
import useMentorAnalytics from './mentor/useMentorAnalytics.js';
import useDashboardEntityMutations from './hooks/useDashboardEntityMutations.js';

const MentorHubSection = lazy(() => import('./mentor/sections/MentorHubSection.jsx'));
const MentorCreationStudioWizardSection = lazy(() => import('./mentor/sections/MentorCreationStudioWizardSection.jsx'));
const MentorAdsSection = lazy(() => import('./mentor/sections/MentorAdsSection.jsx'));

const ALLOWED_ROLES = ['mentor'];

const SECTION_COMPONENTS = {
  'home-profile': HomeProfileSection,
  'home-overview': HomeOverviewSection,
  finance: FinanceManagementSection,
  mentorship: MentorshipManagementSection,
  clients: MentorshipClientsSection,
  calendar: MentorCalendarSection,
  support: MentorSupportSection,
  inbox: MentorInboxSection,
  verification: MentorVerificationSection,
  wallet: MentorWalletSection,
  hub: MentorHubSection,
  'creation-studio': MentorCreationStudioWizardSection,
  metrics: MentorMetricsSection,
  settings: MentorSettingsSection,
  'system-preferences': MentorSystemPreferencesSection,
  orders: MentorOrdersSection,
  ads: MentorAdsSection,
};

const initialState = {
  activeSection: 'home-overview',
  dashboard: null,
  profile: null,
  metadata: null,
  analytics: null,
  aiRecommendations: [],
  loading: false,
  error: null,
  saving: {},
  savingErrors: {},
};

function deepMerge(base = {}, update = {}) {
  const source = base ?? {};
  const result = Array.isArray(source) ? [...source] : { ...source };

  Object.entries(update ?? {}).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      result[key] = value.map((item) => (item && typeof item === 'object' ? { ...item } : item));
      return;
    }
    if (value && typeof value === 'object') {
      result[key] = deepMerge(source?.[key] ?? {}, value);
      return;
    }
    result[key] = value;
  });

  return result;
}

function applySnapshot(state, payload) {
  if (!payload) {
    return {};
  }

  const snapshot = payload.dashboard ?? payload;
  if (!snapshot) {
    return {};
  }

  const next = {};
  const { metadata, profile, analytics, aiRecommendations, ...rest } = snapshot;

  if (Object.keys(rest).length > 0) {
    const baseDashboard = state.dashboard ?? DEFAULT_DASHBOARD;
    next.dashboard = deepMerge(baseDashboard, rest);
  }

  const profilePayload = payload.profile ?? profile;
  if (profilePayload !== undefined) {
    if (profilePayload === null) {
      next.profile = null;
    } else {
      const baseProfile = state.profile ?? DEFAULT_PROFILE;
      next.profile = deepMerge(baseProfile, profilePayload);
    }
  }

  const metadataPayload = payload.metadata ?? metadata;
  if (metadataPayload !== undefined) {
    next.metadata = metadataPayload ?? null;
  }

  if (analytics !== undefined || payload.analytics !== undefined) {
    next.analytics = payload.analytics ?? analytics ?? null;
  }

  if (aiRecommendations !== undefined || payload.aiRecommendations !== undefined) {
    const recommendations = payload.aiRecommendations ?? aiRecommendations;
    next.aiRecommendations = Array.isArray(recommendations) ? recommendations : [];
  }

  return next;
}

function mentorDashboardReducer(state, action) {
  switch (action.type) {
    case 'section/set':
      return { ...state, activeSection: action.payload ?? 'home-overview' };
    case 'loading/start':
      return { ...state, loading: true, error: null };
    case 'loading/success':
      return { ...state, loading: false, error: null, ...applySnapshot(state, action.payload) };
    case 'loading/error':
      return { ...state, loading: false, error: action.payload };
    case 'snapshot/apply':
      return { ...state, ...applySnapshot(state, action.payload) };
    case 'saving/start': {
      const entity = action.payload?.entity;
      if (!entity) {
        return state;
      }
      return {
        ...state,
        saving: { ...state.saving, [entity]: true },
        savingErrors: { ...state.savingErrors, [entity]: null },
      };
    }
    case 'saving/finish': {
      const entity = action.payload?.entity;
      if (!entity) {
        return state;
      }
      return {
        ...state,
        saving: { ...state.saving, [entity]: false },
      };
    }
    case 'saving/error': {
      const entity = action.payload?.entity;
      if (!entity) {
        return state;
      }
      return {
        ...state,
        saving: { ...state.saving, [entity]: false },
        savingErrors: { ...state.savingErrors, [entity]: action.payload?.error ?? null },
      };
    }
    default:
      return state;
  }
}

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return null;
  }

  try {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const diffMs = date.getTime() - Date.now();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

    if (Math.abs(diffMinutes) < 60) {
      return formatter.format(diffMinutes, 'minute');
    }

    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 48) {
      return formatter.format(diffHours, 'hour');
    }

    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return formatter.format(diffDays, 'day');
  } catch (error) {
    console.warn('Failed to format mentorship dashboard timestamp', error);
    return null;
  }
}

export default function MentorDashboardPage() {
  const [state, dispatch] = useReducer(mentorDashboardReducer, initialState);
  const menuSections = useMemo(() => MENU_GROUPS, []);

  const setActiveSection = useCallback(
    (sectionId) => {
      dispatch({ type: 'section/set', payload: sectionId });
    },
    [dispatch],
  );

  const handleRefresh = useCallback(
    async (options) => {
      dispatch({ type: 'loading/start' });
      try {
        const data = await fetchMentorDashboard(options);
        dispatch({ type: 'loading/success', payload: data });
        return data;
      } catch (loadError) {
        const normalised = loadError instanceof Error ? loadError : new Error('Unable to load mentor dashboard.');
        dispatch({ type: 'loading/error', payload: normalised });
        throw normalised;
      }
    },
    [dispatch],
  );

  const createMutation = useDashboardEntityMutations(dispatch, { onMissingSnapshot: handleRefresh });

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleSaveProfile = useMemo(
    () =>
      createMutation({
        entity: 'profile',
        action: (payload) => submitMentorProfile(payload),
        selector: (response) => response?.profile ?? null,
      }),
    [createMutation],
  );

  const handleSaveAvailability = useMemo(
    () =>
      createMutation({
        entity: 'availability',
        action: (slots) => saveMentorAvailability(slots),
      }),
    [createMutation],
  );

  const handleSavePackages = useMemo(
    () =>
      createMutation({
        entity: 'packages',
        action: (packages) => saveMentorPackages(packages),
      }),
    [createMutation],
  );

  const handleCreateBooking = useMemo(
    () =>
      createMutation({
        entity: 'bookings',
        action: (payload) => createMentorBooking(payload),
        selector: (response) => response?.booking,
      }),
    [createMutation],
  );

  const handleUpdateBooking = useMemo(
    () =>
      createMutation({
        entity: 'bookings',
        action: (bookingId, payload) => updateMentorBooking(bookingId, payload),
        selector: (response) => response?.booking,
      }),
    [createMutation],
  );

  const handleDeleteBooking = useMemo(
    () =>
      createMutation({
        entity: 'bookings',
        action: (bookingId) => deleteMentorBooking(bookingId),
      }),
    [createMutation],
  );

  const handleCreateClient = useMemo(
    () =>
      createMutation({
        entity: 'clients',
        action: (payload) => createMentorClient(payload),
        selector: (response) => response?.client,
      }),
    [createMutation],
  );

  const handleUpdateClient = useMemo(
    () =>
      createMutation({
        entity: 'clients',
        action: (clientId, payload) => updateMentorClient(clientId, payload),
        selector: (response) => response?.client,
      }),
    [createMutation],
  );

  const handleDeleteClient = useMemo(
    () =>
      createMutation({
        entity: 'clients',
        action: (clientId) => deleteMentorClient(clientId),
      }),
    [createMutation],
  );

  const handleCreateEvent = useMemo(
    () =>
      createMutation({
        entity: 'calendar',
        action: (payload) => createMentorEvent(payload),
        selector: (response) => response?.event,
      }),
    [createMutation],
  );

  const handleUpdateEvent = useMemo(
    () =>
      createMutation({
        entity: 'calendar',
        action: (eventId, payload) => updateMentorEvent(eventId, payload),
        selector: (response) => response?.event,
      }),
    [createMutation],
  );

  const handleDeleteEvent = useMemo(
    () =>
      createMutation({
        entity: 'calendar',
        action: (eventId) => deleteMentorEvent(eventId),
      }),
    [createMutation],
  );

  const handleCreateSupportTicket = useMemo(
    () =>
      createMutation({
        entity: 'support',
        action: (payload) => createMentorSupportTicket(payload),
        selector: (response) => response?.ticket,
      }),
    [createMutation],
  );

  const handleUpdateSupportTicket = useMemo(
    () =>
      createMutation({
        entity: 'support',
        action: (ticketId, payload) => updateMentorSupportTicket(ticketId, payload),
        selector: (response) => response?.ticket,
      }),
    [createMutation],
  );

  const handleDeleteSupportTicket = useMemo(
    () =>
      createMutation({
        entity: 'support',
        action: (ticketId) => deleteMentorSupportTicket(ticketId),
      }),
    [createMutation],
  );

  const handleCreateMessage = useMemo(
    () =>
      createMutation({
        entity: 'inbox',
        action: (payload) => createMentorMessage(payload),
        selector: (response) => response?.message,
      }),
    [createMutation],
  );

  const handleUpdateMessage = useMemo(
    () =>
      createMutation({
        entity: 'inbox',
        action: (messageId, payload) => updateMentorMessage(messageId, payload),
        selector: (response) => response?.message,
      }),
    [createMutation],
  );

  const handleDeleteMessage = useMemo(
    () =>
      createMutation({
        entity: 'inbox',
        action: (messageId) => deleteMentorMessage(messageId),
      }),
    [createMutation],
  );

  const handleUpdateVerificationStatus = useMemo(
    () =>
      createMutation({
        entity: 'verification',
        action: (payload) => updateMentorVerificationStatus(payload),
        selector: (response) => response?.verification,
      }),
    [createMutation],
  );

  const handleCreateVerificationDocument = useMemo(
    () =>
      createMutation({
        entity: 'verification',
        action: (payload) => createMentorVerificationDocument(payload),
        selector: (response) => response?.document,
      }),
    [createMutation],
  );

  const handleUpdateVerificationDocument = useMemo(
    () =>
      createMutation({
        entity: 'verification',
        action: (documentId, payload) => updateMentorVerificationDocument(documentId, payload),
        selector: (response) => response?.document,
      }),
    [createMutation],
  );

  const handleDeleteVerificationDocument = useMemo(
    () =>
      createMutation({
        entity: 'verification',
        action: (documentId) => deleteMentorVerificationDocument(documentId),
      }),
    [createMutation],
  );

  const handleCreateWalletTransaction = useMemo(
    () =>
      createMutation({
        entity: 'wallet',
        action: (payload) => createMentorWalletTransaction(payload),
        selector: (response) => response?.transaction,
      }),
    [createMutation],
  );

  const handleUpdateWalletTransaction = useMemo(
    () =>
      createMutation({
        entity: 'wallet',
        action: (transactionId, payload) => updateMentorWalletTransaction(transactionId, payload),
        selector: (response) => response?.transaction,
      }),
    [createMutation],
  );

  const handleDeleteWalletTransaction = useMemo(
    () =>
      createMutation({
        entity: 'wallet',
        action: (transactionId) => deleteMentorWalletTransaction(transactionId),
      }),
    [createMutation],
  );

  const handleCreateInvoice = useMemo(
    () =>
      createMutation({
        entity: 'finance',
        action: (payload) => createMentorInvoice(payload),
        selector: (response) => response?.invoice,
      }),
    [createMutation],
  );

  const handleUpdateInvoice = useMemo(
    () =>
      createMutation({
        entity: 'finance',
        action: (invoiceId, payload) => updateMentorInvoice(invoiceId, payload),
        selector: (response) => response?.invoice,
      }),
    [createMutation],
  );

  const handleDeleteInvoice = useMemo(
    () =>
      createMutation({
        entity: 'finance',
        action: (invoiceId) => deleteMentorInvoice(invoiceId),
      }),
    [createMutation],
  );

  const handleCreatePayout = useMemo(
    () =>
      createMutation({
        entity: 'finance',
        action: (payload) => createMentorPayout(payload),
        selector: (response) => response?.payout,
      }),
    [createMutation],
  );

  const handleUpdatePayout = useMemo(
    () =>
      createMutation({
        entity: 'finance',
        action: (payoutId, payload) => updateMentorPayout(payoutId, payload),
        selector: (response) => response?.payout,
      }),
    [createMutation],
  );

  const handleDeletePayout = useMemo(
    () =>
      createMutation({
        entity: 'finance',
        action: (payoutId) => deleteMentorPayout(payoutId),
      }),
    [createMutation],
  );

  const handleCreateHubUpdate = useMemo(
    () =>
      createMutation({
        entity: 'hub',
        action: (payload) => createMentorHubUpdate(payload),
        selector: (response) => response?.update,
      }),
    [createMutation],
  );

  const handleUpdateHubUpdate = useMemo(
    () =>
      createMutation({
        entity: 'hub',
        action: (updateId, payload) => updateMentorHubUpdate(updateId, payload),
        selector: (response) => response?.update,
      }),
    [createMutation],
  );

  const handleDeleteHubUpdate = useMemo(
    () =>
      createMutation({
        entity: 'hub',
        action: (updateId) => deleteMentorHubUpdate(updateId),
      }),
    [createMutation],
  );

  const handleCreateHubAction = useMemo(
    () =>
      createMutation({
        entity: 'hub',
        action: (payload) => createMentorHubAction(payload),
        selector: (response) => response?.action,
      }),
    [createMutation],
  );

  const handleUpdateHubAction = useMemo(
    () =>
      createMutation({
        entity: 'hub',
        action: (actionId, payload) => updateMentorHubAction(actionId, payload),
        selector: (response) => response?.action,
      }),
    [createMutation],
  );

  const handleDeleteHubAction = useMemo(
    () =>
      createMutation({
        entity: 'hub',
        action: (actionId) => deleteMentorHubAction(actionId),
      }),
    [createMutation],
  );

  const handleCreateHubResource = useMemo(
    () =>
      createMutation({
        entity: 'hub',
        action: (payload) => createMentorHubResource(payload),
        selector: (response) => response?.resource,
      }),
    [createMutation],
  );

  const handleUpdateHubResource = useMemo(
    () =>
      createMutation({
        entity: 'hub',
        action: (resourceId, payload) => updateMentorHubResource(resourceId, payload),
        selector: (response) => response?.resource,
      }),
    [createMutation],
  );

  const handleDeleteHubResource = useMemo(
    () =>
      createMutation({
        entity: 'hub',
        action: (resourceId) => deleteMentorHubResource(resourceId),
      }),
    [createMutation],
  );

  const handleSaveHubSpotlight = useMemo(
    () =>
      createMutation({
        entity: 'hub',
        action: (payload) => updateMentorHubSpotlight(payload),
        selector: (response) => response?.spotlight,
      }),
    [createMutation],
  );

  const handleCreateCreationItem = useMemo(
    () =>
      createMutation({
        entity: 'creation',
        action: (payload) => createMentorCreationItem(payload),
        selector: (response) => response?.item,
      }),
    [createMutation],
  );

  const handleUpdateCreationItem = useMemo(
    () =>
      createMutation({
        entity: 'creation',
        action: (itemId, payload) => updateMentorCreationItem(itemId, payload),
        selector: (response) => response?.item,
      }),
    [createMutation],
  );

  const handleDeleteCreationItem = useMemo(
    () =>
      createMutation({
        entity: 'creation',
        action: (itemId) => deleteMentorCreationItem(itemId),
      }),
    [createMutation],
  );

  const handlePublishCreationItem = useMemo(
    () =>
      createMutation({
        entity: 'creation',
        action: (itemId) => publishMentorCreationItem(itemId),
        selector: (response) => response?.item,
      }),
    [createMutation],
  );

  const handleCreateMetricWidget = useMemo(
    () =>
      createMutation({
        entity: 'metrics',
        action: (payload) => createMentorMetricWidget(payload),
        selector: (response) => response?.widget,
      }),
    [createMutation],
  );

  const handleUpdateMetricWidget = useMemo(
    () =>
      createMutation({
        entity: 'metrics',
        action: (widgetId, payload) => updateMentorMetricWidget(widgetId, payload),
        selector: (response) => response?.widget,
      }),
    [createMutation],
  );

  const handleDeleteMetricWidget = useMemo(
    () =>
      createMutation({
        entity: 'metrics',
        action: (widgetId) => deleteMentorMetricWidget(widgetId),
      }),
    [createMutation],
  );

  const handleGenerateMetricsReport = useMemo(
    () =>
      createMutation({
        entity: 'metrics',
        action: () => generateMentorMetricsReport(),
      }),
    [createMutation],
  );

  const handleSaveSettings = useMemo(
    () =>
      createMutation({
        entity: 'settings',
        action: (payload) => updateMentorSettings(payload),
        selector: (response) => response?.settings,
      }),
    [createMutation],
  );

  const handleSavePreferences = useMemo(
    () =>
      createMutation({
        entity: 'preferences',
        action: (payload) => updateMentorSystemPreferences(payload),
        selector: (response) => response?.preferences,
      }),
    [createMutation],
  );

  const handleRotateApiKey = useMemo(
    () =>
      createMutation({
        entity: 'preferences',
        action: () => rotateMentorApiKey(),
      }),
    [createMutation],
  );

  const handleCreateOrder = useMemo(
    () =>
      createMutation({
        entity: 'orders',
        action: (payload) => createMentorOrder(payload),
        selector: (response) => response?.order,
      }),
    [createMutation],
  );

  const handleUpdateOrder = useMemo(
    () =>
      createMutation({
        entity: 'orders',
        action: (orderId, payload) => updateMentorOrder(orderId, payload),
        selector: (response) => response?.order,
      }),
    [createMutation],
  );

  const handleDeleteOrder = useMemo(
    () =>
      createMutation({
        entity: 'orders',
        action: (orderId) => deleteMentorOrder(orderId),
      }),
    [createMutation],
  );

  const handleCreateAdCampaign = useMemo(
    () =>
      createMutation({
        entity: 'ads',
        action: (payload) => createMentorAdCampaign(payload),
        selector: (response) => response?.campaign,
      }),
    [createMutation],
  );

  const handleUpdateAdCampaign = useMemo(
    () =>
      createMutation({
        entity: 'ads',
        action: (campaignId, payload) => updateMentorAdCampaign(campaignId, payload),
        selector: (response) => response?.campaign,
      }),
    [createMutation],
  );

  const handleDeleteAdCampaign = useMemo(
    () =>
      createMutation({
        entity: 'ads',
        action: (campaignId) => deleteMentorAdCampaign(campaignId),
      }),
    [createMutation],
  );

  const handleToggleAdCampaign = useMemo(
    () =>
      createMutation({
        entity: 'ads',
        action: (campaignId, payload) => toggleMentorAdCampaign(campaignId, payload),
        selector: (response) => response?.campaign,
      }),
    [createMutation],
  );

  const dashboard = state.dashboard ?? null;
  const profile = state.profile ?? null;
  const metadata = state.metadata ?? null;
  const saving = state.saving;
  const activeSection = state.activeSection;

  const resolvedDashboard = dashboard ?? DEFAULT_DASHBOARD;
  const resolvedProfile = profile ?? DEFAULT_PROFILE;
  const hasLiveData = Boolean(dashboard);

  const computedAnalytics = useMentorAnalytics(resolvedDashboard, metadata);
  const analyticsCards = state.analytics?.cards ?? computedAnalytics.analyticsCards;
  const aiRecommendations = state.aiRecommendations?.length ? state.aiRecommendations : computedAnalytics.aiRecommendations;
  const narrative = computedAnalytics.trendNarrative ?? state.analytics?.narrative ?? metadata?.trendNarrative ?? undefined;

  const renderSection = () => {
    const Component = SECTION_COMPONENTS[activeSection] ?? HomeOverviewSection;

    if (!hasLiveData) {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-600 shadow-sm">
          Fetching mentor workspace…
        </div>
      );
    }

    if (Component === HomeProfileSection) {
      return <HomeProfileSection profile={resolvedProfile} onSave={handleSaveProfile} saving={!!saving.profile} />;
    }

    if (Component === HomeOverviewSection) {
      return (
        <HomeOverviewSection
          stats={resolvedDashboard?.stats}
          conversion={resolvedDashboard?.conversion}
          bookings={resolvedDashboard?.bookings}
          explorerPlacement={resolvedDashboard?.explorerPlacement}
          feedback={resolvedDashboard?.feedback}
          finance={resolvedDashboard?.finance}
          onRequestNewBooking={() => setActiveSection('mentorship')}
        />
      );
    }

    if (Component === FinanceManagementSection) {
      return (
        <FinanceManagementSection
          finance={resolvedDashboard?.finance}
          onCreateInvoice={handleCreateInvoice}
          onUpdateInvoice={handleUpdateInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onCreatePayout={handleCreatePayout}
          onUpdatePayout={handleUpdatePayout}
          onDeletePayout={handleDeletePayout}
          invoiceSaving={!!saving.finance}
          payoutSaving={!!saving.finance}
        />
      );
    }

    if (Component === MentorshipManagementSection) {
      return (
        <MentorshipManagementSection
          bookings={resolvedDashboard?.bookings ?? []}
          availability={resolvedDashboard?.availability ?? []}
          packages={resolvedDashboard?.packages ?? []}
          segments={resolvedDashboard?.segments ?? []}
          onCreateBooking={handleCreateBooking}
          onUpdateBooking={handleUpdateBooking}
          onDeleteBooking={handleDeleteBooking}
          onSaveAvailability={handleSaveAvailability}
          availabilitySaving={!!saving.availability}
          onSavePackages={handleSavePackages}
          packagesSaving={!!saving.packages}
          bookingSaving={!!saving.bookings}
        />
      );
    }

    if (Component === MentorshipClientsSection) {
      return (
        <MentorshipClientsSection
          clients={resolvedDashboard?.clients ?? []}
          summary={resolvedDashboard?.clientSummary}
          onCreateClient={handleCreateClient}
          onUpdateClient={handleUpdateClient}
          onDeleteClient={handleDeleteClient}
          saving={!!saving.clients}
        />
      );
    }

    if (Component === MentorCalendarSection) {
      return (
        <MentorCalendarSection
          events={resolvedDashboard?.calendar?.events ?? []}
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          saving={!!saving.calendar}
        />
      );
    }

    if (Component === MentorSupportSection) {
      return (
        <MentorSupportSection
          tickets={resolvedDashboard?.support?.tickets ?? []}
          summary={resolvedDashboard?.support?.summary}
          onCreateTicket={handleCreateSupportTicket}
          onUpdateTicket={handleUpdateSupportTicket}
          onDeleteTicket={handleDeleteSupportTicket}
          saving={!!saving.support}
        />
      );
    }

    if (Component === MentorInboxSection) {
      return (
        <MentorInboxSection
          messages={resolvedDashboard?.inbox?.messages ?? []}
          summary={resolvedDashboard?.inbox?.summary}
          onCreateMessage={handleCreateMessage}
          onUpdateMessage={handleUpdateMessage}
          onDeleteMessage={handleDeleteMessage}
          saving={!!saving.inbox}
        />
      );
    }

    if (Component === MentorVerificationSection) {
      return (
        <MentorVerificationSection
          verification={resolvedDashboard?.verification}
          onUpdateStatus={handleUpdateVerificationStatus}
          onCreateDocument={handleCreateVerificationDocument}
          onUpdateDocument={handleUpdateVerificationDocument}
          onDeleteDocument={handleDeleteVerificationDocument}
          saving={!!saving.verification}
        />
      );
    }

    if (Component === MentorWalletSection) {
      return (
        <MentorWalletSection
          wallet={resolvedDashboard?.wallet}
          onCreateTransaction={handleCreateWalletTransaction}
          onUpdateTransaction={handleUpdateWalletTransaction}
          onDeleteTransaction={handleDeleteWalletTransaction}
          saving={!!saving.wallet}
        />
      );
    }

    if (Component === MentorHubSection) {
      return (
        <MentorHubSection
          hub={resolvedDashboard?.hub ?? {}}
          saving={!!saving.hub}
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
        />
      );
    }

    if (Component === MentorCreationStudioWizardSection) {
      return (
        <MentorCreationStudioWizardSection
          items={resolvedDashboard?.creationStudio?.items ?? []}
          saving={!!saving.creation}
          onCreateItem={handleCreateCreationItem}
          onUpdateItem={handleUpdateCreationItem}
          onDeleteItem={handleDeleteCreationItem}
          onPublishItem={handlePublishCreationItem}
        />
      );
    }

    if (Component === MentorMetricsSection) {
      return (
        <MentorMetricsSection
          metrics={resolvedDashboard?.metricsDashboard?.widgets ?? []}
          cohorts={resolvedDashboard?.metricsDashboard?.cohorts ?? []}
          reporting={resolvedDashboard?.metricsDashboard?.reporting}
          saving={!!saving.metrics}
          onCreateWidget={handleCreateMetricWidget}
          onUpdateWidget={handleUpdateMetricWidget}
          onDeleteWidget={handleDeleteMetricWidget}
          onGenerateReport={handleGenerateMetricsReport}
        />
      );
    }

    if (Component === MentorSettingsSection) {
      return <MentorSettingsSection settings={resolvedDashboard?.settings} saving={!!saving.settings} onSaveSettings={handleSaveSettings} />;
    }

    if (Component === MentorSystemPreferencesSection) {
      return (
        <MentorSystemPreferencesSection
          preferences={resolvedDashboard?.systemPreferences}
          saving={!!saving.preferences}
          onSavePreferences={handleSavePreferences}
          onRotateApiKey={handleRotateApiKey}
        />
      );
    }

    if (Component === MentorOrdersSection) {
      return (
        <MentorOrdersSection
          orders={resolvedDashboard?.orders?.list ?? []}
          summary={resolvedDashboard?.orders?.summary}
          saving={!!saving.orders}
          onCreateOrder={handleCreateOrder}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
        />
      );
    }

    if (Component === MentorAdsSection) {
      return (
        <MentorAdsSection
          campaigns={resolvedDashboard?.ads?.campaigns ?? []}
          insights={resolvedDashboard?.ads?.insights}
          saving={!!saving.ads}
          onCreateCampaign={handleCreateAdCampaign}
          onUpdateCampaign={handleUpdateAdCampaign}
          onDeleteCampaign={handleDeleteAdCampaign}
          onToggleCampaign={handleToggleAdCampaign}
        />
      );
    }

    return null;
  };

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="mentor"
        title="Mentor mission control"
        subtitle="Manage bookings, packages, and Explorer visibility"
        description="A dedicated workspace for mentors to orchestrate sessions, automate rituals, and grow mentorship revenue."
        menuSections={menuSections}
        profile={resolvedProfile}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem={activeSection}
        onMenuItemSelect={setActiveSection}
      >
        <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
          {state.error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">{state.error.message}</div>
          ) : null}

          {hasLiveData && (analyticsCards.length || aiRecommendations.length) ? (
            <MentorCommandCenterInsights
              analyticsCards={analyticsCards}
              aiRecommendations={aiRecommendations}
              loading={state.loading}
              onRefresh={() => handleRefresh()}
              onNavigate={setActiveSection}
              narrative={narrative}
            />
          ) : null}

          {metadata?.generatedAt ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-blue-100 bg-blue-50/80 px-5 py-3 text-sm text-slate-600">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Synced data</span>
                <span>Snapshot refreshed {formatRelativeTime(metadata.generatedAt) ?? 'recently'}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRefresh()}
                disabled={state.loading}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.loading ? 'Refreshing…' : 'Refresh now'}
              </button>
            </div>
          ) : null}

          <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-600 shadow-sm">Loading workspace…</div>}>
            {renderSection()}
          </Suspense>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
