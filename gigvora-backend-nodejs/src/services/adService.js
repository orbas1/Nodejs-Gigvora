import { Op } from 'sequelize';
import {
  AdCampaign,
  AdCreative,
  AdPlacement,
  AdCoupon,
  AdPlacementCoupon,
  AdKeyword,
  AdKeywordAssignment,
  OpportunityTaxonomy,
  OpportunityTaxonomyAssignment,
  AnalyticsDailyRollup,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError } from '../utils/errors.js';

const DEFAULT_SURFACES = ['global_dashboard'];
const DASHBOARD_CACHE_TTL_SECONDS = 45;
const MAX_PLACEMENTS_PER_SURFACE = 3;
const TRAFFIC_LOOKBACK_DAYS = 21;
const FORECAST_HORIZON_DAYS = 14;

const SURFACE_LABELS = {
  global_dashboard: 'Gigvora network',
  company_dashboard: 'Company dashboard',
  agency_dashboard: 'Agency dashboard',
  freelancer_dashboard: 'Freelancer dashboard',
  user_dashboard: 'Member dashboard',
  headhunter_dashboard: 'Headhunter dashboard',
  admin_dashboard: 'Admin control centre',
  pipeline_dashboard: 'Pipeline operations',
};

const DEFAULT_TRAFFIC_BASELINE = {
  averageDailySessions: 12840,
  growthRate: 0.082,
  returningVisitorRate: 0.37,
  mobileShare: 0.46,
  conversionRate: 0.064,
  ctrBaseline: 0.024,
  spendPerClick: 4.35,
  revenuePerLead: 1450,
  sourceBreakdown: [
    { source: 'organic', share: 0.44 },
    { source: 'partner', share: 0.26 },
    { source: 'paid', share: 0.23 },
    { source: 'community', share: 0.07 },
  ],
};

function sumNumbers(values = []) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function average(values = []) {
  if (!values.length) {
    return 0;
  }
  return sumNumbers(values) / values.length;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normaliseShareBreakdown(entries = []) {
  const total = sumNumbers(entries.map((entry) => entry.value));
  if (!total) {
    return DEFAULT_TRAFFIC_BASELINE.sourceBreakdown;
  }
  return entries
    .filter((entry) => entry.source)
    .map((entry) => ({
      source: entry.source,
      share: Number((entry.value / total).toFixed(4)),
    }))
    .filter((entry) => entry.share > 0)
    .sort((a, b) => b.share - a.share);
}

function buildSyntheticTrend({ base, growthRate, horizonDays, now }) {
  const points = [];
  for (let offset = horizonDays - 1; offset >= 0; offset -= 1) {
    const pointDate = new Date(now);
    pointDate.setDate(pointDate.getDate() - offset);
    const progress = horizonDays <= 1 ? 1 : (horizonDays - 1 - offset) / (horizonDays - 1);
    const growthMultiplier = 1 + growthRate * progress;
    const seasonalNoise = 1 + Math.sin(progress * Math.PI * 2) * 0.06;
    const sessions = Math.round(base * growthMultiplier * seasonalNoise);
    points.push({
      date: pointDate.toISOString(),
      sessions,
    });
  }
  return points;
}

async function loadTrafficSignals({ lookbackDays = TRAFFIC_LOOKBACK_DAYS, now = new Date() } = {}) {
  const since = new Date(now);
  since.setDate(since.getDate() - Math.max(7, lookbackDays));

  const rollups = await AnalyticsDailyRollup.findAll({
    where: {
      date: { [Op.between]: [since, now] },
    },
    order: [['date', 'ASC']],
  });

  let totalSessions = 0;
  let mobileSessions = 0;
  let returningSessions = 0;
  let conversions = 0;
  const sessionsByDate = new Map();
  const sourceAccumulator = new Map();

  rollups.forEach((record) => {
    const plain = record.get({ plain: true });
    const metricKey = `${plain.metricKey ?? ''}`.toLowerCase();
    const dimensions = plain.dimensions ?? {};
    const dimensionMetric = `${dimensions.metric ?? ''}`.toLowerCase();
    const channel = `${dimensions.channel ?? ''}`.toLowerCase();
    const segment = `${dimensions.segment ?? ''}`.toLowerCase();
    const source = `${dimensions.source ?? ''}`.toLowerCase();
    const value = toNumber(plain.value, 0);

    const combinedMetric = `${metricKey}::${dimensionMetric}`;
    const looksLikeSessions = /session|visit|traffic|pageview/.test(combinedMetric);
    const looksLikeConversion = /conversion|lead|signup|application|interview/.test(combinedMetric);

    if (looksLikeSessions) {
      totalSessions += value;
      if (channel === 'mobile') {
        mobileSessions += value;
      }
      if (segment === 'returning') {
        returningSessions += value;
      }

      const dateKey = plain.date ? new Date(plain.date) : new Date(now);
      const iso = dateKey.toISOString();
      sessionsByDate.set(iso, (sessionsByDate.get(iso) ?? 0) + value);

      if (source) {
        sourceAccumulator.set(source, (sourceAccumulator.get(source) ?? 0) + value);
      }
    } else if (looksLikeConversion) {
      conversions += value;
      if (channel === 'mobile') {
        mobileSessions += value;
      }
      if (source) {
        sourceAccumulator.set(source, (sourceAccumulator.get(source) ?? 0) + value);
      }
    }
  });

  const usesFallback = totalSessions <= 0;
  const averageDailySessions = usesFallback
    ? DEFAULT_TRAFFIC_BASELINE.averageDailySessions
    : totalSessions / Math.max(1, sessionsByDate.size);

  const growthSamples = Array.from(sessionsByDate.entries())
    .map(([, sessions]) => toNumber(sessions, 0))
    .filter((value) => value > 0);
  const firstWindow = growthSamples.slice(0, Math.min(3, growthSamples.length));
  const lastWindow = growthSamples.slice(-Math.min(3, growthSamples.length));
  const growthRate = usesFallback
    ? DEFAULT_TRAFFIC_BASELINE.growthRate
    : clamp(
        average(lastWindow) && average(firstWindow)
          ? (average(lastWindow) - average(firstWindow)) / Math.max(average(firstWindow), 1)
          : 0,
        -0.8,
        1.2,
      );

  const returningVisitorRate = usesFallback
    ? DEFAULT_TRAFFIC_BASELINE.returningVisitorRate
    : clamp(returningSessions / Math.max(totalSessions, 1), 0, 1);

  const mobileShare = usesFallback
    ? DEFAULT_TRAFFIC_BASELINE.mobileShare
    : clamp(mobileSessions / Math.max(totalSessions, 1), 0, 1);

  const conversionRate = usesFallback
    ? DEFAULT_TRAFFIC_BASELINE.conversionRate
    : clamp(conversions / Math.max(totalSessions, 1), 0.001, 0.25);

  const ctrBaseline = usesFallback
    ? DEFAULT_TRAFFIC_BASELINE.ctrBaseline
    : clamp(conversionRate * 6.5, 0.008, 0.12);

  const spendPerClick = DEFAULT_TRAFFIC_BASELINE.spendPerClick;
  const revenuePerLead = DEFAULT_TRAFFIC_BASELINE.revenuePerLead;

  const breakdownEntries = Array.from(sourceAccumulator.entries()).map(([key, value]) => ({
    source: key || 'organic',
    value,
  }));

  const sourceBreakdown = usesFallback
    ? DEFAULT_TRAFFIC_BASELINE.sourceBreakdown
    : normaliseShareBreakdown(breakdownEntries);

  const trend = usesFallback
    ? buildSyntheticTrend({
        base: DEFAULT_TRAFFIC_BASELINE.averageDailySessions,
        growthRate: DEFAULT_TRAFFIC_BASELINE.growthRate,
        horizonDays: lookbackDays,
        now,
      })
    : Array.from(sessionsByDate.entries()).map(([date, sessions]) => ({
        date,
        sessions: Math.round(sessions),
      }));

  return {
    averageDailySessions,
    growthRate,
    returningVisitorRate,
    mobileShare,
    conversionRate,
    ctrBaseline,
    spendPerClick,
    revenuePerLead,
    sourceBreakdown,
    trend,
    lookbackDays: Math.max(lookbackDays, 7),
    usesFallback,
  };
}

function computePlacementSignals(placements, surfaces) {
  if (!placements.length) {
    return {
      coverageRatio: 0,
      activeRatio: 0,
      couponRatio: 0,
      averageScore: 0,
      creativeTypes: new Set(),
    };
  }

  const activePlacements = placements.filter((placement) => placement.isActive);
  const surfacesWithTotals = surfaces.length
    ? sumNumbers(surfaces.map((surface) => Math.max(surface.totalPlacements ?? 0, 1)))
    : placements.length;
  const coverageRatio = clamp(activePlacements.length / Math.max(surfacesWithTotals, 1), 0, 1.5);
  const couponRatio = clamp(
    placements.filter((placement) => (placement.coupons ?? []).length > 0).length /
      Math.max(placements.length, 1),
    0,
    1,
  );
  const averageScore = placements.length
    ? placements.reduce((sum, placement) => sum + toNumber(placement.score, 0), 0) / placements.length
    : 0;
  const creativeTypes = new Set(
    placements.map((placement) => placement.creative?.type ?? placement.creative?.format ?? 'display'),
  );

  return {
    coverageRatio,
    activeRatio: clamp(activePlacements.length / Math.max(placements.length, 1), 0, 1),
    couponRatio,
    averageScore,
    creativeTypes,
  };
}

function buildForecast({ placements, surfaces, overview, trafficSignals, now }) {
  if (!placements.length) {
    return null;
  }

  const horizonDays = FORECAST_HORIZON_DAYS;
  const {
    coverageRatio,
    couponRatio,
    averageScore,
    creativeTypes,
  } = computePlacementSignals(placements, surfaces);

  const baseDailySessions = trafficSignals.averageDailySessions;
  const growthMultiplier = 1 + trafficSignals.growthRate;
  const projectedSessions = Math.round(baseDailySessions * horizonDays * growthMultiplier);

  const coverageBoost = clamp(0.65 + coverageRatio * 0.4, 0.5, 1.25);
  const qualityBoost = clamp(0.75 + (averageScore / 12) * 0.25, 0.65, 1.35);
  const couponBoost = clamp(1 + couponRatio * 0.2, 1, 1.25);
  const diversityBoost = clamp(1 + (creativeTypes.size - 1) * 0.05, 1, 1.25);

  const impressions = Math.round(projectedSessions * coverageBoost * qualityBoost * couponBoost * diversityBoost);
  const ctr = clamp(
    trafficSignals.ctrBaseline * (0.92 + coverageRatio * 0.18) * (0.96 + couponRatio * 0.12),
    0.008,
    0.18,
  );
  const clicks = Math.round(impressions * ctr);

  const conversionRate = clamp(
    trafficSignals.conversionRate * (0.9 + couponRatio * 0.35) * (0.95 + coverageRatio * 0.12),
    0.01,
    0.35,
  );
  const leads = Math.round(clicks * conversionRate);

  const expectedSpend = Number((clicks * trafficSignals.spendPerClick).toFixed(2));
  const expectedRevenue = Number((leads * trafficSignals.revenuePerLead).toFixed(2));
  const projectedRoi = expectedSpend > 0 ? Number(((expectedRevenue - expectedSpend) / expectedSpend).toFixed(2)) : null;

  const scenarioDefinitions = [
    { label: 'Conservative', multiplier: 0.85, confidence: 0.6 },
    { label: 'Expected', multiplier: 1.0, confidence: 0.78 },
    { label: 'Upside', multiplier: 1.22, confidence: 0.34 },
  ];

  const scenarios = scenarioDefinitions.map((scenario) => {
    const impressionsValue = Math.round(impressions * scenario.multiplier);
    const clicksValue = Math.round(clicks * scenario.multiplier);
    const leadsValue = Math.round(leads * scenario.multiplier);
    const spendValue = Number((expectedSpend * scenario.multiplier).toFixed(2));
    const revenueValue = Number((expectedRevenue * scenario.multiplier).toFixed(2));
    const roiValue = spendValue > 0 ? Number(((revenueValue - spendValue) / spendValue).toFixed(2)) : null;
    return {
      label: scenario.label,
      confidence: Number(scenario.confidence.toFixed(2)),
      impressions: impressionsValue,
      clicks: clicksValue,
      leads: leadsValue,
      spend: spendValue,
      revenue: revenueValue,
      roi: roiValue,
    };
  });

  const assumptions = [
    `Forecast horizon covers ${horizonDays} days with a projected traffic lift of ${Math.round(
      growthMultiplier * 100 - 100,
    )}% based on analytics trends.`,
    `CTR baseline of ${(trafficSignals.ctrBaseline * 100).toFixed(1)}% adjusted for ${Math.round(
      coverageRatio * 100,
    )}% surface coverage and incentive readiness.`,
    `Conversion rate assumes ${(conversionRate * 100).toFixed(1)}% efficiency with ${Math.round(
      couponRatio * 100,
    )}% of placements carrying promotional hooks.`,
  ];

  const safetyChecks = [];
  if (coverageRatio < 0.55) {
    safetyChecks.push({
      level: 'warning',
      message: 'Less than 55% of surface inventory has active coverage.',
      suggestion: 'Activate an additional placement on high-traffic surfaces to protect reach.',
    });
  }
  if (couponRatio < 0.2) {
    safetyChecks.push({
      level: 'info',
      message: 'Few placements include incentives or coupons.',
      suggestion: 'Attach at least one coupon to each hero placement to lift conversion rate.',
    });
  }
  if (trafficSignals.usesFallback) {
    safetyChecks.push({
      level: 'info',
      message: 'Traffic trend used synthetic baselines because analytics rollups lack session metrics.',
      suggestion: 'Ingest web.session and mobile.session rollups for higher fidelity forecasting.',
    });
  }
  if (projectedRoi != null && projectedRoi < 0.25) {
    safetyChecks.push({
      level: 'warning',
      message: 'Projected ROI is below the 25% benchmark.',
      suggestion: 'Rebalance spend towards high-performing surfaces or refresh creative.',
    });
  }

  return {
    summary: {
      horizonDays,
      projectedSessions,
      expectedImpressions: impressions,
      expectedClicks: clicks,
      expectedLeads: leads,
      expectedSpend,
      expectedRevenue,
      projectedRoi,
      coverageScore: Number((coverageRatio * 100).toFixed(1)),
      activePlacementRatio: Number((overview.activePlacements / Math.max(overview.totalPlacements || 1, 1)).toFixed(2)),
      couponCoverage: Number((couponRatio * 100).toFixed(1)),
      averageScore: Number(averageScore.toFixed(2)),
      ctr: Number((ctr * 100).toFixed(2)),
      conversionRate: Number((conversionRate * 100).toFixed(2)),
      creativeVariants: creativeTypes.size,
    },
    traffic: {
      averageDailySessions: Math.round(baseDailySessions),
      growthRate: Number((trafficSignals.growthRate).toFixed(3)),
      returningVisitorRate: Number((trafficSignals.returningVisitorRate * 100).toFixed(2)),
      mobileShare: Number((trafficSignals.mobileShare * 100).toFixed(2)),
      conversionRate: Number((trafficSignals.conversionRate * 100).toFixed(2)),
      ctrBaseline: Number((trafficSignals.ctrBaseline * 100).toFixed(2)),
      spendPerClick: trafficSignals.spendPerClick,
      revenuePerLead: trafficSignals.revenuePerLead,
      sourceBreakdown: trafficSignals.sourceBreakdown,
      trend: trafficSignals.trend,
      lookbackDays: trafficSignals.lookbackDays,
      usesFallback: trafficSignals.usesFallback,
    },
    scenarios,
    assumptions,
    safetyChecks,
    generatedAt: now.toISOString(),
  };
}

function normaliseSurfaceList(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .flatMap((value) => `${value}`.split(',').map((part) => part.trim()))
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return `${input}`
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function sanitizeKeywordList(keywords = []) {
  return Array.from(
    new Set(
      keywords
        .flatMap((value) => `${value}`.split(',').map((part) => part.trim().toLowerCase()))
        .filter(Boolean),
    ),
  );
}

function sanitizeContext(context = {}) {
  if (context == null || typeof context !== 'object') {
    return {};
  }
  const keywordHints = sanitizeKeywordList([
    ...(Array.isArray(context.keywords) ? context.keywords : []),
    ...(Array.isArray(context.keywordHints) ? context.keywordHints : []),
    ...(Array.isArray(context.titles) ? context.titles : []),
  ]);
  const opportunityTargets = Array.isArray(context.opportunityTargets)
    ? context.opportunityTargets
        .map((target) => ({
          targetType: target?.targetType ?? target?.type ?? null,
          ids: Array.isArray(target?.ids)
            ? target.ids
                .map((value) => Number.parseInt(value, 10))
                .filter((value) => Number.isInteger(value) && value > 0)
            : [],
        }))
        .filter((target) => target.targetType && target.ids.length)
    : [];

  return { keywordHints, opportunityTargets };
}

function computeTimeMetrics(startAt, endAt, now) {
  const nowTs = now.getTime();
  const startTs = startAt ? new Date(startAt).getTime() : null;
  const endTs = endAt ? new Date(endAt).getTime() : null;

  const timeUntilStartMinutes =
    startTs && startTs > nowTs ? Math.round((startTs - nowTs) / (60 * 1000)) : null;
  const timeUntilEndMinutes =
    endTs && endTs > nowTs ? Math.round((endTs - nowTs) / (60 * 1000)) : null;

  return { timeUntilStartMinutes, timeUntilEndMinutes };
}

function isPlacementActive(placement, now) {
  const { startAt, endAt, status } = placement;
  const startTs = startAt ? new Date(startAt).getTime() : null;
  const endTs = endAt ? new Date(endAt).getTime() : null;
  const nowTs = now.getTime();
  const withinWindow =
    (startTs == null || startTs <= nowTs) && (endTs == null || endTs >= nowTs);
  return status === 'active' || (status === 'scheduled' && withinWindow);
}

function isPlacementUpcoming(placement, now) {
  if (!placement.startAt) {
    return false;
  }
  const startTs = new Date(placement.startAt).getTime();
  return startTs > now.getTime();
}

function collectPlacementKeywords(placement) {
  const assignments = Array.isArray(placement.creative?.keywordAssignments)
    ? placement.creative.keywordAssignments
    : [];
  return assignments
    .map((assignment) => {
      const keyword = assignment.keyword;
      if (!keyword) {
        return null;
      }
      return {
        id: keyword.id,
        keyword: keyword.keyword,
        category: keyword.category ?? null,
        intent: keyword.intent ?? null,
        weight: assignment.weight ?? 1,
      };
    })
    .filter(Boolean);
}

function collectPlacementTaxonomies(placement) {
  const assignments = Array.isArray(placement.creative?.keywordAssignments)
    ? placement.creative.keywordAssignments
    : [];
  return assignments
    .map((assignment) => {
      const taxonomy = assignment.taxonomy;
      if (!taxonomy) {
        return null;
      }
      return {
        id: taxonomy.id,
        slug: taxonomy.slug,
        label: taxonomy.label,
        type: taxonomy.type,
        weight: assignment.weight ?? 1,
      };
    })
    .filter(Boolean);
}

function collectPlacementCoupons(placement, now) {
  const links = Array.isArray(placement.couponLinks) ? placement.couponLinks : [];
  return links
    .map((link) => {
      const couponRecord = link.coupon ?? link;
      if (!couponRecord) {
        return null;
      }
      const coupon =
        typeof couponRecord.get === 'function' ? couponRecord.get({ plain: true }) : couponRecord;
      const startTs = coupon.startAt ? new Date(coupon.startAt).getTime() : null;
      const endTs = coupon.endAt ? new Date(coupon.endAt).getTime() : null;
      const nowTs = now.getTime();

      let lifecycleStatus = coupon.lifecycleStatus ?? coupon.status ?? 'draft';
      if (coupon.status === 'archived') {
        lifecycleStatus = 'archived';
      } else if (coupon.status === 'paused') {
        lifecycleStatus = 'paused';
      } else if (endTs != null && endTs < nowTs) {
        lifecycleStatus = 'expired';
      } else if (startTs != null && startTs > nowTs) {
        lifecycleStatus = 'scheduled';
      } else if (coupon.status === 'draft') {
        lifecycleStatus = 'draft';
      } else {
        lifecycleStatus = 'active';
      }

      const remainingRedemptions =
        coupon.maxRedemptions == null
          ? null
          : Math.max(0, Number(coupon.maxRedemptions) - Number(coupon.totalRedemptions ?? 0));

      return {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description ?? null,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue ?? 0),
        status: coupon.status,
        lifecycleStatus,
        isActive: lifecycleStatus === 'active',
        startAt: coupon.startAt ?? null,
        endAt: coupon.endAt ?? null,
        maxRedemptions: coupon.maxRedemptions == null ? null : Number(coupon.maxRedemptions),
        perUserLimit: coupon.perUserLimit == null ? null : Number(coupon.perUserLimit),
        totalRedemptions: Number(coupon.totalRedemptions ?? 0),
        remainingRedemptions,
        surfaceTargets: Array.isArray(coupon.surfaceTargets) ? coupon.surfaceTargets : [],
        metadata: coupon.metadata ?? null,
        termsUrl: coupon.termsUrl ?? null,
        priority: Number(link.priority ?? 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.code.localeCompare(b.code);
    });
}

function scorePlacement(placement, contextSets, now) {
  const { keywordSet, taxonomySet } = contextSets;
  const keywords = collectPlacementKeywords(placement);
  const taxonomies = collectPlacementTaxonomies(placement);
  const keywordMatches = keywords.filter((entry) => keywordSet.has(entry.keyword.toLowerCase()));
  const taxonomyMatches = taxonomies.filter((entry) => taxonomySet.has(entry.slug));
  const baseWeight = Math.max(1, Number.parseInt(placement.weight, 10) || 1);
  const active = isPlacementActive(placement, now);
  const upcoming = isPlacementUpcoming(placement, now);
  const { timeUntilStartMinutes } = computeTimeMetrics(
    placement.startAt,
    placement.endAt,
    now,
  );
  const recencyBonus = active ? 4 : upcoming ? 1 : 0;
  const taxonomyBonus = taxonomyMatches.reduce((sum, match) => sum + (match.weight ?? 1), 0) * 3;
  const keywordBonus = keywordMatches.reduce((sum, match) => sum + (match.weight ?? 1), 0) * 2;
  const timeBonus =
    upcoming && timeUntilStartMinutes != null
      ? Math.max(0, 60 - Math.min(timeUntilStartMinutes, 60)) / 20
      : 0;
  return baseWeight + recencyBonus + taxonomyBonus + keywordBonus + timeBonus;
}

function decoratePlacement(placement, contextSets, now) {
  const plain = placement.get({ plain: true });
  const score = scorePlacement(plain, contextSets, now);
  const keywords = collectPlacementKeywords(plain);
  const taxonomies = collectPlacementTaxonomies(plain);
  const coupons = collectPlacementCoupons(plain, now);
  const { timeUntilStartMinutes, timeUntilEndMinutes } = computeTimeMetrics(
    plain.startAt,
    plain.endAt,
    now,
  );

  const creative = plain.creative
    ? {
        id: plain.creative.id,
        campaignId: plain.creative.campaignId,
        name: plain.creative.name,
        type: plain.creative.type,
        format: plain.creative.format ?? null,
        status: plain.creative.status,
        headline: plain.creative.headline ?? null,
        subheadline: plain.creative.subheadline ?? null,
        body: plain.creative.body ?? null,
        callToAction: plain.creative.callToAction ?? null,
        ctaUrl: plain.creative.ctaUrl ?? null,
        mediaUrl: plain.creative.mediaUrl ?? null,
        durationSeconds:
          plain.creative.durationSeconds == null
            ? null
            : Number(plain.creative.durationSeconds),
        primaryColor: plain.creative.primaryColor ?? null,
        accentColor: plain.creative.accentColor ?? null,
        metadata: plain.creative.metadata ?? null,
        campaign: plain.creative.campaign
          ? {
              id: plain.creative.campaign.id,
              name: plain.creative.campaign.name,
              objective: plain.creative.campaign.objective,
              status: plain.creative.campaign.status,
            }
          : null,
      }
    : null;

  return {
    id: plain.id,
    surface: plain.surface,
    position: plain.position,
    status: plain.status,
    weight: Number(plain.weight ?? 0),
    pacingMode: plain.pacingMode,
    maxImpressionsPerHour:
      plain.maxImpressionsPerHour == null ? null : Number(plain.maxImpressionsPerHour),
    startAt: plain.startAt ?? null,
    endAt: plain.endAt ?? null,
    opportunityType: plain.opportunityType ?? null,
    priority: Number(plain.priority ?? 0),
    metadata: plain.metadata ?? null,
    isActive: isPlacementActive(plain, now),
    isUpcoming: isPlacementUpcoming(plain, now),
    timeUntilStartMinutes,
    timeUntilEndMinutes,
    score: Number(score.toFixed(3)),
    creative,
    keywords,
    taxonomies,
    coupons,
  };
}

async function loadPlacementRecords({ surfaces, status, now }) {
  const where = {};
  if (Array.isArray(surfaces) && surfaces.length) {
    where.surface = { [Op.in]: surfaces };
  }
  if (status) {
    where.status = status;
  }
  const include = [
    {
      model: AdCreative,
      as: 'creative',
      include: [
        { model: AdCampaign, as: 'campaign' },
        {
          model: AdKeywordAssignment,
          as: 'keywordAssignments',
          include: [
            { model: AdKeyword, as: 'keyword' },
            { model: OpportunityTaxonomy, as: 'taxonomy' },
          ],
        },
      ],
    },
    {
      model: AdPlacementCoupon,
      as: 'couponLinks',
      include: [{ model: AdCoupon, as: 'coupon' }],
    },
  ];

  const placements = await AdPlacement.findAll({
    where,
    include,
    order: [
      ['surface', 'ASC'],
      ['priority', 'DESC'],
      ['weight', 'DESC'],
      ['id', 'ASC'],
    ],
  });

  if (!placements.length) {
    return [];
  }

  return placements.map((placement) => placement);
}

async function loadContextTaxonomies(opportunityTargets = []) {
  if (!opportunityTargets.length) {
    return [];
  }
  const clauses = opportunityTargets
    .map((target) => {
      if (!target.targetType || !target.ids?.length) {
        return null;
      }
      return {
        targetType: target.targetType,
        targetId: { [Op.in]: target.ids },
      };
    })
    .filter(Boolean);

  if (!clauses.length) {
    return [];
  }

  const assignments = await OpportunityTaxonomyAssignment.findAll({
    where: { [Op.or]: clauses },
    include: [{ model: OpportunityTaxonomy, as: 'taxonomy' }],
  });

  return assignments
    .map((assignment) => assignment.get({ plain: true }))
    .filter((assignment) => assignment.taxonomy);
}

function buildContextSets(context) {
  const keywordSet = new Set(context.keywordHints ?? []);
  const taxonomySet = new Set(context.taxonomySlugs ?? []);
  return { keywordSet, taxonomySet };
}

function buildOverview({
  placements,
  surfaces,
  now,
  context,
}) {
  const campaigns = new Set();
  const surfaceSummaries = new Map();
  const keywordWeights = new Map();
  const taxonomyWeights = new Map();
  let totalCoupons = 0;
  let totalActiveCoupons = 0;
  let placementsWithCoupons = 0;

  placements.forEach((placement) => {
    const creative = placement.creative ?? {};
    if (creative.campaignId) {
      campaigns.add(creative.campaignId);
    }
    const surfaceSummary = surfaceSummaries.get(placement.surface) ?? {
      surface: placement.surface,
      label: SURFACE_LABELS[placement.surface] ?? placement.surface,
      total: 0,
      active: 0,
      upcoming: 0,
      types: new Map(),
    };
    surfaceSummary.total += 1;
    if (placement.isActive) {
      surfaceSummary.active += 1;
    }
    if (placement.isUpcoming) {
      surfaceSummary.upcoming += 1;
    }
    const typeKey = creative.type ?? 'unknown';
    surfaceSummary.types.set(typeKey, (surfaceSummary.types.get(typeKey) ?? 0) + 1);
    surfaceSummaries.set(placement.surface, surfaceSummary);

    placement.keywords.forEach((entry) => {
      const key = entry.keyword.toLowerCase();
      keywordWeights.set(key, (keywordWeights.get(key) ?? 0) + (entry.weight ?? 1));
    });

    placement.taxonomies.forEach((entry) => {
      taxonomyWeights.set(entry.slug, (taxonomyWeights.get(entry.slug) ?? 0) + (entry.weight ?? 1));
    });

    const couponCount = placement.coupons?.length ?? 0;
    if (couponCount > 0) {
      placementsWithCoupons += 1;
      totalCoupons += couponCount;
      totalActiveCoupons += placement.coupons.filter((coupon) => coupon.isActive).length;
    }
  });

  const surfaceSummariesArray = Array.from(surfaceSummaries.values()).map((summary) => ({
    surface: summary.surface,
    label: summary.label,
    totalPlacements: summary.total,
    activePlacements: summary.active,
    upcomingPlacements: summary.upcoming,
    typeBreakdown: Object.fromEntries(summary.types.entries()),
  }));

  const keywordHighlights = Array.from(keywordWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([keyword, weight]) => ({ keyword, weight }));

  const taxonomyHighlights = Array.from(taxonomyWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug, weight]) => ({ slug, weight }));

  return {
    totalPlacements: placements.length,
    totalCampaigns: campaigns.size,
    activePlacements: placements.filter((placement) => placement.isActive).length,
    upcomingPlacements: placements.filter((placement) => placement.isUpcoming).length,
    surfaces: surfaceSummariesArray,
    keywordHighlights,
    taxonomyHighlights,
    totalCoupons,
    activeCoupons: totalActiveCoupons,
    placementsWithCoupons,
    context,
    generatedAt: now.toISOString(),
  };
}

function buildRecommendations({ placements, overview, context }) {
  const recommendations = [];
  const surfacesWithFewPlacements = overview.surfaces.filter(
    (surface) => surface.totalPlacements === 0,
  );
  if (surfacesWithFewPlacements.length) {
    surfacesWithFewPlacements.forEach((surface) => {
      recommendations.push(
        `Activate at least one placement on ${surface.label} to ensure the experience features Gigvora ads.`,
      );
    });
  }

  const videoCoverage = overview.surfaces.filter((surface) => (surface.typeBreakdown.video ?? 0) > 0);
  if (!videoCoverage.length) {
    recommendations.push('Schedule a hero video placement to showcase Gigvora campaigns.');
  }

  const uncoveredTaxonomies = (context.taxonomySlugs ?? []).filter((slug) =>
    !overview.taxonomyHighlights.some((entry) => entry.slug === slug),
  );
  if (uncoveredTaxonomies.length) {
    recommendations.push(
      `Create creatives targeting ${uncoveredTaxonomies
        .slice(0, 3)
        .join(', ')} to cover current opportunity categories.`,
    );
  }

  const upcomingSoon = placements.filter(
    (placement) =>
      placement.isUpcoming && placement.timeUntilStartMinutes != null && placement.timeUntilStartMinutes <= 60,
  );
  if (upcomingSoon.length) {
    recommendations.push(
      `Review ${upcomingSoon.length} placement${upcomingSoon.length === 1 ? '' : 's'} scheduled to go live within the next hour to confirm creative approvals.`,
    );
  }

  if (overview.placementsWithCoupons === 0) {
    recommendations.push(
      'Attach at least one coupon to high-visibility placements so members see current incentives alongside ads.',
    );
  } else if (overview.activeCoupons === 0) {
    recommendations.push('Enable at least one active coupon to unlock conversion-ready calls to action in ad spaces.');
  }

  if (!recommendations.length) {
    recommendations.push('Campaign coverage looks balanced across surfaces. Monitor performance and refresh creatives as needed.');
  }

  return recommendations;
}

export async function listPlacements({ surfaces, status, now = new Date() } = {}) {
  const normalizedSurfaces = normaliseSurfaceList(surfaces);
  const resolvedSurfaces = normalizedSurfaces.length ? normalizedSurfaces : DEFAULT_SURFACES;
  const placements = await loadPlacementRecords({ surfaces: resolvedSurfaces, status, now });
  const sanitizedContext = sanitizeContext({});
  const contextSets = buildContextSets({ keywordHints: [], taxonomySlugs: [] });

  return placements.map((placement) => decoratePlacement(placement, contextSets, now));
}

export async function getAdDashboardSnapshot({
  surfaces,
  context,
  limitPerSurface = MAX_PLACEMENTS_PER_SURFACE,
  now = new Date(),
  bypassCache = false,
} = {}) {
  const normalizedSurfaces = normaliseSurfaceList(surfaces);
  const resolvedSurfaces = normalizedSurfaces.length ? normalizedSurfaces : DEFAULT_SURFACES;
  const sanitizedContext = sanitizeContext(context);
  const cacheKey = buildCacheKey('ads:dashboard', {
    surfaces: resolvedSurfaces.slice().sort().join('|'),
    context: JSON.stringify(sanitizedContext),
  });

  if (!bypassCache) {
    const cached = appCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const taxonomyAssignments = await loadContextTaxonomies(sanitizedContext.opportunityTargets);
  const taxonomySlugs = taxonomyAssignments.map((assignment) => assignment.taxonomy.slug);
  const contextSets = buildContextSets({
    keywordHints: sanitizedContext.keywordHints,
    taxonomySlugs,
  });

  const [placements, trafficSignals] = await Promise.all([
    loadPlacementRecords({ surfaces: resolvedSurfaces, now }),
    loadTrafficSignals({ now }),
  ]);
  const decoratedPlacements = placements.map((placement) => decoratePlacement(placement, contextSets, now));

  const groupedBySurface = new Map();
  resolvedSurfaces.forEach((surface) => {
    groupedBySurface.set(surface, []);
  });

  decoratedPlacements.forEach((placement) => {
    const existing = groupedBySurface.get(placement.surface) ?? [];
    existing.push(placement);
    groupedBySurface.set(placement.surface, existing);
  });

  const limitedSurfaces = Array.from(groupedBySurface.entries()).map(([surface, items]) => {
    const sorted = items.sort((a, b) => b.score - a.score);
    return {
      surface,
      label: SURFACE_LABELS[surface] ?? surface,
      placements: sorted.slice(0, limitPerSurface),
      totalPlacements: sorted.length,
      upcomingPlacements: sorted.filter((item) => item.isUpcoming).length,
    };
  });

  const overview = buildOverview({
    placements: decoratedPlacements,
    surfaces: resolvedSurfaces,
    now,
    context: {
      keywordHints: sanitizedContext.keywordHints,
      taxonomySlugs,
    },
  });

  const recommendations = buildRecommendations({
    placements: decoratedPlacements,
    overview,
    context: {
      keywordHints: sanitizedContext.keywordHints,
      taxonomySlugs,
    },
  });

  const forecast = buildForecast({
    placements: decoratedPlacements,
    surfaces: limitedSurfaces,
    overview,
    trafficSignals,
    now,
  });

  const result = {
    overview,
    surfaces: limitedSurfaces,
    recommendations,
    forecast,
    generatedAt: now.toISOString(),
  };

  appCache.set(cacheKey, result, DASHBOARD_CACHE_TTL_SECONDS);
  return result;
}

export async function getPlacementsForSurface(surface, options = {}) {
  if (!surface) {
    throw new ValidationError('surface is required when requesting placement listings.');
  }
  const results = await listPlacements({
    surfaces: [surface],
    status: options.status,
    now: options.now,
  });
  return results;
}

export default {
  listPlacements,
  getPlacementsForSurface,
  getAdDashboardSnapshot,
};
