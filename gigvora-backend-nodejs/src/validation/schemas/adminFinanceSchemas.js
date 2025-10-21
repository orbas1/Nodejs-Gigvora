import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SCHEDULE_TYPES = ['rolling', 'calendar', 'milestone'];
const CADENCE_TYPES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'];
const POLICY_STATUSES = ['draft', 'active', 'paused'];
const ADJUSTMENT_TYPES = ['credit', 'debit', 'fee', 'refund'];
const AUTOPAYOUT_METHODS = ['ach', 'wire', 'card', 'manual'];
const TREASURY_RISK_APPETITES = ['conservative', 'balanced', 'aggressive'];

const optionalEnum = (values, { field }) =>
  optionalTrimmedString({ max: 120 })
    .transform((value) => {
      if (value == null) {
        return undefined;
      }
      return value.trim().toLowerCase();
    })
    .superRefine((value, ctx) => {
      if (value == null) {
        return;
      }
      if (!values.includes(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field} must be one of: ${values.join(', ')}.`,
        });
      }
    });

const optionalCurrency = () =>
  optionalTrimmedString({ max: 3, toUpperCase: true })
    .transform((value) => value ?? undefined)
    .superRefine((value, ctx) => {
      if (value == null) {
        return;
      }
      if (!/^[A-Z]{3}$/u.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'currency must be a valid ISO-4217 code.',
        });
      }
    });

const optionalIsoDate = (field) =>
  optionalTrimmedString({ max: 40 })
    .transform((value) => {
      if (value == null) {
        return undefined;
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toISOString();
    })
    .superRefine((value, ctx) => {
      if (value == null || value === undefined) {
        return;
      }
      if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field} must be a valid ISO-8601 date/time.`,
        });
      }
    });

const optionalInteger = (options = {}) =>
  optionalNumber({ ...options, integer: true, precision: 0 }).transform((value) => value ?? undefined);

const sanitizeNumber = (schema) => schema.transform((value) => value ?? undefined);

export const financeDashboardQuerySchema = z
  .object({
    lookbackDays: optionalInteger({ min: 7, max: 365 }),
  })
  .strip();

export const treasuryPolicyBodySchema = z
  .object({
    policyName: optionalTrimmedString({ max: 160 }),
    defaultCurrency: optionalCurrency(),
    reserveTarget: sanitizeNumber(optionalNumber({ min: 0, precision: 2 })),
    minimumBalanceThreshold: sanitizeNumber(optionalNumber({ min: 0, precision: 2 })),
    autopayoutEnabled: optionalBoolean(),
    autopayoutWindowDays: optionalInteger({ min: 1, max: 90 }),
    autopayoutDayOfWeek: optionalEnum(WEEK_DAYS, { field: 'autopayoutDayOfWeek' }),
    autopayoutTimeOfDay: optionalTrimmedString({ max: 16 }),
    autopayoutMethod: optionalEnum(AUTOPAYOUT_METHODS, { field: 'autopayoutMethod' }),
    invoiceGracePeriodDays: optionalInteger({ min: 0, max: 120 }),
    riskAppetite: optionalEnum(TREASURY_RISK_APPETITES, { field: 'riskAppetite' }),
    notes: optionalTrimmedString({ max: 2000 }),
    operationalContacts: optionalTrimmedString({ max: 255 }),
    status: optionalEnum(POLICY_STATUSES, { field: 'status' }),
    effectiveFrom: optionalIsoDate('effectiveFrom'),
    effectiveTo: optionalIsoDate('effectiveTo'),
  })
  .strip()
  .superRefine((value, ctx) => {
    if (value.effectiveFrom && value.effectiveTo && value.effectiveFrom > value.effectiveTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'effectiveFrom must be before effectiveTo.',
        path: ['effectiveFrom'],
      });
    }
  });

const feeRuleSharedShape = {
  appliesTo: optionalTrimmedString({ max: 64 }).transform((value) => value ?? undefined),
  percentageRate: sanitizeNumber(optionalNumber({ min: 0, max: 100, precision: 3 })),
  flatAmount: sanitizeNumber(optionalNumber({ min: 0, precision: 2 })),
  currency: optionalCurrency(),
  minimumAmount: sanitizeNumber(optionalNumber({ min: 0, precision: 2 })),
  maximumAmount: sanitizeNumber(optionalNumber({ min: 0, precision: 2 })),
  description: optionalTrimmedString({ max: 2000 }),
  tags: optionalStringArray({ maxItemLength: 64, maxLength: 12 }),
  priority: optionalInteger({ min: 0, max: 100 }),
  isActive: optionalBoolean(),
  effectiveFrom: optionalIsoDate('effectiveFrom'),
  effectiveTo: optionalIsoDate('effectiveTo'),
};

const buildFeeRuleSchema = (nameSchema) =>
  z
    .object({
      name: nameSchema,
      ...feeRuleSharedShape,
    })
    .strip();

const applyFeeRuleRefinements = (schema) =>
  schema.superRefine((value, ctx) => {
    if (value.minimumAmount != null && value.maximumAmount != null && value.minimumAmount > value.maximumAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'minimumAmount must be less than or equal to maximumAmount.',
        path: ['minimumAmount'],
      });
    }
    if (value.effectiveFrom && value.effectiveTo && value.effectiveFrom > value.effectiveTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'effectiveFrom must be before effectiveTo.',
        path: ['effectiveFrom'],
      });
    }
  });

export const feeRuleCreateBodySchema = applyFeeRuleRefinements(
  buildFeeRuleSchema(requiredTrimmedString({ max: 160 })),
);

export const feeRuleUpdateBodySchema = applyFeeRuleRefinements(
  buildFeeRuleSchema(optionalTrimmedString({ max: 160 })),
);

const payoutScheduleSharedShape = {
  scheduleType: optionalEnum(SCHEDULE_TYPES, { field: 'scheduleType' }),
  cadence: optionalEnum(CADENCE_TYPES, { field: 'cadence' }),
  dayOfWeek: optionalEnum(WEEK_DAYS, { field: 'dayOfWeek' }),
  dayOfMonth: optionalInteger({ min: 1, max: 31 }),
  leadTimeDays: optionalInteger({ min: 0, max: 30 }),
  payoutWindow: optionalTrimmedString({ max: 64 }),
  status: optionalEnum(POLICY_STATUSES, { field: 'status' }),
  nextRunOn: optionalIsoDate('nextRunOn'),
  autoApprove: optionalBoolean(),
  fundingSource: optionalTrimmedString({ max: 120 }),
  notes: optionalTrimmedString({ max: 2000 }),
};

const buildPayoutScheduleSchema = (nameSchema) =>
  z
    .object({
      name: nameSchema,
      ...payoutScheduleSharedShape,
    })
    .strip();

const applyPayoutScheduleRefinements = (schema) =>
  schema.superRefine((value, ctx) => {
    if (value.dayOfMonth != null && value.cadence && ['daily', 'weekly'].includes(value.cadence)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dayOfMonth is only applicable for monthly cadences.',
        path: ['dayOfMonth'],
      });
    }
  });

export const payoutScheduleCreateBodySchema = applyPayoutScheduleRefinements(
  buildPayoutScheduleSchema(requiredTrimmedString({ max: 160 })),
);

export const payoutScheduleUpdateBodySchema = applyPayoutScheduleRefinements(
  buildPayoutScheduleSchema(optionalTrimmedString({ max: 160 })),
);

export const escrowAdjustmentCreateBodySchema = z
  .object({
    reference: optionalTrimmedString({ max: 64 }),
    adjustmentType: optionalEnum(ADJUSTMENT_TYPES, { field: 'adjustmentType' }),
    amount: sanitizeNumber(optionalNumber({ precision: 2 })),
    currency: optionalCurrency(),
    reason: optionalTrimmedString({ max: 2000 }),
    accountReference: optionalTrimmedString({ max: 120 }),
    status: optionalEnum(POLICY_STATUSES, { field: 'status' }),
    supportingDocumentUrl: optionalTrimmedString({ max: 2048 }),
    notes: optionalTrimmedString({ max: 2000 }),
    effectiveOn: optionalIsoDate('effectiveOn'),
    postedAt: optionalIsoDate('postedAt'),
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
