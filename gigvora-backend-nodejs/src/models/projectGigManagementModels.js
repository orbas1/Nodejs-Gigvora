import { Sequelize, DataTypes } from 'sequelize';
import databaseConfig from '../config/database.js';
import { GIG_ORDER_ACTIVITY_TYPES, GIG_ORDER_ESCROW_STATUSES } from './constants/index.js';

const { url, ...sequelizeOptions } = databaseConfig;

export const projectGigManagementSequelize = url
  ? new Sequelize(url, { ...sequelizeOptions, define: { underscored: true, ...sequelizeOptions.define } })
  : new Sequelize({ ...sequelizeOptions, define: { underscored: true, ...sequelizeOptions.define } });

const dialect = projectGigManagementSequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const PROJECT_STATUSES = ['planning', 'in_progress', 'at_risk', 'completed', 'on_hold'];
export const PROJECT_RISK_LEVELS = ['low', 'medium', 'high'];
export const PROJECT_COLLABORATOR_STATUSES = ['invited', 'active', 'inactive'];
export const PROJECT_INTEGRATION_STATUSES = ['connected', 'disconnected', 'error'];
export const GIG_ORDER_STATUSES = ['requirements', 'in_delivery', 'in_revision', 'completed', 'cancelled'];
export const GIG_REQUIREMENT_STATUSES = ['pending', 'received', 'approved'];
export const GIG_REVISION_STATUSES = ['requested', 'in_progress', 'submitted', 'approved'];
export const GIG_ESCROW_STATUSES = [...GIG_ORDER_ESCROW_STATUSES];

export const Project = projectGigManagementSequelize.define(
  'PgmProject',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM(...PROJECT_STATUSES), allowNull: false, defaultValue: 'planning' },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    budgetCurrency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    budgetAllocated: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    budgetSpent: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_projects', underscored: true },
);

export const ProjectWorkspace = projectGigManagementSequelize.define(
  'PgmProjectWorkspace',
  {
    status: { type: DataTypes.ENUM(...PROJECT_STATUSES), allowNull: false, defaultValue: 'planning' },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    riskLevel: { type: DataTypes.ENUM(...PROJECT_RISK_LEVELS), allowNull: false, defaultValue: 'low' },
    nextMilestone: { type: DataTypes.STRING(180), allowNull: true },
    nextMilestoneDueAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metrics: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspaces', underscored: true },
);

export const ProjectMilestone = projectGigManagementSequelize.define(
  'PgmProjectMilestone',
  {
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ordinal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'waiting_on_client', 'completed'),
      allowNull: false,
      defaultValue: 'planned',
    },
    budget: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    metrics: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_milestones', underscored: true },
);

export const ProjectCollaborator = projectGigManagementSequelize.define(
  'PgmProjectCollaborator',
  {
    fullName: { type: DataTypes.STRING(180), allowNull: false },
    email: { type: DataTypes.STRING(180), allowNull: true },
    role: { type: DataTypes.STRING(120), allowNull: false },
    status: { type: DataTypes.ENUM(...PROJECT_COLLABORATOR_STATUSES), allowNull: false, defaultValue: 'invited' },
    hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    permissions: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_collaborators', underscored: true },
);

export const ProjectIntegration = projectGigManagementSequelize.define(
  'PgmProjectIntegration',
  {
    provider: { type: DataTypes.STRING(80), allowNull: false },
    status: { type: DataTypes.ENUM(...PROJECT_INTEGRATION_STATUSES), allowNull: false, defaultValue: 'connected' },
    connectedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_integrations', underscored: true },
);

export const ProjectRetrospective = projectGigManagementSequelize.define(
  'PgmProjectRetrospective',
  {
    milestoneTitle: { type: DataTypes.STRING(180), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    sentiment: { type: DataTypes.STRING(40), allowNull: true },
    generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    highlights: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_retrospectives', underscored: true },
);

export const ProjectAsset = projectGigManagementSequelize.define(
  'PgmProjectAsset',
  {
    label: { type: DataTypes.STRING(180), allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: false },
    storageUrl: { type: DataTypes.STRING(255), allowNull: false },
    thumbnailUrl: { type: DataTypes.STRING(255), allowNull: true },
    sizeBytes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    permissionLevel: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'internal' },
    watermarkEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    checksum: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_assets', underscored: true },
);

export const ProjectTemplate = projectGigManagementSequelize.define(
  'PgmProjectTemplate',
  {
    name: { type: DataTypes.STRING(180), allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    durationWeeks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 4 },
    recommendedBudgetMin: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    recommendedBudgetMax: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    toolkit: { type: jsonType, allowNull: true },
    prompts: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_templates', underscored: true },
);

export const GigOrder = projectGigManagementSequelize.define(
  'PgmGigOrder',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    orderNumber: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    vendorName: { type: DataTypes.STRING(180), allowNull: false },
    serviceName: { type: DataTypes.STRING(180), allowNull: false },
    status: { type: DataTypes.ENUM(...GIG_ORDER_STATUSES), allowNull: false, defaultValue: 'requirements' },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    kickoffAt: { type: DataTypes.DATE, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_gig_orders', underscored: true },
);

export const GigOrderRequirement = projectGigManagementSequelize.define(
  'PgmGigOrderRequirement',
  {
    title: { type: DataTypes.STRING(180), allowNull: false },
    status: { type: DataTypes.ENUM(...GIG_REQUIREMENT_STATUSES), allowNull: false, defaultValue: 'pending' },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'pgm_gig_order_requirements', underscored: true },
);

export const GigOrderRevision = projectGigManagementSequelize.define(
  'PgmGigOrderRevision',
  {
    roundNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: { type: DataTypes.ENUM(...GIG_REVISION_STATUSES), allowNull: false, defaultValue: 'requested' },
    requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'pgm_gig_order_revisions', underscored: true },
);

export const GigVendorScorecard = projectGigManagementSequelize.define(
  'PgmGigVendorScorecard',
  {
    qualityScore: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    communicationScore: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    reliabilityScore: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    overallScore: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'pgm_vendor_scorecards', underscored: true },
);

export const GigOrderEscrowCheckpoint = projectGigManagementSequelize.define(
  'PgmGigOrderEscrowCheckpoint',
  {
    label: { type: DataTypes.STRING(120), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.ENUM(...GIG_ESCROW_STATUSES), allowNull: false, defaultValue: 'funded' },
    approvalRequirement: { type: DataTypes.STRING(160), allowNull: true },
    csatThreshold: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    releasedAt: { type: DataTypes.DATE, allowNull: true },
    releasedById: { type: DataTypes.INTEGER, allowNull: true },
    payoutReference: { type: DataTypes.STRING(160), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'pgm_gig_order_escrows', underscored: true },
);

export const GigOrderActivity = projectGigManagementSequelize.define(
  'PgmGigOrderActivity',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: true },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    activityType: { type: DataTypes.ENUM(...GIG_ORDER_ACTIVITY_TYPES), allowNull: false, defaultValue: 'system' },
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_gig_order_activities', underscored: true },
);

export const GigOrderMessage = projectGigManagementSequelize.define(
  'PgmGigOrderMessage',
  {
    authorId: { type: DataTypes.INTEGER, allowNull: false },
    authorName: { type: DataTypes.STRING(180), allowNull: false },
    roleLabel: { type: DataTypes.STRING(120), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    attachments: { type: jsonType, allowNull: true },
    visibility: { type: DataTypes.ENUM('private', 'shared'), allowNull: false, defaultValue: 'private' },
    postedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: 'pgm_gig_order_messages', underscored: true },
);

export const StoryBlock = projectGigManagementSequelize.define(
  'PgmStoryBlock',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    outcome: { type: DataTypes.TEXT, allowNull: false },
    impact: { type: DataTypes.STRING(180), allowNull: true },
    metrics: { type: jsonType, allowNull: true },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'pgm_story_blocks', underscored: true },
);

export const BrandAsset = projectGigManagementSequelize.define(
  'PgmBrandAsset',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    assetType: { type: DataTypes.STRING(60), allowNull: false },
    visibility: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'private' },
    mediaUrl: { type: DataTypes.STRING(255), allowNull: false },
    watermarkEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_brand_assets', underscored: true },
);

Project.hasOne(ProjectWorkspace, { as: 'workspace', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectWorkspace.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectMilestone, { as: 'milestones', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectMilestone.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectCollaborator, { as: 'collaborators', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectCollaborator.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectIntegration, { as: 'integrations', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectIntegration.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectRetrospective, { as: 'retrospectives', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectRetrospective.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectAsset, { as: 'assets', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectAsset.belongsTo(Project, { foreignKey: 'projectId' });

GigOrder.hasMany(GigOrderRequirement, { as: 'requirements', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigOrderRequirement.belongsTo(GigOrder, { foreignKey: 'orderId' });

GigOrder.hasMany(GigOrderRevision, { as: 'revisions', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigOrderRevision.belongsTo(GigOrder, { foreignKey: 'orderId' });

GigOrder.hasOne(GigVendorScorecard, { as: 'scorecard', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigVendorScorecard.belongsTo(GigOrder, { foreignKey: 'orderId' });

GigOrder.hasMany(GigOrderEscrowCheckpoint, { as: 'escrowCheckpoints', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigOrderEscrowCheckpoint.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });

GigOrder.hasMany(GigOrderActivity, { as: 'activities', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigOrderActivity.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });

GigOrder.hasMany(GigOrderMessage, { as: 'messages', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigOrderMessage.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });

export async function syncProjectGigManagementModels(options = {}) {
  await projectGigManagementSequelize.sync({ alter: false, ...options });
}

export default {
  projectGigManagementSequelize,
  Project,
  ProjectWorkspace,
  ProjectMilestone,
  ProjectCollaborator,
  ProjectIntegration,
  ProjectRetrospective,
  ProjectAsset,
  ProjectTemplate,
  GigOrder,
  GigOrderRequirement,
  GigOrderRevision,
  GigVendorScorecard,
  GigOrderEscrowCheckpoint,
  GigOrderActivity,
  GigOrderMessage,
  StoryBlock,
  BrandAsset,
};
