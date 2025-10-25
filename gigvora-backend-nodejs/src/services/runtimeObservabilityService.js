import os from 'node:os';

import { getReadinessReport, getLivenessReport } from './healthService.js';
import { getPlatformSettings } from './platformSettingsService.js';
import { getRecentRuntimeSecurityEvents } from './securityAuditService.js';
import { getVisibleAnnouncements } from './runtimeMaintenanceService.js';
import { getDatabasePoolSnapshot } from './databaseLifecycleService.js';
import { getRateLimitSnapshot } from '../observability/rateLimitMetrics.js';
import { getPerimeterSnapshot } from '../observability/perimeterMetrics.js';
import { getWebApplicationFirewallSnapshot } from '../security/webApplicationFirewall.js';
import { getMetricsStatus } from '../observability/metricsRegistry.js';

const SEVERITY_RANKING = {
  security: 4,
  incident: 3,
  maintenance: 2,
  info: 1,
};

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

function buildSecuritySnapshot(events = []) {
  if (!Array.isArray(events)) {
    return {
      events: [],
      level: 'normal',
      latest: null,
      lastIncidentAt: null,
    };
  }

  const hasCritical = events.some((event) => ['error', 'critical'].includes(event.level));
  const latest = events[0] ?? null;
  const lastIncident = events.find((event) => ['error', 'critical'].includes(event.level)) ?? null;

  return {
    events,
    level: hasCritical ? 'attention' : 'normal',
    latest,
    lastIncidentAt: lastIncident?.createdAt ?? null,
  };
}

function buildScheduledMaintenanceSnapshot(settings = {}) {
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

function buildAnnouncementSummary(raw = {}) {
  const announcements = Array.isArray(raw.announcements) ? raw.announcements : [];
  const counts = announcements.reduce(
    (accumulator, announcement) => {
      const status = `${announcement?.status ?? ''}`.toLowerCase();
      accumulator.total += 1;
      if (status === 'active') {
        accumulator.active += 1;
      } else if (status === 'scheduled') {
        accumulator.scheduled += 1;
      } else if (status === 'resolved') {
        accumulator.resolved += 1;
      }
      return accumulator;
    },
    { total: 0, active: 0, scheduled: 0, resolved: 0 },
  );

  const highest = announcements.reduce((current, announcement) => {
    if (!announcement) {
      return current;
    }
    const severity = `${announcement.severity ?? ''}`.toLowerCase();
    const rank = SEVERITY_RANKING[severity] ?? 0;
    if (!current || rank > current.rank) {
      return { rank, severity, announcement };
    }
    if (current.rank === rank) {
      const candidateStart = announcement.startsAt ? Date.parse(announcement.startsAt) : Number.POSITIVE_INFINITY;
      const currentStart = current.announcement?.startsAt
        ? Date.parse(current.announcement.startsAt)
        : Number.POSITIVE_INFINITY;
      if (candidateStart < currentStart) {
        return { rank, severity, announcement };
      }
    }
    return current;
  }, null);

  return {
    generatedAt: raw.generatedAt ?? new Date().toISOString(),
    windowMinutes: raw.windowMinutes ?? 0,
    counts,
    highestSeverity: highest
      ? {
          severity: highest.severity,
          slug: highest.announcement.slug,
          status: highest.announcement.status,
        }
      : null,
    announcements,
  };
}

export async function getRuntimeOperationalSnapshot() {
  const [readiness, liveness, maintenanceAnnouncements, settings, securityEvents] = await Promise.all([
    getReadinessReport(),
    Promise.resolve(getLivenessReport()),
    getVisibleAnnouncements({
      audience: 'operations',
      channel: 'api',
      includeResolved: true,
      windowMinutes: 24 * 60,
      limit: 50,
    }),
    getPlatformSettings(),
    getRecentRuntimeSecurityEvents({ limit: 12 }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    environment: getEnvironmentSnapshot(),
    readiness,
    liveness,
    rateLimit: getRateLimitSnapshot(),
    perimeter: getPerimeterSnapshot(),
    waf: getWebApplicationFirewallSnapshot(),
    databasePool: getDatabasePoolSnapshot(),
    metrics: await getMetricsStatus(),
    maintenance: buildAnnouncementSummary(maintenanceAnnouncements),
    scheduledMaintenance: buildScheduledMaintenanceSnapshot(settings),
    security: buildSecuritySnapshot(securityEvents),
  };
}

export default {
  getRuntimeOperationalSnapshot,
};
