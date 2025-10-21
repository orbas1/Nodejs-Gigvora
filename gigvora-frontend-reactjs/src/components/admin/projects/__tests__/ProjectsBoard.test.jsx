import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectsBoard from '../ProjectsBoard.jsx';

vi.mock('../ProjectCreateWizard.jsx', () => ({
  default: () => <div data-testid="project-create-wizard" />,
}));

vi.mock('../ProjectWorkspaceDrawer.jsx', () => ({
  default: () => <div data-testid="project-workspace-drawer" />,
}));

const mockFetchProjectPortfolio = vi.fn();

vi.mock('../../../../services/adminProjectManagement.js', () => ({
  fetchProjectPortfolio: (...args) => mockFetchProjectPortfolio(...args),
}));

const INITIAL_SNAPSHOT = {
  summary: {
    totalProjects: 12,
    activeProjects: 4,
    atRiskProjects: 2,
    completedProjects: 6,
    budgetAllocated: 500000,
    budgetSpent: 200000,
    averageProgress: 52,
  },
  breakdowns: {
    status: {
      planning: 2,
    },
    risk: {
      low: 1,
    },
  },
  projects: [
    {
      id: 'proj-1',
      title: 'Discovery sprint',
      status: 'planning',
      owner: { name: 'Alice' },
      ownerId: 'owner-1',
      workspace: { riskLevel: 'low', progressPercent: 48 },
      dueDate: '2024-06-01T00:00:00.000Z',
    },
  ],
  owners: [{ id: 'owner-1', name: 'Alice' }],
  board: [
    {
      key: 'planning',
      label: 'Planning',
      count: 1,
      projects: [
        {
          id: 'proj-1',
          title: 'Discovery sprint',
          owner: { name: 'Alice' },
          ownerId: 'owner-1',
          progressPercent: 48,
          nextMilestoneDueAt: '2024-06-01T00:00:00.000Z',
          nextMilestone: 'Kick-off',
          riskLevel: 'low',
        },
      ],
    },
  ],
};

describe('ProjectsBoard', () => {
  let user;

  beforeEach(() => {
    mockFetchProjectPortfolio.mockReset();
    user = userEvent.setup({ applyAcceptDefaultUnhandledRejections: false });
  });

  it('renders the project snapshot and summary cards', () => {
    render(<ProjectsBoard initialSnapshot={INITIAL_SNAPSHOT} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByText('At risk', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Discovery sprint')).toBeInTheDocument();
  });

  it('fetches filtered data when the status filter changes', async () => {
    mockFetchProjectPortfolio.mockResolvedValueOnce({
      ...INITIAL_SNAPSHOT,
      projects: [
        {
          id: 'proj-2',
          title: 'Expansion rollout',
          status: 'in_progress',
          owner: { name: 'Bruno' },
          ownerId: 'owner-2',
          workspace: { riskLevel: 'medium', progressPercent: 72 },
          dueDate: '2024-07-15T00:00:00.000Z',
        },
      ],
    });

    render(<ProjectsBoard initialSnapshot={INITIAL_SNAPSHOT} />);
    const statusSelect = screen.getByLabelText('Filter by status');

    await act(async () => {
      await user.selectOptions(statusSelect, 'planning');
    });

    await waitFor(() => {
      expect(mockFetchProjectPortfolio).toHaveBeenCalledWith(
        expect.objectContaining({ statuses: 'planning' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Expansion rollout')).toBeInTheDocument();
    });
  });

  it('shows an RBAC error when the backend denies access', async () => {
    mockFetchProjectPortfolio.mockRejectedValueOnce({ status: 403, message: 'Forbidden' });

    render(<ProjectsBoard />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /You do not have permission to view project portfolio data/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
