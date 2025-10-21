import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/apiClient.js', () => {
  const mock = {
    setAuthTokens: vi.fn(),
    clearAuthTokens: vi.fn(),
    clearAccessToken: vi.fn(),
    clearRefreshToken: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

import { SessionProvider, useSession } from '../SessionContext.jsx';
import apiClient from '../../services/apiClient.js';

function wrapper({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

describe('SessionContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
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
      },
      features: ['reports:generate'],
    };

    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.login(payload);
    });

    await waitFor(() => {
      expect(apiClient.setAuthTokens).toHaveBeenCalledWith({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresAt: '2024-09-01T12:00:00Z',
      });
    });

    expect(result.current.session.email).toBe('morgan@example.com');
    expect(result.current.session.memberships).toContain('Admin');
    expect(result.current.session.primaryDashboard).toBe('Admin');
    expect(result.current.roleKeys).toEqual(expect.arrayContaining(['admin', 'agency']));
    expect(result.current.permissionKeys).toEqual(
      expect.arrayContaining(['calendar_view', 'calendar_manage', 'projects_read', 'reports_generate']),
    );
    expect(result.current.hasRole('ADMIN')).toBe(true);
    expect(result.current.hasPermission('calendar:manage')).toBe(true);
    await waitFor(() => {
      expect(window.localStorage.getItem('gigvora:web:session')).not.toBeNull();
    });
  });

  it('updates and clears session state', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.login({
        id: 'user-10',
        memberships: ['freelancer'],
        permissions: ['calendar:view'],
        tokens: { accessToken: 'token-a', refreshToken: 'token-b' },
      });
    });

    act(() => {
      result.current.updateSession({
        memberships: ['company'],
        permissions: ['calendar:manage'],
      });
    });

    expect(result.current.hasRole('company')).toBe(true);
    expect(result.current.hasPermission('calendar:manage')).toBe(true);

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
