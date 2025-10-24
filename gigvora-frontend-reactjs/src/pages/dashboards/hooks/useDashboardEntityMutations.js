import { useCallback } from 'react';

/**
 * Shared dashboard helper for wrapping entity mutations with saving state lifecycle events.
 * Dispatch should understand the following action types:
 * - `saving/start` `{ entity }`
 * - `saving/finish` `{ entity }`
 * - `saving/error` `{ entity, error }`
 * - `snapshot/apply` `{ payload }`
 */
export function useDashboardEntityMutations(dispatch, { onMissingSnapshot } = {}) {
  return useCallback(
    ({ entity, action, selector, onSuccess }) => {
      if (!entity || typeof action !== 'function') {
        throw new Error('useDashboardEntityMutations requires an entity name and action function.');
      }

      return async (...args) => {
        dispatch({ type: 'saving/start', payload: { entity } });
        try {
          const response = await action(...args);
          if (response !== undefined) {
            dispatch({ type: 'snapshot/apply', payload: response });
          } else if (onMissingSnapshot) {
            await onMissingSnapshot();
          }

          if (typeof onSuccess === 'function') {
            onSuccess(response);
          }

          return typeof selector === 'function' ? selector(response) : response;
        } catch (error) {
          dispatch({ type: 'saving/error', payload: { entity, error } });
          throw error;
        } finally {
          dispatch({ type: 'saving/finish', payload: { entity } });
        }
      };
    },
    [dispatch, onMissingSnapshot],
  );
}

export default useDashboardEntityMutations;
