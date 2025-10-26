import { DataTypes, Op } from 'sequelize';
import logger from '../utils/logger.js';
import { applyModelSlug, ensurePublishedTimestamp, normaliseEmail } from '../utils/modelNormalizers.js';
import sequelizeClient from './sequelizeClient.js';

const sequelize = sequelizeClient;
const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

const AGENCY_JOB_PUBLISHABLE_STATUSES = ['open', 'paused', 'filled'];

export const AGENCY_JOB_STATUSES = ['draft', 'open', 'paused', 'closed', 'filled'];
export const AGENCY_EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'temporary', 'internship', 'fractional'];
export const AGENCY_JOB_SENIORITIES = ['junior', 'mid', 'senior', 'lead', 'director', 'executive'];
export const AGENCY_JOB_APPLICATION_STATUSES = [
  'new',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
];
export const AGENCY_JOB_INTERVIEW_STATUSES = ['planned', 'completed', 'cancelled', 'reschedule_requested'];
export const AGENCY_INTERVIEW_MODES = ['virtual', 'in_person', 'phone'];
export const AGENCY_APPLICATION_RESPONSE_TYPES = ['note', 'email', 'call', 'sms', 'meeting'];
export const AGENCY_APPLICATION_RESPONSE_VISIBILITIES = ['internal', 'shared_with_client'];

export const AgencyJob = sequelize.define(
  'AgencyJob',
  {
    workspaceId: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    clientName: { type: DataTypes.STRING(180), allowNull: true },
    location: { type: DataTypes.STRING(180), allowNull: true },
    employmentType: {
      type: DataTypes.ENUM(...AGENCY_EMPLOYMENT_TYPES),
      allowNull: false,
      defaultValue: 'full_time',
    },
    seniority: {
      type: DataTypes.ENUM(...AGENCY_JOB_SENIORITIES),
      allowNull: true,
    },
    remoteAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    compensationMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationCurrency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.ENUM(...AGENCY_JOB_STATUSES), allowNull: false, defaultValue: 'draft' },
    summary: { type: DataTypes.TEXT, allowNull: true },
    responsibilities: { type: DataTypes.TEXT, allowNull: true },
    requirements: { type: DataTypes.TEXT, allowNull: true },
    benefits: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    hiringManagerName: { type: DataTypes.STRING(180), allowNull: true },
    hiringManagerEmail: { type: DataTypes.STRING(180), allowNull: true, validate: { isEmail: true } },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    closesAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_jobs',
    underscored: true,
    indexes: [
      { fields: ['workspace_id', 'status'] },
      { fields: ['workspace_id', 'title'] },
      { fields: ['workspace_id', 'client_name'] },
      { unique: true, fields: ['workspace_id', 'slug'] },
    ],
  },
);

export const AgencyJobApplication = sequelize.define(
  'AgencyJobApplication',
  {
    workspaceId: { type: DataTypes.STRING(120), allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    candidateName: { type: DataTypes.STRING(180), allowNull: false },
    candidateEmail: { type: DataTypes.STRING(180), allowNull: true, validate: { isEmail: true } },
    candidatePhone: { type: DataTypes.STRING(60), allowNull: true },
    source: { type: DataTypes.STRING(120), allowNull: true },
    resumeUrl: { type: DataTypes.STRING(255), allowNull: true },
    portfolioUrl: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM(...AGENCY_JOB_APPLICATION_STATUSES),
      allowNull: false,
      defaultValue: 'new',
    },
    stage: { type: DataTypes.STRING(120), allowNull: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    appliedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    tags: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_job_applications',
    underscored: true,
    indexes: [
      { fields: ['workspace_id', 'job_id', 'status'] },
      { fields: ['workspace_id', 'candidate_email'] },
    ],
  },
);

export const AgencyInterview = sequelize.define(
  'AgencyInterview',
  {
    workspaceId: { type: DataTypes.STRING(120), allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
    mode: { type: DataTypes.ENUM(...AGENCY_INTERVIEW_MODES), allowNull: false, defaultValue: 'virtual' },
    stage: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...AGENCY_JOB_INTERVIEW_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
    },
    interviewerName: { type: DataTypes.STRING(180), allowNull: true },
    interviewerEmail: { type: DataTypes.STRING(180), allowNull: true, validate: { isEmail: true } },
    meetingUrl: { type: DataTypes.STRING(255), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    agenda: { type: DataTypes.TEXT, allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    recordingUrl: { type: DataTypes.STRING(255), allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_interviews',
    underscored: true,
    indexes: [
      { fields: ['workspace_id', 'application_id', 'status'] },
      { fields: ['workspace_id', 'scheduled_at'] },
    ],
  },
);

export const AgencyJobFavorite = sequelize.define(
  'AgencyJobFavorite',
  {
    workspaceId: { type: DataTypes.STRING(120), allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    pinnedNote: { type: DataTypes.STRING(255), allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'agency_job_favorites',
    underscored: true,
    indexes: [
      { unique: true, fields: ['workspace_id', 'job_id', 'member_id'] },
    ],
  },
);

export const AgencyApplicationResponse = sequelize.define(
  'AgencyApplicationResponse',
  {
    workspaceId: { type: DataTypes.STRING(120), allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    responseType: {
      type: DataTypes.ENUM(...AGENCY_APPLICATION_RESPONSE_TYPES),
      allowNull: false,
      defaultValue: 'note',
    },
    visibility: {
      type: DataTypes.ENUM(...AGENCY_APPLICATION_RESPONSE_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
    },
    subject: { type: DataTypes.STRING(180), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    attachments: { type: jsonType, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'agency_application_responses',
    underscored: true,
    indexes: [
      { fields: ['workspace_id', 'application_id'] },
    ],
  },
);

function sanitiseJobTags(value) {
  if (!value) {
    return null;
  }
  const base = Array.isArray(value) ? value : [value];
  const normalised = base
    .map((entry) => {
      if (typeof entry !== 'string') {
        return null;
      }
      const trimmed = entry.trim();
      if (!trimmed) {
        return null;
      }
      return trimmed.toLowerCase();
    })
    .filter(Boolean);

  if (normalised.length === 0) {
    return null;
  }
  return Array.from(new Set(normalised));
}

async function updateJobEngagementMetrics(jobId, options = {}) {
  if (!jobId) {
    return null;
  }
  const { transaction } = options;

  try {
    const [applicationCount, favoriteCount, latestApplicationAt, latestFavoriteAt, latestResponseRecord] = await Promise.all([
      AgencyJobApplication.count({ where: { jobId }, transaction }),
      AgencyJobFavorite.count({ where: { jobId }, transaction }),
      AgencyJobApplication.max('createdAt', { where: { jobId }, transaction }),
      AgencyJobFavorite.max('createdAt', { where: { jobId }, transaction }),
      AgencyApplicationResponse.findOne({
        attributes: ['createdAt'],
        include: [
          {
            model: AgencyJobApplication,
            as: 'application',
            attributes: [],
            where: { jobId },
            required: true,
          },
        ],
        order: [['createdAt', 'DESC']],
        transaction,
      }),
    ]);

    const latestResponseAt = latestResponseRecord?.createdAt ?? null;

    const timestamps = [latestApplicationAt, latestFavoriteAt, latestResponseAt]
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter(Number.isFinite);

    const lastInteractionAt = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;

    const job = await AgencyJob.findByPk(jobId, { transaction });
    if (!job) {
      return null;
    }

    const existingMetadata = job.metadata ?? {};
    const nextMetadata = {
      ...existingMetadata,
      metrics: {
        ...(existingMetadata.metrics ?? {}),
        applicationCount,
        favoriteCount,
        lastInteractionAt,
      },
    };

    job.set('metadata', nextMetadata);
    await job.save({ transaction, hooks: false, silent: false });
    return nextMetadata;
  } catch (error) {
    logger.error({ err: error, jobId }, 'Failed to update agency job engagement metrics');
    return null;
  }
}

async function resolveJobIdFromResponse(response, options = {}) {
  if (!response) {
    return null;
  }
  if (response.application?.jobId) {
    return response.application.jobId;
  }
  if (!response.applicationId) {
    return null;
  }

  const application = await AgencyJobApplication.findByPk(response.applicationId, {
    attributes: ['jobId'],
    transaction: options.transaction,
  });

  return application?.jobId ?? null;
}

AgencyJob.hasMany(AgencyJobApplication, { as: 'applications', foreignKey: 'jobId', onDelete: 'CASCADE' });
AgencyJobApplication.belongsTo(AgencyJob, { as: 'job', foreignKey: 'jobId' });

AgencyJob.hasMany(AgencyJobFavorite, { as: 'favorites', foreignKey: 'jobId', onDelete: 'CASCADE' });
AgencyJobFavorite.belongsTo(AgencyJob, { as: 'job', foreignKey: 'jobId' });

AgencyJobApplication.hasMany(AgencyInterview, { as: 'interviews', foreignKey: 'applicationId', onDelete: 'CASCADE' });
AgencyInterview.belongsTo(AgencyJobApplication, { as: 'application', foreignKey: 'applicationId' });

AgencyJobApplication.hasMany(AgencyApplicationResponse, {
  as: 'responses',
  foreignKey: 'applicationId',
  onDelete: 'CASCADE',
});
AgencyApplicationResponse.belongsTo(AgencyJobApplication, { as: 'application', foreignKey: 'applicationId' });

AgencyJob.addHook('beforeValidate', (job) => {
  applyModelSlug(job, {
    slugField: 'slug',
    sourceField: 'title',
    fallback: job.workspaceId ? `role-${job.workspaceId}` : 'role',
    maxLength: 160,
    randomiseOnCreate: true,
  });

  if (job.hiringManagerEmail) {
    job.hiringManagerEmail = normaliseEmail(job.hiringManagerEmail);
  }
});

AgencyJob.addHook('beforeSave', (job) => {
  ensurePublishedTimestamp(job, {
    statusField: 'status',
    publishStatuses: AGENCY_JOB_PUBLISHABLE_STATUSES,
    publishedAtField: 'publishedAt',
  });

  if (job.changed('tags')) {
    const sanitised = sanitiseJobTags(job.tags);
    job.set('tags', sanitised);
  }
});

AgencyJob.addHook('afterCreate', (job, options) => updateJobEngagementMetrics(job.id, options));
AgencyJob.addHook('afterUpdate', (job, options) => updateJobEngagementMetrics(job.id, options));

AgencyJobApplication.addHook('beforeValidate', (application) => {
  if (application.candidateEmail) {
    application.candidateEmail = normaliseEmail(application.candidateEmail);
  }
});

AgencyJobApplication.addHook('afterCreate', (application, options) =>
  updateJobEngagementMetrics(application.jobId, options),
);
AgencyJobApplication.addHook('afterDestroy', (application, options) =>
  updateJobEngagementMetrics(application.jobId, options),
);

AgencyJobFavorite.addHook('afterCreate', (favorite, options) =>
  updateJobEngagementMetrics(favorite.jobId, options),
);
AgencyJobFavorite.addHook('afterDestroy', (favorite, options) =>
  updateJobEngagementMetrics(favorite.jobId, options),
);

AgencyApplicationResponse.addHook('afterCreate', async (response, options) => {
  const jobId = await resolveJobIdFromResponse(response, options);
  if (jobId) {
    return updateJobEngagementMetrics(jobId, options);
  }
  return null;
});

AgencyApplicationResponse.addHook('afterDestroy', async (response, options) => {
  const jobId = await resolveJobIdFromResponse(response, options);
  if (jobId) {
    return updateJobEngagementMetrics(jobId, options);
  }
  return null;
});

export function normaliseJobSearchTerm(term) {
  if (!term) {
    return null;
  }
  const trimmed = term.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

export function buildJobSearchPredicate(term) {
  const normalized = normaliseJobSearchTerm(term);
  if (!normalized) {
    return null;
  }
  const likeOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
  const pattern = `%${normalized}%`;
  return {
    [Op.or]: [
      { title: { [likeOperator]: pattern } },
      { clientName: { [likeOperator]: pattern } },
      { summary: { [likeOperator]: pattern } },
    ],
  };
}

export default {
  AgencyJob,
  AgencyJobApplication,
  AgencyInterview,
  AgencyJobFavorite,
  AgencyApplicationResponse,
};
