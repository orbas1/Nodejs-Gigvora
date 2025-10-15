process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import request from 'supertest';
import app from '../../src/app.js';
import '../setupTestEnv.js';
import { createAnnouncement } from '../../src/services/runtimeMaintenanceService.js';

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
});
