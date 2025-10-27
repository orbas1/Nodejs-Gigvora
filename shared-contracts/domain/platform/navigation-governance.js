import { freezeDeep } from '../utils/freezeDeep.js';
import { flattenRouteRegistry } from './route-registry.js';

export const NAVIGATION_GOVERNANCE_VERSION = '2025.04';

function normaliseArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.filter(Boolean);
}

function cloneLocales(locales) {
  return normaliseArray(locales).map((locale) => ({
    code: locale.code,
    label: locale.label,
    nativeLabel: locale.nativeLabel,
    flag: locale.flag ?? '',
    region: locale.region ?? '',
    coverage: typeof locale.coverage === 'number' ? locale.coverage : null,
    status: locale.status ?? 'preview',
    direction: locale.direction ?? 'ltr',
    isDefault: Boolean(locale.isDefault),
    metadata: locale.metadata ?? {},
  }));
}

function clonePersonas(personas) {
  return normaliseArray(personas).map((persona) => ({
    key: persona.key ?? persona.personaKey,
    label: persona.label,
    icon: persona.icon ?? null,
    tagline: persona.tagline ?? '',
    focusAreas: Array.isArray(persona.focusAreas) ? persona.focusAreas : [],
    metrics: Array.isArray(persona.metrics) ? persona.metrics : [],
    primaryCta: persona.primaryCta ?? '',
    defaultRoute: persona.defaultRoute ?? null,
    timelineEnabled: Boolean(persona.timelineEnabled),
    metadata: persona.metadata ?? {},
  }));
}

function mapRoutes(routes) {
  const canonicalRoutes = normaliseArray(routes).map((route) => ({
    routeId: route.routeId ?? `${route.collection || 'misc'}:${route.absolutePath || route.path}`,
    collection: route.collection ?? 'misc',
    path: route.path ?? '/',
    absolutePath: route.absolutePath ?? route.path ?? '/',
    title: route.title ?? null,
    persona: route.persona ?? null,
    featureFlag: route.featureFlag ?? null,
    module: route.module ?? route.modulePath ?? null,
    icon: route.icon ?? null,
    shellTheme: route.shellTheme ?? null,
    metadata: route.metadata ?? {},
  }));
  return canonicalRoutes;
}

function detectDuplicateRoutes(routes) {
  const counts = new Map();
  routes.forEach((route) => {
    const key = route.absolutePath;
    if (!counts.has(key)) {
      counts.set(key, []);
    }
    counts.get(key).push(route);
  });
  return Array.from(counts.values())
    .filter((list) => list.length > 1)
    .map((list) => ({
      path: list[0].absolutePath,
      count: list.length,
      collections: Array.from(new Set(list.map((entry) => entry.collection))).sort(),
      personas: Array.from(new Set(list.map((entry) => entry.persona).filter(Boolean))).sort(),
    }));
}

function buildPersonaCoverage(personas, routes) {
  const coverage = new Map();
  routes.forEach((route) => {
    const key = route.persona ?? 'unspecified';
    coverage.set(key, (coverage.get(key) ?? 0) + 1);
  });
  return personas.map((persona) => ({
    key: persona.key,
    label: persona.label,
    routes: coverage.get(persona.key) ?? 0,
    defaultRoute: persona.defaultRoute,
  }));
}

function buildLocaleCoverage(locales) {
  if (!locales.length) {
    return { total: 0, averageCoverage: 0, gaLocales: 0, rtlLocales: 0 };
  }
  const totals = locales.reduce(
    (acc, locale) => {
      const value = typeof locale.coverage === 'number' ? locale.coverage : 0;
      return {
        coverage: acc.coverage + value,
        gaLocales: acc.gaLocales + (locale.status === 'ga' ? 1 : 0),
        rtlLocales: acc.rtlLocales + (locale.direction === 'rtl' ? 1 : 0),
      };
    },
    { coverage: 0, gaLocales: 0, rtlLocales: 0 },
  );
  return {
    total: locales.length,
    averageCoverage: Number((totals.coverage / locales.length).toFixed(2)),
    gaLocales: totals.gaLocales,
    rtlLocales: totals.rtlLocales,
  };
}

function buildCollections(routes) {
  const grouped = new Map();
  routes.forEach((route) => {
    const collection = route.collection ?? 'misc';
    if (!grouped.has(collection)) {
      grouped.set(collection, []);
    }
    grouped.get(collection).push(route);
  });
  return Array.from(grouped.entries())
    .map(([collection, items]) => ({
      key: collection,
      routeCount: items.length,
      personas: Array.from(new Set(items.map((item) => item.persona).filter(Boolean))).sort(),
      featureFlags: Array.from(new Set(items.map((item) => item.featureFlag).filter(Boolean))).sort(),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function buildNavigationGovernanceSnapshot({
  version = NAVIGATION_GOVERNANCE_VERSION,
  locales = [],
  personas = [],
  routes,
  metadata = {},
} = {}) {
  const resolvedLocales = cloneLocales(locales);
  const resolvedPersonas = clonePersonas(personas);
  const resolvedRoutes = mapRoutes(routes ?? flattenRouteRegistry());
  const duplicates = detectDuplicateRoutes(resolvedRoutes);
  const personaCoverage = buildPersonaCoverage(resolvedPersonas, resolvedRoutes);
  const localeCoverage = buildLocaleCoverage(resolvedLocales);
  const collections = buildCollections(resolvedRoutes);

  const snapshot = {
    version,
    generatedAt: new Date().toISOString(),
    locales: resolvedLocales,
    personas: resolvedPersonas,
    taxonomy: {
      collections,
      duplicatePaths: duplicates,
    },
    analytics: {
      totalRoutes: resolvedRoutes.length,
      duplicatePathCount: duplicates.length,
      personasTracked: resolvedPersonas.length,
      localesTracked: resolvedLocales.length,
      personaCoverage,
      localeCoverage,
    },
    metadata,
  };

  return freezeDeep(snapshot);
}

export default {
  NAVIGATION_GOVERNANCE_VERSION,
  buildNavigationGovernanceSnapshot,
};
