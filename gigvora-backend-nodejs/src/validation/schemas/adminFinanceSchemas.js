import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

const optionalInteger = (options = {}) =>
  optionalNumber({ ...options, integer: true, precision: 0 }).transform((value) => value ?? undefined);

const optionalCurrency = () => optionalTrimmedString({ max: 3, toUpperCase: true }).transform((value) => value ?? undefined);

const optionalIsoDate = () => optionalTrimmedString({ max: 32 }).transform((value) => value ?? undefined);

export const financeDashboardQuerySchema = z
  .object({
    lookbackDays: optionalInteger({ min: 7, max: 365 }),
  })
  .strip();

export const treasuryPolicyBodySchema = z
  .object({
    policyName: optionalTrimmedString({ max: 160 }),
    defaultCurrency: optionalCurrency(),
    reserveTarget: optionalNumber({ min: 0, precision: 2 }),
    minimumBalanceThreshold: optionalNumber({ min: 0, precision: 2 }),
    autopayoutEnabled: optionalBoolean(),
    autopayoutWindowDays: optionalInteger({ min: 1, max: 90 }),
    autopayoutDayOfWeek: optionalTrimmedString({ max: 16 }),
    autopayoutTimeOfDay: optionalTrimmedString({ max: 16 }),
    invoiceGracePeriodDays: optionalInteger({ min: 0, max: 120 }),
    riskAppetite: optionalTrimmedString({ max: 32 }),
    notes: optionalTrimmedString({ max: 2000 }),
    operationalContacts: optionalTrimmedString({ max: 255 }),
  })
  .strip();

export const feeRuleCreateBodySchema = z
  .object({
    name: requiredTrimmedString({ max: 160 }),
    appliesTo: optionalTrimmedString({ max: 64 }),
    percentageRate: optionalNumber({ min: 0, max: 100, precision: 3 }),
    flatAmount: optionalNumber({ min: 0, precision: 2 }),
    currency: optionalCurrency(),
    minimumAmount: optionalNumber({ min: 0, precision: 2 }),
    maximumAmount: optionalNumber({ min: 0, precision: 2 }),
    description: optionalTrimmedString({ max: 2000 }),
    tags: optionalStringArray({ maxItemLength: 64, maxLength: 12 }),
    priority: optionalInteger({ min: 0, max: 100 }),
    isActive: optionalBoolean(),
    effectiveFrom: optionalIsoDate(),
    effectiveTo: optionalIsoDate(),
  })
  .strip();

export const feeRuleUpdateBodySchema = feeRuleCreateBodySchema
  .extend({
    name: optionalTrimmedString({ max: 160 }),
  })
  .strip();

export const payoutScheduleCreateBodySchema = z
  .object({
    name: requiredTrimmedString({ max: 160 }),
    scheduleType: optionalTrimmedString({ max: 32 }),
    cadence: optionalTrimmedString({ max: 32 }),
    dayOfWeek: optionalTrimmedString({ max: 16 }),
    dayOfMonth: optionalInteger({ min: 1, max: 31 }),
    leadTimeDays: optionalInteger({ min: 0, max: 30 }),
    payoutWindow: optionalTrimmedString({ max: 64 }),
    status: optionalTrimmedString({ max: 32 }),
    nextRunOn: optionalIsoDate(),
    autoApprove: optionalBoolean(),
    fundingSource: optionalTrimmedString({ max: 120 }),
    notes: optionalTrimmedString({ max: 2000 }),
  })
  .strip();

export const payoutScheduleUpdateBodySchema = payoutScheduleCreateBodySchema
  .extend({
    name: optionalTrimmedString({ max: 160 }),
  })
  .strip();

export const escrowAdjustmentCreateBodySchema = z
  .object({
    reference: optionalTrimmedString({ max: 64 }),
    adjustmentType: optionalTrimmedString({ max: 32 }),
    amount: optionalNumber({ precision: 2 }),
    currency: optionalCurrency(),
    reason: optionalTrimmedString({ max: 2000 }),
    accountReference: optionalTrimmedString({ max: 120 }),
    status: optionalTrimmedString({ max: 32 }),
    supportingDocumentUrl: optionalTrimmedString({ max: 2048 }),
    notes: optionalTrimmedString({ max: 2000 }),
    effectiveOn: optionalIsoDate(),
    postedAt: optionalIsoDate(),
    approvedBy: optionalInteger({ min: 1 }),
  })
  .strip();

export const escrowAdjustmentUpdateBodySchema = escrowAdjustmentCreateBodySchema.strip();

const idParam = (param) =>
  z
    .object({
      [param]: z.coerce.number().int().positive(),
    })
    .strip();

export const feeRuleParamsSchema = idParam('feeRuleId');
export const payoutScheduleParamsSchema = idParam('payoutScheduleId');
export const escrowAdjustmentParamsSchema = idParam('adjustmentId');

export default {
  financeDashboardQuerySchema,
  treasuryPolicyBodySchema,
  feeRuleCreateBodySchema,
  feeRuleUpdateBodySchema,
  payoutScheduleCreateBodySchema,
  payoutScheduleUpdateBodySchema,
  escrowAdjustmentCreateBodySchema,
  escrowAdjustmentUpdateBodySchema,
  feeRuleParamsSchema,
  payoutScheduleParamsSchema,
  escrowAdjustmentParamsSchema,
};
