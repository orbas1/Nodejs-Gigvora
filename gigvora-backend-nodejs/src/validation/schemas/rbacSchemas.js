import { z } from 'zod';
import { optionalNumber, optionalTrimmedString, requiredTrimmedString } from '../primitives.js';

export const auditLogQuerySchema = z
  .object({
    policyKey: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    persona: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    resource: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    action: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    decision: optionalTrimmedString({ max: 16 }).transform((value) => value ?? undefined),
    search: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    from: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    to: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    limit: optionalNumber({ min: 1, max: 200, integer: true }).transform((value) => value ?? undefined),
    offset: optionalNumber({ min: 0, max: 1000, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const simulateAccessBodySchema = z
  .object({
    persona: optionalTrimmedString({ max: 80 }).transform((value) => value?.toLowerCase()),
    resource: requiredTrimmedString({ max: 120 }),
    action: requiredTrimmedString({ max: 80, toLowerCase: true }),
  })
  .strip();

export default {
  auditLogQuerySchema,
  simulateAccessBodySchema,
};
