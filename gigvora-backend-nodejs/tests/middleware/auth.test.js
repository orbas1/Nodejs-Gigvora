import { jest } from '@jest/globals';

const authModuleUrl = new URL('../../src/middleware/auth.js', import.meta.url);
const jwtModuleId = 'jsonwebtoken';
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

async function loadAuthModule({ userRecord, payload, tokenError } = {}) {
  jest.resetModules();
  process.env.JWT_SECRET = 'test-secret';

  const verify = jest.fn();
  if (tokenError) {
    verify.mockImplementation(() => {
      throw tokenError;
    });
  } else {
    verify.mockReturnValue(payload ?? { id: 1, roles: ['admin'] });
  }

  jest.unstable_mockModule(jwtModuleId, () => ({
    default: { verify },
  }));

  const findByPk = jest.fn().mockResolvedValue(userRecord ?? { id: 1, email: 'admin@gigvora.com', userType: 'admin' });
  jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({
    User: { findByPk },
  }));

  const authModule = await import(authModuleUrl.pathname);
  return { verify, findByPk, ...authModule };
}

describe('middleware/auth', () => {
  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  it('authenticates a request using the Authorization header', async () => {
    const { authenticate, verify, findByPk } = await loadAuthModule({
      payload: { id: 42, roles: ['admin', 'operator'] },
      userRecord: { id: 42, email: 'ops@gigvora.com', userType: 'admin' },
    });

    const req = { headers: { authorization: 'Bearer token-123' } };
    const next = jest.fn();

    await authenticate(req, {}, next);

    expect(verify).toHaveBeenCalledWith('token-123', 'test-secret');
    expect(findByPk).toHaveBeenCalledWith(42, { attributes: ['id', 'email', 'userType'] });
    expect(req.user).toEqual({
      id: 42,
      role: 'admin',
      email: 'ops@gigvora.com',
      roles: ['admin', 'operator'],
      payload: { id: 42, roles: ['admin', 'operator'] },
    });
    expect(req.auth).toEqual({ userId: 42, token: 'token-123', payload: { id: 42, roles: ['admin', 'operator'] } });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('supports cookie based tokens and propagates authentication errors', async () => {
    const error = new Error('invalid token');
    const { authenticate } = await loadAuthModule({ tokenError: error });

    const req = { headers: {}, cookies: { accessToken: 'cookie-token' } };
    const next = jest.fn();

    await authenticate(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const [err] = next.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/invalid or expired/i);
  });

  it('enforces RBAC via requireRole middleware', async () => {
    const { requireRole } = await loadAuthModule();
    const middleware = requireRole('admin');

    const next = jest.fn();
    middleware({ user: { role: 'admin', roles: ['admin'] } }, {}, next);
    expect(next).toHaveBeenCalledTimes(1);

    const unauthorizedNext = jest.fn();
    middleware({ user: { role: 'user', roles: ['user'] } }, {}, unauthorizedNext);
    expect(unauthorizedNext).toHaveBeenCalledTimes(1);
    expect(unauthorizedNext.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
