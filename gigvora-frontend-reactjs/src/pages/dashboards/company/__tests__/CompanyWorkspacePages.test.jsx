import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('../../../../layouts/DashboardLayout.jsx', () => ({
  __esModule: true,
  default: ({ children, title, subtitle }) => (
    <div data-testid="dashboard-layout">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </div>
  ),
}));

const disputeSummarySpy = vi.fn();
const disputeQueueSpy = vi.fn();
const disputeTemplateSpy = vi.fn();
const disputeSettingsSpy = vi.fn();

vi.mock('../../../../components/disputes/DisputeSummaryCards.jsx', () => ({
  __esModule: true,
  default: (props) => {
    disputeSummarySpy(props);
    return (
      <div data-testid="dispute-summary" onClick={() => props.onRefresh?.()}>Summary</div>
    );
  },
}));

vi.mock('../../../../components/disputes/DisputeQueueTable.jsx', () => ({
  __esModule: true,
  default: (props) => {
    disputeQueueSpy(props);
    return (
      <div data-testid="dispute-queue">
        <button type="button" onClick={() => props.onSelectDispute?.('case-1')}>
          Select dispute
        </button>
        <button type="button" onClick={() => props.onCreateDispute?.()}>Open create</button>
      </div>
    );
  },
}));

vi.mock('../../../../components/disputes/DisputeDetailDrawer.jsx', () => ({
  __esModule: true,
  default: ({ open, dispute }) => (open ? <div data-testid="dispute-drawer">{dispute?.id}</div> : null),
}));

vi.mock('../../../../components/disputes/DisputeSettingsPanel.jsx', () => ({
  __esModule: true,
  default: (props) => {
    disputeSettingsSpy(props);
    return <div data-testid="dispute-settings">Settings</div>;
  },
}));

vi.mock('../../../../components/disputes/DisputeTemplateManager.jsx', () => ({
  __esModule: true,
  default: (props) => {
    disputeTemplateSpy(props);
    return <div data-testid="dispute-templates">Templates</div>;
  },
}));

vi.mock('../../../../components/disputes/DisputeCreateModal.jsx', () => ({
  __esModule: true,
  default: ({ open, onSubmit }) =>
    open ? (
      <div data-testid="dispute-create-modal">
        <button type="button" onClick={() => onSubmit?.({ title: 'Case' })}>
          Submit new
        </button>
      </div>
    ) : null,
}));

const useDisputeManagementCalls = [];

vi.mock('../../../../hooks/useDisputeManagement.js', () => ({
  __esModule: true,
  default: (options) => {
    useDisputeManagementCalls.push(options);
    return {
      filters: { stage: 'all', status: 'all' },
      setFilters: vi.fn(),
      disputes: [],
      summary: { total: 0 },
      pagination: { page: 1, totalPages: 1 },
      loading: false,
      refresh: vi.fn(),
      selectedCaseId: null,
      selectCase: vi.fn().mockResolvedValue(undefined),
      selectedCase: null,
      selectedCaseLoading: false,
      createDispute: vi.fn().mockResolvedValue({ id: 'case-2' }),
      updateDispute: vi.fn(),
      addDisputeEvent: vi.fn(),
      settings: {},
      settingsLoading: false,
      saveSettings: vi.fn(),
      templates: [],
      templatesLoading: false,
      createTemplate: vi.fn(),
      updateTemplate: vi.fn(),
      removeTemplate: vi.fn(),
    };
  },
}));

const mockUseSession = vi.fn(() => ({ session: { id: 88, user: { id: 88 } } }));

vi.mock('../../../../context/SessionContext.jsx', () => ({
  __esModule: true,
  useSession: () => mockUseSession(),
}));

const useProjectWorkspaceMock = vi.fn();

vi.mock('../../../../hooks/useProjectWorkspace.js', () => ({
  __esModule: true,
  default: (options) => useProjectWorkspaceMock(options),
}));

vi.mock('../../../../components/workspace/WorkspaceProjectSelector.jsx', () => ({
  __esModule: true,
  default: ({ onSelect }) => (
    <div>
      <button type="button" onClick={() => onSelect?.({ id: 321, title: 'Growth initiative' })}>
        Choose project
      </button>
    </div>
  ),
}));

vi.mock('../../../../components/workspace/WorkspaceOverviewSection.jsx', () => ({
  __esModule: true,
  default: (props) => <div data-testid="workspace-overview">Overview:{props.project?.title}</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceBudgetManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-budget">Budget</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceObjectManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-objects">Objects</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceTimelineManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-timeline">Timeline</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceMeetingManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-meetings">Meetings</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceRoleManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-roles">Roles</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceSubmissionManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-submissions">Submissions</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceInviteManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-invites">Invites</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceHrManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-hr">HR</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceFileManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-files">Files</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceConversationCenter.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="workspace-conversations">Conversations</div>,
}));

vi.mock('../../../../components/workspace/WorkspaceModuleDialog.jsx', () => ({
  __esModule: true,
  default: ({ open, children }) => (open ? <div data-testid="workspace-module-dialog">{children}</div> : null),
}));

vi.mock('../../../../components/DataStatus.jsx', () => ({
  __esModule: true,
  default: ({ onRefresh }) => (
    <div data-testid="data-status">
      <button type="button" onClick={() => onRefresh?.()}>Refresh status</button>
    </div>
  ),
}));

const projectServiceSpies = {
  updateProjectWorkspaceBrief: vi.fn(),
  createProjectWorkspaceBudget: vi.fn(),
  updateProjectWorkspaceBudget: vi.fn(),
  deleteProjectWorkspaceBudget: vi.fn(),
  createProjectWorkspaceObject: vi.fn(),
  updateProjectWorkspaceObject: vi.fn(),
  deleteProjectWorkspaceObject: vi.fn(),
  createProjectWorkspaceTimelineEntry: vi.fn(),
  updateProjectWorkspaceTimelineEntry: vi.fn(),
  deleteProjectWorkspaceTimelineEntry: vi.fn(),
  createProjectWorkspaceMeeting: vi.fn(),
  updateProjectWorkspaceMeeting: vi.fn(),
  deleteProjectWorkspaceMeeting: vi.fn(),
  createProjectWorkspaceRole: vi.fn(),
  updateProjectWorkspaceRole: vi.fn(),
  deleteProjectWorkspaceRole: vi.fn(),
  createProjectWorkspaceSubmission: vi.fn(),
  updateProjectWorkspaceSubmission: vi.fn(),
  deleteProjectWorkspaceSubmission: vi.fn(),
  createProjectWorkspaceInvite: vi.fn(),
  updateProjectWorkspaceInvite: vi.fn(),
  deleteProjectWorkspaceInvite: vi.fn(),
  createProjectWorkspaceHrRecord: vi.fn(),
  updateProjectWorkspaceHrRecord: vi.fn(),
  deleteProjectWorkspaceHrRecord: vi.fn(),
  createProjectWorkspaceFile: vi.fn(),
  updateProjectWorkspaceFile: vi.fn(),
  deleteProjectWorkspaceFile: vi.fn(),
  acknowledgeProjectWorkspaceConversation: vi.fn(),
  createProjectWorkspaceConversationMessage: vi.fn(),
};

vi.mock('../../../../services/projects.js', () => ({
  __esModule: true,
  default: projectServiceSpies,
}));

const { default: CompanyDisputeManagementPage } = await import('../CompanyDisputeManagementPage.jsx');
const { default: CompanyProjectWorkspacePage } = await import('../CompanyProjectWorkspacePage.jsx');

function renderWithRouter(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dashboard/company/disputes" element={<CompanyDisputeManagementPage />} />
        <Route path="/dashboard/company/project-workspace" element={<CompanyProjectWorkspacePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Company dispute management page', () => {
  beforeEach(() => {
    useDisputeManagementCalls.length = 0;
    vi.clearAllMocks();
  });

  it('loads workspace specific disputes and opens creation flow', async () => {
    await act(async () => {
      renderWithRouter('/dashboard/company/disputes');
    });

    const user = userEvent.setup();

    const input = await screen.findByPlaceholderText(/workspace id/i);
    await user.type(input, '123');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(useDisputeManagementCalls.at(-1)).toEqual({ workspaceId: 123 });
    });

    await user.click(screen.getByRole('button', { name: /refresh/i }));
    const latestCallReturn = useDisputeManagementCalls.at(-1);
    expect(latestCallReturn).toBeDefined();

    await user.click(screen.getByRole('button', { name: /open create/i }));
    expect(screen.getByTestId('dispute-create-modal')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /submit new/i }));

    expect(disputeQueueSpy).toHaveBeenCalled();
    expect(disputeSummarySpy).toHaveBeenCalled();
  });
});

describe('Company project workspace page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProjectWorkspaceMock.mockImplementation(() => ({
      data: {
        project: {
          id: 101,
          title: 'Global rebrand',
          status: 'active',
          startDate: '2024-04-01',
          endDate: '2024-07-30',
          budgetCurrency: 'USD',
        },
        metrics: { progressPercent: 65, budgetUsed: 120000, budgetRemaining: 30000 },
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
      fromCache: false,
      lastUpdated: '2024-05-01T10:00:00Z',
    }));
  });

  it('renders project summary and opens module dialog', async () => {
    await act(async () => {
      renderWithRouter('/dashboard/company/project-workspace?projectId=101');
    });

    const user = userEvent.setup();

    await waitFor(() => {
      expect(useProjectWorkspaceMock).toHaveBeenCalledWith({ projectId: 101, enabled: true });
    });

    expect(await screen.findByText(/project workspace/i)).toBeInTheDocument();
    expect(await screen.findByText(/global rebrand/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /refresh status/i }));

    await user.click(screen.getByRole('button', { name: /overview/i }));
    expect(screen.getByTestId('workspace-module-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-overview')).toHaveTextContent('Global rebrand');
  });

  it('updates project selection through selector interaction', async () => {
    await act(async () => {
      renderWithRouter('/dashboard/company/project-workspace?projectId=101');
    });

    const user = userEvent.setup();

    const chooseProject = await screen.findByRole('button', { name: /choose project/i });
    await user.click(chooseProject);

    await waitFor(() => {
      expect(useProjectWorkspaceMock).toHaveBeenLastCalledWith({ projectId: 321, enabled: true });
    });
  });
});
