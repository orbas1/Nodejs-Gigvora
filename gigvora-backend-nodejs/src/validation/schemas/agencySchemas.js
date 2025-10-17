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

const followerPolicySchema = z.enum(['open', 'approval_required', 'closed']);
const followerStatusSchema = z.enum(['active', 'muted', 'blocked']);
const connectionPolicySchema = z.enum(['open', 'invite_only', 'manual_review']);

const socialLinkSchema = z
  .object({
    label: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    url: requiredTrimmedString({ max: 2048 }),
  })
  .transform((value) => {
    try {
      const normalisedUrl = value.url.startsWith('http') ? value.url : `https://${value.url}`;
      const parsed = new URL(normalisedUrl);
      return {
        label: value.label ?? null,
        url: parsed.toString(),
      };
    } catch (error) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: 'url must be a valid URL.',
          path: ['url'],
        },
      ]);
    }
  });

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

const optionalUrl = z
  .union([
    z
      .string()
      .trim()
      .max(2048)
      .transform((value) => {
        if (!value) {
          return undefined;
        }
        try {
          const normalised = value.startsWith('http') ? value : `https://${value}`;
          return new URL(normalised).toString();
        } catch (error) {
          throw new z.ZodError([
            {
              code: z.ZodIssueCode.custom,
              message: 'must be a valid URL.',
              path: [],
            },
          ]);
        }
      }),
    z.literal('').transform(() => undefined),
    z.undefined(),
  ])
  .transform((value) => value ?? undefined);

const baseUpdateSchema = z
  .object({
    agencyName: optionalTrimmedString({ max: 255 }),
    focusArea: optionalTrimmedString({ max: 255 }),
    tagline: optionalTrimmedString({ max: 160 }),
    summary: optionalTrimmedString({ max: 4000 }),
    about: optionalTrimmedString({ max: 8000 }),
    website: optionalUrl,
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
    bannerUrl: optionalUrl,
    autoAcceptFollowers: optionalBoolean(),
    defaultConnectionMessage: optionalTrimmedString({ max: 2000 }),
    followerPolicy: followerPolicySchema.optional(),
    connectionPolicy: connectionPolicySchema.optional(),
  })
  .strip();

export const updateAgencyProfileSchema = baseUpdateSchema;

const base64Schema = z
  .string()
  .trim()
  .max(10_000_000, { message: 'imageData is too large.' });

export const updateAgencyAvatarSchema = z
  .object({
    imageData: z.union([base64Schema, z.undefined()]),
    avatarUrl: optionalUrl,
    avatarSeed: optionalTrimmedString({ max: 255 }),
    bannerUrl: optionalUrl,
    brandColor: optionalTrimmedString({ max: 12 }),
  })
  .strip()
  .refine((value) => {
    return (
      value.imageData !== undefined ||
      value.avatarUrl !== undefined ||
      value.avatarSeed !== undefined ||
      value.bannerUrl !== undefined ||
      value.brandColor !== undefined
    );
  }, { message: 'At least one field must be provided.' });

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

export const followerParamsSchema = z
  .object({
    followerId: requiredTrimmedString({ max: 120 })
      .transform((value) => Number(value))
      .refine((value) => Number.isInteger(value) && value > 0, { message: 'followerId must be a positive integer.' }),
  })
  .strip();

export const updateFollowerBodySchema = z
  .object({
    status: followerStatusSchema.optional(),
    notificationsEnabled: optionalBoolean(),
  })
  .strip();

export const connectionParamsSchema = z
  .object({
    connectionId: requiredTrimmedString({ max: 120 })
      .transform((value) => Number(value))
      .refine((value) => Number.isInteger(value) && value > 0, { message: 'connectionId must be a positive integer.' }),
  })
  .strip();

export const requestConnectionBodySchema = z
  .object({
    targetId: requiredTrimmedString({ max: 120 })
      .transform((value) => Number(value))
      .refine((value) => Number.isInteger(value) && value > 0, { message: 'targetId must be a positive integer.' }),
  })
  .strip();

export const respondConnectionBodySchema = z
  .object({
    decision: requiredTrimmedString({ max: 32, toLowerCase: true }).refine((value) => ['accept', 'reject'].includes(value), {
      message: 'decision must be accept or reject.',
    }),
  optionalTrimmedString,
  optionalNumber,
  optionalBoolean,
  requiredTrimmedString,
} from '../primitives.js';
import { AGENCY_PROFILE_MEDIA_ALLOWED_TYPES, AGENCY_PROFILE_CREDENTIAL_TYPES } from '../../models/index.js';

const MEDIA_TYPES = AGENCY_PROFILE_MEDIA_ALLOWED_TYPES.map((type) => type.toLowerCase());
const CREDENTIAL_TYPES = AGENCY_PROFILE_CREDENTIAL_TYPES.map((type) => type.toLowerCase());

function optionalUrl({ max = 2048 } = {}) {
  return z
    .union([
      z.preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        return `${value}`.trim();
      }, z.string().url({ message: 'must be a valid URL.' }).max(max)),
      z.undefined(),
    ])
    .nullable();
}

function optionalLongText({ max = 4000 } = {}) {
  return z
    .union([
      z.preprocess((value) => {
        if (value == null) {
          return undefined;
        }
        const text = `${value}`.trim();
        return text ? text : undefined;
      }, z.string().max(max)),
      z.undefined(),
    ])
    .nullable();
}

function optionalDateString() {
  return z
    .union([
      z.preprocess((value) => {
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
}

function optionalTagArray() {
  return z
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
}

const mediaTypeSchema = z
  .union([
    z.preprocess((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      return `${value}`.trim().toLowerCase();
    }, z.string().min(1)),
    z.undefined(),
  ])
  .refine((value) => value == null || MEDIA_TYPES.includes(value), {
    message: `type must be one of: ${MEDIA_TYPES.join(', ')}`,
  })
  .transform((value) => value ?? undefined);

const credentialTypeSchema = z
  .union([
    z.preprocess((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      return `${value}`.trim().toLowerCase();
    }, z.string().min(1)),
    z.undefined(),
  ])
  .refine((value) => value == null || CREDENTIAL_TYPES.includes(value), {
    message: `type must be one of: ${CREDENTIAL_TYPES.join(', ')}`,
  })
  .transform((value) => value ?? undefined);

export const updateAgencyProfileBasicsSchema = z
  .object({
    tagline: optionalTrimmedString({ max: 160 }).nullable(),
    description: optionalLongText({ max: 5000 }),
    introVideoUrl: optionalUrl({ max: 500 }),
    bannerImageUrl: optionalUrl({ max: 500 }),
    profileImageUrl: optionalUrl({ max: 500 }),
    workforceAvailable: optionalNumber({ min: 0, max: 100000, integer: true }).nullable(),
    workforceNotes: optionalTrimmedString({ max: 255 }).nullable(),
  })
  .strip();

export const createAgencyProfileMediaSchema = z
  .object({
    type: mediaTypeSchema,
    title: optionalTrimmedString({ max: 160 }).nullable(),
    url: z.preprocess((value) => {
      if (value == null || value === '') {
        return value;
      }
      return `${value}`.trim();
    }, z.string().url({ message: 'url must be a valid URL.' }).max(2048)),
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
    url: optionalUrl({ max: 2048 }),
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

const credentialSharedSchema = z
  .object({
    type: credentialTypeSchema,
    issuer: optionalTrimmedString({ max: 180 }).nullable(),
    issuedAt: optionalDateString(),
    expiresAt: optionalDateString(),
    credentialUrl: optionalUrl({ max: 500 }),
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
    heroImageUrl: optionalUrl({ max: 500 }),
    tags: optionalTagArray(),
    position: optionalNumber({ min: 0, integer: true }).nullable(),
  })
  .strip();

function validateExperienceDates(data, ctx) {
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'endDate must be on or after startDate.',
    });
  }
}

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
