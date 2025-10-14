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
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError } from '../utils/errors.js';

const DEFAULT_SURFACES = ['global_dashboard'];
const DASHBOARD_CACHE_TTL_SECONDS = 45;
const MAX_PLACEMENTS_PER_SURFACE = 3;

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

  const placements = await loadPlacementRecords({ surfaces: resolvedSurfaces, now });
  const decoratedPlacements = placements.map((placement) =>
    decoratePlacement(placement, contextSets, now),
  );

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

  const result = {
    overview,
    surfaces: limitedSurfaces,
    recommendations,
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
