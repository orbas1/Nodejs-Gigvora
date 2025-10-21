import notificationService from '../services/notificationService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function normalizeUserId(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError('A valid userId is required.');
  }
  return numeric;
}

function ensureNotificationAccess(req, userId) {
  const actorId = resolveRequestUserId(req);
  const permissions = new Set(resolveRequestPermissions(req).map((permission) => permission.toLowerCase()));
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  roles.map((role) => `${role}`.toLowerCase()).forEach((role) => permissions.add(role));

  if (actorId && actorId === userId) {
    return;
  }

  if (
    permissions.has('admin') ||
    permissions.has('notification.manage.any') ||
    permissions.has('support') ||
    permissions.has('support.manage.any')
  ) {
    return;
  }

  throw new AuthorizationError('You do not have permission to manage notifications for this user.');
}

function slugify(value, fallback = 'custom') {
  if (!value) {
    return fallback;
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || fallback;
}

function buildNotificationPayload(body, userId) {
  const title = body?.title?.toString().trim();
  const message = body?.message?.toString().trim() || body?.body?.toString().trim() || null;
  if (!title) {
    throw new ValidationError('title is required.');
  }

  const typeInput = body?.type?.toString().trim();
  const type = slugify(typeInput || title, 'user-custom');
  const category = body?.category?.toString().trim().toLowerCase() || 'system';
  const priority = body?.priority?.toString().trim().toLowerCase() || 'normal';

  let expiresAt = null;
  if (body?.expiresAt) {
    const timestamp = new Date(body.expiresAt);
    if (Number.isNaN(timestamp.getTime())) {
      throw new ValidationError('expiresAt must be a valid date string.');
    }
    expiresAt = timestamp.toISOString();
  }

  const payload = {};
  if (body?.ctaLabel) {
    payload.ctaLabel = body.ctaLabel.toString().trim();
  }
  if (body?.ctaUrl) {
    payload.ctaUrl = body.ctaUrl.toString().trim();
  }
  if (body?.thumbnailUrl) {
    payload.thumbnailUrl = body.thumbnailUrl.toString().trim();
  }
  if (body?.imageAlt) {
    payload.imageAlt = body.imageAlt.toString().trim();
  }
  if (body?.metadata && typeof body.metadata === 'object') {
    payload.metadata = { ...body.metadata };
  }

  return {
    userId,
    title,
    type,
    body: message,
    category,
    priority,
    payload: Object.keys(payload).length ? payload : undefined,
    expiresAt,
  };
}

export async function listUserNotifications(req, res) {
  const userId = normalizeUserId(req.params.id);
  ensureNotificationAccess(req, userId);
  const { status, category, page, pageSize } = req.query ?? {};

  const filters = {};
  if (status && status !== 'all') {
    filters.status = status;
  }
  if (category && category !== 'all') {
    filters.category = category;
  }

  const parsedPage = page ? Number.parseInt(page, 10) : 1;
  const parsedPageSize = pageSize ? Number.parseInt(pageSize, 10) : 25;
  if (!Number.isFinite(parsedPage) || parsedPage <= 0) {
    throw new ValidationError('page must be a positive integer.');
  }
  if (!Number.isFinite(parsedPageSize) || parsedPageSize <= 0) {
    throw new ValidationError('pageSize must be a positive integer.');
  }
  const pagination = {
    page: parsedPage,
    pageSize: Math.min(parsedPageSize, 100),
  };

  const [result, stats, preferences] = await Promise.all([
    notificationService.listNotifications(userId, filters, pagination),
    notificationService.getStats(userId),
    notificationService.getPreferences(userId),
  ]);

  res.json({
    notifications: result.data,
    pagination: result.pagination,
    stats,
    preferences,
  });
}

export async function createUserNotification(req, res) {
  const userId = normalizeUserId(req.params.id);
  ensureNotificationAccess(req, userId);
  const payload = buildNotificationPayload(req.body ?? {}, userId);
  const bypassQuietHours = req.body?.sendDuringQuietHours === true;

  const notification = await notificationService.queueNotification(payload, {
    bypassQuietHours,
  });
  const stats = await notificationService.getStats(userId);

  res.status(201).json({ notification, stats });
}

export async function updateUserNotification(req, res) {
  const userId = normalizeUserId(req.params.id);
  ensureNotificationAccess(req, userId);
  const notificationId = Number.parseInt(req.params.notificationId, 10);
  if (!Number.isFinite(notificationId) || notificationId <= 0) {
    throw new ValidationError('notificationId must be a positive integer.');
  }

  const action = (req.body?.action || req.body?.status || '').toString().trim().toLowerCase();
  let notification;

  if (action === 'read') {
    notification = await notificationService.markAsRead(notificationId, userId);
  } else if (action === 'dismiss' || action === 'dismissed' || action === 'archived') {
    notification = await notificationService.dismissNotification(notificationId, userId);
  } else {
    throw new ValidationError('Unsupported notification action.');
  }

  const stats = await notificationService.getStats(userId);
  res.json({ notification, stats });
}

export async function getUserNotificationPreferences(req, res) {
  const userId = normalizeUserId(req.params.id);
  ensureNotificationAccess(req, userId);
  const preferences = await notificationService.getPreferences(userId);
  res.json(preferences);
}

export async function updateUserNotificationPreferences(req, res) {
  const userId = normalizeUserId(req.params.id);
  ensureNotificationAccess(req, userId);
  const patch = req.body ?? {};
  const preferences = await notificationService.upsertPreferences(userId, patch);
  const stats = await notificationService.getStats(userId);
  res.json({ preferences, stats });
}

export async function markAllUserNotificationsRead(req, res) {
  const userId = normalizeUserId(req.params.id);
  ensureNotificationAccess(req, userId);
  const stats = await notificationService.markAllAsRead(userId);
  res.json({ stats });
}

export default {
  listUserNotifications,
  createUserNotification,
  updateUserNotification,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  markAllUserNotificationsRead,
};
