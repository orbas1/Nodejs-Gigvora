import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ClientPortalSummary from '../ClientPortalSummary.jsx';
import ClientPortalTimeline from '../ClientPortalTimeline.jsx';
import ClientPortalDecisionLog from '../ClientPortalDecisionLog.jsx';
import ClientPortalInsightWidgets from '../ClientPortalInsightWidgets.jsx';
import ClientPortalScopeSummary from '../ClientPortalScopeSummary.jsx';
import * as ClientPortalExports from '../index.js';

describe('Client portal summary', () => {
  it('renders health metrics for active portal', () => {
    render(
      <ClientPortalSummary
        portal={{
          status: 'active',
          healthScore: 82,
          riskLevel: 'watch',
          title: 'Acme Onboarding',
          summary: 'Guiding the client through the new talent platform.',
          project: { title: 'Talent transformation' },
          stakeholders: [
            { name: 'Jordan Blake', role: 'Sponsor' },
            { name: 'Tessa Shaw', role: 'Ops' },
          ],
        }}
        timelineSummary={{
          progressPercent: 60,
          totalCount: 5,
          completedCount: 3,
          upcomingMilestones: [
            { id: 'mile-1', title: 'Launch hiring hub', dueDate: '2024-06-01T12:00:00.000Z' },
          ],
        }}
        scopeSummary={{ completionRatio: 55, deliveredCount: 11, totalCount: 20 }}
        decisionSummary={{ lastDecisionAt: '2024-05-18T10:00:00.000Z' }}
      />,
    );

    expect(screen.getByText(/Acme Onboarding/)).toBeInTheDocument();
    expect(screen.getByText(/Health 82/)).toBeInTheDocument();
    const milestoneProgress = screen.getByText(/Milestone progress/i).closest('div');
    expect(milestoneProgress).not.toBeNull();
    expect(within(milestoneProgress).getByText(/3\/5 complete/)).toBeInTheDocument();
    expect(screen.getByText(/Talent transformation/)).toBeInTheDocument();
    expect(screen.getByText(/Jordan Blake/)).toBeInTheDocument();
  });

  it('renders an error state when loading fails', () => {
    const handleRetry = vi.fn();
    render(<ClientPortalSummary error={new Error('Network down')} onRetry={handleRetry} />);
    expect(screen.getByText(/couldn't load/iu)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});

describe('Client portal timeline', () => {
  it('renders milestones, risk summaries, and metadata', () => {
    render(
      <ClientPortalTimeline
        summary={{ totalCount: 4, completedCount: 2, overdueCount: 1, atRiskEvents: [{ id: 'r1', title: 'Security review', dueDate: '2024-05-25T12:00:00.000Z', metadata: { riskNotes: 'Awaiting approvals' } }] }}
        events={[
          {
            id: 'event-1',
            title: 'Kickoff workshop',
            status: 'completed',
            eventType: 'ritual',
            startDate: '2024-04-01T09:00:00.000Z',
            dueDate: '2024-04-01T12:00:00.000Z',
            owner: { name: 'Nina West' },
            metadata: { deliverables: ['Playbook'], dependencies: ['Stakeholder sign-off'] },
          },
        ]}
      />,
    );

    expect(screen.getByText(/Kickoff workshop/)).toBeInTheDocument();
    expect(screen.getByText(/Security review/)).toBeInTheDocument();
    expect(screen.getByText(/Playbook/)).toBeInTheDocument();
  });
});

describe('Client portal decision log', () => {
  it('lists decisions with visibility badges and metadata', () => {
    render(
      <ClientPortalDecisionLog
        decisions={{
          summary: { totalCount: 2, lastDecisionAt: '2024-05-17T18:00:00.000Z' },
          entries: [
            {
              id: 'dec-1',
              summary: 'Approved revised budget',
              decision: 'Increase design budget by 15% to support new scope.',
              impactSummary: 'Budget uplift approved by finance.',
              visibility: 'client',
              decidedAt: '2024-05-17T18:00:00.000Z',
              decidedBy: { name: 'Priya Raman' },
              category: 'budget',
              attachments: [{ url: '/files/budget.pdf', label: 'Budget doc' }],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/Approved revised budget/)).toBeInTheDocument();
    expect(screen.getByText(/Budget doc/)).toHaveAttribute('href', '/files/budget.pdf');
    expect(screen.getByText(/Priya Raman/)).toBeInTheDocument();
  });
});

describe('Client portal insight widgets', () => {
  it('renders digest details and widget cards', () => {
    render(
      <ClientPortalInsightWidgets
        insights={{
          digest: { frequency: 'weekly', recipients: ['ops@gigvora.com', 'client@example.com'] },
          widgets: [
            {
              id: 'widget-1',
              widgetType: 'health',
              title: 'Platform stability',
              description: 'Uptime, latency, and incident log summary.',
              updatedAt: '2024-05-18T08:00:00.000Z',
              data: { uptime: '99.9%', incidents: 0 },
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/Platform stability/)).toBeInTheDocument();
    expect(screen.getByText(/ops@gigvora.com/)).toBeInTheDocument();
    expect(screen.getByText(/"uptime": "99.9%"/)).toBeInTheDocument();
  });
});

describe('Client portal scope summary', () => {
  it('displays metrics and scope items with formatted values', () => {
    render(
      <ClientPortalScopeSummary
        scope={{
          summary: {
            totalCount: 3,
            committedCount: 2,
            proposedCount: 1,
            deliveredEffortHours: 120,
            totalEffortHours: 180,
            totalValueAmount: 48000,
            completionRatio: 66,
            deliveredCount: 2,
          },
          items: [
            {
              id: 'scope-1',
              title: 'Career site refresh',
              description: 'Launch localized landing pages.',
              category: 'Experience',
              status: 'in_delivery',
              effortHours: 80,
              valueAmount: 24000,
              valueCurrency: 'usd',
              lastDecisionAt: '2024-05-12T12:00:00.000Z',
              metadata: { proposalId: 'RFP-182' },
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/Career site refresh/)).toBeInTheDocument();
    expect(screen.getByText(/\$24,000/)).toBeInTheDocument();
    expect(screen.getByText(/RFP-182/)).toBeInTheDocument();
  });
});

describe('Client portal barrel exports', () => {
  it('exposes the expected components', () => {
    expect(ClientPortalExports).toMatchObject({
      ClientPortalSummary: expect.any(Function),
      ClientPortalTimeline: expect.any(Function),
      ClientPortalScopeSummary: expect.any(Function),
      ClientPortalDecisionLog: expect.any(Function),
      ClientPortalInsightWidgets: expect.any(Function),
    });
  });
});
