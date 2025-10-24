import { Op } from 'sequelize';
import { DataExportRequest, sequelize } from '../models/index.js';
import { ConflictError, ValidationError } from '../utils/errors.js';
import notificationService from './notificationService.js';

const EXPORT_STATUSES = new Set(['queued', 'processing', 'ready', 'failed', 'expired']);
const EXPORT_FORMATS = new Set(['zip', 'json', 'csv', 'pdf']);
const ACTIVE_STATUSES = ['queued', 'processing'];

function normaliseUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function normaliseFormat(format) {
  if (!format) {
    return 'zip';
  }
  const value = String(format).trim().toLowerCase();
  if (!EXPORT_FORMATS.has(value)) {
    throw new ValidationError('Unsupported export format.');
  }
  return value;
}

function normaliseType(type) {
  if (!type) {
    return 'account_archive';
  }
  const trimmed = String(type).trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  if (!trimmed) {
    return 'account_archive';
  }
  return trimmed.slice(0, 60);
}

function coerceNotes(notes) {
  if (notes == null) {
    return null;
  }
  const value = String(notes).trim();
  return value.length ? value.slice(0, 2000) : null;
}

export async function listUserDataExports(userId, { limit = 25, since } = {}) {
  const numericId = normaliseUserId(userId);
  const where = { userId: numericId };
  if (since) {
    const date = new Date(since);
    if (!Number.isNaN(date.getTime())) {
      where.requestedAt = { [Op.gte]: date };
    }
  }

  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 25;
  const records = await DataExportRequest.findAll({
    where,
    order: [['requestedAt', 'DESC']],
    limit: safeLimit,
  });
  return records.map((record) => record.toPublicObject());
}

export async function createDataExportRequest(userId, payload = {}) {
  const numericId = normaliseUserId(userId);
  if (payload == null || typeof payload !== 'object') {
    throw new ValidationError('Payload must be an object.');
  }

  const format = normaliseFormat(payload.format);
  const type = normaliseType(payload.type);
  const notes = coerceNotes(payload.notes);

  const recentActive = await DataExportRequest.findOne({
    where: {
      userId: numericId,
      status: { [Op.in]: ACTIVE_STATUSES },
      requestedAt: { [Op.gte]: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    },
  });

  if (recentActive) {
    throw new ConflictError('An export request is already being processed. Please wait before requesting another.');
  }

  const request = await sequelize.transaction(async (transaction) => {
    const created = await DataExportRequest.create(
      {
        userId: numericId,
        status: 'queued',
        format,
        type,
        requestedAt: new Date(),
        notes,
        metadata: {
          priority: payload.priority ?? 'standard',
          channels: payload.channels ?? ['email'],
          includeInvoices: Boolean(payload.includeInvoices),
          includeMessages: Boolean(payload.includeMessages),
        },
      },
      { transaction },
    );

    await notificationService.queueNotification(
      {
        userId: numericId,
        category: 'compliance',
        priority: 'normal',
        type: 'data_export_request_received',
        title: 'Your data export request is queued',
        body:
          'We have logged your request. Compliance will prepare the archive and notify you when it is ready to download.',
      },
      { bypassQuietHours: true },
    );

    return created;
  });

  return request.toPublicObject();
}

export async function updateExportStatus(exportId, patch = {}) {
  const record = await DataExportRequest.findByPk(exportId);
  if (!record) {
    throw new ValidationError('Export request not found.');
  }

  const nextStatus = patch.status;
  if (nextStatus && !EXPORT_STATUSES.has(String(nextStatus))) {
    throw new ValidationError('Unsupported export status.');
  }

  if (nextStatus) {
    record.status = nextStatus;
  }
  if (patch.downloadUrl !== undefined) {
    record.downloadUrl = patch.downloadUrl || null;
  }
  if (patch.completedAt !== undefined) {
    record.completedAt = patch.completedAt ? new Date(patch.completedAt) : null;
  }
  if (patch.expiresAt !== undefined) {
    record.expiresAt = patch.expiresAt ? new Date(patch.expiresAt) : null;
  }
  if (patch.metadata && typeof patch.metadata === 'object') {
    record.metadata = { ...(record.metadata ?? {}), ...patch.metadata };
  }

  await record.save();
  return record.toPublicObject();
}

export default {
  listUserDataExports,
  createDataExportRequest,
  updateExportStatus,
};
