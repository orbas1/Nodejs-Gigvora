import crypto from 'crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderWorkspaceInvite,
  ProviderContactNote,
  User,
  PROVIDER_WORKSPACE_TYPES,
  PROVIDER_WORKSPACE_MEMBER_ROLES,
  PROVIDER_WORKSPACE_MEMBER_STATUSES,
  PROVIDER_WORKSPACE_INVITE_STATUSES,
  PROVIDER_CONTACT_NOTE_VISIBILITIES,
} from '../models/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const WORKSPACE_LIST_CACHE_TTL = 60;

function assertWorkspaceType(type) {
  if (!PROVIDER_WORKSPACE_TYPES.includes(type)) {
    throw new ValidationError(`Unsupported workspace type "${type}".`);
  }
}

function assertMemberRole(role) {
  if (!PROVIDER_WORKSPACE_MEMBER_ROLES.includes(role)) {
    throw new ValidationError(`Unsupported workspace member role "${role}".`);
  }
}

function assertMemberStatus(status) {
  if (!PROVIDER_WORKSPACE_MEMBER_STATUSES.includes(status)) {
    throw new ValidationError(`Unsupported workspace member status "${status}".`);
  }
}

function assertInviteStatus(status) {
  if (!PROVIDER_WORKSPACE_INVITE_STATUSES.includes(status)) {
    throw new ValidationError(`Unsupported workspace invite status "${status}".`);
  }
}

function assertNoteVisibility(visibility) {
  if (!PROVIDER_CONTACT_NOTE_VISIBILITIES.includes(visibility)) {
    throw new ValidationError(`Unsupported contact note visibility "${visibility}".`);
  }
}

function sanitizeWorkspace(workspace) {
  if (!workspace) return null;
  const plain = workspace.get({ plain: true });
  return {
    id: plain.id,
    ownerId: plain.ownerId,
    name: plain.name,
    slug: plain.slug,
    type: plain.type,
    timezone: plain.timezone,
    defaultCurrency: plain.defaultCurrency,
    intakeEmail: plain.intakeEmail,
    isActive: plain.isActive,
    settings: plain.settings,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    members: Array.isArray(workspace.members)
      ? workspace.members.map((member) => sanitizeMember(member))
      : undefined,
  };
}

function sanitizeMember(member) {
  if (!member) return null;
  const plain = member.get ? member.get({ plain: true }) : member;
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    userId: plain.userId,
    role: plain.role,
    status: plain.status,
    invitedById: plain.invitedById,
    joinedAt: plain.joinedAt,
    lastActiveAt: plain.lastActiveAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    user: member.member
      ? {
          id: member.member.id,
          firstName: member.member.firstName,
          lastName: member.member.lastName,
          email: member.member.email,
        }
      : undefined,
  };
}

function sanitizeInvite(invite) {
  if (!invite) return null;
  const plain = invite.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    email: plain.email,
    role: plain.role,
    status: plain.status,
    inviteToken: plain.inviteToken,
    expiresAt: plain.expiresAt,
    invitedById: plain.invitedById,
    acceptedAt: plain.acceptedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitizeContactNote(note) {
  if (!note) return null;
  const plain = note.toPublicObject();
  return {
    ...plain,
    author: note.author
      ? {
          id: note.author.id,
          firstName: note.author.firstName,
          lastName: note.author.lastName,
        }
      : null,
  };
}

function flushWorkspaceCache(workspaceId) {
  appCache.flushByPrefix('workspaces:list');
  if (workspaceId) {
    appCache.delete(`workspace:${workspaceId}`);
  }
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function createWorkspace(payload) {
  const { ownerId, name, slug, type = 'agency', timezone = 'UTC', defaultCurrency = 'USD', intakeEmail, settings = {} } = payload;
  if (!ownerId || !name || !slug) {
    throw new ValidationError('ownerId, name, and slug are required.');
  }
  assertWorkspaceType(type);
  if (intakeEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(intakeEmail)) {
    throw new ValidationError('intakeEmail must be a valid email address.');
  }

  const workspace = await sequelize.transaction(async (trx) => {
    const owner = await User.findByPk(ownerId, { transaction: trx });
    if (!owner) {
      throw new NotFoundError('Owner account not found.');
    }

    const existing = await ProviderWorkspace.findOne({ where: { slug }, transaction: trx });
    if (existing) {
      throw new ConflictError('Workspace slug already exists.');
    }

    const createdWorkspace = await ProviderWorkspace.create(
      {
        ownerId,
        name,
        slug,
        type,
        timezone,
        defaultCurrency,
        intakeEmail: intakeEmail ?? null,
        settings,
      },
      { transaction: trx },
    );

    await ProviderWorkspaceMember.create(
      {
        workspaceId: createdWorkspace.id,
        userId: ownerId,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
      },
      { transaction: trx },
    );

    return createdWorkspace;
  });

  flushWorkspaceCache(workspace.id);

  const hydrated = await ProviderWorkspace.findByPk(workspace.id, {
    include: [
      {
        model: ProviderWorkspaceMember,
        as: 'members',
        include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
    ],
  });

  return sanitizeWorkspace(hydrated ?? workspace);
}

export async function listWorkspaces(filters = {}, pagination = {}) {
  const { page = 1, pageSize = 20 } = pagination;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeSize = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const offset = (safePage - 1) * safeSize;

  const cacheKey = buildCacheKey('workspaces:list', { filters, safePage, safeSize });

  return appCache.remember(cacheKey, WORKSPACE_LIST_CACHE_TTL, async () => {
    const where = {};
    if (filters.type) {
      assertWorkspaceType(filters.type);
      where.type = filters.type;
    }
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }
    if (filters.search) {
      const term = filters.search.trim();
      if (term) {
        where[Op.or] = [
          { name: { [Op.iLike ?? Op.like]: `%${term}%` } },
          { slug: { [Op.iLike ?? Op.like]: `%${term}%` } },
        ];
      }
    }

    const { rows, count } = await ProviderWorkspace.findAndCountAll({
      where,
      include: [
        {
          model: ProviderWorkspaceMember,
          as: 'members',
          include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: safeSize,
      offset,
    });

    return {
      data: rows.map((workspace) => sanitizeWorkspace(workspace)),
      pagination: {
        page: safePage,
        pageSize: safeSize,
        total: count,
        totalPages: Math.ceil(count / safeSize) || 1,
      },
    };
  });
}

export async function addMember(workspaceId, userId, role = 'staff', invitedById) {
  assertMemberRole(role);

  const member = await sequelize.transaction(async (trx) => {
    const workspace = await ProviderWorkspace.findByPk(workspaceId, { transaction: trx });
    if (!workspace) {
      throw new NotFoundError('Workspace not found.');
    }

    const existing = await ProviderWorkspaceMember.findOne({
      where: { workspaceId, userId },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });

    if (existing) {
      throw new ConflictError('Member already added to workspace.');
    }

    const created = await ProviderWorkspaceMember.create(
      {
        workspaceId,
        userId,
        role,
        status: 'active',
        invitedById: invitedById ?? workspace.ownerId,
        joinedAt: new Date(),
      },
      { transaction: trx },
    );

    return created;
  });

  flushWorkspaceCache(workspaceId);

  const hydrated = await ProviderWorkspaceMember.findByPk(member.id, {
    include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });

  return sanitizeMember(hydrated ?? member);
}

export async function inviteMember(workspaceId, email, role = 'staff', invitedById, expiresAt) {
  assertMemberRole(role);
  if (!email) {
    throw new ValidationError('Email is required to create an invite.');
  }

  const invite = await sequelize.transaction(async (trx) => {
    const workspace = await ProviderWorkspace.findByPk(workspaceId, { transaction: trx });
    if (!workspace) {
      throw new NotFoundError('Workspace not found.');
    }

    const token = generateToken();
    const created = await ProviderWorkspaceInvite.create(
      {
        workspaceId,
        email,
        role,
        status: 'pending',
        inviteToken: token,
        expiresAt: expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedById: invitedById ?? workspace.ownerId,
      },
      { transaction: trx },
    );

    return created;
  });

  flushWorkspaceCache(workspaceId);

  return sanitizeInvite(invite);
}

export async function acceptInvite(inviteToken, userId) {
  const invite = await sequelize.transaction(async (trx) => {
    const record = await ProviderWorkspaceInvite.findOne({
      where: { inviteToken },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    if (!record) {
      throw new NotFoundError('Invite not found.');
    }
    if (record.status !== 'pending') {
      throw new ConflictError('Invite is no longer active.');
    }
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      throw new ConflictError('Invite has expired.');
    }

    record.status = 'accepted';
    record.acceptedAt = new Date();
    await record.save({ transaction: trx });

    await ProviderWorkspaceMember.findOrCreate({
      where: { workspaceId: record.workspaceId, userId },
      defaults: {
        workspaceId: record.workspaceId,
        userId,
        role: record.role,
        status: 'active',
        invitedById: record.invitedById,
        joinedAt: new Date(),
      },
      transaction: trx,
    });

    return record;
  });

  flushWorkspaceCache(invite.workspaceId);

  return sanitizeInvite(invite);
}

export async function updateMember(workspaceId, userId, patch) {
  const { role, status } = patch;
  if (!role && !status) {
    throw new ValidationError('At least one of role or status must be provided.');
  }
  if (role) {
    assertMemberRole(role);
  }
  if (status) {
    assertMemberStatus(status);
  }

  const member = await sequelize.transaction(async (trx) => {
    const record = await ProviderWorkspaceMember.findOne({
      where: { workspaceId, userId },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    if (!record) {
      throw new NotFoundError('Workspace member not found.');
    }

    if (role) record.role = role;
    if (status) record.status = status;
    if (status === 'active' && !record.joinedAt) {
      record.joinedAt = new Date();
    }
    if (status === 'revoked') {
      record.removedAt = new Date();
    }

    await record.save({ transaction: trx });
    return record;
  });

  flushWorkspaceCache(workspaceId);

  const hydrated = await ProviderWorkspaceMember.findByPk(member.id, {
    include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });

  return sanitizeMember(hydrated ?? member);
}

export async function updateInviteStatus(inviteId, status) {
  assertInviteStatus(status);

  const invite = await sequelize.transaction(async (trx) => {
    const record = await ProviderWorkspaceInvite.findByPk(inviteId, { transaction: trx, lock: trx.LOCK.UPDATE });
    if (!record) {
      throw new NotFoundError('Workspace invite not found.');
    }

    record.status = status;
    if (status === 'revoked') {
      record.expiresAt = new Date();
    }
    await record.save({ transaction: trx });
    return record;
  });

  flushWorkspaceCache(invite.workspaceId);
  return sanitizeInvite(invite);
}

export async function recordContactNote(workspaceId, subjectUserId, authorId, note, visibility = 'internal') {
  assertNoteVisibility(visibility);
  if (!note) {
    throw new ValidationError('Note body is required.');
  }

  const contactNote = await sequelize.transaction(async (trx) => {
    const workspace = await ProviderWorkspace.findByPk(workspaceId, { transaction: trx });
    if (!workspace) {
      throw new NotFoundError('Workspace not found.');
    }

    const created = await ProviderContactNote.create(
      {
        workspaceId,
        subjectUserId,
        authorId,
        note,
        visibility,
      },
      { transaction: trx },
    );

    return created;
  });

  flushWorkspaceCache(workspaceId);

  const hydrated = await ProviderContactNote.findByPk(contactNote.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }],
  });

  return sanitizeContactNote(hydrated ?? contactNote);
}

export default {
  createWorkspace,
  listWorkspaces,
  addMember,
  inviteMember,
  acceptInvite,
  updateMember,
  updateInviteStatus,
  recordContactNote,
};
