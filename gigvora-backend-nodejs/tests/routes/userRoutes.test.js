import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const mockAuthenticate = jest.fn(() => (req, res, next) => {
  req.user = req.user || { id: Number.parseInt(req.params.id ?? req.body?.id ?? '1', 10) || 1, roles: ['user'] };
  next();
});

const createJsonResponder = (status = 200, payload = { ok: true }) =>
  jest.fn((req, res) => res.status(status).json(payload));

const userControllerMock = {
  listUsers: createJsonResponder(),
  getUserDashboard: createJsonResponder(),
  getUserDashboardOverview: createJsonResponder(),
  updateUserDashboardOverview: createJsonResponder(),
  refreshUserDashboardOverviewWeather: createJsonResponder(200, { refreshed: true }),
  getUserProfileHub: createJsonResponder(200, { hub: true }),
  getUserAffiliateDashboard: createJsonResponder(),
  getFreelancerAlliances: createJsonResponder(),
  getSupportDesk: createJsonResponder(),
  getFreelancerCatalogInsights: createJsonResponder(),
  getFreelancerGigBuilder: createJsonResponder(),
  getGigManagerSnapshot: createJsonResponder(),
  getUserAiSettings: createJsonResponder(),
  updateUserAiSettings: createJsonResponder(),
  getWebsitePreferences: createJsonResponder(),
  updateWebsitePreferences: createJsonResponder(),
  getUserProfile: createJsonResponder(),
  updateUser: createJsonResponder(),
  updateProfileSettings: createJsonResponder(),
  updateUserProfileDetails: createJsonResponder(),
  updateUserProfileAvatar: createJsonResponder(),
  listUserFollowers: createJsonResponder(),
  saveUserFollower: createJsonResponder(201, { follower: true }),
  deleteUserFollower: jest.fn((req, res) => res.status(204).send()),
  listUserConnections: createJsonResponder(),
  updateUserConnection: createJsonResponder(),
};

const userDisputeControllerMock = {
  listUserDisputes: createJsonResponder(),
  getUserDispute: createJsonResponder(),
  createUserDispute: createJsonResponder(201, { dispute: true }),
  appendUserDisputeEvent: createJsonResponder(201, { event: true }),
};

const careerDocumentControllerMock = {
  getWorkspace: createJsonResponder(),
  createDocument: createJsonResponder(201, { document: true }),
  uploadVersion: createJsonResponder(201, { version: true }),
  getCoverLetterWorkspace: createJsonResponder(),
  createCoverLetter: createJsonResponder(201, { coverLetter: true }),
  uploadCoverLetterVersion: createJsonResponder(201, { version: true }),
  createStoryBlock: createJsonResponder(201, { storyBlock: true }),
  uploadStoryBlockVersion: createJsonResponder(201, { version: true }),
};

const creationStudioControllerMock = {
  getWorkspace: createJsonResponder(),
  createItem: createJsonResponder(201, { item: true }),
  updateItem: createJsonResponder(),
  recordStep: createJsonResponder(201, { step: true }),
  shareItem: createJsonResponder(202, { shared: true }),
  archiveItem: jest.fn((req, res) => res.status(204).send()),
};

const notificationControllerMock = {
  listUserNotifications: createJsonResponder(),
  createUserNotification: createJsonResponder(201, { notification: true }),
  updateUserNotification: createJsonResponder(),
  getUserNotificationPreferences: createJsonResponder(),
  updateUserNotificationPreferences: createJsonResponder(),
  markAllUserNotificationsRead: jest.fn((req, res) => res.status(204).send()),
};

const createStubRouter = () => {
  const router = express.Router({ mergeParams: true });
  router.all('*', (req, res, next) => next());
  return router;
};

const authenticateModulePath = fileURLToPath(new URL('../../src/middleware/authenticate.js', import.meta.url));
const userControllerModulePath = fileURLToPath(new URL('../../src/controllers/userController.js', import.meta.url));
const userDisputeControllerModulePath = fileURLToPath(new URL('../../src/controllers/userDisputeController.js', import.meta.url));
const careerDocumentControllerModulePath = fileURLToPath(new URL('../../src/controllers/careerDocumentController.js', import.meta.url));
const creationStudioControllerModulePath = fileURLToPath(new URL('../../src/controllers/creationStudioController.js', import.meta.url));
const notificationControllerModulePath = fileURLToPath(new URL('../../src/controllers/notificationController.js', import.meta.url));
const userNetworkingRoutesModulePath = fileURLToPath(new URL('../../src/routes/userNetworkingRoutes.js', import.meta.url));
const userVolunteeringRoutesModulePath = fileURLToPath(new URL('../../src/routes/userVolunteeringRoutes.js', import.meta.url));
const userConsentRoutesModulePath = fileURLToPath(new URL('../../src/routes/userConsentRoutes.js', import.meta.url));
const userCalendarRoutesModulePath = fileURLToPath(new URL('../../src/routes/userCalendarRoutes.js', import.meta.url));
const walletRoutesModulePath = fileURLToPath(new URL('../../src/routes/walletRoutes.js', import.meta.url));
const userTimelineRoutesModulePath = fileURLToPath(new URL('../../src/routes/userTimelineRoutes.js', import.meta.url));
const userGroupRoutesModulePath = fileURLToPath(new URL('../../src/routes/userGroupRoutes.js', import.meta.url));
const userPageRoutesModulePath = fileURLToPath(new URL('../../src/routes/userPageRoutes.js', import.meta.url));

jest.unstable_mockModule(authenticateModulePath, () => ({
  __esModule: true,
  default: mockAuthenticate,
  authenticate: mockAuthenticate,
}));

jest.unstable_mockModule(userControllerModulePath, () => ({
  __esModule: true,
  ...userControllerMock,
}));

jest.unstable_mockModule(userDisputeControllerModulePath, () => ({
  __esModule: true,
  ...userDisputeControllerMock,
}));

jest.unstable_mockModule(careerDocumentControllerModulePath, () => ({
  __esModule: true,
  ...careerDocumentControllerMock,
}));

jest.unstable_mockModule(creationStudioControllerModulePath, () => ({
  __esModule: true,
  ...creationStudioControllerMock,
}));

jest.unstable_mockModule(notificationControllerModulePath, () => ({
  __esModule: true,
  ...notificationControllerMock,
}));

jest.unstable_mockModule(userNetworkingRoutesModulePath, () => ({
  __esModule: true,
  default: createStubRouter(),
}));

jest.unstable_mockModule(userVolunteeringRoutesModulePath, () => ({
  __esModule: true,
  default: createStubRouter(),
}));

jest.unstable_mockModule(userConsentRoutesModulePath, () => ({
  __esModule: true,
  default: createStubRouter(),
}));

jest.unstable_mockModule(userCalendarRoutesModulePath, () => ({
  __esModule: true,
  default: createStubRouter(),
}));

jest.unstable_mockModule(walletRoutesModulePath, () => ({
  __esModule: true,
  default: createStubRouter(),
}));

jest.unstable_mockModule(userTimelineRoutesModulePath, () => ({
  __esModule: true,
  default: createStubRouter(),
}));

jest.unstable_mockModule(userGroupRoutesModulePath, () => ({
  __esModule: true,
  default: createStubRouter(),
}));

jest.unstable_mockModule(userPageRoutesModulePath, () => ({
  __esModule: true,
  default: createStubRouter(),
}));

const userRoutesModulePath = fileURLToPath(new URL('../../src/routes/userRoutes.js', import.meta.url));
const { default: userRoutes } = await import(userRoutesModulePath);

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/users', userRoutes);
  return app;
};

const resetControllerMocks = () => {
  [
    userControllerMock,
    userDisputeControllerMock,
    careerDocumentControllerMock,
    creationStudioControllerMock,
    notificationControllerMock,
  ].forEach((moduleMocks) => {
    Object.values(moduleMocks).forEach((handler) => {
      if (handler && typeof handler.mockClear === 'function') {
        handler.mockClear();
      }
    });
  });
};

describe('userRoutes', () => {
  const app = buildApp();

  beforeEach(() => {
    resetControllerMocks();
  });

  test('routes dashboard weather refresh requests to the controller with authentication', async () => {
    const response = await request(app).post('/users/42/dashboard/overview/refresh-weather');

    expect(response.status).toBe(200);
    expect(userControllerMock.refreshUserDashboardOverviewWeather).toHaveBeenCalledTimes(1);
    expect(userControllerMock.refreshUserDashboardOverviewWeather.mock.calls[0][0].params.id).toBe('42');
  });

  test('exposes the profile hub endpoint for authenticated users', async () => {
    const response = await request(app).get('/users/7/profile-hub');

    expect(response.status).toBe(200);
    expect(userControllerMock.getUserProfileHub).toHaveBeenCalledTimes(1);
    expect(userControllerMock.getUserProfileHub.mock.calls[0][0].params.id).toBe('7');
  });

  test('configures ownership-aware authentication for community workspaces', () => {
    const registrationCalls = mockAuthenticate.mock.calls.map(([options]) => options);

    expect(registrationCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          matchParam: 'id',
          roles: expect.arrayContaining(['user', 'admin']),
        }),
        expect.objectContaining({
          matchParam: 'id',
          roles: expect.arrayContaining(['mentor', 'headhunter']),
        }),
      ]),
    );
  });
});
