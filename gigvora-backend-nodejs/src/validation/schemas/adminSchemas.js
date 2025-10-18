import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

const integerDaySchema = optionalNumber({ min: 1, max: 365, precision: 0, integer: true }).transform(
  (value) => value ?? undefined,
);

export const adminDashboardQuerySchema = z
  .object({
    lookbackDays: integerDaySchema,
    eventWindowDays: integerDaySchema,
  })
  .strip();

const commissionSettingsSchema = z
  .object({
    enabled: optionalBoolean(),
    rate: optionalNumber({ min: 0, max: 100, precision: 2 }),
    currency: optionalTrimmedString({ max: 3, toUpperCase: true }),
    minimumFee: optionalNumber({ min: 0, precision: 2 }),
    providerControlsServicemanPay: optionalBoolean(),
    servicemanMinimumRate: optionalNumber({ min: 0, max: 100, precision: 2 }),
    servicemanPayoutNotes: optionalTrimmedString({ max: 1000 }),
  })
  .strip();

const subscriptionPlanSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    name: requiredTrimmedString({ max: 120 }),
    price: optionalNumber({ min: 0, precision: 2 }),
    currency: optionalTrimmedString({ max: 3, toUpperCase: true }),
    interval: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    description: optionalTrimmedString({ max: 1000 }),
    restrictedFeatures: optionalStringArray({ maxItemLength: 120 }),
    trialDays: optionalNumber({ min: 0, max: 365, precision: 0, integer: true }),
  })
  .strip();

const subscriptionSettingsSchema = z
  .object({
    enabled: optionalBoolean(),
    restrictedFeatures: optionalStringArray({ maxItemLength: 120 }),
    plans: z.array(subscriptionPlanSchema).optional(),
  })
  .strip();

const stripeSettingsSchema = z
  .object({
    publishableKey: optionalTrimmedString({ max: 255 }),
    secretKey: optionalTrimmedString({ max: 255 }),
    webhookSecret: optionalTrimmedString({ max: 255 }),
    accountId: optionalTrimmedString({ max: 255 }),
  })
  .strip();

const escrowSettingsSchema = z
  .object({
    apiKey: optionalTrimmedString({ max: 255 }),
    apiSecret: optionalTrimmedString({ max: 255 }),
    sandbox: optionalBoolean(),
  })
  .strip();

const paymentSettingsSchema = z
  .object({
    provider: optionalTrimmedString({ max: 50 }),
    stripe: stripeSettingsSchema.optional(),
    escrow_com: escrowSettingsSchema.optional(),
  })
  .strip();

const smtpSettingsSchema = z
  .object({
    host: optionalTrimmedString({ max: 255 }),
    port: optionalNumber({ min: 1, max: 65535, precision: 0, integer: true }),
    secure: optionalBoolean(),
    username: optionalTrimmedString({ max: 255 }),
    password: optionalTrimmedString({ max: 255 }),
    fromAddress: optionalTrimmedString({ max: 255 }),
    fromName: optionalTrimmedString({ max: 255 }),
  })
  .strip();

const storageSettingsSchema = z
  .object({
    provider: optionalTrimmedString({ max: 64 }),
    cloudflare_r2: z
      .object({
        accountId: optionalTrimmedString({ max: 255 }),
        accessKeyId: optionalTrimmedString({ max: 255 }),
        secretAccessKey: optionalTrimmedString({ max: 255 }),
        bucket: optionalTrimmedString({ max: 255 }),
        endpoint: optionalTrimmedString({ max: 255 }),
        publicBaseUrl: optionalTrimmedString({ max: 2048 }),
      })
      .strip()
      .optional(),
  })
  .strip();

const appSettingsSchema = z
  .object({
    name: optionalTrimmedString({ max: 255 }),
    environment: optionalTrimmedString({ max: 120 }),
    clientUrl: optionalTrimmedString({ max: 2048 }),
    apiUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const databaseSettingsSchema = z
  .object({
    url: optionalTrimmedString({ max: 2048 }),
    host: optionalTrimmedString({ max: 255 }),
    port: optionalNumber({ min: 1, max: 65535, precision: 0, integer: true }),
    name: optionalTrimmedString({ max: 255 }),
    username: optionalTrimmedString({ max: 255 }),
    password: optionalTrimmedString({ max: 255 }),
  })
  .strip();

const featureToggleSchema = z
  .object({
    escrow: optionalBoolean(),
    subscriptions: optionalBoolean(),
    commissions: optionalBoolean(),
  })
  .strip();

export const platformSettingsBodySchema = z
  .object({
    commissions: commissionSettingsSchema.optional(),
    subscriptions: subscriptionSettingsSchema.optional(),
    payments: paymentSettingsSchema.optional(),
    smtp: smtpSettingsSchema.optional(),
    storage: storageSettingsSchema.optional(),
    app: appSettingsSchema.optional(),
    database: databaseSettingsSchema.optional(),
    featureToggles: featureToggleSchema.optional(),
  })
  .strip();

const affiliateTierSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    name: requiredTrimmedString({ max: 120 }),
    minValue: optionalNumber({ min: 0, precision: 2 }),
    maxValue: optionalNumber({ min: 0, precision: 2 }),
    rate: optionalNumber({ min: 0, max: 100, precision: 2 }),
  })
  .strip();

const recurrenceSchema = z
  .object({
    type: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    limit: optionalNumber({ min: 1, max: 120, precision: 0, integer: true }),
  })
  .strip();

const payoutSettingsSchema = z
  .object({
    frequency: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    minimumPayoutThreshold: optionalNumber({ min: 0, precision: 2 }),
    autoApprove: optionalBoolean(),
    recurrence: recurrenceSchema.optional(),
  })
  .strip();

const complianceSettingsSchema = z
  .object({
    requiredDocuments: optionalStringArray({ maxItemLength: 120 }),
    twoFactorRequired: optionalBoolean(),
    payoutKyc: optionalBoolean(),
  })
  .strip();

export const affiliateSettingsBodySchema = z
  .object({
    enabled: optionalBoolean(),
    defaultCommissionRate: optionalNumber({ min: 0, max: 100, precision: 2 }),
    referralWindowDays: optionalNumber({ min: 1, max: 365, precision: 0, integer: true }),
    currency: optionalTrimmedString({ max: 3, toUpperCase: true }),
    payouts: payoutSettingsSchema.optional(),
    tiers: z.array(affiliateTierSchema).optional(),
    compliance: complianceSettingsSchema.optional(),
  })
  .strip();

const TWO_FACTOR_METHODS = ['email', 'app', 'sms', 'security_key', 'backup_codes'];
const TWO_FACTOR_ROLES = ['admin', 'staff', 'company', 'freelancer', 'agency', 'mentor', 'headhunter', 'all'];
const TWO_FACTOR_ENFORCEMENT = ['optional', 'recommended', 'required'];
const TWO_FACTOR_BYPASS_STATUSES = ['pending', 'approved', 'denied', 'revoked'];

const optionalLowerEnum = (values) =>
  z
    .preprocess((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      return `${value}`.trim().toLowerCase();
    }, z.enum(values))
    .optional();

const optionalDateTime = z.preprocess((value) => {
  if (value == null || value === '') {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = Date.parse(`${value}`);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed);
}, z.date().optional());

const twoFactorMethodsArray = optionalStringArray({ maxItemLength: 40 })
  .transform((values) => values?.map((value) => value.toLowerCase()))
  .refine(
    (values) => !values || values.every((value) => TWO_FACTOR_METHODS.includes(value)),
    `allowedMethods must be one of: ${TWO_FACTOR_METHODS.join(', ')}.`,
  )
  .refine((values) => !values || values.length > 0, 'allowedMethods must include at least one method.');

const ipAllowlistArray = optionalStringArray({ maxItemLength: 120 }).transform((values) => values ?? undefined);

export const adminTwoFactorOverviewQuerySchema = z
  .object({
    lookbackDays: optionalNumber({ min: 1, max: 365, precision: 0, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const adminTwoFactorPolicyBodySchema = z
  .object({
    name: requiredTrimmedString({ max: 150 }),
    description: optionalTrimmedString({ max: 2000 }),
    appliesToRole: optionalLowerEnum(TWO_FACTOR_ROLES),
    enforcementLevel: optionalLowerEnum(TWO_FACTOR_ENFORCEMENT),
    allowedMethods: twoFactorMethodsArray,
    fallbackCodes: optionalNumber({ min: 0, max: 20, precision: 0, integer: true }).transform((value) => value ?? undefined),
    sessionDurationMinutes: optionalNumber({
      min: 5,
      max: 10_080,
      precision: 0,
      integer: true,
    }).transform((value) => value ?? undefined),
    requireForSensitiveActions: optionalBoolean(),
    enforced: optionalBoolean(),
    ipAllowlist: ipAllowlistArray,
    notes: optionalTrimmedString({ max: 2000 }),
  })
  .strip();

export const adminTwoFactorPolicyUpdateBodySchema = adminTwoFactorPolicyBodySchema.partial().strip();

export const adminTwoFactorPolicyParamsSchema = z
  .object({
    policyId: requiredTrimmedString({ max: 160 }),
  })
  .strip();

export const adminTwoFactorBypassBodySchema = z
  .object({
    userId: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    userEmail: optionalTrimmedString({ max: 255 }).transform((value) => value?.toLowerCase()),
    reason: optionalTrimmedString({ max: 500 }),
    notes: optionalTrimmedString({ max: 2000 }),
    expiresAt: optionalDateTime,
    status: optionalLowerEnum(TWO_FACTOR_BYPASS_STATUSES),
  })
  .strip()
  .superRefine((data, ctx) => {
    if (!data.userId && !data.userEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either userId or userEmail is required.',
        path: ['userId'],
      });
    }
  });

export const adminTwoFactorBypassUpdateBodySchema = z
  .object({
    status: optionalLowerEnum(TWO_FACTOR_BYPASS_STATUSES),
    expiresAt: optionalDateTime,
    notes: optionalTrimmedString({ max: 2000 }),
  })
  .strip();

export const adminTwoFactorBypassParamsSchema = z
  .object({
    bypassId: requiredTrimmedString({ max: 160 }),
  })
  .strip();

export const adminTwoFactorEnrollmentParamsSchema = z
  .object({
    enrollmentId: requiredTrimmedString({ max: 160 }),
  })
  .strip();

export const adminTwoFactorEnrollmentActionBodySchema = z
  .object({
    note: optionalTrimmedString({ max: 1000 }),
    reason: optionalTrimmedString({ max: 1000 }),
  })
  .strip();

