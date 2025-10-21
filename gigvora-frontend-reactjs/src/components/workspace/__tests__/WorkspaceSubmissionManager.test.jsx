import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import WorkspaceSubmissionManager from '../WorkspaceSubmissionManager.jsx';

async function renderManager(props = {}) {
  let view;
  await act(async () => {
    view = render(<WorkspaceSubmissionManager {...props} />);
  });
  return view;
}

describe('WorkspaceSubmissionManager', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup({
      eventWrapper: async (callback) => {
        let result;
        await act(async () => {
          result = await callback();
        });
        return result;
      },
    });
  });

  it('creates a submission with ISO-normalised dates and surfaces feedback', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    await renderManager({ onSave, submissions: [] });

    await user.type(screen.getByLabelText('Title'), 'Wireframe bundle');
    await user.type(screen.getByLabelText('Submission type'), 'Design asset');
    await user.selectOptions(screen.getByLabelText('Status'), 'submitted');
    await user.type(screen.getByLabelText('Submitted by'), 'Alex Rivera');
    const submittedAt = '2024-02-01T09:30';
    await user.type(screen.getByLabelText('Submitted at'), submittedAt);
    await user.type(screen.getByLabelText('Reviewed by'), 'Quality Guild');
    const reviewedAt = '2024-02-02T12:15';
    await user.type(screen.getByLabelText('Reviewed at'), reviewedAt);
    await user.type(screen.getByLabelText('Attachment URL'), 'https://cdn.gigvora.com/assets/submission.pdf');
    await user.type(screen.getByLabelText('Notes'), 'Contains full discovery artefacts.');

    await user.click(screen.getByRole('button', { name: 'Add submission' }));

    const successMessage = await screen.findByText('Submission logged.');
    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload).toEqual({
      id: null,
      title: 'Wireframe bundle',
      submissionType: 'Design asset',
      status: 'submitted',
      submittedBy: 'Alex Rivera',
      submittedAt: new Date(submittedAt).toISOString(),
      reviewedBy: 'Quality Guild',
      reviewedAt: new Date(reviewedAt).toISOString(),
      notes: 'Contains full discovery artefacts.',
      attachmentUrl: 'https://cdn.gigvora.com/assets/submission.pdf',
    });

    expect(successMessage).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add submission' })).toBeEnabled();
  });

  it('edits and deletes an existing submission entry', async () => {
    const submission = {
      id: 42,
      title: 'Initial deliverable',
      submissionType: 'Prototype',
      status: 'in_review',
      submittedBy: 'Nora',
      submittedAt: '2024-02-05T09:00:00.000Z',
      reviewedBy: 'Ops',
      reviewedAt: '2024-02-06T10:00:00.000Z',
      notes: 'Pending sign-off',
      attachmentUrl: 'https://cdn.gigvora.com/assets/prototype.fig',
    };
    const onSave = vi.fn().mockResolvedValue({});
    const onDelete = vi.fn().mockResolvedValue({});

    await renderManager({ onSave, onDelete, submissions: [submission] });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByDisplayValue('Initial deliverable')).toBeInTheDocument();
    expect(screen.getByLabelText('Submitted at').value).toBe('2024-02-05T09:00');
    expect(screen.getByRole('button', { name: 'Update submission' })).toBeEnabled();

    await user.clear(screen.getByLabelText('Notes'));
    await user.type(screen.getByLabelText('Notes'), 'Approved after revisions.');
    await user.selectOptions(screen.getByLabelText('Status'), 'approved');
    await user.click(screen.getByRole('button', { name: 'Update submission' }));

    const updateFeedback = await screen.findByText('Submission updated.');
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({
      id: 42,
      status: 'approved',
      notes: 'Approved after revisions.',
    });
    expect(updateFeedback).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete/i }));
    const deleteFeedback = await screen.findByText('Submission removed.');
    expect(onDelete).toHaveBeenCalledWith(submission);
    expect(deleteFeedback).toBeInTheDocument();
  });
});
