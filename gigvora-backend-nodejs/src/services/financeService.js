import { Op } from 'sequelize';
import {
  sequelize,
  FinanceRevenueEntry,
  FinanceExpenseEntry,
  FinanceSavingsGoal,
  FinancePayoutBatch,
  FinancePayoutSplit,
  FinanceForecastScenario,
  FinanceTaxExport,
  FINANCE_REVENUE_TYPES,
} from '../models/index.js';
import { ValidationError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const OVERVIEW_CACHE_TTL_SECONDS = 60;

function coalesceNumber(value, fallback = 0) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function percentageChange(currentValue, previousValue) {
  const current = coalesceNumber(currentValue, 0);
  const previous = coalesceNumber(previousValue, 0);
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }
    return 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function determineCurrency(...records) {
  for (const record of records) {
    if (!record) continue;
    if (Array.isArray(record)) {
      const nested = determineCurrency(...record);
      if (nested) return nested;
      continue;
    }
    const candidate = record.currencyCode ?? record.currency ?? record.currency_code;
    if (candidate && typeof candidate === 'string' && candidate.length === 3) {
      return candidate.toUpperCase();
    }
  }
  return 'USD';
}

function buildSummary({
  monthRevenue,
  previousMonthRevenue,
  fiscalYearTaxReserve,
  monthExpenses,
  monthExpenseCount,
  runwayMonths,
  runwayReserve,
  monthlyBurn,
  currencyCode,
  latestExport,
}) {
  const revenueChange = percentageChange(monthRevenue, previousMonthRevenue);
  return {
    monthToDateRevenue: {
      amount: coalesceNumber(monthRevenue),
      previousAmount: coalesceNumber(previousMonthRevenue),
      changePercentage: revenueChange,
      currency: currencyCode,
    },
    taxReadyBalance: {
      amount: coalesceNumber(fiscalYearTaxReserve),
      currency: currencyCode,
      fiscalYear: new Date().getFullYear(),
      latestExport: latestExport
        ? {
            id: latestExport.id,
            exportType: latestExport.exportType,
            status: latestExport.status,
            generatedAt: latestExport.generatedAt,
            downloadUrl: latestExport.downloadUrl,
            amount: coalesceNumber(latestExport.amount),
          }
        : null,
    },
    trackedExpenses: {
      amount: coalesceNumber(monthExpenses),
      count: coalesceNumber(monthExpenseCount),
      currency: currencyCode,
    },
    savingsRunway: {
      months: runwayMonths == null ? null : Number.parseFloat(runwayMonths.toFixed(2)),
      reserveAmount: coalesceNumber(runwayReserve),
      monthlyBurn: monthlyBurn == null ? null : Number.parseFloat(monthlyBurn.toFixed(2)),
      currency: currencyCode,
    },
  };
}

function normalizeRevenueBreakdown(rows, previousMap, totalAmount, currency) {
  if (!rows.length) {
    return FINANCE_REVENUE_TYPES.map((type) => ({
      type,
      label: type,
      amount: 0,
      share: 0,
      changePercentage: 0,
      currency,
    }));
  }
  const safeTotal = totalAmount > 0 ? totalAmount : rows.reduce((sum, entry) => sum + coalesceNumber(entry.totalAmount), 0);
  return rows.map((row) => {
    const current = coalesceNumber(row.totalAmount);
    const previous = coalesceNumber(previousMap.get(row.revenueType));
    return {
      type: row.revenueType,
      label: row.revenueType,
      amount: current,
      share: safeTotal > 0 ? current / safeTotal : 0,
      changePercentage: percentageChange(current, previous),
      currency,
      entryCount: Number(row.entryCount || 0),
    };
  });
}

function normalizeExpenses(expenses, currency) {
  return expenses.map((expense) => ({
    id: expense.id,
    category: expense.category,
    vendorName: expense.vendorName,
    cadence: expense.cadence,
    amount: coalesceNumber(expense.amount),
    currency,
    occurredAt: expense.occurredAt,
    isTaxDeductible: expense.isTaxDeductible,
    notes: expense.notes,
    receiptUrl: expense.receiptUrl,
  }));
}

function normalizeSavingsGoals(goals, currency) {
  return goals.map((goal) => {
    const target = coalesceNumber(goal.targetAmount);
    const current = coalesceNumber(goal.currentAmount);
    return {
      id: goal.id,
      name: goal.name,
      status: goal.status,
      targetAmount: target,
      currentAmount: current,
      currency: goal.currencyCode || currency,
      automationType: goal.automationType,
      automationAmount: goal.automationAmount == null ? null : coalesceNumber(goal.automationAmount),
      automationCadence: goal.automationCadence,
      isRunwayReserve: goal.isRunwayReserve,
      lastContributionAt: goal.lastContributionAt,
      progress: target > 0 ? Math.min((current / target) * 100, 100) : 0,
    };
  });
}

function normalizePayoutSplits(batch, splits, currency) {
  if (!batch) {
    return { batch: null, entries: [] };
  }
  return {
    batch: {
      id: batch.id,
      name: batch.name,
      status: batch.status,
      totalAmount: coalesceNumber(batch.totalAmount),
      currency: batch.currencyCode || currency,
      executedAt: batch.executedAt,
      scheduledAt: batch.scheduledAt,
    },
    entries: splits.map((split) => ({
      id: split.id,
      teammateName: split.teammateName,
      teammateRole: split.teammateRole,
      sharePercentage: split.sharePercentage == null ? null : coalesceNumber(split.sharePercentage),
      amount: coalesceNumber(split.amount),
      currency: split.currencyCode || currency,
      status: split.status,
      recipientEmail: split.recipientEmail,
    })),
  };
}

function normalizeForecasts(forecasts, currency) {
  return forecasts.map((forecast) => ({
    id: forecast.id,
    label: forecast.label,
    scenarioType: forecast.scenarioType,
    timeframe: forecast.timeframe,
    confidence: forecast.confidence == null ? null : coalesceNumber(forecast.confidence),
    projectedAmount: coalesceNumber(forecast.projectedAmount),
    currency: forecast.currencyCode || currency,
    notes: forecast.notes,
    generatedAt: forecast.generatedAt,
  }));
}

function normalizeTaxExports(exportsList, currency) {
  return exportsList.map((exportRow) => ({
    id: exportRow.id,
    exportType: exportRow.exportType,
    status: exportRow.status,
    periodStart: exportRow.periodStart,
    periodEnd: exportRow.periodEnd,
    amount: coalesceNumber(exportRow.amount),
    currency: exportRow.currencyCode || currency,
    downloadUrl: exportRow.downloadUrl,
    generatedAt: exportRow.generatedAt,
  }));
}

async function computeOverview(userId, { dateFrom, dateTo } = {}) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const fiscalYearStart = new Date(now.getFullYear(), 0, 1);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const revenueWhere = { userId };
  if (dateFrom || dateTo) {
    revenueWhere.recognizedAt = {};
    if (dateFrom) revenueWhere.recognizedAt[Op.gte] = dateFrom;
    if (dateTo) revenueWhere.recognizedAt[Op.lte] = dateTo;
  }

  const [
    monthRevenue,
    previousMonthRevenue,
    revenueBreakdownCurrent,
    revenueBreakdownPrevious,
    latestRevenueEntry,
    fiscalYearTaxReserve,
    monthExpenses,
    monthExpenseCount,
    expenseCategoryBreakdown,
    recentExpenses,
    savingsGoals,
    runwayReserve,
    totalExpenses90,
    latestPayoutBatch,
    forecasts,
    latestExport,
    taxExports,
  ] = await Promise.all([
    FinanceRevenueEntry.sum('amount', {
      where: {
        ...revenueWhere,
        status: 'recognized',
        recognizedAt: { [Op.gte]: monthStart },
      },
    }),
    FinanceRevenueEntry.sum('amount', {
      where: {
        userId,
        status: 'recognized',
        recognizedAt: { [Op.between]: [prevMonthStart, prevMonthEnd] },
      },
    }),
    FinanceRevenueEntry.findAll({
      attributes: [
        'revenueType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'entryCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      ],
      where: { userId, status: 'recognized', recognizedAt: { [Op.gte]: monthStart } },
      group: ['revenueType'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
      raw: true,
    }),
    FinanceRevenueEntry.findAll({
      attributes: [
        'revenueType',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      ],
      where: { userId, status: 'recognized', recognizedAt: { [Op.between]: [prevMonthStart, prevMonthEnd] } },
      group: ['revenueType'],
      raw: true,
    }),
    FinanceRevenueEntry.findOne({ where: { userId }, order: [['recognizedAt', 'DESC']], raw: true }),
    FinanceRevenueEntry.sum('taxWithholdingAmount', {
      where: { userId, status: 'recognized', recognizedAt: { [Op.gte]: fiscalYearStart } },
    }),
    FinanceExpenseEntry.sum('amount', {
      where: { userId, status: 'posted', occurredAt: { [Op.gte]: monthStart } },
    }),
    FinanceExpenseEntry.count({ where: { userId, status: 'posted', occurredAt: { [Op.gte]: monthStart } } }),
    FinanceExpenseEntry.findAll({
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      ],
      where: { userId, status: 'posted', occurredAt: { [Op.gte]: monthStart } },
      group: ['category'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
      limit: 6,
      raw: true,
    }),
    FinanceExpenseEntry.findAll({
      where: { userId, status: 'posted' },
      order: [['occurredAt', 'DESC']],
      limit: 6,
      raw: true,
    }),
    FinanceSavingsGoal.findAll({ where: { userId }, order: [['createdAt', 'ASC']], raw: true }),
    FinanceSavingsGoal.sum('currentAmount', { where: { userId, isRunwayReserve: true } }),
    FinanceExpenseEntry.sum('amount', {
      where: { userId, status: 'posted', occurredAt: { [Op.gte]: ninetyDaysAgo } },
    }),
    FinancePayoutBatch.findOne({
      where: { userId, status: 'completed' },
      order: [
        ['executedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      raw: true,
    }),
    FinanceForecastScenario.findAll({
      where: { userId },
      order: [['generatedAt', 'DESC']],
      limit: 6,
      raw: true,
    }),
    FinanceTaxExport.findOne({
      where: { userId, status: { [Op.ne]: 'archived' } },
      order: [['generatedAt', 'DESC']],
      raw: true,
    }),
    FinanceTaxExport.findAll({
      where: { userId },
      order: [['generatedAt', 'DESC']],
      limit: 5,
      raw: true,
    }),
  ]);

  const payoutSplits = latestPayoutBatch
    ? await FinancePayoutSplit.findAll({
        where: { batchId: latestPayoutBatch.id },
        order: [['amount', 'DESC']],
        raw: true,
      })
    : [];

  const currencyCode = determineCurrency(
    latestRevenueEntry,
    recentExpenses[0],
    savingsGoals[0],
    latestPayoutBatch,
    payoutSplits[0],
    forecasts[0],
    latestExport,
  );

  const previousMap = new Map(revenueBreakdownPrevious.map((row) => [row.revenueType, row.totalAmount]));
  const revenueBreakdown = normalizeRevenueBreakdown(
    revenueBreakdownCurrent.map((row) => ({
      revenueType: row.revenueType,
      totalAmount: row.totalAmount,
      entryCount: row.entryCount,
    })),
    previousMap,
    coalesceNumber(monthRevenue),
    currencyCode,
  );

  const expenses = normalizeExpenses(recentExpenses, currencyCode);
  const savings = normalizeSavingsGoals(savingsGoals, currencyCode);
  const payout = normalizePayoutSplits(latestPayoutBatch, payoutSplits, currencyCode);
  const forecastList = normalizeForecasts(forecasts, currencyCode);
  const exportsList = normalizeTaxExports(taxExports, currencyCode);

  const monthlyBurn = totalExpenses90 ? coalesceNumber(totalExpenses90) / 3 : null;
  const runwayMonths = monthlyBurn && monthlyBurn > 0 ? coalesceNumber(runwayReserve) / monthlyBurn : null;

  return {
    summary: buildSummary({
      monthRevenue: coalesceNumber(monthRevenue),
      previousMonthRevenue: coalesceNumber(previousMonthRevenue),
      fiscalYearTaxReserve: coalesceNumber(fiscalYearTaxReserve),
      monthExpenses: coalesceNumber(monthExpenses),
      monthExpenseCount,
      runwayMonths,
      runwayReserve: coalesceNumber(runwayReserve),
      monthlyBurn,
      currencyCode,
      latestExport,
    }),
    revenueBreakdown,
    expenses,
    expenseCategories: expenseCategoryBreakdown.map((row) => ({
      category: row.category,
      amount: coalesceNumber(row.totalAmount),
      currency: currencyCode,
    })),
    savingsGoals: savings,
    payoutSplits: payout,
    forecasts: forecastList,
    taxExports: exportsList,
    generatedAt: new Date(),
  };
}

export async function getFinanceControlTowerOverview(userId, options = {}) {
  const resolvedUserId = Number.parseInt(userId, 10);
  if (!Number.isFinite(resolvedUserId) || resolvedUserId <= 0) {
    throw new ValidationError('A valid userId is required to load the finance control tower overview.');
  }

  const dateFrom = parseDate(options.dateFrom);
  const dateTo = parseDate(options.dateTo);
  const forceRefresh = Boolean(options.forceRefresh);

  if (forceRefresh) {
    const result = await computeOverview(resolvedUserId, { dateFrom, dateTo });
    return result;
  }

  const cacheKey = buildCacheKey(`finance:controlTower:${resolvedUserId}`, {
    dateFrom: dateFrom ? dateFrom.toISOString() : null,
    dateTo: dateTo ? dateTo.toISOString() : null,
  });

  return appCache.remember(cacheKey, OVERVIEW_CACHE_TTL_SECONDS, () =>
    computeOverview(resolvedUserId, { dateFrom, dateTo }),
  );
}

export default {
  getFinanceControlTowerOverview,
};
