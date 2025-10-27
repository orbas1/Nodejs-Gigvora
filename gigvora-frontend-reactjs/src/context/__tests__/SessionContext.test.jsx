import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let logoutMock;

vi.mock('../../services/apiClient.js', () => {
  const mock = {
    setAuthTokens: vi.fn(),
    clearAuthTokens: vi.fn(),
    clearAccessToken: vi.fn(),
    clearRefreshToken: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

vi.mock('../../services/auth.js', () => ({
  __esModule: true,
  default: {
    logout: (...args) => logoutMock(...args),
  },
  logout: (...args) => logoutMock(...args),
}));

logoutMock = vi.fn();

import { SessionProvider, useSession } from '../SessionContext.jsx';
import apiClient from '../../services/apiClient.js';

class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.listeners = new Set();
    MockBroadcastChannel.channels.add(this);
  }

  postMessage(data) {
    MockBroadcastChannel.channels.forEach((channel) => {
      if (channel.name !== this.name) {
        return;
      }
      channel.listeners.forEach((listener) => listener({ data }));
    });
  }

  addEventListener(event, listener) {
    if (event !== 'message') {
      return;
    }
    this.listeners.add(listener);
  }

  removeEventListener(event, listener) {
    if (event !== 'message') {
      return;
    }
    this.listeners.delete(listener);
  }

  close() {
    this.listeners.clear();
    MockBroadcastChannel.channels.delete(this);
  }
}

MockBroadcastChannel.channels = new Set();
MockBroadcastChannel.reset = () => {
  MockBroadcastChannel.channels.forEach((channel) => {
    channel.listeners.clear();
  });
  MockBroadcastChannel.channels.clear();
};

function wrapper({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

describe('SessionContext', () => {
  beforeEach(() => {
    window.BroadcastChannel = MockBroadcastChannel;
    MockBroadcastChannel.reset();
    window.localStorage.clear();
    vi.clearAllMocks();
    logoutMock.mockReset();
    logoutMock.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    MockBroadcastChannel.reset();
    delete window.BroadcastChannel;
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
      featureFlags: {
        'reports:generate': { enabled: true, metadata: { cohort: 'alpha' } },
        'networking:beta': { enabled: false },
      },
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
    expect(result.current.isFeatureEnabled('reports:generate')).toBe(true);
    expect(result.current.isFeatureEnabled('REPORTS_GENERATE')).toBe(true);
    expect(result.current.isFeatureEnabled('networking:beta')).toBe(false);
    expect(result.current.enabledFeatureFlagKeys).toContain('reports:generate');
    expect(result.current.featureFlagKeys).toEqual(expect.arrayContaining(['reports:generate', 'networking:beta']));
    await waitFor(() => {
      expect(window.localStorage.getItem('gigvora:web:session')).not.toBeNull();
    });
  });

  it('updates and clears session state', async () => {
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

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutMock).toHaveBeenCalledWith({ refreshToken: 'token-b', reason: 'user_logout' });
    expect(apiClient.clearAuthTokens).toHaveBeenCalled();
    expect(apiClient.clearAccessToken).toHaveBeenCalled();
    expect(apiClient.clearRefreshToken).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
    expect(window.localStorage.getItem('gigvora:web:session')).toBeNull();
  });

  it('still clears local session when remote revocation fails', async () => {
    logoutMock.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.login({
        id: 'user-11',
        memberships: ['freelancer'],
        tokens: { accessToken: 'access-x', refreshToken: 'refresh-x' },
      });
    });

    await act(async () => {
      await result.current.logout({ reason: 'user_choice' });
    });

    expect(logoutMock).toHaveBeenCalledWith({ refreshToken: 'refresh-x', reason: 'user_choice' });
    expect(apiClient.clearAuthTokens).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  it('synchronises session updates from storage events', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.login({
        id: 'user-10',
        memberships: ['freelancer'],
        tokens: { accessToken: 'initial-token', refreshToken: 'initial-refresh' },
      });
    });

    await waitFor(() => {
      expect(result.current.session?.id).toBe('user-10');
    });

    const updatedSession = {
      id: 'user-42',
      memberships: ['company'],
      featureFlags: { 'networking:beta': { enabled: true } },
      tokens: { accessToken: 'shared-token', refreshToken: 'shared-refresh' },
    };

    window.localStorage.setItem('gigvora:web:session', JSON.stringify(updatedSession));

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'gigvora:web:session',
          newValue: JSON.stringify(updatedSession),
          storageArea: window.localStorage,
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.session?.id).toBe('user-42');
      expect(result.current.isFeatureEnabled('networking:beta')).toBe(true);
    });
  });

  it('propagates session updates through BroadcastChannel listeners', async () => {
    const first = renderHook(() => useSession(), { wrapper });
    const second = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(MockBroadcastChannel.channels.size).toBe(2);
    });

    act(() => {
      first.result.current.login({
        id: 'user-10',
        memberships: ['freelancer'],
        tokens: { accessToken: 'initial-token', refreshToken: 'initial-refresh' },
      });
    });

    await waitFor(() => {
      expect(first.result.current.session?.id).toBe('user-10');
    });

    await waitFor(() => {
      expect(second.result.current.session?.id).toBe('user-10');
    });

    act(() => {
      first.result.current.updateSession({
        featureFlags: { 'networking:beta': { enabled: true } },
      });
    });

    await waitFor(() => {
      expect(second.result.current.isFeatureEnabled('networking:beta')).toBe(true);
    });

    first.unmount();
    second.unmount();
  });
});
