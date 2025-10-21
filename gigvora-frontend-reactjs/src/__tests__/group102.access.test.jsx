import { renderHook } from '@testing-library/react';
import useRoleAccess from '../hooks/useRoleAccess.js';

const sessionState = vi.hoisted(() => ({
  value: {
    session: null,
    isAuthenticated: false,
    updateSession: vi.fn(),
  },
}));

vi.mock('../hooks/useSession.js', () => ({
  __esModule: true,
  default: () => sessionState.value,
}));

describe('useRoleAccess', () => {
  beforeEach(() => {
    sessionState.value = {
      session: { memberships: ['user'], activeMembership: 'user' },
      isAuthenticated: true,
      updateSession: vi.fn(),
    };
  });

  it('matches allowed roles and auto-selects the active membership', () => {
    sessionState.value.session = { memberships: ['Admin', 'Manager'], activeMembership: 'manager' };

    const { result } = renderHook(() => useRoleAccess('admin'));

    expect(result.current.hasAccess).toBe(true);
    expect(result.current.matchedRole).toBe('admin');
    expect(sessionState.value.updateSession).toHaveBeenCalledWith({ activeMembership: 'admin' });
  });

  it('requires all roles to be present when configured', () => {
    sessionState.value.session = { memberships: ['owner'], activeMembership: 'owner' };

    const { result } = renderHook(() => useRoleAccess({ anyOf: ['owner'], allOf: ['finance'] }));

    expect(result.current.hasAccess).toBe(false);
    expect(result.current.missingRoles).toContain('finance');
  });

  it('falls back to the first membership when no allow list is provided', () => {
    sessionState.value.session = { memberships: ['company', 'finance'] };

    const { result } = renderHook(() => useRoleAccess());

    expect(result.current.activeMembership).toBe('company');
    expect(result.current.hasAccess).toBe(true);
  });

  it('respects the autoSelectActive flag', () => {
    sessionState.value.session = { memberships: ['agency'], activeMembership: null };

    const { result } = renderHook(() => useRoleAccess('agency', { autoSelectActive: false }));

    expect(result.current.hasAccess).toBe(true);
    expect(sessionState.value.updateSession).not.toHaveBeenCalled();
  });
});

