import { jest } from '@jest/globals';

describe('affiliateSettingsService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns default settings when no record exists', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const findOrCreate = jest.fn();
    jest.unstable_mockModule('../models/platformSetting.js', () => ({
      PlatformSetting: {
        findOne,
        findOrCreate,
      },
      default: {
        findOne,
        findOrCreate,
      },
    }));

    const { getAffiliateSettings } = await import('../affiliateSettingsService.js');
    const settings = await getAffiliateSettings();

    expect(findOne).toHaveBeenCalledWith({ where: { key: 'affiliate-program' } });
    expect(settings).toMatchObject({
      enabled: true,
      defaultCommissionRate: 10,
      currency: 'USD',
      payouts: expect.objectContaining({ frequency: 'monthly' }),
    });
  });

  it('updates and persists affiliate settings', async () => {
    const save = jest.fn().mockResolvedValue();
    const updatedAt = new Date('2024-05-01T12:00:00.000Z');
    const record = { value: {}, save, updatedAt, get: jest.fn() };
    const findOrCreate = jest.fn().mockResolvedValue([record, false]);
    const findOne = jest.fn().mockResolvedValue(record);

    jest.unstable_mockModule('../models/platformSetting.js', () => ({
      PlatformSetting: {
        findOne,
        findOrCreate,
      },
      default: {
        findOne,
        findOrCreate,
      },
    }));

    const { updateAffiliateSettings } = await import('../affiliateSettingsService.js');
    const result = await updateAffiliateSettings({
      defaultCommissionRate: 12,
      currency: 'eur',
      payouts: { frequency: 'weekly', minimumPayoutThreshold: 75 },
    });

    expect(findOrCreate).toHaveBeenCalledWith({
      where: { key: 'affiliate-program' },
      defaults: expect.any(Object),
    });
    expect(save).toHaveBeenCalled();
    expect(result).toMatchObject({
      defaultCommissionRate: 12,
      currency: 'EUR',
      payouts: expect.objectContaining({ frequency: 'weekly', minimumPayoutThreshold: 75 }),
    });
    expect(result.updatedAt).toBe(updatedAt.toISOString());
  });
});

describe('affiliateDashboardService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('builds affiliate dashboard metrics from link data', async () => {
    const linkRows = [
      {
        id: 1,
        code: 'alpha',
        label: 'Alpha Link',
        status: 'active',
        destinationUrl: 'https://gigvora.com/a',
        totalRevenueCents: 123450,
        totalClicks: 100,
        totalConversions: 12,
        revenueCurrency: 'USD',
        metadata: {
          referrals: [
            { id: 'ref-1', name: 'Client One', amount: 1200, occurredAt: '2024-05-10T10:00:00.000Z', status: 'won' },
            { id: 'ref-2', name: 'Client Two', amount: 800, occurredAt: '2024-05-09T09:30:00.000Z', status: 'pending' },
          ],
          payouts: [
            { id: 'pay-1', amount: 250, status: 'paid' },
            { id: 'pay-2', amount: 75, status: 'pending' },
          ],
        },
        createdAt: '2024-05-08T12:00:00.000Z',
        updatedAt: '2024-05-11T12:00:00.000Z',
      },
      {
        id: 2,
        code: 'beta',
        status: 'paused',
        destinationUrl: 'https://gigvora.com/b',
        totalRevenueCents: 50000,
        totalClicks: 40,
        totalConversions: 4,
        revenueCurrency: 'USD',
        metadata: { referrals: [], payouts: [] },
        createdAt: '2024-05-01T12:00:00.000Z',
        updatedAt: '2024-05-10T12:00:00.000Z',
      },
    ];

    const findAll = jest.fn().mockResolvedValue(linkRows);

    jest.unstable_mockModule('../models/index.js', () => ({
      ClientSuccessAffiliateLink: {
        findAll,
      },
    }));

    const settings = {
      enabled: true,
      defaultCommissionRate: 10,
      referralWindowDays: 90,
      currency: 'USD',
      payouts: {
        frequency: 'monthly',
        minimumPayoutThreshold: 50,
        autoApprove: false,
        recurrence: { type: 'infinite', limit: null },
      },
      tiers: [
        { id: 'starter', name: 'Starter', minValue: 0, maxValue: 999, rate: 8 },
        { id: 'growth', name: 'Growth', minValue: 1000, maxValue: 4999, rate: 12 },
        { id: 'elite', name: 'Elite', minValue: 5000, maxValue: null, rate: 15 },
      ],
      compliance: { requiredDocuments: ['taxForm'], twoFactorRequired: true, payoutKyc: true },
    };

    const getAffiliateSettings = jest.fn().mockResolvedValue(settings);
    jest.unstable_mockModule('../affiliateSettingsService.js', () => ({
      getAffiliateSettings,
    }));

    const { getAffiliateDashboard } = await import('../affiliateDashboardService.js');

    const dashboard = await getAffiliateDashboard(42);

    expect(getAffiliateSettings).toHaveBeenCalled();
    expect(findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ freelancerId: 42 }),
        order: [['updatedAt', 'DESC']],
      }),
    );
    expect(dashboard.overview.lifetimeRevenue).toBeGreaterThan(0);
    expect(dashboard.overview.lifetimeEarnings).toBeGreaterThan(0);
    expect(dashboard.links[0]).toMatchObject({ id: 1, tier: 'Growth', estimatedCommission: expect.any(Number) });
    expect(dashboard.security.twoFactorRequired).toBe(true);
    expect(dashboard.payoutSchedule.frequency).toBe('monthly');
    expect(Array.isArray(dashboard.referrals)).toBe(true);
  });
});

describe('adminTwoFactorService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns fallback overview when data sources fail', async () => {
    const warn = jest.fn();
    jest.unstable_mockModule('../utils/logger.js', () => ({
      default: { child: () => ({ warn }) },
    }));

    jest.unstable_mockModule('../models/index.js', () => ({
      TwoFactorPolicy: { findAll: jest.fn().mockRejectedValue(new Error('db offline')) },
      TwoFactorEnrollment: { findAll: jest.fn() },
      TwoFactorBypass: { findAll: jest.fn() },
      TwoFactorAuditLog: { findAll: jest.fn() },
      TwoFactorToken: { count: jest.fn() },
      User: {},
    }));

    const { getAdminTwoFactorOverview } = await import('../adminTwoFactorService.js');

    const snapshot = await getAdminTwoFactorOverview({ lookbackDays: 15 });

    expect(warn).toHaveBeenCalled();
    expect(snapshot.fallback).toBe(true);
    expect(snapshot.lookbackDays).toBe(15);
    expect(snapshot.coverage).toBeDefined();
    expect(snapshot.summary).toMatchObject({
      adminCoverageRate: expect.any(Number),
      overallCoverageRate: expect.any(Number),
    });
  });
});

describe('adminJobPostService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('lists job posts with normalized detail data', async () => {
    const jobRow = {
      get: () => ({
        id: 10,
        title: 'Lead Engineer',
        description: 'Build resilient platforms',
        location: 'Remote',
        employmentType: 'full_time',
        geoLocation: null,
        createdAt: '2024-05-01T00:00:00.000Z',
        updatedAt: '2024-05-02T00:00:00.000Z',
        adminDetail: {
          id: 100,
          jobId: 10,
          slug: 'lead-engineer',
          status: 'published',
          visibility: 'public',
          workflowStage: 'active',
          approvalStatus: 'approved',
          approvalNotes: null,
          applicationUrl: 'https://gigvora.com/apply',
          applicationEmail: 'apply@gigvora.com',
          applicationInstructions: 'Send resume',
          salaryMin: 100000,
          salaryMax: 140000,
          currency: 'USD',
          compensationType: 'salary',
          workplaceType: 'remote',
          contractType: 'full_time',
          experienceLevel: 'senior',
          department: 'Engineering',
          team: 'Platform',
          hiringManagerName: 'Alex Manager',
          hiringManagerEmail: 'alex@gigvora.com',
          recruiterName: 'Jamie Recruiter',
          recruiterEmail: 'jamie@gigvora.com',
          tags: ['node', 'leadership'],
          benefits: ['Health'],
          responsibilities: ['Lead team'],
          requirements: ['7+ years experience'],
          attachments: [],
          promotionFlags: { featured: true },
          metadata: { source: 'internal' },
          publishedAt: '2024-05-01T00:00:00.000Z',
          expiresAt: null,
          archivedAt: null,
          archiveReason: null,
          externalReference: 'REF-123',
          createdById: 1,
          updatedById: 2,
          createdAt: '2024-04-30T00:00:00.000Z',
          updatedAt: '2024-05-02T00:00:00.000Z',
        },
      }),
    };

    const findAndCountAll = jest.fn().mockResolvedValue({ rows: [jobRow], count: 1 });
    const summaryData = [
      { status: 'published', count: 1 },
      { workflowStage: 'active', count: 1 },
    ];

    const findAll = jest
      .fn()
      .mockResolvedValueOnce([{ status: 'published', count: 1 }])
      .mockResolvedValueOnce([{ workflowStage: 'active', count: 1 }]);

    jest.unstable_mockModule('../models/index.js', () => ({
      Job: {
        findAndCountAll,
      },
      JobPostAdminDetail: {
        findAll,
      },
      sequelize: {},
    }));

    const { listJobPosts } = await import('../adminJobPostService.js');

    const result = await listJobPosts({ status: 'published', search: 'lead', page: 1, pageSize: 10 });

    expect(findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 0,
        include: expect.any(Array),
      }),
    );
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      id: 10,
      title: 'Lead Engineer',
      detail: expect.objectContaining({ slug: 'lead-engineer', status: 'published', promotionFlags: { featured: true } }),
    });
    expect(result.summary).toEqual({ statusCounts: { published: 1 }, workflowCounts: { active: 1 } });
  });
});

describe('adminVolunteeringService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('builds volunteering insights from aggregated data', async () => {
    const roleRows = [
      {
        id: 1,
        title: 'Community Mentor',
        organization: 'Gigvora Foundation',
        status: 'open',
        remoteType: 'remote',
        location: 'Remote',
        commitmentHours: 5,
        accessRoles: ['community'],
        tags: ['mentoring', 'education'],
        publishedAt: '2024-05-01T00:00:00.000Z',
        updatedAt: '2024-05-11T00:00:00.000Z',
      },
      {
        id: 2,
        title: 'Event Volunteer',
        organization: 'Gigvora Events',
        status: 'draft',
        remoteType: 'onsite',
        location: 'San Francisco',
        commitmentHours: 4,
        accessRoles: [],
        tags: ['events'],
        publishedAt: null,
        updatedAt: '2024-05-10T00:00:00.000Z',
      },
    ];

    const shiftRows = [
      {
        id: 10,
        title: 'Mentor Onboarding',
        shiftDate: '2024-05-20',
        startTime: '10:00',
        endTime: '12:00',
        timezone: 'UTC',
        location: 'Online',
        capacity: 10,
        reserved: 6,
        status: 'scheduled',
        notes: 'Zoom link to follow',
        role: { id: 1, title: 'Community Mentor', organization: 'Gigvora Foundation' },
      },
    ];

    const statusRows = [
      { status: 'open', count: 1 },
      { status: 'draft', count: 1 },
    ];

    const tagRows = [{ tag: 'mentoring' }, { tag: 'mentoring' }, { tag: 'events' }];

    const findAll = jest
      .fn()
      .mockResolvedValueOnce(statusRows)
      .mockResolvedValueOnce(roleRows)
      .mockResolvedValueOnce(tagRows);

    const count = jest.fn().mockResolvedValue(2);

    const shiftFindAll = jest.fn().mockResolvedValue(shiftRows);

    jest.unstable_mockModule('../models/index.js', () => ({
      Volunteering: {
        findAll,
        count,
      },
      VolunteerShift: {
        findAll: shiftFindAll,
      },
      VolunteerProgram: {},
      VolunteerAssignment: {},
      User: {},
    }));

    const { getVolunteeringInsights } = await import('../adminVolunteeringService.js');

    const insights = await getVolunteeringInsights();

    expect(count).toHaveBeenCalled();
    expect(shiftFindAll).toHaveBeenCalled();
    expect(insights.totals).toMatchObject({ roles: 2, open: 1, draft: 1, upcomingShifts: 1 });
    expect(insights.averageCommitmentHours).toBeGreaterThan(0);
    expect(insights.locationBreakdown).toMatchObject({ remote: 1, onsite: 1 });
    expect(insights.tagHighlights[0]).toEqual({ tag: 'mentoring', count: 2 });
  });
});
