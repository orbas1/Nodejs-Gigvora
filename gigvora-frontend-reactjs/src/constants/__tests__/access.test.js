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
      memberships: ['User', ' FreelancER '],
      activeMembership: 'AGENCY',
      accountTypes: ['HeadHunter'],
    };

    const messagingMemberships = getMessagingMemberships(session);
    expect(messagingMemberships.sort()).toEqual(['agency', 'freelancer', 'headhunter', 'user']);
    expect(canAccessMessaging(session)).toBe(true);
  });

  it('evaluates launchpad access from combined role scopes', () => {
    const session = {
      memberships: ['mentor'],
      roles: ['Launchpad:Manage'],
      primaryDashboard: 'COMPANY',
    };

    expect(getLaunchpadMemberships(session)).toEqual(['mentor', 'company']);
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

    const readonlySession = { memberships: ['freelancer'] };
    expect(canAccessSecurityOperations(readonlySession)).toBe(false);
  });
});
