process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { beforeEach, describe, expect, it } from '@jest/globals';
import '../setupTestEnv.js';
import { DatabaseAuditEvent } from '../../src/models/databaseAuditEvent.js';
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
});
