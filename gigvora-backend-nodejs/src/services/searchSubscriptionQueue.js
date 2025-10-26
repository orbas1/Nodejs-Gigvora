import { ValidationError } from '../utils/errors.js';

const DEFAULT_MAX_QUEUE_SIZE = 500;

const queue = [];
const pendingIndex = new Map();
let maxQueueSize = DEFAULT_MAX_QUEUE_SIZE;

function normaliseId(value, label) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

export function configureSearchSubscriptionQueue({ sizeCap } = {}) {
  if (sizeCap == null) {
    return { maxSize: maxQueueSize };
  }
  const numeric = Number.parseInt(sizeCap, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('sizeCap must be a positive integer.');
  }
  maxQueueSize = numeric;
  while (queue.length > maxQueueSize) {
    const job = queue.shift();
    if (job) {
      pendingIndex.delete(job.subscriptionId);
    }
  }
  return { maxSize: maxQueueSize };
}

export function enqueueSearchSubscriptionJob({ subscriptionId, userId, reason = 'manual', priority = 5, payload = {} } = {}) {
  const normalisedSubscriptionId = normaliseId(subscriptionId, 'subscriptionId');
  const normalisedUserId = normaliseId(userId, 'userId');
  const jobKey = normalisedSubscriptionId;

  const now = new Date();

  if (queue.length >= maxQueueSize && !pendingIndex.has(jobKey)) {
    throw new ValidationError('Search subscription queue is at capacity.');
  }

  const job = {
    id: `${jobKey}:${now.getTime()}`,
    subscriptionId: normalisedSubscriptionId,
    userId: normalisedUserId,
    reason,
    priority: Number.isFinite(priority) ? priority : 5,
    payload: payload && typeof payload === 'object' ? { ...payload } : {},
    enqueuedAt: now,
    attempts: 0,
  };

  if (pendingIndex.has(jobKey)) {
    const existingIndex = pendingIndex.get(jobKey);
    queue[existingIndex] = job;
  } else {
    pendingIndex.set(jobKey, queue.push(job) - 1);
  }

  return { job, queued: true };
}

export function drainSearchSubscriptionJobs({ limit = 10 } = {}) {
  const numericLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const jobs = [];
  while (jobs.length < numericLimit && queue.length > 0) {
    const job = queue.shift();
    if (!job) {
      break;
    }
    pendingIndex.delete(job.subscriptionId);
    jobs.push(job);
  }
  queue.forEach((entry, index) => {
    if (entry) {
      pendingIndex.set(entry.subscriptionId, index);
    }
  });
  return jobs;
}

export function getSearchSubscriptionQueueSnapshot() {
  const pending = queue.length;
  const oldest = queue[0]?.enqueuedAt ?? null;
  const newest = queue[queue.length - 1]?.enqueuedAt ?? null;
  return {
    pending,
    maxSize: maxQueueSize,
    oldestEnqueuedAt: oldest ? oldest.toISOString() : null,
    newestEnqueuedAt: newest ? newest.toISOString() : null,
  };
}

export function resetSearchSubscriptionQueue() {
  queue.splice(0, queue.length);
  pendingIndex.clear();
  maxQueueSize = DEFAULT_MAX_QUEUE_SIZE;
}

export default {
  enqueueSearchSubscriptionJob,
  drainSearchSubscriptionJobs,
  getSearchSubscriptionQueueSnapshot,
  configureSearchSubscriptionQueue,
  resetSearchSubscriptionQueue,
};
