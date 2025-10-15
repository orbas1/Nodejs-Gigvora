process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { describe, it, expect, beforeEach } from '@jest/globals';
import '../setupTestEnv.js';
import { configureRateLimitMetrics, resetRateLimitMetrics, recordRateLimitAttempt, recordRateLimitSuccess } from '../../src/observability/rateLimitMetrics.js';
import { getRuntimeOperationalSnapshot } from '../../src/services/runtimeObservabilityService.js';
import { createAnnouncement } from '../../src/services/runtimeMaintenanceService.js';

describe('runtimeObservabilityService', () => {
  beforeEach(() => {
    configureRateLimitMetrics({ windowMs: 500, max: 3 });
  });

  it('returns readiness, liveness, and rate limit telemetry', async () => {
    await createAnnouncement({
      title: 'Database maintenance',
      message: 'Primary cluster failover to apply security patches.',
      status: 'active',
      severity: 'maintenance',
      startsAt: new Date(Date.now() - 5 * 60 * 1000),
      endsAt: new Date(Date.now() + 25 * 60 * 1000),
      audiences: ['public', 'operations'],
      channels: ['mobile', 'web'],
    });

    recordRateLimitAttempt({ key: 'ip:monitor', method: 'GET', path: '/api/ping' });
    recordRateLimitSuccess({ key: 'ip:monitor' });

    const snapshot = await getRuntimeOperationalSnapshot();
    expect(snapshot).toMatchObject({
      generatedAt: expect.any(String),
      readiness: expect.any(Object),
      liveness: expect.any(Object),
      rateLimit: expect.any(Object),
      environment: expect.any(Object),
      maintenance: expect.any(Object),
    });
    expect(snapshot.rateLimit.currentWindow.hits).toBeGreaterThanOrEqual(1);
    expect(snapshot.environment).toHaveProperty('nodeEnv');
    expect(snapshot.maintenance.counts.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.maintenance.highestSeverity?.severity).toBe('maintenance');
  });

  it('respects resets when computing telemetry', async () => {
    recordRateLimitAttempt({ key: 'ip:reset', method: 'GET', path: '/api/reset' });
    resetRateLimitMetrics();
    const snapshot = await getRuntimeOperationalSnapshot();
    expect(snapshot.rateLimit.currentWindow.hits).toBe(0);
    expect(snapshot.rateLimit.topConsumers).toHaveLength(0);
  });
});

