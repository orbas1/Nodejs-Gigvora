import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

function ensureModel(name, factory) {
  if (sequelize.models[name]) {
    return sequelize.models[name];
  }
  return factory();
}

export const VOLUNTEERING_POST_STATUSES = Object.freeze(['draft', 'open', 'paused', 'closed', 'archived']);
export const VOLUNTEERING_APPLICATION_STATUSES = Object.freeze([
  'submitted',
  'in_review',
  'interview',
  'offer',
  'placed',
  'declined',
  'withdrawn',
]);
export const VOLUNTEERING_RESPONSE_TYPES = Object.freeze(['message', 'note', 'status_update']);
export const VOLUNTEERING_INTERVIEW_STATUSES = Object.freeze([
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled',
]);
export const VOLUNTEERING_CONTRACT_STATUSES = Object.freeze(['draft', 'active', 'completed', 'cancelled']);
export const VOLUNTEERING_CONTRACT_TYPES = Object.freeze(['fixed_term', 'ongoing', 'event']);

export const VolunteeringPost = ensureModel('VolunteeringPost', () =>
  sequelize.define(
    'VolunteeringPost',
    {
      workspaceId: { type: DataTypes.INTEGER, allowNull: false },
      createdById: { type: DataTypes.INTEGER, allowNull: true },
      updatedById: { type: DataTypes.INTEGER, allowNull: true },
      title: { type: DataTypes.STRING(180), allowNull: false },
      summary: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT('long'), allowNull: true },
      status: {
        type: DataTypes.ENUM(...VOLUNTEERING_POST_STATUSES),
        allowNull: false,
        defaultValue: 'draft',
      },
      location: { type: DataTypes.STRING(255), allowNull: true },
      remoteFriendly: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      commitmentHours: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      applicationUrl: { type: DataTypes.STRING(500), allowNull: true },
      contactEmail: { type: DataTypes.STRING(255), allowNull: true },
      startDate: { type: DataTypes.DATE, allowNull: true },
      endDate: { type: DataTypes.DATE, allowNull: true },
      applicationDeadline: { type: DataTypes.DATE, allowNull: true },
      tags: { type: jsonType, allowNull: true },
      skills: { type: jsonType, allowNull: true },
      benefits: { type: jsonType, allowNull: true },
      requirements: { type: jsonType, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
    },
    {
      tableName: 'volunteering_posts',
      underscored: true,
      indexes: [
        { fields: ['workspace_id'] },
        { fields: ['status'] },
        { fields: ['application_deadline'] },
      ],
    },
  ),
);

export const VolunteeringApplication = ensureModel('VolunteeringApplication', () =>
  sequelize.define(
    'VolunteeringApplication',
    {
      workspaceId: { type: DataTypes.INTEGER, allowNull: false },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'volunteering_posts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdById: { type: DataTypes.INTEGER, allowNull: true },
      updatedById: { type: DataTypes.INTEGER, allowNull: true },
      candidateName: { type: DataTypes.STRING(180), allowNull: false },
      candidateEmail: { type: DataTypes.STRING(255), allowNull: true },
      candidatePhone: { type: DataTypes.STRING(60), allowNull: true },
      resumeUrl: { type: DataTypes.STRING(500), allowNull: true },
      portfolioUrl: { type: DataTypes.STRING(500), allowNull: true },
      coverLetter: { type: DataTypes.TEXT('long'), allowNull: true },
      status: {
        type: DataTypes.ENUM(...VOLUNTEERING_APPLICATION_STATUSES),
        allowNull: false,
        defaultValue: 'submitted',
      },
      stage: { type: DataTypes.STRING(120), allowNull: true },
      submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      reviewedAt: { type: DataTypes.DATE, allowNull: true },
      assignedTo: { type: DataTypes.STRING(180), allowNull: true },
      source: { type: DataTypes.STRING(120), allowNull: true },
      notes: { type: DataTypes.TEXT('long'), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
    },
    {
      tableName: 'volunteering_applications',
      underscored: true,
      indexes: [
        { fields: ['workspace_id'] },
        { fields: ['post_id'] },
        { fields: ['status'] },
        { fields: ['submitted_at'] },
      ],
    },
  ),
);

export const VolunteeringApplicationResponse = ensureModel('VolunteeringApplicationResponse', () =>
  sequelize.define(
    'VolunteeringApplicationResponse',
    {
      workspaceId: { type: DataTypes.INTEGER, allowNull: false },
      applicationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'volunteering_applications', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      actorId: { type: DataTypes.INTEGER, allowNull: true },
      actorName: { type: DataTypes.STRING(180), allowNull: true },
      actorRole: { type: DataTypes.STRING(120), allowNull: true },
      responseType: {
        type: DataTypes.ENUM(...VOLUNTEERING_RESPONSE_TYPES),
        allowNull: false,
        defaultValue: 'message',
      },
      visibility: {
        type: DataTypes.ENUM('internal', 'candidate'),
        allowNull: false,
        defaultValue: 'internal',
      },
      message: { type: DataTypes.TEXT('long'), allowNull: false },
      attachments: { type: jsonType, allowNull: true },
      sentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      metadata: { type: jsonType, allowNull: true },
    },
    {
      tableName: 'volunteering_application_responses',
      underscored: true,
      indexes: [
        { fields: ['workspace_id'] },
        { fields: ['application_id'] },
        { fields: ['sent_at'] },
      ],
    },
  ),
);

export const VolunteeringInterview = ensureModel('VolunteeringInterview', () =>
  sequelize.define(
    'VolunteeringInterview',
    {
      workspaceId: { type: DataTypes.INTEGER, allowNull: false },
      applicationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'volunteering_applications', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdById: { type: DataTypes.INTEGER, allowNull: true },
      updatedById: { type: DataTypes.INTEGER, allowNull: true },
      scheduledAt: { type: DataTypes.DATE, allowNull: false },
      durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
      interviewerName: { type: DataTypes.STRING(180), allowNull: true },
      interviewerEmail: { type: DataTypes.STRING(255), allowNull: true },
      location: { type: DataTypes.STRING(255), allowNull: true },
      meetingUrl: { type: DataTypes.STRING(500), allowNull: true },
      status: {
        type: DataTypes.ENUM(...VOLUNTEERING_INTERVIEW_STATUSES),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      feedback: { type: DataTypes.TEXT('long'), allowNull: true },
      score: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
      notes: { type: DataTypes.TEXT('long'), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
    },
    {
      tableName: 'volunteering_interviews',
      underscored: true,
      indexes: [
        { fields: ['workspace_id'] },
        { fields: ['application_id'] },
        { fields: ['scheduled_at'] },
        { fields: ['status'] },
      ],
    },
  ),
);

export const VolunteeringContract = ensureModel('VolunteeringContract', () =>
  sequelize.define(
    'VolunteeringContract',
    {
      workspaceId: { type: DataTypes.INTEGER, allowNull: false },
      applicationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'volunteering_applications', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdById: { type: DataTypes.INTEGER, allowNull: true },
      updatedById: { type: DataTypes.INTEGER, allowNull: true },
      title: { type: DataTypes.STRING(200), allowNull: false },
      status: {
        type: DataTypes.ENUM(...VOLUNTEERING_CONTRACT_STATUSES),
        allowNull: false,
        defaultValue: 'draft',
      },
      contractType: {
        type: DataTypes.ENUM(...VOLUNTEERING_CONTRACT_TYPES),
        allowNull: false,
        defaultValue: 'fixed_term',
      },
      startDate: { type: DataTypes.DATE, allowNull: true },
      endDate: { type: DataTypes.DATE, allowNull: true },
      hoursPerWeek: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      stipendAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
      deliverables: { type: jsonType, allowNull: true },
      terms: { type: DataTypes.TEXT('long'), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
    },
    {
      tableName: 'volunteering_contracts',
      underscored: true,
      indexes: [
        { fields: ['workspace_id'] },
        { fields: ['application_id'] },
        { fields: ['status'] },
      ],
    },
  ),
);

export const VolunteeringContractSpend = ensureModel('VolunteeringContractSpend', () =>
  sequelize.define(
    'VolunteeringContractSpend',
    {
      workspaceId: { type: DataTypes.INTEGER, allowNull: false },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'volunteering_contracts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdById: { type: DataTypes.INTEGER, allowNull: true },
      updatedById: { type: DataTypes.INTEGER, allowNull: true },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
      category: { type: DataTypes.STRING(120), allowNull: true },
      description: { type: DataTypes.STRING(255), allowNull: true },
      spentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      receiptUrl: { type: DataTypes.STRING(500), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
    },
    {
      tableName: 'volunteering_contract_spend',
      underscored: true,
      indexes: [
        { fields: ['workspace_id'] },
        { fields: ['contract_id'] },
        { fields: ['spent_at'] },
      ],
    },
  ),
);

VolunteeringPost.hasMany(VolunteeringApplication, { foreignKey: 'postId', as: 'applications' });
VolunteeringApplication.belongsTo(VolunteeringPost, { foreignKey: 'postId', as: 'post' });

VolunteeringApplication.hasMany(VolunteeringApplicationResponse, {
  foreignKey: 'applicationId',
  as: 'responses',
});
VolunteeringApplicationResponse.belongsTo(VolunteeringApplication, {
  foreignKey: 'applicationId',
  as: 'application',
});

VolunteeringApplication.hasMany(VolunteeringInterview, {
  foreignKey: 'applicationId',
  as: 'interviews',
});
VolunteeringInterview.belongsTo(VolunteeringApplication, {
  foreignKey: 'applicationId',
  as: 'application',
});

VolunteeringApplication.hasMany(VolunteeringContract, {
  foreignKey: 'applicationId',
  as: 'contracts',
});
VolunteeringContract.belongsTo(VolunteeringApplication, {
  foreignKey: 'applicationId',
  as: 'application',
});

VolunteeringContract.hasMany(VolunteeringContractSpend, {
  foreignKey: 'contractId',
  as: 'spendEntries',
});
VolunteeringContractSpend.belongsTo(VolunteeringContract, {
  foreignKey: 'contractId',
  as: 'contract',
});

export default {
  VolunteeringPost,
  VolunteeringApplication,
  VolunteeringApplicationResponse,
  VolunteeringInterview,
  VolunteeringContract,
  VolunteeringContractSpend,
  VOLUNTEERING_POST_STATUSES,
  VOLUNTEERING_APPLICATION_STATUSES,
  VOLUNTEERING_RESPONSE_TYPES,
  VOLUNTEERING_INTERVIEW_STATUSES,
  VOLUNTEERING_CONTRACT_STATUSES,
  VOLUNTEERING_CONTRACT_TYPES,
};
