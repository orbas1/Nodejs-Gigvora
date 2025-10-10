import { trackEvent, listEvents } from '../services/analyticsService.js';

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

  return {
    eventName,
    actorType,
    userId,
    entityType,
    entityId,
    source,
    context,
    occurredAt,
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
