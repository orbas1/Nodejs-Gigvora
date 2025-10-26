import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FeedbackPulse, { formatTrend } from '../FeedbackPulse.jsx';

const ANALYTICS = {
  experienceScore: 4.6,
  trendDelta: 0.3,
  queueDepth: 12,
  medianResponseMinutes: 3,
  lastUpdated: '2024-05-11T22:50:00.000Z',
  reviewUrl: 'https://gigvora.com/ops/feedback',
  segments: [
    { id: 'enterprise', label: 'Enterprise', score: 4.8, delta: 0.2, sampleSize: 124 },
    { id: 'smb', label: 'SMB', score: 4.3, delta: -0.1, sampleSize: 98 },
  ],
  highlights: [
    {
      id: 'hl-1',
      persona: 'Enterprise PM',
      quote: 'Love the proactive comms during maintenance.',
      sentiment: 'Positive',
      recordedAt: '2024-05-11T22:40:00.000Z',
    },
  ],
};

describe('formatTrend', () => {
  it('formats numbers with sign and fixed precision', () => {
    expect(formatTrend(0.345)).toBe('+0.3');
    expect(formatTrend(-0.12)).toBe('-0.1');
    expect(formatTrend(undefined)).toBe('0.0');
  });
});

describe('FeedbackPulse', () => {
  it('renders segments and highlights', () => {
    render(<FeedbackPulse analytics={ANALYTICS} />);

    expect(screen.getByText('4.6')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    expect(screen.getByText(/Positive/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review insights/i })).toBeInTheDocument();
  });

  it('invokes review handler when CTA clicked', async () => {
    const user = userEvent.setup();
    const onReview = vi.fn();

    render(<FeedbackPulse analytics={ANALYTICS} onReview={onReview} />);

    await user.click(screen.getByRole('button', { name: /review insights/i }));

    expect(onReview).toHaveBeenCalledTimes(1);
  });
});
