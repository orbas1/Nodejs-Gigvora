import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const applyToLaunchpad = jest.fn();
const updateLaunchpadApplicationStatus = jest.fn();
const listLaunchpadApplications = jest.fn();

const serviceModule = new URL('../src/services/launchpadService.js', import.meta.url);

jest.unstable_mockModule(serviceModule.pathname, () => ({
  applyToLaunchpad,
  updateLaunchpadApplicationStatus,
  listLaunchpadApplications,
  getLaunchpadDashboard: jest.fn(),
  getLaunchpadWorkflow: jest.fn(),
  submitEmployerRequest: jest.fn(),
  recordLaunchpadPlacement: jest.fn(),
  linkLaunchpadOpportunity: jest.fn(),
}));

let controller;
let AuthorizationError;

beforeAll(async () => {
  controller = await import('../src/controllers/launchpadController.js');
  ({ AuthorizationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('launchpadController.updateApplication', () => {
  it('rejects unauthorised actors', async () => {
    const req = { params: { applicationId: '5' }, body: {}, user: { id: 2 } };
    await expect(controller.updateApplication(req, createResponse())).rejects.toThrow(AuthorizationError);
    expect(updateLaunchpadApplicationStatus).not.toHaveBeenCalled();
  });
});

describe('launchpadController.listApplications', () => {
  it('forwards sanitised filters', async () => {
    listLaunchpadApplications.mockResolvedValue({ data: [] });
    const res = createResponse();

    await controller.listApplications(
      {
        query: { launchpadId: '3', page: '1', pageSize: '500', minScore: '0.75' },
        user: { id: 1, roles: ['admin'] },
      },
      res,
    );

    expect(listLaunchpadApplications).toHaveBeenCalledWith(
      expect.objectContaining({ launchpadId: 3, page: 1, pageSize: 100, minScore: 0.75 }),
    );
    expect(res.json).toHaveBeenCalledWith({ data: [] });
  });
});
