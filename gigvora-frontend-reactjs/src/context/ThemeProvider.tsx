import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import analytics from '../services/analytics.js';

const STORAGE_KEY = 'gigvora:web:theme:preferences';
const COLOR_SCHEME_ATTRIBUTE = 'color-scheme';
const DATA_THEME_MODE = 'themeMode';
const DATA_THEME_DENSITY = 'themeDensity';

const MODE_PRESETS = {
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
};

const ACCENT_PRESETS = {
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
};

const DENSITY_SCALE = {
  spacious: 1.05,
  comfortable: 1,
  cozy: 0.92,
  compact: 0.85,
};

const BASE_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};

const TYPOGRAPHY_PRESETS = {
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
};

const RADIUS_PRESETS = {
  sm: '0.75rem',
  md: '1.5rem',
  lg: '2.5rem',
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function detectSystemMode() {
  if (!isBrowser()) {
    return 'light';
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

function normalisePreference(value, fallback) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return fallback;
  }
  return trimmed;
}

function readStoredPreferences() {
  if (!isBrowser()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return {
      mode: normalisePreference(parsed.mode, 'system'),
      accent: normalisePreference(parsed.accent, 'azure'),
      density: normalisePreference(parsed.density, 'comfortable'),
    };
  } catch (error) {
    console.warn('Unable to read stored theme preferences', error);
    return null;
  }
}

function persistPreferences(preferences) {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Unable to persist theme preferences', error);
  }
}

function pxToRem(px, scale) {
  return `${((px * scale) / 16).toFixed(3)}rem`;
}

function applyCssVariables(tokens, mode, density, accentName) {
  if (!isBrowser()) {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty(COLOR_SCHEME_ATTRIBUTE, mode === 'dark' ? 'dark' : 'light');
  root.dataset[DATA_THEME_MODE] = mode;
  root.dataset[DATA_THEME_DENSITY] = density;
  if (accentName) {
    root.dataset.themeAccent = accentName;
  }

  const colors = tokens.colors ?? {};
  root.style.setProperty('--gv-color-background', colors.background);
  root.style.setProperty('--gv-color-surface', colors.surface);
  root.style.setProperty('--gv-color-surface-muted', colors.surfaceMuted);
  root.style.setProperty('--gv-color-surface-elevated', colors.surfaceElevated ?? colors.surface);
  root.style.setProperty('--gv-color-border', colors.border);
  root.style.setProperty('--gv-color-border-strong', colors.borderStrong ?? colors.border);
  root.style.setProperty('--gv-color-text', colors.text);
  root.style.setProperty('--gv-color-text-muted', colors.textMuted ?? colors.text);
  root.style.setProperty('--gv-color-primary', tokens.colors.primary ?? tokens.colors.accent);
  root.style.setProperty('--gv-color-primary-soft', tokens.colors.primarySoft ?? tokens.colors.accentSoft);
  root.style.setProperty('--gv-color-accent', tokens.colors.accent);
  root.style.setProperty('--gv-color-accent-strong', tokens.colors.accentStrong ?? tokens.colors.accent);
  root.style.setProperty('--gv-color-accent-soft', tokens.colors.accentSoft ?? 'rgba(37, 99, 235, 0.1)');
  root.style.setProperty('--gv-focus-ring', colors.focus ?? 'rgba(14, 165, 233, 0.35)');

  const spacing = tokens.spacing ?? {};
  root.style.setProperty('--gv-space-xs', spacing.xs);
  root.style.setProperty('--gv-space-sm', spacing.sm);
  root.style.setProperty('--gv-space-md', spacing.md);
  root.style.setProperty('--gv-space-lg', spacing.lg);
  root.style.setProperty('--gv-space-xl', spacing.xl);

  const radii = tokens.radii ?? {};
  root.style.setProperty('--gv-radius-sm', radii.sm ?? '0.75rem');
  root.style.setProperty('--gv-radius-md', radii.md ?? '1.5rem');
  root.style.setProperty('--gv-radius-lg', radii.lg ?? '2.5rem');

  const shadows = tokens.shadows ?? {};
  root.style.setProperty('--gv-shadow-soft', shadows.soft ?? '0 24px 60px -30px rgba(15, 23, 42, 0.25)');
  root.style.setProperty('--gv-shadow-subtle', shadows.subtle ?? '0 10px 25px -15px rgba(15, 23, 42, 0.18)');
  root.style.setProperty('--gv-shadow-focus', shadows.focus ?? '0 0 0 4px rgba(14, 165, 233, 0.15)');

  const overlays = tokens.overlays ?? {};
  root.style.setProperty('--shell-overlay-primary', overlays.shellPrimary ?? 'none');
  root.style.setProperty('--shell-overlay-desktop', overlays.shellDesktop ?? 'none');

  const typography = tokens.typography ?? {};
  if (typography.fontSans) {
    root.style.setProperty('--gv-font-sans', typography.fontSans);
  }
  if (typography.fontMono) {
    root.style.setProperty('--gv-font-mono', typography.fontMono);
  }
  const heading = typography.heading ?? {};
  Object.entries(heading).forEach(([key, value]) => {
    root.style.setProperty(`--gv-font-heading-${key}`, value);
  });
  const body = typography.body ?? {};
  Object.entries(body).forEach(([key, value]) => {
    root.style.setProperty(`--gv-font-body-${key}`, value);
  });
  const label = typography.label ?? {};
  Object.entries(label).forEach(([key, value]) => {
    root.style.setProperty(`--gv-font-label-${key}`, value);
  });

  if (tokens.density) {
    root.style.setProperty('--gv-density-scale', `${tokens.density}`);
  }
}

const defaultThemeValue = {
  mode: 'light',
  preference: 'system',
  accent: 'azure',
  density: 'comfortable',
  tokens: {
    colors: {},
    spacing: {},
    radii: {},
    typography: {},
    shadows: {},
    overlays: {},
  },
  setMode: () => {},
  setAccent: () => {},
  setDensity: () => {},
  registerComponentTokens: () => {},
  removeComponentTokens: () => {},
  resolveComponentTokens: () => defaultThemeValue.tokens,
};

const ThemeContext = createContext(defaultThemeValue);

export function ThemeProvider({ children }) {
  const stored = readStoredPreferences();
  const [modePreference, setModePreference] = useState(stored?.mode ?? 'system');
  const [accent, setAccentState] = useState(stored?.accent ?? 'azure');
  const [density, setDensityState] = useState(stored?.density ?? 'comfortable');
  const [systemMode, setSystemMode] = useState(detectSystemMode);

  const componentTokensRef = useRef(new Map());
  const lastTrackedRef = useRef({ mode: null, accent: null, density: null });

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      setSystemMode(event.matches ? 'dark' : 'light');
    };
    handleChange(mediaQuery);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const resolvedMode = modePreference === 'system' ? systemMode : modePreference;

  const tokens = useMemo(() => {
    const modeTokens = MODE_PRESETS[resolvedMode] ?? MODE_PRESETS.light;
    const accentTokens = ACCENT_PRESETS[accent] ?? ACCENT_PRESETS.azure;
    const densityScale = DENSITY_SCALE[density] ?? DENSITY_SCALE.comfortable;

    const spacing = Object.fromEntries(
      Object.entries(BASE_SPACING).map(([key, value]) => [key, pxToRem(value, densityScale)]),
    );

    return {
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
      density: densityScale,
      shadows: { ...modeTokens.shadows },
      overlays: { ...modeTokens.overlays },
    };
  }, [accent, density, resolvedMode]);

  useEffect(() => {
    applyCssVariables(tokens, resolvedMode, density, accent);
  }, [tokens, resolvedMode, density, accent]);

  useEffect(() => {
    persistPreferences({ mode: modePreference, accent, density });
  }, [modePreference, accent, density]);

  useEffect(() => {
    const previous = lastTrackedRef.current;
    if (previous.mode === resolvedMode && previous.accent === accent && previous.density === density) {
      return;
    }
    lastTrackedRef.current = { mode: resolvedMode, accent, density };
    analytics.setGlobalContext({
      themeMode: resolvedMode,
      themeAccent: accent,
      themeDensity: density,
    });
    analytics.track('theme.preferences_applied', {
      mode: resolvedMode,
      accent,
      density,
    });
  }, [accent, density, resolvedMode]);

  const updateComponentTokens = useCallback((componentName, overrides) => {
    if (!componentName) {
      return;
    }
    const key = `${componentName}`.trim();
    if (!key) {
      return;
    }
    const existing = componentTokensRef.current.get(key) ?? {};
    const next = {
      ...existing,
      ...overrides,
    };
    componentTokensRef.current.set(key, next);
  }, []);

  const removeComponentTokens = useCallback((componentName) => {
    if (!componentName) {
      return;
    }
    componentTokensRef.current.delete(`${componentName}`.trim());
  }, []);

  const resolveComponentTokens = useCallback(
    (componentName) => {
      if (!componentName) {
        return tokens;
      }
      const overrides = componentTokensRef.current.get(`${componentName}`.trim());
      if (!overrides) {
        return tokens;
      }
      return {
        ...tokens,
        ...overrides,
        colors: { ...tokens.colors, ...(overrides.colors ?? {}) },
        spacing: { ...tokens.spacing, ...(overrides.spacing ?? {}) },
        radii: { ...tokens.radii, ...(overrides.radii ?? {}) },
        shadows: { ...tokens.shadows, ...(overrides.shadows ?? {}) },
        overlays: { ...tokens.overlays, ...(overrides.overlays ?? {}) },
        typography: { ...tokens.typography, ...(overrides.typography ?? {}) },
      };
    },
    [tokens],
  );

  const setMode = useCallback(
    (nextMode) => {
      const normalised = normalisePreference(nextMode, modePreference);
      const supported = ['light', 'dark', 'high-contrast', 'system'];
      const value = supported.includes(normalised) ? normalised : modePreference;
      if (value === modePreference) {
        return;
      }
      analytics.track('theme.mode_changed', { nextMode: value, previousMode: modePreference });
      setModePreference(value);
    },
    [modePreference],
  );

  const setAccent = useCallback(
    (nextAccent) => {
      const normalised = normalisePreference(nextAccent, accent);
      if (!ACCENT_PRESETS[normalised] || normalised === accent) {
        return;
      }
      analytics.track('theme.accent_changed', { nextAccent: normalised, previousAccent: accent });
      setAccentState(normalised);
    },
    [accent],
  );

  const setDensity = useCallback(
    (nextDensity) => {
      const normalised = normalisePreference(nextDensity, density);
      if (!DENSITY_SCALE[normalised] || normalised === density) {
        return;
      }
      analytics.track('theme.density_changed', { nextDensity: normalised, previousDensity: density });
      setDensityState(normalised);
    },
    [density],
  );

  const value = useMemo(
    () => ({
      mode: resolvedMode,
      preference: modePreference,
      accent,
      density,
      tokens,
      setMode,
      setAccent,
      setDensity,
      registerComponentTokens: updateComponentTokens,
      removeComponentTokens,
      resolveComponentTokens,
    }),
    [accent, density, modePreference, resolvedMode, tokens, setMode, setAccent, setDensity, updateComponentTokens, removeComponentTokens, resolveComponentTokens],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;
