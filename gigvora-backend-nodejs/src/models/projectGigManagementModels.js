import { Sequelize, DataTypes } from 'sequelize';
import databaseConfig from '../config/database.js';
import { COMPANY_ORDER_SLA_STATUSES as SHARED_COMPANY_ORDER_SLA_STATUSES } from './constants/index.js';

const { url, ...sequelizeOptions } = databaseConfig;
const connectionOptions = {
  ...sequelizeOptions,
  define: { underscored: true, ...(sequelizeOptions.define ?? {}) },
};

export const projectGigManagementSequelize = url
  ? new Sequelize(url, connectionOptions)
  : new Sequelize({ ...connectionOptions });

const dialect = projectGigManagementSequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

const GIG_ORDER_ACTIVITY_TYPES = Object.freeze(['system', 'client', 'vendor', 'internal']);
const GIG_ORDER_ESCROW_STATUSES = Object.freeze(['pending', 'released', 'refunded', 'cancelled']);
const COMPANY_ORDER_SLA_STATUSES = SHARED_COMPANY_ORDER_SLA_STATUSES;

export const PROJECT_STATUSES = Object.freeze(['planning', 'in_progress', 'at_risk', 'completed', 'on_hold']);
export const PROJECT_RISK_LEVELS = Object.freeze(['low', 'medium', 'high']);
export const PROJECT_COLLABORATOR_STATUSES = Object.freeze(['invited', 'active', 'inactive']);
export const PROJECT_INTEGRATION_STATUSES = Object.freeze(['connected', 'disconnected', 'error']);
export const GIG_ORDER_STATUSES = Object.freeze(['requirements', 'in_delivery', 'in_revision', 'completed', 'cancelled']);
export const GIG_REQUIREMENT_STATUSES = Object.freeze(['pending', 'received', 'approved']);
export const GIG_REVISION_STATUSES = Object.freeze(['requested', 'in_progress', 'submitted', 'approved']);
export const PROJECT_BID_STATUSES = Object.freeze(['draft', 'submitted', 'shortlisted', 'awarded', 'declined', 'expired']);
export const PROJECT_INVITATION_STATUSES = Object.freeze(['pending', 'accepted', 'declined', 'expired', 'revoked']);
export const PROJECT_AUTOMATCH_DECISION_STATUSES = Object.freeze(['pending', 'accepted', 'rejected']);
export const AUTO_MATCH_STATUS = Object.freeze(['suggested', 'contacted', 'engaged', 'dismissed']);
export const REVIEW_SUBJECT_TYPES = Object.freeze(['vendor', 'freelancer', 'mentor', 'project']);
export const GIG_ESCROW_TRANSACTION_TYPES = Object.freeze(['deposit', 'release', 'refund', 'fee', 'adjustment']);
export const GIG_ESCROW_TRANSACTION_STATUSES = Object.freeze(['pending', 'completed', 'failed']);
export const GIG_TIMELINE_EVENT_TYPES = Object.freeze([
  'kickoff',
  'milestone',
  'check_in',
  'checkpoint',
  'scope_change',
  'handoff',
  'qa_review',
  'client_feedback',
  'retro',
  'note',
  'blocker',
]);
export const GIG_TIMELINE_EVENT_STATUSES = Object.freeze(['scheduled', 'in_progress', 'completed', 'cancelled']);
export const GIG_TIMELINE_VISIBILITIES = Object.freeze(['internal', 'client', 'vendor']);
export const GIG_SUBMISSION_STATUSES = Object.freeze(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'needs_changes']);
export const GIG_CHAT_VISIBILITIES = Object.freeze(['internal', 'client', 'vendor']);
export const CLIENT_ACCOUNT_TIERS = Object.freeze(['strategic', 'growth', 'core', 'incubating']);
export const CLIENT_ACCOUNT_STATUSES = Object.freeze(['active', 'onboarding', 'paused', 'closed']);
export const CLIENT_ACCOUNT_HEALTH_STATUSES = Object.freeze(['healthy', 'monitor', 'at_risk']);
export const CLIENT_KANBAN_PRIORITIES = Object.freeze(['low', 'medium', 'high', 'critical']);
export const CLIENT_KANBAN_RISK_LEVELS = Object.freeze(['low', 'medium', 'high']);
export const WORKSPACE_BUDGET_STATUSES = Object.freeze(['planned', 'approved', 'in_progress', 'completed', 'overbudget']);
export const WORKSPACE_TASK_STATUSES = Object.freeze(['planned', 'in_progress', 'blocked', 'completed', 'cancelled']);
export const WORKSPACE_TASK_PRIORITIES = Object.freeze(['low', 'medium', 'high', 'critical']);
export const WORKSPACE_MEETING_STATUSES = Object.freeze(['scheduled', 'completed', 'cancelled']);
export const WORKSPACE_INVITE_STATUSES = Object.freeze(['pending', 'accepted', 'declined', 'expired']);
export const WORKSPACE_ROLE_STATUSES = Object.freeze(['draft', 'active', 'backfill', 'closed']);
export const WORKSPACE_SUBMISSION_STATUSES = Object.freeze(['pending', 'in_review', 'approved', 'changes_requested']);
export const WORKSPACE_HR_STATUSES = Object.freeze(['planned', 'active', 'on_leave', 'completed']);
export const WORKSPACE_TIME_ENTRY_STATUSES = Object.freeze(['draft', 'submitted', 'approved', 'rejected']);
export const WORKSPACE_OBJECT_TYPES = Object.freeze(['asset', 'deliverable', 'dependency', 'risk', 'note']);

export const Project = projectGigManagementSequelize.define(
  'PgmProject',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'General' },
    skills: { type: jsonType, allowNull: false, defaultValue: [] },
    durationWeeks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 4 },
    status: { type: DataTypes.ENUM(...PROJECT_STATUSES), allowNull: false, defaultValue: 'planning' },
    lifecycleState: { type: DataTypes.ENUM('open', 'closed'), allowNull: false, defaultValue: 'open' },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    budgetCurrency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    budgetAllocated: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    budgetSpent: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    autoMatchEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoMatchAcceptEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoMatchRejectEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoMatchBudgetMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    autoMatchBudgetMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    autoMatchWeeklyHoursMin: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    autoMatchWeeklyHoursMax: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    autoMatchDurationWeeksMin: { type: DataTypes.INTEGER, allowNull: true },
    autoMatchDurationWeeksMax: { type: DataTypes.INTEGER, allowNull: true },
    autoMatchSkills: { type: jsonType, allowNull: true },
    autoMatchNotes: { type: DataTypes.TEXT, allowNull: true },
    autoMatchUpdatedBy: { type: DataTypes.INTEGER, allowNull: true },
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

const DEFAULT_GIG_ACTIVITY_TYPE = GIG_ORDER_ACTIVITY_TYPES.includes('system')
  ? 'system'
  : GIG_ORDER_ACTIVITY_TYPES[0];

export const ProjectAutoMatchFreelancer = projectGigManagementSequelize.define(
  'PgmProjectAutoMatchFreelancer',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerName: { type: DataTypes.STRING(180), allowNull: false },
    freelancerRole: { type: DataTypes.STRING(120), allowNull: true },
    score: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    autoMatchEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    status: { type: DataTypes.ENUM(...PROJECT_AUTOMATCH_DECISION_STATUSES), allowNull: false, defaultValue: 'pending' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_automatch_freelancers', underscored: true },
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
    atsExternalId: { type: DataTypes.STRING(180), allowNull: true },
    atsLastStatus: { type: DataTypes.STRING(60), allowNull: true },
    atsLastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    slaStatus: { type: DataTypes.ENUM(...COMPANY_ORDER_SLA_STATUSES), allowNull: false, defaultValue: 'on_track' },
    slaEscalatedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'pgm_gig_orders', underscored: true },
);

export const GigOrderRequirement = projectGigManagementSequelize.define(
  'PgmGigOrderRequirement',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
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
    orderId: { type: DataTypes.INTEGER, allowNull: false },
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
    orderId: { type: DataTypes.INTEGER, allowNull: false },
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
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(120), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.ENUM(...GIG_ORDER_ESCROW_STATUSES), allowNull: false, defaultValue: 'funded' },
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
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerId: { type: DataTypes.INTEGER, allowNull: true },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    activityType: { type: DataTypes.ENUM(...GIG_ORDER_ACTIVITY_TYPES), allowNull: false, defaultValue: DEFAULT_GIG_ACTIVITY_TYPE },
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
    orderId: { type: DataTypes.INTEGER, allowNull: false },
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

export const GigTimelineEvent = projectGigManagementSequelize.define(
  'PgmGigTimelineEvent',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    eventType: { type: DataTypes.ENUM(...GIG_TIMELINE_EVENT_TYPES), allowNull: false, defaultValue: 'note' },
    title: { type: DataTypes.STRING(180), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...GIG_TIMELINE_EVENT_STATUSES), allowNull: false, defaultValue: 'scheduled' },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    visibility: { type: DataTypes.ENUM(...GIG_TIMELINE_VISIBILITIES), allowNull: false, defaultValue: 'internal' },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_gig_timeline_events', underscored: true },
);

export const GigSubmission = projectGigManagementSequelize.define(
  'PgmGigSubmission',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...GIG_SUBMISSION_STATUSES), allowNull: false, defaultValue: 'draft' },
    assetUrl: { type: DataTypes.STRING(255), allowNull: true },
    assetType: { type: DataTypes.STRING(80), allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    submittedById: { type: DataTypes.INTEGER, allowNull: true },
    reviewedById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_gig_submissions', underscored: true },
);

export const GigSubmissionAsset = projectGigManagementSequelize.define(
  'PgmGigSubmissionAsset',
  {
    submissionId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(180), allowNull: false },
    url: { type: DataTypes.STRING(255), allowNull: false },
    previewUrl: { type: DataTypes.STRING(255), allowNull: true },
    sizeBytes: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_gig_submission_assets', underscored: true },
);

export const GigChatMessage = projectGigManagementSequelize.define(
  'PgmGigChatMessage',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: true },
    senderRole: { type: DataTypes.STRING(80), allowNull: true },
    authorName: { type: DataTypes.STRING(180), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    attachments: { type: jsonType, allowNull: true },
    visibility: { type: DataTypes.ENUM(...GIG_CHAT_VISIBILITIES), allowNull: false, defaultValue: 'internal' },
    sentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    acknowledgedAt: { type: DataTypes.DATE, allowNull: true },
    acknowledgedById: { type: DataTypes.INTEGER, allowNull: true },
    pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_gig_chat_messages', underscored: true },
);

export const ClientAccount = projectGigManagementSequelize.define(
  'PgmClientAccount',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: true },
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

export const ProjectBid = projectGigManagementSequelize.define(
  'PgmProjectBid',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    vendorName: { type: DataTypes.STRING(160), allowNull: false },
    vendorEmail: { type: DataTypes.STRING(180), allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.ENUM(...PROJECT_BID_STATUSES), allowNull: false, defaultValue: 'draft' },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    validUntil: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_bids', underscored: true },
);

export const ProjectInvitation = projectGigManagementSequelize.define(
  'PgmProjectInvitation',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    freelancerName: { type: DataTypes.STRING(160), allowNull: false },
    freelancerEmail: { type: DataTypes.STRING(180), allowNull: true },
    role: { type: DataTypes.STRING(120), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...PROJECT_INVITATION_STATUSES), allowNull: false, defaultValue: 'pending' },
    inviteSentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_invitations', underscored: true },
);

export const AutoMatchSetting = projectGigManagementSequelize.define(
  'PgmAutoMatchSetting',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    matchingWindowDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 14 },
    budgetMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    targetRoles: { type: jsonType, allowNull: true },
    focusSkills: { type: jsonType, allowNull: true },
    geoPreferences: { type: jsonType, allowNull: true },
    seniority: { type: DataTypes.STRING(80), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_auto_match_settings', underscored: true },
);

export const AutoMatchCandidate = projectGigManagementSequelize.define(
  'PgmAutoMatchCandidate',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    freelancerName: { type: DataTypes.STRING(160), allowNull: false },
    freelancerEmail: { type: DataTypes.STRING(180), allowNull: true },
    matchScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM(...AUTO_MATCH_STATUS), allowNull: false, defaultValue: 'suggested' },
    matchedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    channel: { type: DataTypes.STRING(60), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_auto_match_candidates', underscored: true },
);

export const ProjectReview = projectGigManagementSequelize.define(
  'PgmProjectReview',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    orderId: { type: DataTypes.INTEGER, allowNull: true },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    subjectType: { type: DataTypes.ENUM(...REVIEW_SUBJECT_TYPES), allowNull: false, defaultValue: 'vendor' },
    subjectName: { type: DataTypes.STRING(160), allowNull: false },
    ratingOverall: { type: DataTypes.DECIMAL(3, 2), allowNull: false },
    ratingQuality: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    ratingCommunication: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    ratingProfessionalism: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    wouldRecommend: { type: DataTypes.BOOLEAN, allowNull: true },
    comments: { type: DataTypes.TEXT, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_reviews', underscored: true },
);

export const EscrowAccount = projectGigManagementSequelize.define(
  'PgmEscrowAccount',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    balance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    autoReleaseDays: { type: DataTypes.INTEGER, allowNull: true },
    lastAuditAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_escrow_accounts', underscored: true },
);

export const EscrowTransaction = projectGigManagementSequelize.define(
  'PgmEscrowTransaction',
  {
    accountId: { type: DataTypes.INTEGER, allowNull: false },
    reference: { type: DataTypes.STRING(64), allowNull: false },
    type: { type: DataTypes.ENUM(...GIG_ESCROW_TRANSACTION_TYPES), allowNull: false },
    status: { type: DataTypes.ENUM(...GIG_ESCROW_TRANSACTION_STATUSES), allowNull: false, defaultValue: 'pending' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    description: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_escrow_transactions', underscored: true },
);

export const ProjectWorkspaceBudgetLine = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceBudgetLine',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: false },
    label: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    plannedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    actualAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.ENUM(...WORKSPACE_BUDGET_STATUSES), allowNull: false, defaultValue: 'planned' },
    ownerName: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_budget_lines', underscored: true },
);

export const ProjectWorkspaceObjective = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceObjective',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ownerName: { type: DataTypes.STRING(120), allowNull: true },
    metric: { type: DataTypes.STRING(120), allowNull: true },
    targetValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currentValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'on_track' },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    weight: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_objectives', underscored: true },
);

export const ProjectWorkspaceTask = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceTask',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...WORKSPACE_TASK_STATUSES), allowNull: false, defaultValue: 'planned' },
    priority: { type: DataTypes.ENUM(...WORKSPACE_TASK_PRIORITIES), allowNull: false, defaultValue: 'medium' },
    lane: { type: DataTypes.STRING(120), allowNull: true },
    assigneeName: { type: DataTypes.STRING(120), allowNull: true },
    assigneeEmail: { type: DataTypes.STRING(180), allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    estimatedHours: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    loggedHours: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    dependencies: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_tasks', underscored: true },
);

export const ProjectWorkspaceMeeting = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceMeeting',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    agenda: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...WORKSPACE_MEETING_STATUSES), allowNull: false, defaultValue: 'scheduled' },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
    location: { type: DataTypes.STRING(180), allowNull: true },
    meetingLink: { type: DataTypes.STRING(255), allowNull: true },
    organizerName: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    followUpItems: { type: jsonType, allowNull: true },
    recurrenceRule: { type: DataTypes.STRING(180), allowNull: true },
  },
  { tableName: 'pgm_project_workspace_meetings', underscored: true },
);

export const ProjectWorkspaceCalendarEvent = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceCalendarEvent',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    eventType: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'milestone' },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: true },
    visibility: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'team' },
    location: { type: DataTypes.STRING(180), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    attendees: { type: jsonType, allowNull: true },
    reminderMinutesBefore: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_calendar_events', underscored: true },
);

export const ProjectWorkspaceRoleAssignment = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceRoleAssignment',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    roleName: { type: DataTypes.STRING(140), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    memberName: { type: DataTypes.STRING(120), allowNull: true },
    memberEmail: { type: DataTypes.STRING(180), allowNull: true },
    status: { type: DataTypes.ENUM(...WORKSPACE_ROLE_STATUSES), allowNull: false, defaultValue: 'draft' },
    allocationPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    permissions: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_role_assignments', underscored: true },
);

export const ProjectWorkspaceSubmission = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceSubmission',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    submissionType: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'deliverable' },
    status: { type: DataTypes.ENUM(...WORKSPACE_SUBMISSION_STATUSES), allowNull: false, defaultValue: 'pending' },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    submittedByName: { type: DataTypes.STRING(120), allowNull: true },
    submittedByEmail: { type: DataTypes.STRING(180), allowNull: true },
    assetUrl: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_submissions', underscored: true },
);

export const ProjectWorkspaceInvite = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceInvite',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING(180), allowNull: false },
    role: { type: DataTypes.STRING(120), allowNull: false },
    status: { type: DataTypes.ENUM(...WORKSPACE_INVITE_STATUSES), allowNull: false, defaultValue: 'pending' },
    invitedByName: { type: DataTypes.STRING(120), allowNull: true },
    invitedByEmail: { type: DataTypes.STRING(180), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    invitedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_invites', underscored: true },
);

export const ProjectWorkspaceHrRecord = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceHrRecord',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberName: { type: DataTypes.STRING(120), allowNull: false },
    roleTitle: { type: DataTypes.STRING(140), allowNull: true },
    employmentType: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'contract' },
    status: { type: DataTypes.ENUM(...WORKSPACE_HR_STATUSES), allowNull: false, defaultValue: 'planned' },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    weeklyCapacityHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    allocationPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_hr_records', underscored: true },
);

export const ProjectWorkspaceTimeEntry = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceTimeEntry',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberName: { type: DataTypes.STRING(120), allowNull: false },
    entryDate: { type: DataTypes.DATEONLY, allowNull: false },
    hours: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    billable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    status: { type: DataTypes.ENUM(...WORKSPACE_TIME_ENTRY_STATUSES), allowNull: false, defaultValue: 'submitted' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    approvedByName: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_time_entries', underscored: true },
);

export const ProjectWorkspaceObject = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceObject',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    objectType: { type: DataTypes.ENUM(...WORKSPACE_OBJECT_TYPES), allowNull: false, defaultValue: 'asset' },
    label: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ownerName: { type: DataTypes.STRING(120), allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: true },
    unit: { type: DataTypes.STRING(40), allowNull: true },
    status: { type: DataTypes.STRING(60), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_objects', underscored: true },
);

export const ProjectWorkspaceDocument = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceDocument',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'general' },
    storageUrl: { type: DataTypes.STRING(255), allowNull: false },
    thumbnailUrl: { type: DataTypes.STRING(255), allowNull: true },
    sizeBytes: { type: DataTypes.INTEGER, allowNull: true },
    visibility: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'team' },
    ownerName: { type: DataTypes.STRING(120), allowNull: true },
    version: { type: DataTypes.STRING(40), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_documents', underscored: true },
);

export const ProjectWorkspaceChatMessage = projectGigManagementSequelize.define(
  'PgmProjectWorkspaceChatMessage',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    channel: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'general' },
    authorName: { type: DataTypes.STRING(120), allowNull: false },
    authorRole: { type: DataTypes.STRING(80), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    postedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_workspace_chat_messages', underscored: true },
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

Project.hasMany(ProjectBid, { as: 'bids', foreignKey: 'projectId', onDelete: 'SET NULL' });
ProjectBid.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

Project.hasMany(ProjectInvitation, { as: 'invitations', foreignKey: 'projectId', onDelete: 'SET NULL' });
ProjectInvitation.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

Project.hasMany(ProjectReview, { as: 'reviews', foreignKey: 'projectId', onDelete: 'SET NULL' });
ProjectReview.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

Project.hasMany(AutoMatchCandidate, { as: 'autoMatches', foreignKey: 'projectId', onDelete: 'SET NULL' });
AutoMatchCandidate.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

Project.hasMany(ProjectAutoMatchFreelancer, {
  as: 'autoMatchFreelancers',
  foreignKey: 'projectId',
  onDelete: 'CASCADE',
});
ProjectAutoMatchFreelancer.belongsTo(Project, { foreignKey: 'projectId' });

ProjectWorkspace.hasMany(ProjectWorkspaceBudgetLine, { as: 'budgetLines', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceBudgetLine.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceObjective, { as: 'objectives', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceObjective.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceTask, { as: 'tasks', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceTask.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceMeeting, { as: 'meetings', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceMeeting.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceCalendarEvent, {
  as: 'calendarEvents',
  foreignKey: 'workspaceId',
  onDelete: 'CASCADE',
});
ProjectWorkspaceCalendarEvent.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceRoleAssignment, {
  as: 'roleAssignments',
  foreignKey: 'workspaceId',
  onDelete: 'CASCADE',
});
ProjectWorkspaceRoleAssignment.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceSubmission, { as: 'submissions', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceSubmission.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceInvite, { as: 'invites', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceInvite.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceHrRecord, { as: 'hrRecords', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceHrRecord.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceTimeEntry, { as: 'timeEntries', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceTimeEntry.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceObject, { as: 'workspaceObjects', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceObject.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceDocument, { as: 'documents', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceDocument.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectWorkspace.hasMany(ProjectWorkspaceChatMessage, { as: 'chatMessages', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectWorkspaceChatMessage.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ClientAccount.hasMany(ClientKanbanCard, { as: 'kanbanCards', foreignKey: 'clientId', onDelete: 'SET NULL' });
ClientKanbanCard.belongsTo(ClientAccount, { as: 'client', foreignKey: 'clientId' });

ClientKanbanColumn.hasMany(ClientKanbanCard, { as: 'cards', foreignKey: 'columnId', onDelete: 'CASCADE' });
ClientKanbanCard.belongsTo(ClientKanbanColumn, { as: 'column', foreignKey: 'columnId' });

ClientKanbanCard.hasMany(ClientKanbanChecklistItem, { as: 'checklist', foreignKey: 'cardId', onDelete: 'CASCADE' });
ClientKanbanChecklistItem.belongsTo(ClientKanbanCard, { foreignKey: 'cardId' });

GigOrder.hasMany(GigOrderRequirement, { as: 'requirements', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigOrderRequirement.belongsTo(GigOrder, { foreignKey: 'orderId' });

GigOrder.hasMany(GigOrderRevision, { as: 'revisions', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigOrderRevision.belongsTo(GigOrder, { foreignKey: 'orderId' });

GigOrder.hasOne(GigVendorScorecard, { as: 'scorecard', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigVendorScorecard.belongsTo(GigOrder, { foreignKey: 'orderId' });

GigOrder.hasMany(ProjectReview, { as: 'orderReviews', foreignKey: 'orderId', onDelete: 'SET NULL' });
ProjectReview.belongsTo(GigOrder, { as: 'order', foreignKey: 'orderId' });

GigOrder.hasMany(GigOrderEscrowCheckpoint, { as: 'escrowCheckpoints', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigOrderEscrowCheckpoint.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });

GigOrder.hasMany(GigOrderActivity, { as: 'activities', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigOrderActivity.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });

GigOrder.hasMany(GigOrderMessage, { as: 'messages', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigOrderMessage.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });

GigOrder.hasMany(GigTimelineEvent, { as: 'timeline', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigTimelineEvent.belongsTo(GigOrder, { foreignKey: 'orderId' });

GigOrder.hasMany(GigSubmission, { as: 'submissions', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigSubmission.belongsTo(GigOrder, { foreignKey: 'orderId' });

GigSubmission.hasMany(GigSubmissionAsset, { as: 'assets', foreignKey: 'submissionId', onDelete: 'CASCADE' });
GigSubmissionAsset.belongsTo(GigSubmission, { foreignKey: 'submissionId' });

GigOrder.hasMany(GigChatMessage, { as: 'chatMessages', foreignKey: 'orderId', onDelete: 'CASCADE' });
GigChatMessage.belongsTo(GigOrder, { foreignKey: 'orderId' });

EscrowAccount.hasMany(EscrowTransaction, { as: 'transactions', foreignKey: 'accountId', onDelete: 'CASCADE' });
EscrowTransaction.belongsTo(EscrowAccount, { as: 'account', foreignKey: 'accountId' });

export async function syncProjectGigManagementModels(options = {}) {
  const shouldSync =
    options.force || options.alter || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  if (shouldSync) {
    await projectGigManagementSequelize.sync({ alter: false, ...options });
    return;
  }

  await projectGigManagementSequelize.authenticate();
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
  ProjectAutoMatchFreelancer,
  GigOrder,
  GigOrderRequirement,
  GigOrderRevision,
  GigVendorScorecard,
  GigOrderEscrowCheckpoint,
  GigOrderActivity,
  GigOrderMessage,
  GigTimelineEvent,
  GigSubmission,
  GigSubmissionAsset,
  GigChatMessage,
  ClientAccount,
  ClientKanbanColumn,
  ClientKanbanCard,
  ClientKanbanChecklistItem,
  StoryBlock,
  BrandAsset,
  ProjectBid,
  ProjectInvitation,
  AutoMatchSetting,
  AutoMatchCandidate,
  ProjectReview,
  EscrowAccount,
  EscrowTransaction,
  ProjectWorkspaceBudgetLine,
  ProjectWorkspaceObjective,
  ProjectWorkspaceTask,
  ProjectWorkspaceMeeting,
  ProjectWorkspaceCalendarEvent,
  ProjectWorkspaceRoleAssignment,
  ProjectWorkspaceSubmission,
  ProjectWorkspaceInvite,
  ProjectWorkspaceHrRecord,
  ProjectWorkspaceTimeEntry,
  ProjectWorkspaceObject,
  ProjectWorkspaceDocument,
  ProjectWorkspaceChatMessage,
};
