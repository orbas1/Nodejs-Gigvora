import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AgencyCollaborationsPanel from '../AgencyCollaborationsPanel.jsx';

const baseData = {
  summary: {
    activeCollaborations: 2,
    monthlyRetainerValue: 12000,
    monthlyRetainerCurrency: 'USD',
    pendingInvitations: 1,
    acceptanceRate: 65,
    openNegotiations: 1,
    negotiationPipelineValue: 5000,
    negotiationPipelineCurrency: 'USD',
    averageHealthScore: 82,
  },
  invitations: {
    pending: [
      {
        id: 'invite-1',
        workspace: { name: 'Atlas Collective' },
        roleTitle: 'Lead strategist',
        engagementType: 'retainer',
        responseDueAt: '2024-05-05T12:00:00Z',
        proposedRetainer: 4500,
        currency: 'USD',
      },
    ],
  },
  collaborations: {
    active: [
      {
        id: 'collab-1',
        workspace: { name: 'Northwind Agency' },
        retainerAmountMonthly: 6500,
        currency: 'USD',
        collaborationType: 'dedicated_pod',
        healthScore: 88,
        activeBriefsCount: 4,
        negotiations: [],
        forecastedUpsellValue: 2500,
        forecastedUpsellCurrency: 'USD',
        upcomingDeliverable: {
          title: 'Strategy workshop',
          dueAt: '2024-05-08T12:00:00Z',
          owner: 'Alex Doe',
        },
      },
    ],
  },
  negotiations: {
    open: [
      {
        id: 'neg-1',
        workspace: { name: 'Northwind Agency' },
        value: 5000,
        currency: 'USD',
        stage: 'proposal_sent',
        updatedAt: '2024-04-30T10:00:00Z',
      },
    ],
    recentEvents: [],
  },
  renewals: {
    upcoming: [{ id: 'renewal-1', dueAt: '2024-06-01T12:00:00Z' }],
    atRisk: [],
    retentionScore: 82,
  },
};

describe('AgencyCollaborationsPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders primary headings with provided data', () => {
    render(
      <AgencyCollaborationsPanel data={baseData} loading={false} error={null} onRetry={vi.fn()} />,
    );

    expect(screen.getByText('Agency collaborations & retainers')).toBeInTheDocument();
    expect(screen.getByText('Pending agency invitations')).toBeInTheDocument();
  });

  it('displays an error chip and triggers refresh callback', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });

    render(
      <AgencyCollaborationsPanel data={baseData} loading={false} error="Failed to load" onRetry={onRetry} />,
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /refresh/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
