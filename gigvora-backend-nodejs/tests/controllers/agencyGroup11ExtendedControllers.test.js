import { jest, describe, beforeAll, beforeEach, it, expect } from '@jest/globals';
import { AuthorizationError, ValidationError } from '../../src/utils/errors.js';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

function createMockResponse() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

function resetMockCollection(collection) {
  Object.values(collection).forEach((value) => {
    if (value && typeof value.mockReset === 'function') {
      value.mockReset();
    } else if (value && typeof value === 'object') {
      resetMockCollection(value);
    }
  });
}

const integrationServiceMocks = {
  listIntegrations: jest.fn(),
  createIntegration: jest.fn(),
  updateIntegration: jest.fn(),
  rotateSecret: jest.fn(),
  createWebhook: jest.fn(),
  updateWebhook: jest.fn(),
  deleteWebhook: jest.fn(),
  testIntegrationConnection: jest.fn(),
};

const jobManagementServiceMocks = {
  listJobs: jest.fn(),
  getJob: jest.fn(),
  createJob: jest.fn(),
  updateJob: jest.fn(),
  toggleFavorite: jest.fn(),
  removeFavorite: jest.fn(),
  listApplications: jest.fn(),
  createApplication: jest.fn(),
  getApplication: jest.fn(),
  updateApplication: jest.fn(),
  listInterviews: jest.fn(),
  createInterview: jest.fn(),
  updateInterview: jest.fn(),
  listResponses: jest.fn(),
  createResponse: jest.fn(),
  getJobManagementMetadata: jest.fn(),
  getJobManagementSnapshot: jest.fn(),
};

const mentoringServiceMocks = {
  getMentoringOverview: jest.fn(),
  listMentoringSessions: jest.fn(),
  createMentoringSession: jest.fn(),
  updateMentoringSession: jest.fn(),
  deleteMentoringSession: jest.fn(),
  listMentoringPurchases: jest.fn(),
  createMentoringPurchase: jest.fn(),
  updateMentoringPurchase: jest.fn(),
  listMentorPreferences: jest.fn(),
  createMentorPreference: jest.fn(),
  updateMentorPreference: jest.fn(),
  deleteMentorPreference: jest.fn(),
  listSuggestedMentors: jest.fn(),
};

const networkingServiceMocks = {
  getOverview: jest.fn(),
  listBookings: jest.fn(),
  createBooking: jest.fn(),
  updateBooking: jest.fn(),
  listPurchases: jest.fn(),
  createPurchase: jest.fn(),
  updatePurchase: jest.fn(),
  listConnections: jest.fn(),
  createConnection: jest.fn(),
  updateConnection: jest.fn(),
};

const projectManagementServiceMocks = {
  listAgencyProjects: jest.fn(),
  createAgencyProject: jest.fn(),
  updateAgencyProject: jest.fn(),
  updateProjectAutoMatchSettings: jest.fn(),
  upsertProjectAutoMatchFreelancer: jest.fn(),
  updateProjectAutoMatchFreelancer: jest.fn(),
};

const timelineServiceMocks = {
  getTimelineDashboard: jest.fn(),
  listTimelinePosts: jest.fn(),
  getTimelinePost: jest.fn(),
  createTimelinePost: jest.fn(),
  updateTimelinePost: jest.fn(),
  updateTimelinePostStatus: jest.fn(),
  deleteTimelinePost: jest.fn(),
  getTimelinePostAnalytics: jest.fn(),
};

const walletServiceMocks = {
  getWalletOverview: jest.fn(),
  listWalletAccounts: jest.fn(),
  createWalletAccount: jest.fn(),
  updateWalletAccount: jest.fn(),
  listLedgerEntries: jest.fn(),
  createLedgerEntry: jest.fn(),
  listFundingSources: jest.fn(),
  createFundingSource: jest.fn(),
  updateFundingSource: jest.fn(),
  listPayoutRequests: jest.fn(),
  createPayoutRequest: jest.fn(),
  updatePayoutRequest: jest.fn(),
  getOperationalSettings: jest.fn(),
  updateOperationalSettings: jest.fn(),
};

const workforceServiceMocks = {
  getWorkforceDashboard: jest.fn(),
  listMembers: jest.fn(),
  createWorkforceMember: jest.fn(),
  updateWorkforceMember: jest.fn(),
  deleteWorkforceMember: jest.fn(),
  listPayDelegations: jest.fn(),
  createPayDelegation: jest.fn(),
  updatePayDelegation: jest.fn(),
  deletePayDelegation: jest.fn(),
  listProjectDelegations: jest.fn(),
  createProjectDelegation: jest.fn(),
  updateProjectDelegation: jest.fn(),
  deleteProjectDelegation: jest.fn(),
  listGigDelegations: jest.fn(),
  createGigDelegation: jest.fn(),
  updateGigDelegation: jest.fn(),
  deleteGigDelegation: jest.fn(),
  listCapacitySnapshots: jest.fn(),
  recordCapacitySnapshot: jest.fn(),
  updateCapacitySnapshot: jest.fn(),
  deleteCapacitySnapshot: jest.fn(),
  listAvailabilityEntries: jest.fn(),
  createAvailabilityEntry: jest.fn(),
  updateAvailabilityEntry: jest.fn(),
  deleteAvailabilityEntry: jest.fn(),
};

const integrationServiceUrl = new URL('../../src/services/agencyIntegrationService.js', import.meta.url);
const jobManagementServiceUrl = new URL('../../src/services/agencyJobManagementService.js', import.meta.url);
const mentoringServiceUrl = new URL('../../src/services/agencyMentoringService.js', import.meta.url);
const networkingServiceUrl = new URL('../../src/services/agencyNetworkingService.js', import.meta.url);
const projectManagementServiceUrl = new URL('../../src/services/agencyProjectManagementService.js', import.meta.url);
const timelineServiceUrl = new URL('../../src/services/agencyTimelineService.js', import.meta.url);
const walletServiceUrl = new URL('../../src/services/agencyWalletService.js', import.meta.url);
const workforceServiceUrl = new URL('../../src/services/agencyWorkforceService.js', import.meta.url);

jest.unstable_mockModule(integrationServiceUrl.pathname, () => ({
  ...integrationServiceMocks,
}));

jest.unstable_mockModule(jobManagementServiceUrl.pathname, () => ({
  ...jobManagementServiceMocks,
}));

jest.unstable_mockModule(mentoringServiceUrl.pathname, () => ({
  ...mentoringServiceMocks,
}));

jest.unstable_mockModule(networkingServiceUrl.pathname, () => ({
  ...networkingServiceMocks,
}));

jest.unstable_mockModule(projectManagementServiceUrl.pathname, () => ({
  ...projectManagementServiceMocks,
}));

jest.unstable_mockModule(timelineServiceUrl.pathname, () => ({
  ...timelineServiceMocks,
}));

jest.unstable_mockModule(walletServiceUrl.pathname, () => ({
  ...walletServiceMocks,
}));

jest.unstable_mockModule(workforceServiceUrl.pathname, () => ({
  ...workforceServiceMocks,
}));

let integrationController;
let jobManagementController;
let mentoringController;
let networkingController;
let projectManagementController;
let timelineController;
let walletController;
let workforceController;

beforeAll(async () => {
  integrationController = await import('../../src/controllers/agencyIntegrationController.js');
  jobManagementController = await import('../../src/controllers/agencyJobManagementController.js');
  mentoringController = await import('../../src/controllers/agencyMentoringController.js');
  networkingController = await import('../../src/controllers/agencyNetworkingController.js');
  projectManagementController = await import('../../src/controllers/agencyProjectManagementController.js');
  timelineController = await import('../../src/controllers/agencyTimelineController.js');
  walletController = await import('../../src/controllers/agencyWalletController.js');
  workforceController = await import('../../src/controllers/agencyWorkforceController.js');
});

beforeEach(() => {
  resetMockCollection(integrationServiceMocks);
  resetMockCollection(jobManagementServiceMocks);
  resetMockCollection(mentoringServiceMocks);
  resetMockCollection(networkingServiceMocks);
  resetMockCollection(projectManagementServiceMocks);
  resetMockCollection(timelineServiceMocks);
  resetMockCollection(walletServiceMocks);
  resetMockCollection(workforceServiceMocks);
});

function createRequest(overrides = {}) {
  return {
    user: { id: 10, type: 'agency', roles: ['agency_admin'] },
    params: {},
    query: {},
    body: {},
    ...overrides,
  };
}

describe('agencyIntegrationController', () => {
  it('sanitises workspace identifier when listing integrations', async () => {
    const req = createRequest({ query: { workspaceId: ' 77 ' }, user: { id: 9, type: 'agency_admin' } });
    const res = createMockResponse();
    integrationServiceMocks.listIntegrations.mockResolvedValue({ connectors: [] });

    await integrationController.index(req, res);

    expect(integrationServiceMocks.listIntegrations).toHaveBeenCalledWith(
      { workspaceId: 77 },
      { actorId: 9, actorRole: 'agency_admin' },
    );
    expect(res.json).toHaveBeenCalledWith({ connectors: [] });
  });

  it('forwards payload and actor context when creating an integration', async () => {
    const req = createRequest({
      body: {
        workspaceId: '12',
        providerKey: 'slack',
        displayName: 'Growth Alerts',
        status: 'active',
        syncFrequency: 'hourly',
      },
      user: { id: 21, type: 'agency' },
    });
    const res = createMockResponse();
    integrationServiceMocks.createIntegration.mockResolvedValue({ id: 501 });

    await integrationController.create(req, res);

    expect(integrationServiceMocks.createIntegration).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 12, providerKey: 'slack' }),
      { actorId: 21, actorRole: 'agency' },
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 501 });
  });

  it('throws a validation error when integration id missing on update', async () => {
    const req = createRequest({ body: { displayName: 'Updated' } });
    const res = createMockResponse();

    await expect(integrationController.update(req, res)).rejects.toThrow(ValidationError);
    expect(integrationServiceMocks.updateIntegration).not.toHaveBeenCalled();
  });

  it('sets status code depending on rotation mode', async () => {
    integrationServiceMocks.rotateSecret.mockResolvedValue({ secret: { id: 32 } });

    const createReq = createRequest({ params: { integrationId: '5' }, body: { secretValue: 'abc' } });
    const createRes = createMockResponse();
    await integrationController.rotateCredential(createReq, createRes);
    expect(createRes.status).toHaveBeenCalledWith(201);

    const updateReq = createRequest({
      params: { integrationId: '5' },
      body: { secretId: 88, secretValue: 'xyz' },
    });
    const updateRes = createMockResponse();
    await integrationController.rotateCredential(updateReq, updateRes);
    expect(updateRes.status).toHaveBeenCalledWith(200);
  });

  it('creates webhook endpoints with sanitised identifiers', async () => {
    integrationServiceMocks.createWebhook.mockResolvedValue({ id: 'hook-1' });
    const req = createRequest({
      params: { integrationId: '42' },
      body: { name: ' Status updates ', targetUrl: 'https://hooks.example.com', eventTypes: ['project.created'], secretValue: 'top' },
    });
    const res = createMockResponse();

    await integrationController.createWebhookEndpoint(req, res);

    expect(integrationServiceMocks.createWebhook).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ name: ' Status updates ', eventTypes: ['project.created'], secretValue: 'top' }),
      { actorId: 10, actorRole: 'agency' },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('passes webhook identifiers to delete handler', async () => {
    integrationServiceMocks.deleteWebhook.mockResolvedValue({ deleted: true });
    const req = createRequest({ params: { integrationId: '9', webhookId: '33' } });
    const res = createMockResponse();

    await integrationController.deleteWebhookEndpoint(req, res);

    expect(integrationServiceMocks.deleteWebhook).toHaveBeenCalledWith(9, 33, { actorId: 10, actorRole: 'agency' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('tests integration connectivity', async () => {
    integrationServiceMocks.testIntegrationConnection.mockResolvedValue({ ok: true });
    const req = createRequest({ params: { integrationId: '77' } });
    const res = createMockResponse();

    await integrationController.testConnection(req, res);

    expect(integrationServiceMocks.testIntegrationConnection).toHaveBeenCalledWith(77, { actorId: 10, actorRole: 'agency' });
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});

describe('agencyJobManagementController', () => {
  it('forwards filter parameters when listing jobs', async () => {
    jobManagementServiceMocks.listJobs.mockResolvedValue({ data: [] });
    const req = createRequest({
      query: { workspaceId: 'workspace-44', status: 'open', search: 'design', page: '3', pageSize: '50' },
    });
    const res = createMockResponse();

    await jobManagementController.index(req, res);

    expect(jobManagementServiceMocks.listJobs).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'workspace-44', status: 'open', search: 'design', page: '3', pageSize: '50' }),
    );
  });

  it('uses actor context when creating jobs', async () => {
    jobManagementServiceMocks.createJob.mockResolvedValue({ id: 'job-1' });
    const req = createRequest({ body: { title: 'Product Designer', workspaceId: 'workspace-9' }, user: { id: 7 } });
    const res = createMockResponse();

    await jobManagementController.store(req, res);

    expect(jobManagementServiceMocks.createJob).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'workspace-9', title: 'Product Designer' }),
      { workspaceId: 'workspace-9', actorId: 7 },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('resolves member id when unfavouriting', async () => {
    jobManagementServiceMocks.removeFavorite.mockResolvedValue({ id: 'fav-1' });
    const req = createRequest({
      params: { jobId: '44' },
      query: { memberId: 'me' },
      user: { id: 55 },
    });
    const res = createMockResponse();

    await jobManagementController.unfavorite(req, res);

    expect(jobManagementServiceMocks.removeFavorite).toHaveBeenCalledWith('44', { workspaceId: null, memberId: 55 });
    expect(res.json).toHaveBeenCalledWith({ data: { id: 'fav-1' } });
  });
});

describe('agencyMentoringController', () => {
  it('includes workspace identifiers and actor context when creating sessions', async () => {
    mentoringServiceMocks.createMentoringSession.mockResolvedValue({ id: 2 });
    const req = createRequest({
      params: { workspaceId: '88' },
      body: { mentorId: 11 },
      user: { id: 91, type: 'agency', roles: ['mentor_admin'] },
    });
    const res = createMockResponse();

    await mentoringController.sessionsCreate(req, res);

    expect(mentoringServiceMocks.createMentoringSession).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: '88', mentorId: 11 }),
      { actorId: 91, actorRole: 'agency', actorRoles: ['mentor_admin'] },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('passes actor roles when listing preferences', async () => {
    mentoringServiceMocks.listMentorPreferences.mockResolvedValue({ data: [] });
    const req = createRequest({ query: { workspaceSlug: 'creative' }, user: { id: 5, type: 'agency', roles: ['agency_admin', 'mentor_manager'] } });
    const res = createMockResponse();

    await mentoringController.favouritesList(req, res);

    expect(mentoringServiceMocks.listMentorPreferences).toHaveBeenCalledWith(
      { workspaceSlug: 'creative' },
      { actorId: 5, actorRole: 'agency', actorRoles: ['agency_admin', 'mentor_manager'] },
    );
  });
});

describe('agencyNetworkingController', () => {
  it('merges workspace payload when creating bookings', async () => {
    networkingServiceMocks.createBooking.mockResolvedValue({ id: 'booking-1' });
    const req = createRequest({
      query: { workspaceSlug: 'growth' },
      body: { attendeeEmail: 'agent@example.com' },
      user: { id: 17, type: 'agency', roles: ['networking'] },
    });
    const res = createMockResponse();

    await networkingController.createBooking(req, res);

    expect(networkingServiceMocks.createBooking).toHaveBeenCalledWith(
      { workspaceSlug: 'growth', attendeeEmail: 'agent@example.com' },
      { actorId: 17, actorRole: 'agency', actorRoles: ['networking'] },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('wraps listBookings result', async () => {
    networkingServiceMocks.listBookings.mockResolvedValue([{ id: 1 }]);
    const req = createRequest();
    const res = createMockResponse();

    await networkingController.listBookings(req, res);

    expect(res.json).toHaveBeenCalledWith({ data: [{ id: 1 }] });
  });
});

describe('agencyProjectManagementController', () => {
  it('rejects unauthorised access when owner id missing', async () => {
    const req = createRequest({ user: null });
    const res = createMockResponse();

    await expect(projectManagementController.getProjectManagement(req, res)).rejects.toThrow(AuthorizationError);
    expect(projectManagementServiceMocks.listAgencyProjects).not.toHaveBeenCalled();
  });

  it('propagates actor context when creating projects', async () => {
    projectManagementServiceMocks.createAgencyProject.mockResolvedValue({ id: 5 });
    const req = createRequest({ body: { name: 'Revamp' }, user: { id: 11 } });
    const res = createMockResponse();

    await projectManagementController.createProject(req, res);

    expect(projectManagementServiceMocks.createAgencyProject).toHaveBeenCalledWith(11, { name: 'Revamp' }, { actorId: 11 });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('agencyTimelineController', () => {
  it('normalises pagination when listing posts', async () => {
    timelineServiceMocks.listTimelinePosts.mockResolvedValue({ items: [] });
    const req = createRequest({ query: { workspaceId: '10', limit: '25', offset: '5', lookbackDays: '30' } });
    const res = createMockResponse();

    await timelineController.index(req, res);

    expect(timelineServiceMocks.listTimelinePosts).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: '10', limit: 25, offset: 5, lookbackDays: '30' }),
      { actorId: 10, actorRole: 'agency' },
    );
  });

  it('defaults workspace id from query when creating posts', async () => {
    timelineServiceMocks.createTimelinePost.mockResolvedValue({ id: 3 });
    const req = createRequest({ body: { title: 'Launch Post' }, query: { workspaceId: '77' } });
    const res = createMockResponse();

    await timelineController.create(req, res);

    expect(timelineServiceMocks.createTimelinePost).toHaveBeenCalledWith(
      { title: 'Launch Post', workspaceId: '77' },
      { actorId: 10, actorRole: 'agency' },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('destroys posts using numeric identifiers', async () => {
    timelineServiceMocks.deleteTimelinePost.mockResolvedValue({ deleted: true });
    const req = createRequest({ params: { postId: ' 14 ' } });
    const res = createMockResponse();

    await timelineController.destroy(req, res);

    expect(timelineServiceMocks.deleteTimelinePost).toHaveBeenCalledWith(14, { actorId: 10, actorRole: 'agency' });
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });
});

describe('agencyWalletController', () => {
  it('derives role set from user when fetching overview', async () => {
    walletServiceMocks.getWalletOverview.mockResolvedValue({ balance: 0 });
    const req = createRequest({ user: { id: 5, type: 'finance_manager' }, query: { workspaceId: '19' } });
    const res = createMockResponse();

    await walletController.overview(req, res);

    expect(walletServiceMocks.getWalletOverview).toHaveBeenCalledWith(
      { workspaceId: '19' },
      { roles: ['finance_manager'] },
    );
  });

  it('forwards actor context on account creation', async () => {
    walletServiceMocks.createWalletAccount.mockResolvedValue({ id: 8 });
    const req = createRequest({ body: { workspaceId: 50 }, user: { id: 72, roles: ['finance', 'agency_admin'] } });
    const res = createMockResponse();

    await walletController.createAccount(req, res);

    expect(walletServiceMocks.createWalletAccount).toHaveBeenCalledWith(
      { workspaceId: 50 },
      { actorId: 72, roles: ['finance', 'agency_admin'] },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('passes ledger filters to service', async () => {
    walletServiceMocks.listLedgerEntries.mockResolvedValue({ entries: [] });
    const req = createRequest({ params: { accountId: '66' }, query: { limit: '10', offset: '2', entryType: 'credit' } });
    const res = createMockResponse();

    await walletController.listLedger(req, res);

    expect(walletServiceMocks.listLedgerEntries).toHaveBeenCalledWith(
      '66',
      { limit: '10', offset: '2', entryType: 'credit' },
      { roles: ['agency_admin'] },
    );
  });
});

describe('agencyWorkforceController', () => {
  it('returns empty workspace for dashboard payloads', async () => {
    workforceServiceMocks.getWorkforceDashboard.mockResolvedValue({ summary: {} });
    const req = createRequest({ query: {} });
    const res = createMockResponse();

    await workforceController.dashboard(req, res);

    expect(workforceServiceMocks.getWorkforceDashboard).toHaveBeenCalledWith({ workspaceId: null });
  });

  it('sends 204 on member deletion', async () => {
    const req = createRequest({ params: { memberId: '77' }, query: { workspaceId: '19' } });
    const res = createMockResponse();

    await workforceController.destroyMember(req, res);

    expect(workforceServiceMocks.deleteWorkforceMember).toHaveBeenCalledWith('77', { workspaceId: 19 });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('normalises workspace identifiers for availability updates', async () => {
    workforceServiceMocks.updateAvailabilityEntry.mockResolvedValue({ id: 3 });
    const req = createRequest({
      params: { entryId: '9' },
      body: { workspaceId: '45', status: 'away' },
    });
    const res = createMockResponse();

    await workforceController.updateAvailabilityEntryRecord(req, res);

    expect(workforceServiceMocks.updateAvailabilityEntry).toHaveBeenCalledWith('9', { workspaceId: '45', status: 'away' }, { workspaceId: 45 });
  });
});
