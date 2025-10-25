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
  EscrowAccount,
  EscrowTransaction,
  DisputeCase,
  ComplianceObligation,
  ComplianceDocument,
  FINANCE_REVENUE_TYPES,
} from '../models/index.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';
import { assertDependenciesHealthy } from '../utils/dependencyGate.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { appendDisputeEvent, releaseEscrowTransaction } from './trustService.js';

const OVERVIEW_CACHE_TTL_SECONDS = 60;
const FINANCE_DEPENDENCIES = ['database', 'paymentsCore'];

function guardFinance(feature) {
  assertDependenciesHealthy(FINANCE_DEPENDENCIES, { feature });
}

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
  inEscrowTotal,
  pendingReleaseTotal,
  disputeHoldTotal,
  releasedThisWeekTotal,
  netCashflowSevenDay,
  forecastThirtyDay,
}) {
  const revenueChange = percentageChange(monthRevenue, previousMonthRevenue);
  return {
    currency: currencyCode,
    inEscrow: coalesceNumber(inEscrowTotal),
    pendingRelease: coalesceNumber(pendingReleaseTotal),
    disputeHold: coalesceNumber(disputeHoldTotal),
    releasedThisWeek: coalesceNumber(releasedThisWeekTotal),
    netCashFlow7d: coalesceNumber(netCashflowSevenDay),
    forecast30d: coalesceNumber(forecastThirtyDay),
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

function safeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  if (typeof value === 'object') {
    return Object.values(value);
  }
  return [];
}

function normaliseStringArray(value) {
  return safeArray(value)
    .map((entry) => (entry == null ? '' : String(entry)))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function deriveAutomationTag(record) {
  const metadata = record?.metadata ?? {};
  const explicitTag =
    metadata.automationTag ??
    metadata.releaseMode ??
    metadata.automation ??
    metadata.policy ??
    metadata.policyType ??
    (metadata.autoRelease === true ? 'auto_release' : null);

  if (explicitTag) {
    return String(explicitTag).toLowerCase();
  }

  if (metadata.manualReview === true || metadata.requiresEvidence === true) {
    return 'manual_review';
  }

  const auditTrail = safeArray(record?.auditTrail);
  if (auditTrail.some((entry) => String(entry?.action ?? '').toLowerCase().includes('manual'))) {
    return 'manual_review';
  }

  return 'auto_release';
}

function deriveRiskLevel(record, disputeMap) {
  const metadata = record?.metadata ?? {};
  if (metadata.risk) {
    return String(metadata.risk).toLowerCase();
  }
  if (metadata.health) {
    return String(metadata.health).toLowerCase();
  }
  if (metadata.requiresEvidence === true) {
    return 'attention';
  }
  if (record?.status === 'disputed' || disputeMap?.has(record?.id)) {
    return 'attention';
  }
  return 'on_track';
}

function recordRequiresEvidence(record, disputeMap) {
  const metadata = record?.metadata ?? {};
  if (metadata.requiresEvidence === true || metadata.needsEvidence === true) {
    return true;
  }
  return disputeMap?.has(record?.id) ?? false;
}

function normaliseAccounts(records) {
  return records.map((account) => {
    const metadata = account.metadata ?? {};
    return {
      id: account.externalId ? String(account.externalId) : `account-${account.id}`,
      name: metadata.label ?? metadata.name ?? `${account.provider ?? 'Escrow'} account`,
      institution: metadata.institution ?? metadata.bank ?? account.provider ?? 'Escrow partner',
      balance: coalesceNumber(account.currentBalance),
      currency: (account.currencyCode ?? 'USD').toUpperCase(),
      safeguarding: coalesceNumber(
        metadata.safeguardingBalance ?? metadata.safeguarded ?? account.pendingReleaseTotal,
      ),
      pendingTransfers: coalesceNumber(metadata.pendingTransfers ?? account.pendingReleaseTotal),
      status: (account.status ?? 'pending').toLowerCase(),
      lastReconciledAt: account.lastReconciledAt ?? null,
    };
  });
}

function buildAutomationSignals(transactions, disputeIds = new Set()) {
  if (!transactions.length) {
    return {
      autoReleaseRate: 0,
      manualReviewRate: 0,
      disputeRate: 0,
      averageClearanceHours: 0,
      flaggedTransactions: 0,
    };
  }

  let autoCount = 0;
  let manualCount = 0;
  let disputeCount = 0;
  let flaggedCount = 0;
  let clearanceSamples = 0;
  let clearanceTotal = 0;

  transactions.forEach((transaction) => {
    const automationTag = deriveAutomationTag(transaction);
    if (automationTag.includes('manual')) {
      manualCount += 1;
    } else {
      autoCount += 1;
    }

    const hasDispute = transaction.status === 'disputed' || disputeIds.has(transaction.id);
    if (hasDispute) {
      disputeCount += 1;
    }

    const metadata = transaction.metadata ?? {};
    const flagged =
      hasDispute ||
      metadata.requiresEvidence === true ||
      (metadata.risk && String(metadata.risk).toLowerCase() !== 'on_track');
    if (flagged) {
      flaggedCount += 1;
    }

    const createdAt = transaction.createdAt ?? transaction.initiatedAt ?? null;
    const releasedAt = transaction.releasedAt ?? null;
    if (createdAt && releasedAt) {
      const created = new Date(createdAt).getTime();
      const released = new Date(releasedAt).getTime();
      if (!Number.isNaN(created) && !Number.isNaN(released) && released >= created) {
        clearanceSamples += 1;
        clearanceTotal += (released - created) / (1000 * 60 * 60);
      }
    }
  });

  const total = autoCount + manualCount;
  return {
    autoReleaseRate: total === 0 ? 0 : (autoCount / total) * 100,
    manualReviewRate: total === 0 ? 0 : (manualCount / total) * 100,
    disputeRate: transactions.length === 0 ? 0 : (disputeCount / transactions.length) * 100,
    averageClearanceHours: clearanceSamples === 0 ? 0 : clearanceTotal / clearanceSamples,
    flaggedTransactions: flaggedCount,
  };
}

function buildReleaseQueue(records, disputeMap = new Map()) {
  return records.map((record) => {
    const metadata = record.metadata ?? {};
    return {
      id: String(record.id ?? record.reference ?? `release-${Math.random().toString(36).slice(2, 10)}`),
      reference: record.reference ?? `escrow-${record.id}`,
      vendor:
        metadata.vendorName ??
        metadata.counterpartyName ??
        metadata.customer ??
        metadata.client ??
        'Counterparty',
      milestone: record.milestoneLabel ?? metadata.milestone ?? metadata.phase ?? 'Milestone',
      amount: coalesceNumber(record.netAmount ?? record.amount),
      currency: (record.currencyCode ?? 'USD').toUpperCase(),
      automation: deriveAutomationTag(record),
      risk: deriveRiskLevel(record, disputeMap),
      requiresEvidence: recordRequiresEvidence(record, disputeMap),
      scheduledAt: record.scheduledReleaseAt ?? null,
    };
  });
}

function buildDisputeQueue(records) {
  return records.map((record) => {
    const metadata = record.metadata ?? {};
    const transaction = record.transaction ?? {};
    const transactionMetadata = transaction.metadata ?? {};
    const counterparty =
      metadata.counterpartyName ??
      transactionMetadata.counterpartyName ??
      transactionMetadata.customer ??
      transactionMetadata.client ??
      'Counterparty';

    return {
      id: String(record.id),
      transactionId: transaction.id ?? record.escrowTransactionId,
      orderId: metadata.orderId ?? transactionMetadata.orderId ?? null,
      reason: metadata.reason ?? record.reasonCode,
      stage: record.stage,
      priority: record.priority,
      status: record.status,
      summary: record.summary,
      openedAt: record.openedAt,
      updatedAt: record.updatedAt,
      amount: coalesceNumber(transaction.netAmount ?? transaction.amount),
      currencyCode: (transaction.currencyCode ?? 'USD').toUpperCase(),
      customer: counterparty,
    };
  });
}

function buildComplianceTasks(obligations, { userId }) {
  return obligations.map((obligation) => {
    const document = obligation.document ?? {};
    const metadata = obligation.metadata ?? {};
    const documentMetadata = document.metadata ?? {};
    const ownerName =
      metadata.ownerName ??
      documentMetadata.ownerName ??
      (obligation.assigneeId === userId ? 'You' : documentMetadata.team ?? 'Finance operations');

    const tags = Array.from(
      new Set([
        ...normaliseStringArray(metadata.tags),
        ...normaliseStringArray(document.tags),
        ...normaliseStringArray(documentMetadata.tags),
      ]),
    );

    return {
      id: String(obligation.id),
      title: metadata.title ?? document.title ?? obligation.description ?? 'Compliance task',
      owner: ownerName,
      severity: (metadata.severity ?? obligation.priority ?? 'medium').toString().toLowerCase(),
      status: (obligation.status ?? 'open').toLowerCase(),
      tags,
      dueDate: obligation.dueAt ?? null,
    };
  });
}

function buildCashflowBuckets({
  trailingRevenue,
  trailingExpenses,
  upcomingInflow,
  upcomingOutflow,
  forecastInflow,
  forecastOutflow,
}) {
  return [
    {
      id: 'trailing_7d',
      label: 'Trailing 7 days',
      inflow: coalesceNumber(trailingRevenue),
      outflow: coalesceNumber(trailingExpenses),
      net: coalesceNumber(trailingRevenue) - coalesceNumber(trailingExpenses),
    },
    {
      id: 'upcoming_7d',
      label: 'Upcoming 7 days',
      inflow: coalesceNumber(upcomingInflow),
      outflow: coalesceNumber(upcomingOutflow),
      net: coalesceNumber(upcomingInflow) - coalesceNumber(upcomingOutflow),
    },
    {
      id: 'outlook_30d',
      label: '30-day outlook',
      inflow: coalesceNumber(forecastInflow),
      outflow: coalesceNumber(forecastOutflow),
      net: coalesceNumber(forecastInflow) - coalesceNumber(forecastOutflow),
    },
  ];
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
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nextSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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

  const accounts = await EscrowAccount.findAll({
    where: { userId },
    order: [['currentBalance', 'DESC']],
    raw: true,
  });
  const accountIds = accounts.map((account) => account.id);

  let releaseQueueRaw = [];
  let automationSampleRaw = [];
  let disputeCasesRaw = [];
  let complianceCandidatesRaw = [];
  let trailingRevenue7d = 0;
  let trailingExpenses7d = 0;
  let upcomingRevenue7d = 0;
  let releasedLast7d = 0;
  let upcomingReleaseTotal7d = 0;
  let upcomingPayoutTotal7d = 0;

  if (accountIds.length) {
    const [
      releaseQueueResult,
      automationSampleResult,
      disputeCaseResult,
      trailingRevenueResult,
      trailingExpenseResult,
      upcomingRevenueResult,
      releasedLastResult,
      upcomingReleasesResult,
      upcomingPayoutsResult,
      complianceResult,
    ] = await Promise.all([
      EscrowTransaction.findAll({
        where: {
          accountId: { [Op.in]: accountIds },
          status: { [Op.in]: ['in_escrow', 'funded', 'disputed'] },
        },
        order: [
          ['scheduledReleaseAt', 'ASC'],
          ['createdAt', 'DESC'],
        ],
        limit: 25,
        raw: true,
      }),
      EscrowTransaction.findAll({
        where: {
          accountId: { [Op.in]: accountIds },
          createdAt: { [Op.gte]: ninetyDaysAgo },
        },
        order: [['createdAt', 'DESC']],
        limit: 80,
        raw: true,
      }),
      DisputeCase.findAll({
        where: { status: { [Op.in]: ['open', 'awaiting_customer', 'under_review'] } },
        include: [
          {
            model: EscrowTransaction,
            as: 'transaction',
            required: true,
            where: { accountId: { [Op.in]: accountIds } },
            attributes: [
              'id',
              'reference',
              'amount',
              'netAmount',
              'currencyCode',
              'scheduledReleaseAt',
              'releasedAt',
              'status',
              'metadata',
              'auditTrail',
              'createdAt',
            ],
          },
        ],
        order: [['updatedAt', 'DESC']],
        limit: 20,
      }),
      FinanceRevenueEntry.sum('amount', {
        where: { userId, status: 'recognized', recognizedAt: { [Op.gte]: sevenDaysAgo } },
      }),
      FinanceExpenseEntry.sum('amount', {
        where: { userId, status: 'posted', occurredAt: { [Op.gte]: sevenDaysAgo } },
      }),
      FinanceRevenueEntry.sum('amount', {
        where: { userId, status: 'recognized', recognizedAt: { [Op.between]: [now, nextSevenDays] } },
      }),
      EscrowTransaction.sum('netAmount', {
        where: {
          accountId: { [Op.in]: accountIds },
          status: 'released',
          releasedAt: { [Op.gte]: sevenDaysAgo },
        },
      }),
      EscrowTransaction.findAll({
        where: {
          accountId: { [Op.in]: accountIds },
          status: { [Op.in]: ['in_escrow', 'funded'] },
          scheduledReleaseAt: { [Op.between]: [now, nextSevenDays] },
        },
        attributes: ['netAmount'],
        raw: true,
      }),
      FinancePayoutBatch.findAll({
        where: {
          userId,
          status: { [Op.in]: ['scheduled', 'processing'] },
          scheduledAt: { [Op.between]: [now, nextSevenDays] },
        },
        raw: true,
      }),
      ComplianceObligation.findAll({
        where: { status: { [Op.notIn]: ['satisfied', 'waived'] } },
        include: [
          {
            model: ComplianceDocument,
            as: 'document',
            required: false,
          },
        ],
        order: [
          ['dueAt', 'ASC'],
          ['createdAt', 'DESC'],
        ],
        limit: 40,
      }),
    ]);

    releaseQueueRaw = releaseQueueResult;
    automationSampleRaw = automationSampleResult;
    disputeCasesRaw = disputeCaseResult;
    trailingRevenue7d = coalesceNumber(trailingRevenueResult);
    trailingExpenses7d = coalesceNumber(trailingExpenseResult);
    upcomingRevenue7d = coalesceNumber(upcomingRevenueResult);
    releasedLast7d = coalesceNumber(releasedLastResult);
    upcomingReleaseTotal7d = upcomingReleasesResult.reduce(
      (sum, row) => sum + coalesceNumber(row.netAmount),
      0,
    );
    upcomingPayoutTotal7d = upcomingPayoutsResult.reduce(
      (sum, row) => sum + coalesceNumber(row.totalAmount),
      0,
    );
    complianceCandidatesRaw = complianceResult;
  }

  const currencyCode = determineCurrency(
    latestRevenueEntry,
    recentExpenses[0],
    savingsGoals[0],
    latestPayoutBatch,
    payoutSplits[0],
    forecasts[0],
    latestExport,
    accounts[0],
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

  const disputeMap = new Map(disputeCasesRaw.map((record) => [record.escrowTransactionId, record]));
  const automationSampleSet = new Map();
  automationSampleRaw.forEach((record) => {
    automationSampleSet.set(record.id, record);
  });
  releaseQueueRaw.forEach((record) => {
    if (!automationSampleSet.has(record.id)) {
      automationSampleSet.set(record.id, record);
    }
  });

  const automationSignals = buildAutomationSignals(
    Array.from(automationSampleSet.values()),
    new Set(disputeMap.keys()),
  );

  const accountsView = normaliseAccounts(accounts);
  const releaseQueue = buildReleaseQueue(releaseQueueRaw, disputeMap);
  const disputes = buildDisputeQueue(disputeCasesRaw);

  const relevantCompliance = complianceCandidatesRaw
    .filter((obligation) => {
      if (obligation.assigneeId && obligation.assigneeId === userId) {
        return true;
      }
      const document = obligation.document ?? {};
      if (document.ownerId === userId) {
        return true;
      }
      const tags = [
        ...normaliseStringArray(obligation.metadata?.tags),
        ...normaliseStringArray(document.tags),
        ...normaliseStringArray(document.metadata?.tags),
      ].map((tag) => tag.toLowerCase());
      return tags.some((tag) =>
        ['finance', 'escrow', 'tax', 'audit', 'compliance'].some((needle) => tag.includes(needle)),
      );
    })
    .slice(0, 12);
  const complianceTasks = buildComplianceTasks(relevantCompliance, { userId });

  const totalInEscrow = accounts.reduce(
    (sum, account) => sum + coalesceNumber(account.currentBalance),
    0,
  );
  const totalPendingRelease = accounts.reduce(
    (sum, account) => sum + coalesceNumber(account.pendingReleaseTotal),
    0,
  );
  const disputeHold = disputeCasesRaw.reduce(
    (sum, record) => sum + coalesceNumber(record.transaction?.netAmount ?? record.transaction?.amount),
    0,
  );

  const forecastThirtyDay = forecastList.reduce((sum, scenario) => {
    const timeframe = (scenario.timeframe ?? '').toLowerCase();
    if (!scenario.projectedAmount) {
      return sum;
    }
    if (timeframe.includes('30')) {
      return sum + coalesceNumber(scenario.projectedAmount);
    }
    if (timeframe.includes('90')) {
      return sum + coalesceNumber(scenario.projectedAmount) / 3;
    }
    if (timeframe.includes('month')) {
      return sum + coalesceNumber(scenario.projectedAmount);
    }
    return sum;
  }, 0);

  const forecastOutflowThirty = monthlyBurn ?? coalesceNumber(monthExpenses);
  const upcomingInflowSeven = upcomingRevenue7d || forecastThirtyDay / 4;
  const cashflow = buildCashflowBuckets({
    trailingRevenue: trailingRevenue7d,
    trailingExpenses: trailingExpenses7d,
    upcomingInflow: upcomingInflowSeven,
    upcomingOutflow: upcomingReleaseTotal7d + upcomingPayoutTotal7d,
    forecastInflow: forecastThirtyDay || coalesceNumber(monthRevenue),
    forecastOutflow: forecastOutflowThirty,
  });

  const summary = buildSummary({
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
    inEscrowTotal: totalInEscrow,
    pendingReleaseTotal: totalPendingRelease,
    disputeHoldTotal: disputeHold,
    releasedThisWeekTotal: releasedLast7d,
    netCashflowSevenDay: trailingRevenue7d - trailingExpenses7d,
    forecastThirtyDay: forecastThirtyDay || coalesceNumber(monthRevenue),
  });

  return {
    summary,
    automation: automationSignals,
    accounts: accountsView,
    releaseQueue,
    disputeQueue: disputes,
    complianceTasks,
    cashflow,
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

  guardFinance('Finance control tower overview');

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

export async function recordFinanceReleaseAction(userId, releaseId, { action, note } = {}) {
  const resolvedUserId = Number.parseInt(userId, 10);
  const resolvedReleaseId = Number.parseInt(releaseId, 10);

  if (!Number.isFinite(resolvedUserId) || resolvedUserId <= 0) {
    throw new ValidationError('A valid userId is required to record a release action.');
  }
  if (!Number.isFinite(resolvedReleaseId) || resolvedReleaseId <= 0) {
    throw new ValidationError('A valid releaseId is required.');
  }

  const normalizedAction = String(action ?? '').toLowerCase();
  if (!normalizedAction) {
    throw new ValidationError('An action is required.');
  }

  return sequelize.transaction(async (trx) => {
    const transactionRecord = await EscrowTransaction.findByPk(resolvedReleaseId, {
      include: [
        {
          model: EscrowAccount,
          as: 'account',
          attributes: ['id', 'userId'],
        },
      ],
      lock: trx.LOCK.UPDATE,
      transaction: trx,
    });

    if (!transactionRecord) {
      throw new NotFoundError('Finance release not found.');
    }

    if (transactionRecord.account?.userId !== resolvedUserId) {
      throw new AuthorizationError('You do not have access to this release.');
    }

    if (normalizedAction === 'manual_release') {
      return releaseEscrowTransaction(
        resolvedReleaseId,
        {
          actorId: resolvedUserId,
          notes: note ?? 'Manual release executed from finance control tower.',
          metadata: { source: 'mobile_finance_control_tower' },
        },
        { transaction: trx },
      );
    }

    if (normalizedAction === 'evidence_requested') {
      const metadata = { ...(transactionRecord.metadata ?? {}) };
      const auditTrail = Array.isArray(transactionRecord.auditTrail)
        ? [...transactionRecord.auditTrail]
        : [];

      metadata.requiresEvidence = true;
      metadata.lastEvidenceRequestAt = new Date().toISOString();
      if (note) {
        metadata.evidenceRequestNote = note;
      }

      auditTrail.push({
        action: 'evidence_requested',
        actorId: resolvedUserId,
        notes: note ?? null,
        at: new Date().toISOString(),
        metadata: { source: 'mobile_finance_control_tower' },
      });

      await transactionRecord.update(
        {
          metadata,
          auditTrail,
        },
        { transaction: trx },
      );

      return transactionRecord.toPublicObject();
    }

    throw new ValidationError(`Unsupported finance release action: ${normalizedAction}.`);
  });
}

export async function recordFinanceDisputeAction(userId, disputeId, { action, note } = {}) {
  const resolvedUserId = Number.parseInt(userId, 10);
  const resolvedDisputeId = Number.parseInt(disputeId, 10);

  if (!Number.isFinite(resolvedUserId) || resolvedUserId <= 0) {
    throw new ValidationError('A valid userId is required to record a dispute action.');
  }
  if (!Number.isFinite(resolvedDisputeId) || resolvedDisputeId <= 0) {
    throw new ValidationError('A valid disputeId is required.');
  }

  const dispute = await DisputeCase.findByPk(resolvedDisputeId, {
    include: [
      {
        model: EscrowTransaction,
        as: 'transaction',
        include: [
          {
            model: EscrowAccount,
            as: 'account',
            attributes: ['userId'],
          },
        ],
      },
    ],
  });

  if (!dispute) {
    throw new NotFoundError('Dispute case not found.');
  }

  if (dispute.transaction?.account?.userId !== resolvedUserId) {
    throw new AuthorizationError('You do not have access to this dispute.');
  }

  const normalizedAction = String(action ?? '').toLowerCase();
  const payload = {
    actorId: resolvedUserId,
    actorType: 'admin',
    notes: note ?? null,
    metadata: { source: 'mobile_finance_control_tower', action: normalizedAction },
  };

  if (normalizedAction === 'escalate') {
    payload.actionType = 'stage_advanced';
    payload.stage = 'arbitration';
    payload.status = 'under_review';
  } else if (normalizedAction === 'add_evidence') {
    payload.actionType = 'comment';
  } else {
    throw new ValidationError(`Unsupported dispute action: ${normalizedAction}.`);
  }

  const result = await appendDisputeEvent(resolvedDisputeId, payload);
  return result.dispute;
}

export async function recordFinanceComplianceAction(userId, obligationId, { action, note } = {}) {
  const resolvedUserId = Number.parseInt(userId, 10);
  const resolvedObligationId = Number.parseInt(obligationId, 10);

  if (!Number.isFinite(resolvedUserId) || resolvedUserId <= 0) {
    throw new ValidationError('A valid userId is required to record a compliance task action.');
  }
  if (!Number.isFinite(resolvedObligationId) || resolvedObligationId <= 0) {
    throw new ValidationError('A valid obligationId is required.');
  }

  const normalizedAction = String(action ?? '').toLowerCase();
  if (!normalizedAction) {
    throw new ValidationError('An action is required.');
  }

  return sequelize.transaction(async (trx) => {
    const obligation = await ComplianceObligation.findByPk(resolvedObligationId, {
      include: [
        {
          model: ComplianceDocument,
          as: 'document',
        },
      ],
      lock: trx.LOCK.UPDATE,
      transaction: trx,
    });

    if (!obligation) {
      throw new NotFoundError('Compliance task not found.');
    }

    const document = obligation.document;
    if (
      obligation.assigneeId &&
      obligation.assigneeId !== resolvedUserId &&
      document?.ownerId !== resolvedUserId
    ) {
      throw new AuthorizationError('You do not have access to this compliance task.');
    }

    if (normalizedAction !== 'complete') {
      throw new ValidationError(`Unsupported compliance task action: ${normalizedAction}.`);
    }

    const metadata = { ...(obligation.metadata ?? {}) };
    const actionLog = Array.isArray(metadata.actionLog) ? [...metadata.actionLog] : [];
    actionLog.push({
      action: normalizedAction,
      actorId: resolvedUserId,
      note: note ?? null,
      at: new Date().toISOString(),
    });
    metadata.actionLog = actionLog;

    await obligation.update(
      {
        status: 'satisfied',
        completedAt: new Date(),
        metadata,
      },
      { transaction: trx },
    );

    await obligation.reload({
      transaction: trx,
      include: [
        {
          model: ComplianceDocument,
          as: 'document',
        },
      ],
    });

    return buildComplianceTasks([obligation], { userId: resolvedUserId })[0];
  });
}

export default {
  getFinanceControlTowerOverview,
  recordFinanceReleaseAction,
  recordFinanceDisputeAction,
  recordFinanceComplianceAction,
};
