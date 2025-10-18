import { Op } from 'sequelize';
import {
  Page,
  PageMembership,
  PageInvite,
  PagePost,
  User,
  sequelize,
  PAGE_VISIBILITIES,
  PAGE_MEMBER_ROLES,
  PAGE_MEMBER_STATUSES,
  PAGE_POST_STATUSES,
  PAGE_POST_VISIBILITIES,
  COMMUNITY_INVITE_STATUSES,
} from '../models/index.js';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '../utils/errors.js';

const DEFAULT_ALLOWED_ACTOR_TYPES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'];
const PAGE_MANAGER_ROLES = new Set(['owner', 'admin']);
const PAGE_EDITOR_ROLES = new Set(['owner', 'admin', 'editor', 'moderator']);
const INVITE_STATUS_SET = new Set(COMMUNITY_INVITE_STATUSES);
const PAGE_MEMBER_ROLE_SET = new Set(PAGE_MEMBER_ROLES);
const PAGE_MEMBER_STATUS_SET = new Set(PAGE_MEMBER_STATUSES);
const PAGE_POST_STATUS_SET = new Set(PAGE_POST_STATUSES);
const PAGE_POST_VISIBILITY_SET = new Set(PAGE_POST_VISIBILITIES);
const DEFAULT_INVITE_EXPIRY_DAYS = 14;

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

async function assertActor(actorId) {
  const id = Number(actorId);
  if (!id) {
    throw new ValidationError('An authenticated user is required.');
  }
  const user = await User.findByPk(id, { attributes: ['id', 'userType', 'firstName', 'lastName', 'email'] });
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  if (!DEFAULT_ALLOWED_ACTOR_TYPES.includes(user.userType)) {
    throw new AuthorizationError('Your account type is not permitted to manage pages.');
  }
  return user;
}

function sanitizeUser(user) {
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

function sanitizePage(page, { includeMemberships = false } = {}) {
  if (!page) return null;
  const plain = page.get ? page.get({ plain: true }) : page;
  const memberships = Array.isArray(plain.memberships ?? plain.PageMemberships)
    ? plain.memberships ?? plain.PageMemberships
    : [];
  const stats = memberships.reduce(
    (acc, membership) => {
      const status = membership.status ?? 'pending';
      acc.total += 1;
      if (status === 'active') acc.active += 1;
      if (status === 'pending' || status === 'invited') acc.pending += 1;
      return acc;
    },
    { total: 0, active: 0, pending: 0 },
  );

  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description ?? null,
    category: plain.category ?? null,
    websiteUrl: plain.websiteUrl ?? null,
    contactEmail: plain.contactEmail ?? null,
    visibility: plain.visibility ?? 'public',
    avatarColor: plain.avatarColor ?? '#0f172a',
    bannerImageUrl: plain.bannerImageUrl ?? null,
    callToAction: plain.callToAction ?? null,
    createdBy: sanitizeUser(plain.createdBy ?? plain.CreatedBy),
    updatedBy: sanitizeUser(plain.updatedBy ?? plain.UpdatedBy),
    settings: plain.settings ?? {},
    metadata: plain.metadata ?? {},
    stats,
    memberships: includeMemberships ? memberships.map((m) => sanitizeMembership(m)) : undefined,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function sanitizeMembership(membership) {
  if (!membership) return null;
  const plain = membership.get ? membership.get({ plain: true }) : membership;
  return {
    id: plain.id,
    pageId: plain.pageId,
    userId: plain.userId,
    role: plain.role,
    status: plain.status,
    invitedById: plain.invitedById ?? null,
    joinedAt: plain.joinedAt ? new Date(plain.joinedAt).toISOString() : null,
    notes: plain.notes ?? null,
    member: sanitizeUser(plain.member ?? plain.Member),
    invitedBy: sanitizeUser(plain.invitedBy ?? plain.InvitedBy),
    metadata: plain.metadata ?? {},
  };
}

function sanitizeInvite(invite) {
  if (!invite) return null;
  const plain = invite.get ? invite.get({ plain: true }) : invite;
  return {
    id: plain.id,
    pageId: plain.pageId,
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

function sanitizePost(post) {
  if (!post) return null;
  const plain = post.get ? post.get({ plain: true }) : post;
  return {
    id: plain.id,
    pageId: plain.pageId,
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

async function assertPageAccess(pageId, actorId, { allowedRoles = PAGE_MANAGER_ROLES, transaction } = {}) {
  if (!pageId) {
    throw new ValidationError('pageId is required.');
  }
  const actor = await assertActor(actorId);
  const membership = await PageMembership.findOne({
    where: { pageId, userId: actor.id, status: 'active' },
    transaction,
  });
  if (!membership || !allowedRoles.has(membership.role)) {
    throw new AuthorizationError('You do not have permission to manage this page.');
  }
  return { actor, membership };
}

function normalizeVisibility(value) {
  if (!value) {
    return 'public';
  }
  const normalized = value.toString().toLowerCase();
  if (!PAGE_VISIBILITIES.includes(normalized)) {
    throw new ValidationError('Unsupported visibility value.');
  }
  return normalized;
}

function normalizeRole(role) {
  if (!role) {
    return 'viewer';
  }
  const normalized = role.toString().toLowerCase();
  if (!PAGE_MEMBER_ROLE_SET.has(normalized)) {
    throw new ValidationError('Unsupported page role.');
  }
  return normalized;
}

function normalizeStatus(status) {
  if (!status) {
    return 'pending';
  }
  const normalized = status.toString().toLowerCase();
  if (!PAGE_MEMBER_STATUS_SET.has(normalized)) {
    throw new ValidationError('Unsupported membership status.');
  }
  return normalized;
}

function normalizeInviteStatus(status) {
  if (!status) {
    return 'pending';
  }
  const normalized = status.toString().toLowerCase();
  if (!INVITE_STATUS_SET.has(normalized)) {
    throw new ValidationError('Unsupported invite status.');
  }
  return normalized;
}

function normalizePostStatus(status) {
  if (!status) {
    return 'draft';
  }
  const normalized = status.toString().toLowerCase();
  if (!PAGE_POST_STATUS_SET.has(normalized)) {
    throw new ValidationError('Unsupported post status.');
  }
  return normalized;
}

function normalizePostVisibility(visibility) {
  if (!visibility) {
    return 'public';
  }
  const normalized = visibility.toString().toLowerCase();
  if (!PAGE_POST_VISIBILITY_SET.has(normalized)) {
    throw new ValidationError('Unsupported post visibility.');
  }
  return normalized;
}

export async function listUserPages(userId, { includeMemberships = false } = {}) {
  const actor = await assertActor(userId);
  const memberships = await PageMembership.findAll({
    where: { userId: actor.id },
    include: [{ model: Page, as: 'page', include: includeMemberships ? [{ model: PageMembership, as: 'memberships' }] : [] }],
    order: [[{ model: Page, as: 'page' }, 'name', 'ASC']],
  });
  return memberships.map((membership) => ({
    membership: sanitizeMembership(membership),
    page: sanitizePage(membership.page, { includeMemberships }),
  }));
}

export async function createPage(payload = {}, { actorId } = {}) {
  const actor = await assertActor(actorId);
  const name = payload.name?.toString().trim();
  if (!name) {
    throw new ValidationError('A page name is required.');
  }
  const visibility = normalizeVisibility(payload.visibility);
  const contactEmail = payload.contactEmail ? normalizeEmail(payload.contactEmail, 'contactEmail') : null;
  const category = payload.category?.toString().trim() || null;
  const websiteUrl = payload.websiteUrl?.toString().trim() || null;
  const callToAction = payload.callToAction?.toString().trim() || null;
  const description = payload.description?.toString().trim() || null;
  const settings = payload.settings && typeof payload.settings === 'object' ? payload.settings : null;
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;

  return sequelize.transaction(async (transaction) => {
    const page = await Page.create(
      {
        name,
        visibility,
        contactEmail,
        category,
        websiteUrl,
        callToAction,
        description,
        settings,
        metadata,
        avatarColor: payload.avatarColor ?? undefined,
        bannerImageUrl: payload.bannerImageUrl ?? null,
        createdById: actor.id,
        updatedById: actor.id,
      },
      { transaction },
    );

    await PageMembership.create(
      {
        pageId: page.id,
        userId: actor.id,
        role: 'owner',
        status: 'active',
        invitedById: actor.id,
        joinedAt: new Date(),
      },
      { transaction },
    );

    await page.reload({
      include: [
        { model: PageMembership, as: 'memberships', include: [{ model: User, as: 'member' }] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    return sanitizePage(page, { includeMemberships: true });
  });
}

export async function updatePage(pageId, payload = {}, { actorId } = {}) {
  const { actor } = await assertPageAccess(pageId, actorId, { allowedRoles: PAGE_MANAGER_ROLES });
  const page = await Page.findByPk(pageId, {
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });
  if (!page) {
    throw new NotFoundError('Page not found.');
  }

  if (payload.name !== undefined) {
    const name = payload.name?.toString().trim();
    if (!name) {
      throw new ValidationError('Page name cannot be empty.');
    }
    page.name = name;
  }
  if (payload.description !== undefined) {
    page.description = payload.description?.toString().trim() || null;
  }
  if (payload.category !== undefined) {
    page.category = payload.category?.toString().trim() || null;
  }
  if (payload.websiteUrl !== undefined) {
    page.websiteUrl = payload.websiteUrl?.toString().trim() || null;
  }
  if (payload.contactEmail !== undefined) {
    page.contactEmail = payload.contactEmail ? normalizeEmail(payload.contactEmail, 'contactEmail') : null;
  }
  if (payload.callToAction !== undefined) {
    page.callToAction = payload.callToAction?.toString().trim() || null;
  }
  if (payload.visibility !== undefined) {
    page.visibility = normalizeVisibility(payload.visibility);
  }
  if (payload.avatarColor !== undefined) {
    page.avatarColor = payload.avatarColor;
  }
  if (payload.bannerImageUrl !== undefined) {
    page.bannerImageUrl = payload.bannerImageUrl?.toString().trim() || null;
  }
  if (payload.settings !== undefined && typeof payload.settings === 'object') {
    page.settings = payload.settings;
  }
  if (payload.metadata !== undefined && typeof payload.metadata === 'object') {
    page.metadata = payload.metadata;
  }

  page.updatedById = actor.id;
  await page.save();
  await page.reload({
    include: [
      { model: PageMembership, as: 'memberships', include: [{ model: User, as: 'member' }] },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });

  return sanitizePage(page, { includeMemberships: true });
}

export async function listPageMemberships(pageId, { actorId } = {}) {
  await assertPageAccess(pageId, actorId, { allowedRoles: PAGE_MANAGER_ROLES });
  const memberships = await PageMembership.findAll({
    where: { pageId },
    include: [
      { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  return memberships.map((membership) => sanitizeMembership(membership));
}

export async function updatePageMembership(pageId, membershipId, payload = {}, { actorId } = {}) {
  await assertPageAccess(pageId, actorId, { allowedRoles: PAGE_MANAGER_ROLES });
  const membership = await PageMembership.findOne({
    where: { id: membershipId, pageId },
    include: [
      { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });
  if (!membership) {
    throw new NotFoundError('Page membership not found.');
  }

  if (payload.role !== undefined) {
    membership.role = normalizeRole(payload.role);
  }
  if (payload.status !== undefined) {
    membership.status = normalizeStatus(payload.status);
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

export async function listPageInvites(pageId, { actorId } = {}) {
  await assertPageAccess(pageId, actorId, { allowedRoles: PAGE_MANAGER_ROLES });
  const invites = await PageInvite.findAll({
    where: { pageId },
    include: [{ model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
    order: [['createdAt', 'DESC']],
  });
  return invites.map((invite) => sanitizeInvite(invite));
}

export async function createPageInvite(pageId, payload = {}, { actorId } = {}) {
  const { actor } = await assertPageAccess(pageId, actorId, { allowedRoles: PAGE_MANAGER_ROLES });
  const email = normalizeEmail(payload.email);
  const role = normalizeRole(payload.role ?? 'editor');
  const status = normalizeInviteStatus(payload.status ?? 'pending');
  const message = payload.message?.toString().trim() || null;
  const expiresAt = payload.expiresAt
    ? new Date(payload.expiresAt)
    : new Date(Date.now() + DEFAULT_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  if (Number.isNaN(expiresAt.getTime())) {
    throw new ValidationError('Invalid invite expiry.');
  }

  return sequelize.transaction(async (transaction) => {
    const existingMember = await PageMembership.findOne({
      where: { pageId },
      include: [
        {
          model: User,
          as: 'member',
          where: { email },
          required: true,
        },
      ],
      transaction,
    });

    if (existingMember) {
      throw new ConflictError('This user already has access to the page.');
    }

    const existingInvite = await PageInvite.findOne({ where: { pageId, email }, transaction });

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
      invite = await PageInvite.create(
        {
          pageId,
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

export async function cancelPageInvite(pageId, inviteId, { actorId } = {}) {
  await assertPageAccess(pageId, actorId, { allowedRoles: PAGE_MANAGER_ROLES });
  const invite = await PageInvite.findOne({ where: { id: inviteId, pageId } });
  if (!invite) {
    throw new NotFoundError('Page invite not found.');
  }
  await invite.destroy();
  return { success: true };
}

export async function listPagePosts(pageId, { actorId, limit = 25, status } = {}) {
  await assertPageAccess(pageId, actorId, { allowedRoles: PAGE_EDITOR_ROLES });
  const where = { pageId };
  if (status) {
    where.status = normalizePostStatus(status);
  }
  const posts = await PagePost.findAll({
    where,
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: Math.min(Math.max(Number(limit) || 1, 1), 100),
  });
  return posts.map((post) => sanitizePost(post));
}

export async function createPagePost(pageId, payload = {}, { actorId } = {}) {
  const { actor } = await assertPageAccess(pageId, actorId, { allowedRoles: PAGE_EDITOR_ROLES });
  const title = payload.title?.toString().trim();
  if (!title) {
    throw new ValidationError('A title is required.');
  }
  const content = payload.content?.toString() ?? '';
  if (!content.trim()) {
    throw new ValidationError('Content cannot be empty.');
  }
  const status = normalizePostStatus(payload.status);
  const visibility = normalizePostVisibility(payload.visibility);
  const summary = payload.summary?.toString().trim() || null;
  const scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    throw new ValidationError('Invalid scheduledAt value.');
  }
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : null;
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;

  const post = await PagePost.create({
    pageId,
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
  });

  await post.reload({
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });

  return sanitizePost(post);
}

export async function updatePagePost(pageId, postId, payload = {}, { actorId } = {}) {
  const { actor } = await assertPageAccess(pageId, actorId, { allowedRoles: PAGE_EDITOR_ROLES });
  const post = await PagePost.findOne({
    where: { id: postId, pageId },
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });
  if (!post) {
    throw new NotFoundError('Page post not found.');
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
      throw new ValidationError('Content cannot be empty.');
    }
    post.content = content;
  }
  if (payload.summary !== undefined) {
    post.summary = payload.summary?.toString().trim() || null;
  }
  if (payload.status !== undefined) {
    post.status = normalizePostStatus(payload.status);
  }
  if (payload.visibility !== undefined) {
    post.visibility = normalizePostVisibility(payload.visibility);
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

  return sanitizePost(post);
}

export async function deletePagePost(pageId, postId, { actorId } = {}) {
  await assertPageAccess(pageId, actorId, { allowedRoles: PAGE_EDITOR_ROLES });
  const post = await PagePost.findOne({ where: { id: postId, pageId } });
  if (!post) {
    throw new NotFoundError('Page post not found.');
  }
  await post.destroy();
  return { success: true };
}

export async function listManagedPages(actorId, { limit = 50 } = {}) {
  const actor = await assertActor(actorId);
  const memberships = await PageMembership.findAll({
    where: {
      userId: actor.id,
      role: { [Op.in]: Array.from(PAGE_MANAGER_ROLES) },
      status: 'active',
    },
    include: [{ model: Page, as: 'page' }],
    order: [[{ model: Page, as: 'page' }, 'name', 'ASC']],
    limit: Math.min(Math.max(Number(limit) || 1, 1), 100),
  });
  return memberships.map((membership) => sanitizePage(membership.page));
}

export default {
  listUserPages,
  listManagedPages,
  createPage,
  updatePage,
  listPageMemberships,
  updatePageMembership,
  listPageInvites,
  createPageInvite,
  cancelPageInvite,
  listPagePosts,
  createPagePost,
  updatePagePost,
  deletePagePost,
};
