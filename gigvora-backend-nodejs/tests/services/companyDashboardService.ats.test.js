process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

import { jest } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cacheModulePath = path.resolve(__dirname, '../../src/utils/cache.js');
const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');
const messagingModelsModulePath = path.resolve(__dirname, '../../src/models/messagingModels.js');

const mockCacheRemember = jest.fn((key, ttl, resolver) => resolver());
const mockBuildCacheKey = jest.fn(() => 'cache-key');
const mockMessageThreadFindAll = jest.fn().mockResolvedValue([]);
const mockMessageFindAll = jest.fn().mockResolvedValue([]);

const ProviderWorkspace = { findOne: jest.fn(), findAll: jest.fn() };
const ProviderWorkspaceMember = { findAll: jest.fn() };
const ProviderWorkspaceInvite = { findAll: jest.fn() };
const ProviderContactNote = { findAll: jest.fn() };
const CompanyProfile = { findOne: jest.fn() };
const User = { findAll: jest.fn() };
const Profile = {};
const Job = { findAll: jest.fn() };
const Gig = { findAll: jest.fn() };
const Project = { findAll: jest.fn() };
const Application = { findAll: jest.fn() };
const ApplicationReview = { findAll: jest.fn() };
const HiringAlert = { findAll: jest.fn() };
const CandidateDemographicSnapshot = { findAll: jest.fn() };
const CandidateSatisfactionSurvey = { findAll: jest.fn() };
const InterviewSchedule = { findAll: jest.fn() };
const InterviewerAvailability = { findAll: jest.fn() };
const InterviewReminder = { findAll: jest.fn() };
const CandidatePrepPortal = { findAll: jest.fn() };
const InterviewEvaluation = { findAll: jest.fn() };
const EvaluationCalibrationSession = { findAll: jest.fn() };
const DecisionTracker = { findAll: jest.fn() };
const OfferPackage = { findAll: jest.fn() };
const OnboardingTask = { findAll: jest.fn() };
const CandidateCareTicket = { findAll: jest.fn() };
const JobStage = { findAll: jest.fn() };
const JobApprovalWorkflow = { findAll: jest.fn() };
const JobCampaignPerformance = { findAll: jest.fn() };
const PartnerEngagement = { findAll: jest.fn() };
const PartnerAgreement = { findAll: jest.fn() };
const PartnerCommissionModel = { findAll: jest.fn() };
const PartnerSlaSnapshot = { findAll: jest.fn() };
const PartnerCollaborationEvent = { findAll: jest.fn() };
const RecruitingCalendarEvent = { findAll: jest.fn() };
const WorkforceAnalyticsSnapshot = { findAll: jest.fn() };
const WorkforceCohortMetric = { findAll: jest.fn() };
const InternalJobPosting = { findAll: jest.fn() };
const EmployeeReferral = { findAll: jest.fn() };
const CareerPathingPlan = { findAll: jest.fn() };
const CompliancePolicy = { findAll: jest.fn() };
const ComplianceAuditLog = { findAll: jest.fn() };
const AccessibilityAudit = { findAll: jest.fn() };
const HeadhunterInvite = { findAll: jest.fn() };
const HeadhunterBrief = { findAll: jest.fn() };
const HeadhunterBriefAssignment = { findAll: jest.fn() };
const HeadhunterPerformanceSnapshot = { findAll: jest.fn() };
const HeadhunterCommission = { findAll: jest.fn() };
const TalentPool = { findAll: jest.fn() };
const TalentPoolMember = { findAll: jest.fn() };
const TalentPoolEngagement = { findAll: jest.fn() };
const AgencyCollaboration = { findAll: jest.fn() };
const AgencyCollaborationInvitation = { findAll: jest.fn() };
const AgencyRateCard = { findAll: jest.fn() };
const AgencySlaSnapshot = { findAll: jest.fn() };
const AgencyBillingEvent = { findAll: jest.fn() };
const AgencyMentoringSession = { findAll: jest.fn() };
const AgencyMentoringPurchase = { findAll: jest.fn() };
const AgencyMentorPreference = { findAll: jest.fn() };
const MentorReview = { findAll: jest.fn() };
const EmployeeJourneyProgram = { findAll: jest.fn() };
const NetworkingSession = { findAll: jest.fn() };
const NetworkingSessionSignup = { findAll: jest.fn() };
const NetworkingBusinessCard = { findAll: jest.fn() };
const WorkspaceIntegration = { findAll: jest.fn() };
const WorkspaceCalendarConnection = { findAll: jest.fn() };
const EmployerBrandAsset = { findAll: jest.fn() };
const EmployerBrandSection = { findAll: jest.fn() };
const EmployerBrandCampaign = { findAll: jest.fn() };
const EmployerBrandStory = { findAll: jest.fn() };
const EmployerBenefit = { findAll: jest.fn() };

await jest.unstable_mockModule(cacheModulePath, () => ({
  buildCacheKey: mockBuildCacheKey,
  appCache: { remember: mockCacheRemember },
}));

await jest.unstable_mockModule(modelsModulePath, () => {
  const registry = {};
  const ensureModel = () => ({
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
    count: jest.fn(),
  });

  const proxy = new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === '__esModule') {
          return true;
        }
        if (prop === 'default') {
          return proxy;
        }
        if (!Object.prototype.hasOwnProperty.call(registry, prop)) {
          registry[prop] = ensureModel();
        }
        return registry[prop];
      },
      set: (target, prop, value) => {
        registry[prop] = value;
        return true;
      },
      has: () => true,
      ownKeys: () => Reflect.ownKeys(registry),
      getOwnPropertyDescriptor: (target, prop) => {
        if (!Object.prototype.hasOwnProperty.call(registry, prop)) {
          registry[prop] = ensureModel();
        }
        return {
          configurable: true,
          enumerable: true,
          value: registry[prop],
          writable: true,
        };
      },
    },
  );

  const modelsFilePath = path.resolve(__dirname, '../../src/models/index.js');
  const modelsSource = fs.readFileSync(modelsFilePath, 'utf8');
  const exportNameMatches = [...modelsSource.matchAll(/export const (\w+)/g)];
  const exportClassMatches = [...modelsSource.matchAll(/export class (\w+)/g)];
  const exportFunctionMatches = [...modelsSource.matchAll(/export function (\w+)/g)];
  const reExportMatches = [...modelsSource.matchAll(/export \{([^}]+)\}/g)];

  exportNameMatches.forEach(([, name]) => {
    if (!Object.prototype.hasOwnProperty.call(registry, name)) {
      registry[name] = ensureModel();
    }
  });

  exportClassMatches.forEach(([, name]) => {
    if (!Object.prototype.hasOwnProperty.call(registry, name)) {
      registry[name] = ensureModel();
    }
  });

  exportFunctionMatches.forEach(([, name]) => {
    if (!Object.prototype.hasOwnProperty.call(registry, name)) {
      registry[name] = ensureModel();
    }
  });

  reExportMatches.forEach(([, block]) => {
    block
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .forEach((segment) => {
        const alias = segment.includes(' as ')
          ? segment.split(' as ')[1].trim()
          : segment;
        if (!Object.prototype.hasOwnProperty.call(registry, alias)) {
          registry[alias] = ensureModel();
        }
      });
  });

  proxy.ProviderWorkspace = ProviderWorkspace;
  proxy.ProviderWorkspaceMember = ProviderWorkspaceMember;
  proxy.ProviderWorkspaceInvite = ProviderWorkspaceInvite;
  proxy.ProviderContactNote = ProviderContactNote;
  proxy.CompanyProfile = CompanyProfile;
  proxy.User = User;
  proxy.Profile = Profile;
  proxy.Job = Job;
  proxy.Gig = Gig;
  proxy.Project = Project;
  proxy.Application = Application;
  proxy.ApplicationReview = ApplicationReview;
  proxy.HiringAlert = HiringAlert;
  proxy.CandidateDemographicSnapshot = CandidateDemographicSnapshot;
  proxy.CandidateSatisfactionSurvey = CandidateSatisfactionSurvey;
  proxy.InterviewSchedule = InterviewSchedule;
  proxy.InterviewerAvailability = InterviewerAvailability;
  proxy.InterviewReminder = InterviewReminder;
  proxy.CandidatePrepPortal = CandidatePrepPortal;
  proxy.InterviewEvaluation = InterviewEvaluation;
  proxy.EvaluationCalibrationSession = EvaluationCalibrationSession;
  proxy.DecisionTracker = DecisionTracker;
  proxy.OfferPackage = OfferPackage;
  proxy.OnboardingTask = OnboardingTask;
  proxy.CandidateCareTicket = CandidateCareTicket;
  proxy.JobStage = JobStage;
  proxy.JobApprovalWorkflow = JobApprovalWorkflow;
  proxy.JobCampaignPerformance = JobCampaignPerformance;
  proxy.PartnerEngagement = PartnerEngagement;
  proxy.PartnerAgreement = PartnerAgreement;
  proxy.PartnerCommission = PartnerCommissionModel;
  proxy.PartnerSlaSnapshot = PartnerSlaSnapshot;
  proxy.PartnerCollaborationEvent = PartnerCollaborationEvent;
  proxy.RecruitingCalendarEvent = RecruitingCalendarEvent;
  proxy.WorkforceAnalyticsSnapshot = WorkforceAnalyticsSnapshot;
  proxy.WorkforceCohortMetric = WorkforceCohortMetric;
  proxy.InternalJobPosting = InternalJobPosting;
  proxy.EmployeeReferral = EmployeeReferral;
  proxy.CareerPathingPlan = CareerPathingPlan;
  proxy.CompliancePolicy = CompliancePolicy;
  proxy.ComplianceAuditLog = ComplianceAuditLog;
  proxy.AccessibilityAudit = AccessibilityAudit;
  proxy.HeadhunterInvite = HeadhunterInvite;
  proxy.HeadhunterBrief = HeadhunterBrief;
  proxy.HeadhunterBriefAssignment = HeadhunterBriefAssignment;
  proxy.HeadhunterPerformanceSnapshot = HeadhunterPerformanceSnapshot;
  proxy.HeadhunterCommission = HeadhunterCommission;
  proxy.TalentPool = TalentPool;
  proxy.TalentPoolMember = TalentPoolMember;
  proxy.TalentPoolEngagement = TalentPoolEngagement;
  proxy.AgencyCollaboration = AgencyCollaboration;
  proxy.AgencyCollaborationInvitation = AgencyCollaborationInvitation;
  proxy.AgencyRateCard = AgencyRateCard;
  proxy.AgencySlaSnapshot = AgencySlaSnapshot;
  proxy.AgencyBillingEvent = AgencyBillingEvent;
  proxy.AgencyMentoringSession = AgencyMentoringSession;
  proxy.AgencyMentoringPurchase = AgencyMentoringPurchase;
  proxy.AgencyMentorPreference = AgencyMentorPreference;
  proxy.MentorReview = MentorReview;
  proxy.EmployeeJourneyProgram = EmployeeJourneyProgram;
  proxy.NetworkingSession = NetworkingSession;
  proxy.NetworkingSessionSignup = NetworkingSessionSignup;
  proxy.NetworkingBusinessCard = NetworkingBusinessCard;
  proxy.WorkspaceIntegration = WorkspaceIntegration;
  proxy.WorkspaceCalendarConnection = WorkspaceCalendarConnection;
  proxy.EmployerBrandAsset = EmployerBrandAsset;
  proxy.EmployerBrandSection = EmployerBrandSection;
  proxy.EmployerBrandCampaign = EmployerBrandCampaign;
  proxy.EmployerBrandStory = EmployerBrandStory;
  proxy.EmployerBenefit = EmployerBenefit;

  proxy.VolunteerApplication = ensureModel();
  proxy.LaunchpadApplication = ensureModel();
  proxy.GigApplication = ensureModel();

  proxy.default = proxy;

  return proxy;
});

await jest.unstable_mockModule(messagingModelsModulePath, () => ({
  MessageThread: { findAll: mockMessageThreadFindAll },
  Message: { findAll: mockMessageFindAll },
}));

const { getCompanyDashboard } = await import('../../src/services/companyDashboardService.js');

const ownerPlain = {
  id: 401,
  firstName: 'Mia',
  lastName: 'Operations',
  email: 'mia@gigvora.com',
};

const workspacePlain = {
  id: 101,
  slug: 'lumen-analytics-ats',
  ownerId: ownerPlain.id,
  name: 'Lumen Analytics Talent',
  type: 'company',
  timezone: 'America/New_York',
  defaultCurrency: 'USD',
  intakeEmail: 'talent@lumen-analytics.test',
  isActive: true,
  createdAt: '2024-08-01T00:00:00Z',
  updatedAt: '2024-08-01T00:00:00Z',
};

const workspaceInstance = {
  ...workspacePlain,
  owner: {
    ...ownerPlain,
    get: ({ plain }) => (plain ? { ...ownerPlain } : ownerPlain),
  },
  get: ({ plain }) => (plain ? { ...workspacePlain } : workspacePlain),
};

const departmentMetadata = (departmentId, departmentLabel, recruiterId, recruiterName) => ({
  departmentId,
  departmentName: departmentLabel,
  departmentLabel,
  team: departmentLabel,
  companyWorkspaceId: workspacePlain.id,
  workspaceId: workspacePlain.id,
  assignedRecruiterId: recruiterId,
  assignedRecruiterName: recruiterName,
  recruiter: { id: recruiterId, name: recruiterName },
});

const applications = [
  {
    id: 1001,
    applicantId: 501,
    targetType: 'job',
    targetId: 777,
    status: 'hired',
    sourceChannel: 'web',
    submittedAt: '2024-08-01T12:00:00Z',
    decisionAt: '2024-08-10T15:30:00Z',
    createdAt: '2024-08-01T12:00:00Z',
    updatedAt: '2024-08-10T15:30:00Z',
    metadata: departmentMetadata('strategic-ops', 'Strategic Operations', 'riley-recruiter', 'Riley Recruiter'),
  },
  {
    id: 1002,
    applicantId: 502,
    targetType: 'job',
    targetId: 777,
    status: 'hired',
    sourceChannel: 'referral',
    submittedAt: '2024-08-02T13:20:00Z',
    decisionAt: '2024-08-12T16:45:00Z',
    createdAt: '2024-08-02T13:20:00Z',
    updatedAt: '2024-08-12T16:45:00Z',
    metadata: departmentMetadata('revenue-ops', 'Revenue Operations', 'sasha-talent', 'Sasha Talent Partner'),
  },
  {
    id: 1003,
    applicantId: 503,
    targetType: 'job',
    targetId: 777,
    status: 'hired',
    sourceChannel: 'web',
    submittedAt: '2024-08-03T09:00:00Z',
    decisionAt: '2024-08-15T18:10:00Z',
    createdAt: '2024-08-03T09:00:00Z',
    updatedAt: '2024-08-15T18:10:00Z',
    metadata: departmentMetadata('strategic-ops', 'Strategic Operations', 'riley-recruiter', 'Riley Recruiter'),
  },
  {
    id: 1004,
    applicantId: 504,
    targetType: 'job',
    targetId: 777,
    status: 'rejected',
    sourceChannel: 'web',
    submittedAt: '2024-08-04T15:15:00Z',
    decisionAt: '2024-08-09T10:25:00Z',
    createdAt: '2024-08-04T15:15:00Z',
    updatedAt: '2024-08-09T10:25:00Z',
    metadata: departmentMetadata('strategic-ops', 'Strategic Operations', 'riley-recruiter', 'Riley Recruiter'),
  },
  {
    id: 1005,
    applicantId: 505,
    targetType: 'job',
    targetId: 777,
    status: 'interview',
    sourceChannel: 'agency',
    submittedAt: '2024-08-05T17:45:00Z',
    decisionAt: null,
    createdAt: '2024-08-05T17:45:00Z',
    updatedAt: '2024-08-07T10:00:00Z',
    metadata: departmentMetadata('revenue-ops', 'Revenue Operations', 'sasha-talent', 'Sasha Talent Partner'),
  },
  {
    id: 1006,
    applicantId: 506,
    targetType: 'job',
    targetId: 777,
    status: 'offered',
    sourceChannel: 'web',
    submittedAt: '2024-08-06T12:50:00Z',
    decisionAt: null,
    createdAt: '2024-08-06T12:50:00Z',
    updatedAt: '2024-08-12T12:00:00Z',
    metadata: departmentMetadata('revenue-ops', 'Revenue Operations', 'sasha-talent', 'Sasha Talent Partner'),
  },
];

const demographicSnapshots = [
  { id: 1, applicationId: 1001, workspaceId: 101, genderIdentity: 'Female', ethnicity: 'Hispanic or Latino', veteranStatus: 'non_veteran', disabilityStatus: 'not_disclosed', capturedAt: '2024-08-01T12:00:00Z' },
  { id: 2, applicationId: 1002, workspaceId: 101, genderIdentity: 'Male', ethnicity: 'Black or African American', veteranStatus: 'veteran', disabilityStatus: 'not_disclosed', capturedAt: '2024-08-02T13:20:00Z' },
  { id: 3, applicationId: 1003, workspaceId: 101, genderIdentity: 'Female', ethnicity: 'Asian', veteranStatus: 'non_veteran', disabilityStatus: 'not_disclosed', capturedAt: '2024-08-03T09:00:00Z' },
  { id: 4, applicationId: 1004, workspaceId: 101, genderIdentity: 'Female', ethnicity: 'White', veteranStatus: 'non_veteran', disabilityStatus: 'not_disclosed', capturedAt: '2024-08-04T15:15:00Z' },
  { id: 5, applicationId: 1005, workspaceId: 101, genderIdentity: 'Male', ethnicity: 'White', veteranStatus: 'non_veteran', disabilityStatus: 'not_disclosed', capturedAt: '2024-08-05T17:45:00Z' },
  { id: 6, applicationId: 1006, workspaceId: 101, genderIdentity: 'Male', ethnicity: 'Hispanic or Latino', veteranStatus: 'non_veteran', disabilityStatus: 'self_identified', capturedAt: '2024-08-06T12:50:00Z' },
];

const surveyResponses = [
  {
    id: 1,
    workspaceId: 101,
    applicationId: 1001,
    stage: 'hired',
    score: 8,
    npsRating: 9,
    sentiment: 'positive',
    followUpScheduledAt: '2024-08-18T14:00:00Z',
    responseAt: '2024-08-11T10:00:00Z',
    notes: 'Great experience',
    metadata: {},
  },
  {
    id: 2,
    workspaceId: 101,
    applicationId: 1002,
    stage: 'hired',
    score: 7,
    npsRating: 8,
    sentiment: 'positive',
    followUpScheduledAt: null,
    responseAt: '2024-08-13T09:30:00Z',
    notes: 'Panel could be clearer',
    metadata: {},
  },
  {
    id: 3,
    workspaceId: 101,
    applicationId: 1003,
    stage: 'hired',
    score: 9,
    npsRating: 10,
    sentiment: 'positive',
    followUpScheduledAt: null,
    responseAt: '2024-08-16T11:20:00Z',
    notes: 'Loved the structured rubric',
    metadata: {},
  },
];

const interviewSchedules = [
  {
    id: 9001,
    workspaceId: 101,
    applicationId: 1001,
    interviewStage: 'panel',
    scheduledAt: '2024-08-09T17:00:00Z',
    completedAt: '2024-08-09T18:00:00Z',
    durationMinutes: 60,
    rescheduleCount: 0,
    interviewerRoster: [
      { name: 'Riley Recruiter', email: 'recruiter@gigvora.com', timezone: 'America/New_York' },
      { name: 'Sam Hiring Manager', email: 'sam@gigvora.com', timezone: 'America/Chicago' },
    ],
    metadata: {},
  },
  {
    id: 9002,
    workspaceId: 101,
    applicationId: 1002,
    interviewStage: 'panel',
    scheduledAt: '2024-08-10T15:30:00Z',
    completedAt: '2024-08-10T16:15:00Z',
    durationMinutes: 45,
    rescheduleCount: 1,
    interviewerRoster: [{ name: 'Sasha Talent Partner', email: 'sasha@gigvora.com', timezone: 'America/Denver' }],
    metadata: {},
  },
  {
    id: 9003,
    workspaceId: 101,
    applicationId: 1006,
    interviewStage: 'panel',
    scheduledAt: '2024-08-12T14:00:00Z',
    completedAt: null,
    durationMinutes: 50,
    rescheduleCount: 0,
    interviewerRoster: [{ name: 'Alex Ops Lead', email: 'alex@gigvora.com', timezone: 'America/New_York' }],
    metadata: {},
  },
];

const stageRecords = [
  {
    id: 201,
    workspaceId: 101,
    jobId: 777,
    name: 'Application Review',
    orderIndex: 1,
    slaHours: 24,
    averageDurationHours: 40,
    guideUrl: null,
    metadata: { stageKey: 'screen', automations: ['resume_scoring'] },
  },
  {
    id: 202,
    workspaceId: 101,
    jobId: 777,
    name: 'Team Interview',
    orderIndex: 2,
    slaHours: 72,
    averageDurationHours: 65,
    guideUrl: null,
    metadata: { stageKey: 'interview' },
  },
];

const approvals = [
  {
    id: 301,
    workspaceId: 101,
    jobId: 777,
    approverRole: 'Finance partner',
    status: 'pending',
    dueAt: '2024-08-05T15:00:00Z',
    createdAt: '2024-08-01T12:00:00Z',
    updatedAt: '2024-08-02T12:00:00Z',
    metadata: {},
  },
  {
    id: 302,
    workspaceId: 101,
    jobId: 777,
    approverRole: 'Hiring executive',
    status: 'approved',
    dueAt: '2024-08-03T18:00:00Z',
    completedAt: '2024-08-02T19:30:00Z',
    createdAt: '2024-08-01T14:00:00Z',
    updatedAt: '2024-08-02T19:30:00Z',
    metadata: {},
  },
];

const stageReviews = [
  { id: 1, applicationId: 1001, stage: 'screen', decision: 'advance', score: 4, decidedAt: '2024-08-08T12:00:00Z', createdAt: '2024-08-02T12:00:00Z', updatedAt: '2024-08-08T12:00:00Z' },
  { id: 2, applicationId: 1002, stage: 'screen', decision: 'advance', score: 3, decidedAt: '2024-08-09T12:00:00Z', createdAt: '2024-08-03T12:00:00Z', updatedAt: '2024-08-09T12:00:00Z' },
  { id: 3, applicationId: 1003, stage: 'screen', decision: 'reject', score: 2, decidedAt: '2024-08-06T12:00:00Z', createdAt: '2024-08-04T12:00:00Z', updatedAt: '2024-08-06T12:00:00Z' },
  { id: 4, applicationId: 1004, stage: 'screen', decision: 'reject', score: 1, decidedAt: '2024-08-06T16:00:00Z', createdAt: '2024-08-05T12:00:00Z', updatedAt: '2024-08-06T16:00:00Z' },
  { id: 5, applicationId: 1005, stage: 'screen', decision: 'hold', score: 3, decidedAt: null, createdAt: '2024-08-06T12:00:00Z', updatedAt: '2024-08-08T09:00:00Z' },
  { id: 6, applicationId: 1006, stage: 'screen', decision: 'reject', score: 2, decidedAt: '2024-08-07T12:00:00Z', createdAt: '2024-08-06T18:00:00Z', updatedAt: '2024-08-07T12:00:00Z' },
  { id: 7, applicationId: 1001, stage: 'interview', decision: 'advance', score: 4, decidedAt: '2024-08-14T16:00:00Z', createdAt: '2024-08-10T10:00:00Z', updatedAt: '2024-08-14T16:00:00Z' },
  { id: 8, applicationId: 1002, stage: 'interview', decision: 'reject', score: 2, decidedAt: '2024-08-14T16:00:00Z', createdAt: '2024-08-11T10:00:00Z', updatedAt: '2024-08-14T16:00:00Z' },
  { id: 9, applicationId: 1006, stage: 'interview', decision: 'advance', score: 3, decidedAt: '2024-08-14T16:00:00Z', createdAt: '2024-08-12T10:00:00Z', updatedAt: '2024-08-14T16:00:00Z' },
];

const memberRecords = [
  {
    id: 1,
    workspaceId: 101,
    status: 'active',
    joinedAt: '2024-06-01T12:00:00Z',
    member: {
      id: 501,
      firstName: 'Riley',
      lastName: 'Recruiter',
      email: 'recruiter@gigvora.com',
      Profile: {
        availabilityStatus: 'available',
        availableHoursPerWeek: 30,
        timezone: 'America/New_York',
      },
    },
  },
  {
    id: 2,
    workspaceId: 101,
    status: 'pending',
    joinedAt: '2024-07-15T12:00:00Z',
    member: {
      id: 502,
      firstName: 'Sasha',
      lastName: 'Talent',
      email: 'sasha@gigvora.com',
      Profile: {
        availabilityStatus: 'engaged',
        availableHoursPerWeek: 40,
        timezone: 'America/Denver',
      },
    },
  },
];

const applicantRecords = [
  {
    id: 501,
    firstName: 'Jordan',
    lastName: 'Chen',
    email: 'jordan.chen@example.com',
    Profile: { headline: 'Revenue systems analyst', location: 'New York, NY', availabilityStatus: 'hired' },
    get: ({ plain }) =>
      plain
        ? {
            id: 501,
            firstName: 'Jordan',
            lastName: 'Chen',
            email: 'jordan.chen@example.com',
            Profile: { headline: 'Revenue systems analyst', location: 'New York, NY', availabilityStatus: 'hired' },
          }
        : null,
  },
  {
    id: 502,
    firstName: 'Amelia',
    lastName: 'Stone',
    email: 'amelia.stone@example.com',
    Profile: { headline: 'Strategic programs lead', location: 'Denver, CO', availabilityStatus: 'hired' },
    get: ({ plain }) =>
      plain
        ? {
            id: 502,
            firstName: 'Amelia',
            lastName: 'Stone',
            email: 'amelia.stone@example.com',
            Profile: { headline: 'Strategic programs lead', location: 'Denver, CO', availabilityStatus: 'hired' },
          }
        : null,
  },
  {
    id: 503,
    firstName: 'Priya',
    lastName: 'Mehta',
    email: 'priya.mehta@example.com',
    Profile: { headline: 'Automation specialist', location: 'Austin, TX', availabilityStatus: 'hired' },
    get: ({ plain }) =>
      plain
        ? {
            id: 503,
            firstName: 'Priya',
            lastName: 'Mehta',
            email: 'priya.mehta@example.com',
            Profile: { headline: 'Automation specialist', location: 'Austin, TX', availabilityStatus: 'hired' },
          }
        : null,
  },
  {
    id: 504,
    firstName: 'Devon',
    lastName: 'Hart',
    email: 'devon.hart@example.com',
    Profile: { headline: 'Process engineer', location: 'Remote', availabilityStatus: 'closed' },
    get: ({ plain }) =>
      plain
        ? {
            id: 504,
            firstName: 'Devon',
            lastName: 'Hart',
            email: 'devon.hart@example.com',
            Profile: { headline: 'Process engineer', location: 'Remote', availabilityStatus: 'closed' },
          }
        : null,
  },
  {
    id: 505,
    firstName: 'Luis',
    lastName: 'Gonzalez',
    email: 'luis.gonzalez@example.com',
    Profile: { headline: 'Sales operations specialist', location: 'Chicago, IL', availabilityStatus: 'interview' },
    get: ({ plain }) =>
      plain
        ? {
            id: 505,
            firstName: 'Luis',
            lastName: 'Gonzalez',
            email: 'luis.gonzalez@example.com',
            Profile: { headline: 'Sales operations specialist', location: 'Chicago, IL', availabilityStatus: 'interview' },
          }
        : null,
  },
  {
    id: 506,
    firstName: 'Sofia',
    lastName: 'Martinez',
    email: 'sofia.martinez@example.com',
    Profile: { headline: 'Automation analyst', location: 'Remote', availabilityStatus: 'offer' },
    get: ({ plain }) =>
      plain
        ? {
            id: 506,
            firstName: 'Sofia',
            lastName: 'Martinez',
            email: 'sofia.martinez@example.com',
            Profile: { headline: 'Automation analyst', location: 'Remote', availabilityStatus: 'offer' },
          }
        : null,
  },
];

const resetMocks = () => {
  mockCacheRemember.mockClear();
  mockBuildCacheKey.mockClear();
  mockMessageThreadFindAll.mockClear();
  mockMessageThreadFindAll.mockResolvedValue([]);
  mockMessageFindAll.mockClear();
  mockMessageFindAll.mockResolvedValue([]);
  User.findAll.mockClear();

  ProviderWorkspace.findOne.mockResolvedValue(workspaceInstance);
  ProviderWorkspace.findAll.mockResolvedValue([
    {
      get: ({ plain }) => (plain ? { id: workspacePlain.id, name: workspacePlain.name, slug: workspacePlain.slug } : null),
    },
  ]);

  ProviderWorkspaceMember.findAll.mockResolvedValue(memberRecords);
  ProviderWorkspaceInvite.findAll.mockResolvedValue([]);
  ProviderContactNote.findAll.mockResolvedValue([]);

  CompanyProfile.findOne.mockResolvedValue({
    get: ({ plain }) =>
      plain
        ? {
            companyName: 'Lumen Analytics',
            description: 'Enterprise hiring command center',
            website: 'https://lumen.example.com',
          }
        : null,
  });

  User.findAll.mockResolvedValue(applicantRecords);

  Job.findAll.mockResolvedValue([]);
  Gig.findAll.mockResolvedValue([]);
  Project.findAll.mockResolvedValue([]);

  Application.findAll.mockResolvedValue(applications);
  ApplicationReview.findAll.mockResolvedValue(stageReviews);
  HiringAlert.findAll.mockResolvedValue([]);
  CandidateDemographicSnapshot.findAll.mockResolvedValue(demographicSnapshots);
  CandidateSatisfactionSurvey.findAll.mockResolvedValue(surveyResponses);
  InterviewSchedule.findAll.mockResolvedValue(interviewSchedules);
  InterviewerAvailability.findAll.mockResolvedValue([]);
  InterviewReminder.findAll.mockResolvedValue([]);
  CandidatePrepPortal.findAll.mockResolvedValue([]);
  InterviewEvaluation.findAll.mockResolvedValue([]);
  EvaluationCalibrationSession.findAll.mockResolvedValue([]);
  DecisionTracker.findAll.mockResolvedValue([]);
  OfferPackage.findAll.mockResolvedValue([]);
  OnboardingTask.findAll.mockResolvedValue([]);
  CandidateCareTicket.findAll.mockResolvedValue([]);
  JobStage.findAll.mockResolvedValue(stageRecords);
  JobApprovalWorkflow.findAll.mockResolvedValue(approvals);
  JobCampaignPerformance.findAll.mockResolvedValue([]);
  PartnerEngagement.findAll.mockResolvedValue([]);
  PartnerAgreement.findAll.mockResolvedValue([]);
  PartnerCommissionModel.findAll.mockResolvedValue([]);
  PartnerSlaSnapshot.findAll.mockResolvedValue([]);
  PartnerCollaborationEvent.findAll.mockResolvedValue([]);
  RecruitingCalendarEvent.findAll.mockResolvedValue([]);
  WorkforceAnalyticsSnapshot.findAll.mockResolvedValue([]);
  WorkforceCohortMetric.findAll.mockResolvedValue([]);
  InternalJobPosting.findAll.mockResolvedValue([]);
  EmployeeReferral.findAll.mockResolvedValue([]);
  CareerPathingPlan.findAll.mockResolvedValue([]);
  CompliancePolicy.findAll.mockResolvedValue([]);
  ComplianceAuditLog.findAll.mockResolvedValue([]);
  AccessibilityAudit.findAll.mockResolvedValue([]);
  HeadhunterInvite.findAll.mockResolvedValue([]);
  HeadhunterBrief.findAll.mockResolvedValue([]);
  HeadhunterBriefAssignment.findAll.mockResolvedValue([]);
  HeadhunterPerformanceSnapshot.findAll.mockResolvedValue([]);
  HeadhunterCommission.findAll.mockResolvedValue([]);
  TalentPool.findAll.mockResolvedValue([]);
  TalentPoolMember.findAll.mockResolvedValue([]);
  TalentPoolEngagement.findAll.mockResolvedValue([]);
  AgencyCollaboration.findAll.mockResolvedValue([]);
  AgencyCollaborationInvitation.findAll.mockResolvedValue([]);
  AgencyRateCard.findAll.mockResolvedValue([]);
  AgencySlaSnapshot.findAll.mockResolvedValue([]);
  AgencyBillingEvent.findAll.mockResolvedValue([]);
  AgencyMentoringSession.findAll.mockResolvedValue([]);
  AgencyMentoringPurchase.findAll.mockResolvedValue([]);
  AgencyMentorPreference.findAll.mockResolvedValue([]);
  MentorReview.findAll.mockResolvedValue([]);
  EmployeeJourneyProgram.findAll.mockResolvedValue([]);
  NetworkingSession.findAll.mockResolvedValue([]);
  NetworkingSessionSignup.findAll.mockResolvedValue([]);
  NetworkingBusinessCard.findAll.mockResolvedValue([]);
  WorkspaceIntegration.findAll.mockResolvedValue([]);
  WorkspaceCalendarConnection.findAll.mockResolvedValue([]);
  EmployerBrandAsset.findAll.mockResolvedValue([]);
  EmployerBrandSection.findAll.mockResolvedValue([]);
  EmployerBrandCampaign.findAll.mockResolvedValue([]);
  EmployerBrandStory.findAll.mockResolvedValue([]);
  EmployerBenefit.findAll.mockResolvedValue([]);
};

beforeEach(() => {
  resetMocks();
});

describe('companyDashboardService ATS fairness integration', () => {
  it('computes fairness analytics and lifecycle segmentation from live records', async () => {
    const result = await getCompanyDashboard({ workspaceId: workspacePlain.id, lookbackDays: 90 });

    expect(result.jobLifecycle).toBeTruthy();
    expect(result.jobLifecycle.fairness.score).toBeCloseTo(0.5, 3);
    expect(result.jobLifecycle.fairness.parityGap).toBeCloseTo(0.333, 3);
    expect(result.jobLifecycle.fairness.statusLabel).toBe('Bias alert');

    const flaggedStages = result.jobLifecycle.fairness.flaggedStages;
    expect(flaggedStages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Application Review', reason: 'Low advance rate' }),
      ]),
    );

    expect(result.jobLifecycle.atsHealth.automationCoverage).toBe(50);
    expect(result.candidateExperience.inclusionScore).toBe(50);

    const femaleSegment = result.jobLifecycle.fairness.segments.find((segment) => segment.label === 'Female');
    const maleSegment = result.jobLifecycle.fairness.segments.find((segment) => segment.label === 'Male');

    expect(femaleSegment).toBeDefined();
    expect(femaleSegment.sampleSize).toBe(3);
    expect(femaleSegment.score).toBeCloseTo(2 / 3, 3);

    expect(maleSegment).toBeDefined();
    expect(maleSegment.sampleSize).toBe(3);
    expect(maleSegment.score).toBeCloseTo(1 / 3, 3);

    const departmentMetrics = result.jobLifecycle.departmentMetrics;
    const strategicOps = departmentMetrics.find((segment) => segment.id.includes('strategic-ops'));
    const revenueOps = departmentMetrics.find((segment) => segment.id.includes('revenue-ops'));

    expect(strategicOps.metrics.applications).toBe(3);
    expect(strategicOps.metrics.hires).toBe(2);
    expect(revenueOps.metrics.applications).toBe(3);
    expect(revenueOps.metrics.hires).toBe(1);
  });
});
