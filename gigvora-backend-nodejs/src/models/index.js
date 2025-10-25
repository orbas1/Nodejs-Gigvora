import { DataTypes, Op } from 'sequelize';
import DomainRegistry from '../domains/domainRegistry.js';
import { domainMetadata } from '../domains/domainMetadata.js';
import logger from '../utils/logger.js';
import { PlatformSetting } from './platformSetting.js';
import { SiteSetting, SitePage, SiteNavigationLink, SITE_PAGE_STATUSES } from './siteManagementModels.js';
import { RuntimeSecurityAuditEvent } from './runtimeSecurityAuditEvent.js';
import {
  normaliseSlug,
  normaliseHexColor,
  normaliseEmail,
  applyModelSlug,
  ensurePublishedTimestamp,
} from '../utils/modelNormalizers.js';
export { AdminTreasuryPolicy, AdminFeeRule, AdminPayoutSchedule, AdminEscrowAdjustment } from './adminFinanceModels.js';
export { RouteRegistryEntry } from './routeRegistryModels.js';
import './agencyWorkforceModels.js';
import { RbacPolicyAuditEvent } from './rbacPolicyAuditEvent.js';
import { RuntimeAnnouncement } from './runtimeAnnouncement.js';
import {
  CompanyPage,
  CompanyPageSection,
  CompanyPageRevision,
  CompanyPageCollaborator,
  CompanyPageMedia,
} from './companyPageModels.js';
import {
  UserEvent,
  UserEventAgendaItem,
  UserEventTask,
  UserEventGuest,
  UserEventBudgetItem,
  UserEventAsset,
  UserEventChecklistItem,
  USER_EVENT_STATUSES,
  USER_EVENT_FORMATS,
  USER_EVENT_VISIBILITIES,
  USER_EVENT_TASK_STATUSES,
  USER_EVENT_TASK_PRIORITIES,
  USER_EVENT_GUEST_STATUSES,
  USER_EVENT_BUDGET_STATUSES,
  USER_EVENT_ASSET_TYPES,
  USER_EVENT_ASSET_VISIBILITIES,
  registerEventManagementAssociations,
} from './eventManagement.js';
import {
  ConsentPolicy,
  ConsentPolicyVersion,
  UserConsent,
  ConsentAuditEvent,
} from './consentModels.js';
import {
  CreationStudioItem,
  CreationStudioCollaborator,
  CreationStudioStep,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_STEPS,
  CREATION_STUDIO_COLLABORATOR_STATUSES,
} from './creationStudioModels.js';

import { buildLocationDetails } from '../utils/location.js';

import {
  BlogCategory,
  BlogMedia,
  BlogPost,
  BlogPostMedia,
  BlogPostTag,
  BlogPostMetric,
  BlogComment,
  BlogTag,
  registerBlogAssociations,
  BLOG_COMMENT_STATUSES,
} from './blogModels.js';
import { AgencyAiConfiguration, AgencyAutoBidTemplate } from './agencyAiModels.js';
import {
  AdminTimeline,
  AdminTimelineEvent,
  ADMIN_TIMELINE_EVENT_STATUSES,
  ADMIN_TIMELINE_EVENT_TYPES,
  ADMIN_TIMELINE_STATUSES,
  ADMIN_TIMELINE_VISIBILITIES,
  registerAdminTimelineAssociations,
} from './adminTimelineModels.js';
import {
  JobApplication,
  JobApplicationDocument,
  JobApplicationInterview,
  JobApplicationNote,
  JobApplicationStageHistory,
  JOB_APPLICATION_INTERVIEW_STATUSES,
  JOB_APPLICATION_INTERVIEW_TYPES,
  JOB_APPLICATION_PRIORITIES,
  JOB_APPLICATION_SOURCES,
  JOB_APPLICATION_STAGES,
  JOB_APPLICATION_STATUSES,
  JOB_APPLICATION_VISIBILITIES,
} from './jobApplicationModels.js';
import {
  ACCESSIBILITY_AUDIT_STATUSES,
  ADMIN_CALENDAR_EVENT_STATUSES,
  ADMIN_CALENDAR_EVENT_TYPES,
  ADMIN_CALENDAR_SYNC_STATUSES,
  ADMIN_CALENDAR_VISIBILITIES,
  ADVISOR_COLLABORATION_MEMBER_ROLES,
  ADVISOR_COLLABORATION_MEMBER_STATUSES,
  ADVISOR_COLLABORATION_STATUSES,
  AD_COUPON_DISCOUNT_TYPES,
  AD_COUPON_STATUSES,
  AD_KEYWORD_INTENTS,
  AD_OBJECTIVES,
  AD_OPPORTUNITY_TYPES,
  AD_PACING_MODES,
  AD_POSITION_TYPES,
  AD_STATUSES,
  AD_SURFACE_LAYOUT_MODES,
  AD_SURFACE_TYPES,
  AD_TYPES,
  AGENCY_ALLIANCE_MEMBER_ROLES,
  AGENCY_ALLIANCE_MEMBER_STATUSES,
  AGENCY_ALLIANCE_POD_STATUSES,
  AGENCY_ALLIANCE_POD_TYPES,
  AGENCY_ALLIANCE_RATE_CARD_APPROVAL_STATUSES,
  AGENCY_ALLIANCE_RATE_CARD_STATUSES,
  AGENCY_ALLIANCE_REVENUE_SPLIT_STATUSES,
  AGENCY_ALLIANCE_REVENUE_SPLIT_TYPES,
  AGENCY_ALLIANCE_STATUSES,
  AGENCY_ALLIANCE_TYPES,
  AGENCY_BILLING_STATUSES,
  AGENCY_COLLABORATION_STATUSES,
  AGENCY_COLLABORATION_TYPES,
  AGENCY_INVITATION_STATUSES,
  AGENCY_MENTORING_PURCHASE_STATUSES,
  AGENCY_MENTORING_SESSION_STATUSES,
  AGENCY_MENTOR_PREFERENCE_LEVELS,
  AGENCY_RATE_CARD_ITEM_UNIT_TYPES,
  AGENCY_RATE_CARD_STATUSES,
  AGENCY_RETAINER_EVENT_ACTOR_TYPES,
  AGENCY_RETAINER_EVENT_TYPES,
  AGENCY_RETAINER_NEGOTIATION_STAGES,
  AGENCY_RETAINER_NEGOTIATION_STATUSES,
  AGENCY_TIMELINE_DISTRIBUTION_CHANNELS,
  AGENCY_TIMELINE_POST_STATUSES,
  AGENCY_TIMELINE_VISIBILITIES,
  ANALYTICS_ACTOR_TYPES,
  APPLICATION_REVIEW_DECISIONS,
  APPLICATION_REVIEW_STAGES,
  APPLICATION_STATUSES,
  APPLICATION_TARGET_TYPES,
  AUTO_ASSIGN_STATUSES,
  BRANDING_APPROVAL_STATUSES,
  BRANDING_ASSET_STATUSES,
  BRANDING_ASSET_TYPES,
  CALENDAR_DEFAULT_VIEWS,
  CALENDAR_EVENT_SOURCES,
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_VISIBILITIES,
  CALENDAR_INTEGRATION_STATUSES,
  CAREER_ANALYTICS_TREND_DIRECTIONS,
  CAREER_AUTO_APPLY_RULE_STATUSES,
  CAREER_AUTO_APPLY_TEST_STATUSES,
  CAREER_BRAND_ASSET_APPROVAL_STATUSES,
  CAREER_BRAND_ASSET_STATUSES,
  CAREER_BRAND_ASSET_TYPES,
  CAREER_CANDIDATE_BRIEF_STATUSES,
  CAREER_COMPLIANCE_STATUSES,
  CAREER_DOCUMENT_ANALYTICS_VIEWER_TYPES,
  CAREER_DOCUMENT_COLLABORATOR_ROLES,
  CAREER_DOCUMENT_EXPORT_FORMATS,
  CAREER_DOCUMENT_STATUSES,
  CAREER_DOCUMENT_TYPES,
  CAREER_DOCUMENT_VERSION_APPROVAL_STATUSES,
  CAREER_INTERVIEW_RECOMMENDATIONS,
  CAREER_INTERVIEW_TASK_PRIORITIES,
  CAREER_INTERVIEW_TASK_STATUSES,
  CAREER_INTERVIEW_WORKSPACE_STATUSES,
  CAREER_NUDGE_CHANNELS,
  CAREER_NUDGE_SEVERITIES,
  CAREER_OFFER_DECISIONS,
  CAREER_OFFER_STATUSES,
  CAREER_OPPORTUNITY_FOLLOW_UP_STATUSES,
  CAREER_PATHING_STATUSES,
  CAREER_PIPELINE_STAGE_OUTCOMES,
  CAREER_PIPELINE_STAGE_TYPES,
  CAREER_STORY_BLOCK_STATUSES,
  CAREER_STORY_BLOCK_TONES,
  CERTIFICATION_STATUSES,
  CHANGE_REQUEST_STATUSES,
  CLIENT_ENGAGEMENT_CONTRACT_STATUSES,
  CLIENT_ENGAGEMENT_MILESTONE_KINDS,
  CLIENT_ENGAGEMENT_MILESTONE_STATUSES,
  CLIENT_ENGAGEMENT_PORTAL_STATUSES,
  CLIENT_PORTAL_DECISION_VISIBILITIES,
  CLIENT_PORTAL_INSIGHT_TYPES,
  CLIENT_PORTAL_INSIGHT_VISIBILITIES,
  CLIENT_PORTAL_SCOPE_STATUSES,
  CLIENT_PORTAL_STATUSES,
  CLIENT_PORTAL_TIMELINE_STATUSES,
  CLIENT_SUCCESS_AFFILIATE_STATUSES,
  CLIENT_SUCCESS_ENROLLMENT_STATUSES,
  CLIENT_SUCCESS_EVENT_STATUSES,
  CLIENT_SUCCESS_PLAYBOOK_TRIGGERS,
  CLIENT_SUCCESS_REFERRAL_STATUSES,
  CLIENT_SUCCESS_REVIEW_NUDGE_STATUSES,
  CLIENT_SUCCESS_STEP_CHANNELS,
  CLIENT_SUCCESS_STEP_TYPES,
  COLLABORATION_AI_SESSION_STATUSES,
  COLLABORATION_AI_SESSION_TYPES,
  COLLABORATION_ANNOTATION_STATUSES,
  COLLABORATION_ANNOTATION_TYPES,
  COLLABORATION_ASSET_STATUSES,
  COLLABORATION_ASSET_TYPES,
  COLLABORATION_PARTICIPANT_ROLES,
  COLLABORATION_PARTICIPANT_STATUSES,
  COLLABORATION_PERMISSION_LEVELS,
  COLLABORATION_REPOSITORY_STATUSES,
  COLLABORATION_ROOM_TYPES,
  COLLABORATION_SPACE_STATUSES,
  COMMUNITY_INVITE_STATUSES,
  COMPLIANCE_AUDIT_STATUSES,
  COMPLIANCE_DOCUMENT_STATUSES,
  COMPLIANCE_DOCUMENT_TYPES,
  COMPLIANCE_OBLIGATION_STATUSES,
  COMPLIANCE_POLICY_STATUSES,
  COMPLIANCE_REMINDER_STATUSES,
  COMPLIANCE_STORAGE_PROVIDERS,
  CORPORATE_VERIFICATION_STATUSES,
  DELIVERABLE_ITEM_NDA_STATUSES,
  DELIVERABLE_ITEM_STATUSES,
  DELIVERABLE_ITEM_WATERMARK_MODES,
  DELIVERABLE_RETENTION_POLICIES,
  DELIVERABLE_VAULT_WATERMARK_MODES,
  DIGEST_FREQUENCIES,
  DISPUTE_ACTION_TYPES,
  DISPUTE_ACTOR_TYPES,
  DISPUTE_PRIORITIES,
  DISPUTE_REASON_CODES,
  DISPUTE_STAGES,
  DISPUTE_STATUSES,
  DOCUMENT_ROOM_STATUSES,
  EMPLOYEE_JOURNEY_HEALTH_STATUSES,
  EMPLOYEE_JOURNEY_PROGRAM_TYPES,
  EMPLOYEE_REFERRAL_STATUSES,
  EMPLOYER_BENEFIT_CATEGORIES,
  EMPLOYER_BRAND_CAMPAIGN_STATUSES,
  EMPLOYER_BRAND_SECTION_STATUSES,
  EMPLOYER_BRAND_SECTION_TYPES,
  EMPLOYER_BRAND_STORY_STATUSES,
  EMPLOYER_BRAND_STORY_TYPES,
  ENGAGEMENT_SCHEDULE_SCOPES,
  ENGAGEMENT_SCHEDULE_VISIBILITIES,
  ESCROW_ACCOUNT_STATUSES,
  ESCROW_FEE_TIER_STATUSES,
  ESCROW_INTEGRATION_PROVIDERS,
  ESCROW_RELEASE_POLICY_STATUSES,
  ESCROW_RELEASE_POLICY_TYPES,
  ESCROW_TRANSACTION_STATUSES,
  ESCROW_TRANSACTION_TYPES,
  EXECUTIVE_METRIC_CATEGORIES,
  EXECUTIVE_METRIC_TRENDS,
  EXECUTIVE_METRIC_UNITS,
  EXECUTIVE_SCENARIO_DIMENSION_TYPES,
  EXECUTIVE_SCENARIO_TYPES,
  FINANCE_AUTOMATION_TYPES,
  FINANCE_CHANGE_UNITS,
  FINANCE_EXPENSE_STATUSES,
  FINANCE_FORECAST_SCENARIO_TYPES,
  FINANCE_PAYOUT_STATUSES,
  FINANCE_REVENUE_STATUSES,
  FINANCE_REVENUE_TYPES,
  FINANCE_SAVINGS_STATUSES,
  FINANCE_TAX_EXPORT_STATUSES,
  FINANCE_TRENDS,
  FINANCE_VALUE_UNITS,
  FOCUS_SESSION_TYPES,
  FREELANCER_CALENDAR_EVENT_STATUSES,
  FREELANCER_CALENDAR_EVENT_TYPES,
  FREELANCER_CALENDAR_RELATED_TYPES,
  FREELANCER_EXPERTISE_STATUSES,
  FREELANCER_FILING_STATUSES,
  FREELANCER_HERO_BANNER_STATUSES,
  FREELANCER_PAYOUT_STATUSES,
  FREELANCER_SUCCESS_TRENDS,
  FREELANCER_TAX_ESTIMATE_STATUSES,
  FREELANCER_TESTIMONIAL_STATUSES,
  GIG_BUNDLE_STATUSES,
  GIG_CATALOG_STATUSES,
  GIG_MILESTONE_STATUSES,
  GIG_ORDER_ACTIVITY_TYPES,
  GIG_ORDER_ESCROW_STATUSES,
  GIG_ORDER_PAYOUT_STATUSES,
  GIG_ORDER_REQUIREMENT_FORM_STATUSES,
  GIG_ORDER_REQUIREMENT_PRIORITIES,
  GIG_ORDER_REQUIREMENT_STATUSES,
  GIG_ORDER_REVISION_SEVERITIES,
  GIG_ORDER_REVISION_WORKFLOW_STATUSES,
  GIG_ORDER_STATUSES,
  GIG_UPSELL_STATUSES,
  GOVERNANCE_RISK_CATEGORIES,
  GOVERNANCE_RISK_STATUSES,
  GROUP_MEMBERSHIP_ROLES,
  GROUP_MEMBERSHIP_STATUSES,
  GROUP_MEMBER_POLICIES,
  GROUP_POST_STATUSES,
  GROUP_POST_VISIBILITIES,
  GROUP_VISIBILITIES,
  HEADHUNTER_ASSIGNMENT_STATUSES,
  HEADHUNTER_BRIEF_STATUSES,
  HEADHUNTER_COMMISSION_STATUSES,
  HEADHUNTER_CONSENT_STATUSES,
  HEADHUNTER_INTERVIEW_STATUSES,
  HEADHUNTER_INTERVIEW_TYPES,
  HEADHUNTER_INVITE_STATUSES,
  HEADHUNTER_PASS_ON_STATUSES,
  HEADHUNTER_PASS_ON_TARGET_TYPES,
  HEADHUNTER_PIPELINE_ITEM_STATUSES,
  HEADHUNTER_PIPELINE_NOTE_VISIBILITIES,
  HEADHUNTER_PIPELINE_STAGE_TYPES,
  IDENTITY_VERIFICATION_EVENT_TYPES,
  ID_VERIFICATION_EVENT_TYPES,
  ID_VERIFICATION_STATUSES,
  INNOVATION_FUNDING_EVENT_TYPES,
  INNOVATION_INITIATIVE_CATEGORIES,
  INNOVATION_INITIATIVE_PRIORITIES,
  INNOVATION_INITIATIVE_STAGES,
  INTERNAL_JOB_POSTING_STATUSES,
  INTERNAL_MATCH_STATUSES,
  INTERNAL_OPPORTUNITY_CATEGORIES,
  INTERNAL_OPPORTUNITY_STATUSES,
  ISSUE_RESOLUTION_CASE_STATUSES,
  ISSUE_RESOLUTION_EVENT_TYPES,
  ISSUE_RESOLUTION_PRIORITIES,
  ISSUE_RESOLUTION_SEVERITIES,
  JOB_APPLICATION_FAVOURITE_PRIORITIES,
  JOB_APPLICATION_RESPONSE_CHANNELS,
  JOB_APPLICATION_RESPONSE_DIRECTIONS,
  JOB_APPLICATION_RESPONSE_STATUSES,
  JOB_INTERVIEW_STATUSES,
  JOB_INTERVIEW_TYPES,
  LAUNCHPAD_APPLICATION_STATUSES,
  LAUNCHPAD_EMPLOYER_REQUEST_STATUSES,
  LAUNCHPAD_OPPORTUNITY_SOURCES,
  LAUNCHPAD_PLACEMENT_STATUSES,
  LAUNCHPAD_STATUSES,
  LAUNCHPAD_TARGET_TYPES,
  LEADERSHIP_BRIEFING_STATUSES,
  LEADERSHIP_DECISION_STATUSES,
  LEADERSHIP_OKR_STATUSES,
  LEADERSHIP_RITUAL_CADENCES,
  LEARNING_COURSE_DIFFICULTIES,
  LEARNING_ENROLLMENT_STATUSES,
  MENTORING_SESSION_ACTION_PRIORITIES,
  MENTORING_SESSION_ACTION_STATUSES,
  MENTORING_SESSION_NOTE_VISIBILITIES,
  MENTORSHIP_ORDER_STATUSES,
  MESSAGE_CHANNEL_TYPES,
  MESSAGE_THREAD_STATES,
  MESSAGE_TYPES,
  NETWORKING_BUSINESS_CARD_STATUSES,
  NETWORKING_CONNECTION_FOLLOW_STATUSES,
  NETWORKING_CONNECTION_STATUSES,
  NETWORKING_CONNECTION_TYPES,
  NETWORKING_ROTATION_STATUSES,
  NETWORKING_SESSION_ACCESS_TYPES,
  NETWORKING_SESSION_ORDER_STATUSES,
  NETWORKING_SESSION_SIGNUP_SOURCES,
  NETWORKING_SESSION_SIGNUP_STATUSES,
  NETWORKING_SESSION_STATUSES,
  NETWORKING_SESSION_VISIBILITIES,
  NETWORKING_SIGNUP_PAYMENT_STATUSES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  OPPORTUNITY_TAXONOMY_TYPES,
  PAGE_MEMBER_ROLES,
  PAGE_MEMBER_STATUSES,
  PAGE_POST_STATUSES,
  PAGE_POST_VISIBILITIES,
  PAGE_VISIBILITIES,
  PARTNER_AGREEMENT_STATUSES,
  PARTNER_COLLABORATION_EVENT_TYPES,
  PARTNER_COMMISSION_STATUSES,
  PARTNER_COMPLIANCE_STATUSES,
  PEER_MENTORING_STATUSES,
  PEOPLE_OPS_PERFORMANCE_STATUSES,
  PEOPLE_OPS_POLICY_STATUSES,
  PEOPLE_OPS_WELLBEING_RISKS,
  PIPELINE_BOARD_GROUPINGS,
  PIPELINE_CAMPAIGN_STATUSES,
  PIPELINE_DEAL_STATUSES,
  PIPELINE_FOLLOW_UP_STATUSES,
  PIPELINE_PROPOSAL_STATUSES,
  PIPELINE_STAGE_CATEGORIES,
  PROFILE_APPRECIATION_TYPES,
  PROFILE_AVAILABILITY_STATUSES,
  PROFILE_ENGAGEMENT_JOB_STATUSES,
  PROFILE_FOLLOWERS_VISIBILITY_OPTIONS,
  PROFILE_FOLLOWER_STATUSES,
  PROFILE_NETWORK_VISIBILITY_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
  PROJECT_BILLING_STATUSES,
  PROJECT_BILLING_TYPES,
  PROJECT_BLUEPRINT_HEALTH_STATUSES,
  PROJECT_DEPENDENCY_RISK_LEVELS,
  PROJECT_DEPENDENCY_STATUSES,
  PROJECT_DEPENDENCY_TYPES,
  PROJECT_RISK_STATUSES,
  PROJECT_SPRINT_STATUSES,
  PROSPECT_CAMPAIGN_AB_TEST_GROUPS,
  PROSPECT_CAMPAIGN_STATUSES,
  PROSPECT_NOTE_VISIBILITIES,
  PROSPECT_RELOCATION_STATUSES,
  PROSPECT_SEARCH_ALERT_CADENCES,
  PROSPECT_SEARCH_ALERT_CHANNELS,
  PROSPECT_SEARCH_ALERT_STATUSES,
  PROSPECT_SIGNAL_INTENT_LEVELS,
  PROSPECT_TASK_PRIORITIES,
  PROSPECT_TASK_STATUSES,
  PROVIDER_CONTACT_NOTE_VISIBILITIES,
  PROVIDER_WORKSPACE_INVITE_STATUSES,
  PROVIDER_WORKSPACE_MEMBER_ROLES,
  PROVIDER_WORKSPACE_MEMBER_STATUSES,
  PROVIDER_WORKSPACE_TYPES,
  QUALIFICATION_CREDENTIAL_STATUSES,
  REPUTATION_CONTENT_MODERATION_STATUSES,
  REPUTATION_METRIC_TREND_DIRECTIONS,
  REPUTATION_REVIEW_WIDGET_STATUSES,
  REPUTATION_SUCCESS_STORY_STATUSES,
  REPUTATION_TESTIMONIAL_SOURCES,
  REPUTATION_TESTIMONIAL_STATUSES,
  SPEED_NETWORKING_ACCESS_LEVELS,
  SPEED_NETWORKING_MATCHING_STRATEGIES,
  SPEED_NETWORKING_PARTICIPANT_ROLES,
  SPEED_NETWORKING_PARTICIPANT_STATUSES,
  SPEED_NETWORKING_SESSION_STATUSES,
  SPEED_NETWORKING_VISIBILITIES,
  SPRINT_RISK_IMPACTS,
  SPRINT_RISK_STATUSES,
  SPRINT_STATUSES,
  SPRINT_TASK_PRIORITIES,
  SPRINT_TASK_STATUSES,
  SUPPORT_AUTOMATION_STATUSES,
  SUPPORT_CASE_LINK_TYPES,
  SUPPORT_CASE_PLAYBOOK_STATUSES,
  SUPPORT_CASE_PRIORITIES,
  SUPPORT_CASE_SATISFACTION_SUBMITTER_TYPES,
  SUPPORT_CASE_STATUSES,
  SUPPORT_KNOWLEDGE_AUDIENCES,
  SUPPORT_KNOWLEDGE_CATEGORIES,
  SUPPORT_PLAYBOOK_CHANNELS,
  SUPPORT_PLAYBOOK_PERSONAS,
  SUPPORT_PLAYBOOK_STAGES,
  TALENT_CANDIDATE_STATUSES,
  TALENT_CANDIDATE_TYPES,
  TALENT_INTERVIEW_STATUSES,
  TALENT_OFFER_STATUSES,
  TALENT_POOL_ENGAGEMENT_TYPES,
  TALENT_POOL_MEMBER_SOURCE_TYPES,
  TALENT_POOL_MEMBER_STATUSES,
  TALENT_POOL_STATUSES,
  TALENT_POOL_TYPES,
  VOLUNTEER_APPLICATION_STATUSES,
  VOLUNTEER_CONTRACT_STATUSES,
  VOLUNTEER_RESPONSE_TYPES,
  VOLUNTEER_SPEND_CATEGORIES,
  WALLET_ACCOUNT_STATUSES,
  WALLET_ACCOUNT_TYPES,
  WALLET_FUNDING_SOURCE_STATUSES,
  WALLET_FUNDING_SOURCE_TYPES,
  WALLET_LEDGER_ENTRY_TYPES,
  WALLET_TRANSFER_RULE_CADENCES,
  WALLET_TRANSFER_RULE_TRIGGER_TYPES,
  WALLET_TRANSFER_RULE_STATUSES,
  WALLET_TRANSFER_STATUSES,
  WALLET_TRANSFER_TYPES,
  WALLET_PAYOUT_REQUEST_STATUSES,
  WALLET_RISK_TIERS,
  WORKFORCE_COHORT_TYPES,
  WORKSPACE_CALENDAR_CONNECTION_STATUSES,
  WORKSPACE_INTEGRATION_AUDIT_EVENT_TYPES,
  WORKSPACE_INTEGRATION_AUTH_TYPES,
  WORKSPACE_INTEGRATION_CATEGORIES,
  WORKSPACE_INTEGRATION_CREDENTIAL_TYPES,
  WORKSPACE_INTEGRATION_ENVIRONMENTS,
  WORKSPACE_INTEGRATION_INCIDENT_SEVERITIES,
  WORKSPACE_INTEGRATION_INCIDENT_STATUSES,
  WORKSPACE_INTEGRATION_SECRET_TYPES,
  WORKSPACE_INTEGRATION_STATUSES,
  WORKSPACE_INTEGRATION_SYNC_FREQUENCIES,
  WORKSPACE_INTEGRATION_SYNC_RUN_STATUSES,
  WORKSPACE_INTEGRATION_SYNC_STATUSES,
  WORKSPACE_INTEGRATION_WEBHOOK_STATUSES,
  WORKSPACE_TEMPLATE_RESOURCE_TYPES,
  WORKSPACE_TEMPLATE_STAGE_TYPES,
  WORKSPACE_TEMPLATE_STATUSES,
  WORKSPACE_TEMPLATE_VISIBILITIES,
} from './constants/index.js';
import sequelizeClient from './sequelizeClient.js';


export { sequelize } from './sequelizeClient.js';

const sequelize = sequelizeClient;
const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const VOLUNTEER_PROGRAM_STATUSES = ['draft', 'active', 'paused', 'archived'];
export const VOLUNTEER_ROLE_STATUSES = ['draft', 'open', 'paused', 'filled', 'archived'];
export const VOLUNTEER_SHIFT_STATUSES = ['planned', 'open', 'locked', 'complete', 'cancelled'];
export const VOLUNTEER_ASSIGNMENT_STATUSES = [
  'invited',
  'confirmed',
  'checked_in',
  'checked_out',
  'declined',
  'no_show',
];
export const MENTOR_AVAILABILITY_STATUSES = ['open', 'waitlist', 'booked_out'];
export const MENTOR_PRICE_TIERS = ['tier_entry', 'tier_growth', 'tier_scale'];
export const COMPANY_TIMELINE_EVENT_STATUSES = ['planned', 'in_progress', 'completed', 'blocked'];
export const COMPANY_TIMELINE_POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
export const COMPANY_TIMELINE_POST_VISIBILITIES = ['workspace', 'public', 'private'];

export * from './constants/index.js';
export {
  BlogCategory,
  BlogMedia,
  BlogPost,
  BlogPostMedia,
  BlogPostTag,
  BlogPostMetric,
  BlogComment,
  BlogTag,
  BLOG_COMMENT_STATUSES,
} from './blogModels.js';
export {
  CompanyPage,
  CompanyPageSection,
  CompanyPageRevision,
  CompanyPageCollaborator,
  CompanyPageMedia,
  COMPANY_PAGE_STATUSES,
  COMPANY_PAGE_VISIBILITIES,
  COMPANY_PAGE_SECTION_VARIANTS,
  COMPANY_PAGE_COLLABORATOR_ROLES,
  COMPANY_PAGE_COLLABORATOR_STATUSES,
  COMPANY_PAGE_MEDIA_TYPES,
} from './companyPageModels.js';
export * from './agencyJobModels.js';
export { ConsentPolicy, ConsentPolicyVersion, UserConsent, ConsentAuditEvent } from './consentModels.js';
export { LegalDocument, LegalDocumentVersion, LegalDocumentAuditEvent } from './legalDocumentModels.js';
export { RuntimeSecurityAuditEvent } from './runtimeSecurityAuditEvent.js';
export { RbacPolicyAuditEvent } from './rbacPolicyAuditEvent.js';
export {
  JobApplication,
  JobApplicationDocument,
  JobApplicationInterview,
  JobApplicationNote,
  JobApplicationStageHistory,
  JOB_APPLICATION_INTERVIEW_STATUSES,
  JOB_APPLICATION_INTERVIEW_TYPES,
  JOB_APPLICATION_PRIORITIES,
  JOB_APPLICATION_SOURCES,
  JOB_APPLICATION_STAGES,
  JOB_APPLICATION_STATUSES,
  JOB_APPLICATION_VISIBILITIES,
} from './jobApplicationModels.js';
export {
  AdminTimeline,
  AdminTimelineEvent,
  ADMIN_TIMELINE_STATUSES,
  ADMIN_TIMELINE_VISIBILITIES,
  ADMIN_TIMELINE_EVENT_STATUSES,
  ADMIN_TIMELINE_EVENT_TYPES,
  registerAdminTimelineAssociations,
} from './adminTimelineModels.js';
export { SiteSetting, SitePage, SiteNavigationLink, SITE_PAGE_STATUSES } from './siteManagementModels.js';
export { EmailSmtpConfig, EmailTemplate } from './emailModels.js';
export {
  CreationStudioItem,
  CreationStudioCollaborator,
  CreationStudioStep,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_STEPS,
  CREATION_STUDIO_COLLABORATOR_STATUSES,
};
export { AgencyAiConfiguration, AgencyAutoBidTemplate } from './agencyAiModels.js';

const PIPELINE_OWNER_TYPES = ['freelancer', 'agency', 'company'];
const TWO_FACTOR_METHODS = ['email', 'app', 'sms'];
export const USER_STATUSES = ['invited', 'active', 'suspended', 'archived', 'deleted'];
const TWO_FACTOR_POLICY_ROLES = ['admin', 'staff', 'company', 'freelancer', 'agency', 'mentor', 'headhunter', 'all'];
const TWO_FACTOR_ENFORCEMENT_LEVELS = ['optional', 'recommended', 'required'];
const TWO_FACTOR_ENROLLMENT_METHODS = ['email', 'app', 'sms', 'security_key'];
const TWO_FACTOR_ENROLLMENT_STATUSES = ['pending', 'active', 'revoked'];
const TWO_FACTOR_BYPASS_STATUSES = ['pending', 'approved', 'denied', 'revoked'];
const GIG_MEDIA_TYPES = ['image', 'video', 'embed', 'document'];
const GIG_PREVIEW_DEVICE_TYPES = ['desktop', 'tablet', 'mobile'];
const FEATURE_FLAG_ROLLOUT_TYPES = ['global', 'percentage', 'cohort'];
const FEATURE_FLAG_STATUSES = ['draft', 'active', 'disabled'];
const FEATURE_FLAG_AUDIENCE_TYPES = ['user', 'workspace', 'membership', 'domain'];
const WEATHER_UNIT_OPTIONS = ['metric', 'imperial'];
const AGENCY_CALENDAR_EVENT_TYPES = ['project', 'interview', 'gig', 'mentorship', 'volunteering'];
const AGENCY_CALENDAR_EVENT_STATUSES = ['planned', 'confirmed', 'completed', 'cancelled', 'tentative'];
const AGENCY_CALENDAR_EVENT_VISIBILITIES = ['internal', 'client', 'public'];
export const AGENCY_PROFILE_MEDIA_ALLOWED_TYPES = ['image', 'video', 'banner'];
export const AGENCY_PROFILE_CREDENTIAL_TYPES = ['qualification', 'certificate'];

export const AGENCY_CREATION_TARGET_TYPES = [
  'project',
  'gig',
  'job',
  'launchpad_job',
  'launchpad_project',
  'volunteer_opportunity',
  'mentorship_offering',
  'networking_session',
  'blog_post',
  'group',
  'page',
  'ad',
  'event',
  'cv',
  'cover_letter',
];

export const AGENCY_CREATION_STATUSES = ['draft', 'in_review', 'scheduled', 'published', 'archived'];
export const AGENCY_CREATION_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const AGENCY_CREATION_VISIBILITIES = ['internal', 'restricted', 'public'];
export const AGENCY_CREATION_ASSET_TYPES = ['image', 'video', 'document', 'link'];
export const AGENCY_CREATION_COLLABORATOR_STATUSES = ['invited', 'active', 'declined', 'removed'];

JobApplication.belongsTo(User, { foreignKey: 'assignedRecruiterId', as: 'assignedRecruiter' });
User.hasMany(JobApplication, { foreignKey: 'assignedRecruiterId', as: 'assignedApplications' });
JobApplicationNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(JobApplicationNote, { foreignKey: 'authorId', as: 'jobApplicationNotes' });
JobApplicationDocument.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });
User.hasMany(JobApplicationDocument, { foreignKey: 'uploadedById', as: 'jobApplicationDocuments' });
JobApplicationInterview.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
User.hasMany(JobApplicationInterview, { foreignKey: 'createdById', as: 'jobApplicationInterviews' });
export const User = sequelize.define(
  'User',
  {
    firstName: { type: DataTypes.STRING(120), allowNull: false },
    lastName: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(255), unique: true, allowNull: false, validate: { isEmail: true } },
    password: { type: DataTypes.STRING(255), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    age: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 13 } },
    phoneNumber: { type: DataTypes.STRING(30), allowNull: true },
    jobTitle: { type: DataTypes.STRING(120), allowNull: true },
    avatarUrl: { type: DataTypes.STRING(2048), allowNull: true },
    status: { type: DataTypes.ENUM(...USER_STATUSES), allowNull: false, defaultValue: 'active' },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
    userType: {
      type: DataTypes.ENUM('user', 'company', 'freelancer', 'agency', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    twoFactorEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    twoFactorMethod: {
      type: DataTypes.ENUM(...TWO_FACTOR_METHODS),
      allowNull: false,
      defaultValue: 'email',
    },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    googleId: { type: DataTypes.STRING(255), allowNull: true },
    appleId: { type: DataTypes.STRING(255), allowNull: true },
    linkedinId: { type: DataTypes.STRING(255), allowNull: true },
    memberships: { type: jsonType, allowNull: false, defaultValue: [] },
    primaryDashboard: { type: DataTypes.STRING(60), allowNull: true },
  },
  {
    tableName: 'users',
    indexes: [
      { fields: ['email'] },
      { fields: ['status'] },
      { fields: ['userType'] },
      { fields: ['googleId'], unique: true },
      { fields: ['appleId'], unique: true },
      { fields: ['linkedinId'], unique: true },
    ],
  },
);

export const UserDashboardOverview = sequelize.define(
  'UserDashboardOverview',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    greetingName: { type: DataTypes.STRING(120), allowNull: true },
    headline: { type: DataTypes.STRING(180), allowNull: true },
    overview: { type: DataTypes.TEXT, allowNull: true },
    followersCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    followersGoal: { type: DataTypes.INTEGER, allowNull: true },
    avatarUrl: { type: DataTypes.STRING(2048), allowNull: true },
    bannerImageUrl: { type: DataTypes.STRING(2048), allowNull: true },
    trustScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    trustScoreLabel: { type: DataTypes.STRING(120), allowNull: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    weatherLocation: { type: DataTypes.STRING(180), allowNull: true },
    weatherLatitude: { type: DataTypes.DECIMAL(10, 6), allowNull: true },
    weatherLongitude: { type: DataTypes.DECIMAL(10, 6), allowNull: true },
    weatherUnits: {
      type: DataTypes.ENUM(...WEATHER_UNIT_OPTIONS),
      allowNull: false,
      defaultValue: 'metric',
    },
    weatherSnapshot: { type: jsonType, allowNull: true },
    weatherUpdatedAt: { type: DataTypes.DATE, allowNull: true },
    meta: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'user_dashboard_overviews',
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['weatherLocation'] },
    ],
  },
);

UserDashboardOverview.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const numeric = (value) => {
    if (value == null) return null;
    const coerced = Number(value);
    return Number.isFinite(coerced) ? coerced : null;
  };

  const snapshot = plain.weatherSnapshot ?? null;
  const weather = snapshot
    ? {
        ...snapshot,
        location: snapshot.location ?? plain.weatherLocation ?? null,
        latitude: snapshot.latitude ?? numeric(plain.weatherLatitude),
        longitude: snapshot.longitude ?? numeric(plain.weatherLongitude),
        units: snapshot.units ?? plain.weatherUnits ?? 'metric',
        updatedAt: snapshot.updatedAt ?? plain.weatherUpdatedAt ?? null,
      }
    : {
        location: plain.weatherLocation ?? null,
        latitude: numeric(plain.weatherLatitude),
        longitude: numeric(plain.weatherLongitude),
        units: plain.weatherUnits ?? 'metric',
        updatedAt: plain.weatherUpdatedAt ?? null,
      };

  return {
    id: plain.id,
    userId: plain.userId,
    greetingName: plain.greetingName ?? null,
    headline: plain.headline ?? null,
    overview: plain.overview ?? null,
    followers: {
      count: plain.followersCount ?? 0,
      goal: plain.followersGoal ?? null,
    },
    avatarUrl: plain.avatarUrl ?? null,
    bannerImageUrl: plain.bannerImageUrl ?? null,
    trust: {
      score: numeric(plain.trustScore),
      label: plain.trustScoreLabel ?? null,
    },
    rating: {
      score: numeric(plain.rating),
      count: plain.ratingCount ?? 0,
    },
    weather,
    meta: plain.meta ?? null,
    updatedAt: plain.updatedAt ?? null,
    createdAt: plain.createdAt ?? null,
  };
};

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
        { phoneNumber: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
      ],
    },
    limit: 20,
    order: [['lastName', 'ASC']],
  });
};

registerEventManagementAssociations({ User });

export const UserLoginAudit = sequelize.define(
  'UserLoginAudit',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    eventType: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'login' },
    ipAddress: { type: DataTypes.STRING(120), allowNull: true },
    userAgent: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'user_login_audits',
    indexes: [
      { fields: ['userId'] },
      { fields: ['eventType'] },
      { fields: ['createdAt'] },
    ],
  },
);

UserLoginAudit.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    eventType: plain.eventType,
    ipAddress: plain.ipAddress,
    userAgent: plain.userAgent,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
  };
};

export const UserRole = sequelize.define(
  'UserRole',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.STRING(80), allowNull: false },
    assignedBy: { type: DataTypes.INTEGER, allowNull: true },
    assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'user_roles',
    indexes: [
      { unique: true, fields: ['userId', 'role'] },
      { fields: ['role'] },
    ],
  },
);

export const UserNote = sequelize.define(
  'UserNote',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    visibility: {
      type: DataTypes.ENUM('internal', 'restricted'),
      allowNull: false,
      defaultValue: 'internal',
    },
    body: { type: DataTypes.TEXT, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'user_notes',
    indexes: [
      { fields: ['userId'] },
      { fields: ['authorId'] },
      { fields: ['createdAt'] },
    ],
  },
);

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
    geoLocation: { type: jsonType, allowNull: true },
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
    avatarUrl: { type: DataTypes.STRING(1024), allowNull: true },
    avatarStorageKey: { type: DataTypes.STRING(255), allowNull: true },
    avatarUpdatedAt: { type: DataTypes.DATE, allowNull: true },
    profileVisibility: {
      type: DataTypes.ENUM(...PROFILE_VISIBILITY_OPTIONS),
      allowNull: false,
      defaultValue: 'members',
      validate: { isIn: [PROFILE_VISIBILITY_OPTIONS] },
    },
    networkVisibility: {
      type: DataTypes.ENUM(...PROFILE_NETWORK_VISIBILITY_OPTIONS),
      allowNull: false,
      defaultValue: 'connections',
      validate: { isIn: [PROFILE_NETWORK_VISIBILITY_OPTIONS] },
    },
    followersVisibility: {
      type: DataTypes.ENUM(...PROFILE_FOLLOWERS_VISIBILITY_OPTIONS),
      allowNull: false,
      defaultValue: 'connections',
      validate: { isIn: [PROFILE_FOLLOWERS_VISIBILITY_OPTIONS] },
    },
    socialLinks: { type: jsonType, allowNull: true },
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
    displayName: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    lastInteractedAt: { type: DataTypes.DATE, allowNull: true },
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

const PROFILE_ADMIN_NOTE_VISIBILITIES = ['internal', 'shared'];

export const ProfileAdminNote = sequelize.define(
  'ProfileAdminNote',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    visibility: {
      type: DataTypes.ENUM(...PROFILE_ADMIN_NOTE_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
      validate: { isIn: [PROFILE_ADMIN_NOTE_VISIBILITIES] },
    },
    pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'profile_admin_notes',
    defaultScope: {
      order: [
        ['pinned', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    },
  },
);

ProfileAdminNote.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    profileId: plain.profileId,
    authorId: plain.authorId ?? null,
    visibility: plain.visibility,
    pinned: Boolean(plain.pinned),
    body: plain.body,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
};

export const CompanyProfile = sequelize.define(
  'CompanyProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    companyName: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    website: { type: DataTypes.STRING(255), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    logoUrl: { type: DataTypes.STRING(500), allowNull: true },
    bannerUrl: { type: DataTypes.STRING(500), allowNull: true },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true },
    contactPhone: { type: DataTypes.STRING(60), allowNull: true },
    socialLinks: { type: jsonType, allowNull: true },
  },
  { tableName: 'company_profiles' },
);

export const CompanyProfileFollower = sequelize.define(
  'CompanyProfileFollower',
  {
    companyProfileId: { type: DataTypes.INTEGER, allowNull: false },
    followerId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'blocked'),
      allowNull: false,
      defaultValue: 'active',
    },
    notificationsEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'company_profile_followers',
    indexes: [
      { fields: ['companyProfileId'] },
      { fields: ['followerId'] },
      { unique: true, fields: ['companyProfileId', 'followerId'] },
    ],
  },
);

export const CompanyProfileConnection = sequelize.define(
  'CompanyProfileConnection',
  {
    companyProfileId: { type: DataTypes.INTEGER, allowNull: false },
    targetUserId: { type: DataTypes.INTEGER, allowNull: false },
    targetCompanyProfileId: { type: DataTypes.INTEGER, allowNull: true },
    relationshipType: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'archived', 'blocked'),
      allowNull: false,
      defaultValue: 'pending',
    },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true },
    contactPhone: { type: DataTypes.STRING(60), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    lastInteractedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'company_profile_connections',
    indexes: [
      { fields: ['companyProfileId'] },
      { fields: ['targetUserId'] },
      { unique: true, fields: ['companyProfileId', 'targetUserId'] },
    ],
  },
);

export const CompanyDashboardOverview = sequelize.define(
  'CompanyDashboardOverview',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    displayName: { type: DataTypes.STRING(150), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    avatarUrl: { type: DataTypes.STRING(1024), allowNull: true },
    followerCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    trustScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    preferences: { type: jsonType, allowNull: true },
    lastEditedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'company_dashboard_overviews',
    indexes: [
      { unique: true, fields: ['workspaceId'] },
      { fields: ['lastEditedById'] },
    ],
  },
);

export const AgencyProfile = sequelize.define(
  'AgencyProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    agencyName: { type: DataTypes.STRING(255), allowNull: false },
    focusArea: { type: DataTypes.STRING(255), allowNull: true },
    website: { type: DataTypes.STRING(255), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    tagline: { type: DataTypes.STRING(160), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    about: { type: DataTypes.TEXT, allowNull: true },
    services: { type: jsonType, allowNull: true },
    industries: { type: jsonType, allowNull: true },
    clients: { type: jsonType, allowNull: true },
    awards: { type: jsonType, allowNull: true },
    socialLinks: { type: jsonType, allowNull: true },
    teamSize: { type: DataTypes.INTEGER, allowNull: true },
    foundedYear: { type: DataTypes.INTEGER, allowNull: true },
    primaryContactName: { type: DataTypes.STRING(160), allowNull: true },
    primaryContactEmail: { type: DataTypes.STRING(255), allowNull: true },
    primaryContactPhone: { type: DataTypes.STRING(60), allowNull: true },
    brandColor: { type: DataTypes.STRING(12), allowNull: true },
    bannerUrl: { type: DataTypes.STRING(500), allowNull: true },
    avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
    avatarStorageKey: { type: DataTypes.STRING(500), allowNull: true },
    autoAcceptFollowers: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    defaultConnectionMessage: { type: DataTypes.TEXT, allowNull: true },
    followerPolicy: {
      type: DataTypes.ENUM('open', 'approval_required', 'closed'),
      allowNull: false,
      defaultValue: 'open',
    },
    connectionPolicy: {
      type: DataTypes.ENUM('open', 'invite_only', 'manual_review'),
      allowNull: false,
      defaultValue: 'open',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    introVideoUrl: { type: DataTypes.STRING(500), allowNull: true },
    bannerImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    profileImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    workforceAvailable: { type: DataTypes.INTEGER, allowNull: true },
    workforceNotes: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'agency_profiles' },
);

export const AgencyCreationItem = sequelize.define(
  'AgencyCreationItem',
  {
    agencyProfileId: { type: DataTypes.INTEGER, allowNull: false },
    ownerWorkspaceId: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: false },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: true },
    targetType: {
      type: DataTypes.ENUM(...AGENCY_CREATION_TARGET_TYPES),
      allowNull: false,
      validate: { isIn: [AGENCY_CREATION_TARGET_TYPES] },
    },
    status: {
      type: DataTypes.ENUM(...AGENCY_CREATION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [AGENCY_CREATION_STATUSES] },
    },
    priority: {
      type: DataTypes.ENUM(...AGENCY_CREATION_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [AGENCY_CREATION_PRIORITIES] },
    },
    visibility: {
      type: DataTypes.ENUM(...AGENCY_CREATION_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
      validate: { isIn: [AGENCY_CREATION_VISIBILITIES] },
    },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT('long'), allowNull: true },
    callToAction: { type: DataTypes.STRING(160), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(500), allowNull: true },
    applicationInstructions: { type: DataTypes.TEXT, allowNull: true },
    requirements: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    launchDate: { type: DataTypes.DATE, allowNull: true },
    closingDate: { type: DataTypes.DATE, allowNull: true },
    budgetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetCurrency: { type: DataTypes.STRING(6), allowNull: true },
    capacityNeeded: { type: DataTypes.INTEGER, allowNull: true },
    expectedAttendees: { type: DataTypes.INTEGER, allowNull: true },
    experienceLevel: { type: DataTypes.STRING(120), allowNull: true },
    audience: { type: jsonType, allowNull: true },
    autoShareChannels: { type: jsonType, allowNull: true },
    settings: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    contactEmail: { type: DataTypes.STRING(180), allowNull: true },
    contactPhone: { type: DataTypes.STRING(60), allowNull: true },
  },
  { tableName: 'agency_creation_items' },
);

export const AgencyCreationAsset = sequelize.define(
  'AgencyCreationAsset',
  {
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    uploadedById: { type: DataTypes.INTEGER, allowNull: true },
    label: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    assetType: {
      type: DataTypes.ENUM(...AGENCY_CREATION_ASSET_TYPES),
      allowNull: false,
      defaultValue: 'link',
      validate: { isIn: [AGENCY_CREATION_ASSET_TYPES] },
    },
    url: { type: DataTypes.STRING(500), allowNull: false },
    thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'agency_creation_item_assets' },
);

export const AgencyCreationCollaborator = sequelize.define(
  'AgencyCreationCollaborator',
  {
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    collaboratorId: { type: DataTypes.INTEGER, allowNull: true },
    collaboratorEmail: { type: DataTypes.STRING(255), allowNull: true },
    collaboratorName: { type: DataTypes.STRING(160), allowNull: true },
    role: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'Contributor' },
    status: {
      type: DataTypes.ENUM(...AGENCY_CREATION_COLLABORATOR_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
      validate: { isIn: [AGENCY_CREATION_COLLABORATOR_STATUSES] },
    },
    permissions: { type: jsonType, allowNull: true },
    addedById: { type: DataTypes.INTEGER, allowNull: true },
    invitedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'agency_creation_collaborators' },
);
export const AgencyTimelinePost = sequelize.define(
  'AgencyTimelinePost',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    excerpt: { type: DataTypes.STRING(500), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...AGENCY_TIMELINE_POST_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [AGENCY_TIMELINE_POST_STATUSES] },
    },
    visibility: {
      type: DataTypes.ENUM(...AGENCY_TIMELINE_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
      validate: { isIn: [AGENCY_TIMELINE_VISIBILITIES] },
    },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
    lastSentAt: { type: DataTypes.DATE, allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(512), allowNull: true },
    thumbnailUrl: { type: DataTypes.STRING(512), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    distributionChannels: { type: jsonType, allowNull: true },
    audienceRoles: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    engagementScore: { type: DataTypes.DECIMAL(9, 4), allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'agency_timeline_posts',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['publishedAt'] },
      { fields: ['scheduledAt'] },
      { unique: true, fields: ['slug'] },
    ],
  },
);

export const AgencyTimelinePostRevision = sequelize.define(
  'AgencyTimelinePostRevision',
  {
    postId: { type: DataTypes.INTEGER, allowNull: false },
    editorId: { type: DataTypes.INTEGER, allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    title: { type: DataTypes.STRING(180), allowNull: true },
    excerpt: { type: DataTypes.STRING(500), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    changeSummary: { type: DataTypes.STRING(400), allowNull: true },
    diff: { type: jsonType, allowNull: true },
    snapshot: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_timeline_post_revisions',
    indexes: [
      { fields: ['postId'] },
      { unique: true, fields: ['postId', 'version'] },
    ],
  },
);

export const AgencyTimelinePostMetric = sequelize.define(
  'AgencyTimelinePostMetric',
  {
    postId: { type: DataTypes.INTEGER, allowNull: false },
    periodStart: { type: DataTypes.DATE, allowNull: false },
    periodEnd: { type: DataTypes.DATE, allowNull: false },
    channel: { type: DataTypes.STRING(80), allowNull: true },
    impressions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    clicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    engagements: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    shares: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    comments: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    leads: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    audience: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    conversionRate: { type: DataTypes.DECIMAL(8, 4), allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_timeline_post_metrics',
    indexes: [
      { fields: ['postId'] },
      { fields: ['periodStart'] },
      { fields: ['periodEnd'] },
      { fields: ['channel'] },
      { unique: true, fields: ['postId', 'periodStart', 'periodEnd', 'channel'] },
    ],
  },
);

export const FreelancerProfile = sequelize.define(
  'FreelancerProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: true },
    hourlyRate: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    availability: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
  },
  { tableName: 'freelancer_profiles' },
);

export const FreelancerDashboardOverview = sequelize.define(
  'FreelancerDashboardOverview',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    avatarUrl: { type: DataTypes.STRING(2048), allowNull: true },
    followerCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    followerGoal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    trustScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    trustScoreChange: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    workstreams: { type: jsonType, allowNull: false, defaultValue: [] },
    highlights: { type: jsonType, allowNull: false, defaultValue: [] },
    relationshipHealth: { type: jsonType, allowNull: true },
    upcomingSchedule: { type: jsonType, allowNull: false, defaultValue: [] },
    weatherLocation: { type: DataTypes.STRING(255), allowNull: true },
    weatherLatitude: { type: DataTypes.DECIMAL(10, 6), allowNull: true },
    weatherLongitude: { type: DataTypes.DECIMAL(10, 6), allowNull: true },
    weatherUnits: {
      type: DataTypes.ENUM('metric', 'imperial'),
      allowNull: false,
      defaultValue: 'metric',
      validate: { isIn: [['metric', 'imperial']] },
    },
    weatherLastCheckedAt: { type: DataTypes.DATE, allowNull: true },
    weatherSnapshot: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'freelancer_dashboard_overviews' },
);

export const FreelancerOperationsMembership = sequelize.define(
  'FreelancerOperationsMembership',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    slug: { type: DataTypes.STRING(120), allowNull: false },
    name: { type: DataTypes.STRING(180), allowNull: false },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'active' },
    role: { type: DataTypes.STRING(120), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    requestedAt: { type: DataTypes.DATE, allowNull: true },
    activatedAt: { type: DataTypes.DATE, allowNull: true },
    lastReviewedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_operations_memberships',
    indexes: [
      { unique: true, fields: ['freelancerId', 'slug'] },
      { fields: ['freelancerId', 'status'] },
    ],
  },
);

export const FreelancerOperationsWorkflow = sequelize.define(
  'FreelancerOperationsWorkflow',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    slug: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'tracking' },
    completion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    blockers: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_operations_workflows',
    indexes: [
      { unique: true, fields: ['freelancerId', 'slug'] },
      { fields: ['freelancerId', 'status'] },
    ],
  },
);

export const FreelancerOperationsNotice = sequelize.define(
  'FreelancerOperationsNotice',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    slug: { type: DataTypes.STRING(120), allowNull: false },
    tone: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'info' },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    acknowledged: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    acknowledgedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_operations_notices',
    indexes: [
      { unique: true, fields: ['freelancerId', 'slug'] },
      { fields: ['freelancerId', 'acknowledged'] },
    ],
  },
);

export const FreelancerOperationsSnapshot = sequelize.define(
  'FreelancerOperationsSnapshot',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    activeWorkflows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    escalations: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    automationCoverage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    complianceScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    outstandingTasks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    recentApprovals: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    nextReviewAt: { type: DataTypes.DATE, allowNull: true },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_operations_snapshots',
    indexes: [{ unique: true, fields: ['freelancerId'] }],
  },
);
export const AgencyProfileMedia = sequelize.define(
  'AgencyProfileMedia',
  {
    agencyProfileId: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'image',
      validate: { isIn: [AGENCY_PROFILE_MEDIA_ALLOWED_TYPES] },
    },
    title: { type: DataTypes.STRING(160), allowNull: true },
    url: { type: DataTypes.STRING(2048), allowNull: false },
    altText: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_profile_media',
    indexes: [
      { fields: ['agencyProfileId'] },
      { fields: ['agencyProfileId', 'type'] },
      { fields: ['position'] },
    ],
  },
);

export const AgencyProfileSkill = sequelize.define(
  'AgencyProfileSkill',
  {
    agencyProfileId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: true },
    proficiency: { type: DataTypes.INTEGER, allowNull: true },
    experienceYears: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'agency_profile_skills',
    indexes: [
      { fields: ['agencyProfileId'] },
      { fields: ['agencyProfileId', 'name'] },
    ],
  },
);

export const AgencyProfileCredential = sequelize.define(
  'AgencyProfileCredential',
  {
    agencyProfileId: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'qualification',
      validate: { isIn: [AGENCY_PROFILE_CREDENTIAL_TYPES] },
    },
    title: { type: DataTypes.STRING(180), allowNull: false },
    issuer: { type: DataTypes.STRING(180), allowNull: true },
    issuedAt: { type: DataTypes.DATEONLY, allowNull: true },
    expiresAt: { type: DataTypes.DATEONLY, allowNull: true },
    credentialUrl: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    referenceId: { type: DataTypes.STRING(120), allowNull: true },
    verificationStatus: { type: DataTypes.STRING(60), allowNull: true },
  },
  {
    tableName: 'agency_profile_credentials',
    indexes: [
      { fields: ['agencyProfileId'] },
      { fields: ['agencyProfileId', 'type'] },
      { fields: ['issuedAt'] },
    ],
  },
);

export const AgencyProfileExperience = sequelize.define(
  'AgencyProfileExperience',
  {
    agencyProfileId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    client: { type: DataTypes.STRING(180), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    isCurrent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    impact: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'agency_profile_experiences',
    indexes: [
      { fields: ['agencyProfileId'] },
      { fields: ['agencyProfileId', 'isCurrent'] },
      { fields: ['position'] },
    ],
  },
);

export const AgencyProfileWorkforceSegment = sequelize.define(
  'AgencyProfileWorkforceSegment',
  {
    agencyProfileId: { type: DataTypes.INTEGER, allowNull: false },
    segmentName: { type: DataTypes.STRING(180), allowNull: false },
    specialization: { type: DataTypes.STRING(180), allowNull: true },
    availableCount: { type: DataTypes.INTEGER, allowNull: true },
    totalCount: { type: DataTypes.INTEGER, allowNull: true },
    deliveryModel: { type: DataTypes.STRING(60), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    availabilityNotes: { type: DataTypes.TEXT, allowNull: true },
    averageBillRate: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(6), allowNull: true },
    leadTimeDays: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'agency_profile_workforce_segments',
    indexes: [
      { fields: ['agencyProfileId'] },
      { fields: ['agencyProfileId', 'segmentName'] },
    ],
  },
);

export const IdentityVerification = sequelize.define(
  'IdentityVerification',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...ID_VERIFICATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [ID_VERIFICATION_STATUSES] },
    },
    verificationProvider: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'manual_review' },
    typeOfId: { type: DataTypes.STRING(120), allowNull: true },
    idNumberLast4: { type: DataTypes.STRING(16), allowNull: true },
    issuingCountry: { type: DataTypes.STRING(4), allowNull: true },
    issuedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    documentFrontKey: { type: DataTypes.STRING(500), allowNull: true },
    documentBackKey: { type: DataTypes.STRING(500), allowNull: true },
    selfieKey: { type: DataTypes.STRING(500), allowNull: true },
    fullName: { type: DataTypes.STRING(255), allowNull: false },
    dateOfBirth: { type: DataTypes.DATE, allowNull: false },
    addressLine1: { type: DataTypes.STRING(255), allowNull: false },
    addressLine2: { type: DataTypes.STRING(255), allowNull: true },
    city: { type: DataTypes.STRING(120), allowNull: false },
    state: { type: DataTypes.STRING(120), allowNull: true },
    postalCode: { type: DataTypes.STRING(40), allowNull: false },
    country: { type: DataTypes.STRING(4), allowNull: false },
    reviewNotes: { type: DataTypes.TEXT, allowNull: true },
    declinedReason: { type: DataTypes.TEXT, allowNull: true },
    reviewerId: { type: DataTypes.INTEGER, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'identity_verifications',
    indexes: [
      { fields: ['userId'] },
      { fields: ['profileId'] },
      { fields: ['status'] },
      { fields: ['verificationProvider'] },
    ],
  },
);

IdentityVerification.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    profileId: plain.profileId,
    status: plain.status,
    verificationProvider: plain.verificationProvider,
    typeOfId: plain.typeOfId,
    idNumberLast4: plain.idNumberLast4,
    issuingCountry: plain.issuingCountry,
    issuedAt: plain.issuedAt,
    expiresAt: plain.expiresAt,
    documentFrontKey: plain.documentFrontKey,
    documentBackKey: plain.documentBackKey,
    selfieKey: plain.selfieKey,
    fullName: plain.fullName,
    dateOfBirth: plain.dateOfBirth,
    addressLine1: plain.addressLine1,
    addressLine2: plain.addressLine2,
    city: plain.city,
    state: plain.state,
    postalCode: plain.postalCode,
    country: plain.country,
    reviewNotes: plain.reviewNotes,
    declinedReason: plain.declinedReason,
    reviewerId: plain.reviewerId,
    submittedAt: plain.submittedAt,
    reviewedAt: plain.reviewedAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const IdentityVerificationEvent = sequelize.define(
  'IdentityVerificationEvent',
  {
    identityVerificationId: { type: DataTypes.INTEGER, allowNull: false },
    eventType: {
      type: DataTypes.ENUM(...ID_VERIFICATION_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'note',
      validate: { isIn: [ID_VERIFICATION_EVENT_TYPES] },
    },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    actorRole: { type: DataTypes.STRING(80), allowNull: true },
    fromStatus: { type: DataTypes.STRING(60), allowNull: true },
    toStatus: { type: DataTypes.STRING(60), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'identity_verification_events',
    indexes: [
      { fields: ['identityVerificationId'] },
      { fields: ['eventType'] },
      { fields: ['createdAt'] },
    ],
  },
);

IdentityVerificationEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    identityVerificationId: plain.identityVerificationId,
    eventType: plain.eventType,
    actorId: plain.actorId,
    actorRole: plain.actorRole,
    fromStatus: plain.fromStatus,
    toStatus: plain.toStatus,
    note: plain.note,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CorporateVerification = sequelize.define(
  'CorporateVerification',
  {
    ownerType: {
      type: DataTypes.ENUM('company', 'agency'),
      allowNull: false,
      defaultValue: 'company',
      validate: { isIn: [['company', 'agency']] },
    },
    companyProfileId: { type: DataTypes.INTEGER, allowNull: true },
    agencyProfileId: { type: DataTypes.INTEGER, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...CORPORATE_VERIFICATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [CORPORATE_VERIFICATION_STATUSES] },
    },
    companyName: { type: DataTypes.STRING(255), allowNull: false },
    registrationNumber: { type: DataTypes.STRING(160), allowNull: true },
    registrationCountry: { type: DataTypes.STRING(4), allowNull: true },
    registeredAddressLine1: { type: DataTypes.STRING(255), allowNull: false },
    registeredAddressLine2: { type: DataTypes.STRING(255), allowNull: true },
    registeredCity: { type: DataTypes.STRING(120), allowNull: false },
    registeredState: { type: DataTypes.STRING(120), allowNull: true },
    registeredPostalCode: { type: DataTypes.STRING(40), allowNull: false },
    registeredCountry: { type: DataTypes.STRING(4), allowNull: false },
    registrationDocumentKey: { type: DataTypes.STRING(500), allowNull: true },
    authorizationDocumentKey: { type: DataTypes.STRING(500), allowNull: true },
    ownershipEvidenceKey: { type: DataTypes.STRING(500), allowNull: true },
    domesticComplianceAttestation: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    domesticComplianceNotes: { type: DataTypes.TEXT, allowNull: true },
    authorizedRepresentativeName: { type: DataTypes.STRING(255), allowNull: false },
    authorizedRepresentativeEmail: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
    authorizedRepresentativeTitle: { type: DataTypes.STRING(255), allowNull: true },
    authorizationExpiresAt: { type: DataTypes.DATE, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    reviewerId: { type: DataTypes.INTEGER, allowNull: true },
    reviewNotes: { type: DataTypes.TEXT, allowNull: true },
    declineReason: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'corporate_verifications',
    indexes: [
      { fields: ['ownerType'] },
      { fields: ['companyProfileId'] },
      { fields: ['agencyProfileId'] },
      { fields: ['status'] },
    ],
  },
);

CorporateVerification.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    ownerType: plain.ownerType,
    companyProfileId: plain.companyProfileId,
    agencyProfileId: plain.agencyProfileId,
    userId: plain.userId,
    status: plain.status,
    companyName: plain.companyName,
    registrationNumber: plain.registrationNumber,
    registrationCountry: plain.registrationCountry,
    registeredAddressLine1: plain.registeredAddressLine1,
    registeredAddressLine2: plain.registeredAddressLine2,
    registeredCity: plain.registeredCity,
    registeredState: plain.registeredState,
    registeredPostalCode: plain.registeredPostalCode,
    registeredCountry: plain.registeredCountry,
    registrationDocumentKey: plain.registrationDocumentKey,
    authorizationDocumentKey: plain.authorizationDocumentKey,
    ownershipEvidenceKey: plain.ownershipEvidenceKey,
    domesticComplianceAttestation: plain.domesticComplianceAttestation,
    domesticComplianceNotes: plain.domesticComplianceNotes,
    authorizedRepresentativeName: plain.authorizedRepresentativeName,
    authorizedRepresentativeEmail: plain.authorizedRepresentativeEmail,
    authorizedRepresentativeTitle: plain.authorizedRepresentativeTitle,
    authorizationExpiresAt: plain.authorizationExpiresAt,
    submittedAt: plain.submittedAt,
    reviewedAt: plain.reviewedAt,
    reviewerId: plain.reviewerId,
    reviewNotes: plain.reviewNotes,
    declineReason: plain.declineReason,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const QualificationCredential = sequelize.define(
  'QualificationCredential',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    sourceType: {
      type: DataTypes.ENUM('transcript', 'certificate', 'portfolio', 'other'),
      allowNull: false,
      defaultValue: 'certificate',
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    issuer: { type: DataTypes.STRING(255), allowNull: true },
    issuedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM(...QUALIFICATION_CREDENTIAL_STATUSES),
      allowNull: false,
      defaultValue: 'unverified',
      validate: { isIn: [QUALIFICATION_CREDENTIAL_STATUSES] },
    },
    verificationNotes: { type: DataTypes.TEXT, allowNull: true },
    documentKey: { type: DataTypes.STRING(500), allowNull: true },
    evidenceMetadata: { type: jsonType, allowNull: true },
    lastReviewedAt: { type: DataTypes.DATE, allowNull: true },
    reviewerId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'qualification_credentials',
    indexes: [
      { fields: ['userId'] },
      { fields: ['profileId'] },
      { fields: ['status'] },
      { fields: ['sourceType'] },
    ],
  },
);

QualificationCredential.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    profileId: plain.profileId,
    sourceType: plain.sourceType,
    title: plain.title,
    issuer: plain.issuer,
    issuedAt: plain.issuedAt,
    expiresAt: plain.expiresAt,
    status: plain.status,
    verificationNotes: plain.verificationNotes,
    documentKey: plain.documentKey,
    evidenceMetadata: plain.evidenceMetadata ?? null,
    lastReviewedAt: plain.lastReviewedAt,
    reviewerId: plain.reviewerId,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WalletAccount = sequelize.define(
  'WalletAccount',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    displayName: { type: DataTypes.STRING(120), allowNull: true },
    accountType: {
      type: DataTypes.ENUM(...WALLET_ACCOUNT_TYPES),
      allowNull: false,
      defaultValue: 'user',
      validate: { isIn: [WALLET_ACCOUNT_TYPES] },
    },
    custodyProvider: {
      type: DataTypes.ENUM(...ESCROW_INTEGRATION_PROVIDERS),
      allowNull: false,
      defaultValue: 'stripe',
      validate: { isIn: [ESCROW_INTEGRATION_PROVIDERS] },
    },
    providerAccountId: { type: DataTypes.STRING(160), allowNull: true },
    status: {
      type: DataTypes.ENUM(...WALLET_ACCOUNT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [WALLET_ACCOUNT_STATUSES] },
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    currentBalance: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    availableBalance: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    pendingHoldBalance: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    lastReconciledAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'wallet_accounts',
    indexes: [
      { fields: ['userId'] },
      { fields: ['profileId'] },
      { fields: ['accountType'] },
      { fields: ['custodyProvider'] },
      { fields: ['status'] },
      { unique: true, fields: ['profileId', 'accountType'] },
    ],
  },
);

WalletAccount.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    profileId: plain.profileId,
    workspaceId: plain.workspaceId,
    displayName: plain.displayName ?? null,
    accountType: plain.accountType,
    custodyProvider: plain.custodyProvider,
    providerAccountId: plain.providerAccountId,
    status: plain.status,
    currencyCode: plain.currencyCode,
    currentBalance: Number.parseFloat(plain.currentBalance ?? 0),
    availableBalance: Number.parseFloat(plain.availableBalance ?? 0),
    pendingHoldBalance: Number.parseFloat(plain.pendingHoldBalance ?? 0),
    lastReconciledAt: plain.lastReconciledAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WalletLedgerEntry = sequelize.define(
  'WalletLedgerEntry',
  {
    walletAccountId: { type: DataTypes.INTEGER, allowNull: false },
    entryType: {
      type: DataTypes.ENUM(...WALLET_LEDGER_ENTRY_TYPES),
      allowNull: false,
      defaultValue: 'credit',
      validate: { isIn: [WALLET_LEDGER_ENTRY_TYPES] },
    },
    amount: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    reference: { type: DataTypes.STRING(160), allowNull: false },
    externalReference: { type: DataTypes.STRING(160), allowNull: true },
    description: { type: DataTypes.STRING(500), allowNull: true },
    initiatedById: { type: DataTypes.INTEGER, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    balanceAfter: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'wallet_ledger_entries',
    indexes: [
      { fields: ['walletAccountId'] },
      { unique: true, fields: ['reference'] },
      { fields: ['entryType'] },
    ],
  },
);

WalletLedgerEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    walletAccountId: plain.walletAccountId,
    entryType: plain.entryType,
    amount: Number.parseFloat(plain.amount ?? 0),
    currencyCode: plain.currencyCode,
    reference: plain.reference,
    externalReference: plain.externalReference,
    description: plain.description,
    initiatedById: plain.initiatedById,
    occurredAt: plain.occurredAt,
    balanceAfter: Number.parseFloat(plain.balanceAfter ?? 0),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WalletFundingSource = sequelize.define(
  'WalletFundingSource',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    walletAccountId: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM(...WALLET_FUNDING_SOURCE_TYPES),
      allowNull: false,
      defaultValue: 'bank_account',
      validate: { isIn: [WALLET_FUNDING_SOURCE_TYPES] },
    },
    label: { type: DataTypes.STRING(160), allowNull: false },
    status: {
      type: DataTypes.ENUM(...WALLET_FUNDING_SOURCE_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [WALLET_FUNDING_SOURCE_STATUSES] },
    },
    provider: { type: DataTypes.STRING(120), allowNull: true },
    externalReference: { type: DataTypes.STRING(160), allowNull: true },
    lastFour: { type: DataTypes.STRING(8), allowNull: true },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    connectedAt: { type: DataTypes.DATE, allowNull: true },
    disabledAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'wallet_funding_sources',
    indexes: [
      { fields: ['userId'] },
      { fields: ['walletAccountId'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { unique: true, fields: ['walletAccountId', 'externalReference'] },
    ],
  },
);

WalletFundingSource.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    walletAccountId: plain.walletAccountId,
    type: plain.type,
    label: plain.label,
    status: plain.status,
    provider: plain.provider,
    externalReference: plain.externalReference,
    lastFour: plain.lastFour,
    currencyCode: plain.currencyCode,
    isPrimary: Boolean(plain.isPrimary),
    connectedAt: plain.connectedAt,
    disabledAt: plain.disabledAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WalletTransferRule = sequelize.define(
  'WalletTransferRule',
  {
    walletAccountId: { type: DataTypes.INTEGER, allowNull: false },
    fundingSourceId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    transferType: {
      type: DataTypes.ENUM(...WALLET_TRANSFER_TYPES),
      allowNull: false,
      defaultValue: 'payout',
      validate: { isIn: [WALLET_TRANSFER_TYPES] },
    },
    cadence: {
      type: DataTypes.ENUM(...WALLET_TRANSFER_RULE_CADENCES),
      allowNull: false,
      defaultValue: 'monthly',
      validate: { isIn: [WALLET_TRANSFER_RULE_CADENCES] },
    },
    status: {
      type: DataTypes.ENUM(...WALLET_TRANSFER_RULE_STATUSES),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [WALLET_TRANSFER_RULE_STATUSES] },
    },
    thresholdAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    thresholdCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    executionDay: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    lastExecutedAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'wallet_transfer_rules',
    indexes: [
      { fields: ['walletAccountId'] },
      { fields: ['fundingSourceId'] },
      { fields: ['status'] },
      { fields: ['transferType'] },
    ],
  },
);

WalletTransferRule.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    walletAccountId: plain.walletAccountId,
    fundingSourceId: plain.fundingSourceId,
    name: plain.name,
    transferType: plain.transferType,
    cadence: plain.cadence,
    status: plain.status,
    thresholdAmount: Number.parseFloat(plain.thresholdAmount ?? 0),
    thresholdCurrency: plain.thresholdCurrency,
    executionDay: plain.executionDay,
    metadata: plain.metadata ?? null,
    lastExecutedAt: plain.lastExecutedAt,
    createdById: plain.createdById,
    updatedById: plain.updatedById,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WalletTransferRequest = sequelize.define(
  'WalletTransferRequest',
  {
    walletAccountId: { type: DataTypes.INTEGER, allowNull: false },
    fundingSourceId: { type: DataTypes.INTEGER, allowNull: true },
    transferType: {
      type: DataTypes.ENUM(...WALLET_TRANSFER_TYPES),
      allowNull: false,
      defaultValue: 'payout',
      validate: { isIn: [WALLET_TRANSFER_TYPES] },
    },
    status: {
      type: DataTypes.ENUM(...WALLET_TRANSFER_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [WALLET_TRANSFER_STATUSES] },
    },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    reference: { type: DataTypes.STRING(160), allowNull: true, unique: true },
    requestedById: { type: DataTypes.INTEGER, allowNull: false },
    approvedById: { type: DataTypes.INTEGER, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    processedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'wallet_transfer_requests',
    indexes: [
      { fields: ['walletAccountId'] },
      { fields: ['fundingSourceId'] },
      { fields: ['status'] },
      { fields: ['transferType'] },
    ],
  },
);

WalletTransferRequest.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    walletAccountId: plain.walletAccountId,
    fundingSourceId: plain.fundingSourceId,
    transferType: plain.transferType,
    status: plain.status,
    amount: Number.parseFloat(plain.amount ?? 0),
    currencyCode: plain.currencyCode,
    reference: plain.reference,
    requestedById: plain.requestedById,
    approvedById: plain.approvedById,
    scheduledAt: plain.scheduledAt,
    processedAt: plain.processedAt,
    notes: plain.notes,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyWalletFundingSource = sequelize.define(
  'WalletFundingSource',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'bank_account',
      validate: { isIn: [WALLET_FUNDING_SOURCE_TYPES] },
    },
    provider: { type: DataTypes.STRING(120), allowNull: true },
    accountNumberLast4: { type: DataTypes.STRING(12), allowNull: true },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [WALLET_FUNDING_SOURCE_STATUSES] },
    },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'wallet_funding_sources',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['isPrimary'] },
    ],
  },
);

AgencyWalletFundingSource.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    label: plain.label,
    type: plain.type,
    provider: plain.provider,
    accountNumberLast4: plain.accountNumberLast4,
    currencyCode: plain.currencyCode,
    status: plain.status,
    isPrimary: Boolean(plain.isPrimary),
    metadata: plain.metadata ?? null,
    createdById: plain.createdById,
    updatedById: plain.updatedById,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WalletOperationalSetting = sequelize.define(
  'WalletOperationalSetting',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    lowBalanceAlertThreshold: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
    autoSweepEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoSweepThreshold: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
    reconciliationCadence: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: { isIn: [['daily', 'weekly', 'monthly']] },
    },
    dualControlEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    complianceContactEmail: { type: DataTypes.STRING(160), allowNull: true },
    payoutWindow: { type: DataTypes.STRING(40), allowNull: true },
    riskTier: {
      type: DataTypes.STRING(40),
      allowNull: true,
      validate: { isIn: [WALLET_RISK_TIERS] },
    },
    complianceNotes: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'wallet_operational_settings',
  },
);

WalletOperationalSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    lowBalanceAlertThreshold:
      plain.lowBalanceAlertThreshold != null ? Number.parseFloat(plain.lowBalanceAlertThreshold) : null,
    autoSweepEnabled: Boolean(plain.autoSweepEnabled),
    autoSweepThreshold:
      plain.autoSweepThreshold != null ? Number.parseFloat(plain.autoSweepThreshold) : null,
    reconciliationCadence: plain.reconciliationCadence ?? null,
    dualControlEnabled: Boolean(plain.dualControlEnabled),
    complianceContactEmail: plain.complianceContactEmail ?? null,
    payoutWindow: plain.payoutWindow ?? null,
    riskTier: plain.riskTier ?? null,
    complianceNotes: plain.complianceNotes ?? null,
    metadata: plain.metadata ?? null,
    createdById: plain.createdById,
    updatedById: plain.updatedById,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyWalletTransferRule = sequelize.define(
  'WalletTransferRule',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    triggerType: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'low_balance',
      validate: { isIn: [WALLET_TRANSFER_RULE_TRIGGER_TYPES] },
    },
    thresholdAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
    scheduleCron: { type: DataTypes.STRING(120), allowNull: true },
    destinationFundingSourceId: { type: DataTypes.INTEGER, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'wallet_transfer_rules',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['isActive'] },
    ],
  },
);

AgencyWalletTransferRule.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    triggerType: plain.triggerType,
    thresholdAmount: plain.thresholdAmount != null ? Number.parseFloat(plain.thresholdAmount) : null,
    scheduleCron: plain.scheduleCron ?? null,
    destinationFundingSourceId: plain.destinationFundingSourceId ?? null,
    isActive: Boolean(plain.isActive),
    metadata: plain.metadata ?? null,
    createdById: plain.createdById,
    updatedById: plain.updatedById,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WalletPayoutRequest = sequelize.define(
  'WalletPayoutRequest',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    walletAccountId: { type: DataTypes.INTEGER, allowNull: false },
    fundingSourceId: { type: DataTypes.INTEGER, allowNull: true },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'pending_review',
      validate: { isIn: [WALLET_PAYOUT_REQUEST_STATUSES] },
    },
    requestedById: { type: DataTypes.INTEGER, allowNull: false },
    reviewedById: { type: DataTypes.INTEGER, allowNull: true },
    processedById: { type: DataTypes.INTEGER, allowNull: true },
    requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    processedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'wallet_payout_requests',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['walletAccountId'] },
      { fields: ['status'] },
    ],
  },
);

WalletPayoutRequest.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    walletAccountId: plain.walletAccountId,
    fundingSourceId: plain.fundingSourceId ?? null,
    amount: Number.parseFloat(plain.amount ?? 0),
    currencyCode: plain.currencyCode,
    status: plain.status,
    requestedById: plain.requestedById,
    reviewedById: plain.reviewedById ?? null,
    processedById: plain.processedById ?? null,
    requestedAt: plain.requestedAt,
    approvedAt: plain.approvedAt,
    processedAt: plain.processedAt,
    notes: plain.notes ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

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

export const FeatureFlag = sequelize.define(
  'FeatureFlag',
  {
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...FEATURE_FLAG_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [FEATURE_FLAG_STATUSES] },
    },
    rolloutType: {
      type: DataTypes.ENUM(...FEATURE_FLAG_ROLLOUT_TYPES),
      allowNull: false,
      defaultValue: 'global',
      validate: { isIn: [FEATURE_FLAG_ROLLOUT_TYPES] },
    },
    rolloutPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'feature_flags',
    indexes: [
      { unique: true, fields: ['key'] },
      { fields: ['status'] },
      { fields: ['rolloutType'] },
    ],
  },
);

FeatureFlag.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    name: plain.name,
    description: plain.description ?? '',
    status: plain.status,
    rolloutType: plain.rolloutType,
    rolloutPercentage: plain.rolloutPercentage == null ? null : Number(plain.rolloutPercentage),
    metadata: plain.metadata ?? {},
    createdById: plain.createdById,
    updatedById: plain.updatedById,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FeatureFlagAssignment = sequelize.define(
  'FeatureFlagAssignment',
  {
    flagId: { type: DataTypes.INTEGER, allowNull: false },
    audienceType: {
      type: DataTypes.ENUM(...FEATURE_FLAG_AUDIENCE_TYPES),
      allowNull: false,
      defaultValue: 'user',
      validate: { isIn: [FEATURE_FLAG_AUDIENCE_TYPES] },
    },
    audienceValue: { type: DataTypes.STRING(255), allowNull: false },
    rolloutPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    conditions: { type: jsonType, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'feature_flag_assignments',
    indexes: [
      { fields: ['flagId'] },
      { fields: ['audienceType'] },
      { fields: ['audienceValue'] },
      { fields: ['expiresAt'] },
    ],
  },
);

FeatureFlagAssignment.prototype.toAssignmentConfig = function toAssignmentConfig() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    flagId: plain.flagId,
    audienceType: plain.audienceType,
    audienceValue: plain.audienceValue,
    rolloutPercentage: plain.rolloutPercentage == null ? null : Number(plain.rolloutPercentage),
    conditions: plain.conditions ?? null,
    expiresAt: plain.expiresAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ReputationTestimonial = sequelize.define(
  'ReputationTestimonial',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    clientName: { type: DataTypes.STRING(255), allowNull: false },
    clientRole: { type: DataTypes.STRING(255), allowNull: true },
    company: { type: DataTypes.STRING(255), allowNull: true },
    clientEmail: { type: DataTypes.STRING(255), allowNull: true },
    projectName: { type: DataTypes.STRING(255), allowNull: true },
    sourceUrl: { type: DataTypes.STRING(500), allowNull: true },
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
    moderationStatus: {
      type: DataTypes.ENUM(...REPUTATION_CONTENT_MODERATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [REPUTATION_CONTENT_MODERATION_STATUSES] },
    },
    moderationScore: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    moderationSummary: { type: DataTypes.TEXT, allowNull: true },
    moderationLabels: { type: jsonType, allowNull: true },
    moderatedAt: { type: DataTypes.DATE, allowNull: true },
    verifiedClient: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    verificationMetadata: { type: jsonType, allowNull: true },
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
    moderationStatus: {
      type: DataTypes.ENUM(...REPUTATION_CONTENT_MODERATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [REPUTATION_CONTENT_MODERATION_STATUSES] },
    },
    moderationScore: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    moderationSummary: { type: DataTypes.TEXT, allowNull: true },
    moderationLabels: { type: jsonType, allowNull: true },
    moderatedAt: { type: DataTypes.DATE, allowNull: true },
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
    theme: { type: DataTypes.STRING(120), allowNull: true },
    themeTokens: { type: jsonType, allowNull: true },
    embedScript: { type: DataTypes.TEXT, allowNull: true },
    config: { type: jsonType, allowNull: true },
    impressions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ctaClicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastPublishedAt: { type: DataTypes.DATE, allowNull: true },
    lastRenderedAt: { type: DataTypes.DATE, allowNull: true },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'reputation_review_widgets' },
);

export const FreelancerReview = sequelize.define(
  'FreelancerReview',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    reviewerName: { type: DataTypes.STRING(180), allowNull: true },
    reviewerRole: { type: DataTypes.STRING(180), allowNull: true },
    reviewerCompany: { type: DataTypes.STRING(180), allowNull: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [['draft', 'pending', 'published', 'archived']] },
    },
    highlighted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    reviewSource: { type: DataTypes.STRING(120), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    capturedAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    previewUrl: { type: DataTypes.STRING(512), allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(512), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    responses: { type: jsonType, allowNull: true },
    privateNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'freelancer_reviews' },
);

ReputationTestimonial.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    clientName: plain.clientName,
    clientRole: plain.clientRole ?? null,
    company: plain.company ?? null,
    clientEmail: plain.clientEmail ?? null,
    projectName: plain.projectName ?? null,
    sourceUrl: plain.sourceUrl ?? null,
    rating: plain.rating == null ? null : Number(plain.rating),
    comment: plain.comment,
    capturedAt: plain.capturedAt ?? null,
    deliveredAt: plain.deliveredAt ?? null,
    source: plain.source,
    status: plain.status,
    moderation: {
      status: plain.moderationStatus,
      score: plain.moderationScore == null ? null : Number(plain.moderationScore),
      summary: plain.moderationSummary ?? null,
      labels: plain.moderationLabels ?? null,
      reviewedAt: plain.moderatedAt ?? null,
    },
    verifiedClient: Boolean(plain.verifiedClient),
    verificationMetadata: plain.verificationMetadata ?? null,
    isFeatured: Boolean(plain.isFeatured),
    shareUrl: plain.shareUrl ?? null,
    media: plain.media ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

FreelancerReview.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    title: plain.title,
    reviewerName: plain.reviewerName ?? null,
    reviewerRole: plain.reviewerRole ?? null,
    reviewerCompany: plain.reviewerCompany ?? null,
    rating: plain.rating == null ? null : Number(plain.rating),
    status: plain.status,
    highlighted: Boolean(plain.highlighted),
    reviewSource: plain.reviewSource ?? null,
    body: plain.body,
    capturedAt: plain.capturedAt ?? null,
    publishedAt: plain.publishedAt ?? null,
    previewUrl: plain.previewUrl ?? null,
    heroImageUrl: plain.heroImageUrl ?? null,
    tags: Array.isArray(plain.tags) ? plain.tags : plain.tags ?? [],
    attachments: plain.attachments ?? null,
    responses: plain.responses ?? null,
    privateNotes: plain.privateNotes ?? null,
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
    moderation: {
      status: plain.moderationStatus,
      score: plain.moderationScore == null ? null : Number(plain.moderationScore),
      summary: plain.moderationSummary ?? null,
      labels: plain.moderationLabels ?? null,
      reviewedAt: plain.moderatedAt ?? null,
    },
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
    theme: plain.theme ?? null,
    themeTokens: plain.themeTokens ?? null,
    embedScript: plain.embedScript ?? null,
    config: plain.config ?? null,
    impressions: Number(plain.impressions ?? 0),
    ctaClicks: Number(plain.ctaClicks ?? 0),
    lastPublishedAt: plain.lastPublishedAt ?? null,
    lastRenderedAt: plain.lastRenderedAt ?? null,
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

export const FreelancerPortfolioItem = sequelize.define(
  'FreelancerPortfolioItem',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    profileId: { type: DataTypes.INTEGER, allowNull: true },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    tagline: { type: DataTypes.STRING(240), allowNull: true },
    clientName: { type: DataTypes.STRING(180), allowNull: true },
    clientIndustry: { type: DataTypes.STRING(180), allowNull: true },
    role: { type: DataTypes.STRING(180), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    problemStatement: { type: DataTypes.TEXT, allowNull: true },
    approachSummary: { type: DataTypes.TEXT, allowNull: true },
    outcomeSummary: { type: DataTypes.TEXT, allowNull: true },
    impactMetrics: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    industries: { type: jsonType, allowNull: true },
    services: { type: jsonType, allowNull: true },
    technologies: { type: jsonType, allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(1024), allowNull: true },
    heroVideoUrl: { type: DataTypes.STRING(1024), allowNull: true },
    callToActionLabel: { type: DataTypes.STRING(160), allowNull: true },
    callToActionUrl: { type: DataTypes.STRING(1024), allowNull: true },
    repositoryUrl: { type: DataTypes.STRING(1024), allowNull: true },
    liveUrl: { type: DataTypes.STRING(1024), allowNull: true },
    visibility: {
      type: DataTypes.ENUM('private', 'network', 'public'),
      allowNull: false,
      defaultValue: 'public',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    featuredOrder: { type: DataTypes.INTEGER, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
    lastSharedAt: { type: DataTypes.DATE, allowNull: true },
    lastReviewedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'freelancer_portfolio_items',
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['visibility'] },
      { fields: ['isFeatured'] },
    ],
  },
);

export const FreelancerPortfolioAsset = sequelize.define(
  'FreelancerPortfolioAsset',
  {
    portfolioItemId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    url: { type: DataTypes.STRING(1024), allowNull: false },
    thumbnailUrl: { type: DataTypes.STRING(1024), allowNull: true },
    assetType: {
      type: DataTypes.ENUM('image', 'video', 'document', 'link', 'embed'),
      allowNull: false,
      defaultValue: 'image',
    },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_portfolio_assets',
    indexes: [
      { fields: ['portfolioItemId'] },
      { fields: ['assetType'] },
    ],
  },
);

export const FreelancerPortfolioSetting = sequelize.define(
  'FreelancerPortfolioSetting',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    profileId: { type: DataTypes.INTEGER, allowNull: true },
    heroHeadline: { type: DataTypes.STRING(180), allowNull: true },
    heroSubheadline: { type: DataTypes.STRING(255), allowNull: true },
    coverImageUrl: { type: DataTypes.STRING(1024), allowNull: true },
    coverVideoUrl: { type: DataTypes.STRING(1024), allowNull: true },
    brandAccentColor: { type: DataTypes.STRING(32), allowNull: true },
    defaultVisibility: {
      type: DataTypes.ENUM('private', 'network', 'public'),
      allowNull: false,
      defaultValue: 'public',
    },
    allowPublicDownload: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoShareToFeed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    showMetrics: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    showTestimonials: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    showContactButton: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true },
    schedulingLink: { type: DataTypes.STRING(1024), allowNull: true },
    customDomain: { type: DataTypes.STRING(255), allowNull: true },
    previewBasePath: { type: DataTypes.STRING(255), allowNull: true },
    lastPublishedAt: { type: DataTypes.DATE, allowNull: true },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'freelancer_portfolio_settings',
    indexes: [{ fields: ['defaultVisibility'] }],
  },
);

FreelancerPortfolioAsset.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    portfolioItemId: plain.portfolioItemId,
    label: plain.label,
    description: plain.description ?? null,
    url: plain.url,
    thumbnailUrl: plain.thumbnailUrl ?? null,
    assetType: plain.assetType,
    sortOrder: plain.sortOrder ?? 0,
    isPrimary: Boolean(plain.isPrimary),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

FreelancerPortfolioItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const rawAssets = plain.assets ?? plain.FreelancerPortfolioAssets ?? [];
  const assets = Array.isArray(rawAssets)
    ? rawAssets
        .map((asset) => (typeof asset?.toPublicObject === 'function' ? asset.toPublicObject() : asset))
        .filter(Boolean)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];

  return {
    id: plain.id,
    userId: plain.userId,
    profileId: plain.profileId ?? null,
    slug: plain.slug,
    title: plain.title,
    tagline: plain.tagline ?? null,
    clientName: plain.clientName ?? null,
    clientIndustry: plain.clientIndustry ?? null,
    role: plain.role ?? null,
    summary: plain.summary ?? null,
    problemStatement: plain.problemStatement ?? null,
    approachSummary: plain.approachSummary ?? null,
    outcomeSummary: plain.outcomeSummary ?? null,
    impactMetrics: Array.isArray(plain.impactMetrics) ? plain.impactMetrics : [],
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    industries: Array.isArray(plain.industries) ? plain.industries : [],
    services: Array.isArray(plain.services) ? plain.services : [],
    technologies: Array.isArray(plain.technologies) ? plain.technologies : [],
    heroImageUrl: plain.heroImageUrl ?? null,
    heroVideoUrl: plain.heroVideoUrl ?? null,
    callToActionLabel: plain.callToActionLabel ?? null,
    callToActionUrl: plain.callToActionUrl ?? null,
    repositoryUrl: plain.repositoryUrl ?? null,
    liveUrl: plain.liveUrl ?? null,
    visibility: plain.visibility,
    status: plain.status,
    isFeatured: Boolean(plain.isFeatured),
    featuredOrder: plain.featuredOrder ?? null,
    startDate: plain.startDate ?? null,
    endDate: plain.endDate ?? null,
    publishedAt: plain.publishedAt ?? null,
    archivedAt: plain.archivedAt ?? null,
    lastSharedAt: plain.lastSharedAt ?? null,
    lastReviewedAt: plain.lastReviewedAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    assets,
  };
};

FreelancerPortfolioSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    userId: plain.userId,
    profileId: plain.profileId ?? null,
    heroHeadline: plain.heroHeadline ?? null,
    heroSubheadline: plain.heroSubheadline ?? null,
    coverImageUrl: plain.coverImageUrl ?? null,
    coverVideoUrl: plain.coverVideoUrl ?? null,
    brandAccentColor: plain.brandAccentColor ?? null,
    defaultVisibility: plain.defaultVisibility ?? 'public',
    allowPublicDownload: Boolean(plain.allowPublicDownload),
    autoShareToFeed: Boolean(plain.autoShareToFeed),
    showMetrics: Boolean(plain.showMetrics),
    showTestimonials: Boolean(plain.showTestimonials),
    showContactButton: Boolean(plain.showContactButton),
    contactEmail: plain.contactEmail ?? null,
    schedulingLink: plain.schedulingLink ?? null,
    customDomain: plain.customDomain ?? null,
    previewBasePath: plain.previewBasePath ?? null,
    lastPublishedAt: plain.lastPublishedAt ?? null,
    lastSyncedAt: plain.lastSyncedAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerCalendarEvent = sequelize.define(
  'FreelancerCalendarEvent',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    eventType: {
      type: DataTypes.ENUM(...FREELANCER_CALENDAR_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'project',
      validate: { isIn: [FREELANCER_CALENDAR_EVENT_TYPES] },
    },
    status: {
      type: DataTypes.ENUM(...FREELANCER_CALENDAR_EVENT_STATUSES),
      allowNull: false,
      defaultValue: 'confirmed',
      validate: { isIn: [FREELANCER_CALENDAR_EVENT_STATUSES] },
    },
    startsAt: { type: DataTypes.DATE, allowNull: false },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    isAllDay: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    location: { type: DataTypes.STRING(255), allowNull: true },
    meetingUrl: { type: DataTypes.STRING(500), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    relatedEntityType: {
      type: DataTypes.ENUM(...FREELANCER_CALENDAR_RELATED_TYPES),
      allowNull: true,
      validate: { isIn: [FREELANCER_CALENDAR_RELATED_TYPES] },
    },
    relatedEntityId: { type: DataTypes.STRING(120), allowNull: true },
    relatedEntityName: { type: DataTypes.STRING(255), allowNull: true },
    reminderMinutesBefore: { type: DataTypes.INTEGER, allowNull: true },
    source: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'manual' },
    color: { type: DataTypes.STRING(32), allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_calendar_events',
    indexes: [
      { fields: ['freelancerId'] },
      { fields: ['startsAt'] },
      { fields: ['eventType'] },
      { fields: ['status'] },
    ],
  },
);

FreelancerCalendarEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const startsAt = plain.startsAt ? new Date(plain.startsAt) : null;
  const endsAt = plain.endsAt ? new Date(plain.endsAt) : null;
  const createdAt = plain.createdAt ? new Date(plain.createdAt) : null;
  const updatedAt = plain.updatedAt ? new Date(plain.updatedAt) : null;

  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    title: plain.title,
    eventType: plain.eventType,
    status: plain.status,
    startsAt: startsAt ? startsAt.toISOString() : null,
    endsAt: endsAt ? endsAt.toISOString() : null,
    isAllDay: Boolean(plain.isAllDay),
    location: plain.location ?? null,
    meetingUrl: plain.meetingUrl ?? null,
    notes: plain.notes ?? null,
    relatedEntityType: plain.relatedEntityType ?? null,
    relatedEntityId: plain.relatedEntityId ?? null,
    relatedEntityName: plain.relatedEntityName ?? null,
    reminderMinutesBefore: plain.reminderMinutesBefore ?? null,
    source: plain.source ?? 'manual',
    color: plain.color ?? null,
    createdById: plain.createdById ?? null,
    updatedById: plain.updatedById ?? null,
    metadata: plain.metadata ?? null,
    createdAt: createdAt ? createdAt.toISOString() : null,
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
};

export const FeedPost = sequelize.define(
  'FeedPost',
  {
    userId: { type: DataTypes.INTEGER, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    visibility: { type: DataTypes.ENUM('public', 'connections'), defaultValue: 'public', allowNull: false },
    type: {
      type: DataTypes.ENUM('update', 'media', 'job', 'gig', 'project', 'volunteering', 'launchpad', 'news'),
      allowNull: false,
      defaultValue: 'update',
    },
    link: { type: DataTypes.STRING(2048), allowNull: true },
    title: { type: DataTypes.STRING(280), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    imageUrl: { type: DataTypes.STRING(2048), allowNull: true },
    source: { type: DataTypes.STRING(255), allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    externalId: { type: DataTypes.STRING(255), allowNull: true, unique: true },
    authorName: { type: DataTypes.STRING(180), allowNull: true },
    authorHeadline: { type: DataTypes.STRING(255), allowNull: true },
    authorAvatarSeed: { type: DataTypes.STRING(255), allowNull: true },
    mediaAttachments: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'feed_posts',
    indexes: [
      { fields: ['userId', 'createdAt'] },
      { fields: ['publishedAt'] },
      { fields: ['type'] },
    ],
  },
);

export const FeedComment = sequelize.define(
  'FeedComment',
  {
    postId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    parentId: { type: DataTypes.INTEGER, allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    authorName: { type: DataTypes.STRING(180), allowNull: true },
    authorHeadline: { type: DataTypes.STRING(255), allowNull: true },
    authorAvatarSeed: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'feed_comments',
    indexes: [
      { fields: ['postId', 'parentId'] },
      { fields: ['userId'] },
    ],
  },
);

export const FeedReaction = sequelize.define(
  'FeedReaction',
  {
    postId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    reactionType: {
      type: DataTypes.ENUM('like', 'celebrate', 'support', 'love', 'insightful'),
      allowNull: false,
      defaultValue: 'like',
    },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'feed_reactions',
    indexes: [
      { fields: ['postId', 'reactionType'] },
      { fields: ['userId'] },
    ],
  },
);

export const FreelancerTimelineWorkspace = sequelize.define(
  'FreelancerTimelineWorkspace',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    timezone: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'UTC' },
    defaultVisibility: {
      type: DataTypes.ENUM('public', 'connections', 'private'),
      allowNull: false,
      defaultValue: 'public',
    },
    autoShareToFeed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    reviewBeforePublish: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    distributionChannels: { type: jsonType, allowNull: true },
    contentThemes: { type: jsonType, allowNull: true },
    pinnedCampaigns: { type: jsonType, allowNull: true },
    cadenceGoal: { type: DataTypes.INTEGER, allowNull: true },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'freelancer_timeline_workspaces' },
);

export const ExplorerRecord = sequelize.define(
  'ExplorerRecord',
  {
    id: { type: DataTypes.STRING(120), allowNull: false, primaryKey: true },
    collection: { type: DataTypes.STRING(60), allowNull: false },
    category: { type: DataTypes.STRING(60), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    longDescription: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(80), allowNull: false },
    organization: { type: DataTypes.STRING(180), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    employmentType: { type: DataTypes.STRING(120), allowNull: true },
    duration: { type: DataTypes.STRING(120), allowNull: true },
    experienceLevel: { type: DataTypes.STRING(120), allowNull: true },
    availability: { type: DataTypes.STRING(120), allowNull: true },
    track: { type: DataTypes.STRING(120), allowNull: true },
    isRemote: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    skills: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    priceAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    priceCurrency: { type: DataTypes.STRING(12), allowNull: true },
    priceUnit: { type: DataTypes.STRING(60), allowNull: true },
    heroImage: { type: DataTypes.STRING(2048), allowNull: true },
    gallery: { type: jsonType, allowNull: true },
    videoUrl: { type: DataTypes.STRING(2048), allowNull: true },
    detailUrl: { type: DataTypes.STRING(2048), allowNull: true },
    applicationUrl: { type: DataTypes.STRING(2048), allowNull: true },
    rating: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    reviewCount: { type: DataTypes.INTEGER, allowNull: true },
    ownerName: { type: DataTypes.STRING(180), allowNull: true },
    ownerRole: { type: DataTypes.STRING(180), allowNull: true },
    ownerAvatar: { type: DataTypes.STRING(2048), allowNull: true },
    geoLat: { type: DataTypes.DECIMAL(10, 6), allowNull: true },
    geoLng: { type: DataTypes.DECIMAL(10, 6), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'explorer_records' },
);

ExplorerRecord.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const createdAt = plain.createdAt ? new Date(plain.createdAt) : null;
  const updatedAt = plain.updatedAt ? new Date(plain.updatedAt) : null;
  const priceAmount = plain.priceAmount == null ? null : Number(plain.priceAmount);
  const rating = plain.rating == null ? null : Number(plain.rating);
  const reviewCount = plain.reviewCount == null ? null : Number(plain.reviewCount);
  const geoLat = plain.geoLat == null ? null : Number(plain.geoLat);
  const geoLng = plain.geoLng == null ? null : Number(plain.geoLng);
  const price =
    priceAmount != null || plain.priceCurrency || plain.priceUnit
      ? {
          amount: priceAmount,
          currency: plain.priceCurrency ?? undefined,
          unit: plain.priceUnit ?? undefined,
        }
      : null;
  const owner =
    plain.ownerName || plain.ownerRole || plain.ownerAvatar
      ? {
          name: plain.ownerName ?? undefined,
          role: plain.ownerRole ?? undefined,
          avatar: plain.ownerAvatar ?? undefined,
        }
      : null;
  const geo = geoLat != null || geoLng != null ? { lat: geoLat ?? undefined, lng: geoLng ?? undefined } : null;

  return {
    id: plain.id,
    collection: plain.collection,
    category: plain.category,
    title: plain.title,
    summary: plain.summary,
    description: plain.description,
    longDescription: plain.longDescription ?? null,
    status: plain.status,
    organization: plain.organization ?? null,
    location: plain.location ?? null,
    employmentType: plain.employmentType ?? null,
    duration: plain.duration ?? null,
    experienceLevel: plain.experienceLevel ?? null,
    availability: plain.availability ?? null,
    track: plain.track ?? null,
    isRemote: Boolean(plain.isRemote),
    skills: Array.isArray(plain.skills) ? plain.skills : [],
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    price: price ?? null,
    heroImage: plain.heroImage ?? null,
    gallery: Array.isArray(plain.gallery) ? plain.gallery : [],
    videoUrl: plain.videoUrl ?? null,
    detailUrl: plain.detailUrl ?? null,
    applicationUrl: plain.applicationUrl ?? null,
    rating,
    reviewCount,
    owner,
    geo,
    metadata: plain.metadata ?? null,
    createdAt: createdAt ? createdAt.toISOString() : null,
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
};

export const ExplorerInteraction = sequelize.define(
  'ExplorerInteraction',
  {
    id: { type: DataTypes.STRING(120), allowNull: false, primaryKey: true },
    recordId: { type: DataTypes.STRING(120), allowNull: false },
    collection: { type: DataTypes.STRING(60), allowNull: false },
    category: { type: DataTypes.STRING(60), allowNull: false },
    type: { type: DataTypes.STRING(60), allowNull: false },
    name: { type: DataTypes.STRING(180), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(80), allowNull: true },
    company: { type: DataTypes.STRING(180), allowNull: true },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    budgetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetCurrency: { type: DataTypes.STRING(12), allowNull: true },
    availability: { type: DataTypes.STRING(120), allowNull: true },
    startDate: { type: DataTypes.STRING(120), allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    linkedin: { type: DataTypes.STRING(2048), allowNull: true },
    website: { type: DataTypes.STRING(2048), allowNull: true },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'new' },
    internalNotes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'explorer_interactions' },
);

ExplorerInteraction.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const createdAt = plain.createdAt ? new Date(plain.createdAt) : null;
  const updatedAt = plain.updatedAt ? new Date(plain.updatedAt) : null;
  const budgetAmount = plain.budgetAmount == null ? null : Number(plain.budgetAmount);

  return {
    id: plain.id,
    recordId: plain.recordId,
    collection: plain.collection,
    category: plain.category,
    type: plain.type,
    name: plain.name,
    email: plain.email,
    phone: plain.phone ?? null,
    company: plain.company ?? null,
    headline: plain.headline ?? null,
    message: plain.message,
    budgetAmount,
    budgetCurrency: plain.budgetCurrency ?? null,
    availability: plain.availability ?? null,
    startDate: plain.startDate ?? null,
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    linkedin: plain.linkedin ?? null,
    website: plain.website ?? null,
    status: plain.status,
    internalNotes: plain.internalNotes ?? null,
    metadata: plain.metadata ?? null,
    createdAt: createdAt ? createdAt.toISOString() : null,
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
};

ExplorerRecord.hasMany(ExplorerInteraction, { foreignKey: 'recordId', sourceKey: 'id', as: 'interactions' });
ExplorerInteraction.belongsTo(ExplorerRecord, { foreignKey: 'recordId', targetKey: 'id', as: 'record' });

export const FreelancerTimelinePost = sequelize.define(
  'FreelancerTimelinePost',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    visibility: {
      type: DataTypes.ENUM('public', 'connections', 'private'),
      allowNull: false,
      defaultValue: 'public',
    },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(2048), allowNull: true },
    allowComments: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    tags: { type: jsonType, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    targetAudience: { type: jsonType, allowNull: true },
    campaign: { type: DataTypes.STRING(180), allowNull: true },
    callToAction: { type: jsonType, allowNull: true },
    metricsSnapshot: { type: jsonType, allowNull: true },
    lastEditedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'freelancer_timeline_posts' },
);

export const FreelancerTimelineEntry = sequelize.define(
  'FreelancerTimelineEntry',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    entryType: {
      type: DataTypes.ENUM('milestone', 'content', 'event', 'campaign'),
      allowNull: false,
      defaultValue: 'milestone',
    },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'blocked'),
      allowNull: false,
      defaultValue: 'planned',
    },
    startAt: { type: DataTypes.DATE, allowNull: true },
    endAt: { type: DataTypes.DATE, allowNull: true },
    linkedPostId: { type: DataTypes.INTEGER, allowNull: true },
    owner: { type: DataTypes.STRING(180), allowNull: true },
    channel: { type: DataTypes.STRING(180), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'freelancer_timeline_entries' },
);

export const FreelancerTimelinePostMetric = sequelize.define(
  'FreelancerTimelinePostMetric',
  {
    postId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    capturedAt: { type: DataTypes.DATEONLY, allowNull: false },
    impressions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    clicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    comments: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reactions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    saves: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    shares: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    profileVisits: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    leads: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    conversionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'freelancer_timeline_post_metrics' },
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

export const JobAdvert = sequelize.define(
  'JobAdvert',
  {
    jobId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('draft', 'open', 'paused', 'closed', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    openings: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    remoteType: {
      type: DataTypes.ENUM('onsite', 'hybrid', 'remote'),
      allowNull: false,
      defaultValue: 'remote',
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    compensationMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    hiringManagerId: { type: DataTypes.INTEGER, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'job_adverts',
    indexes: [
      { unique: true, fields: ['jobId'] },
      { fields: ['workspaceId'] },
      { fields: ['status'] },
    ],
  },
);

export const JobFavorite = sequelize.define(
  'JobFavorite',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'job_favorites',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['jobId'] },
      { fields: ['userId'] },
      { unique: true, fields: ['workspaceId', 'jobId', 'userId'] },
    ],
  },
);

export const JobKeyword = sequelize.define(
  'JobKeyword',
  {
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    keyword: { type: DataTypes.STRING(120), allowNull: false },
    weight: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 1 },
  },
  {
    tableName: 'job_keywords',
    indexes: [
      { fields: ['jobId'] },
      { fields: ['keyword'] },
    ],
  },
);

export const JobAdvertHistory = sequelize.define(
  'JobAdvertHistory',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    changeType: { type: DataTypes.STRING(120), allowNull: false },
    summary: { type: DataTypes.STRING(255), allowNull: true },
    payload: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'job_advert_history',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['jobId'] },
      { fields: ['changeType'] },
    ],
  },
);

export const JobCandidateResponse = sequelize.define(
  'JobCandidateResponse',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    respondentId: { type: DataTypes.INTEGER, allowNull: true },
    respondentName: { type: DataTypes.STRING(255), allowNull: true },
    channel: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'message' },
    direction: { type: DataTypes.ENUM('inbound', 'outbound'), allowNull: false, defaultValue: 'inbound' },
    message: { type: DataTypes.TEXT, allowNull: false },
    sentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'job_candidate_responses',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['jobId'] },
      { fields: ['applicationId'] },
      { fields: ['sentAt'] },
    ],
  },
);

export const JobCandidateNote = sequelize.define(
  'JobCandidateNote',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    stage: { type: DataTypes.STRING(120), allowNull: true },
    sentiment: {
      type: DataTypes.ENUM('positive', 'neutral', 'concern'),
      allowNull: false,
      defaultValue: 'neutral',
    },
    summary: { type: DataTypes.STRING(255), allowNull: false },
    nextSteps: { type: DataTypes.TEXT, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'job_candidate_notes',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['jobId'] },
      { fields: ['applicationId'] },
      { fields: ['stage'] },
    ],
  },
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
    permissions: { type: jsonType, allowNull: true },
    watermarkSettings: { type: jsonType, allowNull: true },
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

export const JobPostAdminDetail = sequelize.define(
  'JobPostAdminDetail',
  {
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'draft' },
    visibility: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'public' },
    workflowStage: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'draft' },
    approvalStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'pending_review' },
    approvalNotes: { type: DataTypes.TEXT, allowNull: true },
    applicationUrl: { type: DataTypes.STRING(2048), allowNull: true },
    applicationEmail: { type: DataTypes.STRING(255), allowNull: true },
    applicationInstructions: { type: DataTypes.TEXT, allowNull: true },
    salaryMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    salaryMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: true },
    compensationType: { type: DataTypes.STRING(40), allowNull: true },
    workplaceType: { type: DataTypes.STRING(40), allowNull: true },
    contractType: { type: DataTypes.STRING(40), allowNull: true },
    experienceLevel: { type: DataTypes.STRING(40), allowNull: true },
    department: { type: DataTypes.STRING(120), allowNull: true },
    team: { type: DataTypes.STRING(120), allowNull: true },
    hiringManagerName: { type: DataTypes.STRING(120), allowNull: true },
    hiringManagerEmail: { type: DataTypes.STRING(255), allowNull: true },
    recruiterName: { type: DataTypes.STRING(120), allowNull: true },
    recruiterEmail: { type: DataTypes.STRING(255), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    benefits: { type: jsonType, allowNull: true },
    responsibilities: { type: jsonType, allowNull: true },
    requirements: { type: jsonType, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    promotionFlags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
    archiveReason: { type: DataTypes.STRING(255), allowNull: true },
    externalReference: { type: DataTypes.STRING(120), allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'job_post_admin_details' },
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
      type: DataTypes.ENUM(...GIG_ORDER_REVISION_WORKFLOW_STATUSES),
      allowNull: false,
      defaultValue: 'requested',
      validate: { isIn: [GIG_ORDER_REVISION_WORKFLOW_STATUSES] },
    },
    severity: {
      type: DataTypes.ENUM(...GIG_ORDER_REVISION_SEVERITIES),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [GIG_ORDER_REVISION_SEVERITIES] },
    },
    focusAreas: { type: jsonType, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
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
  };
};

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
  };
};

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
export const WORKSPACE_RISK_LEVELS = ['low', 'medium', 'high'];

export const PROJECT_MILESTONE_STATUSES = ['planned', 'in_progress', 'at_risk', 'blocked', 'completed'];
export const PROJECT_COLLABORATOR_STATUSES = ['invited', 'active', 'observer', 'removed'];
export const PROJECT_COLLABORATOR_ROLES = [
  'owner',
  'project_manager',
  'mentor',
  'freelancer',
  'client_sponsor',
  'stakeholder',
  'viewer',
];
export const PROJECT_INTEGRATION_PROVIDERS = ['github', 'notion', 'figma', 'google_drive', 'slack'];
export const PROJECT_INTEGRATION_STATUSES = ['connected', 'syncing', 'error', 'disconnected', 'pending'];
export const PROJECT_TEMPLATE_CATEGORIES = ['hackathon', 'bootcamp', 'consulting', 'product_launch', 'volunteering'];
export const PROJECT_RETROSPECTIVE_THEMES = ['wins', 'risks', 'actions', 'metrics'];

export const VENDOR_RISK_LEVELS = ['low', 'moderate', 'high', 'critical'];
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
    locationDetails: buildLocationDetails(plain.location, plain.geoLocation),
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
  };
};

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
  };
};

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
  };
};

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
    permissions: plain.permissions ?? null,
    watermarkSettings: plain.watermarkSettings ?? null,
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
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectOperationalSnapshot = sequelize.define(
  'ProjectOperationalSnapshot',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    reportingDate: { type: DataTypes.DATEONLY, allowNull: false },
    scopeHealth: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'on_track' },
    staffingStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'right_sized' },
    staffingRatio: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    profitabilityStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'healthy' },
    marginPercent: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    qualityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    qaStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'in_control' },
    automationCoverage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    riskLevel: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'low' },
    issuesOpen: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'project_operational_snapshots',
    indexes: [
      { fields: ['projectId', 'reportingDate'] },
      { fields: ['workspaceId', 'reportingDate'] },
    ],
  },
);

ProjectOperationalSnapshot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    projectId: plain.projectId,
    reportingDate: plain.reportingDate,
    scopeHealth: plain.scopeHealth,
    staffingStatus: plain.staffingStatus,
    staffingRatio: plain.staffingRatio == null ? null : Number(plain.staffingRatio),
    profitabilityStatus: plain.profitabilityStatus,
    marginPercent: plain.marginPercent == null ? null : Number(plain.marginPercent),
    qualityScore: plain.qualityScore == null ? null : Number(plain.qualityScore),
    qaStatus: plain.qaStatus,
    automationCoverage: plain.automationCoverage == null ? null : Number(plain.automationCoverage),
    riskLevel: plain.riskLevel,
    issuesOpen: Number(plain.issuesOpen ?? 0),
    notes: plain.notes,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectMilestone = sequelize.define(
  'ProjectMilestone',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...PROJECT_MILESTONE_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
      validate: { isIn: [PROJECT_MILESTONE_STATUSES] },
    },
    ordinal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    budgetAllocated: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetSpent: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    effortPlannedHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    effortLoggedMinutes: { type: DataTypes.INTEGER, allowNull: true },
    successCriteria: { type: jsonType, allowNull: true },
    deliverables: { type: jsonType, allowNull: true },
    impactMetrics: { type: jsonType, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'project_milestones' },
);

ProjectMilestone.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    ordinal: plain.ordinal,
    startDate: plain.startDate,
    dueDate: plain.dueDate,
    completedAt: plain.completedAt,
    budgetAllocated: plain.budgetAllocated == null ? null : Number(plain.budgetAllocated),
    budgetSpent: plain.budgetSpent == null ? null : Number(plain.budgetSpent),
    effortPlannedHours: plain.effortPlannedHours == null ? null : Number(plain.effortPlannedHours),
    effortLoggedMinutes: plain.effortLoggedMinutes == null ? null : Number(plain.effortLoggedMinutes),
    successCriteria: plain.successCriteria ?? null,
    deliverables: plain.deliverables ?? null,
    impactMetrics: plain.impactMetrics ?? null,
    ownerId: plain.ownerId,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectCollaborator = sequelize.define(
  'ProjectCollaborator',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    invitedById: { type: DataTypes.INTEGER, allowNull: true },
    email: { type: DataTypes.STRING(180), allowNull: true },
    name: { type: DataTypes.STRING(180), allowNull: true },
    role: {
      type: DataTypes.ENUM(...PROJECT_COLLABORATOR_ROLES),
      allowNull: false,
      defaultValue: 'viewer',
      validate: { isIn: [PROJECT_COLLABORATOR_ROLES] },
    },
    status: {
      type: DataTypes.ENUM(...PROJECT_COLLABORATOR_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
      validate: { isIn: [PROJECT_COLLABORATOR_STATUSES] },
    },
    permissions: { type: jsonType, allowNull: true },
    responsibility: { type: DataTypes.STRING(255), allowNull: true },
    invitedAt: { type: DataTypes.DATE, allowNull: true },
    joinedAt: { type: DataTypes.DATE, allowNull: true },
    lastEngagedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'project_collaborators' },
);

ProjectCollaborator.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    userId: plain.userId,
    invitedById: plain.invitedById,
    email: plain.email,
    name: plain.name,
    role: plain.role,
    status: plain.status,
    permissions: plain.permissions ?? null,
    responsibility: plain.responsibility,
    invitedAt: plain.invitedAt,
    joinedAt: plain.joinedAt,
    lastEngagedAt: plain.lastEngagedAt,
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectTemplate = sequelize.define(
  'ProjectTemplate',
  {
    name: { type: DataTypes.STRING(255), allowNull: false },
    category: {
      type: DataTypes.ENUM(...PROJECT_TEMPLATE_CATEGORIES),
      allowNull: false,
      defaultValue: 'consulting',
      validate: { isIn: [PROJECT_TEMPLATE_CATEGORIES] },
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    audience: { type: DataTypes.STRING(180), allowNull: true },
    durationWeeks: { type: DataTypes.INTEGER, allowNull: true },
    recommendedUseCases: { type: jsonType, allowNull: true },
    deliverables: { type: jsonType, allowNull: true },
    metricsFocus: { type: jsonType, allowNull: true },
    automationPlaybooks: { type: jsonType, allowNull: true },
    integrations: { type: jsonType, allowNull: true },
    budgetRange: { type: jsonType, allowNull: true },
    toolkit: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'project_templates' },
);

ProjectTemplate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    category: plain.category,
    description: plain.description,
    summary: plain.summary,
    audience: plain.audience,
    durationWeeks: plain.durationWeeks,
    recommendedUseCases: plain.recommendedUseCases ?? [],
    deliverables: plain.deliverables ?? [],
    metricsFocus: plain.metricsFocus ?? [],
    automationPlaybooks: plain.automationPlaybooks ?? [],
    integrations: plain.integrations ?? [],
    budgetRange: plain.budgetRange ?? null,
    toolkit: plain.toolkit ?? [],
    metadata: plain.metadata ?? null,
    isFeatured: Boolean(plain.isFeatured),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};
export const WORKSPACE_TIMELINE_ENTRY_TYPES = ['milestone', 'phase', 'task', 'checkpoint'];
export const WORKSPACE_MEETING_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
export const WORKSPACE_ROLE_STATUSES = ['active', 'pending', 'inactive', 'offboarded'];
export const WORKSPACE_SUBMISSION_STATUSES = ['draft', 'submitted', 'in_review', 'approved', 'returned'];
export const WORKSPACE_INVITE_STATUSES = ['pending', 'accepted', 'declined', 'expired'];
export const WORKSPACE_BUDGET_STATUSES = ['planned', 'approved', 'in_progress', 'completed', 'overbudget'];
export const WORKSPACE_HR_STATUSES = ['pending', 'active', 'on_leave', 'completed'];
export const WORKSPACE_OBJECT_TYPES = [
  'asset',
  'deliverable',
  'dependency',
  'risk',
  'note',
  'milestone',
];
export const WORKSPACE_OBJECT_STATUSES = ['draft', 'in_progress', 'blocked', 'completed', 'archived'];

export const ProjectIntegration = sequelize.define(
  'ProjectIntegration',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    provider: {
      type: DataTypes.ENUM(...PROJECT_INTEGRATION_PROVIDERS),
      allowNull: false,
      defaultValue: 'github',
      validate: { isIn: [PROJECT_INTEGRATION_PROVIDERS] },
    },
    status: {
      type: DataTypes.ENUM(...PROJECT_INTEGRATION_STATUSES),
      allowNull: false,
      defaultValue: 'connected',
      validate: { isIn: [PROJECT_INTEGRATION_STATUSES] },
    },
    externalId: { type: DataTypes.STRING(255), allowNull: true },
    connectedById: { type: DataTypes.INTEGER, allowNull: true },
    connectedAt: { type: DataTypes.DATE, allowNull: true },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    syncFrequencyMinutes: { type: DataTypes.INTEGER, allowNull: true },
    syncLagMinutes: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_integrations' },
);

ProjectIntegration.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    provider: plain.provider,
    status: plain.status,
    externalId: plain.externalId,
    connectedById: plain.connectedById,
    connectedAt: plain.connectedAt,
    lastSyncedAt: plain.lastSyncedAt,
    syncFrequencyMinutes: plain.syncFrequencyMinutes == null ? null : Number(plain.syncFrequencyMinutes),
    syncLagMinutes: plain.syncLagMinutes == null ? null : Number(plain.syncLagMinutes),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectRetrospective = sequelize.define(
  'ProjectRetrospective',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    milestoneId: { type: DataTypes.INTEGER, allowNull: true },
    authoredById: { type: DataTypes.INTEGER, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: false },
    highlights: { type: jsonType, allowNull: true },
    risks: { type: jsonType, allowNull: true },
    actions: { type: jsonType, allowNull: true },
    sentimentScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_retrospectives' },
);

ProjectRetrospective.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    milestoneId: plain.milestoneId,
    authoredById: plain.authoredById,
    summary: plain.summary,
    highlights: plain.highlights ?? [],
    risks: plain.risks ?? [],
    actions: plain.actions ?? [],
    sentimentScore: plain.sentimentScore == null ? null : Number(plain.sentimentScore),
    generatedAt: plain.generatedAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectDependencyLink = sequelize.define(
  'ProjectDependencyLink',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    dependentProjectId: { type: DataTypes.INTEGER, allowNull: true },
    dependencyType: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'internal' },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'in_progress' },
    riskLevel: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'medium' },
    leadTimeDays: { type: DataTypes.INTEGER, allowNull: true },
    isCritical: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'project_dependency_links',
    indexes: [{ fields: ['projectId', 'dependencyType'] }],
  },
);

ProjectDependencyLink.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    projectId: plain.projectId,
    dependentProjectId: plain.dependentProjectId,
    dependencyType: plain.dependencyType,
    status: plain.status,
    riskLevel: plain.riskLevel,
    leadTimeDays: plain.leadTimeDays == null ? null : Number(plain.leadTimeDays),
    isCritical: Boolean(plain.isCritical),
    notes: plain.notes,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WorkspaceOperatingBlueprint = sequelize.define(
  'WorkspaceOperatingBlueprint',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    blueprintName: { type: DataTypes.STRING(160), allowNull: false },
    blueprintSlug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    clientName: { type: DataTypes.STRING(160), allowNull: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'active' },
    sowUrl: { type: DataTypes.STRING(255), allowNull: true },
    deliveryCadence: { type: DataTypes.STRING(120), allowNull: true },
    cadenceCycleDays: { type: DataTypes.INTEGER, allowNull: true },
    automationGuardrails: { type: jsonType, allowNull: true },
    kickoffChecklist: { type: jsonType, allowNull: true },
    lastRunAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_operating_blueprints',
    indexes: [{ fields: ['workspaceId', 'status'] }],
  },
);

WorkspaceOperatingBlueprint.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    blueprintName: plain.blueprintName,
    blueprintSlug: plain.blueprintSlug,
    clientName: plain.clientName,
    status: plain.status,
    sowUrl: plain.sowUrl,
    deliveryCadence: plain.deliveryCadence,
    cadenceCycleDays: plain.cadenceCycleDays == null ? null : Number(plain.cadenceCycleDays),
    automationGuardrails: plain.automationGuardrails ?? null,
    kickoffChecklist: plain.kickoffChecklist ?? null,
    lastRunAt: plain.lastRunAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ResourceCapacitySnapshot = sequelize.define(
  'ResourceCapacitySnapshot',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    reportingDate: { type: DataTypes.DATEONLY, allowNull: false },
    skillGroup: { type: DataTypes.STRING(120), allowNull: false },
    availableHours: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    assignedHours: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    billableRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    utilizationRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    burnoutRisk: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'low' },
    benchHours: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    costRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'resource_capacity_snapshots',
    indexes: [{ fields: ['workspaceId', 'reportingDate'] }],
  },
);

ResourceCapacitySnapshot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    reportingDate: plain.reportingDate,
    skillGroup: plain.skillGroup,
    availableHours: plain.availableHours == null ? 0 : Number(plain.availableHours),
    assignedHours: plain.assignedHours == null ? 0 : Number(plain.assignedHours),
    billableRate: plain.billableRate == null ? null : Number(plain.billableRate),
    utilizationRate: plain.utilizationRate == null ? null : Number(plain.utilizationRate),
    burnoutRisk: plain.burnoutRisk,
    benchHours: plain.benchHours == null ? 0 : Number(plain.benchHours),
    costRate: plain.costRate == null ? null : Number(plain.costRate),
    notes: plain.notes,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ResourceScenarioPlan = sequelize.define(
  'ResourceScenarioPlan',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false },
    scenarioType: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'baseline' },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'draft' },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    projectedRevenue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    projectedCost: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    projectedMargin: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    staffingPlan: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'resource_scenario_plans',
    indexes: [{ fields: ['workspaceId', 'status'] }],
  },
);

ResourceScenarioPlan.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    scenarioType: plain.scenarioType,
    status: plain.status,
    startDate: plain.startDate,
    endDate: plain.endDate,
    projectedRevenue: plain.projectedRevenue == null ? null : Number(plain.projectedRevenue),
    projectedCost: plain.projectedCost == null ? null : Number(plain.projectedCost),
    projectedMargin: plain.projectedMargin == null ? null : Number(plain.projectedMargin),
    staffingPlan: plain.staffingPlan ?? null,
    notes: plain.notes,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const QualityReviewRun = sequelize.define(
  'QualityReviewRun',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    reviewerId: { type: DataTypes.INTEGER, allowNull: true },
    reviewType: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'pre_delivery' },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'scheduled' },
    qaScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    clientSatisfaction: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    automationCoverage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    reviewDate: { type: DataTypes.DATE, allowNull: true },
    lessonsLearned: { type: jsonType, allowNull: true },
    followUpActions: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'quality_review_runs',
    indexes: [
      { fields: ['projectId', 'reviewType'] },
      { fields: ['workspaceId', 'reviewDate'] },
    ],
  },
);

QualityReviewRun.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    projectId: plain.projectId,
    reviewerId: plain.reviewerId,
    reviewType: plain.reviewType,
    status: plain.status,
    qaScore: plain.qaScore == null ? null : Number(plain.qaScore),
    clientSatisfaction: plain.clientSatisfaction == null ? null : Number(plain.clientSatisfaction),
    automationCoverage: plain.automationCoverage == null ? null : Number(plain.automationCoverage),
    reviewDate: plain.reviewDate,
    lessonsLearned: plain.lessonsLearned ?? null,
    followUpActions: plain.followUpActions ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FinancialEngagementSummary = sequelize.define(
  'FinancialEngagementSummary',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    clientName: { type: DataTypes.STRING(160), allowNull: true },
    policyName: { type: DataTypes.STRING(160), allowNull: true },
    billingCurrency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    budgetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    actualSpend: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    invoicedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    outstandingAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    changeOrdersCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    profitabilityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    marginPercent: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    lastInvoiceDate: { type: DataTypes.DATE, allowNull: true },
    nextInvoiceDate: { type: DataTypes.DATE, allowNull: true },
    complianceStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'on_track' },
    lastComplianceExportAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'financial_engagement_summaries',
    indexes: [
      { fields: ['workspaceId', 'complianceStatus'] },
      { fields: ['projectId'] },
    ],
  },
);

FinancialEngagementSummary.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    projectId: plain.projectId,
    clientName: plain.clientName,
    policyName: plain.policyName,
    billingCurrency: plain.billingCurrency,
    budgetAmount: plain.budgetAmount == null ? null : Number(plain.budgetAmount),
    actualSpend: plain.actualSpend == null ? null : Number(plain.actualSpend),
    invoicedAmount: plain.invoicedAmount == null ? null : Number(plain.invoicedAmount),
    outstandingAmount: plain.outstandingAmount == null ? null : Number(plain.outstandingAmount),
    changeOrdersCount: Number(plain.changeOrdersCount ?? 0),
    profitabilityScore: plain.profitabilityScore == null ? null : Number(plain.profitabilityScore),
    marginPercent: plain.marginPercent == null ? null : Number(plain.marginPercent),
    lastInvoiceDate: plain.lastInvoiceDate,
    nextInvoiceDate: plain.nextInvoiceDate,
    complianceStatus: plain.complianceStatus,
    lastComplianceExportAt: plain.lastComplianceExportAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

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

export const ProjectWorkspaceTimeline = sequelize.define(
  'ProjectWorkspaceTimeline',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    timezone: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'UTC' },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    baselineStartDate: { type: DataTypes.DATE, allowNull: true },
    baselineEndDate: { type: DataTypes.DATE, allowNull: true },
    ownerName: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_timelines' },
);

ProjectWorkspaceTimeline.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    timezone: plain.timezone,
    startDate: plain.startDate,
    endDate: plain.endDate,
    baselineStartDate: plain.baselineStartDate,
    baselineEndDate: plain.baselineEndDate,
    ownerName: plain.ownerName,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceTask = sequelize.define(
  'ProjectWorkspaceTask',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ownerName: { type: DataTypes.STRING(255), allowNull: true },
    ownerType: { type: DataTypes.STRING(60), allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'planned' },
    lane: { type: DataTypes.STRING(120), allowNull: true },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    workloadHours: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    color: { type: DataTypes.STRING(16), allowNull: true },
    priority: { type: DataTypes.STRING(40), allowNull: true },
    dependencies: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_tasks' },
);

ProjectWorkspaceTask.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    description: plain.description,
    ownerName: plain.ownerName,
    ownerType: plain.ownerType,
    startDate: plain.startDate,
    endDate: plain.endDate,
    status: plain.status,
    lane: plain.lane,
    progressPercent: plain.progressPercent == null ? null : Number(plain.progressPercent),
    workloadHours: plain.workloadHours == null ? null : Number(plain.workloadHours),
    color: plain.color,
    priority: plain.priority,
    dependencies: Array.isArray(plain.dependencies) ? plain.dependencies : [],
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceTaskAssignment = sequelize.define(
  'ProjectWorkspaceTaskAssignment',
  {
    taskId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    assigneeName: { type: DataTypes.STRING(255), allowNull: false },
    assigneeRole: { type: DataTypes.STRING(120), allowNull: true },
    allocationPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    hoursCommitted: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'active' },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'project_workspace_task_assignments' },
);

ProjectWorkspaceTaskAssignment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    taskId: plain.taskId,
    workspaceId: plain.workspaceId,
    assigneeName: plain.assigneeName,
    assigneeRole: plain.assigneeRole,
    allocationPercent: plain.allocationPercent == null ? null : Number(plain.allocationPercent),
    hoursCommitted: plain.hoursCommitted == null ? null : Number(plain.hoursCommitted),
    status: plain.status,
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceBudgetLine = sequelize.define(
  'ProjectWorkspaceBudgetLine',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    plannedAmountCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    actualAmountCents: { type: DataTypes.INTEGER, allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'planned' },
    ownerName: { type: DataTypes.STRING(255), allowNull: true },
    approvalsRequired: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'project_workspace_budget_lines' },
);

ProjectWorkspaceBudgetLine.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    category: plain.category,
    description: plain.description,
    plannedAmountCents: plain.plannedAmountCents == null ? null : Number(plain.plannedAmountCents),
    actualAmountCents: plain.actualAmountCents == null ? null : Number(plain.actualAmountCents),
    currency: plain.currency,
    status: plain.status,
    ownerName: plain.ownerName,
    approvalsRequired: plain.approvalsRequired == null ? null : Number(plain.approvalsRequired),
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceTimelineEvent = sequelize.define(
  'ProjectWorkspaceTimelineEvent',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    eventDate: { type: DataTypes.DATE, allowNull: false },
    eventType: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'milestone' },
    ownerName: { type: DataTypes.STRING(255), allowNull: true },
    milestone: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    color: { type: DataTypes.STRING(16), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_timeline_events' },
);

ProjectWorkspaceTimelineEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    description: plain.description,
    eventDate: plain.eventDate,
    eventType: plain.eventType,
    ownerName: plain.ownerName,
    milestone: Boolean(plain.milestone),
    color: plain.color,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceCalendarEntry = sequelize.define(
  'ProjectWorkspaceCalendarEntry',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: true },
    eventType: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'milestone' },
    ownerName: { type: DataTypes.STRING(255), allowNull: true },
    visibility: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'workspace' },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_calendar_entries' },
);

ProjectWorkspaceCalendarEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    startAt: plain.startAt,
    endAt: plain.endAt,
    eventType: plain.eventType,
    ownerName: plain.ownerName,
    visibility: plain.visibility,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceMessage = sequelize.define(
  'ProjectWorkspaceMessage',
  {
    conversationId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    authorName: { type: DataTypes.STRING(255), allowNull: false },
    authorRole: { type: DataTypes.STRING(120), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    postedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    attachments: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_messages' },
);

ProjectWorkspaceMessage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    conversationId: plain.conversationId,
    workspaceId: plain.workspaceId,
    authorName: plain.authorName,
    authorRole: plain.authorRole ?? null,
    body: plain.body,
    postedAt: plain.postedAt,
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceBudget = sequelize.define(
  'ProjectWorkspaceBudget',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: false },
    allocatedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    actualAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_BUDGET_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [WORKSPACE_BUDGET_STATUSES] },
    },
    ownerName: { type: DataTypes.STRING(180), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'project_workspace_budgets' },
);

ProjectWorkspaceBudget.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    category: plain.category,
    allocatedAmount: plain.allocatedAmount == null ? 0 : Number(plain.allocatedAmount),
    actualAmount: plain.actualAmount == null ? 0 : Number(plain.actualAmount),
    currency: plain.currency ?? 'USD',
    status: plain.status,
    ownerName: plain.ownerName ?? null,
    notes: plain.notes ?? null,
    updatedById: plain.updatedById ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceObject = sequelize.define(
  'ProjectWorkspaceObject',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(180), allowNull: false },
    type: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'artifact' },
    objectType: {
      type: DataTypes.ENUM(...WORKSPACE_OBJECT_TYPES),
      allowNull: false,
      defaultValue: 'deliverable',
      validate: { isIn: [WORKSPACE_OBJECT_TYPES] },
    },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_OBJECT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [WORKSPACE_OBJECT_STATUSES] },
    },
    ownerName: { type: DataTypes.STRING(180), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    unit: { type: DataTypes.STRING(60), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_objects' },
);

ProjectWorkspaceObject.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    label: plain.label ?? plain.name ?? null,
    objectType: plain.objectType ?? plain.type ?? 'deliverable',
    type: plain.type ?? plain.objectType ?? 'artifact',
    status: plain.status ?? null,
    ownerName: plain.ownerName ?? null,
    description: plain.description ?? plain.summary ?? null,
    summary: plain.summary ?? plain.description ?? null,
    quantity: plain.quantity == null ? null : Number(plain.quantity),
    unit: plain.unit ?? null,
    dueAt: plain.dueAt ?? null,
    metadata: plain.metadata ?? null,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceTimelineEntry = sequelize.define(
  'ProjectWorkspaceTimelineEntry',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    entryType: {
      type: DataTypes.ENUM(...WORKSPACE_TIMELINE_ENTRY_TYPES),
      allowNull: false,
      defaultValue: 'milestone',
      validate: { isIn: [WORKSPACE_TIMELINE_ENTRY_TYPES] },
    },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM(...PROJECT_MILESTONE_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
      validate: { isIn: [PROJECT_MILESTONE_STATUSES] },
    },
    ownerName: { type: DataTypes.STRING(180), allowNull: true },
    relatedObjectId: { type: DataTypes.INTEGER, allowNull: true },
    lane: { type: DataTypes.STRING(80), allowNull: true },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_timeline_entries' },
);

ProjectWorkspaceTimelineEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    entryType: plain.entryType,
    startAt: plain.startAt,
    endAt: plain.endAt,
    status: plain.status,
    ownerName: plain.ownerName ?? null,
    relatedObjectId: plain.relatedObjectId ?? null,
    lane: plain.lane ?? null,
    progressPercent: plain.progressPercent == null ? null : Number(plain.progressPercent),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceMeeting = sequelize.define(
  'ProjectWorkspaceMeeting',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    agenda: { type: DataTypes.TEXT, allowNull: true },
    meetingType: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'sync' },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    meetingUrl: { type: DataTypes.STRING(500), allowNull: true },
    hostName: { type: DataTypes.STRING(180), allowNull: true },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_MEETING_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [WORKSPACE_MEETING_STATUSES] },
    },
    attendees: { type: jsonType, allowNull: true },
    actionItems: { type: jsonType, allowNull: true },
    resources: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    recordingUrl: { type: DataTypes.STRING(500), allowNull: true },
  },
  { tableName: 'project_workspace_meetings' },
);

ProjectWorkspaceMeeting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    agenda: plain.agenda ?? null,
    meetingType: plain.meetingType ?? 'sync',
    startAt: plain.startAt,
    endAt: plain.endAt,
    location: plain.location ?? null,
    meetingUrl: plain.meetingUrl ?? null,
    hostName: plain.hostName ?? null,
    status: plain.status,
    attendees: Array.isArray(plain.attendees) ? plain.attendees : [],
    actionItems: Array.isArray(plain.actionItems) ? plain.actionItems : [],
    resources: Array.isArray(plain.resources) ? plain.resources : [],
    notes: plain.notes ?? null,
    recordingUrl: plain.recordingUrl ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceRole = sequelize.define(
  'ProjectWorkspaceRole',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberName: { type: DataTypes.STRING(180), allowNull: false },
    roleName: { type: DataTypes.STRING(180), allowNull: false, defaultValue: 'Member' },
    role: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_ROLE_STATUSES),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [WORKSPACE_ROLE_STATUSES] },
    },
    responsibilities: { type: DataTypes.TEXT, allowNull: true },
    permissions: { type: jsonType, allowNull: true },
    capacityHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    contactPhone: { type: DataTypes.STRING(60), allowNull: true },
    avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'project_workspace_roles' },
);

ProjectWorkspaceRole.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    memberName: plain.memberName,
    roleName: plain.roleName ?? plain.role ?? null,
    role: plain.role ?? plain.roleName ?? null,
    status: plain.status,
    responsibilities: plain.responsibilities ?? null,
    permissions: Array.isArray(plain.permissions) ? plain.permissions : [],
    capacityHours: plain.capacityHours == null ? null : Number(plain.capacityHours),
    contactEmail: plain.contactEmail ?? plain.email ?? null,
    contactPhone: plain.contactPhone ?? null,
    avatarUrl: plain.avatarUrl ?? null,
    email: plain.email ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceSubmission = sequelize.define(
  'ProjectWorkspaceSubmission',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    submissionType: { type: DataTypes.STRING(80), allowNull: true },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_SUBMISSION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [WORKSPACE_SUBMISSION_STATUSES] },
    },
    submittedBy: { type: DataTypes.STRING(180), allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedBy: { type: DataTypes.STRING(180), allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    attachmentUrl: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_submissions' },
);

ProjectWorkspaceSubmission.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    submissionType: plain.submissionType ?? null,
    status: plain.status,
    submittedBy: plain.submittedBy ?? null,
    submittedAt: plain.submittedAt,
    reviewedBy: plain.reviewedBy ?? null,
    reviewedAt: plain.reviewedAt,
    notes: plain.notes ?? null,
    attachmentUrl: plain.attachmentUrl ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceInvite = sequelize.define(
  'ProjectWorkspaceInvite',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_INVITE_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [WORKSPACE_INVITE_STATUSES] },
    },
    invitedByName: { type: DataTypes.STRING(180), allowNull: true },
    inviteToken: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_invites' },
);

ProjectWorkspaceInvite.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    email: plain.email,
    role: plain.role,
    status: plain.status,
    invitedByName: plain.invitedByName ?? null,
    inviteToken: plain.inviteToken,
    expiresAt: plain.expiresAt,
    message: plain.message ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceHrRecord = sequelize.define(
  'ProjectWorkspaceHrRecord',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberName: { type: DataTypes.STRING(180), allowNull: false },
    assignmentRole: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_HR_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [WORKSPACE_HR_STATUSES] },
    },
    capacityHours: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
    allocatedHours: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
    costRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    endedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_hr_records' },
);

ProjectWorkspaceHrRecord.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    memberName: plain.memberName,
    assignmentRole: plain.assignmentRole ?? null,
    status: plain.status,
    capacityHours: plain.capacityHours == null ? null : Number(plain.capacityHours),
    allocatedHours: plain.allocatedHours == null ? null : Number(plain.allocatedHours),
    costRate: plain.costRate == null ? null : Number(plain.costRate),
    currency: plain.currency ?? 'USD',
    startedAt: plain.startedAt,
    endedAt: plain.endedAt,
    notes: plain.notes ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceTimeLog = sequelize.define(
  'ProjectWorkspaceTimeLog',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    taskId: { type: DataTypes.INTEGER, allowNull: true },
    memberName: { type: DataTypes.STRING(180), allowNull: false },
    startedAt: { type: DataTypes.DATE, allowNull: false },
    endedAt: { type: DataTypes.DATE, allowNull: true },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    billable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    rateCents: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_time_logs' },
);

ProjectWorkspaceTimeLog.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    taskId: plain.taskId ?? null,
    memberName: plain.memberName,
    startedAt: plain.startedAt,
    endedAt: plain.endedAt,
    durationMinutes: plain.durationMinutes == null ? null : Number(plain.durationMinutes),
    billable: Boolean(plain.billable),
    rateCents: plain.rateCents == null ? null : Number(plain.rateCents),
    notes: plain.notes ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceTarget = sequelize.define(
  'ProjectWorkspaceTarget',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    targetValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currentValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    unit: { type: DataTypes.STRING(40), allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'on_track' },
    ownerName: { type: DataTypes.STRING(180), allowNull: true },
    trend: { type: DataTypes.STRING(60), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_targets' },
);

ProjectWorkspaceTarget.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    description: plain.description ?? null,
    targetValue: plain.targetValue == null ? null : Number(plain.targetValue),
    currentValue: plain.currentValue == null ? null : Number(plain.currentValue),
    unit: plain.unit ?? null,
    dueAt: plain.dueAt,
    status: plain.status,
    ownerName: plain.ownerName ?? null,
    trend: plain.trend ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectWorkspaceObjective = sequelize.define(
  'ProjectWorkspaceObjective',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'in_progress' },
    ownerName: { type: DataTypes.STRING(180), allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    keyResults: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'project_workspace_objectives' },
);

ProjectWorkspaceObjective.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    description: plain.description ?? null,
    status: plain.status,
    ownerName: plain.ownerName ?? null,
    dueAt: plain.dueAt,
    progressPercent: plain.progressPercent == null ? null : Number(plain.progressPercent),
    keyResults: Array.isArray(plain.keyResults) ? plain.keyResults : [],
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

export const GIG_MARKETPLACE_STATUSES = ['draft', 'preview', 'published', 'archived'];
export const GIG_VISIBILITY_OPTIONS = ['private', 'public', 'unlisted'];

function normaliseGigList(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry == null) {
          return null;
        }
        if (typeof entry === 'string') {
          const trimmed = entry.trim();
          return trimmed.length ? trimmed : null;
        }
        if (typeof entry === 'object') {
          const textCandidate =
            entry.description ??
            entry.text ??
            entry.body ??
            entry.label ??
            entry.title ??
            entry.value ??
            null;
          if (typeof textCandidate === 'string') {
            const trimmed = textCandidate.trim();
            return trimmed.length ? trimmed : null;
          }
        }
        return null;
      })
      .filter(Boolean);
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value.items)) {
      return normaliseGigList(value.items);
    }
    if (Array.isArray(value.value)) {
      return normaliseGigList(value.value);
    }
    return normaliseGigList(Object.values(value));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? [trimmed] : [];
  }
  if (value == null) {
    return [];
  }
  return [value].filter((entry) => typeof entry === 'string' && entry.trim().length);
}

function parseGigBudgetAmount(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number.parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function inferGigBudgetCurrency(budget, fallback) {
  if (fallback) {
    return fallback;
  }
  if (typeof budget !== 'string') {
    return null;
  }
  if (/\$/u.test(budget)) {
    return 'USD';
  }
  if (/€/u.test(budget)) {
    return 'EUR';
  }
  if (/£/u.test(budget)) {
    return 'GBP';
  }
  return null;
}

function resolveGigDurationCategory(duration, storedCategory) {
  if (storedCategory) {
    return storedCategory;
  }
  if (!duration || typeof duration !== 'string') {
    return null;
  }
  const text = duration.toLowerCase();
  if (/week|sprint/.test(text)) {
    return 'short_term';
  }
  if (/month|quarter/.test(text)) {
    return 'medium_term';
  }
  if (/year|long/.test(text)) {
    return 'long_term';
  }
  return null;
}

export const Gig = sequelize.define(
  'Gig',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    slug: { type: DataTypes.STRING(200), allowNull: true, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: true },
    niche: { type: DataTypes.STRING(180), allowNull: true },
    deliveryModel: { type: DataTypes.STRING(160), allowNull: true },
    outcomePromise: { type: DataTypes.TEXT, allowNull: true },
    budget: { type: DataTypes.STRING(120), allowNull: true },
    budgetCurrency: { type: DataTypes.STRING(6), allowNull: true },
    budgetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    duration: { type: DataTypes.STRING(120), allowNull: true },
    durationCategory: { type: DataTypes.STRING(60), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    heroAccent: { type: DataTypes.STRING(20), allowNull: true },
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
    metadata: { type: jsonType, allowNull: true },
    aiSignals: { type: jsonType, allowNull: true },
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
  },
  { tableName: 'gigs' },
);

Gig.prototype.toBuilderObject = function toBuilderObject() {
  const plain = this.get({ plain: true });
  const conversionCopy =
    plain.conversionCopy && typeof plain.conversionCopy === 'object' ? plain.conversionCopy : {};
  const analyticsSettings =
    plain.analyticsSettings && typeof plain.analyticsSettings === 'object' ? plain.analyticsSettings : {};

  return {
    id: plain.id,
    ownerId: plain.ownerId ?? null,
    slug: plain.slug ?? null,
    title: plain.title,
    tagline: plain.tagline ?? null,
    summary: plain.summary ?? null,
    description: plain.description,
    category: plain.category ?? null,
    niche: plain.niche ?? null,
    deliveryModel: plain.deliveryModel ?? null,
    outcomePromise: plain.outcomePromise ?? null,
    status: plain.status,
    visibility: plain.visibility,
    budget: plain.budget ?? null,
    budgetCurrency: inferGigBudgetCurrency(plain.budget, plain.budgetCurrency ?? null),
    budgetAmount:
      plain.budgetAmount != null && Number.isFinite(Number(plain.budgetAmount))
        ? Number(plain.budgetAmount)
        : parseGigBudgetAmount(plain.budget),
    duration: plain.duration ?? null,
    durationCategory: resolveGigDurationCategory(plain.duration, plain.durationCategory),
    location: plain.location ?? null,
    geoLocation: plain.geoLocation ?? null,
    targetMetric: plain.targetMetric == null ? null : Number(plain.targetMetric),
    sellingPoints: normaliseGigList(plain.sellingPoints),
    requirements: normaliseGigList(plain.requirements),
    faqs: normaliseGigList(plain.faqs),
    conversionCopy,
    analyticsSettings,
    hero: {
      title: plain.heroTitle ?? plain.title,
      subtitle: plain.heroSubtitle ?? null,
      mediaUrl: plain.heroMediaUrl ?? null,
      theme: plain.heroTheme ?? plain.heroAccent ?? null,
      badge: plain.heroBadge ?? null,
      accent: plain.heroAccent ?? null,
    },
    metadata: plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : {},
    availabilityTimezone: plain.availabilityTimezone ?? null,
    availabilityLeadTimeDays:
      plain.availabilityLeadTimeDays == null ? null : Number(plain.availabilityLeadTimeDays),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

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
  const conversionCopy =
    plain.conversionCopy && typeof plain.conversionCopy === 'object' ? plain.conversionCopy : {};
  const analyticsSettings =
    plain.analyticsSettings && typeof plain.analyticsSettings === 'object' ? plain.analyticsSettings : {};
  const metadata = plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : {};
  const aiSignals =
    plain.aiSignals && typeof plain.aiSignals === 'object' ? { ...plain.aiSignals } : null;
  const budgetCurrency = inferGigBudgetCurrency(plain.budget, plain.budgetCurrency ?? null);
  const budgetAmount =
    plain.budgetAmount != null && Number.isFinite(Number(plain.budgetAmount))
      ? Number(plain.budgetAmount)
      : parseGigBudgetAmount(plain.budget);
  const durationCategory = resolveGigDurationCategory(plain.duration, plain.durationCategory);
  const sellingPoints = normaliseGigList(plain.sellingPoints);
  const requirements = normaliseGigList(plain.requirements);
  const faqs = normaliseGigList(plain.faqs);

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
    summary: plain.summary ?? null,
    description: plain.description,
    category: plain.category,
    niche: plain.niche,
    deliveryModel: plain.deliveryModel,
    outcomePromise: plain.outcomePromise,
    budget: plain.budget,
    budgetCurrency,
    budgetAmount,
    duration: plain.duration,
    durationCategory,
    location: plain.location,
    geoLocation: plain.geoLocation,
    heroAccent: plain.heroAccent,
    hero: {
      title: plain.heroTitle ?? plain.title,
      subtitle: plain.heroSubtitle ?? null,
      mediaUrl: plain.heroMediaUrl ?? null,
      theme: plain.heroTheme ?? plain.heroAccent ?? null,
      badge: plain.heroBadge ?? null,
      accent: plain.heroAccent ?? null,
    },
    heroTitle: plain.heroTitle ?? null,
    heroSubtitle: plain.heroSubtitle ?? null,
    heroMediaUrl: plain.heroMediaUrl ?? null,
    heroTheme: plain.heroTheme ?? null,
    heroBadge: plain.heroBadge ?? null,
    sellingPoints,
    requirements,
    faqs,
    conversionCopy,
    analyticsSettings,
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
    metadata,
    aiSignals,
  };
};

Gig.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return Gig.findAll({
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

GigPackage.prototype.toBuilderObject = function toBuilderObject() {
  const plain = this.get({ plain: true });
  const highlights = Array.isArray(plain.highlights)
    ? plain.highlights
    : plain.highlights && typeof plain.highlights === 'object'
    ? Object.values(plain.highlights)
    : [];
  return {
    id: plain.id,
    gigId: plain.gigId,
    key: plain.packageKey,
    name: plain.name,
    description: plain.description,
    priceAmount: plain.priceAmount == null ? null : Number(plain.priceAmount),
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

export const NetworkingSession = sequelize.define(
  'NetworkingSession',
  {
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...NETWORKING_SESSION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [NETWORKING_SESSION_STATUSES] },
    },
    visibility: {
      type: DataTypes.ENUM(...NETWORKING_SESSION_VISIBILITIES),
      allowNull: false,
      defaultValue: 'workspace',
      validate: { isIn: [NETWORKING_SESSION_VISIBILITIES] },
    },
    format: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'speed_networking' },
    accessType: {
      type: DataTypes.ENUM(...NETWORKING_SESSION_ACCESS_TYPES),
      allowNull: false,
      defaultValue: 'free',
      validate: { isIn: [NETWORKING_SESSION_ACCESS_TYPES] },
    },
    priceCents: { type: DataTypes.INTEGER, allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: true },
    startTime: { type: DataTypes.DATE, allowNull: true },
    endTime: { type: DataTypes.DATE, allowNull: true },
    sessionLengthMinutes: { type: DataTypes.INTEGER, allowNull: true },
    rotationDurationSeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 120 },
    joinLimit: { type: DataTypes.INTEGER, allowNull: true },
    waitlistLimit: { type: DataTypes.INTEGER, allowNull: true },
    registrationOpensAt: { type: DataTypes.DATE, allowNull: true },
    registrationClosesAt: { type: DataTypes.DATE, allowNull: true },
    requiresApproval: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    lobbyInstructions: { type: DataTypes.TEXT, allowNull: true },
    followUpActions: { type: jsonType, allowNull: true },
    hostControls: { type: jsonType, allowNull: true },
    attendeeTools: { type: jsonType, allowNull: true },
    penaltyRules: { type: jsonType, allowNull: true },
    monetization: { type: jsonType, allowNull: true },
    videoConfig: { type: jsonType, allowNull: true },
    videoTelemetry: { type: jsonType, allowNull: true },
    showcaseConfig: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'networking_sessions' },
);

NetworkingSession.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    companyId: plain.companyId,
    createdById: plain.createdById,
    updatedById: plain.updatedById,
    title: plain.title,
    slug: plain.slug,
    description: plain.description,
    status: plain.status,
    visibility: plain.visibility,
    format: plain.format,
    accessType: plain.accessType,
    priceCents: plain.priceCents == null ? null : Number(plain.priceCents),
    currency: plain.currency,
    startTime: plain.startTime,
    endTime: plain.endTime,
    sessionLengthMinutes: plain.sessionLengthMinutes,
    rotationDurationSeconds: plain.rotationDurationSeconds,
    joinLimit: plain.joinLimit,
    waitlistLimit: plain.waitlistLimit,
    registrationOpensAt: plain.registrationOpensAt,
    registrationClosesAt: plain.registrationClosesAt,
    requiresApproval: plain.requiresApproval,
    lobbyInstructions: plain.lobbyInstructions,
    followUpActions: plain.followUpActions ?? {},
    hostControls: plain.hostControls ?? {},
    attendeeTools: plain.attendeeTools ?? {},
    penaltyRules: plain.penaltyRules ?? {},
    monetization: plain.monetization ?? {},
    videoConfig: plain.videoConfig ?? {},
    videoTelemetry: plain.videoTelemetry ?? {},
    showcaseConfig: plain.showcaseConfig ?? {},
    metadata: plain.metadata ?? {},
    publishedAt: plain.publishedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const NetworkingSessionRotation = sequelize.define(
  'NetworkingSessionRotation',
  {
    sessionId: { type: DataTypes.INTEGER, allowNull: false },
    rotationNumber: { type: DataTypes.INTEGER, allowNull: false },
    startTime: { type: DataTypes.DATE, allowNull: true },
    endTime: { type: DataTypes.DATE, allowNull: true },
    durationSeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 120 },
    status: {
      type: DataTypes.ENUM(...NETWORKING_ROTATION_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [NETWORKING_ROTATION_STATUSES] },
    },
    pairingSeed: { type: DataTypes.STRING(64), allowNull: true },
    seatingPlan: { type: jsonType, allowNull: true },
    hostNotes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'networking_session_rotations' },
);

NetworkingSessionRotation.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    sessionId: plain.sessionId,
    rotationNumber: plain.rotationNumber,
    startTime: plain.startTime,
    endTime: plain.endTime,
    durationSeconds: plain.durationSeconds,
    status: plain.status,
    pairingSeed: plain.pairingSeed,
    seatingPlan: plain.seatingPlan ?? {},
    hostNotes: plain.hostNotes,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const NetworkingSessionSignup = sequelize.define(
  'NetworkingSessionSignup',
  {
    sessionId: { type: DataTypes.INTEGER, allowNull: false },
    participantId: { type: DataTypes.INTEGER, allowNull: true },
    participantEmail: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
    participantName: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...NETWORKING_SESSION_SIGNUP_STATUSES),
      allowNull: false,
      defaultValue: 'registered',
      validate: { isIn: [NETWORKING_SESSION_SIGNUP_STATUSES] },
    },
    source: {
      type: DataTypes.ENUM(...NETWORKING_SESSION_SIGNUP_SOURCES),
      allowNull: false,
      defaultValue: 'self',
      validate: { isIn: [NETWORKING_SESSION_SIGNUP_SOURCES] },
    },
    seatNumber: { type: DataTypes.INTEGER, allowNull: true },
    joinUrl: { type: DataTypes.STRING(500), allowNull: true },
    videoSessionId: { type: DataTypes.STRING(255), allowNull: true },
    checkedInAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    noShowCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    penaltyCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastPenaltyAt: { type: DataTypes.DATE, allowNull: true },
    profileSharedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    connectionsSaved: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    messagesSent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    followUpsScheduled: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    satisfactionScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    feedbackNotes: { type: DataTypes.TEXT, allowNull: true },
    businessCardId: { type: DataTypes.INTEGER, allowNull: true },
    businessCardSnapshot: { type: jsonType, allowNull: true },
    profileSnapshot: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    purchaseCents: { type: DataTypes.INTEGER, allowNull: true },
    purchaseCurrency: { type: DataTypes.STRING(3), allowNull: true },
    paymentStatus: {
      type: DataTypes.ENUM(...NETWORKING_SIGNUP_PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'unpaid',
      validate: { isIn: [NETWORKING_SIGNUP_PAYMENT_STATUSES] },
    },
    bookedAt: { type: DataTypes.DATE, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'networking_session_signups' },
);

NetworkingSessionSignup.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    sessionId: plain.sessionId,
    participantId: plain.participantId,
    participantEmail: plain.participantEmail,
    participantName: plain.participantName,
    status: plain.status,
    source: plain.source,
    seatNumber: plain.seatNumber,
    joinUrl: plain.joinUrl,
    videoSessionId: plain.videoSessionId,
    checkedInAt: plain.checkedInAt,
    completedAt: plain.completedAt,
    noShowCount: plain.noShowCount,
    penaltyCount: plain.penaltyCount,
    lastPenaltyAt: plain.lastPenaltyAt,
    profileSharedCount: plain.profileSharedCount,
    connectionsSaved: plain.connectionsSaved,
    messagesSent: plain.messagesSent,
    followUpsScheduled: plain.followUpsScheduled,
    satisfactionScore: plain.satisfactionScore == null ? null : Number(plain.satisfactionScore),
    feedbackNotes: plain.feedbackNotes,
    businessCardId: plain.businessCardId,
    businessCardSnapshot: plain.businessCardSnapshot ?? null,
    profileSnapshot: plain.profileSnapshot ?? null,
    metadata: plain.metadata ?? {},
    purchaseCents: plain.purchaseCents == null ? null : Number(plain.purchaseCents),
    purchaseCurrency: plain.purchaseCurrency ?? null,
    paymentStatus: plain.paymentStatus,
    bookedAt: plain.bookedAt,
    cancelledAt: plain.cancelledAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const NetworkingBusinessCard = sequelize.define(
  'NetworkingBusinessCard',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    companyId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    contactEmail: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
    contactPhone: { type: DataTypes.STRING(50), allowNull: true },
    websiteUrl: { type: DataTypes.STRING(500), allowNull: true },
    linkedinUrl: { type: DataTypes.STRING(500), allowNull: true },
    calendlyUrl: { type: DataTypes.STRING(500), allowNull: true },
    portfolioUrl: { type: DataTypes.STRING(500), allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    spotlightVideoUrl: { type: DataTypes.STRING(500), allowNull: true },
    preferences: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    status: {
      type: DataTypes.ENUM(...NETWORKING_BUSINESS_CARD_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [NETWORKING_BUSINESS_CARD_STATUSES] },
    },
    lastSharedAt: { type: DataTypes.DATE, allowNull: true },
    shareCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'networking_business_cards' },
);

NetworkingBusinessCard.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    ownerId: plain.ownerId,
    companyId: plain.companyId,
    title: plain.title,
    headline: plain.headline,
    bio: plain.bio,
    contactEmail: plain.contactEmail,
    contactPhone: plain.contactPhone,
    websiteUrl: plain.websiteUrl,
    linkedinUrl: plain.linkedinUrl,
    calendlyUrl: plain.calendlyUrl,
    portfolioUrl: plain.portfolioUrl,
    attachments: Array.isArray(plain.attachments) ? plain.attachments : plain.attachments ?? [],
    spotlightVideoUrl: plain.spotlightVideoUrl,
    preferences: plain.preferences ?? {},
    tags: Array.isArray(plain.tags) ? plain.tags : plain.tags ?? [],
    status: plain.status,
    lastSharedAt: plain.lastSharedAt,
    shareCount: plain.shareCount,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const NetworkingSessionOrder = sequelize.define(
  'NetworkingSessionOrder',
  {
    sessionId: { type: DataTypes.INTEGER, allowNull: false },
    purchaserId: { type: DataTypes.INTEGER, allowNull: false },
    purchaserEmail: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    purchaserName: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM(...NETWORKING_SESSION_ORDER_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [NETWORKING_SESSION_ORDER_STATUSES] },
    },
    amountCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    purchasedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    reference: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'networking_session_orders' },
);

NetworkingSessionOrder.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    sessionId: plain.sessionId,
    purchaserId: plain.purchaserId,
    purchaserEmail: plain.purchaserEmail,
    purchaserName: plain.purchaserName,
    status: plain.status,
    amountCents: plain.amountCents == null ? 0 : Number(plain.amountCents),
    currency: plain.currency,
    purchasedAt: plain.purchasedAt,
    reference: plain.reference,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const VolunteerApplication = sequelize.define(
  'VolunteerApplication',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    volunteeringRoleId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...VOLUNTEER_APPLICATION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [VOLUNTEER_APPLICATION_STATUSES] },
    },
    motivation: { type: DataTypes.TEXT, allowNull: true },
    availabilityStart: { type: DataTypes.DATEONLY, allowNull: true },
    availabilityHoursPerWeek: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0, max: 168 },
    },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    decisionAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'volunteer_applications',
    indexes: [
      { fields: ['userId'] },
      { fields: ['volunteeringRoleId'] },
      { fields: ['status'] },
    ],
  },
);

VolunteerApplication.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    volunteeringRoleId: plain.volunteeringRoleId,
    status: plain.status,
    motivation: plain.motivation ?? null,
    availabilityStart: plain.availabilityStart ?? null,
    availabilityHoursPerWeek: plain.availabilityHoursPerWeek ?? null,
    submittedAt: plain.submittedAt ?? null,
    decisionAt: plain.decisionAt ?? null,
    notes: plain.notes ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const VolunteerResponse = sequelize.define(
  'VolunteerResponse',
  {
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    responderId: { type: DataTypes.INTEGER, allowNull: true },
    responseType: {
      type: DataTypes.ENUM(...VOLUNTEER_RESPONSE_TYPES),
      allowNull: false,
      defaultValue: 'message',
      validate: { isIn: [VOLUNTEER_RESPONSE_TYPES] },
    },
    message: { type: DataTypes.TEXT, allowNull: false },
    requestedAction: { type: DataTypes.STRING(255), allowNull: true },
    respondedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'volunteer_responses',
    indexes: [
      { fields: ['applicationId'] },
      { fields: ['responderId'] },
      { fields: ['responseType'] },
    ],
  },
);

VolunteerResponse.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    applicationId: plain.applicationId,
    responderId: plain.responderId ?? null,
    responseType: plain.responseType,
    message: plain.message,
    requestedAction: plain.requestedAction ?? null,
    respondedAt: plain.respondedAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const VolunteerContract = sequelize.define(
  'VolunteerContract',
  {
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...VOLUNTEER_CONTRACT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [VOLUNTEER_CONTRACT_STATUSES] },
    },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    commitmentHours: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
    hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true, validate: { min: 0 } },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
    totalValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true, validate: { min: 0 } },
    spendToDate: { type: DataTypes.DECIMAL(12, 2), allowNull: true, validate: { min: 0 } },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'volunteer_contracts',
    indexes: [
      { fields: ['applicationId'], unique: true },
      { fields: ['ownerId'] },
      { fields: ['status'] },
    ],
  },
);

VolunteerContract.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    applicationId: plain.applicationId,
    ownerId: plain.ownerId,
    status: plain.status,
    startDate: plain.startDate ?? null,
    endDate: plain.endDate ?? null,
    commitmentHours: plain.commitmentHours ?? null,
    hourlyRate: plain.hourlyRate ?? null,
    currencyCode: plain.currencyCode ?? null,
    totalValue: plain.totalValue ?? null,
    spendToDate: plain.spendToDate ?? null,
    notes: plain.notes ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};


export const NetworkingConnection = sequelize.define(
  'NetworkingConnection',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    connectionUserId: { type: DataTypes.INTEGER, allowNull: true },
    sessionId: { type: DataTypes.INTEGER, allowNull: true },
    connectionName: { type: DataTypes.STRING(255), allowNull: true },
    connectionEmail: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    connectionHeadline: { type: DataTypes.STRING(255), allowNull: true },
    connectionCompany: { type: DataTypes.STRING(255), allowNull: true },
    followStatus: {
      type: DataTypes.ENUM(...NETWORKING_CONNECTION_FOLLOW_STATUSES),
      allowNull: true,
      defaultValue: 'saved',
      validate: { isIn: [NETWORKING_CONNECTION_FOLLOW_STATUSES] },
    },
    connectedAt: { type: DataTypes.DATE, allowNull: true },
    lastContactedAt: { type: DataTypes.DATE, allowNull: true },
    sourceSignupId: { type: DataTypes.INTEGER, allowNull: true },
    targetSignupId: { type: DataTypes.INTEGER, allowNull: true },
    sourceParticipantId: { type: DataTypes.INTEGER, allowNull: true },
    targetParticipantId: { type: DataTypes.INTEGER, allowNull: true },
    counterpartName: { type: DataTypes.STRING(255), allowNull: true },
    counterpartEmail: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    connectionType: {
      type: DataTypes.ENUM(...NETWORKING_CONNECTION_TYPES),
      allowNull: true,
      defaultValue: 'follow',
      validate: { isIn: [NETWORKING_CONNECTION_TYPES] },
    },
    status: {
      type: DataTypes.ENUM(...NETWORKING_CONNECTION_STATUSES),
      allowNull: true,
      defaultValue: 'new',
      validate: { isIn: [NETWORKING_CONNECTION_STATUSES] },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    firstInteractedAt: { type: DataTypes.DATE, allowNull: true },
    followUpAt: { type: DataTypes.DATE, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'networking_connections' },
);

NetworkingConnection.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });

  const resolveParticipant = (participant) => {
    if (!participant) {
      return null;
    }
    const name = participant.name
      ? participant.name
      : [participant.firstName, participant.lastName].filter(Boolean).join(' ').trim();
    return {
      id: participant.id ?? null,
      name: name || participant.email || null,
      email: participant.email ?? null,
    };
  };

  const normalizeTags = (tags) => {
    if (Array.isArray(tags)) {
      return tags;
    }
    if (tags && typeof tags === 'object') {
      return Object.values(tags);
    }
    return tags ? [tags] : [];
  };

  const base = {
    id: plain.id,
    ownerId: plain.ownerId ?? null,
    connectionUserId: plain.connectionUserId ?? null,
    sessionId: plain.sessionId ?? null,
    connectionName: plain.connectionName ?? plain.counterpartName ?? null,
    connectionEmail: plain.connectionEmail ?? plain.counterpartEmail ?? null,
    connectionHeadline: plain.connectionHeadline ?? null,
    connectionCompany: plain.connectionCompany ?? null,
    followStatus: plain.followStatus ?? null,
    connectionType: plain.connectionType ?? null,
    status: plain.status ?? null,
    connectedAt: plain.connectedAt ?? plain.firstInteractedAt ?? null,
    lastContactedAt: plain.lastContactedAt ?? null,
    firstInteractedAt: plain.firstInteractedAt ?? null,
    followUpAt: plain.followUpAt ?? null,
    notes: plain.notes ?? null,
    tags: normalizeTags(plain.tags),
    sourceSignupId: plain.sourceSignupId ?? null,
    targetSignupId: plain.targetSignupId ?? null,
    sourceParticipantId: plain.sourceParticipantId ?? null,
    targetParticipantId: plain.targetParticipantId ?? null,
    counterpartName: plain.counterpartName ?? null,
    counterpartEmail: plain.counterpartEmail ?? null,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };

  if (plain.session) {
    base.session = plain.session.toPublicObject ? plain.session.toPublicObject() : plain.session;
  }
  if (plain.owner) {
    base.owner = resolveParticipant(plain.owner);
  }
  if (plain.contact) {
    base.contact = resolveParticipant(plain.contact);
  }
  if (plain.sourceParticipant) {
    base.sourceParticipant = resolveParticipant(plain.sourceParticipant);
  }
  if (plain.targetParticipant) {
    base.targetParticipant = resolveParticipant(plain.targetParticipant);
  }

  return base;
};

export const Volunteering = sequelize.define(
  'Volunteering',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    organization: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    status: {
      type: DataTypes.ENUM(...VOLUNTEER_ROLE_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [VOLUNTEER_ROLE_STATUSES] },
    },
    remoteType: { type: DataTypes.STRING(20), allowNull: true },
    commitmentHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true, validate: { min: 0 } },
    applicationUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: { isUrl: true },
    },
    applicationDeadline: { type: DataTypes.DATE, allowNull: true },
    spots: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
    skills: { type: jsonType, allowNull: true },
    requirements: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    imageUrl: { type: DataTypes.STRING(500), allowNull: true },
    programId: { type: DataTypes.INTEGER, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    accessRoles: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'volunteering_roles',
    indexes: [
      { fields: ['programId'] },
      { fields: ['status'] },
      { fields: ['title'] },
    ],
  },
);

Volunteering.searchByTerm = async function searchByTerm(term, options = {}) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  const status = options.status && VOLUNTEER_ROLE_STATUSES.includes(options.status) ? options.status : null;

  return Volunteering.findAll({
    where: {
      ...(status ? { status } : {}),
      title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` },
    },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

export const MentorProfile = sequelize.define(
  'MentorProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: true },
    slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(191), allowNull: false },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    region: { type: DataTypes.STRING(191), allowNull: true },
    discipline: { type: DataTypes.STRING(120), allowNull: true },
    expertise: { type: jsonType, allowNull: true },
    searchVector: { type: DataTypes.TEXT, allowNull: true },
    sessionFeeAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    sessionFeeCurrency: { type: DataTypes.STRING(3), allowNull: true },
    sessionFeeUnit: { type: DataTypes.STRING(60), allowNull: true, defaultValue: 'session' },
    priceTier: {
      type: DataTypes.ENUM(...MENTOR_PRICE_TIERS),
      allowNull: false,
      defaultValue: 'tier_entry',
      validate: { isIn: [MENTOR_PRICE_TIERS] },
    },
    availabilityStatus: {
      type: DataTypes.ENUM(...MENTOR_AVAILABILITY_STATUSES),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [MENTOR_AVAILABILITY_STATUSES] },
    },
    availabilityNotes: { type: DataTypes.TEXT, allowNull: true },
    responseTimeHours: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
    reviewCount: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    verificationBadge: { type: DataTypes.STRING(191), allowNull: true },
    testimonialHighlight: { type: DataTypes.TEXT, allowNull: true },
    testimonialHighlightAuthor: { type: DataTypes.STRING(191), allowNull: true },
    testimonials: { type: jsonType, allowNull: true },
    packages: { type: jsonType, allowNull: true },
    avatarUrl: { type: DataTypes.STRING(512), allowNull: true },
    promoted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    rankingScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    lastActiveAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'mentor_profiles',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['discipline'] },
      { fields: ['priceTier'] },
      { fields: ['availabilityStatus'] },
      { fields: ['rankingScore', 'reviewCount'] },
    ],
  },
);

export const MENTOR_AVAILABILITY_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MENTOR_BOOKING_STATUSES = [
  'Scheduled',
  'Awaiting pre-work',
  'Completed',
  'Cancelled',
  'Rescheduled',
];
export const MENTOR_PAYMENT_STATUSES = ['Paid', 'Pending', 'Refunded', 'Overdue'];
export const MENTOR_CLIENT_STATUSES = ['Active', 'Onboarding', 'Paused', 'Graduated', 'Churned'];
export const MENTOR_RELATIONSHIP_TIERS = ['Flagship', 'Growth', 'Trial', 'Past'];
export const MENTOR_EVENT_TYPES = ['Session', 'Office hours', 'Workshop', 'Cohort'];
export const MENTOR_EVENT_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Awaiting prep'];
export const MENTOR_SUPPORT_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
export const MENTOR_SUPPORT_STATUSES = ['Open', 'Awaiting mentor', 'Awaiting support', 'Resolved'];
export const MENTOR_MESSAGE_STATUSES = ['Unread', 'Read', 'Archived'];
export const MENTOR_MESSAGE_CHANNELS = ['Explorer', 'Email', 'Slack Connect', 'WhatsApp'];
export const MENTOR_DOCUMENT_TYPES = ['Passport', 'National ID', 'Driving licence', 'Business certificate'];
export const MENTOR_VERIFICATION_STATUSES = ['Not started', 'In review', 'Action required', 'Approved'];
export const MENTOR_WALLET_TRANSACTION_TYPES = ['Payout', 'Mentorship earning', 'Adjustment'];
export const MENTOR_WALLET_TRANSACTION_STATUSES = ['Pending', 'Completed', 'Failed', 'Processing'];
export const MENTOR_INVOICE_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
export const MENTOR_PAYOUT_STATUSES = ['Scheduled', 'Processing', 'Paid', 'Failed'];

export const MentorAvailabilitySlot = sequelize.define(
  'MentorAvailabilitySlot',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    dayOfWeek: { type: DataTypes.STRING(16), allowNull: false },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    format: { type: DataTypes.STRING(120), allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
  },
  {
    tableName: 'mentor_availability_slots',
    indexes: [
      { fields: ['mentorId'], name: 'mentor_availability_slots_mentor_idx' },
      { fields: ['mentorId', 'dayOfWeek'], name: 'mentor_availability_slots_mentor_day_idx' },
    ],
  },
);

MentorAvailabilitySlot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    day: plain.dayOfWeek,
    start: plain.startTime instanceof Date ? plain.startTime.toISOString() : plain.startTime,
    end: plain.endTime instanceof Date ? plain.endTime.toISOString() : plain.endTime,
    format: plain.format,
    capacity: plain.capacity,
  };
};

export const MentorPackage = sequelize.define(
  'MentorPackage',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING(191), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    sessions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'GBP' },
    format: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Virtual' },
    outcome: { type: DataTypes.STRING(255), allowNull: false },
  },
  {
    tableName: 'mentor_packages',
    indexes: [{ fields: ['mentorId'], name: 'mentor_packages_mentor_idx' }],
  },
);

MentorPackage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    description: plain.description,
    sessions: plain.sessions,
    price: Number(plain.price),
    currency: plain.currency,
    format: plain.format,
    outcome: plain.outcome,
  };
};

export const MentorBooking = sequelize.define(
  'MentorBooking',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    menteeName: { type: DataTypes.STRING(191), allowNull: false },
    menteeRole: { type: DataTypes.STRING(191), allowNull: true },
    packageName: { type: DataTypes.STRING(191), allowNull: true },
    focus: { type: DataTypes.STRING(191), allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM(...MENTOR_BOOKING_STATUSES), allowNull: false, defaultValue: 'Scheduled' },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'GBP' },
    paymentStatus: {
      type: DataTypes.ENUM(...MENTOR_PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'Pending',
    },
    channel: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Explorer' },
    segment: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'active' },
    conferenceLink: { type: DataTypes.STRING(512), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'mentor_bookings',
    indexes: [
      { fields: ['mentorId'], name: 'mentor_bookings_mentor_idx' },
      { fields: ['mentorId', 'scheduledAt'], name: 'mentor_bookings_schedule_idx' },
    ],
  },
);

MentorBooking.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    mentee: plain.menteeName,
    role: plain.menteeRole ?? null,
    package: plain.packageName ?? null,
    focus: plain.focus ?? null,
    scheduledAt: plain.scheduledAt instanceof Date ? plain.scheduledAt.toISOString() : plain.scheduledAt,
    status: plain.status,
    price: Number(plain.price ?? 0),
    currency: plain.currency,
    paymentStatus: plain.paymentStatus,
    channel: plain.channel,
    segment: plain.segment,
    conferenceLink: plain.conferenceLink ?? undefined,
    notes: plain.notes ?? undefined,
  };
};

export const MentorClient = sequelize.define(
  'MentorClient',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING(191), allowNull: false },
    company: { type: DataTypes.STRING(191), allowNull: true },
    role: { type: DataTypes.STRING(191), allowNull: true },
    status: { type: DataTypes.ENUM(...MENTOR_CLIENT_STATUSES), allowNull: false, defaultValue: 'Active' },
    tier: { type: DataTypes.ENUM(...MENTOR_RELATIONSHIP_TIERS), allowNull: false, defaultValue: 'Growth' },
    value: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'GBP' },
    channel: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Explorer' },
    tags: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    onboardedAt: { type: DataTypes.DATE, allowNull: true },
    lastSessionAt: { type: DataTypes.DATE, allowNull: true },
    nextSessionAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'mentor_clients',
    indexes: [
      { fields: ['mentorId'], name: 'mentor_clients_mentor_idx' },
      { fields: ['mentorId', 'status'], name: 'mentor_clients_status_idx' },
    ],
  },
);

MentorClient.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    company: plain.company ?? null,
    role: plain.role ?? null,
    status: plain.status,
    tier: plain.tier,
    value: Number(plain.value ?? 0),
    currency: plain.currency,
    channel: plain.channel,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    notes: plain.notes ?? '',
    onboardedAt: plain.onboardedAt instanceof Date ? plain.onboardedAt.toISOString() : plain.onboardedAt,
    lastSessionAt: plain.lastSessionAt instanceof Date ? plain.lastSessionAt.toISOString() : plain.lastSessionAt,
    nextSessionAt: plain.nextSessionAt instanceof Date ? plain.nextSessionAt.toISOString() : plain.nextSessionAt,
  };
};

export const MentorEvent = sequelize.define(
  'MentorEvent',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'mentor_clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    title: { type: DataTypes.STRING(191), allowNull: false },
    type: { type: DataTypes.ENUM(...MENTOR_EVENT_TYPES), allowNull: false, defaultValue: 'Session' },
    status: { type: DataTypes.ENUM(...MENTOR_EVENT_STATUSES), allowNull: false, defaultValue: 'Scheduled' },
    startsAt: { type: DataTypes.DATE, allowNull: false },
    endsAt: { type: DataTypes.DATE, allowNull: false },
    location: { type: DataTypes.STRING(191), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'mentor_events',
    indexes: [
      { fields: ['mentorId'], name: 'mentor_events_mentor_idx' },
      { fields: ['mentorId', 'startsAt'], name: 'mentor_events_schedule_idx' },
    ],
  },
);

MentorEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    title: plain.title,
    type: plain.type,
    status: plain.status,
    startsAt: plain.startsAt instanceof Date ? plain.startsAt.toISOString() : plain.startsAt,
    endsAt: plain.endsAt instanceof Date ? plain.endsAt.toISOString() : plain.endsAt,
    location: plain.location ?? null,
    notes: plain.notes ?? '',
    clientId: plain.clientId ?? null,
  };
};

export const MentorSupportTicket = sequelize.define(
  'MentorSupportTicket',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    subject: { type: DataTypes.STRING(191), allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'General' },
    priority: { type: DataTypes.ENUM(...MENTOR_SUPPORT_PRIORITIES), allowNull: false, defaultValue: 'Normal' },
    status: { type: DataTypes.ENUM(...MENTOR_SUPPORT_STATUSES), allowNull: false, defaultValue: 'Open' },
    reference: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: false },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'mentor_support_tickets',
    indexes: [{ fields: ['mentorId'], name: 'mentor_support_tickets_mentor_idx' }],
  },
);

MentorSupportTicket.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    subject: plain.subject,
    category: plain.category,
    priority: plain.priority,
    status: plain.status,
    reference: plain.reference ?? null,
    notes: plain.notes ?? '',
    submittedAt: plain.submittedAt instanceof Date ? plain.submittedAt.toISOString() : plain.submittedAt,
    updatedAt: plain.respondedAt instanceof Date ? plain.respondedAt.toISOString() : plain.respondedAt,
  };
};

export const MentorMessage = sequelize.define(
  'MentorMessage',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    senderName: { type: DataTypes.STRING(191), allowNull: false },
    channel: { type: DataTypes.ENUM(...MENTOR_MESSAGE_CHANNELS), allowNull: false, defaultValue: 'Explorer' },
    status: { type: DataTypes.ENUM(...MENTOR_MESSAGE_STATUSES), allowNull: false, defaultValue: 'Unread' },
    subject: { type: DataTypes.STRING(191), allowNull: true },
    preview: { type: DataTypes.STRING(512), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    receivedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: 'mentor_messages',
    indexes: [
      { fields: ['mentorId'], name: 'mentor_messages_mentor_idx' },
      { fields: ['mentorId', 'status'], name: 'mentor_messages_status_idx' },
    ],
  },
);

MentorMessage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    from: plain.senderName,
    channel: plain.channel,
    status: plain.status,
    subject: plain.subject ?? null,
    preview: plain.preview ?? '',
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    receivedAt: plain.receivedAt instanceof Date ? plain.receivedAt.toISOString() : plain.receivedAt,
  };
};

export const MentorVerification = sequelize.define(
  'MentorVerification',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM(...MENTOR_VERIFICATION_STATUSES),
      allowNull: false,
      defaultValue: 'Not started',
    },
    lastSubmittedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'mentor_verifications',
    indexes: [{ unique: true, fields: ['mentorId'], name: 'mentor_verifications_mentor_unique' }],
  },
);

MentorVerification.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    mentorId: plain.mentorId,
    status: plain.status,
    lastSubmittedAt:
      plain.lastSubmittedAt instanceof Date ? plain.lastSubmittedAt.toISOString() : plain.lastSubmittedAt,
    notes: plain.notes ?? null,
  };
};

export const MentorVerificationDocument = sequelize.define(
  'MentorVerificationDocument',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    type: { type: DataTypes.ENUM(...MENTOR_DOCUMENT_TYPES), allowNull: false },
    status: {
      type: DataTypes.ENUM('Pending', 'In review', 'Approved', 'Action required'),
      allowNull: false,
      defaultValue: 'In review',
    },
    reference: { type: DataTypes.STRING(191), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    storageKey: { type: DataTypes.STRING(255), allowNull: true },
    fileName: { type: DataTypes.STRING(255), allowNull: true },
    contentType: { type: DataTypes.STRING(120), allowNull: true },
    fileSize: { type: DataTypes.INTEGER, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: false },
    storedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'mentor_verification_documents',
    indexes: [{ fields: ['mentorId'], name: 'mentor_verification_documents_mentor_idx' }],
  },
);

MentorVerificationDocument.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    type: plain.type,
    status: plain.status,
    reference: plain.reference ?? null,
    notes: plain.notes ?? '',
    storageKey: plain.storageKey ?? null,
    fileName: plain.fileName ?? null,
    contentType: plain.contentType ?? null,
    fileSize: plain.fileSize ?? null,
    submittedAt: plain.submittedAt instanceof Date ? plain.submittedAt.toISOString() : plain.submittedAt,
    storedAt: plain.storedAt instanceof Date ? plain.storedAt.toISOString() : plain.storedAt,
  };
};

export const MentorWalletTransaction = sequelize.define(
  'MentorWalletTransaction',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM(...MENTOR_WALLET_TRANSACTION_TYPES),
      allowNull: false,
      defaultValue: 'Mentorship earning',
    },
    status: {
      type: DataTypes.ENUM(...MENTOR_WALLET_TRANSACTION_STATUSES),
      allowNull: false,
      defaultValue: 'Completed',
    },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'GBP' },
    reference: { type: DataTypes.STRING(191), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: 'mentor_wallet_transactions',
    indexes: [
      { fields: ['mentorId'], name: 'mentor_wallet_transactions_mentor_idx' },
      { fields: ['mentorId', 'status'], name: 'mentor_wallet_transactions_status_idx' },
    ],
  },
);

MentorWalletTransaction.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    type: plain.type,
    status: plain.status,
    amount: Number(plain.amount ?? 0),
    currency: plain.currency,
    reference: plain.reference,
    description: plain.description ?? '',
    occurredAt: plain.occurredAt instanceof Date ? plain.occurredAt.toISOString() : plain.occurredAt,
  };
};

export const MentorInvoice = sequelize.define(
  'MentorInvoice',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    reference: { type: DataTypes.STRING(191), allowNull: false },
    menteeName: { type: DataTypes.STRING(191), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'GBP' },
    status: { type: DataTypes.ENUM(...MENTOR_INVOICE_STATUSES), allowNull: false, defaultValue: 'Draft' },
    issuedOn: { type: DataTypes.DATE, allowNull: false },
    dueOn: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'mentor_invoices',
    indexes: [{ fields: ['mentorId'], name: 'mentor_invoices_mentor_idx' }],
  },
);

MentorInvoice.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    reference: plain.reference,
    mentee: plain.menteeName,
    amount: Number(plain.amount ?? 0),
    currency: plain.currency,
    status: plain.status,
    issuedOn: plain.issuedOn instanceof Date ? plain.issuedOn.toISOString() : plain.issuedOn,
    dueOn: plain.dueOn instanceof Date ? plain.dueOn.toISOString() : plain.dueOn,
    notes: plain.notes ?? '',
  };
};

export const MentorPayout = sequelize.define(
  'MentorPayout',
  {
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    reference: { type: DataTypes.STRING(191), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'GBP' },
    status: { type: DataTypes.ENUM(...MENTOR_PAYOUT_STATUSES), allowNull: false, defaultValue: 'Scheduled' },
    scheduledFor: { type: DataTypes.DATE, allowNull: false },
    processedAt: { type: DataTypes.DATE, allowNull: true },
    failureReason: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'mentor_payouts',
    indexes: [
      { fields: ['mentorId'], name: 'mentor_payouts_mentor_idx' },
      { fields: ['mentorId', 'status'], name: 'mentor_payouts_status_idx' },
    ],
  },
);

MentorPayout.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    reference: plain.reference,
    amount: Number(plain.amount ?? 0),
    currency: plain.currency,
    status: plain.status,
    scheduledFor: plain.scheduledFor instanceof Date ? plain.scheduledFor.toISOString() : plain.scheduledFor,
    processedAt: plain.processedAt instanceof Date ? plain.processedAt.toISOString() : plain.processedAt,
    failureReason: plain.failureReason ?? null,
    notes: plain.notes ?? '',
  };
};

export const VolunteerContractSpend = sequelize.define(
  'VolunteerContractSpend',
  {
    contractId: { type: DataTypes.INTEGER, allowNull: false },
    recordedById: { type: DataTypes.INTEGER, allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    category: {
      type: DataTypes.ENUM(...VOLUNTEER_SPEND_CATEGORIES),
      allowNull: false,
      defaultValue: 'other',
      validate: { isIn: [VOLUNTEER_SPEND_CATEGORIES] },
    },
    description: { type: DataTypes.STRING(255), allowNull: true },
    incurredAt: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'volunteer_contract_spend',
    indexes: [
      { fields: ['contractId'] },
      { fields: ['incurredAt'] },
    ],
  },
);

VolunteerContractSpend.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    contractId: plain.contractId,
    recordedById: plain.recordedById ?? null,
    amount: plain.amount,
    currencyCode: plain.currencyCode,
    category: plain.category,
    description: plain.description ?? null,
    incurredAt: plain.incurredAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const VolunteerContractReview = sequelize.define(
  'VolunteerContractReview',
  {
    contractId: { type: DataTypes.INTEGER, allowNull: false },
    reviewerId: { type: DataTypes.INTEGER, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    headline: { type: DataTypes.STRING(180), allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    visibility: {
      type: DataTypes.ENUM('private', 'shared'),
      allowNull: false,
      defaultValue: 'private',
    },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'volunteer_contract_reviews',
    indexes: [
      { fields: ['contractId'] },
      { fields: ['reviewerId'] },
      { fields: ['visibility'] },
    ],
  },
);

VolunteerContractReview.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    contractId: plain.contractId,
    reviewerId: plain.reviewerId,
    rating: plain.rating,
    headline: plain.headline ?? null,
    feedback: plain.feedback ?? null,
    visibility: plain.visibility,
    publishedAt: plain.publishedAt ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const VolunteerProgram = sequelize.define(
  'VolunteerProgram',
  {
    name: { type: DataTypes.STRING(160), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...VOLUNTEER_PROGRAM_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [VOLUNTEER_PROGRAM_STATUSES] },
    },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true },
    contactPhone: { type: DataTypes.STRING(40), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    startsAt: { type: DataTypes.DATE, allowNull: true },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    maxVolunteers: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'volunteer_programs' },
);

export const VolunteerShift = sequelize.define(
  'VolunteerShift',
  {
    programId: { type: DataTypes.INTEGER, allowNull: true },
    roleId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false },
    shiftDate: { type: DataTypes.DATEONLY, allowNull: false },
    startTime: { type: DataTypes.TIME, allowNull: true },
    endTime: { type: DataTypes.TIME, allowNull: true },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    requirements: { type: jsonType, allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    reserved: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...VOLUNTEER_SHIFT_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
      validate: { isIn: [VOLUNTEER_SHIFT_STATUSES] },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'volunteer_shifts' },
);

export const VolunteerAssignment = sequelize.define(
  'VolunteerAssignment',
  {
    shiftId: { type: DataTypes.INTEGER, allowNull: false },
    volunteerId: { type: DataTypes.INTEGER, allowNull: true },
    fullName: { type: DataTypes.STRING(160), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(40), allowNull: true },
    status: {
      type: DataTypes.ENUM(...VOLUNTEER_ASSIGNMENT_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
      validate: { isIn: [VOLUNTEER_ASSIGNMENT_STATUSES] },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    checkInAt: { type: DataTypes.DATE, allowNull: true },
    checkOutAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'volunteer_assignments' },
);

VolunteerProgram.hasMany(Volunteering, { as: 'roles', foreignKey: 'programId' });
Volunteering.belongsTo(VolunteerProgram, { as: 'program', foreignKey: 'programId' });

VolunteerProgram.hasMany(VolunteerShift, { as: 'shifts', foreignKey: 'programId' });
VolunteerShift.belongsTo(VolunteerProgram, { as: 'program', foreignKey: 'programId' });

Volunteering.hasMany(VolunteerShift, { as: 'shifts', foreignKey: 'roleId' });
VolunteerShift.belongsTo(Volunteering, { as: 'role', foreignKey: 'roleId' });

VolunteerShift.hasMany(VolunteerAssignment, { as: 'assignments', foreignKey: 'shiftId' });
VolunteerAssignment.belongsTo(VolunteerShift, { as: 'shift', foreignKey: 'shiftId' });
VolunteerAssignment.belongsTo(User, { as: 'volunteer', foreignKey: 'volunteerId' });

export const OpportunityTaxonomy = sequelize.define(
  'OpportunityTaxonomy',
  {
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: { isIn: [OPPORTUNITY_TAXONOMY_TYPES] },
    },
    slug: { type: DataTypes.STRING(160), allowNull: false },
    label: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    parentId: { type: DataTypes.INTEGER, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'opportunity_taxonomies' },
);

OpportunityTaxonomy.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    type: plain.type,
    slug: plain.slug,
    label: plain.label,
    description: plain.description ?? null,
    parentId: plain.parentId ?? null,
    isActive: plain.isActive,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const OpportunityTaxonomyAssignment = sequelize.define(
  'OpportunityTaxonomyAssignment',
  {
    taxonomyId: { type: DataTypes.INTEGER, allowNull: false },
    targetType: { type: DataTypes.STRING(40), allowNull: false },
    targetId: { type: DataTypes.INTEGER, allowNull: false },
    weight: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    source: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'manual' },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'opportunity_taxonomy_assignments' },
);

OpportunityTaxonomyAssignment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const taxonomyPlain = plain.taxonomy
    ? typeof plain.taxonomy.get === 'function'
      ? plain.taxonomy.get({ plain: true })
      : plain.taxonomy
    : null;

  return {
    id: plain.id,
    taxonomyId: plain.taxonomyId,
    targetType: plain.targetType,
    targetId: plain.targetId,
    weight: plain.weight,
    source: plain.source,
    metadata: plain.metadata ?? null,
    taxonomy: taxonomyPlain
      ? {
          id: taxonomyPlain.id,
          slug: taxonomyPlain.slug,
          label: taxonomyPlain.label,
          type: taxonomyPlain.type,
        }
      : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdCampaign = sequelize.define(
  'AdCampaign',
  {
    name: { type: DataTypes.STRING(255), allowNull: false },
    objective: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'brand',
      validate: { isIn: [AD_OBJECTIVES] },
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [AD_STATUSES] },
    },
    budgetCents: { type: DataTypes.BIGINT, allowNull: true },
    currencyCode: { type: DataTypes.STRING(8), allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'ad_campaigns' },
);

AdCampaign.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    objective: plain.objective,
    status: plain.status,
    budgetCents: plain.budgetCents == null ? null : Number(plain.budgetCents),
    currencyCode: plain.currencyCode ?? null,
    startDate: plain.startDate ?? null,
    endDate: plain.endDate ?? null,
    ownerId: plain.ownerId ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdCreative = sequelize.define(
  'AdCreative',
  {
    campaignId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: { isIn: [AD_TYPES] },
    },
    format: { type: DataTypes.STRING(40), allowNull: true },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [AD_STATUSES] },
    },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    subheadline: { type: DataTypes.STRING(255), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: true },
    callToAction: { type: DataTypes.STRING(120), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(500), allowNull: true },
    mediaUrl: { type: DataTypes.STRING(500), allowNull: true },
    durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
    primaryColor: { type: DataTypes.STRING(12), allowNull: true },
    accentColor: { type: DataTypes.STRING(12), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'ad_creatives' },
);

AdCreative.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    campaignId: plain.campaignId,
    name: plain.name,
    type: plain.type,
    format: plain.format ?? null,
    status: plain.status,
    headline: plain.headline ?? null,
    subheadline: plain.subheadline ?? null,
    body: plain.body ?? null,
    callToAction: plain.callToAction ?? null,
    ctaUrl: plain.ctaUrl ?? null,
    mediaUrl: plain.mediaUrl ?? null,
    durationSeconds: plain.durationSeconds == null ? null : Number(plain.durationSeconds),
    primaryColor: plain.primaryColor ?? null,
    accentColor: plain.accentColor ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdKeyword = sequelize.define(
  'AdKeyword',
  {
    keyword: { type: DataTypes.STRING(160), allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: true },
    intent: {
      type: DataTypes.STRING(40),
      allowNull: true,
      validate: { isIn: [AD_KEYWORD_INTENTS] },
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'ad_keywords' },
);

AdKeyword.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    keyword: plain.keyword,
    category: plain.category ?? null,
    intent: plain.intent ?? null,
    description: plain.description ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdKeywordAssignment = sequelize.define(
  'AdKeywordAssignment',
  {
    keywordId: { type: DataTypes.INTEGER, allowNull: false },
    creativeId: { type: DataTypes.INTEGER, allowNull: false },
    taxonomyId: { type: DataTypes.INTEGER, allowNull: true },
    weight: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    context: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'ad_keyword_assignments' },
);

AdKeywordAssignment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const keywordPlain = plain.keyword
    ? typeof plain.keyword.get === 'function'
      ? plain.keyword.get({ plain: true })
      : plain.keyword
    : null;
  const taxonomyPlain = plain.taxonomy
    ? typeof plain.taxonomy.get === 'function'
      ? plain.taxonomy.get({ plain: true })
      : plain.taxonomy
    : null;

  return {
    id: plain.id,
    keywordId: plain.keywordId,
    creativeId: plain.creativeId,
    taxonomyId: plain.taxonomyId ?? null,
    weight: plain.weight,
    context: plain.context ?? null,
    metadata: plain.metadata ?? null,
    keyword: keywordPlain
      ? {
          id: keywordPlain.id,
          keyword: keywordPlain.keyword,
          category: keywordPlain.category,
          intent: keywordPlain.intent,
        }
      : null,
    taxonomy: taxonomyPlain
      ? {
          id: taxonomyPlain.id,
          slug: taxonomyPlain.slug,
          label: taxonomyPlain.label,
          type: taxonomyPlain.type,
        }
      : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdPlacement = sequelize.define(
  'AdPlacement',
  {
    creativeId: { type: DataTypes.INTEGER, allowNull: false },
    surface: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'global_dashboard',
      validate: { isIn: [AD_SURFACE_TYPES] },
    },
    position: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'inline',
      validate: { isIn: [AD_POSITION_TYPES] },
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [AD_STATUSES] },
    },
    weight: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    pacingMode: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'even',
      validate: { isIn: [AD_PACING_MODES] },
    },
    maxImpressionsPerHour: { type: DataTypes.INTEGER, allowNull: true },
    startAt: { type: DataTypes.DATE, allowNull: true },
    endAt: { type: DataTypes.DATE, allowNull: true },
    opportunityType: {
      type: DataTypes.STRING(60),
      allowNull: true,
      validate: { isIn: [AD_OPPORTUNITY_TYPES] },
    },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'ad_placements' },
);

AdPlacement.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const creativePlain = plain.creative
    ? typeof plain.creative.get === 'function'
      ? plain.creative.get({ plain: true })
      : plain.creative
    : null;

  return {
    id: plain.id,
    creativeId: plain.creativeId,
    surface: plain.surface,
    position: plain.position,
    status: plain.status,
    weight: plain.weight,
    pacingMode: plain.pacingMode,
    maxImpressionsPerHour: plain.maxImpressionsPerHour == null ? null : Number(plain.maxImpressionsPerHour),
    startAt: plain.startAt ?? null,
    endAt: plain.endAt ?? null,
    opportunityType: plain.opportunityType ?? null,
    priority: plain.priority,
    metadata: plain.metadata ?? null,
    creative: creativePlain ? { ...creativePlain } : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdSurfaceSetting = sequelize.define(
  'AdSurfaceSetting',
  {
    surface: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      validate: { isIn: [AD_SURFACE_TYPES] },
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(1024), allowNull: true },
    layoutMode: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'inline',
      validate: { isIn: [AD_SURFACE_LAYOUT_MODES] },
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    supportsCoupons: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    placementLimit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
    defaultPosition: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'inline',
      validate: { isIn: [AD_POSITION_TYPES] },
    },
    metadata: { type: jsonType, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'ad_surface_settings' },
);

AdSurfaceSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    surface: plain.surface,
    name: plain.name,
    description: plain.description ?? null,
    heroImageUrl: plain.heroImageUrl ?? null,
    layoutMode: plain.layoutMode,
    isActive: Boolean(plain.isActive),
    supportsCoupons: Boolean(plain.supportsCoupons),
    placementLimit: Number(plain.placementLimit ?? 0),
    defaultPosition: plain.defaultPosition,
    metadata: plain.metadata ?? null,
    createdById: plain.createdById ?? null,
    updatedById: plain.updatedById ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdCoupon = sequelize.define(
  'AdCoupon',
  {
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    discountType: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'percentage',
      validate: { isIn: [AD_COUPON_DISCOUNT_TYPES] },
    },
    discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [AD_COUPON_STATUSES] },
    },
    startAt: { type: DataTypes.DATE, allowNull: true },
    endAt: { type: DataTypes.DATE, allowNull: true },
    maxRedemptions: { type: DataTypes.INTEGER, allowNull: true },
    perUserLimit: { type: DataTypes.INTEGER, allowNull: true },
    totalRedemptions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
    surfaceTargets: { type: jsonType, allowNull: true },
    termsUrl: { type: DataTypes.STRING(500), allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'ad_coupons' },
);

AdCoupon.prototype.toPublicObject = function toPublicObject({ now = new Date() } = {}) {
  const plain = this.get({ plain: true });
  const nowTs = now.getTime();
  const startTs = plain.startAt ? new Date(plain.startAt).getTime() : null;
  const endTs = plain.endAt ? new Date(plain.endAt).getTime() : null;

  let lifecycleStatus = plain.status;
  if (plain.status === 'archived') {
    lifecycleStatus = 'archived';
  } else if (plain.status === 'paused') {
    lifecycleStatus = 'paused';
  } else if (endTs != null && endTs < nowTs) {
    lifecycleStatus = 'expired';
  } else if (startTs != null && startTs > nowTs) {
    lifecycleStatus = 'scheduled';
  } else if (plain.status === 'draft') {
    lifecycleStatus = 'draft';
  } else {
    lifecycleStatus = 'active';
  }

  const remainingRedemptions =
    plain.maxRedemptions == null
      ? null
      : Math.max(0, Number(plain.maxRedemptions) - Number(plain.totalRedemptions ?? 0));

  return {
    id: plain.id,
    code: plain.code,
    name: plain.name,
    description: plain.description ?? null,
    discountType: plain.discountType,
    discountValue: Number(plain.discountValue ?? 0),
    status: plain.status,
    lifecycleStatus,
    isActive: lifecycleStatus === 'active',
    startAt: plain.startAt ?? null,
    endAt: plain.endAt ?? null,
    maxRedemptions: plain.maxRedemptions == null ? null : Number(plain.maxRedemptions),
    perUserLimit: plain.perUserLimit == null ? null : Number(plain.perUserLimit),
    totalRedemptions: Number(plain.totalRedemptions ?? 0),
    remainingRedemptions,
    surfaceTargets: Array.isArray(plain.surfaceTargets) ? plain.surfaceTargets : [],
    metadata: plain.metadata ?? null,
    termsUrl: plain.termsUrl ?? null,
    createdById: plain.createdById ?? null,
    updatedById: plain.updatedById ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdPlacementCoupon = sequelize.define(
  'AdPlacementCoupon',
  {
    couponId: { type: DataTypes.INTEGER, allowNull: false },
    placementId: { type: DataTypes.INTEGER, allowNull: false },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'ad_placement_coupons' },
);

AdPlacementCoupon.prototype.toPublicObject = function toPublicObject({ now = new Date() } = {}) {
  const plain = this.get({ plain: true });
  const couponPlain = plain.coupon
    ? typeof plain.coupon.get === 'function'
      ? plain.coupon.get({ plain: true })
      : plain.coupon
    : null;
  const placementPlain = plain.placement
    ? typeof plain.placement.get === 'function'
      ? plain.placement.get({ plain: true })
      : plain.placement
    : null;

  return {
    id: plain.id,
    couponId: plain.couponId,
    placementId: plain.placementId,
    priority: Number(plain.priority ?? 0),
    metadata: plain.metadata ?? null,
    coupon: couponPlain ? AdCoupon.build(couponPlain).toPublicObject({ now }) : null,
    placement: placementPlain ? AdPlacement.build(placementPlain).toPublicObject() : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};
export const Group = sequelize.define(
  'Group',
  {
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    avatarColor: { type: DataTypes.STRING(7), allowNull: false, defaultValue: '#2563eb' },
    bannerImageUrl: { type: DataTypes.STRING(255), allowNull: true },
    visibility: {
      type: DataTypes.ENUM(...GROUP_VISIBILITIES),
      allowNull: false,
      defaultValue: 'public',
      validate: { isIn: [GROUP_VISIBILITIES] },
    },
    memberPolicy: {
      type: DataTypes.ENUM(...GROUP_MEMBER_POLICIES),
      allowNull: false,
      defaultValue: 'request',
      validate: { isIn: [GROUP_MEMBER_POLICIES] },
    },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    settings: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'groups' },
);

Group.addHook('beforeValidate', (group) => {
  if (!group) return;
  applyModelSlug(group, { fallback: 'group', sourceField: 'name', maxLength: 80 });
  group.avatarColor = normaliseHexColor(group.avatarColor, { fallback: '#2563eb' });
});

Group.addHook('beforeSave', (group) => {
  if (!group) return;
  group.avatarColor = normaliseHexColor(group.avatarColor, { fallback: '#2563eb' });
});

export const GroupMembership = sequelize.define(
  'GroupMembership',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
    role: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: 'member',
      validate: { isIn: [GROUP_MEMBERSHIP_ROLES] },
    },
    status: {
      type: DataTypes.ENUM(...GROUP_MEMBERSHIP_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [GROUP_MEMBERSHIP_STATUSES] },
    },
    joinedAt: { type: DataTypes.DATE, allowNull: true },
    invitedById: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'group_memberships' },
);

GroupMembership.addHook('beforeSave', (membership) => {
  if (!membership) return;
  if (membership.status === 'active' && !membership.joinedAt) {
    membership.joinedAt = new Date();
  }
});

export const GroupInvite = sequelize.define(
  'GroupInvite',
  {
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
    role: {
      type: DataTypes.ENUM(...GROUP_MEMBERSHIP_ROLES),
      allowNull: false,
      defaultValue: 'member',
      validate: { isIn: [GROUP_MEMBERSHIP_ROLES] },
    },
    status: {
      type: DataTypes.ENUM(...COMMUNITY_INVITE_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [COMMUNITY_INVITE_STATUSES] },
    },
    token: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4 },
    invitedById: { type: DataTypes.INTEGER, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'group_invites' },
);

GroupInvite.addHook('beforeValidate', (invite) => {
  if (!invite) return;
  invite.email = normaliseEmail(invite.email);
});

export const GroupPost = sequelize.define(
  'GroupPost',
  {
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    summary: { type: DataTypes.STRING(280), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    attachments: { type: jsonType, allowNull: true },
    status: {
      type: DataTypes.ENUM(...GROUP_POST_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [GROUP_POST_STATUSES] },
    },
    visibility: {
      type: DataTypes.ENUM(...GROUP_POST_VISIBILITIES),
      allowNull: false,
      defaultValue: 'members',
      validate: { isIn: [GROUP_POST_VISIBILITIES] },
    },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: false },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'group_posts' },
);

GroupPost.addHook('beforeValidate', (post) => {
  if (!post) return;
  applyModelSlug(post, {
    slugField: 'slug',
    sourceField: 'title',
    fallback: 'group-post',
    maxLength: 160,
    randomiseOnCreate: true,
  });
});

GroupPost.addHook('beforeSave', (post) => {
  if (!post) return;
  ensurePublishedTimestamp(post, { statusField: 'status', publishedAtField: 'publishedAt', publishStatuses: ['published'] });
});

export const Page = sequelize.define(
  'Page',
  {
    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(120), allowNull: true },
    websiteUrl: { type: DataTypes.STRING(255), allowNull: true },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true },
    visibility: {
      type: DataTypes.ENUM(...PAGE_VISIBILITIES),
      allowNull: false,
      defaultValue: 'public',
      validate: { isIn: [PAGE_VISIBILITIES] },
    },
    avatarColor: { type: DataTypes.STRING(7), allowNull: false, defaultValue: '#0f172a' },
    bannerImageUrl: { type: DataTypes.STRING(255), allowNull: true },
    callToAction: { type: DataTypes.STRING(255), allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    settings: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pages' },
);

Page.addHook('beforeValidate', (page) => {
  if (!page) return;
  applyModelSlug(page, { fallback: 'page', sourceField: 'name', maxLength: 120 });
  page.contactEmail = normaliseEmail(page.contactEmail);
  page.avatarColor = normaliseHexColor(page.avatarColor, { fallback: '#0f172a' });
});

Page.addHook('beforeSave', (page) => {
  if (!page) return;
  page.avatarColor = normaliseHexColor(page.avatarColor, { fallback: '#0f172a' });
});

export const PageMembership = sequelize.define(
  'PageMembership',
  {
    pageId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: {
      type: DataTypes.ENUM(...PAGE_MEMBER_ROLES),
      allowNull: false,
      defaultValue: 'viewer',
      validate: { isIn: [PAGE_MEMBER_ROLES] },
    },
    status: {
      type: DataTypes.ENUM(...PAGE_MEMBER_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [PAGE_MEMBER_STATUSES] },
    },
    invitedById: { type: DataTypes.INTEGER, allowNull: true },
    joinedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'page_memberships' },
);

PageMembership.addHook('beforeSave', (membership) => {
  if (!membership) return;
  if (membership.status === 'active' && !membership.joinedAt) {
    membership.joinedAt = new Date();
  }
});

export const PageInvite = sequelize.define(
  'PageInvite',
  {
    pageId: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
    role: {
      type: DataTypes.ENUM(...PAGE_MEMBER_ROLES),
      allowNull: false,
      defaultValue: 'editor',
      validate: { isIn: [PAGE_MEMBER_ROLES] },
    },
    status: {
      type: DataTypes.ENUM(...COMMUNITY_INVITE_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [COMMUNITY_INVITE_STATUSES] },
    },
    token: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4 },
    invitedById: { type: DataTypes.INTEGER, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'page_invites' },
);

PageInvite.addHook('beforeValidate', (invite) => {
  if (!invite) return;
  invite.email = normaliseEmail(invite.email);
});

export const PagePost = sequelize.define(
  'PagePost',
  {
    pageId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    summary: { type: DataTypes.STRING(280), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    attachments: { type: jsonType, allowNull: true },
    status: {
      type: DataTypes.ENUM(...PAGE_POST_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [PAGE_POST_STATUSES] },
    },
    visibility: {
      type: DataTypes.ENUM(...PAGE_POST_VISIBILITIES),
      allowNull: false,
      defaultValue: 'public',
      validate: { isIn: [PAGE_POST_VISIBILITIES] },
    },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: false },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'page_posts' },
);

PagePost.addHook('beforeValidate', (post) => {
  if (!post) return;
  applyModelSlug(post, {
    slugField: 'slug',
    sourceField: 'title',
    fallback: 'page-post',
    maxLength: 160,
    randomiseOnCreate: true,
  });
});

PagePost.addHook('beforeSave', (post) => {
  if (!post) return;
  ensurePublishedTimestamp(post, { statusField: 'status', publishedAtField: 'publishedAt', publishStatuses: ['published'] });
});

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
    relationshipTag: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    favourite: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    visibility: {
      type: DataTypes.ENUM(...PROFILE_NETWORK_VISIBILITY_OPTIONS),
      allowNull: false,
      defaultValue: 'connections',
      validate: { isIn: [PROFILE_NETWORK_VISIBILITY_OPTIONS] },
    },
    connectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    lastInteractedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'connections' },
);

export const TwoFactorToken = sequelize.define(
  'TwoFactorToken',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false },
    codeHash: { type: DataTypes.STRING(128), allowNull: false },
    deliveryMethod: {
      type: DataTypes.ENUM(...TWO_FACTOR_METHODS),
      allowNull: false,
      defaultValue: 'email',
    },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    consumedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'two_factor_tokens',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
    indexes: [
      { fields: ['email'] },
      { fields: ['expiresAt'] },
    ],
  },
);

export const PasswordResetToken = sequelize.define(
  'PasswordResetToken',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    requestedFromIp: { type: DataTypes.STRING(64), allowNull: true },
    requestedUserAgent: { type: DataTypes.STRING(255), allowNull: true },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    consumedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'password_reset_tokens',
    indexes: [
      { fields: ['userId'] },
      { fields: ['expiresAt'] },
      { fields: ['consumedAt'] },
    ],
  },
);

export const UserRefreshSession = sequelize.define(
  'UserRefreshSession',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    ipAddress: { type: DataTypes.STRING(128), allowNull: true },
    userAgent: { type: DataTypes.STRING(1024), allowNull: true },
    deviceFingerprint: { type: DataTypes.STRING(128), allowNull: true },
    deviceLabel: { type: DataTypes.STRING(180), allowNull: true },
    riskLevel: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'low' },
    riskScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    riskSignals: { type: jsonType, allowNull: true },
    context: { type: jsonType, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    revokedReason: { type: DataTypes.STRING(120), allowNull: true },
    revokedById: { type: DataTypes.INTEGER, allowNull: true },
    revocationContext: { type: jsonType, allowNull: true },
    replacedByTokenHash: { type: DataTypes.STRING(128), allowNull: true },
  },
  {
    tableName: 'user_refresh_sessions',
    indexes: [
      { fields: ['userId'] },
      { fields: ['expiresAt'] },
      { fields: ['revokedAt'] },
      { fields: ['replacedByTokenHash'] },
      { fields: ['deviceFingerprint'] },
    ],
  },
);

export const UserRefreshInvalidation = sequelize.define(
  'UserRefreshInvalidation',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING(120), allowNull: true },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    context: { type: jsonType, allowNull: true },
    invalidatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'user_refresh_invalidations',
    indexes: [{ fields: ['userId', 'invalidatedAt'] }],
  },
);

PasswordResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PasswordResetToken, { foreignKey: 'userId', as: 'passwordResetTokens' });

UserRefreshSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserRefreshSession.belongsTo(User, { foreignKey: 'revokedById', as: 'revokedBy' });
User.hasMany(UserRefreshSession, { foreignKey: 'userId', as: 'refreshSessions' });

UserRefreshInvalidation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserRefreshInvalidation.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
User.hasMany(UserRefreshInvalidation, { foreignKey: 'userId', as: 'refreshInvalidations' });

export const TwoFactorPolicy = sequelize.define(
  'TwoFactorPolicy',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    appliesToRole: { type: DataTypes.ENUM(...TWO_FACTOR_POLICY_ROLES), allowNull: false, defaultValue: 'admin' },
    enforcementLevel: { type: DataTypes.ENUM(...TWO_FACTOR_ENFORCEMENT_LEVELS), allowNull: false, defaultValue: 'required' },
    enforced: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    allowedMethods: { type: jsonType, allowNull: false, defaultValue: [] },
    fallbackCodes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    sessionDurationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1440 },
    requireForSensitiveActions: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ipAllowlist: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'two_factor_policies',
    timestamps: true,
    indexes: [
      { fields: ['appliesToRole'] },
      { fields: ['enforcementLevel'] },
      { fields: ['enforced'] },
    ],
  },
);

export const TwoFactorEnrollment = sequelize.define(
  'TwoFactorEnrollment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(120), allowNull: true },
    method: { type: DataTypes.ENUM(...TWO_FACTOR_ENROLLMENT_METHODS), allowNull: false, defaultValue: 'app' },
    status: { type: DataTypes.ENUM(...TWO_FACTOR_ENROLLMENT_STATUSES), allowNull: false, defaultValue: 'pending' },
    metadata: { type: jsonType, allowNull: true },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true },
    activatedAt: { type: DataTypes.DATE, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    reviewedBy: { type: DataTypes.INTEGER, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'two_factor_enrollments',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['method'] },
    ],
  },
);

export const TwoFactorBypass = sequelize.define(
  'TwoFactorBypass',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    requestedBy: { type: DataTypes.INTEGER, allowNull: true },
    approvedBy: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM(...TWO_FACTOR_BYPASS_STATUSES), allowNull: false, defaultValue: 'pending' },
    reason: { type: DataTypes.STRING(500), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    issuedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'two_factor_bypasses',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['expiresAt'] },
    ],
  },
);

export const TwoFactorAuditLog = sequelize.define(
  'TwoFactorAuditLog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING(120), allowNull: false },
    targetType: { type: DataTypes.STRING(120), allowNull: true },
    targetId: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: 'two_factor_audit_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['action'] },
      { fields: ['targetType'] },
      { fields: ['createdAt'] },
    ],
  },
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

export const JobApplicationFavourite = sequelize.define(
  'JobApplicationFavourite',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    companyName: { type: DataTypes.STRING(180), allowNull: true },
    location: { type: DataTypes.STRING(180), allowNull: true },
    priority: {
      type: DataTypes.ENUM(...JOB_APPLICATION_FAVOURITE_PRIORITIES),
      allowNull: false,
      defaultValue: 'watching',
      validate: { isIn: [JOB_APPLICATION_FAVOURITE_PRIORITIES] },
    },
    tags: { type: jsonType, allowNull: true },
    salaryMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    salaryMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
    sourceUrl: { type: DataTypes.STRING(500), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    savedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'job_application_favourites',
    indexes: [
      { fields: ['userId'], name: 'job_application_favourites_user_idx' },
      { fields: ['priority'], name: 'job_application_favourites_priority_idx' },
    ],
  },
);

JobApplicationFavourite.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    jobId: plain.jobId,
    title: plain.title,
    companyName: plain.companyName ?? null,
    location: plain.location ?? null,
    priority: plain.priority,
    tags: Array.isArray(plain.tags) ? plain.tags : plain.tags ?? [],
    salaryMin: plain.salaryMin == null ? null : Number(plain.salaryMin),
    salaryMax: plain.salaryMax == null ? null : Number(plain.salaryMax),
    currencyCode: plain.currencyCode ?? null,
    sourceUrl: plain.sourceUrl ?? null,
    notes: plain.notes ?? null,
    savedAt: plain.savedAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const JobApplicationResponse = sequelize.define(
  'JobApplicationResponse',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    direction: {
      type: DataTypes.ENUM(...JOB_APPLICATION_RESPONSE_DIRECTIONS),
      allowNull: false,
      defaultValue: 'incoming',
      validate: { isIn: [JOB_APPLICATION_RESPONSE_DIRECTIONS] },
    },
    channel: {
      type: DataTypes.ENUM(...JOB_APPLICATION_RESPONSE_CHANNELS),
      allowNull: false,
      defaultValue: 'email',
      validate: { isIn: [JOB_APPLICATION_RESPONSE_CHANNELS] },
    },
    status: {
      type: DataTypes.ENUM(...JOB_APPLICATION_RESPONSE_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [JOB_APPLICATION_RESPONSE_STATUSES] },
    },
    subject: { type: DataTypes.STRING(255), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: true },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    followUpRequiredAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'job_application_responses',
    indexes: [
      { fields: ['userId'], name: 'job_application_responses_user_idx' },
      { fields: ['applicationId'], name: 'job_application_responses_application_idx' },
      { fields: ['status'], name: 'job_application_responses_status_idx' },
    ],
  },
);

JobApplicationResponse.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    applicationId: plain.applicationId,
    direction: plain.direction,
    channel: plain.channel,
    status: plain.status,
    subject: plain.subject ?? null,
    body: plain.body ?? null,
    sentAt: plain.sentAt ?? null,
    followUpRequiredAt: plain.followUpRequiredAt ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CareerPipelineBoard = sequelize.define(
  'CareerPipelineBoard',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    settings: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_pipeline_boards',
    indexes: [
      { fields: ['userId'], name: 'career_pipeline_boards_user_idx' },
      { fields: ['userId', 'isPrimary'], name: 'career_pipeline_boards_primary_idx' },
    ],
  },
);

export const CareerPipelineStage = sequelize.define(
  'CareerPipelineStage',
  {
    boardId: { type: DataTypes.INTEGER, allowNull: false },
    key: { type: DataTypes.STRING(80), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    stageType: {
      type: DataTypes.ENUM(...CAREER_PIPELINE_STAGE_TYPES),
      allowNull: false,
      defaultValue: 'applied',
      validate: { isIn: [CAREER_PIPELINE_STAGE_TYPES] },
    },
    outcomeCategory: {
      type: DataTypes.ENUM(...CAREER_PIPELINE_STAGE_OUTCOMES),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [CAREER_PIPELINE_STAGE_OUTCOMES] },
    },
    slaHours: { type: DataTypes.INTEGER, allowNull: true },
    exitCriteria: { type: jsonType, allowNull: true },
    checklistTemplate: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_pipeline_stages',
    indexes: [
      { fields: ['boardId', 'position'], name: 'career_pipeline_stages_position_idx' },
      { fields: ['boardId', 'key'], unique: true, name: 'career_pipeline_stages_key_idx' },
    ],
  },
);

export const CareerOpportunity = sequelize.define(
  'CareerOpportunity',
  {
    boardId: { type: DataTypes.INTEGER, allowNull: false },
    stageId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    companyName: { type: DataTypes.STRING(180), allowNull: false },
    location: { type: DataTypes.STRING(180), allowNull: true },
    salaryMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    salaryMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    salaryCurrency: { type: DataTypes.STRING(3), allowNull: true },
    stageEnteredAt: { type: DataTypes.DATE, allowNull: true },
    lastActivityAt: { type: DataTypes.DATE, allowNull: true },
    nextActionDueAt: { type: DataTypes.DATE, allowNull: true },
    followUpStatus: {
      type: DataTypes.ENUM(...CAREER_OPPORTUNITY_FOLLOW_UP_STATUSES),
      allowNull: false,
      defaultValue: 'on_track',
      validate: { isIn: [CAREER_OPPORTUNITY_FOLLOW_UP_STATUSES] },
    },
    researchSummary: { type: DataTypes.TEXT, allowNull: true },
    researchLinks: { type: jsonType, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    collaboratorNotes: { type: DataTypes.TEXT, allowNull: true },
    complianceStatus: {
      type: DataTypes.ENUM(...CAREER_COMPLIANCE_STATUSES),
      allowNull: false,
      defaultValue: 'not_required',
      validate: { isIn: [CAREER_COMPLIANCE_STATUSES] },
    },
    equalOpportunityReport: { type: jsonType, allowNull: true },
    automationMetadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_opportunities',
    indexes: [
      { fields: ['userId'], name: 'career_opportunities_user_idx' },
      { fields: ['boardId', 'stageId'], name: 'career_opportunities_stage_idx' },
      { fields: ['followUpStatus'], name: 'career_opportunities_follow_up_idx' },
      { fields: ['lastActivityAt'], name: 'career_opportunities_activity_idx' },
    ],
  },
);

export const CareerOpportunityCollaborator = sequelize.define(
  'CareerOpportunityCollaborator',
  {
    opportunityId: { type: DataTypes.INTEGER, allowNull: false },
    collaboratorId: { type: DataTypes.INTEGER, allowNull: false },
    collaboratorEmail: { type: DataTypes.STRING(180), allowNull: true },
    role: { type: DataTypes.STRING(120), allowNull: true },
    permissions: { type: jsonType, allowNull: true },
    invitedAt: { type: DataTypes.DATE, allowNull: true },
    joinedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'career_opportunity_collaborators',
    indexes: [
      { fields: ['opportunityId'], name: 'career_opportunity_collaborators_opportunity_idx' },
      { fields: ['collaboratorId'], name: 'career_opportunity_collaborators_collaborator_idx' },
    ],
  },
);

export const CareerOpportunityNudge = sequelize.define(
  'CareerOpportunityNudge',
  {
    opportunityId: { type: DataTypes.INTEGER, allowNull: false },
    stageId: { type: DataTypes.INTEGER, allowNull: false },
    severity: {
      type: DataTypes.ENUM(...CAREER_NUDGE_SEVERITIES),
      allowNull: false,
      defaultValue: 'info',
      validate: { isIn: [CAREER_NUDGE_SEVERITIES] },
    },
    channel: {
      type: DataTypes.ENUM(...CAREER_NUDGE_CHANNELS),
      allowNull: false,
      defaultValue: 'in_app',
      validate: { isIn: [CAREER_NUDGE_CHANNELS] },
    },
    message: { type: DataTypes.TEXT, allowNull: false },
    triggeredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_opportunity_nudges',
    indexes: [
      { fields: ['opportunityId'], name: 'career_opportunity_nudges_opportunity_idx' },
      { fields: ['stageId'], name: 'career_opportunity_nudges_stage_idx' },
      { fields: ['severity'], name: 'career_opportunity_nudges_severity_idx' },
    ],
  },
);

export const CareerCandidateBrief = sequelize.define(
  'CareerCandidateBrief',
  {
    opportunityId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    shareCode: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM(...CAREER_CANDIDATE_BRIEF_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CAREER_CANDIDATE_BRIEF_STATUSES] },
    },
    summary: { type: DataTypes.TEXT, allowNull: true },
    strengths: { type: jsonType, allowNull: true },
    collaborationNotes: { type: DataTypes.TEXT, allowNull: true },
    recipients: { type: jsonType, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    lastSharedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'career_candidate_briefs',
    indexes: [
      { fields: ['userId'], name: 'career_candidate_briefs_user_idx' },
      { fields: ['opportunityId'], name: 'career_candidate_briefs_opportunity_idx' },
      { fields: ['status'], name: 'career_candidate_briefs_status_idx' },
    ],
  },
);

export const CareerInterviewWorkspace = sequelize.define(
  'CareerInterviewWorkspace',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    opportunityId: { type: DataTypes.INTEGER, allowNull: false },
    interviewScheduleId: { type: DataTypes.INTEGER, allowNull: true },
    calendarEventId: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...CAREER_INTERVIEW_WORKSPACE_STATUSES),
      allowNull: false,
      defaultValue: 'planning',
      validate: { isIn: [CAREER_INTERVIEW_WORKSPACE_STATUSES] },
    },
    roomUrl: { type: DataTypes.STRING(255), allowNull: true },
    prepChecklist: { type: jsonType, allowNull: true },
    aiPrompts: { type: jsonType, allowNull: true },
    resources: { type: jsonType, allowNull: true },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_interview_workspaces',
    indexes: [
      { fields: ['userId'], name: 'career_interview_workspaces_user_idx' },
      { fields: ['opportunityId'], name: 'career_interview_workspaces_opportunity_idx' },
      { fields: ['status'], name: 'career_interview_workspaces_status_idx' },
    ],
  },
);

export const CareerInterviewTask = sequelize.define(
  'CareerInterviewTask',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...CAREER_INTERVIEW_TASK_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [CAREER_INTERVIEW_TASK_STATUSES] },
    },
    priority: {
      type: DataTypes.ENUM(...CAREER_INTERVIEW_TASK_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [CAREER_INTERVIEW_TASK_PRIORITIES] },
    },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_interview_tasks',
    indexes: [
      { fields: ['workspaceId'], name: 'career_interview_tasks_workspace_idx' },
      { fields: ['status'], name: 'career_interview_tasks_status_idx' },
      { fields: ['dueAt'], name: 'career_interview_tasks_due_idx' },
    ],
  },
);

export const PartnerAgreement = sequelize.define(
  'PartnerAgreement',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    partnerName: { type: DataTypes.STRING(255), allowNull: false },
    partnerType: { type: DataTypes.STRING(120), allowNull: false },
    agreementType: { type: DataTypes.STRING(160), allowNull: false },
    status: {
      type: DataTypes.ENUM(...PARTNER_AGREEMENT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    complianceStatus: {
      type: DataTypes.ENUM(...PARTNER_COMPLIANCE_STATUSES),
      allowNull: false,
      defaultValue: 'green',
    },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    renewalDate: { type: DataTypes.DATEONLY, allowNull: true },
    terminationNoticeDue: { type: DataTypes.DATEONLY, allowNull: true },
    lastAuditAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'partner_agreements',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['partnerType'] },
      { fields: ['status'] },
      { fields: ['renewalDate'] },
    ],
  },
);

export const PartnerCommission = sequelize.define(
  'PartnerCommission',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    agreementId: { type: DataTypes.INTEGER, allowNull: true },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    partnerName: { type: DataTypes.STRING(255), allowNull: false },
    partnerType: { type: DataTypes.STRING(120), allowNull: false },
    commissionAmountCents: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...PARTNER_COMMISSION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    invoiceNumber: { type: DataTypes.STRING(80), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'partner_commissions',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['partnerType'] },
      { fields: ['status'] },
      { fields: ['dueDate'] },
    ],
  },
);

export const PartnerSlaSnapshot = sequelize.define(
  'PartnerSlaSnapshot',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    partnerName: { type: DataTypes.STRING(255), allowNull: false },
    partnerType: { type: DataTypes.STRING(120), allowNull: false },
    reportingPeriodStart: { type: DataTypes.DATEONLY, allowNull: false },
    reportingPeriodEnd: { type: DataTypes.DATEONLY, allowNull: false },
    submissionToInterviewHours: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    interviewToOfferHours: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    fillRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    complianceScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    escalations: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'partner_sla_snapshots',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['partnerType'] },
      { fields: ['reportingPeriodStart'] },
    ],
  },
);

export const PartnerCollaborationEvent = sequelize.define(
  'PartnerCollaborationEvent',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    partnerName: { type: DataTypes.STRING(255), allowNull: false },
    partnerType: { type: DataTypes.STRING(120), allowNull: false },
    eventType: {
      type: DataTypes.ENUM(...PARTNER_COLLABORATION_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'message',
    },
    threadId: { type: DataTypes.INTEGER, allowNull: true },
    referenceId: { type: DataTypes.STRING(160), allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    actorName: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'partner_collaboration_events',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['partnerType'] },
      { fields: ['eventType'] },
      { fields: ['occurredAt'] },
    ],
  },
);

export const EmployerBrandSection = sequelize.define(
  'EmployerBrandSection',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    sectionType: {
      type: DataTypes.ENUM(...EMPLOYER_BRAND_SECTION_TYPES),
      allowNull: false,
      defaultValue: 'custom',
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    mediaUrl: { type: DataTypes.STRING(500), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: {
      type: DataTypes.ENUM(...EMPLOYER_BRAND_SECTION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    metadata: { type: jsonType, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'employer_brand_sections',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['sectionType'] },
      { fields: ['status'] },
      { fields: ['isFeatured'] },
    ],
  },
);

export const ProspectIntelligenceProfile = sequelize.define(
  'ProspectIntelligenceProfile',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    aggregatedAt: { type: DataTypes.DATE, allowNull: true },
    primaryDiscipline: { type: DataTypes.STRING(255), allowNull: true },
    seniorityLevel: { type: DataTypes.STRING(120), allowNull: true },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    motivators: { type: jsonType, allowNull: true },
    inflectionPoints: { type: jsonType, allowNull: true },
    aiHighlights: { type: jsonType, allowNull: true },
    socialGraph: { type: jsonType, allowNull: true },
    patents: { type: jsonType, allowNull: true },
    publications: { type: jsonType, allowNull: true },
    compensationTargetMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationTargetMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationCurrency: { type: DataTypes.STRING(3), allowNull: true, defaultValue: 'USD' },
    relocationReadiness: { type: DataTypes.ENUM(...PROSPECT_RELOCATION_STATUSES), allowNull: true },
    exclusivityConflict: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    exclusivityNotes: { type: DataTypes.TEXT, allowNull: true },
    availabilityStatus: { type: DataTypes.STRING(120), allowNull: true },
    signalsSummary: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'prospect_intelligence_profiles',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['candidateId'] },
      { fields: ['seniorityLevel'] },
      { fields: ['relocationReadiness'] },
    ],
  },
);

export const ProspectIntelligenceSignal = sequelize.define(
  'ProspectIntelligenceSignal',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    signalType: { type: DataTypes.STRING(255), allowNull: false },
    intentLevel: { type: DataTypes.ENUM(...PROSPECT_SIGNAL_INTENT_LEVELS), allowNull: false, defaultValue: 'medium' },
    summary: { type: DataTypes.STRING(500), allowNull: false },
    source: { type: DataTypes.STRING(255), allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false },
    payload: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'prospect_intelligence_signals',
    indexes: [
      { fields: ['workspaceId', 'occurredAt'] },
      { fields: ['profileId'] },
      { fields: ['intentLevel'] },
    ],
  },
);

export const ProspectSearchDefinition = sequelize.define(
  'ProspectSearchDefinition',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    filters: { type: jsonType, allowNull: true },
    skills: { type: jsonType, allowNull: true },
    seniorityRange: { type: DataTypes.STRING(120), allowNull: true },
    diversityFocus: { type: jsonType, allowNull: true },
    cultureDrivers: { type: jsonType, allowNull: true },
    industryTargets: { type: jsonType, allowNull: true },
    isAlertEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    alertCadence: { type: DataTypes.ENUM(...PROSPECT_SEARCH_ALERT_CADENCES), allowNull: true },
    lastRunAt: { type: DataTypes.DATE, allowNull: true },
    resultsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'prospect_search_definitions',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['workspaceId', 'isAlertEnabled'] },
      { fields: ['createdById'] },
    ],
  },
);

export const ProspectSearchAlert = sequelize.define(
  'ProspectSearchAlert',
  {
    searchId: { type: DataTypes.INTEGER, allowNull: false },
    channel: { type: DataTypes.ENUM(...PROSPECT_SEARCH_ALERT_CHANNELS), allowNull: false, defaultValue: 'email' },
    status: { type: DataTypes.ENUM(...PROSPECT_SEARCH_ALERT_STATUSES), allowNull: false, defaultValue: 'active' },
    target: { type: DataTypes.STRING(255), allowNull: true },
    lastTriggeredAt: { type: DataTypes.DATE, allowNull: true },
    nextRunAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'prospect_search_alerts',
    indexes: [
      { fields: ['searchId'] },
      { fields: ['status'] },
    ],
  },
);

export const ProspectCampaign = sequelize.define(
  'ProspectCampaign',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    persona: { type: DataTypes.STRING(255), allowNull: true },
    goal: { type: DataTypes.STRING(255), allowNull: true },
    aiBrief: { type: DataTypes.TEXT, allowNull: true },
    channelMix: { type: jsonType, allowNull: true },
    launchDate: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM(...PROSPECT_CAMPAIGN_STATUSES), allowNull: false, defaultValue: 'draft' },
    responseRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    meetingsBooked: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    conversionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'prospect_campaigns',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['workspaceId', 'status'] },
      { fields: ['launchDate'] },
    ],
  },
);

export const ProspectCampaignStep = sequelize.define(
  'ProspectCampaignStep',
  {
    campaignId: { type: DataTypes.INTEGER, allowNull: false },
    stepOrder: { type: DataTypes.INTEGER, allowNull: false },
    channel: { type: DataTypes.STRING(120), allowNull: false },
    templateSubject: { type: DataTypes.STRING(255), allowNull: true },
    templateBody: { type: DataTypes.TEXT, allowNull: true },
    sendOffsetHours: { type: DataTypes.INTEGER, allowNull: true },
    waitForReplyHours: { type: DataTypes.INTEGER, allowNull: true },
    aiVariant: { type: DataTypes.STRING(120), allowNull: true },
    abTestGroup: { type: DataTypes.ENUM(...PROSPECT_CAMPAIGN_AB_TEST_GROUPS), allowNull: true },
    performance: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'prospect_campaign_steps',
    indexes: [
      { fields: ['campaignId'] },
      { fields: ['campaignId', 'abTestGroup'] },
    ],
  },
);

export const ProspectResearchNote = sequelize.define(
  'ProspectResearchNote',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    profileId: { type: DataTypes.INTEGER, allowNull: true },
    authorId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    visibility: { type: DataTypes.ENUM(...PROSPECT_NOTE_VISIBILITIES), allowNull: false, defaultValue: 'workspace' },
    isComplianceEvent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    tags: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'prospect_research_notes',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['profileId'] },
      { fields: ['authorId'] },
      { fields: ['visibility'] },
    ],
  },
);

export const ProspectResearchTask = sequelize.define(
  'ProspectResearchTask',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    profileId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...PROSPECT_TASK_STATUSES), allowNull: false, defaultValue: 'open' },
    priority: { type: DataTypes.ENUM(...PROSPECT_TASK_PRIORITIES), allowNull: false, defaultValue: 'medium' },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    assigneeId: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'prospect_research_tasks',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['workspaceId', 'status'] },
      { fields: ['assigneeId'] },
      { fields: ['priority'] },
    ],
  },
);

export const EmployerBrandCampaign = sequelize.define(
  'EmployerBrandCampaign',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    channel: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM(...EMPLOYER_BRAND_CAMPAIGN_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    startsAt: { type: DataTypes.DATE, allowNull: true },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    spendAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    impressions: { type: DataTypes.INTEGER, allowNull: true },
    clicks: { type: DataTypes.INTEGER, allowNull: true },
    applications: { type: DataTypes.INTEGER, allowNull: true },
    hires: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'employer_brand_campaigns',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['channel'] },
      { fields: ['status'] },
      { fields: ['startsAt'] },
    ],
  },
);

export const WorkforceAnalyticsSnapshot = sequelize.define(
  'WorkforceAnalyticsSnapshot',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    capturedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    attritionRiskScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    mobilityOpportunities: { type: DataTypes.INTEGER, allowNull: true },
    skillGapAlerts: { type: DataTypes.INTEGER, allowNull: true },
    headcountPlan: { type: DataTypes.INTEGER, allowNull: true },
    headcountActual: { type: DataTypes.INTEGER, allowNull: true },
    budgetPlanned: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetActual: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workforce_analytics_snapshots',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['capturedAt'] },
    ],
  },
);

export const WorkforceCohortMetric = sequelize.define(
  'WorkforceCohortMetric',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    cohortType: {
      type: DataTypes.ENUM(...WORKFORCE_COHORT_TYPES),
      allowNull: false,
      defaultValue: 'department',
    },
    cohortValue: { type: DataTypes.STRING(255), allowNull: false },
    retentionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    performanceIndex: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    promotionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    headcount: { type: DataTypes.INTEGER, allowNull: true },
    periodStart: { type: DataTypes.DATE, allowNull: true },
    periodEnd: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workforce_cohort_metrics',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['cohortType'] },
      { fields: ['periodStart'] },
    ],
  },
);

export const InternalJobPosting = sequelize.define(
  'InternalJobPosting',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    department: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM(...INTERNAL_JOB_POSTING_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    postedAt: { type: DataTypes.DATE, allowNull: true },
    internalApplications: { type: DataTypes.INTEGER, allowNull: true },
    internalHires: { type: DataTypes.INTEGER, allowNull: true },
    referralApplications: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'internal_job_postings',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['postedAt'] },
    ],
  },
);

export const EmployeeReferral = sequelize.define(
  'EmployeeReferral',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    referrerId: { type: DataTypes.INTEGER, allowNull: false },
    referredEmail: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM(...EMPLOYEE_REFERRAL_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    rewardPoints: { type: DataTypes.INTEGER, allowNull: true },
    rewardAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    stage: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    convertedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'employee_referrals',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['referrerId'] },
      { fields: ['status'] },
    ],
  },
);

export const CareerPathingPlan = sequelize.define(
  'CareerPathingPlan',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...CAREER_PATHING_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    currentRole: { type: DataTypes.STRING(255), allowNull: true },
    targetRole: { type: DataTypes.STRING(255), allowNull: true },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    recommendedLearningPaths: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_pathing_plans',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['employeeId'] },
      { fields: ['status'] },
    ],
  },
);

export const CompliancePolicy = sequelize.define(
  'CompliancePolicy',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    policyArea: { type: DataTypes.STRING(120), allowNull: false },
    region: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...COMPLIANCE_POLICY_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    version: { type: DataTypes.STRING(60), allowNull: true },
    lastReviewedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'compliance_policies',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['policyArea'] },
      { fields: ['region'] },
      { fields: ['status'] },
    ],
  },
);

export const ComplianceAuditLog = sequelize.define(
  'ComplianceAuditLog',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    auditType: { type: DataTypes.STRING(120), allowNull: false },
    region: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...COMPLIANCE_AUDIT_STATUSES),
      allowNull: false,
      defaultValue: 'open',
    },
    escalationLevel: { type: DataTypes.STRING(120), allowNull: true },
    openedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    closedAt: { type: DataTypes.DATE, allowNull: true },
    findingsCount: { type: DataTypes.INTEGER, allowNull: true },
    severityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'compliance_audit_logs',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['auditType'] },
      { fields: ['status'] },
      { fields: ['openedAt'] },
    ],
  },
);

export const AccessibilityAudit = sequelize.define(
  'AccessibilityAudit',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    area: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...ACCESSIBILITY_AUDIT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    issuesOpen: { type: DataTypes.INTEGER, allowNull: true },
    issuesResolved: { type: DataTypes.INTEGER, allowNull: true },
    lastRunAt: { type: DataTypes.DATE, allowNull: true },
    recommendations: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'accessibility_audits',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['lastRunAt'] },
    ],
  },
);

export const CareerInterviewScorecard = sequelize.define(
  'CareerInterviewScorecard',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    interviewerId: { type: DataTypes.INTEGER, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    overallScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    competencies: { type: jsonType, allowNull: true },
    strengths: { type: jsonType, allowNull: true },
    concerns: { type: jsonType, allowNull: true },
    recommendation: {
      type: DataTypes.ENUM(...CAREER_INTERVIEW_RECOMMENDATIONS),
      allowNull: false,
      defaultValue: 'hold',
      validate: { isIn: [CAREER_INTERVIEW_RECOMMENDATIONS] },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'career_interview_scorecards',
    indexes: [
      { fields: ['workspaceId'], name: 'career_interview_scorecards_workspace_idx' },
      { fields: ['interviewerId'], name: 'career_interview_scorecards_interviewer_idx' },
    ],
  },
);

export const CareerOfferPackage = sequelize.define(
  'CareerOfferPackage',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    opportunityId: { type: DataTypes.INTEGER, allowNull: true },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...CAREER_OFFER_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CAREER_OFFER_STATUSES] },
    },
    decisionStatus: {
      type: DataTypes.ENUM(...CAREER_OFFER_DECISIONS),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [CAREER_OFFER_DECISIONS] },
    },
    totalCompValue: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    baseSalary: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    bonusTarget: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    equityValue: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    benefitsValue: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    scenarioModel: { type: jsonType, allowNull: true },
    legalArchiveUrl: { type: DataTypes.STRING(255), allowNull: true },
    documentsSummary: { type: jsonType, allowNull: true },
    decisionDeadline: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_offer_packages',
    indexes: [
      { fields: ['userId'], name: 'career_offer_packages_user_idx' },
      { fields: ['status'], name: 'career_offer_packages_status_idx' },
      { fields: ['decisionStatus'], name: 'career_offer_packages_decision_idx' },
    ],
  },
);

export const CareerOfferScenario = sequelize.define(
  'CareerOfferScenario',
  {
    packageId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    baseSalary: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    equityValue: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    bonusValue: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    benefitsValue: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    totalValue: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    assumptions: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'career_offer_scenarios',
    indexes: [{ fields: ['packageId'], name: 'career_offer_scenarios_package_idx' }],
  },
);

export const CareerOfferDocument = sequelize.define(
  'CareerOfferDocument',
  {
    packageId: { type: DataTypes.INTEGER, allowNull: false },
    fileName: { type: DataTypes.STRING(200), allowNull: false },
    fileUrl: { type: DataTypes.STRING(500), allowNull: false },
    version: { type: DataTypes.STRING(40), allowNull: true },
    isSigned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    signedAt: { type: DataTypes.DATE, allowNull: true },
    storedAt: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_offer_documents',
    indexes: [{ fields: ['packageId'], name: 'career_offer_documents_package_idx' }],
  },
);

export const CareerAutoApplyRule = sequelize.define(
  'CareerAutoApplyRule',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...CAREER_AUTO_APPLY_RULE_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CAREER_AUTO_APPLY_RULE_STATUSES] },
    },
    criteria: { type: jsonType, allowNull: true },
    guardrailConfig: { type: jsonType, allowNull: true },
    requiresManualReview: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    autoSendEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sandboxMode: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    premiumRoleGuardrail: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastExecutedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_auto_apply_rules',
    indexes: [
      { fields: ['userId'], name: 'career_auto_apply_rules_user_idx' },
      { fields: ['status'], name: 'career_auto_apply_rules_status_idx' },
      { fields: ['sandboxMode'], name: 'career_auto_apply_rules_sandbox_idx' },
    ],
  },
);

export const CareerAutoApplyTestRun = sequelize.define(
  'CareerAutoApplyTestRun',
  {
    ruleId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...CAREER_AUTO_APPLY_TEST_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [CAREER_AUTO_APPLY_TEST_STATUSES] },
    },
    executedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    evaluatedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    matchesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    autoSentCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    rejectionReasons: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    sampleSubmission: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_auto_apply_test_runs',
    indexes: [{ fields: ['ruleId'], name: 'career_auto_apply_test_runs_rule_idx' }],
  },
);

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
  },
  { tableName: 'agency_rate_card_items' },
);

AgencyRateCardItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    rateCardId: plain.rateCardId,
    name: plain.name,
    description: plain.description,
    unitType: plain.unitType,
    unitAmount: plain.unitAmount,
    unitPrice: plain.unitPrice == null ? null : Number(plain.unitPrice),
    currency: plain.currency,
    leadTimeDays: plain.leadTimeDays,
    minCommitment: plain.minCommitment,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CareerAutoApplyAnalytics = sequelize.define(
  'CareerAutoApplyAnalytics',
  {
    ruleId: { type: DataTypes.INTEGER, allowNull: false },
    windowStart: { type: DataTypes.DATE, allowNull: false },
    windowEnd: { type: DataTypes.DATE, allowNull: false },
    submissions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    conversions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    rejections: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    manualReviews: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    rejectionReasons: { type: jsonType, allowNull: true },
    conversionSignals: { type: jsonType, allowNull: true },
    lastUpdatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'career_auto_apply_analytics',
    indexes: [
      { fields: ['ruleId'], name: 'career_auto_apply_analytics_rule_idx' },
      { fields: ['windowStart', 'windowEnd'], name: 'career_auto_apply_analytics_window_idx' },
    ],
  },
);

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

export const InterviewPanelTemplate = sequelize.define(
  'InterviewPanelTemplate',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    roleName: { type: DataTypes.STRING(180), allowNull: false },
    stage: { type: DataTypes.STRING(120), allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 45 },
    competencies: { type: jsonType, allowNull: false, defaultValue: [] },
    rubric: { type: jsonType, allowNull: false, defaultValue: [] },
    instructions: { type: DataTypes.TEXT, allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    lastUpdatedBy: { type: DataTypes.INTEGER, allowNull: true },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'interview_panel_templates',
    indexes: [
      { fields: ['workspaceId', 'roleName'] },
      { fields: ['workspaceId', 'stage'] },
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

export const InterviewerAvailability = sequelize.define(
  'InterviewerAvailability',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    interviewerId: { type: DataTypes.INTEGER, allowNull: true },
    interviewerName: { type: DataTypes.STRING(255), allowNull: true },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    availableFrom: { type: DataTypes.DATE, allowNull: false },
    availableTo: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'available' },
    capacityHours: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'interviewer_availabilities',
    indexes: [{ fields: ['workspaceId', 'availableFrom'] }],
  },
);

export const InterviewReminder = sequelize.define(
  'InterviewReminder',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    interviewScheduleId: { type: DataTypes.INTEGER, allowNull: false },
    reminderType: { type: DataTypes.STRING(60), allowNull: false },
    sentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deliveryStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'sent' },
    channel: { type: DataTypes.STRING(60), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'interview_reminders',
    indexes: [{ fields: ['workspaceId', 'sentAt'] }],
  },
);

export const CandidatePrepPortal = sequelize.define(
  'CandidatePrepPortal',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    candidateName: { type: DataTypes.STRING(255), allowNull: false },
    candidateEmail: { type: DataTypes.STRING(255), allowNull: true },
    stage: { type: DataTypes.STRING(120), allowNull: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'active' },
    accessCode: { type: DataTypes.STRING(120), allowNull: true },
    resources: { type: jsonType, allowNull: true },
    forms: { type: jsonType, allowNull: true },
    visitCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    resourceViews: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    resourceTotal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    formsCompleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    formsRequired: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ndaRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ndaStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'not_sent' },
    ndaSignedAt: { type: DataTypes.DATE, allowNull: true },
    lastAccessedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    nextActionAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'candidate_prep_portals',
    indexes: [{ fields: ['workspaceId', 'status'] }],
  },
);

export const InterviewEvaluation = sequelize.define(
  'InterviewEvaluation',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    interviewScheduleId: { type: DataTypes.INTEGER, allowNull: true },
    templateId: { type: DataTypes.INTEGER, allowNull: true },
    interviewerId: { type: DataTypes.INTEGER, allowNull: true },
    interviewerName: { type: DataTypes.STRING(255), allowNull: true },
    stage: { type: DataTypes.STRING(120), allowNull: false },
    overallRecommendation: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'pending' },
    overallScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    rubricScores: { type: jsonType, allowNull: true },
    strengths: { type: DataTypes.TEXT, allowNull: true },
    risks: { type: DataTypes.TEXT, allowNull: true },
    anonymized: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    biasFlags: { type: jsonType, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'interview_evaluations',
    indexes: [
      { fields: ['workspaceId', 'stage'] },
      { fields: ['workspaceId', 'submittedAt'] },
    ],
  },
);

export const EvaluationCalibrationSession = sequelize.define(
  'EvaluationCalibrationSession',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    roleName: { type: DataTypes.STRING(180), allowNull: false },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    alignmentScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    participants: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'evaluation_calibration_sessions',
    indexes: [{ fields: ['workspaceId', 'scheduledAt'] }],
  },
);

export const DecisionTracker = sequelize.define(
  'DecisionTracker',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    candidateName: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'in_review' },
    decision: { type: DataTypes.STRING(40), allowNull: true },
    rationale: { type: DataTypes.TEXT, allowNull: true },
    packageDetails: { type: jsonType, allowNull: true },
    approvals: { type: jsonType, allowNull: true },
    openedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    decidedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'decision_trackers',
    indexes: [{ fields: ['workspaceId', 'status'] }],
  },
);

export const OfferPackage = sequelize.define(
  'OfferPackage',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    candidateName: { type: DataTypes.STRING(255), allowNull: true },
    roleName: { type: DataTypes.STRING(180), allowNull: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'draft' },
    approvalStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'pending' },
    digitalSignatureStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'not_sent' },
    backgroundCheckStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'not_started' },
    packageValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'USD' },
    startDate: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'offer_packages',
    indexes: [{ fields: ['workspaceId', 'status'] }],
  },
);

export const OnboardingTask = sequelize.define(
  'OnboardingTask',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    category: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'general' },
    title: { type: DataTypes.STRING(255), allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    ownerName: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'not_started' },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'onboarding_tasks',
    indexes: [{ fields: ['workspaceId', 'status'] }],
  },
);

export const CandidateCareTicket = sequelize.define(
  'CandidateCareTicket',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    candidateName: { type: DataTypes.STRING(255), allowNull: true },
    type: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'support' },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'open' },
    priority: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'medium' },
    inclusionCategory: { type: DataTypes.STRING(120), allowNull: true },
    openedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    firstRespondedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    escalatedAt: { type: DataTypes.DATE, allowNull: true },
    npsImpact: { type: DataTypes.INTEGER, allowNull: true },
    followUpDueAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'candidate_care_tickets',
    indexes: [
      { fields: ['workspaceId', 'status'] },
      { fields: ['workspaceId', 'openedAt'] },
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

export const HeadhunterInvite = sequelize.define(
  'HeadhunterInvite',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    headhunterWorkspaceId: { type: DataTypes.INTEGER, allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...HEADHUNTER_INVITE_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    invitedById: { type: DataTypes.INTEGER, allowNull: true },
    sentAt: { type: DataTypes.DATE, allowNull: false },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'headhunter_invites',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['headhunterWorkspaceId'] },
      { fields: ['status'] },
    ],
  },
);

export const HeadhunterBrief = sequelize.define(
  'HeadhunterBrief',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    roleFocus: { type: DataTypes.STRING(180), allowNull: true },
    location: { type: DataTypes.STRING(180), allowNull: true },
    openings: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    feePercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM(...HEADHUNTER_BRIEF_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    sharedAt: { type: DataTypes.DATE, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    filledAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'headhunter_briefs',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['dueAt'] },
    ],
  },
);

HeadhunterBrief.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    feePercentage: plain.feePercentage != null ? Number.parseFloat(plain.feePercentage) : null,
  };
};

export const HeadhunterBriefAssignment = sequelize.define(
  'HeadhunterBriefAssignment',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    briefId: { type: DataTypes.INTEGER, allowNull: false },
    headhunterWorkspaceId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...HEADHUNTER_ASSIGNMENT_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
    },
    submittedCandidates: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    placements: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    responseTimeHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    placedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'headhunter_brief_assignments',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['briefId'] },
      { fields: ['headhunterWorkspaceId'] },
      { fields: ['status'] },
    ],
  },
);

HeadhunterBriefAssignment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    responseTimeHours: plain.responseTimeHours != null ? Number.parseFloat(plain.responseTimeHours) : null,
  };
};

export const HeadhunterPerformanceSnapshot = sequelize.define(
  'HeadhunterPerformanceSnapshot',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    headhunterWorkspaceId: { type: DataTypes.INTEGER, allowNull: true },
    headhunterName: { type: DataTypes.STRING(255), allowNull: true },
    responseRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    averageTimeToSubmitHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    placements: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    interviews: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    qualityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    activeBriefs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    pipelineValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    pipelineCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    lastSubmissionAt: { type: DataTypes.DATE, allowNull: true },
    periodStart: { type: DataTypes.DATE, allowNull: true },
    periodEnd: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'headhunter_performance_snapshots',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['headhunterWorkspaceId'] },
      { fields: ['periodEnd'] },
    ],
  },
);

HeadhunterPerformanceSnapshot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    responseRate: plain.responseRate != null ? Number.parseFloat(plain.responseRate) : null,
    averageTimeToSubmitHours:
      plain.averageTimeToSubmitHours != null ? Number.parseFloat(plain.averageTimeToSubmitHours) : null,
    qualityScore: plain.qualityScore != null ? Number.parseFloat(plain.qualityScore) : null,
    pipelineValue: plain.pipelineValue != null ? Number.parseFloat(plain.pipelineValue) : null,
  };
};

export const HeadhunterCommission = sequelize.define(
  'HeadhunterCommission',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    headhunterWorkspaceId: { type: DataTypes.INTEGER, allowNull: true },
    headhunterName: { type: DataTypes.STRING(255), allowNull: true },
    candidateName: { type: DataTypes.STRING(255), allowNull: true },
    briefId: { type: DataTypes.INTEGER, allowNull: true },
    invoiceNumber: { type: DataTypes.STRING(120), allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...HEADHUNTER_COMMISSION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'headhunter_commissions',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['headhunterWorkspaceId'] },
      { fields: ['status'] },
      { fields: ['dueAt'] },
    ],
  },
);

HeadhunterCommission.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    amount: plain.amount != null ? Number.parseFloat(plain.amount) : 0,
  };
};

export const TalentPool = sequelize.define(
  'TalentPool',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(180), allowNull: false },
    poolType: {
      type: DataTypes.ENUM(...TALENT_POOL_TYPES),
      allowNull: false,
      defaultValue: 'silver_medalist',
    },
    status: {
      type: DataTypes.ENUM(...TALENT_POOL_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    candidateCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    activeCandidates: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    hiresCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastEngagedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'talent_pools',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['poolType'] },
      { fields: ['status'] },
    ],
  },
);

export const TalentPoolMember = sequelize.define(
  'TalentPoolMember',
  {
    poolId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    profileId: { type: DataTypes.INTEGER, allowNull: true },
    candidateName: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM(...TALENT_POOL_MEMBER_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    sourceType: {
      type: DataTypes.ENUM(...TALENT_POOL_MEMBER_SOURCE_TYPES),
      allowNull: false,
      defaultValue: 'silver_medalist',
    },
    stage: { type: DataTypes.STRING(120), allowNull: true },
    lastInteractionAt: { type: DataTypes.DATE, allowNull: true },
    nextActionAt: { type: DataTypes.DATE, allowNull: true },
    joinedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    tags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'talent_pool_members',
    indexes: [
      { fields: ['poolId'] },
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['sourceType'] },
      { fields: ['nextActionAt'] },
    ],
  },
);

export const TalentPoolEngagement = sequelize.define(
  'TalentPoolEngagement',
  {
    poolId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    performedById: { type: DataTypes.INTEGER, allowNull: true },
    interactionType: {
      type: DataTypes.ENUM(...TALENT_POOL_ENGAGEMENT_TYPES),
      allowNull: false,
      defaultValue: 'update',
    },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    summary: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'talent_pool_engagements',
    indexes: [
      { fields: ['poolId'] },
      { fields: ['workspaceId'] },
      { fields: ['occurredAt'] },
    ],
  },
);

export const AgencySlaSnapshot = sequelize.define(
  'AgencySlaSnapshot',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    agencyCollaborationId: { type: DataTypes.INTEGER, allowNull: false },
    periodStart: { type: DataTypes.DATE, allowNull: false },
    periodEnd: { type: DataTypes.DATE, allowNull: false },
    onTimeDeliveryRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    responseTimeHoursAvg: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    breachCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    escalationsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_sla_snapshots',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['agencyCollaborationId'] },
      { fields: ['periodEnd'] },
    ],
  },
);

AgencySlaSnapshot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    onTimeDeliveryRate: plain.onTimeDeliveryRate != null ? Number.parseFloat(plain.onTimeDeliveryRate) : null,
    responseTimeHoursAvg: plain.responseTimeHoursAvg != null ? Number.parseFloat(plain.responseTimeHoursAvg) : null,
  };
};

export const AgencyBillingEvent = sequelize.define(
  'AgencyBillingEvent',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    agencyCollaborationId: { type: DataTypes.INTEGER, allowNull: true },
    invoiceNumber: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...AGENCY_BILLING_STATUSES),
      allowNull: false,
      defaultValue: 'sent',
    },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    issuedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_billing_events',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['agencyCollaborationId'] },
      { fields: ['status'] },
      { fields: ['dueAt'] },
    ],
  },
);

AgencyBillingEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    amount: plain.amount != null ? Number.parseFloat(plain.amount) : 0,
  };
};

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

export const AgencyCalendarEvent = sequelize.define(
  'AgencyCalendarEvent',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    createdById: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    eventType: {
      type: DataTypes.ENUM(...AGENCY_CALENDAR_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'project',
    },
    status: {
      type: DataTypes.ENUM(...AGENCY_CALENDAR_EVENT_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
    },
    visibility: {
      type: DataTypes.ENUM(...AGENCY_CALENDAR_EVENT_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
    },
    relatedEntityType: { type: DataTypes.STRING(120), allowNull: true },
    relatedEntityId: { type: DataTypes.INTEGER, allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    meetingUrl: { type: DataTypes.STRING(500), allowNull: true },
    coverImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    guestEmails: { type: jsonType, allowNull: true },
    reminderOffsets: { type: jsonType, allowNull: true },
    isAllDay: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    startsAt: { type: DataTypes.DATE, allowNull: false },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_calendar_events',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['eventType'] },
      { fields: ['status'] },
      { fields: ['startsAt'] },
    ],
  },
);

AgencyCalendarEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });

  return {
    ...plain,
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    guestEmails: Array.isArray(plain.guestEmails)
      ? plain.guestEmails.map((email) => (email == null ? null : String(email))).filter(Boolean)
      : [],
    reminderOffsets: Array.isArray(plain.reminderOffsets)
      ? plain.reminderOffsets
          .map((value) => {
            const numeric = Number.parseInt(value, 10);
            return Number.isFinite(numeric) ? numeric : null;
          })
          .filter((value) => value != null)
      : [],
  };
};

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

export const EmployerBrandStory = sequelize.define(
  'EmployerBrandStory',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    storyType: {
      type: DataTypes.ENUM(...EMPLOYER_BRAND_STORY_TYPES),
      allowNull: false,
      defaultValue: 'culture',
    },
    status: {
      type: DataTypes.ENUM(...EMPLOYER_BRAND_STORY_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    engagementScore: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    tags: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'employer_brand_stories',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['storyType'] },
    ],
  },
);

export const EmployerBenefit = sequelize.define(
  'EmployerBenefit',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    category: {
      type: DataTypes.ENUM(...EMPLOYER_BENEFIT_CATEGORIES),
      allowNull: false,
      defaultValue: 'culture',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    effectiveDate: { type: DataTypes.DATEONLY, allowNull: true },
    lastReviewedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'employer_benefits',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['category'] },
      { fields: ['isFeatured'] },
    ],
  },
);

export const EmployeeJourneyProgram = sequelize.define(
  'EmployeeJourneyProgram',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    programType: {
      type: DataTypes.ENUM(...EMPLOYEE_JOURNEY_PROGRAM_TYPES),
      allowNull: false,
      defaultValue: 'onboarding',
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    stageCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    activeEmployees: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    completionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    averageDurationDays: { type: DataTypes.INTEGER, allowNull: true },
    healthStatus: {
      type: DataTypes.ENUM(...EMPLOYEE_JOURNEY_HEALTH_STATUSES),
      allowNull: false,
      defaultValue: 'on_track',
    },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'employee_journey_programs',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['programType'] },
      { fields: ['healthStatus'] },
    ],
  },
);

export const WorkspaceIntegration = sequelize.define(
  'WorkspaceIntegration',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    providerKey: { type: DataTypes.STRING(120), allowNull: false },
    displayName: { type: DataTypes.STRING(255), allowNull: false },
    category: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_CATEGORIES),
      allowNull: false,
      defaultValue: 'other',
    },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    authType: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_AUTH_TYPES),
      allowNull: false,
      defaultValue: 'oauth',
    },
    environment: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_ENVIRONMENTS),
      allowNull: false,
      defaultValue: 'production',
    },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    syncFrequency: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_SYNC_FREQUENCIES),
      allowNull: false,
      defaultValue: 'daily',
    },
    connectedAt: { type: DataTypes.DATE, allowNull: true },
    nextSyncAt: { type: DataTypes.DATE, allowNull: true },
    lastSyncStatus: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_SYNC_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    metadata: { type: jsonType, allowNull: true },
    settings: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_integrations',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['providerKey'] },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['environment'] },
      { fields: ['lastSyncStatus'] },
    ],
  },
);

WorkspaceIntegration.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    providerKey: plain.providerKey,
    displayName: plain.displayName,
    category: plain.category,
    status: plain.status,
    authType: plain.authType,
    environment: plain.environment,
    lastSyncedAt: plain.lastSyncedAt ?? null,
    syncFrequency: plain.syncFrequency,
    connectedAt: plain.connectedAt ?? null,
    nextSyncAt: plain.nextSyncAt ?? null,
    lastSyncStatus: plain.lastSyncStatus,
    metadata: plain.metadata ?? null,
    settings: plain.settings ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WorkspaceIntegrationCredential = sequelize.define(
  'WorkspaceIntegrationCredential',
  {
    integrationId: { type: DataTypes.INTEGER, allowNull: false },
    credentialType: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_CREDENTIAL_TYPES),
      allowNull: false,
      defaultValue: 'api_key',
    },
    secretDigest: { type: DataTypes.STRING(128), allowNull: false },
    fingerprint: { type: DataTypes.STRING(64), allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    lastRotatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_integration_credentials',
    indexes: [
      { fields: ['integrationId'] },
      { fields: ['credentialType'] },
      { fields: ['fingerprint'] },
    ],
  },
);

WorkspaceIntegrationCredential.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    integrationId: plain.integrationId,
    credentialType: plain.credentialType,
    fingerprint: plain.fingerprint ?? null,
    expiresAt: plain.expiresAt ?? null,
    lastRotatedAt: plain.lastRotatedAt ?? null,
    createdById: plain.createdById ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WorkspaceIntegrationFieldMapping = sequelize.define(
  'WorkspaceIntegrationFieldMapping',
  {
    integrationId: { type: DataTypes.INTEGER, allowNull: false },
    externalObject: { type: DataTypes.STRING(80), allowNull: false },
    localObject: { type: DataTypes.STRING(80), allowNull: false },
    mapping: { type: jsonType, allowNull: false, defaultValue: {} },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'workspace_integration_field_mappings',
    indexes: [
      { fields: ['integrationId'] },
      { fields: ['externalObject'] },
    ],
  },
);

WorkspaceIntegrationFieldMapping.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    integrationId: plain.integrationId,
    externalObject: plain.externalObject,
    localObject: plain.localObject,
    mapping: plain.mapping ?? {},
    isActive: Boolean(plain.isActive),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WorkspaceIntegrationRoleAssignment = sequelize.define(
  'WorkspaceIntegrationRoleAssignment',
  {
    integrationId: { type: DataTypes.INTEGER, allowNull: false },
    roleKey: { type: DataTypes.STRING(60), allowNull: false },
    roleLabel: { type: DataTypes.STRING(120), allowNull: false },
    assigneeName: { type: DataTypes.STRING(120), allowNull: true },
    assigneeEmail: { type: DataTypes.STRING(160), allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    permissions: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_integration_role_assignments',
    indexes: [
      { fields: ['integrationId'] },
      { fields: ['roleKey'] },
      { fields: ['assigneeEmail'] },
    ],
  },
);

WorkspaceIntegrationRoleAssignment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    integrationId: plain.integrationId,
    roleKey: plain.roleKey,
    roleLabel: plain.roleLabel,
    assigneeName: plain.assigneeName ?? null,
    assigneeEmail: plain.assigneeEmail ?? null,
    userId: plain.userId ?? null,
    permissions: plain.permissions ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WorkspaceIntegrationSyncRun = sequelize.define(
  'WorkspaceIntegrationSyncRun',
  {
    integrationId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_SYNC_RUN_STATUSES),
      allowNull: false,
      defaultValue: 'queued',
    },
    trigger: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'manual' },
    triggeredById: { type: DataTypes.INTEGER, allowNull: true },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    finishedAt: { type: DataTypes.DATE, allowNull: true },
    recordsProcessed: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_integration_sync_runs',
    indexes: [
      { fields: ['integrationId'] },
      { fields: ['status'] },
      { fields: ['triggeredById'] },
    ],
  },
);

WorkspaceIntegrationSyncRun.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    integrationId: plain.integrationId,
    status: plain.status,
    trigger: plain.trigger,
    triggeredById: plain.triggeredById ?? null,
    startedAt: plain.startedAt ?? null,
    finishedAt: plain.finishedAt ?? null,
    recordsProcessed: plain.recordsProcessed ?? null,
    notes: plain.notes ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WorkspaceIntegrationIncident = sequelize.define(
  'WorkspaceIntegrationIncident',
  {
    integrationId: { type: DataTypes.INTEGER, allowNull: false },
    severity: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_INCIDENT_SEVERITIES),
      allowNull: false,
      defaultValue: 'low',
    },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_INCIDENT_STATUSES),
      allowNull: false,
      defaultValue: 'open',
    },
    summary: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    openedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_integration_incidents',
    indexes: [
      { fields: ['integrationId'] },
      { fields: ['status'] },
      { fields: ['severity'] },
    ],
  },
);

WorkspaceIntegrationIncident.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    integrationId: plain.integrationId,
    severity: plain.severity,
    status: plain.status,
    summary: plain.summary,
    description: plain.description ?? null,
    openedAt: plain.openedAt ?? null,
    resolvedAt: plain.resolvedAt ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const WorkspaceIntegrationAuditEvent = sequelize.define(
  'WorkspaceIntegrationAuditEvent',
  {
    integrationId: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.STRING(120), allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    actorName: { type: DataTypes.STRING(180), allowNull: true },
    details: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_integration_audit_events',
    indexes: [
      { fields: ['integrationId'] },
      { fields: ['action'] },
      { fields: ['createdAt'] },
    ],
  },
);

WorkspaceIntegrationAuditEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    integrationId: plain.integrationId,
    action: plain.action,
    actorId: plain.actorId ?? null,
    actorName: plain.actorName ?? null,
    details: plain.details ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};
export const WorkspaceIntegrationSecret = sequelize.define(
  'WorkspaceIntegrationSecret',
  {
    integrationId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    secretType: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_SECRET_TYPES),
      allowNull: false,
      defaultValue: 'api_key',
    },
    hashAlgorithm: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'pbkdf2_sha512' },
    hashedValue: { type: DataTypes.STRING(512), allowNull: false },
    salt: { type: DataTypes.STRING(128), allowNull: false },
    lastFour: { type: DataTypes.STRING(8), allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    lastRotatedAt: { type: DataTypes.DATE, allowNull: true },
    rotatedById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_integration_secrets',
    indexes: [
      { fields: ['integrationId'] },
      { fields: ['secretType'] },
      { fields: ['rotatedById'] },
    ],
  },
);

export const WorkspaceIntegrationWebhook = sequelize.define(
  'WorkspaceIntegrationWebhook',
  {
    integrationId: { type: DataTypes.INTEGER, allowNull: false },
    secretId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_WEBHOOK_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    targetUrl: { type: DataTypes.STRING(500), allowNull: false },
    eventTypes: { type: jsonType, allowNull: false, defaultValue: [] },
    verificationToken: { type: DataTypes.STRING(255), allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    lastTriggeredAt: { type: DataTypes.DATE, allowNull: true },
    lastErrorAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_integration_webhooks',
    indexes: [
      { fields: ['integrationId'] },
      { fields: ['status'] },
      { fields: ['createdById'] },
    ],
  },
);

export const WorkspaceIntegrationAuditLog = sequelize.define(
  'WorkspaceIntegrationAuditLog',
  {
    integrationId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    eventType: {
      type: DataTypes.ENUM(...WORKSPACE_INTEGRATION_AUDIT_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'integration_created',
    },
    summary: { type: DataTypes.STRING(255), allowNull: false },
    detail: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_integration_audit_logs',
    indexes: [
      { fields: ['integrationId'] },
      { fields: ['actorId'] },
      { fields: ['eventType'] },
    ],
  },
);

export const WorkspaceCalendarConnection = sequelize.define(
  'WorkspaceCalendarConnection',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    providerKey: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_CALENDAR_CONNECTION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    calendarCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    primaryCalendar: { type: DataTypes.STRING(255), allowNull: true },
    settings: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'workspace_calendar_connections',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['providerKey'] },
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
    description: { type: DataTypes.TEXT, allowNull: true },
    videoConferenceLink: { type: DataTypes.STRING(500), allowNull: true },
    isAllDay: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    reminderMinutes: { type: DataTypes.INTEGER, allowNull: true },
    visibility: {
      type: DataTypes.ENUM(...CALENDAR_EVENT_VISIBILITIES),
      allowNull: false,
      defaultValue: 'private',
    },
    relatedEntityType: { type: DataTypes.STRING(80), allowNull: true },
    relatedEntityId: { type: DataTypes.INTEGER, allowNull: true },
    colorHex: { type: DataTypes.STRING(9), allowNull: true },
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
    isAllDay: Boolean(plain.isAllDay),
    reminderMinutes: plain.reminderMinutes == null ? null : Number(plain.reminderMinutes),
    relatedEntityId:
      plain.relatedEntityId == null || Number.isNaN(Number(plain.relatedEntityId))
        ? null
        : Number(plain.relatedEntityId),
    metadata: plain.metadata ?? null,
  };
};

export const AdminCalendarAccount = sequelize.define(
  'AdminCalendarAccount',
  {
    provider: { type: DataTypes.STRING(80), allowNull: false },
    accountEmail: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    displayName: { type: DataTypes.STRING(120), allowNull: true },
    syncStatus: {
      type: DataTypes.ENUM(...ADMIN_CALENDAR_SYNC_STATUSES),
      allowNull: false,
      defaultValue: 'connected',
    },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    syncError: { type: DataTypes.TEXT, allowNull: true },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'admin_calendar_accounts',
    indexes: [
      { fields: ['provider'] },
      { fields: ['syncStatus'] },
    ],
  },
);

AdminCalendarAccount.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    metadata: plain.metadata ?? {},
  };
};

export const AdminCalendarTemplate = sequelize.define(
  'AdminCalendarTemplate',
  {
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    defaultEventType: {
      type: DataTypes.ENUM(...ADMIN_CALENDAR_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'ops_review',
    },
    defaultVisibility: {
      type: DataTypes.ENUM(...ADMIN_CALENDAR_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
    },
    defaultLocation: { type: DataTypes.STRING(255), allowNull: true },
    defaultMeetingUrl: { type: DataTypes.STRING(2048), allowNull: true },
    defaultAllowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
    reminderMinutes: { type: jsonType, allowNull: false, defaultValue: [] },
    instructions: { type: DataTypes.TEXT, allowNull: true },
    bannerImageUrl: { type: DataTypes.STRING(1024), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    createdBy: { type: DataTypes.STRING(120), allowNull: true },
    updatedBy: { type: DataTypes.STRING(120), allowNull: true },
  },
  {
    tableName: 'admin_calendar_templates',
    indexes: [
      { fields: ['isActive'] },
      { fields: ['defaultEventType'] },
    ],
  },
);

AdminCalendarTemplate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    defaultAllowedRoles: Array.isArray(plain.defaultAllowedRoles) ? plain.defaultAllowedRoles : [],
    reminderMinutes: Array.isArray(plain.reminderMinutes) ? plain.reminderMinutes : [],
    metadata: plain.metadata ?? {},
  };
};

export const AdminCalendarEvent = sequelize.define(
  'AdminCalendarEvent',
  {
    calendarAccountId: { type: DataTypes.INTEGER, allowNull: true },
    templateId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    eventType: {
      type: DataTypes.ENUM(...ADMIN_CALENDAR_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'ops_review',
    },
    status: {
      type: DataTypes.ENUM(...ADMIN_CALENDAR_EVENT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    visibility: {
      type: DataTypes.ENUM(...ADMIN_CALENDAR_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
    },
    meetingUrl: { type: DataTypes.STRING(2048), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    startsAt: { type: DataTypes.DATE, allowNull: false },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    invitees: { type: jsonType, allowNull: false, defaultValue: [] },
    attachments: { type: jsonType, allowNull: false, defaultValue: [] },
    allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
    coverImageUrl: { type: DataTypes.STRING(1024), allowNull: true },
    createdBy: { type: DataTypes.STRING(120), allowNull: true },
    updatedBy: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'admin_calendar_events',
    indexes: [
      { fields: ['startsAt'] },
      { fields: ['status'] },
      { fields: ['eventType'] },
    ],
  },
);

AdminCalendarEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    invitees: Array.isArray(plain.invitees) ? plain.invitees : [],
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    allowedRoles: Array.isArray(plain.allowedRoles) ? plain.allowedRoles : [],
    metadata: plain.metadata ?? {},
  };
};

export const AdminCalendarAvailabilityWindow = sequelize.define(
  'AdminCalendarAvailabilityWindow',
  {
    calendarAccountId: { type: DataTypes.INTEGER, allowNull: false },
    dayOfWeek: { type: DataTypes.INTEGER, allowNull: false },
    startTimeMinutes: { type: DataTypes.INTEGER, allowNull: false },
    endTimeMinutes: { type: DataTypes.INTEGER, allowNull: false },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'admin_calendar_availability_windows',
    indexes: [
      { fields: ['calendarAccountId'] },
      { fields: ['dayOfWeek'] },
    ],
  },
);

AdminCalendarAvailabilityWindow.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    metadata: plain.metadata ?? {},
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

export const UserCalendarSetting = sequelize.define(
  'UserCalendarSetting',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    timezone: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'UTC' },
    weekStart: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    workStartMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 480 },
    workEndMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1020 },
    defaultView: {
      type: DataTypes.ENUM(...CALENDAR_DEFAULT_VIEWS),
      allowNull: false,
      defaultValue: 'agenda',
    },
    defaultReminderMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
    autoFocusBlocks: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    shareAvailability: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    colorHex: { type: DataTypes.STRING(9), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'user_calendar_settings',
    indexes: [
      {
        unique: true,
        fields: ['userId'],
      },
    ],
  },
);

UserCalendarSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    timezone: plain.timezone ?? 'UTC',
    weekStart: plain.weekStart == null ? 1 : Number(plain.weekStart),
    workStartMinutes: plain.workStartMinutes == null ? 480 : Number(plain.workStartMinutes),
    workEndMinutes: plain.workEndMinutes == null ? 1020 : Number(plain.workEndMinutes),
    defaultView: plain.defaultView ?? 'agenda',
    defaultReminderMinutes:
      plain.defaultReminderMinutes == null ? 30 : Number(plain.defaultReminderMinutes),
    autoFocusBlocks: Boolean(plain.autoFocusBlocks),
    shareAvailability: Boolean(plain.shareAvailability),
    colorHex: plain.colorHex ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
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

export const UserSecurityPreference = sequelize.define(
  'UserSecurityPreference',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    sessionTimeoutMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
    biometricApprovalsEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deviceApprovalsEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'user_security_preferences' },
);

UserSecurityPreference.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    sessionTimeoutMinutes: Number.isFinite(plain.sessionTimeoutMinutes)
      ? Math.max(5, Math.min(plain.sessionTimeoutMinutes, 1440))
      : 30,
    biometricApprovalsEnabled: Boolean(plain.biometricApprovalsEnabled),
    deviceApprovalsEnabled: Boolean(plain.deviceApprovalsEnabled),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const DataExportRequest = sequelize.define(
  'DataExportRequest',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('queued', 'processing', 'ready', 'failed', 'expired'),
      allowNull: false,
      defaultValue: 'queued',
    },
    format: {
      type: DataTypes.ENUM('zip', 'json', 'csv', 'pdf'),
      allowNull: false,
      defaultValue: 'zip',
    },
    type: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'account_archive' },
    requestedAt: { type: DataTypes.DATE, allowNull: false },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    downloadUrl: { type: DataTypes.STRING(2048), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'data_export_requests' },
);

DataExportRequest.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    status: plain.status,
    format: plain.format,
    type: plain.type,
    requestedAt: plain.requestedAt,
    completedAt: plain.completedAt ?? null,
    expiresAt: plain.expiresAt ?? null,
    downloadUrl: plain.downloadUrl ?? null,
    notes: plain.notes ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const UserWebsitePreference = sequelize.define(
  'UserWebsitePreference',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    settings: { type: jsonType, allowNull: true },
    theme: { type: jsonType, allowNull: true },
    hero: { type: jsonType, allowNull: true },
    about: { type: jsonType, allowNull: true },
    navigation: { type: jsonType, allowNull: true },
    services: { type: jsonType, allowNull: true },
    testimonials: { type: jsonType, allowNull: true },
    gallery: { type: jsonType, allowNull: true },
    contact: { type: jsonType, allowNull: true },
    seo: { type: jsonType, allowNull: true },
    social: { type: jsonType, allowNull: true },
  },
  { tableName: 'user_website_preferences' },
);

UserWebsitePreference.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const normalizeObject = (value, fallback = {}) =>
    value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;

  return {
    id: plain.id,
    userId: plain.userId,
    settings: normalizeObject(plain.settings),
    theme: normalizeObject(plain.theme),
    hero: normalizeObject(plain.hero),
    about: normalizeObject(plain.about),
    navigation: normalizeObject(plain.navigation ?? { links: [] }, { links: [] }),
    services: normalizeObject(plain.services ?? { items: [] }, { items: [] }),
    testimonials: normalizeObject(plain.testimonials ?? { items: [] }, { items: [] }),
    gallery: normalizeObject(plain.gallery ?? { items: [] }, { items: [] }),
    contact: normalizeObject(plain.contact),
    seo: normalizeObject(plain.seo),
    social: normalizeObject(plain.social ?? { links: [] }, { links: [] }),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

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

export const AgencyDashboardOverview = sequelize.define(
  'AgencyDashboardOverview',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    greetingName: { type: DataTypes.STRING(150), allowNull: false, defaultValue: 'Agency team' },
    greetingHeadline: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: 'Keep every client and project on track.',
    },
    overviewSummary: { type: DataTypes.TEXT, allowNull: true },
    avatarUrl: { type: DataTypes.STRING(2048), allowNull: true },
    followerCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    trustScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    highlights: { type: jsonType, allowNull: true },
    weatherLocation: { type: DataTypes.STRING(180), allowNull: true },
    weatherLatitude: { type: DataTypes.DECIMAL(10, 6), allowNull: true },
    weatherLongitude: { type: DataTypes.DECIMAL(10, 6), allowNull: true },
    weatherProvider: { type: DataTypes.STRING(120), allowNull: true },
    weatherSnapshot: { type: jsonType, allowNull: true },
    weatherLastCheckedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'agency_dashboard_overviews',
    indexes: [
      { unique: true, fields: ['workspaceId'] },
      { fields: ['weatherLocation'] },
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

export const CompanyTimelineEvent = sequelize.define(
  'CompanyTimelineEvent',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...COMPANY_TIMELINE_EVENT_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
      validate: { isIn: [COMPANY_TIMELINE_EVENT_STATUSES] },
    },
    category: { type: DataTypes.STRING(80), allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'company_timeline_events',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['startDate'] },
      { fields: ['dueDate'] },
    ],
  },
);

CompanyTimelineEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const metadata = plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : {};
  const ownerInstance = this.owner ?? this.get?.('owner');
  const owner = ownerInstance
    ? {
        id: ownerInstance.id,
        firstName: ownerInstance.firstName,
        lastName: ownerInstance.lastName,
        email: ownerInstance.email,
      }
    : null;

  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    ownerId: plain.ownerId,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    category: plain.category,
    startDate: plain.startDate,
    dueDate: plain.dueDate,
    metadata,
    owner,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CompanyTimelinePost = sequelize.define(
  'CompanyTimelinePost',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    summary: { type: DataTypes.STRING(280), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.ENUM(...COMPANY_TIMELINE_POST_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [COMPANY_TIMELINE_POST_STATUSES] },
    },
    visibility: {
      type: DataTypes.ENUM(...COMPANY_TIMELINE_POST_VISIBILITIES),
      allowNull: false,
      defaultValue: 'workspace',
      validate: { isIn: [COMPANY_TIMELINE_POST_VISIBILITIES] },
    },
    scheduledFor: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'company_timeline_posts',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['visibility'] },
      { fields: ['scheduledFor'] },
      { fields: ['publishedAt'] },
    ],
  },
);

CompanyTimelinePost.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const tags = Array.isArray(plain.tags)
    ? plain.tags
    : plain.tags && typeof plain.tags === 'object'
    ? Object.values(plain.tags)
    : [];
  const metadata = plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : {};
  const authorInstance = this.author ?? this.get?.('author');
  const author = authorInstance
    ? {
        id: authorInstance.id,
        firstName: authorInstance.firstName,
        lastName: authorInstance.lastName,
        email: authorInstance.email,
      }
    : null;

  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    authorId: plain.authorId,
    title: plain.title,
    summary: plain.summary,
    body: plain.body,
    heroImageUrl: plain.heroImageUrl,
    ctaUrl: plain.ctaUrl,
    status: plain.status,
    visibility: plain.visibility,
    scheduledFor: plain.scheduledFor,
    publishedAt: plain.publishedAt,
    expiresAt: plain.expiresAt,
    tags,
    metadata,
    author,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CompanyTimelinePostMetric = sequelize.define(
  'CompanyTimelinePostMetric',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    postId: { type: DataTypes.INTEGER, allowNull: false },
    metricDate: { type: DataTypes.DATEONLY, allowNull: false },
    impressions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    clicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reactions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    comments: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    shares: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    saves: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'company_timeline_post_metrics',
    indexes: [
      { unique: true, fields: ['postId', 'metricDate'] },
      { fields: ['workspaceId'] },
      { fields: ['metricDate'] },
    ],
  },
);

CompanyTimelinePostMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const metadata = plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : {};
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    postId: plain.postId,
    metricDate: plain.metricDate,
    impressions: Number.parseInt(plain.impressions ?? 0, 10) || 0,
    clicks: Number.parseInt(plain.clicks ?? 0, 10) || 0,
    reactions: Number.parseInt(plain.reactions ?? 0, 10) || 0,
    comments: Number.parseInt(plain.comments ?? 0, 10) || 0,
    shares: Number.parseInt(plain.shares ?? 0, 10) || 0,
    saves: Number.parseInt(plain.saves ?? 0, 10) || 0,
    metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
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
    tableName: 'workspace_template_resources',
    indexes: [{ fields: ['templateId', 'resourceType'] }],
  },
);

WorkspaceTemplateResource.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    templateId: plain.templateId,
    title: plain.title,
    resourceType: plain.resourceType,
    url: plain.url,
    description: plain.description,
    metadata: plain.metadata ?? null,
    sortOrder: plain.sortOrder ?? 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
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
};

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

export const EscrowAccount = sequelize.define(
  'EscrowAccount',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    provider: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'stripe',
      validate: { isIn: [ESCROW_INTEGRATION_PROVIDERS] },
    },
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
    walletAccountId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'escrow_accounts',
    indexes: [
      { fields: ['userId'] },
      { fields: ['provider'] },
      { fields: ['status'] },
      { fields: ['walletAccountId'] },
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
    walletAccountId: plain.walletAccountId,
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

export const EscrowReleasePolicy = sequelize.define(
  'EscrowReleasePolicy',
  {
    name: { type: DataTypes.STRING(160), allowNull: false },
    policyType: {
      type: DataTypes.ENUM(...ESCROW_RELEASE_POLICY_TYPES),
      allowNull: false,
      defaultValue: 'auto_release_after_hours',
    },
    status: {
      type: DataTypes.ENUM(...ESCROW_RELEASE_POLICY_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    thresholdAmount: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    thresholdHours: { type: DataTypes.INTEGER, allowNull: true },
    requiresComplianceHold: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    requiresManualApproval: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notifyEmails: { type: jsonType, allowNull: false, defaultValue: [] },
    description: { type: DataTypes.STRING(500), allowNull: true },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'escrow_release_policies',
    indexes: [
      { fields: ['status'] },
      { fields: ['policyType'] },
      { fields: ['orderIndex'] },
    ],
  },
);

EscrowReleasePolicy.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    policyType: plain.policyType,
    status: plain.status,
    thresholdAmount: plain.thresholdAmount != null ? Number.parseFloat(plain.thresholdAmount) : null,
    thresholdHours: plain.thresholdHours != null ? Number.parseInt(plain.thresholdHours, 10) : null,
    requiresComplianceHold: Boolean(plain.requiresComplianceHold),
    requiresManualApproval: Boolean(plain.requiresManualApproval),
    notifyEmails: Array.isArray(plain.notifyEmails) ? plain.notifyEmails : [],
    description: plain.description,
    orderIndex: Number.parseInt(plain.orderIndex ?? 0, 10) || 0,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const EscrowFeeTier = sequelize.define(
  'EscrowFeeTier',
  {
    provider: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'stripe' },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    minimumAmount: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    maximumAmount: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    percentFee: { type: DataTypes.DECIMAL(6, 3), allowNull: false, defaultValue: 0 },
    flatFee: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM(...ESCROW_FEE_TIER_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    label: { type: DataTypes.STRING(160), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'escrow_fee_tiers',
    indexes: [
      { fields: ['provider'] },
      { fields: ['currencyCode'] },
      { fields: ['status'] },
    ],
  },
);

EscrowFeeTier.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    provider: plain.provider,
    currencyCode: plain.currencyCode,
    minimumAmount: Number.parseFloat(plain.minimumAmount ?? 0),
    maximumAmount: plain.maximumAmount != null ? Number.parseFloat(plain.maximumAmount) : null,
    percentFee: Number.parseFloat(plain.percentFee ?? 0),
    flatFee: Number.parseFloat(plain.flatFee ?? 0),
    status: plain.status,
    label: plain.label,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const HeadhunterPipelineStage = sequelize.define(
  'HeadhunterPipelineStage',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    stageType: {
      type: DataTypes.ENUM(...HEADHUNTER_PIPELINE_STAGE_TYPES),
      allowNull: false,
      defaultValue: 'discovery',
      validate: { isIn: [HEADHUNTER_PIPELINE_STAGE_TYPES] },
    },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    winProbability: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'headhunter_pipeline_stages',
    indexes: [{ fields: ['workspaceId', 'position'] }],
  },
);

export const HeadhunterPipelineItem = sequelize.define(
  'HeadhunterPipelineItem',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    stageId: { type: DataTypes.INTEGER, allowNull: false },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    targetRole: { type: DataTypes.STRING(180), allowNull: true },
    targetCompany: { type: DataTypes.STRING(180), allowNull: true },
    estimatedValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    expectedCloseDate: { type: DataTypes.DATE, allowNull: true },
    score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM(...HEADHUNTER_PIPELINE_ITEM_STATUSES),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [HEADHUNTER_PIPELINE_ITEM_STATUSES] },
    },
    statusReason: { type: DataTypes.STRING(240), allowNull: true },
    nextStep: { type: DataTypes.STRING(240), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    lastTouchedAt: { type: DataTypes.DATE, allowNull: true },
    stageEnteredAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'headhunter_pipeline_items',
    indexes: [
      { fields: ['workspaceId', 'stageId'] },
      { fields: ['candidateId'] },
      { fields: ['status'] },
    ],
  },
);

export const HeadhunterPipelineNote = sequelize.define(
  'HeadhunterPipelineNote',
  {
    pipelineItemId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: false },
    visibility: {
      type: DataTypes.ENUM(...HEADHUNTER_PIPELINE_NOTE_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
      validate: { isIn: [HEADHUNTER_PIPELINE_NOTE_VISIBILITIES] },
    },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'headhunter_pipeline_notes',
    indexes: [
      { fields: ['pipelineItemId'] },
      { fields: ['authorId'] },
    ],
  },
);

export const HeadhunterPipelineAttachment = sequelize.define(
  'HeadhunterPipelineAttachment',
  {
    pipelineItemId: { type: DataTypes.INTEGER, allowNull: false },
    uploadedById: { type: DataTypes.INTEGER, allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    fileUrl: { type: DataTypes.STRING(500), allowNull: false },
    fileType: { type: DataTypes.STRING(120), allowNull: true },
    fileSize: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'headhunter_pipeline_attachments',
    indexes: [{ fields: ['pipelineItemId'] }],
  },
);

export const HeadhunterPipelineInterview = sequelize.define(
  'HeadhunterPipelineInterview',
  {
    pipelineItemId: { type: DataTypes.INTEGER, allowNull: false },
    interviewType: {
      type: DataTypes.ENUM(...HEADHUNTER_INTERVIEW_TYPES),
      allowNull: false,
      defaultValue: 'intro',
      validate: { isIn: [HEADHUNTER_INTERVIEW_TYPES] },
    },
    status: {
      type: DataTypes.ENUM(...HEADHUNTER_INTERVIEW_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [HEADHUNTER_INTERVIEW_STATUSES] },
    },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    timezone: { type: DataTypes.STRING(80), allowNull: true },
    host: { type: DataTypes.STRING(160), allowNull: true },
    location: { type: DataTypes.STRING(160), allowNull: true },
    dialIn: { type: DataTypes.STRING(200), allowNull: true },
    prepMaterials: { type: jsonType, allowNull: true },
    scorecard: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'headhunter_pipeline_interviews',
    indexes: [
      { fields: ['pipelineItemId', 'scheduledAt'] },
      { fields: ['status'] },
    ],
  },
);

export const HeadhunterPassOnShare = sequelize.define(
  'HeadhunterPassOnShare',
  {
    pipelineItemId: { type: DataTypes.INTEGER, allowNull: false },
    targetWorkspaceId: { type: DataTypes.INTEGER, allowNull: true },
    targetName: { type: DataTypes.STRING(180), allowNull: false },
    targetType: {
      type: DataTypes.ENUM(...HEADHUNTER_PASS_ON_TARGET_TYPES),
      allowNull: false,
      defaultValue: 'agency',
      validate: { isIn: [HEADHUNTER_PASS_ON_TARGET_TYPES] },
    },
    shareStatus: {
      type: DataTypes.ENUM(...HEADHUNTER_PASS_ON_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [HEADHUNTER_PASS_ON_STATUSES] },
    },
    consentStatus: {
      type: DataTypes.ENUM(...HEADHUNTER_CONSENT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [HEADHUNTER_CONSENT_STATUSES] },
    },
    revenueShareRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    revenueShareFlat: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    sharedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'headhunter_pass_on_shares',
    indexes: [
      { fields: ['pipelineItemId'] },
      { fields: ['shareStatus'] },
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

export const DisputeWorkflowSetting = sequelize.define(
  'DisputeWorkflowSetting',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    defaultAssigneeId: { type: DataTypes.INTEGER, allowNull: true },
    responseSlaHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 24 },
    resolutionSlaHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 120 },
    autoEscalateHours: { type: DataTypes.INTEGER, allowNull: true },
    autoCloseHours: { type: DataTypes.INTEGER, allowNull: true },
    evidenceRequirements: { type: jsonType, allowNull: true },
    notificationEmails: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'dispute_workflow_settings',
    indexes: [
      { fields: ['workspaceId'] },
    ],
  },
);

DisputeWorkflowSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    defaultAssigneeId: plain.defaultAssigneeId,
    responseSlaHours: plain.responseSlaHours,
    resolutionSlaHours: plain.resolutionSlaHours,
    autoEscalateHours: plain.autoEscalateHours,
    autoCloseHours: plain.autoCloseHours,
    evidenceRequirements: plain.evidenceRequirements ?? [],
    notificationEmails: plain.notificationEmails ?? [],
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const DisputeTemplate = sequelize.define(
  'DisputeTemplate',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    reasonCode: { type: DataTypes.STRING(80), allowNull: true },
    defaultStage: {
      type: DataTypes.ENUM(...DISPUTE_STAGES),
      allowNull: false,
      defaultValue: 'intake',
      validate: { isIn: [DISPUTE_STAGES] },
    },
    defaultPriority: {
      type: DataTypes.ENUM(...DISPUTE_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [DISPUTE_PRIORITIES] },
    },
    guidance: { type: DataTypes.TEXT, allowNull: true },
    checklist: { type: jsonType, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'dispute_templates',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['active'] },
      { fields: ['reasonCode'] },
    ],
  },
);

DisputeTemplate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    reasonCode: plain.reasonCode,
    defaultStage: plain.defaultStage,
    defaultPriority: plain.defaultPriority,
    guidance: plain.guidance,
    checklist: plain.checklist ?? [],
    active: Boolean(plain.active),
    createdById: plain.createdById,
    updatedById: plain.updatedById,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

HeadhunterPipelineStage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    stageType: plain.stageType,
    position: plain.position,
    winProbability: plain.winProbability == null ? null : Number(plain.winProbability),
    isDefault: plain.isDefault,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

HeadhunterPipelineItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    stageId: plain.stageId,
    candidateId: plain.candidateId,
    applicationId: plain.applicationId,
    targetRole: plain.targetRole,
    targetCompany: plain.targetCompany,
    estimatedValue: plain.estimatedValue == null ? null : Number(plain.estimatedValue),
    expectedCloseDate: plain.expectedCloseDate,
    score: plain.score == null ? null : Number(plain.score),
    status: plain.status,
    statusReason: plain.statusReason,
    nextStep: plain.nextStep,
    tags: plain.tags,
    lastTouchedAt: plain.lastTouchedAt,
    stageEnteredAt: plain.stageEnteredAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

HeadhunterPipelineNote.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    pipelineItemId: plain.pipelineItemId,
    authorId: plain.authorId,
    note: plain.note,
    visibility: plain.visibility,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

HeadhunterPipelineAttachment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    pipelineItemId: plain.pipelineItemId,
    uploadedById: plain.uploadedById,
    fileName: plain.fileName,
    fileUrl: plain.fileUrl,
    fileType: plain.fileType,
    fileSize: plain.fileSize == null ? null : Number(plain.fileSize),
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

HeadhunterPipelineInterview.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    pipelineItemId: plain.pipelineItemId,
    interviewType: plain.interviewType,
    status: plain.status,
    scheduledAt: plain.scheduledAt,
    completedAt: plain.completedAt,
    timezone: plain.timezone,
    host: plain.host,
    location: plain.location,
    dialIn: plain.dialIn,
    prepMaterials: plain.prepMaterials,
    scorecard: plain.scorecard,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

HeadhunterPassOnShare.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    pipelineItemId: plain.pipelineItemId,
    targetWorkspaceId: plain.targetWorkspaceId,
    targetName: plain.targetName,
    targetType: plain.targetType,
    shareStatus: plain.shareStatus,
    consentStatus: plain.consentStatus,
    revenueShareRate: plain.revenueShareRate == null ? null : Number(plain.revenueShareRate),
    revenueShareFlat: plain.revenueShareFlat == null ? null : Number(plain.revenueShareFlat),
    sharedAt: plain.sharedAt,
    metadata: plain.metadata,
    notes: plain.notes,
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
        'auto_assign_queue_regenerated',
        'auto_assign_queue_exhausted',
        'auto_assign_queue_failed',
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
    confidence: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
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
    responseMetadata: { type: jsonType, allowNull: true },
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
    confidence: plain.confidence == null ? null : Number(plain.confidence),
    priorityBucket: plain.priorityBucket,
    status: plain.status,
    expiresAt: plain.expiresAt,
    notifiedAt: plain.notifiedAt,
    resolvedAt: plain.resolvedAt,
    projectValue: plain.projectValue == null ? null : Number(plain.projectValue),
    metadata: plain.metadata,
    responseMetadata: plain.responseMetadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerAutoMatchPreference = sequelize.define(
  'FreelancerAutoMatchPreference',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    availabilityStatus: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'available' },
    availabilityMode: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'always_on' },
    timezone: { type: DataTypes.STRING(60), allowNull: true },
    dailyMatchLimit: { type: DataTypes.INTEGER, allowNull: true },
    autoAcceptThreshold: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    quietHoursStart: { type: DataTypes.STRING(5), allowNull: true },
    quietHoursEnd: { type: DataTypes.STRING(5), allowNull: true },
    snoozedUntil: { type: DataTypes.DATE, allowNull: true },
    receiveEmailNotifications: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    receiveInAppNotifications: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    escalationContact: { type: DataTypes.STRING(180), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'freelancer_auto_match_preferences', underscored: true },
);

FreelancerAutoMatchPreference.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    availabilityStatus: plain.availabilityStatus,
    availabilityMode: plain.availabilityMode,
    timezone: plain.timezone,
    dailyMatchLimit: plain.dailyMatchLimit,
    autoAcceptThreshold: plain.autoAcceptThreshold == null ? null : Number(plain.autoAcceptThreshold),
    quietHoursStart: plain.quietHoursStart,
    quietHoursEnd: plain.quietHoursEnd,
    snoozedUntil: plain.snoozedUntil,
    receiveEmailNotifications: Boolean(plain.receiveEmailNotifications),
    receiveInAppNotifications: Boolean(plain.receiveInAppNotifications),
    escalationContact: plain.escalationContact,
    notes: plain.notes,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AutoAssignResponse = sequelize.define(
  'AutoAssignResponse',
  {
    queueEntryId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('accepted', 'declined', 'reassigned'),
      allowNull: false,
    },
    respondedBy: { type: DataTypes.INTEGER, allowNull: true },
    respondedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    reasonCode: { type: DataTypes.STRING(64), allowNull: true },
    reasonLabel: { type: DataTypes.STRING(180), allowNull: true },
    responseNotes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'auto_assign_responses', underscored: true },
);

AutoAssignResponse.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    queueEntryId: plain.queueEntryId,
    freelancerId: plain.freelancerId,
    status: plain.status,
    respondedBy: plain.respondedBy,
    respondedAt: plain.respondedAt,
    reasonCode: plain.reasonCode,
    reasonLabel: plain.reasonLabel,
    responseNotes: plain.responseNotes,
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

export const CareerDocument = sequelize.define(
  'CareerDocument',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    documentType: {
      type: DataTypes.ENUM(...CAREER_DOCUMENT_TYPES),
      allowNull: false,
      defaultValue: 'cv',
      validate: { isIn: [CAREER_DOCUMENT_TYPES] },
    },
    title: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: true },
    status: {
      type: DataTypes.ENUM(...CAREER_DOCUMENT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CAREER_DOCUMENT_STATUSES] },
    },
    roleTag: { type: DataTypes.STRING(120), allowNull: true },
    geographyTag: { type: DataTypes.STRING(120), allowNull: true },
    aiAssisted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    baselineVersionId: { type: DataTypes.INTEGER, allowNull: true },
    latestVersionId: { type: DataTypes.INTEGER, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    shareUrl: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_documents',
    indexes: [
      { fields: ['userId'] },
      { fields: ['documentType'] },
      { fields: ['status'] },
      { fields: ['roleTag'] },
      { fields: ['geographyTag'] },
    ],
  },
);

CareerDocument.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    documentType: plain.documentType,
    title: plain.title,
    slug: plain.slug,
    status: plain.status,
    roleTag: plain.roleTag,
    geographyTag: plain.geographyTag,
    aiAssisted: Boolean(plain.aiAssisted),
    baselineVersionId: plain.baselineVersionId,
    latestVersionId: plain.latestVersionId,
    tags: Array.isArray(plain.tags)
      ? plain.tags
      : plain.tags && typeof plain.tags === 'object'
        ? plain.tags
        : [],
    shareUrl: plain.shareUrl,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CareerDocumentVersion = sequelize.define(
  'CareerDocumentVersion',
  {
    documentId: { type: DataTypes.INTEGER, allowNull: false },
    versionNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    title: { type: DataTypes.STRING(180), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.TEXT('long'), allowNull: true },
    contentPath: { type: DataTypes.STRING(500), allowNull: true },
    aiSummary: { type: DataTypes.TEXT, allowNull: true },
    changeSummary: { type: DataTypes.TEXT, allowNull: true },
    diffHighlights: { type: jsonType, allowNull: true },
    metrics: { type: jsonType, allowNull: true },
    aiSuggestionUsed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    approvalStatus: {
      type: DataTypes.ENUM(...CAREER_DOCUMENT_VERSION_APPROVAL_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CAREER_DOCUMENT_VERSION_APPROVAL_STATUSES] },
    },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    approvedById: { type: DataTypes.INTEGER, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'career_document_versions',
    indexes: [
      { fields: ['documentId'] },
      { fields: ['approvalStatus'] },
      { unique: true, fields: ['documentId', 'versionNumber'] },
    ],
  },
);

CareerDocumentVersion.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    documentId: plain.documentId,
    versionNumber: plain.versionNumber,
    title: plain.title,
    summary: plain.summary,
    content: plain.content,
    contentPath: plain.contentPath,
    aiSummary: plain.aiSummary,
    changeSummary: plain.changeSummary,
    diffHighlights: plain.diffHighlights ?? null,
    metrics: plain.metrics ?? null,
    aiSuggestionUsed: Boolean(plain.aiSuggestionUsed),
    approvalStatus: plain.approvalStatus,
    createdById: plain.createdById,
    approvedById: plain.approvedById,
    approvedAt: plain.approvedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CareerDocumentCollaborator = sequelize.define(
  'CareerDocumentCollaborator',
  {
    documentId: { type: DataTypes.INTEGER, allowNull: false },
    collaboratorId: { type: DataTypes.INTEGER, allowNull: false },
    role: {
      type: DataTypes.ENUM(...CAREER_DOCUMENT_COLLABORATOR_ROLES),
      allowNull: false,
      defaultValue: 'viewer',
      validate: { isIn: [CAREER_DOCUMENT_COLLABORATOR_ROLES] },
    },
    permissions: { type: jsonType, allowNull: true },
    lastActiveAt: { type: DataTypes.DATE, allowNull: true },
    addedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'career_document_collaborators',
    indexes: [
      { fields: ['documentId'] },
      { fields: ['collaboratorId'] },
      { unique: true, fields: ['documentId', 'collaboratorId'] },
    ],
  },
);

CareerDocumentCollaborator.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    documentId: plain.documentId,
    collaboratorId: plain.collaboratorId,
    role: plain.role,
    permissions: plain.permissions ?? null,
    lastActiveAt: plain.lastActiveAt,
    addedAt: plain.addedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CareerDocumentExport = sequelize.define(
  'CareerDocumentExport',
  {
    documentId: { type: DataTypes.INTEGER, allowNull: false },
    versionId: { type: DataTypes.INTEGER, allowNull: true },
    format: {
      type: DataTypes.ENUM(...CAREER_DOCUMENT_EXPORT_FORMATS),
      allowNull: false,
      defaultValue: 'pdf',
      validate: { isIn: [CAREER_DOCUMENT_EXPORT_FORMATS] },
    },
    exportedById: { type: DataTypes.INTEGER, allowNull: true },
    exportedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deliveryUrl: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_document_exports',
    indexes: [
      { fields: ['documentId'] },
      { fields: ['format'] },
    ],
  },
);

CareerDocumentExport.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    documentId: plain.documentId,
    versionId: plain.versionId,
    format: plain.format,
    exportedById: plain.exportedById,
    exportedAt: plain.exportedAt,
    deliveryUrl: plain.deliveryUrl,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CareerDocumentAnalytics = sequelize.define(
  'CareerDocumentAnalytics',
  {
    documentId: { type: DataTypes.INTEGER, allowNull: false },
    versionId: { type: DataTypes.INTEGER, allowNull: true },
    viewerId: { type: DataTypes.INTEGER, allowNull: true },
    viewerType: {
      type: DataTypes.ENUM(...CAREER_DOCUMENT_ANALYTICS_VIEWER_TYPES),
      allowNull: false,
      defaultValue: 'recruiter',
      validate: { isIn: [CAREER_DOCUMENT_ANALYTICS_VIEWER_TYPES] },
    },
    opens: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    downloads: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    shares: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastOpenedAt: { type: DataTypes.DATE, allowNull: true },
    lastDownloadedAt: { type: DataTypes.DATE, allowNull: true },
    geographyTag: { type: DataTypes.STRING(120), allowNull: true },
    seniorityTag: { type: DataTypes.STRING(120), allowNull: true },
    outcomes: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_document_analytics',
    indexes: [
      { fields: ['documentId'] },
      { fields: ['viewerType'] },
      { fields: ['geographyTag'] },
      { fields: ['seniorityTag'] },
    ],
  },
);

CareerDocumentAnalytics.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    documentId: plain.documentId,
    versionId: plain.versionId,
    viewerId: plain.viewerId,
    viewerType: plain.viewerType,
    opens: plain.opens ?? 0,
    downloads: plain.downloads ?? 0,
    shares: plain.shares ?? 0,
    lastOpenedAt: plain.lastOpenedAt,
    lastDownloadedAt: plain.lastDownloadedAt,
    geographyTag: plain.geographyTag,
    seniorityTag: plain.seniorityTag,
    outcomes: plain.outcomes ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CareerStoryBlock = sequelize.define(
  'CareerStoryBlock',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    tone: {
      type: DataTypes.ENUM(...CAREER_STORY_BLOCK_TONES),
      allowNull: false,
      defaultValue: 'formal',
      validate: { isIn: [CAREER_STORY_BLOCK_TONES] },
    },
    content: { type: DataTypes.TEXT('long'), allowNull: false },
    metrics: { type: jsonType, allowNull: true },
    approvalStatus: {
      type: DataTypes.ENUM(...CAREER_STORY_BLOCK_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CAREER_STORY_BLOCK_STATUSES] },
    },
    useCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'career_story_blocks',
    indexes: [
      { fields: ['userId'] },
      { fields: ['tone'] },
      { fields: ['approvalStatus'] },
    ],
  },
);

CareerStoryBlock.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    title: plain.title,
    tone: plain.tone,
    content: plain.content,
    metrics: plain.metrics ?? null,
    approvalStatus: plain.approvalStatus,
    useCount: plain.useCount ?? 0,
    lastUsedAt: plain.lastUsedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const CareerBrandAsset = sequelize.define(
  'CareerBrandAsset',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    assetType: {
      type: DataTypes.ENUM(...CAREER_BRAND_ASSET_TYPES),
      allowNull: false,
      defaultValue: 'testimonial',
      validate: { isIn: [CAREER_BRAND_ASSET_TYPES] },
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    mediaUrl: { type: DataTypes.STRING(500), allowNull: true },
    thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.ENUM(...CAREER_BRAND_ASSET_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CAREER_BRAND_ASSET_STATUSES] },
    },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    approvalsStatus: {
      type: DataTypes.ENUM(...CAREER_BRAND_ASSET_APPROVAL_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CAREER_BRAND_ASSET_APPROVAL_STATUSES] },
    },
    approvedById: { type: DataTypes.INTEGER, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    metrics: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'career_brand_assets',
    indexes: [
      { fields: ['userId'] },
      { fields: ['assetType'] },
      { fields: ['status'] },
    ],
  },
);

CareerBrandAsset.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    assetType: plain.assetType,
    title: plain.title,
    description: plain.description,
    mediaUrl: plain.mediaUrl,
    thumbnailUrl: plain.thumbnailUrl,
    status: plain.status,
    featured: Boolean(plain.featured),
    approvalsStatus: plain.approvalsStatus,
    approvedById: plain.approvedById,
    approvedAt: plain.approvedAt,
    tags: Array.isArray(plain.tags)
      ? plain.tags
      : plain.tags && typeof plain.tags === 'object'
        ? plain.tags
        : [],
    metrics: plain.metrics ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExecutiveIntelligenceMetric = sequelize.define(
  'ExecutiveIntelligenceMetric',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    category: {
      type: DataTypes.ENUM(...EXECUTIVE_METRIC_CATEGORIES),
      allowNull: false,
      defaultValue: 'financial',
      validate: { isIn: [EXECUTIVE_METRIC_CATEGORIES] },
    },
    name: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    value: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    unit: {
      type: DataTypes.ENUM(...EXECUTIVE_METRIC_UNITS),
      allowNull: false,
      defaultValue: 'count',
      validate: { isIn: [EXECUTIVE_METRIC_UNITS] },
    },
    changeValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    changeUnit: {
      type: DataTypes.ENUM(...EXECUTIVE_METRIC_UNITS),
      allowNull: true,
      validate: { isIn: [EXECUTIVE_METRIC_UNITS] },
    },
    trend: {
      type: DataTypes.ENUM(...EXECUTIVE_METRIC_TRENDS),
      allowNull: false,
      defaultValue: 'steady',
      validate: { isIn: [EXECUTIVE_METRIC_TRENDS] },
    },
    comparisonPeriod: { type: DataTypes.STRING(120), allowNull: true },
    reportedAt: { type: DataTypes.DATE, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'executive_intelligence_metrics',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['category'] },
      { fields: ['reportedAt'] },
    ],
  },
);

ExecutiveIntelligenceMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    category: plain.category,
    name: plain.name,
    description: plain.description,
    value: plain.value == null ? null : Number.parseFloat(plain.value),
    unit: plain.unit,
    changeValue: plain.changeValue == null ? null : Number.parseFloat(plain.changeValue),
    changeUnit: plain.changeUnit,
    trend: plain.trend,
    comparisonPeriod: plain.comparisonPeriod,
    reportedAt: plain.reportedAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExecutiveScenarioPlan = sequelize.define(
  'ExecutiveScenarioPlan',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    scenarioType: {
      type: DataTypes.ENUM(...EXECUTIVE_SCENARIO_TYPES),
      allowNull: false,
      defaultValue: 'base',
      validate: { isIn: [EXECUTIVE_SCENARIO_TYPES] },
    },
    label: { type: DataTypes.STRING(120), allowNull: false },
    timeframeStart: { type: DataTypes.DATE, allowNull: false },
    timeframeEnd: { type: DataTypes.DATE, allowNull: false },
    revenue: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    grossMargin: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    utilization: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    pipelineVelocity: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    clientSatisfaction: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    netRetention: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    assumptions: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'executive_scenario_plans',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['scenarioType'] },
      { fields: ['timeframeEnd'] },
    ],
  },
);

ExecutiveScenarioPlan.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    scenarioType: plain.scenarioType,
    label: plain.label,
    timeframeStart: plain.timeframeStart,
    timeframeEnd: plain.timeframeEnd,
    revenue: plain.revenue == null ? null : Number.parseFloat(plain.revenue),
    grossMargin: plain.grossMargin == null ? null : Number.parseFloat(plain.grossMargin),
    utilization: plain.utilization == null ? null : Number.parseFloat(plain.utilization),
    pipelineVelocity: plain.pipelineVelocity == null ? null : Number.parseFloat(plain.pipelineVelocity),
    clientSatisfaction: plain.clientSatisfaction == null ? null : Number.parseFloat(plain.clientSatisfaction),
    netRetention: plain.netRetention == null ? null : Number.parseFloat(plain.netRetention),
    notes: plain.notes,
    assumptions: plain.assumptions ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExecutiveScenarioBreakdown = sequelize.define(
  'ExecutiveScenarioBreakdown',
  {
    scenarioId: { type: DataTypes.INTEGER, allowNull: false },
    dimensionType: {
      type: DataTypes.ENUM(...EXECUTIVE_SCENARIO_DIMENSION_TYPES),
      allowNull: false,
      validate: { isIn: [EXECUTIVE_SCENARIO_DIMENSION_TYPES] },
    },
    dimensionKey: { type: DataTypes.STRING(180), allowNull: false },
    dimensionLabel: { type: DataTypes.STRING(255), allowNull: false },
    revenue: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    grossMargin: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    utilization: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    pipelineVelocity: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    clientSatisfaction: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    owner: { type: DataTypes.STRING(180), allowNull: true },
    highlight: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'executive_scenario_breakdowns',
    indexes: [
      { fields: ['scenarioId'] },
      { fields: ['dimensionType'] },
    ],
  },
);

ExecutiveScenarioBreakdown.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    scenarioId: plain.scenarioId,
    dimensionType: plain.dimensionType,
    dimensionKey: plain.dimensionKey,
    dimensionLabel: plain.dimensionLabel,
    revenue: plain.revenue == null ? null : Number.parseFloat(plain.revenue),
    grossMargin: plain.grossMargin == null ? null : Number.parseFloat(plain.grossMargin),
    utilization: plain.utilization == null ? null : Number.parseFloat(plain.utilization),
    pipelineVelocity: plain.pipelineVelocity == null ? null : Number.parseFloat(plain.pipelineVelocity),
    clientSatisfaction: plain.clientSatisfaction == null ? null : Number.parseFloat(plain.clientSatisfaction),
    owner: plain.owner,
    highlight: plain.highlight,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GovernanceRiskRegister = sequelize.define(
  'GovernanceRiskRegister',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    referenceCode: { type: DataTypes.STRING(60), allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    category: {
      type: DataTypes.ENUM(...GOVERNANCE_RISK_CATEGORIES),
      allowNull: false,
      defaultValue: 'compliance',
      validate: { isIn: [GOVERNANCE_RISK_CATEGORIES] },
    },
    status: {
      type: DataTypes.ENUM(...GOVERNANCE_RISK_STATUSES),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [GOVERNANCE_RISK_STATUSES] },
    },
    impactScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    likelihoodScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    mitigationPlan: { type: DataTypes.TEXT, allowNull: true },
    mitigationOwner: { type: DataTypes.STRING(160), allowNull: true },
    mitigationStatus: { type: DataTypes.STRING(120), allowNull: true },
    targetResolutionDate: { type: DataTypes.DATE, allowNull: true },
    nextReviewAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'governance_risk_registers',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['category'] },
      { fields: ['status'] },
    ],
  },
);

GovernanceRiskRegister.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    referenceCode: plain.referenceCode,
    title: plain.title,
    category: plain.category,
    status: plain.status,
    impactScore: plain.impactScore == null ? null : Number.parseFloat(plain.impactScore),
    likelihoodScore: plain.likelihoodScore == null ? null : Number.parseFloat(plain.likelihoodScore),
    mitigationPlan: plain.mitigationPlan,
    mitigationOwner: plain.mitigationOwner,
    mitigationStatus: plain.mitigationStatus,
    targetResolutionDate: plain.targetResolutionDate,
    nextReviewAt: plain.nextReviewAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const GovernanceAuditExport = sequelize.define(
  'GovernanceAuditExport',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    exportType: { type: DataTypes.STRING(120), allowNull: false },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'available' },
    requestedBy: { type: DataTypes.STRING(160), allowNull: true },
    generatedAt: { type: DataTypes.DATE, allowNull: false },
    fileUrl: { type: DataTypes.STRING(1000), allowNull: true },
    recipients: { type: jsonType, allowNull: true },
    scope: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'governance_audit_exports',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['exportType'] },
    ],
  },
);

GovernanceAuditExport.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    exportType: plain.exportType,
    status: plain.status,
    requestedBy: plain.requestedBy,
    generatedAt: plain.generatedAt,
    fileUrl: plain.fileUrl,
    recipients: Array.isArray(plain.recipients) ? plain.recipients : [],
    scope: plain.scope ?? null,
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const LeadershipRitual = sequelize.define(
  'LeadershipRitual',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    cadence: {
      type: DataTypes.ENUM(...LEADERSHIP_RITUAL_CADENCES),
      allowNull: false,
      defaultValue: 'weekly',
      validate: { isIn: [LEADERSHIP_RITUAL_CADENCES] },
    },
    facilitator: { type: DataTypes.STRING(160), allowNull: true },
    channel: { type: DataTypes.STRING(120), allowNull: true },
    nextSessionAt: { type: DataTypes.DATE, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    attendees: { type: jsonType, allowNull: true },
    lastSummaryUrl: { type: DataTypes.STRING(1000), allowNull: true },
  },
  {
    tableName: 'leadership_rituals',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['cadence'] },
    ],
  },
);

LeadershipRitual.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    cadence: plain.cadence,
    facilitator: plain.facilitator,
    channel: plain.channel,
    nextSessionAt: plain.nextSessionAt,
    summary: plain.summary,
    attendees: Array.isArray(plain.attendees) ? plain.attendees : [],
    lastSummaryUrl: plain.lastSummaryUrl,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const LeadershipOkr = sequelize.define(
  'LeadershipOkr',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    objective: { type: DataTypes.STRING(255), allowNull: false },
    owner: { type: DataTypes.STRING(160), allowNull: true },
    status: {
      type: DataTypes.ENUM(...LEADERSHIP_OKR_STATUSES),
      allowNull: false,
      defaultValue: 'on_track',
      validate: { isIn: [LEADERSHIP_OKR_STATUSES] },
    },
    progress: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    confidence: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    targetDate: { type: DataTypes.DATE, allowNull: true },
    alignment: { type: DataTypes.STRING(160), allowNull: true },
    keyResults: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'leadership_okrs',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
    ],
  },
);

LeadershipOkr.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    objective: plain.objective,
    owner: plain.owner,
    status: plain.status,
    progress: plain.progress == null ? null : Number.parseFloat(plain.progress),
    confidence: plain.confidence == null ? null : Number.parseFloat(plain.confidence),
    targetDate: plain.targetDate,
    alignment: plain.alignment,
    keyResults: Array.isArray(plain.keyResults) ? plain.keyResults : [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const LeadershipDecision = sequelize.define(
  'LeadershipDecision',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...LEADERSHIP_DECISION_STATUSES),
      allowNull: false,
      defaultValue: 'proposed',
      validate: { isIn: [LEADERSHIP_DECISION_STATUSES] },
    },
    decidedAt: { type: DataTypes.DATE, allowNull: true },
    owner: { type: DataTypes.STRING(160), allowNull: true },
    impactArea: { type: DataTypes.STRING(160), allowNull: true },
    followUpAt: { type: DataTypes.DATE, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    links: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'leadership_decisions',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['decidedAt'] },
    ],
  },
);

LeadershipDecision.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    status: plain.status,
    decidedAt: plain.decidedAt,
    owner: plain.owner,
    impactArea: plain.impactArea,
    followUpAt: plain.followUpAt,
    summary: plain.summary,
    links: Array.isArray(plain.links) ? plain.links : [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const LeadershipBriefingPack = sequelize.define(
  'LeadershipBriefingPack',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    focus: { type: DataTypes.STRING(160), allowNull: true },
    status: {
      type: DataTypes.ENUM(...LEADERSHIP_BRIEFING_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [LEADERSHIP_BRIEFING_STATUSES] },
    },
    distributionDate: { type: DataTypes.DATE, allowNull: true },
    preparedBy: { type: DataTypes.STRING(160), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    resourceUrl: { type: DataTypes.STRING(1000), allowNull: true },
    highlights: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'leadership_briefing_packs',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['distributionDate'] },
    ],
  },
);

LeadershipBriefingPack.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    focus: plain.focus,
    status: plain.status,
    distributionDate: plain.distributionDate,
    preparedBy: plain.preparedBy,
    summary: plain.summary,
    resourceUrl: plain.resourceUrl,
    highlights: Array.isArray(plain.highlights) ? plain.highlights : [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const LeadershipStrategicBet = sequelize.define(
  'LeadershipStrategicBet',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    thesis: { type: DataTypes.TEXT, allowNull: true },
    owner: { type: DataTypes.STRING(160), allowNull: true },
    status: { type: DataTypes.STRING(80), allowNull: true },
    progress: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    impactScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    successMetric: { type: DataTypes.STRING(160), allowNull: true },
    lastReviewedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'leadership_strategic_bets',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['projectId'] },
    ],
  },
);

LeadershipStrategicBet.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    projectId: plain.projectId,
    name: plain.name,
    thesis: plain.thesis,
    owner: plain.owner,
    status: plain.status,
    progress: plain.progress == null ? null : Number.parseFloat(plain.progress),
    impactScore: plain.impactScore == null ? null : Number.parseFloat(plain.impactScore),
    successMetric: plain.successMetric,
    lastReviewedAt: plain.lastReviewedAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const InnovationInitiative = sequelize.define(
  'InnovationInitiative',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    category: {
      type: DataTypes.ENUM(...INNOVATION_INITIATIVE_CATEGORIES),
      allowNull: false,
      defaultValue: 'service_line',
      validate: { isIn: [INNOVATION_INITIATIVE_CATEGORIES] },
    },
    stage: {
      type: DataTypes.ENUM(...INNOVATION_INITIATIVE_STAGES),
      allowNull: false,
      defaultValue: 'ideation',
      validate: { isIn: [INNOVATION_INITIATIVE_STAGES] },
    },
    priority: {
      type: DataTypes.ENUM(...INNOVATION_INITIATIVE_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [INNOVATION_INITIATIVE_PRIORITIES] },
    },
    priorityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 50 },
    sponsor: { type: DataTypes.STRING(160), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    eta: { type: DataTypes.DATE, allowNull: true },
    confidence: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    projectedRoi: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    roiCurrency: { type: DataTypes.STRING(3), allowNull: true },
    tags: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'innovation_initiatives',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['stage'] },
      { fields: ['priority'] },
    ],
  },
);

InnovationInitiative.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    category: plain.category,
    stage: plain.stage,
    priority: plain.priority,
    priorityScore: plain.priorityScore == null ? null : Number.parseFloat(plain.priorityScore),
    sponsor: plain.sponsor,
    summary: plain.summary,
    eta: plain.eta,
    confidence: plain.confidence == null ? null : Number.parseFloat(plain.confidence),
    projectedRoi: plain.projectedRoi == null ? null : Number.parseFloat(plain.projectedRoi),
    roiCurrency: plain.roiCurrency,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const InnovationFundingEvent = sequelize.define(
  'InnovationFundingEvent',
  {
    initiativeId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    eventType: {
      type: DataTypes.ENUM(...INNOVATION_FUNDING_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'allocation',
      validate: { isIn: [INNOVATION_FUNDING_EVENT_TYPES] },
    },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    recordedAt: { type: DataTypes.DATE, allowNull: false },
    owner: { type: DataTypes.STRING(160), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    roiSnapshot: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'innovation_funding_events',
    indexes: [
      { fields: ['initiativeId'] },
      { fields: ['workspaceId'] },
      { fields: ['eventType'] },
    ],
  },
);

InnovationFundingEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    initiativeId: plain.initiativeId,
    workspaceId: plain.workspaceId,
    eventType: plain.eventType,
    amount: plain.amount == null ? null : Number.parseFloat(plain.amount),
    currency: plain.currency,
    recordedAt: plain.recordedAt,
    owner: plain.owner,
    description: plain.description,
    roiSnapshot: plain.roiSnapshot == null ? null : Number.parseFloat(plain.roiSnapshot),
    metadata: plain.metadata ?? null,
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

export const DomainGovernanceReview = sequelize.define(
  'DomainGovernanceReview',
  {
    contextName: { type: DataTypes.STRING(80), allowNull: false },
    ownerTeam: { type: DataTypes.STRING(120), allowNull: false },
    dataSteward: { type: DataTypes.STRING(120), allowNull: false },
    reviewStatus: {
      type: DataTypes.ENUM('in_progress', 'approved', 'remediation_required'),
      allowNull: false,
      defaultValue: 'in_progress',
    },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    nextReviewDueAt: { type: DataTypes.DATE, allowNull: true },
    scorecard: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'domain_governance_reviews',
    indexes: [
      { unique: true, fields: ['contextName'] },
      { fields: ['reviewStatus'] },
      { fields: ['nextReviewDueAt'] },
    ],
  },
);

DomainGovernanceReview.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    contextName: plain.contextName,
    ownerTeam: plain.ownerTeam,
    dataSteward: plain.dataSteward,
    reviewStatus: plain.reviewStatus,
    reviewedAt: plain.reviewedAt,
    nextReviewDueAt: plain.nextReviewDueAt,
    scorecard: plain.scorecard ?? null,
    notes: plain.notes ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

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

export const GigVendorScorecard = sequelize.define(
  'GigVendorScorecard',
  {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    vendorId: { type: DataTypes.INTEGER, allowNull: false },
    reviewedById: { type: DataTypes.INTEGER, allowNull: true },
    periodStart: { type: DataTypes.DATE, allowNull: true },
    periodEnd: { type: DataTypes.DATE, allowNull: true },
    onTimeDeliveryScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    qualityScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    communicationScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    complianceScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    overallScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    riskLevel: {
      type: DataTypes.ENUM(...VENDOR_RISK_LEVELS),
      allowNull: false,
      defaultValue: 'low',
      validate: { isIn: [VENDOR_RISK_LEVELS] },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    recommendations: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    lastReviewedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'gig_vendor_scorecards' },
);

GigVendorScorecard.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    orderId: plain.orderId,
    vendorId: plain.vendorId,
    reviewedById: plain.reviewedById,
    periodStart: plain.periodStart,
    periodEnd: plain.periodEnd,
    onTimeDeliveryScore: plain.onTimeDeliveryScore == null ? null : Number(plain.onTimeDeliveryScore),
    qualityScore: plain.qualityScore == null ? null : Number(plain.qualityScore),
    communicationScore: plain.communicationScore == null ? null : Number(plain.communicationScore),
    complianceScore: plain.complianceScore == null ? null : Number(plain.complianceScore),
    overallScore: plain.overallScore == null ? null : Number(plain.overallScore),
    riskLevel: plain.riskLevel,
    notes: plain.notes,
    recommendations: plain.recommendations ?? [],
    metadata: plain.metadata ?? null,
    lastReviewedAt: plain.lastReviewedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

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

export const ClientEngagement = sequelize.define(
  'ClientEngagement',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    clientName: { type: DataTypes.STRING(160), allowNull: false },
    clientCode: { type: DataTypes.STRING(60), allowNull: true },
    industry: { type: DataTypes.STRING(120), allowNull: true },
    retainerAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    retainerCurrency: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'USD' },
    retainerBillingCadence: { type: DataTypes.STRING(60), allowNull: true },
    successFeePercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    successFeeTrigger: { type: DataTypes.STRING(160), allowNull: true },
    contractStatus: {
      type: DataTypes.ENUM(...CLIENT_ENGAGEMENT_CONTRACT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CLIENT_ENGAGEMENT_CONTRACT_STATUSES] },
    },
    contractSignedAt: { type: DataTypes.DATE, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    renewalDate: { type: DataTypes.DATE, allowNull: true },
    hiringMandates: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    activeMandates: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    accountingIntegration: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'client_engagements',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['workspaceId', 'contractStatus'] },
    ],
  },
);

export const ClientEngagementMandate = sequelize.define(
  'ClientEngagementMandate',
  {
    engagementId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    roleLevel: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(160), allowNull: true },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'active' },
    openRoles: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    filledRoles: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    pipelineValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    forecastRevenue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    diversitySlatePct: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    qualityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    avgTimeToSubmitDays: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    interviewToOfferDays: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    revenueRecognized: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    nextMilestoneAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'client_engagement_mandates',
    indexes: [{ fields: ['engagementId'] }],
  },
);

export const ClientEngagementMilestone = sequelize.define(
  'ClientEngagementMilestone',
  {
    engagementId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    kind: {
      type: DataTypes.ENUM(...CLIENT_ENGAGEMENT_MILESTONE_KINDS),
      allowNull: false,
      defaultValue: 'milestone',
      validate: { isIn: [CLIENT_ENGAGEMENT_MILESTONE_KINDS] },
    },
    status: {
      type: DataTypes.ENUM(...CLIENT_ENGAGEMENT_MILESTONE_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
      validate: { isIn: [CLIENT_ENGAGEMENT_MILESTONE_STATUSES] },
    },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    impactScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'client_engagement_milestones',
    indexes: [
      { fields: ['engagementId'] },
      { fields: ['status'] },
    ],
  },
);

export const ClientEngagementPortal = sequelize.define(
  'ClientEngagementPortal',
  {
    engagementId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...CLIENT_ENGAGEMENT_PORTAL_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [CLIENT_ENGAGEMENT_PORTAL_STATUSES] },
    },
    inviteCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    activeUsers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    brandingTheme: { type: DataTypes.STRING(120), allowNull: true },
    primaryColor: { type: DataTypes.STRING(20), allowNull: true },
    secondaryColor: { type: DataTypes.STRING(20), allowNull: true },
    logoUrl: { type: DataTypes.STRING(500), allowNull: true },
    customDomain: { type: DataTypes.STRING(255), allowNull: true },
    autoReportFrequency: { type: DataTypes.STRING(60), allowNull: true },
    features: { type: jsonType, allowNull: true },
    settings: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'client_engagement_portals',
    indexes: [
      { fields: ['engagementId'] },
      { fields: ['status'] },
    ],
  },
);

export const ClientEngagementPortalAuditLog = sequelize.define(
  'ClientEngagementPortalAuditLog',
  {
    portalId: { type: DataTypes.INTEGER, allowNull: false },
    eventType: { type: DataTypes.STRING(120), allowNull: false },
    actorType: { type: DataTypes.STRING(60), allowNull: true },
    actorName: { type: DataTypes.STRING(160), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'client_engagement_portal_audit_logs',
    indexes: [
      { fields: ['portalId'] },
      { fields: ['occurredAt'] },
    ],
  },
);

export const EngagementInvoice = sequelize.define(
  'EngagementInvoice',
  {
    engagementId: { type: DataTypes.INTEGER, allowNull: false },
    invoiceNumber: { type: DataTypes.STRING(120), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'draft' },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    issuedDate: { type: DataTypes.DATE, allowNull: true },
    paidDate: { type: DataTypes.DATE, allowNull: true },
    integrationProvider: { type: DataTypes.STRING(120), allowNull: true },
    integrationReference: { type: DataTypes.STRING(160), allowNull: true },
    lineItems: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'engagement_invoices',
    indexes: [
      { fields: ['engagementId'] },
      { fields: ['status'] },
    ],
  },
);

export const EngagementCommissionSplit = sequelize.define(
  'EngagementCommissionSplit',
  {
    engagementId: { type: DataTypes.INTEGER, allowNull: false },
    partnerName: { type: DataTypes.STRING(160), allowNull: false },
    percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'pending' },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'engagement_commission_splits',
    indexes: [
      { fields: ['engagementId'] },
      { fields: ['status'] },
    ],
  },
);

export const EngagementScheduleEvent = sequelize.define(
  'EngagementScheduleEvent',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    engagementId: { type: DataTypes.INTEGER, allowNull: true },
    scope: {
      type: DataTypes.ENUM(...ENGAGEMENT_SCHEDULE_SCOPES),
      allowNull: false,
      defaultValue: 'personal',
      validate: { isIn: [ENGAGEMENT_SCHEDULE_SCOPES] },
    },
    eventType: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: true },
    location: { type: DataTypes.STRING(160), allowNull: true },
    visibility: {
      type: DataTypes.ENUM(...ENGAGEMENT_SCHEDULE_VISIBILITIES),
      allowNull: true,
      validate: { isIn: [ENGAGEMENT_SCHEDULE_VISIBILITIES] },
    },
    hostName: { type: DataTypes.STRING(160), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    attendees: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'engagement_schedule_events',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['scope'] },
      { fields: ['startAt'] },
    ],
  },
);

export const IssueResolutionCase = sequelize.define(
  'IssueResolutionCase',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    engagementId: { type: DataTypes.INTEGER, allowNull: true },
    caseType: { type: DataTypes.STRING(160), allowNull: false },
    status: {
      type: DataTypes.ENUM(...ISSUE_RESOLUTION_CASE_STATUSES),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [ISSUE_RESOLUTION_CASE_STATUSES] },
    },
    severity: {
      type: DataTypes.ENUM(...ISSUE_RESOLUTION_SEVERITIES),
      allowNull: true,
      validate: { isIn: [ISSUE_RESOLUTION_SEVERITIES] },
    },
    priority: {
      type: DataTypes.ENUM(...ISSUE_RESOLUTION_PRIORITIES),
      allowNull: true,
      validate: { isIn: [ISSUE_RESOLUTION_PRIORITIES] },
    },
    openedAt: { type: DataTypes.DATE, allowNull: false },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    ownerName: { type: DataTypes.STRING(160), allowNull: true },
    playbookUsed: { type: DataTypes.STRING(160), allowNull: true },
    escalatedTo: { type: DataTypes.STRING(160), allowNull: true },
    outcome: { type: DataTypes.STRING(160), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'issue_resolution_cases',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['openedAt'] },
    ],
  },
);

export const IssueResolutionEvent = sequelize.define(
  'IssueResolutionEvent',
  {
    caseId: { type: DataTypes.INTEGER, allowNull: false },
    eventType: {
      type: DataTypes.ENUM(...ISSUE_RESOLUTION_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'note',
      validate: { isIn: [ISSUE_RESOLUTION_EVENT_TYPES] },
    },
    actorName: { type: DataTypes.STRING(160), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    outcome: { type: DataTypes.STRING(160), allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'issue_resolution_events',
    indexes: [
      { fields: ['caseId'] },
      { fields: ['occurredAt'] },
    ],
  },
);

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
OpportunityTaxonomy.hasMany(OpportunityTaxonomy, { foreignKey: 'parentId', as: 'children' });
OpportunityTaxonomy.belongsTo(OpportunityTaxonomy, { foreignKey: 'parentId', as: 'parent' });
OpportunityTaxonomy.hasMany(OpportunityTaxonomyAssignment, { foreignKey: 'taxonomyId', as: 'assignments' });
OpportunityTaxonomyAssignment.belongsTo(OpportunityTaxonomy, { foreignKey: 'taxonomyId', as: 'taxonomy' });

Job.hasMany(OpportunityTaxonomyAssignment, {
  foreignKey: 'targetId',
  as: 'taxonomyAssignments',
  constraints: false,
  scope: { targetType: 'job' },
});
OpportunityTaxonomyAssignment.belongsTo(Job, {
  foreignKey: 'targetId',
  as: 'job',
  constraints: false,
});

Gig.hasMany(OpportunityTaxonomyAssignment, {
  foreignKey: 'targetId',
  as: 'taxonomyAssignments',
  constraints: false,
  scope: { targetType: 'gig' },
});
OpportunityTaxonomyAssignment.belongsTo(Gig, {
  foreignKey: 'targetId',
  as: 'gig',
  constraints: false,
});

FreelancerProfile.hasMany(OpportunityTaxonomyAssignment, {
  foreignKey: 'targetId',
  as: 'taxonomyAssignments',
  constraints: false,
  scope: { targetType: 'freelance' },
});
OpportunityTaxonomyAssignment.belongsTo(FreelancerProfile, {
  foreignKey: 'targetId',
  as: 'freelancerProfile',
  constraints: false,
});

ExperienceLaunchpad.hasMany(OpportunityTaxonomyAssignment, {
  foreignKey: 'targetId',
  as: 'taxonomyAssignments',
  constraints: false,
  scope: { targetType: 'launchpad' },
});
OpportunityTaxonomyAssignment.belongsTo(ExperienceLaunchpad, {
  foreignKey: 'targetId',
  as: 'launchpad',
  constraints: false,
});

Volunteering.hasMany(OpportunityTaxonomyAssignment, {
  foreignKey: 'targetId',
  as: 'taxonomyAssignments',
  constraints: false,
  scope: { targetType: 'volunteering' },
});
OpportunityTaxonomyAssignment.belongsTo(Volunteering, {
  foreignKey: 'targetId',
  as: 'volunteeringRole',
  constraints: false,
});

VolunteerApplication.belongsTo(User, { foreignKey: 'userId', as: 'applicant' });
VolunteerApplication.belongsTo(Volunteering, { foreignKey: 'volunteeringRoleId', as: 'role' });
VolunteerApplication.hasMany(VolunteerResponse, {
  foreignKey: 'applicationId',
  as: 'responses',
  onDelete: 'CASCADE',
});
VolunteerApplication.hasOne(VolunteerContract, {
  foreignKey: 'applicationId',
  as: 'contract',
  onDelete: 'CASCADE',
});

VolunteerResponse.belongsTo(VolunteerApplication, { foreignKey: 'applicationId', as: 'application' });
VolunteerResponse.belongsTo(User, { foreignKey: 'responderId', as: 'responder' });

VolunteerContract.belongsTo(VolunteerApplication, { foreignKey: 'applicationId', as: 'application' });
VolunteerContract.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
VolunteerContract.hasMany(VolunteerContractSpend, {
  foreignKey: 'contractId',
  as: 'spendEntries',
  onDelete: 'CASCADE',
});
VolunteerContract.hasMany(VolunteerContractReview, {
  foreignKey: 'contractId',
  as: 'reviews',
  onDelete: 'CASCADE',
});

VolunteerContractSpend.belongsTo(VolunteerContract, { foreignKey: 'contractId', as: 'contract' });
VolunteerContractSpend.belongsTo(User, { foreignKey: 'recordedById', as: 'recordedBy' });

VolunteerContractReview.belongsTo(VolunteerContract, { foreignKey: 'contractId', as: 'contract' });
VolunteerContractReview.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

AdCampaign.hasMany(AdCreative, { foreignKey: 'campaignId', as: 'creatives', onDelete: 'CASCADE' });
AdCreative.belongsTo(AdCampaign, { foreignKey: 'campaignId', as: 'campaign' });
AdCreative.hasMany(AdKeywordAssignment, { foreignKey: 'creativeId', as: 'keywordAssignments', onDelete: 'CASCADE' });
AdKeywordAssignment.belongsTo(AdCreative, { foreignKey: 'creativeId', as: 'creative' });
AdKeyword.hasMany(AdKeywordAssignment, { foreignKey: 'keywordId', as: 'assignments', onDelete: 'CASCADE' });
AdKeywordAssignment.belongsTo(AdKeyword, { foreignKey: 'keywordId', as: 'keyword' });
AdKeywordAssignment.belongsTo(OpportunityTaxonomy, { foreignKey: 'taxonomyId', as: 'taxonomy' });
AdCreative.belongsToMany(AdKeyword, {
  through: AdKeywordAssignment,
  foreignKey: 'creativeId',
  otherKey: 'keywordId',
  as: 'keywords',
});
AdKeyword.belongsToMany(AdCreative, {
  through: AdKeywordAssignment,
  foreignKey: 'keywordId',
  otherKey: 'creativeId',
  as: 'creatives',
});
AdCreative.hasMany(AdPlacement, { foreignKey: 'creativeId', as: 'placements', onDelete: 'CASCADE' });
AdPlacement.belongsTo(AdCreative, { foreignKey: 'creativeId', as: 'creative' });
AdCoupon.belongsToMany(AdPlacement, {
  through: AdPlacementCoupon,
  foreignKey: 'couponId',
  otherKey: 'placementId',
  as: 'placements',
});
AdPlacement.belongsToMany(AdCoupon, {
  through: AdPlacementCoupon,
  foreignKey: 'placementId',
  otherKey: 'couponId',
  as: 'coupons',
});
AdCoupon.hasMany(AdPlacementCoupon, { foreignKey: 'couponId', as: 'placementLinks', onDelete: 'CASCADE' });
AdPlacementCoupon.belongsTo(AdCoupon, { foreignKey: 'couponId', as: 'coupon' });
AdPlacement.hasMany(AdPlacementCoupon, { foreignKey: 'placementId', as: 'couponLinks', onDelete: 'CASCADE' });
AdPlacementCoupon.belongsTo(AdPlacement, { foreignKey: 'placementId', as: 'placement' });

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

CareerPipelineBoard.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    name: plain.name,
    description: plain.description,
    isPrimary: plain.isPrimary,
    timezone: plain.timezone,
    settings: plain.settings,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerPipelineStage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    boardId: plain.boardId,
    key: plain.key,
    name: plain.name,
    position: plain.position,
    stageType: plain.stageType,
    outcomeCategory: plain.outcomeCategory,
    slaHours: plain.slaHours == null ? null : Number(plain.slaHours),
    exitCriteria: plain.exitCriteria,
    checklistTemplate: plain.checklistTemplate,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerOpportunity.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    boardId: plain.boardId,
    stageId: plain.stageId,
    userId: plain.userId,
    applicationId: plain.applicationId,
    title: plain.title,
    companyName: plain.companyName,
    location: plain.location,
    salary: {
      min: plain.salaryMin == null ? null : Number(plain.salaryMin),
      max: plain.salaryMax == null ? null : Number(plain.salaryMax),
      currency: plain.salaryCurrency,
    },
    stageEnteredAt: plain.stageEnteredAt,
    lastActivityAt: plain.lastActivityAt,
    nextActionDueAt: plain.nextActionDueAt,
    followUpStatus: plain.followUpStatus,
    researchSummary: plain.researchSummary,
    researchLinks: Array.isArray(plain.researchLinks) ? plain.researchLinks : [],
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    collaboratorNotes: plain.collaboratorNotes,
    complianceStatus: plain.complianceStatus,
    equalOpportunityReport: plain.equalOpportunityReport,
    automationMetadata: plain.automationMetadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerOpportunityCollaborator.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    opportunityId: plain.opportunityId,
    collaboratorId: plain.collaboratorId,
    collaboratorEmail: plain.collaboratorEmail,
    role: plain.role,
    permissions: plain.permissions,
    invitedAt: plain.invitedAt,
    joinedAt: plain.joinedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerOpportunityNudge.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    opportunityId: plain.opportunityId,
    stageId: plain.stageId,
    severity: plain.severity,
    channel: plain.channel,
    message: plain.message,
    triggeredAt: plain.triggeredAt,
    dueAt: plain.dueAt,
    resolvedAt: plain.resolvedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerCandidateBrief.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    opportunityId: plain.opportunityId,
    userId: plain.userId,
    shareCode: plain.shareCode,
    status: plain.status,
    summary: plain.summary,
    strengths: Array.isArray(plain.strengths) ? plain.strengths : [],
    collaborationNotes: plain.collaborationNotes,
    recipients: Array.isArray(plain.recipients) ? plain.recipients : [],
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    lastSharedAt: plain.lastSharedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerInterviewWorkspace.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    opportunityId: plain.opportunityId,
    interviewScheduleId: plain.interviewScheduleId,
    calendarEventId: plain.calendarEventId,
    status: plain.status,
    roomUrl: plain.roomUrl,
    prepChecklist: Array.isArray(plain.prepChecklist) ? plain.prepChecklist : plain.prepChecklist,
    aiPrompts: Array.isArray(plain.aiPrompts) ? plain.aiPrompts : plain.aiPrompts,
    resources: Array.isArray(plain.resources) ? plain.resources : plain.resources,
    lastSyncedAt: plain.lastSyncedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerInterviewTask.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    ownerId: plain.ownerId,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    priority: plain.priority,
    dueAt: plain.dueAt,
    completedAt: plain.completedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerInterviewScorecard.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    interviewerId: plain.interviewerId,
    submittedAt: plain.submittedAt,
    overallScore: plain.overallScore == null ? null : Number(plain.overallScore),
    competencies: Array.isArray(plain.competencies) ? plain.competencies : plain.competencies,
    strengths: Array.isArray(plain.strengths) ? plain.strengths : plain.strengths,
    concerns: Array.isArray(plain.concerns) ? plain.concerns : plain.concerns,
    recommendation: plain.recommendation,
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerOfferPackage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    opportunityId: plain.opportunityId,
    applicationId: plain.applicationId,
    status: plain.status,
    decisionStatus: plain.decisionStatus,
    totalCompValue: plain.totalCompValue == null ? null : Number(plain.totalCompValue),
    baseSalary: plain.baseSalary == null ? null : Number(plain.baseSalary),
    bonusTarget: plain.bonusTarget == null ? null : Number(plain.bonusTarget),
    equityValue: plain.equityValue == null ? null : Number(plain.equityValue),
    benefitsValue: plain.benefitsValue == null ? null : Number(plain.benefitsValue),
    currencyCode: plain.currencyCode,
    notes: plain.notes,
    scenarioModel: plain.scenarioModel,
    legalArchiveUrl: plain.legalArchiveUrl,
    documentsSummary: plain.documentsSummary,
    decisionDeadline: plain.decisionDeadline,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerOfferScenario.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    packageId: plain.packageId,
    label: plain.label,
    baseSalary: plain.baseSalary == null ? null : Number(plain.baseSalary),
    equityValue: plain.equityValue == null ? null : Number(plain.equityValue),
    bonusValue: plain.bonusValue == null ? null : Number(plain.bonusValue),
    benefitsValue: plain.benefitsValue == null ? null : Number(plain.benefitsValue),
    totalValue: plain.totalValue == null ? null : Number(plain.totalValue),
    assumptions: plain.assumptions,
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerOfferDocument.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    packageId: plain.packageId,
    fileName: plain.fileName,
    fileUrl: plain.fileUrl,
    version: plain.version,
    isSigned: plain.isSigned,
    signedAt: plain.signedAt,
    storedAt: plain.storedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerAutoApplyRule.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    name: plain.name,
    description: plain.description,
    status: plain.status,
    criteria: plain.criteria,
    guardrailConfig: plain.guardrailConfig,
    requiresManualReview: plain.requiresManualReview,
    autoSendEnabled: plain.autoSendEnabled,
    sandboxMode: plain.sandboxMode,
    premiumRoleGuardrail: plain.premiumRoleGuardrail,
    lastExecutedAt: plain.lastExecutedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerAutoApplyTestRun.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    ruleId: plain.ruleId,
    status: plain.status,
    executedAt: plain.executedAt,
    evaluatedCount: plain.evaluatedCount,
    matchesCount: plain.matchesCount,
    autoSentCount: plain.autoSentCount,
    rejectionReasons: plain.rejectionReasons,
    notes: plain.notes,
    sampleSubmission: plain.sampleSubmission,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

CareerAutoApplyAnalytics.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    ruleId: plain.ruleId,
    windowStart: plain.windowStart,
    windowEnd: plain.windowEnd,
    submissions: plain.submissions,
    conversions: plain.conversions,
    rejections: plain.rejections,
    manualReviews: plain.manualReviews,
    rejectionReasons: plain.rejectionReasons,
    conversionSignals: plain.conversionSignals,
    lastUpdatedAt: plain.lastUpdatedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

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

User.hasOne(UserDashboardOverview, {
  foreignKey: 'userId',
  as: 'dashboardOverview',
  onDelete: 'CASCADE',
});
UserDashboardOverview.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Profile, { foreignKey: 'userId' });
Profile.belongsTo(User, { foreignKey: 'userId' });
Profile.hasMany(ProfileReference, { as: 'references', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileReference.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
Profile.hasMany(ProfileAppreciation, { as: 'appreciations', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileAppreciation.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
Profile.hasMany(ProfileAdminNote, { as: 'adminNotes', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileAdminNote.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
ProfileAdminNote.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(ProfileAdminNote, { as: 'authoredProfileNotes', foreignKey: 'authorId' });
ProfileAppreciation.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });
Profile.hasMany(ProfileFollower, { as: 'followers', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileFollower.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
ProfileFollower.belongsTo(User, { as: 'follower', foreignKey: 'followerId' });
Profile.hasMany(ProfileEngagementJob, { as: 'engagementJobs', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileEngagementJob.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });

Profile.hasMany(IdentityVerification, { foreignKey: 'profileId', as: 'identityVerifications', onDelete: 'CASCADE' });
IdentityVerification.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });
IdentityVerification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
IdentityVerification.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
User.hasMany(IdentityVerification, { foreignKey: 'userId', as: 'identityVerifications' });
User.hasMany(IdentityVerification, { foreignKey: 'reviewerId', as: 'reviewedIdentityVerifications' });
IdentityVerification.hasMany(IdentityVerificationEvent, {
  foreignKey: 'identityVerificationId',
  as: 'events',
  onDelete: 'CASCADE',
});
IdentityVerificationEvent.belongsTo(IdentityVerification, {
  foreignKey: 'identityVerificationId',
  as: 'identityVerification',
});
IdentityVerificationEvent.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
User.hasMany(IdentityVerificationEvent, { foreignKey: 'actorId', as: 'identityVerificationEvents' });

Profile.hasMany(QualificationCredential, {
  foreignKey: 'profileId',
  as: 'qualificationCredentials',
  onDelete: 'CASCADE',
});
QualificationCredential.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });
QualificationCredential.belongsTo(User, { foreignKey: 'userId', as: 'user' });
QualificationCredential.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
User.hasMany(QualificationCredential, { foreignKey: 'userId', as: 'qualificationCredentials' });
User.hasMany(QualificationCredential, { foreignKey: 'reviewerId', as: 'reviewedQualificationCredentials' });

Profile.hasMany(WalletAccount, { foreignKey: 'profileId', as: 'walletAccounts', onDelete: 'CASCADE' });
WalletAccount.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });
WalletAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(WalletAccount, { foreignKey: 'userId', as: 'walletAccounts' });
WalletAccount.hasMany(WalletLedgerEntry, {
  foreignKey: 'walletAccountId',
  as: 'ledgerEntries',
  onDelete: 'CASCADE',
});
WalletLedgerEntry.belongsTo(WalletAccount, { foreignKey: 'walletAccountId', as: 'walletAccount' });
WalletLedgerEntry.belongsTo(User, { foreignKey: 'initiatedById', as: 'initiatedBy' });
User.hasMany(WalletLedgerEntry, { foreignKey: 'initiatedById', as: 'initiatedLedgerEntries' });

WalletAccount.hasMany(WalletFundingSource, {
  foreignKey: 'walletAccountId',
  as: 'fundingSources',
  onDelete: 'CASCADE',
});
WalletFundingSource.belongsTo(WalletAccount, { foreignKey: 'walletAccountId', as: 'walletAccount' });
WalletFundingSource.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
User.hasMany(WalletFundingSource, { foreignKey: 'userId', as: 'walletFundingSources' });

WalletAccount.hasMany(WalletTransferRule, {
  foreignKey: 'walletAccountId',
  as: 'transferRules',
  onDelete: 'CASCADE',
});
WalletTransferRule.belongsTo(WalletAccount, { foreignKey: 'walletAccountId', as: 'walletAccount' });
WalletTransferRule.belongsTo(WalletFundingSource, { foreignKey: 'fundingSourceId', as: 'fundingSource' });
WalletFundingSource.hasMany(WalletTransferRule, { foreignKey: 'fundingSourceId', as: 'transferRules' });

WalletAccount.hasMany(WalletTransferRequest, {
  foreignKey: 'walletAccountId',
  as: 'transferRequests',
  onDelete: 'CASCADE',
});
WalletTransferRequest.belongsTo(WalletAccount, { foreignKey: 'walletAccountId', as: 'walletAccount' });
WalletTransferRequest.belongsTo(WalletFundingSource, { foreignKey: 'fundingSourceId', as: 'fundingSource' });
WalletFundingSource.hasMany(WalletTransferRequest, { foreignKey: 'fundingSourceId', as: 'transferRequests' });
WalletTransferRequest.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });
WalletTransferRequest.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
User.hasMany(WalletTransferRequest, { foreignKey: 'requestedById', as: 'walletTransferRequests' });
User.hasMany(WalletTransferRequest, { foreignKey: 'approvedById', as: 'approvedWalletTransfers' });
ProviderWorkspace.hasMany(WalletAccount, { foreignKey: 'workspaceId', as: 'walletAccounts' });
WalletAccount.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderWorkspace.hasMany(AgencyWalletFundingSource, { foreignKey: 'workspaceId', as: 'walletFundingSources' });
AgencyWalletFundingSource.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderWorkspace.hasMany(AgencyWalletTransferRule, { foreignKey: 'workspaceId', as: 'walletTransferRules' });
AgencyWalletTransferRule.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyWalletTransferRule.belongsTo(AgencyWalletFundingSource, {
  foreignKey: 'destinationFundingSourceId',
  as: 'destinationFundingSource',
});
AgencyWalletFundingSource.hasMany(AgencyWalletTransferRule, {
  foreignKey: 'destinationFundingSourceId',
  as: 'transferRules',
});
ProviderWorkspace.hasMany(WalletPayoutRequest, { foreignKey: 'workspaceId', as: 'walletPayoutRequests' });
WalletPayoutRequest.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
WalletPayoutRequest.belongsTo(WalletAccount, { foreignKey: 'walletAccountId', as: 'walletAccount' });
WalletAccount.hasMany(WalletPayoutRequest, { foreignKey: 'walletAccountId', as: 'payoutRequests' });
WalletPayoutRequest.belongsTo(AgencyWalletFundingSource, { foreignKey: 'fundingSourceId', as: 'fundingSource' });
AgencyWalletFundingSource.hasMany(WalletPayoutRequest, { foreignKey: 'fundingSourceId', as: 'payoutRequests' });
ProviderWorkspace.hasOne(WalletOperationalSetting, { foreignKey: 'workspaceId', as: 'walletSettings' });
WalletOperationalSetting.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });

WalletAccount.hasMany(EscrowAccount, { foreignKey: 'walletAccountId', as: 'escrowAccounts' });
EscrowAccount.belongsTo(WalletAccount, { foreignKey: 'walletAccountId', as: 'walletAccount' });

CompanyProfile.hasMany(CorporateVerification, {
  foreignKey: 'companyProfileId',
  as: 'corporateVerifications',
  onDelete: 'CASCADE',
});
CorporateVerification.belongsTo(CompanyProfile, { foreignKey: 'companyProfileId', as: 'companyProfile' });

CompanyProfile.hasMany(CompanyProfileFollower, {
  foreignKey: 'companyProfileId',
  as: 'followers',
  onDelete: 'CASCADE',
});
CompanyProfileFollower.belongsTo(CompanyProfile, { foreignKey: 'companyProfileId', as: 'companyProfile' });
CompanyProfileFollower.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
User.hasMany(CompanyProfileFollower, { foreignKey: 'followerId', as: 'companyFollowMemberships' });

CompanyProfile.hasMany(CompanyProfileConnection, {
  foreignKey: 'companyProfileId',
  as: 'connections',
  onDelete: 'CASCADE',
});
CompanyProfileConnection.belongsTo(CompanyProfile, { foreignKey: 'companyProfileId', as: 'companyProfile' });
CompanyProfileConnection.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });
CompanyProfileConnection.belongsTo(CompanyProfile, {
  foreignKey: 'targetCompanyProfileId',
  as: 'targetCompanyProfile',
});
User.hasMany(CompanyProfileConnection, { foreignKey: 'targetUserId', as: 'incomingCompanyConnections' });
AgencyProfile.hasMany(CorporateVerification, {
  foreignKey: 'agencyProfileId',
  as: 'corporateVerifications',
  onDelete: 'CASCADE',
});
CorporateVerification.belongsTo(AgencyProfile, { foreignKey: 'agencyProfileId', as: 'agencyProfile' });

AgencyProfile.hasMany(AgencyCreationItem, {
  foreignKey: 'agencyProfileId',
  as: 'creationItems',
  onDelete: 'CASCADE',
});
AgencyCreationItem.belongsTo(AgencyProfile, { foreignKey: 'agencyProfileId', as: 'agencyProfile' });
AgencyCreationItem.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
AgencyCreationItem.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });
AgencyCreationItem.belongsTo(ProviderWorkspace, { foreignKey: 'ownerWorkspaceId', as: 'workspace' });

AgencyCreationItem.hasMany(AgencyCreationAsset, {
  foreignKey: 'itemId',
  as: 'assets',
  onDelete: 'CASCADE',
});
AgencyCreationAsset.belongsTo(AgencyCreationItem, { foreignKey: 'itemId', as: 'item' });
AgencyCreationAsset.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

AgencyCreationItem.hasMany(AgencyCreationCollaborator, {
  foreignKey: 'itemId',
  as: 'collaborators',
  onDelete: 'CASCADE',
});
AgencyCreationCollaborator.belongsTo(AgencyCreationItem, { foreignKey: 'itemId', as: 'item' });
AgencyCreationCollaborator.belongsTo(User, { foreignKey: 'collaboratorId', as: 'collaborator' });
AgencyCreationCollaborator.belongsTo(User, { foreignKey: 'addedById', as: 'addedBy' });

User.hasMany(AgencyCreationItem, { foreignKey: 'createdById', as: 'createdAgencyItems' });
User.hasMany(AgencyCreationItem, { foreignKey: 'updatedById', as: 'updatedAgencyItems' });
User.hasMany(AgencyCreationAsset, { foreignKey: 'uploadedById', as: 'uploadedAgencyAssets' });
User.hasMany(AgencyCreationCollaborator, { foreignKey: 'collaboratorId', as: 'agencyCollaborations' });
User.hasMany(AgencyCreationCollaborator, { foreignKey: 'addedById', as: 'invitedAgencyCollaborations' });

AgencyProfile.hasMany(AgencyProfileMedia, {
  foreignKey: 'agencyProfileId',
  as: 'media',
  onDelete: 'CASCADE',
});
AgencyProfileMedia.belongsTo(AgencyProfile, { foreignKey: 'agencyProfileId', as: 'agencyProfile' });
AgencyProfile.hasMany(AgencyProfileSkill, {
  foreignKey: 'agencyProfileId',
  as: 'skills',
  onDelete: 'CASCADE',
});
AgencyProfileSkill.belongsTo(AgencyProfile, { foreignKey: 'agencyProfileId', as: 'agencyProfile' });
AgencyProfile.hasMany(AgencyProfileCredential, {
  foreignKey: 'agencyProfileId',
  as: 'credentials',
  onDelete: 'CASCADE',
});
AgencyProfileCredential.belongsTo(AgencyProfile, { foreignKey: 'agencyProfileId', as: 'agencyProfile' });
AgencyProfile.hasMany(AgencyProfileExperience, {
  foreignKey: 'agencyProfileId',
  as: 'experiences',
  onDelete: 'CASCADE',
});
AgencyProfileExperience.belongsTo(AgencyProfile, { foreignKey: 'agencyProfileId', as: 'agencyProfile' });
AgencyProfile.hasMany(AgencyProfileWorkforceSegment, {
  foreignKey: 'agencyProfileId',
  as: 'workforceSegments',
  onDelete: 'CASCADE',
});
AgencyProfileWorkforceSegment.belongsTo(AgencyProfile, { foreignKey: 'agencyProfileId', as: 'agencyProfile' });
CorporateVerification.belongsTo(User, { foreignKey: 'userId', as: 'requestor' });
CorporateVerification.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
User.hasMany(CorporateVerification, { foreignKey: 'userId', as: 'corporateVerifications' });
User.hasMany(CorporateVerification, { foreignKey: 'reviewerId', as: 'reviewedCorporateVerifications' });

User.hasMany(UserLoginAudit, { foreignKey: 'userId', as: 'loginAudits', onDelete: 'CASCADE' });
User.hasMany(UserRole, { foreignKey: 'userId', as: 'roleAssignments', onDelete: 'CASCADE' });
UserRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserRole.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedBy' });
User.hasMany(UserNote, { foreignKey: 'userId', as: 'notes', onDelete: 'CASCADE' });
UserNote.belongsTo(User, { foreignKey: 'userId', as: 'subject' });
UserNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(TwoFactorEnrollment, { foreignKey: 'userId', as: 'twoFactorEnrollments' });
User.hasMany(TwoFactorEnrollment, { foreignKey: 'createdBy', as: 'twoFactorEnrollmentsCreated' });
User.hasMany(TwoFactorEnrollment, { foreignKey: 'reviewedBy', as: 'twoFactorEnrollmentsReviewed' });
User.hasMany(TwoFactorBypass, { foreignKey: 'userId', as: 'twoFactorBypasses' });
User.hasMany(TwoFactorBypass, { foreignKey: 'requestedBy', as: 'twoFactorBypassesRequested' });
User.hasMany(TwoFactorBypass, { foreignKey: 'approvedBy', as: 'twoFactorBypassesApproved' });
User.hasMany(TwoFactorPolicy, { foreignKey: 'createdBy', as: 'twoFactorPoliciesCreated' });
User.hasMany(TwoFactorPolicy, { foreignKey: 'updatedBy', as: 'twoFactorPoliciesUpdated' });
User.hasMany(TwoFactorAuditLog, { foreignKey: 'actorId', as: 'twoFactorAuditEvents' });

TwoFactorEnrollment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
TwoFactorEnrollment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
TwoFactorEnrollment.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

TwoFactorBypass.belongsTo(User, { foreignKey: 'userId', as: 'user' });
TwoFactorBypass.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });
TwoFactorBypass.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

TwoFactorPolicy.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
TwoFactorPolicy.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

TwoFactorAuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
User.hasMany(UserConsent, { foreignKey: 'userId', as: 'consents', onDelete: 'CASCADE' });
UserConsent.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserLoginAudit.belongsTo(User, { foreignKey: 'userId', as: 'user' });

FeatureFlag.hasMany(FeatureFlagAssignment, {
  foreignKey: 'flagId',
  as: 'assignments',
  onDelete: 'CASCADE',
  hooks: true,
});
FeatureFlagAssignment.belongsTo(FeatureFlag, { foreignKey: 'flagId', as: 'flag' });
FeatureFlag.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
FeatureFlag.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });

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

Profile.hasMany(FreelancerPortfolioItem, { as: 'portfolioItems', foreignKey: 'profileId', onDelete: 'SET NULL' });
FreelancerPortfolioItem.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });

User.hasMany(FreelancerPortfolioItem, { as: 'portfolioItems', foreignKey: 'userId', onDelete: 'CASCADE' });
FreelancerPortfolioItem.belongsTo(User, { as: 'freelancer', foreignKey: 'userId' });

FreelancerPortfolioItem.hasMany(FreelancerPortfolioAsset, {
  as: 'assets',
  foreignKey: 'portfolioItemId',
  onDelete: 'CASCADE',
});
FreelancerPortfolioAsset.belongsTo(FreelancerPortfolioItem, { as: 'portfolioItem', foreignKey: 'portfolioItemId' });

User.hasOne(FreelancerPortfolioSetting, { as: 'portfolioSettings', foreignKey: 'userId', onDelete: 'CASCADE' });
FreelancerPortfolioSetting.belongsTo(User, { as: 'freelancer', foreignKey: 'userId' });
Profile.hasOne(FreelancerPortfolioSetting, { as: 'portfolioSettings', foreignKey: 'profileId', onDelete: 'SET NULL' });
FreelancerPortfolioSetting.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
User.hasMany(FreelancerCalendarEvent, {
  foreignKey: 'freelancerId',
  as: 'freelancerCalendarEvents',
  onDelete: 'CASCADE',
});
FreelancerCalendarEvent.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
User.hasMany(FreelancerCalendarEvent, { foreignKey: 'createdById', as: 'createdFreelancerCalendarEvents' });
User.hasMany(FreelancerCalendarEvent, { foreignKey: 'updatedById', as: 'updatedFreelancerCalendarEvents' });
FreelancerCalendarEvent.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
FreelancerCalendarEvent.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });

User.hasOne(CompanyProfile, { foreignKey: 'userId' });
CompanyProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(AgencyProfile, { foreignKey: 'userId' });
AgencyProfile.belongsTo(User, { foreignKey: 'userId' });

ProviderWorkspace.hasMany(AgencyTimelinePost, {
  foreignKey: 'workspaceId',
  as: 'timelinePosts',
  onDelete: 'CASCADE',
});
AgencyTimelinePost.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyTimelinePost.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
AgencyTimelinePost.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
AgencyTimelinePost.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });

AgencyTimelinePost.hasMany(AgencyTimelinePostRevision, {
  foreignKey: 'postId',
  as: 'revisions',
  onDelete: 'CASCADE',
});
AgencyTimelinePostRevision.belongsTo(AgencyTimelinePost, { foreignKey: 'postId', as: 'post' });
AgencyTimelinePostRevision.belongsTo(User, { foreignKey: 'editorId', as: 'editor' });

AgencyTimelinePost.hasMany(AgencyTimelinePostMetric, {
  foreignKey: 'postId',
  as: 'metrics',
  onDelete: 'CASCADE',
});
AgencyTimelinePostMetric.belongsTo(AgencyTimelinePost, { foreignKey: 'postId', as: 'post' });

User.hasOne(FreelancerProfile, { foreignKey: 'userId' });
FreelancerProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(FreelancerDashboardOverview, { foreignKey: 'freelancerId', as: 'dashboardOverview' });
FreelancerDashboardOverview.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
User.hasMany(FreelancerOperationsMembership, {
  foreignKey: 'freelancerId',
  as: 'operationsMemberships',
});
FreelancerOperationsMembership.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
User.hasMany(FreelancerOperationsWorkflow, {
  foreignKey: 'freelancerId',
  as: 'operationsWorkflows',
});
FreelancerOperationsWorkflow.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
User.hasMany(FreelancerOperationsNotice, {
  foreignKey: 'freelancerId',
  as: 'operationsNotices',
});
FreelancerOperationsNotice.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
User.hasOne(FreelancerOperationsSnapshot, { foreignKey: 'freelancerId', as: 'operationsSnapshot' });
FreelancerOperationsSnapshot.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

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

User.hasMany(FreelancerReview, { foreignKey: 'freelancerId', as: 'freelancerReviews' });
FreelancerReview.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

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

AdminCalendarAccount.hasMany(AdminCalendarEvent, { foreignKey: 'calendarAccountId', as: 'events' });
AdminCalendarEvent.belongsTo(AdminCalendarAccount, { foreignKey: 'calendarAccountId', as: 'calendarAccount' });
AdminCalendarTemplate.hasMany(AdminCalendarEvent, { foreignKey: 'templateId', as: 'events' });
AdminCalendarEvent.belongsTo(AdminCalendarTemplate, { foreignKey: 'templateId', as: 'template' });
AdminCalendarAccount.hasMany(AdminCalendarAvailabilityWindow, {
  foreignKey: 'calendarAccountId',
  as: 'availabilityWindows',
});
AdminCalendarAvailabilityWindow.belongsTo(AdminCalendarAccount, {
  foreignKey: 'calendarAccountId',
  as: 'calendarAccount',
});
User.hasOne(UserCalendarSetting, { foreignKey: 'userId', as: 'calendarSettings' });
UserCalendarSetting.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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

GigOrder.hasMany(GigVendorScorecard, { foreignKey: 'orderId', as: 'vendorScorecards' });
GigVendorScorecard.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });
GigVendorScorecard.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
GigVendorScorecard.belongsTo(User, { foreignKey: 'reviewedById', as: 'reviewedBy' });
User.hasMany(GigVendorScorecard, { foreignKey: 'vendorId', as: 'gigVendorScorecards' });
User.hasMany(GigVendorScorecard, { foreignKey: 'reviewedById', as: 'gigVendorScorecardsReviewed' });

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

Project.hasMany(ProjectMilestone, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'milestones',
  onDelete: 'CASCADE',
});
ProjectMilestone.belongsTo(Project, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'project',
});
ProjectMilestone.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Project.hasMany(ProjectCollaborator, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'collaborators',
  onDelete: 'CASCADE',
});
ProjectCollaborator.belongsTo(Project, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'project',
});
ProjectCollaborator.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ProjectCollaborator.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });

Project.hasMany(ProjectIntegration, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'integrations',
  onDelete: 'CASCADE',
});
ProjectIntegration.belongsTo(Project, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'project',
});
ProjectIntegration.belongsTo(User, { foreignKey: 'connectedById', as: 'connectedBy' });

Project.hasMany(ProjectRetrospective, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'retrospectives',
  onDelete: 'CASCADE',
});
ProjectRetrospective.belongsTo(Project, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'project',
});
ProjectRetrospective.belongsTo(ProjectMilestone, { foreignKey: 'milestoneId', as: 'milestone' });
ProjectRetrospective.belongsTo(User, { foreignKey: 'authoredById', as: 'authoredBy' });

User.hasMany(ProjectMilestone, { foreignKey: 'ownerId', as: 'ownedProjectMilestones' });
User.hasMany(ProjectCollaborator, { foreignKey: 'userId', as: 'projectCollaborations' });
User.hasMany(ProjectCollaborator, { foreignKey: 'invitedById', as: 'projectInvitesSent' });
User.hasMany(ProjectIntegration, { foreignKey: 'connectedById', as: 'projectIntegrationsConnected' });
User.hasMany(ProjectRetrospective, { foreignKey: 'authoredById', as: 'authoredProjectRetrospectives' });

ProjectWorkspace.hasMany(ProjectWorkspaceConversation, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'conversations',
  onDelete: 'CASCADE',
});
ProjectWorkspaceConversation.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasOne(ProjectWorkspaceTimeline, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'timeline',
  onDelete: 'CASCADE',
});
ProjectWorkspaceTimeline.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasMany(ProjectWorkspaceTask, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'tasks',
  onDelete: 'CASCADE',
});
ProjectWorkspaceTask.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspaceTask.hasMany(ProjectWorkspaceTaskAssignment, {
  foreignKey: { name: 'taskId', allowNull: false },
  as: 'assignments',
  onDelete: 'CASCADE',
});
ProjectWorkspaceTaskAssignment.belongsTo(ProjectWorkspaceTask, {
  foreignKey: { name: 'taskId', allowNull: false },
  as: 'task',
});
ProjectWorkspaceTaskAssignment.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasMany(ProjectWorkspaceBudgetLine, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'budgetLines',
  onDelete: 'CASCADE',
});
ProjectWorkspaceBudgetLine.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasMany(ProjectWorkspaceTimelineEvent, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'timelineEvents',
  onDelete: 'CASCADE',
});
ProjectWorkspaceTimelineEvent.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasMany(ProjectWorkspaceCalendarEntry, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'calendarEntries',
  onDelete: 'CASCADE',
});
ProjectWorkspaceCalendarEntry.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasMany(ProjectWorkspaceRole, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'roles',
  onDelete: 'CASCADE',
});
ProjectWorkspaceRole.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasMany(ProjectWorkspaceSubmission, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'submissions',
  onDelete: 'CASCADE',
});
ProjectWorkspaceSubmission.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasMany(ProjectWorkspaceInvite, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'invites',
  onDelete: 'CASCADE',
});
ProjectWorkspaceInvite.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasMany(ProjectWorkspaceHrRecord, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'hrRecords',
  onDelete: 'CASCADE',
});
ProjectWorkspaceHrRecord.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasMany(ProjectWorkspaceTimeLog, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'timeLogs',
  onDelete: 'CASCADE',
});
ProjectWorkspaceTimeLog.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspaceTimeLog.belongsTo(ProjectWorkspaceTask, {
  foreignKey: { name: 'taskId', allowNull: true },
  as: 'task',
});
ProjectWorkspace.hasMany(ProjectWorkspaceTarget, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'targets',
  onDelete: 'CASCADE',
});
ProjectWorkspaceTarget.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspace.hasMany(ProjectWorkspaceObjective, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'objectives',
  onDelete: 'CASCADE',
});
ProjectWorkspaceObjective.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspaceConversation.hasMany(ProjectWorkspaceMessage, {
  foreignKey: { name: 'conversationId', allowNull: false },
  as: 'messages',
  onDelete: 'CASCADE',
});
ProjectWorkspaceMessage.belongsTo(ProjectWorkspaceConversation, {
  foreignKey: { name: 'conversationId', allowNull: false },
  as: 'conversation',
});
ProjectWorkspaceMessage.belongsTo(ProjectWorkspace, {
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
ProjectWorkspace.hasMany(ProjectWorkspaceBudget, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'budgets',
  onDelete: 'CASCADE',
});
ProjectWorkspaceBudget.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspaceBudget.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });

ProjectWorkspace.hasMany(ProjectWorkspaceObject, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'objects',
  onDelete: 'CASCADE',
});
ProjectWorkspaceObject.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});

ProjectWorkspace.hasMany(ProjectWorkspaceTimelineEntry, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'timelineEntries',
  onDelete: 'CASCADE',
});
ProjectWorkspaceTimelineEntry.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});
ProjectWorkspaceTimelineEntry.belongsTo(ProjectWorkspaceObject, {
  foreignKey: { name: 'relatedObjectId', allowNull: true },
  as: 'relatedObject',
});
ProjectWorkspaceObject.hasMany(ProjectWorkspaceTimelineEntry, {
  foreignKey: { name: 'relatedObjectId', allowNull: true },
  as: 'timelineEntries',
});

ProjectWorkspace.hasMany(ProjectWorkspaceMeeting, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'meetings',
  onDelete: 'CASCADE',
});
ProjectWorkspaceMeeting.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});

ProjectWorkspace.hasMany(ProjectWorkspaceRole, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'roles',
  onDelete: 'CASCADE',
});
ProjectWorkspaceRole.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});

ProjectWorkspace.hasMany(ProjectWorkspaceSubmission, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'submissions',
  onDelete: 'CASCADE',
});
ProjectWorkspaceSubmission.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});

ProjectWorkspace.hasMany(ProjectWorkspaceInvite, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'invites',
  onDelete: 'CASCADE',
});
ProjectWorkspaceInvite.belongsTo(ProjectWorkspace, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'workspace',
});

ProjectWorkspace.hasMany(ProjectWorkspaceHrRecord, {
  foreignKey: { name: 'workspaceId', allowNull: false },
  as: 'hrRecords',
  onDelete: 'CASCADE',
});
ProjectWorkspaceHrRecord.belongsTo(ProjectWorkspace, {
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
User.hasOne(FreelancerAutoMatchPreference, { foreignKey: 'freelancerId', as: 'autoMatchPreference' });
FreelancerAutoMatchPreference.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
AutoAssignQueueEntry.hasOne(AutoAssignResponse, { foreignKey: 'queueEntryId', as: 'response' });
AutoAssignResponse.belongsTo(AutoAssignQueueEntry, { foreignKey: 'queueEntryId', as: 'queueEntry' });
AutoAssignResponse.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
User.hasMany(AutoAssignResponse, { foreignKey: 'freelancerId', as: 'autoAssignResponses' });

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
FeedPost.hasMany(FeedComment, { foreignKey: 'postId', as: 'comments' });
FeedComment.belongsTo(FeedPost, { foreignKey: 'postId', as: 'post' });
FeedComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
FeedComment.hasMany(FeedComment, { foreignKey: 'parentId', as: 'replies' });
FeedComment.belongsTo(FeedComment, { foreignKey: 'parentId', as: 'parent' });
FeedPost.hasMany(FeedReaction, { foreignKey: 'postId', as: 'reactions' });
FeedReaction.belongsTo(FeedPost, { foreignKey: 'postId', as: 'post' });
FeedReaction.belongsTo(User, { foreignKey: 'userId', as: 'actor' });

User.hasOne(FreelancerTimelineWorkspace, { foreignKey: 'freelancerId', as: 'timelineWorkspace' });
FreelancerTimelineWorkspace.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

FreelancerTimelineWorkspace.hasMany(FreelancerTimelinePost, { foreignKey: 'workspaceId', as: 'posts' });
FreelancerTimelineWorkspace.hasMany(FreelancerTimelineEntry, { foreignKey: 'workspaceId', as: 'entries' });
FreelancerTimelinePost.belongsTo(FreelancerTimelineWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
FreelancerTimelineEntry.belongsTo(FreelancerTimelineWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });

User.hasMany(FreelancerTimelinePost, { foreignKey: 'freelancerId', as: 'timelinePosts' });
FreelancerTimelinePost.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerTimelineEntry, { foreignKey: 'freelancerId', as: 'timelineEntries' });
FreelancerTimelineEntry.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

FreelancerTimelineEntry.belongsTo(FreelancerTimelinePost, { foreignKey: 'linkedPostId', as: 'linkedPost' });
FreelancerTimelinePost.hasMany(FreelancerTimelineEntry, { foreignKey: 'linkedPostId', as: 'linkedEntries' });

FreelancerTimelinePost.hasMany(FreelancerTimelinePostMetric, { foreignKey: 'postId', as: 'metrics' });
FreelancerTimelinePostMetric.belongsTo(FreelancerTimelinePost, { foreignKey: 'postId', as: 'post' });

User.hasMany(FreelancerTimelinePostMetric, { foreignKey: 'freelancerId', as: 'timelineMetrics' });
FreelancerTimelinePostMetric.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.belongsToMany(Group, { through: GroupMembership, foreignKey: 'userId' });
Group.belongsToMany(User, { through: GroupMembership, foreignKey: 'groupId' });
Group.hasMany(GroupMembership, { foreignKey: 'groupId', as: 'memberships' });
GroupMembership.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
GroupMembership.belongsTo(User, { foreignKey: 'userId', as: 'member' });
GroupMembership.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });
Group.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
Group.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });
User.hasMany(GroupMembership, { foreignKey: 'userId', as: 'groupMemberships' });

Group.hasMany(GroupInvite, { foreignKey: 'groupId', as: 'invites' });
GroupInvite.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
GroupInvite.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });
User.hasMany(GroupInvite, { foreignKey: 'invitedById', as: 'groupInvitesSent' });

Group.hasMany(GroupPost, { foreignKey: 'groupId', as: 'posts' });
GroupPost.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
GroupPost.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
GroupPost.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });
User.hasMany(GroupPost, { foreignKey: 'createdById', as: 'groupPostsAuthored' });

Page.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
Page.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });
User.hasMany(Page, { foreignKey: 'createdById', as: 'pagesCreated' });

Page.hasMany(PageMembership, { foreignKey: 'pageId', as: 'memberships' });
PageMembership.belongsTo(Page, { foreignKey: 'pageId', as: 'page' });
PageMembership.belongsTo(User, { foreignKey: 'userId', as: 'member' });
PageMembership.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });
User.hasMany(PageMembership, { foreignKey: 'userId', as: 'pageMemberships' });

Page.hasMany(PageInvite, { foreignKey: 'pageId', as: 'invites' });
PageInvite.belongsTo(Page, { foreignKey: 'pageId', as: 'page' });
PageInvite.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });
User.hasMany(PageInvite, { foreignKey: 'invitedById', as: 'pageInvitesSent' });

Page.hasMany(PagePost, { foreignKey: 'pageId', as: 'posts' });
PagePost.belongsTo(Page, { foreignKey: 'pageId', as: 'page' });
PagePost.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
PagePost.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });
User.hasMany(PagePost, { foreignKey: 'createdById', as: 'pagePostsAuthored' });

User.belongsToMany(User, {
  through: Connection,
  as: 'connections',
  foreignKey: 'requesterId',
  otherKey: 'addresseeId',
});
Connection.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
Connection.belongsTo(User, { foreignKey: 'addresseeId', as: 'addressee' });

User.hasMany(Application, { foreignKey: 'applicantId', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });
Application.belongsTo(Job, { foreignKey: 'targetId', constraints: false, as: 'jobTarget' });
Job.hasMany(Application, { foreignKey: 'targetId', constraints: false, as: 'jobApplications' });

Application.hasMany(ApplicationReview, { foreignKey: 'applicationId', as: 'reviews' });
ApplicationReview.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });
ApplicationReview.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

User.hasMany(JobApplicationFavourite, { foreignKey: 'userId', as: 'jobApplicationFavourites' });
JobApplicationFavourite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
JobApplicationFavourite.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
Job.hasMany(JobApplicationFavourite, { foreignKey: 'jobId', as: 'jobApplicationFavourites' });

User.hasMany(JobApplicationInterview, { foreignKey: 'userId', as: 'jobApplicationInterviews' });
JobApplicationInterview.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Application.hasMany(JobApplicationInterview, { foreignKey: 'applicationId', as: 'jobInterviews' });
JobApplicationInterview.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

User.hasMany(JobApplicationResponse, { foreignKey: 'userId', as: 'jobApplicationResponses' });
JobApplicationResponse.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Application.hasMany(JobApplicationResponse, { foreignKey: 'applicationId', as: 'jobResponses' });
JobApplicationResponse.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

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

Application.hasMany(CandidateSatisfactionSurvey, { foreignKey: 'applicationId', as: 'surveys' });
CandidateSatisfactionSurvey.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Job.hasMany(JobApprovalWorkflow, { foreignKey: 'jobId', as: 'approvalWorkflow' });
JobApprovalWorkflow.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

Job.hasMany(JobCampaignPerformance, { foreignKey: 'jobId', as: 'campaignPerformance' });
JobCampaignPerformance.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

Job.hasOne(JobPostAdminDetail, { foreignKey: 'jobId', as: 'adminDetail', onDelete: 'CASCADE' });
JobPostAdminDetail.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
Job.hasOne(JobAdvert, { foreignKey: 'jobId', as: 'advert' });
JobAdvert.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobAdvert.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobAdvert.hasMany(JobFavorite, { foreignKey: 'jobId', sourceKey: 'jobId', as: 'favorites' });
JobAdvert.hasMany(JobKeyword, { foreignKey: 'jobId', sourceKey: 'jobId', as: 'keywords' });
JobAdvert.hasMany(JobAdvertHistory, { foreignKey: 'jobId', sourceKey: 'jobId', as: 'history' });
JobAdvert.hasMany(JobCandidateResponse, { foreignKey: 'jobId', sourceKey: 'jobId', as: 'candidateResponses' });
JobAdvert.hasMany(JobCandidateNote, { foreignKey: 'jobId', sourceKey: 'jobId', as: 'candidateNotes' });

Job.hasMany(JobFavorite, { foreignKey: 'jobId', as: 'favorites' });
JobFavorite.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobFavorite.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobFavorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
JobFavorite.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

Job.hasMany(JobKeyword, { foreignKey: 'jobId', as: 'keywords' });
JobKeyword.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

Job.hasMany(JobAdvertHistory, { foreignKey: 'jobId', as: 'history' });
JobAdvertHistory.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobAdvertHistory.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobAdvertHistory.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

Job.hasMany(JobCandidateResponse, { foreignKey: 'jobId', as: 'candidateResponses' });
JobCandidateResponse.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobCandidateResponse.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });
JobCandidateResponse.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobCandidateResponse.belongsTo(User, { foreignKey: 'respondentId', as: 'respondent' });

Application.hasMany(JobCandidateNote, { foreignKey: 'applicationId', as: 'jobNotes' });
JobCandidateNote.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });
JobCandidateNote.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobCandidateNote.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobCandidateNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

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
ExperienceLaunchpadApplication.hasMany(ExperienceLaunchpadPlacement, {
  foreignKey: 'candidateId',
  as: 'placements',
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

Project.hasMany(ProjectOperationalSnapshot, { foreignKey: 'projectId', as: 'operationalSnapshots' });
ProjectOperationalSnapshot.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ProjectOperationalSnapshot.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });

Project.hasMany(ProjectDependencyLink, { foreignKey: 'projectId', as: 'dependencyLinks' });
ProjectDependencyLink.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ProjectDependencyLink.belongsTo(Project, { foreignKey: 'dependentProjectId', as: 'dependentProject' });
ProjectDependencyLink.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });

NetworkingSession.belongsTo(ProviderWorkspace, { foreignKey: 'companyId', as: 'company' });
NetworkingSession.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
NetworkingSession.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });
NetworkingSession.hasMany(NetworkingSessionRotation, { foreignKey: 'sessionId', as: 'rotations' });
NetworkingSessionRotation.belongsTo(NetworkingSession, { foreignKey: 'sessionId', as: 'session' });
NetworkingSession.hasMany(NetworkingSessionSignup, { foreignKey: 'sessionId', as: 'signups' });
NetworkingSessionSignup.belongsTo(NetworkingSession, { foreignKey: 'sessionId', as: 'session' });
NetworkingSessionSignup.belongsTo(NetworkingBusinessCard, { foreignKey: 'businessCardId', as: 'businessCard' });
NetworkingSessionSignup.belongsTo(User, { foreignKey: 'participantId', as: 'participant' });
NetworkingSession.hasMany(NetworkingSessionOrder, { foreignKey: 'sessionId', as: 'orders' });
NetworkingSessionOrder.belongsTo(NetworkingSession, { foreignKey: 'sessionId', as: 'session' });
NetworkingSessionOrder.belongsTo(User, { foreignKey: 'purchaserId', as: 'purchaser' });
User.hasMany(NetworkingSessionOrder, { foreignKey: 'purchaserId', as: 'networkingOrders' });
NetworkingBusinessCard.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
NetworkingBusinessCard.belongsTo(ProviderWorkspace, { foreignKey: 'companyId', as: 'company' });
NetworkingBusinessCard.hasMany(NetworkingSessionSignup, { foreignKey: 'businessCardId', as: 'signups' });
NetworkingSession.hasMany(NetworkingConnection, { foreignKey: 'sessionId', as: 'connections' });
NetworkingConnection.belongsTo(NetworkingSession, { foreignKey: 'sessionId', as: 'session' });
NetworkingConnection.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
NetworkingConnection.belongsTo(User, { foreignKey: 'connectionUserId', as: 'contact' });
User.hasMany(NetworkingConnection, { foreignKey: 'ownerId', as: 'networkingConnections' });
User.hasMany(NetworkingConnection, { foreignKey: 'connectionUserId', as: 'networkingContacts' });
NetworkingConnection.belongsTo(NetworkingSessionSignup, { foreignKey: 'sourceSignupId', as: 'sourceSignup' });
NetworkingConnection.belongsTo(NetworkingSessionSignup, { foreignKey: 'targetSignupId', as: 'targetSignup' });
NetworkingConnection.belongsTo(User, { foreignKey: 'sourceParticipantId', as: 'sourceParticipant' });
NetworkingConnection.belongsTo(User, { foreignKey: 'targetParticipantId', as: 'targetParticipant' });
NetworkingSessionSignup.hasMany(NetworkingConnection, { foreignKey: 'sourceSignupId', as: 'outboundConnections' });
NetworkingSessionSignup.hasMany(NetworkingConnection, { foreignKey: 'targetSignupId', as: 'inboundConnections' });

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

Project.hasMany(QualityReviewRun, { foreignKey: 'projectId', as: 'qualityReviews' });
QualityReviewRun.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
QualityReviewRun.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
QualityReviewRun.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });

Project.hasMany(FinancialEngagementSummary, { foreignKey: 'projectId', as: 'financialSummaries' });
FinancialEngagementSummary.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

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
ClientSuccessReviewNudge.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });
ClientSuccessReviewNudge.belongsTo(Gig, { foreignKey: 'gigId', as: 'gig' });
ClientSuccessReviewNudge.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
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
    orderId: { type: DataTypes.INTEGER, allowNull: true },
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
    meetingLocation: { type: DataTypes.STRING(255), allowNull: true },
    meetingType: { type: DataTypes.STRING(80), allowNull: true },
    recordingUrl: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    adminOwnerId: { type: DataTypes.INTEGER, allowNull: true },
    followUpAt: { type: DataTypes.DATE, allowNull: true },
    feedbackRating: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    feedbackSummary: { type: DataTypes.TEXT, allowNull: true },
    cancellationReason: { type: DataTypes.TEXT, allowNull: true },
    meetingProvider: { type: DataTypes.STRING(120), allowNull: true },
    resourceLinks: { type: jsonType, allowNull: true },
    pricePaid: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    feedbackRequested: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'peer_mentoring_sessions' },
);

export const MentoringSessionNote = sequelize.define(
  'MentoringSessionNote',
  {
    sessionId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    visibility: {
      type: DataTypes.ENUM(...MENTORING_SESSION_NOTE_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
    },
    body: { type: DataTypes.TEXT, allowNull: false },
    attachments: { type: jsonType, allowNull: true },
  },
  { tableName: 'mentoring_session_notes' },
);

export const MentoringSessionActionItem = sequelize.define(
  'MentoringSessionActionItem',
  {
    sessionId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...MENTORING_SESSION_ACTION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM(...MENTORING_SESSION_ACTION_PRIORITIES),
      allowNull: false,
      defaultValue: 'normal',
    },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    assigneeId: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'mentoring_session_action_items' },
);
export const MentorshipOrder = sequelize.define(
  'MentorshipOrder',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    mentorId: { type: DataTypes.INTEGER, allowNull: false },
    packageName: { type: DataTypes.STRING(180), allowNull: false },
    packageDescription: { type: DataTypes.TEXT, allowNull: true },
    sessionsPurchased: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    sessionsRedeemed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...MENTORSHIP_ORDER_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    purchasedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'mentorship_orders' },
);

export const SpeedNetworkingSession = sequelize.define(
  'SpeedNetworkingSession',
  {
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...SPEED_NETWORKING_SESSION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    accessLevel: {
      type: DataTypes.ENUM(...SPEED_NETWORKING_ACCESS_LEVELS),
      allowNull: false,
      defaultValue: 'invite_only',
    },
    visibility: {
      type: DataTypes.ENUM(...SPEED_NETWORKING_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
    },
    hostId: { type: DataTypes.INTEGER, allowNull: true },
    adminOwnerId: { type: DataTypes.INTEGER, allowNull: true },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    roundDurationSeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 300 },
    totalRounds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 4 },
    bufferSeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
    scheduledStart: { type: DataTypes.DATE, allowNull: true },
    scheduledEnd: { type: DataTypes.DATE, allowNull: true },
    timezone: { type: DataTypes.STRING(80), allowNull: true },
    registrationCloseAt: { type: DataTypes.DATE, allowNull: true },
    meetingProvider: { type: DataTypes.STRING(120), allowNull: true },
    meetingUrl: { type: DataTypes.STRING(255), allowNull: true },
    lobbyUrl: { type: DataTypes.STRING(255), allowNull: true },
    instructions: { type: DataTypes.TEXT, allowNull: true },
    matchingStrategy: {
      type: DataTypes.ENUM(...SPEED_NETWORKING_MATCHING_STRATEGIES),
      allowNull: false,
      defaultValue: 'round_robin',
    },
    tags: { type: jsonType, allowNull: true },
    settings: { type: jsonType, allowNull: true },
    assets: { type: jsonType, allowNull: true },
  },
  { tableName: 'speed_networking_sessions' },
);

export const SpeedNetworkingRoom = sequelize.define(
  'SpeedNetworkingRoom',
  {
    sessionId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    topic: { type: DataTypes.STRING(255), allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    isLocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    meetingUrl: { type: DataTypes.STRING(255), allowNull: true },
    facilitatorId: { type: DataTypes.INTEGER, allowNull: true },
    rotationIntervalSeconds: { type: DataTypes.INTEGER, allowNull: true },
    instructions: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'speed_networking_rooms' },
);

export const SpeedNetworkingParticipant = sequelize.define(
  'SpeedNetworkingParticipant',
  {
    sessionId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    fullName: { type: DataTypes.STRING(180), allowNull: true },
    role: {
      type: DataTypes.ENUM(...SPEED_NETWORKING_PARTICIPANT_ROLES),
      allowNull: false,
      defaultValue: 'attendee',
    },
    status: {
      type: DataTypes.ENUM(...SPEED_NETWORKING_PARTICIPANT_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
    },
    assignedRoomId: { type: DataTypes.INTEGER, allowNull: true },
    checkInAt: { type: DataTypes.DATE, allowNull: true },
    lastMatchedAt: { type: DataTypes.DATE, allowNull: true },
    interests: { type: jsonType, allowNull: true },
    goals: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'speed_networking_participants' },
);

export const MentorFavourite = sequelize.define(
  'MentorFavourite',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    mentorId: { type: DataTypes.INTEGER, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'mentor_favourites',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'mentorId'],
        name: 'mentor_favourites_user_mentor_unique',
      },
    ],
  },
);

export const MentorRecommendation = sequelize.define(
  'MentorRecommendation',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    mentorId: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    source: { type: DataTypes.STRING(120), allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'mentor_recommendations' },
);

export const MentorReview = sequelize.define(
  'MentorReview',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    mentorId: { type: DataTypes.INTEGER, allowNull: false },
    sessionId: { type: DataTypes.INTEGER, allowNull: true },
    orderId: { type: DataTypes.INTEGER, allowNull: true },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    wouldRecommend: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    headline: { type: DataTypes.STRING(200), allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    praiseHighlights: { type: jsonType, allowNull: true },
    improvementAreas: { type: jsonType, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'mentor_reviews' },
);
export const AgencyMentoringSession = sequelize.define(
  'AgencyMentoringSession',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    purchaseId: { type: DataTypes.INTEGER, allowNull: true },
    mentorId: { type: DataTypes.INTEGER, allowNull: true },
    mentorName: { type: DataTypes.STRING(255), allowNull: true },
    mentorEmail: { type: DataTypes.STRING(255), allowNull: true },
    clientName: { type: DataTypes.STRING(255), allowNull: true },
    clientEmail: { type: DataTypes.STRING(255), allowNull: true },
    clientCompany: { type: DataTypes.STRING(255), allowNull: true },
    focusArea: { type: DataTypes.STRING(255), allowNull: true },
    agenda: { type: DataTypes.TEXT, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...AGENCY_MENTORING_SESSION_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    meetingUrl: { type: DataTypes.STRING(255), allowNull: true },
    recordingUrl: { type: DataTypes.STRING(255), allowNull: true },
    followUpActions: { type: DataTypes.TEXT, allowNull: true },
    sessionNotes: { type: DataTypes.TEXT, allowNull: true },
    sessionTags: { type: jsonType, allowNull: true },
    costAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_mentoring_sessions',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['mentorId'] },
      { fields: ['scheduledAt'] },
      { fields: ['status'] },
    ],
  },
);

export const AgencyMentoringPurchase = sequelize.define(
  'AgencyMentoringPurchase',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    mentorId: { type: DataTypes.INTEGER, allowNull: true },
    mentorName: { type: DataTypes.STRING(255), allowNull: true },
    mentorEmail: { type: DataTypes.STRING(255), allowNull: true },
    packageName: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    sessionsIncluded: { type: DataTypes.INTEGER, allowNull: true },
    sessionsUsed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    purchasedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    validFrom: { type: DataTypes.DATE, allowNull: true },
    validUntil: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM(...AGENCY_MENTORING_PURCHASE_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    invoiceUrl: { type: DataTypes.STRING(255), allowNull: true },
    referenceCode: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'agency_mentoring_purchases',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['mentorId'] },
      { fields: ['status'] },
      { fields: ['purchasedAt'] },
    ],
  },
);

export const AgencyMentorPreference = sequelize.define(
  'AgencyMentorPreference',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    mentorId: { type: DataTypes.INTEGER, allowNull: true },
    mentorName: { type: DataTypes.STRING(255), allowNull: false },
    mentorEmail: { type: DataTypes.STRING(255), allowNull: true },
    preferenceLevel: {
      type: DataTypes.ENUM(...AGENCY_MENTOR_PREFERENCE_LEVELS),
      allowNull: false,
      defaultValue: 'preferred',
    },
    favourite: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    introductionNotes: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    lastEngagedAt: { type: DataTypes.DATE, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_mentor_preferences',
    indexes: [
      { unique: true, fields: ['workspaceId', 'mentorEmail'] },
      { unique: true, fields: ['workspaceId', 'mentorId'], where: { mentorId: { [Op.ne]: null } } },
      { fields: ['workspaceId'] },
      { fields: ['mentorId'] },
      { fields: ['preferenceLevel'] },
    ],
  },
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
PeerMentoringSession.belongsTo(User, { foreignKey: 'adminOwnerId', as: 'adminOwner' });
PeerMentoringSession.belongsTo(MentorshipOrder, { foreignKey: 'orderId', as: 'order' });
User.hasMany(PeerMentoringSession, { foreignKey: 'mentorId', as: 'mentoringSessionsLed' });
User.hasMany(PeerMentoringSession, { foreignKey: 'menteeId', as: 'mentoringSessions' });
MentorshipOrder.belongsTo(User, { foreignKey: 'userId', as: 'mentee' });
MentorshipOrder.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
MentorshipOrder.hasMany(PeerMentoringSession, { foreignKey: 'orderId', as: 'sessions' });
User.hasMany(MentorshipOrder, { foreignKey: 'userId', as: 'mentorshipOrders' });
User.hasMany(MentorshipOrder, { foreignKey: 'mentorId', as: 'mentorshipSales' });

SpeedNetworkingSession.belongsTo(User, { foreignKey: 'hostId', as: 'host' });
SpeedNetworkingSession.belongsTo(User, { foreignKey: 'adminOwnerId', as: 'adminOwner' });
SpeedNetworkingSession.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
SpeedNetworkingSession.hasMany(SpeedNetworkingRoom, { foreignKey: 'sessionId', as: 'rooms' });
SpeedNetworkingSession.hasMany(SpeedNetworkingParticipant, { foreignKey: 'sessionId', as: 'participants' });

SpeedNetworkingRoom.belongsTo(SpeedNetworkingSession, { foreignKey: 'sessionId', as: 'session' });
SpeedNetworkingRoom.belongsTo(User, { foreignKey: 'facilitatorId', as: 'facilitator' });
SpeedNetworkingRoom.hasMany(SpeedNetworkingParticipant, { foreignKey: 'assignedRoomId', as: 'assignedParticipants' });

SpeedNetworkingParticipant.belongsTo(SpeedNetworkingSession, { foreignKey: 'sessionId', as: 'session' });
SpeedNetworkingParticipant.belongsTo(SpeedNetworkingRoom, { foreignKey: 'assignedRoomId', as: 'assignedRoom' });
SpeedNetworkingParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SpeedNetworkingParticipant.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
SpeedNetworkingParticipant.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });

MentorFavourite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
MentorFavourite.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
User.hasMany(MentorFavourite, { foreignKey: 'userId', as: 'mentorFavourites' });
User.hasMany(MentorFavourite, { foreignKey: 'mentorId', as: 'favouritedBy' });
MentorRecommendation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
MentorRecommendation.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
User.hasMany(MentorRecommendation, { foreignKey: 'userId', as: 'mentorRecommendations' });
User.hasMany(MentorRecommendation, { foreignKey: 'mentorId', as: 'recommendedMentorInsights' });
MentorReview.belongsTo(User, { foreignKey: 'userId', as: 'reviewer' });
MentorReview.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
MentorReview.belongsTo(PeerMentoringSession, { foreignKey: 'sessionId', as: 'session' });
MentorReview.belongsTo(MentorshipOrder, { foreignKey: 'orderId', as: 'order' });
User.hasMany(MentorReview, { foreignKey: 'userId', as: 'mentorReviews' });
User.hasMany(MentorReview, { foreignKey: 'mentorId', as: 'mentorFeedback' });
PeerMentoringSession.hasMany(MentorReview, { foreignKey: 'sessionId', as: 'reviews' });
MentorshipOrder.hasMany(MentorReview, { foreignKey: 'orderId', as: 'reviews' });

ProviderWorkspace.hasMany(AgencyMentoringSession, { foreignKey: 'workspaceId', as: 'mentoringSessions' });
AgencyMentoringSession.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyMentoringSession.belongsTo(AgencyMentoringPurchase, { foreignKey: 'purchaseId', as: 'purchase' });
AgencyMentoringSession.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
AgencyMentoringSession.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
User.hasMany(AgencyMentoringSession, { foreignKey: 'mentorId', as: 'agencyMentoringSessionsLed' });
User.hasMany(AgencyMentoringSession, { foreignKey: 'createdBy', as: 'agencyMentoringSessionsCreated' });

ProviderWorkspace.hasMany(AgencyMentoringPurchase, { foreignKey: 'workspaceId', as: 'mentoringPurchases' });
AgencyMentoringPurchase.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyMentoringPurchase.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
AgencyMentoringPurchase.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
AgencyMentoringPurchase.hasMany(AgencyMentoringSession, { foreignKey: 'purchaseId', as: 'sessions' });

ProviderWorkspace.hasMany(AgencyMentorPreference, { foreignKey: 'workspaceId', as: 'mentorPreferences' });
AgencyMentorPreference.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyMentorPreference.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
AgencyMentorPreference.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });

PeerMentoringSession.hasMany(MentoringSessionNote, { foreignKey: 'sessionId', as: 'sessionNotes' });
MentoringSessionNote.belongsTo(PeerMentoringSession, { foreignKey: 'sessionId', as: 'session' });
MentoringSessionNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(MentoringSessionNote, { foreignKey: 'authorId', as: 'authoredMentoringNotes' });

PeerMentoringSession.hasMany(MentoringSessionActionItem, { foreignKey: 'sessionId', as: 'actionItems' });
MentoringSessionActionItem.belongsTo(PeerMentoringSession, { foreignKey: 'sessionId', as: 'session' });
MentoringSessionActionItem.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
MentoringSessionActionItem.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
User.hasMany(MentoringSessionActionItem, { foreignKey: 'assigneeId', as: 'assignedMentoringActions' });
User.hasMany(MentoringSessionActionItem, { foreignKey: 'createdById', as: 'createdMentoringActions' });

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

CareerDocument.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
CareerDocument.belongsTo(CareerDocumentVersion, {
  foreignKey: 'baselineVersionId',
  as: 'baselineVersion',
});
CareerDocument.belongsTo(CareerDocumentVersion, {
  foreignKey: 'latestVersionId',
  as: 'latestVersion',
});
CareerDocument.hasMany(CareerDocumentVersion, { foreignKey: 'documentId', as: 'versions' });
CareerDocument.hasMany(CareerDocumentCollaborator, { foreignKey: 'documentId', as: 'collaborators' });
CareerDocument.hasMany(CareerDocumentAnalytics, { foreignKey: 'documentId', as: 'analytics' });
CareerDocument.hasMany(CareerDocumentExport, { foreignKey: 'documentId', as: 'exports' });
CareerDocumentVersion.belongsTo(CareerDocument, { foreignKey: 'documentId', as: 'document' });
CareerDocumentVersion.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
CareerDocumentVersion.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
CareerDocumentCollaborator.belongsTo(CareerDocument, { foreignKey: 'documentId', as: 'document' });
CareerDocumentCollaborator.belongsTo(User, { foreignKey: 'collaboratorId', as: 'collaborator' });
CareerDocumentExport.belongsTo(CareerDocument, { foreignKey: 'documentId', as: 'document' });
CareerDocumentExport.belongsTo(CareerDocumentVersion, { foreignKey: 'versionId', as: 'version' });
CareerDocumentExport.belongsTo(User, { foreignKey: 'exportedById', as: 'exportedBy' });
CareerDocumentAnalytics.belongsTo(CareerDocument, { foreignKey: 'documentId', as: 'document' });
CareerDocumentAnalytics.belongsTo(CareerDocumentVersion, { foreignKey: 'versionId', as: 'version' });
CareerDocumentAnalytics.belongsTo(User, { foreignKey: 'viewerId', as: 'viewer' });
CareerStoryBlock.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
CareerBrandAsset.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
CareerBrandAsset.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

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
User.hasOne(UserSecurityPreference, {
  foreignKey: 'userId',
  as: 'securityPreference',
  onDelete: 'CASCADE',
});
UserSecurityPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(DataExportRequest, { foreignKey: 'userId', as: 'dataExportRequests', onDelete: 'CASCADE' });
DataExportRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserWebsitePreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserWebsitePreference, { foreignKey: 'userId', as: 'websitePreferences' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(EmployerBrandStory, { foreignKey: 'authorId', as: 'authoredBrandStories' });
User.hasMany(EmployeeJourneyProgram, { foreignKey: 'ownerId', as: 'managedJourneyPrograms' });

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

InterviewSchedule.hasMany(InterviewReminder, { foreignKey: 'interviewScheduleId', as: 'reminders' });
InterviewReminder.belongsTo(InterviewSchedule, { foreignKey: 'interviewScheduleId', as: 'schedule' });

InterviewSchedule.hasMany(InterviewEvaluation, { foreignKey: 'interviewScheduleId', as: 'evaluations' });
InterviewEvaluation.belongsTo(InterviewSchedule, { foreignKey: 'interviewScheduleId', as: 'schedule' });

InterviewPanelTemplate.hasMany(InterviewEvaluation, { foreignKey: 'templateId', as: 'evaluations' });
InterviewEvaluation.belongsTo(InterviewPanelTemplate, { foreignKey: 'templateId', as: 'template' });

Application.hasMany(CandidateDemographicSnapshot, { foreignKey: 'applicationId', as: 'demographics' });
CandidateDemographicSnapshot.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });
DeliverableVersion.belongsTo(DeliverableVaultItem, { foreignKey: 'itemId', as: 'item' });
DeliverableVersion.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

DeliverableDeliveryPackage.belongsTo(DeliverableVaultItem, { foreignKey: 'itemId', as: 'item' });
DeliverableDeliveryPackage.belongsTo(User, { foreignKey: 'generatedById', as: 'generatedBy' });

Application.hasMany(InterviewEvaluation, { foreignKey: 'applicationId', as: 'interviewEvaluations' });
InterviewEvaluation.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Application.hasMany(CandidatePrepPortal, { foreignKey: 'applicationId', as: 'prepPortals' });
CandidatePrepPortal.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Application.hasMany(DecisionTracker, { foreignKey: 'applicationId', as: 'decisionTrackers' });
DecisionTracker.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Application.hasMany(OfferPackage, { foreignKey: 'applicationId', as: 'offerPackages' });
OfferPackage.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Application.hasMany(OnboardingTask, { foreignKey: 'applicationId', as: 'onboardingTasks' });
OnboardingTask.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Application.hasMany(CandidateCareTicket, { foreignKey: 'applicationId', as: 'careTickets' });
CandidateCareTicket.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Job.hasMany(JobStage, { foreignKey: 'jobId', as: 'stages' });
JobStage.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
User.hasMany(SearchSubscription, { foreignKey: 'userId', as: 'searchSubscriptions' });
SearchSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

AnalyticsEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export const TalentCandidate = sequelize.define(
  'TalentCandidate',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    fullName: { type: DataTypes.STRING(191), allowNull: false },
    email: { type: DataTypes.STRING(191), allowNull: true },
    phone: { type: DataTypes.STRING(60), allowNull: true },
    candidateType: {
      type: DataTypes.ENUM(...TALENT_CANDIDATE_TYPES),
      allowNull: false,
      defaultValue: 'permanent',
    },
    status: {
      type: DataTypes.ENUM(...TALENT_CANDIDATE_STATUSES),
      allowNull: false,
      defaultValue: 'prospect',
    },
    pipelineStage: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'prospect' },
    source: { type: DataTypes.STRING(120), allowNull: true },
    department: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(120), allowNull: true },
    experienceLevel: { type: DataTypes.STRING(60), allowNull: true },
    preferredEngagement: { type: DataTypes.STRING(60), allowNull: true },
    diversityTags: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    hiredAt: { type: DataTypes.DATE, allowNull: true },
    onboardingStatus: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'not_started',
    },
    exitWorkflowStatus: {
      type: DataTypes.ENUM('not_applicable', 'preparing', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'not_applicable',
    },
    timeToFillDays: { type: DataTypes.INTEGER, allowNull: true },
    compensationExpectation: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationCurrency: { type: DataTypes.STRING(3), allowNull: true },
  },
  {
    tableName: 'talent_candidates',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['pipelineStage'] },
      { fields: ['candidateType'] },
    ],
  },
);

TalentCandidate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    timeToFillDays: plain.timeToFillDays != null ? Number.parseInt(plain.timeToFillDays, 10) : null,
    compensationExpectation:
      plain.compensationExpectation != null ? Number.parseFloat(plain.compensationExpectation) : null,
  };
};

export const TalentInterview = sequelize.define(
  'TalentInterview',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    interviewerId: { type: DataTypes.INTEGER, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    stage: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...TALENT_INTERVIEW_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    location: { type: DataTypes.STRING(120), allowNull: true },
    mode: { type: DataTypes.STRING(60), allowNull: true },
    feedbackScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    feedbackSummary: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    recordingUrl: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'talent_interviews',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['candidateId'] },
      { fields: ['status'] },
      { fields: ['scheduledAt'] },
    ],
  },
);

TalentInterview.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    feedbackScore: plain.feedbackScore != null ? Number.parseFloat(plain.feedbackScore) : null,
  };
};

export const TalentOffer = sequelize.define(
  'TalentOffer',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    roleTitle: { type: DataTypes.STRING(180), allowNull: false },
    employmentType: { type: DataTypes.STRING(60), allowNull: true },
    status: {
      type: DataTypes.ENUM(...TALENT_OFFER_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    contractTemplateKey: { type: DataTypes.STRING(120), allowNull: true },
    compensationAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    equityDetails: { type: DataTypes.STRING(255), allowNull: true },
    benefitsSummary: { type: DataTypes.TEXT, allowNull: true },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    signedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'talent_offers',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['candidateId'] },
      { fields: ['status'] },
    ],
  },
);

TalentOffer.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    compensationAmount: plain.compensationAmount != null ? Number.parseFloat(plain.compensationAmount) : null,
  };
};

export const TalentPipelineMetric = sequelize.define(
  'TalentPipelineMetric',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    periodStartDate: { type: DataTypes.DATEONLY, allowNull: false },
    periodEndDate: { type: DataTypes.DATEONLY, allowNull: false },
    openRoles: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    averageTimeToFillDays: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    conversionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    diversityIndex: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    hiringVelocity: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    benchCapacityHours: { type: DataTypes.INTEGER, allowNull: true },
    pipelineHealthScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    data: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'talent_pipeline_metrics',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['periodEndDate'] },
    ],
  },
);

TalentPipelineMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    averageTimeToFillDays:
      plain.averageTimeToFillDays != null ? Number.parseFloat(plain.averageTimeToFillDays) : null,
    conversionRate: plain.conversionRate != null ? Number.parseFloat(plain.conversionRate) : null,
    diversityIndex: plain.diversityIndex != null ? Number.parseFloat(plain.diversityIndex) : null,
    hiringVelocity: plain.hiringVelocity != null ? Number.parseFloat(plain.hiringVelocity) : null,
    pipelineHealthScore: plain.pipelineHealthScore != null ? Number.parseFloat(plain.pipelineHealthScore) : null,
  };
};

export const PeopleOpsPolicy = sequelize.define(
  'PeopleOpsPolicy',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...PEOPLE_OPS_POLICY_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    effectiveDate: { type: DataTypes.DATEONLY, allowNull: true },
    reviewCycleDays: { type: DataTypes.INTEGER, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    acknowledgedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    audienceCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    documentUrl: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'people_ops_policies',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['category'] },
    ],
  },
);

PeopleOpsPolicy.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const PeopleOpsPerformanceReview = sequelize.define(
  'PeopleOpsPerformanceReview',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    reviewerId: { type: DataTypes.INTEGER, allowNull: true },
    cycle: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM(...PEOPLE_OPS_PERFORMANCE_STATUSES),
      allowNull: false,
      defaultValue: 'not_started',
    },
    overallRating: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    strengths: { type: DataTypes.TEXT, allowNull: true },
    growthAreas: { type: DataTypes.TEXT, allowNull: true },
    goals: { type: jsonType, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'people_ops_performance_reviews',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['memberId'] },
      { fields: ['status'] },
    ],
  },
);

PeopleOpsPerformanceReview.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    overallRating: plain.overallRating != null ? Number.parseFloat(plain.overallRating) : null,
  };
};

export const PeopleOpsSkillMatrixEntry = sequelize.define(
  'PeopleOpsSkillMatrixEntry',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    skillName: { type: DataTypes.STRING(160), allowNull: false },
    skillCategory: { type: DataTypes.STRING(120), allowNull: true },
    proficiencyLevel: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    targetLevel: { type: DataTypes.INTEGER, allowNull: true },
    confidenceScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    lastValidatedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'people_ops_skill_matrix_entries',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['memberId'] },
      { fields: ['skillCategory'] },
    ],
  },
);

PeopleOpsSkillMatrixEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    proficiencyLevel: plain.proficiencyLevel != null ? Number.parseInt(plain.proficiencyLevel, 10) : null,
    targetLevel: plain.targetLevel != null ? Number.parseInt(plain.targetLevel, 10) : null,
    confidenceScore: plain.confidenceScore != null ? Number.parseFloat(plain.confidenceScore) : null,
  };
};

export const PeopleOpsWellbeingSnapshot = sequelize.define(
  'PeopleOpsWellbeingSnapshot',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    capturedById: { type: DataTypes.INTEGER, allowNull: true },
    wellbeingScore: { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 0 },
    riskLevel: {
      type: DataTypes.ENUM(...PEOPLE_OPS_WELLBEING_RISKS),
      allowNull: false,
      defaultValue: 'low',
    },
    focusAreas: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    capturedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'people_ops_wellbeing_snapshots',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['memberId'] },
      { fields: ['riskLevel'] },
      { fields: ['capturedAt'] },
    ],
  },
);

PeopleOpsWellbeingSnapshot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    wellbeingScore: plain.wellbeingScore != null ? Number.parseFloat(plain.wellbeingScore) : null,
  };
};

export const InternalOpportunity = sequelize.define(
  'InternalOpportunity',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: {
      type: DataTypes.ENUM(...INTERNAL_OPPORTUNITY_CATEGORIES),
      allowNull: false,
      defaultValue: 'project',
    },
    status: {
      type: DataTypes.ENUM(...INTERNAL_OPPORTUNITY_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    location: { type: DataTypes.STRING(120), allowNull: true },
    commitmentHoursPerWeek: { type: DataTypes.INTEGER, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    sponsoringTeam: { type: DataTypes.STRING(120), allowNull: true },
    urgencyLevel: { type: DataTypes.STRING(60), allowNull: true },
    requiredSkills: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'internal_opportunities',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['startDate'] },
    ],
  },
);

InternalOpportunity.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const InternalOpportunityMatch = sequelize.define(
  'InternalOpportunityMatch',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    opportunityId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    matchScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM(...INTERNAL_MATCH_STATUSES),
      allowNull: false,
      defaultValue: 'new',
    },
    notifiedAt: { type: DataTypes.DATE, allowNull: true },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    isMobileAlert: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'internal_opportunity_matches',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['opportunityId'] },
      { fields: ['memberId'] },
      { fields: ['status'] },
    ],
  },
);

InternalOpportunityMatch.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    matchScore: plain.matchScore != null ? Number.parseFloat(plain.matchScore) : null,
  };
};

export const MemberBrandingAsset = sequelize.define(
  'MemberBrandingAsset',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    assetType: {
      type: DataTypes.ENUM(...BRANDING_ASSET_TYPES),
      allowNull: false,
      defaultValue: 'banner',
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    assetUrl: { type: DataTypes.STRING(255), allowNull: true },
    thumbnailUrl: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM(...BRANDING_ASSET_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'member_branding_assets',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['memberId'] },
      { fields: ['status'] },
      { fields: ['assetType'] },
    ],
  },
);

MemberBrandingAsset.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const MemberBrandingApproval = sequelize.define(
  'MemberBrandingApproval',
  {
    assetId: { type: DataTypes.INTEGER, allowNull: false },
    reviewerId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...BRANDING_APPROVAL_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'member_branding_approvals',
    indexes: [
      { fields: ['assetId'] },
      { fields: ['status'] },
    ],
  },
);

MemberBrandingApproval.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const MemberBrandingMetric = sequelize.define(
  'MemberBrandingMetric',
  {
    assetId: { type: DataTypes.INTEGER, allowNull: false },
    metricDate: { type: DataTypes.DATEONLY, allowNull: false },
    channel: { type: DataTypes.STRING(120), allowNull: true },
    reach: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    engagements: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    clicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    leadsAttributed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'member_branding_metrics',
    indexes: [
      { fields: ['assetId'] },
      { fields: ['metricDate'] },
    ],
  },
);

MemberBrandingMetric.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

ProviderWorkspace.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
ProviderWorkspace.hasMany(ProviderWorkspaceMember, { foreignKey: 'workspaceId', as: 'members' });
ProviderWorkspace.hasOne(CompanyDashboardOverview, {
  foreignKey: 'workspaceId',
  as: 'dashboardOverview',
});
CompanyDashboardOverview.belongsTo(ProviderWorkspace, {
  foreignKey: 'workspaceId',
  as: 'workspace',
});
CompanyDashboardOverview.belongsTo(User, {
  foreignKey: 'lastEditedById',
  as: 'lastEditedBy',
});
ProviderWorkspace.hasMany(CompanyPage, { foreignKey: 'workspaceId', as: 'companyPages' });
CompanyPage.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
User.hasMany(CompanyPage, { foreignKey: 'createdById', as: 'createdCompanyPages' });
User.hasMany(CompanyPage, { foreignKey: 'updatedById', as: 'updatedCompanyPages' });
User.hasMany(CompanyPage, { foreignKey: 'lastEditedById', as: 'touchedCompanyPages' });
CompanyPage.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
CompanyPage.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });
CompanyPage.belongsTo(User, { foreignKey: 'lastEditedById', as: 'lastEditedBy' });
User.hasMany(CompanyPageRevision, { foreignKey: 'createdById', as: 'authoredCompanyPageRevisions' });
CompanyPageRevision.belongsTo(User, { foreignKey: 'createdById', as: 'author' });
User.hasMany(CompanyPageCollaborator, { foreignKey: 'collaboratorId', as: 'companyPageCollaborations' });
User.hasMany(CompanyPageCollaborator, { foreignKey: 'invitedById', as: 'invitedCompanyPageCollaborators' });
CompanyPageCollaborator.belongsTo(User, { foreignKey: 'collaboratorId', as: 'collaborator' });
CompanyPageCollaborator.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });
User.hasMany(CompanyPageMedia, { foreignKey: 'uploadedById', as: 'uploadedCompanyPageMedia' });
CompanyPageMedia.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });
ProviderWorkspace.hasMany(ProviderWorkspaceInvite, { foreignKey: 'workspaceId', as: 'invites' });
ProviderWorkspace.hasMany(ProviderContactNote, { foreignKey: 'workspaceId', as: 'contactNotes' });
ProviderWorkspace.hasMany(CompanyTimelineEvent, { foreignKey: 'workspaceId', as: 'timelineEvents' });
ProviderWorkspace.hasMany(CompanyTimelinePost, { foreignKey: 'workspaceId', as: 'timelinePosts' });
ProviderWorkspace.hasMany(CompanyTimelinePostMetric, { foreignKey: 'workspaceId', as: 'timelinePostMetrics' });
ProviderWorkspace.hasMany(ExecutiveIntelligenceMetric, { foreignKey: 'workspaceId', as: 'executiveMetrics' });
ProviderWorkspace.hasMany(ExecutiveScenarioPlan, { foreignKey: 'workspaceId', as: 'executiveScenarioPlans' });
ProviderWorkspace.hasOne(AgencyDashboardOverview, { foreignKey: 'workspaceId', as: 'dashboardOverview' });
AgencyDashboardOverview.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyDashboardOverview.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
AgencyDashboardOverview.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });
ProviderWorkspace.hasMany(GovernanceRiskRegister, { foreignKey: 'workspaceId', as: 'governanceRisks' });
ProviderWorkspace.hasMany(GovernanceAuditExport, { foreignKey: 'workspaceId', as: 'governanceAuditExports' });
ProviderWorkspace.hasMany(LeadershipRitual, { foreignKey: 'workspaceId', as: 'leadershipRituals' });
ProviderWorkspace.hasMany(LeadershipOkr, { foreignKey: 'workspaceId', as: 'leadershipOkrs' });
ProviderWorkspace.hasMany(LeadershipDecision, { foreignKey: 'workspaceId', as: 'leadershipDecisions' });
ProviderWorkspace.hasMany(LeadershipBriefingPack, { foreignKey: 'workspaceId', as: 'leadershipBriefings' });
ProviderWorkspace.hasMany(LeadershipStrategicBet, { foreignKey: 'workspaceId', as: 'leadershipStrategicBets' });
ProviderWorkspace.hasMany(InnovationInitiative, { foreignKey: 'workspaceId', as: 'innovationInitiatives' });
ProviderWorkspace.hasMany(InnovationFundingEvent, { foreignKey: 'workspaceId', as: 'innovationFundingEvents' });
ProviderWorkspace.hasMany(HiringAlert, { foreignKey: 'workspaceId', as: 'hiringAlerts' });
ProviderWorkspace.hasMany(CandidateDemographicSnapshot, {
  foreignKey: 'workspaceId',
  as: 'candidateDemographics',
});
ProviderWorkspace.hasMany(CandidateSatisfactionSurvey, {
  foreignKey: 'workspaceId',
  as: 'candidateSurveys',
});
ProviderWorkspace.hasMany(InterviewPanelTemplate, {
  foreignKey: 'workspaceId',
  as: 'interviewPanelTemplates',
});
ProviderWorkspace.hasMany(InterviewSchedule, { foreignKey: 'workspaceId', as: 'interviewSchedules' });
ProviderWorkspace.hasMany(InterviewerAvailability, {
  foreignKey: 'workspaceId',
  as: 'interviewerAvailability',
});
ProviderWorkspace.hasMany(InterviewReminder, { foreignKey: 'workspaceId', as: 'interviewReminders' });
ProviderWorkspace.hasMany(CandidatePrepPortal, { foreignKey: 'workspaceId', as: 'candidatePrepPortals' });
ProviderWorkspace.hasMany(InterviewEvaluation, { foreignKey: 'workspaceId', as: 'interviewEvaluations' });
ProviderWorkspace.hasMany(EvaluationCalibrationSession, {
  foreignKey: 'workspaceId',
  as: 'evaluationCalibrationSessions',
});
ProviderWorkspace.hasMany(DecisionTracker, { foreignKey: 'workspaceId', as: 'decisionTrackers' });
ProviderWorkspace.hasMany(OfferPackage, { foreignKey: 'workspaceId', as: 'offerPackages' });
ProviderWorkspace.hasMany(OnboardingTask, { foreignKey: 'workspaceId', as: 'onboardingTasks' });
ProviderWorkspace.hasMany(CandidateCareTicket, { foreignKey: 'workspaceId', as: 'candidateCareTickets' });
ProviderWorkspace.hasMany(JobStage, { foreignKey: 'workspaceId', as: 'jobStages' });
ProviderWorkspace.hasMany(JobApprovalWorkflow, { foreignKey: 'workspaceId', as: 'jobApprovals' });
ProviderWorkspace.hasMany(JobCampaignPerformance, { foreignKey: 'workspaceId', as: 'jobCampaignPerformance' });
ProviderWorkspace.hasMany(PartnerEngagement, { foreignKey: 'workspaceId', as: 'partnerEngagements' });
ProviderWorkspace.hasMany(PartnerAgreement, { foreignKey: 'workspaceId', as: 'partnerAgreements' });
ProviderWorkspace.hasMany(PartnerCommission, { foreignKey: 'workspaceId', as: 'partnerCommissions' });
ProviderWorkspace.hasMany(PartnerSlaSnapshot, { foreignKey: 'workspaceId', as: 'partnerSlaSnapshots' });
ProviderWorkspace.hasMany(PartnerCollaborationEvent, {
  foreignKey: 'workspaceId',
  as: 'partnerCollaborationEvents',
});
ProviderWorkspace.hasMany(HeadhunterInvite, { foreignKey: 'workspaceId', as: 'headhunterInvites' });
ProviderWorkspace.hasMany(HeadhunterBrief, { foreignKey: 'workspaceId', as: 'headhunterBriefs' });
ProviderWorkspace.hasMany(HeadhunterBriefAssignment, {
  foreignKey: 'workspaceId',
  as: 'headhunterBriefAssignments',
});
ProviderWorkspace.hasMany(HeadhunterPerformanceSnapshot, {
  foreignKey: 'workspaceId',
  as: 'headhunterPerformanceSnapshots',
});
ProviderWorkspace.hasMany(HeadhunterCommission, { foreignKey: 'workspaceId', as: 'headhunterCommissions' });
ProviderWorkspace.hasMany(TalentPool, { foreignKey: 'workspaceId', as: 'talentPools' });
ProviderWorkspace.hasMany(TalentPoolMember, { foreignKey: 'workspaceId', as: 'talentPoolMembers' });
ProviderWorkspace.hasMany(TalentPoolEngagement, { foreignKey: 'workspaceId', as: 'talentPoolEngagements' });
ProviderWorkspace.hasMany(AgencySlaSnapshot, { foreignKey: 'workspaceId', as: 'agencySlaSnapshots' });
ProviderWorkspace.hasMany(AgencyBillingEvent, { foreignKey: 'workspaceId', as: 'agencyBillingEvents' });
ProviderWorkspace.hasOne(AgencyAiConfiguration, { foreignKey: 'workspaceId', as: 'aiConfiguration' });
ProviderWorkspace.hasMany(AgencyAutoBidTemplate, { foreignKey: 'workspaceId', as: 'autoBidTemplates' });
AgencyAiConfiguration.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyAutoBidTemplate.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyAutoBidTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
AgencyAutoBidTemplate.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
User.hasMany(AgencyAutoBidTemplate, { foreignKey: 'createdBy', as: 'createdAgencyAutoBidTemplates' });
User.hasMany(AgencyAutoBidTemplate, { foreignKey: 'updatedBy', as: 'updatedAgencyAutoBidTemplates' });
ProviderWorkspace.hasMany(RecruitingCalendarEvent, { foreignKey: 'workspaceId', as: 'recruitingEvents' });
ProviderWorkspace.hasMany(AgencyCalendarEvent, { foreignKey: 'workspaceId', as: 'agencyCalendarEvents' });
ProviderWorkspace.hasMany(EmployerBrandAsset, { foreignKey: 'workspaceId', as: 'employerBrandAssets' });
ProviderWorkspace.hasMany(ProspectIntelligenceProfile, { foreignKey: 'workspaceId', as: 'prospectProfiles' });
ProviderWorkspace.hasMany(ProspectSearchDefinition, { foreignKey: 'workspaceId', as: 'prospectSearches' });
ProviderWorkspace.hasMany(ProspectCampaign, { foreignKey: 'workspaceId', as: 'prospectCampaigns' });
ProviderWorkspace.hasMany(ProspectResearchNote, { foreignKey: 'workspaceId', as: 'prospectResearchNotes' });
ProviderWorkspace.hasMany(ProspectResearchTask, { foreignKey: 'workspaceId', as: 'prospectResearchTasks' });
ProviderWorkspace.hasMany(EmployerBrandSection, { foreignKey: 'workspaceId', as: 'employerBrandSections' });
ProviderWorkspace.hasMany(EmployerBrandCampaign, { foreignKey: 'workspaceId', as: 'employerBrandCampaigns' });
ProviderWorkspace.hasMany(CreationStudioItem, { foreignKey: 'workspaceId', as: 'creationStudioItems' });
ProviderWorkspace.hasMany(WorkforceAnalyticsSnapshot, { foreignKey: 'workspaceId', as: 'workforceSnapshots' });
ProviderWorkspace.hasMany(WorkforceCohortMetric, { foreignKey: 'workspaceId', as: 'workforceCohorts' });
ProviderWorkspace.hasMany(InternalJobPosting, { foreignKey: 'workspaceId', as: 'internalJobPostings' });
ProviderWorkspace.hasMany(EmployeeReferral, { foreignKey: 'workspaceId', as: 'employeeReferrals' });
ProviderWorkspace.hasMany(CareerPathingPlan, { foreignKey: 'workspaceId', as: 'careerPathingPlans' });
ProviderWorkspace.hasMany(CompliancePolicy, { foreignKey: 'workspaceId', as: 'compliancePolicies' });
ProviderWorkspace.hasMany(ComplianceAuditLog, { foreignKey: 'workspaceId', as: 'complianceAudits' });
ProviderWorkspace.hasMany(AccessibilityAudit, { foreignKey: 'workspaceId', as: 'accessibilityAudits' });
ProviderWorkspace.hasMany(ProjectOperationalSnapshot, {
  foreignKey: 'workspaceId',
  as: 'projectOperationalSnapshots',
});
ProviderWorkspace.hasMany(ProjectDependencyLink, {
  foreignKey: 'workspaceId',
  as: 'projectDependencyLinks',
});
ProviderWorkspace.hasMany(WorkspaceOperatingBlueprint, {
  foreignKey: 'workspaceId',
  as: 'operatingBlueprints',
});
ProviderWorkspace.hasMany(ResourceCapacitySnapshot, {
  foreignKey: 'workspaceId',
  as: 'resourceCapacitySnapshots',
});
ProviderWorkspace.hasMany(ResourceScenarioPlan, {
  foreignKey: 'workspaceId',
  as: 'resourceScenarioPlans',
});
ProviderWorkspace.hasMany(QualityReviewRun, {
  foreignKey: 'workspaceId',
  as: 'qualityReviewRuns',
});
ProviderWorkspace.hasMany(FinancialEngagementSummary, {
  foreignKey: 'workspaceId',
  as: 'financialEngagementSummaries',
});
ProviderWorkspace.hasMany(TalentCandidate, { foreignKey: 'workspaceId', as: 'talentCandidates' });
ProviderWorkspace.hasMany(TalentInterview, { foreignKey: 'workspaceId', as: 'talentInterviews' });
ProviderWorkspace.hasMany(TalentOffer, { foreignKey: 'workspaceId', as: 'talentOffers' });
ProviderWorkspace.hasMany(TalentPipelineMetric, { foreignKey: 'workspaceId', as: 'talentPipelineMetrics' });
ProviderWorkspace.hasMany(PeopleOpsPolicy, { foreignKey: 'workspaceId', as: 'peopleOpsPolicies' });
ProviderWorkspace.hasMany(PeopleOpsPerformanceReview, {
  foreignKey: 'workspaceId',
  as: 'peopleOpsPerformanceReviews',
});
ProviderWorkspace.hasMany(PeopleOpsSkillMatrixEntry, {
  foreignKey: 'workspaceId',
  as: 'peopleOpsSkillMatrixEntries',
});
ProviderWorkspace.hasMany(PeopleOpsWellbeingSnapshot, {
  foreignKey: 'workspaceId',
  as: 'peopleOpsWellbeingSnapshots',
});
ProviderWorkspace.hasMany(InternalOpportunity, { foreignKey: 'workspaceId', as: 'internalOpportunities' });
ProviderWorkspace.hasMany(InternalOpportunityMatch, {
  foreignKey: 'workspaceId',
  as: 'internalOpportunityMatches',
});
ProviderWorkspace.hasMany(MemberBrandingAsset, { foreignKey: 'workspaceId', as: 'memberBrandingAssets' });

TalentCandidate.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
TalentCandidate.hasMany(TalentInterview, { foreignKey: 'candidateId', as: 'interviews' });
TalentCandidate.hasMany(TalentOffer, { foreignKey: 'candidateId', as: 'offers' });

TalentInterview.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
TalentInterview.belongsTo(TalentCandidate, { foreignKey: 'candidateId', as: 'candidate' });
TalentInterview.belongsTo(User, { foreignKey: 'interviewerId', as: 'interviewer' });

TalentOffer.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
TalentOffer.belongsTo(TalentCandidate, { foreignKey: 'candidateId', as: 'candidate' });
TalentOffer.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

TalentPipelineMetric.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });

PeopleOpsPolicy.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PeopleOpsPolicy.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

PeopleOpsPerformanceReview.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PeopleOpsPerformanceReview.belongsTo(ProviderWorkspaceMember, { foreignKey: 'memberId', as: 'member' });
PeopleOpsPerformanceReview.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

PeopleOpsSkillMatrixEntry.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PeopleOpsSkillMatrixEntry.belongsTo(ProviderWorkspaceMember, { foreignKey: 'memberId', as: 'member' });

PeopleOpsWellbeingSnapshot.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PeopleOpsWellbeingSnapshot.belongsTo(ProviderWorkspaceMember, { foreignKey: 'memberId', as: 'member' });
PeopleOpsWellbeingSnapshot.belongsTo(User, { foreignKey: 'capturedById', as: 'capturedBy' });

InternalOpportunity.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
InternalOpportunity.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
InternalOpportunity.hasMany(InternalOpportunityMatch, { foreignKey: 'opportunityId', as: 'matches' });

InternalOpportunityMatch.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
InternalOpportunityMatch.belongsTo(InternalOpportunity, { foreignKey: 'opportunityId', as: 'opportunity' });
InternalOpportunityMatch.belongsTo(ProviderWorkspaceMember, { foreignKey: 'memberId', as: 'member' });

MemberBrandingAsset.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
MemberBrandingAsset.belongsTo(ProviderWorkspaceMember, { foreignKey: 'memberId', as: 'member' });
MemberBrandingAsset.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
MemberBrandingAsset.hasMany(MemberBrandingApproval, { foreignKey: 'assetId', as: 'approvals' });
MemberBrandingAsset.hasMany(MemberBrandingMetric, { foreignKey: 'assetId', as: 'metrics' });

MemberBrandingApproval.belongsTo(MemberBrandingAsset, { foreignKey: 'assetId', as: 'asset' });
MemberBrandingApproval.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

MemberBrandingMetric.belongsTo(MemberBrandingAsset, { foreignKey: 'assetId', as: 'asset' });

ProviderWorkspaceMember.hasMany(PeopleOpsPerformanceReview, { foreignKey: 'memberId', as: 'performanceReviews' });
ProviderWorkspaceMember.hasMany(PeopleOpsSkillMatrixEntry, { foreignKey: 'memberId', as: 'skillMatrixEntries' });
ProviderWorkspaceMember.hasMany(PeopleOpsWellbeingSnapshot, { foreignKey: 'memberId', as: 'wellbeingSnapshots' });
ProviderWorkspaceMember.hasMany(InternalOpportunityMatch, { foreignKey: 'memberId', as: 'opportunityMatches' });
ProviderWorkspaceMember.hasMany(MemberBrandingAsset, { foreignKey: 'memberId', as: 'brandingAssets' });
ProviderWorkspace.hasMany(EmployerBrandStory, { foreignKey: 'workspaceId', as: 'employerBrandStories' });
ProviderWorkspace.hasMany(EmployerBenefit, { foreignKey: 'workspaceId', as: 'employerBenefits' });
ProviderWorkspace.hasMany(EmployeeJourneyProgram, { foreignKey: 'workspaceId', as: 'employeeJourneyPrograms' });
ProviderWorkspace.hasMany(WorkspaceIntegration, { foreignKey: 'workspaceId', as: 'workspaceIntegrations' });
WorkspaceIntegration.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
WorkspaceIntegration.hasMany(WorkspaceIntegrationSecret, { foreignKey: 'integrationId', as: 'secrets' });
WorkspaceIntegration.hasMany(WorkspaceIntegrationWebhook, { foreignKey: 'integrationId', as: 'webhooks' });
WorkspaceIntegration.hasMany(WorkspaceIntegrationAuditLog, { foreignKey: 'integrationId', as: 'auditLogs' });
WorkspaceIntegrationSecret.belongsTo(WorkspaceIntegration, { foreignKey: 'integrationId', as: 'integration' });
WorkspaceIntegrationSecret.belongsTo(User, { foreignKey: 'rotatedById', as: 'rotatedBy' });
WorkspaceIntegrationSecret.hasMany(WorkspaceIntegrationWebhook, { foreignKey: 'secretId', as: 'webhooks' });
WorkspaceIntegrationWebhook.belongsTo(WorkspaceIntegration, { foreignKey: 'integrationId', as: 'integration' });
WorkspaceIntegrationWebhook.belongsTo(WorkspaceIntegrationSecret, { foreignKey: 'secretId', as: 'secret' });
WorkspaceIntegrationWebhook.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
WorkspaceIntegrationAuditLog.belongsTo(WorkspaceIntegration, { foreignKey: 'integrationId', as: 'integration' });
WorkspaceIntegrationAuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
User.hasMany(WorkspaceIntegrationSecret, { foreignKey: 'rotatedById', as: 'rotatedIntegrationSecrets' });
User.hasMany(WorkspaceIntegrationWebhook, { foreignKey: 'createdById', as: 'createdIntegrationWebhooks' });
User.hasMany(WorkspaceIntegrationAuditLog, { foreignKey: 'actorId', as: 'workspaceIntegrationAuditEvents' });
ProviderWorkspace.hasMany(WorkspaceCalendarConnection, { foreignKey: 'workspaceId', as: 'calendarConnections' });
WorkspaceIntegration.hasMany(WorkspaceIntegrationCredential, { foreignKey: 'integrationId', as: 'credentials' });
WorkspaceIntegrationCredential.belongsTo(WorkspaceIntegration, { foreignKey: 'integrationId', as: 'integration' });
WorkspaceIntegration.hasMany(WorkspaceIntegrationFieldMapping, { foreignKey: 'integrationId', as: 'fieldMappings' });
WorkspaceIntegrationFieldMapping.belongsTo(WorkspaceIntegration, { foreignKey: 'integrationId', as: 'integration' });
WorkspaceIntegration.hasMany(WorkspaceIntegrationRoleAssignment, { foreignKey: 'integrationId', as: 'roleAssignments' });
WorkspaceIntegrationRoleAssignment.belongsTo(WorkspaceIntegration, { foreignKey: 'integrationId', as: 'integration' });
WorkspaceIntegration.hasMany(WorkspaceIntegrationSyncRun, { foreignKey: 'integrationId', as: 'syncRuns' });
WorkspaceIntegrationSyncRun.belongsTo(WorkspaceIntegration, { foreignKey: 'integrationId', as: 'integration' });
WorkspaceIntegration.hasMany(WorkspaceIntegrationIncident, { foreignKey: 'integrationId', as: 'incidents' });
WorkspaceIntegrationIncident.belongsTo(WorkspaceIntegration, { foreignKey: 'integrationId', as: 'integration' });
WorkspaceIntegration.hasMany(WorkspaceIntegrationAuditEvent, { foreignKey: 'integrationId', as: 'auditEvents' });
WorkspaceIntegrationAuditEvent.belongsTo(WorkspaceIntegration, { foreignKey: 'integrationId', as: 'integration' });

ProviderWorkspace.hasMany(ClientEngagement, { foreignKey: 'workspaceId', as: 'clientEngagements' });
ClientEngagement.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });

ClientEngagement.hasMany(ClientEngagementMandate, { foreignKey: 'engagementId', as: 'mandates' });
ClientEngagementMandate.belongsTo(ClientEngagement, { foreignKey: 'engagementId', as: 'engagement' });

ClientEngagement.hasMany(ClientEngagementMilestone, { foreignKey: 'engagementId', as: 'milestones' });
ClientEngagementMilestone.belongsTo(ClientEngagement, { foreignKey: 'engagementId', as: 'engagement' });

ClientEngagement.hasMany(ClientEngagementPortal, { foreignKey: 'engagementId', as: 'portals' });
ClientEngagementPortal.belongsTo(ClientEngagement, { foreignKey: 'engagementId', as: 'engagement' });

ClientEngagementPortal.hasMany(ClientEngagementPortalAuditLog, { foreignKey: 'portalId', as: 'auditLogs' });
ClientEngagementPortalAuditLog.belongsTo(ClientEngagementPortal, { foreignKey: 'portalId', as: 'portal' });

ClientEngagement.hasMany(EngagementInvoice, { foreignKey: 'engagementId', as: 'invoices' });
EngagementInvoice.belongsTo(ClientEngagement, { foreignKey: 'engagementId', as: 'engagement' });

ClientEngagement.hasMany(EngagementCommissionSplit, { foreignKey: 'engagementId', as: 'commissions' });
EngagementCommissionSplit.belongsTo(ClientEngagement, { foreignKey: 'engagementId', as: 'engagement' });

ProviderWorkspace.hasMany(EngagementScheduleEvent, {
  foreignKey: 'workspaceId',
  as: 'engagementScheduleEvents',
});
EngagementScheduleEvent.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ClientEngagement.hasMany(EngagementScheduleEvent, { foreignKey: 'engagementId', as: 'scheduleEvents' });
EngagementScheduleEvent.belongsTo(ClientEngagement, { foreignKey: 'engagementId', as: 'engagement' });

ProviderWorkspace.hasMany(IssueResolutionCase, { foreignKey: 'workspaceId', as: 'issueResolutionCases' });
IssueResolutionCase.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ClientEngagement.hasMany(IssueResolutionCase, { foreignKey: 'engagementId', as: 'issueCases' });
IssueResolutionCase.belongsTo(ClientEngagement, { foreignKey: 'engagementId', as: 'engagement' });

IssueResolutionCase.hasMany(IssueResolutionEvent, { foreignKey: 'caseId', as: 'events' });
IssueResolutionEvent.belongsTo(IssueResolutionCase, { foreignKey: 'caseId', as: 'case' });

ProviderWorkspaceMember.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderWorkspaceMember.belongsTo(User, { foreignKey: 'userId', as: 'member' });
ProviderWorkspaceMember.belongsTo(User, { foreignKey: 'invitedById', as: 'inviter' });

ProviderWorkspaceInvite.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderWorkspaceInvite.belongsTo(User, { foreignKey: 'invitedById', as: 'inviter' });

ProviderContactNote.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CompanyTimelineEvent.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CompanyTimelineEvent.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
CompanyTimelinePost.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CompanyTimelinePost.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
CompanyTimelinePost.hasMany(CompanyTimelinePostMetric, { foreignKey: 'postId', as: 'metrics' });
CompanyTimelinePostMetric.belongsTo(CompanyTimelinePost, { foreignKey: 'postId', as: 'post' });
CompanyTimelinePostMetric.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ExecutiveIntelligenceMetric.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ExecutiveScenarioPlan.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ExecutiveScenarioPlan.hasMany(ExecutiveScenarioBreakdown, {
  foreignKey: 'scenarioId',
  as: 'breakdowns',
  onDelete: 'CASCADE',
  hooks: true,
});
ExecutiveScenarioBreakdown.belongsTo(ExecutiveScenarioPlan, { foreignKey: 'scenarioId', as: 'scenario' });
GovernanceRiskRegister.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
GovernanceAuditExport.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
LeadershipRitual.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
LeadershipOkr.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
LeadershipDecision.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
LeadershipBriefingPack.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
LeadershipStrategicBet.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
LeadershipStrategicBet.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
InnovationInitiative.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
InnovationInitiative.hasMany(InnovationFundingEvent, {
  foreignKey: 'initiativeId',
  as: 'fundingEvents',
  onDelete: 'CASCADE',
  hooks: true,
});
InnovationFundingEvent.belongsTo(InnovationInitiative, { foreignKey: 'initiativeId', as: 'initiative' });
InnovationFundingEvent.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderContactNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
ProviderContactNote.belongsTo(User, { foreignKey: 'subjectUserId', as: 'subject' });
HiringAlert.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CandidateDemographicSnapshot.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CandidateSatisfactionSurvey.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
InterviewPanelTemplate.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
InterviewSchedule.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
InterviewerAvailability.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
InterviewReminder.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CandidatePrepPortal.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
InterviewEvaluation.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
EvaluationCalibrationSession.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
DecisionTracker.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
OfferPackage.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
OnboardingTask.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CandidateCareTicket.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobStage.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobApprovalWorkflow.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
JobCampaignPerformance.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PartnerEngagement.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PartnerAgreement.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PartnerAgreement.hasMany(PartnerCommission, { foreignKey: 'agreementId', as: 'commissions' });
PartnerCommission.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PartnerCommission.belongsTo(PartnerAgreement, { foreignKey: 'agreementId', as: 'agreement' });
PartnerCommission.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });
PartnerSlaSnapshot.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PartnerCollaborationEvent.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
PartnerCollaborationEvent.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });
HeadhunterInvite.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
HeadhunterInvite.belongsTo(ProviderWorkspace, {
  foreignKey: 'headhunterWorkspaceId',
  as: 'headhunterWorkspace',
});
HeadhunterInvite.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });
HeadhunterBrief.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
HeadhunterBrief.hasMany(HeadhunterBriefAssignment, { foreignKey: 'briefId', as: 'assignments' });
HeadhunterBriefAssignment.belongsTo(HeadhunterBrief, { foreignKey: 'briefId', as: 'brief' });
HeadhunterBriefAssignment.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
HeadhunterBriefAssignment.belongsTo(ProviderWorkspace, {
  foreignKey: 'headhunterWorkspaceId',
  as: 'headhunterWorkspace',
});
HeadhunterPerformanceSnapshot.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
HeadhunterPerformanceSnapshot.belongsTo(ProviderWorkspace, {
  foreignKey: 'headhunterWorkspaceId',
  as: 'headhunterWorkspace',
});
HeadhunterCommission.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
HeadhunterCommission.belongsTo(ProviderWorkspace, {
  foreignKey: 'headhunterWorkspaceId',
  as: 'headhunterWorkspace',
});
HeadhunterCommission.belongsTo(HeadhunterBrief, { foreignKey: 'briefId', as: 'brief' });
TalentPool.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
TalentPool.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
TalentPool.hasMany(TalentPoolMember, { foreignKey: 'poolId', as: 'members' });
TalentPool.hasMany(TalentPoolEngagement, { foreignKey: 'poolId', as: 'engagements' });
TalentPoolMember.belongsTo(TalentPool, { foreignKey: 'poolId', as: 'pool' });
TalentPoolMember.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
TalentPoolMember.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });
TalentPoolEngagement.belongsTo(TalentPool, { foreignKey: 'poolId', as: 'pool' });
TalentPoolEngagement.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
TalentPoolEngagement.belongsTo(User, { foreignKey: 'performedById', as: 'performedBy' });
AgencySlaSnapshot.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencySlaSnapshot.belongsTo(AgencyCollaboration, {
  foreignKey: 'agencyCollaborationId',
  as: 'collaboration',
});
AgencyBillingEvent.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyBillingEvent.belongsTo(AgencyCollaboration, {
  foreignKey: 'agencyCollaborationId',
  as: 'collaboration',
});
RecruitingCalendarEvent.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyCalendarEvent.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AgencyCalendarEvent.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
User.hasMany(AgencyCalendarEvent, { foreignKey: 'createdById', as: 'createdAgencyCalendarEvents' });
EmployerBrandAsset.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProspectIntelligenceProfile.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProspectIntelligenceProfile.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
ProspectIntelligenceProfile.hasMany(ProspectIntelligenceSignal, { foreignKey: 'profileId', as: 'signals' });
ProspectIntelligenceProfile.hasMany(ProspectResearchNote, { foreignKey: 'profileId', as: 'researchNotes' });
ProspectIntelligenceProfile.hasMany(ProspectResearchTask, { foreignKey: 'profileId', as: 'researchTasks' });
ProspectIntelligenceSignal.belongsTo(ProspectIntelligenceProfile, { foreignKey: 'profileId', as: 'profile' });
ProspectIntelligenceSignal.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProspectSearchDefinition.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProspectSearchDefinition.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
ProspectSearchDefinition.hasMany(ProspectSearchAlert, { foreignKey: 'searchId', as: 'alerts' });
ProspectSearchAlert.belongsTo(ProspectSearchDefinition, { foreignKey: 'searchId', as: 'search' });
ProspectCampaign.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProspectCampaign.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
ProspectCampaign.hasMany(ProspectCampaignStep, { foreignKey: 'campaignId', as: 'steps' });
ProspectCampaignStep.belongsTo(ProspectCampaign, { foreignKey: 'campaignId', as: 'campaign' });
ProspectResearchNote.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProspectResearchNote.belongsTo(ProspectIntelligenceProfile, { foreignKey: 'profileId', as: 'profile' });
ProspectResearchNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
ProspectResearchTask.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProspectResearchTask.belongsTo(ProspectIntelligenceProfile, { foreignKey: 'profileId', as: 'profile' });
ProspectResearchTask.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
ProspectResearchTask.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
EmployerBrandSection.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
EmployerBrandCampaign.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CreationStudioItem.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CreationStudioItem.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
WorkforceAnalyticsSnapshot.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
WorkforceCohortMetric.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
InternalJobPosting.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
EmployeeReferral.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
EmployeeReferral.belongsTo(User, { foreignKey: 'referrerId', as: 'referrer' });
User.hasMany(CreationStudioItem, { foreignKey: 'createdById', as: 'creationStudioItems' });
CareerPathingPlan.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CareerPathingPlan.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });
CompliancePolicy.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
CompliancePolicy.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
ComplianceAuditLog.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
AccessibilityAudit.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
User.hasMany(EmployeeReferral, { foreignKey: 'referrerId', as: 'referralsMade' });
User.hasMany(CareerPathingPlan, { foreignKey: 'employeeId', as: 'careerPathingPlans' });
WorkspaceOperatingBlueprint.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ResourceCapacitySnapshot.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ResourceScenarioPlan.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
FinancialEngagementSummary.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
EmployerBrandStory.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
EmployerBrandStory.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
EmployerBenefit.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
EmployeeJourneyProgram.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
EmployeeJourneyProgram.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
WorkspaceIntegration.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
WorkspaceCalendarConnection.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });

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
AgencyCollaboration.hasMany(AgencySlaSnapshot, {
  foreignKey: 'agencyCollaborationId',
  as: 'slaSnapshots',
});
AgencyCollaboration.hasMany(AgencyBillingEvent, {
  foreignKey: 'agencyCollaborationId',
  as: 'billingEvents',
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

HeadhunterPipelineStage.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
HeadhunterPipelineStage.hasMany(HeadhunterPipelineItem, {
  foreignKey: 'stageId',
  as: 'items',
  onDelete: 'CASCADE',
});

HeadhunterPipelineItem.belongsTo(HeadhunterPipelineStage, { foreignKey: 'stageId', as: 'stage' });
HeadhunterPipelineItem.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
HeadhunterPipelineItem.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
HeadhunterPipelineItem.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });
HeadhunterPipelineItem.hasMany(HeadhunterPipelineNote, {
  foreignKey: 'pipelineItemId',
  as: 'notes',
  onDelete: 'CASCADE',
});
HeadhunterPipelineItem.hasMany(HeadhunterPipelineAttachment, {
  foreignKey: 'pipelineItemId',
  as: 'attachments',
  onDelete: 'CASCADE',
});
HeadhunterPipelineItem.hasMany(HeadhunterPipelineInterview, {
  foreignKey: 'pipelineItemId',
  as: 'interviews',
  onDelete: 'CASCADE',
});
HeadhunterPipelineItem.hasMany(HeadhunterPassOnShare, {
  foreignKey: 'pipelineItemId',
  as: 'passOnShares',
  onDelete: 'CASCADE',
});

HeadhunterPipelineNote.belongsTo(HeadhunterPipelineItem, { foreignKey: 'pipelineItemId', as: 'pipelineItem' });
HeadhunterPipelineNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

HeadhunterPipelineAttachment.belongsTo(HeadhunterPipelineItem, { foreignKey: 'pipelineItemId', as: 'pipelineItem' });
HeadhunterPipelineAttachment.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploader' });

HeadhunterPipelineInterview.belongsTo(HeadhunterPipelineItem, { foreignKey: 'pipelineItemId', as: 'pipelineItem' });

HeadhunterPassOnShare.belongsTo(HeadhunterPipelineItem, { foreignKey: 'pipelineItemId', as: 'pipelineItem' });
HeadhunterPassOnShare.belongsTo(ProviderWorkspace, { foreignKey: 'targetWorkspaceId', as: 'targetWorkspace' });

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

ProviderWorkspace.hasOne(DisputeWorkflowSetting, { foreignKey: 'workspaceId', as: 'disputeWorkflowSetting' });
DisputeWorkflowSetting.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
DisputeWorkflowSetting.belongsTo(User, { foreignKey: 'defaultAssigneeId', as: 'defaultAssignee' });

ProviderWorkspace.hasMany(DisputeTemplate, { foreignKey: 'workspaceId', as: 'disputeTemplates' });
DisputeTemplate.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
DisputeTemplate.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
DisputeTemplate.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });

User.hasMany(GigOrder, { foreignKey: 'freelancerId', as: 'gigOrders' });

GigOrder.hasMany(GigOrderRequirementForm, { foreignKey: 'orderId', as: 'requirementForms' });
GigOrderRequirementForm.belongsTo(GigOrder, { foreignKey: 'orderId', as: 'order' });
GigOrderRequirementForm.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

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
  ProfileAdminNote,
  CompanyProfile,
  CompanyProfileFollower,
  CompanyProfileConnection,
  AgencyProfile,
  AgencyDashboardOverview,
  FreelancerProfile,
  FreelancerDashboardOverview,
  FreelancerOperationsMembership,
  FreelancerOperationsWorkflow,
  FreelancerOperationsNotice,
  FreelancerOperationsSnapshot,
  ReputationTestimonial,
  ReputationSuccessStory,
  ReputationMetric,
  ReputationBadge,
  ReputationReviewWidget,
  FreelancerReview,
  FreelancerExpertiseArea,
  FreelancerSuccessMetric,
  FreelancerTestimonial,
  FreelancerHeroBanner,
  FreelancerPortfolioItem,
  FreelancerPortfolioAsset,
  FreelancerPortfolioSetting,
  FreelancerCalendarEvent,
  FeedPost,
  FeedComment,
  FeedReaction,
  FreelancerTimelineWorkspace,
  FreelancerTimelinePost,
  FreelancerTimelineEntry,
  FreelancerTimelinePostMetric,
  Job,
  JobPostAdminDetail,
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
  ProjectOperationalSnapshot,
  ProjectDependencyLink,
  ProjectWorkspace,
  ProjectWorkspaceBrief,
  ProjectWorkspaceWhiteboard,
  ProjectWorkspaceFile,
  ProjectWorkspaceConversation,
  ProjectWorkspaceApproval,
  ProjectWorkspaceMessage,
  ProjectWorkspaceBudget,
  ProjectWorkspaceObject,
  ProjectWorkspaceTimelineEntry,
  ProjectWorkspaceTimeline,
  ProjectWorkspaceTask,
  ProjectWorkspaceTaskAssignment,
  ProjectWorkspaceBudgetLine,
  ProjectWorkspaceTimelineEvent,
  ProjectWorkspaceMeeting,
  ProjectWorkspaceCalendarEntry,
  ProjectWorkspaceRole,
  ProjectWorkspaceSubmission,
  ProjectWorkspaceInvite,
  ProjectWorkspaceHrRecord,
  ProjectWorkspaceTimeLog,
  ProjectWorkspaceTarget,
  ProjectWorkspaceObjective,
  WorkspaceOperatingBlueprint,
  ResourceCapacitySnapshot,
  ResourceScenarioPlan,
  QualityReviewRun,
  FinancialEngagementSummary,
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
  MentorProfile,
  MentorAvailabilitySlot,
  MentorPackage,
  MentorBooking,
  MentorClient,
  MentorEvent,
  MentorSupportTicket,
  MentorMessage,
  MentorVerification,
  MentorVerificationDocument,
  MentorWalletTransaction,
  MentorInvoice,
  MentorPayout,
  MentorshipOrder,
  MentorFavourite,
  MentorRecommendation,
  MentorReview,
  SkillGapDiagnostic,
  FreelancerCertification,
  AiServiceRecommendation,
  Volunteering,
  OpportunityTaxonomy,
  OpportunityTaxonomyAssignment,
  AdCampaign,
  AdCreative,
  AdPlacement,
  AdSurfaceSetting,
  AdCoupon,
  AdPlacementCoupon,
  AdKeyword,
  AdKeywordAssignment,
  Group,
  GroupMembership,
  Connection,
  PasswordResetToken,
  UserRefreshSession,
  UserRefreshInvalidation,
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
  UserCalendarSetting,
  FocusSession,
  AdvisorCollaboration,
  AdvisorCollaborationMember,
  AdvisorCollaborationAuditLog,
  AdvisorDocumentRoom,
  SupportAutomationLog,
  Notification,
  NotificationPreference,
  UserWebsitePreference,
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
  ClientEngagement,
  ClientEngagementMandate,
  ClientEngagementMilestone,
  ClientEngagementPortal,
  ClientEngagementPortalAuditLog,
  EngagementInvoice,
  EngagementCommissionSplit,
  EngagementScheduleEvent,
  IssueResolutionCase,
  IssueResolutionEvent,
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
  HeadhunterPipelineStage,
  HeadhunterPipelineItem,
  HeadhunterPipelineNote,
  HeadhunterPipelineAttachment,
  HeadhunterPipelineInterview,
  HeadhunterPassOnShare,
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
  InterviewPanelTemplate,
  InterviewSchedule,
  InterviewerAvailability,
  InterviewReminder,
  CandidatePrepPortal,
  InterviewEvaluation,
  EvaluationCalibrationSession,
  DecisionTracker,
  OfferPackage,
  OnboardingTask,
  CandidateCareTicket,
  JobStage,
  JobApprovalWorkflow,
  JobCampaignPerformance,
  PartnerEngagement,
  PartnerAgreement,
  PartnerCommission,
  PartnerSlaSnapshot,
  PartnerCollaborationEvent,
  HeadhunterInvite,
  HeadhunterBrief,
  HeadhunterBriefAssignment,
  HeadhunterPerformanceSnapshot,
  HeadhunterCommission,
  TalentPool,
  TalentPoolMember,
  TalentPoolEngagement,
  AgencySlaSnapshot,
  AgencyBillingEvent,
  RecruitingCalendarEvent,
  EmployerBrandAsset,
  EmployerBrandSection,
  EmployerBrandCampaign,
  WorkforceAnalyticsSnapshot,
  WorkforceCohortMetric,
  InternalJobPosting,
  EmployeeReferral,
  CareerPathingPlan,
  CompliancePolicy,
  ComplianceAuditLog,
  AccessibilityAudit,
  EmployerBrandStory,
  EmployerBenefit,
  EmployeeJourneyProgram,
  WorkspaceIntegration,
  WorkspaceIntegrationCredential,
  WorkspaceIntegrationFieldMapping,
  WorkspaceIntegrationRoleAssignment,
  WorkspaceIntegrationSyncRun,
  WorkspaceIntegrationIncident,
  WorkspaceIntegrationAuditEvent,
  WorkspaceIntegrationSecret,
  WorkspaceIntegrationWebhook,
  WorkspaceIntegrationAuditLog,
  WorkspaceCalendarConnection,
  EscrowAccount,
  EscrowTransaction,
  EscrowReleasePolicy,
  EscrowFeeTier,
  DisputeCase,
  DisputeEvent,
  DisputeWorkflowSetting,
  DisputeTemplate,
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
  ProjectMilestone,
  ProjectCollaborator,
  ProjectTemplate,
  ProjectIntegration,
  ProjectRetrospective,
  AutoAssignQueueEntry,
  AutoAssignResponse,
  FreelancerAutoMatchPreference,
  CommunitySpotlight,
  CommunitySpotlightHighlight,
  CommunitySpotlightAsset,
  CommunitySpotlightNewsletterFeature,
  FeatureFlag,
  FeatureFlagAssignment,
  PlatformSetting,
  RuntimeSecurityAuditEvent,
  RbacPolicyAuditEvent,
  RuntimeAnnouncement,
  UserEvent,
  UserEventAgendaItem,
  UserEventTask,
  UserEventGuest,
  UserEventBudgetItem,
  UserEventAsset,
  UserEventChecklistItem,
  UserLoginAudit,
  CareerDocument,
  CareerDocumentVersion,
  CareerDocumentCollaborator,
  CareerDocumentExport,
  CareerDocumentAnalytics,
  CareerStoryBlock,
  CareerBrandAsset,
  ComplianceDocument,
  ComplianceDocumentVersion,
  ComplianceObligation,
  ComplianceReminder,
  ComplianceLocalization,
  ExecutiveIntelligenceMetric,
  ExecutiveScenarioPlan,
  ExecutiveScenarioBreakdown,
  GovernanceRiskRegister,
  GovernanceAuditExport,
  LeadershipRitual,
  LeadershipOkr,
  LeadershipDecision,
  LeadershipBriefingPack,
  LeadershipStrategicBet,
  InnovationInitiative,
  InnovationFundingEvent,
  GigOrderRequirementForm,
  GigOrderEscrowCheckpoint,
  GigVendorScorecard,
  CollaborationSpace,
  CollaborationParticipant,
  CollaborationRoom,
  CollaborationAsset,
  CollaborationAnnotation,
  CollaborationRepository,
  CollaborationAiSession,
  TalentCandidate,
  TalentInterview,
  TalentOffer,
  TalentPipelineMetric,
  PeopleOpsPolicy,
  PeopleOpsPerformanceReview,
  PeopleOpsSkillMatrixEntry,
  PeopleOpsWellbeingSnapshot,
  InternalOpportunity,
  InternalOpportunityMatch,
  MemberBrandingAsset,
  MemberBrandingApproval,
  CompanyTimelineEvent,
  CompanyTimelinePost,
  CompanyTimelinePostMetric,
  SpeedNetworkingSession,
  SpeedNetworkingRoom,
  SpeedNetworkingParticipant,
  NetworkingSession,
  NetworkingSessionRotation,
  NetworkingSessionSignup,
  NetworkingBusinessCard,
  NetworkingSessionOrder,
  NetworkingConnection,
  MemberBrandingMetric,
  AdminTimeline,
  AdminTimelineEvent,
  BlogCategory,
  BlogTag,
  BlogMedia,
  BlogPost,
  BlogPostTag,
  BlogPostMedia,
};

registerBlogAssociations({ User });
registerAdminTimelineAssociations({ User });
registerBlogAssociations({ User, ProviderWorkspace });

const domainRegistry = new DomainRegistry({
  sequelize,
  logger: logger.child({ module: 'DomainRegistry' }),
});

domainRegistry.registerContext({
  name: 'auth',
  displayName: 'Identity & Access',
  description: 'User accounts, verification records, and multifactor credentials.',
  include: [
    (modelName) =>
      /^User/.test(modelName) ||
      /^Identity/.test(modelName) ||
      /^Corporate/.test(modelName) ||
      /^TwoFactor/.test(modelName) ||
      /^PasswordReset/.test(modelName) ||
      /^AccountRecovery/.test(modelName) ||
      /^UserLogin/.test(modelName),
  ],
  metadata: domainMetadata.auth,
});

domainRegistry.registerContext({
  name: 'talent',
  displayName: 'Talent Graph',
  description: 'Profiles, experience artefacts, reputation, and mentorship records.',
  include: [
    (modelName) =>
      /^Profile/.test(modelName) ||
      /^Freelancer/.test(modelName) ||
      /^Career/.test(modelName) ||
      /^Launchpad/.test(modelName) ||
      /^Mentor/.test(modelName) ||
      /^CommunitySpotlight/.test(modelName) ||
      /^PeerMentoring/.test(modelName),
  ],
  metadata: domainMetadata.talent,
});

domainRegistry.registerContext({
  name: 'talent_acquisition',
  displayName: 'Talent Acquisition',
  description: 'Job applications, interviews, stage history, and recruiter workflows.',
  include: [(modelName) => /^JobApplication/.test(modelName)],
  metadata: domainMetadata.talent,
});

domainRegistry.registerContext({
  name: 'marketplace',
  displayName: 'Marketplace & Delivery',
  description: 'Projects, gigs, workspaces, automation queues, and collaboration artefacts.',
  include: [
    (modelName) =>
      /^Project/.test(modelName) ||
      /^Gig/.test(modelName) ||
      /^Workspace/.test(modelName) ||
      /^AutoAssign/.test(modelName) ||
      /^Collaboration/.test(modelName) ||
      /^Deliverable/.test(modelName),
  ],
  metadata: domainMetadata.marketplace,
});

domainRegistry.registerContext({
  name: 'volunteering',
  displayName: 'Volunteering & Social Impact',
  description: 'Volunteer programmes, workspace placements, contract management, and spend oversight.',
  include: [
    (modelName) => /^Volunteering/.test(modelName) || /^Volunteer/.test(modelName),
  ],
  metadata: domainMetadata.volunteering,
});

domainRegistry.registerContext({
  name: 'finance',
  displayName: 'Finance & Trust',
  description: 'Wallets, escrow, payouts, tax exports, and dispute artefacts.',
  include: [
    (modelName) =>
      /^Finance/.test(modelName) ||
      /^Wallet/.test(modelName) ||
      /^Escrow/.test(modelName) ||
      /^Dispute/.test(modelName) ||
      /^Revenue/.test(modelName) ||
      /^Expense/.test(modelName) ||
      /^Tax/.test(modelName) ||
      /^AgencyBilling/.test(modelName),
  ],
  metadata: domainMetadata.finance,
});

domainRegistry.registerContext({
  name: 'communications',
  displayName: 'Messaging & Support',
  description: 'Messages, notifications, support desks, analytics, and engagement artefacts.',
  include: [
    (modelName) =>
      /^Message/.test(modelName) ||
      /^Notification/.test(modelName) ||
      /^Support/.test(modelName) ||
      /^Analytics/.test(modelName) ||
      /^AgencyTimeline/.test(modelName),
  ],
  metadata: domainMetadata.communications,
});

domainRegistry.registerContext({
  name: 'governance',
  displayName: 'Governance & Compliance',
  description: 'Policies, audits, leadership rituals, governance risks, and executive insights.',
  include: [
    (modelName) =>
      /^Compliance/.test(modelName) ||
      /^Consent/.test(modelName) ||
      /^Governance/.test(modelName) ||
      /^Leadership/.test(modelName) ||
      /^Executive/.test(modelName) ||
      /^Accessibility/.test(modelName) ||
      /^Policy/.test(modelName) ||
      /^RbacPolicy/.test(modelName) ||
      /^DomainGovernance/.test(modelName),
  ],
  metadata: domainMetadata.governance,
});

domainRegistry.registerContext({
  name: 'platform',
  displayName: 'Platform Controls',
  description: 'Platform-wide configuration including feature flags and platform settings.',
  models: [
    'FeatureFlag',
    'FeatureFlagAssignment',
    'PlatformSetting',
    'RuntimeSecurityAuditEvent',
    'RuntimeAnnouncement',
    'AdminCalendarAccount',
    'AdminCalendarTemplate',
    'AdminCalendarEvent',
    'AdminCalendarAvailabilityWindow',
    'AdminTimeline',
    'AdminTimelineEvent',
  ],
  metadata: domainMetadata.platform,
});

const unassignedModels = domainRegistry.getUnassignedModelNames();
if (unassignedModels.length) {
  domainRegistry.registerContext({
    name: 'shared',
    displayName: 'Shared & Legacy',
    description: 'Models pending bounded-context assignment or shared across domains.',
    models: unassignedModels,
  });
}

export { domainRegistry };

export {
  USER_EVENT_STATUSES,
  USER_EVENT_FORMATS,
  USER_EVENT_VISIBILITIES,
  USER_EVENT_TASK_STATUSES,
  USER_EVENT_TASK_PRIORITIES,
  USER_EVENT_GUEST_STATUSES,
  USER_EVENT_BUDGET_STATUSES,
  USER_EVENT_ASSET_TYPES,
  USER_EVENT_ASSET_VISIBILITIES,
};
