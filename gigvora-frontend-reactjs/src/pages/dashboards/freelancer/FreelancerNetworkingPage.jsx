import { useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import useFreelancerNetworkingDashboard from '../../../hooks/useFreelancerNetworkingDashboard.js';
import {
  createFreelancerNetworkingOrder,
  updateFreelancerNetworkingOrder,
  deleteFreelancerNetworkingOrder,
  updateFreelancerNetworkingSettings,
  updateFreelancerNetworkingPreferences,
  createFreelancerNetworkingAd,
  updateFreelancerNetworkingAd,
  deleteFreelancerNetworkingAd,
} from '../../../services/freelancerNetworking.js';
import { AVAILABLE_DASHBOARDS } from './menuConfig.js';
import NetworkingSection from './sections/networking/NetworkingSection.jsx';
import MetricsSection from './sections/networking/MetricsSection.jsx';
import SettingsSection from './sections/networking/SettingsSection.jsx';
import SystemPreferencesSection from './sections/networking/SystemPreferencesSection.jsx';
import OrdersSection from './sections/networking/OrdersSection.jsx';
import AdsSection from './sections/networking/AdsSection.jsx';

const MENU_SECTIONS = [
  {
    label: 'Network',
    items: [
      { id: 'network-hub', name: 'Hub', href: '#network-hub', sectionId: 'network-hub' },
      { id: 'network-metrics', name: 'Metrics', href: '#network-metrics', sectionId: 'network-metrics' },
      { id: 'network-settings', name: 'Settings', href: '#network-settings', sectionId: 'network-settings' },
      { id: 'network-preferences', name: 'System preferences', href: '#network-preferences', sectionId: 'network-preferences' },
      { id: 'network-orders', name: 'Orders', href: '#network-orders', sectionId: 'network-orders' },
      { id: 'network-ads', name: 'Gigvora Ads', href: '#network-ads', sectionId: 'network-ads' },
    ],
  },
];

function resolveFreelancerId(session) {
  if (!session) {
    return null;
  }
  const candidates = [session.freelancerId, session.id, session.userId];
  for (const candidate of candidates) {
    if (candidate == null) continue;
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function extractErrorMessage(error, fallback) {
  if (!error) {
    return fallback;
  }
  const responseMessage = error.response?.data?.message ?? error.response?.data?.error;
  const firstDetail = Array.isArray(error.response?.data?.errors) && error.response.data.errors.length
    ? error.response.data.errors[0].message
    : null;
  return responseMessage || firstDetail || error.message || fallback;
}

function normaliseOrderPayload(form) {
  return {
    sessionId: form.sessionId ? Number(form.sessionId) : undefined,
    amount: form.amount,
    currency: form.currency,
    status: form.status,
    purchasedAt: form.purchasedAt,
    reference: form.reference,
    notes: form.notes,
  };
}

function normaliseCampaignPayload(payload) {
  return {
    name: payload.name,
    objective: payload.objective,
    status: payload.status,
    budget: payload.budget,
    budgetCents: payload.budgetCents,
    currencyCode: payload.currencyCode ?? payload.currency,
    startDate: payload.startDate,
    endDate: payload.endDate,
    headline: payload.headline,
    description: payload.description,
    mediaUrl: payload.mediaUrl,
    cta: payload.cta,
    ctaUrl: payload.ctaUrl,
    placements: payload.placements,
    audience: payload.audience,
    metrics: {
      spend: payload.metrics?.spend ?? payload.spend,
      impressions: payload.metrics?.impressions ?? payload.impressions,
      clicks: payload.metrics?.clicks ?? payload.clicks,
      conversions: payload.metrics?.conversions ?? payload.conversions,
    },
  };
}

export default function FreelancerNetworkingPage() {
  const { session } = useSession();
  const freelancerId = resolveFreelancerId(session);
  const heading = session?.firstName ? `${session.firstName}'s Network` : 'Network';

  const dashboard = useFreelancerNetworkingDashboard({ freelancerId, enabled: Boolean(freelancerId) });
  const {
    summaryCards,
    bookings,
    availableSessions,
    connections,
    metrics,
    orders,
    ordersSummary,
    settings,
    preferences,
    ads,
    config,
    loading,
    error,
    refresh,
  } = dashboard;

  const [ordersBusy, setOrdersBusy] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [preferencesBusy, setPreferencesBusy] = useState(false);
  const [adsBusy, setAdsBusy] = useState(false);
  const [adsError, setAdsError] = useState(null);

  const ensureFreelancer = () => {
    if (!freelancerId) {
      throw new Error('Sign in to manage your networking workspace.');
    }
  };

  const handleCreateOrder = async (form) => {
    ensureFreelancer();
    setOrdersBusy(true);
    setOrdersError(null);
    try {
      const payload = normaliseOrderPayload(form);
      const response = await createFreelancerNetworkingOrder(freelancerId, payload);
      await refresh({ force: true });
      return response;
    } catch (actionError) {
      const message = extractErrorMessage(actionError, 'Unable to record order.');
      setOrdersError(message);
      const nextError = new Error(message);
      nextError.cause = actionError;
      throw nextError;
    } finally {
      setOrdersBusy(false);
    }
  };

  const handleUpdateOrder = async (orderId, form) => {
    ensureFreelancer();
    setOrdersBusy(true);
    setOrdersError(null);
    try {
      const payload = normaliseOrderPayload(form);
      const response = await updateFreelancerNetworkingOrder(freelancerId, orderId, payload);
      await refresh({ force: true });
      return response;
    } catch (actionError) {
      const message = extractErrorMessage(actionError, 'Unable to update order.');
      setOrdersError(message);
      const nextError = new Error(message);
      nextError.cause = actionError;
      throw nextError;
    } finally {
      setOrdersBusy(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    ensureFreelancer();
    setOrdersBusy(true);
    setOrdersError(null);
    try {
      const response = await deleteFreelancerNetworkingOrder(freelancerId, orderId);
      await refresh({ force: true });
      return response;
    } catch (actionError) {
      const message = extractErrorMessage(actionError, 'Unable to delete order.');
      setOrdersError(message);
      const nextError = new Error(message);
      nextError.cause = actionError;
      throw nextError;
    } finally {
      setOrdersBusy(false);
    }
  };

  const handleSaveSettings = async (payload) => {
    ensureFreelancer();
    setSettingsBusy(true);
    try {
      const response = await updateFreelancerNetworkingSettings(freelancerId, payload);
      await refresh({ force: true });
      return response;
    } catch (actionError) {
      const message = extractErrorMessage(actionError, 'Unable to save workspace settings.');
      const nextError = new Error(message);
      nextError.cause = actionError;
      throw nextError;
    } finally {
      setSettingsBusy(false);
    }
  };

  const handleUpdatePreferences = async (nextPreferences) => {
    ensureFreelancer();
    setPreferencesBusy(true);
    try {
      const response = await updateFreelancerNetworkingPreferences(freelancerId, nextPreferences);
      await refresh({ force: true });
      return response;
    } catch (actionError) {
      const message = extractErrorMessage(actionError, 'Unable to update preferences.');
      const nextError = new Error(message);
      nextError.cause = actionError;
      throw nextError;
    } finally {
      setPreferencesBusy(false);
    }
  };

  const handleCreateCampaign = async (payload) => {
    ensureFreelancer();
    setAdsBusy(true);
    setAdsError(null);
    try {
      const response = await createFreelancerNetworkingAd(freelancerId, normaliseCampaignPayload(payload));
      await refresh({ force: true });
      return response;
    } catch (actionError) {
      const message = extractErrorMessage(actionError, 'Unable to save campaign.');
      setAdsError(message);
      const nextError = new Error(message);
      nextError.cause = actionError;
      throw nextError;
    } finally {
      setAdsBusy(false);
    }
  };

  const handleUpdateCampaign = async (campaignId, payload) => {
    ensureFreelancer();
    setAdsBusy(true);
    setAdsError(null);
    try {
      const response = await updateFreelancerNetworkingAd(freelancerId, campaignId, normaliseCampaignPayload(payload));
      await refresh({ force: true });
      return response;
    } catch (actionError) {
      const message = extractErrorMessage(actionError, 'Unable to update campaign.');
      setAdsError(message);
      const nextError = new Error(message);
      nextError.cause = actionError;
      throw nextError;
    } finally {
      setAdsBusy(false);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    ensureFreelancer();
    setAdsBusy(true);
    setAdsError(null);
    try {
      const response = await deleteFreelancerNetworkingAd(freelancerId, campaignId);
      await refresh({ force: true });
      return response;
    } catch (actionError) {
      const message = extractErrorMessage(actionError, 'Unable to delete campaign.');
      setAdsError(message);
      const nextError = new Error(message);
      nextError.cause = actionError;
      throw nextError;
    } finally {
      setAdsBusy(false);
    }
  };

  const orderStatuses = useMemo(() => (
    config?.orderStatuses?.length ? config.orderStatuses : ['pending', 'paid', 'refunded', 'cancelled']
  ), [config?.orderStatuses]);

  const handleRefresh = async () => {
    setOrdersError(null);
    setAdsError(null);
    await refresh({ force: true });
  };

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title={heading}
      subtitle="Sessions · Spend · Contacts"
      description="Book smartly and keep every introduction moving."
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="network-hub"
      onMenuItemSelect={() => {}}
    >
      <div className="mx-auto w-full max-w-7xl space-y-16 px-6 py-10">
        <NetworkingSection
          freelancerId={freelancerId}
          summaryCards={summaryCards}
          bookings={bookings}
          availableSessions={availableSessions}
          connections={connections}
          config={config}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
        />

        <MetricsSection metrics={metrics} ordersSummary={ordersSummary} adsInsights={ads?.insights} />

        <SettingsSection
          card={settings}
          saving={settingsBusy}
          onSave={handleSaveSettings}
          onRefresh={handleRefresh}
        />

        <SystemPreferencesSection
          preferences={preferences}
          saving={preferencesBusy}
          onUpdate={handleUpdatePreferences}
        />

        <OrdersSection
          orders={orders}
          summary={ordersSummary}
          loading={loading}
          onCreate={handleCreateOrder}
          onUpdate={handleUpdateOrder}
          onDelete={handleDeleteOrder}
          onRefresh={handleRefresh}
          statuses={orderStatuses}
          busy={ordersBusy}
          error={ordersError}
        />

        <AdsSection
          campaigns={ads?.campaigns ?? []}
          insights={ads?.insights}
          loading={loading}
          busy={adsBusy}
          error={adsError}
          onCreate={handleCreateCampaign}
          onUpdate={handleUpdateCampaign}
          onDelete={handleDeleteCampaign}
          onRefresh={handleRefresh}
        />
      </div>
    </DashboardLayout>
  );
}
