import { Op } from 'sequelize';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import { Notification, NotificationPreference } from '../models/index.js';
import { queueNotification, sanitizeNotification } from './notificationService.js';
import { getSystemSettings } from './systemSettingsService.js';

function coerceRecipientList(recipients) {
  const values = Array.isArray(recipients) ? recipients : [recipients];
  return Array.from(
    new Set(
      values
        .map((value) => {
          const parsed = Number.parseInt(`${value}`, 10);
          return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
        })
        .filter((value) => value != null),
    ),
  );
}

function computeAverageDeliverySeconds(records) {
  if (!records?.length) {
    return null;
  }
  let totalSeconds = 0;
  let count = 0;
  records.forEach((record) => {
    const createdAt = record.createdAt ?? record.get?.('createdAt');
    const deliveredAt = record.deliveredAt ?? record.get?.('deliveredAt');
    const created = createdAt ? new Date(createdAt).getTime() : Number.NaN;
    const delivered = deliveredAt ? new Date(deliveredAt).getTime() : Number.NaN;
    if (Number.isFinite(created) && Number.isFinite(delivered) && delivered >= created) {
      totalSeconds += (delivered - created) / 1000;
      count += 1;
    }
  });
  if (!count) {
    return null;
  }
  return totalSeconds / count;
}

function summarisePreferences(records = []) {
  const summary = {
    total: records.length,
    emailEnabled: 0,
    pushEnabled: 0,
    smsEnabled: 0,
    inAppEnabled: 0,
    quietHoursConfigured: 0,
    digest: {},
    lastUpdatedAt: null,
  };

  records.forEach((record) => {
    if (record.emailEnabled) summary.emailEnabled += 1;
    if (record.pushEnabled) summary.pushEnabled += 1;
    if (record.smsEnabled) summary.smsEnabled += 1;
    if (record.inAppEnabled ?? true) summary.inAppEnabled += 1;
    if (record.quietHoursStart || record.quietHoursEnd) summary.quietHoursConfigured += 1;
    const frequency = record.digestFrequency ?? 'immediate';
    summary.digest[frequency] = (summary.digest[frequency] ?? 0) + 1;
    const updatedAt = record.updatedAt ? new Date(record.updatedAt).toISOString() : null;
    if (updatedAt && (!summary.lastUpdatedAt || updatedAt > summary.lastUpdatedAt)) {
      summary.lastUpdatedAt = updatedAt;
    }
  });

  return summary;
}

function buildCampaignSummary(records = []) {
  const campaigns = new Map();
  records.forEach((record) => {
    const payload = record.payload && typeof record.payload === 'object' ? record.payload : {};
    const campaignId = payload.campaignId ?? payload.campaign_id ?? null;
    if (!campaignId) {
      return;
    }
    const existing = campaigns.get(campaignId) ?? {
      campaignId,
      total: 0,
      delivered: 0,
      lastSentAt: null,
    };
    existing.total += 1;
    if (record.status === 'delivered' || record.status === 'read') {
      existing.delivered += 1;
    }
    const createdAt = record.createdAt ? new Date(record.createdAt).toISOString() : null;
    if (createdAt && (!existing.lastSentAt || createdAt > existing.lastSentAt)) {
      existing.lastSentAt = createdAt;
    }
    campaigns.set(campaignId, existing);
  });
  return Array.from(campaigns.values())
    .sort((a, b) => (b.lastSentAt ?? '').localeCompare(a.lastSentAt ?? ''))
    .slice(0, 8);
}

export async function getNotificationPipelineSnapshot({ limit = 25 } = {}) {
  const fetchLimit = Math.max(limit, 25);
  const [
    total,
    pending,
    delivered,
    read,
    dismissed,
    criticalOpen,
    recentRecords,
    deliverySamples,
    preferenceRecords,
    systemSettings,
  ] = await Promise.all([
    Notification.count(),
    Notification.count({ where: { status: 'pending' } }),
    Notification.count({ where: { status: 'delivered' } }),
    Notification.count({ where: { status: 'read' } }),
    Notification.count({ where: { status: 'dismissed' } }),
    Notification.count({ where: { priority: 'critical', status: { [Op.ne]: 'dismissed' } } }),
    Notification.findAll({ order: [['createdAt', 'DESC']], limit: fetchLimit }),
    Notification.findAll({
      where: { deliveredAt: { [Op.ne]: null } },
      order: [['deliveredAt', 'DESC']],
      limit: 40,
    }),
    NotificationPreference.findAll({
      attributes: [
        'emailEnabled',
        'pushEnabled',
        'smsEnabled',
        'inAppEnabled',
        'digestFrequency',
        'quietHoursStart',
        'quietHoursEnd',
        'updatedAt',
      ],
      raw: true,
    }),
    getSystemSettings(),
  ]);

  const averageDeliverySeconds = computeAverageDeliverySeconds(deliverySamples);
  const preferenceSummary = summarisePreferences(preferenceRecords);
  const sanitizedRecent = recentRecords.map((record) => sanitizeNotification(record));
  const campaigns = buildCampaignSummary(sanitizedRecent);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      total,
      pending,
      delivered,
      read,
      dismissed,
      unread: pending + delivered,
      criticalOpen,
    },
    averages: {
      deliverySeconds: averageDeliverySeconds,
    },
    channels: {
      totalPreferences: preferenceSummary.total,
      emailEnabled: preferenceSummary.emailEnabled,
      pushEnabled: preferenceSummary.pushEnabled,
      smsEnabled: preferenceSummary.smsEnabled,
      inAppEnabled: preferenceSummary.inAppEnabled,
      quietHoursConfigured: preferenceSummary.quietHoursConfigured,
      digest: preferenceSummary.digest,
      lastUpdatedAt: preferenceSummary.lastUpdatedAt,
    },
    recent: sanitizedRecent.slice(0, limit),
    campaigns,
    systemConfig: {
      providers: {
        email: systemSettings?.notifications?.emailProvider ?? null,
        sms: systemSettings?.notifications?.smsProvider ?? null,
      },
      broadcastChannels: Array.isArray(systemSettings?.notifications?.broadcastChannels)
        ? systemSettings.notifications.broadcastChannels
        : [],
      incidentWebhookUrl: systemSettings?.notifications?.incidentWebhookUrl ?? null,
    },
  };
}

export async function queueOperationalNotification(payload = {}, { actor } = {}) {
  const recipients = coerceRecipientList(payload.recipients ?? payload.users ?? []);
  if (recipients.length === 0) {
    throw new ValidationError('At least one recipient is required for an operational notification.');
  }
  const title = `${payload.title ?? ''}`.trim();
  const type = `${payload.type ?? ''}`.trim();
  if (!title || !type) {
    throw new ValidationError('Notification title and type are required fields.');
  }

  const category = (payload.category ?? 'system').toString().trim() || 'system';
  const priority = (payload.priority ?? 'normal').toString().trim() || 'normal';
  const campaignId = payload.campaignId ?? payload.campaign_id ?? null;
  const bypassQuietHours = Boolean(payload.bypassQuietHours);
  const campaignMetadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
  const extraPayload = payload.payload && typeof payload.payload === 'object' ? payload.payload : {};

  const queued = [];
  for (const userId of recipients) {
    const notification = await queueNotification(
      {
        userId,
        category,
        type,
        title,
        body: payload.body ?? null,
        priority,
        payload: {
          ...extraPayload,
          campaignId,
          campaignMetadata,
          triggeredBy: actor?.reference ?? 'system',
        },
        expiresAt: payload.expiresAt ?? null,
      },
      { bypassQuietHours },
    );
    queued.push(notification);
  }

  logger.info(
    {
      event: 'notifications.campaign_queued',
      actor: actor?.reference ?? 'system',
      campaignId,
      recipientCount: recipients.length,
      priority,
    },
    'Operational notification campaign queued',
  );

  return {
    queuedCount: queued.length,
    campaignId,
    notifications: queued,
  };
}

export default {
  getNotificationPipelineSnapshot,
  queueOperationalNotification,
};
