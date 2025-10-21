import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAuthorization, { useProjectManagementAccess } from '../useAuthorization.js';
import useSession from '../useSession.js';

vi.mock('../useSession.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

describe('useAuthorization', () => {
  beforeEach(() => {
    useSession.mockReset();
  });

  it('normalises roles from multiple sources', () => {
    useSession.mockReturnValue({
      session: {
        memberships: ['Agency Admin'],
        roles: ['Project_Manager'],
        accountTypes: ['Company'],
        primaryDashboard: 'Operations',
        permissions: ['notifications:manage'],
      },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useAuthorization());

    expect(result.current.roles).toContain('agency_admin');
    expect(result.current.roles).toContain('project_manager');
    expect(result.current.roles).toContain('company');
    expect(result.current.roles).toContain('operations');
    expect(result.current.canManageProjects).toBe(true);
    expect(result.current.denialReason).toBeNull();
  });

  it('requires authentication for protected resources', () => {
    useSession.mockReturnValue({
      session: null,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => useAuthorization());

    expect(result.current.canAccess('notifications:center')).toBe(false);
    expect(result.current.canAccess('custom:resource')).toBe(false);
  });

  it('checks permissions when policies require them', () => {
    useSession.mockReturnValue({
      session: {
        memberships: ['user'],
        permissions: ['notifications:read'],
      },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useAuthorization());

    expect(result.current.roles).toContain('user');
    expect(result.current.canAccess('notifications:center')).toBe(true);
    expect(result.current.canAccess('notifications:push')).toBe(false);
  });
});

describe('useProjectManagementAccess', () => {
  beforeEach(() => {
    useSession.mockReset();
  });

  it('delegates to useAuthorization', () => {
    useSession.mockReturnValue({
      session: {
        roles: ['Agency'],
      },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useProjectManagementAccess());

    expect(result.current.hasRole('agency')).toBe(true);
    expect(result.current.canManageProjects).toBe(true);
  });
});

