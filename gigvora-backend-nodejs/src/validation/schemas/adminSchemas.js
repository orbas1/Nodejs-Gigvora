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

const escrowControlSettingsSchema = z
  .object({
    defaultHoldPeriodHours: optionalNumber({ min: 0, precision: 0, integer: true }),
    autoReleaseHours: optionalNumber({ min: 0, precision: 0, integer: true }),
    requireManualApproval: optionalBoolean(),
    manualApprovalThreshold: optionalNumber({ min: 0, precision: 2 }),
    notificationEmails: optionalStringArray({ maxItemLength: 255 }),
    statementDescriptor: optionalTrimmedString({ max: 160 }),
  })
  .strip();

const paymentSettingsSchema = z
  .object({
    provider: optionalTrimmedString({ max: 50 }),
    stripe: stripeSettingsSchema.optional(),
    escrow_com: escrowSettingsSchema.optional(),
    escrowControls: escrowControlSettingsSchema.optional(),
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

