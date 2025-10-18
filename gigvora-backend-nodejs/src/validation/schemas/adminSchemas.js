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


const optionalLooseString = (max) =>
  z
    .preprocess((value) => {
      if (value == null) {
        return undefined;
      }
      const stringValue = `${value}`;
      if (!stringValue.length) {
        return undefined;
      }
      return stringValue;
    }, z.string().max(max));

const requiredLooseString = (max) =>
  z.preprocess((value) => {
    if (value == null) {
      return value;
    }
    return `${value}`;
  }, z.string().min(1).max(max));

const emailVariableSchema = z
  .object({
    key: optionalTrimmedString({ max: 160 }),
    label: optionalTrimmedString({ max: 160 }),
    description: optionalTrimmedString({ max: 400 }),
    required: optionalBoolean(),
    sampleValue: optionalTrimmedString({ max: 200 }),
  })
  .strip();

const emailTemplateSharedSchema = z
  .object({
    slug: optionalTrimmedString({ max: 160 }),
    name: requiredTrimmedString({ max: 160 }),
    description: optionalTrimmedString({ max: 1000 }),
    category: optionalTrimmedString({ max: 80 }).transform((value) => value?.toLowerCase()),
    subject: requiredTrimmedString({ max: 255 }),
    preheader: optionalTrimmedString({ max: 255 }),
    fromName: optionalTrimmedString({ max: 120 }),
    fromAddress: optionalTrimmedString({ max: 255 }),
    replyToAddress: optionalTrimmedString({ max: 255 }),
    heroImageUrl: optionalTrimmedString({ max: 500 }),
    layout: optionalTrimmedString({ max: 120 }),
    tags: optionalStringArray({ maxItemLength: 80 }),
    variables: z.array(emailVariableSchema).optional(),
    enabled: optionalBoolean(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminEmailTemplateCreateSchema = emailTemplateSharedSchema
  .extend({
    htmlBody: requiredLooseString(20000),
    textBody: optionalLooseString(20000).optional(),
  })
  .strip();

export const adminEmailTemplateUpdateSchema = emailTemplateSharedSchema
  .extend({
    htmlBody: requiredLooseString(20000),
    textBody: optionalLooseString(20000).optional(),
  })
  .strip();

export const adminEmailSmtpBodySchema = z
  .object({
    label: optionalTrimmedString({ max: 120 }),
    host: requiredTrimmedString({ max: 255 }),
    port: optionalNumber({ min: 1, max: 65535, precision: 0, integer: true }),
    secure: optionalBoolean(),
    username: optionalTrimmedString({ max: 255 }),
    password: optionalTrimmedString({ max: 255 }),
    fromName: optionalTrimmedString({ max: 120 }),
    fromAddress: requiredTrimmedString({ max: 255 }),
    replyToAddress: optionalTrimmedString({ max: 255 }),
    bccAuditRecipients: optionalStringArray({ maxItemLength: 255 }),
    rateLimitPerMinute: optionalNumber({ min: 1, max: 10000, precision: 0, integer: true }),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminEmailTestBodySchema = z
  .object({
    recipients: optionalStringArray({ maxItemLength: 255 }),
    to: optionalStringArray({ maxItemLength: 255 }),
    subject: optionalTrimmedString({ max: 255 }),
    htmlBody: optionalLooseString(20000).optional(),
    textBody: optionalLooseString(20000).optional(),
    templateId: optionalNumber({ min: 1, precision: 0, integer: true }),
  })
  .strip()
  .superRefine((data, ctx) => {
    const recipientCount = (Array.isArray(data.recipients) ? data.recipients.length : 0) +
      (Array.isArray(data.to) ? data.to.length : 0);
    if (recipientCount === 0) {
      ctx.addIssue({
        path: ['recipients'],
        code: z.ZodIssueCode.custom,
        message: 'At least one recipient email is required.',
      });
    }
  });
