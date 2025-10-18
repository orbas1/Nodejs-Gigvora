export const PROFILE_AVAILABILITY_STATUSES = ['available', 'limited', 'unavailable', 'on_leave'];
export const PROFILE_APPRECIATION_TYPES = ['like', 'celebrate', 'support', 'endorse', 'applause'];
export const PROFILE_FOLLOWER_STATUSES = ['active', 'muted', 'blocked'];
export const PROFILE_ENGAGEMENT_JOB_STATUSES = ['pending', 'completed', 'failed'];
export const PROFILE_VISIBILITY_OPTIONS = ['public', 'members', 'private'];
export const PROFILE_NETWORK_VISIBILITY_OPTIONS = ['public', 'connections', 'private'];
export const PROFILE_FOLLOWERS_VISIBILITY_OPTIONS = ['public', 'connections', 'private'];

export const GROUP_VISIBILITIES = ['public', 'private', 'secret'];
export const GROUP_MEMBER_POLICIES = ['open', 'request', 'invite'];
export const GROUP_MEMBERSHIP_STATUSES = ['pending', 'active', 'invited', 'suspended'];
export const GROUP_MEMBERSHIP_ROLES = ['owner', 'moderator', 'member', 'observer'];
export const GROUP_POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
export const GROUP_POST_VISIBILITIES = ['public', 'members', 'admins'];

export const PAGE_VISIBILITIES = ['public', 'members', 'private'];
export const PAGE_MEMBER_ROLES = ['owner', 'admin', 'editor', 'moderator', 'author', 'viewer'];
export const PAGE_MEMBER_STATUSES = ['active', 'invited', 'pending', 'suspended'];
export const PAGE_POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
export const PAGE_POST_VISIBILITIES = ['public', 'followers', 'members', 'private'];

export const COMMUNITY_INVITE_STATUSES = ['pending', 'accepted', 'declined', 'expired'];

export const EMPLOYER_BRAND_SECTION_TYPES = [
  'culture_video',
  'benefit',
  'dei_commitment',
  'team_spotlight',
  'office',
  'leadership_story',
  'custom',
];
export const EMPLOYER_BRAND_SECTION_STATUSES = ['draft', 'review', 'published', 'archived'];
export const EMPLOYER_BRAND_CAMPAIGN_STATUSES = ['draft', 'scheduled', 'active', 'completed', 'archived'];
export const WORKFORCE_COHORT_TYPES = ['department', 'location', 'tenure', 'job_family', 'gender', 'generation'];
export const INTERNAL_JOB_POSTING_STATUSES = ['draft', 'open', 'interview', 'offer', 'filled', 'closed'];
export const EMPLOYEE_REFERRAL_STATUSES = ['pending', 'qualified', 'interview', 'hired', 'rewarded', 'expired'];
export const CAREER_PATHING_STATUSES = ['draft', 'active', 'completed', 'paused'];
export const COMPLIANCE_POLICY_STATUSES = ['draft', 'active', 'under_review', 'archived'];
export const COMPLIANCE_AUDIT_STATUSES = ['open', 'in_progress', 'completed', 'closed'];
export const ACCESSIBILITY_AUDIT_STATUSES = ['pending', 'in_progress', 'remediation', 'verified'];

export const LEGAL_DOCUMENT_CATEGORIES = ['terms', 'privacy', 'data_processing', 'cookie'];
export const LEGAL_DOCUMENT_STATUSES = ['draft', 'active', 'archived'];
export const LEGAL_DOCUMENT_VERSION_STATUSES = ['draft', 'in_review', 'approved', 'published', 'archived'];


export const APPLICATION_TARGET_TYPES = ['job', 'gig', 'project', 'launchpad', 'volunteer'];
export const VOLUNTEER_APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'in_review',
  'interview',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];
export const VOLUNTEER_RESPONSE_TYPES = ['message', 'request_info', 'approval', 'rejection', 'update'];
export const VOLUNTEER_CONTRACT_STATUSES = ['draft', 'awaiting_signature', 'active', 'on_hold', 'completed', 'cancelled'];
export const VOLUNTEER_SPEND_CATEGORIES = [
  'travel',
  'stipend',
  'equipment',
  'training',
  'operations',
  'other',
];
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
export const JOB_APPLICATION_FAVOURITE_PRIORITIES = ['watching', 'warm', 'hot'];
export const JOB_INTERVIEW_TYPES = ['phone', 'video', 'onsite', 'panel', 'assignment', 'other'];
export const JOB_INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'];
export const JOB_APPLICATION_RESPONSE_DIRECTIONS = ['incoming', 'outgoing', 'system'];
export const JOB_APPLICATION_RESPONSE_CHANNELS = ['email', 'phone', 'portal', 'message', 'sms'];
export const JOB_APPLICATION_RESPONSE_STATUSES = ['pending', 'sent', 'received', 'acknowledged', 'needs_follow_up'];
export const AUTO_ASSIGN_STATUSES = [
  'pending',
  'notified',
  'accepted',
  'declined',
  'expired',
  'reassigned',
  'completed',
];
export const GIG_DELIVERY_STATUSES = ['draft', 'active', 'in_delivery', 'paused', 'completed', 'cancelled'];
export const GIG_STATUSES = [
  'draft',
  'preview',
  'published',
  'archived',
  'active',
  'in_delivery',
  'paused',
  'completed',
  'cancelled',
];
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
export const PROSPECT_SIGNAL_INTENT_LEVELS = ['low', 'medium', 'high'];
export const PROSPECT_SEARCH_ALERT_STATUSES = ['active', 'paused', 'snoozed'];
export const PROSPECT_SEARCH_ALERT_CHANNELS = ['email', 'slack', 'sms', 'webhook'];
export const PROSPECT_SEARCH_ALERT_CADENCES = ['real_time', 'daily', 'weekly'];
export const PROSPECT_CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed'];
export const PROSPECT_CAMPAIGN_AB_TEST_GROUPS = ['control', 'variant_a', 'variant_b'];
export const PROSPECT_TASK_STATUSES = ['open', 'in_progress', 'blocked', 'completed'];
export const PROSPECT_TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const PROSPECT_NOTE_VISIBILITIES = ['workspace', 'client_shared', 'restricted'];
export const PROSPECT_RELOCATION_STATUSES = ['remote', 'open_to_relocate', 'hybrid', 'not_open'];
export const ANALYTICS_ACTOR_TYPES = ['user', 'system', 'anonymous'];
export const PROVIDER_WORKSPACE_TYPES = ['agency', 'company', 'recruiter', 'partner'];
export const PROVIDER_WORKSPACE_MEMBER_ROLES = ['owner', 'admin', 'manager', 'staff', 'viewer'];
export const PROVIDER_WORKSPACE_MEMBER_STATUSES = ['pending', 'active', 'suspended', 'revoked'];
export const PROVIDER_WORKSPACE_INVITE_STATUSES = ['pending', 'accepted', 'expired', 'revoked'];
export const PROVIDER_CONTACT_NOTE_VISIBILITIES = ['internal', 'shared', 'compliance'];
export const PARTNER_COMMISSION_STATUSES = ['draft', 'pending', 'approved', 'invoiced', 'paid', 'overdue'];
export const PARTNER_AGREEMENT_STATUSES = ['draft', 'active', 'pending_renewal', 'suspended', 'terminated'];
export const PARTNER_COMPLIANCE_STATUSES = ['green', 'amber', 'red'];
export const PARTNER_COLLABORATION_EVENT_TYPES = [
  'message',
  'file',
  'note',
  'decision',
  'escalation',
  'calendar',
  'scorecard',
];
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
export const AGENCY_MENTORING_SESSION_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
];
export const AGENCY_MENTORING_PURCHASE_STATUSES = ['active', 'exhausted', 'expired', 'refunded'];
export const AGENCY_MENTOR_PREFERENCE_LEVELS = ['watch', 'consider', 'preferred', 'primary'];
export const AGENCY_TIMELINE_POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
export const AGENCY_TIMELINE_VISIBILITIES = ['internal', 'client', 'public'];
export const AGENCY_TIMELINE_DISTRIBUTION_CHANNELS = [
  'gigvora_feed',
  'email',
  'slack',
  'client_portal',
  'social',
];
export const ESCROW_ACCOUNT_STATUSES = ['pending', 'active', 'suspended', 'closed'];
export const ESCROW_TRANSACTION_TYPES = ['project', 'gig', 'milestone', 'retainer'];
export const ESCROW_RELEASE_POLICY_TYPES = [
  'auto_release_after_hours',
  'client_confirmation',
  'milestone_approval',
  'manual_review',
];
export const ESCROW_RELEASE_POLICY_STATUSES = ['draft', 'active', 'disabled'];
export const ESCROW_FEE_TIER_STATUSES = ['active', 'inactive'];
export const HEADHUNTER_INVITE_STATUSES = ['pending', 'accepted', 'declined', 'expired', 'revoked'];
export const HEADHUNTER_BRIEF_STATUSES = ['draft', 'shared', 'in_progress', 'filled', 'closed'];
export const HEADHUNTER_ASSIGNMENT_STATUSES = ['invited', 'accepted', 'submitted', 'shortlisted', 'placed', 'closed'];
export const HEADHUNTER_COMMISSION_STATUSES = ['pending', 'invoiced', 'paid', 'overdue', 'cancelled'];
export const TALENT_POOL_TYPES = ['silver_medalist', 'alumni', 'referral', 'campus', 'partner', 'internal'];
export const TALENT_POOL_STATUSES = ['active', 'paused', 'archived'];
export const TALENT_POOL_MEMBER_STATUSES = ['active', 'engaged', 'interview', 'offered', 'hired', 'archived'];
export const TALENT_POOL_MEMBER_SOURCE_TYPES = TALENT_POOL_TYPES;
export const TALENT_POOL_ENGAGEMENT_TYPES = ['email', 'call', 'event', 'meeting', 'note', 'update', 'campaign'];
export const AGENCY_BILLING_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
export const ESCROW_TRANSACTION_STATUSES = [
  'initiated',
  'funded',
  'in_escrow',
  'released',
  'refunded',
  'cancelled',
  'disputed',
];
export const ID_VERIFICATION_STATUSES = [
  'pending',
  'submitted',
  'in_review',
  'verified',
  'rejected',
  'expired',
];
export const ID_VERIFICATION_EVENT_TYPES = [
  'status_change',
  'note',
  'assignment',
  'document_request',
  'escalation',
  'reminder',
export const IDENTITY_VERIFICATION_EVENT_TYPES = [
  'submission_created',
  'status_changed',
  'assignment_updated',
  'document_updated',
  'note_recorded',
  'metadata_updated',
];
export const CORPORATE_VERIFICATION_STATUSES = [
  'pending',
  'submitted',
  'in_review',
  'verified',
  'rejected',
  'requires_update',
  'suspended',
];
export const QUALIFICATION_CREDENTIAL_STATUSES = [
  'unverified',
  'pending_review',
  'verified',
  'rejected',
];
export const WALLET_ACCOUNT_TYPES = ['user', 'freelancer', 'company', 'agency'];
export const WALLET_ACCOUNT_STATUSES = ['pending', 'active', 'suspended', 'closed'];
export const WALLET_LEDGER_ENTRY_TYPES = ['credit', 'debit', 'hold', 'release', 'adjustment'];
export const WALLET_FUNDING_SOURCE_TYPES = ['bank_account', 'card', 'manual_bank_transfer', 'digital_wallet', 'other'];
export const WALLET_FUNDING_SOURCE_STATUSES = ['pending', 'verified', 'failed', 'disabled'];
export const WALLET_TRANSFER_RULE_CADENCES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'];
export const WALLET_TRANSFER_RULE_STATUSES = ['active', 'paused', 'archived'];
export const WALLET_TRANSFER_TYPES = ['payout', 'escrow_reserve', 'escrow_release', 'top_up', 'refund'];
export const WALLET_TRANSFER_STATUSES = ['pending', 'scheduled', 'processing', 'completed', 'failed', 'cancelled'];
export const ESCROW_INTEGRATION_PROVIDERS = ['stripe', 'escrow_com'];
export const DISPUTE_STAGES = ['intake', 'mediation', 'arbitration', 'resolved'];
export const DISPUTE_STATUSES = ['open', 'awaiting_customer', 'under_review', 'settled', 'closed'];
export const DISPUTE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const DISPUTE_REASON_CODES = [
  'quality_issue',
  'scope_disagreement',
  'missed_deadline',
  'communication_breakdown',
  'fraud_concern',
  'payment_issue',
];
export const DISPUTE_ACTION_TYPES = [
  'comment',
  'evidence_upload',
  'deadline_adjusted',
  'stage_advanced',
  'status_change',
  'system_notice',
];
export const DISPUTE_ACTOR_TYPES = ['customer', 'provider', 'mediator', 'admin', 'system'];

export const NETWORKING_SESSION_STATUSES = ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'archived'];
export const NETWORKING_SESSION_ACCESS_TYPES = ['free', 'paid', 'invite_only'];
export const NETWORKING_SESSION_VISIBILITIES = ['private', 'workspace', 'public'];
export const NETWORKING_SESSION_SIGNUP_STATUSES = ['registered', 'waitlisted', 'checked_in', 'no_show', 'removed', 'completed'];
export const NETWORKING_SESSION_SIGNUP_SOURCES = ['self', 'host', 'admin', 'import'];
export const NETWORKING_SIGNUP_PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'refunded'];
export const NETWORKING_CONNECTION_STATUSES = ['new', 'follow_up', 'connected', 'archived'];
export const NETWORKING_CONNECTION_TYPES = ['follow', 'connect', 'collaboration'];
export const NETWORKING_BUSINESS_CARD_STATUSES = ['draft', 'published', 'archived'];
export const NETWORKING_ROTATION_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
export const NETWORKING_SESSION_ORDER_STATUSES = ['pending', 'paid', 'refunded', 'cancelled'];
export const NETWORKING_CONNECTION_FOLLOW_STATUSES = ['saved', 'requested', 'following', 'connected', 'archived'];

export const OPPORTUNITY_TAXONOMY_TYPES = ['job', 'gig', 'freelance', 'volunteering', 'launchpad'];
export const AD_TYPES = ['video', 'display', 'text'];
export const AD_STATUSES = ['draft', 'scheduled', 'active', 'paused', 'expired'];
export const AD_PACING_MODES = ['even', 'accelerated', 'asap'];
export const AD_OBJECTIVES = ['brand', 'acquisition', 'retention', 'cross_sell'];
export const AD_SURFACE_TYPES = [
  'global_dashboard',
  'company_dashboard',
  'agency_dashboard',
  'freelancer_dashboard',
  'user_dashboard',
  'headhunter_dashboard',
  'admin_dashboard',
  'pipeline_dashboard',
];
export const AD_SURFACE_LAYOUT_MODES = ['inline', 'hero', 'carousel', 'grid'];
export const AD_POSITION_TYPES = ['hero', 'sidebar', 'inline', 'footer'];
export const AD_KEYWORD_INTENTS = ['awareness', 'consideration', 'conversion', 'retention'];
export const AD_OPPORTUNITY_TYPES = ['awareness', 'acquisition', 'retention', 'upsell'];
export const AD_COUPON_STATUSES = ['draft', 'scheduled', 'active', 'paused', 'expired', 'archived'];
export const AD_COUPON_DISCOUNT_TYPES = ['percentage', 'fixed_amount'];
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
export const GIG_ORDER_REVISION_LIFECYCLE_STATUSES = [
  'requested',
  'open',
  'in_progress',
  'awaiting_client',
  'submitted',
  'approved',
  'rejected',
  'declined',
  'completed',
  'cancelled',
  'archived',
];
export const GIG_ORDER_REVISION_STATUSES = [
  'requested',
  'open',
  'in_progress',
  'submitted',
  'approved',
  'rejected',
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
export const MENTORING_SESSION_NOTE_VISIBILITIES = ['internal', 'mentor', 'mentee', 'public'];
export const MENTORING_SESSION_ACTION_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
export const MENTORING_SESSION_ACTION_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
export const MENTORSHIP_ORDER_STATUSES = ['pending', 'active', 'completed', 'cancelled'];
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
export const TALENT_CANDIDATE_TYPES = ['permanent', 'contractor', 'collective'];
export const TALENT_CANDIDATE_STATUSES = ['prospect', 'applied', 'interview', 'offer', 'hired', 'rejected', 'talent_pool'];
export const TALENT_INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show', 'feedback_pending'];
export const TALENT_OFFER_STATUSES = ['draft', 'sent', 'signed', 'declined', 'withdrawn'];
export const PEOPLE_OPS_POLICY_STATUSES = ['draft', 'active', 'archived'];
export const PEOPLE_OPS_PERFORMANCE_STATUSES = ['not_started', 'in_progress', 'completed', 'closed'];
export const PEOPLE_OPS_WELLBEING_RISKS = ['low', 'medium', 'high', 'critical'];
export const INTERNAL_OPPORTUNITY_STATUSES = ['draft', 'open', 'matched', 'filled', 'closed'];
export const INTERNAL_OPPORTUNITY_CATEGORIES = [
  'project',
  'mentorship',
  'community',
  'bench_initiative',
  'learning',
];
export const INTERNAL_MATCH_STATUSES = ['new', 'contacted', 'accepted', 'declined', 'expired'];
export const BRANDING_ASSET_TYPES = ['banner', 'media_kit', 'social_card', 'template', 'video_intro'];
export const BRANDING_ASSET_STATUSES = ['draft', 'in_review', 'approved', 'published', 'retired'];
export const BRANDING_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];
export const EMPLOYER_BRAND_STORY_TYPES = ['culture', 'employee_spotlight', 'event', 'award', 'initiative'];
export const EMPLOYER_BRAND_STORY_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
export const EMPLOYER_BENEFIT_CATEGORIES = ['health', 'wellness', 'compensation', 'flexibility', 'development', 'culture'];
export const EMPLOYEE_JOURNEY_PROGRAM_TYPES = ['onboarding', 'mobility', 'performance'];
export const EMPLOYEE_JOURNEY_HEALTH_STATUSES = ['on_track', 'at_risk', 'off_track', 'needs_attention'];
export const WORKSPACE_INTEGRATION_CATEGORIES = ['calendar', 'hris', 'communication', 'ats', 'productivity', 'other'];
export const WORKSPACE_INTEGRATION_STATUSES = ['connected', 'disconnected', 'error', 'pending'];
export const WORKSPACE_INTEGRATION_SYNC_FREQUENCIES = ['manual', 'hourly', 'daily', 'weekly'];
export const WORKSPACE_INTEGRATION_AUTH_TYPES = ['oauth', 'api_key', 'service_account'];
export const WORKSPACE_INTEGRATION_ENVIRONMENTS = ['production', 'sandbox', 'staging'];
export const WORKSPACE_INTEGRATION_SYNC_STATUSES = ['pending', 'success', 'warning', 'error'];
export const WORKSPACE_INTEGRATION_CREDENTIAL_TYPES = ['oauth_refresh_token', 'api_key', 'service_account'];
export const WORKSPACE_INTEGRATION_INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'];
export const WORKSPACE_INTEGRATION_INCIDENT_STATUSES = ['open', 'monitoring', 'resolved'];
export const WORKSPACE_INTEGRATION_SYNC_RUN_STATUSES = ['queued', 'running', 'success', 'warning', 'error'];
export const WORKSPACE_INTEGRATION_SECRET_TYPES = ['api_key', 'oauth_token', 'webhook_secret', 'custom'];
export const WORKSPACE_INTEGRATION_WEBHOOK_STATUSES = ['active', 'paused', 'disabled'];
export const WORKSPACE_INTEGRATION_AUDIT_EVENT_TYPES = [
  'integration_created',
  'integration_updated',
  'secret_created',
  'secret_rotated',
  'webhook_created',
  'webhook_updated',
  'webhook_deleted',
  'connection_tested',
  'sync_triggered',
];
export const WORKSPACE_CALENDAR_CONNECTION_STATUSES = ['connected', 'sync_error', 'disconnected', 'pending'];
export const CAREER_DOCUMENT_TYPES = ['cv', 'cover_letter', 'portfolio', 'brand_asset', 'story_block'];
export const CAREER_DOCUMENT_STATUSES = ['draft', 'in_review', 'approved', 'archived'];
export const CAREER_DOCUMENT_VERSION_APPROVAL_STATUSES = ['draft', 'pending_review', 'approved', 'rejected'];
export const CAREER_DOCUMENT_COLLABORATOR_ROLES = ['owner', 'mentor', 'reviewer', 'viewer'];
export const CAREER_DOCUMENT_EXPORT_FORMATS = ['pdf', 'docx', 'web', 'html'];
export const CAREER_DOCUMENT_ANALYTICS_VIEWER_TYPES = ['recruiter', 'mentor', 'system', 'external'];
export const CAREER_STORY_BLOCK_TONES = ['formal', 'friendly', 'bold', 'warm', 'executive'];
export const CAREER_STORY_BLOCK_STATUSES = ['draft', 'approved', 'archived'];
export const CAREER_BRAND_ASSET_TYPES = ['testimonial', 'case_study', 'banner', 'video', 'portfolio', 'press'];
export const CAREER_BRAND_ASSET_STATUSES = ['draft', 'published', 'archived'];
export const CAREER_BRAND_ASSET_APPROVAL_STATUSES = ['draft', 'in_review', 'approved', 'rejected'];

export const CAREER_PIPELINE_STAGE_TYPES = ['sourcing', 'applied', 'interview', 'offer', 'decision'];
export const CAREER_PIPELINE_STAGE_OUTCOMES = ['open', 'won', 'lost', 'on_hold'];
export const CAREER_OPPORTUNITY_FOLLOW_UP_STATUSES = ['on_track', 'attention', 'overdue'];
export const CAREER_COMPLIANCE_STATUSES = ['not_required', 'pending', 'complete', 'flagged'];
export const CAREER_CANDIDATE_BRIEF_STATUSES = ['draft', 'shareable', 'archived'];
export const CAREER_INTERVIEW_WORKSPACE_STATUSES = [
  'planning',
  'scheduled',
  'in_progress',
  'completed',
  'archived',
];
export const CAREER_INTERVIEW_TASK_STATUSES = ['pending', 'in_progress', 'completed', 'blocked'];
export const CAREER_INTERVIEW_TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const CAREER_INTERVIEW_RECOMMENDATIONS = ['advance', 'hold', 'reject', 'hire'];
export const CAREER_NUDGE_SEVERITIES = ['info', 'warning', 'critical'];
export const CAREER_NUDGE_CHANNELS = ['email', 'sms', 'slack', 'in_app'];
export const CAREER_OFFER_STATUSES = ['draft', 'review', 'negotiating', 'accepted', 'declined', 'expired'];
export const CAREER_OFFER_DECISIONS = ['pending', 'accepted', 'declined', 'counter'];
export const CAREER_AUTO_APPLY_RULE_STATUSES = ['draft', 'sandbox', 'active', 'paused', 'retired'];
export const CAREER_AUTO_APPLY_TEST_STATUSES = ['pending', 'running', 'passed', 'failed'];
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

export const EXECUTIVE_METRIC_CATEGORIES = ['financial', 'delivery', 'talent', 'client', 'compliance', 'innovation'];
export const EXECUTIVE_METRIC_UNITS = ['currency', 'percentage', 'count', 'ratio', 'score', 'duration'];
export const EXECUTIVE_METRIC_TRENDS = ['up', 'down', 'steady'];
export const EXECUTIVE_SCENARIO_TYPES = ['best', 'base', 'worst'];
export const EXECUTIVE_SCENARIO_DIMENSION_TYPES = ['client', 'service_line', 'squad', 'individual'];
export const GOVERNANCE_RISK_CATEGORIES = ['compliance', 'delivery', 'finance', 'talent', 'technology', 'client'];
export const GOVERNANCE_RISK_STATUSES = ['open', 'monitoring', 'mitigated', 'closed'];
export const LEADERSHIP_RITUAL_CADENCES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'];
export const LEADERSHIP_DECISION_STATUSES = ['proposed', 'in_review', 'approved', 'implemented', 'deferred'];
export const LEADERSHIP_OKR_STATUSES = ['on_track', 'at_risk', 'off_track', 'achieved'];
export const LEADERSHIP_BRIEFING_STATUSES = ['draft', 'circulating', 'archived'];
export const INNOVATION_INITIATIVE_STAGES = ['ideation', 'validation', 'pilot', 'scale', 'retired'];
export const INNOVATION_INITIATIVE_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const INNOVATION_INITIATIVE_CATEGORIES = ['service_line', 'r_and_d', 'product', 'process', 'automation'];
export const INNOVATION_FUNDING_EVENT_TYPES = ['allocation', 'burn', 'return'];

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
export const GIG_ORDER_REVISION_WORKFLOW_STATUSES = [
  'requested',
  'in_progress',
  'submitted',
  'approved',
  'rejected',
];
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

export const CLIENT_ENGAGEMENT_CONTRACT_STATUSES = [
  'draft',
  'awaiting_signature',
  'active',
  'renewal_due',
  'closed',
];
export const CLIENT_ENGAGEMENT_MILESTONE_KINDS = ['milestone', 'roi', 'story', 'health', 'update'];
export const CLIENT_ENGAGEMENT_MILESTONE_STATUSES = ['planned', 'in_progress', 'completed', 'at_risk'];
export const CLIENT_ENGAGEMENT_PORTAL_STATUSES = ['draft', 'active', 'paused', 'archived'];
export const ENGAGEMENT_SCHEDULE_SCOPES = ['personal', 'shared', 'availability'];
export const ENGAGEMENT_SCHEDULE_VISIBILITIES = ['private', 'internal', 'client'];
export const ISSUE_RESOLUTION_CASE_STATUSES = [
  'open',
  'in_progress',
  'awaiting_client',
  'escalated',
  'resolved',
  'closed',
];
export const ISSUE_RESOLUTION_SEVERITIES = ['low', 'medium', 'high', 'critical'];
export const ISSUE_RESOLUTION_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const ISSUE_RESOLUTION_EVENT_TYPES = ['note', 'escalation', 'update', 'resolution', 'handoff'];

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

export const GIG_PREVIEW_STATUSES = ['draft', 'preview', 'published', 'archived'];
export const GIG_BUILDER_STATUSES = ['draft', 'preview', 'published', 'archived'];
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
export const CALENDAR_EVENT_TYPES = [
  'interview',
  'job_interview',
  'networking',
  'project',
  'project_milestone',
  'gig',
  'mentorship',
  'volunteering',
  'event',
  'wellbeing',
  'deadline',
  'ritual',
export const CALENDAR_EVENT_TYPES = ['interview', 'networking', 'project', 'wellbeing', 'deadline', 'ritual'];
export const FREELANCER_CALENDAR_EVENT_TYPES = [
  'project',
  'gig',
  'job_interview',
  'mentorship',
  'volunteering',
  'client_meeting',
  'other',
];
export const FREELANCER_CALENDAR_EVENT_STATUSES = [
  'tentative',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];
export const FREELANCER_CALENDAR_RELATED_TYPES = [
  'project',
  'gig',
  'job',
  'mentorship',
  'volunteering',
  'client',
  'community',
  'other',
];
export const CALENDAR_EVENT_SOURCES = ['manual', 'google', 'outlook', 'gigvora'];
export const ADMIN_CALENDAR_SYNC_STATUSES = ['connected', 'syncing', 'needs_attention', 'disconnected'];
export const ADMIN_CALENDAR_EVENT_STATUSES = ['draft', 'scheduled', 'published', 'cancelled'];
export const ADMIN_CALENDAR_VISIBILITIES = ['internal', 'external', 'private'];
export const ADMIN_CALENDAR_EVENT_TYPES = ['ops_review', 'training', 'launch', 'webinar', 'support', 'governance'];
export const FOCUS_SESSION_TYPES = ['interview_prep', 'networking', 'application', 'deep_work', 'wellbeing'];
export const CALENDAR_EVENT_VISIBILITIES = ['private', 'shared', 'public'];
export const CALENDAR_DEFAULT_VIEWS = ['agenda', 'week', 'month'];
export const FOCUS_SESSION_TYPES = [
  'interview_prep',
  'networking',
  'application',
  'deep_work',
  'wellbeing',
  'mentorship',
  'volunteering',
];
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

export const HEADHUNTER_PIPELINE_STAGE_TYPES = [
  'discovery',
  'qualification',
  'interview',
  'offer',
  'placement',
  'archive',
];
export const HEADHUNTER_PIPELINE_ITEM_STATUSES = ['active', 'paused', 'won', 'lost', 'pass_on'];
export const HEADHUNTER_PIPELINE_NOTE_VISIBILITIES = ['internal', 'client_ready', 'shared'];
export const HEADHUNTER_INTERVIEW_TYPES = ['intro', 'client_interview', 'prep', 'debrief'];
export const HEADHUNTER_INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled'];
export const HEADHUNTER_PASS_ON_TARGET_TYPES = ['agency', 'company', 'workspace', 'search'];
export const HEADHUNTER_PASS_ON_STATUSES = ['draft', 'shared', 'accepted', 'declined', 'withdrawn'];
export const HEADHUNTER_CONSENT_STATUSES = ['pending', 'granted', 'revoked'];
