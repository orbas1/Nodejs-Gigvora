import { describe, it, expect } from '@jest/globals';
import './setupTestEnv.js';
import {
  queueNotification,
  listNotifications,
  markAsRead,
  dismissNotification,
  upsertPreferences,
} from '../src/services/notificationService.js';
import { createUser } from './helpers/factories.js';

describe('notificationService', () => {
  it('respects quiet hours preferences and updates notification lifecycle', async () => {
    const user = await createUser({ email: 'notifications@gigvora.test' });

    const preference = await upsertPreferences(user.id, {
      emailEnabled: true,
      smsEnabled: false,
      digestFrequency: 'daily',
      quietHoursStart: '00:00',
      quietHoursEnd: '23:59',
      metadata: { timezone: 'UTC' },
    });

    expect(preference).toMatchObject({
      userId: user.id,
      digestFrequency: 'daily',
      quietHoursStart: '00:00',
    });

    const pendingNotification = await queueNotification(
      {
        userId: user.id,
        category: 'message',
        priority: 'high',
        type: 'MESSAGE_NEW',
        title: 'You have a new message',
        body: 'Review the latest update from your project partner.',
      },
      { bypassQuietHours: false },
    );

    expect(pendingNotification).toMatchObject({
      userId: user.id,
      status: 'pending',
    });

    const deliveredNotification = await queueNotification(
      {
        userId: user.id,
        category: 'system',
        type: 'DAILY_DIGEST',
        title: 'Daily digest ready',
      },
      { bypassQuietHours: true },
    );

    expect(deliveredNotification.status).toBe('delivered');
    expect(deliveredNotification.payload).toMatchObject({ bypassQuietHours: true });

    const notifications = await listNotifications(user.id, {}, { pageSize: 10 });
    expect(notifications.data).toHaveLength(2);
    expect(notifications.pagination.total).toBe(2);

    const marked = await markAsRead(deliveredNotification.id, user.id);
    expect(marked.status).toBe('read');
    expect(marked.readAt).toBeInstanceOf(Date);

    const dismissed = await dismissNotification(pendingNotification.id, user.id);
    expect(dismissed.status).toBe('dismissed');
  });
});
