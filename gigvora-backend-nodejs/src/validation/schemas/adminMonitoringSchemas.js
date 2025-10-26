import { z } from 'zod';

const timeframeSchema = z
  .string()
  .trim()
  .regex(/^\d+d$/i, 'timeframe must be expressed as a number of days, e.g. 7d or 30d.')
  .transform((value) => value.toLowerCase());

const optionalTimeframe = timeframeSchema.optional();

const optionalString = (max = 160) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max);

const optionalIdentifier = (max = 120) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .transform((value) => value.toLowerCase());

const optionalBoolean = z
  .union([
    z.boolean(),
    z
      .string()
      .trim()
      .transform((value) => {
        const lowered = value.toLowerCase();
        if (['true', '1', 'yes', 'y', 'on'].includes(lowered)) {
          return true;
        }
        if (['false', '0', 'no', 'n', 'off'].includes(lowered)) {
          return false;
        }
        return value;
      }),
    z.number().int(),
  ])
  .transform((value) => {
    if (value === true || value === false) {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      const lowered = value.toLowerCase();
      if (['true', '1', 'yes', 'y', 'on'].includes(lowered)) {
        return true;
      }
      if (['false', '0', 'no', 'n', 'off'].includes(lowered)) {
        return false;
      }
    }
    return undefined;
  })
  .optional();

export const insightsOverviewQuerySchema = z
  .object({
    timeframe: optionalTimeframe,
  })
  .strict();

export const metricsExplorerQuerySchema = z
  .object({
    timeframe: optionalTimeframe,
    metric: optionalString(120).optional(),
    persona: optionalIdentifier(80).optional(),
    channel: optionalIdentifier(80).optional(),
    compareTo: optionalIdentifier(80).optional(),
    includeBenchmarks: optionalBoolean,
    search: z.string().trim().max(200).optional(),
  })
  .strict();

export const metricsExplorerViewBodySchema = z
  .object({
    name: optionalString(160),
    timeframe: optionalTimeframe.optional(),
    query: z
      .object({
        timeframe: optionalTimeframe.optional(),
        metric: optionalString(120).optional(),
        persona: optionalIdentifier(80).nullish(),
        channel: optionalIdentifier(80).nullish(),
        compareTo: optionalIdentifier(80).nullish(),
        includeBenchmarks: optionalBoolean,
        search: z.string().trim().max(200).optional(),
      })
      .partial()
      .optional(),
  })
  .strict();

export const metricsExplorerViewParamsSchema = z
  .object({
    viewId: z.string().uuid('viewId must be a valid UUID.'),
  })
  .strict();

const numericString = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform((value) => Number.parseInt(value, 10));

export const auditTrailQuerySchema = z
  .object({
    timeframe: optionalTimeframe,
    severity: optionalIdentifier(32).optional(),
    actorType: optionalIdentifier(80).optional(),
    resourceType: optionalIdentifier(80).optional(),
    search: z.string().trim().max(200).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: numericString.optional(),
    pageSize: numericString.optional(),
  })
  .strict();

export const auditTrailExportQuerySchema = auditTrailQuerySchema;

export default {
  insightsOverviewQuerySchema,
  metricsExplorerQuerySchema,
  metricsExplorerViewBodySchema,
  metricsExplorerViewParamsSchema,
  auditTrailQuerySchema,
  auditTrailExportQuerySchema,
};
