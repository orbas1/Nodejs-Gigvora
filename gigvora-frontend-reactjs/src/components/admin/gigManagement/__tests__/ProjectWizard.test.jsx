import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectWizard from '../ProjectWizard.jsx';

describe('ProjectWizard', () => {
  const createHarness = ({ onSubmit, onClose }) => {
    return function Harness() {
      const [open, setOpen] = useState(true);

      const handleClose = () => {
        onClose?.();
        setOpen(false);
      };

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open wizard
          </button>
          <ProjectWizard open={open} onClose={handleClose} onSubmit={onSubmit} />
        </>
      );
    };
  };

  it('handles navigation, list management, and submits a sanitized payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    const Harness = createHarness({ onSubmit, onClose });

    render(<Harness />);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/step 1/i);

    await user.type(screen.getByLabelText(/title/i), 'Launch Story');
    await user.type(screen.getByLabelText(/description/i), 'Detailed rollout plan');
    await user.selectOptions(screen.getByLabelText(/status/i), 'at_risk');
    await user.selectOptions(screen.getByLabelText(/risk/i), 'high');

    const progressInput = screen.getByLabelText(/progress/i);
    await user.clear(progressInput);
    await user.type(progressInput, '42');

    await user.type(screen.getByLabelText(/start/i), '2024-07-01');
    await user.type(screen.getByLabelText(/^due$/i), '2024-09-30');

    await user.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByText(/step 2/i);
    expect(screen.getByText(/planning/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /back/i }));
    await screen.findByText(/step 1/i);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByText(/step 2/i);

    const [addMilestoneButton, addCollaboratorButton] = screen.getAllByRole('button', { name: /^add$/i });

    await user.click(addMilestoneButton);
    await user.click(addMilestoneButton);

    const milestoneTitles = screen.getAllByLabelText(/milestone title/i);
    await user.type(milestoneTitles[0], 'Launch kickoff');
    await user.type(milestoneTitles[1], 'QA signoff');

    const milestoneDueDates = screen.getAllByLabelText(/milestone due date/i);
    await user.type(milestoneDueDates[0], '2024-08-22');
    await user.type(milestoneDueDates[1], '2024-09-05');

    const milestoneStatusSelects = screen.getAllByLabelText(/milestone status/i);
    await user.selectOptions(milestoneStatusSelects[0], 'in_progress');
    await user.selectOptions(milestoneStatusSelects[1], 'completed');

    await user.click(screen.getByRole('button', { name: /remove milestone qa signoff/i }));

    const remainingMilestones = screen.getAllByLabelText(/milestone title/i);
    expect(remainingMilestones).toHaveLength(1);
    expect(remainingMilestones[0]).toHaveValue('Launch kickoff');

    await user.click(addCollaboratorButton);
    await user.click(addCollaboratorButton);

    const collaboratorNames = screen.getAllByLabelText(/collaborator full name/i);
    await user.type(collaboratorNames[0], 'Pat Jones');
    await user.type(collaboratorNames[1], 'Alex Roe');

    const collaboratorEmails = screen.getAllByLabelText(/collaborator email/i);
    await user.type(collaboratorEmails[0], 'pat@example.com');
    await user.type(collaboratorEmails[1], 'alex@example.com');

    const collaboratorRoles = screen.getAllByLabelText(/collaborator role/i);
    await user.clear(collaboratorRoles[0]);
    await user.type(collaboratorRoles[0], 'Producer');
    await user.clear(collaboratorRoles[1]);
    await user.type(collaboratorRoles[1], 'Analyst');

    await user.click(screen.getByRole('button', { name: /remove collaborator alex/i }));

    const remainingCollaborators = screen.getAllByLabelText(/collaborator full name/i);
    expect(remainingCollaborators).toHaveLength(1);
    expect(remainingCollaborators[0]).toHaveValue('Pat Jones');

    const currencyInput = screen.getByLabelText(/currency/i);
    await user.clear(currencyInput);
    await user.type(currencyInput, 'eur');

    const budgetInput = screen.getByLabelText(/budget$/i);
    await user.clear(budgetInput);
    await user.type(budgetInput, '10000');

    const spentInput = screen.getByLabelText(/spent/i);
    await user.clear(spentInput);
    await user.type(spentInput, '2500');

    await user.type(screen.getByLabelText(/next milestone/i), 'Kickoff call');
    await user.type(screen.getByLabelText(/next due/i), '2024-08-01');

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Launch Story',
        description: 'Detailed rollout plan',
        status: 'at_risk',
        startDate: '2024-07-01',
        dueDate: '2024-09-30',
        budgetCurrency: 'EUR',
        budgetAllocated: 10000,
        budgetSpent: 2500,
        workspace: {
          status: 'at_risk',
          riskLevel: 'high',
          progressPercent: 42,
          nextMilestone: 'Kickoff call',
          nextMilestoneDueAt: '2024-08-01',
        },
        milestones: [
          {
            title: 'Launch kickoff',
            dueDate: '2024-08-22',
            status: 'in_progress',
            ordinal: 0,
          },
        ],
        collaborators: [
          {
            fullName: 'Pat Jones',
            email: 'pat@example.com',
            role: 'Producer',
            status: 'invited',
          },
        ],
      });
    });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('resets the wizard state when cancelled', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    const Harness = createHarness({ onSubmit, onClose });

    render(<Harness />);

    await screen.findByRole('dialog');

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Temporary Title');
    expect(titleInput).toHaveValue('Temporary Title');

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /open wizard/i }));

    await screen.findByRole('dialog');
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/progress/i)).toHaveValue(10);
  });
});

