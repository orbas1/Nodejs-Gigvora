import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkspaceDashboard from '../WorkspaceDashboard.jsx';

const project = {
  id: 77,
  title: 'Launch creative studio',
  status: 'in_progress',
  dueDate: '2025-04-10T00:00:00.000Z',
  workspace: {
    status: 'active',
    progressPercent: 35,
    riskLevel: 'medium',
    nextMilestone: 'Design freeze',
    nextMilestoneDueAt: '2025-03-15T00:00:00.000Z',
    notes: 'Weekly updates on Mondays.',
  },
  tasks: [
    { id: 1, title: 'Draft messaging', status: 'completed', dueDate: '2025-02-01T00:00:00.000Z', priority: 'high' },
    { id: 2, title: 'Design hero screens', status: 'in_progress', dueDate: '2025-02-10T00:00:00.000Z', priority: 'high' },
    { id: 3, title: 'Legal review', status: 'blocked', dueDate: '2025-02-05T00:00:00.000Z', priority: 'medium' },
  ],
  deliverables: [
    { id: 4, status: 'approved' },
    { id: 5, status: 'draft' },
    { id: 6, status: 'in_review' },
  ],
  approvals: [
    { id: 9, title: 'Brand board', status: 'pending', dueAt: '2025-02-12T00:00:00.000Z' },
    { id: 10, title: 'Tone doc', status: 'approved', dueAt: '2025-01-20T00:00:00.000Z' },
  ],
  submissions: [{ id: 11, status: 'pending' }],
  timelineEntries: [
    { id: 12, name: 'Sprint review', startAt: '2025-02-07T09:00:00.000Z' },
    { id: 13, name: 'Beta launch', startAt: '2025-03-20T09:00:00.000Z' },
  ],
  meetings: [{ id: 14, startAt: '2025-02-04T15:00:00.000Z' }],
  files: [
    { id: 15, label: 'Executive summary', storageUrl: 'https://example.com/summary.pdf', uploadedBy: 'Avery' },
  ],
  invitations: [{ id: 16, status: 'pending' }],
  conversations: [
    { id: 17, topic: 'Stakeholder alignment', priority: 5, updatedAt: '2025-02-01T09:00:00.000Z', lastMessage: 'Need sign off.' },
  ],
  roleDefinitions: [
    { id: 18, name: 'Creative lead', assignments: [{ id: 'a', status: 'active' }] },
    { id: 19, name: 'Product owner', assignments: [] },
  ],
};

describe('WorkspaceDashboard', () => {
  it('renders executive metrics and insights', () => {
    const actions = { updateProject: vi.fn() };

    render(<WorkspaceDashboard project={project} actions={actions} canManage />);

    expect(screen.getByRole('heading', { level: 3, name: /Launch creative studio/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Operational pulse/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Team coverage/i })).toBeInTheDocument();
    expect(screen.getByText(/Pending approvals/i)).toBeInTheDocument();
    expect(screen.getByText(/Engagement signals/i)).toBeInTheDocument();
  });

  it('submits workspace updates with the latest form values', async () => {
    const actions = { updateProject: vi.fn().mockResolvedValue({}) };
    render(<WorkspaceDashboard project={project} actions={actions} canManage />);

    await userEvent.selectOptions(screen.getByLabelText(/Workspace status/i), 'blocked');
    await userEvent.selectOptions(screen.getByLabelText(/Risk level/i), 'high');
    await userEvent.clear(screen.getByLabelText(/Progress/i));
    await userEvent.type(screen.getByLabelText(/Progress/i), '55');
    await userEvent.click(screen.getByRole('button', { name: /Share update/i }));

    expect(actions.updateProject).toHaveBeenCalledWith(project.id, expect.objectContaining({
      status: 'in_progress',
      workspace: expect.objectContaining({ riskLevel: 'high', progressPercent: 55, status: 'blocked' }),
    }));
  });
});
