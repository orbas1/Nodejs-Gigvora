import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import analyticsDefault from '../services/analytics.js';
import {
  createDesignTokens,
  createCssVariableMap,
  DEFAULT_THEME_SETTINGS,
} from '@shared-contracts/domain/platform/design-system.js';

type ThemeMode = 'light' | 'dark' | 'high-contrast';
type ThemeModePreference = ThemeMode | 'system';
type ThemeAccent = 'azure' | 'violet' | 'emerald' | 'amber' | 'rose';
type ThemeDensity = 'spacious' | 'comfortable' | 'cozy' | 'compact';

type ThemePreferencesSnapshot = {
  mode: ThemeMode;
  preference: ThemeModePreference;
  accent: ThemeAccent;
  density: ThemeDensity;
};

type ThemeProviderProps = {
  children: ReactNode;
  initialPreferences?: Partial<{ mode: ThemeModePreference; accent: ThemeAccent; density: ThemeDensity }>;
  onPreferencesChange?: (preferences: ThemePreferencesSnapshot) => void;
  storageKey?: string;
  disablePersistence?: boolean;
  analyticsClient?: typeof analyticsDefault;
};

type ThemeTokens = ReturnType<typeof createDesignTokens> & {
  spacingPx: Record<string, number>;
  spacing: Record<string, string>;
};

type ThemeContextValue = {
  mode: ThemeMode;
  preference: ThemeModePreference;
  accent: ThemeAccent;
  density: ThemeDensity;
  tokens: ThemeTokens;
  cssVariables: Record<string, string>;
  setMode: (mode: ThemeModePreference) => void;
  setAccent: (accent: ThemeAccent) => void;
  setDensity: (density: ThemeDensity) => void;
  registerComponentTokens: (componentName: string, overrides: Partial<ThemeTokens>) => void;
  removeComponentTokens: (componentName: string) => void;
  resolveComponentTokens: (componentName: string) => ThemeTokens;
};

const COLOR_SCHEME_ATTRIBUTE = 'color-scheme';
const DATA_THEME_MODE = 'themeMode';
const DATA_THEME_DENSITY = 'themeDensity';
const DATA_THEME_ACCENT = 'themeAccent';
const DEFAULT_STORAGE_KEY = 'gigvora:web:theme:preferences';

const SUPPORTED_MODE_OPTIONS: Set<ThemeModePreference> = new Set(['light', 'dark', 'high-contrast', 'system']);
const SUPPORTED_ACCENT_OPTIONS: Set<ThemeAccent> = new Set(['azure', 'violet', 'emerald', 'amber', 'rose']);
const SUPPORTED_DENSITY_OPTIONS: Set<ThemeDensity> = new Set(['spacious', 'comfortable', 'cozy', 'compact']);

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function detectSystemMode(): ThemeMode {
  if (!isBrowser()) {
    return 'light';
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

function normaliseModePreference(value: ThemeModePreference | undefined, fallback: ThemeModePreference): ThemeModePreference {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const candidate = value.trim().toLowerCase() as ThemeModePreference;
  if (!candidate) {
    return fallback;
  }
  if (!SUPPORTED_MODE_OPTIONS.has(candidate)) {
    return fallback;
  }
  return candidate;
}

function normaliseAccentPreference(value: ThemeAccent | undefined, fallback: ThemeAccent): ThemeAccent {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const candidate = value.trim().toLowerCase() as ThemeAccent;
  if (!candidate || !SUPPORTED_ACCENT_OPTIONS.has(candidate)) {
    return fallback;
  }
  return candidate;
}

function normaliseDensityPreference(value: ThemeDensity | undefined, fallback: ThemeDensity): ThemeDensity {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const candidate = value.trim().toLowerCase() as ThemeDensity;
  if (!candidate || !SUPPORTED_DENSITY_OPTIONS.has(candidate)) {
    return fallback;
  }
  return candidate;
}

function readStoredPreferences(storageKey: string): {
  mode: ThemeModePreference;
  accent: ThemeAccent;
  density: ThemeDensity;
} | null {
  if (!isBrowser()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return {
      mode: normaliseModePreference(parsed.mode, 'system'),
      accent: normaliseAccentPreference(parsed.accent, DEFAULT_THEME_SETTINGS.accent as ThemeAccent),
      density: normaliseDensityPreference(parsed.density, DEFAULT_THEME_SETTINGS.density as ThemeDensity),
    };
  } catch (error) {
    console.warn('Unable to read stored theme preferences', error);
    return null;
  }
}

function persistPreferences(
  storageKey: string,
  preferences: { mode: ThemeModePreference; accent: ThemeAccent; density: ThemeDensity },
) {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Unable to persist theme preferences', error);
  }
}

function toRem(value: number): string {
  return `${(value / 16).toFixed(3)}rem`;
}

function formatDesignTokens(tokens: ReturnType<typeof createDesignTokens>): ThemeTokens {
  const spacingPx = tokens.spacing ?? {};
  const spacingRem = Object.fromEntries(
    Object.entries(spacingPx).map(([key, value]) => [key, toRem(Number(value))]),
  );

  return {
    ...tokens,
    spacingPx: { ...spacingPx },
    spacing: spacingRem,
  };
}

function applyCssVariables(
  cssVariables: Record<string, string>,
  mode: ThemeMode,
  density: ThemeDensity,
  accent: ThemeAccent,
) {
  if (!isBrowser()) {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty(COLOR_SCHEME_ATTRIBUTE, mode === 'dark' ? 'dark' : 'light');
  root.dataset[DATA_THEME_MODE] = mode;
  root.dataset[DATA_THEME_DENSITY] = density;
  root.dataset[DATA_THEME_ACCENT] = accent;

  Object.entries(cssVariables).forEach(([key, value]) => {
    if (value != null) {
      root.style.setProperty(key, value);
    }
  });
}

const defaultDesignTokens = createDesignTokens({
  mode: DEFAULT_THEME_SETTINGS.mode,
  accent: DEFAULT_THEME_SETTINGS.accent,
  density: DEFAULT_THEME_SETTINGS.density,
});
const defaultTokens = formatDesignTokens(defaultDesignTokens);
const defaultCssVariables = createCssVariableMap(defaultDesignTokens);

const defaultThemeContext: ThemeContextValue = {
  mode: DEFAULT_THEME_SETTINGS.mode as ThemeMode,
  preference: 'system',
  accent: DEFAULT_THEME_SETTINGS.accent as ThemeAccent,
  density: DEFAULT_THEME_SETTINGS.density as ThemeDensity,
  tokens: defaultTokens,
  cssVariables: defaultCssVariables,
  setMode: () => {},
  setAccent: () => {},
  setDensity: () => {},
  registerComponentTokens: () => {},
  removeComponentTokens: () => {},
  resolveComponentTokens: () => defaultTokens,
};

const ThemeContext = createContext<ThemeContextValue>(defaultThemeContext);

export function ThemeProvider({
  children,
  initialPreferences,
  onPreferencesChange,
  storageKey = DEFAULT_STORAGE_KEY,
  disablePersistence = false,
  analyticsClient = analyticsDefault,
}: ThemeProviderProps) {
  const storedPreferences = readStoredPreferences(storageKey);

  const initialModePreference = normaliseModePreference(
    initialPreferences?.mode ?? storedPreferences?.mode ?? 'system',
    'system',
  );
  const initialAccent = normaliseAccentPreference(
    initialPreferences?.accent ?? storedPreferences?.accent ?? (DEFAULT_THEME_SETTINGS.accent as ThemeAccent),
    DEFAULT_THEME_SETTINGS.accent as ThemeAccent,
  );
  const initialDensity = normaliseDensityPreference(
    initialPreferences?.density ?? storedPreferences?.density ?? (DEFAULT_THEME_SETTINGS.density as ThemeDensity),
    DEFAULT_THEME_SETTINGS.density as ThemeDensity,
  );

  const [modePreference, setModePreference] = useState<ThemeModePreference>(initialModePreference);
  const [accent, setAccentState] = useState<ThemeAccent>(initialAccent);
  const [density, setDensityState] = useState<ThemeDensity>(initialDensity);
  const [systemMode, setSystemMode] = useState<ThemeMode>(detectSystemMode);

  const analyticsRef = useRef(analyticsClient ?? analyticsDefault);
  useEffect(() => {
    analyticsRef.current = analyticsClient ?? analyticsDefault;
  }, [analyticsClient]);

  const componentTokensRef = useRef<Map<string, Partial<ThemeTokens>>>(new Map());
  const lastTrackedRef = useRef<{ mode: ThemeMode; accent: ThemeAccent; density: ThemeDensity } | null>(null);

  useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateFromQuery = (event: MediaQueryListEvent | MediaQueryList) => {
      setSystemMode(event.matches ? 'dark' : 'light');
    };

    updateFromQuery(mediaQuery);

    if (mediaQuery.addEventListener) {
      const listener = (event: MediaQueryListEvent) => updateFromQuery(event);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }

    const legacyListener = (event: MediaQueryListEvent) => updateFromQuery(event);
    mediaQuery.addListener(legacyListener);
    return () => mediaQuery.removeListener(legacyListener);
  }, []);

  const resolvedMode: ThemeMode = modePreference === 'system' ? systemMode : (modePreference as ThemeMode);

  const designTokens = useMemo(
    () => createDesignTokens({ mode: resolvedMode, accent, density }),
    [resolvedMode, accent, density],
  );

  const tokens = useMemo(() => formatDesignTokens(designTokens), [designTokens]);
  const cssVariables = useMemo(() => createCssVariableMap(designTokens), [designTokens]);

  useEffect(() => {
    applyCssVariables(cssVariables, resolvedMode, density, accent);
  }, [cssVariables, resolvedMode, density, accent]);

  useEffect(() => {
    if (disablePersistence) {
      return;
    }
    persistPreferences(storageKey, { mode: modePreference, accent, density });
  }, [accent, density, modePreference, disablePersistence, storageKey]);

  useEffect(() => {
    const previous = lastTrackedRef.current;
    if (previous && previous.mode === resolvedMode && previous.accent === accent && previous.density === density) {
      return;
    }

    lastTrackedRef.current = { mode: resolvedMode, accent, density };
    const analyticsClientInstance = analyticsRef.current;
    analyticsClientInstance?.setGlobalContext?.({
      themeMode: resolvedMode,
      themeAccent: accent,
      themeDensity: density,
    });
    analyticsClientInstance?.track?.('theme.preferences_applied', {
      mode: resolvedMode,
      accent,
      density,
    });

    onPreferencesChange?.({
      mode: resolvedMode,
      preference: modePreference,
      accent,
      density,
    });
  }, [accent, density, modePreference, onPreferencesChange, resolvedMode]);

  const updateComponentTokens = useCallback((componentName: string, overrides: Partial<ThemeTokens>) => {
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

  const removeComponentTokens = useCallback((componentName: string) => {
    if (!componentName) {
      return;
    }
    componentTokensRef.current.delete(`${componentName}`.trim());
  }, []);

  const resolveComponentTokens = useCallback(
    (componentName: string) => {
      if (!componentName) {
        return tokens;
      }
      const overrides = componentTokensRef.current.get(`${componentName}`.trim());
      if (!overrides) {
        return tokens;
      }
      const overrideTokens = overrides as Partial<ThemeTokens>;
      return {
        ...tokens,
        ...overrideTokens,
        colors: { ...tokens.colors, ...(overrideTokens.colors ?? {}) },
        spacing: { ...tokens.spacing, ...(overrideTokens.spacing ?? {}) },
        spacingPx: { ...tokens.spacingPx, ...(overrideTokens.spacingPx ?? {}) },
        radii: { ...tokens.radii, ...(overrideTokens.radii ?? {}) },
        shadows: { ...tokens.shadows, ...(overrideTokens.shadows ?? {}) },
        overlays: { ...tokens.overlays, ...(overrideTokens.overlays ?? {}) },
        typography: { ...tokens.typography, ...(overrideTokens.typography ?? {}) },
      };
    },
    [tokens],
  );

  const setMode = useCallback(
    (nextMode: ThemeModePreference) => {
      const normalised = normaliseModePreference(nextMode, modePreference);
      if (normalised === modePreference) {
        return;
      }
      analyticsRef.current?.track?.('theme.mode_changed', {
        nextMode: normalised,
        previousMode: modePreference,
      });
      setModePreference(normalised);
    },
    [modePreference],
  );

  const setAccent = useCallback(
    (nextAccent: ThemeAccent) => {
      const normalised = normaliseAccentPreference(nextAccent, accent);
      if (normalised === accent) {
        return;
      }
      analyticsRef.current?.track?.('theme.accent_changed', {
        nextAccent: normalised,
        previousAccent: accent,
      });
      setAccentState(normalised);
    },
    [accent],
  );

  const setDensity = useCallback(
    (nextDensity: ThemeDensity) => {
      const normalised = normaliseDensityPreference(nextDensity, density);
      if (normalised === density) {
        return;
      }
      analyticsRef.current?.track?.('theme.density_changed', {
        nextDensity: normalised,
        previousDensity: density,
      });
      setDensityState(normalised);
    },
    [density],
  );

  const contextValue = useMemo(
    () => ({
      mode: resolvedMode,
      preference: modePreference,
      accent,
      density,
      tokens,
      cssVariables,
      setMode,
      setAccent,
      setDensity,
      registerComponentTokens: updateComponentTokens,
      removeComponentTokens,
      resolveComponentTokens,
    }),
    [
      accent,
      density,
      modePreference,
      resolvedMode,
      tokens,
      cssVariables,
      setMode,
      setAccent,
      setDensity,
      updateComponentTokens,
      removeComponentTokens,
      resolveComponentTokens,
    ],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;
