import { trackEvent, listEvents } from '../services/analyticsService.js';

function normaliseNumber(value) {
  if (value == null) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.trunc(parsed);
}

function serialiseContextValue(value) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    const serialised = value
      .map((item) => serialiseContextValue(item))
      .filter((item) => item !== undefined && item !== null);

    return serialised.length ? serialised : null;
  }

  if (typeof value === 'object') {
    const serialisedEntries = Object.entries(value)
      .filter(([key]) => key != null && key !== '')
      .map(([key, item]) => [key, serialiseContextValue(item)])
      .filter(([, item]) => item !== undefined && item !== null);

    if (!serialisedEntries.length) {
      return null;
    }

    return Object.fromEntries(serialisedEntries);
  }

  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return value;
  }

  return undefined;
}

function normaliseContext(value) {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const entries = Object.entries(value)
    .filter(([key]) => key != null && key !== '')
    .map(([key, item]) => {
      const serialised = serialiseContextValue(item);
      if (serialised === undefined || serialised === null) {
        return null;
      }
      return [key, serialised];
    })
    .filter(Boolean);

  return entries.length ? Object.fromEntries(entries) : {};
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

  const safeContext = normaliseContext(context);
  const safeSource = typeof source === 'string' && source.trim().length ? source.trim() : null;
  const safeActor = typeof actorType === 'string' && actorType.trim().length
    ? actorType.trim().toLowerCase()
    : 'anonymous';
  const safeEntityType = typeof entityType === 'string' && entityType.trim().length
    ? entityType.trim()
    : null;
  const safeEventName = typeof eventName === 'string' ? eventName.trim() : eventName;
  const safeOccurredAt = occurredAt ? new Date(occurredAt).toISOString() : null;

  return {
    eventName: safeEventName,
    actorType: safeActor,
    userId: normaliseNumber(userId),
    entityType: safeEntityType,
    entityId: normaliseNumber(entityId),
    source: safeSource,
    context: safeContext,
    occurredAt: safeOccurredAt,
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
