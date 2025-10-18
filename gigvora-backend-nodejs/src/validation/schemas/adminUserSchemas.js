import { z } from 'zod';

import {
  optionalBoolean,
  optionalGeoLocation,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredEmail,
  requiredTrimmedString,
} from '../primitives.js';
import { USER_STATUSES } from '../../models/index.js';

const FALLBACK_STATUSES = ['invited', 'active', 'suspended', 'archived'];
export const ADMIN_USER_STATUSES = Array.from(new Set([...(USER_STATUSES ?? []), ...FALLBACK_STATUSES]))
  .map((value) => `${value}`.trim().toLowerCase())
  .filter(Boolean);

function normaliseStatus(value, ctx) {
  if (value == null) {
    return undefined;
  }
  const normalised = `${value}`.trim().toLowerCase();
  if (!normalised) {
    return undefined;
  }
  if (!ADMIN_USER_STATUSES.includes(normalised)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Unsupported user status.',
    });
    return z.NEVER;
  }
  return normalised;
}

function normaliseRole(value) {
  if (value == null) {
    return undefined;
  }
  const trimmed = `${value}`.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\s+/g, '_');
}

const optionalStatusSchema = optionalTrimmedString({ max: 32 }).transform((value) => {
  if (value == null) {
    return undefined;
  }
  const ctx = {
    addIssue(issue) {
      throw new z.ZodError([
        {
          ...issue,
          path: ['status'],
        },
      ]);
    },
  };
  return normaliseStatus(value, ctx);
});

const requiredStatusSchema = requiredTrimmedString({ max: 32 }).transform((value) => {
  const ctx = {
    addIssue(issue) {
      throw new z.ZodError([
        {
          ...issue,
          path: ['status'],
        },
      ]);
    },
  };
  const normalised = normaliseStatus(value, ctx);
  return normalised ?? 'active';
});

const optionalRoleSchema = optionalTrimmedString({ max: 80 }).transform((value) => normaliseRole(value));

const optionalRolesArraySchema = optionalStringArray({ maxItemLength: 80 })
  .transform((values) => values?.map((value) => normaliseRole(value)).filter(Boolean))
  .optional();

const membershipSchema = optionalTrimmedString({ max: 60 }).transform((value) => {
  if (value == null) {
    return undefined;
  }
  const normalised = `${value}`.trim().toLowerCase();
  return normalised || undefined;
});

const sortSchema = optionalTrimmedString({ max: 40 }).transform((value) => {
  if (!value) {
    return undefined;
  }
  const normalised = value.trim().toLowerCase();
  if (!normalised) {
    return undefined;
  }
  return normalised;
});

export const adminUserListQuerySchema = z
  .object({
    search: optionalTrimmedString({ max: 255 }),
    status: optionalStatusSchema,
    membership: membershipSchema,
    role: optionalRoleSchema,
    limit: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? 20),
    offset: optionalNumber({ min: 0, integer: true }).transform((value) => value ?? 0),
    fresh: optionalBoolean(),
    sort: sortSchema,
  })
  .strip();

export const adminUserCreateSchema = z
  .object({
    firstName: requiredTrimmedString({ max: 120 }),
    lastName: requiredTrimmedString({ max: 120 }),
    email: requiredEmail(),
    password: requiredTrimmedString({ min: 8, max: 120 }),
    userType: membershipSchema,
    status: optionalStatusSchema,
    phoneNumber: optionalTrimmedString({ max: 30 }),
    jobTitle: optionalTrimmedString({ max: 120 }),
    avatarUrl: optionalTrimmedString({ max: 2048 }),
    address: optionalTrimmedString({ max: 255 }),
    location: optionalTrimmedString({ max: 255 }),
    geoLocation: optionalGeoLocation(),
    age: optionalNumber({ min: 13, max: 120, integer: true }),
    twoFactorEnabled: optionalBoolean(),
    twoFactorMethod: optionalTrimmedString({ max: 8 }).transform((value) =>
      value ? value.trim().toLowerCase() : undefined,
    ),
    roles: optionalRolesArraySchema,
  })
  .strip();

export const adminUserUpdateSchema = z
  .object({
    firstName: optionalTrimmedString({ max: 120 }),
    lastName: optionalTrimmedString({ max: 120 }),
    email: optionalTrimmedString({ max: 255 }).transform((value) =>
      value ? value.trim().toLowerCase() : undefined,
    ),
    address: optionalTrimmedString({ max: 255 }),
    location: optionalTrimmedString({ max: 255 }),
    geoLocation: optionalGeoLocation(),
    age: optionalNumber({ min: 13, max: 120, integer: true }),
    phoneNumber: optionalTrimmedString({ max: 30 }),
    jobTitle: optionalTrimmedString({ max: 120 }),
    avatarUrl: optionalTrimmedString({ max: 2048 }),
    userType: membershipSchema,
    status: optionalStatusSchema,
  })
  .strip();

export const adminUserSecurityUpdateSchema = z
  .object({
    twoFactorEnabled: optionalBoolean(),
    twoFactorMethod: optionalTrimmedString({ max: 8 }).transform((value) =>
      value ? value.trim().toLowerCase() : undefined,
    ),
  })
  .strip();

export const adminUserStatusUpdateSchema = z
  .object({
    status: requiredStatusSchema,
    reason: optionalTrimmedString({ max: 1000 }),
    notify: optionalBoolean(),
  })
  .strip();

export const adminUserRoleUpdateSchema = z
  .object({
    roles: optionalRolesArraySchema.default([]),
  })
  .strip();

export const adminUserResetPasswordSchema = z
  .object({
    password: optionalTrimmedString({ min: 8, max: 120 }),
    rotateSessions: optionalBoolean(),
  })
  .strip();

export const adminUserNoteCreateSchema = z
  .object({
    body: requiredTrimmedString({ max: 4000 }),
    visibility: optionalTrimmedString({ max: 20 }).transform((value) => {
      if (!value) {
        return 'internal';
      }
      const normalised = value.trim().toLowerCase();
      if (!['internal', 'restricted'].includes(normalised)) {
        throw new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            message: 'Visibility must be internal or restricted.',
            path: ['visibility'],
          },
        ]);
      }
      return normalised;
    }),
    metadata: z.unknown().optional(),
  })
  .strip();

export const adminUserNotesQuerySchema = z
  .object({
    limit: optionalNumber({ min: 1, max: 100, integer: true }),
    offset: optionalNumber({ min: 0, integer: true }),
  })
  .strip();

