const stubTarget = function stubModel() {};
const stubModel = new Proxy(stubTarget, {
  get: (target, prop) => {
    if (prop === Symbol.toStringTag) {
      return 'StubModel';
    }
    if (prop === 'then') {
      return undefined;
    }
    const value = target[prop];
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return stubModel;
  },
  apply: () => stubModel,
  construct: () => stubModel,
});

const enumTarget = [];
const stubEnum = new Proxy(enumTarget, {
  get: (target, prop) => {
    if (prop === Symbol.iterator) {
      return target[Symbol.iterator].bind(target);
    }
    if (typeof target[prop] === 'function') {
      return target[prop].bind(target);
    }
    return 'stub';
  },
  has: () => true,
});

const modelRegistry = new Map();

function createModelBinding(name) {
  const proxy = new Proxy(function modelBinding() {}, {
    get: (_, prop) => {
      if (prop === Symbol.toStringTag) {
        return 'ModelProxy';
      }
      const binding = modelRegistry.get(name);
      if (!binding) {
        return stubModel[prop];
      }
      const value = binding[prop];
      if (typeof value === 'function') {
        return value.bind(binding);
      }
      if (value === undefined) {
        return stubModel[prop];
      }
      return value;
    },
    apply: (_target, thisArg, args) => {
      const binding = modelRegistry.get(name);
      if (typeof binding === 'function') {
        return binding.apply(thisArg, args);
      }
      return stubModel(...args);
    },
    construct: (_, args) => {
      const binding = modelRegistry.get(name);
      if (typeof binding === 'function') {
        return new binding(...args);
      }
      return stubModel;
    },
  });
  modelRegistry.set(name, stubModel);
  return proxy;
}

function createEnumBinding() {
  return stubEnum;
}

function identityFactory(tag) {
  return (...args) => ({
    type: tag,
    args,
  });
}

export const sequelize = {
  define: () => stubModel,
  models: {},
  authenticate: async () => {},
  close: async () => {},
  getDialect: () => 'postgres',
  fn: identityFactory('fn'),
  col: identityFactory('col'),
  literal: identityFactory('literal'),
};

export const domainRegistry = {
  registerContext: () => {},
  getContext: () => ({}),
  listContexts: () => [],
  getUnassignedModelNames: () => [],
};

export const __setModelStubs = (overrides = {}) => {
  Object.entries(overrides).forEach(([key, value]) => {
    if (modelRegistry.has(key)) {
      modelRegistry.set(key, value ?? stubModel);
    }
  });
};

export default stubModel;

export const AdCampaign = createModelBinding('AdCampaign');
export const AdCoupon = createModelBinding('AdCoupon');
export const AdCreative = createModelBinding('AdCreative');
export const AdKeyword = createModelBinding('AdKeyword');
export const AdKeywordAssignment = createModelBinding('AdKeywordAssignment');
export const AdminCalendarAccount = createModelBinding('AdminCalendarAccount');
export const AdminCalendarAvailabilityWindow = createModelBinding('AdminCalendarAvailabilityWindow');
export const AdminCalendarEvent = createModelBinding('AdminCalendarEvent');
export const AdminCalendarTemplate = createModelBinding('AdminCalendarTemplate');
export const AdminEscrowAdjustment = createModelBinding('AdminEscrowAdjustment');
export const AdminFeeRule = createModelBinding('AdminFeeRule');
export const AdminPayoutSchedule = createModelBinding('AdminPayoutSchedule');
export const AdminTimeline = createModelBinding('AdminTimeline');
export const AdminTimelineEvent = createModelBinding('AdminTimelineEvent');
export const AdminTreasuryPolicy = createModelBinding('AdminTreasuryPolicy');
export const AdPlacement = createModelBinding('AdPlacement');
export const AdPlacementCoupon = createModelBinding('AdPlacementCoupon');
export const AdSurfaceSetting = createModelBinding('AdSurfaceSetting');
export const AdvisorCollaboration = createModelBinding('AdvisorCollaboration');
export const AdvisorCollaborationAuditLog = createModelBinding('AdvisorCollaborationAuditLog');
export const AdvisorCollaborationMember = createModelBinding('AdvisorCollaborationMember');
export const AdvisorDocumentRoom = createModelBinding('AdvisorDocumentRoom');
export const AgencyAiConfiguration = createModelBinding('AgencyAiConfiguration');
export const AgencyAlliance = createModelBinding('AgencyAlliance');
export const AgencyAllianceMember = createModelBinding('AgencyAllianceMember');
export const AgencyAlliancePod = createModelBinding('AgencyAlliancePod');
export const AgencyAlliancePodMember = createModelBinding('AgencyAlliancePodMember');
export const AgencyAllianceRateCard = createModelBinding('AgencyAllianceRateCard');
export const AgencyAllianceRateCardApproval = createModelBinding('AgencyAllianceRateCardApproval');
export const AgencyAllianceResourceSlot = createModelBinding('AgencyAllianceResourceSlot');
export const AgencyAllianceRevenueSplit = createModelBinding('AgencyAllianceRevenueSplit');
export const AgencyAutoBidTemplate = createModelBinding('AgencyAutoBidTemplate');
export const AgencyCalendarEvent = createModelBinding('AgencyCalendarEvent');
export const AgencyCollaboration = createModelBinding('AgencyCollaboration');
export const AgencyCollaborationInvitation = createModelBinding('AgencyCollaborationInvitation');
export const AgencyCreationAsset = createModelBinding('AgencyCreationAsset');
export const AgencyCreationCollaborator = createModelBinding('AgencyCreationCollaborator');
export const AgencyCreationItem = createModelBinding('AgencyCreationItem');
export const AgencyDashboardOverview = createModelBinding('AgencyDashboardOverview');
export const AgencyMentoringPurchase = createModelBinding('AgencyMentoringPurchase');
export const AgencyMentoringSession = createModelBinding('AgencyMentoringSession');
export const AgencyMentorPreference = createModelBinding('AgencyMentorPreference');
export const AgencyProfile = createModelBinding('AgencyProfile');
export const AgencyProfileCredential = createModelBinding('AgencyProfileCredential');
export const AgencyProfileExperience = createModelBinding('AgencyProfileExperience');
export const AgencyProfileMedia = createModelBinding('AgencyProfileMedia');
export const AgencyProfileSkill = createModelBinding('AgencyProfileSkill');
export const AgencyProfileWorkforceSegment = createModelBinding('AgencyProfileWorkforceSegment');
export const AgencyRateCard = createModelBinding('AgencyRateCard');
export const AgencyRateCardItem = createModelBinding('AgencyRateCardItem');
export const AgencyRetainerEvent = createModelBinding('AgencyRetainerEvent');
export const AgencyRetainerNegotiation = createModelBinding('AgencyRetainerNegotiation');
export const AgencyTimelinePost = createModelBinding('AgencyTimelinePost');
export const AgencyTimelinePostMetric = createModelBinding('AgencyTimelinePostMetric');
export const AgencyTimelinePostRevision = createModelBinding('AgencyTimelinePostRevision');
export const AgencyWalletFundingSource = createModelBinding('AgencyWalletFundingSource');
export const AgencyWalletTransferRule = createModelBinding('AgencyWalletTransferRule');
export const AiServiceRecommendation = createModelBinding('AiServiceRecommendation');
export const AnalyticsDailyRollup = createModelBinding('AnalyticsDailyRollup');
export const AnalyticsEvent = createModelBinding('AnalyticsEvent');
export const Application = createModelBinding('Application');
export const ApplicationReview = createModelBinding('ApplicationReview');
export const AutoAssignQueueEntry = createModelBinding('AutoAssignQueueEntry');
export const AutoAssignResponse = createModelBinding('AutoAssignResponse');
export const BlogCategory = createModelBinding('BlogCategory');
export const BlogComment = createModelBinding('BlogComment');
export const BlogMedia = createModelBinding('BlogMedia');
export const BlogPost = createModelBinding('BlogPost');
export const BlogPostMedia = createModelBinding('BlogPostMedia');
export const BlogPostMetric = createModelBinding('BlogPostMetric');
export const BlogPostTag = createModelBinding('BlogPostTag');
export const BlogTag = createModelBinding('BlogTag');
export const CalendarAvailabilitySnapshot = createModelBinding('CalendarAvailabilitySnapshot');
export const CalendarIntegration = createModelBinding('CalendarIntegration');
export const CalendarSyncJob = createModelBinding('CalendarSyncJob');
export const CandidateCalendarEvent = createModelBinding('CandidateCalendarEvent');
export const CareerAnalyticsSnapshot = createModelBinding('CareerAnalyticsSnapshot');
export const CareerAutoApplyAnalytics = createModelBinding('CareerAutoApplyAnalytics');
export const CareerAutoApplyRule = createModelBinding('CareerAutoApplyRule');
export const CareerAutoApplyTestRun = createModelBinding('CareerAutoApplyTestRun');
export const CareerBrandAsset = createModelBinding('CareerBrandAsset');
export const CareerCandidateBrief = createModelBinding('CareerCandidateBrief');
export const CareerDocument = createModelBinding('CareerDocument');
export const CareerDocumentAnalytics = createModelBinding('CareerDocumentAnalytics');
export const CareerDocumentCollaborator = createModelBinding('CareerDocumentCollaborator');
export const CareerDocumentExport = createModelBinding('CareerDocumentExport');
export const CareerDocumentVersion = createModelBinding('CareerDocumentVersion');
export const CareerInterviewScorecard = createModelBinding('CareerInterviewScorecard');
export const CareerInterviewTask = createModelBinding('CareerInterviewTask');
export const CareerInterviewWorkspace = createModelBinding('CareerInterviewWorkspace');
export const CareerOfferDocument = createModelBinding('CareerOfferDocument');
export const CareerOfferPackage = createModelBinding('CareerOfferPackage');
export const CareerOfferScenario = createModelBinding('CareerOfferScenario');
export const CareerOpportunity = createModelBinding('CareerOpportunity');
export const CareerOpportunityCollaborator = createModelBinding('CareerOpportunityCollaborator');
export const CareerOpportunityNudge = createModelBinding('CareerOpportunityNudge');
export const CareerPeerBenchmark = createModelBinding('CareerPeerBenchmark');
export const CareerPipelineBoard = createModelBinding('CareerPipelineBoard');
export const CareerPipelineStage = createModelBinding('CareerPipelineStage');
export const CareerStoryBlock = createModelBinding('CareerStoryBlock');
export const ChangeRequest = createModelBinding('ChangeRequest');
export const ClientPortal = createModelBinding('ClientPortal');
export const ClientPortalDecisionLog = createModelBinding('ClientPortalDecisionLog');
export const ClientPortalInsightWidget = createModelBinding('ClientPortalInsightWidget');
export const ClientPortalScopeItem = createModelBinding('ClientPortalScopeItem');
export const ClientPortalTimelineEvent = createModelBinding('ClientPortalTimelineEvent');
export const ClientSuccessAffiliateLink = createModelBinding('ClientSuccessAffiliateLink');
export const ClientSuccessEnrollment = createModelBinding('ClientSuccessEnrollment');
export const ClientSuccessEvent = createModelBinding('ClientSuccessEvent');
export const ClientSuccessPlaybook = createModelBinding('ClientSuccessPlaybook');
export const ClientSuccessReferral = createModelBinding('ClientSuccessReferral');
export const ClientSuccessReviewNudge = createModelBinding('ClientSuccessReviewNudge');
export const ClientSuccessStep = createModelBinding('ClientSuccessStep');
export const CollaborationAiSession = createModelBinding('CollaborationAiSession');
export const CollaborationAnnotation = createModelBinding('CollaborationAnnotation');
export const CollaborationAsset = createModelBinding('CollaborationAsset');
export const CollaborationHuddle = createModelBinding('CollaborationHuddle');
export const CollaborationHuddleParticipant = createModelBinding('CollaborationHuddleParticipant');
export const CollaborationHuddleTemplate = createModelBinding('CollaborationHuddleTemplate');
export const CollaborationParticipant = createModelBinding('CollaborationParticipant');
export const CollaborationRepository = createModelBinding('CollaborationRepository');
export const CollaborationRoom = createModelBinding('CollaborationRoom');
export const CollaborationSpace = createModelBinding('CollaborationSpace');
export const CommunitySpotlight = createModelBinding('CommunitySpotlight');
export const CommunitySpotlightAsset = createModelBinding('CommunitySpotlightAsset');
export const CommunitySpotlightHighlight = createModelBinding('CommunitySpotlightHighlight');
export const CommunitySpotlightNewsletterFeature = createModelBinding('CommunitySpotlightNewsletterFeature');
export const CompanyProfile = createModelBinding('CompanyProfile');
export const CompanyProfileConnection = createModelBinding('CompanyProfileConnection');
export const CompanyProfileFollower = createModelBinding('CompanyProfileFollower');
export const CompanyTimelineEvent = createModelBinding('CompanyTimelineEvent');
export const CompanyTimelinePost = createModelBinding('CompanyTimelinePost');
export const CompanyTimelinePostMetric = createModelBinding('CompanyTimelinePostMetric');
export const ComplianceDocument = createModelBinding('ComplianceDocument');
export const ComplianceDocumentVersion = createModelBinding('ComplianceDocumentVersion');
export const ComplianceLocalization = createModelBinding('ComplianceLocalization');
export const ComplianceObligation = createModelBinding('ComplianceObligation');
export const ComplianceReminder = createModelBinding('ComplianceReminder');
export const Connection = createModelBinding('Connection');
export const CorporateVerification = createModelBinding('CorporateVerification');
export const DataExportRequest = createModelBinding('DataExportRequest');
export const DeliverableDeliveryPackage = createModelBinding('DeliverableDeliveryPackage');
export const DeliverableVault = createModelBinding('DeliverableVault');
export const DeliverableVaultItem = createModelBinding('DeliverableVaultItem');
export const DeliverableVersion = createModelBinding('DeliverableVersion');
export const DisputeCase = createModelBinding('DisputeCase');
export const DisputeEvent = createModelBinding('DisputeEvent');
export const DisputeTemplate = createModelBinding('DisputeTemplate');
export const DisputeWorkflowSetting = createModelBinding('DisputeWorkflowSetting');
export const DomainGovernanceReview = createModelBinding('DomainGovernanceReview');
export const EmployerBrandAsset = createModelBinding('EmployerBrandAsset');
export const EscrowAccount = createModelBinding('EscrowAccount');
export const EscrowFeeTier = createModelBinding('EscrowFeeTier');
export const EscrowReleasePolicy = createModelBinding('EscrowReleasePolicy');
export const EscrowTransaction = createModelBinding('EscrowTransaction');
export const ExecutiveIntelligenceMetric = createModelBinding('ExecutiveIntelligenceMetric');
export const ExecutiveScenarioBreakdown = createModelBinding('ExecutiveScenarioBreakdown');
export const ExecutiveScenarioPlan = createModelBinding('ExecutiveScenarioPlan');
export const ExperienceLaunchpad = createModelBinding('ExperienceLaunchpad');
export const ExperienceLaunchpadApplication = createModelBinding('ExperienceLaunchpadApplication');
export const ExperienceLaunchpadEmployerRequest = createModelBinding('ExperienceLaunchpadEmployerRequest');
export const ExperienceLaunchpadOpportunityLink = createModelBinding('ExperienceLaunchpadOpportunityLink');
export const ExperienceLaunchpadPlacement = createModelBinding('ExperienceLaunchpadPlacement');
export const ExplorerInteraction = createModelBinding('ExplorerInteraction');
export const ExplorerRecord = createModelBinding('ExplorerRecord');
export const FeedComment = createModelBinding('FeedComment');
export const FeedPost = createModelBinding('FeedPost');
export const FeedReaction = createModelBinding('FeedReaction');
export const FinanceExpenseEntry = createModelBinding('FinanceExpenseEntry');
export const FinanceForecastScenario = createModelBinding('FinanceForecastScenario');
export const FinancePayoutBatch = createModelBinding('FinancePayoutBatch');
export const FinancePayoutSplit = createModelBinding('FinancePayoutSplit');
export const FinanceRevenueEntry = createModelBinding('FinanceRevenueEntry');
export const FinanceSavingsGoal = createModelBinding('FinanceSavingsGoal');
export const FinanceTaxExport = createModelBinding('FinanceTaxExport');
export const FinancialEngagementSummary = createModelBinding('FinancialEngagementSummary');
export const FocusSession = createModelBinding('FocusSession');
export const FreelancerAssignmentMetric = createModelBinding('FreelancerAssignmentMetric');
export const FreelancerAutoMatchPreference = createModelBinding('FreelancerAutoMatchPreference');
export const FreelancerCalendarEvent = createModelBinding('FreelancerCalendarEvent');
export const FreelancerCatalogBundle = createModelBinding('FreelancerCatalogBundle');
export const FreelancerCatalogBundleMetric = createModelBinding('FreelancerCatalogBundleMetric');
export const FreelancerCertification = createModelBinding('FreelancerCertification');
export const FreelancerCostBreakdown = createModelBinding('FreelancerCostBreakdown');
export const FreelancerCrossSellOpportunity = createModelBinding('FreelancerCrossSellOpportunity');
export const FreelancerDashboardOverview = createModelBinding('FreelancerDashboardOverview');
export const FreelancerDeductionSummary = createModelBinding('FreelancerDeductionSummary');
export const FreelancerExpertiseArea = createModelBinding('FreelancerExpertiseArea');
export const FreelancerFinanceControl = createModelBinding('FreelancerFinanceControl');
export const FreelancerFinanceMetric = createModelBinding('FreelancerFinanceMetric');
export const FreelancerHeroBanner = createModelBinding('FreelancerHeroBanner');
export const FreelancerKeywordImpression = createModelBinding('FreelancerKeywordImpression');
export const FreelancerMarginSnapshot = createModelBinding('FreelancerMarginSnapshot');
export const FreelancerOperationsMembership = createModelBinding('FreelancerOperationsMembership');
export const FreelancerOperationsNotice = createModelBinding('FreelancerOperationsNotice');
export const FreelancerOperationsSnapshot = createModelBinding('FreelancerOperationsSnapshot');
export const FreelancerOperationsWorkflow = createModelBinding('FreelancerOperationsWorkflow');
export const FreelancerPayout = createModelBinding('FreelancerPayout');
export const FreelancerPortfolioAsset = createModelBinding('FreelancerPortfolioAsset');
export const FreelancerPortfolioItem = createModelBinding('FreelancerPortfolioItem');
export const FreelancerPortfolioSetting = createModelBinding('FreelancerPortfolioSetting');
export const FreelancerProfile = createModelBinding('FreelancerProfile');
export const FreelancerProfitabilityMetric = createModelBinding('FreelancerProfitabilityMetric');
export const FreelancerRepeatClient = createModelBinding('FreelancerRepeatClient');
export const FreelancerRevenueMonthly = createModelBinding('FreelancerRevenueMonthly');
export const FreelancerRevenueStream = createModelBinding('FreelancerRevenueStream');
export const FreelancerReview = createModelBinding('FreelancerReview');
export const FreelancerSavingsGoal = createModelBinding('FreelancerSavingsGoal');
export const FreelancerSuccessMetric = createModelBinding('FreelancerSuccessMetric');
export const FreelancerTaxEstimate = createModelBinding('FreelancerTaxEstimate');
export const FreelancerTaxFiling = createModelBinding('FreelancerTaxFiling');
export const FreelancerTestimonial = createModelBinding('FreelancerTestimonial');
export const FreelancerTimelineEntry = createModelBinding('FreelancerTimelineEntry');
export const FreelancerTimelinePost = createModelBinding('FreelancerTimelinePost');
export const FreelancerTimelinePostMetric = createModelBinding('FreelancerTimelinePostMetric');
export const FreelancerTimelineWorkspace = createModelBinding('FreelancerTimelineWorkspace');
export const Gig = createModelBinding('Gig');
export const GigAddon = createModelBinding('GigAddon');
export const GigAddOn = createModelBinding('GigAddOn');
export const GigAvailabilitySlot = createModelBinding('GigAvailabilitySlot');
export const GigBundle = createModelBinding('GigBundle');
export const GigBundleItem = createModelBinding('GigBundleItem');
export const GigCallToAction = createModelBinding('GigCallToAction');
export const GigCatalogItem = createModelBinding('GigCatalogItem');
export const GigMediaAsset = createModelBinding('GigMediaAsset');
export const GigMilestone = createModelBinding('GigMilestone');
export const GigOrder = createModelBinding('GigOrder');
export const GigOrderActivity = createModelBinding('GigOrderActivity');
export const GigOrderEscrowCheckpoint = createModelBinding('GigOrderEscrowCheckpoint');
export const GigOrderPayout = createModelBinding('GigOrderPayout');
export const GigOrderRequirement = createModelBinding('GigOrderRequirement');
export const GigOrderRevision = createModelBinding('GigOrderRevision');
export const GigPackage = createModelBinding('GigPackage');
export const GigPerformanceSnapshot = createModelBinding('GigPerformanceSnapshot');
export const GigPreviewLayout = createModelBinding('GigPreviewLayout');
export const GigUpsell = createModelBinding('GigUpsell');
export const GigVendorScorecard = createModelBinding('GigVendorScorecard');
export const GovernanceAuditExport = createModelBinding('GovernanceAuditExport');
export const GovernanceRiskRegister = createModelBinding('GovernanceRiskRegister');
export const Group = createModelBinding('Group');
export const GroupInvite = createModelBinding('GroupInvite');
export const GroupMembership = createModelBinding('GroupMembership');
export const GroupPost = createModelBinding('GroupPost');
export const IdentityVerification = createModelBinding('IdentityVerification');
export const IdentityVerificationEvent = createModelBinding('IdentityVerificationEvent');
export const InnovationFundingEvent = createModelBinding('InnovationFundingEvent');
export const InnovationInitiative = createModelBinding('InnovationInitiative');
export const InternalOpportunity = createModelBinding('InternalOpportunity');
export const InternalOpportunityMatch = createModelBinding('InternalOpportunityMatch');
export const InterviewSchedule = createModelBinding('InterviewSchedule');
export const Job = createModelBinding('Job');
export const JobAdvert = createModelBinding('JobAdvert');
export const JobAdvertHistory = createModelBinding('JobAdvertHistory');
export const JobApplication = createModelBinding('JobApplication');
export const JobApplicationDocument = createModelBinding('JobApplicationDocument');
export const JobApplicationFavourite = createModelBinding('JobApplicationFavourite');
export const JobApplicationInterview = createModelBinding('JobApplicationInterview');
export const JobApplicationNote = createModelBinding('JobApplicationNote');
export const JobApplicationResponse = createModelBinding('JobApplicationResponse');
export const JobApplicationStageHistory = createModelBinding('JobApplicationStageHistory');
export const JobApprovalWorkflow = createModelBinding('JobApprovalWorkflow');
export const JobCampaignPerformance = createModelBinding('JobCampaignPerformance');
export const JobCandidateNote = createModelBinding('JobCandidateNote');
export const JobCandidateResponse = createModelBinding('JobCandidateResponse');
export const JobFavorite = createModelBinding('JobFavorite');
export const JobKeyword = createModelBinding('JobKeyword');
export const JobPostAdminDetail = createModelBinding('JobPostAdminDetail');
export const JobStage = createModelBinding('JobStage');
export const LeadershipBriefingPack = createModelBinding('LeadershipBriefingPack');
export const LeadershipDecision = createModelBinding('LeadershipDecision');
export const LeadershipOkr = createModelBinding('LeadershipOkr');
export const LeadershipRitual = createModelBinding('LeadershipRitual');
export const LeadershipStrategicBet = createModelBinding('LeadershipStrategicBet');
export const LearningCourse = createModelBinding('LearningCourse');
export const LearningCourseEnrollment = createModelBinding('LearningCourseEnrollment');
export const LearningCourseModule = createModelBinding('LearningCourseModule');
export const LegalDocument = createModelBinding('LegalDocument');
export const LegalDocumentAuditEvent = createModelBinding('LegalDocumentAuditEvent');
export const LegalDocumentVersion = createModelBinding('LegalDocumentVersion');
export const MemberBrandingApproval = createModelBinding('MemberBrandingApproval');
export const MemberBrandingAsset = createModelBinding('MemberBrandingAsset');
export const MemberBrandingMetric = createModelBinding('MemberBrandingMetric');
export const MentorAdCampaign = createModelBinding('MentorAdCampaign');
export const MentorAvailabilitySlot = createModelBinding('MentorAvailabilitySlot');
export const MentorBooking = createModelBinding('MentorBooking');
export const MentorClient = createModelBinding('MentorClient');
export const MentorEvent = createModelBinding('MentorEvent');
export const MentorFavourite = createModelBinding('MentorFavourite');
export const MentorHubAction = createModelBinding('MentorHubAction');
export const MentorHubResource = createModelBinding('MentorHubResource');
export const MentorHubSpotlight = createModelBinding('MentorHubSpotlight');
export const MentorHubUpdate = createModelBinding('MentorHubUpdate');
export const MentoringSessionActionItem = createModelBinding('MentoringSessionActionItem');
export const MentoringSessionNote = createModelBinding('MentoringSessionNote');
export const MentorInvoice = createModelBinding('MentorInvoice');
export const MentorMessage = createModelBinding('MentorMessage');
export const MentorMetricReportingSetting = createModelBinding('MentorMetricReportingSetting');
export const MentorMetricWidget = createModelBinding('MentorMetricWidget');
export const MentorOrder = createModelBinding('MentorOrder');
export const MentorPackage = createModelBinding('MentorPackage');
export const MentorPayout = createModelBinding('MentorPayout');
export const MentorProfile = createModelBinding('MentorProfile');
export const MentorRecommendation = createModelBinding('MentorRecommendation');
export const MentorReview = createModelBinding('MentorReview');
export const MentorSettings = createModelBinding('MentorSettings');
export const MentorshipOrder = createModelBinding('MentorshipOrder');
export const MentorSupportTicket = createModelBinding('MentorSupportTicket');
export const MentorSystemPreference = createModelBinding('MentorSystemPreference');
export const MentorVerification = createModelBinding('MentorVerification');
export const MentorVerificationDocument = createModelBinding('MentorVerificationDocument');
export const MentorWalletTransaction = createModelBinding('MentorWalletTransaction');
export const Message = createModelBinding('Message');
export const MessageThread = createModelBinding('MessageThread');
export const NetworkingBusinessCard = createModelBinding('NetworkingBusinessCard');
export const NetworkingConnection = createModelBinding('NetworkingConnection');
export const NetworkingSession = createModelBinding('NetworkingSession');
export const NetworkingSessionOrder = createModelBinding('NetworkingSessionOrder');
export const NetworkingSessionRotation = createModelBinding('NetworkingSessionRotation');
export const NetworkingSessionSignup = createModelBinding('NetworkingSessionSignup');
export const Notification = createModelBinding('Notification');
export const NotificationPreference = createModelBinding('NotificationPreference');
export const OpportunityTaxonomy = createModelBinding('OpportunityTaxonomy');
export const OpportunityTaxonomyAssignment = createModelBinding('OpportunityTaxonomyAssignment');
export const Page = createModelBinding('Page');
export const PageInvite = createModelBinding('PageInvite');
export const PageMembership = createModelBinding('PageMembership');
export const PagePost = createModelBinding('PagePost');
export const PartnerEngagement = createModelBinding('PartnerEngagement');
export const PeerMentoringSession = createModelBinding('PeerMentoringSession');
export const PeopleOpsPerformanceReview = createModelBinding('PeopleOpsPerformanceReview');
export const PeopleOpsPolicy = createModelBinding('PeopleOpsPolicy');
export const PeopleOpsSkillMatrixEntry = createModelBinding('PeopleOpsSkillMatrixEntry');
export const PeopleOpsWellbeingSnapshot = createModelBinding('PeopleOpsWellbeingSnapshot');
export const PipelineBoard = createModelBinding('PipelineBoard');
export const PipelineCampaign = createModelBinding('PipelineCampaign');
export const PipelineDeal = createModelBinding('PipelineDeal');
export const PipelineFollowUp = createModelBinding('PipelineFollowUp');
export const PipelineProposal = createModelBinding('PipelineProposal');
export const PipelineProposalTemplate = createModelBinding('PipelineProposalTemplate');
export const PipelineStage = createModelBinding('PipelineStage');
export const Profile = createModelBinding('Profile');
export const ProfileAdminNote = createModelBinding('ProfileAdminNote');
export const ProfileAppreciation = createModelBinding('ProfileAppreciation');
export const ProfileEngagementJob = createModelBinding('ProfileEngagementJob');
export const ProfileFollower = createModelBinding('ProfileFollower');
export const ProfileReference = createModelBinding('ProfileReference');
export const Project = createModelBinding('Project');
export const ProjectAssignmentEvent = createModelBinding('ProjectAssignmentEvent');
export const ProjectBillingCheckpoint = createModelBinding('ProjectBillingCheckpoint');
export const ProjectBlueprint = createModelBinding('ProjectBlueprint');
export const ProjectBlueprintDependency = createModelBinding('ProjectBlueprintDependency');
export const ProjectBlueprintRisk = createModelBinding('ProjectBlueprintRisk');
export const ProjectBlueprintSprint = createModelBinding('ProjectBlueprintSprint');
export const ProjectCollaborator = createModelBinding('ProjectCollaborator');
export const ProjectDependencyLink = createModelBinding('ProjectDependencyLink');
export const ProjectIntegration = createModelBinding('ProjectIntegration');
export const ProjectMilestone = createModelBinding('ProjectMilestone');
export const ProjectOperationalSnapshot = createModelBinding('ProjectOperationalSnapshot');
export const ProjectRetrospective = createModelBinding('ProjectRetrospective');
export const ProjectTemplate = createModelBinding('ProjectTemplate');
export const ProjectWorkspace = createModelBinding('ProjectWorkspace');
export const ProjectWorkspaceApproval = createModelBinding('ProjectWorkspaceApproval');
export const ProjectWorkspaceBrief = createModelBinding('ProjectWorkspaceBrief');
export const ProjectWorkspaceBudget = createModelBinding('ProjectWorkspaceBudget');
export const ProjectWorkspaceBudgetLine = createModelBinding('ProjectWorkspaceBudgetLine');
export const ProjectWorkspaceCalendarEntry = createModelBinding('ProjectWorkspaceCalendarEntry');
export const ProjectWorkspaceConversation = createModelBinding('ProjectWorkspaceConversation');
export const ProjectWorkspaceFile = createModelBinding('ProjectWorkspaceFile');
export const ProjectWorkspaceHrRecord = createModelBinding('ProjectWorkspaceHrRecord');
export const ProjectWorkspaceInvite = createModelBinding('ProjectWorkspaceInvite');
export const ProjectWorkspaceMeeting = createModelBinding('ProjectWorkspaceMeeting');
export const ProjectWorkspaceMessage = createModelBinding('ProjectWorkspaceMessage');
export const ProjectWorkspaceObject = createModelBinding('ProjectWorkspaceObject');
export const ProjectWorkspaceObjective = createModelBinding('ProjectWorkspaceObjective');
export const ProjectWorkspaceRole = createModelBinding('ProjectWorkspaceRole');
export const ProjectWorkspaceSubmission = createModelBinding('ProjectWorkspaceSubmission');
export const ProjectWorkspaceTarget = createModelBinding('ProjectWorkspaceTarget');
export const ProjectWorkspaceTask = createModelBinding('ProjectWorkspaceTask');
export const ProjectWorkspaceTaskAssignment = createModelBinding('ProjectWorkspaceTaskAssignment');
export const ProjectWorkspaceTimeline = createModelBinding('ProjectWorkspaceTimeline');
export const ProjectWorkspaceTimelineEntry = createModelBinding('ProjectWorkspaceTimelineEntry');
export const ProjectWorkspaceTimelineEvent = createModelBinding('ProjectWorkspaceTimelineEvent');
export const ProjectWorkspaceTimeLog = createModelBinding('ProjectWorkspaceTimeLog');
export const ProjectWorkspaceWhiteboard = createModelBinding('ProjectWorkspaceWhiteboard');
export const ProviderContactNote = createModelBinding('ProviderContactNote');
export const ProviderWorkspace = createModelBinding('ProviderWorkspace');
export const ProviderWorkspaceInvite = createModelBinding('ProviderWorkspaceInvite');
export const ProviderWorkspaceMember = createModelBinding('ProviderWorkspaceMember');
export const QualificationCredential = createModelBinding('QualificationCredential');
export const QualityReviewRun = createModelBinding('QualityReviewRun');
export const RecruitingCalendarEvent = createModelBinding('RecruitingCalendarEvent');
export const ReputationBadge = createModelBinding('ReputationBadge');
export const ReputationMetric = createModelBinding('ReputationMetric');
export const ReputationReviewWidget = createModelBinding('ReputationReviewWidget');
export const ReputationSuccessStory = createModelBinding('ReputationSuccessStory');
export const ReputationTestimonial = createModelBinding('ReputationTestimonial');
export const ResourceCapacitySnapshot = createModelBinding('ResourceCapacitySnapshot');
export const ResourceScenarioPlan = createModelBinding('ResourceScenarioPlan');
export const RuntimeSecurityAuditEvent = createModelBinding('RuntimeSecurityAuditEvent');
export const SearchSubscription = createModelBinding('SearchSubscription');
export const ServiceLine = createModelBinding('ServiceLine');
export const SiteNavigationLink = createModelBinding('SiteNavigationLink');
export const SitePage = createModelBinding('SitePage');
export const SiteSetting = createModelBinding('SiteSetting');
export const SkillGapDiagnostic = createModelBinding('SkillGapDiagnostic');
export const SpeedNetworkingParticipant = createModelBinding('SpeedNetworkingParticipant');
export const SpeedNetworkingRoom = createModelBinding('SpeedNetworkingRoom');
export const SpeedNetworkingSession = createModelBinding('SpeedNetworkingSession');
export const SprintCycle = createModelBinding('SprintCycle');
export const SprintRisk = createModelBinding('SprintRisk');
export const SprintTask = createModelBinding('SprintTask');
export const SprintTaskDependency = createModelBinding('SprintTaskDependency');
export const SprintTaskTimeEntry = createModelBinding('SprintTaskTimeEntry');
export const SupportAutomationLog = createModelBinding('SupportAutomationLog');
export const SupportCase = createModelBinding('SupportCase');
export const SupportCaseLink = createModelBinding('SupportCaseLink');
export const SupportCasePlaybook = createModelBinding('SupportCasePlaybook');
export const SupportCaseSatisfaction = createModelBinding('SupportCaseSatisfaction');
export const SupportKnowledgeArticle = createModelBinding('SupportKnowledgeArticle');
export const SupportPlaybook = createModelBinding('SupportPlaybook');
export const SupportPlaybookStep = createModelBinding('SupportPlaybookStep');
export const TalentCandidate = createModelBinding('TalentCandidate');
export const TalentInterview = createModelBinding('TalentInterview');
export const TalentOffer = createModelBinding('TalentOffer');
export const TalentPipelineMetric = createModelBinding('TalentPipelineMetric');
export const TwoFactorAuditLog = createModelBinding('TwoFactorAuditLog');
export const TwoFactorBypass = createModelBinding('TwoFactorBypass');
export const TwoFactorEnrollment = createModelBinding('TwoFactorEnrollment');
export const TwoFactorPolicy = createModelBinding('TwoFactorPolicy');
export const TwoFactorToken = createModelBinding('TwoFactorToken');
export const User = createModelBinding('User');
export const UserCalendarSetting = createModelBinding('UserCalendarSetting');
export const UserDashboardOverview = createModelBinding('UserDashboardOverview');
export const UserEvent = createModelBinding('UserEvent');
export const UserEventAgendaItem = createModelBinding('UserEventAgendaItem');
export const UserEventAsset = createModelBinding('UserEventAsset');
export const UserEventBudgetItem = createModelBinding('UserEventBudgetItem');
export const UserEventChecklistItem = createModelBinding('UserEventChecklistItem');
export const UserEventGuest = createModelBinding('UserEventGuest');
export const UserEventTask = createModelBinding('UserEventTask');
export const UserLoginAudit = createModelBinding('UserLoginAudit');
export const UserNote = createModelBinding('UserNote');
export const UserRole = createModelBinding('UserRole');
export const UserSecurityPreference = createModelBinding('UserSecurityPreference');
export const UserWebsitePreference = createModelBinding('UserWebsitePreference');
export const UserPresenceStatus = createModelBinding('UserPresenceStatus');
export const UserPresenceEvent = createModelBinding('UserPresenceEvent');
export const UserPresenceWindow = createModelBinding('UserPresenceWindow');
export const VolunteerApplication = createModelBinding('VolunteerApplication');
export const VolunteerAssignment = createModelBinding('VolunteerAssignment');
export const VolunteerContract = createModelBinding('VolunteerContract');
export const VolunteerContractReview = createModelBinding('VolunteerContractReview');
export const VolunteerContractSpend = createModelBinding('VolunteerContractSpend');
export const Volunteering = createModelBinding('Volunteering');
export const VolunteerProgram = createModelBinding('VolunteerProgram');
export const VolunteerResponse = createModelBinding('VolunteerResponse');
export const VolunteerShift = createModelBinding('VolunteerShift');
export const WalletAccount = createModelBinding('WalletAccount');
export const WalletFundingSource = createModelBinding('WalletFundingSource');
export const WalletLedgerEntry = createModelBinding('WalletLedgerEntry');
export const WalletOperationalSetting = createModelBinding('WalletOperationalSetting');
export const WalletPayoutRequest = createModelBinding('WalletPayoutRequest');
export const WalletTransferRequest = createModelBinding('WalletTransferRequest');
export const WalletTransferRule = createModelBinding('WalletTransferRule');
export const WeeklyDigestSubscription = createModelBinding('WeeklyDigestSubscription');
export const WorkspaceIntegration = createModelBinding('WorkspaceIntegration');
export const WorkspaceIntegrationAuditEvent = createModelBinding('WorkspaceIntegrationAuditEvent');
export const WorkspaceIntegrationAuditLog = createModelBinding('WorkspaceIntegrationAuditLog');
export const WorkspaceIntegrationCredential = createModelBinding('WorkspaceIntegrationCredential');
export const WorkspaceIntegrationFieldMapping = createModelBinding('WorkspaceIntegrationFieldMapping');
export const WorkspaceIntegrationIncident = createModelBinding('WorkspaceIntegrationIncident');
export const WorkspaceIntegrationRoleAssignment = createModelBinding('WorkspaceIntegrationRoleAssignment');
export const WorkspaceIntegrationSecret = createModelBinding('WorkspaceIntegrationSecret');
export const WorkspaceIntegrationSyncRun = createModelBinding('WorkspaceIntegrationSyncRun');
export const WorkspaceIntegrationWebhook = createModelBinding('WorkspaceIntegrationWebhook');
export const WorkspaceOperatingBlueprint = createModelBinding('WorkspaceOperatingBlueprint');
export const WorkspaceTemplate = createModelBinding('WorkspaceTemplate');
export const WorkspaceTemplateCategory = createModelBinding('WorkspaceTemplateCategory');
export const WorkspaceTemplateResource = createModelBinding('WorkspaceTemplateResource');
export const WorkspaceTemplateStage = createModelBinding('WorkspaceTemplateStage');

export const PRESENCE_AVAILABILITY_STATES = Object.freeze([
  'available',
  'away',
  'focus',
  'in_meeting',
  'do_not_disturb',
  'offline',
]);
export const PRESENCE_EVENT_TYPES = Object.freeze([
  'status_change',
  'focus_session',
  'calendar_sync',
  'availability_window',
  'huddle',
]);

export const AD_STATUSES = createEnumBinding('AD_STATUSES');
export const ADMIN_TIMELINE_EVENT_STATUSES = createEnumBinding('ADMIN_TIMELINE_EVENT_STATUSES');
export const ADMIN_TIMELINE_EVENT_TYPES = createEnumBinding('ADMIN_TIMELINE_EVENT_TYPES');
export const ADMIN_TIMELINE_STATUSES = createEnumBinding('ADMIN_TIMELINE_STATUSES');
export const ADMIN_TIMELINE_VISIBILITIES = createEnumBinding('ADMIN_TIMELINE_VISIBILITIES');
export const AGENCY_CREATION_ASSET_TYPES = createEnumBinding('AGENCY_CREATION_ASSET_TYPES');
export const AGENCY_CREATION_COLLABORATOR_STATUSES = createEnumBinding('AGENCY_CREATION_COLLABORATOR_STATUSES');
export const AGENCY_CREATION_PRIORITIES = createEnumBinding('AGENCY_CREATION_PRIORITIES');
export const AGENCY_CREATION_STATUSES = createEnumBinding('AGENCY_CREATION_STATUSES');
export const AGENCY_CREATION_TARGET_TYPES = createEnumBinding('AGENCY_CREATION_TARGET_TYPES');
export const AGENCY_CREATION_VISIBILITIES = createEnumBinding('AGENCY_CREATION_VISIBILITIES');
export const AGENCY_PROFILE_CREDENTIAL_TYPES = createEnumBinding('AGENCY_PROFILE_CREDENTIAL_TYPES');
export const AGENCY_PROFILE_MEDIA_ALLOWED_TYPES = createEnumBinding('AGENCY_PROFILE_MEDIA_ALLOWED_TYPES');
export const AGENCY_TIMELINE_DISTRIBUTION_CHANNELS = createEnumBinding('AGENCY_TIMELINE_DISTRIBUTION_CHANNELS');
export const AGENCY_TIMELINE_POST_STATUSES = createEnumBinding('AGENCY_TIMELINE_POST_STATUSES');
export const AGENCY_TIMELINE_VISIBILITIES = createEnumBinding('AGENCY_TIMELINE_VISIBILITIES');
export const ANALYTICS_ACTOR_TYPES = createEnumBinding('ANALYTICS_ACTOR_TYPES');
export const APPLICATION_REVIEW_DECISIONS = createEnumBinding('APPLICATION_REVIEW_DECISIONS');
export const APPLICATION_REVIEW_STAGES = createEnumBinding('APPLICATION_REVIEW_STAGES');
export const APPLICATION_STATUSES = createEnumBinding('APPLICATION_STATUSES');
export const APPLICATION_TARGET_TYPES = createEnumBinding('APPLICATION_TARGET_TYPES');
export const AUTO_ASSIGN_STATUSES = createEnumBinding('AUTO_ASSIGN_STATUSES');
export const BLOG_COMMENT_STATUSES = createEnumBinding('BLOG_COMMENT_STATUSES');
export const CHANGE_REQUEST_STATUSES = createEnumBinding('CHANGE_REQUEST_STATUSES');
export const CLIENT_PORTAL_DECISION_VISIBILITIES = createEnumBinding('CLIENT_PORTAL_DECISION_VISIBILITIES');
export const CLIENT_PORTAL_INSIGHT_TYPES = createEnumBinding('CLIENT_PORTAL_INSIGHT_TYPES');
export const CLIENT_PORTAL_INSIGHT_VISIBILITIES = createEnumBinding('CLIENT_PORTAL_INSIGHT_VISIBILITIES');
export const CLIENT_PORTAL_SCOPE_STATUSES = createEnumBinding('CLIENT_PORTAL_SCOPE_STATUSES');
export const CLIENT_PORTAL_STATUSES = createEnumBinding('CLIENT_PORTAL_STATUSES');
export const CLIENT_PORTAL_TIMELINE_STATUSES = createEnumBinding('CLIENT_PORTAL_TIMELINE_STATUSES');
export const CLIENT_SUCCESS_AFFILIATE_STATUSES = createEnumBinding('CLIENT_SUCCESS_AFFILIATE_STATUSES');
export const CLIENT_SUCCESS_PLAYBOOK_TRIGGERS = createEnumBinding('CLIENT_SUCCESS_PLAYBOOK_TRIGGERS');
export const CLIENT_SUCCESS_REFERRAL_STATUSES = createEnumBinding('CLIENT_SUCCESS_REFERRAL_STATUSES');
export const CLIENT_SUCCESS_STEP_CHANNELS = createEnumBinding('CLIENT_SUCCESS_STEP_CHANNELS');
export const CLIENT_SUCCESS_STEP_TYPES = createEnumBinding('CLIENT_SUCCESS_STEP_TYPES');
export const COLLABORATION_AI_SESSION_TYPES = createEnumBinding('COLLABORATION_AI_SESSION_TYPES');
export const COLLABORATION_ANNOTATION_STATUSES = createEnumBinding('COLLABORATION_ANNOTATION_STATUSES');
export const COLLABORATION_ANNOTATION_TYPES = createEnumBinding('COLLABORATION_ANNOTATION_TYPES');
export const COLLABORATION_ASSET_STATUSES = createEnumBinding('COLLABORATION_ASSET_STATUSES');
export const COLLABORATION_ASSET_TYPES = createEnumBinding('COLLABORATION_ASSET_TYPES');
export const COLLABORATION_PERMISSION_LEVELS = createEnumBinding('COLLABORATION_PERMISSION_LEVELS');
export const COLLABORATION_REPOSITORY_STATUSES = createEnumBinding('COLLABORATION_REPOSITORY_STATUSES');
export const COLLABORATION_ROOM_TYPES = createEnumBinding('COLLABORATION_ROOM_TYPES');
export const COLLABORATION_SPACE_STATUSES = createEnumBinding('COLLABORATION_SPACE_STATUSES');
export const COMMUNITY_INVITE_STATUSES = createEnumBinding('COMMUNITY_INVITE_STATUSES');
export const COMPANY_TIMELINE_EVENT_STATUSES = createEnumBinding('COMPANY_TIMELINE_EVENT_STATUSES');
export const COMPANY_TIMELINE_POST_STATUSES = createEnumBinding('COMPANY_TIMELINE_POST_STATUSES');
export const COMPANY_TIMELINE_POST_VISIBILITIES = createEnumBinding('COMPANY_TIMELINE_POST_VISIBILITIES');
export const CORPORATE_VERIFICATION_STATUSES = createEnumBinding('CORPORATE_VERIFICATION_STATUSES');
export const DELIVERABLE_ITEM_NDA_STATUSES = createEnumBinding('DELIVERABLE_ITEM_NDA_STATUSES');
export const DELIVERABLE_ITEM_STATUSES = createEnumBinding('DELIVERABLE_ITEM_STATUSES');
export const DELIVERABLE_ITEM_WATERMARK_MODES = createEnumBinding('DELIVERABLE_ITEM_WATERMARK_MODES');
export const DELIVERABLE_RETENTION_POLICIES = createEnumBinding('DELIVERABLE_RETENTION_POLICIES');
export const DELIVERABLE_VAULT_WATERMARK_MODES = createEnumBinding('DELIVERABLE_VAULT_WATERMARK_MODES');
export const DIGEST_FREQUENCIES = createEnumBinding('DIGEST_FREQUENCIES');
export const DISPUTE_PRIORITIES = createEnumBinding('DISPUTE_PRIORITIES');
export const DISPUTE_REASON_CODES = createEnumBinding('DISPUTE_REASON_CODES');
export const DISPUTE_STAGES = createEnumBinding('DISPUTE_STAGES');
export const DISPUTE_STATUSES = createEnumBinding('DISPUTE_STATUSES');
export const ESCROW_ACCOUNT_STATUSES = createEnumBinding('ESCROW_ACCOUNT_STATUSES');
export const ESCROW_FEE_TIER_STATUSES = createEnumBinding('ESCROW_FEE_TIER_STATUSES');
export const ESCROW_INTEGRATION_PROVIDERS = createEnumBinding('ESCROW_INTEGRATION_PROVIDERS');
export const ESCROW_RELEASE_POLICY_STATUSES = createEnumBinding('ESCROW_RELEASE_POLICY_STATUSES');
export const ESCROW_RELEASE_POLICY_TYPES = createEnumBinding('ESCROW_RELEASE_POLICY_TYPES');
export const ESCROW_TRANSACTION_STATUSES = createEnumBinding('ESCROW_TRANSACTION_STATUSES');
export const ESCROW_TRANSACTION_TYPES = createEnumBinding('ESCROW_TRANSACTION_TYPES');
export const FINANCE_REVENUE_TYPES = createEnumBinding('FINANCE_REVENUE_TYPES');
export const FREELANCER_CALENDAR_EVENT_STATUSES = createEnumBinding('FREELANCER_CALENDAR_EVENT_STATUSES');
export const FREELANCER_CALENDAR_EVENT_TYPES = createEnumBinding('FREELANCER_CALENDAR_EVENT_TYPES');
export const FREELANCER_CALENDAR_RELATED_TYPES = createEnumBinding('FREELANCER_CALENDAR_RELATED_TYPES');
export const FREELANCER_EXPERTISE_STATUSES = createEnumBinding('FREELANCER_EXPERTISE_STATUSES');
export const FREELANCER_HERO_BANNER_STATUSES = createEnumBinding('FREELANCER_HERO_BANNER_STATUSES');
export const FREELANCER_SUCCESS_TRENDS = createEnumBinding('FREELANCER_SUCCESS_TRENDS');
export const FREELANCER_TESTIMONIAL_STATUSES = createEnumBinding('FREELANCER_TESTIMONIAL_STATUSES');
export const GIG_ORDER_PAYOUT_STATUSES = createEnumBinding('GIG_ORDER_PAYOUT_STATUSES');
export const GIG_ORDER_PIPELINE_STATUSES = createEnumBinding('GIG_ORDER_PIPELINE_STATUSES');
export const GIG_ORDER_REQUIREMENT_PRIORITIES = createEnumBinding('GIG_ORDER_REQUIREMENT_PRIORITIES');
export const GIG_ORDER_REQUIREMENT_STATUSES = createEnumBinding('GIG_ORDER_REQUIREMENT_STATUSES');
export const GIG_ORDER_REVISION_WORKFLOW_STATUSES = createEnumBinding('GIG_ORDER_REVISION_WORKFLOW_STATUSES');
export const GIG_ORDER_STATUSES = createEnumBinding('GIG_ORDER_STATUSES');
export const GIG_STATUSES = createEnumBinding('GIG_STATUSES');
export const GIG_VISIBILITY_OPTIONS = createEnumBinding('GIG_VISIBILITY_OPTIONS');
export const GROUP_MEMBER_POLICIES = createEnumBinding('GROUP_MEMBER_POLICIES');
export const GROUP_MEMBERSHIP_ROLES = createEnumBinding('GROUP_MEMBERSHIP_ROLES');
export const GROUP_MEMBERSHIP_STATUSES = createEnumBinding('GROUP_MEMBERSHIP_STATUSES');
export const GROUP_POST_STATUSES = createEnumBinding('GROUP_POST_STATUSES');
export const GROUP_POST_VISIBILITIES = createEnumBinding('GROUP_POST_VISIBILITIES');
export const GROUP_VISIBILITIES = createEnumBinding('GROUP_VISIBILITIES');
export const ID_VERIFICATION_EVENT_TYPES = createEnumBinding('ID_VERIFICATION_EVENT_TYPES');
export const ID_VERIFICATION_STATUSES = createEnumBinding('ID_VERIFICATION_STATUSES');
export const JOB_APPLICATION_FAVOURITE_PRIORITIES = createEnumBinding('JOB_APPLICATION_FAVOURITE_PRIORITIES');
export const JOB_APPLICATION_INTERVIEW_STATUSES = createEnumBinding('JOB_APPLICATION_INTERVIEW_STATUSES');
export const JOB_APPLICATION_INTERVIEW_TYPES = createEnumBinding('JOB_APPLICATION_INTERVIEW_TYPES');
export const JOB_APPLICATION_PRIORITIES = createEnumBinding('JOB_APPLICATION_PRIORITIES');
export const JOB_APPLICATION_RESPONSE_CHANNELS = createEnumBinding('JOB_APPLICATION_RESPONSE_CHANNELS');
export const JOB_APPLICATION_RESPONSE_DIRECTIONS = createEnumBinding('JOB_APPLICATION_RESPONSE_DIRECTIONS');
export const JOB_APPLICATION_RESPONSE_STATUSES = createEnumBinding('JOB_APPLICATION_RESPONSE_STATUSES');
export const JOB_APPLICATION_SOURCES = createEnumBinding('JOB_APPLICATION_SOURCES');
export const JOB_APPLICATION_STAGES = createEnumBinding('JOB_APPLICATION_STAGES');
export const JOB_APPLICATION_STATUSES = createEnumBinding('JOB_APPLICATION_STATUSES');
export const JOB_APPLICATION_VISIBILITIES = createEnumBinding('JOB_APPLICATION_VISIBILITIES');
export const JOB_INTERVIEW_STATUSES = createEnumBinding('JOB_INTERVIEW_STATUSES');
export const JOB_INTERVIEW_TYPES = createEnumBinding('JOB_INTERVIEW_TYPES');
export const LAUNCHPAD_APPLICATION_STATUSES = createEnumBinding('LAUNCHPAD_APPLICATION_STATUSES');
export const LAUNCHPAD_OPPORTUNITY_SOURCES = createEnumBinding('LAUNCHPAD_OPPORTUNITY_SOURCES');
export const LAUNCHPAD_PLACEMENT_STATUSES = createEnumBinding('LAUNCHPAD_PLACEMENT_STATUSES');
export const LAUNCHPAD_TARGET_TYPES = createEnumBinding('LAUNCHPAD_TARGET_TYPES');
export const LEARNING_ENROLLMENT_STATUSES = createEnumBinding('LEARNING_ENROLLMENT_STATUSES');
export const MENTOR_AVAILABILITY_DAYS = createEnumBinding('MENTOR_AVAILABILITY_DAYS');
export const MENTOR_AVAILABILITY_STATUSES = createEnumBinding('MENTOR_AVAILABILITY_STATUSES');
export const MENTOR_BOOKING_STATUSES = createEnumBinding('MENTOR_BOOKING_STATUSES');
export const MENTOR_CLIENT_STATUSES = createEnumBinding('MENTOR_CLIENT_STATUSES');
export const MENTOR_DOCUMENT_TYPES = createEnumBinding('MENTOR_DOCUMENT_TYPES');
export const MENTOR_EVENT_STATUSES = createEnumBinding('MENTOR_EVENT_STATUSES');
export const MENTOR_EVENT_TYPES = createEnumBinding('MENTOR_EVENT_TYPES');
export const MENTOR_INVOICE_STATUSES = createEnumBinding('MENTOR_INVOICE_STATUSES');
export const MENTOR_MESSAGE_CHANNELS = createEnumBinding('MENTOR_MESSAGE_CHANNELS');
export const MENTOR_MESSAGE_STATUSES = createEnumBinding('MENTOR_MESSAGE_STATUSES');
export const MENTOR_PAYMENT_STATUSES = createEnumBinding('MENTOR_PAYMENT_STATUSES');
export const MENTOR_PAYOUT_STATUSES = createEnumBinding('MENTOR_PAYOUT_STATUSES');
export const MENTOR_PRICE_TIERS = createEnumBinding('MENTOR_PRICE_TIERS');
export const MENTOR_RELATIONSHIP_TIERS = createEnumBinding('MENTOR_RELATIONSHIP_TIERS');
export const MENTOR_SUPPORT_PRIORITIES = createEnumBinding('MENTOR_SUPPORT_PRIORITIES');
export const MENTOR_SUPPORT_STATUSES = createEnumBinding('MENTOR_SUPPORT_STATUSES');
export const MENTOR_VERIFICATION_STATUSES = createEnumBinding('MENTOR_VERIFICATION_STATUSES');
export const MENTOR_WALLET_TRANSACTION_STATUSES = createEnumBinding('MENTOR_WALLET_TRANSACTION_STATUSES');
export const MENTOR_WALLET_TRANSACTION_TYPES = createEnumBinding('MENTOR_WALLET_TRANSACTION_TYPES');
export const MENTORING_SESSION_ACTION_PRIORITIES = createEnumBinding('MENTORING_SESSION_ACTION_PRIORITIES');
export const MENTORING_SESSION_ACTION_STATUSES = createEnumBinding('MENTORING_SESSION_ACTION_STATUSES');
export const MENTORING_SESSION_NOTE_VISIBILITIES = createEnumBinding('MENTORING_SESSION_NOTE_VISIBILITIES');
export const NETWORKING_BUSINESS_CARD_STATUSES = createEnumBinding('NETWORKING_BUSINESS_CARD_STATUSES');
export const NETWORKING_CONNECTION_STATUSES = createEnumBinding('NETWORKING_CONNECTION_STATUSES');
export const NETWORKING_CONNECTION_TYPES = createEnumBinding('NETWORKING_CONNECTION_TYPES');
export const NETWORKING_ROTATION_STATUSES = createEnumBinding('NETWORKING_ROTATION_STATUSES');
export const NETWORKING_SESSION_ACCESS_TYPES = createEnumBinding('NETWORKING_SESSION_ACCESS_TYPES');
export const NETWORKING_SESSION_ORDER_STATUSES = createEnumBinding('NETWORKING_SESSION_ORDER_STATUSES');
export const NETWORKING_SESSION_SIGNUP_SOURCES = createEnumBinding('NETWORKING_SESSION_SIGNUP_SOURCES');
export const NETWORKING_SESSION_SIGNUP_STATUSES = createEnumBinding('NETWORKING_SESSION_SIGNUP_STATUSES');
export const NETWORKING_SESSION_STATUSES = createEnumBinding('NETWORKING_SESSION_STATUSES');
export const NETWORKING_SESSION_VISIBILITIES = createEnumBinding('NETWORKING_SESSION_VISIBILITIES');
export const NETWORKING_SIGNUP_PAYMENT_STATUSES = createEnumBinding('NETWORKING_SIGNUP_PAYMENT_STATUSES');
export const NOTIFICATION_CATEGORIES = createEnumBinding('NOTIFICATION_CATEGORIES');
export const NOTIFICATION_PRIORITIES = createEnumBinding('NOTIFICATION_PRIORITIES');
export const NOTIFICATION_STATUSES = createEnumBinding('NOTIFICATION_STATUSES');
export const PAGE_MEMBER_ROLES = createEnumBinding('PAGE_MEMBER_ROLES');
export const PAGE_MEMBER_STATUSES = createEnumBinding('PAGE_MEMBER_STATUSES');
export const PAGE_POST_STATUSES = createEnumBinding('PAGE_POST_STATUSES');
export const PAGE_POST_VISIBILITIES = createEnumBinding('PAGE_POST_VISIBILITIES');
export const PAGE_VISIBILITIES = createEnumBinding('PAGE_VISIBILITIES');
export const PEER_MENTORING_STATUSES = createEnumBinding('PEER_MENTORING_STATUSES');
export const PROFILE_APPRECIATION_TYPES = createEnumBinding('PROFILE_APPRECIATION_TYPES');
export const PROFILE_AVAILABILITY_STATUSES = createEnumBinding('PROFILE_AVAILABILITY_STATUSES');
export const PROFILE_FOLLOWER_STATUSES = createEnumBinding('PROFILE_FOLLOWER_STATUSES');
export const PROFILE_FOLLOWERS_VISIBILITY_OPTIONS = createEnumBinding('PROFILE_FOLLOWERS_VISIBILITY_OPTIONS');
export const PROFILE_NETWORK_VISIBILITY_OPTIONS = createEnumBinding('PROFILE_NETWORK_VISIBILITY_OPTIONS');
export const PROFILE_VISIBILITY_OPTIONS = createEnumBinding('PROFILE_VISIBILITY_OPTIONS');
export const PROJECT_BILLING_STATUSES = createEnumBinding('PROJECT_BILLING_STATUSES');
export const PROJECT_BILLING_TYPES = createEnumBinding('PROJECT_BILLING_TYPES');
export const PROJECT_BLUEPRINT_HEALTH_STATUSES = createEnumBinding('PROJECT_BLUEPRINT_HEALTH_STATUSES');
export const PROJECT_DEPENDENCY_RISK_LEVELS = createEnumBinding('PROJECT_DEPENDENCY_RISK_LEVELS');
export const PROJECT_DEPENDENCY_STATUSES = createEnumBinding('PROJECT_DEPENDENCY_STATUSES');
export const PROJECT_DEPENDENCY_TYPES = createEnumBinding('PROJECT_DEPENDENCY_TYPES');
export const PROJECT_MILESTONE_STATUSES = createEnumBinding('PROJECT_MILESTONE_STATUSES');
export const PROJECT_RISK_STATUSES = createEnumBinding('PROJECT_RISK_STATUSES');
export const PROJECT_SPRINT_STATUSES = createEnumBinding('PROJECT_SPRINT_STATUSES');
export const PROVIDER_CONTACT_NOTE_VISIBILITIES = createEnumBinding('PROVIDER_CONTACT_NOTE_VISIBILITIES');
export const PROVIDER_WORKSPACE_INVITE_STATUSES = createEnumBinding('PROVIDER_WORKSPACE_INVITE_STATUSES');
export const PROVIDER_WORKSPACE_MEMBER_ROLES = createEnumBinding('PROVIDER_WORKSPACE_MEMBER_ROLES');
export const PROVIDER_WORKSPACE_MEMBER_STATUSES = createEnumBinding('PROVIDER_WORKSPACE_MEMBER_STATUSES');
export const PROVIDER_WORKSPACE_TYPES = createEnumBinding('PROVIDER_WORKSPACE_TYPES');
export const QUALIFICATION_CREDENTIAL_STATUSES = createEnumBinding('QUALIFICATION_CREDENTIAL_STATUSES');
export const REPUTATION_METRIC_TREND_DIRECTIONS = createEnumBinding('REPUTATION_METRIC_TREND_DIRECTIONS');
export const REPUTATION_REVIEW_WIDGET_STATUSES = createEnumBinding('REPUTATION_REVIEW_WIDGET_STATUSES');
export const REPUTATION_SUCCESS_STORY_STATUSES = createEnumBinding('REPUTATION_SUCCESS_STORY_STATUSES');
export const REPUTATION_TESTIMONIAL_SOURCES = createEnumBinding('REPUTATION_TESTIMONIAL_SOURCES');
export const REPUTATION_TESTIMONIAL_STATUSES = createEnumBinding('REPUTATION_TESTIMONIAL_STATUSES');
export const SITE_PAGE_STATUSES = createEnumBinding('SITE_PAGE_STATUSES');
export const SPRINT_RISK_IMPACTS = createEnumBinding('SPRINT_RISK_IMPACTS');
export const SPRINT_RISK_STATUSES = createEnumBinding('SPRINT_RISK_STATUSES');
export const SPRINT_STATUSES = createEnumBinding('SPRINT_STATUSES');
export const SPRINT_TASK_PRIORITIES = createEnumBinding('SPRINT_TASK_PRIORITIES');
export const SPRINT_TASK_STATUSES = createEnumBinding('SPRINT_TASK_STATUSES');
export const SUPPORT_CASE_PRIORITIES = createEnumBinding('SUPPORT_CASE_PRIORITIES');
export const SUPPORT_CASE_STATUSES = createEnumBinding('SUPPORT_CASE_STATUSES');
export const USER_EVENT_ASSET_TYPES = createEnumBinding('USER_EVENT_ASSET_TYPES');
export const USER_EVENT_ASSET_VISIBILITIES = createEnumBinding('USER_EVENT_ASSET_VISIBILITIES');
export const USER_EVENT_BUDGET_STATUSES = createEnumBinding('USER_EVENT_BUDGET_STATUSES');
export const USER_EVENT_FORMATS = createEnumBinding('USER_EVENT_FORMATS');
export const USER_EVENT_GUEST_STATUSES = createEnumBinding('USER_EVENT_GUEST_STATUSES');
export const USER_EVENT_STATUSES = createEnumBinding('USER_EVENT_STATUSES');
export const USER_EVENT_TASK_PRIORITIES = createEnumBinding('USER_EVENT_TASK_PRIORITIES');
export const USER_EVENT_TASK_STATUSES = createEnumBinding('USER_EVENT_TASK_STATUSES');
export const USER_EVENT_VISIBILITIES = createEnumBinding('USER_EVENT_VISIBILITIES');
export const USER_STATUSES = createEnumBinding('USER_STATUSES');
export const VOLUNTEER_ASSIGNMENT_STATUSES = createEnumBinding('VOLUNTEER_ASSIGNMENT_STATUSES');
export const VOLUNTEER_PROGRAM_STATUSES = createEnumBinding('VOLUNTEER_PROGRAM_STATUSES');
export const VOLUNTEER_ROLE_STATUSES = createEnumBinding('VOLUNTEER_ROLE_STATUSES');
export const VOLUNTEER_SHIFT_STATUSES = createEnumBinding('VOLUNTEER_SHIFT_STATUSES');
export const WALLET_ACCOUNT_STATUSES = createEnumBinding('WALLET_ACCOUNT_STATUSES');
export const WALLET_ACCOUNT_TYPES = createEnumBinding('WALLET_ACCOUNT_TYPES');
export const WALLET_LEDGER_ENTRY_TYPES = createEnumBinding('WALLET_LEDGER_ENTRY_TYPES');
export const WORKSPACE_APPROVAL_STATUSES = createEnumBinding('WORKSPACE_APPROVAL_STATUSES');
export const WORKSPACE_BUDGET_STATUSES = createEnumBinding('WORKSPACE_BUDGET_STATUSES');
export const WORKSPACE_CONVERSATION_PRIORITIES = createEnumBinding('WORKSPACE_CONVERSATION_PRIORITIES');
export const WORKSPACE_HR_STATUSES = createEnumBinding('WORKSPACE_HR_STATUSES');
export const WORKSPACE_INTEGRATION_AUTH_TYPES = createEnumBinding('WORKSPACE_INTEGRATION_AUTH_TYPES');
export const WORKSPACE_INTEGRATION_CREDENTIAL_TYPES = createEnumBinding('WORKSPACE_INTEGRATION_CREDENTIAL_TYPES');
export const WORKSPACE_INTEGRATION_ENVIRONMENTS = createEnumBinding('WORKSPACE_INTEGRATION_ENVIRONMENTS');
export const WORKSPACE_INTEGRATION_INCIDENT_SEVERITIES = createEnumBinding('WORKSPACE_INTEGRATION_INCIDENT_SEVERITIES');
export const WORKSPACE_INTEGRATION_INCIDENT_STATUSES = createEnumBinding('WORKSPACE_INTEGRATION_INCIDENT_STATUSES');
export const WORKSPACE_INTEGRATION_STATUSES = createEnumBinding('WORKSPACE_INTEGRATION_STATUSES');
export const WORKSPACE_INTEGRATION_SYNC_FREQUENCIES = createEnumBinding('WORKSPACE_INTEGRATION_SYNC_FREQUENCIES');
export const WORKSPACE_INTEGRATION_SYNC_RUN_STATUSES = createEnumBinding('WORKSPACE_INTEGRATION_SYNC_RUN_STATUSES');
export const WORKSPACE_INVITE_STATUSES = createEnumBinding('WORKSPACE_INVITE_STATUSES');
export const WORKSPACE_MEETING_STATUSES = createEnumBinding('WORKSPACE_MEETING_STATUSES');
export const WORKSPACE_OBJECT_STATUSES = createEnumBinding('WORKSPACE_OBJECT_STATUSES');
export const WORKSPACE_OBJECT_TYPES = createEnumBinding('WORKSPACE_OBJECT_TYPES');
export const WORKSPACE_ROLE_STATUSES = createEnumBinding('WORKSPACE_ROLE_STATUSES');
export const WORKSPACE_SUBMISSION_STATUSES = createEnumBinding('WORKSPACE_SUBMISSION_STATUSES');
export const WORKSPACE_TIMELINE_ENTRY_TYPES = createEnumBinding('WORKSPACE_TIMELINE_ENTRY_TYPES');
