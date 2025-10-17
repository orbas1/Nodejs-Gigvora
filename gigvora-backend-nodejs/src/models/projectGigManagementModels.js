import { Sequelize, DataTypes } from 'sequelize';
import databaseConfig from '../config/database.js';

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
export const CLIENT_ACCOUNT_TIERS = ['strategic', 'growth', 'core', 'incubating'];
export const CLIENT_ACCOUNT_STATUSES = ['active', 'onboarding', 'paused', 'closed'];
export const CLIENT_ACCOUNT_HEALTH_STATUSES = ['healthy', 'monitor', 'at_risk'];
export const CLIENT_KANBAN_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const CLIENT_KANBAN_RISK_LEVELS = ['low', 'medium', 'high'];

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

export const ClientAccount = projectGigManagementSequelize.define(
  'PgmClientAccount',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: true, unique: false },
    websiteUrl: { type: DataTypes.STRING(255), allowNull: true },
    logoUrl: { type: DataTypes.STRING(255), allowNull: true },
    industry: { type: DataTypes.STRING(120), allowNull: true },
    tier: { type: DataTypes.ENUM(...CLIENT_ACCOUNT_TIERS), allowNull: false, defaultValue: 'growth' },
    status: { type: DataTypes.ENUM(...CLIENT_ACCOUNT_STATUSES), allowNull: false, defaultValue: 'active' },
    healthStatus: { type: DataTypes.ENUM(...CLIENT_ACCOUNT_HEALTH_STATUSES), allowNull: false, defaultValue: 'healthy' },
    annualContractValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    timezone: { type: DataTypes.STRING(60), allowNull: true },
    primaryContactName: { type: DataTypes.STRING(180), allowNull: true },
    primaryContactEmail: { type: DataTypes.STRING(180), allowNull: true },
    primaryContactPhone: { type: DataTypes.STRING(60), allowNull: true },
    accountManagerName: { type: DataTypes.STRING(180), allowNull: true },
    accountManagerEmail: { type: DataTypes.STRING(180), allowNull: true },
    lastInteractionAt: { type: DataTypes.DATE, allowNull: true },
    nextReviewAt: { type: DataTypes.DATE, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_client_accounts', underscored: true },
);

export const ClientKanbanColumn = projectGigManagementSequelize.define(
  'PgmClientKanbanColumn',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: true },
    wipLimit: { type: DataTypes.INTEGER, allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    color: { type: DataTypes.STRING(30), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_client_kanban_columns', underscored: true },
);

export const ClientKanbanCard = projectGigManagementSequelize.define(
  'PgmClientKanbanCard',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    columnId: { type: DataTypes.INTEGER, allowNull: false },
    clientId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    projectName: { type: DataTypes.STRING(180), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    priority: { type: DataTypes.ENUM(...CLIENT_KANBAN_PRIORITIES), allowNull: false, defaultValue: 'medium' },
    riskLevel: { type: DataTypes.ENUM(...CLIENT_KANBAN_RISK_LEVELS), allowNull: false, defaultValue: 'low' },
    valueCurrency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    valueAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    potentialMonthlyValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    contactName: { type: DataTypes.STRING(180), allowNull: true },
    contactEmail: { type: DataTypes.STRING(180), allowNull: true },
    ownerName: { type: DataTypes.STRING(180), allowNull: true },
    ownerEmail: { type: DataTypes.STRING(180), allowNull: true },
    healthStatus: { type: DataTypes.ENUM(...CLIENT_ACCOUNT_HEALTH_STATUSES), allowNull: false, defaultValue: 'healthy' },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    lastInteractionAt: { type: DataTypes.DATE, allowNull: true },
    nextInteractionAt: { type: DataTypes.DATE, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    checklistSummary: { type: jsonType, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'pgm_client_kanban_cards', underscored: true },
);

export const ClientKanbanChecklistItem = projectGigManagementSequelize.define(
  'PgmClientKanbanChecklistItem',
  {
    cardId: { type: DataTypes.INTEGER, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_client_kanban_checklist_items', underscored: true },
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

ClientAccount.hasMany(ClientKanbanCard, { as: 'kanbanCards', foreignKey: 'clientId', onDelete: 'SET NULL' });
ClientKanbanCard.belongsTo(ClientAccount, { as: 'client', foreignKey: 'clientId' });

ClientKanbanColumn.hasMany(ClientKanbanCard, { as: 'cards', foreignKey: 'columnId', onDelete: 'CASCADE' });
ClientKanbanCard.belongsTo(ClientKanbanColumn, { as: 'column', foreignKey: 'columnId' });

ClientKanbanCard.hasMany(ClientKanbanChecklistItem, { as: 'checklist', foreignKey: 'cardId', onDelete: 'CASCADE' });
ClientKanbanChecklistItem.belongsTo(ClientKanbanCard, { foreignKey: 'cardId' });

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
  ClientAccount,
  ClientKanbanColumn,
  ClientKanbanCard,
  ClientKanbanChecklistItem,
  StoryBlock,
  BrandAsset,
};
