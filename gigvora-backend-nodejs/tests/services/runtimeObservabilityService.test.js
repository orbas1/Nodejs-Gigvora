import { describe, it, expect, beforeEach } from '@jest/globals';
import '../setupTestEnv.js';
import { configureRateLimitMetrics, resetRateLimitMetrics, recordRateLimitAttempt, recordRateLimitSuccess } from '../../src/observability/rateLimitMetrics.js';
import { getRuntimeOperationalSnapshot } from '../../src/services/runtimeObservabilityService.js';

describe('runtimeObservabilityService', () => {
  beforeEach(() => {
    configureRateLimitMetrics({ windowMs: 500, max: 3 });
  });

  it('returns readiness, liveness, and rate limit telemetry', async () => {
    recordRateLimitAttempt({ key: 'ip:monitor', method: 'GET', path: '/api/ping' });
    recordRateLimitSuccess({ key: 'ip:monitor' });

    const snapshot = await getRuntimeOperationalSnapshot();
    expect(snapshot).toMatchObject({
      generatedAt: expect.any(String),
      readiness: expect.any(Object),
      liveness: expect.any(Object),
      rateLimit: expect.any(Object),
      environment: expect.any(Object),
    });
    expect(snapshot.rateLimit.currentWindow.hits).toBeGreaterThanOrEqual(1);
    expect(snapshot.environment).toHaveProperty('nodeEnv');
  });

  it('respects resets when computing telemetry', async () => {
    recordRateLimitAttempt({ key: 'ip:reset', method: 'GET', path: '/api/reset' });
    resetRateLimitMetrics();
    const snapshot = await getRuntimeOperationalSnapshot();
    expect(snapshot.rateLimit.currentWindow.hits).toBe(0);
    expect(snapshot.rateLimit.topConsumers).toHaveLength(0);
  });
});

