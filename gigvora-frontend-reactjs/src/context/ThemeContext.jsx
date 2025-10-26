import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const THEME_STORAGE_KEY = 'gigvora.theme';
const FALLBACK_THEME = 'light';

const ThemeContext = createContext({
  theme: FALLBACK_THEME,
  availableThemes: [],
  setTheme: () => {},
  cycleTheme: () => {},
});

const THEME_DEFINITIONS = [
  {
    id: 'light',
    label: 'Light',
    description: 'Bright surfaces with airy depth cues.',
    colorScheme: 'light',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Low-light interface optimised for focus.',
    colorScheme: 'dark',
  },
  {
    id: 'contrast',
    label: 'High Contrast',
    description: 'Increased contrast for accessibility and review sessions.',
    colorScheme: 'light',
  },
];

function applyThemeToDocument(themeId) {
  if (typeof document === 'undefined') {
    return;
  }

  const definition = THEME_DEFINITIONS.find((theme) => theme.id === themeId) ?? THEME_DEFINITIONS[0];
  document.documentElement.dataset.theme = definition.id;
  document.documentElement.style.setProperty('color-scheme', definition.colorScheme);
}

function readInitialTheme() {
  if (typeof window === 'undefined') {
    return FALLBACK_THEME;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && THEME_DEFINITIONS.some((theme) => theme.id === stored)) {
    return stored;
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    return 'dark';
  }

  return FALLBACK_THEME;
}

export function ThemeProvider({ children }) {
  const isFirstRender = useRef(true);
  const [theme, setThemeState] = useState(() => readInitialTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      if (isFirstRender.current) {
        return;
      }
      if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
        setThemeState(event.matches ? 'dark' : FALLBACK_THEME);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const setTheme = useCallback((nextTheme) => {
    setThemeState((current) => {
      const exists = THEME_DEFINITIONS.some((themeDefinition) => themeDefinition.id === nextTheme);
      if (!exists) {
        return current;
      }
      return nextTheme;
    });
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const index = THEME_DEFINITIONS.findIndex((themeDefinition) => themeDefinition.id === current);
      if (index === -1) {
        return THEME_DEFINITIONS[0].id;
      }
      const nextIndex = (index + 1) % THEME_DEFINITIONS.length;
      return THEME_DEFINITIONS[nextIndex].id;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      availableThemes: THEME_DEFINITIONS,
      setTheme,
      cycleTheme,
    }),
    [theme, setTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

ThemeProvider.propTypes = {
  children: PropTypes.node,
};

ThemeProvider.defaultProps = {
  children: null,
};

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
