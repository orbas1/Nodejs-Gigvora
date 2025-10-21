import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FavouriteForm from '../FavouriteForm.jsx';

describe('FavouriteForm', () => {
  it('does not call submit when the role is missing', () => {
    const onSubmit = vi.fn();

    render(
      <FavouriteForm
        mode="create"
        priorityOptions={['watching']}
        busy={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a trimmed payload when valid data is provided', () => {
    const onSubmit = vi.fn();

    render(
      <FavouriteForm
        mode="create"
        priorityOptions={['watching', 'actively_interviewing']}
        busy={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Role'), { target: { value: ' Growth PM ' } });
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Gigvora' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Growth PM', companyName: 'Gigvora', priority: 'watching' }),
    );
  });
});
