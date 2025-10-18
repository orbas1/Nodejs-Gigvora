import { Op, fn, col, literal } from 'sequelize';
import { Job, JobPostAdminDetail, sequelize } from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const STATUS_VALUES = new Set(['draft', 'pending_review', 'approved', 'published', 'paused', 'archived']);
const VISIBILITY_VALUES = new Set(['public', 'internal', 'private']);
const WORKFLOW_STAGES = new Set(['draft', 'review', 'approved', 'active', 'archived']);
const APPROVAL_STATUS_VALUES = new Set(['pending_review', 'changes_requested', 'approved', 'rejected']);
const WORKPLACE_TYPES = new Set(['remote', 'hybrid', 'onsite', 'flex']);
const CONTRACT_TYPES = new Set(['full_time', 'part_time', 'contract', 'temporary', 'internship']);
const COMPENSATION_TYPES = new Set(['salary', 'hourly', 'daily', 'project', 'equity', 'stipend']);
const EXPERIENCE_LEVELS = new Set(['entry', 'mid', 'senior', 'lead', 'executive']);

function slugify(value, fallback = 'job-post') {
  const base = `${value ?? ''}`
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (base) {
    return base.slice(0, 150);
  }
  return `${fallback}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureUniqueSlug(desired, { transaction, excludeId } = {}) {
  let candidate = slugify(desired);
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = { slug: candidate };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    // eslint-disable-next-line no-await-in-loop
    const existing = await JobPostAdminDetail.findOne({ where, transaction, paranoid: false });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${slugify(desired)}-${suffix}`;
  }
}

function sanitizeEnum(value, allowedValues, fallback) {
  if (!value) {
    return fallback;
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (allowedValues.has(normalized)) {
    return normalized;
  }
  return fallback;
}

function sanitizeStringArray(items) {
  if (!items) {
    return [];
  }
  const array = Array.isArray(items) ? items : [items];
  return Array.from(
    new Set(
      array
        .map((item) => `${item ?? ''}`.trim())
        .filter((item) => item.length > 0)
        .slice(0, 50),
    ),
  );
}

function sanitizeRichTextList(items) {
  if (!items) {
    return [];
  }
  const array = Array.isArray(items) ? items : `${items}`.split(/\r?\n/);
  return array
    .map((item) => `${item ?? ''}`.trim())
    .filter((item) => item.length > 0)
    .slice(0, 50);
}

function sanitizeAttachments(attachments) {
  if (!attachments) {
    return [];
  }
  const array = Array.isArray(attachments) ? attachments : [attachments];
  return array
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { label: item, url: item };
      }
      const label = `${item.label ?? ''}`.trim();
      const url = `${item.url ?? ''}`.trim();
      if (!url) {
        return null;
      }
      return {
        label: label || url,
        url,
        type: item.type ? `${item.type}`.trim().toLowerCase().slice(0, 40) : undefined,
      };
    })
    .filter(Boolean)
    .slice(0, 20);
}

function sanitizePromotionFlags(flags) {
  if (!flags || typeof flags !== 'object') {
    return {};
  }
  return {
    featured: Boolean(flags.featured),
    highlighted: Boolean(flags.highlighted),
    newsletter: Boolean(flags.newsletter),
    pushNotification: Boolean(flags.pushNotification),
  };
}

function sanitizeDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function normalizeJobInstance(job) {
  if (!job) {
    return null;
  }
  const plain = job.get({ plain: true });
  const detail = plain.adminDetail || plain.JobPostAdminDetail || null;
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    location: plain.location,
    employmentType: plain.employmentType,
    geoLocation: plain.geoLocation,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    detail: detail
      ? {
          id: detail.id,
          jobId: detail.jobId,
          slug: detail.slug,
          status: detail.status,
          visibility: detail.visibility,
          workflowStage: detail.workflowStage,
          approvalStatus: detail.approvalStatus,
          approvalNotes: detail.approvalNotes,
          applicationUrl: detail.applicationUrl,
          applicationEmail: detail.applicationEmail,
          applicationInstructions: detail.applicationInstructions,
          salaryMin: detail.salaryMin,
          salaryMax: detail.salaryMax,
          currency: detail.currency,
          compensationType: detail.compensationType,
          workplaceType: detail.workplaceType,
          contractType: detail.contractType,
          experienceLevel: detail.experienceLevel,
          department: detail.department,
          team: detail.team,
          hiringManagerName: detail.hiringManagerName,
          hiringManagerEmail: detail.hiringManagerEmail,
          recruiterName: detail.recruiterName,
          recruiterEmail: detail.recruiterEmail,
          tags: Array.isArray(detail.tags) ? detail.tags : [],
          benefits: Array.isArray(detail.benefits) ? detail.benefits : [],
          responsibilities: Array.isArray(detail.responsibilities) ? detail.responsibilities : [],
          requirements: Array.isArray(detail.requirements) ? detail.requirements : [],
          attachments: Array.isArray(detail.attachments) ? detail.attachments : [],
          promotionFlags: detail.promotionFlags ?? {},
          metadata: detail.metadata ?? {},
          publishedAt: detail.publishedAt,
          expiresAt: detail.expiresAt,
          archivedAt: detail.archivedAt,
          archiveReason: detail.archiveReason,
          externalReference: detail.externalReference,
          createdById: detail.createdById,
          updatedById: detail.updatedById,
          createdAt: detail.createdAt,
          updatedAt: detail.updatedAt,
        }
      : null,
  };
}

function buildJobPayload(payload) {
  return {
    title: payload.title,
    description: payload.description,
    location: payload.location ?? null,
    employmentType: payload.employmentType ?? null,
    geoLocation: payload.geoLocation ?? null,
  };
}

function buildDetailPayload(payload, { actorId, existingDetail } = {}) {
  const normalizedStatus = sanitizeEnum(payload.status, STATUS_VALUES, existingDetail?.status ?? 'draft');
  const normalizedVisibility = sanitizeEnum(payload.visibility, VISIBILITY_VALUES, existingDetail?.visibility ?? 'public');
  const normalizedWorkflowStage = sanitizeEnum(
    payload.workflowStage,
    WORKFLOW_STAGES,
    existingDetail?.workflowStage ?? 'draft',
  );
  const normalizedApprovalStatus = sanitizeEnum(
    payload.approvalStatus,
    APPROVAL_STATUS_VALUES,
    existingDetail?.approvalStatus ?? 'pending_review',
  );

  const salaryMin = payload.salaryMin != null ? Number(payload.salaryMin) : undefined;
  const salaryMax = payload.salaryMax != null ? Number(payload.salaryMax) : undefined;

  if (salaryMin != null && salaryMax != null && salaryMin > salaryMax) {
    throw new ValidationError('Minimum compensation cannot exceed the maximum value.');
  }

  return {
    slug: payload.slug,
    status: normalizedStatus,
    visibility: normalizedVisibility,
    workflowStage: normalizedWorkflowStage,
    approvalStatus: normalizedApprovalStatus,
    approvalNotes: payload.approvalNotes ?? null,
    applicationUrl: payload.applicationUrl ?? null,
    applicationEmail: payload.applicationEmail ? `${payload.applicationEmail}`.trim().toLowerCase() : null,
    applicationInstructions: payload.applicationInstructions ?? null,
    salaryMin: salaryMin ?? null,
    salaryMax: salaryMax ?? null,
    currency: payload.currency ? `${payload.currency}`.trim().toUpperCase() : existingDetail?.currency ?? null,
    compensationType: sanitizeEnum(
      payload.compensationType,
      COMPENSATION_TYPES,
      existingDetail?.compensationType ?? null,
    ),
    workplaceType: sanitizeEnum(payload.workplaceType, WORKPLACE_TYPES, existingDetail?.workplaceType ?? null),
    contractType: sanitizeEnum(payload.contractType, CONTRACT_TYPES, existingDetail?.contractType ?? null),
    experienceLevel: sanitizeEnum(
      payload.experienceLevel,
      EXPERIENCE_LEVELS,
      existingDetail?.experienceLevel ?? null,
    ),
    department: payload.department ?? null,
    team: payload.team ?? null,
    hiringManagerName: payload.hiringManagerName ?? null,
    hiringManagerEmail: payload.hiringManagerEmail ? `${payload.hiringManagerEmail}`.trim().toLowerCase() : null,
    recruiterName: payload.recruiterName ?? null,
    recruiterEmail: payload.recruiterEmail ? `${payload.recruiterEmail}`.trim().toLowerCase() : null,
    tags: sanitizeStringArray(payload.tags ?? payload.tagList),
    benefits: sanitizeRichTextList(payload.benefits),
    responsibilities: sanitizeRichTextList(payload.responsibilities),
    requirements: sanitizeRichTextList(payload.requirements),
    attachments: sanitizeAttachments(payload.attachments),
    promotionFlags: sanitizePromotionFlags(payload.promotionFlags),
    metadata: typeof payload.metadata === 'object' && payload.metadata !== null ? payload.metadata : existingDetail?.metadata ?? {},
    publishedAt: sanitizeDate(payload.publishedAt) ?? existingDetail?.publishedAt ?? null,
    expiresAt: sanitizeDate(payload.expiresAt) ?? existingDetail?.expiresAt ?? null,
    archivedAt: sanitizeDate(payload.archivedAt) ?? existingDetail?.archivedAt ?? null,
    archiveReason: payload.archiveReason ?? existingDetail?.archiveReason ?? null,
    externalReference: payload.externalReference ?? existingDetail?.externalReference ?? null,
    createdById: existingDetail?.createdById ?? actorId ?? null,
    updatedById: actorId ?? existingDetail?.updatedById ?? null,
  };
}

async function loadJobOrThrow(identifier, { transaction } = {}) {
  const include = [{ model: JobPostAdminDetail, as: 'adminDetail', required: false }];
  const where = {};
  if (typeof identifier === 'number' || /^\d+$/.test(`${identifier}`)) {
    where.id = Number(identifier);
  } else {
    include[0].where = { slug: `${identifier}` };
    include[0].required = true;
  }
  const job = await Job.findOne({ where, include, transaction });
  if (!job) {
    throw new NotFoundError('Job post could not be found.');
  }
  return job;
}

async function buildSummary() {
  const [statusRows, workflowRows] = await Promise.all([
    JobPostAdminDetail.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    JobPostAdminDetail.findAll({
      attributes: ['workflowStage', [fn('COUNT', col('id')), 'count']],
      group: ['workflowStage'],
      raw: true,
    }),
  ]);

  const statusCounts = statusRows.reduce((acc, row) => {
    acc[row.status] = Number(row.count);
    return acc;
  }, {});

  const workflowCounts = workflowRows.reduce((acc, row) => {
    acc[row.workflowStage] = Number(row.count);
    return acc;
  }, {});

  return { statusCounts, workflowCounts };
}

export async function listJobPosts({ status, workflowStage, visibility, search, page = 1, pageSize = 20 } = {}) {
  const limit = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const jobWhere = {};
  if (search) {
    const sanitized = `%${search.trim().replace(/%/g, '')}%`;
    jobWhere[Op.or] = [
      { title: { [Op.iLike ?? Op.like]: sanitized } },
      { description: { [Op.iLike ?? Op.like]: sanitized } },
    ];
  }

  const detailWhere = {};
  if (status && STATUS_VALUES.has(status)) {
    detailWhere.status = status;
  }
  if (workflowStage && WORKFLOW_STAGES.has(workflowStage)) {
    detailWhere.workflowStage = workflowStage;
  }
  if (visibility && VISIBILITY_VALUES.has(visibility)) {
    detailWhere.visibility = visibility;
  }

  const include = [
    {
      model: JobPostAdminDetail,
      as: 'adminDetail',
      required: true,
      where: detailWhere,
    },
  ];

  const { rows, count } = await Job.findAndCountAll({
    where: jobWhere,
    include,
    limit,
    offset,
    order: [
      [{ model: JobPostAdminDetail, as: 'adminDetail' }, literal('COALESCE("adminDetail"."updatedAt", "Job"."updatedAt")'), 'DESC'],
    ],
  });

  const summary = await buildSummary();

  return {
    results: rows.map((row) => normalizeJobInstance(row)),
    pagination: {
      total: count,
      page: Math.max(Number(page) || 1, 1),
      pageSize: limit,
      totalPages: Math.ceil(count / limit) || 0,
    },
    summary,
  };
}

export async function getJobPost(identifier) {
  const job = await loadJobOrThrow(identifier);
  return normalizeJobInstance(job);
}

export async function createJobPost(payload, { actorId } = {}) {
  if (!payload?.title) {
    throw new ValidationError('Job title is required.');
  }
  if (!payload?.description) {
    throw new ValidationError('Job description is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const job = await Job.create(buildJobPayload(payload), { transaction });

    const desiredSlug = payload.slug || payload.title || `job-${job.id}`;
    const slug = await ensureUniqueSlug(desiredSlug, { transaction });

    const detailPayload = buildDetailPayload(
      { ...payload, slug },
      { actorId, existingDetail: null },
    );

    detailPayload.jobId = job.id;
    detailPayload.createdById = actorId ?? null;
    detailPayload.updatedById = actorId ?? null;

    await JobPostAdminDetail.create(detailPayload, { transaction });

    const reloaded = await Job.findByPk(job.id, {
      include: [{ model: JobPostAdminDetail, as: 'adminDetail' }],
      transaction,
    });

    return normalizeJobInstance(reloaded);
  });
}

export async function updateJobPost(identifier, payload, { actorId } = {}) {
  if (!payload) {
    throw new ValidationError('No fields provided for update.');
  }

  return sequelize.transaction(async (transaction) => {
    const job = await loadJobOrThrow(identifier, { transaction });

    if (payload.title || payload.description || payload.location || payload.employmentType || payload.geoLocation) {
      job.set(buildJobPayload({
        title: payload.title ?? job.title,
        description: payload.description ?? job.description,
        location: payload.location ?? job.location,
        employmentType: payload.employmentType ?? job.employmentType,
        geoLocation: payload.geoLocation ?? job.geoLocation,
      }));
      await job.save({ transaction });
    }

    const detail = job.adminDetail;
    if (!detail) {
      throw new ValidationError('Job admin detail record is missing.');
    }

    const detailPayload = buildDetailPayload(payload, { actorId, existingDetail: detail });

    if (detailPayload.slug && detailPayload.slug !== detail.slug) {
      detailPayload.slug = await ensureUniqueSlug(detailPayload.slug, {
        transaction,
        excludeId: detail.id,
      });
    }

    if (payload.publishedAt === '' || payload.publishedAt === null) {
      detailPayload.publishedAt = null;
    }
    if (payload.expiresAt === '' || payload.expiresAt === null) {
      detailPayload.expiresAt = null;
    }
    if (payload.archivedAt === '' || payload.archivedAt === null) {
      detailPayload.archivedAt = null;
    }
    if (payload.archiveReason === '' || payload.archiveReason === null) {
      detailPayload.archiveReason = null;
    }

    detail.set(detailPayload);
    await detail.save({ transaction });

    const reloaded = await loadJobOrThrow(job.id, { transaction });
    return normalizeJobInstance(reloaded);
  });
}

export async function publishJobPost(identifier, { actorId, publishedAt } = {}) {
  return sequelize.transaction(async (transaction) => {
    const job = await loadJobOrThrow(identifier, { transaction });
    const detail = job.adminDetail;
    if (!detail) {
      throw new ValidationError('Job admin detail record is missing.');
    }
    detail.set({
      status: 'published',
      workflowStage: 'active',
      approvalStatus: detail.approvalStatus === 'approved' ? 'approved' : 'pending_review',
      publishedAt: sanitizeDate(publishedAt) ?? new Date(),
      updatedById: actorId ?? detail.updatedById ?? null,
      archivedAt: null,
      archiveReason: null,
    });
    await detail.save({ transaction });
    const reloaded = await loadJobOrThrow(job.id, { transaction });
    return normalizeJobInstance(reloaded);
  });
}

export async function archiveJobPost(identifier, { actorId, reason } = {}) {
  return sequelize.transaction(async (transaction) => {
    const job = await loadJobOrThrow(identifier, { transaction });
    const detail = job.adminDetail;
    if (!detail) {
      throw new ValidationError('Job admin detail record is missing.');
    }
    detail.set({
      status: 'archived',
      workflowStage: 'archived',
      archivedAt: new Date(),
      archiveReason: reason ?? detail.archiveReason ?? null,
      updatedById: actorId ?? detail.updatedById ?? null,
    });
    await detail.save({ transaction });
    const reloaded = await loadJobOrThrow(job.id, { transaction });
    return normalizeJobInstance(reloaded);
  });
}

export async function deleteJobPost(identifier, { hardDelete = false } = {}) {
  return sequelize.transaction(async (transaction) => {
    const job = await loadJobOrThrow(identifier, { transaction });
    const jobId = job.id;
    if (hardDelete) {
      await JobPostAdminDetail.destroy({ where: { jobId }, transaction });
      await Job.destroy({ where: { id: jobId }, transaction });
      return { deleted: true };
    }
    const detail = job.adminDetail;
    if (!detail) {
      throw new ValidationError('Job admin detail record is missing.');
    }
    detail.set({ status: 'archived', workflowStage: 'archived', archivedAt: new Date() });
    await detail.save({ transaction });
    return normalizeJobInstance(job);
  });
}

export default {
  listJobPosts,
  getJobPost,
  createJobPost,
  updateJobPost,
  publishJobPost,
  archiveJobPost,
  deleteJobPost,
};
