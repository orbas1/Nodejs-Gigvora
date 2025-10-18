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

const DATABASE_DIALECTS = ['postgres', 'postgresql', 'mysql', 'mariadb', 'mssql', 'sqlite'];
const DATABASE_SSL_MODES = ['disable', 'prefer', 'require', 'verify-ca', 'verify-full'];

const databaseConnectionOptionsSchema = z
  .object({
    poolMin: optionalNumber({ min: 0, max: 500, precision: 0, integer: true }),
    poolMax: optionalNumber({ min: 1, max: 500, precision: 0, integer: true }),
    idleTimeoutMs: optionalNumber({ min: 0, max: 3600000, precision: 0, integer: true }),
    connectionTimeoutMs: optionalNumber({ min: 1000, max: 600000, precision: 0, integer: true }),
    maxLifetimeMs: optionalNumber({ min: 0, max: 7200000, precision: 0, integer: true }),
    replicaLagThresholdMs: optionalNumber({ min: 0, max: 7200000, precision: 0, integer: true }),
  })
  .strip();

const databaseConnectionBaseSchema = z
  .object({
    name: requiredTrimmedString({ max: 120 }),
    environment: requiredTrimmedString({ max: 60 }).transform((value) => value.toLowerCase()),
    role: requiredTrimmedString({ max: 60 }).transform((value) => value.toLowerCase()),
    description: optionalTrimmedString({ max: 1000 }),
    dialect: requiredTrimmedString({ max: 40 }).transform((value) => value.toLowerCase()),
    host: requiredTrimmedString({ max: 255 }),
    port: optionalNumber({ min: 1, max: 65535, precision: 0, integer: true }).transform((value) => value ?? undefined),
    database: requiredTrimmedString({ max: 255 }),
    username: requiredTrimmedString({ max: 255 }),
    password: optionalTrimmedString({ max: 255 }),
    sslMode: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    options: databaseConnectionOptionsSchema.optional(),
    allowedRoles: optionalStringArray({ maxItemLength: 60 }).transform((roles) =>
      roles ? roles.map((role) => role.toLowerCase()) : undefined,
    ),
    isPrimary: optionalBoolean(),
    readOnly: optionalBoolean(),
  })
  .strip();

function validateDialectValue(value, ctx) {
  if (value && !DATABASE_DIALECTS.includes(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dialect'],
      message: 'Unsupported database dialect.',
    });
  }
}

function validateSslModeValue(value, ctx) {
  if (value && !DATABASE_SSL_MODES.includes(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sslMode'],
      message: 'Unsupported SSL mode.',
    });
  }
}

function validateOptionsValue(options, ctx) {
  if (options?.poolMin != null && options?.poolMax != null && options.poolMax < options.poolMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['options', 'poolMax'],
      message: 'poolMax must be greater than or equal to poolMin.',
    });
  }
}

export const databaseConnectionCreateSchema = databaseConnectionBaseSchema.superRefine((data, ctx) => {
  validateDialectValue(data.dialect, ctx);
  validateSslModeValue(data.sslMode, ctx);
  validateOptionsValue(data.options, ctx);
  if (data.port == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['port'],
      message: 'Port is required.',
    });
  }
  if (!data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['password'],
      message: 'Password is required.',
    });
  }
}).transform((data) => ({
  ...data,
  port: data.port ?? 5432,
  sslMode: data.sslMode ?? 'require',
  options: data.options ?? {},
  allowedRoles: data.allowedRoles ?? [],
}));

export const databaseConnectionUpdateSchema = databaseConnectionBaseSchema.partial().superRefine((data, ctx) => {
  validateDialectValue(data.dialect, ctx);
  validateSslModeValue(data.sslMode, ctx);
  validateOptionsValue(data.options, ctx);
  if (data.password === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['password'],
      message: 'Password cannot be empty.',
    });
  }
});

export const databaseConnectionListQuerySchema = z
  .object({
    environment: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    role: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
  })
  .strip();

export const databaseConnectionDetailQuerySchema = z
  .object({
    includeSecret: optionalBoolean(),
  })
  .strip();

export const databaseConnectionIdParamSchema = z
  .object({
    connectionId: z.coerce.number().int().positive(),
  })
  .strip();

export const databaseConnectionTestSchema = z
  .object({
    connectionId: optionalNumber({ min: 1, precision: 0, integer: true }),
    name: optionalTrimmedString({ max: 120 }),
    environment: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    role: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    dialect: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    host: optionalTrimmedString({ max: 255 }),
    port: optionalNumber({ min: 1, max: 65535, precision: 0, integer: true }),
    database: optionalTrimmedString({ max: 255 }),
    username: optionalTrimmedString({ max: 255 }),
    password: optionalTrimmedString({ max: 255 }),
    sslMode: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    options: databaseConnectionOptionsSchema.optional(),
  })
  .strip();

