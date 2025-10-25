import { useMemo } from 'react';

/**
 * Builds a mutation runner that keeps dashboard entity saving state in sync with a reducer.
 * Dispatchers are intentionally generic so they can be reused across persona dashboards.
 */
function hasSnapshotPayload(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'dashboard' in value || 'profile' in value || 'metadata' in value;
}

export function createDashboardEntityMutation({ dispatch, refresh, onHydrate }) {
  if (typeof dispatch !== 'function') {
    throw new Error('createDashboardEntityMutation requires a dispatch function.');
  }

  return async function runDashboardMutation(key, operation, { hydrate = true, preferResponse = true } = {}) {
    if (!key) {
      throw new Error('Dashboard mutations require a stable key to scope saving state.');
    }
    if (typeof operation !== 'function') {
      throw new Error('Dashboard mutations require an async operation callback.');
    }

    dispatch({ type: 'entity/saving/start', key });

    try {
      const result = await operation();
      let payloadApplied = false;

      if (hydrate && typeof onHydrate === 'function') {
        const candidate = preferResponse && hasSnapshotPayload(result) ? result : await refresh?.();
        if (candidate) {
          await onHydrate(candidate);
          payloadApplied = true;
        }
      }

      if (!payloadApplied && hydrate && typeof refresh === 'function' && typeof onHydrate === 'function') {
        const fallbackSnapshot = await refresh();
        if (fallbackSnapshot) {
          await onHydrate(fallbackSnapshot);
          payloadApplied = true;
        }
      }

      dispatch({ type: 'entity/saving/success', key });
      return result;
    } catch (error) {
      dispatch({ type: 'entity/saving/error', key, error });
      throw error;
    }
  };
}

/**
 * Small helper to memoise mutation runners without repeatedly closing over dependencies.
 */
export function useDashboardEntityMutation(options) {
  return useMemo(() => createDashboardEntityMutation(options), [options]);
}
