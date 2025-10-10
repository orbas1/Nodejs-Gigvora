import { Op } from 'sequelize';
import {
  sequelize,
  Application,
  ApplicationReview,
  User,
  APPLICATION_TARGET_TYPES,
  APPLICATION_STATUSES,
  APPLICATION_REVIEW_STAGES,
  APPLICATION_REVIEW_DECISIONS,
} from '../models/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const TERMINAL_STATUSES = new Set(['hired', 'rejected', 'withdrawn']);

const STATUS_TRANSITIONS = {
  draft: new Set(['submitted', 'withdrawn']),
  submitted: new Set(['under_review', 'withdrawn']),
  under_review: new Set(['shortlisted', 'interview', 'rejected', 'withdrawn']),
  shortlisted: new Set(['interview', 'rejected', 'withdrawn']),
  interview: new Set(['offered', 'rejected', 'withdrawn']),
  offered: new Set(['hired', 'rejected', 'withdrawn']),
  hired: new Set(),
  rejected: new Set(),
  withdrawn: new Set(),
};

function normalizePagination({ page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const safePage = Number.isFinite(Number(page)) ? Math.max(Number(page), 1) : 1;
  const safePageSize = Number.isFinite(Number(pageSize)) ? Math.min(Math.max(Number(pageSize), 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  return { page: safePage, pageSize: safePageSize };
}

function ensureStatusIsValid(status) {
  if (!APPLICATION_STATUSES.includes(status)) {
    throw new ValidationError(`Unsupported application status "${status}".`);
  }
}

function ensureStageIsValid(stage) {
  if (!APPLICATION_REVIEW_STAGES.includes(stage)) {
    throw new ValidationError(`Unsupported review stage "${stage}".`);
  }
}

function ensureDecisionIsValid(decision) {
  if (!APPLICATION_REVIEW_DECISIONS.includes(decision)) {
    throw new ValidationError(`Unsupported review decision "${decision}".`);
  }
}

function sanitizeUser(userInstance) {
  if (!userInstance) return null;
  const plain = userInstance.get({ plain: true });
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    userType: plain.userType,
  };
}

function sanitizeReview(review) {
  if (!review) return null;
  const plain = review.toPublicObject();
  return {
    ...plain,
    reviewer: sanitizeUser(review.reviewer ?? review.get?.('reviewer')),
  };
}

function sanitizeApplicationRecord(application) {
  if (!application) return null;
  const base = application.toPublicObject();
  return {
    ...base,
    applicant: sanitizeUser(application.applicant ?? application.get?.('applicant')),
    reviews: Array.isArray(application.reviews)
      ? application.reviews.map((review) => sanitizeReview(review))
      : [],
  };
}

function validateAttachments(attachments) {
  if (attachments == null) return null;
  if (!Array.isArray(attachments)) {
    throw new ValidationError('Attachments must be an array of objects.');
  }

  return attachments.slice(0, 10).map((attachment, index) => {
    if (!attachment || typeof attachment !== 'object') {
      throw new ValidationError(`Attachment at index ${index} must be an object.`);
    }
    const { fileName, storageKey, mimeType, fileSize } = attachment;
    if (!fileName || !storageKey) {
      throw new ValidationError(`Attachment at index ${index} is missing fileName or storageKey.`);
    }
    return {
      fileName,
      storageKey,
      mimeType: mimeType ?? 'application/octet-stream',
      fileSize: Number.isFinite(Number(fileSize)) ? Number(fileSize) : null,
    };
  });
}

function normalizeMetadata(metadata) {
  if (metadata == null) return null;
  if (typeof metadata !== 'object') {
    throw new ValidationError('Metadata must be an object.');
  }
  return metadata;
}

function invalidateApplicationCache(applicationId) {
  appCache.flushByPrefix('applications:list');
  if (applicationId) {
    appCache.delete(`applications:get:${applicationId}`);
  }
}

export async function createApplication(payload, { actorId } = {}) {
  const {
    applicantId,
    targetType,
    targetId,
    status = 'submitted',
    sourceChannel = 'web',
    coverLetter,
    attachments,
    rateExpectation,
    currencyCode,
    availabilityDate,
    metadata,
  } = payload;

  if (!applicantId || !targetType || !targetId) {
    throw new ValidationError('applicantId, targetType, and targetId are required.');
  }

  ensureStatusIsValid(status);

  const normalizedAttachments = validateAttachments(attachments);
  const normalizedMetadata = normalizeMetadata(metadata);

  const application = await sequelize.transaction(async (trx) => {
    const duplicate = await Application.findOne({
      where: {
        applicantId,
        targetType,
        targetId,
        isArchived: false,
        status: { [Op.notIn]: ['rejected', 'withdrawn'] },
      },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });

    if (duplicate) {
      throw new ConflictError('An active application already exists for this target.');
    }

    const created = await Application.create(
      {
        applicantId,
        targetType,
        targetId,
        status,
        sourceChannel,
        coverLetter,
        attachments: normalizedAttachments,
        rateExpectation,
        currencyCode,
        availabilityDate,
        submittedAt: status === 'draft' ? null : new Date(),
        metadata: normalizedMetadata ? { ...normalizedMetadata, createdBy: actorId ?? applicantId } : null,
      },
      { transaction: trx },
    );

    return created;
  });

  invalidateApplicationCache(application.id);

  const hydrated = await Application.findByPk(application.id, {
    include: [
      { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: ApplicationReview, as: 'reviews', include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] }] },
    ],
  });

  return sanitizeApplicationRecord(hydrated ?? application);
}

export async function listApplications(filters = {}, pagination = {}) {
  const { page, pageSize } = normalizePagination(pagination);
  const where = {};

  if (filters.applicantId) {
    where.applicantId = filters.applicantId;
  }
  if (filters.targetType) {
    if (!APPLICATION_TARGET_TYPES.includes(filters.targetType)) {
      throw new ValidationError('Unsupported targetType filter.');
    }
    where.targetType = filters.targetType;
  }
  if (filters.status) {
    ensureStatusIsValid(filters.status);
    where.status = filters.status;
  }
  if (filters.q) {
    const term = filters.q.trim();
    if (term) {
      where[Op.or] = [
        { '$applicant.firstName$': { [Op.iLike ?? Op.like]: `%${term}%` } },
        { '$applicant.lastName$': { [Op.iLike ?? Op.like]: `%${term}%` } },
        { '$applicant.email$': { [Op.iLike ?? Op.like]: `%${term}%` } },
      ];
    }
  }

  const key = buildCacheKey('applications:list', { where, page, pageSize });

  return appCache.remember(key, 30, async () => {
    const { results, total, totalPages } = await Application.paginate({
      where,
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: ApplicationReview, as: 'reviews', include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] }] },
      ],
      page,
      pageSize,
    });

    return {
      data: results.map((application) => sanitizeApplicationRecord(application)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  });
}

export async function getApplicationById(id) {
  const cacheKey = `applications:get:${id}`;
  return appCache.remember(cacheKey, 60, async () => {
    const application = await Application.findByPk(id, {
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: ApplicationReview, as: 'reviews', include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] }] },
      ],
    });

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    return sanitizeApplicationRecord(application);
  });
}

export async function updateApplicationStatus(id, nextStatus, { actorId, reason } = {}) {
  ensureStatusIsValid(nextStatus);

  const result = await sequelize.transaction(async (trx) => {
    const application = await Application.findByPk(id, { transaction: trx, lock: trx.LOCK.UPDATE });

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    const allowedTransitions = STATUS_TRANSITIONS[application.status] ?? new Set();
    if (!allowedTransitions.has(nextStatus)) {
      throw new ConflictError(`Cannot transition from ${application.status} to ${nextStatus}.`);
    }

    application.status = nextStatus;
    if (nextStatus !== 'draft' && !application.submittedAt) {
      application.submittedAt = new Date();
    }
    if (TERMINAL_STATUSES.has(nextStatus)) {
      application.decisionAt = new Date();
    }
    if (reason) {
      const metadata = normalizeMetadata(application.metadata ?? {});
      application.metadata = { ...metadata, lastStatusReason: reason, lastUpdatedBy: actorId ?? null };
    }

    await application.save({ transaction: trx });

    return application;
  });

  invalidateApplicationCache(id);

  return getApplicationById(id);
}

export async function recordApplicationReview(applicationId, reviewPayload, actorId) {
  const { stage, decision = 'pending', score, notes } = reviewPayload;

  ensureStageIsValid(stage);
  ensureDecisionIsValid(decision);

  return sequelize.transaction(async (trx) => {
    const application = await Application.findByPk(applicationId, { transaction: trx, lock: trx.LOCK.UPDATE });
    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    const review = await ApplicationReview.create(
      {
        applicationId,
        reviewerId: actorId,
        stage,
        decision,
        score: score ?? null,
        notes: notes ?? null,
        decidedAt: decision === 'pending' ? null : new Date(),
      },
      { transaction: trx },
    );

    invalidateApplicationCache(applicationId);

    return sanitizeReview(
      await ApplicationReview.findByPk(review.id, {
        include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] }],
        transaction: trx,
      }),
    );
  });
}

export async function archiveApplication(id, actorId) {
  await sequelize.transaction(async (trx) => {
    const application = await Application.findByPk(id, { transaction: trx, lock: trx.LOCK.UPDATE });
    if (!application) {
      throw new NotFoundError('Application not found.');
    }
    application.isArchived = true;
    const metadata = normalizeMetadata(application.metadata ?? {});
    application.metadata = { ...metadata, archivedBy: actorId ?? null, archivedAt: new Date() };
    await application.save({ transaction: trx });
  });

  invalidateApplicationCache(id);

  return { success: true };
}

export async function getApplicantTimeline(applicantId, options = {}) {
  const { limit = 20 } = options;
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const cacheKey = buildCacheKey('applications:timeline', { applicantId, limit: safeLimit });

  return appCache.remember(cacheKey, 30, async () => {
    const applications = await Application.findAll({
      where: { applicantId },
      order: [['updatedAt', 'DESC']],
      limit: safeLimit,
      include: [{ model: ApplicationReview, as: 'reviews' }],
    });

    return applications.map((application) => sanitizeApplicationRecord(application));
  });
}

export default {
  createApplication,
  listApplications,
  getApplicationById,
  updateApplicationStatus,
  recordApplicationReview,
  archiveApplication,
  getApplicantTimeline,
};
