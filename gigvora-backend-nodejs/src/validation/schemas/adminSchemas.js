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

const ssoSettingsSchema = z
  .object({
    enabled: optionalBoolean(),
    provider: optionalTrimmedString({ max: 120 }),
    entityId: optionalTrimmedString({ max: 255 }),
    entryPoint: optionalTrimmedString({ max: 2048 }),
    certificate: optionalTrimmedString({ max: 8192 }),
  })
  .strip();

const systemGeneralSchema = z
  .object({
    appName: optionalTrimmedString({ max: 120 }),
    companyName: optionalTrimmedString({ max: 160 }),
    supportEmail: optionalTrimmedString({ max: 255 }),
    supportPhone: optionalTrimmedString({ max: 60 }),
    legalEntity: optionalTrimmedString({ max: 255 }),
    timezone: optionalTrimmedString({ max: 120 }),
    defaultLocale: optionalTrimmedString({ max: 16 }),
    logoUrl: optionalTrimmedString({ max: 2048 }),
    incidentContact: optionalTrimmedString({ max: 255 }),
    allowedDomains: optionalStringArray({ maxItemLength: 255 }),
  })
  .strip();

const systemSecuritySchema = z
  .object({
    requireTwoFactor: optionalBoolean(),
    passwordMinimumLength: optionalNumber({ min: 6, max: 128, precision: 0, integer: true }),
    passwordRequireSymbols: optionalBoolean(),
    passwordRotationDays: optionalNumber({ min: 0, max: 365, precision: 0, integer: true }),
    sessionTimeoutMinutes: optionalNumber({ min: 5, max: 1440, precision: 0, integer: true }),
    allowedIpRanges: optionalStringArray({ maxItemLength: 120 }),
    auditLogRetentionDays: optionalNumber({ min: 30, max: 3650, precision: 0, integer: true }),
    sso: ssoSettingsSchema.optional(),
  })
  .strip();

const systemNotificationsSchema = z
  .object({
    emailProvider: optionalTrimmedString({ max: 60 }),
    emailFromName: optionalTrimmedString({ max: 120 }),
    emailFromAddress: optionalTrimmedString({ max: 255 }),
    smsProvider: optionalTrimmedString({ max: 60 }),
    smsFromNumber: optionalTrimmedString({ max: 32 }),
    incidentWebhookUrl: optionalTrimmedString({ max: 2048 }),
    broadcastChannels: optionalStringArray({ maxItemLength: 60 }),
  })
  .strip();

const systemStorageSchema = z
  .object({
    provider: optionalTrimmedString({ max: 120 }),
    bucket: optionalTrimmedString({ max: 255 }),
    region: optionalTrimmedString({ max: 120 }),
    assetCdnUrl: optionalTrimmedString({ max: 2048 }),
    assetMaxSizeMb: optionalNumber({ min: 1, max: 2048, precision: 0, integer: true }),
    backupRetentionDays: optionalNumber({ min: 7, max: 3650, precision: 0, integer: true }),
    encryptionKeyAlias: optionalTrimmedString({ max: 255 }),
  })
  .strip();

const systemIntegrationsSchema = z
  .object({
    slackWebhookUrl: optionalTrimmedString({ max: 2048 }),
    pagerdutyIntegrationKey: optionalTrimmedString({ max: 255 }),
    segmentWriteKey: optionalTrimmedString({ max: 255 }),
    mixpanelToken: optionalTrimmedString({ max: 255 }),
    statusPageUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const maintenanceWindowSchema = z
  .object({
    id: optionalTrimmedString({ max: 160 }),
    title: requiredTrimmedString({ max: 160 }),
    startAt: requiredTrimmedString({ max: 64 }),
    endAt: requiredTrimmedString({ max: 64 }),
    impact: optionalTrimmedString({ max: 255 }),
    description: optionalTrimmedString({ max: 1000 }),
  })
  .strip();

const systemMaintenanceSchema = z
  .object({
    autoBroadcast: optionalBoolean(),
    statusPageUrl: optionalTrimmedString({ max: 2048 }),
    supportChannel: optionalTrimmedString({ max: 255 }),
    upcomingWindows: z.array(maintenanceWindowSchema).optional(),
  })
  .strip();

export const systemSettingsBodySchema = z
  .object({
    general: systemGeneralSchema.optional(),
    security: systemSecuritySchema.optional(),
    notifications: systemNotificationsSchema.optional(),
    storage: systemStorageSchema.optional(),
    integrations: systemIntegrationsSchema.optional(),
    maintenance: systemMaintenanceSchema.optional(),
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

