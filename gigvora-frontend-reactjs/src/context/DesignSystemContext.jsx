import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createDesignSystemSnapshot, resolveDesignRuntime } from '@shared-contracts/domain/platform/design-system.js';
import { fetchDesignSystemSnapshot } from '../services/publicSite.js';
import analytics from '../services/analytics.js';

const fallbackSnapshot = createDesignSystemSnapshot();

const DesignSystemContext = createContext({
  snapshot: fallbackSnapshot,
  runtime: resolveDesignRuntime({ snapshot: fallbackSnapshot }),
  status: 'loading',
  error: null,
  lastFetchedAt: null,
  refresh: () => Promise.resolve(),
});

function normaliseSnapshot(payload) {
  if (!payload || typeof payload !== 'object' || !payload.version) {
    return fallbackSnapshot;
  }
  return payload;
}

export function DesignSystemProvider({ children, loader = fetchDesignSystemSnapshot, autoLoad = true }) {
  const [state, setState] = useState({
    snapshot: fallbackSnapshot,
    status: autoLoad ? 'loading' : 'ready',
    error: null,
    lastFetchedAt: null,
  });
  const lastTrackedRef = useRef({ version: null, componentTokenVersion: null });

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setState((previous) => ({ ...previous, status: 'loading', error: null }));
      }
      try {
        const response = await loader();
        const snapshot = normaliseSnapshot(response);
        const timestamp = new Date().toISOString();
        setState({ snapshot, status: 'ready', error: null, lastFetchedAt: timestamp });

        const previous = lastTrackedRef.current;
        const version = snapshot.version ?? 'unknown';
        const componentTokenVersion = snapshot.componentTokens?.version ?? 'unknown';
        if (previous.version !== version || previous.componentTokenVersion !== componentTokenVersion) {
          lastTrackedRef.current = { version, componentTokenVersion };
          analytics.setGlobalContext({
            designSystemVersion: version,
            componentTokenVersion,
          });
          analytics.track('designSystem.snapshot_hydrated', {
            version,
            componentTokenVersion,
            totalModes: snapshot.tokens?.modes ? Object.keys(snapshot.tokens.modes).length : null,
            totalAccents: snapshot.tokens?.accents ? Object.keys(snapshot.tokens.accents).length : null,
          });
        }
      } catch (error) {
        setState((previous) => ({ ...previous, status: 'error', error }));
      }
    },
    [loader],
  );

  useEffect(() => {
    if (!autoLoad) {
      return;
    }
    refresh({ silent: true });
  }, [autoLoad, refresh]);

  const runtime = useMemo(() => resolveDesignRuntime({ snapshot: state.snapshot }), [state.snapshot]);

  const { snapshot, status, error, lastFetchedAt } = state;

  const value = useMemo(
    () => ({
      snapshot,
      runtime,
      status,
      error,
      lastFetchedAt,
      refresh,
    }),
    [snapshot, runtime, status, error, lastFetchedAt, refresh],
  );

  return <DesignSystemContext.Provider value={value}>{children}</DesignSystemContext.Provider>;
}

DesignSystemProvider.propTypes = {
  children: PropTypes.node.isRequired,
  loader: PropTypes.func,
  autoLoad: PropTypes.bool,
};

export function useDesignSystem() {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error('useDesignSystem must be used within a DesignSystemProvider');
  }
  return context;
}

export default DesignSystemContext;
