import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { RouteRegistryEntry } from '../../src/models/routeRegistryModels.js';
import {
  getCanonicalRouteRegistry,
  syncRouteRegistry,
} from '../../src/services/routeRegistryService.js';

describe('routeRegistryService', () => {
  beforeAll(async () => {
    await RouteRegistryEntry.sync({ force: true });
  });

  beforeEach(async () => {
    await RouteRegistryEntry.destroy({ where: {}, truncate: true, cascade: true, force: true });
  });

  it('synchronises canonical route entries into the database', async () => {
    const canonical = getCanonicalRouteRegistry();
    const summary = await syncRouteRegistry({ actor: { actorId: 'test-suite' } });
    expect(summary.total).toBe(canonical.length);
    expect(summary.created).toBeGreaterThan(0);
    const stored = await RouteRegistryEntry.findAll();
    expect(stored).toHaveLength(canonical.length);
    stored.forEach((entry) => {
      expect(entry.isActive).toBe(true);
      expect(entry.routeId).toBeTruthy();
    });
  });

  it('marks non-canonical routes as deprecated without deleting them', async () => {
    await syncRouteRegistry({ actor: { actorId: 'test-suite' } });
    await RouteRegistryEntry.create({
      routeId: 'legacy.route',
      collection: 'legacy',
      path: '/legacy',
      absolutePath: '/legacy',
      modulePath: null,
      title: 'Legacy Route',
      icon: null,
      persona: null,
      featureFlag: null,
      shellTheme: null,
      allowedRoles: [],
      allowedMemberships: [],
      metadata: {},
      isActive: true,
    });

    const summary = await syncRouteRegistry({ actor: { actorId: 'test-suite' } });
    expect(summary.deactivated).toBeGreaterThanOrEqual(1);

    const legacy = await RouteRegistryEntry.findOne({ where: { routeId: 'legacy.route' } });
    expect(legacy).not.toBeNull();
    expect(legacy.isActive).toBe(false);
    expect(legacy.deprecatedAt).toBeInstanceOf(Date);
  });
});
