import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const runtimeListeners = [];

const modulePath = (relativePath) => new URL(relativePath, import.meta.url).pathname;

function createLogger() {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(() => logger),
  };
  return logger;
}

describe('server lifecycle start/stop orchestration', () => {
  let start;
  let stop;
  let httpServer;
  let logger;
  let createServer;
  let markHttpServerStarting;
  let markHttpServerReady;
  let markHttpServerClosing;
  let markHttpServerStopped;
  let warmDatabaseConnections;
  let startBackgroundWorkers;
  let bootstrapDatabase;
  let attachSocketServer;
  let recordRuntimeSecurityEvent;
  let shutdownSocketServer;
  let orchestrateHttpShutdown;
  let getPlatformSettings;
  let syncCriticalDependencies;

  beforeEach(async () => {
    jest.resetModules();
    runtimeListeners.length = 0;

    logger = createLogger();

    markHttpServerStarting = jest.fn();
    markHttpServerReady = jest.fn();
    markHttpServerClosing = jest.fn();
    markHttpServerStopped = jest.fn();

    warmDatabaseConnections = jest.fn().mockResolvedValue();
    startBackgroundWorkers = jest.fn().mockResolvedValue([{ name: 'worker:test', started: true }]);
    bootstrapDatabase = jest.fn().mockResolvedValue();
    attachSocketServer = jest.fn().mockResolvedValue();
    recordRuntimeSecurityEvent = jest.fn().mockResolvedValue();
    shutdownSocketServer = jest.fn().mockResolvedValue();
    orchestrateHttpShutdown = jest.fn(async ({ onHttpServerClosed, markHttpServerStopped: markStopped }) => {
      markStopped({ reason: 'shutdown' });
      onHttpServerClosed?.();
    });
    getPlatformSettings = jest.fn().mockResolvedValue({
      paymentProvider: 'stripe',
    });
    syncCriticalDependencies = jest.fn();

    const onceHandlers = new Map();
    const onHandlers = new Map();

    httpServer = {
      listen: jest.fn((port, callback) => {
        callback();
      }),
      once: jest.fn((event, handler) => {
        onceHandlers.set(event, handler);
      }),
      off: jest.fn((event) => {
        onceHandlers.delete(event);
      }),
      on: jest.fn((event, handler) => {
        onHandlers.set(event, handler);
      }),
      address: jest.fn(() => ({ port: 5050 })),
      emit: (event, ...args) => {
        const handler = onceHandlers.get(event) ?? onHandlers.get(event);
        handler?.(...args);
      },
    };

    createServer = jest.fn(() => httpServer);

    await jest.unstable_mockModule('node:http', () => ({
      default: { createServer },
      createServer,
    }));

    await jest.unstable_mockModule(modulePath('../../src/app.js'), () => ({ default: {} }));

    await jest.unstable_mockModule(modulePath('../../src/utils/logger.js'), () => ({ default: logger }));
    await jest.unstable_mockModule(modulePath('../../src/lifecycle/workerManager.js'), () => ({
      startBackgroundWorkers,
      stopBackgroundWorkers: jest.fn().mockResolvedValue(),
    }));
    await jest.unstable_mockModule(modulePath('../../src/lifecycle/databaseLifecycle.js'), () => ({
      bootstrapDatabase,
      shutdownDatabase: jest.fn().mockResolvedValue(),
    }));
    await jest.unstable_mockModule(modulePath('../../src/lifecycle/runtimeHealth.js'), () => ({
      markHttpServerStarting,
      markHttpServerReady,
      markHttpServerClosing,
      markHttpServerStopped,
    }));
    await jest.unstable_mockModule(modulePath('../../src/services/runtimeDependencyGuard.js'), () => ({
      warmRuntimeDependencyHealth: jest.fn().mockResolvedValue(),
    }));
    await jest.unstable_mockModule(modulePath('../../src/services/databaseLifecycleService.js'), () => ({
      warmDatabaseConnections,
      drainDatabaseConnections: jest.fn().mockResolvedValue(),
    }));
    await jest.unstable_mockModule(modulePath('../../src/services/platformSettingsService.js'), () => ({
      getPlatformSettings,
    }));
    await jest.unstable_mockModule(modulePath('../../src/observability/dependencyHealth.js'), () => ({
      syncCriticalDependencies,
    }));
    await jest.unstable_mockModule(modulePath('../../src/services/securityAuditService.js'), () => ({
      recordRuntimeSecurityEvent,
    }));
    await jest.unstable_mockModule(modulePath('../../src/lifecycle/httpShutdown.js'), () => ({
      default: orchestrateHttpShutdown,
      orchestrateHttpShutdown,
    }));
    await jest.unstable_mockModule(modulePath('../../src/realtime/socketServer.js'), () => ({
      attachSocketServer,
      shutdownSocketServer,
    }));
    await jest.unstable_mockModule(modulePath('../../src/observability/metricsRegistry.js'), () => ({
      getMetricsStatus: jest.fn(),
    }));
    await jest.unstable_mockModule(modulePath('../../src/config/runtimeConfig.js'), () => ({
      getRuntimeConfig: jest.fn(() => ({ http: { port: 5050 } })),
      whenRuntimeConfigReady: jest.fn(() => Promise.resolve()),
      onRuntimeConfigChange: jest.fn((callback) => {
        runtimeListeners.push(callback);
      }),
    }));

    ({ start, stop } = await import(modulePath('../../src/server.js')));
  });

  it('starts the HTTP server after warming dependencies and records startup audit', async () => {
    const serverInstance = await start({ port: 5050 });

    expect(markHttpServerStarting).toHaveBeenCalledTimes(1);
    expect(warmDatabaseConnections).toHaveBeenCalledWith({ logger });
    expect(bootstrapDatabase).toHaveBeenCalledWith({ logger });
    expect(startBackgroundWorkers).toHaveBeenCalledWith({ logger });
    expect(createServer).toHaveBeenCalledWith({});
    expect(attachSocketServer).toHaveBeenCalledWith(httpServer, expect.objectContaining({ logger }));
    expect(httpServer.listen).toHaveBeenCalledWith(5050, expect.any(Function));
    expect(markHttpServerReady).toHaveBeenCalledWith({ port: 5050 });
    expect(recordRuntimeSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'runtime.http.started', level: 'notice' }),
      { logger },
    );
    expect(syncCriticalDependencies).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ logger }));
    expect(serverInstance).toBe(httpServer);
  });

  it('prevents duplicate startup attempts and reuses the existing server instance', async () => {
    await start({ port: 5050 });
    logger.warn.mockClear();

    const secondStart = await start({ port: 6060 });

    expect(secondStart).toBe(httpServer);
    expect(logger.warn).toHaveBeenCalledWith({ port: 5050 }, 'Gigvora API server already started');
  });

  it('shuts down gracefully and resets the http server reference', async () => {
    await start({ port: 5050 });
    markHttpServerStopped.mockClear();

    await stop({ reason: 'tests' });

    expect(markHttpServerClosing).toHaveBeenCalledWith({ reason: 'tests' });
    expect(shutdownSocketServer).toHaveBeenCalledTimes(1);
    expect(orchestrateHttpShutdown).toHaveBeenCalledWith(
      expect.objectContaining({
        httpServer,
        reason: 'tests',
        logger,
        stopBackgroundWorkers: expect.any(Function),
        shutdownDatabase: expect.any(Function),
        drainDatabaseConnections: expect.any(Function),
        recordRuntimeSecurityEvent,
        markHttpServerStopped,
      }),
    );

    await stop({ reason: 'tests-repeat' });
    expect(markHttpServerStopped).toHaveBeenCalledWith({ reason: 'tests-repeat' });
  });
});
