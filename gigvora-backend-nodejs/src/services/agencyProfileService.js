import { Op } from 'sequelize';
import { AgencyProfile, Connection, Profile, ProfileFollower, User, sequelize } from '../models/index.js';
import profileService from './profileService.js';
import connectionService from './connectionService.js';
import { queueProfileEngagementRecalculation } from './profileEngagementService.js';
import { normalizeLocationPayload } from '../utils/location.js';
import r2Client from '../utils/r2Client.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

function normalizeInteger(value, label) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function sanitizeStringArrayInput(values, { maxItems = 30, maxLength = 160 } = {}) {
  if (!Array.isArray(values)) {
    return undefined;
  }
  const unique = [];
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > maxLength) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(trimmed);
    if (unique.length >= maxItems) {
      break;
    }
  }
  return unique;
}

function sanitizeSocialLinks(values, { maxItems = 10 } = {}) {
  if (!Array.isArray(values)) {
    return undefined;
  }
  const results = [];
  const seen = new Set();
  for (const entry of values) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const rawUrl = typeof entry.url === 'string' ? entry.url.trim() : '';
    if (!rawUrl) {
      continue;
    }
    let normalizedUrl;
    try {
      const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      normalizedUrl = url.toString();
    } catch (error) {
      continue;
    }
    const key = normalizedUrl.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const label = typeof entry.label === 'string' ? entry.label.trim() : '';
    results.push({ label: label || null, url: normalizedUrl });
    if (results.length >= maxItems) {
      break;
    }
  }
  return results;
}

function sanitizeHexColour(value) {
  if (!value) {
    return null;
  }
  const text = `${value}`.trim();
  if (!text) {
    return null;
  }
  const normalised = text.startsWith('#') ? text : `#${text}`;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalised)) {
    throw new ValidationError('brandColor must be a valid hex colour.');
  }
  return normalised.toUpperCase();
}

function sanitizeUrl(value) {
  if (value == null) {
    return undefined;
  }
  const text = `${value}`.trim();
  if (!text) {
    return null;
  }
  try {
    const url = new URL(text.startsWith('http') ? text : `https://${text}`);
    return url.toString();
  } catch (error) {
    throw new ValidationError('URL must be valid.');
  }
}

function parseImageData(imageData) {
  if (!imageData) {
    return null;
  }
  const trimmed = imageData.trim();
  if (!trimmed) {
    return null;
  }
  let contentType = 'image/png';
  let base64Payload = trimmed;
  const match = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/i.exec(trimmed);
  if (match?.groups?.data) {
    base64Payload = match.groups.data;
    if (match.groups.mime) {
      contentType = match.groups.mime;
    }
  }
  let buffer;
  try {
    buffer = Buffer.from(base64Payload, 'base64');
  } catch (error) {
    throw new ValidationError('Image data is not valid base64.');
  }
  if (!buffer || !buffer.length) {
    throw new ValidationError('Image data is empty.');
  }
  const maxBytes = 5 * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw new ValidationError('Avatar images must be 5MB or smaller.');
  }
  return { buffer, contentType };
}

async function getContext(userId, { transaction } = {}) {
  const normalizedId = normalizeInteger(userId, 'userId');
  if (!normalizedId) {
    throw new ValidationError('userId is required.');
  }
  const user = await User.findByPk(normalizedId, {
    transaction,
    include: [
      { model: Profile },
      { model: AgencyProfile },
    ],
  });
  if (!user) {
    throw new NotFoundError('Agency user not found.');
  }
  const role = `${user.userType ?? ''}`.toLowerCase();
  if (!['agency', 'agency_admin', 'admin'].includes(role)) {
    throw new ValidationError('User is not registered as an agency.');
  }
  if (!user.Profile) {
    throw new NotFoundError('Profile record not found for agency user.');
  }
  return { user, profile: user.Profile, agencyProfile: user.AgencyProfile ?? null };
}

function buildUserSummary(user) {
  if (!user) {
    return null;
  }
  const plain = user.get ? user.get({ plain: true }) : user;
  const profile = plain.Profile ?? {};
  const agency = plain.AgencyProfile ?? {};
  const name = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim() || plain.email || `User ${plain.id}`;
  return {
    id: plain.id,
    name,
    email: plain.email ?? null,
    userType: plain.userType ?? null,
    headline: profile.headline ?? null,
    location: profile.location ?? null,
    avatarSeed: profile.avatarSeed ?? agency.agencyName ?? name,
    avatarUrl: agency.avatarUrl ?? null,
  };
}

async function fetchUserSummaries(ids, { transaction } = {}) {
  if (!ids?.length) {
    return new Map();
  }
  const uniqueIds = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0);
  if (!uniqueIds.length) {
    return new Map();
  }
  const users = await User.findAll({
    where: { id: { [Op.in]: uniqueIds } },
    include: [
      { model: Profile, attributes: ['headline', 'location', 'avatarSeed'] },
      { model: AgencyProfile, attributes: ['agencyName', 'avatarUrl'] },
    ],
    transaction,
  });
  return new Map(users.map((user) => [user.id, buildUserSummary(user)]));
}

function formatFollower(record, followerUser) {
  const plain = record.get ? record.get({ plain: true }) : record;
  const summary = followerUser ? buildUserSummary(followerUser) : null;
  return {
    id: plain.id,
    followerId: plain.followerId,
    profileId: plain.profileId,
    status: plain.status,
    notificationsEnabled: Boolean(plain.notificationsEnabled),
    followedAt: plain.followedAt ? new Date(plain.followedAt).toISOString() : null,
    metadata: plain.metadata ?? null,
    user: summary,
  };
}

function formatConnection(record, counterpartSummary, userId) {
  const plain = record.get ? record.get({ plain: true }) : record;
  return {
    id: plain.id,
    status: plain.status,
    requestedByCurrentUser: plain.requesterId === userId,
    counterpart: counterpartSummary,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

export async function listAgencyFollowers(userId, { limit = 25, offset = 0 } = {}) {
  const { profile } = await getContext(userId);
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const { rows, count } = await ProfileFollower.findAndCountAll({
    where: { profileId: profile.id },
    include: [
      {
        model: User,
        as: 'follower',
        include: [
          { model: Profile, attributes: ['headline', 'location', 'avatarSeed'] },
          { model: AgencyProfile, attributes: ['agencyName', 'avatarUrl'] },
        ],
      },
    ],
    order: [['followedAt', 'DESC']],
    limit: safeLimit,
    offset: safeOffset,
  });

  const items = rows.map((row) => formatFollower(row, row.follower));
  return {
    items,
    pagination: {
      total: count,
      limit: safeLimit,
      offset: safeOffset,
    },
  };
}

export async function getAgencyProfileOverview(userId, {
  includeFollowers = true,
  includeConnections = true,
  followersLimit = 25,
  followersOffset = 0,
  bypassCache = true,
  viewerId = null,
} = {}) {
  const overview = await profileService.getProfileOverview(userId, { bypassCache });
  const { agencyProfile } = await getContext(userId);

  let followers = null;
  if (includeFollowers) {
    followers = await listAgencyFollowers(userId, {
      limit: followersLimit,
      offset: followersOffset,
    });
  }

  let connections = null;
  if (includeConnections) {
    connections = await listAgencyConnections(userId, { viewerId });
  }

  const preferences = agencyProfile
    ? {
        followerPolicy: agencyProfile.followerPolicy ?? 'open',
        connectionPolicy: agencyProfile.connectionPolicy ?? 'open',
        autoAcceptFollowers: agencyProfile.autoAcceptFollowers ?? true,
        defaultConnectionMessage: agencyProfile.defaultConnectionMessage ?? null,
        brandColor: agencyProfile.brandColor ?? null,
        bannerUrl: agencyProfile.bannerUrl ?? null,
        avatarUrl: agencyProfile.avatarUrl ?? null,
      }
    : {
        followerPolicy: 'open',
        connectionPolicy: 'open',
        autoAcceptFollowers: true,
        defaultConnectionMessage: null,
        brandColor: null,
        bannerUrl: null,
        avatarUrl: null,
      };

  return {
    overview,
    followers,
    connections,
    preferences,
    lastUpdated: new Date().toISOString(),
  };
}

export async function updateAgencyProfile(userId, payload = {}, { actorId = null } = {}) {
  const context = await getContext(userId);
  if (actorId && Number(actorId) !== Number(userId)) {
    const actorContext = await getContext(actorId);
    const actorRole = `${actorContext.user.userType ?? ''}`.toLowerCase();
    if (actorRole !== 'admin') {
      throw new AuthorizationError('You are not permitted to update this agency profile.');
    }
  }

  const profileUpdates = {};
  const agencyUpdates = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'headline')) {
    profileUpdates.headline = payload.headline == null ? null : `${payload.headline}`.trim().slice(0, 255);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'bio')) {
    profileUpdates.bio = payload.bio == null ? null : `${payload.bio}`.trim().slice(0, 5000);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'missionStatement')) {
    profileUpdates.missionStatement =
      payload.missionStatement == null ? null : `${payload.missionStatement}`.trim().slice(0, 2000);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'timezone')) {
    profileUpdates.timezone = payload.timezone == null ? null : `${payload.timezone}`.trim().slice(0, 120);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'location') ||
      Object.prototype.hasOwnProperty.call(payload, 'geoLocation')) {
    const normalized = normalizeLocationPayload({
      location: payload.location ?? context.profile.location ?? null,
      geoLocation: payload.geoLocation ?? context.profile.geoLocation ?? null,
    });
    profileUpdates.location = normalized.location ?? null;
    profileUpdates.geoLocation = normalized.geoLocation ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'agencyName') && payload.agencyName != null) {
    agencyUpdates.agencyName = `${payload.agencyName}`.trim().slice(0, 255);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'focusArea')) {
    agencyUpdates.focusArea = payload.focusArea == null ? null : `${payload.focusArea}`.trim().slice(0, 255);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'tagline')) {
    agencyUpdates.tagline = payload.tagline == null ? null : `${payload.tagline}`.trim().slice(0, 160);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'summary')) {
    agencyUpdates.summary = payload.summary == null ? null : `${payload.summary}`.trim();
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'about')) {
    agencyUpdates.about = payload.about == null ? null : `${payload.about}`.trim();
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'website')) {
    agencyUpdates.website = sanitizeUrl(payload.website);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'services')) {
    agencyUpdates.services = sanitizeStringArrayInput(payload.services, { maxItems: 25, maxLength: 160 }) ?? [];
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'industries')) {
    agencyUpdates.industries = sanitizeStringArrayInput(payload.industries, { maxItems: 25, maxLength: 160 }) ?? [];
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'clients')) {
    agencyUpdates.clients = sanitizeStringArrayInput(payload.clients, { maxItems: 40, maxLength: 160 }) ?? [];
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'awards')) {
    agencyUpdates.awards = sanitizeStringArrayInput(payload.awards, { maxItems: 40, maxLength: 200 }) ?? [];
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'socialLinks')) {
    agencyUpdates.socialLinks = sanitizeSocialLinks(payload.socialLinks, { maxItems: 15 }) ?? [];
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'teamSize')) {
    agencyUpdates.teamSize = payload.teamSize == null ? null : normalizeInteger(payload.teamSize, 'teamSize');
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'foundedYear')) {
    if (payload.foundedYear == null || payload.foundedYear === '') {
      agencyUpdates.foundedYear = null;
    } else {
      const year = normalizeInteger(payload.foundedYear, 'foundedYear');
      if (year < 1900 || year > 2100) {
        throw new ValidationError('foundedYear must be between 1900 and 2100.');
      }
      agencyUpdates.foundedYear = year;
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'primaryContactName')) {
    agencyUpdates.primaryContactName =
      payload.primaryContactName == null ? null : `${payload.primaryContactName}`.trim().slice(0, 160);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'primaryContactEmail')) {
    if (!payload.primaryContactEmail) {
      agencyUpdates.primaryContactEmail = null;
    } else {
      const email = `${payload.primaryContactEmail}`.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) {
        throw new ValidationError('primaryContactEmail must be a valid email address.');
      }
      agencyUpdates.primaryContactEmail = email.toLowerCase();
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'primaryContactPhone')) {
    agencyUpdates.primaryContactPhone =
      payload.primaryContactPhone == null ? null : `${payload.primaryContactPhone}`.trim().slice(0, 60);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'brandColor')) {
    agencyUpdates.brandColor = payload.brandColor == null ? null : sanitizeHexColour(payload.brandColor);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'bannerUrl')) {
    agencyUpdates.bannerUrl = sanitizeUrl(payload.bannerUrl);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'autoAcceptFollowers')) {
    agencyUpdates.autoAcceptFollowers = Boolean(payload.autoAcceptFollowers);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'defaultConnectionMessage')) {
    agencyUpdates.defaultConnectionMessage =
      payload.defaultConnectionMessage == null ? null : `${payload.defaultConnectionMessage}`.trim();
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'followerPolicy')) {
    const allowed = new Set(['open', 'approval_required', 'closed']);
    const value = `${payload.followerPolicy}`.trim().toLowerCase();
    if (!allowed.has(value)) {
      throw new ValidationError('followerPolicy is not supported.');
    }
    agencyUpdates.followerPolicy = value;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'connectionPolicy')) {
    const allowed = new Set(['open', 'invite_only', 'manual_review']);
    const value = `${payload.connectionPolicy}`.trim().toLowerCase();
    if (!allowed.has(value)) {
      throw new ValidationError('connectionPolicy is not supported.');
    }
    agencyUpdates.connectionPolicy = value;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'location') ||
      Object.prototype.hasOwnProperty.call(payload, 'geoLocation')) {
    const normalized = normalizeLocationPayload({
      location: payload.location ?? context.agencyProfile?.location ?? null,
      geoLocation: payload.geoLocation ?? context.agencyProfile?.geoLocation ?? null,
    });
    agencyUpdates.location = normalized.location ?? null;
    agencyUpdates.geoLocation = normalized.geoLocation ?? null;
  }

  await sequelize.transaction(async (transaction) => {
    if (Object.keys(profileUpdates).length) {
      await context.profile.update(profileUpdates, { transaction });
    }
    let agencyRecord = context.agencyProfile;
    if (!agencyRecord) {
      const fallbackName =
        agencyUpdates.agencyName ||
        [context.user.firstName, context.user.lastName].filter(Boolean).join(' ').trim() ||
        `Agency ${context.user.id}`;
      agencyRecord = await AgencyProfile.create(
        {
          userId,
          agencyName: fallbackName,
          ...agencyUpdates,
        },
        { transaction },
      );
      context.agencyProfile = agencyRecord;
    } else if (Object.keys(agencyUpdates).length) {
      await agencyRecord.update(agencyUpdates, { transaction });
    }
  });

  return getAgencyProfileOverview(userId, {
    includeFollowers: true,
    includeConnections: true,
    followersLimit: Number(payload.followersLimit) || 25,
    followersOffset: Number(payload.followersOffset) || 0,
  });
}

export async function updateAgencyAvatar(userId, payload = {}, { actorId = null } = {}) {
  if (actorId && Number(actorId) !== Number(userId)) {
    const actorContext = await getContext(actorId);
    const actorRole = `${actorContext.user.userType ?? ''}`.toLowerCase();
    if (actorRole !== 'admin') {
      throw new AuthorizationError('You are not permitted to modify this avatar.');
    }
  }

  const context = await getContext(userId);
  const agencyUpdates = {};
  const profileUpdates = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'brandColor')) {
    agencyUpdates.brandColor = payload.brandColor == null ? null : sanitizeHexColour(payload.brandColor);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'bannerUrl')) {
    agencyUpdates.bannerUrl = sanitizeUrl(payload.bannerUrl);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'avatarUrl')) {
    agencyUpdates.avatarUrl = sanitizeUrl(payload.avatarUrl);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'avatarSeed')) {
    profileUpdates.avatarSeed = payload.avatarSeed == null ? null : `${payload.avatarSeed}`.trim().slice(0, 255);
  }

  if (payload.imageData) {
    const parsed = parseImageData(payload.imageData);
    const result = await r2Client.uploadEvidence({
      prefix: 'agency-avatars',
      fileName: `agency-${userId}.png`,
      contentType: parsed.contentType,
      body: parsed.buffer,
      metadata: { owner: `agency:${userId}` },
    });
    if (!result?.stored && !payload.avatarUrl) {
      throw new ValidationError('File storage is not configured; provide avatarUrl instead of imageData.');
    }
    if (result?.stored) {
      agencyUpdates.avatarStorageKey = result.key;
      if (result.url) {
        agencyUpdates.avatarUrl = result.url;
      }
    }
  }

  await sequelize.transaction(async (transaction) => {
    let agencyRecord = context.agencyProfile;
    if (!agencyRecord) {
      const fallbackName = [context.user.firstName, context.user.lastName].filter(Boolean).join(' ').trim();
      agencyRecord = await AgencyProfile.create(
        {
          userId,
          agencyName: fallbackName || `Agency ${context.user.id}`,
          ...agencyUpdates,
        },
        { transaction },
      );
      context.agencyProfile = agencyRecord;
    } else if (Object.keys(agencyUpdates).length) {
      await agencyRecord.update(agencyUpdates, { transaction });
    }

    if (Object.keys(profileUpdates).length) {
      await context.profile.update(profileUpdates, { transaction });
    }
  });

  return getAgencyProfileOverview(userId, {
    includeFollowers: false,
    includeConnections: false,
  });
}

export async function updateAgencyFollower(userId, followerId, updates = {}) {
  const { profile } = await getContext(userId);
  const followerIdentifier = normalizeInteger(followerId, 'followerId');

  let updated;
  await sequelize.transaction(async (transaction) => {
    const record = await ProfileFollower.findOne({
      where: { profileId: profile.id, followerId: followerIdentifier },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record) {
      throw new NotFoundError('Follower not found.');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
      const allowed = new Set(['active', 'muted', 'blocked']);
      const status = `${updates.status}`.trim().toLowerCase();
      if (!allowed.has(status)) {
        throw new ValidationError('Follower status is invalid.');
      }
      record.status = status;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'notificationsEnabled')) {
      record.notificationsEnabled = Boolean(updates.notificationsEnabled);
    }
    await record.save({ transaction });
    updated = record;
    await queueProfileEngagementRecalculation(profile.id, {
      transaction,
      reason: 'profile_follower_updated',
      priority: 4,
    });
  });

  const followerUser = await User.findByPk(followerIdentifier, {
    include: [
      { model: Profile, attributes: ['headline', 'location', 'avatarSeed'] },
      { model: AgencyProfile, attributes: ['agencyName', 'avatarUrl'] },
    ],
  });
  return formatFollower(updated, followerUser);
}

export async function removeAgencyFollower(userId, followerId) {
  const { profile } = await getContext(userId);
  const followerIdentifier = normalizeInteger(followerId, 'followerId');

  await sequelize.transaction(async (transaction) => {
    const record = await ProfileFollower.findOne({
      where: { profileId: profile.id, followerId: followerIdentifier },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record) {
      throw new NotFoundError('Follower not found.');
    }
    await record.destroy({ transaction });
    await queueProfileEngagementRecalculation(profile.id, {
      transaction,
      reason: 'profile_follower_removed',
      priority: 4,
    });
  });
}

export async function listAgencyConnections(userId, options = {}) {
  const normalizedUserId = normalizeInteger(userId, 'userId');
  const acceptedRecords = await Connection.findAll({
    where: {
      status: 'accepted',
      [Op.or]: [
        { requesterId: normalizedUserId },
        { addresseeId: normalizedUserId },
      ],
    },
    order: [['updatedAt', 'DESC']],
  });

  const pendingRecords = await Connection.findAll({
    where: {
      status: 'pending',
      [Op.or]: [
        { requesterId: normalizedUserId },
        { addresseeId: normalizedUserId },
      ],
    },
    order: [['createdAt', 'DESC']],
  });

  const counterpartIds = new Set();
  for (const record of acceptedRecords) {
    const counterpartId = record.requesterId === normalizedUserId ? record.addresseeId : record.requesterId;
    counterpartIds.add(counterpartId);
  }
  for (const record of pendingRecords) {
    counterpartIds.add(record.requesterId);
    counterpartIds.add(record.addresseeId);
  }
  counterpartIds.delete(normalizedUserId);

  const userSummaries = await fetchUserSummaries([...counterpartIds]);

  const accepted = acceptedRecords.map((record) => {
    const counterpartId = record.requesterId === normalizedUserId ? record.addresseeId : record.requesterId;
    const summary = userSummaries.get(counterpartId) ?? { id: counterpartId, name: `User ${counterpartId}` };
    return formatConnection(record, summary, normalizedUserId);
  });

  const pendingIncoming = pendingRecords
    .filter((record) => record.addresseeId === normalizedUserId)
    .map((record) => {
      const requester = userSummaries.get(record.requesterId) ?? {
        id: record.requesterId,
        name: `User ${record.requesterId}`,
      };
      return {
        id: record.id,
        status: record.status,
        requester,
        createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : null,
      };
    });

  const pendingOutgoing = pendingRecords
    .filter((record) => record.requesterId === normalizedUserId)
    .map((record) => {
      const target = userSummaries.get(record.addresseeId) ?? {
        id: record.addresseeId,
        name: `User ${record.addresseeId}`,
      };
      return {
        id: record.id,
        status: record.status,
        target,
        createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : null,
      };
    });

  return {
    accepted,
    pendingIncoming,
    pendingOutgoing,
    summary: {
      accepted: accepted.length,
      pendingIncoming: pendingIncoming.length,
      pendingOutgoing: pendingOutgoing.length,
    },
  };
}

export async function requestAgencyConnection(userId, targetId) {
  const normalizedTargetId = normalizeInteger(targetId, 'targetId');
  const result = await connectionService.requestConnection(userId, normalizedTargetId);
  const summaries = await fetchUserSummaries([result.addressee?.id, result.requester?.id].filter(Boolean));
  return {
    id: result.id,
    status: result.status,
    requester: summaries.get(result.requester?.id ?? userId) ?? result.requester ?? null,
    addressee: summaries.get(result.addressee?.id ?? normalizedTargetId) ?? result.addressee ?? null,
    createdAt: result.createdAt ? new Date(result.createdAt).toISOString() : null,
  };
}

export async function respondToAgencyConnection(userId, connectionId, decision) {
  const connectionIdentifier = normalizeInteger(connectionId, 'connectionId');
  const normalizedDecision = `${decision}`.trim().toLowerCase();
  if (!['accept', 'reject'].includes(normalizedDecision)) {
    throw new ValidationError('decision must be accept or reject.');
  }
  const record = await connectionService.respondToConnection({
    connectionId: connectionIdentifier,
    actorId: userId,
    decision: normalizedDecision,
  });
  const counterpartId = record.requesterId === userId ? record.addresseeId : record.requesterId;
  const summaries = await fetchUserSummaries([counterpartId]);
  const summary = summaries.get(counterpartId) ?? { id: counterpartId, name: `User ${counterpartId}` };
  return formatConnection(record, summary, userId);
}

export async function removeAgencyConnection(userId, connectionId) {
  const connectionIdentifier = normalizeInteger(connectionId, 'connectionId');
  const record = await Connection.findByPk(connectionIdentifier);
  if (!record) {
    throw new NotFoundError('Connection not found.');
  }
  if (record.requesterId !== Number(userId) && record.addresseeId !== Number(userId)) {
    throw new AuthorizationError('You are not permitted to modify this connection.');
  }
  if (record.status !== 'rejected') {
    record.status = 'rejected';
    await record.save();
  }
}

export default {
  getAgencyProfileOverview,
  updateAgencyProfile,
  updateAgencyAvatar,
  listAgencyFollowers,
  updateAgencyFollower,
  removeAgencyFollower,
  listAgencyConnections,
  requestAgencyConnection,
  respondToAgencyConnection,
  removeAgencyConnection,
};
