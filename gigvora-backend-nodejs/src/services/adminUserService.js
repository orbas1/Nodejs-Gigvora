import crypto from 'node:crypto';
import {
  Op,
  fn,
  col,
  literal,
} from 'sequelize';

import { User, Profile, UserLoginAudit, UserRole, UserNote, USER_STATUSES } from '../models/index.js';
import { getAuthDomainService } from '../domains/serviceCatalog.js';
import { normalizeLocationPayload } from '../utils/location.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_RECENT_AUDIT_LIMIT = 25;
const authDomainService = getAuthDomainService();

const SORT_MAP = new Map([
  ['created_desc', [['createdAt', 'DESC']]],
  ['created_asc', [['createdAt', 'ASC']]],
  ['name_asc', [
    ['lastName', 'ASC'],
    ['firstName', 'ASC'],
  ]],
  ['name_desc', [
    ['lastName', 'DESC'],
    ['firstName', 'DESC'],
  ]],
  ['last_login_desc', [['lastLoginAt', 'DESC']]],
  ['last_login_asc', [['lastLoginAt', 'ASC']]],
]);

function coerceLimit(value) {
  const numeric = Number.parseInt(value ?? `${DEFAULT_LIMIT}`, 10);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(numeric, 1), MAX_LIMIT);
}

function coerceOffset(value) {
  const numeric = Number.parseInt(value ?? '0', 10);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return numeric;
}

function resolveSort(sort) {
  if (typeof sort !== 'string' || !sort.trim()) {
    return SORT_MAP.get('created_desc');
  }
  const key = sort.trim().toLowerCase();
  return SORT_MAP.get(key) ?? SORT_MAP.get('created_desc');
}

function buildSearchWhere(search) {
  if (!search || typeof search !== 'string') {
    return null;
  }
  const value = search.trim();
  if (!value) {
    return null;
  }
  return {
    [Op.or]: [
      { firstName: { [Op.iLike ?? Op.like]: `%${value}%` } },
      { lastName: { [Op.iLike ?? Op.like]: `%${value}%` } },
      { email: { [Op.iLike ?? Op.like]: `%${value}%` } },
      { phoneNumber: { [Op.iLike ?? Op.like]: `%${value}%` } },
    ],
  };
}

function sanitizeUserRecord(userInstance) {
  const sanitized = authDomainService.sanitizeUser(userInstance);
  const profile = userInstance.Profile
    ? {
        headline: userInstance.Profile.headline ?? null,
        location: userInstance.Profile.location ?? null,
        availabilityStatus: userInstance.Profile.availabilityStatus ?? null,
      }
    : null;
  const roles = Array.isArray(userInstance.roleAssignments)
    ? userInstance.roleAssignments.map((assignment) => assignment.role).filter(Boolean)
    : sanitized.roles ?? [];

  return {
    ...sanitized,
    roles,
    jobTitle: sanitized.jobTitle ?? userInstance.jobTitle ?? null,
    phoneNumber: sanitized.phoneNumber ?? userInstance.phoneNumber ?? null,
    status: sanitized.status ?? userInstance.status ?? 'active',
    twoFactorEnabled: userInstance.twoFactorEnabled !== false,
    twoFactorMethod: userInstance.twoFactorMethod || sanitized.twoFactorMethod || 'email',
    createdAt: userInstance.createdAt?.toISOString?.() ?? null,
    updatedAt: userInstance.updatedAt?.toISOString?.() ?? null,
    lastLoginAt: userInstance.lastLoginAt?.toISOString?.() ?? sanitized.lastLoginAt ?? null,
    lastSeenAt: userInstance.lastSeenAt?.toISOString?.() ?? sanitized.lastSeenAt ?? null,
    profile,
  };
}

async function computeSummary() {
  const [statusRows, typeRows, roleRows, twoFactorRows] = await Promise.all([
    User.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    User.findAll({
      attributes: ['userType', [fn('COUNT', col('id')), 'count']],
      group: ['userType'],
      raw: true,
    }),
    UserRole.findAll({
      attributes: ['role', [fn('COUNT', col('role')), 'count']],
      group: ['role'],
      raw: true,
    }),
    User.findAll({
      attributes: [
        'twoFactorEnabled',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['twoFactorEnabled'],
      raw: true,
    }),
  ]);

  const status = Object.fromEntries(
    statusRows.map((row) => [row.status ?? 'unknown', Number.parseInt(row.count, 10) || 0]),
  );
  const membership = Object.fromEntries(
    typeRows.map((row) => [row.userType ?? 'user', Number.parseInt(row.count, 10) || 0]),
  );
  const roles = Object.fromEntries(
    roleRows.map((row) => [row.role ?? 'user', Number.parseInt(row.count, 10) || 0]),
  );
  const twoFactor = twoFactorRows.reduce(
    (acc, row) => {
      const enabled = row.twoFactorEnabled !== false && row.twoFactorEnabled !== 0;
      const count = Number.parseInt(row.count, 10) || 0;
      if (enabled) {
        acc.enabled += count;
      } else {
        acc.disabled += count;
      }
      return acc;
    },
    { enabled: 0, disabled: 0 },
  );

  const total = Object.values(status).reduce((sum, value) => sum + value, 0);

  return {
    total,
    status,
    membership,
    roles,
    twoFactor,
    refreshedAt: new Date().toISOString(),
  };
}

export async function listUsers(filters = {}) {
  const limit = coerceLimit(filters.limit);
  const offset = coerceOffset(filters.offset);
  const order = resolveSort(filters.sort);

  const where = {};
  if (filters.status) {
    where.status = authDomainService.normalizeStatus(filters.status);
  }
  if (filters.membership) {
    where.userType = `${filters.membership}`.trim().toLowerCase();
  }

  const searchWhere = buildSearchWhere(filters.search);
  if (searchWhere) {
    where[Op.and] = where[Op.and] ? [where[Op.and], searchWhere] : searchWhere;
  }

  const roleFilter = filters.role ? authDomainService.normalizeRole(filters.role) : null;

  const include = [
    {
      model: Profile,
      required: false,
      attributes: ['headline', 'location', 'availabilityStatus'],
    },
    {
      model: UserRole,
      as: 'roleAssignments',
      required: Boolean(roleFilter),
      where: roleFilter ? { role: roleFilter } : undefined,
      attributes: ['role'],
    },
  ];

  const { rows, count } = await User.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order,
    distinct: true,
  });

  const items = rows.map((row) => sanitizeUserRecord(row));
  const summary = await computeSummary();

  return {
    items,
    pagination: { limit, offset, total: count },
    summary,
    filters: {
      status: filters.status ? authDomainService.normalizeStatus(filters.status) : undefined,
      membership: filters.membership ?? undefined,
      role: roleFilter ?? undefined,
    },
  };
}

export async function getUser(userId, { includeNotesLimit = DEFAULT_RECENT_AUDIT_LIMIT } = {}) {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Profile,
        required: false,
      },
      {
        model: UserRole,
        as: 'roleAssignments',
        required: false,
        include: [
          {
            model: User,
            as: 'assignedByUser',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
        order: [['assignedAt', 'DESC']],
      },
      {
        model: UserLoginAudit,
        as: 'loginAudits',
        separate: true,
        limit: DEFAULT_RECENT_AUDIT_LIMIT,
        order: [['createdAt', 'DESC']],
      },
      {
        model: UserNote,
        as: 'notes',
        separate: true,
        limit: includeNotesLimit,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
    ],
  });

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const record = sanitizeUserRecord(user);

  record.roleAssignments = Array.isArray(user.roleAssignments)
    ? user.roleAssignments.map((assignment) => ({
        role: assignment.role,
        assignedAt: assignment.assignedAt?.toISOString?.() ?? null,
        assignedBy: assignment.assignedByUser
          ? {
              id: assignment.assignedByUser.id,
              firstName: assignment.assignedByUser.firstName,
              lastName: assignment.assignedByUser.lastName,
              email: assignment.assignedByUser.email,
            }
          : null,
      }))
    : [];

  record.loginAudits = Array.isArray(user.loginAudits)
    ? user.loginAudits.map((audit) => ({
        id: audit.id,
        eventType: audit.eventType,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        metadata: audit.metadata,
        createdAt: audit.createdAt?.toISOString?.() ?? null,
      }))
    : [];

  record.notes = Array.isArray(user.notes)
    ? user.notes.map((note) => ({
        id: note.id,
        body: note.body,
        visibility: note.visibility,
        metadata: note.metadata ?? null,
        createdAt: note.createdAt?.toISOString?.() ?? null,
        updatedAt: note.updatedAt?.toISOString?.() ?? null,
        author: note.author
          ? {
              id: note.author.id,
              firstName: note.author.firstName,
              lastName: note.author.lastName,
              email: note.author.email,
            }
          : null,
      }))
    : [];

  return record;
}

export async function createUser(payload, { actorId } = {}) {
  const creationPayload = { ...payload };
  const roles = Array.isArray(creationPayload.roles) ? [...creationPayload.roles] : [];
  delete creationPayload.roles;

  const user = await authDomainService.registerUser(creationPayload);

  if (roles.length) {
    try {
      await authDomainService.replaceRoles(user.id, roles, { actorId });
    } catch (error) {
      logger.warn({ err: error, userId: user.id }, 'Failed to assign roles during user creation');
    }
  }

  return getUser(user.id);
}

export async function updateUser(userId, patch = {}) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const updates = {};

  if (patch.email && patch.email !== user.email) {
    const email = authDomainService.validateEmail(patch.email);
    await authDomainService.ensureUniqueEmail(email);
    updates.email = email;
  }

  if (patch.firstName != null) {
    updates.firstName = `${patch.firstName}`.trim();
  }
  if (patch.lastName != null) {
    updates.lastName = `${patch.lastName}`.trim();
  }
  if (patch.address !== undefined) {
    updates.address = patch.address ?? null;
  }
  if (patch.phoneNumber !== undefined) {
    updates.phoneNumber = patch.phoneNumber ?? null;
  }
  if (patch.jobTitle !== undefined) {
    updates.jobTitle = patch.jobTitle ?? null;
  }
  if (patch.avatarUrl !== undefined) {
    updates.avatarUrl = patch.avatarUrl ?? null;
  }
  if (patch.userType) {
    updates.userType = `${patch.userType}`.trim().toLowerCase();
  }
  if (patch.status) {
    updates.status = authDomainService.normalizeStatus(patch.status);
  }
  if (patch.age !== undefined) {
    updates.age = patch.age ?? null;
  }

  if (patch.location !== undefined || patch.geoLocation !== undefined) {
    const locationPayload = normalizeLocationPayload({
      location: patch.location ?? user.location,
      geoLocation: patch.geoLocation ?? user.geoLocation,
    });
    if (patch.location !== undefined) {
      updates.location = locationPayload.location;
      if (patch.geoLocation === undefined && locationPayload.location == null) {
        updates.geoLocation = null;
      }
    }
    if (patch.geoLocation !== undefined) {
      updates.geoLocation = locationPayload.geoLocation;
      if (patch.location === undefined && locationPayload.location != null) {
        updates.location = locationPayload.location;
      }
    }
  }

  if (Object.keys(updates).length) {
    await user.update(updates);
  }

  return getUser(userId);
}

export async function updateSecurity(userId, patch = {}) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  const { twoFactorEnabled, twoFactorMethod } = authDomainService.normalizeTwoFactorPreference(patch);
  await user.update({ twoFactorEnabled, twoFactorMethod });
  return getUser(userId);
}

export async function updateStatus(userId, { status, reason, actorId } = {}) {
  if (!status) {
    throw new ValidationError('Status is required.');
  }
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  const normalised = authDomainService.normalizeStatus(status);
  await user.update({ status: normalised });
  if (reason) {
    await authDomainService.recordUserNote(
      userId,
      {
        authorId: actorId ?? null,
        body: `Status changed to ${normalised}: ${reason}`,
        visibility: 'internal',
        metadata: { event: 'status_change' },
      },
      {},
    );
  }
  return getUser(userId);
}

export async function updateRoles(userId, roles = [], { actorId } = {}) {
  await authDomainService.replaceRoles(userId, roles, { actorId });
  return getUser(userId);
}

export async function removeRole(userId, role) {
  await authDomainService.removeRole(userId, role);
  return getUser(userId);
}

function generateRandomPassword() {
  const base = crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  const suffix = crypto.randomInt(10, 99);
  return `${base}${suffix}!`; // ensures special char presence
}

export async function resetPassword(userId, { password, rotateSessions } = {}) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  const nextPassword = password && password.trim() ? password.trim() : generateRandomPassword();
  const hashed = await authDomainService.hashPassword(nextPassword);
  await user.update({ password: hashed });

  if (rotateSessions) {
    await UserLoginAudit.create({
      userId,
      eventType: 'security.password_rotated',
      metadata: { rotatedByAdmin: true },
    });
  }

  return { userId, password: nextPassword, rotatedSessions: Boolean(rotateSessions) };
}

export async function createNote(userId, payload = {}, { actorId } = {}) {
  const { body, visibility = 'internal', metadata } = payload;
  const note = await authDomainService.recordUserNote(
    userId,
    { authorId: actorId ?? null, body, visibility, metadata },
    {},
  );
  return note;
}

export async function listNotes(userId, options = {}) {
  return authDomainService.listUserNotes(userId, options);
}

export async function getMetadata() {
  const summary = await computeSummary();
  return {
    roles: Object.keys(summary.roles ?? {}).sort(),
    statuses: USER_STATUSES,
    memberships: Object.keys(summary.membership ?? {}).sort(),
  };
}

export default {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateSecurity,
  updateStatus,
  updateRoles,
  removeRole,
  resetPassword,
  createNote,
  listNotes,
  getMetadata,
};

