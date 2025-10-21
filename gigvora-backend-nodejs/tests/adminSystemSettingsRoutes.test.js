process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import './setupTestEnv.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const adminToken = jwt.sign({ id: 1, roles: ['admin'], type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: 2, roles: ['user'], type: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Admin system settings routes', () => {
  it('requires admin access', async () => {
    const unauthenticated = await request(app).get('/api/admin/system-settings');
    expect(unauthenticated.status).toBe(401);

    const forbidden = await request(app)
      .get('/api/admin/system-settings')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('allows admins to view and update system settings', async () => {
    const initial = await request(app)
      .get('/api/admin/system-settings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(initial.status).toBe(200);
    expect(initial.body).toHaveProperty('general');

    const updatePayload = {
      general: {
        appName: 'Gigvora Ops',
        supportEmail: 'ops@gigvora.test',
      },
      security: {
        requireTwoFactor: true,
        passwordMinimumLength: 14,
      },
    };

    const update = await request(app)
      .put('/api/admin/system-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(update.status).toBe(200);
    expect(update.body.general.appName).toBe('Gigvora Ops');
    expect(update.body.general.supportEmail).toBe('ops@gigvora.test');
    expect(update.body.security.requireTwoFactor).toBe(true);

    const reloaded = await request(app)
      .get('/api/admin/system-settings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(reloaded.status).toBe(200);
    expect(reloaded.body.general.appName).toBe('Gigvora Ops');
    expect(reloaded.body.security.passwordMinimumLength).toBe(14);
  });
});
