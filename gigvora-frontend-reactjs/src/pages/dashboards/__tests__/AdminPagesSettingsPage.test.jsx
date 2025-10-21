import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminPagesSettingsPage from '../AdminPagesSettingsPage.jsx';

vi.mock(new URL('../../../layouts/DashboardLayout.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock(new URL('../../../components/dashboard/AccessDeniedPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => <div data-testid="access-denied">Access denied {JSON.stringify(props)}</div>,
}));

vi.mock(new URL('../../../components/admin/AdminPageSettingsPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="admin-page-settings-panel">settings-panel</div>,
}));

const mockUseSession = vi.fn();

vi.mock(new URL('../../../hooks/useSession.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => mockUseSession(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminPagesSettingsPage />
    </MemoryRouter>,
  );
}

describe('AdminPagesSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('denies access when the user lacks admin permissions', () => {
    mockUseSession.mockReturnValue({ session: { permissions: [] }, isAuthenticated: true });

    renderPage();

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-page-settings-panel')).not.toBeInTheDocument();
  });

  it('renders the admin page settings panel for admins', () => {
    mockUseSession.mockReturnValue({ session: { permissions: ['admin:full'] }, isAuthenticated: true });

    renderPage();

    expect(screen.getByTestId('admin-page-settings-panel')).toBeInTheDocument();
  });
});
