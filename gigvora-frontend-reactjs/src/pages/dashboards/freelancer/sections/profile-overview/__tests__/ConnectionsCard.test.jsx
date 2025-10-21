import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConnectionsCard from '../ConnectionsCard.jsx';

describe('ConnectionsCard', () => {
  it('summarises connection counts', () => {
    render(
      <ConnectionsCard
        connections={{ pendingIncoming: [{}], pendingOutgoing: [{}], accepted: [{}, {}] }}
      />,
    );

    expect(screen.getByText('2 active')).toBeInTheDocument();
    expect(screen.getByText('2 pending')).toBeInTheDocument();
  });

  it('invokes the open handler', async () => {
    const user = userEvent.setup();
    const handleOpen = vi.fn();

    render(<ConnectionsCard onOpen={handleOpen} />);

    await user.click(screen.getByRole('button', { name: /network/i }));
    expect(handleOpen).toHaveBeenCalled();
  });
});
