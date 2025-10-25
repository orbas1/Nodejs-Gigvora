process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.ENABLE_PLATFORM_SETTINGS_AUDIT_WORKER = 'true';
process.env.PLATFORM_SETTINGS_AUDIT_DIGEST_INTERVAL_MS = '1000';
process.env.PLATFORM_SETTINGS_AUDIT_DIGEST_LOOKBACK_HOURS = '24';
process.env.PLATFORM_SETTINGS_AUDIT_RETENTION_DAYS = '30';

import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import sequelize from '../../src/models/sequelizeClient.js';
import '../../src/models/platformSettingsAuditEvent.js';
import {
  createPlatformSettingsWatcher,
  __dangerouslyResetPlatformSettingsWatcherCache,
} from '../../src/services/platformSettingsWatchersService.js';

let runAuditCycle;
let setAuditNotifier;

beforeAll(async () => {
  const runtimeConfigModule = await import('../../src/config/runtimeConfig.js');
  await runtimeConfigModule.refreshRuntimeConfig({
    overrides: {
      ENABLE_PLATFORM_SETTINGS_AUDIT_WORKER: 'true',
      PLATFORM_SETTINGS_AUDIT_DIGEST_INTERVAL_MS: '1000',
      PLATFORM_SETTINGS_AUDIT_DIGEST_LOOKBACK_HOURS: '24',
      PLATFORM_SETTINGS_AUDIT_RETENTION_DAYS: '30',
    },
  });
  const module = await import('../../src/services/platformSettingsAuditWorker.js');
  runAuditCycle = module.__runPlatformSettingsAuditWorkerCycle;
  setAuditNotifier = module.setPlatformSettingsAuditDigestNotifier;
});

describe('platformSettingsAuditWorker', () => {
  beforeEach(async () => {
    __dangerouslyResetPlatformSettingsWatcherCache();
    setAuditNotifier(null);
  });

  function getModel(name) {
    const model = sequelize.models?.[name];
    if (!model) {
      throw new Error(`Expected Sequelize model ${name} to be available for audit worker tests.`);
    }
    return model;
  }

  it('delivers digests for eligible watchers and updates lastDigestAt', async () => {
    const User = getModel('User');
    const PlatformSettingsWatcher = getModel('PlatformSettingsWatcher');
    const PlatformSettingsAuditEvent = getModel('PlatformSettingsAuditEvent');

    const user = await User.create({ email: 'ops@gigvora.com', password: 'pass' });
    await createPlatformSettingsWatcher({ userId: user.id, digestFrequency: 'daily' });

    await PlatformSettingsAuditEvent.create({
      actorId: user.id,
      actorEmail: 'ops@gigvora.com',
      actorName: 'Ops',
      summary: 'Updated payments',
      changedSections: ['payments'],
      changes: [{ path: 'payments.provider', type: 'value' }],
      createdAt: new Date(),
    });

    const notifier = jest.fn().mockResolvedValue(undefined);
    setAuditNotifier(notifier);

    await runAuditCycle();

    expect(notifier).toHaveBeenCalledTimes(1);
    const payload = notifier.mock.calls[0][0];
    expect(payload.userId).toBe(user.id);
    expect(payload.payload.totalEvents).toBe(1);
    expect(payload.payload.sections).toEqual(['payments']);

    const [watcher] = await PlatformSettingsWatcher.findAll();
    expect(watcher.lastDigestAt).not.toBeNull();
  });

  it('archives historical events past retention window', async () => {
    const User = getModel('User');
    const PlatformSettingsAuditEvent = getModel('PlatformSettingsAuditEvent');

    const user = await User.create({ email: 'ops@gigvora.com', password: 'pass' });
    await createPlatformSettingsWatcher({ userId: user.id, digestFrequency: 'weekly' });

    await PlatformSettingsAuditEvent.bulkCreate([
      {
        actorId: user.id,
        actorEmail: 'ops@gigvora.com',
        actorName: 'Ops',
        summary: 'Old change',
        changedSections: ['app'],
        changes: [{ path: 'app.name', type: 'value' }],
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
      {
        actorId: user.id,
        actorEmail: 'ops@gigvora.com',
        actorName: 'Ops',
        summary: 'Recent change',
        changedSections: ['app'],
        changes: [{ path: 'app.environment', type: 'value' }],
        createdAt: new Date(),
      },
    ]);

    setAuditNotifier(jest.fn().mockResolvedValue(undefined));
    await runAuditCycle();

    const events = await PlatformSettingsAuditEvent.findAll({ order: [['createdAt', 'ASC']] });
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe('Recent change');
  });
});
