import { jest } from '@jest/globals';

const moduleUrl = new URL('../../src/middleware/metricsAuth.js', import.meta.url);
const runtimeConfigModuleUrl = new URL('../../src/config/runtimeConfig.js', import.meta.url);

async function loadMetricsAuth({ config = {} } = {}) {
  jest.resetModules();
  const changeListeners = [];

  jest.unstable_mockModule(runtimeConfigModuleUrl.pathname, () => ({
    getRuntimeConfig: jest.fn(() => config),
    onRuntimeConfigChange: jest.fn((handler) => {
      changeListeners.push(handler);
    }),
  }));

  const metricsModule = await import(moduleUrl.pathname);
  return { ...metricsModule, changeListeners };
}

describe('middleware/metricsAuth', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns 404 when metrics are disabled', async () => {
    const { default: createMiddleware } = await loadMetricsAuth({
      config: { security: { metrics: { enabled: false } } },
    });

    const middleware = createMiddleware();
    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };

    middleware({ id: 'req-1' }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: 'Metrics endpoint is disabled.', requestId: 'req-1' });
  });

  it('rejects requests without a bearer token', async () => {
    const { default: createMiddleware } = await loadMetricsAuth({
      config: { security: { metrics: { enabled: true, token: 'metrics-secret' } } },
    });

    const middleware = createMiddleware();
    const req = { get: jest.fn(() => undefined), id: 'req-2' };
    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };

    middleware(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: 'Metrics authentication required.', requestId: 'req-2' });
  });

  it('rejects invalid tokens with a 403 response', async () => {
    const { default: createMiddleware } = await loadMetricsAuth({
      config: { security: { metrics: { enabled: true, token: 'metrics-secret' } } },
    });

    const middleware = createMiddleware();
    const req = { get: jest.fn(() => 'Bearer invalid'), id: 'req-3' };
    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };

    middleware(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ message: 'Invalid metrics authentication token.', requestId: 'req-3' });
  });

  it('authorises the request when a valid token is supplied and reacts to config updates', async () => {
    const { default: createMiddleware, changeListeners } = await loadMetricsAuth({
      config: { security: { metrics: { enabled: true, token: 'metrics-secret' } } },
    });

    const middleware = createMiddleware();
    const next = jest.fn();
    const req = { get: jest.fn(() => 'Bearer metrics-secret'), id: 'req-4' };

    middleware(req, { status: jest.fn() }, next);
    expect(next).toHaveBeenCalledWith();

    const update = changeListeners[0];
    update({ config: { security: { metrics: { enabled: true } } } });

    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };
    middleware(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
