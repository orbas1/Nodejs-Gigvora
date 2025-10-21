import { DataTypes } from 'sequelize';
import { JOB_INTERVIEW_STATUSES as GLOBAL_JOB_INTERVIEW_STATUSES, JOB_INTERVIEW_TYPES as GLOBAL_JOB_INTERVIEW_TYPES } from './constants/index.js';
import sequelizeClient from './sequelizeClient.js';

const sequelize = sequelizeClient;
const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const JOB_APPLICATION_STATUSES = Object.freeze([
  'new',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
]);

export const JOB_APPLICATION_STAGES = Object.freeze([
  'application_review',
  'phone_screen',
  'skills_assessment',
  'team_interview',
  'offer_review',
  'hired',
]);

export const JOB_APPLICATION_PRIORITIES = Object.freeze(['low', 'normal', 'high', 'urgent']);

export const JOB_APPLICATION_SOURCES = Object.freeze([
  'direct',
  'referral',
  'agency',
  'job_board',
  'talent_pool',
  'other',
]);

export const JOB_APPLICATION_VISIBILITIES = Object.freeze(['internal', 'shared']);

export const JOB_APPLICATION_INTERVIEW_TYPES = Object.freeze([...GLOBAL_JOB_INTERVIEW_TYPES]);

export const JOB_APPLICATION_INTERVIEW_STATUSES = Object.freeze([...GLOBAL_JOB_INTERVIEW_STATUSES]);

export const JobApplication = sequelize.define(
  'JobApplication',
  {
    candidateName: { type: DataTypes.STRING(180), allowNull: false },
    candidateEmail: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
    candidatePhone: { type: DataTypes.STRING(50), allowNull: true },
    resumeUrl: { type: DataTypes.STRING(2048), allowNull: true },
    coverLetter: { type: DataTypes.TEXT, allowNull: true },
    portfolioUrl: { type: DataTypes.STRING(2048), allowNull: true },
    linkedinUrl: { type: DataTypes.STRING(2048), allowNull: true },
    githubUrl: { type: DataTypes.STRING(2048), allowNull: true },
    jobTitle: { type: DataTypes.STRING(180), allowNull: false },
    jobId: { type: DataTypes.STRING(80), allowNull: true },
    jobLocation: { type: DataTypes.STRING(180), allowNull: true },
    employmentType: { type: DataTypes.STRING(60), allowNull: true },
    salaryExpectation: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.ENUM(...JOB_APPLICATION_STATUSES), allowNull: false, defaultValue: 'new' },
    stage: { type: DataTypes.ENUM(...JOB_APPLICATION_STAGES), allowNull: false, defaultValue: 'application_review' },
    priority: { type: DataTypes.ENUM(...JOB_APPLICATION_PRIORITIES), allowNull: false, defaultValue: 'normal' },
    source: { type: DataTypes.ENUM(...JOB_APPLICATION_SOURCES), allowNull: false, defaultValue: 'direct' },
    score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    skills: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    assignedRecruiterId: { type: DataTypes.INTEGER, allowNull: true },
    assignedRecruiterName: { type: DataTypes.STRING(180), allowNull: true },
    assignedTeam: { type: DataTypes.STRING(120), allowNull: true },
    availabilityDate: { type: DataTypes.DATE, allowNull: true },
    lastActivityAt: { type: DataTypes.DATE, allowNull: true },
    isArchived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'job_applications',
    indexes: [
      { fields: ['status'] },
      { fields: ['stage'] },
      { fields: ['priority'] },
      { fields: ['assignedRecruiterId'] },
      { fields: ['candidateEmail'] },
      { fields: ['jobId'] },
    ],
  },
);

JobApplication.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    candidateName: plain.candidateName,
    candidateEmail: plain.candidateEmail,
    candidatePhone: plain.candidatePhone,
    resumeUrl: plain.resumeUrl,
    coverLetter: plain.coverLetter,
    portfolioUrl: plain.portfolioUrl,
    linkedinUrl: plain.linkedinUrl,
    githubUrl: plain.githubUrl,
    jobTitle: plain.jobTitle,
    jobId: plain.jobId,
    jobLocation: plain.jobLocation,
    employmentType: plain.employmentType,
    salaryExpectation: plain.salaryExpectation,
    currency: plain.currency,
    status: plain.status,
    stage: plain.stage,
    priority: plain.priority,
    source: plain.source,
    score: plain.score,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    skills: Array.isArray(plain.skills) ? plain.skills : [],
    metadata: plain.metadata ?? null,
    assignedRecruiterId: plain.assignedRecruiterId,
    assignedRecruiterName: plain.assignedRecruiterName,
    assignedTeam: plain.assignedTeam,
    availabilityDate: plain.availabilityDate,
    lastActivityAt: plain.lastActivityAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    isArchived: plain.isArchived,
  };
};

export const JobApplicationStageHistory = sequelize.define(
  'JobApplicationStageHistory',
  {
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    fromStage: { type: DataTypes.ENUM(...JOB_APPLICATION_STAGES), allowNull: true },
    toStage: { type: DataTypes.ENUM(...JOB_APPLICATION_STAGES), allowNull: false },
    fromStatus: { type: DataTypes.ENUM(...JOB_APPLICATION_STATUSES), allowNull: true },
    toStatus: { type: DataTypes.ENUM(...JOB_APPLICATION_STATUSES), allowNull: false },
    note: { type: DataTypes.STRING(500), allowNull: true },
    changedById: { type: DataTypes.INTEGER, allowNull: true },
    changedByName: { type: DataTypes.STRING(180), allowNull: true },
    changedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'job_application_stage_history',
    indexes: [{ fields: ['applicationId'] }],
  },
);

JobApplicationStageHistory.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    applicationId: plain.applicationId,
    fromStage: plain.fromStage,
    toStage: plain.toStage,
    fromStatus: plain.fromStatus,
    toStatus: plain.toStatus,
    note: plain.note,
    changedById: plain.changedById,
    changedByName: plain.changedByName,
    changedAt: plain.changedAt,
  };
};

export const JobApplicationNote = sequelize.define(
  'JobApplicationNote',
  {
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    authorName: { type: DataTypes.STRING(180), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    visibility: { type: DataTypes.ENUM(...JOB_APPLICATION_VISIBILITIES), allowNull: false, defaultValue: 'internal' },
  },
  {
    tableName: 'job_application_notes',
    indexes: [{ fields: ['applicationId'] }],
  },
);

JobApplicationNote.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    applicationId: plain.applicationId,
    authorId: plain.authorId,
    authorName: plain.authorName,
    body: plain.body,
    visibility: plain.visibility,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const JobApplicationDocument = sequelize.define(
  'JobApplicationDocument',
  {
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    fileType: { type: DataTypes.STRING(120), allowNull: true },
    fileUrl: { type: DataTypes.STRING(2048), allowNull: false },
    sizeBytes: { type: DataTypes.INTEGER, allowNull: true },
    uploadedById: { type: DataTypes.INTEGER, allowNull: true },
    uploadedByName: { type: DataTypes.STRING(180), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'job_application_documents',
    indexes: [{ fields: ['applicationId'] }],
  },
);

JobApplicationDocument.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    applicationId: plain.applicationId,
    fileName: plain.fileName,
    fileType: plain.fileType,
    fileUrl: plain.fileUrl,
    sizeBytes: plain.sizeBytes,
    uploadedById: plain.uploadedById,
    uploadedByName: plain.uploadedByName,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const JobApplicationInterview = sequelize.define(
  'JobApplicationInterview',
  {
    userId: { type: DataTypes.INTEGER, allowNull: true },
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    type: {
      type: DataTypes.ENUM(...JOB_APPLICATION_INTERVIEW_TYPES),
      allowNull: false,
      defaultValue: 'phone',
      validate: { isIn: [JOB_APPLICATION_INTERVIEW_TYPES] },
    },
    status: {
      type: DataTypes.ENUM(...JOB_APPLICATION_INTERVIEW_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [JOB_APPLICATION_INTERVIEW_STATUSES] },
    },
    interviewerName: { type: DataTypes.STRING(180), allowNull: true },
    interviewerEmail: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    location: { type: DataTypes.STRING(255), allowNull: true },
    meetingUrl: { type: DataTypes.STRING(500), allowNull: true },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    feedbackScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    createdByName: { type: DataTypes.STRING(180), allowNull: true },
  },
  {
    tableName: 'job_application_interviews',
    indexes: [
      { fields: ['userId'], name: 'job_application_interviews_user_idx' },
      { fields: ['applicationId'], name: 'job_application_interviews_application_idx' },
      { fields: ['scheduledAt'], name: 'job_application_interviews_schedule_idx' },
    ],
  },
);

JobApplicationInterview.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId ?? null,
    applicationId: plain.applicationId,
    scheduledAt: plain.scheduledAt,
    timezone: plain.timezone ?? null,
    type: plain.type,
    status: plain.status,
    interviewerName: plain.interviewerName ?? null,
    interviewerEmail: plain.interviewerEmail ?? null,
    location: plain.location ?? null,
    meetingUrl: plain.meetingUrl ?? null,
    durationMinutes: plain.durationMinutes == null ? null : Number(plain.durationMinutes),
    feedbackScore: plain.feedbackScore == null ? null : Number(plain.feedbackScore),
    notes: plain.notes ?? null,
    metadata: plain.metadata ?? null,
    createdById: plain.createdById ?? null,
    createdByName: plain.createdByName ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

JobApplication.hasMany(JobApplicationStageHistory, {
  foreignKey: 'applicationId',
  as: 'stageHistory',
  onDelete: 'CASCADE',
  hooks: true,
});
JobApplication.hasMany(JobApplicationNote, {
  foreignKey: 'applicationId',
  as: 'notes',
  onDelete: 'CASCADE',
  hooks: true,
});
JobApplication.hasMany(JobApplicationDocument, {
  foreignKey: 'applicationId',
  as: 'documents',
  onDelete: 'CASCADE',
  hooks: true,
});
JobApplication.hasMany(JobApplicationInterview, {
  foreignKey: 'applicationId',
  as: 'interviews',
  onDelete: 'CASCADE',
  hooks: true,
});

JobApplicationStageHistory.belongsTo(JobApplication, { foreignKey: 'applicationId', as: 'application' });
JobApplicationNote.belongsTo(JobApplication, { foreignKey: 'applicationId', as: 'application' });
JobApplicationDocument.belongsTo(JobApplication, { foreignKey: 'applicationId', as: 'application' });
JobApplicationInterview.belongsTo(JobApplication, { foreignKey: 'applicationId', as: 'application' });

export default JobApplication;
