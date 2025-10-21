import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ExperienceDrawer from '../ExperienceDrawer.jsx';

describe('ExperienceDrawer', () => {
  it('submits sanitised entries', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue();

    render(
      <ExperienceDrawer
        open
        onClose={vi.fn()}
        onSave={handleSave}
        experience={[{ id: '1', title: 'Designer', company: 'Acme', startDate: '2023-01-01' }]}
      />,
    );

    await user.type(screen.getByPlaceholderText(/what did you deliver/i), 'Led redesign');
    await user.click(screen.getByRole('button', { name: /save experience/i }));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ experience: expect.arrayContaining([expect.objectContaining({ title: 'Designer' })]) }),
    );
  });

  it('validates chronological ranges', async () => {
    const user = userEvent.setup();

    render(
      <ExperienceDrawer
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        experience={[{ id: '1', title: 'Engineer', startDate: '2023-05-01', endDate: '2023-06-01' }]}
      />,
    );

    await user.clear(screen.getAllByLabelText(/end/i)[0]);
    await user.type(screen.getAllByLabelText(/end/i)[0], '2023-01-01');
    await user.click(screen.getByRole('button', { name: /save experience/i }));

    expect(screen.getByText(/ensure end dates/i)).toBeInTheDocument();
  });

  it('disables closure while saving', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ExperienceDrawer
        open
        onClose={handleClose}
        onSave={vi.fn()}
        experience={[{ id: '1', title: 'Engineer', company: 'Acme' }]}
        saving
      />,
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();

    await user.click(cancelButton);
    expect(handleClose).not.toHaveBeenCalled();
  });
});
