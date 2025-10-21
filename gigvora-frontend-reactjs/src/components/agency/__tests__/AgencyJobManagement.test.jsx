import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobCreationForm from '../jobManagement/JobCreationForm.jsx';
import JobDetailsPanel from '../jobManagement/JobDetailsPanel.jsx';

describe('Agency job management surfaces', () => {
  it('submits a new job with numeric compensation', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <JobCreationForm
        metadata={{ employmentTypes: ['full_time', 'contract'], seniorities: ['senior'], jobStatuses: ['draft', 'open'] }}
        onSubmit={handleSubmit}
        workspaceId={42}
      />,
    );

    await user.type(screen.getByLabelText('Job title'), 'Senior Product Designer');
    await user.type(screen.getByLabelText('Client or workspace'), 'Northwind Labs');
    await user.selectOptions(screen.getByLabelText('Employment type'), 'contract');
    await user.selectOptions(screen.getByLabelText('Seniority'), 'senior');
    await user.selectOptions(screen.getByLabelText('Status'), 'open');
    await user.type(screen.getByLabelText('Primary location'), 'Remote');
    await user.type(screen.getByLabelText('Min compensation'), '90000');
    await user.type(screen.getByLabelText('Max compensation'), '140000');
    await user.type(screen.getByLabelText('Summary'), 'Lead discovery sprints and partner with founders.');

    await user.click(screen.getByRole('button', { name: 'Create job' }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Senior Product Designer',
        clientName: 'Northwind Labs',
        workspaceId: 42,
        compensationMin: 90000,
        compensationMax: 140000,
      }),
    );
  });

  it('updates job data and manages applications', async () => {
    const user = userEvent.setup();
    const handleUpdateJob = vi.fn();
    const handleCreateApp = vi.fn();
    const handleCreateInterview = vi.fn();
    const handleCreateResponse = vi.fn();

    render(
      <JobDetailsPanel
        job={{
          id: 1,
          title: 'Senior Product Designer',
          clientName: 'Northwind Labs',
          employmentType: 'full_time',
          seniority: 'senior',
          status: 'draft',
          summary: '',
          requirements: '',
          responsibilities: '',
          location: 'Remote',
        }}
        metadata={{
          jobStatuses: ['draft', 'open'],
          applicationStatuses: ['new', 'review'],
          interviewModes: ['virtual'],
          interviewStatuses: ['scheduled'],
          responseTypes: ['note', 'email'],
          responseVisibilities: ['internal', 'client'],
        }}
        applications={[{ id: 10, candidateName: 'Alex', candidateEmail: 'alex@example.com', status: 'new', stage: 'screen' }]}
        interviews={[]}
        responses={[]}
        onUpdateJob={handleUpdateJob}
        onCreateApplication={handleCreateApp}
        onUpdateApplication={vi.fn()}
        onCreateInterview={handleCreateInterview}
        onUpdateInterview={vi.fn()}
        onCreateResponse={handleCreateResponse}
        loadingStates={{}}
      />,
    );

    const editButton = screen.getByRole('button', { name: 'Save updates' });
    const editForm = editButton.closest('form');
    const summaryField = within(editForm).getByLabelText('Summary');
    await user.clear(summaryField);
    await user.type(summaryField, 'Owns experience refresh.');
    await user.click(editButton);
    expect(handleUpdateJob).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Owns experience refresh.' }));

    const addCandidateButton = screen.getByRole('button', { name: 'Add candidate' });
    const candidateForm = addCandidateButton.closest('form');
    await user.type(within(candidateForm).getByLabelText('Name'), 'Jordan');
    await user.type(within(candidateForm).getByLabelText('Email'), 'jordan@example.com');
    await user.click(addCandidateButton);
    expect(handleCreateApp).toHaveBeenCalledWith(expect.objectContaining({ candidateName: 'Jordan' }));

    const scheduleButton = screen.getByRole('button', { name: 'Schedule' });
    const scheduleForm = scheduleButton.closest('form');
    await user.type(within(scheduleForm).getByLabelText('Date & time'), '2024-06-01T12:00');
    await user.click(scheduleButton);
    expect(handleCreateInterview).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
      expect.objectContaining({ scheduledAt: '2024-06-01T12:00' }),
    );

    const responseButton = screen.getByRole('button', { name: 'Log response' });
    const responseForm = responseButton.closest('form');
    await user.type(within(responseForm).getByLabelText('Body'), 'Shared portfolio follow-up.');
    await user.click(responseButton);
    expect(handleCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
      expect.objectContaining({ body: 'Shared portfolio follow-up.' }),
    );
  });
});
