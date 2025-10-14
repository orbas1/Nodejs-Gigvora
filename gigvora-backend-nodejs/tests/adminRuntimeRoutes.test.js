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
});

