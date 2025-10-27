import { freezeDeep } from '../utils/freezeDeep.js';

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
      focus: 'rgba(56, 189, 248, 0.3)',
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

const ACCENT_THEME_PRESETS = freezeDeep({
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

const DENSITY_SCALE = freezeDeep({
  spacious: 1.05,
  comfortable: 1,
  cozy: 0.92,
  compact: 0.85,
});

const BASE_SPACING_SCALE = freezeDeep({
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
});

const TYPOGRAPHY_PRESETS = freezeDeep({
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

const RADIUS_PRESETS = freezeDeep({
  sm: '0.75rem',
  md: '1.5rem',
  lg: '2.5rem',
});

const DEFAULT_THEME_SETTINGS = freezeDeep({
  mode: 'light',
  accent: 'azure',
  density: 'comfortable',
});

const SUPPORTED_THEME_MODES = Object.freeze(Object.keys(THEME_MODE_PRESETS));
const SUPPORTED_THEME_ACCENTS = Object.freeze(Object.keys(ACCENT_THEME_PRESETS));
const SUPPORTED_THEME_DENSITIES = Object.freeze(Object.keys(DENSITY_SCALE));

function normalisePreference(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return fallback;
  }
  return trimmed;
}

function colorToRgbTriplet(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const rgbMatch = trimmed.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const channels = rgbMatch[1]
      .split(',')
      .map((part) => part.trim())
      .slice(0, 3)
      .map((part) => {
        if (part.endsWith('%')) {
          const percent = Number.parseFloat(part.slice(0, -1));
          if (Number.isFinite(percent)) {
            return Math.round((percent / 100) * 255);
          }
          return 0;
        }
        const numeric = Number.parseFloat(part);
        return Number.isFinite(numeric) ? Math.round(numeric) : 0;
      });
    if (channels.every((channel) => Number.isFinite(channel))) {
      return channels.join(' ');
    }
  }

  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = Number.parseInt(hex[0] + hex[0], 16);
      const g = Number.parseInt(hex[1] + hex[1], 16);
      const b = Number.parseInt(hex[2] + hex[2], 16);
      if ([r, g, b].every((channel) => Number.isFinite(channel))) {
        return `${r} ${g} ${b}`;
      }
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      if ([r, g, b].every((channel) => Number.isFinite(channel))) {
        return `${r} ${g} ${b}`;
      }
    }
  }

  return null;
}

function scaleSpacing(densityKey) {
  const scale = DENSITY_SCALE[densityKey] ?? DENSITY_SCALE[DEFAULT_THEME_SETTINGS.density];
  return Object.fromEntries(
    Object.entries(BASE_SPACING_SCALE).map(([key, value]) => [key, Number((value * scale).toFixed(2))]),
  );
}

export function createDesignTokens(preferences = {}) {
  const mode = normalisePreference(preferences.mode, DEFAULT_THEME_SETTINGS.mode);
  const accent = normalisePreference(preferences.accent, DEFAULT_THEME_SETTINGS.accent);
  const density = normalisePreference(preferences.density, DEFAULT_THEME_SETTINGS.density);

  const modeTokens = THEME_MODE_PRESETS[mode] ?? THEME_MODE_PRESETS[DEFAULT_THEME_SETTINGS.mode];
  const accentTokens = ACCENT_THEME_PRESETS[accent] ?? ACCENT_THEME_PRESETS[DEFAULT_THEME_SETTINGS.accent];
  const spacing = scaleSpacing(density);

  return freezeDeep({
    mode,
    accent,
    density,
    colors: {
      ...modeTokens.colors,
      accent: accentTokens.accent,
      accentStrong: accentTokens.accentStrong,
      accentSoft: accentTokens.accentSoft,
      primary: accentTokens.primary,
      primarySoft: accentTokens.primarySoft,
    },
    spacing,
    radii: { ...RADIUS_PRESETS },
    typography: { ...TYPOGRAPHY_PRESETS },
    shadows: { ...modeTokens.shadows },
    overlays: { ...modeTokens.overlays },
  });
}

export function createCssVariableMap(tokens) {
  const toRem = (value) => `${(Number(value) / 16).toFixed(3)}rem`;
  const spacing = tokens.spacing ?? {};
  const colors = tokens.colors ?? {};
  const radii = tokens.radii ?? {};
  const shadows = tokens.shadows ?? {};
  const overlays = tokens.overlays ?? {};
  const typography = tokens.typography ?? {};

  const rgbEntries = {
    '--gv-color-background-rgb': colorToRgbTriplet(colors.background),
    '--gv-color-surface-rgb': colorToRgbTriplet(colors.surface),
    '--gv-color-primary-rgb': colorToRgbTriplet(colors.primary ?? colors.accent),
    '--gv-color-accent-rgb': colorToRgbTriplet(colors.accent),
    '--gv-color-text-rgb': colorToRgbTriplet(colors.text),
  };

  const cssVariables = {
    '--gv-color-background': colors.background,
    '--gv-color-surface': colors.surface,
    '--gv-color-surface-muted': colors.surfaceMuted,
    '--gv-color-surface-elevated': colors.surfaceElevated ?? colors.surface,
    '--gv-color-border': colors.border,
    '--gv-color-border-strong': colors.borderStrong ?? colors.border,
    '--gv-color-text': colors.text,
    '--gv-color-text-muted': colors.textMuted ?? colors.text,
    '--gv-color-primary': colors.primary ?? colors.accent,
    '--gv-color-primary-soft': colors.primarySoft ?? colors.accentSoft,
    '--gv-color-accent': colors.accent,
    '--gv-color-accent-strong': colors.accentStrong ?? colors.accent,
    '--gv-color-accent-soft': colors.accentSoft ?? 'rgba(37, 99, 235, 0.12)',
    '--gv-focus-ring': colors.focus ?? 'rgba(14, 165, 233, 0.35)',
    '--gv-font-sans': typography.fontSans ?? TYPOGRAPHY_PRESETS.fontSans,
    '--gv-font-mono': typography.fontMono ?? TYPOGRAPHY_PRESETS.fontMono,
    '--gv-space-xs': toRem(spacing.xs ?? BASE_SPACING_SCALE.xs),
    '--gv-space-sm': toRem(spacing.sm ?? BASE_SPACING_SCALE.sm),
    '--gv-space-md': toRem(spacing.md ?? BASE_SPACING_SCALE.md),
    '--gv-space-lg': toRem(spacing.lg ?? BASE_SPACING_SCALE.lg),
    '--gv-space-xl': toRem(spacing.xl ?? BASE_SPACING_SCALE.xl),
    '--gv-radius-sm': radii.sm ?? RADIUS_PRESETS.sm,
    '--gv-radius-md': radii.md ?? RADIUS_PRESETS.md,
    '--gv-radius-lg': radii.lg ?? RADIUS_PRESETS.lg,
    '--gv-shadow-soft': shadows.soft ?? THEME_MODE_PRESETS.light.shadows.soft,
    '--gv-shadow-subtle': shadows.subtle ?? THEME_MODE_PRESETS.light.shadows.subtle,
    '--gv-shadow-focus': shadows.focus ?? THEME_MODE_PRESETS.light.shadows.focus,
    '--shell-overlay-primary': overlays.shellPrimary ?? 'none',
    '--shell-overlay-desktop': overlays.shellDesktop ?? 'none',
  };

  Object.entries(rgbEntries).forEach(([key, value]) => {
    if (value) {
      cssVariables[key] = value;
    }
  });

  return cssVariables;
}

export function createThemeSnapshot(preferences = {}) {
  const tokens = createDesignTokens(preferences);
  const cssVariables = createCssVariableMap(tokens);

  return freezeDeep({
    metadata: {
      mode: tokens.mode,
      accent: tokens.accent,
      density: tokens.density,
    },
    tokens,
    cssVariables,
  });
}

export const DEFAULT_THEME_SNAPSHOT = createThemeSnapshot({
  mode: DEFAULT_THEME_SETTINGS.mode,
  accent: DEFAULT_THEME_SETTINGS.accent,
  density: DEFAULT_THEME_SETTINGS.density,
});

export {
  THEME_MODE_PRESETS,
  ACCENT_THEME_PRESETS,
  DENSITY_SCALE,
  BASE_SPACING_SCALE,
  TYPOGRAPHY_PRESETS,
  RADIUS_PRESETS,
  DEFAULT_THEME_SETTINGS,
  SUPPORTED_THEME_MODES,
  SUPPORTED_THEME_ACCENTS,
  SUPPORTED_THEME_DENSITIES,
  normalisePreference,
  colorToRgbTriplet,
  createThemeSnapshot,
  DEFAULT_THEME_SNAPSHOT,
};

export default {
  createDesignTokens,
  createCssVariableMap,
  createThemeSnapshot,
  THEME_MODE_PRESETS,
  ACCENT_THEME_PRESETS,
  DENSITY_SCALE,
  BASE_SPACING_SCALE,
  TYPOGRAPHY_PRESETS,
  RADIUS_PRESETS,
  DEFAULT_THEME_SETTINGS,
  SUPPORTED_THEME_MODES,
  SUPPORTED_THEME_ACCENTS,
  SUPPORTED_THEME_DENSITIES,
  DEFAULT_THEME_SNAPSHOT,
};
