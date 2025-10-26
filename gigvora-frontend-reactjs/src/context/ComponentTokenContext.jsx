import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  COMPONENT_TOKEN_VERSION,
  DEFAULT_COMPONENT_TOKENS,
  mergeComponentTokens,
} from '@shared-contracts/domain/platform/component-tokens.js';
import { fetchAppearanceComponentProfiles } from '../services/appearanceManagement.js';

const ComponentTokenContext = createContext({
  tokens: DEFAULT_COMPONENT_TOKENS,
  version: COMPONENT_TOKEN_VERSION,
  status: 'ready',
  error: null,
  refresh: null,
});

function normalizeOverrides(overrides) {
  if (!overrides || typeof overrides !== 'object') {
    return {};
  }
  return overrides;
}

export function ComponentTokenProvider({
  tokens,
  version,
  status = 'ready',
  error = null,
  refresh = null,
  children,
}) {
  const mergedTokens = useMemo(() => mergeComponentTokens(normalizeOverrides(tokens)), [tokens]);
  const contextValue = useMemo(
    () => ({
      tokens: mergedTokens,
      version: version ?? COMPONENT_TOKEN_VERSION,
      status,
      error,
      refresh: typeof refresh === 'function' ? refresh : null,
    }),
    [mergedTokens, version, status, error, refresh],
  );

  return <ComponentTokenContext.Provider value={contextValue}>{children}</ComponentTokenContext.Provider>;
}

ComponentTokenProvider.propTypes = {
  tokens: PropTypes.object,
  version: PropTypes.string,
  status: PropTypes.string,
  error: PropTypes.any,
  refresh: PropTypes.func,
  children: PropTypes.node.isRequired,
};

export function useComponentTokenContext() {
  const context = useContext(ComponentTokenContext);
  if (!context) {
    throw new Error('useComponentTokenContext must be used within a ComponentTokenProvider');
  }
  return context;
}

export function useComponentTokens(componentKey) {
  const context = useComponentTokenContext();
  if (!componentKey) {
    return context;
  }
  const registry = context.tokens ?? DEFAULT_COMPONENT_TOKENS;
  const tokenSet = registry[componentKey] ?? DEFAULT_COMPONENT_TOKENS[componentKey];
  return {
    ...context,
    tokens: tokenSet,
  };
}

function reduceProfilesToOverrides(profiles) {
  if (!Array.isArray(profiles)) {
    return {};
  }
  return profiles.reduce((acc, profile) => {
    if (profile?.componentKey && profile?.definition) {
      acc[profile.componentKey] = profile.definition;
    }
    return acc;
  }, {});
}

export function ComponentTokenHydrator({ themeId, autoLoad = true, loader, children }) {
  const [state, setState] = useState({
    status: autoLoad ? 'loading' : 'ready',
    tokens: {},
    version: COMPONENT_TOKEN_VERSION,
    error: null,
  });

  const fetcher = loader || fetchAppearanceComponentProfiles;

  const refresh = useCallback(
    async (options = {}) => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }));
      try {
        const response = await fetcher({ themeId, ...options });
        const profiles = response?.componentProfiles ?? response?.data?.componentProfiles ?? response?.data ?? [];
        const overrides = reduceProfilesToOverrides(profiles);
        const version = profiles.find((profile) => profile?.metadata?.version)?.metadata?.version
          ?? response?.version
          ?? COMPONENT_TOKEN_VERSION;
        setState({ status: 'ready', tokens: overrides, version, error: null });
      } catch (err) {
        setState((prev) => ({ ...prev, status: 'error', error: err }));
      }
    },
    [fetcher, themeId],
  );

  useEffect(() => {
    if (!autoLoad) {
      return;
    }
    refresh();
  }, [autoLoad, refresh, themeId]);

  return (
    <ComponentTokenProvider
      tokens={state.tokens}
      status={state.status}
      version={state.version}
      error={state.error}
      refresh={refresh}
    >
      {children}
    </ComponentTokenProvider>
  );
}

ComponentTokenHydrator.propTypes = {
  themeId: PropTypes.string,
  autoLoad: PropTypes.bool,
  loader: PropTypes.func,
  children: PropTypes.node.isRequired,
};

export default ComponentTokenContext;
