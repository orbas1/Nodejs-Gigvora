import {
  sequelize,
  Notification,
  NotificationPreference,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  DIGEST_FREQUENCIES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const LIST_CACHE_TTL = 20;

function assertCategory(category) {
  if (!NOTIFICATION_CATEGORIES.includes(category)) {
    throw new ValidationError(`Unsupported notification category "${category}".`);
  }
}

function assertPriority(priority) {
  if (!NOTIFICATION_PRIORITIES.includes(priority)) {
    throw new ValidationError(`Unsupported notification priority "${priority}".`);
  }
}

function assertStatus(status) {
  if (!NOTIFICATION_STATUSES.includes(status)) {
    throw new ValidationError(`Unsupported notification status "${status}".`);
  }
}

function parseTimeToMinutes(value) {
  if (!value) return null;
  const [hourString, minuteString] = value.split(':');
  const hour = Number.parseInt(hourString, 10);
  const minute = Number.parseInt(minuteString, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function getMinutesInTimezone(timeZone) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const formatted = formatter.format(new Date());
  const [hourString, minuteString] = formatted.split(':');
  return Number.parseInt(hourString, 10) * 60 + Number.parseInt(minuteString, 10);
}

function isWithinQuietHours(preference) {
  if (!preference?.quietHoursStart || !preference?.quietHoursEnd) {
    return false;
  }
  const start = parseTimeToMinutes(preference.quietHoursStart);
  const end = parseTimeToMinutes(preference.quietHoursEnd);
  if (start == null || end == null) return false;
  const timeZone = preference.metadata?.timezone || 'UTC';
  const nowMinutes = getMinutesInTimezone(timeZone);
  if (start < end) {
    return nowMinutes >= start && nowMinutes < end;
  }
  // Window spans midnight
  return nowMinutes >= start || nowMinutes < end;
}

function computeDeliveryChannels(preference) {
  return {
    email: preference?.emailEnabled !== false,
    push: preference?.pushEnabled !== false,
    sms: preference?.smsEnabled === true,
    inApp: preference?.inAppEnabled !== false,
  };
}

function sanitizeNotification(notification) {
  if (!notification) return null;
  return notification.toPublicObject();
}

function flushNotificationCache(userId) {
  appCache.flushByPrefix(`notifications:list:${userId}`);
}

export async function queueNotification(payload, { bypassQuietHours = false } = {}) {
  const { userId, category = 'system', priority = 'normal', title, type, body, payload: eventPayload, expiresAt } = payload;
  if (!userId) {
    throw new ValidationError('userId is required to dispatch a notification.');
  }
  if (!title || !type) {
    throw new ValidationError('title and type are required fields.');
  }
  assertCategory(category);
  assertPriority(priority);

  const notification = await sequelize.transaction(async (trx) => {
    const preference = await NotificationPreference.findOne({ where: { userId }, transaction: trx });
    const channels = computeDeliveryChannels(preference);
    const quietHours = !bypassQuietHours && isWithinQuietHours(preference);
    const inAppEnabled = channels.inApp;
    const status = inAppEnabled ? (quietHours ? 'pending' : 'delivered') : 'dismissed';

    const created = await Notification.create(
      {
        userId,
        category,
        priority,
        type,
        title,
        body: body ?? null,
        payload: {
          ...(eventPayload && typeof eventPayload === 'object' ? eventPayload : {}),
          channels,
          bypassQuietHours,
        },
        status,
        deliveredAt: status === 'delivered' ? new Date() : null,
        expiresAt: expiresAt ?? null,
      },
      { transaction: trx },
    );

    return created;
  });

  flushNotificationCache(userId);

  return sanitizeNotification(notification);
}

export async function listNotifications(userId, filters = {}, pagination = {}) {
  const { page = 1, pageSize = 25 } = pagination;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeSize = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
  const offset = (safePage - 1) * safeSize;

  const cacheKey = buildCacheKey(`notifications:list:${userId}`, { filters, safePage, safeSize });

  return appCache.remember(cacheKey, LIST_CACHE_TTL, async () => {
    const where = { userId };
    if (filters.category) {
      assertCategory(filters.category);
      where.category = filters.category;
    }
    if (filters.status) {
      assertStatus(filters.status);
      where.status = filters.status;
    }

    const { rows, count } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: safeSize,
      offset,
    });

    return {
      data: rows.map((notification) => sanitizeNotification(notification)),
      pagination: {
        page: safePage,
        pageSize: safeSize,
        total: count,
        totalPages: Math.ceil(count / safeSize) || 1,
      },
    };
  });
}

export async function markAsRead(notificationId, userId) {
  const notification = await Notification.findOne({ where: { id: notificationId, userId } });
  if (!notification) {
    throw new NotFoundError('Notification not found.');
  }

  notification.status = 'read';
  notification.readAt = new Date();
  await notification.save();

  flushNotificationCache(userId);
  return sanitizeNotification(notification);
}

export async function dismissNotification(notificationId, userId) {
  const notification = await Notification.findOne({ where: { id: notificationId, userId } });
  if (!notification) {
    throw new NotFoundError('Notification not found.');
  }

  notification.status = 'dismissed';
  await notification.save();

  flushNotificationCache(userId);
  return sanitizeNotification(notification);
}

export async function upsertPreferences(userId, patch) {
  if (!userId) {
    throw new ValidationError('userId is required.');
  }
  if (patch.digestFrequency && !DIGEST_FREQUENCIES.includes(patch.digestFrequency)) {
    throw new ValidationError('Unsupported digestFrequency value.');
  }

  const preference = await sequelize.transaction(async (trx) => {
    const [record] = await NotificationPreference.findOrCreate({
      where: { userId },
      defaults: {
        userId,
      },
      transaction: trx,
    });

    Object.assign(record, {
      emailEnabled: patch.emailEnabled ?? record.emailEnabled,
      pushEnabled: patch.pushEnabled ?? record.pushEnabled,
      smsEnabled: patch.smsEnabled ?? record.smsEnabled,
      inAppEnabled: patch.inAppEnabled ?? record.inAppEnabled,
      digestFrequency: patch.digestFrequency ?? record.digestFrequency,
      quietHoursStart: patch.quietHoursStart ?? record.quietHoursStart,
      quietHoursEnd: patch.quietHoursEnd ?? record.quietHoursEnd,
      metadata: {
        ...(record.metadata ?? {}),
        ...(patch.metadata && typeof patch.metadata === 'object' ? patch.metadata : {}),
      },
    });

    await record.save({ transaction: trx });
    return record;
  });

  flushNotificationCache(userId);

  return preference.get({ plain: true });
}

export default {
  queueNotification,
  listNotifications,
  markAsRead,
  dismissNotification,
  upsertPreferences,
};
