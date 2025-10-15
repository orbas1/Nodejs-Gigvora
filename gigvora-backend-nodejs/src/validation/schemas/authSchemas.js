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

