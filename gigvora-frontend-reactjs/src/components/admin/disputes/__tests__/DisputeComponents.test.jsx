import { render, screen, fireEvent, within } from '@testing-library/react';
import DisputeMetricsCards from '../DisputeMetricsCards.jsx';
import DisputeTable from '../DisputeTable.jsx';

describe('DisputeMetricsCards', () => {
  it('renders summary metrics with formatted values', () => {
    render(
      <DisputeMetricsCards
        summary={{
          openCount: 12,
          overdueCount: 3,
          dueSoonCount: 5,
          unassignedCount: 2,
          totalHeldAmount: 50000,
        }}
      />,
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Escrow')).toBeInTheDocument();
    expect(screen.getByText(/\$50,?000/)).toBeInTheDocument();
  });

  it('invokes onSelect when a card is activated', () => {
    const handleSelect = vi.fn();
    render(<DisputeMetricsCards onSelect={handleSelect} />);

    fireEvent.click(screen.getByText('Open'));
    expect(handleSelect).toHaveBeenCalledWith('openCount');
  });

  it('handles keyboard activation and default summary gracefully', () => {
    const handleSelect = vi.fn();
    render(<DisputeMetricsCards onSelect={handleSelect} />);

    const firstCard = screen.getByLabelText('View open disputes');
    fireEvent.keyDown(firstCard, { key: ' ' });
    fireEvent.keyDown(firstCard, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('View escrow disputes')).toBeInTheDocument();
  });
});

describe('DisputeTable', () => {
  const baseItem = {
    id: 42,
    stage: 'mediation',
    status: 'open',
    priority: 'urgent',
    transaction: { amount: 1500, currencyCode: 'USD', reference: 'ESCROW-1' },
    assignedTo: { displayName: 'Alex Admin' },
    customerDeadlineAt: '2024-06-01T12:00:00Z',
    providerDeadlineAt: '2024-06-02T12:00:00Z',
    updatedAt: '2024-05-28T09:00:00Z',
    latestEvent: { notes: 'Awaiting customer reply.' },
  };

  it('renders dispute rows and summary chips', () => {
    render(
      <DisputeTable
        items={[baseItem]}
        summary={{
          totalsByStage: { mediation: 4 },
          totalsByPriority: { urgent: 2 },
        }}
      />,
    );

    const row = screen.getByText('#42').closest('tr');
    expect(row).not.toBeNull();
    const utils = within(row);
    expect(utils.getByText('Mediation')).toBeInTheDocument();
    expect(utils.getByText('Urgent')).toBeInTheDocument();
    expect(utils.getByText('Awaiting customer reply.')).toBeInTheDocument();

    const breakdownContainer = screen.getByRole('heading', { name: 'Queue' }).parentElement;
    expect(breakdownContainer).not.toBeNull();
    expect(within(breakdownContainer).getByText('Mediation')).toBeInTheDocument();
    expect(within(breakdownContainer).getByText('Urgent')).toBeInTheDocument();
  });

  it('supports selection callbacks', () => {
    const handleSelect = vi.fn();
    render(<DisputeTable items={[baseItem]} onSelect={handleSelect} />);

    fireEvent.click(screen.getByText('#42'));
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }));
  });

  it('supports keyboard activation and sanitises pagination values', () => {
    const handleSelect = vi.fn();
    const handlePageChange = vi.fn();

    render(
      <DisputeTable
        items={[baseItem]}
        onSelect={handleSelect}
        onPageChange={handlePageChange}
        pagination={{ page: '2', totalPages: '5', totalItems: '20' }}
      />,
    );

    const interactiveRow = screen.getByLabelText('View dispute #42 - Mediation stage');
    fireEvent.keyDown(interactiveRow, { key: 'Enter' });
    fireEvent.keyDown(interactiveRow, { key: ' ' });

    expect(handleSelect).toHaveBeenCalledTimes(2);
    expect(handleSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 42 }));

    expect(screen.getByText('Page 2 of 5 · 20 total cases')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(handlePageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('shows empty state when no disputes exist', () => {
    render(<DisputeTable items={[]} />);
    expect(screen.getByText('No disputes.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DisputeTable items={[]} loading />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
