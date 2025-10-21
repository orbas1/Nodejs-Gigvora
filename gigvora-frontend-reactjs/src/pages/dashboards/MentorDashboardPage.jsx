import { useCallback, useEffect, useMemo, useState } from 'react';
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
  MentorHubSection,
  MentorCreationStudioWizardSection,
  MentorMetricsSection,
  MentorSettingsSection,
  MentorSystemPreferencesSection,
  MentorOrdersSection,
  MentorAdsSection,
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

const ALLOWED_ROLES = ['mentor'];

export default function MentorDashboardPage() {
  const [activeSection, setActiveSection] = useState('home-overview');
  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [packagesSaving, setPackagesSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [clientSaving, setClientSaving] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [supportSaving, setSupportSaving] = useState(false);
  const [messageSaving, setMessageSaving] = useState(false);
  const [verificationSaving, setVerificationSaving] = useState(false);
  const [walletSaving, setWalletSaving] = useState(false);
  const [hubSaving, setHubSaving] = useState(false);
  const [creationSaving, setCreationSaving] = useState(false);
  const [metricsSaving, setMetricsSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [ordersSaving, setOrdersSaving] = useState(false);
  const [adsSaving, setAdsSaving] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const menuSections = useMemo(() => MENU_GROUPS, []);

  const applyDashboardUpdate = useCallback((payload) => {
    if (!payload) {
      return;
    }

    const snapshot = payload.dashboard ?? payload;
    if (!snapshot) {
      return;
    }

    const { metadata: snapshotMetadata, profile: snapshotProfile, ...restSnapshot } = snapshot;

    setDashboard({ ...DEFAULT_DASHBOARD, ...restSnapshot });

    const profilePayload = payload.profile ?? snapshotProfile;
    if (profilePayload !== undefined) {
      if (profilePayload) {
        setProfile((current) => ({ ...DEFAULT_PROFILE, ...current, ...profilePayload }));
      } else {
        setProfile(DEFAULT_PROFILE);
      }
    }

    const metadataPayload = payload.metadata ?? snapshotMetadata;
    if (metadataPayload !== undefined) {
      setMetadata(metadataPayload ?? null);
    }
  }, []);

  const formatRelativeTime = useCallback((timestamp) => {
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
      if (Math.abs(diffMinutes) < 60) {
        const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
        return formatter.format(diffMinutes, 'minute');
      }
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      if (Math.abs(diffHours) < 48) {
        const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
        return formatter.format(diffHours, 'hour');
      }
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
      return formatter.format(diffDays, 'day');
    } catch (formatError) {
      console.warn('Failed to format mentorship dashboard timestamp', formatError);
      return null;
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMentorDashboard();
      applyDashboardUpdate(data);
    } catch (loadError) {
      const normalisedError = loadError instanceof Error ? loadError : new Error('Unable to load mentor dashboard.');
      setError(normalisedError);
    } finally {
      setLoading(false);
    }
  }, [applyDashboardUpdate]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleSaveAvailability = useCallback(async (slots) => {
    setAvailabilitySaving(true);
    try {
      await saveMentorAvailability(slots);
      const snapshot = await fetchMentorDashboard();
      applyDashboardUpdate(snapshot);
    } finally {
      setAvailabilitySaving(false);
    }
  }, [applyDashboardUpdate]);

  const handleSavePackages = useCallback(async (packages) => {
    setPackagesSaving(true);
    try {
      await saveMentorPackages(packages);
      const snapshot = await fetchMentorDashboard();
      applyDashboardUpdate(snapshot);
    } finally {
      setPackagesSaving(false);
    }
  }, [applyDashboardUpdate]);

  const handleSaveProfile = useCallback(
    async (payload) => {
      setProfileSaving(true);
      try {
        const response = await submitMentorProfile(payload);
        applyDashboardUpdate(response);
        return response;
      } catch (saveError) {
        throw saveError;
      } finally {
        setProfileSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateBooking = useCallback(
    async (payload) => {
      setBookingSaving(true);
      try {
        const response = await createMentorBooking(payload);
        applyDashboardUpdate(response);
        return response?.booking;
      } catch (bookingError) {
        throw bookingError;
      } finally {
        setBookingSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateBooking = useCallback(
    async (bookingId, payload) => {
      setBookingSaving(true);
      try {
        const response = await updateMentorBooking(bookingId, payload);
        applyDashboardUpdate(response);
        return response?.booking;
      } catch (bookingError) {
        throw bookingError;
      } finally {
        setBookingSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteBooking = useCallback(
    async (bookingId) => {
      setBookingSaving(true);
      try {
        const response = await deleteMentorBooking(bookingId);
        applyDashboardUpdate(response);
        return response;
      } catch (bookingError) {
        throw bookingError;
      } finally {
        setBookingSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateClient = useCallback(
    async (payload) => {
      setClientSaving(true);
      try {
        const response = await createMentorClient(payload);
        applyDashboardUpdate(response);
        return response?.client;
      } catch (clientError) {
        throw clientError;
      } finally {
        setClientSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateClient = useCallback(
    async (clientId, payload) => {
      setClientSaving(true);
      try {
        const response = await updateMentorClient(clientId, payload);
        applyDashboardUpdate(response);
        return response?.client;
      } catch (clientError) {
        throw clientError;
      } finally {
        setClientSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteClient = useCallback(
    async (clientId) => {
      setClientSaving(true);
      try {
        const response = await deleteMentorClient(clientId);
        applyDashboardUpdate(response);
        return response;
      } catch (clientError) {
        throw clientError;
      } finally {
        setClientSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateEvent = useCallback(
    async (payload) => {
      setEventSaving(true);
      try {
        const response = await createMentorEvent(payload);
        applyDashboardUpdate(response);
        return response?.event;
      } catch (eventError) {
        throw eventError;
      } finally {
        setEventSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateEvent = useCallback(
    async (eventId, payload) => {
      setEventSaving(true);
      try {
        const response = await updateMentorEvent(eventId, payload);
        applyDashboardUpdate(response);
        return response?.event;
      } catch (eventError) {
        throw eventError;
      } finally {
        setEventSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteEvent = useCallback(
    async (eventId) => {
      setEventSaving(true);
      try {
        const response = await deleteMentorEvent(eventId);
        applyDashboardUpdate(response);
        return response;
      } catch (eventError) {
        throw eventError;
      } finally {
        setEventSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateSupportTicket = useCallback(
    async (payload) => {
      setSupportSaving(true);
      try {
        const response = await createMentorSupportTicket(payload);
        applyDashboardUpdate(response);
        return response?.ticket;
      } catch (ticketError) {
        throw ticketError;
      } finally {
        setSupportSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateSupportTicket = useCallback(
    async (ticketId, payload) => {
      setSupportSaving(true);
      try {
        const response = await updateMentorSupportTicket(ticketId, payload);
        applyDashboardUpdate(response);
        return response?.ticket;
      } catch (ticketError) {
        throw ticketError;
      } finally {
        setSupportSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteSupportTicket = useCallback(
    async (ticketId) => {
      setSupportSaving(true);
      try {
        const response = await deleteMentorSupportTicket(ticketId);
        applyDashboardUpdate(response);
        return response;
      } catch (ticketError) {
        throw ticketError;
      } finally {
        setSupportSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateMessage = useCallback(
    async (payload) => {
      setMessageSaving(true);
      try {
        const response = await createMentorMessage(payload);
        applyDashboardUpdate(response);
        return response?.message;
      } catch (messageError) {
        throw messageError;
      } finally {
        setMessageSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateMessage = useCallback(
    async (messageId, payload) => {
      setMessageSaving(true);
      try {
        const response = await updateMentorMessage(messageId, payload);
        applyDashboardUpdate(response);
        return response?.message;
      } catch (messageError) {
        throw messageError;
      } finally {
        setMessageSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      setMessageSaving(true);
      try {
        const response = await deleteMentorMessage(messageId);
        applyDashboardUpdate(response);
        return response;
      } catch (messageError) {
        throw messageError;
      } finally {
        setMessageSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateVerificationStatus = useCallback(
    async (payload) => {
      setVerificationSaving(true);
      try {
        const response = await updateMentorVerificationStatus(payload);
        applyDashboardUpdate(response);
        return response?.verification;
      } catch (verificationError) {
        throw verificationError;
      } finally {
        setVerificationSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateVerificationDocument = useCallback(
    async (payload) => {
      setVerificationSaving(true);
      try {
        const response = await createMentorVerificationDocument(payload);
        applyDashboardUpdate(response);
        return response?.document;
      } catch (verificationError) {
        throw verificationError;
      } finally {
        setVerificationSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateVerificationDocument = useCallback(
    async (documentId, payload) => {
      setVerificationSaving(true);
      try {
        const response = await updateMentorVerificationDocument(documentId, payload);
        applyDashboardUpdate(response);
        return response?.document;
      } catch (verificationError) {
        throw verificationError;
      } finally {
        setVerificationSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteVerificationDocument = useCallback(
    async (documentId) => {
      setVerificationSaving(true);
      try {
        const response = await deleteMentorVerificationDocument(documentId);
        applyDashboardUpdate(response);
        return response;
      } catch (verificationError) {
        throw verificationError;
      } finally {
        setVerificationSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateWalletTransaction = useCallback(
    async (payload) => {
      setWalletSaving(true);
      try {
        const response = await createMentorWalletTransaction(payload);
        applyDashboardUpdate(response);
        return response?.transaction;
      } catch (walletError) {
        throw walletError;
      } finally {
        setWalletSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateWalletTransaction = useCallback(
    async (transactionId, payload) => {
      setWalletSaving(true);
      try {
        const response = await updateMentorWalletTransaction(transactionId, payload);
        applyDashboardUpdate(response);
        return response?.transaction;
      } catch (walletError) {
        throw walletError;
      } finally {
        setWalletSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteWalletTransaction = useCallback(
    async (transactionId) => {
      setWalletSaving(true);
      try {
        const response = await deleteMentorWalletTransaction(transactionId);
        applyDashboardUpdate(response);
        return response;
      } catch (walletError) {
        throw walletError;
      } finally {
        setWalletSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateInvoice = useCallback(
    async (payload) => {
      setInvoiceSaving(true);
      try {
        const response = await createMentorInvoice(payload);
        applyDashboardUpdate(response);
        return response?.invoice;
      } catch (invoiceError) {
        throw invoiceError;
      } finally {
        setInvoiceSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateInvoice = useCallback(
    async (invoiceId, payload) => {
      setInvoiceSaving(true);
      try {
        const response = await updateMentorInvoice(invoiceId, payload);
        applyDashboardUpdate(response);
        return response?.invoice;
      } catch (invoiceError) {
        throw invoiceError;
      } finally {
        setInvoiceSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteInvoice = useCallback(
    async (invoiceId) => {
      setInvoiceSaving(true);
      try {
        const response = await deleteMentorInvoice(invoiceId);
        applyDashboardUpdate(response);
        return response;
      } catch (invoiceError) {
        throw invoiceError;
      } finally {
        setInvoiceSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreatePayout = useCallback(
    async (payload) => {
      setPayoutSaving(true);
      try {
        const response = await createMentorPayout(payload);
        applyDashboardUpdate(response);
        return response?.payout;
      } catch (payoutError) {
        throw payoutError;
      } finally {
        setPayoutSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdatePayout = useCallback(
    async (payoutId, payload) => {
      setPayoutSaving(true);
      try {
        const response = await updateMentorPayout(payoutId, payload);
        applyDashboardUpdate(response);
        return response?.payout;
      } catch (payoutError) {
        throw payoutError;
      } finally {
        setPayoutSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeletePayout = useCallback(
    async (payoutId) => {
      setPayoutSaving(true);
      try {
        const response = await deleteMentorPayout(payoutId);
        applyDashboardUpdate(response);
        return response;
      } catch (payoutError) {
        throw payoutError;
      } finally {
        setPayoutSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateHubUpdate = useCallback(
    async (payload) => {
      setHubSaving(true);
      try {
        const response = await createMentorHubUpdate(payload);
        applyDashboardUpdate(response);
        return response?.update;
      } catch (hubError) {
        throw hubError;
      } finally {
        setHubSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateHubUpdate = useCallback(
    async (updateId, payload) => {
      setHubSaving(true);
      try {
        const response = await updateMentorHubUpdate(updateId, payload);
        applyDashboardUpdate(response);
        return response?.update;
      } catch (hubError) {
        throw hubError;
      } finally {
        setHubSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteHubUpdate = useCallback(
    async (updateId) => {
      setHubSaving(true);
      try {
        const response = await deleteMentorHubUpdate(updateId);
        applyDashboardUpdate(response);
        return response;
      } catch (hubError) {
        throw hubError;
      } finally {
        setHubSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateHubAction = useCallback(
    async (payload) => {
      setHubSaving(true);
      try {
        const response = await createMentorHubAction(payload);
        applyDashboardUpdate(response);
        return response?.action;
      } catch (hubError) {
        throw hubError;
      } finally {
        setHubSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateHubAction = useCallback(
    async (actionId, payload) => {
      setHubSaving(true);
      try {
        const response = await updateMentorHubAction(actionId, payload);
        applyDashboardUpdate(response);
        return response?.action;
      } catch (hubError) {
        throw hubError;
      } finally {
        setHubSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteHubAction = useCallback(
    async (actionId) => {
      setHubSaving(true);
      try {
        const response = await deleteMentorHubAction(actionId);
        applyDashboardUpdate(response);
        return response;
      } catch (hubError) {
        throw hubError;
      } finally {
        setHubSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateHubResource = useCallback(
    async (payload) => {
      setHubSaving(true);
      try {
        const response = await createMentorHubResource(payload);
        applyDashboardUpdate(response);
        return response?.resource;
      } catch (hubError) {
        throw hubError;
      } finally {
        setHubSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateHubResource = useCallback(
    async (resourceId, payload) => {
      setHubSaving(true);
      try {
        const response = await updateMentorHubResource(resourceId, payload);
        applyDashboardUpdate(response);
        return response?.resource;
      } catch (hubError) {
        throw hubError;
      } finally {
        setHubSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteHubResource = useCallback(
    async (resourceId) => {
      setHubSaving(true);
      try {
        const response = await deleteMentorHubResource(resourceId);
        applyDashboardUpdate(response);
        return response;
      } catch (hubError) {
        throw hubError;
      } finally {
        setHubSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleSaveHubSpotlight = useCallback(
    async (payload) => {
      setHubSaving(true);
      try {
        const response = await updateMentorHubSpotlight(payload);
        applyDashboardUpdate(response);
        return response?.spotlight;
      } catch (hubError) {
        throw hubError;
      } finally {
        setHubSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateCreationItem = useCallback(
    async (payload) => {
      setCreationSaving(true);
      try {
        const response = await createMentorCreationItem(payload);
        applyDashboardUpdate(response);
        return response?.item;
      } catch (creationError) {
        throw creationError;
      } finally {
        setCreationSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateCreationItem = useCallback(
    async (itemId, payload) => {
      setCreationSaving(true);
      try {
        const response = await updateMentorCreationItem(itemId, payload);
        applyDashboardUpdate(response);
        return response?.item;
      } catch (creationError) {
        throw creationError;
      } finally {
        setCreationSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteCreationItem = useCallback(
    async (itemId) => {
      setCreationSaving(true);
      try {
        const response = await deleteMentorCreationItem(itemId);
        applyDashboardUpdate(response);
        return response;
      } catch (creationError) {
        throw creationError;
      } finally {
        setCreationSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handlePublishCreationItem = useCallback(
    async (itemId) => {
      setCreationSaving(true);
      try {
        const response = await publishMentorCreationItem(itemId);
        applyDashboardUpdate(response);
        return response?.item;
      } catch (creationError) {
        throw creationError;
      } finally {
        setCreationSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateMetricWidget = useCallback(
    async (payload) => {
      setMetricsSaving(true);
      try {
        const response = await createMentorMetricWidget(payload);
        applyDashboardUpdate(response);
        return response?.widget;
      } catch (metricError) {
        throw metricError;
      } finally {
        setMetricsSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateMetricWidget = useCallback(
    async (widgetId, payload) => {
      setMetricsSaving(true);
      try {
        const response = await updateMentorMetricWidget(widgetId, payload);
        applyDashboardUpdate(response);
        return response?.widget;
      } catch (metricError) {
        throw metricError;
      } finally {
        setMetricsSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteMetricWidget = useCallback(
    async (widgetId) => {
      setMetricsSaving(true);
      try {
        const response = await deleteMentorMetricWidget(widgetId);
        applyDashboardUpdate(response);
        return response;
      } catch (metricError) {
        throw metricError;
      } finally {
        setMetricsSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleGenerateMetricsReport = useCallback(
    async () => {
      setMetricsSaving(true);
      try {
        const response = await generateMentorMetricsReport();
        applyDashboardUpdate(response);
        return response;
      } catch (metricError) {
        throw metricError;
      } finally {
        setMetricsSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleSaveSettings = useCallback(
    async (payload) => {
      setSettingsSaving(true);
      try {
        const response = await updateMentorSettings(payload);
        applyDashboardUpdate(response);
        return response?.settings;
      } catch (settingsError) {
        throw settingsError;
      } finally {
        setSettingsSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleSavePreferences = useCallback(
    async (payload) => {
      setPreferencesSaving(true);
      try {
        const response = await updateMentorSystemPreferences(payload);
        applyDashboardUpdate(response);
        return response?.preferences;
      } catch (preferencesError) {
        throw preferencesError;
      } finally {
        setPreferencesSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleRotateApiKey = useCallback(async () => {
    setPreferencesSaving(true);
    try {
      const response = await rotateMentorApiKey();
      applyDashboardUpdate(response);
      return response;
    } catch (rotateError) {
      throw rotateError;
    } finally {
      setPreferencesSaving(false);
    }
  }, [applyDashboardUpdate]);

  const handleCreateOrder = useCallback(
    async (payload) => {
      setOrdersSaving(true);
      try {
        const response = await createMentorOrder(payload);
        applyDashboardUpdate(response);
        return response?.order;
      } catch (orderError) {
        throw orderError;
      } finally {
        setOrdersSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateOrder = useCallback(
    async (orderId, payload) => {
      setOrdersSaving(true);
      try {
        const response = await updateMentorOrder(orderId, payload);
        applyDashboardUpdate(response);
        return response?.order;
      } catch (orderError) {
        throw orderError;
      } finally {
        setOrdersSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteOrder = useCallback(
    async (orderId) => {
      setOrdersSaving(true);
      try {
        const response = await deleteMentorOrder(orderId);
        applyDashboardUpdate(response);
        return response;
      } catch (orderError) {
        throw orderError;
      } finally {
        setOrdersSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateAdCampaign = useCallback(
    async (payload) => {
      setAdsSaving(true);
      try {
        const response = await createMentorAdCampaign(payload);
        applyDashboardUpdate(response);
        return response?.campaign;
      } catch (adsError) {
        throw adsError;
      } finally {
        setAdsSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateAdCampaign = useCallback(
    async (campaignId, payload) => {
      setAdsSaving(true);
      try {
        const response = await updateMentorAdCampaign(campaignId, payload);
        applyDashboardUpdate(response);
        return response?.campaign;
      } catch (adsError) {
        throw adsError;
      } finally {
        setAdsSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteAdCampaign = useCallback(
    async (campaignId) => {
      setAdsSaving(true);
      try {
        const response = await deleteMentorAdCampaign(campaignId);
        applyDashboardUpdate(response);
        return response;
      } catch (adsError) {
        throw adsError;
      } finally {
        setAdsSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleToggleAdCampaign = useCallback(
    async (campaignId, payload) => {
      setAdsSaving(true);
      try {
        const response = await toggleMentorAdCampaign(campaignId, payload);
        applyDashboardUpdate(response);
        return response?.campaign;
      } catch (adsError) {
        throw adsError;
      } finally {
        setAdsSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const renderSection = () => {
    const Component = SECTION_COMPONENTS[activeSection] ?? HomeOverviewSection;
    if (Component === HomeProfileSection) {
      return <HomeProfileSection profile={profile} onSave={handleSaveProfile} saving={profileSaving} />;
    }
    if (Component === HomeOverviewSection) {
      return (
        <HomeOverviewSection
          stats={dashboard?.stats}
          conversion={dashboard?.conversion}
          bookings={dashboard?.bookings}
          explorerPlacement={dashboard?.explorerPlacement}
          feedback={dashboard?.feedback}
          finance={dashboard?.finance}
          onRequestNewBooking={() => setActiveSection('mentorship')}
        />
      );
    }
    if (Component === FinanceManagementSection) {
      return (
        <FinanceManagementSection
          finance={dashboard?.finance}
          onCreateInvoice={handleCreateInvoice}
          onUpdateInvoice={handleUpdateInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onCreatePayout={handleCreatePayout}
          onUpdatePayout={handleUpdatePayout}
          onDeletePayout={handleDeletePayout}
          invoiceSaving={invoiceSaving}
          payoutSaving={payoutSaving}
        />
      );
    }
    if (Component === MentorshipManagementSection) {
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
          availabilitySaving={availabilitySaving}
          onSavePackages={handleSavePackages}
          packagesSaving={packagesSaving}
          bookingSaving={bookingSaving}
        />
      );
    }
    if (Component === MentorshipClientsSection) {
      return (
        <MentorshipClientsSection
          clients={dashboard?.clients ?? []}
          summary={dashboard?.clientSummary}
          onCreateClient={handleCreateClient}
          onUpdateClient={handleUpdateClient}
          onDeleteClient={handleDeleteClient}
          saving={clientSaving}
        />
      );
    }
    if (Component === MentorCalendarSection) {
      return (
        <MentorCalendarSection
          events={dashboard?.calendar?.events ?? []}
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          saving={eventSaving}
        />
      );
    }
    if (Component === MentorSupportSection) {
      return (
        <MentorSupportSection
          tickets={dashboard?.support?.tickets ?? []}
          summary={dashboard?.support?.summary}
          onCreateTicket={handleCreateSupportTicket}
          onUpdateTicket={handleUpdateSupportTicket}
          onDeleteTicket={handleDeleteSupportTicket}
          saving={supportSaving}
        />
      );
    }
    if (Component === MentorInboxSection) {
      return (
        <MentorInboxSection
          messages={dashboard?.inbox?.messages ?? []}
          summary={dashboard?.inbox?.summary}
          onCreateMessage={handleCreateMessage}
          onUpdateMessage={handleUpdateMessage}
          onDeleteMessage={handleDeleteMessage}
          saving={messageSaving}
        />
      );
    }
    if (Component === MentorVerificationSection) {
      return (
        <MentorVerificationSection
          verification={dashboard?.verification}
          onUpdateStatus={handleUpdateVerificationStatus}
          onCreateDocument={handleCreateVerificationDocument}
          onUpdateDocument={handleUpdateVerificationDocument}
          onDeleteDocument={handleDeleteVerificationDocument}
          saving={verificationSaving}
        />
      );
    }
    if (Component === MentorWalletSection) {
      return (
        <MentorWalletSection
          wallet={dashboard?.wallet}
          onCreateTransaction={handleCreateWalletTransaction}
          onUpdateTransaction={handleUpdateWalletTransaction}
          onDeleteTransaction={handleDeleteWalletTransaction}
          saving={walletSaving}
        />
      );
    }
    if (Component === MentorHubSection) {
      return (
        <MentorHubSection
          hub={dashboard?.hub ?? {}}
          saving={hubSaving}
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
          items={dashboard?.creationStudio?.items ?? []}
          saving={creationSaving}
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
          metrics={dashboard?.metricsDashboard?.widgets ?? []}
          cohorts={dashboard?.metricsDashboard?.cohorts ?? []}
          reporting={dashboard?.metricsDashboard?.reporting}
          saving={metricsSaving}
          onCreateWidget={handleCreateMetricWidget}
          onUpdateWidget={handleUpdateMetricWidget}
          onDeleteWidget={handleDeleteMetricWidget}
          onGenerateReport={handleGenerateMetricsReport}
        />
      );
    }
    if (Component === MentorSettingsSection) {
      return <MentorSettingsSection settings={dashboard?.settings} saving={settingsSaving} onSaveSettings={handleSaveSettings} />;
    }
    if (Component === MentorSystemPreferencesSection) {
      return (
        <MentorSystemPreferencesSection
          preferences={dashboard?.systemPreferences}
          saving={preferencesSaving}
          onSavePreferences={handleSavePreferences}
          onRotateApiKey={handleRotateApiKey}
        />
      );
    }
    if (Component === MentorOrdersSection) {
      return (
        <MentorOrdersSection
          orders={dashboard?.orders?.list ?? []}
          summary={dashboard?.orders?.summary}
          saving={ordersSaving}
          onCreateOrder={handleCreateOrder}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
        />
      );
    }
    if (Component === MentorAdsSection) {
      return (
        <MentorAdsSection
          campaigns={dashboard?.ads?.campaigns ?? []}
          insights={dashboard?.ads?.insights}
          saving={adsSaving}
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
        profile={profile}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem={activeSection}
        onMenuItemSelect={(itemId) => setActiveSection(itemId)}
      >
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {error.message}
          </div>
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
        {renderSection()}
      </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
