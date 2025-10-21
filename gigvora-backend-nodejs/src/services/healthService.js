import { sequelize } from '../models/index.js';
import {
  buildHealthReport,
  getHealthState,
  markDependencyHealthy,
  markDependencyUnavailable,
} from '../lifecycle/runtimeHealth.js';
import { getDatabasePoolSnapshot } from './databaseLifecycleService.js';
import { collectWorkerTelemetry } from '../lifecycle/workerManager.js';
import { ServiceUnavailableError } from '../utils/errors.js';
import { getRuntimeConfig } from '../config/runtimeConfig.js';
import { readinessStatusToHttp } from './healthStatus.js';

export { readinessStatusToHttp } from './healthStatus.js';

const DATABASE_CHECK_INTERVAL_MS = 30_000;

let lastDatabaseCheckAt = 0;
let cachedDatabaseStatus = {
  status: 'unknown',
  vendor: null,
  latencyMs: null,
  error: null,
  pool: null,
};

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

export function setDatabaseStatus({ status, vendor, latencyMs = null, error = null, pool = null } = {}) {
  cachedDatabaseStatus = {
    status: status ?? 'unknown',
    vendor: vendor ?? getDialect(),
    latencyMs: latencyMs ?? null,
    checkedAt: new Date().toISOString(),
    error,
    pool,
  };
  lastDatabaseCheckAt = now();
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
    const pool = getDatabasePoolSnapshot();
    setDatabaseStatus({
      status: 'ok',
      vendor,
      latencyMs: Number(latencyMs.toFixed(2)),
      error: null,
      pool,
    });
    markDependencyHealthy('database', {
      vendor,
      latencyMs: cachedDatabaseStatus.latencyMs,
      pool,
    });
  } catch (error) {
    const pool = getDatabasePoolSnapshot();
    setDatabaseStatus({
      status: 'error',
      vendor,
      error: {
        message: error.message || 'Database connectivity failure',
        code: error.code ?? null,
      },
      pool,
    });
    markDependencyUnavailable('database', error, { vendor, pool });
  }

  return cachedDatabaseStatus;
}

function paginate(entries, page, perPage) {
  const safePerPage = perPage > 0 ? perPage : entries.length || 1;
  const safePage = page > 0 ? page : 1;
  const offset = (safePage - 1) * safePerPage;
  return {
    slice: entries.slice(offset, offset + safePerPage),
    total: entries.length,
    page: safePage,
    perPage: safePerPage,
  };
}

function countStatuses(entries) {
  return entries.reduce(
    (acc, entry) => {
      const status = entry.status ?? 'unknown';
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    { ok: 0, degraded: 0, error: 0, disabled: 0, unknown: 0 },
  );
}

export async function getReadinessReport({
  page = 1,
  perPage = 10,
  dependency = null,
  forceRefresh = false,
} = {}) {
  await verifyDatabaseConnectivity();
  const baseReport = buildHealthReport();
  const state = getHealthState();

  const dependencyEntries = Object.entries(state.dependencies).map(([name, info]) => ({
    name,
    status: info.status,
    updatedAt: info.updatedAt,
    error: info.error ?? null,
    metadata: { ...info },
  }));

  const dependencyFilter = dependency ? dependency.trim() : null;
  const filteredDependencies = dependencyFilter
    ? dependencyEntries.filter((entry) => entry.name === dependencyFilter)
    : dependencyEntries;

  const pagination = paginate(filteredDependencies, page, perPage);

  const workerTelemetrySnapshots = await collectWorkerTelemetry({ forceRefresh });
  const workerEntries = Object.entries(state.workers).map(([name, info]) => {
    const telemetry = workerTelemetrySnapshots.find((snapshot) => snapshot.name === name);
    return {
      name,
      status: info.status,
      updatedAt: info.updatedAt,
      error: info.error ?? null,
      metadata: { ...(info ?? {}), ...(telemetry?.metadata ?? {}) },
      telemetry: telemetry?.metrics ?? null,
      telemetryUpdatedAt: telemetry?.lastSampleAt ?? null,
    };
  });

  const runtimeConfig = getRuntimeConfig();

  const readiness = {
    status: baseReport.status,
    timestamp: baseReport.timestamp,
    uptimeSeconds: baseReport.uptimeSeconds,
    http: baseReport.http,
    database: cachedDatabaseStatus,
    dependencies: {
      page: pagination.page,
      perPage: pagination.perPage,
      total: pagination.total,
      counts: countStatuses(dependencyEntries),
      nodes: pagination.slice,
    },
    workers: {
      total: workerEntries.length,
      counts: countStatuses(workerEntries),
      nodes: workerEntries,
    },
    service: {
      name: runtimeConfig?.serviceName ?? 'gigvora-backend',
      environment: runtimeConfig?.env ?? process.env.NODE_ENV ?? 'development',
    },
  };

  const httpStatus = readinessStatusToHttp(baseReport.status);
  readiness.httpStatus = httpStatus;

  if (httpStatus !== 200) {
    const error = new ServiceUnavailableError('Gigvora platform is not ready', readiness);
    error.status = httpStatus;
    error.statusCode = httpStatus;
    error.expose = true;
    throw error;
  }

  return readiness;
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

const healthService = {
  getReadinessReport,
  getLivenessReport,
  readinessStatusToHttp,
  verifyDatabaseConnectivity,
  setDatabaseStatus,
};

export default healthService;
