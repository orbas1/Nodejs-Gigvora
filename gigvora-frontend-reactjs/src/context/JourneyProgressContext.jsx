import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import analytics from '../services/analytics.js';
import { ANALYTICS_EVENTS } from '../constants/analyticsEvents.js';

const STORAGE_KEY = 'gigvora:web:journey-progress:v1';

const CHECKPOINT_DEFINITIONS = Object.freeze({
  account_registration_submitted: {
    id: 'account_registration_submitted',
    title: 'Account ready',
    description: 'Complete the initial registration so personalisation can begin.',
    category: 'onboarding',
    personas: ['universal'],
    weight: 0.3,
  },
  creation_studio_quick_launch: {
    id: 'creation_studio_quick_launch',
    title: 'Workspace launched',
    description: 'Generate a workspace or gig draft using the creation studio.',
    category: 'creation',
    personas: ['freelancer', 'agency', 'company'],
    weight: 0.4,
  },
  auto_match_queue_regenerated: {
    id: 'auto_match_queue_regenerated',
    title: 'Auto-match calibrated',
    description: 'Refresh auto-match queues to balance fairness and velocity.',
    category: 'operations',
    personas: ['agency', 'company'],
    weight: 0.2,
  },
  user_dashboard_reviewed: {
    id: 'user_dashboard_reviewed',
    title: 'Dashboard reviewed',
    description: 'Visit the client dashboard to align jobs, gigs, and operations.',
    category: 'engagement',
    personas: ['user', 'freelancer', 'agency', 'company'],
    weight: 0.1,
  },
});

function initialiseState() {
  if (typeof window === 'undefined') {
    return { checkpoints: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { checkpoints: {} };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { checkpoints: {} };
    }
    const checkpoints = parsed.checkpoints && typeof parsed.checkpoints === 'object' ? parsed.checkpoints : {};
    return { checkpoints };
  } catch (error) {
    console.warn('Unable to read journey progress cache', error);
    return { checkpoints: {} };
  }
}

export const JourneyProgressContext = createContext(null);

function persistState(stateRef) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ checkpoints: stateRef.current.checkpoints }));
  } catch (error) {
    console.warn('Unable to persist journey progress cache', error);
  }
}

export function JourneyProgressProvider({ children }) {
  const [state, setState] = useState(() => initialiseState());
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    persistState(stateRef);
  }, [state]);

  const completeCheckpoint = useCallback((checkpointId, metadata = {}) => {
    if (!checkpointId) {
      return;
    }
    const now = new Date().toISOString();
    setState((previous) => {
      const current = previous.checkpoints[checkpointId] || {};
      const occurrences = (current.occurrences || 0) + 1;
      const nextState = {
        checkpoints: {
          ...previous.checkpoints,
          [checkpointId]: {
            completedAt: now,
            metadata: metadata && typeof metadata === 'object' ? { ...metadata } : {},
            occurrences,
            lastContext: metadata && typeof metadata === 'object' ? { ...metadata } : {},
          },
        },
      };
      return nextState;
    });

    const descriptor = CHECKPOINT_DEFINITIONS[checkpointId];
    analytics.track(ANALYTICS_EVENTS.JOURNEY_CHECKPOINT_COMPLETED.name, {
      checkpointId,
      category: descriptor?.category ?? 'general',
      personas: descriptor?.personas ?? ['universal'],
      metadata,
    });
  }, []);

  const resetCheckpoint = useCallback((checkpointId) => {
    if (!checkpointId) {
      return;
    }
    setState((previous) => {
      if (!previous.checkpoints[checkpointId]) {
        return previous;
      }
      const next = { ...previous.checkpoints };
      delete next[checkpointId];
      return { checkpoints: next };
    });
  }, []);

  const summary = useMemo(() => {
    const definitions = Object.values(CHECKPOINT_DEFINITIONS);
    if (!definitions.length) {
      return { completed: 0, total: 0, ratio: 0 };
    }
    const totalWeight = definitions.reduce((sum, entry) => sum + (entry.weight ?? 0), 0) || definitions.length;
    const completedWeight = definitions.reduce((sum, entry) => {
      const checkpoint = state.checkpoints[entry.id];
      if (checkpoint?.completedAt) {
        return sum + (entry.weight ?? 0);
      }
      return sum;
    }, 0);
    const completed = definitions.filter((entry) => Boolean(state.checkpoints[entry.id]?.completedAt)).length;
    const total = definitions.length;
    return {
      completed,
      total,
      ratio: totalWeight ? Math.min(1, Math.max(0, completedWeight / totalWeight)) : completed / total,
    };
  }, [state.checkpoints]);

  const contextValue = useMemo(
    () => ({
      checkpoints: state.checkpoints,
      definitions: CHECKPOINT_DEFINITIONS,
      summary,
      completeCheckpoint,
      resetCheckpoint,
      isCheckpointComplete: (checkpointId) => Boolean(state.checkpoints[checkpointId]?.completedAt),
    }),
    [completeCheckpoint, resetCheckpoint, state.checkpoints, summary],
  );

  return <JourneyProgressContext.Provider value={contextValue}>{children}</JourneyProgressContext.Provider>;
}

export default JourneyProgressProvider;
