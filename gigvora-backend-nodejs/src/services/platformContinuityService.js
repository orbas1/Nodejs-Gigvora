import { buildContinuityBootstrap, CONTINUITY_THEME_DEFAULTS } from '../../../shared-contracts/domain/platform/continuity-bootstrap.js';

function normaliseBoolean(value, fallback = true) {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (normalised === 'true') {
      return true;
    }
    if (normalised === 'false') {
      return false;
    }
  }
  return fallback;
}

function sanitiseThemeOverrides(overrides = {}) {
  const theme = { ...overrides };
  const normalised = {};
  if (typeof theme.mode === 'string') {
    normalised.mode = theme.mode.trim().toLowerCase();
  }
  if (typeof theme.accent === 'string') {
    normalised.accent = theme.accent.trim().toLowerCase();
  }
  if (typeof theme.density === 'string') {
    normalised.density = theme.density.trim().toLowerCase();
  }
  return normalised;
}

function buildMetadata({ actor, bootstrap, overrides }) {
  return {
    generatedAt: new Date().toISOString(),
    actorId: actor?.id ?? null,
    defaultsApplied: bootstrap?.theme?.defaults ?? CONTINUITY_THEME_DEFAULTS,
    overrides: overrides ?? {},
    sections: {
      hasRoutes: Boolean(bootstrap?.routes),
      hasComponents: Boolean(bootstrap?.components),
    },
  };
}

export function resolvePlatformContinuityBootstrap({
  actor = null,
  includeRoutes = true,
  includeComponents = true,
  themeOverrides = {},
} = {}) {
  const resolvedOverrides = sanitiseThemeOverrides(themeOverrides);
  const includeRoutesFlag = normaliseBoolean(includeRoutes, true);
  const includeComponentsFlag = normaliseBoolean(includeComponents, true);

  const bootstrap = buildContinuityBootstrap({
    includeRoutes: includeRoutesFlag,
    includeComponents: includeComponentsFlag,
    defaults: { theme: resolvedOverrides },
  });

  return {
    bootstrap,
    metadata: buildMetadata({ actor, bootstrap, overrides: resolvedOverrides }),
  };
}

export default {
  resolvePlatformContinuityBootstrap,
};
