import { Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

import { getRateLimitSnapshot } from './rateLimitMetrics.js';
import { getPerimeterSnapshot } from './perimeterMetrics.js';
import { getWebApplicationFirewallSnapshot } from '../security/webApplicationFirewall.js';
import { getDatabasePoolSnapshot } from '../services/databaseLifecycleService.js';

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

function createCounter(name, help) {
  return new Counter({ name: `${METRICS_PREFIX}${name}`, help, registers: [registry] });
}

function createGauge(name, help) {
  return new Gauge({ name: `${METRICS_PREFIX}${name}`, help, registers: [registry] });
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
  database: {
    vendor: null,
    size: 0,
    available: 0,
    borrowed: 0,
    pending: 0,
    lastEvent: null,
    updatedAt: null,
  },
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

function refreshMetricSnapshots({ updateCounters = false } = {}) {
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
  const poolLastEventTimestamp = toTimestamp(poolSnapshot.updatedAt);

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
}

export async function collectMetrics() {
  refreshMetricSnapshots({ updateCounters: true });

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

export function getMetricsStatus() {
  refreshMetricSnapshots({ updateCounters: false });

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
  metricsStatusCache.database = {
    vendor: null,
    size: 0,
    available: 0,
    borrowed: 0,
    pending: 0,
    lastEvent: null,
    updatedAt: null,
  };
}

export default {
  collectMetrics,
  getMetricsStatus,
  getMetricsContentType,
  resetMetricsForTesting,
};
