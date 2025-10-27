import { fn, col, literal } from 'sequelize';
import {
  Group,
  GroupMembership,
  GroupInvite,
  GroupPost,
  Page,
  PageMembership,
  PageInvite,
  PagePost,
  User,
} from '../models/index.js';
import { ValidationError } from '../utils/errors.js';

const GROUP_MANAGER_ROLES = new Set(['owner', 'moderator']);
const PAGE_MANAGER_ROLES = new Set(['owner', 'admin']);

function subDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function parseNumber(value, fallback = 0) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeTrendingTopics(posts = []) {
  const map = new Map();
  for (const post of posts) {
    const status = post.status ?? post.Status;
    if (status && status !== 'published') {
      continue;
    }
    const tags = [];
    if (Array.isArray(post.topicTags)) {
      tags.push(...post.topicTags);
    }
    const metadataTags = post.metadata?.tags ?? post.metadata?.topics;
    if (Array.isArray(metadataTags)) {
      tags.push(...metadataTags);
    }
    for (const tag of tags) {
      const trimmed = `${tag ?? ''}`.trim();
      if (!trimmed) {
        continue;
      }
      map.set(trimmed, (map.get(trimmed) ?? 0) + 1);
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([topic]) => topic);
}

function summarisePostTimings(posts = [], { now, sevenDaysAhead }) {
  let scheduledNext7Days = 0;
  let latestPublishedAt = null;
  for (const post of posts) {
    const scheduledAt = parseDate(post.scheduledAt);
    if (post.status === 'scheduled' && scheduledAt && scheduledAt >= now && scheduledAt <= sevenDaysAhead) {
      scheduledNext7Days += 1;
    }
    const publishedAt = parseDate(post.publishedAt ?? post.updatedAt);
    if (post.status === 'published' && publishedAt && (!latestPublishedAt || publishedAt > latestPublishedAt)) {
      latestPublishedAt = publishedAt;
    }
  }
  return {
    scheduledNext7Days,
    latestPublishedAt: latestPublishedAt ? latestPublishedAt.toISOString() : null,
  };
}

function summariseInvites(invites = [], { now, sevenDaysAgo, threeDaysAhead }) {
  let pending = 0;
  let expiringSoon = 0;
  let acceptedThisWeek = 0;

  for (const invite of invites) {
    const status = invite.status ?? invite.Status ?? '';
    if (status === 'pending') {
      pending += 1;
      const expiry = parseDate(invite.expiresAt);
      if (expiry && expiry >= now && expiry <= threeDaysAhead) {
        expiringSoon += 1;
      }
    }
    if (status === 'accepted') {
      const updatedAt = parseDate(invite.updatedAt ?? invite.createdAt);
      if (updatedAt && updatedAt >= sevenDaysAgo) {
        acceptedThisWeek += 1;
      }
    }
  }

  return { pending, expiringSoon, acceptedThisWeek };
}

function computeEngagementScore({ activeMembers, postsPublishedThisWeek, membersJoinedThisWeek, invitesAcceptedThisWeek }) {
  const denominator = Math.max(1, activeMembers);
  const weighted = postsPublishedThisWeek * 0.5 + membersJoinedThisWeek * 0.3 + invitesAcceptedThisWeek * 0.2;
  const score = Math.min(1, Math.max(0, weighted / denominator));
  return Number(score.toFixed(2));
}

function computeEngagementLevel(score) {
  if (score >= 0.75) {
    return 'surging';
  }
  if (score >= 0.5) {
    return 'growing';
  }
  if (score >= 0.3) {
    return 'steady';
  }
  return 'emerging';
}

function parseUserSummary(user) {
  if (!user) return null;
  const plain = user.get ? user.get({ plain: true }) : user;
  return {
    id: plain.id,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    name: [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim() || null,
    email: plain.email ?? null,
    userType: plain.userType ?? null,
  };
}

function buildGroupSummary(
  membership,
  { invitesByGroup, postsByGroup, membershipMetricsByGroup, postMetricsByGroup, now, sevenDaysAgo, threeDaysAhead, sevenDaysAhead },
) {
  const plainMembership = membership.get ? membership.get({ plain: true }) : membership;
  const group = plainMembership.group ?? plainMembership.Group;
  const invites = invitesByGroup.get(group?.id) ?? [];
  const posts = postsByGroup.get(group?.id) ?? [];
  const membershipMetrics = membershipMetricsByGroup.get(group?.id) ?? {};
  const postMetrics = postMetricsByGroup.get(group?.id) ?? {};
  const inviteSummary = summariseInvites(invites, { now, sevenDaysAgo, threeDaysAhead });
  const postTimingSummary = summarisePostTimings(posts, { now, sevenDaysAhead });
  const membersActive = parseNumber(membershipMetrics.active);
  const membersPending = parseNumber(membershipMetrics.pending);
  const membersJoinedThisWeek = parseNumber(membershipMetrics.joinedLast7Days);
  const leadershipTeam = parseNumber(membershipMetrics.leaders);
  const membersInvited = parseNumber(membershipMetrics.invited);
  const membersSuspended = parseNumber(membershipMetrics.suspended);
  const postsPublished = parseNumber(postMetrics.published);
  const postsScheduled = parseNumber(postMetrics.scheduled);
  const postsDraft = parseNumber(postMetrics.draft);
  const postsPublishedThisWeek = parseNumber(postMetrics.publishedLast7Days);
  const engagementScore = computeEngagementScore({
    activeMembers: membersActive,
    postsPublishedThisWeek,
    membersJoinedThisWeek,
    invitesAcceptedThisWeek: inviteSummary.acceptedThisWeek,
  });
  const engagementLevel = computeEngagementLevel(engagementScore);
  const trendingTopics = computeTrendingTopics(posts);
  return {
    id: group?.id ?? null,
    name: group?.name ?? null,
    slug: group?.slug ?? null,
    description: group?.description ?? null,
    visibility: group?.visibility ?? 'public',
    memberPolicy: group?.memberPolicy ?? 'request',
    avatarColor: group?.avatarColor ?? '#2563eb',
    bannerImageUrl: group?.bannerImageUrl ?? null,
    settings: group?.settings ?? {},
    metadata: group?.metadata ?? {},
    role: plainMembership.role,
    status: plainMembership.status,
    joinedAt: plainMembership.joinedAt ? new Date(plainMembership.joinedAt).toISOString() : null,
    metrics: {
      invitesPending: inviteSummary.pending,
      invitesExpiringSoon: inviteSummary.expiringSoon,
      invitesAcceptedThisWeek: inviteSummary.acceptedThisWeek,
      postsPublished,
      postsDraft,
      postsScheduled,
      postsPublishedThisWeek,
      scheduledNext7Days: postTimingSummary.scheduledNext7Days,
      latestAnnouncementAt: postTimingSummary.latestPublishedAt,
      membersActive,
      membersInvited,
      membersPending,
      membersJoinedThisWeek,
      leadershipTeam,
      engagementScore,
      engagementLevel,
      trendingTopics,
      membersSuspended,
    },
    invites,
    posts,
  };
}

function buildPageSummary(membership, invitesByPage, postsByPage) {
  const plainMembership = membership.get ? membership.get({ plain: true }) : membership;
  const page = plainMembership.page ?? plainMembership.Page;
  const invites = invitesByPage.get(page?.id) ?? [];
  const posts = postsByPage.get(page?.id) ?? [];
  return {
    id: page?.id ?? null,
    name: page?.name ?? null,
    slug: page?.slug ?? null,
    description: page?.description ?? null,
    category: page?.category ?? null,
    websiteUrl: page?.websiteUrl ?? null,
    contactEmail: page?.contactEmail ?? null,
    visibility: page?.visibility ?? 'public',
    avatarColor: page?.avatarColor ?? '#0f172a',
    bannerImageUrl: page?.bannerImageUrl ?? null,
    callToAction: page?.callToAction ?? null,
    settings: page?.settings ?? {},
    metadata: page?.metadata ?? {},
    role: plainMembership.role,
    status: plainMembership.status,
    joinedAt: plainMembership.joinedAt ? new Date(plainMembership.joinedAt).toISOString() : null,
    metrics: {
      invitesPending: invites.filter((invite) => invite.status === 'pending').length,
      postsPublished: posts.filter((post) => post.status === 'published').length,
      postsDraft: posts.filter((post) => post.status !== 'published').length,
    },
    invites,
    posts,
  };
}

function sanitizeInvite(invite) {
  const plain = invite.get ? invite.get({ plain: true }) : invite;
  return {
    id: plain.id,
    email: plain.email,
    role: plain.role,
    status: plain.status,
    message: plain.message ?? null,
    token: plain.token,
    invitedBy: parseUserSummary(plain.invitedBy ?? plain.InvitedBy),
    invitedById: plain.invitedById ?? null,
    expiresAt: plain.expiresAt ? new Date(plain.expiresAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function sanitizePost(post) {
  const plain = post.get ? post.get({ plain: true }) : post;
  return {
    id: plain.id,
    title: plain.title,
    slug: plain.slug,
    summary: plain.summary ?? null,
    status: plain.status,
    visibility: plain.visibility,
    scheduledAt: plain.scheduledAt ? new Date(plain.scheduledAt).toISOString() : null,
    publishedAt: plain.publishedAt ? new Date(plain.publishedAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    topicTags: Array.isArray(plain.topicTags) ? plain.topicTags : [],
    metadata: plain.metadata ?? {},
    createdBy: parseUserSummary(plain.createdBy ?? plain.CreatedBy),
    updatedBy: parseUserSummary(plain.updatedBy ?? plain.UpdatedBy),
  };
}

export async function getCommunityManagementSnapshot(userId) {
  const numericUserId = Number.parseInt(userId, 10);
  if (!numericUserId) {
    throw new ValidationError('A valid userId is required to load community management.');
  }

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const threeDaysAhead = addDays(now, 3);
  const sevenDaysAhead = addDays(now, 7);

  const [groupMemberships, pageMemberships] = await Promise.all([
    GroupMembership.findAll({
      where: { userId: numericUserId },
      include: [
        {
          model: Group,
          as: 'group',
          attributes: [
            'id',
            'name',
            'slug',
            'description',
            'visibility',
            'memberPolicy',
            'avatarColor',
            'bannerImageUrl',
            'settings',
            'metadata',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    }),
    PageMembership.findAll({
      where: { userId: numericUserId },
      include: [
        {
          model: Page,
          as: 'page',
          attributes: [
            'id',
            'name',
            'slug',
            'description',
            'category',
            'websiteUrl',
            'contactEmail',
            'visibility',
            'avatarColor',
            'bannerImageUrl',
            'callToAction',
            'settings',
            'metadata',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    }),
  ]);

  const managedGroupIds = groupMemberships
    .filter((membership) => GROUP_MANAGER_ROLES.has(membership.role) && membership.status === 'active')
    .map((membership) => membership.groupId);

  const managedPageIds = pageMemberships
    .filter((membership) => PAGE_MANAGER_ROLES.has(membership.role) && membership.status === 'active')
    .map((membership) => membership.pageId);

  const groupIds = Array.from(new Set(groupMemberships.map((membership) => membership.groupId))).filter(Boolean);

  const [
    groupInvites,
    groupPosts,
    pageInvites,
    pagePosts,
    membershipAggregateRows,
    postAggregateRows,
  ] = await Promise.all([
    managedGroupIds.length
      ? GroupInvite.findAll({
          where: { groupId: managedGroupIds },
          include: [{ model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
          order: [['createdAt', 'DESC']],
        })
      : [],
    managedGroupIds.length
      ? GroupPost.findAll({
          where: { groupId: managedGroupIds },
          include: [
            { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
            { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          ],
          order: [['createdAt', 'DESC']],
          limit: managedGroupIds.length * 6,
        })
      : [],
    managedPageIds.length
      ? PageInvite.findAll({
          where: { pageId: managedPageIds },
          include: [{ model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
          order: [['createdAt', 'DESC']],
        })
      : [],
    managedPageIds.length
      ? PagePost.findAll({
          where: { pageId: managedPageIds },
          include: [
            { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
            { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          ],
          order: [['createdAt', 'DESC']],
          limit: managedPageIds.length * 6,
        })
      : [],
    groupIds.length
      ? GroupMembership.findAll({
          attributes: [
            'groupId',
            [fn('COUNT', col('id')), 'total'],
            [fn('SUM', literal("CASE WHEN status = 'active' THEN 1 ELSE 0 END")), 'active'],
            [fn('SUM', literal("CASE WHEN status = 'invited' THEN 1 ELSE 0 END")), 'invited'],
            [fn('SUM', literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending'],
            [fn('SUM', literal("CASE WHEN status = 'suspended' THEN 1 ELSE 0 END")), 'suspended'],
            [fn('SUM', literal("CASE WHEN role IN ('owner','moderator') AND status = 'active' THEN 1 ELSE 0 END")), 'leaders'],
            [
              fn(
                'SUM',
                literal(
                  `CASE WHEN "GroupMembership"."joinedAt" IS NOT NULL AND "GroupMembership"."joinedAt" >= '${sevenDaysAgo.toISOString()}' THEN 1 ELSE 0 END`,
                ),
              ),
              'joinedLast7Days',
            ],
          ],
          where: { groupId: groupIds },
          group: ['groupId'],
          raw: true,
        })
      : [],
    managedGroupIds.length
      ? GroupPost.findAll({
          attributes: [
            'groupId',
            [fn('COUNT', col('id')), 'total'],
            [fn('SUM', literal("CASE WHEN status = 'published' THEN 1 ELSE 0 END")), 'published'],
            [fn('SUM', literal("CASE WHEN status = 'draft' THEN 1 ELSE 0 END")), 'draft'],
            [fn('SUM', literal("CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END")), 'scheduled'],
            [
              fn(
                'SUM',
                literal(
                  `CASE WHEN "GroupPost"."publishedAt" IS NOT NULL AND "GroupPost"."publishedAt" >= '${sevenDaysAgo.toISOString()}' THEN 1 ELSE 0 END`,
                ),
              ),
              'publishedLast7Days',
            ],
          ],
          where: { groupId: managedGroupIds },
          group: ['groupId'],
          raw: true,
        })
      : [],
  ]);

  const invitesByGroup = new Map();
  for (const invite of groupInvites) {
    const list = invitesByGroup.get(invite.groupId) ?? [];
    list.push(sanitizeInvite(invite));
    invitesByGroup.set(invite.groupId, list);
  }

  const membershipMetricsByGroup = new Map();
  for (const row of membershipAggregateRows ?? []) {
    membershipMetricsByGroup.set(row.groupId, {
      total: parseNumber(row.total),
      active: parseNumber(row.active),
      invited: parseNumber(row.invited),
      pending: parseNumber(row.pending),
      suspended: parseNumber(row.suspended),
      leaders: parseNumber(row.leaders),
      joinedLast7Days: parseNumber(row.joinedLast7Days),
    });
  }

  const postsByGroup = new Map();
  for (const post of groupPosts) {
    const list = postsByGroup.get(post.groupId) ?? [];
    list.push(sanitizePost(post));
    postsByGroup.set(post.groupId, list);
  }

  const postMetricsByGroup = new Map();
  for (const row of postAggregateRows ?? []) {
    postMetricsByGroup.set(row.groupId, {
      total: parseNumber(row.total),
      published: parseNumber(row.published),
      draft: parseNumber(row.draft),
      scheduled: parseNumber(row.scheduled),
      publishedLast7Days: parseNumber(row.publishedLast7Days),
    });
  }

  const invitesByPage = new Map();
  for (const invite of pageInvites) {
    const list = invitesByPage.get(invite.pageId) ?? [];
    list.push(sanitizeInvite(invite));
    invitesByPage.set(invite.pageId, list);
  }

  const postsByPage = new Map();
  for (const post of pagePosts) {
    const list = postsByPage.get(post.pageId) ?? [];
    list.push(sanitizePost(post));
    postsByPage.set(post.pageId, list);
  }

  const groupSummaries = groupMemberships.map((membership) =>
    buildGroupSummary(membership, {
      invitesByGroup,
      postsByGroup,
      membershipMetricsByGroup,
      postMetricsByGroup,
      now,
      sevenDaysAgo,
      threeDaysAhead,
      sevenDaysAhead,
    }),
  );
  const pageSummaries = pageMemberships.map((membership) => buildPageSummary(membership, invitesByPage, postsByPage));

  const managedGroups = groupSummaries.filter((item) => GROUP_MANAGER_ROLES.has(item.role));
  const managedPages = pageSummaries.filter((item) => PAGE_MANAGER_ROLES.has(item.role));

  const pendingGroupInvites = managedGroups.reduce((acc, group) => acc + group.metrics.invitesPending, 0);
  const pendingPageInvites = managedPages.reduce((acc, page) => acc + page.metrics.invitesPending, 0);

  const aggregatedGroupMetrics = groupSummaries.reduce(
    (acc, group) => {
      const metrics = group.metrics ?? {};
      acc.activeMembers += parseNumber(metrics.membersActive);
      acc.newMembersThisWeek += parseNumber(metrics.membersJoinedThisWeek);
      acc.pendingInvites += parseNumber(metrics.invitesPending);
      acc.invitesExpiringSoon += parseNumber(metrics.invitesExpiringSoon);
      acc.postsScheduled += parseNumber(metrics.postsScheduled);
      acc.postsPublishedThisWeek += parseNumber(metrics.postsPublishedThisWeek);
      acc.postsDraft += parseNumber(metrics.postsDraft);
      acc.pendingApprovals += parseNumber(metrics.membersPending);
      acc.invitedMembers += parseNumber(metrics.membersInvited);
      acc.suspendedMembers += parseNumber(metrics.membersSuspended);
      if (typeof metrics.engagementScore === 'number') {
        acc.engagementScoreSum += metrics.engagementScore;
        acc.groupsWithEngagement += 1;
      }
      for (const topic of metrics.trendingTopics ?? []) {
        const current = acc.trendingTopics.get(topic) ?? 0;
        acc.trendingTopics.set(topic, current + 1);
      }
      return acc;
    },
    {
      activeMembers: 0,
      newMembersThisWeek: 0,
      pendingInvites: 0,
      invitesExpiringSoon: 0,
      postsScheduled: 0,
      postsPublishedThisWeek: 0,
      postsDraft: 0,
      pendingApprovals: 0,
      invitedMembers: 0,
      suspendedMembers: 0,
      engagementScoreSum: 0,
      groupsWithEngagement: 0,
      trendingTopics: new Map(),
    },
  );

  const trendingTopics = Array.from(aggregatedGroupMetrics.trendingTopics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([topic]) => topic);

  const averageEngagement =
    aggregatedGroupMetrics.groupsWithEngagement > 0
      ? Number((aggregatedGroupMetrics.engagementScoreSum / aggregatedGroupMetrics.groupsWithEngagement).toFixed(2))
      : 0;

  return {
    groups: {
      items: groupSummaries,
      managed: managedGroups,
      stats: {
        total: groupSummaries.length,
        managed: managedGroups.length,
        pendingInvites: pendingGroupInvites,
        activeMembers: aggregatedGroupMetrics.activeMembers,
        newMembersThisWeek: aggregatedGroupMetrics.newMembersThisWeek,
        postsScheduled: aggregatedGroupMetrics.postsScheduled,
        postsPublishedThisWeek: aggregatedGroupMetrics.postsPublishedThisWeek,
        postsDraft: aggregatedGroupMetrics.postsDraft,
        invitesExpiringSoon: aggregatedGroupMetrics.invitesExpiringSoon,
        pendingApprovals: aggregatedGroupMetrics.pendingApprovals,
        invitedMembers: aggregatedGroupMetrics.invitedMembers,
        suspendedMembers: aggregatedGroupMetrics.suspendedMembers,
        averageEngagement,
        trendingTopics,
      },
    },
    pages: {
      items: pageSummaries,
      managed: managedPages,
      stats: {
        total: pageSummaries.length,
        managed: managedPages.length,
        pendingInvites: pendingPageInvites,
      },
    },
  };
}

export default {
  getCommunityManagementSnapshot,
};
