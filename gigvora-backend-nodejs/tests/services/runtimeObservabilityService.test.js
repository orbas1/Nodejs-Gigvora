process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { describe, it, expect, beforeEach } from '@jest/globals';
import '../setupTestEnv.js';
import { configureRateLimitMetrics, resetRateLimitMetrics, recordRateLimitAttempt, recordRateLimitSuccess } from '../../src/observability/rateLimitMetrics.js';
import {
  getRuntimeOperationalSnapshot,
  __testing as observabilityTesting,
} from '../../src/services/runtimeObservabilityService.js';
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
    expect(snapshot.realtime).toMatchObject({
      generatedAt: expect.any(String),
      enabled: expect.any(Boolean),
      connectedUsers: expect.any(Number),
      activeSockets: expect.any(Number),
    });
    expect(snapshot.workers).toMatchObject({
      generatedAt: expect.any(String),
      totalWorkers: expect.any(Number),
      workers: expect.any(Array),
    });
  });

  it('summarises worker telemetry into attention states', () => {
    const { summariseWorkerTelemetry, buildWorkerOverview, buildRealtimeOverview } = observabilityTesting;
    const workerSummary = summariseWorkerTelemetry({
      name: 'profileEngagement',
      metrics: {
        pending: 150,
        stuck: 2,
        failed: 1,
        intervalMs: 30000,
        generatedAt: '2024-05-20T00:00:00.000Z',
      },
      metadata: { intervalMs: 30000 },
    });

    expect(workerSummary).toMatchObject({
      name: 'profileEngagement',
      status: 'attention',
      queue: { pending: 150, stuck: 2, failed: 1 },
    });
    expect(workerSummary.attentionReasons).toEqual(
      expect.arrayContaining(['high-pending', 'stuck-jobs', 'failed-jobs']),
    );

    const overview = buildWorkerOverview([
      { name: 'profileEngagement', metrics: { pending: 0 } },
      { name: 'newsAggregation', metrics: { pending: 5, isRunning: false } },
    ]);

    expect(overview.totalWorkers).toBe(2);
    expect(overview.degraded).toBe(1);

    const realtime = buildRealtimeOverview({
      registry: {
        describe: () => ({ users: 2, sockets: 10, maxConnectionsPerUser: 3 }),
      },
      io: null,
      runtimeConfig: { realtime: { enabled: true, connection: { maxConnectionsPerUser: 3 } } },
    });

    expect(realtime.enabled).toBe(false);
    expect(realtime.anomalies).toEqual(
      expect.arrayContaining(['server-not-initialised', 'connection-limit-breached']),
    );
    expect(realtime.connectedUsers).toBe(2);
    expect(realtime.activeSockets).toBe(10);
  });
});

