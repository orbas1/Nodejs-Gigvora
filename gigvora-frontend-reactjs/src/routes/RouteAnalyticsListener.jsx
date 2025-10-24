import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import analytics from '../services/analytics.js';

export default function RouteAnalyticsListener() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPathRef = useRef(null);
  const navigationStartRef = useRef(
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now(),
  );

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    const now =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    const previousPath = previousPathRef.current;

    if (previousPath && previousPath !== fullPath) {
      const duration = Math.round(now - (navigationStartRef.current ?? now));
      analytics.track('web_route_dwell', {
        path: previousPath,
        durationMs: duration,
      });
      analytics.track('web_route_transition', {
        from: previousPath,
        to: fullPath,
        navigationType,
        durationMs: duration,
      });
    }

    previousPathRef.current = fullPath;
    navigationStartRef.current = now;

    const navigationEntry =
      typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function'
        ? performance.getEntriesByType('navigation')?.[0] ?? null
        : null;

    analytics.track('web_route_viewed', {
      path: fullPath,
      title: typeof document !== 'undefined' ? document.title : null,
      navigationType,
      timeToFirstByte: navigationEntry?.responseStart
        ? Math.round(navigationEntry.responseStart)
        : null,
      domContentLoaded: navigationEntry?.domContentLoadedEventEnd
        ? Math.round(navigationEntry.domContentLoadedEventEnd)
        : null,
    });
  }, [location, navigationType]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const previousPath = previousPathRef.current;
      if (!previousPath) {
        return;
      }
      const now =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      const duration = Math.round(now - (navigationStartRef.current ?? now));
      analytics.track('web_route_dwell', {
        path: previousPath,
        durationMs: duration,
        reason: 'unload',
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, []);

  return null;
}
