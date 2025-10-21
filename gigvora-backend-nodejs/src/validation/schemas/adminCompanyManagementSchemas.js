import { z } from 'zod';
import {
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredEmail,
  requiredTrimmedString,
} from '../primitives.js';

const COMPANY_STATUS_VALUES = ['invited', 'active', 'suspended', 'archived'];

const optionalStatus = optionalTrimmedString({ max: 32 }).transform((value, ctx) => {
  if (value == null) {
    return undefined;
  }
  const normalised = value.trim().toLowerCase();
  if (!COMPANY_STATUS_VALUES.includes(normalised)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'status must be invited, active, suspended, or archived.',
      path: ['status'],
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

const baseCompanySchema = z
  .object({
    companyName: requiredTrimmedString({ max: 255 }),
    description: optionalNullableString({ max: 6000 }),
    website: optionalNullableUrl({ max: 2048 }),
    location: optionalNullableString({ max: 255 }),
    tagline: optionalNullableString({ max: 255 }),
    logoUrl: optionalNullableUrl({ max: 2048 }),
    bannerUrl: optionalNullableUrl({ max: 2048 }),
    contactEmail: optionalNullableString({ max: 255 }),
    contactPhone: optionalNullableString({ max: 60 }),
    socialLinks: z.array(socialLinkSchema).max(15).optional(),
    profileHeadline: optionalNullableString({ max: 255 }),
    profileMission: optionalNullableString({ max: 4000 }),
    timezone: optionalNullableString({ max: 120 }),
    memberships: optionalStringArray({ maxItemLength: 80 }).transform((values) => values ?? undefined),
    primaryDashboard: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    status: optionalStatus,
  })
  .strip();

export const adminCompanyListQuerySchema = z
  .object({
    search: optionalTrimmedString({ max: 200 }).transform((value) => value ?? undefined),
    status: optionalStatus,
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

export const adminCompanyCreateSchema = baseCompanySchema.merge(ownerDetailsSchema);

export const adminCompanyUpdateSchema = baseCompanySchema.partial().extend({
  ownerEmail: optionalTrimmedString({ max: 255 }).transform((value) => value?.toLowerCase()),
  ownerFirstName: optionalTrimmedString({ max: 120 }),
  ownerLastName: optionalTrimmedString({ max: 120 }),
  ownerPhone: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
  status: optionalStatus,
}).strip();

export default {
  adminCompanyListQuerySchema,
  adminCompanyCreateSchema,
  adminCompanyUpdateSchema,
};
