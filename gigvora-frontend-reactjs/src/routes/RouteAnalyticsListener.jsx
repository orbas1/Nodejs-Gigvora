import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../services/analytics.js';
import { matchRouteByPath } from './routeConfig.jsx';

export default function RouteAnalyticsListener() {
  const location = useLocation();
  const previousPathRef = useRef(null);

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    if (previousPathRef.current === fullPath) {
      return;
    }

    previousPathRef.current = fullPath;
    const matchedRoute = matchRouteByPath(location.pathname);
    const metadata = matchedRoute?.meta ?? null;
    analytics.track('web_route_viewed', {
      path: fullPath,
      title: metadata?.title ?? (typeof document !== 'undefined' ? document.title : null),
      routeId: metadata?.id ?? null,
      persona: metadata?.persona ?? null,
      collection: matchedRoute?.collection ?? null,
      featureFlag: metadata?.featureFlag ?? null,
      shellTheme: metadata?.shellTheme ?? null,
    });
  }, [location]);

  return null;
}
