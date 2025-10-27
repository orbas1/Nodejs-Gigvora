import { describe, it, expect } from '@jest/globals';
import { __testables__ } from '../../src/services/userDisputeService.js';

const { buildSummary, buildMetadata } = __testables__;

describe('userDisputeService trust summarisation', () => {
  it('buildSummary composes actionable trust analytics from dispute data', () => {
    const now = new Date();
    const openedAtPrimary = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const openedAtSecondary = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const disputes = [
      {
        id: 101,
        status: 'open',
        stage: 'mediation',
        priority: 'urgent',
        reasonCode: 'scope_disagreement',
        summary: 'Align on amended automation scope and confirm payment schedule.',
        customerDeadlineAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        providerDeadlineAt: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
        openedAt: openedAtPrimary.toISOString(),
        events: [
          {
            actorType: 'mediator',
            eventAt: new Date(openedAtPrimary.getTime() + 20 * 60 * 1000).toISOString(),
          },
          {
            actorType: 'provider',
            eventAt: new Date(openedAtPrimary.getTime() + 35 * 60 * 1000).toISOString(),
          },
        ],
        transaction: {
          netAmount: 3200,
          currencyCode: 'USD',
        },
        assignedTo: { firstName: 'Lara', lastName: 'Ops', email: 'lara.ops@gigvora.test' },
        metrics: { daysOpen: 6 },
      },
      {
        id: 102,
        status: 'awaiting_customer',
        stage: 'mediation',
        priority: 'high',
        reasonCode: 'quality_issue',
        summary: 'Customer reviewing QA adjustments before sign-off.',
        customerDeadlineAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        providerDeadlineAt: new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
        openedAt: openedAtSecondary.toISOString(),
        events: [
          {
            actorType: 'provider',
            eventAt: new Date(openedAtSecondary.getTime() + 40 * 60 * 1000).toISOString(),
          },
        ],
        transaction: {
          netAmount: 800,
          currencyCode: 'USD',
        },
        assignedTo: { firstName: 'Jamal', lastName: 'Trust', email: 'jamal.trust@gigvora.test' },
        metrics: { daysOpen: 2 },
      },
    ];

    const workflowSettings = {
      responseSlaHours: 6,
      resolutionSlaHours: 48,
      autoEscalateHours: 72,
      autoCloseHours: null,
      defaultAssigneeId: 99,
    };

    const summary = buildSummary(disputes, workflowSettings);

    expect(summary.total).toBe(2);
    expect(summary.openCount).toBe(2);
    expect(summary.awaitingCustomerAction).toBe(1);
    expect(summary.escalatedCount).toBe(2);
    expect(summary.slaBreaches).toBe(1);
    expect(summary.autoEscalationRate).toBeCloseTo(1);
    expect(summary.resolutionRate).toBe(0);
    expect(summary.averageFirstResponseMinutes).toBeGreaterThan(0);
    expect(summary.openExposure).toEqual({ amount: 4000.0, currency: 'USD' });
    expect(summary.riskAlerts[0]).toMatchObject({
      severity: 'critical',
      disputeId: 101,
      title: 'SLA window breached',
    });
    expect(summary.nextSlaReviewAt).toBe(disputes[0].customerDeadlineAt);
    expect(summary.trustScore).toBeGreaterThanOrEqual(0);
    expect(summary.trustScore).toBeLessThanOrEqual(100);
  });

  it('buildMetadata surfaces workflow settings and merged reason codes', () => {
    const metadata = buildMetadata(
      { responseSlaHours: 4, resolutionSlaHours: 36, autoEscalateHours: 48 },
      ['custom_reason', 'quality_issue'],
    );

    expect(metadata.workflow).toEqual(
      expect.objectContaining({ responseSlaHours: 4, resolutionSlaHours: 36, autoEscalateHours: 48 }),
    );
    expect(metadata.reasonCodes).toEqual(
      expect.arrayContaining([
        { value: 'custom_reason', label: 'Custom Reason' },
        { value: 'quality_issue', label: 'Quality Issue' },
      ]),
    );
    expect(metadata.actionTypes.length).toBeGreaterThan(0);
    expect(metadata.stages.map((item) => item.value)).toContain('mediation');
  });
});
