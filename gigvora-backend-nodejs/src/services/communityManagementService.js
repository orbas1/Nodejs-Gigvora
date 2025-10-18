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

function buildGroupSummary(membership, invitesByGroup, postsByGroup) {
  const plainMembership = membership.get ? membership.get({ plain: true }) : membership;
  const group = plainMembership.group ?? plainMembership.Group;
  const invites = invitesByGroup.get(group?.id) ?? [];
  const posts = postsByGroup.get(group?.id) ?? [];
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
      invitesPending: invites.filter((invite) => invite.status === 'pending').length,
      postsPublished: posts.filter((post) => post.status === 'published').length,
      postsDraft: posts.filter((post) => post.status !== 'published').length,
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
    createdBy: parseUserSummary(plain.createdBy ?? plain.CreatedBy),
    updatedBy: parseUserSummary(plain.updatedBy ?? plain.UpdatedBy),
  };
}

export async function getCommunityManagementSnapshot(userId) {
  const numericUserId = Number.parseInt(userId, 10);
  if (!numericUserId) {
    throw new ValidationError('A valid userId is required to load community management.');
  }

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

  const [groupInvites, groupPosts, pageInvites, pagePosts] = await Promise.all([
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
  ]);

  const invitesByGroup = new Map();
  for (const invite of groupInvites) {
    const list = invitesByGroup.get(invite.groupId) ?? [];
    list.push(sanitizeInvite(invite));
    invitesByGroup.set(invite.groupId, list);
  }

  const postsByGroup = new Map();
  for (const post of groupPosts) {
    const list = postsByGroup.get(post.groupId) ?? [];
    list.push(sanitizePost(post));
    postsByGroup.set(post.groupId, list);
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

  const groupSummaries = groupMemberships.map((membership) => buildGroupSummary(membership, invitesByGroup, postsByGroup));
  const pageSummaries = pageMemberships.map((membership) => buildPageSummary(membership, invitesByPage, postsByPage));

  const managedGroups = groupSummaries.filter((item) => GROUP_MANAGER_ROLES.has(item.role));
  const managedPages = pageSummaries.filter((item) => PAGE_MANAGER_ROLES.has(item.role));

  const pendingGroupInvites = managedGroups.reduce((acc, group) => acc + group.metrics.invitesPending, 0);
  const pendingPageInvites = managedPages.reduce((acc, page) => acc + page.metrics.invitesPending, 0);

  return {
    groups: {
      items: groupSummaries,
      managed: managedGroups,
      stats: {
        total: groupSummaries.length,
        managed: managedGroups.length,
        pendingInvites: pendingGroupInvites,
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
