import { describe, expect, it, jest } from '@jest/globals';
import { orchestrateHttpShutdown } from '../../src/lifecycle/httpShutdown.js';

function createLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(function child() {
      return this;
    }),
  };
}

describe('orchestrateHttpShutdown', () => {
  it('drains connections and records shutdown audit after stopping workers and HTTP server', async () => {
    const logger = createLogger();
    const close = jest.fn((callback) => callback());
    const httpServer = { close };
    const stopBackgroundWorkers = jest.fn().mockResolvedValue();
    const shutdownDatabase = jest.fn().mockResolvedValue();
    const drainDatabaseConnections = jest.fn().mockResolvedValue();
    const recordRuntimeSecurityEvent = jest.fn().mockResolvedValue();
    const markHttpServerStopped = jest.fn();
    const onHttpServerClosed = jest.fn();

    await orchestrateHttpShutdown({
      httpServer,
      reason: 'tests',
      logger,
      stopBackgroundWorkers,
      shutdownDatabase,
      drainDatabaseConnections,
      recordRuntimeSecurityEvent,
      markHttpServerStopped,
      onHttpServerClosed,
    });

    expect(stopBackgroundWorkers).toHaveBeenCalledWith({ logger });
    expect(close).toHaveBeenCalledTimes(1);
    expect(markHttpServerStopped).toHaveBeenCalledWith({ reason: 'tests' });
    expect(onHttpServerClosed).toHaveBeenCalledTimes(1);
    expect(shutdownDatabase).toHaveBeenCalledWith({ reason: 'tests', logger });
    expect(drainDatabaseConnections).toHaveBeenCalledWith({ logger, reason: 'tests' });
    expect(recordRuntimeSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'runtime.http.stopped', level: 'info' }),
      { logger },
    );
  });

  it('logs and propagates drain failures so orchestration callers can react', async () => {
    const logger = createLogger();
    const httpServer = { close: jest.fn((callback) => callback()) };
    const drainError = new Error('drain failed');

    await expect(
      orchestrateHttpShutdown({
        httpServer,
        reason: 'ops-window',
        logger,
        stopBackgroundWorkers: jest.fn().mockResolvedValue(),
        shutdownDatabase: jest.fn().mockResolvedValue(),
        drainDatabaseConnections: jest.fn().mockRejectedValue(drainError),
        recordRuntimeSecurityEvent: jest.fn().mockResolvedValue(),
        markHttpServerStopped: jest.fn(),
        onHttpServerClosed: jest.fn(),
      }),
    ).rejects.toThrow(drainError);

    expect(logger.error).toHaveBeenCalledWith(
      { err: drainError, reason: 'ops-window' },
      'Failed to drain database connections during shutdown sequence',
    );
  });

  it('continues draining when database shutdown throws and marks shutdown as warning', async () => {
    const logger = createLogger();
    const httpServer = { close: jest.fn((callback) => callback()) };
    const shutdownError = new Error('database stopped responding');
    const drainDatabaseConnections = jest.fn().mockResolvedValue();
    const recordRuntimeSecurityEvent = jest.fn().mockResolvedValue();

    await expect(
      orchestrateHttpShutdown({
        httpServer,
        reason: 'db-failure',
        logger,
        stopBackgroundWorkers: jest.fn().mockResolvedValue(),
        shutdownDatabase: jest.fn().mockRejectedValue(shutdownError),
        drainDatabaseConnections,
        recordRuntimeSecurityEvent,
        markHttpServerStopped: jest.fn(),
        onHttpServerClosed: jest.fn(),
      }),
    ).rejects.toThrow(shutdownError);

    expect(drainDatabaseConnections).toHaveBeenCalled();
    expect(recordRuntimeSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'warn' }),
      { logger },
    );
  });

  it('handles missing http server by marking the state and skipping orchestration', async () => {
    const markHttpServerStopped = jest.fn();

    await orchestrateHttpShutdown({
      httpServer: null,
      reason: 'no-server',
      logger: createLogger(),
      stopBackgroundWorkers: jest.fn(),
      shutdownDatabase: jest.fn(),
      drainDatabaseConnections: jest.fn(),
      recordRuntimeSecurityEvent: jest.fn(),
      markHttpServerStopped,
    });

    expect(markHttpServerStopped).toHaveBeenCalledWith({ reason: 'no-server' });
  });
});
