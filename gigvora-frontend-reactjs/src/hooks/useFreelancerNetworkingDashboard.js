import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { getFreelancerNetworkingDashboard } from '../services/freelancerNetworking.js';

function formatCurrency(cents, currency = 'USD') {
  if (cents == null) {
    return '—';
  }
  const amount = Number(cents) / 100;
  if (!Number.isFinite(amount)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `${amount}`;
  }
}

function extractCurrency(bookings = []) {
  const firstWithCurrency = bookings.find((booking) => booking.purchaseCurrency) ??
    bookings.find((booking) => booking.session?.currency);
  return firstWithCurrency?.purchaseCurrency ?? firstWithCurrency?.session?.currency ?? 'USD';
}

export default function useFreelancerNetworkingDashboard({
  freelancerId,
  enabled = true,
  lookbackDays = 180,
  limitConnections = 100,
} = {}) {
  const cacheKey = useMemo(() => {
    const safeId = freelancerId ?? 'unknown';
    return `freelancer:networking:${safeId}:${lookbackDays}:${limitConnections}`;
  }, [freelancerId, lookbackDays, limitConnections]);

  const fetcher = useCallback(
    ({ signal } = {}) =>
      getFreelancerNetworkingDashboard(freelancerId, { lookbackDays, limitConnections, signal }),
    [freelancerId, lookbackDays, limitConnections],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    enabled: Boolean(freelancerId) && enabled,
    dependencies: [freelancerId, lookbackDays, limitConnections],
    ttl: 60 * 1000,
  });

  const summaryCards = useMemo(() => {
    if (!state.data) {
      return [];
    }
    const { summary, bookings } = state.data;
    const currency = extractCurrency(bookings);
    return [
      {
        label: 'Sessions booked',
        value: summary?.totalBookings ?? 0,
        hint: `${summary?.upcomingSessions ?? 0} upcoming`,
      },
      {
        label: 'Completed sessions',
        value: summary?.completedSessions ?? 0,
        hint: `${summary?.cancelledSessions ?? 0} cancelled`,
      },
      {
        label: 'Total spend',
        value: formatCurrency(summary?.totalSpendCents ?? 0, currency),
        hint: `${summary?.paidSessions ?? 0} paid registrations`,
      },
      {
        label: 'Payments pending',
        value: summary?.pendingPayment ?? 0,
        hint: 'Awaiting settlement',
      },
    ];
  }, [state.data]);

  const orders = useMemo(() => {
    const list = state.data?.orders?.items ?? [];
    return list.map((order) => ({
      ...order,
      amountFormatted: formatCurrency(order.amountCents, order.currency),
    }));
  }, [state.data?.orders?.items]);

  const adsCampaigns = useMemo(() => {
    const campaigns = state.data?.ads?.campaigns ?? [];
    return campaigns.map((campaign) => ({
      ...campaign,
      budgetFormatted: campaign.budgetCents != null
        ? formatCurrency(campaign.budgetCents, campaign.currencyCode)
        : '—',
      spendFormatted: formatCurrency(campaign.metrics?.spendCents ?? 0, campaign.currencyCode),
    }));
  }, [state.data?.ads?.campaigns]);

  return {
    ...state,
    summaryCards,
    bookings: state.data?.bookings ?? [],
    availableSessions: state.data?.availableSessions ?? [],
    connections: state.data?.connections ?? { total: 0, items: [] },
    metrics: state.data?.metrics ?? {
      conversions: {},
      spend: {},
      topSessions: [],
      weeklyActivity: [],
    },
    orders,
    ordersSummary: state.data?.orders?.summary ?? {
      totals: { total: 0, paid: 0, pending: 0, refunded: 0, cancelled: 0 },
      spend: {
        currency: 'USD',
        totalSpendCents: 0,
        totalSpendFormatted: formatCurrency(0),
        pendingCents: 0,
        pendingFormatted: formatCurrency(0),
        refundedCents: 0,
        refundedFormatted: formatCurrency(0),
      },
    },
    settings: state.data?.settings ?? {},
    preferences: state.data?.preferences ?? {},
    ads: {
      campaigns: adsCampaigns,
      insights: state.data?.ads?.insights ?? {
        totalSpendCents: 0,
        totalSpendFormatted: formatCurrency(0),
        totalImpressions: 0,
        totalClicks: 0,
        averageCpc: 0,
        activeCampaigns: 0,
      },
    },
    config: state.data?.config ?? {
      paymentStatuses: [],
      signupStatuses: [],
      connectionStatuses: [],
      connectionTypes: [],
      orderStatuses: [],
    },
  };
}
