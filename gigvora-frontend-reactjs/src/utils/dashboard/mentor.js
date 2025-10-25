function toNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return null;
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);
  } catch (error) {
    return `£${Math.round(value)}`;
  }
}

export function buildMentorAnalyticsOverlay({ dashboard, metadata } = {}) {
  const stats = dashboard?.stats ?? {};
  const conversion = Array.isArray(dashboard?.conversion) ? dashboard.conversion : [];
  const financeSummary = dashboard?.finance?.summary ?? {};
  const clientSummary = dashboard?.clientSummary ?? {};
  const availability = Array.isArray(dashboard?.availability) ? dashboard.availability : [];
  const bookings = Array.isArray(dashboard?.bookings) ? dashboard.bookings : [];

  const lookbackDays = toNumber(metadata?.lookbackDays);

  const totalSlotCapacity = availability.reduce((total, slot) => total + Number(slot?.capacity ?? 0), 0);
  const upcomingSessions = Number(stats.upcomingSessions ?? 0);
  const utilisationValue = totalSlotCapacity > 0 ? Math.round((upcomingSessions / totalSlotCapacity) * 100) : null;

  const requestsEntry = conversion.find((item) => item?.id === 'requests');
  const confirmedEntry = conversion.find((item) => item?.id === 'confirmed');
  const viewsEntry = conversion.find((item) => item?.id === 'views');
  const requestsCount = toNumber(requestsEntry?.value) ?? 0;
  const confirmedCount = toNumber(confirmedEntry?.value) ?? 0;
  const conversionRate = requestsCount > 0 ? Math.round((confirmedCount / requestsCount) * 100) : null;

  const monthlyTarget = toNumber(financeSummary.monthlyTarget);
  const projectedRevenue = toNumber(financeSummary.projected);
  const revenueProgress = monthlyTarget && monthlyTarget > 0
    ? Math.round((projectedRevenue ?? 0) / monthlyTarget * 100)
    : projectedRevenue != null
      ? Math.round(projectedRevenue)
      : null;
  const revenueVariance = toNumber(financeSummary.variance);

  const totalClients = toNumber(clientSummary.total);
  const flagshipCount = toNumber(clientSummary.flagship) ?? 0;
  const flagshipShare = totalClients && totalClients > 0 ? Math.round((flagshipCount / totalClients) * 100) : null;
  const pipelineValue = toNumber(clientSummary.pipelineValue);
  const waitlistedCount = bookings.filter((booking) => `${booking.status}`.toLowerCase() === 'waitlisted').length;
  const revenueVarianceLabel =
    revenueVariance != null
      ? `${revenueVariance >= 0 ? '+' : '−'}${formatCurrency(Math.abs(revenueVariance)) ?? Math.abs(revenueVariance)} variance`
      : null;

  const cards = [];

  cards.push({
    id: 'utilisation',
    label: 'Schedule utilisation',
    value: utilisationValue,
    displayValue: utilisationValue != null ? `${utilisationValue}%` : '—',
    insight:
      totalSlotCapacity > 0
        ? `Covering ${upcomingSessions} of ${totalSlotCapacity} weekly slots${waitlistedCount ? ` with ${waitlistedCount} waitlisted mentees` : ''}.`
        : 'Publish availability to unlock bookings.',
    tone:
      utilisationValue == null
        ? 'info'
        : utilisationValue >= 90
        ? 'positive'
        : utilisationValue >= 70
        ? 'info'
        : 'warning',
    trend: toNumber(stats.upcomingSessionsChange),
    deltaLabel: lookbackDays ? `vs. last ${lookbackDays}-day window` : null,
  });

  cards.push({
    id: 'conversion',
    label: 'Lead conversion',
    value: conversionRate,
    displayValue: conversionRate != null ? `${conversionRate}%` : '—',
    insight:
      requestsCount > 0
        ? `${confirmedCount} confirmed from ${requestsCount} requests in this window.`
        : 'Refresh offerings to generate new booking requests.',
    tone:
      conversionRate == null
        ? 'info'
        : conversionRate >= 45
        ? 'positive'
        : conversionRate >= 30
        ? 'info'
        : 'warning',
    trend: toNumber(confirmedEntry?.delta),
    deltaLabel:
      viewsEntry?.delta != null
        ? `Views change ${viewsEntry.delta >= 0 ? '+' : ''}${Math.round(Number(viewsEntry.delta))}%`
        : null,
  });

  cards.push({
    id: 'revenue',
    label: 'Revenue vs target',
    value: revenueProgress,
    displayValue:
      revenueProgress != null
        ? `${revenueProgress}%`
        : projectedRevenue != null
        ? formatCurrency(projectedRevenue)
        : '—',
    insight:
      monthlyTarget
        ? `Projected ${formatCurrency(projectedRevenue ?? 0)} vs target ${formatCurrency(monthlyTarget)}.`
        : projectedRevenue != null
        ? `Projected ${formatCurrency(projectedRevenue)} this period.`
        : 'Connect finance targets to compare progress.',
    tone:
      revenueVariance == null
        ? 'info'
        : revenueVariance >= 0
        ? 'positive'
        : revenueVariance >= -500
        ? 'warning'
        : 'negative',
    trend: revenueVariance != null ? Math.round(revenueVariance) : null,
    deltaLabel: revenueVarianceLabel,
  });

  cards.push({
    id: 'flagship',
    label: 'Flagship client mix',
    value: flagshipShare,
    displayValue: flagshipShare != null ? `${flagshipShare}%` : '—',
    insight:
      totalClients && totalClients > 0
        ? `${flagshipCount} flagship of ${totalClients} active clients. Pipeline ${pipelineValue != null ? formatCurrency(pipelineValue) : '—'}.`
        : 'Add active clients to track flagship share and pipeline.',
    tone:
      flagshipShare == null
        ? 'info'
        : flagshipShare >= 40
        ? 'positive'
        : flagshipShare >= 25
        ? 'info'
        : 'warning',
    trend: null,
    deltaLabel: pipelineValue != null ? `Pipeline ${formatCurrency(pipelineValue)}` : null,
  });

  return {
    generatedAt: metadata?.generatedAt ?? null,
    cards,
  };
}

export function generateMentorAiRecommendations({ dashboard, metadata, analyticsOverlay } = {}) {
  const overlay = analyticsOverlay ?? buildMentorAnalyticsOverlay({ dashboard, metadata });
  const cards = Array.isArray(overlay?.cards) ? overlay.cards : [];
  const findCard = (id) => cards.find((card) => card.id === id);

  const utilisationCard = findCard('utilisation');
  const conversionCard = findCard('conversion');
  const revenueCard = findCard('revenue');
  const flagshipCard = findCard('flagship');
  const availability = Array.isArray(dashboard?.availability) ? dashboard.availability : [];
  const packages = Array.isArray(dashboard?.packages) ? dashboard.packages : [];
  const recommendations = [];

  if (utilisationCard?.value != null && utilisationCard.value < 75) {
    const availabilityCount = availability.length;
    recommendations.push({
      id: 'expand-availability',
      title: 'Open additional availability blocks',
      summary: utilisationCard.insight,
      actions: [
        'Add at least one office hour slot this week',
        'Promote waitlisted mentees into confirmed sessions',
      ],
      confidence: utilisationCard.value < 60 ? 'high' : 'medium',
      metricLabel: 'Schedule utilisation',
    });
  }

  if (conversionCard?.value != null && conversionCard.value < 35) {
    const hasPremiumPackage = packages.some((pkg) => Number(pkg?.price ?? 0) > 1000);
    recommendations.push({
      id: 'optimise-conversion',
      title: 'Improve Explorer lead conversion',
      summary: conversionCard.insight,
      actions: [
        'Refresh Explorer positioning copy and testimonials',
        hasPremiumPackage ? 'Bundle premium package with a limited-time follow-up' : 'Introduce a limited-time premium package',
      ],
      confidence: conversionCard.value < 25 ? 'high' : 'medium',
      metricLabel: 'Lead conversion',
    });
  }

  if (revenueCard?.value != null && revenueCard.value < 90) {
    recommendations.push({
      id: 'increase-revenue',
      title: 'Accelerate revenue towards monthly target',
      summary: revenueCard.insight,
      actions: [
        'Send nurture sequence to dormant mentees',
        'Upsell flagship package with a progress audit',
      ],
      confidence: revenueCard.value < 70 ? 'high' : 'medium',
      metricLabel: 'Revenue vs target',
    });
  }

  if (flagshipCard?.value != null && flagshipCard.value < 30) {
    recommendations.push({
      id: 'grow-flagship-mix',
      title: 'Elevate flagship client share',
      summary: flagshipCard.insight,
      actions: [
        'Run outreach to past flagship mentees for renewals',
        'Highlight flagship outcomes in Explorer spotlight',
      ],
      confidence: 'medium',
      metricLabel: 'Flagship client mix',
    });
  }

  if (!recommendations.length && cards.length) {
    recommendations.push({
      id: 'maintain-momentum',
      title: 'Maintain current operating momentum',
      summary: 'Metrics are trending on target. Capture learnings and schedule a retrospective with your mentee cohort.',
      actions: ['Export weekly report for stakeholders', 'Capture highlights for the Explorer spotlight'],
      confidence: 'high',
      metricLabel: 'Mentor analytics',
    });
  }

  return recommendations;
}
