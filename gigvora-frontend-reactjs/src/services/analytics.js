import { apiClient } from './apiClient.js';

const ANALYTICS_QUEUE_KEY = 'gigvora:web:analytics:queue';
const storage = (typeof window !== 'undefined' && window.localStorage) || null;

function loadQueue() {
  if (!storage) return [];
  try {
    const raw = storage.getItem(ANALYTICS_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse analytics queue', error);
  }
  return [];
}

function persistQueue(queue) {
  if (!storage) return;
  try {
    if (!queue.length) {
      storage.removeItem(ANALYTICS_QUEUE_KEY);
      return;
    }
    storage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('Failed to persist analytics queue', error);
  }
}

async function sendEvent(event) {
  try {
    if (navigator?.sendBeacon) {
      const url = `${apiClient.API_BASE_URL}/analytics/events`;
      const body = JSON.stringify(event);
      const succeeded = navigator.sendBeacon(url, body);
      if (succeeded) {
        return;
      }
    }
  } catch (error) {
    console.debug('sendBeacon failed, falling back to fetch', error);
  }

  await apiClient.post('/analytics/events', event);
}

class AnalyticsClient {
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.flush().catch((error) => console.warn('Failed to flush analytics queue', error));
      });
    }
  }

  async track(eventName, context = {}, metadata = {}) {
    if (!eventName) {
      return;
    }

    const payload = {
      eventName,
      actorType: metadata.actorType || 'anonymous',
      userId: metadata.userId ?? null,
      entityType: metadata.entityType ?? null,
      entityId: metadata.entityId ?? null,
      source: metadata.source || 'web',
      context: context ?? {},
      occurredAt: new Date().toISOString(),
    };

    try {
      await sendEvent(payload);
      await this.flush();
    } catch (error) {
      const queue = loadQueue();
      queue.push(payload);
      persistQueue(queue);
      console.warn('Buffered analytics event due to network failure', error);
    }
  }

  async flush() {
    const queue = loadQueue();
    if (!queue.length) {
      return;
    }

    while (queue.length) {
      const event = queue[0];
      try {
        await apiClient.post('/analytics/events', event);
        queue.shift();
      } catch (error) {
        persistQueue(queue);
        throw error;
      }
    }

    persistQueue(queue);
  }
}

export const analytics = new AnalyticsClient();

export default analytics;
