import { z } from 'zod';
import {
  optionalBoolean,
  optionalGeoLocation,
  optionalLocationString,
  optionalNumber,
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
const ASSIGNABLE_ROLES = [
  'user',
  'admin',
  'company',
  'freelancer',
  'agency',
  'mentor',
  'headhunter',
  'support',
  'analyst',
  'moderator',
  'partner',
  'volunteer',
];

function normalizeRoleValue(value) {
  if (!value) {
    return null;
  }
  const normalized = `${value}`.trim().toLowerCase().replace(/\s+/g, '_');
  return normalized || null;
}

const rolesArraySchema = z
  .array(requiredTrimmedString({ max: 60 }))
  .max(12)
  .transform((values, ctx) => {
    const unique = new Set();
    let hasIssue = false;
    values.forEach((role, index) => {
      const normalized = normalizeRoleValue(role);
      if (!normalized || !ASSIGNABLE_ROLES.includes(normalized)) {
        hasIssue = true;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `role "${role}" is not assignable.`,
          path: [index],
        });
        return;
      }
      unique.add(normalized);
    });
    if (hasIssue) {
      return z.NEVER;
    }
    return Array.from(unique);
  });

const optionalRolesArray = rolesArraySchema.optional().transform((roles) => roles ?? []);

const optionalIsoDateString = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    const candidate = new Date(value);
    if (Number.isNaN(candidate.getTime())) {
      return Number.NaN;
    }
    return candidate.toISOString();
  }, z.string().datetime({ offset: true }))
  .optional()
  .transform((value) => value ?? undefined);

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
    preferredRoles: optionalRolesArray,
    memberships: optionalRolesArray,
    marketingOptIn: optionalBoolean().transform((value) => (value === undefined ? true : value)),
    marketingOptInAt: optionalIsoDateString,
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

