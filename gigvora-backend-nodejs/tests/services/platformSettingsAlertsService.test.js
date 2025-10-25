process.env.SKIP_SEQUELIZE_BOOTSTRAP = process.env.SKIP_SEQUELIZE_BOOTSTRAP ?? 'true';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import sequelize from '../../src/models/sequelizeClient.js';
import {
  dispatchPlatformSettingsAuditNotification,
  getPlatformSettingsAuditWatcherIds,
  setPlatformSettingsNotificationAdapter,
} from '../../src/services/platformSettingsAlertsService.js';
import {
  createPlatformSettingsWatcher,
  __dangerouslyResetPlatformSettingsWatcherCache,
} from '../../src/services/platformSettingsWatchersService.js';

describe('platformSettingsAlertsService', () => {
  beforeEach(async () => {
    __dangerouslyResetPlatformSettingsWatcherCache();
  });

  afterEach(() => {
    setPlatformSettingsNotificationAdapter(null);
  });

  it('returns zero deliveries when no watcher ids configured', async () => {
    const result = await dispatchPlatformSettingsAuditNotification({ summary: 'noop' }, {});
    expect(result).toEqual({ delivered: 0, watchers: [] });
    await expect(getPlatformSettingsAuditWatcherIds()).resolves.toEqual([]);
  });

  it('notifies only immediate notification watchers using override adapter', async () => {
    const User = sequelize.models.User;
    if (!User) {
      throw new Error('Expected User model to be available for alerts service tests.');
    }

    const immediate = await User.create({ email: 'ops@gigvora.com', password: 'pass' });
    const digestOnly = await User.create({ email: 'compliance@gigvora.com', password: 'pass' });
    await createPlatformSettingsWatcher({ userId: immediate.id, digestFrequency: 'immediate' });
    await createPlatformSettingsWatcher({ userId: digestOnly.id, digestFrequency: 'daily' });

    const notifier = jest.fn().mockResolvedValue(undefined);
    setPlatformSettingsNotificationAdapter(notifier);

    const event = {
      id: 99,
      summary: 'Updated payments',
      changedSections: ['payments'],
      changes: [{ path: 'payments.provider', type: 'value' }],
      createdAt: '2024-10-10T10:00:00.000Z',
    };

    const snapshot = { metadata: { updatedAt: '2024-10-10T10:00:00.000Z' } };

    const result = await dispatchPlatformSettingsAuditNotification(event, snapshot, {
      actor: { actorId: 12 },
    });

    expect(result).toEqual({ delivered: 1, watchers: [immediate.id] });
    expect(notifier).toHaveBeenCalledTimes(1);
    const firstCall = notifier.mock.calls[0][0];
    expect(firstCall.userId).toBe(immediate.id);
    expect(firstCall.payload.summary).toBe('Updated payments');
    expect(firstCall.payload.changedSections).toEqual(['payments']);
    expect(firstCall.payload.eventId).toBe(99);
  });
});
