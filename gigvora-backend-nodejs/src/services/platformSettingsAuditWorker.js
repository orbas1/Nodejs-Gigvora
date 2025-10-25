import { Op } from 'sequelize';
import { PlatformSettingsAuditEvent } from '../models/platformSettingsAuditEvent.js';
import {
  listActivePlatformSettingsWatchers,
  markPlatformSettingsWatcherDigest,
} from './platformSettingsWatchersService.js';
import logger from '../utils/logger.js';
import { getRuntimeConfig } from '../config/runtimeConfig.js';

const HOURLY_WINDOW_MS = 60 * 60 * 1000;
const DAILY_WINDOW_MS = 24 * HOURLY_WINDOW_MS;
const WEEKLY_WINDOW_MS = 7 * DAILY_WINDOW_MS;
const DEFAULT_INTERVAL_MS = 6 * HOURLY_WINDOW_MS;

let workerHandle = null;
let workerLogger = logger.child({ component: 'platform-settings-audit-worker' });
let notificationAdapterPromise = null;
let overrideNotifier = null;

let isRunning = false;
let lastRunAt = null;
let lastError = null;
let lastDigestSummary = null;
let lastArchivalResult = null;

function resolveWorkerConfig() {
  const runtime = getRuntimeConfig();
  const workerConfig = runtime?.workers?.platformSettingsAudit ?? {};
  const digestLookbackHours = Math.max(Number(workerConfig.digestLookbackHours ?? 24), 1);
  const retentionDays = Math.max(Number(workerConfig.retentionDays ?? 365), 0);
  const digestIntervalMs = Math.max(Number(workerConfig.digestIntervalMs ?? DEFAULT_INTERVAL_MS), 5 * 60 * 1000);

  return {
    enabled: workerConfig.enabled !== false,
    digestLookbackHours,
    retentionDays,
    digestIntervalMs,
  };
}

function getWindowMs(frequency, config) {
  switch (frequency) {
    case 'hourly':
      return HOURLY_WINDOW_MS;
    case 'weekly':
      return WEEKLY_WINDOW_MS;
    case 'daily':
      return config.digestLookbackHours * HOURLY_WINDOW_MS;
    default:
      return config.digestLookbackHours * HOURLY_WINDOW_MS;
  }
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function shouldSendDigest(watcher, config, now) {
  const lastDigestAt = parseDate(watcher.lastDigestAt);
  if (!lastDigestAt) {
    return true;
  }
  const windowMs = getWindowMs(watcher.digestFrequency, config);
  return now.getTime() - lastDigestAt.getTime() >= windowMs - 1000;
}

function computeSince(watcher, config, now) {
  const windowMs = getWindowMs(watcher.digestFrequency, config);
  const windowStart = new Date(now.getTime() - windowMs);
  const lastDigestAt = parseDate(watcher.lastDigestAt);
  if (lastDigestAt && lastDigestAt > windowStart) {
    return lastDigestAt;
  }
  return windowStart;
}

async function loadNotifier() {
  if (overrideNotifier) {
    return overrideNotifier;
  }
  if (!notificationAdapterPromise) {
    notificationAdapterPromise = import('./notificationService.js')
      .then((module) => {
        if (typeof module.queueNotification === 'function') {
          return module.queueNotification.bind(module);
        }
        if (module.default && typeof module.default.queueNotification === 'function') {
          return module.default.queueNotification.bind(module.default);
        }
        return null;
      })
      .catch((error) => {
        workerLogger.warn({ err: error }, 'Unable to load notification service for platform settings audit digests.');
        return null;
      });
  }
  return notificationAdapterPromise;
}

function summariseEvents(events) {
  const sections = new Set();
  events.forEach((event) => {
    const changed = Array.isArray(event.changedSections)
      ? event.changedSections
      : Array.isArray(event.get?.('changedSections'))
        ? event.get('changedSections')
        : [];
    changed.forEach((section) => sections.add(section));
  });
  return {
    totalEvents: events.length,
    sections: Array.from(sections),
  };
}

async function dispatchDigestNotification(watcher, events, now) {
  if (!watcher.userId) {
    workerLogger.warn({ watcherId: watcher.id }, 'Skipping platform settings digest for watcher without user binding.');
    return false;
  }

  const notifier = await loadNotifier();
  if (typeof notifier !== 'function') {
    workerLogger.warn('Notification service unavailable for platform settings audit digests.');
    return false;
  }

  const summary = summariseEvents(events);
  const latestEvents = events.slice(-10).map((event) => event.toPublicObject());

  await notifier(
    {
      userId: watcher.userId,
      category: 'governance',
      priority: 'normal',
      type: 'platform-settings.audit-digest',
      title: 'Platform settings digest',
      body:
        summary.totalEvents === 1
          ? 'Platform settings were updated once during the recent review window.'
          : `Platform settings were updated ${summary.totalEvents} times during the recent review window.`,
      payload: {
        generatedAt: now.toISOString(),
        digestFrequency: watcher.digestFrequency,
        sections: summary.sections,
        totalEvents: summary.totalEvents,
        events: latestEvents,
      },
    },
    { bypassQuietHours: true },
  );

  return true;
}

async function runCycle() {
  if (isRunning) {
    return;
  }
  isRunning = true;
  lastRunAt = new Date();
  const now = new Date();
  const config = resolveWorkerConfig();

  try {
    if (!config.enabled) {
      isRunning = false;
      return;
    }

    const watchers = await listActivePlatformSettingsWatchers({ forceRefresh: true });
    const digestWatchers = watchers.filter((watcher) => watcher.digestFrequency !== 'immediate');
    const deliveries = [];

    if (digestWatchers.length > 0) {
      const earliestSince = digestWatchers.reduce((earliest, watcher) => {
        const candidate = computeSince(watcher, config, now);
        return candidate < earliest ? candidate : earliest;
      }, now);

      const events = await PlatformSettingsAuditEvent.findAll({
        where: { createdAt: { [Op.gte]: earliestSince } },
        order: [['createdAt', 'ASC']],
      });

      for (const watcher of digestWatchers) {
        if (!shouldSendDigest(watcher, config, now)) {
          continue;
        }
        const since = computeSince(watcher, config, now);
        const relevant = events.filter((event) => {
          const createdAt = event.createdAt ?? event.get?.('createdAt');
          const createdDate = parseDate(createdAt);
          return createdDate && createdDate >= since;
        });
        if (!relevant.length) {
          continue;
        }

        const delivered = await dispatchDigestNotification(watcher, relevant, now);
        if (delivered) {
          await markPlatformSettingsWatcherDigest(watcher.id, now);
          deliveries.push({ watcherId: watcher.id, events: relevant.length });
        }
      }
    }

    if (deliveries.length) {
      lastDigestSummary = { sentAt: now.toISOString(), deliveries };
    }

    if (config.retentionDays > 0) {
      const cutoff = new Date(now.getTime() - config.retentionDays * DAILY_WINDOW_MS);
      const deleted = await PlatformSettingsAuditEvent.destroy({ where: { createdAt: { [Op.lt]: cutoff } } });
      lastArchivalResult = { executedAt: now.toISOString(), deleted };
    }

    lastError = null;
  } catch (error) {
    lastError = { message: error?.message ?? 'Unknown error', stack: error?.stack ?? null, at: new Date().toISOString() };
    workerLogger.error({ err: error }, 'Platform settings audit worker cycle failed');
  } finally {
    isRunning = false;
  }
}

export async function startPlatformSettingsAuditWorker({ logger: providedLogger, intervalMs } = {}) {
  if (workerHandle) {
    return { started: true, reason: 'already-running' };
  }
  const config = resolveWorkerConfig();
  workerLogger = providedLogger ?? logger.child({ component: 'platform-settings-audit-worker' });

  if (!config.enabled) {
    workerLogger.info('Platform settings audit worker disabled by configuration.');
    return { started: false, reason: 'disabled' };
  }

  const effectiveInterval = Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : config.digestIntervalMs;

  await runCycle();
  workerHandle = setInterval(runCycle, effectiveInterval);
  workerHandle.unref?.();
  return { started: true, intervalMs: effectiveInterval };
}

export async function stopPlatformSettingsAuditWorker() {
  if (workerHandle) {
    clearInterval(workerHandle);
    workerHandle = null;
    return { stopped: true };
  }
  return { stopped: false };
}

export function getPlatformSettingsAuditWorkerStatus() {
  return {
    running: isRunning,
    lastRunAt: lastRunAt ? lastRunAt.toISOString() : null,
    lastError,
    lastDigestSummary,
    lastArchivalResult,
  };
}

export function setPlatformSettingsAuditDigestNotifier(adapter) {
  overrideNotifier = typeof adapter === 'function' ? adapter : null;
  if (!adapter) {
    notificationAdapterPromise = null;
  }
}

export async function __runPlatformSettingsAuditWorkerCycle() {
  await runCycle();
}

export default {
  startPlatformSettingsAuditWorker,
  stopPlatformSettingsAuditWorker,
  getPlatformSettingsAuditWorkerStatus,
  setPlatformSettingsAuditDigestNotifier,
  __runPlatformSettingsAuditWorkerCycle,
};
