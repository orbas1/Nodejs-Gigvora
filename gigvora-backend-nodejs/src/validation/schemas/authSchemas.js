import { z } from 'zod';
import {
  optionalBoolean,
  optionalGeoLocation,
  optionalLocationString,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredEmail,
  requiredTrimmedString,
} from '../primitives.js';

const emailSchema = requiredEmail();
const passwordSchema = requiredTrimmedString({ min: 8, max: 200 });
const firstNameSchema = requiredTrimmedString({ max: 120 });
const lastNameSchema = requiredTrimmedString({ max: 120 });
const optionalAddress = optionalTrimmedString({ max: 255 });
const optionalSignupChannel = optionalTrimmedString({ max: 120 });
const optionalTwoFactorMethod = optionalTrimmedString({ max: 32 }).transform((value) => {
  if (!value) {
    return undefined;
  }
  const normalized = value.toLowerCase();
  return ['email', 'app', 'sms'].includes(normalized) ? normalized : undefined;
});
const resetTokenSchema = requiredTrimmedString({ min: 32, max: 256 });

const birthDateSchema = z
  .string()
  .regex(/^(19|20)\d{2}-\d{2}-\d{2}$/u, 'dateOfBirth must use the YYYY-MM-DD format.')
  .refine((value) => {
    const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return false;
    }
    const candidate = new Date(Date.UTC(year, month - 1, day));
    return (
      candidate.getUTCFullYear() === year &&
      candidate.getUTCMonth() === month - 1 &&
      candidate.getUTCDate() === day
    );
  }, 'dateOfBirth must reference a valid calendar day.');

const optionalBirthDate = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return `${value}`.trim();
  }, birthDateSchema)
  .optional();

const personaRoleArray = optionalStringArray({ maxItemLength: 60, maxLength: 16 }).transform((values) => {
  if (!values) {
    return undefined;
  }
  return values.map((value) => value.toLowerCase());
});

const optionalRoleKey = optionalTrimmedString({ max: 60 }).transform((value) =>
  value ? value.toLowerCase() : undefined,
);

const baseRegistrationSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    address: optionalAddress,
    location: optionalLocationString(),
    geoLocation: optionalGeoLocation(),
    age: optionalNumber({ min: 13, max: 120, precision: 0, integer: true }),
    signupChannel: optionalSignupChannel,
    twoFactorEnabled: optionalBoolean(),
    twoFactorMethod: optionalTwoFactorMethod,
    dateOfBirth: optionalBirthDate,
    memberships: personaRoleArray,
    preferredRoles: personaRoleArray,
    primaryDashboard: optionalRoleKey,
    marketingOptIn: optionalBoolean(),
  })
  .strip();

const companyRegistrationSchema = baseRegistrationSchema
  .extend({
    companyName: requiredTrimmedString({ max: 255 }),
    description: optionalTrimmedString({ max: 2000 }),
    website: optionalTrimmedString({ max: 2048 }).transform((value) => {
      if (!value) {
        return undefined;
      }
      try {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`);
        return url.toString();
      } catch (error) {
        throw new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            message: 'website must be a valid URL.',
            path: ['website'],
          },
        ]);
      }
    }),
  })
  .strip();

const agencyRegistrationSchema = baseRegistrationSchema
  .extend({
    agencyName: requiredTrimmedString({ max: 255 }),
    focusArea: optionalTrimmedString({ max: 255 }),
    website: optionalTrimmedString({ max: 2048 }).transform((value) => {
      if (!value) {
        return undefined;
      }
      try {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`);
        return url.toString();
      } catch (error) {
        throw new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            message: 'website must be a valid URL.',
            path: ['website'],
          },
        ]);
      }
    }),
  })
  .strip();

export const registerUserSchema = baseRegistrationSchema;
export const registerCompanySchema = companyRegistrationSchema;
export const registerAgencySchema = agencyRegistrationSchema;

export const loginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strip();

export const adminLoginSchema = loginSchema;

export const verifyTwoFactorSchema = z
  .object({
    email: emailSchema,
    code: requiredTrimmedString({ max: 10 }),
    tokenId: optionalTrimmedString({ max: 255 }),
  })
  .strip();

export const resendTwoFactorSchema = z
  .object({
    tokenId: requiredTrimmedString({ max: 255 }),
  })
  .strip();

export const googleLoginSchema = z
  .object({
    idToken: requiredTrimmedString({ max: 4096 }),
  })
  .strip();

export const appleLoginSchema = z
  .object({
    identityToken: requiredTrimmedString({ max: 4096 }),
    authorizationCode: optionalTrimmedString({ max: 4096 }),
  })
  .strip();

export const linkedinLoginSchema = z
  .object({
    accessToken: optionalTrimmedString({ max: 4096 }),
    authorizationCode: optionalTrimmedString({ max: 4096 }),
    redirectUri: optionalTrimmedString({ max: 2048 }),
  })
  .refine((value) => Boolean(value.accessToken) || Boolean(value.authorizationCode), {
    message: 'Either accessToken or authorizationCode must be provided.',
    path: ['accessToken'],
  })
  .strip();

export const refreshSessionSchema = z
  .object({
    refreshToken: requiredTrimmedString({ max: 4096 }),
  })
  .strip();

export const revokeRefreshTokenSchema = z
  .object({
    refreshToken: requiredTrimmedString({ max: 4096 }),
    reason: optionalTrimmedString({ max: 120 }),
  })
  .strip();

export const requestPasswordResetSchema = z
  .object({
    email: emailSchema,
  })
  .strip();

export const verifyPasswordResetTokenSchema = z
  .object({
    token: resetTokenSchema,
  })
  .strip();

export const performPasswordResetSchema = z
  .object({
    token: resetTokenSchema,
    password: passwordSchema,
  })
  .strip();

