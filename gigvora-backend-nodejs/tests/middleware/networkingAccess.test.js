import { jest } from '@jest/globals';

const moduleUrl = new URL('../../src/middleware/networkingAccess.js', import.meta.url);
const errorsModuleUrl = new URL('../../src/utils/errors.js', import.meta.url);

describe('middleware/networkingAccess', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('rejects unauthenticated users with a 401 response', async () => {
    const { default: middlewareFactory } = await import(moduleUrl.pathname);
    const middleware = middlewareFactory();

    const status = jest.fn().mockReturnValue({ json: jest.fn() });
    const res = { status };

    middleware({}, res, jest.fn());

    expect(status).toHaveBeenCalledWith(401);
  });

  it('grants access to eligible workspace memberships', async () => {
    const { requireNetworkingManager } = await import(moduleUrl.pathname);
    const middleware = requireNetworkingManager();

    const req = {
      user: {
        id: 9,
        permissions: [],
        memberships: [
          { status: 'inactive', workspace: { type: 'company' }, role: 'admin', workspaceId: 10 },
          { status: 'active', workspace: { type: 'company' }, role: 'manager', workspaceId: 10 },
          { status: 'active', workspace: { type: 'agency' }, role: 'admin', workspaceId: 11 },
        ],
      },
    };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.networkingAccess).toEqual({
      permittedWorkspaceIds: [10, 11],
      defaultWorkspaceId: 10,
    });
  });

  it('honours global networking permissions from authentication context', async () => {
    const { requireNetworkingManager } = await import(moduleUrl.pathname);
    const middleware = requireNetworkingManager();

    const req = {
      user: {
        companyId: 55,
        permissions: ['networking.manage.any'],
        memberships: [
          { status: 'active', workspace: { type: 'community' }, role: 'member', workspaceId: 100 },
        ],
      },
      auth: {
        permissions: ['NETWORKING.MANAGE'],
      },
    };
    const next = jest.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.networkingAccess.defaultWorkspaceId).toBe(55);
    expect(req.networkingAccess.permittedWorkspaceIds).toEqual([100]);
  });

  it('throws an AuthorizationError when no access can be granted', async () => {
    const { requireNetworkingManager } = await import(moduleUrl.pathname);
    const { AuthorizationError } = await import(errorsModuleUrl.pathname);

    const middleware = requireNetworkingManager();
    const req = {
      user: {
        memberships: [
          { status: 'pending', workspace: { type: 'company' }, role: 'admin' },
        ],
        permissions: [],
      },
    };
    const next = jest.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const [err] = next.mock.calls[0];
    expect(err).toBeInstanceOf(AuthorizationError);
  });
});
