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
  })
  .strip();
