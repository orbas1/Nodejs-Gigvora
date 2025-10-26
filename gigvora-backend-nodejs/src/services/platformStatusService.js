import {
  PlatformStatusReport,
  PlatformStatusIncident,
  PlatformStatusMaintenance,
  PLATFORM_STATUS_SEVERITIES,
  findActivePlatformStatusReport,
} from '../models/platformStatusModels.js';

function buildDefaultSummary() {
  return {
    id: null,
    severity: 'operational',
    headline: 'All systems operational',
    summary: 'Everything is humming along smoothly.',
    statusPageUrl: null,
    source: null,
    occurredAt: null,
    updatedAt: null,
    services: [],
    incidents: [],
    maintenances: [],
    fingerprint: 'operational',
  };
}

export async function getPlatformStatusSummary({ transaction, includeMaintenance = true, includeIncidents = true } = {}) {
  const report = await findActivePlatformStatusReport({
    includeIncidents,
    includeMaintenances: includeMaintenance,
    transaction,
  });

  if (!report) {
    return buildDefaultSummary();
  }

  const summary = report.toSummary();
  const normalizedSeverity = PLATFORM_STATUS_SEVERITIES.includes(summary.severity)
    ? summary.severity
    : 'operational';

  return {
    ...summary,
    severity: normalizedSeverity,
    incidents: (summary.incidents ?? []).map((incident) =>
      incident instanceof PlatformStatusIncident ? incident.toPublicObject() : incident,
    ),
    maintenances: (summary.maintenances ?? []).map((maintenance) =>
      maintenance instanceof PlatformStatusMaintenance ? maintenance.toPublicObject() : maintenance,
    ),
  };
}

export default {
  getPlatformStatusSummary,
};
