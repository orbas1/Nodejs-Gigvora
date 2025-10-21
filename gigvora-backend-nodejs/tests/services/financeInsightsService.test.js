import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { appCache } from '../../src/utils/cache.js';
import { ValidationError, NotFoundError } from '../../src/utils/errors.js';

const financeInsightsModelMock = {
  User: {
    findByPk: jest.fn(),
  },
  FreelancerFinanceMetric: {
    findAll: jest.fn(),
  },
  FreelancerRevenueMonthly: {
    findAll: jest.fn(),
  },
  FreelancerRevenueStream: {
    findAll: jest.fn(),
  },
  FreelancerPayout: {
    findAll: jest.fn(),
  },
  FreelancerTaxEstimate: {
    findAll: jest.fn(),
  },
  FreelancerTaxFiling: {
    findAll: jest.fn(),
  },
  FreelancerDeductionSummary: {
    findAll: jest.fn(),
  },
  FreelancerProfitabilityMetric: {
    findAll: jest.fn(),
  },
  FreelancerCostBreakdown: {
    findAll: jest.fn(),
  },
  FreelancerSavingsGoal: {
    findAll: jest.fn(),
  },
  FreelancerFinanceControl: {
    findAll: jest.fn(),
  },
};

global.__mockSequelizeModels = financeInsightsModelMock;

const { getFreelancerFinanceInsights } = await import('../../src/services/financeInsightsService.js');

function resetFinanceInsightsMocks() {
  Object.values(financeInsightsModelMock).forEach((entry) => {
    Object.values(entry).forEach((maybeFn) => {
      if (typeof maybeFn?.mockReset === 'function') {
        maybeFn.mockReset();
      }
    });
  });
}

function buildMockRow(data) {
  return {
    toPublicObject: () => ({ ...data }),
  };
}

describe('financeInsightsService.getFreelancerFinanceInsights', () => {
  beforeEach(() => {
    resetFinanceInsightsMocks();
    appCache.store.clear();
  });

  it('validates the freelancer id input', async () => {
    await expect(getFreelancerFinanceInsights('abc')).rejects.toBeInstanceOf(ValidationError);
    await expect(getFreelancerFinanceInsights(-2)).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws when the freelancer profile cannot be found', async () => {
    financeInsightsModelMock.User.findByPk.mockResolvedValue({ id: 99, userType: 'agency' });
    await expect(getFreelancerFinanceInsights(99)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('builds the full insights payload with metrics, payouts, tax data and profitability', async () => {
    const freelancer = {
      id: 55,
      userType: 'freelancer',
      firstName: 'Taylor',
      lastName: 'River',
      email: 'taylor@gigvora.test',
    };
    financeInsightsModelMock.User.findByPk.mockResolvedValue(freelancer);

    const now = new Date();
    const isoMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).toISOString();

    financeInsightsModelMock.FreelancerFinanceMetric.findAll.mockResolvedValue([
      buildMockRow({
        id: 1,
        freelancerId: freelancer.id,
        metricKey: 'mrr',
        label: 'Monthly recurring revenue',
        value: 12500,
        valueUnit: 'currency',
        changeValue: 1200,
        changeUnit: 'currency',
        trend: 'up',
        caption: 'Upgraded retainers closed.',
        effectiveAt: isoMonth(now),
        updatedAt: now.toISOString(),
      }),
      buildMockRow({
        id: 2,
        freelancerId: freelancer.id,
        metricKey: 'mrr',
        label: 'Monthly recurring revenue',
        value: 11000,
        valueUnit: 'currency',
        changeValue: 900,
        changeUnit: 'currency',
        trend: 'up',
        caption: 'Baseline',
        effectiveAt: isoMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      }),
    ]);

    financeInsightsModelMock.FreelancerRevenueMonthly.findAll.mockResolvedValue([
      buildMockRow({
        id: 11,
        freelancerId: freelancer.id,
        month: isoMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        bookedAmount: 8200,
        realizedAmount: 7500,
        currencyCode: 'USD',
        updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      }),
      buildMockRow({
        id: 12,
        freelancerId: freelancer.id,
        month: isoMonth(now),
        bookedAmount: 9400,
        realizedAmount: 8900,
        currencyCode: 'USD',
        updatedAt: now.toISOString(),
      }),
    ]);

    financeInsightsModelMock.FreelancerRevenueStream.findAll.mockResolvedValue([
      buildMockRow({
        id: 21,
        freelancerId: freelancer.id,
        name: 'Retainer clients',
        sharePercent: 65,
        monthlyRecurringRevenue: 7800,
        currencyCode: 'USD',
        yoyChangePercent: 18,
        notes: 'Key accounts with 12 month contracts.',
        updatedAt: now.toISOString(),
      }),
    ]);

    financeInsightsModelMock.FreelancerPayout.findAll.mockResolvedValue([
      buildMockRow({
        id: 31,
        freelancerId: freelancer.id,
        payoutDate: isoMonth(now),
        clientName: 'Beacon Co',
        gigTitle: 'Brand platform refresh',
        amount: 4200,
        currencyCode: 'USD',
        status: 'released',
        reference: 'PAYOUT-123',
        updatedAt: now.toISOString(),
      }),
    ]);

    financeInsightsModelMock.FreelancerTaxEstimate.findAll.mockResolvedValue([
      buildMockRow({
        id: 41,
        freelancerId: freelancer.id,
        dueDate: isoMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
        amount: 3200,
        currencyCode: 'USD',
        status: 'on_track',
        notes: 'Quarterly estimate funded automatically.',
        updatedAt: now.toISOString(),
      }),
    ]);

    financeInsightsModelMock.FreelancerTaxFiling.findAll.mockResolvedValue([
      buildMockRow({
        id: 51,
        freelancerId: freelancer.id,
        name: 'State franchise tax',
        jurisdiction: 'CA',
        dueDate: isoMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
        status: 'in_progress',
        submittedAt: null,
        updatedAt: now.toISOString(),
      }),
      buildMockRow({
        id: 52,
        freelancerId: freelancer.id,
        name: 'City business tax',
        jurisdiction: 'SF',
        dueDate: isoMonth(now),
        status: 'submitted',
        submittedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }),
    ]);

    financeInsightsModelMock.FreelancerDeductionSummary.findAll.mockResolvedValue([
      buildMockRow({
        id: 61,
        freelancerId: freelancer.id,
        taxYear: now.getFullYear(),
        amount: 9800,
        currencyCode: 'USD',
        changePercentage: 12,
        notes: 'Higher retirement plan contributions.',
        updatedAt: now.toISOString(),
      }),
    ]);

    financeInsightsModelMock.FreelancerProfitabilityMetric.findAll.mockResolvedValue([
      buildMockRow({
        id: 71,
        freelancerId: freelancer.id,
        metricKey: 'net_margin',
        label: 'Net margin',
        value: 42,
        valueUnit: 'percentage',
        changeValue: 3,
        changeUnit: 'percentage',
        updatedAt: now.toISOString(),
      }),
      buildMockRow({
        id: 72,
        freelancerId: freelancer.id,
        metricKey: 'utilization',
        label: 'Utilization',
        value: 78,
        valueUnit: 'percentage',
        changeValue: 4,
        changeUnit: 'percentage',
        updatedAt: now.toISOString(),
      }),
    ]);

    financeInsightsModelMock.FreelancerCostBreakdown.findAll.mockResolvedValue([
      buildMockRow({
        id: 81,
        freelancerId: freelancer.id,
        label: 'Tools & platforms',
        percentage: 18,
        caption: 'Annual licenses & premium plug-ins',
        updatedAt: now.toISOString(),
      }),
      buildMockRow({
        id: 82,
        freelancerId: freelancer.id,
        label: 'Specialist partners',
        percentage: 27,
        caption: 'Trusted collaborators supporting large engagements',
        updatedAt: now.toISOString(),
      }),
    ]);

    financeInsightsModelMock.FreelancerSavingsGoal.findAll.mockResolvedValue([
      buildMockRow({
        id: 91,
        freelancerId: freelancer.id,
        name: 'Emergency reserve',
        targetAmount: 25000,
        currencyCode: 'USD',
        progress: 45,
        cadence: 'monthly',
        updatedAt: now.toISOString(),
      }),
      buildMockRow({
        id: 92,
        freelancerId: freelancer.id,
        name: 'Innovation lab fund',
        targetAmount: 12000,
        currencyCode: 'USD',
        progress: 30,
        cadence: 'quarterly',
        updatedAt: now.toISOString(),
      }),
    ]);

    financeInsightsModelMock.FreelancerFinanceControl.findAll.mockResolvedValue([
      buildMockRow({
        id: 101,
        freelancerId: freelancer.id,
        name: 'Automated quarterly withholding',
        description: 'Allocates 30% of recognized revenue into the tax reserve.',
        bullets: ['Synced with connected bank', 'Adjusts automatically for new invoices'],
        updatedAt: now.toISOString(),
      }),
      buildMockRow({
        id: 102,
        freelancerId: freelancer.id,
        name: 'Expense anomaly alerts',
        description: 'Flags vendor charges exceeding 25% variance week-over-week.',
        bullets: ['Notifies via email and Slack', 'Pairs with bookkeeping concierge'],
        updatedAt: now.toISOString(),
      }),
    ]);

    const insights = await getFreelancerFinanceInsights(freelancer.id);

    expect(insights.freelancer).toMatchObject({
      id: freelancer.id,
      firstName: freelancer.firstName,
      lastName: freelancer.lastName,
    });
    expect(insights.summaryMetrics).toHaveLength(1);
    expect(insights.revenueTrend.points).toHaveLength(2);
    expect(insights.revenueStreams).toHaveLength(1);
    expect(insights.payoutHistory[0]).toMatchObject({
      client: 'Beacon Co',
      amount: 4200,
      statusLabel: 'Released',
    });
    expect(insights.taxCompliance.quarterlyEstimate.statusLabel).toBe('On track');
    expect(insights.taxCompliance.filings).toHaveLength(2);
    expect(insights.taxCompliance.complianceHighlights.length).toBeGreaterThan(0);
    expect(insights.profitability.metrics).toHaveLength(2);
    expect(insights.profitability.breakdown).toHaveLength(2);
    expect(insights.profitability.savingsGoals).toHaveLength(2);
    expect(insights.controls).toHaveLength(2);
    expect(new Date(insights.lastUpdatedAt).getTime()).toBeGreaterThan(0);
  });

  it('serves cached insights for repeat requests', async () => {
    const freelancer = { id: 77, userType: 'freelancer', firstName: 'Riley', lastName: 'Morgan' };
    financeInsightsModelMock.User.findByPk.mockResolvedValue(freelancer);

    const metricRow = buildMockRow({
      id: 301,
      freelancerId: freelancer.id,
      metricKey: 'mrr',
      label: 'Monthly recurring revenue',
      value: 5000,
      valueUnit: 'currency',
      changeValue: 0,
      changeUnit: 'currency',
      trend: 'neutral',
      effectiveAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    financeInsightsModelMock.FreelancerFinanceMetric.findAll.mockResolvedValue([metricRow]);
    financeInsightsModelMock.FreelancerRevenueMonthly.findAll.mockResolvedValue([]);
    financeInsightsModelMock.FreelancerRevenueStream.findAll.mockResolvedValue([]);
    financeInsightsModelMock.FreelancerPayout.findAll.mockResolvedValue([]);
    financeInsightsModelMock.FreelancerTaxEstimate.findAll.mockResolvedValue([]);
    financeInsightsModelMock.FreelancerTaxFiling.findAll.mockResolvedValue([]);
    financeInsightsModelMock.FreelancerDeductionSummary.findAll.mockResolvedValue([]);
    financeInsightsModelMock.FreelancerProfitabilityMetric.findAll.mockResolvedValue([]);
    financeInsightsModelMock.FreelancerCostBreakdown.findAll.mockResolvedValue([]);
    financeInsightsModelMock.FreelancerSavingsGoal.findAll.mockResolvedValue([]);
    financeInsightsModelMock.FreelancerFinanceControl.findAll.mockResolvedValue([]);

    const first = await getFreelancerFinanceInsights(freelancer.id);
    expect(first.summaryMetrics[0].value).toBe(5000);

    financeInsightsModelMock.FreelancerFinanceMetric.findAll.mockResolvedValue([
      buildMockRow({ ...metricRow.toPublicObject(), value: 9000, updatedAt: new Date().toISOString() }),
    ]);

    const cached = await getFreelancerFinanceInsights(freelancer.id);
    expect(cached.summaryMetrics[0].value).toBe(5000);
    expect(financeInsightsModelMock.FreelancerFinanceMetric.findAll).toHaveBeenCalledTimes(1);
  });
});
