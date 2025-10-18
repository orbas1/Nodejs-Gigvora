import { Op } from 'sequelize';
import {
  FreelancerCalendarEvent,
  FREELANCER_CALENDAR_EVENT_TYPES,
  FREELANCER_CALENDAR_EVENT_STATUSES,
  FREELANCER_CALENDAR_RELATED_TYPES,
} from '../models/index.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOOKBACK_DAYS = 14;
const DEFAULT_LOOKAHEAD_DAYS = 90;
const MAX_LOOKAHEAD_DAYS = 365;
const MAX_LIMIT = 500;

const TYPE_COLOR_MAP = {
  project: '#2563eb',
  gig: '#7c3aed',
  job_interview: '#0ea5e9',
  mentorship: '#14b8a6',
  volunteering: '#16a34a',
  client_meeting: '#f97316',
  other: '#475569',
};

function normalizeFreelancerId(value) {
  if (value == null || value === '') {
    throw new ValidationError('freelancerId is required.');
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return parsed;
}

function parseEventId(value) {
  if (value == null || value === '') {
    throw new ValidationError('eventId is required.');
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('eventId must be a positive integer.');
  }
  return parsed;
}

function sanitizeString(value, { fieldName, maxLength = 255, allowNull = true } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName ?? 'value'} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return allowNull ? null : '';
  }
  return trimmed.slice(0, maxLength);
}

function sanitizeLongText(value, { fieldName, allowNull = true } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName ?? 'value'} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return allowNull ? null : '';
  }
  return trimmed;
}

function sanitizeBoolean(value, fallback = false) {
  if (value == null) {
    return Boolean(fallback);
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return Boolean(value);
}

function sanitizeDate(value, fieldName) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName ?? 'date'} is invalid.`);
  }
  return date;
}

function sanitizeReminder(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ValidationError('reminderMinutesBefore must be a non-negative integer.');
  }
  return Math.min(parsed, 60 * 24 * 14);
}

function sanitizeUrl(value, fieldName = 'url') {
  const url = sanitizeString(value, { fieldName, maxLength: 500, allowNull: true });
  if (!url) {
    return null;
  }
  if (!/^[a-z]+:/i.test(url) && !url.startsWith('/')) {
    return url;
  }
  return url;
}

function sanitizeMetadata(value) {
  if (value == null) {
    return null;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('metadata must be an object if provided.');
  }
  return { ...value };
}

function parseActorId(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('actorId must be a positive integer when provided.');
  }
  return parsed;
}

function ensureActorAccess(freelancerId, actorId) {
  if (!actorId) {
    return;
  }
  const parsed = parseActorId(actorId);
  if (parsed && parsed !== freelancerId) {
    throw new AuthorizationError('You do not have permission to manage this calendar.');
  }
}

function coerceArray(value) {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((item) => item != null);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [value];
}

function ensureEventType(value, { allowNull = false } = {}) {
  if (value == null || value === '') {
    if (allowNull) {
      return null;
    }
    return FREELANCER_CALENDAR_EVENT_TYPES[0];
  }
  const normalized = value.toString().toLowerCase();
  if (!FREELANCER_CALENDAR_EVENT_TYPES.includes(normalized)) {
    throw new ValidationError(`eventType must be one of: ${FREELANCER_CALENDAR_EVENT_TYPES.join(', ')}`);
  }
  return normalized;
}

function ensureStatus(value, { allowNull = false } = {}) {
  if (value == null || value === '') {
    if (allowNull) {
      return null;
    }
    return 'confirmed';
  }
  const normalized = value.toString().toLowerCase();
  if (!FREELANCER_CALENDAR_EVENT_STATUSES.includes(normalized)) {
    throw new ValidationError(`status must be one of: ${FREELANCER_CALENDAR_EVENT_STATUSES.join(', ')}`);
  }
  return normalized;
}

function ensureRelatedType(value) {
  if (value == null || value === '') {
    return null;
  }
  const normalized = value.toString().toLowerCase();
  if (!FREELANCER_CALENDAR_RELATED_TYPES.includes(normalized)) {
    throw new ValidationError(`relatedEntityType must be one of: ${FREELANCER_CALENDAR_RELATED_TYPES.join(', ')}`);
  }
  return normalized;
}

function clampLimit(limit) {
  if (limit == null || limit === '') {
    return null;
  }
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('limit must be a positive integer.');
  }
  return Math.min(parsed, MAX_LIMIT);
}

function normalizeRange({ startDate, endDate, lookbackDays, lookaheadDays }) {
  const now = new Date();
  const resolvedLookback = Number.isFinite(Number(lookbackDays))
    ? Math.min(Math.max(Number(lookbackDays), 0), MAX_LOOKAHEAD_DAYS)
    : DEFAULT_LOOKBACK_DAYS;
  const resolvedLookahead = Number.isFinite(Number(lookaheadDays))
    ? Math.min(Math.max(Number(lookaheadDays), 1), MAX_LOOKAHEAD_DAYS)
    : DEFAULT_LOOKAHEAD_DAYS;

  const start = startDate ? sanitizeDate(startDate, 'startDate') : new Date(now.getTime() - resolvedLookback * DAY_IN_MS);
  const end = endDate ? sanitizeDate(endDate, 'endDate') : new Date(now.getTime() + resolvedLookahead * DAY_IN_MS);

  if (start && end && start.getTime() > end.getTime()) {
    throw new ValidationError('startDate must be before endDate.');
  }

  return { start, end };
}

function computeMetrics(events, { now = new Date(), start, end } = {}) {
  const typeCounts = {};
  const statusCounts = {};
  const upcoming = [];
  const past = [];
  let nextEvent = null;
  let overdueCount = 0;

  events.forEach((event) => {
    const typeKey = event.eventType ?? 'other';
    typeCounts[typeKey] = (typeCounts[typeKey] ?? 0) + 1;
    const statusKey = event.status ?? 'confirmed';
    statusCounts[statusKey] = (statusCounts[statusKey] ?? 0) + 1;

    const startTime = event.startsAt ? new Date(event.startsAt).getTime() : null;
    if (startTime == null) {
      return;
    }
    if (startTime >= now.getTime()) {
      upcoming.push(event);
      if (!nextEvent || startTime < new Date(nextEvent.startsAt).getTime()) {
        nextEvent = event;
      }
    } else {
      past.push(event);
      if (!['completed', 'cancelled'].includes(statusKey)) {
        overdueCount += 1;
      }
    }
  });

  return {
    total: events.length,
    upcomingCount: upcoming.length,
    pastCount: past.length,
    overdueCount,
    typeCounts,
    statusCounts,
    nextEvent,
    range: {
      start: start ? start.toISOString() : null,
      end: end ? end.toISOString() : null,
    },
  };
}

function buildEventPayload(input = {}, { existing = null, partial = false } = {}) {
  const payload = {};

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'title')) {
    const title = sanitizeString(input.title ?? existing?.title, { fieldName: 'title', allowNull: false });
    if (!title) {
      throw new ValidationError('title is required.');
    }
    payload.title = title;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'eventType')) {
    const typeSource = Object.prototype.hasOwnProperty.call(input, 'eventType')
      ? input.eventType
      : existing?.eventType;
    payload.eventType = ensureEventType(typeSource, { allowNull: partial });
    if (payload.eventType == null && existing?.eventType) {
      payload.eventType = existing.eventType;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'status')) {
    const statusSource = Object.prototype.hasOwnProperty.call(input, 'status')
      ? input.status
      : existing?.status;
    payload.status = ensureStatus(statusSource, { allowNull: partial });
    if (payload.status == null && existing?.status) {
      payload.status = existing.status;
    }
  }

  let isAllDay = existing?.isAllDay ?? false;
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'isAllDay')) {
    isAllDay = sanitizeBoolean(input.isAllDay ?? existing?.isAllDay, false);
    payload.isAllDay = isAllDay;
  }

  let startsAt = existing?.startsAt ? new Date(existing.startsAt) : null;
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'startsAt')) {
    startsAt = sanitizeDate(input.startsAt ?? existing?.startsAt, 'startsAt');
    if (!startsAt) {
      throw new ValidationError('startsAt is required.');
    }
    payload.startsAt = startsAt;
  }

  let endsAt = existing?.endsAt ? new Date(existing.endsAt) : null;
  const needsEndUpdate =
    !partial ||
    isAllDay !== existing?.isAllDay ||
    Object.prototype.hasOwnProperty.call(input, 'endsAt') ||
    (!existing?.endsAt && !Object.prototype.hasOwnProperty.call(input, 'endsAt'));

  if (needsEndUpdate) {
    const candidate = Object.prototype.hasOwnProperty.call(input, 'endsAt') ? input.endsAt : endsAt;
    endsAt = candidate ? sanitizeDate(candidate, 'endsAt') : null;

    if (!endsAt && startsAt) {
      endsAt = new Date(startsAt.getTime() + (isAllDay ? DAY_IN_MS : 60 * 60 * 1000));
    }

    if (startsAt && endsAt && endsAt.getTime() < startsAt.getTime()) {
      throw new ValidationError('endsAt must be greater than or equal to startsAt.');
    }

    payload.endsAt = endsAt;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'location')) {
    payload.location = sanitizeString(input.location ?? existing?.location, {
      fieldName: 'location',
      maxLength: 255,
      allowNull: true,
    });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'meetingUrl')) {
    payload.meetingUrl = sanitizeUrl(input.meetingUrl ?? existing?.meetingUrl, 'meetingUrl');
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'notes')) {
    payload.notes = sanitizeLongText(input.notes ?? existing?.notes, { fieldName: 'notes', allowNull: true });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'relatedEntityType')) {
    const relatedSource = Object.prototype.hasOwnProperty.call(input, 'relatedEntityType')
      ? input.relatedEntityType
      : existing?.relatedEntityType;
    payload.relatedEntityType = ensureRelatedType(relatedSource);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'relatedEntityId')) {
    payload.relatedEntityId = sanitizeString(input.relatedEntityId ?? existing?.relatedEntityId, {
      fieldName: 'relatedEntityId',
      maxLength: 120,
      allowNull: true,
    });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'relatedEntityName')) {
    payload.relatedEntityName = sanitizeString(input.relatedEntityName ?? existing?.relatedEntityName, {
      fieldName: 'relatedEntityName',
      maxLength: 255,
      allowNull: true,
    });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'reminderMinutesBefore')) {
    payload.reminderMinutesBefore = sanitizeReminder(
      input.reminderMinutesBefore ?? existing?.reminderMinutesBefore,
    );
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'source')) {
    payload.source = sanitizeString(input.source ?? existing?.source ?? 'manual', {
      fieldName: 'source',
      maxLength: 80,
      allowNull: false,
    });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'color')) {
    const colorSource = Object.prototype.hasOwnProperty.call(input, 'color')
      ? input.color
      : existing?.color;
    const normalizedColor = sanitizeString(colorSource ?? TYPE_COLOR_MAP[payload.eventType ?? existing?.eventType], {
      fieldName: 'color',
      maxLength: 32,
      allowNull: true,
    });
    payload.color = normalizedColor;
  } else if (!existing?.color && payload.eventType) {
    payload.color = TYPE_COLOR_MAP[payload.eventType] ?? TYPE_COLOR_MAP.other;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'metadata')) {
    const metadataSource = Object.prototype.hasOwnProperty.call(input, 'metadata')
      ? input.metadata
      : existing?.metadata;
    payload.metadata = sanitizeMetadata(metadataSource);
  }

  return payload;
}

export async function listFreelancerCalendarEvents(freelancerId, options = {}) {
  const resolvedFreelancerId = normalizeFreelancerId(freelancerId);
  const { start, end } = normalizeRange(options);
  const types = coerceArray(options.types).map((value) => ensureEventType(value, { allowNull: true })).filter(Boolean);
  const statuses = coerceArray(options.statuses)
    .map((value) => ensureStatus(value, { allowNull: true }))
    .filter(Boolean);
  const limit = clampLimit(options.limit);

  const where = { freelancerId: resolvedFreelancerId };
  if (start && end) {
    where.startsAt = { [Op.between]: [start, end] };
  } else if (start) {
    where.startsAt = { [Op.gte]: start };
  } else if (end) {
    where.startsAt = { [Op.lte]: end };
  }

  if (types.length) {
    where.eventType = { [Op.in]: types };
  }
  if (statuses.length) {
    where.status = { [Op.in]: statuses };
  }

  const events = await FreelancerCalendarEvent.findAll({
    where,
    order: [
      ['startsAt', 'ASC'],
      ['createdAt', 'ASC'],
    ],
    limit: limit ?? undefined,
  });

  const plainEvents = events.map((event) => event.toPublicObject());
  const metrics = computeMetrics(plainEvents, { now: new Date(), start, end });

  return {
    events: plainEvents,
    metrics,
    generatedAt: new Date().toISOString(),
  };
}

export async function createFreelancerCalendarEvent(freelancerId, payload = {}, { actorId } = {}) {
  const resolvedFreelancerId = normalizeFreelancerId(freelancerId);
  const parsedActorId = parseActorId(actorId ?? payload.actorId);
  ensureActorAccess(resolvedFreelancerId, parsedActorId);

  const eventPayload = buildEventPayload(payload, { existing: null, partial: false });
  eventPayload.freelancerId = resolvedFreelancerId;
  eventPayload.createdById = parsedActorId;
  eventPayload.updatedById = parsedActorId;
  if (!eventPayload.color && eventPayload.eventType) {
    eventPayload.color = TYPE_COLOR_MAP[eventPayload.eventType] ?? TYPE_COLOR_MAP.other;
  }

  const event = await FreelancerCalendarEvent.create(eventPayload);
  return event.toPublicObject();
}

export async function updateFreelancerCalendarEvent(eventId, payload = {}, { freelancerId, actorId } = {}) {
  const resolvedEventId = parseEventId(eventId);
  const resolvedFreelancerId = freelancerId ? normalizeFreelancerId(freelancerId) : null;
  const event = await FreelancerCalendarEvent.findOne({
    where: {
      id: resolvedEventId,
      ...(resolvedFreelancerId ? { freelancerId: resolvedFreelancerId } : {}),
    },
  });

  if (!event) {
    throw new NotFoundError('Calendar event not found.');
  }

  const owningFreelancerId = event.freelancerId;
  const parsedActorId = parseActorId(actorId ?? payload.actorId);
  ensureActorAccess(owningFreelancerId, parsedActorId);

  const updatePayload = buildEventPayload(payload, { existing: event.toPublicObject(), partial: true });
  if (parsedActorId) {
    updatePayload.updatedById = parsedActorId;
  }

  const updated = await event.update(updatePayload);
  return updated.toPublicObject();
}

export async function deleteFreelancerCalendarEvent(eventId, { freelancerId, actorId } = {}) {
  const resolvedEventId = parseEventId(eventId);
  const resolvedFreelancerId = freelancerId ? normalizeFreelancerId(freelancerId) : null;

  const event = await FreelancerCalendarEvent.findOne({
    where: {
      id: resolvedEventId,
      ...(resolvedFreelancerId ? { freelancerId: resolvedFreelancerId } : {}),
    },
  });

  if (!event) {
    throw new NotFoundError('Calendar event not found.');
  }

  const parsedActorId = parseActorId(actorId ?? null);
  ensureActorAccess(event.freelancerId, parsedActorId);
  await event.destroy();
  return true;
}

export default {
  listFreelancerCalendarEvents,
  createFreelancerCalendarEvent,
  updateFreelancerCalendarEvent,
  deleteFreelancerCalendarEvent,
};
