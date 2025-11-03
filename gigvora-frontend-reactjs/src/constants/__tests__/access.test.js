import { describe, expect, it } from 'vitest';

import {
  canAccessLaunchpad,
  canAccessMessaging,
  canAccessSecurityOperations,
  getLaunchpadMemberships,
  getMessagingMemberships,
  getSecurityMemberships,
} from '../access.js';

describe('access constants', () => {
  it('normalises tokens and returns eligible messaging memberships', () => {
    const session = {
      memberships: ['User', ' Professional '],
      activeMembership: 'COMPANY',
      accountTypes: ['Admin'],
    };

    const messagingMemberships = getMessagingMemberships(session);
    expect(messagingMemberships.sort()).toEqual(['admin', 'company', 'professional', 'user']);
    expect(canAccessMessaging(session)).toBe(true);
  });

  it('evaluates launchpad access from combined role scopes', () => {
    const session = {
      memberships: ['Professional'],
      roles: ['Launchpad:Manage'],
      primaryDashboard: 'COMPANY',
    };

    expect(getLaunchpadMemberships(session)).toEqual(['professional', 'company']);
    expect(canAccessLaunchpad(session)).toBe(true);
  });

  it('restricts security operations access to the configured membership set', () => {
    const session = {
      memberships: ['admin'],
      roles: ['SECURITY'],
      accountTypes: ['Trust'],
    };

    expect(getSecurityMemberships(session)).toEqual(['admin', 'security', 'trust']);
    expect(canAccessSecurityOperations(session)).toBe(true);

    const readonlySession = { memberships: ['professional'] };
    expect(canAccessSecurityOperations(readonlySession)).toBe(false);
  });
});
