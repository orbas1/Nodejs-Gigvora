import { getHealthState } from '../lifecycle/runtimeHealth.js';
import { ServiceUnavailableError } from '../utils/errors.js';
import { readinessStatusToHttp } from './healthStatus.js';
import {
  buildReadinessSnapshot,
  setDatabaseStatus,
  verifyDatabaseConnectivity,
  getCachedDatabaseStatus,
} from './runtimeReadinessService.js';

export { readinessStatusToHttp } from './healthStatus.js';

export { setDatabaseStatus, verifyDatabaseConnectivity };

export async function getReadinessReport(options = {}) {
  const { readiness, httpStatus } = await buildReadinessSnapshot(options);
  const enrichedReadiness = { ...readiness, httpStatus };

  if (httpStatus !== 200) {
    const error = new ServiceUnavailableError('Gigvora platform is not ready', {
      ...enrichedReadiness,
    });
    error.status = httpStatus;
    error.statusCode = httpStatus;
    error.expose = true;
    throw error;
  }

  return enrichedReadiness;
}

export function getLivenessReport() {
  const state = getHealthState();
  const status = state.http.status === 'closing' || state.http.status === 'stopped' ? 'degraded' : 'ok';
  return {
    status,
    httpStatus: readinessStatusToHttp(status === 'ok' ? 'ok' : 'degraded'),
    updatedAt: state.http.updatedAt,
    timestamp: state.http.updatedAt,
    database: getCachedDatabaseStatus(),
    workers: state.workers,
    dependencies: state.dependencies,
  };
}

export default {
  getReadinessReport,
  getLivenessReport,
  setDatabaseStatus,
  verifyDatabaseConnectivity,
};
