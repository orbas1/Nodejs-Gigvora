process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import './setupTestEnv.js';
import {
  configureRateLimitMetrics,
  resetRateLimitMetrics,
  recordRateLimitAttempt,
  recordRateLimitSuccess,
} from '../src/observability/rateLimitMetrics.js';
import { createAnnouncement } from '../src/services/runtimeMaintenanceService.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const adminToken = jwt.sign(
  {
    id: 999,
    type: 'admin',
    roles: ['admin'],
  },
  process.env.JWT_SECRET,
  { expiresIn: '15m' },
);

describe('Admin runtime routes', () => {
  beforeEach(() => {
    configureRateLimitMetrics({ windowMs: 600, max: 10 });
    resetRateLimitMetrics();
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/admin/runtime/health');
    expect(response.status).toBe(401);
  });

  it('rejects non-admin access', async () => {
    const userToken = jwt.sign({ id: 5, type: 'user', roles: ['user'] }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const response = await request(app)
      .get('/api/admin/runtime/health')
      .set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(403);
  });

  it('returns runtime snapshot for admins', async () => {
    recordRateLimitAttempt({ key: 'ip:worker', method: 'GET', path: '/api/sample' });
    recordRateLimitSuccess({ key: 'ip:worker' });

    const response = await request(app)
      .get('/api/admin/runtime/health')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('rateLimit');
    expect(response.body.rateLimit).toHaveProperty('currentWindow');
    expect(response.body.rateLimit.currentWindow).toHaveProperty('hits');
    expect(response.body.readiness).toHaveProperty('status');
  });

  it('allows admins to list maintenance announcements', async () => {
    await createAnnouncement({
      title: 'Provider payout pause',
      message: 'Escrow reconciliation underway for regulatory audit.',
      status: 'active',
      severity: 'incident',
      audiences: ['operations', 'provider'],
      channels: ['web'],
      startsAt: new Date(Date.now() - 10 * 60 * 1000),
      endsAt: new Date(Date.now() + 50 * 60 * 1000),
    });

    const response = await request(app)
      .get('/api/admin/runtime/maintenance')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.records)).toBe(true);
    expect(response.body.records).toHaveLength(1);
    expect(response.body.records[0].title).toContain('Provider payout pause');
  });

  it('enables admins to create and update maintenance windows', async () => {
    const creation = await request(app)
      .post('/api/admin/runtime/maintenance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Realtime gateway upgrade',
        message: 'Realtime gateway will recycle to enable zero-copy fanout.',
        status: 'scheduled',
        severity: 'maintenance',
        audiences: ['public'],
        channels: ['mobile'],
        startsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      });

    expect(creation.status).toBe(201);
    expect(creation.body.slug).toContain('realtime-gateway-upgrade');

    const announcementId = creation.body.slug;

    const statusUpdate = await request(app)
      .patch(`/api/admin/runtime/maintenance/${announcementId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'resolved' });

    expect(statusUpdate.status).toBe(200);
    expect(statusUpdate.body.status).toBe('resolved');

    const fetchResponse = await request(app)
      .get(`/api/admin/runtime/maintenance/${announcementId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.status).toBe('resolved');
  });
});

