import { fireEvent, render, screen } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import ReputationScorecard from '../ReputationScorecard.jsx';

const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
  identify: vi.fn(),
  setGlobalContext: vi.fn(),
  clearGlobalContext: vi.fn(),
}));

vi.mock('../../../context/ThemeProvider.tsx', () => ({
  useTheme: () => ({
    tokens: { colors: { accent: '#2563eb' } },
    registerComponentTokens: vi.fn(),
    removeComponentTokens: vi.fn(),
    resolveComponentTokens: () => ({}),
  }),
}));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: analyticsMock,
  analytics: analyticsMock,
}));

describe('ReputationScorecard', () => {
  beforeEach(() => {
    analyticsMock.track.mockReset();
  });

  it('renders trust telemetry, metrics, and achievements', () => {
    render(
      <ReputationScorecard
        summary={{
          trustScore: 88,
          trustScoreChange: 3.2,
          reviewAverage: 4.8,
          totalReviews: 64,
          achievements: ['Won innovation award'],
          insights: ['Focus on enterprise pods'],
          trustBreakdown: [
            { id: 'delivery', label: 'Delivery reliability', score: 92, change: 2.1 },
            { id: 'relationships', label: 'Stakeholder delight', score: 89, change: 1.2 },
          ],
          benchmarks: [{ id: 'industry', label: 'Industry cohort', score: 80, delta: 8 }],
        }}
        metrics={[
          {
            id: 'projects',
            label: 'Projects delivered',
            value: 12,
            trendLabel: '+2 vs previous',
            trendDirection: 'up',
            timeframe: '90d',
          },
        ]}
      />,
    );

    expect(screen.getByText('Executive trust telemetry')).toBeInTheDocument();
    expect(screen.getByText('Projects delivered')).toBeInTheDocument();
    expect(screen.getByText(/Won innovation award/)).toBeInTheDocument();
    expect(screen.getByText(/Refresh/)).toBeInTheDocument();
  });

  it('tracks timeframe selection analytics', () => {
    render(
      <ReputationScorecard
        summary={{ trustScore: 90, trustScoreChange: 4.2, reviewAverage: 4.9, totalReviews: 20 }}
        metrics={[
          {
            id: 'projects',
            label: 'Projects delivered',
            value: 20,
            timeframe: '30d',
          },
          {
            id: 'projects-90',
            label: 'Projects delivered',
            value: 40,
            timeframe: '90d',
          },
        ]}
      />,
    );

    const rangeButton = screen.getByRole('button', { name: '30D' });
    fireEvent.click(rangeButton);

    expect(analyticsMock.track).toHaveBeenCalledWith('reputation_scorecard_range_selected', { range: '30d' });
  });
});
