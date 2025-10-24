import { Op, fn, col } from 'sequelize';
import {
  CreationStudioItem,
  CreationStudioStep,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_STEPS,
} from '../models/creationStudioModels.js';
import { ProviderWorkspace } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normaliseString(value) {
  if (value == null) {
    return null;
  }
  const trimmed = `${value}`.trim();
  return trimmed.length ? trimmed : null;
}

function normaliseArray(value) {
  if (!value) {
    return [];
  }
  const source = Array.isArray(value) ? value : `${value}`.split(',');
  return Array.from(
    new Set(
      source
        .map((entry) => normaliseString(entry))
        .filter(Boolean)
        .map((entry) => entry.slice(0, 80)),
    ),
  );
}

function normaliseVisibility(value) {
  const candidate = normaliseString(value);
  if (!candidate) {
    return 'private';
  }
  if (candidate === 'connections') {
    return 'workspace';
  }
  if (candidate === 'community') {
    return 'public';
  }
  return CREATION_STUDIO_VISIBILITIES.includes(candidate) ? candidate : 'private';
}

function normaliseStatus(value) {
  const candidate = normaliseString(value) ?? 'draft';
  return CREATION_STUDIO_ITEM_STATUSES.includes(candidate) ? candidate : 'draft';
}

function normaliseType(value) {
  const candidate = normaliseString(value);
  if (!candidate) {
    return null;
  }
  const match = CREATION_STUDIO_ITEM_TYPES.find((type) => type === candidate);
  return match ?? null;
}

function normalisePositiveInteger(value, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric < min) {
    return null;
  }
  const clamped = Math.min(numeric, max);
  return Math.max(clamped, min);
}

function normaliseNonNegativeInteger(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }
  return numeric;
}

function normaliseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const stringValue = `${value}`.trim().toLowerCase();
  if (!stringValue) {
    return defaultValue;
  }
  if (['true', '1', 'yes', 'y'].includes(stringValue)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(stringValue)) {
    return false;
  }
  return defaultValue;
}

function normaliseDecimal(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}

function normaliseCurrency(value) {
  const candidate = normaliseString(value);
  if (!candidate) {
    return null;
  }
  const upper = candidate.toUpperCase();
  if (upper.length < 3 || upper.length > 6) {
    return null;
  }
  return upper;
}

function normaliseJson(value, fallback = {}) {
  if (value === undefined) {
    return fallback;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function requireType(value) {
  const type = normaliseType(value);
  if (!type) {
    throw new ValidationError('Unsupported creation studio type.');
  }
  return type;
}

function buildSlug(title, existingSlug) {
  if (existingSlug) {
    return existingSlug;
  }
  const base = (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 190);
  return base || null;
}

async function ensureUniqueSlug(slug, { ignoreId } = {}) {
  if (!slug) {
    return null;
  }
  let candidate = slug;
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = { slug: candidate };
    if (ignoreId) {
      where.id = { [Op.ne]: ignoreId };
    }
    // eslint-disable-next-line no-await-in-loop
    const existing = await CreationStudioItem.findOne({ where, attributes: ['id'] });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${slug}-${suffix}`;
  }
}

function sanitiseItem(record) {
  if (!record) {
    return null;
  }
  const plain = record.toPublicObject ? record.toPublicObject() : record;
  return {
    ...plain,
    steps: Array.isArray(plain.steps) ? plain.steps : [],
  };
}

function buildSummary(items) {
  const summary = {
    total: items.length,
    drafts: 0,
    scheduled: 0,
    published: 0,
    archived: 0,
    byType: {},
  };
  items.forEach((item) => {
    const entry = (summary.byType[item.type] = summary.byType[item.type] || { total: 0, published: 0, drafts: 0 });
    entry.total += 1;
    if (item.status === 'published') {
      summary.published += 1;
      entry.published += 1;
    } else if (item.status === 'scheduled') {
      summary.scheduled += 1;
    } else if (item.status === 'archived') {
      summary.archived += 1;
    } else {
      summary.drafts += 1;
      entry.drafts += 1;
    }
  });
  return summary;
}

function buildDefaultSettings(type) {
  switch (type) {
    case 'cv':
      return { requiresBrief: false, requiresAttachment: true };
    case 'cover_letter':
      return { requiresBrief: true, requiresAttachment: true };
    case 'job':
      return { requiresBrief: true, compensationType: 'salary' };
    case 'volunteer_opportunity':
      return { requiresBrief: true, backgroundChecks: true };
    case 'mentorship_offering':
      return { requiresBrief: true, sessionLengthMinutes: 60 };
    case 'networking_session':
      return { requiresBrief: false, rsvpRequired: true };
    case 'launchpad_job':
    case 'launchpad_project':
      return { requiresBrief: true, launchpadOnly: true };
    case 'ad':
      return { requiresBrief: true, budget: { minimum: 25, currency: 'USD' } };
    default:
      return { requiresBrief: true };
  }
}

function preparePayload(payload, { actorId, existing } = {}) {
  const type = payload.type ? requireType(payload.type) : requireType(existing?.type ?? 'project');
  const title = normaliseString(payload.title) ?? existing?.title ?? `${type.replace(/_/g, ' ')} draft`;
  const summary = payload.summary !== undefined ? normaliseString(payload.summary) : existing?.summary ?? null;
  const description =
    payload.description !== undefined ? normaliseString(payload.description) : existing?.description ?? null;
  const headline = payload.headline !== undefined ? normaliseString(payload.headline) : existing?.headline ?? null;

  const status = payload.status ? normaliseStatus(payload.status) : existing?.status ?? 'draft';
  const visibility = payload.visibility ? normaliseVisibility(payload.visibility) : existing?.visibility ?? 'private';

  const settings = payload.settings !== undefined ? { ...buildDefaultSettings(type), ...(payload.settings ?? {}) } : existing?.settings ?? buildDefaultSettings(type);

  const metadata = normaliseJson(payload.metadata, existing?.metadata ?? {});
  const shareTargets = payload.shareTargets !== undefined ? normaliseArray(payload.shareTargets) : existing?.shareTargets ?? [];
  const shareMessage =
    payload.shareMessage !== undefined ? normaliseString(payload.shareMessage) : existing?.shareMessage ?? null;

  const tags = payload.tags !== undefined ? normaliseArray(payload.tags) : existing?.tags ?? [];

  const heroImageUrl =
    payload.heroImageUrl !== undefined ? normaliseString(payload.heroImageUrl) : existing?.heroImageUrl ?? null;
  const locationLabel =
    payload.locationLabel !== undefined ? normaliseString(payload.locationLabel) : existing?.locationLabel ?? null;
  const locationMode =
    payload.locationMode !== undefined
      ? normaliseString(payload.locationMode) ?? existing?.locationMode ?? 'hybrid'
      : existing?.locationMode ?? 'hybrid';
  const category = payload.category !== undefined ? normaliseString(payload.category) : existing?.category ?? null;
  const targetAudience =
    payload.targetAudience !== undefined ? normaliseString(payload.targetAudience) : existing?.targetAudience ?? null;
  const schedule = normaliseJson(payload.schedule, existing?.schedule ?? null);

  const budgetAmount =
    payload.budgetAmount !== undefined ? normaliseDecimal(payload.budgetAmount) : existing?.budgetAmount ?? null;
  const budgetCurrency =
    payload.budgetCurrency !== undefined ? normaliseCurrency(payload.budgetCurrency) : existing?.budgetCurrency ?? null;
  const compensationMin =
    payload.compensationMin !== undefined
      ? normaliseDecimal(payload.compensationMin)
      : existing?.compensationMin ?? null;
  const compensationMax =
    payload.compensationMax !== undefined
      ? normaliseDecimal(payload.compensationMax)
      : existing?.compensationMax ?? null;
  const compensationCurrency =
    payload.compensationCurrency !== undefined
      ? normaliseCurrency(payload.compensationCurrency)
      : existing?.compensationCurrency ?? null;
  const durationWeeks =
    payload.durationWeeks !== undefined
      ? normalisePositiveInteger(payload.durationWeeks, { min: 1, max: 520 })
      : existing?.durationWeeks ?? null;
  const commitmentHours =
    payload.commitmentHours !== undefined
      ? normaliseNonNegativeInteger(payload.commitmentHours)
      : existing?.commitmentHours ?? null;
  const remoteEligible =
    payload.remoteEligible !== undefined
      ? normaliseBoolean(payload.remoteEligible, true)
      : existing?.remoteEligible ?? true;

  const publishAt = payload.publishAt ? new Date(payload.publishAt) : existing?.publishAt ?? null;
  if (publishAt && Number.isNaN(publishAt.getTime())) {
    throw new ValidationError('publishAt must be a valid date.');
  }

  const launchAt = payload.launchAt ? new Date(payload.launchAt) : existing?.launchAt ?? null;
  if (launchAt && Number.isNaN(launchAt.getTime())) {
    throw new ValidationError('launchAt must be a valid date.');
  }

  const slug = payload.slug !== undefined ? normaliseString(payload.slug) : existing?.slug ?? null;

  return {
    type,
    title,
    summary,
    description,
    status,
    visibility,
    settings,
    metadata,
    shareTargets,
    shareMessage,
    tags,
    heroImageUrl,
    locationLabel,
    locationMode,
    category,
    targetAudience,
    schedule,
    budgetAmount,
    budgetCurrency,
    compensationMin,
    compensationMax,
    compensationCurrency,
    durationWeeks,
    commitmentHours,
    remoteEligible,
    publishAt: status === 'scheduled' ? publishAt : null,
    launchAt,
    updatedById: actorId ?? existing?.updatedById ?? null,
    slug,
  };
}

export async function listCreationStudioItems({
  workspaceId,
  type,
  status,
  search,
  limit,
  offset,
  page,
  pageSize,
} = {}) {
  const where = {};
  if (workspaceId) {
    where.workspaceId = Number(workspaceId);
  }
  if (type) {
    const normalised = normaliseType(type);
    if (normalised) {
      where.type = normalised;
    }
  }
  if (status) {
    const normalised = normaliseStatus(status);
    if (normalised) {
      where.status = normalised;
    }
  }
  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.iLike ?? Op.like]: term } },
      { summary: { [Op.iLike ?? Op.like]: term } },
      { description: { [Op.iLike ?? Op.like]: term } },
    ];
  }

  const resolvedPageSize = normalisePositiveInteger(pageSize, { max: 100 });
  const resolvedLimit = normalisePositiveInteger(limit, { max: 100 });
  const resolvedPage = normalisePositiveInteger(page, { max: Number.MAX_SAFE_INTEGER });
  const resolvedOffset = normaliseNonNegativeInteger(offset);

  const pageLimit = resolvedPageSize ?? resolvedLimit ?? 20;
  const pageOffset =
    resolvedPage != null ? Math.max(0, (resolvedPage - 1) * pageLimit) : resolvedOffset ?? 0;

  const items = await CreationStudioItem.findAll({
    where,
    order: [
      ['status', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
    limit: pageLimit,
    offset: pageOffset,
  });

  return items.map((item) => sanitiseItem(item));
}

async function loadAvailableWorkspaces() {
  const workspaces = await ProviderWorkspace.findAll({
    attributes: ['id', 'name', 'slug', 'type', 'ownerId'],
    where: { isActive: true },
    order: [['name', 'ASC']],
  });
  return workspaces.map((workspace) => {
    const plain = workspace.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      slug: plain.slug,
      type: plain.type,
      ownerId: plain.ownerId,
    };
  });
}

function buildOverviewSummaries(grouped) {
  const typeSummaries = CREATION_STUDIO_ITEM_TYPES.map((type) => ({
    type,
    total: 0,
    byStatus: CREATION_STUDIO_ITEM_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {}),
  }));
  const index = new Map(typeSummaries.map((entry) => [entry.type, entry]));

  grouped.forEach((row) => {
    const type = row.get('type');
    const status = row.get('status');
    const count = Number(row.get('count') ?? 0);
    const entry = index.get(type);
    if (entry) {
      entry.total += count;
      if (entry.byStatus[status] != null) {
        entry.byStatus[status] += count;
      }
    }
  });

  const totals = typeSummaries.reduce(
    (acc, entry) => {
      acc.total += entry.total;
      CREATION_STUDIO_ITEM_STATUSES.forEach((status) => {
        acc.byStatus[status] = (acc.byStatus[status] ?? 0) + (entry.byStatus[status] ?? 0);
      });
      return acc;
    },
    { total: 0, byStatus: CREATION_STUDIO_ITEM_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {}) },
  );

  return { typeSummaries, totals };
}

export async function getCreationStudioOverview({ workspaceId, limit = 16 } = {}) {
  const where = {};
  if (workspaceId) {
    where.workspaceId = workspaceId;
  }
  const [items, grouped] = await Promise.all([
    CreationStudioItem.findAll({
      where,
      order: [
        ['status', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
      limit,
    }),
    CreationStudioItem.findAll({
      attributes: ['type', 'status', [fn('COUNT', col('id')), 'count']],
      where,
      group: ['type', 'status'],
    }),
  ]);

  const { typeSummaries, totals } = buildOverviewSummaries(grouped);
  const upcoming = items
    .filter((item) => item.launchAt && new Date(item.launchAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.launchAt) - new Date(b.launchAt))
    .slice(0, 6)
    .map((item) => sanitiseItem(item));

  return {
    meta: {
      selectedWorkspaceId: workspaceId ?? null,
      availableWorkspaces: await loadAvailableWorkspaces(),
      types: CREATION_STUDIO_ITEM_TYPES,
      statuses: CREATION_STUDIO_ITEM_STATUSES,
      visibilities: CREATION_STUDIO_VISIBILITIES,
    },
    items: items.map((item) => sanitiseItem(item)),
    upcoming,
    summary: {
      total: totals.total,
      drafts: totals.byStatus.draft ?? 0,
      scheduled: totals.byStatus.scheduled ?? 0,
      published: totals.byStatus.published ?? 0,
      archived: totals.byStatus.archived ?? 0,
    },
    typeSummaries,
    draftRecommendations: CREATION_STUDIO_ITEM_TYPES.filter(
      (type) => !typeSummaries.some((entry) => entry.type === type && entry.total > 0),
    ),
  };
}

async function applyCreate(payload, { actorId }) {
  const prepared = preparePayload(payload, { actorId });
  const item = await CreationStudioItem.create({
    ...prepared,
    workspaceId: payload.workspaceId ?? null,
    ownerId: payload.ownerId ?? payload.createdById ?? actorId ?? 0,
    createdById: actorId ?? payload.createdById ?? null,
    slug: await ensureUniqueSlug(buildSlug(prepared.title, prepared.slug)),
  });
  return sanitiseItem(item);
}

export async function createCreationStudioItem(payload, { actorId } = {}) {
  if (!payload?.workspaceId) {
    throw new ValidationError('workspaceId is required when creating an item from the company workspace.');
  }
  if (!actorId && !payload.createdById) {
    throw new ValidationError('actorId is required when creating a creation studio item.');
  }
  return applyCreate(payload, { actorId });
}

export async function updateCreationStudioItem(id, payload = {}, { actorId } = {}) {
  const item = await CreationStudioItem.findByPk(id);
  if (!item) {
    throw new NotFoundError('Creation studio item not found.');
  }
  const prepared = preparePayload(payload, { actorId, existing: item.toPublicObject() });
  if (prepared.slug) {
    prepared.slug = await ensureUniqueSlug(prepared.slug, { ignoreId: item.id });
  }
  await item.update(prepared);
  return sanitiseItem(item);
}

export async function publishCreationStudioItem(id, payload = {}, { actorId } = {}) {
  const item = await CreationStudioItem.findByPk(id);
  if (!item) {
    throw new NotFoundError('Creation studio item not found.');
  }
  const publishAt = payload.publishAt ? new Date(payload.publishAt) : null;
  if (publishAt && Number.isNaN(publishAt.getTime())) {
    throw new ValidationError('publishAt must be a valid date.');
  }
  const updates = {
    status: publishAt && publishAt > new Date() ? 'scheduled' : 'published',
    publishAt: publishAt && publishAt > new Date() ? publishAt : null,
    publishedAt: publishAt && publishAt > new Date() ? null : new Date(),
    updatedById: actorId ?? item.updatedById ?? null,
  };
  await item.update(updates);
  return sanitiseItem(item);
}

export async function deleteCreationStudioItem(id) {
  const item = await CreationStudioItem.findByPk(id);
  if (!item) {
    throw new NotFoundError('Creation studio item not found.');
  }
  await CreationStudioStep.destroy({ where: { itemId: item.id } });
  await item.destroy();
  return { success: true };
}

export async function listItems(ownerId, { includeArchived = false } = {}) {
  if (!ownerId) {
    return { items: [], summary: buildSummary([]) };
  }
  const where = { ownerId };
  if (!includeArchived) {
    where.status = { [Op.ne]: 'archived' };
  }
  const records = await CreationStudioItem.findAll({
    where,
    include: [{ model: CreationStudioStep, as: 'steps' }],
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });
  const items = records.map((item) => sanitiseItem(item));
  return { items, summary: buildSummary(items) };
}

export async function getDashboardSnapshot(ownerId) {
  const { items, summary } = await listItems(ownerId, { includeArchived: false });
  return {
    summary,
    items: items.slice(0, 6),
    catalog: CREATION_STUDIO_ITEM_TYPES.map((type) => ({ type, settings: buildDefaultSettings(type) })),
    shareDestinations: [
      { id: 'timeline', label: 'Timeline' },
      { id: 'groups', label: 'Groups' },
      { id: 'pages', label: 'Pages' },
      { id: 'inbox', label: 'Direct messages' },
      { id: 'external', label: 'Shareable link' },
    ],
  };
}

export async function getWorkspace(ownerId, { includeArchived = false } = {}) {
  const result = await listItems(ownerId, { includeArchived });
  return {
    ...result,
    catalog: CREATION_STUDIO_ITEM_TYPES.map((type) => ({ type, settings: buildDefaultSettings(type) })),
    shareDestinations: [
      { id: 'timeline', label: 'Timeline' },
      { id: 'groups', label: 'Groups' },
      { id: 'pages', label: 'Pages' },
      { id: 'inbox', label: 'Direct messages' },
      { id: 'external', label: 'Shareable link' },
    ],
  };
}

export async function createItem(ownerId, payload = {}, { actorId } = {}) {
  if (!ownerId) {
    throw new ValidationError('ownerId is required.');
  }
  return applyCreate({ ...payload, ownerId }, { actorId: actorId ?? ownerId });
}

export async function updateItem(ownerId, itemId, payload = {}, { actorId } = {}) {
  const item = await CreationStudioItem.findOne({
    where: { id: itemId, ownerId },
    include: [{ model: CreationStudioStep, as: 'steps' }],
  });
  if (!item) {
    return null;
  }
  const prepared = preparePayload(payload, { actorId: actorId ?? ownerId, existing: item.toPublicObject() });
  if (prepared.slug) {
    prepared.slug = await ensureUniqueSlug(prepared.slug, { ignoreId: item.id });
  }
  await item.update(prepared);
  return sanitiseItem(item);
}

export async function recordStepProgress(ownerId, itemId, stepKey, payload = {}, { actorId } = {}) {
  const normalisedKey = normaliseString(stepKey);
  if (!normalisedKey || !CREATION_STUDIO_STEPS.includes(normalisedKey)) {
    throw new ValidationError('Unsupported creation studio step.');
  }
  const item = await CreationStudioItem.findOne({ where: { id: itemId, ownerId } });
  if (!item) {
    return null;
  }
  const [step] = await CreationStudioStep.findOrCreate({
    where: { itemId, stepKey: normalisedKey },
    defaults: { itemId, stepKey: normalisedKey, completed: false, data: {} },
  });
  await step.update({
    data: payload.data ?? payload ?? {},
    completed: Boolean(payload.completed ?? payload.isComplete),
    completedAt: payload.completed || payload.isComplete ? new Date() : null,
    lastEditedBy: actorId ?? ownerId,
  });
  return step.get({ plain: true });
}

export async function shareItem(ownerId, itemId, payload = {}, { actorId } = {}) {
  const item = await CreationStudioItem.findOne({ where: { id: itemId, ownerId } });
  if (!item) {
    return null;
  }
  const visibility = payload.visibility ? normaliseVisibility(payload.visibility) : item.visibility;
  const status = payload.status ? normaliseStatus(payload.status) : item.status;
  await item.update({
    shareTargets: normaliseArray(payload.targets ?? payload.shareTargets),
    shareMessage: normaliseString(payload.message ?? payload.shareMessage),
    visibility,
    status: status === 'draft' ? 'published' : status,
    launchAt: payload.launchAt ? new Date(payload.launchAt) : item.launchAt ?? new Date(),
    updatedById: actorId ?? ownerId,
  });
  return sanitiseItem(item);
}

export async function archiveItem(ownerId, itemId, { actorId } = {}) {
  const item = await CreationStudioItem.findOne({ where: { id: itemId, ownerId } });
  if (!item) {
    return null;
  }
  await item.update({
    status: 'archived',
    archivedAt: new Date(),
    updatedById: actorId ?? ownerId,
  });
  return true;
}

export default {
  listCreationStudioItems,
  getCreationStudioOverview,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  deleteCreationStudioItem,
  listItems,
  getDashboardSnapshot,
  getWorkspace,
  createItem,
  updateItem,
  recordStepProgress,
  shareItem,
  archiveItem,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_STEPS,
};
