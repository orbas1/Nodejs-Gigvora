import { freezeDeep } from '../utils/freezeDeep.js';
import {
  COMPONENT_TOKEN_VERSION,
  DEFAULT_COMPONENT_TOKENS,
  mergeComponentTokens,
} from './component-tokens.js';

export const DESIGN_SYSTEM_VERSION = '2025.04';

const BASE_SPACING = freezeDeep({
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
});

const BASE_RADII = freezeDeep({
  sm: '0.75rem',
  md: '1.5rem',
  lg: '2.75rem',
});

const TYPOGRAPHY_SCALES = freezeDeep({
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

const DENSITY_PRESETS = freezeDeep({
  spacious: 1.05,
  comfortable: 1,
  cozy: 0.92,
  compact: 0.85,
});

const MODE_TOKENS = freezeDeep({
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

const ACCENT_TOKENS = freezeDeep({
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

function normaliseKey(registry, value, fallback) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const key = value.trim().toLowerCase();
  return registry[key] ? key : fallback;
}

function pxToRem(px, scale) {
  return `${((px * scale) / 16).toFixed(3)}rem`;
}

function buildSpacing(scale) {
  return Object.fromEntries(
    Object.entries(BASE_SPACING).map(([key, value]) => {
      const numeric = Number.isFinite(value) ? value : Number.parseFloat(value);
      const px = Number.isFinite(numeric) ? numeric : 16;
      return [key, pxToRem(px, scale)];
    }),
  );
}

function buildRuntimeTokens({ mode, accent, density }) {
  const modeKey = normaliseKey(MODE_TOKENS, mode, 'light');
  const accentKey = normaliseKey(ACCENT_TOKENS, accent, 'azure');
  const densityKey = normaliseKey(DENSITY_PRESETS, density, 'comfortable');
  const scale = DENSITY_PRESETS[densityKey];

  const modeTokens = MODE_TOKENS[modeKey];
  const accentTokens = ACCENT_TOKENS[accentKey];

  return {
    colors: {
      ...modeTokens.colors,
      accent: accentTokens.accent,
      accentStrong: accentTokens.accentStrong,
      accentSoft: accentTokens.accentSoft,
      primary: accentTokens.primary,
      primarySoft: accentTokens.primarySoft,
    },
    spacing: buildSpacing(scale),
    radii: { ...BASE_RADII },
    typography: { ...TYPOGRAPHY_SCALES },
    shadows: { ...modeTokens.shadows },
    overlays: { ...modeTokens.overlays },
    density: scale,
  };
}

export function createDesignSystemSnapshot({
  version = DESIGN_SYSTEM_VERSION,
  mode = 'light',
  accent = 'azure',
  density = 'comfortable',
  componentTokens,
  componentTokenVersion = COMPONENT_TOKEN_VERSION,
  metadata = {},
  analytics,
} = {}) {
  const runtime = buildRuntimeTokens({ mode, accent, density });
  const mergedComponentTokens = mergeComponentTokens(componentTokens);

  const snapshot = {
    version,
    generatedAt: new Date().toISOString(),
    preferences: { mode, accent, density },
    tokens: {
      runtime,
      modes: MODE_TOKENS,
      accents: ACCENT_TOKENS,
      spacing: BASE_SPACING,
      radii: BASE_RADII,
      typography: TYPOGRAPHY_SCALES,
      densities: DENSITY_PRESETS,
    },
    componentTokens: {
      version: componentTokenVersion,
      registry: mergedComponentTokens,
    },
    metadata: {
      ...metadata,
      analytics: analytics ?? {
        paletteCount: Object.keys(ACCENT_TOKENS).length,
        modeCount: Object.keys(MODE_TOKENS).length,
        densityCount: Object.keys(DENSITY_PRESETS).length,
      },
    },
  };

  return freezeDeep(snapshot);
}

export function resolveDesignRuntime({ snapshot, mode, accent, density } = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : createDesignSystemSnapshot();
  const preferences = {
    mode: mode ?? source.preferences?.mode ?? 'light',
    accent: accent ?? source.preferences?.accent ?? 'azure',
    density: density ?? source.preferences?.density ?? 'comfortable',
  };
  const runtime = buildRuntimeTokens(preferences);
  return {
    modes: source.tokens?.modes ?? MODE_TOKENS,
    accents: source.tokens?.accents ?? ACCENT_TOKENS,
    densities: source.tokens?.densities ?? DENSITY_PRESETS,
    spacing: source.tokens?.spacing ?? BASE_SPACING,
    radii: source.tokens?.radii ?? BASE_RADII,
    typography: source.tokens?.typography ?? TYPOGRAPHY_SCALES,
    runtime,
    metadata: {
      version: source.version ?? DESIGN_SYSTEM_VERSION,
      generatedAt: source.generatedAt,
      analytics: source.metadata?.analytics ?? null,
      componentTokenVersion: source.componentTokens?.version ?? COMPONENT_TOKEN_VERSION,
    },
  };
}

export function withDesignTokens(snapshot, overrides = {}) {
  const base = snapshot && typeof snapshot === 'object' ? snapshot : createDesignSystemSnapshot();
  const mergedTokens = mergeComponentTokens(overrides.componentTokens ?? base.componentTokens?.registry ?? DEFAULT_COMPONENT_TOKENS);
  return createDesignSystemSnapshot({
    ...base.preferences,
    ...overrides,
    componentTokens: mergedTokens,
    componentTokenVersion: overrides.componentTokenVersion ?? base.componentTokens?.version ?? COMPONENT_TOKEN_VERSION,
    version: overrides.version ?? base.version ?? DESIGN_SYSTEM_VERSION,
  });
}

export default {
  DESIGN_SYSTEM_VERSION,
  createDesignSystemSnapshot,
  resolveDesignRuntime,
  withDesignTokens,
};
