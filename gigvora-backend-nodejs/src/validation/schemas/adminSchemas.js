import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';
import {
  WALLET_ACCOUNT_STATUSES,
  WALLET_ACCOUNT_TYPES,
  ESCROW_INTEGRATION_PROVIDERS,
  WALLET_LEDGER_ENTRY_TYPES,
} from '../../models/constants/index.js';

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

const optionalMetadataSchema = z
  .union([z.record(z.any()), z.undefined()])
  .refine((value) => value === undefined || value === null || !Array.isArray(value), {
    message: 'metadata must be an object.',
  })
  .transform((value) => (value === undefined ? undefined : value ?? null));

const walletAccountFilterBaseSchema = z
  .object({
    page: optionalNumber({ min: 1, max: 500, precision: 0, integer: true }),
    pageSize: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }),
    status: optionalTrimmedString({ max: 40, toLowerCase: true }).refine(
      (value) => value == null || WALLET_ACCOUNT_STATUSES.includes(value),
      { message: `status must be one of: ${WALLET_ACCOUNT_STATUSES.join(', ')}.` },
    ),
    accountType: optionalTrimmedString({ max: 40, toLowerCase: true }).refine(
      (value) => value == null || WALLET_ACCOUNT_TYPES.includes(value),
      { message: `accountType must be one of: ${WALLET_ACCOUNT_TYPES.join(', ')}.` },
    ),
    custodyProvider: optionalTrimmedString({ max: 60, toLowerCase: true }).refine(
      (value) => value == null || ESCROW_INTEGRATION_PROVIDERS.includes(value),
      {
        message: `custodyProvider must be one of: ${ESCROW_INTEGRATION_PROVIDERS.join(', ')}.`,
      },
    ),
    currency: optionalTrimmedString({ max: 3, toUpperCase: true }),
    userId: optionalNumber({ min: 1, precision: 0, integer: true }),
    profileId: optionalNumber({ min: 1, precision: 0, integer: true }),
    search: optionalTrimmedString({ max: 160 }),
    sort: optionalTrimmedString({ max: 40, toLowerCase: true }),
  })
  .strip();

export const walletAccountListQuerySchema = walletAccountFilterBaseSchema.transform((value) => ({
  ...value,
  page: value.page ?? 1,
  pageSize: value.pageSize ?? 25,
}));

export const walletAccountCreateSchema = z
  .object({
    userId: optionalNumber({ min: 1, precision: 0, integer: true }),
    profileId: optionalNumber({ min: 1, precision: 0, integer: true }),
    accountType: requiredTrimmedString({ max: 40, toLowerCase: true }),
    custodyProvider: optionalTrimmedString({ max: 60, toLowerCase: true }),
    status: optionalTrimmedString({ max: 40, toLowerCase: true }),
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }),
    providerAccountId: optionalTrimmedString({ max: 160 }),
    metadata: optionalMetadataSchema,
    lastReconciledAt: optionalTrimmedString({ max: 40 }),
  })
  .strip()
  .superRefine((value, ctx) => {
    if (!value.userId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['userId'], message: 'userId is required.' });
    }
    if (!value.profileId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['profileId'], message: 'profileId is required.' });
    }
    if (!WALLET_ACCOUNT_TYPES.includes(value.accountType)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['accountType'], message: 'Invalid accountType.' });
    }
    if (value.status && !WALLET_ACCOUNT_STATUSES.includes(value.status)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['status'], message: 'Invalid status.' });
    }
    if (value.custodyProvider && !ESCROW_INTEGRATION_PROVIDERS.includes(value.custodyProvider)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['custodyProvider'], message: 'Invalid custodyProvider.' });
    }
  });

export const walletAccountUpdateSchema = z
  .object({
    status: optionalTrimmedString({ max: 40, toLowerCase: true }).refine(
      (value) => value == null || WALLET_ACCOUNT_STATUSES.includes(value),
      { message: 'Invalid status.' },
    ),
    custodyProvider: optionalTrimmedString({ max: 60, toLowerCase: true }).refine(
      (value) => value == null || ESCROW_INTEGRATION_PROVIDERS.includes(value),
      { message: 'Invalid custodyProvider.' },
    ),
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }),
    providerAccountId: optionalTrimmedString({ max: 160 }),
    metadata: optionalMetadataSchema,
    lastReconciledAt: optionalTrimmedString({ max: 40 }),
  })
  .strip();

const positiveAmountSchema = z.preprocess((value) => {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return Number.NaN;
  }
  return Math.round(numeric * 10000) / 10000;
}, z.number().gt(0, { message: 'amount must be greater than zero.' }));

export const walletLedgerEntryCreateSchema = z
  .object({
    entryType: requiredTrimmedString({ max: 40, toLowerCase: true }).refine(
      (value) => WALLET_LEDGER_ENTRY_TYPES.includes(value),
      { message: `entryType must be one of: ${WALLET_LEDGER_ENTRY_TYPES.join(', ')}.` },
    ),
    amount: positiveAmountSchema,
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }),
    reference: optionalTrimmedString({ max: 160 }),
    externalReference: optionalTrimmedString({ max: 160 }),
    description: optionalTrimmedString({ max: 500 }),
    occurredAt: optionalTrimmedString({ max: 40 }),
    metadata: optionalMetadataSchema,
    initiatedById: optionalNumber({ min: 1, precision: 0, integer: true }),
  })
  .strip();

export const walletLedgerQuerySchema = z
  .object({
    page: optionalNumber({ min: 1, max: 500, precision: 0, integer: true }),
    pageSize: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }),
    entryType: optionalTrimmedString({ max: 40, toLowerCase: true }).refine(
      (value) => value == null || WALLET_LEDGER_ENTRY_TYPES.includes(value),
      { message: 'Invalid entryType.' },
    ),
    search: optionalTrimmedString({ max: 160 }),
    startDate: optionalTrimmedString({ max: 40 }),
    endDate: optionalTrimmedString({ max: 40 }),
  })
  .strip()
  .transform((value) => ({
    ...value,
    page: value.page ?? 1,
    pageSize: value.pageSize ?? 25,
  }));

