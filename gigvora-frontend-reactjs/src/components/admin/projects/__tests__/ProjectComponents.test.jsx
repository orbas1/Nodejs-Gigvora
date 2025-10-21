import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectCreateWizard from '../ProjectCreateWizard.jsx';
import ProjectWorkspaceDrawer from '../ProjectWorkspaceDrawer.jsx';

const mockCreateProject = vi.fn();
const mockFetchProject = vi.fn();
const mockUpdateProject = vi.fn();
const mockUpdateProjectWorkspace = vi.fn();

vi.mock('../../../../services/adminProjectManagement.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createProject: (...args) => mockCreateProject(...args),
    fetchProject: (...args) => mockFetchProject(...args),
    updateProject: (...args) => mockUpdateProject(...args),
    updateProjectWorkspace: (...args) => mockUpdateProjectWorkspace(...args),
  };
});

describe('ProjectCreateWizard', () => {
  beforeEach(() => {
    mockCreateProject.mockReset();
  });

  it('walks through steps and submits project payload', async () => {
    mockCreateProject.mockResolvedValue({ project: { id: 'project-1', title: 'Launch' } });
    const onCreated = vi.fn();
    const user = userEvent.setup();

    render(
      <ProjectCreateWizard
        open
        onClose={vi.fn()}
        owners={[{ id: 1, name: 'Alex Carter' }]}
        onCreated={onCreated}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/Owner/i), '1');
    await user.type(screen.getByLabelText(/Name/i), 'Launch plan');
    await user.type(screen.getByLabelText(/Description/i), 'Pilot go-to-market project.');

    await user.click(screen.getByRole('button', { name: /Next/i }));

    await user.clear(screen.getByLabelText(/Allocated/i));
    await user.type(screen.getByLabelText(/Allocated/i), '50000');
    await user.clear(screen.getByLabelText(/Spent/i));
    await user.type(screen.getByLabelText(/Spent/i), '12000');

    await user.click(screen.getByRole('button', { name: /Next/i }));

    await user.type(screen.getByLabelText(/Kickoff/i), '2024-06-01');
    await user.type(screen.getByLabelText(/^Due$/i), '2024-07-31');

    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Create project/i }));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 1,
          title: 'Launch plan',
          budgetAllocated: 50000,
          budgetSpent: 12000,
          startDate: '2024-06-01',
          dueDate: '2024-07-31',
        }),
      );
    });

    expect(onCreated).toHaveBeenCalledWith({ id: 'project-1', title: 'Launch' });
  });
});

describe('ProjectWorkspaceDrawer', () => {
  const sampleProject = {
    id: 'proj-1',
    ownerId: 1,
    owner: { name: 'Alex Carter' },
    title: 'Launch plan',
    description: 'Pilot go-to-market project.',
    status: 'planning',
    budgetCurrency: 'USD',
    budgetAllocated: 50000,
    budgetSpent: 12000,
    startDate: '2024-06-01T00:00:00.000Z',
    dueDate: '2024-07-31T00:00:00.000Z',
    workspace: {
      status: 'planning',
      riskLevel: 'low',
      progressPercent: 20,
      nextMilestone: 'Kickoff',
      nextMilestoneDueAt: '2024-06-15T00:00:00.000Z',
      notes: 'Align exec team.',
      metrics: { burndown: 5 },
    },
    milestones: [],
    collaborators: [],
    integrations: [],
    assets: [],
    retrospectives: [],
  };

  beforeEach(() => {
    mockFetchProject.mockReset();
    mockUpdateProject.mockReset();
    mockUpdateProjectWorkspace.mockReset();
    mockFetchProject.mockResolvedValue({ project: sampleProject });
    mockUpdateProject.mockResolvedValue({ project: { ...sampleProject, title: 'Updated title' } });
    mockUpdateProjectWorkspace.mockResolvedValue({
      project: {
        ...sampleProject,
        workspace: { ...sampleProject.workspace, riskLevel: 'medium' },
      },
    });
  });

  it('loads project details and persists base + workspace updates', async () => {
    const onUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ProjectWorkspaceDrawer
        open
        projectId="proj-1"
        owners={[{ id: 1, name: 'Alex Carter' }]}
        onClose={vi.fn()}
        onUpdated={onUpdated}
      />,
    );

    const nameInput = await screen.findByLabelText(/^Name$/i);
    expect(nameInput).toHaveValue('Launch plan');

    const baseForm = nameInput.closest('form');
    const workspaceForm = screen.getAllByRole('heading', { name: /^Workspace$/i })[0].closest('form');

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated launch plan');
    const metadataInput = within(baseForm).getByLabelText(/Metadata/i);
    await user.clear(metadataInput);
    await user.type(metadataInput, '{"region":"EU"}');

    await user.click(within(baseForm).getByRole('button', { name: /Save details/i }));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          title: 'Updated launch plan',
          metadata: { region: 'EU' },
        }),
      );
    });

    await user.selectOptions(within(workspaceForm).getByLabelText(/^Status$/i), 'in_progress');
    await user.selectOptions(within(workspaceForm).getByLabelText(/^Risk$/i), 'medium');
    await user.clear(within(workspaceForm).getByLabelText(/Progress/i));
    await user.type(within(workspaceForm).getByLabelText(/Progress/i), '55');
    await user.clear(within(workspaceForm).getByLabelText(/Metrics/i));
    await user.type(within(workspaceForm).getByLabelText(/Metrics/i), '{"velocity":12}');

    await user.click(within(workspaceForm).getByRole('button', { name: /Save workspace/i }));

    await waitFor(() => {
      expect(mockUpdateProjectWorkspace).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          status: 'in_progress',
          riskLevel: 'medium',
          progressPercent: 55,
          metrics: { velocity: 12 },
        }),
      );
    });

    expect(onUpdated).toHaveBeenCalled();
  });
});
