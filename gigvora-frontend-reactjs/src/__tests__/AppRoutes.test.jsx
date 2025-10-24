import { describe, expect, it } from 'vitest';
import { ROUTE_COLLECTIONS } from '../App.jsx';
import {
  COMMUNITY_ACCESS_MEMBERSHIPS,
  VOLUNTEER_ACCESS_MEMBERSHIPS,
  LAUNCHPAD_ALLOWED_MEMBERSHIPS,
  SECURITY_ALLOWED_MEMBERSHIPS,
  getRouteGroup,
} from '../constants/routeRegistry.js';

describe('App route configuration', () => {
  it('ensures every registered route exposes a unique path', () => {
    const seen = new Map();
    const duplicates = [];

    Object.entries(ROUTE_COLLECTIONS).forEach(([collection, routes]) => {
      expect(Array.isArray(routes)).toBe(true);

      routes.forEach((route) => {
        expect(route?.path, `${collection} route missing path`).toBeTruthy();
        expect(route?.module, `${route.path} should resolve to a module`).toBeTruthy();

        if (seen.has(route.path)) {
          duplicates.push([route.path, seen.get(route.path), collection]);
        } else {
          seen.set(route.path, collection);
        }
      });
    });

    expect(duplicates).toHaveLength(0);
  });

  it('keeps membership gates in sync with specialist routes', () => {
    const communitySet = new Set(COMMUNITY_ACCESS_MEMBERSHIPS);

    expect(communitySet.size).toBe(COMMUNITY_ACCESS_MEMBERSHIPS.length);
    expect(communitySet.has('user')).toBe(true);
    expect(Array.from(new Set(VOLUNTEER_ACCESS_MEMBERSHIPS))).toHaveLength(
      VOLUNTEER_ACCESS_MEMBERSHIPS.length,
    );
    VOLUNTEER_ACCESS_MEMBERSHIPS.forEach((role) => {
      expect(communitySet.has(role) || role === 'admin' || role === 'volunteer').toBe(true);
    });
  });

  it('tracks sensitive launchpad and security routes explicitly', () => {
    const launchpadRoutes = getRouteGroup('launchpad');
    const securityRoutes = getRouteGroup('security');

    expect(launchpadRoutes.every((route) => route.path.includes('launchpad'))).toBe(true);
    expect(securityRoutes.every((route) => route.path.includes('security'))).toBe(true);
    expect(new Set(LAUNCHPAD_ALLOWED_MEMBERSHIPS).size).toBe(LAUNCHPAD_ALLOWED_MEMBERSHIPS.length);
    expect(new Set(SECURITY_ALLOWED_MEMBERSHIPS).size).toBe(SECURITY_ALLOWED_MEMBERSHIPS.length);
  });
});
