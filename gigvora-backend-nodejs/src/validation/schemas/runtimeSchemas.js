import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

const SEVERITIES = ['info', 'maintenance', 'incident', 'security'];
const STATUSES = ['draft', 'scheduled', 'active', 'resolved'];

const optionalSeverity = z.preprocess((value) => {
  if (value == null || value === '') {
    return undefined;
  }
  return `${value}`.trim().toLowerCase();
}, z.enum(SEVERITIES).optional());

const optionalStatus = z.preprocess((value) => {
  if (value == null || value === '') {
    return undefined;
  }
  return `${value}`.trim().toLowerCase();
}, z.enum(STATUSES).optional());

const optionalDate = z.preprocess((value) => {
  if (value == null || value === '') {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = Date.parse(`${value}`);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed);
}, z.date().optional());

const optionalMetadata = z
  .preprocess((value) => {
    if (value == null) {
      return undefined;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
    return value;
  }, z.record(z.string(), z.any()).optional());

const optionalStatusList = optionalStringArray({ maxItemLength: 40 })
  .transform((values) => values?.map((value) => value.toLowerCase()))
  .refine(
    (values) => !values || values.every((value) => STATUSES.includes(value)),
    'status must be one of draft, scheduled, active, resolved.',
  );

export const runtimeMaintenanceQuerySchema = z
  .object({
    audience: optionalTrimmedString({ max: 120 }).transform((value) => value?.toLowerCase()),
    channel: optionalTrimmedString({ max: 120 }).transform((value) => value?.toLowerCase()),
    windowMinutes: optionalNumber({ min: 5, max: 24 * 60, precision: 0, integer: true }).transform((value) => value ?? undefined),
    includeResolved: optionalBoolean().transform((value) => value ?? undefined),
    limit: optionalNumber({ min: 1, max: 50, precision: 0, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const adminMaintenanceQuerySchema = z
  .object({
    status: optionalStatusList,
    audience: optionalTrimmedString({ max: 120 }).transform((value) => value?.toLowerCase()),
    channel: optionalTrimmedString({ max: 120 }).transform((value) => value?.toLowerCase()),
    includeResolved: optionalBoolean(),
    limit: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }).transform((value) => value ?? undefined),
    offset: optionalNumber({ min: 0, precision: 0, integer: true }).transform((value) => value ?? undefined),
    search: optionalTrimmedString({ max: 240 }).transform((value) => value ?? undefined),
  })
  .strip();

export const liveServiceTelemetryQuerySchema = z
  .object({
    windowMinutes: optionalNumber({ min: 5, max: 24 * 60, precision: 0, integer: true }).transform((value) => value ?? undefined),
    forceRefresh: optionalBoolean().transform((value) => value ?? undefined),
  })
  .strip();

export const createMaintenanceBodySchema = z
  .object({
    slug: optionalTrimmedString({ max: 140 }).transform((value) => value?.toLowerCase()),
    title: requiredTrimmedString({ max: 240 }),
    message: requiredTrimmedString({ max: 5000 }),
    severity: optionalSeverity,
    status: optionalStatus,
    audiences: optionalStringArray({ maxItemLength: 120 }),
    channels: optionalStringArray({ maxItemLength: 120 }),
    dismissible: optionalBoolean(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    metadata: optionalMetadata,
  })
  .strip();

export const updateMaintenanceBodySchema = z
  .object({
    slug: optionalTrimmedString({ max: 140 }).transform((value) => value?.toLowerCase()),
    title: optionalTrimmedString({ max: 240 }),
    message: optionalTrimmedString({ max: 5000 }),
    severity: optionalSeverity,
    status: optionalStatus,
    audiences: optionalStringArray({ maxItemLength: 120 }),
    channels: optionalStringArray({ maxItemLength: 120 }),
    dismissible: optionalBoolean(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    metadata: optionalMetadata,
  })
  .strip();

export const maintenanceStatusBodySchema = z
  .object({
    status: z
      .preprocess((value) => `${value}`.trim().toLowerCase(), z.enum(STATUSES))
      .refine((value) => STATUSES.includes(value), 'Invalid status.'),
  })
  .strip();

export const maintenanceIdentifierParamsSchema = z
  .object({
    announcementId: requiredTrimmedString({ max: 160 }),
  })
  .strip();

export default {
  runtimeMaintenanceQuerySchema,
  adminMaintenanceQuerySchema,
  createMaintenanceBodySchema,
  updateMaintenanceBodySchema,
  maintenanceStatusBodySchema,
  maintenanceIdentifierParamsSchema,
  liveServiceTelemetryQuerySchema,
};
