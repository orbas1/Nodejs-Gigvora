import baseModels from '../models/navigationChromeModels.js';
import logger from '../utils/logger.js';

let modelsContainer = baseModels;
let log = logger.child({ component: 'navigationChromeService' });

function getModels(strict = false) {
  const container = modelsContainer ?? baseModels;
  if (strict) {
    if (!container?.NavigationLocale || !container?.NavigationPersona || !container?.NavigationChromeConfig) {
      throw new Error('Navigation chrome models are not configured.');
    }
  }
  return container;
}

function refreshLogger(nextLogger) {
  if (nextLogger) {
    log = typeof nextLogger.child === 'function' ? nextLogger.child({ component: 'navigationChromeService' }) : nextLogger;
  } else {
    log = logger.child({ component: 'navigationChromeService' });
  }
}

export function __setDependencies({ models: overrides, logger: loggerOverride } = {}) {
  modelsContainer = overrides ?? baseModels;
  refreshLogger(loggerOverride);
}

export function __resetDependencies() {
  modelsContainer = baseModels;
  refreshLogger();
}

function normaliseLocale(instance) {
  const payload = instance.toPublicObject();
  return {
    code: payload.code,
    label: payload.label,
    nativeLabel: payload.nativeLabel,
    flag: payload.flag ?? '',
    region: payload.region ?? '',
    coverage: payload.coverage,
    status: payload.status,
    supportLead: payload.supportLead ?? '',
    lastUpdated: payload.lastUpdated,
    summary: payload.summary ?? '',
    direction: payload.direction ?? 'ltr',
    isDefault: Boolean(payload.isDefault),
    metadata: payload.metadata ?? {},
    sortOrder: payload.sortOrder ?? 0,
  };
}

function normalisePersona(instance) {
  const payload = instance.toPublicObject();
  return {
    key: payload.key,
    label: payload.label,
    icon: payload.icon ?? null,
    tagline: payload.tagline ?? '',
    focusAreas: payload.focusAreas ?? [],
    metrics: payload.metrics ?? [],
    primaryCta: payload.primaryCta ?? '',
    defaultRoute: payload.defaultRoute ?? null,
    timelineEnabled: Boolean(payload.timelineEnabled),
    metadata: payload.metadata ?? {},
    sortOrder: payload.sortOrder ?? 0,
  };
}

async function loadChromeConfigs() {
  const { NavigationChromeConfig } = getModels(true);
  const configs = await NavigationChromeConfig.findAll({ order: [['configKey', 'ASC']] });
  return configs.reduce((acc, config) => {
    const payload = config.toPublicObject();
    acc[payload.key] = payload.payload ?? {};
    return acc;
  }, {});
}

export async function listNavigationLocales() {
  const { NavigationLocale } = getModels(true);
  const locales = await NavigationLocale.findAll({ order: [['sortOrder', 'ASC'], ['code', 'ASC']] });
  return locales.map(normaliseLocale);
}

export async function listNavigationPersonas() {
  const { NavigationPersona } = getModels(true);
  const personas = await NavigationPersona.findAll({ order: [['sortOrder', 'ASC'], ['personaKey', 'ASC']] });
  return personas.map(normalisePersona);
}

export async function getNavigationChrome({ includeFooter = true } = {}) {
  const [locales, personas, configs] = await Promise.all([
    listNavigationLocales(),
    listNavigationPersonas(),
    includeFooter ? loadChromeConfigs().catch((error) => {
      log.warn({ error }, 'Failed to load navigation chrome configs');
      return {};
    }) : {},
  ]);

  const footer = includeFooter
    ? {
        navigationSections: Array.isArray(configs.footer_navigation_sections)
          ? configs.footer_navigation_sections
          : [],
        statusHighlights: Array.isArray(configs.footer_status_highlights) ? configs.footer_status_highlights : [],
        communityPrograms: Array.isArray(configs.footer_community_programs) ? configs.footer_community_programs : [],
        officeLocations: Array.isArray(configs.footer_office_locations) ? configs.footer_office_locations : [],
        certifications: Array.isArray(configs.footer_certifications) ? configs.footer_certifications : [],
        socialLinks: Array.isArray(configs.footer_social_links) ? configs.footer_social_links : [],
      }
    : null;

  const defaultLocale = locales.find((locale) => locale.isDefault)?.code ?? locales[0]?.code ?? 'en';
  const localeStatusCounts = locales.reduce(
    (acc, locale) => {
      const statusKey = locale.status ?? 'ga';
      acc[statusKey] = (acc[statusKey] ?? 0) + 1;
      return acc;
    },
    { ga: 0, beta: 0, preview: 0 },
  );
  const rtlLocales = locales.filter((locale) => locale.direction === 'rtl').map((locale) => locale.code);
  const timelineEnabledPersonaCount = personas.filter((persona) => persona.timelineEnabled).length;
  const personaJourneys = personas
    .map((persona) => persona.metadata?.journey)
    .filter((journey, index, arr) => Boolean(journey) && arr.indexOf(journey) === index);

  return {
    locales,
    personas,
    footer,
    metadata: {
      defaultLocale,
      personaCount: personas.length,
      updatedAt: new Date().toISOString(),
      localeStatusCounts,
      rtlLocales,
      timelineEnabledPersonaCount,
      personaJourneys,
    },
  };
}

export default {
  listNavigationLocales,
  listNavigationPersonas,
  getNavigationChrome,
  __setDependencies,
  __resetDependencies,
};
