import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import DashboardAccessDenied from '../DashboardAccessDenied.jsx';
import MembershipGate from '../MembershipGate.jsx';
import ProtectedDashboardRoute from '../ProtectedDashboardRoute.jsx';
import ProtectedRoute from '../../routing/ProtectedRoute.jsx';
import RequireDashboardAccess from '../RequireDashboardAccess.jsx';
import RequireMembership from '../RequireMembership.jsx';

const { mockUseSession } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
}));

vi.mock('../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: mockUseSession,
}));

afterEach(() => {
  vi.clearAllMocks();
  mockUseSession.mockReset();
});

describe('DashboardAccessDenied', () => {
  it('lists alternative dashboards when memberships are provided', () => {
    render(
      <MemoryRouter>
        <DashboardAccessDenied requiredRole="agency" memberships={['user', 'company']} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Access restricted/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /User & Job Seeker/i })).toHaveAttribute('href', '/dashboard/user');
    expect(screen.getByRole('link', { name: /Company/i })).toHaveAttribute('href', '/dashboard/company');
  });
});

describe('MembershipGate', () => {
  it('prompts unauthenticated visitors to sign in', () => {
    mockUseSession.mockImplementation(() => ({ isAuthenticated: false, session: null }));

    render(
      <MemoryRouter initialEntries={['/dashboard/agency']}>
        <MembershipGate allowedMemberships={['agency']}>
          <div>Agency dashboard</div>
        </MembershipGate>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Sign in to open Gigvora dashboards/i)).toBeInTheDocument();
  });

  it('blocks users without required memberships', () => {
    mockUseSession.mockImplementation(() => ({
      isAuthenticated: true,
      session: { memberships: ['user'] },
    }));

    render(
      <MemoryRouter>
        <MembershipGate allowedMemberships={['agency']}>
          <div>Agency dashboard</div>
        </MembershipGate>
      </MemoryRouter>,
    );

    expect(screen.getByText(/This dashboard needs extra permissions/i)).toBeInTheDocument();
    expect(screen.getByText(/Required access/i)).toBeInTheDocument();
  });

  it('renders children when access is granted', () => {
    mockUseSession.mockImplementation(() => ({
      isAuthenticated: true,
      session: { memberships: ['agency'] },
    }));

    render(
      <MemoryRouter>
        <MembershipGate allowedMemberships={['agency']}>
          <div>Agency dashboard</div>
        </MembershipGate>
      </MemoryRouter>,
    );

    expect(screen.getByText('Agency dashboard')).toBeInTheDocument();
  });
});

describe('ProtectedDashboardRoute', () => {
  it('redirects unauthenticated users to the login page', () => {
    mockUseSession.mockImplementation(() => ({ isAuthenticated: false, session: null }));

    render(
      <MemoryRouter initialEntries={['/dashboard/agency']}>
        <Routes>
          <Route
            path="/dashboard/agency"
            element={
              <ProtectedDashboardRoute role="agency">
                <div>Agency route</div>
              </ProtectedDashboardRoute>
            }
          />
          <Route path="/login" element={<div>Login screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Login screen/)).toBeInTheDocument();
  });

  it('renders dashboard when membership matches', () => {
    mockUseSession.mockImplementation(() => ({
      isAuthenticated: true,
      session: { memberships: ['agency'] },
    }));

    render(
      <MemoryRouter initialEntries={['/dashboard/agency']}>
        <Routes>
          <Route
            path="/dashboard/agency"
            element={
              <ProtectedDashboardRoute role="agency">
                <div>Agency route</div>
              </ProtectedDashboardRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Agency route')).toBeInTheDocument();
  });
});

describe('ProtectedRoute', () => {
  it('redirects unauthorised members to their available dashboard when preferred', () => {
    mockUseSession.mockImplementation(() => ({
      isAuthenticated: true,
      session: { memberships: ['user'], primaryDashboard: 'user' },
    }));

    render(
      <MemoryRouter initialEntries={['/agency']}>
        <Routes>
          <Route
            path="/agency"
            element={
              <ProtectedRoute allowedMemberships={['agency']} preferDashboardRedirect>
                <div>Agency only</div>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/user" element={<div>User dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/User dashboard/i)).toBeInTheDocument();
  });

  it('shows protected content when membership matches', () => {
    mockUseSession.mockImplementation(() => ({
      isAuthenticated: true,
      session: { memberships: ['agency'], primaryDashboard: 'agency' },
    }));

    render(
      <MemoryRouter initialEntries={['/agency']}>
        <Routes>
          <Route
            path="/agency"
            element={
              <ProtectedRoute allowedMemberships={['agency']}>
                <div>Agency only</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Agency only')).toBeInTheDocument();
  });
});

describe('RequireDashboardAccess', () => {
  it('redirects unauthenticated users to login', () => {
    mockUseSession.mockImplementation(() => ({ isAuthenticated: false, session: null }));

    render(
      <MemoryRouter initialEntries={['/dashboard/company']}>
        <Routes>
          <Route
            path="/dashboard/company"
            element={
              <RequireDashboardAccess requiredRoles={['company']}>
                <div>Company dashboard</div>
              </RequireDashboardAccess>
            }
          />
          <Route path="/login" element={<div>Login gateway</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Login gateway/)).toBeInTheDocument();
  });

  it('renders access denied notice when memberships missing', () => {
    mockUseSession.mockImplementation(() => ({
      isAuthenticated: true,
      session: { memberships: ['user'] },
    }));

    render(
      <MemoryRouter>
        <RequireDashboardAccess requiredRoles={['company']}>
          <div>Company dashboard</div>
        </RequireDashboardAccess>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Access restricted/i)).toBeInTheDocument();
  });
});

describe('RequireMembership', () => {
  it('redirects unauthenticated visitors to login', () => {
    mockUseSession.mockImplementation(() => ({ isAuthenticated: false, session: null }));

    render(
      <MemoryRouter initialEntries={['/secure']}>
        <Routes>
          <Route
            path="/secure"
            element={
              <RequireMembership role="agency">
                <div>Secure dashboard</div>
              </RequireMembership>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Login page/)).toBeInTheDocument();
  });

  it('renders fallback when user lacks membership', () => {
    mockUseSession.mockImplementation(() => ({
      isAuthenticated: true,
      session: { memberships: ['user'] },
    }));

    render(
      <MemoryRouter>
        <RequireMembership role="agency" fallback={<div>Fallback view</div>}>
          <div>Secure dashboard</div>
        </RequireMembership>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Fallback view/)).toBeInTheDocument();
  });

  it('renders notice when no fallback is provided', () => {
    mockUseSession.mockImplementation(() => ({
      isAuthenticated: true,
      session: { memberships: ['user'] },
    }));

    render(
      <MemoryRouter>
        <RequireMembership role="agency">
          <div>Secure dashboard</div>
        </RequireMembership>
      </MemoryRouter>,
    );

    expect(screen.getByText(/limited to approved agency operators/i)).toBeInTheDocument();
  });
});

