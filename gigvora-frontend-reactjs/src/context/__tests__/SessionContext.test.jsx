import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storedTokens = { accessToken: null, refreshToken: null, expiresAt: null };

const baseSessionPayload = {
  user: {
    id: 'user-201',
    firstName: 'Jordan',
    lastName: 'Avery',
    email: 'jordan@example.com',
    memberships: ['Admin'],
    permissions: ['calendar:view'],
    capabilities: ['calendar:manage'],
    grants: ['projects:read'],
    tokens: {
      accessToken: 'access-token-201',
      refreshToken: 'refresh-token-201',
      expiresAt: '2024-10-01T00:00:00Z',
    },
    featureFlags: {
      'beta-dashboard': { enabled: true, metadata: { cohort: 'admins' } },
    },
  },
  featureFlags: {
    'beta-dashboard': { enabled: true, metadata: { cohort: 'admins' } },
  },
  refreshMeta: {
    sessionId: 987,
    deviceLabel: 'MacBook Pro 16',
    deviceFingerprint: 'fingerprint-xyz',
    ipAddress: '198.51.100.10',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    riskLevel: 'low',
    riskScore: 10,
    riskSignals: [
      {
        code: 'first_session',
        severity: 'low',
        message: 'First refresh session recorded for this account.',
        observedAt: '2024-10-01T00:00:00Z',
      },
    ],
    evaluatedAt: '2024-10-01T00:05:00Z',
    expiresAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-10-01T00:05:00Z',
    createdAt: '2024-10-01T00:04:00Z',
  },
  sessionRisk: {
    level: 'low',
    score: 10,
    signals: [
      {
        code: 'first_session',
        severity: 'low',
        message: 'First refresh session recorded for this account.',
        observedAt: '2024-10-01T00:00:00Z',
      },
    ],
    evaluatedAt: '2024-10-01T00:05:00Z',
    deviceLabel: 'MacBook Pro 16',
    deviceFingerprint: 'fingerprint-xyz',
    ipAddress: '198.51.100.10',
    userAgent: 'Mozilla/5.0 (Macintosh)',
  },
};

function createMockSessionResponse(overrides = {}) {
  const baseClone = JSON.parse(JSON.stringify(baseSessionPayload));
  const overrideClone = JSON.parse(JSON.stringify(overrides ?? {}));
  const userOverride = overrideClone.user ?? {};
  const featureFlagsOverride =
    overrideClone.featureFlags !== undefined ? overrideClone.featureFlags : undefined;
  const refreshMetaOverride =
    overrideClone.refreshMeta !== undefined ? overrideClone.refreshMeta : undefined;
  const sessionRiskOverride =
    overrideClone.sessionRisk !== undefined ? overrideClone.sessionRisk : undefined;

  const session = {
    ...baseClone,
    ...overrideClone,
    user: { ...baseClone.user, ...userOverride },
    featureFlags:
      featureFlagsOverride !== undefined ? featureFlagsOverride : JSON.parse(JSON.stringify(baseClone.featureFlags)),
    refreshMeta:
      refreshMetaOverride !== undefined ? refreshMetaOverride : JSON.parse(JSON.stringify(baseClone.refreshMeta)),
    sessionRisk:
      sessionRiskOverride !== undefined ? sessionRiskOverride : JSON.parse(JSON.stringify(baseClone.sessionRisk)),
  };

  if (userOverride.featureFlags) {
    session.user.featureFlags = userOverride.featureFlags;
  } else {
    session.user.featureFlags = JSON.parse(JSON.stringify(session.featureFlags));
  }

  return { session };
}

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
  const fetchCurrentSession = vi.fn(() => Promise.resolve(createMockSessionResponse()));
  const refreshSession = vi.fn(() => Promise.resolve(createMockSessionResponse()));
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
    fetchCurrentSessionMock.mockResolvedValue(createMockSessionResponse());
    refreshSessionMock.mockResolvedValue(createMockSessionResponse());
  });

  it('normalises session payloads and exposes RBAC helpers', async () => {
    fetchCurrentSessionMock.mockResolvedValue({ session: {} });
    refreshSessionMock.mockResolvedValue({ session: {} });
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
      refreshMeta: {
        deviceLabel: 'Surface Laptop',
        deviceFingerprint: 'fingerprint-1',
        ipAddress: '203.0.113.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
        riskLevel: 'Medium',
        riskScore: '60',
        riskSignals: [
          { code: 'anonymous_network', severity: 'high', message: 'Proxy detected', observedAt: '2024-09-01T10:00:00Z' },
          { code: 'anonymous_network', severity: 'high', message: 'Proxy detected', observedAt: '2024-09-01T10:00:00Z' },
        ],
        expiresAt: '2024-09-01T12:00:00Z',
      },
      sessionRisk: { level: 'medium', score: 60 },
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
    expect(result.current.session.refreshMeta).toMatchObject({
      deviceLabel: 'Surface Laptop',
      deviceFingerprint: 'fingerprint-1',
      riskLevel: 'medium',
      riskScore: 60,
    });
    expect(result.current.session.refreshMeta.riskSignals).toHaveLength(1);
    expect(result.current.session.sessionRisk).toMatchObject({
      level: 'medium',
      score: 60,
      deviceLabel: 'Surface Laptop',
    });
  });

  it('ignores empty session payloads during reload and refresh', async () => {
    fetchCurrentSessionMock.mockResolvedValue({ session: {} });
    refreshSessionMock.mockResolvedValue({ session: {} });
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
        refreshMeta: { riskLevel: 'low', riskScore: 0 },
        sessionRisk: { level: 'low', score: 0 },
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
    expect(result.current.session.sessionRisk).toMatchObject({ level: 'low', score: 0 });
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
