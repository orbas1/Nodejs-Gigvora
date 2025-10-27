process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import '../setupTestEnv.js';

const runtimeServiceUrl = new URL('../../src/services/runtimeObservabilityService.js', import.meta.url);
const telemetryServiceUrl = new URL('../../src/services/liveServiceTelemetryService.js', import.meta.url);

const runtimeSnapshot = {
  generatedAt: '2024-05-01T12:00:00.000Z',
  environment: { uptimeSeconds: 3_600, nodeEnv: 'test' },
  readiness: {
    status: 'degraded',
    http: { status: 'ready', port: 443 },
    uptimeSeconds: 3_600,
    dependencies: {
      counts: { ok: 4, degraded: 1, error: 1, disabled: 0, unknown: 0 },
      nodes: [
        { name: 'database', status: 'error', updatedAt: '2024-05-01T11:59:00.000Z', error: { message: 'connection lost' } },
        { name: 'cache', status: 'degraded', updatedAt: '2024-05-01T11:58:00.000Z', error: null },
      ],
      total: 6,
    },
    workers: {
      counts: { ok: 2, degraded: 0, error: 1, disabled: 0, unknown: 0 },
      nodes: [
        { name: 'queue:email', status: 'error', updatedAt: '2024-05-01T11:57:00.000Z', error: { message: 'timeout' } },
      ],
      total: 3,
    },
  },
  rateLimit: {
    config: { max: 100 },
    currentWindow: {
      hits: 180,
      blocked: 12,
      blockedRatio: 0.066,
      requestsPerSecond: 35,
      busiestKey: { key: 'partner-api', hits: 95, allowed: 90, blocked: 5, lastSeenAt: '2024-05-01T11:59:30.000Z' },
      approachingLimit: [
        { key: 'partner-api', hits: 95, utilisation: 0.95, lastSeenAt: '2024-05-01T11:59:30.000Z' },
        { key: 'internal-job', hits: 83, utilisation: 0.83, lastSeenAt: '2024-05-01T11:59:20.000Z' },
        { key: 'legacy-client', hits: 82, utilisation: 0.82, lastSeenAt: '2024-05-01T11:59:10.000Z' },
      ],
    },
    topConsumers: [
      { key: 'partner-api', hits: 140, blocked: 8, allowed: 132, routes: [], lastSeenAt: '2024-05-01T11:59:30.000Z' },
    ],
  },
  databasePool: {
    vendor: 'postgres',
    max: 20,
    borrowed: 18,
    available: 2,
    pending: 4,
    updatedAt: '2024-05-01T11:59:50.000Z',
    lastEvent: 'acquire',
  },
  maintenance: {
    announcements: [],
    counts: { total: 1 },
    highestSeverity: { severity: 'maintenance', slug: 'db-upgrade', status: 'active' },
  },
  scheduledMaintenance: {
    active: [
      {
        id: 'window-1',
        summary: 'Database upgrade',
        impact: 'Database',
        startAt: '2024-05-01T11:30:00.000Z',
        endAt: '2024-05-01T12:30:00.000Z',
      },
    ],
    upcoming: [
      {
        id: 'window-2',
        summary: 'Cache tuning',
        impact: 'Cache',
        startAt: '2024-05-01T18:00:00.000Z',
        endAt: '2024-05-01T19:00:00.000Z',
      },
    ],
    statusPageUrl: 'https://status.gigvora.test',
  },
};

const telemetrySnapshot = {
  generatedAt: '2024-05-01T12:00:00.000Z',
  window: { minutes: 30, since: '2024-05-01T11:30:00.000Z', until: '2024-05-01T12:00:00.000Z' },
  incidentSignals: { severity: 'elevated', notes: ['Support backlog trending upward.'] },
  chat: {
    totalMessages: 220,
    flaggedRatio: 0.22,
    moderationBacklog: 12,
    busiestChannels: [{ threadId: 1, channelSlug: 'community', channelName: 'Community', messageCount: 90 }],
  },
  inbox: {
    openCases: 48,
    awaitingFirstResponse: 6,
    backlogByPriority: { urgent: 3, high: 9, medium: 18, low: 18 },
    breachedSlaCases: 2,
    medianFirstResponseMinutes: 18,
  },
  timeline: {
    windowPublished: 42,
    scheduledNextHour: 9,
    overdue: 2,
    trendingEvents: [{ eventName: 'timeline.publish', count: 120 }],
  },
  analytics: {
    ingestionLagSeconds: 420,
    topEvents: [{ eventName: 'app.login', count: 540 }],
  },
  events: {
    liveNow: [{ id: 1 }],
    startingSoon: [{ id: 2 }],
    cancellationsLastWindow: 1,
    tasksAtRisk: [{ id: 'task-1', title: 'Prep webinar deck' }],
  },
  runbooks: [{ slug: 'ops/latency', title: 'Latency mitigation', channel: 'platform' }],
};

const runtimeServiceMock = {
  getRuntimeOperationalSnapshot: jest.fn(async () => runtimeSnapshot),
};

const telemetryServiceMock = {
  sampleLiveServiceTelemetry: jest.fn(async () => telemetrySnapshot),
};

jest.unstable_mockModule(runtimeServiceUrl.pathname, () => runtimeServiceMock);

jest.unstable_mockModule(telemetryServiceUrl.pathname, () => telemetryServiceMock);

let service;

beforeEach(async () => {
  jest.resetModules();
  runtimeServiceMock.getRuntimeOperationalSnapshot.mockResolvedValue(runtimeSnapshot);
  telemetryServiceMock.sampleLiveServiceTelemetry.mockResolvedValue(telemetrySnapshot);
  ({ default: service } = await import('../../src/services/platformPerformanceWarRoomService.js'));
});

describe('platformPerformanceWarRoomService', () => {
  it('produces a war room snapshot with hotspots and recommendations', async () => {
    const snapshot = await service.getPlatformPerformanceWarRoomSnapshot({ windowMinutes: 30 });
    expect(snapshot.window.minutes).toBe(30);
    expect(snapshot.readiness.status).toBe('degraded');
    expect(snapshot.database.saturation).toBeCloseTo(0.9);
    expect(snapshot.liveServices.chat.flaggedRatio).toBeGreaterThan(0.2 - 0.001);
    expect(snapshot.focus.hotspots.length).toBeGreaterThan(0);
    expect(snapshot.focus.recommendations.length).toBeGreaterThan(0);
    expect(snapshot.healthScore).toBeLessThan(80);
    expect(['critical', 'alert', 'watch', 'stable']).toContain(snapshot.posture);
  });

  it('gracefully degrades when runtime snapshot is unavailable', async () => {
    runtimeServiceMock.getRuntimeOperationalSnapshot.mockRejectedValueOnce(new Error('runtime offline'));

    const snapshot = await service.getPlatformPerformanceWarRoomSnapshot({ windowMinutes: 45 });

    expect(snapshot.window.minutes).toBe(30);
    expect(snapshot.readiness.status).toBe('unknown');
    expect(snapshot.liveServices.chat.totalMessages).toBe(telemetrySnapshot.chat.totalMessages);
    expect(snapshot.healthScore).toBeGreaterThan(70);
    expect(Array.isArray(snapshot.focus.hotspots)).toBe(true);
  });
});
