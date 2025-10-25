process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

import { beforeEach, describe, expect, it } from '@jest/globals';
import sequelize from '../../src/models/sequelizeClient.js';
import {
  listPlatformSettingsWatchers,
  listActivePlatformSettingsWatcherIds,
  createPlatformSettingsWatcher,
  updatePlatformSettingsWatcher,
  disablePlatformSettingsWatcher,
  markPlatformSettingsWatcherDigest,
  __dangerouslyResetPlatformSettingsWatcherCache,
} from '../../src/services/platformSettingsWatchersService.js';
import { ValidationError } from '../../src/utils/errors.js';

describe('platformSettingsWatchersService', () => {
  beforeEach(async () => {
    __dangerouslyResetPlatformSettingsWatcherCache();
  });

  function getModel(name) {
    const model = sequelize.models?.[name];
    if (!model) {
      throw new Error(`Expected Sequelize model ${name} to be available for testing.`);
    }
    return model;
  }

  it('creates watchers and exposes active ids', async () => {
    const User = getModel('User');
    const user = await User.create({ email: 'ops@gigvora.com', password: 'pass' });
    const watcher = await createPlatformSettingsWatcher({
      userId: user.id,
      digestFrequency: 'immediate',
      metadata: { severity: 'high' },
    });

    expect(watcher.userId).toBe(user.id);
    expect(watcher.digestFrequency).toBe('immediate');
    expect(watcher.metadata).toEqual({ severity: 'high' });

    const ids = await listActivePlatformSettingsWatcherIds();
    expect(ids).toEqual([user.id]);
  });

  it('prevents duplicate watchers for the same user', async () => {
    const User = getModel('User');
    const user = await User.create({ email: 'ops@gigvora.com', password: 'pass' });
    await createPlatformSettingsWatcher({ userId: user.id });

    await expect(createPlatformSettingsWatcher({ userId: user.id })).rejects.toBeInstanceOf(ValidationError);
  });

  it('updates and disables watchers', async () => {
    const User = getModel('User');
    const user = await User.create({ email: 'audit@gigvora.com', password: 'pass' });
    const watcher = await createPlatformSettingsWatcher({ userId: user.id, digestFrequency: 'daily' });

    const updated = await updatePlatformSettingsWatcher(watcher.id, { digestFrequency: 'weekly', role: 'Compliance Lead' });
    expect(updated.digestFrequency).toBe('weekly');
    expect(updated.role).toBe('Compliance Lead');

    const disabled = await disablePlatformSettingsWatcher(watcher.id);
    expect(disabled.enabled).toBe(false);

    const activeIds = await listActivePlatformSettingsWatcherIds();
    expect(activeIds).toEqual([]);
  });

  it('marks watcher digest timestamps', async () => {
    const User = getModel('User');
    const user = await User.create({ email: 'daily@gigvora.com', password: 'pass' });
    const watcher = await createPlatformSettingsWatcher({ userId: user.id, digestFrequency: 'daily' });
    expect(watcher.lastDigestAt).toBeNull();

    const fixed = new Date('2024-01-02T00:00:00.000Z');
    await markPlatformSettingsWatcherDigest(watcher.id, fixed);

    const [refetched] = await listPlatformSettingsWatchers({ includeDisabled: true });
    expect(refetched.lastDigestAt).toBe(fixed.toISOString());
  });
});
