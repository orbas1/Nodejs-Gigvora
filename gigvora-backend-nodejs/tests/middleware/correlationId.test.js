import { jest } from '@jest/globals';

const moduleUrl = new URL('../../src/middleware/correlationId.js', import.meta.url);
const runtimeConfigModuleUrl = new URL('../../src/config/runtimeConfig.js', import.meta.url);

async function loadCorrelationMiddleware({ config = {}, uuid = 'generated-uuid' } = {}) {
  jest.resetModules();

  const randomUUID = jest.fn().mockReturnValue(uuid);
  const changeListeners = [];

  jest.unstable_mockModule('node:crypto', () => ({
    randomUUID,
  }));

  jest.unstable_mockModule(runtimeConfigModuleUrl.pathname, () => ({
    getRuntimeConfig: jest.fn(() => config),
    onRuntimeConfigChange: jest.fn((handler) => {
      changeListeners.push(handler);
    }),
  }));

  const correlationModule = await import(moduleUrl.pathname);
  return { ...correlationModule, randomUUID, changeListeners };
}

describe('middleware/correlationId', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('generates a UUID when inbound headers are not accepted', async () => {
    const { default: createMiddleware, randomUUID } = await loadCorrelationMiddleware();
    const middleware = createMiddleware();

    const req = { headers: {} };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(req.id).toBe('generated-uuid');
    expect(req.correlationId).toBe('generated-uuid');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'generated-uuid');
    expect(next).toHaveBeenCalledWith();
  });

  it('reuses a valid inbound correlation id when configured to accept one', async () => {
    const inboundId = 'InboundCorrelationId-1234567890';
    const { default: createMiddleware } = await loadCorrelationMiddleware({
      config: {
        observability: {
          correlation: { acceptIncomingHeader: true, headerName: 'X-Correlation-Id' },
        },
      },
      uuid: 'ignored-uuid',
    });

    const middleware = createMiddleware();
    const req = { headers: { 'x-correlation-id': inboundId } };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.id).toBe(inboundId);
    expect(req.correlationId).toBe(inboundId);
    expect(req.parentCorrelationId).toBeUndefined();
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', inboundId);
    expect(next).toHaveBeenCalledWith();
  });

  it('ignores malformed inbound identifiers', async () => {
    const { default: createMiddleware, randomUUID } = await loadCorrelationMiddleware({
      config: {
        observability: {
          correlation: { acceptIncomingHeader: true },
        },
      },
      uuid: 'fallback-uuid',
    });

    const middleware = createMiddleware();
    const req = { headers: { 'x-request-id': 'invalid id\nwith newline' } };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(req.id).toBe('fallback-uuid');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'fallback-uuid');
  });

  it('responds to runtime configuration updates for custom headers', async () => {
    const { default: createMiddleware, changeListeners } = await loadCorrelationMiddleware({
      config: {
        observability: {
          correlation: { acceptIncomingHeader: false },
        },
      },
      uuid: 'config-uuid',
    });

    const middleware = createMiddleware();
    const update = changeListeners[0];
    expect(typeof update).toBe('function');

    update({
      config: {
        observability: {
          correlation: { acceptIncomingHeader: true, headerName: 'X-Custom-Request' },
        },
      },
    });

    const inboundId = 'CustomHeaderCorrelation-00001';
    const req = { headers: { 'x-custom-request': inboundId } };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.id).toBe(inboundId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', inboundId);
  });
});
