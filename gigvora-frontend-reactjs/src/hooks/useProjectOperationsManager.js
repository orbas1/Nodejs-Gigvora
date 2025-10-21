import { useCallback, useMemo } from 'react';
import useProjectOperations from './useProjectOperations.js';

function ensureAction(actions, name) {
  const fn = actions?.[name];
  if (typeof fn !== 'function') {
    throw new Error(`Project operation "${name}" is not available in the current context.`);
  }
  return fn;
}

export default function useProjectOperationsManager({ projectId, enabled = true } = {}) {
  const state = useProjectOperations({ projectId, enabled });
  const { actions, refresh, mutating, canManage } = state;

  const call = useCallback(
    async (name, args) => {
      const fn = ensureAction(actions, name);
      return fn(...(Array.isArray(args) ? args : []));
    },
    [actions],
  );

  const mappedActions = useMemo(() => {
    if (!actions) {
      return null;
    }
    return Object.fromEntries(
      Object.entries(actions).map(([name, fn]) => [name, (...args) => fn(...args)]),
    );
  }, [actions]);

  return {
    ...state,
    hasProject: Boolean(projectId),
    refreshOperations: refresh,
    mutating,
    canManage,
    run: call,
    actions: mappedActions,
    rawActions: actions,
  };
}
