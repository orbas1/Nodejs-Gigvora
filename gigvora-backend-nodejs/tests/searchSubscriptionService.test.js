import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { ValidationError, NotFoundError } from '../src/utils/errors.js';

const modelModuleUrl = new URL('../src/models/index.js', import.meta.url);

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

const service = await import('../src/services/searchSubscriptionService.js');
const { listSubscriptions, createSubscription, updateSubscription, deleteSubscription, runSubscription } = service;

let userCounter = 1;

describe('searchSubscriptionService', () => {
  let user;

  beforeEach(() => {
    resetSubscriptionStore();
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
      },
      frequency: 'weekly',
      mapViewport: { boundingBox: { north: 53.1, south: 52.3, east: 13.9, west: 13.1 } },
      sort: 'freshnessScore:desc',
      notifyByEmail: false,
    });

    expect(subscription.name).toBe('Berlin Remote Designers');
    expect(subscription.filters.employmentTypes).toEqual(['Full-time']);
    expect(subscription.filters.isRemote).toBe(true);
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

    expect(run.lastTriggeredAt).toBeTruthy();
    expect(run.nextRunAt).toBeTruthy();
    expect(new Date(run.nextRunAt).getTime()).toBeGreaterThanOrEqual(new Date(run.lastTriggeredAt).getTime());
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
