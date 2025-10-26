import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../routing/ProtectedRoute.jsx';
import MembershipGate from '../MembershipGate.jsx';

vi.mock('../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

const useSession = (await import('../../../hooks/useSession.js')).default;

describe('Access control components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSession.mockReturnValue({
      isAuthenticated: true,
      session: {
        primaryDashboard: 'agency',
        memberships: ['agency'],
        accountTypes: [],
      },
    });
  });

  it('renders children when membership requirements are met', () => {
    render(
      <MemoryRouter initialEntries={["/secure"]}>
        <Routes>
          <Route
            path="/secure"
            element={
              <ProtectedRoute allowedMemberships={['agency']}>
                <div>Secure content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Secure content')).toBeInTheDocument();
  });

  it('redirects to the preferred dashboard when membership is missing', async () => {
    render(
      <MemoryRouter initialEntries={["/secure"]}>
        <Routes>
          <Route
            path="/secure"
            element={
              <ProtectedRoute allowedMemberships={['company']} preferDashboardRedirect>
                <div>Hidden content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/agency" element={<div>Agency home</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Agency home')).toBeInTheDocument();
  });

  it('shows upgrade message in MembershipGate when lacking access', async () => {
    useSession.mockReturnValueOnce({
      isAuthenticated: true,
      session: {
        primaryDashboard: 'user',
        memberships: ['user'],
        accountTypes: [],
      },
    });

    render(
      <MemoryRouter>
        <MembershipGate allowedMemberships={['agency']}>
          <div>Should not render</div>
        </MembershipGate>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/This dashboard needs extra permissions/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Your current memberships/i })).toBeInTheDocument();
  });
});
