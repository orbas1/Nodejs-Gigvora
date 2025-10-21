import { Sequelize } from 'sequelize';
import databaseConfig from '../config/database.js';

const GLOBAL_KEY = Symbol.for('gigvora.backend.sequelize');

function buildSequelizeInstance() {
  const { url: databaseUrl, logging, ...sequelizeOptions } = databaseConfig;
  const options = {
    ...sequelizeOptions,
    logging:
      typeof logging === 'function'
        ? (sql, timing) => {
            const trimmed = typeof sql === 'string' ? sql.trim() : sql;
            if (trimmed && !trimmed.toLowerCase().includes('password')) {
              logging(trimmed, timing);
            }
          }
        : logging,
  };

  const instance = databaseUrl ? new Sequelize(databaseUrl, options) : new Sequelize(options);
  const health = {
    connectionAttempts: 0,
    lastConnectedAt: null,
    lastError: null,
  };

  instance.addHook('beforeConnect', async () => {
    health.connectionAttempts += 1;
    health.lastError = null;
  });

  instance.addHook('afterConnect', async () => {
    health.lastConnectedAt = new Date();
  });

  const originalAuthenticate = instance.authenticate.bind(instance);
  instance.authenticate = async (...args) => {
    try {
      const result = await originalAuthenticate(...args);
      health.lastConnectedAt = new Date();
      return result;
    } catch (error) {
      health.lastError = {
        message: error?.message ?? 'Unknown connection error',
        name: error?.name ?? 'Error',
        at: new Date(),
      };
      throw error;
    }
  };

  return { instance, health };
}

if (!globalThis[GLOBAL_KEY]) {
  globalThis[GLOBAL_KEY] = buildSequelizeInstance();
}

let { instance: sequelize, health: sequelizeHealth } = globalThis[GLOBAL_KEY];

export function getSequelizeHealth() {
  return {
    connectionAttempts: sequelizeHealth.connectionAttempts,
    lastConnectedAt: sequelizeHealth.lastConnectedAt,
    lastError: sequelizeHealth.lastError ? { ...sequelizeHealth.lastError } : null,
  };
}

export async function assertDatabaseConnection({ logger } = {}) {
  try {
    await sequelize.authenticate();
    return { status: 'ok', lastConnectedAt: sequelizeHealth.lastConnectedAt };
  } catch (error) {
    logger?.error?.(error, 'Database connection failed');
    return {
      status: 'error',
      lastError: sequelizeHealth.lastError,
    };
  }
}

export function resetSequelizeForTesting() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetSequelizeForTesting can only be used in test environments');
  }

  if (sequelize) {
    return sequelize.close().then(() => {
      globalThis[GLOBAL_KEY] = buildSequelizeInstance();
      ({ instance: sequelize, health: sequelizeHealth } = globalThis[GLOBAL_KEY]);
      return sequelize;
    });
  }

  globalThis[GLOBAL_KEY] = buildSequelizeInstance();
  ({ instance: sequelize, health: sequelizeHealth } = globalThis[GLOBAL_KEY]);
  return sequelize;
}

export default sequelize;
export { sequelize };
