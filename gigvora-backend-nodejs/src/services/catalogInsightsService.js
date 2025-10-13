import { Op, fn, col } from 'sequelize';
import {
  User,
  FreelancerCatalogBundle,
  FreelancerCatalogBundleMetric,
  FreelancerRepeatClient,
  FreelancerCrossSellOpportunity,
  FreelancerKeywordImpression,
  FreelancerMarginSnapshot,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'catalog:insights';
const CACHE_TTL_SECONDS = 60;
const PRIORITY_LABELS = { 1: 'High', 2: 'Medium', 3: 'Low' };
const MARGIN_THRESHOLDS = { healthy: 45, watch: 30 };

function normalizeFreelancerId(value) {
  const id = Number.parseInt(value, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return id;
}

async function ensureFreelancerExists(freelancerId) {
  const freelancer = await User.findByPk(freelancerId, {
    attributes: ['id', 'userType'],
  });
  if (!freelancer) {
    throw new NotFoundError('Freelancer not found.');
  }
  if (freelancer.userType !== 'freelancer') {
    throw new ValidationError('Catalog insights are only available for freelancer accounts.');
  }
  return freelancer;
}

function toNumber(value, fallback = 0) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function isoDate(date) {
  if (!date) return null;
  const instance = new Date(date);
  if (Number.isNaN(instance.getTime())) {
    return null;
  }
  return instance.toISOString().slice(0, 10);
}

function computeConversionRate(clicks, conversions) {
  const totalClicks = toNumber(clicks);
  const totalConversions = toNumber(conversions);
  if (totalClicks <= 0) {
    return 0;
  }
  return (totalConversions / totalClicks) * 100;
}

function mergeKeywordEntries(entries) {
  const buckets = new Map();

  entries.forEach((entry) => {
    const keyword = entry.keyword;
    if (!keyword) return;
    const key = keyword.toLowerCase();
    const bucket = buckets.get(key) ?? {
      keyword: entry.keyword,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      trendTotal: 0,
      trendSamples: 0,
      regions: [],
    };
    bucket.impressions += toNumber(entry.impressions);
    bucket.clicks += toNumber(entry.clicks);
    bucket.conversions += toNumber(entry.conversions);
    if (entry.trendPercentage != null) {
      bucket.trendTotal += toNumber(entry.trendPercentage);
      bucket.trendSamples += 1;
    }
    if (entry.region) {
      bucket.regions.push({
        region: entry.region,
        impressions: toNumber(entry.impressions),
        conversions: toNumber(entry.conversions),
        clicks: toNumber(entry.clicks),
      });
    }
    buckets.set(key, bucket);
  });

  return Array.from(buckets.values()).map((bucket) => {
    const averageTrend = bucket.trendSamples > 0 ? bucket.trendTotal / bucket.trendSamples : null;
    const regions = bucket.regions
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5)
      .map((region) => ({
        region: region.region,
        impressions: region.impressions,
        conversions: region.conversions,
        clicks: region.clicks,
      }));

    return {
      keyword: bucket.keyword,
      impressions: bucket.impressions,
      clicks: bucket.clicks,
      conversions: bucket.conversions,
      trendPercentage: averageTrend == null ? null : round(averageTrend, 1),
      regions,
    };
  });
}

function buildMarginHistory(records) {
  return records.map((record) => {
    const revenue = toNumber(record.revenue);
    const software = toNumber(record.softwareCosts);
    const subcontractor = toNumber(record.subcontractorCosts);
    const fulfillment = toNumber(record.fulfillmentCosts);
    const totalCosts = software + subcontractor + fulfillment;
    const grossMarginDollar = revenue - totalCosts;
    const grossMarginPercent = revenue > 0 ? (grossMarginDollar / revenue) * 100 : 0;

    return {
      month: record.month,
      revenue,
      softwareCosts: software,
      subcontractorCosts: subcontractor,
      fulfillmentCosts: fulfillment,
      grossMarginDollar,
      grossMarginPercent: round(grossMarginPercent, 1),
      notes: record.notes ?? null,
    };
  });
}

async function loadCatalogInsights(freelancerId) {
  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(now.getTime() - 59 * 24 * 60 * 60 * 1000);
  const previousPeriodEnd = new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000);

  const currentStartIso = isoDate(currentPeriodStart);
  const previousStartIso = isoDate(previousPeriodStart);
  const previousEndIso = isoDate(previousPeriodEnd);

  const [
    currentTotals,
    previousTotals,
    bundlePerformanceRecords,
    totalClients,
    repeatClients,
    activeRetainers,
    currentRetainers,
    previousRetainers,
    opportunities,
    keywordEntries,
    marginRecords,
  ] = await Promise.all([
    FreelancerCatalogBundleMetric.findAll({
      attributes: [
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.impressions')), 0), 'impressions'],
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.clicks')), 0), 'clicks'],
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.conversions')), 0), 'conversions'],
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.revenue')), 0), 'revenue'],
        [fn('AVG', col('FreelancerCatalogBundleMetric.attachRate')), 'attachRate'],
      ],
      include: [
        {
          model: FreelancerCatalogBundle,
          as: 'bundle',
          attributes: [],
          where: { freelancerId },
        },
      ],
      where: {
        periodEnd: { [Op.gte]: currentStartIso },
      },
      raw: true,
    }).then((rows) => rows[0] ?? {}),
    FreelancerCatalogBundleMetric.findAll({
      attributes: [
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.impressions')), 0), 'impressions'],
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.clicks')), 0), 'clicks'],
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.conversions')), 0), 'conversions'],
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.revenue')), 0), 'revenue'],
        [fn('AVG', col('FreelancerCatalogBundleMetric.attachRate')), 'attachRate'],
      ],
      include: [
        {
          model: FreelancerCatalogBundle,
          as: 'bundle',
          attributes: [],
          where: { freelancerId },
        },
      ],
      where: {
        periodEnd: {
          [Op.between]: [previousStartIso, previousEndIso],
        },
      },
      raw: true,
    }).then((rows) => rows[0] ?? {}),
    FreelancerCatalogBundleMetric.findAll({
      attributes: [
        'bundleId',
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.impressions')), 0), 'impressions'],
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.clicks')), 0), 'clicks'],
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.conversions')), 0), 'conversions'],
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.revenue')), 0), 'revenue'],
        [fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.repeatClients')), 0), 'repeatClients'],
        [fn('AVG', col('FreelancerCatalogBundleMetric.attachRate')), 'attachRate'],
      ],
      include: [
        {
          model: FreelancerCatalogBundle,
          as: 'bundle',
          attributes: ['id', 'name', 'description', 'basePrice', 'currencyCode', 'metadata'],
          where: { freelancerId },
        },
      ],
      where: {
        periodEnd: { [Op.gte]: currentStartIso },
      },
      group: [
        'FreelancerCatalogBundleMetric.bundleId',
        'bundle.id',
        'bundle.name',
        'bundle.description',
        'bundle.basePrice',
        'bundle.currencyCode',
        'bundle.metadata',
      ],
      order: [[fn('COALESCE', fn('SUM', col('FreelancerCatalogBundleMetric.revenue')), 0), 'DESC']],
      limit: 5,
      subQuery: false,
    }),
    FreelancerRepeatClient.count({ where: { freelancerId } }),
    FreelancerRepeatClient.count({
      where: { freelancerId, totalOrders: { [Op.gte]: 2 } },
    }),
    FreelancerRepeatClient.count({ where: { freelancerId, isRetainer: true } }),
    FreelancerRepeatClient.count({
      where: {
        freelancerId,
        isRetainer: true,
        retainerStartDate: { [Op.gte]: currentStartIso },
      },
    }),
    FreelancerRepeatClient.count({
      where: {
        freelancerId,
        isRetainer: true,
        retainerStartDate: { [Op.between]: [previousStartIso, previousEndIso] },
      },
    }),
    FreelancerCrossSellOpportunity.findAll({
      where: { freelancerId },
      order: [
        ['priority', 'ASC'],
        ['expectedUpliftPercentage', 'DESC'],
        ['expectedRevenue', 'DESC'],
      ],
      include: [
        { model: FreelancerCatalogBundle, as: 'sourceBundle', attributes: ['id', 'name'] },
        { model: FreelancerCatalogBundle, as: 'targetBundle', attributes: ['id', 'name'] },
      ],
      limit: 10,
    }),
    FreelancerKeywordImpression.findAll({
      where: {
        freelancerId,
        capturedAt: { [Op.gte]: currentStartIso },
      },
      order: [
        ['keyword', 'ASC'],
        ['impressions', 'DESC'],
      ],
      raw: true,
    }),
    FreelancerMarginSnapshot.findAll({
      where: { freelancerId },
      order: [['month', 'DESC']],
      limit: 6,
    }),
  ]);

  const totalImpressions = toNumber(currentTotals.impressions);
  const totalClicks = toNumber(currentTotals.clicks);
  const totalConversions = toNumber(currentTotals.conversions);
  const currentConversionRate = computeConversionRate(totalClicks, totalConversions);
  const previousConversionRate = computeConversionRate(
    previousTotals.clicks,
    previousTotals.conversions,
  );

  const currentAttachRate = currentTotals.attachRate == null ? null : toNumber(currentTotals.attachRate);
  const previousAttachRate =
    previousTotals.attachRate == null ? null : toNumber(previousTotals.attachRate);

  const repeatClientRate = totalClients > 0 ? (repeatClients / totalClients) * 100 : 0;
  const retainerDelta = currentRetainers - previousRetainers;

  const topBundles = bundlePerformanceRecords.map((record) => {
    const plain = record.get({ plain: true });
    const bundle = plain.bundle ?? {};
    const clicks = toNumber(plain.clicks);
    const conversions = toNumber(plain.conversions);
    const conversionRate = computeConversionRate(clicks, conversions);

    return {
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      impressions: toNumber(plain.impressions),
      clicks,
      conversions,
      conversionRate: round(conversionRate, 1),
      revenue: round(toNumber(plain.revenue), 2),
      repeatClients: toNumber(plain.repeatClients),
      attachRate: plain.attachRate == null ? null : round(toNumber(plain.attachRate), 1),
      basePrice: bundle.basePrice == null ? null : round(toNumber(bundle.basePrice), 2),
      currencyCode: bundle.currencyCode ?? 'USD',
      metadata: bundle.metadata ?? null,
    };
  });

  const crossSell = opportunities.map((opportunity) => {
    const plain = opportunity.get({ plain: true });
    const sourceBundle = opportunity.get?.('sourceBundle') ?? plain.sourceBundle ?? null;
    const targetBundle = opportunity.get?.('targetBundle') ?? plain.targetBundle ?? null;

    return {
      id: plain.id,
      title: plain.title,
      signal: plain.signal,
      recommendedAction: plain.recommendedAction,
      expectedUpliftPercentage:
        plain.expectedUpliftPercentage == null
          ? null
          : round(toNumber(plain.expectedUpliftPercentage), 1),
      expectedRevenue:
        plain.expectedRevenue == null ? null : round(toNumber(plain.expectedRevenue), 2),
      confidence:
        plain.confidence == null ? null : round(toNumber(plain.confidence), 1),
      priority: PRIORITY_LABELS[plain.priority] ?? 'Medium',
      priorityWeight: plain.priority ?? 2,
      sourceBundle: sourceBundle?.toPublicObject?.() ?? sourceBundle ?? null,
      targetBundle: targetBundle?.toPublicObject?.() ?? targetBundle ?? null,
    };
  });

  const keywordInsights = mergeKeywordEntries(keywordEntries)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8);

  const marginHistory = buildMarginHistory(
    marginRecords.map((record) => record.toPublicObject()),
  );
  const latestMargin = marginHistory[0] ?? null;

  return {
    summary: {
      conversionRate: {
        value: round(currentConversionRate, 1),
        change: round(currentConversionRate - previousConversionRate, 1),
        label: 'vs prior 30 days',
        totals: {
          impressions: totalImpressions,
          clicks: totalClicks,
          conversions: totalConversions,
        },
      },
      repeatClientRate: {
        value: round(repeatClientRate, 1),
        change: retainerDelta,
        label: 'new retainers in last 30 days',
        totals: {
          totalClients,
          repeatClients,
          activeRetainers,
        },
      },
      crossSellAcceptance: {
        value: currentAttachRate == null ? null : round(currentAttachRate, 1),
        change:
          currentAttachRate == null || previousAttachRate == null
            ? null
            : round(currentAttachRate - previousAttachRate, 1),
        label: 'attach rate vs prior 30 days',
        openOpportunities: crossSell.length,
      },
    },
    bundles: topBundles,
    crossSell,
    keywords: keywordInsights,
    margin: {
      revenue: latestMargin ? latestMargin.revenue : 0,
      softwareCosts: latestMargin ? latestMargin.softwareCosts : 0,
      subcontractorCosts: latestMargin ? latestMargin.subcontractorCosts : 0,
      fulfillmentCosts: latestMargin ? latestMargin.fulfillmentCosts : 0,
      grossMarginDollar: latestMargin ? latestMargin.grossMarginDollar : 0,
      grossMarginPercent: latestMargin ? latestMargin.grossMarginPercent : 0,
      notes: latestMargin ? latestMargin.notes : null,
      month: latestMargin ? latestMargin.month : null,
      history: marginHistory,
      thresholds: MARGIN_THRESHOLDS,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      period: {
        currentStart: currentStartIso,
        currentEnd: isoDate(now),
        previousStart: previousStartIso,
        previousEnd: previousEndIso,
      },
    },
  };
}

export async function getFreelancerCatalogInsights(freelancerId, { bypassCache = false } = {}) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { freelancerId: id });

  if (!bypassCache) {
    const cached = appCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const insights = await loadCatalogInsights(id);
  appCache.set(cacheKey, insights, CACHE_TTL_SECONDS);
  return insights;
}

export default {
  getFreelancerCatalogInsights,
};
