import { jest } from '@jest/globals';

const authenticationModuleUrl = new URL('../../src/middleware/authentication.js', import.meta.url);
const jwtModuleId = 'jsonwebtoken';
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

async function loadAuthenticationModule({ payload, verifyError, userRecord, memberships } = {}) {
  jest.resetModules();
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';

  const verify = jest.fn();
  if (verifyError) {
    verify.mockImplementation(() => {
      throw verifyError;
    });
  } else {
    verify.mockReturnValue(
      payload ?? {
        id: 15,
        permissions: ['workspace:read', 'workspace:write'],
      },
    );
  }

  jest.unstable_mockModule(jwtModuleId, () => ({
    default: { verify },
  }));

  const findByPk = jest.fn().mockResolvedValue(
    userRecord ?? {
      id: 15,
      email: 'user@gigvora.com',
      firstName: 'Test',
      lastName: 'User',
      userType: 'user',
    },
  );

  const findAll = jest.fn().mockResolvedValue(
    memberships ?? [
      {
        id: 7,
        workspaceId: 99,
        role: 'admin',
        status: 'active',
        workspace: { id: 99, name: 'Acme Studio', slug: 'acme', type: 'company' },
      },
    ],
  );

  jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({
    User: { findByPk },
    ProviderWorkspaceMember: { findAll },
    ProviderWorkspace: {},
  }));

  const module = await import(authenticationModuleUrl.pathname);
  return { verify, findByPk, findAll, ...module };
}

describe('middleware/authentication', () => {
  afterAll(() => {
    delete process.env.JWT_SECRET;
    delete process.env.NODE_ENV;
  });

  it('hydrates authenticated users with workspace memberships', async () => {
    const context = await loadAuthenticationModule({
      payload: {
        id: 21,
        permissions: ['calendar:read'],
      },
      userRecord: {
        id: 21,
        email: 'owner@gigvora.com',
        firstName: 'Workspace',
        lastName: 'Owner',
        userType: 'company',
      },
      memberships: [
        {
          id: 5,
          workspaceId: 12,
          role: 'admin',
          status: 'active',
          workspace: { id: 12, name: 'Studio', slug: 'studio', type: 'company' },
        },
      ],
    });

    const req = { headers: { authorization: 'Bearer good-token' } };
    const user = await context.resolveAuthenticatedUser(req, { optional: false });

    expect(context.verify).toHaveBeenCalledWith('good-token', 'test-secret');
    expect(user).toMatchObject({
      id: 21,
      email: 'owner@gigvora.com',
      userType: 'company',
      permissions: ['calendar:read'],
    });
    expect(user.memberships).toEqual([
      expect.objectContaining({
        id: 5,
        workspaceId: 12,
        role: 'admin',
        workspace: expect.objectContaining({ name: 'Studio', slug: 'studio' }),
      }),
    ]);
  });

  it('allows optional authentication when the token is invalid', async () => {
    const context = await loadAuthenticationModule({ verifyError: new Error('expired') });
    const middleware = context.authenticateRequest({ optional: true });
    const req = { headers: { authorization: 'Bearer expired' } };
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('supports trusted header overrides in non-production environments', async () => {
    const context = await loadAuthenticationModule({ userRecord: null, memberships: [] });
    const req = {
      headers: {
        'x-user-id': '55',
        'x-roles': 'admin,manager',
        'x-user-type': 'admin',
      },
    };

    const user = await context.resolveAuthenticatedUser(req, { optional: false });
    expect(user).toEqual({
      id: 55,
      roles: ['admin', 'manager'],
      userType: 'admin',
      source: 'header-override',
    });
  });

  it('returns a 401 response when authentication fails and is required', async () => {
    const context = await loadAuthenticationModule({ verifyError: new Error('invalid') });
    const middleware = context.authenticateRequest();
    const req = { headers: { authorization: 'Bearer invalid' } };
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/invalid or expired/i) }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
