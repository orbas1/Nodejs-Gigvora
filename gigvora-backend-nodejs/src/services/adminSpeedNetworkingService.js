import { Op } from 'sequelize';
import {
  SpeedNetworkingSession,
  SpeedNetworkingRoom,
  SpeedNetworkingParticipant,
  User,
  ProviderWorkspace,
} from '../models/index.js';
import {
  SPEED_NETWORKING_SESSION_STATUSES,
  SPEED_NETWORKING_ACCESS_LEVELS,
  SPEED_NETWORKING_VISIBILITIES,
  SPEED_NETWORKING_MATCHING_STRATEGIES,
  SPEED_NETWORKING_PARTICIPANT_ROLES,
  SPEED_NETWORKING_PARTICIPANT_STATUSES,
} from '../models/constants/index.js';
import sequelize from '../models/sequelizeClient.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [value];
}

function normaliseDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
}

function humanise(value = '') {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function serialiseUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    email: user.email,
    avatarUrl: user.avatarUrl,
    userType: user.userType,
  };
}

function serialiseWorkspace(workspace) {
  if (!workspace) return null;
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
  };
}

function serialiseRoom(room) {
  if (!room) return null;
  return {
    id: room.id,
    name: room.name,
    topic: room.topic,
    capacity: room.capacity,
    isLocked: Boolean(room.isLocked),
    meetingUrl: room.meetingUrl,
    facilitator: serialiseUser(room.facilitator),
    rotationIntervalSeconds: room.rotationIntervalSeconds,
    instructions: room.instructions,
    metadata: room.metadata ?? null,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

function serialiseParticipant(participant) {
  if (!participant) return null;
  return {
    id: participant.id,
    sessionId: participant.sessionId,
    user: serialiseUser(participant.user),
    email: participant.email,
    fullName: participant.fullName,
    role: participant.role,
    status: participant.status,
    assignedRoom: serialiseRoom(participant.assignedRoom),
    checkInAt: participant.checkInAt,
    lastMatchedAt: participant.lastMatchedAt,
    interests: participant.interests ?? [],
    goals: participant.goals,
    notes: participant.notes,
    metadata: participant.metadata ?? null,
    createdAt: participant.createdAt,
    updatedAt: participant.updatedAt,
    createdBy: serialiseUser(participant.createdBy),
    updatedBy: serialiseUser(participant.updatedBy),
  };
}

function serialiseSession(session) {
  if (!session) return null;
  return {
    id: session.id,
    title: session.title,
    description: session.description,
    status: session.status,
    accessLevel: session.accessLevel,
    visibility: session.visibility,
    host: serialiseUser(session.host),
    adminOwner: serialiseUser(session.adminOwner),
    workspace: serialiseWorkspace(session.workspace),
    capacity: session.capacity,
    roundDurationSeconds: session.roundDurationSeconds,
    totalRounds: session.totalRounds,
    bufferSeconds: session.bufferSeconds,
    scheduledStart: session.scheduledStart,
    scheduledEnd: session.scheduledEnd,
    timezone: session.timezone,
    registrationCloseAt: session.registrationCloseAt,
    meetingProvider: session.meetingProvider,
    meetingUrl: session.meetingUrl,
    lobbyUrl: session.lobbyUrl,
    instructions: session.instructions,
    matchingStrategy: session.matchingStrategy,
    tags: session.tags ?? [],
    settings: session.settings ?? {},
    assets: session.assets ?? {},
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    rooms: Array.isArray(session.rooms) ? session.rooms.map(serialiseRoom) : undefined,
    participants: Array.isArray(session.participants)
      ? session.participants.map(serialiseParticipant)
      : undefined,
  };
}

export async function fetchSpeedNetworkingCatalog() {
  const [hosts, workspaces] = await Promise.all([
    User.findAll({
      where: { status: 'active' },
      order: [['firstName', 'ASC']],
      limit: 50,
      attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'],
    }),
    ProviderWorkspace.findAll({
      order: [['name', 'ASC']],
      limit: 50,
      attributes: ['id', 'name', 'slug'],
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    hosts: hosts.map(serialiseUser),
    workspaces: workspaces.map(serialiseWorkspace),
    statuses: SPEED_NETWORKING_SESSION_STATUSES.map((value) => ({ value, label: humanise(value) })),
    accessLevels: SPEED_NETWORKING_ACCESS_LEVELS.map((value) => ({ value, label: humanise(value) })),
    visibilities: SPEED_NETWORKING_VISIBILITIES.map((value) => ({ value, label: humanise(value) })),
    matchingStrategies: SPEED_NETWORKING_MATCHING_STRATEGIES.map((value) => ({ value, label: humanise(value) })),
    participantRoles: SPEED_NETWORKING_PARTICIPANT_ROLES.map((value) => ({ value, label: humanise(value) })),
    participantStatuses: SPEED_NETWORKING_PARTICIPANT_STATUSES.map((value) => ({ value, label: humanise(value) })),
    defaultRoundDurations: [180, 300, 420, 600],
  };
}

function buildFilters(filters = {}) {
  const where = {};
  const statusList = toArray(filters.status).filter((value) => SPEED_NETWORKING_SESSION_STATUSES.includes(value));
  if (statusList.length) {
    where.status = { [Op.in]: statusList };
  }
  if (filters.hostId) {
    where.hostId = Number(filters.hostId);
  }
  if (filters.ownerId) {
    where.adminOwnerId = Number(filters.ownerId);
  }
  if (filters.workspaceId) {
    where.workspaceId = Number(filters.workspaceId);
  }
  if (filters.from || filters.to) {
    const from = normaliseDate(filters.from);
    const to = normaliseDate(filters.to);
    if (from || to) {
      where.scheduledStart = {};
      if (from) {
        where.scheduledStart[Op.gte] = from;
      }
      if (to) {
        where.scheduledStart[Op.lte] = to;
      }
    }
  }
  if (filters.search) {
    where.title = { [Op.like]: `%${filters.search}%` };
  }
  return where;
}

export async function listSpeedNetworkingSessions(filters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 20));
  const offset = (page - 1) * pageSize;

  const where = buildFilters(filters);

  const [rows, total, metrics] = await Promise.all([
    SpeedNetworkingSession.findAll({
      where,
      limit: pageSize,
      offset,
      order: [['scheduledStart', 'DESC']],
      include: [
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
        { model: User, as: 'adminOwner', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
        { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
        {
          model: SpeedNetworkingParticipant,
          as: 'participants',
          separate: true,
          attributes: ['id', 'status'],
        },
      ],
    }),
    SpeedNetworkingSession.count({ where }),
    SpeedNetworkingParticipant.findAll({
      where: {
        ...(filters.hostId ? { '$session.hostId$': Number(filters.hostId) } : {}),
      },
      include: [
        {
          model: SpeedNetworkingSession,
          as: 'session',
          attributes: ['id', 'status'],
          required: true,
          where,
        },
      ],
      attributes: ['status'],
    }),
  ]);

  const participantTotals = metrics.reduce(
    (acc, entry) => {
      acc.total += 1;
      if (entry.status === 'checked_in' || entry.status === 'active' || entry.status === 'completed') {
        acc.engaged += 1;
      }
      return acc;
    },
    { total: 0, engaged: 0 },
  );

  const totalsByStatus = SPEED_NETWORKING_SESSION_STATUSES.reduce((acc, status) => {
    acc[status] = rows.filter((row) => row.status === status).length;
    return acc;
  }, {});

  return {
    data: rows.map((row) => {
      const session = serialiseSession(row);
      const participants = Array.isArray(row.participants) ? row.participants : [];
      return {
        ...session,
        participantCounts: participants.reduce(
          (acc, participant) => {
            acc.total += 1;
            acc[participant.status] = (acc[participant.status] || 0) + 1;
            return acc;
          },
          { total: 0 },
        ),
      };
    }),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    metrics: {
      totalsByStatus,
      participantsTotal: participantTotals.total,
      participantsEngaged: participantTotals.engaged,
    },
  };
}

export async function getSpeedNetworkingSession(sessionId) {
  const session = await SpeedNetworkingSession.findByPk(sessionId, {
    include: [
      { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
      { model: User, as: 'adminOwner', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
      { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
      {
        model: SpeedNetworkingRoom,
        as: 'rooms',
        include: [{ model: User, as: 'facilitator', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] }],
        order: [['name', 'ASC']],
      },
      {
        model: SpeedNetworkingParticipant,
        as: 'participants',
        include: [
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
          {
            model: SpeedNetworkingRoom,
            as: 'assignedRoom',
            include: [{ model: User, as: 'facilitator', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] }],
          },
          { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
          { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
        ],
      },
    ],
    order: [[{ model: SpeedNetworkingRoom, as: 'rooms' }, 'name', 'ASC']],
  });

  if (!session) {
    throw new NotFoundError('Speed networking session not found.');
  }

  return serialiseSession(session);
}

async function upsertRooms(sessionId, rooms = [], transaction) {
  const existing = await SpeedNetworkingRoom.findAll({ where: { sessionId }, transaction });
  const nextRoomIds = [];

  for (const room of rooms) {
    if (room.id) {
      await SpeedNetworkingRoom.update(
        {
          name: room.name,
          topic: room.topic,
          capacity: room.capacity,
          isLocked: Boolean(room.isLocked),
          meetingUrl: room.meetingUrl,
          facilitatorId: room.facilitatorId || null,
          rotationIntervalSeconds: room.rotationIntervalSeconds || null,
          instructions: room.instructions,
          metadata: room.metadata ?? null,
        },
        { where: { id: room.id, sessionId }, transaction },
      );
      nextRoomIds.push(room.id);
    } else {
      const created = await SpeedNetworkingRoom.create(
        {
          sessionId,
          name: room.name,
          topic: room.topic,
          capacity: room.capacity,
          isLocked: Boolean(room.isLocked),
          meetingUrl: room.meetingUrl,
          facilitatorId: room.facilitatorId || null,
          rotationIntervalSeconds: room.rotationIntervalSeconds || null,
          instructions: room.instructions,
          metadata: room.metadata ?? null,
        },
        { transaction },
      );
      nextRoomIds.push(created.id);
    }
  }

  const obsolete = existing.filter((room) => !nextRoomIds.includes(room.id));
  if (obsolete.length) {
    await SpeedNetworkingRoom.destroy({
      where: { id: { [Op.in]: obsolete.map((room) => room.id) } },
      transaction,
    });
  }

  return SpeedNetworkingRoom.findAll({
    where: { sessionId },
    include: [{ model: User, as: 'facilitator', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] }],
    order: [['name', 'ASC']],
    transaction,
  });
}

async function syncParticipants(sessionId, participants = [], actorId, transaction) {
  const existing = await SpeedNetworkingParticipant.findAll({ where: { sessionId }, transaction });
  const nextIds = [];

  for (const entry of participants) {
    const payload = {
      sessionId,
      userId: entry.userId || null,
      email: entry.email || null,
      fullName: entry.fullName || null,
      role: SPEED_NETWORKING_PARTICIPANT_ROLES.includes(entry.role) ? entry.role : 'attendee',
      status: SPEED_NETWORKING_PARTICIPANT_STATUSES.includes(entry.status) ? entry.status : 'invited',
      assignedRoomId: entry.assignedRoomId || null,
      checkInAt: entry.checkInAt ? new Date(entry.checkInAt) : null,
      lastMatchedAt: entry.lastMatchedAt ? new Date(entry.lastMatchedAt) : null,
      interests: Array.isArray(entry.interests) ? entry.interests : entry.interests ?? null,
      goals: entry.goals || null,
      notes: entry.notes || null,
      metadata: entry.metadata ?? null,
      updatedById: actorId || null,
    };

    if (entry.id) {
      await SpeedNetworkingParticipant.update(payload, { where: { id: entry.id, sessionId }, transaction });
      nextIds.push(entry.id);
    } else {
      const created = await SpeedNetworkingParticipant.create(
        { ...payload, createdById: actorId || null },
        { transaction },
      );
      nextIds.push(created.id);
    }
  }

  const obsolete = existing.filter((participant) => !nextIds.includes(participant.id));
  if (obsolete.length) {
    await SpeedNetworkingParticipant.destroy({
      where: { id: { [Op.in]: obsolete.map((participant) => participant.id) } },
      transaction,
    });
  }

  return SpeedNetworkingParticipant.findAll({
    where: { sessionId },
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
      { model: SpeedNetworkingRoom, as: 'assignedRoom' },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
    ],
    transaction,
  });
}

export async function createSpeedNetworkingSession(payload = {}, actor = {}) {
  const actorId = actor?.id ?? null;
  return sequelize.transaction(async (transaction) => {
    const session = await SpeedNetworkingSession.create(
      {
        title: payload.title,
        description: payload.description,
        status: SPEED_NETWORKING_SESSION_STATUSES.includes(payload.status) ? payload.status : 'draft',
        accessLevel: SPEED_NETWORKING_ACCESS_LEVELS.includes(payload.accessLevel)
          ? payload.accessLevel
          : 'invite_only',
        visibility: SPEED_NETWORKING_VISIBILITIES.includes(payload.visibility) ? payload.visibility : 'internal',
        hostId: payload.hostId || null,
        adminOwnerId: payload.adminOwnerId || actorId || null,
        workspaceId: payload.workspaceId || null,
        capacity: payload.capacity || null,
        roundDurationSeconds: payload.roundDurationSeconds || 300,
        totalRounds: payload.totalRounds || 4,
        bufferSeconds: payload.bufferSeconds || 60,
        scheduledStart: payload.scheduledStart ? new Date(payload.scheduledStart) : null,
        scheduledEnd: payload.scheduledEnd ? new Date(payload.scheduledEnd) : null,
        timezone: payload.timezone || null,
        registrationCloseAt: payload.registrationCloseAt ? new Date(payload.registrationCloseAt) : null,
        meetingProvider: payload.meetingProvider || null,
        meetingUrl: payload.meetingUrl || null,
        lobbyUrl: payload.lobbyUrl || null,
        instructions: payload.instructions || null,
        matchingStrategy: SPEED_NETWORKING_MATCHING_STRATEGIES.includes(payload.matchingStrategy)
          ? payload.matchingStrategy
          : 'round_robin',
        tags: payload.tags ?? [],
        settings: payload.settings ?? {},
        assets: payload.assets ?? {},
      },
      { transaction },
    );

    await upsertRooms(session.id, Array.isArray(payload.rooms) ? payload.rooms : [], transaction);
    await syncParticipants(session.id, Array.isArray(payload.participants) ? payload.participants : [], actorId, transaction);

    const hydrated = await SpeedNetworkingSession.findByPk(session.id, {
      transaction,
      include: [
        { model: User, as: 'host' },
        { model: User, as: 'adminOwner' },
        { model: ProviderWorkspace, as: 'workspace' },
        { model: SpeedNetworkingRoom, as: 'rooms', include: [{ model: User, as: 'facilitator' }] },
        {
          model: SpeedNetworkingParticipant,
          as: 'participants',
          include: [
            { model: User, as: 'user' },
            { model: SpeedNetworkingRoom, as: 'assignedRoom', include: [{ model: User, as: 'facilitator' }] },
            { model: User, as: 'createdBy' },
            { model: User, as: 'updatedBy' },
          ],
        },
      ],
    });

    logger.info({ sessionId: session.id, actorId }, 'Speed networking session created');
    return serialiseSession(hydrated);
  });
}

export async function updateSpeedNetworkingSession(sessionId, payload = {}, actor = {}) {
  const actorId = actor?.id ?? null;
  return sequelize.transaction(async (transaction) => {
    const session = await SpeedNetworkingSession.findByPk(sessionId, { transaction });
    if (!session) {
      throw new NotFoundError('Speed networking session not found.');
    }

    await session.update(
      {
        title: payload.title ?? session.title,
        description: payload.description ?? session.description,
        status: SPEED_NETWORKING_SESSION_STATUSES.includes(payload.status) ? payload.status : session.status,
        accessLevel: SPEED_NETWORKING_ACCESS_LEVELS.includes(payload.accessLevel)
          ? payload.accessLevel
          : session.accessLevel,
        visibility: SPEED_NETWORKING_VISIBILITIES.includes(payload.visibility)
          ? payload.visibility
          : session.visibility,
        hostId: payload.hostId ?? session.hostId,
        adminOwnerId: payload.adminOwnerId ?? session.adminOwnerId,
        workspaceId: payload.workspaceId ?? session.workspaceId,
        capacity: payload.capacity ?? session.capacity,
        roundDurationSeconds: payload.roundDurationSeconds ?? session.roundDurationSeconds,
        totalRounds: payload.totalRounds ?? session.totalRounds,
        bufferSeconds: payload.bufferSeconds ?? session.bufferSeconds,
        scheduledStart: payload.scheduledStart ? new Date(payload.scheduledStart) : session.scheduledStart,
        scheduledEnd: payload.scheduledEnd ? new Date(payload.scheduledEnd) : session.scheduledEnd,
        timezone: payload.timezone ?? session.timezone,
        registrationCloseAt: payload.registrationCloseAt
          ? new Date(payload.registrationCloseAt)
          : session.registrationCloseAt,
        meetingProvider: payload.meetingProvider ?? session.meetingProvider,
        meetingUrl: payload.meetingUrl ?? session.meetingUrl,
        lobbyUrl: payload.lobbyUrl ?? session.lobbyUrl,
        instructions: payload.instructions ?? session.instructions,
        matchingStrategy: SPEED_NETWORKING_MATCHING_STRATEGIES.includes(payload.matchingStrategy)
          ? payload.matchingStrategy
          : session.matchingStrategy,
        tags: payload.tags ?? session.tags,
        settings: payload.settings ?? session.settings,
        assets: payload.assets ?? session.assets,
      },
      { transaction },
    );

    if (Array.isArray(payload.rooms)) {
      await upsertRooms(session.id, payload.rooms, transaction);
    }
    if (Array.isArray(payload.participants)) {
      await syncParticipants(session.id, payload.participants, actorId, transaction);
    }

    const hydrated = await SpeedNetworkingSession.findByPk(session.id, {
      transaction,
      include: [
        { model: User, as: 'host' },
        { model: User, as: 'adminOwner' },
        { model: ProviderWorkspace, as: 'workspace' },
        { model: SpeedNetworkingRoom, as: 'rooms', include: [{ model: User, as: 'facilitator' }] },
        {
          model: SpeedNetworkingParticipant,
          as: 'participants',
          include: [
            { model: User, as: 'user' },
            { model: SpeedNetworkingRoom, as: 'assignedRoom', include: [{ model: User, as: 'facilitator' }] },
            { model: User, as: 'createdBy' },
            { model: User, as: 'updatedBy' },
          ],
        },
      ],
    });

    logger.info({ sessionId: session.id, actorId }, 'Speed networking session updated');
    return serialiseSession(hydrated);
  });
}

export async function deleteSpeedNetworkingSession(sessionId) {
  const deleted = await SpeedNetworkingSession.destroy({ where: { id: sessionId } });
  if (!deleted) {
    throw new NotFoundError('Speed networking session not found.');
  }
  logger.info({ sessionId }, 'Speed networking session deleted');
  return { success: true };
}

export async function createSpeedNetworkingParticipant(sessionId, payload = {}, actor = {}) {
  const actorId = actor?.id ?? null;
  const session = await SpeedNetworkingSession.findByPk(sessionId);
  if (!session) {
    throw new NotFoundError('Speed networking session not found.');
  }

  const participant = await SpeedNetworkingParticipant.create({
    sessionId,
    userId: payload.userId || null,
    email: payload.email || null,
    fullName: payload.fullName || null,
    role: SPEED_NETWORKING_PARTICIPANT_ROLES.includes(payload.role) ? payload.role : 'attendee',
    status: SPEED_NETWORKING_PARTICIPANT_STATUSES.includes(payload.status) ? payload.status : 'invited',
    assignedRoomId: payload.assignedRoomId || null,
    checkInAt: payload.checkInAt ? new Date(payload.checkInAt) : null,
    lastMatchedAt: payload.lastMatchedAt ? new Date(payload.lastMatchedAt) : null,
    interests: Array.isArray(payload.interests) ? payload.interests : payload.interests ?? null,
    goals: payload.goals || null,
    notes: payload.notes || null,
    metadata: payload.metadata ?? null,
    createdById: actorId || null,
    updatedById: actorId || null,
  });

  const hydrated = await SpeedNetworkingParticipant.findByPk(participant.id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
      { model: SpeedNetworkingRoom, as: 'assignedRoom', include: [{ model: User, as: 'facilitator' }] },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
    ],
  });

  return serialiseParticipant(hydrated);
}

export async function updateSpeedNetworkingParticipant(sessionId, participantId, payload = {}, actor = {}) {
  const participant = await SpeedNetworkingParticipant.findOne({ where: { id: participantId, sessionId } });
  if (!participant) {
    throw new NotFoundError('Speed networking participant not found.');
  }

  await participant.update({
    userId: payload.userId ?? participant.userId,
    email: payload.email ?? participant.email,
    fullName: payload.fullName ?? participant.fullName,
    role: SPEED_NETWORKING_PARTICIPANT_ROLES.includes(payload.role) ? payload.role : participant.role,
    status: SPEED_NETWORKING_PARTICIPANT_STATUSES.includes(payload.status) ? payload.status : participant.status,
    assignedRoomId: payload.assignedRoomId ?? participant.assignedRoomId,
    checkInAt: payload.checkInAt ? new Date(payload.checkInAt) : participant.checkInAt,
    lastMatchedAt: payload.lastMatchedAt ? new Date(payload.lastMatchedAt) : participant.lastMatchedAt,
    interests: payload.interests ?? participant.interests,
    goals: payload.goals ?? participant.goals,
    notes: payload.notes ?? participant.notes,
    metadata: payload.metadata ?? participant.metadata,
    updatedById: actor?.id ?? participant.updatedById,
  });

  const hydrated = await SpeedNetworkingParticipant.findByPk(participant.id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
      { model: SpeedNetworkingRoom, as: 'assignedRoom', include: [{ model: User, as: 'facilitator' }] },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
    ],
  });

  return serialiseParticipant(hydrated);
}

export async function deleteSpeedNetworkingParticipant(sessionId, participantId) {
  const deleted = await SpeedNetworkingParticipant.destroy({ where: { id: participantId, sessionId } });
  if (!deleted) {
    throw new NotFoundError('Speed networking participant not found.');
  }
  return { success: true };
}

export default {
  fetchSpeedNetworkingCatalog,
  listSpeedNetworkingSessions,
  getSpeedNetworkingSession,
  createSpeedNetworkingSession,
  updateSpeedNetworkingSession,
  deleteSpeedNetworkingSession,
  createSpeedNetworkingParticipant,
  updateSpeedNetworkingParticipant,
  deleteSpeedNetworkingParticipant,
};
