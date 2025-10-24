import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

beforeAll(() => {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
  process.env.ADMIN_MANAGEMENT_MINIMAL_BOOTSTRAP = 'true';
});

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveModule = (specifier) => {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    return specifier;
  }
  return path.resolve(__dirname, specifier);
};

const withDefaultExport = (factory) => () => {
  const moduleExports = factory();
  return Object.prototype.hasOwnProperty.call(moduleExports, 'default')
    ? moduleExports
    : { default: moduleExports, ...moduleExports };
};

const createErrorMocks = () => ({
  ApplicationError: class ApplicationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
  AuthenticationError: class AuthenticationError extends Error {},
  ConflictError: class ConflictError extends Error {},
  ModerationError: class ModerationError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
  ValidationError: class ValidationError extends Error {},
});

const mockErrorsModule = (overrides = {}) =>
  withDefaultExport(() => ({
    ...createErrorMocks(),
    ...overrides,
  }));

describe('companyLaunchpadService', () => {
  it('builds an empty dashboard snapshot when no links exist', async () => {
    const launchpadRecord = { toPublicObject: () => ({ id: 10, title: 'Future Leaders' }) };

    const ExperienceLaunchpadOpportunityLink = {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    };

    const ExperienceLaunchpad = {
      findAll: jest.fn().mockResolvedValue([launchpadRecord]),
      findByPk: jest.fn().mockResolvedValue(launchpadRecord),
    };

    const models = {
      ExperienceLaunchpadOpportunityLink,
      ExperienceLaunchpad,
      ExperienceLaunchpadPlacement: { findAll: jest.fn() },
      Job: { findAll: jest.fn(), findByPk: jest.fn() },
      JobAdvert: { findAll: jest.fn(), findOne: jest.fn() },
      User: {},
      sequelize: { Op: { in: Symbol('in'), ne: Symbol('ne') } },
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => models));

    const { getLaunchpadJobDashboard } = await import('../companyLaunchpadService.js');

    const snapshot = await getLaunchpadJobDashboard({ workspaceId: 55, lookbackDays: 60 });
    expect(snapshot.summary).toEqual({
      totalLinks: 0,
      totalPlacements: 0,
      activePlacements: 0,
      launchpads: 1,
    });
    expect(snapshot.lookups.launchpads).toHaveLength(1);
    expect(ExperienceLaunchpadOpportunityLink.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ targetType: 'job' }) }),
    );
  });

  it('creates launchpad job links and returns sanitised payloads', async () => {
    const createdLink = {
      launchpadId: 7,
      targetId: 44,
      get: jest.fn().mockReturnValue({
        id: 91,
        launchpadId: 7,
        targetId: 44,
        source: 'manual',
        notes: null,
      }),
    };

    const launchpadRecord = {
      id: 7,
      toPublicObject: () => ({ id: 7, title: 'Apprentice Track' }),
    };

    const jobRecord = { id: 44, title: 'Backend Engineer', location: 'Remote' };
    const advertRecord = { jobId: 44, workspaceId: 55, status: 'published' };

    const linkedModels = {
      ExperienceLaunchpadOpportunityLink: {
        create: jest.fn().mockResolvedValue(createdLink),
        findByPk: jest.fn(),
      },
      ExperienceLaunchpad: {
        findByPk: jest.fn().mockResolvedValue(launchpadRecord),
      },
      ExperienceLaunchpadPlacement: { findAll: jest.fn() },
      Job: {
        findByPk: jest.fn().mockResolvedValue(jobRecord),
        findAll: jest.fn(),
      },
      JobAdvert: {
        findOne: jest.fn().mockResolvedValue(advertRecord),
        findAll: jest.fn(),
      },
      User: {},
      sequelize: { Op: { in: Symbol('in'), ne: Symbol('ne') } },
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => linkedModels));

    const { linkJobToLaunchpad } = await import('../companyLaunchpadService.js');

    const payload = await linkJobToLaunchpad({
      launchpadId: 7,
      jobId: 44,
      source: 'manual',
      notes: 'High priority cohort',
      createdById: 9,
    });

    expect(payload.launchpad).toEqual({ id: 7, title: 'Apprentice Track' });
    expect(payload.job.title).toBe('Backend Engineer');
    expect(payload.metrics.placements).toBe(0);
  });
});

describe('explorerStore', () => {
  it('initialises a missing dataset and returns empty collections', async () => {
    const pathExists = jest.fn().mockResolvedValue(false);
    const ensureFile = jest.fn().mockResolvedValue();
    const writeJson = jest.fn().mockResolvedValue();
    const readJson = jest.fn();

    jest.unstable_mockModule(resolveModule('fs-extra'), () => ({
      default: { pathExists, ensureFile, writeJson, readJson },
      pathExists,
      ensureFile,
      writeJson,
      readJson,
    }));

    jest.unstable_mockModule(resolveModule('../../utils/explorerCollections.js'), () => ({
      CATEGORY_COLLECTION_MAP: { marketing: 'marketing' },
      getExplorerCollections: () => ['marketing', 'sales'],
      inferExplorerCategoryFromCollection: (collection) => collection,
    }));

    const { listRecords } = await import('../explorerStore.js');

    const marketing = await listRecords('marketing');
    expect(marketing).toEqual([]);
    expect(pathExists).toHaveBeenCalled();
    expect(ensureFile).toHaveBeenCalled();
    expect(writeJson).toHaveBeenCalledWith(expect.any(String), expect.any(Object), { spaces: 2 });
  });

  it('creates and updates records with category inference', async () => {
    const dataset = { marketing: [], sales: [] };
    const pathExists = jest.fn().mockResolvedValue(true);
    const ensureFile = jest.fn();
    const writeJson = jest.fn().mockImplementation(async (_, data) => {
      Object.assign(dataset, data);
    });
    const readJson = jest.fn().mockResolvedValue(dataset);

    jest.unstable_mockModule(resolveModule('fs-extra'), () => ({
      default: { pathExists, ensureFile, writeJson, readJson },
      pathExists,
      ensureFile,
      writeJson,
      readJson,
    }));

    jest.unstable_mockModule(resolveModule('../../utils/explorerCollections.js'), () => ({
      CATEGORY_COLLECTION_MAP: { marketing: 'marketing' },
      getExplorerCollections: () => ['marketing', 'sales'],
      inferExplorerCategoryFromCollection: (collection) => `${collection}-fallback`,
    }));

    const { createRecord, updateRecord, getRecord } = await import('../explorerStore.js');

    const created = await createRecord('marketing', { title: 'Launch kit' });
    expect(created.id).toBeDefined();
    expect(created.category).toBe('marketing');

    const updated = await updateRecord('marketing', created.id, { title: 'Launch kit v2' });
    expect(updated.title).toBe('Launch kit v2');

    const fetched = await getRecord('marketing', created.id);
    expect(fetched.title).toBe('Launch kit v2');
    expect(writeJson).toHaveBeenCalledTimes(2);
  });
});

describe('explorerEngagementStore', () => {
  it('records and retrieves interactions per collection and record', async () => {
    const dataset = { marketing: {}, sales: {} };
    const pathExists = jest.fn().mockResolvedValue(true);
    const ensureFile = jest.fn();
    const writeJson = jest.fn().mockImplementation(async (_, data) => {
      Object.assign(dataset, data);
    });
    const readJson = jest.fn().mockResolvedValue(dataset);

    jest.unstable_mockModule(resolveModule('fs-extra'), () => ({
      default: { pathExists, ensureFile, writeJson, readJson },
      pathExists,
      ensureFile,
      writeJson,
      readJson,
    }));

    jest.unstable_mockModule(resolveModule('../../utils/explorerCollections.js'), () => ({
      getExplorerCollections: () => ['marketing', 'sales'],
    }));

    const {
      createInteraction,
      listInteractions,
      updateInteraction,
      deleteInteraction,
    } = await import('../explorerEngagementStore.js');

    const created = await createInteraction('marketing', 'record-1', {
      type: 'view',
      metadata: { source: 'email' },
    });

    expect(created.id).toBeDefined();
    expect(created.categoryCollection).toBe('marketing');

    const updated = await updateInteraction('marketing', 'record-1', created.id, {
      status: 'engaged',
    });
    expect(updated.status).toBe('engaged');

    const interactions = await listInteractions('marketing', 'record-1');
    expect(interactions).toHaveLength(1);
    expect(interactions[0].status).toBe('engaged');

    const deleted = await deleteInteraction('marketing', 'record-1', created.id);
    expect(deleted).toBe(true);
    expect(writeJson).toHaveBeenCalledTimes(3);
  });
});

describe('companyOrdersService', () => {
  it('creates company orders with structured deliverables', async () => {
    const createGigOrder = jest.fn().mockResolvedValue({ id: 33, requirements: [] });

    jest.unstable_mockModule(resolveModule('../projectGigManagementWorkflowService.js'), () => ({
      createGigOrder,
      updateGigOrder: jest.fn(),
      getGigOrderDetail: jest.fn(),
      addGigTimelineEvent: jest.fn(),
      updateGigTimelineEvent: jest.fn(),
      createGigOrderMessage: jest.fn(),
      createGigOrderEscrowCheckpoint: jest.fn(),
      updateGigOrderEscrowCheckpoint: jest.fn(),
      getProjectGigManagementOverview: jest.fn(),
    }));

    const orderModels = {
      GigOrder: { findByPk: jest.fn(), findOne: jest.fn() },
      GigTimelineEvent: { findByPk: jest.fn() },
      GigSubmission: { findByPk: jest.fn() },
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => orderModels));

    const { createCompanyOrder } = await import('../companyOrdersService.js');

    await createCompanyOrder({
      ownerId: 17,
      payload: {
        vendorName: 'Bright Studio',
        serviceName: 'Website refresh',
        amount: 2400,
        currency: 'usd',
        deliverables: [
          { title: 'Discovery workshop', amount: 800 },
          { title: 'Design system', amount: 1600 },
        ],
      },
      accessContext: { canManage: true, canView: true, permissions: [], actorId: 17 },
    });

    expect(createGigOrder).toHaveBeenCalledWith(
      17,
      expect.objectContaining({
        metadata: expect.objectContaining({ deliverables: expect.any(Array) }),
        classes: expect.any(Array),
        requirements: expect.any(Array),
      }),
    );
    const args = createGigOrder.mock.calls[0][1];
    expect(args.classes).toHaveLength(3);
    expect(args.classes[0]).toMatchObject({ name: 'Discovery workshop' });
    expect(args.classes[1]).toMatchObject({ name: 'Design system' });
    expect(args.requirements[0]).toMatchObject({ title: 'Discovery workshop' });
  });

  it('derives dashboard metrics for open and closed orders', async () => {
    const overview = {
      summary: { totalSpend: 4500 },
      purchasedGigs: {
        currency: 'USD',
        orders: [
          { id: 1, status: 'open', isClosed: false, amount: 1200, escrowHeldAmount: 200 },
          { id: 2, status: 'closed', isClosed: true, amount: 900, escrowHeldAmount: 0 },
        ],
        timeline: { upcoming: [], recent: [] },
        chat: { recent: [] },
      },
    };

    const getProjectGigManagementOverview = jest.fn().mockResolvedValue(overview);

    jest.unstable_mockModule(resolveModule('../projectGigManagementWorkflowService.js'), () => ({
      createGigOrder: jest.fn(),
      updateGigOrder: jest.fn(),
      getGigOrderDetail: jest.fn(),
      addGigTimelineEvent: jest.fn(),
      updateGigTimelineEvent: jest.fn(),
      createGigOrderMessage: jest.fn(),
      createGigOrderEscrowCheckpoint: jest.fn(),
      updateGigOrderEscrowCheckpoint: jest.fn(),
      getProjectGigManagementOverview,
    }));

    const dashboardModels = {
      GigOrder: { findByPk: jest.fn(), findOne: jest.fn() },
      GigTimelineEvent: { findByPk: jest.fn() },
      GigSubmission: { findByPk: jest.fn() },
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => dashboardModels));

    const { getCompanyOrdersDashboard } = await import('../companyOrdersService.js');

    const dashboard = await getCompanyOrdersDashboard({
      ownerId: 22,
      status: 'open',
      accessContext: { canView: true, canManage: false, permissions: [], actorId: 22 },
    });
    expect(getProjectGigManagementOverview).toHaveBeenCalledWith(22);
    expect(dashboard.metrics.totalOrders).toBe(1);
    expect(dashboard.metrics.valueInFlight).toBe(1200);
    expect(dashboard.summary.totalSpend).toBe(4500);
    expect(dashboard.sla.counts.total).toBe(0);
  });
});

describe('companyPageService', () => {
  it('lists pages with analytics and governance context', async () => {
    const workspace = { id: 21, name: 'Acme' };
    const rows = [
      {
        get: jest.fn().mockReturnValue({
          id: 1,
          title: 'Careers',
          headline: 'Join our team',
          status: 'draft',
          sections: [],
          collaborators: [],
          media: [],
          revisions: [],
        }),
      },
    ];

    const analyticsRows = [
      {
        get: jest.fn().mockReturnValue({
          id: 1,
          title: 'Careers',
          slug: 'careers',
          status: 'draft',
          visibility: 'private',
          heroImageUrl: null,
          publishedAt: null,
          scheduledFor: null,
          analytics: { views: 120 },
          createdBy: { id: 4, Profile: { fullName: 'Alex Doe' } },
        }),
      },
    ];

    const companyPageModels = {
      CompanyPage: {
        findAndCountAll: jest.fn().mockResolvedValue({ rows, count: 1 }),
        findAll: jest.fn().mockResolvedValue(analyticsRows),
      },
      CompanyPageSection: {},
      CompanyPageCollaborator: {},
      CompanyPageMedia: {},
      CompanyPageRevision: {},
      COMPANY_PAGE_STATUSES: ['draft', 'published'],
      COMPANY_PAGE_VISIBILITIES: ['private', 'public'],
      COMPANY_PAGE_SECTION_VARIANTS: [],
      COMPANY_PAGE_COLLABORATOR_ROLES: [],
      COMPANY_PAGE_COLLABORATOR_STATUSES: [],
    };

    const pageModels = {
      ProviderWorkspace: { findByPk: jest.fn().mockResolvedValue(workspace) },
      User: {},
      Profile: {},
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => pageModels));
    jest.unstable_mockModule(
      resolveModule('../../models/companyPageModels.js'),
      withDefaultExport(() => companyPageModels),
    );
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { listCompanyPages } = await import('../companyPageService.js');

    const result = await listCompanyPages({ workspaceId: 21 });
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].title).toBe('Careers');
    expect(result.stats.total).toBe(1);
    expect(result.governance.heroImageRequired).toBe(1);
    expect(result.lookups).toBeUndefined();
  });
});

describe('companyProfileService', () => {
  it('normalises company details and persists social links', async () => {
    const profileRecord = {
      id: 12,
      userId: 12,
      companyName: 'Legacy',
      socialLinks: [],
      update: jest.fn(async function update(updates) {
        Object.assign(this, updates);
        return this;
      }),
    };

    const profileModels = {
      CompanyProfile: {
        findOne: jest.fn().mockResolvedValue(profileRecord),
      },
      CompanyProfileFollower: {},
      CompanyProfileConnection: {},
      User: {},
      Profile: {},
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => profileModels));
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    jest.unstable_mockModule(resolveModule('../../utils/location.js'), () => ({
      normalizeLocationPayload: jest.fn().mockReturnValue({
        location: 'London, UK',
        geoLocation: { lat: 51.5, lng: -0.12 },
      }),
      buildLocationDetails: jest.fn().mockReturnValue({ city: 'London', country: 'UK' }),
    }));

    const service = await import('../companyProfileService.js');

    const updated = await service.default.updateCompanyProfileDetails(12, {
      companyName: '  Gigvora Labs  ',
      tagline: 'Future of work',
      website: 'gigvora.com',
      socialLinks: ['https://linkedin.com/company/gigvora'],
    });

    expect(profileRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: 'Gigvora Labs',
        tagline: 'Future of work',
        socialLinks: [{ label: null, url: 'https://linkedin.com/company/gigvora' }],
      }),
    );
    expect(updated.companyName).toBe('Gigvora Labs');
    expect(updated.locationDetails).toEqual({ city: 'London', country: 'UK' });
  });
});

describe('companyTimelineService', () => {
  it('aggregates events, posts, and metrics for management snapshot', async () => {
    const events = [
      { id: 1, status: 'scheduled', startDate: '2024-05-01', dueDate: '2024-05-10' },
      { id: 2, status: 'completed', startDate: '2024-04-01', dueDate: '2024-04-05' },
    ];
    const posts = [
      { id: 11, status: 'published', tags: ['launch', 'product'] },
      { id: 12, status: 'draft', tags: ['culture'] },
    ];
    const metrics = [
      { id: 101, postId: 11, metricDate: '2024-05-10', impressions: 500, clicks: 40, reactions: 12, comments: 5, shares: 3, saves: 2 },
      { id: 102, postId: 11, metricDate: '2024-05-11', impressions: 250, clicks: 20, reactions: 8, comments: 4, shares: 2, saves: 1 },
      { id: 103, postId: 12, metricDate: '2024-05-09', impressions: 80, clicks: 4, reactions: 2, comments: 1, shares: 0, saves: 0 },
    ];

    const timelineModels = {
      ProviderWorkspace: { findByPk: jest.fn() },
      CompanyTimelineEvent: { findAll: jest.fn().mockResolvedValue(events) },
      CompanyTimelinePost: { findAll: jest.fn().mockResolvedValue(posts) },
      CompanyTimelinePostMetric: { findAll: jest.fn().mockResolvedValue(metrics) },
      COMPANY_TIMELINE_EVENT_STATUSES: ['scheduled', 'completed'],
      COMPANY_TIMELINE_POST_STATUSES: ['draft', 'published'],
      COMPANY_TIMELINE_POST_VISIBILITIES: ['internal', 'public'],
      User: {},
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => timelineModels));

    const { getTimelineManagementSnapshot } = await import('../companyTimelineService.js');

    const snapshot = await getTimelineManagementSnapshot({ workspaceId: 5, workspace: { id: 5 } });
    expect(snapshot.workspaceId).toBe(5);
    expect(snapshot.events.items).toHaveLength(2);
    expect(snapshot.events.statusCounts.completed).toBe(1);
    expect(snapshot.posts.items[0].metricsSummary.totals.impressions).toBe(750);
    expect(snapshot.analytics.totals.impressions).toBe(830);
    expect(snapshot.posts.tagFrequency.launch).toBe(1);
  });
});

describe('complianceLockerService', () => {
  it('creates compliance documents with versions, obligations, and reminders', async () => {
    const documentRecord = {
      id: 88,
      ownerId: 42,
      toPublicObject: jest.fn().mockReturnValue({ id: 88, ownerId: 42 }),
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue(),
    };

    const createdVersion = {
      id: 5,
      reload: jest.fn().mockResolvedValue(),
      toPublicObject: jest.fn().mockReturnValue({ id: 5 }),
    };

    jest.unstable_mockModule(resolveModule('../../utils/cache.js'), () => ({
      appCache: { flushByPrefix: jest.fn(), get: jest.fn(), set: jest.fn() },
      buildCacheKey: jest.fn((prefix, payload) => `${prefix}:${JSON.stringify(payload)}`),
    }));

    const assertComplianceInfrastructureOperational = jest
      .fn()
      .mockResolvedValue(true);

    jest.unstable_mockModule(resolveModule('../runtimeDependencyGuard.js'), () => ({
      assertComplianceInfrastructureOperational,
    }));

    const complianceModels = {
      sequelize: {
        Op: { gte: Symbol('gte'), in: Symbol('in'), ne: Symbol('ne') },
        transaction: async (handler) => handler({}),
      },
      ComplianceDocument: {
        create: jest.fn().mockResolvedValue(documentRecord),
        findByPk: jest.fn(),
      },
      ComplianceDocumentVersion: {
        create: jest.fn().mockResolvedValue(createdVersion),
        max: jest.fn(),
      },
      ComplianceObligation: { create: jest.fn().mockImplementation(async (payload) => ({ id: Date.now(), ...payload })) },
      ComplianceReminder: { create: jest.fn().mockResolvedValue({}) },
      ComplianceLocalization: {},
      ComplianceDocumentLocalization: {},
      ComplianceReminderLocalization: {},
      ComplianceObligationLocalization: {},
      User: {},
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => complianceModels));
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { createComplianceDocument } = await import('../complianceLockerService.js');

    const payload = await createComplianceDocument({
      ownerId: 42,
      title: 'Master Services Agreement',
      storagePath: 'contracts/msa.pdf',
      workspaceId: 77,
      tags: ['msa'],
      version: {
        fileKey: 'contracts/msa.pdf',
        fileName: 'msa.pdf',
        mimeType: 'application/pdf',
      },
      obligations: [
        { description: 'Renew annually', clauseReference: 'clause-1' },
      ],
      reminders: [
        { reminderType: 'renewal', clauseReference: 'clause-1' },
      ],
    });

    expect(payload).toEqual({ id: 88, ownerId: 42 });
    expect(assertComplianceInfrastructureOperational).toHaveBeenCalledWith(
      expect.objectContaining({ feature: 'compliance_document:create' }),
    );
    expect(documentRecord.update).toHaveBeenCalledWith({ latestVersionId: 5 }, { transaction: expect.any(Object) });
    expect(createdVersion.reload).toHaveBeenCalled();
  });
});

describe('complianceService', () => {
  it('provisions wallet accounts with custody provider resolution', async () => {
    const account = {
      custodyProvider: 'stripe',
      status: 'pending',
      update: jest.fn().mockResolvedValue(),
    };

    const findOrCreate = jest.fn().mockResolvedValue([account, true]);

    jest.unstable_mockModule(resolveModule('../runtimeDependencyGuard.js'), () => ({
      assertComplianceInfrastructureOperational: jest.fn(),
      assertPaymentInfrastructureOperational: jest.fn().mockResolvedValue(true),
    }));

    jest.unstable_mockModule(resolveModule('../../utils/dependencyGate.js'), () => ({
      assertDependenciesHealthy: jest.fn(),
    }));

    const walletModels = {
      WalletAccount: { findOrCreate },
      WalletLedgerEntry: {},
      WalletAccountLedgerSnapshot: {},
      WalletIntegration: {},
      User: {},
      Profile: {},
      CompanyProfile: {},
      AgencyProfile: {},
      FreelancerProfile: {},
      QualificationCredential: {},
      IdentityVerification: {},
      CorporateVerification: {},
      EscrowAccount: {},
      ID_VERIFICATION_STATUSES: ['pending', 'approved', 'rejected'],
      CORPORATE_VERIFICATION_STATUSES: ['pending', 'approved', 'rejected'],
      QUALIFICATION_CREDENTIAL_STATUSES: ['pending', 'verified', 'revoked'],
      WALLET_ACCOUNT_TYPES: ['operating', 'user', 'freelancer', 'company', 'agency'],
      WALLET_LEDGER_ENTRY_TYPES: ['credit', 'debit'],
      ESCROW_INTEGRATION_PROVIDERS: ['escrow_com', 'stripe', 'stripe_treasury'],
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => walletModels));

    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { ensureWalletAccount } = await import('../complianceService.js');

    const result = await ensureWalletAccount({
      userId: 9,
      profileId: 30,
      accountType: 'operating',
      custodyProvider: 'stripe_treasury',
    });

    expect(findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 9, profileId: 30, accountType: 'operating' }),
      }),
    );
    expect(account.update).toHaveBeenCalledWith(
      expect.objectContaining({ custodyProvider: 'stripe_treasury', status: 'active' }),
      { transaction: undefined },
    );
    expect(result).toBe(account);
  });
});

describe('connectionService', () => {
  it('creates pending connection requests for compatible roles', async () => {
    const requester = {
      id: 1,
      userType: 'company',
      firstName: 'Ava',
      lastName: 'Stone',
      email: 'ava@example.com',
      Profile: { headline: 'Builder' },
    };
    const target = {
      id: 2,
      userType: 'freelancer',
      firstName: 'Liam',
      lastName: 'Fox',
      email: 'liam@example.com',
      Profile: { headline: 'Designer' },
    };

    const connectionModels = {
      Connection: {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 99, status: 'pending', createdAt: new Date(), updatedAt: new Date() }),
        findByPk: jest.fn(),
      },
      User: {
        findByPk: jest
          .fn()
          .mockImplementation((id) => (id === 1 ? requester : id === 2 ? target : null)),
      },
      Profile: {},
      ConnectionDiscovery: {},
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => connectionModels));

    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { requestConnection } = await import('../connectionService.js');

    const result = await requestConnection(1, 2);
    expect(result.status).toBe('pending');
    expect(result.requester.name).toBe('Ava Stone');
    expect(result.addressee.userType).toBe('freelancer');
  });
});

describe('consentService', () => {
  it('sanitises policy payload and validates retention period', async () => {
    jest.unstable_mockModule(resolveModule('../../models/consentModels.js'), () => ({
      ConsentPolicy: {},
      ConsentPolicyVersion: {},
      UserConsent: {},
      ConsentAuditEvent: {},
      normaliseConsentCode: (value) => value?.toLowerCase().replace(/\s+/g, '-'),
      activatePolicyVersion: jest.fn(),
      supersedePolicyVersion: jest.fn(),
    }));

    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { sanitisePolicyPayload } = await import('../consentService.js');

    const payload = sanitisePolicyPayload({
      code: 'Marketing Updates',
      title: 'Marketing Updates',
      description: 'Stay in the loop',
      audience: 'USER',
      region: 'EU',
      legalBasis: 'consent',
      required: false,
      retentionPeriodDays: 120,
      metadata: { channel: 'email' },
    });

    expect(payload.code).toBe('marketing-updates');
    expect(payload.audience).toBe('user');
    expect(payload.region).toBe('eu');
    expect(payload.retentionPeriodDays).toBe(120);
  });

  it('lists consent policies including inactive versions', async () => {
    const summary = { id: 1, code: 'marketing', activeVersionId: 2 };
    const policyInstance = { toSummary: jest.fn().mockReturnValue(summary) };

    jest.unstable_mockModule(resolveModule('../../models/consentModels.js'), () => ({
      ConsentPolicy: {
        findAll: jest.fn().mockResolvedValue([policyInstance]),
        findOne: jest.fn(),
        create: jest.fn(),
      },
      ConsentPolicyVersion: {},
      UserConsent: {},
      ConsentAuditEvent: {},
      normaliseConsentCode: (value) => value?.toLowerCase().replace(/\s+/g, '-'),
      activatePolicyVersion: jest.fn(),
      supersedePolicyVersion: jest.fn(),
    }));

    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { listConsentPolicies } = await import('../consentService.js');
    const policies = await listConsentPolicies({ includeInactive: true });
    expect(policies).toEqual([summary]);
    expect(policyInstance.toSummary).toHaveBeenCalledWith({ includeVersions: true });
  });
});

describe('contentModerationService', () => {
  it('rejects content containing banned terms', async () => {
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { evaluateFeedPostContent } = await import('../contentModerationService.js');

    const result = evaluateFeedPostContent({ content: 'This post promotes porn services.' });
    expect(result.decision).toBe('reject');
    expect(result.reasons[0]).toContain('not permitted');
  });

  it('allows compliant posts and enforces policy warnings', async () => {
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { evaluateFeedPostContent, enforceFeedPostPolicies } = await import('../contentModerationService.js');

    const evaluation = evaluateFeedPostContent({
      title: 'Weekly update',
      summary: 'Progress from the team',
      content: 'We shipped two features and fixed five bugs.',
      attachments: [{ type: 'image', url: 'https://cdn.example.com/update.png' }],
    });

    expect(evaluation.decision).toBe('approve');

    const enforcement = enforceFeedPostPolicies(evaluation);
    expect(enforcement.decision).toBe('approve');
    expect(enforcement.reasons).toHaveLength(0);
  });
});

describe('creationStudioService', () => {
  it('lists creation studio items with sanitised structures', async () => {
    const record = {
      toPublicObject: () => ({ id: 4, title: 'Hero Campaign', type: 'campaign', status: 'draft', steps: null }),
    };

    const creationModels = {
      CreationStudioItem: {
        findAll: jest.fn().mockResolvedValue([record]),
      },
      CreationStudioCollaborator: { findAll: jest.fn() },
      CreationStudioStep: {},
      CREATION_STUDIO_ITEM_TYPES: ['campaign', 'ad'],
      CREATION_STUDIO_ITEM_STATUSES: ['draft', 'published', 'archived'],
      CREATION_STUDIO_VISIBILITIES: ['private', 'public'],
      CREATION_STUDIO_STEPS: [],
      CREATION_STUDIO_COLLABORATOR_STATUSES: ['invited', 'accepted', 'removed'],
    };

    jest.unstable_mockModule(
      resolveModule('../../models/creationStudioModels.js'),
      withDefaultExport(() => creationModels),
    );

    const { listCreationStudioItems } = await import('../creationStudioService.js');
    const items = await listCreationStudioItems({ workspaceId: 15, type: 'Campaign' });
    expect(items).toEqual([{ id: 4, title: 'Hero Campaign', type: 'campaign', status: 'draft', steps: [] }]);
  });
});

describe('databaseLifecycleService', () => {
  it('warms database connections and records pool metrics', async () => {
    const pool = {
      max: 10,
      min: 0,
      size: 3,
      available: 2,
      pending: 0,
      borrowed: 1,
      on: jest.fn(),
    };

    const queryMock = jest.fn().mockImplementation((sql) => {
      if (typeof sql === 'string' && sql.includes('current_setting')) {
        return Promise.resolve([[{ isolationlevel: 'read committed', readonly: 'off' }]]);
      }
      if (typeof sql === 'string' && sql.includes('pg_is_in_recovery')) {
        return Promise.resolve([[{ inrecovery: false }]]);
      }
      if (typeof sql === 'string' && sql.startsWith('SELECT name FROM')) {
        return Promise.resolve([[{ name: '20240101000000-init.js' }]]);
      }
      return Promise.resolve([[{ journal_mode: 'wal' }]]);
    });

    const fsPromisesMock = {
      readdir: jest.fn().mockResolvedValue([
        { name: '20240101000000-init.js', isFile: () => true },
        { name: 'README.md', isFile: () => true },
      ]),
    };

    jest.unstable_mockModule(resolveModule('fs'), () => ({
      promises: fsPromisesMock,
      default: { promises: fsPromisesMock },
    }));

    jest.unstable_mockModule(resolveModule('../../models/sequelizeClient.js'), () => ({
      default: {
        authenticate: jest.fn().mockResolvedValue(true),
        getDialect: () => 'postgres',
        connectionManager: { pool },
        getQueryInterface: () => ({ quoteTable: () => '"SequelizeMeta"' }),
        query: queryMock,
        close: jest.fn(),
      },
    }));

    jest.unstable_mockModule(resolveModule('../../models/databaseAuditEvent.js'), () => ({
      DatabaseAuditEvent: { recordEvent: jest.fn().mockResolvedValue({ get: () => ({ id: 1 }) }) },
    }));

    const markHealthy = jest.fn();
    const markUnavailable = jest.fn();

    jest.unstable_mockModule(resolveModule('../../lifecycle/runtimeHealth.js'), () => ({
      markDependencyHealthy: markHealthy,
      markDependencyUnavailable: markUnavailable,
    }));

    jest.unstable_mockModule(resolveModule('../../utils/logger.js'), () => ({
      default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
    }));

    const { warmDatabaseConnections, getDatabasePoolSnapshot } = await import('../databaseLifecycleService.js');

    const snapshot = await warmDatabaseConnections({ initiatedBy: 'test' });
    expect(snapshot.max).toBe(10);
    expect(markHealthy).toHaveBeenCalledWith(
      'database',
      expect.objectContaining({ vendor: 'postgres', pool: expect.objectContaining({ borrowed: 1 }) }),
    );

    const liveSnapshot = getDatabasePoolSnapshot();
    expect(liveSnapshot.lastEvent).toBe('warm');
    expect(markUnavailable).not.toHaveBeenCalled();
  });
});

describe('databaseSettingsService', () => {
  it('tests transient database connections and reports latency', async () => {
    const authenticate = jest.fn().mockResolvedValue(true);
    const close = jest.fn().mockResolvedValue();

    jest.unstable_mockModule(resolveModule('sequelize'), () => ({
      Sequelize: jest.fn().mockImplementation(() => ({ authenticate, close })),
      Op: { iLike: Symbol('iLike'), like: Symbol('like'), or: Symbol('or'), in: Symbol('in') },
    }));

    jest.unstable_mockModule(resolveModule('../../models/databaseConnectionProfile.js'), () => ({
      DatabaseConnectionProfile: { findByPk: jest.fn() },
    }));

    jest.unstable_mockModule(resolveModule('../../models/databaseAuditEvent.js'), () => ({
      DatabaseAuditEvent: { recordEvent: jest.fn() },
    }));

    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    jest.unstable_mockModule(resolveModule('../../utils/logger.js'), () => ({
      default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
    }));

    const { testDatabaseConnection } = await import('../databaseSettingsService.js');

    const result = await testDatabaseConnection({
      name: 'Primary Warehouse',
      host: 'db.example.com',
      port: 5432,
      username: 'service',
      password: 'secret123',
      database: 'gigvora',
      dialect: 'postgresql',
      sslMode: 'prefer',
    });

    expect(authenticate).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(['healthy', 'warning']).toContain(result.status);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe('deliverableVaultService', () => {
  it('creates deliverable vault items and returns updated overview', async () => {
    const vault = {
      id: 7,
      freelancerId: 21,
      toPublicObject: () => ({ id: 7, freelancerId: 21 }),
    };
    const itemRecord = {
      id: 15,
      status: 'draft',
      metadata: {},
      update: jest.fn().mockResolvedValue(),
      toPublicObject: () => ({ id: 15, title: 'Brand refresh', status: 'draft' }),
    };

    const deliverableModels = {
      sequelize: { transaction: async (handler) => handler({}) },
      User: { findByPk: jest.fn().mockResolvedValue({ id: 21 }) },
      DeliverableVault: { findOrCreate: jest.fn().mockResolvedValue([vault, true]) },
      DeliverableVaultItem: {
        create: jest.fn().mockResolvedValue(itemRecord),
        findOne: jest.fn().mockResolvedValue({
          vault,
          toPublicObject: () => ({ id: 15, title: 'Brand refresh', status: 'draft' }),
        }),
        findAll: jest.fn().mockResolvedValue([
          {
            toPublicObject: () => ({ id: 15, title: 'Brand refresh', status: 'draft', versions: [], deliveryPackages: [] }),
            metadata: {},
          },
        ]),
      },
      DeliverableVersion: {
        max: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 1, versionNumber: 1 }),
      },
      DeliverableDeliveryPackage: {},
      DELIVERABLE_ITEM_STATUSES: ['draft', 'in_review', 'approved', 'archived'],
      DELIVERABLE_ITEM_NDA_STATUSES: ['pending', 'signed', 'waived', 'not_required'],
      DELIVERABLE_ITEM_WATERMARK_MODES: ['inherit', 'dynamic', 'static'],
      DELIVERABLE_RETENTION_POLICIES: ['short_term_18_month', 'standard_7_year'],
      DELIVERABLE_VAULT_WATERMARK_MODES: ['dynamic', 'static'],
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => deliverableModels));

    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { createVaultItem } = await import('../deliverableVaultService.js');

    const result = await createVaultItem({
      freelancerId: 21,
      actorId: 42,
      payload: {
        title: 'Brand refresh',
        status: 'draft',
        ndaRequired: true,
        ndaStatus: 'pending',
        tags: ['branding'],
        initialVersion: { fileName: 'deliverable.pdf', fileUrl: 'https://cdn/files/deliverable.pdf' },
      },
    });

    expect(result.item.title).toBe('Brand refresh');
    expect(result.overview.summary.totalItems).toBe(1);
    expect(itemRecord.update).toHaveBeenCalled();
  });
});

describe('discoveryService', () => {
  it('normalises opportunities into DTOs per category', async () => {
    const discoveryModels = {
      sequelize: { getDialect: () => 'postgres' },
      Job: {},
      Gig: {},
      Project: {},
      ExperienceLaunchpad: {},
      Volunteering: {},
      MentorProfile: { sequelize: { fn: jest.fn(() => 'fn'), col: jest.fn(() => 'col') } },
      OpportunityTaxonomyAssignment: { findAll: jest.fn() },
      OpportunityTaxonomy: { findAll: jest.fn() },
      MENTOR_AVAILABILITY_STATUSES: ['open', 'waitlist', 'booked_out'],
      MENTOR_PRICE_TIERS: ['tier_entry', 'tier_growth', 'tier_scale'],
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => discoveryModels));

    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    jest.unstable_mockModule(resolveModule('../../utils/cache.js'), () => ({
      appCache: { get: jest.fn(), set: jest.fn(), flushByPrefix: jest.fn() },
      buildCacheKey: jest.fn(() => 'cache-key'),
    }));

    jest.unstable_mockModule(resolveModule('../searchIndexService.js'), () => ({
      searchOpportunityIndex: jest.fn(),
      searchAcrossOpportunityIndexes: jest.fn(),
      isRemoteRole: () => true,
    }));

    const discoveryModule = await import('../discoveryService.js');
    const { toOpportunityDto } = discoveryModule.default ?? discoveryModule;

    const baseRecord = {
      id: 11,
      title: 'Frontend Engineer',
      description: 'Fully remote role building delightful UIs.',
      location: 'Remote - Europe',
      geoLocation: { lat: 48.8566, lng: 2.3522 },
      employmentType: 'full_time',
      budget: { min: 5000, max: 7000 },
      status: 'open',
      autoAssignEnabled: true,
      autoAssignStatus: 'active',
      autoAssignLastQueueSize: 8,
      autoAssignLastRunAt: '2024-05-01T12:00:00.000Z',
      autoAssignSettings: { matching: 'skills' },
      taxonomies: [
        { slug: 'software', type: 'industry', label: 'Software' },
        { slug: 'react', type: 'skill', label: 'React' },
        { slug: 'mid', type: 'seniority', label: 'Mid' },
      ],
    };

    const jobDto = toOpportunityDto(baseRecord, 'job');
    expect(jobDto.category).toBe('job');
    expect(jobDto.employmentType).toBe('full_time');
    expect(jobDto.taxonomySlugs).toContain('software');

    const projectDto = toOpportunityDto(baseRecord, 'project');
    expect(projectDto.autoAssignEnabled).toBe(true);
    expect(projectDto.autoAssignStatus).toBe('active');
  });
});

describe('domainIntrospectionService', () => {
  it('resolves service capabilities per domain context', async () => {
    const registry = {
      snapshot: () => ({ contexts: { core: { models: ['User', 'Profile'] } } }),
      getContextModels: (name) => (name === 'core' ? { User: { rawAttributes: {} }, Profile: { rawAttributes: {} } } : {}),
      listContexts: () => [
        { name: 'core', contextName: 'core', description: 'Core context', metadata: { owner: 'platform' } },
      ],
      resolveContext: (name) => ({ name, contextName: name, models: ['User', 'Profile'] }),
    };

    const serviceCatalog = {
      messagingService: {
        contextName: 'core',
        models: { User: {}, Message: {} },
        describeCapabilities: () => ({
          contextName: 'core',
          description: 'Handles threaded messaging',
          operations: ['send', 'list'],
          models: ['User', 'Message'],
        }),
      },
      auditService: {
        models: { AuditLog: {} },
      },
    };

    const governanceModels = {
      DomainGovernanceReview: { findAll: jest.fn().mockResolvedValue([]) },
      domainRegistry: registry,
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => governanceModels));

    jest.unstable_mockModule(resolveModule('../../utils/logger.js'), () => ({
      default: { child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) },
    }));

    jest.unstable_mockModule(
      resolveModule('../../domains/serviceCatalog.js'),
      withDefaultExport(() => serviceCatalog),
    );

    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { DomainIntrospectionService } = await import('../domainIntrospectionService.js');

    const service = new DomainIntrospectionService({ domainRegistry: registry, serviceCatalog, governanceReviewModel: { findAll: jest.fn().mockResolvedValue([]) } });

    const contexts = service.listContexts();
    expect(contexts[0].contextName).toBe('core');

    const capabilities = service.resolveServicesForContext('core', ['User', 'Profile']);
    expect(capabilities).toHaveLength(1);
    expect(capabilities[0]).toMatchObject({ key: 'messagingService', operations: ['send', 'list'] });
  });
});

describe('emailManagementService', () => {
  it('serializes SMTP configuration with masked credentials', async () => {
    jest.unstable_mockModule(resolveModule('sequelize'), () => {
      const DataTypes = {
        STRING: (length) => ({ type: 'STRING', length }),
        INTEGER: (length) => ({ type: 'INTEGER', length }),
        BOOLEAN: () => ({ type: 'BOOLEAN' }),
        DATE: () => ({ type: 'DATE' }),
        TEXT: (variant) => ({ type: 'TEXT', variant }),
      };
      DataTypes.JSONB = { type: 'JSONB' };
      DataTypes.JSON = { type: 'JSON' };
      DataTypes.ENUM = (...values) => ({ type: 'ENUM', values });

      return {
        DataTypes,
        fn: jest.fn((name, value) => ({ fn: name, value })),
        literal: jest.fn((value) => ({ literal: value })),
        Op: {},
      };
    });
    jest.unstable_mockModule(resolveModule('../../models/sequelizeClient.js'), () => ({
      default: {
        define: jest.fn((name) => {
          function Model() {}
          Model.findOne = jest.fn();
          Model.findAll = jest.fn();
          Model.findByPk = jest.fn();
          Model.create = jest.fn();
          Model.prototype = {};
          return Model;
        }),
        getDialect: () => 'postgres',
      },
    }));
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { serializeSmtpConfigForAudit } = await import('../emailManagementService.js');

    const audit = serializeSmtpConfigForAudit({
      label: 'Primary',
      host: 'smtp.mailtrap.io',
      port: 587,
      secure: false,
      username: 'mailer',
      password: 'super-secret',
      fromName: 'Gigvora',
      fromAddress: 'noreply@gigvora.com',
      replyToAddress: 'support@gigvora.com',
      bccAuditRecipients: ['audit@gigvora.com'],
      rateLimitPerMinute: 120,
      lastVerifiedAt: '2024-05-01T10:00:00.000Z',
    });

    expect(audit.password).toMatch(/•+cret$/);
    expect(audit.secure).toBe(false);
    expect(audit.fromName).toBe('Gigvora');
  });
});

describe('eventManagementService', () => {
  it('updates workspace settings with normalized values', async () => {
    const record = {
      includeArchivedByDefault: false,
      autoArchiveAfterDays: 90,
      defaultFormat: 'virtual',
      defaultVisibility: 'invite_only',
      defaultTimezone: 'UTC',
      requireCheckInNotes: false,
      allowedRoles: ['owner'],
      metadata: {},
      update: jest.fn().mockImplementation(async function (updates) {
        Object.assign(this, updates);
      }),
      get: jest.fn().mockReturnValue({}),
    };

    jest.unstable_mockModule(resolveModule('../../models/eventManagement.js'), () => ({
      UserEventWorkspaceSetting: {
        findOrCreate: jest.fn().mockResolvedValue([record, false]),
      },
      USER_EVENT_FORMATS: ['virtual', 'in_person'],
      USER_EVENT_VISIBILITIES: ['invite_only', 'public'],
      USER_EVENT_ASSET_TYPES: ['image', 'document'],
    }));

    const eventModels = {
      sequelize: { transaction: async (handler) => handler({}) },
      User: {},
      UserEvent: {},
      UserEventAgendaItem: {},
      UserEventTask: {},
      UserEventGuest: {},
      UserEventBudgetItem: {},
      UserEventAsset: {},
      UserEventChecklistItem: {},
      USER_EVENT_STATUSES: ['draft', 'published'],
      USER_EVENT_FORMATS: ['virtual', 'in_person', 'hybrid'],
      USER_EVENT_VISIBILITIES: ['invite_only', 'public'],
      USER_EVENT_TASK_STATUSES: ['todo', 'done'],
      USER_EVENT_TASK_PRIORITIES: ['low', 'high'],
      USER_EVENT_GUEST_STATUSES: ['invited', 'confirmed'],
      USER_EVENT_BUDGET_STATUSES: ['planned', 'committed'],
      USER_EVENT_ASSET_TYPES: ['image', 'document'],
      USER_EVENT_ASSET_VISIBILITIES: ['internal', 'public'],
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => eventModels));

    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule());

    const { updateWorkspaceSettings } = await import('../eventManagementService.js');

    const updated = await updateWorkspaceSettings(5, {
      includeArchivedByDefault: 'true',
      autoArchiveAfterDays: '120',
      defaultFormat: 'in_person',
      defaultVisibility: 'public',
      defaultTimezone: 'Europe/London',
      requireCheckInNotes: 1,
      allowedRoles: ['owner', 'planner'],
      metadata: { theme: 'growth' },
    });

    expect(record.update).toHaveBeenCalled();
    expect(updated.allowedRoles).toContain('planner');
    expect(updated.defaultVisibility).toBe('public');
    expect(updated.autoArchiveAfterDays).toBe(120);
  });
});
