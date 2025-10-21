import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectDescriptionTab from '../ProjectDescriptionTab.jsx';
import ProjectTasksTab from '../ProjectTasksTab.jsx';
import RolesManagementTab from '../RolesManagementTab.jsx';
import SubmissionsTab from '../SubmissionsTab.jsx';
import TaskBoardTab from '../TaskBoardTab.jsx';
import TaskDelegationTab from '../TaskDelegationTab.jsx';
import TimelineTab from '../TimelineTab.jsx';
import WorkspaceOverviewTab from '../WorkspaceOverviewTab.jsx';

const baseProject = {
  id: 42,
  title: 'AI Launch',
  description: 'Initial rollout',
  status: 'planning',
  startDate: '2024-04-01',
  dueDate: '2024-05-01',
  budgetAllocated: 25000,
  budgetCurrency: 'USD',
  workspace: {
    status: 'planning',
    progressPercent: 15,
    riskLevel: 'low',
    nextMilestone: 'Finalize scope',
    nextMilestoneDueAt: '2024-04-10T00:00:00.000Z',
    notes: 'Weekly sync every Monday',
  },
};

describe('ProjectDescriptionTab', () => {
  it('submits sanitized payload when saving project details', async () => {
    const updateProject = vi.fn().mockResolvedValue();
    render(
      <ProjectDescriptionTab
        project={baseProject}
        actions={{ updateProject }}
        canManage
      />,
    );

    const titleInput = screen.getByLabelText('Project title');
    const budgetInput = screen.getByLabelText('Budget allocated');

    await act(async () => {
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'AI Launch rev 2');
      await userEvent.clear(budgetInput);
      await userEvent.type(budgetInput, '50000');
      await userEvent.click(screen.getByRole('button', { name: 'Save project details' }));
    });

    await waitFor(() => expect(updateProject).toHaveBeenCalledTimes(1));
    expect(updateProject.mock.calls[0][1]).toMatchObject({
      title: 'AI Launch rev 2',
      budgetAllocated: 50000,
      workspace: expect.objectContaining({ progressPercent: 15 }),
    });
  });
});

describe('ProjectTasksTab', () => {
  it('creates a new task from the modal form', async () => {
    const createTask = vi.fn().mockResolvedValue();
    const actions = {
      createTask,
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
    };

    render(
      <ProjectTasksTab
        project={{ ...baseProject, tasks: [] }}
        actions={actions}
        canManage
      />,
    );

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'New task' }));
    });

    const titleInput = await screen.findByLabelText('Title');

    await act(async () => {
      await userEvent.type(titleInput, 'Kick-off deck');
      await userEvent.type(screen.getByLabelText('Description'), 'Prepare a client ready slide deck.');
      await userEvent.click(screen.getByRole('button', { name: 'Save task' }));
    });

    await waitFor(() => expect(createTask).toHaveBeenCalled());
    expect(createTask.mock.calls[0][1]).toMatchObject({
      title: 'Kick-off deck',
      status: 'backlog',
      priority: 'medium',
    });
  });
});

describe('RolesManagementTab', () => {
  it('creates a new role definition with numeric seat limit', async () => {
    const actions = {
      createRoleDefinition: vi.fn().mockResolvedValue(),
      updateRoleDefinition: vi.fn(),
      deleteRoleDefinition: vi.fn(),
      createRoleAssignment: vi.fn(),
      updateRoleAssignment: vi.fn(),
      deleteRoleAssignment: vi.fn(),
    };

    render(
      <RolesManagementTab
        project={{ ...baseProject, roleDefinitions: [] }}
        actions={actions}
        canManage
      />,
    );

    await act(async () => {
      await userEvent.type(screen.getByLabelText('Role name'), 'Pod lead');
      await userEvent.type(screen.getByLabelText('Seat limit'), '3');
      await userEvent.click(screen.getByRole('button', { name: 'Create role' }));
    });

    await waitFor(() => expect(actions.createRoleDefinition).toHaveBeenCalled());
    expect(actions.createRoleDefinition.mock.calls[0][1]).toMatchObject({
      name: 'Pod lead',
      seatLimit: 3,
    });
  });
});

describe('SubmissionsTab', () => {
  it('logs a new submission entry', async () => {
    const actions = {
      createSubmission: vi.fn().mockResolvedValue(),
      updateSubmission: vi.fn(),
      deleteSubmission: vi.fn(),
    };

    render(
      <SubmissionsTab
        project={{ ...baseProject, submissions: [] }}
        actions={actions}
        canManage
      />,
    );

    await act(async () => {
      await userEvent.type(screen.getByLabelText('Title'), 'Sprint 1 deliverable');
      await userEvent.type(screen.getByLabelText('Submitted on'), '2024-04-05');
      await userEvent.click(screen.getByRole('button', { name: 'Save submission' }));
    });

    await waitFor(() => expect(actions.createSubmission).toHaveBeenCalled());
    expect(actions.createSubmission.mock.calls[0][1]).toMatchObject({
      title: 'Sprint 1 deliverable',
      status: 'draft',
      submittedAt: '2024-04-05T00:00:00.000Z',
    });
  });
});

describe('TaskBoardTab', () => {
  it('advances task status forward', async () => {
    const updateTask = vi.fn().mockResolvedValue();
    const actions = { updateTask };
    const project = {
      id: baseProject.id,
      tasks: [
        { id: 1, title: 'Briefing', description: 'Client briefing', status: 'backlog', priority: 'medium' },
        { id: 2, title: 'Wireframes', description: 'Design', status: 'in_progress', priority: 'high' },
      ],
    };

    render(
      <TaskBoardTab
        project={project}
        actions={actions}
        canManage
      />,
    );

    await act(async () => {
      await userEvent.click(screen.getAllByRole('button', { name: 'Advance' })[0]);
    });

    await waitFor(() => expect(updateTask).toHaveBeenCalled());
    expect(updateTask.mock.calls[0]).toEqual([baseProject.id, 1, { status: 'in_progress' }]);
  });
});

describe('TaskDelegationTab', () => {
  it('creates task assignments for the selected task', async () => {
    const actions = {
      createTaskAssignment: vi.fn().mockResolvedValue(),
      updateTaskAssignment: vi.fn(),
      deleteTaskAssignment: vi.fn(),
    };

    render(
      <TaskDelegationTab
        project={{ ...baseProject, tasks: [{ id: 1, title: 'Design phase', assignments: [] }] }}
        actions={actions}
        canManage
      />,
    );

    await act(async () => {
      await userEvent.type(screen.getByLabelText('Name'), 'Jordan');
      await userEvent.type(screen.getByLabelText('Email'), 'jordan@example.com');
      await userEvent.type(screen.getByLabelText('Allocation hours'), '12');
      await userEvent.click(screen.getByRole('button', { name: 'Assign collaborator' }));
    });

    await waitFor(() => expect(actions.createTaskAssignment).toHaveBeenCalled());
    expect(actions.createTaskAssignment.mock.calls[0]).toEqual([
      baseProject.id,
      1,
      expect.objectContaining({ assigneeName: 'Jordan', allocationHours: 12 }),
    ]);
  });
});

describe('TimelineTab', () => {
  it('records new timeline entries with ISO timestamp', async () => {
    const actions = {
      createTimelineEntry: vi.fn().mockResolvedValue(),
      updateTimelineEntry: vi.fn(),
      deleteTimelineEntry: vi.fn(),
    };

    render(
      <TimelineTab
        project={{ ...baseProject, timelineEntries: [] }}
        actions={actions}
        canManage
      />,
    );

    await act(async () => {
      await userEvent.type(screen.getByLabelText('Title'), 'Kickoff call complete');
      await userEvent.type(screen.getByLabelText('Occurred at'), '2024-04-03T09:30');
      await userEvent.click(screen.getByRole('button', { name: 'Log entry' }));
    });

    await waitFor(() => expect(actions.createTimelineEntry).toHaveBeenCalled());
    expect(actions.createTimelineEntry.mock.calls[0][1]).toMatchObject({
      title: 'Kickoff call complete',
      entryType: 'milestone',
      occurredAt: '2024-04-03T09:30:00.000Z',
    });
  });
});

describe('WorkspaceOverviewTab', () => {
  it('updates workspace summary fields', async () => {
    const updateProject = vi.fn().mockResolvedValue();

    render(
      <WorkspaceOverviewTab
        project={{
          ...baseProject,
          deliverables: [{ id: 1, status: 'delivered' }],
          tasks: [{ id: 1, status: 'in_progress' }],
          meetings: [{ id: 1, scheduledAt: '2099-01-01T12:00:00Z' }],
          roleDefinitions: [{ id: 1, assignments: [{ id: 2, status: 'active' }] }],
        }}
        actions={{ updateProject }}
        canManage
      />,
    );

    const progressInput = screen.getByLabelText('Progress (% complete)');
    await act(async () => {
      await userEvent.clear(progressInput);
      await userEvent.type(progressInput, '45');
      await userEvent.click(screen.getByRole('button', { name: 'Save workspace' }));
    });

    await waitFor(() => expect(updateProject).toHaveBeenCalled());
    expect(updateProject.mock.calls[0]).toEqual([
      baseProject.id,
      expect.objectContaining({
        workspace: expect.objectContaining({ progressPercent: 45 }),
      }),
    ]);
  });
});
