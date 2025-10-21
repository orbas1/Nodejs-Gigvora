import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const moduleMocks = vi.hoisted(() => ({
  dashboardLayoutSpy: vi.fn(({ children }) => <div data-testid="dashboard-layout">{children}</div>),
  dataStatusSpy: vi.fn(() => <div data-testid="data-status" />),
  userCalendarSectionSpy: vi.fn(() => <div data-testid="calendar-section" />),
  dashboardAccessGuardSpy: vi.fn(({ children }) => <div data-testid="access-guard">{children}</div>),
  useCachedResourceMock: vi.fn(),
  fetchUserDashboardMock: vi.fn(),
  useSessionMock: vi.fn(),
  buildMenuSectionsMock: vi.fn(() => []),
  buildProfileCardMock: vi.fn(() => ({ id: 'profile-card' })),
}));

const {
  dashboardLayoutSpy,
  dataStatusSpy,
  userCalendarSectionSpy,
  dashboardAccessGuardSpy,
  useCachedResourceMock,
  fetchUserDashboardMock,
  useSessionMock,
  buildMenuSectionsMock,
  buildProfileCardMock,
} = moduleMocks;

vi.mock('../../../../layouts/DashboardLayout.jsx', () => ({
  __esModule: true,
  default: moduleMocks.dashboardLayoutSpy,
}));

vi.mock('../../../../components/DataStatus.jsx', () => ({
  __esModule: true,
  default: moduleMocks.dataStatusSpy,
}));

vi.mock('../../../../components/calendar/UserCalendarSection.jsx', () => ({
  __esModule: true,
  default: moduleMocks.userCalendarSectionSpy,
}));

vi.mock('../../../../components/security/DashboardAccessGuard.jsx', () => ({
  __esModule: true,
  default: moduleMocks.dashboardAccessGuardSpy,
}));

vi.mock('../../../../hooks/useCachedResource.js', () => ({
  __esModule: true,
  default: moduleMocks.useCachedResourceMock,
}));

vi.mock('../../../../services/userDashboard.js', () => ({
  __esModule: true,
  fetchUserDashboard: moduleMocks.fetchUserDashboardMock,
  default: { fetchUserDashboard: moduleMocks.fetchUserDashboardMock },
}));

vi.mock('../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: moduleMocks.useSessionMock,
}));

vi.mock('../../UserDashboardPage.jsx', () => ({
  __esModule: true,
  buildUserDashboardMenuSections: moduleMocks.buildMenuSectionsMock,
  buildProfileCard: moduleMocks.buildProfileCardMock,
}));

import UserCalendarPage from '../UserCalendarPage.jsx';

describe('UserCalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCachedResourceMock.mockReset();
    useSessionMock.mockReset();
    fetchUserDashboardMock.mockReset();
    buildMenuSectionsMock.mockClear();
    buildProfileCardMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('loads calendar data when the user has calendar manage permissions', async () => {
    const refresh = vi.fn();
    const timestamp = new Date('2024-01-01T00:00:00Z');
    const data = {
      summary: { name: 'Example user' },
      insights: { calendar: { events: [{ id: 'evt-1' }] } },
    };

    useSessionMock.mockReturnValue({
      session: {
        userId: 42,
        permissions: ['calendar:manage'],
        permissionKeys: ['calendar_manage'],
        roles: ['user'],
        roleKeys: ['user'],
        memberships: ['user'],
      },
      isAuthenticated: true,
      hasPermission: vi.fn((permission) => permission === 'calendar:manage'),
      hasRole: vi.fn((role) => role === 'user'),
    });

    fetchUserDashboardMock.mockResolvedValue({ ok: true });
    useCachedResourceMock.mockReturnValue({
      data,
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: timestamp,
      refresh,
    });

    render(<UserCalendarPage />);

    expect(dashboardAccessGuardSpy).toHaveBeenCalledTimes(1);
    const guardProps = dashboardAccessGuardSpy.mock.calls[0][0];
    expect(guardProps.requiredRoles).toEqual([
      'user',
      'freelancer',
      'agency',
      'company',
      'headhunter',
      'platform:admin',
    ]);

    expect(useCachedResourceMock).toHaveBeenCalledTimes(1);
    const [cacheKey, fetcher, options] = useCachedResourceMock.mock.calls[0];
    expect(cacheKey).toBe('dashboard:user:calendar:42');
    expect(options).toEqual({ ttl: 60000, dependencies: [42], enabled: true });

    await fetcher({ signal: 'abort-signal' });
    expect(fetchUserDashboardMock).toHaveBeenCalledWith(42, { signal: 'abort-signal' });

    expect(dataStatusSpy).toHaveBeenCalledTimes(1);
    const dataStatusProps = dataStatusSpy.mock.calls[0][0];
    expect(dataStatusProps).toMatchObject({
      loading: false,
      error: undefined,
      fromCache: false,
      lastUpdated: timestamp,
      onRetry: refresh,
    });

    expect(userCalendarSectionSpy).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 42, insights: data.insights.calendar, canManage: true }),
      {},
    );

    expect(screen.queryByTestId('calendar-permission-alert')).not.toBeInTheDocument();
  });

  it('skips loading and displays an access alert when calendar view permission is missing', () => {
    useSessionMock.mockReturnValue({
      session: {
        userId: 99,
        permissions: [],
        permissionKeys: [],
        roles: ['user'],
        roleKeys: ['user'],
        memberships: ['user'],
      },
      isAuthenticated: true,
      hasPermission: vi.fn(() => false),
      hasRole: vi.fn((role) => role === 'user'),
    });

    useCachedResourceMock.mockReturnValue({
      data: null,
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: null,
      refresh: vi.fn(),
    });

    render(<UserCalendarPage />);

    expect(useCachedResourceMock).toHaveBeenCalledTimes(1);
    const [, , options] = useCachedResourceMock.mock.calls[0];
    expect(options).toEqual({ ttl: 60000, dependencies: [99], enabled: false });

    expect(dataStatusSpy).not.toHaveBeenCalled();
    expect(userCalendarSectionSpy).not.toHaveBeenCalled();

    const alert = screen.getByTestId('calendar-permission-alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Calendar access requires additional permissions')).toBeInTheDocument();
  });

  it('allows platform administrators to manage the calendar without explicit permissions', async () => {
    const refresh = vi.fn();
    const timestamp = new Date('2024-03-14T12:00:00Z');

    useSessionMock.mockReturnValue({
      session: {
        id: 501,
        roles: ['platform:admin'],
        roleKeys: ['platform_admin'],
        memberships: ['platform:admin'],
        permissions: [],
        permissionKeys: [],
      },
      isAuthenticated: true,
      hasPermission: vi.fn(() => false),
      hasRole: vi.fn((role) => role === 'platform:admin'),
    });

    fetchUserDashboardMock.mockResolvedValue({ ok: true });
    useCachedResourceMock.mockReturnValue({
      data: { insights: { calendar: { events: [] } } },
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: timestamp,
      refresh,
    });

    render(<UserCalendarPage />);

    expect(useCachedResourceMock).toHaveBeenCalledTimes(1);
    const [cacheKey, fetcher, options] = useCachedResourceMock.mock.calls[0];
    expect(cacheKey).toBe('dashboard:user:calendar:501');
    expect(options).toEqual({ ttl: 60000, dependencies: [501], enabled: true });

    await fetcher({ signal: 'platform-admin-signal' });
    expect(fetchUserDashboardMock).toHaveBeenCalledWith(501, { signal: 'platform-admin-signal' });

    expect(userCalendarSectionSpy).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 501, canManage: true }),
      {},
    );

    expect(screen.queryByTestId('calendar-permission-alert')).not.toBeInTheDocument();
  });
});
