import { Op } from 'sequelize';
import {
  CalendarIntegration,
  CandidateCalendarEvent,
  FocusSession,
  UserCalendarSetting,
} from '../models/index.js';
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_SOURCES,
  CALENDAR_EVENT_VISIBILITIES,
  CALENDAR_DEFAULT_VIEWS,
  FOCUS_SESSION_TYPES,
} from '../models/constants/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const DEFAULT_SETTINGS = Object.freeze({
  timezone: 'UTC',
  weekStart: 1,
  workStartMinutes: 480,
  workEndMinutes: 1020,
  defaultView: 'agenda',
  defaultReminderMinutes: 30,
  autoFocusBlocks: false,
  shareAvailability: false,
  colorHex: null,
  metadata: null,
});

function normalizeColorHex(value) {
  if (!value) {
    return null;
  }
  const text = `${value}`.trim();
  if (!text) return null;
  const normalized = text.startsWith('#') ? text : `#${text}`;
  if (!/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(normalized)) {
    throw new ValidationError('colorHex must be a valid hex colour code.');
  }
  return normalized.toUpperCase();
}

function parseDate(value, fieldName) {
  if (!value) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid ISO-8601 date.`);
  }
  return date;
}

function normalizeEventPayload(payload) {
  if (!payload?.title || !`${payload.title}`.trim()) {
    throw new ValidationError('title is required.');
  }
  const eventType = payload.eventType ?? 'event';
  if (!CALENDAR_EVENT_TYPES.includes(eventType)) {
    throw new ValidationError('eventType is invalid.');
  }
  const visibility = payload.visibility ?? 'private';
  if (!CALENDAR_EVENT_VISIBILITIES.includes(visibility)) {
    throw new ValidationError('visibility is invalid.');
  }
  const startsAt = parseDate(payload.startsAt, 'startsAt');
  const endsAt = payload.endsAt ? parseDate(payload.endsAt, 'endsAt') : null;
  if (endsAt && endsAt < startsAt) {
    throw new ValidationError('endsAt must be greater than or equal to startsAt.');
  }
  const reminderMinutes =
    payload.reminderMinutes == null || payload.reminderMinutes === ''
      ? null
      : Number.parseInt(payload.reminderMinutes, 10);
  if (reminderMinutes != null && (Number.isNaN(reminderMinutes) || reminderMinutes < 0)) {
    throw new ValidationError('reminderMinutes must be a positive integer.');
  }
  const relatedEntityId =
    payload.relatedEntityId == null || payload.relatedEntityId === ''
      ? null
      : Number.parseInt(payload.relatedEntityId, 10);
  if (relatedEntityId != null && (Number.isNaN(relatedEntityId) || relatedEntityId <= 0)) {
    throw new ValidationError('relatedEntityId must be a positive integer.');
  }
  const source = payload.source ?? 'manual';
  if (!CALENDAR_EVENT_SOURCES.includes(source)) {
    throw new ValidationError('source must be a recognised calendar provider.');
  }

  return {
    title: `${payload.title}`.trim(),
    eventType,
    source,
    startsAt,
    endsAt,
    location: payload.location ? `${payload.location}`.trim() : null,
    description: payload.description ? `${payload.description}`.trim() : null,
    videoConferenceLink: payload.videoConferenceLink ? `${payload.videoConferenceLink}`.trim() : null,
    isAllDay: Boolean(payload.isAllDay),
    reminderMinutes,
    visibility,
    relatedEntityType: payload.relatedEntityType ? `${payload.relatedEntityType}`.trim() : null,
    relatedEntityId,
    colorHex: normalizeColorHex(payload.colorHex),
    metadata: payload.metadata ?? null,
    focusMode: payload.focusMode ? `${payload.focusMode}`.trim() : null,
  };
}

function normalizeFocusSessionPayload(payload) {
  const focusType = payload.focusType ?? 'deep_work';
  if (!FOCUS_SESSION_TYPES.includes(focusType)) {
    throw new ValidationError('focusType is invalid.');
  }
  const startedAt = parseDate(payload.startedAt, 'startedAt');
  const endedAt = payload.endedAt ? parseDate(payload.endedAt, 'endedAt') : null;
  let durationMinutes =
    payload.durationMinutes == null || payload.durationMinutes === ''
      ? null
      : Number.parseInt(payload.durationMinutes, 10);
  if (durationMinutes != null && (Number.isNaN(durationMinutes) || durationMinutes < 0)) {
    throw new ValidationError('durationMinutes must be a positive integer.');
  }
  if (durationMinutes == null && endedAt) {
    const diff = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / (1000 * 60)));
    durationMinutes = diff || null;
  }

  return {
    focusType,
    startedAt,
    endedAt,
    durationMinutes,
    completed: payload.completed === undefined ? Boolean(endedAt) : Boolean(payload.completed),
    notes: payload.notes ? `${payload.notes}`.trim() : null,
    metadata: payload.metadata ?? null,
  };
}

function normalizeSettingsPayload(payload = {}) {
  const timezone = payload.timezone && `${payload.timezone}`.trim();
  const weekStart =
    payload.weekStart == null || payload.weekStart === '' ? null : Number.parseInt(payload.weekStart, 10);
  const workStartMinutes =
    payload.workStartMinutes == null || payload.workStartMinutes === ''
      ? null
      : Number.parseInt(payload.workStartMinutes, 10);
  const workEndMinutes =
    payload.workEndMinutes == null || payload.workEndMinutes === ''
      ? null
      : Number.parseInt(payload.workEndMinutes, 10);
  const defaultReminderMinutes =
    payload.defaultReminderMinutes == null || payload.defaultReminderMinutes === ''
      ? null
      : Number.parseInt(payload.defaultReminderMinutes, 10);
  const defaultView = payload.defaultView ?? DEFAULT_SETTINGS.defaultView;

  if (weekStart != null && (Number.isNaN(weekStart) || weekStart < 0 || weekStart > 6)) {
    throw new ValidationError('weekStart must be between 0 (Sunday) and 6 (Saturday).');
  }
  if (workStartMinutes != null && (Number.isNaN(workStartMinutes) || workStartMinutes < 0 || workStartMinutes > 1439)) {
    throw new ValidationError('workStartMinutes must be between 0 and 1439.');
  }
  if (workEndMinutes != null && (Number.isNaN(workEndMinutes) || workEndMinutes < 0 || workEndMinutes > 1439)) {
    throw new ValidationError('workEndMinutes must be between 0 and 1439.');
  }
  if (
    workStartMinutes != null &&
    workEndMinutes != null &&
    workEndMinutes <= workStartMinutes
  ) {
    throw new ValidationError('workEndMinutes must be greater than workStartMinutes.');
  }
  if (
    defaultReminderMinutes != null &&
    (Number.isNaN(defaultReminderMinutes) || defaultReminderMinutes < 0 || defaultReminderMinutes > 10080)
  ) {
    throw new ValidationError('defaultReminderMinutes must be between 0 and 10080 minutes.');
  }
  if (!CALENDAR_DEFAULT_VIEWS.includes(defaultView)) {
    throw new ValidationError('defaultView is invalid.');
  }

  return {
    timezone: timezone || DEFAULT_SETTINGS.timezone,
    weekStart: weekStart ?? DEFAULT_SETTINGS.weekStart,
    workStartMinutes: workStartMinutes ?? DEFAULT_SETTINGS.workStartMinutes,
    workEndMinutes: workEndMinutes ?? DEFAULT_SETTINGS.workEndMinutes,
    defaultView,
    defaultReminderMinutes: defaultReminderMinutes ?? DEFAULT_SETTINGS.defaultReminderMinutes,
    autoFocusBlocks:
      payload.autoFocusBlocks == null ? DEFAULT_SETTINGS.autoFocusBlocks : Boolean(payload.autoFocusBlocks),
    shareAvailability:
      payload.shareAvailability == null ? DEFAULT_SETTINGS.shareAvailability : Boolean(payload.shareAvailability),
    colorHex: normalizeColorHex(payload.colorHex) ?? DEFAULT_SETTINGS.colorHex,
    metadata: payload.metadata ?? DEFAULT_SETTINGS.metadata,
  };
}

function sanitizeEvent(record) {
  if (!record) return null;
  const event = record.toPublicObject ? record.toPublicObject() : record;
  return {
    ...event,
    startsAt: event.startsAt ? new Date(event.startsAt).toISOString() : null,
    endsAt: event.endsAt ? new Date(event.endsAt).toISOString() : null,
  };
}

function sanitizeFocusSession(record) {
  if (!record) return null;
  const session = record.toPublicObject ? record.toPublicObject() : record;
  return {
    ...session,
    startedAt: session.startedAt ? new Date(session.startedAt).toISOString() : null,
    endedAt: session.endedAt ? new Date(session.endedAt).toISOString() : null,
  };
}

function sanitizeIntegration(record) {
  if (!record) return null;
  const integration = record.toPublicObject ? record.toPublicObject() : record;
  return {
    ...integration,
    lastSyncedAt: integration.lastSyncedAt ? new Date(integration.lastSyncedAt).toISOString() : null,
  };
}

function sanitizeSettings(record) {
  if (!record) {
    return { ...DEFAULT_SETTINGS };
  }
  const settings = record.toPublicObject ? record.toPublicObject() : record;
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
  };
}

function buildOverviewStats(events, focusSessions) {
  const now = Date.now();
  const upcomingEvents = events.filter((event) => !event.startsAt || new Date(event.startsAt).getTime() >= now);
  const eventsByType = events.reduce((accumulator, event) => {
    const key = event.eventType || 'other';
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
  const nextEvent = upcomingEvents.sort((a, b) => {
    const aTime = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  })[0];

  const openFocusSessions = focusSessions.filter((session) => !session.completed);

  return {
    totalEvents: events.length,
    upcomingEvents: upcomingEvents.length,
    eventsByType,
    nextEvent: nextEvent ?? null,
    openFocusSessions: openFocusSessions.slice(0, 5),
  };
}

export async function getOverview(userId, { from, to, limit = 40 } = {}) {
  const where = { userId };
  const dateFilter = {};
  if (from) {
    const fromDate = parseDate(from, 'from');
    dateFilter[Op.gte] = fromDate;
  }
  if (to) {
    const toDate = parseDate(to, 'to');
    dateFilter[Op.lte] = toDate;
  }
  if (Object.keys(dateFilter).length) {
    where.startsAt = dateFilter;
  }

  const [events, focusSessions, integrations, settings] = await Promise.all([
    CandidateCalendarEvent.findAll({ where, order: [['startsAt', 'ASC']], limit }),
    FocusSession.findAll({ where: { userId }, order: [['startedAt', 'DESC']], limit: 50 }),
    CalendarIntegration.findAll({ where: { userId }, order: [['provider', 'ASC']] }),
    UserCalendarSetting.findOne({ where: { userId } }),
  ]);

  const sanitizedEvents = events.map(sanitizeEvent).filter(Boolean);
  const sanitizedFocus = focusSessions.map(sanitizeFocusSession).filter(Boolean);
  const sanitizedIntegrations = integrations.map(sanitizeIntegration).filter(Boolean);
  const sanitizedSettings = sanitizeSettings(settings);

  return {
    events: sanitizedEvents,
    focusSessions: sanitizedFocus,
    integrations: sanitizedIntegrations,
    settings: sanitizedSettings,
    stats: buildOverviewStats(sanitizedEvents, sanitizedFocus),
  };
}

export async function listEvents(userId, options) {
  const overview = await getOverview(userId, options);
  return overview.events;
}

export async function createEvent(userId, payload) {
  const normalized = normalizeEventPayload(payload);
  const record = await CandidateCalendarEvent.create({ userId, ...normalized });
  return sanitizeEvent(record);
}

export async function updateEvent(userId, eventId, payload) {
  const record = await CandidateCalendarEvent.findOne({ where: { id: eventId, userId } });
  if (!record) {
    throw new NotFoundError('Calendar event not found.');
  }
  const normalized = normalizeEventPayload({ ...record.toPublicObject(), ...payload });
  await record.update(normalized);
  await record.reload();
  return sanitizeEvent(record);
}

export async function deleteEvent(userId, eventId) {
  const record = await CandidateCalendarEvent.findOne({ where: { id: eventId, userId } });
  if (!record) {
    throw new NotFoundError('Calendar event not found.');
  }
  await record.destroy();
}

export async function listFocusSessions(userId, { limit = 50 } = {}) {
  const sessions = await FocusSession.findAll({
    where: { userId },
    order: [['startedAt', 'DESC']],
    limit,
  });
  return sessions.map(sanitizeFocusSession).filter(Boolean);
}

export async function createFocusSession(userId, payload) {
  const normalized = normalizeFocusSessionPayload(payload);
  const record = await FocusSession.create({ userId, ...normalized });
  return sanitizeFocusSession(record);
}

export async function updateFocusSession(userId, focusSessionId, payload) {
  const record = await FocusSession.findOne({ where: { id: focusSessionId, userId } });
  if (!record) {
    throw new NotFoundError('Focus session not found.');
  }
  const normalized = normalizeFocusSessionPayload({ ...record.toPublicObject(), ...payload });
  await record.update(normalized);
  await record.reload();
  return sanitizeFocusSession(record);
}

export async function deleteFocusSession(userId, focusSessionId) {
  const record = await FocusSession.findOne({ where: { id: focusSessionId, userId } });
  if (!record) {
    throw new NotFoundError('Focus session not found.');
  }
  await record.destroy();
}

export async function getSettings(userId) {
  const settings = await UserCalendarSetting.findOne({ where: { userId } });
  return sanitizeSettings(settings);
}

export async function updateSettings(userId, payload) {
  const normalized = normalizeSettingsPayload(payload);
  const [record] = await UserCalendarSetting.findOrCreate({
    where: { userId },
    defaults: { userId, ...normalized },
  });
  if (!record.isNewRecord) {
    await record.update(normalized);
  }
  await record.reload();
  return sanitizeSettings(record);
}

export default {
  getOverview,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  listFocusSessions,
  createFocusSession,
  updateFocusSession,
  deleteFocusSession,
  getSettings,
  updateSettings,
};
