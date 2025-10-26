import { Op, fn, col } from 'sequelize';
import {
  Group,
  GroupMembership,
  GroupInvite,
  GroupPost,
  GroupEvent,
  GroupResource,
  GroupGuideline,
  GroupTimelineEvent,
  User,
  sequelize,
  GROUP_VISIBILITIES,
  GROUP_MEMBER_POLICIES,
  GROUP_MEMBERSHIP_STATUSES,
  GROUP_MEMBERSHIP_ROLES,
  COMMUNITY_INVITE_STATUSES,
  GROUP_POST_STATUSES,
  GROUP_POST_VISIBILITIES,
} from '../models/index.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '../utils/errors.js';

const DEFAULT_ALLOWED_USER_TYPES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'];
const DEFAULT_JOIN_POLICY = 'moderated';
const DEFAULT_INVITE_EXPIRY_DAYS = 14;
const ALLOWED_INVITE_STATUSES = new Set(COMMUNITY_INVITE_STATUSES);
const ALLOWED_GROUP_POST_STATUSES = new Set(GROUP_POST_STATUSES);
const ALLOWED_GROUP_POST_VISIBILITIES = new Set(GROUP_POST_VISIBILITIES);

function slugify(value, fallback = 'group') {
  if (!value) {
    return fallback;
  }

  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-')
    .slice(0, 80) || fallback;
}

function unique(array = []) {
  return Array.from(new Set(array.filter(Boolean)));
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = `${value}`.toLowerCase();
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) {
    return false;
  }
  return fallback;
}

const DEFAULT_NOTIFICATION_PREFERENCES = { digest: true, newThread: true, upcomingEvent: true };
const MODERATOR_ROLES = new Set(['owner', 'chair', 'moderator']);

async function assertActor(actorId) {
  const id = toNumber(actorId, null);
  if (!id) {
    throw new AuthorizationError('Authentication is required to access community groups.');
  }

  const user = await User.findByPk(id, {
    attributes: ['id', 'userType', 'firstName', 'lastName', 'email'],
  });

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  if (!DEFAULT_ALLOWED_USER_TYPES.includes(user.userType)) {
    throw new AuthorizationError('Your account type does not have access to community groups.');
  }

  return user;
}

function subDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function normaliseNotifications(preferences) {
  const source = preferences && typeof preferences === 'object' ? preferences : {};
  return {
    digest: asBoolean(source.digest, true),
    newThread: asBoolean(source.newThread, true),
    upcomingEvent: asBoolean(source.upcomingEvent, true),
  };
}

async function loadGroupByIdentifier(groupIdOrSlug) {
  const numericId = toNumber(groupIdOrSlug, null);
  if (numericId) {
    const byId = await Group.findByPk(numericId);
    if (byId) {
      return byId;
    }
  }
  if (groupIdOrSlug == null) {
    return null;
  }
  const trimmed = `${groupIdOrSlug}`.trim();
  if (!trimmed) {
    return null;
  }
  const slugCandidate = slugify(trimmed);
  if (slugCandidate) {
    const bySlug = await Group.findOne({ where: { slug: slugCandidate } });
    if (bySlug) {
      return bySlug;
    }
  }
  return Group.findOne({
    where: { name: { [Op.iLike ?? Op.like]: trimmed.replace(/-/g, ' ') } },
  });
}

async function fetchMembershipForActor(groupId, actorId) {
  if (!actorId) {
    return null;
  }
  return GroupMembership.findOne({
    where: { groupId, userId: actorId },
  });
}

async function fetchMembershipMetrics(groupId) {
  const [statusCounts, roleCounts, joinedInLast30Days] = await Promise.all([
    GroupMembership.findAll({
      where: { groupId },
      attributes: ['status', [fn('COUNT', col('*')), 'count']],
      group: ['status'],
    }),
    GroupMembership.findAll({
      where: { groupId, status: 'active' },
      attributes: ['role', [fn('COUNT', col('*')), 'count']],
      group: ['role'],
    }),
    GroupMembership.count({
      where: {
        groupId,
        status: 'active',
        joinedAt: { [Op.gte]: subDays(new Date(), 30) },
      },
    }),
  ]);

  const totals = { total: 0, active: 0, pending: 0, invited: 0, suspended: 0 };
  statusCounts.forEach((row) => {
    const status = row.get('status');
    const count = Number(row.get('count')) || 0;
    totals.total += count;
    if (status === 'active') {
      totals.active += count;
    } else if (status === 'pending') {
      totals.pending += count;
    } else if (status === 'invited') {
      totals.invited += count;
    } else if (status === 'suspended') {
      totals.suspended += count;
    }
  });

  const retentionRate = totals.total ? Number((totals.active / totals.total).toFixed(2)) : 0;
  const breakdownByRole = roleCounts.map((row) => ({
    role: row.get('role'),
    count: Number(row.get('count')) || 0,
  }));

  return {
    totals,
    retentionRate,
    joinedInLast30Days: Number(joinedInLast30Days) || 0,
    breakdownByRole,
  };
}

function buildMembershipState({ membership, joinPolicy }) {
  if (!membership) {
    return {
      status: joinPolicy === 'invite_only' ? 'request_required' : 'not_member',
      role: null,
      joinedAt: null,
      preferences: { notifications: { ...DEFAULT_NOTIFICATION_PREFERENCES } },
    };
  }
  const plain = membership.get ? membership.get({ plain: true }) : membership;
  const preferenceSource =
    (plain.preferences && typeof plain.preferences === 'object' && plain.preferences.notifications) ??
    plain.preferences ??
    plain.metadata?.notifications ??
    {};
  const notifications = normaliseNotifications(preferenceSource);
  const status = plain.status === 'active' ? 'member' : plain.status ?? 'pending';
  return {
    status,
    role: plain.role,
    joinedAt: plain.joinedAt ? new Date(plain.joinedAt).toISOString() : null,
    preferences: { notifications },
  };
}

function mapMembershipMember(membership) {
  const plain = membership.get ? membership.get({ plain: true }) : membership;
  const member = plain.member ?? plain.Member;
  const name = member ? [member.firstName, member.lastName].filter(Boolean).join(' ') : plain.metadata?.name ?? null;
  const title = plain.metadata?.title ?? member?.headline ?? member?.title ?? null;
  return {
    id: member?.id ?? plain.userId,
    name: name || `Member ${plain.userId}`,
    title,
    role: plain.role,
    focus: plain.metadata?.focus ?? null,
    avatarUrl: plain.metadata?.avatarUrl ?? null,
  };
}

async function buildLeadershipProfiles(groupId) {
  const memberships = await GroupMembership.findAll({
    where: { groupId, status: 'active' },
    include: [
      {
        model: User,
        as: 'member',
        attributes: ['id', 'firstName', 'lastName', 'headline', 'title'],
      },
    ],
    order: [
      [sequelize.literal(`CASE WHEN "GroupMembership"."role" IN ('owner','chair','moderator') THEN 0 ELSE 1 END`), 'ASC'],
      ['role', 'ASC'],
      ['joinedAt', 'DESC'],
      ['id', 'ASC'],
    ],
  });

  const profiles = memberships.map((membership) => mapMembershipMember(membership));
  const leadership = profiles.filter((profile) => MODERATOR_ROLES.has(profile.role));
  const spotlight = profiles.slice(0, 12);

  return { leadership, spotlight };
}

async function buildUpcomingEvents(groupId) {
  const now = new Date();
  const recentCutoff = subDays(now, 1);
  const events = await GroupEvent.findAll({
    where: {
      groupId,
      status: 'scheduled',
    },
    order: [['startAt', 'ASC']],
    limit: 6,
  });

  return events
    .map((event) => {
      const plain = event.get ? event.get({ plain: true }) : event;
      return {
        id: plain.id,
        title: plain.title,
        description: plain.description ?? null,
        startAt: plain.startAt ? new Date(plain.startAt).toISOString() : null,
        endAt: plain.endAt ? new Date(plain.endAt).toISOString() : null,
        timezone: plain.timezone ?? null,
        format: plain.format ?? null,
        host: plain.hostName ? { name: plain.hostName, title: plain.hostTitle ?? null } : null,
        url: plain.registrationUrl ?? null,
        isVirtual: plain.isVirtual ?? true,
        status: plain.status,
      };
    })
    .filter((event) => {
      if (!event.startAt) {
        return true;
      }
      return new Date(event.startAt) >= recentCutoff;
    });
}

async function buildGroupGuidelines(groupId) {
  const rows = await GroupGuideline.findAll({
    where: { groupId },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  return rows.map((row) => {
    const plain = row.get ? row.get({ plain: true }) : row;
    return plain.content;
  });
}

async function buildGroupTimeline(groupId) {
  const rows = await GroupTimelineEvent.findAll({
    where: { groupId },
    order: [
      ['occursAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: 12,
  });
  return rows.map((row) => {
    const plain = row.get ? row.get({ plain: true }) : row;
    return {
      label: plain.title,
      description: plain.description ?? null,
      occursAt: plain.occursAt ? new Date(plain.occursAt).toISOString() : null,
      category: plain.category ?? null,
    };
  });
}

function mapResourceRecord(resource) {
  const plain = resource.get ? resource.get({ plain: true }) : resource;
  const tags = Array.isArray(plain.tags) ? plain.tags.filter(Boolean) : [];
  return {
    id: plain.id,
    title: plain.title,
    description: plain.summary ?? null,
    summary: plain.summary ?? null,
    url: plain.url,
    type: plain.type,
    category: plain.category ?? null,
    collection: plain.collection ?? null,
    author: plain.author ?? null,
    format: plain.format ?? null,
    difficulty: plain.difficulty ?? null,
    duration: plain.duration ?? null,
    previewImageUrl: plain.previewImageUrl ?? null,
    isFeatured: Boolean(plain.isFeatured),
    tags,
    metadata: plain.metadata ?? {},
    publishedAt: plain.publishedAt ? new Date(plain.publishedAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function summariseCollections(items) {
  const collectionMap = new Map();
  items.forEach((item) => {
    if (!item.collection) {
      return;
    }
    const entry = collectionMap.get(item.collection) ?? { name: item.collection, count: 0 };
    entry.count += 1;
    collectionMap.set(item.collection, entry);
  });
  return Array.from(collectionMap.values()).sort((a, b) => b.count - a.count);
}

function computeResourceAnalytics(records) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let downloads = 0;
  let newThisMonth = 0;

  records.forEach((record) => {
    const plain = record.get ? record.get({ plain: true }) : record;
    downloads += Number(plain.downloadCount ?? 0);
    if (plain.publishedAt) {
      const publishedAt = new Date(plain.publishedAt);
      if (!Number.isNaN(publishedAt.getTime()) && publishedAt >= startOfMonth) {
        newThisMonth += 1;
      }
    }
  });

  return { downloads, newThisMonth };
}

async function buildResourceLibrary(groupId) {
  const resources = await GroupResource.findAll({
    where: { groupId, status: 'published' },
    order: [
      ['isFeatured', 'DESC'],
      ['publishedAt', 'DESC'],
      ['title', 'ASC'],
    ],
  });

  const items = resources.map(mapResourceRecord);
  const featured = items.filter((item) => item.isFeatured).slice(0, 6);
  const categories = unique(items.map((item) => item.category || item.type)).filter(Boolean);
  const collections = summariseCollections(items);
  const analytics = computeResourceAnalytics(resources);

  return {
    items,
    categories,
    collections,
    featured,
    analytics: {
      downloads: analytics.downloads,
      newThisMonth: analytics.newThisMonth,
    },
  };
}

function mapThreadRecord(post) {
  const plain = post.get ? post.get({ plain: true }) : post;
  const author = plain.createdBy ?? plain.CreatedBy;
  const metadata = plain.metadata ?? {};
  const tags = Array.isArray(plain.topicTags) ? plain.topicTags.filter(Boolean) : [];
  const reactionSummary = plain.reactionSummary ?? metadata.reactionSummary ?? {};
  const totalReactions = Number(reactionSummary.total ?? reactionSummary.totalReactions ?? 0);
  const replyCount = Number(plain.replyCount ?? metadata.replyCount ?? 0);
  const lastActivitySource = plain.lastActivityAt || plain.updatedAt || plain.publishedAt || plain.createdAt;

  return {
    id: plain.id,
    title: plain.title,
    summary: plain.summary ?? metadata.summary ?? null,
    slug: plain.slug,
    author: author
      ? {
          id: author.id ?? plain.createdById ?? null,
          name: [author.firstName, author.lastName].filter(Boolean).join(' ') || metadata.authorName || null,
        }
      : null,
    authorId: author?.id ?? plain.createdById ?? null,
    replyCount,
    tags,
    topics: tags,
    pinnedAt: plain.pinnedAt ? new Date(plain.pinnedAt).toISOString() : null,
    lastActivityAt: lastActivitySource ? new Date(lastActivitySource).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    unresolved: plain.resolutionState ? plain.resolutionState !== 'resolved' : metadata.resolved === false,
    unread: metadata.unread ?? plain.resolutionState === 'open',
    metrics: {
      replies: replyCount,
      reactions: totalReactions,
    },
  };
}

async function buildDiscussionBoard(groupId) {
  const posts = await GroupPost.findAll({
    where: { groupId, status: 'published' },
    include: [
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'headline', 'title'],
      },
    ],
    order: [
      [sequelize.literal('CASE WHEN "GroupPost"."pinnedAt" IS NULL THEN 1 ELSE 0 END'), 'ASC'],
      ['pinnedAt', 'DESC'],
      ['lastActivityAt', 'DESC'],
      ['publishedAt', 'DESC'],
    ],
    limit: 80,
  });

  const threads = posts.map(mapThreadRecord);
  const sortedThreads = [...threads].sort((a, b) => {
    const aDate = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
    const bDate = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
    return bDate - aDate;
  });
  const pinned = sortedThreads.filter((thread) => Boolean(thread.pinnedAt)).slice(0, 5);

  const tagSet = new Set();
  sortedThreads.forEach((thread) => (thread.tags || []).forEach((tag) => tag && tagSet.add(tag)));

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = subDays(now, 7);

  const activeToday = sortedThreads.filter(
    (thread) => thread.lastActivityAt && new Date(thread.lastActivityAt) >= startOfToday,
  ).length;
  const unresolved = sortedThreads.filter((thread) => thread.unresolved).length;
  const contributors = new Set(
    sortedThreads
      .filter((thread) => thread.authorId && thread.lastActivityAt && new Date(thread.lastActivityAt) >= sevenDaysAgo)
      .map((thread) => thread.authorId),
  );

  const trending = sortedThreads
    .filter((thread) => thread.lastActivityAt && new Date(thread.lastActivityAt) >= sevenDaysAgo)
    .sort((a, b) => {
      const aScore = (a.replyCount ?? 0) + (a.metrics?.reactions ?? 0);
      const bScore = (b.replyCount ?? 0) + (b.metrics?.reactions ?? 0);
      return bScore - aScore;
    })
    .slice(0, 6);

  const moderatorMemberships = await GroupMembership.findAll({
    where: { groupId, status: 'active', role: { [Op.in]: Array.from(MODERATOR_ROLES) } },
    include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'headline', 'title'] }],
    order: [['role', 'ASC'], ['joinedAt', 'ASC']],
    limit: 12,
  });
  const moderators = moderatorMemberships.map((membership) => mapMembershipMember(membership));

  return {
    pinned,
    threads: sortedThreads,
    trending,
    moderators,
    tags: Array.from(tagSet).slice(0, 20),
    stats: {
      activeToday,
      unresolved,
      contributorsThisWeek: contributors.size,
    },
  };
}

function deriveSignalStrength({ boardStats, membershipTotals }) {
  const activeMembers = membershipTotals?.active ?? 0;
  if (!activeMembers) {
    return boardStats?.activeToday ? 'growing' : 'emerging';
  }
  const activityRatio = (boardStats?.activeToday ?? 0) / activeMembers;
  const contributorRatio = (boardStats?.contributorsThisWeek ?? 0) / activeMembers;
  if (activityRatio >= 0.3 || contributorRatio >= 0.4) {
    return 'surging';
  }
  if (activityRatio >= 0.15 || contributorRatio >= 0.25) {
    return 'growing';
  }
  if (activityRatio >= 0.05) {
    return 'steady';
  }
  return 'emerging';
}

function buildGroupInsights({ board, resourceLibrary, membershipMetrics }) {
  const trendingMap = new Map();
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  (board?.threads ?? []).forEach((thread) => {
    if (!thread.lastActivityAt) {
      return;
    }
    const activityDate = new Date(thread.lastActivityAt);
    if (Number.isNaN(activityDate.getTime()) || activityDate < thirtyDaysAgo) {
      return;
    }
    (thread.tags ?? thread.topics ?? []).forEach((tag) => {
      if (!tag) {
        return;
      }
      trendingMap.set(tag, (trendingMap.get(tag) ?? 0) + 1);
    });
  });

  const trendingTopics = Array.from(trendingMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 6);

  return {
    signalStrength: deriveSignalStrength({ boardStats: board?.stats ?? {}, membershipTotals: membershipMetrics?.totals ?? {} }),
    trendingTopics,
    board: board?.stats ?? {},
    resources: resourceLibrary?.analytics ?? {},
  };
}

function computeEngagementScore({ memberCount, boardStats }) {
  if (!memberCount) {
    return Number((boardStats?.activeToday ? 0.5 : 0.2).toFixed(2));
  }
  const contributorRatio = (boardStats?.contributorsThisWeek ?? 0) / memberCount;
  const activityRatio = (boardStats?.activeToday ?? 0) / memberCount;
  const base = Math.max(0.15, contributorRatio * 0.7 + activityRatio * 0.3);
  return Number(Math.min(1, base).toFixed(2));
}

function computeGroupStats({ membershipMetrics, board, resourceLibrary }) {
  const memberCount = membershipMetrics?.totals?.active ?? 0;
  const weeklyActiveMembers = board?.stats?.contributorsThisWeek ?? 0;
  const opportunitiesSharedThisWeek = (resourceLibrary?.items ?? []).filter((item) => {
    if (!item.publishedAt) {
      return false;
    }
    const publishedAt = new Date(item.publishedAt);
    return !Number.isNaN(publishedAt.getTime()) && publishedAt >= subDays(new Date(), 7);
  }).length;

  return {
    memberCount,
    weeklyActiveMembers,
    opportunitiesSharedThisWeek,
    retentionRate: membershipMetrics?.retentionRate ?? 0,
    engagementScore: computeEngagementScore({ memberCount, boardStats: board?.stats ?? {} }),
  };
}

function normalizeAllowedUserTypes(group) {
  const settings = group.settings ?? {};
  const metadata = group.metadata ?? {};
  const configured = settings.allowedUserTypes ?? metadata.allowedUserTypes;
  if (Array.isArray(configured) && configured.length) {
    return unique(
      configured
        .map((value) => `${value}`.trim().toLowerCase())
        .filter((value) => value && value.length > 0),
    );
  }
  return [...DEFAULT_ALLOWED_USER_TYPES];
}

function mapGroupRecord(group, context) {
  const plain = group.get ? group.get({ plain: true }) : group;
  const settings = plain.settings ?? {};
  const metadata = plain.metadata ?? {};

  const joinPolicy = plain.memberPolicy ?? settings.joinPolicy ?? metadata.joinPolicy ?? DEFAULT_JOIN_POLICY;
  const allowedUserTypes = normalizeAllowedUserTypes(plain);
  const focusAreas = unique([...(metadata.focusAreas ?? []), ...(settings.focusAreas ?? [])]);
  const accentColor = metadata.accentColor ?? settings.accentColor ?? plain.avatarColor ?? '#2563EB';
  const summary = metadata.summary ?? plain.description ?? 'A Gigvora community group.';
  const stats = computeGroupStats({
    membershipMetrics: context.membershipMetrics,
    board: context.board,
    resourceLibrary: context.resourceLibrary,
  });

  const derivedValueProps = [
    context.board?.stats?.activeToday ? `${context.board.stats.activeToday} conversations active today` : null,
    context.board?.stats?.unresolved ? `${context.board.stats.unresolved} open questions awaiting replies` : null,
    context.resourceLibrary?.analytics?.downloads
      ? `${context.resourceLibrary.analytics.downloads} resource downloads this quarter`
      : null,
    context.events?.[0]?.title ? `Next session: ${context.events[0].title}` : null,
  ].filter(Boolean);

  const valuePropositions = unique([...(metadata.valuePropositions ?? []), ...derivedValueProps]).slice(0, 6);

  return {
    id: plain.id,
    slug: plain.slug ?? slugify(plain.name || `group-${plain.id}`),
    name: plain.name,
    summary,
    description: plain.description ?? summary,
    accentColor,
    focusAreas,
    joinPolicy,
    allowedUserTypes,
    membership: buildMembershipState({ membership: context.membership, joinPolicy }),
    stats,
    insights: context.insights ?? { board: {}, resources: {}, signalStrength: 'emerging', trendingTopics: [] },
    upcomingEvents: context.events ?? [],
    leadership: context.leadership ?? [],
    resources: context.resourceLibrary?.items ?? [],
    resourceLibrary: context.resourceLibrary ?? { items: [] },
    guidelines: context.guidelines ?? [],
    timeline: context.timeline ?? [],
    memberSpotlight: context.memberSpotlight ?? [],
    members: { spotlight: context.memberSpotlight ?? [] },
    discussionBoard: context.board ?? { threads: [], stats: {} },
    valuePropositions,
    metadata: {
      baselineMembers: context.membershipMetrics?.totals?.total ?? 0,
      retentionRate: stats.retentionRate,
    },
    access: {
      joinPolicy,
      allowedUserTypes,
      invitationRequired: joinPolicy === 'invite_only',
    },
  };
}

export async function getGroupProfile(groupIdOrSlug, { actorId } = {}) {
  if (!groupIdOrSlug) {
    throw new ValidationError('A group identifier is required.');
  }

  const actor = await assertActor(actorId);
  const group = await loadGroupByIdentifier(groupIdOrSlug);

  if (!group) {
    throw new NotFoundError('Group not found.');
  }

  const [
    membership,
    membershipMetrics,
    leadershipProfiles,
    events,
    guidelines,
    timeline,
    resourceLibrary,
    board,
  ] = await Promise.all([
    fetchMembershipForActor(group.id, actor.id),
    fetchMembershipMetrics(group.id),
    buildLeadershipProfiles(group.id),
    buildUpcomingEvents(group.id),
    buildGroupGuidelines(group.id),
    buildGroupTimeline(group.id),
    buildResourceLibrary(group.id),
    buildDiscussionBoard(group.id),
  ]);

  const insights = buildGroupInsights({
    board,
    resourceLibrary,
    membershipMetrics,
  });

  const record = mapGroupRecord(group, {
    membership,
    membershipMetrics,
    leadership: leadershipProfiles.leadership,
    memberSpotlight: leadershipProfiles.spotlight,
    events,
    guidelines,
    timeline,
    resourceLibrary,
    board,
    insights,
  });

  record.membershipBreakdown = membershipMetrics.breakdownByRole ?? [];

  const allowed = new Set((record.allowedUserTypes || []).map((value) => value.toLowerCase()));
  if (allowed.size && !allowed.has(actor.userType.toLowerCase())) {
    throw new AuthorizationError('Your role does not have access to this group.');
  }

  return record;
}

export async function joinGroup(groupIdOrSlug, { actorId, role = 'member' } = {}) {
  const user = await assertActor(actorId);
  const profile = await getGroupProfile(groupIdOrSlug, { actorId: user.id });

  if (profile.joinPolicy === 'invite_only') {
    throw new AuthorizationError('This group requires an invite from the leadership team.');
  }

  if (profile.allowedUserTypes && profile.allowedUserTypes.length > 0) {
    const allowed = new Set(profile.allowedUserTypes.map((value) => value.toLowerCase()));
    if (!allowed.has(user.userType.toLowerCase())) {
      throw new AuthorizationError('Your current role does not meet the access policy for this group.');
    }
  }

  if (profile.membership?.status === 'member') {
    throw new ConflictError('You are already a member of this group.');
  }

  const group = await Group.findByPk(profile.id);
  if (!group) {
    throw new NotFoundError('Group not found.');
  }

  await GroupMembership.findOrCreate({
    where: { groupId: group.id, userId: user.id },
    defaults: { role },
  });

  return getGroupProfile(profile.slug, { actorId: user.id });
}

export async function leaveGroup(groupIdOrSlug, { actorId } = {}) {
  const user = await assertActor(actorId);
  const profile = await getGroupProfile(groupIdOrSlug, { actorId: user.id });

  if (profile.membership?.status !== 'member') {
    throw new ConflictError('You are not currently a member of this group.');
  }

  const protectedRoles = new Set(['chair', 'owner', 'host']);
  if (profile.membership?.role && protectedRoles.has(profile.membership.role)) {
    throw new AuthorizationError('Community leads must assign a successor before leaving.');
  }

  await GroupMembership.destroy({ where: { groupId: profile.id, userId: user.id } });

  return getGroupProfile(profile.slug, { actorId: user.id });
}

export async function updateMembershipSettings(groupIdOrSlug, { actorId, role, notifications } = {}) {
  const user = await assertActor(actorId);
  const profile = await getGroupProfile(groupIdOrSlug, { actorId: user.id });

  const membership = await GroupMembership.findOne({
    where: { groupId: profile.id, userId: user.id },
  });

  if (!membership) {
    throw new ConflictError('You must join the group before updating settings.');
  }

  if (role && role !== membership.role) {
    const allowedRoles = new Set(['member', 'moderator', 'chair', 'owner']);
    if (!allowedRoles.has(role)) {
      throw new ValidationError('Unsupported membership role.');
    }
    if (role === 'owner' && membership.role !== 'owner') {
      throw new AuthorizationError('Only existing owners can promote new owners.');
    }
    membership.role = role;
  }

  if (notifications && typeof notifications === 'object') {
    membership.metadata = {
      ...(membership.metadata || {}),
      notifications: {
        digest: asBoolean(notifications.digest, true),
        newThread: asBoolean(notifications.newThread, true),
        upcomingEvent: asBoolean(notifications.upcomingEvent, true),
      },
    };
  }

  await membership.save();

  return getGroupProfile(profile.slug, { actorId: user.id });
}

const GROUP_MANAGER_ROLES = new Set(['admin', 'agency']);
const GROUP_MANAGER_MEMBERSHIP_ROLES = new Set(['owner', 'moderator']);

function normalizeColour(value) {
  if (!value) {
    return '#2563eb';
  }
  const candidate = value.toString().trim().toLowerCase();
  return /^#([0-9a-f]{6})$/.test(candidate) ? candidate : '#2563eb';
}

function ensureManager(actor) {
  if (!actor || !GROUP_MANAGER_ROLES.has(actor.userType)) {
    throw new AuthorizationError('You do not have permission to manage groups.');
  }
}

async function assertGroupManagerAccess(groupId, actorId, { transaction } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  const actor = await assertActor(actorId);
  const membership = await GroupMembership.findOne({
    where: { groupId, userId: actor.id, status: 'active' },
    transaction,
  });
  if (!membership || !GROUP_MANAGER_MEMBERSHIP_ROLES.has(membership.role)) {
    throw new AuthorizationError('You do not have permission to manage this group.');
  }
  return { actor, membership };
}

function normalizeEnum(value, allowed, label) {
  if (!value) {
    return allowed[0];
  }
  if (!allowed.includes(value)) {
    throw new ValidationError(`Invalid ${label} provided.`);
  }
  return value;
}

function normalizeEmail(value, label = 'email') {
  if (!value) {
    throw new ValidationError(`A valid ${label} is required.`);
  }
  const email = value.toString().trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ValidationError(`The ${label} provided is not a valid email address.`);
  }
  return email;
}

function normaliseInviteStatus(status) {
  if (!status) {
    return 'pending';
  }
  const normalized = status.toString().toLowerCase();
  if (!ALLOWED_INVITE_STATUSES.has(normalized)) {
    throw new ValidationError('Unsupported invite status.');
  }
  return normalized;
}

function normalisePostStatus(status) {
  if (!status) {
    return 'draft';
  }
  const normalized = status.toString().toLowerCase();
  if (!ALLOWED_GROUP_POST_STATUSES.has(normalized)) {
    throw new ValidationError('Unsupported post status.');
  }
  return normalized;
}

function normalisePostVisibility(visibility) {
  if (!visibility) {
    return 'members';
  }
  const normalized = visibility.toString().toLowerCase();
  if (!ALLOWED_GROUP_POST_VISIBILITIES.has(normalized)) {
    throw new ValidationError('Unsupported post visibility option.');
  }
  return normalized;
}

function computeMembershipMetrics(memberships = []) {
  let totalMembers = 0;
  let activeMembers = 0;
  let pendingMembers = 0;
  let invitedMembers = 0;
  let suspendedMembers = 0;
  let lastMemberJoinedAt = null;

  for (const membership of memberships) {
    totalMembers += 1;
    const status = membership.status ?? 'pending';
    if (status === 'active') {
      activeMembers += 1;
      if (membership.joinedAt) {
        const joinedAt = new Date(membership.joinedAt).getTime();
        if (!lastMemberJoinedAt || joinedAt > lastMemberJoinedAt) {
          lastMemberJoinedAt = joinedAt;
        }
      }
    } else if (status === 'pending') {
      pendingMembers += 1;
    } else if (status === 'invited') {
      invitedMembers += 1;
    } else if (status === 'suspended') {
      suspendedMembers += 1;
    }
  }

  return {
    totalMembers,
    activeMembers,
    pendingMembers,
    invitedMembers,
    suspendedMembers,
    acceptanceRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
    lastMemberJoinedAt: lastMemberJoinedAt ? new Date(lastMemberJoinedAt).toISOString() : null,
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  const plain = user.get ? user.get({ plain: true }) : user;
  const fullName = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim();
  return {
    id: plain.id,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    name: fullName || null,
    email: plain.email ?? null,
    userType: plain.userType ?? null,
  };
}

function sanitizeMembership(membership) {
  if (!membership) {
    return null;
  }
  const plain = membership.get ? membership.get({ plain: true }) : membership;
  return {
    id: plain.id,
    userId: plain.userId,
    role: plain.role,
    status: plain.status,
    joinedAt: plain.joinedAt ? new Date(plain.joinedAt).toISOString() : null,
    invitedById: plain.invitedById ?? null,
    notes: plain.notes ?? null,
    member: sanitizeUser(plain.member ?? plain.Member),
    invitedBy: sanitizeUser(plain.invitedBy ?? plain.InvitedBy),
  };
}

function sanitizeInvite(invite) {
  if (!invite) {
    return null;
  }
  const plain = invite.get ? invite.get({ plain: true }) : invite;
  return {
    id: plain.id,
    groupId: plain.groupId,
    email: plain.email,
    role: plain.role,
    status: plain.status,
    token: plain.token,
    message: plain.message ?? null,
    expiresAt: plain.expiresAt ? new Date(plain.expiresAt).toISOString() : null,
    invitedById: plain.invitedById ?? null,
    invitedBy: sanitizeUser(plain.invitedBy ?? plain.InvitedBy),
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function sanitizeGroupPost(post) {
  if (!post) {
    return null;
  }
  const plain = post.get ? post.get({ plain: true }) : post;
  return {
    id: plain.id,
    groupId: plain.groupId,
    title: plain.title,
    slug: plain.slug,
    summary: plain.summary ?? null,
    content: plain.content ?? '',
    status: plain.status,
    visibility: plain.visibility,
    attachments: plain.attachments ?? [],
    scheduledAt: plain.scheduledAt ? new Date(plain.scheduledAt).toISOString() : null,
    publishedAt: plain.publishedAt ? new Date(plain.publishedAt).toISOString() : null,
    createdById: plain.createdById ?? null,
    updatedById: plain.updatedById ?? null,
    createdBy: sanitizeUser(plain.createdBy ?? plain.CreatedBy),
    updatedBy: sanitizeUser(plain.updatedBy ?? plain.UpdatedBy),
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function sanitizeGroup(group, { includeMembers = false } = {}) {
  if (!group) {
    return null;
  }
  const plain = group.get ? group.get({ plain: true }) : group;
  const memberships = Array.isArray(plain.memberships ?? plain.GroupMemberships)
    ? plain.memberships ?? plain.GroupMemberships
    : [];
  const metrics = computeMembershipMetrics(memberships);

  const normalizedMembers = includeMembers
    ? memberships.map((membership) => sanitizeMembership(membership))
    : undefined;

  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description ?? null,
    visibility: plain.visibility ?? 'public',
    memberPolicy: plain.memberPolicy ?? 'request',
    avatarColor: plain.avatarColor ?? '#2563eb',
    bannerImageUrl: plain.bannerImageUrl ?? null,
    settings: plain.settings ?? {},
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    createdBy: sanitizeUser(plain.createdBy ?? plain.CreatedBy),
    updatedBy: sanitizeUser(plain.updatedBy ?? plain.UpdatedBy),
    metrics: {
      totalMembers: metrics.totalMembers,
      activeMembers: metrics.activeMembers,
      pendingMembers: metrics.pendingMembers + metrics.invitedMembers,
      suspendedMembers: metrics.suspendedMembers,
      acceptanceRate: metrics.acceptanceRate,
      lastMemberJoinedAt: metrics.lastMemberJoinedAt,
    },
    members: normalizedMembers,
  };
}

async function resolveUniqueSlug(baseSlug, { transaction, excludeGroupId } = {}) {
  const sanitizedBase = slugify(baseSlug);
  let attempt = 0;
  let candidate = sanitizedBase;
  // allow a generous number of attempts before bailing out
  while (attempt < 25) {
    const where = { slug: candidate };
    if (excludeGroupId) {
      where.id = { [Op.ne]: excludeGroupId };
    }
    const existing = await Group.findOne({ where, transaction });
    if (!existing) {
      return candidate;
    }
    attempt += 1;
    candidate = `${sanitizedBase}-${attempt + 1}`;
  }
  throw new ConflictError('Unable to allocate a unique URL slug for this group. Please try a different name.');
}

async function loadGroup(groupId, { includeMembers = false, transaction } = {}) {
  const include = [
    {
      model: GroupMembership,
      as: 'memberships',
      required: false,
      attributes: ['id', 'userId', 'role', 'status', 'joinedAt', 'invitedById', 'notes'],
      include: includeMembers
        ? [
            { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
            { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          ]
        : [],
    },
    { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
  ];

  const group = await Group.findByPk(groupId, { include, transaction });
  if (!group) {
    throw new NotFoundError('Group not found');
  }
  return group;
}

export async function getGroup(groupId, { includeMembers = false, actor } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  ensureManager(actor);
  const group = await loadGroup(groupId, { includeMembers, transaction: undefined });
  return sanitizeGroup(group, { includeMembers });
}

export async function listGroups({
  page = 1,
  pageSize = 20,
  search,
  visibility,
  includeMembers = false,
  actor,
} = {}) {
  ensureManager(actor);
  const parsedPageSize = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 20));
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (parsedPage - 1) * parsedPageSize;

  const where = {};
  if (visibility && GROUP_VISIBILITIES.includes(visibility)) {
    where.visibility = visibility;
  }

  const trimmedSearch = search?.toString().trim();
  if (trimmedSearch) {
    const like = `%${trimmedSearch}%`;
    where[Op.or] = [
      { name: { [Op.iLike ?? Op.like]: like } },
      { description: { [Op.iLike ?? Op.like]: like } },
      { slug: { [Op.iLike ?? Op.like]: like } },
    ];
  }

  const include = [
    {
      model: GroupMembership,
      as: 'memberships',
      required: false,
      attributes: ['id', 'userId', 'role', 'status', 'joinedAt', 'invitedById', 'notes'],
      include: includeMembers
        ? [
            { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
            { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          ]
        : [],
    },
    { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
  ];

  const result = await Group.findAndCountAll({
    where,
    include,
    distinct: true,
    order: [['name', 'ASC']],
    limit: parsedPageSize,
    offset,
  });

  return {
    data: result.rows.map((group) => sanitizeGroup(group, { includeMembers })),
    pagination: {
      page: parsedPage,
      pageSize: parsedPageSize,
      total: result.count,
      totalPages: Math.ceil(result.count / parsedPageSize) || 0,
    },
  };
}

function normaliseMembershipStatuses(statuses) {
  if (statuses == null) {
    return ['active'];
  }

  const rawArray = Array.isArray(statuses) ? statuses : [statuses];
  const uniqueStatuses = unique(
    rawArray
      .map((status) => status?.toString().trim().toLowerCase())
      .filter((status) => status && status.length > 0),
  );

  if (!uniqueStatuses.length) {
    return null;
  }

  return uniqueStatuses.map((status) => {
    if (!GROUP_MEMBERSHIP_STATUSES.includes(status)) {
      throw new ValidationError(`Unsupported membership status filter: ${status}`);
    }
    return status;
  });
}

function buildMembershipStatusWhere(statuses) {
  if (!statuses || !statuses.length) {
    return undefined;
  }
  if (statuses.length === 1) {
    return statuses[0];
  }
  return { [Op.in]: statuses };
}

export async function listMemberGroups({
  actorId,
  statuses,
  search,
  includeMembers = false,
  page = 1,
  pageSize = 20,
  sort = 'recent',
} = {}) {
  if (!actorId) {
    throw new AuthorizationError('Authentication required to list member groups.');
  }

  const normalisedStatuses = normaliseMembershipStatuses(statuses);
  const parsedPageSize = Math.min(50, Math.max(1, Number.parseInt(pageSize, 10) || 20));
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (parsedPage - 1) * parsedPageSize;
  const trimmedSearch = search?.toString().trim();

  const membershipWhere = { userId: actorId };
  const membershipStatusWhere = buildMembershipStatusWhere(normalisedStatuses);
  if (membershipStatusWhere) {
    membershipWhere.status = membershipStatusWhere;
  }

  const groupWhere = {};
  if (trimmedSearch) {
    const like = `%${trimmedSearch}%`;
    groupWhere[Op.or] = [
      { name: { [Op.iLike ?? Op.like]: like } },
      { description: { [Op.iLike ?? Op.like]: like } },
      { slug: { [Op.iLike ?? Op.like]: like } },
    ];
  }

  const groupMembershipInclude = {
    model: GroupMembership,
    as: 'memberships',
    required: false,
    attributes: ['id', 'userId', 'role', 'status', 'joinedAt', 'invitedById', 'notes'],
    include: includeMembers
      ? [
          { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        ]
      : [],
  };

  const groupInclude = [
    groupMembershipInclude,
    { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
  ];

  const orderClauses = [];
  const normalisedSort = sort?.toString().trim().toLowerCase();
  if (normalisedSort === 'alpha') {
    orderClauses.push([{ model: Group, as: 'group' }, 'name', 'ASC']);
  } else if (normalisedSort === 'activity') {
    orderClauses.push([{ model: Group, as: 'group' }, 'updatedAt', 'DESC']);
  } else {
    orderClauses.push(['joinedAt', 'DESC']);
  }

  const [membershipsResult, statusBreakdown] = await Promise.all([
    GroupMembership.findAndCountAll({
      where: membershipWhere,
      include: [
        { model: Group, as: 'group', required: true, where: groupWhere, include: groupInclude },
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      distinct: true,
      order: orderClauses,
      limit: parsedPageSize,
      offset,
    }),
    GroupMembership.findAll({
      attributes: ['status', [fn('COUNT', col('status')), 'count']],
      where: { userId: actorId },
      group: ['status'],
    }),
  ]);

  const statusTotals = GROUP_MEMBERSHIP_STATUSES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  for (const row of statusBreakdown) {
    const plain = row.get ? row.get({ plain: true }) : row;
    if (plain.status && typeof plain.count !== 'undefined') {
      statusTotals[plain.status] = Number(plain.count) || 0;
    }
  }

  const total = typeof membershipsResult.count === 'number' ? membershipsResult.count : membershipsResult.count.length;
  const totalPages = Math.max(1, Math.ceil(total / parsedPageSize));

  const data = membershipsResult.rows.map((membership) => ({
    membership: sanitizeMembership(membership),
    group: sanitizeGroup(membership.group, { includeMembers }),
    joinedAt: membership.joinedAt ? new Date(membership.joinedAt).toISOString() : null,
    lastActivityAt: membership.group?.updatedAt ? new Date(membership.group.updatedAt).toISOString() : null,
  }));

  return {
    data,
    meta: {
      total,
      page: parsedPage,
      pageSize: parsedPageSize,
      totalPages,
      sort: normalisedSort === 'alpha' || normalisedSort === 'activity' ? normalisedSort : 'recent',
    },
    filters: {
      statuses: normalisedStatuses ?? null,
      search: trimmedSearch || null,
    },
    breakdown: {
      statuses: statusTotals,
    },
  };
}

export async function discoverGroups({ limit = 12, search, actorId } = {}) {
  const parsedLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 12));
  const baseWhere = {
    visibility: { [Op.in]: ['public', 'private', 'secret'] },
  };

  const include = [
    {
      model: GroupMembership,
      as: 'memberships',
      required: false,
      attributes: ['id', 'userId', 'role', 'status', 'joinedAt'],
    },
  ];

  const groups = await Group.findAll({
    where: baseWhere,
    include,
    distinct: true,
    order: [['name', 'ASC']],
    limit: parsedLimit * 2,
  });

  const trimmedSearch = search?.toString().trim().toLowerCase();

  const filtered = groups
    .filter((group) => {
      const plain = group.get({ plain: true });
      if (plain.visibility === 'public') {
        return true;
      }
      if (!actorId) {
        return false;
      }
      return (plain.memberships ?? plain.GroupMemberships ?? []).some((membership) => membership.userId === actorId);
    })
    .filter((group) => {
      if (!trimmedSearch) {
        return true;
      }
      const plain = group.get({ plain: true });
      const haystack = `${plain.name ?? ''} ${plain.description ?? ''} ${plain.slug ?? ''}`.toLowerCase();
      return haystack.includes(trimmedSearch);
    })
    .slice(0, parsedLimit);

  const sanitized = filtered
    .map((group) => sanitizeGroup(group, { includeMembers: false }))
    .sort((a, b) => (b.metrics.activeMembers ?? 0) - (a.metrics.activeMembers ?? 0));

  return {
    data: sanitized,
    metadata: {
      total: sanitized.length,
      recommendedIds: sanitized.slice(0, Math.min(3, sanitized.length)).map((group) => group.id),
    },
  };
}

export async function createGroup(payload, { actor } = {}) {
  ensureManager(actor);
  const name = payload?.name?.toString().trim();
  if (!name) {
    throw new ValidationError('Group name is required.');
  }

  const description = payload?.description?.toString().trim() || null;
  const bannerImageUrl = payload?.bannerImageUrl?.toString().trim() || null;
  const settings = payload?.settings ?? null;
  const metadata = payload?.metadata ?? null;

  return sequelize.transaction(async (transaction) => {
    const slug = await resolveUniqueSlug(payload?.slug || name, { transaction });
    const visibility = normalizeEnum(payload?.visibility || 'public', GROUP_VISIBILITIES, 'visibility');
    const memberPolicy = normalizeEnum(payload?.memberPolicy || 'request', GROUP_MEMBER_POLICIES, 'member policy');
    const avatarColor = normalizeColour(payload?.avatarColor);

    const group = await Group.create(
      {
        name,
        description,
        slug,
        visibility,
        memberPolicy,
        avatarColor,
        bannerImageUrl,
        settings,
        metadata,
        createdById: actor?.id ?? null,
        updatedById: actor?.id ?? null,
      },
      { transaction },
    );

    if (actor?.id) {
      await GroupMembership.create(
        {
          groupId: group.id,
          userId: actor.id,
          role: GROUP_MEMBERSHIP_ROLES.includes(payload?.ownerRole)
            ? payload.ownerRole
            : 'owner',
          status: 'active',
          invitedById: actor.id,
          joinedAt: new Date(),
        },
        { transaction },
      );
    }

    const reloaded = await loadGroup(group.id, { includeMembers: true, transaction });
    return sanitizeGroup(reloaded, { includeMembers: true });
  });
}

export async function createUserGroup(payload = {}, { actorId } = {}) {
  const actor = await assertActor(actorId);
  const name = payload?.name?.toString().trim();
  if (!name) {
    throw new ValidationError('Group name is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const slug = await resolveUniqueSlug(payload?.slug || name, { transaction });
    const visibility = normalizeEnum(payload?.visibility || 'public', GROUP_VISIBILITIES, 'visibility');
    const memberPolicy = normalizeEnum(payload?.memberPolicy || 'request', GROUP_MEMBER_POLICIES, 'member policy');
    const avatarColor = normalizeColour(payload?.avatarColor);
    const description = payload?.description?.toString().trim() || null;
    const bannerImageUrl = payload?.bannerImageUrl?.toString().trim() || null;
    const settings = payload?.settings ?? null;
    const metadata = payload?.metadata ?? null;

    const group = await Group.create(
      {
        name,
        description,
        slug,
        visibility,
        memberPolicy,
        avatarColor,
        bannerImageUrl,
        settings,
        metadata,
        createdById: actor.id,
        updatedById: actor.id,
      },
      { transaction },
    );

    await GroupMembership.create(
      {
        groupId: group.id,
        userId: actor.id,
        role: GROUP_MEMBERSHIP_ROLES.includes(payload?.ownerRole) ? payload.ownerRole : 'owner',
        status: 'active',
        invitedById: actor.id,
        joinedAt: new Date(),
      },
      { transaction },
    );

    const reloaded = await loadGroup(group.id, { includeMembers: true, transaction });
    return sanitizeGroup(reloaded, { includeMembers: true });
  });
}

export async function updateGroup(groupId, payload, { actor } = {}) {
  ensureManager(actor);
  const group = await loadGroup(groupId, { includeMembers: false });

  return sequelize.transaction(async (transaction) => {
    const updates = {};

    if (payload.name !== undefined) {
      const trimmed = payload.name?.toString().trim();
      if (!trimmed) {
        throw new ValidationError('Group name cannot be empty.');
      }
      updates.name = trimmed;
    }

    if (payload.description !== undefined) {
      updates.description = payload.description?.toString().trim() || null;
    }

    if (payload.slug !== undefined) {
      const candidate = payload.slug?.toString().trim();
      if (!candidate) {
        throw new ValidationError('Slug cannot be empty.');
      }
      updates.slug = await resolveUniqueSlug(candidate, {
        transaction,
        excludeGroupId: group.id,
      });
    }

    if (payload.visibility !== undefined) {
      updates.visibility = normalizeEnum(payload.visibility, GROUP_VISIBILITIES, 'visibility');
    }

    if (payload.memberPolicy !== undefined) {
      updates.memberPolicy = normalizeEnum(payload.memberPolicy, GROUP_MEMBER_POLICIES, 'member policy');
    }

    if (payload.avatarColor !== undefined) {
      updates.avatarColor = normalizeColour(payload.avatarColor);
    }

    if (payload.bannerImageUrl !== undefined) {
      updates.bannerImageUrl = payload.bannerImageUrl?.toString().trim() || null;
    }

    if (payload.settings !== undefined) {
      updates.settings = payload.settings ?? null;
    }

    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    updates.updatedById = actor?.id ?? group.updatedById ?? null;

    await group.update(updates, { transaction });
    const reloaded = await loadGroup(group.id, { includeMembers: true, transaction });
    return sanitizeGroup(reloaded, { includeMembers: true });
  });
}

export async function updateUserGroup(groupId, payload = {}, { actorId } = {}) {
  await assertGroupManagerAccess(groupId, actorId);
  const group = await loadGroup(groupId, { includeMembers: false });

  return sequelize.transaction(async (transaction) => {
    const updates = {};

    if (payload.name !== undefined) {
      const trimmed = payload.name?.toString().trim();
      if (!trimmed) {
        throw new ValidationError('Group name cannot be empty.');
      }
      updates.name = trimmed;
    }

    if (payload.description !== undefined) {
      updates.description = payload.description?.toString().trim() || null;
    }

    if (payload.slug !== undefined) {
      const candidate = payload.slug?.toString().trim();
      if (!candidate) {
        throw new ValidationError('Slug cannot be empty.');
      }
      updates.slug = await resolveUniqueSlug(candidate, {
        transaction,
        excludeGroupId: group.id,
      });
    }

    if (payload.visibility !== undefined) {
      updates.visibility = normalizeEnum(payload.visibility, GROUP_VISIBILITIES, 'visibility');
    }

    if (payload.memberPolicy !== undefined) {
      updates.memberPolicy = normalizeEnum(payload.memberPolicy, GROUP_MEMBER_POLICIES, 'member policy');
    }

    if (payload.avatarColor !== undefined) {
      updates.avatarColor = normalizeColour(payload.avatarColor);
    }

    if (payload.bannerImageUrl !== undefined) {
      updates.bannerImageUrl = payload.bannerImageUrl?.toString().trim() || null;
    }

    if (payload.settings !== undefined) {
      updates.settings = payload.settings ?? null;
    }

    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return sanitizeGroup(group);
    }

    await group.update(updates, { transaction });
    const reloaded = await loadGroup(groupId, { includeMembers: true, transaction });
    return sanitizeGroup(reloaded, { includeMembers: true });
  });
}

export async function addMember({ groupId, userId, role, status, notes }, { actor } = {}) {
  ensureManager(actor);
  if (!groupId || !userId) {
    throw new ValidationError('Both groupId and userId are required.');
  }

  return sequelize.transaction(async (transaction) => {
    await loadGroup(groupId, { transaction });
    const member = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
      transaction,
    });
    if (!member) {
      throw new ValidationError('User not found.');
    }

    const existing = await GroupMembership.findOne({
      where: { groupId, userId },
      transaction,
    });
    if (existing) {
      throw new ConflictError('User already belongs to this group.');
    }

    const membership = await GroupMembership.create(
      {
        groupId,
        userId,
        role: GROUP_MEMBERSHIP_ROLES.includes(role) ? role : 'member',
        status: GROUP_MEMBERSHIP_STATUSES.includes(status) ? status : 'invited',
        invitedById: actor?.id ?? null,
        joinedAt: status === 'active' ? new Date() : null,
        notes: notes ?? null,
      },
      { transaction },
    );

    await membership.reload({
      include: [
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    return sanitizeMembership(membership);
  });
}

export async function updateMember(groupId, membershipId, payload, { actor } = {}) {
  ensureManager(actor);
  if (!groupId || !membershipId) {
    throw new ValidationError('groupId and membershipId are required.');
  }

  return sequelize.transaction(async (transaction) => {
    const membership = await GroupMembership.findOne({
      where: { id: membershipId, groupId },
      include: [
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    if (!membership) {
      throw new NotFoundError('Group membership not found.');
    }

    if (payload.role !== undefined) {
      if (!GROUP_MEMBERSHIP_ROLES.includes(payload.role)) {
        throw new ValidationError('Invalid membership role.');
      }
      membership.role = payload.role;
    }

    if (payload.status !== undefined) {
      if (!GROUP_MEMBERSHIP_STATUSES.includes(payload.status)) {
        throw new ValidationError('Invalid membership status.');
      }
      membership.status = payload.status;
      if (payload.status === 'active' && !membership.joinedAt) {
        membership.joinedAt = new Date();
      }
    }

    if (payload.notes !== undefined) {
      membership.notes = payload.notes?.toString().trim() || null;
    }

    await membership.save({ transaction });
    await membership.reload({
      include: [
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    return sanitizeMembership(membership);
  });
}

export async function removeMember(groupId, membershipId, { actor } = {}) {
  ensureManager(actor);
  if (!groupId || !membershipId) {
    throw new ValidationError('groupId and membershipId are required.');
  }

  return sequelize.transaction(async (transaction) => {
    const membership = await GroupMembership.findOne({
      where: { id: membershipId, groupId },
      transaction,
    });
    if (!membership) {
      throw new NotFoundError('Group membership not found.');
    }
    await membership.destroy({ transaction });
    return { success: true };
  });
}

export async function requestMembership(groupId, { actor, message } = {}) {
  if (!actor?.id) {
    throw new AuthorizationError('Authentication required to request membership.');
  }
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const group = await loadGroup(groupId, { includeMembers: true, transaction });
    const existing = await GroupMembership.findOne({
      where: { groupId, userId: actor.id },
      include: [
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    const desiredStatus = group.memberPolicy === 'open' ? 'active' : 'pending';

    if (existing) {
      existing.status = desiredStatus;
      if (desiredStatus === 'active' && !existing.joinedAt) {
        existing.joinedAt = new Date();
      }
      if (message !== undefined) {
        existing.notes = message?.toString().trim() || null;
      }
      await existing.save({ transaction });
      await existing.reload({
        include: [
          { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        ],
        transaction,
      });
      return sanitizeMembership(existing);
    }

    const membership = await GroupMembership.create(
      {
        groupId,
        userId: actor.id,
        role: 'member',
        status: desiredStatus,
        invitedById: null,
        joinedAt: desiredStatus === 'active' ? new Date() : null,
        notes: message?.toString().trim() || null,
      },
      { transaction },
    );

    await membership.reload({
      include: [
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    return sanitizeMembership(membership);
  });
}

export async function listGroupInvites(groupId, { actorId } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const invites = await GroupInvite.findAll({
    where: { groupId },
    include: [{ model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
    order: [['createdAt', 'DESC']],
  });
  return invites.map((invite) => sanitizeInvite(invite));
}

export async function createGroupInvite(groupId, payload = {}, { actorId } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  const { actor } = await assertGroupManagerAccess(groupId, actorId);

  return sequelize.transaction(async (transaction) => {
    const email = normalizeEmail(payload.email);
    const role = payload.role ? normalizeEnum(payload.role, GROUP_MEMBERSHIP_ROLES, 'invite role') : 'member';
    const status = payload.status ? normaliseInviteStatus(payload.status) : 'pending';
    const message = payload.message?.toString().trim() || null;
    const expiresAt = payload.expiresAt
      ? new Date(payload.expiresAt)
      : new Date(Date.now() + DEFAULT_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new ValidationError('Invalid invite expiry date.');
    }

    const existingMembership = await GroupMembership.findOne({
      where: { groupId },
      include: [
        {
          model: User,
          as: 'member',
          where: { email },
          required: true,
          attributes: ['id'],
        },
      ],
      transaction,
    });

    if (existingMembership) {
      throw new ConflictError('This user is already a member of the group.');
    }

    const existingInvite = await GroupInvite.findOne({ where: { groupId, email }, transaction });

    let invite;
    if (existingInvite) {
      existingInvite.role = role;
      existingInvite.status = status;
      existingInvite.message = message;
      existingInvite.invitedById = actor.id;
      existingInvite.expiresAt = expiresAt;
      existingInvite.metadata = {
        ...(existingInvite.metadata ?? {}),
        ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
      };
      await existingInvite.save({ transaction });
      invite = existingInvite;
    } else {
      invite = await GroupInvite.create(
        {
          groupId,
          email,
          role,
          status,
          message,
          invitedById: actor.id,
          expiresAt,
          metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null,
        },
        { transaction },
      );
    }

    await invite.reload({
      include: [{ model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
      transaction,
    });

    return sanitizeInvite(invite);
  });
}

export async function cancelGroupInvite(groupId, inviteId, { actorId } = {}) {
  if (!groupId || !inviteId) {
    throw new ValidationError('groupId and inviteId are required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const invite = await GroupInvite.findOne({ where: { id: inviteId, groupId } });
  if (!invite) {
    throw new NotFoundError('Group invite not found.');
  }
  await invite.destroy();
  return { success: true };
}

export async function listGroupPosts(groupId, { actorId, limit = 25, status } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const query = { groupId };
  if (status) {
    query.status = normalisePostStatus(status);
  }
  const records = await GroupPost.findAll({
    where: query,
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: Math.min(Math.max(Number(limit) || 1, 1), 100),
  });
  return records.map((record) => sanitizeGroupPost(record));
}

export async function createGroupPost(groupId, payload = {}, { actorId } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  const { actor } = await assertGroupManagerAccess(groupId, actorId);
  const title = payload.title?.toString().trim();
  if (!title) {
    throw new ValidationError('A title is required to create a post.');
  }
  const content = payload.content?.toString() ?? '';
  if (!content.trim()) {
    throw new ValidationError('Post content cannot be empty.');
  }

  const status = normalisePostStatus(payload.status);
  const visibility = normalisePostVisibility(payload.visibility);
  const summary = payload.summary?.toString().trim() || null;
  const scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    throw new ValidationError('Invalid scheduledAt value.');
  }
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : null;
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;

  const post = await GroupPost.create(
    {
      groupId,
      title,
      content,
      summary,
      status,
      visibility,
      scheduledAt,
      attachments,
      metadata,
      createdById: actor.id,
      updatedById: actor.id,
    },
    { returning: true },
  );

  await post.reload({
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });

  return sanitizeGroupPost(post);
}

export async function updateGroupPost(groupId, postId, payload = {}, { actorId } = {}) {
  if (!groupId || !postId) {
    throw new ValidationError('groupId and postId are required.');
  }
  const { actor } = await assertGroupManagerAccess(groupId, actorId);

  const post = await GroupPost.findOne({
    where: { id: postId, groupId },
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });

  if (!post) {
    throw new NotFoundError('Group post not found.');
  }

  if (payload.title !== undefined) {
    const title = payload.title?.toString().trim();
    if (!title) {
      throw new ValidationError('Title cannot be empty.');
    }
    post.title = title;
  }
  if (payload.content !== undefined) {
    const content = payload.content?.toString() ?? '';
    if (!content.trim()) {
      throw new ValidationError('Post content cannot be empty.');
    }
    post.content = content;
  }
  if (payload.summary !== undefined) {
    post.summary = payload.summary?.toString().trim() || null;
  }
  if (payload.status !== undefined) {
    post.status = normalisePostStatus(payload.status);
  }
  if (payload.visibility !== undefined) {
    post.visibility = normalisePostVisibility(payload.visibility);
  }
  if (payload.scheduledAt !== undefined) {
    if (!payload.scheduledAt) {
      post.scheduledAt = null;
    } else {
      const scheduledAt = new Date(payload.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new ValidationError('Invalid scheduledAt value.');
      }
      post.scheduledAt = scheduledAt;
    }
  }
  if (payload.attachments !== undefined) {
    post.attachments = Array.isArray(payload.attachments) ? payload.attachments : null;
  }
  if (payload.metadata !== undefined && typeof payload.metadata === 'object') {
    post.metadata = payload.metadata;
  }

  post.updatedById = actor.id;
  await post.save();
  await post.reload({
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });

  return sanitizeGroupPost(post);
}

export async function deleteGroupPost(groupId, postId, { actorId } = {}) {
  if (!groupId || !postId) {
    throw new ValidationError('groupId and postId are required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const post = await GroupPost.findOne({ where: { id: postId, groupId } });
  if (!post) {
    throw new NotFoundError('Group post not found.');
  }
  await post.destroy();
  return { success: true };
}

export async function listGroupMemberships(groupId, { actorId } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const memberships = await GroupMembership.findAll({
    where: { groupId },
    include: [
      { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  return memberships.map((membership) => sanitizeMembership(membership));
}

export async function updateGroupMembership(groupId, membershipId, payload = {}, { actorId } = {}) {
  if (!groupId || !membershipId) {
    throw new ValidationError('groupId and membershipId are required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const membership = await GroupMembership.findOne({
    where: { id: membershipId, groupId },
    include: [
      { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });
  if (!membership) {
    throw new NotFoundError('Group membership not found.');
  }

  if (payload.role !== undefined) {
    if (!GROUP_MEMBERSHIP_ROLES.includes(payload.role)) {
      throw new ValidationError('Unsupported group role.');
    }
    membership.role = payload.role;
  }

  if (payload.status !== undefined) {
    const status = payload.status?.toString().trim();
    if (!GROUP_MEMBERSHIP_STATUSES.includes(status)) {
      throw new ValidationError('Unsupported membership status.');
    }
    membership.status = status;
    if (status === 'active' && !membership.joinedAt) {
      membership.joinedAt = new Date();
    }
  }

  if (payload.notes !== undefined) {
    membership.notes = payload.notes?.toString().trim() || null;
  }

  if (payload.metadata !== undefined && typeof payload.metadata === 'object') {
    membership.metadata = payload.metadata;
  }

  await membership.save();
  return sanitizeMembership(membership);
}

export const __testing = {
  slugify,
  unique,
  toNumber,
  asBoolean,
  buildMembershipState,
  computeEngagementScore,
  mapGroupRecord,
  fetchMembershipMetrics,
  buildGroupInsights,
};

export default {
  listMemberGroups,
  listGroups,
  getGroupProfile,
  joinGroup,
  leaveGroup,
  updateMembershipSettings,
  discoverGroups,
  getGroup,
  createGroup,
  createUserGroup,
  updateGroup,
  updateUserGroup,
  addMember,
  updateMember,
  removeMember,
  requestMembership,
  listGroupInvites,
  createGroupInvite,
  cancelGroupInvite,
  listGroupPosts,
  createGroupPost,
  updateGroupPost,
  deleteGroupPost,
  listGroupMemberships,
  updateGroupMembership,
};
