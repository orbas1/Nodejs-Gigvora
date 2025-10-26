import {
  bootstrapOpportunitySearch,
} from '../services/searchIndexService.js';
import {
  startProfileEngagementWorker,
  stopProfileEngagementWorker,
  getProfileEngagementQueueSnapshot,
} from '../services/profileEngagementService.js';
import {
  startNewsAggregationWorker,
  stopNewsAggregationWorker,
  getNewsAggregationStatus,
} from '../services/newsAggregationService.js';
import {
  markDependencyHealthy,
  markDependencyDisabled,
  markDependencyUnavailable,
  markWorkerHealthy,
  markWorkerFailed,
  markWorkerStopped,
} from './runtimeHealth.js';
import {
  getRuntimeConfig,
  onRuntimeConfigChange,
} from '../config/runtimeConfig.js';
import {
  startPlatformSettingsAuditWorker,
  stopPlatformSettingsAuditWorker,
  getPlatformSettingsAuditWorkerStatus,
} from '../services/platformSettingsAuditWorker.js';
import {
  startSearchSubscriptionWorker,
  stopSearchSubscriptionWorker,
  getSearchSubscriptionWorkerStatus,
} from '../services/searchSubscriptionWorker.js';

const workerStops = new Map();
const workerTelemetry = new Map();

let runtimeConfig = getRuntimeConfig();

onRuntimeConfigChange(({ config }) => {
  runtimeConfig = config;
});

function registerWorkerStop(name, stopFn) {
  if (typeof stopFn === 'function') {
    workerStops.set(name, stopFn);
  }
}

function registerWorkerTelemetry(name, { sampler, ttlMs = 15_000, metadata = {} } = {}) {
  if (typeof sampler !== 'function') {
    workerTelemetry.delete(name);
    return;
  }
  workerTelemetry.set(name, {
    sampler,
    ttlMs,
    metadata,
    lastSampleAt: 0,
    lastSample: null,
  });
}

function toLogger(logger) {
  if (!logger) {
    return console;
  }
  return logger;
}

async function startOpportunitySearch(logger) {
  try {
    const result = await bootstrapOpportunitySearch({ logger });
    if (result?.configured) {
      markDependencyHealthy('searchIndex', { configured: true });
    } else {
      markDependencyDisabled('searchIndex', { configured: false, reason: 'environment variables missing' });
    }
  } catch (error) {
    toLogger(logger).error?.({ err: error }, 'Failed to bootstrap opportunity search');
    markDependencyUnavailable('searchIndex', error);
    throw error;
  }
}

async function startProfileEngagement(logger) {
  if (runtimeConfig?.workers?.autoStart === false || runtimeConfig?.workers?.profileEngagement?.enabled === false) {
    markWorkerStopped('profileEngagement', { disabled: true });
    registerWorkerTelemetry('profileEngagement', { sampler: null });
    workerStops.delete('profileEngagement');
    return { started: false, reason: 'disabled' };
  }

  try {
    const intervalMs = runtimeConfig?.workers?.profileEngagement?.intervalMs;
    startProfileEngagementWorker({
      logger,
      intervalMs,
    });
    registerWorkerStop('profileEngagement', async () => {
      await stopProfileEngagementWorker({ logger });
      markWorkerStopped('profileEngagement');
    });
    registerWorkerTelemetry('profileEngagement', {
      sampler: () => getProfileEngagementQueueSnapshot({}),
      ttlMs: 15_000,
      metadata: {
        intervalMs,
      },
    });
    markWorkerHealthy('profileEngagement', { intervalMs });
    return { started: true };
  } catch (error) {
    toLogger(logger).error?.({ err: error }, 'Failed to start profile engagement worker');
    markWorkerFailed('profileEngagement', error);
    registerWorkerTelemetry('profileEngagement', { sampler: null });
    throw error;
  }
}

async function startNewsAggregation(logger) {
  if (runtimeConfig?.workers?.autoStart === false || runtimeConfig?.workers?.newsAggregation?.enabled === false) {
    markWorkerStopped('newsAggregation', { disabled: true });
    registerWorkerTelemetry('newsAggregation', { sampler: null });
    workerStops.delete('newsAggregation');
    return { started: false, reason: 'disabled' };
  }
  try {
    const intervalMs = runtimeConfig?.workers?.newsAggregation?.intervalMs;
    await startNewsAggregationWorker({
      logger,
      intervalMs,
    });
    registerWorkerStop('newsAggregation', async () => {
      await stopNewsAggregationWorker();
      markWorkerStopped('newsAggregation');
    });
    registerWorkerTelemetry('newsAggregation', {
      sampler: async () => getNewsAggregationStatus(),
      ttlMs: 60_000,
      metadata: {
        intervalMs,
      },
    });
    markWorkerHealthy('newsAggregation', { intervalMs });
    return { started: true };
  } catch (error) {
    toLogger(logger).error?.({ err: error }, 'Failed to start news aggregation worker');
    markWorkerFailed('newsAggregation', error);
    registerWorkerTelemetry('newsAggregation', { sampler: null });
    throw error;
  }
}

async function startPlatformSettingsAudit(logger) {
  const config = runtimeConfig?.workers?.platformSettingsAudit ?? {};
  if (runtimeConfig?.workers?.autoStart === false || config.enabled === false) {
    markWorkerStopped('platformSettingsAudit', { disabled: true });
    registerWorkerTelemetry('platformSettingsAudit', { sampler: null });
    workerStops.delete('platformSettingsAudit');
    return { started: false, reason: 'disabled' };
  }

  try {
    const result = await startPlatformSettingsAuditWorker({ logger });
    if (result?.started) {
      registerWorkerStop('platformSettingsAudit', async () => {
        await stopPlatformSettingsAuditWorker();
        markWorkerStopped('platformSettingsAudit');
      });
      registerWorkerTelemetry('platformSettingsAudit', {
        sampler: () => getPlatformSettingsAuditWorkerStatus(),
        ttlMs: 60_000,
        metadata: { intervalMs: result.intervalMs },
      });
      markWorkerHealthy('platformSettingsAudit', { intervalMs: result.intervalMs });
      return { started: true, intervalMs: result.intervalMs };
    }

    registerWorkerTelemetry('platformSettingsAudit', { sampler: null });
    markWorkerStopped('platformSettingsAudit', { disabled: result?.reason === 'disabled' });
    workerStops.delete('platformSettingsAudit');
    return { started: false, reason: result?.reason ?? 'unknown' };
  } catch (error) {
    toLogger(logger).error?.({ err: error }, 'Failed to start platform settings audit worker');
    markWorkerFailed('platformSettingsAudit', error);
    registerWorkerTelemetry('platformSettingsAudit', { sampler: null });
    throw error;
  }
}

async function startSearchSubscriptions(logger) {
  const config = runtimeConfig?.workers?.searchSubscriptions ?? {};
  if (runtimeConfig?.workers?.autoStart === false || config.enabled === false) {
    markWorkerStopped('searchSubscriptions', { disabled: true });
    registerWorkerTelemetry('searchSubscriptions', { sampler: null });
    workerStops.delete('searchSubscriptions');
    return { started: false, reason: 'disabled' };
  }

  try {
    const intervalMs = config.intervalMs ?? 60_000;
    const result = startSearchSubscriptionWorker({ logger, intervalMs });
    registerWorkerStop('searchSubscriptions', async () => {
      await stopSearchSubscriptionWorker({ logger });
      markWorkerStopped('searchSubscriptions');
    });
    registerWorkerTelemetry('searchSubscriptions', {
      sampler: () => getSearchSubscriptionWorkerStatus(),
      ttlMs: 15_000,
      metadata: { intervalMs: result.intervalMs ?? intervalMs },
    });
    markWorkerHealthy('searchSubscriptions', { intervalMs: result.intervalMs ?? intervalMs });
    return { started: true, intervalMs: result.intervalMs ?? intervalMs };
  } catch (error) {
    toLogger(logger).error?.({ err: error }, 'Failed to start search subscription worker');
    markWorkerFailed('searchSubscriptions', error);
    registerWorkerTelemetry('searchSubscriptions', { sampler: null });
    throw error;
  }
}

export async function startBackgroundWorkers({ logger } = {}) {
  const log = toLogger(logger);
  const results = [];

  try {
    await startOpportunitySearch(log);
    const profileResult = await startProfileEngagement(log);
    results.push({ name: 'profileEngagement', ...profileResult });
    const newsResult = await startNewsAggregation(log);
    results.push({ name: 'newsAggregation', ...newsResult });
    const auditResult = await startPlatformSettingsAudit(log);
    results.push({ name: 'platformSettingsAudit', ...auditResult });
    const searchResult = await startSearchSubscriptions(log);
    results.push({ name: 'searchSubscriptions', ...searchResult });
    return results;
  } catch (error) {
    log.error?.({ err: error }, 'Background worker initialisation failed, stopping partially started workers');
    try {
      await stopBackgroundWorkers({ logger: log });
    } catch (stopError) {
      log.error?.({ err: stopError }, 'Failed to stop workers after startup failure');
    }
    throw error;
  }
}

export async function stopBackgroundWorkers({ logger } = {}) {
  const log = toLogger(logger);
  const stopErrors = [];

  for (const [name, stopFn] of workerStops.entries()) {
    try {
      await Promise.resolve(stopFn());
    } catch (error) {
      log.error?.({ err: error, worker: name }, 'Failed to stop background worker');
      stopErrors.push(error);
    }
  }
  workerStops.clear();
  workerTelemetry.clear();

  if (stopErrors.length > 0) {
    const aggregate = new AggregateError(stopErrors, 'One or more background workers failed to stop gracefully');
    throw aggregate;
  }
}

export function getRegisteredWorkers() {
  return Array.from(workerStops.keys());
}

export async function collectWorkerTelemetry({ forceRefresh = false } = {}) {
  const snapshots = [];
  const log = toLogger();
  for (const [name, entry] of workerTelemetry.entries()) {
    let sample = entry.lastSample;
    const now = Date.now();
    if (forceRefresh || now - entry.lastSampleAt > entry.ttlMs) {
      try {
        sample = await entry.sampler();
        entry.lastSample = sample;
        entry.lastSampleAt = now;
      } catch (error) {
        sample = { error: { message: error.message || 'Failed to sample worker telemetry' } };
        entry.lastSample = sample;
        entry.lastSampleAt = now;
        log.warn?.({ err: error, worker: name }, 'Unable to collect worker telemetry');
      }
    }
    snapshots.push({
      name,
      lastSampleAt: entry.lastSampleAt ? new Date(entry.lastSampleAt).toISOString() : null,
      metrics: sample,
      metadata: entry.metadata,
    });
  }
  return snapshots;
}

export function resetWorkerManagerState() {
  workerStops.clear();
  workerTelemetry.clear();
}
