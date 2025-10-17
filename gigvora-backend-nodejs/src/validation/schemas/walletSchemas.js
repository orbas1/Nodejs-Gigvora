import { z } from 'zod';
import {
  WALLET_FUNDING_SOURCE_TYPES,
  WALLET_FUNDING_SOURCE_STATUSES,
  WALLET_TRANSFER_RULE_CADENCES,
  WALLET_TRANSFER_RULE_STATUSES,
  WALLET_TRANSFER_TYPES,
  WALLET_TRANSFER_STATUSES,
} from '../../models/constants/index.js';
import { optionalBoolean, optionalNumber, optionalTrimmedString } from '../primitives.js';

function parseId(value, ctx, { fieldName }) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a positive integer.` });
    return z.NEVER;
  }
  return numeric;
}

const fundingSourceTypeEnum = z.enum(WALLET_FUNDING_SOURCE_TYPES);
const fundingSourceStatusEnum = z.enum(WALLET_FUNDING_SOURCE_STATUSES);
const transferRuleCadenceEnum = z.enum(WALLET_TRANSFER_RULE_CADENCES);
const transferRuleStatusEnum = z.enum(WALLET_TRANSFER_RULE_STATUSES);
const transferTypeEnum = z.enum(WALLET_TRANSFER_TYPES);
const transferStatusEnum = z.enum(WALLET_TRANSFER_STATUSES);

export const walletOverviewQuerySchema = z
  .object({
    refresh: optionalBoolean(),
  })
  .strip();

export const walletFundingSourceParamsSchema = z
  .object({
    fundingSourceId: z.any().transform((value, ctx) => parseId(value, ctx, { fieldName: 'fundingSourceId' })),
  })
  .strip();

export const walletTransferRuleParamsSchema = z
  .object({
    ruleId: z.any().transform((value, ctx) => parseId(value, ctx, { fieldName: 'ruleId' })),
  })
  .strip();

export const walletTransferRequestParamsSchema = z
  .object({
    transferId: z.any().transform((value, ctx) => parseId(value, ctx, { fieldName: 'transferId' })),
  })
  .strip();

export const walletFundingSourceCreateSchema = z
  .object({
    walletAccountId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    type: optionalTrimmedString({ max: 60 })
      .transform((value) => value ?? undefined)
      .pipe(fundingSourceTypeEnum.optional()),
    label: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    status: optionalTrimmedString({ max: 60 })
      .transform((value) => value ?? undefined)
      .pipe(fundingSourceStatusEnum.optional()),
    provider: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    lastFour: optionalTrimmedString({ max: 8 }).transform((value) => value ?? undefined),
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }).transform((value) => value ?? undefined),
    makePrimary: optionalBoolean().transform((value) => value ?? false),
    connectedAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const walletFundingSourceUpdateSchema = z
  .object({
    label: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    status: optionalTrimmedString({ max: 60 })
      .transform((value) => value ?? undefined)
      .pipe(fundingSourceStatusEnum.optional()),
    provider: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    lastFour: optionalTrimmedString({ max: 8 }).transform((value) => value ?? undefined),
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }).transform((value) => value ?? undefined),
    makePrimary: optionalBoolean(),
    disable: optionalBoolean(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const walletTransferRuleCreateSchema = z
  .object({
    walletAccountId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    fundingSourceId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    name: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    transferType: optionalTrimmedString({ max: 60 })
      .transform((value) => value ?? undefined)
      .pipe(transferTypeEnum.optional()),
    cadence: optionalTrimmedString({ max: 40 })
      .transform((value) => value ?? undefined)
      .pipe(transferRuleCadenceEnum.optional()),
    status: optionalTrimmedString({ max: 40 })
      .transform((value) => value ?? undefined)
      .pipe(transferRuleStatusEnum.optional()),
    thresholdAmount: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    thresholdCurrency: optionalTrimmedString({ max: 3, toUpperCase: true }).transform((value) => value ?? undefined),
    executionDay: optionalNumber({ min: 1, max: 31, integer: true }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const walletTransferRuleUpdateSchema = z
  .object({
    name: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    transferType: optionalTrimmedString({ max: 60 })
      .transform((value) => value ?? undefined)
      .pipe(transferTypeEnum.optional()),
    cadence: optionalTrimmedString({ max: 40 })
      .transform((value) => value ?? undefined)
      .pipe(transferRuleCadenceEnum.optional()),
    status: optionalTrimmedString({ max: 40 })
      .transform((value) => value ?? undefined)
      .pipe(transferRuleStatusEnum.optional()),
    thresholdAmount: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    thresholdCurrency: optionalTrimmedString({ max: 3, toUpperCase: true }).transform((value) => value ?? undefined),
    executionDay: optionalNumber({ min: 1, max: 31, integer: true })
      .transform((value) => (value === undefined ? undefined : value))
      .or(z.null())
      .optional(),
    fundingSourceId: optionalNumber({ min: 1, integer: true })
      .transform((value) => (value === undefined ? undefined : value))
      .or(z.null())
      .optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const walletTransferRequestCreateSchema = z
  .object({
    walletAccountId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    fundingSourceId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    amount: z.preprocess((value) => (value == null ? value : Number(value)), z.number().positive()),
    currencyCode: optionalTrimmedString({ max: 3, toUpperCase: true }).transform((value) => value ?? undefined),
    transferType: optionalTrimmedString({ max: 40 })
      .transform((value) => value ?? undefined)
      .pipe(transferTypeEnum.optional()),
    scheduledAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const walletTransferRequestUpdateSchema = z
  .object({
    status: optionalTrimmedString({ max: 40 })
      .transform((value) => value ?? undefined)
      .pipe(transferStatusEnum.optional()),
    notes: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    scheduledAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined).or(z.null()).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export default {
  walletOverviewQuerySchema,
  walletFundingSourceParamsSchema,
  walletTransferRuleParamsSchema,
  walletTransferRequestParamsSchema,
  walletFundingSourceCreateSchema,
  walletFundingSourceUpdateSchema,
  walletTransferRuleCreateSchema,
  walletTransferRuleUpdateSchema,
  walletTransferRequestCreateSchema,
  walletTransferRequestUpdateSchema,
};
