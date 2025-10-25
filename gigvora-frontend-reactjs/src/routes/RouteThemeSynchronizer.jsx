import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { matchRouteByPath } from './routeConfig.jsx';
import { useShellTheme } from '../context/LayoutContext.jsx';

export default function RouteThemeSynchronizer() {
  const location = useLocation();
  const { setShellTheme, resetShellTheme } = useShellTheme();

  useEffect(() => {
    const entry = matchRouteByPath(location.pathname);
    const theme = entry?.meta?.shellTheme;

    if (theme) {
      setShellTheme(theme);
      return () => {
        resetShellTheme();
      };
    }

    resetShellTheme();
    return undefined;
  }, [location.pathname, resetShellTheme, setShellTheme]);

  return null;
}
