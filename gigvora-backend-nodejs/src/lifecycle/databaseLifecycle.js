import { sequelize } from '../models/index.js';
import logger from '../utils/logger.js';
import {
  markDependencyDegraded,
  markDependencyHealthy,
  markDependencyUnavailable,
} from './runtimeHealth.js';
import { recordRuntimeSecurityEvent } from '../services/securityAuditService.js';
import { setDatabaseStatus } from '../services/healthService.js';

function resolveLogger(candidate) {
  if (!candidate) {
    return logger.child({ component: 'database-lifecycle' });
  }
  return candidate.child ? candidate.child({ component: 'database-lifecycle' }) : candidate;
}

function capturePoolSnapshot() {
  const pool = sequelize?.connectionManager?.pool;
  if (!pool) {
    return null;
  }
  return {
    size: pool.size ?? null,
    available: pool.available ?? null,
    borrowed: pool.borrowed ?? pool.using ?? null,
    pending: pool.pending ?? null,
  };
}

let initialised = false;

export async function bootstrapDatabase({ logger: providedLogger } = {}) {
  const log = resolveLogger(providedLogger);
  const started = process.hrtime.bigint();
  try {
    await sequelize.authenticate({ logging: false });
    const finished = process.hrtime.bigint();
    const latencyMs = Number(finished - started) / 1_000_000;
    markDependencyHealthy('database', {
      vendor: sequelize.getDialect(),
      latencyMs: Number(latencyMs.toFixed(2)),
    });
    setDatabaseStatus({
      status: 'ok',
      vendor: sequelize.getDialect(),
      latencyMs: Number(latencyMs.toFixed(2)),
      error: null,
    });
    initialised = true;
    try {
      await recordRuntimeSecurityEvent(
        {
          eventType: 'database.connection.established',
          level: 'notice',
          message: 'Primary database connection verified and pooled connections initialised.',
          metadata: {
            vendor: sequelize.getDialect(),
            latencyMs: Number(latencyMs.toFixed(2)),
            pool: capturePoolSnapshot(),
          },
        },
        { logger: log },
      );
    } catch (auditError) {
      log.warn({ err: auditError }, 'Failed to record database bootstrap audit event');
    }
  } catch (error) {
    markDependencyUnavailable('database', error, { vendor: sequelize.getDialect() });
    log.error({ err: error }, 'Failed to establish primary database connection');
    throw error;
  }
}

export async function shutdownDatabase({ reason = 'shutdown', logger: providedLogger } = {}) {
  if (!initialised) {
    return null;
  }

  const log = resolveLogger(providedLogger);
  const poolBefore = capturePoolSnapshot();
  const started = process.hrtime.bigint();
  markDependencyDegraded('database', new Error('Database shutdown in progress'), {
    reason,
    pool: poolBefore,
  });

  try {
    await sequelize.close();
    initialised = false;
    const finished = process.hrtime.bigint();
    const durationMs = Number(finished - started) / 1_000_000;
    markDependencyUnavailable('database', new Error('Database connections closed'), {
      reason,
      durationMs: Number(durationMs.toFixed(2)),
    });
    setDatabaseStatus({
      status: 'error',
      vendor: sequelize.getDialect(),
      latencyMs: null,
      error: { message: 'Database shutdown complete' },
    });
    try {
      await recordRuntimeSecurityEvent(
        {
          eventType: 'database.connection.closed',
          level: 'info',
          message: 'Database connection pool drained during runtime shutdown.',
          metadata: {
            reason,
            durationMs: Number(durationMs.toFixed(2)),
            poolBefore,
          },
        },
        { logger: log },
      );
    } catch (auditError) {
      log.warn({ err: auditError }, 'Failed to record database shutdown audit event');
    }
    return { durationMs: Number(durationMs.toFixed(2)) };
  } catch (error) {
    log.error({ err: error }, 'Failed to close database connections gracefully');
    try {
      await recordRuntimeSecurityEvent(
        {
          eventType: 'database.connection.shutdown_failed',
          level: 'error',
          message: 'Database pool did not close cleanly during shutdown.',
          metadata: {
            reason,
            poolBefore,
            error: error.message,
          },
        },
        { logger: log },
      );
    } catch (auditError) {
      log.warn({ err: auditError }, 'Failed to record database shutdown failure audit event');
    }
    throw error;
  }
}

export default {
  bootstrapDatabase,
  shutdownDatabase,
};
