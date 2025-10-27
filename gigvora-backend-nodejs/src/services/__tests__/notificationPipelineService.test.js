import { jest } from '@jest/globals';

const resolveModule = (relativePath) => new URL(relativePath, import.meta.url).pathname;

describe('notificationPipelineService', () => {
  let service;
  const Notification = {
    count: jest.fn(),
    findAll: jest.fn(),
  };
  const NotificationPreference = {
    findAll: jest.fn(),
  };
  const queueNotification = jest.fn();
  const sanitizeNotification = jest.fn((value) => value);
  const getSystemSettings = jest.fn();
  const loggerInfo = jest.fn();

  beforeEach(async () => {
    jest.resetModules();
    Notification.count.mockImplementation(({ where } = {}) => {
      if (!where) {
        return 12;
      }
      if (where.status === 'pending') {
        return 3;
      }
      if (where.status === 'delivered') {
        return 5;
      }
      if (where.status === 'read') {
        return 2;
      }
      if (where.status === 'dismissed') {
        return 2;
      }
      if (where.priority === 'critical') {
        return 1;
      }
      return 0;
    });
    const recentNotifications = [
      {
        id: 1,
        userId: 10,
        status: 'delivered',
        createdAt: '2025-05-01T10:00:00.000Z',
        deliveredAt: '2025-05-01T10:01:00.000Z',
        payload: { campaignId: 'ops-alert' },
      },
      {
        id: 2,
        userId: 11,
        status: 'pending',
        createdAt: '2025-05-01T11:00:00.000Z',
        payload: {},
      },
    ];
    const deliveredSamples = [
      {
        id: 3,
        userId: 12,
        status: 'delivered',
        createdAt: '2025-05-01T09:58:00.000Z',
        deliveredAt: '2025-05-01T09:59:30.000Z',
        payload: {},
      },
    ];
    Notification.findAll.mockImplementationOnce(() => recentNotifications).mockImplementationOnce(() => deliveredSamples);
    NotificationPreference.findAll.mockResolvedValue([
      {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        digestFrequency: 'daily',
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
        updatedAt: '2025-04-30T23:00:00.000Z',
      },
      {
        emailEnabled: false,
        pushEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        digestFrequency: 'immediate',
        quietHoursStart: null,
        quietHoursEnd: null,
        updatedAt: '2025-04-29T16:00:00.000Z',
      },
    ]);
    getSystemSettings.mockResolvedValue({
      notifications: {
        emailProvider: 'resend',
        smsProvider: 'twilio',
        broadcastChannels: ['email', 'push', 'slack'],
        incidentWebhookUrl: 'https://hooks.slack.com/ops',
      },
    });

    jest.unstable_mockModule(resolveModule('../notificationService.js'), () => ({
      queueNotification,
      sanitizeNotification,
    }));
    jest.unstable_mockModule(resolveModule('../systemSettingsService.js'), () => ({ getSystemSettings }));
    jest.unstable_mockModule(resolveModule('../../utils/logger.js'), () => ({
      default: { info: loggerInfo },
    }));
    jest.unstable_mockModule(resolveModule('../../models/index.js'), () => ({
      Notification,
      NotificationPreference,
    }));

    service = await import('../notificationPipelineService.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('builds a notification pipeline snapshot with counts and channel summary', async () => {
    const snapshot = await service.getNotificationPipelineSnapshot({ limit: 5 });

    expect(Notification.count).toHaveBeenCalled();
    expect(Notification.findAll).toHaveBeenCalledTimes(2);
    expect(NotificationPreference.findAll).toHaveBeenCalledTimes(1);
    expect(snapshot.totals.total).toBe(12);
    expect(snapshot.totals.pending).toBe(3);
    expect(snapshot.channels.totalPreferences).toBe(2);
    expect(snapshot.channels.digest).toMatchObject({ daily: 1, immediate: 1 });
    expect(snapshot.campaigns[0].campaignId).toBe('ops-alert');
    expect(snapshot.systemConfig.providers.email).toBe('resend');
    expect(snapshot.recent).toHaveLength(2);
  });

  it('queues operational notifications for unique recipients', async () => {
    queueNotification.mockResolvedValueOnce({ id: 100, userId: 10 }).mockResolvedValueOnce({ id: 101, userId: 11 });

    const result = await service.queueOperationalNotification(
      {
        recipients: [10, '11', '10'],
        title: 'Runtime maintenance',
        type: 'ops.runtime',
        body: 'We are performing maintenance.',
        campaignId: 'ops-alert',
      },
      { actor: { reference: 'admin:ops' } },
    );

    expect(queueNotification).toHaveBeenCalledTimes(2);
    expect(queueNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 10, title: 'Runtime maintenance', type: 'ops.runtime' }),
      { bypassQuietHours: false },
    );
    expect(loggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'notifications.campaign_queued',
        actor: 'admin:ops',
        campaignId: 'ops-alert',
      }),
      'Operational notification campaign queued',
    );
    expect(result.queuedCount).toBe(2);
  });
});
