import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgencyAllianceManager from '../AgencyAllianceManager.jsx';

const { dataStatusMock } = vi.hoisted(() => ({
  dataStatusMock: vi.fn(({ onRefresh }) => (
    <button type="button" onClick={onRefresh}>
      Refresh snapshot
    </button>
  )),
}));

vi.mock('../../DataStatus.jsx', () => ({
  __esModule: true,
  default: dataStatusMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('AgencyAllianceManager', () => {
  it('renders loading state when waiting for alliances', () => {
    render(<AgencyAllianceManager data={{ alliances: [] }} loading fromCache={false} />);

    expect(screen.getByText(/loading alliance intelligence/i)).toBeInTheDocument();
  });

  it('renders error message when an error occurs', () => {
    render(
      <AgencyAllianceManager
        data={{ alliances: [] }}
        error={new Error('Network down')}
        loading={false}
      />,
    );

    expect(screen.getByText(/couldn't load alliance data/i)).toBeInTheDocument();
    expect(screen.getByText(/Network down/i)).toBeInTheDocument();
  });

  it('displays alliance metrics and forwards refresh control', () => {
    const onRefresh = vi.fn();
    const alliances = [
      {
        alliance: {
          id: 'a1',
          name: 'Strategic Alliance',
          status: 'active',
          description: 'Enterprise delivery partnership',
          allianceType: 'go_to_market',
        },
        membership: {
          revenueSharePercent: 12.5,
          commitmentHours: 42,
        },
        metrics: {
          totalPods: 3,
          activeRateCards: 2,
          pendingApprovals: 1,
          nextReviewAt: '2024-06-01',
        },
        pods: [
          {
            id: 'pod-1',
            name: 'Activation pod',
            podType: 'Delivery',
            focusArea: 'Onboarding ramp',
            backlogValue: 25000,
            capacityTarget: 3,
            leadMember: {
              user: { firstName: 'Alex', lastName: 'Rivera' },
            },
            members: [
              {
                allianceMemberId: 'm1',
                member: { user: { firstName: 'Casey', lastName: 'Jones' } },
                weeklyCommitmentHours: 12.5,
                utilizationTarget: 80,
              },
            ],
          },
        ],
        rateCardGroups: [
          {
            serviceLine: 'Growth strategy',
            deliveryModel: 'retainer',
            latest: {
              rate: 4500,
              currency: 'USD',
              unit: 'month',
              version: 3,
              effectiveFrom: '2024-05-01',
            },
            history: [
              {
                version: 2,
                rate: 4200,
                currency: 'USD',
                unit: 'month',
                effectiveFrom: '2023-11-01',
                effectiveTo: '2024-04-30',
              },
            ],
            pendingApprovals: [{ id: 'approval-1' }],
          },
        ],
        revenueSplits: [
          {
            id: 'split-1',
            splitType: 'revenue_share',
            status: 'active',
            effectiveFrom: '2024-04-01',
            terms: { agency: 60, partner: 40 },
          },
        ],
        resourceCalendar: [
          {
            weekStartDate: '2024-05-06',
            plannedHours: 40,
            bookedHours: 32,
            availableHours: 8,
            utilizationRate: 80,
            members: [
              { memberId: 'm1', memberName: 'Casey Jones', utilizationRate: 75 },
            ],
          },
        ],
      },
    ];

    const resourceHeatmap = {
      weeks: [
        {
          weekStartDate: '2024-05-13',
          totalPlannedHours: 45,
          totalBookedHours: 38,
          availableHours: 7,
          utilizationRate: 84,
          allocations: [
            { allianceId: 'a1', allianceName: 'Strategic Alliance', utilizationRate: 65 },
          ],
        },
      ],
    };

    render(
      <AgencyAllianceManager
        data={{ alliances, resourceHeatmap }}
        loading={false}
        fromCache={false}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByText('Strategic Alliance')).toBeInTheDocument();
    expect(screen.getAllByText(/Revenue share/i)).toHaveLength(2);
    expect(screen.getByText((content) => content.includes('$25,000'))).toBeInTheDocument();
    expect(screen.getByText(/Alliance bandwidth heatmap/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /refresh snapshot/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(dataStatusMock).toHaveBeenCalled();
    expect(dataStatusMock.mock.calls[0][0].onRefresh).toBe(onRefresh);
  });
});
