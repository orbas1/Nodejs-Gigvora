import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../services/analytics.js';
import { matchRouteByPath } from './routeConfig.jsx';

const JOURNEY_SEGMENT_BY_COLLECTION = Object.freeze({
  standalone: 'public.marketing',
  public: 'public.marketing',
  community: 'member.community',
  userDashboards: 'member.dashboard',
  freelancer: 'freelancer.dashboard',
  company: 'company.operations',
  agency: 'agency.operations',
  mentor: 'mentor.marketplace',
  headhunter: 'headhunter.operations',
  launchpad: 'member.launchpad',
  launchpadOps: 'launchpad.operations',
  volunteer: 'volunteer.programme',
  security: 'security.operations',
  admin: 'admin.governance',
});

export default function RouteAnalyticsListener() {
  const location = useLocation();
  const previousPathRef = useRef(null);

  useEffect(() => {
    return () => {
      analytics.clearGlobalContext([
        'routePersona',
        'routeCollection',
        'routeId',
        'journeySegment',
        'routeTitle',
      ]);
    };
  }, []);

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    if (previousPathRef.current === fullPath) {
      return;
    }

    previousPathRef.current = fullPath;
    const matchedRoute = matchRouteByPath(location.pathname);
    const metadata = matchedRoute?.meta ?? null;
    const journeySegment = matchedRoute?.collection
      ? JOURNEY_SEGMENT_BY_COLLECTION[matchedRoute.collection] ?? null
      : metadata?.persona
        ? `${metadata.persona}.experience`
        : null;

    analytics.setGlobalContext({
      routePersona: metadata?.persona ?? null,
      routeCollection: matchedRoute?.collection ?? null,
      routeId: metadata?.id ?? null,
      routeTitle: metadata?.title ?? null,
      journeySegment,
    });

    analytics.track('web_route_viewed', {
      path: fullPath,
      title: metadata?.title ?? (typeof document !== 'undefined' ? document.title : null),
      routeId: metadata?.id ?? null,
      persona: metadata?.persona ?? null,
      collection: matchedRoute?.collection ?? null,
      featureFlag: metadata?.featureFlag ?? null,
      shellTheme: metadata?.shellTheme ?? null,
      journeySegment,
    });
  }, [location]);

  return null;
}
