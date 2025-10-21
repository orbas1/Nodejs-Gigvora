import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MentorDashboardInsights from '../MentorDashboardInsights.jsx';

describe('MentorDashboardInsights', () => {
  const dashboard = {
    stats: {
      activeMentees: 12,
      activeMenteesChange: 8,
      upcomingSessions: 4,
      upcomingSessionsChange: 0,
      avgRating: 4.9,
      monthlyRevenue: 4200,
      monthlyRevenueChange: -12,
    },
    conversion: [
      { id: 'demand', label: 'Explorer demand', value: 120, delta: 5 },
      { id: 'requests', label: 'Booking requests', value: 45, delta: 0 },
    ],
  };

  it('renders stats with captions and trends', () => {
    render(<MentorDashboardInsights dashboard={dashboard} loading={false} />);

    expect(screen.getByText('Growth vs. last month')).toBeInTheDocument();
    expect(screen.getByText('Holding steady vs. last month')).toBeInTheDocument();
    expect(screen.getByText('Down vs. last month')).toBeInTheDocument();
    expect(screen.getByText('+8%')).toBeInTheDocument();
    expect(screen.getAllByText('Stable').length).toBeGreaterThan(0);
    expect(screen.getByText('-12%')).toBeInTheDocument();
  });

  it('disables refresh while loading and triggers callback otherwise', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    const { rerender } = render(
      <MentorDashboardInsights dashboard={dashboard} loading={false} onRefresh={onRefresh} />,
    );

    const [headerRefresh] = screen.getAllByRole('button', { name: /refresh/i });
    await user.click(headerRefresh);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    rerender(<MentorDashboardInsights dashboard={dashboard} loading />);
    expect(screen.getAllByRole('button', { name: /refresh/i })[0]).toBeDisabled();
  });

  it('shows conversion funnel when data is available', () => {
    render(<MentorDashboardInsights dashboard={dashboard} loading={false} />);

    expect(screen.getByText('Conversion funnel')).toBeInTheDocument();
    expect(screen.getByText('Explorer demand')).toBeInTheDocument();
  });

  it('handles missing conversion gracefully', () => {
    render(<MentorDashboardInsights dashboard={{ stats: {} }} loading={false} />);

    expect(screen.queryByText('Conversion funnel')).not.toBeInTheDocument();
    expect(screen.getAllByText('Last 30 days').length).toBeGreaterThan(0);
  });
});
