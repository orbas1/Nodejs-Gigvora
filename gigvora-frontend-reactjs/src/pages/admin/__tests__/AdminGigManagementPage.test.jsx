import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminGigManagementPage from '../AdminGigManagementPage.jsx';

vi.mock(new URL('../../../layouts/DashboardLayout.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock(new URL('../../../components/dashboard/AccessDeniedPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => <div data-testid="access-denied-panel">Access denied {JSON.stringify(props)}</div>,
}));

const mockAdminGigManagementPanel = vi.fn((props) => <div data-testid="gig-panel">Panel: {props.userId}</div>);

vi.mock(new URL('../../../components/admin/gigManagement/AdminGigManagementPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => mockAdminGigManagementPanel(props),
}));

const mockUseSession = vi.fn();

vi.mock(new URL('../../../hooks/useSession.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => mockUseSession(),
}));

const mockUsePeopleSearch = vi.fn();

vi.mock(new URL('../../../hooks/usePeopleSearch.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (query, options) => mockUsePeopleSearch(query, options),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminGigManagementPage />
    </MemoryRouter>,
  );
}

describe('AdminGigManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePeopleSearch.mockImplementation(() => ({ results: [], loading: false, error: null }));
  });

  it('shows the access denied panel when the user lacks admin access', () => {
    mockUseSession.mockReturnValue({
      session: { permissions: [], capabilities: [] },
      isAuthenticated: true,
    });

    renderPage();

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('access-denied-panel')).toHaveTextContent('Access denied');
    expect(mockAdminGigManagementPanel).not.toHaveBeenCalled();
  });

  it('enables gig management workflows when the user has admin permissions', async () => {
    const user = userEvent.setup();

    const people = [
      { id: 101, firstName: 'Alicia', lastName: 'Stone', email: 'alicia@example.com', userType: 'admin' },
    ];

    mockUseSession.mockReturnValue({
      session: { permissions: ['admin:full'], capabilities: [] },
      isAuthenticated: true,
    });

    mockUsePeopleSearch.mockImplementation((query) => ({
      results: query.trim().length >= 2 ? people : [],
      loading: false,
      error: null,
    }));

    renderPage();

    const searchInput = screen.getByPlaceholderText(/search by name or email/i);
    await user.type(searchInput, 'Ali');

    const resultButton = await screen.findByRole('button', { name: /alicia stone/i });
    await user.click(resultButton);

    const summaryHeading = await screen.findByRole('heading', { name: /alicia stone/i });
    expect(summaryHeading).toBeInTheDocument();

    await waitFor(() => {
      expect(mockAdminGigManagementPanel).toHaveBeenLastCalledWith(expect.objectContaining({ userId: 101 }));
    });

    const manualIdInput = screen.getByPlaceholderText(/member id/i);
    await user.clear(manualIdInput);
    await user.type(manualIdInput, '42');
    await user.click(screen.getByRole('button', { name: /open/i }));

    await screen.findByText(/member #42/i);

    await waitFor(() => {
      expect(mockAdminGigManagementPanel).toHaveBeenLastCalledWith(expect.objectContaining({ userId: 42 }));
    });
  });
});
