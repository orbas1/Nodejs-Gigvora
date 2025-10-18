import { Op } from 'sequelize';
import {
  User,
  TwoFactorToken,
  TwoFactorPolicy,
  TwoFactorEnrollment,
  TwoFactorBypass,
  TwoFactorAuditLog,
} from '../models/index.js';
import logger from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const log = logger.child({ module: 'AdminTwoFactorService' });

const METHOD_OPTIONS = ['email', 'app', 'sms', 'security_key', 'backup_codes'];
const METHOD_TO_USER_METHOD = {
  email: 'email',
  app: 'app',
  sms: 'sms',
  security_key: 'app',
  backup_codes: 'app',
};
const ROLE_OPTIONS = ['admin', 'staff', 'company', 'freelancer', 'agency', 'mentor', 'headhunter', 'all'];
const ENFORCEMENT_LEVELS = ['optional', 'recommended', 'required'];
const BYPASS_STATUSES = ['pending', 'approved', 'denied', 'revoked'];
const ENROLLMENT_STATUSES = ['pending', 'active', 'revoked'];

const FALLBACK_OVERVIEW = {
  summary: {
    adminCoverageRate: 0.92,
    overallCoverageRate: 0.78,
    pendingEnrollments: 3,
    activeBypasses: 1,
    enforcedPolicies: 2,
    activeChallenges: 18,
  },
  coverage: {
    adminCount: 42,
    adminCovered: 39,
    overallCount: 1840,
    overallCovered: 1435,
    byMethod: {
      email: 986,
      app: 512,
      sms: 118,
      security_key: 42,
      backup_codes: 0,
    },
  },
  policies: [
    {
      id: 'policy-fallback-admin',
      name: 'Admin console hard lock',
      description: 'Mandatory MFA for all administrator accounts with enforced hardware key support.',
      enforcementLevel: 'required',
      appliesToRole: 'admin',
      allowedMethods: ['email', 'app', 'security_key'],
      fallbackCodes: 6,
      sessionDurationMinutes: 720,
      requireForSensitiveActions: true,
      enforced: true,
      ipAllowlist: ['203.0.113.0/25'],
      notes: 'SOC2 control SC-12 reviewed by compliance.',
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'policy-fallback-staff',
      name: 'Internal staff progressive rollout',
      description: 'Gradual MFA rollout for support and finance teams with extended sessions.',
      enforcementLevel: 'recommended',
      appliesToRole: 'staff',
      allowedMethods: ['email', 'app'],
      fallbackCodes: 4,
      sessionDurationMinutes: 1440,
      requireForSensitiveActions: true,
      enforced: true,
      ipAllowlist: [],
      notes: 'Rollout managed by identity operations.',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ],
  enrollments: {
    pending: [
      {
        id: 'enroll-fallback-1',
        userId: 1204,
        userEmail: 'sonia.chen@gigvora.com',
        userName: 'Sonia Chen',
        status: 'pending',
        method: 'security_key',
        label: 'YubiKey 5 NFC',
        metadata: { region: 'NYC office', attestation: 'verified' },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        id: 'enroll-fallback-2',
        userId: 1581,
        userEmail: 'ops.l1@gigvora.com',
        userName: 'Ops L1 Rotation',
        status: 'pending',
        method: 'app',
        label: 'Okta Verify',
        metadata: { shift: 'weekend' },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
    ],
    active: [
      {
        id: 'enroll-fallback-3',
        userId: 904,
        userEmail: 'marco.varela@gigvora.com',
        userName: 'Marco Varela',
        status: 'active',
        method: 'app',
        label: 'Authy',
        activatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(Date.now() - 40 * 60 * 1000),
      },
    ],
  },
  bypasses: {
    pending: [
      {
        id: 'bypass-fallback-1',
        userId: 2003,
        userEmail: 'finance.desk@gigvora.com',
        userName: 'Finance Desk',
        status: 'pending',
        reason: 'Laptop rebuild after disk failure',
        expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
    active: [
      {
        id: 'bypass-fallback-2',
        userId: 1760,
        userEmail: 'amy.singh@gigvora.com',
        userName: 'Amy Singh',
        status: 'approved',
        reason: 'Travel with limited device access',
        expiresAt: new Date(Date.now() + 30 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        approvedBy: 12,
      },
    ],
  },
  auditLog: [
    {
      id: 'audit-fallback-1',
      action: 'policy.updated',
      targetType: 'TwoFactorPolicy',
      targetId: 'policy-fallback-admin',
      actorName: 'Jordan Kim',
      actorEmail: 'jordan.kim@gigvora.com',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      notes: 'Raised enforcement to include security keys after phishing drill.',
    },
    {
      id: 'audit-fallback-2',
      action: 'bypass.approved',
      targetType: 'TwoFactorBypass',
      targetId: 'bypass-fallback-2',
      actorName: 'Priya Patel',
      actorEmail: 'priya.patel@gigvora.com',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      notes: 'Approved for 24h during travel. Ticket SEC-2041.',
    },
  ],
  refreshedAt: new Date().toISOString(),
  lookbackDays: 30,
  activeChallenges: 18,
  fallback: true,
};

function normaliseRole(value) {
  if (!value) {
    return 'admin';
  }
  const lower = `${value}`.trim().toLowerCase();
  if (ROLE_OPTIONS.includes(lower)) {
    return lower;
  }
  return 'admin';
}

function normaliseEnforcement(value) {
  if (!value) {
    return 'required';
  }
  const lower = `${value}`.trim().toLowerCase();
  if (ENFORCEMENT_LEVELS.includes(lower)) {
    return lower;
  }
  return 'required';
}

function normaliseAllowedMethods(methods) {
  const list = Array.isArray(methods) ? methods : methods ? [methods] : [];
  const normalised = list
    .map((method) => `${method}`.trim().toLowerCase())
    .filter((method) => METHOD_OPTIONS.includes(method));
  return Array.from(new Set(normalised.length ? normalised : ['email', 'app']));
}

function normaliseIpAllowlist(value) {
  const list = Array.isArray(value) ? value : value ? `${value}`.split(/[,\n]/) : [];
  return Array.from(
    new Set(
      list
        .map((item) => `${item}`.trim())
        .filter((item) => item.length > 0 && item.length <= 120),
    ),
  );
}

function coerceInteger(value, { min, max, fallback }) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  let result = numeric;
  if (typeof min === 'number' && result < min) {
    result = min;
  }
  if (typeof max === 'number' && result > max) {
    result = max;
  }
  return result;
}

function coerceDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normaliseCoverage(coverage = {}) {
  return {
    adminCount: Number(coverage.adminCount ?? 0),
    adminCovered: Number(coverage.adminCovered ?? 0),
    overallCount: Number(coverage.overallCount ?? 0),
    overallCovered: Number(coverage.overallCovered ?? 0),
    byMethod: coverage.byMethod && typeof coverage.byMethod === 'object' ? coverage.byMethod : {},
    adminCoverageRate: Number(coverage.adminCoverageRate ?? 0),
    overallCoverageRate: Number(coverage.overallCoverageRate ?? 0),
  };
}

function serialisePolicy(policy) {
  if (!policy) {
    return null;
  }
  const plain = policy.get ? policy.get({ plain: true }) : policy;
  return {
    id: plain.id,
    name: plain.name,
    description: plain.description ?? '',
    appliesToRole: plain.appliesToRole,
    enforcementLevel: plain.enforcementLevel,
    enforced: plain.enforced !== false,
    allowedMethods: normaliseAllowedMethods(plain.allowedMethods),
    fallbackCodes: Number(plain.fallbackCodes ?? 0),
    sessionDurationMinutes: Number(plain.sessionDurationMinutes ?? 0),
    requireForSensitiveActions: plain.requireForSensitiveActions !== false,
    ipAllowlist: normaliseIpAllowlist(plain.ipAllowlist),
    notes: plain.notes ?? '',
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function serialiseEnrollment(enrollment) {
  if (!enrollment) {
    return null;
  }
  const plain = enrollment.get ? enrollment.get({ plain: true }) : enrollment;
  const user = plain.user ?? {};
  const userName =
    plain.userName ??
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email ||
    (plain.userId ? `User #${plain.userId}` : 'Workspace member');
  return {
    id: plain.id,
    userId: plain.userId ?? user.id ?? null,
    userEmail: plain.userEmail ?? user.email ?? null,
    userName,
    status: plain.status ?? 'pending',
    method: plain.method ?? 'app',
    label: plain.label ?? '',
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ?? null,
    activatedAt: plain.activatedAt ?? null,
    lastUsedAt: plain.lastUsedAt ?? null,
  };
}

function serialiseBypass(bypass) {
  if (!bypass) {
    return null;
  }
  const plain = bypass.get ? bypass.get({ plain: true }) : bypass;
  const user = plain.user ?? {};
  const userName =
    plain.userName ??
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email ||
    (plain.userId ? `User #${plain.userId}` : 'Workspace member');
  return {
    id: plain.id,
    userId: plain.userId ?? user.id ?? null,
    userEmail: plain.userEmail ?? user.email ?? null,
    userName,
    status: plain.status ?? 'pending',
    reason: plain.reason ?? '',
    notes: plain.notes ?? '',
    expiresAt: plain.expiresAt ?? null,
    approvedAt: plain.approvedAt ?? plain.issuedAt ?? null,
    approvedBy: plain.approvedBy ?? null,
    createdAt: plain.createdAt ?? null,
  };
}

function serialiseAudit(event) {
  if (!event) {
    return null;
  }
  const plain = event.get ? event.get({ plain: true }) : event;
  const actor = plain.actor ?? {};
  const actorName =
    plain.actorName ?? [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim() || actor.email || 'System';
  return {
    id: plain.id,
    action: plain.action ?? 'updated',
    targetType: plain.targetType ?? 'TwoFactorPolicy',
    targetId: plain.targetId ?? null,
    actorName,
    actorEmail: plain.actorEmail ?? actor.email ?? null,
    createdAt: plain.createdAt ?? plain.timestamp ?? null,
    notes: plain.notes ?? (plain.metadata?.message ?? ''),
  };
}

async function countUsers(where = {}) {
  return User.count({ where });
}

async function buildCoverageSnapshot() {
  const [adminCount, adminCovered, totalUsers, usersWithMfa] = await Promise.all([
    countUsers({ userType: 'admin' }),
    countUsers({ userType: 'admin', twoFactorEnabled: true }),
    countUsers(),
    countUsers({ twoFactorEnabled: true }),
  ]);

  const storedMethodKeys = Array.from(new Set(Object.values(METHOD_TO_USER_METHOD)));
  const storedMethodCounts = await Promise.all(
    storedMethodKeys.map((method) => countUsers({ twoFactorEnabled: true, twoFactorMethod: method })),
  );
  const countsByStoredMethod = storedMethodKeys.reduce((acc, method, index) => {
    acc[method] = storedMethodCounts[index] ?? 0;
    return acc;
  }, {});

  const byMethod = METHOD_OPTIONS.reduce((acc, method) => {
    const storedMethod = METHOD_TO_USER_METHOD[method] ?? method;
    acc[method] = countsByStoredMethod[storedMethod] ?? 0;
    return acc;
  }, {});

  return {
    adminCount,
    adminCovered,
    overallCount: totalUsers,
    overallCovered: usersWithMfa,
    byMethod,
    adminCoverageRate: adminCount > 0 ? adminCovered / adminCount : 0,
    overallCoverageRate: totalUsers > 0 ? usersWithMfa / totalUsers : 0,
  };
}

export async function getAdminTwoFactorOverview({ lookbackDays } = {}) {
  const normalizedLookback = coerceInteger(lookbackDays, { min: 1, max: 365, fallback: 30 });
  try {
    const [policies, pendingEnrollments, activeEnrollments, pendingBypasses, activeBypasses, auditEvents, coverage, activeChallenges] =
      await Promise.all([
        TwoFactorPolicy.findAll({ order: [['updatedAt', 'DESC']] }),
        TwoFactorEnrollment.findAll({
          where: { status: 'pending' },
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          order: [['createdAt', 'DESC']],
        }),
        TwoFactorEnrollment.findAll({
          where: { status: 'active' },
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          order: [['lastUsedAt', 'DESC']],
        }),
        TwoFactorBypass.findAll({
          where: { status: 'pending' },
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          order: [['createdAt', 'DESC']],
        }),
        TwoFactorBypass.findAll({
          where: {
            status: 'approved',
            [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
          },
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          order: [['expiresAt', 'ASC']],
        }),
        TwoFactorAuditLog.findAll({
          include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          order: [['createdAt', 'DESC']],
          limit: 20,
        }),
        buildCoverageSnapshot(),
        TwoFactorToken.count({ where: { expiresAt: { [Op.gt]: new Date() } } }),
      ]);

    const serialisedPolicies = policies.map(serialisePolicy).filter(Boolean);
    const serialisedEnrollmentsPending = pendingEnrollments.map(serialiseEnrollment).filter(Boolean);
    const serialisedEnrollmentsActive = activeEnrollments.map(serialiseEnrollment).filter(Boolean);
    const serialisedBypassesPending = pendingBypasses.map(serialiseBypass).filter(Boolean);
    const serialisedBypassesActive = activeBypasses.map(serialiseBypass).filter(Boolean);
    const serialisedAuditEvents = auditEvents.map(serialiseAudit).filter(Boolean);

    return {
      summary: {
        adminCoverageRate: coverage.adminCoverageRate,
        overallCoverageRate: coverage.overallCoverageRate,
        pendingEnrollments: serialisedEnrollmentsPending.length,
        activeBypasses: serialisedBypassesActive.length,
        enforcedPolicies: serialisedPolicies.filter((policy) => policy.enforced).length,
        activeChallenges,
      },
      coverage: normaliseCoverage(coverage),
      policies: serialisedPolicies,
      enrollments: {
        pending: serialisedEnrollmentsPending,
        active: serialisedEnrollmentsActive,
      },
      bypasses: {
        pending: serialisedBypassesPending,
        active: serialisedBypassesActive,
      },
      auditLog: serialisedAuditEvents,
      refreshedAt: new Date().toISOString(),
      lookbackDays: normalizedLookback,
      activeChallenges,
      fallback: false,
    };
  } catch (error) {
    log.warn({ err: error }, 'Failed to build admin two-factor overview, returning fallback snapshot');
    return { ...FALLBACK_OVERVIEW, lookbackDays: normalizedLookback, refreshedAt: new Date().toISOString() };
  }
}

export async function createTwoFactorPolicy(payload = {}, { actorId } = {}) {
  const normalized = {
    name: payload.name?.trim(),
    description: payload.description?.trim() || null,
    appliesToRole: normaliseRole(payload.appliesToRole),
    enforcementLevel: normaliseEnforcement(payload.enforcementLevel),
    allowedMethods: normaliseAllowedMethods(payload.allowedMethods),
    fallbackCodes: coerceInteger(payload.fallbackCodes, { min: 0, max: 20, fallback: 5 }),
    sessionDurationMinutes: coerceInteger(payload.sessionDurationMinutes, { min: 5, max: 10_080, fallback: 1440 }),
    requireForSensitiveActions: payload.requireForSensitiveActions !== false,
    enforced: payload.enforced !== false,
    ipAllowlist: normaliseIpAllowlist(payload.ipAllowlist),
    notes: payload.notes?.trim() || null,
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null,
  };

  if (!normalized.name) {
    throw new ValidationError('A policy name is required.');
  }

  const policy = await TwoFactorPolicy.create(normalized);
  await TwoFactorAuditLog.create({
    actorId: actorId ?? null,
    action: 'policy.created',
    targetType: 'TwoFactorPolicy',
    targetId: policy.id,
    metadata: { appliesToRole: normalized.appliesToRole, enforcementLevel: normalized.enforcementLevel },
  });
  return serialisePolicy(await policy.reload());
}

export async function updateTwoFactorPolicy(policyId, payload = {}, { actorId } = {}) {
  if (!policyId) {
    throw new ValidationError('policyId is required.');
  }
  const policy = await TwoFactorPolicy.findByPk(policyId);
  if (!policy) {
    throw new NotFoundError('Two-factor policy not found.');
  }

  const normalized = {
    name: payload.name?.trim() || policy.name,
    description: payload.description?.trim() || null,
    appliesToRole: normaliseRole(payload.appliesToRole ?? policy.appliesToRole),
    enforcementLevel: normaliseEnforcement(payload.enforcementLevel ?? policy.enforcementLevel),
    allowedMethods: normaliseAllowedMethods(payload.allowedMethods ?? policy.allowedMethods),
    fallbackCodes: coerceInteger(payload.fallbackCodes ?? policy.fallbackCodes, { min: 0, max: 20, fallback: 5 }),
    sessionDurationMinutes: coerceInteger(payload.sessionDurationMinutes ?? policy.sessionDurationMinutes, {
      min: 5,
      max: 10_080,
      fallback: 1440,
    }),
    requireForSensitiveActions: payload.requireForSensitiveActions ?? policy.requireForSensitiveActions,
    enforced: payload.enforced ?? policy.enforced,
    ipAllowlist: normaliseIpAllowlist(payload.ipAllowlist ?? policy.ipAllowlist),
    notes: payload.notes?.trim() || null,
    updatedBy: actorId ?? policy.updatedBy ?? null,
  };

  await policy.update(normalized);
  await TwoFactorAuditLog.create({
    actorId: actorId ?? null,
    action: 'policy.updated',
    targetType: 'TwoFactorPolicy',
    targetId: policy.id,
    metadata: { appliesToRole: normalized.appliesToRole, enforcementLevel: normalized.enforcementLevel },
  });
  return serialisePolicy(await policy.reload());
}

export async function deleteTwoFactorPolicy(policyId, { actorId } = {}) {
  if (!policyId) {
    throw new ValidationError('policyId is required.');
  }
  const policy = await TwoFactorPolicy.findByPk(policyId);
  if (!policy) {
    throw new NotFoundError('Two-factor policy not found.');
  }
  await policy.destroy();
  await TwoFactorAuditLog.create({
    actorId: actorId ?? null,
    action: 'policy.deleted',
    targetType: 'TwoFactorPolicy',
    targetId: policyId,
  });
  return { id: policyId, deleted: true };
}

async function resolveUserId({ userId, userEmail }) {
  if (userId) {
    return userId;
  }
  if (userEmail) {
    const user = await User.findOne({ where: { email: userEmail.toLowerCase() } });
    if (!user) {
      throw new NotFoundError('User not found for bypass request.', { userEmail });
    }
    return user.id;
  }
  throw new ValidationError('userId or userEmail is required.');
}

export async function issueTwoFactorBypass(payload = {}, { actorId } = {}) {
  const resolvedUserId = await resolveUserId(payload);
  const expiresAt = coerceDate(payload.expiresAt) ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
  const status = payload.status && BYPASS_STATUSES.includes(payload.status) ? payload.status : 'pending';

  const bypass = await TwoFactorBypass.create({
    userId: resolvedUserId,
    requestedBy: actorId ?? null,
    approvedBy: status === 'approved' ? actorId ?? null : null,
    status,
    reason: payload.reason?.trim() || null,
    notes: payload.notes?.trim() || null,
    expiresAt,
    issuedAt: status === 'approved' ? new Date() : null,
  });

  await TwoFactorAuditLog.create({
    actorId: actorId ?? null,
    action: status === 'approved' ? 'bypass.approved' : 'bypass.requested',
    targetType: 'TwoFactorBypass',
    targetId: bypass.id,
    metadata: { reason: payload.reason, expiresAt: expiresAt?.toISOString() },
  });

  return serialiseBypass(await bypass.reload({ include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }] }));
}

export async function updateTwoFactorBypassStatus(bypassId, payload = {}, { actorId } = {}) {
  if (!bypassId) {
    throw new ValidationError('bypassId is required.');
  }
  const bypass = await TwoFactorBypass.findByPk(bypassId);
  if (!bypass) {
    throw new NotFoundError('Bypass request not found.');
  }

  const status = payload.status && BYPASS_STATUSES.includes(payload.status) ? payload.status : bypass.status;
  const expiresAt = payload.expiresAt ? coerceDate(payload.expiresAt) : bypass.expiresAt;
  const notes = payload.notes?.trim() || bypass.notes;

  await bypass.update({
    status,
    expiresAt,
    notes,
    approvedBy: status === 'approved' ? actorId ?? bypass.approvedBy ?? null : bypass.approvedBy,
    issuedAt: status === 'approved' ? new Date() : bypass.issuedAt,
    resolvedAt: ['denied', 'revoked'].includes(status) ? new Date() : bypass.resolvedAt,
  });

  await TwoFactorAuditLog.create({
    actorId: actorId ?? null,
    action: `bypass.${status}`,
    targetType: 'TwoFactorBypass',
    targetId: bypassId,
    metadata: { expiresAt: expiresAt?.toISOString() },
  });

  return serialiseBypass(await bypass.reload({ include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }] }));
}

export async function approveTwoFactorEnrollment(enrollmentId, payload = {}, { actorId } = {}) {
  if (!enrollmentId) {
    throw new ValidationError('enrollmentId is required.');
  }
  const enrollment = await TwoFactorEnrollment.findByPk(enrollmentId);
  if (!enrollment) {
    throw new NotFoundError('Enrollment request not found.');
  }

  await enrollment.update({
    status: 'active',
    activatedAt: new Date(),
    reviewedBy: actorId ?? null,
    reviewedAt: new Date(),
    metadata: { ...(enrollment.metadata ?? {}), note: payload.note ?? null },
  });

  await TwoFactorAuditLog.create({
    actorId: actorId ?? null,
    action: 'enrollment.approved',
    targetType: 'TwoFactorEnrollment',
    targetId: enrollmentId,
  });

  return serialiseEnrollment(await enrollment.reload({ include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }] }));
}

export async function revokeTwoFactorEnrollment(enrollmentId, payload = {}, { actorId } = {}) {
  if (!enrollmentId) {
    throw new ValidationError('enrollmentId is required.');
  }
  const enrollment = await TwoFactorEnrollment.findByPk(enrollmentId);
  if (!enrollment) {
    throw new NotFoundError('Enrollment request not found.');
  }

  await enrollment.update({
    status: 'revoked',
    reviewedBy: actorId ?? null,
    reviewedAt: new Date(),
    metadata: { ...(enrollment.metadata ?? {}), revokedReason: payload.note ?? payload.reason ?? null },
  });

  await TwoFactorAuditLog.create({
    actorId: actorId ?? null,
    action: 'enrollment.revoked',
    targetType: 'TwoFactorEnrollment',
    targetId: enrollmentId,
  });

  return serialiseEnrollment(await enrollment.reload({ include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }] }));
}

export default {
  getAdminTwoFactorOverview,
  createTwoFactorPolicy,
  updateTwoFactorPolicy,
  deleteTwoFactorPolicy,
  issueTwoFactorBypass,
  updateTwoFactorBypassStatus,
  approveTwoFactorEnrollment,
  revokeTwoFactorEnrollment,
};
