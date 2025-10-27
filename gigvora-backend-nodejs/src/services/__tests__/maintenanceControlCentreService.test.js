import {
  MaintenanceFeedbackSnapshot,
  MaintenanceOperationalSnapshot,
  MaintenanceWindow,
  MaintenanceBroadcastLog,
} from '../../models/maintenanceControlCentreModels.js';
import {
  getMaintenanceDashboardSnapshot,
  createMaintenanceWindow,
  updateMaintenanceWindow,
  deleteMaintenanceWindow,
  sendMaintenanceBroadcast,
} from '../maintenanceControlCentreService.js';

describe('maintenanceControlCentreService', () => {

  it('returns maintenance dashboard snapshot with feedback and windows', async () => {
    const capturedAt = new Date();
    const feedback = await MaintenanceFeedbackSnapshot.create({
      capturedAt,
      experienceScore: 4.7,
      trendDelta: 0.3,
      queueDepth: 7,
      queueTarget: 5,
      medianResponseMinutes: 4,
      totalResponses: 321,
      sentimentNarrative: 'Customers remain confident; keep reinforcing proactive comms.',
      reviewUrl: 'https://gigvora.com/ops/reviews',
      segments: [{ id: 'enterprise', label: 'Enterprise', score: 4.9, delta: 0.4 }],
      highlights: [{ id: 'h1', persona: 'CX Lead', sentiment: 'Positive', quote: 'Excellent comms', recordedAt: capturedAt }],
      alerts: [{ id: 'a1', severity: 'caution', message: 'Queue depth above target' }],
      responseBreakdown: [{ id: 'web', label: 'Web', percentage: 52 }],
      topDrivers: ['Real-time status page updates build trust.'],
    });

    await MaintenanceOperationalSnapshot.create({
      slug: 'ops-status',
      title: 'Operational',
      summary: 'All systems performing within target.',
      severity: 'operational',
      impactSurface: 'Platform',
      capturedAt,
      nextUpdateAt: new Date(capturedAt.getTime() + 30 * 60 * 1000),
      metrics: { uptime: 99.99, latencyP95: 180, errorRate: 0.001, activeIncidents: 0 },
      incidents: [{ id: 'inc-1', title: 'Rehearsal', status: 'resolved', startedAt: capturedAt }],
      channels: [{ id: 'status-page', label: 'Status page' }],
      warnings: [{ id: 'warn-1', message: 'Confirm vendor standby rotations.' }],
      escalations: [{ id: 'esc-1', label: 'Review failover doc', dueAt: capturedAt }],
      impacts: [{ id: 'impact-1', label: 'Member feed', severity: 'notice', degradation: 0.1 }],
      maintenanceWindow: {
        id: 'window-1',
        label: 'Database failover test',
        phase: 'scheduled',
        startAt: capturedAt,
        endAt: new Date(capturedAt.getTime() + 60 * 60 * 1000),
        nextUpdateAt: new Date(capturedAt.getTime() + 45 * 60 * 1000),
        timezone: 'UTC',
      },
      feedbackSnapshotId: feedback.id,
    });

    await MaintenanceWindow.create({
      title: 'Cache refresh',
      owner: 'SRE',
      impact: 'Edge cache',
      startAt: new Date('2025-04-01T10:00:00Z'),
      endAt: new Date('2025-04-01T11:00:00Z'),
      channels: ['status-page', 'email'],
      notificationLeadMinutes: 90,
    });

    const snapshot = await getMaintenanceDashboardSnapshot();

    expect(snapshot.status.title).toBe('Operational');
    expect(snapshot.status.feedback.experienceScore).toBeCloseTo(4.7);
    expect(snapshot.status.feedback.totalResponses).toBe(321);
    expect(snapshot.status.metrics.uptime).toBeCloseTo(99.99);
    expect(snapshot.status.nextUpdateAt).toBeTruthy();
    expect(snapshot.status.impacts).toHaveLength(1);
    expect(snapshot.windows).toHaveLength(1);
    expect(snapshot.windows[0].channels).toEqual(['status-page', 'email']);
  });

  it('creates, updates, and deletes maintenance windows with channel normalisation', async () => {
    const created = await createMaintenanceWindow(
      {
        title: 'API gateway upgrade',
        owner: 'Platform',
        impact: 'Public API',
        startAt: new Date('2025-04-05T05:00:00Z'),
        endAt: new Date('2025-04-05T06:30:00Z'),
        channels: ['Email', 'Slack'],
        notificationLeadMinutes: 45,
      },
      { actor: { email: 'ops@gigvora.com' } },
    );

    expect(created.channels).toEqual(['email', 'slack']);

    const updated = await updateMaintenanceWindow(
      created.id,
      {
        channels: ['slack', 'status-page'],
        notificationLeadMinutes: 60,
      },
      { actor: { name: 'Ops Captain' } },
    );

    expect(updated.channels).toEqual(['slack', 'status-page']);
    expect(updated.notificationLeadMinutes).toBe(60);

    await deleteMaintenanceWindow(created.id);
    const windowsRemaining = await MaintenanceWindow.count();
    expect(windowsRemaining).toBe(0);
  });

  it('records maintenance broadcasts with sanitised payloads', async () => {
    const broadcast = await sendMaintenanceBroadcast(
      {
        channels: ['Email', 'Slack'],
        audience: 'Customers',
        subject: 'Scheduled maintenance',
        body: 'We are upgrading infrastructure to improve reliability.',
        includeTimeline: true,
        includeStatusPage: true,
      },
      { actor: { email: 'ops@gigvora.com' } },
    );

    expect(broadcast.channels).toEqual(['email', 'slack']);
    expect(broadcast.audience).toBe('customers');
    expect(broadcast.includeTimeline).toBe(true);

    const record = await MaintenanceBroadcastLog.findByPk(broadcast.id);
    expect(record).not.toBeNull();
  });
});
