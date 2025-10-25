import { describe, expect, it } from '@jest/globals';
import {
  normalizeDeliverables,
  buildGigClassesFromDeliverables,
  deriveOrderMetrics,
  evaluateSlaAlerts,
} from '../utils/companyOrderNormalization.js';

describe('companyOrderNormalization utils', () => {
  it('normalizes deliverables and filters invalid entries', () => {
    const deliverables = normalizeDeliverables([
      { title: ' Discovery ', notes: 'Bring stakeholders', dueAt: '2024-01-01', amount: '1200', deliveryDays: '5' },
      { title: ' ', notes: 'skip me' },
      null,
    ]);

    expect(deliverables).toHaveLength(1);
    expect(deliverables[0]).toMatchObject({
      title: 'Discovery',
      notes: 'Bring stakeholders',
      amount: 1200,
      deliveryDays: 5,
      ordinal: 1,
    });
  });

  it('builds gig classes ensuring minimum package coverage', () => {
    const classes = buildGigClassesFromDeliverables(
      [
        { title: 'Discovery', amount: 600 },
        { title: 'Design sprint', amount: 900 },
      ],
      { amount: 3000, currency: 'eur' },
    );

    expect(classes).toHaveLength(3);
    expect(classes[0].name).toBe('Discovery');
    expect(classes[0].priceCurrency).toBe('EUR');
    expect(classes[2].name).toContain('Package');
  });

  it('derives metrics for open and closed orders', () => {
    const metrics = deriveOrderMetrics(
      [
        { amount: 1200, escrowHeldAmount: 200, status: 'in_delivery' },
        { amount: 800, escrowHeldAmount: 0, status: 'completed', isClosed: true },
      ],
      'USD',
    );

    expect(metrics).toMatchObject({
      totalOrders: 2,
      openOrders: 1,
      closedOrders: 1,
      valueInFlight: 1200,
      escrowHeldAmount: 200,
      currency: 'USD',
    });
  });

  it('evaluates SLA alerts and marks breaches for escalation', () => {
    const now = new Date('2024-01-10T12:00:00Z');
    const { alerts, escalations } = evaluateSlaAlerts(
      [
        { id: 1, orderNumber: 'ORD-1', vendorName: 'Atlas', status: 'in_delivery', dueAt: '2024-01-09T12:00:00Z' },
        { id: 2, orderNumber: 'ORD-2', vendorName: 'Beta', status: 'in_delivery', dueAt: '2024-01-11T12:00:00Z' },
        { id: 3, orderNumber: 'ORD-3', vendorName: 'Closed', status: 'completed', dueAt: '2024-01-01T12:00:00Z', isClosed: true },
      ],
      { now, atRiskWindowHours: 48 },
    );

    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toMatchObject({ orderId: 1, severity: 'breached' });
    expect(alerts[1]).toMatchObject({ orderId: 2, severity: 'at_risk' });
    expect(escalations).toHaveLength(1);
    expect(escalations[0].orderId).toBe(1);
  });
});
