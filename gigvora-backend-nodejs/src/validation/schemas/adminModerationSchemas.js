import { z } from 'zod';
import {
  ModerationEventActions,
  ModerationEventSeverities,
  ModerationEventStatuses,
} from '../../models/moderationModels.js';
import { optionalNumber, optionalTrimmedString } from '../primitives.js';

const ACTION_VALUES = ModerationEventActions.map((value) => value.toLowerCase());
const SEVERITY_VALUES = ModerationEventSeverities.map((value) => value.toLowerCase());
const STATUS_VALUES = ModerationEventStatuses.map((value) => value.toLowerCase());

const optionalEnumArray = (allowed, field) =>
  z
    .union([
      z.array(optionalTrimmedString({ max: 60 })),
      optionalTrimmedString({ max: 180 }).transform((value) => (value ? value.split(',') : undefined)),
      z.undefined(),
    ])
    .transform((values, ctx) => {
      if (!values) {
        return undefined;
      }
      const list = Array.isArray(values) ? values : [values];
      const normalised = list
        .map((value) => `${value}`.trim().toLowerCase())
        .filter((value) => value.length > 0);
      const unique = Array.from(new Set(normalised));
      const invalid = unique.filter((value) => !allowed.includes(value));
      if (invalid.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field} contains unsupported values: ${invalid.join(', ')}`,
        });
        return z.NEVER;
      }
      return unique;
    });

const optionalChannelArray = z
  .union([
    z.array(optionalTrimmedString({ max: 120 })),
    optionalTrimmedString({ max: 240 }).transform((value) => (value ? value.split(',') : undefined)),
    z.undefined(),
  ])
  .transform((values) => {
    if (!values) {
      return undefined;
    }
    const list = Array.isArray(values) ? values : [values];
    const normalised = list
      .map((value) => `${value}`.trim().toLowerCase())
      .filter((value) => value.length > 0);
    return Array.from(new Set(normalised));
  });

const optionalIsoDate = optionalTrimmedString({ max: 40 }).transform((value, ctx) => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid ISO date-time.' });
    return z.NEVER;
  }
  return parsed.toISOString();
});

const positiveInteger = z
  .any()
  .transform((value, ctx) => {
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a positive integer.' });
      return z.NEVER;
    }
    return numeric;
  });

export const adminModerationQueueQuerySchema = z
  .object({
    page: optionalNumber({ min: 1, max: 1000, integer: true }).transform((value) => value ?? 1),
    pageSize: optionalNumber({ min: 1, max: 200, integer: true }).transform((value) => value ?? 25),
    severities: optionalEnumArray(SEVERITY_VALUES, 'severities'),
    channels: optionalChannelArray,
    status: optionalEnumArray(STATUS_VALUES, 'status'),
    actions: optionalEnumArray(ACTION_VALUES, 'actions'),
    search: optionalTrimmedString({ max: 200 }).transform((value) => value ?? undefined),
    channelSlug: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    createdFrom: optionalIsoDate,
    createdTo: optionalIsoDate,
  })
  .strip();

export const adminModerationEventsQuerySchema = z
  .object({
    page: optionalNumber({ min: 1, max: 1000, integer: true }).transform((value) => value ?? 1),
    pageSize: optionalNumber({ min: 1, max: 200, integer: true }).transform((value) => value ?? 50),
    status: optionalEnumArray(STATUS_VALUES, 'status'),
    actorId: z.union([positiveInteger, z.undefined()]).transform((value) => value ?? undefined),
    channelSlug: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    severities: optionalEnumArray(SEVERITY_VALUES, 'severities'),
    actions: optionalEnumArray(ACTION_VALUES, 'actions'),
    createdFrom: optionalIsoDate,
    createdTo: optionalIsoDate,
  })
  .strip();

export const adminModerationResolveSchema = z
  .object({
    status: optionalTrimmedString({ max: 40 }).transform((value, ctx) => {
      if (!value) {
        return undefined;
      }
      const normalised = value.trim().toLowerCase();
      if (!STATUS_VALUES.includes(normalised)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'status is not supported.' });
        return z.NEVER;
      }
      if (!['resolved', 'dismissed', 'acknowledged'].includes(normalised)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'status must resolve the moderation event.' });
        return z.NEVER;
      }
      return normalised;
    }),
    notes: optionalTrimmedString({ max: 1000 }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip()
  .refine((value) => Boolean(value.status || value.notes || value.metadata), {
    message: 'Provide a status update or resolution notes.',
  });

export default {
  adminModerationQueueQuerySchema,
  adminModerationEventsQuerySchema,
  adminModerationResolveSchema,
};
