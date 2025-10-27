import { freezeDeep } from '../utils/freezeDeep.js';
import ROUTE_COLLECTIONS, { flattenRouteRegistry } from './route-registry.js';
import {
  COMPONENT_TOKEN_VERSION,
  DEFAULT_COMPONENT_TOKENS,
} from './component-tokens.js';

const CONTINUITY_BOOTSTRAP_VERSION = '2025.03';

const THEME_MODE_PRESETS = freezeDeep({
  light: {
    colors: {
      background: '#f8fafc',
      surface: '#ffffff',
      surfaceMuted: '#f1f5f9',
      surfaceElevated: 'rgba(255, 255, 255, 0.92)',
      border: 'rgba(148, 163, 184, 0.45)',
      borderStrong: 'rgba(71, 85, 105, 0.6)',
      text: '#0f172a',
      textMuted: '#475569',
      textOnAccent: '#ffffff',
      focus: 'rgba(14, 165, 233, 0.35)',
    },
    shadows: {
      soft: '0 24px 60px -30px rgba(15, 23, 42, 0.25)',
      subtle: '0 10px 25px -15px rgba(15, 23, 42, 0.18)',
      focus: '0 0 0 4px rgba(14, 165, 233, 0.15)',
    },
    overlays: {
      shellPrimary: 'radial-gradient(circle at top, rgba(37, 99, 235, 0.15), transparent 60%)',
      shellDesktop: 'radial-gradient(circle at top right, rgba(219, 234, 254, 0.7), transparent 65%)',
    },
  },
  dark: {
    colors: {
      background: '#0b1120',
      surface: '#111827',
      surfaceMuted: 'rgba(30, 41, 59, 0.78)',
      surfaceElevated: 'rgba(30, 41, 59, 0.92)',
      border: 'rgba(148, 163, 184, 0.35)',
      borderStrong: 'rgba(226, 232, 240, 0.45)',
      text: '#e2e8f0',
      textMuted: '#cbd5f5',
      textOnAccent: '#0f172a',
      focus: 'rgba(14, 165, 233, 0.5)',
    },
    shadows: {
      soft: '0 28px 60px -28px rgba(15, 23, 42, 0.5)',
      subtle: '0 14px 32px -24px rgba(15, 23, 42, 0.6)',
      focus: '0 0 0 5px rgba(56, 189, 248, 0.3)',
    },
    overlays: {
      shellPrimary: 'radial-gradient(circle at top, rgba(56, 189, 248, 0.2), transparent 65%)',
      shellDesktop: 'radial-gradient(circle at top right, rgba(30, 64, 175, 0.6), transparent 70%)',
    },
  },
  'high-contrast': {
    colors: {
      background: '#ffffff',
      surface: '#ffffff',
      surfaceMuted: '#f8fafc',
      surfaceElevated: '#ffffff',
      border: '#000000',
      borderStrong: '#000000',
      text: '#000000',
      textMuted: '#0f172a',
      textOnAccent: '#000000',
      focus: '#000000',
    },
    shadows: {
      soft: '0 0 0 0 rgba(0, 0, 0, 0)',
      subtle: '0 0 0 0 rgba(0, 0, 0, 0)',
      focus: '0 0 0 3px #000000',
    },
    overlays: {
      shellPrimary: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
      shellDesktop: 'linear-gradient(120deg, #ffffff 0%, #e2e8f0 100%)',
    },
  },
});

const THEME_ACCENT_PRESETS = freezeDeep({
  azure: {
    accent: '#2563eb',
    accentStrong: '#1d4ed8',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    primary: '#2563eb',
    primarySoft: 'rgba(37, 99, 235, 0.08)',
  },
  violet: {
    accent: '#7c3aed',
    accentStrong: '#5b21b6',
    accentSoft: 'rgba(124, 58, 237, 0.14)',
    primary: '#7c3aed',
    primarySoft: 'rgba(124, 58, 237, 0.12)',
  },
  emerald: {
    accent: '#0f766e',
    accentStrong: '#0d5f59',
    accentSoft: 'rgba(15, 118, 110, 0.16)',
    primary: '#059669',
    primarySoft: 'rgba(5, 150, 105, 0.14)',
  },
  amber: {
    accent: '#d97706',
    accentStrong: '#b45309',
    accentSoft: 'rgba(217, 119, 6, 0.18)',
    primary: '#f59e0b',
    primarySoft: 'rgba(245, 158, 11, 0.16)',
  },
  rose: {
    accent: '#e11d48',
    accentStrong: '#be123c',
    accentSoft: 'rgba(225, 29, 72, 0.18)',
    primary: '#e11d48',
    primarySoft: 'rgba(225, 29, 72, 0.15)',
  },
});

const THEME_DENSITY_SCALE = freezeDeep({
  spacious: 1.05,
  comfortable: 1,
  cozy: 0.92,
  compact: 0.85,
});

const THEME_SPACING_BASE = freezeDeep({
  '2xs': 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
});

const THEME_TYPOGRAPHY_PRESETS = freezeDeep({
  fontSans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  fontMono:
    "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  heading: {
    xs: '600 0.75rem/1.4 var(--gv-font-sans)',
    sm: '600 0.875rem/1.4 var(--gv-font-sans)',
    md: '600 1.125rem/1.4 var(--gv-font-sans)',
    lg: '600 1.375rem/1.35 var(--gv-font-sans)',
    xl: '600 1.875rem/1.3 var(--gv-font-sans)',
  },
  body: {
    sm: '400 0.875rem/1.5 var(--gv-font-sans)',
    md: '400 1rem/1.6 var(--gv-font-sans)',
    lg: '400 1.125rem/1.65 var(--gv-font-sans)',
  },
  label: {
    sm: '600 0.75rem/1.3 var(--gv-font-sans)',
    md: '600 0.875rem/1.35 var(--gv-font-sans)',
  },
});

const THEME_RADIUS_PRESETS = freezeDeep({
  sm: '0.75rem',
  md: '1.5rem',
  lg: '2.5rem',
});

const THEME_DEFAULTS = freezeDeep({
  mode: 'system',
  accent: 'azure',
  density: 'comfortable',
});

export const CONTINUITY_THEME_BLUEPRINT = freezeDeep({
  modes: THEME_MODE_PRESETS,
  accents: THEME_ACCENT_PRESETS,
  densityScale: THEME_DENSITY_SCALE,
  spacing: THEME_SPACING_BASE,
  typography: THEME_TYPOGRAPHY_PRESETS,
  radii: THEME_RADIUS_PRESETS,
});

export const CONTINUITY_THEME_DEFAULTS = THEME_DEFAULTS;

function normaliseThemePreference(value, allowed, fallback) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const normalised = value.trim().toLowerCase();
  if (!normalised || (Array.isArray(allowed) && !allowed.includes(normalised))) {
    return fallback;
  }
  return normalised;
}

function buildThemeDefaults(overrides = {}) {
  const allowedModes = Object.keys(THEME_MODE_PRESETS);
  const allowedAccents = Object.keys(THEME_ACCENT_PRESETS);
  const allowedDensity = Object.keys(THEME_DENSITY_SCALE);
  return freezeDeep({
    mode: normaliseThemePreference(overrides.mode, [...allowedModes, 'system'], THEME_DEFAULTS.mode),
    accent: normaliseThemePreference(overrides.accent, allowedAccents, THEME_DEFAULTS.accent),
    density: normaliseThemePreference(overrides.density, allowedDensity, THEME_DEFAULTS.density),
  });
}

function buildSpacingForDensity(densityKey, blueprint = CONTINUITY_THEME_BLUEPRINT) {
  const densityScale = blueprint.densityScale?.[densityKey] ?? 1;
  const spacing = blueprint.spacing ?? {};
  return Object.fromEntries(
    Object.entries(spacing).map(([key, value]) => [key, Math.round((value ?? 0) * densityScale * 1000) / 1000]),
  );
}

export function resolveThemeTokens({
  mode = 'light',
  accent = 'azure',
  density = 'comfortable',
  blueprint = CONTINUITY_THEME_BLUEPRINT,
} = {}) {
  const modeKey = blueprint.modes?.[mode] ? mode : 'light';
  const accentKey = blueprint.accents?.[accent] ? accent : CONTINUITY_THEME_DEFAULTS.accent;
  const densityKey = blueprint.densityScale?.[density] ? density : CONTINUITY_THEME_DEFAULTS.density;

  const modeTokens = blueprint.modes?.[modeKey] ?? blueprint.modes.light;
  const accentTokens = blueprint.accents?.[accentKey] ?? blueprint.accents.azure;
  const spacing = buildSpacingForDensity(densityKey, blueprint);

  return freezeDeep({
    colors: {
      ...(modeTokens.colors ?? {}),
      accent: accentTokens.accent,
      accentStrong: accentTokens.accentStrong,
      accentSoft: accentTokens.accentSoft,
      primary: accentTokens.primary,
      primarySoft: accentTokens.primarySoft,
    },
    spacing,
    radii: blueprint.radii ?? {},
    typography: blueprint.typography ?? {},
    density: blueprint.densityScale?.[densityKey] ?? 1,
    shadows: modeTokens.shadows ?? {},
    overlays: modeTokens.overlays ?? {},
  });
}

export function buildContinuityBootstrap({
  includeRoutes = true,
  includeComponents = true,
  defaults = {},
} = {}) {
  const themeDefaults = buildThemeDefaults(defaults.theme ?? {});

  const payload = {
    version: CONTINUITY_BOOTSTRAP_VERSION,
    theme: {
      blueprint: CONTINUITY_THEME_BLUEPRINT,
      defaults: themeDefaults,
    },
    offline: {
      caches: {
        bootstrap: {
          version: '2025.03',
          ttlHours: 12,
          hydrate: ['theme', 'components', 'routes'],
        },
      },
      queue: {
        name: 'platform-continuity',
        maxRetries: 2,
      },
    },
  };

  if (includeComponents) {
    payload.components = {
      version: COMPONENT_TOKEN_VERSION,
      tokens: DEFAULT_COMPONENT_TOKENS,
    };
  }

  if (includeRoutes) {
    payload.routes = {
      collections: ROUTE_COLLECTIONS,
      registry: flattenRouteRegistry(),
    };
  }

  return freezeDeep(payload);
}

export {
  CONTINUITY_BOOTSTRAP_VERSION,
};

export default {
  CONTINUITY_BOOTSTRAP_VERSION,
  CONTINUITY_THEME_BLUEPRINT,
  CONTINUITY_THEME_DEFAULTS,
  resolveThemeTokens,
  buildContinuityBootstrap,
};
