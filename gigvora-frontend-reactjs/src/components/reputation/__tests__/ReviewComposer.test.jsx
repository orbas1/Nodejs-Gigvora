import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import ReviewComposer from '../ReviewComposer.jsx';

const mutateResourceMock = vi.fn();
const buildKeyMock = vi.fn(() => 'reviews:list');
const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
  identify: vi.fn(),
  setGlobalContext: vi.fn(),
  clearGlobalContext: vi.fn(),
}));

vi.mock('../../../context/DataFetchingLayer.js', () => ({
  useDataFetchingLayer: () => ({ mutateResource: mutateResourceMock, buildKey: buildKeyMock }),
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

describe('ReviewComposer', () => {
  beforeEach(() => {
    mutateResourceMock.mockReset();
    buildKeyMock.mockClear();
    analyticsMock.track.mockReset();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits a review payload with persona context', async () => {
    mutateResourceMock.mockResolvedValueOnce({});

    render(
      <ReviewComposer
        freelancerId="talent-42"
        personaOptions={[{ value: 'client', label: 'Client sponsor' }]}
        defaultAudience={[{ value: 'public', label: 'Public' }]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Accelerated transformation' },
    });

    const storyField = screen.getByLabelText(/Story/i);
    fireEvent.change(storyField, {
      target: {
        value:
          'Working with this talent transformed our onboarding journey, increased activation by 35%, and gave executives actionable telemetry.',
      },
    });

    fireEvent.click(screen.getByText('Publish review'));

    await waitFor(() => expect(mutateResourceMock).toHaveBeenCalled());

    expect(mutateResourceMock).toHaveBeenCalledWith(
      '/reputation/freelancers/talent-42/reviews',
      expect.objectContaining({
        method: 'POST',
        metadata: expect.objectContaining({ component: 'ReviewComposer', persona: 'client' }),
      }),
    );

    expect(analyticsMock.track).toHaveBeenCalledWith(
      'review_composer_submitted',
      expect.objectContaining({ freelancerId: 'talent-42', persona: 'client' }),
    );

    expect(screen.getByText(/Review submitted/)).toBeInTheDocument();
  });

  it('shows validation error when story is too short', async () => {
    render(
      <ReviewComposer
        freelancerId="talent-42"
        personaOptions={[{ value: 'client', label: 'Client sponsor' }]}
        defaultAudience={[{ value: 'public', label: 'Public' }]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Story/i), { target: { value: 'Too short' } });
    fireEvent.click(screen.getByText('Publish review'));

    expect(
      await screen.findByText(/Add \d+ more characters for publishing\./),
    ).toBeInTheDocument();
    expect(mutateResourceMock).not.toHaveBeenCalled();
  });
});
