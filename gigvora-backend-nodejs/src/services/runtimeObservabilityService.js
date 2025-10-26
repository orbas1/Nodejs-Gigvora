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
import { collectWorkerTelemetry } from '../lifecycle/workerManager.js';
import { getConnectionRegistry, getSocketServer } from '../realtime/socketServer.js';
import { getRuntimeConfig } from '../config/runtimeConfig.js';

const SEVERITY_RANKING = {
  security: 4,
  incident: 3,
  maintenance: 2,
  info: 1,
};

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function summariseWorkerTelemetry(entry, { highPendingThreshold = 100 } = {}) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const metrics = entry.metrics && typeof entry.metrics === 'object' ? entry.metrics : {};
  const pending = toNumber(metrics.pending ?? metrics.queueDepth ?? metrics.jobsPending, 0);
  const stuck = toNumber(metrics.stuck ?? metrics.locked ?? metrics.jobsLocked, 0);
  const failed = toNumber(metrics.failed ?? metrics.errorCount ?? metrics.jobsFailed, 0);
  const intervalMs = toNumber(entry.metadata?.intervalMs ?? metrics.intervalMs, 0);
  const sampleSource = entry.lastSampleAt || metrics.generatedAt || metrics.lastRunAt || null;

  const alerts = [];
  if (metrics?.error) {
    alerts.push('telemetry-error');
  }
  if (metrics?.isRunning === false) {
    alerts.push('stopped');
  }
  if (stuck > 0) {
    alerts.push('stuck-jobs');
  }
  if (failed > 0) {
    alerts.push('failed-jobs');
  }
  if (pending > highPendingThreshold) {
    alerts.push('high-pending');
  }

  let status = 'healthy';
  if (alerts.includes('telemetry-error')) {
    status = 'error';
  } else if (alerts.includes('stopped')) {
    status = 'stopped';
  } else if (alerts.length > 0) {
    status = 'attention';
  }

  const lastSampleAt = sampleSource ? new Date(sampleSource).toISOString() : null;

  return {
    name: entry.name ?? 'unknown',
    status,
    queue: {
      pending,
      stuck,
      failed,
    },
    intervalMs,
    lastSampleAt,
    attentionReasons: alerts,
    metadata: entry.metadata ?? {},
    metrics,
  };
}

function buildWorkerOverview(telemetry = []) {
  const generatedAt = new Date().toISOString();
  if (!Array.isArray(telemetry) || telemetry.length === 0) {
    return {
      generatedAt,
      totalWorkers: 0,
      healthy: 0,
      attention: 0,
      degraded: 0,
      workers: [],
    };
  }

  const workers = telemetry
    .map((entry) => summariseWorkerTelemetry(entry))
    .filter(Boolean);

  const healthy = workers.filter((worker) => worker.status === 'healthy').length;
  const attention = workers.filter((worker) => worker.status === 'attention').length;
  const degraded = workers.filter((worker) => worker.status === 'error' || worker.status === 'stopped').length;

  return {
    generatedAt,
    totalWorkers: workers.length,
    healthy,
    attention,
    degraded,
    workers,
  };
}

function extractNamespaceStats(io) {
  if (!io) {
    return [];
  }

  const namespaces = [];
  const namespaceMap = io._nsps && typeof io._nsps.forEach === 'function' ? io._nsps : null;
  if (namespaceMap) {
    namespaceMap.forEach((namespace, name) => {
      if (!namespace) {
        return;
      }
      const sockets = namespace.sockets instanceof Map ? namespace.sockets.size : namespace.sockets?.size ?? 0;
      const rooms = namespace.adapter?.rooms instanceof Map ? namespace.adapter.rooms.size : namespace.adapter?.rooms?.size ?? 0;
      namespaces.push({
        name,
        sockets,
        rooms,
      });
    });
  } else if (typeof io.of === 'function') {
    const namespace = io.of('/');
    const sockets = namespace?.sockets instanceof Map ? namespace.sockets.size : namespace?.sockets?.size ?? 0;
    const rooms = namespace?.adapter?.rooms instanceof Map ? namespace.adapter.rooms.size : namespace?.adapter?.rooms?.size ?? 0;
    namespaces.push({ name: '/', sockets, rooms });
  }

  return namespaces.sort((a, b) => a.name.localeCompare(b.name));
}

function buildRealtimeOverview({ registry, io, runtimeConfig }) {
  const generatedAt = new Date().toISOString();
  const summary = typeof registry?.describe === 'function' ? registry.describe() : null;

  const connectedUsers = toNumber(summary?.users, 0);
  const activeSockets = toNumber(summary?.sockets, 0);
  const maxConnectionsRaw =
    summary?.maxConnectionsPerUser ?? runtimeConfig?.realtime?.connection?.maxConnectionsPerUser ?? null;
  const maxConnectionsPerUser =
    maxConnectionsRaw === null || maxConnectionsRaw === undefined
      ? null
      : toNumber(maxConnectionsRaw, null);
  const averageSocketsPerUser = connectedUsers > 0 ? Number((activeSockets / connectedUsers).toFixed(2)) : 0;

  const expectedEnabled = runtimeConfig?.realtime?.enabled !== false;
  const anomalies = [];
  const warnings = [];

  if (expectedEnabled && !io) {
    anomalies.push('server-not-initialised');
  }
  if (!expectedEnabled && (connectedUsers > 0 || activeSockets > 0)) {
    anomalies.push('connections-while-disabled');
  }
  if (maxConnectionsPerUser && connectedUsers > 0) {
    const allowance = maxConnectionsPerUser * connectedUsers;
    if (activeSockets > allowance) {
      anomalies.push('connection-limit-breached');
    } else if (averageSocketsPerUser > maxConnectionsPerUser * 0.8) {
      warnings.push('connection-ratio-approaching-limit');
    }
  }

  return {
    generatedAt,
    enabled: Boolean(io) && expectedEnabled,
    registryActive: Boolean(registry),
    connectedUsers,
    activeSockets,
    averageSocketsPerUser,
    maxConnectionsPerUser,
    namespaces: extractNamespaceStats(io),
    anomalies,
    warnings,
  };
}

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
  const runtimeConfig = getRuntimeConfig();
  const [
    readiness,
    liveness,
    maintenanceAnnouncements,
    settings,
    securityEvents,
    workerTelemetry,
  ] = await Promise.all([
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
    collectWorkerTelemetry({ forceRefresh: true }).catch(() => []),
  ]);

  const realtime = buildRealtimeOverview({
    registry: getConnectionRegistry(),
    io: getSocketServer(),
    runtimeConfig,
  });

  const workers = buildWorkerOverview(workerTelemetry);

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
    realtime,
    workers,
  };
}

export default {
  getRuntimeOperationalSnapshot,
};

export const __testing = {
  summariseWorkerTelemetry,
  buildWorkerOverview,
  buildRealtimeOverview,
  extractNamespaceStats,
};
