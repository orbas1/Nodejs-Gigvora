import { z } from 'zod';

const numericId = z.coerce.number().int().positive();

const VISIBILITY_OPTIONS = ['public', 'connections', 'private'];
const POST_STATUS_OPTIONS = ['draft', 'scheduled', 'published', 'archived'];
const ENTRY_TYPE_OPTIONS = ['milestone', 'content', 'event', 'campaign'];
const ENTRY_STATUS_OPTIONS = ['planned', 'in_progress', 'completed', 'blocked'];

const nullableString = (max = 255) =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value == null) {
        return null;
      }
      const text = `${value}`.trim();
      if (!text) {
        return null;
      }
      return text.slice(0, max);
    })
    .optional();

const requiredString = (min = 1, max = 255) =>
  z.preprocess(
    (value) => {
      if (value == null) {
        return value;
      }
      const text = `${value}`.trim();
      return text.length ? text.slice(0, max) : null;
    },
    z.string().min(min, { message: `Must be at least ${min} characters long.` }).max(max),
  );

const tagsSchema = z
  .union([
    z.array(z.string().min(1).max(120)),
    z
      .string()
      .transform((value) => value.split(/[\n,]+/).map((part) => part.trim()).filter(Boolean)),
  ])
  .optional();

const distributionSchema = z
  .union([
    z.array(z.string().min(1).max(120)),
    z
      .string()
      .transform((value) => value.split(/[\n,]+/).map((part) => part.trim()).filter(Boolean)),
  ])
  .optional();

const attachmentsSchema = z
  .array(
    z
      .object({
        label: nullableString(140),
        url: z
          .string()
          .or(z.number())
          .transform((value) => `${value}`.trim())
          .refine((value) => {
            try {
              if (!value) {
                return false;
              }
              const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
              return ['http:', 'https:'].includes(parsed.protocol);
            } catch (error) {
              return false;
            }
          }, 'url must be a valid HTTP(S) link'),
        type: nullableString(60),
        thumbnail: nullableString(2048),
      })
      .strict(),
  )
  .max(20)
  .optional();

const callToActionSchema = z
  .object({
    label: z
      .string()
      .min(1)
      .max(120)
      .transform((value) => value.trim()),
    url: z
      .string()
      .url(),
  })
  .partial()
  .transform((value) => {
    if (!value.label && !value.url) {
      return undefined;
    }
    if (value.label && !value.url) {
      throw new z.ZodError([
        {
          code: 'custom',
          message: 'callToAction.url is required when label is provided.',
          path: ['url'],
        },
      ]);
    }
    if (value.url && !value.label) {
      throw new z.ZodError([
        {
          code: 'custom',
          message: 'callToAction.label is required when url is provided.',
          path: ['label'],
        },
      ]);
    }
    return value;
  })
  .optional();

const audienceSchema = z
  .object({
    industries: tagsSchema,
    roles: tagsSchema,
    regions: tagsSchema,
    skills: tagsSchema,
    seniorities: tagsSchema,
  })
  .partial()
  .optional();

const dateTimeSchema = z
  .union([z.coerce.date(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return null;
    }
    return value;
  });

const dateOnlySchema = z
  .string()
  .transform((value) => `${value}`.trim())
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'capturedAt must be in YYYY-MM-DD format.',
  });

const booleanLike = z
  .union([z.boolean(), z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null) {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    const normalised = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalised)) {
      return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalised)) {
      return false;
    }
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid boolean value.' });
    return z.NEVER;
  })
  .optional();

export const userTimelineParamsSchema = z.object({
  id: numericId,
});

export const userTimelineEntryParamsSchema = userTimelineParamsSchema.extend({
  entryId: numericId,
});

export const userTimelinePostParamsSchema = userTimelineParamsSchema.extend({
  postId: numericId,
});

export const userTimelineSettingsSchema = z
  .object({
    timezone: nullableString(120),
    defaultVisibility: z.enum(VISIBILITY_OPTIONS).optional(),
    autoShareToFeed: booleanLike,
    reviewBeforePublish: booleanLike,
    distributionChannels: distributionSchema,
    contentThemes: distributionSchema,
    pinnedCampaigns: distributionSchema,
    cadenceGoal: z.coerce.number().int().positive().max(365).optional(),
  })
  .strict();

export const userTimelineEntryCreateSchema = z
  .object({
    title: requiredString(3, 180),
    description: nullableString(8000),
    entryType: z.enum(ENTRY_TYPE_OPTIONS).optional(),
    status: z.enum(ENTRY_STATUS_OPTIONS).optional(),
    startAt: dateTimeSchema.optional(),
    endAt: dateTimeSchema.optional(),
    linkedPostId: z.coerce.number().int().positive().optional(),
    owner: nullableString(180),
    channel: nullableString(180),
    location: nullableString(255),
    tags: tagsSchema,
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .strict();

export const userTimelineEntryUpdateSchema = userTimelineEntryCreateSchema.partial()
  .extend({
    linkedPostId: z.union([z.coerce.number().int().positive(), z.literal(null)]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one timeline entry field must be provided.',
  });

export const userTimelinePostCreateSchema = z
  .object({
    title: requiredString(3, 180),
    summary: nullableString(4000),
    content: nullableString(40_000),
    status: z.enum(POST_STATUS_OPTIONS).optional(),
    visibility: z.enum(VISIBILITY_OPTIONS).optional(),
    scheduledAt: dateTimeSchema.optional(),
    publishedAt: dateTimeSchema.optional(),
    timezone: nullableString(120),
    heroImageUrl: nullableString(2048),
    allowComments: booleanLike,
    tags: tagsSchema,
    attachments: attachmentsSchema,
    targetAudience: audienceSchema,
    campaign: nullableString(180),
    callToAction: callToActionSchema,
    metricsSnapshot: z.record(z.string(), z.any()).optional(),
  })
  .strict();

export const userTimelinePostUpdateSchema = userTimelinePostCreateSchema.partial()
  .extend({
    status: z.enum(POST_STATUS_OPTIONS).optional(),
    visibility: z.enum(VISIBILITY_OPTIONS).optional(),
    allowComments: booleanLike,
    title: requiredString(3, 180).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one timeline post field must be provided.',
  });

export const userTimelinePostPublishSchema = z
  .object({
    publishedAt: dateTimeSchema.optional(),
    scheduledAt: dateTimeSchema.optional(),
    visibility: z.enum(VISIBILITY_OPTIONS).optional(),
  })
  .strict();

export const userTimelinePostMetricsSchema = z
  .object({
    capturedAt: dateOnlySchema,
    impressions: z.coerce.number().int().min(0).optional(),
    views: z.coerce.number().int().min(0).optional(),
    clicks: z.coerce.number().int().min(0).optional(),
    comments: z.coerce.number().int().min(0).optional(),
    reactions: z.coerce.number().int().min(0).optional(),
    saves: z.coerce.number().int().min(0).optional(),
    shares: z.coerce.number().int().min(0).optional(),
    profileVisits: z.coerce.number().int().min(0).optional(),
    leads: z.coerce.number().int().min(0).optional(),
    conversionRate: z.coerce.number().min(0).max(100).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .strict();

export default {
  userTimelineParamsSchema,
  userTimelineEntryParamsSchema,
  userTimelinePostParamsSchema,
  userTimelineSettingsSchema,
  userTimelineEntryCreateSchema,
  userTimelineEntryUpdateSchema,
  userTimelinePostCreateSchema,
  userTimelinePostUpdateSchema,
  userTimelinePostPublishSchema,
  userTimelinePostMetricsSchema,
};
