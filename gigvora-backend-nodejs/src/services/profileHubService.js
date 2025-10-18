import { Op } from 'sequelize';
import {
  sequelize,
  Profile,
  ProfileFollower,
  Connection,
  User,
  PROFILE_FOLLOWER_STATUSES,
  PROFILE_NETWORK_VISIBILITY_OPTIONS,
} from '../models/index.js';
import profileService, { updateProfile, updateProfileAvatar } from './profileService.js';
import { upsertProfileFollower, recalculateProfileEngagementNow } from './profileEngagementService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normalizeUserId(value, label = 'userId') {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function normalizeString(value, { maxLength = 255, allowNull = true } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return allowNull ? null : '';
  }
  return trimmed.slice(0, maxLength);
}

function normalizeTags(value) {
  const source = Array.isArray(value) ? value : [];
  const result = [];
  const seen = new Set();
  source.forEach((item) => {
    if (!item) return;
    const trimmed = `${item}`.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed.slice(0, 60));
  });
  return result.slice(0, 12);
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeVisibility(value) {
  if (!value) {
    return PROFILE_NETWORK_VISIBILITY_OPTIONS[0];
  }
  const normalized = `${value}`.trim().toLowerCase();
  return PROFILE_NETWORK_VISIBILITY_OPTIONS.includes(normalized)
    ? normalized
    : PROFILE_NETWORK_VISIBILITY_OPTIONS[0];
}

function formatUserSummary(user) {
  if (!user) {
    return null;
  }
  const profile = user.Profile ?? user.profile ?? {};
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || `User #${user.id}`;
  return {
    id: user.id,
    name,
    headline: profile.headline ?? null,
    location: profile.location ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    avatarSeed: profile.avatarSeed ?? name,
    userType: user.userType ?? null,
  };
}

function sanitizeFollowerRecord(record) {
  const plain = record.get({ plain: true });
  const follower = record.get?.('follower') ?? plain.follower ?? null;
  return {
    id: plain.id,
    profileId: plain.profileId,
    followerId: plain.followerId,
    status: plain.status,
    notificationsEnabled: Boolean(plain.notificationsEnabled),
    displayName: plain.displayName ?? null,
    notes: plain.notes ?? null,
    tags: normalizeTags(plain.tags),
    followedAt: plain.followedAt ?? null,
    lastInteractedAt: plain.lastInteractedAt ?? null,
    summary: formatUserSummary(follower),
  };
}

function sanitizeConnectionRecord(record, ownerId) {
  const plain = record.get({ plain: true });
  const requester = record.get?.('requester') ?? plain.requester ?? null;
  const addressee = record.get?.('addressee') ?? plain.addressee ?? null;
  const counterpart = plain.requesterId === ownerId ? addressee : requester;
  return {
    id: plain.id,
    status: plain.status,
    favourite: Boolean(plain.favourite),
    visibility: sanitizeVisibility(plain.visibility),
    relationshipTag: plain.relationshipTag ?? null,
    notes: plain.notes ?? null,
    connectedAt: plain.connectedAt ?? plain.createdAt ?? null,
    lastInteractedAt: plain.lastInteractedAt ?? plain.updatedAt ?? null,
    counterpart: formatUserSummary(counterpart),
  };
}

async function resolveFollowerUserId(payload = {}) {
  if (!payload) {
    throw new ValidationError('Follower payload is required.');
  }
  if (payload.followerId) {
    return normalizeUserId(payload.followerId, 'followerId');
  }
  const email = normalizeString(payload.email ?? payload.followerEmail ?? null, {
    maxLength: 255,
  });
  if (!email) {
    throw new ValidationError('Provide a followerId or followerEmail.');
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new NotFoundError('Follower could not be found for the supplied identifier.');
  }
  return user.id;
}

function sanitizeFollowerStatus(status) {
  if (!status) {
    return 'active';
  }
  const normalized = `${status}`.trim().toLowerCase();
  if (!PROFILE_FOLLOWER_STATUSES.includes(normalized)) {
    throw new ValidationError(
      `status must be one of: ${PROFILE_FOLLOWER_STATUSES.join(', ')}.`,
    );
  }
  return normalized;
}

export async function getProfileHub(userId, { viewerId, bypassCache = false, profileOverview: existingOverview = null } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const profileOverview = existingOverview
    ? existingOverview
    : await profileService.getProfileOverview(normalizedUserId, { bypassCache });
  const profileId = profileOverview.profileId;

  const [followerRecords, connectionRecords] = await Promise.all([
    ProfileFollower.findAll({
      where: { profileId },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
        },
      ],
      order: [['followedAt', 'DESC']],
      limit: 150,
    }),
    Connection.findAll({
      where: {
        status: { [Op.in]: ['accepted', 'pending'] },
        [Op.or]: [{ requesterId: normalizedUserId }, { addresseeId: normalizedUserId }],
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
        },
        {
          model: User,
          as: 'addressee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
        },
      ],
      order: [['updatedAt', 'DESC']],
      limit: 200,
    }),
  ]);

  const followers = followerRecords.map(sanitizeFollowerRecord);
  const followerStats = followers.reduce(
    (acc, follower) => {
      acc.total += 1;
      if (follower.status === 'active') acc.active += 1;
      if (follower.status === 'muted') acc.muted += 1;
      if (follower.status === 'blocked') acc.blocked += 1;
      return acc;
    },
    { total: 0, active: 0, muted: 0, blocked: 0 },
  );

  const acceptedConnections = [];
  const pendingConnections = [];
  connectionRecords.forEach((record) => {
    const sanitized = sanitizeConnectionRecord(record, normalizedUserId);
    if (record.status === 'accepted') {
      acceptedConnections.push(sanitized);
    } else if (record.status === 'pending') {
      pendingConnections.push(sanitized);
    }
  });

  const favouriteConnections = acceptedConnections.filter((connection) => connection.favourite).length;

  return {
    profile: profileOverview,
    followers: {
      ...followerStats,
      items: followers,
    },
    connections: {
      total: acceptedConnections.length,
      favourites: favouriteConnections,
      items: acceptedConnections,
      pending: pendingConnections,
    },
    settings: {
      profileVisibility: profileOverview.profileVisibility,
      networkVisibility: profileOverview.networkVisibility,
      followersVisibility: profileOverview.followersVisibility,
      socialLinks: profileOverview.socialLinks ?? [],
    },
  };
}

export async function saveFollower(userId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const followerId = await resolveFollowerUserId(payload);
  const status = sanitizeFollowerStatus(payload.status ?? 'active');
  const notificationsEnabled = payload.notificationsEnabled !== false;
  const tags = normalizeTags(payload.tags);
  const displayName = normalizeString(payload.displayName, { maxLength: 255 });
  const notes = normalizeString(payload.notes, { maxLength: 2000 });
  const lastInteractedAt = normalizeDate(payload.lastInteractedAt);

  return sequelize.transaction(async (transaction) => {
    const profile = await Profile.findOne({
      where: { userId: normalizedUserId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }

    await upsertProfileFollower({
      profileId: profile.id,
      followerId,
      status,
      notificationsEnabled,
      metadata: payload.metadata ?? null,
    });

    const followerRecord = await ProfileFollower.findOne({
      where: { profileId: profile.id, followerId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    followerRecord.displayName = displayName ?? null;
    followerRecord.notes = notes ?? null;
    followerRecord.tags = tags;
    followerRecord.lastInteractedAt = lastInteractedAt ?? followerRecord.lastInteractedAt;
    await followerRecord.save({ transaction });

    const refreshed = await ProfileFollower.findOne({
      where: { id: followerRecord.id },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
        },
      ],
      transaction,
    });

    await recalculateProfileEngagementNow(profile.id);

    return sanitizeFollowerRecord(refreshed);
  });
}

export async function deleteFollower(userId, followerId) {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedFollowerId = normalizeUserId(followerId, 'followerId');

  return sequelize.transaction(async (transaction) => {
    const profile = await Profile.findOne({
      where: { userId: normalizedUserId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }

    const record = await ProfileFollower.findOne({
      where: { profileId: profile.id, followerId: normalizedFollowerId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record) {
      throw new NotFoundError('Follower relationship not found.');
    }

    await record.destroy({ transaction });
    await recalculateProfileEngagementNow(profile.id);
    return { success: true };
  });
}

export async function listConnections(userId) {
  const snapshot = await getProfileHub(userId);
  return snapshot.connections;
}

export async function updateConnection(userId, connectionId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedConnectionId = normalizeUserId(connectionId, 'connectionId');

  const connection = await Connection.findOne({
    where: {
      id: normalizedConnectionId,
      [Op.or]: [{ requesterId: normalizedUserId }, { addresseeId: normalizedUserId }],
    },
  });

  if (!connection) {
    throw new NotFoundError('Connection not found.');
  }

  const updates = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'relationshipTag')) {
    updates.relationshipTag = normalizeString(payload.relationshipTag, { maxLength: 120 });
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'notes')) {
    updates.notes = normalizeString(payload.notes, { maxLength: 5000 });
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'favourite')) {
    updates.favourite = Boolean(payload.favourite);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'visibility')) {
    updates.visibility = sanitizeVisibility(payload.visibility);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'lastInteractedAt')) {
    updates.lastInteractedAt = normalizeDate(payload.lastInteractedAt);
  }

  if (Object.keys(updates).length === 0) {
    return sanitizeConnectionRecord(connection, normalizedUserId);
  }

  await connection.update(updates);

  const refreshed = await Connection.findByPk(connection.id, {
    include: [
      {
        model: User,
        as: 'requester',
        attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
        include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
      },
      {
        model: User,
        as: 'addressee',
        attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
        include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
      },
    ],
  });

  return sanitizeConnectionRecord(refreshed, normalizedUserId);
}

export async function updateProfileBasics(userId, payload = {}) {
  return updateProfile(userId, payload);
}

export async function changeProfileAvatar(userId, payload = {}) {
  return updateProfileAvatar(userId, payload);
}

export default {
  getProfileHub,
  saveFollower,
  deleteFollower,
  listConnections,
  updateConnection,
  updateProfileBasics,
  changeProfileAvatar,
};
