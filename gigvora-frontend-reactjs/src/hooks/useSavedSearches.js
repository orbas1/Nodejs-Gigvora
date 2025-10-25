import { useCallback, useEffect, useMemo, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import { apiClient } from '../services/apiClient.js';

const LOCAL_STORAGE_KEY = 'gigvora:web:explorer:savedSearches';

function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Local storage unavailable for saved searches.', error);
    return null;
  }
}

function readLocalSavedSearches() {
  const storage = getLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => ({
      ...entry,
      frequency: entry?.frequency ?? 'daily',
      notifyByEmail: Boolean(entry?.notifyByEmail),
      notifyInApp: entry?.notifyInApp === undefined ? true : Boolean(entry.notifyInApp),
    }));
  } catch (error) {
    console.warn('Failed to read saved searches from local storage', error);
    return [];
  }
}

function writeLocalSavedSearches(list) {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.warn('Failed to persist saved searches to local storage', error);
  }
}

function generateLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeNextRunAt(frequency) {
  const now = new Date();
  switch ((frequency ?? 'daily').toLowerCase()) {
    case 'immediate':
      return now;
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'daily':
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

function buildActorHeaders() {
  if (typeof window === 'undefined') {
    return {};
  }
  const storage = getLocalStorage();
  const userId =
    storage?.getItem('gigvora:web:userId') ??
    import.meta.env.VITE_DEMO_USER_ID ??
    null;
  return userId ? { 'x-user-id': userId } : {};
}

export default function useSavedSearches({ enabled = true } = {}) {
  const storage = getLocalStorage();
  const authToken = storage?.getItem('gigvora:web:auth:accessToken');
  const canUseServer = Boolean(enabled && authToken);

  const savedState = useCachedResource(
    'search:saved',
    async ({ signal }) => {
      if (!canUseServer) {
        return { items: [] };
      }
      try {
        return await apiClient.get('/search/subscriptions', { signal, headers: buildActorHeaders() });
      } catch (error) {
        if (error instanceof apiClient.ApiError && [401, 403, 404, 422].includes(error.status)) {
          return { items: [] };
        }
        throw error;
      }
    },
    { enabled: canUseServer },
  );

  const [localItems, setLocalItems] = useState(() => (canUseServer ? [] : readLocalSavedSearches()));

  const { data, error, loading, refresh, lastUpdated, fromCache } = savedState;

  useEffect(() => {
    if (!canUseServer) {
      setLocalItems(readLocalSavedSearches());
    }
  }, [canUseServer]);

  const items = useMemo(() => {
    const remote = data?.items ?? [];
    return canUseServer ? remote : localItems;
  }, [canUseServer, data, localItems]);

  const refreshSaved = useCallback((options) => refresh(options), [refresh]);

  const createSavedSearch = useCallback(
    async (payload) => {
      if (canUseServer) {
        const created = await apiClient.post('/search/subscriptions', payload, { headers: buildActorHeaders() });
        await refreshSaved({ force: true });
        return created;
      }

      const frequency = (payload.frequency ?? 'daily').toLowerCase();
      const nextRunAt = computeNextRunAt(frequency).toISOString();
      const next = [
        ...items,
        {
          id: generateLocalId(),
          name: payload.name,
          category: payload.category,
          query: payload.query,
          filters: payload.filters,
          sort: payload.sort,
          frequency,
          notifyByEmail: payload.notifyByEmail ?? false,
          notifyInApp: payload.notifyInApp ?? true,
          createdAt: new Date().toISOString(),
          lastTriggeredAt: null,
          nextRunAt,
        },
      ];
      setLocalItems(next);
      writeLocalSavedSearches(next);
      return next[next.length - 1];
    },
    [canUseServer, items, refreshSaved],
  );

  const updateSavedSearch = useCallback(
    async (id, changes) => {
      if (canUseServer) {
        const updated = await apiClient.patch(`/search/subscriptions/${id}`, changes, { headers: buildActorHeaders() });
        await refreshSaved({ force: true });
        return updated;
      }

      const next = items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const updated = {
          ...item,
          ...changes,
          updatedAt: new Date().toISOString(),
        };

        if (changes.frequency !== undefined) {
          const frequency = `${changes.frequency}`.toLowerCase();
          updated.frequency = frequency;
          updated.nextRunAt = computeNextRunAt(frequency).toISOString();
        }

        if (changes.notifyByEmail !== undefined) {
          updated.notifyByEmail = Boolean(changes.notifyByEmail);
        }

        if (changes.notifyInApp !== undefined) {
          updated.notifyInApp = Boolean(changes.notifyInApp);
        }

        return updated;
      });
      setLocalItems(next);
      writeLocalSavedSearches(next);
      return next.find((item) => item.id === id) ?? null;
    },
    [canUseServer, items, refreshSaved],
  );

  const deleteSavedSearch = useCallback(
    async (target) => {
      const id = typeof target === 'object' ? target.id : target;
      if (canUseServer) {
        await apiClient.delete(`/search/subscriptions/${id}`, { headers: buildActorHeaders() });
        await refreshSaved({ force: true });
        return;
      }
      const next = items.filter((item) => item.id !== id);
      setLocalItems(next);
      writeLocalSavedSearches(next);
    },
    [canUseServer, items, refreshSaved],
  );

  const runSavedSearch = useCallback(
    async (target) => {
      const id = typeof target === 'object' ? target.id : target;
      if (canUseServer) {
        await apiClient.post(`/search/subscriptions/${id}/run`, {}, { headers: buildActorHeaders() });
        await refreshSaved({ force: true });
        return;
      }

      const now = new Date();
      const updated = items.map((item) => {
        if (item.id !== id) {
          return item;
        }
        const nextRun = computeNextRunAt(item.frequency);
        return {
          ...item,
          lastTriggeredAt: now.toISOString(),
          nextRunAt: nextRun.toISOString(),
        };
      });
      setLocalItems(updated);
      writeLocalSavedSearches(updated);
    },
    [canUseServer, items, refreshSaved],
  );

  return {
    items,
    loading: canUseServer ? loading : false,
    error: canUseServer ? error : null,
    fromCache: canUseServer ? fromCache : false,
    lastUpdated: canUseServer ? lastUpdated : null,
    refresh: refreshSaved,
    createSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    runSavedSearch,
    canUseServer,
  };
}
