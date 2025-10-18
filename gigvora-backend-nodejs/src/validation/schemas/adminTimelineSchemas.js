import { z } from 'zod';
import {
  ADMIN_TIMELINE_EVENT_STATUSES,
  ADMIN_TIMELINE_EVENT_TYPES,
  ADMIN_TIMELINE_STATUSES,
  ADMIN_TIMELINE_VISIBILITIES,
} from '../../models/adminTimelineModels.js';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

const statusSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.toLowerCase())
  .refine((value) => ADMIN_TIMELINE_STATUSES.includes(value), {
    message: `Status must be one of: ${ADMIN_TIMELINE_STATUSES.join(', ')}.`,
  });

const visibilitySchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.toLowerCase())
  .refine((value) => ADMIN_TIMELINE_VISIBILITIES.includes(value), {
    message: `Visibility must be one of: ${ADMIN_TIMELINE_VISIBILITIES.join(', ')}.`,
  });

const eventStatusSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.toLowerCase())
  .refine((value) => ADMIN_TIMELINE_EVENT_STATUSES.includes(value), {
    message: `Event status must be one of: ${ADMIN_TIMELINE_EVENT_STATUSES.join(', ')}.`,
  });

const eventTypeSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.toLowerCase())
  .refine((value) => ADMIN_TIMELINE_EVENT_TYPES.includes(value), {
    message: `Event type must be one of: ${ADMIN_TIMELINE_EVENT_TYPES.join(', ')}.`,
  });

const attachmentSchema = z
  .object({
    label: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    url: requiredTrimmedString({ max: 500 }),
    description: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
  })
  .strip();

export const timelineListQuerySchema = z
  .object({
    search: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    status: z.union([statusSchema, z.undefined()]),
    visibility: z.union([visibilitySchema, z.undefined()]),
    timelineType: optionalTrimmedString({ max: 80 }).transform((value) => value?.toLowerCase()),
    includeArchived: optionalBoolean(),
    page: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    pageSize: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

const timelineBaseSchema = z
  .object({
    name: requiredTrimmedString({ max: 200 }),
    slug: optionalTrimmedString({ max: 220 }).transform((value) => value?.toLowerCase()),
    summary: optionalTrimmedString({ max: 400 }).transform((value) => value ?? undefined),
    description: optionalTrimmedString({ max: 5000 }).transform((value) => value ?? undefined),
    timelineType: optionalTrimmedString({ max: 80 }).transform((value) => value?.toLowerCase()),
    status: z.union([statusSchema, z.undefined()]),
    visibility: z.union([visibilitySchema, z.undefined()]),
    startDate: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    endDate: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    heroImageUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    thumbnailUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    tags: optionalStringArray({ maxItemLength: 80, maxLength: 30 }),
    settings: z.record(z.any()).optional(),
    events: z
      .array(
        z
          .object({
            title: requiredTrimmedString({ max: 255 }),
            summary: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
            description: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
            eventType: z.union([eventTypeSchema, z.undefined()]),
            status: z.union([eventStatusSchema, z.undefined()]),
            startDate: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
            dueDate: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
            endDate: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
            ownerId: optionalNumber({ min: 0, integer: true }).transform((value) => value ?? undefined),
            ownerName: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
            ownerEmail: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
            location: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
            ctaLabel: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
            ctaUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
            tags: optionalStringArray({ maxItemLength: 80, maxLength: 20 }),
            attachments: z.array(attachmentSchema).optional(),
            metadata: z.record(z.any()).optional(),
            orderIndex: optionalNumber({ min: 0, integer: true }).transform((value) => value ?? undefined),
          })
          .strip(),
      )
      .optional(),
  })
  .strip();

export const createTimelineBodySchema = timelineBaseSchema;

export const updateTimelineBodySchema = timelineBaseSchema.partial({
  name: true,
});

export const timelineEventBodySchema = z
  .object({
    title: requiredTrimmedString({ max: 255 }),
    summary: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    description: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    eventType: z.union([eventTypeSchema, z.undefined()]),
    status: z.union([eventStatusSchema, z.undefined()]),
    startDate: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    dueDate: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    endDate: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    ownerId: optionalNumber({ min: 0, integer: true }).transform((value) => value ?? undefined),
    ownerName: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    ownerEmail: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    location: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    ctaLabel: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    ctaUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    tags: optionalStringArray({ maxItemLength: 80, maxLength: 20 }),
    attachments: z.array(attachmentSchema).optional(),
    metadata: z.record(z.any()).optional(),
    orderIndex: optionalNumber({ min: 0, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const timelineEventUpdateBodySchema = timelineEventBodySchema.partial({
  title: true,
});

export const timelineReorderBodySchema = z
  .object({
    order: z
      .array(z.union([z.coerce.number().int().nonnegative(), z.string().regex(/^\d+$/).transform((value) => Number.parseInt(value, 10))]))
      .min(1),
  })
  .strip();
