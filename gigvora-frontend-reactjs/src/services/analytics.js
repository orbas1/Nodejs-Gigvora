import { apiClient } from './apiClient.js';

const ANALYTICS_QUEUE_KEY = 'gigvora:web:analytics:queue';
const storage = (typeof window !== 'undefined' && window.localStorage) || null;
const MAX_QUEUE_SIZE = 500;
const FLUSH_RETRY_INTERVAL = 1000 * 10; // 10 seconds

function serialiseContextValue(value) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    const serialisedItems = value
      .map((item) => serialiseContextValue(item))
      .filter((item) => item !== undefined && item !== null);

    return serialisedItems.length ? serialisedItems : null;
  }

  if (typeof value === 'object') {
    const serialisedObject = Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key != null && key !== '')
        .map(([key, item]) => [key, serialiseContextValue(item)])
        .filter(([, item]) => item !== undefined && item !== null),
    );

    return Object.keys(serialisedObject).length ? serialisedObject : null;
  }

  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return value;
  }

  return undefined;
}

function normaliseContext(context) {
  if (!context || typeof context !== 'object') {
    return {};
  }

  const normalisedEntries = Object.entries(context)
    .filter(([key]) => key != null && key !== '')
    .map(([key, value]) => {
      const serialised = serialiseContextValue(value);
      if (serialised === undefined) {
        return null;
      }
      return [key, serialised];
    })
    .filter(Boolean)
    .filter(([, value]) => value !== undefined && value !== null);

  return normalisedEntries.length ? Object.fromEntries(normalisedEntries) : {};
}

function sanitizeEventPayload(event) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const {
    eventName,
    actorType = 'anonymous',
    userId = null,
    entityType = null,
    entityId = null,
    source = 'web',
    context = {},
    occurredAt = new Date().toISOString(),
  } = event;

  if (!eventName || typeof eventName !== 'string') {
    return null;
  }

  return {
    eventName: eventName.trim(),
    actorType,
    userId,
    entityType,
    entityId,
    source,
    context: context && typeof context === 'object' ? { ...context } : {},
    occurredAt: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
  };
}

function loadQueue() {
  if (!storage) return [];
  try {
    const raw = storage.getItem(ANALYTICS_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => sanitizeEventPayload(item))
        .filter(Boolean);
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
    const serialisableQueue = queue
      .map((item) => sanitizeEventPayload(item))
      .filter(Boolean);

    if (!serialisableQueue.length) {
      storage.removeItem(ANALYTICS_QUEUE_KEY);
      return;
    }

    storage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(serialisableQueue));
  } catch (error) {
    console.warn('Failed to persist analytics queue', error);
  }
}

async function sendEvent(event) {
  try {
    if (navigator?.sendBeacon) {
      const url = `${apiClient.API_BASE_URL}/analytics/events`;
      const body = new Blob([JSON.stringify(event)], { type: 'application/json' });
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
    this._flushTimer = null;
    this._isFlushing = false;
    this._globalContext = {};
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.scheduleFlush(0);
      });
      document?.addEventListener?.('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.scheduleFlush(0);
        }
      });
      this.scheduleFlush(0);
    }
  }

  async track(eventName, context = {}, metadata = {}) {
    if (!eventName) {
      return;
    }

    const mergedContext = {
      ...this._globalContext,
      ...normaliseContext(context),
    };

    const payload = sanitizeEventPayload({
      eventName,
      actorType:
        metadata.actorType || (metadata.userId != null ? 'user' : 'anonymous'),
      userId: metadata.userId ?? null,
      entityType: metadata.entityType ?? null,
      entityId: metadata.entityId ?? null,
      source: metadata.source || 'web',
      context: mergedContext,
      occurredAt: new Date().toISOString(),
    });

    if (!payload) {
      return;
    }

    try {
      await sendEvent(payload);
      await this.flush();
    } catch (error) {
      const queue = loadQueue();
      queue.push(payload);
      if (queue.length > MAX_QUEUE_SIZE) {
        queue.splice(0, queue.length - MAX_QUEUE_SIZE);
      }
      persistQueue(queue);
      console.warn('Buffered analytics event due to network failure', error);
      this.scheduleFlush();
    }
  }

  scheduleFlush(delay = FLUSH_RETRY_INTERVAL) {
    if (typeof window === 'undefined') {
      return;
    }
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
    }
    this._flushTimer = window.setTimeout(() => {
      this.flush().catch((error) => {
        console.warn('Failed to flush analytics queue', error);
        this.scheduleFlush();
      });
    }, Math.max(0, delay));
  }

  async flush() {
    if (this._isFlushing) {
      return;
    }
    this._isFlushing = true;
    const queue = loadQueue();
    if (!queue.length) {
      this._isFlushing = false;
      return;
    }

    while (queue.length) {
      const event = queue[0];
      try {
        await apiClient.post('/analytics/events', event);
        queue.shift();
      } catch (error) {
        persistQueue(queue);
        this._isFlushing = false;
        throw error;
      }
    }

    persistQueue(queue);
    this._isFlushing = false;
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }
  }

  setGlobalContext(context) {
    if (!context || typeof context !== 'object') {
      return;
    }

    this._globalContext = {
      ...this._globalContext,
      ...normaliseContext(context),
    };
  }

  clearGlobalContext(keys) {
    if (keys == null) {
      this._globalContext = {};
      return;
    }

    const toRemove = Array.isArray(keys) ? keys : [keys];
    if (!toRemove.length) {
      return;
    }

    const nextContext = { ...this._globalContext };
    for (const key of toRemove) {
      if (key == null) continue;
      delete nextContext[key];
    }

    this._globalContext = nextContext;
  }
}

export const analytics = new AnalyticsClient();

export default analytics;
