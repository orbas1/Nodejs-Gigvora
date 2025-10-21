import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InterviewForm from '../InterviewForm.jsx';

describe('InterviewForm', () => {
  it('disables scheduling when there are no applications to link', () => {
    render(
      <InterviewForm
        mode="create"
        applications={[]}
        statusOptions={['scheduled']}
        typeOptions={['phone']}
        busy={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /schedule/i })).toBeDisabled();
    expect(
      screen.getByText('Add an application from the job hub to enable scheduling.'),
    ).toBeInTheDocument();
  });
});
