import { Op, fn, col } from 'sequelize';
import {
  CreationStudioItem,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  ProviderWorkspace,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normaliseNumber(value, { integer = false } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (integer) {
    return Math.trunc(numeric);
  }
  return numeric;
}

function normaliseTags(tags) {
  if (!tags) {
    return [];
  }
  const source = Array.isArray(tags) ? tags : `${tags}`.split(',');
  const normalised = source
    .map((tag) => `${tag}`.trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => tag.slice(0, 60));
  return Array.from(new Set(normalised));
}

function normaliseSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return {};
  }
  const cleaned = Object.entries(settings).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = normaliseSettings(value);
      if (Object.keys(nested).length) {
        accumulator[key] = nested;
      }
      return accumulator;
    }
    accumulator[key] = value;
    return accumulator;
  }, {});
  return cleaned;
}

function mapItem(record) {
  if (!record) {
    return null;
  }
  if (typeof record.toPublicObject === 'function') {
    return record.toPublicObject();
  }
  const plain = record.get ? record.get({ plain: true }) : record;
  return {
    ...plain,
    tags: normaliseTags(plain.tags),
    settings: normaliseSettings(plain.settings),
  };
}

function deriveStatus({ status, publishAt }) {
  const now = new Date();
  if (publishAt && new Date(publishAt) > now) {
    return 'scheduled';
  }
  if (status === 'published') {
    return 'published';
  }
  if (status === 'archived') {
    return 'archived';
  }
  return status === 'scheduled' ? 'scheduled' : 'draft';
}

async function listAvailableWorkspaces() {
  const workspaces = await ProviderWorkspace.findAll({
    where: { type: 'company' },
    attributes: ['id', 'name', 'slug'],
    order: [['name', 'ASC']],
    limit: 50,
  });
  return workspaces.map((workspace) => workspace.get({ plain: true }));
}

export async function listCreationStudioItems({
  workspaceId,
  type,
  status,
  search,
  limit = 20,
  offset = 0,
} = {}) {
  const where = {};
  if (workspaceId != null) {
    where.workspaceId = workspaceId;
  }
  if (type) {
    where.type = type;
  }
  if (status) {
    where.status = status;
  }
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike ?? Op.like]: `%${search}%` } },
      { summary: { [Op.iLike ?? Op.like]: `%${search}%` } },
    ];
  }

  const items = await CreationStudioItem.findAll({
    where,
    order: [
      ['status', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
    limit,
    offset,
  });
  return items.map(mapItem);
}

function buildTypeSummaries(groups) {
  const summaryMap = new Map();
  groups.forEach((row) => {
    const type = row.type;
    const status = row.status;
    const count = Number(row.dataValues?.count ?? row.count ?? 0);
    if (!summaryMap.has(type)) {
      summaryMap.set(type, {
        type,
        total: 0,
        byStatus: {},
      });
    }
    const entry = summaryMap.get(type);
    entry.total += count;
    entry.byStatus[status] = (entry.byStatus[status] ?? 0) + count;
  });

  const typeSummaries = CREATION_STUDIO_ITEM_TYPES.map((type) => {
    const entry = summaryMap.get(type) ?? { type, total: 0, byStatus: {} };
    return {
      type,
      total: entry.total,
      byStatus: CREATION_STUDIO_ITEM_STATUSES.reduce((accumulator, key) => {
        accumulator[key] = entry.byStatus[key] ?? 0;
        return accumulator;
      }, {}),
    };
  });

  const totals = typeSummaries.reduce(
    (accumulator, entry) => {
      accumulator.total += entry.total;
      CREATION_STUDIO_ITEM_STATUSES.forEach((status) => {
        accumulator.byStatus[status] = (accumulator.byStatus[status] ?? 0) + (entry.byStatus[status] ?? 0);
      });
      return accumulator;
    },
    { total: 0, byStatus: CREATION_STUDIO_ITEM_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {}) },
  );

  return { typeSummaries, totals };
}

export async function getCreationStudioOverview({ workspaceId, limit = 16 } = {}) {
  const where = {};
  if (workspaceId != null) {
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
      attributes: [
        'type',
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      where,
      group: ['type', 'status'],
    }),
  ]);

  const { typeSummaries, totals } = buildTypeSummaries(grouped);

  const upcoming = items
    .filter((item) => item.launchDate && new Date(item.launchDate).getTime() >= Date.now())
    .sort((a, b) => new Date(a.launchDate) - new Date(b.launchDate))
    .slice(0, 6)
    .map(mapItem);

  const draftRecommendations = CREATION_STUDIO_ITEM_TYPES.filter((type) =>
    !typeSummaries.some((entry) => entry.type === type && entry.total > 0),
  );

  const availableWorkspaces = await listAvailableWorkspaces();

  return {
    meta: {
      selectedWorkspaceId: workspaceId ?? null,
      availableWorkspaces,
      types: CREATION_STUDIO_ITEM_TYPES,
      statuses: CREATION_STUDIO_ITEM_STATUSES,
      visibilities: CREATION_STUDIO_VISIBILITIES,
    },
    items: items.map(mapItem),
    upcoming,
    summary: {
      total: totals.total,
      drafts: totals.byStatus.draft ?? 0,
      scheduled: totals.byStatus.scheduled ?? 0,
      published: totals.byStatus.published ?? 0,
      archived: totals.byStatus.archived ?? 0,
    },
    typeSummaries,
    draftRecommendations,
  };
}

function preparePayload(payload = {}) {
  const normalized = {
    workspaceId: payload.workspaceId ?? null,
    createdById: payload.createdById ?? null,
    type: payload.type,
    title: payload.title,
    headline: payload.headline ?? null,
    summary: payload.summary ?? null,
    content: payload.content ?? null,
    status: payload.status ?? 'draft',
    visibility: payload.visibility ?? 'workspace',
    category: payload.category ?? null,
    location: payload.location ?? null,
    targetAudience: payload.targetAudience ?? null,
    launchDate: payload.launchDate ?? null,
    publishAt: payload.publishAt ?? null,
    publishedAt: payload.publishedAt ?? null,
    endDate: payload.endDate ?? null,
    imageUrl: payload.imageUrl ?? null,
    tags: normaliseTags(payload.tags),
    settings: normaliseSettings(payload.settings),
    metadata: normaliseSettings(payload.metadata),
    budgetAmount: normaliseNumber(payload.budgetAmount),
    budgetCurrency: payload.budgetCurrency ?? null,
    compensationMin: normaliseNumber(payload.compensationMin),
    compensationMax: normaliseNumber(payload.compensationMax),
    compensationCurrency: payload.compensationCurrency ?? null,
    durationWeeks: normaliseNumber(payload.durationWeeks, { integer: true }),
    commitmentHours: normaliseNumber(payload.commitmentHours, { integer: true }),
    remoteEligible: payload.remoteEligible != null ? Boolean(payload.remoteEligible) : true,
  };

  normalized.status = deriveStatus({ status: normalized.status, publishAt: normalized.publishAt });
  if (normalized.status !== 'scheduled') {
    normalized.publishAt = null;
  }
  if (normalized.status === 'draft') {
    normalized.publishedAt = null;
  } else if (normalized.status === 'published' && !normalized.publishedAt) {
    normalized.publishedAt = new Date();
  }
  return normalized;
}

export async function createCreationStudioItem(payload) {
  if (!payload?.type || !CREATION_STUDIO_ITEM_TYPES.includes(payload.type)) {
    throw new ValidationError('Unsupported creation studio type.');
  }
  if (!payload?.title) {
    throw new ValidationError('Title is required.');
  }
  const prepared = preparePayload(payload);
  const created = await CreationStudioItem.create(prepared);
  return mapItem(created);
}

export async function updateCreationStudioItem(id, payload = {}) {
  const item = await CreationStudioItem.findByPk(id);
  if (!item) {
    throw new NotFoundError('Creation studio item not found.');
  }
  const prepared = preparePayload({ ...item.toPublicObject(), ...payload });
  await item.update(prepared);
  return mapItem(item);
}

export async function publishCreationStudioItem(id, payload = {}) {
  const item = await CreationStudioItem.findByPk(id);
  if (!item) {
    throw new NotFoundError('Creation studio item not found.');
  }
  const publishAt = payload.publishAt ? new Date(payload.publishAt) : null;
  if (publishAt && Number.isNaN(publishAt.getTime())) {
    throw new ValidationError('publishAt must be a valid date.');
  }
  if (publishAt && publishAt > new Date()) {
    await item.update({ status: 'scheduled', publishAt });
    return mapItem(item);
  }
  await item.update({ status: 'published', publishAt: null, publishedAt: new Date() });
  return mapItem(item);
}

export async function deleteCreationStudioItem(id) {
  const item = await CreationStudioItem.findByPk(id);
  if (!item) {
    throw new NotFoundError('Creation studio item not found.');
  }
  await item.destroy();
  return { success: true };
}

export default {
  listCreationStudioItems,
  getCreationStudioOverview,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  deleteCreationStudioItem,
};
