import { z } from 'zod';
import {
  optionalNumber,
  optionalTrimmedString,
  optionalStringArray,
  optionalBoolean,
} from '../primitives.js';

const positiveInteger = z.preprocess((value) => {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }
  return Math.trunc(numeric);
}, z.number({ invalid_type_error: 'must be a number.' }).int('must be an integer.').min(1));

const nonNegativeAmount = z.preprocess((value) => {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }
  return numeric;
}, z.number({ invalid_type_error: 'must be a number.' }).min(0));

export const escrowOverviewQuerySchema = z
  .object({
    lookbackDays: optionalNumber({ min: 1, max: 365, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    accountStatus: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    accountProvider: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    accountSearch: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    accountPage: optionalNumber({ min: 1, max: 500, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    accountPageSize: optionalNumber({ min: 1, max: 200, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    transactionStatus: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    transactionType: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    transactionReference: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    transactionAccountId: optionalNumber({ min: 1, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    transactionPage: optionalNumber({ min: 1, max: 500, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    transactionPageSize: optionalNumber({ min: 1, max: 200, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    transactionMinAmount: optionalNumber({ min: 0, precision: 2 }).transform(
      (value) => value ?? undefined,
    ),
    transactionMaxAmount: optionalNumber({ min: 0, precision: 2 }).transform(
      (value) => value ?? undefined,
    ),
  })
  .strip();

export const escrowAccountsQuerySchema = z
  .object({
    status: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    provider: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    search: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    page: optionalNumber({ min: 1, max: 500, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    pageSize: optionalNumber({ min: 1, max: 200, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
  })
  .strip();

export const escrowAccountCreateSchema = z
  .object({
    userId: positiveInteger,
    provider: optionalTrimmedString({ max: 80 }).transform((value) => value ?? '').refine(
      (value) => value.length > 0,
      'provider is required.',
    ),
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }).transform(
      (value) => value ?? 'USD',
    ),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const escrowAccountUpdateSchema = z
  .object({
    status: optionalTrimmedString({ max: 60 }),
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }),
    pendingReleaseTotal: optionalNumber({ min: 0, precision: 4 }),
    currentBalance: optionalNumber({ min: 0, precision: 4 }),
    metadata: z.record(z.any()).nullable().optional(),
    lastReconciledAt: optionalTrimmedString({ max: 40 }),
  })
  .strip();

export const escrowTransactionsQuerySchema = z
  .object({
    status: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    type: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    reference: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    accountId: optionalNumber({ min: 1, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    page: optionalNumber({ min: 1, max: 500, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    pageSize: optionalNumber({ min: 1, max: 200, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    minAmount: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    maxAmount: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
  })
  .strip();

export const escrowTransactionUpdateSchema = z
  .object({
    status: optionalTrimmedString({ max: 60 }),
    scheduledReleaseAt: optionalTrimmedString({ max: 40 }).nullable(),
    metadata: z.record(z.any()).nullable().optional(),
    auditTrail: z.array(z.any()).optional(),
  })
  .strip();

export const escrowTransactionActionSchema = z
  .object({
    notes: optionalTrimmedString({ max: 500 }),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const escrowProviderSettingsSchema = z
  .object({
    provider: optionalTrimmedString({ max: 60 }),
    stripe: z
      .object({
        publishableKey: optionalTrimmedString({ max: 255 }),
        secretKey: optionalTrimmedString({ max: 255 }),
        webhookSecret: optionalTrimmedString({ max: 255 }),
        accountId: optionalTrimmedString({ max: 255 }),
      })
      .strip()
      .optional(),
    escrow_com: z
      .object({
        apiKey: optionalTrimmedString({ max: 255 }),
        apiSecret: optionalTrimmedString({ max: 255 }),
        sandbox: optionalBoolean(),
      })
      .strip()
      .optional(),
    escrowControls: z
      .object({
        defaultHoldPeriodHours: optionalNumber({ min: 0, precision: 0, integer: true }),
        autoReleaseHours: optionalNumber({ min: 0, precision: 0, integer: true }),
        requireManualApproval: optionalBoolean(),
        manualApprovalThreshold: optionalNumber({ min: 0, precision: 2 }),
        notificationEmails: optionalStringArray({ maxItemLength: 255 }),
        statementDescriptor: optionalTrimmedString({ max: 160 }),
      })
      .strip()
      .optional(),
  })
  .strip();

export const escrowFeeTierBodySchema = z
  .object({
    provider: optionalTrimmedString({ max: 60 }),
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }),
    minimumAmount: nonNegativeAmount.optional(),
    maximumAmount: nonNegativeAmount.optional(),
    percentFee: nonNegativeAmount.optional(),
    flatFee: nonNegativeAmount.optional(),
    status: optionalTrimmedString({ max: 60 }),
    label: optionalTrimmedString({ max: 160 }),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const escrowReleasePolicyBodySchema = z
  .object({
    name: optionalTrimmedString({ max: 160 }),
    policyType: optionalTrimmedString({ max: 80 }),
    status: optionalTrimmedString({ max: 60 }),
    thresholdAmount: nonNegativeAmount.optional(),
    thresholdHours: positiveInteger.optional(),
    requiresComplianceHold: optionalBoolean(),
    requiresManualApproval: optionalBoolean(),
    notifyEmails: optionalStringArray({ maxItemLength: 255 }),
    description: optionalTrimmedString({ max: 500 }),
    orderIndex: positiveInteger.optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const accountIdParamSchema = z
  .object({
    accountId: positiveInteger,
  })
  .strip();

export const transactionIdParamSchema = z
  .object({
    transactionId: positiveInteger,
  })
  .strip();

export const feeTierIdParamSchema = z
  .object({
    tierId: positiveInteger,
  })
  .strip();

export const releasePolicyIdParamSchema = z
  .object({
    policyId: positiveInteger,
  })
  .strip();
