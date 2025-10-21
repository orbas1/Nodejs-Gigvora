import { describe, expect, it } from 'vitest';
import { AVAILABLE_DASHBOARDS, MENU_GROUPS } from '../menuConfig.js';

describe('menuConfig', () => {
  it('exposes unique, well-formed menu groups and items', () => {
    const groupIds = new Set();
    const itemIds = new Set();

    MENU_GROUPS.forEach((group) => {
      expect(group.id).toBeTruthy();
      expect(group.label).toBeTruthy();
      expect(Array.isArray(group.items)).toBe(true);
      expect(group.items.length).toBeGreaterThan(0);
      expect(groupIds.has(group.id)).toBe(false);
      groupIds.add(group.id);

      group.items.forEach((item) => {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(item.icon).toBeTruthy();

        const slug = item.id.replace(/[^a-z0-9-]/gi, '').toLowerCase();
        expect(slug.length).toBeGreaterThan(0);

        expect(itemIds.has(item.id)).toBe(false);
        itemIds.add(item.id);

        if (item.href) {
          expect(item.href.startsWith('/')).toBe(true);
          expect(item.href).not.toContain(' ');
        }
      });
    });
  });

  it('includes dashboards with consistent hrefs and labels', () => {
    const hrefs = new Set();

    AVAILABLE_DASHBOARDS.forEach((dashboard) => {
      expect(dashboard.id).toMatch(/^[a-z0-9-]+$/);
      expect(dashboard.label).toBeTruthy();
      expect(dashboard.href).toMatch(/^\//);
      expect(hrefs.has(dashboard.href)).toBe(false);
      hrefs.add(dashboard.href);
    });

    const freelancerDashboard = AVAILABLE_DASHBOARDS.find((entry) => entry.id === 'freelancer');
    expect(freelancerDashboard).toBeDefined();
    expect(freelancerDashboard.href).toBe('/dashboard/freelancer');
  });
});
