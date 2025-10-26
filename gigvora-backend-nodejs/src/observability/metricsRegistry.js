import { Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

import { getRateLimitSnapshot } from './rateLimitMetrics.js';
import { getPerimeterSnapshot } from './perimeterMetrics.js';
import { getWebApplicationFirewallSnapshot } from '../security/webApplicationFirewall.js';
import { getDatabasePoolSnapshot } from '../services/databaseLifecycleService.js';
import { collectWorkerTelemetry } from '../lifecycle/workerManager.js';
import logger from '../utils/logger.js';

const METRICS_ENDPOINT = '/health/metrics';
const METRICS_PREFIX = 'gigvora_';
const STALE_THRESHOLD_SECONDS = 180;

const registry = new Registry();

let initialized = false;

function ensureInitialized() {
  if (initialized) {
    return;
  }
  collectDefaultMetrics({ register: registry, prefix: METRICS_PREFIX });
  initialized = true;
}

export function getMetricsRegistry() {
  ensureInitialized();
  return registry;
}

export function registerMetric(metric) {
  ensureInitialized();
  return metric;
}

export function updateSearchMetricsStatus({
  surface = null,
  category = null,
  durationMs = null,
  resultCount = null,
  queueEnqueued = false,
} = {}) {
  metricsStatusCache.search.totalRequests += 1;
  metricsStatusCache.search.lastSurface = surface ?? metricsStatusCache.search.lastSurface;
  metricsStatusCache.search.lastCategory = category ?? metricsStatusCache.search.lastCategory;
  metricsStatusCache.search.lastDurationMs = durationMs ?? metricsStatusCache.search.lastDurationMs;
  metricsStatusCache.search.lastResultCount = resultCount ?? metricsStatusCache.search.lastResultCount;
  if (queueEnqueued) {
    metricsStatusCache.search.queueEnqueued += 1;
  }
  metricsStatusCache.search.lastUpdatedAt = new Date().toISOString();
}

function createCounter(name, help, options = {}) {
  return new Counter({ name: `${METRICS_PREFIX}${name}`, help, registers: [registry], ...options });
}

function createGauge(name, help, options = {}) {
  return new Gauge({ name: `${METRICS_PREFIX}${name}`, help, registers: [registry], ...options });
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toTimestamp(value) {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const metricsScrapesTotal = createCounter('metrics_scrapes_total', 'Total number of monitoring scrapes served.');
const metricsLastScrapeTimestamp = createGauge(
  'metrics_last_scrape_timestamp',
  'Unix timestamp of the most recent metrics scrape.',
);
const metricsSecondsSinceLastScrape = createGauge(
  'metrics_seconds_since_last_scrape',
  'Seconds elapsed since the metrics endpoint was last scraped.',
);

const rateLimitHitsTotal = createCounter('rate_limit_hits_total', 'Total requests observed by the rate limiter.');
const rateLimitAllowedTotal = createCounter('rate_limit_allowed_total', 'Total requests allowed by the rate limiter.');
const rateLimitBlockedTotal = createCounter('rate_limit_blocked_total', 'Total requests blocked by the rate limiter.');
const rateLimitWindowBlockedRatio = createGauge(
  'rate_limit_window_blocked_ratio',
  'Ratio of requests blocked in the current rate-limit window.',
);
const rateLimitWindowActiveKeys = createGauge(
  'rate_limit_window_active_keys',
  'Active consumers tracked in the current rate-limit window.',
);
const rateLimitWindowRequestsPerSecond = createGauge(
  'rate_limit_window_rps',
  'Requests per second processed during the current rate-limit window.',
);

const wafEvaluatedRequestsTotal = createCounter('waf_evaluated_requests_total', 'Requests inspected by the WAF.');
const wafBlockedRequestsTotal = createCounter('waf_blocked_requests_total', 'Requests blocked by the WAF.');
const wafAutoBlockEventsTotal = createCounter('waf_auto_block_events_total', 'Auto-block escalations triggered by the WAF.');
const wafActiveAutoBlocks = createGauge(
  'waf_active_auto_blocks',
  'Number of IPs currently quarantined by the WAF auto-blocker.',
);
const wafLastBlockedTimestamp = createGauge(
  'waf_last_block_timestamp',
  'Unix timestamp of the last WAF block event.',
);

const perimeterBlockedTotal = createCounter('perimeter_blocked_requests_total', 'Total requests blocked at the API perimeter.');
const perimeterActiveOriginsGauge = createGauge(
  'perimeter_active_blocked_origins',
  'Distinct origins blocked at the API perimeter.',
);
const perimeterLastBlockedTimestamp = createGauge(
  'perimeter_last_block_timestamp',
  'Unix timestamp of the last perimeter block event.',
);

const databasePoolSizeGauge = createGauge('database_pool_size', 'Current size of the Sequelize connection pool.');
const databasePoolAvailableGauge = createGauge('database_pool_available', 'Idle connections available in the pool.');
const databasePoolBorrowedGauge = createGauge('database_pool_borrowed', 'Connections currently borrowed from the pool.');
const databasePoolPendingGauge = createGauge('database_pool_pending', 'Pending connection requests awaiting fulfilment.');
const databasePoolLastEventTimestamp = createGauge(
  'database_pool_last_event_timestamp',
  'Unix timestamp of the last observed database pool event.',
);

const workerStatusGauge = createGauge(
  'worker_status',
  'Operational status indicator for background workers (1=healthy, 0=stopped, -1=error).',
  { labelNames: ['worker'] },
);
const workerQueuePendingGauge = createGauge(
  'worker_queue_pending',
  'Pending jobs reported by worker telemetry.',
  { labelNames: ['worker'] },
);
const workerQueueStuckGauge = createGauge(
  'worker_queue_stuck',
  'Jobs locked beyond the stale threshold for worker telemetry.',
  { labelNames: ['worker'] },
);
const workerQueueFailedGauge = createGauge(
  'worker_queue_failed',
  'Failed jobs reported by worker telemetry.',
  { labelNames: ['worker'] },
);
const workerLastSampleTimestamp = createGauge(
  'worker_last_sample_timestamp',
  'Unix timestamp of the latest worker telemetry sample.',
  { labelNames: ['worker'] },
);
const workerIntervalGauge = createGauge(
  'worker_interval_ms',
  'Configured polling interval for worker telemetry.',
  { labelNames: ['worker'] },
);

let previousRateLimitTotals = { hits: 0, allowed: 0, blocked: 0 };
let previousWafTotals = { evaluated: 0, blocked: 0, autoBlocks: 0 };
let previousPerimeterTotal = 0;

const metricsStatusCache = {
  exporter: 'prometheus',
  endpoint: METRICS_ENDPOINT,
  lastScrapeAt: null,
  secondsSinceLastScrape: null,
  scrapes: 0,
  stale: true,
  staleThresholdSeconds: STALE_THRESHOLD_SECONDS,
  rateLimit: {
    hits: 0,
    allowed: 0,
    blocked: 0,
    blockedRatio: 0,
    activeKeys: 0,
    requestsPerSecond: 0,
  },
  waf: {
    evaluatedRequests: 0,
    blockedRequests: 0,
    autoBlockEvents: 0,
    activeAutoBlocks: 0,
    lastBlockedAt: null,
  },
  perimeter: {
    totalBlocked: 0,
    activeOrigins: 0,
    lastBlockedAt: null,
  },
  search: {
    totalRequests: 0,
    lastSurface: null,
    lastCategory: null,
    lastDurationMs: null,
    lastResultCount: null,
    queueEnqueued: 0,
    lastUpdatedAt: null,
  },
  database: {
    vendor: null,
    size: 0,
    available: 0,
    borrowed: 0,
    pending: 0,
    lastEvent: null,
    updatedAt: null,
  },
  workers: [],
};

function incrementCounter(counter, currentValue, previousValue) {
  const delta = currentValue - previousValue;
  if (delta > 0) {
    counter.inc(delta);
    return currentValue;
  }
  if (delta < 0) {
    // Counter reset detected—increment by current value to avoid negative deltas.
    counter.inc(currentValue);
    return currentValue;
  }
  return previousValue;
}

const WORKER_STATUS_VALUES = {
  healthy: 1,
  stopped: 0,
  error: -1,
};

function deriveWorkerStatus(metrics = {}) {
  if (metrics && metrics.error) {
    return 'error';
  }
  if (metrics && metrics.isRunning === false) {
    return 'stopped';
  }
  return 'healthy';
}

function normaliseWorkerTimestamp(snapshot) {
  return (
    toTimestamp(snapshot?.lastSampleAt) ||
    toTimestamp(snapshot?.metrics?.generatedAt) ||
    toTimestamp(snapshot?.metrics?.lastRunAt) ||
    null
  );
}

async function refreshMetricSnapshots({ updateCounters = false } = {}) {
  ensureInitialized();

  const rateLimitSnapshot = getRateLimitSnapshot();
  const lifetime = rateLimitSnapshot?.lifetime ?? {};
  const hits = toNumber(lifetime.hits);
  const allowed = toNumber(lifetime.allowed);
  const blocked = toNumber(lifetime.blocked);
  const activeKeys = toNumber(rateLimitSnapshot?.currentWindow?.activeKeys);
  const blockedRatio = toNumber(rateLimitSnapshot?.currentWindow?.blockedRatio);
  const requestsPerSecond = toNumber(rateLimitSnapshot?.currentWindow?.requestsPerSecond);

  if (updateCounters) {
    previousRateLimitTotals = {
      hits: incrementCounter(rateLimitHitsTotal, hits, previousRateLimitTotals.hits),
      allowed: incrementCounter(rateLimitAllowedTotal, allowed, previousRateLimitTotals.allowed),
      blocked: incrementCounter(rateLimitBlockedTotal, blocked, previousRateLimitTotals.blocked),
    };
  }

  rateLimitWindowBlockedRatio.set(blockedRatio);
  rateLimitWindowActiveKeys.set(activeKeys);
  rateLimitWindowRequestsPerSecond.set(requestsPerSecond);
  metricsStatusCache.rateLimit = {
    hits,
    allowed,
    blocked,
    blockedRatio,
    activeKeys,
    requestsPerSecond,
  };

  const wafSnapshot = getWebApplicationFirewallSnapshot() ?? {};
  const evaluatedRequests = toNumber(wafSnapshot.evaluatedRequests);
  const blockedRequests = toNumber(wafSnapshot.blockedRequests);
  const autoBlockEvents = toNumber(wafSnapshot.autoBlock?.totalTriggered);
  const activeAutoBlocks = Array.isArray(wafSnapshot.autoBlock?.active)
    ? wafSnapshot.autoBlock.active.length
    : 0;
  const lastWafBlockTimestamp = toTimestamp(wafSnapshot.lastBlockedAt);

  if (updateCounters) {
    previousWafTotals = {
      evaluated: incrementCounter(wafEvaluatedRequestsTotal, evaluatedRequests, previousWafTotals.evaluated),
      blocked: incrementCounter(wafBlockedRequestsTotal, blockedRequests, previousWafTotals.blocked),
      autoBlocks: incrementCounter(wafAutoBlockEventsTotal, autoBlockEvents, previousWafTotals.autoBlocks),
    };
  }

  wafActiveAutoBlocks.set(activeAutoBlocks);
  if (lastWafBlockTimestamp) {
    wafLastBlockedTimestamp.set(lastWafBlockTimestamp / 1000);
  } else {
    wafLastBlockedTimestamp.set(0);
  }

  metricsStatusCache.waf = {
    evaluatedRequests,
    blockedRequests,
    autoBlockEvents,
    activeAutoBlocks,
    lastBlockedAt: lastWafBlockTimestamp ? new Date(lastWafBlockTimestamp).toISOString() : null,
  };

  const perimeterSnapshot = getPerimeterSnapshot() ?? {};
  const totalBlocked = toNumber(perimeterSnapshot.totalBlocked);
  const activeOrigins = Array.isArray(perimeterSnapshot.blockedOrigins)
    ? perimeterSnapshot.blockedOrigins.length
    : 0;
  const lastPerimeterBlockTimestamp = toTimestamp(perimeterSnapshot.lastBlockedAt);

  if (updateCounters) {
    previousPerimeterTotal = incrementCounter(perimeterBlockedTotal, totalBlocked, previousPerimeterTotal);
  }

  perimeterActiveOriginsGauge.set(activeOrigins);
  if (lastPerimeterBlockTimestamp) {
    perimeterLastBlockedTimestamp.set(lastPerimeterBlockTimestamp / 1000);
  } else {
    perimeterLastBlockedTimestamp.set(0);
  }

  metricsStatusCache.perimeter = {
    totalBlocked,
    activeOrigins,
    lastBlockedAt: lastPerimeterBlockTimestamp ? new Date(lastPerimeterBlockTimestamp).toISOString() : null,
  };

  const poolSnapshot = getDatabasePoolSnapshot() ?? {};
  const poolSize = toNumber(poolSnapshot.size);
  const poolAvailable = toNumber(poolSnapshot.available);
  const poolBorrowed = toNumber(poolSnapshot.borrowed);
  const poolPending = toNumber(poolSnapshot.pending);
  const poolUpdatedAt = poolSnapshot.updatedAt ?? null;

  databasePoolSizeGauge.set(poolSize);
  databasePoolAvailableGauge.set(poolAvailable);
  databasePoolBorrowedGauge.set(poolBorrowed);
  databasePoolPendingGauge.set(poolPending);
  if (poolSnapshot.lastEvent) {
    const lastEventTimestamp = toTimestamp(poolSnapshot.updatedAt);
    if (lastEventTimestamp) {
      databasePoolLastEventTimestamp.set(lastEventTimestamp / 1000);
    }
  } else {
    databasePoolLastEventTimestamp.set(0);
  }

  metricsStatusCache.database = {
    vendor: poolSnapshot.vendor ?? null,
    size: poolSize,
    available: poolAvailable,
    borrowed: poolBorrowed,
    pending: poolPending,
    lastEvent: poolSnapshot.lastEvent ?? null,
    updatedAt: poolUpdatedAt,
  };

  let workerSnapshots = [];
  try {
    workerSnapshots = await collectWorkerTelemetry({ forceRefresh: false });
  } catch (error) {
    logger.warn({ err: error }, 'Unable to collect worker telemetry for metrics');
    workerSnapshots = [];
  }

  workerStatusGauge.reset();
  workerQueuePendingGauge.reset();
  workerQueueStuckGauge.reset();
  workerQueueFailedGauge.reset();
  workerLastSampleTimestamp.reset();
  workerIntervalGauge.reset();

  metricsStatusCache.workers = workerSnapshots.map((snapshot) => {
    const metrics = snapshot?.metrics ?? {};
    const status = deriveWorkerStatus(metrics);
    const pending = toNumber(metrics.pending ?? metrics.queueDepth, 0);
    const stuck = toNumber(metrics.stuck ?? metrics.locked ?? 0, 0);
    const failed = toNumber(metrics.failed ?? metrics.errorCount, 0);
    const interval = toNumber(snapshot?.metadata?.intervalMs ?? metrics.intervalMs, 0);
    const sampleTimestamp = normaliseWorkerTimestamp(snapshot);

    workerStatusGauge.set({ worker: snapshot.name }, WORKER_STATUS_VALUES[status] ?? 0);
    workerQueuePendingGauge.set({ worker: snapshot.name }, pending);
    workerQueueStuckGauge.set({ worker: snapshot.name }, stuck);
    workerQueueFailedGauge.set({ worker: snapshot.name }, failed);
    workerIntervalGauge.set({ worker: snapshot.name }, interval);
    workerLastSampleTimestamp.set(
      { worker: snapshot.name },
      sampleTimestamp ? sampleTimestamp / 1000 : 0,
    );

    return {
      name: snapshot.name,
      status,
      pending,
      stuck,
      failed,
      intervalMs: interval,
      lastSampleAt: sampleTimestamp ? new Date(sampleTimestamp).toISOString() : null,
      metrics,
      metadata: snapshot.metadata ?? {},
    };
  });
}

export async function collectMetrics() {
  await refreshMetricSnapshots({ updateCounters: true });

  metricsScrapesTotal.inc();
  metricsStatusCache.scrapes += 1;
  const now = Date.now();
  metricsStatusCache.lastScrapeAt = new Date(now).toISOString();
  metricsStatusCache.secondsSinceLastScrape = 0;
  metricsStatusCache.stale = false;
  metricsLastScrapeTimestamp.set(now / 1000);
  metricsSecondsSinceLastScrape.set(0);

  return registry.metrics();
}

function computeSecondsSince(timestampIso) {
  if (!timestampIso) {
    return null;
  }
  const parsed = Date.parse(timestampIso);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.max(0, Math.floor((Date.now() - parsed) / 1000));
}

export async function getMetricsStatus() {
  await refreshMetricSnapshots({ updateCounters: false });

  const secondsSinceScrape = computeSecondsSince(metricsStatusCache.lastScrapeAt);
  metricsStatusCache.secondsSinceLastScrape = secondsSinceScrape;
  metricsStatusCache.stale = secondsSinceScrape == null ? true : secondsSinceScrape > STALE_THRESHOLD_SECONDS;
  metricsSecondsSinceLastScrape.set(secondsSinceScrape ?? STALE_THRESHOLD_SECONDS + 1);

  return JSON.parse(JSON.stringify(metricsStatusCache));
}

export function getMetricsContentType() {
  ensureInitialized();
  return registry.contentType;
}

export function resetMetricsForTesting() {
  registry.resetMetrics();
  initialized = false;
  previousRateLimitTotals = { hits: 0, allowed: 0, blocked: 0 };
  previousWafTotals = { evaluated: 0, blocked: 0, autoBlocks: 0 };
  previousPerimeterTotal = 0;
  metricsStatusCache.lastScrapeAt = null;
  metricsStatusCache.secondsSinceLastScrape = null;
  metricsStatusCache.scrapes = 0;
  metricsStatusCache.stale = true;
  metricsStatusCache.rateLimit = {
    hits: 0,
    allowed: 0,
    blocked: 0,
    blockedRatio: 0,
    activeKeys: 0,
    requestsPerSecond: 0,
  };
  metricsStatusCache.waf = {
    evaluatedRequests: 0,
    blockedRequests: 0,
    autoBlockEvents: 0,
    activeAutoBlocks: 0,
    lastBlockedAt: null,
  };
  metricsStatusCache.perimeter = {
    totalBlocked: 0,
    activeOrigins: 0,
    lastBlockedAt: null,
  };
  metricsStatusCache.search = {
    totalRequests: 0,
    lastSurface: null,
    lastCategory: null,
    lastDurationMs: null,
    lastResultCount: null,
    queueEnqueued: 0,
    lastUpdatedAt: null,
  };
  metricsStatusCache.database = {
    vendor: null,
    size: 0,
    available: 0,
    borrowed: 0,
    pending: 0,
    lastEvent: null,
    updatedAt: null,
  };
  metricsStatusCache.workers = [];
  workerStatusGauge.reset();
  workerQueuePendingGauge.reset();
  workerQueueStuckGauge.reset();
  workerQueueFailedGauge.reset();
  workerLastSampleTimestamp.reset();
  workerIntervalGauge.reset();
}

export default {
  collectMetrics,
  getMetricsStatus,
  getMetricsContentType,
  resetMetricsForTesting,
};
