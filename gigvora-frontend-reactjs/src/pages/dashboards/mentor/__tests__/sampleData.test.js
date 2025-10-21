import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE, DEFAULT_DASHBOARD } from '../sampleData.js';

describe('mentor dashboard sample data', () => {
  it('provides a populated mentor profile for initial renders', () => {
    expect(DEFAULT_PROFILE.name).toBe('Jordan Mentor');
    expect(Array.isArray(DEFAULT_PROFILE.metrics)).toBe(true);
    expect(DEFAULT_PROFILE.metrics.length).toBeGreaterThan(0);
    expect(DEFAULT_PROFILE.sessionFee).toMatchObject({ amount: expect.any(Number), currency: expect.any(String) });
  });

  it('contains hub, finance, calendar, and support primitives with realistic defaults', () => {
    expect(DEFAULT_DASHBOARD.hub.updates.length).toBeGreaterThan(0);
    expect(DEFAULT_DASHBOARD.finance.invoices.length).toBeGreaterThan(0);
    expect(DEFAULT_DASHBOARD.calendar.events.length).toBeGreaterThan(0);
    expect(DEFAULT_DASHBOARD.support.tickets.length).toBeGreaterThan(0);
  });

  it('exposes safe clones so consumers can extend the defaults without side effects', () => {
    const { hub } = DEFAULT_DASHBOARD;
    const cloned = structuredClone(hub);
    cloned.updates.push({ id: 'new', title: 'Extra update' });
    expect(hub.updates.some((update) => update.id === 'new')).toBe(false);
  });

  it('maintains availability slots and packages for quick-start flows', () => {
    expect(DEFAULT_DASHBOARD.availability.length).toBeGreaterThan(0);
    expect(DEFAULT_DASHBOARD.packages.length).toBeGreaterThan(0);
    for (const pkg of DEFAULT_DASHBOARD.packages) {
      expect(pkg).toMatchObject({ id: expect.any(String), name: expect.any(String), price: expect.any(Number) });
    }
  });
});
