import { jest } from '@jest/globals';

describe('adminMentoringService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('lists mentoring sessions with metrics and action queue', async () => {
    const sessionPlain = {
      id: 7,
      serviceLineId: 2,
      serviceLine: { id: 2, name: 'Leadership', slug: 'leadership' },
      mentorId: 11,
      mentor: { id: 11, firstName: 'Alex', lastName: 'Mentor', email: 'alex@example.com', userType: 'mentor' },
      menteeId: 22,
      mentee: { id: 22, firstName: 'Taylor', lastName: 'Mentee', email: 'taylor@example.com', userType: 'mentee' },
      adminOwnerId: 3,
      adminOwner: { id: 3, firstName: 'Jamie', lastName: 'Owner', email: 'jamie@example.com', userType: 'admin' },
      topic: 'Scaling teams',
      agenda: 'Discuss growth planning',
      scheduledAt: new Date('2024-05-15T09:00:00Z'),
      durationMinutes: 60,
      status: 'completed',
      meetingUrl: 'https://meet.example.com/session',
      meetingProvider: 'zoom',
      recordingUrl: null,
      notes: 'Great progress',
      followUpAt: new Date('2024-05-22T09:00:00Z'),
      feedbackRating: 4.5,
      feedbackSummary: 'Strong session',
      cancellationReason: null,
      resourceLinks: [{ label: 'Deck', url: 'https://cdn.example.com/deck.pdf' }],
      sessionNotes: [
        {
          id: 91,
          sessionId: 7,
          authorId: 3,
          visibility: 'internal',
          body: 'Prepare metrics',
          attachments: [],
          author: { id: 3, firstName: 'Jamie', lastName: 'Owner', email: 'jamie@example.com', userType: 'admin' },
          createdAt: new Date('2024-05-15T10:00:00Z'),
          updatedAt: new Date('2024-05-15T10:00:00Z'),
        },
      ],
      actionItems: [
        {
          id: 301,
          sessionId: 7,
          title: 'Share roadmap',
          description: 'Send the latest roadmap deck',
          status: 'pending',
          priority: 'high',
          dueAt: new Date('2024-05-18T12:00:00Z'),
          assigneeId: 11,
          createdById: 3,
          completedAt: null,
          assignee: { id: 11, firstName: 'Alex', lastName: 'Mentor', email: 'alex@example.com', userType: 'mentor' },
          createdBy: { id: 3, firstName: 'Jamie', lastName: 'Owner', email: 'jamie@example.com', userType: 'admin' },
          createdAt: new Date('2024-05-15T09:05:00Z'),
          updatedAt: new Date('2024-05-15T09:05:00Z'),
        },
      ],
      createdAt: new Date('2024-05-10T09:00:00Z'),
      updatedAt: new Date('2024-05-15T09:30:00Z'),
    };

    const findAndCountAll = jest.fn().mockResolvedValue({ rows: [{ get: () => sessionPlain }], count: 1 });
    const findAll = jest
      .fn()
      .mockResolvedValueOnce([{ status: 'completed', count: '1' }]);
    const count = jest
      .fn()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    const findOne = jest.fn().mockResolvedValue({ average: '4.5' });

    const sequelizeWhere = jest.fn(() => ({ condition: true }));

    jest.unstable_mockModule('../models/index.js', () => ({
      sequelize: { where: sequelizeWhere },
      PeerMentoringSession: { findAndCountAll, findAll, count, findOne },
      MentoringSessionNote: {},
      MentoringSessionActionItem: {},
      User: {},
      ServiceLine: {},
      PEER_MENTORING_STATUSES: ['scheduled', 'completed', 'cancelled'],
      MENTORING_SESSION_NOTE_VISIBILITIES: ['internal', 'mentor', 'mentee'],
      MENTORING_SESSION_ACTION_STATUSES: ['pending', 'in_progress', 'completed'],
      MENTORING_SESSION_ACTION_PRIORITIES: ['low', 'normal', 'high'],
    }));

    const { listMentoringSessions } = await import('../adminMentoringService.js');

    const result = await listMentoringSessions({ status: 'completed', page: 1, pageSize: 10 });

    expect(findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
    expect(result.data[0]).toMatchObject({
      id: 7,
      topic: 'Scaling teams',
      mentor: { firstName: 'Alex', email: 'alex@example.com' },
      actionItems: [expect.objectContaining({ title: 'Share roadmap', priority: 'high' })],
    });
    expect(result.metrics).toMatchObject({
      totalsByStatus: { completed: 1 },
      upcomingCount: 1,
      followUpsDue: 0,
      averageFeedback: 4.5,
    });
    expect(result.actionQueue).toHaveLength(1);
  });
});

// additional tests will be appended here

describe('adminMessagingService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('lists admin threads with aggregated metrics', async () => {
    const sanitizeThread = jest.fn((thread) => ({
      id: thread.id,
      subject: thread.subject,
      channelType: thread.channelType,
    }));
    const listMessages = jest.fn();

    jest.unstable_mockModule('../models/index.js', () => ({
      MessageThread: {
        findAndCountAll: jest.fn().mockResolvedValue({
          rows: [{ id: 42, subject: 'Escalated case', channelType: 'inbox' }],
          count: 1,
        }),
        findAll: jest
          .fn()
          .mockResolvedValueOnce([{ channelType: 'inbox', count: '1' }])
          .mockResolvedValueOnce([{ state: 'open', count: '1' }])
          .mockResolvedValueOnce([{ status: 'new', count: '1' }])
          .mockResolvedValueOnce([{ priority: 'p1', count: '1' }])
          .mockResolvedValueOnce([{ assignment: 'unassigned', count: '1' }]),
      },
      MessageParticipant: {},
      MessageThreadLabel: {},
      MessageLabel: { findAll: jest.fn() },
      SupportCase: {},
      User: {},
      sequelize: {},
    }));

    jest.unstable_mockModule('./messagingService.js', () => ({
      sanitizeThread,
      sanitizeMessage: jest.fn((message) => ({ ...message, sanitized: true })),
      appendMessage: jest.fn(),
      createThread: jest.fn(),
      getThread: jest.fn(),
      listMessages,
      updateThreadState: jest.fn(),
      assignSupportAgent: jest.fn(),
      updateSupportCaseStatus: jest.fn(),
      escalateThreadToSupport: jest.fn(),
    }));

    const { listAdminThreads } = await import('../adminMessagingService.js');

    const result = await listAdminThreads({ channelTypes: 'inbox' }, { page: 1, pageSize: 25 });

    expect(result.data).toEqual([
      { id: 42, subject: 'Escalated case', channelType: 'inbox' },
    ]);
    expect(result.metrics).toEqual({
      channels: { inbox: 1 },
      states: { open: 1 },
      supportStatuses: { new: 1 },
      supportPriorities: { p1: 1 },
      assignment: { unassigned: 1 },
    });
    expect(result.pagination).toMatchObject({ total: 1, page: 1, pageSize: 25 });
  });
});

describe('adminProfileService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('creates a profile with normalized memberships and notes', async () => {
    const registerUser = jest.fn().mockResolvedValue({ id: 100, email: 'ops@example.com' });
    const sanitizeUser = jest.fn((user) => user);

    const update = jest.fn();
    const create = jest.fn().mockResolvedValue({ id: 555 });
    const findByPk = jest.fn().mockResolvedValue({
      get: () => ({
        id: 555,
        userId: 100,
        User: { id: 100, email: 'ops@example.com', firstName: 'Ops', lastName: 'Lead', userType: 'admin' },
        references: [],
        adminNotes: [
          {
            id: 1,
            profileId: 555,
            authorId: 77,
            body: 'Trusted leader',
            visibility: 'internal',
            pinned: true,
            createdAt: new Date('2024-05-12T09:00:00Z'),
            updatedAt: new Date('2024-05-12T09:00:00Z'),
            author: { id: 77, firstName: 'Jamie', lastName: 'Ops', email: 'jamie@example.com', userType: 'admin' },
          },
        ],
        headline: 'Ops lead',
        availabilityStatus: 'available',
      }),
    });

    const transaction = jest.fn((callback) => callback({}));

    jest.unstable_mockModule('../domains/serviceCatalog.js', () => ({
      getAuthDomainService: () => ({ registerUser, sanitizeUser }),
    }));

    jest.unstable_mockModule('../models/index.js', () => ({
      sequelize: { transaction },
      User: { update, findOne: jest.fn().mockResolvedValue(null) },
      Profile: { create, findByPk },
      ProfileReference: {},
      ProfileAdminNote: { create: jest.fn() },
    }));

    jest.unstable_mockModule('../utils/location.js', () => ({
      normalizeLocationPayload: ({ location }) => ({ location, geoLocation: null }),
    }));

    const { createProfile } = await import('../adminProfileService.js');

    const result = await createProfile(
      {
        user: {
          firstName: 'Ops',
          lastName: 'Lead',
          email: 'OPS@example.com',
          memberships: ['Admin', 'Operations'],
          userType: 'admin',
          primaryDashboard: 'agency',
          twoFactorEnabled: true,
        },
        profile: {
          headline: 'Ops lead',
          availabilityStatus: 'available',
        },
        notes: { body: 'Trusted leader', visibility: 'internal', pinned: true },
      },
      { id: 77 },
    );

    expect(registerUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ops@example.com',
        firstName: 'Ops',
        lastName: 'Lead',
        twoFactorEnabled: true,
      }),
      expect.any(Object),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        memberships: ['admin', 'operations'],
        primaryDashboard: 'agency',
      }),
      expect.objectContaining({ where: { id: 100 } }),
    );
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ userId: 100, availabilityStatus: 'available' }), expect.any(Object));
    expect(result).toMatchObject({
      id: 555,
      user: { email: 'ops@example.com', firstName: 'Ops' },
      metrics: expect.objectContaining({ notes: 1, references: 0 }),
      notes: [expect.objectContaining({ body: 'Trusted leader', pinned: true })],
    });
  });
});

describe('adminProjectManagementService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('summarizes portfolio snapshot with owner directory', async () => {
    const findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [
        {
          get: () => ({
            id: 1,
            ownerId: 5,
            title: 'Marketplace Refresh',
            status: 'in_progress',
            startDate: '2024-04-01',
            dueDate: '2024-06-30',
            budgetCurrency: 'USD',
            budgetAllocated: 200000,
            budgetSpent: 50000,
            workspace: {
              status: 'in_progress',
              progressPercent: 40,
              riskLevel: 'medium',
              nextMilestone: 'Beta launch',
              nextMilestoneDueAt: '2024-05-30',
            },
            updatedAt: new Date('2024-05-10T12:00:00Z'),
            createdAt: new Date('2024-04-01T09:00:00Z'),
          }),
        },
      ],
    });

    const summaryProject = {
      get: () => ({
        id: 1,
        ownerId: 5,
        title: 'Marketplace Refresh',
        status: 'in_progress',
        startDate: '2024-04-01',
        dueDate: '2024-06-30',
        budgetCurrency: 'USD',
        budgetAllocated: 200000,
        budgetSpent: 50000,
        workspace: {
          status: 'in_progress',
          progressPercent: 40,
          riskLevel: 'medium',
          nextMilestone: 'Beta launch',
          nextMilestoneDueAt: '2024-05-30',
        },
        milestones: [],
        collaborators: [],
        integrations: [],
        assets: [],
        retrospectives: [],
        createdAt: new Date('2024-04-01T09:00:00Z'),
        updatedAt: new Date('2024-05-10T12:00:00Z'),
      }),
    };

    const findAll = jest.fn().mockResolvedValue([summaryProject]);

    jest.unstable_mockModule('../models/projectGigManagementModels.js', () => ({
      syncProjectGigManagementModels: jest.fn().mockResolvedValue(),
      Project: { findAndCountAll, findAll },
      ProjectWorkspace: {},
      ProjectMilestone: {},
      ProjectCollaborator: {},
      ProjectIntegration: {},
      ProjectAsset: {},
      ProjectRetrospective: {},
      PROJECT_STATUSES: ['planning', 'in_progress', 'completed'],
      PROJECT_RISK_LEVELS: ['low', 'medium', 'high'],
      PROJECT_COLLABORATOR_STATUSES: ['active'],
      PROJECT_INTEGRATION_STATUSES: ['connected'],
    }));

    jest.unstable_mockModule('../models/index.js', () => ({
      User: {
        findAll: jest.fn().mockResolvedValue([
          {
            get: () => ({ id: 5, firstName: 'Amelia', lastName: 'Stone', email: 'amelia@example.com' }),
          },
        ]),
      },
    }));

    const { getProjectPortfolioSnapshot } = await import('../adminProjectManagementService.js');

    const snapshot = await getProjectPortfolioSnapshot({ limit: 5, offset: 0 });

    expect(findAndCountAll).toHaveBeenCalled();
    expect(snapshot.summary).toMatchObject({
      totalProjects: 1,
      activeProjects: 1,
      completedProjects: 0,
      budgetAllocated: 200000,
    });
    expect(snapshot.projects[0]).toMatchObject({
      id: 1,
      owner: { id: 5, name: 'Amelia Stone' },
      workspace: expect.objectContaining({ progressPercent: 40, riskLevel: 'medium' }),
    });
    expect(Array.isArray(snapshot.board)).toBe(true);
    expect(snapshot.board.find((column) => column.key === 'in_progress')?.projects[0].title).toBe('Marketplace Refresh');
  });
});

describe('adminSpeedNetworkingService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('fetches catalog with hosts and configuration enums', async () => {
    jest.unstable_mockModule('../models/index.js', () => ({
      User: {
        findAll: jest.fn().mockResolvedValue([
          { id: 10, firstName: 'Haley', lastName: 'Host', email: 'haley@example.com', avatarUrl: null, userType: 'admin' },
        ]),
      },
      ProviderWorkspace: {
        findAll: jest.fn().mockResolvedValue([
          { id: 3, name: 'Global Hub', slug: 'global-hub' },
        ]),
      },
    }));

    jest.unstable_mockModule('../models/constants/index.js', () => ({
      SPEED_NETWORKING_SESSION_STATUSES: ['draft', 'published'],
      SPEED_NETWORKING_ACCESS_LEVELS: ['open', 'restricted'],
      SPEED_NETWORKING_VISIBILITIES: ['public', 'private'],
      SPEED_NETWORKING_MATCHING_STRATEGIES: ['round_robin', 'interest_based'],
      SPEED_NETWORKING_PARTICIPANT_ROLES: ['host', 'attendee'],
      SPEED_NETWORKING_PARTICIPANT_STATUSES: ['registered', 'checked_in'],
    }));

    const { fetchSpeedNetworkingCatalog } = await import('../adminSpeedNetworkingService.js');

    const catalog = await fetchSpeedNetworkingCatalog();

    expect(catalog.hosts).toEqual([
      expect.objectContaining({ id: 10, name: 'Haley Host', email: 'haley@example.com' }),
    ]);
    expect(catalog.workspaces[0]).toEqual({ id: 3, name: 'Global Hub', slug: 'global-hub' });
    expect(catalog.statuses).toEqual([
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
    ]);
    expect(catalog.participantRoles).toEqual([
      { value: 'host', label: 'Host' },
      { value: 'attendee', label: 'Attendee' },
    ]);
    expect(typeof catalog.generatedAt).toBe('string');
  });
});

describe('adminTimelineService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('creates a timeline with auto slug and events', async () => {
    const timelineRecord = {
      id: 12,
      reload: jest.fn().mockResolvedValue(null),
      toPublicObject: jest.fn(() => ({ id: 12, name: 'Launch Readiness', slug: 'launch-readiness', events: [] })),
    };

    const transaction = jest.fn((callback) => callback({}));

    jest.unstable_mockModule('../models/index.js', () => ({
      sequelize: { getDialect: () => 'postgres', transaction },
      AdminTimeline: {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(timelineRecord),
        findByPk: jest.fn(),
      },
      AdminTimelineEvent: { bulkCreate: jest.fn() },
      ADMIN_TIMELINE_EVENT_STATUSES: ['planned', 'in_progress', 'completed'],
      ADMIN_TIMELINE_EVENT_TYPES: ['milestone', 'update'],
      ADMIN_TIMELINE_STATUSES: ['draft', 'published'],
      ADMIN_TIMELINE_VISIBILITIES: ['internal', 'public'],
    }));

    const { default: service } = await import('../adminTimelineService.js');

    const result = await service.createTimeline(
      {
        name: 'Launch Readiness',
        description: 'Track go-live tasks',
        status: 'draft',
        visibility: 'internal',
        ownerName: 'Taylor Ops',
        events: [
          {
            title: 'Content freeze',
            summary: 'Freeze marketing copy',
            eventType: 'milestone',
            status: 'planned',
            startDate: '2024-05-20',
          },
        ],
      },
      { actorId: 44 },
    );

    expect(transaction).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 12, slug: 'launch-readiness', name: 'Launch Readiness' });
    expect(timelineRecord.reload).toHaveBeenCalled();
    expect(timelineRecord.toPublicObject).toHaveBeenCalled();
  });
});

describe('adminUserService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns metadata summary of roles and memberships', async () => {
    jest.unstable_mockModule('../models/index.js', () => ({
      User: {
        findAll: jest
          .fn()
          .mockResolvedValueOnce([{ status: 'active', count: '10' }])
          .mockResolvedValueOnce([
            { userType: 'admin', count: '4' },
            { userType: 'agency', count: '6' },
          ])
          .mockResolvedValueOnce([{ twoFactorEnabled: true, count: '8' }]),
      },
      UserRole: {
        findAll: jest.fn().mockResolvedValue([{ role: 'admin', count: '4' }, { role: 'ops', count: '2' }]),
      },
      USER_STATUSES: ['invited', 'active', 'suspended'],
    }));

    const { getMetadata } = await import('../adminUserService.js');

    const metadata = await getMetadata();

    expect(metadata.statuses).toEqual(['invited', 'active', 'suspended']);
    expect(metadata.roles).toEqual(['admin', 'ops']);
    expect(metadata.memberships).toEqual(['admin', 'agency']);
  });
});

describe('adminWalletService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('lists wallet accounts with summary breakdowns', async () => {
    const accountRecord = {
      toPublicObject: () => ({
        id: 71,
        accountType: 'escrow',
        currentBalance: 1200,
        currencyCode: 'USD',
      }),
      user: {
        get: () => ({ id: 10, email: 'client@example.com', firstName: 'Client', lastName: 'Account', userType: 'agency' }),
      },
      profile: {
        get: () => ({ id: 20, headline: 'Agency Lead', location: 'Remote', timezone: 'UTC', availabilityStatus: 'available' }),
      },
    };

    const findAndCountAll = jest.fn().mockResolvedValue({ rows: [accountRecord], count: 1 });
    const findAll = jest
      .fn()
      .mockResolvedValueOnce([{ count: '1', currentBalance: '1200.00', availableBalance: '1000.00', pendingHoldBalance: '200.00' }])
      .mockResolvedValueOnce([{ status: 'active', count: '1' }])
      .mockResolvedValueOnce([{ accountType: 'escrow', count: '1' }]);

    jest.unstable_mockModule('../models/index.js', () => ({
      WalletAccount: { findAndCountAll, findAll },
      WalletLedgerEntry: {},
      User: {},
      Profile: {},
      sequelize: {
        getDialect: () => 'postgres',
        fn: jest.fn((name, arg) => `${name}(${arg})`),
        col: jest.fn((value) => value),
        literal: jest.fn((value) => value),
      },
      WALLET_ACCOUNT_STATUSES: ['active', 'suspended'],
      WALLET_ACCOUNT_TYPES: ['escrow', 'operating'],
      ESCROW_INTEGRATION_PROVIDERS: ['stripe'],
      WALLET_LEDGER_ENTRY_TYPES: ['credit', 'debit'],
    }));

    jest.unstable_mockModule('../utils/errors.js', () => ({
      ConflictError: class ConflictError extends Error {},
      NotFoundError: class NotFoundError extends Error {},
      ValidationError: class ValidationError extends Error {},
    }));

    const { listWalletAccounts } = await import('../adminWalletService.js');

    const response = await listWalletAccounts({ status: 'active', page: 1, pageSize: 10 });

    expect(findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
    expect(response.accounts[0]).toMatchObject({ id: 71, accountType: 'escrow', user: { email: 'client@example.com' } });
    expect(response.summary.global.totals).toMatchObject({ accounts: 1, currentBalance: 1200, availableBalance: 1000 });
    expect(response.summary.filtered.byStatus).toEqual({ active: 1 });
    expect(response.pagination).toMatchObject({ totalItems: 1, totalPages: 1 });
  });
});

describe('agencyAdService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('lists campaigns with summarized placements', async () => {
    const campaignRow = {
      creatives: [
        { status: 'active', placements: [{ status: 'active', surface: 'feed' }, { status: 'scheduled', surface: 'stories' }] },
        { status: 'paused', placements: [] },
      ],
      toPublicObject: () => ({ id: 90, name: 'Launch Awareness', status: 'active' }),
    };

    jest.unstable_mockModule('../models/index.js', () => ({
      AdCampaign: {
        findAndCountAll: jest.fn().mockResolvedValue({ rows: [campaignRow], count: 1 }),
      },
      AdCreative: {},
      AdPlacement: {},
      AdKeywordAssignment: {},
      AdKeyword: {},
      OpportunityTaxonomy: {},
    }));

    const { listCampaigns } = await import('../agencyAdService.js');

    const { campaigns, pagination } = await listCampaigns({ status: 'active', search: 'Launch' }, { actorId: 7, roles: ['agency'] });

    expect(campaigns[0]).toMatchObject({
      id: 90,
      summary: {
        creatives: { total: 2, active: 1 },
        placements: { total: 2, active: 1, upcoming: 1, surfaces: ['feed'] },
      },
    });
    expect(pagination).toMatchObject({ total: 1, page: 1, pageSize: 10 });
  });
});

describe('agencyAiService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns sanitized AI control configuration for workspace managers', async () => {
    const workspace = { id: 55, name: 'Atlas Agency', slug: 'atlas-agency', type: 'agency', isActive: true };
    const configRecord = {
      workspaceId: 55,
      autoReplyEnabled: true,
      autoReplyChannels: ['direct', 'support'],
      autoReplyTemperature: 0.4,
      autoReplyResponseTimeGoal: 8,
      autoBidEnabled: false,
      autoBidStrategy: 'balanced',
      autoBidGuardrails: { requireHumanReview: true },
      analyticsSnapshot: { autoRepliesLast7Days: 4 },
      metadata: { activityLog: [] },
    };

    jest.unstable_mockModule('../models/index.js', () => ({
      AgencyAiConfiguration: {
        findOrCreate: jest.fn().mockResolvedValue([configRecord, false]),
      },
      AgencyAutoBidTemplate: {
        findAll: jest.fn().mockResolvedValue([
          { id: 1, name: 'Rapid Response', status: 'active', strategy: 'aggressive', budgetFloor: 500, budgetCeiling: 2000 },
        ]),
      },
      ProviderWorkspace: {
        findOne: jest.fn().mockResolvedValue(workspace),
        findAll: jest.fn().mockResolvedValue([workspace]),
      },
      ProviderWorkspaceMember: { findAll: jest.fn().mockResolvedValue([]), findOne: jest.fn() },
    }));

    const { getAgencyAiControl } = await import('../agencyAiService.js');

    const response = await getAgencyAiControl({ workspaceId: 55 }, { actorId: 10, actorRole: 'admin' });

    expect(response.workspace).toMatchObject({ id: 55, name: 'Atlas Agency' });
    expect(response.settings.autoReply.channels).toEqual(['direct', 'support']);
    expect(response.templates).toHaveLength(1);
    expect(response.availableWorkspaces[0]).toMatchObject({ id: 55, role: 'admin' });
    expect(response.analytics.autoRepliesLast7Days).toBe(4);
  });
});

describe('agencyCalendarService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('lists agency calendar events with collaborator details', async () => {
    const workspaceRecord = {
      get: () => ({ id: 81, name: 'Northwind Agency', slug: 'northwind', type: 'agency', timezone: 'UTC' }),
      ownerId: 42,
    };
    const workspaceMock = {
      findOne: jest.fn().mockResolvedValue(workspaceRecord),
    };

    jest.unstable_mockModule('../models/index.js', () => ({
      ProviderWorkspace: workspaceMock,
      ProviderWorkspaceMember: {
        count: jest.fn().mockResolvedValue(1),
        findAll: jest.fn().mockResolvedValue([
          {
            get: () => ({
              member: { id: 101, firstName: 'Jamie', lastName: 'Coordinator', email: 'jamie@example.com' },
              role: 'manager',
              status: 'active',
            }),
          },
        ]),
      },
      AgencyCalendarEvent: {
        findAll: jest.fn().mockResolvedValue([
          {
            toPublicObject: () => ({
              id: 11,
              title: 'Client Kickoff',
              type: 'workshop',
              status: 'confirmed',
              startsAt: '2024-05-20T10:00:00Z',
              endsAt: '2024-05-20T11:00:00Z',
              visibility: 'workspace',
            }),
          },
        ]),
      },
      User: {},
    }));

    const { listAgencyCalendarEvents } = await import('../agencyCalendarService.js');

    const result = await listAgencyCalendarEvents({ workspaceId: 81 }, { actorId: 42, actorRole: 'admin' });

    expect(workspaceMock.findOne).toHaveBeenCalled();
    expect(result.workspace).toMatchObject({ id: 81, slug: 'northwind' });
    expect(result.events[0]).toMatchObject({ id: 11, title: 'Client Kickoff' });
    expect(result.collaborators[0]).toMatchObject({ email: 'jamie@example.com', role: 'manager' });
    expect(result.options.types.length).toBeGreaterThan(0);
  });
});

describe('agencyClientKanbanService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('aggregates kanban metrics across columns and clients', async () => {
    const columnsData = [
      {
        id: 1,
        name: 'Discovery',
        cards: [
          {
            id: 11,
            title: 'Acme onboarding',
            clientId: 501,
            client: { id: 501, name: 'Acme Corp', healthStatus: 'green' },
            priority: 'urgent',
            riskLevel: 'low',
            value: 15000,
            nextInteractionAt: '2024-05-25T10:00:00Z',
            checklist: [{ completed: true }, { completed: false }],
            sortOrder: 1,
          },
        ],
      },
      {
        id: 2,
        name: 'Proposal',
        cards: [
          {
            id: 12,
            title: 'Beta renewal',
            clientId: 502,
            client: { id: 502, name: 'Beta Ltd', healthStatus: 'amber' },
            priority: 'normal',
            riskLevel: 'medium',
            value: 22000,
            nextInteractionAt: '2024-05-27T15:00:00Z',
            checklist: [],
            sortOrder: 1,
          },
        ],
      },
    ];

    jest.unstable_mockModule('../models/projectGigManagementModels.js', () => ({
      syncProjectGigManagementModels: jest.fn().mockResolvedValue(),
      ClientKanbanColumn: { findAll: jest.fn().mockResolvedValue(columnsData) },
      ClientKanbanCard: {},
      ClientKanbanChecklistItem: {},
      ClientAccount: {
        findAll: jest.fn().mockResolvedValue([
          { id: 501, name: 'Acme Corp', status: 'active' },
          { id: 502, name: 'Beta Ltd', status: 'active' },
        ]),
      },
      projectGigManagementSequelize: { transaction: jest.fn() },
      CLIENT_ACCOUNT_HEALTH_STATUSES: ['green', 'amber', 'red'],
      CLIENT_ACCOUNT_STATUSES: ['active', 'paused'],
      CLIENT_ACCOUNT_TIERS: ['strategic', 'growth'],
      CLIENT_KANBAN_PRIORITIES: ['urgent', 'normal', 'low'],
      CLIENT_KANBAN_RISK_LEVELS: ['low', 'medium', 'high'],
    }));

    const { getClientKanban } = await import('../agencyClientKanbanService.js');

    const dashboard = await getClientKanban({ ownerId: 7, workspaceId: 15 });

    expect(dashboard.columns).toHaveLength(2);
    expect(dashboard.clients).toHaveLength(2);
    expect(dashboard.metrics).toMatchObject({ totalActiveCards: 2, totalClients: 2, pipelineValue: 37000 });
    expect(dashboard.columnSummary[0]).toEqual({ id: 1, name: 'Discovery', totalCards: 1 });
  });
});

describe('agencyCreationStudioService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('builds overview with cached summary and upcoming launches', async () => {
    const profile = { id: 77, userId: 1 };
    const overviewItem = {
      id: 301,
      ownerWorkspaceId: 12,
      title: 'Summer Campaign',
      targetType: 'project',
      status: 'scheduled',
      priority: 'high',
      visibility: 'public',
      summary: 'Launch summer marketing push',
      tags: ['marketing'],
      requirements: ['brief'],
      assets: [{ id: 1, label: 'Brief', url: 'https://cdn.example.com/brief.pdf', type: 'document' }],
      collaborators: [{ id: 1, userId: 2, name: 'Jamie', status: 'confirmed' }],
      workspace: { id: 12, name: 'Atlas Workspace', slug: 'atlas' },
      createdBy: { id: 1, firstName: 'Ava', lastName: 'Admin', email: 'ava@example.com' },
      updatedBy: { id: 2, firstName: 'Milo', lastName: 'Manager', email: 'milo@example.com' },
      createdAt: '2024-05-10T10:00:00Z',
      updatedAt: '2024-05-11T12:00:00Z',
      launchDate: '2024-06-01T09:00:00Z',
      closingDate: null,
    };

    const findAll = jest
      .fn()
      .mockResolvedValueOnce([
        { status: 'draft', count: '1' },
        { status: 'scheduled', count: '1' },
      ])
      .mockResolvedValueOnce([{ targetType: 'project', count: '2' }])
      .mockResolvedValueOnce([overviewItem]);

    const count = jest
      .fn()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    jest.unstable_mockModule('../models/index.js', () => ({
      AgencyCreationItem: {
        findAndCountAll: jest.fn().mockResolvedValue({ rows: [overviewItem], count: 2 }),
        findAll,
        count,
      },
      AgencyCreationAsset: {},
      AgencyCreationCollaborator: {},
      AgencyProfile: {
        findByPk: jest.fn().mockResolvedValue(profile),
        findOne: jest.fn(),
      },
      ProviderWorkspace: {},
      ProviderWorkspaceMember: { findOne: jest.fn(), findAll: jest.fn() },
      User: {},
      sequelize: { literal: (value) => value },
      AGENCY_CREATION_TARGET_TYPES: ['project', 'gig'],
      AGENCY_CREATION_STATUSES: ['draft', 'scheduled', 'published'],
      AGENCY_CREATION_PRIORITIES: ['high', 'medium', 'low'],
      AGENCY_CREATION_VISIBILITIES: ['internal', 'restricted', 'public'],
      AGENCY_CREATION_ASSET_TYPES: ['document', 'image'],
      AGENCY_CREATION_COLLABORATOR_STATUSES: ['invited', 'confirmed'],
    }));

    jest.unstable_mockModule('../utils/cache.js', () => ({
      appCache: {
        remember: (key, ttl, factory) => factory(),
        flushByPrefix: jest.fn(),
      },
      buildCacheKey: (...parts) => parts.join(':'),
    }));

    jest.unstable_mockModule('../utils/logger.js', () => ({
      default: { child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) },
    }));

    const { getCreationStudioSnapshot } = await import('../agencyCreationStudioService.js');

    const snapshot = await getCreationStudioSnapshot({ agencyProfileId: 77 }, { actorId: 1, actorRole: 'admin' });

    expect(snapshot.items.data[0]).toMatchObject({
      id: 301,
      title: 'Summer Campaign',
      status: 'scheduled',
      assets: [expect.objectContaining({ url: 'https://cdn.example.com/brief.pdf' })],
    });
    expect(snapshot.summary).toMatchObject({
      totalItems: 2,
      backlogCount: 1,
      readyToPublishCount: 1,
    });
    expect(snapshot.summary.upcomingLaunches[0]).toMatchObject({ title: 'Summer Campaign' });
  });
});

describe('agencyDashboardService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns cached dashboard payload when available', async () => {
    const workspaceRecord = { id: 900, ownerId: 1, type: 'agency' };

    jest.unstable_mockModule('../models/index.js', () => ({
      ProviderWorkspace: {
        findOne: jest.fn().mockResolvedValue(workspaceRecord),
      },
      ProviderWorkspaceMember: { count: jest.fn().mockResolvedValue(1) },
      User: {},
    }));

    const remember = jest.fn().mockResolvedValue({ cached: true, workspaceId: workspaceRecord.id });

    jest.unstable_mockModule('../utils/cache.js', () => ({
      appCache: { remember },
      buildCacheKey: (...parts) => parts.join(':'),
    }));

    jest.unstable_mockModule('../utils/errors.js', () => ({
      AuthenticationError: class AuthenticationError extends Error {},
      AuthorizationError: class AuthorizationError extends Error {},
      NotFoundError: class NotFoundError extends Error {},
    }));

    const { getAgencyDashboard } = await import('../agencyDashboardService.js');

    const result = await getAgencyDashboard({ lookbackDays: 30 }, { actorId: 1, actorRole: 'admin' });

    expect(remember).toHaveBeenCalledWith(
      expect.stringContaining('agency:dashboard'),
      60,
      expect.any(Function),
    );
    expect(result).toEqual({ cached: true, workspaceId: 900 });
  });
});

describe('agencyEscrowService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('summarises escrow accounts and transactions for a workspace', async () => {
    const workspaceRecord = { id: 41, ownerId: 3, name: 'Summit Collective', slug: 'summit', settings: { releaseWindowDays: 7 } };

    jest.unstable_mockModule('../models/index.js', () => ({
      ProviderWorkspace: {
        findOne: jest.fn().mockResolvedValue(workspaceRecord),
      },
      ProviderWorkspaceMember: { count: jest.fn().mockResolvedValue(1) },
      EscrowAccount: {
        findAll: jest.fn().mockResolvedValue([
          { toPublicObject: () => ({ id: 1, status: 'active', currencyCode: 'USD' }) },
          { toPublicObject: () => ({ id: 2, status: 'suspended', currencyCode: 'EUR' }) },
        ]),
      },
      EscrowTransaction: {
        findAll: jest.fn().mockResolvedValue([
          {
            toPublicObject: () => ({
              id: 10,
              accountId: 1,
              amount: 1500,
              feeAmount: 45,
              status: 'released',
              currencyCode: 'USD',
              createdAt: '2024-05-01T12:00:00Z',
              scheduledReleaseAt: '2024-05-03T12:00:00Z',
            }),
          },
          {
            toPublicObject: () => ({
              id: 11,
              accountId: 2,
              amount: 800,
              feeAmount: 20,
              status: 'in_escrow',
              currencyCode: 'EUR',
              createdAt: '2024-05-10T09:00:00Z',
              scheduledReleaseAt: '2024-05-20T09:00:00Z',
            }),
          },
        ]),
      },
      User: {},
      sequelize: { getDialect: () => 'postgres' },
    }));

    jest.unstable_mockModule('../utils/errors.js', () => ({
      AuthenticationError: class AuthenticationError extends Error {},
      AuthorizationError: class AuthorizationError extends Error {},
      NotFoundError: class NotFoundError extends Error {},
      ValidationError: class ValidationError extends Error {},
    }));

    const { getEscrowOverview } = await import('../agencyEscrowService.js');

    const overview = await getEscrowOverview({ workspaceId: 41 }, { actorId: 3, actorRole: 'admin' });

    expect(overview.workspace).toMatchObject({ id: 41, name: 'Summit Collective' });
    expect(overview.accountsSummary).toMatchObject({ totalAccounts: 2, activeAccounts: 1, currencies: ['USD', 'EUR'] });
    expect(overview.summary.totals.released).toBeGreaterThan(0);
    expect(overview.recentTransactions).toHaveLength(2);
    expect(overview.settings.releaseWindowDays).toBe(7);
  });
});
