import { getRuntimeOperationalSnapshot } from './runtimeObservabilityService.js';
import { sampleLiveServiceTelemetry } from './liveServiceTelemetryService.js';

function clamp(value, { min = 0, max = 100 } = {}) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function normaliseWindow(window = {}) {
  if (!window || typeof window !== 'object') {
    return null;
  }
  return {
    minutes: Number.isFinite(window.minutes) ? window.minutes : null,
    since: window.since ?? null,
    until: window.until ?? null,
  };
}

function dependencyPenalty(counts = {}) {
  const degraded = Number(counts.degraded ?? 0);
  const errored = Number(counts.error ?? 0);
  const disabled = Number(counts.disabled ?? 0);
  return degraded * 4 + errored * 9 + disabled * 2;
}

function workerPenalty(counts = {}) {
  const degraded = Number(counts.degraded ?? 0);
  const errored = Number(counts.error ?? 0);
  return degraded * 3 + errored * 6;
}

function incidentPenalty(incidentSignals = {}) {
  switch (incidentSignals.severity) {
    case 'critical':
      return 28;
    case 'elevated':
      return 18;
    case 'warning':
      return 9;
    default:
      return 0;
  }
}

function rateLimitPenalty(rateLimit = {}) {
  const blockedRatio = Number(rateLimit.blockedRatio ?? rateLimit.currentWindow?.blockedRatio ?? 0);
  const busiestUtilisation = Number(rateLimit.currentWindow?.busiestKey?.hits ?? 0) /
    Number(rateLimit.config?.max ?? 1);
  let penalty = 0;
  if (blockedRatio > 0.05) {
    penalty += Math.min(20, Math.round(blockedRatio * 100));
  }
  if (busiestUtilisation > 0.9) {
    penalty += 12;
  } else if (busiestUtilisation > 0.8) {
    penalty += 6;
  }
  if (Array.isArray(rateLimit.currentWindow?.approachingLimit) && rateLimit.currentWindow.approachingLimit.length > 3) {
    penalty += 4;
  }
  return penalty;
}

function readinessPenalty(readiness = {}) {
  const status = readiness.status ?? 'ok';
  if (status === 'error') {
    return 24;
  }
  if (status === 'degraded' || status === 'starting') {
    return 12;
  }
  return 0;
}

function computeHealthScore({ readiness, rateLimit, dependencies, workers, incidentSignals }) {
  const base = 100;
  const totalPenalty =
    readinessPenalty(readiness) +
    dependencyPenalty(dependencies?.counts) +
    workerPenalty(workers?.counts) +
    incidentPenalty(incidentSignals) +
    rateLimitPenalty({ ...rateLimit, blockedRatio: rateLimit?.blockedRatio ?? rateLimit?.currentWindow?.blockedRatio });

  const score = clamp(base - totalPenalty, { min: 0, max: 100 });
  let posture = 'stable';
  if (score < 50) {
    posture = 'critical';
  } else if (score < 65) {
    posture = 'alert';
  } else if (score < 80) {
    posture = 'watch';
  }

  return { score, posture };
}

function computeRateLimitInsights(rateLimit = {}) {
  const current = rateLimit.currentWindow ?? {};
  const config = rateLimit.config ?? {};
  const approaching = Array.isArray(current.approachingLimit) ? current.approachingLimit : [];
  const topOffenders = Array.isArray(rateLimit.topConsumers) ? rateLimit.topConsumers.slice(0, 5) : [];

  return {
    windowEndsAt: current.endsAt ?? null,
    requestsPerSecond: current.requestsPerSecond ?? 0,
    blockedRatio: current.blockedRatio ?? 0,
    busiestKey: current.busiestKey ?? null,
    approachingLimit: approaching.map((entry) => ({
      key: entry.key,
      utilisation: entry.utilisation,
      hits: entry.hits,
      lastSeenAt: entry.lastSeenAt,
    })),
    topConsumers: topOffenders,
    maxRequestsPerWindow: config.max ?? null,
  };
}

function computeDatabaseInsights(databasePool = {}) {
  const max = Number(databasePool.max ?? 0);
  const borrowed = Number(databasePool.borrowed ?? 0);
  const pending = Number(databasePool.pending ?? 0);
  const available = Number(databasePool.available ?? 0);
  const saturation = max > 0 ? Number((borrowed / max).toFixed(2)) : null;
  const headroom = max > 0 ? Math.max(0, max - borrowed) : null;

  return {
    vendor: databasePool.vendor ?? null,
    saturation,
    headroom,
    borrowed,
    available,
    pending,
    max,
    updatedAt: databasePool.updatedAt ?? null,
    lastEvent: databasePool.lastEvent ?? null,
  };
}

function summariseDependencies(dependencies = {}) {
  const nodes = Array.isArray(dependencies.nodes) ? dependencies.nodes : [];
  const degraded = nodes.filter((node) => node.status === 'degraded' || node.status === 'error');
  return {
    total: dependencies.total ?? nodes.length,
    counts: dependencies.counts ?? {},
    degraded: degraded.slice(0, 6).map((node) => ({
      name: node.name,
      status: node.status,
      updatedAt: node.updatedAt,
      error: node.error,
    })),
  };
}

function summariseWorkers(workers = {}) {
  const nodes = Array.isArray(workers.nodes) ? workers.nodes : [];
  const degraded = nodes.filter((node) => node.status === 'degraded' || node.status === 'error');
  return {
    total: workers.total ?? nodes.length,
    counts: workers.counts ?? {},
    degraded: degraded.slice(0, 6).map((node) => ({
      name: node.name,
      status: node.status,
      updatedAt: node.updatedAt,
      error: node.error,
    })),
  };
}

function summariseMaintenance(runtime = {}) {
  const maintenance = runtime.maintenance ?? {};
  const scheduled = runtime.scheduledMaintenance ?? {};
  const active = Array.isArray(scheduled.active) ? scheduled.active : [];
  const upcoming = Array.isArray(scheduled.upcoming) ? scheduled.upcoming : [];

  return {
    active,
    upcoming,
    totalAnnouncements: maintenance.counts?.total ?? 0,
    highestSeverity: maintenance.highestSeverity ?? null,
    statusPageUrl: scheduled.statusPageUrl ?? null,
  };
}

function summariseLiveServices(telemetry = {}) {
  const chat = telemetry.chat ?? {};
  const inbox = telemetry.inbox ?? {};
  const timeline = telemetry.timeline ?? {};
  const analytics = telemetry.analytics ?? {};
  const events = telemetry.events ?? {};

  return {
    incidentSignals: telemetry.incidentSignals ?? { severity: 'normal', notes: [] },
    chat: {
      totalMessages: chat.totalMessages ?? 0,
      flaggedRatio: chat.flaggedRatio ?? 0,
      moderationBacklog: chat.moderationBacklog ?? 0,
      busiestChannels: Array.isArray(chat.busiestChannels) ? chat.busiestChannels.slice(0, 5) : [],
    },
    inbox: {
      openCases: inbox.openCases ?? 0,
      breachedSlaCases: inbox.breachedSlaCases ?? 0,
      awaitingFirstResponse: inbox.awaitingFirstResponse ?? 0,
      medianFirstResponseMinutes: inbox.medianFirstResponseMinutes ?? null,
      backlogByPriority: inbox.backlogByPriority ?? {},
    },
    timeline: {
      windowPublished: timeline.windowPublished ?? 0,
      scheduledNextHour: timeline.scheduledNextHour ?? 0,
      overdue: timeline.overdue ?? 0,
      trendingEvents: Array.isArray(timeline.trendingEvents) ? timeline.trendingEvents.slice(0, 5) : [],
    },
    analytics: {
      ingestionLagSeconds: analytics.ingestionLagSeconds ?? null,
      topEvents: Array.isArray(analytics.topEvents) ? analytics.topEvents.slice(0, 5) : [],
    },
    events: {
      liveNow: Array.isArray(events.liveNow) ? events.liveNow.length : 0,
      startingSoon: Array.isArray(events.startingSoon) ? events.startingSoon.length : 0,
      cancellationsLastWindow: events.cancellationsLastWindow ?? 0,
      tasksAtRisk: Array.isArray(events.tasksAtRisk) ? events.tasksAtRisk.slice(0, 5) : [],
    },
    runbooks: Array.isArray(telemetry.runbooks) ? telemetry.runbooks.slice(0, 6) : [],
  };
}

function buildHotspots({
  readiness,
  dependencies,
  workers,
  rateLimit,
  database,
  liveServices,
}) {
  const hotspots = [];
  if (readiness.status !== 'ok') {
    hotspots.push({
      id: 'readiness-status',
      label: 'Core service readiness',
      severity: readiness.status === 'error' ? 'critical' : 'elevated',
      detail: `Runtime health reports ${readiness.status}. Investigate http lifecycle and dependency posture.`,
    });
  }
  if ((dependencies.counts?.error ?? 0) > 0 || (dependencies.counts?.degraded ?? 0) > 1) {
    hotspots.push({
      id: 'dependency-drifts',
      label: 'Dependencies',
      severity: (dependencies.counts?.error ?? 0) > 0 ? 'critical' : 'elevated',
      detail: `${(dependencies.counts?.error ?? 0) + (dependencies.counts?.degraded ?? 0)} dependencies need attention.`,
    });
  }
  if ((workers.counts?.error ?? 0) > 0) {
    hotspots.push({
      id: 'worker-failures',
      label: 'Background workers',
      severity: 'critical',
      detail: `${workers.counts.error} worker processes have failed. Recycle queues or reroute load.`,
    });
  }
  if ((rateLimit.approachingLimit ?? []).length) {
    hotspots.push({
      id: 'rate-limit',
      label: 'Rate-limit ceilings',
      severity: 'watch',
      detail: `${rateLimit.approachingLimit.length} keys are above 80% of the limit. Coordinate with API consumers.`,
    });
  }
  if (Number(database.saturation ?? 0) >= 0.75) {
    hotspots.push({
      id: 'database-saturation',
      label: 'Database pool saturation',
      severity: database.saturation >= 0.9 ? 'critical' : 'alert',
      detail: `Database pool is ${Math.round((database.saturation ?? 0) * 100)}% utilised. Scale read replicas or warm connections.`,
    });
  }
  if (Number(liveServices.chat?.flaggedRatio ?? 0) > 0.15) {
    hotspots.push({
      id: 'moderation-backlog',
      label: 'Moderation backlog',
      severity: 'alert',
      detail: 'Flagged message ratio exceeds 15%. Pull on-call moderators into review queue.',
    });
  }
  if ((liveServices.inbox?.breachedSlaCases ?? 0) > 0) {
    hotspots.push({
      id: 'support-sla',
      label: 'Support SLA breaches',
      severity: 'alert',
      detail: `${liveServices.inbox.breachedSlaCases} cases breached SLA in the current window. Activate incident response.`,
    });
  }
  if ((liveServices.analytics?.ingestionLagSeconds ?? 0) > 300) {
    hotspots.push({
      id: 'analytics-lag',
      label: 'Analytics ingestion',
      severity: 'watch',
      detail: 'Analytics ingestion lag exceeds five minutes. Validate exporters and queues.',
    });
  }
  return hotspots;
}

function buildRecommendations({ hotspots, maintenance, liveServices, rateLimit }) {
  const actions = [];
  if (hotspots.some((item) => item.id === 'database-saturation')) {
    actions.push('Scale read replicas or expand pool capacity; trigger auto-tuning playbook.');
  }
  if (hotspots.some((item) => item.id === 'moderation-backlog')) {
    actions.push('Alert community safety to fast-track flagged queue triage and automation scoring.');
  }
  if (hotspots.some((item) => item.id === 'support-sla')) {
    actions.push('Rebalance support staffing and escalate active breaches to duty manager.');
  }
  if ((maintenance.active ?? []).length === 0 && (maintenance.upcoming ?? []).length) {
    actions.push('Confirm upcoming maintenance windows have stakeholder comms and rollback rehearsals.');
  }
  if ((rateLimit.approachingLimit ?? []).length) {
    actions.push('Engage API consumers exceeding 80% utilisation to prevent automated throttling.');
  }
  if (actions.length === 0) {
    actions.push('Maintain runbook cadence and continue monitoring telemetry pulse.');
  }
  return actions;
}

export async function getPlatformPerformanceWarRoomSnapshot({ windowMinutes } = {}) {
  const [runtime, telemetry] = await Promise.all([
    getRuntimeOperationalSnapshot(),
    sampleLiveServiceTelemetry({ windowMinutes }),
  ]);

  const window = normaliseWindow(telemetry?.window) ?? { minutes: windowMinutes ?? 15, since: null, until: null };
  const liveServices = summariseLiveServices(telemetry);
  const rateLimit = computeRateLimitInsights(runtime.rateLimit ?? {});
  const database = computeDatabaseInsights(runtime.databasePool ?? {});
  const dependencies = summariseDependencies(runtime.readiness?.dependencies ?? {});
  const workers = summariseWorkers(runtime.readiness?.workers ?? {});
  const maintenance = summariseMaintenance(runtime);
  const readiness = runtime.readiness ?? {};

  const { score, posture } = computeHealthScore({
    readiness,
    rateLimit,
    dependencies,
    workers,
    incidentSignals: liveServices.incidentSignals,
  });

  const hotspots = buildHotspots({
    readiness,
    dependencies,
    workers,
    rateLimit,
    database,
    liveServices,
  });
  const recommendations = buildRecommendations({ hotspots, maintenance, liveServices, rateLimit });

  return {
    generatedAt: new Date().toISOString(),
    window,
    healthScore: score,
    posture,
    readiness: {
      status: readiness.status ?? 'unknown',
      http: readiness.http ?? null,
      uptimeSeconds: readiness.uptimeSeconds ?? null,
      dependencies,
      workers,
    },
    rateLimit,
    database,
    environment: runtime.environment ?? {},
    maintenance,
    liveServices,
    focus: {
      hotspots,
      recommendations,
    },
  };
}

export default {
  getPlatformPerformanceWarRoomSnapshot,
};
