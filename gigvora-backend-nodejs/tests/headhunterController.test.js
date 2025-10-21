import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getDashboardSnapshot = jest.fn();

const serviceModule = new URL('../src/services/headhunterService.js', import.meta.url);

jest.unstable_mockModule(serviceModule.pathname, () => ({ getDashboardSnapshot }));

let controller;
let AuthorizationError;
let ValidationError;

beforeAll(async () => {
  controller = await import('../src/controllers/headhunterController.js');
  ({ AuthorizationError, ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  getDashboardSnapshot.mockReset();
});

function createResponse() {
  return {
    json: jest.fn(),
  };
}

describe('headhunterController.dashboard', () => {
  it('rejects missing workspace identifiers', async () => {
    const req = { query: {}, user: { id: 1, roles: ['headhunter'] } };
    await expect(controller.dashboard(req, createResponse())).rejects.toThrow(ValidationError);
    expect(getDashboardSnapshot).not.toHaveBeenCalled();
  });

  it('enforces workspace membership', async () => {
    const req = {
      query: { workspaceId: '9' },
      user: { id: 2, roles: ['headhunter'], workspaceIds: [3] },
    };

    await expect(controller.dashboard(req, createResponse())).rejects.toThrow(AuthorizationError);
    expect(getDashboardSnapshot).not.toHaveBeenCalled();
  });

  it('sanitises inputs and forwards context', async () => {
    getDashboardSnapshot.mockResolvedValue({ stats: {} });

    const res = createResponse();
    await controller.dashboard(
      {
        query: { workspaceId: '12', lookbackDays: '999' },
        user: { id: 5, roles: ['admin'] },
      },
      res,
    );

    expect(getDashboardSnapshot).toHaveBeenCalledWith({ workspaceId: 12, lookbackDays: 365 });
    expect(res.json).toHaveBeenCalledWith({ stats: {}, workspaceId: 12, memberships: [], lookbackDays: 365 });
  });
});
