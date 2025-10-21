import { performance } from 'node:perf_hooks';
import { z } from 'zod';
import {
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  updateRecord,
} from '../services/explorerStore.js';
import { resolveExplorerCollection } from '../utils/explorerCollections.js';

const mediaSchema = z.object({
  heroImage: z.string().url().optional(),
  gallery: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),
});

const priceSchema = z
  .object({
    amount: z.number().nonnegative().optional(),
    currency: z.string().min(1).optional(),
    unit: z.string().min(1).optional(),
  })
  .optional();

const ownerSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.string().optional(),
    avatar: z.string().url().optional(),
  })
  .optional();

const baseRecordSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.string().min(1, 'Status is required'),
  location: z.string().min(1).optional(),
  organization: z.string().optional(),
  employmentType: z.string().optional(),
  duration: z.string().optional(),
  experienceLevel: z.string().optional(),
  availability: z.string().optional(),
  isRemote: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  price: priceSchema,
  media: mediaSchema.optional(),
  heroImage: z.string().url().optional(),
  gallery: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),
  detailUrl: z.string().url().optional(),
  applicationUrl: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  owner: ownerSchema,
  geo: z
    .object({
      lat: z.union([z.string(), z.number()]).optional(),
      lng: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
  longDescription: z.string().optional(),
});

const recordSchema = baseRecordSchema.extend({
  id: z.string().optional(),
});

const updateSchema = baseRecordSchema.partial();

function resolveCollection(category) {
  return resolveExplorerCollection(category);
}

function stringToArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => item && `${item}`.trim().length);
  }
  if (typeof value === 'string' && value.trim().length) {
    return value
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length);
  }
  return [];
}

function normaliseRecordPayload(category, payload) {
  const parsed = recordSchema.parse(payload);
  const base = {
    ...parsed,
    category,
  };

  if (!base.skills && payload.skills) {
    base.skills = stringToArray(payload.skills);
  }
  if (!base.tags && payload.tags) {
    base.tags = stringToArray(payload.tags);
  }

  if (base.media) {
    base.heroImage = base.heroImage ?? base.media.heroImage;
    base.gallery = base.gallery ?? base.media.gallery;
    base.videoUrl = base.videoUrl ?? base.media.videoUrl;
    delete base.media;
  }

  return base;
}

function normaliseUpdatePayload(payload) {
  const parsed = updateSchema.parse(payload);
  const result = { ...parsed };
  if (payload.skills != null) {
    result.skills = stringToArray(payload.skills ?? []);
  }
  if (payload.tags != null) {
    result.tags = stringToArray(payload.tags ?? []);
  }
  if (result.media) {
    result.heroImage = result.heroImage ?? result.media.heroImage;
    result.gallery = result.gallery ?? result.media.gallery;
    result.videoUrl = result.videoUrl ?? result.media.videoUrl;
    delete result.media;
  }
  return result;
}

function textMatches(record, query) {
  if (!query) {
    return true;
  }
  const haystack = [
    record.title,
    record.summary,
    record.description,
    record.organization,
    record.location,
    ...(record.skills ?? []),
    ...(record.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function filterByArray(recordValues, filterValues) {
  if (!filterValues?.length) {
    return true;
  }
  if (!recordValues?.length) {
    return false;
  }
  return filterValues.every((value) =>
    recordValues.some((recordValue) => `${recordValue}`.toLowerCase() === `${value}`.toLowerCase()),
  );
}

function buildFilters(filters) {
  if (!filters) {
    return {};
  }
  if (typeof filters === 'string') {
    try {
      return JSON.parse(filters);
    } catch (error) {
      return {};
    }
  }
  if (typeof filters === 'object') {
    return filters;
  }
  return {};
}

function recordMatchesFilters(record, filters) {
  const { locations, countries, regions, cities, skills, statuses, employmentTypes, isRemote } = filters;
  if (isRemote != null) {
    if (Boolean(record.isRemote) !== Boolean(isRemote)) {
      return false;
    }
  }
  if (statuses?.length && !statuses.includes(record.status)) {
    return false;
  }
  if (employmentTypes?.length && !employmentTypes.includes(record.employmentType)) {
    return false;
  }
  const locationFilters = [...(locations ?? []), ...(countries ?? []), ...(regions ?? []), ...(cities ?? [])].filter(Boolean);
  if (
    locationFilters.length &&
    !locationFilters.some((candidate) =>
      `${record.location ?? ''}`.toLowerCase().includes(`${candidate}`.toLowerCase()),
    )
  ) {
    return false;
  }
  if (!filterByArray(record.skills, skills)) {
    return false;
  }
  return true;
}

const SORT_HANDLERS = {
  default: (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0),
  newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  alphabetical: (a, b) => (a.title || '').localeCompare(b.title || ''),
  budget: (a, b) => (b.price?.amount ?? 0) - (a.price?.amount ?? 0),
  price_low_high: (a, b) => (a.price?.amount ?? 0) - (b.price?.amount ?? 0),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  availability: (a, b) => (a.status === 'available' ? -1 : 1) - (b.status === 'available' ? -1 : 1),
  status: (a, b) => (a.status || '').localeCompare(b.status || ''),
};

function sortRecords(records, sort) {
  const handler = SORT_HANDLERS[sort] ?? SORT_HANDLERS.default;
  return [...records].sort(handler);
}

function resolveDurationCategory(duration) {
  if (!duration) {
    return null;
  }
  const normalized = `${duration}`.toLowerCase();
  if (normalized.includes('day') || normalized.includes('week')) {
    return 'short_term';
  }
  if (normalized.includes('month')) {
    return 'medium_term';
  }
  if (normalized.includes('year') || normalized.includes('permanent') || normalized.includes('retainer')) {
    return 'long_term';
  }
  return null;
}

function buildFacets(records) {
  const facet = {
    status: {},
    statuses: {},
    employmentType: {},
    durationCategory: {},
    geoCity: {},
    organization: {},
    track: {},
    skills: {},
  };
  records.forEach((record) => {
    if (record.status) {
      facet.status[record.status] = (facet.status[record.status] || 0) + 1;
      facet.statuses[record.status] = (facet.statuses[record.status] || 0) + 1;
    }
    if (record.employmentType) {
      facet.employmentType[record.employmentType] = (facet.employmentType[record.employmentType] || 0) + 1;
    }
    const durationCategory = resolveDurationCategory(record.duration);
    if (durationCategory) {
      facet.durationCategory[durationCategory] = (facet.durationCategory[durationCategory] || 0) + 1;
    }
    if (record.location) {
      facet.geoCity[record.location] = (facet.geoCity[record.location] || 0) + 1;
    }
    if (record.organization) {
      facet.organization[record.organization] = (facet.organization[record.organization] || 0) + 1;
    }
    if (record.track) {
      facet.track[record.track] = (facet.track[record.track] || 0) + 1;
    }
    (record.skills ?? []).forEach((skill) => {
      facet.skills[skill] = (facet.skills[skill] || 0) + 1;
    });
  });
  return facet;
}

export async function listExplorer(req, res, next) {
  try {
    const start = performance.now();
    const { category } = req.params;
    const collection = resolveCollection(category);
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'default';
    const pageSize = Math.max(1, Math.min(Number.parseInt(req.query.pageSize, 10) || 20, 100));
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const filters = buildFilters(req.query.filters);

    const records = await listRecords(collection);
    const filtered = records
      .filter((record) => textMatches(record, query))
      .filter((record) => recordMatchesFilters(record, filters));

    const sorted = sortRecords(filtered, sort);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;
    const items = sorted.slice(offset, offset + pageSize);

    const duration = performance.now() - start;

    res.json({
      items,
      total,
      totalPages,
      page,
      pageSize,
      metrics: {
        processingTimeMs: Math.round(duration),
        source: 'explorer-dataset',
      },
      facets: buildFacets(filtered),
    });
  } catch (error) {
    next(error);
  }
}

export async function getExplorerRecord(req, res, next) {
  try {
    const { category, recordId } = req.params;
    const collection = resolveCollection(category);
    const record = await getRecord(collection, recordId);
    if (!record) {
      return res.status(404).json({ message: 'Explorer record not found' });
    }
    return res.json(record);
  } catch (error) {
    return next(error);
  }
}

export async function createExplorerRecord(req, res, next) {
  try {
    const { category } = req.params;
    const collection = resolveCollection(category);
    const payload = normaliseRecordPayload(category, req.body ?? {});
    const record = await createRecord(collection, payload);
    res.status(201).json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', issues: error.issues });
    }
    return next(error);
  }
}

export async function updateExplorerRecord(req, res, next) {
  try {
    const { category, recordId } = req.params;
    const collection = resolveCollection(category);
    const payload = normaliseUpdatePayload(req.body ?? {});
    const record = await updateRecord(collection, recordId, payload);
    if (!record) {
      return res.status(404).json({ message: 'Explorer record not found' });
    }
    return res.json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', issues: error.issues });
    }
    return next(error);
  }
}

export async function deleteExplorerRecord(req, res, next) {
  try {
    const { category, recordId } = req.params;
    const collection = resolveCollection(category);
    const deleted = await deleteRecord(collection, recordId);
    if (!deleted) {
      return res.status(404).json({ message: 'Explorer record not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export default {
  listExplorer,
  getExplorerRecord,
  createExplorerRecord,
  updateExplorerRecord,
  deleteExplorerRecord,
};
