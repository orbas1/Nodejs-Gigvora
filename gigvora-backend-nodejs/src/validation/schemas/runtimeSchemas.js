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
const MAINTENANCE_CHANNEL_OPTIONS = ['status-page', 'email', 'sms', 'in-app', 'push', 'slack'];

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

const requiredDate = z.preprocess((value) => {
  if (value instanceof Date) {
    return value;
  }
  if (value == null || value === '') {
    return value;
  }
  const parsed = Date.parse(`${value}`);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed);
}, z.date());

const maintenanceChannelsSchema = z
  .preprocess((value) => {
    if (value == null) {
      return [];
    }
    const values = Array.isArray(value) ? value : [value];
    return values
      .map((entry) => `${entry}`.trim().toLowerCase())
      .filter((entry) => entry.length > 0 && entry.length <= 160);
  },
  z
    .array(z.string().min(1))
    .refine((values) => values.length > 0, 'At least one channel must be provided.')
    .refine(
      (values) => values.every((value) => MAINTENANCE_CHANNEL_OPTIONS.includes(value)),
      `Channels must be one of ${MAINTENANCE_CHANNEL_OPTIONS.join(', ')}.`,
    )
    .transform((values) => Array.from(new Set(values))),
);

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

export const maintenanceWindowParamsSchema = z
  .object({
    windowId: requiredTrimmedString({ max: 160 }),
  })
  .strip();

const maintenanceWindowBaseSchema = z.object({
  title: requiredTrimmedString({ max: 240 }),
  owner: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
  impact: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
  startAt: requiredDate,
  endAt: optionalDate,
  channels: maintenanceChannelsSchema.optional(),
  notificationLeadMinutes: optionalNumber({ min: 0, max: 7 * 24 * 60, integer: true, precision: 0 }).transform(
    (value) => value ?? undefined,
  ),
  rollbackPlan: optionalTrimmedString({ max: 5000 }).transform((value) => value ?? undefined),
});

export const maintenanceWindowBodySchema = maintenanceWindowBaseSchema
  .superRefine((data, ctx) => {
    if (data.endAt && data.startAt && data.endAt.getTime() <= data.startAt.getTime()) {
      ctx.addIssue({
        path: ['endAt'],
        code: z.ZodIssueCode.custom,
        message: 'endAt must be after startAt.',
      });
    }
  })
  .strip();

export const maintenanceWindowUpdateSchema = maintenanceWindowBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.endAt && data.startAt && data.endAt.getTime() <= data.startAt.getTime()) {
      ctx.addIssue({
        path: ['endAt'],
        code: z.ZodIssueCode.custom,
        message: 'endAt must be after startAt.',
      });
    }
  })
  .strip();

export const maintenanceNotificationBodySchema = z
  .object({
    channels: maintenanceChannelsSchema,
    audience: requiredTrimmedString({ max: 160 }),
    subject: requiredTrimmedString({ max: 280 }),
    body: requiredTrimmedString({ max: 5000 }),
    includeTimeline: optionalBoolean().transform((value) => value ?? undefined),
    includeStatusPage: optionalBoolean().transform((value) => value ?? undefined),
  })
  .strip();

const heroStatSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    label: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    value: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    helper: optionalTrimmedString({ max: 240 }).transform((value) => value ?? undefined),
  })
  .strip();

const heroMetricSchema = z
  .object({
    label: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    value: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    helper: optionalTrimmedString({ max: 240 }).transform((value) => value ?? undefined),
  })
  .strip()
  .partial();

const heroActionSchema = z
  .object({
    label: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    href: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    to: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
  })
  .strip()
  .partial();

const heroPillarSchema = z
  .object({
    id: optionalTrimmedString({ max: 150 }).transform((value) => value ?? undefined),
    title: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    description: optionalTrimmedString({ max: 360 }).transform((value) => value ?? undefined),
    highlights: optionalStringArray({ maxItemLength: 220, maxLength: 6 }).transform((value) => value ?? undefined),
    icon: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    metric: heroMetricSchema.optional(),
    action: heroActionSchema.optional(),
  })
  .strip();

const operationsSummarySchema = z
  .object({
    hero: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    highlights: optionalStringArray({ maxItemLength: 220, maxLength: 6 }).transform((value) => value ?? undefined),
    metrics: optionalStringArray({ maxItemLength: 220, maxLength: 10 }).transform((value) => value ?? undefined),
  })
  .strip()
  .partial();

const runtimeSiteSettingsSchema = z
  .object({
    announcement: z
      .object({
        enabled: optionalBoolean().transform((value) => value ?? undefined),
        message: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
        linkLabel: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
        linkUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
      })
      .strip()
      .partial()
      .optional(),
    heroPersonaChips: optionalStringArray({ maxItemLength: 160, maxLength: 10 }).transform((value) => value ?? undefined),
    heroInsightStats: z.array(heroStatSchema).max(8).optional(),
    heroValuePillars: z.array(heroPillarSchema).max(6).optional(),
    operationsSummary: operationsSummarySchema.optional(),
  })
  .strip()
  .partial();

const runtimeSystemSettingsSchema = z
  .object({
    general: z
      .object({
        incidentContact: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
        supportEmail: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
        supportPhone: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
      })
      .strip()
      .partial()
      .optional(),
    notifications: z
      .object({
        emailProvider: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
        smsProvider: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
        emailFromName: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
        emailFromAddress: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
        incidentWebhookUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
        broadcastChannels: optionalStringArray({ maxItemLength: 60, maxLength: 8 }).transform((value) => value ?? undefined),
      })
      .strip()
      .partial()
      .optional(),
    maintenance: z
      .object({
        supportChannel: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
        statusPageUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
        upcomingWindows: z
          .array(
            z
              .object({
                id: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
                summary: optionalTrimmedString({ max: 240 }).transform((value) => value ?? undefined),
                impact: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
                startAt: optionalDate,
                endAt: optionalDate,
                timezone: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
                contact: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
              })
              .strip()
              .partial(),
          )
          .max(12)
          .optional(),
      })
      .strip()
      .partial()
      .optional(),
  })
  .strip()
  .partial();

export const runtimeOperationsSettingsSchema = z
  .object({
    system: runtimeSystemSettingsSchema.optional(),
    site: runtimeSiteSettingsSchema.optional(),
  })
  .strip()
  .refine((value) => value.system || value.site, {
    message: 'system or site settings must be provided.',
  });

const recipientsSchema = z
  .preprocess((value) => {
    if (value == null) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }, z.array(z.union([z.number(), z.string()])))
  .transform((values) =>
    Array.from(
      new Set(
        values
          .map((entry) => {
            const parsed = Number.parseInt(`${entry}`, 10);
            return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
          })
          .filter((entry) => entry != null),
      ),
    ),
  )
  .refine((values) => values.length > 0, { message: 'At least one valid recipient is required.' });

export const notificationCampaignSchema = z
  .object({
    recipients: recipientsSchema,
    title: requiredTrimmedString({ max: 180 }),
    type: requiredTrimmedString({ max: 120 }),
    body: optionalTrimmedString({ max: 5000 }).transform((value) => value ?? undefined),
    category: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    priority: optionalTrimmedString({ max: 30 }).transform((value) => value ?? undefined),
    campaignId: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    bypassQuietHours: optionalBoolean().transform((value) => value ?? undefined),
    metadata: z
      .preprocess((value) => {
        if (value == null) {
          return undefined;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
          return value;
        }
        return value;
      }, z.record(z.string(), z.any()).optional())
      .transform((value) => value ?? undefined),
    payload: z
      .preprocess((value) => {
        if (value == null) {
          return undefined;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
          return value;
        }
        return value;
      }, z.record(z.string(), z.any()).optional())
      .transform((value) => value ?? undefined),
    expiresAt: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
  })
  .strip();

export default {
  runtimeMaintenanceQuerySchema,
  adminMaintenanceQuerySchema,
  createMaintenanceBodySchema,
  updateMaintenanceBodySchema,
  maintenanceStatusBodySchema,
  maintenanceIdentifierParamsSchema,
  maintenanceWindowParamsSchema,
  maintenanceWindowBodySchema,
  maintenanceWindowUpdateSchema,
  maintenanceNotificationBodySchema,
  liveServiceTelemetryQuerySchema,
  runtimeOperationsSettingsSchema,
  notificationCampaignSchema,
};
