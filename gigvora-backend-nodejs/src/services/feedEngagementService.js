import { Op, fn, col, literal } from 'sequelize';
import {
  Profile,
  Group,
  GroupMembership,
  FeedPost,
  Connection,
  User,
} from '../models/index.js';
import { ValidationError } from '../utils/errors.js';

const ACTIVE_GROUP_STATUS = 'active';
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 24;
const MOMENT_LIMIT_MULTIPLIER = 1.5;

const POST_TYPE_META = Object.freeze({
  update: { tag: 'Update', icon: '⚡️' },
  media: { tag: 'Media drop', icon: '🎬' },
  job: { tag: 'Job', icon: '💼' },
  gig: { tag: 'Gig', icon: '🛠️' },
  project: { tag: 'Project', icon: '🧭' },
  volunteering: { tag: 'Volunteer', icon: '🌱' },
  launchpad: { tag: 'Launchpad', icon: '🚀' },
  news: { tag: 'News', icon: '📰' },
});

function normaliseInteger(value, { fallback = null, min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || Number.isNaN(numeric)) {
    throw new ValidationError('limit must be a positive integer.');
  }
  const clamped = Math.min(Math.max(numeric, min), max);
  return clamped;
}

function toPlain(instance) {
  if (!instance || typeof instance !== 'object') {
    return instance ?? null;
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  if (typeof instance.toJSON === 'function') {
    return instance.toJSON();
  }
  return instance;
}

function extractTokens(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry : entry?.name ?? entry?.title ?? null))
      .filter(Boolean)
      .map((entry) => `${entry}`.trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,/]|\n|\r|\|/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return extractTokens(Object.values(value));
  }
  return [];
}

function collectProfileInterests(profile) {
  if (!profile) {
    return [];
  }
  const tokens = new Set();
  extractTokens(profile.skills).forEach((token) => tokens.add(token));
  extractTokens(profile.areasOfFocus).forEach((token) => tokens.add(token));
  extractTokens(profile.preferredEngagements).forEach((token) => tokens.add(token));
  extractTokens(profile.collaborationRoster).forEach((token) => tokens.add(token));
  extractTokens(profile.impactHighlights).forEach((token) => tokens.add(token));
  return Array.from(tokens);
}

function collectGroupInterests(memberships) {
  if (!Array.isArray(memberships)) {
    return [];
  }
  const tokens = new Set();
  memberships.forEach((membership) => {
    const plain = toPlain(membership);
    const metadata = plain?.group?.metadata ?? plain?.metadata ?? {};
    extractTokens(metadata.focus ?? metadata.topics ?? metadata.categories).forEach((token) => tokens.add(token));
    if (plain?.group?.name) {
      tokens.add(`${plain.group.name}`.trim().toLowerCase());
    }
  });
  return Array.from(tokens);
}

function buildConnectionStatusMap(viewerId, connections = []) {
  const statusMap = new Map();
  const exclusion = new Set([viewerId]);
  connections.forEach((connection) => {
    const plain = toPlain(connection);
    const requesterId = Number(plain?.requesterId);
    const addresseeId = Number(plain?.addresseeId);
    if (!Number.isInteger(requesterId) || !Number.isInteger(addresseeId)) {
      return;
    }
    const otherId = requesterId === viewerId ? addresseeId : addresseeId === viewerId ? requesterId : null;
    if (!otherId) {
      return;
    }
    exclusion.add(otherId);
    const existing = statusMap.get(otherId);
    if (!existing || existing === 'pending') {
      statusMap.set(otherId, plain.status ?? 'pending');
    }
  });
  return { statusMap, exclusion };
}

function summariseGroupMemberships(memberships = []) {
  const statusByGroup = new Map();
  const activeMemberships = [];
  memberships.forEach((membership) => {
    const plain = toPlain(membership);
    if (!plain?.groupId) {
      return;
    }
    statusByGroup.set(Number(plain.groupId), plain.status ?? ACTIVE_GROUP_STATUS);
    if ((plain.status ?? ACTIVE_GROUP_STATUS) === ACTIVE_GROUP_STATUS) {
      activeMemberships.push(plain);
    }
  });
  return { statusByGroup, activeMemberships };
}

function normaliseUserName(user) {
  if (!user) {
    return 'Gigvora member';
  }
  const plain = toPlain(user);
  const first = plain?.firstName ? `${plain.firstName}`.trim() : '';
  const last = plain?.lastName ? `${plain.lastName}`.trim() : '';
  const full = `${first} ${last}`.trim();
  return full || plain?.name || 'Gigvora member';
}

function extractProfile(user) {
  const plain = toPlain(user);
  if (!plain) {
    return {};
  }
  const profile = toPlain(plain.Profile ?? plain.profile);
  return profile ?? {};
}

function computeLocation(profile) {
  return profile.location ?? profile.city ?? profile.region ?? null;
}

function computeCompany(profile) {
  if (!profile || !profile.experienceEntries) {
    return null;
  }
  const entries = Array.isArray(profile.experienceEntries) ? profile.experienceEntries : [];
  const current = entries.find((entry) => entry?.isCurrent || entry?.current) ?? entries[0];
  return current?.company ?? current?.organisation ?? null;
}

function scoreGroupOverlap(sharedGroups) {
  return sharedGroups.length * 10;
}

function scoreFollowers(profile) {
  const likes = Number(profile?.likesCount ?? 0);
  const followers = Number(profile?.followersCount ?? 0);
  if (!Number.isFinite(likes) && !Number.isFinite(followers)) {
    return 0;
  }
  return followers * 2 + likes;
}

function buildConnectionReason(sharedGroups = [], profile = {}) {
  if (sharedGroups.length) {
    if (sharedGroups.length === 1) {
      return `You both participate in ${sharedGroups[0]} — continue the conversation.`;
    }
    const head = sharedGroups.slice(0, 2);
    return `You cross paths in ${head.join(' and ')} — say hello while the thread is active.`;
  }
  if (profile?.followersCount > 0) {
    return `${normaliseInteger(profile.followersCount, { fallback: 0 })} members follow their updates.`;
  }
  return 'Active in the community this week.';
}

function buildGroupReason(group, sharedFocus = []) {
  if (sharedFocus.length) {
    return `Aligns with your focus on ${sharedFocus.slice(0, 2).join(', ')}.`;
  }
  if (group.memberCount > 0) {
    return `${group.memberCount} members exchanging playbooks.`;
  }
  return 'Trending across the community.';
}

function normaliseMomentTitle(post, authorName) {
  const base = `${authorName} posted a ${post.type ?? 'update'}`.trim();
  if (post.title) {
    return post.title;
  }
  if (post.summary) {
    return `${authorName} shared “${post.summary.slice(0, 80)}${post.summary.length > 80 ? '…' : ''}`;
  }
  if (post.content) {
    const content = `${post.content}`.replace(/\s+/g, ' ').slice(0, 80);
    return `${authorName} shared: “${content}${post.content.length > 80 ? '…' : ''}`;
  }
  return base;
}

async function loadViewerContext(viewerId, { transaction } = {}) {
  if (!viewerId) {
    return { profile: null, memberships: [], membershipStatus: new Map(), connections: [], interests: [] };
  }
  const [profileInstance, membershipInstances, connectionInstances] = await Promise.all([
    Profile.findOne({ where: { userId: viewerId }, transaction }),
    GroupMembership.findAll({ where: { userId: viewerId }, include: [{ model: Group, as: 'group' }], transaction }),
    Connection.findAll({
      where: {
        [Op.or]: [
          { requesterId: viewerId },
          { addresseeId: viewerId },
        ],
      },
      transaction,
    }),
  ]);

  const profile = toPlain(profileInstance);
  const { statusByGroup, activeMemberships } = (() => {
    const summary = summariseGroupMemberships(membershipInstances);
    return { statusByGroup: summary.statusByGroup, activeMemberships: summary.activeMemberships };
  })();

  const interests = new Set();
  collectProfileInterests(profile).forEach((token) => interests.add(token));
  collectGroupInterests(activeMemberships).forEach((token) => interests.add(token));

  return {
    profile,
    memberships: activeMemberships.map((membership) => ({
      ...membership,
      group: membership.group ? toPlain(membership.group) : null,
    })),
    membershipStatus: statusByGroup,
    connections: connectionInstances.map((connection) => toPlain(connection)),
    interests: Array.from(interests),
  };
}

function decorateCandidateFromMembership(membership) {
  const group = toPlain(membership.group);
  const member = toPlain(membership.member);
  if (!member) {
    return null;
  }
  const profile = extractProfile(member);
  const sharedGroupName = group?.name ?? null;

  return {
    userId: Number(member.id) || null,
    email: member.email ?? null,
    name: normaliseUserName(member),
    headline: profile.headline ?? profile.bio ?? 'Active community member',
    location: computeLocation(profile) ?? group?.metadata?.location ?? null,
    company: computeCompany(profile),
    sharedGroups: sharedGroupName ? [sharedGroupName] : [],
    profile,
  };
}

async function loadGroupBasedCandidates({ viewerId, groupIds, exclusion, limit, transaction }) {
  if (!groupIds.length) {
    return [];
  }
  const memberships = await GroupMembership.findAll({
    where: {
      groupId: { [Op.in]: groupIds },
      status: ACTIVE_GROUP_STATUS,
      userId: { [Op.notIn]: Array.from(exclusion) },
    },
    include: [
      { model: Group, as: 'group' },
      {
        model: User,
        as: 'member',
        include: [{ model: Profile }],
      },
    ],
    transaction,
    limit: limit * 8,
  });

  const aggregated = new Map();
  memberships.forEach((membership) => {
    const candidate = decorateCandidateFromMembership(membership);
    if (!candidate || !candidate.userId) {
      return;
    }
    const existing = aggregated.get(candidate.userId);
    if (!existing) {
      aggregated.set(candidate.userId, candidate);
      return;
    }
    existing.sharedGroups = Array.from(new Set([...existing.sharedGroups, ...candidate.sharedGroups]));
    existing.location = existing.location ?? candidate.location;
    existing.company = existing.company ?? candidate.company;
  });

  return Array.from(aggregated.values());
}

async function loadTrendingCandidates({ exclusion, limit, transaction }) {
  const trendingUsers = await User.findAll({
    where: { id: { [Op.notIn]: Array.from(exclusion) } },
    include: [{ model: Profile }],
    order: [[Profile, 'followersCount', 'DESC NULLS LAST'], [Profile, 'likesCount', 'DESC NULLS LAST']],
    limit: limit * 4,
    transaction,
  });

  return trendingUsers
    .map((user) => {
      const profile = extractProfile(user);
      return {
        userId: Number(user.id) || null,
        email: user.email ?? null,
        name: normaliseUserName(user),
        headline: profile.headline ?? profile.bio ?? 'Active community member',
        location: computeLocation(profile),
        company: computeCompany(profile),
        sharedGroups: [],
        profile,
      };
    })
    .filter((candidate) => candidate.userId);
}

function mergeAndScoreCandidates({ candidates, connectionStatuses, interestSet, limit }) {
  const seen = new Set();
  const suggestions = [];

  candidates.forEach((candidate) => {
    if (!candidate.userId || seen.has(candidate.userId)) {
      return;
    }
    const status = connectionStatuses.statusMap.get(candidate.userId) ?? 'available';
    const sharedFocus = candidate.sharedGroups
      .map((groupName) => groupName.toLowerCase())
      .filter((groupName) => interestSet.has(groupName));
    const profileScore = scoreFollowers(candidate.profile);
    const overlapScore = scoreGroupOverlap(candidate.sharedGroups);
    const focusScore = sharedFocus.length * 4;
    const score = profileScore + overlapScore + focusScore;

    suggestions.push({
      id: `user:${candidate.userId}`,
      userId: candidate.userId,
      name: candidate.name,
      headline: candidate.headline,
      location: candidate.location ?? 'Across the network',
      mutualConnections: Math.max(candidate.sharedGroups.length, sharedFocus.length),
      sharedGroups: candidate.sharedGroups,
      connectionUserId: candidate.userId,
      connectionEmail: candidate.email,
      connectionHeadline: candidate.headline,
      connectionCompany: candidate.company,
      status: status === 'accepted' ? 'connected' : status === 'pending' ? 'pending' : 'available',
      reason: buildConnectionReason(candidate.sharedGroups, candidate.profile),
      score,
    });
    seen.add(candidate.userId);
  });

  return suggestions
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit)
    .map(({ score, ...rest }) => rest);
}

async function buildConnectionSuggestions({ viewerId, memberships, connections, interests, limit, transaction }) {
  const { statusMap, exclusion } = buildConnectionStatusMap(viewerId, connections);
  const groupIds = Array.from(new Set(memberships.map((membership) => Number(membership.groupId)).filter(Boolean)));

  const [groupBased, trending] = await Promise.all([
    loadGroupBasedCandidates({ viewerId, groupIds, exclusion, limit, transaction }),
    loadTrendingCandidates({ exclusion, limit, transaction }),
  ]);

  const combined = [...groupBased, ...trending];
  const interestSet = new Set(interests.map((interest) => `${interest}`.toLowerCase()));
  return mergeAndScoreCandidates({
    candidates: combined,
    connectionStatuses: { statusMap, exclusion },
    interestSet,
    limit,
  });
}

function deriveGroupFocus(group) {
  const metadata = group.metadata ?? {};
  const focusTokens = extractTokens(metadata.focus ?? metadata.topics ?? metadata.themes);
  const focus = focusTokens.slice(0, 4);
  return focus.length ? focus : null;
}

async function buildGroupSuggestions({
  viewerMembershipStatus,
  interests,
  limit,
  transaction,
}) {
  const activeGroupIds = Array.from(viewerMembershipStatus.entries())
    .filter(([, status]) => status === ACTIVE_GROUP_STATUS)
    .map(([groupId]) => Number(groupId));

  const groups = await Group.findAll({
    where: activeGroupIds.length
      ? {
          id: {
            [Op.notIn]: activeGroupIds,
          },
        }
      : undefined,
    attributes: [
      'id',
      'name',
      'description',
      'memberPolicy',
      'visibility',
      'metadata',
      [fn('COUNT', col('memberships.id')), 'memberCount'],
    ],
    include: [
      {
        model: GroupMembership,
        as: 'memberships',
        attributes: [],
        where: { status: ACTIVE_GROUP_STATUS },
        required: false,
      },
    ],
    order: [[literal('memberCount'), 'DESC'], ['createdAt', 'DESC']],
    limit: Math.max(limit, 3),
    subQuery: false,
    transaction,
    group: ['Group.id'],
  });

  const interestSet = new Set(interests.map((interest) => `${interest}`.toLowerCase()));

  return groups.map((groupInstance) => {
    const group = toPlain(groupInstance);
    const focus = deriveGroupFocus(group) ?? [];
    const sharedFocus = focus.filter((topic) => interestSet.has(`${topic}`.toLowerCase()));
    const status = viewerMembershipStatus.get(Number(group.id)) ?? 'available';
    const memberCount = Number(group.memberCount ?? groupInstance.get?.('memberCount')) || 0;
    return {
      id: `group:${group.id}`,
      groupId: Number(group.id),
      name: group.name,
      summary: group.description,
      focus,
      location: group.metadata?.location ?? 'Distributed',
      memberCount,
      status,
      joinRequiresApproval: group.memberPolicy && group.memberPolicy !== 'open',
      reason: buildGroupReason({ memberCount }, sharedFocus),
    };
  });
}

function buildMomentFromPost(post) {
  const plain = toPlain(post);
  const user = plain.User ?? plain.user ?? null;
  const authorName = normaliseUserName(user);
  const typeKey = `${plain.type ?? 'update'}`.toLowerCase();
  const meta = POST_TYPE_META[typeKey] ?? POST_TYPE_META.update;
  const timestamp = plain.publishedAt ?? plain.createdAt ?? new Date();
  return {
    id: `post:${plain.id}`,
    postId: plain.id,
    title: normaliseMomentTitle(plain, authorName),
    tag: meta.tag,
    icon: meta.icon,
    timestamp: new Date(timestamp).toISOString(),
    type: typeKey,
  };
}

async function buildLiveMoments({ limit, transaction }) {
  const posts = await FeedPost.findAll({
    include: [
      {
        model: User,
        include: [Profile],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: Math.max(limit, 5),
    transaction,
  });

  return posts.map((post) => buildMomentFromPost(post));
}

function compileInterests({ profile, memberships, existingInterests, liveMoments }) {
  const interestTokens = new Set(existingInterests.map((interest) => `${interest}`.toLowerCase()));

  collectProfileInterests(profile).forEach((token) => interestTokens.add(token));
  collectGroupInterests(memberships).forEach((token) => interestTokens.add(token));
  liveMoments
    .map((moment) => moment.type)
    .filter(Boolean)
    .forEach((token) => interestTokens.add(`${token}`.toLowerCase()));

  return Array.from(interestTokens).slice(0, 12);
}

export async function getFeedInsights({ viewerId, limit = DEFAULT_LIMIT, transaction } = {}) {
  const resolvedLimit = normaliseInteger(limit, { fallback: DEFAULT_LIMIT, min: 1, max: MAX_LIMIT });
  const context = await loadViewerContext(viewerId ?? null, { transaction });

  const [connectionSuggestions, groupSuggestions, liveMoments] = await Promise.all([
    buildConnectionSuggestions({
      viewerId: viewerId ?? null,
      memberships: context.memberships,
      connections: context.connections,
      interests: context.interests,
      limit: resolvedLimit,
      transaction,
    }),
    buildGroupSuggestions({
      viewerMembershipStatus: context.membershipStatus,
      interests: context.interests,
      limit: Math.max(3, Math.floor(resolvedLimit / 2)),
      transaction,
    }),
    buildLiveMoments({
      limit: Math.max(4, Math.round(resolvedLimit * MOMENT_LIMIT_MULTIPLIER)),
      transaction,
    }),
  ]);

  const interests = compileInterests({
    profile: context.profile,
    memberships: context.memberships,
    existingInterests: context.interests,
    liveMoments,
  });

  return {
    generatedAt: new Date().toISOString(),
    interests,
    connectionSuggestions,
    groupSuggestions,
    liveMoments,
  };
}

export default {
  getFeedInsights,
};
