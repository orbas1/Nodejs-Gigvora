import { Op } from 'sequelize';

import * as models from '../models/index.js';
import { MessageThread, Message } from '../models/messagingModels.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { buildLocationDetails } from '../utils/location.js';

import { getAdDashboardSnapshot } from './adService.js';
import { getCreationStudioOverview } from './creationStudioService.js';
import { getVolunteeringDashboard as getCompanyVolunteeringDashboard } from './volunteeringManagementService.js';
import { getTimelineManagementSnapshot } from './companyTimelineService.js';
import { getCompanyDashboardOverview } from './companyDashboardOverviewService.js';
import { getWorkspacePageSnapshot } from './companyPageService.js';
import { fetchWeatherSummary } from './weatherService.js';

function withDefaultModel(model) {
  if (model) {
    return model;
  }

  return {
    async findAll() {
      return [];
    },
    async findOne() {
      return null;
    },
    async count() {
      return 0;
    },
    async create() {
      return null;
    },
    async bulkCreate() {
      return [];
    },
  };
}

function safeFindAll(model, options = {}) {
  if (!model?.findAll) {
    return Promise.resolve([]);
  }
  return model.findAll(options);
}

const {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderWorkspaceInvite,
  ProviderContactNote,
  CompanyProfile,
  User,
  Profile,
  Job,
  Gig,
  Project,
  Application,
  ApplicationReview,
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
  PartnerAgreement: PartnerAgreementRaw,
  PartnerCommission: PartnerCommissionRaw,
  PartnerSlaSnapshot: PartnerSlaSnapshotRaw,
  PartnerCollaborationEvent: PartnerCollaborationEventRaw,
  RecruitingCalendarEvent: RecruitingCalendarEventRaw,
  EmployerBrandAsset,
  EmployerBrandSection: EmployerBrandSectionRaw,
  EmployerBrandCampaign: EmployerBrandCampaignRaw,
  EmployerBrandStory: EmployerBrandStoryRaw,
  EmployerBenefit: EmployerBenefitRaw,
  WorkforceAnalyticsSnapshot: WorkforceAnalyticsSnapshotRaw,
  WorkforceCohortMetric: WorkforceCohortMetricRaw,
  InternalJobPosting: InternalJobPostingRaw,
  EmployeeReferral: EmployeeReferralRaw,
  CareerPathingPlan: CareerPathingPlanRaw,
  CompliancePolicy: CompliancePolicyRaw,
  ComplianceAuditLog: ComplianceAuditLogRaw,
  AccessibilityAudit: AccessibilityAuditRaw,
  HeadhunterInvite: HeadhunterInviteRaw,
  HeadhunterBrief: HeadhunterBriefRaw,
  HeadhunterBriefAssignment: HeadhunterBriefAssignmentRaw,
  HeadhunterPerformanceSnapshot: HeadhunterPerformanceSnapshotRaw,
  HeadhunterCommission: HeadhunterCommissionRaw,
  TalentPool: TalentPoolRaw,
  TalentPoolMember: TalentPoolMemberRaw,
  TalentPoolEngagement: TalentPoolEngagementRaw,
  AgencyCollaboration: AgencyCollaborationRaw,
  AgencyCollaborationInvitation: AgencyCollaborationInvitationRaw,
  AgencyRateCard: AgencyRateCardRaw,
  AgencyRateCardItem: AgencyRateCardItemRaw,
  AgencySlaSnapshot: AgencySlaSnapshotRaw,
  AgencyBillingEvent: AgencyBillingEventRaw,
  AgencyMentoringSession: AgencyMentoringSessionRaw,
  AgencyMentoringPurchase: AgencyMentoringPurchaseRaw,
  AgencyMentorPreference: AgencyMentorPreferenceRaw,
  MentorReview: MentorReviewRaw,
  EmployeeJourneyProgram: EmployeeJourneyProgramRaw,
  NetworkingSession: NetworkingSessionRaw,
  NetworkingSessionSignup: NetworkingSessionSignupRaw,
  NetworkingBusinessCard: NetworkingBusinessCardRaw,
  WorkspaceIntegration: WorkspaceIntegrationRaw,
  WorkspaceCalendarConnection: WorkspaceCalendarConnectionRaw,
} = models;

const EmployerBrandAssetModel = withDefaultModel(EmployerBrandAsset);
const EmployerBrandSectionModel = withDefaultModel(EmployerBrandSectionRaw);
const EmployerBrandCampaignModel = withDefaultModel(EmployerBrandCampaignRaw);
const EmployerBrandStoryModel = withDefaultModel(EmployerBrandStoryRaw);
const EmployerBenefitModel = withDefaultModel(EmployerBenefitRaw);
const InterviewPanelTemplateModel = withDefaultModel(InterviewPanelTemplate);
const InterviewScheduleModel = withDefaultModel(InterviewSchedule);
const InterviewerAvailabilityModel = withDefaultModel(InterviewerAvailability);
const InterviewReminderModel = withDefaultModel(InterviewReminder);
const CandidatePrepPortalModel = withDefaultModel(CandidatePrepPortal);
const InterviewEvaluationModel = withDefaultModel(InterviewEvaluation);
const EvaluationCalibrationSessionModel = withDefaultModel(EvaluationCalibrationSession);
const DecisionTrackerModel = withDefaultModel(DecisionTracker);
const OfferPackageModel = withDefaultModel(OfferPackage);
const OnboardingTaskModel = withDefaultModel(OnboardingTask);
const CandidateCareTicketModel = withDefaultModel(CandidateCareTicket);
const ApplicationModel = withDefaultModel(Application);
const ApplicationReviewModel = withDefaultModel(ApplicationReview);
const HiringAlertModel = withDefaultModel(HiringAlert);
const CandidateDemographicSnapshotModel = withDefaultModel(CandidateDemographicSnapshot);
const CandidateSatisfactionSurveyModel = withDefaultModel(CandidateSatisfactionSurvey);
const JobStageModel = withDefaultModel(JobStage);
const JobApprovalWorkflowModel = withDefaultModel(JobApprovalWorkflow);
const JobCampaignPerformanceModel = withDefaultModel(JobCampaignPerformance);
const PartnerEngagementModel = withDefaultModel(PartnerEngagement);
const WorkforceAnalyticsSnapshotModel = withDefaultModel(WorkforceAnalyticsSnapshotRaw);
const WorkforceCohortMetricModel = withDefaultModel(WorkforceCohortMetricRaw);
const InternalJobPostingModel = withDefaultModel(InternalJobPostingRaw);
const EmployeeReferralModel = withDefaultModel(EmployeeReferralRaw);
const CareerPathingPlanModel = withDefaultModel(CareerPathingPlanRaw);
const CompliancePolicyModel = withDefaultModel(CompliancePolicyRaw);
const ComplianceAuditLogModel = withDefaultModel(ComplianceAuditLogRaw);
const AccessibilityAuditModel = withDefaultModel(AccessibilityAuditRaw);
const HeadhunterInviteModel = withDefaultModel(HeadhunterInviteRaw);
const HeadhunterBriefModel = withDefaultModel(HeadhunterBriefRaw);
const HeadhunterBriefAssignmentModel = withDefaultModel(HeadhunterBriefAssignmentRaw);
const HeadhunterPerformanceSnapshotModel = withDefaultModel(HeadhunterPerformanceSnapshotRaw);
const HeadhunterCommissionModel = withDefaultModel(HeadhunterCommissionRaw);
const TalentPoolModel = withDefaultModel(TalentPoolRaw);
const TalentPoolMemberModel = withDefaultModel(TalentPoolMemberRaw);
const TalentPoolEngagementModel = withDefaultModel(TalentPoolEngagementRaw);
const AgencyCollaborationModel = withDefaultModel(AgencyCollaborationRaw);
const AgencyCollaborationInvitationModel = withDefaultModel(AgencyCollaborationInvitationRaw);
const AgencyRateCardModel = withDefaultModel(AgencyRateCardRaw);
const AgencySlaSnapshotModel = withDefaultModel(AgencySlaSnapshotRaw);
const AgencyBillingEventModel = withDefaultModel(AgencyBillingEventRaw);
const AgencyMentoringSessionModel = withDefaultModel(AgencyMentoringSessionRaw);
const AgencyMentoringPurchaseModel = withDefaultModel(AgencyMentoringPurchaseRaw);
const AgencyMentorPreferenceModel = withDefaultModel(AgencyMentorPreferenceRaw);
const MentorReviewModel = withDefaultModel(MentorReviewRaw);
const EmployeeJourneyProgramModel = withDefaultModel(EmployeeJourneyProgramRaw);
const NetworkingSessionModel = withDefaultModel(NetworkingSessionRaw);
const NetworkingSessionSignupModel = withDefaultModel(NetworkingSessionSignupRaw);
const NetworkingBusinessCardModel = withDefaultModel(NetworkingBusinessCardRaw);
const WorkspaceIntegrationModel = withDefaultModel(WorkspaceIntegrationRaw);
const WorkspaceCalendarConnectionModel = withDefaultModel(WorkspaceCalendarConnectionRaw);
const PartnerAgreementModel = withDefaultModel(PartnerAgreementRaw);
const PartnerCommissionModel = withDefaultModel(PartnerCommissionRaw);
const PartnerSlaSnapshotModel = withDefaultModel(PartnerSlaSnapshotRaw);
const PartnerCollaborationEventModel = withDefaultModel(PartnerCollaborationEventRaw);
const RecruitingCalendarEventModel = withDefaultModel(RecruitingCalendarEventRaw);

const CACHE_NAMESPACE = 'dashboard:company';
const CACHE_TTL_SECONDS = 45;
const MIN_LOOKBACK_DAYS = 7;
const MAX_LOOKBACK_DAYS = 180;
const NETWORKING_DEFAULT_PENALTY_RULES = { noShowThreshold: 2, cooldownDays: 14 };

function toPlainRecord(record) {
  return record?.get ? record.get({ plain: true }) : record;
}

function clamp(value, { min, max, fallback }) {
  if (!Number.isFinite(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  if (numeric < min) {
    return min;
  }
  if (numeric > max) {
    return max;
  }
  return numeric;
}

function differenceInDays(start, end = new Date()) {
  if (!start) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  const diffMs = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diffMs)) {
    return null;
  }
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function average(numbers) {
  const valid = numbers.filter((value) => Number.isFinite(value));
  if (!valid.length) {
    return null;
  }
  const total = valid.reduce((sum, value) => sum + value, 0);
  return Number((total / valid.length).toFixed(1));
}

function median(numbers) {
  const valid = numbers.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!valid.length) {
    return null;
  }
  const mid = Math.floor(valid.length / 2);
  if (valid.length % 2 === 0) {
    return Number(((valid[mid - 1] + valid[mid]) / 2).toFixed(1));
  }
  return Number(valid[mid].toFixed(1));
}

function percentage(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) {
    return 0;
  }
  return Number(((part / total) * 100).toFixed(1));
}

function sumNumbers(values = []) {
  return values.reduce((total, value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return total;
    }
    return total + numeric;
  }, 0);
}

const EXPECTED_MATURITY_SIGNALS = 9;

const READINESS_STATUS_ORDER = {
  unknown: 0,
  healthy: 1,
  watch: 2,
  at_risk: 3,
};

function determineMaturityTier(score) {
  if (!Number.isFinite(score)) {
    return 'insufficient_data';
  }
  if (score >= 85) {
    return 'elite';
  }
  if (score >= 70) {
    return 'operational';
  }
  if (score >= 55) {
    return 'scaling';
  }
  return 'foundational';
}

function evaluateSignalHealth(value, { healthy = 80, caution = 55 } = {}) {
  if (!Number.isFinite(value)) {
    return 'unknown';
  }
  if (value >= healthy) {
    return 'healthy';
  }
  if (value >= caution) {
    return 'watch';
  }
  return 'at_risk';
}

function resolveOverallStatus(statuses = []) {
  return statuses.reduce((worst, status) => {
    if (!status || READINESS_STATUS_ORDER[status] == null) {
      return worst;
    }
    if (!worst) {
      return status;
    }
    return READINESS_STATUS_ORDER[status] > READINESS_STATUS_ORDER[worst] ? status : worst;
  }, 'unknown');
}

function computeScoreConfidence(signalCount, expectedCount = EXPECTED_MATURITY_SIGNALS) {
  if (!Number.isFinite(signalCount) || signalCount <= 0 || !Number.isFinite(expectedCount) || expectedCount <= 0) {
    return null;
  }
  const ratio = Math.min(signalCount / expectedCount, 1);
  return Number((ratio * 100).toFixed(1));
}

function extractDateCandidates(records, fields = ['updatedAt', 'createdAt']) {
  if (!Array.isArray(records)) {
    return [];
  }
  return records
    .flatMap((record) => {
      const plain = record?.get ? record.get({ plain: true }) : record;
      if (!plain || typeof plain !== 'object') {
        return [];
      }
      return fields.map((field) => plain?.[field]).filter(Boolean);
    })
    .map((value) => new Date(value))
    .filter((date) => Number.isFinite(date.getTime()));
}

function findMostRecentDate(candidates = []) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }
  return candidates.reduce((latest, candidate) => {
    if (!candidate || Number.isNaN(candidate.getTime())) {
      return latest;
    }
    if (!latest) {
      return candidate;
    }
    return candidate > latest ? candidate : latest;
  }, null);
}

function normaliseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return metadata;
}

function toDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function toCents(value) {
  if (value == null) {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100);
}

function centsToAmount(value) {
  if (value == null) {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number((numeric / 100).toFixed(2));
}

function extractPartnerInfo(metadata, { fallbackName = 'Agency partner', fallbackType = 'agency' } = {}) {
  const normalised = normaliseMetadata(metadata);
  const partnerName = [
    normalised.partnerName,
    normalised.agencyName,
    normalised.headhunterName,
    normalised.vendor,
  ].find((value) => value && `${value}`.trim().length);

  const partnerType =
    normalised.partnerType || normalised.agencyType || normalised.relationshipType || fallbackType;

  return {
    partnerName: partnerName ? `${partnerName}` : fallbackName,
    partnerType: `${partnerType || fallbackType}`.toLowerCase(),
  };
}

function differenceInHours(start, end = new Date()) {
  if (!start) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  const diffMs = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diffMs)) {
    return null;
  }
  return Number((diffMs / (1000 * 60 * 60)).toFixed(1));
}

function startOfQuarter(reference = new Date()) {
  const date = new Date(reference);
  const month = date.getMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  return new Date(date.getFullYear(), quarterStartMonth, 1);
}

function toPlain(record) {
  return record?.get ? record.get({ plain: true }) : record;
}

function safeNumber(value, precision = null, fallback = 0) {
  if (value == null) {
    return fallback;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  if (precision == null) {
    return numeric;
  }

  return Number(numeric.toFixed(precision));
}

function sumBy(items, selector) {
  return items.reduce((total, item) => {
    const value = selector(item);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function toDateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function normalizeStageKey(value) {
  if (value == null) {
    return null;
  }
  return `${value}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function resolveWorkspaceSelector({ workspaceId, workspaceSlug }) {
  if (workspaceId != null && `${workspaceId}`.trim().length) {
    const parsed = Number(workspaceId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new ValidationError('workspaceId must be a positive integer.');
    }
    return { id: parsed };
  }

  if (workspaceSlug != null && `${workspaceSlug}`.trim().length) {
    return { slug: `${workspaceSlug}`.trim() };
  }

  throw new ValidationError('workspaceId or workspaceSlug is required.');
}

function buildMemberSummary(members) {
  const totals = {
    total: members.length,
    active: 0,
    pending: 0,
    bench: 0,
    averageWeeklyCapacity: null,
    timezones: new Set(),
  };

  const capacities = [];

  members.forEach((member) => {
    if (member.status === 'active') {
      totals.active += 1;
    }
    if (member.status === 'pending') {
      totals.pending += 1;
    }

    const profile = member.member?.Profile ?? member.member?.profile ?? null;
    if (profile?.availabilityStatus === 'available') {
      totals.bench += 1;
    }
    if (profile?.availableHoursPerWeek != null) {
      const numeric = Number(profile.availableHoursPerWeek);
      if (Number.isFinite(numeric)) {
        capacities.push(numeric);
      }
    }
    if (profile?.timezone) {
      totals.timezones.add(profile.timezone);
    }
  });

  totals.averageWeeklyCapacity = capacities.length ? average(capacities) : null;
  totals.uniqueTimezones = totals.timezones.size;
  delete totals.timezones;

  return totals;
}

function buildInviteSummary(invites) {
  if (!invites.length) {
    return { pending: 0, accepted: 0, expired: 0, lastSentAt: null };
  }

  const summary = { pending: 0, accepted: 0, expired: 0, lastSentAt: null };
  invites.forEach((invite) => {
    if (invite.status === 'pending') {
      summary.pending += 1;
    } else if (invite.status === 'accepted') {
      summary.accepted += 1;
    } else if (invite.status === 'expired' || invite.status === 'revoked') {
      summary.expired += 1;
    }

    if (!summary.lastSentAt || new Date(invite.createdAt) > new Date(summary.lastSentAt)) {
      summary.lastSentAt = invite.createdAt;
    }
  });
  return summary;
}

function buildPipelineSummary(applications) {
  const statusCounts = new Map();
  const sourceCounts = new Map();
  const velocityToDecision = [];
  const velocityToInterview = [];
  let interviews = 0;
  let offers = 0;
  let hires = 0;

  applications.forEach((application) => {
    statusCounts.set(application.status, (statusCounts.get(application.status) ?? 0) + 1);
    sourceCounts.set(application.sourceChannel, (sourceCounts.get(application.sourceChannel) ?? 0) + 1);

    if (application.status === 'interview') {
      interviews += 1;
    }
    if (application.status === 'offered') {
      offers += 1;
    }
    if (application.status === 'hired') {
      hires += 1;
    }

    if (application.decisionAt) {
      const days = differenceInDays(application.submittedAt ?? application.createdAt, application.decisionAt);
      if (Number.isFinite(days)) {
        velocityToDecision.push(days);
      }
    }

    if (application.metadata?.interviewScheduledAt) {
      const days = differenceInDays(
        application.submittedAt ?? application.createdAt,
        application.metadata.interviewScheduledAt,
      );
      if (Number.isFinite(days)) {
        velocityToInterview.push(days);
      }
    }
  });

  const totalApplications = applications.length;
  const convertedStatuses = Object.fromEntries(statusCounts.entries());
  const sources = Object.fromEntries(sourceCounts.entries());

  return {
    totals: {
      applications: totalApplications,
      interviews,
      offers,
      hires,
    },
    byStatus: convertedStatuses,
    bySource: sources,
    velocity: {
      averageDaysToDecision: average(velocityToDecision),
      medianDaysToInterview: median(velocityToInterview),
    },
    conversionRates: {
      offerRate: percentage(offers, totalApplications),
      hireRate: percentage(hires, totalApplications),
      interviewRate: percentage(interviews, totalApplications),
    },
  };
}

function buildProjectSummary(projects) {
  const buckets = {
    active: 0,
    planning: 0,
    atRisk: 0,
    completed: 0,
  };

  let automationEnabled = 0;
  let automationQueue = 0;

  projects.forEach((project) => {
    const status = (project.status ?? '').toLowerCase();
    if (['draft', 'planning', 'proposal', 'scoping'].includes(status)) {
      buckets.planning += 1;
    } else if (['delayed', 'blocked', 'on_hold', 'at_risk'].includes(status)) {
      buckets.atRisk += 1;
    } else if (['completed', 'closed', 'archived'].includes(status)) {
      buckets.completed += 1;
    } else {
      buckets.active += 1;
    }

    if (project.autoAssignEnabled) {
      automationEnabled += 1;
      if (project.autoAssignLastQueueSize != null) {
        const numeric = Number(project.autoAssignLastQueueSize);
        if (Number.isFinite(numeric)) {
          automationQueue += numeric;
        }
      }
    }
  });

  return {
    totals: buckets,
    automation: {
      automationEnabled,
      queueSize: automationQueue,
    },
  };
}

function sanitiseWorkspace(workspace, memberSummary, inviteSummary, badges = []) {
  const plain = workspace.get({ plain: true });
  const owner = workspace.owner?.get?.({ plain: true }) ?? workspace.owner ?? null;
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    timezone: plain.timezone,
    defaultCurrency: plain.defaultCurrency,
    intakeEmail: plain.intakeEmail,
    type: plain.type,
    isActive: plain.isActive,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    memberSummary,
    inviteSummary,
    health: {
      badges,
    },
    owner: owner
      ? {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
        }
      : null,
  };
}

function deriveWorkspaceBadges({ memberSummary, pipelineSummary, projectSummary }) {
  const badges = new Set();
  if ((memberSummary?.active ?? 0) >= 10) {
    badges.add('Scaled recruiting operations');
  }
  if ((pipelineSummary?.conversionRates?.hireRate ?? 0) >= 15) {
    badges.add('High offer acceptance');
  }
  if ((projectSummary?.automation?.automationEnabled ?? 0) > 0) {
    badges.add('Automation enabled');
  }
  if ((memberSummary?.uniqueTimezones ?? 0) > 2) {
    badges.add('Global hiring coverage');
  }
  return Array.from(badges);
}

function sanitizeProfile(companyProfile) {
  if (!companyProfile) {
    return null;
  }
  const plain = companyProfile.get ? companyProfile.get({ plain: true }) : companyProfile;
  return {
    companyName: plain.companyName,
    description: plain.description,
    website: plain.website,
    location: plain.location ?? null,
    geoLocation: plain.geoLocation ?? null,
    locationDetails: buildLocationDetails(plain.location, plain.geoLocation),
    tagline: plain.tagline ?? null,
    logoUrl: plain.logoUrl ?? null,
    bannerUrl: plain.bannerUrl ?? null,
    contactEmail: plain.contactEmail ?? null,
    contactPhone: plain.contactPhone ?? null,
    socialLinks: Array.isArray(plain.socialLinks)
      ? plain.socialLinks.map((entry) => ({ label: entry?.label ?? null, url: entry?.url ?? null }))
      : [],
  };
}

function buildRecentNotes(notes) {
  return notes.map((note) => {
    const plain = note.get ? note.get({ plain: true }) : note;
    const author = note.author?.get?.({ plain: true }) ?? note.author ?? null;
    const subject = note.subject?.get?.({ plain: true }) ?? note.subject ?? null;
    return {
      id: plain.id,
      visibility: plain.visibility,
      note: plain.note,
      createdAt: plain.createdAt,
      author: author
        ? {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            email: author.email,
          }
        : null,
      subject: subject
        ? {
            id: subject.id,
            firstName: subject.firstName,
            lastName: subject.lastName,
            email: subject.email,
          }
        : null,
    };
  });
}

async function fetchWorkspace(selector) {
  const workspace = await ProviderWorkspace.findOne({
    where: {
      type: 'company',
      ...(selector.id ? { id: selector.id } : {}),
      ...(selector.slug ? { slug: selector.slug } : {}),
    },
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });

  if (!workspace) {
    throw new NotFoundError('Company workspace not found.');
  }

  return workspace;
}

async function fetchMembers(workspaceId) {
  return ProviderWorkspaceMember.findAll({
    where: { workspaceId },
    include: [
      {
        model: User,
        as: 'member',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        include: [
          {
            model: Profile,
            as: 'Profile',
            attributes: ['availabilityStatus', 'availableHoursPerWeek', 'timezone'],
            required: false,
          },
        ],
      },
    ],
    order: [['createdAt', 'ASC']],
  });
}

async function fetchInvites(workspaceId) {
  return ProviderWorkspaceInvite.findAll({
    where: { workspaceId },
    order: [['createdAt', 'DESC']],
  });
}

async function fetchNotes(workspaceId) {
  return ProviderContactNote.findAll({
    where: { workspaceId },
    include: [
      { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'subject', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    limit: 8,
    order: [['createdAt', 'DESC']],
  });
}

async function fetchEmployerBrandSections({ workspaceId }) {
  return EmployerBrandSectionModel.findAll({
    where: {
      workspaceId,
      status: 'published',
    },
    order: [
      ['isFeatured', 'DESC'],
      ['sortOrder', 'ASC'],
      ['createdAt', 'DESC'],
    ],
  });
}

async function fetchEmployerBrandCampaigns({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.startsAt = { [Op.gte]: since };
  }
  return EmployerBrandCampaignModel.findAll({
    where,
    order: [
      ['status', 'DESC'],
      ['startsAt', 'DESC'],
    ],
  });
}

async function fetchWorkforceSnapshots({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.capturedAt = { [Op.gte]: since };
  }
  return safeFindAll(WorkforceAnalyticsSnapshotModel, {
    where,
    order: [['capturedAt', 'DESC']],
  });
}

async function fetchWorkforceCohorts({ workspaceId }) {
  return safeFindAll(WorkforceCohortMetricModel, {
    where: { workspaceId },
    order: [
      ['periodStart', 'DESC'],
      ['headcount', 'DESC'],
    ],
  });
}

async function fetchInternalJobPostings({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.postedAt = { [Op.gte]: since };
  }
  return safeFindAll(InternalJobPostingModel, {
    where,
    order: [
      ['status', 'ASC'],
      ['postedAt', 'DESC'],
    ],
  });
}

async function fetchEmployeeReferrals({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return safeFindAll(EmployeeReferralModel, {
    where,
    include: [{ model: User, as: 'referrer', attributes: ['id', 'firstName', 'lastName'] }],
    order: [['createdAt', 'DESC']],
  });
}

async function fetchCareerPlans({ workspaceId }) {
  return safeFindAll(CareerPathingPlanModel, {
    where: { workspaceId },
    include: [{ model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName'] }],
    order: [['updatedAt', 'DESC']],
  });
}

async function fetchCompliancePolicies({ workspaceId }) {
  return safeFindAll(CompliancePolicyModel, {
    where: { workspaceId },
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] }],
    order: [['policyArea', 'ASC']],
  });
}

async function fetchComplianceAudits({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.openedAt = { [Op.gte]: since };
  }
  return safeFindAll(ComplianceAuditLogModel, {
    where,
    order: [['openedAt', 'DESC']],
  });
}

async function fetchAccessibilityAudits({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.lastRunAt = { [Op.gte]: since };
  }
  return safeFindAll(AccessibilityAuditModel, {
    where,
    order: [['lastRunAt', 'DESC']],
  });
}

async function fetchApplications({ workspaceId, since }) {
  const where = {
    targetType: { [Op.in]: ['job', 'project', 'gig'] },
  };

  if (since) {
    where.createdAt = { [Op.gte]: since };
  }

  // We do not yet store a direct foreign key to the company workspace on applications.
  // As a pragmatic interim, we scope by metadata.workspaceId when present and fall back to all records.
  const applications = await safeFindAll(ApplicationModel, {
    where,
    attributes: [
      'id',
      'applicantId',
      'targetType',
      'targetId',
      'status',
      'sourceChannel',
      'submittedAt',
      'decisionAt',
      'createdAt',
      'updatedAt',
      'metadata',
    ],
  });

  if (!applications.length) {
    return applications;
  }

  return applications.filter((application) => {
    const metadata = application.metadata ?? {};
    if (!metadata || typeof metadata !== 'object') {
      return true;
    }
    if (metadata.companyWorkspaceId && Number.isInteger(metadata.companyWorkspaceId)) {
      return Number(metadata.companyWorkspaceId) === workspaceId;
    }
    if (metadata.workspaceId && Number.isInteger(metadata.workspaceId)) {
      return Number(metadata.workspaceId) === workspaceId;
    }
    return true;
  });
}

async function fetchApplicationReviews({ applicationIds, since }) {
  if (!applicationIds.length) {
    return [];
  }
  const where = { applicationId: { [Op.in]: applicationIds } };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return safeFindAll(ApplicationReviewModel, {
    where,
    attributes: ['id', 'applicationId', 'stage', 'decision', 'score', 'decidedAt', 'createdAt'],
  });
}

async function fetchProjects({ since, workspaceId }) {
  const where = {};
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  const projects = await Project.findAll({
    where,
    attributes: [
      'id',
      'status',
      'autoAssignEnabled',
      'autoAssignLastQueueSize',
      'autoAssignSettings',
      'createdAt',
      'updatedAt',
    ],
  });

  if (!projects.length) {
    return projects;
  }

  // Filter by metadata if present.
  return projects.filter((project) => {
    const metadata = project.autoAssignSettings ?? {};
    if (metadata && typeof metadata === 'object') {
      if (metadata.companyWorkspaceId && Number.isInteger(metadata.companyWorkspaceId)) {
        return Number(metadata.companyWorkspaceId) === workspaceId;
      }
      if (metadata.workspaceId && Number.isInteger(metadata.workspaceId)) {
        return Number(metadata.workspaceId) === workspaceId;
      }
    }
    return true;
  });
}

async function fetchJobs({ since }) {
  const where = {};
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return Job.findAll({ where, attributes: ['id', 'title', 'location', 'createdAt'] });
}

async function fetchGigs({ since }) {
  const where = {};
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return Gig.findAll({ where, attributes: ['id', 'title', 'location', 'createdAt'] });
}

async function fetchHiringAlerts({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.detectedAt = { [Op.gte]: since };
  }
  return safeFindAll(HiringAlertModel, {
    where,
    order: [['detectedAt', 'DESC']],
    limit: 25,
  });
}

async function fetchCandidateSnapshots({ workspaceId, applicationIds, since }) {
  const where = { workspaceId };
  if (since) {
    where.capturedAt = { [Op.gte]: since };
  }
  if (applicationIds?.length) {
    where.applicationId = { [Op.in]: applicationIds };
  }
  return safeFindAll(CandidateDemographicSnapshotModel, {
    where,
    attributes: [
      'id',
      'applicationId',
      'genderIdentity',
      'ethnicity',
      'veteranStatus',
      'disabilityStatus',
      'capturedAt',
    ],
    limit: 500,
  });
}

async function fetchCandidateSurveys({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.responseAt = { [Op.gte]: since };
  }
  return safeFindAll(CandidateSatisfactionSurveyModel, {
    where,
    order: [['responseAt', 'DESC']],
    limit: 100,
  });
}

async function fetchInterviewSchedules({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.scheduledAt = { [Op.gte]: since };
  }
  return safeFindAll(InterviewScheduleModel, {
    where,
    order: [['scheduledAt', 'ASC']],
    limit: 100,
  });
}

async function fetchInterviewPanelTemplates({ workspaceId }) {
  return safeFindAll(InterviewPanelTemplateModel, {
    where: { workspaceId },
    order: [['updatedAt', 'DESC']],
    limit: 50,
  });
}

async function fetchInterviewerAvailability({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.availableFrom = { [Op.gte]: new Date(since.getTime() - 48 * 60 * 60 * 1000) };
  }
  return safeFindAll(InterviewerAvailabilityModel, {
    where,
    order: [['availableFrom', 'ASC']],
    limit: 150,
  });
}

async function fetchInterviewReminders({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.sentAt = { [Op.gte]: since };
  }
  return safeFindAll(InterviewReminderModel, {
    where,
    order: [['sentAt', 'DESC']],
    limit: 200,
  });
}

async function fetchCandidatePrepPortals({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return safeFindAll(CandidatePrepPortalModel, {
    where,
    order: [['updatedAt', 'DESC']],
    limit: 120,
  });
}

async function fetchInterviewEvaluations({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.submittedAt = { [Op.gte]: since };
  }
  return safeFindAll(InterviewEvaluationModel, {
    where,
    order: [['submittedAt', 'DESC']],
    limit: 200,
  });
}

async function fetchEvaluationCalibrationSessions({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.scheduledAt = { [Op.gte]: since };
  }
  return safeFindAll(EvaluationCalibrationSessionModel, {
    where,
    order: [['scheduledAt', 'DESC']],
    limit: 50,
  });
}

async function fetchDecisionTrackers({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.openedAt = { [Op.gte]: since };
  }
  return safeFindAll(DecisionTrackerModel, {
    where,
    order: [['updatedAt', 'DESC']],
    limit: 100,
  });
}

async function fetchOfferPackages({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return safeFindAll(OfferPackageModel, {
    where,
    order: [['updatedAt', 'DESC']],
    limit: 100,
  });
}

async function fetchOnboardingTasks({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return safeFindAll(OnboardingTaskModel, {
    where,
    order: [['dueAt', 'ASC']],
    limit: 200,
  });
}

async function fetchCandidateCareTickets({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.openedAt = { [Op.gte]: since };
  }
  return safeFindAll(CandidateCareTicketModel, {
    where,
    order: [['openedAt', 'DESC']],
    limit: 150,
  });
}

async function fetchJobStagesData({ workspaceId }) {
  return safeFindAll(JobStageModel, {
    where: { workspaceId },
    order: [['orderIndex', 'ASC']],
    limit: 50,
  });
}

async function fetchJobApprovals({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return safeFindAll(JobApprovalWorkflowModel, {
    where,
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
}

async function fetchJobCampaigns({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.reportingDate = { [Op.gte]: since };
  }
  return safeFindAll(JobCampaignPerformanceModel, {
    where,
    order: [['reportingDate', 'DESC']],
    limit: 120,
  });
}

async function fetchPartnerEngagements({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.lastInteractionAt = { [Op.gte]: since };
  }
  return safeFindAll(PartnerEngagementModel, {
    where,
    order: [['lastInteractionAt', 'DESC']],
    limit: 50,
  });
}

async function fetchPartnerCommissions({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  return safeFindAll(PartnerCommissionModel, {
    where,
    order: [['dueDate', 'ASC']],
    limit: 120,
  });
}

async function fetchPartnerAgreements({ workspaceId }) {
  return safeFindAll(PartnerAgreementModel, {
    where: { workspaceId },
    order: [['renewalDate', 'ASC']],
    limit: 60,
  });
}

async function fetchPartnerSlaSnapshots({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.reportingPeriodStart = { [Op.gte]: since };
  }
  return safeFindAll(PartnerSlaSnapshotModel, {
    where,
    order: [['reportingPeriodEnd', 'DESC']],
    limit: 120,
  });
}

async function fetchPartnerCollaborationEvents({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.occurredAt = { [Op.gte]: since };
  }
  return safeFindAll(PartnerCollaborationEventModel, {
    where,
    order: [['occurredAt', 'DESC']],
    limit: 120,
  });
}

async function fetchPartnerThreads({ workspaceId, since }) {
  const threads = await MessageThread.findAll({
    where: { state: 'active' },
    order: [['lastMessageAt', 'DESC']],
    limit: 25,
    include: [
      {
        model: Message,
        as: 'messages',
        required: false,
        where: since
          ? {
              createdAt: {
                [Op.gte]: since,
              },
            }
          : undefined,
        separate: true,
        limit: 40,
        order: [['createdAt', 'DESC']],
      },
    ],
  });

  if (!threads.length) {
    return [];
  }

  return threads.filter((thread) => {
    const metadata = normaliseMetadata(thread.metadata);
    const workspaceIds = [
      metadata.companyWorkspaceId,
      metadata.workspaceId,
      metadata.providerWorkspaceId,
      metadata.partnerWorkspaceId,
    ]
      .map((value) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
      })
      .filter(Boolean);

    if (!workspaceIds.length) {
      return true;
    }
    return workspaceIds.includes(workspaceId);
  });
}

async function loadApplicants(applications) {
  const ids = Array.from(new Set(applications.map((application) => application.applicantId))).filter(Boolean);
  if (!ids.length) {
    return new Map();
  }

  const applicants = await User.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id', 'firstName', 'lastName', 'email'],
    include: [
      {
        model: Profile,
        attributes: ['headline', 'location', 'availabilityStatus'],
        required: false,
      },
    ],
  });

  return new Map(applicants.map((applicant) => [applicant.id, applicant.get({ plain: true })]));
}

async function fetchHeadhunterInvites({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.sentAt = { [Op.gte]: since };
  }
  return safeFindAll(HeadhunterInviteModel, {
    where,
    include: [{ model: ProviderWorkspace, as: 'headhunterWorkspace', attributes: ['id', 'name', 'type'] }],
    order: [['sentAt', 'DESC']],
    limit: 100,
  });
}

const EMPLOYER_BRAND_SECTION_LABELS = {
  culture_video: 'Culture video',
  benefit: 'Benefits highlight',
  dei_commitment: 'DEI commitment',
  team_spotlight: 'Team spotlight',
  office: 'Office spotlight',
  leadership_story: 'Leadership story',
  custom: 'Story',
};

async function fetchHeadhunterBriefs({ workspaceId }) {
  const include = HeadhunterBriefAssignmentRaw
    ? [
        {
          model: HeadhunterBriefAssignmentRaw,
          as: 'assignments',
          include: [
            { model: ProviderWorkspace, as: 'headhunterWorkspace', attributes: ['id', 'name', 'type'] },
          ],
        },
      ]
    : [];

  return safeFindAll(HeadhunterBriefModel, {
    where: { workspaceId },
    include,
    order: [['updatedAt', 'DESC']],
    limit: 80,
  });
}

async function fetchHeadhunterAssignments({ workspaceId }) {
  const include = [
    HeadhunterBriefRaw
      ? { model: HeadhunterBriefRaw, as: 'brief', attributes: ['id', 'title', 'status', 'dueAt'] }
      : null,
    { model: ProviderWorkspace, as: 'headhunterWorkspace', attributes: ['id', 'name'] },
  ].filter(Boolean);

  return safeFindAll(HeadhunterBriefAssignmentModel, {
    where: { workspaceId },
    include,
  });
}

async function fetchHeadhunterPerformance({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.periodEnd = { [Op.gte]: since };
  }
  return safeFindAll(HeadhunterPerformanceSnapshotModel, {
    where,
    include: [{ model: ProviderWorkspace, as: 'headhunterWorkspace', attributes: ['id', 'name'] }],
    order: [['periodEnd', 'DESC']],
    limit: 100,
  });
}

async function fetchHeadhunterCommissions({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  return safeFindAll(HeadhunterCommissionModel, {
    where,
    include: [
      HeadhunterBriefRaw ? { model: HeadhunterBriefRaw, as: 'brief', attributes: ['id', 'title'] } : null,
      { model: ProviderWorkspace, as: 'headhunterWorkspace', attributes: ['id', 'name'] },
    ].filter(Boolean),
    order: [['dueAt', 'ASC']],
  });
}

async function fetchTalentPools({ workspaceId }) {
  const include = [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }];
  return safeFindAll(TalentPoolModel, {
    where: { workspaceId },
    include,
    order: [['updatedAt', 'DESC']],
    limit: 60,
  });
}

async function fetchTalentPoolMembers({ workspaceId }) {
  const include = TalentPoolRaw
    ? [{ model: TalentPoolRaw, as: 'pool', attributes: ['id', 'name', 'poolType'] }]
    : [];

  return safeFindAll(TalentPoolMemberModel, {
    where: { workspaceId },
    include,
    order: [['updatedAt', 'DESC']],
    limit: 300,
  });
}

async function fetchTalentPoolEngagements({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.occurredAt = { [Op.gte]: since };
  }

  const include = [
    TalentPoolRaw ? { model: TalentPoolRaw, as: 'pool', attributes: ['id', 'name'] } : null,
    { model: User, as: 'performedBy', attributes: ['id', 'firstName', 'lastName'] },
  ].filter(Boolean);

  return safeFindAll(TalentPoolEngagementModel, {
    where,
    include,
    order: [['occurredAt', 'DESC']],
    limit: 120,
  });
}

async function fetchAgencyCollaborations({ workspaceId }) {
  const collaborations = await safeFindAll(AgencyCollaborationModel, {
    include: [{ model: ProviderWorkspace, as: 'agencyWorkspace', attributes: ['id', 'name', 'slug'] }],
    order: [['updatedAt', 'DESC']],
    limit: 80,
  });

  return collaborations.filter((collaboration) => {
    const plain = collaboration?.get ? collaboration.get({ plain: true }) : collaboration;
    const snapshot = plain.sharedDeliverySnapshot ?? {};
    if (snapshot && typeof snapshot === 'object' && Number.isInteger(snapshot.companyWorkspaceId)) {
      return Number(snapshot.companyWorkspaceId) === workspaceId;
    }
    return true;
  });
}

async function fetchAgencyInvitations({ collaborationIds }) {
  if (!collaborationIds.length) {
    return [];
  }
  return safeFindAll(AgencyCollaborationInvitationModel, {
    where: { collaborationId: { [Op.in]: collaborationIds } },
    order: [['createdAt', 'DESC']],
  });
}

async function fetchAgencyRateCards({ agencyWorkspaceIds }) {
  if (!agencyWorkspaceIds.length) {
    return [];
  }
  return safeFindAll(AgencyRateCardModel, {
    where: { agencyWorkspaceId: { [Op.in]: agencyWorkspaceIds } },
    include: [
      AgencyRateCardItemRaw ? { model: AgencyRateCardItemRaw, as: 'items' } : null,
    ].filter(Boolean),
    order: [['updatedAt', 'DESC']],
    limit: 60,
  });
}

async function fetchAgencySlaSnapshots({ collaborationIds, since }) {
  if (!collaborationIds.length) {
    return [];
  }
  const where = { agencyCollaborationId: { [Op.in]: collaborationIds } };
  if (since) {
    where.periodEnd = { [Op.gte]: since };
  }
  return safeFindAll(AgencySlaSnapshotModel, {
    where,
    order: [['periodEnd', 'DESC']],
  });
}

async function fetchAgencyBillingEvents({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  return safeFindAll(AgencyBillingEventModel, {
    where,
    order: [['dueAt', 'ASC']],
    limit: 120,
  });
}

async function fetchAgencyMentoringSessions({ workspaceId, since }) {
  if (!workspaceId) {
    return [];
  }

  const where = { workspaceId };
  if (since) {
    where.scheduledAt = { [Op.gte]: since };
  }

  const include = [
    AgencyMentoringPurchaseRaw
      ? {
          model: AgencyMentoringPurchaseRaw,
          as: 'purchase',
          attributes: ['id', 'packageName', 'status', 'sessionsIncluded', 'sessionsUsed'],
        }
      : null,
    { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email'] },
  ].filter(Boolean);

  return safeFindAll(AgencyMentoringSessionModel, {
    where,
    include,
    order: [
      ['scheduledAt', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit: 180,
  });
}

async function fetchAgencyMentoringPurchases({ workspaceId, since }) {
  if (!workspaceId) {
    return [];
  }

  const where = { workspaceId };
  if (since) {
    where.purchasedAt = { [Op.gte]: since };
  }

  const include = [
    { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email'] },
  ];

  return safeFindAll(AgencyMentoringPurchaseModel, {
    where,
    include,
    order: [['purchasedAt', 'DESC']],
    limit: 120,
  });
}

async function fetchAgencyMentorPreferences({ workspaceId }) {
  if (!workspaceId) {
    return [];
  }

  const include = [
    { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email'] },
  ];

  return safeFindAll(AgencyMentorPreferenceModel, {
    where: { workspaceId },
    include,
    order: [['preferenceLevel', 'ASC']],
    limit: 120,
  });
}

async function fetchMentorReviewsForMentors({ mentorIds, since }) {
  if (!Array.isArray(mentorIds) || mentorIds.length === 0) {
    return [];
  }

  const where = { mentorId: { [Op.in]: mentorIds } };
  if (since) {
    where.publishedAt = { [Op.gte]: since };
  }

  return safeFindAll(MentorReviewModel, {
    where,
    include: [{ model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName'] }],
    order: [['publishedAt', 'DESC']],
    limit: 160,
  });
}

async function fetchCalendarEvents({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.startsAt = { [Op.gte]: since };
  }
  return safeFindAll(RecruitingCalendarEventModel, {
    where,
    order: [['startsAt', 'ASC']],
    limit: 50,
  });
}

async function fetchBrandAssets({ workspaceId }) {
  return safeFindAll(EmployerBrandAssetModel, {
    where: { workspaceId },
    order: [['updatedAt', 'DESC']],
    limit: 25,
  });
}

async function fetchBrandStories({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  return EmployerBrandStoryModel.findAll({
    where,
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id'],
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: ['firstName', 'lastName'],
          },
        ],
      },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 40,
  });
}

async function fetchEmployerBenefits({ workspaceId }) {
  return EmployerBenefitModel.findAll({
    where: { workspaceId },
    order: [['isFeatured', 'DESC'], ['updatedAt', 'DESC']],
    limit: 40,
  });
}

async function fetchEmployeeJourneys({ workspaceId }) {
  return safeFindAll(EmployeeJourneyProgramModel, {
    where: { workspaceId },
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id'],
        include: [
          { model: Profile, as: 'profile', attributes: ['firstName', 'lastName'] },
        ],
      },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 50,
  });
}

async function fetchWorkspaceIntegrations({ workspaceId }) {
  return safeFindAll(WorkspaceIntegrationModel, {
    where: { workspaceId },
    order: [['status', 'ASC'], ['displayName', 'ASC']],
    limit: 50,
  });
}

async function fetchCalendarConnections({ workspaceId }) {
  return safeFindAll(WorkspaceCalendarConnectionModel, {
    where: { workspaceId },
    order: [['status', 'ASC'], ['updatedAt', 'DESC']],
    limit: 20,
  });
}

function buildJobSummary({ jobs, gigs }) {
  const total = jobs.length + gigs.length;
  const byType = {
    jobs: jobs.length,
    gigs: gigs.length,
  };

  const locations = new Map();
  [...jobs, ...gigs].forEach((record) => {
    if (record.location) {
      locations.set(record.location, (locations.get(record.location) ?? 0) + 1);
    }
  });

  return {
    total,
    byType,
    topLocations: Array.from(locations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count })),
  };
}

function buildRecommendations({ memberSummary, pipelineSummary, inviteSummary }) {
  const recommendations = [];

  if ((inviteSummary?.pending ?? 0) > 0) {
    recommendations.push({
      title: 'Follow up on pending invites',
      description:
        'A few workspace invites are still awaiting acceptance. Consider nudging stakeholders to maintain hiring momentum.',
      action: 'Review pending invites and resend reminders where appropriate.',
    });
  }

  if ((pipelineSummary?.conversionRates?.interviewRate ?? 0) < 25) {
    recommendations.push({
      title: 'Increase interview throughput',
      description: 'Interview conversion is below target for the selected lookback window.',
      action: 'Audit screening criteria and ensure interviewers are responding promptly to scheduling requests.',
    });
  }

  if ((memberSummary?.bench ?? 0) > 0) {
    recommendations.push({
      title: 'Re-engage bench recruiters',
      description: 'Some active workspace members are marked as available. Balance load by assigning them to priority roles.',
      action: 'Distribute requisitions to underutilised teammates and share refreshed hiring goals.',
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      title: 'Keep momentum strong',
      description:
        'Hiring operations are running smoothly. Continue monitoring interview velocity and candidate experience metrics.',
      action: 'Schedule a weekly review to celebrate wins and align on upcoming requisitions.',
    });
  }

  return recommendations;
}

function normalizeCategory(value, fallback = 'Unspecified') {
  if (value == null) {
    return fallback;
  }
  const label = `${value}`.trim();
  return label.length ? label : fallback;
}

function buildBreakdown(records, key) {
  const counts = new Map();
  records.forEach((record) => {
    const plain = record?.get ? record.get({ plain: true }) : record;
    const label = normalizeCategory(plain?.[key]);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return counts;
}

function formatBreakdown(counts, total) {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, percentage: percentage(count, total) }));
}

function computeDiversityIndex(counts, total) {
  if (!total) {
    return null;
  }
  const normalised = Array.from(counts.values()).reduce((sum, count) => {
    const share = count / total;
    return sum + share * share;
  }, 0);
  return Number((1 - normalised).toFixed(3));
}

function buildDiversityMetrics(snapshots) {
  const total = snapshots.length;
  if (!total) {
    return {
      total,
      breakdowns: {
        gender: [],
        ethnicity: [],
        veteranStatus: [],
        disabilityStatus: [],
      },
      representationIndex: null,
    };
  }

  const genderCounts = buildBreakdown(snapshots, 'genderIdentity');
  const ethnicityCounts = buildBreakdown(snapshots, 'ethnicity');
  const veteranCounts = buildBreakdown(snapshots, 'veteranStatus');
  const disabilityCounts = buildBreakdown(snapshots, 'disabilityStatus');

  return {
    total,
    breakdowns: {
      gender: formatBreakdown(genderCounts, total),
      ethnicity: formatBreakdown(ethnicityCounts, total),
      veteranStatus: formatBreakdown(veteranCounts, total),
      disabilityStatus: formatBreakdown(disabilityCounts, total),
    },
    representationIndex: computeDiversityIndex(ethnicityCounts, total),
  };
}

function sanitizeAlert(alert) {
  const plain = alert?.get ? alert.get({ plain: true }) : alert;
  return {
    id: plain.id,
    category: plain.category,
    severity: plain.severity,
    status: plain.status,
    message: plain.message,
    detectedAt: plain.detectedAt,
    resolvedAt: plain.resolvedAt,
  };
}

function buildAlertsSummary(alerts) {
  if (!alerts?.length) {
    return {
      total: 0,
      open: 0,
      acknowledged: 0,
      resolved: 0,
      bySeverity: {},
      byCategory: {},
      latestDetection: null,
      items: [],
    };
  }

  const bySeverity = new Map();
  const byCategory = new Map();
  let open = 0;
  let acknowledged = 0;
  let resolved = 0;
  let latestDetection = null;

  alerts.forEach((alert) => {
    const plain = alert?.get ? alert.get({ plain: true }) : alert;
    bySeverity.set(plain.severity, (bySeverity.get(plain.severity) ?? 0) + 1);
    byCategory.set(plain.category, (byCategory.get(plain.category) ?? 0) + 1);

    if (plain.status === 'open') {
      open += 1;
    } else if (plain.status === 'acknowledged') {
      acknowledged += 1;
    } else if (plain.status === 'resolved') {
      resolved += 1;
    }

    if (!latestDetection || new Date(plain.detectedAt) > new Date(latestDetection)) {
      latestDetection = plain.detectedAt;
    }
  });

  return {
    total: alerts.length,
    open,
    acknowledged,
    resolved,
    bySeverity: Object.fromEntries(bySeverity.entries()),
    byCategory: Object.fromEntries(byCategory.entries()),
    latestDetection,
    items: alerts.slice(0, 12).map(sanitizeAlert),
  };
}

function buildJobLifecycleInsights({
  jobStages,
  approvals,
  campaigns,
  pipelineSummary,
  jobSummary,
  applications,
  reviews,
  interviewSchedules,
  interviewScheduler = {},
  panelTemplates = {},
  candidatePrep = {},
  evaluationWorkspace = {},
  offerBridge = {},
  candidateCareCenter = {},
}) {
  const now = new Date();
  const stageRecords = [...jobStages]
    .map((stage) => (stage?.get ? stage.get({ plain: true }) : stage))
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const approvalRecords = approvals.map((item) => (item?.get ? item.get({ plain: true }) : item));
  const campaignRecords = campaigns.map((item) => (item?.get ? item.get({ plain: true }) : item));
  const reviewRecords = reviews.map((review) => (review?.get ? review.get({ plain: true }) : review));
  const applicationRecords = applications.map((application) => (application?.get ? application.get({ plain: true }) : application));
  const interviewRecords = interviewSchedules.map((schedule) =>
    schedule?.get ? schedule.get({ plain: true }) : schedule,
  );

  const lifecycleTimestamps = [
    ...extractDateCandidates(stageRecords),
    ...extractDateCandidates(approvalRecords),
    ...extractDateCandidates(campaignRecords),
    ...extractDateCandidates(reviewRecords, ['decidedAt', 'createdAt', 'updatedAt']),
    ...extractDateCandidates(applicationRecords, ['decisionAt', 'updatedAt', 'submittedAt', 'createdAt']),
    ...extractDateCandidates(interviewRecords, ['scheduledAt', 'updatedAt', 'createdAt']),
  ];
  const lastUpdatedDate = findMostRecentDate(lifecycleTimestamps);
  const dataFreshnessHours = lastUpdatedDate ? differenceInHours(lastUpdatedDate) : null;

  const averageStageDuration = average(
    stageRecords
      .map((stage) => (stage.averageDurationHours == null ? null : Number(stage.averageDurationHours)))
      .filter((value) => Number.isFinite(value)),
  );

  const pendingApprovals = approvalRecords.filter((item) => item.status !== 'approved');
  const overdueApprovals = pendingApprovals.filter((item) => {
    if (!item.dueAt) return false;
    return new Date(item.dueAt) < now;
  });

  const completionDurations = approvalRecords
    .filter((item) => item.completedAt)
    .map((item) => differenceInHours(item.createdAt, item.completedAt))
    .filter((value) => Number.isFinite(value));

  const campaignsByChannel = new Map();
  campaignRecords.forEach((campaign) => {
    const channel = normalizeCategory(campaign.channel, 'Direct');
    const entry = campaignsByChannel.get(channel) ?? {
      impressions: 0,
      clicks: 0,
      applications: 0,
      hires: 0,
      spend: 0,
    };
    entry.impressions += Number(campaign.impressions ?? 0);
    entry.clicks += Number(campaign.clicks ?? 0);
    entry.applications += Number(campaign.applications ?? 0);
    entry.hires += Number(campaign.hires ?? 0);
    entry.spend += Number.parseFloat(campaign.spendAmount ?? 0);
    campaignsByChannel.set(channel, entry);
  });

  const totalSpend = Array.from(campaignsByChannel.values()).reduce((sum, entry) => sum + entry.spend, 0);
  const campaignMetrics = Array.from(campaignsByChannel.entries())
    .sort((a, b) => b[1].applications - a[1].applications)
    .map(([channel, metrics]) => ({
      channel,
      ...metrics,
      conversionRate: metrics.applications ? Number(((metrics.hires / metrics.applications) * 100).toFixed(1)) : 0,
    }));
  const totalCampaignApplications = campaignMetrics.reduce((sum, entry) => sum + entry.applications, 0);
  const averageCampaignCpa =
    totalCampaignApplications > 0 ? Number((totalSpend / totalCampaignApplications).toFixed(2)) : null;

  const applicationMap = new Map();
  applicationRecords.forEach((application) => {
    if (application?.id != null) {
      applicationMap.set(application.id, application);
    }
  });

  const stageBuckets = stageRecords.map((stage) => {
    const normalizedKey = normalizeStageKey(stage?.metadata?.stageKey ?? stage?.metadata?.reviewStage ?? stage?.name);
    return {
      stage,
      normalizedKey: normalizedKey ?? `stage_${stage.id}`,
      reviews: [],
    };
  });
  const stageIndex = new Map(stageBuckets.map((bucket) => [bucket.normalizedKey, bucket]));

  reviewRecords.forEach((review) => {
    const key = normalizeStageKey(review.stage) ?? `stage_${review.stage ?? 'unknown'}`;
    const bucket = stageIndex.get(key);
    if (bucket) {
      bucket.reviews.push(review);
    }
  });

  const stagePerformance = stageBuckets.map(({ stage, reviews: stageReviews }) => {
    const decided = stageReviews.filter((review) => review.decision && review.decision !== 'pending');
    const advances = decided.filter((review) => review.decision === 'advance').length;
    const rejects = decided.filter((review) => review.decision === 'reject').length;
    const holds = decided.filter((review) => review.decision === 'hold').length;
    const averageScore = decided.length
      ? average(
          decided
            .map((review) => (review.score == null ? null : Number(review.score)))
            .filter((score) => Number.isFinite(score)),
        )
      : null;
    const cycleTimes = decided
      .map((review) => {
        const application = applicationMap.get(review.applicationId);
        const start = application?.submittedAt ?? application?.createdAt ?? review.createdAt;
        const end = review.decidedAt ?? review.updatedAt ?? review.createdAt;
        return differenceInHours(start, end);
      })
      .filter((value) => Number.isFinite(value));
    const pending = stageReviews.filter((review) => review.decision === 'pending').length;
    const throughput = stageReviews.length;
    const slaDelta =
      stage.averageDurationHours != null && stage.slaHours != null
        ? Number(stage.averageDurationHours) - Number(stage.slaHours)
        : null;

    return {
      id: stage.id,
      name: stage.name,
      orderIndex: stage.orderIndex ?? 0,
      slaHours: stage.slaHours ?? null,
      averageDurationHours: stage.averageDurationHours == null ? null : Number(stage.averageDurationHours),
      throughput,
      pendingReviews: pending,
      advanceRate: percentage(advances, decided.length || 0),
      rejectionRate: percentage(rejects, decided.length || 0),
      holdRate: percentage(holds, decided.length || 0),
      averageScore: averageScore == null ? null : Number(averageScore),
      medianDecisionHours: cycleTimes.length ? median(cycleTimes) : null,
      slaDeltaHours: slaDelta == null ? null : Number(slaDelta.toFixed(1)),
      guideUrl: stage.guideUrl ?? null,
    };
  });

  const sortedStagePerformance = stagePerformance.sort((a, b) => a.orderIndex - b.orderIndex);

  const approvalQueueItems = pendingApprovals
    .slice()
    .sort((a, b) => {
      const aDue = a.dueAt ? new Date(a.dueAt) : new Date(a.createdAt ?? 0);
      const bDue = b.dueAt ? new Date(b.dueAt) : new Date(b.createdAt ?? 0);
      return aDue - bDue;
    })
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      approverRole: item.approverRole,
      status: item.status,
      dueAt: item.dueAt,
      createdAt: item.createdAt,
      completedAt: item.completedAt ?? null,
      ageHours: differenceInHours(item.createdAt),
      isOverdue: item.dueAt ? new Date(item.dueAt) < now : false,
      metadata: item.metadata ?? null,
    }));

  const byStatus = pipelineSummary?.byStatus ?? {};
  const totalApplications = pipelineSummary?.totals?.applications ?? 0;
  const funnelOrder = [
    { status: 'submitted', label: 'Submitted' },
    { status: 'under_review', label: 'Under review' },
    { status: 'shortlisted', label: 'Shortlisted' },
    { status: 'interview', label: 'Interview' },
    { status: 'offered', label: 'Offer' },
    { status: 'hired', label: 'Hired' },
  ];
  let previousCount = totalApplications || 0;
  const funnel = funnelOrder.map((stage, index) => {
    const count = Number(byStatus[stage.status] ?? 0);
    const conversionFromPrevious =
      index === 0
        ? 100
        : percentage(count, previousCount || (index === 1 ? totalApplications : previousCount) || 1);
    const cumulativeConversion = percentage(count, totalApplications || 1);
    previousCount = count || previousCount;
    return {
      ...stage,
      count,
      conversionFromPrevious,
      cumulativeConversion,
    };
  });

  const upcomingInterviews = interviewRecords.filter((item) => {
    if (item.completedAt) return false;
    if (!item.scheduledAt) return false;
    return new Date(item.scheduledAt) >= now;
  }).length;
  const rescheduleCount = interviewRecords.reduce((sum, item) => sum + Number(item.rescheduleCount ?? 0), 0);

  const approvalsCompleted = approvalRecords.filter((item) => item.completedAt).length;

  const instrumentedStages = stageRecords.filter((stage) => {
    const metadata = stage?.metadata ?? {};
    if (Array.isArray(metadata.automations) && metadata.automations.length) return true;
    if (Array.isArray(metadata.automationRules) && metadata.automationRules.length) return true;
    if (Array.isArray(metadata.automationPlaybooks) && metadata.automationPlaybooks.length) return true;
    if (Array.isArray(metadata.webhookTargets) && metadata.webhookTargets.length) return true;
    if (Array.isArray(metadata.reminders) && metadata.reminders.length) return true;
    if (Array.isArray(metadata.guardrails) && metadata.guardrails.length) return true;
    if (metadata.autoAdvance || metadata.autoReject || metadata.autoMove) return true;
    if (metadata.automation?.enabled || metadata.automation?.playbooks?.length) return true;
    if (metadata.serviceLevelAutomation && Object.keys(metadata.serviceLevelAutomation).length) return true;
    return false;
  }).length;

  const stageAutomationCoverage = stageRecords.length
    ? Number(((instrumentedStages / stageRecords.length) * 100).toFixed(1))
    : null;

  const stageGuideCoverage = stageRecords.length
    ? Number(
        (
          (stageRecords.filter((stage) => Boolean(stage.guideUrl)).length / stageRecords.length) *
          100
        ).toFixed(1),
      )
    : null;

  const stageKeySet = new Set(
    stageRecords
      .map((stage) => normalizeStageKey(stage?.metadata?.stageKey ?? stage?.metadata?.reviewStage ?? stage?.name))
      .filter(Boolean),
  );
  const templateCoverageSet = new Set(
    (panelTemplates?.stageCoverage ?? [])
      .map((entry) => normalizeStageKey(entry?.stage))
      .filter(Boolean),
  );
  const templateCoverage = stageKeySet.size
    ? Number(
        (
          (Array.from(stageKeySet).filter((key) => templateCoverageSet.has(key)).length / stageKeySet.size) *
          100
        ).toFixed(1),
      )
    : null;

  const reminderCoverage = safeNumber(interviewScheduler?.reminderCoverage);
  const availabilityCoverage = safeNumber(interviewScheduler?.availabilityCoverage);
  const rescheduleRate = safeNumber(interviewScheduler?.rescheduleRate);

  const ndaCompletionRate = safeNumber(candidatePrep?.ndaCompletionRate);
  const formCompletionRate = safeNumber(candidatePrep?.formCompletionRate);
  const resourceEngagementRate = safeNumber(candidatePrep?.resourceEngagementRate);

  const anonymizedShare = safeNumber(evaluationWorkspace?.anonymizedShare);
  const calibrationsScheduled = Array.isArray(evaluationWorkspace?.calibrationSessions)
    ? evaluationWorkspace.calibrationSessions.length
    : 0;

  const backgroundChecksInProgress = safeNumber(offerBridge?.backgroundChecksInProgress) ?? 0;
  const approvalsPendingCount = pendingApprovals.length;

  const inclusionScore = safeNumber(candidateCareCenter?.inclusionScore);
  const candidateNps = safeNumber(candidateCareCenter?.nps);
  const averageResponseMinutes = safeNumber(candidateCareCenter?.averageResponseMinutes);
  const openTickets = safeNumber(candidateCareCenter?.openTickets);
  const escalations = safeNumber(candidateCareCenter?.escalations) ?? 0;

  const maturitySignals = [
    stageAutomationCoverage,
    reminderCoverage,
    availabilityCoverage,
    templateCoverage,
    ndaCompletionRate,
    formCompletionRate,
    resourceEngagementRate,
    anonymizedShare,
    inclusionScore,
  ].filter((value) => Number.isFinite(value));

  const maturityScore = maturitySignals.length
    ? Number((maturitySignals.reduce((sum, value) => sum + value, 0) / maturitySignals.length).toFixed(1))
    : null;

  const signalCount = maturitySignals.length;
  const scoreConfidence = computeScoreConfidence(signalCount);
  const maturityTier = determineMaturityTier(maturityScore);
  const candidateNpsNormalised = Number.isFinite(candidateNps)
    ? Math.max(Math.min(((candidateNps + 100) / 2), 100), 0)
    : null;

  const readinessSignals = [
    { id: 'automation', label: 'Automation coverage', value: stageAutomationCoverage, goal: 80 },
    { id: 'reminders', label: 'Reminder coverage', value: reminderCoverage, goal: 90 },
    { id: 'availability', label: 'Availability coverage', value: availabilityCoverage, goal: 85 },
    { id: 'templates', label: 'Template coverage', value: templateCoverage, goal: 75 },
    { id: 'guides', label: 'Stage guides', value: stageGuideCoverage, goal: 85 },
    { id: 'nda', label: 'NDA completion', value: ndaCompletionRate, goal: 90 },
    { id: 'forms', label: 'Form completion', value: formCompletionRate, goal: 85 },
    { id: 'resources', label: 'Resource engagement', value: resourceEngagementRate, goal: 60 },
    { id: 'anonymized', label: 'Bias-safe reviews', value: anonymizedShare, goal: 70 },
    { id: 'inclusion', label: 'Inclusion score', value: inclusionScore, goal: 80 },
  ];

  const readinessScorecard = readinessSignals
    .map((signal) => {
      const numericValue = Number(signal.value);
      const hasValue = Number.isFinite(numericValue);
      const cautionThreshold = Math.max(Math.min(signal.goal - 10, Math.round(signal.goal * 0.75)), 0);
      return {
        id: signal.id,
        label: signal.label,
        value: hasValue ? Number(numericValue.toFixed(1)) : null,
        goal: signal.goal,
        status: evaluateSignalHealth(hasValue ? numericValue : null, {
          healthy: signal.goal,
          caution: cautionThreshold,
        }),
      };
    })
    .filter((signal) => signal.value != null);

  const complianceSignals = [stageGuideCoverage, ndaCompletionRate, formCompletionRate].filter((value) =>
    Number.isFinite(value),
  );
  const complianceScore = complianceSignals.length ? Number(average(complianceSignals)) : null;

  const experienceSignals = [resourceEngagementRate, inclusionScore, candidateNpsNormalised].filter((value) =>
    Number.isFinite(value),
  );
  const experienceScore = experienceSignals.length ? Number(average(experienceSignals)) : null;

  const automationHealthStatus = evaluateSignalHealth(stageAutomationCoverage, { healthy: 80, caution: 55 });
  const collaborationHealthStatus = evaluateSignalHealth(templateCoverage, { healthy: 75, caution: 50 });
  const complianceHealthStatus = evaluateSignalHealth(complianceScore, { healthy: 85, caution: 65 });
  const experienceHealthStatus = evaluateSignalHealth(experienceScore, { healthy: 75, caution: 55 });
  const overallHealthStatus = resolveOverallStatus([
    automationHealthStatus,
    collaborationHealthStatus,
    complianceHealthStatus,
    experienceHealthStatus,
  ]);

  const readinessWatchouts = [];
  if (automationHealthStatus === 'at_risk') {
    readinessWatchouts.push(
      'Less than 55% of lifecycle stages are automated. Configure orchestration or SLAs to reduce manual handoffs.',
    );
  }
  if (automationHealthStatus === 'watch' && Number.isFinite(stageAutomationCoverage)) {
    readinessWatchouts.push(
      `Automation coverage at ${stageAutomationCoverage}% could improve to unlock faster candidate movement.`,
    );
  }
  if (complianceHealthStatus !== 'healthy' && approvalsPendingCount > 0) {
    readinessWatchouts.push(
      `${approvalsPendingCount} compliance approvals are in-flight. Expedite sign-off to maintain guardrails.`,
    );
  }
  if (experienceHealthStatus === 'at_risk') {
    readinessWatchouts.push(
      'Candidate experience signals show risk. Review prep resources and care tickets to restore satisfaction.',
    );
  }
  if (Number.isFinite(rescheduleRate) && rescheduleRate > 15) {
    readinessWatchouts.push(`Interview reschedule rate at ${rescheduleRate}% exceeds healthy thresholds.`);
  }
  if (openTickets > 3) {
    readinessWatchouts.push(`${openTickets} candidate care tickets remain open. Rally support to close the queue.`);
  }
  if (scoreConfidence != null && scoreConfidence < 60) {
    readinessWatchouts.push('Readiness score confidence is low. Connect additional lifecycle signals for better coverage.');
  }
  if (dataFreshnessHours != null && dataFreshnessHours > 48) {
    readinessWatchouts.push('Lifecycle signals are older than 48 hours. Refresh integrations to improve data freshness.');
  }

  const enterpriseActions = [];
  if (!Number.isFinite(stageAutomationCoverage) || stageAutomationCoverage < 80) {
    enterpriseActions.push({
      id: 'automation-expansion',
      title: 'Instrument additional stage automations',
      description: 'Add SLA reminders and guardrails to remaining stages to exceed 80% automation coverage.',
      impact: 'High',
      category: 'automation',
    });
  }
  if (!Number.isFinite(templateCoverage) || templateCoverage < 75) {
    enterpriseActions.push({
      id: 'template-standardisation',
      title: 'Roll out structured interview templates',
      description: 'Publish templates for uncovered stages to ensure consistent feedback and calibration readiness.',
      impact: 'Medium',
      category: 'collaboration',
    });
  }
  if (!Number.isFinite(ndaCompletionRate) || ndaCompletionRate < 90) {
    enterpriseActions.push({
      id: 'compliance-nda',
      title: 'Boost NDA completion rates',
      description: 'Automate NDA distribution from prep portals to drive completion above 90%.',
      impact: 'Medium',
      category: 'compliance',
    });
  }
  if (scoreConfidence != null && scoreConfidence < 70) {
    enterpriseActions.push({
      id: 'signal-instrumentation',
      title: 'Connect additional lifecycle signals',
      description: 'Enable recruiter workspace integrations to lift readiness score confidence above 70%.',
      impact: 'High',
      category: 'observability',
    });
  }
  if (!Number.isFinite(resourceEngagementRate) || resourceEngagementRate < 50) {
    enterpriseActions.push({
      id: 'candidate-prep',
      title: 'Refresh candidate prep resources',
      description: 'Publish updated prep guides and nudges to raise resource engagement beyond 50%.',
      impact: 'Medium',
      category: 'experience',
    });
  }
  if (dataFreshnessHours != null && dataFreshnessHours > 36) {
    enterpriseActions.push({
      id: 'refresh-integrations',
      title: 'Refresh ATS integrations',
      description: 'Re-authorise calendar, ATS, and HRIS connections to bring data freshness under 24 hours.',
      impact: 'Medium',
      category: 'observability',
    });
  }

  const readinessHighlights = [];
  if (maturityTier === 'elite') {
    readinessHighlights.push('Readiness tier recognised as Elite with comprehensive lifecycle instrumentation.');
  } else if (maturityTier === 'operational') {
    readinessHighlights.push('Operational readiness achieved across automation, collaboration, and compliance signals.');
  }
  if (Number.isFinite(stageAutomationCoverage) && stageAutomationCoverage > 0) {
    readinessHighlights.push(
      `${stageAutomationCoverage}% of lifecycle stages have automations, SLA reminders, or guardrails configured.`,
    );
  }
  if (Number.isFinite(templateCoverage) && templateCoverage > 0) {
    readinessHighlights.push(`${templateCoverage}% of hiring stages mapped to structured interview templates.`);
  }
  if (Number.isFinite(ndaCompletionRate) && ndaCompletionRate > 0) {
    readinessHighlights.push(`NDA completion at ${ndaCompletionRate.toFixed(1)}% across candidate prep portals.`);
  }
  if (Number.isFinite(resourceEngagementRate) && resourceEngagementRate > 0) {
    readinessHighlights.push(`Candidates consume ${resourceEngagementRate.toFixed(1)}% of shared resources before interviews.`);
  }
  if (calibrationsScheduled > 0) {
    readinessHighlights.push(`${calibrationsScheduled} calibration session${calibrationsScheduled === 1 ? '' : 's'} scheduled.`);
  }
  if (Number.isFinite(inclusionScore) && inclusionScore > 0) {
    readinessHighlights.push(`Candidate care centre inclusion score at ${inclusionScore.toFixed(1)}%.`);
  }
  if (Number.isFinite(candidateNps)) {
    readinessHighlights.push(`Candidate NPS tracked at ${candidateNps.toFixed(1)}.`);
  }
  if (scoreConfidence != null && scoreConfidence >= 80) {
    readinessHighlights.push(`Readiness score confidence high with ${signalCount} lifecycle signals feeding the model.`);
  }

  const lastUpdatedAt = lastUpdatedDate ? lastUpdatedDate.toISOString() : null;

  const instrumentation = {
    measuredSignals: signalCount,
    expectedSignals: EXPECTED_MATURITY_SIGNALS,
    scoreConfidence,
    coverage: {
      automation: stageAutomationCoverage,
      reminders: reminderCoverage,
      availability: availabilityCoverage,
      templates: templateCoverage,
      guides: stageGuideCoverage,
      ndaCompletion: ndaCompletionRate,
      formCompletion: formCompletionRate,
      resourceEngagement: resourceEngagementRate,
      anonymizedShare,
      inclusionScore,
    },
  };

  const enterpriseReadiness = {
    maturityScore,
    maturityTier,
    scoreConfidence,
    dataFreshnessHours,
    lastUpdatedAt,
    automation: {
      stageAutomationCoverage,
      instrumentedStages,
      totalStages: stageRecords.length,
      reminderCoverage,
      availabilityCoverage,
      rescheduleRate,
    },
    collaboration: {
      templateCoverage,
      calibrationsScheduled,
      anonymizedEvaluationsShare: anonymizedShare,
      rolesCovered: safeNumber(panelTemplates?.rolesCovered),
      interviewerLoad: Array.isArray(interviewScheduler?.interviewerLoad)
        ? interviewScheduler.interviewerLoad
        : [],
    },
    compliance: {
      guideCoverage: stageGuideCoverage,
      approvalsPending: approvalsPendingCount,
      ndaCompletionRate,
      formCompletionRate,
      backgroundChecksInProgress,
    },
    experience: {
      resourceEngagementRate,
      inclusionScore,
      nps: candidateNps,
      averageResponseMinutes,
      openTickets,
      escalations,
    },
    instrumentation,
    health: {
      overall: overallHealthStatus,
      automation: automationHealthStatus,
      collaboration: collaborationHealthStatus,
      compliance: complianceHealthStatus,
      experience: experienceHealthStatus,
    },
    highlights: readinessHighlights.slice(0, 6),
    watchouts: readinessWatchouts.slice(0, 5),
    actions: enterpriseActions.slice(0, 5),
    scorecard: readinessScorecard.slice(0, 10),
    risk: {
      outstandingApprovals: approvalsPendingCount,
      scheduleConflicts: safeNumber(interviewScheduler?.conflicts) ?? 0,
      openTickets,
    },
  };

  return {
    totalStages: jobStages.length,
    averageStageDurationHours: averageStageDuration,
    pendingApprovals: pendingApprovals.length,
    overdueApprovals: overdueApprovals.length,
    averageApprovalTurnaroundHours: completionDurations.length ? Number(average(completionDurations)) : null,
    stageGuides: stageRecords.slice(0, 8).map((stage) => ({
      id: stage.id,
      name: stage.name,
      slaHours: stage.slaHours,
      averageDurationHours: stage.averageDurationHours == null ? null : Number(stage.averageDurationHours),
      guideUrl: stage.guideUrl,
    })),
    stagePerformance: sortedStagePerformance,
    approvalQueue: {
      total: pendingApprovals.length,
      overdue: overdueApprovals.length,
      averageCompletionHours: completionDurations.length ? Number(average(completionDurations)) : null,
      items: approvalQueueItems,
    },
    campaigns: {
      totalSpend,
      averageCostPerApplication: averageCampaignCpa,
      byChannel: campaignMetrics,
      topChannels: campaignMetrics.slice(0, 5),
    },
    enterpriseReadiness,
    atsHealth: {
      conversionRates: pipelineSummary?.conversionRates ?? {},
      velocity: pipelineSummary?.velocity ?? {},
      activeRequisitions: jobSummary?.total ?? 0,
      upcomingInterviews,
      rescheduleCount,
      pendingApprovals: pendingApprovals.length,
      automationCoverage: stageAutomationCoverage,
      templateCoverage,
      maturityScore,
      readinessTier: maturityTier,
      scoreConfidence,
      dataFreshnessHours,
      lastUpdatedAt,
      overallHealthStatus,
      measuredSignals: signalCount,
      ndaCompletionRate,
      inclusionScore,
    },
    funnel,
    recentActivity: {
      approvalsCompleted,
      campaignsTracked: campaignRecords.length,
      interviewsScheduled: interviewRecords.length,
    },
  };
}

function buildJobDesignStudioSummary({ approvals, jobStages, jobSummary, alerts }) {
  const approvalsInFlight = approvals.filter((item) => ['pending', 'in_review'].includes(item.status));
  const coAuthorSessions = approvals.filter((item) => (item.metadata?.coAuthorCount ?? 1) > 1);
  const complianceAlerts = alerts.items.filter((item) => normalizeCategory(item.category).toLowerCase().includes('compliance'));

  return {
    totalRequisitions: jobSummary?.total ?? 0,
    approvalsInFlight: approvalsInFlight.length,
    coAuthorSessions: coAuthorSessions.length,
    structuredStages: jobStages.length,
    complianceAlerts: complianceAlerts.length,
  };
}

function buildSourcingSummary({ pipelineSummary, campaigns }) {
  const sources = Object.entries(pipelineSummary?.bySource ?? {}).map(([source, count]) => ({
    source,
    count,
    percentage: percentage(count, pipelineSummary?.totals?.applications ?? 0),
  }));

  const campaignTotals = campaigns.reduce(
    (totals, campaign) => {
      totals.applications += Number(campaign.applications ?? 0);
      totals.hires += Number(campaign.hires ?? 0);
      totals.spend += Number.parseFloat(campaign.spendAmount ?? 0);
      return totals;
    },
    { applications: 0, hires: 0, spend: 0 },
  );

  return {
    sources: sources.sort((a, b) => b.count - a.count),
    campaignTotals,
    averageCostPerApplication:
      campaignTotals.applications > 0 ? Number((campaignTotals.spend / campaignTotals.applications).toFixed(2)) : null,
    hireContributionRate:
      campaignTotals.applications > 0 ? percentage(campaignTotals.hires, campaignTotals.applications) : 0,
  };
}

function buildApplicantRelationshipManagerSummary({ surveys, pipelineSummary, partnerSummary }) {
  const followUpsScheduled = surveys.filter((survey) => {
    if (!survey.followUpScheduledAt) return false;
    return new Date(survey.followUpScheduledAt) > new Date();
  }).length;
  const complianceReviews = surveys.filter((survey) => normalizeCategory(survey.sentiment).toLowerCase() === 'compliance').length;

  return {
    totalActiveCandidates: pipelineSummary?.totals?.applications ?? 0,
    nurtureCampaigns: partnerSummary?.touchpoints ?? 0,
    followUpsScheduled,
    complianceReviews,
  };
}

function buildAnalyticsForecastingSummary({ pipelineSummary, jobSummary, projectSummary }) {
  const applications = pipelineSummary?.totals?.applications ?? 0;
  const hireRate = pipelineSummary?.conversionRates?.hireRate ?? 0;
  const projectedHires = Math.round((applications * hireRate) / 100);
  const backlog = (jobSummary?.total ?? 0) - projectedHires;
  const atRiskProjects = projectSummary?.totals?.atRisk ?? 0;

  return {
    projectedHires,
    backlog: backlog > 0 ? backlog : 0,
    timeToFillDays: pipelineSummary?.velocity?.averageDaysToDecision ?? null,
    atRiskProjects,
  };
}

function buildInterviewOperationsSummary({ schedules, reviews }) {
  const now = new Date();
  const upcoming = [];
  const durations = [];
  const leadTimes = [];
  let reschedules = 0;

  schedules.forEach((schedule) => {
    const plain = schedule?.get ? schedule.get({ plain: true }) : schedule;
    if (plain.rescheduleCount) {
      reschedules += Number(plain.rescheduleCount);
    }
    if (plain.durationMinutes != null) {
      durations.push(Number(plain.durationMinutes));
    }
    if (plain.createdAt && plain.scheduledAt) {
      const start = new Date(plain.createdAt);
      const scheduled = new Date(plain.scheduledAt);
      if (Number.isFinite(start.getTime()) && Number.isFinite(scheduled.getTime())) {
        const hours = (scheduled.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (Number.isFinite(hours)) {
          leadTimes.push(hours);
        }
      }
    }
    if (!plain.completedAt && plain.scheduledAt && new Date(plain.scheduledAt) >= now) {
      upcoming.push({
        id: plain.id,
        stage: plain.interviewStage,
        scheduledAt: plain.scheduledAt,
        interviewerCount: Array.isArray(plain.interviewerRoster) ? plain.interviewerRoster.length : null,
      });
    }
  });

  const completedReviews = reviews.filter((review) => review.decision && review.decision !== 'pending');

  return {
    upcomingCount: upcoming.length,
    upcoming: upcoming.slice(0, 6),
    averageDurationMinutes: durations.length ? Number(average(durations)) : null,
    averageLeadTimeHours: leadTimes.length ? Number(average(leadTimes).toFixed(1)) : null,
    rescheduleRate: schedules.length ? percentage(reschedules, schedules.length) : 0,
    feedbackLogged: completedReviews.length,
  };
}

function buildCandidateExperienceSummary({ surveys }) {
  if (!surveys.length) {
    return {
      responseCount: 0,
      averageScore: null,
      nps: null,
      sentiments: {},
      followUpsPending: 0,
      latestFeedback: [],
    };
  }

  const scores = [];
  let promoters = 0;
  let detractors = 0;
  const sentiments = new Map();
  let followUpsPending = 0;

  const latestFeedback = surveys
    .slice()
    .sort((a, b) => new Date(b.responseAt ?? b.createdAt ?? 0) - new Date(a.responseAt ?? a.createdAt ?? 0))
    .slice(0, 6)
    .map((survey) => {
      const plain = survey?.get ? survey.get({ plain: true }) : survey;
      return {
        id: plain.id,
        stage: plain.stage,
        score: plain.score,
        npsRating: plain.npsRating,
        sentiment: plain.sentiment,
        notes: plain.notes,
        responseAt: plain.responseAt,
      };
    });

  surveys.forEach((survey) => {
    const plain = survey?.get ? survey.get({ plain: true }) : survey;
    if (plain.score != null && Number.isFinite(Number(plain.score))) {
      scores.push(Number(plain.score));
    }
    if (plain.npsRating != null && Number.isFinite(Number(plain.npsRating))) {
      const rating = Number(plain.npsRating);
      if (rating >= 9) promoters += 1;
      else if (rating <= 6) detractors += 1;
    }
    const sentimentLabel = normalizeCategory(plain.sentiment);
    sentiments.set(sentimentLabel, (sentiments.get(sentimentLabel) ?? 0) + 1);
    if (plain.followUpScheduledAt && new Date(plain.followUpScheduledAt) > new Date()) {
      followUpsPending += 1;
    }
  });

  const totalResponses = surveys.length;
  const nps = totalResponses ? Number((((promoters - detractors) / totalResponses) * 100).toFixed(1)) : null;

  return {
    responseCount: totalResponses,
    averageScore: scores.length ? Number(average(scores).toFixed(1)) : null,
    nps,
    sentiments: Object.fromEntries(sentiments.entries()),
    followUpsPending,
    latestFeedback,
  };
}

function buildInterviewSchedulerDetail({ schedules, availability, reminders }) {
  const scheduleRecords = (Array.isArray(schedules) ? schedules : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const availabilityRecords = (Array.isArray(availability) ? availability : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const reminderRecords = (Array.isArray(reminders) ? reminders : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const now = new Date();
  const upcoming = scheduleRecords
    .filter((schedule) => {
      const scheduledAt = schedule?.scheduledAt ? new Date(schedule.scheduledAt) : null;
      return scheduledAt && !Number.isNaN(scheduledAt.getTime()) && scheduledAt >= now;
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const durations = [];
  const leadTimes = [];
  let reschedules = 0;
  let roomsReserved = 0;
  let conflicts = 0;
  const interviewerLoad = new Map();
  const timezoneCounts = new Map();

  scheduleRecords.forEach((schedule) => {
    const durationMinutes = Number(schedule?.durationMinutes ?? 0);
    if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
      durations.push(durationMinutes);
    }

    const createdAt = schedule?.createdAt ?? schedule?.updatedAt;
    if (createdAt && schedule?.scheduledAt) {
      const lead = differenceInHours(createdAt, schedule.scheduledAt);
      if (Number.isFinite(lead) && lead >= 0) {
        leadTimes.push(lead);
      }
    }

    reschedules += Number(schedule?.rescheduleCount ?? 0);

    if (schedule?.metadata?.roomReservation?.status === 'confirmed') {
      roomsReserved += 1;
    }

    if (schedule?.metadata?.conflict) {
      conflicts += 1;
    }

    const roster = Array.isArray(schedule?.interviewerRoster) ? schedule.interviewerRoster : [];
    roster.forEach((member) => {
      const name = member?.name ?? member?.email ?? 'Unassigned';
      interviewerLoad.set(name, (interviewerLoad.get(name) ?? 0) + 1);
      const tz = member?.timezone ?? schedule?.metadata?.timezone;
      if (tz) {
        timezoneCounts.set(tz, (timezoneCounts.get(tz) ?? 0) + 1);
      }
    });
  });

  availabilityRecords.forEach((slot) => {
    if (slot?.timezone) {
      timezoneCounts.set(slot.timezone, (timezoneCounts.get(slot.timezone) ?? 0) + 1);
    }
  });

  const reminderScheduleIds = new Set(
    reminderRecords
      .filter((reminder) => reminder?.interviewScheduleId && reminder?.deliveryStatus !== 'failed')
      .map((reminder) => reminder.interviewScheduleId),
  );
  const reminderCoverage = upcoming.length ? percentage(reminderScheduleIds.size, upcoming.length) : 0;

  const planningWindowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const relevantAvailability = availabilityRecords.filter((slot) => {
    const start = slot?.availableFrom ? new Date(slot.availableFrom) : null;
    const end = slot?.availableTo ? new Date(slot.availableTo) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }
    return end >= now && start <= planningWindowEnd;
  });

  const totalAvailabilityHours = relevantAvailability.reduce((total, slot) => {
    const slotHours = Number(slot?.capacityHours ?? null);
    if (Number.isFinite(slotHours) && slotHours > 0) {
      return total + slotHours;
    }
    const calculated = differenceInHours(slot.availableFrom, slot.availableTo);
    return Number.isFinite(calculated) && calculated > 0 ? total + calculated : total;
  }, 0);

  const scheduledHours = upcoming.reduce((total, schedule) => {
    const minutes = Number(schedule?.durationMinutes ?? 0);
    return Number.isFinite(minutes) ? total + minutes / 60 : total;
  }, 0);

  const availabilityCoverage =
    totalAvailabilityHours > 0
      ? Math.min(100, Number(((scheduledHours / totalAvailabilityHours) * 100).toFixed(1)))
      : null;

  const dailyAvailability = new Map();
  relevantAvailability.forEach((slot) => {
    const key = toDateKey(slot.availableFrom);
    if (!key) return;
    const existing = dailyAvailability.get(key) ?? { availableHours: 0, scheduledHours: 0 };
    const slotHours = Number(slot?.capacityHours ?? null);
    if (Number.isFinite(slotHours) && slotHours > 0) {
      existing.availableHours += slotHours;
    } else {
      const calculated = differenceInHours(slot.availableFrom, slot.availableTo);
      if (Number.isFinite(calculated) && calculated > 0) {
        existing.availableHours += calculated;
      }
    }
    dailyAvailability.set(key, existing);
  });

  upcoming.forEach((schedule) => {
    const key = toDateKey(schedule?.scheduledAt);
    if (!key) return;
    const existing = dailyAvailability.get(key) ?? { availableHours: 0, scheduledHours: 0 };
    const durationHours = Number(schedule?.durationMinutes ?? 0) / 60;
    if (Number.isFinite(durationHours) && durationHours > 0) {
      existing.scheduledHours += durationHours;
    }
    dailyAvailability.set(key, existing);
  });

  const availabilityGaps = Array.from(dailyAvailability.entries())
    .map(([date, value]) => ({
      date,
      availableHours: Number(value.availableHours.toFixed?.(1) ?? value.availableHours),
      scheduledHours: Number(value.scheduledHours.toFixed?.(1) ?? value.scheduledHours),
      shortfallHours:
        value.availableHours >= value.scheduledHours
          ? 0
          : Number((value.scheduledHours - value.availableHours).toFixed(1)),
    }))
    .filter((entry) => entry.shortfallHours > 0)
    .slice(0, 5);

  const upcomingSummary = upcoming.slice(0, 8).map((schedule) => ({
    id: schedule.id,
    stage: schedule.interviewStage,
    scheduledAt: schedule.scheduledAt,
    durationMinutes: schedule.durationMinutes,
    interviewerCount: Array.isArray(schedule?.interviewerRoster) ? schedule.interviewerRoster.length : null,
    location: schedule?.metadata?.roomReservation?.room ?? schedule?.metadata?.meetingUrl ?? null,
    templateId: schedule?.metadata?.templateId ?? schedule?.templateId ?? null,
  }));

  return {
    upcomingCount: upcoming.length,
    averageLeadTimeHours: leadTimes.length ? Number(average(leadTimes).toFixed(1)) : null,
    averageDurationMinutes: durations.length ? Number(average(durations).toFixed(1)) : null,
    rescheduleRate: scheduleRecords.length ? percentage(reschedules, scheduleRecords.length) : 0,
    reminderCoverage,
    roomsReserved,
    conflicts,
    availabilityCoverage,
    interviewerLoad: Array.from(interviewerLoad.entries())
      .map(([name, load]) => ({ name, load }))
      .sort((a, b) => b.load - a.load)
      .slice(0, 6),
    timezoneCoverage: Array.from(timezoneCounts.entries()).map(([timezone, count]) => ({ timezone, count })),
    availabilityGaps,
    upcoming: upcomingSummary,
  };
}

function buildPanelTemplateSummary({ templates, evaluations }) {
  const templateRecords = (Array.isArray(templates) ? templates : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const evaluationRecords = (Array.isArray(evaluations) ? evaluations : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const roleCoverage = new Set();
  const stageCoverage = new Map();
  const competencyCoverage = new Map();
  const evaluationCounts = new Map();
  const rubricScores = new Map();

  evaluationRecords.forEach((evaluation) => {
    if (evaluation?.templateId) {
      evaluationCounts.set(
        evaluation.templateId,
        (evaluationCounts.get(evaluation.templateId) ?? 0) + 1,
      );
    }

    const rubric = evaluation?.rubricScores;
    if (rubric && typeof rubric === 'object') {
      Object.entries(rubric).forEach(([competency, score]) => {
        const numeric = Number(score);
        if (!Number.isFinite(numeric)) return;
        if (!rubricScores.has(competency)) {
          rubricScores.set(competency, []);
        }
        rubricScores.get(competency).push(numeric);
      });
    }
  });

  templateRecords.forEach((template) => {
    if (template?.roleName) {
      roleCoverage.add(template.roleName);
    }
    if (template?.stage) {
      stageCoverage.set(template.stage, (stageCoverage.get(template.stage) ?? 0) + 1);
    }
    const competencies = Array.isArray(template?.competencies) ? template.competencies : [];
    competencies.forEach((competency) => {
      const label = typeof competency === 'string' ? competency : competency?.name ?? competency?.title;
      if (!label) return;
      competencyCoverage.set(label, (competencyCoverage.get(label) ?? 0) + 1);
    });
  });

  const topTemplates = templateRecords
    .slice()
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0))
    .slice(0, 6)
    .map((template) => ({
      id: template.id,
      roleName: template.roleName,
      stage: template.stage,
      durationMinutes: template.durationMinutes,
      version: template.version,
      lastUsedAt: template.lastUsedAt,
      competencies: (Array.isArray(template?.competencies) ? template.competencies : []).slice(0, 4),
      evaluations: evaluationCounts.get(template.id) ?? 0,
    }));

  const rubricLibrary = Array.from(rubricScores.entries()).map(([competency, scores]) => ({
    competency,
    averageScore: scores.length ? Number(average(scores).toFixed(1)) : null,
    submissions: scores.length,
  }));

  return {
    totalTemplates: templateRecords.length,
    rolesCovered: roleCoverage.size,
    stageCoverage: Array.from(stageCoverage.entries()).map(([stage, count]) => ({ stage, count })),
    competencyCoverage: Array.from(competencyCoverage.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    topTemplates,
    rubricLibrary,
  };
}

function buildCandidatePrepSummary({ portals }) {
  const portalRecords = (Array.isArray(portals) ? portals : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const ndaRequired = portalRecords.filter((portal) => portal?.ndaRequired);
  const ndaSigned = ndaRequired.filter((portal) => portal?.ndaStatus === 'signed');

  const formsRequired = portalRecords.reduce((total, portal) => total + Number(portal?.formsRequired ?? 0), 0);
  const formsCompleted = portalRecords.reduce((total, portal) => total + Number(portal?.formsCompleted ?? 0), 0);
  const resourcesTotal = portalRecords.reduce((total, portal) => total + Number(portal?.resourceTotal ?? 0), 0);
  const resourcesViewed = portalRecords.reduce((total, portal) => total + Number(portal?.resourceViews ?? 0), 0);
  const totalVisits = portalRecords.reduce((total, portal) => total + Number(portal?.visitCount ?? 0), 0);
  const followUpsPending = portalRecords.filter((portal) => {
    if (!portal?.nextActionAt) return false;
    const dueAt = new Date(portal.nextActionAt);
    return !Number.isNaN(dueAt.getTime()) && dueAt > new Date();
  }).length;

  const topPortals = portalRecords
    .slice()
    .sort((a, b) => new Date(b.lastAccessedAt ?? b.updatedAt ?? 0) - new Date(a.lastAccessedAt ?? a.updatedAt ?? 0))
    .slice(0, 6)
    .map((portal) => ({
      id: portal.id,
      candidateName: portal.candidateName,
      stage: portal.stage,
      status: portal.status,
      lastAccessedAt: portal.lastAccessedAt,
      ndaStatus: portal.ndaStatus,
      formsProgress:
        portal.formsRequired > 0
          ? Math.min(100, Math.round((Number(portal.formsCompleted ?? 0) / portal.formsRequired) * 100))
          : null,
      resourceProgress:
        portal.resourceTotal > 0
          ? Math.min(100, Math.round((Number(portal.resourceViews ?? 0) / portal.resourceTotal) * 100))
          : null,
    }));

  return {
    totalPortals: portalRecords.length,
    activePortals: portalRecords.filter((portal) => portal?.status !== 'archived').length,
    ndaCompletionRate: ndaRequired.length ? percentage(ndaSigned.length, ndaRequired.length) : 0,
    formCompletionRate: formsRequired ? percentage(formsCompleted, formsRequired) : 0,
    resourceEngagementRate: resourcesTotal ? percentage(resourcesViewed, resourcesTotal) : 0,
    averageVisits: portalRecords.length ? Number((totalVisits / portalRecords.length).toFixed(1)) : null,
    followUpsPending,
    topPortals,
  };
}

function buildEvaluationWorkspaceSummary({ evaluations, calibrationSessions, decisionTrackers }) {
  const evaluationRecords = (Array.isArray(evaluations) ? evaluations : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const calibrationRecords = (Array.isArray(calibrationSessions) ? calibrationSessions : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const decisionRecords = (Array.isArray(decisionTrackers) ? decisionTrackers : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const recommendations = new Map();
  let anonymizedCount = 0;
  const scores = [];
  const biasFlags = new Map();

  evaluationRecords.forEach((evaluation) => {
    if (evaluation?.overallRecommendation) {
      const label = evaluation.overallRecommendation;
      recommendations.set(label, (recommendations.get(label) ?? 0) + 1);
    }
    const score = Number(evaluation?.overallScore ?? null);
    if (Number.isFinite(score)) {
      scores.push(score);
    }
    if (evaluation?.anonymized) {
      anonymizedCount += 1;
    }
    const flags = Array.isArray(evaluation?.biasFlags)
      ? evaluation.biasFlags
      : evaluation?.biasFlags && typeof evaluation.biasFlags === 'object'
        ? Object.entries(evaluation.biasFlags)
            .filter(([, value]) => Boolean(value))
            .map(([key]) => key)
        : [];
    flags.forEach((flag) => {
      const label = normalizeCategory(flag);
      biasFlags.set(label, (biasFlags.get(label) ?? 0) + 1);
    });
  });

  const decisionVelocities = decisionRecords
    .filter((decision) => decision?.decidedAt)
    .map((decision) => differenceInDays(decision.openedAt, decision.decidedAt))
    .filter((value) => Number.isFinite(value));

  const decisionSummaries = decisionRecords.slice(0, 10).map((decision) => ({
    id: decision.id,
    applicationId: decision.applicationId,
    candidateName: decision.candidateName,
    status: decision.status,
    decision: decision.decision,
    updatedAt: decision.updatedAt,
    approvals: decision.approvals,
  }));

  const calibrationSummaries = calibrationRecords
    .slice(0, 8)
    .map((session) => ({
      id: session.id,
      roleName: session.roleName,
      scheduledAt: session.scheduledAt,
      completedAt: session.completedAt,
      alignmentScore:
        session.alignmentScore == null ? null : Number(session.alignmentScore),
      participants: session.participants,
    }));

  return {
    evaluationsSubmitted: evaluationRecords.length,
    averageScore: scores.length ? Number(average(scores).toFixed(1)) : null,
    anonymizedShare: evaluationRecords.length ? percentage(anonymizedCount, evaluationRecords.length) : 0,
    recommendationMix: Object.fromEntries(recommendations.entries()),
    biasFlags: Array.from(biasFlags.entries())
      .map(([flag, count]) => ({ flag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    calibrationSessions: calibrationSummaries,
    decisionVelocityDays: decisionVelocities.length ? Number(average(decisionVelocities).toFixed(1)) : null,
    decisionTrackers: decisionSummaries,
  };
}

function buildOfferBridgeDetail({ offerPackages, onboardingTasks }) {
  const packageRecords = (Array.isArray(offerPackages) ? offerPackages : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const taskRecords = (Array.isArray(onboardingTasks) ? onboardingTasks : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const openOffers = packageRecords.filter((pkg) => ['extended', 'accepted', 'pending'].includes(pkg?.status)).length;
  const approvalsPending = packageRecords.filter((pkg) => pkg?.approvalStatus === 'pending').length;
  const backgroundChecksInProgress = packageRecords.filter((pkg) => pkg?.backgroundCheckStatus === 'in_progress').length;
  const signaturesOutstanding = packageRecords.filter((pkg) => pkg?.digitalSignatureStatus !== 'completed').length;
  const packageValues = packageRecords
    .map((pkg) => Number(pkg?.packageValue ?? null))
    .filter((value) => Number.isFinite(value));

  const upcomingStartDates = packageRecords
    .filter((pkg) => pkg?.startDate)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 6)
    .map((pkg) => ({
      id: pkg.id,
      candidateName: pkg.candidateName,
      roleName: pkg.roleName,
      startDate: pkg.startDate,
      status: pkg.status,
    }));

  const tasksByCategory = new Map();
  let completedTasks = 0;
  taskRecords.forEach((task) => {
    const category = task?.category ?? 'general';
    const entry = tasksByCategory.get(category) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (task?.status === 'completed') {
      entry.completed += 1;
      completedTasks += 1;
    }
    tasksByCategory.set(category, entry);
  });

  const breakdown = Array.from(tasksByCategory.entries()).map(([category, metrics]) => ({
    category,
    total: metrics.total,
    completed: metrics.completed,
    completionRate: metrics.total ? percentage(metrics.completed, metrics.total) : 0,
  }));

  return {
    openOffers,
    approvalsPending,
    backgroundChecksInProgress,
    signaturesOutstanding,
    averagePackageValue: packageValues.length ? Number(average(packageValues).toFixed(2)) : null,
    offerPackages: packageRecords.slice(0, 10).map((pkg) => ({
      id: pkg.id,
      candidateName: pkg.candidateName,
      roleName: pkg.roleName,
      status: pkg.status,
      approvalStatus: pkg.approvalStatus,
      backgroundCheckStatus: pkg.backgroundCheckStatus,
      digitalSignatureStatus: pkg.digitalSignatureStatus,
      startDate: pkg.startDate,
      packageValue: pkg.packageValue,
      currency: pkg.currency,
    })),
    upcomingStartDates,
    tasks: {
      total: taskRecords.length,
      completed: completedTasks,
      completionRate: taskRecords.length ? percentage(completedTasks, taskRecords.length) : 0,
      breakdown,
    },
  };
}

function buildCandidateCareCenterSummary({ tickets, candidateExperience }) {
  const ticketRecords = (Array.isArray(tickets) ? tickets : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const responseTimes = [];
  let escalations = 0;
  const inclusionCounts = new Map();

  ticketRecords.forEach((ticket) => {
    if (ticket?.firstRespondedAt) {
      const minutes = differenceInHours(ticket.openedAt, ticket.firstRespondedAt);
      if (Number.isFinite(minutes) && minutes >= 0) {
        responseTimes.push(minutes * 60);
      }
    }
    if (ticket?.escalatedAt) {
      escalations += 1;
    }
    if (ticket?.inclusionCategory) {
      const label = normalizeCategory(ticket.inclusionCategory);
      inclusionCounts.set(label, (inclusionCounts.get(label) ?? 0) + 1);
    }
  });

  const openTickets = ticketRecords.filter((ticket) => !['resolved', 'closed'].includes(ticket?.status)).length;
  const followUpsPending = ticketRecords.filter((ticket) => {
    if (!ticket?.followUpDueAt) return false;
    const dueAt = new Date(ticket.followUpDueAt);
    return !Number.isNaN(dueAt.getTime()) && dueAt > new Date();
  }).length;

  const inclusionScore = ticketRecords.length
    ? Number(((inclusionCounts.size / ticketRecords.length) * 100).toFixed(1))
    : null;

  const recentTickets = ticketRecords
    .slice()
    .sort((a, b) => new Date(b.openedAt ?? b.createdAt ?? 0) - new Date(a.openedAt ?? a.createdAt ?? 0))
    .slice(0, 8)
    .map((ticket) => ({
      id: ticket.id,
      candidateName: ticket.candidateName,
      type: ticket.type,
      status: ticket.status,
      openedAt: ticket.openedAt,
      firstRespondedAt: ticket.firstRespondedAt,
      priority: ticket.priority,
      inclusionCategory: ticket.inclusionCategory,
    }));

  return {
    satisfaction: candidateExperience?.averageScore ?? null,
    nps: candidateExperience?.nps ?? null,
    averageResponseMinutes: responseTimes.length ? Number(average(responseTimes).toFixed(1)) : null,
    openTickets,
    escalations,
    followUpsPending: (candidateExperience?.followUpsPending ?? 0) + followUpsPending,
    inclusionScore,
    inclusionBreakdown: Object.fromEntries(inclusionCounts.entries()),
    recentTickets,
  };
}

function buildOfferAndOnboardingSummary({
  offers,
  candidateExperience,
  interviewOperations,
  applications,
  alerts,
  offerBridge,
}) {
  const openOffers = Math.max((offers?.extended ?? 0) - (offers?.accepted ?? 0), 0);
  const rescheduleAlerts = alerts.items.filter((item) => normalizeCategory(item.category).toLowerCase().includes('schedule'));

  const startLeadTimes = applications
    .filter((application) => application.status === 'hired' && application.decisionAt && application.availabilityDate)
    .map((application) => {
      const decision = new Date(application.decisionAt);
      const availability = new Date(application.availabilityDate);
      if (Number.isNaN(decision.getTime()) || Number.isNaN(availability.getTime())) {
        return null;
      }
      const diff = (availability.getTime() - decision.getTime()) / (1000 * 60 * 60 * 24);
      return Number.isFinite(diff) ? diff : null;
    })
    .filter((value) => Number.isFinite(value));

  return {
    openOffers,
    acceptanceRate: offers?.winRate ?? 0,
    onboardingFollowUps: candidateExperience.followUpsPending ?? 0,
    interviewsToSchedule: interviewOperations.upcomingCount ?? 0,
    scheduleAlerts: rescheduleAlerts.length,
    averageDaysToStart: startLeadTimes.length ? Number(average(startLeadTimes).toFixed(1)) : null,
    approvalsPending: offerBridge?.approvalsPending ?? 0,
    backgroundChecksInProgress: offerBridge?.backgroundChecksInProgress ?? 0,
    signaturesOutstanding: offerBridge?.signaturesOutstanding ?? 0,
  };
}

function buildCandidateCareSummary({ candidateExperience, alerts, candidateCareCenter }) {
  const escalations = alerts.items.filter((item) => normalizeCategory(item.category).toLowerCase().includes('experience'));

  return {
    satisfaction: candidateExperience.averageScore,
    nps: candidateExperience.nps,
    followUpsPending: candidateExperience.followUpsPending,
    escalations: (candidateCareCenter?.escalations ?? 0) + escalations.length,
    openTickets: candidateCareCenter?.openTickets ?? null,
  };
}

function collectMentorIdsForWorkspace({ sessions = [], purchases = [], preferences = [] }) {
  const ids = new Set();
  const register = (entry) => {
    const plain = toPlainRecord(entry);
    const mentorId = plain?.mentorId ?? plain?.mentor?.id ?? null;
    const numeric = Number(mentorId);
    if (Number.isInteger(numeric) && numeric > 0) {
      ids.add(numeric);
    }
  };

  sessions.forEach(register);
  purchases.forEach(register);
  preferences.forEach(register);

  return Array.from(ids);
}

function registerMentorLabel(record, mentorLabels) {
  const plain = toPlainRecord(record);
  const mentor = plain?.mentor ?? {};
  const mentorId = plain?.mentorId ?? mentor?.id ?? null;
  const mentorEmail = plain?.mentorEmail ?? mentor?.email ?? null;
  const mentorName = plain?.mentorName ?? [mentor?.firstName, mentor?.lastName].filter(Boolean).join(' ').trim();

  if (mentorId != null && Number.isInteger(Number(mentorId))) {
    const key = `id:${Number(mentorId)}`;
    mentorLabels.set(key, mentorName || mentorEmail || `Mentor ${mentorId}`);
    return key;
  }
  if (mentorEmail) {
    const key = `email:${mentorEmail.toLowerCase()}`;
    mentorLabels.set(key, mentorName || mentorEmail);
    return key;
  }
  if (mentorName) {
    const key = `name:${mentorName.toLowerCase()}`;
    mentorLabels.set(key, mentorName);
    return key;
  }
  return null;
}

function resolveMentorDisplay(record, mentorLabels, mentorKey) {
  if (mentorKey && mentorLabels.has(mentorKey)) {
    return mentorLabels.get(mentorKey);
  }
  const plain = toPlainRecord(record);
  const mentor = plain?.mentor ?? {};
  const name = plain?.mentorName ?? [mentor?.firstName, mentor?.lastName].filter(Boolean).join(' ').trim();
  if (name) {
    return name;
  }
  return plain?.mentorEmail ?? mentor?.email ?? null;
}

function truncateText(value, maxLength = 160) {
  if (!value) {
    return null;
  }
  const text = `${value}`.trim();
  if (!text) {
    return null;
  }
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildMentorshipSummary({ sessions, purchases, preferences, reviews, lookbackDays }) {
  const sessionRecords = Array.isArray(sessions) ? sessions.map(toPlainRecord) : [];
  const purchaseRecords = Array.isArray(purchases) ? purchases.map(toPlainRecord) : [];
  const preferenceRecords = Array.isArray(preferences) ? preferences.map(toPlainRecord) : [];
  const reviewRecords = Array.isArray(reviews) ? reviews.map(toPlainRecord) : [];

  const hasSignals =
    sessionRecords.length > 0 || purchaseRecords.length > 0 || preferenceRecords.length > 0 || reviewRecords.length > 0;
  if (!hasSignals) {
    return null;
  }

  const mentorLabels = new Map();
  const mentorPairings = new Set();
  const now = new Date();
  const upcomingSessions = [];
  let completedSessions = 0;
  let cancelledSessions = 0;

  sessionRecords.forEach((session) => {
    const mentorKey = registerMentorLabel(session, mentorLabels);
    const status = `${session.status ?? ''}`.toLowerCase();
    if (status === 'completed') {
      completedSessions += 1;
    } else if (status === 'cancelled' || status === 'no_show') {
      cancelledSessions += 1;
    }

    if (mentorKey) {
      const menteeIdentifier = session.clientEmail ?? session.clientName ?? session.menteeId ?? session.clientCompany;
      if (menteeIdentifier) {
        mentorPairings.add(`${mentorKey}:${menteeIdentifier}`);
      }
    }

    const scheduledAt = session.scheduledAt ? new Date(session.scheduledAt) : null;
    if (
      scheduledAt &&
      Number.isFinite(scheduledAt.getTime()) &&
      scheduledAt >= now &&
      (status === 'scheduled' || status === 'in_progress' || !status)
    ) {
      upcomingSessions.push({ session, mentorKey, scheduledAt });
    }
  });

  purchaseRecords.forEach((purchase) => registerMentorLabel(purchase, mentorLabels));
  preferenceRecords.forEach((preference) => registerMentorLabel(preference, mentorLabels));

  const upcomingSessionsDetails = upcomingSessions
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, 6)
    .map(({ session, mentorKey }) => ({
      id: session.id,
      title: session.focusArea ?? session.topic ?? session.agenda ?? 'Mentorship session',
      startsAt: session.scheduledAt ?? null,
      mentor: resolveMentorDisplay(session, mentorLabels, mentorKey),
      client: session.clientName ?? session.clientCompany ?? session.clientEmail ?? null,
      status: session.status ?? null,
    }));

  const activePrograms = purchaseRecords.filter(
    (purchase) => `${purchase.status ?? ''}`.toLowerCase() === 'active',
  ).length;
  const mentorPool = mentorLabels.size;

  const sessionsIncluded = purchaseRecords.reduce(
    (total, purchase) => total + Number(purchase.sessionsIncluded ?? purchase.sessions ?? purchase.sessionsPurchased ?? 0),
    0,
  );
  const sessionsUsed = purchaseRecords.reduce(
    (total, purchase) => total + Number(purchase.sessionsUsed ?? purchase.sessionsRedeemed ?? 0),
    0,
  );

  const ratingValues = reviewRecords
    .map((review) => Number(review.rating))
    .filter((value) => Number.isFinite(value) && value > 0);
  const averageRating = ratingValues.length
    ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length
    : null;
  const satisfaction = averageRating != null ? Math.min(Math.max(averageRating / 5, 0), 1) : null;

  let promoters = 0;
  let detractors = 0;
  ratingValues.forEach((value) => {
    if (value >= 4) {
      promoters += 1;
    } else if (value <= 2) {
      detractors += 1;
    }
  });
  const nps = ratingValues.length ? Math.round(((promoters - detractors) / ratingValues.length) * 100) : null;

  const highlights = [];
  if (activePrograms) {
    highlights.push(`${activePrograms} active mentorship ${activePrograms === 1 ? 'program' : 'programs'}.`);
  }
  if (mentorPool) {
    highlights.push(`${mentorPool} mentors engaged across current programmes.`);
  }
  if (completedSessions) {
    highlights.push(`${completedSessions} sessions completed in the last ${lookbackDays} days.`);
  }
  if (averageRating != null) {
    highlights.push(
      `Average rating ${averageRating.toFixed(1)}/5 (${Math.round((satisfaction ?? 0) * 100)}% satisfaction).`,
    );
  }
  if (nps != null) {
    highlights.push(`Mentor NPS ${nps >= 0 ? '+' : ''}${nps}.`);
  }
  if (!highlights.length && upcomingSessionsDetails.length) {
    highlights.push('Upcoming mentorship sessions are scheduled and ready to run.');
  }

  const recentWins = reviewRecords
    .filter((review) => review.headline || review.feedback)
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.createdAt ?? 0).getTime() - new Date(a.publishedAt ?? a.createdAt ?? 0).getTime(),
    )
    .slice(0, 4)
    .map((review) => review.headline ?? truncateText(review.feedback));

  return {
    activePrograms,
    activePairings: mentorPairings.size || upcomingSessions.length,
    mentorPool,
    upcomingSessions: upcomingSessions.length,
    upcomingSessionsDetails,
    sessions: {
      total: sessionRecords.length,
      completed: completedSessions,
      cancelled: cancelledSessions,
      upcoming: upcomingSessions.length,
    },
    satisfaction,
    averageRating,
    nps,
    highlights,
    recentWins,
    calendar: {
      upcomingCount: upcomingSessions.length,
      upcoming: upcomingSessionsDetails,
    },
    usage: {
      sessionsIncluded: sessionsIncluded || null,
      sessionsUsed: sessionsUsed || completedSessions || null,
    },
    lookbackDays,
  };
}

function enrichCreationStudioOverview(overview) {
  if (!overview) {
    return null;
  }
  const plainItems = Array.isArray(overview.items) ? overview.items.map(toPlainRecord) : [];
  const previewItems = plainItems
    .slice()
    .sort((a, b) => new Date(b.updatedAt ?? b.publishedAt ?? 0) - new Date(a.updatedAt ?? a.publishedAt ?? 0))
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      updatedAt: item.updatedAt ?? item.publishedAt ?? null,
      summary: item.summary ?? null,
      typeLabel: item.type,
    }));

  const mentorshipAssets = plainItems.filter((item) => item.type === 'mentorship_offering');

  return {
    ...overview,
    items: plainItems,
    previewItems,
    mentorshipAssets,
  };
}

function buildHeadhunterDashboardSummary({
  jobs,
  partnerApplications,
  interviewSchedules,
  commissions,
  applicantDirectory,
}) {
  const jobRecords = jobs.map((job) => (job?.get ? job.get({ plain: true }) : job));
  const interviewRecords = interviewSchedules.map((schedule) => (schedule?.get ? schedule.get({ plain: true }) : schedule));

  const applicationMap = new Map();
  const applicationByTarget = new Map();

  partnerApplications.forEach((application) => {
    applicationMap.set(application.id, application);
    const key = `${application.targetType}:${application.targetId}`;
    const entry = applicationByTarget.get(key) ?? {
      submissions: 0,
      hires: 0,
      partners: new Set(),
      latestSubmission: null,
    };
    entry.submissions += 1;
    if (application.status === 'hired') {
      entry.hires += 1;
    }
    const { partnerName } = extractPartnerInfo(application.metadata, {
      fallbackName: 'Agency partner',
      fallbackType: application.sourceChannel,
    });
    entry.partners.add(partnerName);
    const submittedAt = toDate(application.submittedAt ?? application.createdAt);
    if (submittedAt && (!entry.latestSubmission || submittedAt > entry.latestSubmission)) {
      entry.latestSubmission = submittedAt;
    }
    applicationByTarget.set(key, entry);
  });

  const jobBriefs = jobRecords
    .map((job) => {
      const summary = applicationByTarget.get(`job:${job.id}`) ?? {
        submissions: 0,
        hires: 0,
        partners: new Set(),
        latestSubmission: null,
      };
      return {
        id: job.id,
        title: job.title,
        location: job.location ?? 'Remote',
        submissions: summary.submissions,
        hires: summary.hires,
        partners: Array.from(summary.partners),
        lastSubmissionAt: summary.latestSubmission ? summary.latestSubmission.toISOString() : null,
        createdAt: job.createdAt,
      };
    })
    .filter((brief) => brief.submissions > 0 || differenceInDays(brief.createdAt) <= 45)
    .sort((a, b) => (b.submissions ?? 0) - (a.submissions ?? 0))
    .slice(0, 8);

  const candidateSubmissions = partnerApplications
    .map((application) => {
      const metadata = normaliseMetadata(application.metadata);
      const { partnerName, partnerType } = extractPartnerInfo(metadata, {
        fallbackName: 'Agency partner',
        fallbackType: application.sourceChannel,
      });
      const applicant = applicantDirectory.get(application.applicantId) ?? {};
      const candidateName =
        [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') ||
        applicant.email ||
        `Candidate ${application.applicantId}`;
      return {
        applicationId: application.id,
        candidateId: application.applicantId,
        candidateName,
        partnerName,
        partnerType,
        status: application.status,
        stage: metadata.stage ?? application.status,
        submittedAt: application.submittedAt ?? application.createdAt,
        rateExpectation: application.rateExpectation == null ? null : Number(application.rateExpectation),
      };
    })
    .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0))
    .slice(0, 12);

  const interviews = interviewRecords
    .filter((schedule) => applicationMap.has(schedule.applicationId))
    .map((schedule) => {
      const application = applicationMap.get(schedule.applicationId);
      const metadata = normaliseMetadata(schedule.metadata);
      const applicant = applicantDirectory.get(application.applicantId) ?? {};
      const candidateName =
        [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') ||
        applicant.email ||
        `Candidate ${application.applicantId}`;
      return {
        interviewId: schedule.id,
        applicationId: schedule.applicationId,
        stage: schedule.interviewStage,
        scheduledAt: schedule.scheduledAt,
        durationMinutes: schedule.durationMinutes,
        interviewerRoster: Array.isArray(schedule.interviewerRoster) ? schedule.interviewerRoster : [],
        candidateName,
        partnerName: extractPartnerInfo(application.metadata, {
          fallbackName: 'Agency partner',
          fallbackType: application.sourceChannel,
        }).partnerName,
        status: schedule.completedAt ? 'completed' : 'scheduled',
        rescheduleCount: schedule.rescheduleCount ?? 0,
        location: metadata.location ?? metadata.videoUrl ?? null,
      };
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const commissionEntries = commissions.map((commission) => {
    const plain = commission?.get ? commission.get({ plain: true }) : commission;
    const { partnerName, partnerType } = extractPartnerInfo(plain.metadata, {
      fallbackName: plain.partnerName,
      fallbackType: plain.partnerType,
    });
    return {
      id: plain.id,
      partnerName,
      partnerType,
      status: plain.status,
      dueDate: plain.dueDate,
      paidAt: plain.paidAt,
      invoiceNumber: plain.invoiceNumber ?? null,
      amountCents: plain.commissionAmountCents ?? 0,
      amount: centsToAmount(plain.commissionAmountCents ?? 0),
      currencyCode: plain.currencyCode ?? 'USD',
    };
  });

  const scorecards = candidateSubmissions
    .map((submission) => {
      const application = applicationMap.get(submission.applicationId);
      const metadata = normaliseMetadata(application?.metadata);
      if (!metadata.scorecardUrl && !metadata.scorecardId) {
        return null;
      }
      return {
        applicationId: submission.applicationId,
        candidateName: submission.candidateName,
        partnerName: submission.partnerName,
        scorecardId: metadata.scorecardId ?? null,
        scorecardUrl: metadata.scorecardUrl ?? null,
        updatedAt: application.updatedAt ?? application.createdAt,
        summary: metadata.scorecardSummary ?? null,
      };
    })
    .filter(Boolean)
    .slice(0, 8);

  const openBriefs = jobBriefs.length;
  const activeSubmissions = partnerApplications.filter(
    (application) => !['hired', 'rejected', 'withdrawn'].includes(application.status),
  ).length;
  const upcomingInterviews = interviews.filter((interview) => {
    const scheduled = toDate(interview.scheduledAt);
    return scheduled && scheduled > new Date();
  }).length;
  const commissionsDue = commissionEntries.filter((entry) => entry.status !== 'paid').length;
  const totalCommissionValue = centsToAmount(sumNumbers(commissionEntries.map((entry) => entry.amountCents)));
  const offersCount = partnerApplications.filter((application) =>
    ['offered', 'hired'].includes(application.status),
  ).length;
  const hiresCount = partnerApplications.filter((application) => application.status === 'hired').length;
  const fillRate = percentage(hiresCount, offersCount || partnerApplications.length || 1);

  return {
    stats: {
      openBriefs,
      activeSubmissions,
      interviewsScheduled: upcomingInterviews,
      commissionsDue,
      totalCommissionValue,
      fillRate,
    },
    jobBriefs,
    submissions: candidateSubmissions,
    interviews: interviews.slice(0, 12),
    commissions: commissionEntries.slice(0, 12),
    scorecards,
  };
}

function buildPartnerPerformanceManagerSummary({
  engagements,
  commissions,
  slaSnapshots,
  agreements,
  partnerApplications,
}) {
  const engagementRecords = engagements.map((engagement) => (engagement?.get ? engagement.get({ plain: true }) : engagement));
  const commissionRecords = commissions.map((commission) => (commission?.get ? commission.get({ plain: true }) : commission));
  const slaRecords = slaSnapshots.map((snapshot) => (snapshot?.get ? snapshot.get({ plain: true }) : snapshot));
  const agreementRecords = agreements.map((agreement) => (agreement?.get ? agreement.get({ plain: true }) : agreement));

  const keyFor = (partnerType, partnerName) => `${partnerType}:${partnerName}`;
  const volumeByPartner = new Map();

  partnerApplications.forEach((application) => {
    const metadata = normaliseMetadata(application.metadata);
    const { partnerName, partnerType } = extractPartnerInfo(metadata, {
      fallbackName: 'Agency partner',
      fallbackType: application.sourceChannel,
    });
    const key = keyFor(partnerType, partnerName);
    const entry = volumeByPartner.get(key) ?? {
      partnerName,
      partnerType,
      submissions: 0,
      hires: 0,
      offers: 0,
      revenueCents: 0,
    };
    entry.submissions += 1;
    if (application.status === 'hired') {
      entry.hires += 1;
    }
    if (application.status === 'offered' || application.status === 'hired') {
      entry.offers += 1;
    }
    entry.revenueCents += toCents(application.rateExpectation);
    volumeByPartner.set(key, entry);
  });

  const commissionByPartner = new Map();
  commissionRecords.forEach((record) => {
    const key = keyFor(record.partnerType, record.partnerName);
    commissionByPartner.set(key, (commissionByPartner.get(key) ?? 0) + (record.commissionAmountCents ?? 0));
  });

  const slaByPartner = new Map();
  slaRecords.forEach((record) => {
    const key = keyFor(record.partnerType, record.partnerName);
    const existing = slaByPartner.get(key) ?? [];
    existing.push(record);
    slaByPartner.set(key, existing);
  });

  const leaderboardKeys = new Set([
    ...engagementRecords.map((record) => keyFor(record.partnerType, record.partnerName)),
    ...volumeByPartner.keys(),
  ]);

  const leaderboard = Array.from(leaderboardKeys)
    .map((key) => {
      const [partnerType, partnerName] = key.split(':');
      const engagement = engagementRecords.find(
        (record) => keyFor(record.partnerType, record.partnerName) === key,
      ) ?? { touchpoints: 0, activeBriefs: 0, conversionRate: null };
      const volume = volumeByPartner.get(key) ?? {
        submissions: 0,
        hires: 0,
        offers: 0,
        revenueCents: 0,
      };
      const slaList = slaByPartner.get(key) ?? [];
      const latestSla = slaList[0] ?? null;
      const commissionLiabilityCents = commissionByPartner.get(key) ?? 0;

      const conversionRate = volume.submissions
        ? Number(((volume.hires / volume.submissions) * 100).toFixed(1))
        : engagement.conversionRate == null
        ? null
        : Number(engagement.conversionRate);

      const fillRate = volume.offers
        ? Number(((volume.hires / volume.offers) * 100).toFixed(1))
        : latestSla?.fillRate == null
        ? null
        : Number(latestSla.fillRate);

      return {
        name: partnerName,
        type: partnerType,
        touchpoints: engagement.touchpoints ?? volume.submissions ?? 0,
        activeBriefs: engagement.activeBriefs ?? 0,
        conversionRate,
        fillRate,
        submissionToInterviewHours:
          latestSla?.submissionToInterviewHours == null
            ? null
            : Number(Number(latestSla.submissionToInterviewHours).toFixed(1)),
        interviewToOfferHours:
          latestSla?.interviewToOfferHours == null
            ? null
            : Number(Number(latestSla.interviewToOfferHours).toFixed(1)),
        revenueContribution: centsToAmount(volume.revenueCents),
        commissionLiability: centsToAmount(commissionLiabilityCents),
      };
    })
    .sort((a, b) => b.revenueContribution - a.revenueContribution);

  const submissionToInterview = slaRecords
    .map((record) => Number(record.submissionToInterviewHours))
    .filter((value) => Number.isFinite(value));
  const interviewToOffer = slaRecords
    .map((record) => Number(record.interviewToOfferHours))
    .filter((value) => Number.isFinite(value));
  const fillRates = slaRecords
    .map((record) => Number(record.fillRate))
    .filter((value) => Number.isFinite(value));
  const complianceScores = slaRecords
    .map((record) => Number(record.complianceScore))
    .filter((value) => Number.isFinite(value));

  const totalCommissionCents = sumNumbers(commissionRecords.map((record) => record.commissionAmountCents));
  const totalRevenueCents = sumNumbers(Array.from(volumeByPartner.values()).map((entry) => entry.revenueCents));
  const roiPercentage =
    totalCommissionCents > 0
      ? Number((((totalRevenueCents - totalCommissionCents) / totalCommissionCents) * 100).toFixed(1))
      : null;

  const invoiceStatusCounts = commissionRecords.reduce((acc, record) => {
    const status = record.status ?? 'draft';
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const renewalThreshold = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const renewals = agreementRecords
    .filter((record) => {
      const renewalDate = toDate(record.renewalDate);
      return (
        record.status === 'pending_renewal' ||
        (renewalDate && renewalDate >= new Date() && renewalDate <= renewalThreshold)
      );
    })
    .slice(0, 10)
    .map((record) => ({
      id: record.id,
      partnerName: record.partnerName,
      partnerType: record.partnerType,
      renewalDate: record.renewalDate,
      complianceStatus: record.complianceStatus,
    }));

  const terminated = agreementRecords
    .filter((record) => record.status === 'terminated' || record.status === 'suspended')
    .slice(0, 5)
    .map((record) => ({
      id: record.id,
      partnerName: record.partnerName,
      partnerType: record.partnerType,
      status: record.status,
      terminatedAt: record.endDate ?? record.updatedAt ?? null,
    }));

  return {
    leaderboard: leaderboard.slice(0, 10),
    sla: {
      averages: {
        submissionToInterviewHours: submissionToInterview.length ? Number(average(submissionToInterview)) : null,
        interviewToOfferHours: interviewToOffer.length ? Number(average(interviewToOffer)) : null,
        fillRate: fillRates.length ? Number(average(fillRates)) : null,
        complianceScore: complianceScores.length ? Number(average(complianceScores)) : null,
      },
      snapshots: slaRecords.slice(0, 8).map((record) => ({
        partnerName: record.partnerName,
        partnerType: record.partnerType,
        reportingPeriodStart: record.reportingPeriodStart,
        reportingPeriodEnd: record.reportingPeriodEnd,
        submissionToInterviewHours:
          record.submissionToInterviewHours == null ? null : Number(record.submissionToInterviewHours),
        interviewToOfferHours:
          record.interviewToOfferHours == null ? null : Number(record.interviewToOfferHours),
        fillRate: record.fillRate == null ? null : Number(record.fillRate),
        complianceScore: record.complianceScore == null ? null : Number(record.complianceScore),
        escalations: record.escalations ?? 0,
      })),
    },
    roi: {
      totalCommission: centsToAmount(totalCommissionCents),
      totalRevenue: centsToAmount(totalRevenueCents),
      roiPercentage,
      invoiceStatusCounts,
    },
    agreements: {
      total: agreementRecords.length,
      active: agreementRecords.filter((record) => record.status === 'active').length,
      renewals,
      terminated,
    },
  };
}

function buildCollaborationSuiteSummary({ partnerThreads, collaborationEvents, notes }) {
  const threadRecords = partnerThreads.map((thread) => (thread?.get ? thread.get({ plain: true }) : thread));
  const eventRecords = collaborationEvents.map((event) => (event?.get ? event.get({ plain: true }) : event));
  const noteRecords = notes.map((note) => (note?.get ? note.get({ plain: true }) : note));

  const threads = threadRecords.map((thread) => {
    const messages = [...(thread.messages ?? [])]
      .map((message) => (message?.get ? message.get({ plain: true }) : message))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const lastMessage = messages.at(-1) ?? null;
    const inboundReplies = messages.filter(
      (message) => normaliseMetadata(message.metadata).direction === 'inbound',
    ).length;
    const awaitingResponse =
      lastMessage && normaliseMetadata(lastMessage.metadata).direction === 'outbound' && !lastMessage.deliveredAt;
    return {
      threadId: thread.id,
      subject: thread.subject ?? 'Partner collaboration',
      channel: thread.channelType ?? 'direct',
      lastMessageAt: thread.lastMessageAt ?? lastMessage?.createdAt ?? null,
      totalMessages: messages.length,
      inboundReplies,
      awaitingResponse: Boolean(awaitingResponse),
    };
  });

  const messageCount = sumNumbers(threads.map((thread) => thread.totalMessages));
  const awaitingResponses = threads.filter((thread) => thread.awaitingResponse).length;
  const filesShared = eventRecords.filter((event) => event.eventType === 'file').length;
  const decisionThreads = eventRecords.filter((event) => event.eventType === 'decision').length;
  const escalationsOpen = eventRecords.filter((event) => {
    if (event.eventType !== 'escalation') {
      return false;
    }
    const metadata = normaliseMetadata(event.metadata);
    return !metadata.resolvedAt;
  }).length;

  const latestActivity = eventRecords
    .slice()
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 10)
    .map((event) => ({
      id: event.id,
      partnerName: event.partnerName,
      partnerType: event.partnerType,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      actorName: event.actorName ?? null,
      summary: normaliseMetadata(event.metadata).summary ?? null,
    }));

  const scorecards = eventRecords
    .filter((event) => event.eventType === 'scorecard')
    .slice(0, 8)
    .map((event) => {
      const metadata = normaliseMetadata(event.metadata);
      return {
        id: event.id,
        partnerName: event.partnerName,
        candidateName: metadata.candidateName ?? metadata.candidateEmail ?? null,
        scorecardUrl: metadata.url ?? metadata.link ?? null,
        status: metadata.status ?? 'shared',
        sharedAt: event.occurredAt,
      };
    });

  const noteHighlights = noteRecords.slice(0, 6).map((note) => {
    const authorName = [note.author?.firstName, note.author?.lastName].filter(Boolean).join(' ');
    const subjectName = [note.subject?.firstName, note.subject?.lastName].filter(Boolean).join(' ');
    return {
      id: note.id,
      note: note.note,
      authorName: authorName || 'Unknown author',
      subjectName: subjectName || 'Partner contact',
      createdAt: note.createdAt,
      visibility: note.visibility,
    };
  });

  return {
    activeThreads: threadRecords.length,
    messageCount,
    awaitingResponses,
    filesShared,
    decisionThreads,
    escalationsOpen,
    latestActivity,
    threads: threads.slice(0, 10),
    scorecards,
    notes: noteHighlights,
  };
}

function buildPartnerCalendarCommunicationsSummary({
  calendarEvents,
  interviewSchedules,
  collaborationEvents,
  partnerApplications,
  commissions,
}) {
  const calendarRecords = calendarEvents.map((event) => (event?.get ? event.get({ plain: true }) : event));
  const interviewRecords = interviewSchedules.map((schedule) => (schedule?.get ? schedule.get({ plain: true }) : schedule));
  const eventRecords = collaborationEvents.map((event) => (event?.get ? event.get({ plain: true }) : event));
  const partnerApplicationIds = new Set(partnerApplications.map((application) => application.id));

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcoming = calendarRecords
    .filter((event) => {
      const start = toDate(event.startsAt);
      return start && start >= now;
    })
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .slice(0, 8);

  const eventsThisWeek = calendarRecords.filter((event) => {
    const start = toDate(event.startsAt);
    return start && start >= now && start <= weekAhead;
  });

  const loadByDay = new Map();
  interviewRecords
    .filter((schedule) => partnerApplicationIds.has(schedule.applicationId))
    .forEach((schedule) => {
      const start = toDate(schedule.scheduledAt);
      if (!start) {
        return;
      }
      const key = start.toISOString().slice(0, 10);
      const entry = loadByDay.get(key) ?? { date: key, interviews: 0, escalations: 0 };
      entry.interviews += 1;
      loadByDay.set(key, entry);
    });

  const escalationEvents = eventRecords.filter((event) => event.eventType === 'escalation');
  escalationEvents.forEach((event) => {
    const occurred = toDate(event.occurredAt);
    if (!occurred) {
      return;
    }
    const key = occurred.toISOString().slice(0, 10);
    const entry = loadByDay.get(key) ?? { date: key, interviews: 0, escalations: 0 };
    entry.escalations += 1;
    loadByDay.set(key, entry);
  });

  const interviewLoad = Array.from(loadByDay.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7);

  const integrationSources = new Set(
    eventRecords
      .map((event) => normaliseMetadata(event.metadata).integration)
      .filter((value) => value && `${value}`.trim().length)
      .map((value) => `${value}`.toLowerCase()),
  );

  const integrationStatus = {
    hris: integrationSources.has('hris'),
    slack: integrationSources.has('slack'),
    email: integrationSources.has('email') || integrationSources.has('outlook') || integrationSources.has('gmail'),
    gigvoraMessaging: true,
  };

  const commissionsDueSoon = commissions
    .map((commission) => (commission?.get ? commission.get({ plain: true }) : commission))
    .filter((record) => {
      if (record.status === 'paid') {
        return false;
      }
      const dueDate = toDate(record.dueDate);
      if (!dueDate) {
        return false;
      }
      const days = differenceInDays(dueDate, now);
      return days != null && days >= 0 && days <= 7;
    }).length;

  const pendingEscalations = escalationEvents.filter((event) => !normaliseMetadata(event.metadata).resolvedAt).length;

  const weeklyDigest = {
    nextSendAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    highlights: [
      `Partner interviews scheduled this week: ${interviewRecords.filter((schedule) => partnerApplicationIds.has(schedule.applicationId)).length}`,
      `Upcoming recruiting events this week: ${eventsThisWeek.length}`,
      `Open partner escalations: ${pendingEscalations}`,
      `Commissions due within 7 days: ${commissionsDueSoon}`,
    ],
  };

  return {
    eventsThisWeek: eventsThisWeek.length,
    upcoming,
    interviewLoad,
    integrations: integrationStatus,
    pendingEscalations,
    weeklyDigest,
  };
}

function buildPartnerCollaborationSummary({
  partnerSummary,
  engagements,
  partnerApplications,
  jobs,
  interviewSchedules,
  commissions,
  slaSnapshots,
  agreements,
  collaborationEvents,
  partnerThreads,
  notes,
  applicantDirectory,
  calendarEvents,
}) {
  const headhunterDashboard = buildHeadhunterDashboardSummary({
    jobs,
    partnerApplications,
    interviewSchedules,
    commissions,
    applicantDirectory,
  });

  const partnerPerformanceManager = buildPartnerPerformanceManagerSummary({
    engagements,
    commissions,
    slaSnapshots,
    agreements,
    partnerApplications,
  });

  const collaborationSuite = buildCollaborationSuiteSummary({
    partnerThreads,
    collaborationEvents,
    notes,
  });

  const calendarCommunications = buildPartnerCalendarCommunicationsSummary({
    calendarEvents,
    interviewSchedules,
    collaborationEvents,
    partnerApplications,
    commissions,
  });

  return {
    overview: {
      engagedContacts: partnerSummary?.engagedContacts ?? 0,
      touchpoints: partnerSummary?.touchpoints ?? 0,
      pendingInvites: partnerSummary?.pendingInvites ?? 0,
      activePartners: partnerPerformanceManager.leaderboard.length,
      totalCommissionLiability: partnerPerformanceManager.roi.totalCommission ?? 0,
    },
    headhunterDashboard,
    partnerPerformanceManager,
    collaborationSuite,
    calendarCommunications,
  };
}

function buildHeadhunterProgramSummary({ invites, briefs, assignments, performanceSnapshots, commissions, lookbackDays }) {
  const inviteRecords = (invites ?? []).map(toPlain);
  const briefRecords = (briefs ?? []).map((brief) => (brief?.toPublicObject ? brief.toPublicObject() : toPlain(brief)));
  const assignmentRecords = (assignments ?? []).map((assignment) =>
    assignment?.toPublicObject ? assignment.toPublicObject() : toPlain(assignment),
  );
  const performanceRecords = (performanceSnapshots ?? []).map((snapshot) =>
    snapshot?.toPublicObject ? snapshot.toPublicObject() : toPlain(snapshot),
  );
  const commissionRecords = (commissions ?? []).map((commission) =>
    commission?.toPublicObject ? commission.toPublicObject() : toPlain(commission),
  );

  const inviteSummary = {
    total: inviteRecords.length,
    accepted: 0,
    pending: 0,
    declined: 0,
    expired: 0,
    acceptanceRate: 0,
    medianResponseHours: null,
    lastInviteAt: null,
  };

  const inviteResponseHours = [];

  inviteRecords.forEach((invite) => {
    if (invite.status === 'accepted') {
      inviteSummary.accepted += 1;
    } else if (invite.status === 'pending') {
      inviteSummary.pending += 1;
    } else if (invite.status === 'declined') {
      inviteSummary.declined += 1;
    } else if (invite.status === 'expired' || invite.status === 'revoked') {
      inviteSummary.expired += 1;
    }

    const response = differenceInHours(invite.sentAt, invite.respondedAt);
    if (Number.isFinite(response)) {
      inviteResponseHours.push(response);
    }

    if (!inviteSummary.lastInviteAt || new Date(invite.sentAt) > new Date(inviteSummary.lastInviteAt)) {
      inviteSummary.lastInviteAt = invite.sentAt;
    }
  });

  inviteSummary.acceptanceRate = inviteSummary.total
    ? Number(((inviteSummary.accepted / inviteSummary.total) * 100).toFixed(1))
    : 0;
  inviteSummary.medianResponseHours = inviteResponseHours.length ? median(inviteResponseHours) : null;

  const assignmentByBrief = new Map();
  assignmentRecords.forEach((assignment) => {
    const list = assignmentByBrief.get(assignment.briefId) ?? [];
    list.push(assignment);
    assignmentByBrief.set(assignment.briefId, list);
  });

  const briefFeeValues = [];
  const briefAgingDays = [];
  const activeStatuses = new Set(['shared', 'in_progress']);
  const pipeline = [];

  briefRecords.forEach((brief) => {
    const numericFee = safeNumber(brief.feePercentage);
    if (Number.isFinite(numericFee)) {
      briefFeeValues.push(numericFee);
    }

    if (brief.sharedAt && activeStatuses.has(brief.status)) {
      const age = differenceInDays(brief.sharedAt);
      if (Number.isFinite(age)) {
        briefAgingDays.push(age);
      }
    }

    if (activeStatuses.has(brief.status)) {
      const relatedAssignments = assignmentByBrief.get(brief.id) ?? [];
      const headhunterNames = new Set();
      let submissions = 0;
      let placements = 0;

      relatedAssignments.forEach((assignment) => {
        submissions += Number(assignment.submittedCandidates ?? 0);
        placements += Number(assignment.placements ?? 0);
        if (assignment.headhunterWorkspace?.name) {
          headhunterNames.add(assignment.headhunterWorkspace.name);
        }
      });

      pipeline.push({
        id: brief.id,
        title: brief.title,
        status: brief.status,
        openings: Number(brief.openings ?? 0),
        headhunters: Array.from(headhunterNames),
        submissions,
        placements,
        dueAt: brief.dueAt,
      });
    }
  });

  const assignmentResponseTimes = assignmentRecords
    .map((assignment) => safeNumber(assignment.responseTimeHours))
    .filter((value) => Number.isFinite(value));

  const assignmentsSummary = {
    totalAssignments: assignmentRecords.length,
    submittedCandidates: sumBy(assignmentRecords, (assignment) => Number(assignment.submittedCandidates ?? 0)),
    placements: sumBy(assignmentRecords, (assignment) => Number(assignment.placements ?? 0)),
    averageResponseHours: assignmentResponseTimes.length ? Number(average(assignmentResponseTimes)) : null,
  };

  const totalOpenings = sumBy(briefRecords, (brief) => safeNumber(brief.openings) ?? 0);
  assignmentsSummary.fillRate = totalOpenings
    ? percentage(assignmentsSummary.placements, totalOpenings)
    : percentage(assignmentsSummary.placements, assignmentsSummary.submittedCandidates || 1);

  const performanceLeaderboard = performanceRecords
    .map((record) => ({
      id: record.id,
      headhunterWorkspaceId: record.headhunterWorkspaceId,
      name: record.headhunterName ?? record.headhunterWorkspace?.name ?? 'Partner',
      placements: Number(record.placements ?? 0),
      interviews: Number(record.interviews ?? 0),
      responseRate: safeNumber(record.responseRate),
      averageTimeToSubmitHours: safeNumber(record.averageTimeToSubmitHours),
      qualityScore: safeNumber(record.qualityScore),
      activeBriefs: Number(record.activeBriefs ?? 0),
      lastSubmissionAt: record.lastSubmissionAt,
    }))
    .sort((a, b) => b.placements - a.placements || (b.responseRate ?? 0) - (a.responseRate ?? 0))
    .slice(0, 8);

  const averageResponseRate = average(
    performanceLeaderboard
      .map((entry) => entry.responseRate)
      .filter((value) => Number.isFinite(value)),
  );
  const averageQualityScore = average(
    performanceLeaderboard
      .map((entry) => entry.qualityScore)
      .filter((value) => Number.isFinite(value)),
  );

  const normalizedQuality = averageQualityScore != null ? (averageQualityScore / 5) * 100 : null;
  const healthScore = (() => {
    if (averageResponseRate == null && normalizedQuality == null) {
      return null;
    }
    const responseComponent = averageResponseRate != null ? averageResponseRate * 0.6 : 0;
    const qualityComponent = normalizedQuality != null ? normalizedQuality * 0.4 : 0;
    return Number((responseComponent + qualityComponent).toFixed(1));
  })();

  const outstandingStatuses = new Set(['pending', 'invoiced', 'overdue']);
  const outstandingCommissions = commissionRecords.filter((commission) => outstandingStatuses.has(commission.status));
  const dueSoonThreshold = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const dueSoonCommissions = outstandingCommissions.filter((commission) => {
    if (!commission.dueAt) return false;
    const dueDate = new Date(commission.dueAt);
    return dueDate <= dueSoonThreshold && dueDate >= new Date();
  });
  const quarterStart = startOfQuarter();
  const paidThisQuarter = commissionRecords.filter(
    (commission) => commission.status === 'paid' && commission.paidAt && new Date(commission.paidAt) >= quarterStart,
  );

  const commissionCurrency =
    outstandingCommissions.find((commission) => commission.currency)?.currency || commissionRecords[0]?.currency || 'USD';

  const commissionsSummary = {
    outstandingCount: outstandingCommissions.length,
    outstandingAmount: Number(
      sumBy(outstandingCommissions, (commission) => safeNumber(commission.amount) ?? 0).toFixed(2),
    ),
    dueSoon: {
      count: dueSoonCommissions.length,
      amount: Number(sumBy(dueSoonCommissions, (commission) => safeNumber(commission.amount) ?? 0).toFixed(2)),
    },
    paidThisQuarter: {
      count: paidThisQuarter.length,
      amount: Number(sumBy(paidThisQuarter, (commission) => safeNumber(commission.amount) ?? 0).toFixed(2)),
    },
    currency: commissionCurrency,
    upcoming: outstandingCommissions
      .slice()
      .sort((a, b) => {
        const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
        return aDue - bDue;
      })
      .slice(0, 6)
      .map((commission) => ({
        headhunter: commission.headhunterName ?? commission.headhunterWorkspace?.name ?? 'Partner',
        candidate: commission.candidateName,
        amount: safeNumber(commission.amount),
        currency: commission.currency ?? commissionCurrency,
        status: commission.status,
        dueAt: commission.dueAt,
      })),
  };

  const lookbackMillis = Number.isFinite(lookbackDays)
    ? lookbackDays * 24 * 60 * 60 * 1000
    : null;
  const lookbackStart = lookbackMillis ? new Date(Date.now() - lookbackMillis) : null;
  const briefsSharedInWindow = lookbackStart
    ? briefRecords.filter((brief) => brief.sharedAt && new Date(brief.sharedAt) >= lookbackStart).length
    : null;

  return {
    invites: inviteSummary,
    briefs: {
      total: briefRecords.length,
      active: briefRecords.filter((brief) => activeStatuses.has(brief.status)).length,
      sharedThisWindow: briefsSharedInWindow,
      averageFeePercentage: briefFeeValues.length ? Number(average(briefFeeValues)) : null,
      averageAgeDays: briefAgingDays.length ? Number(average(briefAgingDays)) : null,
      pipeline: pipeline
        .sort((a, b) => {
          if (!a.dueAt && !b.dueAt) return 0;
          if (!a.dueAt) return 1;
          if (!b.dueAt) return -1;
          return new Date(a.dueAt) - new Date(b.dueAt);
        })
        .slice(0, 8),
    },
    assignments: assignmentsSummary,
    performance: {
      leaderboard: performanceLeaderboard,
      averageResponseRate,
      averageQualityScore,
      healthScore,
      totalPlacements: sumBy(performanceRecords, (record) => Number(record.placements ?? 0)),
    },
    commissions: commissionsSummary,
  };
}

function buildTalentPoolSummary({ pools, members, engagements, lookbackDays }) {
  const poolRecords = (pools ?? []).map((pool) => (pool?.get ? pool.get({ plain: true }) : pool));
  const memberRecords = (members ?? []).map(toPlain);
  const engagementRecords = (engagements ?? []).map(toPlain);

  const poolsById = new Map(poolRecords.map((pool) => [pool.id, pool]));
  const activePoolCount = poolRecords.filter((pool) => pool.status === 'active').length;
  const pausedPoolCount = poolRecords.filter((pool) => pool.status === 'paused').length;
  const archivedPoolCount = poolRecords.filter((pool) => pool.status === 'archived').length;

  const activeCandidateStatuses = new Set(['active', 'engaged', 'interview', 'offered']);
  const totalCandidates = memberRecords.length;
  const activeCandidates = memberRecords.filter((member) => activeCandidateStatuses.has(member.status)).length;
  const hiresFromPools = memberRecords.filter((member) => member.status === 'hired').length;

  const stageCounts = { outreach: 0, engaged: 0, interview: 0, offer: 0, hired: 0 };
  const stageMapping = {
    active: 'outreach',
    engaged: 'engaged',
    interview: 'interview',
    offered: 'offer',
    hired: 'hired',
  };

  const typeStats = new Map();

  poolRecords.forEach((pool) => {
    if (!typeStats.has(pool.poolType)) {
      typeStats.set(pool.poolType, {
        type: pool.poolType,
        pools: 0,
        candidates: 0,
        active: 0,
        hires: 0,
        _durations: [],
      });
    }
    typeStats.get(pool.poolType).pools += 1;
  });

  memberRecords.forEach((member) => {
    const pool = poolsById.get(member.poolId);
    const poolType = pool?.poolType ?? member.sourceType ?? 'silver_medalist';
    if (!typeStats.has(poolType)) {
      typeStats.set(poolType, {
        type: poolType,
        pools: 0,
        candidates: 0,
        active: 0,
        hires: 0,
        _durations: [],
      });
    }
    const entry = typeStats.get(poolType);
    entry.candidates += 1;
    if (activeCandidateStatuses.has(member.status)) {
      entry.active += 1;
    }
    if (member.status === 'hired') {
      entry.hires += 1;
    }
    const duration = differenceInDays(member.joinedAt);
    if (Number.isFinite(duration)) {
      entry._durations.push(duration);
    }

    const stageKey = stageMapping[member.status];
    if (stageKey) {
      stageCounts[stageKey] += 1;
    }
  });

  const typeBreakdown = Array.from(typeStats.values()).map((entry) => {
    const durations = entry._durations ?? [];
    const averageTimeInPoolDays = durations.length ? Number(average(durations)) : null;
    delete entry._durations;
    return {
      ...entry,
      averageTimeInPoolDays,
    };
  });

  const latestEngagement = engagementRecords
    .map((engagement) => engagement.occurredAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0] ?? null;

  const lookbackStart = Number.isFinite(lookbackDays)
    ? new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)
    : null;
  const engagementsInWindow = lookbackStart
    ? engagementRecords.filter((engagement) => new Date(engagement.occurredAt) >= lookbackStart)
    : engagementRecords;

  const upcomingActions = memberRecords
    .filter((member) => member.nextActionAt && new Date(member.nextActionAt) >= new Date())
    .sort((a, b) => new Date(a.nextActionAt) - new Date(b.nextActionAt))
    .slice(0, 8)
    .map((member) => {
      const pool = poolsById.get(member.poolId);
      const owner = pool?.owner;
      const ownerName = owner ? `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim() : null;
      return {
        poolName: pool?.name ?? 'Talent pool',
        candidateName: member.candidateName,
        nextActionAt: member.nextActionAt,
        status: member.status,
        ownerName: ownerName?.length ? ownerName : null,
      };
    });

  const recentEngagements = engagementRecords
    .slice()
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 8)
    .map((engagement) => ({
      poolName: engagement.pool?.name ?? poolsById.get(engagement.poolId)?.name ?? 'Talent pool',
      interactionType: engagement.interactionType,
      occurredAt: engagement.occurredAt,
      summary: engagement.summary,
      performedBy: engagement.performedBy
        ? `${engagement.performedBy.firstName ?? ''} ${engagement.performedBy.lastName ?? ''}`.trim()
        : null,
    }));

  return {
    totals: {
      pools: poolRecords.length,
      activePools: activePoolCount,
      pausedPools: pausedPoolCount,
      archivedPools: archivedPoolCount,
      totalCandidates,
      activeCandidates,
      hiresFromPools,
      engagementsInWindow: engagementsInWindow.length,
      lastEngagedAt: latestEngagement,
    },
    byType: typeBreakdown.sort((a, b) => b.candidates - a.candidates),
    pipeline: {
      stageCounts,
      conversionRate: totalCandidates ? percentage(stageCounts.hired, totalCandidates) : 0,
    },
    upcomingActions,
    recentEngagements,
  };
}

function buildAgencyCollaborationInsights({
  collaborations,
  invitations,
  rateCards,
  slaSnapshots,
  billingEvents,
}) {
  const collaborationRecords = (collaborations ?? []).map((collaboration) =>
    collaboration?.toPublicObject ? collaboration.toPublicObject() : toPlain(collaboration),
  );
  const invitationRecords = (invitations ?? []).map(toPlain);
  const rateCardRecords = (rateCards ?? []).map((card) => (card?.toPublicObject ? card.toPublicObject() : toPlain(card)));
  const slaRecords = (slaSnapshots ?? []).map((snapshot) =>
    snapshot?.toPublicObject ? snapshot.toPublicObject() : toPlain(snapshot),
  );
  const billingRecords = (billingEvents ?? []).map((event) =>
    event?.toPublicObject ? event.toPublicObject() : toPlain(event),
  );

  const summary = {
    total: collaborationRecords.length,
    active: collaborationRecords.filter((collaboration) => collaboration.status === 'active').length,
    paused: collaborationRecords.filter((collaboration) => collaboration.status === 'paused').length,
    ended: collaborationRecords.filter((collaboration) => ['ended', 'closed'].includes(collaboration.status)).length,
    averageHealthScore: null,
    averageSatisfactionScore: null,
    forecastedUpsellValue: Number(sumBy(collaborationRecords, (collaboration) => safeNumber(collaboration.forecastedUpsellValue) ?? 0).toFixed(2)),
  };

  const healthScores = collaborationRecords
    .map((collaboration) => safeNumber(collaboration.healthScore))
    .filter((value) => Number.isFinite(value));
  summary.averageHealthScore = healthScores.length ? Number(average(healthScores)) : null;

  const satisfactionScores = collaborationRecords
    .map((collaboration) => safeNumber(collaboration.satisfactionScore))
    .filter((value) => Number.isFinite(value));
  summary.averageSatisfactionScore = satisfactionScores.length ? Number(average(satisfactionScores)) : null;

  const upcomingRenewals = collaborationRecords
    .filter((collaboration) => collaboration.renewalDate && new Date(collaboration.renewalDate) >= new Date())
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .slice(0, 6)
    .map((collaboration) => ({
      agencyName: collaboration.agencyWorkspace?.name ?? 'Partner agency',
      renewalDate: collaboration.renewalDate,
      status: collaboration.status,
      healthScore: safeNumber(collaboration.healthScore),
      satisfactionScore: safeNumber(collaboration.satisfactionScore),
    }));

  const inviteSummary = {
    total: invitationRecords.length,
    pending: invitationRecords.filter((invite) => invite.status === 'pending').length,
    accepted: invitationRecords.filter((invite) => invite.status === 'accepted').length,
    declined: invitationRecords.filter((invite) => invite.status === 'declined').length,
    lastSentAt: invitationRecords.length
      ? invitationRecords.map((invite) => invite.createdAt).sort((a, b) => new Date(b) - new Date(a))[0]
      : null,
  };

  const rateCardSummary = {
    total: rateCardRecords.length,
    shared: rateCardRecords.filter((card) => card.status === 'shared').length,
    draft: rateCardRecords.filter((card) => card.status === 'draft').length,
    newest: rateCardRecords
      .slice()
      .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0))
      .slice(0, 5)
      .map((card) => ({
        title: card.title,
        status: card.status,
        effectiveFrom: card.effectiveFrom,
        effectiveTo: card.effectiveTo,
        currency: card.currency,
        itemCount: Array.isArray(card.items) ? card.items.length : 0,
      })),
  };

  const slaSummary = (() => {
    if (!slaRecords.length) {
      return {
        onTimeDeliveryRate: null,
        averageResponseHours: null,
        breachCount: 0,
        escalations: 0,
        partners: [],
      };
    }

    const onTimeRates = slaRecords
      .map((snapshot) => safeNumber(snapshot.onTimeDeliveryRate))
      .filter((value) => Number.isFinite(value));
    const responseHours = slaRecords
      .map((snapshot) => safeNumber(snapshot.responseTimeHoursAvg))
      .filter((value) => Number.isFinite(value));

    const latestByCollaboration = new Map();
    slaRecords.forEach((snapshot) => {
      const existing = latestByCollaboration.get(snapshot.agencyCollaborationId);
      if (!existing || new Date(snapshot.periodEnd) > new Date(existing.periodEnd)) {
        latestByCollaboration.set(snapshot.agencyCollaborationId, snapshot);
      }
    });

    const partners = Array.from(latestByCollaboration.values())
      .map((snapshot) => ({
        collaborationId: snapshot.agencyCollaborationId,
        onTimeDeliveryRate: safeNumber(snapshot.onTimeDeliveryRate),
        responseTimeHours: safeNumber(snapshot.responseTimeHoursAvg),
        breachCount: Number(snapshot.breachCount ?? 0),
        escalationsCount: Number(snapshot.escalationsCount ?? 0),
      }))
      .sort((a, b) => (b.onTimeDeliveryRate ?? 0) - (a.onTimeDeliveryRate ?? 0))
      .slice(0, 6);

    return {
      onTimeDeliveryRate: onTimeRates.length ? Number(average(onTimeRates)) : null,
      averageResponseHours: responseHours.length ? Number(average(responseHours)) : null,
      breachCount: sumBy(slaRecords, (snapshot) => Number(snapshot.breachCount ?? 0)),
      escalations: sumBy(slaRecords, (snapshot) => Number(snapshot.escalationsCount ?? 0)),
      partners,
    };
  })();

  const billingSummary = (() => {
    if (!billingRecords.length) {
      return {
        outstandingAmount: 0,
        outstandingCount: 0,
        currency: 'USD',
        dueSoon: { count: 0, amount: 0 },
        paidThisQuarter: { count: 0, amount: 0 },
        upcomingInvoices: [],
      };
    }

    const outstandingStatuses = new Set(['draft', 'sent', 'overdue']);
    const outstanding = billingRecords.filter((event) => outstandingStatuses.has(event.status));
    const dueSoonThreshold = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
    const dueSoon = outstanding.filter((event) => event.dueAt && new Date(event.dueAt) <= dueSoonThreshold);
    const quarterStart = startOfQuarter();
    const paid = billingRecords.filter((event) => event.status === 'paid' && event.paidAt && new Date(event.paidAt) >= quarterStart);

    const currency = outstanding.find((event) => event.currency)?.currency || billingRecords[0]?.currency || 'USD';

    return {
      outstandingAmount: Number(sumBy(outstanding, (event) => safeNumber(event.amount) ?? 0).toFixed(2)),
      outstandingCount: outstanding.length,
      currency,
      dueSoon: {
        count: dueSoon.length,
        amount: Number(sumBy(dueSoon, (event) => safeNumber(event.amount) ?? 0).toFixed(2)),
      },
      paidThisQuarter: {
        count: paid.length,
        amount: Number(sumBy(paid, (event) => safeNumber(event.amount) ?? 0).toFixed(2)),
      },
      upcomingInvoices: outstanding
        .slice()
        .sort((a, b) => new Date(a.dueAt ?? a.issuedAt ?? 0) - new Date(b.dueAt ?? b.issuedAt ?? 0))
        .slice(0, 6)
        .map((event) => ({
          invoiceNumber: event.invoiceNumber,
          status: event.status,
          amount: safeNumber(event.amount),
          currency: event.currency ?? currency,
          dueAt: event.dueAt,
        })),
    };
  })();

  return {
    summary,
    renewals: upcomingRenewals,
    invites: inviteSummary,
    rateCards: rateCardSummary,
    sla: slaSummary,
    billing: billingSummary,
  };
}

function buildBrandIntelligenceSummary({ profile, assets, jobSummary }) {
  const publishedAssets = assets.filter((asset) => asset.status === 'published');
  const engagementScores = publishedAssets
    .map((asset) => (asset.engagementScore == null ? null : Number(asset.engagementScore)))
    .filter((value) => Number.isFinite(value));

  const profileCompleteness = (() => {
    if (!profile) return 0;
    const fields = ['companyName', 'description', 'website'];
    const completed = fields.reduce((count, field) => (profile[field] ? count + 1 : count), 0);
    return Number(((completed / fields.length) * 100).toFixed(0));
  })();

  return {
    publishedAssets: publishedAssets.length,
    averageEngagementScore: engagementScores.length ? Number(average(engagementScores).toFixed(1)) : null,
    profileCompleteness,
    activeRoles: jobSummary?.total ?? 0,
    assets: publishedAssets.slice(0, 6).map((asset) => ({
      id: asset.id,
      title: asset.title,
      assetType: asset.assetType,
      url: asset.url,
      engagementScore: asset.engagementScore,
      publishedAt: asset.publishedAt,
    })),
  };
}

function buildEmployerBrandProfileStudio({ profile, sections, assets, campaigns }) {
  const sectionList = sections.map((section) => toPlain(section));
  const campaignList = campaigns.map((campaign) => toPlain(campaign));
  const counts = {
    totalSections: sectionList.length,
    cultureVideos: sectionList.filter((section) => section.sectionType === 'culture_video').length,
    benefits: sectionList.filter((section) => section.sectionType === 'benefit').length,
    deiCommitments: sectionList.filter((section) => section.sectionType === 'dei_commitment').length,
    teamSpotlights: sectionList.filter((section) => section.sectionType === 'team_spotlight').length,
    offices: sectionList.filter((section) => section.sectionType === 'office').length,
    leadershipStories: sectionList.filter((section) => section.sectionType === 'leadership_story').length,
  };

  const featuredSections = sectionList
    .filter((section) => section.isFeatured)
    .slice(0, 6)
    .map((section) => ({
      id: section.id,
      title: section.title,
      summary: section.summary,
      type: section.sectionType,
      typeLabel: EMPLOYER_BRAND_SECTION_LABELS[section.sectionType] ?? EMPLOYER_BRAND_SECTION_LABELS.custom,
      mediaUrl: section.mediaUrl,
      publishedAt: section.publishedAt,
    }));

  const dynamicHighlights = {
    teams: sectionList
      .filter((section) => section.sectionType === 'team_spotlight')
      .slice(0, 4)
      .map((section) => ({
        id: section.id,
        title: section.title,
        summary: section.summary,
      })),
    offices: sectionList
      .filter((section) => section.sectionType === 'office')
      .slice(0, 4)
      .map((section) => ({
        id: section.id,
        title: section.title,
        summary: section.summary,
      })),
    leadership: sectionList
      .filter((section) => section.sectionType === 'leadership_story')
      .slice(0, 4)
      .map((section) => ({
        id: section.id,
        title: section.title,
        summary: section.summary,
      })),
  };

  const campaignsByChannel = new Map();
  let activeCampaigns = 0;
  let totalApplications = 0;
  let totalHires = 0;
  let totalSpend = 0;

  campaignList.forEach((campaign) => {
    const status = normalizeCategory(campaign.status ?? 'draft').toLowerCase();
    if (['active', 'scheduled'].includes(status)) {
      activeCampaigns += 1;
    }
    const channel = normalizeCategory(campaign.channel, 'Direct');
    const entry = campaignsByChannel.get(channel) ?? {
      campaigns: 0,
      spend: 0,
      applications: 0,
      hires: 0,
    };
    entry.campaigns += 1;
    entry.spend += safeNumber(campaign.spendAmount);
    entry.applications += safeNumber(campaign.applications);
    entry.hires += safeNumber(campaign.hires);
    campaignsByChannel.set(channel, entry);

    totalSpend += safeNumber(campaign.spendAmount);
    totalApplications += safeNumber(campaign.applications);
    totalHires += safeNumber(campaign.hires);
  });

  const recentCampaigns = campaignList
    .slice()
    .sort((a, b) => new Date(b.startsAt ?? b.createdAt ?? 0) - new Date(a.startsAt ?? a.createdAt ?? 0))
    .slice(0, 5)
    .map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      spendAmount: safeNumber(campaign.spendAmount, 2),
      applications: safeNumber(campaign.applications),
      hires: safeNumber(campaign.hires),
    }));

  return {
    profile,
    counts,
    sections: sectionList.map((section) => ({
      id: section.id,
      title: section.title,
      summary: section.summary,
      type: section.sectionType,
      typeLabel: EMPLOYER_BRAND_SECTION_LABELS[section.sectionType] ?? EMPLOYER_BRAND_SECTION_LABELS.custom,
      mediaUrl: section.mediaUrl,
      publishedAt: section.publishedAt,
    })),
    featuredSections,
    dynamicHighlights,
    campaignSummary: {
      total: campaignList.length,
      active: activeCampaigns,
      totalSpend: Number(totalSpend.toFixed(2)),
      totalApplications,
      totalHires,
      byChannel: Array.from(campaignsByChannel.entries()).map(([channel, metrics]) => ({
        channel,
        campaigns: metrics.campaigns,
        spend: Number(metrics.spend.toFixed(2)),
        applications: metrics.applications,
        hires: metrics.hires,
      })),
      recent: recentCampaigns,
    },
    assets,
  };
}

function buildWorkforceAnalyticsIntelligence({ snapshots, cohorts }) {
  const snapshotList = snapshots.map((snapshot) => toPlain(snapshot));
  const cohortList = cohorts.map((cohort) => toPlain(cohort));

  const latest = snapshotList
    .slice()
    .sort((a, b) => new Date(b.capturedAt ?? 0) - new Date(a.capturedAt ?? 0))[0] ?? null;

  const trend = snapshotList
    .slice()
    .sort((a, b) => new Date(a.capturedAt ?? 0) - new Date(b.capturedAt ?? 0))
    .slice(-6)
    .map((snapshot) => ({
      capturedAt: snapshot.capturedAt,
      attritionRiskScore: snapshot.attritionRiskScore == null ? null : Number(snapshot.attritionRiskScore),
      mobilityOpportunities: safeNumber(snapshot.mobilityOpportunities),
      skillGapAlerts: safeNumber(snapshot.skillGapAlerts),
    }));

  const cohortComparisons = cohortList
    .slice()
    .sort((a, b) => (b.headcount ?? 0) - (a.headcount ?? 0))
    .slice(0, 8)
    .map((cohort) => ({
      id: cohort.id,
      label: `${normalizeCategory(cohort.cohortType)}: ${normalizeCategory(cohort.cohortValue)}`,
      retentionRate: cohort.retentionRate == null ? null : Number(cohort.retentionRate),
      promotionRate: cohort.promotionRate == null ? null : Number(cohort.promotionRate),
      performanceIndex: cohort.performanceIndex == null ? null : Number(cohort.performanceIndex),
      headcount: safeNumber(cohort.headcount),
      periodStart: cohort.periodStart,
      periodEnd: cohort.periodEnd,
    }));

  const planAlignment = latest
    ? {
        hiringPlanHeadcount: latest.headcountPlan == null ? null : Number(latest.headcountPlan),
        workforceHeadcount: latest.headcountActual == null ? null : Number(latest.headcountActual),
        variance:
          latest.headcountPlan != null && latest.headcountActual != null
            ? Number((Number(latest.headcountActual) - Number(latest.headcountPlan)).toFixed(1))
            : null,
        budgetPlanned: latest.budgetPlanned == null ? null : Number(latest.budgetPlanned),
        budgetActual: latest.budgetActual == null ? null : Number(latest.budgetActual),
        budgetVariance:
          latest.budgetPlanned != null && latest.budgetActual != null
            ? Number((Number(latest.budgetActual) - Number(latest.budgetPlanned)).toFixed(2))
            : null,
      }
    : null;

  return {
    latestSnapshot: latest
      ? {
          capturedAt: latest.capturedAt,
          attritionRiskScore: latest.attritionRiskScore == null ? null : Number(latest.attritionRiskScore),
          mobilityOpportunities: safeNumber(latest.mobilityOpportunities),
          skillGapAlerts: safeNumber(latest.skillGapAlerts),
        }
      : null,
    mobilityOpportunities: latest ? safeNumber(latest.mobilityOpportunities) : 0,
    skillGapAlerts: latest ? safeNumber(latest.skillGapAlerts) : 0,
    attritionRiskScore: latest?.attritionRiskScore == null ? null : Number(latest.attritionRiskScore),
    planAlignment,
    cohortComparisons,
    trend,
  };
}

function buildInternalMobilityProgram({ postings, referrals, careerPlans }) {
  const postingList = postings.map((posting) => toPlain(posting));
  const referralList = referrals.map((referral) => toPlain(referral));
  const planList = careerPlans.map((plan) => toPlain(plan));

  const openStatuses = new Set(['open', 'interview', 'offer']);
  const filledStatuses = new Set(['filled', 'closed']);

  const openRoles = postingList.filter((posting) => openStatuses.has((posting.status ?? '').toLowerCase())).length;
  const filledThisPeriod = postingList.filter((posting) => filledStatuses.has((posting.status ?? '').toLowerCase())).length;
  const internalApplications = sumBy(postingList, (posting) => posting.internalApplications ?? 0);

  const referralConversions = referralList.filter((referral) =>
    ['hired', 'rewarded'].includes((referral.status ?? '').toLowerCase()),
  ).length;
  const referralVolume = referralList.length;
  const referralConversionRate = referralVolume ? Number(((referralConversions / referralVolume) * 100).toFixed(1)) : 0;
  const rewardBudgetUsed = sumBy(referralList, (referral) => referral.rewardAmount ?? 0);

  const topReferrers = referralList
    .reduce((acc, referral) => {
      const referrerId = referral.referrerId ?? 'unknown';
      const entry = acc.get(referrerId) ?? {
        id: referrerId,
        name: referral.referrer
          ? `${referral.referrer.firstName ?? ''} ${referral.referrer.lastName ?? ''}`.trim()
          : 'Unknown',
        referrals: 0,
        rewardPoints: 0,
        rewardAmount: 0,
      };
      entry.referrals += 1;
      entry.rewardPoints += safeNumber(referral.rewardPoints);
      entry.rewardAmount += safeNumber(referral.rewardAmount, 2);
      acc.set(referrerId, entry);
      return acc;
    }, new Map())
    .values();

  const leaderboard = Array.from(topReferrers)
    .sort((a, b) => b.rewardPoints - a.rewardPoints || b.referrals - a.referrals)
    .slice(0, 5);

  const careerProgress = planList
    .map((plan) => ({
      id: plan.id,
      employeeName: plan.employee
        ? `${plan.employee.firstName ?? ''} ${plan.employee.lastName ?? ''}`.trim()
        : 'Unknown teammate',
      currentRole: plan.currentRole,
      targetRole: plan.targetRole,
      progressPercent: plan.progressPercent == null ? null : Number(plan.progressPercent),
      recommendedLearningPaths: Array.isArray(plan.recommendedLearningPaths)
        ? plan.recommendedLearningPaths
        : [],
      status: plan.status,
      updatedAt: plan.updatedAt,
    }))
    .slice(0, 6);

  const learningRecommendations = careerProgress
    .flatMap((plan) => plan.recommendedLearningPaths ?? [])
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 6);

  const recentPostings = postingList
    .slice()
    .sort((a, b) => new Date(b.postedAt ?? 0) - new Date(a.postedAt ?? 0))
    .slice(0, 6)
    .map((posting) => ({
      id: posting.id,
      title: posting.title,
      department: posting.department,
      status: posting.status,
      internalApplications: posting.internalApplications,
      postedAt: posting.postedAt,
    }));

  return {
    openRoles,
    filledThisPeriod,
    internalApplications,
    referralVolume,
    referralConversionRate,
    rewardBudgetUsed: Number(rewardBudgetUsed.toFixed(2)),
    leaderboard,
    careerProgress,
    learningRecommendations,
    recentPostings,
  };
}

function buildGovernanceComplianceSummary({ policies, audits, accessibilityAudits }) {
  const policyList = policies.map((policy) => toPlain(policy));
  const auditList = audits.map((audit) => toPlain(audit));
  const accessibilityList = accessibilityAudits.map((audit) => toPlain(audit));

  const activePolicies = policyList.filter((policy) => (policy.status ?? '').toLowerCase() === 'active').length;
  const policiesByRegion = policyList.reduce((acc, policy) => {
    const region = normalizeCategory(policy.region ?? 'Global');
    acc.set(region, (acc.get(region) ?? 0) + 1);
    return acc;
  }, new Map());

  const auditsOpen = auditList.filter((audit) =>
    ['open', 'in_progress'].includes((audit.status ?? '').toLowerCase()),
  ).length;
  const auditsClosedLast30 = auditList.filter((audit) => {
    if (!audit.closedAt) return false;
    const closedAt = new Date(audit.closedAt);
    if (Number.isNaN(closedAt.getTime())) {
      return false;
    }
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return closedAt >= thirtyDaysAgo;
  }).length;

  const escalationsOpen = auditList.filter((audit) => {
    const status = (audit.status ?? '').toLowerCase();
    if (['closed', 'completed'].includes(status)) {
      return false;
    }
    return Boolean(audit.escalationLevel);
  }).length;

  const accessibilityScoreAverage = accessibilityList.length
    ? Number((
        accessibilityList.reduce((sum, item) => sum + safeNumber(item.score), 0) / accessibilityList.length
      ).toFixed(1))
    : null;

  const remediationOpen = sumBy(accessibilityList, (audit) => audit.issuesOpen ?? 0);

  const recentAudits = auditList
    .slice()
    .sort((a, b) => new Date(b.openedAt ?? 0) - new Date(a.openedAt ?? 0))
    .slice(0, 6)
    .map((audit) => ({
      id: audit.id,
      auditType: audit.auditType,
      region: audit.region,
      status: audit.status,
      findingsCount: audit.findingsCount,
      severityScore: audit.severityScore == null ? null : Number(audit.severityScore),
      openedAt: audit.openedAt,
      closedAt: audit.closedAt,
    }));

  const accessibilityRecommendations = accessibilityList
    .flatMap((audit) => {
      if (Array.isArray(audit.recommendations)) {
        return audit.recommendations;
      }
      return [];
    })
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 6);

  return {
    activePolicies,
    policiesTotal: policyList.length,
    policiesByRegion: Object.fromEntries(policiesByRegion.entries()),
    auditsOpen,
    auditsClosedLast30,
    escalationsOpen,
    recentAudits,
    accessibility: {
      averageScore: accessibilityScoreAverage,
      totalAudits: accessibilityList.length,
      remediationOpen,
      recommendations: accessibilityRecommendations,
    },
  };
}

function buildEmployerBrandWorkforceIntelligence({
  profile,
  sections,
  assets,
  campaigns,
  workforceSnapshots,
  workforceCohorts,
  internalPostings,
  referrals,
  careerPlans,
  policies,
  complianceAudits,
  accessibilityAudits,
}) {
  const studio = buildEmployerBrandProfileStudio({ profile, sections, assets, campaigns });
  const workforce = buildWorkforceAnalyticsIntelligence({ snapshots: workforceSnapshots, cohorts: workforceCohorts });
  const mobility = buildInternalMobilityProgram({ postings: internalPostings, referrals, careerPlans });
  const governance = buildGovernanceComplianceSummary({
    policies,
    audits: complianceAudits,
    accessibilityAudits,
  });

  return {
    profileStudio: studio,
    workforceAnalytics: workforce,
    internalMobility: mobility,
    governanceCompliance: governance,
  };
}

function buildGovernanceSummary({ approvals, alerts, workspace }) {
  const pendingApprovals = approvals.filter((item) => ['pending', 'in_review'].includes(item.status));
  const criticalAlerts = alerts.items.filter((item) => item.severity === 'critical');

  return {
    pendingApprovals: pendingApprovals.length,
    criticalAlerts: criticalAlerts.length,
    workspaceActive: Boolean(workspace?.isActive),
    timezone: workspace?.timezone ?? null,
  };
}

function buildEmployerBrandStudioSummary({ profile, assets, stories, benefits, pages }) {
  const normalizeName = (record) => {
    const profileRecord = record?.profile ?? record;
    const parts = [profileRecord?.firstName, profileRecord?.lastName].filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  };

  const publishedAssets = assets.filter((asset) => asset.status === 'published');
  const engagementScores = publishedAssets
    .map((asset) => (asset.engagementScore == null ? null : Number(asset.engagementScore)))
    .filter((value) => Number.isFinite(value));

  const publishedStories = stories.filter((story) => story.status === 'published');
  const scheduledStories = stories.filter((story) => story.status === 'scheduled');
  const topStories = [...publishedStories]
    .sort((a, b) => (Number(b.engagementScore) || 0) - (Number(a.engagementScore) || 0))
    .slice(0, 3)
    .map((story) => ({
      id: story.id,
      title: story.title,
      storyType: story.storyType,
      summary: story.summary,
      engagementScore: story.engagementScore == null ? null : Number(story.engagementScore),
      publishedAt: story.publishedAt,
      authorName: normalizeName(story.author?.profile) ?? normalizeName(story.author),
    }));

  const featuredBenefits = benefits.filter((benefit) => Boolean(benefit.isFeatured));
  const benefitCategories = new Map();
  benefits.forEach((benefit) => {
    benefitCategories.set(benefit.category, (benefitCategories.get(benefit.category) ?? 0) + 1);
  });

  const profileCompleteness = (() => {
    if (!profile) return 0;
    const fields = ['companyName', 'description', 'website', 'valuesStatement'];
    const completed = fields.reduce((count, field) => (profile[field] ? count + 1 : count), 0);
    return Number(((completed / fields.length) * 100).toFixed(0));
  })();

  const highlights = [];
  if (profileCompleteness >= 80) {
    highlights.push('Company profile is nearly complete and ready for campaigns.');
  } else if (profileCompleteness >= 40) {
    highlights.push('Expand your company story to boost talent conversion.');
  }
  if (publishedAssets.length >= 5) {
    highlights.push('Robust library of published employer brand assets available.');
  }
  if (publishedStories.length && topStories.length) {
    highlights.push(`Top story “${topStories[0].title}” is driving engagement.`);
  }
  if (!benefits.length) {
    highlights.push('Document employee benefits to power offer and onboarding content.');
  }

  const pagesSnapshot = pages || {};
  const pagesMetrics = {
    live: pagesSnapshot.statusCounts?.published ?? pagesSnapshot.statusCounts?.live ?? 0,
    inReview: pagesSnapshot.statusCounts?.in_review ?? 0,
    drafts: pagesSnapshot.statusCounts?.draft ?? 0,
    scheduled: pagesSnapshot.scheduledCount ?? 0,
    averageConversionRate: pagesSnapshot.averageConversionRate ?? null,
    totalFollowers: pagesSnapshot.totalFollowers ?? 0,
    lastPublishedAt: pagesSnapshot.lastPublishedAt ?? null,
  };

  if (pagesMetrics.live > 0) {
    highlights.push(`${pagesMetrics.live} public pages are live and driving discovery.`);
  }
  if (pagesMetrics.inReview > 0) {
    highlights.push(`${pagesMetrics.inReview} pages are awaiting reviewer approval.`);
  }
  if ((pagesSnapshot.governance?.heroImageRequired ?? 0) > 0) {
    highlights.push('Add hero imagery to drafts before publishing.');
  }

  return {
    profileCompleteness,
    publishedAssets: publishedAssets.length,
    averageAssetEngagement: engagementScores.length
      ? Number((engagementScores.reduce((sum, value) => sum + value, 0) / engagementScores.length).toFixed(1))
      : null,
    stories: {
      total: stories.length,
      published: publishedStories.length,
      scheduled: scheduledStories.length,
      topStories,
    },
    assets: publishedAssets.slice(0, 5).map((asset) => ({
      id: asset.id,
      title: asset.title,
      assetType: asset.assetType,
      engagementScore: asset.engagementScore == null ? null : Number(asset.engagementScore),
      publishedAt: asset.publishedAt,
      url: asset.url,
    })),
    benefits: {
      total: benefits.length,
      featured: featuredBenefits.slice(0, 5).map((benefit) => ({
        id: benefit.id,
        title: benefit.title,
        category: benefit.category,
        effectiveDate: benefit.effectiveDate,
      })),
      categories: Array.from(benefitCategories.entries()).map(([category, count]) => ({ category, count })),
    },
    highlights,
    pages: {
      metrics: pagesMetrics,
      upcomingLaunches: (pagesSnapshot.upcomingLaunches ?? []).map((launch) => ({
        id: launch.id,
        title: launch.title,
        launchDate: launch.launchDate ? new Date(launch.launchDate).toISOString() : null,
        status: launch.status,
        owner: launch.owner ?? null,
      })),
      governance: pagesSnapshot.governance ?? {},
    },
  };
}

function buildEmployeeJourneysSummary({ journeys, memberSummary }) {
  if (!journeys?.length) {
    return {
      totalPrograms: 0,
      activeEmployees: 0,
      averageCompletionRate: null,
      programsAtRisk: 0,
      workforceCoverage: null,
      byType: [],
      spotlightPrograms: [],
      highlights: ['Launch an onboarding journey to track day-one readiness.'],
    };
  }

  const byType = new Map();
  let activeEmployees = 0;
  const completionRates = [];
  const spotlight = [];

  const healthWeights = new Map([
    ['off_track', 0],
    ['needs_attention', 1],
    ['at_risk', 2],
    ['on_track', 3],
  ]);

  journeys.forEach((program) => {
    const completionRate = program.completionRate == null ? null : Number(program.completionRate);
    if (Number.isFinite(completionRate)) {
      completionRates.push(completionRate);
    }

    const active = Number(program.activeEmployees ?? 0);
    activeEmployees += Number.isFinite(active) ? active : 0;

    const entry = byType.get(program.programType) ?? {
      type: program.programType,
      programCount: 0,
      activeEmployees: 0,
      completionRateSum: 0,
      completionSamples: 0,
      atRiskPrograms: 0,
      averageDurationSum: 0,
      durationSamples: 0,
    };
    entry.programCount += 1;
    entry.activeEmployees += active;
    if (Number.isFinite(completionRate)) {
      entry.completionRateSum += completionRate;
      entry.completionSamples += 1;
    }
    if (program.averageDurationDays != null && Number.isFinite(Number(program.averageDurationDays))) {
      entry.averageDurationSum += Number(program.averageDurationDays);
      entry.durationSamples += 1;
    }
    if (['at_risk', 'off_track', 'needs_attention'].includes(program.healthStatus)) {
      entry.atRiskPrograms += 1;
    }
    byType.set(program.programType, entry);

    const ownerProfile = program.owner?.profile ?? program.owner;
    const ownerName = ownerProfile
      ? [ownerProfile.firstName, ownerProfile.lastName].filter(Boolean).join(' ').trim() || null
      : null;

    spotlight.push({
      id: program.id,
      title: program.title,
      programType: program.programType,
      healthStatus: program.healthStatus,
      activeEmployees: active,
      completionRate,
      averageDurationDays:
        program.averageDurationDays != null && Number.isFinite(Number(program.averageDurationDays))
          ? Number(program.averageDurationDays)
          : null,
      ownerName,
      priority: healthWeights.get(program.healthStatus) ?? 3,
    });
  });

  const programsAtRisk = spotlight.filter((program) => program.priority <= 2).length;
  const averageCompletionRate = completionRates.length
    ? Number((completionRates.reduce((sum, value) => sum + value, 0) / completionRates.length).toFixed(1))
    : null;
  const workforceCoverage = memberSummary?.total
    ? percentage(activeEmployees, memberSummary.total)
    : null;

  const byTypeSummaries = Array.from(byType.values()).map((entry) => ({
    type: entry.type,
    programCount: entry.programCount,
    activeEmployees: entry.activeEmployees,
    averageCompletionRate: entry.completionSamples
      ? Number((entry.completionRateSum / entry.completionSamples).toFixed(1))
      : null,
    averageDurationDays: entry.durationSamples
      ? Number((entry.averageDurationSum / entry.durationSamples).toFixed(1))
      : null,
    atRiskPrograms: entry.atRiskPrograms,
  }));

  const spotlightPrograms = spotlight
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      const aRate = Number.isFinite(a.completionRate) ? a.completionRate : 101;
      const bRate = Number.isFinite(b.completionRate) ? b.completionRate : 101;
      return aRate - bRate;
    })
    .slice(0, 5)
    .map(({ priority, ...program }) => {
      void priority;
      return program;
    });

  const highlights = [];
  if (programsAtRisk) {
    highlights.push(`${programsAtRisk} journey${programsAtRisk === 1 ? '' : 's'} flagged for follow-up.`);
  }
  if (averageCompletionRate != null) {
    highlights.push(`Average completion rate is ${averageCompletionRate}% across journeys.`);
  }
  if (workforceCoverage != null) {
    highlights.push(`Journeys cover ${workforceCoverage}% of active workspace members.`);
  }

  return {
    totalPrograms: journeys.length,
    activeEmployees,
    averageCompletionRate,
    programsAtRisk,
    workforceCoverage,
    byType: byTypeSummaries,
    spotlightPrograms,
    highlights,
  };
}

function buildSettingsGovernanceDetails({
  governance,
  integrations,
  calendarConnections,
  memberSummary,
  inviteSummary,
  alerts,
}) {
  const integrationCategories = new Map();
  let connectedIntegrations = 0;
  let failingIntegrations = 0;

  integrations.forEach((integration) => {
    integrationCategories.set(
      integration.category,
      (integrationCategories.get(integration.category) ?? 0) + 1,
    );
    if (integration.status === 'connected') {
      connectedIntegrations += 1;
    }
    if (integration.status === 'error' || integration.status === 'disconnected') {
      failingIntegrations += 1;
    }
  });

  let lastCalendarSync = null;
  let calendarIssues = 0;
  let connectedCalendars = 0;
  calendarConnections.forEach((connection) => {
    if (!lastCalendarSync || new Date(connection.lastSyncedAt ?? 0) > new Date(lastCalendarSync)) {
      lastCalendarSync = connection.lastSyncedAt;
    }
    if (connection.status === 'sync_error') {
      calendarIssues += 1;
    }
    if (connection.status === 'connected') {
      connectedCalendars += 1;
    }
  });

  const highlights = [];
  if (connectedCalendars) {
    highlights.push(`Calendar sync live across ${connectedCalendars} connection${connectedCalendars === 1 ? '' : 's'}.`);
  }
  if (failingIntegrations) {
    highlights.push(`Resolve ${failingIntegrations} integration${failingIntegrations === 1 ? '' : 's'} showing errors.`);
  }
  if ((inviteSummary?.pending ?? 0) > 0) {
    highlights.push(`${inviteSummary.pending} workspace invite${inviteSummary.pending === 1 ? '' : 's'} awaiting approval.`);
  }
  if ((alerts?.criticalAlerts ?? 0) > 0) {
    highlights.push('Critical compliance alerts require attention.');
  }

  return {
    calendar: {
      totalConnections: calendarConnections.length,
      connected: connectedCalendars,
      issues: calendarIssues,
      lastSyncedAt: lastCalendarSync,
      primaryCalendars: calendarConnections
        .filter((connection) => Boolean(connection.primaryCalendar))
        .slice(0, 3)
        .map((connection) => ({
          providerKey: connection.providerKey,
          primaryCalendar: connection.primaryCalendar,
          status: connection.status,
        })),
    },
    integrations: {
      total: integrations.length,
      connected: connectedIntegrations,
      failing: failingIntegrations,
      categories: Array.from(integrationCategories.entries()).map(([category, count]) => ({
        category,
        count,
      })),
    },
    permissions: {
      activeMembers: memberSummary?.active ?? 0,
      pendingInvites: inviteSummary?.pending ?? 0,
      uniqueTimezones: memberSummary?.uniqueTimezones ?? 0,
    },
    compliance: {
      criticalAlerts: alerts?.criticalAlerts ?? 0,
      openAlerts: alerts?.open ?? 0,
    },
    approvals: {
      pending: governance?.pendingApprovals ?? 0,
      criticalAlerts: governance?.criticalAlerts ?? 0,
      workspaceActive: governance?.workspaceActive ?? false,
    },
    highlights,
  };
}

function buildCalendarDigest(events) {
  if (!events.length) {
    return { upcoming: [], eventCount: 0 };
  }

  const upcoming = events
    .map((event) => (event?.get ? event.get({ plain: true }) : event))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .filter((event) => new Date(event.endsAt ?? event.startsAt) >= new Date())
    .map((event) => ({
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
    }));

  return {
    eventCount: events.length,
    upcoming: upcoming.slice(0, 8),
  };
}

function buildMemberships(workspace) {
  return [
    {
      name: 'Company',
      active: Boolean(workspace?.isActive),
      description: 'Full access to hiring operations, analytics, and governance controls.',
    },
    {
      name: 'Headhunter',
      active: true,
      description: 'Collaborate with agencies and external recruiters on shared briefs.',
    },
    {
      name: 'User & Job Seeker',
      active: true,
      description: 'Talent community experience for employees, referrals, and alumni.',
    },
  ];
}

async function listAvailableWorkspaces() {
  const workspaces = await ProviderWorkspace.findAll({
    where: { type: 'company' },
    attributes: ['id', 'name', 'slug'],
    order: [['name', 'ASC']],
    limit: 25,
  });
  return workspaces.map((workspace) => workspace.get({ plain: true }));
}

async function fetchNetworkingSessionsForWorkspace({ workspaceId, since }) {
  if (!workspaceId) {
    return [];
  }
  const where = { companyId: workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  if (!NetworkingSessionModel?.findAll) {
    return [];
  }

  const include = NetworkingSessionSignupModel
    ? [{ model: NetworkingSessionSignupModel, as: 'signups' }]
    : [];

  return NetworkingSessionModel.findAll({
    where,
    include,
    order: [
      ['startTime', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit: 200,
  });
}

async function fetchNetworkingBusinessCardsForWorkspace({ workspaceId }) {
  if (!workspaceId) {
    return [];
  }
  return safeFindAll(NetworkingBusinessCardModel, {
    where: { companyId: workspaceId },
    order: [['updatedAt', 'DESC']],
    limit: 200,
  });
}

function buildNetworkingDashboard({ sessions, cards }) {
  const now = Date.now();
  const sessionSummaries = sessions.map((session) => {
    const plain = session.toPublicObject();
    const signups = Array.isArray(session.signups) ? session.signups : [];
    const registered = signups.filter((signup) => signup.status === 'registered').length;
    const waitlisted = signups.filter((signup) => signup.status === 'waitlisted').length;
    const checkedIn = signups.filter((signup) => signup.status === 'checked_in').length;
    const completed = signups.filter((signup) => signup.status === 'completed').length;
    const noShows = signups.filter((signup) => signup.status === 'no_show').length;
    const cardShares = signups.filter((signup) => signup.businessCardId != null).length;
    const penalties = signups.filter((signup) => (signup.penaltyCount ?? 0) > 0).length;
    const satisfactionScores = signups
      .map((signup) => (signup.satisfactionScore == null ? null : Number(signup.satisfactionScore)))
      .filter((score) => Number.isFinite(score));
    const avgSatisfaction = satisfactionScores.length
      ? Number((satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length).toFixed(2))
      : null;
    const profileSharedCount = sumNumbers(signups.map((signup) => signup.profileSharedCount ?? 0));
    const connectionsSaved = sumNumbers(signups.map((signup) => signup.connectionsSaved ?? 0));
    const messagesSent = sumNumbers(signups.map((signup) => signup.messagesSent ?? 0));
    const followUpsScheduled = sumNumbers(signups.map((signup) => signup.followUpsScheduled ?? 0));
    const penaltyRules = normaliseMetadata(plain.penaltyRules ?? session.penaltyRules ?? {});

    return {
      ...plain,
      metrics: {
        registered,
        waitlisted,
        checkedIn,
        completed,
        noShows,
        cardShares,
        penalties,
        profileSharedCount,
        connectionsSaved,
        messagesSent,
        followUpsScheduled,
        averageSatisfaction: avgSatisfaction,
        penaltyRules,
      },
      upcoming: plain.startTime ? new Date(plain.startTime).getTime() > now : false,
    };
  });

  const totals = sessionSummaries.reduce(
    (acc, session) => {
      const status = session.status;
      if (status === 'in_progress') acc.active += 1;
      if (status === 'scheduled' && session.upcoming) acc.upcoming += 1;
      if (status === 'completed') acc.completed += 1;
      if (status === 'draft') acc.draft += 1;
      if (status === 'cancelled') acc.cancelled += 1;
      acc.total += 1;
      if (Number.isFinite(Number(session.joinLimit))) {
        acc.joinLimits.push(Number(session.joinLimit));
      }
      if (Number.isFinite(Number(session.rotationDurationSeconds))) {
        acc.rotationDurations.push(Number(session.rotationDurationSeconds));
      }
      const metrics = session.metrics;
      acc.registered += metrics.registered;
      acc.waitlist += metrics.waitlisted;
      acc.checkedIn += metrics.checkedIn;
      acc.completedAttendees += metrics.completed;
      acc.noShows += metrics.noShows;
      acc.profileShares += metrics.profileSharedCount;
      acc.connectionsSaved += metrics.connectionsSaved;
      acc.messagesSent += metrics.messagesSent;
      acc.followUps += metrics.followUpsScheduled;
      if (session.accessType === 'paid') {
        acc.paidSessions += 1;
        if (Number.isFinite(Number(session.priceCents))) {
          const attendeeCount = metrics.checkedIn + metrics.completed;
          acc.revenueCents += Number(session.priceCents) * Math.max(0, attendeeCount);
          acc.pricePoints.push(Number(session.priceCents));
        }
      } else {
        acc.freeSessions += 1;
      }
      if (Number.isFinite(metrics.averageSatisfaction)) {
        acc.satisfactionScores.push(metrics.averageSatisfaction);
      }
      const telemetry = normaliseMetadata(session.videoTelemetry ?? {});
      if (telemetry.qualityScore != null && Number.isFinite(Number(telemetry.qualityScore))) {
        acc.videoQuality.push(Number(telemetry.qualityScore));
      }
      if (telemetry.announcements != null && Number.isFinite(Number(telemetry.announcements))) {
        acc.hostAnnouncements += Number(telemetry.announcements);
      }
      if (telemetry.failoverRate != null && Number.isFinite(Number(telemetry.failoverRate))) {
        acc.videoFailover.push(Number(telemetry.failoverRate));
      }
      const config = normaliseMetadata(session.videoConfig ?? {});
      if (config.clientLoadShare != null && Number.isFinite(Number(config.clientLoadShare))) {
        acc.browserLoadShare.push(Number(config.clientLoadShare));
      }
      acc.remindersSent += Number(session.metadata?.remindersSent ?? 0);
      acc.searchDemand += Number(session.metadata?.searchInterest ?? 0);
      acc.sponsorSlots += Number(session.monetization?.sponsorSlots ?? 0);
      return acc;
    },
    {
      total: 0,
      active: 0,
      upcoming: 0,
      completed: 0,
      draft: 0,
      cancelled: 0,
      joinLimits: [],
      rotationDurations: [],
      registered: 0,
      waitlist: 0,
      checkedIn: 0,
      completedAttendees: 0,
      noShows: 0,
      profileShares: 0,
      connectionsSaved: 0,
      messagesSent: 0,
      followUps: 0,
      paidSessions: 0,
      freeSessions: 0,
      revenueCents: 0,
      pricePoints: [],
      satisfactionScores: [],
      videoQuality: [],
      hostAnnouncements: 0,
      videoFailover: [],
      browserLoadShare: [],
      remindersSent: 0,
      searchDemand: 0,
      sponsorSlots: 0,
    },
  );

  const cardsPlain = cards.map((card) => card.toPublicObject());
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cardsUpdatedThisWeek = cardsPlain.filter((card) => {
    const updatedAt = card.updatedAt ? new Date(card.updatedAt).getTime() : null;
    return updatedAt != null && updatedAt >= sevenDaysAgo;
  }).length;
  const uniqueTags = new Set(cardsPlain.flatMap((card) => (Array.isArray(card.tags) ? card.tags : [])));
  const cardShares = sessionSummaries.reduce((total, session) => total + session.metrics.cardShares, 0);

  const averageJoinLimit = totals.joinLimits.length
    ? Math.round(totals.joinLimits.reduce((sum, value) => sum + value, 0) / totals.joinLimits.length)
    : null;
  const averageRotationSeconds = totals.rotationDurations.length
    ? Math.round(totals.rotationDurations.reduce((sum, value) => sum + value, 0) / totals.rotationDurations.length)
    : null;
  const averagePriceCents = totals.pricePoints.length
    ? Math.round(totals.pricePoints.reduce((sum, value) => sum + value, 0) / totals.pricePoints.length)
    : null;
  const averageSatisfaction = totals.satisfactionScores.length
    ? Number(
        (
          totals.satisfactionScores.reduce((sum, value) => sum + value, 0) /
          totals.satisfactionScores.length
        ).toFixed(2),
      )
    : null;
  const averageVideoQuality = totals.videoQuality.length
    ? Number((totals.videoQuality.reduce((sum, value) => sum + value, 0) / totals.videoQuality.length).toFixed(2))
    : null;
  const averageBrowserLoadShare = totals.browserLoadShare.length
    ? Number(
        (
          totals.browserLoadShare.reduce((sum, value) => sum + value, 0) /
          totals.browserLoadShare.length
        ).toFixed(2),
      )
    : null;
  const averageFailoverRate = totals.videoFailover.length
    ? Number((totals.videoFailover.reduce((sum, value) => sum + value, 0) / totals.videoFailover.length).toFixed(3))
    : null;

  const totalSignups =
    totals.registered + totals.checkedIn + totals.completedAttendees + totals.waitlist + totals.noShows;
  const noShowRate = totalSignups > 0 ? Number(((totals.noShows / totalSignups) * 100).toFixed(1)) : null;

  const featuredSession = sessionSummaries
    .filter((session) => session.upcoming)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0] ??
    sessionSummaries[0] ??
    null;

  return {
    sessions: {
      total: totals.total,
      active: totals.active,
      upcoming: totals.upcoming,
      completed: totals.completed,
      draft: totals.draft,
      cancelled: totals.cancelled,
      averageJoinLimit,
      rotationDurationSeconds: averageRotationSeconds,
      registered: totals.registered,
      waitlist: totals.waitlist,
      checkedIn: totals.checkedIn,
      completedAttendees: totals.completedAttendees,
      paid: totals.paidSessions,
      free: totals.freeSessions,
      revenueCents: totals.revenueCents,
      averagePriceCents,
      satisfactionAverage: averageSatisfaction,
      list: sessionSummaries,
    },
    scheduling: {
      preRegistrations: totals.registered + totals.checkedIn + totals.completedAttendees,
      waitlist: totals.waitlist,
      remindersSent: totals.remindersSent,
      searches: totals.searchDemand,
      sponsorSlots: totals.sponsorSlots,
    },
    monetization: {
      paid: totals.paidSessions,
      free: totals.freeSessions,
      revenueCents: totals.revenueCents,
      averagePriceCents,
    },
    penalties: {
      noShowRate,
      activePenalties: totals.noShows,
      restrictedParticipants: sessionSummaries.reduce((count, session) => {
        const threshold = Number(session.metrics.penaltyRules?.noShowThreshold ?? NETWORKING_DEFAULT_PENALTY_RULES.noShowThreshold);
        const restricted = (session.signups ?? []).filter(
          (signup) => (signup.penaltyCount ?? 0) >= threshold,
        );
        return count + restricted.length;
      }, 0),
      cooldownDays: sessionSummaries.reduce(
        (max, session) => Math.max(max, Number(session.metrics.penaltyRules?.cooldownDays ?? 0)),
        NETWORKING_DEFAULT_PENALTY_RULES.cooldownDays,
      ),
    },
    attendeeExperience: {
      profilesShared: totals.profileShares,
      connectionsSaved: totals.connectionsSaved,
      averageMessagesPerSession:
        sessionSummaries.length > 0
          ? Number(((totals.messagesSent || 0) / sessionSummaries.length).toFixed(1))
          : 0,
      followUpsScheduled: totals.followUps,
    },
    digitalBusinessCards: {
      created: cardsPlain.length,
      updatedThisWeek: cardsUpdatedThisWeek,
      sharedInSession: cardShares,
      templates: Math.max(3, uniqueTags.size || 0),
    },
    video: {
      averageQualityScore: averageVideoQuality,
      browserLoadShare: averageBrowserLoadShare,
      hostAnnouncements: totals.hostAnnouncements,
      failoverRate: averageFailoverRate,
    },
    showcase: {
      featured: featuredSession,
      librarySize: sessionSummaries.length,
      cardsAvailable: cardsPlain.length,
    },
  };
}

export async function getCompanyDashboard({ workspaceId, workspaceSlug, lookbackDays } = {}) {
  const selector = resolveWorkspaceSelector({ workspaceId, workspaceSlug });
  const lookback = clamp(lookbackDays, {
    min: MIN_LOOKBACK_DAYS,
    max: MAX_LOOKBACK_DAYS,
    fallback: 30,
  });

  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { selector, lookback });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const workspace = await fetchWorkspace(selector);
    const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);

    const [
      members,
      invites,
      notes,
      companyProfile,
      availableWorkspaces,
      storedOverview,
      pagesSnapshot,
    ] = await Promise.all([
      fetchMembers(workspace.id),
      fetchInvites(workspace.id),
      fetchNotes(workspace.id),
      CompanyProfile.findOne({ where: { userId: workspace.ownerId } }),
      listAvailableWorkspaces(),
      getCompanyDashboardOverview({ workspaceId: workspace.id }).catch(() => null),
      getWorkspacePageSnapshot({ workspaceId: workspace.id }).catch(() => null),
    ]);

    const [
      applications,
      jobs,
      gigs,
      projects,
      jobStages,
      jobApprovals,
      jobCampaigns,
      interviewSchedules,
      hiringAlerts,
      candidateSurveys,
      partnerEngagements,
      calendarEvents,
      brandAssets,
      brandSections,
      brandCampaigns,
      workforceSnapshots,
      workforceCohorts,
      internalPostings,
      employeeReferrals,
      careerPlans,
      compliancePolicies,
      complianceAudits,
      accessibilityAudits,
      partnerCommissions,
      partnerSlaSnapshots,
      partnerAgreements,
      partnerCollaborationEvents,
      partnerThreads,
      headhunterInvites,
      headhunterBriefs,
      headhunterAssignments,
      headhunterPerformanceSnapshots,
      headhunterCommissions,
      talentPools,
      talentPoolMembers,
      talentPoolEngagements,
      agencyCollaborations,
      agencyBillingEvents,
      agencyMentoringSessions,
      agencyMentoringPurchases,
      agencyMentorPreferences,
    ] = await Promise.all([
      fetchApplications({ workspaceId: workspace.id, since }),
      fetchJobs({ since }),
      fetchGigs({ since }),
      fetchProjects({ workspaceId: workspace.id, since }),
      fetchJobStagesData({ workspaceId: workspace.id }),
      fetchJobApprovals({ workspaceId: workspace.id, since }),
      fetchJobCampaigns({ workspaceId: workspace.id, since }),
      fetchInterviewSchedules({ workspaceId: workspace.id, since }),
      fetchHiringAlerts({ workspaceId: workspace.id, since }),
      fetchCandidateSurveys({ workspaceId: workspace.id, since }),
      fetchPartnerEngagements({ workspaceId: workspace.id, since }),
      fetchCalendarEvents({ workspaceId: workspace.id, since }),
      fetchBrandAssets({ workspaceId: workspace.id }),
      fetchEmployerBrandSections({ workspaceId: workspace.id }),
      fetchEmployerBrandCampaigns({ workspaceId: workspace.id, since }),
      fetchWorkforceSnapshots({ workspaceId: workspace.id, since }),
      fetchWorkforceCohorts({ workspaceId: workspace.id }),
      fetchInternalJobPostings({ workspaceId: workspace.id, since }),
      fetchEmployeeReferrals({ workspaceId: workspace.id, since }),
      fetchCareerPlans({ workspaceId: workspace.id }),
      fetchCompliancePolicies({ workspaceId: workspace.id }),
      fetchComplianceAudits({ workspaceId: workspace.id, since }),
      fetchAccessibilityAudits({ workspaceId: workspace.id, since }),
      fetchPartnerCommissions({ workspaceId: workspace.id, since }),
      fetchPartnerSlaSnapshots({ workspaceId: workspace.id, since }),
      fetchPartnerAgreements({ workspaceId: workspace.id }),
      fetchPartnerCollaborationEvents({ workspaceId: workspace.id, since }),
      fetchPartnerThreads({ workspaceId: workspace.id, since }),
      fetchHeadhunterInvites({ workspaceId: workspace.id, since }),
      fetchHeadhunterBriefs({ workspaceId: workspace.id }),
      fetchHeadhunterAssignments({ workspaceId: workspace.id }),
      fetchHeadhunterPerformance({ workspaceId: workspace.id, since }),
      fetchHeadhunterCommissions({ workspaceId: workspace.id, since }),
      fetchTalentPools({ workspaceId: workspace.id }),
      fetchTalentPoolMembers({ workspaceId: workspace.id }),
      fetchTalentPoolEngagements({ workspaceId: workspace.id, since }),
      fetchAgencyCollaborations({ workspaceId: workspace.id }),
      fetchAgencyBillingEvents({ workspaceId: workspace.id, since }),
      fetchAgencyMentoringSessions({ workspaceId: workspace.id, since }),
      fetchAgencyMentoringPurchases({ workspaceId: workspace.id, since }),
      fetchAgencyMentorPreferences({ workspaceId: workspace.id }),
    ]);

    const agencyCollaborationIds = agencyCollaborations.map((collaboration) => collaboration.id).filter((id) => id != null);
    const agencyWorkspaceIds = agencyCollaborations
      .map((collaboration) => collaboration.agencyWorkspaceId ?? collaboration.agencyWorkspace?.id)
      .filter((id) => Number.isInteger(Number(id)))
      .map((id) => Number(id));

    const mentorshipMentorIds = collectMentorIdsForWorkspace({
      sessions: agencyMentoringSessions,
      purchases: agencyMentoringPurchases,
      preferences: agencyMentorPreferences,
    });

    const [
      agencyInvitations,
      agencyRateCards,
      agencySlaSnapshots,
      panelTemplates,
      prepPortals,
      interviewEvaluations,
      calibrationSessions,
      decisionTrackers,
      offerPackages,
      onboardingTasks,
      candidateCareTickets,
      interviewerAvailability,
      interviewReminders,
      brandStories,
      employerBenefits,
      employeeJourneys,
      workspaceIntegrations,
      calendarConnections,
      networkingSessions,
      networkingBusinessCards,
      mentorReviews,
    ] = await Promise.all([
      fetchAgencyInvitations({ collaborationIds: agencyCollaborationIds }),
      fetchAgencyRateCards({ agencyWorkspaceIds }),
      fetchAgencySlaSnapshots({ collaborationIds: agencyCollaborationIds, since }),
      fetchInterviewPanelTemplates({ workspaceId: workspace.id }),
      fetchCandidatePrepPortals({ workspaceId: workspace.id, since }),
      fetchInterviewEvaluations({ workspaceId: workspace.id, since }),
      fetchEvaluationCalibrationSessions({ workspaceId: workspace.id, since }),
      fetchDecisionTrackers({ workspaceId: workspace.id, since }),
      fetchOfferPackages({ workspaceId: workspace.id, since }),
      fetchOnboardingTasks({ workspaceId: workspace.id, since }),
      fetchCandidateCareTickets({ workspaceId: workspace.id, since }),
      fetchInterviewerAvailability({ workspaceId: workspace.id, since }),
      fetchInterviewReminders({ workspaceId: workspace.id, since }),
      fetchBrandStories({ workspaceId: workspace.id, since }),
      fetchEmployerBenefits({ workspaceId: workspace.id }),
      fetchEmployeeJourneys({ workspaceId: workspace.id }),
      fetchWorkspaceIntegrations({ workspaceId: workspace.id }),
      fetchCalendarConnections({ workspaceId: workspace.id }),
      fetchNetworkingSessionsForWorkspace({ workspaceId: workspace.id, since }),
      fetchNetworkingBusinessCardsForWorkspace({ workspaceId: workspace.id }),
      fetchMentorReviewsForMentors({ mentorIds: mentorshipMentorIds, since }),
    ]);

    const applicationIds = applications.map((application) => application.id);
    const [reviews, demographicSnapshots] = await Promise.all([
      fetchApplicationReviews({ applicationIds, since }),
      fetchCandidateSnapshots({ workspaceId: workspace.id, applicationIds, since }),
    ]);

    const partnerApplications = applications.filter((application) => {
      const metadata = normaliseMetadata(application.metadata);
      return (
        application.sourceChannel === 'agency' ||
        Boolean(
          metadata.partnerName ||
            metadata.agencyName ||
            metadata.headhunterName ||
            metadata.partnerWorkspaceId ||
            metadata.agencyWorkspaceId,
        )
      );
    });

    const applicantDirectory = await loadApplicants(partnerApplications);

    const memberSummary = buildMemberSummary(members);
    const inviteSummary = buildInviteSummary(invites);
    const jobSummary = buildJobSummary({ jobs, gigs });
    const pipelineSummary = buildPipelineSummary(applications);
    const projectSummary = buildProjectSummary(projects);
    const badges = deriveWorkspaceBadges({ memberSummary, pipelineSummary, projectSummary });

    const reviewScores = reviews.map((review) => (review.score == null ? null : Number(review.score))).filter((score) =>
      Number.isFinite(score),
    );

    const profile = sanitizeProfile(companyProfile);

    const workspaceSummary = sanitiseWorkspace(workspace, memberSummary, inviteSummary, badges);
    const memberships = buildMemberships(workspaceSummary);
    const recommendations = buildRecommendations({ memberSummary, pipelineSummary, inviteSummary });

    const partnerContactIds = new Set(notes.map((note) => note.subjectUserId));

    const partnerSummary = {
      engagedContacts: partnerContactIds.size,
      touchpoints: notes.length,
      pendingInvites: inviteSummary.pending,
      activeMembers: memberSummary.active,
    };

    const recentNotes = buildRecentNotes(notes);

    const offersAccepted = pipelineSummary.totals.hires;
    const offersExtended = pipelineSummary.totals.offers;
    const offers = {
      accepted: offersAccepted,
      extended: offersExtended,
      winRate: percentage(offersAccepted, offersExtended || pipelineSummary.totals.applications || 1),
    };

    const diversityMetrics = buildDiversityMetrics(demographicSnapshots);
    const alertsSummary = buildAlertsSummary(hiringAlerts);
    const interviewOperations = buildInterviewOperationsSummary({ schedules: interviewSchedules, reviews });
    const candidateExperience = buildCandidateExperienceSummary({ surveys: candidateSurveys });
    const jobDesign = buildJobDesignStudioSummary({
      approvals: jobApprovals,
      jobStages,
      jobSummary,
      alerts: alertsSummary,
    });
    const sourcing = buildSourcingSummary({ pipelineSummary, campaigns: jobCampaigns });
    const applicantRelationshipManager = buildApplicantRelationshipManagerSummary({
      surveys: candidateSurveys,
      pipelineSummary,
      partnerSummary,
    });
    const analyticsForecasting = buildAnalyticsForecastingSummary({ pipelineSummary, jobSummary, projectSummary });
    const interviewScheduler = buildInterviewSchedulerDetail({
      schedules: interviewSchedules,
      availability: interviewerAvailability,
      reminders: interviewReminders,
    });
    const panelTemplateSummary = buildPanelTemplateSummary({
      templates: panelTemplates,
      evaluations: interviewEvaluations,
    });
    const candidatePrep = buildCandidatePrepSummary({ portals: prepPortals });
    const evaluationWorkspaceSummary = buildEvaluationWorkspaceSummary({
      evaluations: interviewEvaluations,
      calibrationSessions,
      decisionTrackers,
    });
    const offerBridge = buildOfferBridgeDetail({ offerPackages, onboardingTasks });
    const candidateCareCenter = buildCandidateCareCenterSummary({
      tickets: candidateCareTickets,
      candidateExperience,
    });
    const jobLifecycle = buildJobLifecycleInsights({
      jobStages,
      approvals: jobApprovals,
      campaigns: jobCampaigns,
      pipelineSummary,
      jobSummary,
      applications,
      reviews,
      interviewSchedules,
      interviewScheduler,
      panelTemplates: panelTemplateSummary,
      candidatePrep,
      evaluationWorkspace: evaluationWorkspaceSummary,
      offerBridge,
      candidateCareCenter,
    });
    const partnerCollaborationDetails = buildPartnerCollaborationSummary({
      partnerSummary,
      engagements: partnerEngagements,
      partnerApplications,
      jobs,
      interviewSchedules,
      commissions: partnerCommissions,
      slaSnapshots: partnerSlaSnapshots,
      agreements: partnerAgreements,
      collaborationEvents: partnerCollaborationEvents,
      partnerThreads,
      notes,
      applicantDirectory,
      calendarEvents,
    });
    const headhunterProgram = buildHeadhunterProgramSummary({
      invites: headhunterInvites,
      briefs: headhunterBriefs,
      assignments: headhunterAssignments,
      performanceSnapshots: headhunterPerformanceSnapshots,
      commissions: headhunterCommissions,
      lookbackDays: lookback,
    });
    const talentPoolSummary = buildTalentPoolSummary({
      pools: talentPools,
      members: talentPoolMembers,
      engagements: talentPoolEngagements,
      lookbackDays: lookback,
    });
    const agencyCollaborationInsights = buildAgencyCollaborationInsights({
      collaborations: agencyCollaborations,
      invitations: agencyInvitations,
      rateCards: agencyRateCards,
      slaSnapshots: agencySlaSnapshots,
      billingEvents: agencyBillingEvents,
    });
    const timelineManagement = await getTimelineManagementSnapshot({
      workspaceId: workspace.id,
      lookbackDays: lookback,
      workspace,
    });
    const plainBrandAssets = brandAssets.map((asset) => (asset?.get ? asset.get({ plain: true }) : asset));
    const plainBrandSections = brandSections.map((section) => (section?.get ? section.get({ plain: true }) : section));
    const plainBrandCampaigns = brandCampaigns.map((campaign) => (campaign?.get ? campaign.get({ plain: true }) : campaign));
    const plainBrandStories = brandStories.map((story) => (story?.get ? story.get({ plain: true }) : story));
    const plainBenefits = employerBenefits.map((benefit) => (benefit?.get ? benefit.get({ plain: true }) : benefit));
    const plainEmployeeJourneys = employeeJourneys.map((journey) => (journey?.get ? journey.get({ plain: true }) : journey));
    const plainIntegrations = workspaceIntegrations.map((integration) =>
      integration?.get ? integration.get({ plain: true }) : integration,
    );
    const plainCalendarConnections = calendarConnections.map((connection) =>
      connection?.get ? connection.get({ plain: true }) : connection,
    );

    const brandIntelligence = buildBrandIntelligenceSummary({ profile, assets: plainBrandAssets, jobSummary });
    const employerBrandWorkforce = buildEmployerBrandWorkforceIntelligence({
      profile,
      sections: plainBrandSections,
      assets: plainBrandAssets,
      campaigns: plainBrandCampaigns,
      workforceSnapshots,
      workforceCohorts,
      internalPostings,
      referrals: employeeReferrals,
      careerPlans,
      policies: compliancePolicies,
      complianceAudits,
      accessibilityAudits,
    });
    const governance = buildGovernanceSummary({ approvals: jobApprovals, alerts: alertsSummary, workspace: workspaceSummary });
    const calendarDigest = buildCalendarDigest(calendarEvents);
    const employerBrandStudio = buildEmployerBrandStudioSummary({
      profile,
      assets: plainBrandAssets,
      stories: plainBrandStories,
      benefits: plainBenefits,
      pages: pagesSnapshot ?? undefined,
    });
    const employeeJourneysSummary = buildEmployeeJourneysSummary({
      journeys: plainEmployeeJourneys,
      memberSummary,
    });
    const networking = buildNetworkingDashboard({
      sessions: networkingSessions ?? [],
      cards: networkingBusinessCards ?? [],
    });
    const settingsGovernance = buildSettingsGovernanceDetails({
      governance,
      integrations: plainIntegrations,
      calendarConnections: plainCalendarConnections,
      memberSummary,
      inviteSummary,
      alerts: alertsSummary,
    });
    const mentorship = buildMentorshipSummary({
      sessions: agencyMentoringSessions,
      purchases: agencyMentoringPurchases,
      preferences: agencyMentorPreferences,
      reviews: mentorReviews,
      lookbackDays: lookback,
    });
    const creationStudioRaw = await getCreationStudioOverview({ workspaceId: workspace.id, limit: 16 });
    const creationStudio = enrichCreationStudioOverview(creationStudioRaw);
    if (creationStudio && mentorship) {
      creationStudio.mentorship = mentorship;
    }

    const brandAndPeople = {
      employerBrandStudio,
      employeeJourneys: employeeJourneysSummary,
      settingsGovernance,
    };
    const offerOnboarding = buildOfferAndOnboardingSummary({
      offers,
      candidateExperience,
      interviewOperations,
      applications,
      alerts: alertsSummary,
      offerBridge,
    });
    const candidateCare = buildCandidateCareSummary({
      candidateExperience,
      alerts: alertsSummary,
      candidateCareCenter,
    });

    const insights = {
      averageReviewScore: reviewScores.length ? average(reviewScores) : null,
      reviewSampleSize: reviewScores.length,
      candidateSources: pipelineSummary.bySource,
      topLocations: jobSummary.topLocations,
      diversityIndex: diversityMetrics.representationIndex,
      candidateNps: candidateExperience.nps,
    };

    const adKeywordHints = [
      ...(jobs.map((job) => job?.title).filter(Boolean) ?? []),
      ...(gigs.map((gig) => gig?.title).filter(Boolean) ?? []),
      workspaceSummary?.industryFocus ?? null,
    ].filter(Boolean);

    const jobIds = jobs
      .map((job) => {
        const value = job?.id ?? (typeof job?.get === 'function' ? job.get('id') : null);
        return Number.isInteger(Number(value)) ? Number(value) : null;
      })
      .filter((value) => value != null);

    const gigIds = gigs
      .map((gig) => {
        const value = gig?.id ?? (typeof gig?.get === 'function' ? gig.get('id') : null);
        return Number.isInteger(Number(value)) ? Number(value) : null;
      })
      .filter((value) => value != null);

    let volunteeringSummary = null;
    try {
      const volunteeringSnapshot = await getCompanyVolunteeringDashboard({
        workspaceId: workspace.id,
        lookbackDays: lookback,
      });
      volunteeringSummary = {
        summary: volunteeringSnapshot.summary,
        totals: volunteeringSnapshot.totals,
        permissions: volunteeringSnapshot.permissions,
        posts: (volunteeringSnapshot.posts ?? []).slice(0, 10),
      };
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Failed to load volunteering dashboard snapshot', error);
      }
    }

    const ads = await getAdDashboardSnapshot({
      surfaces: ['company_dashboard', 'global_dashboard'],
      context: {
        keywordHints: adKeywordHints,
        opportunityTargets: [
          ...(jobIds.length ? [{ targetType: 'job', ids: jobIds }] : []),
          ...(gigIds.length ? [{ targetType: 'gig', ids: gigIds }] : []),
        ],
      },
    });

    const overviewPreferences = storedOverview?.preferences ?? {};
    const locationPreference = overviewPreferences?.locationOverride
      ? buildLocationDetails(
          overviewPreferences.locationOverride.location ?? overviewPreferences.locationOverride.label ?? null,
          overviewPreferences.locationOverride.geoLocation ?? overviewPreferences.locationOverride.coordinates ?? null,
        )
      : null;

    const effectiveLocation = locationPreference ?? profile?.locationDetails ?? null;
    const timezone = effectiveLocation?.timezone ?? workspaceSummary?.timezone ?? workspace.timezone ?? 'UTC';

    let weatherSummary = null;
    const coordinates = effectiveLocation?.coordinates;
    if (coordinates?.latitude != null && coordinates?.longitude != null) {
      weatherSummary = await fetchWeatherSummary({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        timezone,
      });
    }

    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(now);

    let resolvedFollowerCount = storedOverview?.followerCount;
    if (resolvedFollowerCount == null) {
      const campaignSummary = employerBrandWorkforce?.profileStudio?.campaignSummary;
      if (campaignSummary?.totalFollowers != null) {
        resolvedFollowerCount = Number(campaignSummary.totalFollowers);
      }
    }

    const resolvedRating =
      storedOverview?.rating != null
        ? Number(storedOverview.rating)
        : insights.averageReviewScore != null
        ? Number(insights.averageReviewScore)
        : null;

    const ownerFullName =
      [workspaceSummary?.owner?.firstName, workspaceSummary?.owner?.lastName].filter(Boolean).join(' ').trim() || null;

    const resolvedGreetingName =
      storedOverview?.displayName ?? profile?.companyName ?? ownerFullName ?? workspaceSummary.name;

    const overviewPayload = {
      workspaceId: workspaceSummary.id,
      displayName: storedOverview?.displayName ?? profile?.companyName ?? workspaceSummary.name,
      greetingName: resolvedGreetingName,
      summary: storedOverview?.summary ?? null,
      avatarUrl: storedOverview?.avatarUrl ?? null,
      followerCount: Number.isFinite(Number(resolvedFollowerCount)) ? Number(resolvedFollowerCount) : 0,
      trustScore: storedOverview?.trustScore != null ? Number(storedOverview.trustScore) : null,
      rating: resolvedRating != null ? Number(resolvedRating.toFixed(2)) : null,
      preferences: overviewPreferences,
      location: effectiveLocation
        ? {
            displayName: effectiveLocation.displayName ?? effectiveLocation.location ?? null,
            shortName: effectiveLocation.shortName ?? null,
            timezone,
            coordinates: effectiveLocation.coordinates ?? null,
          }
        : {
            displayName: null,
            shortName: null,
            timezone,
            coordinates: null,
          },
      weather: weatherSummary,
      date: {
        iso: now.toISOString(),
        formatted: formattedDate,
        timezone,
      },
      lastEditedBy: storedOverview?.lastEditedBy ?? null,
      createdAt: storedOverview?.createdAt ?? null,
      updatedAt: storedOverview?.updatedAt ?? null,
    };

    return {
      meta: {
        lookbackDays: lookback,
        selectedWorkspaceId: workspace.id,
        availableWorkspaces,
        memberships,
      },
      workspace: workspaceSummary,
      profile,
      overview: overviewPayload,
      memberSummary,
      inviteSummary,
      jobSummary,
      pipelineSummary,
      projectSummary,
      partnerSummary,
      insights,
      diversity: diversityMetrics,
      alerts: alertsSummary,
      jobLifecycle,
      jobDesign,
      sourcing,
      applicantRelationshipManager,
      analyticsForecasting,
      interviewOperations,
      interviewExperience: {
        scheduler: interviewScheduler,
        panelTemplates: panelTemplateSummary,
        candidatePrep,
        evaluationWorkspace: evaluationWorkspaceSummary,
        offerBridge,
        candidateCareCenter,
      },
      candidateExperience,
      offerOnboarding,
      candidateCare,
      partnerCollaboration: partnerCollaborationDetails,
      partnerships: {
        headhunterProgram,
        talentPools: talentPoolSummary,
        agencyCollaboration: agencyCollaborationInsights,
      },
      volunteering: volunteeringSummary,
      brandIntelligence,
      creationStudio,
      employerBrandWorkforce,
      mentorship,
      governance,
      calendar: calendarDigest,
      networking,
      timelineManagement,
      brandAndPeople,
      reviews: {
        total: reviews.length,
        averageScore: insights.averageReviewScore,
      },
      offers,
      recommendations,
      memberships,
      recentNotes,
      ads,
      generatedAt: new Date().toISOString(),
    };
  });
}

export default {
  getCompanyDashboard,
};

