import logger from '../utils/logger.js';
import { buildNavigationGovernanceSnapshot } from '../../../shared-contracts/domain/platform/navigation-governance.js';
import { flattenRouteRegistry } from '../../../shared-contracts/domain/platform/route-registry.js';
import { listNavigationLocales, listNavigationPersonas } from './navigationChromeService.js';

let currentLogger = logger.child({ component: 'navigationGovernanceService' });
let loadLocales = listNavigationLocales;
let loadPersonas = listNavigationPersonas;
let loadRoutes = () => flattenRouteRegistry();

export function __setDependencies({ logger: nextLogger, fetchLocales, fetchPersonas, fetchRoutes } = {}) {
  currentLogger = nextLogger
    ? typeof nextLogger.child === 'function'
      ? nextLogger.child({ component: 'navigationGovernanceService' })
      : nextLogger
    : logger.child({ component: 'navigationGovernanceService' });
  if (typeof fetchLocales === 'function') {
    loadLocales = fetchLocales;
  }
  if (typeof fetchPersonas === 'function') {
    loadPersonas = fetchPersonas;
  }
  if (typeof fetchRoutes === 'function') {
    loadRoutes = fetchRoutes;
  }
}

export function __resetDependencies() {
  currentLogger = logger.child({ component: 'navigationGovernanceService' });
  loadLocales = listNavigationLocales;
  loadPersonas = listNavigationPersonas;
  loadRoutes = () => flattenRouteRegistry();
}

export async function getNavigationGovernanceSnapshot({ includeRoutes = true } = {}) {
  const [locales, personas] = await Promise.all([
    loadLocales().catch((error) => {
      currentLogger.warn({ error }, 'Failed to load navigation locales for governance');
      return [];
    }),
    loadPersonas().catch((error) => {
      currentLogger.warn({ error }, 'Failed to load navigation personas for governance');
      return [];
    }),
  ]);

  let routes = [];
  if (includeRoutes) {
    try {
      const result = await loadRoutes();
      routes = Array.isArray(result) ? result : [];
    } catch (error) {
      currentLogger.warn({ error }, 'Failed to load route registry for governance snapshot');
      routes = [];
    }
  }

  return buildNavigationGovernanceSnapshot({ locales, personas, routes });
}

export default {
  getNavigationGovernanceSnapshot,
  __setDependencies,
  __resetDependencies,
};
