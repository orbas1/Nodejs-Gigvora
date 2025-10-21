import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminInterviewManagementPage from '../AdminInterviewManagementPage.jsx';

vi.mock(new URL('../../../layouts/DashboardLayout.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock(new URL('../../../components/dashboard/AccessDeniedPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => <div data-testid="access-denied">{JSON.stringify(props)}</div>,
}));

vi.mock(new URL('../../../components/admin/interviews/WorkspaceSwitcher.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-switcher" />,
}));

vi.mock(new URL('../../../components/admin/interviews/StatsStrip.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="stats-strip" />,
}));

vi.mock(new URL('../../../components/admin/interviews/RoomsPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="rooms-panel" />,
}));

vi.mock(new URL('../../../components/admin/interviews/WorkflowPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="workflow-panel" />,
}));

vi.mock(new URL('../../../components/admin/interviews/TemplatesPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="templates-panel" />,
}));

vi.mock(new URL('../../../components/admin/interviews/PrepPortalsPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="prep-panel" />,
}));

const mockUseSession = vi.fn();

vi.mock(new URL('../../../hooks/useSession.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => mockUseSession(),
}));

const listInterviewWorkspaces = vi.fn();
const fetchInterviewWorkspace = vi.fn();

vi.mock(new URL('../../../services/interviews.js', import.meta.url).pathname, () => ({
  __esModule: true,
  listInterviewWorkspaces: (...args) => listInterviewWorkspaces(...args),
  fetchInterviewWorkspace: (...args) => fetchInterviewWorkspace(...args),
  createInterviewRoom: vi.fn(),
  updateInterviewRoom: vi.fn(),
  deleteInterviewRoom: vi.fn(),
  addInterviewParticipant: vi.fn(),
  updateInterviewParticipant: vi.fn(),
  deleteInterviewParticipant: vi.fn(),
  createInterviewChecklistItem: vi.fn(),
  updateInterviewChecklistItem: vi.fn(),
  deleteInterviewChecklistItem: vi.fn(),
  createInterviewLane: vi.fn(),
  updateInterviewLane: vi.fn(),
  deleteInterviewLane: vi.fn(),
  createInterviewCard: vi.fn(),
  updateInterviewCard: vi.fn(),
  deleteInterviewCard: vi.fn(),
  createPanelTemplate: vi.fn(),
  updatePanelTemplate: vi.fn(),
  deletePanelTemplate: vi.fn(),
  createCandidatePrepPortal: vi.fn(),
  updateCandidatePrepPortal: vi.fn(),
  deleteCandidatePrepPortal: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminInterviewManagementPage />
    </MemoryRouter>,
  );
}

describe('AdminInterviewManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listInterviewWorkspaces.mockResolvedValue({ workspaces: [{ id: 1, name: 'Primary' }] });
    fetchInterviewWorkspace.mockResolvedValue({
      stats: {},
      rooms: [],
      workflow: { lanes: [] },
      panelTemplates: [],
      prepPortals: [],
    });
  });

  it('denies access when the session lacks admin permissions', () => {
    mockUseSession.mockReturnValue({ session: { permissions: [] }, isAuthenticated: true });

    renderPage();

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    expect(listInterviewWorkspaces).not.toHaveBeenCalled();
  });

  it('loads workspaces when admin access is present', async () => {
    mockUseSession.mockReturnValue({ session: { permissions: ['admin:full'] }, isAuthenticated: true });

    renderPage();

    await waitFor(() => expect(listInterviewWorkspaces).toHaveBeenCalled());
    await waitFor(() => expect(fetchInterviewWorkspace).toHaveBeenCalled());
    expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument();
    expect(screen.getByTestId('workspace-switcher')).toBeInTheDocument();
  });
});
