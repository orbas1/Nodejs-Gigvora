import { describe, expect, it } from 'vitest';
import { hasAnyMembership, hasMembership, resolveActorId } from './session.js';

describe('resolveActorId', () => {
  it('returns first valid numeric identifier', () => {
    const id = resolveActorId({ userId: '15', memberId: 20 });
    expect(id).toBe(15);
  });

  it('returns null when no ids found', () => {
    expect(resolveActorId({})).toBeNull();
  });
});

describe('membership helpers', () => {
  it('hasMembership checks inclusion', () => {
    expect(hasMembership({ memberships: ['admin'] }, 'admin')).toBe(true);
    expect(hasMembership(null, 'admin')).toBe(false);
  });

  it('hasAnyMembership matches any from list', () => {
    expect(hasAnyMembership({ memberships: ['finance', 'security'] }, ['admin', 'security'])).toBe(true);
    expect(hasAnyMembership({}, ['admin'])).toBe(false);
  });
});
