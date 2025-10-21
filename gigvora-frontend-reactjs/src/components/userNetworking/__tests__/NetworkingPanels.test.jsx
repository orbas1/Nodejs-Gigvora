import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import NetworkingPeoplePanel from '../NetworkingPeoplePanel.jsx';
import NetworkingPurchasesPanel from '../NetworkingPurchasesPanel.jsx';
import NetworkingSessionsPanel from '../NetworkingSessionsPanel.jsx';
import NetworkingSlideOver from '../NetworkingSlideOver.jsx';

describe('Networking panels', () => {

  it('filters people connections by status', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();
    const handleEdit = vi.fn();
    const handleOpen = vi.fn();
    const now = Date.now();

    const connections = [
      {
        id: '1',
        followStatus: 'following',
        contact: { firstName: 'Avery', lastName: 'Lee' },
        connectionHeadline: 'Creative Director',
        connectionCompany: 'Atlas Studio',
        connectedAt: new Date(now - 8 * 3600 * 1000).toISOString(),
        lastContactedAt: new Date(now - 2 * 3600 * 1000).toISOString(),
        sessionId: 's1',
        session: { title: 'Atlas Mixer' },
        connectionEmail: 'avery@gigvora.com',
        tags: ['Design', 'Founder'],
      },
      {
        id: '2',
        followStatus: 'connected',
        contact: { firstName: 'Morgan', lastName: 'Gray' },
        connectionHeadline: 'Product Lead',
        connectedAt: new Date(now - 24 * 3600 * 1000).toISOString(),
        lastContactedAt: new Date(now - 4 * 3600 * 1000).toISOString(),
        session: { title: 'Speed Networking' },
        sessionId: 's2',
        connectionEmail: 'morgan@gigvora.com',
        tags: ['Product'],
      },
    ];

    function Harness() {
      const [filter, setFilter] = useState('All');
      return (
        <NetworkingPeoplePanel
          connections={connections}
          activeFilter={filter}
          onChangeFilter={setFilter}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onOpen={handleOpen}
        />
      );
    }

    render(<Harness />);

    expect(screen.getAllByText(/avery lee/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/morgan gray/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /active/i }));

    await waitFor(() => {
      expect(screen.queryByText(/avery lee/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/morgan gray/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add/i }));
    expect(handleCreate).toHaveBeenCalledTimes(1);

    await user.click(screen.getAllByRole('button', { name: /open/i })[0]);
    expect(handleOpen).toHaveBeenCalledTimes(1);

    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('presents purchases with currency formatting and filters by status', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();
    const handleEdit = vi.fn();
    const handleOpen = vi.fn();
    const now = Date.now();

    const purchases = [
      {
        id: 'p1',
        status: 'paid',
        amountCents: 12500,
        currency: 'usd',
        session: { title: 'Mentor Hour' },
        sessionId: 'm1',
        purchasedAt: new Date(now - 6 * 3600 * 1000).toISOString(),
        reference: 'INV-01',
        notes: 'Follow-up notes',
      },
      {
        id: 'p2',
        status: 'pending',
        amountCents: 8900,
        currency: 'eur',
        session: { title: 'Demo Day' },
        sessionId: 'm2',
        purchasedAt: new Date(now - 3600 * 1000).toISOString(),
        reference: 'INV-02',
        metadata: { userNotes: 'Waiting for budget sign-off' },
      },
    ];

    function Harness() {
      const [filter, setFilter] = useState('All');
      return (
        <NetworkingPurchasesPanel
          purchases={purchases}
          activeFilter={filter}
          onChangeFilter={setFilter}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onOpen={handleOpen}
        />
      );
    }

    render(<Harness />);

    expect(screen.getAllByText(/mentor hour/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\$125.00/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /pending/i }));

    await waitFor(() => {
      expect(screen.queryByText(/mentor hour/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/demo day/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add/i }));
    expect(handleCreate).toHaveBeenCalledTimes(1);

    await user.click(screen.getAllByRole('button', { name: /open/i })[0]);
    expect(handleOpen).toHaveBeenCalledTimes(1);

    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('classifies sessions into upcoming and past buckets', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();
    const handleEdit = vi.fn();
    const handleOpen = vi.fn();
    const now = Date.now();

    const upcomingStart = new Date(now + 2 * 3600 * 1000).toISOString();
    const upcomingEnd = new Date(now + 3 * 3600 * 1000).toISOString();
    const pastEnd = new Date(now - 3600 * 1000).toISOString();

    const bookings = [
      {
        id: 'b1',
        status: 'confirmed',
        seatNumber: 'A1',
        sessionId: 'sess-1',
        session: { title: 'Roundtable', startTime: upcomingStart, endTime: upcomingEnd },
        joinUrl: 'https://meet.gigvora.com/roundtable',
      },
      {
        id: 'b2',
        status: 'completed',
        seatNumber: 'B3',
        sessionId: 'sess-2',
        session: { title: 'Fireside', startTime: new Date(now - 2 * 3600 * 1000).toISOString(), endTime: pastEnd },
        completedAt: pastEnd,
        joinUrl: 'https://meet.gigvora.com/fireside',
      },
    ];

    function Harness() {
      const [filter, setFilter] = useState('All');
      return (
        <NetworkingSessionsPanel
          bookings={bookings}
          activeFilter={filter}
          onChangeFilter={setFilter}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onOpen={handleOpen}
        />
      );
    }

    render(<Harness />);

    expect(screen.getAllByText(/roundtable/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/fireside/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /upcoming/i }));

    await waitFor(() => {
      expect(screen.queryByText(/fireside/i)).not.toBeInTheDocument();
    });
    expect((await screen.findAllByText(/roundtable/i)).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /past/i }));

    expect((await screen.findAllByText(/fireside/i)).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /add/i }));
    expect(handleCreate).toHaveBeenCalledTimes(1);

    await user.click(screen.getAllByRole('button', { name: /open/i })[0]);
    expect(handleOpen).toHaveBeenCalledTimes(1);

    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('respects preventClose in the slide over', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    const { rerender } = render(
      <NetworkingSlideOver open title="Details" subtitle="More info" onClose={handleClose}>
        <p>Body</p>
      </NetworkingSlideOver>,
    );

    expect(screen.getByText(/details/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    rerender(
      <NetworkingSlideOver open title="Details" onClose={handleClose} preventClose>
        <p>Body</p>
      </NetworkingSlideOver>,
    );

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
