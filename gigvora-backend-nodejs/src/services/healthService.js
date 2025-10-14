import { sequelize } from '../models/index.js';
import {
  buildHealthReport,
  getHealthState,
  markDependencyHealthy,
  markDependencyUnavailable,
} from '../lifecycle/runtimeHealth.js';

const DATABASE_CHECK_INTERVAL_MS = 30_000;

let lastDatabaseCheckAt = 0;
let cachedDatabaseStatus = { status: 'unknown', vendor: null, latencyMs: null, error: null };

function now() {
  return Date.now();
}

function getDialect() {
  try {
    return sequelize.getDialect();
  } catch (error) {
    return 'unknown';
  }
}

export async function verifyDatabaseConnectivity() {
  const timestamp = now();
  const age = timestamp - lastDatabaseCheckAt;

  if (cachedDatabaseStatus.status !== 'unknown' && age < DATABASE_CHECK_INTERVAL_MS) {
    return cachedDatabaseStatus;
  }

  const vendor = getDialect();
  const started = process.hrtime.bigint();

  try {
    await sequelize.authenticate({ logging: false });
    const finished = process.hrtime.bigint();
    const latencyMs = Number(finished - started) / 1_000_000;
    cachedDatabaseStatus = {
      status: 'ok',
      vendor,
      latencyMs: Number(latencyMs.toFixed(2)),
      checkedAt: new Date().toISOString(),
      error: null,
    };
    markDependencyHealthy('database', {
      vendor,
      latencyMs: cachedDatabaseStatus.latencyMs,
    });
  } catch (error) {
    cachedDatabaseStatus = {
      status: 'error',
      vendor,
      latencyMs: null,
      checkedAt: new Date().toISOString(),
      error: {
        message: error.message || 'Database connectivity failure',
        code: error.code ?? null,
      },
    };
    markDependencyUnavailable('database', error, { vendor });
  }

  lastDatabaseCheckAt = timestamp;
  return cachedDatabaseStatus;
}

export async function getReadinessReport() {
  await verifyDatabaseConnectivity();
  const report = buildHealthReport();
  report.checks = {
    database: cachedDatabaseStatus,
  };
  report.httpStatus = readinessStatusToHttp(report.status);
  return report;
}

export function readinessStatusToHttp(status) {
  if (status === 'ok') {
    return 200;
  }
  if (status === 'starting') {
    return 503;
  }
  return 503;
}

export function getLivenessReport() {
  const state = getHealthState();
  const status = state.http.status === 'closing' || state.http.status === 'stopped' ? 'degraded' : 'ok';
  return {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    http: state.http,
  };
}
