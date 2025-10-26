import { Op } from 'sequelize';
import {
  User,
  UserPresenceStatus,
  UserPresenceEvent,
  UserPresenceWindow,
  FocusSession,
  CalendarIntegration,
  CandidateCalendarEvent,
  CalendarSyncJob,
  PRESENCE_AVAILABILITY_STATES,
  PRESENCE_EVENT_TYPES,
  sequelize,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { triggerCalendarSync } from './calendarSyncService.js';

const DEFAULT_SUPPORTED_STATES = ['available', 'away', 'focus', 'in_meeting', 'do_not_disturb'];

function buildDisplayName(user) {
  const parts = [];
  if (user.firstName) {
    parts.push(String(user.firstName).trim());
  }
  if (user.lastName) {
    parts.push(String(user.lastName).trim());
  }
  const joined = parts.filter(Boolean).join(' ').trim();
  if (joined) {
    return joined;
  }
  if (user.email) {
    return user.email;
  }
  return `Member ${user.id}`;
}

function assertAvailability(value) {
  if (!value) {
    return 'available';
  }
  if (!PRESENCE_AVAILABILITY_STATES.includes(value)) {
    throw new ValidationError('availability value is invalid.');
  }
  return value;
}

function normaliseDate(value, field) {
  if (value == null || value === '') {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${field} must be a valid ISO-8601 date.`);
  }
  return date;
}

async function ensurePresenceStatus(userId, { transaction } = {}) {
  const defaults = {
    availability: 'available',
    online: false,
    supportedStates: DEFAULT_SUPPORTED_STATES,
  };
  const [record] = await UserPresenceStatus.findOrCreate({
    where: { userId },
    defaults,
    transaction,
  });
  if (!Array.isArray(record.supportedStates) || !record.supportedStates.length) {
    record.supportedStates = DEFAULT_SUPPORTED_STATES;
    await record.save({ transaction });
  }
  return record;
}

async function recordPresenceEvent(userId, { eventType, title, description, startedAt, endedAt, metadata }, { transaction } = {}) {
  if (!PRESENCE_EVENT_TYPES.includes(eventType)) {
    throw new ValidationError('eventType is invalid.');
  }
  const payload = {
    userId,
    eventType,
    title: title ?? null,
    description: description ?? null,
    startedAt: startedAt ?? new Date(),
    endedAt: endedAt ?? null,
    metadata: metadata ?? null,
  };
  await UserPresenceEvent.create(payload, { transaction });
}

async function buildCalendarSummary(userId, presenceRecord, { includeCalendar }) {
  if (!includeCalendar) {
    return { upcoming: [], providers: [], connectedProviders: [], lastSyncedAt: presenceRecord.calendarLastSyncedAt ?? null };
  }

  const [integrations, upcomingEvents, latestJob] = await Promise.all([
    CalendarIntegration.findAll({ where: { userId } }),
    CandidateCalendarEvent.findAll({
      where: { userId, startsAt: { [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) } },
      order: [
        ['startsAt', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      limit: 5,
    }),
    CalendarSyncJob.findOne({ where: { userId }, order: [['createdAt', 'DESC']] }),
  ]);

  const providers = integrations.map((integration) => integration.provider);
  const lastSyncedCandidates = [
    presenceRecord.calendarLastSyncedAt,
    ...integrations.map((integration) => integration.lastSyncedAt),
    latestJob?.lastSyncedAt,
  ].filter(Boolean);
  const lastSyncedAt = lastSyncedCandidates.length
    ? new Date(Math.max(...lastSyncedCandidates.map((value) => new Date(value).getTime())))
    : null;

  return {
    providers,
    connectedProviders: integrations.filter((integration) => integration.status !== 'disconnected').map((integration) => integration.provider),
    lastSyncedAt,
    nextSyncAt: latestJob?.nextSyncAt ?? null,
    upcoming: upcomingEvents.map((event) => event.toPublicObject()),
  };
}

async function buildFocusContext(userId, { includeFocus }) {
  if (!includeFocus) {
    return { activeSession: null };
  }

  const session = await FocusSession.findOne({
    where: { userId, [Op.or]: [{ completed: false }, { completed: null }] },
    order: [
      ['startedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  return { activeSession: session ? session.toPublicObject() : null };
}

async function buildTimeline(userId, { includeTimeline }) {
  if (!includeTimeline) {
    return [];
  }

  const events = await UserPresenceEvent.findAll({
    where: { userId },
    order: [
      ['startedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: 20,
  });

  return events.map((event) => event.toPublicObject());
}

function buildSummaryPayload(userId, presenceRecord, { calendarSummary, focusContext, timeline }) {
  const supportedStates = Array.isArray(presenceRecord.supportedStates) && presenceRecord.supportedStates.length
    ? presenceRecord.supportedStates
    : DEFAULT_SUPPORTED_STATES;

  return {
    userId,
    availability: presenceRecord.availability,
    message: presenceRecord.message ?? null,
    online: Boolean(presenceRecord.online ?? presenceRecord.availability !== 'offline'),
    focusUntil: presenceRecord.focusUntil ?? null,
    lastSeenAt: presenceRecord.lastSeenAt ?? null,
    supportedStates,
    calendar: calendarSummary,
    activeFocusSession: focusContext.activeSession,
    timeline,
  };
}

export async function getPresenceSnapshot(userId, { includeCalendar = true, includeTimeline = true, includeFocus = true } = {}) {
  const normalizedUserId = Number.parseInt(userId, 10);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new ValidationError('memberId must be a positive integer.');
  }

  const [user, presenceRecord] = await Promise.all([
    User.findOne({ where: { id: normalizedUserId }, attributes: ['id', 'firstName', 'lastName', 'email'] }),
    ensurePresenceStatus(normalizedUserId),
  ]);

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const [calendarSummary, focusContext, timeline] = await Promise.all([
    buildCalendarSummary(normalizedUserId, presenceRecord, { includeCalendar }),
    buildFocusContext(normalizedUserId, { includeFocus }),
    buildTimeline(normalizedUserId, { includeTimeline }),
  ]);

  return {
    user: {
      id: user.id,
      name: buildDisplayName(user),
      email: user.email,
    },
    snapshot: buildSummaryPayload(normalizedUserId, presenceRecord.toPublicObject(), {
      calendarSummary,
      focusContext,
      timeline,
    }),
  };
}

export async function getPresenceBatch({ memberIds, includeCalendar = true, includeTimeline = false, includeFocus = false } = {}) {
  if (!Array.isArray(memberIds) || !memberIds.length) {
    throw new ValidationError('memberIds are required to fetch presence batch.');
  }

  const uniqueIds = Array.from(
    new Set(
      memberIds
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

  if (!uniqueIds.length) {
    throw new ValidationError('memberIds must contain at least one valid identifier.');
  }

  const snapshots = await Promise.all(
    uniqueIds.map((id) => getPresenceSnapshot(id, { includeCalendar, includeTimeline, includeFocus })),
  );

  return snapshots;
}

export async function updatePresenceStatus(userId, { availability, message, focusUntil, metadata } = {}) {
  const normalizedUserId = Number.parseInt(userId, 10);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new ValidationError('memberId must be a positive integer.');
  }

  return sequelize.transaction(async (transaction) => {
    const presenceRecord = await ensurePresenceStatus(normalizedUserId, { transaction });
    const nextAvailability = assertAvailability(availability ?? presenceRecord.availability);
    const nextFocusUntil = focusUntil == null ? null : normaliseDate(focusUntil, 'focusUntil');

    presenceRecord.availability = nextAvailability;
    presenceRecord.message = message ?? null;
    presenceRecord.focusUntil = nextFocusUntil;
    presenceRecord.online = nextAvailability !== 'offline';
    presenceRecord.metadata = metadata && typeof metadata === 'object' ? { ...metadata } : metadata ?? presenceRecord.metadata;

    if (nextAvailability === 'offline') {
      presenceRecord.lastSeenAt = new Date();
    }

    await presenceRecord.save({ transaction });

    await recordPresenceEvent(
      normalizedUserId,
      {
        eventType: 'status_change',
        title: 'Availability updated',
        description: message ?? `Set status to ${nextAvailability.replace(/_/g, ' ')}`,
        startedAt: new Date(),
        metadata: { availability: nextAvailability },
      },
      { transaction },
    );

    return presenceRecord.toPublicObject();
  });
}

export async function startFocusSession(userId, { durationMinutes = 25, note, focusType = 'deep_work', autoMute = true } = {}) {
  const normalizedUserId = Number.parseInt(userId, 10);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new ValidationError('memberId must be a positive integer.');
  }

  return sequelize.transaction(async (transaction) => {
    const presenceRecord = await ensurePresenceStatus(normalizedUserId, { transaction });
    const now = new Date();
    const endsAt = durationMinutes ? new Date(now.getTime() + Number(durationMinutes) * 60 * 1000) : null;

    const session = await FocusSession.create(
      {
        userId: normalizedUserId,
        focusType,
        startedAt: now,
        durationMinutes: durationMinutes ?? null,
        completed: false,
        notes: note ?? null,
        metadata: { autoMute: Boolean(autoMute) },
      },
      { transaction },
    );

    presenceRecord.availability = 'focus';
    presenceRecord.activeFocusSessionId = session.id;
    presenceRecord.focusUntil = endsAt;
    presenceRecord.online = true;
    await presenceRecord.save({ transaction });

    await recordPresenceEvent(
      normalizedUserId,
      {
        eventType: 'focus_session',
        title: 'Focus session started',
        description: note ?? 'Focus mode engaged',
        startedAt: now,
        endedAt: endsAt,
        metadata: { durationMinutes, focusType, autoMute: Boolean(autoMute) },
      },
      { transaction },
    );

    return session.toPublicObject();
  });
}

export async function endFocusSession(userId) {
  const normalizedUserId = Number.parseInt(userId, 10);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new ValidationError('memberId must be a positive integer.');
  }

  return sequelize.transaction(async (transaction) => {
    const presenceRecord = await ensurePresenceStatus(normalizedUserId, { transaction });
    const session = await FocusSession.findOne({
      where: { userId: normalizedUserId, [Op.or]: [{ completed: false }, { completed: null }] },
      order: [
        ['startedAt', 'DESC'],
        ['id', 'DESC'],
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!session) {
      throw new NotFoundError('No active focus session to end.');
    }

    const finishedAt = new Date();
    session.completed = true;
    session.endedAt = finishedAt;
    if (!session.durationMinutes && session.startedAt) {
      const elapsedMinutes = Math.max(1, Math.round((finishedAt.getTime() - new Date(session.startedAt).getTime()) / 60000));
      session.durationMinutes = elapsedMinutes;
    }
    await session.save({ transaction });

    presenceRecord.activeFocusSessionId = null;
    presenceRecord.focusUntil = null;
    if (presenceRecord.availability === 'focus') {
      presenceRecord.availability = 'available';
    }
    await presenceRecord.save({ transaction });

    await recordPresenceEvent(
      normalizedUserId,
      {
        eventType: 'focus_session',
        title: 'Focus session completed',
        startedAt: session.startedAt,
        endedAt: finishedAt,
        metadata: { sessionId: session.id },
      },
      { transaction },
    );

    return session.toPublicObject();
  });
}

export async function scheduleAvailabilityWindow(userId, { startAt, endAt, recurringRule, note, timezone } = {}) {
  const normalizedUserId = Number.parseInt(userId, 10);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new ValidationError('memberId must be a positive integer.');
  }

  const start = startAt ? normaliseDate(startAt, 'startAt') : null;
  const end = endAt ? normaliseDate(endAt, 'endAt') : null;
  if (start && end && end < start) {
    throw new ValidationError('endAt must occur after startAt.');
  }

  return sequelize.transaction(async (transaction) => {
    const window = await UserPresenceWindow.create(
      {
        userId: normalizedUserId,
        startAt: start,
        endAt: end,
        recurringRule: recurringRule ?? null,
        note: note ?? null,
        timezone: timezone ?? null,
        metadata: null,
      },
      { transaction },
    );

    await recordPresenceEvent(
      normalizedUserId,
      {
        eventType: 'availability_window',
        title: 'Availability window scheduled',
        startedAt: start ?? new Date(),
        endedAt: end ?? null,
        metadata: { recurringRule: recurringRule ?? null, timezone: timezone ?? null },
      },
      { transaction },
    );

    return window.toPublicObject();
  });
}

export async function refreshCalendarSync(userId, { actorId = null } = {}) {
  const normalizedUserId = Number.parseInt(userId, 10);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new ValidationError('memberId must be a positive integer.');
  }

  const job = await triggerCalendarSync(normalizedUserId, { actorId });

  await recordPresenceEvent(normalizedUserId, {
    eventType: 'calendar_sync',
    title: 'Calendar sync triggered',
    description: 'Manual calendar refresh requested.',
    metadata: { jobId: job.id },
  });

  return job;
}

export default {
  getPresenceSnapshot,
  getPresenceBatch,
  updatePresenceStatus,
  startFocusSession,
  endFocusSession,
  scheduleAvailabilityWindow,
  refreshCalendarSync,
};
