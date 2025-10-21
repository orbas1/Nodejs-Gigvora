import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const boardMock = vi.fn();
const designerMock = vi.fn();
const runtimeConsoleMock = vi.fn();
const cardStudioMock = vi.fn();

vi.mock('../../../layouts/DashboardLayout.jsx', () => ({
  __esModule: true,
  default: ({ title, children }) => (
    <div data-testid="dashboard-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('../../../components/networking/NetworkingSessionsBoard.jsx', () => ({
  __esModule: true,
  default: (props) => {
    boardMock(props);
    return (
      <div data-testid="sessions-board">
        Sessions total: {props.networking?.sessions?.total ?? 0}
        <button type="button" onClick={() => props.onCreateSession?.()}>Create session</button>
      </div>
    );
  },
}));

vi.mock('../../../components/networking/NetworkingSessionDesigner.jsx', () => ({
  __esModule: true,
  default: (props) => {
    designerMock(props);
    return (
      <div data-testid="session-designer" data-disabled={props.disabled}>
        Designer for company {props.defaultValues?.companyId ?? 'n/a'}
      </div>
    );
  },
}));

vi.mock('../../../components/networking/NetworkingSessionShowcase.jsx', () => ({
  __esModule: true,
  default: (props) => <div data-testid="session-showcase">Showcase {props.showcase?.librarySize}</div>,
}));

vi.mock('../../../components/networking/NetworkingDuringSessionConsole.jsx', () => ({
  __esModule: true,
  default: (props) => {
    runtimeConsoleMock(props);
    return <div data-testid="runtime-console">Runtime loading: {String(props.loading)}</div>;
  },
}));

vi.mock('../../../components/networking/NetworkingBusinessCardStudio.jsx', () => ({
  __esModule: true,
  default: (props) => {
    cardStudioMock(props);
    return (
      <div data-testid="card-studio" data-disabled={props.disabled}>
        Cards: {props.cards?.length ?? 0}
        <button type="button" onClick={() => props.onRefresh?.()}>Refresh cards</button>
      </div>
    );
  },
}));

const useNetworkingSessionsMock = vi.fn();
const useNetworkingSessionRuntimeMock = vi.fn();

vi.mock('../../../hooks/useNetworkingSessions.js', () => ({
  __esModule: true,
  default: (args) => useNetworkingSessionsMock(args),
  useNetworkingSessionRuntime: (sessionId, options) => useNetworkingSessionRuntimeMock(sessionId, options),
}));

const networkingAccessMock = vi.fn();

vi.mock('../../../hooks/useNetworkingAccess.js', () => ({
  __esModule: true,
  default: () => networkingAccessMock(),
}));

const createNetworkingSessionMock = vi.fn();
const createNetworkingBusinessCardMock = vi.fn();
const listNetworkingBusinessCardsMock = vi.fn();

vi.mock('../../../services/networking.js', () => ({
  __esModule: true,
  createNetworkingSession: (...args) => createNetworkingSessionMock(...args),
  createNetworkingBusinessCard: (...args) => createNetworkingBusinessCardMock(...args),
  listNetworkingBusinessCards: (...args) => listNetworkingBusinessCardsMock(...args),
}));

vi.mock('../../previews/FreelancerReviewsPreviewPage.jsx', () => ({
  __esModule: true,
  default: () => <div>Freelancer preview mock</div>,
}));

const AccessDeniedPanelMock = vi.fn();

vi.mock('../../../components/dashboard/AccessDeniedPanel.jsx', () => ({
  __esModule: true,
  default: (props) => {
    AccessDeniedPanelMock(props);
    return <div data-testid="access-denied-panel">Access denied: {props.title}</div>;
  },
}));

vi.mock('../../../components/DataStatus.jsx', () => ({
  __esModule: true,
  default: (props) => <div data-testid="data-status">Updated {props.lastUpdated ?? 'never'}</div>,
}));

vi.mock('../../../constants/companyDashboardMenu.js', () => ({
  __esModule: true,
  COMPANY_DASHBOARD_MENU_SECTIONS: [],
}));

const { default: CompanyNetworkingHubPage } = await import('../CompanyNetworkingHubPage.jsx');
const { default: NetworkingSessionsPage } = await import('../NetworkingSessionsPage.jsx');

beforeEach(() => {
  vi.clearAllMocks();
  useNetworkingSessionsMock.mockReturnValue({
    data: { sessions: [], meta: { permittedWorkspaceIds: [], selectedWorkspaceId: null } },
    loading: false,
    error: null,
    refresh: vi.fn(),
    fromCache: false,
    lastUpdated: '2024-05-01T00:00:00Z',
  });
  useNetworkingSessionRuntimeMock.mockReturnValue({ data: null, loading: false, refresh: vi.fn() });
  networkingAccessMock.mockReturnValue({
    canManageNetworking: true,
    reason: null,
    allowedMemberships: ['company'],
  });
  listNetworkingBusinessCardsMock.mockResolvedValue({ cards: [] });
});

describe('CompanyNetworkingHubPage', () => {
  it('shows access denied notice when user lacks permissions', async () => {
    networkingAccessMock.mockReturnValueOnce({
      canManageNetworking: false,
      reason: 'Need company role',
      allowedMemberships: ['agency'],
    });

    render(
      <MemoryRouter>
        <CompanyNetworkingHubPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Networking hub is locked/i)).toBeInTheDocument();
    expect(screen.getByText(/Need company role/i)).toBeInTheDocument();
  });

  it('renders core networking widgets when access granted', async () => {
    useNetworkingSessionsMock.mockReturnValueOnce({
      data: {
        sessions: [
          {
            id: 11,
            companyId: 500,
            status: 'scheduled',
            signups: [],
            penaltyRules: { noShowThreshold: 2 },
          },
        ],
        meta: { permittedWorkspaceIds: [500], selectedWorkspaceId: 500 },
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/networking/company', search: '?companyId=500' }] }>
        <CompanyNetworkingHubPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('sessions-board')).toBeInTheDocument();
    expect(screen.getByTestId('session-designer')).toHaveAttribute('data-disabled', 'false');
    expect(screen.getByTestId('runtime-console')).toHaveTextContent('Runtime loading: false');
    expect(screen.getByTestId('card-studio')).toHaveAttribute('data-disabled', 'false');
    expect(boardMock).toHaveBeenCalled();
  });

  it('shows loading indicator when data pending', () => {
    useNetworkingSessionsMock.mockReturnValueOnce({
      data: null,
      loading: true,
      error: null,
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <CompanyNetworkingHubPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Loading networking data…/i)).toBeInTheDocument();
  });
});

describe('NetworkingSessionsPage', () => {
  it('renders access denied panel for insufficient permissions', () => {
    networkingAccessMock.mockReturnValueOnce({ canManageNetworking: false, reason: 'Limited role' });

    render(
      <MemoryRouter>
        <NetworkingSessionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('access-denied-panel')).toHaveTextContent('Access denied');
  });

  it('renders workspace controls and reacts to lookback changes', () => {
    useNetworkingSessionsMock.mockReturnValueOnce({
      data: [{ id: 1, companyId: 100, signups: [] }],
      loading: false,
      error: null,
      refresh: vi.fn(),
      fromCache: false,
      lastUpdated: '2024-05-01T00:00:00Z',
    });

    networkingAccessMock.mockReturnValueOnce({ canManageNetworking: true, reason: null });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/networking/sessions', search: '' }]}>
        <NetworkingSessionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/Workspace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lookback/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Lookback/i), { target: { value: '60' } });

    expect(useNetworkingSessionsMock).toHaveBeenLastCalledWith({ companyId: 0, lookbackDays: 60, enabled: true });
  });
});
