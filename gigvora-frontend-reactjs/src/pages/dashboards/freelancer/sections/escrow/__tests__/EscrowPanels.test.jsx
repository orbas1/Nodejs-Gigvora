import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ActivityPanel from '../ActivityPanel.jsx';
import AccountsPanel from '../AccountsPanel.jsx';
import DisputesPanel from '../DisputesPanel.jsx';

describe('Escrow panels', () => {
  describe('ActivityPanel', () => {
    it('handles empty inputs gracefully', () => {
      render(<ActivityPanel activity={undefined} transactions={null} />);

      expect(screen.getByText(/no activity logged yet/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /all events/i }));
      expect(screen.getByText(/no activity logged yet/i)).toBeInTheDocument();
    });

    it('filters activity by transaction', async () => {
      const activity = [
        {
          id: 1,
          transactionId: 101,
          reference: 'INV-101',
          occurredAt: '2024-05-01T12:00:00Z',
          action: 'FUNDS_RELEASED',
          notes: 'Funds released to freelancer',
          amount: 300,
          currencyCode: 'USD',
        },
        {
          id: 2,
          transactionId: 202,
          reference: 'INV-202',
          occurredAt: '2024-05-02T10:00:00Z',
          action: 'FUNDED',
          notes: 'Escrow funded',
          amount: 150,
          currencyCode: 'USD',
        },
      ];

      const transactions = [
        { id: 101, reference: 'INV-101' },
        { id: 202, reference: 'INV-202' },
      ];

      render(<ActivityPanel activity={activity} transactions={transactions} />);

      expect(screen.getByText(/funds released to freelancer/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /inv-202/i }));

      expect(screen.getByText(/escrow funded/i)).toBeInTheDocument();
      expect(screen.queryByText(/funds released/i)).not.toBeInTheDocument();
    });
  });

  describe('AccountsPanel', () => {
    it('surfaces drawer errors on failed save', async () => {
      const onCreate = vi.fn().mockRejectedValue(new Error('Network issue'));
      const onUpdate = vi.fn();

      render(
        <AccountsPanel
          accounts={[]}
          onCreate={onCreate}
          onUpdate={onUpdate}
          loading={false}
          actionState={{ status: 'idle' }}
        />,
      );

      expect(screen.getByText(/no accounts yet/i)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /^new$/i }));

      const nameInput = await screen.findByLabelText(/^name$/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, ' Primary account ');

      await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

      expect(onCreate).toHaveBeenCalledWith({
        provider: 'escrow_com',
        currencyCode: 'USD',
        metadata: { accountLabel: 'Primary account' },
        settings: {
          autoReleaseOnApproval: true,
          notifyOnDispute: true,
          manualHold: false,
        },
      });

      expect(await screen.findByText(/network issue/i)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('DisputesPanel', () => {
    it('shows API errors when opening a dispute fails', async () => {
      const disputes = [
        {
          id: 1,
          stage: 'review',
          status: 'open',
          priority: 'high',
          summary: 'Quality concerns',
          openedAt: '2024-05-01T12:00:00Z',
          transaction: { reference: 'INV-101' },
          events: [],
        },
      ];

      const transactions = [{ id: 99, reference: 'INV-222', status: 'funded' }];

      const onOpenDispute = vi.fn().mockRejectedValue(new Error('Failed to escalate'));
      const onAppendEvent = vi.fn().mockResolvedValue({});

      render(
        <DisputesPanel
          disputes={disputes}
          transactions={transactions}
          onOpenDispute={onOpenDispute}
          onAppendEvent={onAppendEvent}
          actionState={{ status: 'idle' }}
        />,
      );

      await userEvent.click(screen.getByRole('button', { name: /^new$/i }));

      const summaryField = await screen.findByLabelText(/^notes$/i);
      await userEvent.type(summaryField, 'Need immediate assistance');
      await userEvent.click(screen.getByRole('button', { name: /^submit$/i }));

      expect(await screen.findByText(/failed to escalate/i)).toBeInTheDocument();
    });

    it('appends dispute notes', async () => {
      const disputes = [
        {
          id: 10,
          stage: 'triage',
          status: 'open',
          priority: 'medium',
          summary: 'Timeline concerns',
          openedAt: '2024-05-10T08:00:00Z',
          transaction: { reference: 'INV-333' },
          events: [],
        },
      ];

      const onOpenDispute = vi.fn();
      const onAppendEvent = vi.fn().mockResolvedValue({});

      render(
        <DisputesPanel
          disputes={disputes}
          transactions={[]}
          onOpenDispute={onOpenDispute}
          onAppendEvent={onAppendEvent}
          actionState={{ status: 'idle' }}
        />,
      );

      await userEvent.click(screen.getByRole('button', { name: /inv-333/i }));

      const noteField = await screen.findByLabelText(/add note/i);
      await userEvent.type(noteField, 'Client confirmed delivery.');
      await userEvent.click(screen.getByRole('button', { name: /log note/i }));

      expect(onAppendEvent).toHaveBeenCalledWith(10, { notes: 'Client confirmed delivery.' });
    });
  });
});

