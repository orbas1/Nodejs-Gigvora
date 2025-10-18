import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredEmail,
  requiredTrimmedString,
  optionalGeoLocation,
} from '../primitives.js';

const sortBySchema = z
  .enum(['recent', 'name', 'trust', 'completion'])
  .catch('recent')
  .optional();

const sortDirectionSchema = z.enum(['asc', 'desc']).catch('desc').optional();

export const adminProfileListQuerySchema = z
  .object({
    page: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    pageSize: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? undefined),
    search: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    availability: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    visibility: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    networkVisibility: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    followersVisibility: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    userType: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    membership: optionalTrimmedString({ max: 80 }).transform((value) => value?.toLowerCase()),
    memberships: optionalStringArray({ maxItemLength: 80 }).transform((values) => values?.map((entry) => entry.toLowerCase())),
    trustMin: optionalNumber({ min: 0, max: 100, precision: 2 }),
    trustMax: optionalNumber({ min: 0, max: 100, precision: 2 }),
    completionMin: optionalNumber({ min: 0, max: 100, precision: 2 }),
    completionMax: optionalNumber({ min: 0, max: 100, precision: 2 }),
    hasAvatar: optionalBoolean(),
    sortBy: sortBySchema,
    sortDirection: sortDirectionSchema,
  })
  .strip();

const optionalLowerCaseString = ({ max = 255 } = {}) =>
  optionalTrimmedString({ max }).transform((value) => value?.toLowerCase());

const profileUserSchema = z
  .object({
    firstName: requiredTrimmedString({ max: 120 }),
    lastName: requiredTrimmedString({ max: 120 }),
    email: requiredEmail(),
    password: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    userType: optionalLowerCaseString({ max: 60 }),
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    geoLocation: optionalGeoLocation(),
    memberships: optionalStringArray({ maxItemLength: 80 }),
    primaryDashboard: optionalLowerCaseString({ max: 60 }),
    twoFactorEnabled: optionalBoolean(),
    twoFactorMethod: optionalLowerCaseString({ max: 16 }),
  })
  .strip();

const partialProfileUserSchema = profileUserSchema.partial({ firstName: true, lastName: true, email: true });

const baseProfileSchema = z
  .object({
    headline: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    bio: optionalTrimmedString({ max: 5000 }).transform((value) => value ?? undefined),
    missionStatement: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    skills: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    experience: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    education: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    timezone: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    availabilityStatus: optionalLowerCaseString({ max: 60 }),
    availableHoursPerWeek: optionalNumber({ min: 0, max: 168, precision: 0, integer: true }),
    openToRemote: optionalBoolean(),
    availabilityNotes: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    profileVisibility: optionalLowerCaseString({ max: 60 }),
    networkVisibility: optionalLowerCaseString({ max: 60 }),
    followersVisibility: optionalLowerCaseString({ max: 60 }),
    avatarUrl: optionalTrimmedString({ max: 1024 }).transform((value) => value ?? undefined),
    avatarSeed: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    trustScore: optionalNumber({ min: 0, max: 100, precision: 2 }),
    profileCompletion: optionalNumber({ min: 0, max: 100, precision: 2 }),
    likesCount: optionalNumber({ min: 0, precision: 0, integer: true }),
    followersCount: optionalNumber({ min: 0, precision: 0, integer: true }),
    areasOfFocus: z.unknown().optional(),
    socialLinks: z.unknown().optional(),
    portfolioLinks: z.unknown().optional(),
    qualifications: z.unknown().optional(),
    preferredEngagements: z.unknown().optional(),
    collaborationRoster: z.unknown().optional(),
    impactHighlights: z.unknown().optional(),
    availabilityUpdatedAt: optionalTrimmedString({ max: 64 }).transform((value) => value ?? undefined),
  })
  .strip();

export const adminProfileCreateSchema = z
  .object({
    user: profileUserSchema,
    profile: baseProfileSchema.optional(),
    notes: z
      .object({
        body: requiredTrimmedString({ max: 4000 }),
        visibility: optionalLowerCaseString({ max: 32 }),
        pinned: optionalBoolean(),
        metadata: z.unknown().optional(),
      })
      .optional(),
  })
  .strip();

export const adminProfileUpdateSchema = z
  .object({
    user: partialProfileUserSchema.optional(),
    profile: baseProfileSchema.optional(),
  })
  .strip();

export const adminProfileReferenceCreateSchema = z
  .object({
    referenceName: requiredTrimmedString({ max: 255 }),
    relationship: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    company: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    email: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    phone: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    endorsement: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    isVerified: optionalBoolean(),
    weight: optionalNumber({ min: 0, max: 100, precision: 2 }),
    lastInteractedAt: optionalTrimmedString({ max: 64 }).transform((value) => value ?? undefined),
  })
  .strip();

export const adminProfileReferenceUpdateSchema = adminProfileReferenceCreateSchema.partial();

export const adminProfileNoteCreateSchema = z
  .object({
    body: requiredTrimmedString({ max: 4000 }),
    visibility: optionalLowerCaseString({ max: 32 }),
    pinned: optionalBoolean(),
    metadata: z.unknown().optional(),
  })
  .strip();

export const adminProfileNoteUpdateSchema = z
  .object({
    body: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    visibility: optionalLowerCaseString({ max: 32 }),
    pinned: optionalBoolean(),
    metadata: z.unknown().optional(),
  })
  .strip();

export default {
  adminProfileListQuerySchema,
  adminProfileCreateSchema,
  adminProfileUpdateSchema,
  adminProfileReferenceCreateSchema,
  adminProfileReferenceUpdateSchema,
  adminProfileNoteCreateSchema,
  adminProfileNoteUpdateSchema,
};
