import { describe, expect, it } from 'vitest';
import {
  ROUTE_COLLECTIONS,
  COMMUNITY_ACCESS_MEMBERSHIPS,
  VOLUNTEER_ACCESS_MEMBERSHIPS,
  LAUNCHPAD_ROUTES,
  SECURITY_ROUTES,
} from '../App.jsx';

describe('App route configuration', () => {
  it('ensures every registered route exposes a unique path', () => {
    const seen = new Map();
    const duplicates = [];

    Object.entries(ROUTE_COLLECTIONS).forEach(([collection, routes]) => {
      expect(Array.isArray(routes)).toBe(true);

      routes.forEach((route) => {
        expect(route?.path, `${collection} route missing path`).toBeTruthy();
        expect(route?.element, `${route.path} should define an element`).toBeTruthy();

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
    expect(LAUNCHPAD_ROUTES.every((route) => route.path.includes('launchpad'))).toBe(true);
    expect(SECURITY_ROUTES.every((route) => route.path.includes('security'))).toBe(true);
  });
});
