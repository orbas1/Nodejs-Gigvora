import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const serviceFunctionNames = [
  'listNetworkingSessions',
  'createNetworkingSession',
  'getNetworkingSession',
  'updateNetworkingSession',
  'regenerateNetworkingRotations',
  'registerForNetworkingSession',
  'updateNetworkingSignup',
  'listNetworkingBusinessCards',
  'createNetworkingBusinessCard',
  'updateNetworkingBusinessCard',
  'getNetworkingSessionRuntime',
];

const serviceExports = Object.fromEntries(serviceFunctionNames.map((name) => [name, jest.fn()]));

const { listNetworkingSessions, createNetworkingSession } = serviceExports;

const serviceModule = new URL('../src/services/networkingService.js', import.meta.url);

jest.unstable_mockModule(serviceModule.pathname, () => ({ ...serviceExports, default: serviceExports }));

let controller;
let AuthorizationError;
let ValidationError;

beforeAll(async () => {
  controller = await import('../src/controllers/networkingController.js');
  ({ AuthorizationError, ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
});

function createResponse() {
  return {
    json: jest.fn(),
  };
}

describe('networkingController.index', () => {
  it('rejects unauthorised workspace access', async () => {
    const req = {
      query: { companyId: '6' },
      networkingAccess: { permittedWorkspaceIds: [3] },
      user: { id: 9 },
    };

    await expect(controller.index(req, createResponse())).rejects.toThrow(AuthorizationError);
    expect(listNetworkingSessions).not.toHaveBeenCalled();
  });

  it('passes sanitised filters to the service', async () => {
    listNetworkingSessions.mockResolvedValue({ sessions: [] });
    const res = createResponse();

    await controller.index(
      {
        query: { lookbackDays: '999', includeMetrics: 'no', upcomingOnly: 'true' },
        networkingAccess: { permittedWorkspaceIds: [5], defaultWorkspaceId: 5 },
        user: { id: 2, roles: ['admin'] },
      },
      res,
    );

    expect(listNetworkingSessions).toHaveBeenCalledWith(
      {
        companyId: 5,
        status: undefined,
        includeMetrics: false,
        upcomingOnly: true,
        lookbackDays: 365,
      },
      { authorizedWorkspaceIds: [5] },
    );
    expect(res.json).toHaveBeenCalledWith({ sessions: [], meta: { permittedWorkspaceIds: [5], selectedWorkspaceId: 5 } });
  });
});

describe('networkingController.create', () => {
  it('requires authentication', async () => {
    await expect(controller.create({ body: {}, networkingAccess: {}, user: null }, createResponse())).rejects.toThrow(
      AuthorizationError,
    );
    expect(createNetworkingSession).not.toHaveBeenCalled();
  });
});
