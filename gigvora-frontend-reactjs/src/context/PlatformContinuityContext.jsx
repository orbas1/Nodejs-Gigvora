import { createContext, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  buildContinuityBootstrap,
} from '@shared-contracts/domain/platform/continuity-bootstrap.js';
import useCachedResource from '../hooks/useCachedResource.js';
import { apiClient } from '../services/apiClient.js';
import { ComponentTokenProvider } from './ComponentTokenContext.jsx';

const FALLBACK_BOOTSTRAP = buildContinuityBootstrap();

const PlatformContinuityContext = createContext({
  bootstrap: FALLBACK_BOOTSTRAP,
  loading: false,
  error: null,
  refresh: () => Promise.resolve(),
  fromCache: false,
  lastUpdated: null,
});

function normaliseBootstrap(payload) {
  if (!payload || typeof payload !== 'object') {
    return FALLBACK_BOOTSTRAP;
  }

  const theme = payload.theme && typeof payload.theme === 'object' ? payload.theme : {};
  const components = payload.components && typeof payload.components === 'object' ? payload.components : null;
  const routes = payload.routes && typeof payload.routes === 'object' ? payload.routes : null;

  const resolvedComponents = components
    ? {
        version: components.version ?? FALLBACK_BOOTSTRAP.components?.version ?? null,
        tokens: components.tokens ?? FALLBACK_BOOTSTRAP.components?.tokens,
      }
    : FALLBACK_BOOTSTRAP.components;

  const resolvedRoutes = routes
    ? {
        collections: routes.collections ?? FALLBACK_BOOTSTRAP.routes?.collections,
        registry: Array.isArray(routes.registry)
          ? routes.registry
          : FALLBACK_BOOTSTRAP.routes?.registry ?? [],
      }
    : FALLBACK_BOOTSTRAP.routes;

  return {
    version: payload.version ?? FALLBACK_BOOTSTRAP.version,
    theme: {
      blueprint: theme.blueprint ?? FALLBACK_BOOTSTRAP.theme.blueprint,
      defaults: theme.defaults ?? FALLBACK_BOOTSTRAP.theme.defaults,
    },
    components: resolvedComponents,
    routes: resolvedRoutes,
    offline: payload.offline ?? FALLBACK_BOOTSTRAP.offline,
  };
}

export function PlatformContinuityProvider({ children, initialBootstrap = null }) {
  const baseBootstrap = initialBootstrap ? normaliseBootstrap(initialBootstrap) : FALLBACK_BOOTSTRAP;

  const resource = useCachedResource(
    'platform:continuity:bootstrap',
    async ({ signal }) => {
      const response = await apiClient.get('/platform/continuity/bootstrap', { signal });
      return normaliseBootstrap(response?.bootstrap ?? response);
    },
    { ttl: 1000 * 60 * 60 * 12 },
  );

  const bootstrap = resource.data ?? baseBootstrap;

  const contextValue = useMemo(
    () => ({
      bootstrap,
      loading: resource.loading,
      error: resource.error,
      refresh: resource.refresh,
      fromCache: resource.fromCache,
      lastUpdated: resource.lastUpdated,
    }),
    [bootstrap, resource.loading, resource.error, resource.refresh, resource.fromCache, resource.lastUpdated],
  );

  const componentTokens = bootstrap.components?.tokens;
  const componentVersion = bootstrap.components?.version ?? undefined;
  const componentStatus = resource.loading ? 'loading' : 'ready';

  return (
    <PlatformContinuityContext.Provider value={contextValue}>
      <ComponentTokenProvider
        tokens={componentTokens}
        version={componentVersion}
        status={componentStatus}
        error={resource.error}
        refresh={resource.refresh}
      >
        {children}
      </ComponentTokenProvider>
    </PlatformContinuityContext.Provider>
  );
}

PlatformContinuityProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialBootstrap: PropTypes.object,
};

export function usePlatformContinuity() {
  const context = useContext(PlatformContinuityContext);
  if (!context) {
    throw new Error('usePlatformContinuity must be used within a PlatformContinuityProvider');
  }
  return context;
}

export default PlatformContinuityContext;
