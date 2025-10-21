import { jest } from '@jest/globals';

const authenticateModuleUrl = new URL('../../src/middleware/authenticate.js', import.meta.url);
const jwtModuleId = 'jsonwebtoken';

async function loadAuthenticateModule({ payload, error } = {}) {
  jest.resetModules();
  process.env.JWT_SECRET = 'test-secret';

  const verify = jest.fn();
  if (error) {
    verify.mockImplementation(() => {
      throw error;
    });
  } else {
    verify.mockReturnValue(payload ?? { id: 99, roles: ['user'], type: 'user' });
  }

  jest.unstable_mockModule(jwtModuleId, () => ({
    default: { verify },
  }));

  const module = await import(authenticateModuleUrl.pathname);
  return { verify, ...module };
}

describe('middleware/authenticate', () => {
  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  it('attaches user context from a bearer token', async () => {
    const context = await loadAuthenticateModule({ payload: { id: 77, roles: ['company'], type: 'company' } });
    const middleware = context.authenticate();
    const req = { headers: { authorization: 'Bearer access-token' } };
    const next = jest.fn();

    await middleware(req, {}, next);

    expect(context.verify).toHaveBeenCalledWith('access-token', 'test-secret');
    expect(req.user).toEqual({ id: 77, type: 'company', roles: ['company'] });
    expect(req.auth).toEqual({ userId: 77, userType: 'company', token: 'access-token' });
    expect(next).toHaveBeenCalledWith();
  });

  it('enforces route parameter ownership with optional admin override', async () => {
    const context = await loadAuthenticateModule({ payload: { id: 10, roles: ['user'], type: 'user' } });
    const middleware = context.authenticate({ matchParam: 'userId' });

    const req = { headers: { authorization: 'Bearer token' }, params: { userId: '11' } };
    const next = jest.fn();

    await middleware(req, {}, next);

    const [error] = next.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/your own workspace/i);

    const adminContext = await loadAuthenticateModule({ payload: { id: 10, roles: ['admin'], type: 'admin' } });
    const adminMiddleware = adminContext.authenticate({ matchParam: 'userId' });
    const adminReq = { headers: { authorization: 'Bearer token' }, params: { userId: '999' } };
    const adminNext = jest.fn();

    await adminMiddleware(adminReq, {}, adminNext);
    expect(adminNext).toHaveBeenCalledWith();
  });

  it('rejects non-admin callers when admin access is required', async () => {
    const context = await loadAuthenticateModule({ payload: { id: 3, roles: ['user'], type: 'user' } });
    const middleware = context.requireAdmin;
    const req = { headers: { authorization: 'Bearer token' } };
    const next = jest.fn();

    await middleware(req, {}, next);

    const [error] = next.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/admin access required/i);
  });

  it('returns authentication errors when token is invalid', async () => {
    const error = new Error('jwt expired');
    const context = await loadAuthenticateModule({ error });
    const middleware = context.authenticate();
    const req = { headers: { authorization: 'Bearer expired-token' } };
    const next = jest.fn();

    await middleware(req, {}, next);

    const [err] = next.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/invalid or expired/i);
  });
});
