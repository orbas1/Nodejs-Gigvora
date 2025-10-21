import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectDrawer from '../ProjectDrawer.jsx';

describe('ProjectDrawer', () => {
  it('sends workspace updates with numeric conversions', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue();
    const handleClose = vi.fn();
    const project = {
      id: 7,
      title: 'Gig Launch',
      status: 'planning',
      dueDate: '2024-08-10',
      workspace: {
        status: 'in_progress',
        progressPercent: 55,
        riskLevel: 'medium',
        nextMilestone: 'QA signoff',
        nextMilestoneDueAt: '2024-08-05',
        notes: 'Enable weekly check-ins.',
      },
    };

    render(
      <ProjectDrawer open project={project} onClose={handleClose} onSubmit={handleSubmit} />,
    );

    await screen.findByRole('dialog');

    await user.selectOptions(screen.getByLabelText(/status/i), 'completed');
    await user.clear(screen.getByLabelText(/progress/i));
    await user.type(screen.getByLabelText(/progress/i), '80');
    await user.selectOptions(screen.getByLabelText(/risk/i), 'high');
    await user.clear(screen.getByLabelText(/next milestone/i));
    await user.type(screen.getByLabelText(/next milestone/i), 'Launch playbook');
    await user.clear(screen.getByLabelText(/notes/i));
    await user.type(screen.getByLabelText(/notes/i), 'Promote post-launch retro.');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(7, {
        status: 'completed',
        progressPercent: 80,
        riskLevel: 'high',
        nextMilestone: 'Launch playbook',
        nextMilestoneDueAt: '2024-08-05',
        notes: 'Promote post-launch retro.',
      });
    });

    expect(handleClose).toHaveBeenCalled();
  });
});
