import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgencyOverviewPanel from '../AgencyOverviewPanel.jsx';

const sampleData = {
  refreshedAt: '2024-05-20T10:00:00.000Z',
  summary: {
    projects: { active: 8 },
    members: { active: 24 },
    quality: { averageClientSatisfaction: 4.5 },
  },
  operations: {
    overview: {
      utilization: {
        rate: 0.72,
        benchCount: 5,
        assignments: [
          { id: 'a1', title: 'Design review', summary: 'Client A', account: 'Client A' },
        ],
      },
      clientHealth: {
        activeClients: 12,
        atRiskEngagements: 3,
        csatScore: 4.3,
        qaScore: 4.6,
      },
      alerts: [
        { referenceId: 'alert-1', title: 'Billing follow-up', message: 'Awaiting finance review' },
      ],
    },
    projectsWorkspace: {
      workspaceOrchestrator: {
        summary: { dependencies: 6 },
      },
    },
  },
};

describe('AgencyOverviewPanel', () => {
  it('renders derived metrics and passes refresh handler', async () => {
    const onRefresh = vi.fn();
    render(<AgencyOverviewPanel data={sampleData} loading={false} error={null} onRefresh={onRefresh} />);

    expect(screen.getByText(/keep delivery/i)).toBeVisible();
    expect(screen.getByText('12')).toBeVisible();
    expect(screen.getByText(/client satisfaction/i)).toBeVisible();
    expect(screen.getByText(/Billing follow-up/i)).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalled();
  });
});
