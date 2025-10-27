import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SystemStatusToast from '../SystemStatusToast.jsx';

function buildStatus(overrides = {}) {
  return {
    id: 'toast-1',
    title: 'Reliability update',
    summary: 'EU region latency impacting API partners. Updates every 15 minutes.',
    severity: 'major',
    impactSurface: 'Platform & APIs',
    updatedAt: '2024-05-11T22:45:00.000Z',
    acknowledgedAt: null,
    acknowledgedBy: null,
    metrics: {
      uptime: 99.982,
      latencyP95: 182,
      errorRate: 0.003,
      activeIncidents: 1,
    },
    incidents: [
      {
        id: 'inc-1',
        title: 'API latency spike',
        status: 'Investigating',
        startedAt: '2024-05-11T22:20:00.000Z',
        summary: 'SRE tracking downstream database lag. Customers may see elevated latency.',
      },
    ],
    channels: [
      { id: 'status', label: 'Status page' },
      { id: 'email', label: 'Customer email' },
    ],
    window: {
      label: 'Database maintenance',
      phase: 'scheduled',
      startAt: '2024-05-11T23:00:00.000Z',
      endAt: '2024-05-12T01:00:00.000Z',
      timezone: 'UTC',
    },
    warnings: [
      {
        id: 'warn-1',
        message: 'Notify APAC success teams before toggling maintenance.',
        actionLabel: 'Share playbook',
        actionLink: 'https://gigvora.notion.site',
      },
    ],
    escalations: [
      {
        id: 'esc-1',
        label: 'Draft postmortem template',
        owner: 'Reliability PM',
        dueAt: '2024-05-12T02:00:00.000Z',
        link: 'https://gigvora.notion.site/postmortem',
      },
    ],
    feedback: {
      experienceScore: 4.7,
      trendDelta: 0.3,
      queueDepth: 9,
      queueTarget: 6,
      medianResponseMinutes: 4,
      lastUpdated: '2024-05-11T22:55:00.000Z',
      reviewUrl: 'https://gigvora.com/ops/feedback',
      alerts: [
        {
          id: 'alert-1',
          message: 'APAC queue depth 35% over target.',
        },
      ],
      responseBreakdown: [
        { id: 'web', label: 'Web', percentage: 48 },
      ],
      sentimentNarrative: 'Sentiment remains above target.',
    },
    ...overrides,
  };
}

describe('SystemStatusToast', () => {
  it('renders key metrics and incidents', () => {
    render(
      <SystemStatusToast
        status={buildStatus()}
        onViewIncidents={() => {}}
        onViewRunbook={() => {}}
        onDismiss={() => {}}
      />,
    );

    expect(screen.getByText('Reliability update')).toBeInTheDocument();
    expect(screen.getByText('API latency spike')).toBeInTheDocument();
    expect(screen.getByText('99.982%')).toBeInTheDocument();
    expect(screen.getByText('182 ms')).toBeInTheDocument();
    expect(screen.getByText('Status page')).toBeInTheDocument();
  });

  it('renders maintenance window, warnings, escalations, and feedback summary', () => {
    render(
      <SystemStatusToast
        status={buildStatus()}
        onViewIncidents={() => {}}
        onViewRunbook={() => {}}
        onDismiss={() => {}}
      />,
    );

    expect(screen.getByText(/Maintenance window/i)).toBeInTheDocument();
    expect(screen.getByText(/Operational warnings/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalation checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Feedback pulse/i)).toBeInTheDocument();
    expect(screen.getByText(/Draft postmortem template/)).toBeInTheDocument();
    expect(screen.getByText(/Queue depth/)).toBeInTheDocument();
  });

  it('disables acknowledge button once acknowledged and triggers callback', async () => {
    const onAcknowledge = vi.fn();
    const user = userEvent.setup();

    render(
      <SystemStatusToast
        status={buildStatus()}
        onAcknowledge={onAcknowledge}
        onViewIncidents={() => {}}
        onViewRunbook={() => {}}
        onDismiss={() => {}}
      />,
    );

    const acknowledgeButton = screen.getByRole('button', { name: /acknowledge/i });
    await user.click(acknowledgeButton);

    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });

  it('shows acknowledgement badge when acknowledged', () => {
    const acknowledged = buildStatus({
      acknowledgedAt: '2024-05-11T22:50:00.000Z',
      acknowledgedBy: 'Ops Lead',
    });

    render(
      <SystemStatusToast
        status={acknowledged}
        onViewIncidents={() => {}}
        onViewRunbook={() => {}}
        onDismiss={() => {}}
      />,
    );

    expect(screen.getByText(/Acknowledged by Ops Lead/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acknowledged/i })).toBeDisabled();
  });
});
