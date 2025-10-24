import { Op, literal } from 'sequelize';

import { Profile, ProfileFollower, User } from '../models/index.js';
import { getAuthDomainService } from '../domains/serviceCatalog.js';

const MAX_SUGGESTION_LIMIT = 12;

function normaliseLimit(limit, fallback = 6) {
  if (limit == null) {
    return fallback;
  }
  const numeric = Number.parseInt(limit, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.min(Math.max(numeric, 1), MAX_SUGGESTION_LIMIT);
}

function buildSuggestionPayload({ profile, user, followerCount, mutualFollowerCount, sanitizedUser }) {
  const baseProfile = profile ?? {};
  const sanitizedProfile = sanitizedUser?.profile ?? {};
  const resolvedUser = sanitizedUser ?? (user ? { id: user.id, email: user.email } : null);
  return {
    profileId: baseProfile.id ?? null,
    userId: baseProfile.userId ?? user?.id ?? null,
    headline: baseProfile.headline ?? sanitizedProfile.headline ?? null,
    missionStatement: baseProfile.missionStatement ?? sanitizedProfile.missionStatement ?? null,
    location: baseProfile.location ?? sanitizedProfile.location ?? resolvedUser?.location ?? null,
    timezone: baseProfile.timezone ?? sanitizedProfile.timezone ?? null,
    avatarUrl: baseProfile.avatarUrl ?? sanitizedProfile.avatarUrl ?? resolvedUser?.avatarUrl ?? null,
    avatarSeed: baseProfile.avatarSeed ?? sanitizedProfile.avatarSeed ?? null,
    followerCount: Number(followerCount ?? 0),
    mutualFollowerCount: Number(mutualFollowerCount ?? 0),
    reason: Number(mutualFollowerCount ?? 0) > 0 ? 'shared_followers' : 'trending_profile',
    socialLinks: Array.isArray(baseProfile.socialLinks)
      ? baseProfile.socialLinks
      : Array.isArray(sanitizedProfile.socialLinks)
      ? sanitizedProfile.socialLinks
      : [],
    tags: Array.isArray(baseProfile.tags) ? baseProfile.tags : Array.isArray(sanitizedProfile.tags) ? sanitizedProfile.tags : [],
    user: resolvedUser,
  };
}

export async function getConnectionSuggestions({ viewerId, limit = 6 } = {}) {
  const normalizedViewerId = Number.parseInt(viewerId, 10);
  if (!Number.isInteger(normalizedViewerId) || normalizedViewerId <= 0) {
    return [];
  }
  const resolvedLimit = normaliseLimit(limit);

  const viewerProfile = await Profile.findOne({
    where: { userId: normalizedViewerId },
    attributes: ['id'],
  });

  const followedProfiles = await ProfileFollower.findAll({
    where: { followerId: normalizedViewerId },
    attributes: ['profileId'],
  });

  const excludedProfileIds = new Set(followedProfiles.map((entry) => entry.profileId).filter(Boolean));
  if (viewerProfile?.id) {
    excludedProfileIds.add(viewerProfile.id);
  }

  const whereClause = {
    userId: { [Op.ne]: normalizedViewerId },
    profileVisibility: { [Op.ne]: 'private' },
  };
  if (excludedProfileIds.size > 0) {
    whereClause.id = { [Op.notIn]: Array.from(excludedProfileIds) };
  }

  const followerCountLiteral = literal(`(
    SELECT COUNT(*) FROM profile_followers AS pf
    WHERE pf.profileId = Profile.id AND pf.status = 'active'
  )`);

  const mutualFollowerLiteral = viewerProfile?.id
    ? literal(`(
        SELECT COUNT(*) FROM profile_followers AS pf
        WHERE pf.profileId = Profile.id
          AND pf.status = 'active'
          AND pf.followerId IN (
            SELECT pf_inner.followerId
            FROM profile_followers AS pf_inner
            WHERE pf_inner.profileId = ${viewerProfile.id}
              AND pf_inner.status = 'active'
          )
      )`)
    : literal('0');

  const suggestions = await Profile.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'email', 'firstName', 'lastName', 'avatarUrl', 'jobTitle', 'location', 'userType'],
      },
    ],
    attributes: {
      include: [
        [followerCountLiteral, 'followerCount'],
        [mutualFollowerLiteral, 'mutualFollowerCount'],
      ],
    },
    order: [
      [literal('mutualFollowerCount'), 'DESC'],
      [literal('followerCount'), 'DESC'],
      ['updatedAt', 'DESC'],
    ],
    limit: resolvedLimit,
  });

  const authDomainService = getAuthDomainService();

  return suggestions.map((record) => {
    const plain = record.get({ plain: true });
    const user = plain.User ?? plain.user ?? null;
    const sanitizedUser = user && authDomainService ? authDomainService.sanitizeUser(user) : user;
    return buildSuggestionPayload({
      profile: plain,
      user,
      followerCount: plain.followerCount,
      mutualFollowerCount: plain.mutualFollowerCount,
      sanitizedUser,
    });
  });
}

export default {
  getConnectionSuggestions,
};
