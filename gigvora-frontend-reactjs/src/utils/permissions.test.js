import { describe, expect, it } from 'vitest';
import { hasFinanceOperationsAccess, hasSecurityOperationsAccess } from './permissions.js';

describe('hasFinanceOperationsAccess', () => {
  it('grants access via membership', () => {
    expect(hasFinanceOperationsAccess({ memberships: ['finance'] })).toBe(true);
  });

  it('checks nested permissions and capabilities', () => {
    expect(hasFinanceOperationsAccess({ permissions: { finance: { controlTower: true } } })).toBe(true);
    expect(hasFinanceOperationsAccess({ capabilities: ['finance:control-tower'] })).toBe(true);
  });

  it('denies when no access provided', () => {
    expect(hasFinanceOperationsAccess({})).toBe(false);
  });
});

describe('hasSecurityOperationsAccess', () => {
  it('grants access via membership', () => {
    expect(hasSecurityOperationsAccess({ memberships: ['security'] })).toBe(true);
  });

  it('checks nested permissions and capabilities', () => {
    expect(hasSecurityOperationsAccess({ permissions: { security: { operations: true } } })).toBe(true);
    expect(hasSecurityOperationsAccess({ capabilities: ['security:operations'] })).toBe(true);
  });

  it('denies when no access provided', () => {
    expect(hasSecurityOperationsAccess({})).toBe(false);
  });
});
