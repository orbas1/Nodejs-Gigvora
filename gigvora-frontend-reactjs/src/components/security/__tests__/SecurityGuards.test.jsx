import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

import useSession from '../../../hooks/useSession.js';
import ProtectedRoute from '../../routing/ProtectedRoute.jsx';
import RequireRole from '../../routing/RequireRole.jsx';
import DashboardAccessGuard from '../DashboardAccessGuard.jsx';
import RequireMembership from '../RequireMembership.jsx';

const mockUseSession = useSession;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseSession.mockReset();
  });

  it('redirects unauthenticated visitors to login', () => {
    mockUseSession.mockReturnValue({ isAuthenticated: false, session: null });

    render(
      <MemoryRouter initialEntries={['/workspace']} initialIndex={0}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute redirectTo="/login" />}>
            <Route path="/workspace" element={<div>Workspace</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('blocks access when memberships do not match', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      session: { memberships: ['basic'], primaryDashboard: 'basic' },
    });

    render(
      <MemoryRouter initialEntries={['/community']} initialIndex={0}>
        <Routes>
          <Route element={<ProtectedRoute requiredMemberships={['pro']} />}>
            <Route path="/community" element={<div>Community feed</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Secure area')).toBeInTheDocument();
    expect(screen.queryByText('Community feed')).not.toBeInTheDocument();
  });

  it('renders the outlet when membership requirements are met', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      session: { memberships: ['pro'], primaryDashboard: 'pro' },
    });

    render(
      <MemoryRouter initialEntries={['/workspace']} initialIndex={0}>
        <Routes>
          <Route element={<ProtectedRoute requiredMemberships={['pro']} />}>
            <Route path="/workspace" element={<div>Allowed area</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Allowed area')).toBeInTheDocument();
  });
});

describe('RequireRole', () => {
  beforeEach(() => {
    mockUseSession.mockReset();
  });

  it('redirects to fallback dashboard when role missing', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      session: {
        roles: ['viewer'],
        primaryDashboard: 'user',
        dashboards: { user: true },
      },
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin' }]} initialIndex={0}>
        <Routes>
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/dashboard/user" element={<div>Dashboard</div>} />
          <Route
            path="/admin"
            element={(
              <RequireRole allowedRoles={['admin']} fallback="/login">
                <div>Admin area</div>
              </RequireRole>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin area')).not.toBeInTheDocument();
  });

  it('renders children when any role matches', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      session: {
        roles: ['admin'],
        primaryDashboard: 'admin',
      },
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin' }]} initialIndex={0}>
        <Routes>
          <Route
            path="/admin"
            element={(
              <RequireRole allowedRoles={['admin']}>
                <div>Admin zone</div>
              </RequireRole>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Admin zone')).toBeInTheDocument();
  });
});


describe('DashboardAccessGuard', () => {
  beforeEach(() => {
    mockUseSession.mockReset();
  });

  it('prompts sign-in for guests', () => {
    mockUseSession.mockReturnValue({ isAuthenticated: false, session: null });

    render(<DashboardAccessGuard>Content</DashboardAccessGuard>);

    expect(screen.getByText('Sign in to access this dashboard')).toBeInTheDocument();
  });

  it('blocks access when permission requirements are not met', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      session: {
        roles: ['viewer'],
        permissions: ['read'],
      },
    });

    render(
      <DashboardAccessGuard requiredRoles={['manager']} requiredPermissions={['write']}>
        Restricted
      </DashboardAccessGuard>,
    );

    expect(screen.getByText('Access restricted')).toBeInTheDocument();
    expect(screen.queryByText('Restricted')).not.toBeInTheDocument();
  });

  it('renders children when role or permission conditions satisfied', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      session: {
        roles: ['manager'],
        permissions: ['write'],
      },
    });

    render(
      <DashboardAccessGuard requiredRoles={['manager']} requiredPermissions={['write']}>
        Dashboard content
      </DashboardAccessGuard>,
    );

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});


describe('RequireMembership', () => {
  beforeEach(() => {
    mockUseSession.mockReset();
  });

  it('redirects guests to login page', () => {
    mockUseSession.mockReturnValue({ isAuthenticated: false, session: null });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/members' }]} initialIndex={0}>
        <Routes>
          <Route path="/login" element={<div>Login view</div>} />
          <Route
            path="/members"
            element={(
              <RequireMembership allowed={["guild"]}>
                <div>Members</div>
              </RequireMembership>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login view')).toBeInTheDocument();
  });

  it('shows access requirements when membership missing', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      session: { memberships: ['basic'], primaryDashboard: 'basic' },
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/members' }]} initialIndex={0}>
        <Routes>
          <Route
            path="/members"
            element={(
              <RequireMembership allowed={["guild"]}>
                <div>Members</div>
              </RequireMembership>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Access restricted')).toBeInTheDocument();
    expect(screen.getByText('Guild membership required')).toBeInTheDocument();
  });

  it('renders children when membership is present', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      session: { memberships: ['guild'], primaryDashboard: 'guild' },
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/members' }]} initialIndex={0}>
        <Routes>
          <Route
            path="/members"
            element={(
              <RequireMembership allowed={["guild"]}>
                <div>Members area</div>
              </RequireMembership>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Members area')).toBeInTheDocument();
  });
});
