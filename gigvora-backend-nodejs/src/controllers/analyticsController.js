import { trackEvent, listEvents } from '../services/analyticsService.js';

function toPlainObject(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return Object.fromEntries(Object.entries(value));
}

function sanitizeEventPayload(body = {}) {
  const {
    eventName,
    actorType = 'anonymous',
    userId = null,
    entityType = null,
    entityId = null,
    source = null,
    context = null,
    occurredAt = null,
  } = body ?? {};

  const safeContext = toPlainObject(context) ?? {};
  const safeSource = typeof source === 'string' && source.trim().length ? source.trim() : null;

  return {
    eventName: typeof eventName === 'string' ? eventName.trim() : eventName,
    actorType: typeof actorType === 'string' ? actorType.trim() : actorType,
    userId,
    entityType: typeof entityType === 'string' ? entityType.trim() : entityType,
    entityId: typeof entityId === 'string' ? entityId.trim() : entityId,
    source: safeSource,
    context: safeContext,
    occurredAt: occurredAt ?? null,
  };
}

export async function recordEvent(req, res) {
  const payload = sanitizeEventPayload(req.body);
  const stored = await trackEvent(payload);
  res.status(201).json(stored);
}

export async function getEvents(req, res) {
  const { eventName, actorType, dateFrom, dateTo, page, pageSize } = req.query ?? {};
  const filters = {
    eventName: eventName ?? undefined,
    actorType: actorType ?? undefined,
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
  };

  const pagination = {
    page: page ?? undefined,
    pageSize: pageSize ?? undefined,
  };

  const result = await listEvents(filters, pagination);
  res.json(result);
}

export default {
  recordEvent,
  getEvents,
};
