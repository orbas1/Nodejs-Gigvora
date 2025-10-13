import { Sequelize, DataTypes, Op } from 'sequelize';
import databaseConfig from '../config/database.js';

const { url: databaseUrl, ...sequelizeOptions } = databaseConfig;

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, sequelizeOptions)
  : new Sequelize(sequelizeOptions);

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const PROFILE_AVAILABILITY_STATUSES = ['available', 'limited', 'unavailable', 'on_leave'];
export const PROFILE_APPRECIATION_TYPES = ['like', 'celebrate', 'support', 'endorse', 'applause'];
export const PROFILE_FOLLOWER_STATUSES = ['active', 'muted', 'blocked'];
export const PROFILE_ENGAGEMENT_JOB_STATUSES = ['pending', 'completed', 'failed'];


export const APPLICATION_TARGET_TYPES = ['job', 'gig', 'project', 'launchpad', 'volunteer'];
export const APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
];
export const APPLICATION_REVIEW_STAGES = ['screen', 'interview', 'assessment', 'final', 'offer'];
export const APPLICATION_REVIEW_DECISIONS = ['pending', 'advance', 'reject', 'hold', 'withdrawn'];
export const AUTO_ASSIGN_STATUSES = [
  'pending',
  'notified',
  'accepted',
  'declined',
  'expired',
  'reassigned',
  'completed',
];
export const GIG_STATUSES = ['draft', 'active', 'in_delivery', 'paused', 'completed', 'cancelled'];
export const GIG_PIPELINE_STAGES = ['discovery', 'kickoff', 'production', 'review', 'ready_to_close', 'completed'];
export const GIG_MILESTONE_STATUSES = ['planned', 'in_progress', 'waiting_on_client', 'at_risk', 'completed'];
export const GIG_BUNDLE_STATUSES = ['draft', 'testing', 'live', 'retired'];
export const GIG_UPSELL_STATUSES = ['draft', 'pilot', 'running', 'paused', 'retired'];
export const GIG_CATALOG_STATUSES = ['draft', 'published', 'archived'];
export const MESSAGE_CHANNEL_TYPES = ['support', 'project', 'contract', 'group', 'direct'];
export const MESSAGE_THREAD_STATES = ['active', 'archived', 'locked'];
export const MESSAGE_TYPES = ['text', 'file', 'system', 'event'];
export const SUPPORT_CASE_STATUSES = ['triage', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];
export const SUPPORT_CASE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const SUPPORT_PLAYBOOK_STAGES = ['intake', 'investigation', 'resolution', 'follow_up'];
export const SUPPORT_PLAYBOOK_PERSONAS = ['freelancer', 'client', 'support_team', 'cross_functional'];
export const SUPPORT_PLAYBOOK_CHANNELS = ['inbox', 'voice', 'video', 'email', 'platform'];
export const SUPPORT_CASE_PLAYBOOK_STATUSES = ['active', 'completed', 'archived'];
export const SUPPORT_CASE_LINK_TYPES = ['gig_order', 'project', 'transaction'];
export const SUPPORT_CASE_SATISFACTION_SUBMITTER_TYPES = ['freelancer', 'client', 'support', 'system'];
export const SUPPORT_KNOWLEDGE_CATEGORIES = ['policy', 'workflow', 'finance', 'compliance', 'tools'];
export const SUPPORT_KNOWLEDGE_AUDIENCES = ['freelancer', 'client', 'support_team'];
export const NOTIFICATION_CATEGORIES = ['system', 'message', 'project', 'financial', 'compliance', 'marketing'];
export const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'critical'];
export const NOTIFICATION_STATUSES = ['pending', 'delivered', 'read', 'dismissed'];
export const DIGEST_FREQUENCIES = ['immediate', 'daily', 'weekly'];
export const ANALYTICS_ACTOR_TYPES = ['user', 'system', 'anonymous'];
export const PROVIDER_WORKSPACE_TYPES = ['agency', 'company', 'recruiter', 'partner'];
export const PROVIDER_WORKSPACE_MEMBER_ROLES = ['owner', 'admin', 'manager', 'staff', 'viewer'];
export const PROVIDER_WORKSPACE_MEMBER_STATUSES = ['pending', 'active', 'suspended', 'revoked'];
export const PROVIDER_WORKSPACE_INVITE_STATUSES = ['pending', 'accepted', 'expired', 'revoked'];
export const PROVIDER_CONTACT_NOTE_VISIBILITIES = ['internal', 'shared', 'compliance'];
export const AGENCY_ALLIANCE_STATUSES = ['planned', 'active', 'paused', 'closed'];
export const AGENCY_ALLIANCE_TYPES = ['delivery_pod', 'channel_partner', 'co_sell', 'managed_service'];
export const AGENCY_ALLIANCE_MEMBER_ROLES = ['lead', 'contributor', 'specialist', 'contractor'];
export const AGENCY_ALLIANCE_MEMBER_STATUSES = ['invited', 'active', 'paused', 'exited'];
export const AGENCY_ALLIANCE_POD_TYPES = ['delivery', 'strategy', 'growth', 'specialist'];
export const AGENCY_ALLIANCE_POD_STATUSES = ['forming', 'active', 'scaling', 'sunset'];
export const AGENCY_ALLIANCE_RATE_CARD_STATUSES = ['draft', 'in_review', 'active', 'superseded', 'rejected'];
export const AGENCY_ALLIANCE_RATE_CARD_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];
export const AGENCY_ALLIANCE_REVENUE_SPLIT_TYPES = ['fixed', 'tiered', 'performance'];
export const AGENCY_ALLIANCE_REVENUE_SPLIT_STATUSES = ['draft', 'pending_approval', 'active', 'expired'];
export const AGENCY_COLLABORATION_STATUSES = ['invited', 'active', 'paused', 'ended'];
export const AGENCY_COLLABORATION_TYPES = ['project', 'retainer', 'on_call', 'embedded'];
export const AGENCY_INVITATION_STATUSES = ['pending', 'accepted', 'declined', 'expired', 'withdrawn'];
export const AGENCY_RATE_CARD_STATUSES = ['draft', 'shared', 'archived'];
export const AGENCY_RATE_CARD_ITEM_UNIT_TYPES = ['hour', 'day', 'sprint', 'project', 'retainer', 'deliverable'];
export const AGENCY_RETAINER_NEGOTIATION_STATUSES = ['draft', 'in_discussion', 'awaiting_signature', 'signed', 'lost'];
export const AGENCY_RETAINER_NEGOTIATION_STAGES = ['qualification', 'scoping', 'commercials', 'legal', 'kickoff'];
export const AGENCY_RETAINER_EVENT_ACTOR_TYPES = ['freelancer', 'agency', 'system'];
export const AGENCY_RETAINER_EVENT_TYPES = ['note', 'term_update', 'document_shared', 'meeting', 'status_change'];
export const ESCROW_ACCOUNT_STATUSES = ['pending', 'active', 'suspended', 'closed'];
export const ESCROW_TRANSACTION_TYPES = ['project', 'gig', 'milestone', 'retainer'];
export const ESCROW_TRANSACTION_STATUSES = [
  'initiated',
  'funded',
  'in_escrow',
  'released',
  'refunded',
  'cancelled',
  'disputed',
];
export const DISPUTE_STAGES = ['intake', 'mediation', 'arbitration', 'resolved'];
export const DISPUTE_STATUSES = ['open', 'awaiting_customer', 'under_review', 'settled', 'closed'];
export const DISPUTE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const DISPUTE_ACTION_TYPES = [
  'comment',
  'evidence_upload',
  'deadline_adjusted',
  'stage_advanced',
  'status_change',
  'system_notice',
];
export const DISPUTE_ACTOR_TYPES = ['customer', 'provider', 'mediator', 'admin', 'system'];
export const GIG_ORDER_PIPELINE_STATUSES = [
  'inquiry',
  'qualification',
  'kickoff_scheduled',
  'production',
  'delivery',
  'completed',
  'cancelled',
  'on_hold',
];
export const GIG_ORDER_STATUS_TYPES = ['open', 'completed', 'cancelled'];
export const GIG_ORDER_INTAKE_STATUSES = ['not_started', 'in_progress', 'completed'];
export const GIG_ORDER_KICKOFF_STATUSES = [
  'not_scheduled',
  'scheduled',
  'completed',
  'needs_reschedule',
];
export const GIG_ORDER_REQUIREMENT_FORM_STATUSES = [
  'draft',
  'pending_client',
  'in_progress',
  'submitted',
  'approved',
  'needs_revision',
  'archived',
];
export const GIG_ORDER_REVISION_STATUSES = [
  'open',
  'in_progress',
  'submitted',
  'approved',
  'declined',
  'cancelled',
];
export const GIG_ORDER_ESCROW_STATUSES = [
  'funded',
  'pending_release',
  'released',
  'held',
  'refunded',
  'disputed',
  'cancelled',
];
export const LEARNING_COURSE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'];
export const LEARNING_ENROLLMENT_STATUSES = ['not_started', 'in_progress', 'completed', 'archived'];
export const PEER_MENTORING_STATUSES = ['requested', 'scheduled', 'completed', 'cancelled'];
export const CERTIFICATION_STATUSES = ['active', 'expiring_soon', 'expired', 'revoked'];
export const LAUNCHPAD_STATUSES = ['draft', 'recruiting', 'active', 'archived'];

export const CLIENT_SUCCESS_PLAYBOOK_TRIGGERS = [
  'gig_purchase',
  'kickoff_complete',
  'milestone_reached',
  'delivery_submitted',
  'delivery_accepted',
  'renewal_window',
  'manual',
];
export const CLIENT_SUCCESS_STEP_TYPES = [
  'email',
  'checklist',
  'testimonial_request',
  'referral_invite',
  'review_nudge',
  'reward',
  'webhook',
];
export const CLIENT_SUCCESS_STEP_CHANNELS = ['email', 'in_app', 'sms', 'task', 'webhook'];
export const CLIENT_SUCCESS_ENROLLMENT_STATUSES = ['pending', 'active', 'completed', 'paused', 'cancelled'];
export const CLIENT_SUCCESS_EVENT_STATUSES = ['queued', 'processing', 'completed', 'skipped', 'failed'];
export const CLIENT_SUCCESS_REFERRAL_STATUSES = ['invited', 'clicked', 'converted', 'rewarded', 'expired'];
export const CLIENT_SUCCESS_REVIEW_NUDGE_STATUSES = ['scheduled', 'sent', 'responded', 'dismissed', 'cancelled'];
export const CLIENT_SUCCESS_AFFILIATE_STATUSES = ['active', 'paused', 'archived'];
export const LAUNCHPAD_APPLICATION_STATUSES = [
  'screening',
  'interview',
  'accepted',
  'waitlisted',
  'rejected',
  'withdrawn',
  'completed',
];
export const LAUNCHPAD_EMPLOYER_REQUEST_STATUSES = ['new', 'needs_review', 'approved', 'declined', 'paused'];
export const LAUNCHPAD_PLACEMENT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
export const LAUNCHPAD_TARGET_TYPES = ['job', 'gig', 'project'];
export const LAUNCHPAD_OPPORTUNITY_SOURCES = ['employer_request', 'placement', 'manual'];
export const WORKSPACE_TEMPLATE_STATUSES = ['draft', 'active', 'deprecated'];
export const WORKSPACE_TEMPLATE_VISIBILITIES = ['public', 'private'];
export const WORKSPACE_TEMPLATE_STAGE_TYPES = ['intake', 'strategy', 'production', 'delivery', 'retainer', 'quality', 'retro'];
export const WORKSPACE_TEMPLATE_RESOURCE_TYPES = [
  'sop',
  'checklist',
  'questionnaire',
  'automation',
  'asset',
  'video',
  'integration',
];

export const GIG_ORDER_STATUSES = [
  'awaiting_requirements',
  'in_progress',
  'revision_requested',
  'ready_for_payout',
  'completed',
  'paused',
  'cancelled',
];

export const GIG_ORDER_REQUIREMENT_STATUSES = ['pending', 'received', 'waived'];
export const GIG_ORDER_REQUIREMENT_PRIORITIES = ['low', 'medium', 'high'];
export const GIG_ORDER_REVISION_SEVERITIES = ['low', 'medium', 'high'];
export const GIG_ORDER_PAYOUT_STATUSES = ['pending', 'scheduled', 'released', 'at_risk', 'on_hold'];
export const GIG_ORDER_ACTIVITY_TYPES = [
  'order',
  'requirement',
  'revision',
  'payout',
  'communication',
  'note',
  'system',
];

export const PROJECT_BLUEPRINT_HEALTH_STATUSES = ['on_track', 'at_risk', 'critical'];
export const PROJECT_SPRINT_STATUSES = ['planned', 'in_progress', 'blocked', 'completed'];
export const PROJECT_DEPENDENCY_TYPES = ['client', 'internal', 'external', 'third_party'];
export const PROJECT_DEPENDENCY_STATUSES = ['pending', 'in_progress', 'blocked', 'done'];
export const PROJECT_DEPENDENCY_RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
export const PROJECT_RISK_STATUSES = ['open', 'monitoring', 'mitigated', 'closed'];
export const PROJECT_BILLING_TYPES = ['milestone', 'retainer', 'expense'];
export const PROJECT_BILLING_STATUSES = ['upcoming', 'invoiced', 'paid', 'overdue'];

export const CLIENT_PORTAL_STATUSES = ['draft', 'active', 'paused', 'archived'];
export const CLIENT_PORTAL_TIMELINE_STATUSES = ['planned', 'in_progress', 'at_risk', 'completed', 'blocked'];
export const CLIENT_PORTAL_SCOPE_STATUSES = ['committed', 'in_delivery', 'delivered', 'proposed', 'out_of_scope'];
export const CLIENT_PORTAL_DECISION_VISIBILITIES = ['internal', 'client', 'public'];
export const CLIENT_PORTAL_INSIGHT_TYPES = ['health', 'finance', 'engagement', 'risk', 'custom'];
export const CLIENT_PORTAL_INSIGHT_VISIBILITIES = ['internal', 'shared'];

export const FREELANCER_EXPERTISE_STATUSES = ['live', 'in_progress', 'needs_decision', 'archived'];
export const FREELANCER_SUCCESS_TRENDS = ['up', 'down', 'steady'];
export const FREELANCER_TESTIMONIAL_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
export const FREELANCER_HERO_BANNER_STATUSES = ['planned', 'testing', 'live', 'paused', 'archived'];

export const FINANCE_VALUE_UNITS = ['currency', 'percentage', 'ratio', 'count'];
export const FINANCE_CHANGE_UNITS = ['currency', 'percentage', 'percentage_points', 'count', 'ratio'];
export const FINANCE_TRENDS = ['up', 'down', 'neutral'];
export const FREELANCER_PAYOUT_STATUSES = ['released', 'scheduled', 'in_escrow', 'pending', 'failed'];
export const FREELANCER_TAX_ESTIMATE_STATUSES = ['on_track', 'due_soon', 'past_due', 'paid', 'processing'];
export const FREELANCER_FILING_STATUSES = ['not_started', 'in_progress', 'submitted', 'overdue'];

export const SPRINT_STATUSES = ['planning', 'active', 'completed', 'archived'];
export const SPRINT_TASK_STATUSES = ['backlog', 'ready', 'in_progress', 'review', 'blocked', 'done'];
export const SPRINT_TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const SPRINT_RISK_IMPACTS = ['low', 'medium', 'high', 'critical'];
export const SPRINT_RISK_STATUSES = ['open', 'mitigating', 'resolved', 'closed'];
export const CHANGE_REQUEST_STATUSES = ['draft', 'pending_approval', 'approved', 'rejected'];

export const COLLABORATION_SPACE_STATUSES = ['active', 'archived'];
export const COLLABORATION_PERMISSION_LEVELS = ['view', 'comment', 'edit', 'manage'];
export const COLLABORATION_PARTICIPANT_ROLES = ['owner', 'contributor', 'reviewer', 'client', 'guest'];
export const COLLABORATION_PARTICIPANT_STATUSES = ['invited', 'active', 'inactive', 'removed'];
export const COLLABORATION_ROOM_TYPES = ['video', 'whiteboard', 'huddle'];
export const COLLABORATION_ASSET_TYPES = ['file', 'prototype', 'demo', 'document'];
export const COLLABORATION_ASSET_STATUSES = ['in_review', 'approved', 'needs_changes'];
export const COLLABORATION_ANNOTATION_TYPES = ['comment', 'issue', 'decision'];
export const COLLABORATION_ANNOTATION_STATUSES = ['open', 'resolved', 'dismissed'];
export const COLLABORATION_REPOSITORY_STATUSES = ['connected', 'syncing', 'error'];
export const COLLABORATION_AI_SESSION_TYPES = ['documentation', 'qa', 'summary', 'retro'];
export const COLLABORATION_AI_SESSION_STATUSES = ['pending', 'processing', 'completed', 'failed'];

export const DELIVERABLE_VAULT_WATERMARK_MODES = ['none', 'basic', 'dynamic'];
export const DELIVERABLE_ITEM_STATUSES = ['draft', 'in_review', 'approved', 'delivered', 'archived'];
export const DELIVERABLE_ITEM_WATERMARK_MODES = ['inherit', 'none', 'basic', 'dynamic'];
export const DELIVERABLE_ITEM_NDA_STATUSES = ['not_required', 'pending', 'signed', 'waived'];
export const DELIVERABLE_RETENTION_POLICIES = [
  'standard_7_year',
  'client_defined',
  'indefinite',
  'short_term',
];

export const GIG_BUILDER_STATUSES = ['draft', 'preview', 'published', 'archived'];
export const GIG_MEDIA_TYPES = ['image', 'video', 'document'];
export const GIG_PREVIEW_DEVICE_TYPES = ['desktop', 'tablet', 'mobile'];

export const FINANCE_REVENUE_TYPES = ['retainer', 'one_off', 'passive', 'royalty', 'product', 'other'];
export const FINANCE_REVENUE_STATUSES = ['draft', 'issued', 'pending_payment', 'paid', 'recognized', 'voided'];
export const FINANCE_EXPENSE_STATUSES = ['pending', 'posted', 'reimbursed', 'excluded'];
export const FINANCE_SAVINGS_STATUSES = ['active', 'paused', 'achieved', 'closed'];
export const FINANCE_AUTOMATION_TYPES = ['fixed_transfer', 'percentage_income', 'round_up', 'manual'];
export const FINANCE_PAYOUT_STATUSES = ['draft', 'scheduled', 'processing', 'completed', 'failed'];
export const FINANCE_FORECAST_SCENARIO_TYPES = ['retainer_pipeline', 'one_off_pipeline', 'baseline', 'stretch', 'custom'];
export const FINANCE_TAX_EXPORT_STATUSES = ['generating', 'available', 'archived', 'failed'];

export const CAREER_ANALYTICS_TREND_DIRECTIONS = ['up', 'down', 'flat'];
export const CALENDAR_INTEGRATION_STATUSES = ['connected', 'syncing', 'error', 'disconnected'];
export const CALENDAR_EVENT_TYPES = ['interview', 'networking', 'project', 'wellbeing', 'deadline', 'ritual'];
export const CALENDAR_EVENT_SOURCES = ['manual', 'google', 'outlook', 'gigvora'];
export const FOCUS_SESSION_TYPES = ['interview_prep', 'networking', 'application', 'deep_work', 'wellbeing'];
export const ADVISOR_COLLABORATION_STATUSES = ['draft', 'active', 'paused', 'archived'];
export const ADVISOR_COLLABORATION_MEMBER_ROLES = ['mentor', 'agency', 'coach', 'observer', 'teammate'];
export const ADVISOR_COLLABORATION_MEMBER_STATUSES = ['invited', 'active', 'revoked'];
export const DOCUMENT_ROOM_STATUSES = ['active', 'expired', 'archived'];
export const SUPPORT_AUTOMATION_STATUSES = ['queued', 'running', 'success', 'failed'];

export const COMPLIANCE_DOCUMENT_TYPES = [
  'msa',
  'nda',
  'ip_assignment',
  'contract',
  'tax',
  'insurance',
  'policy_acknowledgment',
  'security_addendum',
  'custom',
];
export const COMPLIANCE_DOCUMENT_STATUSES = [
  'draft',
  'awaiting_signature',
  'active',
  'expired',
  'archived',
  'superseded',
];
export const COMPLIANCE_REMINDER_STATUSES = ['scheduled', 'sent', 'acknowledged', 'dismissed', 'cancelled'];
export const COMPLIANCE_OBLIGATION_STATUSES = ['open', 'in_progress', 'satisfied', 'waived', 'overdue'];
export const COMPLIANCE_STORAGE_PROVIDERS = ['s3', 'r2', 'gcs', 'azure', 'filesystem', 'external'];

export const REPUTATION_TESTIMONIAL_SOURCES = ['portal', 'manual', 'import', 'video', 'audio'];
export const REPUTATION_TESTIMONIAL_STATUSES = ['pending', 'approved', 'rejected', 'archived'];
export const REPUTATION_SUCCESS_STORY_STATUSES = ['draft', 'in_review', 'published', 'archived'];
export const REPUTATION_METRIC_TREND_DIRECTIONS = ['up', 'down', 'flat'];
export const REPUTATION_REVIEW_WIDGET_STATUSES = ['draft', 'active', 'paused'];

export const PIPELINE_BOARD_GROUPINGS = ['industry', 'retainer_size', 'probability'];
export const PIPELINE_STAGE_CATEGORIES = ['open', 'won', 'lost'];
export const PIPELINE_DEAL_STATUSES = ['open', 'won', 'lost', 'on_hold'];
export const PIPELINE_FOLLOW_UP_STATUSES = ['scheduled', 'completed', 'cancelled'];
export const PIPELINE_CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed'];
export const PIPELINE_PROPOSAL_STATUSES = ['draft', 'sent', 'accepted', 'declined'];

const PIPELINE_OWNER_TYPES = ['freelancer', 'agency', 'company'];

export const User = sequelize.define(
  'User',
  {
    firstName: { type: DataTypes.STRING(120), allowNull: false },
    lastName: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(255), unique: true, allowNull: false, validate: { isEmail: true } },
    password: { type: DataTypes.STRING(255), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: true },
    age: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 13 } },
    userType: {
      type: DataTypes.ENUM('user', 'company', 'freelancer', 'agency', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
  },
  {
    tableName: 'users',
    indexes: [{ fields: ['email'] }],
  },
);

User.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return User.findAll({
    where: {
      [Op.or]: [
        { firstName: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
        { lastName: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
        { email: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
      ],
    },
    limit: 20,
    order: [['lastName', 'ASC']],
  });
};

export const Profile = sequelize.define(
  'Profile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    skills: { type: DataTypes.TEXT, allowNull: true },
    experience: { type: DataTypes.TEXT, allowNull: true },
    education: { type: DataTypes.TEXT, allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    missionStatement: { type: DataTypes.TEXT, allowNull: true },
    areasOfFocus: { type: jsonType, allowNull: true },
    availabilityStatus: {
      type: DataTypes.ENUM(...PROFILE_AVAILABILITY_STATUSES),
      allowNull: false,
      defaultValue: 'limited',
      validate: { isIn: [PROFILE_AVAILABILITY_STATUSES] },
    },
    availableHoursPerWeek: { type: DataTypes.INTEGER, allowNull: true },
    openToRemote: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    availabilityNotes: { type: DataTypes.TEXT, allowNull: true },
    availabilityUpdatedAt: { type: DataTypes.DATE, allowNull: true },
    trustScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    likesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    followersCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    qualifications: { type: jsonType, allowNull: true },
    experienceEntries: { type: jsonType, allowNull: true },
    statusFlags: { type: jsonType, allowNull: true },
    launchpadEligibility: { type: jsonType, allowNull: true },
    volunteerBadges: { type: jsonType, allowNull: true },
    portfolioLinks: { type: jsonType, allowNull: true },
    preferredEngagements: { type: jsonType, allowNull: true },
    collaborationRoster: { type: jsonType, allowNull: true },
    impactHighlights: { type: jsonType, allowNull: true },
    pipelineInsights: { type: jsonType, allowNull: true },
    profileCompletion: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    avatarSeed: { type: DataTypes.STRING(255), allowNull: true },
    engagementRefreshedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'profiles' },
);

export const ProfileReference = sequelize.define(
  'ProfileReference',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    referenceName: { type: DataTypes.STRING(255), allowNull: false },
    relationship: { type: DataTypes.STRING(255), allowNull: true },
    company: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(60), allowNull: true },
    endorsement: { type: DataTypes.TEXT, allowNull: true },
    isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    weight: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    lastInteractedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'profile_references' },
);

export const ProfileAppreciation = sequelize.define(
  'ProfileAppreciation',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: false },
    appreciationType: {
      type: DataTypes.ENUM(...PROFILE_APPRECIATION_TYPES),
      allowNull: false,
      defaultValue: 'like',
      validate: { isIn: [PROFILE_APPRECIATION_TYPES] },
    },
    source: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'profile_appreciations',
    indexes: [
      { unique: true, fields: ['profileId', 'actorId', 'appreciationType'] },
      { fields: ['profileId'] },
      { fields: ['actorId'] },
    ],
  },
);

export const ProfileFollower = sequelize.define(
  'ProfileFollower',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    followerId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...PROFILE_FOLLOWER_STATUSES),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [PROFILE_FOLLOWER_STATUSES] },
    },
    notificationsEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
    followedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'profile_followers',
    indexes: [
      { unique: true, fields: ['profileId', 'followerId'] },
      { fields: ['profileId'] },
      { fields: ['followerId'] },
    ],
  },
);

export const ProfileEngagementJob = sequelize.define(
  'ProfileEngagementJob',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    scheduledAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM(...PROFILE_ENGAGEMENT_JOB_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [PROFILE_ENGAGEMENT_JOB_STATUSES] },
    },
    lockedAt: { type: DataTypes.DATE, allowNull: true },
    lockedBy: { type: DataTypes.STRING(120), allowNull: true },
    lastError: { type: DataTypes.TEXT, allowNull: true },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'profile_engagement_jobs',
    indexes: [
      { fields: ['status', 'scheduledAt'] },
      { fields: ['profileId'] },
    ],
  },
);

export const CompanyProfile = sequelize.define(
  'CompanyProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    companyName: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    website: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'company_profiles' },
);

export const AgencyProfile = sequelize.define(
  'AgencyProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    agencyName: { type: DataTypes.STRING(255), allowNull: false },
    focusArea: { type: DataTypes.STRING(255), allowNull: true },
    website: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'agency_profiles' },
);

export const FreelancerProfile = sequelize.define(
  'FreelancerProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: true },
    hourlyRate: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    availability: { type: DataTypes.STRING(120), allowNull: true },
  },
  { tableName: 'freelancer_profiles' },
);

export const COMMUNITY_SPOTLIGHT_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
export const COMMUNITY_SPOTLIGHT_HIGHLIGHT_CATEGORIES = [
  'speaking',
  'open_source',
  'contribution',
  'press',
  'mentorship',
  'award',
];
export const COMMUNITY_SPOTLIGHT_ASSET_TYPES = ['social', 'newsletter', 'press', 'video', 'website', 'other'];
export const COMMUNITY_SPOTLIGHT_NEWSLETTER_STATUSES = ['draft', 'scheduled', 'sent'];

export const CommunitySpotlight = sequelize.define(
  'CommunitySpotlight',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...COMMUNITY_SPOTLIGHT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [COMMUNITY_SPOTLIGHT_STATUSES] },
    },
    heroTitle: { type: DataTypes.STRING(255), allowNull: false },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    campaignName: { type: DataTypes.STRING(255), allowNull: true },
    bannerImageUrl: { type: DataTypes.STRING(512), allowNull: true },
    brandColor: { type: DataTypes.STRING(64), allowNull: true },
    primaryCtaLabel: { type: DataTypes.STRING(120), allowNull: true },
    primaryCtaUrl: { type: DataTypes.STRING(512), allowNull: true },
    secondaryCtaLabel: { type: DataTypes.STRING(120), allowNull: true },
    secondaryCtaUrl: { type: DataTypes.STRING(512), allowNull: true },
    shareKitUrl: { type: DataTypes.STRING(512), allowNull: true },
    metricsSnapshot: { type: jsonType, allowNull: true },
    newsletterFeatureEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    newsletterAutomationConfig: { type: jsonType, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    featuredUntil: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'community_spotlights' },
);

export const CommunitySpotlightHighlight = sequelize.define(
  'CommunitySpotlightHighlight',
  {
    spotlightId: { type: DataTypes.INTEGER, allowNull: false },
    category: {
      type: DataTypes.ENUM(...COMMUNITY_SPOTLIGHT_HIGHLIGHT_CATEGORIES),
      allowNull: false,
      defaultValue: 'contribution',
      validate: { isIn: [COMMUNITY_SPOTLIGHT_HIGHLIGHT_CATEGORIES] },
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    impactStatement: { type: DataTypes.TEXT, allowNull: true },
    occurredOn: { type: DataTypes.DATE, allowNull: true },
    ctaLabel: { type: DataTypes.STRING(120), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(512), allowNull: true },
    mediaUrl: { type: DataTypes.STRING(512), allowNull: true },
    ordinal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'community_spotlight_highlights' },
);

export const CommunitySpotlightAsset = sequelize.define(
  'CommunitySpotlightAsset',
  {
    spotlightId: { type: DataTypes.INTEGER, allowNull: false },
    assetType: {
      type: DataTypes.ENUM(...COMMUNITY_SPOTLIGHT_ASSET_TYPES),
      allowNull: false,
      defaultValue: 'social',
      validate: { isIn: [COMMUNITY_SPOTLIGHT_ASSET_TYPES] },
    },
    channel: { type: DataTypes.STRING(120), allowNull: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    format: { type: DataTypes.STRING(80), allowNull: true },
    aspectRatio: { type: DataTypes.STRING(40), allowNull: true },
    downloadUrl: { type: DataTypes.STRING(512), allowNull: true },
    previewUrl: { type: DataTypes.STRING(512), allowNull: true },
    readyForUse: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'community_spotlight_assets' },
);

export const CommunitySpotlightNewsletterFeature = sequelize.define(
  'CommunitySpotlightNewsletterFeature',
  {
    spotlightId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...COMMUNITY_SPOTLIGHT_NEWSLETTER_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [COMMUNITY_SPOTLIGHT_NEWSLETTER_STATUSES] },
    },
    editionDate: { type: DataTypes.DATE, allowNull: true },
    editionName: { type: DataTypes.STRING(255), allowNull: true },
    subjectLine: { type: DataTypes.STRING(255), allowNull: true },
    heroTitle: { type: DataTypes.STRING(255), allowNull: true },
    heroSubtitle: { type: DataTypes.STRING(255), allowNull: true },
    audienceSegment: { type: DataTypes.STRING(255), allowNull: true },
    performanceMetrics: { type: jsonType, allowNull: true },
    utmParameters: { type: jsonType, allowNull: true },
    shareUrl: { type: DataTypes.STRING(512), allowNull: true },
    callToActionLabel: { type: DataTypes.STRING(120), allowNull: true },
    callToActionUrl: { type: DataTypes.STRING(512), allowNull: true },
  },
  { tableName: 'community_spotlight_newsletter_features' },
);

export const ReputationTestimonial = sequelize.define(
  'ReputationTestimonial',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    clientName: { type: DataTypes.STRING(255), allowNull: false },
    clientRole: { type: DataTypes.STRING(255), allowNull: true },
    company: { type: DataTypes.STRING(255), allowNull: true },
    projectName: { type: DataTypes.STRING(255), allowNull: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: false },
    capturedAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    source: {
      type: DataTypes.ENUM(...REPUTATION_TESTIMONIAL_SOURCES),
      allowNull: false,
      defaultValue: 'portal',
      validate: { isIn: [REPUTATION_TESTIMONIAL_SOURCES] },
    },
    status: {
      type: DataTypes.ENUM(...REPUTATION_TESTIMONIAL_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [REPUTATION_TESTIMONIAL_STATUSES] },
    },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    shareUrl: { type: DataTypes.STRING(500), allowNull: true },
    media: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'reputation_testimonials' },
);

export const ReputationSuccessStory = sequelize.define(
  'ReputationSuccessStory',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.ENUM(...REPUTATION_SUCCESS_STORY_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [REPUTATION_SUCCESS_STORY_STATUSES] },
    },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    impactMetrics: { type: jsonType, allowNull: true },
    ctaUrl: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'reputation_success_stories' },
);

export const ReputationMetric = sequelize.define(
  'ReputationMetric',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    metricType: { type: DataTypes.STRING(120), allowNull: false },
    label: { type: DataTypes.STRING(255), allowNull: false },
    value: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
    unit: { type: DataTypes.STRING(60), allowNull: true },
    period: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'rolling_12_months' },
    source: { type: DataTypes.STRING(255), allowNull: true },
    trendDirection: {
      type: DataTypes.ENUM(...REPUTATION_METRIC_TREND_DIRECTIONS),
      allowNull: false,
      defaultValue: 'flat',
      validate: { isIn: [REPUTATION_METRIC_TREND_DIRECTIONS] },
    },
    trendValue: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    verifiedBy: { type: DataTypes.STRING(255), allowNull: true },
    verifiedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'reputation_metrics' },
);

export const ReputationBadge = sequelize.define(
  'ReputationBadge',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    issuedBy: { type: DataTypes.STRING(255), allowNull: true },
    issuedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    badgeType: { type: DataTypes.STRING(120), allowNull: true },
    level: { type: DataTypes.STRING(60), allowNull: true },
    assetUrl: { type: DataTypes.STRING(500), allowNull: true },
    isPromoted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'reputation_badges' },
);

export const ReputationReviewWidget = sequelize.define(
  'ReputationReviewWidget',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false },
    widgetType: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM(...REPUTATION_REVIEW_WIDGET_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [REPUTATION_REVIEW_WIDGET_STATUSES] },
    },
    embedScript: { type: DataTypes.TEXT, allowNull: true },
    config: { type: jsonType, allowNull: true },
    impressions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ctaClicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'reputation_review_widgets' },
);

ReputationTestimonial.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    clientName: plain.clientName,
    clientRole: plain.clientRole ?? null,
    company: plain.company ?? null,
    projectName: plain.projectName ?? null,
    rating: plain.rating == null ? null : Number(plain.rating),
    comment: plain.comment,
    capturedAt: plain.capturedAt ?? null,
    deliveredAt: plain.deliveredAt ?? null,
    source: plain.source,
    status: plain.status,
    isFeatured: Boolean(plain.isFeatured),
    shareUrl: plain.shareUrl ?? null,
    media: plain.media ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

ReputationSuccessStory.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    title: plain.title,
    slug: plain.slug,
    summary: plain.summary,
    content: plain.content ?? null,
    heroImageUrl: plain.heroImageUrl ?? null,
    status: plain.status,
    publishedAt: plain.publishedAt ?? null,
    featured: Boolean(plain.featured),
    impactMetrics: plain.impactMetrics ?? null,
    ctaUrl: plain.ctaUrl ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

ReputationMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    metricType: plain.metricType,
    label: plain.label,
    value: Number(plain.value),
    unit: plain.unit ?? null,
    period: plain.period,
    source: plain.source ?? null,
    trendDirection: plain.trendDirection,
    trendValue: plain.trendValue == null ? null : Number(plain.trendValue),
    verifiedBy: plain.verifiedBy ?? null,
    verifiedAt: plain.verifiedAt ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

ReputationBadge.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    slug: plain.slug,
    description: plain.description ?? null,
    issuedBy: plain.issuedBy ?? null,
    issuedAt: plain.issuedAt ?? null,
    expiresAt: plain.expiresAt ?? null,
    badgeType: plain.badgeType ?? null,
    level: plain.level ?? null,
    assetUrl: plain.assetUrl ?? null,
    isPromoted: Boolean(plain.isPromoted),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

ReputationReviewWidget.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    slug: plain.slug,
    widgetType: plain.widgetType,
    status: plain.status,
    embedScript: plain.embedScript ?? null,
    config: plain.config ?? null,
    impressions: Number(plain.impressions ?? 0),
    ctaClicks: Number(plain.ctaClicks ?? 0),
    lastSyncedAt: plain.lastSyncedAt ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};
export const FreelancerExpertiseArea = sequelize.define(
  'FreelancerExpertiseArea',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    slug: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...FREELANCER_EXPERTISE_STATUSES),
      allowNull: false,
      defaultValue: 'live',
    },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    tractionSnapshot: { type: jsonType, allowNull: false, defaultValue: [] },
    recommendations: { type: jsonType, allowNull: false, defaultValue: [] },
    healthScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'freelancer_expertise_areas',
    indexes: [
      { unique: true, fields: ['profileId', 'slug'] },
      { fields: ['profileId', 'status'] },
    ],
  },
);

export const FreelancerSuccessMetric = sequelize.define(
  'FreelancerSuccessMetric',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    metricKey: { type: DataTypes.STRING(120), allowNull: false },
    label: { type: DataTypes.STRING(255), allowNull: false },
    value: { type: DataTypes.STRING(255), allowNull: false },
    numericValue: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    deltaLabel: { type: DataTypes.STRING(255), allowNull: true },
    targetLabel: { type: DataTypes.STRING(255), allowNull: true },
    trendDirection: {
      type: DataTypes.ENUM(...FREELANCER_SUCCESS_TRENDS),
      allowNull: false,
      defaultValue: 'steady',
    },
    breakdown: { type: jsonType, allowNull: false, defaultValue: [] },
    periodStart: { type: DataTypes.DATE, allowNull: true },
    periodEnd: { type: DataTypes.DATE, allowNull: true },
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'freelancer_success_metrics',
    indexes: [
      { unique: true, fields: ['profileId', 'metricKey'] },
      { fields: ['profileId'] },
    ],
  },
);

export const FreelancerTestimonial = sequelize.define(
  'FreelancerTestimonial',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    testimonialKey: { type: DataTypes.STRING(120), allowNull: false },
    clientName: { type: DataTypes.STRING(255), allowNull: false },
    clientRole: { type: DataTypes.STRING(255), allowNull: true },
    clientCompany: { type: DataTypes.STRING(255), allowNull: true },
    projectName: { type: DataTypes.STRING(255), allowNull: true },
    quote: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM(...FREELANCER_TESTIMONIAL_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    weight: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    nextAction: { type: DataTypes.STRING(255), allowNull: true },
    curationNotes: { type: DataTypes.TEXT, allowNull: true },
    metrics: { type: jsonType, allowNull: false, defaultValue: [] },
    requestedAt: { type: DataTypes.DATE, allowNull: true },
    recordedAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'freelancer_testimonials',
    indexes: [
      { unique: true, fields: ['profileId', 'testimonialKey'] },
      { fields: ['profileId', 'status'] },
    ],
  },
);

export const FreelancerHeroBanner = sequelize.define(
  'FreelancerHeroBanner',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    bannerKey: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    headline: { type: DataTypes.STRING(255), allowNull: false },
    audience: { type: DataTypes.STRING(255), allowNull: true },
    callToActionLabel: { type: DataTypes.STRING(255), allowNull: true },
    callToActionUrl: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM(...FREELANCER_HERO_BANNER_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
    },
    gradient: { type: DataTypes.STRING(255), allowNull: true },
    metrics: { type: jsonType, allowNull: false, defaultValue: [] },
    experimentId: { type: DataTypes.STRING(120), allowNull: true },
    backgroundImageUrl: { type: DataTypes.STRING(255), allowNull: true },
    conversionTarget: { type: DataTypes.STRING(255), allowNull: true },
    lastLaunchedAt: { type: DataTypes.DATE, allowNull: true },
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'freelancer_hero_banners',
    indexes: [
      { unique: true, fields: ['profileId', 'bannerKey'] },
      { fields: ['profileId', 'status'] },
    ],
  },
);

export const FeedPost = sequelize.define(
  'FeedPost',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    visibility: { type: DataTypes.ENUM('public', 'connections'), defaultValue: 'public', allowNull: false },
  },
  { tableName: 'feed_posts' },
);

export const Job = sequelize.define(
  'Job',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.STRING(255), allowNull: true },
    employmentType: { type: DataTypes.STRING(120), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
  },
  { tableName: 'jobs' },
);

Job.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return Job.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

export const Gig = sequelize.define(
  'Gig',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    slug: { type: DataTypes.STRING(180), allowNull: true, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    budget: { type: DataTypes.STRING(120), allowNull: true },
    duration: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...GIG_BUILDER_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [GIG_BUILDER_STATUSES] },
    },
    freelancerId: { type: DataTypes.INTEGER, allowNull: true },
    heroTitle: { type: DataTypes.STRING(255), allowNull: true },
    heroSubtitle: { type: DataTypes.STRING(500), allowNull: true },
    heroMediaUrl: { type: DataTypes.STRING(500), allowNull: true },
    heroTheme: { type: DataTypes.STRING(120), allowNull: true },
    heroBadge: { type: DataTypes.STRING(120), allowNull: true },
    sellingPoints: { type: jsonType, allowNull: true },
    requirements: { type: jsonType, allowNull: true },
    faqs: { type: jsonType, allowNull: true },
    conversionCopy: { type: jsonType, allowNull: true },
    analyticsSettings: { type: jsonType, allowNull: true },
    pipelineStage: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'discovery',
      validate: { isIn: [GIG_PIPELINE_STAGES] },
    },
    contractValueCents: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    previousPipelineValueCents: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'USD' },
    upsellEligibleValueCents: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    expectedDeliveryDate: { type: DataTypes.DATE, allowNull: true },
    clientName: { type: DataTypes.STRING(255), allowNull: true },
    csatScore: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    csatPreviousScore: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    csatResponseCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'gigs' },
);

Gig.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return Gig.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

Gig.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    budget: plain.budget ?? null,
    duration: plain.duration ?? null,
    location: plain.location ?? null,
    geoLocation: plain.geoLocation ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const Project = sequelize.define(
  'Project',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    budgetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetCurrency: { type: DataTypes.STRING(6), allowNull: true },
    autoAssignEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoAssignStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'inactive' },
    autoAssignSettings: { type: jsonType, allowNull: true },
    autoAssignLastRunAt: { type: DataTypes.DATE, allowNull: true },
    autoAssignLastQueueSize: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'projects' },
);

CommunitySpotlight.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    profileId: plain.profileId,
    status: plain.status,
    heroTitle: plain.heroTitle,
    tagline: plain.tagline,
    summary: plain.summary,
    campaignName: plain.campaignName,
    bannerImageUrl: plain.bannerImageUrl,
    brandColor: plain.brandColor,
    primaryCtaLabel: plain.primaryCtaLabel,
    primaryCtaUrl: plain.primaryCtaUrl,
    secondaryCtaLabel: plain.secondaryCtaLabel,
    secondaryCtaUrl: plain.secondaryCtaUrl,
    shareKitUrl: plain.shareKitUrl,
    metricsSnapshot: plain.metricsSnapshot,
    newsletterFeatureEnabled: plain.newsletterFeatureEnabled,
    newsletterAutomationConfig: plain.newsletterAutomationConfig,
    publishedAt: plain.publishedAt,
    featuredUntil: plain.featuredUntil,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CommunitySpotlightHighlight.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    spotlightId: plain.spotlightId,
    category: plain.category,
    title: plain.title,
    description: plain.description,
    impactStatement: plain.impactStatement,
    occurredOn: plain.occurredOn,
    ctaLabel: plain.ctaLabel,
    ctaUrl: plain.ctaUrl,
    mediaUrl: plain.mediaUrl,
    ordinal: plain.ordinal,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CommunitySpotlightAsset.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    spotlightId: plain.spotlightId,
    assetType: plain.assetType,
    channel: plain.channel,
    name: plain.name,
    description: plain.description,
    format: plain.format,
    aspectRatio: plain.aspectRatio,
    downloadUrl: plain.downloadUrl,
    previewUrl: plain.previewUrl,
    readyForUse: plain.readyForUse,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CommunitySpotlightNewsletterFeature.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    spotlightId: plain.spotlightId,
    status: plain.status,
    editionDate: plain.editionDate,
    editionName: plain.editionName,
    subjectLine: plain.subjectLine,
    heroTitle: plain.heroTitle,
    heroSubtitle: plain.heroSubtitle,
    audienceSegment: plain.audienceSegment,
    performanceMetrics: plain.performanceMetrics,
    utmParameters: plain.utmParameters,
    shareUrl: plain.shareUrl,
    callToActionLabel: plain.callToActionLabel,
    callToActionUrl: plain.callToActionUrl,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

Project.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return Project.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    where: {
      [Op.or]: [
        { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
        { slug: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
      ],
    },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

Gig.prototype.toBuilderObject = function toBuilderObject() {
  const plain = this.get({ plain: true });
  const normalizeList = (value) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === 'object') {
      if (Array.isArray(value.items)) {
        return value.items;
      }
      return Object.values(value);
    }
    if (value == null) {
      return [];
    }
    return [value];
  };

  return {
    id: plain.id,
    ownerId: plain.ownerId ?? null,
    slug: plain.slug ?? null,
    title: plain.title,
    description: plain.description,
    summary: plain.summary,
    status: plain.status,
    budget: plain.budget,
    duration: plain.duration,
    location: plain.location,
    geoLocation: plain.geoLocation ?? null,
    sellingPoints: normalizeList(plain.sellingPoints),
    requirements: normalizeList(plain.requirements),
    faqs: normalizeList(plain.faqs),
    conversionCopy: plain.conversionCopy ?? {},
    analyticsSettings: plain.analyticsSettings ?? {},
    hero: {
      title: plain.heroTitle ?? plain.title,
      subtitle: plain.heroSubtitle ?? null,
      mediaUrl: plain.heroMediaUrl ?? null,
      theme: plain.heroTheme ?? null,
      badge: plain.heroBadge ?? null,
    },
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerCatalogBundle = sequelize.define(
  'FreelancerCatalogBundle',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    basePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'freelancer_catalog_bundles' },
);

FreelancerCatalogBundle.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    description: plain.description,
    basePrice: plain.basePrice == null ? null : Number(plain.basePrice),
    currencyCode: plain.currencyCode,
    isActive: Boolean(plain.isActive),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerCatalogBundleMetric = sequelize.define(
  'FreelancerCatalogBundleMetric',
  {
    bundleId: { type: DataTypes.INTEGER, allowNull: false },
    periodStart: { type: DataTypes.DATEONLY, allowNull: false },
    periodEnd: { type: DataTypes.DATEONLY, allowNull: false },
    impressions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    clicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    conversions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    revenue: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    repeatClients: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    attachRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    upsellRevenue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  },
  { tableName: 'freelancer_catalog_bundle_metrics' },
);

FreelancerCatalogBundleMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    bundleId: plain.bundleId,
    periodStart: plain.periodStart,
    periodEnd: plain.periodEnd,
    impressions: plain.impressions ?? 0,
    clicks: plain.clicks ?? 0,
    conversions: plain.conversions ?? 0,
    revenue: plain.revenue == null ? 0 : Number(plain.revenue),
    repeatClients: plain.repeatClients ?? 0,
    attachRate: plain.attachRate == null ? null : Number(plain.attachRate),
    upsellRevenue: plain.upsellRevenue == null ? null : Number(plain.upsellRevenue),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerRepeatClient = sequelize.define(
  'FreelancerRepeatClient',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    clientName: { type: DataTypes.STRING(255), allowNull: false },
    clientCompany: { type: DataTypes.STRING(255), allowNull: true },
    lastOrderAt: { type: DataTypes.DATE, allowNull: true },
    totalOrders: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lifetimeValue: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    isRetainer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    retainerStartDate: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'freelancer_repeat_clients' },
);

FreelancerRepeatClient.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    clientName: plain.clientName,
    clientCompany: plain.clientCompany,
    lastOrderAt: plain.lastOrderAt,
    totalOrders: plain.totalOrders ?? 0,
    lifetimeValue: plain.lifetimeValue == null ? 0 : Number(plain.lifetimeValue),
    isRetainer: Boolean(plain.isRetainer),
    retainerStartDate: plain.retainerStartDate,
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerCrossSellOpportunity = sequelize.define(
  'FreelancerCrossSellOpportunity',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    fromBundleId: { type: DataTypes.INTEGER, allowNull: true },
    toBundleId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    signal: { type: DataTypes.TEXT, allowNull: false },
    recommendedAction: { type: DataTypes.TEXT, allowNull: false },
    expectedUpliftPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    expectedRevenue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    confidence: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
  },
  { tableName: 'freelancer_cross_sell_opportunities' },
);

FreelancerCrossSellOpportunity.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    fromBundleId: plain.fromBundleId,
    toBundleId: plain.toBundleId,
    title: plain.title,
    signal: plain.signal,
    recommendedAction: plain.recommendedAction,
    expectedUpliftPercentage:
      plain.expectedUpliftPercentage == null ? null : Number(plain.expectedUpliftPercentage),
    expectedRevenue: plain.expectedRevenue == null ? null : Number(plain.expectedRevenue),
    confidence: plain.confidence == null ? null : Number(plain.confidence),
    priority: plain.priority ?? 2,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerKeywordImpression = sequelize.define(
  'FreelancerKeywordImpression',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    keyword: { type: DataTypes.STRING(255), allowNull: false },
    region: { type: DataTypes.STRING(120), allowNull: true },
    impressions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    clicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    conversions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    trendPercentage: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    capturedAt: { type: DataTypes.DATE, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'freelancer_keyword_impressions' },
);

FreelancerKeywordImpression.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    keyword: plain.keyword,
    region: plain.region,
    impressions: plain.impressions ?? 0,
    clicks: plain.clicks ?? 0,
    conversions: plain.conversions ?? 0,
    trendPercentage: plain.trendPercentage == null ? null : Number(plain.trendPercentage),
    capturedAt: plain.capturedAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerMarginSnapshot = sequelize.define(
  'FreelancerMarginSnapshot',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.DATEONLY, allowNull: false },
    revenue: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    softwareCosts: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    subcontractorCosts: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    fulfillmentCosts: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'freelancer_margin_snapshots' },
);

FreelancerMarginSnapshot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    month: plain.month,
    revenue: plain.revenue == null ? 0 : Number(plain.revenue),
    softwareCosts: plain.softwareCosts == null ? 0 : Number(plain.softwareCosts),
    subcontractorCosts:
      plain.subcontractorCosts == null ? 0 : Number(plain.subcontractorCosts),
    fulfillmentCosts: plain.fulfillmentCosts == null ? 0 : Number(plain.fulfillmentCosts),
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpad = sequelize.define(
  'ExperienceLaunchpad',
export const ClientSuccessPlaybook = sequelize.define(
  'ClientSuccessPlaybook',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    triggerType: {
      type: DataTypes.ENUM(...CLIENT_SUCCESS_PLAYBOOK_TRIGGERS),
      allowNull: false,
      defaultValue: 'gig_purchase',
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    tags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'client_success_playbooks' },
);

ClientSuccessPlaybook.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    description: plain.description ?? null,
    triggerType: plain.triggerType,
    isActive: Boolean(plain.isActive),
    tags: Array.isArray(plain.tags) ? plain.tags : plain.tags ?? [],
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ClientSuccessStep = sequelize.define(
  'ClientSuccessStep',
  {
    playbookId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    stepType: {
      type: DataTypes.ENUM(...CLIENT_SUCCESS_STEP_TYPES),
      allowNull: false,
      defaultValue: 'email',
    },
    channel: {
      type: DataTypes.ENUM(...CLIENT_SUCCESS_STEP_CHANNELS),
      allowNull: false,
      defaultValue: 'email',
    },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    offsetHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    waitForCompletion: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    templateSubject: { type: DataTypes.STRING(200), allowNull: true },
    templateBody: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'client_success_steps' },
);

ClientSuccessStep.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    playbookId: plain.playbookId,
    name: plain.name,
    stepType: plain.stepType,
    channel: plain.channel,
    orderIndex: plain.orderIndex,
    offsetHours: plain.offsetHours,
    waitForCompletion: Boolean(plain.waitForCompletion),
    templateSubject: plain.templateSubject ?? null,
    templateBody: plain.templateBody ?? null,
    metadata: plain.metadata ?? null,
    isActive: Boolean(plain.isActive),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ClientSuccessEnrollment = sequelize.define(
  'ClientSuccessEnrollment',
  {
    playbookId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    clientId: { type: DataTypes.INTEGER, allowNull: true },
    gigId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...CLIENT_SUCCESS_ENROLLMENT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'client_success_enrollments' },
);

ClientSuccessEnrollment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    playbookId: plain.playbookId,
    freelancerId: plain.freelancerId,
    clientId: plain.clientId,
    gigId: plain.gigId,
    status: plain.status,
    startedAt: plain.startedAt,
    completedAt: plain.completedAt,
    cancelledAt: plain.cancelledAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ClientSuccessEvent = sequelize.define(
  'ClientSuccessEvent',
  {
    enrollmentId: { type: DataTypes.INTEGER, allowNull: false },
    stepId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...CLIENT_SUCCESS_EVENT_STATUSES),
      allowNull: false,
      defaultValue: 'queued',
    },
    channel: { type: DataTypes.STRING(40), allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    executedAt: { type: DataTypes.DATE, allowNull: true },
    resultSummary: { type: DataTypes.STRING(255), allowNull: true },
    payload: { type: jsonType, allowNull: true },
    errorDetails: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'client_success_events' },
);

ClientSuccessEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    enrollmentId: plain.enrollmentId,
    stepId: plain.stepId,
    freelancerId: plain.freelancerId,
    status: plain.status,
    channel: plain.channel ?? null,
    scheduledAt: plain.scheduledAt,
    executedAt: plain.executedAt,
    resultSummary: plain.resultSummary ?? null,
    payload: plain.payload ?? null,
    errorDetails: plain.errorDetails ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ClientSuccessReferral = sequelize.define(
  'ClientSuccessReferral',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    gigId: { type: DataTypes.INTEGER, allowNull: true },
    referrerId: { type: DataTypes.INTEGER, allowNull: true },
    referredEmail: { type: DataTypes.STRING(255), allowNull: true },
    referralCode: { type: DataTypes.STRING(80), allowNull: false },
    status: {
      type: DataTypes.ENUM(...CLIENT_SUCCESS_REFERRAL_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
    },
    rewardValueCents: { type: DataTypes.INTEGER, allowNull: true },
    rewardCurrency: { type: DataTypes.STRING(8), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'client_success_referrals' },
);

ClientSuccessReferral.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    gigId: plain.gigId,
    referrerId: plain.referrerId,
    referredEmail: plain.referredEmail ?? null,
    referralCode: plain.referralCode,
    status: plain.status,
    rewardValueCents: plain.rewardValueCents ?? null,
    rewardCurrency: plain.rewardCurrency ?? null,
    metadata: plain.metadata ?? null,
    occurredAt: plain.occurredAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ClientSuccessReviewNudge = sequelize.define(
  'ClientSuccessReviewNudge',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    gigId: { type: DataTypes.INTEGER, allowNull: true },
    clientId: { type: DataTypes.INTEGER, allowNull: true },
    orderId: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...CLIENT_SUCCESS_REVIEW_NUDGE_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    channel: { type: DataTypes.STRING(40), allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    responseAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'client_success_review_nudges' },
);

ClientSuccessReviewNudge.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    gigId: plain.gigId,
    clientId: plain.clientId,
    orderId: plain.orderId ?? null,
    status: plain.status,
    channel: plain.channel ?? null,
    scheduledAt: plain.scheduledAt ?? null,
    sentAt: plain.sentAt ?? null,
    responseAt: plain.responseAt ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ClientSuccessAffiliateLink = sequelize.define(
  'ClientSuccessAffiliateLink',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    gigId: { type: DataTypes.INTEGER, allowNull: true },
    label: { type: DataTypes.STRING(160), allowNull: true },
    code: { type: DataTypes.STRING(80), allowNull: false },
    status: {
      type: DataTypes.ENUM(...CLIENT_SUCCESS_AFFILIATE_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    destinationUrl: { type: DataTypes.STRING(512), allowNull: true },
    commissionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    totalClicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalConversions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalRevenueCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    revenueCurrency: { type: DataTypes.STRING(8), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'client_success_affiliate_links' },
);

ClientSuccessAffiliateLink.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    gigId: plain.gigId,
    label: plain.label ?? null,
    code: plain.code,
    status: plain.status,
    destinationUrl: plain.destinationUrl ?? null,
    commissionRate: plain.commissionRate == null ? null : Number(plain.commissionRate),
    totalClicks: plain.totalClicks ?? 0,
    totalConversions: plain.totalConversions ?? 0,
    totalRevenueCents: plain.totalRevenueCents ?? 0,
    revenueCurrency: plain.revenueCurrency ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpad = sequelize.define(
  'ExperienceLaunchpad',
export const GigPackage = sequelize.define(
  'GigPackage',
  {
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    tierName: { type: DataTypes.STRING(120), allowNull: false },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    priceAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    priceCurrency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    deliveryDays: { type: DataTypes.INTEGER, allowNull: true },
    revisionCount: { type: DataTypes.INTEGER, allowNull: true },
    features: { type: jsonType, allowNull: true },
    isBestValue: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'gig_packages' },
);

GigPackage.prototype.toBuilderObject = function toBuilderObject() {
  const plain = this.get({ plain: true });
  const features = Array.isArray(plain.features)
    ? plain.features
    : plain.features && typeof plain.features === 'object'
    ? Object.values(plain.features)
    : [];
  return {
    id: plain.id,
    gigId: plain.gigId,
    name: plain.tierName,
    tagline: plain.tagline,
    description: plain.description,
    priceAmount: plain.priceAmount == null ? null : Number(plain.priceAmount),
    priceCurrency: plain.priceCurrency,
    deliveryDays: plain.deliveryDays,
    revisionCount: plain.revisionCount,
    features,
    isBestValue: Boolean(plain.isBestValue),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigAddon = sequelize.define(
  'GigAddon',
  {
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priceAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    priceCurrency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    deliveryDays: { type: DataTypes.INTEGER, allowNull: true },
    isPopular: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'gig_addons' },
);

GigAddon.prototype.toBuilderObject = function toBuilderObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    gigId: plain.gigId,
    name: plain.name,
    description: plain.description,
    priceAmount: plain.priceAmount == null ? null : Number(plain.priceAmount),
    priceCurrency: plain.priceCurrency,
    deliveryDays: plain.deliveryDays,
    isPopular: Boolean(plain.isPopular),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigMediaAsset = sequelize.define(
  'GigMediaAsset',
  {
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    assetType: {
      type: DataTypes.ENUM(...GIG_MEDIA_TYPES),
      allowNull: false,
      defaultValue: 'image',
      validate: { isIn: [GIG_MEDIA_TYPES] },
    },
    url: { type: DataTypes.STRING(500), allowNull: false },
    thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true },
    caption: { type: DataTypes.STRING(255), allowNull: true },
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    processingStatus: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'ready' },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'gig_media_assets' },
);

GigMediaAsset.prototype.toBuilderObject = function toBuilderObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    gigId: plain.gigId,
    type: plain.assetType,
    url: plain.url,
    thumbnailUrl: plain.thumbnailUrl,
    caption: plain.caption,
    displayOrder: plain.displayOrder,
    processingStatus: plain.processingStatus,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigCallToAction = sequelize.define(
  'GigCallToAction',
  {
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    headline: { type: DataTypes.STRING(255), allowNull: false },
    subheadline: { type: DataTypes.STRING(500), allowNull: true },
    buttonLabel: { type: DataTypes.STRING(120), allowNull: false },
    buttonUrl: { type: DataTypes.STRING(500), allowNull: true },
    stylePreset: { type: DataTypes.STRING(80), allowNull: true },
    audienceSegment: { type: DataTypes.STRING(120), allowNull: true },
    badge: { type: DataTypes.STRING(80), allowNull: true },
    expectedLift: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'gig_call_to_actions' },
);

GigCallToAction.prototype.toBuilderObject = function toBuilderObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    gigId: plain.gigId,
    headline: plain.headline,
    subheadline: plain.subheadline,
    buttonLabel: plain.buttonLabel,
    buttonUrl: plain.buttonUrl,
    stylePreset: plain.stylePreset,
    audienceSegment: plain.audienceSegment,
    badge: plain.badge,
    expectedLift: plain.expectedLift == null ? null : Number(plain.expectedLift),
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigPreviewLayout = sequelize.define(
  'GigPreviewLayout',
  {
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    deviceType: {
      type: DataTypes.ENUM(...GIG_PREVIEW_DEVICE_TYPES),
      allowNull: false,
      validate: { isIn: [GIG_PREVIEW_DEVICE_TYPES] },
    },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    supportingCopy: { type: DataTypes.STRING(500), allowNull: true },
    previewUrl: { type: DataTypes.STRING(500), allowNull: true },
    layoutSettings: { type: jsonType, allowNull: true },
    conversionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  },
  { tableName: 'gig_preview_layouts' },
);

GigPreviewLayout.prototype.toBuilderObject = function toBuilderObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    gigId: plain.gigId,
    deviceType: plain.deviceType,
    headline: plain.headline,
    supportingCopy: plain.supportingCopy,
    previewUrl: plain.previewUrl,
    layoutSettings: plain.layoutSettings ?? {},
    conversionRate: plain.conversionRate == null ? null : Number(plain.conversionRate),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigPerformanceSnapshot = sequelize.define(
  'GigPerformanceSnapshot',
  {
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    snapshotDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    periodLabel: { type: DataTypes.STRING(120), allowNull: true },
    conversionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    averageOrderValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    completionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    upsellTakeRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    reviewScore: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    bookingsLast30Days: { type: DataTypes.INTEGER, allowNull: true },
    experimentNotes: { type: jsonType, allowNull: true },
  },
  { tableName: 'gig_performance_snapshots' },
);

GigPerformanceSnapshot.prototype.toBuilderObject = function toBuilderObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    gigId: plain.gigId,
    snapshotDate: plain.snapshotDate,
    periodLabel: plain.periodLabel,
    conversionRate: plain.conversionRate == null ? null : Number(plain.conversionRate),
    averageOrderValue: plain.averageOrderValue == null ? null : Number(plain.averageOrderValue),
    completionRate: plain.completionRate == null ? null : Number(plain.completionRate),
    upsellTakeRate: plain.upsellTakeRate == null ? null : Number(plain.upsellTakeRate),
    reviewScore: plain.reviewScore == null ? null : Number(plain.reviewScore),
    bookingsLast30Days: plain.bookingsLast30Days ?? null,
    experimentNotes: plain.experimentNotes ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const Project = sequelize.define(
  'Project',
export const GigOrder = sequelize.define(
  'GigOrder',
  {
    orderNumber: { type: DataTypes.STRING(24), allowNull: false, unique: true },
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    clientId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    clientCompanyName: { type: DataTypes.STRING(180), allowNull: false },
    clientContactName: { type: DataTypes.STRING(180), allowNull: true },
    clientContactEmail: { type: DataTypes.STRING(180), allowNull: true, validate: { isEmail: true } },
    clientContactPhone: { type: DataTypes.STRING(60), allowNull: true },
    status: {
      type: DataTypes.ENUM(...GIG_ORDER_STATUSES),
      allowNull: false,
      defaultValue: 'awaiting_requirements',
      validate: { isIn: [GIG_ORDER_STATUSES] },
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    progressPercent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    submittedAt: { type: DataTypes.DATE, allowNull: false },
    kickoffDueAt: { type: DataTypes.DATE, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'gig_orders' },
);

GigOrder.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    orderNumber: plain.orderNumber,
    gigId: plain.gigId,
    clientId: plain.clientId,
    freelancerId: plain.freelancerId,
    clientCompanyName: plain.clientCompanyName,
    clientContactName: plain.clientContactName ?? null,
    clientContactEmail: plain.clientContactEmail ?? null,
    clientContactPhone: plain.clientContactPhone ?? null,
    status: plain.status,
    currencyCode: plain.currencyCode ?? 'USD',
    amount: plain.amount == null ? 0 : Number(plain.amount),
    progressPercent: plain.progressPercent ?? 0,
    submittedAt: plain.submittedAt ?? null,
    kickoffDueAt: plain.kickoffDueAt ?? null,
    dueAt: plain.dueAt ?? null,
    completedAt: plain.completedAt ?? null,
    metadata: plain.metadata ?? null,
Gig.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    budget: plain.budget ?? null,
    duration: plain.duration ?? null,
    location: plain.location ?? null,
    geoLocation: plain.geoLocation ?? null,
    freelancerId: plain.freelancerId ?? null,
    status: plain.status,
    pipelineStage: plain.pipelineStage,
    contractValueCents: plain.contractValueCents == null ? 0 : Number(plain.contractValueCents),
    previousPipelineValueCents:
      plain.previousPipelineValueCents == null ? 0 : Number(plain.previousPipelineValueCents),
    currency: plain.currency ?? 'USD',
    upsellEligibleValueCents:
      plain.upsellEligibleValueCents == null ? 0 : Number(plain.upsellEligibleValueCents),
    expectedDeliveryDate: plain.expectedDeliveryDate ?? null,
    clientName: plain.clientName ?? null,
    csatScore: plain.csatScore == null ? null : Number(plain.csatScore),
    csatPreviousScore: plain.csatPreviousScore == null ? null : Number(plain.csatPreviousScore),
    csatResponseCount: Number(plain.csatResponseCount ?? 0),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SprintCycle = sequelize.define(
  'SprintCycle',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(180), allowNull: false },
    goal: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...SPRINT_STATUSES),
      allowNull: false,
      defaultValue: 'planning',
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    velocityTarget: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'sprint_cycles' },
);

SprintCycle.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    name: plain.name,
    goal: plain.goal,
    status: plain.status,
    startDate: plain.startDate,
    endDate: plain.endDate,
    velocityTarget: plain.velocityTarget == null ? null : Number(plain.velocityTarget),
    createdById: plain.createdById,
    updatedById: plain.updatedById,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SprintTask = sequelize.define(
  'SprintTask',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    sprintId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...SPRINT_TASK_STATUSES),
      allowNull: false,
      defaultValue: 'backlog',
    },
    type: { type: DataTypes.STRING(60), allowNull: true },
    priority: {
      type: DataTypes.ENUM(...SPRINT_TASK_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
    },
    storyPoints: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    sequence: { type: DataTypes.INTEGER, allowNull: true },
    assigneeId: { type: DataTypes.INTEGER, allowNull: true },
    reporterId: { type: DataTypes.INTEGER, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    blockedReason: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'sprint_tasks' },
);

SprintTask.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    sprintId: plain.sprintId,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    type: plain.type,
    priority: plain.priority,
    storyPoints: plain.storyPoints == null ? null : Number(plain.storyPoints),
    sequence: plain.sequence,
    assigneeId: plain.assigneeId,
    reporterId: plain.reporterId,
    dueDate: plain.dueDate,
    startedAt: plain.startedAt,
    completedAt: plain.completedAt,
    blockedReason: plain.blockedReason,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SprintTaskDependency = sequelize.define(
  'SprintTaskDependency',
  {
    taskId: { type: DataTypes.INTEGER, allowNull: false },
    dependsOnTaskId: { type: DataTypes.INTEGER, allowNull: false },
    dependencyType: { type: DataTypes.STRING(60), allowNull: true },
  },
  { tableName: 'sprint_task_dependencies' },
);

SprintTaskDependency.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    taskId: plain.taskId,
    dependsOnTaskId: plain.dependsOnTaskId,
    dependencyType: plain.dependencyType,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SprintTaskTimeEntry = sequelize.define(
  'SprintTaskTimeEntry',
  {
    taskId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    endedAt: { type: DataTypes.DATE, allowNull: true },
    minutesSpent: { type: DataTypes.INTEGER, allowNull: false },
    billable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'sprint_task_time_entries' },
);

SprintTaskTimeEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    taskId: plain.taskId,
    userId: plain.userId,
    startedAt: plain.startedAt,
    endedAt: plain.endedAt,
    minutesSpent: plain.minutesSpent,
    billable: Boolean(plain.billable),
    hourlyRate: plain.hourlyRate == null ? null : Number(plain.hourlyRate),
    notes: plain.notes,
    approvedAt: plain.approvedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SprintRisk = sequelize.define(
  'SprintRisk',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    sprintId: { type: DataTypes.INTEGER, allowNull: true },
    taskId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    probability: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    impact: {
      type: DataTypes.ENUM(...SPRINT_RISK_IMPACTS),
      allowNull: false,
      defaultValue: 'medium',
    },
    severityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    mitigationPlan: { type: DataTypes.TEXT, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...SPRINT_RISK_STATUSES),
      allowNull: false,
      defaultValue: 'open',
    },
    loggedAt: { type: DataTypes.DATE, allowNull: true },
    reviewAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'sprint_risks' },
);

SprintRisk.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    sprintId: plain.sprintId,
    taskId: plain.taskId,
    title: plain.title,
    description: plain.description,
    probability: plain.probability == null ? null : Number(plain.probability),
    impact: plain.impact,
    severityScore: plain.severityScore == null ? null : Number(plain.severityScore),
    mitigationPlan: plain.mitigationPlan,
    ownerId: plain.ownerId,
    status: plain.status,
    loggedAt: plain.loggedAt,
    reviewAt: plain.reviewAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ChangeRequest = sequelize.define(
  'ChangeRequest',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    sprintId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...CHANGE_REQUEST_STATUSES),
      allowNull: false,
      defaultValue: 'pending_approval',
    },
    requestedById: { type: DataTypes.INTEGER, allowNull: true },
    approvedById: { type: DataTypes.INTEGER, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    approvalMetadata: { type: jsonType, allowNull: true },
    eSignDocumentUrl: { type: DataTypes.STRING(500), allowNull: true },
    eSignAuditTrail: { type: jsonType, allowNull: true },
    changeImpact: { type: jsonType, allowNull: true },
    decisionNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'change_requests' },
);

ChangeRequest.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    sprintId: plain.sprintId,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    requestedById: plain.requestedById,
    approvedById: plain.approvedById,
    approvedAt: plain.approvedAt,
    approvalMetadata: plain.approvalMetadata,
    eSignDocumentUrl: plain.eSignDocumentUrl,
    eSignAuditTrail: plain.eSignAuditTrail,
    changeImpact: plain.changeImpact,
    decisionNotes: plain.decisionNotes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpad = sequelize.define(
  'ExperienceLaunchpad',
export const GigMilestone = sequelize.define(
  'GigMilestone',
  {
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'planned',
      validate: { isIn: [GIG_MILESTONE_STATUSES] },
    },
    ownerName: { type: DataTypes.STRING(120), allowNull: true },
    sequenceIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    progressPercent: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'gig_milestones' },
);

GigMilestone.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    gigId: plain.gigId,
    title: plain.title,
    description: plain.description ?? null,
    dueDate: plain.dueDate ?? null,
    status: plain.status,
    ownerName: plain.ownerName ?? null,
    sequenceIndex: plain.sequenceIndex ?? 0,
    progressPercent: plain.progressPercent == null ? null : Number(plain.progressPercent),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigOrderRequirement = sequelize.define(
  'GigOrderRequirement',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...GIG_ORDER_REQUIREMENT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [GIG_ORDER_REQUIREMENT_STATUSES] },
    },
    priority: {
      type: DataTypes.ENUM(...GIG_ORDER_REQUIREMENT_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [GIG_ORDER_REQUIREMENT_PRIORITIES] },
    },
    requestedAt: { type: DataTypes.DATE, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    receivedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    items: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'gig_order_requirements' },
);

GigOrderRequirement.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    orderId: plain.orderId,
    title: plain.title,
    status: plain.status,
    priority: plain.priority,
    requestedAt: plain.requestedAt ?? null,
    dueAt: plain.dueAt ?? null,
    receivedAt: plain.receivedAt ?? null,
    notes: plain.notes ?? null,
    items: Array.isArray(plain.items) ? plain.items : plain.items ?? [],
    metadata: plain.metadata ?? null,
export const GigBundle = sequelize.define(
  'GigBundle',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priceCents: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [GIG_BUNDLE_STATUSES] },
    },
    attachRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    attachRateChange: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    conversionWindowDays: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'gig_bundles' },
);

GigBundle.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    description: plain.description ?? null,
    priceCents: plain.priceCents == null ? 0 : Number(plain.priceCents),
    currency: plain.currency ?? 'USD',
    status: plain.status,
    attachRate: plain.attachRate == null ? null : Number(plain.attachRate),
    attachRateChange: plain.attachRateChange == null ? null : Number(plain.attachRateChange),
    isFeatured: Boolean(plain.isFeatured),
    conversionWindowDays: plain.conversionWindowDays == null ? null : Number(plain.conversionWindowDays),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigOrderRevision = sequelize.define(
  'GigOrderRevision',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    roundNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: {
      type: DataTypes.ENUM(...GIG_ORDER_REVISION_STATUSES),
      allowNull: false,
      defaultValue: 'requested',
      validate: { isIn: [GIG_ORDER_REVISION_STATUSES] },
    },
    severity: {
      type: DataTypes.ENUM(...GIG_ORDER_REVISION_SEVERITIES),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [GIG_ORDER_REVISION_SEVERITIES] },
    },
    focusAreas: { type: jsonType, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    requestedAt: { type: DataTypes.DATE, allowNull: false },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'gig_order_revisions' },
);

GigOrderRevision.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    orderId: plain.orderId,
    roundNumber: plain.roundNumber ?? 1,
    status: plain.status,
    severity: plain.severity,
    focusAreas: Array.isArray(plain.focusAreas) ? plain.focusAreas : plain.focusAreas ?? [],
    summary: plain.summary ?? null,
    requestedAt: plain.requestedAt ?? null,
    dueAt: plain.dueAt ?? null,
    submittedAt: plain.submittedAt ?? null,
    approvedAt: plain.approvedAt ?? null,
    metadata: plain.metadata ?? null,
export const GigBundleItem = sequelize.define(
  'GigBundleItem',
  {
    bundleId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(255), allowNull: false },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'gig_bundle_items' },
);

GigBundleItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    bundleId: plain.bundleId,
    label: plain.label,
    orderIndex: plain.orderIndex ?? 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigOrderPayout = sequelize.define(
  'GigOrderPayout',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    milestoneLabel: { type: DataTypes.STRING(255), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...GIG_ORDER_PAYOUT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [GIG_ORDER_PAYOUT_STATUSES] },
    },
    expectedAt: { type: DataTypes.DATE, allowNull: true },
    releasedAt: { type: DataTypes.DATE, allowNull: true },
    riskNote: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'gig_order_payouts' },
);

GigOrderPayout.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    orderId: plain.orderId,
    milestoneLabel: plain.milestoneLabel,
    amount: plain.amount == null ? 0 : Number(plain.amount),
    currencyCode: plain.currencyCode ?? 'USD',
    status: plain.status,
    expectedAt: plain.expectedAt ?? null,
    releasedAt: plain.releasedAt ?? null,
    riskNote: plain.riskNote ?? null,
    metadata: plain.metadata ?? null,
export const GigUpsell = sequelize.define(
  'GigUpsell',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    triggerEvent: { type: DataTypes.STRING(255), allowNull: true },
    deliveryAction: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [GIG_UPSELL_STATUSES] },
    },
    automationChannel: { type: DataTypes.STRING(80), allowNull: true },
    estimatedValueCents: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'USD' },
    conversionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    conversionChange: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  },
  { tableName: 'gig_upsells' },
);

GigUpsell.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    triggerEvent: plain.triggerEvent ?? null,
    deliveryAction: plain.deliveryAction ?? null,
    status: plain.status,
    automationChannel: plain.automationChannel ?? null,
    estimatedValueCents: plain.estimatedValueCents == null ? 0 : Number(plain.estimatedValueCents),
    currency: plain.currency ?? 'USD',
    conversionRate: plain.conversionRate == null ? null : Number(plain.conversionRate),
    conversionChange: plain.conversionChange == null ? null : Number(plain.conversionChange),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigOrderActivity = sequelize.define(
  'GigOrderActivity',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    activityType: {
      type: DataTypes.ENUM(...GIG_ORDER_ACTIVITY_TYPES),
      allowNull: false,
      defaultValue: 'system',
      validate: { isIn: [GIG_ORDER_ACTIVITY_TYPES] },
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'gig_order_activities' },
);

GigOrderActivity.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    orderId: plain.orderId,
    freelancerId: plain.freelancerId,
    actorId: plain.actorId ?? null,
    activityType: plain.activityType,
    title: plain.title,
    description: plain.description ?? null,
    occurredAt: plain.occurredAt ?? null,
    metadata: plain.metadata ?? null,
export const GigCatalogItem = sequelize.define(
  'GigCatalogItem',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING(40), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    tier: { type: DataTypes.STRING(80), allowNull: true },
    durationDays: { type: DataTypes.INTEGER, allowNull: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    priceCents: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [GIG_CATALOG_STATUSES] },
    },
    shortDescription: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'gig_catalog_items' },
);

GigCatalogItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    code: plain.code,
    title: plain.title,
    tier: plain.tier ?? null,
    durationDays: plain.durationDays == null ? null : Number(plain.durationDays),
    rating: plain.rating == null ? null : Number(plain.rating),
    ratingCount: Number(plain.ratingCount ?? 0),
    priceCents: plain.priceCents == null ? 0 : Number(plain.priceCents),
    currency: plain.currency ?? 'USD',
    status: plain.status,
    shortDescription: plain.shortDescription ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};
export const WORKSPACE_STATUSES = ['briefing', 'active', 'blocked', 'completed'];
export const WORKSPACE_RISK_LEVELS = ['low', 'moderate', 'high', 'critical'];
export const WORKSPACE_WHITEBOARD_STATUSES = ['active', 'pending_review', 'archived'];
export const WORKSPACE_CONVERSATION_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
export const WORKSPACE_APPROVAL_STATUSES = ['pending', 'in_review', 'approved', 'changes_requested', 'rejected'];

export const Project = sequelize.define(
  'Project',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    budgetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetCurrency: { type: DataTypes.STRING(6), allowNull: true },
    autoAssignEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoAssignStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'inactive' },
    autoAssignSettings: { type: jsonType, allowNull: true },
    autoAssignLastRunAt: { type: DataTypes.DATE, allowNull: true },
    autoAssignLastQueueSize: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'projects' },
);

Project.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return Project.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

Project.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    location: plain.location,
    geoLocation: plain.geoLocation,
    budgetAmount: plain.budgetAmount == null ? null : Number(plain.budgetAmount),
    budgetCurrency: plain.budgetCurrency ?? null,
    autoAssignEnabled: Boolean(plain.autoAssignEnabled),
    autoAssignStatus: plain.autoAssignStatus,
    autoAssignSettings: plain.autoAssignSettings ?? null,
    autoAssignLastRunAt: plain.autoAssignLastRunAt ?? null,
    autoAssignLastQueueSize: plain.autoAssignLastQueueSize ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectBlueprint = sequelize.define(
  'ProjectBlueprint',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    methodology: { type: DataTypes.STRING(120), allowNull: true },
    governanceModel: { type: DataTypes.STRING(120), allowNull: true },
    sprintCadence: { type: DataTypes.STRING(80), allowNull: true },
    programManager: { type: DataTypes.STRING(120), allowNull: true },
    healthStatus: {
      type: DataTypes.ENUM(...PROJECT_BLUEPRINT_HEALTH_STATUSES),
      allowNull: false,
      defaultValue: 'on_track',
      validate: { isIn: [PROJECT_BLUEPRINT_HEALTH_STATUSES] },
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    lastReviewedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_blueprints' },
);

ProjectBlueprint.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const serializeCollection = (items) =>
    Array.isArray(items) ? items.map((item) => item.toPublicObject?.() ?? item) : [];
  return {
    id: plain.id,
    projectId: plain.projectId,
    summary: plain.summary,
    methodology: plain.methodology,
    governanceModel: plain.governanceModel,
    sprintCadence: plain.sprintCadence,
    programManager: plain.programManager,
    healthStatus: plain.healthStatus,
    startDate: plain.startDate,
    endDate: plain.endDate,
    lastReviewedAt: plain.lastReviewedAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    sprints: serializeCollection(this.sprints),
    dependencies: serializeCollection(this.dependencies),
    risks: serializeCollection(this.risks),
    billingCheckpoints: serializeCollection(this.billingCheckpoints),
  };
};

export const ProjectBlueprintSprint = sequelize.define(
  'ProjectBlueprintSprint',
  {
    blueprintId: { type: DataTypes.INTEGER, allowNull: false },
    sequence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    name: { type: DataTypes.STRING(120), allowNull: false },
    objective: { type: DataTypes.TEXT, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM(...PROJECT_SPRINT_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
      validate: { isIn: [PROJECT_SPRINT_STATUSES] },
    },
    owner: { type: DataTypes.STRING(120), allowNull: true },
    velocityCommitment: { type: DataTypes.INTEGER, allowNull: true },
    progress: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    deliverables: { type: jsonType, allowNull: true },
    acceptanceCriteria: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'project_blueprint_sprints' },
);

ProjectBlueprintSprint.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    blueprintId: plain.blueprintId,
    sequence: plain.sequence,
    name: plain.name,
    objective: plain.objective,
    startDate: plain.startDate,
    endDate: plain.endDate,
    status: plain.status,
    owner: plain.owner,
    velocityCommitment: plain.velocityCommitment == null ? null : Number(plain.velocityCommitment),
    progress: plain.progress == null ? null : Number(plain.progress),
    deliverables: Array.isArray(plain.deliverables) ? plain.deliverables : [],
    acceptanceCriteria: plain.acceptanceCriteria,
export const ProjectWorkspace = sequelize.define(
  'ProjectWorkspace',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_STATUSES),
      allowNull: false,
      defaultValue: 'briefing',
      validate: { isIn: [WORKSPACE_STATUSES] },
    },
    healthScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    velocityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    riskLevel: {
      type: DataTypes.ENUM(...WORKSPACE_RISK_LEVELS),
      allowNull: false,
      defaultValue: 'low',
      validate: { isIn: [WORKSPACE_RISK_LEVELS] },
    },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    clientSatisfaction: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    automationCoverage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    billingStatus: { type: DataTypes.STRING(80), allowNull: true },
    nextMilestone: { type: DataTypes.STRING(255), allowNull: true },
    nextMilestoneDueAt: { type: DataTypes.DATE, allowNull: true },
    metricsSnapshot: { type: jsonType, allowNull: true },
    lastActivityAt: { type: DataTypes.DATE, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'project_workspaces' },
);

ProjectWorkspace.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    status: plain.status,
    healthScore: plain.healthScore == null ? null : Number(plain.healthScore),
    velocityScore: plain.velocityScore == null ? null : Number(plain.velocityScore),
    riskLevel: plain.riskLevel,
    progressPercent: plain.progressPercent == null ? null : Number(plain.progressPercent),
    clientSatisfaction: plain.clientSatisfaction == null ? null : Number(plain.clientSatisfaction),
    automationCoverage: plain.automationCoverage == null ? null : Number(plain.automationCoverage),
    billingStatus: plain.billingStatus,
    nextMilestone: plain.nextMilestone,
    nextMilestoneDueAt: plain.nextMilestoneDueAt,
    metricsSnapshot: plain.metricsSnapshot ?? null,
    lastActivityAt: plain.lastActivityAt,
    updatedById: plain.updatedById,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceBrief = sequelize.define(
  'ProjectWorkspaceBrief',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    objectives: { type: jsonType, allowNull: true },
    deliverables: { type: jsonType, allowNull: true },
    successMetrics: { type: jsonType, allowNull: true },
    clientStakeholders: { type: jsonType, allowNull: true },
    lastUpdatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'project_workspace_briefs' },
);

ProjectWorkspaceBrief.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    summary: plain.summary,
    objectives: Array.isArray(plain.objectives) ? plain.objectives : [],
    deliverables: Array.isArray(plain.deliverables) ? plain.deliverables : [],
    successMetrics: Array.isArray(plain.successMetrics) ? plain.successMetrics : [],
    clientStakeholders: Array.isArray(plain.clientStakeholders) ? plain.clientStakeholders : [],
    lastUpdatedById: plain.lastUpdatedById,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectBlueprintDependency = sequelize.define(
  'ProjectBlueprintDependency',
  {
    blueprintId: { type: DataTypes.INTEGER, allowNull: false },
    impactedSprintId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    dependencyType: {
      type: DataTypes.ENUM(...PROJECT_DEPENDENCY_TYPES),
      allowNull: false,
      defaultValue: 'internal',
      validate: { isIn: [PROJECT_DEPENDENCY_TYPES] },
    },
    owner: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...PROJECT_DEPENDENCY_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [PROJECT_DEPENDENCY_STATUSES] },
    },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    riskLevel: {
      type: DataTypes.ENUM(...PROJECT_DEPENDENCY_RISK_LEVELS),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [PROJECT_DEPENDENCY_RISK_LEVELS] },
    },
    impact: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'project_blueprint_dependencies' },
);

ProjectBlueprintDependency.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    blueprintId: plain.blueprintId,
    impactedSprintId: plain.impactedSprintId,
    name: plain.name,
    description: plain.description,
    dependencyType: plain.dependencyType,
    owner: plain.owner,
    status: plain.status,
    dueDate: plain.dueDate,
    riskLevel: plain.riskLevel,
    impact: plain.impact,
    notes: plain.notes,
export const ProjectWorkspaceWhiteboard = sequelize.define(
  'ProjectWorkspaceWhiteboard',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_WHITEBOARD_STATUSES),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [WORKSPACE_WHITEBOARD_STATUSES] },
    },
    ownerName: { type: DataTypes.STRING(255), allowNull: true },
    thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true },
    lastEditedAt: { type: DataTypes.DATE, allowNull: true },
    lastEditedById: { type: DataTypes.INTEGER, allowNull: true },
    activeCollaborators: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_whiteboards' },
);

ProjectWorkspaceWhiteboard.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    status: plain.status,
    ownerName: plain.ownerName,
    thumbnailUrl: plain.thumbnailUrl,
    lastEditedAt: plain.lastEditedAt,
    lastEditedById: plain.lastEditedById,
    activeCollaborators: Array.isArray(plain.activeCollaborators) ? plain.activeCollaborators : [],
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectBlueprintRisk = sequelize.define(
  'ProjectBlueprintRisk',
  {
    blueprintId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    probability: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
    impact: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
    severityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 9 },
    status: {
      type: DataTypes.ENUM(...PROJECT_RISK_STATUSES),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [PROJECT_RISK_STATUSES] },
    },
    owner: { type: DataTypes.STRING(120), allowNull: true },
    mitigationPlan: { type: DataTypes.TEXT, allowNull: true },
    contingencyPlan: { type: DataTypes.TEXT, allowNull: true },
    nextReviewAt: { type: DataTypes.DATE, allowNull: true },
    tags: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_blueprint_risks' },
);

ProjectBlueprintRisk.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    blueprintId: plain.blueprintId,
    title: plain.title,
    description: plain.description,
    probability: plain.probability,
    impact: plain.impact,
    severityScore: plain.severityScore == null ? null : Number(plain.severityScore),
    status: plain.status,
    owner: plain.owner,
    mitigationPlan: plain.mitigationPlan,
    contingencyPlan: plain.contingencyPlan,
    nextReviewAt: plain.nextReviewAt,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
export const ProjectWorkspaceFile = sequelize.define(
  'ProjectWorkspaceFile',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: true },
    fileType: { type: DataTypes.STRING(60), allowNull: true },
    storageProvider: { type: DataTypes.STRING(80), allowNull: true },
    storagePath: { type: DataTypes.STRING(500), allowNull: true },
    version: { type: DataTypes.STRING(40), allowNull: true },
    sizeBytes: { type: DataTypes.BIGINT, allowNull: true },
    checksum: { type: DataTypes.STRING(120), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    uploadedById: { type: DataTypes.INTEGER, allowNull: true },
    uploadedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'project_workspace_files' },
);

ProjectWorkspaceFile.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    category: plain.category,
    fileType: plain.fileType,
    storageProvider: plain.storageProvider,
    storagePath: plain.storagePath,
    version: plain.version,
    sizeBytes: plain.sizeBytes == null ? null : Number(plain.sizeBytes),
    checksum: plain.checksum,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    metadata: plain.metadata ?? null,
    uploadedById: plain.uploadedById,
    uploadedAt: plain.uploadedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectBillingCheckpoint = sequelize.define(
  'ProjectBillingCheckpoint',
  {
    blueprintId: { type: DataTypes.INTEGER, allowNull: false },
    relatedSprintId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    billingType: {
      type: DataTypes.ENUM(...PROJECT_BILLING_TYPES),
      allowNull: false,
      defaultValue: 'milestone',
      validate: { isIn: [PROJECT_BILLING_TYPES] },
    },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(6), allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM(...PROJECT_BILLING_STATUSES),
      allowNull: false,
      defaultValue: 'upcoming',
      validate: { isIn: [PROJECT_BILLING_STATUSES] },
    },
    approvalRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    invoiceUrl: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'project_billing_checkpoints' },
);

ProjectBillingCheckpoint.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    blueprintId: plain.blueprintId,
    relatedSprintId: plain.relatedSprintId,
    name: plain.name,
    description: plain.description,
    billingType: plain.billingType,
    amount: plain.amount == null ? null : Number(plain.amount),
    currency: plain.currency,
    dueDate: plain.dueDate,
    status: plain.status,
    approvalRequired: Boolean(plain.approvalRequired),
    invoiceUrl: plain.invoiceUrl,
    notes: plain.notes,
export const ProjectWorkspaceConversation = sequelize.define(
  'ProjectWorkspaceConversation',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    channelType: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'project' },
    topic: { type: DataTypes.STRING(255), allowNull: false },
    priority: {
      type: DataTypes.ENUM(...WORKSPACE_CONVERSATION_PRIORITIES),
      allowNull: false,
      defaultValue: 'normal',
      validate: { isIn: [WORKSPACE_CONVERSATION_PRIORITIES] },
    },
    unreadCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastMessagePreview: { type: DataTypes.STRING(500), allowNull: true },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true },
    lastReadAt: { type: DataTypes.DATE, allowNull: true },
    externalLink: { type: DataTypes.STRING(500), allowNull: true },
    participants: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_conversations' },
);

ProjectWorkspaceConversation.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    channelType: plain.channelType,
    topic: plain.topic,
    priority: plain.priority,
    unreadCount: plain.unreadCount,
    lastMessagePreview: plain.lastMessagePreview,
    lastMessageAt: plain.lastMessageAt,
    lastReadAt: plain.lastReadAt,
    externalLink: plain.externalLink,
    participants: Array.isArray(plain.participants) ? plain.participants : [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceApproval = sequelize.define(
  'ProjectWorkspaceApproval',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    stage: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'discovery' },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_APPROVAL_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [WORKSPACE_APPROVAL_STATUSES] },
    },
    ownerName: { type: DataTypes.STRING(255), allowNull: true },
    approverEmail: { type: DataTypes.STRING(255), allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    decidedAt: { type: DataTypes.DATE, allowNull: true },
    decisionNotes: { type: DataTypes.TEXT, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_approvals' },
);

ProjectWorkspaceApproval.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    stage: plain.stage,
    status: plain.status,
    ownerName: plain.ownerName,
    approverEmail: plain.approverEmail,
    dueAt: plain.dueAt,
    submittedAt: plain.submittedAt,
    decidedAt: plain.decidedAt,
    decisionNotes: plain.decisionNotes,
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ClientPortal = sequelize.define(
  'ClientPortal',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...CLIENT_PORTAL_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CLIENT_PORTAL_STATUSES] },
    },
    brandColor: { type: DataTypes.STRING(12), allowNull: true },
    accentColor: { type: DataTypes.STRING(12), allowNull: true },
    preferences: { type: jsonType, allowNull: true },
    stakeholders: { type: jsonType, allowNull: true },
  },
  { tableName: 'client_portals' },
);

ClientPortal.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const ownerInstance = this.owner ?? this.get?.('owner');
  const projectInstance = this.project ?? this.get?.('project');
  const owner = ownerInstance
    ? {
        id: ownerInstance.id,
        firstName: ownerInstance.firstName,
        lastName: ownerInstance.lastName,
        name: [ownerInstance.firstName, ownerInstance.lastName].filter(Boolean).join(' ').trim(),
        email: ownerInstance.email,
      }
    : null;
  const project = projectInstance
    ? {
        id: projectInstance.id,
        title: projectInstance.title,
        status: projectInstance.status ?? null,
      }
    : null;

  const rawStakeholders = plain.stakeholders;
  const stakeholders = Array.isArray(rawStakeholders)
    ? rawStakeholders
    : rawStakeholders && typeof rawStakeholders === 'object'
    ? Object.values(rawStakeholders)
    : [];

  const preferences = plain.preferences && typeof plain.preferences === 'object' ? plain.preferences : {};

  return {
    id: plain.id,
    projectId: plain.projectId,
    ownerId: plain.ownerId,
    slug: plain.slug,
    title: plain.title,
    summary: plain.summary,
    status: plain.status,
    brandColor: plain.brandColor ?? null,
    accentColor: plain.accentColor ?? null,
    preferences,
    stakeholders,
    owner,
    project,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ClientPortalTimelineEvent = sequelize.define(
  'ClientPortalTimelineEvent',
  {
    portalId: { type: DataTypes.INTEGER, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    eventType: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'milestone' },
    status: {
      type: DataTypes.ENUM(...CLIENT_PORTAL_TIMELINE_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
      validate: { isIn: [CLIENT_PORTAL_TIMELINE_STATUSES] },
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'client_portal_timeline_events' },
);

ClientPortalTimelineEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const ownerInstance = this.owner ?? this.get?.('owner');
  const owner = ownerInstance
    ? {
        id: ownerInstance.id,
        firstName: ownerInstance.firstName,
        lastName: ownerInstance.lastName,
        name: [ownerInstance.firstName, ownerInstance.lastName].filter(Boolean).join(' ').trim(),
        email: ownerInstance.email,
      }
    : null;

  const metadata = plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : {};

  return {
    id: plain.id,
    portalId: plain.portalId,
    ownerId: plain.ownerId,
    title: plain.title,
    description: plain.description,
    eventType: plain.eventType,
    status: plain.status,
    startDate: plain.startDate,
    dueDate: plain.dueDate,
    metadata,
    owner,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ClientPortalScopeItem = sequelize.define(
  'ClientPortalScopeItem',
  {
    portalId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...CLIENT_PORTAL_SCOPE_STATUSES),
      allowNull: false,
      defaultValue: 'committed',
      validate: { isIn: [CLIENT_PORTAL_SCOPE_STATUSES] },
    },
    effortHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    valueCurrency: { type: DataTypes.STRING(6), allowNull: true },
    valueAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    lastDecisionAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'client_portal_scope_items' },
);

ClientPortalScopeItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const metadata = plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : {};

  return {
    id: plain.id,
    portalId: plain.portalId,
    title: plain.title,
    description: plain.description,
    category: plain.category,
    status: plain.status,
    effortHours: plain.effortHours == null ? null : Number(plain.effortHours),
    valueCurrency: plain.valueCurrency ?? null,
    valueAmount: plain.valueAmount == null ? null : Number(plain.valueAmount),
    lastDecisionAt: plain.lastDecisionAt,
    metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GIG_MARKETPLACE_STATUSES = ['draft', 'published', 'archived'];
export const GIG_VISIBILITY_OPTIONS = ['private', 'public', 'unlisted'];

export const Gig = sequelize.define(
  'Gig',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    slug: { type: DataTypes.STRING(200), allowNull: true, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: true },
    niche: { type: DataTypes.STRING(180), allowNull: true },
    deliveryModel: { type: DataTypes.STRING(160), allowNull: true },
    outcomePromise: { type: DataTypes.TEXT, allowNull: true },
    budget: { type: DataTypes.STRING(120), allowNull: true },
    duration: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    heroAccent: { type: DataTypes.STRING(20), allowNull: true },
    targetMetric: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...GIG_MARKETPLACE_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [GIG_MARKETPLACE_STATUSES] },
    },
    visibility: {
      type: DataTypes.ENUM(...GIG_VISIBILITY_OPTIONS),
      allowNull: false,
      defaultValue: 'private',
      validate: { isIn: [GIG_VISIBILITY_OPTIONS] },
    },
    bannerSettings: { type: jsonType, allowNull: true },
    availabilityTimezone: { type: DataTypes.STRING(120), allowNull: true },
    availabilityLeadTimeDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
export const ClientPortalDecisionLog = sequelize.define(
  'ClientPortalDecisionLog',
  {
    portalId: { type: DataTypes.INTEGER, allowNull: false },
    decidedById: { type: DataTypes.INTEGER, allowNull: true },
    summary: { type: DataTypes.STRING(255), allowNull: false },
    decision: { type: DataTypes.TEXT, allowNull: false },
    decidedAt: { type: DataTypes.DATE, allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: true },
    impactSummary: { type: DataTypes.TEXT, allowNull: true },
    followUpDate: { type: DataTypes.DATE, allowNull: true },
    visibility: {
      type: DataTypes.ENUM(...CLIENT_PORTAL_DECISION_VISIBILITIES),
      allowNull: false,
      defaultValue: 'client',
      validate: { isIn: [CLIENT_PORTAL_DECISION_VISIBILITIES] },
    },
    attachments: { type: jsonType, allowNull: true },
  },
  { tableName: 'client_portal_decision_logs' },
);

ClientPortalDecisionLog.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const decidedByInstance = this.decidedBy ?? this.get?.('decidedBy');
  const decidedBy = decidedByInstance
    ? {
        id: decidedByInstance.id,
        firstName: decidedByInstance.firstName,
        lastName: decidedByInstance.lastName,
        name: [decidedByInstance.firstName, decidedByInstance.lastName].filter(Boolean).join(' ').trim(),
        email: decidedByInstance.email,
      }
    : null;

  const attachments = Array.isArray(plain.attachments)
    ? plain.attachments
    : plain.attachments && typeof plain.attachments === 'object'
    ? Object.values(plain.attachments)
    : [];

  return {
    id: plain.id,
    portalId: plain.portalId,
    decidedById: plain.decidedById,
    summary: plain.summary,
    decision: plain.decision,
    decidedAt: plain.decidedAt,
    category: plain.category,
    impactSummary: plain.impactSummary,
    followUpDate: plain.followUpDate,
    visibility: plain.visibility,
    attachments,
    decidedBy,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

Gig.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const packages = Array.isArray(this.packages)
    ? this.packages.map((pkg) => pkg.toPublicObject?.() ?? pkg)
    : [];
  const addOns = Array.isArray(this.addOns)
    ? this.addOns.map((addon) => addon.toPublicObject?.() ?? addon)
    : [];
  const availabilitySlots = Array.isArray(this.availabilitySlots)
    ? this.availabilitySlots.map((slot) => slot.toPublicObject?.() ?? slot)
    : [];
  const owner = this.owner?.get?.({ plain: true }) ?? this.owner ?? null;

  return {
    id: plain.id,
    ownerId: plain.ownerId,
    owner: owner
      ? {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
        }
      : null,
    slug: plain.slug,
    title: plain.title,
    tagline: plain.tagline,
    description: plain.description,
    category: plain.category,
    niche: plain.niche,
    deliveryModel: plain.deliveryModel,
    outcomePromise: plain.outcomePromise,
    budget: plain.budget,
    duration: plain.duration,
    location: plain.location,
    geoLocation: plain.geoLocation,
    heroAccent: plain.heroAccent,
    targetMetric: plain.targetMetric == null ? null : Number(plain.targetMetric),
    status: plain.status,
    visibility: plain.visibility,
    bannerSettings: plain.bannerSettings ?? null,
    availabilityTimezone: plain.availabilityTimezone,
    availabilityLeadTimeDays:
      plain.availabilityLeadTimeDays == null ? null : Number(plain.availabilityLeadTimeDays),
    publishedAt: plain.publishedAt,
    archivedAt: plain.archivedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    packages,
    addOns,
    availabilitySlots,
  };
};

export const GigPackage = sequelize.define(
  'GigPackage',
  {
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    packageKey: { type: DataTypes.STRING(80), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priceAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    priceCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    deliveryDays: { type: DataTypes.INTEGER, allowNull: true },
    revisionLimit: { type: DataTypes.INTEGER, allowNull: true },
    highlights: { type: jsonType, allowNull: true },
    recommendedFor: { type: DataTypes.STRING(255), allowNull: true },
    isPopular: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'gig_packages',
    indexes: [
      {
        unique: true,
        fields: ['gigId', 'packageKey'],
      },
    ],
  },
);

GigPackage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const highlights = Array.isArray(plain.highlights)
    ? plain.highlights.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
  return {
    id: plain.id,
    gigId: plain.gigId,
    key: plain.packageKey,
    name: plain.name,
    description: plain.description,
    priceAmount: Number(plain.priceAmount ?? 0),
    priceCurrency: plain.priceCurrency ?? 'USD',
    deliveryDays: plain.deliveryDays == null ? null : Number(plain.deliveryDays),
    revisionLimit: plain.revisionLimit == null ? null : Number(plain.revisionLimit),
    highlights,
    recommendedFor: plain.recommendedFor,
    isPopular: Boolean(plain.isPopular),
    position: plain.position ?? 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigAddOn = sequelize.define(
  'GigAddOn',
  {
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    addOnKey: { type: DataTypes.STRING(80), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priceAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    priceCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'gig_add_ons',
    indexes: [
      {
        unique: true,
        fields: ['gigId', 'addOnKey'],
      },
    ],
  },
);

GigAddOn.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    gigId: plain.gigId,
    key: plain.addOnKey,
    name: plain.name,
    description: plain.description,
    priceAmount: Number(plain.priceAmount ?? 0),
    priceCurrency: plain.priceCurrency ?? 'USD',
    isActive: Boolean(plain.isActive),
    position: plain.position ?? 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigAvailabilitySlot = sequelize.define(
  'GigAvailabilitySlot',
  {
    gigId: { type: DataTypes.INTEGER, allowNull: false },
    slotDate: { type: DataTypes.DATEONLY, allowNull: false },
    startTime: { type: DataTypes.TIME, allowNull: false },
    endTime: { type: DataTypes.TIME, allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    reservedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isBookable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: 'gig_availability_slots',
    indexes: [
      {
        unique: true,
        fields: ['gigId', 'slotDate', 'startTime'],
      },
    ],
  },
);

GigAvailabilitySlot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    gigId: plain.gigId,
    date: plain.slotDate,
    startTime: plain.startTime,
    endTime: plain.endTime,
    capacity: plain.capacity == null ? 1 : Number(plain.capacity),
    reservedCount: plain.reservedCount == null ? 0 : Number(plain.reservedCount),
    isBookable: Boolean(plain.isBookable),
    notes: plain.notes ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const Project = sequelize.define(
  'Project',
export const ClientPortalInsightWidget = sequelize.define(
  'ClientPortalInsightWidget',
  {
    portalId: { type: DataTypes.INTEGER, allowNull: false },
    widgetType: {
      type: DataTypes.ENUM(...CLIENT_PORTAL_INSIGHT_TYPES),
      allowNull: false,
      defaultValue: 'custom',
      validate: { isIn: [CLIENT_PORTAL_INSIGHT_TYPES] },
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    data: { type: jsonType, allowNull: true },
    visibility: {
      type: DataTypes.ENUM(...CLIENT_PORTAL_INSIGHT_VISIBILITIES),
      allowNull: false,
      defaultValue: 'shared',
      validate: { isIn: [CLIENT_PORTAL_INSIGHT_VISIBILITIES] },
    },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'client_portal_insight_widgets' },
);

ClientPortalInsightWidget.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const data = plain.data && typeof plain.data === 'object' ? plain.data : {};

  return {
    id: plain.id,
    portalId: plain.portalId,
    widgetType: plain.widgetType,
    title: plain.title,
    description: plain.description,
    data,
    visibility: plain.visibility,
    orderIndex: plain.orderIndex,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpad = sequelize.define(
  'ExperienceLaunchpad',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    track: { type: DataTypes.STRING(120), allowNull: false },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    programType: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'cohort' },
    status: {
      type: DataTypes.ENUM(...LAUNCHPAD_STATUSES),
      allowNull: false,
      defaultValue: 'recruiting',
      validate: { isIn: [LAUNCHPAD_STATUSES] },
    },
    applicationUrl: { type: DataTypes.STRING(500), allowNull: true },
    mentorLead: { type: DataTypes.STRING(255), allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    eligibilityCriteria: { type: jsonType, allowNull: true },
    employerSponsorship: { type: jsonType, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'experience_launchpads' },
);

ExperienceLaunchpad.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return ExperienceLaunchpad.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

ExperienceLaunchpad.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    track: plain.track,
    location: plain.location,
    geoLocation: plain.geoLocation,
    programType: plain.programType,
    status: plain.status,
    applicationUrl: plain.applicationUrl,
    mentorLead: plain.mentorLead,
    startDate: plain.startDate,
    endDate: plain.endDate,
    capacity: plain.capacity,
    eligibilityCriteria: plain.eligibilityCriteria,
    employerSponsorship: plain.employerSponsorship,
    publishedAt: plain.publishedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpadApplication = sequelize.define(
  'ExperienceLaunchpadApplication',
  {
    launchpadId: { type: DataTypes.INTEGER, allowNull: false },
    applicantId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...LAUNCHPAD_APPLICATION_STATUSES),
      allowNull: false,
      defaultValue: 'screening',
      validate: { isIn: [LAUNCHPAD_APPLICATION_STATUSES] },
    },
    qualificationScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    yearsExperience: { type: DataTypes.DECIMAL(4, 1), allowNull: true },
    skills: { type: jsonType, allowNull: true },
    motivations: { type: DataTypes.TEXT, allowNull: true },
    portfolioUrl: { type: DataTypes.STRING(500), allowNull: true },
    availabilityDate: { type: DataTypes.DATE, allowNull: true },
    eligibilitySnapshot: { type: jsonType, allowNull: true },
    assignedMentor: { type: DataTypes.STRING(255), allowNull: true },
    interviewScheduledAt: { type: DataTypes.DATE, allowNull: true },
    decisionNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'experience_launchpad_applications' },
);

ExperienceLaunchpadApplication.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    launchpadId: plain.launchpadId,
    applicantId: plain.applicantId,
    applicationId: plain.applicationId,
    status: plain.status,
    qualificationScore: plain.qualificationScore == null ? null : Number(plain.qualificationScore),
    yearsExperience: plain.yearsExperience == null ? null : Number(plain.yearsExperience),
    skills: Array.isArray(plain.skills) ? plain.skills : [],
    motivations: plain.motivations,
    portfolioUrl: plain.portfolioUrl,
    availabilityDate: plain.availabilityDate,
    eligibilitySnapshot: plain.eligibilitySnapshot,
    assignedMentor: plain.assignedMentor,
    interviewScheduledAt: plain.interviewScheduledAt,
    decisionNotes: plain.decisionNotes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpadEmployerRequest = sequelize.define(
  'ExperienceLaunchpadEmployerRequest',
  {
    launchpadId: { type: DataTypes.INTEGER, allowNull: false },
    organizationName: { type: DataTypes.STRING(255), allowNull: false },
    contactName: { type: DataTypes.STRING(255), allowNull: false },
    contactEmail: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
    headcount: { type: DataTypes.INTEGER, allowNull: true },
    engagementTypes: { type: jsonType, allowNull: true },
    targetStartDate: { type: DataTypes.DATE, allowNull: true },
    idealCandidateProfile: { type: DataTypes.TEXT, allowNull: true },
    hiringNotes: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...LAUNCHPAD_EMPLOYER_REQUEST_STATUSES),
      allowNull: false,
      defaultValue: 'new',
      validate: { isIn: [LAUNCHPAD_EMPLOYER_REQUEST_STATUSES] },
    },
    slaCommitmentDays: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'experience_launchpad_employer_requests' },
);

ExperienceLaunchpadEmployerRequest.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    launchpadId: plain.launchpadId,
    organizationName: plain.organizationName,
    contactName: plain.contactName,
    contactEmail: plain.contactEmail,
    headcount: plain.headcount == null ? null : Number(plain.headcount),
    engagementTypes: Array.isArray(plain.engagementTypes)
      ? plain.engagementTypes
      : plain.engagementTypes ?? [],
    targetStartDate: plain.targetStartDate,
    idealCandidateProfile: plain.idealCandidateProfile,
    hiringNotes: plain.hiringNotes,
    status: plain.status,
    slaCommitmentDays: plain.slaCommitmentDays,
    createdById: plain.createdById,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpadPlacement = sequelize.define(
  'ExperienceLaunchpadPlacement',
  {
    launchpadId: { type: DataTypes.INTEGER, allowNull: false },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    employerRequestId: { type: DataTypes.INTEGER, allowNull: true },
    targetType: {
      type: DataTypes.ENUM(...LAUNCHPAD_TARGET_TYPES),
      allowNull: true,
      validate: { isIn: [LAUNCHPAD_TARGET_TYPES] },
    },
    targetId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...LAUNCHPAD_PLACEMENT_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [LAUNCHPAD_PLACEMENT_STATUSES] },
    },
    placementDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    compensation: { type: jsonType, allowNull: true },
    feedbackScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
  },
  { tableName: 'experience_launchpad_placements' },
);

ExperienceLaunchpadPlacement.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    launchpadId: plain.launchpadId,
    candidateId: plain.candidateId,
    employerRequestId: plain.employerRequestId,
    targetType: plain.targetType,
    targetId: plain.targetId,
    status: plain.status,
    placementDate: plain.placementDate,
    endDate: plain.endDate,
    compensation: plain.compensation,
    feedbackScore: plain.feedbackScore == null ? null : Number(plain.feedbackScore),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpadOpportunityLink = sequelize.define(
  'ExperienceLaunchpadOpportunityLink',
  {
    launchpadId: { type: DataTypes.INTEGER, allowNull: false },
    targetType: {
      type: DataTypes.ENUM(...LAUNCHPAD_TARGET_TYPES),
      allowNull: false,
      validate: { isIn: [LAUNCHPAD_TARGET_TYPES] },
    },
    targetId: { type: DataTypes.INTEGER, allowNull: false },
    source: {
      type: DataTypes.ENUM(...LAUNCHPAD_OPPORTUNITY_SOURCES),
      allowNull: false,
      defaultValue: 'manual',
      validate: { isIn: [LAUNCHPAD_OPPORTUNITY_SOURCES] },
    },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'experience_launchpad_opportunity_links' },
);

ExperienceLaunchpadOpportunityLink.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    launchpadId: plain.launchpadId,
    targetType: plain.targetType,
    targetId: plain.targetId,
    source: plain.source,
    createdById: plain.createdById,
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const Volunteering = sequelize.define(
  'Volunteering',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    organization: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
  },
  { tableName: 'volunteering_roles' },
);

Volunteering.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return Volunteering.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

export const Group = sequelize.define(
  'Group',
  {
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'groups' },
);

export const GroupMembership = sequelize.define(
  'GroupMembership',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'member' },
  },
  { tableName: 'group_memberships' },
);

export const Connection = sequelize.define(
  'Connection',
  {
    requesterId: { type: DataTypes.INTEGER, allowNull: false },
    addresseeId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
  },
  { tableName: 'connections' },
);

export const TwoFactorToken = sequelize.define(
  'TwoFactorToken',
  {
    email: { type: DataTypes.STRING(255), primaryKey: true },
    code: { type: DataTypes.STRING(6), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: 'two_factor_tokens', timestamps: false },
);

export const Application = sequelize.define(
  'Application',
  {
    applicantId: { type: DataTypes.INTEGER, allowNull: false },
    targetType: {
      type: DataTypes.ENUM(...APPLICATION_TARGET_TYPES),
      allowNull: false,
      validate: { isIn: [APPLICATION_TARGET_TYPES] },
    },
    targetId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...APPLICATION_STATUSES),
      allowNull: false,
      defaultValue: 'submitted',
      validate: { isIn: [APPLICATION_STATUSES] },
    },
    sourceChannel: {
      type: DataTypes.ENUM('web', 'mobile', 'referral', 'agency', 'import'),
      allowNull: false,
      defaultValue: 'web',
    },
    coverLetter: { type: DataTypes.TEXT, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    rateExpectation: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
    availabilityDate: { type: DataTypes.DATEONLY, allowNull: true },
    isArchived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    decisionAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'applications',
    defaultScope: { where: { isArchived: false } },
    scopes: {
      archived: { where: { isArchived: true } },
      byStatus(status) {
        return { where: { status } };
      },
    },
    indexes: [
      { fields: ['applicantId'] },
      { fields: ['targetType', 'targetId'] },
      { fields: ['status'] },
    ],
  },
);

Application.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  let sanitizedMetadata = null;
  if (plain.metadata && typeof plain.metadata === 'object') {
    sanitizedMetadata = Object.fromEntries(
      Object.entries(plain.metadata).filter(([key]) => !/^(_|internal|private)/i.test(key)),
    );
  }

  return {
    id: plain.id,
    applicantId: plain.applicantId,
    targetType: plain.targetType,
    targetId: plain.targetId,
    status: plain.status,
    sourceChannel: plain.sourceChannel,
    coverLetter: plain.coverLetter,
    attachments: plain.attachments,
    rateExpectation: plain.rateExpectation,
    currencyCode: plain.currencyCode,
    availabilityDate: plain.availabilityDate,
    isArchived: plain.isArchived,
    submittedAt: plain.submittedAt,
    decisionAt: plain.decisionAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    metadata: sanitizedMetadata,
  };
};

Application.paginate = async function paginate({
  where = {},
  include = [],
  order = [['updatedAt', 'DESC']],
  page = 1,
  pageSize = 25,
}) {
  const limit = Math.min(Math.max(pageSize, 1), 100);
  const offset = (Math.max(page, 1) - 1) * limit;
  const { rows, count } = await Application.findAndCountAll({ where, include, order, limit, offset });
  return {
    results: rows,
    total: count,
    page: Math.max(page, 1),
    pageSize: limit,
    totalPages: Math.ceil(count / limit) || 1,
  };
};

export const ApplicationReview = sequelize.define(
  'ApplicationReview',
  {
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    reviewerId: { type: DataTypes.INTEGER, allowNull: true },
    stage: {
      type: DataTypes.ENUM(...APPLICATION_REVIEW_STAGES),
      allowNull: false,
      validate: { isIn: [APPLICATION_REVIEW_STAGES] },
    },
    decision: {
      type: DataTypes.ENUM(...APPLICATION_REVIEW_DECISIONS),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [APPLICATION_REVIEW_DECISIONS] },
    },
    score: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 100 } },
    notes: { type: DataTypes.TEXT, allowNull: true },
    decidedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'application_reviews',
    indexes: [
      { fields: ['applicationId'] },
      { fields: ['reviewerId'] },
      { fields: ['stage'] },
    ],
  },
);

ApplicationReview.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const HiringAlert = sequelize.define(
  'HiringAlert',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: false },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('open', 'acknowledged', 'resolved'),
      allowNull: false,
      defaultValue: 'open',
    },
    message: { type: DataTypes.TEXT, allowNull: false },
    detectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'hiring_alerts',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['severity'] },
      { fields: ['status'] },
    ],
  },
);

export const CandidateDemographicSnapshot = sequelize.define(
  'CandidateDemographicSnapshot',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    genderIdentity: { type: DataTypes.STRING(120), allowNull: true },
    ethnicity: { type: DataTypes.STRING(180), allowNull: true },
    veteranStatus: { type: DataTypes.STRING(120), allowNull: true },
    disabilityStatus: { type: DataTypes.STRING(120), allowNull: true },
    seniorityLevel: { type: DataTypes.STRING(120), allowNull: true },
    locationRegion: { type: DataTypes.STRING(180), allowNull: true },
    capturedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'candidate_demographic_snapshots',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['applicationId'] },
      { fields: ['capturedAt'] },
    ],
  },
);

export const CandidateSatisfactionSurvey = sequelize.define(
  'CandidateSatisfactionSurvey',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    stage: { type: DataTypes.STRING(80), allowNull: true },
    score: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 10 } },
    npsRating: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 10 } },
    sentiment: { type: DataTypes.STRING(40), allowNull: true },
    followUpScheduledAt: { type: DataTypes.DATE, allowNull: true },
    responseAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'candidate_satisfaction_surveys',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['applicationId'] },
      { fields: ['responseAt'] },
    ],
  },
);

export const InterviewSchedule = sequelize.define(
  'InterviewSchedule',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    interviewStage: { type: DataTypes.STRING(120), allowNull: false },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    rescheduleCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    interviewerRoster: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'interview_schedules',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['applicationId'] },
      { fields: ['scheduledAt'] },
    ],
  },
);

export const JobStage = sequelize.define(
  'JobStage',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    slaHours: { type: DataTypes.INTEGER, allowNull: true },
    averageDurationHours: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    guideUrl: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'job_stages',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['jobId'] },
      { fields: ['orderIndex'] },
    ],
  },
);

export const JobApprovalWorkflow = sequelize.define(
  'JobApprovalWorkflow',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: true },
    approverRole: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'in_review', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'job_approval_workflows',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['jobId'] },
      { fields: ['status'] },
    ],
  },
);

export const JobCampaignPerformance = sequelize.define(
  'JobCampaignPerformance',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: true },
    channel: { type: DataTypes.STRING(120), allowNull: false },
    impressions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    clicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    applications: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    hires: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    spendAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    reportingDate: { type: DataTypes.DATEONLY, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'job_campaign_performances',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['jobId'] },
      { fields: ['channel'] },
      { fields: ['reportingDate'] },
    ],
  },
);

export const PartnerEngagement = sequelize.define(
  'PartnerEngagement',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    partnerType: { type: DataTypes.STRING(120), allowNull: false },
    partnerName: { type: DataTypes.STRING(255), allowNull: false },
    touchpoints: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastInteractionAt: { type: DataTypes.DATE, allowNull: true },
    activeBriefs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    conversionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'partner_engagements',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['partnerType'] },
      { fields: ['partnerName'] },
    ],
  },
);

export const RecruitingCalendarEvent = sequelize.define(
  'RecruitingCalendarEvent',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    eventType: { type: DataTypes.STRING(120), allowNull: false },
    startsAt: { type: DataTypes.DATE, allowNull: false },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'recruiting_calendar_events',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['eventType'] },
      { fields: ['startsAt'] },
    ],
  },
);

export const EmployerBrandAsset = sequelize.define(
  'EmployerBrandAsset',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    assetType: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM('draft', 'review', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    url: { type: DataTypes.STRING(500), allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    engagementScore: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'employer_brand_assets',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['assetType'] },
      { fields: ['status'] },
    ],
  },
);

export const MessageThread = sequelize.define(
  'MessageThread',
  {
    subject: { type: DataTypes.STRING(255), allowNull: true },
    channelType: {
      type: DataTypes.ENUM(...MESSAGE_CHANNEL_TYPES),
      allowNull: false,
      defaultValue: 'direct',
    },
    state: {
      type: DataTypes.ENUM(...MESSAGE_THREAD_STATES),
      allowNull: false,
      defaultValue: 'active',
    },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'message_threads',
    scopes: {
      active: { where: { state: 'active' } },
    },
  },
);

export const MessageParticipant = sequelize.define(
  'MessageParticipant',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: {
      type: DataTypes.ENUM('owner', 'participant', 'support', 'system'),
      allowNull: false,
      defaultValue: 'participant',
    },
    notificationsEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    mutedUntil: { type: DataTypes.DATE, allowNull: true },
    lastReadAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'message_participants',
    indexes: [
      { unique: true, fields: ['threadId', 'userId'] },
      { fields: ['userId'] },
    ],
  },
);

export const Message = sequelize.define(
  'Message',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: true },
    messageType: {
      type: DataTypes.ENUM(...MESSAGE_TYPES),
      allowNull: false,
      defaultValue: 'text',
    },
    body: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    isEdited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    editedAt: { type: DataTypes.DATE, allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'messages',
    paranoid: true,
    deletedAt: 'deletedAt',
    indexes: [
      { fields: ['threadId'] },
      { fields: ['senderId'] },
      { fields: ['createdAt'] },
    ],
  },
);

export const MessageAttachment = sequelize.define(
  'MessageAttachment',
  {
    messageId: { type: DataTypes.INTEGER, allowNull: false },
    storageKey: { type: DataTypes.STRING(512), allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    mimeType: { type: DataTypes.STRING(128), allowNull: false },
    fileSize: { type: DataTypes.BIGINT, allowNull: false },
    checksum: { type: DataTypes.STRING(128), allowNull: true },
  },
  {
    tableName: 'message_attachments',
    indexes: [{ fields: ['messageId'] }],
  },
);

Message.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  let sanitizedMetadata = null;
  if (plain.metadata && typeof plain.metadata === 'object') {
    sanitizedMetadata = Object.fromEntries(
      Object.entries(plain.metadata).filter(([key]) => !/^(_|internal|private)/i.test(key)),
    );
  }
  return {
    id: plain.id,
    threadId: plain.threadId,
    senderId: plain.senderId,
    messageType: plain.messageType,
    body: plain.body,
    isEdited: plain.isEdited,
    editedAt: plain.editedAt,
    deliveredAt: plain.deliveredAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    metadata: sanitizedMetadata,
  };
};

export const SupportCase = sequelize.define(
  'SupportCase',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...SUPPORT_CASE_STATUSES),
      allowNull: false,
      defaultValue: 'triage',
    },
    priority: {
      type: DataTypes.ENUM(...SUPPORT_CASE_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
    },
    reason: { type: DataTypes.TEXT, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
    escalatedBy: { type: DataTypes.INTEGER, allowNull: false },
    escalatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    assignedTo: { type: DataTypes.INTEGER, allowNull: true },
    assignedBy: { type: DataTypes.INTEGER, allowNull: true },
    assignedAt: { type: DataTypes.DATE, allowNull: true },
    firstResponseAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedBy: { type: DataTypes.INTEGER, allowNull: true },
    resolutionSummary: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'support_cases',
    indexes: [
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['assignedTo'] },
    ],
  },
);

export const SupportPlaybook = sequelize.define(
  'SupportPlaybook',
  {
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    stage: {
      type: DataTypes.ENUM(...SUPPORT_PLAYBOOK_STAGES),
      allowNull: false,
      defaultValue: 'intake',
    },
    persona: {
      type: DataTypes.ENUM(...SUPPORT_PLAYBOOK_PERSONAS),
      allowNull: false,
      defaultValue: 'support_team',
    },
    channel: {
      type: DataTypes.ENUM(...SUPPORT_PLAYBOOK_CHANNELS),
      allowNull: false,
      defaultValue: 'inbox',
    },
    csatImpact: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'support_playbooks' },
);

SupportPlaybook.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const SupportPlaybookStep = sequelize.define(
  'SupportPlaybookStep',
  {
    playbookId: { type: DataTypes.INTEGER, allowNull: false },
    stepNumber: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    instructions: { type: DataTypes.TEXT, allowNull: false },
    ownerRole: { type: DataTypes.STRING(120), allowNull: true },
    expectedDurationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    requiresApproval: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'support_playbook_steps',
    indexes: [
      { fields: ['playbookId'] },
      { fields: ['stepNumber'] },
    ],
  },
);

SupportPlaybookStep.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const SupportCasePlaybook = sequelize.define(
  'SupportCasePlaybook',
  {
    supportCaseId: { type: DataTypes.INTEGER, allowNull: false },
    playbookId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...SUPPORT_CASE_PLAYBOOK_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'support_case_playbooks',
    indexes: [
      { fields: ['supportCaseId'] },
      { fields: ['playbookId'] },
    ],
  },
);

SupportCasePlaybook.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const SupportCaseLink = sequelize.define(
  'SupportCaseLink',
  {
    supportCaseId: { type: DataTypes.INTEGER, allowNull: false },
    linkType: {
      type: DataTypes.ENUM(...SUPPORT_CASE_LINK_TYPES),
      allowNull: false,
      defaultValue: 'gig_order',
    },
    reference: { type: DataTypes.STRING(180), allowNull: true },
    gigId: { type: DataTypes.INTEGER, allowNull: true },
    gigTitle: { type: DataTypes.STRING(255), allowNull: true },
    clientName: { type: DataTypes.STRING(255), allowNull: true },
    escrowTransactionId: { type: DataTypes.INTEGER, allowNull: true },
    orderAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'support_case_links',
    indexes: [
      { fields: ['supportCaseId'] },
      { fields: ['escrowTransactionId'] },
    ],
  },
);

SupportCaseLink.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const rawAmount = plain.orderAmount;
  return {
    ...plain,
    orderAmount:
      rawAmount == null
        ? null
        : Number.parseFloat(typeof rawAmount === 'number' ? rawAmount : String(rawAmount)),
  };
};

export const SupportCaseSatisfaction = sequelize.define(
  'SupportCaseSatisfaction',
  {
    supportCaseId: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
    submittedBy: { type: DataTypes.INTEGER, allowNull: true },
    submittedByType: {
      type: DataTypes.ENUM(...SUPPORT_CASE_SATISFACTION_SUBMITTER_TYPES),
      allowNull: false,
      defaultValue: 'client',
    },
    capturedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'support_case_satisfactions',
    indexes: [
      { fields: ['supportCaseId'] },
      { fields: ['submittedByType'] },
    ],
  },
);

SupportCaseSatisfaction.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    score: plain.score == null ? null : Number(plain.score),
  };
};

export const SupportKnowledgeArticle = sequelize.define(
  'SupportKnowledgeArticle',
  {
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    category: {
      type: DataTypes.ENUM(...SUPPORT_KNOWLEDGE_CATEGORIES),
      allowNull: false,
      defaultValue: 'workflow',
    },
    audience: {
      type: DataTypes.ENUM(...SUPPORT_KNOWLEDGE_AUDIENCES),
      allowNull: false,
      defaultValue: 'freelancer',
    },
    tags: { type: jsonType, allowNull: true },
    resourceLinks: { type: jsonType, allowNull: true },
    lastReviewedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'support_knowledge_articles',
    indexes: [
      { fields: ['category'] },
      { fields: ['audience'] },
    ],
  },
);

SupportKnowledgeArticle.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const CareerAnalyticsSnapshot = sequelize.define(
  'CareerAnalyticsSnapshot',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    timeframeStart: { type: DataTypes.DATEONLY, allowNull: false },
    timeframeEnd: { type: DataTypes.DATEONLY, allowNull: false },
    outreachConversionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    interviewMomentum: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    offerWinRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    salaryMedian: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    salaryCurrency: { type: DataTypes.STRING(3), allowNull: true },
    salaryTrend: {
      type: DataTypes.ENUM(...CAREER_ANALYTICS_TREND_DIRECTIONS),
      allowNull: false,
      defaultValue: 'flat',
    },
    diversityRepresentation: { type: jsonType, allowNull: true },
    funnelBreakdown: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_analytics_snapshots',
    indexes: [
      { fields: ['userId'] },
      { fields: ['timeframeEnd'] },
    ],
  },
);

CareerAnalyticsSnapshot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const parseDecimal = (value) =>
    value == null ? null : Number.parseFloat(typeof value === 'number' ? value : String(value));

  return {
    ...plain,
    outreachConversionRate: parseDecimal(plain.outreachConversionRate),
    interviewMomentum: parseDecimal(plain.interviewMomentum),
    offerWinRate: parseDecimal(plain.offerWinRate),
    salaryMedian: parseDecimal(plain.salaryMedian),
    metadata: plain.metadata ?? null,
    diversityRepresentation: plain.diversityRepresentation ?? null,
    funnelBreakdown: plain.funnelBreakdown ?? null,
  };
};

export const CareerPeerBenchmark = sequelize.define(
  'CareerPeerBenchmark',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    cohortKey: { type: DataTypes.STRING(120), allowNull: false },
    metric: { type: DataTypes.STRING(120), allowNull: false },
    value: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    percentile: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    sampleSize: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    capturedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'career_peer_benchmarks',
    indexes: [
      { fields: ['userId'] },
      { fields: ['cohortKey'] },
      { fields: ['metric'] },
    ],
  },
);

CareerPeerBenchmark.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const parseDecimal = (value) =>
    value == null ? null : Number.parseFloat(typeof value === 'number' ? value : String(value));

  return {
    ...plain,
    value: parseDecimal(plain.value),
    percentile: parseDecimal(plain.percentile),
    metadata: plain.metadata ?? null,
  };
};

export const WeeklyDigestSubscription = sequelize.define(
  'WeeklyDigestSubscription',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    frequency: {
      type: DataTypes.ENUM(...DIGEST_FREQUENCIES),
      allowNull: false,
      defaultValue: 'weekly',
    },
    channels: { type: jsonType, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastSentAt: { type: DataTypes.DATE, allowNull: true },
    nextScheduledAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'weekly_digest_subscriptions',
  },
);

WeeklyDigestSubscription.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    channels: Array.isArray(plain.channels) ? plain.channels : [],
    metadata: plain.metadata ?? null,
  };
};

export const CalendarIntegration = sequelize.define(
  'CalendarIntegration',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    provider: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    externalAccount: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM(...CALENDAR_INTEGRATION_STATUSES),
      allowNull: false,
      defaultValue: 'connected',
    },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    syncError: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'calendar_integrations',
    indexes: [
      { fields: ['userId'] },
      { fields: ['provider'] },
    ],
  },
);

CalendarIntegration.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    metadata: plain.metadata ?? null,
  };
};

export const CandidateCalendarEvent = sequelize.define(
  'CandidateCalendarEvent',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    eventType: {
      type: DataTypes.ENUM(...CALENDAR_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'interview',
    },
    source: {
      type: DataTypes.ENUM(...CALENDAR_EVENT_SOURCES),
      allowNull: false,
      defaultValue: 'manual',
    },
    startsAt: { type: DataTypes.DATE, allowNull: false },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    isFocusBlock: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    focusMode: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'candidate_calendar_events',
    indexes: [
      { fields: ['userId'] },
      { fields: ['startsAt'] },
      { fields: ['eventType'] },
    ],
  },
);

CandidateCalendarEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    metadata: plain.metadata ?? null,
  };
};

export const FocusSession = sequelize.define(
  'FocusSession',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    focusType: {
      type: DataTypes.ENUM(...FOCUS_SESSION_TYPES),
      allowNull: false,
      defaultValue: 'deep_work',
    },
    startedAt: { type: DataTypes.DATE, allowNull: false },
    endedAt: { type: DataTypes.DATE, allowNull: true },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'focus_sessions',
    indexes: [
      { fields: ['userId'] },
      { fields: ['focusType'] },
    ],
  },
);

FocusSession.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    durationMinutes:
      plain.durationMinutes == null
        ? null
        : Number.parseInt(typeof plain.durationMinutes === 'number' ? plain.durationMinutes : String(plain.durationMinutes), 10),
    metadata: plain.metadata ?? null,
  };
};

export const AdvisorCollaboration = sequelize.define(
  'AdvisorCollaboration',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...ADVISOR_COLLABORATION_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    defaultPermissions: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'advisor_collaborations',
    indexes: [
      { fields: ['ownerId'] },
      { fields: ['status'] },
    ],
  },
);

AdvisorCollaboration.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    defaultPermissions: plain.defaultPermissions ?? null,
  };
};

export const AdvisorCollaborationMember = sequelize.define(
  'AdvisorCollaborationMember',
  {
    collaborationId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    role: {
      type: DataTypes.ENUM(...ADVISOR_COLLABORATION_MEMBER_ROLES),
      allowNull: false,
      defaultValue: 'mentor',
    },
    permissions: { type: jsonType, allowNull: true },
    status: {
      type: DataTypes.ENUM(...ADVISOR_COLLABORATION_MEMBER_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
    },
    invitedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    joinedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'advisor_collaboration_members',
    indexes: [
      { fields: ['collaborationId'] },
      { fields: ['userId'] },
      { fields: ['status'] },
    ],
  },
);

AdvisorCollaborationMember.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    permissions: plain.permissions ?? null,
  };
};

export const AdvisorCollaborationAuditLog = sequelize.define(
  'AdvisorCollaborationAuditLog',
  {
    collaborationId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING(255), allowNull: false },
    scope: { type: DataTypes.STRING(120), allowNull: true },
    details: { type: jsonType, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'advisor_collaboration_audit_logs',
    updatedAt: false,
    indexes: [
      { fields: ['collaborationId'] },
      { fields: ['createdAt'] },
    ],
  },
);

AdvisorCollaborationAuditLog.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    details: plain.details ?? null,
  };
};

export const AdvisorDocumentRoom = sequelize.define(
  'AdvisorDocumentRoom',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    collaborationId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...DOCUMENT_ROOM_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    sharedWith: { type: jsonType, allowNull: true },
    storageUsedMb: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    lastAccessedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'advisor_document_rooms',
    indexes: [
      { fields: ['ownerId'] },
      { fields: ['collaborationId'] },
      { fields: ['status'] },
    ],
  },
);

AdvisorDocumentRoom.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const parseDecimal = (value) =>
    value == null ? null : Number.parseFloat(typeof value === 'number' ? value : String(value));
  return {
    ...plain,
    sharedWith: Array.isArray(plain.sharedWith) ? plain.sharedWith : [],
    storageUsedMb: parseDecimal(plain.storageUsedMb),
    metadata: plain.metadata ?? null,
  };
};

export const SupportAutomationLog = sequelize.define(
  'SupportAutomationLog',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    source: { type: DataTypes.STRING(120), allowNull: false },
    action: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...SUPPORT_AUTOMATION_STATUSES),
      allowNull: false,
      defaultValue: 'queued',
    },
    triggeredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'support_automation_logs',
    indexes: [
      { fields: ['userId'] },
      { fields: ['source'] },
      { fields: ['status'] },
    ],
  },
);

SupportAutomationLog.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    metadata: plain.metadata ?? null,
  };
};

export const Notification = sequelize.define(
  'Notification',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    category: {
      type: DataTypes.ENUM(...NOTIFICATION_CATEGORIES),
      allowNull: false,
      defaultValue: 'system',
    },
    type: { type: DataTypes.STRING(128), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    payload: { type: jsonType, allowNull: true },
    priority: {
      type: DataTypes.ENUM(...NOTIFICATION_PRIORITIES),
      allowNull: false,
      defaultValue: 'normal',
    },
    status: {
      type: DataTypes.ENUM(...NOTIFICATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'notifications',
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['category'] },
    ],
  },
);

Notification.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  let sanitizedPayload = null;
  if (plain.payload && typeof plain.payload === 'object') {
    sanitizedPayload = Object.fromEntries(
      Object.entries(plain.payload).filter(([key]) => !/^(_|internal|private)/i.test(key)),
    );
  }
  return {
    id: plain.id,
    userId: plain.userId,
    category: plain.category,
    type: plain.type,
    title: plain.title,
    body: plain.body,
    priority: plain.priority,
    status: plain.status,
    deliveredAt: plain.deliveredAt,
    readAt: plain.readAt,
    expiresAt: plain.expiresAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    payload: sanitizedPayload,
  };
};

export const NotificationPreference = sequelize.define(
  'NotificationPreference',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    emailEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    pushEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    smsEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    inAppEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    digestFrequency: {
      type: DataTypes.ENUM(...DIGEST_FREQUENCIES),
      allowNull: false,
      defaultValue: 'immediate',
    },
    quietHoursStart: { type: DataTypes.TIME, allowNull: true },
    quietHoursEnd: { type: DataTypes.TIME, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'notification_preferences' },
);

export const AnalyticsEvent = sequelize.define(
  'AnalyticsEvent',
  {
    eventName: { type: DataTypes.STRING(128), allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    actorType: {
      type: DataTypes.ENUM(...ANALYTICS_ACTOR_TYPES),
      allowNull: false,
      defaultValue: 'user',
    },
    entityType: { type: DataTypes.STRING(64), allowNull: true },
    entityId: { type: DataTypes.INTEGER, allowNull: true },
    source: { type: DataTypes.STRING(64), allowNull: true },
    context: { type: jsonType, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    ingestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'analytics_events',
    timestamps: false,
    indexes: [
      { fields: ['eventName'] },
      { fields: ['occurredAt'] },
      { fields: ['entityType', 'entityId'] },
    ],
  },
);

export const AnalyticsDailyRollup = sequelize.define(
  'AnalyticsDailyRollup',
  {
    metricKey: { type: DataTypes.STRING(128), allowNull: false },
    dimensionHash: { type: DataTypes.STRING(64), allowNull: false },
    dimensions: { type: jsonType, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    value: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
  },
  {
    tableName: 'analytics_daily_rollups',
    indexes: [{ unique: true, fields: ['metricKey', 'date', 'dimensionHash'] }],
  },
);

export const ProviderWorkspace = sequelize.define(
  'ProviderWorkspace',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    type: {
      type: DataTypes.ENUM(...PROVIDER_WORKSPACE_TYPES),
      allowNull: false,
      defaultValue: 'agency',
    },
    timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'UTC' },
    defaultCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    intakeEmail: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    settings: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'provider_workspaces',
    indexes: [
      { fields: ['type'] },
      { fields: ['ownerId'] },
    ],
  },
);

export const ProviderWorkspaceMember = sequelize.define(
  'ProviderWorkspaceMember',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: {
      type: DataTypes.ENUM(...PROVIDER_WORKSPACE_MEMBER_ROLES),
      allowNull: false,
      defaultValue: 'staff',
    },
    status: {
      type: DataTypes.ENUM(...PROVIDER_WORKSPACE_MEMBER_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    invitedById: { type: DataTypes.INTEGER, allowNull: true },
    joinedAt: { type: DataTypes.DATE, allowNull: true },
    lastActiveAt: { type: DataTypes.DATE, allowNull: true },
    removedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'provider_workspace_members',
    indexes: [
      { unique: true, fields: ['workspaceId', 'userId'] },
      { fields: ['workspaceId'] },
      { fields: ['status'] },
    ],
  },
);

export const ProviderWorkspaceInvite = sequelize.define(
  'ProviderWorkspaceInvite',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
    role: {
      type: DataTypes.ENUM(...PROVIDER_WORKSPACE_MEMBER_ROLES),
      allowNull: false,
      defaultValue: 'staff',
    },
    status: {
      type: DataTypes.ENUM(...PROVIDER_WORKSPACE_INVITE_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    inviteToken: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    invitedById: { type: DataTypes.INTEGER, allowNull: false },
    acceptedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'provider_workspace_invites',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
    ],
  },
);

export const ProviderContactNote = sequelize.define(
  'ProviderContactNote',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    subjectUserId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: false },
    visibility: {
      type: DataTypes.ENUM(...PROVIDER_CONTACT_NOTE_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
    },
  },
  {
    tableName: 'provider_contact_notes',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['subjectUserId'] },
    ],
  },
);

ProviderContactNote.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const AgencyCollaboration = sequelize.define(
  'AgencyCollaboration',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    agencyWorkspaceId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...AGENCY_COLLABORATION_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
    },
    collaborationType: {
      type: DataTypes.ENUM(...AGENCY_COLLABORATION_TYPES),
      allowNull: false,
      defaultValue: 'retainer',
    },
    retainerAmountMonthly: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    renewalDate: { type: DataTypes.DATE, allowNull: true },
    healthScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    satisfactionScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    sharedDeliverySnapshot: { type: jsonType, allowNull: true },
    sharedResourcePlan: { type: jsonType, allowNull: true },
    sharedDeliverablesDue: { type: jsonType, allowNull: true },
    activeBriefsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    atRiskDeliverablesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    forecastedUpsellValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    forecastedUpsellCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    lastActivityAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'agency_collaborations',
    indexes: [
      { fields: ['freelancerId'] },
      { fields: ['agencyWorkspaceId'] },
      { fields: ['status'] },
    ],
  },
);

AgencyCollaboration.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    retainerAmountMonthly: plain.retainerAmountMonthly != null ? Number.parseFloat(plain.retainerAmountMonthly) : null,
    healthScore: plain.healthScore != null ? Number.parseFloat(plain.healthScore) : null,
    satisfactionScore: plain.satisfactionScore != null ? Number.parseFloat(plain.satisfactionScore) : null,
    forecastedUpsellValue: plain.forecastedUpsellValue != null ? Number.parseFloat(plain.forecastedUpsellValue) : null,
  };
};

export const AgencyCollaborationInvitation = sequelize.define(
  'AgencyCollaborationInvitation',
  {
    collaborationId: { type: DataTypes.INTEGER, allowNull: true },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    agencyWorkspaceId: { type: DataTypes.INTEGER, allowNull: false },
    sentById: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...AGENCY_INVITATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    roleTitle: { type: DataTypes.STRING(255), allowNull: true },
    engagementType: {
      type: DataTypes.ENUM(...AGENCY_COLLABORATION_TYPES),
      allowNull: false,
      defaultValue: 'retainer',
    },
    proposedRetainer: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    responseDueAt: { type: DataTypes.DATE, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_collaboration_invitations',
    indexes: [
      { fields: ['freelancerId'] },
      { fields: ['agencyWorkspaceId'] },
      { fields: ['status'] },
    ],
  },
);

AgencyCollaborationInvitation.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    proposedRetainer: plain.proposedRetainer != null ? Number.parseFloat(plain.proposedRetainer) : null,
  };
};

export const AgencyRateCard = sequelize.define(
  'AgencyRateCard',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    agencyWorkspaceId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...AGENCY_RATE_CARD_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    effectiveFrom: { type: DataTypes.DATE, allowNull: true },
    effectiveTo: { type: DataTypes.DATE, allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    defaultTerms: { type: jsonType, allowNull: true },
    shareHistory: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_rate_cards',
    indexes: [
      { fields: ['freelancerId'] },
      { fields: ['status'] },
    ],
  },
);

AgencyRateCard.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const AgencyRateCardItem = sequelize.define(
  'AgencyRateCardItem',
  {
    rateCardId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    unitType: {
      type: DataTypes.ENUM(...AGENCY_RATE_CARD_ITEM_UNIT_TYPES),
      allowNull: false,
      defaultValue: 'hour',
    },
    unitAmount: { type: DataTypes.INTEGER, allowNull: true },
    unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    leadTimeDays: { type: DataTypes.INTEGER, allowNull: true },
    minCommitment: { type: DataTypes.INTEGER, allowNull: true },
export const WorkspaceTemplateCategory = sequelize.define(
  'WorkspaceTemplateCategory',
  {
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    icon: { type: DataTypes.STRING(120), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'workspace_template_categories',
    indexes: [{ fields: ['sortOrder'] }],
  },
);

export const WorkspaceTemplate = sequelize.define(
  'WorkspaceTemplate',
  {
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
    slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    industry: { type: DataTypes.STRING(120), allowNull: true },
    workflowType: { type: DataTypes.STRING(120), allowNull: true },
    recommendedTeamSize: { type: DataTypes.STRING(60), allowNull: true },
    estimatedDurationDays: { type: DataTypes.INTEGER, allowNull: true },
    automationLevel: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    qualityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_TEMPLATE_STATUSES),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [WORKSPACE_TEMPLATE_STATUSES] },
    },
    visibility: {
      type: DataTypes.ENUM(...WORKSPACE_TEMPLATE_VISIBILITIES),
      allowNull: false,
      defaultValue: 'public',
      validate: { isIn: [WORKSPACE_TEMPLATE_VISIBILITIES] },
    },
    clientExperience: { type: DataTypes.TEXT, allowNull: true },
    requirementChecklist: { type: jsonType, allowNull: true },
    onboardingSequence: { type: jsonType, allowNull: true },
    deliverables: { type: jsonType, allowNull: true },
    metrics: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    lastPublishedAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'workspace_templates',
    indexes: [
      { fields: ['categoryId', 'status'] },
      { fields: ['slug'], unique: true },
      { fields: ['industry'] },
    ],
  },
);

export const WorkspaceTemplateStage = sequelize.define(
  'WorkspaceTemplateStage',
  {
    templateId: { type: DataTypes.INTEGER, allowNull: false },
    slug: { type: DataTypes.STRING(150), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    stageType: {
      type: DataTypes.ENUM(...WORKSPACE_TEMPLATE_STAGE_TYPES),
      allowNull: false,
      defaultValue: 'production',
      validate: { isIn: [WORKSPACE_TEMPLATE_STAGE_TYPES] },
    },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    description: { type: DataTypes.TEXT, allowNull: true },
    checklists: { type: jsonType, allowNull: true },
    questionnaires: { type: jsonType, allowNull: true },
    automations: { type: jsonType, allowNull: true },
    deliverables: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_template_stages',
    indexes: [{ fields: ['templateId', 'sortOrder'] }],
  },
);

export const WorkspaceTemplateResource = sequelize.define(
  'WorkspaceTemplateResource',
  {
    templateId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    resourceType: {
      type: DataTypes.ENUM(...WORKSPACE_TEMPLATE_RESOURCE_TYPES),
      allowNull: false,
      defaultValue: 'asset',
      validate: { isIn: [WORKSPACE_TEMPLATE_RESOURCE_TYPES] },
    },
    url: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'agency_rate_card_items',
    indexes: [
      { fields: ['rateCardId'] },
    ],
  },
);

AgencyRateCardItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    unitPrice: Number.parseFloat(plain.unitPrice ?? 0),
  };
};

export const AgencyRetainerNegotiation = sequelize.define(
  'AgencyRetainerNegotiation',
  {
    collaborationId: { type: DataTypes.INTEGER, allowNull: true },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    agencyWorkspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...AGENCY_RETAINER_NEGOTIATION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    stage: {
      type: DataTypes.ENUM(...AGENCY_RETAINER_NEGOTIATION_STAGES),
      allowNull: false,
      defaultValue: 'qualification',
    },
    confidence: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    proposedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    targetStartDate: { type: DataTypes.DATE, allowNull: true },
    nextStep: { type: DataTypes.STRING(255), allowNull: true },
    nextStepDueAt: { type: DataTypes.DATE, allowNull: true },
    lastAgencyMessageAt: { type: DataTypes.DATE, allowNull: true },
    lastFreelancerMessageAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'agency_retainer_negotiations',
    indexes: [
      { fields: ['freelancerId'] },
      { fields: ['agencyWorkspaceId'] },
      { fields: ['status'] },
    ],
  },
);

AgencyRetainerNegotiation.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    confidence: plain.confidence != null ? Number.parseFloat(plain.confidence) : null,
    proposedAmount: plain.proposedAmount != null ? Number.parseFloat(plain.proposedAmount) : null,
  };
};

export const AgencyRetainerEvent = sequelize.define(
  'AgencyRetainerEvent',
  {
    negotiationId: { type: DataTypes.INTEGER, allowNull: false },
    actorType: {
      type: DataTypes.ENUM(...AGENCY_RETAINER_EVENT_ACTOR_TYPES),
      allowNull: false,
      defaultValue: 'freelancer',
    },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    eventType: {
      type: DataTypes.ENUM(...AGENCY_RETAINER_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'note',
    },
    summary: { type: DataTypes.STRING(255), allowNull: false },
    payload: { type: jsonType, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: 'agency_retainer_events',
    indexes: [
      { fields: ['negotiationId'] },
      { fields: ['occurredAt'] },
    ],
  },
);

AgencyRetainerEvent.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
    tableName: 'workspace_template_resources',
    indexes: [{ fields: ['templateId', 'resourceType'] }],
  },
);

WorkspaceTemplate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    slug: plain.slug,
    name: plain.name,
    tagline: plain.tagline ?? null,
    description: plain.description ?? null,
    industry: plain.industry ?? null,
    workflowType: plain.workflowType ?? null,
    recommendedTeamSize: plain.recommendedTeamSize ?? null,
    estimatedDurationDays: plain.estimatedDurationDays ?? null,
    automationLevel: Number.isFinite(Number(plain.automationLevel)) ? Number(plain.automationLevel) : 0,
    qualityScore: plain.qualityScore != null ? Number(plain.qualityScore) : null,
    status: plain.status,
    visibility: plain.visibility,
    clientExperience: plain.clientExperience ?? null,
    requirementChecklist: Array.isArray(plain.requirementChecklist) ? plain.requirementChecklist : [],
    onboardingSequence: Array.isArray(plain.onboardingSequence) ? plain.onboardingSequence : [],
    deliverables: Array.isArray(plain.deliverables) ? plain.deliverables : [],
    metrics: Array.isArray(plain.metrics) ? plain.metrics : [],
    metadata: plain.metadata ?? {},
    lastPublishedAt: plain.lastPublishedAt ?? null,
    archivedAt: plain.archivedAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

WorkspaceTemplateStage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    slug: plain.slug,
    title: plain.title,
    stageType: plain.stageType,
    sortOrder: plain.sortOrder,
    description: plain.description ?? null,
    checklists: Array.isArray(plain.checklists) ? plain.checklists : [],
    questionnaires: Array.isArray(plain.questionnaires) ? plain.questionnaires : [],
    automations: Array.isArray(plain.automations) ? plain.automations : [],
    deliverables: Array.isArray(plain.deliverables) ? plain.deliverables : [],
  };
};

WorkspaceTemplateResource.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    title: plain.title,
    resourceType: plain.resourceType,
    url: plain.url ?? null,
    description: plain.description ?? null,
    metadata: plain.metadata ?? {},
    sortOrder: plain.sortOrder ?? 0,
  };
};

export const EscrowAccount = sequelize.define(
  'EscrowAccount',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    provider: { type: DataTypes.STRING(80), allowNull: false },
    externalId: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...ESCROW_ACCOUNT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    currentBalance: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    pendingReleaseTotal: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
    lastReconciledAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'escrow_accounts',
    indexes: [
      { fields: ['userId'] },
      { fields: ['provider'] },
      { fields: ['status'] },
    ],
  },
);

EscrowAccount.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    provider: plain.provider,
    externalId: plain.externalId,
    status: plain.status,
    currencyCode: plain.currencyCode,
    currentBalance: Number.parseFloat(plain.currentBalance ?? 0),
    pendingReleaseTotal: Number.parseFloat(plain.pendingReleaseTotal ?? 0),
    lastReconciledAt: plain.lastReconciledAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const EscrowTransaction = sequelize.define(
  'EscrowTransaction',
  {
    accountId: { type: DataTypes.INTEGER, allowNull: false },
    reference: { type: DataTypes.STRING(120), allowNull: false },
    externalId: { type: DataTypes.STRING(120), allowNull: true },
    type: {
      type: DataTypes.ENUM(...ESCROW_TRANSACTION_TYPES),
      allowNull: false,
      defaultValue: 'project',
    },
    status: {
      type: DataTypes.ENUM(...ESCROW_TRANSACTION_STATUSES),
      allowNull: false,
      defaultValue: 'initiated',
    },
    amount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      validate: { min: 0 },
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    feeAmount: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    netAmount: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    initiatedById: { type: DataTypes.INTEGER, allowNull: false },
    counterpartyId: { type: DataTypes.INTEGER, allowNull: true },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    gigId: { type: DataTypes.INTEGER, allowNull: true },
    milestoneLabel: { type: DataTypes.STRING(180), allowNull: true },
    scheduledReleaseAt: { type: DataTypes.DATE, allowNull: true },
    releasedAt: { type: DataTypes.DATE, allowNull: true },
    refundedAt: { type: DataTypes.DATE, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    auditTrail: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'escrow_transactions',
    indexes: [
      { fields: ['accountId'] },
      { fields: ['reference'], unique: true },
      { fields: ['status'] },
      { fields: ['projectId'] },
      { fields: ['gigId'] },
      { fields: ['scheduledReleaseAt'] },
    ],
  },
);

EscrowTransaction.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    accountId: plain.accountId,
    reference: plain.reference,
    externalId: plain.externalId,
    type: plain.type,
    status: plain.status,
    amount: Number.parseFloat(plain.amount ?? 0),
    currencyCode: plain.currencyCode,
    feeAmount: Number.parseFloat(plain.feeAmount ?? 0),
    netAmount: Number.parseFloat(plain.netAmount ?? 0),
    initiatedById: plain.initiatedById,
    counterpartyId: plain.counterpartyId,
    projectId: plain.projectId,
    gigId: plain.gigId,
    milestoneLabel: plain.milestoneLabel,
    scheduledReleaseAt: plain.scheduledReleaseAt,
    releasedAt: plain.releasedAt,
    refundedAt: plain.refundedAt,
    cancelledAt: plain.cancelledAt,
    metadata: plain.metadata,
    auditTrail: plain.auditTrail,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const DisputeCase = sequelize.define(
  'DisputeCase',
  {
    escrowTransactionId: { type: DataTypes.INTEGER, allowNull: false },
    openedById: { type: DataTypes.INTEGER, allowNull: false },
    assignedToId: { type: DataTypes.INTEGER, allowNull: true },
    stage: {
      type: DataTypes.ENUM(...DISPUTE_STAGES),
      allowNull: false,
      defaultValue: 'intake',
    },
    status: {
      type: DataTypes.ENUM(...DISPUTE_STATUSES),
      allowNull: false,
      defaultValue: 'open',
    },
    priority: {
      type: DataTypes.ENUM(...DISPUTE_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
    },
    reasonCode: { type: DataTypes.STRING(80), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    customerDeadlineAt: { type: DataTypes.DATE, allowNull: true },
    providerDeadlineAt: { type: DataTypes.DATE, allowNull: true },
    resolutionNotes: { type: DataTypes.TEXT, allowNull: true },
    openedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'dispute_cases',
    indexes: [
      { fields: ['escrowTransactionId'] },
      { fields: ['stage'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['openedById'] },
    ],
  },
);

DisputeCase.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    escrowTransactionId: plain.escrowTransactionId,
    openedById: plain.openedById,
    assignedToId: plain.assignedToId,
    stage: plain.stage,
    status: plain.status,
    priority: plain.priority,
    reasonCode: plain.reasonCode,
    summary: plain.summary,
    customerDeadlineAt: plain.customerDeadlineAt,
    providerDeadlineAt: plain.providerDeadlineAt,
    resolutionNotes: plain.resolutionNotes,
    openedAt: plain.openedAt,
    resolvedAt: plain.resolvedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const DisputeEvent = sequelize.define(
  'DisputeEvent',
  {
    disputeCaseId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    actorType: {
      type: DataTypes.ENUM(...DISPUTE_ACTOR_TYPES),
      allowNull: false,
      defaultValue: 'system',
    },
    actionType: {
      type: DataTypes.ENUM(...DISPUTE_ACTION_TYPES),
      allowNull: false,
      defaultValue: 'comment',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    evidenceKey: { type: DataTypes.STRING(255), allowNull: true },
    evidenceUrl: { type: DataTypes.TEXT, allowNull: true },
    evidenceFileName: { type: DataTypes.STRING(180), allowNull: true },
    evidenceContentType: { type: DataTypes.STRING(80), allowNull: true },
    eventAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'dispute_events',
    indexes: [
      { fields: ['disputeCaseId'] },
      { fields: ['actorType'] },
      { fields: ['actionType'] },
    ],
  },
);

DisputeEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    disputeCaseId: plain.disputeCaseId,
    actorId: plain.actorId,
    actorType: plain.actorType,
    actionType: plain.actionType,
    notes: plain.notes,
    evidenceKey: plain.evidenceKey,
    evidenceUrl: plain.evidenceUrl,
    evidenceFileName: plain.evidenceFileName,
    evidenceContentType: plain.evidenceContentType,
    eventAt: plain.eventAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const DeliverableVault = sequelize.define(
  'DeliverableVault',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false, defaultValue: 'Client deliverables' },
    description: { type: DataTypes.TEXT, allowNull: true },
    watermarkMode: {
      type: DataTypes.ENUM(...DELIVERABLE_VAULT_WATERMARK_MODES),
      allowNull: false,
      defaultValue: 'dynamic',
    },
    retentionPolicy: {
      type: DataTypes.ENUM(...DELIVERABLE_RETENTION_POLICIES),
      allowNull: false,
      defaultValue: 'standard_7_year',
    },
    ndaTemplateUrl: { type: DataTypes.STRING(500), allowNull: true },
    settings: { type: jsonType, allowNull: true },
    isArchived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'deliverable_vaults',
    indexes: [{ fields: ['freelancerId'] }],
  },
);

DeliverableVault.prototype.toPublicObject = function toPublicObject({ includeSettings = true } = {}) {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    title: plain.title,
    description: plain.description,
    watermarkMode: plain.watermarkMode,
    retentionPolicy: plain.retentionPolicy,
    ndaTemplateUrl: plain.ndaTemplateUrl,
    settings: includeSettings ? plain.settings ?? {} : undefined,
    isArchived: Boolean(plain.isArchived),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const DeliverableVaultItem = sequelize.define(
  'DeliverableVaultItem',
  {
    vaultId: { type: DataTypes.INTEGER, allowNull: false },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    clientName: { type: DataTypes.STRING(255), allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...DELIVERABLE_ITEM_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    ndaRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ndaStatus: {
      type: DataTypes.ENUM(...DELIVERABLE_ITEM_NDA_STATUSES),
      allowNull: false,
      defaultValue: 'not_required',
    },
    ndaSignedAt: { type: DataTypes.DATE, allowNull: true },
    ndaReferenceId: { type: DataTypes.STRING(120), allowNull: true },
    watermarkMode: {
      type: DataTypes.ENUM(...DELIVERABLE_ITEM_WATERMARK_MODES),
      allowNull: false,
      defaultValue: 'inherit',
    },
    retentionPolicy: {
      type: DataTypes.ENUM(...DELIVERABLE_RETENTION_POLICIES),
      allowNull: false,
      defaultValue: 'standard_7_year',
    },
    retentionUntil: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    currentVersionId: { type: DataTypes.INTEGER, allowNull: true },
    latestPackageId: { type: DataTypes.INTEGER, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    successSummary: { type: DataTypes.TEXT, allowNull: true },
    successMetrics: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    isArchived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdById: { type: DataTypes.INTEGER, allowNull: false },
    lastTouchedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'deliverable_vault_items',
    indexes: [
      { fields: ['vaultId'] },
      { fields: ['status'] },
      { fields: ['ndaStatus'] },
      { fields: ['retentionPolicy'] },
    ],
  },
);

DeliverableVaultItem.prototype.toPublicObject = function toPublicObject({ includeVersions = true, includePackages = true } = {}) {
  const plain = this.get({ plain: true });
  const tags = Array.isArray(plain.tags)
    ? plain.tags
    : typeof plain.tags === 'string'
      ? plain.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  const normalizeMetrics = (metrics) => {
    if (!metrics || typeof metrics !== 'object') {
      return {};
    }
    return Object.fromEntries(
      Object.entries(metrics).map(([key, value]) => [key, typeof value === 'number' ? value : Number(value) || value]),
    );
  };

  const versions = Array.isArray(plain.versions)
    ? [...plain.versions]
        .sort((a, b) => Number(b.versionNumber ?? 0) - Number(a.versionNumber ?? 0))
        .map((version) => ({
          id: version.id,
          itemId: version.itemId,
          versionNumber: version.versionNumber,
          storageKey: version.storageKey,
          fileUrl: version.fileUrl,
          fileName: version.fileName,
          fileExt: version.fileExt,
          fileSize: version.fileSize == null ? null : Number(version.fileSize),
          checksum: version.checksum,
          watermarkApplied: Boolean(version.watermarkApplied),
          notes: version.notes,
          storageRegion: version.storageRegion,
          metadata: version.metadata ?? null,
          uploadedAt: version.uploadedAt ?? version.createdAt,
          uploadedById: version.uploadedById ?? version.uploadedBy?.id ?? null,
          uploadedBy: version.uploadedBy
            ? {
                id: version.uploadedBy.id,
                firstName: version.uploadedBy.firstName,
                lastName: version.uploadedBy.lastName,
                email: version.uploadedBy.email,
              }
            : null,
        }))
    : [];

  const deliveryPackages = Array.isArray(plain.deliveryPackages)
    ? [...plain.deliveryPackages]
        .sort((a, b) => new Date(b.generatedAt ?? b.createdAt ?? 0) - new Date(a.generatedAt ?? a.createdAt ?? 0))
        .map((pkg) => ({
          id: pkg.id,
          itemId: pkg.itemId,
          packageKey: pkg.packageKey,
          packageUrl: pkg.packageUrl,
          checksum: pkg.checksum,
          includesWatermark: Boolean(pkg.includesWatermark),
          generatedById: pkg.generatedById ?? pkg.generatedBy?.id ?? null,
          generatedBy: pkg.generatedBy
            ? {
                id: pkg.generatedBy.id,
                firstName: pkg.generatedBy.firstName,
                lastName: pkg.generatedBy.lastName,
                email: pkg.generatedBy.email,
              }
            : null,
          generatedAt: pkg.generatedAt ?? pkg.createdAt,
          expiresAt: pkg.expiresAt ?? null,
          deliverySummary: pkg.deliverySummary,
          deliveryMetrics: normalizeMetrics(pkg.deliveryMetrics),
          ndaSnapshot: pkg.ndaSnapshot ?? null,
          status: pkg.status ?? 'active',
          metadata: pkg.metadata ?? null,
        }))
    : [];

  const auditTrail = Array.isArray(plain.metadata?.auditTrail) ? plain.metadata.auditTrail : [];

  return {
    id: plain.id,
    vaultId: plain.vaultId,
    projectId: plain.projectId,
    clientName: plain.clientName,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    ndaRequired: Boolean(plain.ndaRequired),
    ndaStatus: plain.ndaStatus,
    ndaSignedAt: plain.ndaSignedAt,
    ndaReferenceId: plain.ndaReferenceId,
    watermarkMode: plain.watermarkMode,
    retentionPolicy: plain.retentionPolicy,
    retentionUntil: plain.retentionUntil,
    deliveredAt: plain.deliveredAt,
    currentVersionId: plain.currentVersionId,
    latestPackageId: plain.latestPackageId,
    versionCount: versions.length,
    latestVersion: versions[0] ?? null,
    tags,
    successSummary: plain.successSummary,
    successMetrics: normalizeMetrics(plain.successMetrics),
    metadata: plain.metadata ?? {},
    auditTrail,
    isArchived: Boolean(plain.isArchived),
    createdById: plain.createdById,
    lastTouchedById: plain.lastTouchedById,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    versions: includeVersions ? versions : undefined,
    deliveryPackages: includePackages ? deliveryPackages : undefined,
    vault: plain.vault
      ? {
          id: plain.vault.id,
          freelancerId: plain.vault.freelancerId,
          watermarkMode: plain.vault.watermarkMode,
          retentionPolicy: plain.vault.retentionPolicy,
        }
      : undefined,
  };
};

export const DeliverableVersion = sequelize.define(
  'DeliverableVersion',
  {
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    versionNumber: { type: DataTypes.INTEGER, allowNull: false },
    storageKey: { type: DataTypes.STRING(255), allowNull: false },
    fileUrl: { type: DataTypes.STRING(500), allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    fileExt: { type: DataTypes.STRING(16), allowNull: true },
    fileSize: { type: DataTypes.BIGINT, allowNull: true },
    checksum: { type: DataTypes.STRING(128), allowNull: true },
    uploadedById: { type: DataTypes.INTEGER, allowNull: false },
    uploadedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    watermarkApplied: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    storageRegion: { type: DataTypes.STRING(60), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'deliverable_versions',
    indexes: [
      { fields: ['itemId', 'versionNumber'], unique: true },
      { fields: ['uploadedById'] },
    ],
  },
);

DeliverableVersion.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    itemId: plain.itemId,
    versionNumber: plain.versionNumber,
    storageKey: plain.storageKey,
    fileUrl: plain.fileUrl,
    fileName: plain.fileName,
    fileExt: plain.fileExt,
    fileSize: plain.fileSize == null ? null : Number(plain.fileSize),
    checksum: plain.checksum,
    uploadedById: plain.uploadedById,
    uploadedAt: plain.uploadedAt,
    watermarkApplied: Boolean(plain.watermarkApplied),
    notes: plain.notes,
    storageRegion: plain.storageRegion,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const DeliverableDeliveryPackage = sequelize.define(
  'DeliverableDeliveryPackage',
  {
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    packageKey: { type: DataTypes.STRING(255), allowNull: false },
    packageUrl: { type: DataTypes.STRING(500), allowNull: false },
    checksum: { type: DataTypes.STRING(128), allowNull: true },
    generatedById: { type: DataTypes.INTEGER, allowNull: false },
    generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    includesWatermark: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deliverySummary: { type: DataTypes.TEXT, allowNull: true },
    deliveryMetrics: { type: jsonType, allowNull: true },
    ndaSnapshot: { type: jsonType, allowNull: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'active' },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'deliverable_delivery_packages',
    indexes: [
      { fields: ['itemId'] },
      { fields: ['generatedAt'] },
    ],
  },
);

DeliverableDeliveryPackage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    itemId: plain.itemId,
    packageKey: plain.packageKey,
    packageUrl: plain.packageUrl,
    checksum: plain.checksum,
    generatedById: plain.generatedById,
    generatedAt: plain.generatedAt,
    expiresAt: plain.expiresAt,
    includesWatermark: Boolean(plain.includesWatermark),
    deliverySummary: plain.deliverySummary,
    deliveryMetrics: plain.deliveryMetrics ?? {},
    ndaSnapshot: plain.ndaSnapshot ?? null,
    status: plain.status,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SearchSubscription = sequelize.define(
  'SearchSubscription',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    category: {
      type: DataTypes.ENUM('job', 'gig', 'project', 'launchpad', 'volunteering', 'people', 'mixed'),
      allowNull: false,
      defaultValue: 'job',
    },
    query: { type: DataTypes.STRING(500), allowNull: true },
    filters: { type: jsonType, allowNull: true },
    sort: { type: DataTypes.STRING(120), allowNull: true },
    frequency: {
      type: DataTypes.ENUM(...DIGEST_FREQUENCIES),
      allowNull: false,
      defaultValue: 'daily',
    },
    notifyByEmail: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notifyInApp: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastTriggeredAt: { type: DataTypes.DATE, allowNull: true },
    nextRunAt: { type: DataTypes.DATE, allowNull: true },
    mapViewport: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'search_subscriptions',
    indexes: [
      { fields: ['userId', 'category'] },
      { fields: ['frequency'] },
    ],
  },
);

export const FreelancerAssignmentMetric = sequelize.define(
  'FreelancerAssignmentMetric',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    completionRate: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    avgAssignedValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    lifetimeAssignedValue: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    lifetimeCompletedValue: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    lastAssignedAt: { type: DataTypes.DATE, allowNull: true },
    lastCompletedAt: { type: DataTypes.DATE, allowNull: true },
    totalAssigned: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalCompleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'freelancer_assignment_metrics' },
);

FreelancerAssignmentMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    freelancerId: plain.freelancerId,
    rating: plain.rating == null ? null : Number(plain.rating),
    completionRate: plain.completionRate == null ? null : Number(plain.completionRate),
    avgAssignedValue: plain.avgAssignedValue == null ? null : Number(plain.avgAssignedValue),
    lifetimeAssignedValue: Number(plain.lifetimeAssignedValue ?? 0),
    lifetimeCompletedValue: Number(plain.lifetimeCompletedValue ?? 0),
    lastAssignedAt: plain.lastAssignedAt,
    lastCompletedAt: plain.lastCompletedAt,
    totalAssigned: plain.totalAssigned,
    totalCompleted: plain.totalCompleted,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

function decimalToNumber(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const FreelancerFinanceMetric = sequelize.define(
  'FreelancerFinanceMetric',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    metricKey: { type: DataTypes.STRING(64), allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    value: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    valueUnit: {
      type: DataTypes.ENUM(...FINANCE_VALUE_UNITS),
      allowNull: false,
      defaultValue: 'currency',
      validate: { isIn: [FINANCE_VALUE_UNITS] },
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
    changeValue: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    changeUnit: {
      type: DataTypes.ENUM(...FINANCE_CHANGE_UNITS),
      allowNull: true,
      validate: { isIn: [FINANCE_CHANGE_UNITS] },
    },
    trend: {
      type: DataTypes.ENUM(...FINANCE_TRENDS),
      allowNull: false,
      defaultValue: 'neutral',
      validate: { isIn: [FINANCE_TRENDS] },
    },
    caption: { type: DataTypes.TEXT, allowNull: true },
    effectiveAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_finance_metrics',
    indexes: [
      { fields: ['freelancerId', 'metricKey'] },
      { fields: ['freelancerId', 'effectiveAt'] },
    ],
  },
);

FreelancerFinanceMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    metricKey: plain.metricKey,
    label: plain.label,
    value: decimalToNumber(plain.value),
    valueUnit: plain.valueUnit,
    currencyCode: plain.currencyCode,
    changeValue: decimalToNumber(plain.changeValue),
    changeUnit: plain.changeUnit,
    trend: plain.trend,
    caption: plain.caption,
    effectiveAt: plain.effectiveAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerRevenueMonthly = sequelize.define(
  'FreelancerRevenueMonthly',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.DATEONLY, allowNull: false },
    bookedAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    realizedAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
  },
  {
    tableName: 'freelancer_revenue_monthlies',
    indexes: [
      { unique: true, fields: ['freelancerId', 'month'] },
      { fields: ['freelancerId', 'createdAt'] },
    ],
  },
);

FreelancerRevenueMonthly.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    month: plain.month,
    bookedAmount: decimalToNumber(plain.bookedAmount),
    realizedAmount: decimalToNumber(plain.realizedAmount),
    currencyCode: plain.currencyCode,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerRevenueStream = sequelize.define(
  'FreelancerRevenueStream',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    sharePercent: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    monthlyRecurringRevenue: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
    yoyChangePercent: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_revenue_streams',
    indexes: [{ fields: ['freelancerId'] }],
  },
);

FreelancerRevenueStream.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    sharePercent: decimalToNumber(plain.sharePercent),
    monthlyRecurringRevenue: decimalToNumber(plain.monthlyRecurringRevenue),
    currencyCode: plain.currencyCode,
    yoyChangePercent: decimalToNumber(plain.yoyChangePercent),
    notes: plain.notes,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerPayout = sequelize.define(
  'FreelancerPayout',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    payoutDate: { type: DataTypes.DATEONLY, allowNull: false },
    clientName: { type: DataTypes.STRING(160), allowNull: false },
    gigTitle: { type: DataTypes.STRING(160), allowNull: false },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...FREELANCER_PAYOUT_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [FREELANCER_PAYOUT_STATUSES] },
    },
    reference: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_payouts',
    indexes: [
      { fields: ['freelancerId', 'payoutDate'] },
      { fields: ['status'] },
    ],
  },
);

FreelancerPayout.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    payoutDate: plain.payoutDate,
    clientName: plain.clientName,
    gigTitle: plain.gigTitle,
    amount: decimalToNumber(plain.amount),
    currencyCode: plain.currencyCode,
    status: plain.status,
    reference: plain.reference,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerTaxEstimate = sequelize.define(
  'FreelancerTaxEstimate',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...FREELANCER_TAX_ESTIMATE_STATUSES),
      allowNull: false,
      defaultValue: 'on_track',
      validate: { isIn: [FREELANCER_TAX_ESTIMATE_STATUSES] },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_tax_estimates',
    indexes: [{ fields: ['freelancerId', 'dueDate'] }],
  },
);

FreelancerTaxEstimate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    dueDate: plain.dueDate,
    amount: decimalToNumber(plain.amount),
    currencyCode: plain.currencyCode,
    status: plain.status,
    notes: plain.notes,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerTaxFiling = sequelize.define(
  'FreelancerTaxFiling',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(180), allowNull: false },
    jurisdiction: { type: DataTypes.STRING(120), allowNull: true },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM(...FREELANCER_FILING_STATUSES),
      allowNull: false,
      defaultValue: 'not_started',
      validate: { isIn: [FREELANCER_FILING_STATUSES] },
    },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_tax_filings',
    indexes: [
      { fields: ['freelancerId'] },
      { fields: ['dueDate'] },
    ],
  },
);

FreelancerTaxFiling.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    jurisdiction: plain.jurisdiction,
    dueDate: plain.dueDate,
    status: plain.status,
    submittedAt: plain.submittedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerDeductionSummary = sequelize.define(
  'FreelancerDeductionSummary',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    taxYear: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    changePercentage: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'freelancer_deduction_summaries',
    indexes: [{ unique: true, fields: ['freelancerId', 'taxYear'] }],
  },
);

FreelancerDeductionSummary.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    taxYear: plain.taxYear,
    amount: decimalToNumber(plain.amount),
    currencyCode: plain.currencyCode,
    changePercentage: decimalToNumber(plain.changePercentage),
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerProfitabilityMetric = sequelize.define(
  'FreelancerProfitabilityMetric',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    metricKey: { type: DataTypes.STRING(64), allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    value: { type: DataTypes.DECIMAL(10, 4), allowNull: false, defaultValue: 0 },
    valueUnit: {
      type: DataTypes.ENUM(...FINANCE_VALUE_UNITS),
      allowNull: false,
      defaultValue: 'percentage',
      validate: { isIn: [FINANCE_VALUE_UNITS] },
    },
    changeValue: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    changeUnit: {
      type: DataTypes.ENUM(...FINANCE_CHANGE_UNITS),
      allowNull: true,
      validate: { isIn: [FINANCE_CHANGE_UNITS] },
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
  },
  {
    tableName: 'freelancer_profitability_metrics',
    indexes: [{ fields: ['freelancerId', 'metricKey'] }],
  },
);

FreelancerProfitabilityMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    metricKey: plain.metricKey,
    label: plain.label,
    value: decimalToNumber(plain.value),
    valueUnit: plain.valueUnit,
    changeValue: decimalToNumber(plain.changeValue),
    changeUnit: plain.changeUnit,
    currencyCode: plain.currencyCode,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerCostBreakdown = sequelize.define(
  'FreelancerCostBreakdown',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    percentage: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    caption: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'freelancer_cost_breakdowns',
    indexes: [{ fields: ['freelancerId'] }],
  },
);

FreelancerCostBreakdown.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    label: plain.label,
    percentage: decimalToNumber(plain.percentage),
    caption: plain.caption,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerSavingsGoal = sequelize.define(
  'FreelancerSavingsGoal',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    targetAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    progress: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    cadence: { type: DataTypes.STRING(160), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_savings_goals',
    indexes: [{ fields: ['freelancerId'] }],
  },
);

FreelancerSavingsGoal.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    targetAmount: decimalToNumber(plain.targetAmount),
    currencyCode: plain.currencyCode,
    progress: decimalToNumber(plain.progress),
    cadence: plain.cadence,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerFinanceControl = sequelize.define(
  'FreelancerFinanceControl',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    bullets: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_finance_controls',
    indexes: [{ fields: ['freelancerId'] }],
  },
);

FreelancerFinanceControl.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    description: plain.description,
    bullets: Array.isArray(plain.bullets) ? plain.bullets : [],
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectAssignmentEvent = sequelize.define(
  'ProjectAssignmentEvent',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    eventType: {
      type: DataTypes.ENUM(
        'created',
        'auto_assign_enabled',
        'auto_assign_disabled',
        'auto_assign_queue_generated',
        'auto_assign_queue_exhausted',
      ),
      allowNull: false,
      defaultValue: 'created',
    },
    payload: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'project_assignment_events',
    indexes: [{ fields: ['projectId', 'eventType'] }],
  },
);

ProjectAssignmentEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    actorId: plain.actorId,
    eventType: plain.eventType,
    payload: plain.payload,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AutoAssignQueueEntry = sequelize.define(
  'AutoAssignQueueEntry',
  {
    targetType: {
      type: DataTypes.ENUM(...APPLICATION_TARGET_TYPES),
      allowNull: false,
      validate: { isIn: [APPLICATION_TARGET_TYPES] },
    },
    targetId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.DECIMAL(10, 4), allowNull: false },
    priorityBucket: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    status: {
      type: DataTypes.ENUM(...AUTO_ASSIGN_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [AUTO_ASSIGN_STATUSES] },
    },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    notifiedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    projectValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'auto_assign_queue_entries',
    indexes: [
      { fields: ['targetType', 'targetId'] },
      { fields: ['freelancerId', 'status'] },
    ],
  },
);

AutoAssignQueueEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    targetType: plain.targetType,
    targetId: plain.targetId,
    freelancerId: plain.freelancerId,
    score: Number(plain.score),
    priorityBucket: plain.priorityBucket,
    status: plain.status,
    expiresAt: plain.expiresAt,
    notifiedAt: plain.notifiedAt,
    resolvedAt: plain.resolvedAt,
    projectValue: plain.projectValue == null ? null : Number(plain.projectValue),
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

SearchSubscription.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    name: plain.name,
    category: plain.category,
    query: plain.query,
    filters: plain.filters,
    sort: plain.sort,
    frequency: plain.frequency,
    notifyByEmail: plain.notifyByEmail,
    notifyInApp: plain.notifyInApp,
    lastTriggeredAt: plain.lastTriggeredAt,
    nextRunAt: plain.nextRunAt,
    mapViewport: plain.mapViewport,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CollaborationSpace = sequelize.define(
  'CollaborationSpace',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    profileId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(180), allowNull: false },
    clientName: { type: DataTypes.STRING(180), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...COLLABORATION_SPACE_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    defaultPermission: {
      type: DataTypes.ENUM(...COLLABORATION_PERMISSION_LEVELS),
      allowNull: false,
      defaultValue: 'comment',
    },
    meetingCadence: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'collaboration_spaces',
    indexes: [
      { fields: ['ownerId'] },
      { fields: ['profileId'] },
      { fields: ['status'] },
    ],
  },
);

CollaborationSpace.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    ownerId: plain.ownerId,
    profileId: plain.profileId,
    name: plain.name,
    clientName: plain.clientName,
    summary: plain.summary,
    status: plain.status,
    defaultPermission: plain.defaultPermission,
    meetingCadence: plain.meetingCadence,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ComplianceDocument = sequelize.define(
  'ComplianceDocument',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    documentType: {
      type: DataTypes.ENUM(...COMPLIANCE_DOCUMENT_TYPES),
      allowNull: false,
      defaultValue: 'contract',
      validate: { isIn: [COMPLIANCE_DOCUMENT_TYPES] },
    },
    status: {
      type: DataTypes.ENUM(...COMPLIANCE_DOCUMENT_STATUSES),
      allowNull: false,
      defaultValue: 'awaiting_signature',
      validate: { isIn: [COMPLIANCE_DOCUMENT_STATUSES] },
    },
    storageProvider: {
      type: DataTypes.ENUM(...COMPLIANCE_STORAGE_PROVIDERS),
      allowNull: false,
      defaultValue: 'r2',
      validate: { isIn: [COMPLIANCE_STORAGE_PROVIDERS] },
    },
    storagePath: { type: DataTypes.STRING(500), allowNull: false },
    storageRegion: { type: DataTypes.STRING(120), allowNull: true },
    latestVersionId: { type: DataTypes.INTEGER, allowNull: true },
    counterpartyName: { type: DataTypes.STRING(255), allowNull: true },
    counterpartyEmail: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    counterpartyCompany: { type: DataTypes.STRING(255), allowNull: true },
    jurisdiction: { type: DataTypes.STRING(120), allowNull: true },
    governingLaw: { type: DataTypes.STRING(120), allowNull: true },
    effectiveDate: { type: DataTypes.DATE, allowNull: true },
    expiryDate: { type: DataTypes.DATE, allowNull: true },
    renewalTerms: { type: DataTypes.STRING(255), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    obligationSummary: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'compliance_documents',
    indexes: [
      { fields: ['ownerId'] },
      { fields: ['workspaceId'] },
      { fields: ['documentType'] },
      { fields: ['status'] },
      { fields: ['expiryDate'] },
    ],
  },
);

ComplianceDocument.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    ownerId: plain.ownerId,
    workspaceId: plain.workspaceId,
    title: plain.title,
    documentType: plain.documentType,
    status: plain.status,
    storageProvider: plain.storageProvider,
    storagePath: plain.storagePath,
    storageRegion: plain.storageRegion,
    latestVersionId: plain.latestVersionId,
    counterpartyName: plain.counterpartyName,
    counterpartyEmail: plain.counterpartyEmail,
    counterpartyCompany: plain.counterpartyCompany,
    jurisdiction: plain.jurisdiction,
    governingLaw: plain.governingLaw,
    effectiveDate: plain.effectiveDate,
    expiryDate: plain.expiryDate,
    renewalTerms: plain.renewalTerms,
    tags: Array.isArray(plain.tags) ? plain.tags : plain.tags ? Object.values(plain.tags) : [],
    metadata: plain.metadata ?? null,
    obligationSummary: plain.obligationSummary,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ComplianceDocumentVersion = sequelize.define(
  'ComplianceDocumentVersion',
  {
    documentId: { type: DataTypes.INTEGER, allowNull: false },
    versionNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    fileKey: { type: DataTypes.STRING(500), allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    mimeType: { type: DataTypes.STRING(120), allowNull: true },
    fileSize: { type: DataTypes.BIGINT, allowNull: true, validate: { min: 0 } },
    sha256: { type: DataTypes.STRING(128), allowNull: true },
    uploadedById: { type: DataTypes.INTEGER, allowNull: true },
    signedAt: { type: DataTypes.DATE, allowNull: true },
    signedByName: { type: DataTypes.STRING(255), allowNull: true },
    signedByEmail: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    signedByIp: { type: DataTypes.STRING(64), allowNull: true },
    auditTrail: { type: jsonType, allowNull: true },
    changeSummary: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'compliance_document_versions',
    indexes: [
      { fields: ['documentId'] },
      { fields: ['versionNumber'] },
    ],
  },
);

ComplianceDocumentVersion.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    documentId: plain.documentId,
    versionNumber: plain.versionNumber,
    fileKey: plain.fileKey,
    fileName: plain.fileName,
    mimeType: plain.mimeType,
    fileSize: plain.fileSize == null ? null : Number(plain.fileSize),
    sha256: plain.sha256,
    uploadedById: plain.uploadedById,
    signedAt: plain.signedAt,
    signedByName: plain.signedByName,
    signedByEmail: plain.signedByEmail,
    signedByIp: plain.signedByIp,
    auditTrail: plain.auditTrail ?? null,
    changeSummary: plain.changeSummary,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ComplianceObligation = sequelize.define(
  'ComplianceObligation',
  {
    documentId: { type: DataTypes.INTEGER, allowNull: false },
    clauseReference: { type: DataTypes.STRING(120), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM(...COMPLIANCE_OBLIGATION_STATUSES),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [COMPLIANCE_OBLIGATION_STATUSES] },
    },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    assigneeId: { type: DataTypes.INTEGER, allowNull: true },
    priority: { type: DataTypes.STRING(60), allowNull: true },
    escalations: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    lastNotifiedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'compliance_obligations',
    indexes: [
      { fields: ['documentId'] },
      { fields: ['status'] },
      { fields: ['dueAt'] },
    ],
  },
);

ComplianceObligation.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    documentId: plain.documentId,
    clauseReference: plain.clauseReference,
    description: plain.description,
    status: plain.status,
    dueAt: plain.dueAt,
    completedAt: plain.completedAt,
    assigneeId: plain.assigneeId,
    priority: plain.priority,
    escalations: plain.escalations ?? null,
    metadata: plain.metadata ?? null,
    lastNotifiedAt: plain.lastNotifiedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ComplianceReminder = sequelize.define(
  'ComplianceReminder',
  {
    documentId: { type: DataTypes.INTEGER, allowNull: false },
    obligationId: { type: DataTypes.INTEGER, allowNull: true },
    reminderType: { type: DataTypes.STRING(120), allowNull: false },
    dueAt: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM(...COMPLIANCE_REMINDER_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [COMPLIANCE_REMINDER_STATUSES] },
    },
    channel: { type: DataTypes.STRING(60), allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    acknowledgedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'compliance_reminders',
    indexes: [
      { fields: ['documentId'] },
      { fields: ['status'] },
      { fields: ['dueAt'] },
    ],
  },
);

ComplianceReminder.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    documentId: plain.documentId,
    obligationId: plain.obligationId,
    reminderType: plain.reminderType,
    dueAt: plain.dueAt,
    status: plain.status,
    channel: plain.channel,
    createdById: plain.createdById,
    sentAt: plain.sentAt,
    acknowledgedAt: plain.acknowledgedAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ComplianceLocalization = sequelize.define(
  'ComplianceLocalization',
  {
    framework: { type: DataTypes.STRING(120), allowNull: false },
    region: { type: DataTypes.STRING(60), allowNull: false },
    requirement: { type: DataTypes.TEXT, allowNull: false },
    guidance: { type: DataTypes.TEXT, allowNull: true },
    recommendedDocumentTypes: { type: jsonType, allowNull: true },
    questionnaireUrl: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'compliance_localizations',
    indexes: [
      { fields: ['framework', 'region'] },
      { fields: ['region'] },
    ],
  },
);

ComplianceLocalization.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    framework: plain.framework,
    region: plain.region,
    requirement: plain.requirement,
    guidance: plain.guidance,
    recommendedDocumentTypes: Array.isArray(plain.recommendedDocumentTypes)
      ? plain.recommendedDocumentTypes
      : plain.recommendedDocumentTypes ?? [],
    questionnaireUrl: plain.questionnaireUrl,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const MessageThread = sequelize.define(
  'MessageThread',
  {
    subject: { type: DataTypes.STRING(255), allowNull: true },
    channelType: {
      type: DataTypes.ENUM(...MESSAGE_CHANNEL_TYPES),
      allowNull: false,
      defaultValue: 'direct',
    },
    state: {
      type: DataTypes.ENUM(...MESSAGE_THREAD_STATES),
      allowNull: false,
      defaultValue: 'active',
    },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'message_threads',
    scopes: {
      active: { where: { state: 'active' } },
    },
  },
);

export const MessageParticipant = sequelize.define(
  'MessageParticipant',
export const CollaborationParticipant = sequelize.define(
  'CollaborationParticipant',
  {
    spaceId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: {
      type: DataTypes.ENUM(...COLLABORATION_PARTICIPANT_ROLES),
      allowNull: false,
      defaultValue: 'contributor',
    },
    permissionLevel: {
      type: DataTypes.ENUM(...COLLABORATION_PERMISSION_LEVELS),
      allowNull: false,
      defaultValue: 'comment',
    },
    status: {
      type: DataTypes.ENUM(...COLLABORATION_PARTICIPANT_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
    },
    invitedAt: { type: DataTypes.DATE, allowNull: true },
    joinedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'collaboration_participants',
    indexes: [
      { unique: true, fields: ['spaceId', 'userId'] },
      { fields: ['role'] },
      { fields: ['status'] },
    ],
  },
);

CollaborationParticipant.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    spaceId: plain.spaceId,
    userId: plain.userId,
    role: plain.role,
    permissionLevel: plain.permissionLevel,
    status: plain.status,
    invitedAt: plain.invitedAt,
    joinedAt: plain.joinedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CollaborationRoom = sequelize.define(
  'CollaborationRoom',
  {
    spaceId: { type: DataTypes.INTEGER, allowNull: false },
    roomType: {
      type: DataTypes.ENUM(...COLLABORATION_ROOM_TYPES),
      allowNull: false,
      defaultValue: 'video',
    },
    title: { type: DataTypes.STRING(180), allowNull: false },
    provider: { type: DataTypes.STRING(120), allowNull: false },
    joinUrl: { type: DataTypes.TEXT, allowNull: false },
    recordingUrl: { type: DataTypes.TEXT, allowNull: true },
    lastStartedAt: { type: DataTypes.DATE, allowNull: true },
    settings: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'collaboration_rooms',
    indexes: [
      { fields: ['spaceId'] },
      { fields: ['roomType'] },
      { fields: ['provider'] },
    ],
  },
);

CollaborationRoom.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    spaceId: plain.spaceId,
    roomType: plain.roomType,
    title: plain.title,
    provider: plain.provider,
    joinUrl: plain.joinUrl,
    recordingUrl: plain.recordingUrl,
    lastStartedAt: plain.lastStartedAt,
    settings: plain.settings,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CollaborationAsset = sequelize.define(
  'CollaborationAsset',
  {
    spaceId: { type: DataTypes.INTEGER, allowNull: false },
    uploadedById: { type: DataTypes.INTEGER, allowNull: true },
    assetType: {
      type: DataTypes.ENUM(...COLLABORATION_ASSET_TYPES),
      allowNull: false,
      defaultValue: 'file',
    },
    status: {
      type: DataTypes.ENUM(...COLLABORATION_ASSET_STATUSES),
      allowNull: false,
      defaultValue: 'in_review',
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    sourceUrl: { type: DataTypes.TEXT, allowNull: false },
    version: { type: DataTypes.STRING(60), allowNull: true },
    checksum: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'collaboration_assets',
    indexes: [
      { fields: ['spaceId'] },
      { fields: ['assetType'] },
      { fields: ['status'] },
    ],
  },
);

CollaborationAsset.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    spaceId: plain.spaceId,
    uploadedById: plain.uploadedById,
    assetType: plain.assetType,
    status: plain.status,
    title: plain.title,
    sourceUrl: plain.sourceUrl,
    version: plain.version,
    checksum: plain.checksum,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigOrder = sequelize.define(
  'GigOrder',
  {
    orderNumber: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, unique: true },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    clientId: { type: DataTypes.INTEGER, allowNull: true },
    clientName: { type: DataTypes.STRING(180), allowNull: false },
    clientEmail: { type: DataTypes.STRING(180), allowNull: true },
    clientOrganization: { type: DataTypes.STRING(180), allowNull: true },
    gigTitle: { type: DataTypes.STRING(180), allowNull: false },
    pipelineStage: {
      type: DataTypes.ENUM(...GIG_ORDER_PIPELINE_STATUSES),
      allowNull: false,
      defaultValue: 'inquiry',
      validate: { isIn: [GIG_ORDER_PIPELINE_STATUSES] },
    },
    status: {
      type: DataTypes.ENUM(...GIG_ORDER_STATUS_TYPES),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [GIG_ORDER_STATUS_TYPES] },
    },
    intakeStatus: {
      type: DataTypes.ENUM(...GIG_ORDER_INTAKE_STATUSES),
      allowNull: false,
      defaultValue: 'not_started',
      validate: { isIn: [GIG_ORDER_INTAKE_STATUSES] },
    },
    kickoffScheduledAt: { type: DataTypes.DATE, allowNull: true },
    kickoffStatus: {
      type: DataTypes.ENUM(...GIG_ORDER_KICKOFF_STATUSES),
      allowNull: false,
      defaultValue: 'not_scheduled',
      validate: { isIn: [GIG_ORDER_KICKOFF_STATUSES] },
    },
    productionStartedAt: { type: DataTypes.DATE, allowNull: true },
    deliveryDueAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    csatScore: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    valueAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    valueCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    escrowTotalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    escrowCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    lastClientContactAt: { type: DataTypes.DATE, allowNull: true },
    nextClientTouchpointAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'gig_orders',
    indexes: [
      { fields: ['freelancerId', 'pipelineStage'] },
      { fields: ['orderNumber'], unique: true },
    ],
  },
);

GigOrder.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const serializeCollection = (collection = []) =>
    collection.map((item) => (item?.toPublicObject ? item.toPublicObject() : item));

  return {
    id: plain.id,
    orderNumber: plain.orderNumber,
    freelancerId: plain.freelancerId,
    clientId: plain.clientId,
    clientName: plain.clientName,
    clientEmail: plain.clientEmail,
    clientOrganization: plain.clientOrganization,
    gigTitle: plain.gigTitle,
    pipelineStage: plain.pipelineStage,
    status: plain.status,
    intakeStatus: plain.intakeStatus,
    kickoffScheduledAt: plain.kickoffScheduledAt,
    kickoffStatus: plain.kickoffStatus,
    productionStartedAt: plain.productionStartedAt,
    deliveryDueAt: plain.deliveryDueAt,
    deliveredAt: plain.deliveredAt,
    csatScore: plain.csatScore == null ? null : Number(plain.csatScore),
    valueAmount: Number.parseFloat(plain.valueAmount ?? 0),
    valueCurrency: plain.valueCurrency,
    escrowTotalAmount: Number.parseFloat(plain.escrowTotalAmount ?? 0),
    escrowCurrency: plain.escrowCurrency,
    notes: plain.notes,
    tags: plain.tags,
    lastClientContactAt: plain.lastClientContactAt,
    nextClientTouchpointAt: plain.nextClientTouchpointAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    requirementForms: serializeCollection(plain.requirementForms ?? plain.GigOrderRequirementForms ?? []),
    revisions: serializeCollection(plain.revisions ?? plain.GigOrderRevisions ?? []),
    escrowCheckpoints: serializeCollection(
      plain.escrowCheckpoints ?? plain.GigOrderEscrowCheckpoints ?? [],
    ),
    freelancer: plain.freelancer ?? null,
    client: plain.client ?? null,
  };
};

export const GigOrderRequirementForm = sequelize.define(
  'GigOrderRequirementForm',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...GIG_ORDER_REQUIREMENT_FORM_STATUSES),
      allowNull: false,
      defaultValue: 'pending_client',
      validate: { isIn: [GIG_ORDER_REQUIREMENT_FORM_STATUSES] },
    },
    schemaVersion: { type: DataTypes.STRING(36), allowNull: true },
    questions: { type: jsonType, allowNull: true },
    responses: { type: jsonType, allowNull: true },
    requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    reviewerId: { type: DataTypes.INTEGER, allowNull: true },
    lastReminderAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'gig_order_requirement_forms',
    indexes: [
      { fields: ['orderId', 'status'] },
    ],
  },
);

GigOrderRequirementForm.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    orderId: plain.orderId,
    status: plain.status,
    schemaVersion: plain.schemaVersion,
    questions: plain.questions,
    responses: plain.responses,
    requestedAt: plain.requestedAt,
    submittedAt: plain.submittedAt,
    approvedAt: plain.approvedAt,
    reviewerId: plain.reviewerId,
    lastReminderAt: plain.lastReminderAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigOrderRevision = sequelize.define(
  'GigOrderRevision',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    revisionNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: {
      type: DataTypes.ENUM(...GIG_ORDER_REVISION_STATUSES),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [GIG_ORDER_REVISION_STATUSES] },
    },
    summary: { type: DataTypes.STRING(255), allowNull: true },
    details: { type: jsonType, allowNull: true },
    requestedById: { type: DataTypes.INTEGER, allowNull: true },
    requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'gig_order_revisions',
    indexes: [
      { fields: ['orderId', 'status'] },
    ],
  },
);

GigOrderRevision.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    orderId: plain.orderId,
    revisionNumber: plain.revisionNumber,
    status: plain.status,
    summary: plain.summary,
    details: plain.details,
    requestedById: plain.requestedById,
    requestedAt: plain.requestedAt,
    dueAt: plain.dueAt,
    completedAt: plain.completedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GigOrderEscrowCheckpoint = sequelize.define(
  'GigOrderEscrowCheckpoint',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(120), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...GIG_ORDER_ESCROW_STATUSES),
      allowNull: false,
      defaultValue: 'funded',
      validate: { isIn: [GIG_ORDER_ESCROW_STATUSES] },
    },
    approvalRequirement: { type: DataTypes.STRING(120), allowNull: true },
    csatThreshold: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    releasedAt: { type: DataTypes.DATE, allowNull: true },
    releasedById: { type: DataTypes.INTEGER, allowNull: true },
    payoutReference: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'gig_order_escrow_checkpoints',
    indexes: [
      { fields: ['orderId', 'status'] },
    ],
  },
);

GigOrderEscrowCheckpoint.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    orderId: plain.orderId,
    label: plain.label,
    amount: Number.parseFloat(plain.amount ?? 0),
    currency: plain.currency,
    status: plain.status,
    approvalRequirement: plain.approvalRequirement,
    csatThreshold: plain.csatThreshold == null ? null : Number(plain.csatThreshold),
    releasedAt: plain.releasedAt,
    releasedById: plain.releasedById,
    payoutReference: plain.payoutReference,
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SearchSubscription = sequelize.define(
  'SearchSubscription',
export const CollaborationAnnotation = sequelize.define(
  'CollaborationAnnotation',
  {
    assetId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: false },
    annotationType: {
      type: DataTypes.ENUM(...COLLABORATION_ANNOTATION_TYPES),
      allowNull: false,
      defaultValue: 'comment',
    },
    status: {
      type: DataTypes.ENUM(...COLLABORATION_ANNOTATION_STATUSES),
      allowNull: false,
      defaultValue: 'open',
    },
    body: { type: DataTypes.TEXT, allowNull: false },
    context: { type: jsonType, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'collaboration_annotations',
    indexes: [
      { fields: ['assetId'] },
      { fields: ['authorId'] },
      { fields: ['status'] },
    ],
  },
);

CollaborationAnnotation.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    assetId: plain.assetId,
    authorId: plain.authorId,
    annotationType: plain.annotationType,
    status: plain.status,
    body: plain.body,
    context: plain.context,
    occurredAt: plain.occurredAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CollaborationRepository = sequelize.define(
  'CollaborationRepository',
  {
    spaceId: { type: DataTypes.INTEGER, allowNull: false },
    provider: { type: DataTypes.STRING(120), allowNull: false },
    repositoryName: { type: DataTypes.STRING(200), allowNull: false },
    branch: { type: DataTypes.STRING(120), allowNull: true },
    integrationStatus: {
      type: DataTypes.ENUM(...COLLABORATION_REPOSITORY_STATUSES),
      allowNull: false,
      defaultValue: 'connected',
    },
    settings: { type: jsonType, allowNull: true },
    syncMetadata: { type: jsonType, allowNull: true },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'collaboration_repositories',
    indexes: [
      { fields: ['spaceId'] },
      { fields: ['provider'] },
      { fields: ['integrationStatus'] },
      { unique: true, fields: ['spaceId', 'provider', 'repositoryName'] },
    ],
  },
);

CollaborationRepository.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    spaceId: plain.spaceId,
    provider: plain.provider,
    repositoryName: plain.repositoryName,
    branch: plain.branch,
    integrationStatus: plain.integrationStatus,
    settings: plain.settings,
    syncMetadata: plain.syncMetadata,
    lastSyncedAt: plain.lastSyncedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CollaborationAiSession = sequelize.define(
  'CollaborationAiSession',
  {
    spaceId: { type: DataTypes.INTEGER, allowNull: false },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    sessionType: {
      type: DataTypes.ENUM(...COLLABORATION_AI_SESSION_TYPES),
      allowNull: false,
      defaultValue: 'summary',
    },
    status: {
      type: DataTypes.ENUM(...COLLABORATION_AI_SESSION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    prompt: { type: DataTypes.TEXT, allowNull: false },
    response: { type: DataTypes.TEXT, allowNull: true },
    metrics: { type: jsonType, allowNull: true },
    ranAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'collaboration_ai_sessions',
    indexes: [
      { fields: ['spaceId'] },
      { fields: ['sessionType'] },
      { fields: ['status'] },
    ],
  },
);

CollaborationAiSession.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    spaceId: plain.spaceId,
    createdById: plain.createdById,
    sessionType: plain.sessionType,
    status: plain.status,
    prompt: plain.prompt,
    response: plain.response,
    metrics: plain.metrics,
    ranAt: plain.ranAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CollaborationSpace.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
CollaborationSpace.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });
CollaborationSpace.hasMany(CollaborationParticipant, {
  foreignKey: 'spaceId',
  as: 'participants',
  onDelete: 'CASCADE',
});
CollaborationSpace.hasMany(CollaborationRoom, { foreignKey: 'spaceId', as: 'rooms', onDelete: 'CASCADE' });
CollaborationSpace.hasMany(CollaborationAsset, { foreignKey: 'spaceId', as: 'assets', onDelete: 'CASCADE' });
CollaborationSpace.hasMany(CollaborationRepository, {
  foreignKey: 'spaceId',
  as: 'repositories',
  onDelete: 'CASCADE',
});
CollaborationSpace.hasMany(CollaborationAiSession, {
  foreignKey: 'spaceId',
  as: 'aiSessions',
  onDelete: 'CASCADE',
});

CollaborationParticipant.belongsTo(CollaborationSpace, { foreignKey: 'spaceId', as: 'space' });
CollaborationParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

CollaborationRoom.belongsTo(CollaborationSpace, { foreignKey: 'spaceId', as: 'space' });

CollaborationAsset.belongsTo(CollaborationSpace, { foreignKey: 'spaceId', as: 'space' });
CollaborationAsset.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploader' });
CollaborationAsset.hasMany(CollaborationAnnotation, {
  foreignKey: 'assetId',
  as: 'annotations',
  onDelete: 'CASCADE',
});

CollaborationAnnotation.belongsTo(CollaborationAsset, { foreignKey: 'assetId', as: 'asset' });
CollaborationAnnotation.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

CollaborationRepository.belongsTo(CollaborationSpace, { foreignKey: 'spaceId', as: 'space' });

CollaborationAiSession.belongsTo(CollaborationSpace, { foreignKey: 'spaceId', as: 'space' });
CollaborationAiSession.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
User.hasMany(Gig, { foreignKey: 'ownerId', as: 'gigs' });
Gig.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Gig.hasMany(GigPackage, { foreignKey: 'gigId', as: 'packages', onDelete: 'CASCADE', hooks: true });
GigPackage.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });

Gig.hasMany(GigAddOn, { foreignKey: 'gigId', as: 'addOns', onDelete: 'CASCADE', hooks: true });
GigAddOn.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });

Gig.hasMany(GigAvailabilitySlot, { foreignKey: 'gigId', as: 'availabilitySlots', onDelete: 'CASCADE', hooks: true });
GigAvailabilitySlot.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });

export const FinanceRevenueEntry = sequelize.define(
  'FinanceRevenueEntry',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    revenueType: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: { isIn: [FINANCE_REVENUE_TYPES] },
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'recognized',
      validate: { isIn: [FINANCE_REVENUE_STATUSES] },
    },
    source: { type: DataTypes.STRING(64), allowNull: true },
    clientName: { type: DataTypes.STRING(255), allowNull: true },
    invoiceNumber: { type: DataTypes.STRING(64), allowNull: true },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: { len: [3, 3] },
    },
    taxWithholdingAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    taxCategory: { type: DataTypes.STRING(64), allowNull: true },
    recognizedAt: { type: DataTypes.DATE, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'finance_revenue_entries',
    indexes: [
      { fields: ['userId', 'recognizedAt'] },
      { fields: ['userId', 'revenueType'] },
    ],
  },
);

FinanceRevenueEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    revenueType: plain.revenueType,
    status: plain.status,
    source: plain.source,
    clientName: plain.clientName,
    invoiceNumber: plain.invoiceNumber,
    amount: Number(plain.amount ?? 0),
    currencyCode: plain.currencyCode,
    taxWithholdingAmount: Number(plain.taxWithholdingAmount ?? 0),
    taxCategory: plain.taxCategory,
    recognizedAt: plain.recognizedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyAlliance = sequelize.define(
  'AgencyAlliance',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM(...AGENCY_ALLIANCE_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
      validate: { isIn: [AGENCY_ALLIANCE_STATUSES] },
    },
    allianceType: {
      type: DataTypes.ENUM(...AGENCY_ALLIANCE_TYPES),
      allowNull: false,
      defaultValue: 'delivery_pod',
      validate: { isIn: [AGENCY_ALLIANCE_TYPES] },
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    focusAreas: { type: jsonType, allowNull: true },
    defaultRevenueSplit: { type: jsonType, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    nextReviewAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'agency_alliances',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['allianceType'] },
    ],
  },
);

AgencyAlliance.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    slug: plain.slug,
    status: plain.status,
    allianceType: plain.allianceType,
    description: plain.description,
    focusAreas: plain.focusAreas ?? [],
    defaultRevenueSplit: plain.defaultRevenueSplit ?? null,
    startDate: plain.startDate,
    endDate: plain.endDate,
    nextReviewAt: plain.nextReviewAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyAllianceMember = sequelize.define(
  'AgencyAllianceMember',
  {
    allianceId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    workspaceMemberId: { type: DataTypes.INTEGER, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    role: {
      type: DataTypes.ENUM(...AGENCY_ALLIANCE_MEMBER_ROLES),
      allowNull: false,
      defaultValue: 'contributor',
      validate: { isIn: [AGENCY_ALLIANCE_MEMBER_ROLES] },
    },
    status: {
      type: DataTypes.ENUM(...AGENCY_ALLIANCE_MEMBER_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
      validate: { isIn: [AGENCY_ALLIANCE_MEMBER_STATUSES] },
    },
    joinDate: { type: DataTypes.DATE, allowNull: true },
    exitDate: { type: DataTypes.DATE, allowNull: true },
    commitmentHours: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    revenueSharePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    objectives: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_alliance_members',
    indexes: [
      { fields: ['allianceId', 'status'] },
      { fields: ['userId'] },
    ],
  },
);

AgencyAllianceMember.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    allianceId: plain.allianceId,
    workspaceId: plain.workspaceId,
    workspaceMemberId: plain.workspaceMemberId,
    userId: plain.userId,
    role: plain.role,
    status: plain.status,
    joinDate: plain.joinDate,
    exitDate: plain.exitDate,
    commitmentHours: plain.commitmentHours ? Number.parseFloat(plain.commitmentHours) : null,
    revenueSharePercent: plain.revenueSharePercent ? Number.parseFloat(plain.revenueSharePercent) : null,
    objectives: plain.objectives ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyAlliancePod = sequelize.define(
  'AgencyAlliancePod',
  {
    allianceId: { type: DataTypes.INTEGER, allowNull: false },
    leadMemberId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    focusArea: { type: DataTypes.STRING(255), allowNull: true },
    podType: {
      type: DataTypes.ENUM(...AGENCY_ALLIANCE_POD_TYPES),
      allowNull: false,
      defaultValue: 'delivery',
      validate: { isIn: [AGENCY_ALLIANCE_POD_TYPES] },
    },
    status: {
      type: DataTypes.ENUM(...AGENCY_ALLIANCE_POD_STATUSES),
      allowNull: false,
      defaultValue: 'forming',
      validate: { isIn: [AGENCY_ALLIANCE_POD_STATUSES] },
    },
    backlogValue: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    capacityTarget: { type: DataTypes.INTEGER, allowNull: true },
    externalNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'agency_alliance_pods',
    indexes: [
      { fields: ['allianceId'] },
      { fields: ['status'] },
    ],
  },
);

AgencyAlliancePod.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    allianceId: plain.allianceId,
    leadMemberId: plain.leadMemberId,
    name: plain.name,
    focusArea: plain.focusArea,
    podType: plain.podType,
    status: plain.status,
    backlogValue: plain.backlogValue ? Number.parseFloat(plain.backlogValue) : null,
    capacityTarget: plain.capacityTarget,
    externalNotes: plain.externalNotes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyAlliancePodMember = sequelize.define(
  'AgencyAlliancePodMember',
  {
    podId: { type: DataTypes.INTEGER, allowNull: false },
    allianceMemberId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.STRING(120), allowNull: false },
    weeklyCommitmentHours: { type: DataTypes.INTEGER, allowNull: true },
    utilizationTarget: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'agency_alliance_pod_members',
    indexes: [
      { fields: ['podId'] },
      { fields: ['allianceMemberId'] },
    ],
  },
);

AgencyAlliancePodMember.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    podId: plain.podId,
    allianceMemberId: plain.allianceMemberId,
    role: plain.role,
    weeklyCommitmentHours: plain.weeklyCommitmentHours,
    utilizationTarget: plain.utilizationTarget,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyAllianceResourceSlot = sequelize.define(
  'AgencyAllianceResourceSlot',
  {
    allianceId: { type: DataTypes.INTEGER, allowNull: false },
    allianceMemberId: { type: DataTypes.INTEGER, allowNull: false },
    weekStartDate: { type: DataTypes.DATEONLY, allowNull: false },
    plannedHours: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    bookedHours: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    engagementType: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'agency_alliance_resource_slots',
    indexes: [
      { fields: ['allianceId', 'weekStartDate'] },
      { fields: ['allianceMemberId'] },
    ],
  },
);

AgencyAllianceResourceSlot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    allianceId: plain.allianceId,
    allianceMemberId: plain.allianceMemberId,
    weekStartDate: plain.weekStartDate,
    plannedHours: Number.parseFloat(plain.plannedHours ?? 0),
    bookedHours: Number.parseFloat(plain.bookedHours ?? 0),
    engagementType: plain.engagementType,
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyAllianceRateCard = sequelize.define(
  'AgencyAllianceRateCard',
  {
    allianceId: { type: DataTypes.INTEGER, allowNull: false },
    version: { type: DataTypes.INTEGER, allowNull: false },
    serviceLine: { type: DataTypes.STRING(200), allowNull: false },
    deliveryModel: { type: DataTypes.STRING(120), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    unit: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'hour' },
    rate: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM(...AGENCY_ALLIANCE_RATE_CARD_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [AGENCY_ALLIANCE_RATE_CARD_STATUSES] },
    },
    effectiveFrom: { type: DataTypes.DATE, allowNull: true },
    effectiveTo: { type: DataTypes.DATE, allowNull: true },
    changeSummary: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'agency_alliance_rate_cards',
    indexes: [
      { unique: true, fields: ['allianceId', 'serviceLine', 'version'] },
      { fields: ['status'] },
    ],
  },
);

AgencyAllianceRateCard.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    allianceId: plain.allianceId,
    version: plain.version,
    serviceLine: plain.serviceLine,
    deliveryModel: plain.deliveryModel,
    currency: plain.currency,
    unit: plain.unit,
    rate: Number.parseFloat(plain.rate ?? 0),
    status: plain.status,
    effectiveFrom: plain.effectiveFrom,
    effectiveTo: plain.effectiveTo,
    changeSummary: plain.changeSummary,
    createdById: plain.createdById,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyAllianceRateCardApproval = sequelize.define(
  'AgencyAllianceRateCardApproval',
  {
    rateCardId: { type: DataTypes.INTEGER, allowNull: false },
    approverId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...AGENCY_ALLIANCE_RATE_CARD_APPROVAL_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [AGENCY_ALLIANCE_RATE_CARD_APPROVAL_STATUSES] },
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
    decidedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'agency_alliance_rate_card_approvals',
    indexes: [
      { fields: ['rateCardId'] },
      { fields: ['status'] },
    ],
  },
);

AgencyAllianceRateCardApproval.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    rateCardId: plain.rateCardId,
    approverId: plain.approverId,
    status: plain.status,
    comment: plain.comment,
    decidedAt: plain.decidedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyAllianceRevenueSplit = sequelize.define(
  'AgencyAllianceRevenueSplit',
  {
    allianceId: { type: DataTypes.INTEGER, allowNull: false },
    splitType: {
      type: DataTypes.ENUM(...AGENCY_ALLIANCE_REVENUE_SPLIT_TYPES),
      allowNull: false,
      defaultValue: 'fixed',
      validate: { isIn: [AGENCY_ALLIANCE_REVENUE_SPLIT_TYPES] },
    },
    terms: { type: jsonType, allowNull: false },
    status: {
      type: DataTypes.ENUM(...AGENCY_ALLIANCE_REVENUE_SPLIT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [AGENCY_ALLIANCE_REVENUE_SPLIT_STATUSES] },
    },
    effectiveFrom: { type: DataTypes.DATE, allowNull: false },
    effectiveTo: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    approvedById: { type: DataTypes.INTEGER, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'agency_alliance_revenue_splits',
    indexes: [
      { fields: ['allianceId'] },
      { fields: ['status'] },
    ],
  },
);

AgencyAllianceRevenueSplit.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    allianceId: plain.allianceId,
    splitType: plain.splitType,
    terms: plain.terms,
    status: plain.status,
    effectiveFrom: plain.effectiveFrom,
    effectiveTo: plain.effectiveTo,
    createdById: plain.createdById,
    approvedById: plain.approvedById,
    approvedAt: plain.approvedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const EscrowAccount = sequelize.define(
  'EscrowAccount',
export const FinanceExpenseEntry = sequelize.define(
  'FinanceExpenseEntry',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(64), allowNull: false },
    vendorName: { type: DataTypes.STRING(255), allowNull: true },
    cadence: { type: DataTypes.STRING(32), allowNull: true },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'posted',
      validate: { isIn: [FINANCE_EXPENSE_STATUSES] },
    },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: { len: [3, 3] },
    },
    occurredAt: { type: DataTypes.DATE, allowNull: false },
    isTaxDeductible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    receiptUrl: { type: DataTypes.STRING(1000), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'finance_expense_entries',
    indexes: [
      { fields: ['userId', 'occurredAt'] },
      { fields: ['userId', 'category'] },
    ],
  },
);

FinanceExpenseEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    category: plain.category,
    vendorName: plain.vendorName,
    cadence: plain.cadence,
    status: plain.status,
    amount: Number(plain.amount ?? 0),
    currencyCode: plain.currencyCode,
    occurredAt: plain.occurredAt,
    isTaxDeductible: plain.isTaxDeductible,
    notes: plain.notes,
    receiptUrl: plain.receiptUrl,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FinanceSavingsGoal = sequelize.define(
  'FinanceSavingsGoal',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [FINANCE_SAVINGS_STATUSES] },
    },
    targetAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currentAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: { len: [3, 3] },
    },
    automationType: {
      type: DataTypes.STRING(32),
      allowNull: true,
      validate: { isIn: [FINANCE_AUTOMATION_TYPES] },
    },
    automationAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    automationCadence: { type: DataTypes.STRING(32), allowNull: true },
    isRunwayReserve: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    lastContributionAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'finance_savings_goals',
    indexes: [{ fields: ['userId', 'status'] }],
  },
);

FinanceSavingsGoal.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    name: plain.name,
    status: plain.status,
    targetAmount: Number(plain.targetAmount ?? 0),
    currentAmount: Number(plain.currentAmount ?? 0),
    currencyCode: plain.currencyCode,
    automationType: plain.automationType,
    automationAmount: plain.automationAmount == null ? null : Number(plain.automationAmount),
    automationCadence: plain.automationCadence,
    isRunwayReserve: plain.isRunwayReserve,
    lastContributionAt: plain.lastContributionAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FinancePayoutBatch = sequelize.define(
  'FinancePayoutBatch',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'completed',
      validate: { isIn: [FINANCE_PAYOUT_STATUSES] },
    },
    totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: { len: [3, 3] },
    },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    executedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'finance_payout_batches',
    indexes: [{ fields: ['userId', 'executedAt'] }],
  },
);

FinancePayoutBatch.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    name: plain.name,
    status: plain.status,
    totalAmount: Number(plain.totalAmount ?? 0),
    currencyCode: plain.currencyCode,
    scheduledAt: plain.scheduledAt,
    executedAt: plain.executedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FinancePayoutSplit = sequelize.define(
  'FinancePayoutSplit',
  {
    batchId: { type: DataTypes.INTEGER, allowNull: false },
    teammateName: { type: DataTypes.STRING(255), allowNull: false },
    teammateRole: { type: DataTypes.STRING(120), allowNull: true },
    recipientEmail: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'completed',
      validate: { isIn: [FINANCE_PAYOUT_STATUSES] },
    },
    sharePercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: { len: [3, 3] },
    },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'finance_payout_splits',
    indexes: [{ fields: ['batchId'] }],
  },
);

FinancePayoutSplit.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    batchId: plain.batchId,
    teammateName: plain.teammateName,
    teammateRole: plain.teammateRole,
    recipientEmail: plain.recipientEmail,
    status: plain.status,
    sharePercentage: plain.sharePercentage == null ? null : Number(plain.sharePercentage),
    amount: Number(plain.amount ?? 0),
    currencyCode: plain.currencyCode,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FinanceForecastScenario = sequelize.define(
  'FinanceForecastScenario',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(255), allowNull: false },
    scenarioType: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: { isIn: [FINANCE_FORECAST_SCENARIO_TYPES] },
    },
    timeframe: { type: DataTypes.STRING(64), allowNull: true },
    confidence: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    projectedAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: { len: [3, 3] },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    generatedAt: { type: DataTypes.DATE, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'finance_forecast_scenarios',
    indexes: [
      { fields: ['userId', 'generatedAt'] },
      { fields: ['userId', 'scenarioType'] },
    ],
  },
);

export const PipelineBoard = sequelize.define(
  'PipelineBoard',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    ownerType: {
      type: DataTypes.ENUM(...PIPELINE_OWNER_TYPES),
      allowNull: false,
      defaultValue: 'freelancer',
      validate: { isIn: [PIPELINE_OWNER_TYPES] },
    },
    name: { type: DataTypes.STRING(160), allowNull: false },
    grouping: {
      type: DataTypes.ENUM(...PIPELINE_BOARD_GROUPINGS),
      allowNull: false,
      defaultValue: 'industry',
      validate: { isIn: [PIPELINE_BOARD_GROUPINGS] },
    },
    filters: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'pipeline_boards',
    indexes: [
      { fields: ['ownerId', 'ownerType'] },
    ],
  },
);

export const PipelineStage = sequelize.define(
  'PipelineStage',
  {
    boardId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    winProbability: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    statusCategory: {
      type: DataTypes.ENUM(...PIPELINE_STAGE_CATEGORIES),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [PIPELINE_STAGE_CATEGORIES] },
    },
  },
  {
    tableName: 'pipeline_stages',
    indexes: [
      { fields: ['boardId', 'position'] },
    ],
  },
);

export const PipelineCampaign = sequelize.define(
  'PipelineCampaign',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    ownerType: {
      type: DataTypes.ENUM(...PIPELINE_OWNER_TYPES),
      allowNull: false,
      defaultValue: 'freelancer',
      validate: { isIn: [PIPELINE_OWNER_TYPES] },
    },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    targetService: { type: DataTypes.STRING(160), allowNull: true },
    status: {
      type: DataTypes.ENUM(...PIPELINE_CAMPAIGN_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [PIPELINE_CAMPAIGN_STATUSES] },
    },
    playbook: { type: jsonType, allowNull: true },
    metrics: { type: jsonType, allowNull: true },
    launchDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'pipeline_campaigns',
    indexes: [
      { fields: ['ownerId', 'ownerType'] },
      { fields: ['status'] },
    ],
  },
);

export const PipelineDeal = sequelize.define(
  'PipelineDeal',
  {
    boardId: { type: DataTypes.INTEGER, allowNull: false },
    stageId: { type: DataTypes.INTEGER, allowNull: false },
    campaignId: { type: DataTypes.INTEGER, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    ownerType: {
      type: DataTypes.ENUM(...PIPELINE_OWNER_TYPES),
      allowNull: false,
      defaultValue: 'freelancer',
      validate: { isIn: [PIPELINE_OWNER_TYPES] },
    },
    title: { type: DataTypes.STRING(180), allowNull: false },
    clientName: { type: DataTypes.STRING(180), allowNull: false },
    industry: { type: DataTypes.STRING(120), allowNull: true },
    retainerSize: { type: DataTypes.STRING(60), allowNull: true },
    pipelineValue: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    winProbability: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM(...PIPELINE_DEAL_STATUSES),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [PIPELINE_DEAL_STATUSES] },
    },
    source: { type: DataTypes.STRING(120), allowNull: true },
    lastContactAt: { type: DataTypes.DATE, allowNull: true },
    nextFollowUpAt: { type: DataTypes.DATE, allowNull: true },
    expectedCloseDate: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'pipeline_deals',
    indexes: [
      { fields: ['boardId', 'stageId'] },
      { fields: ['ownerId', 'ownerType'] },
      { fields: ['status'] },
      { fields: ['industry'] },
      { fields: ['retainerSize'] },
    ],
  },
);

export const PipelineProposalTemplate = sequelize.define(
  'PipelineProposalTemplate',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    ownerType: {
      type: DataTypes.ENUM(...PIPELINE_OWNER_TYPES),
      allowNull: false,
      defaultValue: 'freelancer',
      validate: { isIn: [PIPELINE_OWNER_TYPES] },
    },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    caseStudies: { type: jsonType, allowNull: true },
    roiCalculator: { type: jsonType, allowNull: true },
    pricingModel: { type: jsonType, allowNull: true },
    isArchived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'pipeline_proposal_templates',
    indexes: [
      { fields: ['ownerId', 'ownerType'] },
      { fields: ['isArchived'] },
    ],
  },
);

export const PipelineProposal = sequelize.define(
  'PipelineProposal',
  {
    dealId: { type: DataTypes.INTEGER, allowNull: false },
    templateId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...PIPELINE_PROPOSAL_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [PIPELINE_PROPOSAL_STATUSES] },
    },
    version: { type: DataTypes.STRING(30), allowNull: true },
    pricing: { type: jsonType, allowNull: true },
    roiModel: { type: jsonType, allowNull: true },
    caseStudies: { type: jsonType, allowNull: true },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    acceptedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'pipeline_proposals' },
);

export const PipelineFollowUp = sequelize.define(
  'PipelineFollowUp',
  {
    dealId: { type: DataTypes.INTEGER, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    ownerType: {
      type: DataTypes.ENUM(...PIPELINE_OWNER_TYPES),
      allowNull: false,
      defaultValue: 'freelancer',
      validate: { isIn: [PIPELINE_OWNER_TYPES] },
    },
    dueAt: { type: DataTypes.DATE, allowNull: false },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    channel: { type: DataTypes.STRING(80), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...PIPELINE_FOLLOW_UP_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [PIPELINE_FOLLOW_UP_STATUSES] },
    },
  },
  {
    tableName: 'pipeline_follow_ups',
    indexes: [
      { fields: ['ownerId', 'ownerType'] },
      { fields: ['dealId', 'status'] },
      { fields: ['dueAt'] },
    ],
  },
);

AutoAssignQueueEntry.prototype.toPublicObject = function toPublicObject() {
FinanceForecastScenario.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    label: plain.label,
    scenarioType: plain.scenarioType,
    timeframe: plain.timeframe,
    confidence: plain.confidence == null ? null : Number(plain.confidence),
    projectedAmount: Number(plain.projectedAmount ?? 0),
    currencyCode: plain.currencyCode,
    notes: plain.notes,
    generatedAt: plain.generatedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

PipelineBoard.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    ownerId: plain.ownerId,
    ownerType: plain.ownerType,
    name: plain.name,
    grouping: plain.grouping,
    filters: plain.filters,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

PipelineStage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    boardId: plain.boardId,
    name: plain.name,
    position: plain.position,
    winProbability: plain.winProbability == null ? null : Number(plain.winProbability),
    statusCategory: plain.statusCategory,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

PipelineCampaign.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    ownerId: plain.ownerId,
    ownerType: plain.ownerType,
    name: plain.name,
    description: plain.description,
    targetService: plain.targetService,
    status: plain.status,
    playbook: plain.playbook,
    metrics: plain.metrics,
    launchDate: plain.launchDate,
    endDate: plain.endDate,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

PipelineDeal.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    boardId: plain.boardId,
    stageId: plain.stageId,
    campaignId: plain.campaignId,
    ownerId: plain.ownerId,
    ownerType: plain.ownerType,
    title: plain.title,
    clientName: plain.clientName,
    industry: plain.industry,
    retainerSize: plain.retainerSize,
    pipelineValue: plain.pipelineValue == null ? null : Number(plain.pipelineValue),
    winProbability: plain.winProbability == null ? null : Number(plain.winProbability),
    status: plain.status,
    source: plain.source,
    lastContactAt: plain.lastContactAt,
    nextFollowUpAt: plain.nextFollowUpAt,
    expectedCloseDate: plain.expectedCloseDate,
    notes: plain.notes,
    tags: plain.tags,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

PipelineProposalTemplate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    ownerId: plain.ownerId,
    ownerType: plain.ownerType,
    name: plain.name,
    description: plain.description,
    caseStudies: plain.caseStudies,
    roiCalculator: plain.roiCalculator,
    pricingModel: plain.pricingModel,
    isArchived: plain.isArchived,
    lastUsedAt: plain.lastUsedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

PipelineProposal.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    dealId: plain.dealId,
    templateId: plain.templateId,
    title: plain.title,
    summary: plain.summary,
    status: plain.status,
    version: plain.version,
    pricing: plain.pricing,
    roiModel: plain.roiModel,
    caseStudies: plain.caseStudies,
    sentAt: plain.sentAt,
    acceptedAt: plain.acceptedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

PipelineFollowUp.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    dealId: plain.dealId,
    ownerId: plain.ownerId,
    ownerType: plain.ownerType,
    dueAt: plain.dueAt,
    completedAt: plain.completedAt,
    channel: plain.channel,
    note: plain.note,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

SearchSubscription.prototype.toPublicObject = function toPublicObject() {
export const FinanceTaxExport = sequelize.define(
  'FinanceTaxExport',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    exportType: { type: DataTypes.STRING(32), allowNull: false },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'available',
      validate: { isIn: [FINANCE_TAX_EXPORT_STATUSES] },
    },
    periodStart: { type: DataTypes.DATE, allowNull: false },
    periodEnd: { type: DataTypes.DATE, allowNull: false },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: { len: [3, 3] },
    },
    downloadUrl: { type: DataTypes.STRING(1000), allowNull: true },
    generatedAt: { type: DataTypes.DATE, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'finance_tax_exports',
    indexes: [{ fields: ['userId', 'periodEnd'] }],
  },
);

FinanceTaxExport.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    exportType: plain.exportType,
    status: plain.status,
    periodStart: plain.periodStart,
    periodEnd: plain.periodEnd,
    amount: Number(plain.amount ?? 0),
    currencyCode: plain.currencyCode,
    downloadUrl: plain.downloadUrl,
    generatedAt: plain.generatedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

User.hasOne(Profile, { foreignKey: 'userId' });
Profile.belongsTo(User, { foreignKey: 'userId' });
Profile.hasMany(ProfileReference, { as: 'references', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileReference.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
Profile.hasMany(ProfileAppreciation, { as: 'appreciations', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileAppreciation.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
ProfileAppreciation.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });
Profile.hasMany(ProfileFollower, { as: 'followers', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileFollower.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
ProfileFollower.belongsTo(User, { as: 'follower', foreignKey: 'followerId' });
Profile.hasMany(ProfileEngagementJob, { as: 'engagementJobs', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileEngagementJob.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });

Profile.hasMany(CommunitySpotlight, { foreignKey: 'profileId', as: 'communitySpotlights', onDelete: 'CASCADE' });
CommunitySpotlight.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });
CommunitySpotlight.hasMany(CommunitySpotlightHighlight, {
  foreignKey: 'spotlightId',
  as: 'highlights',
  onDelete: 'CASCADE',
});
CommunitySpotlight.hasMany(CommunitySpotlightAsset, {
  foreignKey: 'spotlightId',
  as: 'assets',
  onDelete: 'CASCADE',
});
CommunitySpotlight.hasMany(CommunitySpotlightNewsletterFeature, {
  foreignKey: 'spotlightId',
  as: 'newsletterFeatures',
  onDelete: 'CASCADE',
});
CommunitySpotlightHighlight.belongsTo(CommunitySpotlight, { foreignKey: 'spotlightId', as: 'spotlight' });
CommunitySpotlightAsset.belongsTo(CommunitySpotlight, { foreignKey: 'spotlightId', as: 'spotlight' });
CommunitySpotlightNewsletterFeature.belongsTo(CommunitySpotlight, { foreignKey: 'spotlightId', as: 'spotlight' });
Profile.hasMany(FreelancerExpertiseArea, { as: 'expertiseAreas', foreignKey: 'profileId', onDelete: 'CASCADE' });
FreelancerExpertiseArea.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });

Profile.hasMany(FreelancerSuccessMetric, { as: 'successMetrics', foreignKey: 'profileId', onDelete: 'CASCADE' });
FreelancerSuccessMetric.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });

Profile.hasMany(FreelancerTestimonial, { as: 'testimonials', foreignKey: 'profileId', onDelete: 'CASCADE' });
FreelancerTestimonial.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });

Profile.hasMany(FreelancerHeroBanner, { as: 'heroBanners', foreignKey: 'profileId', onDelete: 'CASCADE' });
FreelancerHeroBanner.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });

User.hasOne(CompanyProfile, { foreignKey: 'userId' });
CompanyProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(AgencyProfile, { foreignKey: 'userId' });
AgencyProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(FreelancerProfile, { foreignKey: 'userId' });
FreelancerProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ReputationTestimonial, { foreignKey: 'freelancerId', as: 'reputationTestimonials' });
ReputationTestimonial.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(ReputationSuccessStory, { foreignKey: 'freelancerId', as: 'reputationSuccessStories' });
ReputationSuccessStory.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(ReputationMetric, { foreignKey: 'freelancerId', as: 'reputationMetrics' });
ReputationMetric.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(ReputationBadge, { foreignKey: 'freelancerId', as: 'reputationBadges' });
ReputationBadge.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(ReputationReviewWidget, { foreignKey: 'freelancerId', as: 'reputationReviewWidgets' });
ReputationReviewWidget.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasOne(FreelancerAssignmentMetric, { foreignKey: 'freelancerId', as: 'assignmentMetric' });
FreelancerAssignmentMetric.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerFinanceMetric, { foreignKey: 'freelancerId', as: 'financeMetrics' });
FreelancerFinanceMetric.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerRevenueMonthly, { foreignKey: 'freelancerId', as: 'revenueMonths' });
FreelancerRevenueMonthly.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerRevenueStream, { foreignKey: 'freelancerId', as: 'revenueStreams' });
FreelancerRevenueStream.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerPayout, { foreignKey: 'freelancerId', as: 'payouts' });
FreelancerPayout.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerTaxEstimate, { foreignKey: 'freelancerId', as: 'taxEstimates' });
FreelancerTaxEstimate.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerTaxFiling, { foreignKey: 'freelancerId', as: 'taxFilings' });
FreelancerTaxFiling.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerDeductionSummary, { foreignKey: 'freelancerId', as: 'deductionSummaries' });
FreelancerDeductionSummary.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerProfitabilityMetric, { foreignKey: 'freelancerId', as: 'profitabilityMetrics' });
FreelancerProfitabilityMetric.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerCostBreakdown, { foreignKey: 'freelancerId', as: 'costBreakdowns' });
FreelancerCostBreakdown.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerSavingsGoal, { foreignKey: 'freelancerId', as: 'savingsGoals' });
FreelancerSavingsGoal.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerFinanceControl, { foreignKey: 'freelancerId', as: 'financeControls' });
FreelancerFinanceControl.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(CareerAnalyticsSnapshot, { foreignKey: 'userId', as: 'careerAnalyticsSnapshots' });
CareerAnalyticsSnapshot.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CareerPeerBenchmark, { foreignKey: 'userId', as: 'careerPeerBenchmarks' });
CareerPeerBenchmark.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(WeeklyDigestSubscription, { foreignKey: 'userId', as: 'weeklyDigestSubscription' });
WeeklyDigestSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CalendarIntegration, { foreignKey: 'userId', as: 'calendarIntegrations' });
CalendarIntegration.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CandidateCalendarEvent, { foreignKey: 'userId', as: 'calendarEvents' });
CandidateCalendarEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(FocusSession, { foreignKey: 'userId', as: 'focusSessions' });
FocusSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AdvisorCollaboration, { foreignKey: 'ownerId', as: 'advisorCollaborations' });
AdvisorCollaboration.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

AdvisorCollaboration.hasMany(AdvisorCollaborationMember, { foreignKey: 'collaborationId', as: 'members' });
AdvisorCollaborationMember.belongsTo(AdvisorCollaboration, { foreignKey: 'collaborationId', as: 'collaboration' });
AdvisorCollaborationMember.belongsTo(User, { foreignKey: 'userId', as: 'member' });

AdvisorCollaboration.hasMany(AdvisorCollaborationAuditLog, { foreignKey: 'collaborationId', as: 'auditLogs' });
AdvisorCollaborationAuditLog.belongsTo(AdvisorCollaboration, { foreignKey: 'collaborationId', as: 'collaboration' });
AdvisorCollaborationAuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

AdvisorCollaboration.hasMany(AdvisorDocumentRoom, { foreignKey: 'collaborationId', as: 'documentRooms' });
AdvisorDocumentRoom.belongsTo(AdvisorCollaboration, { foreignKey: 'collaborationId', as: 'collaboration' });
AdvisorDocumentRoom.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(AdvisorDocumentRoom, { foreignKey: 'ownerId', as: 'advisorDocumentRooms' });

User.hasMany(SupportAutomationLog, { foreignKey: 'userId', as: 'supportAutomationLogs' });
SupportAutomationLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Gig.hasMany(GigOrder, { foreignKey: 'gigId', as: 'orders' });
GigOrder.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });

User.hasMany(GigOrder, { foreignKey: 'clientId', as: 'purchasedGigOrders' });
User.hasMany(GigOrder, { foreignKey: 'freelancerId', as: 'fulfilledGigOrders' });
GigOrder.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
GigOrder.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

GigOrder.hasMany(GigOrderRequirement, { foreignKey: 'orderId', as: 'requirements' });
GigOrderRequirement.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });

GigOrder.hasMany(GigOrderRevision, { foreignKey: 'orderId', as: 'revisions' });
GigOrderRevision.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });

GigOrder.hasMany(GigOrderPayout, { foreignKey: 'orderId', as: 'payouts' });
GigOrderPayout.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });

GigOrder.hasMany(GigOrderActivity, { foreignKey: 'orderId', as: 'activities' });
GigOrderActivity.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });
GigOrderActivity.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
User.hasMany(GigOrderActivity, { foreignKey: 'freelancerId', as: 'gigOrderActivities' });
Project.hasOne(ProjectWorkspace, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'workspace',
  onDelete: 'CASCADE',
});
ProjectWorkspace.belongsTo(Project, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'project',
});
ProjectWorkspace.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });

ProjectWorkspace.hasOne(ProjectWorkspaceBrief, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'brief',
  onDelete: 'CASCADE',
});
ProjectWorkspaceBrief.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspaceBrief.belongsTo(User, { foreignKey: 'lastUpdatedById', as: 'lastUpdatedBy' });

ProjectWorkspace.hasMany(ProjectWorkspaceWhiteboard, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'whiteboards',
  onDelete: 'CASCADE',
});
ProjectWorkspaceWhiteboard.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspaceWhiteboard.belongsTo(User, { foreignKey: 'lastEditedById', as: 'lastEditedBy' });

ProjectWorkspace.hasMany(ProjectWorkspaceFile, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'files',
  onDelete: 'CASCADE',
});
ProjectWorkspaceFile.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspaceFile.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

ProjectWorkspace.hasMany(ProjectWorkspaceConversation, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'conversations',
  onDelete: 'CASCADE',
});
ProjectWorkspaceConversation.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});

ProjectWorkspace.hasMany(ProjectWorkspaceApproval, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'approvals',
  onDelete: 'CASCADE',
});
ProjectWorkspaceApproval.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});

Project.hasMany(ProjectAssignmentEvent, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'assignmentEvents',
  constraints: false,
});
ProjectAssignmentEvent.belongsTo(Project, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'project',
  constraints: false,
});
ProjectAssignmentEvent.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

Project.hasMany(SprintCycle, { foreignKey: 'projectId', as: 'sprints' });
SprintCycle.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
SprintCycle.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
SprintCycle.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });
SprintCycle.hasMany(SprintTask, { foreignKey: 'sprintId', as: 'tasks' });
SprintCycle.hasMany(SprintRisk, { foreignKey: 'sprintId', as: 'risks' });
SprintCycle.hasMany(ChangeRequest, { foreignKey: 'sprintId', as: 'changeRequests' });

Project.hasMany(SprintTask, { foreignKey: 'projectId', as: 'sprintTasks' });
SprintTask.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
SprintTask.belongsTo(SprintCycle, { foreignKey: 'sprintId', as: 'sprint' });
SprintTask.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
SprintTask.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
SprintTask.hasMany(SprintTaskDependency, { foreignKey: 'taskId', as: 'dependencies' });
SprintTask.hasMany(SprintTaskDependency, { foreignKey: 'dependsOnTaskId', as: 'dependents' });
SprintTask.hasMany(SprintTaskTimeEntry, { foreignKey: 'taskId', as: 'timeEntries' });

SprintTaskDependency.belongsTo(SprintTask, { foreignKey: 'taskId', as: 'task' });
SprintTaskDependency.belongsTo(SprintTask, { foreignKey: 'dependsOnTaskId', as: 'dependsOn' });

SprintTaskTimeEntry.belongsTo(SprintTask, { foreignKey: 'taskId', as: 'task' });
SprintTaskTimeEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(SprintRisk, { foreignKey: 'projectId', as: 'risks' });
SprintRisk.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
SprintRisk.belongsTo(SprintCycle, { foreignKey: 'sprintId', as: 'sprint' });
SprintRisk.belongsTo(SprintTask, { foreignKey: 'taskId', as: 'task' });
SprintRisk.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Project.hasMany(ChangeRequest, { foreignKey: 'projectId', as: 'changeRequests' });
ChangeRequest.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ChangeRequest.belongsTo(SprintCycle, { foreignKey: 'sprintId', as: 'sprint' });
ChangeRequest.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });
ChangeRequest.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
ClientPortal.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ClientPortal.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
ClientPortal.hasMany(ClientPortalTimelineEvent, {
  foreignKey: 'portalId',
  as: 'timelineEvents',
  onDelete: 'CASCADE',
});
ClientPortalTimelineEvent.belongsTo(ClientPortal, { foreignKey: 'portalId', as: 'portal' });
ClientPortalTimelineEvent.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

ClientPortal.hasMany(ClientPortalScopeItem, {
  foreignKey: 'portalId',
  as: 'scopeItems',
  onDelete: 'CASCADE',
});
ClientPortalScopeItem.belongsTo(ClientPortal, { foreignKey: 'portalId', as: 'portal' });

ClientPortal.hasMany(ClientPortalDecisionLog, {
  foreignKey: 'portalId',
  as: 'decisions',
  onDelete: 'CASCADE',
});
ClientPortalDecisionLog.belongsTo(ClientPortal, { foreignKey: 'portalId', as: 'portal' });
ClientPortalDecisionLog.belongsTo(User, { foreignKey: 'decidedById', as: 'decidedBy' });

ClientPortal.hasMany(ClientPortalInsightWidget, {
  foreignKey: 'portalId',
  as: 'insightWidgets',
  onDelete: 'CASCADE',
});
ClientPortalInsightWidget.belongsTo(ClientPortal, { foreignKey: 'portalId', as: 'portal' });
Project.hasOne(ProjectBlueprint, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'blueprint',
  onDelete: 'CASCADE',
});
ProjectBlueprint.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

ProjectBlueprint.hasMany(ProjectBlueprintSprint, {
  foreignKey: { name: 'blueprintId', allowNull: false },
  as: 'sprints',
  onDelete: 'CASCADE',
});
ProjectBlueprintSprint.belongsTo(ProjectBlueprint, { foreignKey: 'blueprintId', as: 'blueprint' });

ProjectBlueprint.hasMany(ProjectBlueprintDependency, {
  foreignKey: { name: 'blueprintId', allowNull: false },
  as: 'dependencies',
  onDelete: 'CASCADE',
});
ProjectBlueprintDependency.belongsTo(ProjectBlueprint, { foreignKey: 'blueprintId', as: 'blueprint' });
ProjectBlueprintDependency.belongsTo(ProjectBlueprintSprint, {
  foreignKey: 'impactedSprintId',
  as: 'impactedSprint',
});
ProjectBlueprintSprint.hasMany(ProjectBlueprintDependency, {
  foreignKey: 'impactedSprintId',
  as: 'linkedDependencies',
});

ProjectBlueprint.hasMany(ProjectBlueprintRisk, {
  foreignKey: { name: 'blueprintId', allowNull: false },
  as: 'risks',
  onDelete: 'CASCADE',
});
ProjectBlueprintRisk.belongsTo(ProjectBlueprint, { foreignKey: 'blueprintId', as: 'blueprint' });

ProjectBlueprint.hasMany(ProjectBillingCheckpoint, {
  foreignKey: { name: 'blueprintId', allowNull: false },
  as: 'billingCheckpoints',
  onDelete: 'CASCADE',
});
ProjectBillingCheckpoint.belongsTo(ProjectBlueprint, { foreignKey: 'blueprintId', as: 'blueprint' });
ProjectBillingCheckpoint.belongsTo(ProjectBlueprintSprint, {
  foreignKey: 'relatedSprintId',
  as: 'relatedSprint',
});
ProjectBlueprintSprint.hasMany(ProjectBillingCheckpoint, {
  foreignKey: 'relatedSprintId',
  as: 'billingCheckpoints',
});

User.hasMany(AutoAssignQueueEntry, { foreignKey: 'freelancerId', as: 'autoAssignQueue' });
AutoAssignQueueEntry.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(Gig, { foreignKey: 'ownerId', as: 'ownedGigs' });
Gig.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Gig.hasMany(GigPackage, { foreignKey: 'gigId', as: 'packages', onDelete: 'CASCADE' });
Gig.hasMany(GigAddon, { foreignKey: 'gigId', as: 'addons', onDelete: 'CASCADE' });
Gig.hasMany(GigMediaAsset, { foreignKey: 'gigId', as: 'mediaAssets', onDelete: 'CASCADE' });
Gig.hasMany(GigCallToAction, { foreignKey: 'gigId', as: 'callToActions', onDelete: 'CASCADE' });
Gig.hasMany(GigPreviewLayout, { foreignKey: 'gigId', as: 'previewLayouts', onDelete: 'CASCADE' });
Gig.hasMany(GigPerformanceSnapshot, { foreignKey: 'gigId', as: 'performanceSnapshots', onDelete: 'CASCADE' });
GigPackage.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });
GigAddon.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });
GigMediaAsset.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });
GigCallToAction.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });
GigPreviewLayout.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });
GigPerformanceSnapshot.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });
User.hasMany(Gig, { foreignKey: 'freelancerId', as: 'gigs' });
Gig.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

Gig.hasMany(GigMilestone, { foreignKey: 'gigId', as: 'milestones' });
GigMilestone.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });

User.hasMany(GigBundle, { foreignKey: 'freelancerId', as: 'gigBundles' });
GigBundle.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
GigBundle.hasMany(GigBundleItem, { foreignKey: 'bundleId', as: 'items' });
GigBundleItem.belongsTo(GigBundle, { foreignKey: 'bundleId', as: 'bundle' });

User.hasMany(GigUpsell, { foreignKey: 'freelancerId', as: 'gigUpsells' });
GigUpsell.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(GigCatalogItem, { foreignKey: 'freelancerId', as: 'gigCatalogItems' });
GigCatalogItem.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FeedPost, { foreignKey: 'userId' });
FeedPost.belongsTo(User, { foreignKey: 'userId' });

User.belongsToMany(Group, { through: GroupMembership, foreignKey: 'userId' });
Group.belongsToMany(User, { through: GroupMembership, foreignKey: 'groupId' });

User.belongsToMany(User, {
  through: Connection,
  as: 'connections',
  foreignKey: 'requesterId',
  otherKey: 'addresseeId',
});

User.hasMany(Application, { foreignKey: 'applicantId', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });

Application.hasMany(ApplicationReview, { foreignKey: 'applicationId', as: 'reviews' });
ApplicationReview.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });
ApplicationReview.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

User.hasMany(FreelancerCatalogBundle, { foreignKey: 'freelancerId', as: 'catalogBundles' });
FreelancerCatalogBundle.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

FreelancerCatalogBundle.hasMany(FreelancerCatalogBundleMetric, { foreignKey: 'bundleId', as: 'metrics' });
FreelancerCatalogBundleMetric.belongsTo(FreelancerCatalogBundle, { foreignKey: 'bundleId', as: 'bundle' });

User.hasMany(FreelancerRepeatClient, { foreignKey: 'freelancerId', as: 'repeatClients' });
FreelancerRepeatClient.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerCrossSellOpportunity, { foreignKey: 'freelancerId', as: 'crossSellOpportunities' });
FreelancerCrossSellOpportunity.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
FreelancerCrossSellOpportunity.belongsTo(FreelancerCatalogBundle, {
  foreignKey: 'fromBundleId',
  as: 'sourceBundle',
});
FreelancerCrossSellOpportunity.belongsTo(FreelancerCatalogBundle, {
  foreignKey: 'toBundleId',
  as: 'targetBundle',
});

User.hasMany(FreelancerKeywordImpression, { foreignKey: 'freelancerId', as: 'keywordImpressions' });
FreelancerKeywordImpression.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerMarginSnapshot, { foreignKey: 'freelancerId', as: 'marginSnapshots' });
FreelancerMarginSnapshot.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
Application.hasMany(InterviewSchedule, { foreignKey: 'applicationId', as: 'interviews' });
InterviewSchedule.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Application.hasMany(CandidateDemographicSnapshot, { foreignKey: 'applicationId', as: 'demographics' });
CandidateDemographicSnapshot.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Application.hasMany(CandidateSatisfactionSurvey, { foreignKey: 'applicationId', as: 'surveys' });
CandidateSatisfactionSurvey.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Job.hasMany(JobStage, { foreignKey: 'jobId', as: 'stages' });
JobStage.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

Job.hasMany(JobApprovalWorkflow, { foreignKey: 'jobId', as: 'approvalWorkflow' });
JobApprovalWorkflow.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

Job.hasMany(JobCampaignPerformance, { foreignKey: 'jobId', as: 'campaignPerformance' });
JobCampaignPerformance.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

ExperienceLaunchpad.hasMany(ExperienceLaunchpadApplication, { foreignKey: 'launchpadId', as: 'applications' });
ExperienceLaunchpadApplication.belongsTo(ExperienceLaunchpad, { foreignKey: 'launchpadId', as: 'launchpad' });
ExperienceLaunchpadApplication.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });
ExperienceLaunchpadApplication.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

ExperienceLaunchpad.hasMany(ExperienceLaunchpadEmployerRequest, {
  foreignKey: 'launchpadId',
  as: 'employerRequests',
});
ExperienceLaunchpadEmployerRequest.belongsTo(ExperienceLaunchpad, {
  foreignKey: 'launchpadId',
  as: 'launchpad',
});
ExperienceLaunchpadEmployerRequest.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

ExperienceLaunchpad.hasMany(ExperienceLaunchpadPlacement, { foreignKey: 'launchpadId', as: 'placements' });
ExperienceLaunchpadPlacement.belongsTo(ExperienceLaunchpad, { foreignKey: 'launchpadId', as: 'launchpad' });
ExperienceLaunchpadPlacement.belongsTo(ExperienceLaunchpadApplication, {
  foreignKey: 'candidateId',
  as: 'candidate',
});
ExperienceLaunchpadPlacement.belongsTo(ExperienceLaunchpadEmployerRequest, {
  foreignKey: 'employerRequestId',
  as: 'employerRequest',
});

ExperienceLaunchpad.hasMany(ExperienceLaunchpadOpportunityLink, {
  foreignKey: 'launchpadId',
  as: 'opportunityLinks',
});
ExperienceLaunchpadOpportunityLink.belongsTo(ExperienceLaunchpad, {
  foreignKey: 'launchpadId',
  as: 'launchpad',
});
ExperienceLaunchpadOpportunityLink.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

ClientSuccessPlaybook.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
ClientSuccessPlaybook.hasMany(ClientSuccessStep, { foreignKey: 'playbookId', as: 'steps' });
ClientSuccessPlaybook.hasMany(ClientSuccessEnrollment, { foreignKey: 'playbookId', as: 'enrollments' });

ClientSuccessStep.belongsTo(ClientSuccessPlaybook, { foreignKey: 'playbookId', as: 'playbook' });

ClientSuccessEnrollment.belongsTo(ClientSuccessPlaybook, { foreignKey: 'playbookId', as: 'playbook' });
ClientSuccessEnrollment.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
ClientSuccessEnrollment.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
ClientSuccessEnrollment.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });

ClientSuccessEvent.belongsTo(ClientSuccessEnrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });
ClientSuccessEvent.belongsTo(ClientSuccessStep, { foreignKey: 'stepId', as: 'step' });
ClientSuccessEvent.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

ClientSuccessReferral.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
ClientSuccessReferral.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });
ClientSuccessReferral.belongsTo(User, { foreignKey: 'referrerId', as: 'referrer' });

ClientSuccessReviewNudge.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
ClientSuccessReviewNudge.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });
ClientSuccessReviewNudge.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

ClientSuccessAffiliateLink.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
ClientSuccessAffiliateLink.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });

Gig.hasMany(ClientSuccessEnrollment, { foreignKey: 'gigId', as: 'clientSuccessEnrollments' });
Gig.hasMany(ClientSuccessReferral, { foreignKey: 'gigId', as: 'clientSuccessReferrals' });
Gig.hasMany(ClientSuccessReviewNudge, { foreignKey: 'gigId', as: 'clientSuccessReviewNudges' });
Gig.hasMany(ClientSuccessAffiliateLink, { foreignKey: 'gigId', as: 'clientSuccessAffiliateLinks' });

User.hasMany(ClientSuccessPlaybook, { foreignKey: 'freelancerId', as: 'clientSuccessPlaybooks' });
User.hasMany(ClientSuccessEnrollment, { foreignKey: 'freelancerId', as: 'clientSuccessEnrollments' });
User.hasMany(ClientSuccessEvent, { foreignKey: 'freelancerId', as: 'clientSuccessEvents' });
User.hasMany(ClientSuccessReferral, { foreignKey: 'freelancerId', as: 'clientSuccessReferrals' });
User.hasMany(ClientSuccessReviewNudge, { foreignKey: 'freelancerId', as: 'clientSuccessReviewNudges' });
User.hasMany(ClientSuccessAffiliateLink, { foreignKey: 'freelancerId', as: 'clientSuccessAffiliateLinks' });
export const ServiceLine = sequelize.define(
  'ServiceLine',
  {
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'service_lines' },
);

export const LearningCourse = sequelize.define(
  'LearningCourse',
  {
    serviceLineId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    difficulty: {
      type: DataTypes.ENUM(...LEARNING_COURSE_DIFFICULTIES),
      allowNull: false,
      defaultValue: 'intermediate',
    },
    format: { type: DataTypes.STRING(120), allowNull: true },
    durationHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'learning_courses' },
);

export const LearningCourseModule = sequelize.define(
  'LearningCourseModule',
  {
    courseId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    moduleType: { type: DataTypes.STRING(120), allowNull: true },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    sequence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    resources: { type: jsonType, allowNull: true },
  },
  { tableName: 'learning_course_modules' },
);

export const LearningCourseEnrollment = sequelize.define(
  'LearningCourseEnrollment',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    courseId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...LEARNING_ENROLLMENT_STATUSES),
      allowNull: false,
      defaultValue: 'not_started',
    },
    progress: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    lastAccessedAt: { type: DataTypes.DATE, allowNull: true },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'learning_course_enrollments' },
);

export const PeerMentoringSession = sequelize.define(
  'PeerMentoringSession',
  {
    serviceLineId: { type: DataTypes.INTEGER, allowNull: true },
    mentorId: { type: DataTypes.INTEGER, allowNull: false },
    menteeId: { type: DataTypes.INTEGER, allowNull: false },
    topic: { type: DataTypes.STRING(255), allowNull: false },
    agenda: { type: DataTypes.TEXT, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...PEER_MENTORING_STATUSES),
      allowNull: false,
      defaultValue: 'requested',
    },
    meetingUrl: { type: DataTypes.STRING(255), allowNull: true },
    recordingUrl: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'peer_mentoring_sessions' },
);

export const SkillGapDiagnostic = sequelize.define(
  'SkillGapDiagnostic',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    serviceLineId: { type: DataTypes.INTEGER, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    strengths: { type: jsonType, allowNull: true },
    gaps: { type: jsonType, allowNull: true },
    recommendedActions: { type: jsonType, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: 'skill_gap_diagnostics' },
);

export const FreelancerCertification = sequelize.define(
  'FreelancerCertification',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    serviceLineId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    issuingOrganization: { type: DataTypes.STRING(200), allowNull: true },
    credentialId: { type: DataTypes.STRING(120), allowNull: true },
    credentialUrl: { type: DataTypes.STRING(255), allowNull: true },
    issueDate: { type: DataTypes.DATEONLY, allowNull: true },
    expirationDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM(...CERTIFICATION_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    reminderSentAt: { type: DataTypes.DATE, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
  },
  { tableName: 'freelancer_certifications' },
);

export const AiServiceRecommendation = sequelize.define(
  'AiServiceRecommendation',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    serviceLineId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    confidenceScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    sourceSignals: { type: jsonType, allowNull: true },
    generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: 'ai_service_recommendations' },
);

ServiceLine.hasMany(LearningCourse, { foreignKey: 'serviceLineId', as: 'courses' });
ServiceLine.hasMany(PeerMentoringSession, { foreignKey: 'serviceLineId', as: 'mentoringSessions' });
ServiceLine.hasMany(SkillGapDiagnostic, { foreignKey: 'serviceLineId', as: 'skillDiagnostics' });
ServiceLine.hasMany(FreelancerCertification, { foreignKey: 'serviceLineId', as: 'certifications' });
ServiceLine.hasMany(AiServiceRecommendation, { foreignKey: 'serviceLineId', as: 'recommendations' });

LearningCourse.belongsTo(ServiceLine, { foreignKey: 'serviceLineId', as: 'serviceLine' });
LearningCourse.hasMany(LearningCourseModule, { foreignKey: 'courseId', as: 'modules' });
LearningCourse.hasMany(LearningCourseEnrollment, { foreignKey: 'courseId', as: 'enrollments' });

LearningCourseModule.belongsTo(LearningCourse, { foreignKey: 'courseId', as: 'course' });

LearningCourseEnrollment.belongsTo(LearningCourse, { foreignKey: 'courseId', as: 'course' });
LearningCourseEnrollment.belongsTo(User, { foreignKey: 'userId', as: 'learner' });
User.hasMany(LearningCourseEnrollment, { foreignKey: 'userId', as: 'learningEnrollments' });

PeerMentoringSession.belongsTo(ServiceLine, { foreignKey: 'serviceLineId', as: 'serviceLine' });
PeerMentoringSession.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
PeerMentoringSession.belongsTo(User, { foreignKey: 'menteeId', as: 'mentee' });
User.hasMany(PeerMentoringSession, { foreignKey: 'mentorId', as: 'mentoringSessionsLed' });
User.hasMany(PeerMentoringSession, { foreignKey: 'menteeId', as: 'mentoringSessions' });

SkillGapDiagnostic.belongsTo(ServiceLine, { foreignKey: 'serviceLineId', as: 'serviceLine' });
SkillGapDiagnostic.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(SkillGapDiagnostic, { foreignKey: 'userId', as: 'skillDiagnostics' });

FreelancerCertification.belongsTo(ServiceLine, { foreignKey: 'serviceLineId', as: 'serviceLine' });
FreelancerCertification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(FreelancerCertification, { foreignKey: 'userId', as: 'certifications' });

AiServiceRecommendation.belongsTo(ServiceLine, { foreignKey: 'serviceLineId', as: 'serviceLine' });
AiServiceRecommendation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AiServiceRecommendation, { foreignKey: 'userId', as: 'aiRecommendations' });

MessageThread.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
MessageThread.hasMany(MessageParticipant, { foreignKey: 'threadId', as: 'participants' });
MessageThread.hasMany(MessageParticipant, { foreignKey: 'threadId', as: 'viewerParticipants' });
MessageThread.hasMany(Message, { foreignKey: 'threadId', as: 'messages' });
MessageThread.hasOne(SupportCase, { foreignKey: 'threadId', as: 'supportCase' });

MessageParticipant.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });
MessageParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Message.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.hasMany(MessageAttachment, { foreignKey: 'messageId', as: 'attachments' });

MessageAttachment.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });

SupportCase.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });
SupportCase.belongsTo(User, { foreignKey: 'escalatedBy', as: 'escalatedByUser' });
SupportCase.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedAgent' });
SupportCase.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });
SupportCase.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolvedByUser' });
SupportPlaybook.hasMany(SupportPlaybookStep, { foreignKey: 'playbookId', as: 'steps' });
SupportPlaybookStep.belongsTo(SupportPlaybook, { foreignKey: 'playbookId', as: 'playbook' });
SupportCase.hasMany(SupportCasePlaybook, { foreignKey: 'supportCaseId', as: 'casePlaybooks' });
SupportCasePlaybook.belongsTo(SupportCase, { foreignKey: 'supportCaseId', as: 'supportCase' });
SupportCasePlaybook.belongsTo(SupportPlaybook, { foreignKey: 'playbookId', as: 'playbook' });
SupportCase.hasMany(SupportCaseSatisfaction, { foreignKey: 'supportCaseId', as: 'surveys' });
SupportCaseSatisfaction.belongsTo(SupportCase, { foreignKey: 'supportCaseId', as: 'supportCase' });
SupportCaseSatisfaction.belongsTo(User, { foreignKey: 'submittedBy', as: 'submittedByUser' });
SupportCase.hasMany(SupportCaseLink, { foreignKey: 'supportCaseId', as: 'links' });
SupportCaseLink.belongsTo(SupportCase, { foreignKey: 'supportCaseId', as: 'supportCase' });

ComplianceDocument.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
ComplianceDocument.belongsTo(ComplianceDocumentVersion, {
  foreignKey: 'latestVersionId',
  as: 'latestVersion',
});
ComplianceDocument.hasMany(ComplianceDocumentVersion, { foreignKey: 'documentId', as: 'versions' });
ComplianceDocument.hasMany(ComplianceObligation, { foreignKey: 'documentId', as: 'obligations' });
ComplianceDocument.hasMany(ComplianceReminder, { foreignKey: 'documentId', as: 'reminders' });

ComplianceDocumentVersion.belongsTo(ComplianceDocument, { foreignKey: 'documentId', as: 'document' });
ComplianceDocumentVersion.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

ComplianceObligation.belongsTo(ComplianceDocument, { foreignKey: 'documentId', as: 'document' });
ComplianceObligation.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
ComplianceObligation.hasMany(ComplianceReminder, { foreignKey: 'obligationId', as: 'reminders' });

ComplianceReminder.belongsTo(ComplianceDocument, { foreignKey: 'documentId', as: 'document' });
ComplianceReminder.belongsTo(ComplianceObligation, { foreignKey: 'obligationId', as: 'obligation' });
ComplianceReminder.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

User.hasMany(ComplianceDocument, { foreignKey: 'ownerId', as: 'complianceDocuments' });

Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });
NotificationPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(NotificationPreference, { foreignKey: 'userId', as: 'notificationPreference' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

User.hasMany(DeliverableVault, { foreignKey: 'freelancerId', as: 'deliverableVaults' });
DeliverableVault.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
DeliverableVault.hasMany(DeliverableVaultItem, { foreignKey: 'vaultId', as: 'items' });

DeliverableVaultItem.belongsTo(DeliverableVault, { foreignKey: 'vaultId', as: 'vault' });
DeliverableVaultItem.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
DeliverableVaultItem.belongsTo(User, { foreignKey: 'lastTouchedById', as: 'lastTouchedBy' });
DeliverableVaultItem.belongsTo(DeliverableVersion, { foreignKey: 'currentVersionId', as: 'currentVersion' });
DeliverableVaultItem.belongsTo(DeliverableDeliveryPackage, { foreignKey: 'latestPackageId', as: 'latestPackage' });
DeliverableVaultItem.hasMany(DeliverableVersion, { foreignKey: 'itemId', as: 'versions' });
DeliverableVaultItem.hasMany(DeliverableDeliveryPackage, { foreignKey: 'itemId', as: 'deliveryPackages' });

DeliverableVersion.belongsTo(DeliverableVaultItem, { foreignKey: 'itemId', as: 'item' });
DeliverableVersion.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

DeliverableDeliveryPackage.belongsTo(DeliverableVaultItem, { foreignKey: 'itemId', as: 'item' });
DeliverableDeliveryPackage.belongsTo(User, { foreignKey: 'generatedById', as: 'generatedBy' });

User.hasMany(SearchSubscription, { foreignKey: 'userId', as: 'searchSubscriptions' });
SearchSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

AnalyticsEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ProviderWorkspace.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
ProviderWorkspace.hasMany(ProviderWorkspaceMember, { foreignKey: 'workspaceId', as: 'members' });
ProviderWorkspace.hasMany(ProviderWorkspaceInvite, { foreignKey: 'workspaceId', as: 'invites' });
ProviderWorkspace.hasMany(ProviderContactNote, { foreignKey: 'workspaceId', as: 'contactNotes' });
ProviderWorkspace.hasMany(HiringAlert, { foreignKey: 'workspaceId', as: 'hiringAlerts' });
ProviderWorkspace.hasMany(CandidateDemographicSnapshot, {
  foreignKey: 'workspaceId',
  as: 'candidateDemographics',
});
ProviderWorkspace.hasMany(CandidateSatisfactionSurvey, {
  foreignKey: 'workspaceId',
  as: 'candidateSurveys',
});
ProviderWorkspace.hasMany(InterviewSchedule, { foreignKey: 'workspaceId', as: 'interviewSchedules' });
ProviderWorkspace.hasMany(JobStage, { foreignKey: 'workspaceId', as: 'jobStages' });
ProviderWorkspace.hasMany(JobApprovalWorkflow, { foreignKey: 'workspaceId', as: 'jobApprovals' });
ProviderWorkspace.hasMany(JobCampaignPerformance, { foreignKey: 'workspaceId', as: 'jobCampaignPerformance' });
ProviderWorkspace.hasMany(PartnerEngagement, { foreignKey: 'workspaceId', as: 'partnerEngagements' });
ProviderWorkspace.hasMany(RecruitingCalendarEvent, { foreignKey: 'workspaceId', as: 'recruitingEvents' });
ProviderWorkspace.hasMany(EmployerBrandAsset, { foreignKey: 'workspaceId', as: 'employerBrandAssets' });

ProviderWorkspaceMember.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderWorkspaceMember.belongsTo(User, { foreignKey: 'userId', as: 'member' });
ProviderWorkspaceMember.belongsTo(User, { foreignKey: 'invitedById', as: 'inviter' });

ProviderWorkspaceInvite.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderWorkspaceInvite.belongsTo(User, { foreignKey: 'invitedById', as: 'inviter' });

ProviderContactNote.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderContactNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
ProviderContactNote.belongsTo(User, { foreignKey: 'subjectUserId', as: 'subject' });
HiringAlert.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CandidateDemographicSnapshot.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CandidateSatisfactionSurvey.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
InterviewSchedule.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobStage.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobApprovalWorkflow.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobCampaignPerformance.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PartnerEngagement.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
RecruitingCalendarEvent.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
EmployerBrandAsset.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });

WorkspaceTemplateCategory.hasMany(WorkspaceTemplate, { foreignKey: 'categoryId', as: 'templates' });
WorkspaceTemplate.belongsTo(WorkspaceTemplateCategory, { foreignKey: 'categoryId', as: 'category' });
WorkspaceTemplate.hasMany(WorkspaceTemplateStage, { foreignKey: 'templateId', as: 'stages' });
WorkspaceTemplate.hasMany(WorkspaceTemplateResource, { foreignKey: 'templateId', as: 'resources' });
WorkspaceTemplateStage.belongsTo(WorkspaceTemplate, { foreignKey: 'templateId', as: 'template' });
WorkspaceTemplateResource.belongsTo(WorkspaceTemplate, { foreignKey: 'templateId', as: 'template' });

User.hasMany(AgencyCollaboration, { foreignKey: 'freelancerId', as: 'agencyCollaborations' });
AgencyCollaboration.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
AgencyCollaboration.belongsTo(ProviderWorkspace, { foreignKey: 'agencyWorkspaceId', as: 'agencyWorkspace' });
ProviderWorkspace.hasMany(AgencyCollaboration, { foreignKey: 'agencyWorkspaceId', as: 'freelancerCollaborations' });

AgencyCollaboration.hasMany(AgencyCollaborationInvitation, {
  foreignKey: 'collaborationId',
  as: 'invitations',
});
AgencyCollaborationInvitation.belongsTo(AgencyCollaboration, {
  foreignKey: 'collaborationId',
  as: 'collaboration',
});
AgencyCollaborationInvitation.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
AgencyCollaborationInvitation.belongsTo(User, { foreignKey: 'sentById', as: 'sentBy' });
AgencyCollaborationInvitation.belongsTo(ProviderWorkspace, {
  foreignKey: 'agencyWorkspaceId',
  as: 'agencyWorkspace',
});

AgencyRateCard.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
AgencyRateCard.belongsTo(ProviderWorkspace, { foreignKey: 'agencyWorkspaceId', as: 'agencyWorkspace' });
AgencyRateCard.hasMany(AgencyRateCardItem, {
  foreignKey: 'rateCardId',
  as: 'items',
  onDelete: 'CASCADE',
  hooks: true,
});
AgencyRateCardItem.belongsTo(AgencyRateCard, { foreignKey: 'rateCardId', as: 'rateCard' });

AgencyCollaboration.hasMany(AgencyRetainerNegotiation, {
  foreignKey: 'collaborationId',
  as: 'negotiations',
});
AgencyRetainerNegotiation.belongsTo(AgencyCollaboration, {
  foreignKey: 'collaborationId',
  as: 'collaboration',
});
AgencyRetainerNegotiation.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
AgencyRetainerNegotiation.belongsTo(ProviderWorkspace, {
  foreignKey: 'agencyWorkspaceId',
  as: 'agencyWorkspace',
});
AgencyRetainerNegotiation.hasMany(AgencyRetainerEvent, {
  foreignKey: 'negotiationId',
  as: 'events',
  onDelete: 'CASCADE',
  hooks: true,
});
AgencyRetainerEvent.belongsTo(AgencyRetainerNegotiation, {
  foreignKey: 'negotiationId',
  as: 'negotiation',
});
AgencyRetainerEvent.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

User.hasMany(FinanceRevenueEntry, { foreignKey: 'userId', as: 'financeRevenueEntries' });
FinanceRevenueEntry.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

User.hasMany(FinanceExpenseEntry, { foreignKey: 'userId', as: 'financeExpenseEntries' });
FinanceExpenseEntry.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

User.hasMany(FinanceSavingsGoal, { foreignKey: 'userId', as: 'financeSavingsGoals' });
FinanceSavingsGoal.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

User.hasMany(FinancePayoutBatch, { foreignKey: 'userId', as: 'financePayoutBatches' });
FinancePayoutBatch.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
FinancePayoutBatch.hasMany(FinancePayoutSplit, { foreignKey: 'batchId', as: 'splits' });
FinancePayoutSplit.belongsTo(FinancePayoutBatch, { foreignKey: 'batchId', as: 'batch' });

User.hasMany(FinanceForecastScenario, { foreignKey: 'userId', as: 'financeForecastScenarios' });
FinanceForecastScenario.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

User.hasMany(FinanceTaxExport, { foreignKey: 'userId', as: 'financeTaxExports' });
FinanceTaxExport.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

PipelineBoard.hasMany(PipelineStage, { foreignKey: 'boardId', as: 'stages', onDelete: 'CASCADE' });
PipelineStage.belongsTo(PipelineBoard, { foreignKey: 'boardId', as: 'board' });

PipelineBoard.hasMany(PipelineDeal, { foreignKey: 'boardId', as: 'deals', onDelete: 'CASCADE' });
PipelineDeal.belongsTo(PipelineBoard, { foreignKey: 'boardId', as: 'board' });

PipelineStage.hasMany(PipelineDeal, { foreignKey: 'stageId', as: 'deals' });
PipelineDeal.belongsTo(PipelineStage, { foreignKey: 'stageId', as: 'stage' });

PipelineDeal.belongsTo(PipelineCampaign, { foreignKey: 'campaignId', as: 'campaign' });
PipelineCampaign.hasMany(PipelineDeal, { foreignKey: 'campaignId', as: 'deals' });

PipelineDeal.hasMany(PipelineProposal, { foreignKey: 'dealId', as: 'proposals', onDelete: 'CASCADE' });
PipelineProposal.belongsTo(PipelineDeal, { foreignKey: 'dealId', as: 'deal' });

PipelineProposal.belongsTo(PipelineProposalTemplate, { foreignKey: 'templateId', as: 'template' });
PipelineProposalTemplate.hasMany(PipelineProposal, { foreignKey: 'templateId', as: 'proposals' });

PipelineDeal.hasMany(PipelineFollowUp, { foreignKey: 'dealId', as: 'followUps', onDelete: 'CASCADE' });
PipelineFollowUp.belongsTo(PipelineDeal, { foreignKey: 'dealId', as: 'deal' });

AgencyAlliance.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyAlliance.hasMany(AgencyAllianceMember, { foreignKey: 'allianceId', as: 'members' });
AgencyAlliance.hasMany(AgencyAlliancePod, { foreignKey: 'allianceId', as: 'pods' });
AgencyAlliance.hasMany(AgencyAllianceResourceSlot, { foreignKey: 'allianceId', as: 'resourceSlots' });
AgencyAlliance.hasMany(AgencyAllianceRateCard, { foreignKey: 'allianceId', as: 'rateCards' });
AgencyAlliance.hasMany(AgencyAllianceRevenueSplit, { foreignKey: 'allianceId', as: 'revenueSplits' });

AgencyAllianceMember.belongsTo(AgencyAlliance, { foreignKey: 'allianceId', as: 'alliance' });
AgencyAllianceMember.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyAllianceMember.belongsTo(ProviderWorkspaceMember, { foreignKey: 'workspaceMemberId', as: 'workspaceMember' });
AgencyAllianceMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AgencyAllianceMember.hasMany(AgencyAlliancePodMember, { foreignKey: 'allianceMemberId', as: 'podMemberships' });
AgencyAllianceMember.hasMany(AgencyAllianceResourceSlot, { foreignKey: 'allianceMemberId', as: 'resourceSlots' });

AgencyAlliancePod.belongsTo(AgencyAlliance, { foreignKey: 'allianceId', as: 'alliance' });
AgencyAlliancePod.belongsTo(AgencyAllianceMember, { foreignKey: 'leadMemberId', as: 'leadMember' });
AgencyAlliancePod.hasMany(AgencyAlliancePodMember, { foreignKey: 'podId', as: 'members' });

AgencyAlliancePodMember.belongsTo(AgencyAlliancePod, { foreignKey: 'podId', as: 'pod' });
AgencyAlliancePodMember.belongsTo(AgencyAllianceMember, { foreignKey: 'allianceMemberId', as: 'member' });

AgencyAllianceResourceSlot.belongsTo(AgencyAlliance, { foreignKey: 'allianceId', as: 'alliance' });
AgencyAllianceResourceSlot.belongsTo(AgencyAllianceMember, { foreignKey: 'allianceMemberId', as: 'member' });

AgencyAllianceRateCard.belongsTo(AgencyAlliance, { foreignKey: 'allianceId', as: 'alliance' });
AgencyAllianceRateCard.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
AgencyAllianceRateCard.hasMany(AgencyAllianceRateCardApproval, { foreignKey: 'rateCardId', as: 'approvals' });

AgencyAllianceRateCardApproval.belongsTo(AgencyAllianceRateCard, { foreignKey: 'rateCardId', as: 'rateCard' });
AgencyAllianceRateCardApproval.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

AgencyAllianceRevenueSplit.belongsTo(AgencyAlliance, { foreignKey: 'allianceId', as: 'alliance' });
AgencyAllianceRevenueSplit.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
AgencyAllianceRevenueSplit.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

User.hasMany(EscrowAccount, { foreignKey: 'userId', as: 'escrowAccounts' });
EscrowAccount.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
EscrowAccount.hasMany(EscrowTransaction, { foreignKey: 'accountId', as: 'transactions' });

EscrowTransaction.belongsTo(EscrowAccount, { foreignKey: 'accountId', as: 'account' });
EscrowTransaction.belongsTo(User, { foreignKey: 'initiatedById', as: 'initiator' });
EscrowTransaction.belongsTo(User, { foreignKey: 'counterpartyId', as: 'counterparty' });
EscrowTransaction.hasMany(DisputeCase, { foreignKey: 'escrowTransactionId', as: 'disputes' });
SupportCaseLink.belongsTo(EscrowTransaction, { foreignKey: 'escrowTransactionId', as: 'transaction' });

DisputeCase.belongsTo(EscrowTransaction, { foreignKey: 'escrowTransactionId', as: 'transaction' });
DisputeCase.belongsTo(User, { foreignKey: 'openedById', as: 'openedBy' });
DisputeCase.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });
DisputeCase.hasMany(DisputeEvent, { foreignKey: 'disputeCaseId', as: 'events' });

DisputeEvent.belongsTo(DisputeCase, { foreignKey: 'disputeCaseId', as: 'disputeCase' });
DisputeEvent.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

User.hasMany(GigOrder, { foreignKey: 'freelancerId', as: 'gigOrders' });
GigOrder.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
GigOrder.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

GigOrder.hasMany(GigOrderRequirementForm, { foreignKey: 'orderId', as: 'requirementForms' });
GigOrderRequirementForm.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });
GigOrderRequirementForm.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

GigOrder.hasMany(GigOrderRevision, { foreignKey: 'orderId', as: 'revisions' });
GigOrderRevision.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });
GigOrderRevision.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });

GigOrder.hasMany(GigOrderEscrowCheckpoint, { foreignKey: 'orderId', as: 'escrowCheckpoints' });
GigOrderEscrowCheckpoint.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });
GigOrderEscrowCheckpoint.belongsTo(User, { foreignKey: 'releasedById', as: 'releasedBy' });

export default {
  sequelize,
  User,
  Profile,
  ProfileReference,
  ProfileAppreciation,
  ProfileFollower,
  ProfileEngagementJob,
  CompanyProfile,
  AgencyProfile,
  FreelancerProfile,
  ReputationTestimonial,
  ReputationSuccessStory,
  ReputationMetric,
  ReputationBadge,
  ReputationReviewWidget,
  FreelancerExpertiseArea,
  FreelancerSuccessMetric,
  FreelancerTestimonial,
  FreelancerHeroBanner,
  FeedPost,
  Job,
  Gig,
  GigPackage,
  GigAddon,
  GigMediaAsset,
  GigCallToAction,
  GigPreviewLayout,
  GigPerformanceSnapshot,
  GigAddOn,
  GigAvailabilitySlot,
  GigOrder,
  GigOrderRequirement,
  GigOrderRevision,
  GigOrderPayout,
  GigOrderActivity,
  GigMilestone,
  GigBundle,
  GigBundleItem,
  GigUpsell,
  GigCatalogItem,
  Project,
  FreelancerCatalogBundle,
  FreelancerCatalogBundleMetric,
  FreelancerRepeatClient,
  FreelancerCrossSellOpportunity,
  FreelancerKeywordImpression,
  FreelancerMarginSnapshot,
  ClientSuccessPlaybook,
  ClientSuccessStep,
  ClientSuccessEnrollment,
  ClientSuccessEvent,
  ClientSuccessReferral,
  ClientSuccessReviewNudge,
  ClientSuccessAffiliateLink,
  SprintCycle,
  SprintTask,
  SprintTaskDependency,
  SprintTaskTimeEntry,
  SprintRisk,
  ChangeRequest,
  ProjectBlueprint,
  ProjectBlueprintSprint,
  ProjectBlueprintDependency,
  ProjectBlueprintRisk,
  ProjectBillingCheckpoint,
  ProjectWorkspace,
  ProjectWorkspaceBrief,
  ProjectWorkspaceWhiteboard,
  ProjectWorkspaceFile,
  ProjectWorkspaceConversation,
  ProjectWorkspaceApproval,
  ExperienceLaunchpad,
  ExperienceLaunchpadApplication,
  ExperienceLaunchpadEmployerRequest,
  ExperienceLaunchpadPlacement,
  ExperienceLaunchpadOpportunityLink,
  ServiceLine,
  LearningCourse,
  LearningCourseModule,
  LearningCourseEnrollment,
  PeerMentoringSession,
  SkillGapDiagnostic,
  FreelancerCertification,
  AiServiceRecommendation,
  Volunteering,
  Group,
  GroupMembership,
  Connection,
  TwoFactorToken,
  Application,
  ApplicationReview,
  MessageThread,
  MessageParticipant,
  Message,
  MessageAttachment,
  SupportCase,
  SupportPlaybook,
  SupportPlaybookStep,
  SupportCasePlaybook,
  SupportCaseLink,
  SupportCaseSatisfaction,
  SupportKnowledgeArticle,
  CareerAnalyticsSnapshot,
  CareerPeerBenchmark,
  WeeklyDigestSubscription,
  CalendarIntegration,
  CandidateCalendarEvent,
  FocusSession,
  AdvisorCollaboration,
  AdvisorCollaborationMember,
  AdvisorCollaborationAuditLog,
  AdvisorDocumentRoom,
  SupportAutomationLog,
  Notification,
  NotificationPreference,
  AnalyticsEvent,
  AnalyticsDailyRollup,
  DeliverableVault,
  DeliverableVaultItem,
  DeliverableVersion,
  DeliverableDeliveryPackage,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderWorkspaceInvite,
  ProviderContactNote,
  AgencyAlliance,
  AgencyAllianceMember,
  AgencyAlliancePod,
  AgencyAlliancePodMember,
  AgencyAllianceResourceSlot,
  AgencyAllianceRateCard,
  AgencyAllianceRateCardApproval,
  AgencyAllianceRevenueSplit,
  PipelineBoard,
  PipelineStage,
  PipelineDeal,
  PipelineProposal,
  PipelineProposalTemplate,
  PipelineFollowUp,
  PipelineCampaign,
  FinanceRevenueEntry,
  FinanceExpenseEntry,
  FinanceSavingsGoal,
  FinancePayoutBatch,
  FinancePayoutSplit,
  FinanceForecastScenario,
  FinanceTaxExport,
  AgencyCollaboration,
  AgencyCollaborationInvitation,
  AgencyRateCard,
  AgencyRateCardItem,
  AgencyRetainerNegotiation,
  AgencyRetainerEvent,
  WorkspaceTemplateCategory,
  WorkspaceTemplate,
  WorkspaceTemplateStage,
  WorkspaceTemplateResource,
  HiringAlert,
  CandidateDemographicSnapshot,
  CandidateSatisfactionSurvey,
  InterviewSchedule,
  JobStage,
  JobApprovalWorkflow,
  JobCampaignPerformance,
  PartnerEngagement,
  RecruitingCalendarEvent,
  EmployerBrandAsset,
  EscrowAccount,
  EscrowTransaction,
  DisputeCase,
  DisputeEvent,
  SearchSubscription,
  FreelancerAssignmentMetric,
  FreelancerFinanceMetric,
  FreelancerRevenueMonthly,
  FreelancerRevenueStream,
  FreelancerPayout,
  FreelancerTaxEstimate,
  FreelancerTaxFiling,
  FreelancerDeductionSummary,
  FreelancerProfitabilityMetric,
  FreelancerCostBreakdown,
  FreelancerSavingsGoal,
  FreelancerFinanceControl,
  ProjectAssignmentEvent,
  AutoAssignQueueEntry,
  CommunitySpotlight,
  CommunitySpotlightHighlight,
  CommunitySpotlightAsset,
  CommunitySpotlightNewsletterFeature,
  ComplianceDocument,
  ComplianceDocumentVersion,
  ComplianceObligation,
  ComplianceReminder,
  ComplianceLocalization,
  GigOrder,
  GigOrderRequirementForm,
  GigOrderRevision,
  GigOrderEscrowCheckpoint,
  CollaborationSpace,
  CollaborationParticipant,
  CollaborationRoom,
  CollaborationAsset,
  CollaborationAnnotation,
  CollaborationRepository,
  CollaborationAiSession,
};
