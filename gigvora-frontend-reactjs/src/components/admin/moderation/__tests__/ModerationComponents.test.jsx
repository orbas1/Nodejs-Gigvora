import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ModerationAuditTimeline from '../ModerationAuditTimeline.jsx';
import ModerationOverviewCards from '../ModerationOverviewCards.jsx';
import ModerationQueueTable from '../ModerationQueueTable.jsx';

vi.mock('../../../utils/date.js', () => ({
  formatRelativeTime: () => 'moments ago',
  formatAbsolute: () => '2024-05-01 10:00',
}));

describe('ModerationAuditTimeline', () => {
  it('renders formatted audit entries and metadata', () => {
    render(
      <ModerationAuditTimeline
        events={[
          {
            id: 1,
            action: 'message_blocked',
            reason: 'Toxic content',
            severity: 'high',
            status: 'resolved',
            channelSlug: 'general',
            actorId: 42,
            createdAt: '2024-05-01T10:00:00.000Z',
            metadata: { resolutionNotes: 'Escalated to CISO' },
          },
        ]}
      />,
    );

    expect(screen.getByText(/message blocked/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalated to CISO/)).toBeInTheDocument();
    expect(screen.getByText(/moments ago/)).toBeInTheDocument();
    expect(screen.getByText(/User #42/)).toBeInTheDocument();
  });
});

describe('ModerationOverviewCards', () => {
  it('derives values from overview snapshot and handles selection', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <ModerationOverviewCards
        overview={{
          queue: { open: 4 },
          totals: { high: 2, critical: 1 },
          actions: { message_blocked: 3, participant_muted: 5 },
          averageResolutionSeconds: 3600,
        }}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('Queue backlog')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1h 0m')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Queue backlog/i }));
    expect(onSelect).toHaveBeenCalledWith('queueOpen');
  });
});

describe('ModerationQueueTable', () => {
  it('renders empty state when there are no items', () => {
    render(<ModerationQueueTable items={[]} loading={false} />);
    expect(screen.getByText(/All clear/i)).toBeInTheDocument();
  });

  it('calls onResolve when resolve is clicked', async () => {
    const onResolve = vi.fn();
    const user = userEvent.setup();

    render(
      <ModerationQueueTable
        loading={false}
        onResolve={onResolve}
        items={[
          {
            id: 9,
            createdAt: '2024-05-02T11:00:00.000Z',
            channelSlug: 'community',
            severity: 'critical',
            status: 'open',
            reason: 'Spam campaign',
            metadata: { signals: [{ message: 'Link to scam' }], score: 98 },
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /resolve/i }));
    expect(onResolve).toHaveBeenCalledWith(
      expect.objectContaining({ id: 9 }),
    );
  });
});
