import { z } from 'zod';
import { optionalBoolean, optionalNumber, optionalTrimmedString } from '../primitives.js';

function toPositiveInteger(value, ctx, { fieldName }) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a positive integer.` });
    return z.NEVER;
  }
  return numeric;
}

function validateDateString(value, ctx, { fieldName }) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be an ISO-8601 date string.` });
    return z.NEVER;
  }
  return parsed.toISOString();
}

export const financeOverviewQuerySchema = z
  .object({
    userId: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    dateFrom: optionalTrimmedString({ max: 30 })
      .transform((value) => value ?? undefined)
      .transform((value, ctx) => validateDateString(value, ctx, { fieldName: 'dateFrom' })),
    dateTo: optionalTrimmedString({ max: 30 })
      .transform((value) => value ?? undefined)
      .transform((value, ctx) => validateDateString(value, ctx, { fieldName: 'dateTo' })),
    refresh: optionalBoolean().transform((value) => (value == null ? false : value)),
  })
  .strip();

export const financeFreelancerParamsSchema = z
  .object({
    freelancerId: z
      .any()
      .transform((value, ctx) => toPositiveInteger(value, ctx, { fieldName: 'freelancerId' })),
  })
  .strip();

export default {
  financeOverviewQuerySchema,
  financeFreelancerParamsSchema,
};
