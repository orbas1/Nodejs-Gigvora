import { z } from 'zod';
import {
  optionalNumber,
  optionalTrimmedString,
  optionalStringArray,
  requiredTrimmedString,
} from '../primitives.js';
import {
  AGENCY_TIMELINE_POST_STATUSES,
  AGENCY_TIMELINE_VISIBILITIES,
  AGENCY_TIMELINE_DISTRIBUTION_CHANNELS,
} from '../../models/index.js';

const statusEnum = z.enum([...AGENCY_TIMELINE_POST_STATUSES]);
const visibilityEnum = z.enum([...AGENCY_TIMELINE_VISIBILITIES]);
const channelEnum = z.enum([...AGENCY_TIMELINE_DISTRIBUTION_CHANNELS]);

const optionalStatus = z.preprocess((value) => {
  if (value == null || value === '') {
    return undefined;
  }
  return `${value}`.trim().toLowerCase();
}, statusEnum.optional());

const optionalVisibility = z.preprocess((value) => {
  if (value == null || value === '') {
    return undefined;
  }
  return `${value}`.trim().toLowerCase();
}, visibilityEnum.optional());

const optionalDate = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid date value.');
    }
    return parsed;
  }, z.date())
  .optional();

const attachmentSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    label: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    type: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    url: z
      .string({ required_error: 'Attachment URL is required.' })
      .trim()
      .min(1, 'Attachment URL is required.')
      .max(2048, 'Attachment URL must be at most 2048 characters long.')
      .url('Attachment URL must be a valid URL.'),
  })
  .strip();

export const timelineDashboardQuerySchema = z
  .object({
    workspaceId: optionalNumber({ integer: true, min: 1 }).transform((value) => value ?? undefined),
    workspaceSlug: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    lookbackDays: optionalNumber({ integer: true, min: 1, max: 365 }).transform((value) => value ?? undefined),
  })
  .strip();

export const timelinePostsQuerySchema = z
  .object({
    workspaceId: optionalNumber({ integer: true, min: 1 }).transform((value) => value ?? undefined),
    workspaceSlug: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    status: optionalStatus,
    search: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    limit: optionalNumber({ integer: true, min: 1, max: 200 }).transform((value) => value ?? undefined),
    offset: optionalNumber({ integer: true, min: 0 }).transform((value) => value ?? undefined),
    lookbackDays: optionalNumber({ integer: true, min: 1, max: 365 }).transform((value) => value ?? undefined),
  })
  .strip();

export const timelinePostIdParamsSchema = z
  .object({
    postId: z
      .preprocess((value) => Number(value), z.number({ required_error: 'postId is required.' }).int().positive())
      .transform((value) => value),
  })
  .strip();

export const createTimelinePostBodySchema = z
  .object({
    workspaceId: optionalNumber({ integer: true, min: 1 }).transform((value) => value ?? undefined),
    workspaceSlug: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    title: requiredTrimmedString({ max: 180 }),
    excerpt: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    content: z.string().optional(),
    visibility: optionalVisibility,
    status: optionalStatus,
    scheduledAt: optionalDate,
    publishedAt: optionalDate,
    ownerId: optionalNumber({ integer: true, min: 1 }).transform((value) => value ?? undefined),
    tags: optionalStringArray({ maxLength: 16, maxItemLength: 60 }).transform((value) => value ?? undefined),
    distributionChannels: z.array(channelEnum).max(AGENCY_TIMELINE_DISTRIBUTION_CHANNELS.length).optional(),
    audienceRoles: optionalStringArray({ maxLength: 10, maxItemLength: 60 }).transform((value) => value ?? undefined),
    attachments: z.array(attachmentSchema).max(25).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const updateTimelinePostBodySchema = createTimelinePostBodySchema
  .extend({
    title: requiredTrimmedString({ max: 180 }).optional(),
    status: optionalStatus,
    visibility: optionalVisibility,
  })
  .strip();

export const updateTimelinePostStatusBodySchema = z
  .object({
    status: statusEnum,
    scheduledAt: optionalDate,
    publishedAt: optionalDate,
  })
  .strip();

export const timelinePostAnalyticsQuerySchema = z
  .object({
    lookbackDays: optionalNumber({ integer: true, min: 1, max: 365 }).transform((value) => value ?? undefined),
  })
  .strip();

export default {
  timelineDashboardQuerySchema,
  timelinePostsQuerySchema,
  timelinePostIdParamsSchema,
  createTimelinePostBodySchema,
  updateTimelinePostBodySchema,
  updateTimelinePostStatusBodySchema,
  timelinePostAnalyticsQuerySchema,
};
