import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../services/analytics.js';

export default function RouteAnalyticsListener() {
  const location = useLocation();
  const previousPathRef = useRef(null);

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    if (previousPathRef.current === fullPath) {
      return;
    }

    previousPathRef.current = fullPath;
    analytics.track('web_route_viewed', {
      path: fullPath,
      title: typeof document !== 'undefined' ? document.title : null,
    });
  }, [location]);

  return null;
}
