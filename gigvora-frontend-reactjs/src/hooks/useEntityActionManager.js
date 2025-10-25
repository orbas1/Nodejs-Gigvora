import { useCallback, useMemo, useReducer } from 'react';

function createInitialState(keys) {
  return keys.reduce((state, key) => {
    const normalisedKey = String(key);
    state[normalisedKey] = { saving: false, error: null };
    return state;
  }, {});
}

function reducer(state, action) {
  switch (action.type) {
    case 'start': {
      const key = action.key;
      return {
        ...state,
        [key]: {
          saving: true,
          error: null,
        },
      };
    }
    case 'resolve': {
      const key = action.key;
      return {
        ...state,
        [key]: {
          saving: false,
          error: null,
        },
      };
    }
    case 'error': {
      const key = action.key;
      return {
        ...state,
        [key]: {
          saving: false,
          error: action.error ?? null,
        },
      };
    }
    case 'reset': {
      if (!action.key) {
        return state;
      }
      const key = action.key;
      if (!Object.prototype.hasOwnProperty.call(state, key)) {
        return state;
      }
      return {
        ...state,
        [key]: {
          saving: false,
          error: null,
        },
      };
    }
    default:
      return state;
  }
}

function ensureKey(keys, key) {
  if (!keys.includes(key)) {
    throw new Error(`Unknown action key "${key}" passed to useEntityActionManager.`);
  }
}

export default function useEntityActionManager(actionKeys) {
  const keys = useMemo(() => {
    return Array.from(new Set((actionKeys ?? []).map((key) => String(key))));
  }, [actionKeys]);

  const [state, dispatch] = useReducer(reducer, keys, createInitialState);

  const runAction = useCallback(
    async (key, executor, { selector, refresh, onSuccess, onError } = {}) => {
      const normalisedKey = String(key);
      ensureKey(keys, normalisedKey);
      dispatch({ type: 'start', key: normalisedKey });
      try {
        const result = await executor();
        const selectedResult = selector ? selector(result) : result;
        if (onSuccess) {
          await onSuccess(selectedResult, result);
        }
        if (refresh) {
          await refresh(selectedResult, result);
        }
        dispatch({ type: 'resolve', key: normalisedKey });
        return selectedResult;
      } catch (error) {
        dispatch({ type: 'error', key: normalisedKey, error });
        if (onError) {
          onError(error);
        }
        throw error;
      }
    },
    [keys],
  );

  const reset = useCallback(
    (key) => {
      if (!key) {
        return;
      }
      const normalisedKey = String(key);
      if (keys.includes(normalisedKey)) {
        dispatch({ type: 'reset', key: normalisedKey });
      }
    },
    [keys],
  );

  return { state, runAction, reset };
}
