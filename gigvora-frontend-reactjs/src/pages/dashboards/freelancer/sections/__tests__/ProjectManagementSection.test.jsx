import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ProjectManagementSection from '../project-management/ProjectManagementSection.jsx';
import useProjectGigManagement from '../../../../../hooks/useProjectGigManagement.js';

vi.mock('../../../../../hooks/useProjectGigManagement.js', () => ({
  default: vi.fn(),
}));

const OPEN_PROJECT = {
  id: 'open-1',
  title: 'Project Alpha',
  description: 'Build the alpha release.',
  status: 'in_progress',
  dueDate: '2024-11-01',
  budgetAllocated: 100000,
  budgetCurrency: 'USD',
  workspace: {
    status: 'in_progress',
    progressPercent: 60,
    riskLevel: 'medium',
    nextMilestone: 'Beta pilot',
    nextMilestoneDueAt: '2024-09-01',
  },
  lifecycle: {
    workspaceStatus: 'in_progress',
    riskLevel: 'medium',
    progressPercent: 60,
    tags: ['alpha'],
  },
  metadata: {
    clientName: 'Acme Inc.',
    workspaceUrl: 'https://alpha.example.com',
  },
};

const CLOSED_PROJECT = {
  id: 'closed-1',
  title: 'Project Beta',
  description: 'Finalize the beta program.',
  status: 'completed',
  dueDate: '2023-12-15',
  budgetAllocated: 55000,
  budgetCurrency: 'USD',
  workspace: {
    status: 'completed',
    progressPercent: 100,
    riskLevel: 'low',
    nextMilestone: 'Retro',
    nextMilestoneDueAt: '2023-12-01',
  },
  lifecycle: {
    workspaceStatus: 'completed',
    riskLevel: 'low',
    progressPercent: 100,
    tags: ['beta'],
  },
  metadata: {
    clientName: 'Globex',
    workspaceUrl: 'https://beta.example.com',
  },
};

function createActions(overrides = {}) {
  return {
    createProject: vi.fn().mockResolvedValue({}),
    archiveProject: vi.fn().mockResolvedValue({}),
    restoreProject: vi.fn().mockResolvedValue({}),
    updateProject: vi.fn().mockResolvedValue({}),
    updateWorkspace: vi.fn().mockResolvedValue({}),
    createMilestone: vi.fn().mockResolvedValue({}),
    updateMilestone: vi.fn().mockResolvedValue({}),
    deleteMilestone: vi.fn().mockResolvedValue({}),
    createCollaborator: vi.fn().mockResolvedValue({}),
    updateCollaborator: vi.fn().mockResolvedValue({}),
    deleteCollaborator: vi.fn().mockResolvedValue({}),
    addAsset: vi.fn().mockResolvedValue({}),
    updateAsset: vi.fn().mockResolvedValue({}),
    deleteAsset: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

function mockHookResponse(overrides = {}) {
  const actions = createActions(overrides.actions);
  useProjectGigManagement.mockReturnValue({
    data: {
      projectLifecycle: {
        open: [OPEN_PROJECT],
        closed: [CLOSED_PROJECT],
        stats: {
          openCount: 1,
          closedCount: 1,
          budgetInPlay: 155000,
          averageProgress: 80,
          currency: 'USD',
        },
      },
      summary: { currency: 'USD' },
      ...overrides.data,
    },
    loading: overrides.loading ?? false,
    error: overrides.error ?? null,
    actions,
    reload: vi.fn(),
  });
  return { actions };
}

describe('ProjectManagementSection', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('filters projects by search term', () => {
    mockHookResponse();

    render(<ProjectManagementSection freelancerId={99} />);

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'Beta' },
    });

    expect(screen.getByText(/no projects match the current filters/i)).toBeInTheDocument();
  });

  it('switches between open and closed project views', () => {
    mockHookResponse();

    render(<ProjectManagementSection freelancerId={99} />);

    fireEvent.click(screen.getByRole('button', { name: /closed/i }));

    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('submits the create project wizard', async () => {
    const { actions } = mockHookResponse();

    render(<ProjectManagementSection freelancerId={99} />);

    fireEvent.click(screen.getByRole('button', { name: /new project/i }));

    await waitFor(() => expect(screen.getByRole('dialog', { name: /new project/i })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/^Title$/i), {
      target: { value: 'Project Gamma' },
    });
    fireEvent.change(screen.getByLabelText(/^Summary$/i), {
      target: { value: 'Ship new growth initiatives.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => expect(actions.createProject).toHaveBeenCalledTimes(1));

    expect(actions.createProject.mock.calls[0][0]).toMatchObject({
      title: 'Project Gamma',
      description: 'Ship new growth initiatives.',
      startDate: null,
      dueDate: null,
      budgetAllocated: 0,
      budgetSpent: 0,
      workspace: expect.objectContaining({
        progressPercent: 10,
        nextMilestoneDueAt: null,
      }),
    });
  });

  it('shows an inline error when archiving fails', async () => {
    const { actions } = mockHookResponse();
    actions.archiveProject.mockRejectedValueOnce(new Error('Server offline'));

    render(<ProjectManagementSection freelancerId={99} />);

    fireEvent.click(screen.getByRole('button', { name: /archive/i }));

    await waitFor(() => expect(screen.getByText(/server offline/i)).toBeInTheDocument());
  });
});
