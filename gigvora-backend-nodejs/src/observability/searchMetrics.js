import { Counter, Histogram } from 'prom-client';
import { getMetricsRegistry, registerMetric, updateSearchMetricsStatus } from './metricsRegistry.js';
import logger from '../utils/logger.js';

const registry = getMetricsRegistry();

const searchRequestsTotal = new Counter({
  name: 'gigvora_search_requests_total',
  help: 'Total number of search requests processed.',
  registers: [registry],
  labelNames: ['surface', 'category', 'status'],
});

const searchProcessingTimeMs = new Histogram({
  name: 'gigvora_search_processing_time_ms',
  help: 'Processing time for search executions in milliseconds.',
  registers: [registry],
  labelNames: ['surface', 'category'],
  buckets: [5, 10, 20, 50, 100, 250, 500, 1000, 2000, 5000],
});

const searchResultsObserved = new Counter({
  name: 'gigvora_search_results_total',
  help: 'Total results returned by search requests.',
  registers: [registry],
  labelNames: ['surface', 'category'],
});

const searchQueueEnqueuedTotal = new Counter({
  name: 'gigvora_search_queue_enqueued_total',
  help: 'Total search subscription jobs enqueued.',
  registers: [registry],
  labelNames: ['surface', 'category'],
});

registerMetric(searchRequestsTotal);
registerMetric(searchProcessingTimeMs);
registerMetric(searchResultsObserved);
registerMetric(searchQueueEnqueuedTotal);

function normaliseLabel(value, fallback = 'general') {
  if (!value) {
    return fallback;
  }
  return String(value).trim().toLowerCase() || fallback;
}

export function recordSearchRequest({ surface = 'api', category = 'mixed', status = 'success', durationMs = null, resultCount = null } = {}) {
  const safeSurface = normaliseLabel(surface);
  const safeCategory = normaliseLabel(category);
  const safeStatus = normaliseLabel(status, 'success');

  try {
    searchRequestsTotal.inc({ surface: safeSurface, category: safeCategory, status: safeStatus });
    if (durationMs != null) {
      const numeric = Number(durationMs);
      if (Number.isFinite(numeric) && numeric >= 0) {
        searchProcessingTimeMs.observe({ surface: safeSurface, category: safeCategory }, numeric);
      }
    }
    if (resultCount != null) {
      const numericResults = Number(resultCount);
      if (Number.isFinite(numericResults) && numericResults >= 0) {
        searchResultsObserved.inc({ surface: safeSurface, category: safeCategory }, numericResults);
      }
    }
    updateSearchMetricsStatus({
      surface: safeSurface,
      category: safeCategory,
      durationMs,
      resultCount,
    });
  } catch (error) {
    logger.error?.({ err: error }, 'Failed to record search request metrics');
  }
}

export function recordSearchExecution({ surface = 'subscription_digest', category = 'mixed', durationMs = null, resultCount = null, userId = null } = {}) {
  recordSearchRequest({ surface, category, status: 'executed', durationMs, resultCount });
  if (userId != null) {
    logger.debug?.({ surface, category, userId, durationMs, resultCount }, 'Recorded search execution telemetry');
  }
}

export function recordSearchEnqueue({ surface = 'subscription_manual', category = 'mixed', userId = null } = {}) {
  const safeSurface = normaliseLabel(surface);
  const safeCategory = normaliseLabel(category);
  try {
    searchQueueEnqueuedTotal.inc({ surface: safeSurface, category: safeCategory });
    logger.debug?.({ surface: safeSurface, category: safeCategory, userId }, 'Enqueued search subscription job');
    updateSearchMetricsStatus({ surface: safeSurface, category: safeCategory, queueEnqueued: true });
  } catch (error) {
    logger.error?.({ err: error }, 'Failed to record search enqueue metric');
  }
}

export function resetSearchMetrics() {
  searchRequestsTotal.reset();
  searchProcessingTimeMs.reset();
  searchResultsObserved.reset();
  searchQueueEnqueuedTotal.reset();
}

export default {
  recordSearchRequest,
  recordSearchExecution,
  recordSearchEnqueue,
  resetSearchMetrics,
};
