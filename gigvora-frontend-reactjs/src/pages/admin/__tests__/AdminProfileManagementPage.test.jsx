import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminProfileManagementPage from '../AdminProfileManagementPage.jsx';

vi.mock(new URL('../../../layouts/DashboardLayout.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock(new URL('../../../components/dashboard/AccessDeniedPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => <div data-testid="access-denied">Access denied {JSON.stringify(props)}</div>,
}));

const mockFetchAdminProfiles = vi.fn();
const mockFetchAdminProfile = vi.fn();
const mockUpdateAdminProfile = vi.fn();
const mockCreateAdminProfile = vi.fn();
const mockCreateAdminProfileReference = vi.fn();
const mockUpdateAdminProfileReference = vi.fn();
const mockDeleteAdminProfileReference = vi.fn();
const mockCreateAdminProfileNote = vi.fn();
const mockUpdateAdminProfileNote = vi.fn();
const mockDeleteAdminProfileNote = vi.fn();

vi.mock(new URL('../../../services/adminProfiles.js', import.meta.url).pathname, () => ({
  __esModule: true,
  fetchAdminProfiles: (...args) => mockFetchAdminProfiles(...args),
  fetchAdminProfile: (...args) => mockFetchAdminProfile(...args),
  updateAdminProfile: (...args) => mockUpdateAdminProfile(...args),
  createAdminProfile: (...args) => mockCreateAdminProfile(...args),
  createAdminProfileReference: (...args) => mockCreateAdminProfileReference(...args),
  updateAdminProfileReference: (...args) => mockUpdateAdminProfileReference(...args),
  deleteAdminProfileReference: (...args) => mockDeleteAdminProfileReference(...args),
  createAdminProfileNote: (...args) => mockCreateAdminProfileNote(...args),
  updateAdminProfileNote: (...args) => mockUpdateAdminProfileNote(...args),
  deleteAdminProfileNote: (...args) => mockDeleteAdminProfileNote(...args),
}));

vi.mock(new URL('../../../components/admin/profile/ProfileFilters.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ onFiltersChange, onCreate }) => (
    <div>
      <button type="button" onClick={() => onFiltersChange({ search: 'hello' })}>
        apply filters
      </button>
      <button type="button" onClick={onCreate}>
        open create
      </button>
    </div>
  ),
}));

vi.mock(new URL('../../../components/admin/profile/ProfileList.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ profiles = [], loading, error, onSelect }) => (
    <div>
      <p data-testid="profile-count">{loading ? 'loading' : profiles.length}</p>
      {error ? <span>{String(error)}</span> : null}
      {profiles.length ? (
        <button type="button" onClick={() => onSelect(profiles[0])}>
          open profile
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock(new URL('../../../components/admin/profile/ProfileDetailDrawer.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => <div data-testid="profile-drawer">open: {String(props.open)}</div>,
}));

vi.mock(new URL('../../../components/admin/profile/ProfileCreateModal.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="profile-create-modal">{props.open ? 'open' : 'closed'}</div>
  ),
}));

const mockUseSession = vi.fn();

vi.mock(new URL('../../../hooks/useSession.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => mockUseSession(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminProfileManagementPage />
    </MemoryRouter>,
  );
}

describe('AdminProfileManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAdminProfiles.mockResolvedValue({
      results: [{ id: 42, name: 'Alex' }],
      pagination: { total: 1 },
    });
    mockFetchAdminProfile.mockResolvedValue({ id: 42, name: 'Alex' });
    mockUpdateAdminProfile.mockResolvedValue({ id: 42, name: 'Alex' });
    mockCreateAdminProfile.mockResolvedValue({ id: 99, name: 'New User' });
  });

  it('shows the access denied panel without admin access', () => {
    mockUseSession.mockReturnValue({ session: { permissions: [] }, isAuthenticated: true });

    renderPage();

    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    expect(mockFetchAdminProfiles).not.toHaveBeenCalled();
  });

  it('loads the profile directory for admins and opens a profile', async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue({ session: { permissions: ['admin:full'] }, isAuthenticated: true });

    renderPage();

    await waitFor(() => {
      expect(mockFetchAdminProfiles).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('heading', { name: /profile directory/i })).toBeInTheDocument();
    expect(screen.getByTestId('profile-count')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: /open profile/i }));

    await waitFor(() => {
      expect(mockFetchAdminProfile).toHaveBeenCalledWith(42);
    });

    expect(screen.getByTestId('profile-drawer')).toHaveTextContent('open: true');
  });
});
