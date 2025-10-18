import { User, Profile, CompanyProfile, CompanyProfileFollower, CompanyProfileConnection } from '../models/index.js';
import { normalizeLocationPayload, buildLocationDetails } from '../utils/location.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const FOLLOWER_STATUSES = ['pending', 'active', 'blocked'];
const CONNECTION_STATUSES = ['pending', 'active', 'archived', 'blocked'];

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

function normalizeUrl(value) {
  const raw = normalizeString(value);
  if (!raw) {
    return null;
  }
  try {
    const parsed = new URL(raw, raw.startsWith('http') ? undefined : 'https://placeholder.invalid');
    if (!raw.startsWith('http')) {
      return parsed.toString().replace('https://placeholder.invalid', '');
    }
    return parsed.toString();
  } catch (error) {
    return raw;
  }
}

function normalizeSocialLinks(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (!item) {
          return null;
        }
        if (typeof item === 'string') {
          const url = normalizeUrl(item);
          return url ? { label: null, url } : null;
        }
        const label = normalizeString(item.label, { maxLength: 80 });
        const url = normalizeUrl(item.url ?? item.href ?? item.link);
        if (!url) {
          return null;
        }
        return { label, url };
      })
      .filter(Boolean);
  }
  if (typeof input === 'object') {
    return normalizeSocialLinks(Object.entries(input).map(([label, url]) => ({ label, url })));
  }
  const single = normalizeUrl(`${input}`);
  return single ? [{ label: null, url: single }] : [];
}

function normalizeStatus(value, allowed, label) {
  if (!value) {
    return allowed[0];
  }
  const normalised = `${value}`.trim().toLowerCase();
  if (!allowed.includes(normalised)) {
    throw new ValidationError(`Unsupported ${label} "${value}".`);
  }
  return normalised;
}

async function ensureCompanyProfile(userId, { transaction } = {}) {
  const profile = await CompanyProfile.findOne({ where: { userId }, transaction });
  if (!profile) {
    throw new NotFoundError('Company profile not found.');
  }
  return profile;
}

async function resolveTargetUser({ followerId, email }, { transaction } = {}) {
  if (followerId != null) {
    const target = await User.findByPk(followerId, {
      include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }],
      transaction,
    });
    if (!target) {
      throw new NotFoundError('Target user not found.');
    }
    return target;
  }
  if (email) {
    const normalizedEmail = normalizeString(email, { allowNull: false });
    if (!normalizedEmail) {
      throw new ValidationError('A valid email address is required.');
    }
    const targetEmail = normalizedEmail.toLowerCase();
    const target = await User.findOne({
      where: { email: targetEmail },
      include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }],
      transaction,
    });
    if (!target) {
      throw new NotFoundError('Target user not found.');
    }
    return target;
  }
  throw new ValidationError('A followerId or email must be provided.');
}

function buildUserSummary(user) {
  if (!user) {
    return null;
  }
  const plain = user.get ? user.get({ plain: true }) : user;
  const profile = plain.Profile ?? plain.profile ?? null;
  const name = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim() || plain.email;
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    userType: plain.userType,
    name,
    profile: profile
      ? {
          headline: profile.headline ?? null,
          location: profile.location ?? null,
          avatarSeed: profile.avatarSeed ?? null,
        }
      : null,
  };
}

function buildFollowerResponse(record) {
  const plain = record.get ? record.get({ plain: true }) : record;
  return {
    companyProfileId: plain.companyProfileId,
    followerId: plain.followerId,
    status: plain.status,
    notificationsEnabled: Boolean(plain.notificationsEnabled),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    follower: buildUserSummary(plain.follower ?? record.follower),
  };
}

function buildConnectionResponse(record) {
  const plain = record.get ? record.get({ plain: true }) : record;
  const target = buildUserSummary(plain.targetUser ?? record.targetUser);
  const companyProfile = plain.targetCompanyProfile ?? record.targetCompanyProfile;
  return {
    id: plain.id,
    companyProfileId: plain.companyProfileId,
    targetUserId: plain.targetUserId,
    targetCompanyProfileId: plain.targetCompanyProfileId ?? null,
    relationshipType: plain.relationshipType ?? null,
    status: plain.status,
    contactEmail: plain.contactEmail ?? (target ? target.email : null),
    contactPhone: plain.contactPhone ?? null,
    notes: plain.notes ?? null,
    lastInteractedAt: plain.lastInteractedAt ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    target,
    targetCompanyProfile: companyProfile
      ? {
          id: companyProfile.id,
          companyName: companyProfile.companyName,
          tagline: companyProfile.tagline ?? null,
          logoUrl: companyProfile.logoUrl ?? null,
        }
      : null,
  };
}

function sanitizeCompanyProfile(profileInstance) {
  const plain = profileInstance.get ? profileInstance.get({ plain: true }) : profileInstance;
  const socialLinks = Array.isArray(plain.socialLinks)
    ? plain.socialLinks.map((entry) => ({
        label: entry?.label ?? null,
        url: entry?.url ?? null,
      }))
    : [];
  const locationDetails = buildLocationDetails(plain.location, plain.geoLocation);
  return {
    id: plain.id,
    userId: plain.userId,
    companyName: plain.companyName,
    tagline: plain.tagline ?? null,
    description: plain.description ?? null,
    website: plain.website ?? null,
    location: plain.location ?? null,
    geoLocation: plain.geoLocation ?? null,
    locationDetails,
    logoUrl: plain.logoUrl ?? null,
    bannerUrl: plain.bannerUrl ?? null,
    contactEmail: plain.contactEmail ?? null,
    contactPhone: plain.contactPhone ?? null,
    socialLinks,
    updatedAt: plain.updatedAt,
    createdAt: plain.createdAt,
  };
}

async function getCompanyProfileWorkspace({ userId, viewerId }) {
  if (!Number.isInteger(Number(userId))) {
    throw new ValidationError('A valid userId is required.');
  }
  const normalizedUserId = Number(userId);
  const profile = await ensureCompanyProfile(normalizedUserId);

  if (viewerId != null && normalizedUserId !== Number(viewerId)) {
    throw new AuthorizationError('You can only view your own company profile workspace.');
  }

  const [followers, connections] = await Promise.all([
    CompanyProfileFollower.findAll({
      where: { companyProfileId: profile.id },
      include: [
        {
          model: User,
          as: 'follower',
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    }),
    CompanyProfileConnection.findAll({
      where: { companyProfileId: profile.id },
      include: [
        {
          model: User,
          as: 'targetUser',
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }],
        },
        { model: CompanyProfile, as: 'targetCompanyProfile', attributes: ['id', 'companyName', 'tagline', 'logoUrl'] },
      ],
      order: [['createdAt', 'DESC']],
    }),
  ]);

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const followerResponses = followers.map(buildFollowerResponse);
  const connectionResponses = connections.map(buildConnectionResponse);

  const metrics = {
    followersTotal: followerResponses.length,
    followersActive: followerResponses.filter((follower) => follower.status === 'active').length,
    followersNew30d: followerResponses.filter((follower) =>
      follower.createdAt ? new Date(follower.createdAt) >= monthAgo : false,
    ).length,
    connectionsTotal: connectionResponses.length,
    connectionsActive: connectionResponses.filter((connection) => connection.status === 'active').length,
    connectionsPending: connectionResponses.filter((connection) => connection.status === 'pending').length,
  };

  return {
    profile: sanitizeCompanyProfile(profile),
    followers: followerResponses,
    connections: connectionResponses,
    metrics,
    permissions: {
      canEditProfile: true,
      canManageFollowers: true,
      canManageConnections: true,
    },
    lastUpdated: new Date().toISOString(),
  };
}

async function updateCompanyProfileDetails(userId, payload = {}) {
  if (!Number.isInteger(Number(userId))) {
    throw new ValidationError('A valid userId is required.');
  }
  const normalizedUserId = Number(userId);
  const profile = await ensureCompanyProfile(normalizedUserId);

  const locationPayload = normalizeLocationPayload({
    location: payload.location,
    geoLocation: payload.geoLocation,
  });

  const updates = {
    companyName: normalizeString(payload.companyName, { allowNull: false }),
    tagline: normalizeString(payload.tagline),
    description: payload.description == null ? null : `${payload.description}`.trim(),
    website: normalizeString(payload.website),
    location: locationPayload.location,
    geoLocation: locationPayload.geoLocation,
    contactEmail: normalizeString(payload.contactEmail),
    contactPhone: normalizeString(payload.contactPhone),
    socialLinks: normalizeSocialLinks(payload.socialLinks),
  };

  if (!updates.companyName) {
    throw new ValidationError('Company name is required.');
  }

  await profile.update(updates);
  return sanitizeCompanyProfile(profile);
}

async function updateCompanyAvatar(userId, payload = {}) {
  if (!Number.isInteger(Number(userId))) {
    throw new ValidationError('A valid userId is required.');
  }
  const normalizedUserId = Number(userId);
  const profile = await ensureCompanyProfile(normalizedUserId);

  const updates = {
    logoUrl: normalizeUrl(payload.logoUrl),
    bannerUrl: normalizeUrl(payload.bannerUrl),
  };
  await profile.update(updates);
  return sanitizeCompanyProfile(profile);
}

async function addFollower({ userId, followerId, email, status = 'active', notificationsEnabled = true }) {
  if (!Number.isInteger(Number(userId))) {
    throw new ValidationError('A valid userId is required.');
  }
  const normalizedUserId = Number(userId);
  const profile = await ensureCompanyProfile(normalizedUserId);
  const followerStatus = normalizeStatus(status, FOLLOWER_STATUSES, 'follower status');

  const followerUser = await resolveTargetUser({ followerId, email });
  if (followerUser.id === normalizedUserId) {
    throw new ValidationError('You cannot follow your own company profile.');
  }

  const [record] = await CompanyProfileFollower.findOrCreate({
    where: { companyProfileId: profile.id, followerId: followerUser.id },
    defaults: {
      status: followerStatus,
      notificationsEnabled: Boolean(notificationsEnabled),
    },
  });

  if (!record.isNewRecord) {
    record.status = followerStatus;
    record.notificationsEnabled = Boolean(notificationsEnabled);
    await record.save();
  }

  await record.reload({
    include: [{ model: User, as: 'follower', include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }] }],
  });

  return buildFollowerResponse(record);
}

async function updateFollower({ userId, followerId, status, notificationsEnabled }) {
  if (!Number.isInteger(Number(userId))) {
    throw new ValidationError('A valid userId is required.');
  }
  const normalizedUserId = Number(userId);
  const profile = await ensureCompanyProfile(normalizedUserId);
  if (!Number.isInteger(Number(followerId))) {
    throw new ValidationError('A valid followerId is required.');
  }
  const normalizedFollowerId = Number(followerId);
  const record = await CompanyProfileFollower.findOne({
    where: { companyProfileId: profile.id, followerId: normalizedFollowerId },
  });
  if (!record) {
    throw new NotFoundError('Follower record not found.');
  }

  if (status != null) {
    record.status = normalizeStatus(status, FOLLOWER_STATUSES, 'follower status');
  }
  if (notificationsEnabled != null) {
    record.notificationsEnabled = Boolean(notificationsEnabled);
  }
  await record.save();
  await record.reload({
    include: [{ model: User, as: 'follower', include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }] }],
  });
  return buildFollowerResponse(record);
}

async function removeFollower({ userId, followerId }) {
  if (!Number.isInteger(Number(userId))) {
    throw new ValidationError('A valid userId is required.');
  }
  const normalizedUserId = Number(userId);
  const profile = await ensureCompanyProfile(normalizedUserId);
  if (!Number.isInteger(Number(followerId))) {
    throw new ValidationError('A valid followerId is required.');
  }
  const normalizedFollowerId = Number(followerId);
  const deleted = await CompanyProfileFollower.destroy({
    where: { companyProfileId: profile.id, followerId: normalizedFollowerId },
  });
  if (!deleted) {
    throw new NotFoundError('Follower record not found.');
  }
  return { success: true };
}

async function createConnection({
  userId,
  targetUserId,
  targetEmail,
  relationshipType,
  status = 'pending',
  contactEmail,
  contactPhone,
  notes,
  lastInteractedAt,
}) {
  if (!Number.isInteger(Number(userId))) {
    throw new ValidationError('A valid userId is required.');
  }
  const normalizedUserId = Number(userId);
  const profile = await ensureCompanyProfile(normalizedUserId);

  const connectionStatus = normalizeStatus(status, CONNECTION_STATUSES, 'connection status');
  const targetUser = await resolveTargetUser({ followerId: targetUserId, email: targetEmail });
  if (targetUser.id === normalizedUserId) {
    throw new ValidationError('You cannot create a connection with your own user account.');
  }

  const targetCompanyProfile = await CompanyProfile.findOne({ where: { userId: targetUser.id }, attributes: ['id', 'companyName', 'tagline', 'logoUrl'] });

  const [record] = await CompanyProfileConnection.findOrCreate({
    where: { companyProfileId: profile.id, targetUserId: targetUser.id },
    defaults: {
      relationshipType: normalizeString(relationshipType),
      status: connectionStatus,
      contactEmail: normalizeString(contactEmail),
      contactPhone: normalizeString(contactPhone),
      notes: notes == null ? null : `${notes}`.trim(),
      lastInteractedAt: lastInteractedAt ? new Date(lastInteractedAt) : null,
      targetCompanyProfileId: targetCompanyProfile?.id ?? null,
    },
  });

  if (!record.isNewRecord) {
    record.relationshipType = normalizeString(relationshipType);
    record.status = connectionStatus;
    record.contactEmail = normalizeString(contactEmail);
    record.contactPhone = normalizeString(contactPhone);
    record.notes = notes == null ? record.notes : `${notes}`.trim();
    record.lastInteractedAt = lastInteractedAt ? new Date(lastInteractedAt) : record.lastInteractedAt;
    record.targetCompanyProfileId = targetCompanyProfile?.id ?? null;
    await record.save();
  }

  await record.reload({
    include: [
      {
        model: User,
        as: 'targetUser',
        include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }],
      },
      { model: CompanyProfile, as: 'targetCompanyProfile', attributes: ['id', 'companyName', 'tagline', 'logoUrl'] },
    ],
  });

  return buildConnectionResponse(record);
}

async function updateConnection({
  userId,
  connectionId,
  relationshipType,
  status,
  contactEmail,
  contactPhone,
  notes,
  lastInteractedAt,
}) {
  if (!Number.isInteger(Number(userId))) {
    throw new ValidationError('A valid userId is required.');
  }
  const normalizedUserId = Number(userId);
  const profile = await ensureCompanyProfile(normalizedUserId);
  if (!Number.isInteger(Number(connectionId))) {
    throw new ValidationError('A valid connectionId is required.');
  }
  const normalizedConnectionId = Number(connectionId);
  const record = await CompanyProfileConnection.findOne({
    where: { id: normalizedConnectionId, companyProfileId: profile.id },
  });
  if (!record) {
    throw new NotFoundError('Connection not found.');
  }

  if (relationshipType !== undefined) {
    record.relationshipType = normalizeString(relationshipType);
  }
  if (status !== undefined) {
    record.status = normalizeStatus(status, CONNECTION_STATUSES, 'connection status');
  }
  if (contactEmail !== undefined) {
    record.contactEmail = normalizeString(contactEmail);
  }
  if (contactPhone !== undefined) {
    record.contactPhone = normalizeString(contactPhone);
  }
  if (notes !== undefined) {
    record.notes = notes == null ? null : `${notes}`.trim();
  }
  if (lastInteractedAt !== undefined) {
    record.lastInteractedAt = lastInteractedAt ? new Date(lastInteractedAt) : null;
  }

  await record.save();
  await record.reload({
    include: [
      {
        model: User,
        as: 'targetUser',
        include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }],
      },
      { model: CompanyProfile, as: 'targetCompanyProfile', attributes: ['id', 'companyName', 'tagline', 'logoUrl'] },
    ],
  });

  return buildConnectionResponse(record);
}

async function removeConnection({ userId, connectionId }) {
  if (!Number.isInteger(Number(userId))) {
    throw new ValidationError('A valid userId is required.');
  }
  const normalizedUserId = Number(userId);
  const profile = await ensureCompanyProfile(normalizedUserId);
  if (!Number.isInteger(Number(connectionId))) {
    throw new ValidationError('A valid connectionId is required.');
  }
  const normalizedConnectionId = Number(connectionId);
  const deleted = await CompanyProfileConnection.destroy({
    where: { id: normalizedConnectionId, companyProfileId: profile.id },
  });
  if (!deleted) {
    throw new NotFoundError('Connection not found.');
  }
  return { success: true };
}

export default {
  getCompanyProfileWorkspace,
  updateCompanyProfileDetails,
  updateCompanyAvatar,
  addFollower,
  updateFollower,
  removeFollower,
  createConnection,
  updateConnection,
  removeConnection,
};
