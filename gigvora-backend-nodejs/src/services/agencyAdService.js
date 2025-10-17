import { Op, Sequelize } from 'sequelize';
import {
  sequelize,
  AdCampaign,
  AdCreative,
  AdPlacement,
  AdKeywordAssignment,
  AdKeyword,
  OpportunityTaxonomy,
} from '../models/index.js';
import {
  AD_OBJECTIVES,
  AD_STATUSES,
  AD_TYPES,
  AD_SURFACE_TYPES,
  AD_POSITION_TYPES,
  AD_PACING_MODES,
  AD_OPPORTUNITY_TYPES,
} from '../models/constants/index.js';
import { listDecoratedPlacements, summarizePlacements } from './adService.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';

function normaliseString(value, { required = false, label = 'value' } = {}) {
  if (value == null || `${value}`.trim().length === 0) {
    if (required) {
      throw new ValidationError(`${label} is required.`);
    }
    return undefined;
  }
  return `${value}`.trim();
}

function normaliseName(value, { required = true } = {}) {
  const name = normaliseString(value, { required, label: 'Campaign name' });
  return name ? name.slice(0, 255) : undefined;
}

function normaliseObjective(value, fallback = AD_OBJECTIVES[0]) {
  const resolved = (value ?? fallback ?? '').toString().trim().toLowerCase();
  if (!AD_OBJECTIVES.includes(resolved)) {
    throw new ValidationError(`objective must be one of: ${AD_OBJECTIVES.join(', ')}.`);
  }
  return resolved;
}

function normaliseStatus(value, fallback = AD_STATUSES[0]) {
  const resolved = (value ?? fallback ?? '').toString().trim().toLowerCase();
  if (!AD_STATUSES.includes(resolved)) {
    throw new ValidationError(`status must be one of: ${AD_STATUSES.join(', ')}.`);
  }
  return resolved;
}

function normaliseCreativeType(value, fallback = AD_TYPES[0]) {
  const resolved = (value ?? fallback ?? '').toString().trim().toLowerCase();
  if (!AD_TYPES.includes(resolved)) {
    throw new ValidationError(`creative type must be one of: ${AD_TYPES.join(', ')}.`);
  }
  return resolved;
}

function normaliseSurface(value, fallback = AD_SURFACE_TYPES[0]) {
  const resolved = (value ?? fallback ?? '').toString().trim().toLowerCase();
  if (!AD_SURFACE_TYPES.includes(resolved)) {
    throw new ValidationError(`surface must be one of: ${AD_SURFACE_TYPES.join(', ')}.`);
  }
  return resolved;
}

function normalisePosition(value, fallback = AD_POSITION_TYPES[2]) {
  const resolved = (value ?? fallback ?? '').toString().trim().toLowerCase();
  if (!AD_POSITION_TYPES.includes(resolved)) {
    throw new ValidationError(`position must be one of: ${AD_POSITION_TYPES.join(', ')}.`);
  }
  return resolved;
}

function normalisePacingMode(value, fallback = AD_PACING_MODES[0]) {
  const resolved = (value ?? fallback ?? '').toString().trim().toLowerCase();
  if (!AD_PACING_MODES.includes(resolved)) {
    throw new ValidationError(`pacingMode must be one of: ${AD_PACING_MODES.join(', ')}.`);
  }
  return resolved;
}

function normaliseOpportunityType(value) {
  if (value == null || value === '') {
    return null;
  }
  const resolved = `${value}`.trim().toLowerCase();
  if (!AD_OPPORTUNITY_TYPES.includes(resolved)) {
    throw new ValidationError(`opportunityType must be one of: ${AD_OPPORTUNITY_TYPES.join(', ')}.`);
  }
  return resolved;
}

function parseInteger(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, allowNull = true } = {}) {
  if (value == null || value === '') {
    if (allowNull) {
      return null;
    }
    throw new ValidationError('Value is required.');
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Numeric value expected.');
  }
  const rounded = Math.round(numeric);
  if (rounded < min || rounded > max) {
    throw new ValidationError(`Value must be between ${min} and ${max}.`);
  }
  return rounded;
}

function parseFloatAmount(value, { min = 0 } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Budget must be numeric.');
  }
  if (numeric < min) {
    throw new ValidationError(`Budget must be at least ${min}.`);
  }
  return Number(numeric.toFixed(2));
}

function parseDate(value, { label = 'date' } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ${label}.`);
  }
  return date;
}

function normaliseCurrencyCode(value, fallback = 'USD') {
  const resolved = (value ?? fallback ?? 'USD').toString().trim().toUpperCase();
  if (!/^[A-Z]{3,4}$/.test(resolved)) {
    throw new ValidationError('currencyCode must be a valid ISO currency code.');
  }
  return resolved;
}

function normaliseHexColor(value) {
  if (value == null || value === '') {
    return null;
  }
  const sanitized = `${value}`.trim();
  if (!/^#?[0-9a-fA-F]{3,8}$/.test(sanitized)) {
    throw new ValidationError('Colour values must be valid hex codes.');
  }
  return sanitized.startsWith('#') ? sanitized : `#${sanitized}`;
}

function sanitiseMetadata(input) {
  if (input == null) {
    return null;
  }
  if (typeof input !== 'object') {
    throw new ValidationError('metadata must be an object when provided.');
  }
  return JSON.parse(JSON.stringify(input));
}

function normaliseKeywordList(input) {
  if (!input) {
    return [];
  }
  const values = Array.isArray(input) ? input : `${input}`.split(',');
  return Array.from(
    new Set(
      values
        .map((value) => `${value}`.trim())
        .filter((value) => value.length > 0)
        .map((value) => value.slice(0, 160)),
    ),
  );
}

function toPublicCreative(creative) {
  if (!creative) {
    return null;
  }
  const plain = creative.toPublicObject ? creative.toPublicObject() : creative;
  const keywordAssignments = Array.isArray(creative.keywordAssignments)
    ? creative.keywordAssignments.map((assignment) =>
        assignment.toPublicObject ? assignment.toPublicObject() : assignment,
      )
    : [];
  const placements = Array.isArray(creative.placements)
    ? creative.placements.map((placement) =>
        placement.toPublicObject ? placement.toPublicObject() : placement,
      )
    : [];
  return { ...plain, keywordAssignments, placements };
}

function ensureCampaignAccess(campaign, { ownerId, workspaceId, isAdmin }) {
  if (!campaign) {
    throw new NotFoundError('Campaign not found.');
  }
  const campaignOwnerId = campaign.ownerId ?? null;
  if (ownerId != null && campaignOwnerId != null && campaignOwnerId !== ownerId && !isAdmin) {
    throw new AuthorizationError('You do not have permission to manage this campaign.');
  }
  if (workspaceId != null) {
    const metadataWorkspaceId = campaign.metadata?.workspaceId ?? null;
    if (metadataWorkspaceId != null && Number(metadataWorkspaceId) !== Number(workspaceId) && !isAdmin) {
      throw new AuthorizationError('Campaign is not linked to the requested workspace.');
    }
  }
}

function resolveActor({ actorId, roles }) {
  const normalizedRoles = Array.isArray(roles) ? roles.map((role) => `${role}`.toLowerCase()) : [];
  const isAdmin = normalizedRoles.includes('admin');
  return { actorId: actorId ?? null, isAdmin };
}

function enrichMetadata(existing, updates) {
  const next = sanitiseMetadata(existing) ?? {};
  if (updates == null) {
    return next;
  }
  const patch = sanitiseMetadata(updates) ?? {};
  return { ...next, ...patch };
}

function buildCampaignSummary(campaign) {
  const creatives = Array.isArray(campaign.creatives) ? campaign.creatives : [];
  const allPlacements = creatives.flatMap((creative) => creative.placements ?? []);
  const activePlacements = allPlacements.filter((placement) => placement.status === 'active');
  const upcomingPlacements = allPlacements.filter((placement) => placement.status === 'scheduled');
  const liveSurfaces = Array.from(new Set(activePlacements.map((placement) => placement.surface))).filter(Boolean);

  return {
    creatives: {
      total: creatives.length,
      active: creatives.filter((creative) => creative.status === 'active').length,
    },
    placements: {
      total: allPlacements.length,
      active: activePlacements.length,
      upcoming: upcomingPlacements.length,
      surfaces: liveSurfaces,
    },
  };
}

function buildPagination({ page, pageSize, total }) {
  return {
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1,
  };
}

function buildReferenceOptions(options) {
  return options.map((value) => ({
    value,
    label: value
      .split(/[_-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  }));
}

export async function listCampaigns({
  workspaceId,
  status,
  search,
  page = 1,
  pageSize = 10,
} = {}, actor = {}) {
  const { actorId, isAdmin } = resolveActor(actor);
  const limit = parseInteger(pageSize, { min: 1, max: 100, allowNull: false });
  const pageNumber = parseInteger(page, { min: 1, allowNull: false });
  const offset = (pageNumber - 1) * limit;

  const where = {};
  if (!isAdmin && actorId != null) {
    where.ownerId = actorId;
  }
  if (status) {
    where.status = normaliseStatus(status);
  }
  if (search) {
    const query = `%${search.toString().trim().toLowerCase()}%`;
    where.name = { [Op.like]: query };
  }
  if (workspaceId != null) {
    const workspaceNumber = Number(workspaceId);
    if (!Number.isFinite(workspaceNumber)) {
      throw new ValidationError('workspaceId must be numeric.');
    }
    where[Op.or] = [
      Sequelize.where(Sequelize.json('AdCampaign.metadata.workspaceId'), workspaceNumber),
      Sequelize.where(Sequelize.json('AdCampaign.metadata.workspaceId'), null),
    ];
  }

  const result = await AdCampaign.findAndCountAll({
    where,
    distinct: true,
    include: [
      {
        model: AdCreative,
        as: 'creatives',
        include: [
          { model: AdPlacement, as: 'placements' },
        ],
      },
    ],
    order: [['updatedAt', 'DESC']],
    limit,
    offset,
  });

  const campaigns = result.rows.map((campaign) => {
      const publicCampaign = campaign.toPublicObject();
      return {
        ...publicCampaign,
        summary: buildCampaignSummary(campaign),
      };
    });

  return {
    campaigns,
    pagination: buildPagination({ page: pageNumber, pageSize: limit, total: result.count }),
  };
}

export async function createCampaign(payload = {}, actor = {}) {
  const { actorId, isAdmin } = resolveActor(actor);
  const ownerId = payload.ownerId ?? actorId;
  if (!ownerId && !isAdmin) {
    throw new ValidationError('ownerId is required to create a campaign.');
  }

  const name = normaliseName(payload.name, { required: true });
  const objective = normaliseObjective(payload.objective);
  const status = normaliseStatus(payload.status ?? 'draft');
  const currencyCode = normaliseCurrencyCode(payload.currencyCode ?? 'USD');
  const rawBudgetAmount = payload.budgetAmount ?? (payload.budgetCents != null ? Number(payload.budgetCents) / 100 : null);
  const budgetAmount = parseFloatAmount(rawBudgetAmount);
  const budgetCents = payload.budgetCents != null
    ? parseInteger(payload.budgetCents, { min: 0 })
    : budgetAmount != null
    ? Math.round(budgetAmount * 100)
    : null;
  const startDate = parseDate(payload.startDate, { label: 'startDate' });
  const endDate = parseDate(payload.endDate, { label: 'endDate' });
  if (startDate && endDate && endDate < startDate) {
    throw new ValidationError('endDate must be after startDate.');
  }

  const metadata = enrichMetadata(payload.metadata, null);
  const keywordHints = normaliseKeywordList(payload.keywordHints ?? metadata.keywordHints);
  if (keywordHints.length) {
    metadata.keywordHints = keywordHints;
  }
  if (payload.workspaceId != null) {
    metadata.workspaceId = Number(payload.workspaceId);
  }

  const campaign = await sequelize.transaction(async (trx) => {
    const created = await AdCampaign.create(
      {
        name,
        objective,
        status,
        budgetCents: budgetCents ?? null,
        currencyCode,
        startDate,
        endDate,
        ownerId: ownerId ?? null,
        metadata: Object.keys(metadata).length ? metadata : null,
      },
      { transaction: trx },
    );
    return created;
  });

  return campaign.toPublicObject();
}

export async function updateCampaign(campaignId, payload = {}, actor = {}) {
  if (!campaignId) {
    throw new ValidationError('campaignId is required.');
  }
  const { actorId, isAdmin } = resolveActor(actor);
  const workspaceId = payload.workspaceId ?? null;

  const campaign = await AdCampaign.findByPk(campaignId);
  ensureCampaignAccess(campaign, { ownerId: actorId, workspaceId, isAdmin });

  const updates = {};
  if (payload.name != null) {
    updates.name = normaliseName(payload.name, { required: true });
  }
  if (payload.objective != null) {
    updates.objective = normaliseObjective(payload.objective);
  }
  if (payload.status != null) {
    updates.status = normaliseStatus(payload.status);
  }
  if (payload.currencyCode != null) {
    updates.currencyCode = normaliseCurrencyCode(payload.currencyCode);
  }
  if (payload.budgetAmount != null) {
    const budgetAmount = parseFloatAmount(payload.budgetAmount);
    updates.budgetCents = budgetAmount != null ? Math.round(budgetAmount * 100) : null;
  } else if (payload.budgetCents != null) {
    updates.budgetCents = parseInteger(payload.budgetCents, { min: 0, allowNull: true });
  }
  if (payload.startDate !== undefined) {
    updates.startDate = parseDate(payload.startDate, { label: 'startDate' });
  }
  if (payload.endDate !== undefined) {
    updates.endDate = parseDate(payload.endDate, { label: 'endDate' });
  }
  const metadata = enrichMetadata(campaign.metadata, payload.metadata);
  if (payload.workspaceId != null) {
    metadata.workspaceId = Number(payload.workspaceId);
  }
  if (payload.keywordHints != null) {
    metadata.keywordHints = normaliseKeywordList(payload.keywordHints);
  }

  if (updates.startDate && updates.endDate && updates.endDate < updates.startDate) {
    throw new ValidationError('endDate must be after startDate.');
  }

  await sequelize.transaction(async (trx) => {
    await campaign.update(
      {
        ...updates,
        metadata: Object.keys(metadata).length ? metadata : null,
      },
      { transaction: trx },
    );
  });

  return campaign.toPublicObject();
}

export async function getCampaign(campaignId, { workspaceId } = {}, actor = {}) {
  if (!campaignId) {
    throw new ValidationError('campaignId is required.');
  }
  const { actorId, isAdmin } = resolveActor(actor);

  const campaign = await AdCampaign.findByPk(campaignId, {
    include: [
      {
        model: AdCreative,
        as: 'creatives',
        include: [
          { model: AdPlacement, as: 'placements' },
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
    ],
  });

  ensureCampaignAccess(campaign, { ownerId: actorId, workspaceId, isAdmin });

  const keywordHints = normaliseKeywordList([
    ...(campaign.metadata?.keywordHints ?? []),
    ...campaign.creatives.flatMap((creative) => [creative.headline, creative.subheadline]),
  ]);

  const placements = await listDecoratedPlacements({
    campaignId: campaign.id,
    ownerId: isAdmin ? undefined : actorId ?? undefined,
    context: { keywordHints },
  });

  const performance = await summarizePlacements({ placements, context: { keywordHints } });

  return {
    campaign: campaign.toPublicObject(),
    creatives: campaign.creatives.map((creative) => toPublicCreative(creative)),
    placements,
    performance,
  };
}

export async function createCreative(campaignId, payload = {}, actor = {}) {
  if (!campaignId) {
    throw new ValidationError('campaignId is required.');
  }
  const { actorId, isAdmin } = resolveActor(actor);
  const campaign = await AdCampaign.findByPk(campaignId);
  ensureCampaignAccess(campaign, { ownerId: actorId, workspaceId: payload.workspaceId ?? null, isAdmin });

  const name = normaliseString(payload.name, { required: true, label: 'Creative name' }).slice(0, 255);
  const type = normaliseCreativeType(payload.type);
  const status = normaliseStatus(payload.status ?? 'active');
  const format = payload.format ? normaliseString(payload.format).slice(0, 80) : null;
  const headline = payload.headline ? normaliseString(payload.headline).slice(0, 255) : null;
  const subheadline = payload.subheadline ? normaliseString(payload.subheadline).slice(0, 255) : null;
  const callToAction = payload.callToAction ? normaliseString(payload.callToAction).slice(0, 120) : null;
  const ctaUrl = payload.ctaUrl ? normaliseString(payload.ctaUrl).slice(0, 500) : null;
  const mediaUrl = payload.mediaUrl ? normaliseString(payload.mediaUrl).slice(0, 500) : null;
  const durationSeconds = payload.durationSeconds != null ? parseInteger(payload.durationSeconds, { min: 0 }) : null;
  const primaryColor = normaliseHexColor(payload.primaryColor);
  const accentColor = normaliseHexColor(payload.accentColor);
  const metadata = enrichMetadata(null, payload.metadata);
  if (campaign.metadata?.workspaceId != null) {
    metadata.workspaceId = campaign.metadata.workspaceId;
  } else if (payload.workspaceId != null) {
    metadata.workspaceId = Number(payload.workspaceId);
  }

  const creative = await sequelize.transaction(async (trx) => {
    const created = await AdCreative.create(
      {
        campaignId: campaign.id,
        name,
        type,
        format,
        status,
        headline,
        subheadline,
        body: payload.body ?? null,
        callToAction,
        ctaUrl,
        mediaUrl,
        durationSeconds,
        primaryColor,
        accentColor,
        metadata: Object.keys(metadata).length ? metadata : null,
      },
      { transaction: trx },
    );
    return created;
  });

  return creative.toPublicObject();
}

export async function updateCreative(creativeId, payload = {}, actor = {}) {
  if (!creativeId) {
    throw new ValidationError('creativeId is required.');
  }
  const { actorId, isAdmin } = resolveActor(actor);
  const creative = await AdCreative.findByPk(creativeId, {
    include: [{ model: AdCampaign, as: 'campaign' }],
  });
  if (!creative) {
    throw new NotFoundError('Creative not found.');
  }
  ensureCampaignAccess(creative.campaign, {
    ownerId: actorId,
    workspaceId: payload.workspaceId ?? null,
    isAdmin,
  });

  const updates = {};
  if (payload.name != null) {
    updates.name = normaliseString(payload.name, { required: true, label: 'Creative name' }).slice(0, 255);
  }
  if (payload.type != null) {
    updates.type = normaliseCreativeType(payload.type);
  }
  if (payload.status != null) {
    updates.status = normaliseStatus(payload.status);
  }
  if (payload.format != null) {
    updates.format = normaliseString(payload.format).slice(0, 80);
  }
  if (payload.headline !== undefined) {
    updates.headline = payload.headline ? normaliseString(payload.headline).slice(0, 255) : null;
  }
  if (payload.subheadline !== undefined) {
    updates.subheadline = payload.subheadline ? normaliseString(payload.subheadline).slice(0, 255) : null;
  }
  if (payload.body !== undefined) {
    updates.body = payload.body ?? null;
  }
  if (payload.callToAction !== undefined) {
    updates.callToAction = payload.callToAction ? normaliseString(payload.callToAction).slice(0, 120) : null;
  }
  if (payload.ctaUrl !== undefined) {
    updates.ctaUrl = payload.ctaUrl ? normaliseString(payload.ctaUrl).slice(0, 500) : null;
  }
  if (payload.mediaUrl !== undefined) {
    updates.mediaUrl = payload.mediaUrl ? normaliseString(payload.mediaUrl).slice(0, 500) : null;
  }
  if (payload.durationSeconds !== undefined) {
    updates.durationSeconds = payload.durationSeconds == null ? null : parseInteger(payload.durationSeconds, { min: 0 });
  }
  if (payload.primaryColor !== undefined) {
    updates.primaryColor = normaliseHexColor(payload.primaryColor);
  }
  if (payload.accentColor !== undefined) {
    updates.accentColor = normaliseHexColor(payload.accentColor);
  }

  const metadata = enrichMetadata(creative.metadata, payload.metadata);
  if (payload.workspaceId != null) {
    metadata.workspaceId = Number(payload.workspaceId);
  }

  await sequelize.transaction(async (trx) => {
    await creative.update(
      {
        ...updates,
        metadata: Object.keys(metadata).length ? metadata : null,
      },
      { transaction: trx },
    );
  });

  return creative.toPublicObject();
}

export async function createPlacement(campaignId, payload = {}, actor = {}) {
  if (!campaignId) {
    throw new ValidationError('campaignId is required.');
  }
  const { actorId, isAdmin } = resolveActor(actor);
  const campaign = await AdCampaign.findByPk(campaignId);
  ensureCampaignAccess(campaign, { ownerId: actorId, workspaceId: payload.workspaceId ?? null, isAdmin });

  const creativeId = parseInteger(payload.creativeId, { min: 1, allowNull: false });
  const creative = await AdCreative.findByPk(creativeId);
  if (!creative || creative.campaignId !== campaign.id) {
    throw new ValidationError('creativeId must reference a creative belonging to the campaign.');
  }

  const surface = normaliseSurface(payload.surface ?? 'agency_dashboard');
  const position = normalisePosition(payload.position ?? 'inline');
  const status = normaliseStatus(payload.status ?? 'scheduled');
  const weight = parseInteger(payload.weight ?? 1, { min: 1, max: 100, allowNull: false });
  const pacingMode = normalisePacingMode(payload.pacingMode ?? 'even');
  const maxImpressionsPerHour = payload.maxImpressionsPerHour == null
    ? null
    : parseInteger(payload.maxImpressionsPerHour, { min: 1 });
  const startAt = parseDate(payload.startAt, { label: 'startAt' });
  const endAt = parseDate(payload.endAt, { label: 'endAt' });
  if (startAt && endAt && endAt < startAt) {
    throw new ValidationError('endAt must be after startAt.');
  }
  const opportunityType = normaliseOpportunityType(payload.opportunityType);
  const priority = parseInteger(payload.priority ?? 0, { min: -100, max: 100 });
  const metadata = enrichMetadata(null, payload.metadata);
  if (campaign.metadata?.workspaceId != null) {
    metadata.workspaceId = campaign.metadata.workspaceId;
  } else if (payload.workspaceId != null) {
    metadata.workspaceId = Number(payload.workspaceId);
  }

  const placement = await sequelize.transaction(async (trx) => {
    const created = await AdPlacement.create(
      {
        creativeId: creative.id,
        surface,
        position,
        status,
        weight,
        pacingMode,
        maxImpressionsPerHour,
        startAt,
        endAt,
        opportunityType,
        priority,
        metadata: Object.keys(metadata).length ? metadata : null,
      },
      { transaction: trx },
    );
    return created;
  });

  return placement.toPublicObject();
}

export async function updatePlacement(placementId, payload = {}, actor = {}) {
  if (!placementId) {
    throw new ValidationError('placementId is required.');
  }
  const { actorId, isAdmin } = resolveActor(actor);
  const placement = await AdPlacement.findByPk(placementId, {
    include: [
      {
        model: AdCreative,
        as: 'creative',
        include: [{ model: AdCampaign, as: 'campaign' }],
      },
    ],
  });
  if (!placement) {
    throw new NotFoundError('Placement not found.');
  }
  ensureCampaignAccess(placement.creative?.campaign, {
    ownerId: actorId,
    workspaceId: payload.workspaceId ?? null,
    isAdmin,
  });

  const updates = {};
  if (payload.surface != null) {
    updates.surface = normaliseSurface(payload.surface);
  }
  if (payload.position != null) {
    updates.position = normalisePosition(payload.position);
  }
  if (payload.status != null) {
    updates.status = normaliseStatus(payload.status);
  }
  if (payload.weight != null) {
    updates.weight = parseInteger(payload.weight, { min: 1, max: 100, allowNull: false });
  }
  if (payload.pacingMode != null) {
    updates.pacingMode = normalisePacingMode(payload.pacingMode);
  }
  if (payload.maxImpressionsPerHour !== undefined) {
    updates.maxImpressionsPerHour = payload.maxImpressionsPerHour == null
      ? null
      : parseInteger(payload.maxImpressionsPerHour, { min: 1 });
  }
  if (payload.startAt !== undefined) {
    updates.startAt = parseDate(payload.startAt, { label: 'startAt' });
  }
  if (payload.endAt !== undefined) {
    updates.endAt = parseDate(payload.endAt, { label: 'endAt' });
  }
  if (updates.startAt && updates.endAt && updates.endAt < updates.startAt) {
    throw new ValidationError('endAt must be after startAt.');
  }
  if (payload.opportunityType !== undefined) {
    updates.opportunityType = normaliseOpportunityType(payload.opportunityType);
  }
  if (payload.priority !== undefined) {
    updates.priority = parseInteger(payload.priority, { min: -100, max: 100 });
  }

  const metadata = enrichMetadata(placement.metadata, payload.metadata);
  if (payload.workspaceId != null) {
    metadata.workspaceId = Number(payload.workspaceId);
  }

  await sequelize.transaction(async (trx) => {
    await placement.update(
      {
        ...updates,
        metadata: Object.keys(metadata).length ? metadata : null,
      },
      { transaction: trx },
    );
  });

  return placement.toPublicObject();
}

export function getReferenceData() {
  return {
    objectives: buildReferenceOptions(AD_OBJECTIVES),
    statuses: buildReferenceOptions(AD_STATUSES),
    creativeTypes: buildReferenceOptions(AD_TYPES),
    surfaces: buildReferenceOptions(AD_SURFACE_TYPES),
    positions: buildReferenceOptions(AD_POSITION_TYPES),
    pacingModes: buildReferenceOptions(AD_PACING_MODES),
    opportunityTypes: buildReferenceOptions(AD_OPPORTUNITY_TYPES),
  };
}

export default {
  listCampaigns,
  createCampaign,
  updateCampaign,
  getCampaign,
  createCreative,
  updateCreative,
  createPlacement,
  updatePlacement,
  getReferenceData,
};
