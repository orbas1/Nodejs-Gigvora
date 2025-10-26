import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { ValidationError, NotFoundError } from '../src/utils/errors.js';

const modelModuleUrl = new URL('../src/models/index.js', import.meta.url);
const queueModuleUrl = new URL('../src/services/searchSubscriptionQueue.js', import.meta.url);
const metricsModuleUrl = new URL('../src/observability/searchMetrics.js', import.meta.url);

const subscriptionStore = new Map();
let subscriptionId = 1;

function resetSubscriptionStore() {
  subscriptionStore.clear();
  subscriptionId = 1;
}

function createRecord(payload) {
  const now = new Date();
  const record = {
    ...payload,
    id: subscriptionId++,
    createdAt: now,
    updatedAt: now,
    lastTriggeredAt: payload.lastTriggeredAt ?? null,
    nextRunAt: payload.nextRunAt ?? null,
  };

  record.update = async (updates = {}) => {
    Object.assign(record, updates);
    record.updatedAt = new Date();
    return record;
  };

  record.toPublicObject = () => ({
    id: record.id,
    userId: record.userId,
    name: record.name,
    category: record.category,
    query: record.query,
    filters: record.filters ?? null,
    sort: record.sort ?? null,
    frequency: record.frequency,
    notifyByEmail: record.notifyByEmail,
    notifyInApp: record.notifyInApp,
    mapViewport: record.mapViewport ?? null,
    nextRunAt: record.nextRunAt ?? null,
    lastTriggeredAt: record.lastTriggeredAt ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });

  return record;
}

function sortSubscriptions(records) {
  return [...records].sort((a, b) => {
    const nameCompare = (a.name ?? '').localeCompare(b.name ?? '');
    if (nameCompare !== 0) {
      return nameCompare;
    }
    const aUpdated = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
    const bUpdated = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
    return bUpdated - aUpdated;
  });
}

const SearchSubscription = {
  async findAll({ where } = {}) {
    const userId = where?.userId;
    const records = Array.from(subscriptionStore.values()).filter((record) => {
      return userId == null || record.userId === userId;
    });
    return sortSubscriptions(records);
  },
  async create(payload) {
    const record = createRecord(payload);
    subscriptionStore.set(record.id, record);
    return record;
  },
  async findOne({ where } = {}) {
    const { id, userId } = where ?? {};
    for (const record of subscriptionStore.values()) {
      if (id != null && record.id !== id) {
        continue;
      }
      if (userId != null && record.userId !== userId) {
        continue;
      }
      return record;
    }
    return null;
  },
  async destroy({ where } = {}) {
    const { id, userId } = where ?? {};
    if (id == null) {
      return 0;
    }
    const record = subscriptionStore.get(id);
    if (!record) {
      return 0;
    }
    if (userId != null && record.userId !== userId) {
      return 0;
    }
    subscriptionStore.delete(id);
    return 1;
  },
};

await jest.unstable_mockModule(modelModuleUrl.pathname, () => ({
  __esModule: true,
  DIGEST_FREQUENCIES: ['immediate', 'daily', 'weekly'],
  SearchSubscription,
}));

const queueState = {
  maxSize: 1000,
  jobs: [],
};

await jest.unstable_mockModule(queueModuleUrl.pathname, () => ({
  __esModule: true,
  configureSearchSubscriptionQueue: ({ sizeCap } = {}) => {
    if (sizeCap == null) {
      return Promise.resolve({ maxSize: queueState.maxSize });
    }
    const numeric = Number.parseInt(sizeCap, 10);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      throw new ValidationError('sizeCap must be a positive integer.');
    }
    queueState.maxSize = numeric;
    if (queueState.jobs.length > queueState.maxSize) {
      queueState.jobs.splice(queueState.maxSize);
    }
    return Promise.resolve({ maxSize: queueState.maxSize });
  },
  enqueueSearchSubscriptionJob: ({ subscriptionId, userId, reason = 'manual_run', priority = 5 } = {}) => {
    const now = new Date();
    const job = {
      id: `${subscriptionId}:${now.getTime()}`,
      subscriptionId,
      userId,
      status: 'pending',
      reason,
      priority,
      attempts: 0,
      queuedAt: now,
      availableAt: now,
    };
    const existingIndex = queueState.jobs.findIndex((entry) => entry.subscriptionId === subscriptionId);
    if (existingIndex >= 0) {
      queueState.jobs[existingIndex] = job;
    } else {
      if (queueState.jobs.length >= queueState.maxSize) {
        throw new ValidationError('Search subscription queue is at capacity.');
      }
      queueState.jobs.push(job);
    }
    return Promise.resolve({ job, queued: true, created: existingIndex === -1 });
  },
  drainSearchSubscriptionJobs: ({ limit = 10 } = {}) => {
    const taken = queueState.jobs.splice(0, limit);
    return Promise.resolve(taken.map((job) => ({ ...job })));
  },
  getSearchSubscriptionQueueSnapshot: () => {
    const oldest = queueState.jobs[0]?.queuedAt ?? null;
    const newest = queueState.jobs[queueState.jobs.length - 1]?.queuedAt ?? null;
    return Promise.resolve({
      pending: queueState.jobs.length,
      processing: 0,
      failed: 0,
      completed: 0,
      maxSize: queueState.maxSize,
      oldestEnqueuedAt: oldest ? oldest.toISOString() : null,
      newestEnqueuedAt: newest ? newest.toISOString() : null,
    });
  },
  resetSearchSubscriptionQueue: () => {
    queueState.jobs = [];
    queueState.maxSize = 1000;
    return Promise.resolve();
  },
}));

const queueModule = await import(queueModuleUrl.pathname);
const { resetSearchSubscriptionQueue, drainSearchSubscriptionJobs, getSearchSubscriptionQueueSnapshot } = queueModule;
const { resetSearchMetrics } = await import(metricsModuleUrl.pathname);

const service = await import('../src/services/searchSubscriptionService.js');
const { listSubscriptions, createSubscription, updateSubscription, deleteSubscription, runSubscription } = service;

let userCounter = 1;

describe('searchSubscriptionService', () => {
  let user;

  beforeEach(async () => {
    resetSubscriptionStore();
    await resetSearchSubscriptionQueue();
    resetSearchMetrics();
    user = {
      id: userCounter++,
      email: `user-${Date.now()}@gigvora.test`,
    };
  });

  it('creates subscriptions with sanitised filters and viewport', async () => {
    const subscription = await createSubscription(user.id, {
      name: 'Berlin Remote Designers',
      category: 'job',
      query: 'designer',
      filters: {
        employmentTypes: ['Full-time', 'Full-time'],
        locations: ['Berlin'],
        isRemote: 'true',
        updatedWithin: '7d',
        taxonomySlugs: ['marketplace', 'marketplace', 'ai-services'],
      },
      frequency: 'weekly',
      mapViewport: { boundingBox: { north: 53.1, south: 52.3, east: 13.9, west: 13.1 } },
      sort: 'freshnessScore:desc',
      notifyByEmail: false,
    });

    expect(subscription.name).toBe('Berlin Remote Designers');
    expect(subscription.filters.employmentTypes).toEqual(['Full-time']);
    expect(subscription.filters.isRemote).toBe(true);
    expect(subscription.filters.taxonomySlugs).toEqual(['marketplace', 'ai-services']);
    expect(subscription.mapViewport.boundingBox.north).toBeCloseTo(53.1);
    expect(subscription.frequency).toBe('weekly');
    expect(subscription.notifyByEmail).toBe(false);
  });

  it('updates subscription properties and recalculates next run', async () => {
    const created = await createSubscription(user.id, {
      name: 'Gig Alerts',
      category: 'gig',
      query: 'designer',
    });

    const updated = await updateSubscription(created.id, user.id, {
      filters: { budgetCurrencies: ['USD'] },
      frequency: 'daily',
      notifyInApp: false,
    });

    expect(updated.filters.budgetCurrencies).toEqual(['USD']);
    expect(updated.frequency).toBe('daily');
    expect(updated.notifyInApp).toBe(false);
    expect(new Date(updated.nextRunAt).getTime()).toBeGreaterThan(new Date().getTime());
  });

  it('enforces ownership when deleting subscriptions', async () => {
    const created = await createSubscription(user.id, { name: 'Launchpad', category: 'launchpad' });

    await expect(deleteSubscription(created.id, user.id)).resolves.toEqual({ success: true });
    await expect(deleteSubscription(created.id, user.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('executes manual runs and schedules the next trigger window', async () => {
    const created = await createSubscription(user.id, {
      name: 'Realtime Mentoring Alerts',
      category: 'gig',
      frequency: 'immediate',
      sort: ['freshness:desc'],
    });

    const run = await runSubscription(created.id, user.id);

    expect(run.lastTriggeredAt).toBeNull();
    expect(run.nextRunAt).toBeTruthy();
    expect(run.queue.enqueued).toBe(true);
    expect(run.queue.jobId).toBeTruthy();
    expect(run.queue.snapshot.pendingJobs).toBeGreaterThanOrEqual(1);

    const drained = await drainSearchSubscriptionJobs({ limit: 5 });
    expect(drained).toHaveLength(1);
    expect(drained[0].subscriptionId).toBe(created.id);
    const snapshot = await getSearchSubscriptionQueueSnapshot();
    expect(snapshot.pending).toBe(0);
    expect(new Date(run.nextRunAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('validates input payloads', async () => {
    await expect(createSubscription(user.id, { name: '', category: 'invalid' })).rejects.toBeInstanceOf(ValidationError);
    const created = await createSubscription(user.id, { name: 'Test', category: 'job' });
    await expect(updateSubscription(created.id, user.id, { frequency: 'hourly' })).rejects.toBeInstanceOf(ValidationError);
    await expect(listSubscriptions(999999)).resolves.toEqual([]);
  });

  it('rejects malformed viewport payloads', async () => {
    await expect(
      createSubscription(user.id, {
        name: 'Bad viewport payload',
        category: 'job',
        mapViewport: '{"boundingBox": invalid}',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
