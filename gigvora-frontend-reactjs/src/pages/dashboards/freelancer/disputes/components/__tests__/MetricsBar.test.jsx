import { render, screen, within } from '@testing-library/react';
import MetricsBar from '../MetricsBar.jsx';

describe('MetricsBar', () => {
  it('renders metrics with provided values', () => {
    const summary = {
      totalCases: 5,
      openCases: 2,
      awaitingCustomer: 1,
      urgentCases: 3,
      dueWithin72h: 2,
      lastUpdatedAt: '2024-05-01T09:00:00.000Z',
    };

    render(<MetricsBar summary={summary} refreshing={false} />);

    const totalCard = screen.getByText('Total').closest('div');
    expect(within(totalCard).getByText('5')).toBeInTheDocument();

    const openCard = screen.getByText('Open').closest('div');
    expect(within(openCard).getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toHaveTextContent('Updated');
  });

  it('shows refreshing state when refreshing', () => {
    render(<MetricsBar summary={{}} refreshing />);
    expect(screen.getByText('Refreshing…')).toBeInTheDocument();
  });
});
