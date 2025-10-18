import { Op } from 'sequelize';

import {
  AD_OBJECTIVES,
  AD_PACING_MODES,
  AD_POSITION_TYPES,
  AD_STATUSES,
  AD_SURFACE_TYPES,
  AD_SURFACE_LAYOUT_MODES,
  AD_TYPES,
  AD_OPPORTUNITY_TYPES,
} from '../models/constants/index.js';
import {
  AdSurfaceSetting,
  AdCampaign,
  AdCreative,
  AdPlacement,
  AdPlacementCoupon,
  AdCoupon,
  AdKeywordAssignment,
  AdKeyword,
  OpportunityTaxonomy,
  sequelize,
} from '../models/index.js';
import { appCache } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_SURFACE_LABELS = {
  global_dashboard: 'Gigvora network',
  company_dashboard: 'Company dashboard',
  agency_dashboard: 'Agency dashboard',
  freelancer_dashboard: 'Freelancer dashboard',
  user_dashboard: 'Member dashboard',
  headhunter_dashboard: 'Headhunter dashboard',
  admin_dashboard: 'Admin control centre',
  pipeline_dashboard: 'Pipeline operations',
};

const DEFAULT_SURFACE_DESCRIPTIONS = {
  global_dashboard: 'Primary network placements surfaced across member experiences.',
  company_dashboard: 'Placements tailored for employer stakeholders and partners.',
  agency_dashboard: 'Campaign inventory aligned to agency collaboration workspaces.',
  freelancer_dashboard: 'Creative rotations promoted to independent operators.',
  user_dashboard: 'Ads surfaced to the member portal and learning journeys.',
  headhunter_dashboard: 'Inventory for recruiter-facing prospecting tools.',
  admin_dashboard: 'Administrative placements for platform operations.',
  pipeline_dashboard: 'Performance marketing slots inside pipeline workboards.',
};

function invalidateAdsCache() {
  if (typeof appCache?.flushByPrefix === 'function') {
    appCache.flushByPrefix('ads:');
  }
}

function normalizeSurfaceSlug(value) {
  if (!value) {
    return null;
  }
  const slug = `${value}`
    .trim()
    .toLowerCase();
  return slug && AD_SURFACE_TYPES.includes(slug) ? slug : null;
}

function ensureSurfaceExists(surface) {
  const normalized = normalizeSurfaceSlug(surface);
  if (!normalized) {
    throw new ValidationError('surface must be a recognised Gigvora ads surface.');
  }
  return normalized;
}

function ensureEnum(value, allowed, field) {
  if (value == null) {
    return undefined;
  }
  const normalised = `${value}`.trim();
  if (!allowed.includes(normalised)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return normalised;
}

function toBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function toNumber(value, { min, max, fallback = undefined } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Numeric value is invalid.');
  }
  if (min != null && numeric < min) {
    throw new ValidationError(`Value must be greater than or equal to ${min}.`);
  }
  if (max != null && numeric > max) {
    throw new ValidationError(`Value must be less than or equal to ${max}.`);
  }
  return numeric;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('Date value is invalid.');
  }
  return parsed;
}

function buildSurfaceSnapshot(records = []) {
  const map = new Map(records.map((record) => [record.surface, record.toPublicObject()]));
  return AD_SURFACE_TYPES.map((surface) => {
    if (map.has(surface)) {
      return map.get(surface);
    }
    const label = DEFAULT_SURFACE_LABELS[surface] ?? surface;
    return {
      id: null,
      surface,
      name: label,
      description: DEFAULT_SURFACE_DESCRIPTIONS[surface] ?? null,
      heroImageUrl: null,
      layoutMode: 'inline',
      isActive: true,
      supportsCoupons: true,
      placementLimit: 3,
      defaultPosition: surface === 'global_dashboard' ? 'hero' : 'inline',
      metadata: null,
      createdAt: null,
      updatedAt: null,
    };
  });
}

function buildSurfaceLabelMap(surfaces = []) {
  const map = new Map();
  surfaces.forEach((surface) => {
    map.set(surface.surface, surface.name ?? DEFAULT_SURFACE_LABELS[surface.surface] ?? surface.surface);
  });
  return map;
}

function sanitizeSurfacePayload(payload = {}) {
  const result = {};
  if (payload.name != null) {
    const name = `${payload.name}`.trim();
    if (!name) {
      throw new ValidationError('name is required for surface settings.');
    }
    if (name.length > 120) {
      throw new ValidationError('name must be 120 characters or fewer.');
    }
    result.name = name;
  }
  if (payload.description != null) {
    const description = `${payload.description}`.trim();
    result.description = description || null;
  }
  if (payload.heroImageUrl != null) {
    const url = `${payload.heroImageUrl}`.trim();
    if (url.length > 1024) {
      throw new ValidationError('heroImageUrl must be 1024 characters or fewer.');
    }
    result.heroImageUrl = url || null;
  }
  if (payload.layoutMode != null) {
    result.layoutMode = ensureEnum(payload.layoutMode, AD_SURFACE_LAYOUT_MODES, 'layoutMode');
  }
  if (payload.defaultPosition != null) {
    result.defaultPosition = ensureEnum(payload.defaultPosition, AD_POSITION_TYPES, 'defaultPosition');
  }
  if (payload.metadata != null) {
    if (typeof payload.metadata !== 'object') {
      throw new ValidationError('metadata must be an object if provided.');
    }
    result.metadata = payload.metadata;
  }
  if (payload.placementLimit !== undefined) {
    result.placementLimit = toNumber(payload.placementLimit, { min: 1, max: 20, fallback: 3 });
  }
  if (payload.isActive !== undefined) {
    result.isActive = toBoolean(payload.isActive);
  }
  if (payload.supportsCoupons !== undefined) {
    result.supportsCoupons = toBoolean(payload.supportsCoupons, true);
  }
  return result;
}

function sanitizeCampaignPayload(payload = {}) {
  const result = {};
  if (payload.name != null) {
    const name = `${payload.name}`.trim();
    if (!name) {
      throw new ValidationError('Campaign name is required.');
    }
    if (name.length > 255) {
      throw new ValidationError('Campaign name must be 255 characters or fewer.');
    }
    result.name = name;
  }
  if (payload.objective != null) {
    result.objective = ensureEnum(payload.objective, AD_OBJECTIVES, 'objective');
  }
  if (payload.status != null) {
    result.status = ensureEnum(payload.status, AD_STATUSES, 'status');
  }
  if (payload.currencyCode != null) {
    const currency = `${payload.currencyCode}`.trim().toUpperCase();
    if (currency.length > 8) {
      throw new ValidationError('currencyCode must be 8 characters or fewer.');
    }
    result.currencyCode = currency || null;
  }
  if (payload.budgetCents !== undefined) {
    const budget = toNumber(payload.budgetCents, { min: 0 });
    result.budgetCents = budget == null ? null : Math.round(budget);
  }
  if (payload.startDate !== undefined) {
    result.startDate = parseDate(payload.startDate);
  }
  if (payload.endDate !== undefined) {
    result.endDate = parseDate(payload.endDate);
  }
  if (payload.metadata != null) {
    if (typeof payload.metadata !== 'object') {
      throw new ValidationError('metadata must be an object if provided.');
    }
    result.metadata = payload.metadata;
  }
  if (payload.ownerId !== undefined) {
    result.ownerId = payload.ownerId == null ? null : Math.round(Number(payload.ownerId));
  }
  return result;
}

function sanitizeCreativePayload(payload = {}) {
  const result = {};
  if (payload.name != null) {
    const name = `${payload.name}`.trim();
    if (!name) {
      throw new ValidationError('Creative name is required.');
    }
    if (name.length > 255) {
      throw new ValidationError('Creative name must be 255 characters or fewer.');
    }
    result.name = name;
  }
  if (payload.type != null) {
    result.type = ensureEnum(payload.type, AD_TYPES, 'type');
  }
  if (payload.status != null) {
    result.status = ensureEnum(payload.status, AD_STATUSES, 'status');
  }
  if (payload.format != null) {
    const format = `${payload.format}`.trim();
    result.format = format || null;
  }
  if (payload.headline != null) {
    const headline = `${payload.headline}`.trim();
    result.headline = headline || null;
  }
  if (payload.subheadline != null) {
    const subheadline = `${payload.subheadline}`.trim();
    result.subheadline = subheadline || null;
  }
  if (payload.body != null) {
    const body = `${payload.body}`.trim();
    result.body = body || null;
  }
  if (payload.callToAction != null) {
    const cta = `${payload.callToAction}`.trim();
    result.callToAction = cta || null;
  }
  if (payload.ctaUrl != null) {
    const url = `${payload.ctaUrl}`.trim();
    result.ctaUrl = url || null;
  }
  if (payload.mediaUrl != null) {
    const media = `${payload.mediaUrl}`.trim();
    result.mediaUrl = media || null;
  }
  if (payload.durationSeconds !== undefined) {
    const seconds = toNumber(payload.durationSeconds, { min: 0 });
    result.durationSeconds = seconds == null ? null : Math.round(seconds);
  }
  if (payload.primaryColor != null) {
    const color = `${payload.primaryColor}`.trim();
    result.primaryColor = color || null;
  }
  if (payload.accentColor != null) {
    const color = `${payload.accentColor}`.trim();
    result.accentColor = color || null;
  }
  if (payload.metadata != null) {
    if (typeof payload.metadata !== 'object') {
      throw new ValidationError('metadata must be an object if provided.');
    }
    result.metadata = payload.metadata;
  }
  return result;
}

function sanitizePlacementPayload(payload = {}) {
  const result = {};
  if (payload.creativeId != null) {
    const creativeId = Number.parseInt(payload.creativeId, 10);
    if (!Number.isInteger(creativeId) || creativeId <= 0) {
      throw new ValidationError('creativeId must be a positive integer.');
    }
    result.creativeId = creativeId;
  }
  if (payload.surface != null) {
    result.surface = ensureSurfaceExists(payload.surface);
  }
  if (payload.position != null) {
    result.position = ensureEnum(payload.position, AD_POSITION_TYPES, 'position');
  }
  if (payload.status != null) {
    result.status = ensureEnum(payload.status, AD_STATUSES, 'status');
  }
  if (payload.pacingMode != null) {
    result.pacingMode = ensureEnum(payload.pacingMode, AD_PACING_MODES, 'pacingMode');
  }
  if (payload.opportunityType != null) {
    result.opportunityType = ensureEnum(payload.opportunityType, AD_OPPORTUNITY_TYPES, 'opportunityType');
  }
  if (payload.weight !== undefined) {
    result.weight = toNumber(payload.weight, { min: 1, max: 100, fallback: 1 });
  }
  if (payload.priority !== undefined) {
    result.priority = toNumber(payload.priority, { min: 0, max: 1000, fallback: 0 });
  }
  if (payload.maxImpressionsPerHour !== undefined) {
    const maxImpressions = toNumber(payload.maxImpressionsPerHour, { min: 0, fallback: null });
    result.maxImpressionsPerHour = maxImpressions == null ? null : Math.round(maxImpressions);
  }
  if (payload.startAt !== undefined) {
    result.startAt = parseDate(payload.startAt);
  }
  if (payload.endAt !== undefined) {
    result.endAt = parseDate(payload.endAt);
  }
  if (payload.metadata != null) {
    if (typeof payload.metadata !== 'object') {
      throw new ValidationError('metadata must be an object if provided.');
    }
    result.metadata = payload.metadata;
  }
  const couponIds = Array.isArray(payload.couponIds)
    ? payload.couponIds
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0)
    : [];
  return { ...result, couponIds };
}

async function mapPlacementRecord(record, surfaceLabels) {
  if (!record) {
    return null;
  }
  const plain = record.get({ plain: true });
  const couponLinks = plain.couponLinks || [];
  const keywords = Array.isArray(plain.creative?.keywordAssignments)
    ? plain.creative.keywordAssignments
        .map((assignment) => ({
          keyword: assignment.keyword?.keyword ?? null,
          weight: assignment.weight ?? 0,
        }))
        .filter((entry) => entry.keyword)
    : [];
  const taxonomies = Array.isArray(plain.creative?.keywordAssignments)
    ? plain.creative.keywordAssignments
        .map((assignment) => ({
          slug: assignment.taxonomy?.slug ?? null,
        }))
        .filter((entry) => entry.slug)
    : [];

  return {
    id: plain.id,
    creativeId: plain.creativeId,
    surface: plain.surface,
    surfaceLabel: surfaceLabels.get(plain.surface) ?? DEFAULT_SURFACE_LABELS[plain.surface] ?? plain.surface,
    position: plain.position,
    status: plain.status,
    weight: Number(plain.weight ?? 0),
    pacingMode: plain.pacingMode,
    maxImpressionsPerHour: plain.maxImpressionsPerHour == null ? null : Number(plain.maxImpressionsPerHour),
    startAt: plain.startAt ?? null,
    endAt: plain.endAt ?? null,
    opportunityType: plain.opportunityType ?? null,
    priority: Number(plain.priority ?? 0),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    coupons: couponLinks
      .map((link) => ({
        id: link.coupon?.id ?? link.couponId,
        couponId: link.couponId,
        priority: Number(link.priority ?? 0),
        code: link.coupon?.code ?? null,
        name: link.coupon?.name ?? null,
      }))
      .filter((link) => link.couponId),
    creative: plain.creative
      ? {
          id: plain.creative.id,
          campaignId: plain.creative.campaignId,
          name: plain.creative.name,
          type: plain.creative.type,
          status: plain.creative.status,
          headline: plain.creative.headline ?? null,
          subheadline: plain.creative.subheadline ?? null,
          callToAction: plain.creative.callToAction ?? null,
          ctaUrl: plain.creative.ctaUrl ?? null,
        }
      : null,
    keywords,
    taxonomies,
  };
}

async function fetchPlacement(placementId, surfaceLabels, transaction) {
  const placement = await AdPlacement.findByPk(placementId, {
    include: [
      {
        model: AdCreative,
        as: 'creative',
        include: [
          AdKeywordAssignment
            ? {
                model: AdKeywordAssignment,
                as: 'keywordAssignments',
                include: [
                  AdKeyword ? { model: AdKeyword, as: 'keyword' } : null,
                  OpportunityTaxonomy ? { model: OpportunityTaxonomy, as: 'taxonomy' } : null,
                ].filter(Boolean),
              }
            : null,
        ].filter(Boolean),
      },
      {
        model: AdPlacementCoupon,
        as: 'couponLinks',
        include: AdCoupon ? [{ model: AdCoupon, as: 'coupon' }] : [],
      },
    ],
    transaction,
  });
  if (!placement) {
    throw new NotFoundError('Placement not found.');
  }
  return mapPlacementRecord(placement, surfaceLabels);
}

async function resolveCoupons(couponIds = [], transaction) {
  if (!couponIds.length) {
    return [];
  }
  const records = await AdCoupon.findAll({
    where: { id: { [Op.in]: couponIds } },
    transaction,
  });
  return records.map((record) => record.id);
}

export async function getAdsSettingsSnapshot() {
  const [surfaceRecords, campaignRecords, creativeRecords, placementRecords, couponRecords] = await Promise.all([
    AdSurfaceSetting?.findAll ? AdSurfaceSetting.findAll({ order: [['surface', 'ASC']] }) : [],
    AdCampaign?.findAll ? AdCampaign.findAll({ order: [['createdAt', 'DESC']] }) : [],
    AdCreative?.findAll
      ? AdCreative.findAll({
          include: [AdCampaign ? { model: AdCampaign, as: 'campaign' } : null],
          order: [
            ['createdAt', 'DESC'],
          ],
        })
      : [],
    AdPlacement?.findAll
      ? AdPlacement.findAll({
          include: [
            {
              model: AdCreative,
              as: 'creative',
              include: [
                AdKeywordAssignment
                  ? {
                      model: AdKeywordAssignment,
                      as: 'keywordAssignments',
                      include: [
                        AdKeyword ? { model: AdKeyword, as: 'keyword' } : null,
                        OpportunityTaxonomy ? { model: OpportunityTaxonomy, as: 'taxonomy' } : null,
                      ].filter(Boolean),
                    }
                  : null,
                AdCampaign ? { model: AdCampaign, as: 'campaign' } : null,
              ].filter(Boolean),
            },
            {
              model: AdPlacementCoupon,
              as: 'couponLinks',
              include: AdCoupon ? [{ model: AdCoupon, as: 'coupon' }] : [],
            },
          ],
          order: [
            ['surface', 'ASC'],
            ['priority', 'DESC'],
            ['createdAt', 'DESC'],
          ],
        })
      : [],
    AdCoupon?.findAll ? AdCoupon.findAll({ order: [['createdAt', 'DESC']] }) : [],
  ]);

  const surfaces = buildSurfaceSnapshot(surfaceRecords);
  const surfaceLabels = buildSurfaceLabelMap(surfaces);
  const campaigns = campaignRecords.map((record) => record.toPublicObject());
  const creatives = creativeRecords.map((record) => {
    const plain = record.get({ plain: true });
    return {
      id: plain.id,
      campaignId: plain.campaignId,
      campaignName: plain.campaign?.name ?? null,
      name: plain.name,
      type: plain.type,
      format: plain.format ?? null,
      status: plain.status,
      headline: plain.headline ?? null,
      subheadline: plain.subheadline ?? null,
      callToAction: plain.callToAction ?? null,
      ctaUrl: plain.ctaUrl ?? null,
      mediaUrl: plain.mediaUrl ?? null,
      durationSeconds: plain.durationSeconds == null ? null : Number(plain.durationSeconds),
      primaryColor: plain.primaryColor ?? null,
      accentColor: plain.accentColor ?? null,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  });
  const placements = await Promise.all(
    placementRecords.map((record) => mapPlacementRecord(record, surfaceLabels)),
  );
  const coupons = couponRecords.map((record) => record.toPublicObject());

  return {
    surfaces,
    campaigns,
    creatives,
    placements,
    coupons,
    enums: {
      surfaces: AD_SURFACE_TYPES,
      layoutModes: AD_SURFACE_LAYOUT_MODES,
      positions: AD_POSITION_TYPES,
      statuses: AD_STATUSES,
      pacingModes: AD_PACING_MODES,
      objectives: AD_OBJECTIVES,
      adTypes: AD_TYPES,
      opportunityTypes: AD_OPPORTUNITY_TYPES,
    },
  };
}

export async function upsertSurfaceSetting(surface, payload = {}, { actorId } = {}) {
  const slug = ensureSurfaceExists(surface);
  const sanitized = sanitizeSurfacePayload(payload);
  if (!sanitized.name) {
    throw new ValidationError('name is required for surface settings.');
  }
  sanitized.updatedById = actorId ?? null;
  if (!sanitized.layoutMode) {
    sanitized.layoutMode = 'inline';
  }
  if (!sanitized.defaultPosition) {
    sanitized.defaultPosition = 'inline';
  }
  if (!sanitized.placementLimit) {
    sanitized.placementLimit = 3;
  }

  const [record] = await AdSurfaceSetting.upsert(
    {
      surface: slug,
      createdById: actorId ?? null,
      ...sanitized,
    },
    {
      returning: true,
    },
  );

  invalidateAdsCache();
  return record.toPublicObject();
}

export async function createCampaign(payload = {}, { actorId } = {}) {
  const sanitized = sanitizeCampaignPayload(payload);
  if (!sanitized.name) {
    throw new ValidationError('Campaign name is required.');
  }
  if (!sanitized.objective) {
    sanitized.objective = AD_OBJECTIVES[0];
  }
  if (!sanitized.status) {
    sanitized.status = 'draft';
  }
  const record = await AdCampaign.create({ ...sanitized, ownerId: sanitized.ownerId ?? actorId ?? null });
  invalidateAdsCache();
  return record.toPublicObject();
}

export async function updateCampaign(campaignId, payload = {}, { actorId } = {}) {
  const id = Number.parseInt(campaignId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('campaignId must be a positive integer.');
  }
  const record = await AdCampaign.findByPk(id);
  if (!record) {
    throw new NotFoundError('Campaign not found.');
  }
  const sanitized = sanitizeCampaignPayload(payload);
  sanitized.updatedById = actorId ?? null;
  await record.update(sanitized);
  invalidateAdsCache();
  return record.toPublicObject();
}

export async function createCreative(payload = {}, { actorId } = {}) {
  const sanitized = sanitizeCreativePayload(payload);
  const campaignId = Number.parseInt(payload.campaignId ?? sanitized.campaignId, 10);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new ValidationError('campaignId is required for creative creation.');
  }
  const campaign = await AdCampaign.findByPk(campaignId);
  if (!campaign) {
    throw new NotFoundError('Campaign not found.');
  }
  if (!sanitized.name) {
    throw new ValidationError('Creative name is required.');
  }
  if (!sanitized.type) {
    sanitized.type = AD_TYPES[0];
  }
  if (!sanitized.status) {
    sanitized.status = 'active';
  }
  const record = await AdCreative.create({ ...sanitized, campaignId, createdById: actorId ?? null });
  invalidateAdsCache();
  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    campaignId: plain.campaignId,
    name: plain.name,
    type: plain.type,
    format: plain.format ?? null,
    status: plain.status,
    headline: plain.headline ?? null,
    subheadline: plain.subheadline ?? null,
    callToAction: plain.callToAction ?? null,
    ctaUrl: plain.ctaUrl ?? null,
    mediaUrl: plain.mediaUrl ?? null,
    durationSeconds: plain.durationSeconds == null ? null : Number(plain.durationSeconds),
    primaryColor: plain.primaryColor ?? null,
    accentColor: plain.accentColor ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

export async function updateCreative(creativeId, payload = {}, { actorId } = {}) {
  const id = Number.parseInt(creativeId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('creativeId must be a positive integer.');
  }
  const record = await AdCreative.findByPk(id);
  if (!record) {
    throw new NotFoundError('Creative not found.');
  }
  const sanitized = sanitizeCreativePayload(payload);
  if (payload.campaignId != null) {
    const campaignId = Number.parseInt(payload.campaignId, 10);
    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      throw new ValidationError('campaignId must be a positive integer when provided.');
    }
    const campaign = await AdCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new NotFoundError('Campaign not found.');
    }
    sanitized.campaignId = campaignId;
  }
  sanitized.updatedById = actorId ?? null;
  await record.update(sanitized);
  invalidateAdsCache();
  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    campaignId: plain.campaignId,
    name: plain.name,
    type: plain.type,
    format: plain.format ?? null,
    status: plain.status,
    headline: plain.headline ?? null,
    subheadline: plain.subheadline ?? null,
    callToAction: plain.callToAction ?? null,
    ctaUrl: plain.ctaUrl ?? null,
    mediaUrl: plain.mediaUrl ?? null,
    durationSeconds: plain.durationSeconds == null ? null : Number(plain.durationSeconds),
    primaryColor: plain.primaryColor ?? null,
    accentColor: plain.accentColor ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

export async function createPlacement(payload = {}, { actorId } = {}) {
  const sanitized = sanitizePlacementPayload(payload);
  if (!sanitized.creativeId) {
    throw new ValidationError('creativeId is required to create a placement.');
  }
  const creative = await AdCreative.findByPk(sanitized.creativeId);
  if (!creative) {
    throw new NotFoundError('Creative not found.');
  }
  if (!sanitized.surface) {
    sanitized.surface = 'global_dashboard';
  }
  if (!sanitized.position) {
    sanitized.position = 'inline';
  }
  if (!sanitized.status) {
    sanitized.status = 'scheduled';
  }
  if (!sanitized.pacingMode) {
    sanitized.pacingMode = AD_PACING_MODES[0];
  }
  const surfaceRecords = await AdSurfaceSetting.findAll({ where: { surface: sanitized.surface } });
  const surfaces = buildSurfaceSnapshot(surfaceRecords);
  const surfaceLabels = buildSurfaceLabelMap(surfaces);

  const placement = await sequelize.transaction(async (transaction) => {
    const record = await AdPlacement.create(
      {
        creativeId: sanitized.creativeId,
        surface: sanitized.surface,
        position: sanitized.position,
        status: sanitized.status,
        pacingMode: sanitized.pacingMode,
        weight: sanitized.weight ?? 1,
        priority: sanitized.priority ?? 0,
        maxImpressionsPerHour: sanitized.maxImpressionsPerHour ?? null,
        startAt: sanitized.startAt ?? null,
        endAt: sanitized.endAt ?? null,
        opportunityType: sanitized.opportunityType ?? null,
        metadata: sanitized.metadata ?? null,
        createdById: actorId ?? null,
      },
      { transaction },
    );

    const couponIds = await resolveCoupons(sanitized.couponIds, transaction);
    if (couponIds.length) {
      const payloads = couponIds.map((couponId, index) => ({
        couponId,
        placementId: record.id,
        priority: index,
      }));
      await AdPlacementCoupon.bulkCreate(payloads, {
        transaction,
        updateOnDuplicate: ['priority'],
      });
    }

    return fetchPlacement(record.id, surfaceLabels, transaction);
  });

  invalidateAdsCache();
  return placement;
}

export async function updatePlacement(placementId, payload = {}, { actorId } = {}) {
  const id = Number.parseInt(placementId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('placementId must be a positive integer.');
  }
  const record = await AdPlacement.findByPk(id);
  if (!record) {
    throw new NotFoundError('Placement not found.');
  }
  const sanitized = sanitizePlacementPayload(payload);
  const surfaceRecords = await AdSurfaceSetting.findAll();
  const surfaces = buildSurfaceSnapshot(surfaceRecords);
  const surfaceLabels = buildSurfaceLabelMap(surfaces);

  const placement = await sequelize.transaction(async (transaction) => {
    if (sanitized.creativeId) {
      const creative = await AdCreative.findByPk(sanitized.creativeId, { transaction });
      if (!creative) {
        throw new NotFoundError('Creative not found.');
      }
    }
    await record.update(
      {
        ...sanitized,
        updatedById: actorId ?? null,
      },
      { transaction },
    );

    if (payload.couponIds !== undefined) {
      const couponIds = await resolveCoupons(sanitized.couponIds, transaction);
      await AdPlacementCoupon.destroy({ where: { placementId: id }, transaction });
      if (couponIds.length) {
        const payloads = couponIds.map((couponId, index) => ({
          couponId,
          placementId: id,
          priority: index,
        }));
        await AdPlacementCoupon.bulkCreate(payloads, {
          transaction,
          updateOnDuplicate: ['priority'],
        });
      }
    }

    return fetchPlacement(id, surfaceLabels, transaction);
  });

  invalidateAdsCache();
  return placement;
}

export async function deleteCampaign(campaignId) {
  const id = Number.parseInt(campaignId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('campaignId must be a positive integer.');
  }

  const record = await AdCampaign.findByPk(id);
  if (!record) {
    throw new NotFoundError('Campaign not found.');
  }

  const creativeCount = await AdCreative.count({ where: { campaignId: id } });
  if (creativeCount > 0) {
    throw new ValidationError('Remove or reassign creatives before deleting the campaign.');
  }

  await record.destroy();
  invalidateAdsCache();
  return { success: true };
}

export async function deleteCreative(creativeId) {
  const id = Number.parseInt(creativeId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('creativeId must be a positive integer.');
  }

  const record = await AdCreative.findByPk(id);
  if (!record) {
    throw new NotFoundError('Creative not found.');
  }

  const placementCount = await AdPlacement.count({ where: { creativeId: id } });
  if (placementCount > 0) {
    throw new ValidationError('Unschedule placements using this creative before deleting it.');
  }

  await record.destroy();
  invalidateAdsCache();
  return { success: true };
}

export async function deletePlacement(placementId) {
  const id = Number.parseInt(placementId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('placementId must be a positive integer.');
  }

  const record = await AdPlacement.findByPk(id);
  if (!record) {
    throw new NotFoundError('Placement not found.');
  }

  await sequelize.transaction(async (transaction) => {
    await AdPlacementCoupon.destroy({ where: { placementId: id }, transaction });
    await record.destroy({ transaction });
  });

  invalidateAdsCache();
  return { success: true };
}

export default {
  getAdsSettingsSnapshot,
  upsertSurfaceSetting,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  createCreative,
  updateCreative,
  deleteCreative,
  createPlacement,
  updatePlacement,
  deletePlacement,
};
