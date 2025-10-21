process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

import request from 'supertest';
import '../setupTestEnv.js';
import { createAnnouncement } from '../../src/services/runtimeMaintenanceService.js';
import sequelize from '../../src/models/sequelizeClient.js';

let app;

beforeAll(async () => {
  await import('../../src/models/runtimeAnnouncement.js');
  await sequelize.sync({ force: true });
  const expressModule = await import('express');
  const { default: runtimeRoutes } = await import('../../src/routes/runtimeRoutes.js');
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const express = expressModule.default;

  app = express();
  app.use(correlationId());
  app.use('/api/runtime', runtimeRoutes);
  app.use(errorHandler);
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

describe('runtime routes', () => {
  it('exposes public maintenance announcements', async () => {
    await createAnnouncement({
      title: 'API payload limits',
      message: 'Raised gateway payload limits while rate limiting recalibrates.',
      status: 'active',
      severity: 'info',
      audiences: ['public'],
      channels: ['api'],
      startsAt: new Date(Date.now() - 15 * 60 * 1000),
      endsAt: new Date(Date.now() + 45 * 60 * 1000),
    });

    const response = await request(app)
      .get('/api/runtime/maintenance')
      .query({ audience: 'user', channel: 'api', windowMinutes: 90 });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.announcements)).toBe(true);
    expect(response.body.announcements).toHaveLength(1);
    expect(response.body.announcements[0].title).toContain('API payload limits');
  });

  it('sanitises query constraints and excludes resolved maintenance by default', async () => {
    const now = Date.now();

    await createAnnouncement({
      title: 'Realtime analytics maintenance',
      message: 'Temporarily pausing ingestion for analytics upgrades.',
      status: 'active',
      severity: 'maintenance',
      audiences: ['public', 'user'],
      channels: ['api', 'web'],
      startsAt: new Date(now - 20 * 60 * 1000),
      endsAt: new Date(now + 40 * 60 * 1000),
    });

    await createAnnouncement({
      title: 'Resolved incident',
      message: 'Background job delays have been cleared.',
      status: 'resolved',
      severity: 'info',
      audiences: ['user'],
      channels: ['api'],
      startsAt: new Date(now - 60 * 60 * 1000),
      endsAt: new Date(now + 15 * 60 * 1000),
    });

    const constrained = await request(app)
      .get('/api/runtime/maintenance')
      .query({ audience: 'user', channel: 'API', windowMinutes: '1', limit: '-5' });

    expect(constrained.status).toBe(200);
    expect(constrained.body.windowMinutes).toBe(5);
    expect(constrained.body.announcements).toHaveLength(1);
    expect(constrained.body.announcements[0]).toMatchObject({
      status: 'active',
      channels: expect.arrayContaining(['api']),
    });

    const withResolved = await request(app)
      .get('/api/runtime/maintenance')
      .query({ audience: 'user', channel: 'api', includeResolved: 'true', windowMinutes: '15' });

    expect(withResolved.status).toBe(200);
    expect(withResolved.body.announcements.length).toBeGreaterThanOrEqual(2);
    expect(withResolved.body.announcements.some((record) => record.status === 'resolved')).toBe(true);
  });
});
