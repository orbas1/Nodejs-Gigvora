import os from 'node:os';
import { getReadinessReport, getLivenessReport } from './healthService.js';
import { getPlatformSettings } from './platformSettingsService.js';
import { getRecentRuntimeSecurityEvents } from './securityAuditService.js';
import { getRateLimitSnapshot } from '../observability/rateLimitMetrics.js';
import { getPerimeterSnapshot } from '../observability/perimeterMetrics.js';

function getEnvironmentSnapshot() {
  const memory = process.memoryUsage();
  const loadAverages = os.loadavg();
  return {
    nodeEnv: process.env.NODE_ENV ?? null,
    releaseId: process.env.APP_RELEASE ?? null,
    region: process.env.APP_REGION ?? null,
    commit: process.env.APP_COMMIT_SHA ?? null,
    version: process.env.APP_VERSION ?? null,
    uptimeSeconds: process.uptime(),
    memory: {
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      loadAverage: Array.isArray(loadAverages) ? loadAverages.slice(0, 3) : [],
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus()?.length ?? null,
    },
  };
}

function buildMaintenanceSnapshot(settings = {}) {
  const maintenance = settings.maintenance ?? {};
  const windows = Array.isArray(maintenance.windows) ? maintenance.windows : [];
  const now = Date.now();
  const active = [];
  const upcoming = [];

  windows.forEach((window) => {
    if (!window) {
      return;
    }
    const start = new Date(window.startAt ?? window.start_at).getTime();
    const end = new Date(window.endAt ?? window.end_at).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return;
    }
    const payload = {
      id: window.id,
      summary: window.summary,
      impact: window.impact ?? 'notice',
      startAt: window.startAt ?? window.start_at,
      endAt: window.endAt ?? window.end_at,
      timezone: window.timezone ?? 'UTC',
      contact: window.contact ?? maintenance.supportContact ?? 'support@gigvora.com',
      publishedAt: window.publishedAt ?? null,
    };
    if (start <= now && end >= now) {
      active.push(payload);
    } else if (start > now) {
      upcoming.push(payload);
    }
  });

  upcoming.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return {
    statusPageUrl: maintenance.statusPageUrl ?? null,
    supportContact: maintenance.supportContact ?? 'support@gigvora.com',
    active,
    upcoming: upcoming.slice(0, 5),
    totalScheduled: windows.length,
  };
}

function buildSecuritySnapshot(events = []) {
  const hasCritical = events.some((event) => ['error', 'critical'].includes(event.level));
  const latest = events[0] ?? null;
  const lastIncident = events.find((event) => ['error', 'critical'].includes(event.level));

  return {
    events,
    level: hasCritical ? 'attention' : 'normal',
    latest,
    lastIncidentAt: lastIncident?.createdAt ?? null,
  };
}

export async function getRuntimeOperationalSnapshot() {
  const [readiness, liveness, settings, securityEvents] = await Promise.all([
    getReadinessReport(),
    Promise.resolve(getLivenessReport()),
    getPlatformSettings(),
    getRecentRuntimeSecurityEvents({ limit: 12 }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    environment: getEnvironmentSnapshot(),
    readiness,
    liveness,
    rateLimit: getRateLimitSnapshot(),
    maintenance: buildMaintenanceSnapshot(settings),
    security: buildSecuritySnapshot(securityEvents),
    perimeter: getPerimeterSnapshot(),
  };
}

export default {
  getRuntimeOperationalSnapshot,
};

