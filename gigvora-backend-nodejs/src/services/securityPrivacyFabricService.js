import { getRecentRuntimeSecurityEvents } from './securityAuditService.js';
import { getComplianceOverview } from './adminComplianceManagementService.js';
import { getGdprSettings } from './gdprSettingsService.js';
import logger from '../utils/logger.js';

function toDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysFromNow(target) {
  const date = toDate(target);
  if (!date) {
    return null;
  }
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

function classifyEventLevel(level) {
  const normalised = `${level ?? ''}`.toLowerCase();
  if (['critical', 'error'].includes(normalised)) {
    return normalised === 'critical' ? 'critical' : 'high';
  }
  if (['warn', 'warning'].includes(normalised)) {
    return 'medium';
  }
  if (normalised === 'notice') {
    return 'low';
  }
  return 'informational';
}

function summariseSecurityEvents(events = []) {
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
  const prepared = events.slice(0, 15).map((event) => {
    const severity = classifyEventLevel(event.level);
    severityCounts[severity] = (severityCounts[severity] ?? 0) + 1;
    return {
      id: event.id ?? event.createdAt ?? `${event.eventType}-${event.createdAt}`,
      eventType: event.eventType ?? 'runtime',
      level: severity,
      message: event.message ?? '',
      createdAt: event.createdAt ?? null,
      metadata: event.metadata ?? null,
      triggeredBy: event.triggeredBy ?? null,
    };
  });
  return { events: prepared, severityCounts };
}

function extractFrameworkSummary(overview) {
  const frameworks = Array.isArray(overview?.frameworks) ? overview.frameworks : [];
  const metrics = overview?.metrics ?? {};
  const active = frameworks.filter((framework) => framework.status === 'active');
  const paused = frameworks.filter((framework) => framework.status === 'paused');
  const expiringSoon = frameworks
    .filter((framework) => daysFromNow(framework.renewalDueAt ?? framework.renewalDueDate) != null)
    .filter((framework) => {
      const days = daysFromNow(framework.renewalDueAt ?? framework.renewalDueDate);
      return typeof days === 'number' && days <= 90;
    })
    .slice(0, 6)
    .map((framework) => ({
      id: framework.id,
      name: framework.name,
      daysUntilRenewal: daysFromNow(framework.renewalDueAt ?? framework.renewalDueDate),
      owner: framework.owner,
      status: framework.status,
    }));

  return {
    total: frameworks.length,
    active: active.length,
    paused: paused.length,
    automationCoverage: metrics.automationCoverage ?? null,
    controlsAutomated: metrics.controlsAutomated ?? null,
    expiringSoon,
  };
}

function extractAuditSummary(overview) {
  const audits = Array.isArray(overview?.audits) ? overview.audits : [];
  const inFlight = audits.filter((audit) => ['scheduled', 'in_progress'].includes(audit.status ?? ''));
  const dueSoon = audits
    .filter((audit) => daysFromNow(audit.startDate ?? audit.startAt) != null)
    .filter((audit) => {
      const days = daysFromNow(audit.startDate ?? audit.startAt);
      return typeof days === 'number' && days <= 60;
    })
    .slice(0, 6)
    .map((audit) => ({
      id: audit.id,
      name: audit.name ?? audit.title ?? 'Audit',
      status: audit.status,
      daysUntilStart: daysFromNow(audit.startDate ?? audit.startAt),
    }));

  return {
    total: audits.length,
    inFlight: inFlight.length,
    dueSoon,
  };
}

function extractObligationSummary(overview) {
  const obligations = Array.isArray(overview?.obligations) ? overview.obligations : [];
  const active = obligations.filter((obligation) => !['complete', 'cancelled'].includes(obligation.status ?? ''));
  const atRisk = active
    .map((obligation) => {
      const daysRemaining = daysFromNow(obligation.dueDate);
      return {
        id: obligation.id,
        title: obligation.title,
        owner: obligation.owner,
        riskRating: obligation.riskRating ?? 'medium',
        status: obligation.status,
        daysRemaining,
        evidenceRequired: obligation.evidenceRequired ?? false,
      };
    })
    .filter((obligation) => obligation.daysRemaining != null && obligation.daysRemaining <= 30)
    .sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999))
    .slice(0, 10);

  const critical = atRisk.filter((obligation) => ['critical', 'high'].includes(`${obligation.riskRating ?? ''}`.toLowerCase()));

  return {
    total: obligations.length,
    active: active.length,
    atRisk,
    highRiskCount: critical.length,
  };
}

function computeFabricScore({ events, obligations, gdprSettings }) {
  let score = 100;
  const severityWeights = { critical: 18, high: 12, medium: 6, low: 2 };
  Object.entries(events.severityCounts).forEach(([severity, count]) => {
    if (severityWeights[severity]) {
      score -= severityWeights[severity] * count;
    }
  });

  score -= obligations.highRiskCount * 5;
  score -= Math.min(15, obligations.atRisk.length * 2);

  const breachRun = toDate(gdprSettings?.breachResponse?.tabletopLastRun);
  if (breachRun) {
    const daysAgo = Math.abs(daysFromNow(breachRun));
    if (Number.isFinite(daysAgo) && daysAgo > 150) {
      score -= 8;
    } else if (Number.isFinite(daysAgo) && daysAgo > 90) {
      score -= 4;
    }
  } else {
    score -= 10;
  }

  const slaDays = Number(gdprSettings?.dataSubjectRequests?.slaDays ?? 30);
  if (!Number.isFinite(slaDays) || slaDays > 45) {
    score -= 5;
  }

  if (gdprSettings?.consentFramework && gdprSettings.consentFramework.cookieBannerEnabled === false) {
    score -= 6;
  }

  return Math.max(0, Math.min(100, score));
}

function derivePosture(score) {
  if (score >= 85) {
    return 'fortified';
  }
  if (score >= 70) {
    return 'steady';
  }
  if (score >= 55) {
    return 'watch';
  }
  return 'at-risk';
}

function buildRecommendations({ events, obligations, gdprSettings }) {
  const recommendations = [];
  if ((events.severityCounts?.critical ?? 0) > 0 || (events.severityCounts?.high ?? 0) > 1) {
    recommendations.push('Review the latest critical and high-severity security events with the incident commander.');
  }
  if (obligations.highRiskCount > 0) {
    recommendations.push('Prioritise evidence collection for high-risk compliance obligations due within 30 days.');
  }
  if (gdprSettings?.breachResponse?.tabletopLastRun && Math.abs(daysFromNow(gdprSettings.breachResponse.tabletopLastRun)) > 150) {
    recommendations.push('Schedule the next privacy breach tabletop exercise and capture learnings in the playbook.');
  }
  if (gdprSettings?.consentFramework?.cookieBannerEnabled === false) {
    recommendations.push('Re-enable the consent banner to maintain privacy transparency across web and mobile.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Maintain monitoring cadence and continue quarterly privacy/compliance steering updates.');
  }
  return recommendations;
}

function buildEscalations({ events, obligations }) {
  const escalations = [];
  if ((events.severityCounts?.critical ?? 0) > 0) {
    escalations.push({
      id: 'security-incident-critical',
      label: 'Critical security events',
      detail: 'Critical perimeter alerts detected. Confirm containment and notify executive incident channel.',
      severity: 'critical',
    });
  }
  if (obligations.highRiskCount > 0) {
    escalations.push({
      id: 'obligations-high-risk',
      label: 'High-risk obligations',
      detail: `${obligations.highRiskCount} high-risk obligations due within 30 days require executive visibility.`,
      severity: 'high',
    });
  }
  if (escalations.length === 0 && obligations.atRisk.length > 0) {
    escalations.push({
      id: 'obligations-at-risk',
      label: 'Upcoming compliance deadlines',
      detail: `${obligations.atRisk.length} obligations are approaching their due dates. Coordinate with control owners.`,
      severity: 'medium',
    });
  }
  return escalations;
}

function summarisePrivacyOffice(settings = {}) {
  const dpo = settings.dpo ?? {};
  const dataSubjectRequests = settings.dataSubjectRequests ?? {};
  const breachResponse = settings.breachResponse ?? {};
  const consent = settings.consentFramework ?? {};

  return {
    dpo: {
      name: dpo.name ?? null,
      email: dpo.email ?? null,
      phone: dpo.phone ?? null,
      officeLocation: dpo.officeLocation ?? null,
      availability: dpo.availability ?? null,
    },
    dataSubjectRequests: {
      contactEmail: dataSubjectRequests.contactEmail ?? null,
      escalationEmail: dataSubjectRequests.escalationEmail ?? null,
      slaDays: dataSubjectRequests.slaDays ?? null,
      intakeChannels: Array.isArray(dataSubjectRequests.intakeChannels)
        ? dataSubjectRequests.intakeChannels
        : [],
      automatedIntake: dataSubjectRequests.automatedIntake ?? null,
      privacyPortalUrl: dataSubjectRequests.privacyPortalUrl ?? null,
    },
    breachResponse: {
      notificationWindowHours: breachResponse.notificationWindowHours ?? null,
      onCallContact: breachResponse.onCallContact ?? null,
      incidentRunbookUrl: breachResponse.incidentRunbookUrl ?? null,
      tabletopLastRun: breachResponse.tabletopLastRun ?? null,
      tooling: Array.isArray(breachResponse.tooling) ? breachResponse.tooling : [],
    },
    consentFramework: {
      marketingOptInDefault: consent.marketingOptInDefault ?? null,
      cookieBannerEnabled: consent.cookieBannerEnabled ?? null,
      cookieRefreshMonths: consent.cookieRefreshMonths ?? null,
      consentLogRetentionDays: consent.consentLogRetentionDays ?? null,
    },
  };
}

export async function getSecurityPrivacyFabricSnapshot({ limit = 12 } = {}) {
  let eventsRaw = [];
  try {
    eventsRaw = await getRecentRuntimeSecurityEvents({ limit });
  } catch (error) {
    logger.error?.({ err: error, limit }, 'Failed to load runtime security events for security fabric');
  }

  let complianceOverview = {};
  try {
    complianceOverview = await getComplianceOverview();
  } catch (error) {
    logger.error?.({ err: error }, 'Failed to load compliance overview for security fabric');
  }

  let gdprSettings = {};
  try {
    gdprSettings = await getGdprSettings();
  } catch (error) {
    logger.error?.({ err: error }, 'Failed to load GDPR settings for security fabric');
  }

  const events = summariseSecurityEvents(eventsRaw);
  const frameworks = extractFrameworkSummary(complianceOverview);
  const audits = extractAuditSummary(complianceOverview);
  const obligations = extractObligationSummary(complianceOverview);
  const privacy = summarisePrivacyOffice(gdprSettings);
  const fabricScore = computeFabricScore({ events, obligations, gdprSettings });
  const posture = derivePosture(fabricScore);
  const recommendations = buildRecommendations({ events, obligations, gdprSettings });
  const escalations = buildEscalations({ events, obligations });

  return {
    generatedAt: new Date().toISOString(),
    fabricScore,
    posture,
    security: events,
    compliance: {
      frameworks,
      audits,
      obligations,
    },
    privacy,
    focus: {
      recommendations,
      escalations,
    },
  };
}

export default {
  getSecurityPrivacyFabricSnapshot,
};
