import { Op } from 'sequelize';
import {
  CalendarIntegration,
  CandidateCalendarEvent,
  CalendarAvailabilitySnapshot,
  FocusSession,
  UserCalendarSetting,
} from '../models/index.js';
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_SOURCES,
  CALENDAR_EVENT_VISIBILITIES,
  CALENDAR_DEFAULT_VIEWS,
  FOCUS_SESSION_TYPES,
  CALENDAR_EVENT_SYNC_STATUSES,
} from '../models/constants/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { getCalendarProvider } from './calendarProviderRegistry.js';

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

function normalizeEventPayload(payload, { existing } = {}) {
  if (!payload?.title || !`${payload.title}`.trim()) {
    throw new ValidationError('title is required.');
  }

  const existingPlain = existing?.toPublicObject ? existing.toPublicObject() : existing ?? {};

  const eventType = payload.eventType ?? existingPlain.eventType ?? 'event';
  if (!CALENDAR_EVENT_TYPES.includes(eventType)) {
    throw new ValidationError('eventType is invalid.');
  }

  const source = payload.source ?? existingPlain.source ?? 'manual';
  if (!CALENDAR_EVENT_SOURCES.includes(source)) {
    throw new ValidationError('source must be a recognised calendar provider.');
  }

  const visibility = payload.visibility ?? existingPlain.visibility ?? 'private';
  if (!CALENDAR_EVENT_VISIBILITIES.includes(visibility)) {
    throw new ValidationError('visibility is invalid.');
  }

  const startsAtInput = payload.startsAt ?? existingPlain.startsAt;
  const startsAt = parseDate(startsAtInput, 'startsAt');
  const endsAtInput = payload.endsAt ?? existingPlain.endsAt ?? null;
  const endsAt = endsAtInput ? parseDate(endsAtInput, 'endsAt') : null;
  if (endsAt && endsAt < startsAt) {
    throw new ValidationError('endsAt must be greater than or equal to startsAt.');
  }

  const reminderMinutesInput =
    payload.reminderMinutes ?? existingPlain.reminderMinutes ?? null;
  const reminderMinutes =
    reminderMinutesInput == null || reminderMinutesInput === ''
      ? null
      : Number.parseInt(reminderMinutesInput, 10);
  if (reminderMinutes != null && (Number.isNaN(reminderMinutes) || reminderMinutes < 0 || reminderMinutes > 10080)) {
    throw new ValidationError('reminderMinutes must be between 0 and 10080.');
  }

  const relatedEntityIdInput =
    payload.relatedEntityId ?? existingPlain.relatedEntityId ?? null;
  const relatedEntityId =
    relatedEntityIdInput == null || relatedEntityIdInput === ''
      ? null
      : Number.parseInt(relatedEntityIdInput, 10);
  if (relatedEntityId != null && (Number.isNaN(relatedEntityId) || relatedEntityId <= 0)) {
    throw new ValidationError('relatedEntityId must be a positive integer.');
  }

  const timezoneInput = payload.timezone ?? existingPlain.timezone ?? null;
  const timezone = timezoneInput ? `${timezoneInput}`.trim() : null;

  const recurrenceRuleInput = payload.recurrenceRule ?? existingPlain.recurrenceRule ?? null;
  const recurrenceRule = recurrenceRuleInput ? `${recurrenceRuleInput}`.trim().toUpperCase() : null;
  if (recurrenceRule && !/^FREQ=/i.test(recurrenceRule)) {
    throw new ValidationError('recurrenceRule must be RFC5545 compliant.');
  }
  if (recurrenceRule && recurrenceRule.length > 512) {
    throw new ValidationError('recurrenceRule must be 512 characters or fewer.');
  }

  const recurrenceEndsAtInput = payload.recurrenceEndsAt ?? existingPlain.recurrenceEndsAt ?? null;
  const recurrenceEndsAt = recurrenceEndsAtInput ? parseDate(recurrenceEndsAtInput, 'recurrenceEndsAt') : null;

  const recurrenceCountInput = payload.recurrenceCount ?? existingPlain.recurrenceCount ?? null;
  const recurrenceCount =
    recurrenceCountInput == null || recurrenceCountInput === ''
      ? null
      : Number.parseInt(recurrenceCountInput, 10);
  if (recurrenceCount != null && (Number.isNaN(recurrenceCount) || recurrenceCount <= 0 || recurrenceCount > 520)) {
    throw new ValidationError('recurrenceCount must be between 1 and 520.');
  }

  const recurrenceParentIdInput = payload.recurrenceParentId ?? existingPlain.recurrenceParentId ?? null;
  const recurrenceParentId =
    recurrenceParentIdInput == null || recurrenceParentIdInput === ''
      ? null
      : Number.parseInt(recurrenceParentIdInput, 10);
  if (recurrenceParentId != null && (Number.isNaN(recurrenceParentId) || recurrenceParentId <= 0)) {
    throw new ValidationError('recurrenceParentId must be a positive integer.');
  }

  const icsUidInput = payload.icsUid ?? existingPlain.icsUid ?? null;
  const icsUid = icsUidInput ? `${icsUidInput}`.trim().slice(0, 255) : null;

  const externalProviderInput = payload.externalProvider ?? existingPlain.externalProvider ?? null;
  const externalProvider = externalProviderInput ? `${externalProviderInput}`.trim().toLowerCase() : null;

  const externalEventIdInput = payload.externalEventId ?? existingPlain.externalEventId ?? null;
  const externalEventId = externalEventIdInput ? `${externalEventIdInput}`.trim().slice(0, 255) : null;

  const existingSyncMetadata =
    existingPlain.syncMetadata && typeof existingPlain.syncMetadata === 'object'
      ? { ...existingPlain.syncMetadata }
      : null;
  const metadataOverrides =
    payload.syncMetadata && typeof payload.syncMetadata === 'object' ? { ...payload.syncMetadata } : null;
  const syncMetadata = metadataOverrides
    ? { ...(existingSyncMetadata ?? {}), ...metadataOverrides }
    : existingSyncMetadata;
  const metadataInput = payload.metadata ?? existingPlain.metadata ?? null;
  const metadata = metadataInput && typeof metadataInput === 'object' ? { ...metadataInput } : metadataInput ?? null;

  const syncRequested = Boolean(
    (externalProvider && externalProvider !== 'manual') || (source && source !== 'manual'),
  );
  const syncStatus = syncRequested ? 'pending' : 'synced';
  if (!CALENDAR_EVENT_SYNC_STATUSES.includes(syncStatus)) {
    throw new ValidationError('syncStatus is invalid.');
  }

  const sanitizedFocusMode = payload.focusMode ?? existingPlain.focusMode ?? null;

  return {
    title: `${payload.title}`.trim(),
    eventType,
    source,
    startsAt,
    endsAt,
    location: payload.location ? `${payload.location}`.trim() : existingPlain.location ?? null,
    description: payload.description ? `${payload.description}`.trim() : existingPlain.description ?? null,
    videoConferenceLink:
      payload.videoConferenceLink
        ? `${payload.videoConferenceLink}`.trim()
        : existingPlain.videoConferenceLink ?? null,
    isAllDay: payload.isAllDay == null ? Boolean(existingPlain.isAllDay) : Boolean(payload.isAllDay),
    reminderMinutes,
    visibility,
    relatedEntityType:
      payload.relatedEntityType
        ? `${payload.relatedEntityType}`.trim()
        : existingPlain.relatedEntityType ?? null,
    relatedEntityId,
    colorHex: normalizeColorHex(payload.colorHex ?? existingPlain.colorHex),
    metadata,
    focusMode: sanitizedFocusMode ? `${sanitizedFocusMode}`.trim() : null,
    timezone,
    recurrenceRule,
    recurrenceEndsAt,
    recurrenceCount,
    recurrenceParentId,
    icsUid,
    externalProvider,
    externalEventId,
    syncStatus,
    syncMetadata,
    syncedRevision:
      existingPlain.syncedRevision == null || Number.isNaN(Number(existingPlain.syncedRevision))
        ? null
        : Number(existingPlain.syncedRevision),
    lastSyncedAt: existingPlain.lastSyncedAt ?? null,
    isFocusBlock: payload.isFocusBlock == null ? Boolean(existingPlain.isFocusBlock) : Boolean(payload.isFocusBlock),
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
    timezone: event.timezone ?? null,
    recurrenceRule: event.recurrenceRule ?? null,
    recurrenceEndsAt: event.recurrenceEndsAt ? new Date(event.recurrenceEndsAt).toISOString() : null,
    recurrenceCount:
      event.recurrenceCount == null || Number.isNaN(Number(event.recurrenceCount))
        ? null
        : Number(event.recurrenceCount),
    recurrenceParentId:
      event.recurrenceParentId == null || Number.isNaN(Number(event.recurrenceParentId))
        ? null
        : Number(event.recurrenceParentId),
    icsUid: event.icsUid ?? null,
    externalProvider: event.externalProvider ?? null,
    externalEventId: event.externalEventId ?? null,
    syncStatus: event.syncStatus ?? 'pending',
    syncMetadata:
      event.syncMetadata && typeof event.syncMetadata === 'object' ? { ...event.syncMetadata } : null,
    syncedRevision:
      event.syncedRevision == null || Number.isNaN(Number(event.syncedRevision))
        ? null
        : Number(event.syncedRevision),
    lastSyncedAt: event.lastSyncedAt ? new Date(event.lastSyncedAt).toISOString() : null,
    isFocusBlock: Boolean(event.isFocusBlock),
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

function sanitizeAvailabilitySnapshot(record) {
  if (!record) return null;
  const snapshot = record.toPublicObject ? record.toPublicObject() : record;
  return {
    ...snapshot,
    syncedAt: snapshot.syncedAt ? new Date(snapshot.syncedAt).toISOString() : null,
    availability: snapshot.availability ?? null,
    metadata: snapshot.metadata ?? null,
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
  const hasDateBounds =
    Object.keys(dateFilter).length > 0 || Object.getOwnPropertySymbols(dateFilter).length > 0;
  if (hasDateBounds) {
    where.startsAt = dateFilter;
  }

  const [events, focusSessions, integrations, settings, availabilitySnapshots] = await Promise.all([
    CandidateCalendarEvent.findAll({ where, order: [['startsAt', 'ASC']], limit }),
    FocusSession.findAll({ where: { userId }, order: [['startedAt', 'DESC']], limit: 50 }),
    CalendarIntegration.findAll({ where: { userId }, order: [['provider', 'ASC']] }),
    UserCalendarSetting.findOne({ where: { userId } }),
    CalendarAvailabilitySnapshot.findAll({
      where: { userId },
      order: [['syncedAt', 'DESC']],
      limit: 10,
    }),
  ]);

  const sanitizedEvents = events.map(sanitizeEvent).filter(Boolean);
  const sanitizedFocus = focusSessions.map(sanitizeFocusSession).filter(Boolean);
  const sanitizedIntegrations = integrations.map(sanitizeIntegration).filter(Boolean);
  const sanitizedSettings = sanitizeSettings(settings);
  const sanitizedAvailability = availabilitySnapshots.map(sanitizeAvailabilitySnapshot).filter(Boolean);

  return {
    events: sanitizedEvents,
    focusSessions: sanitizedFocus,
    integrations: sanitizedIntegrations,
    settings: sanitizedSettings,
    stats: buildOverviewStats(sanitizedEvents, sanitizedFocus),
    availability: {
      latest: sanitizedAvailability[0] ?? null,
      snapshots: sanitizedAvailability,
    },
  };
}

export async function listEvents(userId, options) {
  const overview = await getOverview(userId, options);
  return overview.events;
}

export async function createEvent(userId, payload) {
  const normalized = normalizeEventPayload(payload);
  const record = await CandidateCalendarEvent.create({ userId, ...normalized });
  await syncEventWithProvider(record, { reason: 'created' });
  return sanitizeEvent(record);
}

export async function updateEvent(userId, eventId, payload) {
  const record = await CandidateCalendarEvent.findOne({ where: { id: eventId, userId } });
  if (!record) {
    throw new NotFoundError('Calendar event not found.');
  }
  const normalized = normalizeEventPayload({ ...record.toPublicObject(), ...payload }, { existing: record });
  await record.update(normalized);
  await syncEventWithProvider(record, { reason: 'updated' });
  await record.reload();
  return sanitizeEvent(record);
}

export async function deleteEvent(userId, eventId) {
  const record = await CandidateCalendarEvent.findOne({ where: { id: eventId, userId } });
  if (!record) {
    throw new NotFoundError('Calendar event not found.');
  }
  const providerKey =
    record.externalProvider ?? (record.source && record.source !== 'manual' ? record.source : null);
  if (providerKey) {
    const provider = getCalendarProvider(providerKey);
    if (provider?.deleteEvent) {
      await provider.deleteEvent(record, { reason: 'deleted' }).catch((error) => {
        throw new ValidationError(
          `Failed to delete event from provider "${providerKey}": ${error?.message ?? 'Unknown error'}.`,
        );
      });
    }
  }
  await record.destroy();
}

export async function recordAvailabilitySnapshot(
  userId,
  provider,
  { availability = null, metadata = null, syncedAt = new Date() } = {},
) {
  if (!userId) {
    throw new ValidationError('userId is required to record availability.');
  }
  if (!provider || !`${provider}`.trim()) {
    throw new ValidationError('provider is required to record availability.');
  }

  const normalizedProvider = `${provider}`.trim().toLowerCase();
  const syncedAtDate = syncedAt instanceof Date ? syncedAt : new Date(syncedAt);
  if (Number.isNaN(syncedAtDate.getTime())) {
    throw new ValidationError('syncedAt must be a valid ISO-8601 datetime.');
  }

  const payload = {
    userId,
    provider: normalizedProvider,
    syncedAt: syncedAtDate,
    availability: availability && typeof availability === 'object' ? { ...availability } : null,
    metadata: metadata && typeof metadata === 'object' ? { ...metadata } : null,
  };

  const record = await CalendarAvailabilitySnapshot.create(payload);
  return sanitizeAvailabilitySnapshot(record);
}

export async function listAvailabilitySnapshots(userId, { provider, limit = 10 } = {}) {
  if (!userId) {
    throw new ValidationError('userId is required to list availability snapshots.');
  }

  const where = { userId };
  if (provider && `${provider}`.trim()) {
    where.provider = `${provider}`.trim().toLowerCase();
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const records = await CalendarAvailabilitySnapshot.findAll({
    where,
    order: [['syncedAt', 'DESC']],
    limit: safeLimit,
  });

  return records.map(sanitizeAvailabilitySnapshot).filter(Boolean);
}

export async function syncEventWithProvider(eventRecord, { reason = 'updated' } = {}) {
  if (!eventRecord?.id) {
    throw new ValidationError('eventRecord with an id is required to sync.');
  }

  const providerKey =
    eventRecord.externalProvider ?? (eventRecord.source && eventRecord.source !== 'manual' ? eventRecord.source : null);

  const existingMetadata =
    eventRecord.syncMetadata && typeof eventRecord.syncMetadata === 'object'
      ? { ...eventRecord.syncMetadata }
      : {};

  if (!providerKey) {
    await eventRecord.update({
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
      syncMetadata: {
        ...existingMetadata,
        provider: 'internal',
        lastSyncReason: reason,
      },
    });
    await eventRecord.reload();
    return { status: 'synced', provider: null, record: eventRecord };
  }

  const provider = getCalendarProvider(providerKey);
  if (!provider || typeof provider.syncEvent !== 'function') {
    await eventRecord.update({
      syncStatus: 'failed',
      syncMetadata: {
        ...existingMetadata,
        provider: providerKey,
        reason,
        failedAt: new Date().toISOString(),
        lastError: `Calendar provider "${providerKey}" is not registered.`,
      },
    });
    await eventRecord.reload();
    return { status: 'failed', provider: providerKey, record: eventRecord };
  }

  try {
    const response = await provider.syncEvent(eventRecord, { reason });
    const nextMetadata = {
      ...existingMetadata,
      provider: providerKey,
      lastSyncReason: reason,
      ...(response?.metadata && typeof response.metadata === 'object' ? response.metadata : {}),
    };
    const currentRevision = Number.isFinite(Number(eventRecord.syncedRevision))
      ? Number(eventRecord.syncedRevision)
      : 0;
    await eventRecord.update({
      syncStatus: 'synced',
      syncedRevision: currentRevision + 1,
      lastSyncedAt: new Date(),
      syncMetadata: nextMetadata,
    });
    await eventRecord.reload();
    return { status: 'synced', provider: providerKey, record: eventRecord, metadata: nextMetadata };
  } catch (error) {
    await eventRecord.update({
      syncStatus: 'failed',
      syncMetadata: {
        ...existingMetadata,
        provider: providerKey,
        reason,
        failedAt: new Date().toISOString(),
        lastError: error?.message ?? 'Unknown calendar sync failure.',
      },
    });
    await eventRecord.reload();
    return { status: 'failed', provider: providerKey, error, record: eventRecord };
  }
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
  recordAvailabilitySnapshot,
  listAvailabilitySnapshots,
  syncEventWithProvider,
};
