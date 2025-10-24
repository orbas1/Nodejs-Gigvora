import { Op, fn, col } from 'sequelize';
import {
  CreationStudioItem,
  CreationStudioStep,
  CreationStudioCollaborator,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_STEPS,
  CREATION_STUDIO_COLLABORATOR_STATUSES,
} from '../models/creationStudioModels.js';
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
  const candidate = normaliseString(value) ?? 'workspace';
  if (!candidate) {
    return 'workspace';
  }
  if (candidate === 'community') {
    return CREATION_STUDIO_VISIBILITIES.includes('community') ? 'community' : 'public';
  }
  if (candidate === 'connections' || candidate === 'connection') {
    return CREATION_STUDIO_VISIBILITIES.includes('connections') ? 'connections' : 'workspace';
  }
  if (CREATION_STUDIO_VISIBILITIES.includes(candidate)) {
    return candidate;
  }
  return 'workspace';
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

function normaliseDecimal(value, { min, max } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (typeof min === 'number' && numeric < min) {
    return min;
  }
  if (typeof max === 'number' && numeric > max) {
    return max;
  }
  return numeric;
}

function normaliseCurrency(value) {
  const code = normaliseString(value, { fallback: '' });
  if (!code) {
    return null;
  }
  return code.slice(0, 6).toUpperCase();
}

function normaliseEmail(value) {
  const email = normaliseString(value);
  if (!email) {
    return null;
  }
  const regex = /^(?=.{3,254}$)[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return regex.test(email) ? email.toLowerCase() : null;
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

function sanitiseCollaborator(record) {
  if (!record) {
    return null;
  }
  const plain = record.toPublicObject ? record.toPublicObject() : record;
  return {
    ...plain,
    metadata: plain.metadata ?? {},
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
    case 'job':
      return { requiresBrief: true, compensationType: 'salary' };
    case 'volunteering':
      return { requiresBrief: true, backgroundChecks: false };
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
  const headline =
    payload.headline !== undefined ? normaliseString(payload.headline) : existing?.headline ?? null;
  const summary = payload.summary !== undefined ? normaliseString(payload.summary) : existing?.summary ?? null;
  const description =
    payload.description !== undefined ? normaliseString(payload.description) : existing?.description ?? null;

  const status = payload.status ? normaliseStatus(payload.status) : existing?.status ?? 'draft';
  const visibility = payload.visibility ? normaliseVisibility(payload.visibility) : existing?.visibility ?? 'workspace';

  const settings = payload.settings !== undefined ? { ...buildDefaultSettings(type), ...(payload.settings ?? {}) } : existing?.settings ?? buildDefaultSettings(type);

  const metadata = payload.metadata !== undefined ? payload.metadata ?? {} : existing?.metadata ?? {};
  const shareTargets = payload.shareTargets !== undefined ? normaliseArray(payload.shareTargets) : existing?.shareTargets ?? [];
  const shareMessage =
    payload.shareMessage !== undefined ? normaliseString(payload.shareMessage) : existing?.shareMessage ?? null;

  const tags = payload.tags !== undefined ? normaliseArray(payload.tags) : existing?.tags ?? [];

  const publishAt = payload.publishAt ? new Date(payload.publishAt) : existing?.publishAt ?? null;
  if (publishAt && Number.isNaN(publishAt.getTime())) {
    throw new ValidationError('publishAt must be a valid date.');
  }

  const launchAt = payload.launchAt ? new Date(payload.launchAt) : existing?.launchAt ?? null;
  if (launchAt && Number.isNaN(launchAt.getTime())) {
    throw new ValidationError('launchAt must be a valid date.');
  }

  const slug = payload.slug !== undefined ? normaliseString(payload.slug) : existing?.slug ?? null;
  const category = payload.category !== undefined ? normaliseString(payload.category) : existing?.category ?? null;
  const targetAudience =
    payload.targetAudience !== undefined
      ? normaliseString(payload.targetAudience)
      : existing?.targetAudience ?? null;
  const heroImageUrl =
    payload.heroImageUrl !== undefined ? normaliseString(payload.heroImageUrl) : existing?.heroImageUrl ?? null;
  const locationLabel =
    payload.locationLabel !== undefined ? normaliseString(payload.locationLabel) : existing?.locationLabel ?? null;
  const locationMode =
    payload.locationMode !== undefined
      ? normaliseString(payload.locationMode) ?? 'hybrid'
      : existing?.locationMode ?? 'hybrid';

  const budgetAmount =
    payload.budgetAmount !== undefined ? normaliseDecimal(payload.budgetAmount, { min: 0 }) : existing?.budgetAmount ?? null;
  const budgetCurrency =
    payload.budgetCurrency !== undefined ? normaliseCurrency(payload.budgetCurrency) : existing?.budgetCurrency ?? null;
  const compensationMin =
    payload.compensationMin !== undefined
      ? normaliseDecimal(payload.compensationMin, { min: 0 })
      : existing?.compensationMin ?? null;
  const compensationMax =
    payload.compensationMax !== undefined
      ? normaliseDecimal(payload.compensationMax, { min: compensationMin ?? 0 })
      : existing?.compensationMax ?? null;
  const compensationCurrency =
    payload.compensationCurrency !== undefined
      ? normaliseCurrency(payload.compensationCurrency)
      : existing?.compensationCurrency ?? null;
  const durationWeeks =
    payload.durationWeeks !== undefined
      ? normaliseNonNegativeInteger(payload.durationWeeks)
      : existing?.durationWeeks ?? null;
  const commitmentHours =
    payload.commitmentHours !== undefined
      ? normaliseNonNegativeInteger(payload.commitmentHours)
      : existing?.commitmentHours ?? null;
  const remoteEligible =
    payload.remoteEligible !== undefined ? Boolean(payload.remoteEligible) : existing?.remoteEligible ?? true;

  return {
    type,
    title,
    headline,
    summary,
    description,
    status,
    visibility,
    settings,
    metadata,
    shareTargets,
    shareMessage,
    tags,
    publishAt: status === 'scheduled' ? publishAt : null,
    launchAt,
    updatedById: actorId ?? existing?.updatedById ?? null,
    slug,
    category,
    targetAudience,
    heroImageUrl,
    locationLabel,
    locationMode,
    budgetAmount,
    budgetCurrency,
    compensationMin,
    compensationMax,
    compensationCurrency,
    durationWeeks,
    commitmentHours,
    remoteEligible,
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
  return [];
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

export async function listCollaborators(ownerId, { trackType } = {}) {
  if (!ownerId) {
    return [];
  }
  const where = { ownerId };
  if (trackType) {
    where.trackType = requireType(trackType);
  }
  const collaborators = await CreationStudioCollaborator.findAll({
    where,
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });
  return collaborators.map((record) => sanitiseCollaborator(record)).filter(Boolean);
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
  return { success: true };
}

export async function inviteCollaborator(ownerId, payload = {}, { actorId } = {}) {
  if (!ownerId) {
    throw new ValidationError('ownerId is required to invite collaborators.');
  }
  const email = normaliseEmail(payload.email ?? payload.invitee);
  if (!email) {
    throw new ValidationError('A valid collaborator email is required.');
  }
  const trackType = requireType(payload.trackType ?? payload.type ?? payload.targetType ?? 'project');
  const role = normaliseString(payload.role, { fallback: 'Collaborator' }) || 'Collaborator';
  const status = CREATION_STUDIO_COLLABORATOR_STATUSES.includes(payload.status)
    ? payload.status
    : 'invited';
  const collaborator = await CreationStudioCollaborator.create({
    ownerId,
    workspaceId: payload.workspaceId ?? null,
    itemId: payload.itemId ?? null,
    trackType,
    email,
    role,
    status,
    invitedById: actorId ?? ownerId,
    metadata: payload.metadata ?? {},
  });
  return sanitiseCollaborator(collaborator);
}

export async function updateCollaborator(ownerId, collaboratorId, payload = {}, { actorId } = {}) {
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update collaborators.');
  }
  const collaborator = await CreationStudioCollaborator.findOne({ where: { id: collaboratorId, ownerId } });
  if (!collaborator) {
    return null;
  }
  const updates = {};
  if (payload.status) {
    if (!CREATION_STUDIO_COLLABORATOR_STATUSES.includes(payload.status)) {
      throw new ValidationError('Unsupported collaborator status.');
    }
    updates.status = payload.status;
    updates.respondedAt =
      payload.status === 'accepted' || payload.status === 'declined'
        ? payload.respondedAt
          ? new Date(payload.respondedAt)
          : new Date()
        : collaborator.respondedAt;
  }
  if (payload.itemId !== undefined) {
    updates.itemId = payload.itemId ?? null;
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata ?? {};
  }
  if (Object.keys(updates).length === 0) {
    return sanitiseCollaborator(collaborator);
  }
  updates.invitedById = collaborator.invitedById ?? actorId ?? ownerId;
  await collaborator.update(updates);
  return sanitiseCollaborator(collaborator);
}

export default {
  listCreationStudioItems,
  getCreationStudioOverview,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  deleteCreationStudioItem,
  listItems,
  listCollaborators,
  getDashboardSnapshot,
  getWorkspace,
  createItem,
  updateItem,
  recordStepProgress,
  shareItem,
  archiveItem,
  inviteCollaborator,
  updateCollaborator,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_STEPS,
  CREATION_STUDIO_COLLABORATOR_STATUSES,
};
