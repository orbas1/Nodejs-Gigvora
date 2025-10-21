import { AdCampaign, AdCreative, AdPlacement } from '../models/companyAdsModels.js';
import {
  ValidationError,
  NotFoundError,
} from '../utils/errors.js';
import {
  getAdDashboardSnapshot,
  listDecoratedPlacements,
  summarizePlacements,
} from './adService.js';

function sanitizeString(value) {
  if (value == null) {
    return undefined;
  }
  const trimmed = `${value}`.trim();
  return trimmed.length ? trimmed : undefined;
}

function sanitizeCurrency(value) {
  const trimmed = sanitizeString(value);
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, 8).toUpperCase();
}

function sanitizeBudgetCents(value) {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'string' && value.includes('.')) {
    const numeric = Number.parseFloat(value);
    if (Number.isNaN(numeric)) {
      throw new ValidationError('budgetCents must be a numeric value.');
    }
    return Math.round(numeric * 100);
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('budgetCents must be a numeric value.');
  }
  return Math.round(numeric);
}

function resolveOwnerId(ownerId) {
  if (ownerId == null) {
    throw new ValidationError('ownerId is required to manage Gigvora Ads.');
  }
  const numeric = Number(ownerId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('ownerId must be a positive integer.');
  }
  return numeric;
}

function toCampaignPayload(record) {
  const campaign = record?.toPublicObject?.() ?? record;
  if (!campaign) {
    return null;
  }
  const creatives = Array.isArray(record?.creatives)
    ? record.creatives.map((creative) => {
        const base = creative?.toPublicObject?.() ?? creative;
        return {
          ...base,
          placements: Array.isArray(creative?.placements)
            ? creative.placements.map((placement) => placement?.toPublicObject?.() ?? placement)
            : [],
        };
      })
    : [];
  return {
    ...campaign,
    creatives,
  };
}

function buildMetrics({ campaigns = [], placements = [], insights = null } = {}) {
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active');
  const pausedCampaigns = campaigns.filter((campaign) => campaign.status === 'paused');
  const scheduledCampaigns = campaigns.filter((campaign) => campaign.status === 'scheduled');
  const placementTotals = placements.reduce(
    (acc, placement) => {
      if (placement?.isActive) {
        acc.active += 1;
      }
      if (placement?.isUpcoming) {
        acc.upcoming += 1;
      }
      acc.total += 1;
      return acc;
    },
    { total: 0, active: 0, upcoming: 0 },
  );

  const overview = insights?.overview ?? {};
  const spend = Number(overview.spend ?? overview.totalSpend ?? 0);
  const impressions = Number(overview.impressions ?? 0);
  const clicks = Number(overview.clicks ?? 0);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  return {
    campaignTotals: {
      total: campaigns.length,
      active: activeCampaigns.length,
      paused: pausedCampaigns.length,
      scheduled: scheduledCampaigns.length,
    },
    placementTotals,
    performance: {
      impressions,
      clicks,
      spend,
      ctr,
    },
  };
}

export async function getCompanyAdsWorkspace({ ownerId, surfaces, context, bypassCache = false, now = new Date() } = {}) {
  const resolvedOwnerId = resolveOwnerId(ownerId);

  const [campaignRecords, decoratedPlacements, dashboardSnapshot] = await Promise.all([
    AdCampaign.findAll({
      where: { ownerId: resolvedOwnerId },
      order: [ ['updatedAt', 'DESC'] ],
      include: [
        {
          model: AdCreative,
          as: 'creatives',
          include: [{ model: AdPlacement, as: 'placements' }],
        },
      ],
    }),
    listDecoratedPlacements({ ownerId: resolvedOwnerId, surfaces, context, now }),
    getAdDashboardSnapshot({ surfaces, context, bypassCache, now }),
  ]);

  const campaigns = campaignRecords.map((record) => toCampaignPayload(record));
  const insights = await summarizePlacements({ placements: decoratedPlacements, context, now });
  const metrics = buildMetrics({ campaigns, placements: decoratedPlacements, insights });

  return {
    campaigns,
    placements: decoratedPlacements,
    insights,
    dashboard: dashboardSnapshot,
    metrics,
    permissions: {
      canManageCampaigns: true,
      canManageCreatives: true,
      canManagePlacements: true,
    },
    lastUpdated: new Date(now).toISOString(),
  };
}

function pickCampaignUpdate(payload = {}) {
  const update = {};
  if (payload.name != null) {
    update.name = sanitizeString(payload.name);
  }
  if (payload.objective != null) {
    update.objective = sanitizeString(payload.objective);
  }
  if (payload.status != null) {
    update.status = sanitizeString(payload.status);
  }
  if (payload.currencyCode != null) {
    update.currencyCode = sanitizeCurrency(payload.currencyCode);
  }
  if (payload.budgetCents != null || payload.budget != null) {
    const value = payload.budgetCents != null ? payload.budgetCents : Number(payload.budget) * 100;
    update.budgetCents = sanitizeBudgetCents(value);
  }
  if (payload.startDate != null) {
    update.startDate = payload.startDate ? new Date(payload.startDate) : null;
  }
  if (payload.endDate != null) {
    update.endDate = payload.endDate ? new Date(payload.endDate) : null;
  }
  if (payload.metadata != null) {
    update.metadata = payload.metadata;
  }
  return update;
}

export async function createCampaign({ ownerId, payload }) {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  const data = pickCampaignUpdate(payload);
  if (!data.name) {
    throw new ValidationError('Provide a campaign name.');
  }
  const campaign = await AdCampaign.create({
    ...data,
    ownerId: resolvedOwnerId,
  });
  return toCampaignPayload(campaign);
}

export async function updateCampaign({ ownerId, campaignId, payload }) {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!campaignId) {
    throw new ValidationError('campaignId is required.');
  }
  const campaign = await AdCampaign.findOne({
    where: { id: campaignId, ownerId: resolvedOwnerId },
  });
  if (!campaign) {
    throw new NotFoundError('Campaign not found.');
  }
  const update = pickCampaignUpdate(payload);
  await campaign.update(update);
  return toCampaignPayload(campaign);
}

export async function deleteCampaign({ ownerId, campaignId }) {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!campaignId) {
    throw new ValidationError('campaignId is required.');
  }
  const deleted = await AdCampaign.destroy({ where: { id: campaignId, ownerId: resolvedOwnerId } });
  if (!deleted) {
    throw new NotFoundError('Campaign not found.');
  }
  return { success: true };
}

function pickCreativeUpdate(payload = {}) {
  const update = {};
  if (payload.name != null) {
    update.name = sanitizeString(payload.name);
  }
  if (payload.type != null) {
    update.type = sanitizeString(payload.type);
  }
  if (payload.status != null) {
    update.status = sanitizeString(payload.status);
  }
  if (payload.format != null) {
    update.format = sanitizeString(payload.format);
  }
  if (payload.headline != null) {
    update.headline = sanitizeString(payload.headline);
  }
  if (payload.subheadline != null) {
    update.subheadline = sanitizeString(payload.subheadline);
  }
  if (payload.body != null) {
    update.body = sanitizeString(payload.body);
  }
  if (payload.callToAction != null) {
    update.callToAction = sanitizeString(payload.callToAction);
  }
  if (payload.ctaUrl != null) {
    update.ctaUrl = sanitizeString(payload.ctaUrl);
  }
  if (payload.mediaUrl != null) {
    update.mediaUrl = sanitizeString(payload.mediaUrl);
  }
  if (payload.durationSeconds != null) {
    update.durationSeconds = Number.isFinite(Number(payload.durationSeconds))
      ? Number(payload.durationSeconds)
      : null;
  }
  if (payload.primaryColor != null) {
    update.primaryColor = sanitizeString(payload.primaryColor);
  }
  if (payload.accentColor != null) {
    update.accentColor = sanitizeString(payload.accentColor);
  }
  if (payload.metadata != null) {
    update.metadata = payload.metadata;
  }
  return update;
}

async function assertCampaignOwnership({ campaignId, ownerId }) {
  const campaign = await AdCampaign.findOne({ where: { id: campaignId, ownerId } });
  if (!campaign) {
    throw new NotFoundError('Campaign not found.');
  }
  return campaign;
}

async function assertCreativeOwnership({ creativeId, ownerId }) {
  const creative = await AdCreative.findOne({
    where: { id: creativeId },
    include: [{ model: AdCampaign, as: 'campaign', where: { ownerId } }],
  });
  if (!creative) {
    throw new NotFoundError('Creative not found.');
  }
  return creative;
}

export async function createCreative({ ownerId, campaignId, payload }) {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!campaignId) {
    throw new ValidationError('campaignId is required.');
  }
  await assertCampaignOwnership({ campaignId, ownerId: resolvedOwnerId });
  const data = pickCreativeUpdate(payload);
  if (!data.name) {
    throw new ValidationError('Provide a creative name.');
  }
  if (!data.type) {
    throw new ValidationError('Select a creative type.');
  }
  const creative = await AdCreative.create({
    ...data,
    campaignId,
  });
  return creative.toPublicObject();
}

export async function updateCreative({ ownerId, creativeId, payload }) {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!creativeId) {
    throw new ValidationError('creativeId is required.');
  }
  const creative = await assertCreativeOwnership({ creativeId, ownerId: resolvedOwnerId });
  const data = pickCreativeUpdate(payload);
  await creative.update(data);
  return creative.toPublicObject();
}

export async function deleteCreative({ ownerId, creativeId }) {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!creativeId) {
    throw new ValidationError('creativeId is required.');
  }
  const creative = await assertCreativeOwnership({ creativeId, ownerId: resolvedOwnerId });
  await creative.destroy();
  return { success: true };
}

function pickPlacementUpdate(payload = {}) {
  const update = {};
  if (payload.surface != null) {
    update.surface = sanitizeString(payload.surface);
  }
  if (payload.position != null) {
    update.position = sanitizeString(payload.position);
  }
  if (payload.status != null) {
    update.status = sanitizeString(payload.status);
  }
  if (payload.pacingMode != null) {
    update.pacingMode = sanitizeString(payload.pacingMode);
  }
  if (payload.weight != null) {
    update.weight = Number.isFinite(Number(payload.weight)) ? Number(payload.weight) : 1;
  }
  if (payload.maxImpressionsPerHour != null) {
    update.maxImpressionsPerHour = Number.isFinite(Number(payload.maxImpressionsPerHour))
      ? Number(payload.maxImpressionsPerHour)
      : null;
  }
  if (payload.priority != null) {
    update.priority = Number.isFinite(Number(payload.priority)) ? Number(payload.priority) : 0;
  }
  if (payload.startAt !== undefined) {
    update.startAt = payload.startAt ? new Date(payload.startAt) : null;
  }
  if (payload.endAt !== undefined) {
    update.endAt = payload.endAt ? new Date(payload.endAt) : null;
  }
  if (payload.opportunityType != null) {
    update.opportunityType = sanitizeString(payload.opportunityType);
  }
  if (payload.metadata != null) {
    update.metadata = payload.metadata;
  }
  return update;
}

export async function createPlacement({ ownerId, creativeId, payload }) {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!creativeId) {
    throw new ValidationError('creativeId is required.');
  }
  const creative = await assertCreativeOwnership({ creativeId, ownerId: resolvedOwnerId });
  const data = pickPlacementUpdate(payload);
  if (!data.surface) {
    throw new ValidationError('Choose an ad surface.');
  }
  if (!data.position) {
    throw new ValidationError('Choose a placement position.');
  }
  if (!data.status) {
    data.status = 'scheduled';
  }
  const placement = await AdPlacement.create({
    ...data,
    creativeId: creative.id,
  });
  return placement.toPublicObject();
}

export async function updatePlacement({ ownerId, placementId, payload }) {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!placementId) {
    throw new ValidationError('placementId is required.');
  }
  const placement = await AdPlacement.findOne({
    where: { id: placementId },
    include: [
      {
        model: AdCreative,
        as: 'creative',
        include: [{ model: AdCampaign, as: 'campaign', where: { ownerId: resolvedOwnerId } }],
      },
    ],
  });
  if (!placement) {
    throw new NotFoundError('Placement not found.');
  }
  const data = pickPlacementUpdate(payload);
  await placement.update(data);
  return placement.toPublicObject();
}

export async function deletePlacement({ ownerId, placementId }) {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!placementId) {
    throw new ValidationError('placementId is required.');
  }
  const placement = await AdPlacement.findOne({
    where: { id: placementId },
    include: [
      {
        model: AdCreative,
        as: 'creative',
        include: [{ model: AdCampaign, as: 'campaign', where: { ownerId: resolvedOwnerId } }],
      },
    ],
  });
  if (!placement) {
    throw new NotFoundError('Placement not found.');
  }
  await placement.destroy();
  return { success: true };
}

export async function togglePlacementStatus({ ownerId, placementId }) {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!placementId) {
    throw new ValidationError('placementId is required.');
  }
  const placement = await AdPlacement.findOne({
    where: { id: placementId },
    include: [
      {
        model: AdCreative,
        as: 'creative',
        include: [{ model: AdCampaign, as: 'campaign', where: { ownerId: resolvedOwnerId } }],
      },
    ],
  });
  if (!placement) {
    throw new NotFoundError('Placement not found.');
  }
  const nextStatus = placement.status === 'active' ? 'paused' : 'active';
  await placement.update({ status: nextStatus });
  return placement.toPublicObject();
}

export default {
  getCompanyAdsWorkspace,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  createCreative,
  updateCreative,
  deleteCreative,
  createPlacement,
  updatePlacement,
  deletePlacement,
  togglePlacementStatus,
};
