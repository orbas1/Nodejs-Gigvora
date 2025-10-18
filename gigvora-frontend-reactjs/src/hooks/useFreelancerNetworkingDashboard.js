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

  return {
    ...state,
    summaryCards,
    bookings: state.data?.bookings ?? [],
    availableSessions: state.data?.availableSessions ?? [],
    connections: state.data?.connections ?? { total: 0, items: [] },
    config: state.data?.config ?? {
      paymentStatuses: [],
      signupStatuses: [],
      connectionStatuses: [],
      connectionTypes: [],
    },
  };
}
