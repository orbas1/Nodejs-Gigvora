import { jest } from '@jest/globals';
import { AuthorizationError, AuthenticationError, ValidationError } from '../../src/utils/errors.js';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

function createMockResponse() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  res.end = jest.fn(() => res);
  return res;
}

function resetMocks(collection) {
  Object.values(collection).forEach((mock) => {
    if (mock && typeof mock.mockReset === 'function') {
      mock.mockReset();
    }
    if (mock && typeof mock === 'object' && !(mock instanceof Function)) {
      resetMocks(mock);
    }
  });
}

const analyticsMocks = { trackEvent: jest.fn(), listEvents: jest.fn() };
const appearanceMocks = {
  getAppearanceSummary: jest.fn(),
  createTheme: jest.fn(),
  updateTheme: jest.fn(),
  setDefaultTheme: jest.fn(),
  deleteTheme: jest.fn(),
  createAsset: jest.fn(),
  updateAsset: jest.fn(),
  deleteAsset: jest.fn(),
  createLayout: jest.fn(),
  updateLayout: jest.fn(),
  publishLayout: jest.fn(),
  deleteLayout: jest.fn(),
};
const authMocks = {
  register: jest.fn(),
  login: jest.fn(),
  verifyTwoFactor: jest.fn(),
  resendTwoFactor: jest.fn(),
  loginWithGoogle: jest.fn(),
  refreshSession: jest.fn(),
};
const modelsMocks = {
  CompanyProfile: { create: jest.fn() },
  AgencyProfile: { create: jest.fn() },
};
const autoAssignMocks = {
  buildAssignmentQueue: jest.fn(),
  listFreelancerQueue: jest.fn(),
  resolveQueueEntry: jest.fn(),
  getProjectQueue: jest.fn(),
};
const blogMocks = {
  listBlogPosts: jest.fn(),
  getBlogPost: jest.fn(),
  createBlogPost: jest.fn(),
  updateBlogPost: jest.fn(),
  deleteBlogPost: jest.fn(),
  listBlogCategories: jest.fn(),
  createBlogCategory: jest.fn(),
  updateBlogCategory: jest.fn(),
  deleteBlogCategory: jest.fn(),
  listBlogTags: jest.fn(),
  createBlogTag: jest.fn(),
  updateBlogTag: jest.fn(),
  deleteBlogTag: jest.fn(),
  createBlogMedia: jest.fn(),
  getBlogMetricsOverview: jest.fn(),
  getBlogPostMetrics: jest.fn(),
  updateBlogPostMetrics: jest.fn(),
  listBlogComments: jest.fn(),
  createBlogComment: jest.fn(),
  updateBlogComment: jest.fn(),
  deleteBlogComment: jest.fn(),
};
const calendarMocks = {
  getOverview: jest.fn(),
  listEvents: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  listFocusSessions: jest.fn(),
  createFocusSession: jest.fn(),
  updateFocusSession: jest.fn(),
  deleteFocusSession: jest.fn(),
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
};
const careerDocumentMocks = {
  getCvWorkspace: jest.fn(),
  createCvDocument: jest.fn(),
  uploadCvVersion: jest.fn(),
  getCoverLetterWorkspace: jest.fn(),
  createCoverLetter: jest.fn(),
  uploadCoverLetterVersion: jest.fn(),
  createStoryBlock: jest.fn(),
  uploadStoryBlockVersion: jest.fn(),
};
const chatwootMocks = {
  getWidgetSettingsForUser: jest.fn(),
  processWebhookEvent: jest.fn(),
};
const clientPortalMocks = {
  createClientPortal: jest.fn(),
  updateClientPortal: jest.fn(),
  getClientPortalDashboard: jest.fn(),
  addTimelineEvent: jest.fn(),
  updateTimelineEvent: jest.fn(),
  addScopeItem: jest.fn(),
  updateScopeItem: jest.fn(),
  recordDecision: jest.fn(),
  createInsightWidget: jest.fn(),
  updateInsightWidget: jest.fn(),
};
const clientSuccessMocks = {
  getFreelancerAutomationOverview: jest.fn(),
  createPlaybook: jest.fn(),
  updatePlaybook: jest.fn(),
  enrollClientInPlaybook: jest.fn(),
  recordReferral: jest.fn(),
  createAffiliateLink: jest.fn(),
};
const collaborationMocks = {
  listSpaces: jest.fn(),
  getSpace: jest.fn(),
  createSpace: jest.fn(),
  createVideoRoom: jest.fn(),
  addAsset: jest.fn(),
  addAnnotation: jest.fn(),
  connectRepository: jest.fn(),
  createAiSession: jest.fn(),
};
const companyAdsMocks = {
  getCompanyAdsWorkspace: jest.fn(),
  createCampaign: jest.fn(),
  updateCampaign: jest.fn(),
  deleteCampaign: jest.fn(),
  createCreative: jest.fn(),
  updateCreative: jest.fn(),
  deleteCreative: jest.fn(),
  createPlacement: jest.fn(),
  updatePlacement: jest.fn(),
  deletePlacement: jest.fn(),
  togglePlacementStatus: jest.fn(),
};
const companyCalendarMocks = {
  getCompanyCalendarState: jest.fn(),
  createCompanyCalendarEvent: jest.fn(),
  updateCompanyCalendarEvent: jest.fn(),
  deleteCompanyCalendarEvent: jest.fn(),
};
const companyDashboardMocks = { getCompanyDashboard: jest.fn() };
const workspaceAutoReplyMocks = {
  getWorkspaceAutoReplyOverview: jest.fn(),
  updateWorkspaceProviderSettings: jest.fn(),
  listWorkspaceTemplates: jest.fn(),
  createWorkspaceTemplate: jest.fn(),
  updateWorkspaceTemplate: jest.fn(),
  deleteWorkspaceTemplate: jest.fn(),
  generateWorkspaceAutoReplyPreview: jest.fn(),
};
const companyTimelineMocks = {
  getTimelineManagementSnapshot: jest.fn(),
  createTimelineEvent: jest.fn(),
  updateTimelineEvent: jest.fn(),
  deleteTimelineEvent: jest.fn(),
  createTimelinePost: jest.fn(),
  updateTimelinePost: jest.fn(),
  changeTimelinePostStatus: jest.fn(),
  deleteTimelinePost: jest.fn(),
  recordTimelinePostMetrics: jest.fn(),
};
const companyDashboardOverviewMocks = { upsertCompanyDashboardOverview: jest.fn() };
const companyEscrowMocks = {
  getCompanyEscrowOverview: jest.fn(),
  createWorkspaceEscrowAccount: jest.fn(),
  updateWorkspaceEscrowAccount: jest.fn(),
  initiateWorkspaceEscrowTransaction: jest.fn(),
  releaseWorkspaceEscrowTransaction: jest.fn(),
  refundWorkspaceEscrowTransaction: jest.fn(),
  updateWorkspaceEscrowAutomation: jest.fn(),
};
const companyIdentityMocks = {
  listIdentityVerifications: jest.fn(),
  getIdentityVerification: jest.fn(),
  createIdentityVerification: jest.fn(),
  updateIdentityVerification: jest.fn(),
};
const companyInboxMocks = {
  listCompanyInboxLabels: jest.fn(),
  createCompanyInboxLabel: jest.fn(),
  updateCompanyInboxLabel: jest.fn(),
  deleteCompanyInboxLabel: jest.fn(),
  getCompanyInboxOverview: jest.fn(),
  listCompanyInboxThreads: jest.fn(),
  getCompanyInboxThread: jest.fn(),
  setCompanyThreadLabels: jest.fn(),
  listCompanyInboxMembers: jest.fn(),
};
const companyIntegrationMocks = {
  listCompanyIntegrations: jest.fn(),
  updateCrmIntegration: jest.fn(),
  rotateCrmIntegrationCredential: jest.fn(),
  updateCrmIntegrationFieldMappings: jest.fn(),
  updateCrmIntegrationRoleAssignments: jest.fn(),
  triggerCrmIntegrationSync: jest.fn(),
  createCrmIntegrationIncident: jest.fn(),
  resolveCrmIntegrationIncident: jest.fn(),
};
const companyJobManagementMocks = {
  getCompanyJobOperations: jest.fn(),
  createJobPosting: jest.fn(),
  updateJobPosting: jest.fn(),
  updateJobKeywords: jest.fn(),
  createJobFavorite: jest.fn(),
  removeJobFavorite: jest.fn(),
  createJobApplication: jest.fn(),
  updateJobApplication: jest.fn(),
  scheduleInterview: jest.fn(),
  updateInterview: jest.fn(),
  recordCandidateResponse: jest.fn(),
  addCandidateNote: jest.fn(),
  updateCandidateNote: jest.fn(),
};

const modulePath = (relativePath) => new URL(relativePath, import.meta.url).pathname;

let analyticsController;
let appearanceController;
let authController;
let autoAssignController;
let blogAdminController;
let blogController;
let calendarController;
let careerDocumentController;
let chatwootController;
let clientPortalController;
let clientSuccessController;
let collaborationController;
let companyAdsController;
let companyCalendarController;
let companyController;
let companyEscrowController;
let companyIdentityController;
let companyInboxController;
let companyIntegrationController;
let companyJobManagementController;

beforeAll(async () => {
  const mockModule = (relativePath, factory) => jest.unstable_mockModule(modulePath(relativePath), factory);

  await mockModule('../../src/services/analyticsService.js', () => analyticsMocks);
  await mockModule('../../src/services/appearanceManagementService.js', () => appearanceMocks);
  await mockModule('../../src/services/authService.js', () => ({ default: authMocks }));
  await mockModule('../../src/models/index.js', () => modelsMocks);
  await mockModule('../../src/services/autoAssignService.js', () => autoAssignMocks);
  await mockModule('../../src/services/blogService.js', () => blogMocks);
  await mockModule('../../src/services/calendarService.js', () => ({
    ...calendarMocks,
    default: calendarMocks,
  }));
  await mockModule('../../src/services/careerDocumentService.js', () => ({
    ...careerDocumentMocks,
    default: careerDocumentMocks,
  }));
  await mockModule('../../src/services/chatwootService.js', () => ({
    ...chatwootMocks,
    default: chatwootMocks,
  }));
  await mockModule('../../src/services/clientPortalService.js', () => ({
    ...clientPortalMocks,
    default: clientPortalMocks,
  }));
  await mockModule('../../src/services/clientSuccessService.js', () => clientSuccessMocks);
  await mockModule('../../src/services/collaborationService.js', () => collaborationMocks);
  await mockModule('../../src/services/companyAdsService.js', () => companyAdsMocks);
  await mockModule('../../src/services/companyCalendarService.js', () => companyCalendarMocks);
  await mockModule('../../src/services/companyDashboardService.js', () => companyDashboardMocks);
  await mockModule('../../src/services/workspaceAutoReplyService.js', () => workspaceAutoReplyMocks);
  await mockModule('../../src/services/companyTimelineService.js', () => companyTimelineMocks);
  await mockModule('../../src/services/companyDashboardOverviewService.js', () => companyDashboardOverviewMocks);
  await mockModule('../../src/services/companyEscrowService.js', () => companyEscrowMocks);
  await mockModule('../../src/services/companyIdentityVerificationService.js', () => companyIdentityMocks);
  await mockModule('../../src/services/companyInboxService.js', () => companyInboxMocks);
  await mockModule('../../src/services/companyIntegrationService.js', () => companyIntegrationMocks);
  await mockModule('../../src/services/companyJobManagementService.js', () => companyJobManagementMocks);

  analyticsController = await import('../../src/controllers/analyticsController.js');
  appearanceController = await import('../../src/controllers/appearanceController.js');
  authController = await import('../../src/controllers/authController.js');
  autoAssignController = await import('../../src/controllers/autoAssignController.js');
  blogAdminController = await import('../../src/controllers/blogAdminController.js');
  blogController = await import('../../src/controllers/blogController.js');
  calendarController = await import('../../src/controllers/calendarController.js');
  careerDocumentController = await import('../../src/controllers/careerDocumentController.js');
  chatwootController = await import('../../src/controllers/chatwootController.js');
  clientPortalController = await import('../../src/controllers/clientPortalController.js');
  clientSuccessController = await import('../../src/controllers/clientSuccessController.js');
  collaborationController = await import('../../src/controllers/collaborationController.js');
  companyAdsController = await import('../../src/controllers/companyAdsController.js');
  companyCalendarController = await import('../../src/controllers/companyCalendarController.js');
  companyController = await import('../../src/controllers/companyController.js');
  companyEscrowController = await import('../../src/controllers/companyEscrowController.js');
  companyIdentityController = await import('../../src/controllers/companyIdentityVerificationController.js');
  companyInboxController = await import('../../src/controllers/companyInboxController.js');
  companyIntegrationController = await import('../../src/controllers/companyIntegrationController.js');
  companyJobManagementController = await import('../../src/controllers/companyJobManagementController.js');
});

beforeEach(() => {
  [
    analyticsMocks,
    appearanceMocks,
    authMocks,
    modelsMocks,
    autoAssignMocks,
    blogMocks,
    calendarMocks,
    careerDocumentMocks,
    chatwootMocks,
    clientPortalMocks,
    clientSuccessMocks,
    collaborationMocks,
    companyAdsMocks,
    companyCalendarMocks,
    companyDashboardMocks,
    workspaceAutoReplyMocks,
    companyTimelineMocks,
    companyDashboardOverviewMocks,
    companyEscrowMocks,
    companyIdentityMocks,
    companyInboxMocks,
    companyIntegrationMocks,
    companyJobManagementMocks,
  ].forEach(resetMocks);
});


describe('analyticsController', () => {
  it('records sanitized analytics events', async () => {
    analyticsMocks.trackEvent.mockResolvedValue({ id: 'evt-1' });
    const req = {
      body: {
        eventName: '  sign_up ',
        actorType: ' freelancer ',
        source: ' web ',
        context: { plan: 'pro' },
        userId: 99,
      },
    };
    const res = createMockResponse();

    await analyticsController.recordEvent(req, res);

    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'sign_up',
        actorType: 'freelancer',
        source: 'web',
        context: { plan: 'pro' },
        userId: 99,
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'evt-1' });
  });

  it('fetches analytics events with filters and pagination', async () => {
    analyticsMocks.listEvents.mockResolvedValue({ events: [] });
    const req = { query: { eventName: 'signup', page: '2', pageSize: '50' } };
    const res = createMockResponse();

    await analyticsController.getEvents(req, res);

    expect(analyticsMocks.listEvents).toHaveBeenCalledWith(
      {
        eventName: 'signup',
        actorType: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      },
      { page: '2', pageSize: '50' },
    );
    expect(res.json).toHaveBeenCalledWith({ events: [] });
  });
});

describe('appearanceController', () => {
  it('creates a theme with actor attribution', async () => {
    appearanceMocks.createTheme.mockResolvedValue({ id: 'theme-1' });
    const req = { user: { id: 44 }, body: { name: 'Aurora' } };
    const res = createMockResponse();

    await appearanceController.createThemeHandler(req, res);

    expect(appearanceMocks.createTheme).toHaveBeenCalledWith({ name: 'Aurora' }, { actorId: 44 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'theme-1' });
  });

  it('publishes a layout for the active user', async () => {
    appearanceMocks.publishLayout.mockResolvedValue({ id: 'layout-9', status: 'published' });
    const req = { params: { layoutId: '9' }, body: { channels: ['web'] }, user: { id: 8 } };
    const res = createMockResponse();

    await appearanceController.publishLayoutHandler(req, res);

    expect(appearanceMocks.publishLayout).toHaveBeenCalledWith('9', { channels: ['web'] }, { actorId: 8 });
    expect(res.json).toHaveBeenCalledWith({ id: 'layout-9', status: 'published' });
  });
});

describe('authController', () => {
  it('registers a company and seeds a profile', async () => {
    authMocks.register.mockResolvedValue({ id: 71, email: 'company@example.com' });
    modelsMocks.CompanyProfile.create.mockResolvedValue({ id: 501 });

    const req = {
      body: {
        email: 'company@example.com',
        password: 'StrongPass123!',
        companyName: 'Acme',
        location: '  London  ',
        geoLocation: { label: 'London', latitude: '51.5', longitude: '-0.1' },
      },
    };
    const res = createMockResponse();

    await authController.registerCompany(req, res);

    expect(authMocks.register).toHaveBeenCalledWith(expect.objectContaining({ userType: 'company' }));
    expect(modelsMocks.CompanyProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 71,
        companyName: 'Acme',
        location: 'London',
        geoLocation: expect.objectContaining({ latitude: 51.5, longitude: -0.1 }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('requires admin flag when logging administrators in', async () => {
    authMocks.login.mockResolvedValue({ session: { accessToken: 'token' } });
    const req = { body: { email: 'admin@example.com', password: 'Secret123!' }, ip: '127.0.0.1' };
    const res = createMockResponse();

    await authController.adminLogin(req, res);

    expect(authMocks.login).toHaveBeenCalledWith('admin@example.com', 'Secret123!', {
      requireAdmin: true,
      context: { ipAddress: '127.0.0.1' },
    });
    expect(res.json).toHaveBeenCalledWith({ session: { accessToken: 'token' } });
  });
});

describe('autoAssignController', () => {
  it('rejects unauthenticated queue access', async () => {
    await expect(autoAssignController.listQueue({ query: {} }, createMockResponse())).rejects.toMatchObject({
      name: 'AuthorizationError',
      message: 'Authentication required.',
      statusCode: 403,
    });
  });

  it('prevents freelancers from accessing other queues', async () => {
    const req = { user: { id: 11, type: 'freelancer' }, query: { freelancerId: '22' } };
    await expect(autoAssignController.listQueue(req, createMockResponse())).rejects.toMatchObject({
      name: 'AuthorizationError',
      message: 'You can only access your own auto-assign queue.',
      statusCode: 403,
    });
  });

  it('requires freelancerId for privileged actors', async () => {
    const req = { user: { id: 99, type: 'admin' }, query: {} };
    await expect(autoAssignController.listQueue(req, createMockResponse())).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'freelancerId query parameter is required.',
      statusCode: 422,
    });
  });

  it('returns queue entries for administrative users', async () => {
    autoAssignMocks.listFreelancerQueue.mockResolvedValue({ items: [] });
    const req = {
      user: { id: 1, type: 'admin' },
      query: { freelancerId: '33', statuses: 'pending,accepted', page: '3' },
    };
    const res = createMockResponse();

    await autoAssignController.listQueue(req, res);

    expect(autoAssignMocks.listFreelancerQueue).toHaveBeenCalledWith({
      freelancerId: 33,
      page: 3,
      pageSize: undefined,
      statuses: ['pending', 'accepted'],
    });
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });
});


describe('blogAdminController', () => {
  it('lists blog posts including unpublished entries by default', async () => {
    blogMocks.listBlogPosts.mockResolvedValue({ results: [] });
    const req = { query: { status: 'draft', workspaceId: '42' } };
    const res = createMockResponse();

    await blogAdminController.list(req, res);

    expect(blogMocks.listBlogPosts).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'draft',
        includeUnpublished: true,
        workspaceId: 42,
        includeGlobalWorkspace: true,
      }),
    );
    expect(res.json).toHaveBeenCalledWith({ results: [] });
  });

  it('creates categories within a workspace', async () => {
    blogMocks.createBlogCategory.mockResolvedValue({ id: 9 });
    const req = { body: { name: 'News', workspaceId: '55' } };
    const res = createMockResponse();

    await blogAdminController.createCategory(req, res);

    expect(blogMocks.createBlogCategory).toHaveBeenCalledWith({ name: 'News', workspaceId: '55' }, { workspaceId: 55 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 9 });
  });
});

describe('blogController', () => {
  it('lists public blog posts with includeUnpublished flag support', async () => {
    blogMocks.listBlogPosts.mockResolvedValue({ items: [] });
    const req = { query: { includeUnpublished: '1' } };
    const res = createMockResponse();

    await blogController.index(req, res);

    expect(blogMocks.listBlogPosts).toHaveBeenCalledWith(
      expect.objectContaining({ includeUnpublished: true }),
    );
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('retrieves a blog post by slug', async () => {
    blogMocks.getBlogPost.mockResolvedValue({ slug: 'launch', title: 'Launch' });
    const req = { params: { slug: 'launch' }, query: { includeUnpublished: 'true' } };
    const res = createMockResponse();

    await blogController.show(req, res);

    expect(blogMocks.getBlogPost).toHaveBeenCalledWith('launch', { includeUnpublished: true });
    expect(res.json).toHaveBeenCalledWith({ slug: 'launch', title: 'Launch' });
  });
});

describe('calendarController', () => {
  it('creates a calendar event for the given user', async () => {
    calendarMocks.createEvent.mockResolvedValue({ id: 5 });
    const req = { params: { id: '77' }, body: { title: 'Review' } };
    const res = createMockResponse();

    await calendarController.createEvent(req, res);

    expect(calendarMocks.createEvent).toHaveBeenCalledWith(77, { title: 'Review' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('lists focus sessions with query parameters forwarded', async () => {
    calendarMocks.listFocusSessions.mockResolvedValue([{ id: 1 }]);
    const req = { params: { id: '10' }, query: { type: 'deep-work' } };
    const res = createMockResponse();

    await calendarController.listFocusSessions(req, res);

    expect(calendarMocks.listFocusSessions).toHaveBeenCalledWith(10, { type: 'deep-work' });
    expect(res.json).toHaveBeenCalledWith({ items: [{ id: 1 }] });
  });
});

describe('careerDocumentController', () => {
  it('creates documents with parsed actor metadata', async () => {
    careerDocumentMocks.createCvDocument.mockResolvedValue({ id: 301 });
    const req = {
      params: { userId: '42' },
      headers: { 'x-user-id': '77', 'x-roles': 'Admin, Editor' },
      body: { title: 'Senior Engineer Resume' },
      user: { id: 77, roles: ['owner'] },
    };
    const res = createMockResponse();

    await careerDocumentController.createDocument(req, res, () => {});

    expect(careerDocumentMocks.createCvDocument).toHaveBeenCalledWith({
      userId: 42,
      actorId: 77,
      actorRoles: ['admin', 'editor'],
      payload: { title: 'Senior Engineer Resume' },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects requests missing a numeric user id', async () => {
    const req = { params: { userId: 'not-a-number' } };
    const res = createMockResponse();
    const next = jest.fn();

    await careerDocumentController.getWorkspace(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const [error] = next.mock.calls[0];
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('A valid userId is required in the route.');
    expect(careerDocumentMocks.getCvWorkspace).not.toHaveBeenCalled();
  });
});

describe('chatwootController', () => {
  it('requires authentication for session bootstrap', async () => {
    await expect(chatwootController.session({ user: null }, createMockResponse())).rejects.toMatchObject({
      name: 'AuthenticationError',
      message: 'Authentication required.',
      statusCode: 401,
    });
  });

  it('provides widget configuration for authenticated users', async () => {
    chatwootMocks.getWidgetSettingsForUser.mockResolvedValue({ enabled: true });
    const req = { user: { id: 5 }, ip: '127.0.0.1', session: { id: 'sess-1' } };
    const res = createMockResponse();

    await chatwootController.session(req, res);

    expect(chatwootMocks.getWidgetSettingsForUser).toHaveBeenCalledWith(5, {
      ipAddress: '127.0.0.1',
      sessionId: 'sess-1',
    });
    expect(res.json).toHaveBeenCalledWith({ enabled: true });
  });

  it('accepts webhook events with signature metadata', async () => {
    chatwootMocks.processWebhookEvent.mockResolvedValue();
    const req = {
      headers: { 'x-chatwoot-signature': 'sig-abc', 'x-chatwoot-event': 'message_created' },
      body: { id: 1 },
      rawBody: '{"id":1}',
      query: {},
    };
    const res = createMockResponse();

    await chatwootController.webhook(req, res);

    expect(chatwootMocks.processWebhookEvent).toHaveBeenCalledWith({
      signature: 'sig-abc',
      eventName: 'message_created',
      payload: { id: 1 },
      rawBody: '{"id":1}',
    });
    expect(res.status).toHaveBeenCalledWith(202);
  });
});

describe('clientPortalController', () => {
  it('stores a client portal with numeric actor id', async () => {
    clientPortalMocks.createClientPortal.mockResolvedValue({ id: 88 });
    const req = { body: { name: 'Project Atlas', actorId: '45' } };
    const res = createMockResponse();

    await clientPortalController.store(req, res);

    expect(clientPortalMocks.createClientPortal).toHaveBeenCalledWith(
      { name: 'Project Atlas', actorId: '45' },
      { actorId: 45 },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updates timeline events with parsed identifiers', async () => {
    clientPortalMocks.updateTimelineEvent.mockResolvedValue({ id: 3 });
    const req = { params: { portalId: '9', eventId: '15' }, body: { title: 'Kickoff' } };
    const res = createMockResponse();

    await clientPortalController.updateTimeline(req, res);

    expect(clientPortalMocks.updateTimelineEvent).toHaveBeenCalledWith(9, 15, { title: 'Kickoff' });
    expect(res.json).toHaveBeenCalledWith({ id: 3 });
  });
});

describe('clientSuccessController', () => {
  it('creates playbooks for freelancers', async () => {
    clientSuccessMocks.createPlaybook.mockResolvedValue({ id: 22 });
    const req = { params: { freelancerId: '7' }, body: { name: 'Onboarding' } };
    const res = createMockResponse();

    await clientSuccessController.storePlaybook(req, res);

    expect(clientSuccessMocks.createPlaybook).toHaveBeenCalledWith(7, { name: 'Onboarding' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('prioritises path gig id when creating affiliate links', async () => {
    clientSuccessMocks.createAffiliateLink.mockResolvedValue({ link: 'https://gig' });
    const req = {
      params: { freelancerId: '3', gigId: '19' },
      body: { gigId: 'should-not-use', partner: 'Acme' },
    };
    const res = createMockResponse();

    await clientSuccessController.storeAffiliateLink(req, res);

    expect(clientSuccessMocks.createAffiliateLink).toHaveBeenCalledWith(3, {
      gigId: '19',
      partner: 'Acme',
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('collaborationController', () => {
  it('lists spaces with boolean query parsing', async () => {
    collaborationMocks.listSpaces.mockResolvedValue({ results: [] });
    const req = { query: { includeArchived: 'true', ownerId: '101' } };
    const res = createMockResponse();

    await collaborationController.index(req, res);

    expect(collaborationMocks.listSpaces).toHaveBeenCalledWith({
      ownerId: '101',
      participantId: undefined,
      includeArchived: true,
    });
    expect(res.json).toHaveBeenCalledWith({ results: [] });
  });

  it('creates AI sessions with numeric actor metadata', async () => {
    collaborationMocks.createAiSession.mockResolvedValue({ id: 'session-7' });
    const req = { params: { spaceId: 'abc' }, body: { prompt: 'Assist', actorId: '12' } };
    const res = createMockResponse();

    await collaborationController.storeAiSession(req, res);

    expect(collaborationMocks.createAiSession).toHaveBeenCalledWith('abc', { prompt: 'Assist', actorId: '12' }, {
      actorId: 12,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});


describe('companyAdsController', () => {
  it('retrieves ad workspace with parsed surfaces and context', async () => {
    companyAdsMocks.getCompanyAdsWorkspace.mockResolvedValue({ surfaces: [] });
    const req = {
      user: { id: 10 },
      query: { surfaces: 'homepage, feed ', context: 'not-json', bypassCache: 'true' },
    };
    const res = createMockResponse();

    await companyAdsController.workspace(req, res);

    expect(companyAdsMocks.getCompanyAdsWorkspace).toHaveBeenCalledWith({
      ownerId: 10,
      surfaces: ['homepage', 'feed'],
      context: { raw: 'not-json' },
      bypassCache: true,
    });
    expect(res.json).toHaveBeenCalledWith({ surfaces: [] });
  });

  it('creates placements for the authenticated owner', async () => {
    companyAdsMocks.createPlacement.mockResolvedValue({ id: 'placement-1' });
    const req = { user: { id: 5 }, params: { creativeId: '9' }, body: { surface: 'homepage' } };
    const res = createMockResponse();

    await companyAdsController.createPlacementHandler(req, res);

    expect(companyAdsMocks.createPlacement).toHaveBeenCalledWith({
      ownerId: 5,
      creativeId: '9',
      payload: { surface: 'homepage' },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('companyCalendarController', () => {
  it('reads calendar state for the requesting user', async () => {
    companyCalendarMocks.getCompanyCalendarState.mockResolvedValue({ events: [] });
    const req = { query: { workspaceId: '51' }, user: { id: 1, type: 'company' } };
    const res = createMockResponse();

    await companyCalendarController.index(req, res);

    expect(companyCalendarMocks.getCompanyCalendarState).toHaveBeenCalledWith({
      workspaceId: '51',
      workspaceSlug: undefined,
      from: undefined,
      to: undefined,
      types: undefined,
      limit: undefined,
      search: undefined,
      actor: { id: 1, type: 'company' },
    });
    expect(res.json).toHaveBeenCalledWith({ events: [] });
  });

  it('creates calendar events and returns 201', async () => {
    companyCalendarMocks.createCompanyCalendarEvent.mockResolvedValue({ id: 12 });
    const req = { body: { workspaceId: 5, title: 'Town hall' } };
    const res = createMockResponse();

    await companyCalendarController.store(req, res);

    expect(companyCalendarMocks.createCompanyCalendarEvent).toHaveBeenCalledWith({
      workspaceId: 5,
      workspaceSlug: undefined,
      title: 'Town hall',
      eventType: undefined,
      startsAt: undefined,
      endsAt: undefined,
      location: undefined,
      metadata: undefined,
      actor: null,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('companyController', () => {
  it('requires a workspace id when retrieving timeline snapshots', async () => {
    const req = { body: {}, query: {}, params: {} };
    await expect(companyController.timeline(req, createMockResponse())).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'workspaceId is required.',
      statusCode: 422,
    });
  });

  it('upserts dashboard overview with sanitised fields', async () => {
    companyDashboardOverviewMocks.upsertCompanyDashboardOverview.mockResolvedValue({ id: 1 });
    const req = {
      body: {
        workspaceId: '77',
        displayName: '  Gigvora Labs  ',
        summary: '  Building the future  ',
        avatarUrl: 'https://example.com/logo.png',
        followerCount: '2000',
        trustScore: '87',
        rating: '4.5',
        preferences: {
          locationOverride: { label: 'NYC', latitude: 40.7, longitude: -74 },
          customGreeting: '  Welcome!  ',
        },
      },
      user: { id: 15 },
      query: {},
    };
    const res = createMockResponse();

    await companyController.updateDashboardOverview(req, res);

    expect(companyDashboardOverviewMocks.upsertCompanyDashboardOverview).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 77,
        displayName: 'Gigvora Labs',
        summary: 'Building the future',
        followerCount: 2000,
        trustScore: 87,
        rating: 4.5,
        preferences: expect.objectContaining({
          locationOverride: expect.objectContaining({ label: 'NYC' }),
          customGreeting: 'Welcome!',
        }),
        actorId: 15,
      }),
    );
    expect(res.json).toHaveBeenCalledWith({ overview: { id: 1 } });
  });
});

describe('companyEscrowController', () => {
  it('extracts actor identity from headers', async () => {
    companyEscrowMocks.createWorkspaceEscrowAccount.mockResolvedValue({ id: 2 });
    const req = {
      headers: { 'x-user-id': '55' },
      body: { workspaceId: 9 },
    };
    const res = createMockResponse();

    await companyEscrowController.createAccount(req, res);

    expect(companyEscrowMocks.createWorkspaceEscrowAccount).toHaveBeenCalledWith({ workspaceId: 9, actorId: 55 });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('companyIdentityVerificationController', () => {
  it('creates verification records via the service layer', async () => {
    companyIdentityMocks.createIdentityVerification.mockResolvedValue({ id: 'verify-1' });
    const req = { body: { workspaceId: 4 } };
    const res = createMockResponse();

    await companyIdentityController.store(req, res);

    expect(companyIdentityMocks.createIdentityVerification).toHaveBeenCalledWith({ workspaceId: 4 });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('companyInboxController', () => {
  it('normalises inbox thread filters', async () => {
    companyInboxMocks.listCompanyInboxThreads.mockResolvedValue({ items: [] });
    const req = {
      query: {
        workspaceId: '10',
        channelTypes: 'email,chat',
        states: 'open,closed',
        labelIds: '1,2',
        supportStatuses: 'waiting',
        unreadOnly: 'true',
        page: '2',
        pageSize: '25',
      },
    };
    const res = createMockResponse();

    await companyInboxController.listThreads(req, res);

    expect(companyInboxMocks.listCompanyInboxThreads).toHaveBeenCalledWith({
      workspaceId: 10,
      workspaceSlug: undefined,
      lookbackDays: undefined,
      filters: {
        channelTypes: ['email', 'chat'],
        states: ['open', 'closed'],
        labelIds: [1, 2],
        supportStatuses: ['waiting'],
        search: undefined,
        unreadOnly: true,
      },
      pagination: { page: 2, pageSize: 25 },
    });
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('validates label creation payloads', async () => {
    const req = { body: {}, query: {} };
    const res = createMockResponse();

    await expect(companyInboxController.createLabel(req, res)).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'name is required',
      statusCode: 422,
    });
    expect(companyInboxMocks.createCompanyInboxLabel).not.toHaveBeenCalled();
  });

  it('creates labels when valid input is provided', async () => {
    companyInboxMocks.createCompanyInboxLabel.mockResolvedValue({ id: 3 });
    const req = {
      body: { name: 'Priority', color: '#ff0000' },
      query: { workspaceId: '20' },
      user: { id: 5 },
    };
    const res = createMockResponse();

    await companyInboxController.createLabel(req, res);

    expect(companyInboxMocks.createCompanyInboxLabel).toHaveBeenCalledWith({
      workspaceId: 20,
      workspaceSlug: undefined,
      name: 'Priority',
      color: '#ff0000',
      description: undefined,
      metadata: undefined,
      createdBy: 5,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('companyIntegrationController', () => {
  it('updates CRM integrations with actor context', async () => {
    companyIntegrationMocks.updateCrmIntegration.mockResolvedValue({ id: 4 });
    const req = {
      params: { providerKey: 'salesforce' },
      body: { workspaceId: '8', credentials: {} },
      user: { id: 2, name: 'Avery' },
    };
    const res = createMockResponse();

    await companyIntegrationController.update(req, res);

    expect(companyIntegrationMocks.updateCrmIntegration).toHaveBeenCalledWith(
      8,
      'salesforce',
      { workspaceId: '8', credentials: {} },
      { id: 2, name: 'Avery' },
    );
    expect(res.json).toHaveBeenCalledWith({ id: 4 });
  });

  it('triggers integration syncs with default payloads', async () => {
    companyIntegrationMocks.triggerCrmIntegrationSync.mockResolvedValue({ status: 'queued' });
    const req = {
      params: { integrationId: '11', providerKey: 'hubspot' },
      body: { workspaceId: '20' },
      user: { id: 7, name: 'Jordan' },
    };
    const res = createMockResponse();

    await companyIntegrationController.triggerSync(req, res);

    expect(companyIntegrationMocks.triggerCrmIntegrationSync).toHaveBeenCalledWith(
      20,
      11,
      'hubspot',
      { trigger: 'manual', notes: null },
      { id: 7, name: 'Jordan' },
    );
    expect(res.json).toHaveBeenCalledWith({ status: 'queued' });
  });
});

describe('companyJobManagementController', () => {
  it('creates job postings with actor attribution', async () => {
    companyJobManagementMocks.createJobPosting.mockResolvedValue({ id: 6 });
    const req = { user: { id: 3 }, body: { workspaceId: '12', title: 'Designer' } };
    const res = createMockResponse();

    await companyJobManagementController.createJob(req, res);

    expect(companyJobManagementMocks.createJobPosting).toHaveBeenCalledWith({
      workspaceId: 12,
      payload: { title: 'Designer' },
      actorId: 3,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('marks jobs as favourites for collaborators', async () => {
    companyJobManagementMocks.createJobFavorite.mockResolvedValue({ id: 10 });
    const req = {
      user: { id: 4 },
      params: { jobId: '90' },
      body: { workspaceId: '6', userId: '18', notes: 'High potential' },
    };
    const res = createMockResponse();

    await companyJobManagementController.favoriteJob(req, res);

    expect(companyJobManagementMocks.createJobFavorite).toHaveBeenCalledWith({
      workspaceId: 6,
      jobId: 90,
      userId: 18,
      notes: 'High potential',
      actorId: 4,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

