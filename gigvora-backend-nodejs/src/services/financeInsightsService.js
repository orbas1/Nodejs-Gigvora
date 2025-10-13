import {
  User,
  FreelancerFinanceMetric,
  FreelancerRevenueMonthly,
  FreelancerRevenueStream,
  FreelancerPayout,
  FreelancerTaxEstimate,
  FreelancerTaxFiling,
  FreelancerDeductionSummary,
  FreelancerProfitabilityMetric,
  FreelancerCostBreakdown,
  FreelancerSavingsGoal,
  FreelancerFinanceControl,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const CACHE_NAMESPACE = 'finance:freelancer:insights';
const CACHE_TTL_SECONDS = 60;

const PAYOUT_STATUS_LABELS = {
  released: 'Released',
  scheduled: 'Scheduled',
  in_escrow: 'In escrow',
  pending: 'Pending',
  failed: 'Failed',
};

const TAX_ESTIMATE_STATUS_LABELS = {
  on_track: 'On track',
  due_soon: 'Due soon',
  past_due: 'Past due',
  paid: 'Paid',
  processing: 'Processing',
};

const TAX_FILING_STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
  overdue: 'Overdue',
};

function toNumber(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeFreelancerId(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return parsed;
}

function inferTrend(changeValue, changeUnit, fallback = 'neutral') {
  const numeric = toNumber(changeValue);
  if (numeric == null || !Number.isFinite(numeric)) {
    return fallback;
  }
  if (numeric > 0) {
    return 'up';
  }
  if (numeric < 0) {
    return 'down';
  }
  return 'neutral';
}

function formatMonthLabel(isoDate) {
  if (!isoDate) {
    return null;
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

function buildSummaryMetrics(records) {
  const metricsByKey = new Map();
  records
    .sort((a, b) => {
      const aTime = a.effectiveAt ? new Date(a.effectiveAt).getTime() : 0;
      const bTime = b.effectiveAt ? new Date(b.effectiveAt).getTime() : 0;
      if (aTime === bTime) {
        return (b.id ?? 0) - (a.id ?? 0);
      }
      return bTime - aTime;
    })
    .forEach((metric) => {
      if (!metricsByKey.has(metric.metricKey)) {
        const changeUnit = metric.changeUnit ?? null;
        metricsByKey.set(metric.metricKey, {
          metricKey: metric.metricKey,
          label: metric.label,
          value: toNumber(metric.value),
          valueUnit: metric.valueUnit,
          currencyCode: metric.currencyCode ?? null,
          changeValue: toNumber(metric.changeValue),
          changeUnit,
          trend: metric.trend ?? inferTrend(metric.changeValue, changeUnit),
          caption: metric.caption,
          effectiveAt: metric.effectiveAt,
        });
      }
    });
  return Array.from(metricsByKey.values());
}

function buildRevenueTrend(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { currencyCode: 'USD', points: [] };
  }
  const points = records
    .slice()
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .map((record) => ({
      month: formatMonthLabel(record.month) ?? record.month,
      monthDate: record.month,
      booked: toNumber(record.bookedAmount) ?? 0,
      realized: toNumber(record.realizedAmount) ?? 0,
    }));
  const currencyCode = records.find((record) => record.currencyCode)?.currencyCode ?? 'USD';
  return { currencyCode, points };
}

function buildRevenueStreams(records) {
  return (records ?? []).map((stream) => ({
    id: stream.id,
    stream: stream.name,
    sharePercent: toNumber(stream.sharePercent),
    monthlyRecurringRevenue: toNumber(stream.monthlyRecurringRevenue),
    currencyCode: stream.currencyCode ?? 'USD',
    yoyChangePercent: toNumber(stream.yoyChangePercent),
    notes: stream.notes,
  }));
}

function buildPayoutHistory(records) {
  return (records ?? []).map((payout) => ({
    id: payout.id,
    date: payout.payoutDate,
    client: payout.clientName,
    gig: payout.gigTitle,
    amount: toNumber(payout.amount),
    currencyCode: payout.currencyCode ?? 'USD',
    status: payout.status,
    statusLabel: PAYOUT_STATUS_LABELS[payout.status] ?? payout.status,
    reference: payout.reference,
  }));
}

function buildTaxCompliance({ estimate, filings, deduction }) {
  const quarterlyEstimate = estimate
    ? {
        dueDate: estimate.dueDate,
        amount: toNumber(estimate.amount),
        currencyCode: estimate.currencyCode ?? 'USD',
        status: estimate.status,
        statusLabel: TAX_ESTIMATE_STATUS_LABELS[estimate.status] ?? estimate.status,
        notes: estimate.notes,
      }
    : null;

  const filingItems = (filings ?? []).map((filing) => ({
    id: filing.id,
    name: filing.name,
    jurisdiction: filing.jurisdiction,
    dueDate: filing.dueDate,
    status: filing.status,
    statusLabel: TAX_FILING_STATUS_LABELS[filing.status] ?? filing.status,
    submittedAt: filing.submittedAt,
  }));

  const deductions = deduction
    ? {
        taxYear: deduction.taxYear,
        amount: toNumber(deduction.amount),
        currencyCode: deduction.currencyCode ?? 'USD',
        changePercentage: toNumber(deduction.changePercentage),
        notes: deduction.notes,
      }
    : null;

  const highlights = [];
  if (quarterlyEstimate?.status === 'on_track') {
    highlights.push('Quarterly estimates are funded and on schedule.');
  }
  if (filingItems.some((item) => item.status === 'submitted')) {
    highlights.push('Key compliance filings submitted ahead of deadlines.');
  }
  if (filingItems.some((item) => item.status === 'in_progress')) {
    highlights.push('Active jurisdictional filings are being worked with reminders enabled.');
  }

  return {
    quarterlyEstimate,
    filings: filingItems,
    deductions,
    complianceHighlights: highlights,
  };
}

function buildProfitability(metrics, breakdowns, savingsGoals) {
  const metricItems = (metrics ?? []).map((metric) => ({
    id: metric.id,
    metricKey: metric.metricKey,
    label: metric.label,
    value: toNumber(metric.value),
    valueUnit: metric.valueUnit,
    currencyCode: metric.currencyCode ?? 'USD',
    changeValue: toNumber(metric.changeValue),
    changeUnit: metric.changeUnit,
  }));

  const breakdownItems = (breakdowns ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    percent: toNumber(item.percentage),
    caption: item.caption,
  }));

  const savingsItems = (savingsGoals ?? []).map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmount: toNumber(goal.targetAmount),
    currencyCode: goal.currencyCode ?? 'USD',
    progress: toNumber(goal.progress),
    cadence: goal.cadence,
  }));

  return {
    metrics: metricItems,
    breakdown: breakdownItems,
    savingsGoals: savingsItems,
  };
}

function buildControls(records) {
  return (records ?? []).map((record) => ({
    id: record.id,
    name: record.name,
    description: record.description,
    bullets: Array.isArray(record.bullets) ? record.bullets : [],
  }));
}

export async function getFreelancerFinanceInsights(freelancerId) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { freelancerId: normalizedId });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const freelancer = await User.findByPk(normalizedId);
    if (!freelancer || freelancer.userType !== 'freelancer') {
      throw new NotFoundError('Freelancer profile not found.');
    }

    const [
      summaryMetricRecords,
      revenueMonths,
      revenueStreams,
      payoutRecords,
      taxEstimateRecords,
      taxFilings,
      deductionSummaries,
      profitabilityMetrics,
      costBreakdowns,
      savingsGoals,
      controls,
    ] = await Promise.all([
      FreelancerFinanceMetric.findAll({
        where: { freelancerId: normalizedId },
        order: [
          ['effectiveAt', 'DESC'],
          ['id', 'DESC'],
        ],
      }).then((rows) => rows.map((row) => row.toPublicObject())),
      FreelancerRevenueMonthly.findAll({
        where: { freelancerId: normalizedId },
        order: [['month', 'ASC']],
      }).then((rows) => rows.map((row) => row.toPublicObject())),
      FreelancerRevenueStream.findAll({
        where: { freelancerId: normalizedId },
        order: [['sharePercent', 'DESC']],
      }).then((rows) => rows.map((row) => row.toPublicObject())),
      FreelancerPayout.findAll({
        where: { freelancerId: normalizedId },
        order: [['payoutDate', 'DESC']],
        limit: 20,
      }).then((rows) => rows.map((row) => row.toPublicObject())),
      FreelancerTaxEstimate.findAll({
        where: { freelancerId: normalizedId },
        order: [['dueDate', 'ASC']],
        limit: 1,
      }).then((rows) => rows.map((row) => row.toPublicObject())),
      FreelancerTaxFiling.findAll({
        where: { freelancerId: normalizedId },
        order: [['dueDate', 'ASC']],
      }).then((rows) => rows.map((row) => row.toPublicObject())),
      FreelancerDeductionSummary.findAll({
        where: { freelancerId: normalizedId },
        order: [['taxYear', 'DESC']],
        limit: 1,
      }).then((rows) => rows.map((row) => row.toPublicObject())),
      FreelancerProfitabilityMetric.findAll({
        where: { freelancerId: normalizedId },
        order: [['label', 'ASC']],
      }).then((rows) => rows.map((row) => row.toPublicObject())),
      FreelancerCostBreakdown.findAll({
        where: { freelancerId: normalizedId },
        order: [['percentage', 'DESC']],
      }).then((rows) => rows.map((row) => row.toPublicObject())),
      FreelancerSavingsGoal.findAll({
        where: { freelancerId: normalizedId },
        order: [['createdAt', 'ASC']],
      }).then((rows) => rows.map((row) => row.toPublicObject())),
      FreelancerFinanceControl.findAll({
        where: { freelancerId: normalizedId },
        order: [['name', 'ASC']],
      }).then((rows) => rows.map((row) => row.toPublicObject())),
    ]);

    const summaryMetrics = buildSummaryMetrics(summaryMetricRecords);
    const revenueTrend = buildRevenueTrend(revenueMonths);
    const streams = buildRevenueStreams(revenueStreams);
    const payoutHistory = buildPayoutHistory(payoutRecords);
    const taxCompliance = buildTaxCompliance({
      estimate: taxEstimateRecords[0] ?? null,
      filings: taxFilings,
      deduction: deductionSummaries[0] ?? null,
    });
    const profitability = buildProfitability(
      profitabilityMetrics,
      costBreakdowns,
      savingsGoals,
    );
    const controlItems = buildControls(controls);

    const lastUpdatedCandidates = [
      ...summaryMetricRecords,
      ...revenueMonths,
      ...revenueStreams,
      ...payoutRecords,
      ...(taxEstimateRecords ?? []),
      ...taxFilings,
      ...(deductionSummaries ?? []),
      ...profitabilityMetrics,
      ...costBreakdowns,
      ...savingsGoals,
      ...controls,
    ]
      .map((item) => (item.updatedAt ? new Date(item.updatedAt).getTime() : null))
      .filter((time) => Number.isFinite(time));

    const lastUpdatedAt =
      lastUpdatedCandidates.length > 0
        ? new Date(Math.max(...lastUpdatedCandidates)).toISOString()
        : new Date().toISOString();

    return {
      freelancer: {
        id: freelancer.id,
        firstName: freelancer.firstName,
        lastName: freelancer.lastName,
        email: freelancer.email,
      },
      summaryMetrics,
      revenueTrend,
      revenueStreams: streams,
      payoutHistory,
      taxCompliance,
      profitability,
      controls: controlItems,
      lastUpdatedAt,
    };
  });
}

export default {
  getFreelancerFinanceInsights,
};
