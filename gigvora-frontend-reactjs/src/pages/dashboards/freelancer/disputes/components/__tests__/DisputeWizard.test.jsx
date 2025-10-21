import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DisputeWizard from '../DisputeWizard.jsx';

describe('DisputeWizard', () => {
  const baseProps = {
    open: true,
    onClose: vi.fn(),
    onCreate: vi.fn(),
    transactions: [
      {
        id: 'tx-1',
        reference: 'REF-1',
        milestoneLabel: 'Kick-off',
        amount: 1250,
        currencyCode: 'USD',
      },
    ],
    reasons: [
      { value: 'quality_gap', label: 'Quality gap' },
      { value: 'timeline', label: 'Timeline' },
    ],
    priorities: ['low', 'medium', 'high'],
  };

  it('renders nothing when closed', () => {
    const { container } = render(<DisputeWizard {...baseProps} open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('allows selecting a transaction and submitting the dispute', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue({ dispute: { id: 'case-1' } });

    render(<DisputeWizard {...baseProps} onCreate={onCreate} />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /ref-1/i }));
    });
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();

    await act(async () => {
      await user.selectOptions(screen.getByLabelText(/reason/i), 'quality_gap');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(/summary/i), ' Issue found   ');
    });
    await act(async () => {
      await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create/i }));
    });

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          escrowTransactionId: 'tx-1',
          reasonCode: 'quality_gap',
          summary: 'Issue found',
          priority: 'high',
        }),
      );
    });
  });

  it('displays validation feedback when required fields are missing', async () => {
    const user = userEvent.setup();

    render(<DisputeWizard {...baseProps} />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /ref-1/i }));
    });
    await act(async () => {
      await user.selectOptions(screen.getByLabelText(/reason/i), 'quality_gap');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(/summary/i), '   ');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create/i }));
    });

    expect(await screen.findByText(/please complete the required fields/i)).toBeInTheDocument();
  });

  it('resets state when closed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(<DisputeWizard {...baseProps} onClose={onClose} />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /ref-1/i }));
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /cancel/i }));
    });

    expect(onClose).toHaveBeenCalled();

    rerender(<DisputeWizard {...baseProps} open={false} onClose={onClose} />);
    rerender(<DisputeWizard {...baseProps} onClose={onClose} />);
    expect(screen.getByRole('button', { name: /ref-1/i })).toBeInTheDocument();
  });
});
