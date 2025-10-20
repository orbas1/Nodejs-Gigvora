import { jest } from '@jest/globals';

process.env.LOG_LEVEL = 'silent';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const runtimeConfigModuleUrl = new URL('../../src/config/runtimeConfig.js', import.meta.url);
const httpSecurityModuleUrl = new URL('../../src/config/httpSecurity.js', import.meta.url);
const socketAuthModuleUrl = new URL('../../src/realtime/socketAuth.js', import.meta.url);
const connectionRegistryModuleUrl = new URL('../../src/realtime/connectionRegistry.js', import.meta.url);
const presenceStoreModuleUrl = new URL('../../src/realtime/presenceStore.js', import.meta.url);
const communityNamespaceModuleUrl = new URL('../../src/realtime/communityNamespace.js', import.meta.url);
const voiceNamespaceModuleUrl = new URL('../../src/realtime/voiceNamespace.js', import.meta.url);
const eventsNamespaceModuleUrl = new URL('../../src/realtime/eventsNamespace.js', import.meta.url);
const moderationNamespaceModuleUrl = new URL('../../src/realtime/moderationNamespace.js', import.meta.url);
const loggerModuleUrl = new URL('../../src/utils/logger.js', import.meta.url);

function createLogger() {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn(),
  };
  logger.child.mockImplementation((bindings) => {
    if (bindings?.component === 'realtime-cors') {
      const corsLogger = createLogger();
      corsLogger.child = jest.fn().mockImplementation(() => corsLogger);
      corsLogger.warn = jest.fn();
      corsLogger.info = jest.fn();
      corsLogger.error = jest.fn();
      logger.__corsLogger = corsLogger;
      return corsLogger;
    }
    return createLogger();
  });
  return logger;
}

const baseRuntimeConfig = {
  realtime: {
    enabled: true,
    cors: { allowedOrigins: [] },
    connection: {
      pingIntervalMs: 25000,
      pingTimeoutMs: 60000,
      handshakeTimeoutMs: 12000,
      maxConnectionsPerUser: 5,
    },
    redis: {},
  },
  security: {
    cors: { allowedOrigins: [] },
  },
};

let attachSocketServer;
let shutdownSocketServer;
let getRuntimeConfigMock;
let resolveAllowedOriginsMock;
let compileAllowedOriginRulesMock;
let isOriginAllowedMock;
let serverInstance;
let serverConstructorMock;
let createConnectionRegistryMock;
let registerCommunityNamespaceMock;
let registerVoiceNamespaceMock;
let registerEventsNamespaceMock;
let registerModerationNamespaceMock;
let baseLoggerMock;

beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();

  getRuntimeConfigMock = jest.fn(() => structuredClone(baseRuntimeConfig));
  resolveAllowedOriginsMock = jest.fn(() => ['https://fallback.gigvora.com']);
  compileAllowedOriginRulesMock = jest.fn(() => ['compiled-rule']);
  isOriginAllowedMock = jest.fn(() => true);

  serverInstance = null;
  serverConstructorMock = jest.fn().mockImplementation((_server, options) => {
    serverInstance = {
      options,
      engine: { opts: {} },
      use: jest.fn(),
      on: jest.fn(),
      adapter: jest.fn(),
      emit: jest.fn(),
      close: jest.fn((callback) => {
        if (callback) {
          callback();
        }
      }),
    };
    return serverInstance;
  });

  createConnectionRegistryMock = jest.fn(() => ({
    register: jest.fn().mockResolvedValue(undefined),
    unregister: jest.fn().mockResolvedValue(undefined),
  }));

  registerCommunityNamespaceMock = jest.fn();
  registerVoiceNamespaceMock = jest.fn();
  registerEventsNamespaceMock = jest.fn();
  registerModerationNamespaceMock = jest.fn();
  baseLoggerMock = createLogger();

  jest.unstable_mockModule(runtimeConfigModuleUrl.pathname, () => ({
    getRuntimeConfig: getRuntimeConfigMock,
    onRuntimeConfigChange: jest.fn(),
    whenRuntimeConfigReady: jest.fn((handler) => handler?.()),
  }));

  jest.unstable_mockModule(httpSecurityModuleUrl.pathname, () => ({
    resolveAllowedOrigins: resolveAllowedOriginsMock,
    compileAllowedOriginRules: compileAllowedOriginRulesMock,
    isOriginAllowed: isOriginAllowedMock,
  }));

  jest.unstable_mockModule(socketAuthModuleUrl.pathname, () => ({
    default: jest.fn().mockResolvedValue({ id: 'user-1', roles: [], permissions: [] }),
  }));

  jest.unstable_mockModule(connectionRegistryModuleUrl.pathname, () => ({
    createConnectionRegistry: createConnectionRegistryMock,
  }));

  jest.unstable_mockModule(presenceStoreModuleUrl.pathname, () => ({
    createPresenceStore: jest.fn(() => ({})),
  }));

  jest.unstable_mockModule(communityNamespaceModuleUrl.pathname, () => ({
    default: registerCommunityNamespaceMock,
  }));

  jest.unstable_mockModule(voiceNamespaceModuleUrl.pathname, () => ({
    default: registerVoiceNamespaceMock,
  }));

  jest.unstable_mockModule(eventsNamespaceModuleUrl.pathname, () => ({
    default: registerEventsNamespaceMock,
  }));

  jest.unstable_mockModule(moderationNamespaceModuleUrl.pathname, () => ({
    default: registerModerationNamespaceMock,
  }));

  jest.unstable_mockModule(loggerModuleUrl.pathname, () => ({
    default: baseLoggerMock,
  }));

  jest.unstable_mockModule('socket.io', () => ({
    Server: serverConstructorMock,
  }));

  jest.unstable_mockModule('@socket.io/redis-adapter', () => ({
    createAdapter: jest.fn(),
  }));

  const moduleUrl = new URL('../../src/realtime/socketServer.js', import.meta.url);
  const socketServerModule = await import(moduleUrl.pathname);
  attachSocketServer = socketServerModule.attachSocketServer;
  shutdownSocketServer = socketServerModule.shutdownSocketServer;
});

afterEach(async () => {
  if (shutdownSocketServer) {
    await shutdownSocketServer();
  }
});

describe('socketServer CORS policy alignment', () => {
  test('prefers realtime-specific allowed origins when provided', async () => {
    getRuntimeConfigMock.mockReturnValue({
      ...structuredClone(baseRuntimeConfig),
      realtime: {
        ...structuredClone(baseRuntimeConfig.realtime),
        cors: { allowedOrigins: ['https://events.gigvora.com'] },
      },
    });

    const logger = createLogger();

    await attachSocketServer({}, { logger });

    expect(compileAllowedOriginRulesMock).toHaveBeenCalledWith(['https://events.gigvora.com']);
    expect(resolveAllowedOriginsMock).not.toHaveBeenCalled();

    const corsLogger = logger.__corsLogger;
    expect(corsLogger).toBeDefined();

    const originCallback = serverInstance.options.cors.origin;
    const allowCallback = jest.fn();
    isOriginAllowedMock.mockReturnValueOnce(true);
    originCallback('https://events.gigvora.com', allowCallback);
    expect(isOriginAllowedMock).toHaveBeenCalledWith('https://events.gigvora.com', ['compiled-rule']);
    expect(allowCallback).toHaveBeenCalledWith(null, true);

    const blockCallback = jest.fn();
    isOriginAllowedMock.mockReturnValueOnce(false);
    originCallback('https://attacker.example.com', blockCallback);
    expect(blockCallback.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(blockCallback.mock.calls[0][0].data).toEqual({ origin: 'https://attacker.example.com' });
    expect(blockCallback.mock.calls[0][1]).toBe(false);
    expect(corsLogger.warn).toHaveBeenCalledWith(
      { origin: 'https://attacker.example.com' },
      'Blocked realtime connection from untrusted origin',
    );
  });

  test('falls back to security allowed origins when realtime list is empty', async () => {
    getRuntimeConfigMock.mockReturnValue({
      ...structuredClone(baseRuntimeConfig),
      security: {
        cors: { allowedOrigins: ['https://admin.gigvora.com', 'https://ops.gigvora.com'] },
      },
    });

    const logger = createLogger();

    await attachSocketServer({}, { logger });

    expect(compileAllowedOriginRulesMock).toHaveBeenCalledWith([
      'https://admin.gigvora.com',
      'https://ops.gigvora.com',
    ]);
    expect(resolveAllowedOriginsMock).not.toHaveBeenCalled();
  });

  test('uses default HTTP allowed origins when no runtime configuration is provided', async () => {
    getRuntimeConfigMock.mockReturnValue({
      ...structuredClone(baseRuntimeConfig),
      security: { cors: { allowedOrigins: [] } },
      realtime: {
        ...structuredClone(baseRuntimeConfig.realtime),
        cors: { allowedOrigins: [] },
      },
    });

    const logger = createLogger();

    await attachSocketServer({}, { logger });

    expect(resolveAllowedOriginsMock).toHaveBeenCalledTimes(1);
    expect(compileAllowedOriginRulesMock).toHaveBeenCalledWith(['https://fallback.gigvora.com']);
  });
});
