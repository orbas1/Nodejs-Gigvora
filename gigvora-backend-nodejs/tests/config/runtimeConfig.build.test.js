import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const mockedFiles = new Map();

const readFileMock = jest.fn(async (filePath) => {
  if (!mockedFiles.has(filePath)) {
    const error = new Error('Not found');
    error.code = 'ENOENT';
    throw error;
  }
  return mockedFiles.get(filePath);
});

const watchMock = jest.fn((filePath, _options, listener) => {
  const handle = {
    close: jest.fn(),
    __watchedPath: filePath,
  };
  watchMock.handles.push({ filePath, listener, handle });
  return handle;
});
watchMock.handles = [];

jest.unstable_mockModule('node:fs/promises', () => ({
  readFile: readFileMock,
}));

jest.unstable_mockModule('node:fs', () => ({
  watch: watchMock,
}));

const runtimeConfigModuleUrl = new URL('../../src/config/runtimeConfig.js', import.meta.url);
const runtimeConfigModule = await import(runtimeConfigModuleUrl.pathname);

const {
  buildRuntimeConfigFromEnv,
  refreshRuntimeConfig,
  getRuntimeConfig,
  onRuntimeConfigChange,
  whenRuntimeConfigReady,
} = runtimeConfigModule;

describe('runtimeConfig', () => {
  beforeEach(() => {
    readFileMock.mockClear();
    watchMock.mockClear();
    watchMock.handles = [];
    mockedFiles.clear();
  });

  test('buildRuntimeConfigFromEnv normalises numeric and boolean values', () => {
    const config = buildRuntimeConfigFromEnv({
      NODE_ENV: 'production',
      RATE_LIMIT_WINDOW_MS: '120000',
      RATE_LIMIT_MAX_REQUESTS: '600',
      ENABLE_HTTP_LOGGING: 'false',
      CLIENT_URLS: 'https://app.gigvora.com, https://studio.gigvora.com',
      REALTIME_ALLOWED_ORIGINS: 'https://realtime.gigvora.com',
      REALTIME_MAX_CONNECTIONS_PER_USER: '12',
      CHATWOOT_ENABLED: 'true',
      CHATWOOT_BASE_URL: 'https://support.gigvora.com',
      CHATWOOT_WEBSITE_TOKEN: 'token-123',
    });

    expect(config.http.rateLimit.windowMs).toBe(120000);
    expect(config.http.rateLimit.maxRequests).toBe(600);
    expect(config.logging.enableHttpLogging).toBe(false);
    expect(config.security.cors.allowedOrigins).toContain('https://studio.gigvora.com');
    expect(config.realtime.cors.allowedOrigins).toEqual(
      expect.arrayContaining(['https://realtime.gigvora.com']),
    );
    expect(config.realtime.connection.maxConnectionsPerUser).toBe(12);
    expect(config.support.chatwoot.enabled).toBe(true);
    expect(config.support.chatwoot.baseUrl).toBe('https://support.gigvora.com');
  });

  test('refreshRuntimeConfig notifies listeners and registers file watchers', async () => {
    await whenRuntimeConfigReady();
    const listener = jest.fn();
    const unsubscribe = onRuntimeConfigChange(listener);

    mockedFiles.set('/tmp/runtime.env', 'ENABLE_HTTP_LOGGING=false');

    const nextConfig = await refreshRuntimeConfig({
      overrides: {
        RUNTIME_CONFIG_FILE: '/tmp/runtime.env',
      },
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'manual',
        config: nextConfig,
      }),
    );

    expect(getRuntimeConfig()).toBe(nextConfig);
    expect(watchMock).toHaveBeenCalledWith(
      '/tmp/runtime.env',
      expect.objectContaining({ persistent: false }),
      expect.any(Function),
    );

    expect(watchMock.handles).toHaveLength(1);

    const [watchEntry] = watchMock.handles;
    watchEntry.listener('change');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(readFileMock).toHaveBeenCalledWith('/tmp/runtime.env', 'utf8');

    unsubscribe();
  });
});
