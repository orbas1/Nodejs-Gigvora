import {
  bootstrapOpportunitySearch,
} from '../services/searchIndexService.js';
import {
  startProfileEngagementWorker,
  stopProfileEngagementWorker,
} from '../services/profileEngagementService.js';
import {
  startNewsAggregationWorker,
  stopNewsAggregationWorker,
} from '../services/newsAggregationService.js';
import {
  markDependencyHealthy,
  markDependencyDisabled,
  markDependencyUnavailable,
  markWorkerHealthy,
  markWorkerFailed,
  markWorkerStopped,
} from './runtimeHealth.js';

const workerStops = new Map();

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
  try {
    startProfileEngagementWorker({ logger });
    workerStops.set('profileEngagement', () => {
      stopProfileEngagementWorker();
      markWorkerStopped('profileEngagement');
    });
    markWorkerHealthy('profileEngagement');
  } catch (error) {
    toLogger(logger).error?.({ err: error }, 'Failed to start profile engagement worker');
    markWorkerFailed('profileEngagement', error);
    throw error;
  }
}

async function startNewsAggregation(logger) {
  try {
    await startNewsAggregationWorker({ logger });
    workerStops.set('newsAggregation', async () => {
      await stopNewsAggregationWorker();
      markWorkerStopped('newsAggregation');
    });
    markWorkerHealthy('newsAggregation');
  } catch (error) {
    toLogger(logger).error?.({ err: error }, 'Failed to start news aggregation worker');
    markWorkerFailed('newsAggregation', error);
    throw error;
  }
}

export async function startBackgroundWorkers({ logger } = {}) {
  const log = toLogger(logger);
  const startSteps = [
    () => startOpportunitySearch(log),
    () => startProfileEngagement(log),
    () => startNewsAggregation(log),
  ];

  for (const step of startSteps) {
    try {
      await step();
    } catch (error) {
      log.warn?.({ err: error }, 'Background worker initialisation failed');
    }
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

  if (stopErrors.length > 0) {
    const aggregate = new AggregateError(stopErrors, 'One or more background workers failed to stop gracefully');
    throw aggregate;
  }
}

export function getRegisteredWorkers() {
  return Array.from(workerStops.keys());
}
