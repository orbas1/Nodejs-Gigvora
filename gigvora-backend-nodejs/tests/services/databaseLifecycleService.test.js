process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import '../setupTestEnv.js';
import { DatabaseAuditEvent } from '../../src/models/databaseAuditEvent.js';
import sequelize from '../../src/models/sequelizeClient.js';
import {
  warmDatabaseConnections,
  drainDatabaseConnections,
  getDatabasePoolSnapshot,
} from '../../src/services/databaseLifecycleService.js';

const loggerStub = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

describe('databaseLifecycleService', () => {
  beforeEach(async () => {
    await DatabaseAuditEvent.sync({ force: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('warms database connections and records startup audit events', async () => {
    const snapshot = await warmDatabaseConnections({ logger: loggerStub, initiatedBy: 'test-suite' });

    expect(snapshot.vendor).toBeTruthy();
    expect(snapshot.updatedAt).toBeTruthy();

    const events = await DatabaseAuditEvent.findAll({ order: [['id', 'ASC']] });
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('startup');
    expect(events[0].metadata).toHaveProperty('pool');

    const pool = getDatabasePoolSnapshot();
    expect(pool.vendor).toEqual(snapshot.vendor);
    expect(pool.lastEvent).toBe('warm');
  });

  it('drains connections and records shutdown audit events', async () => {
    await warmDatabaseConnections({ logger: loggerStub, initiatedBy: 'test-suite' });
    const before = await DatabaseAuditEvent.findAll({ order: [['id', 'ASC']] });
    expect(before).toHaveLength(1);
    expect(before[0].eventType).toBe('startup');

    const result = await drainDatabaseConnections({ logger: loggerStub, initiatedBy: 'test-suite', reason: 'jest' });

    expect(result.auditEvent?.eventType).toBe('shutdown_initiated');
    expect(result.auditEvent?.reason).toBe('jest');

    expect(result.pool.lastEvent).toBe('shutdown_complete');
  });

  it('records audit events when warming connections fails', async () => {
    const failure = new Error('authenticate-failed');
    jest.spyOn(sequelize, 'authenticate').mockRejectedValueOnce(failure);

    await expect(
      warmDatabaseConnections({ logger: loggerStub, initiatedBy: 'test-suite' }),
    ).rejects.toThrow('authenticate-failed');

    const events = await DatabaseAuditEvent.findAll({ order: [['id', 'ASC']] });
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('connection_failure');
    expect(events[0].reason).toBe('authenticate-failed');
    expect(events[0].metadata).toMatchObject({ code: null });
  });

  it('captures shutdown failures and persists audit context', async () => {
    await warmDatabaseConnections({ logger: loggerStub, initiatedBy: 'test-suite' });

    const closeFailure = new Error('close-failed');
    jest.spyOn(sequelize, 'close').mockRejectedValueOnce(closeFailure);

    await expect(
      drainDatabaseConnections({ logger: loggerStub, initiatedBy: 'test-suite', reason: 'jest' }),
    ).rejects.toThrow('close-failed');

    const events = await DatabaseAuditEvent.findAll({ order: [['id', 'ASC']] });
    expect(events.map((event) => event.eventType)).toEqual([
      'startup',
      'shutdown_initiated',
      'shutdown_failed',
    ]);
    const failureEvent = events.find((event) => event.eventType === 'shutdown_failed');
    expect(failureEvent.reason).toBe('close-failed');
    expect(failureEvent.metadata).toMatchObject({});
  });
});
