import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeedbackPulse from '../FeedbackPulse.jsx';

const analytics = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: analytics,
}));

vi.mock('../../../context/ThemeProvider.tsx', () => ({
  __esModule: true,
  useTheme: () => ({ tokens: { colors: { accent: '#6366f1' } } }),
}));

describe('FeedbackPulse', () => {
  beforeEach(() => {
    analytics.track.mockClear();
  });

  it('captures score, tags, and comment before submitting feedback', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();

    render(
      <FeedbackPulse
        question="How confident do you feel running weekly growth experiments?"
        description="Your response helps us prioritise which enablement tracks unlock the most value."
        tags={["Analytics gaps", 'Tooling friction', 'Team bandwidth']}
        segments={[
          { label: 'Product ops', value: 78, delta: 4.1 },
          { label: 'Growth squads', value: 64, delta: -2.5 },
        ]}
        insights={[
          { title: 'Need clearer dashboards', description: 'Leaders want KPI guardrails surfaced alongside experiments.' },
        ]}
        trend={{ label: 'Confidence', value: 72, delta: 3.6, comparison: 'last quarter', sampleSize: 284 }}
        lastResponseAt="2024-03-02T09:45:00Z"
        onSubmit={onSubmit}
        referenceTime="2024-03-02T12:00:00Z"
      />,
    );

    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('Highlights')).toBeInTheDocument();
    expect(screen.getByText('Need clearer dashboards')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Strained/ }));
      await user.click(screen.getByRole('button', { name: /Analytics gaps/ }));
      await user.type(
        screen.getByLabelText('Share more context'),
        'Dashboards feel disconnected from experiments.',
      );
      await user.click(screen.getByRole('button', { name: 'Send feedback' }));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        score: 2,
        tags: ['Analytics gaps'],
        comment: 'Dashboards feel disconnected from experiments.',
      });
    });

    expect(await screen.findByText(/Thank you/)).toBeInTheDocument();
    expect(await screen.findByText('Last response 2 hours ago')).toBeInTheDocument();

    await waitFor(() => {
      expect(analytics.track).toHaveBeenCalledWith('feedback_pulse_score_selected', expect.objectContaining({
        question: 'How confident do you feel running weekly growth experiments?',
        value: 2,
      }));
      expect(analytics.track).toHaveBeenCalledWith('feedback_pulse_tag_toggled', expect.objectContaining({
        tag: 'Analytics gaps',
        active: true,
      }));
      expect(analytics.track).toHaveBeenCalledWith('feedback_pulse_submitted', expect.objectContaining({
        score: 2,
        tags: ['Analytics gaps'],
        commentLength: 46,
      }));
    });
  });
});
