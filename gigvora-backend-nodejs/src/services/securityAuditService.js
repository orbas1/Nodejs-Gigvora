import { Op } from 'sequelize';

import { RuntimeSecurityAuditEvent } from '../models/index.js';
import logger from '../utils/logger.js';

function normaliseLevel(level) {
  if (!level) {
    return 'info';
  }
  const normalised = String(level).trim().toLowerCase();
  if (['info', 'notice', 'warn', 'warning', 'error', 'critical'].includes(normalised)) {
    return normalised === 'warning' ? 'warn' : normalised;
  }
  return 'info';
}

export async function recordRuntimeSecurityEvent(
  { eventType, message, level, metadata, requestId, triggeredBy } = {},
  { logger: scopedLogger } = {},
) {
  if (!eventType || !message) {
    return null;
  }

  const payload = {
    eventType: String(eventType).trim().slice(0, 64),
    level: normaliseLevel(level),
    message: String(message).trim().slice(0, 512),
    requestId: requestId ? String(requestId).trim().slice(0, 64) : null,
    triggeredBy: triggeredBy ? String(triggeredBy).trim().slice(0, 120) : null,
    metadata: metadata ?? null,
  };

  try {
    const record = await RuntimeSecurityAuditEvent.create(payload);
    scopedLogger?.info?.({ eventType: payload.eventType, level: payload.level }, 'Runtime security event recorded');
    return record.toPublicObject();
  } catch (error) {
    (scopedLogger ?? logger).warn({ err: error, eventType: payload.eventType }, 'Failed to persist runtime security event');
    return null;
  }
}

export async function getRecentRuntimeSecurityEvents({ limit = 10, level, since } = {}) {
  const where = {};
  if (level) {
    where.level = normaliseLevel(level);
  }
  if (since) {
    const date = new Date(since);
    if (!Number.isNaN(date.getTime())) {
      where.createdAt = { [Op.gte]: date };
    }
  }

  const events = await RuntimeSecurityAuditEvent.findAll({
    where,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10,
    order: [['createdAt', 'DESC']],
  });
  return events.map((event) => event.toPublicObject());
}

