import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import DisputeMetrics from '../DisputeMetrics.jsx';

describe('DisputeMetrics', () => {
  it('formats trust scoring and applies risk-aware tones', () => {
    render(
      <DisputeMetrics
        summary={{
          trustScore: 60,
          openCount: 12,
          awaitingCustomerAction: 3,
          escalatedCount: 2,
          slaBreaches: 1,
          total: 58,
        }}
      />,
    );

    const trustCard = screen.getByText(/Trust score/i).closest('div.flex');
    expect(trustCard?.className).toContain('bg-rose-50');
    expect(screen.getByText('60/100')).toBeInTheDocument();

    const waitingCard = screen.getByText(/Waiting on you/i).closest('div.flex');
    expect(waitingCard?.className).toContain('bg-amber-50');
    expect(screen.getByText('3')).toBeInTheDocument();

    const escalatedCard = screen.getByText(/Escalated/i).closest('div.flex');
    expect(escalatedCard?.className).toContain('bg-blue-50');
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('uses neutral styling when trust score is unavailable', () => {
    render(<DisputeMetrics summary={{}} />);

    const trustCard = screen.getByText(/Trust score/i).closest('div.flex');
    expect(trustCard?.className).toContain('bg-slate-50');
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
