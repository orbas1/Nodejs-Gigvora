import { jest } from '@jest/globals';

describe('app rate limiter hot reload', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('hot reload updates rate limiter skip paths', async () => {
    let capturedSkip;

    const ensureEnvLoadedMock = jest.fn(() => process.env);

    jest.unstable_mockModule('../../src/config/envLoader.js', () => ({
      ensureEnvLoaded: ensureEnvLoadedMock,
      default: ensureEnvLoadedMock,
    }));

    jest.unstable_mockModule('../../src/config/httpSecurity.js', () => ({
      applyHttpSecurity: jest.fn(),
    }));

    jest.unstable_mockModule('../../src/middleware/webApplicationFirewall.js', () => ({
      __esModule: true,
      default: () => (req, res, next) => next(),
    }));

    const createInstrumentedRateLimiterMock = jest.fn(({ skip }) => {
      capturedSkip = skip;
      return (req, res, next) => next();
    });

    jest.unstable_mockModule('../../src/middleware/rateLimiter.js', () => ({
      __esModule: true,
      default: createInstrumentedRateLimiterMock,
      createInstrumentedRateLimiter: createInstrumentedRateLimiterMock,
    }));

    await import('../../src/app.js');
    const runtimeConfigModule = await import('../../src/config/runtimeConfig.js');
    const { refreshRuntimeConfig, whenRuntimeConfigReady } = runtimeConfigModule;

    await whenRuntimeConfigReady();

    expect(createInstrumentedRateLimiterMock).toHaveBeenCalledTimes(1);
    expect(typeof capturedSkip).toBe('function');

    expect(capturedSkip({ method: 'GET', baseUrl: '', path: '/health/ready' })).toBe(true);
    expect(capturedSkip({ method: 'OPTIONS', baseUrl: '', path: '/anything' })).toBe(true);
    expect(capturedSkip({ method: 'GET', baseUrl: '', path: '/api/data' })).toBe(false);

    await refreshRuntimeConfig({
      overrides: {
        RATE_LIMIT_SKIP_HEALTH: 'false',
        RATE_LIMIT_SKIP_PATHS: '/custom/status',
      },
    });

    expect(createInstrumentedRateLimiterMock).toHaveBeenCalledTimes(2);
    expect(typeof capturedSkip).toBe('function');

    expect(capturedSkip({ method: 'GET', baseUrl: '', path: '/custom/status' })).toBe(true);
    expect(capturedSkip({ method: 'GET', baseUrl: '', path: '/health/ready' })).toBe(false);
    expect(capturedSkip({ method: 'GET', baseUrl: '', path: '/api/admin/runtime/health' })).toBe(true);

    await refreshRuntimeConfig();
  });
});
