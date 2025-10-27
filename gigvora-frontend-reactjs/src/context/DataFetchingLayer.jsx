import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { apiClient } from '../services/apiClient.js';
import analytics from '../services/analytics.js';
import { useSession } from './SessionContext.jsx';

const CACHE_PREFIX = 'data-layer:';
const OFFLINE_QUEUE_KEY = 'gigvora:web:data-layer:queue';
const DEFAULT_TTL = 1000 * 60 * 2; // two minutes

const METHOD_TO_CLIENT = {
  GET: (path, { params, signal } = {}) => apiClient.get(path, { params, signal }),
  POST: (path, { body, params, signal } = {}) => apiClient.post(path, body, { params, signal }),
  PUT: (path, { body, params, signal } = {}) => apiClient.put(path, body, { params, signal }),
  PATCH: (path, { body, params, signal } = {}) => apiClient.patch(path, body, { params, signal }),
  DELETE: (path, { params, signal } = {}) => apiClient.delete(path, { params, signal }),
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function normalisePath(path = '') {
  if (!path) {
    return '/';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function serialiseParamValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serialiseParamValue).filter(Boolean).join(',');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function buildCacheKey(method, path, params = {}) {
  const normalisedMethod = (method || 'GET').toUpperCase();
  const normalisedPath = normalisePath(path);
  const entries = Object.entries(params || {})
    .filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0)
    .map(([key, value]) => [key, serialiseParamValue(value)])
    .sort(([a], [b]) => a.localeCompare(b));
  const query = entries.map(([key, value]) => `${key}=${value}`).join('&');
  return query ? `${normalisedMethod}:${normalisedPath}?${query}` : `${normalisedMethod}:${normalisedPath}`;
}

function loadQueue() {
  if (!isBrowser()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const { id, method, path, body = null, params = null, metadata = null, invalidateKeys = [] } = item;
        if (!id || !method || !path) {
          return null;
        }
        return {
          id,
          method: String(method).toUpperCase(),
          path,
          body,
          params,
          metadata: metadata && typeof metadata === 'object' ? metadata : null,
          invalidateKeys: Array.isArray(invalidateKeys) ? invalidateKeys : [],
          createdAt: item.createdAt ?? new Date().toISOString(),
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn('Unable to parse data fetching queue', error);
    return [];
  }
}

function persistQueue(queue) {
  if (!isBrowser()) {
    return;
  }
  try {
    if (!queue.length) {
      window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
      return;
    }
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('Unable to persist data fetching queue', error);
  }
}

const defaultContext = {
  fetchResource: async () => undefined,
  prefetchResource: async () => undefined,
  mutateResource: async () => undefined,
  invalidate: async () => undefined,
  subscribe: () => () => {},
  buildKey: buildCacheKey,
};

const DataFetchingContext = createContext(defaultContext);

export function DataFetchingProvider({ children, defaultTtl = DEFAULT_TTL }) {
  const { session } = useSession();

  const cacheRef = useRef(new Map());
  const subscribersRef = useRef(new Map());
  const inFlightRef = useRef(new Map());
  const queueRef = useRef(loadQueue());
  const fetchRef = useRef(null);
  const invalidateRef = useRef(null);

  const notifySubscribers = useCallback((key, payload) => {
    const subscribers = subscribersRef.current.get(key);
    if (!subscribers || !subscribers.size) {
      return;
    }
    subscribers.forEach((subscriber) => {
      try {
        subscriber(payload);
      } catch (error) {
        console.warn('Subscriber callback threw an error', error);
      }
    });
  }, []);

  const readPersistedEntry = useCallback((key) => {
    try {
      return apiClient.readCache(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.warn('Unable to read cached entry', key, error);
      return null;
    }
  }, []);

  const writePersistedEntry = useCallback((key, data, ttl) => {
    try {
      apiClient.writeCache(`${CACHE_PREFIX}${key}`, data, ttl);
    } catch (error) {
      console.warn('Unable to persist cache entry', key, error);
    }
  }, []);

  const removePersistedEntry = useCallback((key) => {
    try {
      apiClient.removeCache(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.warn('Unable to remove cache entry', key, error);
    }
  }, []);

  const updateCache = useCallback(
    (key, updater, { ttl = defaultTtl, silent = false } = {}) => {
      const entry = cacheRef.current.get(key);
      const previousData = entry?.data;
      const nextData = typeof updater === 'function' ? updater(previousData) : updater;
      if (nextData === undefined) {
        return { previous: previousData, next: previousData };
      }
      const expiresAt = ttl === Infinity ? Infinity : Date.now() + ttl;
      const nextEntry = {
        data: nextData,
        expiresAt,
        lastUpdated: Date.now(),
        request: entry?.request ?? null,
      };
      cacheRef.current.set(key, nextEntry);
      writePersistedEntry(key, nextData, ttl);
      if (!silent) {
        notifySubscribers(key, { data: nextData, meta: { key, source: 'update', previous: previousData } });
      }
      return { previous: previousData, next: nextData };
    },
    [defaultTtl, notifySubscribers, writePersistedEntry],
  );

  const fetchResource = useCallback(
    async (
      path,
      {
        params,
        strategy = 'cache-first',
        ttl = defaultTtl,
        key,
        signal,
        metadata = {},
        method = 'GET',
      } = {},
    ) => {
      const normalisedKey = key ?? buildCacheKey(method, path, params);
      const existing = cacheRef.current.get(normalisedKey);
      const now = Date.now();
      const clientMethod = METHOD_TO_CLIENT[method.toUpperCase()];
      if (!clientMethod) {
        throw new Error(`Unsupported request method: ${method}`);
      }

      if (existing && existing.expiresAt && existing.expiresAt > now && strategy !== 'network-only') {
        return existing.data;
      }

      if (existing && strategy === 'stale-while-revalidate') {
        if (!inFlightRef.current.has(normalisedKey)) {
          const requestPromise = (async () => {
            const startedAt = performance.now();
            try {
              const response = await clientMethod(path, { params, signal });
              updateCache(normalisedKey, () => response, { ttl });
              analytics.track('data_fetch_succeeded', {
                key: normalisedKey,
                durationMs: performance.now() - startedAt,
                ...metadata,
                userId: session?.id ?? null,
              });
              return response;
            } catch (error) {
              analytics.track('data_fetch_failed', {
                key: normalisedKey,
                status: error?.status ?? null,
                message: error?.message ?? 'Unknown error',
                ...metadata,
                userId: session?.id ?? null,
              });
              throw error;
            } finally {
              inFlightRef.current.delete(normalisedKey);
            }
          })();
          inFlightRef.current.set(normalisedKey, requestPromise);
        }
        return existing.data;
      }

      const persisted = !existing ? readPersistedEntry(normalisedKey) : null;
      if (persisted && persisted.data !== undefined && strategy !== 'network-only') {
        cacheRef.current.set(normalisedKey, {
          data: persisted.data,
          expiresAt: persisted.timestamp ? persisted.timestamp.getTime() + ttl : now + ttl,
          lastUpdated: persisted.timestamp ? persisted.timestamp.getTime() : now,
          request: { method, path, params },
        });
        notifySubscribers(normalisedKey, { data: persisted.data, meta: { key: normalisedKey, source: 'hydrate' } });
        return persisted.data;
      }

      if (inFlightRef.current.has(normalisedKey)) {
        return inFlightRef.current.get(normalisedKey);
      }

      const requestPromise = (async () => {
        const startedAt = performance.now();
        try {
          const response = await clientMethod(path, { params, signal });
          cacheRef.current.set(normalisedKey, {
            data: response,
            expiresAt: ttl === Infinity ? Infinity : Date.now() + ttl,
            lastUpdated: Date.now(),
            request: { method, path, params },
          });
          writePersistedEntry(normalisedKey, response, ttl);
          notifySubscribers(normalisedKey, { data: response, meta: { key: normalisedKey, source: 'network' } });
          analytics.track('data_fetch_succeeded', {
            key: normalisedKey,
            durationMs: performance.now() - startedAt,
            ...metadata,
            userId: session?.id ?? null,
          });
          return response;
        } catch (error) {
          analytics.track('data_fetch_failed', {
            key: normalisedKey,
            status: error?.status ?? null,
            message: error?.message ?? 'Unknown error',
            ...metadata,
            userId: session?.id ?? null,
          });
          const fallback = cacheRef.current.get(normalisedKey);
          if (fallback) {
            return fallback.data;
          }
          throw error;
        } finally {
          inFlightRef.current.delete(normalisedKey);
        }
      })();

      inFlightRef.current.set(normalisedKey, requestPromise);
      return requestPromise;
    },
    [defaultTtl, notifySubscribers, readPersistedEntry, session?.id, updateCache, writePersistedEntry],
  );

  fetchRef.current = fetchResource;

  const invalidate = useCallback(
    async (keys, { revalidate = true } = {}) => {
      const list = Array.isArray(keys) ? keys : [keys];
      const refetches = [];
      list.forEach((key) => {
        if (!key) {
          return;
        }
        const entry = cacheRef.current.get(key);
        cacheRef.current.delete(key);
        removePersistedEntry(key);
        notifySubscribers(key, { data: undefined, meta: { key, source: 'invalidate' } });
        if (revalidate && entry?.request && fetchRef.current) {
          refetches.push(
            fetchRef.current(entry.request.path, {
              params: entry.request.params,
              method: entry.request.method,
              key,
              strategy: 'network-first',
            }).catch((error) => {
              console.warn('Failed to revalidate resource', key, error);
              return null;
            }),
          );
        }
      });
      if (refetches.length) {
        await Promise.all(refetches);
      }
    },
    [notifySubscribers, removePersistedEntry],
  );

  invalidateRef.current = invalidate;

  const prefetchResource = useCallback(
    async (path, options = {}) => {
      try {
        await fetchResource(path, { ...options, strategy: 'network-first' });
      } catch (error) {
        console.debug('Prefetch failed silently', error);
      }
    },
    [fetchResource],
  );

  const subscribe = useCallback(
    (key, callback, { emitCurrent = true } = {}) => {
      if (!key || typeof callback !== 'function') {
        return () => {};
      }
      if (!subscribersRef.current.has(key)) {
        subscribersRef.current.set(key, new Set());
      }
      const set = subscribersRef.current.get(key);
      set.add(callback);
      if (emitCurrent) {
        const entry = cacheRef.current.get(key);
        if (entry) {
          callback({ data: entry.data, meta: { key, source: 'snapshot' } });
        }
      }
      return () => {
        const subscribers = subscribersRef.current.get(key);
        if (!subscribers) {
          return;
        }
        subscribers.delete(callback);
        if (!subscribers.size) {
          subscribersRef.current.delete(key);
        }
      };
    },
    [],
  );

  const flushQueue = useCallback(async () => {
    if (!queueRef.current.length) {
      return;
    }
    const pending = [...queueRef.current];
    const nextQueue = [];
    for (const item of pending) {
      const requestFn = METHOD_TO_CLIENT[item.method];
      if (!requestFn) {
        continue;
      }
      try {
        const result = await requestFn(item.path, { body: item.body, params: item.params });
        analytics.track('data_mutation_flushed', {
          key: item.path,
          method: item.method,
          userId: session?.id ?? null,
          ...item.metadata,
        });
        if (invalidateRef.current && item.invalidateKeys?.length) {
          await invalidateRef.current(item.invalidateKeys);
        }
        notifySubscribers(buildCacheKey('GET', item.path, item.params ?? {}), {
          data: result,
          meta: { key: item.path, source: 'queue-flush' },
        });
      } catch (error) {
        console.warn('Failed to flush queued mutation', item.path, error);
        nextQueue.push(item);
      }
    }
    queueRef.current = nextQueue;
    persistQueue(queueRef.current);
  }, [notifySubscribers, session?.id]);

  useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }
    const handleOnline = () => {
      flushQueue().catch((error) => {
        console.warn('Failed to flush queue after reconnect', error);
      });
    };
    window.addEventListener('online', handleOnline);
    if (window.navigator?.onLine !== false) {
      flushQueue().catch((error) => {
        console.warn('Initial queue flush failed', error);
      });
    }
    return () => window.removeEventListener('online', handleOnline);
  }, [flushQueue]);

  const mutateResource = useCallback(
    async (
      path,
      {
        method = 'PATCH',
        body,
        params,
        metadata = {},
        invalidate: invalidateKeys = [],
        optimisticUpdate,
        queueIfOffline = true,
        signal,
      } = {},
    ) => {
      const normalisedMethod = method.toUpperCase();
      const requestFn = METHOD_TO_CLIENT[normalisedMethod];
      if (!requestFn) {
        throw new Error(`Unsupported request method: ${normalisedMethod}`);
      }
      const cacheKey = buildCacheKey('GET', path, params);
      let rollback;
      if (typeof optimisticUpdate === 'function') {
        rollback = optimisticUpdate((key, updater, options) => updateCache(key, updater, options));
      }

      const runRequest = async () => {
        const startedAt = performance.now();
        try {
          const response = await requestFn(path, { body, params, signal });
          analytics.track('data_mutation_succeeded', {
            key: cacheKey,
            method: normalisedMethod,
            durationMs: performance.now() - startedAt,
            ...metadata,
            userId: session?.id ?? null,
          });
          if (invalidateKeys.length && invalidateRef.current) {
            await invalidateRef.current(invalidateKeys);
          }
          return response;
        } catch (error) {
          analytics.track('data_mutation_failed', {
            key: cacheKey,
            method: normalisedMethod,
            status: error?.status ?? null,
            message: error?.message ?? 'Unknown error',
            ...metadata,
            userId: session?.id ?? null,
          });
          if (rollback) {
            try {
              rollback();
            } catch (rollbackError) {
              console.warn('Failed to rollback optimistic update', rollbackError);
            }
          }
          throw error;
        }
      };

      if (queueIfOffline && isBrowser() && window.navigator?.onLine === false) {
        const queued = {
          id: `${Date.now()}:${Math.random().toString(16).slice(2)}`,
          method: normalisedMethod,
          path,
          body,
          params,
          metadata,
          invalidateKeys,
          createdAt: new Date().toISOString(),
        };
        queueRef.current.push(queued);
        persistQueue(queueRef.current);
        analytics.track('data_mutation_enqueued', {
          key: cacheKey,
          method: normalisedMethod,
          ...metadata,
          userId: session?.id ?? null,
        });
        return { queued: true };
      }

      return runRequest();
    },
    [session?.id, updateCache],
  );

  const contextValue = useMemo(
    () => ({
      fetchResource,
      prefetchResource,
      mutateResource,
      invalidate,
      subscribe,
      buildKey: buildCacheKey,
    }),
    [fetchResource, invalidate, mutateResource, prefetchResource, subscribe],
  );

  return <DataFetchingContext.Provider value={contextValue}>{children}</DataFetchingContext.Provider>;
}

export function useDataFetchingLayer() {
  return useContext(DataFetchingContext);
}

export default DataFetchingProvider;
