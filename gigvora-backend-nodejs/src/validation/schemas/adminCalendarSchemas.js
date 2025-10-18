import { z } from 'zod';
import {
  optionalTrimmedString,
  requiredTrimmedString,
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
} from '../primitives.js';
import {
  ADMIN_CALENDAR_SYNC_STATUSES,
  ADMIN_CALENDAR_EVENT_STATUSES,
  ADMIN_CALENDAR_VISIBILITIES,
  ADMIN_CALENDAR_EVENT_TYPES,
} from '../../models/constants/index.js';

const optionalDateTime = z
  .union([z.date(), optionalTrimmedString({ max: 40 })])
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  });

const requiredDateTime = z
  .union([z.date(), requiredTrimmedString({ max: 40 })])
  .transform((value) => {
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid date');
    }
    return parsed.toISOString();
  });

const metadataSchema = z.record(z.any()).optional();

const syncStatusEnum = z.enum([...ADMIN_CALENDAR_SYNC_STATUSES]);
const eventStatusEnum = z.enum([...ADMIN_CALENDAR_EVENT_STATUSES]);
const visibilityEnum = z.enum([...ADMIN_CALENDAR_VISIBILITIES]);
const eventTypeEnum = z.enum([...ADMIN_CALENDAR_EVENT_TYPES]);

const rolesArraySchema = optionalStringArray({ maxItemLength: 80 }).transform((roles) =>
  Array.isArray(roles) ? roles.map((role) => role.toLowerCase()) : undefined,
);

const inviteeSchema = z
  .object({
    name: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    email: requiredTrimmedString({ max: 255 }).transform((value) => value.toLowerCase()),
  })
  .strip();

const attachmentSchema = z
  .object({
    label: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    url: requiredTrimmedString({ max: 2048 }),
  })
  .strip();

export const adminCalendarQuerySchema = z
  .object({
    startDate: optionalDateTime,
    endDate: optionalDateTime,
  })
  .strip();

const accountBaseSchema = z
  .object({
    provider: optionalTrimmedString({ max: 80 }),
    accountEmail: optionalTrimmedString({ max: 160 }).transform((value) => value?.toLowerCase()),
    displayName: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    syncStatus: syncStatusEnum.optional(),
    lastSyncedAt: optionalDateTime,
    syncError: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    timezone: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    metadata: metadataSchema,
  })
  .strip();

export const adminCalendarAccountCreateSchema = accountBaseSchema
  .extend({
    provider: requiredTrimmedString({ max: 80 }),
    accountEmail: requiredTrimmedString({ max: 160 }).transform((value) => value.toLowerCase()),
  })
  .strip();

export const adminCalendarAccountUpdateSchema = accountBaseSchema.strip();

const availabilityWindowSchema = z
  .object({
    dayOfWeek: optionalNumber({ min: 0, max: 6, integer: true }).transform((value) => value ?? undefined),
    startTimeMinutes: optionalNumber({ min: 0, max: 1440, integer: true }).transform((value) => value ?? undefined),
    endTimeMinutes: optionalNumber({ min: 0, max: 1440, integer: true }).transform((value) => value ?? undefined),
    timezone: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    isActive: optionalBoolean(),
    metadata: metadataSchema,
  })
  .strip();

export const adminCalendarAvailabilitySchema = z
  .object({
    timezone: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    windows: z.array(availabilityWindowSchema).optional(),
  })
  .strip();

const templateBaseSchema = z
  .object({
    name: optionalTrimmedString({ max: 120 }),
    description: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    durationMinutes: optionalNumber({ min: 0, max: 1440, integer: true }).transform((value) => value ?? undefined),
    defaultEventType: eventTypeEnum.optional(),
    defaultVisibility: visibilityEnum.optional(),
    defaultLocation: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    defaultMeetingUrl: optionalTrimmedString({ max: 2048 }).transform((value) => value ?? undefined),
    defaultAllowedRoles: rolesArraySchema,
    reminderMinutes: z
      .union([optionalNumber({ min: 0, max: 1440, integer: true }), z.array(optionalNumber({ min: 0, max: 1440, integer: true }))])
      .optional()
      .transform((value) => {
        if (value == null) {
          return undefined;
        }
        const values = Array.isArray(value) ? value : [value];
        return Array.from(new Set(values.filter((entry) => Number.isFinite(entry)))).sort((a, b) => a - b);
      }),
    instructions: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    bannerImageUrl: optionalTrimmedString({ max: 1024 }).transform((value) => value ?? undefined),
    isActive: optionalBoolean(),
    metadata: metadataSchema,
    createdBy: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    updatedBy: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
  })
  .strip();

export const adminCalendarTemplateCreateSchema = templateBaseSchema
  .extend({
    name: requiredTrimmedString({ max: 120 }),
  })
  .strip();

export const adminCalendarTemplateUpdateSchema = templateBaseSchema.strip();

const eventBaseSchema = z
  .object({
    title: optionalTrimmedString({ max: 255 }),
    description: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    eventType: eventTypeEnum.optional(),
    status: eventStatusEnum.optional(),
    visibility: visibilityEnum.optional(),
    meetingUrl: optionalTrimmedString({ max: 2048 }).transform((value) => value ?? undefined),
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    startsAt: optionalDateTime,
    endsAt: optionalDateTime,
    calendarAccountId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    templateId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    invitees: z.array(inviteeSchema).optional(),
    attachments: z.array(attachmentSchema).optional(),
    allowedRoles: rolesArraySchema,
    coverImageUrl: optionalTrimmedString({ max: 1024 }).transform((value) => value ?? undefined),
    metadata: metadataSchema,
    createdBy: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    updatedBy: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
  })
  .strip();

export const adminCalendarEventCreateSchema = eventBaseSchema
  .extend({
    title: requiredTrimmedString({ max: 255 }),
    startsAt: requiredDateTime,
  })
  .strip();

export const adminCalendarEventUpdateSchema = eventBaseSchema.strip();

const numericIdParam = z.preprocess((value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}, z.number().int().positive());

export const adminCalendarAccountParamsSchema = z.object({ accountId: numericIdParam }).strip();
export const adminCalendarTemplateParamsSchema = z.object({ templateId: numericIdParam }).strip();
export const adminCalendarEventParamsSchema = z.object({ eventId: numericIdParam }).strip();
