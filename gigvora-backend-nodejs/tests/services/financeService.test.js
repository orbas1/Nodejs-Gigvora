import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { appCache } from '../../src/utils/cache.js';

const financeModelMock = {
  sequelize: {
    fn: jest.fn((name, value) => ({ fn: name, value })),
    col: jest.fn((column) => ({ column })),
  },
  FINANCE_REVENUE_TYPES: ['retainer', 'one_off', 'passive', 'royalty', 'product', 'other'],
  FinanceRevenueEntry: {
    sum: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
  FinanceExpenseEntry: {
    sum: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
  },
  FinanceSavingsGoal: {
    findAll: jest.fn(),
    sum: jest.fn(),
  },
  FinancePayoutBatch: {
    findOne: jest.fn(),
  },
  FinancePayoutSplit: {
    findAll: jest.fn(),
  },
  FinanceForecastScenario: {
    findAll: jest.fn(),
  },
  FinanceTaxExport: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
};

global.__mockSequelizeModels = financeModelMock;

const { getFinanceControlTowerOverview } = await import('../../src/services/financeService.js');

function resetFinanceModelMocks() {
  Object.values(financeModelMock).forEach((entry) => {
    if (!entry) return;
    Object.values(entry).forEach((maybeFn) => {
      if (typeof maybeFn?.mockReset === 'function') {
        maybeFn.mockReset();
      }
    });
  });
}

describe('financeService.getFinanceControlTowerOverview', () => {
  beforeEach(() => {
    resetFinanceModelMocks();
    appCache.store.clear();
  });

  it('throws a validation error when the user id is invalid', async () => {
    await expect(getFinanceControlTowerOverview('abc')).rejects.toThrow('valid userId');
    await expect(getFinanceControlTowerOverview(-5)).rejects.toThrow('valid userId');
  });

  it('aggregates finance metrics, expenses, savings and exports for the control tower overview', async () => {
    financeModelMock.FinanceRevenueEntry.sum
      .mockResolvedValueOnce(10000) // monthRevenue
      .mockResolvedValueOnce(4500) // previousMonthRevenue
      .mockResolvedValueOnce(720); // fiscalYearTaxReserve

    financeModelMock.FinanceRevenueEntry.findAll
      .mockResolvedValueOnce([
        { revenueType: 'retainer', totalAmount: 7200, entryCount: 3 },
        { revenueType: 'one_off', totalAmount: 2800, entryCount: 2 },
      ])
      .mockResolvedValueOnce([
        { revenueType: 'retainer', totalAmount: 4500 },
      ]);

    financeModelMock.FinanceRevenueEntry.findOne.mockResolvedValue({
      id: 90,
      userId: 42,
      amount: 2800,
      currencyCode: 'USD',
      recognizedAt: new Date().toISOString(),
    });

    financeModelMock.FinanceExpenseEntry.sum
      .mockResolvedValueOnce(1326) // monthExpenses
      .mockResolvedValueOnce(6000); // totalExpenses90

    financeModelMock.FinanceExpenseEntry.count.mockResolvedValueOnce(2);

    financeModelMock.FinanceExpenseEntry.findAll
      .mockResolvedValueOnce([
        { category: 'software', totalAmount: 76 },
        { category: 'contractors', totalAmount: 1250 },
      ])
      .mockResolvedValueOnce([
        {
          id: 1,
          category: 'software',
          vendorName: 'Figma',
          cadence: 'monthly',
          amount: 76,
          currencyCode: 'USD',
          occurredAt: new Date().toISOString(),
          isTaxDeductible: true,
          notes: null,
          receiptUrl: null,
        },
        {
          id: 2,
          category: 'contractors',
          vendorName: 'Nova Collective',
          cadence: 'weekly',
          amount: 1250,
          currencyCode: 'USD',
          occurredAt: new Date().toISOString(),
          isTaxDeductible: true,
          notes: 'Weekly sprint support',
          receiptUrl: 'https://files.gigvora.test/receipts/contractor.pdf',
        },
      ]);

    financeModelMock.FinanceSavingsGoal.findAll.mockResolvedValueOnce([
      {
        id: 10,
        name: 'Tax reserve',
        status: 'active',
        targetAmount: 18000,
        currentAmount: 4200,
        currencyCode: 'USD',
        automationType: 'monthly_transfer',
        automationAmount: 600,
        automationCadence: 'monthly',
        isRunwayReserve: false,
        lastContributionAt: new Date().toISOString(),
      },
      {
        id: 11,
        name: 'Runway reserve',
        status: 'active',
        targetAmount: 36000,
        currentAmount: 18000,
        currencyCode: 'USD',
        automationType: 'profit_first',
        automationAmount: 1200,
        automationCadence: 'monthly',
        isRunwayReserve: true,
        lastContributionAt: new Date().toISOString(),
      },
    ]);

    financeModelMock.FinanceSavingsGoal.sum.mockResolvedValueOnce(18000);

    financeModelMock.FinancePayoutBatch.findOne.mockResolvedValue({
      id: 50,
      userId: 42,
      name: 'August revenue share',
      status: 'completed',
      totalAmount: 6400,
      currencyCode: 'USD',
      executedAt: new Date().toISOString(),
      scheduledAt: new Date().toISOString(),
    });

    financeModelMock.FinancePayoutSplit.findAll.mockResolvedValueOnce([
      {
        id: 1,
        batchId: 50,
        teammateName: 'Riley Morgan',
        teammateRole: 'Strategist',
        sharePercentage: 40,
        amount: 2560,
        currencyCode: 'USD',
        status: 'completed',
        recipientEmail: 'riley@example.com',
      },
      {
        id: 2,
        batchId: 50,
        teammateName: 'Mira Lane',
        teammateRole: 'Designer',
        sharePercentage: 25,
        amount: 1600,
        currencyCode: 'USD',
        status: 'completed',
        recipientEmail: 'mira@example.com',
      },
    ]);

    financeModelMock.FinanceForecastScenario.findAll.mockResolvedValueOnce([
      {
        id: 70,
        label: 'Conservative Q4',
        scenarioType: 'conservative',
        timeframe: 'next_quarter',
        confidence: 0.65,
        projectedAmount: 18000,
        currencyCode: 'USD',
        notes: 'Accounts for seasonal slowdown.',
        generatedAt: new Date().toISOString(),
      },
      {
        id: 71,
        label: 'Upside Q4',
        scenarioType: 'aggressive',
        timeframe: 'next_quarter',
        confidence: 0.45,
        projectedAmount: 24000,
        currencyCode: 'USD',
        notes: 'Includes two pending retainers.',
        generatedAt: new Date().toISOString(),
      },
    ]);

    const latestExport = {
      id: 80,
      exportType: 'quarterly',
      status: 'generated',
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      amount: 5100,
      currencyCode: 'USD',
      downloadUrl: 'https://downloads.gigvora.test/exports/q3-tax.csv',
      generatedAt: new Date().toISOString(),
    };

    financeModelMock.FinanceTaxExport.findOne.mockResolvedValueOnce(latestExport);
    financeModelMock.FinanceTaxExport.findAll.mockResolvedValueOnce([
      latestExport,
      {
        id: 81,
        exportType: 'annual',
        status: 'archived',
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        amount: 18400,
        currencyCode: 'USD',
        downloadUrl: 'https://downloads.gigvora.test/exports/2023-tax.csv',
        generatedAt: new Date().toISOString(),
      },
    ]);

    const overview = await getFinanceControlTowerOverview(42);

    expect(overview.summary.monthToDateRevenue.amount).toBeCloseTo(10000, 1);
    expect(overview.summary.monthToDateRevenue.changePercentage).toBeGreaterThan(0);
    expect(overview.summary.taxReadyBalance.amount).toBe(720);
    expect(overview.summary.trackedExpenses.amount).toBe(1326);
    expect(overview.summary.savingsRunway.reserveAmount).toBe(18000);
    expect(overview.revenueBreakdown).toHaveLength(2);
    expect(overview.expenseCategories).toHaveLength(2);
    expect(overview.expenses).toHaveLength(2);
    expect(overview.savingsGoals).toHaveLength(2);
    expect(overview.payoutSplits.batch?.totalAmount).toBe(6400);
    expect(overview.payoutSplits.entries).toHaveLength(2);
    expect(overview.forecasts).toHaveLength(2);
    expect(overview.taxExports).toHaveLength(2);
  });

  it('uses the cache unless forceRefresh is requested', async () => {
    financeModelMock.FinanceRevenueEntry.sum
      .mockResolvedValueOnce(4000)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    financeModelMock.FinanceRevenueEntry.findAll.mockImplementation(() => Promise.resolve([]));
    financeModelMock.FinanceRevenueEntry.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    financeModelMock.FinanceRevenueEntry.findOne.mockResolvedValue({ currencyCode: 'USD' });
    financeModelMock.FinanceExpenseEntry.sum
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    financeModelMock.FinanceExpenseEntry.count.mockResolvedValueOnce(0);
    financeModelMock.FinanceExpenseEntry.findAll.mockImplementation(() =>
      Promise.resolve([{ currencyCode: 'USD' }]),
    );
    financeModelMock.FinanceExpenseEntry.findAll
      .mockResolvedValueOnce([{ currencyCode: 'USD' }])
      .mockResolvedValueOnce([{ currencyCode: 'USD' }]);
    financeModelMock.FinanceSavingsGoal.findAll
      .mockImplementation(() => Promise.resolve([{ currencyCode: 'USD' }]))
      .mockResolvedValueOnce([{ currencyCode: 'USD' }]);
    financeModelMock.FinanceSavingsGoal.sum.mockResolvedValueOnce(0);
    financeModelMock.FinancePayoutBatch.findOne.mockResolvedValue(null);
    financeModelMock.FinanceForecastScenario.findAll
      .mockImplementation(() => Promise.resolve([{ currencyCode: 'USD' }]))
      .mockResolvedValueOnce([{ currencyCode: 'USD' }]);
    financeModelMock.FinanceTaxExport.findOne
      .mockImplementation(() => Promise.resolve(null))
      .mockResolvedValueOnce(null);
    financeModelMock.FinanceTaxExport.findAll
      .mockImplementation(() => Promise.resolve([]))
      .mockResolvedValueOnce([]);

    const initial = await getFinanceControlTowerOverview(7);
    expect(initial.summary.monthToDateRevenue.amount).toBe(4000);

    financeModelMock.FinanceRevenueEntry.sum.mockResolvedValueOnce(9000);

    const cached = await getFinanceControlTowerOverview(7);
    expect(cached.summary.monthToDateRevenue.amount).toBe(4000);

    financeModelMock.FinanceRevenueEntry.sum
      .mockResolvedValueOnce(9000)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    const refreshed = await getFinanceControlTowerOverview(7, { forceRefresh: true });
    expect(refreshed.summary.monthToDateRevenue.amount).toBe(9000);
  });
});
