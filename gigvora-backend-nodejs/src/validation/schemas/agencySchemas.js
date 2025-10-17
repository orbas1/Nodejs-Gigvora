import { z } from 'zod';
import {
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
