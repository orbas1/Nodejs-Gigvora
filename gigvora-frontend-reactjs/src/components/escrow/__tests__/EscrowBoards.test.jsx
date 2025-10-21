import { render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import EscrowActivityBoard from '../EscrowActivityBoard.jsx';
import EscrowDisputeBoard from '../EscrowDisputeBoard.jsx';
import EscrowDisputeForm from '../EscrowDisputeForm.jsx';

describe('Escrow boards', () => {
  it('renders escrow activity and triggers primary actions', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onInspect = vi.fn();
    const onEdit = vi.fn();
    const onRelease = vi.fn();
    const onRefund = vi.fn();
    const onDispute = vi.fn();

    const transactions = [
      {
        id: 1,
        reference: 'TX-001',
        accountId: 10,
        account: { displayName: 'Primary account' },
        amount: 2500,
        currencyCode: 'USD',
        status: 'funded',
        createdAt: '2024-03-01T10:00:00.000Z',
        updatedAt: '2024-03-02T10:00:00.000Z',
      },
    ];

    render(
      <EscrowActivityBoard
        transactions={transactions}
        currency="USD"
        onCreate={onCreate}
        onInspect={onInspect}
        onEdit={onEdit}
        onRelease={onRelease}
        onRefund={onRefund}
        onDispute={onDispute}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /new/i }));
    });
    expect(onCreate).toHaveBeenCalledTimes(1);

    const row = screen.getByText('TX-001').closest('tr');
    expect(row).not.toBeNull();
    const rowWithin = within(row);
    await act(async () => {
      await user.click(rowWithin.getByRole('button', { name: /view/i }));
    });
    expect(onInspect).toHaveBeenCalledWith(transactions[0]);

    await act(async () => {
      await user.click(rowWithin.getByRole('button', { name: /edit/i }));
    });
    expect(onEdit).toHaveBeenCalledWith(transactions[0]);

    await act(async () => {
      await user.click(rowWithin.getByRole('button', { name: /release/i }));
    });
    expect(onRelease).toHaveBeenCalledWith(transactions[0]);

    await act(async () => {
      await user.click(rowWithin.getByRole('button', { name: /refund/i }));
    });
    expect(onRefund).toHaveBeenCalledWith(transactions[0]);

    await act(async () => {
      await user.click(rowWithin.getByRole('button', { name: /dispute/i }));
    });
    expect(onDispute).toHaveBeenCalledWith(transactions[0]);
  });

  it('shows disputes summary and opens selected dispute', async () => {
    const user = userEvent.setup();
    const onInspect = vi.fn();
    const disputes = [
      {
        id: 5,
        reasonCode: 'quality_issue',
        status: 'open',
        openedAt: '2024-02-01T09:00:00.000Z',
        updatedAt: '2024-02-02T10:00:00.000Z',
        summary: 'Client reported defects in delivery.',
      },
    ];

    render(<EscrowDisputeBoard disputes={disputes} onInspect={onInspect} />);

    expect(screen.getByText(/1 open/i)).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /quality issue/i }));
    });
    expect(onInspect).toHaveBeenCalledWith(disputes[0]);
  });

  it('validates dispute form before submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    const transaction = { id: 9, reference: 'TX-009' };

    render(
      <EscrowDisputeForm
        transaction={transaction}
        priorities={['low', 'medium', 'high']}
        submitting={false}
        onSubmit={onSubmit}
        userId={101}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /open dispute/i }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
    await screen.findByText(/add a summary/i);

    await act(async () => {
      await user.type(screen.getByLabelText(/summary/i), 'Serious delay reported');
    });
    await act(async () => {
      await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
    });
    const assignInput = screen.getByLabelText(/assign to/i);
    await act(async () => {
      await user.type(assignInput, '7');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /open dispute/i }));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        escrowTransactionId: 9,
        openedById: 101,
        priority: 'high',
        summary: 'Serious delay reported',
      }),
    );
  });
});
