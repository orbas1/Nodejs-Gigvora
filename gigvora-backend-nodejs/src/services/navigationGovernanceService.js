import { createHash } from 'node:crypto';
import logger from '../utils/logger.js';
import { NavigationGovernanceAudit } from '../models/navigationGovernanceModels.js';
import { buildNavigationGovernanceSnapshot } from '../../../shared-contracts/domain/platform/navigation-governance.js';
import { listNavigationLocales, listNavigationPersonas } from './navigationChromeService.js';
import { listRouteRegistry } from './routeRegistryService.js';

let currentLogger = logger.child({ component: 'navigationGovernanceService' });
let loadLocales = listNavigationLocales;
let loadPersonas = listNavigationPersonas;
let loadRoutes = () => listRouteRegistry({ includeInactive: false });
let auditModel = NavigationGovernanceAudit;

function toPlain(record) {
  if (!record) {
    return null;
  }
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (typeof record.toJSON === 'function') {
    return record.toJSON();
  }
  return record;
}

function cloneSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }
  return JSON.parse(JSON.stringify(snapshot));
}

async function persistGovernanceAudit(snapshot) {
  if (!auditModel) {
    return null;
  }

  try {
    const serialised = cloneSnapshot(snapshot);
    const hashPayload = { ...serialised, generatedAt: null };
    const checksum = createHash('sha256').update(JSON.stringify(hashPayload)).digest('hex');
    const latestRecord = await auditModel.findOne({ order: [['generatedAt', 'DESC']] });
    const latestPlain = toPlain(latestRecord);
    if (latestPlain?.checksum === checksum) {
      return latestPlain;
    }

    const analytics = serialised.analytics ?? {};
    const payload = {
      snapshotVersion: serialised.version,
      localeCount: analytics.localesTracked ?? serialised.locales?.length ?? 0,
      personaCount: analytics.personasTracked ?? serialised.personas?.length ?? 0,
      routeCount: analytics.totalRoutes ?? 0,
      duplicateRouteCount: analytics.duplicatePathCount ?? 0,
      personaCoverage: analytics.personaCoverage ?? [],
      localeCoverage: analytics.localeCoverage ?? {},
      taxonomy: serialised.taxonomy ?? {},
      metadata: serialised.metadata ?? {},
      checksum,
      generatedBy: 'navigation-governance-service',
      generatedAt: serialised.generatedAt ? new Date(serialised.generatedAt) : new Date(),
    };

    const created = await auditModel.create(payload);
    return toPlain(created) ?? payload;
  } catch (error) {
    currentLogger.warn({ error }, 'Failed to persist navigation governance audit');
    return null;
  }
}

export function __setDependencies({
  logger: nextLogger,
  fetchLocales,
  fetchPersonas,
  fetchRoutes,
  auditModel: nextAuditModel,
} = {}) {
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
  if (nextAuditModel) {
    auditModel = nextAuditModel;
  }
}

export function __resetDependencies() {
  currentLogger = logger.child({ component: 'navigationGovernanceService' });
  loadLocales = listNavigationLocales;
  loadPersonas = listNavigationPersonas;
  loadRoutes = () => listRouteRegistry({ includeInactive: false });
  auditModel = NavigationGovernanceAudit;
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

  const snapshot = buildNavigationGovernanceSnapshot({ locales, personas, routes });

  if (includeRoutes) {
    await persistGovernanceAudit(snapshot);
  }

  return snapshot;
}

export default {
  getNavigationGovernanceSnapshot,
  __setDependencies,
  __resetDependencies,
};
