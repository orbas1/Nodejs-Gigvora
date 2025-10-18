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

const gdprDpoSchema = z
  .object({
    name: optionalTrimmedString({ max: 180 }),
    email: optionalTrimmedString({ max: 255 }),
    phone: optionalTrimmedString({ max: 64 }),
    officeLocation: optionalTrimmedString({ max: 255 }),
    address: optionalTrimmedString({ max: 500 }),
    timezone: optionalTrimmedString({ max: 120 }),
    availability: optionalTrimmedString({ max: 255 }),
  })
  .strip();

const gdprDataSubjectRequestsSchema = z
  .object({
    contactEmail: optionalTrimmedString({ max: 255 }),
    escalationEmail: optionalTrimmedString({ max: 255 }),
    slaDays: optionalNumber({ min: 1, max: 180, precision: 0, integer: true }),
    automatedIntake: optionalBoolean(),
    intakeChannels: optionalStringArray({ maxItemLength: 120 }),
    privacyPortalUrl: optionalTrimmedString({ max: 2048 }),
    exportFormats: optionalStringArray({ maxItemLength: 120 }),
    statusDashboardUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const gdprRetentionPolicySchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    name: optionalTrimmedString({ max: 180 }),
    dataCategories: optionalStringArray({ maxItemLength: 120 }),
    retentionDays: optionalNumber({ min: 1, max: 3650, precision: 0, integer: true }),
    notes: optionalTrimmedString({ max: 1000 }),
    legalBasis: optionalTrimmedString({ max: 180 }),
    appliesTo: optionalStringArray({ maxItemLength: 120 }),
    reviewer: optionalTrimmedString({ max: 180 }),
    autoDelete: optionalBoolean(),
  })
  .strip();

const gdprProcessorSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    name: optionalTrimmedString({ max: 180 }),
    purpose: optionalTrimmedString({ max: 255 }),
    dataCategories: optionalStringArray({ maxItemLength: 120 }),
    dataTransferMechanism: optionalTrimmedString({ max: 180 }),
    region: optionalTrimmedString({ max: 120 }),
    dpaSigned: optionalBoolean(),
    securityReviewDate: optionalTrimmedString({ max: 40 }),
    status: optionalTrimmedString({ max: 120 }),
    contactEmail: optionalTrimmedString({ max: 255 }),
    subprocessor: optionalBoolean(),
  })
  .strip();

const gdprBreachResponseSchema = z
  .object({
    notificationWindowHours: optionalNumber({ min: 1, max: 168, precision: 0, integer: true }),
    onCallContact: optionalTrimmedString({ max: 255 }),
    incidentRunbookUrl: optionalTrimmedString({ max: 2048 }),
    tabletopLastRun: optionalTrimmedString({ max: 40 }),
    tooling: optionalStringArray({ maxItemLength: 120 }),
    legalCounsel: optionalTrimmedString({ max: 255 }),
    communicationsContact: optionalTrimmedString({ max: 255 }),
  })
  .strip();

const gdprConsentFrameworkSchema = z
  .object({
    marketingOptInDefault: optionalBoolean(),
    cookieBannerEnabled: optionalBoolean(),
    cookieRefreshMonths: optionalNumber({ min: 1, max: 36, precision: 0, integer: true }),
    consentLogRetentionDays: optionalNumber({ min: 30, max: 3650, precision: 0, integer: true }),
    withdrawalChannels: optionalStringArray({ maxItemLength: 120 }),
    guardianContactEmail: optionalTrimmedString({ max: 255 }),
    cookiePolicyUrl: optionalTrimmedString({ max: 2048 }),
    preferenceCenterUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

export const gdprSettingsBodySchema = z
  .object({
    dpo: gdprDpoSchema.optional(),
    dataSubjectRequests: gdprDataSubjectRequestsSchema.optional(),
    retentionPolicies: z.array(gdprRetentionPolicySchema).optional(),
    processors: z.array(gdprProcessorSchema).optional(),
    breachResponse: gdprBreachResponseSchema.optional(),
    consentFramework: gdprConsentFrameworkSchema.optional(),
  })
  .strip();

