import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DisputeTrustInsights from '../DisputeTrustInsights.jsx';

function resetTimers() {
  try {
    vi.useRealTimers();
  } catch (error) {
    // ignore when timers are already real
  }
}

describe('DisputeTrustInsights', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-05T12:00:00Z'));
  });

  afterEach(() => {
    resetTimers();
  });

  it('surfaces trust posture, SLA cadence, deadlines, and risk alerts', () => {
    render(
      <DisputeTrustInsights
        summary={{
          trustScore: 92.3,
          resolutionRate: 0.82,
          averageFirstResponseMinutes: 47,
          autoEscalationRate: 0.25,
          slaBreaches: 2,
          nextSlaReviewAt: '2024-05-08T09:00:00Z',
          openExposure: { amount: 4200, currency: 'USD' },
          upcomingDeadlines: [
            {
              id: 'd-1',
              disputeId: '101',
              summary: 'Provide contract addendum',
              dueAt: '2024-05-06T09:00:00Z',
            },
          ],
          riskAlerts: [
            {
              id: 'a-1',
              disputeId: '101',
              title: 'Awaiting compliance evidence',
              summary: 'Upload proof of milestone completion.',
              severity: 'high',
              owner: 'claire',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Trust posture')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText(/82% resolution rate/i)).toBeInTheDocument();
    expect(screen.getByText(/First responses landing in 47 min\./i)).toBeInTheDocument();
    expect(screen.getByText(/25% of cases auto-escalated/i)).toBeInTheDocument();
    expect(screen.getByText(/Next SLA review/i)).toBeInTheDocument();
    expect(screen.getByText('Provide contract addendum')).toBeInTheDocument();
    expect(screen.getByText(/Awaiting compliance evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/@claire/i)).toBeInTheDocument();
    expect(screen.getByText(/Exposure/)).toHaveTextContent(/\$4,200/);
    expect(screen.getByText(/Confidence 92\/100/i)).toBeInTheDocument();
    expect(screen.getByText(/2 SLA breaches this quarter/i)).toBeInTheDocument();
  });

  it('falls back gracefully when metrics and lists are empty', () => {
    render(<DisputeTrustInsights summary={{}} />);

    expect(screen.getByText('Trust posture')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText(/Resolution rate calibrating/i)).toBeInTheDocument();
    expect(screen.getByText(/Awaiting first-response telemetry/i)).toBeInTheDocument();
    expect(screen.getByText(/Auto-escalation cadence standing by/i)).toBeInTheDocument();
    expect(screen.getByText(/No deadlines in the next 7 days/i)).toBeInTheDocument();
    expect(screen.getByText(/No active risk alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidence Calibrating/i)).toBeInTheDocument();
  });
});
