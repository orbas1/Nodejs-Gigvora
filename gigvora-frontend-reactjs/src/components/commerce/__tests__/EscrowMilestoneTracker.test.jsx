import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EscrowMilestoneTracker from '../EscrowMilestoneTracker.jsx';

const baseDate = new Date();

const SAMPLE_TRANSACTIONS = [
  {
    id: 'txn-ready',
    milestoneLabel: 'Kickoff alignment',
    reference: 'INV-101',
    amount: 1200,
    currencyCode: 'USD',
    status: 'pending_release',
    scheduledReleaseAt: new Date(baseDate.getTime() + 36 * 60 * 60 * 1000).toISOString(),
    account: { provider: 'Escrow.com' },
    createdAt: baseDate.toISOString(),
  },
  {
    id: 'txn-released',
    milestoneLabel: 'Design sign-off',
    reference: 'INV-102',
    amount: 800,
    currencyCode: 'USD',
    status: 'released',
    scheduledReleaseAt: new Date(baseDate.getTime() - 48 * 60 * 60 * 1000).toISOString(),
    account: { provider: 'Escrow.com' },
    createdAt: baseDate.toISOString(),
  },
];

describe('EscrowMilestoneTracker', () => {
  it('renders milestones and filters by stage', async () => {
    const user = userEvent.setup();
    render(<EscrowMilestoneTracker transactions={SAMPLE_TRANSACTIONS} />);

    expect(screen.getByText(/Escrow milestone tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/Release ready/i)).toBeInTheDocument();

    const readyFilter = screen.getByRole('button', { name: /Ready to release/i });
    await act(async () => {
      await user.click(readyFilter);
    });

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(1);
    expect(within(articles[0]).getByText(/Kickoff alignment/i)).toBeInTheDocument();
  });

  it('invokes release handler for ready milestones', async () => {
    const user = userEvent.setup();
    const handleRelease = vi.fn();
    render(
      <EscrowMilestoneTracker
        transactions={SAMPLE_TRANSACTIONS}
        onRelease={handleRelease}
      />,
    );

    const milestone = screen.getByText('Kickoff alignment').closest('article');
    expect(milestone).not.toBeNull();
    const releaseButton = within(milestone).getByRole('button', { name: /Release/i });
    await act(async () => {
      await user.click(releaseButton);
    });

    expect(handleRelease).toHaveBeenCalledWith(expect.objectContaining({ id: 'txn-ready' }));
  });
});
