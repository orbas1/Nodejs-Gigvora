import {
  sequelize,
  CollaborationSpace,
  CollaborationParticipant,
  CollaborationRoom,
  CollaborationAsset,
  CollaborationAnnotation,
  CollaborationRepository,
  CollaborationAiSession,
  User,
  Profile,
  COLLABORATION_SPACE_STATUSES,
  COLLABORATION_PERMISSION_LEVELS,
  COLLABORATION_PARTICIPANT_ROLES,
  COLLABORATION_PARTICIPANT_STATUSES,
  COLLABORATION_ROOM_TYPES,
  COLLABORATION_ASSET_TYPES,
  COLLABORATION_ASSET_STATUSES,
  COLLABORATION_ANNOTATION_TYPES,
  COLLABORATION_ANNOTATION_STATUSES,
  COLLABORATION_REPOSITORY_STATUSES,
  COLLABORATION_AI_SESSION_TYPES,
  COLLABORATION_AI_SESSION_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

const BASE_SPACE_INCLUDE = [
  {
    model: CollaborationParticipant,
    as: 'participants',
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  },
  { model: CollaborationRoom, as: 'rooms' },
  {
    model: CollaborationAsset,
    as: 'assets',
    include: [
      {
        model: CollaborationAnnotation,
        as: 'annotations',
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
    ],
  },
  { model: CollaborationRepository, as: 'repositories' },
  { model: CollaborationAiSession, as: 'aiSessions' },
  { model: Profile, as: 'profile' },
  { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
];

function parseId(value, fieldName) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function normalizeString(value, fieldName, { required = false, maxLength = 255 } = {}) {
  if (value == null) {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return null;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return null;
  }
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters.`);
  }
  return trimmed;
}

function normalizeEnum(value, allowed, fieldName, { required = false, defaultValue } = {}) {
  const fallback = defaultValue ?? (required ? allowed[0] : null);
  const candidate = value == null ? fallback : String(value);
  if (candidate == null) {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return null;
  }
  if (!allowed.includes(candidate)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowed.join(', ')}.`);
  }
  return candidate;
}

function normalizeMetadata(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  throw new ValidationError('metadata must be an object when provided.');
}

function serializeParticipant(participant) {
  const plain = participant?.toJSON?.() ?? participant;
  if (!plain) {
    return null;
  }
  const fullName = plain.user
    ? `${plain.user.firstName ?? ''} ${plain.user.lastName ?? ''}`.trim() || plain.user.email
    : null;
  return {
    id: plain.id,
    spaceId: plain.spaceId,
    userId: plain.userId,
    role: plain.role,
    permissionLevel: plain.permissionLevel,
    status: plain.status,
    invitedAt: plain.invitedAt,
    joinedAt: plain.joinedAt,
    metadata: plain.metadata ?? null,
    user: plain.user
      ? {
          id: plain.user.id,
          firstName: plain.user.firstName,
          lastName: plain.user.lastName,
          email: plain.user.email,
          displayName: fullName,
        }
      : null,
  };
}

function serializeAnnotation(annotation) {
  const plain = annotation?.toJSON?.() ?? annotation;
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    assetId: plain.assetId,
    authorId: plain.authorId,
    annotationType: plain.annotationType,
    status: plain.status,
    body: plain.body,
    context: plain.context ?? null,
    occurredAt: plain.occurredAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    author: plain.author
      ? {
          id: plain.author.id,
          firstName: plain.author.firstName,
          lastName: plain.author.lastName,
          email: plain.author.email,
        }
      : null,
  };
}

function serializeAsset(asset) {
  const plain = asset?.toJSON?.() ?? asset;
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    spaceId: plain.spaceId,
    uploadedById: plain.uploadedById,
    assetType: plain.assetType,
    status: plain.status,
    title: plain.title,
    sourceUrl: plain.sourceUrl,
    version: plain.version,
    checksum: plain.checksum,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    annotations: Array.isArray(plain.annotations)
      ? plain.annotations.map(serializeAnnotation)
      : [],
  };
}

function serializeRoom(room) {
  const plain = room?.toJSON?.() ?? room;
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    spaceId: plain.spaceId,
    roomType: plain.roomType,
    title: plain.title,
    provider: plain.provider,
    joinUrl: plain.joinUrl,
    recordingUrl: plain.recordingUrl,
    lastStartedAt: plain.lastStartedAt,
    settings: plain.settings ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function serializeRepository(repository) {
  const plain = repository?.toJSON?.() ?? repository;
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    spaceId: plain.spaceId,
    provider: plain.provider,
    repositoryName: plain.repositoryName,
    branch: plain.branch,
    integrationStatus: plain.integrationStatus,
    settings: plain.settings ?? null,
    syncMetadata: plain.syncMetadata ?? null,
    lastSyncedAt: plain.lastSyncedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function serializeAiSession(session) {
  const plain = session?.toJSON?.() ?? session;
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    spaceId: plain.spaceId,
    createdById: plain.createdById,
    sessionType: plain.sessionType,
    status: plain.status,
    prompt: plain.prompt,
    response: plain.response,
    metrics: plain.metrics ?? null,
    ranAt: plain.ranAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function serializeSpace(space) {
  const plain = space?.toJSON?.() ?? space;
  if (!plain) {
    return null;
  }
  const participants = Array.isArray(plain.participants)
    ? plain.participants.map(serializeParticipant)
    : [];
  const rooms = Array.isArray(plain.rooms) ? plain.rooms.map(serializeRoom) : [];
  const assets = Array.isArray(plain.assets) ? plain.assets.map(serializeAsset) : [];
  const repositories = Array.isArray(plain.repositories)
    ? plain.repositories.map(serializeRepository)
    : [];
  const aiSessions = Array.isArray(plain.aiSessions)
    ? plain.aiSessions.map(serializeAiSession)
    : [];
  const openAnnotations = assets.reduce(
    (count, asset) =>
      count + asset.annotations.filter((annotation) => annotation.status === 'open').length,
    0,
  );
  return {
    id: plain.id,
    ownerId: plain.ownerId,
    profileId: plain.profileId,
    name: plain.name,
    clientName: plain.clientName,
    summary: plain.summary,
    status: plain.status,
    defaultPermission: plain.defaultPermission,
    meetingCadence: plain.meetingCadence,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    owner: plain.owner
      ? {
          id: plain.owner.id,
          firstName: plain.owner.firstName,
          lastName: plain.owner.lastName,
          email: plain.owner.email,
        }
      : null,
    profile: plain.profile
      ? {
          id: plain.profile.id,
          headline: plain.profile.headline,
          bio: plain.profile.bio,
        }
      : null,
    participants,
    rooms,
    assets,
    repositories,
    aiSessions,
    metrics: {
      totalParticipants: participants.length,
      totalRooms: rooms.length,
      totalAssets: assets.length,
      totalRepositories: repositories.length,
      openAnnotations,
    },
  };
}

async function getSpaceOrThrow(spaceId, options = {}) {
  const parsedId = parseId(spaceId, 'spaceId');
  const space = await CollaborationSpace.findByPk(parsedId, {
    include: BASE_SPACE_INCLUDE,
    ...options,
  });
  if (!space) {
    throw new NotFoundError('Collaboration space not found.');
  }
  return space;
}

export async function listSpaces({ ownerId, participantId, includeArchived = false } = {}) {
  const where = {};
  if (ownerId != null) {
    where.ownerId = parseId(ownerId, 'ownerId');
  }
  if (!includeArchived) {
    where.status = 'active';
  }

  const include = BASE_SPACE_INCLUDE.map((entry) => {
    if (entry.as !== 'participants') {
      return { ...entry };
    }
    if (participantId == null) {
      return { ...entry };
    }
    return {
      ...entry,
      where: { userId: parseId(participantId, 'participantId') },
      required: true,
    };
  });

  const spaces = await CollaborationSpace.findAll({
    where,
    include,
    distinct: true,
    order: [
      ['updatedAt', 'DESC'],
      [{ model: CollaborationRoom, as: 'rooms' }, 'updatedAt', 'DESC'],
    ],
    limit: 50,
  });

  return { spaces: spaces.map(serializeSpace) };
}

export async function createSpace(payload = {}, { actorId } = {}) {
  const ownerId = parseId(payload.ownerId ?? actorId, 'ownerId');
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a collaboration space.');
  }
  const profileId = parseId(payload.profileId, 'profileId');
  const name = normalizeString(payload.name, 'name', { required: true, maxLength: 180 });
  const clientName = normalizeString(payload.clientName, 'clientName', { maxLength: 180 });
  const summary = payload.summary == null ? null : String(payload.summary).trim();
  const meetingCadence = normalizeString(payload.meetingCadence, 'meetingCadence', {
    required: false,
    maxLength: 120,
  });
  const status = normalizeEnum(payload.status, COLLABORATION_SPACE_STATUSES, 'status', {
    defaultValue: 'active',
  });
  const defaultPermission = normalizeEnum(
    payload.defaultPermission,
    COLLABORATION_PERMISSION_LEVELS,
    'defaultPermission',
    { defaultValue: 'comment' },
  );
  const metadata = normalizeMetadata(payload.metadata ?? null);

  const transaction = await sequelize.transaction();
  try {
    const space = await CollaborationSpace.create(
      {
        ownerId,
        profileId,
        name,
        clientName,
        summary,
        meetingCadence,
        status,
        defaultPermission,
        metadata,
      },
      { transaction },
    );

    await CollaborationParticipant.create(
      {
        spaceId: space.id,
        userId: ownerId,
        role: 'owner',
        permissionLevel: 'manage',
        status: 'active',
        invitedAt: new Date(),
        joinedAt: new Date(),
      },
      { transaction },
    );

    await transaction.commit();
    const reloaded = await getSpaceOrThrow(space.id);
    return { space: serializeSpace(reloaded) };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function createVideoRoom(spaceId, payload = {}) {
  const space = await getSpaceOrThrow(spaceId);
  const roomType = normalizeEnum(payload.roomType, COLLABORATION_ROOM_TYPES, 'roomType', {
    defaultValue: 'video',
  });
  const title = normalizeString(payload.title, 'title', { required: true, maxLength: 180 });
  const provider = normalizeString(payload.provider, 'provider', { required: true, maxLength: 120 });
  const joinUrl = normalizeString(payload.joinUrl, 'joinUrl', { required: true, maxLength: 2000 });
  const recordingUrl = normalizeString(payload.recordingUrl, 'recordingUrl', { maxLength: 2000 });
  const settings = normalizeMetadata(payload.settings ?? null);

  const room = await CollaborationRoom.create({
    spaceId: space.id,
    roomType,
    title,
    provider,
    joinUrl,
    recordingUrl,
    settings,
    lastStartedAt: payload.lastStartedAt ? new Date(payload.lastStartedAt) : null,
  });

  return { room: serializeRoom(room), space: serializeSpace(await getSpaceOrThrow(space.id)) };
}

export async function getSpace(spaceId) {
  const space = await getSpaceOrThrow(spaceId);
  return { space: serializeSpace(space) };
}

export async function addAsset(spaceId, payload = {}) {
  const space = await getSpaceOrThrow(spaceId);
  const assetType = normalizeEnum(payload.assetType, COLLABORATION_ASSET_TYPES, 'assetType', {
    defaultValue: 'file',
  });
  const status = normalizeEnum(payload.status, COLLABORATION_ASSET_STATUSES, 'status', {
    defaultValue: 'in_review',
  });
  const title = normalizeString(payload.title, 'title', { required: true, maxLength: 200 });
  const sourceUrl = normalizeString(payload.sourceUrl, 'sourceUrl', { required: true, maxLength: 2000 });
  const version = normalizeString(payload.version, 'version', { maxLength: 60 });
  const checksum = normalizeString(payload.checksum, 'checksum', { maxLength: 120 });
  const uploadedById = parseId(payload.uploadedById, 'uploadedById');
  const metadata = normalizeMetadata(payload.metadata ?? null);

  const asset = await CollaborationAsset.create({
    spaceId: space.id,
    uploadedById,
    assetType,
    status,
    title,
    sourceUrl,
    version,
    checksum,
    metadata,
  });

  return { asset: serializeAsset(await asset.reload({ include: [{ model: CollaborationAnnotation, as: 'annotations' }] })), space: serializeSpace(await getSpaceOrThrow(space.id)) };
}

export async function addAnnotation(assetId, payload = {}) {
  const parsedAssetId = parseId(assetId, 'assetId');
  const asset = await CollaborationAsset.findByPk(parsedAssetId, {
    include: [{ model: CollaborationAnnotation, as: 'annotations' }],
  });
  if (!asset) {
    throw new NotFoundError('Asset not found for annotation.');
  }
  const authorId = parseId(payload.authorId, 'authorId');
  if (!authorId) {
    throw new ValidationError('authorId is required.');
  }
  const annotationType = normalizeEnum(
    payload.annotationType,
    COLLABORATION_ANNOTATION_TYPES,
    'annotationType',
    { defaultValue: 'comment' },
  );
  const status = normalizeEnum(payload.status, COLLABORATION_ANNOTATION_STATUSES, 'status', {
    defaultValue: 'open',
  });
  const body = normalizeString(payload.body, 'body', { required: true, maxLength: 5000 });
  const context = normalizeMetadata(payload.context ?? null);

  const annotation = await CollaborationAnnotation.create({
    assetId: asset.id,
    authorId,
    annotationType,
    status,
    body,
    context,
    occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
  });

  return {
    annotation: serializeAnnotation(await annotation.reload({ include: [{ model: User, as: 'author' }] })),
    asset: serializeAsset(await asset.reload({ include: [{ model: CollaborationAnnotation, as: 'annotations', include: [{ model: User, as: 'author' }] }] })),
  };
}

export async function connectRepository(spaceId, payload = {}) {
  const space = await getSpaceOrThrow(spaceId);
  const provider = normalizeString(payload.provider, 'provider', { required: true, maxLength: 120 }).toLowerCase();
  const repositoryName = normalizeString(payload.repositoryName, 'repositoryName', {
    required: true,
    maxLength: 200,
  });
  const branch = normalizeString(payload.branch, 'branch', { maxLength: 120 }) ?? 'main';
  const integrationStatus = normalizeEnum(
    payload.integrationStatus,
    COLLABORATION_REPOSITORY_STATUSES,
    'integrationStatus',
    { defaultValue: 'connected' },
  );
  const settings = normalizeMetadata(payload.settings ?? null);
  const syncMetadata = normalizeMetadata(payload.syncMetadata ?? null);

  const existing = await CollaborationRepository.findOne({
    where: { spaceId: space.id, provider, repositoryName },
  });
  if (existing) {
    throw new ConflictError('Repository already connected to this collaboration space.');
  }

  const repository = await CollaborationRepository.create({
    spaceId: space.id,
    provider,
    repositoryName,
    branch,
    integrationStatus,
    settings,
    syncMetadata,
    lastSyncedAt: payload.lastSyncedAt ? new Date(payload.lastSyncedAt) : new Date(),
  });

  return { repository: serializeRepository(repository), space: serializeSpace(await getSpaceOrThrow(space.id)) };
}

function buildAiResponse(space, sessionType, prompt) {
  const lines = [];
  const displayName = space.name || 'Collaboration Space';
  const client = space.clientName ? `Client: ${space.clientName}` : null;
  const cadence = space.meetingCadence ? `Cadence: ${space.meetingCadence}` : null;
  lines.push(`# ${displayName}`);
  if (client) lines.push(client);
  if (cadence) lines.push(cadence);
  lines.push('');

  const assets = space.assets || [];
  const repositories = space.repositories || [];
  const rooms = space.rooms || [];

  if (sessionType === 'documentation') {
    lines.push('## Delivery summary');
    lines.push(space.summary || 'No summary provided.');
    if (assets.length) {
      lines.push('');
      lines.push('### Active deliverables');
      assets.slice(0, 10).forEach((asset) => {
        const annotations = asset.annotations || [];
        const openNotes = annotations.filter((annotation) => annotation.status === 'open');
        lines.push(`- ${asset.title} (${asset.assetType}) — ${openNotes.length} open notes`);
      });
    }
  } else if (sessionType === 'qa') {
    lines.push('## QA regression checklist');
    repositories.slice(0, 5).forEach((repository) => {
      lines.push(`- Review branch **${repository.branch}** on ${repository.provider}`);
    });
    rooms.forEach((room) => {
      lines.push(`- Confirm recording availability for ${room.title}`);
    });
    if (!repositories.length && !rooms.length) {
      lines.push('- No connected systems yet. Add repositories or rooms to generate targeted QA steps.');
    }
  } else {
    lines.push('## Collaboration highlights');
    if (assets.length) {
      const topAsset = assets[0];
      lines.push(`- Latest asset: ${topAsset.title} (${topAsset.assetType})`);
    }
    if (rooms.length) {
      lines.push(`- Next session ready in ${rooms[0].provider}: ${rooms[0].title}`);
    }
    if (repositories.length) {
      lines.push(`- Code synced from ${repositories[0].provider}: ${repositories[0].repositoryName}`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('Prompt used:');
  lines.push('');
  lines.push(`> ${prompt.trim()}`);

  return lines.join('\n');
}

export async function createAiSession(spaceId, payload = {}, { actorId } = {}) {
  const space = await getSpaceOrThrow(spaceId, { raw: false, include: BASE_SPACE_INCLUDE });
  const sessionType = normalizeEnum(payload.sessionType, COLLABORATION_AI_SESSION_TYPES, 'sessionType', {
    defaultValue: 'summary',
  });
  const prompt = normalizeString(payload.prompt, 'prompt', { required: true, maxLength: 4000 });
  const createdById = parseId(payload.createdById ?? actorId, 'createdById');

  const aiSession = await CollaborationAiSession.create({
    spaceId: space.id,
    createdById,
    sessionType,
    status: 'processing',
    prompt,
  });

  const generatedResponse = buildAiResponse(serializeSpace(space), sessionType, prompt);
  const responseLength = generatedResponse.length + prompt.length;

  await aiSession.update({
    status: 'completed',
    response: generatedResponse,
    metrics: {
      estimatedTokens: Math.ceil(responseLength / 4),
      sectionsGenerated: (generatedResponse.match(/^#/gm) || []).length,
    },
    ranAt: new Date(),
  });

  return { session: serializeAiSession(await aiSession.reload()), space: serializeSpace(await getSpaceOrThrow(space.id)) };
}

export default {
  listSpaces,
  getSpace,
  createSpace,
  createVideoRoom,
  addAsset,
  addAnnotation,
  connectRepository,
  createAiSession,
};
