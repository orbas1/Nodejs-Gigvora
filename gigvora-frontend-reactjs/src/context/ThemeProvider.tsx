import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  CONTINUITY_THEME_BLUEPRINT,
  CONTINUITY_THEME_DEFAULTS,
  resolveThemeTokens,
} from '@shared-contracts/domain/platform/continuity-bootstrap.js';
import { usePlatformContinuity } from './PlatformContinuityContext.jsx';
import analytics from '../services/analytics.js';

const STORAGE_KEY = 'gigvora:web:theme:preferences';
const COLOR_SCHEME_ATTRIBUTE = 'color-scheme';
const DATA_THEME_MODE = 'themeMode';
const DATA_THEME_DENSITY = 'themeDensity';


function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function detectSystemMode() {
  if (!isBrowser()) {
    return 'light';
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

function normalisePreference(value, fallback, allowed) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return fallback;
  }
  if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(trimmed)) {
    return fallback;
  }
  return trimmed;
}

function readStoredPreferences(defaults = CONTINUITY_THEME_DEFAULTS, allowed = {}) {
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
      mode: normalisePreference(
        parsed.mode,
        defaults?.mode ?? 'system',
        Array.isArray(allowed.modes) ? allowed.modes : undefined,
      ),
      accent: normalisePreference(
        parsed.accent,
        defaults?.accent ?? 'azure',
        Array.isArray(allowed.accents) ? allowed.accents : undefined,
      ),
      density: normalisePreference(
        parsed.density,
        defaults?.density ?? 'comfortable',
        Array.isArray(allowed.densities) ? allowed.densities : undefined,
      ),
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

function pxToRem(px) {
  if (typeof px === 'string') {
    const trimmed = px.trim();
    if (trimmed.endsWith('rem') || trimmed.endsWith('px')) {
      return trimmed;
    }
  }
  const numeric = typeof px === 'number' ? px : Number.parseFloat(`${px ?? ''}`);
  if (!Number.isFinite(numeric)) {
    return typeof px === 'string' ? px : `${px}`;
  }
  return `${(numeric / 16).toFixed(3)}rem`;
}

function applyCssVariables(tokens, mode, density) {
  if (!isBrowser()) {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty(COLOR_SCHEME_ATTRIBUTE, mode === 'dark' ? 'dark' : 'light');
  root.dataset[DATA_THEME_MODE] = mode;
  root.dataset[DATA_THEME_DENSITY] = density;

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
  const { bootstrap } = usePlatformContinuity();
  const blueprint = bootstrap?.theme?.blueprint ?? CONTINUITY_THEME_BLUEPRINT;
  const defaults = bootstrap?.theme?.defaults ?? CONTINUITY_THEME_DEFAULTS;

  const modeOptions = useMemo(() => Object.keys(blueprint?.modes ?? {}), [blueprint]);
  const accentOptions = useMemo(() => Object.keys(blueprint?.accents ?? {}), [blueprint]);
  const densityOptions = useMemo(() => Object.keys(blueprint?.densityScale ?? {}), [blueprint]);

  const allowedSets = useMemo(
    () => ({
      modes: [...modeOptions, 'system'],
      accents: accentOptions,
      densities: densityOptions,
    }),
    [modeOptions, accentOptions, densityOptions],
  );

  const stored = useMemo(() => readStoredPreferences(defaults, allowedSets), [defaults, allowedSets]);

  const [modePreference, setModePreference] = useState(() => stored?.mode ?? defaults.mode ?? 'system');
  const [accent, setAccentState] = useState(() => stored?.accent ?? defaults.accent ?? 'azure');
  const [density, setDensityState] = useState(() => stored?.density ?? defaults.density ?? 'comfortable');
  const [systemMode, setSystemMode] = useState(detectSystemMode);

  const modeSet = useMemo(() => new Set(allowedSets.modes ?? []), [allowedSets]);
  const accentSet = useMemo(() => new Set(allowedSets.accents ?? []), [allowedSets]);
  const densitySet = useMemo(() => new Set(allowedSets.densities ?? []), [allowedSets]);

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

  useEffect(() => {
    const expectedMode = modeSet.has(modePreference) ? modePreference : defaults.mode ?? 'system';
    if (modePreference !== expectedMode) {
      setModePreference(expectedMode);
    }
    const expectedAccent = accentSet.has(accent) ? accent : defaults.accent ?? 'azure';
    if (accent !== expectedAccent) {
      setAccentState(expectedAccent);
    }
    const expectedDensity = densitySet.has(density) ? density : defaults.density ?? 'comfortable';
    if (density !== expectedDensity) {
      setDensityState(expectedDensity);
    }
  }, [modeSet, accentSet, densitySet, defaults, modePreference, accent, density]);

  const resolvedMode = modePreference === 'system' ? systemMode : modePreference;

  const tokens = useMemo(() => {
    const themeTokens = resolveThemeTokens({ blueprint, mode: resolvedMode, accent, density });
    const spacing = Object.fromEntries(
      Object.entries(themeTokens.spacing ?? {}).map(([key, value]) => [key, pxToRem(value)]),
    );
    return {
      colors: themeTokens.colors ?? {},
      spacing,
      radii: { ...(themeTokens.radii ?? {}) },
      typography: { ...(themeTokens.typography ?? {}) },
      density: themeTokens.density ?? 1,
      shadows: { ...(themeTokens.shadows ?? {}) },
      overlays: { ...(themeTokens.overlays ?? {}) },
    };
  }, [blueprint, resolvedMode, accent, density]);

  useEffect(() => {
    applyCssVariables(tokens, resolvedMode, density);
  }, [tokens, resolvedMode, density]);

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
      const normalised = normalisePreference(nextMode, modePreference, Array.from(modeSet));
      const value = modeSet.has(normalised) ? normalised : modePreference;
      if (value === modePreference) {
        return;
      }
      analytics.track('theme.mode_changed', { nextMode: value, previousMode: modePreference });
      setModePreference(value);
    },
    [modePreference, modeSet],
  );

  const setAccent = useCallback(
    (nextAccent) => {
      const normalised = normalisePreference(nextAccent, accent, Array.from(accentSet));
      if (!accentSet.has(normalised) || normalised === accent) {
        return;
      }
      analytics.track('theme.accent_changed', { nextAccent: normalised, previousAccent: accent });
      setAccentState(normalised);
    },
    [accent, accentSet],
  );

  const setDensity = useCallback(
    (nextDensity) => {
      const normalised = normalisePreference(nextDensity, density, Array.from(densitySet));
      if (!densitySet.has(normalised) || normalised === density) {
        return;
      }
      analytics.track('theme.density_changed', { nextDensity: normalised, previousDensity: density });
      setDensityState(normalised);
    },
    [density, densitySet],
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
