import { z } from 'zod';
import { DIGEST_FREQUENCIES } from '../../models/constants/index.js';
import { optionalBoolean, optionalNumber, optionalTrimmedString } from '../primitives.js';

const ALLOWED_FILTER_KEYS = [
  'employmentTypes',
  'employmentCategories',
  'durationCategories',
  'budgetCurrencies',
  'statuses',
  'tracks',
  'organizations',
  'locations',
  'countries',
  'regions',
  'cities',
  'updatedWithin',
  'isRemote',
];

const digestFrequencySet = new Set(DIGEST_FREQUENCIES);

const CATEGORY_ALIASES = {
  job: 'job',
  jobs: 'job',
  gig: 'gig',
  gigs: 'gig',
  project: 'project',
  projects: 'project',
  launchpad: 'launchpad',
  launchpads: 'launchpad',
  volunteering: 'volunteering',
  volunteer: 'volunteering',
};

const canonicalOpportunityCategories = new Set(Object.values(CATEGORY_ALIASES));

function coerceJsonObject(value, ctx, { fieldName }) {
  if (value == null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a JSON object.` });
      return z.NEVER;
    } catch (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must contain valid JSON.` });
      return z.NEVER;
    }
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be an object.` });
  return z.NEVER;
}

function sanitiseFilters(rawFilters) {
  if (!rawFilters) {
    return undefined;
  }

  const normalised = {};

  for (const key of ALLOWED_FILTER_KEYS) {
    if (!(key in rawFilters)) {
      continue;
    }

    const value = rawFilters[key];
    if (Array.isArray(value)) {
      const cleaned = value
        .map((item) => `${item}`.trim())
        .filter((item) => item.length > 0 && item.length <= 120);
      if (cleaned.length) {
        normalised[key] = [...new Set(cleaned)];
      }
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const trimmed = `${value}`.trim();
      if (trimmed) {
        normalised[key] = trimmed;
      }
      continue;
    }

    if (typeof value === 'boolean') {
      normalised[key] = value;
    }
  }

  if (typeof normalised.isRemote === 'string') {
    const lowered = normalised.isRemote.toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(lowered)) {
      normalised.isRemote = true;
    } else if (['false', '0', 'no', 'n', 'off'].includes(lowered)) {
      normalised.isRemote = false;
    } else {
      delete normalised.isRemote;
    }
  }

  return Object.keys(normalised).length ? normalised : undefined;
}

function sanitiseViewport(rawViewport, ctx) {
  if (rawViewport == null || rawViewport === '') {
    return undefined;
  }

  let payload = rawViewport;

  if (typeof rawViewport === 'string') {
    try {
      const parsed = JSON.parse(rawViewport);
      payload = parsed;
    } catch (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'viewport must contain valid JSON.' });
      return z.NEVER;
    }
  }

  if (!payload || typeof payload !== 'object') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'viewport must be an object.' });
    return z.NEVER;
  }

  const box = payload.boundingBox ?? payload;
  const north = Number(box.north);
  const south = Number(box.south);
  const east = Number(box.east);
  const west = Number(box.west);

  if (![north, south, east, west].every((value) => Number.isFinite(value))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'viewport boundingBox must include numeric north, south, east, and west values.' });
    return z.NEVER;
  }

  return {
    boundingBox: {
      north,
      south,
      east,
      west,
    },
  };
}

function sanitiseSort(rawSort) {
  if (rawSort == null || rawSort === '') {
    return undefined;
  }

  if (Array.isArray(rawSort)) {
    const cleaned = rawSort.map((value) => `${value}`.trim()).filter(Boolean);
    return cleaned.length ? cleaned : undefined;
  }

  const trimmed = `${rawSort}`.trim();
  return trimmed ? trimmed : undefined;
}

const positiveInteger = optionalNumber({ min: 1, max: 100, precision: 0, integer: true }).transform(
  (value) => value ?? undefined,
);

const paginationQuerySchema = z
  .object({
    page: positiveInteger,
    pageSize: positiveInteger,
  })
  .strip();

export const globalSearchQuerySchema = z
  .object({
    q: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    limit: positiveInteger,
  })
  .strip();

export const searchCollectionQuerySchema = paginationQuerySchema.extend({
  q: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
});

export const searchOpportunitiesQuerySchema = paginationQuerySchema
  .extend({
    q: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    category: optionalTrimmedString({ max: 50 })
      .transform((value) => {
        if (!value) {
          return undefined;
        }
        const normalized = value.toLowerCase();
        return CATEGORY_ALIASES[normalized] ?? normalized;
      })
      .superRefine((value, ctx) => {
        if (!value) {
          return;
        }
        if (!canonicalOpportunityCategories.has(value)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'category must be a supported opportunity type.' });
        }
      }),
    includeFacets: optionalBoolean().transform((value) => (value == null ? true : value)),
    filters: z
      .any()
      .transform((value, ctx) => sanitiseFilters(coerceJsonObject(value, ctx, { fieldName: 'filters' })))
      .optional(),
    sort: z
      .any()
      .transform((value) => sanitiseSort(value))
      .optional(),
    viewport: z
      .any()
      .transform((value, ctx) => sanitiseViewport(value, ctx))
      .optional(),
  })
  .strip();

const subscriptionName = z.string().trim().min(1, { message: 'name is required.' }).max(120);

const subscriptionCategory = optionalTrimmedString({ max: 32 })
  .transform((value) => {
    if (!value) {
      return undefined;
    }
    const normalized = value.toLowerCase();
    return CATEGORY_ALIASES[normalized] ?? normalized;
  })
  .superRefine((value, ctx) => {
    if (!value) {
      return;
    }
    const allowed = new Set([...canonicalOpportunityCategories, 'people', 'mixed']);
    if (!allowed.has(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'category must be one of job, gig, project, launchpad, volunteering, people, or mixed.' });
    }
  });

const subscriptionFrequency = optionalTrimmedString({ max: 32 })
  .transform((value) => (value ? value.toLowerCase() : undefined))
  .transform((value, ctx) => {
    const resolved = value ?? 'daily';
    if (!digestFrequencySet.has(resolved)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `frequency must be one of ${DIGEST_FREQUENCIES.join(', ')}.`,
      });
      return z.NEVER;
    }
    return resolved;
  });

const sortSelectionSchema = z
  .any()
  .transform((value) => sanitiseSort(value))
  .optional();

const viewportSchema = z
  .any()
  .transform((value, ctx) => sanitiseViewport(value, ctx))
  .optional();

const filtersSchema = z
  .any()
  .transform((value, ctx) => sanitiseFilters(coerceJsonObject(value, ctx, { fieldName: 'filters' })))
  .optional();

const queryStringSchema = optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined);

export const listSubscriptionsQuerySchema = z
  .object({})
  .strip();

export const createSubscriptionBodySchema = z
  .object({
    name: subscriptionName,
    query: queryStringSchema,
    category: subscriptionCategory.transform((value) => value ?? 'job'),
    filters: filtersSchema,
    sort: sortSelectionSchema,
    frequency: subscriptionFrequency,
    notifyByEmail: optionalBoolean().transform((value) => (value == null ? true : value)),
    notifyInApp: optionalBoolean().transform((value) => (value == null ? true : value)),
    mapViewport: viewportSchema,
  })
  .strip();

export const updateSubscriptionBodySchema = z
  .object({
    name: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    query: queryStringSchema,
    category: subscriptionCategory,
    filters: filtersSchema,
    sort: sortSelectionSchema,
    frequency: optionalTrimmedString({ max: 32 })
      .transform((value) => (value ? value.toLowerCase() : undefined))
      .optional()
      .superRefine((value, ctx) => {
        if (!value) {
          return;
        }
        if (!digestFrequencySet.has(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `frequency must be one of ${DIGEST_FREQUENCIES.join(', ')}.`,
          });
        }
      }),
    notifyByEmail: optionalBoolean(),
    notifyInApp: optionalBoolean(),
    mapViewport: viewportSchema,
  })
  .strip();

function toPositiveInt(value, ctx, { fieldName }) {
  if (value == null || value === '') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} is required.` });
    return z.NEVER;
  }
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a positive integer.` });
    return z.NEVER;
  }
  return numeric;
}

export const subscriptionParamsSchema = z
  .object({
    id: z
      .any()
      .transform((value, ctx) => toPositiveInt(value, ctx, { fieldName: 'id' })),
  })
  .strip();

export const searchSubscriptionsQuerySchema = paginationQuerySchema.extend({});

export default {
  globalSearchQuerySchema,
  searchCollectionQuerySchema,
  searchOpportunitiesQuerySchema,
  createSubscriptionBodySchema,
  updateSubscriptionBodySchema,
  subscriptionParamsSchema,
};
