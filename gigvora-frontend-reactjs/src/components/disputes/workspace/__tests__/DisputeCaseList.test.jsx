import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisputeCaseList from '../DisputeCaseList.jsx';
import { formatAbsolute, formatRelativeTime } from '../../../../utils/date.js';

function resetTimers() {
  try {
    vi.useRealTimers();
  } catch (error) {
    // timers already real
  }
}

describe('DisputeCaseList', () => {
  const now = new Date('2024-05-05T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    resetTimers();
  });

  it('renders trust badges, risk cues, and last-touch telemetry for the active case', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const handleSelect = vi.fn();
    const dispute = {
      id: '501',
      transaction: { displayName: 'Invoice #501' },
      priority: 'urgent',
      stage: 'mediation',
      status: 'under_review',
      summary: 'Investigating milestone variance.',
      openedAt: '2024-05-01T09:30:00Z',
      updatedAt: '2024-05-05T11:45:00Z',
      customerDeadlineAt: '2024-05-06T10:00:00Z',
      metrics: { eventCount: 6, attachmentCount: 3 },
      trust: {
        score: 92,
        riskLevel: 'high',
        lastInteractionAt: '2024-05-05T10:00:00Z',
        note: 'Escalated to compliance for review.',
      },
      alert: { type: 'deadline' },
    };

    render(
      <DisputeCaseList
        disputes={[dispute]}
        onSelect={handleSelect}
        selectedId={dispute.id}
      />,
    );

    expect(screen.getByText('Invoice #501')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Mediation')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();

    const deadlineLabel = formatAbsolute(dispute.customerDeadlineAt);
    expect(screen.getByText(deadlineLabel)).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();

    expect(screen.getByText(/Events 6/i)).toBeInTheDocument();
    expect(screen.getByText(/Files 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidence 92\/100/i)).toBeInTheDocument();

    const relative = formatRelativeTime(dispute.trust.lastInteractionAt, { now });
    expect(screen.getByText(new RegExp(`Touched ${relative}`))).toBeInTheDocument();
    expect(screen.getByText(dispute.trust.note)).toBeInTheDocument();
    expect(screen.getByText(/Past due/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /invoice #501/i }));
    expect(handleSelect).toHaveBeenCalledWith(dispute);
  });

  it('renders an empty encouragement when no disputes are available', () => {
    render(<DisputeCaseList disputes={[]} onSelect={() => {}} selectedId={null} />);

    expect(screen.getByText(/No disputes yet/i)).toBeInTheDocument();
  });
});
