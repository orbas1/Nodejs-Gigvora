import { Suspense, lazy, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './mentor/menuConfig.js';
import { DEFAULT_PROFILE, DEFAULT_DASHBOARD } from './mentor/sampleData.js';
import AnalyticsOverlayPanel from './mentor/components/AnalyticsOverlayPanel.jsx';
import AiCoachPanel from './mentor/components/AiCoachPanel.jsx';
import EngagementTimeline from './mentor/components/EngagementTimeline.jsx';
import HomeProfileSection from './mentor/sections/HomeProfileSection.jsx';
import HomeOverviewSection from './mentor/sections/HomeOverviewSection.jsx';
import FinanceManagementSection from './mentor/sections/FinanceManagementSection.jsx';
import MentorshipManagementSection from './mentor/sections/MentorshipManagementSection.jsx';
import MentorshipClientsSection from './mentor/sections/MentorshipClientsSection.jsx';
import MentorCalendarSection from './mentor/sections/MentorCalendarSection.jsx';
import MentorSupportSection from './mentor/sections/MentorSupportSection.jsx';
import MentorInboxSection from './mentor/sections/MentorInboxSection.jsx';
import MentorVerificationSection from './mentor/sections/MentorVerificationSection.jsx';
import MentorWalletSection from './mentor/sections/MentorWalletSection.jsx';
import MentorMetricsSection from './mentor/sections/MentorMetricsSection.jsx';
import MentorSettingsSection from './mentor/sections/MentorSettingsSection.jsx';
import MentorSystemPreferencesSection from './mentor/sections/MentorSystemPreferencesSection.jsx';
import MentorOrdersSection from './mentor/sections/MentorOrdersSection.jsx';
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
import { useDashboardEntityMutation } from '../../utils/dashboard/entityStore.js';

const LazyMentorHubSection = lazy(() => import('./mentor/sections/MentorHubSection.jsx'));
const LazyMentorCreationStudioWizardSection = lazy(() => import('./mentor/sections/MentorCreationStudioWizardSection.jsx'));
const LazyMentorAdsSection = lazy(() => import('./mentor/sections/MentorAdsSection.jsx'));

const ALLOWED_ROLES = ['mentor'];

const INITIAL_STATE = {
  activeSection: 'home-overview',
  dashboard: null,
  profile: null,
  metadata: null,
  loading: false,
  error: null,
  saving: {},
  analytics: { overlays: [], recommendations: [], timeline: [] },
  lookbackDays: 30,
  fallbackUsed: false,
};

function mentorDashboardReducer(state, action) {
  switch (action.type) {
    case 'section/set':
      return { ...state, activeSection: action.section };
    case 'loading/start':
      return { ...state, loading: true, error: null };
    case 'loading/error':
      return { ...state, loading: false, error: action.error };
    case 'loading/success':
      return { ...state, loading: false, error: null };
    case 'snapshot/apply':
      return {
        ...state,
        dashboard: action.payload.dashboard ?? state.dashboard,
        profile: action.payload.profile ?? state.profile,
        metadata: action.payload.metadata ?? state.metadata,
        analytics: action.payload.analytics ?? state.analytics,
        loading: false,
      };
    case 'entity/saving/start':
      return {
        ...state,
        saving: {
          ...state.saving,
          [action.key]: { status: 'pending', error: null },
        },
      };
    case 'entity/saving/success':
      return {
        ...state,
        saving: {
          ...state.saving,
          [action.key]: { status: 'success', error: null, at: Date.now() },
        },
      };
    case 'entity/saving/error':
      return {
        ...state,
        saving: {
          ...state.saving,
          [action.key]: { status: 'error', error: action.error },
        },
      };
    case 'lookback/set':
      return { ...state, lookbackDays: action.value };
    case 'fallback/applied':
      return { ...state, fallbackUsed: true };
    default:
      return state;
  }
}

function normaliseError(error, fallbackMessage = 'Unable to load mentor dashboard.') {
  if (error instanceof Error) {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(error.message);
  }
  return new Error(fallbackMessage);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function toCurrencyCode(symbol) {
  if (!symbol) {
    return 'GBP';
  }
  if (typeof symbol === 'string' && symbol.length === 3 && symbol === symbol.toUpperCase()) {
    return symbol;
  }
  const mapping = {
    '£': 'GBP',
    $: 'USD',
    '€': 'EUR',
  };
  return mapping[symbol] ?? 'GBP';
}

function formatCurrency(amount, currencySymbol) {
  if (amount === null || amount === undefined) {
    return '—';
  }
  const currency = toCurrencyCode(currencySymbol);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch (error) {
    return `${currencySymbol ?? ''}${amount}`;
  }
}

function parseNumberFromStat(stat) {
  if (!stat) {
    return null;
  }
  if (typeof stat.rawValue === 'number') {
    return stat.rawValue;
  }
  if (typeof stat.value === 'number') {
    return stat.value;
  }
  if (typeof stat.value === 'string') {
    const numeric = Number.parseFloat(stat.value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function cloneValue(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function buildEngagementTimeline(dashboard) {
  const timeline = [];
  const now = Date.now();

  ensureArray(dashboard?.bookings).forEach((booking) => {
    if (!booking?.scheduledAt) {
      return;
    }
    timeline.push({
      id: `booking-${booking.id ?? booking.scheduledAt}`,
      at: booking.scheduledAt,
      title: booking.mentee ? `Session with ${booking.mentee}` : 'Mentorship session',
      subtitle: booking.package ?? booking.focus ?? 'Mentorship',
      label: booking.status ?? 'Scheduled',
      summary: booking.focus ?? booking.channel ?? undefined,
      tone: 'session',
    });
  });

  ensureArray(dashboard?.finance?.invoices).forEach((invoice) => {
    timeline.push({
      id: `invoice-${invoice.id ?? invoice.reference}`,
      at: invoice.dueOn ?? invoice.issuedOn,
      title: invoice.package ? `${invoice.package} invoice` : 'Invoice touchpoint',
      subtitle: invoice.mentee ?? undefined,
      label: invoice.status ?? 'Invoice',
      summary: invoice.amount ? `${formatCurrency(invoice.amount, invoice.currency)} due` : undefined,
      tone: 'invoice',
    });
  });

  ensureArray(dashboard?.finance?.payouts).forEach((payout) => {
    timeline.push({
      id: `payout-${payout.id ?? payout.reference}`,
      at: payout.expectedOn ?? payout.initiatedOn,
      title: payout.reference ? `Payout ${payout.reference}` : 'Mentor payout',
      subtitle: payout.destination ?? undefined,
      label: payout.status ?? 'Payout',
      summary: payout.amount ? `${formatCurrency(payout.amount, payout.currency)} to ${payout.method ?? 'bank account'}` : undefined,
      tone: 'payout',
    });
  });

  ensureArray(dashboard?.hub?.actions).forEach((action) => {
    if (!action?.dueAt) {
      return;
    }
    timeline.push({
      id: `action-${action.id ?? action.label}`,
      at: action.dueAt,
      title: action.label ?? 'Hub action',
      subtitle: action.owner ? `Owner: ${action.owner}` : undefined,
      label: action.priority ?? 'Action',
      summary: action.status ? `Status: ${action.status}` : undefined,
      tone: 'action',
    });
  });

  return timeline
    .filter((item) => item.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .filter((item) => new Date(item.at).getTime() >= now - 1000 * 60 * 60 * 24 * 3)
    .slice(0, 10);
}

function deriveRecommendations({ overlays, bookings, explorerPlacement, stats, finance }) {
  const recommendations = [];
  const pipeline = overlays.find((overlay) => overlay.id === 'pipeline');
  const revenue = overlays.find((overlay) => overlay.id === 'revenue');
  const demand = overlays.find((overlay) => overlay.id === 'demand');

  if (pipeline) {
    const pendingStat = pipeline.stats?.find((stat) => stat.label === 'Pending actions');
    const conversionStat = pipeline.stats?.find((stat) => stat.label === 'Conversion');
    const pendingCount = parseNumberFromStat(pendingStat) ?? 0;
    if (pendingCount > 0) {
      recommendations.push({
        id: 'follow-up-mentees',
        title: 'Clear mentee follow-ups to unlock revenue',
        body: `There are ${pendingCount} mentees awaiting actions before their sessions can be confirmed. Closing these loops now keeps conversion momentum high.`,
        metrics: [
          { label: 'Conversion rate', value: conversionStat?.value ?? '—' },
          { label: 'Awaiting mentor', value: pendingStat?.value ?? pendingCount },
        ],
        actions: [
          { type: 'section', label: 'Open bookings workspace', value: 'mentorship' },
          { type: 'section', label: 'Check support desk', value: 'support' },
        ],
      });
    }
  }

  if (revenue) {
    const varianceStat = revenue.stats?.find((stat) => stat.label === 'Variance');
    const projectedStat = revenue.stats?.find((stat) => stat.label === 'Projected');
    const variance = parseNumberFromStat(varianceStat);
    if (variance !== null && variance < 0) {
      recommendations.push({
        id: 'pricing-optimisation',
        title: 'Refresh pricing to close the revenue variance',
        body: `Monthly revenue is tracking ${varianceStat?.value ?? 'behind target'}. Consider introducing a premium tier or promoting async reviews to lift the run rate.`,
        metrics: [
          { label: 'Projected', value: projectedStat?.value ?? '—' },
          { label: 'Variance', value: varianceStat?.value ?? '—' },
        ],
        actions: [
          { type: 'section', label: 'Review packages', value: 'mentorship' },
          { type: 'section', label: 'Open finance workspace', value: 'finance' },
        ],
      });
    }
  }

  if (demand) {
    const waitlistStat = demand.stats?.find((stat) => stat.label === 'Waitlist');
    const waitlist = parseNumberFromStat(waitlistStat) ?? 0;
    if (waitlist > 0) {
      recommendations.push({
        id: 'expand-availability',
        title: 'Expand availability to capture current demand',
        body: `${waitlist} prospective mentees are queued. Opening additional slots or launching a cohort programme keeps Explorer placement climbing.`,
        metrics: [
          { label: 'Explorer score', value: explorerPlacement?.score ?? '—' },
          { label: 'Active mentees', value: stats?.activeMentees ?? '—' },
        ],
        actions: [
          { type: 'section', label: 'Adjust availability', value: 'calendar' },
          { type: 'section', label: 'Launch cohort offer', value: 'creation-studio' },
        ],
      });
    }
  }

  if (recommendations.length === 0 && revenue) {
    recommendations.push({
      id: 'celebrate-growth',
      title: 'Momentum is strong—document the wins',
      body: 'Revenue and conversion signals look healthy. Capture fresh testimonials or publish a spotlight to keep Explorer demand high.',
      metrics: [
        { label: 'Monthly revenue', value: revenue.headline },
        { label: 'Explorer placement', value: explorerPlacement?.position ?? 'Rising mentor' },
      ],
      actions: [
        { type: 'section', label: 'Share mentor spotlight', value: 'hub' },
        { type: 'section', label: 'Collect testimonials', value: 'mentorship' },
      ],
    });
  }

  return recommendations;
}

function deriveAnalyticsSnapshot(dashboard, { lookbackDays = 30 } = {}) {
  const stats = dashboard?.stats ?? {};
  const conversion = ensureArray(dashboard?.conversion);
  const bookings = ensureArray(dashboard?.bookings);
  const finance = dashboard?.finance ?? {};
  const revenueStreams = ensureArray(finance.revenueStreams);
  const explorerPlacement = dashboard?.explorerPlacement ?? {};

  const requestsMetric = conversion.find((item) => item.id === 'requests');
  const confirmedMetric = conversion.find((item) => item.id === 'confirmed');
  const viewsMetric = conversion.find((item) => item.id === 'views');

  const pendingBookings = bookings.filter((booking) => {
    const status = (booking?.status ?? '').toLowerCase();
    return status.includes('awaiting') || status.includes('pending') || (booking?.segment ?? '').toLowerCase() === 'pending';
  });

  const futureBookings = bookings
    .map((booking) => new Date(booking?.scheduledAt).getTime())
    .filter((time) => Number.isFinite(time) && time > Date.now());

  const avgLeadTime = futureBookings.length
    ? Math.max(1, Math.round(futureBookings.reduce((acc, time) => acc + (time - Date.now()), 0) / futureBookings.length / (1000 * 60 * 60 * 24)))
    : null;

  const confirmedCount = confirmedMetric?.value ?? bookings.filter((booking) => (booking?.status ?? '').toLowerCase().includes('confirm') || (booking?.status ?? '').toLowerCase().includes('schedule')).length;
  const requestsCount = requestsMetric?.value ?? bookings.length;
  const conversionRate = requestsCount ? Math.round((confirmedCount / requestsCount) * 100) : null;

  const currencySymbol = finance?.summary?.currency ?? bookings[0]?.currency ?? stats?.currency ?? '£';
  const projected = finance?.summary?.projected;
  const variance = finance?.summary?.variance;

  const totalStreams = revenueStreams.reduce((sum, stream) => sum + (stream?.amount ?? 0), 0);
  const upsellStreams = revenueStreams
    .filter((stream) => !['one-on-one', 'one_on_one', '1:1 Coaching', '1-1', '1:1'].includes(stream?.id))
    .reduce((sum, stream) => sum + (stream?.amount ?? 0), 0);
  const upsellShare = totalStreams > 0 ? Math.round((upsellStreams / totalStreams) * 100) : null;

  const overlays = [
    {
      id: 'pipeline',
      title: 'Booking pipeline',
      headline: `${confirmedCount ?? 0} confirmed of ${requestsCount ?? 0} requests`,
      summary: `Explorer and referral conversions across the last ${lookbackDays} days.`,
      trend:
        requestsMetric?.delta !== undefined
          ? {
              value: requestsMetric.delta,
              label: 'vs. previous period',
              direction: requestsMetric.delta > 0 ? 'up' : requestsMetric.delta < 0 ? 'down' : 'flat',
            }
          : undefined,
      stats: [
        {
          label: 'Conversion',
          value: conversionRate !== null ? `${conversionRate}%` : '—',
          rawValue: conversionRate,
          tone: conversionRate !== null && conversionRate < 50 ? 'warning' : 'positive',
          hint: 'Confirmed / requests',
        },
        {
          label: 'Pending actions',
          value: pendingBookings.length,
          rawValue: pendingBookings.length,
          tone: pendingBookings.length > 0 ? 'warning' : 'neutral',
          hint: pendingBookings.length ? 'Follow up to unlock revenue' : 'All mentees progressing',
        },
        {
          label: 'Average lead time',
          value: avgLeadTime ? `${avgLeadTime} days` : '—',
          rawValue: avgLeadTime,
          tone: 'neutral',
          hint: 'Request to session',
        },
      ],
      insight:
        pendingBookings.length > 0
          ? 'A cluster of mentees are waiting for follow-ups. Send pre-work nudges or reminders to keep the pipeline flowing.'
          : 'Pipeline is healthy—consider adding a cohort intake to capture the momentum.',
    },
    {
      id: 'revenue',
      title: 'Revenue momentum',
      headline: formatCurrency(stats?.monthlyRevenue ?? finance?.summary?.paidInvoices, currencySymbol),
      summary: 'Mentorship revenue across packages, cohorts, and async reviews.',
      trend:
        stats?.monthlyRevenueChange !== undefined
          ? {
              value: stats.monthlyRevenueChange,
              label: 'vs. last month',
              direction: stats.monthlyRevenueChange > 0 ? 'up' : stats.monthlyRevenueChange < 0 ? 'down' : 'flat',
            }
          : undefined,
      stats: [
        {
          label: 'Projected',
          value: formatCurrency(projected, currencySymbol),
          rawValue: projected,
          tone: 'neutral',
          hint: 'Forecast for this month',
        },
        {
          label: 'Variance',
          value: formatCurrency(variance, currencySymbol),
          rawValue: variance,
          tone: variance !== null && variance < 0 ? 'warning' : 'positive',
          hint: variance !== null && variance < 0 ? 'Below target' : 'On track',
        },
        {
          label: 'Upsell share',
          value: upsellShare !== null ? `${upsellShare}%` : '—',
          rawValue: upsellShare,
          tone: upsellShare !== null && upsellShare >= 30 ? 'positive' : 'neutral',
          hint: 'Revenue from cohorts & async',
        },
      ],
      insight:
        variance !== null && variance < 0
          ? 'Revenue is lagging target—experiment with premium tiers or bundle async reviews into flagship packages.'
          : 'Momentum is strong—lock in recurring retainers and publish recent wins to maintain pace.',
    },
    {
      id: 'demand',
      title: 'Mentor demand',
      headline: `${viewsMetric?.value ?? 0} Explorer profile views`,
      summary: explorerPlacement?.position ? `Placement: ${explorerPlacement.position}` : 'Explorer placement updates as you publish availability.',
      trend:
        viewsMetric?.delta !== undefined
          ? {
              value: viewsMetric.delta,
              label: 'vs. previous period',
              direction: viewsMetric.delta > 0 ? 'up' : viewsMetric.delta < 0 ? 'down' : 'flat',
            }
          : undefined,
      stats: [
        {
          label: 'Placement score',
          value: explorerPlacement?.score ?? '—',
          rawValue: explorerPlacement?.score ?? null,
          tone: explorerPlacement?.score && explorerPlacement.score >= 90 ? 'positive' : 'neutral',
          hint: explorerPlacement?.position ?? 'Build testimonials to climb rankings',
        },
        {
          label: 'Active mentees',
          value: stats?.activeMentees ?? 0,
          rawValue: stats?.activeMentees ?? 0,
          tone: stats?.activeMentees >= 10 ? 'positive' : 'neutral',
          hint: 'Live relationships',
        },
        {
          label: 'Waitlist',
          value: pendingBookings.length,
          rawValue: pendingBookings.length,
          tone: pendingBookings.length > 0 ? 'warning' : 'neutral',
          hint: 'Mentors queued for onboarding',
        },
      ],
      insight:
        pendingBookings.length > 0
          ? 'Demand is outpacing supply—extend availability or launch a cohort to capture waitlisted mentees.'
          : 'Keep demand high by sharing spotlight content and scheduling micro-testimonials.',
    },
  ];

  const timeline = buildEngagementTimeline(dashboard);
  const recommendations = deriveRecommendations({ overlays, bookings, explorerPlacement, stats, finance });

  return { overlays, recommendations, timeline };
}

function normaliseDashboardPayload(payload, { fallback = false, lookbackDays = 30 } = {}) {
  const snapshot = payload?.dashboard ?? payload ?? {};
  const profilePayload = payload?.profile ?? snapshot?.profile ?? null;
  const metadataPayload = payload?.metadata ?? snapshot?.metadata ?? null;
  const hasLiveData = snapshot && Object.keys(snapshot).length > 0;

  const dashboard = fallback && !hasLiveData ? cloneValue(DEFAULT_DASHBOARD) : snapshot;
  const profile = profilePayload ?? (fallback && !hasLiveData ? cloneValue(DEFAULT_PROFILE) : null);
  const metadata = metadataPayload ?? (fallback ? { generatedAt: new Date().toISOString(), source: 'fallback' } : null);

  const analytics = deriveAnalyticsSnapshot(dashboard, { lookbackDays });

  return { dashboard, profile, metadata, analytics };
}
export default function MentorDashboardPage() {
  const [state, dispatch] = useReducer(mentorDashboardReducer, INITIAL_STATE);
  const fallbackUsedRef = useRef(false);

  const menuSections = useMemo(() => MENU_GROUPS, []);
  const dashboardSnapshot = state.dashboard;
  const profileSnapshot = state.profile ?? (state.dashboard?.profile ?? null);

  const applySnapshot = useCallback(
    (payload, { fallback = false, lookbackDays } = {}) => {
      const normalised = normaliseDashboardPayload(payload, { fallback, lookbackDays });
      dispatch({ type: 'snapshot/apply', payload: normalised });
      if (fallback) {
        dispatch({ type: 'fallback/applied' });
      }
    },
    [dispatch],
  );

  const refreshSnapshot = useCallback(
    async ({ lookback } = {}) => {
      const lookbackDays = lookback ?? state.lookbackDays;
      dispatch({ type: 'loading/start' });
      try {
        const data = await fetchMentorDashboard({ lookbackDays });
        applySnapshot(data, { lookbackDays });
        dispatch({ type: 'loading/success' });
      } catch (error) {
        const normalised = normaliseError(error);
        dispatch({ type: 'loading/error', error: normalised });
        if (!fallbackUsedRef.current) {
          fallbackUsedRef.current = true;
          applySnapshot(
            {
              dashboard: cloneValue(DEFAULT_DASHBOARD),
              profile: cloneValue(DEFAULT_PROFILE),
              metadata: { generatedAt: new Date().toISOString(), source: 'fallback' },
            },
            { fallback: true, lookbackDays },
          );
        }
      }
    },
    [applySnapshot, state.lookbackDays],
  );

  useEffect(() => {
    refreshSnapshot();
  }, [refreshSnapshot]);

  const mutationOptions = useMemo(
    () => ({
      dispatch,
      refresh: () => fetchMentorDashboard({ lookbackDays: state.lookbackDays }),
      onHydrate: (payload) => applySnapshot(payload, { lookbackDays: state.lookbackDays }),
    }),
    [dispatch, applySnapshot, state.lookbackDays],
  );

  const runMutation = useDashboardEntityMutation(mutationOptions);

  const runEntityMutation = useCallback(
    (key, operation, options) => runMutation(key, operation, options),
    [runMutation],
  );

  const handleSaveAvailability = useCallback(
    (slots) => runEntityMutation('availability', () => saveMentorAvailability(slots)),
    [runEntityMutation],
  );

  const handleSavePackages = useCallback(
    (packages) => runEntityMutation('packages', () => saveMentorPackages(packages)),
    [runEntityMutation],
  );

  const handleSaveProfile = useCallback(
    (payload) => runEntityMutation('profile', () => submitMentorProfile(payload)),
    [runEntityMutation],
  );

  const handleCreateBooking = useCallback(
    (payload) => runEntityMutation('bookings', () => createMentorBooking(payload)),
    [runEntityMutation],
  );

  const handleUpdateBooking = useCallback(
    (bookingId, payload) => runEntityMutation('bookings', () => updateMentorBooking(bookingId, payload)),
    [runEntityMutation],
  );

  const handleDeleteBooking = useCallback(
    (bookingId) => runEntityMutation('bookings', () => deleteMentorBooking(bookingId)),
    [runEntityMutation],
  );

  const handleCreateClient = useCallback(
    (payload) => runEntityMutation('clients', () => createMentorClient(payload)),
    [runEntityMutation],
  );

  const handleUpdateClient = useCallback(
    (clientId, payload) => runEntityMutation('clients', () => updateMentorClient(clientId, payload)),
    [runEntityMutation],
  );

  const handleDeleteClient = useCallback(
    (clientId) => runEntityMutation('clients', () => deleteMentorClient(clientId)),
    [runEntityMutation],
  );

  const handleCreateEvent = useCallback(
    (payload) => runEntityMutation('calendar', () => createMentorEvent(payload)),
    [runEntityMutation],
  );

  const handleUpdateEvent = useCallback(
    (eventId, payload) => runEntityMutation('calendar', () => updateMentorEvent(eventId, payload)),
    [runEntityMutation],
  );

  const handleDeleteEvent = useCallback(
    (eventId) => runEntityMutation('calendar', () => deleteMentorEvent(eventId)),
    [runEntityMutation],
  );

  const handleCreateSupportTicket = useCallback(
    (payload) => runEntityMutation('support', () => createMentorSupportTicket(payload)),
    [runEntityMutation],
  );

  const handleUpdateSupportTicket = useCallback(
    (ticketId, payload) => runEntityMutation('support', () => updateMentorSupportTicket(ticketId, payload)),
    [runEntityMutation],
  );

  const handleDeleteSupportTicket = useCallback(
    (ticketId) => runEntityMutation('support', () => deleteMentorSupportTicket(ticketId)),
    [runEntityMutation],
  );

  const handleCreateMessage = useCallback(
    (payload) => runEntityMutation('messages', () => createMentorMessage(payload)),
    [runEntityMutation],
  );

  const handleUpdateMessage = useCallback(
    (messageId, payload) => runEntityMutation('messages', () => updateMentorMessage(messageId, payload)),
    [runEntityMutation],
  );

  const handleDeleteMessage = useCallback(
    (messageId) => runEntityMutation('messages', () => deleteMentorMessage(messageId)),
    [runEntityMutation],
  );

  const handleUpdateVerificationStatus = useCallback(
    (payload) => runEntityMutation('verification', () => updateMentorVerificationStatus(payload)),
    [runEntityMutation],
  );

  const handleCreateVerificationDocument = useCallback(
    (payload) => runEntityMutation('verification', () => createMentorVerificationDocument(payload)),
    [runEntityMutation],
  );

  const handleUpdateVerificationDocument = useCallback(
    (documentId, payload) => runEntityMutation('verification', () => updateMentorVerificationDocument(documentId, payload)),
    [runEntityMutation],
  );

  const handleDeleteVerificationDocument = useCallback(
    (documentId) => runEntityMutation('verification', () => deleteMentorVerificationDocument(documentId)),
    [runEntityMutation],
  );

  const handleCreateWalletTransaction = useCallback(
    (payload) => runEntityMutation('wallet', () => createMentorWalletTransaction(payload)),
    [runEntityMutation],
  );

  const handleUpdateWalletTransaction = useCallback(
    (transactionId, payload) => runEntityMutation('wallet', () => updateMentorWalletTransaction(transactionId, payload)),
    [runEntityMutation],
  );

  const handleDeleteWalletTransaction = useCallback(
    (transactionId) => runEntityMutation('wallet', () => deleteMentorWalletTransaction(transactionId)),
    [runEntityMutation],
  );

  const handleCreateInvoice = useCallback(
    (payload) => runEntityMutation('finance', () => createMentorInvoice(payload)),
    [runEntityMutation],
  );

  const handleUpdateInvoice = useCallback(
    (invoiceId, payload) => runEntityMutation('finance', () => updateMentorInvoice(invoiceId, payload)),
    [runEntityMutation],
  );

  const handleDeleteInvoice = useCallback(
    (invoiceId) => runEntityMutation('finance', () => deleteMentorInvoice(invoiceId)),
    [runEntityMutation],
  );

  const handleCreatePayout = useCallback(
    (payload) => runEntityMutation('finance', () => createMentorPayout(payload)),
    [runEntityMutation],
  );

  const handleUpdatePayout = useCallback(
    (payoutId, payload) => runEntityMutation('finance', () => updateMentorPayout(payoutId, payload)),
    [runEntityMutation],
  );

  const handleDeletePayout = useCallback(
    (payoutId) => runEntityMutation('finance', () => deleteMentorPayout(payoutId)),
    [runEntityMutation],
  );

  const handleCreateHubUpdate = useCallback(
    (payload) => runEntityMutation('hub', () => createMentorHubUpdate(payload)),
    [runEntityMutation],
  );

  const handleUpdateHubUpdate = useCallback(
    (updateId, payload) => runEntityMutation('hub', () => updateMentorHubUpdate(updateId, payload)),
    [runEntityMutation],
  );

  const handleDeleteHubUpdate = useCallback(
    (updateId) => runEntityMutation('hub', () => deleteMentorHubUpdate(updateId)),
    [runEntityMutation],
  );

  const handleCreateHubAction = useCallback(
    (payload) => runEntityMutation('hub', () => createMentorHubAction(payload)),
    [runEntityMutation],
  );

  const handleUpdateHubAction = useCallback(
    (actionId, payload) => runEntityMutation('hub', () => updateMentorHubAction(actionId, payload)),
    [runEntityMutation],
  );

  const handleDeleteHubAction = useCallback(
    (actionId) => runEntityMutation('hub', () => deleteMentorHubAction(actionId)),
    [runEntityMutation],
  );

  const handleCreateHubResource = useCallback(
    (payload) => runEntityMutation('hub', () => createMentorHubResource(payload)),
    [runEntityMutation],
  );

  const handleUpdateHubResource = useCallback(
    (resourceId, payload) => runEntityMutation('hub', () => updateMentorHubResource(resourceId, payload)),
    [runEntityMutation],
  );

  const handleDeleteHubResource = useCallback(
    (resourceId) => runEntityMutation('hub', () => deleteMentorHubResource(resourceId)),
    [runEntityMutation],
  );

  const handleSaveHubSpotlight = useCallback(
    (payload) => runEntityMutation('hub', () => updateMentorHubSpotlight(payload)),
    [runEntityMutation],
  );

  const handleCreateCreationItem = useCallback(
    (payload) => runEntityMutation('creation', () => createMentorCreationItem(payload)),
    [runEntityMutation],
  );

  const handleUpdateCreationItem = useCallback(
    (itemId, payload) => runEntityMutation('creation', () => updateMentorCreationItem(itemId, payload)),
    [runEntityMutation],
  );

  const handleDeleteCreationItem = useCallback(
    (itemId) => runEntityMutation('creation', () => deleteMentorCreationItem(itemId)),
    [runEntityMutation],
  );

  const handlePublishCreationItem = useCallback(
    (itemId) => runEntityMutation('creation', () => publishMentorCreationItem(itemId)),
    [runEntityMutation],
  );

  const handleCreateMetricWidget = useCallback(
    (payload) => runEntityMutation('metrics', () => createMentorMetricWidget(payload)),
    [runEntityMutation],
  );

  const handleUpdateMetricWidget = useCallback(
    (widgetId, payload) => runEntityMutation('metrics', () => updateMentorMetricWidget(widgetId, payload)),
    [runEntityMutation],
  );

  const handleDeleteMetricWidget = useCallback(
    (widgetId) => runEntityMutation('metrics', () => deleteMentorMetricWidget(widgetId)),
    [runEntityMutation],
  );

  const handleGenerateMetricsReport = useCallback(
    () => runEntityMutation('metrics', () => generateMentorMetricsReport()),
    [runEntityMutation],
  );

  const handleSaveSettings = useCallback(
    (payload) => runEntityMutation('settings', () => updateMentorSettings(payload)),
    [runEntityMutation],
  );

  const handleSavePreferences = useCallback(
    (payload) => runEntityMutation('preferences', () => updateMentorSystemPreferences(payload)),
    [runEntityMutation],
  );

  const handleRotateApiKey = useCallback(
    () => runEntityMutation('preferences', () => rotateMentorApiKey()),
    [runEntityMutation],
  );

  const handleCreateOrder = useCallback(
    (payload) => runEntityMutation('orders', () => createMentorOrder(payload)),
    [runEntityMutation],
  );

  const handleUpdateOrder = useCallback(
    (orderId, payload) => runEntityMutation('orders', () => updateMentorOrder(orderId, payload)),
    [runEntityMutation],
  );

  const handleDeleteOrder = useCallback(
    (orderId) => runEntityMutation('orders', () => deleteMentorOrder(orderId)),
    [runEntityMutation],
  );

  const handleCreateAdCampaign = useCallback(
    (payload) => runEntityMutation('ads', () => createMentorAdCampaign(payload)),
    [runEntityMutation],
  );

  const handleUpdateAdCampaign = useCallback(
    (campaignId, payload) => runEntityMutation('ads', () => updateMentorAdCampaign(campaignId, payload)),
    [runEntityMutation],
  );

  const handleDeleteAdCampaign = useCallback(
    (campaignId) => runEntityMutation('ads', () => deleteMentorAdCampaign(campaignId)),
    [runEntityMutation],
  );

  const handleToggleAdCampaign = useCallback(
    (campaignId, payload) => runEntityMutation('ads', () => toggleMentorAdCampaign(campaignId, payload)),
    [runEntityMutation],
  );
  const isSaving = useCallback((key) => state.saving[key]?.status === 'pending', [state.saving]);

  const handleLookbackChange = useCallback(
    (value) => {
      dispatch({ type: 'lookback/set', value });
      refreshSnapshot({ lookback: value });
    },
    [refreshSnapshot],
  );

  const handleRecommendationAction = useCallback(
    (action) => {
      if (!action) {
        return;
      }
      if (action.type === 'section' && action.value) {
        dispatch({ type: 'section/set', section: action.value });
      }
      if (action.type === 'link' && action.href && typeof window !== 'undefined') {
        window.open(action.href, '_blank', 'noopener');
      }
    },
    [],
  );

  const handleMenuSelect = useCallback((itemId) => dispatch({ type: 'section/set', section: itemId }), []);

  const renderSection = () => {
    const snapshot = dashboardSnapshot ?? {};
    const activeSection = state.activeSection;

    if (activeSection === 'home-profile') {
      return <HomeProfileSection profile={profileSnapshot ?? DEFAULT_PROFILE} onSave={handleSaveProfile} saving={isSaving('profile')} />;
    }

    if (activeSection === 'home-overview') {
      return (
        <HomeOverviewSection
          stats={snapshot.stats}
          conversion={snapshot.conversion}
          bookings={snapshot.bookings}
          explorerPlacement={snapshot.explorerPlacement}
          feedback={snapshot.feedback}
          finance={snapshot.finance}
          onRequestNewBooking={() => dispatch({ type: 'section/set', section: 'mentorship' })}
        />
      );
    }

    if (activeSection === 'finance') {
      return (
        <FinanceManagementSection
          finance={snapshot.finance}
          onCreateInvoice={handleCreateInvoice}
          onUpdateInvoice={handleUpdateInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onCreatePayout={handleCreatePayout}
          onUpdatePayout={handleUpdatePayout}
          onDeletePayout={handleDeletePayout}
          invoiceSaving={isSaving('finance')}
          payoutSaving={isSaving('finance')}
        />
      );
    }

    if (activeSection === 'mentorship') {
      return (
        <MentorshipManagementSection
          bookings={snapshot.bookings ?? []}
          availability={snapshot.availability ?? []}
          packages={snapshot.packages ?? []}
          segments={snapshot.segments ?? []}
          onCreateBooking={handleCreateBooking}
          onUpdateBooking={handleUpdateBooking}
          onDeleteBooking={handleDeleteBooking}
          onSaveAvailability={handleSaveAvailability}
          availabilitySaving={isSaving('availability')}
          onSavePackages={handleSavePackages}
          packagesSaving={isSaving('packages')}
          bookingSaving={isSaving('bookings')}
        />
      );
    }

    if (activeSection === 'clients') {
      return (
        <MentorshipClientsSection
          clients={snapshot.clients ?? []}
          summary={snapshot.clientSummary}
          onCreateClient={handleCreateClient}
          onUpdateClient={handleUpdateClient}
          onDeleteClient={handleDeleteClient}
          saving={isSaving('clients')}
        />
      );
    }

    if (activeSection === 'calendar') {
      return (
        <MentorCalendarSection
          events={snapshot.calendar?.events ?? []}
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          saving={isSaving('calendar')}
        />
      );
    }

    if (activeSection === 'support') {
      return (
        <MentorSupportSection
          tickets={snapshot.support?.tickets ?? []}
          summary={snapshot.support?.summary}
          onCreateTicket={handleCreateSupportTicket}
          onUpdateTicket={handleUpdateSupportTicket}
          onDeleteTicket={handleDeleteSupportTicket}
          saving={isSaving('support')}
        />
      );
    }

    if (activeSection === 'inbox') {
      return (
        <MentorInboxSection
          messages={snapshot.inbox?.messages ?? []}
          summary={snapshot.inbox?.summary}
          onCreateMessage={handleCreateMessage}
          onUpdateMessage={handleUpdateMessage}
          onDeleteMessage={handleDeleteMessage}
          saving={isSaving('messages')}
        />
      );
    }

    if (activeSection === 'verification') {
      return (
        <MentorVerificationSection
          verification={snapshot.verification}
          onUpdateStatus={handleUpdateVerificationStatus}
          onCreateDocument={handleCreateVerificationDocument}
          onUpdateDocument={handleUpdateVerificationDocument}
          onDeleteDocument={handleDeleteVerificationDocument}
          saving={isSaving('verification')}
        />
      );
    }

    if (activeSection === 'wallet') {
      return (
        <MentorWalletSection
          wallet={snapshot.wallet}
          onCreateTransaction={handleCreateWalletTransaction}
          onUpdateTransaction={handleUpdateWalletTransaction}
          onDeleteTransaction={handleDeleteWalletTransaction}
          saving={isSaving('wallet')}
        />
      );
    }

    if (activeSection === 'hub') {
      return (
        <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading hub workspace…</div>}>
          <LazyMentorHubSection
            hub={snapshot.hub ?? {}}
            saving={isSaving('hub')}
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
        </Suspense>
      );
    }

    if (activeSection === 'creation-studio') {
      return (
        <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading creation studio…</div>}>
          <LazyMentorCreationStudioWizardSection
            items={snapshot.creationStudio?.items ?? []}
            saving={isSaving('creation')}
            onCreateItem={handleCreateCreationItem}
            onUpdateItem={handleUpdateCreationItem}
            onDeleteItem={handleDeleteCreationItem}
            onPublishItem={handlePublishCreationItem}
          />
        </Suspense>
      );
    }

    if (activeSection === 'metrics') {
      return (
        <MentorMetricsSection
          metrics={snapshot.metricsDashboard?.widgets ?? []}
          cohorts={snapshot.metricsDashboard?.cohorts ?? []}
          reporting={snapshot.metricsDashboard?.reporting}
          saving={isSaving('metrics')}
          onCreateWidget={handleCreateMetricWidget}
          onUpdateWidget={handleUpdateMetricWidget}
          onDeleteWidget={handleDeleteMetricWidget}
          onGenerateReport={handleGenerateMetricsReport}
        />
      );
    }

    if (activeSection === 'settings') {
      return <MentorSettingsSection settings={snapshot.settings} saving={isSaving('settings')} onSaveSettings={handleSaveSettings} />;
    }

    if (activeSection === 'system-preferences') {
      return (
        <MentorSystemPreferencesSection
          preferences={snapshot.systemPreferences}
          saving={isSaving('preferences')}
          onSavePreferences={handleSavePreferences}
          onRotateApiKey={handleRotateApiKey}
        />
      );
    }

    if (activeSection === 'orders') {
      return (
        <MentorOrdersSection
          orders={snapshot.orders?.list ?? []}
          summary={snapshot.orders?.summary}
          saving={isSaving('orders')}
          onCreateOrder={handleCreateOrder}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
        />
      );
    }

    if (activeSection === 'ads') {
      return (
        <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading campaigns…</div>}>
          <LazyMentorAdsSection
            campaigns={snapshot.ads?.campaigns ?? []}
            insights={snapshot.ads?.insights}
            saving={isSaving('ads')}
            onCreateCampaign={handleCreateAdCampaign}
            onUpdateCampaign={handleUpdateAdCampaign}
            onDeleteCampaign={handleDeleteAdCampaign}
            onToggleCampaign={handleToggleAdCampaign}
          />
        </Suspense>
      );
    }

    return null;
  };

  const syncMetadata = state.metadata;

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="mentor"
        title="Mentor mission control"
        subtitle="Manage bookings, packages, and Explorer visibility"
        description="A dedicated workspace for mentors to orchestrate sessions, automate rituals, and grow mentorship revenue."
        menuSections={menuSections}
        profile={profileSnapshot ?? DEFAULT_PROFILE}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem={state.activeSection}
        onMenuItemSelect={handleMenuSelect}
      >
        <div className="mx-auto w-full max-w-6xl space-y-10 px-6 py-10">
          {state.error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
              {state.error.message}
            </div>
          ) : null}

          {syncMetadata?.generatedAt ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-blue-100 bg-blue-50/80 px-5 py-3 text-sm text-slate-600">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Synced data</span>
                <span>
                  Snapshot refreshed {formatRelativeTime(syncMetadata.generatedAt) ?? 'recently'}
                  {syncMetadata.source === 'fallback' ? ' • Offline fallback active' : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => refreshSnapshot()}
                disabled={state.loading}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.loading ? 'Refreshing…' : 'Refresh now'}
              </button>
            </div>
          ) : null}

          <AnalyticsOverlayPanel
            overlays={state.analytics.overlays}
            lookbackDays={state.lookbackDays}
            onLookbackChange={handleLookbackChange}
            loading={state.loading}
          />

          <AiCoachPanel recommendations={state.analytics.recommendations} onAction={handleRecommendationAction} />

          <EngagementTimeline items={state.analytics.timeline} />

          {renderSection()}
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
