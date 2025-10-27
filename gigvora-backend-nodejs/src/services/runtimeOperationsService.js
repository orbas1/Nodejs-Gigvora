import logger from '../utils/logger.js';
import { getRuntimeOperationalSnapshot } from './runtimeObservabilityService.js';
import { getSystemSettings, updateSystemSettings } from './systemSettingsService.js';
import { getSiteSettings, saveSiteSettings } from './siteManagementService.js';

function isObject(candidate) {
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate);
}

function mergeNested(base, patch) {
  if (!isObject(base)) {
    base = {};
  }
  if (!isObject(patch)) {
    return { ...base };
  }

  const result = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      result[key] = value.map((item) => (isObject(item) ? { ...item } : item));
      return;
    }
    if (value instanceof Date) {
      result[key] = value.toISOString();
      return;
    }
    if (isObject(value)) {
      result[key] = mergeNested(base[key], value);
      return;
    }
    result[key] = value;
  });
  return result;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatMaintenanceWindow(window) {
  if (!window || typeof window !== 'object') {
    return null;
  }
  const startAt = window.startAt ?? window.start_at ?? null;
  const endAt = window.endAt ?? window.end_at ?? null;
  return {
    id: window.id ?? null,
    summary: window.summary ?? null,
    impact: window.impact ?? null,
    startAt,
    endAt,
    timezone: window.timezone ?? 'UTC',
    contact: window.contact ?? window.supportContact ?? null,
  };
}

function computeCoverageInsights(siteSettings, systemSettings, runtimeSnapshot) {
  const personaChips = ensureArray(siteSettings?.heroPersonaChips);
  const insightStats = ensureArray(siteSettings?.heroInsightStats);
  const valuePillars = ensureArray(siteSettings?.heroValuePillars);
  const broadcastChannels = ensureArray(systemSettings?.notifications?.broadcastChannels);
  const upcomingWindows = ensureArray(systemSettings?.maintenance?.upcomingWindows).map(formatMaintenanceWindow).filter(Boolean);
  const runtimeStatus = runtimeSnapshot?.readiness?.status ?? runtimeSnapshot?.liveness?.status ?? 'unknown';
  const readinessScoreCandidate = Number(runtimeSnapshot?.readiness?.score ?? runtimeSnapshot?.readiness?.percentage ?? 0);
  const readinessScore = Number.isFinite(readinessScoreCandidate) ? Math.max(0, Math.min(readinessScoreCandidate, 1)) : 0;

  const personaCoverage = personaChips.length / 8;
  const statCoverage = insightStats.length / 4;
  const pillarCoverage = valuePillars.length / 4;
  const coverageScore = Math.max(0, Math.min((personaCoverage + statCoverage + pillarCoverage) / 3, 1));
  const operationsScore = Math.round(((readinessScore * 0.6 + coverageScore * 0.4) || 0) * 100);

  const nextMaintenance = upcomingWindows
    .map((window) => ({
      ...window,
      startAt: window.startAt,
      parsedStartAt: window.startAt ? Date.parse(window.startAt) : Number.POSITIVE_INFINITY,
    }))
    .filter((window) => Number.isFinite(window.parsedStartAt))
    .sort((a, b) => a.parsedStartAt - b.parsedStartAt)[0] ?? null;

  return {
    personaChipCount: personaChips.length,
    insightStatCount: insightStats.length,
    valuePillarCount: valuePillars.length,
    scheduledMaintenanceCount: upcomingWindows.length,
    broadcastChannels,
    runtimeStatus,
    readinessScore,
    operationsScore,
    nextMaintenance: nextMaintenance
      ? {
          summary: nextMaintenance.summary,
          startAt: nextMaintenance.startAt,
          timezone: nextMaintenance.timezone,
        }
      : null,
  };
}

function buildSiteSummary(siteSettings = {}) {
  return {
    hero: {
      headline: siteSettings.heroHeadline ?? siteSettings.hero?.title ?? '',
      subheading: siteSettings.heroSubheading ?? siteSettings.hero?.subtitle ?? '',
      personaChips: ensureArray(siteSettings.heroPersonaChips),
      insightStats: ensureArray(siteSettings.heroInsightStats),
      valuePillars: ensureArray(siteSettings.heroValuePillars),
      media: siteSettings.heroMedia ?? siteSettings.hero?.media ?? null,
    },
    announcement: siteSettings.announcement ?? {},
    operationsSummary: siteSettings.operationsSummary ?? {},
  };
}

function buildSystemSummary(systemSettings = {}) {
  return {
    general: {
      appName: systemSettings.general?.appName ?? 'Gigvora',
      incidentContact: systemSettings.general?.incidentContact ?? systemSettings.general?.supportEmail ?? null,
      supportEmail: systemSettings.general?.supportEmail ?? null,
      supportPhone: systemSettings.general?.supportPhone ?? null,
    },
    notifications: {
      emailProvider: systemSettings.notifications?.emailProvider ?? null,
      smsProvider: systemSettings.notifications?.smsProvider ?? null,
      emailFromName: systemSettings.notifications?.emailFromName ?? null,
      emailFromAddress: systemSettings.notifications?.emailFromAddress ?? null,
      incidentWebhookUrl: systemSettings.notifications?.incidentWebhookUrl ?? null,
      broadcastChannels: ensureArray(systemSettings.notifications?.broadcastChannels),
    },
    maintenance: {
      statusPageUrl: systemSettings.maintenance?.statusPageUrl ?? null,
      supportChannel: systemSettings.maintenance?.supportChannel ?? systemSettings.general?.incidentContact ?? null,
      upcomingWindows: ensureArray(systemSettings.maintenance?.upcomingWindows).map(formatMaintenanceWindow).filter(Boolean),
    },
  };
}

export async function getRuntimeOperationsSummary() {
  const [runtimeSnapshot, systemSettings, siteSettings] = await Promise.all([
    getRuntimeOperationalSnapshot(),
    getSystemSettings(),
    getSiteSettings(),
  ]);

  const system = buildSystemSummary(systemSettings);
  const site = buildSiteSummary(siteSettings);
  const insights = computeCoverageInsights(siteSettings, systemSettings, runtimeSnapshot);

  return {
    generatedAt: new Date().toISOString(),
    runtime: runtimeSnapshot,
    system,
    site,
    insights,
  };
}

export async function updateRuntimeOperationsSettings(patch = {}, { actor } = {}) {
  const updates = {};
  const updatedKeys = new Set();

  if (isObject(patch.system)) {
    const currentSystem = await getSystemSettings();
    const mergedSystem = mergeNested(currentSystem, patch.system);
    const result = await updateSystemSettings(mergedSystem);
    updates.systemSettings = result;
    Object.keys(patch.system).forEach((key) => updatedKeys.add(`system.${key}`));
  }

  if (isObject(patch.site)) {
    const currentSite = await getSiteSettings();
    const mergedSite = mergeNested(currentSite, patch.site);
    const { settings, updatedAt } = await saveSiteSettings(mergedSite);
    updates.siteSettings = settings;
    updates.siteSettingsUpdatedAt = updatedAt;
    Object.keys(patch.site).forEach((key) => updatedKeys.add(`site.${key}`));
  }

  if (updatedKeys.size > 0) {
    logger.info(
      {
        event: 'runtime.operations.settings_updated',
        actor: actor?.reference ?? 'system',
        updatedKeys: Array.from(updatedKeys),
      },
      'Runtime operations settings updated',
    );
  }

  const summary = await getRuntimeOperationsSummary();

  return {
    summary,
    ...updates,
  };
}

export default {
  getRuntimeOperationsSummary,
  updateRuntimeOperationsSettings,
};
