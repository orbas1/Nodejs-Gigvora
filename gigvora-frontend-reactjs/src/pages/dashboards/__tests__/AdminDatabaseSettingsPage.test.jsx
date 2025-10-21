import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminDatabaseSettingsPage from '../AdminDatabaseSettingsPage.jsx';

vi.mock(new URL('../../../layouts/DashboardLayout.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock(new URL('../../../components/dashboard/AccessDeniedPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => <div data-testid="access-denied">{JSON.stringify(props)}</div>,
}));

vi.mock(new URL('../../../components/admin/database/DatabaseConnectionList.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="database-connection-list" />,
}));

vi.mock(new URL('../../../components/admin/database/DatabaseConnectionEditor.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="database-connection-editor" />,
}));

const mockUseSession = vi.fn();

vi.mock(new URL('../../../hooks/useSession.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => mockUseSession(),
}));

const listDatabaseConnections = vi.fn();

vi.mock(new URL('../../../services/databaseSettings.js', import.meta.url).pathname, () => ({
  __esModule: true,
  listDatabaseConnections: (...args) => listDatabaseConnections(...args),
  getDatabaseConnection: vi.fn(),
  createDatabaseConnection: vi.fn(),
  updateDatabaseConnection: vi.fn(),
  deleteDatabaseConnection: vi.fn(),
  testDatabaseConnection: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminDatabaseSettingsPage />
    </MemoryRouter>,
  );
}

describe('AdminDatabaseSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listDatabaseConnections.mockResolvedValue({ items: [], summary: null });
  });

  it('renders an access denied panel for non-admin users', () => {
    mockUseSession.mockReturnValue({ session: { permissions: [] }, isAuthenticated: true });

    renderPage();

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    expect(screen.queryByTestId('database-connection-list')).not.toBeInTheDocument();
  });

  it('loads database connections for administrators', async () => {
    mockUseSession.mockReturnValue({ session: { permissions: ['admin:full'] }, isAuthenticated: true });
    listDatabaseConnections.mockResolvedValue({ items: [{ id: '1', name: 'Primary' }], summary: { byStatus: {} } });

    renderPage();

    await waitFor(() => expect(listDatabaseConnections).toHaveBeenCalled());
    expect(screen.getByTestId('database-connection-list')).toBeInTheDocument();
    expect(screen.getByTestId('database-connection-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument();
  });
});
