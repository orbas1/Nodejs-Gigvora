import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import PropTypes from 'prop-types';
import {
  fetchAgencyMentoringOverview,
  listAgencyMentoringSessions,
  createAgencyMentoringSession,
  updateAgencyMentoringSession,
  deleteAgencyMentoringSession,
  listAgencyMentoringPurchases,
  createAgencyMentoringPurchase,
  updateAgencyMentoringPurchase,
  deleteAgencyMentoringPurchase,
  listAgencyMentorFavourites,
  createAgencyMentorPreference,
  updateAgencyMentorPreference,
  deleteAgencyMentorPreference,
  listAgencySuggestedMentors,
} from '../../../../services/agencyMentoring.js';

const MentoringDataContext = createContext(null);

const initialState = {
  loading: true,
  refreshing: false,
  error: null,
  overview: null,
  sessions: [],
  purchases: [],
  favourites: [],
  suggestions: [],
};

function toErrorMessage(error) {
  if (!error) {
    return 'Unexpected error. Please try again.';
  }
  if (error.body?.message) {
    return error.body.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Unexpected error. Please try again.';
}

function upsertById(list, item) {
  if (!item || typeof item !== 'object') {
    return list;
  }
  if (!item.id) {
    return [item, ...list];
  }
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index === -1) {
    return [item, ...list];
  }
  const next = [...list];
  next[index] = item;
  return next;
}

function removeById(list, id) {
  return list.filter((item) => item.id !== id);
}

function reducer(state, action) {
  switch (action.type) {
    case 'load/start':
      return { ...state, loading: true, error: null };
    case 'load/success':
      return {
        ...state,
        loading: false,
        refreshing: false,
        error: null,
        overview: action.payload.overview,
        sessions: action.payload.sessions,
        purchases: action.payload.purchases,
        favourites: action.payload.favourites,
        suggestions: action.payload.suggestions,
      };
    case 'load/error':
      return { ...state, loading: false, refreshing: false, error: action.error };
    case 'refresh/start':
      return { ...state, refreshing: true };
    case 'refresh/error':
      return { ...state, refreshing: false, error: action.error };
    case 'overview/update':
      return {
        ...state,
        refreshing: false,
        error: null,
        overview: action.payload,
        suggestions: action.payload?.suggestedMentors ?? state.suggestions,
      };
    case 'sessions/upsert':
      return { ...state, sessions: upsertById(state.sessions, action.payload) };
    case 'sessions/remove':
      return { ...state, sessions: removeById(state.sessions, action.payload) };
    case 'purchases/upsert':
      return { ...state, purchases: upsertById(state.purchases, action.payload) };
    case 'purchases/remove':
      return { ...state, purchases: removeById(state.purchases, action.payload) };
    case 'favourites/upsert':
      return { ...state, favourites: upsertById(state.favourites, action.payload) };
    case 'favourites/remove':
      return { ...state, favourites: removeById(state.favourites, action.payload) };
    case 'suggestions/set':
      return { ...state, suggestions: action.payload ?? [] };
    case 'set/error':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

function withWorkspace(payload, params) {
  return { ...payload, ...params };
}

function toWorkspaceParams(workspaceId, workspaceSlug) {
  return {
    ...(workspaceId ? { workspaceId } : {}),
    ...(workspaceSlug ? { workspaceSlug } : {}),
  };
}

export function MentoringDataProvider({ workspaceId = null, workspaceSlug = null, children }) {
  const params = useMemo(() => toWorkspaceParams(workspaceId, workspaceSlug), [workspaceId, workspaceSlug]);
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(async () => {
    dispatch({ type: 'load/start' });
    try {
      const [overview, sessionsResult, purchasesResult, favouritesResult, suggestionsResult] = await Promise.all([
        fetchAgencyMentoringOverview(params),
        listAgencyMentoringSessions(params),
        listAgencyMentoringPurchases(params),
        listAgencyMentorFavourites(params),
        listAgencySuggestedMentors(params),
      ]);

      dispatch({
        type: 'load/success',
        payload: {
          overview,
          sessions: sessionsResult?.sessions ?? [],
          purchases: purchasesResult?.purchases ?? [],
          favourites: favouritesResult?.favourites ?? [],
          suggestions: suggestionsResult?.suggestedMentors ?? overview?.suggestedMentors ?? [],
        },
      });
    } catch (error) {
      dispatch({ type: 'load/error', error: toErrorMessage(error) });
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshOverview = useCallback(async () => {
    dispatch({ type: 'refresh/start' });
    try {
      const data = await fetchAgencyMentoringOverview(params);
      dispatch({ type: 'overview/update', payload: data });
    } catch (error) {
      dispatch({ type: 'refresh/error', error: toErrorMessage(error) });
    }
  }, [params]);

  const handleError = useCallback((error) => {
    const message = toErrorMessage(error);
    dispatch({ type: 'set/error', error: message });
    return message;
  }, []);

  const actions = useMemo(() => {
    return {
      reload: load,
      refreshOverview,
      async createSession(payload) {
        try {
          const record = await createAgencyMentoringSession(withWorkspace(payload, params));
          dispatch({ type: 'sessions/upsert', payload: record });
          await refreshOverview();
          return record;
        } catch (error) {
          handleError(error);
          throw error;
        }
      },
      async updateSession(sessionId, payload) {
        try {
          const record = await updateAgencyMentoringSession(sessionId, withWorkspace(payload, params));
          dispatch({ type: 'sessions/upsert', payload: record });
          await refreshOverview();
          return record;
        } catch (error) {
          handleError(error);
          throw error;
        }
      },
      async deleteSession(sessionId) {
        try {
          await deleteAgencyMentoringSession(sessionId, params);
          dispatch({ type: 'sessions/remove', payload: sessionId });
          await refreshOverview();
        } catch (error) {
          handleError(error);
          throw error;
        }
      },
      async createPurchase(payload) {
        try {
          const record = await createAgencyMentoringPurchase(withWorkspace(payload, params));
          dispatch({ type: 'purchases/upsert', payload: record });
          await refreshOverview();
          return record;
        } catch (error) {
          handleError(error);
          throw error;
        }
      },
      async updatePurchase(purchaseId, payload) {
        try {
          const record = await updateAgencyMentoringPurchase(purchaseId, withWorkspace(payload, params));
          dispatch({ type: 'purchases/upsert', payload: record });
          await refreshOverview();
          return record;
        } catch (error) {
          handleError(error);
          throw error;
        }
      },
      async deletePurchase(purchaseId) {
        try {
          await deleteAgencyMentoringPurchase(purchaseId, params);
          dispatch({ type: 'purchases/remove', payload: purchaseId });
          await refreshOverview();
        } catch (error) {
          handleError(error);
          throw error;
        }
      },
      async createFavourite(payload) {
        try {
          const record = await createAgencyMentorPreference(withWorkspace(payload, params));
          dispatch({ type: 'favourites/upsert', payload: record });
          await refreshOverview();
          return record;
        } catch (error) {
          handleError(error);
          throw error;
        }
      },
      async updateFavourite(preferenceId, payload) {
        try {
          const record = await updateAgencyMentorPreference(preferenceId, withWorkspace(payload, params));
          dispatch({ type: 'favourites/upsert', payload: record });
          await refreshOverview();
          return record;
        } catch (error) {
          handleError(error);
          throw error;
        }
      },
      async deleteFavourite(preferenceId) {
        try {
          await deleteAgencyMentorPreference(preferenceId, params);
          dispatch({ type: 'favourites/remove', payload: preferenceId });
          await refreshOverview();
        } catch (error) {
          handleError(error);
          throw error;
        }
      },
      async refreshSuggestions() {
        try {
          const result = await listAgencySuggestedMentors(params);
          dispatch({ type: 'suggestions/set', payload: result?.suggestedMentors ?? [] });
        } catch (error) {
          handleError(error);
          throw error;
        }
      },
    };
  }, [handleError, load, params, refreshOverview]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <MentoringDataContext.Provider value={value}>{children}</MentoringDataContext.Provider>;
}

MentoringDataProvider.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  workspaceSlug: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export function useMentoringData() {
  const context = useContext(MentoringDataContext);
  if (!context) {
    throw new Error('useMentoringData must be used within a MentoringDataProvider.');
  }
  return context;
}
