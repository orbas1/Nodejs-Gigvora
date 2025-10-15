import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const runtimeHealthModuleUrl = new URL('../../src/lifecycle/runtimeHealth.js', import.meta.url);
const auditServiceModuleUrl = new URL('../../src/services/securityAuditService.js', import.meta.url);
const healthServiceModuleUrl = new URL('../../src/services/healthService.js', import.meta.url);
const loggerModuleUrl = new URL('../../src/utils/logger.js', import.meta.url);

async function setupLifecycleTest({ poolSnapshot } = {}) {
  jest.resetModules();

  const authenticate = jest.fn().mockResolvedValue();
  const close = jest.fn().mockResolvedValue();
  const markHealthy = jest.fn();
  const markUnavailable = jest.fn();
  const markDegraded = jest.fn();
  const recordEvent = jest.fn().mockResolvedValue({});
  const setStatus = jest.fn();
  const childLogger = { info: jest.fn(), error: jest.fn() };
  const logger = { child: () => childLogger };

  const sequelize = {
    authenticate,
    close,
    getDialect: () => 'postgres',
    connectionManager: {
      pool:
        poolSnapshot ??
        {
          size: 12,
          available: 8,
          borrowed: 4,
          pending: 0,
        },
    },
  };

  jest.unstable_mockModule(loggerModuleUrl.pathname, () => ({
    default: {
      child: () => ({ info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() }),
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    },
  }));
  jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ sequelize }));
  jest.unstable_mockModule(runtimeHealthModuleUrl.pathname, () => ({
    markDependencyHealthy: markHealthy,
    markDependencyUnavailable: markUnavailable,
    markDependencyDegraded: markDegraded,
  }));
  jest.unstable_mockModule(auditServiceModuleUrl.pathname, () => ({
    recordRuntimeSecurityEvent: recordEvent,
  }));
  jest.unstable_mockModule(healthServiceModuleUrl.pathname, () => ({
    setDatabaseStatus: setStatus,
  }));

  const lifecycleModule = await import('../../src/lifecycle/databaseLifecycle.js');

  return {
    sequelize,
    logger,
    childLogger,
    mocks: {
      authenticate,
      close,
      markHealthy,
      markUnavailable,
      markDegraded,
      recordEvent,
      setStatus,
    },
    ...lifecycleModule,
  };
}

describe('databaseLifecycle', () => {
  it('marks the database healthy after successful bootstrap', async () => {
    const { bootstrapDatabase, mocks } = await setupLifecycleTest();

    await bootstrapDatabase();

    expect(mocks.authenticate).toHaveBeenCalledWith({ logging: false });
    expect(mocks.markHealthy).toHaveBeenCalledWith(
      'database',
      expect.objectContaining({ vendor: 'postgres', latencyMs: expect.any(Number) }),
    );
    expect(mocks.setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ok', vendor: 'postgres', error: null }),
    );
    const auditCall = mocks.recordEvent.mock.calls.find(
      ([event]) => event.eventType === 'database.connection.established',
    );
    expect(auditCall).toBeDefined();
    expect(auditCall[0].metadata).toMatchObject({
      vendor: 'postgres',
      pool: expect.objectContaining({ size: 12, available: 8, borrowed: 4 }),
    });
  });

  it('drains pools and records shutdown metadata', async () => {
    const { bootstrapDatabase, shutdownDatabase, logger, mocks } = await setupLifecycleTest();

    await bootstrapDatabase();
    mocks.markHealthy.mockClear();
    mocks.setStatus.mockClear();

    const result = await shutdownDatabase({ reason: 'deploy', logger });

    expect(result).toEqual({ durationMs: expect.any(Number) });
    expect(mocks.markDegraded).toHaveBeenCalledWith(
      'database',
      expect.any(Error),
      expect.objectContaining({ reason: 'deploy', pool: expect.objectContaining({ size: 12 }) }),
    );
    expect(mocks.close).toHaveBeenCalled();
    const unavailableCall = mocks.markUnavailable.mock.calls.find(([name]) => name === 'database');
    expect(unavailableCall).toBeDefined();
    expect(unavailableCall[2]).toMatchObject({ reason: 'deploy', durationMs: expect.any(Number) });
    const finalStatus = mocks.setStatus.mock.calls.at(-1)[0];
    expect(finalStatus).toMatchObject({
      status: 'error',
      vendor: 'postgres',
      error: { message: 'Database shutdown complete' },
    });
    const auditCall = mocks.recordEvent.mock.calls.find(
      ([event]) => event.eventType === 'database.connection.closed',
    );
    expect(auditCall).toBeDefined();
    expect(auditCall[0].metadata).toMatchObject({
      reason: 'deploy',
      poolBefore: expect.objectContaining({ size: 12, available: 8, borrowed: 4 }),
    });
  });

  it('no-ops when shutdown is requested before bootstrap', async () => {
    const { shutdownDatabase, mocks } = await setupLifecycleTest();

    const result = await shutdownDatabase();

    expect(result).toBeNull();
    expect(mocks.close).not.toHaveBeenCalled();
    expect(mocks.markDegraded).not.toHaveBeenCalled();
    expect(mocks.markUnavailable).not.toHaveBeenCalled();
  });

  it('does not emit duplicate shutdown events on repeated invocations', async () => {
    const { bootstrapDatabase, shutdownDatabase, logger, mocks } = await setupLifecycleTest();

    await bootstrapDatabase();
    await shutdownDatabase({ reason: 'deploy', logger });
    mocks.recordEvent.mockClear();
    mocks.markUnavailable.mockClear();

    const result = await shutdownDatabase({ reason: 'deploy', logger });

    expect(result).toBeNull();
    expect(mocks.recordEvent).not.toHaveBeenCalled();
    expect(mocks.markUnavailable).not.toHaveBeenCalled();
  });
});
