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
    return parsed;
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
  const actorHeaders = useMemo(() => buildActorHeaders(), []);

  const savedState = useCachedResource(
    'search:saved',
    async ({ signal }) => {
      if (!canUseServer) {
        return { items: [] };
      }
      try {
        return await apiClient.get('/search/subscriptions', { signal, headers: actorHeaders });
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

  useEffect(() => {
    if (!canUseServer) {
      setLocalItems(readLocalSavedSearches());
    }
  }, [canUseServer]);

  const items = canUseServer ? savedState.data?.items ?? [] : localItems;

  const createSavedSearch = useCallback(
    async (payload) => {
      if (canUseServer) {
        const created = await apiClient.post('/search/subscriptions', payload, { headers: actorHeaders });
        await savedState.refresh({ force: true });
        return created;
      }

      const next = [
        ...items,
        {
          id: generateLocalId(),
          name: payload.name,
          category: payload.category,
          query: payload.query,
          filters: payload.filters,
          sort: payload.sort,
          notifyByEmail: payload.notifyByEmail ?? false,
          notifyInApp: payload.notifyInApp ?? true,
          createdAt: new Date().toISOString(),
        },
      ];
      setLocalItems(next);
      writeLocalSavedSearches(next);
      return next[next.length - 1];
    },
    [actorHeaders, canUseServer, items, savedState],
  );

  const updateSavedSearch = useCallback(
    async (id, changes) => {
      if (canUseServer) {
        const updated = await apiClient.patch(`/search/subscriptions/${id}`, changes, { headers: actorHeaders });
        await savedState.refresh({ force: true });
        return updated;
      }

      const next = items.map((item) => (item.id === id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item));
      setLocalItems(next);
      writeLocalSavedSearches(next);
      return next.find((item) => item.id === id) ?? null;
    },
    [actorHeaders, canUseServer, items, savedState],
  );

  const deleteSavedSearch = useCallback(
    async (target) => {
      const id = typeof target === 'object' ? target.id : target;
      if (canUseServer) {
        await apiClient.delete(`/search/subscriptions/${id}`, { headers: actorHeaders });
        await savedState.refresh({ force: true });
        return;
      }
      const next = items.filter((item) => item.id !== id);
      setLocalItems(next);
      writeLocalSavedSearches(next);
    },
    [actorHeaders, canUseServer, items, savedState],
  );

  return {
    items,
    loading: canUseServer ? savedState.loading : false,
    error: canUseServer ? savedState.error : null,
    refresh: savedState.refresh,
    createSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    canUseServer,
  };
}
