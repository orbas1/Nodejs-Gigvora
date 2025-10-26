import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskKanban from '../TaskKanban.jsx';

const buildProject = () => ({
  id: 91,
  tasks: [
    {
      id: 1,
      title: 'Research user journeys',
      status: 'planned',
      description: 'Interview top customers and map new flows.',
      dueDate: '2025-02-10T00:00:00.000Z',
      priority: 'high',
      assignments: [],
    },
    {
      id: 2,
      title: 'Design system update',
      status: 'in_progress',
      dueDate: '2025-02-05T00:00:00.000Z',
      priority: 'high',
      assignments: [
        { id: 'assignee-1', assigneeEmail: 'design@gigvora.com', assigneeName: 'Design Lead' },
      ],
    },
    {
      id: 3,
      title: 'Data compliance review',
      status: 'blocked',
      dueDate: '2025-02-12T00:00:00.000Z',
      priority: 'medium',
      assignments: [
        { id: 'assignee-2', assigneeEmail: 'legal@gigvora.com', assigneeName: 'Legal Ops' },
      ],
    },
  ],
});

describe('TaskKanban', () => {
  it('shows summary metrics and allows filtering by collaborator', async () => {
    const actions = { updateTask: vi.fn().mockResolvedValue({}) };
    render(<TaskKanban project={buildProject()} actions={actions} canManage />);

    expect(screen.getByText(/Task Kanban/i)).toBeInTheDocument();
    const totalTile = screen.getByText('Total', { selector: 'dt' }).closest('div');
    const blockedTile = screen.getByText('Blocked', { selector: 'dt' }).closest('div');
    expect(totalTile).toHaveTextContent('3');
    expect(blockedTile).toHaveTextContent('1');

    await userEvent.selectOptions(screen.getByDisplayValue('All collaborators'), 'legal@gigvora.com');
    expect(screen.getByText(/Data compliance review/i)).toBeInTheDocument();
    expect(screen.queryByText(/Design system update/i)).not.toBeInTheDocument();
  });

  it('moves tasks across columns and reveals task insights', async () => {
    const actions = { updateTask: vi.fn().mockResolvedValue({}) };
    render(<TaskKanban project={buildProject()} actions={actions} canManage />);

    const inspectButtons = screen.getAllByRole('button', { name: /Inspect/i });
    await userEvent.click(inspectButtons[0]);
    expect(screen.getByText(/Task focus/i)).toBeInTheDocument();

    const advanceButtons = screen.getAllByRole('button', { name: /Advance/i });
    await userEvent.click(advanceButtons[0]);

    expect(actions.updateTask).toHaveBeenCalledWith(91, 1, { status: 'in_progress' });
  });
});
