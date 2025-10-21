import { z } from 'zod';
import {
  optionalBoolean,
  optionalGeoLocation,
  optionalLocationString,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';
import { AGENCY_PROFILE_MEDIA_ALLOWED_TYPES, AGENCY_PROFILE_CREDENTIAL_TYPES } from '../../models/index.js';

const FOLLOWER_POLICIES = ['open', 'approval_required', 'closed'];
const FOLLOWER_STATUSES = ['active', 'muted', 'blocked'];
const CONNECTION_POLICIES = ['open', 'invite_only', 'manual_review'];
const MEDIA_TYPES = AGENCY_PROFILE_MEDIA_ALLOWED_TYPES.map((value) => value.toLowerCase());
const CREDENTIAL_TYPES = AGENCY_PROFILE_CREDENTIAL_TYPES.map((value) => value.toLowerCase());

const optionalEmail = z
  .union([
    z
      .string()
      .trim()
      .max(255)
      .email({ message: 'must be a valid email address.' })
      .transform((value) => value.toLowerCase()),
    z.literal('').transform(() => undefined),
    z.undefined(),
  ])
  .transform((value) => value ?? undefined);

const optionalUrl = ({ max = 2048, nullable = false } = {}) => {
  const base = z
    .preprocess((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      const text = `${value}`.trim();
      return text || undefined;
    }, z.string().url({ message: 'must be a valid URL.' }).max(max));

  const schema = z.union([base, z.undefined()]);
  if (nullable) {
    return z.union([schema, z.null()]).transform((value) => {
      if (value === null) {
        return null;
      }
      return value ?? undefined;
    });
  }
  return schema.transform((value) => value ?? undefined);
};

const optionalNullableString = ({ max }) =>
  z
    .union([z.null(), optionalTrimmedString({ max })])
    .transform((value) => (value === null ? null : value ?? undefined));

const socialLinkSchema = z
  .object({
    label: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    url: optionalUrl({ max: 500 }),
  })
  .strip()
  .refine((value) => Boolean(value.label || value.url), {
    message: 'Provide a label or URL for the social link.',
  });

const followerPolicySchema = z.enum(FOLLOWER_POLICIES);
const followerStatusSchema = z.enum(FOLLOWER_STATUSES);
const connectionPolicySchema = z.enum(CONNECTION_POLICIES);

const baseProfileSchema = z
  .object({
    agencyName: optionalTrimmedString({ max: 255 }),
    focusArea: optionalTrimmedString({ max: 255 }),
    tagline: optionalTrimmedString({ max: 160 }),
    summary: optionalTrimmedString({ max: 4000 }),
    about: optionalTrimmedString({ max: 8000 }),
    website: optionalUrl({ max: 2048 }),
    headline: optionalTrimmedString({ max: 255 }),
    bio: optionalTrimmedString({ max: 5000 }),
    missionStatement: optionalTrimmedString({ max: 2000 }),
    timezone: optionalTrimmedString({ max: 120 }),
    location: optionalLocationString({ max: 255 }),
    geoLocation: optionalGeoLocation(),
    services: optionalStringArray({ maxLength: 25, maxItemLength: 160 }),
    industries: optionalStringArray({ maxLength: 25, maxItemLength: 160 }),
    clients: optionalStringArray({ maxLength: 40, maxItemLength: 160 }),
    awards: optionalStringArray({ maxLength: 40, maxItemLength: 200 }),
    socialLinks: z.array(socialLinkSchema).max(15).optional(),
    teamSize: optionalNumber({ min: 1, max: 5000, integer: true }),
    foundedYear: optionalNumber({ min: 1900, max: 2100, integer: true }),
    primaryContactName: optionalTrimmedString({ max: 160 }),
    primaryContactEmail: optionalEmail,
    primaryContactPhone: optionalTrimmedString({ max: 60 }),
    brandColor: optionalTrimmedString({ max: 12 }),
    bannerUrl: optionalUrl({ max: 2048 }),
    avatarUrl: optionalUrl({ max: 2048 }),
    autoAcceptFollowers: optionalBoolean(),
    defaultConnectionMessage: optionalTrimmedString({ max: 2000 }),
    followerPolicy: followerPolicySchema.optional(),
    connectionPolicy: connectionPolicySchema.optional(),
  })
  .strip();

export const updateAgencyProfileSchema = baseProfileSchema;

const base64Schema = z
  .string()
  .trim()
  .max(10_000_000, { message: 'imageData is too large.' });

export const updateAgencyAvatarSchema = z
  .object({
    imageData: z.union([base64Schema, z.undefined()]),
    avatarUrl: optionalUrl({ max: 2048 }),
    avatarSeed: optionalTrimmedString({ max: 255 }),
    bannerUrl: optionalUrl({ max: 2048 }),
    brandColor: optionalTrimmedString({ max: 12 }),
  })
  .strip()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'Provide at least one field to update.',
  });

export const agencyProfileQuerySchema = z
  .object({
    includeFollowers: optionalBoolean(),
    includeConnections: optionalBoolean(),
    followersLimit: optionalNumber({ min: 1, max: 100, integer: true }),
    followersOffset: optionalNumber({ min: 0, integer: true }),
    userId: optionalNumber({ min: 1, integer: true }),
    fresh: optionalBoolean(),
  })
  .strip();

export const listFollowersQuerySchema = z
  .object({
    limit: optionalNumber({ min: 1, max: 100, integer: true }),
    offset: optionalNumber({ min: 0, integer: true }),
    userId: optionalNumber({ min: 1, integer: true }),
  })
  .strip();

const positiveId = (field) =>
  z
    .union([z.number(), z.string()])
    .transform((value, ctx) => {
      const numeric = Number(value);
      if (!Number.isInteger(numeric) || numeric <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${field} must be a positive integer.` });
        return z.NEVER;
      }
      return numeric;
    });

export const followerParamsSchema = z.object({ followerId: positiveId('followerId') }).strip();

export const updateFollowerBodySchema = z
  .object({
    status: followerStatusSchema.optional(),
    notificationsEnabled: optionalBoolean(),
  })
  .strip();

export const connectionParamsSchema = z.object({ connectionId: positiveId('connectionId') }).strip();

export const requestConnectionBodySchema = z.object({ targetId: positiveId('targetId') }).strip();

export const respondConnectionBodySchema = z
  .object({
    decision: requiredTrimmedString({ max: 32, toLowerCase: true }).refine((value) => ['accept', 'reject'].includes(value), {
      message: 'decision must be accept or reject.',
    }),
    note: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
  })
  .strip();

const optionalLongText = ({ max = 4000 } = {}) =>
  optionalTrimmedString({ max }).transform((value) => value ?? undefined).nullable();

const optionalDateString = () =>
  z
    .union([
      z
        .preprocess((value) => {
          if (value == null || value === '') {
            return undefined;
          }
          if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return value.toISOString().slice(0, 10);
          }
          const text = `${value}`.trim();
          return text || undefined;
        }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      z.undefined(),
    ])
    .nullable();

const optionalTagArray = () =>
  z
    .union([
      z.preprocess((value) => {
        if (value == null) {
          return undefined;
        }
        if (Array.isArray(value)) {
          return value;
        }
        return [value];
      }, z.array(z.string())),
      z.undefined(),
    ])
    .transform((value) => {
      if (!value) {
        return undefined;
      }
      const cleaned = value
        .map((entry) => `${entry}`.trim())
        .filter((entry) => entry.length > 0)
        .slice(0, 25);
      return cleaned.length ? cleaned : [];
    })
    .nullable();

const mediaTypeSchema = z
  .union([
    optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    z.undefined(),
  ])
  .refine((value) => value == null || MEDIA_TYPES.includes(value), {
    message: `type must be one of: ${MEDIA_TYPES.join(', ')}`,
  });

export const updateAgencyProfileBasicsSchema = z
  .object({
    tagline: optionalTrimmedString({ max: 160 }).nullable(),
    description: optionalLongText({ max: 5000 }),
    introVideoUrl: optionalUrl({ max: 500, nullable: true }),
    bannerImageUrl: optionalUrl({ max: 500, nullable: true }),
    profileImageUrl: optionalUrl({ max: 500, nullable: true }),
    workforceAvailable: optionalNumber({ min: 0, max: 100000, integer: true }).nullable(),
    workforceNotes: optionalTrimmedString({ max: 255 }).nullable(),
  })
  .strip();

export const createAgencyProfileMediaSchema = z
  .object({
    type: mediaTypeSchema,
    title: optionalTrimmedString({ max: 160 }).nullable(),
    url: optionalUrl({ max: 2048 }),
    altText: optionalTrimmedString({ max: 255 }).nullable(),
    description: optionalLongText({ max: 4000 }),
    position: optionalNumber({ min: 0, integer: true }).nullable(),
    metadata: z.unknown().optional(),
  })
  .transform((value) => ({
    ...value,
    type: value.type ?? 'image',
  }))
  .strip();

export const updateAgencyProfileMediaSchema = z
  .object({
    type: mediaTypeSchema.nullable(),
    title: optionalTrimmedString({ max: 160 }).nullable(),
    url: optionalUrl({ max: 2048, nullable: true }),
    altText: optionalTrimmedString({ max: 255 }).nullable(),
    description: optionalLongText({ max: 4000 }),
    position: optionalNumber({ min: 0, integer: true }).nullable(),
    metadata: z.unknown().optional(),
  })
  .strip();

export const createAgencyProfileSkillSchema = z
  .object({
    name: requiredTrimmedString({ max: 120 }),
    category: optionalTrimmedString({ max: 120 }).nullable(),
    proficiency: optionalNumber({ min: 0, max: 100, integer: true }).nullable(),
    experienceYears: optionalNumber({ min: 0, max: 200, precision: 2 }).nullable(),
    isFeatured: optionalBoolean(),
    position: optionalNumber({ min: 0, integer: true }).nullable(),
  })
  .strip();

export const updateAgencyProfileSkillSchema = z
  .object({
    name: optionalTrimmedString({ max: 120 }).nullable(),
    category: optionalTrimmedString({ max: 120 }).nullable(),
    proficiency: optionalNumber({ min: 0, max: 100, integer: true }).nullable(),
    experienceYears: optionalNumber({ min: 0, max: 200, precision: 2 }).nullable(),
    isFeatured: optionalBoolean(),
    position: optionalNumber({ min: 0, integer: true }).nullable(),
  })
  .strip();

const credentialTypeSchema = z
  .union([
    optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    z.undefined(),
  ])
  .refine((value) => value == null || CREDENTIAL_TYPES.includes(value), {
    message: `type must be one of: ${CREDENTIAL_TYPES.join(', ')}`,
  });

const credentialSharedSchema = z
  .object({
    type: credentialTypeSchema,
    issuer: optionalTrimmedString({ max: 180 }).nullable(),
    issuedAt: optionalDateString(),
    expiresAt: optionalDateString(),
    credentialUrl: optionalUrl({ max: 500, nullable: true }),
    description: optionalLongText({ max: 4000 }),
    referenceId: optionalTrimmedString({ max: 120 }).nullable(),
    verificationStatus: optionalTrimmedString({ max: 60 }).nullable(),
  })
  .strip();

export const createAgencyProfileCredentialSchema = credentialSharedSchema
  .extend({
    title: requiredTrimmedString({ max: 180 }),
  })
  .strip();

export const updateAgencyProfileCredentialSchema = credentialSharedSchema
  .extend({
    title: optionalTrimmedString({ max: 180 }).nullable(),
  })
  .strip();

const experienceSharedSchema = z
  .object({
    client: optionalTrimmedString({ max: 180 }).nullable(),
    summary: optionalLongText({ max: 6000 }),
    startDate: optionalDateString(),
    endDate: optionalDateString(),
    isCurrent: optionalBoolean(),
    impact: optionalLongText({ max: 6000 }),
    heroImageUrl: optionalUrl({ max: 500, nullable: true }),
    tags: optionalTagArray(),
    position: optionalNumber({ min: 0, integer: true }).nullable(),
  })
  .strip();

const validateExperienceDates = (data, ctx) => {
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'endDate must be on or after startDate.',
    });
  }
};

export const createAgencyProfileExperienceSchema = experienceSharedSchema
  .extend({
    title: requiredTrimmedString({ max: 180 }),
  })
  .superRefine(validateExperienceDates)
  .strip();

export const updateAgencyProfileExperienceSchema = experienceSharedSchema
  .extend({
    title: optionalTrimmedString({ max: 180 }).nullable(),
  })
  .superRefine(validateExperienceDates)
  .strip();

const workforceSharedSchema = z
  .object({
    segmentName: optionalTrimmedString({ max: 180 }).nullable(),
    specialization: optionalTrimmedString({ max: 180 }).nullable(),
    availableCount: optionalNumber({ min: 0, max: 100000, integer: true }).nullable(),
    totalCount: optionalNumber({ min: 0, max: 100000, integer: true }).nullable(),
    deliveryModel: optionalTrimmedString({ max: 60 }).nullable(),
    location: optionalTrimmedString({ max: 255 }).nullable(),
    availabilityNotes: optionalLongText({ max: 4000 }),
    averageBillRate: optionalNumber({ min: 0, precision: 2 }).nullable(),
    currency: optionalTrimmedString({ max: 6 }).nullable(),
    leadTimeDays: optionalNumber({ min: 0, max: 365, integer: true }).nullable(),
    metadata: z.unknown().optional(),
    position: optionalNumber({ min: 0, integer: true }).nullable(),
  })
  .strip();

export const createAgencyProfileWorkforceSegmentSchema = workforceSharedSchema
  .extend({
    segmentName: requiredTrimmedString({ max: 180 }),
  })
  .strip();

export const updateAgencyProfileWorkforceSegmentSchema = workforceSharedSchema
  .extend({
    segmentName: optionalTrimmedString({ max: 180 }).nullable(),
  })
  .strip();
