import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const GOVERNANCE_CONTENT_STATUSES = [
  'pending',
  'in_review',
  'approved',
  'rejected',
  'escalated',
  'needs_changes',
];

export const GOVERNANCE_CONTENT_SEVERITIES = ['low', 'medium', 'high', 'critical'];

export const GOVERNANCE_CONTENT_PRIORITIES = ['low', 'standard', 'high', 'urgent'];

export const GOVERNANCE_ACTION_TYPES = [
  'assign',
  'approve',
  'reject',
  'escalate',
  'request_changes',
  'restore',
  'suspend',
  'add_note',
];

export const GovernanceContentSubmission = sequelize.define(
  'GovernanceContentSubmission',
  {
    referenceId: { type: DataTypes.STRING(120), allowNull: false },
    referenceType: { type: DataTypes.STRING(120), allowNull: false },
    channel: { type: DataTypes.STRING(120), allowNull: true },
    submittedById: { type: DataTypes.INTEGER, allowNull: true },
    submittedByType: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'user' },
    assignedReviewerId: { type: DataTypes.INTEGER, allowNull: true },
    assignedTeam: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...GOVERNANCE_CONTENT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [GOVERNANCE_CONTENT_STATUSES] },
    },
    priority: {
      type: DataTypes.ENUM(...GOVERNANCE_CONTENT_PRIORITIES),
      allowNull: false,
      defaultValue: 'standard',
      validate: { isIn: [GOVERNANCE_CONTENT_PRIORITIES] },
    },
    severity: {
      type: DataTypes.ENUM(...GOVERNANCE_CONTENT_SEVERITIES),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [GOVERNANCE_CONTENT_SEVERITIES] },
    },
    riskScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    title: { type: DataTypes.STRING(240), allowNull: false },
    summary: { type: DataTypes.STRING(600), allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    lastActivityAt: { type: DataTypes.DATE, allowNull: true },
    slaMinutes: { type: DataTypes.INTEGER, allowNull: true },
    region: { type: DataTypes.STRING(60), allowNull: true },
    language: { type: DataTypes.STRING(12), allowNull: true },
    metadata: { type: jsonType, allowNull: true, defaultValue: {} },
    rejectionReason: { type: DataTypes.STRING(600), allowNull: true },
    resolutionNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'governance_content_submissions',
    indexes: [
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['severity'] },
      { fields: ['assignedReviewerId'] },
      { fields: ['submittedAt'] },
      { fields: ['referenceId', 'referenceType'], unique: false },
    ],
  },
);

export const GovernanceModerationAction = sequelize.define(
  'GovernanceModerationAction',
  {
    submissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: GovernanceContentSubmission,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    actorType: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'admin' },
    action: {
      type: DataTypes.ENUM(...GOVERNANCE_ACTION_TYPES),
      allowNull: false,
      defaultValue: 'add_note',
      validate: { isIn: [GOVERNANCE_ACTION_TYPES] },
    },
    severity: {
      type: DataTypes.ENUM(...GOVERNANCE_CONTENT_SEVERITIES),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [GOVERNANCE_CONTENT_SEVERITIES] },
    },
    riskScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    reason: { type: DataTypes.STRING(600), allowNull: true },
    guidanceLink: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true, defaultValue: {} },
    resolutionSummary: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'governance_moderation_actions',
    indexes: [
      { fields: ['submissionId'] },
      { fields: ['action'] },
      { fields: ['createdAt'] },
    ],
  },
);

GovernanceContentSubmission.hasMany(GovernanceModerationAction, {
  foreignKey: 'submissionId',
  as: 'actions',
});

GovernanceModerationAction.belongsTo(GovernanceContentSubmission, {
  foreignKey: 'submissionId',
  as: 'submission',
});

export default {
  GovernanceContentSubmission,
  GovernanceModerationAction,
  GOVERNANCE_CONTENT_STATUSES,
  GOVERNANCE_CONTENT_SEVERITIES,
  GOVERNANCE_CONTENT_PRIORITIES,
  GOVERNANCE_ACTION_TYPES,
};
