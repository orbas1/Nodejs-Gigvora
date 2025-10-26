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
  targetScore: 4.7,
  pendingResponses: 11,
  health: 'Watchlist',
  aiSummary: 'Sentiment softens for SMB cohort. Address backlog and follow up with top accounts.',
  channels: [
    { id: 'status', label: 'Status page banner' },
    { id: 'email', label: 'Lifecycle email' },
  ],
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
  alerts: [
    {
      id: 'alert-smb',
      title: 'SMB backlog',
      description: 'SMB queue wait times exceeded 6m average.',
      recommendedAction: 'Spin up concierge shift.',
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
    expect(screen.getByText(/AI summary/i)).toBeInTheDocument();
    expect(screen.getByText(/SMB backlog/i)).toBeInTheDocument();
    expect(screen.getByText(/Status page banner/i)).toBeInTheDocument();
  });

  it('invokes review handler when CTA clicked', async () => {
    const user = userEvent.setup();
    const onReview = vi.fn();

    render(<FeedbackPulse analytics={ANALYTICS} onReview={onReview} />);

    await user.click(screen.getByRole('button', { name: /review insights/i }));

    expect(onReview).toHaveBeenCalledTimes(1);
  });
});
