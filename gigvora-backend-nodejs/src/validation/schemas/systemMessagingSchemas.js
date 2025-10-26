import { z } from 'zod';
import { optionalBoolean, optionalStringArray, optionalTrimmedString, requiredTrimmedString } from '../primitives.js';

const optionalDateTime = optionalTrimmedString({ max: 40 })
  .refine((value) => {
    if (value == null) {
      return true;
    }
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  }, { message: 'must be a valid ISO date string.' })
  .transform((value) => value ?? undefined);

const scoreSchema = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return value;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return value;
    }
    return numeric;
  }, z.number({ invalid_type_error: 'score must be a number.' }))
  .int('score must be an integer.')
  .min(1, 'score must be at least 1.')
  .max(5, 'score must be at most 5.');

export const statusToastQuerySchema = z
  .object({
    includeResolved: optionalBoolean(),
    includeExpired: optionalBoolean(),
    now: optionalDateTime,
  })
  .strip();

export const statusAcknowledgementParamsSchema = z
  .object({
    eventKey: requiredTrimmedString({ max: 120, toLowerCase: true }),
  })
  .strip();

export const statusAcknowledgementBodySchema = z
  .object({
    channel: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strip();

export const feedbackPulseParamsSchema = z
  .object({
    pulseKey: requiredTrimmedString({ max: 120, toLowerCase: true }),
  })
  .strip();

export const feedbackPulseQuerySchema = z
  .object({
    includeInactive: optionalBoolean(),
  })
  .strip();

export const feedbackPulseResponseBodySchema = z
  .object({
    score: scoreSchema,
    tags: optionalStringArray({ maxItemLength: 120, maxLength: 12 }).transform((value) => value ?? undefined),
    comment: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    channel: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strip();

export default {
  statusToastQuerySchema,
  statusAcknowledgementParamsSchema,
  statusAcknowledgementBodySchema,
  feedbackPulseParamsSchema,
  feedbackPulseQuerySchema,
  feedbackPulseResponseBodySchema,
};
