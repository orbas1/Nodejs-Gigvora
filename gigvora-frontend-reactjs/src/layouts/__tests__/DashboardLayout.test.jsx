import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach, beforeAll, afterEach, afterAll, vi } from 'vitest';
import DashboardLayout from '../DashboardLayout.jsx';

const guardMock = vi.hoisted(() =>
  vi.fn(({ children, requiredRoles = [], requiredPermissions = [] }) => (
    <div
      data-testid="dashboard-access-guard"
      data-required-roles={requiredRoles.join(',')}
      data-required-permissions={requiredPermissions.join(',')}
    >
      {children}
    </div>
  )),
);

const fetchNavigationPreferences = vi.hoisted(() =>
  vi.fn(async () => ({
    dashboardKey: 'company',
    collapsed: false,
    order: [],
    hidden: [],
    pinned: [],
  })),
);

const saveNavigationPreferences = vi.hoisted(() => vi.fn(async () => ({})));
const analyticsTrackMock = vi.hoisted(() => vi.fn());
const useSessionMock = vi.hoisted(() =>
  vi.fn(() => ({
    session: { id: 101, primaryDashboard: 'company' },
    isAuthenticated: true,
  })),
);

vi.mock('../../components/security/DashboardAccessGuard.jsx', () => ({
  __esModule: true,
  default: guardMock,
}));

vi.mock('../../components/messaging/MessagingDock.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="messaging-dock" />,
}));

vi.mock('../../components/ads/AdPlacementRail.jsx', () => ({
  __esModule: true,
  default: ({ surface }) => <div data-testid="ad-rail" data-surface={surface} />,
}));

vi.mock('../../images/Gigvora Logo.png', () => ({
  __esModule: true,
  default: 'gigvora-logo.png',
}));

vi.mock('../../services/navigationPreferences.js', () => ({
  __esModule: true,
  fetchNavigationPreferences,
  saveNavigationPreferences,
}));

vi.mock('../../services/analytics.js', () => ({
  __esModule: true,
  default: { track: analyticsTrackMock },
}));

vi.mock('../../hooks/useSession.js', () => ({
  __esModule: true,
  default: useSessionMock,
}));

const baseProps = {
  title: 'Dashboard',
  menuSections: [],
  sections: [],
  availableDashboards: [],
  children: <div>Content</div>,
};

function renderLayout(props = {}) {
  return render(
    <MemoryRouter>
      <DashboardLayout {...baseProps} {...props} />
    </MemoryRouter>,
  );
}

beforeAll(() => {
  class MockIntersectionObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

beforeEach(() => {
  fetchNavigationPreferences.mockResolvedValue({
    dashboardKey: 'company',
    collapsed: false,
    order: [],
    hidden: [],
    pinned: [],
  });
  saveNavigationPreferences.mockResolvedValue({});
  analyticsTrackMock.mockClear();
  useSessionMock.mockReturnValue({
    session: { id: 101, primaryDashboard: 'company' },
    isAuthenticated: true,
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('DashboardLayout access control', () => {
  beforeEach(() => {
    guardMock.mockClear();
  });

  it('enforces admin access for admin dashboards by default', () => {
    renderLayout({ currentDashboard: 'admin' });

    expect(guardMock).toHaveBeenCalled();
    const guardProps = guardMock.mock.calls.at(-1)?.[0];
    expect(guardProps.requiredRoles).toEqual(['admin']);
    expect(screen.getByTestId('dashboard-access-guard').dataset.requiredRoles).toContain('admin');
  });

  it('passes through when dashboard is not admin and no guard is configured', () => {
    renderLayout({ currentDashboard: 'company' });

    expect(guardMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('dashboard-access-guard')).not.toBeInTheDocument();
  });

  it('honours explicit required roles when provided', () => {
    renderLayout({
      currentDashboard: 'admin',
      requiredRoles: ['operations_admin', 'super_admin'],
    });

    expect(guardMock).toHaveBeenCalled();
    const guardProps = guardMock.mock.calls.at(-1)?.[0];
    expect(guardProps.requiredRoles).toEqual(['operations_admin', 'super_admin']);
    expect(screen.getByTestId('dashboard-access-guard').dataset.requiredRoles).toBe('operations_admin,super_admin');
  });

  it('allows disabling the guard explicitly', () => {
    renderLayout({ currentDashboard: 'admin', enforceAccessControl: false });

    expect(guardMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('dashboard-access-guard')).not.toBeInTheDocument();
  });

  it('applies required permissions when provided', () => {
    renderLayout({
      currentDashboard: 'admin',
      requiredPermissions: ['manage_admin_console'],
    });

    expect(guardMock).toHaveBeenCalled();
    const guardProps = guardMock.mock.calls.at(-1)?.[0];
    expect(guardProps.requiredPermissions).toEqual(['manage_admin_console']);
    expect(screen.getByTestId('dashboard-access-guard').dataset.requiredPermissions).toBe('manage_admin_console');
  });
});

describe('DashboardLayout layout behaviour', () => {
  const navigationSections = [
    {
      id: 'core',
      label: 'Core',
      items: [
        { id: 'overview', name: 'Overview' },
        { id: 'activity', name: 'Activity' },
      ],
    },
  ];

  it('toggles collapsed state and persists preference', async () => {
    renderLayout({ currentDashboard: 'company', sections: navigationSections });

    await waitFor(() => {
      expect(fetchNavigationPreferences).toHaveBeenCalled();
    });

    expect(screen.getByTestId('dashboard-sidebar').dataset.collapsed).toBe('false');

    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(collapseButton);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-sidebar').dataset.collapsed).toBe('true');
    });

    await waitFor(() => {
      expect(window.localStorage.getItem('gigvora.dashboard.company.sidebar')).toBe(
        JSON.stringify({ collapsed: true }),
      );
    });

    await waitFor(() => {
      expect(saveNavigationPreferences).toHaveBeenCalledWith(101, {
        dashboardKey: 'company',
        order: ['overview', 'activity'],
        hidden: [],
        collapsed: true,
      });
    });

    expect(analyticsTrackMock).toHaveBeenCalledWith('web_dashboard_sidebar_toggle', {
      dashboard: 'company',
      collapsed: true,
    });

    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-sidebar').dataset.collapsed).toBe('false');
    });

    await waitFor(() => {
      expect(window.localStorage.getItem('gigvora.dashboard.company.sidebar')).toBe(
        JSON.stringify({ collapsed: false }),
      );
    });

    await waitFor(() => {
      expect(saveNavigationPreferences).toHaveBeenLastCalledWith(101, {
        dashboardKey: 'company',
        order: ['overview', 'activity'],
        hidden: [],
        collapsed: false,
      });
    });
  });

  it('restores persisted collapsed preference on mount', async () => {
    window.localStorage.setItem(
      'gigvora.dashboard.company.sidebar',
      JSON.stringify({ collapsed: true }),
    );

    fetchNavigationPreferences.mockResolvedValueOnce({
      dashboardKey: 'company',
      collapsed: true,
      order: [],
      hidden: [],
      pinned: [],
    });

    renderLayout({ currentDashboard: 'company', sections: navigationSections });

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-sidebar').dataset.collapsed).toBe('true');
    });

    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
  });
});
