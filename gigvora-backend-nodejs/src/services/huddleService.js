import { Op, fn, col, literal } from 'sequelize';
import {
  CollaborationHuddle,
  CollaborationHuddleParticipant,
  CollaborationHuddleTemplate,
  CollaborationRoom,
  CollaborationSpace,
  User,
  UserPresenceStatus,
  UserPresenceEvent,
  PRESENCE_AVAILABILITY_STATES,
  sequelize,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_TEMPLATE_LIMIT = 6;
const DEFAULT_CONTEXT_ROOM_LIMIT = 4;

function normaliseId(value, label) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

function trimText(value) {
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  return text || null;
}

function buildTitleFromAgenda(agenda) {
  const fallback = 'Team Huddle';
  if (!agenda) {
    return fallback;
  }
  const firstLine = String(agenda).split('\n').map((line) => line.trim()).find(Boolean);
  if (!firstLine) {
    return fallback;
  }
  return firstLine.slice(0, 180);
}

async function recordPresenceForUsers(userIds, { title, description, startedAt, metadata }, { transaction } = {}) {
  const distinctIds = Array.from(new Set(userIds.filter((value) => Number.isFinite(value) && value > 0)));
  if (!distinctIds.length) {
    return;
  }

  const events = distinctIds.map((id) => ({
    userId: id,
    eventType: 'huddle',
    title: title ?? 'Collaboration huddle scheduled',
    description: description ?? null,
    startedAt: startedAt ?? new Date(),
    metadata: metadata ?? null,
  }));

  await UserPresenceEvent.bulkCreate(events, { transaction });
}

async function ensurePresenceProfiles(userIds, { transaction } = {}) {
  if (!Array.isArray(userIds) || !userIds.length) {
    return;
  }
  const distinctIds = Array.from(new Set(userIds.filter((value) => Number.isFinite(value) && value > 0)));
  if (!distinctIds.length) {
    return;
  }

  await Promise.all(
    distinctIds.map((id) =>
      UserPresenceStatus.findOrCreate({
        where: { userId: id },
        defaults: { availability: 'available', supportedStates: PRESENCE_AVAILABILITY_STATES },
        transaction,
      }),
    ),
  );
}

export async function getHuddleContext({ workspaceId, projectId } = {}) {
  const filters = {};
  const normalizedWorkspaceId = normaliseId(workspaceId, 'workspaceId');
  const normalizedProjectId = normaliseId(projectId, 'projectId');

  if (normalizedWorkspaceId) {
    filters.workspaceId = normalizedWorkspaceId;
  }
  if (normalizedProjectId) {
    filters.projectId = normalizedProjectId;
  }

  const upcomingPromise = CollaborationHuddle.findAll({
    where: {
      ...(filters.workspaceId ? { workspaceId: filters.workspaceId } : {}),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      status: { [Op.in]: ['scheduled', 'active'] },
    },
    include: [
      {
        model: CollaborationHuddleParticipant,
        as: 'participants',
        attributes: ['id', 'userId', 'responseStatus'],
      },
    ],
    order: [
      ['scheduledStart', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit: 5,
  });

  const recordingsPromise = CollaborationHuddle.findAll({
    where: {
      ...(filters.workspaceId ? { workspaceId: filters.workspaceId } : {}),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      recordingUrl: { [Op.ne]: null },
    },
    order: [
      ['endedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: 3,
  });

  const templatesPromise = CollaborationHuddleTemplate.findAll({
    where: normalizedWorkspaceId
      ? {
          [Op.or]: [{ workspaceId: normalizedWorkspaceId }, { workspaceId: null }],
        }
      : {},
    order: [
      ['workspaceId', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: DEFAULT_TEMPLATE_LIMIT,
  });

  const roomsPromise = CollaborationRoom.findAll({
    where: {
      roomType: { [Op.in]: ['huddle', 'video'] },
    },
    include: [
      { model: CollaborationSpace, as: 'space', attributes: ['id', 'name'] },
    ],
    order: [
      ['lastStartedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: DEFAULT_CONTEXT_ROOM_LIMIT,
  });

  const [upcoming, recordings, templates, rooms, counts, participantCount] = await Promise.all([
    upcomingPromise,
    recordingsPromise,
    templatesPromise,
    roomsPromise,
    CollaborationHuddle.count({ where: filters }),
    CollaborationHuddleParticipant.count({
      include: [
        {
          model: CollaborationHuddle,
          as: 'huddle',
          attributes: [],
          where: filters,
        },
      ],
    }),
  ]);

  const context = {
    filters: { workspaceId: normalizedWorkspaceId, projectId: normalizedProjectId },
    upcoming: upcoming.map((huddle) => ({
      ...huddle.toPublicObject(),
      participantCount: Array.isArray(huddle.participants) ? huddle.participants.length : 0,
    })),
    recentRecordings: recordings.map((recording) => recording.toPublicObject()),
    templates: templates.map((template) => template.toPublicObject()),
    focusRooms: rooms.map((room) => room.toPublicObject()),
    stats: {
      totalHuddles: counts,
      totalParticipants: participantCount,
      averageParticipants:
        counts > 0 ? Math.round((participantCount / counts) * 10) / 10 : 0,
    },
  };

  return context;
}

function buildPresenceLabel(state) {
  switch (state) {
    case 'focus':
      return 'Focus mode';
    case 'in_meeting':
      return 'In meeting';
    case 'do_not_disturb':
      return 'Do not disturb';
    case 'away':
      return 'Away';
    case 'offline':
      return 'Offline';
    default:
      return 'Available';
  }
}

function mapRecommendedParticipant(record, presenceMap) {
  const user = record.user;
  const huddleCount = Number.parseInt(record.get('huddleCount'), 10) || 0;
  const presence = presenceMap.get(record.userId) ?? null;
  return {
    id: user?.id ?? record.userId,
    name: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : null,
    email: user?.email ?? null,
    role: user?.jobTitle ?? null,
    huddleCount,
    presence: presence
      ? { state: presence.availability, label: buildPresenceLabel(presence.availability) }
      : null,
  };
}

export async function listRecommendedParticipants({ workspaceId, projectId, limit = 6 } = {}) {
  const normalizedWorkspaceId = normaliseId(workspaceId, 'workspaceId');
  const normalizedProjectId = normaliseId(projectId, 'projectId');

  const participationWhere = {};
  if (normalizedWorkspaceId) {
    participationWhere['$huddle.workspaceId$'] = normalizedWorkspaceId;
  }
  if (normalizedProjectId) {
    participationWhere['$huddle.projectId$'] = normalizedProjectId;
  }

  const participantRecords = await CollaborationHuddleParticipant.findAll({
    where: {
      userId: { [Op.ne]: null },
      ...participationWhere,
    },
    attributes: [
      'userId',
      [fn('COUNT', col('CollaborationHuddleParticipant.id')), 'huddleCount'],
    ],
    include: [
      {
        model: CollaborationHuddle,
        as: 'huddle',
        attributes: [],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'jobTitle'],
      },
    ],
    group: ['CollaborationHuddleParticipant.userId', 'user.id'],
    order: [[literal('huddleCount'), 'DESC']],
    limit,
  });

  const participantIds = participantRecords.map((record) => record.userId).filter(Boolean);
  const presenceRecords = await UserPresenceStatus.findAll({
    where: { userId: { [Op.in]: participantIds } },
  });
  const presenceMap = new Map(presenceRecords.map((record) => [record.userId, record.toPublicObject()]));

  let recommendations = participantRecords.map((record) => mapRecommendedParticipant(record, presenceMap));

  if (recommendations.length < limit && normalizedWorkspaceId) {
    const existing = new Set(recommendations.map((item) => item.id));
    const additionalMembers = await User.findAll({
      include: [
        {
          model: CollaborationHuddleParticipant,
          as: 'huddleParticipations',
          required: false,
        },
      ],
      where: {
        id: {
          [Op.notIn]: Array.from(existing),
        },
      },
      limit: limit - recommendations.length,
    });

    const more = additionalMembers.map((user) => ({
      id: user.id,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
      email: user.email,
      role: user.jobTitle ?? null,
      huddleCount: 0,
      presence: presenceMap.has(user.id)
        ? {
            state: presenceMap.get(user.id).availability,
            label: buildPresenceLabel(presenceMap.get(user.id).availability),
          }
        : null,
    }));

    recommendations = recommendations.concat(more);
  }

  return recommendations.slice(0, limit);
}

export async function createHuddle(payload = {}, { actorId = null } = {}) {
  const normalizedWorkspaceId = normaliseId(payload.workspaceId, 'workspaceId');
  const normalizedProjectId = normaliseId(payload.projectId, 'projectId');
  const followUpRoomId = normaliseId(payload.followUpRoomId, 'followUpRoomId');
  const attendeeIds = Array.isArray(payload.attendeeIds)
    ? payload.attendeeIds.map((value) => Number.parseInt(value, 10)).filter((value) => Number.isFinite(value) && value > 0)
    : [];

  const agenda = trimText(payload.agenda);
  const title = trimText(payload.title) || buildTitleFromAgenda(agenda);
  const notes = trimText(payload.notes);
  const recordMeeting = payload.recordMeeting == null ? true : Boolean(payload.recordMeeting);

  return sequelize.transaction(async (transaction) => {
    const huddle = await CollaborationHuddle.create(
      {
        workspaceId: normalizedWorkspaceId,
        projectId: normalizedProjectId,
        spaceId: normaliseId(payload.spaceId, 'spaceId'),
        createdById: actorId ?? null,
        followUpRoomId,
        title,
        agenda,
        notes,
        recordMeeting,
        status: 'draft',
      },
      { transaction },
    );

    if (attendeeIds.length) {
      const participantPayload = attendeeIds.map((id) => ({
        huddleId: huddle.id,
        userId: id,
        role: 'participant',
        responseStatus: 'invited',
        invitedAt: new Date(),
      }));
      await CollaborationHuddleParticipant.bulkCreate(participantPayload, { transaction, ignoreDuplicates: true });
    }

    if (actorId) {
      await recordPresenceForUsers([actorId], {
        title: 'Created collaboration huddle',
        description: title,
        metadata: { huddleId: huddle.id, type: 'create' },
      }, { transaction });
    }

    await ensurePresenceProfiles([actorId, ...attendeeIds], { transaction });

    return huddle.toPublicObject();
  });
}

export async function scheduleHuddle(huddleId, { startsAt, durationMinutes } = {}, { actorId = null } = {}) {
  const normalizedId = normaliseId(huddleId, 'huddleId');
  const start = startsAt ? normaliseDate(startsAt, 'startsAt') : null;
  const duration = durationMinutes == null ? null : Number.parseInt(durationMinutes, 10);
  if (duration != null && (!Number.isFinite(duration) || duration <= 0)) {
    throw new ValidationError('durationMinutes must be a positive integer.');
  }

  return sequelize.transaction(async (transaction) => {
    const huddle = await CollaborationHuddle.findOne({
      where: { id: normalizedId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!huddle) {
      throw new NotFoundError('Huddle not found.');
    }

    huddle.scheduledStart = start ?? new Date();
    huddle.scheduledDurationMinutes = duration;
    huddle.status = 'scheduled';
    await huddle.save({ transaction });

    const participantIds = await CollaborationHuddleParticipant.findAll({
      where: { huddleId: huddle.id, userId: { [Op.ne]: null } },
      attributes: ['userId'],
      transaction,
    });

    await recordPresenceForUsers(
      [actorId, ...participantIds.map((record) => record.userId)].filter(Boolean),
      {
        title: 'Huddle scheduled',
        description: huddle.title,
        startedAt: huddle.scheduledStart,
        metadata: { huddleId: huddle.id, durationMinutes: huddle.scheduledDurationMinutes },
      },
      { transaction },
    );

    return huddle.toPublicObject();
  });
}

export async function requestInstantHuddle(payload = {}, { actorId = null } = {}) {
  const duration = payload.durationMinutes == null ? 30 : Number.parseInt(payload.durationMinutes, 10);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new ValidationError('durationMinutes must be a positive integer.');
  }

  const huddle = await createHuddle(payload, { actorId });

  const now = new Date();
  const endsAt = new Date(now.getTime() + duration * 60 * 1000);

  const updated = await CollaborationHuddle.update(
    {
      status: 'active',
      startedAt: now,
      scheduledStart: now,
      scheduledDurationMinutes: duration,
      launchUrl: payload.launchUrl || `https://meet.gigvora.test/huddles/${huddle.id}`,
    },
    { where: { id: huddle.id }, returning: true },
  );

  const persisted = Array.isArray(updated[1]) && updated[1][0] ? updated[1][0] : await CollaborationHuddle.findOne({ where: { id: huddle.id } });

  if (actorId) {
    await recordPresenceForUsers([actorId], {
      title: 'Huddle launched',
      description: persisted.title,
      startedAt: now,
      metadata: { huddleId: persisted.id, durationMinutes: duration },
    });
  }

  return persisted.toPublicObject();
}

function normaliseDate(value, label) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${label} must be a valid ISO-8601 date.`);
  }
  return date;
}

export default {
  getHuddleContext,
  listRecommendedParticipants,
  createHuddle,
  scheduleHuddle,
  requestInstantHuddle,
};
