import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const DEFAULT_SHELL_THEME = Object.freeze({
  name: 'daybreak',
  variables: {
    '--shell-background-gradient': 'linear-gradient(180deg, #ffffff 0%, #f8fafc 58%, rgba(148, 163, 184, 0.2) 100%)',
    '--shell-overlay-primary': 'radial-gradient(circle at top, rgba(37, 99, 235, 0.15), transparent 60%)',
    '--shell-overlay-desktop': 'radial-gradient(circle at top right, rgba(219, 234, 254, 0.7), transparent 65%)',
    '--shell-text-color': 'rgb(15 23 42)',
  },
  options: {
    showDesktopOverlay: true,
  },
});

export const MIDNIGHT_SHELL_THEME = Object.freeze({
  name: 'midnight',
  variables: {
    '--shell-background-gradient': 'linear-gradient(180deg, #020617 0%, #0f172a 55%, #111827 100%)',
    '--shell-overlay-primary': 'radial-gradient(circle at top, rgba(59, 130, 246, 0.28), transparent 58%)',
    '--shell-overlay-desktop': 'radial-gradient(circle at top right, rgba(30, 64, 175, 0.35), transparent 60%)',
    '--shell-text-color': 'rgb(226 232 240)',
  },
  options: {
    showDesktopOverlay: true,
  },
});

export const SHELL_THEME_PRESETS = Object.freeze({
  default: DEFAULT_SHELL_THEME,
  daybreak: DEFAULT_SHELL_THEME,
  midnight: MIDNIGHT_SHELL_THEME,
});

const LayoutContext = createContext({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  navOpen: false,
  openNav: () => {},
  closeNav: () => {},
  toggleNav: () => {},
  shellTheme: DEFAULT_SHELL_THEME,
  setShellTheme: () => {},
  resetShellTheme: () => {},
});

function resolveShellTheme(nextTheme) {
  if (!nextTheme) {
    return DEFAULT_SHELL_THEME;
  }
  if (typeof nextTheme === 'string') {
    return SHELL_THEME_PRESETS[nextTheme] ?? DEFAULT_SHELL_THEME;
  }
  const base = typeof nextTheme.base === 'string' ? resolveShellTheme(nextTheme.base) : DEFAULT_SHELL_THEME;
  const variables = { ...base.variables, ...(nextTheme.variables ?? {}) };
  const options = { ...base.options, ...(nextTheme.options ?? {}) };
  const name = nextTheme.name ?? base.name;
  return {
    ...base,
    ...nextTheme,
    name,
    variables,
    options,
  };
}

function applyShellThemeVariables(theme) {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

function resolveViewport() {
  if (typeof window === 'undefined') {
    return { width: 1280 };
  }
  return { width: window.innerWidth };
}

function deriveState(width) {
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

export function LayoutProvider({ children }) {
  const [{ isMobile, isTablet, isDesktop }, setViewport] = useState(() => deriveState(resolveViewport().width));
  const [navOpen, setNavOpen] = useState(false);
  const [shellTheme, setShellThemeState] = useState(DEFAULT_SHELL_THEME);

  useEffect(() => {
    const handleResize = () => {
      const { width } = resolveViewport();
      setViewport((prev) => {
        const next = deriveState(width);
        if (prev.isMobile === next.isMobile && prev.isTablet === next.isTablet && prev.isDesktop === next.isDesktop) {
          return prev;
        }
        return next;
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop && navOpen) {
      setNavOpen(false);
    }
  }, [isDesktop, navOpen]);

  useEffect(() => {
    applyShellThemeVariables(shellTheme);
  }, [shellTheme]);

  const setShellTheme = useCallback((nextTheme) => {
    setShellThemeState(resolveShellTheme(nextTheme));
  }, []);

  const resetShellTheme = useCallback(() => {
    setShellThemeState(DEFAULT_SHELL_THEME);
  }, []);

  const value = useMemo(
    () => ({
      isMobile,
      isTablet,
      isDesktop,
      navOpen,
      openNav: () => setNavOpen(true),
      closeNav: () => setNavOpen(false),
      toggleNav: () => setNavOpen((prev) => !prev),
      shellTheme,
      setShellTheme,
      resetShellTheme,
    }),
    [isDesktop, isMobile, isTablet, navOpen, resetShellTheme, setShellTheme, shellTheme],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  return useContext(LayoutContext);
}

export function useShellTheme() {
  const { shellTheme, setShellTheme, resetShellTheme } = useLayout();
  return { shellTheme, setShellTheme, resetShellTheme };
}

export default LayoutContext;
