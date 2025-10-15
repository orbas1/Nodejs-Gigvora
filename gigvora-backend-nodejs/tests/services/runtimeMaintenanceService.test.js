process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { beforeAll, beforeEach, describe, it, expect } from '@jest/globals';
import '../setupTestEnv.js';
import {
  createAnnouncement,
  getVisibleAnnouncements,
  updateAnnouncementStatus,
  listAnnouncements,
} from '../../src/services/runtimeMaintenanceService.js';
import { RuntimeAnnouncement } from '../../src/models/runtimeAnnouncement.js';

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

describe('runtimeMaintenanceService', () => {
  beforeAll(async () => {
    await RuntimeAnnouncement.sync({ force: true });
  });

  beforeEach(async () => {
    await RuntimeAnnouncement.destroy({ where: {} });
  });

  it('creates announcements and exposes them to visible queries', async () => {
    const created = await createAnnouncement({
      title: 'Database patch window',
      message: 'Read-only mode while replicas receive security patches.',
      status: 'active',
      severity: 'maintenance',
      startsAt: minutesFromNow(-10),
      endsAt: minutesFromNow(25),
      audiences: ['public', 'operations'],
      channels: ['web', 'mobile'],
    });

    expect(created.slug).toContain('database-patch-window');

    const snapshot = await getVisibleAnnouncements({
      audience: 'public',
      channel: 'web',
      windowMinutes: 120,
    });

    expect(snapshot.announcements).toHaveLength(1);
    expect(snapshot.announcements[0].slug).toBe(created.slug);
    expect(snapshot.announcements[0].status).toBe('active');
  });

  it('surfaces scheduled windows within the lookahead period', async () => {
    await createAnnouncement({
      title: 'Search cluster reindex',
      message: 'Indexing nodes will rotate during the planned maintenance.',
      status: 'scheduled',
      severity: 'maintenance',
      startsAt: minutesFromNow(45),
      endsAt: minutesFromNow(90),
      audiences: ['provider', 'company'],
      channels: ['mobile'],
    });

    const snapshot = await getVisibleAnnouncements({
      audience: 'provider',
      channel: 'mobile',
      windowMinutes: 120,
    });

    expect(snapshot.announcements).toHaveLength(1);
    expect(snapshot.announcements[0].status).toBe('scheduled');
  });

  it('allows resolving windows via status update', async () => {
    const created = await createAnnouncement({
      title: 'Realtime failover',
      message: 'Realtime gateway moved to secondary region after latency regression.',
      status: 'active',
      severity: 'incident',
      startsAt: minutesFromNow(-2),
      endsAt: minutesFromNow(30),
      audiences: ['operations'],
      channels: ['api'],
    });

    const resolved = await updateAnnouncementStatus(created.slug, 'resolved');
    expect(resolved.status).toBe('resolved');
    expect(resolved.endsAt).not.toBeNull();

    const adminSnapshot = await listAnnouncements({ includeResolved: true });
    expect(adminSnapshot.records).toHaveLength(1);
    expect(adminSnapshot.records[0].status).toBe('resolved');
    expect(adminSnapshot.records[0].slug).toBe(created.slug);
  });
});
