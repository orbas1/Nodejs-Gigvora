import { Op, fn, col, literal } from 'sequelize';
import * as models from '../models/index.js';
import { appCache } from '../utils/cache.js';

const CACHE_PREFIX = 'feed:suggestions';
const CACHE_TTL_SECONDS = 60 * 5;

const { FeedPost, User, Profile, Connection, Group, GroupMembership } = models;

const LIVE_SIGNAL_TYPE_META = {
  update: { tag: 'Update', icon: '⚡️', narrative: 'shared an update' },
  media: { tag: 'Media', icon: '🎞️', narrative: 'dropped new media' },
  job: { tag: 'Job', icon: '💼', narrative: 'posted a role' },
  gig: { tag: 'Gig', icon: '🛠️', narrative: 'posted a gig opportunity' },
  project: { tag: 'Project', icon: '📁', narrative: 'shared a project milestone' },
  volunteering: { tag: 'Volunteer', icon: '🌱', narrative: 'opened a volunteer mission' },
  launchpad: { tag: 'Launchpad', icon: '🚀', narrative: 'published a Launchpad highlight' },
  news: { tag: 'News', icon: '📰', narrative: 'broadcast Gigvora news' },
};

function normaliseActorId(actor) {
  if (!actor) {
    return null;
  }
  if (typeof actor === 'number') {
    return Number.isFinite(actor) && actor > 0 ? actor : null;
  }
  if (typeof actor === 'string') {
    const parsed = Number.parseInt(actor, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  if (typeof actor === 'object' && actor.id != null) {
    return normaliseActorId(actor.id);
  }
  return null;
}

function truncate(value, maxLength) {
  if (!value) {
    return '';
  }
  const text = `${value}`.trim();
  if (!text) {
    return '';
  }
  if (!maxLength || text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function toPlain(record) {
  if (!record) {
    return null;
  }
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  return record;
}

function buildCacheKey(actorId, { connectionLimit, groupLimit, signalLimit }) {
  return `${CACHE_PREFIX}:${actorId}:${connectionLimit}:${groupLimit}:${signalLimit}`;
}

function extractFocusAreas(group) {
  const buckets = [
    group?.metadata?.focusAreas,
    group?.metadata?.topics,
    group?.metadata?.tags,
    group?.settings?.focusAreas,
    group?.settings?.tags,
  ];
  const collected = [];
  buckets.forEach((bucket) => {
    if (!bucket) return;
    if (Array.isArray(bucket)) {
      bucket.filter(Boolean).forEach((entry) => collected.push(`${entry}`.trim()));
      return;
    }
    collected.push(`${bucket}`.trim());
  });
  return Array.from(new Set(collected.filter(Boolean))).slice(0, 4);
}

function createConnectionCandidateFromPost(post, actorId) {
  const plain = toPlain(post);
  if (!plain) {
    return null;
  }
  const author = plain.User ?? {};
  const profile = author.Profile ?? {};
  const userId = author.id ?? plain.userId ?? null;
  if (!userId || (actorId && Number(userId) === Number(actorId))) {
    return null;
  }
  const name =
    plain.authorName ||
    [author.firstName, author.lastName].filter(Boolean).join(' ').trim() ||
    profile.fullName ||
    null;
  if (!name) {
    return null;
  }
  const headline =
    truncate(
      plain.authorHeadline || profile.headline || profile.bio || plain.summary || 'Active in the Gigvora feed',
      120,
    );
  return {
    id: `feed-post-${plain.id ?? userId}`,
    userId,
    name,
    headline,
    location: profile.location ?? null,
    avatarSeed: plain.authorAvatarSeed || profile.avatarSeed || name,
    reason: truncate('Recently active in your circles—start a conversation while momentum is high.', 140),
    mutualConnections: 0,
    score: 4,
  };
}

async function buildConnectionSuggestions(actorId, { limit, recentFeedPosts }) {
  if (!actorId) {
    return [];
  }

  if (!Profile?.findAll || !Connection?.findAll || !User) {
    return [];
  }

  const accepted = await Connection.findAll({
    where: {
      status: 'accepted',
      [Op.or]: [{ requesterId: actorId }, { addresseeId: actorId }],
    },
    attributes: ['requesterId', 'addresseeId'],
  });

  const connectedIds = new Set();
  accepted.forEach((record) => {
    if (Number.isInteger(record.requesterId)) {
      connectedIds.add(Number(record.requesterId));
    }
    if (Number.isInteger(record.addresseeId)) {
      connectedIds.add(Number(record.addresseeId));
    }
  });
  connectedIds.delete(Number(actorId));

  const exclusion = Array.from(connectedIds);
  exclusion.push(Number(actorId));

  const profiles = await Profile.findAll({
    where: {
      userId: exclusion.length ? { [Op.notIn]: exclusion } : { [Op.ne]: null },
    },
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email', 'userType', 'primaryDashboard'],
      },
    ],
    order: [
      ['followersCount', 'DESC'],
      ['trustScore', 'DESC'],
      ['updatedAt', 'DESC'],
    ],
    limit: Math.max(limit * 3, limit),
  });

  const suggestionIds = profiles
    .map((profile) => Number(profile.userId))
    .filter((id) => Number.isInteger(id) && !connectedIds.has(id));

  const mutualCounts = new Map();
  if (suggestionIds.length && connectedIds.size) {
    const mutual = await Connection.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [
          { requesterId: { [Op.in]: suggestionIds }, addresseeId: { [Op.in]: Array.from(connectedIds) } },
          { addresseeId: { [Op.in]: suggestionIds }, requesterId: { [Op.in]: Array.from(connectedIds) } },
        ],
      },
      attributes: ['requesterId', 'addresseeId'],
    });

    mutual.forEach((record) => {
      const suggestionId = connectedIds.has(Number(record.requesterId))
        ? Number(record.addresseeId)
        : Number(record.requesterId);
      if (!Number.isInteger(suggestionId)) {
        return;
      }
      mutualCounts.set(suggestionId, (mutualCounts.get(suggestionId) ?? 0) + 1);
    });
  }

  const ranked = profiles
    .map((profile) => {
      const owner = profile.User;
      if (!owner) {
        return null;
      }
      const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim() || owner.email;
      const followersCount = Number.isFinite(Number(profile.followersCount))
        ? Number(profile.followersCount)
        : 0;
      const mutual = mutualCounts.get(owner.id) ?? 0;
      let reason = followersCount > 0 ? `${followersCount.toLocaleString()} followers` : 'Active community member';
      if (mutual > 0) {
        reason = mutual === 1 ? '1 mutual connection' : `${mutual} mutual connections`;
      }
      return {
        id: `user-${owner.id}`,
        userId: owner.id,
        name,
        headline: truncate(profile.headline ?? profile.bio ?? null, 120) || null,
        location: profile.location ?? null,
        avatarSeed: profile.avatarSeed ?? name,
        userType: owner.userType ?? null,
        primaryDashboard: owner.primaryDashboard ?? null,
        reason,
        mutualConnections: mutual,
        score: followersCount + mutual * 3 + (profile.trustScore != null ? Number(profile.trustScore) : 0),
      };
    })
    .filter(Boolean);

  const dynamicCandidates = Array.isArray(recentFeedPosts)
    ? recentFeedPosts
        .map((post) => createConnectionCandidateFromPost(post, actorId))
        .filter(Boolean)
    : [];

  const combined = [...dynamicCandidates, ...ranked]
    .filter((candidate, index, array) => {
      const identifier = candidate.userId ?? candidate.id;
      return identifier != null && array.findIndex((item) => (item.userId ?? item.id) === identifier) === index;
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return combined.slice(0, limit).map(({ score, ...rest }) => rest);
}

async function buildGroupSuggestions(actorId, { limit }) {
  if (!Group?.findAll || !GroupMembership?.findAll) {
    return [];
  }

  const membershipRows = actorId
    ? await GroupMembership.findAll({ where: { userId: actorId }, attributes: ['groupId', 'status'] })
    : [];
  const joinedGroupIds = membershipRows
    .filter((row) => row.status === 'active')
    .map((row) => Number(row.groupId))
    .filter((id) => Number.isInteger(id));

  const groupWhere = {
    visibility: { [Op.in]: ['public', 'private'] },
  };
  if (joinedGroupIds.length) {
    groupWhere.id = { [Op.notIn]: joinedGroupIds };
  }

  const groups = await Group.findAll({
    attributes: [
      'id',
      'name',
      'description',
      'slug',
      'avatarColor',
      'metadata',
      'settings',
      'memberPolicy',
      [fn('COUNT', col('memberships.id')), 'activeMemberCount'],
    ],
    include: [
      {
        model: GroupMembership,
        as: 'memberships',
        required: false,
        attributes: [],
        where: { status: 'active' },
      },
    ],
    where: groupWhere,
    group: ['Group.id'],
    order: [[literal('"activeMemberCount"'), 'DESC'], ['updatedAt', 'DESC']],
    limit: Math.max(limit * 2, limit),
  });

  return groups.slice(0, limit).map((group) => {
    const plain = toPlain(group);
    const focusAreas = extractFocusAreas(plain);
    const memberCount = Number(plain.activeMemberCount ?? 0);
    const reasonParts = [];
    if (memberCount > 0) {
      reasonParts.push(`${memberCount.toLocaleString()} members inside`);
    }
    if (focusAreas.length) {
      reasonParts.push(`Focus: ${focusAreas.slice(0, 2).join(' • ')}`);
    }
    return {
      id: plain.id,
      name: plain.name,
      description: truncate(plain.description ?? 'A Gigvora community group connecting operators worldwide.', 160),
      slug: plain.slug,
      focus: focusAreas,
      members: memberCount,
      accentColor: plain.avatarColor ?? '#2563eb',
      joinPolicy: plain.memberPolicy ?? 'request',
      reason: reasonParts.join(' · ') || null,
    };
  });
}

async function buildLiveSignals(actorId, { limit }) {
  if (!FeedPost?.findAll) {
    return [];
  }

  const where = {};
  if (actorId) {
    where.userId = { [Op.ne]: actorId };
  }

  const include = User
    ? [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
          include: Profile ? [{ model: Profile, attributes: ['headline'] }] : [],
        },
      ]
    : [];

  const posts = await FeedPost.findAll({
    where,
    attributes: ['id', 'type', 'title', 'summary', 'createdAt', 'authorName', 'authorHeadline', 'authorAvatarSeed'],
    include,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit,
  });

  return posts.map((post) => {
    const plain = toPlain(post);
    const user = plain.User ?? {};
    const profile = user.Profile ?? {};
    const name =
      plain.authorName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      profile.fullName ||
      'Gigvora member';
    const meta = LIVE_SIGNAL_TYPE_META[plain.type] ?? LIVE_SIGNAL_TYPE_META.update;
    const title = truncate(plain.title ?? plain.summary ?? profile.headline ?? meta.narrative, 140);
    return {
      id: `feed-signal-${plain.id}`,
      title: title ? `${name} ${meta.narrative}` : `${name} ${meta.narrative}`,
      preview: title,
      tag: meta.tag,
      icon: meta.icon,
      timestamp: plain.createdAt ? new Date(plain.createdAt).toISOString() : new Date().toISOString(),
      link: `/feed?highlight=${plain.id}`,
    };
  });
}

export async function getFeedSuggestions(actor, options = {}) {
  const actorId = normaliseActorId(actor);
  if (!actorId) {
    return {
      generatedAt: new Date().toISOString(),
      connections: [],
      groups: [],
      liveMoments: [],
    };
  }

  const {
    connectionLimit = 6,
    groupLimit = 4,
    signalLimit = 5,
    recentFeedPosts = [],
  } = options;

  const cacheKey = buildCacheKey(actorId, { connectionLimit, groupLimit, signalLimit });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const [connections, groups, liveMoments] = await Promise.all([
      buildConnectionSuggestions(actorId, { limit: connectionLimit, recentFeedPosts }),
      buildGroupSuggestions(actorId, { limit: groupLimit }),
      buildLiveSignals(actorId, { limit: signalLimit }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      connections,
      groups,
      liveMoments,
    };
  });
}

export function invalidateFeedSuggestions(...actorIds) {
  const unique = new Set(
    actorIds
      .map((candidate) => normaliseActorId(candidate))
      .filter((identifier) => identifier && Number.isFinite(identifier)),
  );

  unique.forEach((identifier) => {
    appCache.flushByPrefix(`${CACHE_PREFIX}:${identifier}:`);
  });
}

export default {
  getFeedSuggestions,
  invalidateFeedSuggestions,
};
