import { z } from 'zod';
import {
  optionalNumber,
  optionalTrimmedString,
  requiredTrimmedString,
  optionalBoolean,
} from '../primitives.js';

function pruneUndefined(object) {
  if (!object || typeof object !== 'object') {
    return undefined;
  }
  return Object.entries(object).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }
    if (Array.isArray(value)) {
      const filtered = value.filter((item) => item != null);
      if (filtered.length) {
        accumulator[key] = filtered;
      }
      return accumulator;
    }
    if (typeof value === 'object') {
      const nested = pruneUndefined(value);
      if (nested && Object.keys(nested).length) {
        accumulator[key] = nested;
      }
      return accumulator;
    }
    accumulator[key] = value;
    return accumulator;
  }, {});
}

function toDate(value, ctx, fieldName) {
  if (value == null || value === '') {
    return undefined;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a valid ISO-8601 datetime.` });
      return z.NEVER;
    }
    return value;
  }
  const candidate = new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a valid ISO-8601 datetime.` });
    return z.NEVER;
  }
  return candidate;
}

const eventTypeEnum = z.enum(['project', 'interview', 'gig', 'mentorship', 'volunteering']);

const participantSchema = z
  .object({
    name: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    email: optionalTrimmedString({ max: 180 }).transform((value) => (value ? value.toLowerCase() : undefined)),
    role: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
  })
  .strip()
  .transform((value) => pruneUndefined(value))
  .optional();

const attachmentSchema = z
  .object({
    label: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    url: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
  })
  .strip()
  .transform((value) => pruneUndefined(value));

const metadataSchema = z
  .object({
    relatedEntityId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    relatedEntityType: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    relatedEntityName: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    relatedUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    ownerId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    ownerName: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    ownerEmail: optionalTrimmedString({ max: 180 })
      .transform((value) => (value ? value.toLowerCase() : undefined))
      .refine((value) => (value ? /.+@.+/.test(value) : true), {
        message: 'ownerEmail must be a valid email address.',
      }),
    visibility: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    participants: z
      .array(participantSchema)
      .max(20)
      .optional()
      .transform((value) => (value ? value.filter(Boolean) : undefined)),
    attendees: z
      .array(participantSchema)
      .max(20)
      .optional()
      .transform((value) => (value ? value.filter(Boolean) : undefined)),
    attachments: z
      .array(attachmentSchema)
      .max(20)
      .optional()
      .transform((value) => (value ? value.filter(Boolean) : undefined)),
    color: optionalTrimmedString({ max: 20 }).transform((value) => value ?? undefined),
  })
  .strip()
  .optional()
  .transform((value) => pruneUndefined(value));

export const companyCalendarQuerySchema = z
  .object({
    workspaceId: z
      .any()
      .transform((value, ctx) => {
        if (value == null || value === '') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'workspaceId is required.' });
          return z.NEVER;
        }
        const numeric = Number(value);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'workspaceId must be a positive integer.' });
          return z.NEVER;
        }
        return numeric;
      }),
    workspaceSlug: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    from: z
      .any()
      .transform((value, ctx) => toDate(value, ctx, 'from')),
    to: z
      .any()
      .transform((value, ctx) => toDate(value, ctx, 'to')),
    types: z
      .any()
      .transform((value) => {
        if (value == null) {
          return [];
        }
        if (Array.isArray(value)) {
          return value;
        }
        if (typeof value === 'string' && value.includes(',')) {
          return value.split(',');
        }
        return [value];
      })
      .transform((value) => {
        const parsed = Array.isArray(value) ? value : [];
        const unique = Array.from(new Set(parsed.map((item) => `${item}`.trim()).filter(Boolean)));
        return unique;
      })
      .transform((value) =>
        value
          .map((item) => {
            const normalized = `${item}`
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_');
            return normalized;
          })
          .filter((item) => eventTypeEnum.safeParse(item).success),
      )
      .optional(),
    limit: optionalNumber({ min: 1, max: 500, integer: true }).transform((value) => value ?? undefined),
    search: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
  })
  .strip()
  .superRefine((value, ctx) => {
    if (value.workspaceId == null && !value.workspaceSlug) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'workspaceId is required.' });
    }
    if (value.workspaceId != null && value.workspaceSlug) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide only workspaceId or workspaceSlug, not both.' });
    }
  })
  .transform((value) => ({
    workspaceId: value.workspaceId ?? undefined,
    workspaceSlug: value.workspaceSlug ?? undefined,
    from: value.from ?? undefined,
    to: value.to ?? undefined,
    types: value.types ?? [],
    limit: value.limit ?? undefined,
    search: value.search ?? undefined,
  }));

export const createCompanyCalendarEventSchema = z
  .object({
    workspaceId: z
      .any()
      .transform((value, ctx) => {
        if (value == null || value === '') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'workspaceId is required.' });
          return z.NEVER;
        }
        const numeric = Number(value);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'workspaceId must be a positive integer.' });
          return z.NEVER;
        }
        return numeric;
      }),
    workspaceSlug: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    title: requiredTrimmedString({ min: 3, max: 180 }),
    eventType: eventTypeEnum,
    startsAt: z
      .any()
      .transform((value, ctx) => {
        const date = toDate(value, ctx, 'startsAt');
        if (!date) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startsAt is required.' });
          return z.NEVER;
        }
        return date;
      }),
    endsAt: z
      .any()
      .transform((value, ctx) => toDate(value, ctx, 'endsAt')),
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    metadata: metadataSchema,
  })
  .strip()
  .superRefine((value, ctx) => {
    if (value.workspaceId == null && !value.workspaceSlug) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'workspaceId is required.' });
    }
    if (value.workspaceId != null && value.workspaceSlug) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide only workspaceId or workspaceSlug, not both.' });
    }
    if (value.endsAt && value.startsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'endsAt must occur after startsAt.' });
    }
  })
  .transform((value) => ({
    workspaceId: value.workspaceId ?? undefined,
    workspaceSlug: value.workspaceSlug ?? undefined,
    title: value.title,
    eventType: value.eventType,
    startsAt: value.startsAt,
    endsAt: value.endsAt ?? undefined,
    location: value.location ?? undefined,
    metadata: value.metadata ?? undefined,
  }));

export const updateCompanyCalendarEventSchema = z
  .object({
    title: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    eventType: eventTypeEnum.optional(),
    startsAt: z.any().transform((value, ctx) => toDate(value, ctx, 'startsAt')).optional(),
    endsAt: z
      .union([
        z.any().transform((value, ctx) => toDate(value, ctx, 'endsAt')),
        z.null(),
      ])
      .optional(),
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    metadata: metadataSchema,
  })
  .strip()
  .superRefine((value, ctx) => {
    if (!Object.keys(pruneUndefined(value) ?? {}).length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide at least one field to update.' });
    }
    if (value.startsAt && value.endsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'endsAt must occur after startsAt.' });
    }
  })
  .transform((value) => ({
    title: value.title ?? undefined,
    eventType: value.eventType ?? undefined,
    startsAt: value.startsAt ?? undefined,
    endsAt: value.endsAt ?? undefined,
    location: value.location ?? undefined,
    metadata: value.metadata ?? undefined,
  }));

export const companyCalendarParamsSchema = z
  .object({
    eventId: z
      .any()
      .transform((value, ctx) => {
        const numeric = Number(value);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'eventId must be a positive integer.' });
          return z.NEVER;
        }
        return numeric;
      }),
  })
  .strip();

export const deleteCompanyCalendarQuerySchema = z
  .object({
    hardDelete: optionalBoolean().transform((value) => value ?? false),
  })
  .strip();

export default {
  companyCalendarQuerySchema,
  createCompanyCalendarEventSchema,
  updateCompanyCalendarEventSchema,
  companyCalendarParamsSchema,
  deleteCompanyCalendarQuerySchema,
};
