import { jest } from '@jest/globals';

const moduleUrl = new URL('../../src/middleware/rateLimiter.js', import.meta.url);
const metricsModuleUrl = new URL('../../src/observability/rateLimitMetrics.js', import.meta.url);

function createRateLimitMock() {
  const rateLimitFn = jest.fn();
  let optionsRef;

  const mock = jest.fn((options) => {
    optionsRef = options;
    return (req, res, next) => {
      if (req.__shouldBlock) {
        options.handler(req, res, next, { statusCode: 429, message: { message: 'Too fast' } });
      } else {
        next();
      }
    };
  });

  rateLimitFn.getOptions = () => optionsRef;
  rateLimitFn.impl = mock;
  return rateLimitFn;
}

describe('middleware/rateLimiter', () => {
  let configureRateLimitMetrics;
  let recordRateLimitAttempt;
  let recordRateLimitSuccess;
  let recordRateLimitBlocked;
  let rateLimit;

  beforeEach(() => {
    jest.resetModules();
    configureRateLimitMetrics = jest.fn();
    recordRateLimitAttempt = jest.fn();
    recordRateLimitSuccess = jest.fn();
    recordRateLimitBlocked = jest.fn();
    rateLimit = createRateLimitMock();

    jest.unstable_mockModule(metricsModuleUrl.pathname, () => ({
      configureRateLimitMetrics,
      recordRateLimitAttempt,
      recordRateLimitSuccess,
      recordRateLimitBlocked,
    }));

    jest.unstable_mockModule('express-rate-limit', () => ({
      default: rateLimit.impl,
    }));
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('configures metrics with default options', async () => {
    const { createInstrumentedRateLimiter } = await import(moduleUrl.pathname);
    createInstrumentedRateLimiter();
    expect(configureRateLimitMetrics).toHaveBeenCalledWith({ windowMs: 60_000, max: 300 });
  });

  it('records attempts and successes for allowed requests', async () => {
    const { createInstrumentedRateLimiter } = await import(moduleUrl.pathname);
    const middleware = createInstrumentedRateLimiter();

    const req = {
      method: 'post',
      path: '/submit',
      baseUrl: '/api',
      ip: '127.0.0.1',
      user: { id: 42 },
      __shouldBlock: false,
    };
    const res = {};
    const next = jest.fn();

    await middleware(req, res, next);

    expect(recordRateLimitAttempt).toHaveBeenCalledTimes(1);
    expect(recordRateLimitSuccess).toHaveBeenCalledTimes(1);
    expect(req.__rateLimitProbe).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('records blocked attempts and returns a structured response', async () => {
    const { createInstrumentedRateLimiter } = await import(moduleUrl.pathname);
    const middleware = createInstrumentedRateLimiter();

    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };
    const req = {
      method: 'GET',
      path: '/profile',
      baseUrl: '',
      headers: {},
      ip: '127.0.0.2',
      __shouldBlock: true,
    };

    await middleware(req, res, jest.fn());

    expect(recordRateLimitAttempt).toHaveBeenCalledTimes(1);
    expect(recordRateLimitBlocked).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({ message: 'Too fast' });
  });

  it('supports custom skip logic to bypass the limiter', async () => {
    const { createInstrumentedRateLimiter } = await import(moduleUrl.pathname);
    const middleware = createInstrumentedRateLimiter({ skip: () => true });

    const next = jest.fn();
    await middleware({}, {}, next);

    expect(recordRateLimitAttempt).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});
