import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ActivityPanel from '../ActivityPanel.jsx';
import AccountsPanel from '../AccountsPanel.jsx';
import DisputesPanel from '../DisputesPanel.jsx';
import ReleaseQueuePanel from '../ReleaseQueuePanel.jsx';
import StatementsPanel from '../StatementsPanel.jsx';

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

      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /^new$/i }));

      const nameInput = await screen.findByLabelText(/^name$/i);
      await user.clear(nameInput);
      await user.type(nameInput, ' Primary account ');

      await user.click(screen.getByRole('button', { name: /^save$/i }));

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

      await user.click(screen.getByRole('button', { name: /^cancel$/i }));

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

      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /^new$/i }));

      const summaryField = await screen.findByLabelText(/^notes$/i);
      await user.type(summaryField, 'Need immediate assistance');
      await user.click(screen.getByRole('button', { name: /^submit$/i }));

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

      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /inv-333/i }));

      const noteField = await screen.findByLabelText(/add note/i);
      await user.type(noteField, 'Client confirmed delivery.');
      await user.click(screen.getByRole('button', { name: /log note/i }));

      expect(onAppendEvent).toHaveBeenCalledWith(10, { notes: 'Client confirmed delivery.' });
    });
  });

  describe('ReleaseQueuePanel', () => {
    it('filters queue items by status and search query', async () => {
      const onRelease = vi.fn();
      const onRefund = vi.fn();

      const now = new Date();
      const futureDate = new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString();
      const pastDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString();

      render(
        <ReleaseQueuePanel
          queue={[
            {
              id: '1',
              reference: 'INV-100',
              counterpartyId: 'Northwind',
              scheduledReleaseAt: futureDate,
              amount: 320,
              currencyCode: 'USD',
            },
            {
              id: '2',
              reference: 'INV-200',
              counterpartyId: 'Contoso',
              scheduledReleaseAt: pastDate,
              amount: 450,
              status: 'released',
              currencyCode: 'USD',
            },
            {
              id: '3',
              reference: 'INV-300',
              counterpartyId: 'Tailwind',
              scheduledReleaseAt: pastDate,
              amount: 275,
              currencyCode: 'USD',
            },
          ]}
          onRelease={onRelease}
          onRefund={onRefund}
          loading={false}
          actionState={{ status: 'idle' }}
        />,
      );

      expect(screen.getByText('INV-100')).toBeInTheDocument();
      expect(screen.queryByText('INV-200')).not.toBeInTheDocument();

      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /completed/i }));

      expect(screen.getByText('INV-200')).toBeInTheDocument();
      expect(screen.getByText('INV-300')).toBeInTheDocument();

      const searchInput = screen.getByLabelText(/search/i);
      await user.type(searchInput, 'contoso');

      expect(screen.getByText('INV-200')).toBeInTheDocument();
      expect(screen.queryByText('INV-300')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /clear/i }));
      expect(searchInput).toHaveValue('');
    });

    it('confirms actions and surfaces execution errors', async () => {
      const onRelease = vi.fn().mockRejectedValue(new Error('Gateway timeout'));

      render(
        <ReleaseQueuePanel
          queue={[
            {
              id: '42',
              reference: 'INV-999',
              counterpartyId: 'Globex',
              scheduledReleaseAt: new Date().toISOString(),
              amount: 199,
              currencyCode: 'USD',
            },
          ]}
          onRelease={onRelease}
          onRefund={vi.fn()}
          loading={false}
          actionState={{ status: 'idle' }}
        />,
      );

      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /release/i }));

      const confirmButton = await screen.findByRole('button', { name: /release now/i });
      await user.click(confirmButton);

      expect(onRelease).toHaveBeenCalledWith('42', {});
      expect(await screen.findByText(/gateway timeout/i)).toBeInTheDocument();
    });
  });

  describe('StatementsPanel', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    const clickSpy = vi.fn();

    beforeAll(() => {
      URL.createObjectURL = vi.fn(() => 'blob:mock');
      URL.revokeObjectURL = vi.fn();
      Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
        configurable: true,
        value: clickSpy,
      });
    });

    afterAll(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
        configurable: true,
        value: originalAnchorClick ?? (() => {}),
      });
    });

    beforeEach(() => {
      clickSpy.mockClear();
    });

    it('filters statements by year and exports data', async () => {
      const transactions = [
        {
          id: 't-1',
          reference: 'INV-100',
          type: 'release',
          status: 'completed',
          amount: 150,
          createdAt: '2023-12-15T10:00:00Z',
        },
        {
          id: 't-2',
          reference: 'INV-200',
          type: 'release',
          status: 'completed',
          amount: 200,
          createdAt: '2024-01-10T09:00:00Z',
        },
        {
          id: 't-3',
          reference: 'INV-300',
          type: 'refund',
          status: 'completed',
          amount: -50,
          createdAt: '2024-02-05T12:00:00Z',
        },
      ];

      render(<StatementsPanel transactions={transactions} currency="USD" loading={false} />);

      const user = userEvent.setup();
      const periodSelect = screen.getByLabelText(/period/i);
      expect(periodSelect).toHaveValue('2024');
      expect(screen.getByText(/february 2024/i)).toBeInTheDocument();
      expect(screen.queryByText(/december 2023/i)).not.toBeInTheDocument();

      await user.selectOptions(periodSelect, 'all');

      expect(screen.getByText(/december 2023/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /export csv/i }));

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
      });
    });
  });
});

