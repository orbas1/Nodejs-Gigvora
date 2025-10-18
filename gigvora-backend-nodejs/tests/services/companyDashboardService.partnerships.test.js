import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockCacheRemember = jest.fn((key, ttl, resolver) => resolver());
const mockBuildCacheKey = jest.fn(() => 'cache-key');

const cacheModulePath = path.resolve(__dirname, '../../src/utils/cache.js');
const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');
const messagingModelsModulePath = path.resolve(__dirname, '../../src/models/messagingModels.js');

const ProviderWorkspace = { findOne: jest.fn(), findAll: jest.fn() };
const ProviderWorkspaceMember = { findAll: jest.fn() };
const ProviderWorkspaceInvite = { findAll: jest.fn() };
const ProviderContactNote = { findAll: jest.fn() };
const CompanyProfile = { findOne: jest.fn() };
const User = {};
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
const JobStage = { findAll: jest.fn() };
const JobApprovalWorkflow = { findAll: jest.fn() };
const JobCampaignPerformance = { findAll: jest.fn() };
const PartnerEngagement = { findAll: jest.fn() };
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
const AgencyRateCardItem = {};
const AgencySlaSnapshot = { findAll: jest.fn() };
const AgencyBillingEvent = { findAll: jest.fn() };
const RecruitingCalendarEvent = { findAll: jest.fn() };
const EmployerBrandAsset = { findAll: jest.fn() };
const MessageThread = { findAll: jest.fn() };
const Message = {};

await jest.unstable_mockModule(cacheModulePath, () => ({
  buildCacheKey: mockBuildCacheKey,
  appCache: { remember: mockCacheRemember },
}));

await jest.unstable_mockModule(modelsModulePath, () => ({
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
  InterviewSchedule,
  JobStage,
  JobApprovalWorkflow,
  JobCampaignPerformance,
  PartnerEngagement,
  HeadhunterInvite,
  HeadhunterBrief,
  HeadhunterBriefAssignment,
  HeadhunterPerformanceSnapshot,
  HeadhunterCommission,
  TalentPool,
  TalentPoolMember,
  TalentPoolEngagement,
  AgencyCollaboration,
  AgencyCollaborationInvitation,
  AgencyRateCard,
  AgencyRateCardItem,
  AgencySlaSnapshot,
  AgencyBillingEvent,
  RecruitingCalendarEvent,
  EmployerBrandAsset,
}));

await jest.unstable_mockModule(messagingModelsModulePath, () => ({
  MessageThread,
  Message,
}));

const { getCompanyDashboard } = await import('../../src/services/companyDashboardService.js');

const DEFAULT_WORKSPACE = {
  id: 101,
  slug: 'acme-co',
  ownerId: 77,
  name: 'Acme Co',
  type: 'company',
  timezone: 'UTC',
  defaultCurrency: 'USD',
  intakeEmail: 'intake@acme.co',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const DEFAULT_OWNER = {
  id: 77,
  firstName: 'Avery',
  lastName: 'Lee',
  email: 'avery@acme.co',
};

const workspaceInstance = {
  ...DEFAULT_WORKSPACE,
  owner: {
    ...DEFAULT_OWNER,
    get: ({ plain }) => (plain ? { ...DEFAULT_OWNER } : DEFAULT_OWNER),
  },
  get: ({ plain }) => (plain ? { ...DEFAULT_WORKSPACE } : DEFAULT_WORKSPACE),
};

function resetModelMocks() {
  mockCacheRemember.mockClear();
  mockBuildCacheKey.mockClear();

  ProviderWorkspace.findAll.mockResolvedValue([
    { get: ({ plain }) => (plain ? { id: 101, name: 'Acme Co', slug: 'acme-co' } : null) },
  ]);
  ProviderWorkspace.findOne.mockResolvedValue(workspaceInstance);
  ProviderWorkspaceMember.findAll.mockResolvedValue([]);
  ProviderWorkspaceInvite.findAll.mockResolvedValue([]);
  ProviderContactNote.findAll.mockResolvedValue([]);
  CompanyProfile.findOne.mockResolvedValue({
    get: ({ plain }) =>
      plain
        ? {
            companyName: 'Acme Co',
            description: 'Global hiring team',
            website: 'https://acme.example.com',
            location: 'San Francisco, CA',
            geoLocation: { label: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
          }
        : null,
  });
  Job.findAll.mockResolvedValue([]);
  Gig.findAll.mockResolvedValue([]);
  Project.findAll.mockResolvedValue([]);
  Application.findAll.mockResolvedValue([]);
  ApplicationReview.findAll.mockResolvedValue([]);
  HiringAlert.findAll.mockResolvedValue([]);
  CandidateDemographicSnapshot.findAll.mockResolvedValue([]);
  CandidateSatisfactionSurvey.findAll.mockResolvedValue([]);
  InterviewSchedule.findAll.mockResolvedValue([]);
  JobStage.findAll.mockResolvedValue([]);
  JobApprovalWorkflow.findAll.mockResolvedValue([]);
  JobCampaignPerformance.findAll.mockResolvedValue([]);
  PartnerEngagement.findAll.mockResolvedValue([]);
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
  RecruitingCalendarEvent.findAll.mockResolvedValue([]);
  EmployerBrandAsset.findAll.mockResolvedValue([]);
  MessageThread.findAll.mockResolvedValue([]);
}

describe('getCompanyDashboard partnerships integration', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-10-01T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    resetModelMocks();
  });

  it('aggregates partnerships data from headhunter, talent pool, and agency records', async () => {
    HeadhunterInvite.findAll.mockResolvedValue([
      {
        id: 1,
        workspaceId: 101,
        status: 'accepted',
        sentAt: '2024-09-01T10:00:00Z',
        respondedAt: '2024-09-02T10:00:00Z',
      },
      {
        id: 2,
        workspaceId: 101,
        status: 'pending',
        sentAt: '2024-09-20T15:00:00Z',
        respondedAt: null,
      },
    ]);

    HeadhunterBrief.findAll.mockResolvedValue([
      {
        id: 11,
        workspaceId: 101,
        title: 'Design Leads',
        status: 'in_progress',
        openings: 3,
        dueAt: '2024-10-15T00:00:00Z',
        sharedAt: '2024-09-10T00:00:00Z',
        assignments: [],
      },
      {
        id: 12,
        workspaceId: 101,
        title: 'Product Managers',
        status: 'completed',
        openings: 2,
        sharedAt: '2024-08-01T00:00:00Z',
        assignments: [],
      },
    ]);

    HeadhunterBriefAssignment.findAll.mockResolvedValue([
      {
        id: 21,
        briefId: 11,
        workspaceId: 101,
        submittedCandidates: 5,
        placements: 1,
        responseTimeHours: 12,
        headhunterWorkspace: { id: 301, name: 'SearchPro' },
      },
      {
        id: 22,
        briefId: 11,
        workspaceId: 101,
        submittedCandidates: 2,
        placements: 0,
        responseTimeHours: 36,
        headhunterWorkspace: { id: 302, name: 'TalentBase' },
      },
    ]);

    HeadhunterPerformanceSnapshot.findAll.mockResolvedValue([
      {
        id: 31,
        headhunterWorkspaceId: 301,
        headhunterName: 'SearchPro',
        placements: 4,
        interviews: 10,
        responseRate: 88,
        averageTimeToSubmitHours: 18,
        qualityScore: 4.4,
        activeBriefs: 2,
        lastSubmissionAt: '2024-09-25T00:00:00Z',
      },
      {
        id: 32,
        headhunterWorkspaceId: 302,
        headhunterName: 'TalentBase',
        placements: 2,
        interviews: 6,
        responseRate: 76,
        averageTimeToSubmitHours: 20,
        qualityScore: 4.1,
        activeBriefs: 1,
        lastSubmissionAt: '2024-09-23T00:00:00Z',
      },
    ]);

    HeadhunterCommission.findAll.mockResolvedValue([
      {
        id: 41,
        status: 'pending',
        amount: 12000,
        currency: 'USD',
        headhunterName: 'SearchPro',
        candidateName: 'Jordan Rivers',
        dueAt: '2024-10-05T00:00:00Z',
      },
      {
        id: 42,
        status: 'paid',
        amount: 8000,
        currency: 'USD',
        headhunterName: 'TalentBase',
        candidateName: 'Morgan Blake',
        paidAt: '2024-09-18T00:00:00Z',
        dueAt: '2024-09-10T00:00:00Z',
      },
      {
        id: 43,
        status: 'overdue',
        amount: 6500,
        currency: 'USD',
        headhunterName: 'SearchPro',
        candidateName: 'Sky Ramirez',
        dueAt: '2024-09-01T00:00:00Z',
      },
    ]);

    TalentPool.findAll.mockResolvedValue([
      {
        id: 501,
        workspaceId: 101,
        name: 'Silver Medalists',
        poolType: 'silver_medalist',
        status: 'active',
        owner: { firstName: 'Alex', lastName: 'Kim' },
      },
      {
        id: 502,
        workspaceId: 101,
        name: 'Alumni',
        poolType: 'alumni',
        status: 'paused',
        owner: { firstName: 'Jordan', lastName: 'Ng' },
      },
    ]);

    TalentPoolMember.findAll.mockResolvedValue([
      {
        id: 601,
        poolId: 501,
        status: 'engaged',
        joinedAt: '2024-09-01T00:00:00Z',
        candidateName: 'Jamie Fox',
        nextActionAt: '2024-10-10T00:00:00Z',
      },
      {
        id: 602,
        poolId: 501,
        status: 'hired',
        joinedAt: '2024-08-15T00:00:00Z',
        candidateName: 'Taylor Hayes',
      },
      {
        id: 603,
        poolId: 502,
        status: 'active',
        joinedAt: '2024-09-20T00:00:00Z',
        candidateName: 'Riley Poe',
        nextActionAt: '2024-10-05T00:00:00Z',
      },
    ]);

    TalentPoolEngagement.findAll.mockResolvedValue([
      {
        id: 701,
        poolId: 501,
        interactionType: 'call',
        occurredAt: '2024-09-25T09:30:00Z',
        summary: 'Followed up with Jamie',
        performedBy: { firstName: 'Alex', lastName: 'Kim' },
      },
      {
        id: 702,
        poolId: 502,
        interactionType: 'email',
        occurredAt: '2024-09-28T14:00:00Z',
        summary: 'Shared alumni newsletter',
        performedBy: { firstName: 'Morgan', lastName: 'Lee' },
      },
    ]);

    AgencyCollaboration.findAll.mockResolvedValue([
      {
        id: 801,
        status: 'active',
        renewalDate: '2024-12-01T00:00:00Z',
        healthScore: 87,
        satisfactionScore: 92,
        forecastedUpsellValue: 25000,
        agencyWorkspace: { id: 901, name: 'AgencyOne' },
        sharedDeliverySnapshot: { companyWorkspaceId: 101 },
      },
      {
        id: 802,
        status: 'paused',
        renewalDate: null,
        healthScore: 72,
        satisfactionScore: 80,
        forecastedUpsellValue: 5000,
        agencyWorkspace: { id: 902, name: 'AgencyTwo' },
        sharedDeliverySnapshot: { companyWorkspaceId: 101 },
      },
    ]);

    AgencyCollaborationInvitation.findAll.mockResolvedValue([
      { id: 901, status: 'pending', createdAt: '2024-09-29T10:00:00Z' },
      { id: 902, status: 'accepted', createdAt: '2024-09-20T09:00:00Z' },
    ]);

    AgencyRateCard.findAll.mockResolvedValue([
      {
        id: 911,
        status: 'shared',
        title: 'Standard Delivery',
        updatedAt: '2024-09-25T00:00:00Z',
        currency: 'USD',
        effectiveFrom: '2024-10-01',
        effectiveTo: null,
        items: [{ id: 1 }, { id: 2 }],
      },
      {
        id: 912,
        status: 'draft',
        title: 'Specialized Search',
        updatedAt: '2024-09-18T00:00:00Z',
        currency: 'USD',
        items: [{ id: 3 }],
      },
    ]);

    AgencySlaSnapshot.findAll.mockResolvedValue([
      {
        id: 921,
        agencyCollaborationId: 801,
        onTimeDeliveryRate: 95,
        responseTimeHoursAvg: 12,
        breachCount: 1,
        escalationsCount: 0,
        periodEnd: '2024-09-30T00:00:00Z',
      },
      {
        id: 922,
        agencyCollaborationId: 802,
        onTimeDeliveryRate: 88,
        responseTimeHoursAvg: 20,
        breachCount: 2,
        escalationsCount: 1,
        periodEnd: '2024-09-28T00:00:00Z',
      },
    ]);

    AgencyBillingEvent.findAll.mockResolvedValue([
      {
        id: 931,
        workspaceId: 101,
        status: 'sent',
        amount: 15000,
        currency: 'USD',
        issuedAt: '2024-09-20T00:00:00Z',
        dueAt: '2024-10-08T00:00:00Z',
        updatedAt: '2024-09-27T00:00:00Z',
      },
      {
        id: 932,
        workspaceId: 101,
        status: 'paid',
        amount: 8000,
        currency: 'USD',
        paidAt: '2024-09-22T00:00:00Z',
        issuedAt: '2024-09-10T00:00:00Z',
        updatedAt: '2024-09-23T00:00:00Z',
      },
      {
        id: 933,
        workspaceId: 101,
        status: 'overdue',
        amount: 5000,
        currency: 'USD',
        issuedAt: '2024-08-25T00:00:00Z',
        dueAt: '2024-09-05T00:00:00Z',
        updatedAt: '2024-09-15T00:00:00Z',
      },
    ]);

    const dashboard = await getCompanyDashboard({ workspaceId: 101, lookbackDays: 45 });

    expect(dashboard.profile.locationDetails).toEqual({
      location: 'San Francisco, CA',
      geoLocation: {
        label: 'San Francisco, CA',
        latitude: 37.7749,
        longitude: -122.4194,
      },
      displayName: 'San Francisco, CA',
      shortName: 'San Francisco, CA',
      timezone: null,
      city: null,
      region: null,
      country: null,
      postalCode: null,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
    });

    expect(dashboard.partnerships.headhunterProgram.invites).toMatchObject({
      total: 2,
      accepted: 1,
      pending: 1,
      acceptanceRate: 50,
      lastInviteAt: '2024-09-20T15:00:00Z',
    });

    expect(dashboard.partnerships.headhunterProgram.briefs).toMatchObject({
      total: 2,
      active: 1,
      sharedThisWindow: 1,
      pipeline: expect.arrayContaining([
        expect.objectContaining({ title: 'Design Leads', submissions: 7, placements: 1 }),
      ]),
    });

    expect(dashboard.partnerships.headhunterProgram.assignments).toMatchObject({
      totalAssignments: 2,
      submittedCandidates: 7,
      placements: 1,
    });

    expect(dashboard.partnerships.headhunterProgram.performance.leaderboard[0]).toMatchObject({
      name: 'SearchPro',
      placements: 4,
      responseRate: 88,
      activeBriefs: 2,
    });

    expect(dashboard.partnerships.headhunterProgram.commissions).toMatchObject({
      outstandingCount: 2,
      outstandingAmount: 18500,
      currency: 'USD',
    });

    expect(dashboard.partnerships.talentPools.totals).toMatchObject({
      pools: 2,
      activePools: 1,
      pausedPools: 1,
      totalCandidates: 3,
      hiresFromPools: 1,
      engagementsInWindow: 2,
    });

    expect(dashboard.partnerships.talentPools.upcomingActions[0]).toMatchObject({
      poolName: 'Alumni',
      candidateName: 'Riley Poe',
    });

    expect(dashboard.partnerships.agencyCollaboration.summary).toMatchObject({
      total: 2,
      active: 1,
      paused: 1,
      forecastedUpsellValue: 30000,
    });

    expect(dashboard.partnerships.agencyCollaboration.billing).toMatchObject({
      outstandingAmount: 20000,
      outstandingCount: 2,
      dueSoon: { count: 2, amount: 20000 },
    });
  });

  it('returns empty partnership structures when no records exist', async () => {
    const dashboard = await getCompanyDashboard({ workspaceId: 101 });

    expect(dashboard.partnerships.headhunterProgram).toMatchObject({
      invites: expect.objectContaining({ total: 0, accepted: 0, pending: 0 }),
      briefs: expect.objectContaining({ total: 0, active: 0, pipeline: [] }),
      assignments: expect.objectContaining({ totalAssignments: 0, placements: 0 }),
      performance: expect.objectContaining({ leaderboard: [], healthScore: null }),
      commissions: expect.objectContaining({ outstandingCount: 0, outstandingAmount: 0, currency: 'USD' }),
    });

    expect(dashboard.partnerships.talentPools).toMatchObject({
      totals: expect.objectContaining({ pools: 0, totalCandidates: 0 }),
      byType: [],
      upcomingActions: [],
      recentEngagements: [],
    });

    expect(dashboard.partnerships.agencyCollaboration).toMatchObject({
      summary: expect.objectContaining({ total: 0, active: 0, forecastedUpsellValue: 0 }),
      renewals: [],
      invites: expect.objectContaining({ total: 0, pending: 0 }),
      rateCards: expect.objectContaining({ total: 0, shared: 0 }),
      sla: expect.objectContaining({ partners: [] }),
      billing: expect.objectContaining({ outstandingAmount: 0, upcomingInvoices: [] }),
    });
  });
});
