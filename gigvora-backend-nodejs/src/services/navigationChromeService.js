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
    playbooks: Array.isArray(payload.playbooks) ? payload.playbooks : [],
    lastReviewedAt: payload.lastReviewedAt ?? null,
    metadata: payload.metadata ?? {},
    sortOrder: payload.sortOrder ?? 0,
  };
}

function normaliseStatusPageConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const toStringOrNull = (value) => {
    if (value == null) {
      return null;
    }
    const trimmed = `${value}`.trim();
    return trimmed.length ? trimmed : null;
  };

  const incidents = Array.isArray(raw.incidents)
    ? raw.incidents
        .map((incident) => {
          if (!incident || typeof incident !== 'object') {
            return null;
          }
          const id = toStringOrNull(incident.id) ?? toStringOrNull(incident.label);
          const occurredAt = incident.occurredAt ? new Date(incident.occurredAt).toISOString() : null;
          const resolvedAt = incident.resolvedAt ? new Date(incident.resolvedAt).toISOString() : null;
          const label = toStringOrNull(incident.label);
          const summary = toStringOrNull(incident.summary);
          if (!id && !label && !summary) {
            return null;
          }
          return {
            id,
            label,
            summary,
            occurredAt,
            resolvedAt,
          };
        })
        .filter(Boolean)
    : [];

  const insights = Array.isArray(raw.insights)
    ? raw.insights
        .map((entry) => toStringOrNull(entry))
        .filter((entry) => entry !== null)
    : [];

  return {
    title: toStringOrNull(raw.title),
    description: toStringOrNull(raw.description),
    state: toStringOrNull(raw.state) ?? 'ready',
    url: toStringOrNull(raw.url),
    helpLabel: toStringOrNull(raw.helpLabel),
    lastReviewedAt: raw.lastReviewedAt ? new Date(raw.lastReviewedAt).toISOString() : null,
    insights,
    incidents,
    footnote: toStringOrNull(raw.footnote),
  };
}

function normaliseDataResidencyConfig(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const region = `${entry.region ?? ''}`.trim();
      const city = `${entry.city ?? ''}`.trim();
      if (!region && !city) {
        return null;
      }
      const status = `${entry.status ?? ''}`.trim();
      return {
        region: region || null,
        city: city || null,
        status: status || null,
      };
    })
    .filter(Boolean);
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
        statusPage: normaliseStatusPageConfig(configs.footer_status_page),
        dataResidency: normaliseDataResidencyConfig(configs.footer_data_residency),
      }
    : null;

  return {
    locales,
    personas,
    footer,
    metadata: {
      defaultLocale: locales.find((locale) => locale.isDefault)?.code ?? locales[0]?.code ?? 'en',
      personaCount: personas.length,
      updatedAt: new Date().toISOString(),
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
