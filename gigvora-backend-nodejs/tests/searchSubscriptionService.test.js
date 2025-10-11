import { describe, beforeEach, it, expect } from '@jest/globals';
import './setupTestEnv.js';
import { User } from '../src/models/index.js';
import {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from '../src/services/searchSubscriptionService.js';
import { ValidationError, NotFoundError } from '../src/utils/errors.js';

describe('searchSubscriptionService', () => {
  let user;

  beforeEach(async () => {
    user = await User.create({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: `ada-${Date.now()}@gigvora.test`,
      password: 'secure-password',
      userType: 'user',
    });
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

  it('validates input payloads', async () => {
    await expect(createSubscription(user.id, { name: '', category: 'invalid' })).rejects.toBeInstanceOf(ValidationError);
    const created = await createSubscription(user.id, { name: 'Test', category: 'job' });
    await expect(updateSubscription(created.id, user.id, { frequency: 'hourly' })).rejects.toBeInstanceOf(ValidationError);
    await expect(listSubscriptions(999999)).resolves.toEqual([]);
  });
});
