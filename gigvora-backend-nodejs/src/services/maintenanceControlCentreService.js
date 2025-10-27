import {
  MaintenanceOperationalSnapshot,
  MaintenanceFeedbackSnapshot,
  MaintenanceWindow,
  MaintenanceBroadcastLog,
} from '../models/maintenanceControlCentreModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const ALLOWED_CHANNELS = new Set(['status-page', 'email', 'sms', 'in-app', 'push', 'slack']);

function normaliseChannels(raw) {
  if (!raw) {
    return [];
  }
  const values = Array.isArray(raw) ? raw : [raw];
  const cleaned = values
    .map((value) => `${value}`.trim().toLowerCase())
    .filter((value) => value.length > 0 && value.length <= 160)
    .map((value) => (ALLOWED_CHANNELS.size ? (ALLOWED_CHANNELS.has(value) ? value : null) : value))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

function coerceDate(value, { field, required = false } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw new ValidationError(`${field} is required.`);
    }
    return null;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new ValidationError(`${field} must be a valid date.`);
    }
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${field} must be a valid date.`);
  }
  return parsed;
}

function sanitizeWindowPayload(payload = {}) {
  const title = `${payload.title ?? ''}`.trim();
  if (!title) {
    throw new ValidationError('Title is required for a maintenance window.');
  }

  const startAt = coerceDate(payload.startAt, { field: 'startAt', required: true });
  const endAt = payload.endAt ? coerceDate(payload.endAt, { field: 'endAt' }) : null;
  if (endAt && endAt.getTime() <= startAt.getTime()) {
    throw new ValidationError('The maintenance window end time must be after the start time.');
  }

  const notificationLeadMinutes = Number.parseInt(payload.notificationLeadMinutes ?? 60, 10);
  if (!Number.isFinite(notificationLeadMinutes) || notificationLeadMinutes < 0) {
    throw new ValidationError('notificationLeadMinutes must be zero or a positive integer.');
  }

  const channels = normaliseChannels(payload.channels);

  return {
    title,
    owner: payload.owner ? `${payload.owner}`.trim() : null,
    impact: payload.impact ? `${payload.impact}`.trim() : null,
    startAt,
    endAt,
    channels: channels.length ? channels : ['status-page'],
    notificationLeadMinutes,
    rollbackPlan: payload.rollbackPlan ? `${payload.rollbackPlan}`.trim() : null,
  };
}

function serializeWindow(record) {
  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    title: plain.title,
    owner: plain.owner,
    impact: plain.impact,
    startAt: plain.startAt ? plain.startAt.toISOString() : null,
    endAt: plain.endAt ? plain.endAt.toISOString() : null,
    channels: Array.isArray(plain.channels) ? plain.channels : [],
    notificationLeadMinutes: plain.notificationLeadMinutes ?? 0,
    rollbackPlan: plain.rollbackPlan ?? null,
    createdAt: plain.createdAt ? plain.createdAt.toISOString() : null,
    updatedAt: plain.updatedAt ? plain.updatedAt.toISOString() : null,
  };
}

function sanitizeSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }
  const plain = snapshot.get({ plain: true });
  const feedback = plain.feedbackSnapshot ?? null;
  const metrics = typeof plain.metrics === 'object' && plain.metrics ? plain.metrics : {};
  const maintenanceWindow =
    typeof plain.maintenanceWindow === 'object' && plain.maintenanceWindow
      ? plain.maintenanceWindow
      : null;

  return {
    id: plain.id,
    title: plain.title,
    summary: plain.summary,
    severity: plain.severity ?? 'notice',
    impactSurface: plain.impactSurface,
    capturedAt: plain.capturedAt ? new Date(plain.capturedAt).toISOString() : null,
    updatedAt: plain.updatedAt
      ? new Date(plain.updatedAt).toISOString()
      : plain.capturedAt
        ? new Date(plain.capturedAt).toISOString()
        : null,
    acknowledgedAt: plain.acknowledgedAt ? new Date(plain.acknowledgedAt).toISOString() : null,
    acknowledgedBy: plain.acknowledgedBy ?? null,
    incidentRoomUrl: plain.incidentRoomUrl ?? null,
    runbookUrl: plain.runbookUrl ?? null,
    metrics: {
      uptime: Number(metrics.uptime) || null,
      latencyP95: Number(metrics.latencyP95) || null,
      errorRate: Number(metrics.errorRate) || null,
      activeIncidents: Number(metrics.activeIncidents) || 0,
    },
    incidents: Array.isArray(plain.incidents)
      ? plain.incidents.map((incident) => ({
          ...incident,
          startedAt: incident?.startedAt ? new Date(incident.startedAt).toISOString() : null,
        }))
      : [],
    channels: Array.isArray(plain.channels) ? plain.channels : [],
    warnings: Array.isArray(plain.warnings) ? plain.warnings : [],
    escalations: Array.isArray(plain.escalations)
      ? plain.escalations.map((item) => ({
          ...item,
          dueAt: item?.dueAt ? new Date(item.dueAt).toISOString() : null,
        }))
      : [],
    impacts: Array.isArray(plain.impacts)
      ? plain.impacts.map((impact) => ({
          ...impact,
          degradation:
            typeof impact?.degradation === 'number' && Number.isFinite(impact.degradation)
              ? impact.degradation
              : null,
        }))
      : [],
    window: maintenanceWindow
      ? {
          ...maintenanceWindow,
          startAt: maintenanceWindow.startAt
            ? new Date(maintenanceWindow.startAt).toISOString()
            : null,
          endAt: maintenanceWindow.endAt ? new Date(maintenanceWindow.endAt).toISOString() : null,
          nextUpdateAt: maintenanceWindow.nextUpdateAt
            ? new Date(maintenanceWindow.nextUpdateAt).toISOString()
            : null,
        }
      : null,
    nextUpdateAt: plain.nextUpdateAt ? new Date(plain.nextUpdateAt).toISOString() : null,
    feedback: feedback
      ? {
          experienceScore: Number(feedback.experienceScore) || 0,
          trendDelta: Number(feedback.trendDelta) || 0,
          queueDepth: Number(feedback.queueDepth) || 0,
          queueTarget: feedback.queueTarget != null ? Number(feedback.queueTarget) : null,
          medianResponseMinutes: Number(feedback.medianResponseMinutes) || 0,
          lastUpdated: feedback.capturedAt ? new Date(feedback.capturedAt).toISOString() : null,
          reviewUrl: feedback.reviewUrl ?? null,
          totalResponses: Number(feedback.totalResponses) || 0,
          segments: Array.isArray(feedback.segments) ? feedback.segments : [],
          highlights: Array.isArray(feedback.highlights) ? feedback.highlights : [],
          alerts: Array.isArray(feedback.alerts) ? feedback.alerts : [],
          responseBreakdown: Array.isArray(feedback.responseBreakdown)
            ? feedback.responseBreakdown
            : [],
          topDrivers: Array.isArray(feedback.topDrivers) ? feedback.topDrivers : [],
          sentimentNarrative: feedback.sentimentNarrative ?? null,
        }
      : null,
  };
}

export async function getMaintenanceDashboardSnapshot({ includeWindows = true } = {}) {
  const snapshot = await MaintenanceOperationalSnapshot.findOne({
    include: [{ model: MaintenanceFeedbackSnapshot, as: 'feedbackSnapshot' }],
    order: [['capturedAt', 'DESC']],
  });

  const status = sanitizeSnapshot(snapshot);

  let windows = [];
  if (includeWindows) {
    const records = await MaintenanceWindow.findAll({ order: [['startAt', 'ASC']] });
    windows = records.map(serializeWindow);
  }

  return { status, windows };
}

export async function listMaintenanceWindows() {
  const records = await MaintenanceWindow.findAll({ order: [['startAt', 'ASC']] });
  return records.map(serializeWindow);
}

export async function createMaintenanceWindow(payload = {}, { actor } = {}) {
  const sanitized = sanitizeWindowPayload(payload);
  const record = await MaintenanceWindow.create({
    ...sanitized,
    createdBy: actor?.email ?? actor?.name ?? actor?.id ?? null,
    updatedBy: actor?.email ?? actor?.name ?? actor?.id ?? null,
  });
  logger.info({ windowId: record.id, actor: actor?.email ?? actor?.name ?? null }, 'Created maintenance window');
  return serializeWindow(record);
}

export async function updateMaintenanceWindow(windowId, updates = {}, { actor } = {}) {
  if (!windowId) {
    throw new ValidationError('windowId is required.');
  }
  const record = await MaintenanceWindow.findByPk(windowId);
  if (!record) {
    throw new NotFoundError('Maintenance window not found.');
  }
  const sanitized = sanitizeWindowPayload({ ...record.get({ plain: true }), ...updates });
  await record.update({
    ...sanitized,
    updatedBy: actor?.email ?? actor?.name ?? actor?.id ?? record.updatedBy ?? null,
  });
  logger.info({ windowId: record.id }, 'Updated maintenance window');
  return serializeWindow(record);
}

export async function deleteMaintenanceWindow(windowId) {
  if (!windowId) {
    throw new ValidationError('windowId is required.');
  }
  const record = await MaintenanceWindow.findByPk(windowId);
  if (!record) {
    throw new NotFoundError('Maintenance window not found.');
  }
  await record.destroy();
  logger.info({ windowId }, 'Deleted maintenance window');
  return { success: true };
}

export async function sendMaintenanceBroadcast(payload = {}, { actor } = {}) {
  const channels = normaliseChannels(payload.channels);
  if (!channels.length) {
    throw new ValidationError('At least one channel must be provided.');
  }

  const subject = `${payload.subject ?? ''}`.trim();
  if (!subject) {
    throw new ValidationError('Subject is required for maintenance broadcasts.');
  }

  const body = `${payload.body ?? ''}`.trim();
  if (!body) {
    throw new ValidationError('Body is required for maintenance broadcasts.');
  }

  const audience = `${payload.audience ?? ''}`.trim().toLowerCase();
  if (!audience) {
    throw new ValidationError('Audience is required for maintenance broadcasts.');
  }

  const dispatchedAt = new Date();
  const record = await MaintenanceBroadcastLog.create({
    subject,
    body,
    channels,
    audience,
    includeTimeline: Boolean(payload.includeTimeline),
    includeStatusPage: Boolean(payload.includeStatusPage),
    dispatchedAt,
    dispatchedBy: actor?.email ?? actor?.name ?? actor?.id ?? null,
    metadata: {
      requestedBy: actor ?? null,
    },
  });

  logger.info({ broadcastId: record.id, channels, audience }, 'Recorded maintenance broadcast');

  return {
    id: record.id,
    subject: record.subject,
    body: record.body,
    channels: record.channels,
    audience: record.audience,
    includeTimeline: record.includeTimeline,
    includeStatusPage: record.includeStatusPage,
    dispatchedAt: record.dispatchedAt.toISOString(),
    dispatchedBy: record.dispatchedBy,
  };
}

export default {
  getMaintenanceDashboardSnapshot,
  listMaintenanceWindows,
  createMaintenanceWindow,
  updateMaintenanceWindow,
  deleteMaintenanceWindow,
  sendMaintenanceBroadcast,
};
