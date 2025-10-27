import apiClient from './apiClient.js';

function ensureArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value;
  }
  return [...fallback];
}

function buildSystemSummary(system = {}) {
  const general = system.general ?? {};
  const notifications = system.notifications ?? {};
  const maintenance = system.maintenance ?? {};
  return {
    general: {
      appName: general.appName ?? 'Gigvora',
      incidentContact: general.incidentContact ?? null,
      supportEmail: general.supportEmail ?? null,
      supportPhone: general.supportPhone ?? null,
    },
    notifications: {
      emailProvider: notifications.emailProvider ?? null,
      smsProvider: notifications.smsProvider ?? null,
      emailFromName: notifications.emailFromName ?? null,
      emailFromAddress: notifications.emailFromAddress ?? null,
      incidentWebhookUrl: notifications.incidentWebhookUrl ?? null,
      broadcastChannels: ensureArray(notifications.broadcastChannels),
    },
    maintenance: {
      statusPageUrl: maintenance.statusPageUrl ?? null,
      supportChannel: maintenance.supportChannel ?? null,
      upcomingWindows: ensureArray(maintenance.upcomingWindows),
    },
  };
}

function buildSiteSummary(site = {}) {
  const hero = site.hero ?? {};
  return {
    hero: {
      headline: hero.headline ?? '',
      subheading: hero.subheading ?? '',
      personaChips: ensureArray(hero.personaChips ?? site.heroPersonaChips),
      insightStats: ensureArray(hero.insightStats ?? site.heroInsightStats),
      valuePillars: ensureArray(hero.valuePillars ?? site.heroValuePillars),
      media: hero.media ?? site.heroMedia ?? null,
    },
    announcement: site.announcement ?? { enabled: false },
    operationsSummary: site.operationsSummary ?? {},
  };
}

function buildInsights(insights = {}) {
  return {
    personaChipCount: insights.personaChipCount ?? 0,
    insightStatCount: insights.insightStatCount ?? 0,
    valuePillarCount: insights.valuePillarCount ?? 0,
    scheduledMaintenanceCount: insights.scheduledMaintenanceCount ?? 0,
    broadcastChannels: ensureArray(insights.broadcastChannels),
    runtimeStatus: insights.runtimeStatus ?? 'unknown',
    readinessScore: typeof insights.readinessScore === 'number' ? insights.readinessScore : null,
    operationsScore: typeof insights.operationsScore === 'number' ? insights.operationsScore : 0,
    nextMaintenance: insights.nextMaintenance ?? null,
  };
}

export const FALLBACK_RUNTIME_OPERATIONS_SUMMARY = Object.freeze({
  generatedAt: new Date().toISOString(),
  runtime: {},
  system: buildSystemSummary(),
  site: buildSiteSummary(),
  insights: buildInsights(),
});

export function normaliseRuntimeOperationsSummary(summary = {}) {
  return {
    generatedAt: summary.generatedAt ?? new Date().toISOString(),
    runtime: summary.runtime ?? {},
    system: buildSystemSummary(summary.system),
    site: buildSiteSummary(summary.site),
    insights: buildInsights(summary.insights),
  };
}

export async function fetchRuntimeOperationsSummary(client = apiClient) {
  const response = await client.get('/admin/runtime/operations/summary');
  return normaliseRuntimeOperationsSummary(response.data);
}

export async function updateRuntimeOperationsSettings(patch = {}, client = apiClient) {
  const response = await client.patch('/admin/runtime/operations/settings', patch);
  return {
    ...response.data,
    summary: normaliseRuntimeOperationsSummary(response.data?.summary ?? {}),
  };
}

export default fetchRuntimeOperationsSummary;
