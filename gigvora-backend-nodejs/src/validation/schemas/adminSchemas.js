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

const homepageStatSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    label: optionalTrimmedString({ max: 120 }),
    value: optionalNumber({ min: 0, max: 1_000_000_000, precision: 2 }),
    suffix: optionalTrimmedString({ max: 16 }),
  })
  .strip();

const homepageValuePropSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    title: optionalTrimmedString({ max: 160 }),
    description: optionalTrimmedString({ max: 320 }),
    icon: optionalTrimmedString({ max: 120 }),
    ctaLabel: optionalTrimmedString({ max: 120 }),
    ctaHref: optionalTrimmedString({ max: 2048 }),
    mediaUrl: optionalTrimmedString({ max: 2048 }),
    mediaAlt: optionalTrimmedString({ max: 255 }),
  })
  .strip();

const homepageBulletSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    text: optionalTrimmedString({ max: 280 }),
  })
  .strip();

const homepageFeatureSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    title: optionalTrimmedString({ max: 160 }),
    description: optionalTrimmedString({ max: 320 }),
    mediaType: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    mediaUrl: optionalTrimmedString({ max: 2048 }),
    mediaAlt: optionalTrimmedString({ max: 255 }),
    bullets: z.array(homepageBulletSchema).optional(),
  })
  .strip();

const homepageTestimonialSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    quote: optionalTrimmedString({ max: 500 }),
    authorName: optionalTrimmedString({ max: 160 }),
    authorRole: optionalTrimmedString({ max: 160 }),
    avatarUrl: optionalTrimmedString({ max: 2048 }),
    highlight: optionalBoolean(),
  })
  .strip();

const homepageFaqSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    question: optionalTrimmedString({ max: 240 }),
    answer: optionalTrimmedString({ max: 1000 }),
  })
  .strip();

const homepageQuickLinkSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    label: optionalTrimmedString({ max: 120 }),
    href: optionalTrimmedString({ max: 2048 }),
    target: optionalTrimmedString({ max: 16 }).transform((value) => value?.toLowerCase()),
  })
  .strip();

const homepageSeoSchema = z
  .object({
    title: optionalTrimmedString({ max: 160 }),
    description: optionalTrimmedString({ max: 320 }),
    keywords: optionalStringArray({ maxItemLength: 60 }),
    ogImageUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const homepageAnnouncementSchema = z
  .object({
    enabled: optionalBoolean(),
    message: optionalTrimmedString({ max: 240 }),
    ctaLabel: optionalTrimmedString({ max: 120 }),
    ctaHref: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

export const homepageSettingsBodySchema = z
  .object({
    announcementBar: homepageAnnouncementSchema.optional(),
    hero: z
      .object({
        title: optionalTrimmedString({ max: 160 }),
        subtitle: optionalTrimmedString({ max: 320 }),
        primaryCtaLabel: optionalTrimmedString({ max: 120 }),
        primaryCtaHref: optionalTrimmedString({ max: 2048 }),
        secondaryCtaLabel: optionalTrimmedString({ max: 120 }),
        secondaryCtaHref: optionalTrimmedString({ max: 2048 }),
        backgroundImageUrl: optionalTrimmedString({ max: 2048 }),
        backgroundImageAlt: optionalTrimmedString({ max: 255 }),
        overlayOpacity: optionalNumber({ min: 0, max: 1, precision: 2 }),
        stats: z.array(homepageStatSchema).optional(),
      })
      .strip()
      .optional(),
    valueProps: z.array(homepageValuePropSchema).max(6).optional(),
    featureSections: z.array(homepageFeatureSchema).max(6).optional(),
    testimonials: z.array(homepageTestimonialSchema).max(8).optional(),
    faqs: z.array(homepageFaqSchema).max(12).optional(),
    quickLinks: z.array(homepageQuickLinkSchema).max(10).optional(),
    seo: homepageSeoSchema.optional(),
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
    homepage: homepageSettingsBodySchema.optional(),
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

