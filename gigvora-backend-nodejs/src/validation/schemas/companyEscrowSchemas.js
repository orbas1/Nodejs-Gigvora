import { z } from 'zod';

import { ESCROW_ACCOUNT_STATUSES, ESCROW_TRANSACTION_TYPES } from '../../models/index.js';
import { optionalBoolean, optionalNumber, optionalTrimmedString } from '../primitives.js';

const workspaceSelector = z
  .object({
    workspaceId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    workspaceSlug: optionalTrimmedString({ max: 160 }).transform((value) => (value ? value.toLowerCase() : undefined)),
  })
  .refine((value) => value.workspaceId != null || value.workspaceSlug != null, {
    message: 'workspaceId or workspaceSlug is required.',
    path: ['workspaceId'],
  });

const optionalIsoDateTime = optionalTrimmedString({ max: 80 }).transform((value, ctx) => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid ISO-8601 date string.' });
    return z.NEVER;
  }
  return date.toISOString();
});

export const companyEscrowOverviewQuerySchema = workspaceSelector
  .extend({
    lookbackDays: optionalNumber({ min: 7, max: 180, integer: true }).transform((value) => value ?? undefined),
    forceRefresh: optionalBoolean().transform((value) => value ?? false),
  })
  .strip();

export const companyEscrowAccountCreateSchema = workspaceSelector
  .extend({
    userId: optionalNumber({ min: 1, integer: true }).superRefine((value, ctx) => {
      if (value == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'userId is required.' });
      }
    }),
    provider: optionalTrimmedString({ max: 80 }).superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'provider is required.' });
      }
    }),
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }),
    label: optionalTrimmedString({ max: 180 }),
    notes: optionalTrimmedString({ max: 500 }),
    logoUrl: optionalTrimmedString({ max: 500 }),
    metadata: z.record(z.any()).optional(),
    status: optionalTrimmedString({ max: 40 }),
  })
  .transform((value) => ({ ...value, status: value.status ? value.status.toLowerCase() : undefined }))
  .strip();

export const companyEscrowAccountUpdateSchema = workspaceSelector
  .extend({
    status: optionalTrimmedString({ max: 40 }).transform((value) => (value ? value.toLowerCase() : undefined)),
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }),
    label: optionalTrimmedString({ max: 180 }),
    notes: optionalTrimmedString({ max: 500 }),
    logoUrl: optionalTrimmedString({ max: 500 }),
    metadata: z.record(z.any()).optional(),
  })
  .strip()
  .superRefine((value, ctx) => {
    if (value.status && !ESCROW_ACCOUNT_STATUSES.includes(value.status)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `status must be one of: ${ESCROW_ACCOUNT_STATUSES.join(', ')}.` });
    }
  });

const positiveId = (fieldName) =>
  z.any().transform((value, ctx) => {
    if (value == null || value === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} is required.` });
      return z.NEVER;
    }
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a positive integer.` });
      return z.NEVER;
    }
    return numeric;
  });

export const companyEscrowAccountParamsSchema = z
  .object({
    accountId: positiveId('accountId'),
  })
  .strip();

const transactionBaseSchema = workspaceSelector.extend({
  accountId: optionalNumber({ min: 1, integer: true }).superRefine((value, ctx) => {
    if (value == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'accountId is required.' });
    }
  }),
  reference: optionalTrimmedString({ max: 120 }).superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'reference is required.' });
    }
  }),
  amount: optionalNumber({ min: 0.01 }).superRefine((value, ctx) => {
    if (value == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'amount is required.' });
    }
  }),
  feeAmount: optionalNumber({ min: 0 }).transform((value) => value ?? 0),
  currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }),
  type: optionalTrimmedString({ max: 40 }).transform((value) => (value ? value.toLowerCase() : undefined)),
  counterpartyId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
  projectId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
  gigId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
  milestoneLabel: optionalTrimmedString({ max: 180 }),
  scheduledReleaseAt: optionalIsoDateTime,
  metadata: z.record(z.any()).optional(),
  actorId: optionalNumber({ min: 1, integer: true }),
});

export const companyEscrowTransactionCreateSchema = transactionBaseSchema
  .superRefine((value, ctx) => {
    if (value.type && !ESCROW_TRANSACTION_TYPES.includes(value.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `type must be one of: ${ESCROW_TRANSACTION_TYPES.join(', ')}.`,
      });
    }
    if (value.actorId == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'actorId is required.' });
    }
  })
  .strip();

export const companyEscrowTransactionParamsSchema = z
  .object({
    transactionId: positiveId('transactionId'),
  })
  .strip();

export const companyEscrowTransactionActionBodySchema = workspaceSelector
  .extend({
    actorId: optionalNumber({ min: 1, integer: true }).superRefine((value, ctx) => {
      if (value == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'actorId is required.' });
      }
    }),
    notes: optionalTrimmedString({ max: 500 }),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const companyEscrowAutomationUpdateSchema = workspaceSelector
  .extend({
    autoReleaseEnabled: optionalBoolean(),
    manualReviewThreshold: optionalNumber({ min: 0 }),
    notifyFinanceTeam: optionalBoolean(),
    defaultReleaseOffsetHours: optionalNumber({ min: 0, max: 240, integer: true }),
    releasePolicy: optionalTrimmedString({ max: 60 }),
    webhookUrl: optionalTrimmedString({ max: 500 }),
    actorId: optionalNumber({ min: 1, integer: true }),
  })
  .strip();

export default {
  companyEscrowOverviewQuerySchema,
  companyEscrowAccountCreateSchema,
  companyEscrowAccountUpdateSchema,
  companyEscrowAccountParamsSchema,
  companyEscrowTransactionCreateSchema,
  companyEscrowTransactionParamsSchema,
  companyEscrowTransactionActionBodySchema,
  companyEscrowAutomationUpdateSchema,
};
