import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ApplicationForm from '../ApplicationForm.jsx';

describe('ApplicationForm', () => {
  it('does not submit when the role field is empty', () => {
    const onSubmit = vi.fn();

    render(
      <ApplicationForm
        mode="create"
        statusOptions={['submitted']}
        busy={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onArchive={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
