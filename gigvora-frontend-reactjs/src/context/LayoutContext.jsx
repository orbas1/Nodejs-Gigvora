import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LayoutContext = createContext({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  navOpen: false,
  openNav: () => {},
  closeNav: () => {},
  toggleNav: () => {},
});

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

  const value = useMemo(
    () => ({
      isMobile,
      isTablet,
      isDesktop,
      navOpen,
      openNav: () => setNavOpen(true),
      closeNav: () => setNavOpen(false),
      toggleNav: () => setNavOpen((prev) => !prev),
    }),
    [isDesktop, isMobile, isTablet, navOpen],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  return useContext(LayoutContext);
}

export default LayoutContext;
