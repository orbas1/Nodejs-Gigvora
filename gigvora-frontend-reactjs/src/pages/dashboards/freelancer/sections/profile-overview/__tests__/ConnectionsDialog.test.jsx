import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConnectionsDialog from '../ConnectionsDialog.jsx';

const SAMPLE_CONNECTIONS = {
  pendingIncoming: [{ id: 1, user: { name: 'Ada' } }],
  pendingOutgoing: [{ id: 2, user: { name: 'Lin' } }],
  accepted: [{ id: 3, user: { name: 'Mia' } }],
};

describe('ConnectionsDialog', () => {
  it('handles actions for different tabs', async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn();
    const handleCreate = vi.fn().mockResolvedValue();
    const handleDelete = vi.fn();

    render(
      <ConnectionsDialog
        open
        connections={SAMPLE_CONNECTIONS}
        onUpdate={handleUpdate}
        onCreate={handleCreate}
        onDelete={handleDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /accept/i }));
    expect(handleUpdate).toHaveBeenCalledWith(1, { status: 'accepted' });

    await user.click(screen.getByRole('button', { name: /invite/i }));
    await user.type(screen.getByLabelText(/email/i), 'networker@example.com');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => expect(handleCreate).toHaveBeenCalledWith({ email: 'networker@example.com' }));
  });

  it('validates invite input', async () => {
    const user = userEvent.setup();

    render(<ConnectionsDialog open onCreate={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /invite/i }));
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
  });

  it('handles deletions for sent and active tabs', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();

    render(
      <ConnectionsDialog
        open
        connections={SAMPLE_CONNECTIONS}
        onDelete={handleDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^sent$/i }));
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(handleDelete).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole('button', { name: /^active$/i }));
    await user.click(screen.getByRole('button', { name: /^remove$/i }));
    expect(handleDelete).toHaveBeenCalledWith(3);
  });
});
