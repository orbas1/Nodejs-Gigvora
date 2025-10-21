import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResponseForm from '../ResponseForm.jsx';

describe('ResponseForm', () => {
  it('prevents submission when no application options are present', () => {
    render(
      <ResponseForm
        mode="create"
        applications={[]}
        directionOptions={['incoming']}
        channelOptions={['email']}
        statusOptions={['pending']}
        busy={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /log/i })).toBeDisabled();
    expect(
      screen.getByText('Add an application to capture recruiter replies and follow-ups.'),
    ).toBeInTheDocument();
  });
});
