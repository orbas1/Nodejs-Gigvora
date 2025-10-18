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

const seoMetaTagSchema = z
  .object({
    attribute: optionalTrimmedString({ max: 20 })
      .transform((value) => value?.toLowerCase())
      .refine((value) => !value || value === 'name' || value === 'property', {
        message: 'attribute must be "name" or "property".',
      }),
    key: requiredTrimmedString({ max: 120 }),
    value: requiredTrimmedString({ max: 500 }),
  })
  .strip();

const seoVerificationSchema = z
  .object({
    google: optionalTrimmedString({ max: 255 }),
    bing: optionalTrimmedString({ max: 255 }),
    yandex: optionalTrimmedString({ max: 255 }),
    pinterest: optionalTrimmedString({ max: 255 }),
    baidu: optionalTrimmedString({ max: 255 }),
  })
  .strip();

const seoSocialDefaultsSchema = z
  .object({
    ogTitle: optionalTrimmedString({ max: 180 }),
    ogDescription: optionalTrimmedString({ max: 5000 }),
    ogImageUrl: optionalTrimmedString({ max: 2048 }),
    ogImageAlt: optionalTrimmedString({ max: 255 }),
    twitterHandle: optionalTrimmedString({ max: 80 }),
    twitterTitle: optionalTrimmedString({ max: 180 }),
    twitterDescription: optionalTrimmedString({ max: 5000 }),
    twitterCardType: optionalTrimmedString({ max: 64 }).transform((value) => value?.toLowerCase()),
    twitterImageUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const seoOrganizationSchema = z
  .object({
    name: optionalTrimmedString({ max: 255 }),
    url: optionalTrimmedString({ max: 2048 }),
    logoUrl: optionalTrimmedString({ max: 2048 }),
    contactEmail: optionalTrimmedString({ max: 255 }),
    sameAs: optionalStringArray({ maxItemLength: 2048, maxLength: 50 }).optional(),
  })
  .strip();

const structuredDataJsonSchema = z.union([z.record(z.any()), z.array(z.any())]);

const seoStructuredDataSchema = z
  .object({
    organization: seoOrganizationSchema.optional(),
    customJson: structuredDataJsonSchema.optional(),
  })
  .strip();

const seoOverrideSchema = z
  .object({
    id: optionalNumber({ min: 1, precision: 0, integer: true }),
    path: requiredTrimmedString({ max: 255 }),
    title: optionalTrimmedString({ max: 180 }),
    description: optionalTrimmedString({ max: 5000 }),
    keywords: optionalStringArray({ maxItemLength: 120, maxLength: 64 }),
    canonicalUrl: optionalTrimmedString({ max: 2048 }),
    ogTitle: optionalTrimmedString({ max: 180 }),
    ogDescription: optionalTrimmedString({ max: 5000 }),
    ogImageUrl: optionalTrimmedString({ max: 2048 }),
    ogImageAlt: optionalTrimmedString({ max: 255 }),
    twitterTitle: optionalTrimmedString({ max: 180 }),
    twitterDescription: optionalTrimmedString({ max: 5000 }),
    twitterCardType: optionalTrimmedString({ max: 64 }).transform((value) => value?.toLowerCase()),
    twitterImageUrl: optionalTrimmedString({ max: 2048 }),
    twitterHandle: optionalTrimmedString({ max: 80 }),
    metaTags: z.array(seoMetaTagSchema).optional(),
    structuredData: seoStructuredDataSchema.optional(),
    noindex: optionalBoolean(),
  })
  .strip();

export const seoSettingsBodySchema = z
  .object({
    siteName: requiredTrimmedString({ max: 180 }),
    defaultTitle: optionalTrimmedString({ max: 180 }),
    defaultDescription: optionalTrimmedString({ max: 5000 }),
    defaultKeywords: optionalStringArray({ maxItemLength: 120, maxLength: 64 }),
    canonicalBaseUrl: optionalTrimmedString({ max: 2048 }),
    sitemapUrl: optionalTrimmedString({ max: 2048 }),
    allowIndexing: optionalBoolean(),
    robotsPolicy: optionalTrimmedString({ max: 12000 }),
    noindexPaths: optionalStringArray({ maxItemLength: 2048, maxLength: 200 }),
    verificationCodes: seoVerificationSchema.optional(),
    socialDefaults: seoSocialDefaultsSchema.optional(),
    structuredData: seoStructuredDataSchema.optional(),
    pageOverrides: z.array(seoOverrideSchema).optional(),
  })
  .strip();

