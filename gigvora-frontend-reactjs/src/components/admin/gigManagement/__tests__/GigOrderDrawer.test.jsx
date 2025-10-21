import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GigOrderDrawer from '../GigOrderDrawer.jsx';

describe('GigOrderDrawer', () => {
  it('normalizes requirement and scorecard updates', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue();
    const handleClose = vi.fn();
    const order = {
      id: 11,
      orderNumber: 'ORD-11',
      vendorName: 'Studio X',
      status: 'requirements',
      progressPercent: 15,
      dueAt: '2024-07-20',
      metadata: { notes: 'Original notes' },
      requirements: [
        { id: 71, title: 'Brief', status: 'pending', dueAt: '2024-07-05', notes: 'Waiting assets' },
        { id: 72, title: 'Design', status: 'received', dueAt: '2024-07-12', notes: '' },
      ],
      revisions: [
        { id: 'rev-1', roundNumber: 1, summary: 'First pass', status: 'submitted', dueAt: '2024-07-18' },
      ],
      scorecard: {
        overallScore: 3.5,
        qualityScore: 3,
        communicationScore: 4,
        reliabilityScore: 3,
        notes: 'Needs tighter briefs',
      },
    };

    render(
      <GigOrderDrawer open order={order} onClose={handleClose} onSubmit={handleSubmit} />,
    );

    await screen.findByRole('dialog');

    await user.selectOptions(screen.getByLabelText(/^status$/i), 'in_revision');
    await user.clear(screen.getByLabelText(/progress %/i));
    await user.type(screen.getByLabelText(/progress %/i), '55');
    await user.clear(screen.getByLabelText(/^due$/i));
    await user.type(screen.getByLabelText(/^due$/i), '2024-09-01');
    await user.clear(screen.getByLabelText(/^notes$/i));
    await user.type(screen.getByLabelText(/^notes$/i), 'Needs follow-up.');

    const requirementTitles = screen.getAllByLabelText(/requirement title/i);
    await user.clear(requirementTitles[0]);
    await user.type(requirementTitles[0], 'Kickoff deck');

    const requirementStatus = screen.getAllByLabelText(/requirement status/i);
    await user.selectOptions(requirementStatus[0], 'approved');

    const requirementDue = screen.getAllByLabelText(/requirement due date/i);
    await user.clear(requirementDue[0]);
    await user.type(requirementDue[0], '2024-08-15');

    await user.click(screen.getByRole('button', { name: /remove requirement design/i }));

    await user.click(screen.getByRole('button', { name: /^add$/i }));
    const updatedRequirementTitles = screen.getAllByLabelText(/requirement title/i);
    await user.type(updatedRequirementTitles[2], 'QA checklist');
    const updatedRequirementStatus = screen.getAllByLabelText(/requirement status/i);
    await user.selectOptions(updatedRequirementStatus[2], 'received');
    const updatedRequirementDue = screen.getAllByLabelText(/requirement due date/i);
    await user.type(updatedRequirementDue[2], '2024-08-20');

    await user.clear(screen.getByLabelText(/overall/i));
    await user.type(screen.getByLabelText(/overall/i), '4.5');
    await user.clear(screen.getByLabelText(/quality/i));
    await user.type(screen.getByLabelText(/quality/i), '4');
    await user.clear(screen.getByLabelText(/communication/i));
    await user.type(screen.getByLabelText(/communication/i), '4.2');
    await user.clear(screen.getByLabelText(/reliability/i));
    await user.type(screen.getByLabelText(/reliability/i), '4.8');
    await user.clear(screen.getByLabelText(/score notes/i));
    await user.type(screen.getByLabelText(/score notes/i), 'Improved delivery pace.');

    await user.type(screen.getByPlaceholderText(/summary/i), 'Iteration 2');
    await user.type(screen.getByLabelText(/revision due date/i), '2024-08-25');
    await user.selectOptions(screen.getByLabelText(/revision status/i), 'in_progress');

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(11, {
        status: 'in_revision',
        progressPercent: 55,
        dueAt: '2024-09-01',
        metadata: { notes: 'Needs follow-up.' },
        requirements: [
          {
            id: 71,
            title: 'Kickoff deck',
            status: 'approved',
            dueAt: '2024-08-15',
            notes: 'Waiting assets',
          },
          {
            id: undefined,
            title: 'QA checklist',
            status: 'received',
            dueAt: '2024-08-20',
            notes: null,
          },
        ],
        removeRequirementIds: [72],
        scorecard: {
          overallScore: 4.5,
          qualityScore: 4,
          communicationScore: 4.2,
          reliabilityScore: 4.8,
          notes: 'Improved delivery pace.',
        },
        newRevisions: [
          {
            summary: 'Iteration 2',
            dueAt: '2024-08-25',
            status: 'in_progress',
          },
        ],
      });
    });

    expect(handleClose).toHaveBeenCalled();
  });
});
