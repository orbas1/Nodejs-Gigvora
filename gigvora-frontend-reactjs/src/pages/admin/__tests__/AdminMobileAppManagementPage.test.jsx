import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminMobileAppManagementPage from '../AdminMobileAppManagementPage.jsx';

vi.mock(new URL('../../../layouts/DashboardLayout.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock(new URL('../../../components/dashboard/AccessDeniedPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => <div data-testid="access-denied-panel">Denied {JSON.stringify(props)}</div>,
}));

const mockFetchAdminMobileApps = vi.hoisted(() => vi.fn().mockResolvedValue({ apps: [], summary: {} }));

vi.mock(new URL('../../../services/mobileApps.js', import.meta.url).pathname, () => ({
  __esModule: true,
  fetchAdminMobileApps: mockFetchAdminMobileApps,
  createAdminMobileApp: vi.fn(),
  updateAdminMobileApp: vi.fn(),
  createAdminMobileAppVersion: vi.fn(),
  updateAdminMobileAppVersion: vi.fn(),
  createAdminMobileAppFeature: vi.fn(),
  updateAdminMobileAppFeature: vi.fn(),
  deleteAdminMobileAppFeature: vi.fn(),
}));

const mockUseSession = vi.fn();

vi.mock(new URL('../../../hooks/useSession.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => mockUseSession(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminMobileAppManagementPage />
    </MemoryRouter>,
  );
}

describe('AdminMobileAppManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAdminMobileApps.mockResolvedValue({ apps: [], summary: {} });
  });

  it('shows access controls when the user lacks admin access', () => {
    mockUseSession.mockReturnValue({ session: { permissions: [], capabilities: [] }, isAuthenticated: true });

    renderPage();

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('access-denied-panel')).toBeInTheDocument();
    expect(mockFetchAdminMobileApps).not.toHaveBeenCalled();
  });

  it('renders the mobile app management panel for admins', async () => {
    mockUseSession.mockReturnValue({ session: { permissions: ['admin:full'], capabilities: [] }, isAuthenticated: true });

    renderPage();

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('access-denied-panel')).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /mobile phone app management/i })).toBeInTheDocument();
    expect(mockFetchAdminMobileApps).toHaveBeenCalledWith({ includeInactive: true });
  });
});
