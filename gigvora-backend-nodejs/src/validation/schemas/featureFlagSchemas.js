import { z } from 'zod';
import { optionalBoolean, optionalNumber, optionalTrimmedString, requiredTrimmedString } from '../primitives.js';

const STATUS_VALUES = ['draft', 'active', 'disabled'];
const ROLLOUT_TYPES = ['global', 'percentage', 'cohort'];
const AUDIENCE_TYPES = ['user', 'workspace', 'membership', 'domain'];

const optionalDateTime = optionalTrimmedString({ max: 40 })
  .refine((value) => {
    if (value == null) {
      return true;
    }
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }, { message: 'must be a valid date-time string.' })
  .transform((value) => {
    if (value == null) {
      return undefined;
    }
    return new Date(value).toISOString();
  });

const assignmentSchema = z
  .object({
    audienceType: requiredTrimmedString({ max: 40 }).transform((value) => value.toLowerCase()),
    audienceValue: requiredTrimmedString({ max: 255 }),
    rolloutPercentage: optionalNumber({ min: 0, max: 100, precision: 2 }),
    conditions: z.unknown().optional(),
    expiresAt: optionalDateTime,
  })
  .refine((value) => AUDIENCE_TYPES.includes(value.audienceType), {
    message: `audienceType must be one of: ${AUDIENCE_TYPES.join(', ')}`,
    path: ['audienceType'],
  })
  .strip();

export const featureFlagParamsSchema = z
  .object({
    flagKey: requiredTrimmedString({ max: 120 }).transform((value) => value.toLowerCase()),
  })
  .strip();

export const featureFlagListQuerySchema = z
  .object({
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    search: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    limit: optionalNumber({ min: 1, max: 100, integer: true }),
    offset: optionalNumber({ min: 0, integer: true }),
  })
  .strip()
  .refine((value) => !value.status || STATUS_VALUES.includes(value.status), {
    message: `status must be one of: ${STATUS_VALUES.join(', ')}`,
    path: ['status'],
  });

export const featureFlagUpdateSchema = z
  .object({
    name: optionalTrimmedString({ max: 255 }),
    description: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    enabled: optionalBoolean(),
    rolloutType: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    rolloutPercentage: optionalNumber({ min: 0, max: 100, precision: 2 }),
    metadata: z.record(z.string(), z.unknown()).optional().or(z.null()),
    assignments: z.array(assignmentSchema).optional(),
  })
  .strip()
  .refine((value) => !value.status || STATUS_VALUES.includes(value.status), {
    message: `status must be one of: ${STATUS_VALUES.join(', ')}`,
    path: ['status'],
  })
  .refine((value) => !value.rolloutType || ROLLOUT_TYPES.includes(value.rolloutType), {
    message: `rolloutType must be one of: ${ROLLOUT_TYPES.join(', ')}`,
    path: ['rolloutType'],
  });

export default {
  featureFlagParamsSchema,
  featureFlagListQuerySchema,
  featureFlagUpdateSchema,
};
