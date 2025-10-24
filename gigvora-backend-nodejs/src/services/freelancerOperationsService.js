import {
  User,
  FreelancerOperationsMembership,
  FreelancerOperationsWorkflow,
  FreelancerOperationsNotice,
  FreelancerOperationsSnapshot,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'freelancer:operations-hq';
const CACHE_TTL_SECONDS = 45;
const ALLOWED_MEMBERSHIP_STATUSES = new Set(['active', 'invited', 'available', 'requested', 'suspended']);
const ALLOWED_NOTICE_TONES = new Set(['info', 'warning', 'alert', 'critical']);
const RISKY_WORKFLOW_STATUSES = new Set(['at-risk', 'blocked', 'overdue']);

function normalizeFreelancerId(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return numeric;
}

async function ensureFreelancerExists(freelancerId) {
  const user = await User.findByPk(freelancerId);
  if (!user) {
    throw new NotFoundError('Freelancer not found.', { freelancerId });
  }
  if (user.userType && user.userType !== 'freelancer') {
    throw new ValidationError('Operations HQ is only available for freelancer accounts.');
  }
  return user;
}

function sanitizeSlug(value, { label }) {
  if (value == null) {
    throw new ValidationError(`${label} is required.`);
  }
  if (Number.isInteger(value)) {
    throw new ValidationError(`${label} cannot be a numeric identifier.`);
  }
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) {
    throw new ValidationError(`${label} is invalid.`);
  }
  return slug;
}

function resolveIdentifier(value, { label }) {
  if (value == null) {
    throw new ValidationError(`${label} is required.`);
  }
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric > 0) {
    return { mode: 'id', value: numeric };
  }
  return { mode: 'slug', value: sanitizeSlug(value, { label }) };
}

function toPlainMembership(instance) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });
  return {
    id: plain.slug ?? String(plain.id),
    slug: plain.slug ?? null,
    name: plain.name,
    status: plain.status,
    role: plain.role,
    description: plain.description,
    requestedAt: plain.requestedAt ? new Date(plain.requestedAt).toISOString() : null,
    activatedAt: plain.activatedAt ? new Date(plain.activatedAt).toISOString() : null,
    lastReviewedAt: plain.lastReviewedAt ? new Date(plain.lastReviewedAt).toISOString() : null,
    metadata: plain.metadata ?? {},
  };
}

function toPlainWorkflow(instance) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });
  return {
    id: plain.slug ?? String(plain.id),
    slug: plain.slug ?? null,
    title: plain.title,
    status: plain.status,
    completion: Number.isFinite(plain.completion) ? Number(plain.completion) : 0,
    dueAt: plain.dueAt ? new Date(plain.dueAt).toISOString() : null,
    blockers: Array.isArray(plain.blockers) ? plain.blockers : [],
    metadata: plain.metadata ?? {},
  };
}

function toPlainNotice(instance) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });
  return {
    id: plain.slug ?? String(plain.id),
    slug: plain.slug ?? null,
    tone: ALLOWED_NOTICE_TONES.has(plain.tone) ? plain.tone : 'info',
    title: plain.title,
    message: plain.message,
    acknowledged: Boolean(plain.acknowledged),
    acknowledgedAt: plain.acknowledgedAt ? new Date(plain.acknowledgedAt).toISOString() : null,
    expiresAt: plain.expiresAt ? new Date(plain.expiresAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    metadata: plain.metadata ?? {},
  };
}

function buildMetrics(snapshot, workflows, notices) {
  const escalationsFromWorkflows = workflows.filter((workflow) => RISKY_WORKFLOW_STATUSES.has(workflow.status)).length;
  const escalationsFromNotices = notices.filter(
    (notice) => !notice.acknowledged && (notice.tone === 'warning' || notice.tone === 'critical'),
  ).length;

  return {
    activeWorkflows: snapshot.activeWorkflows ?? workflows.length,
    escalations: Math.max(snapshot.escalations ?? 0, escalationsFromWorkflows + escalationsFromNotices),
    automationCoverage: snapshot.automationCoverage != null ? Number(snapshot.automationCoverage) : 0,
    complianceScore: snapshot.complianceScore != null ? Number(snapshot.complianceScore) : 0,
    lastSyncedAt: snapshot.lastSyncedAt ? new Date(snapshot.lastSyncedAt).toISOString() : null,
    currency: snapshot.currency ?? 'USD',
  };
}

function buildCompliance(snapshot) {
  return {
    outstandingTasks: snapshot.outstandingTasks ?? 0,
    recentApprovals: snapshot.recentApprovals ?? 0,
    nextReviewAt: snapshot.nextReviewAt ? new Date(snapshot.nextReviewAt).toISOString() : null,
  };
}

function flushCache() {
  appCache.flushByPrefix(`${CACHE_NAMESPACE}:`);
}

export async function getFreelancerOperationsHq(freelancerId, { bypassCache = false } = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { freelancerId: normalizedId });

  const resolver = async () => {
    await ensureFreelancerExists(normalizedId);
    const [memberships, workflows, notices, snapshotInstance] = await Promise.all([
      FreelancerOperationsMembership.findAll({
        where: { freelancerId: normalizedId },
        order: [
          ['status', 'ASC'],
          ['name', 'ASC'],
        ],
      }),
      FreelancerOperationsWorkflow.findAll({
        where: { freelancerId: normalizedId },
        order: [
          ['dueAt', 'ASC'],
          ['createdAt', 'DESC'],
        ],
      }),
      FreelancerOperationsNotice.findAll({
        where: { freelancerId: normalizedId },
        order: [['createdAt', 'DESC']],
      }),
      FreelancerOperationsSnapshot.findOrCreate({
        where: { freelancerId: normalizedId },
        defaults: { freelancerId: normalizedId },
      }).then(([snapshot]) => snapshot),
    ]);

    const membershipPayload = memberships.map(toPlainMembership);
    const workflowPayload = workflows.map(toPlainWorkflow);
    const noticePayload = notices.map(toPlainNotice);
    const metrics = buildMetrics(snapshotInstance, workflowPayload, noticePayload);
    const compliance = buildCompliance(snapshotInstance);

    return {
      memberships: membershipPayload,
      workflows: workflowPayload,
      notices: noticePayload,
      metrics,
      compliance,
    };
  };

  if (bypassCache) {
    return resolver();
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, resolver);
}

async function findMembershipInstance(freelancerId, identifier, { transaction }) {
  if (identifier.mode === 'id') {
    return FreelancerOperationsMembership.findOne({
      where: { id: identifier.value, freelancerId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }
  return FreelancerOperationsMembership.findOne({
    where: { freelancerId, slug: identifier.value },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

function coerceStatus(status) {
  if (!status) {
    return null;
  }
  const candidate = String(status).trim().toLowerCase();
  if (!ALLOWED_MEMBERSHIP_STATUSES.has(candidate)) {
    throw new ValidationError('Unsupported membership status.');
  }
  return candidate;
}

function coerceTone(tone) {
  if (!tone) {
    return 'info';
  }
  const candidate = String(tone).trim().toLowerCase();
  return ALLOWED_NOTICE_TONES.has(candidate) ? candidate : 'info';
}

export async function requestFreelancerOperationsMembership(
  freelancerId,
  membershipIdentifier,
  payload = {},
) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const identifier = resolveIdentifier(membershipIdentifier, { label: 'membershipId' });

  const sequelize = FreelancerOperationsMembership.sequelize;
  return sequelize.transaction(async (transaction) => {
    let membership = await findMembershipInstance(normalizedId, identifier, { transaction });

    if (!membership && identifier.mode === 'id') {
      throw new NotFoundError('Membership not found.', {
        freelancerId: normalizedId,
        membershipId: membershipIdentifier,
      });
    }

    if (!membership) {
      const slug = identifier.value;
      const name = payload.name && typeof payload.name === 'string' ? payload.name.trim() : null;
      membership = await FreelancerOperationsMembership.create(
        {
          freelancerId: normalizedId,
          slug,
          name: name || slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          status: 'requested',
          role: payload.requestedRole?.trim?.() ?? null,
          description: payload.reason?.trim?.() ?? payload.notes?.trim?.() ?? null,
          requestedAt: new Date(),
          metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
        },
        { transaction },
      );
    } else {
      membership.status = 'requested';
      membership.requestedAt = new Date();
      if (payload.requestedRole && typeof payload.requestedRole === 'string') {
        membership.role = payload.requestedRole.trim();
      }
      if (payload.reason && typeof payload.reason === 'string') {
        membership.description = payload.reason.trim();
      } else if (payload.notes && typeof payload.notes === 'string') {
        membership.description = payload.notes.trim();
      }
      const metadata = membership.metadata && typeof membership.metadata === 'object' ? { ...membership.metadata } : {};
      if (payload.metadata && typeof payload.metadata === 'object') {
        Object.assign(metadata, payload.metadata);
      }
      if (payload.reason) {
        metadata.lastRequestReason = payload.reason;
      }
      membership.metadata = metadata;
      await membership.save({ transaction });
    }

    flushCache();
    return toPlainMembership(membership);
  });
}

export async function updateFreelancerOperationsMembership(
  freelancerId,
  membershipIdentifier,
  payload = {},
) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const identifier = resolveIdentifier(membershipIdentifier, { label: 'membershipId' });

  const sequelize = FreelancerOperationsMembership.sequelize;
  return sequelize.transaction(async (transaction) => {
    const membership = await findMembershipInstance(normalizedId, identifier, { transaction });
    if (!membership) {
      throw new NotFoundError('Membership not found.', {
        freelancerId: normalizedId,
        membershipId: membershipIdentifier,
      });
    }

    if (payload.name && typeof payload.name === 'string') {
      membership.name = payload.name.trim();
    }
    if (payload.role && typeof payload.role === 'string') {
      membership.role = payload.role.trim();
    }
    if (payload.description && typeof payload.description === 'string') {
      membership.description = payload.description.trim();
    }
    if (payload.status) {
      const status = coerceStatus(payload.status);
      membership.status = status;
      if (status === 'active') {
        membership.activatedAt = membership.activatedAt ?? new Date();
      }
    }
    if (payload.lastReviewedAt) {
      const date = new Date(payload.lastReviewedAt);
      if (!Number.isNaN(date.getTime())) {
        membership.lastReviewedAt = date;
      }
    }
    if (payload.metadata && typeof payload.metadata === 'object') {
      const metadata = membership.metadata && typeof membership.metadata === 'object' ? { ...membership.metadata } : {};
      Object.assign(metadata, payload.metadata);
      membership.metadata = metadata;
    }

    await membership.save({ transaction });
    flushCache();
    return toPlainMembership(membership);
  });
}

async function findNoticeInstance(freelancerId, identifier, { transaction }) {
  if (identifier.mode === 'id') {
    return FreelancerOperationsNotice.findOne({
      where: { id: identifier.value, freelancerId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }
  return FreelancerOperationsNotice.findOne({
    where: { freelancerId, slug: identifier.value },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

export async function acknowledgeFreelancerOperationsNotice(freelancerId, noticeIdentifier) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const identifier = resolveIdentifier(noticeIdentifier, { label: 'noticeId' });

  const sequelize = FreelancerOperationsNotice.sequelize;
  return sequelize.transaction(async (transaction) => {
    const notice = await findNoticeInstance(normalizedId, identifier, { transaction });
    if (!notice) {
      throw new NotFoundError('Notice not found.', {
        freelancerId: normalizedId,
        noticeId: noticeIdentifier,
      });
    }
    notice.acknowledged = true;
    notice.acknowledgedAt = new Date();
    await notice.save({ transaction });
    flushCache();
    return toPlainNotice(notice);
  });
}

function summariseWorkflows(workflows) {
  return {
    active: workflows.filter((workflow) => workflow.status !== 'complete').length,
    risky: workflows.filter((workflow) => RISKY_WORKFLOW_STATUSES.has(workflow.status)).length,
  };
}

export async function syncFreelancerOperationsHq(freelancerId) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const sequelize = FreelancerOperationsSnapshot.sequelize;

  return sequelize.transaction(async (transaction) => {
    const [snapshot] = await FreelancerOperationsSnapshot.findOrCreate({
      where: { freelancerId: normalizedId },
      defaults: { freelancerId: normalizedId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const [workflows, notices] = await Promise.all([
      FreelancerOperationsWorkflow.findAll({ where: { freelancerId: normalizedId }, transaction }),
      FreelancerOperationsNotice.findAll({ where: { freelancerId: normalizedId }, transaction }),
    ]);

    const workflowSummary = summariseWorkflows(workflows.map((workflow) => workflow.get({ plain: true })));

    snapshot.activeWorkflows = workflowSummary.active;
    snapshot.escalations = Math.max(
      workflowSummary.risky,
      notices.filter((notice) => !notice.acknowledged && ['warning', 'critical'].includes(coerceTone(notice.tone))).length,
    );
    snapshot.lastSyncedAt = new Date();

    await snapshot.save({ transaction });
    flushCache();
    return getFreelancerOperationsHq(normalizedId, { bypassCache: true });
  });
}

export default {
  getFreelancerOperationsHq,
  requestFreelancerOperationsMembership,
  updateFreelancerOperationsMembership,
  acknowledgeFreelancerOperationsNotice,
  syncFreelancerOperationsHq,
};
