import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeedbackPulse from '../FeedbackPulse.jsx';

const fetchResource = vi.fn();
const subscribe = vi.fn();
const buildKey = vi.fn((method, path, params = {}) => `${method}:${path}:${params.timeframe ?? ''}`);
const pushToast = vi.fn();

vi.mock('../../../context/DataFetchingLayer.js', () => ({
  __esModule: true,
  useDataFetchingLayer: () => ({
    fetchResource,
    subscribe,
    buildKey,
  }),
}));

vi.mock('../../../context/ToastContext.jsx', () => ({
  useToast: () => ({
    pushToast,
    dismissToast: vi.fn(),
  }),
}));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: {
    track: vi.fn(),
  },
}));

describe('FeedbackPulse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchResource.mockReset();
    subscribe.mockReset();
    pushToast.mockReset();
    buildKey.mockImplementation((method, path, params = {}) => `${method}:${path}:${params.timeframe ?? ''}`);
  });

  it('fetches and renders feedback insights', async () => {
    subscribe.mockReturnValue(() => {});
    fetchResource.mockResolvedValueOnce({
      timeframe: '7d',
      requestedTimeframe: '7d',
      availableTimeframes: ['7d', '30d'],
      overallScore: 88,
      scoreChange: 4.2,
      responseRate: 62,
      responseDelta: 3.1,
      themes: [
        { id: 'onboarding', name: 'Onboarding clarity', score: 92, change: 2.1 },
        { id: 'support', name: 'Support satisfaction', score: 84 },
      ],
      highlights: [
        {
          id: 'quote-1',
          quote: 'The new launchpad wizard is a delight.',
          persona: 'Mentor · Atlas Studio',
          submittedAt: '2024-05-01T08:00:00Z',
          channel: 'NPS',
          sentiment: 'positive',
        },
      ],
      alerts: { unresolved: 2, critical: 1, acknowledged: 5 },
      systemStatus: { status: 'operational' },
      lastUpdated: '2024-05-01T09:00:00Z',
    });

    render(<FeedbackPulse resource="/analytics/feedback/pulse" />);

    await waitFor(() =>
      expect(fetchResource).toHaveBeenCalledWith(
        '/analytics/feedback/pulse',
        expect.objectContaining({ params: { timeframe: '7d' } }),
      ),
    );

    await waitFor(() => expect(screen.getByText('Experience quality · 88 / 100')).toBeInTheDocument());
    expect(screen.getByText('Experience score')).toBeInTheDocument();
    expect(screen.getByText('Response health')).toBeInTheDocument();
    expect(screen.getByText(/View all feedback/)).toBeInTheDocument();
  });

  it('surfaces system status updates as a toast', async () => {
    subscribe.mockReturnValue(() => {});
    fetchResource.mockResolvedValueOnce({
      timeframe: '7d',
      overallScore: 72,
      scoreChange: -3.5,
      responseRate: 48,
      responseDelta: -2.1,
      themes: [],
      highlights: [
        {
          id: 'quote-2',
          quote: 'We need clearer onboarding steps.',
          sentiment: 'negative',
        },
      ],
      alerts: { unresolved: 4, critical: 2, acknowledged: 1 },
      systemStatus: {
        status: 'degraded',
        headline: 'Realtime analytics latency',
        services: [{ name: 'Insights API', status: 'degraded' }],
        updatedAt: '2024-05-01T10:00:00Z',
      },
    });

    render(<FeedbackPulse resource="/analytics/feedback/pulse" />);

    await waitFor(() => expect(pushToast).toHaveBeenCalledTimes(1));
    const payload = pushToast.mock.calls[0][0];
    expect(payload).toMatchObject({ tone: 'error', accent: '#f59e0b' });
    expect(typeof payload.content).toBe('function');
  });

  it('triggers manual refresh when the refresh button is pressed', async () => {
    subscribe.mockReturnValue(() => {});
    fetchResource.mockResolvedValueOnce({ timeframe: '7d', overallScore: 80, themes: [], highlights: [], alerts: {} });
    render(<FeedbackPulse resource="/analytics/feedback/pulse" />);

    await waitFor(() => expect(fetchResource).toHaveBeenCalledTimes(1));
    fetchResource.mockResolvedValueOnce({ timeframe: '7d', overallScore: 82, themes: [], highlights: [], alerts: {} });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => expect(fetchResource).toHaveBeenCalledTimes(2));
  });
});
