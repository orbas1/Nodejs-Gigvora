import { Op } from 'sequelize';
import { SearchSubscription, User } from '../models/index.js';
import logger from '../utils/logger.js';
import { ApplicationError } from '../utils/errors.js';
import {
  drainSearchSubscriptionJobs,
  enqueueSearchSubscriptionJob,
  getSearchSubscriptionQueueSnapshot,
} from './searchSubscriptionQueue.js';
import { listJobs, listGigs, listProjects, listLaunchpads, listVolunteering, searchOpportunitiesAcrossCategories } from './discoveryService.js';
import { getNextRunTimestamp } from './searchSubscriptionService.js';
import { recordSearchExecution } from '../observability/searchMetrics.js';

const DEFAULT_INTERVAL_MS = 60_000;
const MAX_BATCH_SIZE = 10;

let workerTimer = null;
let workerRunning = false;
let lastRunAt = null;

function toLogger(customLogger) {
  return customLogger ?? logger;
}

async function fetchDueSubscriptions(limit = 25) {
  return SearchSubscription.findAll({
    where: {
      nextRunAt: { [Op.lte]: new Date() },
    },
    order: [
      ['nextRunAt', 'ASC'],
      ['updatedAt', 'ASC'],
    ],
    limit,
  });
}

async function enqueueDueSubscriptions({ logger: providedLogger } = {}) {
  const log = toLogger(providedLogger);
  try {
    const due = await fetchDueSubscriptions(MAX_BATCH_SIZE);
    due.forEach((subscription) => {
      try {
        enqueueSearchSubscriptionJob({
          subscriptionId: subscription.id,
          userId: subscription.userId,
          reason: 'scheduled_run',
        });
      } catch (error) {
        log.warn?.({ err: error, subscriptionId: subscription.id }, 'Failed to enqueue scheduled search subscription job');
      }
    });
  } catch (error) {
    log.error?.({ err: error }, 'Failed to fetch due search subscriptions');
  }
}

async function executeSubscriptionJob(job, { logger: providedLogger } = {}) {
  const log = toLogger(providedLogger);
  const subscription = await SearchSubscription.findOne({
    where: { id: job.subscriptionId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName', 'userType'],
      },
    ],
  });

  if (!subscription) {
    log.warn?.({ jobId: job.id, subscriptionId: job.subscriptionId }, 'Search subscription not found for queued job');
    return null;
  }

  const startedAt = Date.now();
  let resultSummary = null;

  try {
    switch (subscription.category) {
      case 'gig':
        resultSummary = await listGigs({ query: subscription.query, filters: subscription.filters, page: 1, pageSize: 10 });
        break;
      case 'project':
        resultSummary = await listProjects({ query: subscription.query, filters: subscription.filters, page: 1, pageSize: 10 });
        break;
      case 'launchpad':
        resultSummary = await listLaunchpads({ query: subscription.query, filters: subscription.filters, page: 1, pageSize: 10 });
        break;
      case 'volunteering':
        resultSummary = await listVolunteering({ query: subscription.query, filters: subscription.filters, page: 1, pageSize: 10 });
        break;
      case 'people':
        resultSummary = { items: await User.searchByTerm(subscription.query ?? ''), total: null, metrics: { source: 'directory' } };
        break;
      case 'mixed':
        resultSummary = await searchOpportunitiesAcrossCategories(subscription.query ?? '', { limit: 10 });
        break;
      case 'job':
      default:
        resultSummary = await listJobs({ query: subscription.query, filters: subscription.filters, page: 1, pageSize: 10 });
        break;
    }
  } catch (error) {
    log.error?.({ err: error, subscriptionId: subscription.id }, 'Failed to resolve search subscription digest');
    throw new ApplicationError('Failed to resolve search subscription digest.', 500, { cause: error });
  }

  const now = new Date();
  const frequency = subscription.frequency ?? 'daily';
  const nextRunAt = now < subscription.nextRunAt ? subscription.nextRunAt : getNextRunTimestamp(frequency);

  await subscription.update({
    lastTriggeredAt: now,
    nextRunAt,
    updatedAt: new Date(),
  });

  const processingTimeMs = Date.now() - startedAt;
  recordSearchExecution({
    surface: 'subscription_digest',
    category: subscription.category,
    durationMs: processingTimeMs,
    resultCount: Array.isArray(resultSummary?.items) ? resultSummary.items.length : null,
    userId: subscription.userId,
  });

  return {
    subscriptionId: subscription.id,
    userId: subscription.userId,
    category: subscription.category,
    durationMs: processingTimeMs,
    resultCount: Array.isArray(resultSummary?.items) ? resultSummary.items.length : null,
  };
}

export async function processPendingSearchSubscriptions({ logger: providedLogger, limit = MAX_BATCH_SIZE } = {}) {
  const log = toLogger(providedLogger);
  const jobs = drainSearchSubscriptionJobs({ limit });
  if (!jobs.length) {
    return [];
  }

  const results = [];
  for (const job of jobs) {
    try {
      const result = await executeSubscriptionJob(job, { logger: log });
      if (result) {
        results.push(result);
      }
    } catch (error) {
      log.error?.({ err: error, jobId: job.id, subscriptionId: job.subscriptionId }, 'Failed to process search subscription job');
    }
  }

  return results;
}

async function tick({ logger: providedLogger } = {}) {
  const log = toLogger(providedLogger);
  lastRunAt = new Date();
  await enqueueDueSubscriptions({ logger: log });
  await processPendingSearchSubscriptions({ logger: log, limit: MAX_BATCH_SIZE });
}

export function startSearchSubscriptionWorker({ logger: providedLogger, intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  if (workerRunning) {
    return { started: false, reason: 'already_running' };
  }

  const log = toLogger(providedLogger);

  workerRunning = true;
  workerTimer = setInterval(() => {
    tick({ logger: log }).catch((error) => {
      log.error?.({ err: error }, 'Unhandled error in search subscription worker tick');
    });
  }, intervalMs);

  log.info?.({ intervalMs }, 'Search subscription worker started');
  return { started: true, intervalMs };
}

export async function stopSearchSubscriptionWorker({ logger: providedLogger } = {}) {
  if (!workerRunning) {
    return { stopped: false, reason: 'not_running' };
  }
  if (workerTimer) {
    clearInterval(workerTimer);
  }
  workerTimer = null;
  workerRunning = false;
  const log = toLogger(providedLogger);
  log.info?.('Search subscription worker stopped');
  return { stopped: true };
}

export function getSearchSubscriptionWorkerStatus() {
  const snapshot = getSearchSubscriptionQueueSnapshot();
  return {
    running: workerRunning,
    pendingJobs: snapshot.pending,
    maxQueueSize: snapshot.maxSize,
    oldestJobAt: snapshot.oldestEnqueuedAt,
    newestJobAt: snapshot.newestEnqueuedAt,
    lastRunAt: lastRunAt ? lastRunAt.toISOString() : null,
  };
}

export default {
  startSearchSubscriptionWorker,
  stopSearchSubscriptionWorker,
  processPendingSearchSubscriptions,
  getSearchSubscriptionWorkerStatus,
};
