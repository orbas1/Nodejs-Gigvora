import { z } from 'zod';
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_VISIBILITIES,
  CALENDAR_DEFAULT_VIEWS,
  FOCUS_SESSION_TYPES,
} from '../../models/constants/index.js';
import { optionalBoolean, optionalNumber, optionalTrimmedString, requiredTrimmedString } from '../primitives.js';

const datetimeString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'must be a valid ISO-8601 datetime string.',
  });

const colorHexSchema = optionalTrimmedString({ max: 9 })
  .transform((value) => value ?? undefined)
  .superRefine((value, ctx) => {
    if (!value) {
      return;
    }
    const normalized = value.startsWith('#') ? value : `#${value}`;
    if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid hex colour code.' });
    }
  });

const reminderSchema = optionalNumber({ min: 0, max: 10080, integer: true }).transform((value) =>
  value == null ? undefined : Number(value),
);

const relatedEntitySchema = optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) =>
  value == null ? undefined : Number(value),
);

export const calendarEventBodySchema = z
  .object({
    title: requiredTrimmedString({ min: 2, max: 180 }),
    eventType: z.enum([...CALENDAR_EVENT_TYPES]).default('event'),
    startsAt: datetimeString,
    endsAt: datetimeString.optional(),
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    description: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    videoConferenceLink: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    isAllDay: optionalBoolean().transform((value) => value ?? false),
    reminderMinutes: reminderSchema,
    visibility: z.enum([...CALENDAR_EVENT_VISIBILITIES]).optional(),
    relatedEntityType: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    relatedEntityId: relatedEntitySchema,
    colorHex: colorHexSchema.transform((value) => (value == null ? undefined : value.startsWith('#') ? value : `#${value}`)),
    metadata: z.record(z.any()).optional(),
    focusMode: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    source: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
  })
  .strip();

export const calendarEventUpdateBodySchema = calendarEventBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field must be provided to update the event.' },
);

export const calendarEventsQuerySchema = z
  .object({
    from: datetimeString.optional(),
    to: datetimeString.optional(),
    limit: optionalNumber({ min: 1, max: 200, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const calendarEventParamsSchema = z
  .object({
    eventId: z
      .string()
      .trim()
      .regex(/^[0-9]+$/, 'eventId must be a positive integer.'),
  })
  .strip();

export const calendarOverviewQuerySchema = calendarEventsQuerySchema;

const focusDurationSchema = optionalNumber({ min: 0, max: 10080, integer: true }).transform((value) =>
  value == null ? undefined : Number(value),
);

export const focusSessionBodySchema = z
  .object({
    focusType: z.enum([...FOCUS_SESSION_TYPES]).default('deep_work'),
    startedAt: datetimeString,
    endedAt: datetimeString.optional(),
    durationMinutes: focusDurationSchema,
    completed: optionalBoolean().transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const focusSessionUpdateBodySchema = focusSessionBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided to update the focus session.',
  });

export const focusSessionParamsSchema = z
  .object({
    focusSessionId: z
      .string()
      .trim()
      .regex(/^[0-9]+$/, 'focusSessionId must be a positive integer.'),
  })
  .strip();

export const focusSessionsQuerySchema = z
  .object({
    limit: optionalNumber({ min: 1, max: 200, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const calendarSettingsBodySchema = z
  .object({
    timezone: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    weekStart: optionalNumber({ min: 0, max: 6, integer: true }).transform((value) => value ?? undefined),
    workStartMinutes: optionalNumber({ min: 0, max: 1439, integer: true }).transform((value) => value ?? undefined),
    workEndMinutes: optionalNumber({ min: 0, max: 1439, integer: true }).transform((value) => value ?? undefined),
    defaultView: z.enum([...CALENDAR_DEFAULT_VIEWS]).optional(),
    defaultReminderMinutes: optionalNumber({ min: 0, max: 10080, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    autoFocusBlocks: optionalBoolean().transform((value) => value ?? undefined),
    shareAvailability: optionalBoolean().transform((value) => value ?? undefined),
    colorHex: colorHexSchema.transform((value) => (value == null ? undefined : value.startsWith('#') ? value : `#${value}`)),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export default {
  calendarEventBodySchema,
  calendarEventUpdateBodySchema,
  calendarEventsQuerySchema,
  calendarEventParamsSchema,
  calendarOverviewQuerySchema,
  focusSessionBodySchema,
  focusSessionUpdateBodySchema,
  focusSessionParamsSchema,
  focusSessionsQuerySchema,
  calendarSettingsBodySchema,
};
