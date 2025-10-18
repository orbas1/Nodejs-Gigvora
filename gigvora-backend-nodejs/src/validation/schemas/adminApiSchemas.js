import { z } from 'zod';
import {
  optionalTrimmedString,
  requiredTrimmedString,
  optionalStringArray,
  optionalNumber,
} from '../primitives.js';

const providerStatusEnum = z.enum(['active', 'degraded', 'deprecated', 'planned']);
const clientStatusEnum = z.enum(['active', 'suspended', 'revoked']);
const accessLevelEnum = z.enum(['read', 'write', 'admin']);

const optionalEmail = z
  .union([
    z
      .string()
      .trim()
      .email({ message: 'must be a valid email address.' })
      .max(255, { message: 'email must be at most 255 characters long.' })
      .transform((value) => value.toLowerCase()),
    z.undefined(),
  ])
  .transform((value) => value ?? undefined);

const providerBaseSchema = z
  .object({
    name: requiredTrimmedString({ max: 160 }),
    slug: optionalTrimmedString({ max: 160 }),
    status: providerStatusEnum.optional(),
    baseUrl: optionalTrimmedString({ max: 512 }),
    sandboxBaseUrl: optionalTrimmedString({ max: 512 }),
    docsUrl: optionalTrimmedString({ max: 512 }),
    iconUrl: optionalTrimmedString({ max: 512 }),
    description: optionalTrimmedString({ max: 2000 }),
    contactEmail: optionalEmail,
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const createProviderBodySchema = providerBaseSchema;

export const updateProviderBodySchema = providerBaseSchema.partial().strip();

const clientBaseSchema = z
  .object({
    providerId: optionalTrimmedString({ max: 160 }),
    name: requiredTrimmedString({ max: 160 }),
    slug: optionalTrimmedString({ max: 160 }),
    description: optionalTrimmedString({ max: 4000 }),
    contactEmail: optionalEmail,
    status: clientStatusEnum.optional(),
    accessLevel: accessLevelEnum.optional(),
    rateLimitPerMinute: optionalNumber({ min: 0, precision: 0, integer: true }),
    ipAllowList: optionalStringArray({ maxItemLength: 255 }),
    scopes: optionalStringArray({ maxItemLength: 120 }),
    webhookUrl: optionalTrimmedString({ max: 512 }),
    metadata: z.record(z.any()).optional(),
    keyLabel: optionalTrimmedString({ max: 160 }),
  })
  .strip();

export const createClientBodySchema = clientBaseSchema.refine((payload) => Boolean(payload.providerId), {
  message: 'providerId is required.',
});

export const updateClientBodySchema = clientBaseSchema.partial().strip();

const expiresAtSchema = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  }, z.string().datetime({ offset: true, message: 'expiresAt must be a valid ISO date.' }))
  .optional();

export const createClientKeyBodySchema = z
  .object({
    label: optionalTrimmedString({ max: 160 }),
    expiresAt: expiresAtSchema,
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const auditEventsQuerySchema = z
  .object({
    limit: optionalNumber({ min: 1, max: 200, integer: true, precision: 0 })
      .transform((value) => (value == null ? undefined : value))
      .optional(),
  })
  .strip();

const optionalDateString = z
  .union([
    z
      .string()
      .trim()
      .min(1)
      .max(40)
      .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'must be a valid date.' }),
    z.undefined(),
  ])
  .transform((value) => value ?? undefined);

export const walletAccountsQuerySchema = z
  .object({
    query: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    limit: optionalNumber({ min: 1, max: 50, integer: true, precision: 0 })
      .transform((value) => (value == null ? undefined : value))
      .optional(),
  })
  .strip();

export const recordUsageBodySchema = z
  .object({
    requestCount: optionalNumber({ min: 0, integer: true, precision: 0 }),
    errorCount: optionalNumber({ min: 0, integer: true, precision: 0 }),
    metricDate: optionalDateString,
    avgLatencyMs: optionalNumber({ min: 0, integer: true, precision: 0 }),
    peakLatencyMs: optionalNumber({ min: 0, integer: true, precision: 0 }),
    lastRequestAt: optionalDateString,
    callPrice: optionalNumber({ min: 0, precision: 4 }),
    callPriceCents: optionalNumber({ min: 0, integer: true, precision: 0 }),
  })
  .strip();

export default {
  createProviderBodySchema,
  updateProviderBodySchema,
  createClientBodySchema,
  updateClientBodySchema,
  createClientKeyBodySchema,
  auditEventsQuerySchema,
  walletAccountsQuerySchema,
  recordUsageBodySchema,
};
