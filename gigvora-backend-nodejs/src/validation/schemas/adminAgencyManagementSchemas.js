import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredEmail,
  requiredTrimmedString,
} from '../primitives.js';

const AGENCY_STATUS_VALUES = ['invited', 'active', 'suspended', 'archived'];
const FOLLOWER_POLICIES = ['open', 'approval_required', 'closed'];
const CONNECTION_POLICIES = ['open', 'invite_only', 'manual_review'];

const optionalStatus = optionalTrimmedString({ max: 32 }).transform((value, ctx) => {
  if (value == null) {
    return undefined;
  }
  const normalised = value.trim().toLowerCase();
  if (!AGENCY_STATUS_VALUES.includes(normalised)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'status must be invited, active, suspended, or archived.',
      path: ['status'],
    });
    return z.NEVER;
  }
  return normalised;
});

const optionalPolicy = (allowed, field) =>
  optionalTrimmedString({ max: 32 }).transform((value, ctx) => {
    if (value == null) {
      return undefined;
    }
    const normalised = value.trim().toLowerCase();
    if (!allowed.includes(normalised)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field} must be one of: ${allowed.join(', ')}.`,
        path: [field],
      });
      return z.NEVER;
    }
    return normalised;
  });

const optionalUrl = ({ max = 2048 } = {}) =>
  z
    .union([
      z.preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        return `${value}`.trim();
      }, z.string().url({ message: 'must be a valid URL.' }).max(max)),
      z.undefined(),
    ])
    .transform((value) => value ?? undefined);

const optionalNullableString = ({ max }) =>
  z
    .union([z.null(), optionalTrimmedString({ max })])
    .transform((value) => (value === null ? null : value ?? undefined));

const optionalNullableUrl = ({ max = 2048 } = {}) =>
  z
    .union([
      z.null(),
      z
        .preprocess((value) => {
          if (value == null || value === '') {
            return undefined;
          }
          return `${value}`.trim();
        }, z.string().url({ message: 'must be a valid URL.' }).max(max)),
      z.undefined(),
    ])
    .transform((value) => (value === null ? null : value ?? undefined));

const mixedStringCollection = ({ maxItemLength = 160, maxLength = 25 } = {}) =>
  z
    .union([
      z.preprocess((value) => {
        if (value == null) {
          return undefined;
        }
        if (Array.isArray(value)) {
          return value;
        }
        if (typeof value === 'string') {
          return value.split(',');
        }
        return [value];
      }, z.array(z.any())),
      z.undefined(),
    ])
    .transform((values) => {
      if (!values) {
        return undefined;
      }
      const trimmed = values
        .map((entry) => `${entry}`.trim())
        .filter((entry) => entry.length > 0 && entry.length <= maxItemLength);
      if (!trimmed.length) {
        return [];
      }
      const unique = Array.from(new Set(trimmed.map((entry) => entry.toLowerCase())));
      const limited = typeof maxLength === 'number' ? unique.slice(0, maxLength) : unique;
      return limited;
    });

const socialLinkSchema = z
  .object({
    label: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    url: optionalUrl({ max: 500 }),
  })
  .strip()
  .refine((value) => Boolean(value.label || value.url), {
    message: 'Provide a label or URL for the social link.',
  });

const ownerDetailsSchema = z
  .object({
    ownerEmail: requiredEmail({ max: 255 }),
    ownerFirstName: requiredTrimmedString({ max: 120 }),
    ownerLastName: requiredTrimmedString({ max: 120 }),
    ownerPhone: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    password: requiredTrimmedString({ min: 12, max: 120 }),
  })
  .strip();

const baseAgencySchema = z
  .object({
    agencyName: requiredTrimmedString({ max: 255 }),
    focusArea: optionalNullableString({ max: 255 }),
    website: optionalNullableUrl({ max: 2048 }),
    location: optionalNullableString({ max: 255 }),
    tagline: optionalNullableString({ max: 160 }),
    summary: optionalNullableString({ max: 5000 }),
    description: optionalNullableString({ max: 8000 }),
    services: mixedStringCollection({ maxItemLength: 160, maxLength: 40 }),
    industries: mixedStringCollection({ maxItemLength: 160, maxLength: 40 }),
    clients: mixedStringCollection({ maxItemLength: 160, maxLength: 50 }),
    awards: mixedStringCollection({ maxItemLength: 200, maxLength: 50 }),
    socialLinks: z.array(socialLinkSchema).max(15).optional(),
    teamSize: optionalNumber({ min: 0, max: 100000, integer: true }).transform((value) => value ?? undefined),
    foundedYear: optionalNumber({ min: 1900, max: new Date().getFullYear() + 1, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    workforceAvailable: optionalNumber({ min: 0, max: 100000, integer: true }).transform((value) => value ?? undefined),
    workforceNotes: optionalNullableString({ max: 255 }),
    introVideoUrl: optionalNullableUrl({ max: 2048 }),
    bannerUrl: optionalNullableUrl({ max: 2048 }),
    avatarUrl: optionalNullableUrl({ max: 2048 }),
    brandColor: optionalNullableString({ max: 12 }),
    primaryContactName: optionalNullableString({ max: 160 }),
    primaryContactEmail: optionalNullableString({ max: 255 }),
    primaryContactPhone: optionalNullableString({ max: 60 }),
    autoAcceptFollowers: optionalBoolean(),
    followerPolicy: optionalPolicy(FOLLOWER_POLICIES, 'followerPolicy'),
    connectionPolicy: optionalPolicy(CONNECTION_POLICIES, 'connectionPolicy'),
    defaultConnectionMessage: optionalNullableString({ max: 2000 }),
    profileHeadline: optionalNullableString({ max: 255 }),
    profileMission: optionalNullableString({ max: 4000 }),
    timezone: optionalNullableString({ max: 120 }),
    memberships: optionalStringArray({ maxItemLength: 80 }).transform((values) => values ?? undefined),
    primaryDashboard: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    status: optionalStatus,
  })
  .strip();

export const adminAgencyListQuerySchema = z
  .object({
    search: optionalTrimmedString({ max: 200 }).transform((value) => value ?? undefined),
    status: optionalStatus,
    focusArea: optionalTrimmedString({ max: 200 }).transform((value) => value ?? undefined),
    sort: optionalTrimmedString({ max: 32 }).transform((value) => {
      if (!value) {
        return undefined;
      }
      const normalised = value.trim().toLowerCase();
      const allowed = new Set(['created_desc', 'created_asc', 'name_asc', 'name_desc']);
      return allowed.has(normalised) ? normalised : undefined;
    }),
    limit: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? 25),
    offset: optionalNumber({ min: 0, integer: true }).transform((value) => value ?? 0),
  })
  .strip();

export const adminAgencyCreateSchema = baseAgencySchema.merge(ownerDetailsSchema);

export const adminAgencyUpdateSchema = baseAgencySchema.partial().extend({
  ownerEmail: optionalTrimmedString({ max: 255 }).transform((value) => value?.toLowerCase()),
  ownerFirstName: optionalTrimmedString({ max: 120 }),
  ownerLastName: optionalTrimmedString({ max: 120 }),
  ownerPhone: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
  memberships: optionalStringArray({ maxItemLength: 80 }).transform((values) => values ?? undefined),
  primaryDashboard: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
  status: optionalStatus,
}).strip();

export default {
  adminAgencyListQuerySchema,
  adminAgencyCreateSchema,
  adminAgencyUpdateSchema,
};
