import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SecurityOperationsPage from '../pages/SecurityOperationsPage.jsx';
import TrustCenterPage from '../pages/TrustCenter.jsx';
import useSession from '../hooks/useSession.js';

vi.mock('../components/PageHeader.jsx', () => ({
  default: ({ title, description, actions, meta }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
      {actions}
      {meta}
    </header>
  ),
}));

vi.mock('../components/ProfileEditor.jsx', () => ({
  default: () => <div data-testid="profile-editor" />,
}));

vi.mock('../components/TrustScoreBreakdown.jsx', () => ({
  default: () => <div data-testid="trust-score" />,
}));

vi.mock('../components/reputation/ReputationEngineShowcase.jsx', () => ({
  default: () => <div data-testid="reputation-showcase" />,
}));

vi.mock('../components/marketing/GigvoraAds.jsx', () => ({
  GigvoraAdBanner: () => <div data-testid="ad-banner" />,
  GigvoraAdGrid: () => <div data-testid="ad-grid" />,
}));

vi.mock('../components/compliance/ConsentHistoryTimeline.jsx', () => ({
  default: () => <div data-testid="consent-history" />,
}));

vi.mock('../components/AccessRestricted.jsx', () => ({
  __esModule: true,
  default: ({ title, description, actionLabel, onAction }) => (
    <div data-testid="access-restricted">
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock('../hooks/useSession.js', () => ({
  default: vi.fn(() => ({ session: null, isAuthenticated: false, login: vi.fn(), logout: vi.fn() })),
}));

vi.mock('../services/auth.js', () => ({
  registerUser: vi.fn(),
  loginWithGoogle: vi.fn(),
}));

vi.mock('../services/apiClient.js', () => {
  const apiClientMock = {
    ApiError: class ApiError extends Error {},
    readCache: vi.fn(() => null),
    writeCache: vi.fn(),
    removeCache: vi.fn(),
    setAuthToken: vi.fn(),
    getAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
    storeAccessToken: vi.fn(),
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    getRefreshToken: vi.fn(),
    clearRefreshToken: vi.fn(),
    setAuthTokens: vi.fn(),
    getAuthTokens: vi.fn(),
    clearAuthTokens: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  return {
    __esModule: true,
    apiClient: apiClientMock,
    default: apiClientMock,
  };
});

vi.mock('../services/profile.js', () => ({
  fetchProfile: vi.fn(),
  updateProfile: vi.fn(),
  updateProfileAvailability: vi.fn(),
}));

vi.mock('../services/profileHub.js', () => ({
  listFollowers: vi.fn(),
  saveFollower: vi.fn(),
  deleteFollower: vi.fn(),
}));

vi.mock('../services/reputation.js', () => ({
  fetchFreelancerReputation: vi.fn(),
}));

vi.mock('../services/user.js', () => ({
  fetchUser: vi.fn(),
  updateUserAccount: vi.fn(),
}));

vi.mock('../services/creationStudio.js', () => ({
  listCreationStudioItems: vi.fn(),
}));

vi.mock('../services/consent.js', () => ({
  fetchUserConsentSnapshot: vi.fn(),
  updateUserConsent: vi.fn(),
}));

vi.mock('../services/security.js', () => ({
  acknowledgeSecurityAlert: vi.fn(),
  fetchSecurityTelemetry: vi.fn(),
  suppressSecurityAlert: vi.fn(),
  triggerThreatSweep: vi.fn(),
}));

vi.mock('../services/trust.js', () => ({
  fetchTrustOverview: vi.fn(),
  releaseEscrow: vi.fn(),
}));

vi.mock('../utils/permissions.js', () => ({
  hasSecurityOperationsAccess: vi.fn(() => false),
  hasFinanceOperationsAccess: vi.fn(() => false),
}));

describe('Account and security pages', () => {
  beforeEach(() => {
    useSession.mockReset();
  });

  it('blocks access to security operations when permissions are missing', async () => {
    const { hasSecurityOperationsAccess } = await import('../utils/permissions.js');
    hasSecurityOperationsAccess.mockReturnValue(false);
    useSession.mockReturnValue({ session: { memberships: ['user'] }, isAuthenticated: true });

    render(
      <MemoryRouter>
        <SecurityOperationsPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('access-restricted')).toBeInTheDocument();
  });

  it('fetches trust overview and releases escrow for admins', async () => {
    const { fetchTrustOverview, releaseEscrow } = await import('../services/trust.js');
    const { hasFinanceOperationsAccess } = await import('../utils/permissions.js');
    hasFinanceOperationsAccess.mockReturnValue(true);
    fetchTrustOverview.mockResolvedValue({
      totalsByStatus: {},
      disputesByStage: {},
      releaseQueue: [
        {
          id: 'escrow-1',
          reference: 'ESC-1',
          amount: 1000,
          currencyCode: 'USD',
          initiatedById: 'user-1',
          status: 'in_escrow',
        },
      ],
      disputeQueue: [],
      releaseAgingBuckets: {},
      activeAccounts: [{ currencyCode: 'USD' }],
    });
    releaseEscrow.mockResolvedValue({});
    useSession.mockReturnValue({ session: { memberships: ['admin'] }, isAuthenticated: true });

    render(
      <MemoryRouter>
        <TrustCenterPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchTrustOverview).toHaveBeenCalled();
    });

    const releaseButtons = await screen.findAllByRole('button', { name: /Release/i });
    if (releaseButtons.length) {
      await act(async () => {
        await userEvent.click(releaseButtons[0]);
      });
      await waitFor(() => {
        expect(releaseEscrow).toHaveBeenCalledWith('escrow-1', expect.any(Object));
      });
    }
  });
});
