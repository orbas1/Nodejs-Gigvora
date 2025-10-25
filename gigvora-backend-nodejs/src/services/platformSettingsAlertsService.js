import logger from '../utils/logger.js';
import {
  listActivePlatformSettingsWatcherIds,
  listActivePlatformSettingsWatchers,
} from './platformSettingsWatchersService.js';

let notificationServicePromise = null;
let overrideNotifier = null;

async function loadNotificationService() {
  if (!notificationServicePromise) {
    notificationServicePromise = import('./notificationService.js').catch((error) => {
      logger.warn({ err: error }, 'Unable to load notification service for platform settings alerts');
      return null;
    });
  }
  return notificationServicePromise;
}

function resolveNotifier(serviceModule) {
  if (!serviceModule) {
    return null;
  }
  if (typeof serviceModule.queueNotification === 'function') {
    return serviceModule.queueNotification.bind(serviceModule);
  }
  if (serviceModule.default && typeof serviceModule.default.queueNotification === 'function') {
    return serviceModule.default.queueNotification.bind(serviceModule.default);
  }
  return null;
}

export function setPlatformSettingsNotificationAdapter(adapter) {
  overrideNotifier = typeof adapter === 'function' ? adapter : null;
}

export async function getPlatformSettingsAuditWatcherIds() {
  return listActivePlatformSettingsWatcherIds();
}

export async function dispatchPlatformSettingsAuditNotification(event, snapshot, { actor, logger: providedLogger } = {}) {
  if (!event) {
    return { delivered: 0, watchers: [] };
  }

  const watchers = await listActivePlatformSettingsWatchers();
  const immediateWatchers = watchers.filter(
    (watcher) => watcher.enabled && watcher.deliveryChannel === 'notification' && watcher.digestFrequency === 'immediate',
  );

  if (immediateWatchers.length === 0) {
    return { delivered: 0, watchers: [] };
  }

  const log = providedLogger ?? logger.child({ component: 'platform-settings-alerts' });

  let notifier = overrideNotifier;
  if (!notifier) {
    const serviceModule = await loadNotificationService();
    notifier = resolveNotifier(serviceModule);
  }

  if (typeof notifier !== 'function') {
    log.warn('Notification service unavailable for platform settings audit alerts.');
    return { delivered: 0, watchers };
  }

  const payloadBase = {
    summary: event.summary ?? 'Updated platform settings',
    changedSections: Array.isArray(event.changedSections) ? event.changedSections : [],
    totalChanges: Array.isArray(event.changes) ? event.changes.length : undefined,
    eventId: event.id ?? null,
    updatedAt: event.createdAt ?? snapshot?.metadata?.updatedAt ?? new Date().toISOString(),
  };

  const results = await Promise.allSettled(
    immediateWatchers.map((watcher) =>
      notifier(
        {
          userId: watcher.userId,
          category: 'governance',
          priority: 'high',
          type: 'platform-settings.audit-event',
          title: 'Platform settings updated',
          body: payloadBase.summary,
          payload: {
            ...payloadBase,
            actor: actor ?? null,
          },
        },
        { bypassQuietHours: true },
      ),
    ),
  );

  let delivered = 0;
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      delivered += 1;
    } else {
      log.error(
        { err: result.reason, watcherId: immediateWatchers[index]?.id, userId: immediateWatchers[index]?.userId },
        'Failed to dispatch platform settings audit notification.',
      );
    }
  });

  return { delivered, watchers: immediateWatchers.map((watcher) => watcher.userId) };
}

export default {
  dispatchPlatformSettingsAuditNotification,
  getPlatformSettingsAuditWatcherIds,
  setPlatformSettingsNotificationAdapter,
};
