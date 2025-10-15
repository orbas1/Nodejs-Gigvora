import os from 'node:os';
import { getReadinessReport, getLivenessReport } from './healthService.js';
import { getVisibleAnnouncements } from './runtimeMaintenanceService.js';
import { getDatabasePoolSnapshot } from './databaseLifecycleService.js';
import { getRateLimitSnapshot } from '../observability/rateLimitMetrics.js';

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

const SEVERITY_RANKING = {
  security: 4,
  incident: 3,
  maintenance: 2,
  info: 1,
};

function buildMaintenanceSnapshot(raw = {}) {
  const announcements = Array.isArray(raw.announcements) ? raw.announcements : [];
  const counts = announcements.reduce(
    (accumulator, announcement) => {
      const status = `${announcement.status ?? ''}`.toLowerCase();
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

  const highest = announcements.reduce(
    (current, announcement) => {
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
    },
    null,
  );

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
  const [readiness, liveness, maintenance] = await Promise.all([
    getReadinessReport(),
    Promise.resolve(getLivenessReport()),
    getVisibleAnnouncements({
      audience: 'operations',
      channel: 'api',
      includeResolved: true,
      windowMinutes: 24 * 60,
      limit: 50,
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    environment: getEnvironmentSnapshot(),
    readiness,
    liveness,
    rateLimit: getRateLimitSnapshot(),
    databasePool: getDatabasePoolSnapshot(),
    maintenance: buildMaintenanceSnapshot(maintenance),
  };
}

export default {
  getRuntimeOperationalSnapshot,
};

