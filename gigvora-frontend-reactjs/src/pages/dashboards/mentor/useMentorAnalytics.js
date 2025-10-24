import { useMemo } from 'react';

function computeConversionRate(conversionMetrics = []) {
  const requests = conversionMetrics.find((metric) => metric.id === 'requests');
  const confirmed = conversionMetrics.find((metric) => metric.id === 'confirmed');

  if (!requests?.value || !confirmed?.value) {
    return null;
  }

  return Math.round((confirmed.value / requests.value) * 100);
}

function computeFillRate(availability = [], bookings = []) {
  const totalCapacity = availability.reduce((total, slot) => total + (slot?.capacity ?? 1), 0);
  if (!totalCapacity) {
    return null;
  }

  const upcomingSessions = bookings.filter((booking) => booking?.status === 'Scheduled').length;
  return Math.min(100, Math.round((upcomingSessions / totalCapacity) * 100));
}

function deriveTopPackage(packages = []) {
  if (!packages.length) {
    return null;
  }

  return [...packages]
    .map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      revenue: (pkg.price ?? 0) * (pkg.bookings ?? pkg.sessions ?? 1),
    }))
    .sort((a, b) => b.revenue - a.revenue)[0];
}

export function useMentorAnalytics(dashboard, metadata) {
  return useMemo(() => {
    if (!dashboard) {
      return {
        analyticsCards: [],
        aiRecommendations: [],
        trendNarrative: null,
      };
    }

    const stats = dashboard.stats ?? {};
    const bookings = dashboard.bookings ?? [];
    const availability = dashboard.availability ?? [];
    const conversion = dashboard.conversion ?? [];

    const fillRate = computeFillRate(availability, bookings);
    const conversionRate = computeConversionRate(conversion);
    const topPackage = deriveTopPackage(dashboard.packages ?? []);
    const demandDelta = conversion.find((metric) => metric.id === 'views')?.delta ?? null;

    const analyticsCards = [
      {
        id: 'session-fill-rate',
        label: 'Session fill rate',
        value: fillRate !== null ? `${fillRate}%` : '—',
        helper: 'Scheduled sessions vs. available capacity',
        delta: stats.upcomingSessionsChange ?? null,
      },
      {
        id: 'request-conversion',
        label: 'Request → confirm',
        value: conversionRate !== null ? `${conversionRate}%` : '—',
        helper: 'Explorer requests converting to confirmed sessions',
        delta: conversion.find((metric) => metric.id === 'confirmed')?.delta ?? null,
      },
      {
        id: 'revenue-forecast',
        label: 'Monthly revenue forecast',
        value: stats.monthlyRevenue ? `£${stats.monthlyRevenue.toLocaleString?.() ?? stats.monthlyRevenue}` : '£0',
        helper: 'Projected payouts for the current month',
        delta: stats.monthlyRevenueChange ?? null,
      },
    ];

    const aiRecommendations = [];
    if (fillRate !== null && fillRate < 70) {
      aiRecommendations.push({
        id: 'fill-rate-boost',
        title: 'Open more availability this week',
        body: 'Upcoming sessions occupy less than 70% of capacity. Add office hours or async review slots to capture demand.',
        targetSection: 'availability',
      });
    }

    if (conversionRate !== null && conversionRate < 55) {
      aiRecommendations.push({
        id: 'conversion-coaching',
        title: 'Refresh Explorer pitch',
        body: 'Booking confirmations trail requests. Update highlight reel messaging or add testimonial clips to increase trust.',
        targetSection: 'hub',
      });
    }

    if (topPackage && (topPackage.revenue ?? 0) > 0) {
      aiRecommendations.push({
        id: 'package-promotion',
        title: `Promote ${topPackage.name}`,
        body: 'Your highest-earning package is outperforming others. Launch an Explorer spotlight or referral note to amplify sales.',
        targetSection: 'ads',
      });
    }

    if (demandDelta !== null && demandDelta < 0) {
      aiRecommendations.push({
        id: 'demand-recovery',
        title: 'Re-engage past mentees',
        body: 'Explorer views dipped this period. Send a nurture campaign or publish a new resource to reignite demand.',
        targetSection: 'support',
      });
    }

    if (!aiRecommendations.length) {
      aiRecommendations.push({
        id: 'steady-performance',
        title: 'Momentum looks strong',
        body: 'All core metrics are trending up. Maintain current rituals and capture testimonials while sentiment is high.',
        targetSection: 'mentorship',
      });
    }

    const trendNarrative = metadata?.trendNarrative ?? null;

    return {
      analyticsCards,
      aiRecommendations,
      trendNarrative,
    };
  }, [dashboard, metadata]);
}

export default useMentorAnalytics;
