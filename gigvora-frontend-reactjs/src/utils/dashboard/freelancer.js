import { trackDashboardEvent } from '../analytics.js';

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolveFreelancerIdFromSession(session) {
  if (!session) {
    return null;
  }
  const candidates = [
    session.freelancerId,
    session.profileId,
    session.primaryProfileId,
    session.userId,
    session.id,
  ];
  for (const candidate of candidates) {
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

export function buildFreelancerInsightCards({ overview, operationsMetrics, lifecycleStats }) {
  const earnings = overview?.metrics?.earnings ?? overview?.financials?.earnings ?? {};
  const pipeline = overview?.pipeline ?? overview?.workstreams ?? {};
  const relationship = overview?.relationship ?? {};

  const mtd = toNumber(earnings.monthToDate ?? earnings.mtd ?? earnings.current ?? 0, 0);
  const forecast = toNumber(earnings.forecast ?? earnings.quarterForecast ?? earnings.next ?? mtd, mtd);
  const activeDeals = toNumber(pipeline.active ?? pipeline.inFlight ?? lifecycleStats?.active ?? 0, 0);
  const wonThisMonth = toNumber(pipeline.closedThisMonth ?? lifecycleStats?.closedThisMonth ?? 0, 0);
  const retentionScore = toNumber(relationship.retentionScore ?? relationship.healthScore ?? 0, 0);
  const satisfaction = toNumber(relationship.nps ?? relationship.satisfaction ?? relationship.trustScore ?? 0, 0);
  const automationCoverage = toNumber(operationsMetrics?.automationCoverage ?? 0, 0);

  const cards = [
    {
      id: 'earnings',
      label: 'Earnings MTD',
      value: mtd,
      format: 'currency',
      secondary: forecast,
      hint: forecast ? `Forecast ${forecast.toLocaleString()}` : null,
    },
    {
      id: 'pipeline',
      label: 'Active pipeline',
      value: activeDeals,
      format: 'number',
      secondary: wonThisMonth,
      hint: wonThisMonth ? `${wonThisMonth} won this month` : null,
    },
    {
      id: 'relationship',
      label: 'Relationship health',
      value: retentionScore || satisfaction,
      format: 'percent',
      secondary: automationCoverage,
      hint: automationCoverage ? `${automationCoverage}% automated` : null,
    },
  ];

  trackDashboardEvent('freelancer.insights.rendered', {
    cards: cards.map((card) => ({ id: card.id, value: card.value, secondary: card.secondary })),
  });

  return cards;
}

export function computeFreelancerHealthBanner({ overview, operationsMetrics }) {
  const relationship = overview?.relationship ?? {};
  const escalations = operationsMetrics?.escalations ?? 0;
  const compliance = operationsMetrics?.complianceScore ?? 0;
  const outstanding = toNumber(relationship.advocacyInProgress ?? overview?.support?.openCases, 0);
  const retentionScore = toNumber(relationship.retentionScore ?? relationship.healthScore, 0);

  let tone = 'info';
  let message = 'All systems stable. Keep momentum by reviewing your highlights and schedule.';

  if (escalations > 0 || outstanding > 3) {
    tone = 'warning';
    message = 'Escalations require attention. Resolve outstanding support cases to protect client trust.';
  }
  if (retentionScore && retentionScore < 60) {
    tone = 'alert';
    message = 'Relationship health is trending low. Reach out to clients with upcoming deliverables today.';
  }
  if (compliance < 50) {
    tone = 'critical';
    message = 'Compliance coverage is below comfort thresholds. Complete verification tasks immediately.';
  }

  return {
    tone,
    message,
    metrics: {
      escalations,
      outstanding,
      retentionScore,
      compliance,
    },
  };
}

export default {
  resolveFreelancerIdFromSession,
  buildFreelancerInsightCards,
  computeFreelancerHealthBanner,
};
