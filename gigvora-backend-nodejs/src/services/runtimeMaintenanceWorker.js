import EventEmitter from 'node:events';

import { getRuntimeConfig, onRuntimeConfigChange } from '../config/runtimeConfig.js';
import logger from '../utils/logger.js';
import { getVisibleAnnouncements } from './runtimeMaintenanceService.js';
import { recordRuntimeSecurityEvent } from './securityAuditService.js';
import { getInternalRealtimeHub } from '../realtime/internalHub.js';

const DEFAULT_INTERVAL_MS = 5 * 60_000;

let timer = null;
let lastRunAt = null;
let lastError = null;
let lastSnapshot = null;
let currentInterval = DEFAULT_INTERVAL_MS;
let maintenanceLogger = logger.child({ component: 'runtime-maintenance-worker' });

const maintenanceBus = new EventEmitter();
maintenanceBus.setMaxListeners(30);

let runtimeConfig = getRuntimeConfig();

function resolveInterval(config = runtimeConfig) {
  const configured = config?.workers?.runtimeMaintenance?.intervalMs;
  if (Number.isFinite(configured) && configured > 5_000) {
    return configured;
  }
  return DEFAULT_INTERVAL_MS;
}

function isWorkerEnabled(config = runtimeConfig) {
  if (config?.workers?.autoStart === false) {
    return false;
  }
  if (config?.workers?.runtimeMaintenance?.enabled === false) {
    return false;
  }
  return true;
}

async function broadcastSnapshot(snapshot) {
  try {
    await recordRuntimeSecurityEvent(
      {
        eventType: 'runtime.maintenance.snapshot_refreshed',
        level: 'info',
        message: 'Maintenance snapshot refreshed for internal orchestration.',
        metadata: { active: snapshot.announcements?.length ?? 0 },
      },
      { logger: maintenanceLogger },
    );
  } catch (error) {
    maintenanceLogger.warn({ err: error }, 'Failed to record maintenance snapshot refresh audit');
  }

  const hub = getInternalRealtimeHub();
  hub.emit('maintenance:update', snapshot);
  maintenanceBus.emit('snapshot', snapshot);
}

async function runMaintenanceSweep() {
  try {
    const snapshot = await getVisibleAnnouncements({
      audience: 'operations',
      channel: 'api',
      includeResolved: true,
      windowMinutes: 6 * 60,
      limit: 100,
    });
    lastSnapshot = snapshot;
    lastRunAt = new Date().toISOString();
    lastError = null;
    maintenanceLogger.debug({ active: snapshot.announcements?.length ?? 0 }, 'Runtime maintenance snapshot refreshed');
    await broadcastSnapshot(snapshot);
  } catch (error) {
    lastError = {
      message: error.message,
      name: error.name,
    };
    maintenanceLogger.warn({ err: error }, 'Failed to refresh runtime maintenance snapshot');
  }
}

function scheduleNextRun() {
  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(() => {
    runMaintenanceSweep().catch((error) => {
      maintenanceLogger.error({ err: error }, 'Unexpected error during runtime maintenance sweep');
    });
  }, currentInterval);
  timer.unref?.();
}

onRuntimeConfigChange(({ config }) => {
  runtimeConfig = config;
  currentInterval = resolveInterval(config);
  maintenanceLogger = logger.child({
    component: 'runtime-maintenance-worker',
    intervalMs: currentInterval,
  });
  if (timer) {
    scheduleNextRun();
  }
});

export async function startRuntimeMaintenanceWorker({ logger: providedLogger } = {}) {
  maintenanceLogger = (providedLogger ?? logger).child({ component: 'runtime-maintenance-worker' });
  runtimeConfig = getRuntimeConfig();

  if (!isWorkerEnabled(runtimeConfig)) {
    maintenanceLogger.info('Runtime maintenance worker disabled by configuration');
    stopRuntimeMaintenanceWorker();
    return { started: false, reason: 'disabled' };
  }

  currentInterval = resolveInterval(runtimeConfig);
  await runMaintenanceSweep();
  scheduleNextRun();
  return { started: true, intervalMs: currentInterval };
}

export async function stopRuntimeMaintenanceWorker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function getRuntimeMaintenanceWorkerStatus() {
  return {
    running: Boolean(timer),
    intervalMs: currentInterval,
    lastRunAt,
    lastError,
    snapshotSize: lastSnapshot?.announcements?.length ?? 0,
  };
}

export function getRuntimeMaintenanceBus() {
  return maintenanceBus;
}

export default {
  startRuntimeMaintenanceWorker,
  stopRuntimeMaintenanceWorker,
  getRuntimeMaintenanceWorkerStatus,
  getRuntimeMaintenanceBus,
};
