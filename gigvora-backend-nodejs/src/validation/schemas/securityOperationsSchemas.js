import { z } from 'zod';
import { optionalBoolean, optionalTrimmedString } from '../primitives.js';

export const securityTelemetryQuerySchema = z
  .object({
    includeResolvedAlerts: optionalBoolean().transform((value) => value ?? undefined),
    includeResolved: optionalBoolean().transform((value) => value ?? undefined),
  })
  .strip();

export const securityAlertActionBodySchema = z
  .object({
    note: optionalTrimmedString({ max: 500 }),
  })
  .strip();

export const threatSweepBodySchema = z
  .object({
    sweepType: optionalTrimmedString({ max: 160 }),
    reason: optionalTrimmedString({ max: 500 }),
    scope: optionalTrimmedString({ max: 160 }),
    metadata: z
      .preprocess((value) => {
        if (value == null) {
          return undefined;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
          return value;
        }
        return value;
      }, z.record(z.string(), z.any()).optional()),
  })
  .strip();

export default {
  securityTelemetryQuerySchema,
  securityAlertActionBodySchema,
  threatSweepBodySchema,
};
