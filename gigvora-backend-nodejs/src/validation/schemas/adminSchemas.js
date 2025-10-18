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

const pageNavigationLinkSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    label: requiredTrimmedString({ max: 80 }),
    url: requiredTrimmedString({ max: 2048 }),
    external: optionalBoolean(),
  })
  .strip();

const pageHeroSchema = z
  .object({
    title: optionalTrimmedString({ max: 200 }),
    subtitle: optionalTrimmedString({ max: 480 }),
    badge: optionalTrimmedString({ max: 80 }),
    mediaType: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    mediaUrl: optionalTrimmedString({ max: 2048 }),
    backgroundImageUrl: optionalTrimmedString({ max: 2048 }),
    accentColor: optionalTrimmedString({ max: 20 }),
    alignment: optionalTrimmedString({ max: 16 }).transform((value) => value?.toLowerCase()),
  })
  .strip();

const pageSeoSchema = z
  .object({
    title: optionalTrimmedString({ max: 200 }),
    description: optionalTrimmedString({ max: 320 }),
    keywords: optionalStringArray({ maxItemLength: 50 }),
  })
  .strip();

const pageCtaSchema = z
  .object({
    label: optionalTrimmedString({ max: 80 }),
    url: optionalTrimmedString({ max: 2048 }),
    external: optionalBoolean(),
  })
  .strip();

const pageSectionSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    title: requiredTrimmedString({ max: 160 }),
    type: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    enabled: optionalBoolean(),
    summary: optionalTrimmedString({ max: 600 }),
    media: z
      .object({
        type: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
        url: optionalTrimmedString({ max: 2048 }),
        altText: optionalTrimmedString({ max: 255 }),
      })
      .strip()
      .optional(),
    cta: pageCtaSchema.optional(),
    order: optionalNumber({ min: 0, max: 999, precision: 0, integer: true }),
  })
  .strip();

export const pageSettingsBodySchema = z
  .object({
    name: requiredTrimmedString({ max: 160 }),
    slug: optionalTrimmedString({ max: 180 }),
    description: optionalTrimmedString({ max: 480 }),
    status: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    visibility: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    layout: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    hero: pageHeroSchema.optional(),
    seo: pageSeoSchema.optional(),
    callToAction: z
      .object({
        primary: pageCtaSchema.optional(),
        secondary: pageCtaSchema.optional(),
      })
      .strip()
      .optional(),
    navigation: z
      .object({
        header: z.array(pageNavigationLinkSchema).optional(),
        footer: z.array(pageNavigationLinkSchema).optional(),
      })
      .strip()
      .optional(),
    sections: z.array(pageSectionSchema).optional(),
    theme: z
      .object({
        accent: optionalTrimmedString({ max: 20 }),
        background: optionalTrimmedString({ max: 20 }),
        text: optionalTrimmedString({ max: 20 }),
      })
      .strip()
      .optional(),
    allowedRoles: optionalStringArray({ maxItemLength: 60 }),
    media: z.record(z.any()).optional(),
  })
  .strip();

export const pageSettingsQuerySchema = z
  .object({
    limit: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }),
    offset: optionalNumber({ min: 0, max: 10_000, precision: 0, integer: true }),
  })
  .strip();

export const pageSettingsParamsSchema = z
  .object({
    pageId: requiredTrimmedString({ max: 180 }),
  })
  .strip();

