import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AgencyClientKanbanPage from '../AgencyClientKanbanPage.jsx';

vi.mock(new URL('../../../layouts/DashboardLayout.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock(new URL('../../../components/dashboard/AccessDeniedPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => <div data-testid="access-denied">{JSON.stringify(props)}</div>,
}));

vi.mock(new URL('../../../components/agency/clientKanban/ClientKanbanBoard.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="kanban-board" />,
}));

const mockUseSession = vi.fn();

vi.mock(new URL('../../../hooks/useSession.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => mockUseSession(),
}));

const mockUseAgencyClientKanban = vi.fn(() => ({
  data: null,
  loading: false,
  error: null,
  actions: {},
}));

vi.mock(new URL('../../../hooks/useAgencyClientKanban.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (options) => mockUseAgencyClientKanban(options),
}));

function renderPage(initialUrl = '/dashboard/agency/client-kanban') {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <AgencyClientKanbanPage />
    </MemoryRouter>,
  );
}

describe('AgencyClientKanbanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAgencyClientKanban.mockReturnValue({ data: null, loading: false, error: null, actions: {} });
  });

  it('blocks access when the user is unauthenticated', () => {
    mockUseSession.mockReturnValue({ session: null, isAuthenticated: false });

    renderPage();

    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument();
    expect(mockUseAgencyClientKanban).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('shows the kanban board for agency members', () => {
    mockUseSession.mockReturnValue({ session: { memberships: ['agency'] }, isAuthenticated: true });

    renderPage('/dashboard/agency/client-kanban?workspaceId=123');

    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument();
    expect(mockUseAgencyClientKanban).toHaveBeenCalledWith(expect.objectContaining({ enabled: true, workspaceId: 123 }));
  });
});
