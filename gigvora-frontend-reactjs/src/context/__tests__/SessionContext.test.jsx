import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storedTokens = { accessToken: null, refreshToken: null, expiresAt: null };

vi.mock('../../services/apiClient.js', () => {
  const mock = {
    setAuthTokens: vi.fn((next) => {
      storedTokens.accessToken = next?.accessToken ?? null;
      storedTokens.refreshToken = next?.refreshToken ?? null;
      storedTokens.expiresAt = next?.expiresAt ?? null;
    }),
    clearAuthTokens: vi.fn(() => {
      storedTokens.accessToken = null;
      storedTokens.refreshToken = null;
      storedTokens.expiresAt = null;
    }),
    clearAccessToken: vi.fn(() => {
      storedTokens.accessToken = null;
    }),
    clearRefreshToken: vi.fn(() => {
      storedTokens.refreshToken = null;
    }),
    getAuthTokens: vi.fn(() => ({ ...storedTokens })),
  };
  return { __esModule: true, default: mock };
});

vi.mock('../../services/auth.js', () => {
  const fetchCurrentSession = vi.fn(() => Promise.resolve({}));
  const refreshSession = vi.fn(() => Promise.resolve({}));
  return {
    __esModule: true,
    fetchCurrentSession,
    refreshSession,
    default: {
      fetchCurrentSession,
      refreshSession,
    },
  };
});

import { SessionProvider, useSession } from '../SessionContext.jsx';
import apiClient from '../../services/apiClient.js';
import {
  fetchCurrentSession as fetchCurrentSessionMock,
  refreshSession as refreshSessionMock,
} from '../../services/auth.js';

function wrapper({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

describe('SessionContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    storedTokens.accessToken = null;
    storedTokens.refreshToken = null;
    storedTokens.expiresAt = null;
    fetchCurrentSessionMock.mockResolvedValue({});
    refreshSessionMock.mockResolvedValue({});
  });

  it('normalises session payloads and exposes RBAC helpers', async () => {
    const payload = {
      user: {
        id: 'user-123',
        firstName: 'Morgan',
        lastName: 'Rivers',
        email: 'morgan@example.com',
        memberships: ['Admin', ' agency '],
        permissions: ['calendar:view'],
        capabilities: ['Calendar:Manage'],
        grants: ['projects:read'],
        tokens: {
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          expiresAt: '2024-09-01T12:00:00Z',
        },
        featureFlags: {
          'beta-dashboard': { enabled: true, metadata: { cohort: 'mentors' } },
          'dark-mode': { enabled: false },
        },
      },
      features: ['reports:generate'],
    };

    const { result } = renderHook(() => useSession(), { wrapper });

    let normalizedResult;
    act(() => {
      normalizedResult = result.current.login(payload);
    });

    expect(normalizedResult?.email).toBe('morgan@example.com');

    await waitFor(() => {
      expect(apiClient.setAuthTokens).toHaveBeenCalledWith({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresAt: '2024-09-01T12:00:00.000Z',
      });
    });

    await waitFor(() => {
      expect(result.current.session).not.toBeNull();
    });
    const storedSession = JSON.parse(window.localStorage.getItem('gigvora:web:session'));
    expect(storedSession.email).toBe('morgan@example.com');
    expect(result.current.session?.email).toBe('morgan@example.com');
    expect(result.current.session?.memberships).toContain('Admin');
    expect(result.current.session?.primaryDashboard).toBe('Admin');
    expect(result.current.roleKeys).toEqual(expect.arrayContaining(['admin', 'agency']));
    expect(result.current.permissionKeys).toEqual(
      expect.arrayContaining(['calendar_view', 'calendar_manage', 'projects_read', 'reports_generate']),
    );
    expect(result.current.hasRole('ADMIN')).toBe(true);
    expect(result.current.hasPermission('calendar:manage')).toBe(true);
    await waitFor(() => {
      expect(window.localStorage.getItem('gigvora:web:session')).not.toBeNull();
    });

    expect(result.current.isFeatureEnabled('beta-dashboard')).toBe(true);
    expect(result.current.isFeatureEnabled('dark-mode')).toBe(false);
    expect(result.current.getFeatureFlag('beta-dashboard')).toMatchObject({
      enabled: true,
      metadata: { cohort: 'mentors' },
    });
  });

  it('ignores empty session payloads during reload and refresh', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.login({
        id: 'user-45',
        email: 'persisted@example.com',
        memberships: ['mentor'],
        permissions: ['mentorship:manage'],
        tokens: {
          accessToken: 'persisted-access',
          refreshToken: 'persisted-refresh',
          expiresAt: '2024-11-01T00:00:00Z',
        },
        featureFlags: { premium: { enabled: true } },
      });
    });

    await waitFor(() => {
      expect(result.current.session?.email).toBe('persisted@example.com');
    });

    fetchCurrentSessionMock.mockResolvedValue({ session: {} });

    await act(async () => {
      await result.current.reloadSession();
    });

    expect(fetchCurrentSessionMock).toHaveBeenCalled();
    expect(result.current.session?.email).toBe('persisted@example.com');

    refreshSessionMock.mockResolvedValue({ session: {} });

    await act(async () => {
      await result.current.refreshSession();
    });

    expect(refreshSessionMock).toHaveBeenCalled();
    expect(result.current.session?.email).toBe('persisted@example.com');

    const storedSession = JSON.parse(window.localStorage.getItem('gigvora:web:session'));
    expect(storedSession.email).toBe('persisted@example.com');
    expect(result.current.isFeatureEnabled('premium')).toBe(true);
  });

  it('updates and clears session state', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.login({
        id: 'user-10',
        memberships: ['freelancer'],
        permissions: ['calendar:view'],
        tokens: { accessToken: 'token-a', refreshToken: 'token-b', expiresAt: '2024-10-01T00:00:00Z' },
        featureFlags: { spotlight: true },
      });
    });

    act(() => {
      result.current.updateSession({
        memberships: ['company'],
        permissions: ['calendar:manage'],
        featureFlags: { spotlight: { enabled: false }, 'new-home': true },
      });
    });

    expect(result.current.hasRole('company')).toBe(true);
    expect(result.current.hasPermission('calendar:manage')).toBe(true);
    expect(result.current.isFeatureEnabled('spotlight')).toBe(false);
    expect(result.current.isFeatureEnabled('new-home')).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(apiClient.clearAuthTokens).toHaveBeenCalled();
    expect(apiClient.clearAccessToken).toHaveBeenCalled();
    expect(apiClient.clearRefreshToken).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
    expect(window.localStorage.getItem('gigvora:web:session')).toBeNull();
  });
});
