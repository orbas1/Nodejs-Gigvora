import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../services/ads.js', () => ({
  getAdsDashboard: vi.fn(),
  listAdsPlacements: vi.fn(),
}));

import { getAdsDashboard, listAdsPlacements } from '../../../services/ads.js';
import GigvoraAdsConsole from '../GigvoraAdsConsole.jsx';

const baseSnapshot = {
  generatedAt: '2024-01-01T12:00:00.000Z',
  overview: {
    totalPlacements: 12,
    activePlacements: 5,
    upcomingPlacements: 4,
    totalCampaigns: 3,
    keywordHighlights: [{ keyword: 'Design', weight: 12 }],
    taxonomyHighlights: [{ slug: 'product-design', weight: 7 }],
    context: { locale: 'en-US' },
  },
  surfaces: [
    { surface: 'global_dashboard', label: 'Global', totalPlacements: 3 },
    { surface: 'user_dashboard', label: 'User', totalPlacements: 2 },
  ],
  forecast: {
    summary: {
      horizonDays: 14,
      projectedSessions: 1200,
      expectedImpressions: 2200,
      expectedClicks: 340,
      expectedLeads: 50,
      expectedRevenue: 5400,
      expectedSpend: 2100,
      couponCoverage: 45,
    },
    traffic: {
      averageDailySessions: 420,
      growthRate: 0.12,
      returningVisitorRate: 64,
      mobileShare: 71,
      trend: [
        { date: '2024-01-01', sessions: 400 },
        { date: '2024-01-02', sessions: 420 },
      ],
      sourceBreakdown: [{ source: 'search', share: 0.4 }],
    },
    scenarios: [],
    assumptions: [],
    safetyChecks: [],
  },
  recommendations: ['Refresh the marketplace hero creative.'],
};

const placementResponse = {
  placements: [
    {
      id: 'placement-1',
      score: 8.8,
      isActive: true,
      timeUntilStartMinutes: 90,
      timeUntilEndMinutes: 1440,
      creative: {
        headline: 'Scale your pipeline',
        subheadline: 'Personalised audiences on autopilot',
        campaign: { name: 'Growth funnel', objective: 'awareness' },
      },
      keywords: [{ id: 'kw-1', keyword: 'marketing', weight: 12 }],
      taxonomies: [{ id: 'tax-1', slug: 'growth', weight: 5 }],
    },
  ],
};

describe('GigvoraAdsConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listAdsPlacements.mockResolvedValue(placementResponse);
  });

  it('renders snapshot metrics and loads placements for the default surface', async () => {
    render(<GigvoraAdsConsole initialSnapshot={baseSnapshot} />);

    expect(screen.getByText(/gigvora ads console/i)).toBeInTheDocument();
    const overviewCard = screen.getByText(/total placements/i).closest('div');
    expect(overviewCard).not.toBeNull();
    expect(within(overviewCard).getAllByText('12')[0]).toBeInTheDocument();

    await waitFor(() => {
      expect(listAdsPlacements).toHaveBeenCalledWith({ surfaces: ['global_dashboard'], signal: expect.anything() });
    });

    expect(await screen.findByText(/scale your pipeline/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Active$/i).length).toBeGreaterThan(0);
  });

  it('refreshes data with correct cache semantics', async () => {
    const user = userEvent.setup();
    getAdsDashboard.mockResolvedValueOnce(baseSnapshot);

    render(<GigvoraAdsConsole initialSnapshot={baseSnapshot} />);

    await user.click(screen.getByRole('button', { name: /refresh/i }));

    await waitFor(() => {
      expect(getAdsDashboard).toHaveBeenCalledWith({
        surfaces: ['global_dashboard', 'user_dashboard'],
        context: baseSnapshot.overview.context,
        bypassCache: false,
        signal: expect.anything(),
      });
    });

    getAdsDashboard.mockResolvedValueOnce(baseSnapshot);
    await user.click(screen.getByRole('button', { name: /force sync/i }));

    await waitFor(() => {
      const lastCall = getAdsDashboard.mock.calls.at(-1)[0];
      expect(lastCall.bypassCache).toBe(true);
    });
  });

  it('shows error feedback when refresh fails', async () => {
    const user = userEvent.setup();
    getAdsDashboard.mockRejectedValueOnce(new Error('Service unavailable'));
    render(<GigvoraAdsConsole initialSnapshot={baseSnapshot} />);

    await user.click(screen.getAllByRole('button', { name: /refresh/i })[0]);

    expect(await screen.findByText(/could not refresh/i)).toBeInTheDocument();
    const errorDetails = screen.getAllByText(/service unavailable/i);
    expect(errorDetails.length).toBeGreaterThan(0);
  });
});
