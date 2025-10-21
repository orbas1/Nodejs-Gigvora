import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
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

describe('DashboardLayout access control', () => {
  beforeEach(() => {
    guardMock.mockClear();
  });

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
