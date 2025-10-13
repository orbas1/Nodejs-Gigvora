import {
  User,
  Profile,
  FreelancerProfile,
  Gig,
  GigMilestone,
  GigBundle,
  GigBundleItem,
  GigUpsell,
  GigCatalogItem,
} from '../models/index.js';
import { ValidationError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const CACHE_NAMESPACE = 'dashboard:gig-manager';
const CACHE_TTL_SECONDS = 60;

const PIPELINE_STAGE_METADATA = {
  discovery: {
    label: 'Discovery',
    recommendedAction: 'Qualify requirements and confirm scope with client.',
  },
  kickoff: {
    label: 'Kickoff',
    recommendedAction: 'Schedule kickoff call and deliver onboarding survey.',
  },
  production: {
    label: 'Production',
    recommendedAction: 'Run production stand-ups and unblock delivery pods.',
  },
  review: {
    label: 'Review',
    recommendedAction: 'Collect approvals and route revisions.',
  },
  ready_to_close: {
    label: 'Ready to close',
    recommendedAction: 'Prepare invoice and release escrow milestones.',
  },
  completed: {
    label: 'Completed',
    recommendedAction: 'Request testimonial and publish case study.',
  },
};

const ATTENTION_STATUSES = new Set(['at_risk']);
const WAITING_STATUSES = new Set(['waiting_on_client']);
const ACTIVE_GIG_STATUSES = new Set(['active', 'in_delivery', 'ready_to_close']);

function normalizeFreelancerId(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return parsed;
}

function dominantCurrency(records, fallback = 'USD') {
  const counts = new Map();
  records.forEach((record) => {
    const currency = (record?.currency ?? fallback).toUpperCase();
    counts.set(currency, (counts.get(currency) ?? 0) + 1);
  });
  let top = fallback;
  let max = 0;
  counts.forEach((count, currency) => {
    if (count > max) {
      top = currency;
      max = count;
    }
  });
  return top;
}

function computePipelineStages(gigs, milestones, currency) {
  const stages = [];
  const milestoneByGig = new Map();
  milestones.forEach((milestone) => {
    const list = milestoneByGig.get(milestone.gigId) ?? [];
    list.push(milestone);
    milestoneByGig.set(milestone.gigId, list);
  });

  Object.entries(PIPELINE_STAGE_METADATA).forEach(([key, metadata]) => {
    const stageGigs = gigs.filter((gig) => gig.pipelineStage === key);
    const totalValueCents = stageGigs.reduce((sum, gig) => sum + (gig.contractValueCents ?? 0), 0);
    let overdueCount = 0;
    let waitingCount = 0;
    let attentionCount = 0;

    stageGigs.forEach((gig) => {
      const relatedMilestones = milestoneByGig.get(gig.id) ?? [];
      relatedMilestones.forEach((milestone) => {
        if (!milestone.dueDate || milestone.status === 'completed') {
          return;
        }
        const dueTime = new Date(milestone.dueDate).getTime();
        if (Number.isNaN(dueTime)) {
          return;
        }
        if (dueTime < Date.now() && milestone.status !== 'completed') {
          overdueCount += 1;
        }
        if (WAITING_STATUSES.has(milestone.status)) {
          waitingCount += 1;
        }
        if (ATTENTION_STATUSES.has(milestone.status)) {
          attentionCount += 1;
        }
      });
    });

    let statusLabel = 'On track';
    let statusCategory = 'healthy';
    if (waitingCount > 0) {
      statusLabel = 'Waiting on client';
      statusCategory = 'waiting';
    }
    if (overdueCount > 0 || attentionCount > 0) {
      statusLabel = 'Needs attention';
      statusCategory = 'attention';
    }
    if (stageGigs.length === 0) {
      statusLabel = 'Idle';
      statusCategory = 'idle';
    }

    stages.push({
      stage: key,
      label: metadata.label,
      gigCount: stageGigs.length,
      totalValueCents,
      currency,
      recommendedAction: metadata.recommendedAction,
      statusLabel,
      statusCategory,
      overdueMilestones: overdueCount,
    });
  });

  return stages;
}

function mapMilestoneStatus(status) {
  switch (status) {
    case 'completed':
      return { label: 'Completed', category: 'healthy' };
    case 'waiting_on_client':
      return { label: 'Waiting on client', category: 'waiting' };
    case 'at_risk':
      return { label: 'At risk', category: 'attention' };
    case 'in_progress':
      return { label: 'In progress', category: 'healthy' };
    case 'planned':
    default:
      return { label: 'Planned', category: 'idle' };
  }
}

function summarizeGigs(gigs, upsells, bundles) {
  const activeClients = new Set();
  let pipelineValueCents = 0;
  let previousPipelineValueCents = 0;
  let upsellEligibleValueCents = 0;
  let csatScoreSum = 0;
  let csatPrevSum = 0;
  let csatCount = 0;
  let reviewCount = 0;
  let activeGigCount = 0;

  gigs.forEach((gig) => {
    if (!['completed', 'cancelled'].includes(gig.status)) {
      pipelineValueCents += gig.contractValueCents ?? 0;
      previousPipelineValueCents += gig.previousPipelineValueCents ?? 0;
      upsellEligibleValueCents += gig.upsellEligibleValueCents ?? 0;
      if (ACTIVE_GIG_STATUSES.has(gig.status)) {
        activeGigCount += 1;
      }
    }
    if (gig.clientName) {
      activeClients.add(gig.clientName.trim().toLowerCase());
    }
    if (gig.csatScore != null) {
      csatScoreSum += Number(gig.csatScore);
      csatCount += 1;
    }
    if (gig.csatPreviousScore != null) {
      csatPrevSum += Number(gig.csatPreviousScore);
    }
    reviewCount += Number(gig.csatResponseCount ?? 0);
  });

  const averageCsat = csatCount > 0 ? csatScoreSum / csatCount : null;
  const previousAverageCsat = csatCount > 0 ? csatPrevSum / csatCount : null;
  const csatDelta =
    averageCsat != null && previousAverageCsat != null ? averageCsat - previousAverageCsat : null;

  const upsellConversionValues = upsells.filter((upsell) => upsell.conversionRate != null);
  const upsellConversionRate =
    upsellConversionValues.length > 0
      ?
          upsellConversionValues.reduce((sum, upsell) => sum + Number(upsell.conversionRate), 0) /
        upsellConversionValues.length
      : null;
  const upsellConversionChange =
    upsellConversionValues.length > 0
      ?
          upsellConversionValues.reduce((sum, upsell) => sum + Number(upsell.conversionChange ?? 0), 0) /
        upsellConversionValues.length
      : null;
  const upsellPlaybooksActive = upsells.filter((upsell) => ['running', 'pilot'].includes(upsell.status)).length;
  const upsellEstimatedValueCents = upsells.reduce(
    (sum, upsell) => sum + (upsell.estimatedValueCents ?? 0),
    0,
  );

  const bundleValues = bundles.filter((bundle) => bundle.attachRate != null);
  const averageBundleAttachRate =
    bundleValues.length > 0
      ? bundleValues.reduce((sum, bundle) => sum + Number(bundle.attachRate), 0) / bundleValues.length
      : null;
  const bundleAttachChange =
    bundleValues.length > 0
      ?
          bundleValues.reduce((sum, bundle) => sum + Number(bundle.attachRateChange ?? 0), 0) /
        bundleValues.length
      : null;

  const pipelineDelta =
    previousPipelineValueCents > 0
      ? ((pipelineValueCents - previousPipelineValueCents) / previousPipelineValueCents) * 100
      : pipelineValueCents > 0
      ? 100
      : 0;

  return {
    activeGigs: activeGigCount,
    clientsActive: activeClients.size,
    pipelineValueCents,
    previousPipelineValueCents,
    pipelineValueChangePercent: pipelineDelta,
    upsellEligibleValueCents,
    averageCsat,
    csatDelta,
    recentReviewCount: reviewCount,
    upsellConversionRate,
    upsellConversionChange,
    upsellPlaybooksActive,
    upsellEstimatedValueCents,
    bundlesLive: bundles.filter((bundle) => bundle.status === 'live').length,
    averageBundleAttachRate,
    bundleAttachChange,
  };
}

function computeMilestoneSummaries(gigs, milestones) {
  const gigLookup = new Map(gigs.map((gig) => [gig.id, gig]));
  const upcomingMilestones = milestones
    .filter((milestone) => milestone.status !== 'completed')
    .map((milestone) => {
      const gig = gigLookup.get(milestone.gigId);
      const statusMeta = mapMilestoneStatus(milestone.status);
      return {
        id: milestone.id,
        gigId: milestone.gigId,
        gigTitle: gig?.title ?? `Gig #${milestone.gigId}`,
        clientName: gig?.clientName ?? null,
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.dueDate,
        status: milestone.status,
        statusLabel: statusMeta.label,
        statusCategory: statusMeta.category,
        ownerName: milestone.ownerName,
        progressPercent: milestone.progressPercent,
      };
    })
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  return upcomingMilestones;
}

function dueWithinDays(milestone, days) {
  if (!milestone.dueDate) {
    return false;
  }
  const due = new Date(milestone.dueDate);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  const now = Date.now();
  const horizon = now + days * 24 * 60 * 60 * 1000;
  return due.getTime() <= horizon;
}

async function loadSnapshot(freelancerId) {
  const freelancer = await User.findByPk(freelancerId, {
    attributes: ['id', 'firstName', 'lastName', 'userType'],
    include: [
      { model: Profile, attributes: ['headline', 'timezone', 'location'] },
      { model: FreelancerProfile, attributes: ['title', 'availability', 'hourlyRate'] },
    ],
  });

  if (!freelancer) {
    throw new ValidationError('Freelancer not found.');
  }

  const [gigRecords, bundleRecords, upsellRecords, catalogRecords] = await Promise.all([
    Gig.findAll({
      where: { freelancerId },
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: GigMilestone,
          as: 'milestones',
          separate: true,
          order: [['sequenceIndex', 'ASC']],
        },
      ],
    }),
    GigBundle.findAll({
      where: { freelancerId },
      order: [['status', 'ASC'], ['name', 'ASC']],
      include: [
        {
          model: GigBundleItem,
          as: 'items',
          separate: true,
          order: [['orderIndex', 'ASC']],
        },
      ],
    }),
    GigUpsell.findAll({
      where: { freelancerId },
      order: [['status', 'ASC'], ['name', 'ASC']],
    }),
    GigCatalogItem.findAll({
      where: { freelancerId },
      order: [['status', 'ASC'], ['title', 'ASC']],
    }),
  ]);

  const gigs = gigRecords.map((record) => {
    const plain = record.toPublicObject();
    const milestones = (record.milestones ?? []).map((milestone) => milestone.toPublicObject());
    return { ...plain, milestones };
  });
  const milestones = gigs.flatMap((gig) => gig.milestones);
  const bundles = bundleRecords.map((bundle) => {
    const plain = bundle.toPublicObject();
    const items = (bundle.items ?? []).map((item) => item.toPublicObject());
    return { ...plain, items };
  });
  const upsells = upsellRecords.map((upsell) => upsell.toPublicObject());
  const catalog = catalogRecords.map((item) => item.toPublicObject());

  const currency = dominantCurrency(gigs, 'USD');
  const pipelineStages = computePipelineStages(gigs, milestones, currency);
  const summary = summarizeGigs(gigs, upsells, bundles);
  const milestoneSummaries = computeMilestoneSummaries(gigs, milestones);
  const dueThisWeek = milestoneSummaries.filter((milestone) => dueWithinDays(milestone, 7)).length;

  const initials = `${freelancer.firstName?.charAt(0) ?? ''}${freelancer.lastName?.charAt(0) ?? ''}`.trim().toUpperCase();

  const freelancerProfile = freelancer.FreelancerProfile ?? freelancer.freelancerProfile ?? null;
  const baseProfile = freelancer.Profile ?? freelancer.profile ?? null;

  return {
    generatedAt: new Date().toISOString(),
    freelancer: {
      id: freelancer.id,
      firstName: freelancer.firstName,
      lastName: freelancer.lastName,
      initials: initials || freelancer.firstName?.charAt(0)?.toUpperCase() || 'F',
      title: freelancerProfile?.title ?? baseProfile?.headline ?? 'Freelancer',
      timezone: baseProfile?.timezone ?? null,
      location: baseProfile?.location ?? null,
      availability: freelancerProfile?.availability ?? null,
      activeClients: summary.clientsActive,
      averageCsat: summary.averageCsat,
      csatDelta: summary.csatDelta,
      recentReviewCount: summary.recentReviewCount,
    },
    summary: {
      ...summary,
      currency,
      dueThisWeek,
    },
    gigs,
    pipeline: pipelineStages,
    milestones: milestoneSummaries,
    bundles,
    upsells,
    catalog,
  };
}

export async function getGigManagerSnapshot(freelancerId, { bypassCache = false } = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { freelancerId: normalizedId });

  if (bypassCache) {
    return loadSnapshot(normalizedId);
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, () => loadSnapshot(normalizedId));
}

export default {
  getGigManagerSnapshot,
};
