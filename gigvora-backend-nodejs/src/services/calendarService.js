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
import { fetchAvailabilityForIntegration } from './calendarIntegrationGateway.js';
import baseLogger from '../utils/logger.js';

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

const RECURRENCE_FREQUENCIES = new Set(['DAILY', 'WEEKLY', 'MONTHLY']);
const WEEKDAY_ALIASES = Object.freeze({
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
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

function normalizeRecurrencePayload(recurrence) {
  if (!recurrence || typeof recurrence !== 'object') {
    return { rule: null, until: null, count: null };
  }

  const frequencyRaw = recurrence.frequency ?? recurrence.freq;
  const normalizedFrequency = typeof frequencyRaw === 'string' ? frequencyRaw.trim().toUpperCase() : null;
  if (!normalizedFrequency || !RECURRENCE_FREQUENCIES.has(normalizedFrequency)) {
    throw new ValidationError('recurrence.frequency must be daily, weekly, or monthly.');
  }

  const parts = [`FREQ=${normalizedFrequency}`];

  const intervalRaw = recurrence.interval ?? 1;
  const interval = Number.parseInt(intervalRaw, 10);
  if (!Number.isNaN(interval) && interval > 1) {
    parts.push(`INTERVAL=${interval}`);
  }

  let untilDate = null;
  if (recurrence.until) {
    untilDate = parseDate(recurrence.until, 'recurrence.until');
  }

  let count = null;
  if (recurrence.count != null && recurrence.count !== '') {
    const parsed = Number.parseInt(recurrence.count, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new ValidationError('recurrence.count must be a positive integer when provided.');
    }
    count = parsed;
    parts.push(`COUNT=${count}`);
  }

  const byWeekdayRaw = Array.isArray(recurrence.byWeekday) ? recurrence.byWeekday : recurrence.byDay;
  if (byWeekdayRaw && !Array.isArray(byWeekdayRaw)) {
    throw new ValidationError('recurrence.byWeekday must be an array when provided.');
  }
  if (Array.isArray(byWeekdayRaw) && byWeekdayRaw.length > 0) {
    const normalizedDays = byWeekdayRaw
      .map((value) => (typeof value === 'string' ? value.trim().slice(0, 2).toUpperCase() : null))
      .filter((value) => value && WEEKDAY_ALIASES[value] !== undefined);
    if (!normalizedDays.length) {
      throw new ValidationError('recurrence.byWeekday must include valid weekday abbreviations.');
    }
    parts.push(`BYDAY=${normalizedDays.join(',')}`);
  }

  if (untilDate) {
    const stamp = new Date(untilDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    parts.push(`UNTIL=${stamp}`);
  }

  return {
    rule: parts.join(';'),
    until: untilDate,
    count,
  };
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
  const parentEventId =
    payload.parentEventId == null || payload.parentEventId === ''
      ? null
      : Number.parseInt(payload.parentEventId, 10);
  if (parentEventId != null && (Number.isNaN(parentEventId) || parentEventId <= 0)) {
    throw new ValidationError('parentEventId must be a positive integer when provided.');
  }

  const recurrence = normalizeRecurrencePayload(payload.recurrence);

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
    recurrenceRule: recurrence.rule,
    recurrenceUntil: recurrence.until,
    recurrenceCount: recurrence.count,
    parentEventId,
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
    recurrence: event.recurrenceRule
      ? {
          rule: event.recurrenceRule,
          until: event.recurrenceUntil ? new Date(event.recurrenceUntil).toISOString() : null,
          count: event.recurrenceCount == null ? null : Number(event.recurrenceCount),
          parentEventId:
            event.parentEventId == null || Number.isNaN(Number(event.parentEventId))
              ? null
              : Number(event.parentEventId),
        }
      : null,
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

function formatDateToICS(date) {
  return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICSText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function buildICSEvent(event) {
  const lines = ['BEGIN:VEVENT'];
  const now = new Date();
  lines.push(`UID:${event.id}@gigvora`);
  lines.push(`DTSTAMP:${formatDateToICS(now)}`);
  if (event.startsAt) {
    lines.push(`DTSTART:${formatDateToICS(event.startsAt)}`);
  }
  if (event.endsAt) {
    lines.push(`DTEND:${formatDateToICS(event.endsAt)}`);
  }
  lines.push(`SUMMARY:${escapeICSText(event.title ?? 'Calendar event')}`);
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`);
  }
  if (event.recurrence?.rule) {
    lines.push(`RRULE:${event.recurrence.rule}`);
  }
  lines.push('STATUS:CONFIRMED');
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function buildICSCalendar(events) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gigvora//Calendar//EN'];
  events.forEach((event) => {
    lines.push(buildICSEvent(event));
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function parseIcsDate(value) {
  if (!value) return null;
  const cleaned = value.endsWith('Z') ? value : `${value}Z`;
  const normalized = cleaned.replace(
    /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
    '$1-$2-$3T$4:$5:$6Z',
  );
  return new Date(normalized);
}

function addDays(date, days) {
  const instance = new Date(date);
  instance.setUTCDate(instance.getUTCDate() + days);
  return instance;
}

function addMonths(date, months) {
  const instance = new Date(date);
  instance.setUTCMonth(instance.getUTCMonth() + months);
  return instance;
}

function parseRecurrenceRule(rule) {
  return rule.split(';').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      acc[key.toUpperCase()] = value;
    }
    return acc;
  }, {});
}

function generateRecurringInstances(event, { windowStart, windowEnd, limit = 50 }) {
  if (!event.recurrence?.rule) {
    return [];
  }
  const parsed = parseRecurrenceRule(event.recurrence.rule);
  const freq = parsed.FREQ;
  const interval = Number.parseInt(parsed.INTERVAL ?? '1', 10) || 1;
  const countLimit = event.recurrence.count ?? (parsed.COUNT ? Number.parseInt(parsed.COUNT, 10) : null);
  const untilRaw = event.recurrence.until ?? (parsed.UNTIL ? parseIcsDate(parsed.UNTIL) : null);
  const untilTime = untilRaw ? new Date(untilRaw).getTime() : Number.POSITIVE_INFINITY;
  const baseStart = new Date(event.startsAt);
  const baseEnd = event.endsAt ? new Date(event.endsAt) : null;
  const durationMs = baseEnd ? baseEnd.getTime() - baseStart.getTime() : 0;
  const startWindow = windowStart ? new Date(windowStart) : new Date(baseStart);
  const endWindow = windowEnd ? new Date(windowEnd) : addMonths(baseStart, 3);
  const windowStartTime = startWindow.getTime();
  const windowEndTime = endWindow.getTime();
  const occurrences = [];
  const maxOccurrences = countLimit ?? limit;

  const pushOccurrence = (startDate) => {
    if (occurrences.length >= maxOccurrences) {
      return false;
    }
    const startTime = startDate.getTime();
    if (startTime <= baseStart.getTime()) {
      return true;
    }
    if (startTime < windowStartTime || startTime > windowEndTime || startTime > untilTime) {
      return true;
    }
    const endDate = durationMs ? new Date(startDate.getTime() + durationMs) : null;
    occurrences.push({
      ...event,
      id: `${event.id}-occurrence-${startTime}`,
      instanceId: `${event.id}-occurrence-${startTime}`,
      startsAt: startDate.toISOString(),
      endsAt: endDate ? endDate.toISOString() : null,
      recurringInstance: true,
      parentEventId: event.id,
    });
    return true;
  };

  if (freq === 'DAILY') {
    for (let index = 1; index <= maxOccurrences; index += 1) {
      const occurrenceStart = addDays(baseStart, interval * index);
      if (!pushOccurrence(occurrenceStart)) break;
      if (occurrenceStart.getTime() > untilTime) break;
    }
  } else if (freq === 'WEEKLY') {
    const byDays = parsed.BYDAY ? parsed.BYDAY.split(',').map((value) => value.trim().toUpperCase()) : null;
    const baseWeekday = baseStart.getUTCDay();
    let weeksProcessed = 0;
    while (occurrences.length < maxOccurrences) {
      const weekStart = addDays(baseStart, interval * weeksProcessed * 7);
      const dayCodes = byDays && byDays.length ? byDays : Object.keys(WEEKDAY_ALIASES).filter((code) => WEEKDAY_ALIASES[code] === baseWeekday);
      dayCodes
        .map((code) => WEEKDAY_ALIASES[code])
        .filter((dayIndex) => dayIndex !== undefined)
        .sort((a, b) => a - b)
        .forEach((dayIndex) => {
          const offset = (dayIndex - baseWeekday + 7) % 7;
          const occurrenceStart = addDays(weekStart, offset);
          pushOccurrence(occurrenceStart);
        });
      weeksProcessed += 1;
      if (weekStart.getTime() > untilTime) {
        break;
      }
      if (countLimit && occurrences.length >= countLimit) {
        break;
      }
    }
  } else if (freq === 'MONTHLY') {
    for (let index = 1; index <= maxOccurrences; index += 1) {
      const occurrenceStart = addMonths(baseStart, interval * index);
      if (!pushOccurrence(occurrenceStart)) break;
      if (occurrenceStart.getTime() > untilTime) break;
    }
  }

  return occurrences;
}

function expandRecurringEvents(events, window) {
  const expanded = [...events];
  events.forEach((event) => {
    if (event.recurrence?.rule) {
      const instances = generateRecurringInstances(event, window ?? {});
      expanded.push(...instances);
    }
  });
  return expanded;
}

async function collectAvailabilityFromIntegrations(integrations, window, logger = baseLogger) {
  if (!Array.isArray(integrations) || integrations.length === 0) {
    return [];
  }

  const busyWindows = [];
  for (const integration of integrations) {
    try {
      const slots = await fetchAvailabilityForIntegration({ integration, window });
      slots.forEach((slot) => {
        if (!slot || !slot.start || !slot.end) {
          return;
        }
        busyWindows.push({
          provider: integration.provider,
          start: new Date(slot.start).toISOString(),
          end: new Date(slot.end).toISOString(),
          title: slot.title ?? null,
        });
      });
      await integration.update({ lastSyncedAt: new Date(), syncError: null });
    } catch (error) {
      logger?.warn?.({ err: error, provider: integration.provider }, 'Failed to sync calendar availability');
      await integration.update({ syncError: error.message.slice(0, 500) });
    }
  }

  busyWindows.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return busyWindows;
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
  let fromDate = null;
  let toDate = null;
  if (from) {
    fromDate = parseDate(from, 'from');
    dateFilter[Op.gte] = fromDate;
  }
  if (to) {
    toDate = parseDate(to, 'to');
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
  const recurrenceWindow = {
    windowStart: fromDate ?? new Date(),
    windowEnd: toDate ?? addMonths(new Date(), 3),
  };
  const expandedEvents = expandRecurringEvents(sanitizedEvents, recurrenceWindow);
  const sanitizedFocus = focusSessions.map(sanitizeFocusSession).filter(Boolean);
  const sanitizedIntegrations = integrations.map(sanitizeIntegration).filter(Boolean);
  const sanitizedSettings = sanitizeSettings(settings);
  const availability = await collectAvailabilityFromIntegrations(
    integrations,
    { start: recurrenceWindow.windowStart, end: recurrenceWindow.windowEnd },
    baseLogger,
  );

  return {
    events: expandedEvents,
    focusSessions: sanitizedFocus,
    integrations: sanitizedIntegrations,
    settings: sanitizedSettings,
    availability,
    stats: buildOverviewStats(expandedEvents, sanitizedFocus),
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

export async function exportEventToICS(userId, eventId) {
  const record = await CandidateCalendarEvent.findOne({ where: { id: eventId, userId } });
  if (!record) {
    throw new NotFoundError('Calendar event not found.');
  }
  const event = sanitizeEvent(record);
  const ics = buildICSCalendar([event]);
  return {
    filename: `calendar-event-${eventId}.ics`,
    contentType: 'text/calendar',
    body: ics,
  };
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

export async function syncAvailability(userId, { start, end } = {}) {
  const integrations = await CalendarIntegration.findAll({ where: { userId }, order: [['provider', 'ASC']] });
  const window = {
    start: start ? new Date(start) : new Date(),
    end: end ? new Date(end) : addMonths(new Date(), 1),
  };
  return collectAvailabilityFromIntegrations(integrations, window, baseLogger);
}

export default {
  getOverview,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  exportEventToICS,
  listFocusSessions,
  createFocusSession,
  updateFocusSession,
  deleteFocusSession,
  getSettings,
  updateSettings,
  syncAvailability,
};
