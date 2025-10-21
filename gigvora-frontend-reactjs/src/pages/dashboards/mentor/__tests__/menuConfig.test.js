import { describe, expect, it } from 'vitest';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from '../menuConfig.js';

function getGroup(id) {
  return MENU_GROUPS.find((group) => group.id === id);
}

describe('mentor dashboard menu configuration', () => {
  it('exposes the mentor dashboard as an available workspace', () => {
    expect(AVAILABLE_DASHBOARDS).toContain('mentor');
  });

  it('contains all primary navigation groups with at least one menu item', () => {
    const requiredGroups = [
      'home',
      'hub',
      'creation-studio',
      'metrics',
      'finance',
      'mentorship',
      'clients',
      'calendar',
      'support',
      'inbox',
      'verification',
      'wallet',
      'settings',
      'system-preferences',
      'orders',
      'ads',
    ];

    for (const groupId of requiredGroups) {
      const group = getGroup(groupId);
      expect(group, `missing menu group ${groupId}`).toBeTruthy();
      expect(group.items.length, `menu group ${groupId} should have at least one item`).toBeGreaterThan(0);
      for (const item of group.items) {
        expect(item.id, `menu group ${groupId} has an item without id`).toBeTruthy();
        expect(item.name, `menu item ${item.id} in ${groupId} needs a name`).toBeTruthy();
      }
    }
  });

  it('provides stable references when consumers clone the configuration', () => {
    const clone = JSON.parse(JSON.stringify(MENU_GROUPS));
    // mutate the clone to ensure we are not affecting the exported constant
    clone[0].items.push({ id: 'temp', name: 'Temp' });

    const originalHomeGroup = getGroup('home');
    expect(originalHomeGroup.items.some((item) => item.id === 'temp')).toBe(false);
  });
});
