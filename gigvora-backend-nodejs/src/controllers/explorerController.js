import { performance } from 'node:perf_hooks';
import { ZodError, z } from 'zod';
import {
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  updateRecord,
} from '../services/explorerStore.js';
import { resolveExplorerCollection } from '../utils/explorerCollections.js';
import { ValidationError } from '../utils/errors.js';

const urlSchema = z
  .string()
  .url()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: 'URL cannot be empty.' });

const mediaSchema = z.object({
  heroImage: urlSchema.optional(),
  gallery: z.array(urlSchema).optional(),
  videoUrl: urlSchema.optional(),
});

const numericAmountSchema = z.preprocess((value) => {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}, z.number().nonnegative());

const priceSchema = z
  .object({
    amount: numericAmountSchema.optional(),
    currency: z
      .string()
      .trim()
      .min(1)
      .transform((value) => value.toUpperCase())
      .optional(),
    unit: z.string().trim().min(1).optional(),
  })
  .optional();

const ownerSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.string().optional(),
    avatar: urlSchema.optional(),
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
  heroImage: urlSchema.optional(),
  gallery: z.array(urlSchema).optional(),
  videoUrl: urlSchema.optional(),
  detailUrl: urlSchema.optional(),
  applicationUrl: urlSchema.optional(),
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

const updateSchema = baseRecordSchema.partial().superRefine((value, ctx) => {
  const hasAtLeastOneField = Object.keys(value).some((key) => value[key] !== undefined);
  if (!hasAtLeastOneField) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field must be provided to update the explorer record.',
    });
  }
});

function resolveCollection(category) {
  return resolveExplorerCollection(category);
}

function stringToArray(value) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => (item == null ? '' : `${item}`.trim()))
          .filter((item) => item.length),
      ),
    );
  }
  if (typeof value === 'string' && value.trim().length) {
    return Array.from(
      new Set(
        value
          .split(',')
          .map((token) => token.trim())
          .filter((token) => token.length),
      ),
    );
  }
  return [];
}

function normalisePrice(price) {
  if (!price) {
    return undefined;
  }
  const amount = Number(price.amount);
  const normalised = {};
  if (Number.isFinite(amount) && amount >= 0) {
    normalised.amount = amount;
  }
  if (price.currency) {
    const trimmed = `${price.currency}`.trim();
    if (trimmed) {
      normalised.currency = trimmed.toUpperCase();
    }
  }
  if (price.unit) {
    const trimmed = `${price.unit}`.trim();
    if (trimmed) {
      normalised.unit = trimmed;
    }
  }
  return Object.keys(normalised).length ? normalised : undefined;
}

function normaliseRecordPayload(category, payload) {
  const parsed = recordSchema.parse(payload);
  const base = {
    ...parsed,
    category,
  };

  if (payload.skills != null) {
    base.skills = stringToArray(payload.skills);
  }
  if (base.skills?.length) {
    base.skills = stringToArray(base.skills);
  }
  if (payload.tags != null) {
    base.tags = stringToArray(payload.tags);
  }
  if (base.tags?.length) {
    base.tags = stringToArray(base.tags);
  }

  const normalisedPrice = normalisePrice(payload.price ?? base.price);
  if (normalisedPrice) {
    base.price = normalisedPrice;
  } else {
    delete base.price;
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
  const result = Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => value !== undefined),
  );

  if (payload.skills != null) {
    const normalisedSkills = stringToArray(payload.skills ?? []);
    if (normalisedSkills.length) {
      result.skills = normalisedSkills;
    } else {
      delete result.skills;
    }
  } else if (result.skills?.length) {
    result.skills = stringToArray(result.skills);
    if (!result.skills.length) {
      delete result.skills;
    }
  }

  if (payload.tags != null) {
    const normalisedTags = stringToArray(payload.tags ?? []);
    if (normalisedTags.length) {
      result.tags = normalisedTags;
    } else {
      delete result.tags;
    }
  } else if (result.tags?.length) {
    result.tags = stringToArray(result.tags);
    if (!result.tags.length) {
      delete result.tags;
    }
  }

  const normalisedPrice = normalisePrice(payload.price ?? result.price);
  if (payload.price != null) {
    if (normalisedPrice) {
      result.price = normalisedPrice;
    } else {
      delete result.price;
    }
  } else if (normalisedPrice) {
    result.price = normalisedPrice;
  }

  if (result.media) {
    result.heroImage = result.heroImage ?? result.media.heroImage;
    result.gallery = result.gallery ?? result.media.gallery;
    result.videoUrl = result.videoUrl ?? result.media.videoUrl;
    delete result.media;
  }

  if (!Object.keys(result).length) {
    throw new ValidationError('At least one field must be provided to update the explorer record.', [
      { message: 'At least one field must be provided to update the explorer record.' },
    ]);
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
      const parsed = JSON.parse(filters);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
      return {};
    } catch (error) {
      throw new ValidationError('filters must be valid JSON.', { cause: error });
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

function normalisePage(value) {
  const parsed = Number.parseInt(value ?? '1', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(parsed, 100);
}

function normalisePageSize(value) {
  const parsed = Number.parseInt(value ?? '20', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 20;
  }
  return Math.min(parsed, 100);
}

function parseSort(sort) {
  if (!sort) {
    return 'default';
  }
  const normalised = `${sort}`.trim().toLowerCase();
  if (!SORT_HANDLERS[normalised]) {
    throw new ValidationError('Unsupported sort option.');
  }
  return normalised;
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
    const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 255) : '';
    const sort = parseSort(req.query.sort);
    const pageSize = normalisePageSize(req.query.pageSize);
    const page = normalisePage(req.query.page);
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
      appliedFilters: filters,
      sort,
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
    if (error instanceof ZodError) {
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
    if (!recordId || !`${recordId}`.trim()) {
      throw new ValidationError('A valid record identifier must be provided for explorer updates.');
    }
    const record = await updateRecord(collection, recordId, payload);
    if (!record) {
      return res.status(404).json({ message: 'Explorer record not found' });
    }
    return res.json(record);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Validation failed', issues: error.issues });
    }
    if (error instanceof ValidationError) {
      const issues = Array.isArray(error.details) ? error.details : [{ message: error.message }];
      return res.status(400).json({ message: 'Validation failed', issues });
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
